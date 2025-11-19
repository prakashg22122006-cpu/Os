
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Task, TaskPriority, TaskStatus } from '../../types';

const PRIORITY_STYLES: Record<TaskPriority | 'None', string> = {
    'Urgent': 'bg-red-500',
    'High': 'bg-blue-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-gray-500',
    'None': 'bg-transparent'
};

const KANBAN_COLUMNS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITY_ORDER: Record<Task['priority'], number> = {
    'Urgent': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'None': 1,
};

const TaskItem: React.FC<{ task: Task; isSelected: boolean; onSelect: (id: number) => void; onEdit: (task: Task) => void; }> = ({ task, isSelected, onSelect, onEdit }) => {
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;
    const priorityColor = PRIORITY_STYLES[task.priority || 'None'] || PRIORITY_STYLES['None'];
    const progressColor = completedSubtasks === totalSubtasks ? 'bg-green-500' : 'bg-[var(--grad-1)]';

    return (
        <div 
            className={`flex items-center gap-3 p-2 rounded-lg border border-dashed transition-colors ${isSelected ? 'bg-[var(--grad-1)]/20 border-[var(--grad-1)]/50' : 'border-transparent hover:bg-white/5'}`}
            onClick={() => onSelect(task.id)}
        >
            <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onSelect(task.id)}
                className="form-checkbox h-4 w-4 rounded bg-transparent border-border-color text-[var(--grad-1)] focus:ring-0 cursor-pointer flex-shrink-0"
                aria-label={`Select task: ${task.title}`}
            />
            <div className="flex-grow min-w-0 cursor-pointer flex flex-col justify-center" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <div className="flex items-center gap-2">
                   <span className={`truncate ${task.status === 'Done' ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                </div>
                {totalSubtasks > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                             <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: `${(completedSubtasks/totalSubtasks)*100}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-500">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                )}
            </div>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor}`} title={`Priority: ${task.priority}`}></div>
        </div>
    );
};

const FullscreenKanban: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const { tasks, setTasks, setViewingTask, setEngagementLogs } = useAppContext();
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ status: TaskStatus; index: number } | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { Backlog: [], 'In Progress': [], Review: [], Done: [] };
        const sortedTasks = [...(tasks || [])].sort((a, b) => {
            const priorityDiff = (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1);
            if (priorityDiff !== 0) return priorityDiff;
            return b.updatedAt - a.updatedAt;
        });
        sortedTasks.forEach(task => {
            // Safety: Check if task status is valid, else default to Backlog
            const status = (task.status && grouped[task.status]) ? task.status : 'Backlog';
            grouped[status].push(task);
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

    const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDropIndicator({ status, index: -1 });
    };

    const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
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

    const handleAddTask = (status: TaskStatus) => {
        const title = prompt(`New task title for ${status}:`);
        if(title) {
            const newTask: Task = {
                id: Date.now(), title, status, priority: 'None', createdAt: Date.now(), updatedAt: Date.now(),
                attachments: [], subtasks: [], dependencies: [],
            };
            setTasks(prev => [newTask, ...prev]);
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
         switch(priority) {
            case 'Urgent': return '#ef4444';
            case 'High': return '#3b82f6';
            case 'Medium': return '#eab308';
            default: return 'transparent';
        }
    };
    
    return (
        <div className="fixed inset-0 bg-[var(--bg-offset)] z-50 p-4 flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Task Focus Mode</h2>
                <Button onClick={onClose}>Close (Esc)</Button>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-auto flex-grow">
                {KANBAN_COLUMNS.map(status => (
                    <div 
                        key={status} 
                        onDragOver={(e) => handleDragOverColumn(e, status)} 
                        onDragLeave={() => setDropIndicator(null)}
                        onDrop={(e) => handleDrop(e, status)} 
                        className={`bg-black/20 p-2 rounded-lg flex flex-col transition-all duration-200 ${dropIndicator?.status === status ? 'kanban-column-over' : ''}`}
                    >
                        <h3 className="font-semibold p-2">{status} <span className="text-gray-400">({tasksByStatus[status].length})</span></h3>
                        <div className="space-y-2 overflow-y-auto flex-grow">
                            {tasksByStatus[status].map((task) => {
                                const subtasks = task.subtasks || [];
                                const completed = subtasks.filter(s => s.completed).length;
                                const total = subtasks.length;
                                const progressColor = completed === total ? 'bg-green-500' : 'bg-gray-400';
                                return (
                                    <div 
                                        key={task.id}
                                        draggable 
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleTaskDragOver}
                                        onClick={() => setViewingTask(task)} 
                                        className="p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 border-l-4 shadow-sm"
                                        style={{ borderLeftColor: getPriorityColor(task.priority) }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-sm text-gray-200 line-clamp-2">{task.title}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            {total > 0 ? (
                                                <div className="flex items-center gap-1.5 bg-black/30 px-1.5 py-0.5 rounded">
                                                    <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                                                        <div className={`h-full ${progressColor}`} style={{ width: `${(completed/total)*100}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-mono">{completed}/{total}</span>
                                                </div>
                                            ) : <div/>}
                                            {task.priority !== 'None' && <span className="text-[10px] text-gray-500 uppercase font-bold">{task.priority}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Button variant="glass" className="mt-2 w-full text-xs" onClick={() => handleAddTask(status)}>+ Add Task</Button>
                    </div>
                ))}
            </main>
        </div>
    );
};

