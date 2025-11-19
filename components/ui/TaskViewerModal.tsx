
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, Subtask, TaskPriority, TaskStatus } from '../../types';
import Button from './Button';
import Input from './Input';
import { getFiles, getFile, addFile } from '../../utils/db';
import DropZone from './DropZone';

const PRIORITY_OPTIONS: TaskPriority[] = ['None', 'Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

const TaskViewerModal: React.FC = () => {
    const { viewingTask, setViewingTask, tasks, setTasks, setViewingFile } = useAppContext();
    const [taskData, setTaskData] = useState<Task | null>(null);
    const [allFiles, setAllFiles] = useState<{id: number, name: string}[]>([]);
    const [subtaskInput, setSubtaskInput] = useState('');

    useEffect(() => {
        if (viewingTask) {
            setTaskData({ 
                ...viewingTask,
                subtasks: viewingTask.subtasks || [],
                attachments: viewingTask.attachments || [],
                dependencies: viewingTask.dependencies || []
            });
        } else {
            setTaskData(null);
        }
    }, [viewingTask]);
    
    useEffect(() => {
        getFiles().then(files => setAllFiles(files.map(f => ({ id: f.id, name: f.name }))));
    }, []);

    if (!viewingTask || !taskData) return null;

    const handleClose = () => setViewingTask(null);

    const handleSave = () => {
        if (!taskData) return;
        setTasks(prev => prev.map(t => t.id === taskData.id ? { ...taskData, updatedAt: Date.now() } : t));
        handleClose();
    };
    
    const handleChange = (field: keyof Task, value: any) => {
        setTaskData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const addSubtask = () => {
        if (!subtaskInput.trim() || !taskData) return;
        const newSubtask: Subtask = { id: Date.now(), title: subtaskInput, completed: false };
        handleChange('subtasks', [...(taskData.subtasks || []), newSubtask]);
        setSubtaskInput('');
    };

    const toggleSubtask = (id: number) => {
        if (!taskData) return;
        const updatedSubtasks = (taskData.subtasks || []).map(st => st.id === id ? { ...st, completed: !st.completed } : st);
        handleChange('subtasks', updatedSubtasks);
    };
    
    const removeSubtask = (id: number) => {
        if (!taskData) return;
        handleChange('subtasks', (taskData.subtasks || []).filter(st => st.id !== id));
    };

    const updateSubtaskTitle = (id: number, title: string) => {
        if (!taskData) return;
        const updatedSubtasks = (taskData.subtasks || []).map(st => st.id === id ? { ...st, title } : st);
        handleChange('subtasks', updatedSubtasks);
    };
    
    const handleFileDrop = async (files: FileList) => {
        if (!files || files.length === 0 || !taskData) return;
        try {
            const newAttachmentIds = await Promise.all(Array.from(files).map(file => addFile(file)));
            handleChange('attachments', [...(taskData.attachments || []), ...newAttachmentIds]);
            getFiles().then(dbFiles => setAllFiles(dbFiles.map(f => ({ id: f.id, name: f.name }))));
        } catch(error) {
            alert('Failed to attach files.');
        }
    };

    const removeAttachment = (id: number) => {
        if (!taskData) return;
        handleChange('attachments', (taskData.attachments || []).filter(attId => attId !== id));
    };
    
    const attachedFiles = useMemo(() => {
        if (!taskData) return [];
        return allFiles.filter(f => (taskData.attachments || []).includes(f.id));
    }, [allFiles, taskData?.attachments]);

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content glass-panel w-full max-w-3xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-border-color flex-shrink-0">
                    <Input value={taskData.title} onChange={e => handleChange('title', e.target.value)} className="text-xl font-bold !p-1 !border-0 bg-transparent" />
                </header>
                <DropZone onDrop={handleFileDrop} className="flex-grow flex flex-col min-h-0">
                    <main className="p-4 overflow-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-text-dim mb-2">Description</h4>
                                <Input type="textarea" value={taskData.description || ''} onChange={e => handleChange('description', e.target.value)} rows={4} className="glass-textarea" />
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-text-dim mb-2">Subtasks</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {(taskData.subtasks || []).map(st => (
                                        <div key={st.id} className="flex items-center justify-between p-2 bg-black/30 rounded group hover:bg-black/40 transition-colors">
                                            <div className="flex items-center gap-3 flex-grow">
                                                <input 
                                                    type="checkbox" 
                                                    checked={st.completed} 
                                                    onChange={() => toggleSubtask(st.id)} 
                                                    className="w-4 h-4 rounded bg-transparent border-border-color text-[var(--grad-5)] focus:ring-0 cursor-pointer" 
                                                />
                                                <input
                                                    type="text"
                                                    value={st.title}
                                                    onChange={(e) => updateSubtaskTitle(st.id, e.target.value)}
                                                    className={`bg-transparent border-none outline-none focus:ring-0 p-0 w-full text-sm ${st.completed ? 'line-through text-text-dim' : 'text-gray-200'}`}
                                                    placeholder="Subtask..."
                                                />
                                            </div>
                                            <button className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 px-2" onClick={() => removeSubtask(st.id)}>×</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} placeholder="New subtask..." onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                                    <Button variant="glass" onClick={addSubtask}>Add</Button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                             <div>
                                <h4 className="text-sm font-semibold text-text-dim mb-2">Properties</h4>
                                <div className="space-y-2">
                                     <Input type="select" value={taskData.status || 'Backlog'} onChange={e => handleChange('status', e.target.value)}>
                                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </Input>
                                     <Input type="select" value={taskData.priority || 'None'} onChange={e => handleChange('priority', e.target.value)}>
                                        {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </Input>
                                    <Input type="date" value={taskData.dueDate || ''} onChange={e => handleChange('dueDate', e.target.value)} />
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-text-dim mb-2">Attachments</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {attachedFiles.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-2 bg-black/30 rounded text-sm group">
                                            <span className="truncate pr-2 cursor-pointer" onClick={async () => setViewingFile(await getFile(file.id))} title={file.name}>{file.name}</span>
                                            <button className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(file.id)}>×</button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-center text-text-dim py-2">Drag & drop files to attach</p>
                                </div>
                            </div>
                        </div>
                    </main>
                </DropZone>
                <footer className="p-4 flex gap-2 justify-end border-t border-border-color flex-shrink-0">
                    <Button variant="glass" onClick={handleClose}>Cancel</Button>
                    <Button variant="gradient" onClick={handleSave}>Save Changes</Button>
                </footer>
            </div>
        </div>
    );
};

export default TaskViewerModal;
