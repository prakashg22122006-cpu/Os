import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { JobApplication, InterviewStage } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { addFile, getFile } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const downloadJSON = (obj: any, name='export.json') => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
};

const APPLICATION_STATUSES: JobApplication['status'][] = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];

const ApplicationModal: React.FC<{
    application?: JobApplication;
    onSave: (app: Omit<JobApplication, 'id' | 'ts'> & { id?: number }) => void;
    onClose: () => void;
}> = ({ application, onSave, onClose }) => {
    const { setViewingFile } = useAppContext();
    const [formData, setFormData] = useState<Omit<JobApplication, 'id' | 'ts'>>({
        company: application?.company || '',
        role: application?.role || '',
        status: application?.status || 'Wishlist',
        notes: application?.notes || '',
        interviews: application?.interviews || [],
        resumeFileId: application?.resumeFileId,
        coverLetterFileId: application?.coverLetterFileId,
    });
    const resumeRef = useRef<HTMLInputElement>(null);
    const coverLetterRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (type: 'resume' | 'coverLetter', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileId = await addFile(file);
                setFormData(prev => ({ ...prev, [type === 'resume' ? 'resumeFileId' : 'coverLetterFileId']: fileId }));
                alert(`${type === 'resume' ? 'Resume' : 'Cover Letter'} uploaded!`);
            } catch (err) {
                alert('Failed to upload file.');
            }
        }
    };

    const handleViewFile = async (fileId: number | undefined) => {
        if (!fileId) return alert('No file attached.');
        const file = await getFile(fileId);
        if (file) setViewingFile(file);
        else alert('File not found.');
    };
    
    const handleInterviewChange = (index: number, field: keyof InterviewStage, value: string) => {
        const newInterviews = [...formData.interviews];
        newInterviews[index] = { ...newInterviews[index], [field]: value };
        setFormData(prev => ({...prev, interviews: newInterviews}));
    };
    
    const addInterview = () => {
        const newInterview: InterviewStage = { id: Date.now(), date: '', type: '', notes: '' };
        setFormData(prev => ({...prev, interviews: [...prev.interviews, newInterview]}));
    };

    const removeInterview = (id: number) => {
        setFormData(prev => ({...prev, interviews: prev.interviews.filter(i => i.id !== id)}));
    };

    const handleSubmit = () => {
        if (!formData.company.trim() || !formData.role.trim()) {
            return alert('Company and Role are required.');
        }
        onSave({ ...formData, id: application?.id });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">{application ? 'Edit Application' : 'Add New Application'}</h4></header>
                <main className="p-4 space-y-3 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={formData.company} onChange={e => setFormData(p=>({...p, company: e.target.value}))} placeholder="Company Name" />
                        <Input value={formData.role} onChange={e => setFormData(p=>({...p, role: e.target.value}))} placeholder="Role / Position" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <select value={formData.status} onChange={e => setFormData(p=>({...p, status: e.target.value as any}))} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border focus:outline-none focus:ring-2 focus:ring-[#5aa1ff]">
                            {APPLICATION_STATUSES.map(s => <option key={s} value={s} className="bg-[#0b1626]">{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Notes</label>
                        <textarea value={formData.notes} onChange={e => setFormData(p=>({...p, notes: e.target.value}))} rows={3} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                             <Button onClick={() => resumeRef.current?.click()} className="flex-1">Upload Resume</Button>
                             {formData.resumeFileId && <Button variant="outline" onClick={() => handleViewFile(formData.resumeFileId)}>View</Button>}
                             <input type="file" ref={resumeRef} onChange={(e) => handleFileChange('resume', e)} className="hidden" />
                        </div>
                         <div className="flex items-center gap-2">
                             <Button onClick={() => coverLetterRef.current?.click()} className="flex-1">Upload Cover Letter</Button>
                             {formData.coverLetterFileId && <Button variant="outline" onClick={() => handleViewFile(formData.coverLetterFileId)}>View</Button>}
                             <input type="file" ref={coverLetterRef} onChange={(e) => handleFileChange('coverLetter', e)} className="hidden" />
                        </div>
                    </div>
                    <div>
                        <h5 className="font-semibold mt-2">Interview Stages</h5>
                        <div className="space-y-2 mt-1 max-h-40 overflow-y-auto pr-2">
                            {formData.interviews.map((interview, index) => (
                                <div key={interview.id} className="p-2 bg-black/20 rounded-lg space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <Input type="date" value={interview.date} onChange={e => handleInterviewChange(index, 'date', e.target.value)} />
                                        <Input value={interview.type} onChange={e => handleInterviewChange(index, 'type', e.target.value)} placeholder="Type (e.g., Phone Screen)" />
                                        <Button variant="outline" className="text-xs !p-1" onClick={() => removeInterview(interview.id)}>X</Button>
                                    </div>
                                    <textarea value={interview.notes} onChange={e => handleInterviewChange(index, 'notes', e.target.value)} placeholder="Notes..." rows={2} className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border" />
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="text-sm mt-2" onClick={addInterview}>+ Add Interview</Button>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Application</Button>
                </footer>
            </div>
        </div>
    );
};


const JobApplicationManager: React.FC = () => {
    const { jobApplications, setJobApplications } = useAppContext();
    const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [draggedAppId, setDraggedAppId] = useState<number | null>(null);

    const appsByStatus = useMemo(() => {
        const grouped: Record<JobApplication['status'], JobApplication[]> = { Wishlist: [], Applied: [], Interview: [], Offer: [], Rejected: [] };
        jobApplications.forEach(app => {
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        return grouped;
    }, [jobApplications]);

    const handleSave = (appData: Omit<JobApplication, 'id' | 'ts'> & { id?: number }) => {
        if (appData.id) { // Update
            setJobApplications(prev => prev.map(a => a.id === appData.id ? { ...a, ...appData } : a));
        } else { // Create
            const newApp: JobApplication = { ...appData, id: Date.now(), ts: Date.now() };
            setJobApplications(prev => [newApp, ...prev]);
        }
        setIsAddModalOpen(false);
        setSelectedApp(null);
    };
    
    const handleDragStart = (id: number) => setDraggedAppId(id);
    const handleDrop = (targetStatus: JobApplication['status']) => {
        if (draggedAppId === null) return;
        setJobApplications(prev => prev.map(app => app.id === draggedAppId ? {...app, status: targetStatus} : app));
        setDraggedAppId(null);
    };

    return (
        <>
            <CardHeader title="Internship & Job Applications" subtitle="Manage your career pipeline" />
            <div className="mb-4">
                <Button onClick={() => { setSelectedApp(null); setIsAddModalOpen(true); }}>+ Add Application</Button>
                 <Button variant="outline" className="ml-2" onClick={() => downloadJSON(jobApplications, 'job_applications.json')}>Export JSON</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {APPLICATION_STATUSES.map(status => (
                    <div 
                        key={status} 
                        className="bg-[rgba(255,255,255,0.01)] p-2.5 rounded-lg min-h-[140px]"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(status)}
                    >
                        <h4 className="font-semibold text-base mb-2">{status} ({appsByStatus[status].length})</h4>
                        <div className="space-y-2">
                            {appsByStatus[status].map(app => (
                                <div 
                                    key={app.id} 
                                    draggable 
                                    onDragStart={() => handleDragStart(app.id)}
                                    onClick={() => setSelectedApp(app)}
                                    className="bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.03)] p-2.5 rounded-lg cursor-pointer"
                                >
                                    <p className="font-bold text-sm">{app.company}</p>
                                    <p className="text-xs text-gray-300">{app.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {(isAddModalOpen || selectedApp) && (
                <ApplicationModal
                    application={selectedApp || undefined}
                    onSave={handleSave}
                    onClose={() => { setIsAddModalOpen(false); setSelectedApp(null); }}
                />
            )}
        </>
    );
};

export default JobApplicationManager;