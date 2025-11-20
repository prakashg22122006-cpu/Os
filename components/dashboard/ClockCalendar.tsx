import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Event as CalendarEvent, Task } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 text-sm font-bold text-[var(--text-color-accent)]">
    {title} {subtitle && <small className="text-[var(--text-color-dim)] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const downloadJSON = (obj: any, name='export.json') => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
};

type AgendaItemType = 'task' | 'class' | 'event' | 'study';
interface AgendaItem {
  ts: number;
  type: AgendaItemType;
  time?: string;
  title: string;
  data: any;
}

const EventModal: React.FC<{ event?: CalendarEvent; onClose: () => void; onSave: (event: Omit<CalendarEvent, 'ts'>) => void; selectedDate: Date }> = ({ event, onClose, onSave, selectedDate }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [time, setTime] = useState(event?.time || '');
    const [description, setDescription] = useState(event?.description || '');
    
    const handleSubmit = () => {
        if (!title.trim()) return alert('Event title is required.');
        onSave({
            date: selectedDate.toISOString().split('T')[0],
            title,
            time,
            description,
            attachments: event?.attachments || []
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--accent-color)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10">
                    <h4 className="font-semibold text-lg">{event ? 'Edit Event' : 'Add New Event'}</h4>
                    <p className="text-sm text-gray-400">For {selectedDate.toLocaleDateString()}</p>
                </header>
                <main className="p-4 space-y-3">
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" />
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} placeholder="Event Time (optional)" />
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Description (optional)..."
                        className="bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] p-2 rounded-lg w-full box-border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                    />
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Event</Button>
                </footer>
            </div>
        </div>
    );
};

const AgendaView: React.FC<{ items: AgendaItem[]; onTaskClick: (task: Task) => void }> = ({ items, onTaskClick }) => {
    const icons: Record<AgendaItemType, React.ReactNode> = {
        task: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        class: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.002 1.84L9 9.832V16.5a1 1 0 001 1h.093a1 1 0 00.907-.59L17.593 8.3a1 1 0 00.407-1.11l-3-5.5a1 1 0 00-1.11-.407L10.394 2.08zM12 15.584V9.832l5.407-2.704-2.311 4.236L12 15.584z" /></svg>,
        event: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
        study: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>,
    };

    if (items.length === 0) {
        return <p className="text-center text-sm text-[var(--text-color-dim)] py-4">No items scheduled for this day.</p>;
    }

    return (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {items.sort((a,b) => (a.time || '99').localeCompare(b.time || '99')).map(item => (
                <div key={item.ts} className="flex items-start gap-3 p-2 rounded-lg bg-[rgba(255,255,255,0.02)]">
                    <div className="text-[var(--accent-color)] flex-shrink-0 mt-0.5">{icons[item.type]}</div>
                    <div className="flex-grow">
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-[var(--text-color-dim)]">{item.time || 'All-day'}{item.type === 'study' ? ` (${item.data.hours.toFixed(1)} hrs)` : ''}</p>
                    </div>
                    {item.type === 'task' && (
                        <Button variant="outline" className="text-xs px-2 py-1" onClick={() => onTaskClick(item.data)}>View</Button>
                    )}
                </div>
            ))}
        </div>
    );
};

interface ClockCalendarProps {
    setIsFocusMode: (isFocus: boolean) => void;
}

const getThemeClass = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'theme-morning';
    if (hour >= 12 && hour < 17) return 'theme-day';
    if (hour >= 17 && hour < 21) return 'theme-evening';
    return 'theme-night';
};

