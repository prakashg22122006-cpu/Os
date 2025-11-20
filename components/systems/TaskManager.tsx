
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string, bg: string, label: string, dot: string }> = {
    'Urgent': { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', label: 'Urgent', dot: 'bg-red-400' },
    'High': { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', label: 'High', dot: 'bg-orange-400' },
    'Medium': { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', label: 'Medium', dot: 'bg-yellow-400' },
    'Low': { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', label: 'Low', dot: 'bg-blue-400' },
    'None': { color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/20', label: 'None', dot: 'bg-gray-500' },
};

const STATUS_CONFIG: Record<TaskStatus, { color: string, bg: string }> = {
    'Done': { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'In Progress': { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'Review': { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    'Backlog': { color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
};

const SubtaskProgressBar: React.FC<{ total: number, completed: number }> = ({ total, completed }) => {
    if (total === 0) return null;
    const percentage = (completed / total) * 100;
    const colorClass = percentage === 100 ? 'bg-emerald-500' : 'bg-[var(--grad-1)]';
    return (
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
        </div>
    );
};

const TaskCard: React.FC<{
    task: Task;
    onClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ task, onClick, onDragStart, onDragEnd, onDragOver }) => {
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['None'];

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onClick={onClick}
            className="group bg-[#1e1e1e] p-4 rounded-xl border border-white/5 hover:border-white/20 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] active:shadow-none"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityConfig.dot}`} />
            <div className="pl-2">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityConfig.bg} ${priorityConfig.color}`}>
                        {priorityConfig.label}
                    </span>
                    {task.dueDate && (
                        <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                             {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
                <h4 className={`text-sm font-medium text-gray-200 mb-2 line-clamp-2 leading-snug ${task.status === 'Done' ? 'line-through text-gray-500' : ''}`}>{task.title}</h4>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        {(task.attachments || []).length > 0 && <span title="Attachments">📎 {(task.attachments || []).length}</span>}
                        {(task.dependencies || []).length > 0 && <span title="Dependencies">🔗 {(task.dependencies || []).length}</span>}
                    </div>
                    {totalSubtasks > 0 && (
                         <span className="text-[10px] text-gray-500">{completedSubtasks}/{totalSubtasks}</span>
                    )}
                </div>
                {totalSubtasks > 0 && <SubtaskProgressBar total={totalSubtasks} completed={completedSubtasks} />}
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: TaskStatus;
    tasks: Task[];
    dropIndicator: { status: TaskStatus; index: number } | null;
    onTaskClick: (task: Task) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onTaskDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onColumnDragOver: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
}> = ({ status, tasks, dropIndicator, onTaskClick, onDragStart, onDragEnd, onTaskDragOver, onColumnDragOver, onDrop }) => {
    return (
        <div
            onDragOver={(e) => onColumnDragOver(e, status)}
            onDrop={(e) => onDrop(e, status)}
            className={`flex flex-col min-w-[280px] w-80 bg-[#121212] rounded-2xl border border-white/5 transition-colors ${dropIndicator?.status === status ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
        >
            <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#121212] z-10 rounded-t-2xl backdrop-blur-md">
                <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color.replace('text-', 'bg-').replace('-400', '-500')}`} />
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">{status}</h3>
                </div>
                <span className="text-[10px] font-mono bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="flex-grow p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {tasks.map((task) => (
                     <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task)}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onDragOver={onTaskDragOver}
                    />
                ))}
                 {tasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 py-10 opacity-50">
                        <div className="text-xs border border-dashed border-gray-700 px-4 py-2 rounded-lg">No Tasks</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ListView: React.FC<{ tasks: Task[]; onTaskClick: (task: Task) => void }> = ({ tasks, onTaskClick }) => {
    return (
        <div className="w-full h-full overflow-hidden flex flex-col bg-[#0c0c0c]">
            <div className="overflow-auto flex-grow custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-[#0c0c0c]/95 backdrop-blur-sm text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/10 shadow-sm">
                        <tr>
                            <th className="py-4 px-6 w-40">Status</th>
                            <th className="py-4 px-6">Title</th>
                            <th className="py-4 px-6 w-32">Priority</th>
                            <th className="py-4 px-6 w-32 text-center">Progress</th>
                            <th className="py-4 px-6 w-24 text-center">Meta</th>
                            <th className="py-4 px-6 w-32 text-right">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tasks.map(task => {
                            const subtasks = task.subtasks || [];
                            const completedSubtasks = subtasks.filter(st => st.completed).length;
                            const priorityConfig = PRIORITY_CONFIG[task.priority];
                            const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['Backlog'];
                            
                            return (
                                <tr 
                                    key={task.id} 
                                    onClick={() => onTaskClick(task)} 
                                    className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                                >
                                    <td className="py-3 px-6 align-middle">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.color} shadow-sm`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 align-middle">
                                        <span className={`text-sm font-medium text-gray-200 group-hover:text-white transition-colors ${task.status === 'Done' ? 'line-through text-gray-600' : ''}`}>
                                            {task.title}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 align-middle">
                                        <div className="flex items-center gap-2">
                                             <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
                                             <span className={`text-xs ${priorityConfig.color} font-medium`}>{priorityConfig.label}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 align-middle">
                                         {subtasks.length > 0 ? (
                                            <div className="w-24 mx-auto">
                                                <div className="flex justify-end text-[9px] text-gray-500 mb-1">
                                                    <span>{Math.round((completedSubtasks/subtasks.length)*100)}%</span>
                                                </div>
                                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${completedSubtasks === subtasks.length ? 'bg-emerald-500' : 'bg-[var(--grad-1)]'} transition-all`} style={{ width: `${(completedSubtasks/subtasks.length)*100}%` }} />
                                                </div>
                                            </div>
                                        ) : <div className="text-center text-gray-800 text-xs">—</div>}
                                    </td>
                                    <td className="py-3 px-6 align-middle text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-500">
                                            {(task.attachments || []).length > 0 && <span title="Attachments">📎</span>}
                                            {(task.dependencies || []).length > 0 && <span title="Dependencies">🔗</span>}
                                            {!(task.attachments || []).length && !(task.dependencies || []).length && <span className="text-gray-800 text-xs">—</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 align-middle text-right text-xs font-mono text-gray-400">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {tasks.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="text-gray-400 text-sm">No tasks found matching your filters.</p>
                        <p className="text-gray-600 text-xs mt-1">Create a new task to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const ImportPreviewModal: React.FC<{ fileContent: Task[]; onConfirm: (tasks: Task[]) => void; onClose: () => void; }> = ({ fileContent, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#151515] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="p-5 border-b border-white/10"><h4 className="font-bold text-lg text-white">Import Preview</h4></header>
                <main className="p-6">
                    <p className="mb-4 text-gray-300">Found <strong className="text-white">{fileContent.length}</strong> tasks. This will <span className="text-red-400 font-bold">OVERWRITE</span> existing tasks. Proceed?</p>
                    <div className="max-h-60 overflow-y-auto bg-black/30 p-3 rounded-lg space-y-1 text-xs font-mono text-gray-400 border border-white/5">
                        {fileContent.slice(0, 10).map((task, i) => <p key={i} className="truncate text-gray-300">• {task.title}</p>)}
                        {fileContent.length > 10 && <p className="italic opacity-50">...and {fileContent.length - 10} more.</p>}
                    </div>
                </main>
                <footer className="p-5 flex gap-3 justify-end border-t border-white/10 bg-white/[0.02]">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(fileContent)}>Confirm Import</Button>
                </footer>
            </div>
        </div>
    );
};

const TaskManager: React.FC = () => {
    const { tasks, setTasks, setViewingTask, setEngagementLogs } = useAppContext();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const [importPreview, setImportPreview] = useState<Task[] | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
    const [sortOption, setSortOption] = useState('priority');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dropIndicator, setDropIndicator] = useState<{ status: TaskStatus; index: number } | null>(null);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleAddTask = () => {
        const title = prompt("Task Title:");
        if (title) {
            const newTask: Task = {
                id: Date.now(),
                title,
                status: 'Backlog',
                priority: 'None',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                attachments: [], subtasks: [], dependencies: [],
            };
            setTasks(prev => [newTask, ...prev]);
        }
    };

    const filteredTasks = useMemo(() => {
        let result = [...tasks];
        if (filterStatus !== 'all') {
            result = result.filter(t => t.status === filterStatus);
        }
        
        const priorityOrder: Record<TaskPriority, number> = { 'Urgent': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'None': 1 };
        
        result.sort((a, b) => {
            if (sortOption === 'priority') {
                const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
                return diff !== 0 ? diff : b.updatedAt - a.updatedAt;
            } else if (sortOption === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            } else {
                return b.createdAt - a.createdAt;
            }
        });

        return result;
    }, [tasks, filterStatus, sortOption]);

    const kanbanGrouped = useMemo(() => {
        const groups: Record<TaskStatus, Task[]> = { 'Backlog': [], 'In Progress': [], 'Review': [], 'Done': [] };
        filteredTasks.forEach(t => {
            if (groups[t.status]) groups[t.status].push(t);
        });
        return groups;
    }, [filteredTasks]);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    setImportPreview(data);
                } else {
                    alert("Invalid format. Expected an array of tasks.");
                }
            } catch (err) { alert("Error parsing JSON."); }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    const confirmImport = (importedTasks: Task[]) => {
        setTasks(importedTasks);
        setImportPreview(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('taskId', String(taskId));
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDropIndicator(null);
    };
    const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDropIndicator({ status, index: 0 });
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('taskId'));
        if (taskId && tasks.find(t => t.id === taskId)) {
             setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, updatedAt: Date.now() } : t));
             if (status === 'Done') {
                 const task = tasks.find(t => t.id === taskId);
                 if(task) setEngagementLogs(p => [...p, { ts: Date.now(), activity: 'complete_task', details: { id: task.id, name: task.title } }]);
             }
        }
        setDropIndicator(null);
    };

    return (
        <div ref={containerRef} className={`flex flex-col h-full bg-[#0c0c0c] rounded-2xl border border-white/5 shadow-2xl overflow-hidden ${isFullScreen ? 'fixed inset-0 z-[100] p-0 rounded-none' : ''}`}>
            
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-4 p-4 md:p-6 border-b border-white/5 bg-[#0c0c0c] z-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center shadow-sm">
                             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Task List</h2>
                            <p className="text-xs text-gray-500 font-medium">Manage your projects & to-dos</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setViewMode('kanban')} 
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'kanban' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Board
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            List
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row justify-between gap-4 pt-2 mt-2 border-t border-white/5">
                    <div className="flex gap-2 items-center">
                        <Button onClick={handleAddTask} className="text-xs font-bold px-4 py-2 bg-[var(--grad-1)] hover:brightness-110 border-0 shadow-lg shadow-indigo-500/20">+ Add Task</Button>
                        <div className="h-6 w-px bg-white/10 mx-1"></div>
                        <Button variant="glass" onClick={() => importFileRef.current?.click()} className="text-xs text-gray-400 hover:text-white border-dashed border-white/10">Import</Button>
                        <Button variant="glass" onClick={() => downloadJSON(tasks, 'tasks.json')} className="text-xs text-gray-400 hover:text-white border-dashed border-white/10">Export</Button>
                        <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)} 
                                className="appearance-none bg-[#151515] text-gray-400 text-xs font-bold px-4 py-2 pr-8 rounded-lg border border-white/10 focus:outline-none focus:border-[var(--grad-1)] hover:border-white/20 transition-colors cursor-pointer w-32"
                            >
                                <option value="all">All Status</option>
                                <option value="Backlog">Backlog</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Review">Review</option>
                                <option value="Done">Done</option>
                            </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">▼</div>
                        </div>
                        <div className="relative group">
                            <select 
                                value={sortOption} 
                                onChange={(e) => setSortOption(e.target.value)} 
                                className="appearance-none bg-[#151515] text-gray-400 text-xs font-bold px-4 py-2 pr-8 rounded-lg border border-white/10 focus:outline-none focus:border-[var(--grad-1)] hover:border-white/20 transition-colors cursor-pointer w-32"
                            >
                                <option value="priority">Priority</option>
                                <option value="dueDate">Due Date</option>
                                <option value="recent">Recent</option>
                            </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">▼</div>
                        </div>
                         <button onClick={toggleFullScreen} className="p-2 text-gray-500 hover:text-white bg-[#151515] rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* View Area */}
            <div className="flex-grow overflow-hidden bg-[#0c0c0c] relative">
                {viewMode === 'list' ? (
                    <ListView tasks={filteredTasks} onTaskClick={setViewingTask} />
                ) : (
                    <div className="h-full overflow-x-auto overflow-y-hidden p-6 flex gap-6 items-start">
                        {(['Backlog', 'In Progress', 'Review', 'Done'] as TaskStatus[]).map(status => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                tasks={kanbanGrouped[status]}
                                dropIndicator={dropIndicator}
                                onTaskClick={setViewingTask}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onTaskDragOver={(e) => e.preventDefault()}
                                onColumnDragOver={handleColumnDragOver}
                                onDrop={handleDrop}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {importPreview && (
                <ImportPreviewModal 
                    fileContent={importPreview} 
                    onConfirm={confirmImport} 
                    onClose={() => setImportPreview(null)} 
                />
            )}
        </div>
    );
};

export default TaskManager;
