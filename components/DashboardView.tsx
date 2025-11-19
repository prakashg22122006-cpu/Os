
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useMobile } from '../../hooks/useMobile';
import ClockCalendar from './dashboard/ClockCalendar';

// Widgets & Systems Imports
import PomodoroTimer from './dashboard/PomodoroTimer';
import ClassesWidget from './dashboard/ClassesWidget';
import MusicPlayer from './dashboard/MusicPlayer';
import GamificationWidget from './dashboard/GamificationWidget';

import AcademicsManager from './systems/AcademicsManager';
import ProjectsManager from './systems/ProjectsManager';
import FinanceManager from './systems/FinanceManager';
import TaskManager from './systems/TaskManager';
import BackupRestoreManager from './systems/BackupRestoreManager';
import NotesManager from './systems/NotesManager';
import FlashcardManager from './systems/FlashcardManager';
import HabitsManager from './systems/HabitsManager';
import JobApplicationManager from './systems/JobApplicationManager';
import VisionAndJournalManager from './systems/VisionAndJournalManager';
import GlobalSearch from './systems/GlobalSearch';
import SettingsManager from './systems/SettingsManager';
import AnalyticsManager from './systems/AnalyticsManager';
import CodeEditorWidget from './systems/CodeEditorWidget';
import CollaborationWidget from './systems/CollaborationWidget';
import { Class } from '../../types';

// --- Mini Widget Components ---

const MiniWidgetWrapper: React.FC<{ color: string, children: React.ReactNode, title: string, icon: string }> = ({ color, children, title, icon }) => (
    <div className={`relative w-full h-full rounded-[32px] bg-gradient-to-br ${color} border border-white/10 p-3 flex flex-col justify-between overflow-hidden group-hover:scale-[1.02] transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]`}>
        <div className="flex-grow flex flex-col items-center justify-center relative z-10 w-full">
            {children}
        </div>
        <div className="flex items-center gap-1.5 mt-2 z-10 border-t border-white/10 pt-1 w-full">
             <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 truncate">{title}</span>
        </div>
        {/* Decorative icon in background */}
        <div className="absolute -bottom-3 -right-3 text-6xl opacity-10 pointer-events-none select-none grayscale brightness-200 rotate-12 transform group-hover:rotate-0 transition-transform duration-500">
            {icon}
        </div>
    </div>
);

const MiniPomodoro = () => {
    const { activePomodoro } = useAppContext();
    const minutes = Math.floor(activePomodoro.remaining / 60);
    const seconds = activePomodoro.remaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="flex flex-col items-center text-white w-full">
             <div className={`text-3xl font-bold font-mono ${activePomodoro.running ? 'text-white animate-pulse' : 'text-white/80'}`}>
                {timeString}
             </div>
             <div className="text-[10px] opacity-80 truncate w-full text-center mt-1">
                 {activePomodoro.running ? 'Focusing...' : 'Ready to Start'}
             </div>
        </div>
    )
};