const ClockCalendar: React.FC<ClockCalendarProps> = ({ setIsFocusMode }) => {
  const [time, setTime] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [flippingDate, setFlippingDate] = useState<number | null>(null);
  const { classes, studyLogs, tasks, events, setEvents, setViewingTask, appSettings } = useAppContext();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [monthTransition, setMonthTransition] = useState<{ direction: 'next' | 'prev' | 'none', phase: 'idle' | 'out' | 'in' }>({ direction: 'none', phase: 'idle' });
  const [themeClass, setThemeClass] = useState(getThemeClass(new Date()));

  useEffect(() => {
    const timerId = setInterval(() => {
        const now = new Date();
        setTime(now);
        setThemeClass(getThemeClass(now));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const agendaItemsByDate = useMemo(() => {
    const items = new Map<string, AgendaItem[]>();
    const todayStr = new Date().toISOString().split('T')[0];

    tasks.forEach(task => {
        if (task.dueDate && task.status !== 'Done') {
            const date = task.dueDate;
            if (!items.has(date)) items.set(date, []);
            items.get(date)!.push({ ts: task.createdAt, type: 'task', title: task.title, data: task });
        }
    });
    classes.forEach(c => {
        if (!items.has(todayStr)) items.set(todayStr, []);
        items.get(todayStr)!.push({ ts: c.ts, type: 'class', time: c.time, title: c.name, data: c });
    });
    studyLogs.forEach(log => {
        const date = new Date(log.ts).toISOString().split('T')[0];
        if (!items.has(date)) items.set(date, []);
        items.get(date)!.push({ ts: log.ts, type: 'study', title: log.subject, data: log });
    });
    events.forEach(event => {
        const date = event.date;
        if (!items.has(date)) items.set(date, []);
        items.get(date)!.push({ ts: event.ts, type: 'event', time: event.time, title: event.title, data: event });
    });
    return items;
  }, [tasks, classes, studyLogs, events]);
  
  const studyHeatmap = useMemo(() => {
      const heat = new Map<string, number>();
      studyLogs.forEach(log => {
          const date = new Date(log.ts).toISOString().split('T')[0];
          heat.set(date, (heat.get(date) || 0) + log.hours);
      });
      return heat;
  }, [studyLogs]);

  const selectedDateItems = useMemo(() => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      return agendaItemsByDate.get(dateStr) || [];
  }, [selectedDate, agendaItemsByDate]);

  const [displayTime, displayAmPm] = useMemo(() => {
    const timeString = time.toLocaleTimeString([], {
      hour: appSettings.timeFormat === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: appSettings.timeFormat === '12h',
    });
    if (appSettings.timeFormat === '12h') {
        const parts = timeString.split(' ');
        return [parts[0], parts[1]];
    }
    return [timeString, ''];
  }, [time, appSettings.timeFormat]);
  
  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'ts'>) => {
    if (editingEvent) {
        setEvents(prev => prev.map(e => e.ts === editingEvent.ts ? { ...editingEvent, ...eventData } : e));
    } else {
        setEvents(prev => [...prev, { ...eventData, ts: Date.now() }]);
    }
    setEditingEvent(undefined);
  };
  
  const handleSelectDate = (date: Date) => {
    setFlippingDate(date.getDate());
    setTimeout(() => { setSelectedDate(date); }, 300);
    setTimeout(() => setFlippingDate(null), 600);
  };
  
  const changeMonth = (offset: number) => {
    const direction = offset > 0 ? 'next' : 'prev';
    setMonthTransition({ direction, phase: 'out' });
    setTimeout(() => { setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + offset, 1)); setMonthTransition({ direction, phase: 'in' }); }, 200);
    setTimeout(() => { setMonthTransition({ direction: 'none', phase: 'idle' }); }, 400);
  };

  const importEvents = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) { setEvents(data); alert('Events imported!'); } else { alert('Invalid file format'); }
        } catch (error) { alert('Error parsing file'); }
        if (importFileRef.current) importFileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const renderCalendar = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) { calendarDays.push(<div key={`empty-${i}`} className="p-1 rounded-lg text-center"></div>); }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = today.toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const hasItems = agendaItemsByDate.has(dateStr);
      const studyHours = studyHeatmap.get(dateStr) || 0;
      
      calendarDays.push(
        <div key={d} onClick={() => handleSelectDate(date)} className={`calendar-day-flipper relative p-1.5 rounded-lg cursor-pointer text-sm ${flippingDate === d ? 'flipping' : ''}`}>
          <div className="calendar-day-inner">
            <div className="calendar-day-front" style={{ backgroundColor: `rgba(var(--accent-color-rgb), ${Math.min(0.5, studyHours / 4)})` }}>
              <span className={`relative z-10 p-1 rounded-md ${isSelected ? 'bg-[var(--accent-color)]/50 text-white' : ''} ${hasItems && !isSelected ? 'text-[var(--text-color)]' : 'text-[var(--text-color-dim)]'} ${isToday ? 'is-today-glow' : ''}`}>
                  {d}
              </span>
              {hasItems && <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--accent-color)]'}`}></div>}
            </div>
            <div className="calendar-day-back">{d}</div>
          </div>
        </div>
      );
    }
    return calendarDays;
  };

  const getCalendarGridClass = () => {
    if (monthTransition.phase === 'out') { return `calendar-grid exiting-${monthTransition.direction}`; }
    if (monthTransition.phase === 'in') { return `calendar-grid entering-${monthTransition.direction}`; }
    return 'calendar-grid';
  };
    
    // For hologram clock
    const secondsProgress = (time.getSeconds() / 60) * 100;
    const ringRadius = 70;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (secondsProgress / 100) * ringCircumference;

  return (
    <div className={`flex flex-col gap-4 h-full hologram-container ${themeClass}`}>
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <CardHeader title="Calendar & Clock" subtitle={time.toLocaleDateString(undefined, { weekday: 'long' })} />
        </div>
        <div className="flex-grow flex items-center justify-center min-h-[160px]">
             <div className="hologram-clock">
                <svg className="progress-ring" width="160" height="160" viewBox="0 0 160 160">
                     <defs>
                        <filter id="neon-glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <circle className="progress-ring-track" cx="80" cy="80" r={ringRadius} />
                    <circle
                        className="progress-ring-progress"
                        cx="80" cy="80" r={ringRadius}
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                    />
                </svg>
                <div className="hologram-content">
                    <span className="clock-time-glow">{displayTime}</span>
                    {displayAmPm && <span className="clock-ampm">{displayAmPm}</span>}
                </div>
                <div className="hologram-scanline" />
            </div>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="border-t border-[var(--input-border-color)] pt-4">
        <div className="flex justify-between items-center mb-2">
            <Button variant="outline" className="text-xs !p-1.5" onClick={() => changeMonth(-1)}>&lt;</Button>
            <h4 className="font-semibold text-sm">{displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h4>
            <Button variant="outline" className="text-xs !p-1.5" onClick={() => changeMonth(1)}>&gt;</Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-[var(--text-color-dim)]">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}</div>
        <div className="calendar-grid-container"><div className={getCalendarGridClass()}><div className="grid grid-cols-7 gap-1.5">{renderCalendar()}</div></div></div>
      </div>
      
      {/* Agenda */}
      <div className="border-t border-[var(--input-border-color)] pt-4">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Agenda for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</h4>
            <Button variant="outline" className="text-xs" onClick={() => { setEditingEvent(undefined); setIsEventModalOpen(true); }}>+ Add Event</Button>
        </div>
        <AgendaView items={selectedDateItems} onTaskClick={setViewingTask} />
      </div>

       <div className="mt-3 flex gap-2 border-t border-[var(--input-border-color)] pt-3">
        <Button variant="outline" onClick={() => downloadJSON(events, 'calendar-events.json')}>Export</Button>
        <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import</Button>
        <input type="file" ref={importFileRef} onChange={importEvents} className="hidden" accept="application/json" />
        <Button variant="cta" onClick={() => setIsFocusMode(true)} className="!mt-0 ml-auto">Enter Focus Mode</Button>
      </div>

      {isEventModalOpen && <EventModal event={editingEvent} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} selectedDate={selectedDate} />}
    </div>
  );
};

export default ClockCalendar;