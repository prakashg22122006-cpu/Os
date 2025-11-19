import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Project } from '../../types';

const EditProjectForm: React.FC<{ project: Project; onSave: (p: Project) => void; onCancel: () => void }> = ({ project, onSave, onCancel }) => {
    const [formData, setFormData] = useState(project);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-2.5 space-y-2 bg-[rgba(0,0,0,0.2)] rounded-lg border border-dashed border-[var(--grad-1)]/30">
            <h5 className="font-semibold text-sm">Editing: {project.name}</h5>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Project name" />
            <Input name="desc" value={formData.desc} onChange={handleChange} placeholder="Project description" />
            <Input name="stack" value={formData.stack} onChange={handleChange} placeholder="Tech stack" />
            <div className="flex gap-2">
                <Button onClick={() => onSave(formData)} className="text-sm">Save</Button>
                <Button variant="glass" onClick={onCancel} className="text-sm">Cancel</Button>
            </div>
        </div>
    );
};

const ProjectsManager: React.FC = () => {
    const { projects, setProjects } = useAppContext();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [stack, setStack] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const addProject = () => {
        if (!name.trim()) return alert('Project name is required');
        setProjects(prev => [{ name, desc, stack, ts: Date.now() }, ...prev]);
        setName('');
        setDesc('');
        setStack('');
    };

    const updateProject = (index: number, updatedProject: Project) => {
        setProjects(prev => prev.map((p, i) => (i === index ? updatedProject : p)));
        setEditingIndex(null);
    };

    const deleteProject = (index: number) => {
        setProjects(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            <div className="space-y-1.5">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" />
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Project description" />
                <Input value={stack} onChange={e => setStack(e.target.value)} placeholder="Tech stack" />
            </div>
            <div className="mt-2">
                <Button onClick={addProject}>Add Project</Button>
            </div>
            <div className="mt-2.5 space-y-2">
                {projects.length === 0 ? (
                    <p className="text-gray-400">No projects added yet.</p>
                ) : (
                    projects.map((p, i) => (
                        <div key={p.ts}>
                            {editingIndex === i ? (
                                <EditProjectForm
                                    project={p}
                                    onSave={(updated) => updateProject(i, updated)}
                                    onCancel={() => setEditingIndex(null)}
                                />
                            ) : (
                                <div className="flex justify-between items-start p-2 rounded-lg border border-dashed border-transparent">
                                    <div>
                                        <strong className="text-white">{p.name}</strong>
                                        <div className="text-sm text-gray-400">{p.stack}</div>
                                        <p className="text-sm">{p.desc}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 ml-2">
                                        <Button variant="glass" className="px-2 py-1 text-xs" onClick={() => setEditingIndex(i)}>Edit</Button>
                                        <Button variant="glass" className="px-2 py-1 text-xs" onClick={() => deleteProject(i)}>Del</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default ProjectsManager;