const TasksWidget: React.FC = () => {
    const { tasks, setTasks, setEngagementLogs, setViewingTask } = useAppContext();
    const [inputValue, setInputValue] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
    const [isFullScreen, setIsFullScreen] = useState(false);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const todaysTasks = useMemo(() => {
        // Defensive check: tasks might be undefined initially if storage is slow
        return (tasks || []).filter(t => t.dueDate === todayStr);
    }, [tasks, todayStr]);

    const addTask = () => {
        if (!inputValue.trim()) return;
        const newTask: Task = {
            id: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), title: inputValue,
            status: 'Backlog', priority: 'None', dueDate: todayStr,
            attachments: [], subtasks: [], dependencies: [],
        };
        setTasks(prev => [newTask, ...prev]);
        setInputValue('');
    };

    const handleSelect = (id: number) => {
        setSelectedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleBulkAction = (action: 'complete' | 'delete') => {
        if (action === 'complete') {
            setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, status: 'Done', updatedAt: Date.now() } : t));
            selectedTaskIds.forEach(id => {
                const task = tasks.find(t => t.id === id);
                if (task) {
                    setEngagementLogs(p => [...p, { ts: Date.now(), activity: 'complete_task', details: { id: task.id, name: task.title } }]);
                }
            });
        } else if (action === 'delete') {
            if (window.confirm(`Delete ${selectedTaskIds.size} tasks?`)) {
                setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
            }
        }
        setSelectedTaskIds(new Set());
    };
    
    const toggleFullScreen = useCallback(() => setIsFullScreen(fs => !fs), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
                return; // Don't trigger on input fields
            }

            if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                toggleFullScreen();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggleFullScreen]);


    return (
        <>
            <div className="flex flex-col h-full p-4">
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <small className="text-gray-400 font-normal">Due {todayStr}</small>
                        <Button variant="glass" className="text-xs" onClick={toggleFullScreen}>Focus (F)</Button>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <Input 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            placeholder="Add a new task for today..."
                        />
                        <Button onClick={addTask}>+</Button>
                    </div>
                    
                    {selectedTaskIds.size > 0 && (
                        <div className="flex gap-2 mb-2 p-2 bg-[var(--grad-1)]/10 rounded-lg">
                            <span className="text-sm my-auto">{selectedTaskIds.size} selected</span>
                            <Button variant="glass" className="text-xs" onClick={() => handleBulkAction('complete')}>Mark Done</Button>
                            <Button variant="glass" className="text-xs text-red-400 border-red-500/50 hover:bg-red-500/10" onClick={() => handleBulkAction('delete')}>Delete</Button>
                        </div>
                    )}
                </div>

                <div className="flex-grow min-h-0 space-y-2 overflow-y-auto pr-2">
                    {todaysTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-gray-400">No tasks due today.</div>
                        </div>
                    ) : (
                        todaysTasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                isSelected={selectedTaskIds.has(task.id)}
                                onSelect={handleSelect}
                                onEdit={setViewingTask}
                            />
                        ))
                    )}
                </div>
            </div>
            
            {isFullScreen && <FullscreenKanban onClose={toggleFullScreen} />}
        </>
    );
};

export default TasksWidget;
