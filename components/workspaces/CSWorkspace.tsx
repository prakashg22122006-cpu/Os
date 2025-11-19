
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import CodeEditorWidget from '../systems/CodeEditorWidget';
import TaskManager from '../systems/TaskManager';
import NotesManager from '../systems/NotesManager';
import FlashcardManager from '../systems/FlashcardManager';

// Icon Components
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-9v9a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const ProjectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const CardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

type PageId = 'home' | 'algorithms' | 'projects' | 'notes' | 'flashcards';

interface PageDefinition {
    id: PageId;
    title: string;
    icon: React.ReactNode;
    coverColor: string;
    description: string;
}

const PAGES: PageDefinition[] = [
    { id: 'home', title: 'Home', icon: <HomeIcon />, coverColor: 'bg-gradient-to-r from-indigo-900 to-slate-900', description: 'Your central hub for CS studies.' },
    { id: 'algorithms', title: 'Snippet Library', icon: <CodeIcon />, coverColor: 'bg-gradient-to-r from-emerald-900 to-teal-900', description: 'Store reusable code and algorithm implementations.' },
    { id: 'projects', title: 'Dev Projects', icon: <ProjectIcon />, coverColor: 'bg-gradient-to-r from-blue-900 to-cyan-900', description: 'Track your development pipeline.' },
    { id: 'notes', title: 'Theory Notes', icon: <BookIcon />, coverColor: 'bg-gradient-to-r from-amber-900 to-orange-900', description: 'Lecture notes and documentation.' },
    { id: 'flashcards', title: 'Concept Drill', icon: <CardIcon />, coverColor: 'bg-gradient-to-r from-rose-900 to-pink-900', description: 'Spaced repetition for technical interviews.' },
];

const SidebarItem: React.FC<{ page: PageDefinition, isActive: boolean, onClick: () => void }> = ({ page, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
    >
        <span className="opacity-70">{page.icon}</span>
        {page.title}
    </button>
);

const HomePage: React.FC = () => {
    const { tasks, codeSnippets } = useAppContext();
    const pendingTasks = tasks.filter(t => t.status !== 'Done').slice(0, 5);
    const recentSnippets = codeSnippets.slice(0, 3);

    return (
        <div className="space-y-8">
            {/* Quick Links Block */}
            <section>
                <h3 className="text-lg font-bold mb-3 border-b border-white/10 pb-1">Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['LeetCode', 'GitHub', 'Stack Overflow', 'MDN Web Docs'].map(site => (
                        <div key={site} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                            <span className="font-semibold">{site}</span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                     <h3 className="text-lg font-bold mb-3 border-b border-white/10 pb-1">High Priority Tasks</h3>
                     <div className="space-y-2">
                         {pendingTasks.map(task => (
                             <div key={task.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                 <div className={`w-2 h-2 rounded-full ${task.priority === 'Urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                 <span className="text-sm">{task.title}</span>
                             </div>
                         ))}
                         {pendingTasks.length === 0 && <p className="text-gray-500 text-sm">No pending tasks.</p>}
                     </div>
                </section>
                <section>
                     <h3 className="text-lg font-bold mb-3 border-b border-white/10 pb-1">Recent Snippets</h3>
                     <div className="space-y-2">
                         {recentSnippets.map(snippet => (
                             <div key={snippet.id} className="p-2 bg-white/5 rounded-lg border-l-2 border-purple-500">
                                 <div className="flex justify-between">
                                     <span className="text-sm font-mono">{snippet.title}</span>
                                     <span className="text-xs text-gray-500">{snippet.language}</span>
                                 </div>
                             </div>
                         ))}
                         {recentSnippets.length === 0 && <p className="text-gray-500 text-sm">No snippets saved.</p>}
                     </div>
                </section>
            </div>
        </div>
    );
}

const CSWorkspace: React.FC = () => {
    const [activePageId, setActivePageId] = useState<PageId>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const activePage = PAGES.find(p => p.id === activePageId) || PAGES[0];

    const renderContent = () => {
        switch (activePageId) {
            case 'home': return <HomePage />;
            case 'algorithms': return <div className="h-full"><CodeEditorWidget /></div>;
            case 'projects': return <div className="h-full"><TaskManager /></div>;
            case 'notes': return <div className="h-full"><NotesManager /></div>;
            case 'flashcards': return <div className="h-full"><FlashcardManager /></div>;
            default: return <div>Page not found</div>;
        }
    };

    return (
        <div className="flex h-full bg-[#0f0f0f] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Sidebar */}
            <div className={`flex-shrink-0 bg-[#161616] border-r border-white/5 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-60' : 'w-0 overflow-hidden'}`}>
                <div className="p-4 flex items-center gap-2 font-bold text-gray-200">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">CS</div>
                    <span>Workspace</span>
                </div>
                <div className="flex-grow px-2 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-3 mt-4 mb-2">Pages</div>
                    {PAGES.map(page => (
                        <SidebarItem 
                            key={page.id} 
                            page={page} 
                            isActive={activePageId === page.id} 
                            onClick={() => setActivePageId(page.id)} 
                        />
                    ))}
                </div>
                <div className="p-4 border-t border-white/5 text-xs text-gray-500">
                    v2.0 • CS Edition
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col min-w-0 bg-[#0f0f0f] relative">
                {/* Toggle Sidebar Button (Absolute) */}
                 <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute top-4 z-20 p-1 hover:bg-white/10 rounded text-gray-400 transition-all ${isSidebarOpen ? 'left-2 opacity-0 hover:opacity-100' : 'left-2 opacity-100'}`}
                    title="Toggle Sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                {/* Cover Image */}
                <div className={`h-40 w-full ${activePage.coverColor} relative flex-shrink-0`}>
                    <div className="absolute -bottom-8 left-12 w-16 h-16 bg-[#0f0f0f] rounded-lg flex items-center justify-center text-3xl shadow-lg border border-white/10">
                        {activePage.icon}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-grow overflow-y-auto px-12 pt-12 pb-8 custom-scrollbar flex flex-col">
                    <header className="mb-8 flex-shrink-0">
                        <h1 className="text-4xl font-bold text-white mb-2">{activePage.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Workspace</span>
                            <ChevronRight />
                            <span>{activePage.title}</span>
                        </div>
                        <p className="text-gray-400 mt-4 max-w-2xl leading-relaxed">{activePage.description}</p>
                    </header>
                    
                    <div className="flex-grow animate-fade-in min-h-[400px] flex flex-col">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSWorkspace;