const MiniTasks = () => {
    const { tasks } = useAppContext();
    const pending = useMemo(() => tasks.filter(t => t.status !== 'Done').length, [tasks]);
    const nextTask = useMemo(() => tasks.filter(t => t.status !== 'Done').sort((a,b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'))[0], [tasks]);

    return (
        <div className="flex flex-col items-start justify-center w-full h-full">
            <div className="text-3xl font-bold mb-1">{pending}</div>
            <div className="text-[10px] opacity-80 leading-tight w-full line-clamp-2">
                {nextTask ? `Next: ${nextTask.title}` : 'No pending tasks'}
            </div>
        </div>
    )
};

const MiniCalendar = () => {
    const { classes, events } = useAppContext();
    const todayStr = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const nextItem = useMemo(() => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Filter today's classes
        const todaysClasses = classes.filter(c => c.day === dayName || !c.day).map(c => ({
            title: c.name,
            timeStr: c.time,
            minutes: parseInt(c.time.split(':')[0]) * 60 + parseInt(c.time.split(':')[1]),
            type: 'Class'
        }));
        
        // Filter today's events
        const todaysEvents = events.filter(e => e.date === todayStr).map(e => ({
            title: e.title,
            timeStr: e.time || '00:00',
            minutes: e.time ? parseInt(e.time.split(':')[0]) * 60 + parseInt(e.time.split(':')[1]) : 0,
            type: 'Event'
        }));

        const allItems = [...todaysClasses, ...todaysEvents].sort((a,b) => a.minutes - b.minutes);
        return allItems.find(i => i.minutes > currentMinutes);
    }, [classes, events, dayName, todayStr]);

    return (
        <div className="flex flex-col items-start justify-center w-full h-full">
            <div className="text-xs uppercase opacity-60 font-bold">{dayName}</div>
            <div className="text-2xl font-bold my-1">{new Date().getDate()}</div>
            <div className="text-[10px] opacity-90 bg-white/10 px-1.5 py-0.5 rounded w-full truncate">
                {nextItem ? `${nextItem.timeStr} - ${nextItem.title}` : 'No more events'}
            </div>
        </div>
    )
};

const MiniNotes = () => {
    const { notes } = useAppContext();
    const recentNote = notes[0];

    return (
        <div className="flex flex-col items-start justify-center w-full h-full">
            <div className="text-3xl font-bold mb-1">{notes.length}</div>
             <div className="text-[10px] opacity-80 leading-tight w-full">
                {recentNote ? `Recent: ${recentNote.title}` : 'No notes yet'}
            </div>
        </div>
    )
};

const MiniFlashcards = () => {
    const { decks } = useAppContext();
    const dueCount = useMemo(() => {
        const now = Date.now();
        return decks.reduce((acc, deck) => acc + deck.cards.filter(c => c.nextReview <= now).length, 0);
    }, [decks]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
             <div className="text-3xl font-bold mb-1">{dueCount}</div>
             <div className="text-[10px] uppercase tracking-wider opacity-70">Cards Due</div>
        </div>
    )
};

const MiniMusic = () => {
    const { musicPlayerState, tracks } = useAppContext();
    const currentTrack = tracks.find(t => t.id === musicPlayerState.currentTrackId);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
            {musicPlayerState.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20 space-x-1">
                    <div className="w-1 h-4 bg-white animate-pulse"></div>
                    <div className="w-1 h-6 bg-white animate-pulse delay-75"></div>
                    <div className="w-1 h-3 bg-white animate-pulse delay-150"></div>
                     <div className="w-1 h-5 bg-white animate-pulse delay-100"></div>
                </div>
            )}
            <div className="z-10 text-center w-full">
                <div className="text-2xl mb-1">{musicPlayerState.isPlaying ? '⏸' : '▶'}</div>
                <div className="text-[10px] font-medium w-full truncate px-1">
                    {currentTrack ? currentTrack.title : 'No Track'}
                </div>
            </div>
        </div>
    )
};

const MiniHabits = () => {
    const { habits } = useAppContext();
    const topStreak = useMemo(() => {
        if (habits.length === 0) return 0;
        // Simplified streak logic for mini view
        return Math.max(...habits.map(h => h.completedDates.length), 0);
    }, [habits]);

    return (
         <div className="flex flex-col items-center justify-center w-full h-full">
             <div className="text-3xl font-bold mb-1">🔥 {topStreak}</div>
             <div className="text-[10px] opacity-70">Best Streak</div>
        </div>
    )
};

const MiniFinance = () => {
    const { financialTransactions } = useAppContext();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpense = useMemo(() => {
        return Math.abs(financialTransactions
            .filter(t => t.date && t.date.startsWith(currentMonth) && t.amount < 0)
            .reduce((acc, t) => acc + t.amount, 0));
    }, [financialTransactions, currentMonth]);

    return (
        <div className="flex flex-col items-start justify-center w-full h-full">
            <div className="text-[10px] opacity-70 uppercase">This Month</div>
            <div className="text-xl font-bold mb-1 text-red-200">-₹{monthlyExpense.toFixed(0)}</div>
            <div className="text-[10px] opacity-60">Expenses</div>
        </div>
    )
};

