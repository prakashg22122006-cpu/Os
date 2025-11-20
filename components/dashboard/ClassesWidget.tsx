
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import { Class } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
};

const TimelineEvent: React.FC<{ event: Class; onEdit: () => void; startHour: number; endHour: number }> = ({ event, onEdit, startHour, endHour }) => {
    const totalMinutes = (endHour - startHour) * 60;
    
    const startTime = timeToMinutes(event.time);
    const endTime = event.endTime ? timeToMinutes(event.endTime) : startTime + 60; // Default 1 hour
    
    const top = ((startTime - startHour * 60) / totalMinutes) * 100;
    const height = ((endTime - startTime) / totalMinutes) * 100;

    if (top < 0 || top > 100) return null;

    const displayColor = event.color || 'var(--accent-color)';

    return (
        <div
            className="absolute w-full px-2 py-1 rounded-lg text-white overflow-hidden cursor-pointer"
            style={{ 
                top: `${top}%`, 
                height: `${height}%`,
                backgroundColor: `${displayColor}33`, // with opacity
                borderLeft: `4px solid ${displayColor}`,
            }}
            onClick={onEdit}
        >
            <p className="font-bold text-xs truncate">{event.name}</p>
            <p className="text-[10px] opacity-80 truncate">{formatTimeForDisplay(event.time)} - {event.endTime ? formatTimeForDisplay(event.endTime) : ''}</p>
            <p className="text-[10px] opacity-80 truncate">{event.location}</p>
        </div>
    );
};


const ClassesWidget: React.FC = () => {
    const { classes, setClasses, setViewingScheduleItem, appSettings } = useAppContext();
    const importFileRef = useRef<HTMLInputElement>(null);

    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => a.time.localeCompare(b.time));
    }, [classes]);

    const handleEdit = (item: Class) => {
        setViewingScheduleItem(item);
    };

    const handleAddNew = () => {
        setViewingScheduleItem({} as Class); // Open modal with empty object
    };
    
    const exportToJSON = () => {
        const dataStr = JSON.stringify(classes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "schedule.json";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };
    
    const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (Array.isArray(data)) {
                    setClasses(data);
                    alert('Schedule imported successfully!');
                } else { throw new Error("Invalid format"); }
            } catch (error) { alert("Failed to import schedule from JSON."); }
        };
        reader.readAsText(file);
    };

    const exportToICS = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        const todayStr = `${y}${m}${d}`;

        let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StudyOS//EN\n`;
        classes.forEach(c => {
            const [sh, sm] = c.time.split(':');
            const [eh, em] = c.endTime?.split(':') || [String(parseInt(sh) + 1), sm];
            const startTime = `T${sh}${sm}00`;
            const endTime = `T${eh}${em}00`;
            const description = c.note_richtext ? c.note_richtext.replace(/<[^>]+>/g, '') : '';

            icsContent += `BEGIN:VEVENT\n`;
            icsContent += `UID:${c.ts}@studyos.app\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z\n`;
            icsContent += `DTSTART;TZID=America/New_York:${todayStr}${startTime}\n`;
            icsContent += `DTEND;TZID=America/New_York:${todayStr}${endTime}\n`;
            icsContent += `SUMMARY:${c.name}\n`;
            icsContent += `LOCATION:${c.location}\n`;
            icsContent += `DESCRIPTION:${description}\n`;
            icsContent += `END:VEVENT\n`;
        });
        icsContent += `END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "today-schedule.ics";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };
    
    const importFromICS = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const events = content.split('BEGIN:VEVENT').slice(1).map(eventStr => {
                    const summaryMatch = eventStr.match(/SUMMARY:(.*)/);
                    const dtstartMatch = eventStr.match(/DTSTART(?:;.*)?:(.*)/);
                    const dtendMatch = eventStr.match(/DTEND(?:;.*)?:(.*)/);
                    const locationMatch = eventStr.match(/LOCATION:(.*)/);
                    
                    const time = dtstartMatch ? dtstartMatch[1].trim().split('T')[1] : null;
                    const endTime = dtendMatch ? dtendMatch[1].trim().split('T')[1] : null;

                    if (!summaryMatch || !time) return null;
                    
                    return {
                        name: summaryMatch[1].trim(),
                        time: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
                        endTime: endTime ? `${endTime.slice(0, 2)}:${endTime.slice(2, 4)}` : undefined,
                        location: locationMatch ? locationMatch[1].trim() : '',
                        ts: Date.now() + Math.random(),
                    } as Class;
                }).filter(Boolean) as Class[];

                if (window.confirm(`Found ${events.length} events. Do you want to add them to your schedule?`)) {
                    setClasses(prev => [...prev, ...events]);
                }

            } catch (error) { alert("Failed to parse ICS file."); }
        };
        reader.readAsText(file);
    };

    const START_HOUR = 6;
    const END_HOUR = 22;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

    if (appSettings.uiStyle === 'modern') {
        return (
            <div>
                <h3 className="text-xl font-bold mb-2">Today's Timetable</h3>
                <div>
                    <div className="modern-timetable-header">
                        <span>Time</span>
                        <span>Room No.</span>
                        <span>Subject</span>
                        <span>Type</span>
                    </div>
                    <div className="text-sm">
                        {sortedClasses.map((c, i) => (
                            <div key={i} className="modern-timetable-row">
                                <span>{formatTimeForDisplay(c.time)}</span>
                                <span>{c.location}</span>
                                <span className="font-bold">{c.name}</span>
                                <span>Lecture</span>
                            </div>
                        ))}
                         {sortedClasses.length === 0 && <p className="text-center p-4">No classes scheduled for today.</p>}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start">
                <CardHeader title="Today's Schedule" />
                <Button variant="outline" className="text-xs" onClick={handleAddNew}>+ New</Button>
            </div>

            <div className="flex-grow min-h-0 flex mt-2">
                <div className="w-10 text-right pr-2 text-xs text-[var(--text-color-dim)] flex flex-col">
                    {hours.map(h => (
                        <div key={h} className="flex-grow relative -top-2">{h % 12 === 0 ? 12 : h % 12} {h < 12 ? 'am' : 'pm'}</div>
                    ))}
                </div>
                <div className="relative flex-grow bg-black/10 rounded-lg">
                    {hours.map(h => (
                        <div key={h} className="h-[calc(100%/16)] border-t border-white/5 first:border-t-0"></div>
                    ))}
                    {sortedClasses.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-sm p-4">
                           <p>No classes scheduled for today.</p>
                        </div>
                    ) : sortedClasses.map(c => (
                        <TimelineEvent key={c.ts} event={c} onEdit={() => handleEdit(c)} startHour={START_HOUR} endHour={END_HOUR} />
                    ))}
                </div>
            </div>

            <div className="mt-3 flex gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
                <Button variant="outline" onClick={exportToICS}>Export ICS</Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import ICS/JSON</Button>
                <input type="file" ref={importFileRef} onChange={(e) => e.target.files?.[0].name.endsWith('.ics') ? importFromICS(e) : importFromJSON(e)} className="hidden" accept=".json,.ics" />
            </div>
        </div>
    );
};

export default ClassesWidget;