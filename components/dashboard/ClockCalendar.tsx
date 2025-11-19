
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Event as CalendarEvent, Task } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-bg to-bg-offset border border-border-color rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                        className="glass-textarea w-full"
                    />
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button variant="gradient" onClick={handleSubmit}>Save Event</Button>
                </footer>
            </div>
        </div>
    );
};

const AgendaView: React.FC<{ items: AgendaItem[]; onTaskClick: (task: Task) => void }> = ({ items, onTaskClick }) => {
    const icons: Record<AgendaItemType, React.ReactNode> = {
        task: <span className="text-[var(--grad-1)]">✅</span>,
        class: <span className="text-[var(--grad-2)]">📚</span>,
        event: <span className="text-[var(--grad-3)]">📅</span>,
        study: <span className="text-[var(--grad-4)]">🍅</span>,
    };

    if (items.length === 0) {
        return <p className="text-center text-sm text-gray-500 py-4 italic">Nothing scheduled.</p>;
    }

    return (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {items.sort((a,b) => (a.time || '99').localeCompare(b.time || '99')).map(item => (
                <div key={item.ts} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex-shrink-0 text-sm">{icons[item.type]}</div>
                    <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm text-gray-200 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.time || 'All-day'}{item.type === 'study' ? ` (${item.data.hours.toFixed(1)} hrs)` : ''}</p>
                    </div>
                    {item.type === 'task' && (
                        <Button variant="glass" className="text-[10px] !px-2 !py-0.5 h-6" onClick={() => onTaskClick(item.data)}>View</Button>
                    )}
                </div>
            ))}
        </div>
    );
};

interface ClockCalendarProps {
    setIsFocusMode: (isFocus: boolean) => void;
    compact?: boolean;
}

const getThemeClass = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'theme-morning';
    if (hour >= 12 && hour < 17) return 'theme-day';
    if (hour >= 17 && hour < 21) return 'theme-evening';
    return 'theme-night';
};

const ClockCalendar: React.FC<ClockCalendarProps> = ({ setIsFocusMode, compact = false }) => {
  const [time, setTime] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const { classes, studyLogs, tasks, events, setEvents, setViewingTask, appSettings, activeLiveCalendarTypeId, activeLiveClockTypeId } = useAppContext();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [themeClass, setThemeClass] = useState(() => getThemeClass(new Date()));

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
    setSelectedDate(date);
  };
  
  const changeMonth = (offset: number) => {
    setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + offset, 1));
  };

  // --- Render Helpers ---

  const renderCalendarGrid = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days = [];
    // Empty slots
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);
    
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = today.toDateString() === date.toDateString();
        const isSelected = selectedDate.toDateString() === date.toDateString();
        const hasItems = agendaItemsByDate.has(dateStr);

        days.push(
            <div 
                key={d} 
                onClick={() => handleSelectDate(date)}
                className={`
                    relative flex items-center justify-center aspect-square text-xs rounded-full cursor-pointer transition-all
                    ${isSelected ? 'bg-[var(--grad-1)] text-white font-bold shadow-md' : 'hover:bg-white/10 text-gray-300'}
                    ${isToday && !isSelected ? 'border border-[var(--grad-1)] text-[var(--grad-1)]' : ''}
                `}
            >
                {d}
                {hasItems && !isSelected && (
                    <div className="absolute bottom-0.5 w-1 h-1 bg-[var(--grad-1)] rounded-full" />
                )}
            </div>
        );
    }
    return days;
  };

  // --- Compact View ---
  if (compact) {
      return (
        <>
            <div className={`flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-lg ${themeClass} hologram-container w-full overflow-hidden relative`}>
                {/* Decorative Glow */}
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-[var(--grad-1)]/20 blur-[60px] rounded-full pointer-events-none" />

                {/* Left: Clock & Date */}
                <div className="flex items-center gap-6 z-10">
                     <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white tracking-tight">{displayTime}</span>
                            <span className="text-sm font-medium text-gray-400">{displayAmPm}</span>
                        </div>
                         <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                             {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                         </div>
                     </div>
                </div>

                {/* Center: Mini Calendar Strip (Just Days) */}
                <div className="hidden lg:flex flex-grow justify-center px-8 z-10">
                    <div className="flex gap-1 p-1 rounded-full bg-black/20 border border-white/5">
                        {Array.from({length: 7}).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - d.getDay() + i); // Start from Sunday
                            const isToday = new Date().toDateString() === d.toDateString();
                            return (
                                <div key={i} className={`w-8 h-8 flex flex-col items-center justify-center rounded-full text-[10px] ${isToday ? 'bg-[var(--grad-1)] text-white shadow-lg' : 'text-gray-400'}`}>
                                    <span className="opacity-60 text-[8px]">{['S','M','T','W','T','F','S'][i]}</span>
                                    <span className="font-bold">{d.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Actions & Next Event */}
                <div className="flex items-center gap-3 z-10">
                     {selectedDateItems.length > 0 && (
                         <div className="hidden md:flex flex-col items-end mr-2">
                             <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Next Up</span>
                             <span className="text-xs font-medium text-white truncate max-w-[120px]">{selectedDateItems[0].title}</span>
                         </div>
                     )}
                     <button 
                        onClick={() => { setEditingEvent(undefined); setIsEventModalOpen(true); }}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
                        title="Add Event"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                     </button>
                     <button 
                        onClick={() => setIsFocusMode(true)}
                        className="px-4 h-10 rounded-full bg-gradient-to-r from-[var(--grad-1)] to-[var(--grad-2)] text-white text-sm font-bold shadow-lg hover:shadow-[0_0_20px_rgba(74,0,224,0.4)] transition-all flex items-center gap-2"
                     >
                        <span>Focus</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </button>
                </div>
            </div>
            {isEventModalOpen && <EventModal event={editingEvent} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} selectedDate={selectedDate} />}
        </>
      );
  }

  // --- Expanded / Standard View (Legacy fallback if used elsewhere) ---
  return (
    <div className={`flex flex-col gap-4 h-full hologram-container p-4 ${themeClass}`}>
        {/* Simplified full calendar for completeness */}
        <div className="text-center">
             <h3 className="text-4xl font-bold text-white">{displayTime} <small className="text-lg text-gray-400">{displayAmPm}</small></h3>
             <p className="text-gray-400">{time.toDateString()}</p>
        </div>
        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded">&lt;</button>
                <span className="font-bold">{displayDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})}</span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500">
                {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderCalendarGrid()}
            </div>
        </div>
        <div className="flex-grow overflow-hidden flex flex-col">
            <h4 className="font-bold text-sm mb-2 text-gray-400">Agenda</h4>
            <AgendaView items={selectedDateItems} onTaskClick={setViewingTask} />
        </div>
        {isEventModalOpen && <EventModal event={editingEvent} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} selectedDate={selectedDate} />}
    </div>
  );
};

export default ClockCalendar;