const MiniAcademics = () => {
    const { semesters } = useAppContext();
    
    // Simplified GPA calculation for display
    const gpa = useMemo(() => {
        const allCourses = semesters.flatMap(s => s.courses);
        let totalCredits = 0;
        let weightedPoints = 0;
        
        allCourses.forEach(c => {
            const credits = Number(c.credits) || 0;
            const grade = parseFloat(c.grade);
            if(!isNaN(grade) && credits > 0) {
                // Simple 4.0 mapping for example
                let points = 0;
                if (grade >= 90) points = 4.0;
                else if (grade >= 80) points = 3.0;
                else if (grade >= 70) points = 2.0;
                else if (grade >= 60) points = 1.0;
                
                weightedPoints += credits * points;
                totalCredits += credits;
            }
        });
        return totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : "N/A";
    }, [semesters]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
             <div className="text-3xl font-bold mb-1">{gpa}</div>
             <div className="text-[10px] opacity-70 uppercase tracking-wider">GPA</div>
        </div>
    )
}

const MiniProjects = () => {
    const { projects } = useAppContext();
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-3xl font-bold mb-1">{projects.length}</div>
            <div className="text-[10px] opacity-70">Active Projects</div>
        </div>
    )
}

const MiniJobs = () => {
    const { jobApplications } = useAppContext();
    const active = jobApplications.filter(j => j.status === 'Applied' || j.status === 'Interview').length;
    return (
         <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-3xl font-bold mb-1">{active}</div>
            <div className="text-[10px] opacity-70">Applications</div>
        </div>
    )
}

const MiniCode = () => {
    const { codeSnippets } = useAppContext();
    return (
        <div className="flex flex-col items-start justify-center w-full h-full p-1">
            <div className="font-mono text-2xl font-bold mb-1">{codeSnippets.length}</div>
             <div className="text-[10px] opacity-70 truncate w-full">{codeSnippets[0]?.title || 'No snippets'}</div>
             <div className="text-[9px] opacity-50 font-mono">{codeSnippets[0]?.language}</div>
        </div>
    )
}

const MiniChat = () => {
    const { chatMessages } = useAppContext();
    const lastMsg = chatMessages[chatMessages.length - 1];
    
    return (
        <div className="flex flex-col justify-center w-full h-full">
            <div className="text-[10px] opacity-60 uppercase mb-1 font-bold">Logs: {chatMessages.length}</div>
            <div className="bg-white/10 rounded p-1.5 text-[10px] truncate w-full">
                <span className="font-bold opacity-70">{lastMsg?.sender}: </span>
                {lastMsg?.content || 'No logs'}
            </div>
        </div>
    )
}

const MiniIconWidget: React.FC<{ icon: string }> = ({ icon }) => (
    <div className="flex items-center justify-center w-full h-full text-4xl drop-shadow-md">
        {icon}
    </div>
);


// --- App Registry ---

interface AppDefinition {
    id: string;
    name: string;
    icon: string;
    Component: React.FC<any>;
    color: string;
    description?: string;
    MiniWidget: React.FC<any>;
}

