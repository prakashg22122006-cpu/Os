import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
};

const PRIORITY_STYLES: Record<Task['priority'], string> = {
    None: 'border-transparent',
    Low: 'border-gray-500',
    Medium: 'border-yellow-500',
    High: 'border-blue-500',
    Urgent: 'border-red-500',
};

const TaskCard: React.FC<{
    task: Task;
    onClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ task, onClick, onDragStart, onDragEnd, onDragOver }) => {
    const completedSubtasks = useMemo(() => task.subtasks.filter(st => st.completed).length, [task.subtasks]);
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onClick={onClick}
            className={`bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.03)] p-2.5 rounded-lg cursor-pointer border-l-4 ${PRIORITY_STYLES[task.priority]}`}
        >
            <p className="font-bold text-sm text-white">{task.title}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>{task.dueDate || 'No due date'}</span>
                <div className="flex gap-2">
                    {task.subtasks.length > 0 && <span>✓ {completedSubtasks}/{task.subtasks.length}</span>}
                    {task.attachments.length > 0 && <span>📎 {task.attachments.length}</span>}
                </div>
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
    onTaskDragOver: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
    onColumnDragOver: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
}> = ({ status, tasks, dropIndicator, onTaskClick, onDragStart, onDragEnd, onTaskDragOver, onColumnDragOver, onDrop }) => {
    
    return (
        <div
            onDragOver={(e) => onColumnDragOver(e, status)}
            onDrop={(e) => onDrop(e, status)}
            className={`bg-[rgba(255,255,255,0.01)] p-2.5 rounded-lg min-h-[250px] transition-all duration-200 ${dropIndicator?.status === status ? 'kanban-column-over' : ''}`}
        >
            <h4 className="font-semibold text-base mb-2">{status} ({tasks.length})</h4>
            <div className="space-y-2">
                {tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                        {dropIndicator?.status === status && dropIndicator?.index === index && <div className="drop-placeholder" />}
                        <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragOver={(e) => onTaskDragOver(e, task)}
                        />
                    </React.Fragment>
                ))}
                {dropIndicator?.status === status && dropIndicator?.index === tasks.length && <div className="drop-placeholder" />}
            </div>
        </div>
    );
};

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
    
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { Backlog: [], 'In Progress': [], Review: [], Done: [] };
        tasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        e.dataTransfer.setData('taskId', String(taskId));
        setDraggedTaskId(taskId);
        setTimeout(() => e.currentTarget.classList.add('kanban-task-dragging'), 0);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('kanban-task-dragging');
        setDraggedTaskId(null);
        setDropIndicator(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
        if (!taskId) return;
        
        const targetIndex = dropIndicator?.status === targetStatus ? dropIndicator.index : tasksByStatus[targetStatus].length;
        
        const taskToMove = tasks.find(t => t.id === taskId);
        if (taskToMove && targetStatus === 'Done' && taskToMove.status !== 'Done') {
            setEngagementLogs(prev => [...prev, {
                ts: Date.now(),
                activity: 'complete_task',
                details: { id: taskToMove.id, name: taskToMove.title }
            }]);
        }
        
        setTasks(currentTasks => {
            if (!taskToMove) return currentTasks;

            const tasksWithoutMoved = currentTasks.filter(t => t.id !== taskId);
            const updatedTask = { ...taskToMove, status: targetStatus, updatedAt: Date.now() };

            const tasksInTargetColumn = tasksWithoutMoved.filter(t => t.status === targetStatus);
            
            if (targetIndex >= tasksInTargetColumn.length) {
                const lastTask = tasksInTargetColumn[tasksInTargetColumn.length - 1];
                const insertionPoint = lastTask ? tasksWithoutMoved.findIndex(t => t.id === lastTask.id) + 1 : tasksWithoutMoved.length;
                tasksWithoutMoved.splice(insertionPoint, 0, updatedTask);
            } else {
                const taskToInsertBefore = tasksInTargetColumn[targetIndex];
                const absoluteIndex = tasksWithoutMoved.findIndex(t => t.id === taskToInsertBefore.id);
                tasksWithoutMoved.splice(absoluteIndex, 0, updatedTask);
            }
            return tasksWithoutMoved;
        });

        setDropIndicator(null);
    };
    
    const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedTaskId === task.id) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        const isAfter = e.clientY > middleY;
        const taskIndex = tasksByStatus[task.status].findIndex(t => t.id === task.id);
        
        setDropIndicator({
            status: task.status,
            index: isAfter ? taskIndex + 1 : taskIndex,
        });
    };
    
    const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        if (tasksByStatus[status].length === 0) {
            setDropIndicator({ status, index: 0 });
        }
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
                    // Simple validation for task structure
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
        <div ref={containerRef} className={`bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-4 rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto' : ''}`}>
            {importPreview && <ImportPreviewModal fileContent={importPreview} onConfirm={confirmImport} onClose={() => setImportPreview(null)} />}
            <div className="flex justify-between items-center mb-4">
                <CardHeader title="Task Manager" subtitle="Your complete execution pipeline" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddTask}>+ New Task</Button>
                    <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
                </div>
            </div>
            <div className={`grid grid-cols-1 ${isFullScreen ? 'md:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'} gap-3`}>
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
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <Button variant="outline" onClick={() => downloadJSON(tasks, 'tasks.json')}>Export JSON</Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import JSON</Button>
                <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />
            </div>
        </div>
    );
};

export default TaskManager;