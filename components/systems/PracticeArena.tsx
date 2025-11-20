
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PracticeItem, PracticeType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const PRACTICE_TYPES: { id: PracticeType; label: string; icon: string }[] = [
    { id: 'question', label: 'Questions', icon: '❓' },
    { id: 'drill', label: 'Skill Drills', icon: '⚡' },
    { id: 'kata', label: 'Coding Katas', icon: '🥋' },
    { id: 'debug', label: 'Debugging', icon: '🐛' },
];

const EditorModal: React.FC<{
    item: Partial<PracticeItem>;
    onSave: (item: PracticeItem) => void;
    onClose: () => void;
    onDelete?: (id: number) => void;
}> = ({ item, onSave, onClose, onDelete }) => {
    const [formData, setFormData] = useState<Partial<PracticeItem>>(item);

    const handleSubmit = () => {
        if (!formData.title || !formData.content) return alert('Title and content are required');
        onSave({
            id: item.id || Date.now(),
            type: item.type || 'question',
            title: formData.title,
            description: formData.description || '',
            content: formData.content,
            solution: formData.solution || '',
            tags: formData.tags || [],
            difficulty: formData.difficulty || 'Medium',
            timeLimit: formData.timeLimit || 0,
            attempts: formData.attempts || 0,
            successRate: formData.successRate || 0,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{item.id ? 'Edit' : 'New'} {PRACTICE_TYPES.find(t => t.id === item.type)?.label}</h3>
                    {item.id && onDelete && <Button variant="outline" className="text-xs text-red-400" onClick={() => onDelete(item.id!)}>Delete</Button>}
                </header>
                <main className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                         <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" />
                         <select 
                            value={formData.difficulty} 
                            onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                            className="glass-select w-full"
                         >
                             <option value="Easy">Easy</option>
                             <option value="Medium">Medium</option>
                             <option value="Hard">Hard</option>
                         </select>
                    </div>
                    <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Short description or context..." 
                        className="glass-textarea w-full h-20"
                    />
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                            {item.type === 'kata' || item.type === 'debug' ? 'Code Snippet / Challenge' : 'Question Text'}
                        </label>
                        <textarea 
                            value={formData.content} 
                            onChange={e => setFormData({...formData, content: e.target.value})} 
                            className="glass-textarea w-full h-40 font-mono text-sm"
                            spellCheck={false}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                            {item.type === 'kata' || item.type === 'debug' ? 'Solution / Fixed Code' : 'Answer Key'}
                        </label>
                        <textarea 
                            value={formData.solution} 
                            onChange={e => setFormData({...formData, solution: e.target.value})} 
                            className="glass-textarea w-full h-32 font-mono text-sm"
                            spellCheck={false}
                        />
                    </div>
                    <Input 
                        value={formData.tags?.join(', ')} 
                        onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} 
                        placeholder="Tags (comma separated)" 
                    />
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t border-white/10">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save</Button>
                </footer>
            </div>
        </div>
    );
};

const PracticeSession: React.FC<{ item: PracticeItem, onClose: () => void }> = ({ item, onClose }) => {
    const [showSolution, setShowSolution] = useState(false);
    const [userCode, setUserCode] = useState(item.type === 'debug' ? item.content : '');
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    // Simple timer
    React.useEffect(() => {
        let interval: number;
        if(isRunning) {
            interval = window.setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            <header className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {item.title} 
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{item.difficulty}</span>
                    </h2>
                    <div className="text-mono text-green-400 font-bold text-lg">{formatTime(timer)}</div>
                </div>
                <div className="flex gap-2">
                    <Button variant="glass" onClick={() => setShowSolution(!showSolution)}>{showSolution ? 'Hide Solution' : 'Show Solution'}</Button>
                    <Button onClick={onClose}>End Session</Button>
                </div>
            </header>
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto border-r border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Problem</h4>
                    <div className="prose prose-invert max-w-none mb-6">
                        <p>{item.description}</p>
                        {(item.type === 'question' || item.type === 'drill') && (
                            <div className="bg-white/5 p-4 rounded-lg text-lg font-medium">{item.content}</div>
                        )}
                    </div>
                     {(item.type === 'kata' || item.type === 'debug') && (
                         <div className="mb-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Source / Context</h4>
                            <pre className="bg-black/30 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-white/5">
                                {item.content}
                            </pre>
                         </div>
                     )}
                </div>
                <div className="flex-1 p-6 flex flex-col bg-[#050505]">
                    {(item.type === 'kata' || item.type === 'debug') ? (
                         <div className="flex-grow flex flex-col">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Workspace</h4>
                            <textarea 
                                value={userCode} 
                                onChange={e => setUserCode(e.target.value)}
                                className="flex-grow bg-[#111] text-gray-300 font-mono p-4 rounded-lg resize-none border border-white/10 focus:border-[var(--grad-1)] outline-none"
                                placeholder="Type your solution here..."
                                spellCheck={false}
                            />
                         </div>
                    ) : (
                         <div className="flex-grow flex flex-col">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Your Answer</h4>
                             <textarea 
                                className="flex-grow bg-[#111] text-gray-300 p-4 rounded-lg resize-none border border-white/10 focus:border-[var(--grad-1)] outline-none"
                                placeholder="Write your answer or notes here..."
                            />
                         </div>
                    )}
                    {showSolution && (
                        <div className="mt-4 h-1/3 bg-[#1a1a1a] p-4 rounded-lg border border-green-900/30 overflow-y-auto animate-fade-in-up">
                            <h4 className="text-sm font-bold text-green-400 uppercase mb-2">Solution</h4>
                            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">{item.solution || 'No solution provided.'}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PracticeArena: React.FC = () => {
    const { practiceItems, setPracticeItems } = useAppContext();
    const [activeType, setActiveType] = useState<PracticeType>('question');
    const [editingItem, setEditingItem] = useState<Partial<PracticeItem> | null>(null);
    const [activeSessionItem, setActiveSessionItem] = useState<PracticeItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        return practiceItems.filter(item => 
            item.type === activeType && 
            (item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [practiceItems, activeType, searchTerm]);

    const handleSave = (item: PracticeItem) => {
        setPracticeItems(prev => {
            const index = prev.findIndex(p => p.id === item.id);
            if(index >= 0) {
                const newItems = [...prev];
                newItems[index] = item;
                return newItems;
            }
            return [...prev, item];
        });
        setEditingItem(null);
    };

    const handleDelete = (id: number) => {
        if(window.confirm('Delete this item?')) {
            setPracticeItems(prev => prev.filter(p => p.id !== id));
            setEditingItem(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                    {PRACTICE_TYPES.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveType(t.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeType === t.id ? 'bg-[var(--grad-1)] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>{t.icon}</span>
                            <span className="hidden sm:block">{t.label}</span>
                        </button>
                    ))}
                </div>
                <Button onClick={() => setEditingItem({ type: activeType })}>+ Add New</Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <Input placeholder="Search items or tags..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-grow pb-4 pr-2">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-10 border-2 border-dashed border-white/5 rounded-xl">
                        <p>No items found.</p>
                        <Button variant="glass" className="mt-4" onClick={() => setEditingItem({ type: activeType })}>Create one</Button>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-all group relative flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' : item.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                    {item.difficulty}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingItem(item)} className="p-1 hover:bg-white/20 rounded text-xs">✏️</button>
                                </div>
                            </div>
                            <h4 className="font-bold text-lg mb-1 truncate" title={item.title}>{item.title}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2 flex-grow mb-4">{item.description || item.content}</p>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {item.tags.map(t => <span key={t} className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-500">#{t}</span>)}
                            </div>
                            <Button className="w-full" onClick={() => setActiveSessionItem(item)}>Start Practice</Button>
                        </div>
                    ))
                )}
            </div>

            {editingItem && (
                <EditorModal 
                    item={editingItem} 
                    onSave={handleSave} 
                    onClose={() => setEditingItem(null)} 
                    onDelete={handleDelete}
                />
            )}

            {activeSessionItem && (
                <PracticeSession 
                    item={activeSessionItem} 
                    onClose={() => setActiveSessionItem(null)} 
                />
            )}
        </div>
    );
};

export default PracticeArena;
