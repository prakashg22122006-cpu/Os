
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
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['None'];
    const attachmentsCount = (task.attachments || []).length;
    const dependenciesCount = (task.dependencies || []).length;

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

            <div className="flex gap-2 mt-2 text-xs text-gray-500 items-center">
                 {attachmentsCount > 0 && <span className="flex items-center gap-1" title="Attachments">📎 {attachmentsCount}</span>}
                 {dependenciesCount > 0 && <span className="flex items-center gap-1 text-yellow-500" title="Dependencies">🔗 {dependenciesCount}</span>}
                 {task.description && <span className="flex items-center gap-1" title="Description">📝</span>}
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

const ListView: React.FC<{ tasks: Task[]; onTaskClick: (task: Task) => void; sortOption: string }> = ({ tasks, onTaskClick, sortOption }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase text-xs">
                    <tr>
                        <th className="p-3 rounded-tl-lg">Status</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Subtasks</th>
                        <th className="p-3">Dependencies</th>
                        <th className="p-3 rounded-tr-lg">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tasks.map(task => {
                        const subtasks = task.subtasks || [];
                        const completedSubtasks = subtasks.filter(st => st.completed).length;
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
                                    {subtasks.length > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--grad-1)]" style={{ width: `${(completedSubtasks/subtasks.length)*100}%` }} />
                                            </div>
                                            <span className="text-xs">{completedSubtasks}/{subtasks.length}</span>
                                        </div>
                                    ) : <span className="text-gray-600">-</span>}
                                </td>
                                <td className="p-3">
                                    {(task.dependencies || []).length > 0 ? (
                                        <span className="text-xs text-yellow-500 flex items-center gap-1">
                                            🔗 {(task.dependencies || []).length} Linked
                                        </span>
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
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
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
        
        result.sort((a, b) => {
            if (sortOption === 'priority') {
                const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
                return diff !== 0 ? diff : b.updatedAt - a.updatedAt;
            } else if (sortOption === 'dueDate') {
                return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
            } else {
                return b.updatedAt - a.updatedAt;
            }
        });
        return result;
    }, [tasks, sortOption, filterStatus]);

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { 'Backlog': [], 'In Progress': [], 'Review': [], 'Done': [] };
        filteredTasks.forEach(t => {
            if (grouped[t.status]) grouped[t.status].push(t);
        });
        return grouped;
    }, [filteredTasks]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        e.dataTransfer.setData('taskId', String(taskId));
        setDraggedTaskId(taskId);
        // Improve drag ghost if needed, but standard is okay for now
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedTaskId(null);
        setDropIndicator(null);
    };

    const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDropIndicator({ status, index: 0 }); // Simplified index for now
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
        if (!taskId) return;

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                 if (targetStatus === 'Done' && t.status !== 'Done') {
                     setEngagementLogs(p => [...p, { ts: Date.now(), activity: 'complete_task', details: { id: t.id, name: t.title } }]);
                 }
                 return { ...t, status: targetStatus, updatedAt: Date.now() };
            }
            return t;
        }));
        setDropIndicator(null);
    };
    
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if(Array.isArray(data)) {
                    setImportPreview(data);
                } else {
                    alert("Invalid file format. Expected an array of tasks.");
                }
            } catch(err) { alert("Failed to parse JSON."); }
        }
        reader.readAsText(file);
        if(importFileRef.current) importFileRef.current.value = "";
    };

    return (
        <div ref={containerRef} className={`flex flex-col h-full ${isFullScreen ? 'p-4 bg-[var(--bg)] overflow-y-auto' : ''}`}>
            {importPreview && <ImportPreviewModal fileContent={importPreview} onConfirm={(data) => { setTasks(data); setImportPreview(null); }} onClose={() => setImportPreview(null)} />}
            
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex gap-2">
                    <Button onClick={handleAddTask}>+ Add Task</Button>
                    <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import</Button>
                    <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />
                    <Button variant="outline" onClick={() => downloadJSON(tasks, 'tasks_backup.json')}>Export</Button>
                </div>
                <div className="flex gap-2 items-center">
                     <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-select text-xs h-8 w-32">
                        <option value="all">All Status</option>
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                    <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="glass-select text-xs h-8 w-32">
                        <option value="priority">Priority</option>
                        <option value="dueDate">Due Date</option>
                        <option value="updatedAt">Recent</option>
                    </select>
                    <div className="bg-white/10 rounded-lg p-0.5 flex">
                        <button onClick={() => setViewMode('kanban')} className={`px-2 py-1 rounded ${viewMode === 'kanban' ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Board</button>
                        <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400'}`}>List</button>
                    </div>
                    <Button variant="glass" onClick={toggleFullScreen} className="h-8 w-8 flex items-center justify-center !p-0">
                        {isFullScreen ? '↘️' : '↗️'}
                    </Button>
                </div>
            </div>

            <div className="flex-grow min-h-0 overflow-x-auto overflow-y-hidden">
                {viewMode === 'kanban' ? (
                    <div className="flex h-full gap-4 min-w-[1000px] pb-2">
                        {(['Backlog', 'In Progress', 'Review', 'Done'] as TaskStatus[]).map(status => (
                            <div key={status} className="flex-1 min-w-[250px] h-full overflow-hidden flex flex-col">
                                <KanbanColumn 
                                    status={status} 
                                    tasks={tasksByStatus[status]} 
                                    dropIndicator={dropIndicator}
                                    onTaskClick={setViewingTask}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onTaskDragOver={handleTaskDragOver}
                                    onColumnDragOver={handleColumnDragOver}
                                    onDrop={handleDrop}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto">
                        <ListView tasks={filteredTasks} onTaskClick={setViewingTask} sortOption={sortOption} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskManager;
