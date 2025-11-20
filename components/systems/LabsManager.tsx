
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { LabRecord, ResearchPaper } from '../../types';

const LabRecordsView: React.FC = () => {
    const { labRecords, setLabRecords } = useAppContext();
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');

    const addLab = () => {
        if (!name) return;
        setLabRecords(prev => [{ id: Date.now(), name, subject, date: new Date().toISOString().split('T')[0], ts: Date.now() }, ...prev]);
        setName('');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Experiment Name" />
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
                <Button onClick={addLab}>Add Lab</Button>
            </div>
            <div className="space-y-2 overflow-y-auto">
                {labRecords.map(rec => (
                    <div key={rec.id} className="p-3 bg-white/5 rounded border border-white/10">
                        <div className="flex justify-between">
                            <h5 className="font-bold">{rec.name}</h5>
                            <span className="text-xs text-gray-400">{rec.date}</span>
                        </div>
                        <p className="text-sm text-gray-300">{rec.subject}</p>
                        <textarea 
                            className="w-full mt-2 bg-black/20 rounded p-2 text-xs text-gray-300 border-none resize-none" 
                            placeholder="Observations..."
                            value={rec.observations || ''}
                            onChange={e => setLabRecords(prev => prev.map(r => r.id === rec.id ? {...r, observations: e.target.value} : r))}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResearchPapersView: React.FC = () => {
    const { researchPapers, setResearchPapers } = useAppContext();
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');

    const addPaper = () => {
        if (!title) return;
        setResearchPapers(prev => [{ id: Date.now(), title, link, field: 'General', ts: Date.now() }, ...prev]);
        setTitle('');
        setLink('');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Paper Title" />
                <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Link / DOI" />
                <Button onClick={addPaper}>Track</Button>
            </div>
            <div className="space-y-2 overflow-y-auto">
                {researchPapers.map(paper => (
                    <div key={paper.id} className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center">
                        <div>
                            <a href={paper.link} target="_blank" rel="noreferrer" className="font-bold text-blue-300 hover:underline">{paper.title}</a>
                            <p className="text-xs text-gray-400">Added: {new Date(paper.ts).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" className="text-xs text-red-400" onClick={() => setResearchPapers(prev => prev.filter(p => p.id !== paper.id))}>Remove</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LabsManager: React.FC = () => {
    const [tab, setTab] = useState<'labs' | 'research'>('labs');
    
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-[#cfe8ff]">Projects, Labs & Research</h3>
            <div className="flex border-b border-white/10 mb-4">
                <button onClick={() => setTab('labs')} className={`px-4 py-2 ${tab === 'labs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Lab Records</button>
                <button onClick={() => setTab('research')} className={`px-4 py-2 ${tab === 'research' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Research Papers</button>
            </div>
            <div className="flex-grow min-h-0">
                {tab === 'labs' ? <LabRecordsView /> : <ResearchPapersView />}
            </div>
        </div>
    );
};

export default LabsManager;