// Application Registry - Defines all available "Apps" in the OS
const APP_REGISTRY: AppDefinition[] = [
    // Productivity
    { id: 'pomodoro', name: 'Focus', icon: '⏱️', Component: PomodoroTimer, color: 'from-red-500/20 to-orange-500/20', description: 'Pomodoro Timer', MiniWidget: MiniPomodoro },
    { id: 'tasks', name: 'Tasks', icon: '✅', Component: TaskManager, color: 'from-green-500/20 to-emerald-500/20', description: 'Kanban & Todo', MiniWidget: MiniTasks },
    { id: 'calendar', name: 'Schedule', icon: '📅', Component: ClassesWidget, color: 'from-blue-500/20 to-cyan-500/20', description: 'Classes & Events', MiniWidget: MiniCalendar },
    
    // Knowledge
    { id: 'notes', name: 'Notes', icon: '📝', Component: NotesManager, color: 'from-amber-500/20 to-yellow-500/20', description: 'Knowledge Base', MiniWidget: MiniNotes },
    { id: 'flashcards', name: 'Flashcards', icon: '🎴', Component: FlashcardManager, color: 'from-pink-500/20 to-rose-500/20', description: 'Spaced Repetition', MiniWidget: MiniFlashcards },
    { id: 'academics', name: 'Academics', icon: '🎓', Component: AcademicsManager, color: 'from-blue-600/20 to-indigo-600/20', description: 'Grades & Courses', MiniWidget: MiniAcademics },

    // CS & Collaboration (Local Tools)
    { id: 'code', name: 'Code Lab', icon: '💻', Component: CodeEditorWidget, color: 'from-slate-700/20 to-black/40', description: 'Snippet Library', MiniWidget: MiniCode },
    { id: 'chat', name: 'Channels', icon: '💬', Component: CollaborationWidget, color: 'from-violet-600/20 to-indigo-500/20', description: 'Local Message Logs', MiniWidget: MiniChat },

    // Lifestyle
    { id: 'music', name: 'Music', icon: '🎵', Component: MusicPlayer, color: 'from-purple-500/20 to-fuchsia-500/20', description: 'Player & LoFi', MiniWidget: MiniMusic },
    { id: 'habits', name: 'Habits', icon: '🔥', Component: HabitsManager, color: 'from-orange-500/20 to-red-500/20', description: 'Tracker', MiniWidget: MiniHabits },
    { id: 'vision', name: 'Vision', icon: '🧘', Component: VisionAndJournalManager, color: 'from-violet-500/20 to-purple-500/20', description: 'Journal & Goals', MiniWidget: () => <MiniIconWidget icon="🧘" /> },
    
    // Management
    { id: 'finance', name: 'Finance', icon: '💰', Component: FinanceManager, color: 'from-emerald-600/20 to-teal-600/20', description: 'Budget & Expense', MiniWidget: MiniFinance },
    { id: 'projects', name: 'Projects', icon: '🚀', Component: ProjectsManager, color: 'from-indigo-500/20 to-blue-500/20', description: 'Portfolio', MiniWidget: MiniProjects },
    { id: 'jobs', name: 'Career', icon: '💼', Component: JobApplicationManager, color: 'from-slate-500/20 to-gray-500/20', description: 'Applications', MiniWidget: MiniJobs },

    // System & Tools
    { id: 'analytics', name: 'Analytics', icon: '📊', Component: AnalyticsManager, color: 'from-cyan-500/20 to-blue-500/20', description: 'Stats', MiniWidget: () => <MiniIconWidget icon="📊" /> },
    { id: 'wheel', name: 'Decide', icon: '🎡', Component: GamificationWidget, color: 'from-fuchsia-500/20 to-pink-500/20', description: 'Decision Wheel', MiniWidget: () => <MiniIconWidget icon="🎡" /> },
    { id: 'search', name: 'Search', icon: '🔍', Component: GlobalSearch, color: 'from-gray-500/20 to-slate-500/20', description: 'Global Find', MiniWidget: () => <MiniIconWidget icon="🔍" /> },
    { id: 'settings', name: 'Settings', icon: '⚙️', Component: SettingsManager, color: 'from-gray-600/20 to-zinc-600/20', description: 'Config', MiniWidget: () => <MiniIconWidget icon="⚙️" /> },
    { id: 'backup', name: 'Backup', icon: '💾', Component: BackupRestoreManager, color: 'from-green-800/20 to-emerald-800/20', description: 'Data Management', MiniWidget: () => <MiniIconWidget icon="💾" /> },
];

interface DashboardViewProps {
    setIsFocusMode: (isFocus: boolean) => void;
}

