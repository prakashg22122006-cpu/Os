
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FeynmanSession, KnowledgeMap, KnowledgeNode, KnowledgeEdge, ReferenceItem } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RichTextEditor from '../ui/RichTextEditor';

// --- FEYNMAN TECHNIQUE ---

const FeynmanWizard: React.FC<{ session: FeynmanSession; onSave: (s: FeynmanSession) => void; onClose: () => void }> = ({ session, onSave, onClose }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState(session);

    const steps = [
        { title: 'Concept', field: 'concept', desc: 'Choose the concept you want to understand.' },
        { title: 'Teach it', field: 'explanation', desc: 'Explain it to a 12-year-old. Use simple language.' },
        { title: 'Review Gaps', field: 'gaps', desc: 'What was hard to explain? Where did you get stuck?' },
        { title: 'Simplify', field: 'simplified', desc: 'Organize and simplify your explanation.' },
        { title: 'Analogy', field: 'analogy', desc: 'Create a real-world analogy.' },
    ];

    const handleNext = () => {
        if (step < 5) setStep(s => s + 1);
        else {
            onSave({ ...data, updatedAt: Date.now() });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Feynman Technique: {steps[step-1].title}</h3>
                    <div className="text-sm text-gray-400">Step {step} of 5</div>
                </div>
                <p className="text-gray-400 mb-2">{steps[step-1].desc}</p>
                
                {step === 1 ? (
                     <Input value={data.concept} onChange={e => setData({...data, concept: e.target.value})} placeholder="E.g. Recursion" className="text-lg" />
                ) : (
                    <textarea 
                        value={(data as any)[steps[step-1].field]} 
                        onChange={e => setData({...data, [steps[step-1].field]: e.target.value})}
                        className="glass-textarea w-full h-64"
                        placeholder="Type here..."
                    />
                )}

                <div className="flex justify-between mt-6">
                    <Button variant="glass" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>{step === 1 ? 'Cancel' : 'Back'}</Button>
                    <Button onClick={handleNext}>{step === 5 ? 'Finish & Save' : 'Next'}</Button>
                </div>
            </div>
        </div>
    );
};

// --- KNOWLEDGE MAP ---

const KnowledgeMapEditor: React.FC = () => {
    const { knowledgeMap, setKnowledgeMap } = useAppContext();
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const addNode = () => {
        const label = prompt("Node Label:");
        if(label) {
            const newNode: KnowledgeNode = {
                id: `kn_${Date.now()}`,
                label,
                x: Math.random() * 300,
                y: Math.random() * 300
            };
            setKnowledgeMap(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
        }
    };

    const handleNodeClick = (id: string) => {
        if(selectedNodeId && selectedNodeId !== id) {
            // Create edge
            const newEdge: KnowledgeEdge = { id: `ke_${Date.now()}`, source: selectedNodeId, target: id };
            setKnowledgeMap(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
            setSelectedNodeId(null);
        } else {
            setSelectedNodeId(id === selectedNodeId ? null : id);
        }
    };

    const deleteNode = (id: string) => {
         if(window.confirm("Delete node?")) {
            setKnowledgeMap(prev => ({
                nodes: prev.nodes.filter(n => n.id !== id),
                edges: prev.edges.filter(e => e.source !== id && e.target !== id)
            }));
            setSelectedNodeId(null);
         }
    };

    return (
        <div className="h-full flex flex-col relative bg-[#050505] rounded-xl border border-white/5 overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button onClick={addNode}>+ Add</Button>
                <div className="bg-black/50 px-3 py-1.5 rounded text-xs text-gray-400 pointer-events-none hidden md:block">
                    Click to select. Click another to link. Double-click to delete.
                </div>
            </div>
            <svg ref={svgRef} className="w-full h-full cursor-crosshair touch-none">
                {knowledgeMap.edges.map(edge => {
                    const s = knowledgeMap.nodes.find(n => n.id === edge.source);
                    const t = knowledgeMap.nodes.find(n => n.id === edge.target);
                    if(!s || !t) return null;
                    return <line key={edge.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#555" strokeWidth="1" />;
                })}
                {knowledgeMap.nodes.map(node => (
                    <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                        <circle 
                            r="25" 
                            fill={selectedNodeId === node.id ? 'var(--grad-1)' : '#222'} 
                            stroke="#555" 
                            strokeWidth="2"
                            onClick={(e) => {e.stopPropagation(); handleNodeClick(node.id)}}
                            onDoubleClick={(e) => {e.stopPropagation(); deleteNode(node.id)}}
                            className="cursor-pointer transition-colors"
                        />
                        <text dy="40" textAnchor="middle" fill="white" fontSize="12" className="pointer-events-none select-none">{node.label}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

// --- REFERENCE LIBRARY ---

const ReferenceEditor: React.FC<{ item: ReferenceItem; onSave: (i: ReferenceItem) => void; onClose: () => void }> = ({ item, onSave, onClose }) => {
    const [data, setData] = useState(item);
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-[#111] rounded-xl border border-white/10 flex flex-col h-[80vh]">
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} className="font-bold text-lg bg-transparent border-none" placeholder="Title"/>
                    <Button onClick={() => { onSave({...data, updatedAt: Date.now()}); onClose(); }}>Save</Button>
                </header>
                <div className="p-4 flex-grow flex flex-col">
                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                        <Input value={data.category} onChange={e => setData({...data, category: e.target.value})} placeholder="Category" className="flex-1" />
                        <Input value={data.tags.join(', ')} onChange={e => setData({...data, tags: e.target.value.split(',').map(t=>t.trim())})} placeholder="Tags" className="flex-1" />
                    </div>
                    <div className="flex-grow overflow-hidden flex flex-col border border-white/10 rounded-lg">
                        <RichTextEditor value={data.content} onChange={c => setData({...data, content: c})} />
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 text-right">
                     <Button variant="glass" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    )
}

const ReferenceLibrary: React.FC = () => {
    const { referenceLibrary, setReferenceLibrary } = useAppContext();
    const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = referenceLibrary.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const handleSave = (item: ReferenceItem) => {
        setReferenceLibrary(prev => {
             const idx = prev.findIndex(p => p.id === item.id);
             if(idx >= 0) {
                 const next = [...prev];
                 next[idx] = item;
                 return next;
             }
             return [...prev, item];
        });
        setEditingItem(null);
    };

    const handleDelete = (id: number) => {
        if(window.confirm('Delete reference?')) {
            setReferenceLibrary(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex gap-2 mb-4">
                 <Input placeholder="Search library..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow" />
                 <Button onClick={() => setEditingItem({ id: Date.now(), title: '', content: '', category: '', tags: [], updatedAt: Date.now() })}>+ New</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
                 {filtered.map(item => (
                     <div key={item.id} className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-all group relative">
                         <div className="text-xs uppercase text-gray-500 font-bold mb-1">{item.category || 'General'}</div>
                         <h4 className="font-bold text-white text-lg mb-2">{item.title || 'Untitled'}</h4>
                         <div className="flex gap-1 mb-3 flex-wrap">
                             {item.tags.map(t => <span key={t} className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-400">{t}</span>)}
                         </div>
                         <div className="flex gap-2 mt-auto">
                             <Button variant="glass" className="text-xs flex-1" onClick={() => setEditingItem(item)}>Edit / View</Button>
                             <Button variant="glass" className="text-xs text-red-400" onClick={() => handleDelete(item.id)}>Del</Button>
                         </div>
                     </div>
                 ))}
                 {filtered.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Library is empty.</p>}
             </div>
             {editingItem && <ReferenceEditor item={editingItem} onSave={handleSave} onClose={() => setEditingItem(null)} />}
        </div>
    )
}

// --- MAIN MANAGER ---

const DeepWorkManager: React.FC = () => {
    const { feynmanSessions, setFeynmanSessions } = useAppContext();
    const [activeTab, setActiveTab] = useState<'feynman' | 'map' | 'reference'>('feynman');
    const [activeFeynman, setActiveFeynman] = useState<FeynmanSession | null>(null);

    const handleFeynmanSave = (s: FeynmanSession) => {
        setFeynmanSessions(prev => {
            const idx = prev.findIndex(p => p.id === s.id);
            if(idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
            return [...prev, s];
        });
        setActiveFeynman(null);
    };

    const deleteFeynman = (id: number) => {
        if(window.confirm("Delete this session?")) setFeynmanSessions(prev => prev.filter(s => s.id !== id));
    }

    return (
        <div className="h-full flex flex-col">
             <div className="flex border-b border-white/10 mb-4 overflow-x-auto">
                <button onClick={() => setActiveTab('feynman')} className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'feynman' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Feynman Space</button>
                <button onClick={() => setActiveTab('map')} className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'map' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Knowledge Map</button>
                <button onClick={() => setActiveTab('reference')} className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'reference' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Ref Library</button>
            </div>
            
            <div className="flex-grow overflow-hidden">
                {activeTab === 'feynman' && (
                    <div className="h-full flex flex-col">
                         <div className="mb-4 flex justify-end">
                             <Button onClick={() => setActiveFeynman({ id: Date.now(), concept: '', explanation: '', gaps: '', simplified: '', analogy: '', updatedAt: Date.now() })}>+ New Session</Button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
                             {feynmanSessions.map(s => (
                                 <div key={s.id} className="bg-white/5 border border-white/5 p-4 rounded-xl cursor-pointer hover:border-white/20 transition-all" onClick={() => setActiveFeynman(s)}>
                                     <h4 className="font-bold text-lg mb-1">{s.concept || 'Untitled Concept'}</h4>
                                     <p className="text-sm text-gray-400 line-clamp-3">{s.simplified || s.explanation || 'No content yet.'}</p>
                                     <div className="mt-2 flex justify-between items-center">
                                         <span className="text-xs text-gray-500">{new Date(s.updatedAt).toLocaleDateString()}</span>
                                         <button onClick={(e) => {e.stopPropagation(); deleteFeynman(s.id)}} className="text-red-400 text-xs hover:underline">Delete</button>
                                     </div>
                                 </div>
                             ))}
                             {feynmanSessions.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No sessions recorded.</p>}
                         </div>
                    </div>
                )}
                {activeTab === 'map' && <KnowledgeMapEditor />}
                {activeTab === 'reference' && <ReferenceLibrary />}
            </div>
            {activeFeynman && <FeynmanWizard session={activeFeynman} onSave={handleFeynmanSave} onClose={() => setActiveFeynman(null)} />}
        </div>
    );
};

export default DeepWorkManager;
