
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Task, TaskStatus, TaskPriority } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

type KanbanColumnId = 'backlog' | 'progress' | 'done';

const KanbanBoard: React.FC = () => {
    const { tasks, setTasks } = useAppContext();
    const [title, setTitle] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const addTask = () => {
        if (!title.trim()) return;
        
        let priority: TaskPriority = 'None';
        if (isImportant && isUrgent) priority = 'Urgent';
        else if (isImportant) priority = 'High';
        else if (isUrgent) priority = 'Medium';

        const newTask: Task = { 
            id: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title, 
            status: 'Backlog',
            priority,
            attachments: [],
            subtasks: [],
            dependencies: [],
        };
        setTasks(prev => [newTask, ...prev]);
        setTitle('');
        setIsImportant(false);
        setIsUrgent(false);
    };

    const tasksByStatus = useMemo(() => {
        const backlog = tasks.filter(t => t.status === 'Backlog' || t.status === 'Review');
        const progress = tasks.filter(t => t.status === 'In Progress');
        const done = tasks.filter(t => t.status === 'Done');
        return { backlog, progress, done };
    }, [tasks]);
    
    const deleteTask = (taskId: number) => {
        if (!window.confirm('Delete task?')) return;
        setTasks(prev => prev.filter((t) => t.id !== taskId));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
        e.dataTransfer.setData('taskId', taskId.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCol: KanbanColumnId) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);

        const targetStatus: TaskStatus = targetCol === 'backlog' ? 'Backlog' : targetCol === 'progress' ? 'In Progress' : 'Done';
        
        setTasks(prev => {
            return prev.map(task => 
                task.id === taskId ? { ...task, status: targetStatus, updatedAt: Date.now() } : task
            );
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <>
            <CardHeader title="Productivity: Execution Pipeline" />
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[#5aa1ff] focus:ring-0" />
                        Important
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[#5aa1ff] focus:ring-0" />
                        Urgent
                    </label>
                </div>
                <Button onClick={addTask}>Add Task</Button>
            </div>
            <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <KanbanColumn id="backlog" title="Backlog" tasks={tasksByStatus.backlog} onDelete={deleteTask} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} />
                <KanbanColumn id="progress" title="In Progress" tasks={tasksByStatus.progress} onDelete={deleteTask} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} />
                <KanbanColumn id="done" title="Done" tasks={tasksByStatus.done} onDelete={deleteTask} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} />
            </div>
        </>
    );
};


interface KanbanColumnProps {
    id: KanbanColumnId;
    title: string;
    tasks: Task[];
    onDelete: (taskId: number) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: number) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, targetCol: KanbanColumnId) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, onDelete, onDragStart, onDrop, onDragOver }) => {
    const getPriorityClass = (priority: Task['priority']) => {
        switch(priority) {
          case 'Urgent': return 'text-red-400';
          case 'High': return 'text-blue-400';
          case 'Medium': return 'text-yellow-400';
          case 'Low': return 'text-gray-400';
          default: return 'text-gray-500';
        }
      }
    return (
        <div 
            className="flex-1 bg-[rgba(255,255,255,0.01)] p-2.5 rounded-lg min-h-[140px]"
            onDrop={(e) => onDrop(e, id)}
            onDragOver={onDragOver}
        >
            <h4 className="font-semibold text-base">{title}</h4>
            <div className="space-y-2 mt-2">
                {tasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-2.5 rounded-lg cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                    >
                        <strong>{task.title}</strong>
                         <div className="text-xs text-[#9fb3cf] flex gap-2 mt-1">
                            {task.priority !== 'None' && <span className={`font-bold ${getPriorityClass(task.priority)}`}>{task.priority}</span>}
                        </div>
                        <div className="mt-2">
                           <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => onDelete(task.id)}>Del</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
