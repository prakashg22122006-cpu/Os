
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import { Class } from '../../types';
import { addFile, getFile } from '../../utils/db';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeToMinutes = (time: string): number => {
    if(!time || typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
};

const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${ampm}`;
};

interface ClassesWidgetProps {
    isMaximized?: boolean;
}

const TimelineEvent: React.FC<{ event: Class; onEdit: () => void; startHour: number; endHour: number }> = ({ event, onEdit, startHour, endHour }) => {
    const totalMinutes = (endHour - startHour) * 60;
    const startTime = timeToMinutes(event.time);
    const endTime = event.endTime ? timeToMinutes(event.endTime) : startTime + 60; 
    const top = ((startTime - startHour * 60) / totalMinutes) * 100;
    const height = ((endTime - startTime) / totalMinutes) * 100;

    if (top < 0 || top > 100) return null;

    const displayColor = event.color || 'var(--grad-1)';

    return (
        <div
            className="absolute w-full px-2 py-1 rounded-lg text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform z-10 hover:z-20 shadow-sm"
            style={{ 
                top: `${top}%`, 
                height: `${Math.max(height, 4)}%`, // Min height for visibility
                backgroundColor: `${displayColor}cc`, 
                borderLeft: `4px solid ${displayColor}`,
            }}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title={`${event.name} (${formatTimeForDisplay(event.time)} - ${event.endTime ? formatTimeForDisplay(event.endTime) : '?'})`}
        >
            <p className="font-bold text-xs truncate">{event.name}</p>
            <p className="text-[10px] opacity-90 truncate">{formatTimeForDisplay(event.time)} {event.endTime ? `- ${formatTimeForDisplay(event.endTime)}` : ''}</p>
            <p className="text-[10px] opacity-90 truncate">{event.location}</p>
        </div>
    );
};

const ClassesWidget: React.FC<ClassesWidgetProps> = ({ isMaximized = false }) => {
    const { classes, setClasses, setViewingScheduleItem, appSettings, setAppSettings } = useAppContext();
    const [viewMode, setViewMode] = useState<'today' | 'weekly' | 'reference'>('today');
    const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Initialize viewMode based on isMaximized status
    useEffect(() => {
        if (!isMaximized) setViewMode('today');
    }, [isMaximized]);

    // Load Reference Image/PDF
    useEffect(() => {
        if (appSettings.timetableReferenceId) {
            getFile(appSettings.timetableReferenceId).then(file => {
                if (file) {
                    setReferenceUrl(URL.createObjectURL(file.data));
                }
            });
        }
    }, [appSettings.timetableReferenceId]);

    const todaysClasses = useMemo(() => {
        return (classes || []).filter(c => {
            // Show if day matches OR if day is undefined (legacy/daily assumption)
            return c.day === currentDay || !c.day;
        }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }, [classes, currentDay]);

    const handleEdit = (item: Class) => setViewingScheduleItem(item);
    
    const handleAddNew = (day?: string) => {
        setViewingScheduleItem({
            day: day || currentDay,
            time: '09:00',
            ts: Date.now() // Placeholder TS
        } as Class); 
    };

    const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const id = await addFile(file);
            setAppSettings(prev => ({ ...prev, timetableReferenceId: id }));
            alert('Timetable reference uploaded successfully!');
        } catch (err) {
            alert('Failed to upload file.');
        }
    };

    const handleRemoveReference = () => {
        if(window.confirm("Remove the reference timetable?")) {
             setAppSettings(prev => ({ ...prev, timetableReferenceId: undefined }));
             setReferenceUrl(null);
        }
    };

    const START_HOUR = 7;
    const END_HOUR = 20;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

    // --- RENDER VIEWS ---

    const renderTimeline = (items: Class[], showHours = true) => (
        <div className="flex-grow min-h-0 flex mt-2 h-full relative">
            {showHours && (
                <div className="w-12 text-right pr-2 text-xs text-gray-400 flex flex-col justify-between py-2">
                    {hours.map(h => (
                        <div key={h} className="relative h-full -top-2">{h > 12 ? h - 12 : h} {h < 12 ? 'am' : 'pm'}</div>
                    ))}
                </div>
            )}
            <div className="relative flex-grow bg-black/10 rounded-lg border border-white/5 overflow-hidden">
                 {/* Grid Lines */}
                 <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {hours.map(h => (
                        <div key={h} className="flex-1 border-t border-white/5 first:border-t-0"></div>
                    ))}
                 </div>
                
                {items.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center text-sm p-4 text-gray-500 pointer-events-none">
                       <p>Free Time</p>
                    </div>
                ) : items.map(c => (
                    <TimelineEvent key={c.ts} event={c} onEdit={() => handleEdit(c)} startHour={START_HOUR} endHour={END_HOUR} />
                ))}
            </div>
        </div>
    );

    const renderWeeklyGrid = () => (
        <div className="flex h-full overflow-x-auto gap-2 pb-2">
            <div className="flex-shrink-0 w-12 pt-8 text-xs text-gray-400 flex flex-col justify-between pb-2">
                 {hours.map(h => (
                    <div key={h} className="relative flex-1 flex items-center justify-end pr-2">{h > 12 ? h - 12 : h}</div>
                ))}
            </div>
            {DAYS_OF_WEEK.map(day => {
                const dayClasses = (classes || []).filter(c => c.day === day);
                const isToday = day === currentDay;
                return (
                    <div key={day} className={`flex-shrink-0 w-48 flex flex-col rounded-xl border ${isToday ? 'border-[var(--grad-1)] bg-[var(--grad-1)]/5' : 'border-white/5 bg-white/5'}`}>
                        <div className="p-2 text-center border-b border-white/5">
                            <h4 className={`font-bold ${isToday ? 'text-[var(--grad-1)]' : 'text-gray-300'}`}>{day}</h4>
                            <button onClick={() => handleAddNew(day)} className="text-[10px] opacity-50 hover:opacity-100 mt-1">+ Add Class</button>
                        </div>
                        <div className="flex-grow p-1">
                            {renderTimeline(dayClasses, false)}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderReferenceView = () => (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl border border-dashed border-white/10">
            {referenceUrl ? (
                <div className="relative w-full h-full flex flex-col">
                    <div className="flex-grow overflow-auto rounded-lg mb-2 bg-black/50">
                        <iframe src={referenceUrl} className="w-full h-full object-contain border-0" title="Timetable Reference" />
                    </div>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => window.open(referenceUrl, '_blank')}>Open Full Size</Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Update</Button>
                        <Button variant="outline" className="text-red-400" onClick={handleRemoveReference}>Remove</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                     <p className="text-gray-400 mb-4">Upload your official timetable (Image or PDF) for quick reference.</p>
                     <Button onClick={() => fileInputRef.current?.click()}>Upload Reference</Button>
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleUploadReference} className="hidden" accept="image/*,application/pdf" />
        </div>
    );

    // --- MAIN RENDER ---

    if (!isMaximized) {
        // Compact Widget View (Today Only)
        return (
            <div className="flex flex-col h-full p-4">
                <div className="flex justify-between items-start mb-2">
                     <h3 className="text-sm font-bold text-gray-300">{currentDay}</h3>
                    <Button variant="glass" className="text-xs !p-1" onClick={() => handleAddNew()}>+ Add</Button>
                </div>
                {renderTimeline(todaysClasses)}
            </div>
        );
    }

    // Full Application View
    return (
        <div className="flex flex-col h-full">
             <div className="flex border-b border-white/10 mb-4 px-4">
                <button onClick={() => setViewMode('today')} className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'today' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400 hover:text-white'}`}>Today</button>
                <button onClick={() => setViewMode('weekly')} className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'weekly' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400 hover:text-white'}`}>Weekly Schedule</button>
                <button onClick={() => setViewMode('reference')} className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === 'reference' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400 hover:text-white'}`}>Reference File</button>
            </div>
            
            <div className="flex-grow overflow-hidden px-4 pb-4">
                {viewMode === 'today' && (
                    <div className="h-full flex flex-col">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold">{currentDay}'s Timeline</h3>
                            <Button onClick={() => handleAddNew()}>+ Add Event</Button>
                        </div>
                        {renderTimeline(todaysClasses)}
                    </div>
                )}
                {viewMode === 'weekly' && renderWeeklyGrid()}
                {viewMode === 'reference' && renderReferenceView()}
            </div>
        </div>
    );
};

export default ClassesWidget;
