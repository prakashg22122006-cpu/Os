import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Task, TaskPriority, TaskStatus } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const PRIORITY_STYLES: Record<TaskPriority, string> = {
    'Urgent': 'bg-red-500',
    'High': 'bg-blue-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-gray-500',
    'None': 'bg-transparent'
};

const KANBAN_COLUMNS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

const TaskItem: React.FC<{ task: Task; isSelected: boolean; onSelect: (id: number) => void; onEdit: (task: Task) => void; }> = ({ task, isSelected, onSelect, onEdit }) => {
    return (
        <div 
            className={`flex items-center gap-3 p-2 rounded-lg border border-dashed transition-colors ${isSelected ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50' : 'border-[rgba(255,255,255,0.02)] hover:bg-white/5'}`}
            onClick={() => onSelect(task.id)}
        >
            <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onSelect(task.id)}
                className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0 cursor-pointer flex-shrink-0"
                aria-label={`Select task: ${task.title}`}
            />
            <div className="flex-grow truncate cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <span className={task.status === 'Done' ? 'line-through text-gray-500' : ''}>{task.title}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_STYLES[task.priority]}`} title={`Priority: ${task.priority}`}></div>
        </div>
    );
};

const FullscreenKanban: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const { tasks, setTasks, setViewingTask } = useAppContext();
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
        // This relies on the original `tasks` array order for within-column sorting
        tasks.forEach(task => { (grouped[task.status] = grouped[task.status] || []).push(task); });
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
        if (tasksByStatus[status].length === 0) {
            setDropIndicator({ status, index: 0 });
        }
    };

    const handleDragOverTask = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
        if (!taskId) return;
        
        const targetIndex = dropIndicator?.status === targetStatus ? dropIndicator.index : tasksByStatus[targetStatus].length;
        
        setTasks(currentTasks => {
            const taskToMove = currentTasks.find(t => t.id === taskId);
            if (!taskToMove) return currentTasks;

            const tasksWithoutMoved = currentTasks.filter(t => t.id !== taskId);
            const updatedTask = { ...taskToMove, status: targetStatus, updatedAt: Date.now() };

            const tasksInTargetColumn = tasksWithoutMoved.filter(t => t.status === targetStatus);
            
            if (targetIndex >= tasksInTargetColumn.length) {
                // Find last task in column to insert after
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
    
    return (
        <div className="fixed inset-0 bg-[var(--bg-gradient-end)] z-50 p-4 flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Task Focus Mode</h2>
                <Button onClick={onClose}>Close (Esc)</Button>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-auto flex-grow">
                {KANBAN_COLUMNS.map(status => (
                    <div 
                        key={status} 
                        onDragOver={(e) => handleDragOverColumn(e, status)} 
                        onDragLeave={() => {}}
                        onDrop={(e) => handleDrop(e, status)} 
                        className={`bg-black/20 p-2 rounded-lg flex flex-col transition-all duration-200 ${dropIndicator?.status === status ? 'kanban-column-over' : ''}`}
                    >
                        <h3 className="font-semibold p-2">{status} <span className="text-gray-400">({tasksByStatus[status].length})</span></h3>
                        <div className="space-y-2 overflow-y-auto flex-grow">
                            {tasksByStatus[status].map((task, index) => (
                                <React.Fragment key={task.id}>
                                    {dropIndicator?.status === status && dropIndicator?.index === index && <div className="drop-placeholder" />}
                                    <div 
                                        draggable 
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOverTask(e, task)}
                                        onClick={() => setViewingTask(task)} 
                                        className="p-2.5 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50"
                                    >
                                        <p>{task.title}</p>
                                    </div>
                                </React.Fragment>
                            ))}
                            {dropIndicator?.status === status && dropIndicator?.index === tasksByStatus[status].length && <div className="drop-placeholder" />}
                        </div>
                        <Button variant="outline" className="mt-2 w-full text-xs" onClick={() => handleAddTask(status)}>+ Add Task</Button>
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
        return tasks.filter(t => t.dueDate === todayStr);
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
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <CardHeader title="Today's Tasks" subtitle={`Due ${todayStr}`} />
                        <Button variant="outline" className="text-xs" onClick={toggleFullScreen}>Focus (F)</Button>
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
                        <div className="flex gap-2 mb-2 p-2 bg-[var(--accent-color)]/10 rounded-lg">
                            <span className="text-sm my-auto">{selectedTaskIds.size} selected</span>
                            <Button variant="outline" className="text-xs" onClick={() => handleBulkAction('complete')}>Mark Done</Button>
                            <Button variant="outline" className="text-xs text-red-400 border-red-500/50 hover:bg-red-500/10" onClick={() => handleBulkAction('delete')}>Delete</Button>
                        </div>
                    )}
                </div>

                <div className="flex-grow min-h-0 space-y-2 overflow-y-auto pr-2">
                    {todaysTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-[#9fb3cf]">No tasks due today.</div>
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