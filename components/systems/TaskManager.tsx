
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

const PRIORITY_CONFIG: Record<TaskPriority, { color: string, label: string, bg: string }> = {
    'Urgent': { color: 'text-red-200', bg: 'bg-red-500/40 border-red-500', label: 'Urgent' },
    'High': { color: 'text-orange-200', bg: 'bg-orange-500/40 border-orange-500', label: 'High' },
    'Medium': { color: 'text-yellow-200', bg: 'bg-yellow-500/40 border-yellow-500', label: 'Medium' },
    'Low': { color: 'text-blue-200', bg: 'bg-blue-500/40 border-blue-500', label: 'Low' },
    'None': { color: 'text-gray-300', bg: 'bg-gray-500/20 border-gray-500', label: 'None' },
};

const PRIORITY_ORDER: Record<Task['priority'], number> = {
    'Urgent': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'None': 1,
};

const SubtaskProgressBar: React.FC<{ total: number, completed: number }> = ({ total, completed }) => {
    if (total === 0) return null;
    const percentage = (completed / total) * 100;
    return (
        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[var(--grad-1)] transition-all duration-300" style={{ width: `${percentage}%` }} />
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
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const totalSubtasks = task.subtasks.length;
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['None'];

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onClick={onClick}
            className="group relative bg-white/5 hover:bg-white/10 p-3 rounded-xl cursor-pointer border border-white/5 hover:border-white/20 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityConfig.bg} ${priorityConfig.color} font-bold uppercase tracking-wider`}>
                    {priorityConfig.label}
                </span>
                {task.dueDate && (
                    <span className={`text-[10px] ${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                         {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>
            
            <p className={`font-bold text-sm text-gray-200 line-clamp-2 mb-1 ${task.status === 'Done' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
            </p>
            
            {totalSubtasks > 0 && (
                <div className="mb-1">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                        <span>Subtasks</span>
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <SubtaskProgressBar total={totalSubtasks} completed={completedSubtasks} />
                </div>
            )}

            <div className="flex gap-2 mt-2 text-xs text-gray-500">
                 {task.attachments.length > 0 && <span className="flex items-center gap-1">📎 {task.attachments.length}</span>}
                 {task.description && <span className="flex items-center gap-1">📝</span>}
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
            className={`bg-black/20 p-3 rounded-xl min-h-[300px] flex flex-col border border-white/5 transition-colors ${dropIndicator?.status === status ? 'bg-white/5 border-dashed border-[var(--grad-1)]' : ''}`}
        >
            <div className="flex justify-between items-center mb-3 px-1">
                <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider">{status}</h4>
                <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="space-y-2 flex-grow">
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
                {tasks.length === 0 && <div className="h-24 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-xs text-gray-600">Empty</div>}
            </div>
        </div>
    );
};

const ListView: React.FC<{ tasks: Task[]; onTaskClick: (task: Task) => void }> = ({ tasks, onTaskClick }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase text-xs">
                    <tr>
                        <th className="p-3 rounded-tl-lg">Status</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Subtasks</th>
                        <th className="p-3 rounded-tr-lg">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tasks.map(task => {
                        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
                        const priorityConfig = PRIORITY_CONFIG[task.priority];
                        return (
                            <tr key={task.id} onClick={() => onTaskClick(task)} className="hover:bg-white/5 transition-colors cursor-pointer">
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${task.status === 'Done' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="p-3 font-medium text-gray-200">{task.title}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${priorityConfig.bg} ${priorityConfig.color}`}>
                                        {priorityConfig.label}
                                    </span>
                                </td>
                                <td className="p-3">
                                    {task.subtasks.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--grad-1)]" style={{ width: `${(completedSubtasks/task.subtasks.length)*100}%` }} />
                                            </div>
                                            <span className="text-xs">{completedSubtasks}/{task.subtasks.length}</span>
                                        </div>
                                    ) : <span className="text-gray-600">-</span>}
                                </td>
                                <td className="p-3">{task.dueDate || '-'}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {tasks.length === 0 && <p className="text-center p-8 text-gray-500">No tasks found matching your filters.</p>}
        </div>
    );
}

const ImportPreviewModal: React.FC<{ fileContent: Task[]; onConfirm: (tasks: Task[]) => void; onClose: () => void; }> = ({ fileContent, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">Import Preview</h4></header>
                <main className="p-4">
                    <p className="mb-2">Found {fileContent.length} tasks. This will <span className="font-bold text-red-400">OVERWRITE</span> all existing tasks. Are you sure?</p>
                    <div className="max-h-60 overflow-y-auto bg-black/20 p-2 rounded-lg space-y-1 text-sm">
                        {fileContent.slice(0, 10).map((task, i) => <p key={i} className="truncate"> • {task.title}</p>)}
                        {fileContent.length > 10 && <p>...and {fileContent.length - 10} more.</p>}
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(fileContent)}>Confirm & Overwrite</Button>
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
    const [dropIndicator, setDropIndicator] = useState<{ status: TaskStatus; index: number } | null>(null);
    
    // View Controls
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
            return matchesSearch && matchesPriority;
        });
    }, [tasks, searchQuery, priorityFilter]);

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { Backlog: [], 'In Progress': [], Review: [], Done: [] };
        const sortedTasks = [...filteredTasks].sort((a, b) => {
            const priorityDiff = (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1);
            if (priorityDiff !== 0) return priorityDiff;
            return b.updatedAt - a.updatedAt;
        });
        sortedTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        return grouped;
    }, [filteredTasks]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        e.dataTransfer.setData('taskId', String(taskId));
        setDraggedTaskId(taskId);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDropIndicator(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
        if (!taskId || !draggedTaskId) return;

        const taskToMove = tasks.find(t => t.id === taskId);
        if (taskToMove && targetStatus === 'Done' && taskToMove.status !== 'Done') {
            setEngagementLogs(prev => [...prev, {
                ts: Date.now(),
                activity: 'complete_task',
                details: { id: taskToMove.id, name: taskToMove.title }
            }]);
        }

        setTasks(prev => prev.map(task =>
            task.id === taskId
                ? { ...task, status: targetStatus, updatedAt: Date.now() }
                : task
        ));
        setDropIndicator(null);
    };
    
    const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDropIndicator({ status, index: -1 });
    };
    
    const handleAddTask = () => {
        const title = prompt("New task title:");
        if (title) {
            const newTask: Task = {
                id: Date.now(),
                title,
                status: 'Backlog',
                priority: 'None',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                attachments: [],
                subtasks: [],
                dependencies: []
            };
            setTasks(prev => [newTask, ...prev]);
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedTasks = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedTasks)) {
                    if (importedTasks.every(t => 'id' in t && 'title' in t && 'status' in t)) {
                        setImportPreview(importedTasks);
                    } else {
                         alert('Invalid task structure in JSON file.');
                    }
                } else {
                    alert('Invalid file format. Expected a JSON array.');
                }
            } catch (error) {
                alert('Error parsing file.');
            } finally {
                if (importFileRef.current) importFileRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = (importedTasks: Task[]) => {
        setTasks(importedTasks);
        setImportPreview(null);
        alert('Tasks imported successfully');
    };

    const COLUMNS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

    return (
        <div ref={containerRef} className={`bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-4 rounded-xl h-full flex flex-col ${isFullScreen ? 'h-screen w-screen overflow-y-auto' : ''}`}>
            {importPreview && <ImportPreviewModal fileContent={importPreview} onConfirm={confirmImport} onClose={() => setImportPreview(null)} />}
            
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3 flex-shrink-0">
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('board')} 
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        Board
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        List
                    </button>
                </div>
                
                <div className="flex flex-grow gap-2 w-full lg:w-auto">
                    <div className="relative flex-grow lg:w-64">
                         <Input 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder="Search tasks..." 
                            className="!py-1.5 !text-sm w-full pl-8" 
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select 
                        value={priorityFilter} 
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                        className="glass-select !py-1.5 !text-sm w-32"
                    >
                        <option value="All">All Priorities</option>
                        {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <Button onClick={handleAddTask} className="!py-1.5 !px-3 text-sm">+ Add Task</Button>
                    <div className="flex bg-black/20 rounded-lg p-0.5">
                        <Button variant="glass" onClick={toggleFullScreen} className="!p-1.5" title="Full Screen">⛶</Button>
                        <Button variant="glass" onClick={() => downloadJSON(tasks, 'tasks.json')} className="!p-1.5" title="Export">⬇</Button>
                        <Button variant="glass" onClick={() => importFileRef.current?.click()} className="!p-1.5" title="Import">⬆</Button>
                    </div>
                    <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                {viewMode === 'board' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                        {COLUMNS.map(status => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                tasks={tasksByStatus[status]}
                                dropIndicator={dropIndicator}
                                onTaskClick={(task) => setViewingTask(task)}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onTaskDragOver={handleTaskDragOver}
                                onColumnDragOver={handleColumnDragOver}
                                onDrop={handleDrop}
                            />
                        ))}
                    </div>
                ) : (
                    <ListView tasks={filteredTasks} onTaskClick={setViewingTask} />
                )}
            </div>
        </div>
    );
};

export default TaskManager;
