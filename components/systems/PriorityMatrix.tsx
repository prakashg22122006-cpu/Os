
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, TaskPriority } from '../../types';
import Button from '../ui/Button';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

type Quadrant = 'iu' | 'inu' | 'niu' | 'ninu';

interface Matrix {
    iu: Task[];
    inu: Task[];
    niu: Task[];
    ninu: Task[];
}

const PriorityMatrix: React.FC = () => {
    const { tasks, setTasks, setViewingTask } = useAppContext();
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

    const matrix = useMemo<Matrix>(() => {
        const allTasks = tasks.filter(t => t.status !== 'Done');
        const newMatrix: Matrix = { iu: [], inu: [], niu: [], ninu: [] };
        
        allTasks.forEach(t => {
            switch (t.priority) {
                case 'Urgent':
                    newMatrix.iu.push(t);
                    break;
                case 'High':
                    newMatrix.inu.push(t);
                    break;
                case 'Medium':
                    newMatrix.niu.push(t);
                    break;
                case 'Low':
                case 'None':
                default:
                    newMatrix.ninu.push(t);
                    break;
            }
        });
        return newMatrix;
    }, [tasks]);

    const handleDragStart = (id: number) => {
        setDraggedTaskId(id);
    };

    const handleDrop = (targetQuadrant: Quadrant) => {
        if (draggedTaskId === null) return;

        let newPriority: TaskPriority = 'Low';
        if (targetQuadrant === 'iu') newPriority = 'Urgent';
        else if (targetQuadrant === 'inu') newPriority = 'High';
        else if (targetQuadrant === 'niu') newPriority = 'Medium';
        
        setTasks(prev => 
            prev.map(task => 
                task.id === draggedTaskId
                    ? { ...task, priority: newPriority, updatedAt: Date.now() }
                    : task
            )
        );
        setDraggedTaskId(null);
    };

    return (
        <>
            <CardHeader title="Productivity: Priority Matrix" subtitle="Drag tasks to re-prioritize"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white">
                <MatrixQuadrant title="Do" subtitle="Important & Urgent" tasks={matrix.iu} quadrant='iu' onDragStart={handleDragStart} onDrop={handleDrop} onViewTask={setViewingTask} accentColor="rgba(239, 68, 68, 0.1)" />
                <MatrixQuadrant title="Schedule" subtitle="Important & Not Urgent" tasks={matrix.inu} quadrant='inu' onDragStart={handleDragStart} onDrop={handleDrop} onViewTask={setViewingTask} accentColor="rgba(59, 130, 246, 0.1)" />
                <MatrixQuadrant title="Delegate" subtitle="Not Important & Urgent" tasks={matrix.niu} quadrant='niu' onDragStart={handleDragStart} onDrop={handleDrop} onViewTask={setViewingTask} accentColor="rgba(234, 179, 8, 0.1)" />
                <MatrixQuadrant title="Eliminate" subtitle="Not Important & Not Urgent" tasks={matrix.ninu} quadrant='ninu' onDragStart={handleDragStart} onDrop={handleDrop} onViewTask={setViewingTask} accentColor="rgba(107, 114, 128, 0.1)" />
            </div>
        </>
    );
};

interface MatrixQuadrantProps {
    title: string;
    subtitle: string;
    tasks: Task[];
    quadrant: Quadrant;
    accentColor: string;
    onDragStart: (id: number) => void;
    onDrop: (quadrant: Quadrant) => void;
    onViewTask: (task: Task) => void;
}

const MatrixQuadrant: React.FC<MatrixQuadrantProps> = ({ title, subtitle, tasks, quadrant, accentColor, onDragStart, onDrop, onViewTask }) => {
    const [isOver, setIsOver] = useState(false);

    return (
        <div 
            style={{ backgroundColor: isOver ? 'rgba(255,255,255,0.1)' : accentColor }}
            className="p-2.5 rounded-lg min-h-[150px] transition-colors"
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(quadrant); }}
        >
            <strong className="text-base">{title}</strong>
            <p className="text-xs text-gray-400 -mt-1">{subtitle}</p>
            <div className="mt-2 space-y-1.5">
                {tasks.map(t => (
                    <div 
                        key={t.id}
                        draggable
                        onDragStart={() => onDragStart(t.id)}
                        className="p-2 rounded-lg bg-[rgba(0,0,0,0.3)] text-xs cursor-grab active:cursor-grabbing flex justify-between items-center"
                    >
                        <span>{t.title}</span>
                        <Button variant="outline" className="px-1.5 py-0.5 text-xs" onClick={() => onViewTask(t)}>View</Button>
                    </div>
                ))}
                {tasks.length === 0 && <p className="text-xs text-gray-500 text-center pt-4">Drop tasks here</p>}
            </div>
        </div>
    );
}

export default PriorityMatrix;
