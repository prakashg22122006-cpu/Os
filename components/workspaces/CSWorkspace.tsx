
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

// System Components
import AcademicsManager from '../systems/AcademicsManager';
import AnalyticsManager from '../systems/AnalyticsManager';
import TaskManager from '../systems/TaskManager';
import FileManager from '../systems/FileManager';
import NotesManager from '../systems/NotesManager';
import CollaborationWidget from '../systems/CollaborationWidget';
import FlashcardManager from '../systems/FlashcardManager';
import CodeEditorWidget from '../systems/CodeEditorWidget';
import SettingsManager from '../systems/SettingsManager';
import GlobalSearch from '../systems/GlobalSearch';
import PracticeArena from '../systems/PracticeArena';
import DesignStudio from '../systems/DesignStudio';
import DeepWorkManager from '../systems/DeepWorkManager';

// Dashboard Widgets re-used for context
import ClassesWidget from '../dashboard/ClassesWidget';
import QuickNote from '../dashboard/QuickNote';

// Icons
const Icons = {
    Home: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-9v9a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Courses: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    Assignments: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Analytics: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
    Resources: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    Collaboration: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Tools: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Bell: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    Menu: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    Tasks: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Practice: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    Design: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
    Brain: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
};

type PageId = 'home' | 'courses' | 'assignments' | 'schedule' | 'analytics' | 'resources' | 'collaboration' | 'tools' | 'tasks' | 'search' | 'settings' | 'practice' | 'design' | 'deepwork';
type ToolId = 'code' | 'flashcards';

interface PageConfig {
    id: PageId;
    label: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    subItems?: { id: ToolId, label: string }[];
}

// --- AGGREGATED WIDGETS FOR HOME DASHBOARD ---