const CommandBar: React.FC = () => {
    const { setIsCommandPaletteOpen } = useAppContext();
    return (
        <div className="w-full mb-4 sticky top-0 z-40 pt-2 px-1">
            <button 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-full h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center px-4 text-gray-400 shadow-lg active:scale-95 transition-transform"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-sm font-medium">Type a command...</span>
                <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded text-gray-500">⌘ K</span>
            </button>
        </div>
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ setIsFocusMode }) => {
    const [maximizedAppId, setMaximizedAppId] = useState<string | null>(null);
    const isMobile = useMobile();
    const { setIsCommandPaletteOpen } = useAppContext();

    const maximizedApp = useMemo(() => {
        return APP_REGISTRY.find(app => app.id === maximizedAppId);
    }, [maximizedAppId]);

    // Group definitions for mobile
    const coreApps = APP_REGISTRY.slice(0, 3);
    const noteApps = APP_REGISTRY.slice(3, 6);
    const toolApps = APP_REGISTRY.slice(6, 10); // Code, Chat, Music, Habits
    const sysApps = APP_REGISTRY.slice(10);

    return (
        <div className="flex flex-col h-full gap-4 relative">
            {/* Top Section: Command Bar (Mobile Only) or Clock */}
            <div className={`transition-all duration-500 ease-in-out flex-shrink-0 ${maximizedAppId ? 'opacity-0 -translate-y-4 pointer-events-none h-0 overflow-hidden' : 'opacity-100 translate-y-0'}`}>
                {isMobile ? (
                    <CommandBar />
                ) : (
                     <ClockCalendar setIsFocusMode={setIsFocusMode} compact={true} />
                )}
            </div>

            {/* Main Workspace: App Grid / Horizontal Scroll on Mobile */}
            <div className={`flex-grow min-h-0 overflow-y-auto md:overflow-y-auto custom-scrollbar transition-all duration-500 ${maximizedAppId ? 'opacity-0 scale-95 pointer-events-none hidden' : 'opacity-100 scale-100'}`}>
                {isMobile ? (
                    /* Mobile Horizontal Scroll View with Rows */
                    <div className="flex flex-col gap-6 pb-20">
                        {/* Core Row */}
                         <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Focus & Core</h4>
                            <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 snap-x snap-mandatory">
                                {coreApps.map((app) => (
                                    <button 
                                        key={app.id} 
                                        onClick={() => setMaximizedAppId(app.id)}
                                        className="snap-center shrink-0 w-[45vw] aspect-square outline-none focus:ring-2 focus:ring-white/20 rounded-[32px]"
                                    >
                                        <MiniWidgetWrapper color={app.color} title={app.name} icon={app.icon}>
                                            <app.MiniWidget />
                                        </MiniWidgetWrapper>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                         {/* Knowledge Row */}
                         <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Knowledge</h4>
                            <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 snap-x snap-mandatory">
                                {noteApps.map((app) => (
                                    <button 
                                        key={app.id} 
                                        onClick={() => setMaximizedAppId(app.id)}
                                        className="snap-center shrink-0 w-[45vw] aspect-square outline-none focus:ring-2 focus:ring-white/20 rounded-[32px]"
                                    >
                                        <MiniWidgetWrapper color={app.color} title={app.name} icon={app.icon}>
                                            <app.MiniWidget />
                                        </MiniWidgetWrapper>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Life & Tools Row */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Life & Tools</h4>
                            <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 snap-x snap-mandatory">
                                {toolApps.map((app) => (
                                    <button 
                                        key={app.id} 
                                        onClick={() => setMaximizedAppId(app.id)}
                                        className="snap-center shrink-0 w-[45vw] aspect-square outline-none focus:ring-2 focus:ring-white/20 rounded-[32px]"
                                    >
                                        <MiniWidgetWrapper color={app.color} title={app.name} icon={app.icon}>
                                            <app.MiniWidget />
                                        </MiniWidgetWrapper>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                         {/* Systems Row */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">System</h4>
                            <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 snap-x snap-mandatory">
                                {sysApps.map((app) => (
                                    <button 
                                        key={app.id} 
                                        onClick={() => setMaximizedAppId(app.id)}
                                        className="snap-center shrink-0 w-[45vw] aspect-square outline-none focus:ring-2 focus:ring-white/20 rounded-[32px]"
                                    >
                                        <MiniWidgetWrapper color={app.color} title={app.name} icon={app.icon}>
                                            <app.MiniWidget />
                                        </MiniWidgetWrapper>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Desktop Grid View */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
                        {APP_REGISTRY.map((app) => (
                            <button 
                                key={app.id} 
                                onClick={() => setMaximizedAppId(app.id)}
                                className="group w-full aspect-square outline-none focus:ring-2 focus:ring-white/20 rounded-[32px]"
                            >
                            <MiniWidgetWrapper color={app.color} title={app.name} icon={app.icon}>
                                <app.MiniWidget />
                            </MiniWidgetWrapper>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Maximized App Overlay */}
            {maximizedApp && (
                <div className="absolute inset-0 z-50 flex flex-col bg-[var(--bg)]/95 backdrop-blur-3xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-zoom-in">
                     {/* Window Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${maximizedApp.color} flex items-center justify-center text-sm shadow-sm`}>
                                {maximizedApp.icon}
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-tight">{maximizedApp.name}</h2>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setMaximizedAppId(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-200 transition-all flex items-center justify-center border border-white/5"
                                title="Close App"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar">
                        <maximizedApp.Component setIsFocusMode={setIsFocusMode} isMaximized={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;