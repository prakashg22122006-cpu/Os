import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, Subtask, TaskPriority, TaskStatus } from '../../types';
import Button from './Button';
import Input from './Input';
import { getFiles, getFile } from '../../utils/db';
import ProgressBar from './ProgressBar';

const PRIORITY_OPTIONS: TaskPriority[] = ['None', 'Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

const TaskEditorModal: React.FC = () => {
    const { viewingTask, setViewingTask, tasks, setTasks, setViewingFile } = useAppContext();
    const [taskData, setTaskData] = useState<Task | null>(null);
    const [allFiles, setAllFiles] = useState<{id: number, name: string}[]>([]);
    const [subtaskInput, setSubtaskInput] = useState('');
    const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
    const [editingSubtaskText, setEditingSubtaskText] = useState('');

    useEffect(() => {
        if (viewingTask) {
            setTaskData({ ...viewingTask });
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
        setTasks(prev => prev.map(t => t.id === taskData.id ? { ...taskData, updatedAt: Date.now() } : t));
        handleClose();
    };
    
    const handleChange = (field: keyof Task, value: any) => {
        setTaskData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const addSubtask = () => {
        if (!subtaskInput.trim()) return;
        const newSubtask: Subtask = { id: Date.now(), title: subtaskInput, completed: false };
        handleChange('subtasks', [...taskData.subtasks, newSubtask]);
        setSubtaskInput('');
    };

    const toggleSubtask = (id: number) => {
        const updatedSubtasks = taskData.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
        handleChange('subtasks', updatedSubtasks);
    };
    
    const removeSubtask = (id: number) => {
        handleChange('subtasks', taskData.subtasks.filter(st => st.id !== id));
    };

    const handleEditSubtask = (subtask: Subtask) => {
        setEditingSubtaskId(subtask.id);
        setEditingSubtaskText(subtask.title);
    };

    const handleSaveSubtaskEdit = () => {
        if (editingSubtaskId === null || !editingSubtaskText.trim()) {
            setEditingSubtaskId(null); // Cancel if empty
            return;
        };
        const updatedSubtasks = taskData.subtasks.map(st => 
            st.id === editingSubtaskId ? { ...st, title: editingSubtaskText } : st
        );
        handleChange('subtasks', updatedSubtasks);
        setEditingSubtaskId(null);
        setEditingSubtaskText('');
    };
    
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fileId = parseInt(e.target.value, 10);
        if (fileId && !taskData.attachments.includes(fileId)) {
            handleChange('attachments', [...taskData.attachments, fileId]);
        }
    };
    
    const removeAttachment = (id: number) => {
        handleChange('attachments', taskData.attachments.filter(attId => attId !== id));
    };

    const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const depId = parseInt(e.target.value, 10);
        if (depId && !taskData.dependencies.includes(depId)) {
            handleChange('dependencies', [...taskData.dependencies, depId]);
        }
    };
    
    const removeDependency = (id: number) => {
        handleChange('dependencies', taskData.dependencies.filter(depId => depId !== id));
    };

    const attachedFiles = useMemo(() => allFiles.filter(f => taskData.attachments.includes(f.id)), [allFiles, taskData.attachments]);
    const dependencyTasks = useMemo(() => tasks.filter(t => taskData.dependencies.includes(t.id)), [tasks, taskData.dependencies]);
    
    const subtaskProgress = useMemo(() => {
        if (!taskData.subtasks || taskData.subtasks.length === 0) return 0;
        const completed = taskData.subtasks.filter(st => st.completed).length;
        return (completed / taskData.subtasks.length) * 100;
    }, [taskData.subtasks]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10 flex-shrink-0">
                    <Input value={taskData.title} onChange={e => handleChange('title', e.target.value)} className="text-lg font-semibold !p-1" />
                </header>
                <main className="p-4 overflow-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Description</label>
                            <textarea value={taskData.description || ''} onChange={e => handleChange('description', e.target.value)} rows={4} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border mt-1" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-gray-400">Subtasks</label>
                                {taskData.subtasks.length > 0 && (
                                    <span className="text-xs text-gray-400">{Math.round(subtaskProgress)}% complete</span>
                                )}
                            </div>
                            {taskData.subtasks.length > 0 && (
                                <div className="mt-2">
                                    <ProgressBar value={subtaskProgress} color="bg-[var(--accent-color)]" height="h-1.5" />
                                </div>
                            )}
                            <div className="flex gap-2 mt-2">
                                <Input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} placeholder="New subtask..." onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                                <Button onClick={addSubtask}>Add</Button>
                            </div>
                            <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-2">
                                {taskData.subtasks.map(st => (
                                    <div key={st.id} className="flex items-center justify-between p-1 pl-2 bg-black/20 rounded group">
                                        <div className="flex items-center gap-2 cursor-pointer flex-grow min-w-0">
                                            <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(st.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0 flex-shrink-0" />
                                            {editingSubtaskId === st.id ? (
                                                <Input
                                                    autoFocus
                                                    value={editingSubtaskText}
                                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                                    onBlur={handleSaveSubtaskEdit}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveSubtaskEdit();
                                                        if (e.key === 'Escape') setEditingSubtaskId(null);
                                                    }}
                                                    className="!p-0 !border-0 !bg-transparent !ring-1 !ring-inset !ring-[var(--accent-color)] text-sm w-full"
                                                />
                                            ) : (
                                                <span onClick={() => handleEditSubtask(st)} className={`flex-grow truncate ${st.completed ? 'line-through text-gray-500' : ''}`}>
                                                    {st.title}
                                                </span>
                                            )}
                                        </div>
                                        <Button variant="outline" className="text-xs !p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeSubtask(st.id)}>X</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-gray-400">Dependencies (Tasks that must be completed first)</label>
                            <select onChange={handleDependencyChange} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border mt-1">
                                <option value="">Add dependency...</option>
                                {tasks.filter(t => t.id !== taskData.id && !taskData.dependencies.includes(t.id)).map(t => (
                                    <option key={t.id} value={t.id} className="bg-[#0b1626]">{t.title}</option>
                                ))}
                            </select>
                             <div className="space-y-1 mt-2">
                                {dependencyTasks.map(dep => (
                                    <div key={dep.id} className="flex items-center justify-between p-1 bg-black/20 rounded text-sm">
                                        <span>{dep.title}</span>
                                        <Button variant="outline" className="text-xs !p-1" onClick={() => removeDependency(dep.id)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Status</label>
                            <select value={taskData.status} onChange={e => handleChange('status', e.target.value)} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border mt-1">
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#0b1626]">{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Priority</label>
                            <select value={taskData.priority} onChange={e => handleChange('priority', e.target.value)} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border mt-1">
                                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-[#0b1626]">{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Due Date</label>
                            <Input type="date" value={taskData.dueDate || ''} onChange={e => handleChange('dueDate', e.target.value)} className="mt-1" />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-gray-400">Attachments</label>
                            <select onChange={handleAttachmentChange} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border mt-1">
                                <option value="">Attach a file...</option>
                                {allFiles.filter(f => !taskData.attachments.includes(f.id)).map(f => (
                                    <option key={f.id} value={f.id} className="bg-[#0b1626]">{f.name}</option>
                                ))}
                            </select>
                            <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-2">
                                {attachedFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-1 bg-black/20 rounded text-sm">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <div className="flex-shrink-0 flex gap-1">
                                            <Button variant="outline" className="text-xs !p-1" onClick={async () => setViewingFile(await getFile(file.id))}>View</Button>
                                            <Button variant="outline" className="text-xs !p-1" onClick={() => removeAttachment(file.id)}>X</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>Created: {new Date(taskData.createdAt).toLocaleString()}</p>
                            <p>Updated: {new Date(taskData.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10 flex-shrink-0">
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </footer>
            </div>
        </div>
    );
};

export default TaskEditorModal;