const AssignmentsAggregator: React.FC = () => {
    const { semesters } = useAppContext();
    const allAssignments = useMemo(() => {
        const assignments: any[] = [];
        semesters.forEach(s => {
            s.courses?.forEach(c => {
                c.assignments?.forEach(a => {
                    if (!a.completed) {
                        assignments.push({ ...a, courseName: c.name, semester: s.name });
                    }
                });
            });
        });
        return assignments.sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));
    }, [semesters]);

    return (
        <div className="h-full flex flex-col bg-[rgba(255,255,255,0.03)] rounded-xl border border-white/5 p-4">
            <h3 className="font-bold text-gray-200 mb-3 flex items-center gap-2">
                <Icons.Assignments /> Pending Assignments
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                {allAssignments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No pending assignments.</p>
                ) : (
                    allAssignments.map((assign, i) => (
                        <div key={i} className="p-3 bg-black/20 rounded-lg border-l-4 border-yellow-500/50 hover:bg-black/30 transition-colors">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-sm text-gray-200">{assign.title}</span>
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{assign.dueDate}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{assign.courseName}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const MiniAnalytics: React.FC = () => {
    const { semesters } = useAppContext();
    const gpa = useMemo(() => {
         const allCourses = semesters.flatMap(s => s.courses || []);
         let totalCredits = 0;
         let points = 0;
         allCourses.forEach(c => {
             const cred = Number(c.credits) || 0;
             const grade = parseFloat(c.grade); // Simplified
             if (!isNaN(grade) && cred > 0 && grade <= 4.0) {
                 points += grade * cred;
                 totalCredits += cred;
             }
         });
         return totalCredits ? (points / totalCredits).toFixed(2) : "N/A";
    }, [semesters]);

    return (
        <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center h-32">
            <span className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Current GPA</span>
            <span className="text-4xl font-bold text-white mt-1">{gpa}</span>
        </div>
    );
};

const UpcomingEvents: React.FC = () => {
     const { events } = useAppContext();
     const upcoming = useMemo(() => {
         const now = new Date().toISOString().split('T')[0];
         return events.filter(e => e.date >= now).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3);
     }, [events]);

     return (
        <div className="h-full flex flex-col bg-[rgba(255,255,255,0.03)] rounded-xl border border-white/5 p-4">
            <h3 className="font-bold text-gray-200 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Upcoming Events
            </h3>
            <div className="space-y-2">
                {upcoming.length === 0 && <p className="text-gray-500 text-sm">No upcoming events.</p>}
                {upcoming.map((e, i) => (
                    <div key={i} className="flex gap-3 items-center text-sm">
                        <div className="w-10 text-center bg-white/5 rounded p-1">
                            <div className="text-[10px] uppercase text-red-400">{new Date(e.date).toLocaleString('default', {month: 'short'})}</div>
                            <div className="font-bold">{new Date(e.date).getDate()}</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-300">{e.title}</div>
                            <div className="text-[10px] text-gray-500">{e.time || 'All Day'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
     )
}

// --- MAIN WORKSPACE COMPONENT ---

const CSWorkspace: React.FC = () => {
    const [activePageId, setActivePageId] = useState<PageId>('home');
    const [activeToolId, setActiveToolId] = useState<ToolId>('code');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
    const [searchQuery, setSearchQuery] = useState('');

    const pages: PageConfig[] = [
        { id: 'home', label: 'Dashboard', icon: <Icons.Home />, component: null }, 
        { id: 'schedule', label: 'Schedule', icon: <Icons.Calendar />, component: <ClassesWidget isMaximized={true} /> },
        { id: 'courses', label: 'Courses', icon: <Icons.Courses />, component: <AcademicsManager /> },
        { id: 'practice', label: 'Practice Arena', icon: <Icons.Practice />, component: <PracticeArena /> },
        { id: 'design', label: 'Design Studio', icon: <Icons.Design />, component: <DesignStudio /> },
        { id: 'deepwork', label: 'Deep Work', icon: <Icons.Brain />, component: <DeepWorkManager /> },
        { id: 'tasks', label: 'Task List', icon: <Icons.Tasks />, component: <TaskManager /> },
        { id: 'analytics', label: 'Analytics', icon: <Icons.Analytics />, component: <AnalyticsManager /> },
        { id: 'resources', label: 'Resources', icon: <Icons.Resources />, component: <div className="flex flex-col lg:flex-row gap-4 h-full overflow-y-auto"><div className="flex-1 min-h-[400px]"><NotesManager /></div><div className="flex-1 min-h-[400px]"><FileManager /></div></div> },
        { id: 'collaboration', label: 'Collaboration', icon: <Icons.Collaboration />, component: <CollaborationWidget /> },
        { id: 'tools', label: 'Tools', icon: <Icons.Tools />, component: null }, 
        { id: 'search', label: 'Search', icon: <Icons.Search />, component: <GlobalSearch /> },
        { id: 'settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, component: <SettingsManager /> }
    ];

    // Dedicated Home Dashboard View
    const HomeDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full overflow-y-auto p-2">
            {/* Top Row: Quick Stats & Alerts */}
            <div className="col-span-1 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 h-max">
                 <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-white/5 h-64 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-200">Today's Schedule</h3>
                        <button onClick={() => setActivePageId('schedule')} className="text-xs text-[var(--grad-1)] hover:underline">View Full</button>
                    </div>
                    <div className="flex-grow overflow-hidden">
                         <ClassesWidget isMaximized={false} />
                    </div>
                 </div>
                 <div className="grid grid-rows-2 gap-4 h-64">
                     <MiniAnalytics />
                     <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                         <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Announcements</h4>
                         <div className="text-sm text-gray-300 truncate">Mid-term exams starting next week.</div>
                         <div className="text-xs text-gray-500 mt-1">Posted by Admin • 2h ago</div>
                         <button onClick={() => setActivePageId('collaboration')} className="mt-2 text-xs text-[var(--grad-1)] text-left">Check Board</button>
                     </div>
                 </div>
            </div>

            {/* Right Column: Assignments & Events */}
            <div className="col-span-1 md:col-span-4 grid grid-rows-2 gap-4 h-auto">
                 <AssignmentsAggregator />
                 <UpcomingEvents />
            </div>

            {/* Bottom Row: Quick Note / Bulletin */}
            <div className="col-span-1 md:col-span-12 h-64">
                 <div className="h-full bg-[rgba(255,255,255,0.03)] rounded-xl border border-white/5 p-4 flex flex-col">
                    <h3 className="font-bold text-gray-200 mb-2">Quick Notes / Bulletin</h3>
                    <div className="flex-grow overflow-hidden relative">
                        <QuickNote />
                    </div>
                 </div>
            </div>
        </div>
    );

    // Render Logic
    const renderContent = () => {
        if (activePageId === 'home') return <HomeDashboard />;
        if (activePageId === 'assignments') return (
             <div className="h-full flex flex-col">
                <div className="mb-4 flex-shrink-0"><h2 className="text-2xl font-bold mb-2">Assignments</h2></div>
                <div className="flex-grow bg-black/20 rounded-xl p-4 overflow-hidden"><AcademicsManager /></div>
            </div>
        );
        if (activePageId === 'tools') {
            return (
                <div className="h-full flex flex-col">
                    <div className="flex gap-4 mb-4 border-b border-white/10 pb-2 flex-shrink-0 overflow-x-auto">
                        <button onClick={() => setActiveToolId('code')} className={`px-4 py-2 rounded-lg transition-all ${activeToolId === 'code' ? 'bg-[var(--grad-1)] text-white' : 'text-gray-400 hover:bg-white/5'}`}>Code Editor</button>
                        <button onClick={() => setActiveToolId('flashcards')} className={`px-4 py-2 rounded-lg transition-all ${activeToolId === 'flashcards' ? 'bg-[var(--grad-1)] text-white' : 'text-gray-400 hover:bg-white/5'}`}>Flashcards</button>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        {activeToolId === 'code' ? <CodeEditorWidget /> : <FlashcardManager />}
                    </div>
                </div>
            )
        }
        const page = pages.find(p => p.id === activePageId);
        return page?.component || <div className="flex items-center justify-center h-full text-gray-500">Page under construction</div>;
    };

    return (
        <div className="flex h-full bg-[#0c0c0c] rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
            {/* Mobile Sidebar Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsSidebarOpen(false)} 
            />

            {/* Sidebar */}
            <aside 
                className={`absolute md:relative z-30 h-full bg-[#111] border-r border-white/5 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-64 overflow-hidden'}`}
            >
                <div className="p-5 flex items-center gap-3 border-b border-white/5 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        S
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">Student OS</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-400">✕</button>
                </div>
                
                <div className="flex-grow overflow-y-auto py-4 px-3 space-y-1">
                    <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-1">Main</div>
                    {pages.slice(0, 2).map(page => (
                        <button 
                            key={page.id} 
                            onClick={() => { setActivePageId(page.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activePageId === page.id ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-medium border border-[var(--grad-1)]/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                            {page.icon}
                            {page.label}
                        </button>
                    ))}
                    
                    <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-6">Academics & CS</div>
                    {pages.slice(2, 6).map(page => (
                        <button 
                            key={page.id} 
                            onClick={() => { setActivePageId(page.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activePageId === page.id ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-medium border border-[var(--grad-1)]/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                            {page.icon}
                            {page.label}
                        </button>
                    ))}

                    <div className="text-xs font-bold text-gray-500 uppercase px-3 mb-2 mt-6">Workspace</div>
                     {pages.slice(6).map(page => (
                        <button 
                            key={page.id} 
                            onClick={() => { setActivePageId(page.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activePageId === page.id ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-medium border border-[var(--grad-1)]/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                            {page.icon}
                            {page.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">U</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">User</p>
                            <p className="text-xs text-gray-500 truncate">Student</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0f0f0f]/50 backdrop-blur-md z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white transition-colors">
                            <Icons.Menu />
                        </button>
                        <h1 className="text-lg md:text-xl font-semibold text-white truncate">{pages.find(p => p.id === activePageId)?.label}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                         <div className="relative hidden md:block">
                             <input 
                                type="text" 
                                placeholder="Search workspace..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') setActivePageId('search'); }}
                                className="bg-black/20 border border-white/10 rounded-full py-1.5 px-4 pl-10 text-sm text-white focus:outline-none focus:border-[var(--grad-1)] transition-colors w-64"
                             />
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             </div>
                         </div>
                         <button className="p-2 text-gray-400 hover:text-white relative">
                             <Icons.Bell />
                             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0f0f0f]"></span>
                         </button>
                    </div>
                </header>

                {/* Scrollable View */}
                <div className="flex-grow overflow-hidden relative p-2 md:p-6 bg-[#0f0f0f]">
                     {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default CSWorkspace;
