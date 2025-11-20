
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DesignDiagram, DesignNode, DesignEdge, AlgoVisual, AlgoVisualStep } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useMobile } from '../../hooks/useMobile';

// --- SHARED TYPES & HELPERS ---
const NODE_TYPES = [
    { type: 'box', label: 'Service', shape: 'rect' },
    { type: 'database', label: 'DB', shape: 'cylinder' },
    { type: 'actor', label: 'User', shape: 'circle' },
    { type: 'cloud', label: 'Cloud', shape: 'cloud' },
];

// --- COMPONENT: DIAGRAM EDITOR ---

const DiagramEditor: React.FC<{ diagram: DesignDiagram; onSave: (d: DesignDiagram) => void; onClose: () => void }> = ({ diagram, onSave, onClose }) => {
    const [nodes, setNodes] = useState<DesignNode[]>(diagram.nodes);
    const [edges, setEdges] = useState<DesignEdge[]>(diagram.edges);
    const [title, setTitle] = useState(diagram.title);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [mode, setMode] = useState<'select' | 'link'>('select');
    const svgRef = useRef<SVGSVGElement>(null);
    const isMobile = useMobile();
    const [showTools, setShowTools] = useState(!isMobile);

    const handleAddNode = (type: any) => {
        const newNode: DesignNode = {
            id: `node_${Date.now()}`,
            type: type.type,
            label: type.label,
            x: 100 + Math.random() * 50,
            y: 100 + Math.random() * 50,
            w: 100,
            h: 60
        };
        setNodes([...nodes, newNode]);
        if(isMobile) setShowTools(false);
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
        if (mode === 'link') {
            if (selectedNodeId && selectedNodeId !== nodeId) {
                // Create link
                setEdges([...edges, { id: `edge_${Date.now()}`, from: selectedNodeId, to: nodeId }]);
                setSelectedNodeId(null);
                setMode('select');
            } else {
                setSelectedNodeId(nodeId);
            }
        } else {
            setSelectedNodeId(nodeId);
            // Drag logic
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            
            const startX = clientX;
            const startY = clientY;
            const origX = node.x;
            const origY = node.y;

            const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
                const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
                const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

                const dx = moveClientX - startX;
                const dy = moveClientY - startY;
                setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: origX + dx, y: origY + dy } : n));
            };

            const handleEnd = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleEnd);
                window.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleEnd);
            };

            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedNodeId) {
            setNodes(nodes.filter(n => n.id !== selectedNodeId));
            setEdges(edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId));
            setSelectedNodeId(null);
        }
    };

    const updateNodeLabel = (label: string) => {
        if(selectedNodeId) {
            setNodes(prev => prev.map(n => n.id === selectedNodeId ? {...n, label} : n));
        }
    }

    // Render helpers
    const renderShape = (node: DesignNode) => {
        const isSelected = selectedNodeId === node.id;
        const stroke = isSelected ? 'var(--grad-1)' : '#555';
        
        if (node.type === 'database') {
            return (
                <g>
                    <ellipse cx={node.w/2} cy={10} rx={node.w/2} ry={10} fill="#222" stroke={stroke} />
                    <path d={`M0,10 v${node.h-20} a${node.w/2},10 0 0 0 ${node.w},0 v-${node.h-20}`} fill="#222" stroke={stroke} />
                </g>
            )
        } else if (node.type === 'actor') {
             return <circle cx={node.w/2} cy={node.h/2} r={30} fill="#222" stroke={stroke} />
        } else if (node.type === 'cloud') {
             return <ellipse cx={node.w/2} cy={node.h/2} rx={node.w/2} ry={node.h/2} fill="#222" stroke={stroke} />
        }
        return <rect width={node.w} height={node.h} rx={5} fill="#222" stroke={stroke} strokeWidth={2} />;
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col">
            <header className="p-2 border-b border-white/10 flex justify-between items-center bg-[#111] flex-wrap gap-2">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input value={title} onChange={e => setTitle(e.target.value)} className="font-bold bg-transparent border-none !text-lg flex-grow" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                     <div className="flex bg-white/5 rounded p-1 gap-1">
                        <button onClick={() => setMode('select')} className={`px-3 py-1 rounded text-xs ${mode === 'select' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Select</button>
                        <button onClick={() => setMode('link')} className={`px-3 py-1 rounded text-xs ${mode === 'link' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Link</button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="text-xs">Close</Button>
                        <Button onClick={() => onSave({ ...diagram, title, nodes, edges, updatedAt: Date.now() })} className="text-xs">Save</Button>
                    </div>
                </div>
            </header>
            <div className="flex-grow flex overflow-hidden relative">
                <Button variant="glass" className="absolute top-2 left-2 z-20 text-xs md:hidden" onClick={() => setShowTools(!showTools)}>{showTools ? 'Hide Tools' : 'Tools'}</Button>

                <div className={`${showTools ? 'flex' : 'hidden'} absolute md:relative z-10 bg-[#111] h-full md:w-48 w-40 border-r border-white/10 p-4 flex-col gap-2 shadow-xl md:shadow-none`}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 mt-8 md:mt-0">Components</h4>
                    {NODE_TYPES.map(t => (
                        <button key={t.type} onClick={() => handleAddNode(t)} className="p-3 bg-white/5 hover:bg-white/10 rounded text-sm text-left border border-white/5">
                            + {t.label}
                        </button>
                    ))}
                    <div className="mt-auto pt-4 border-t border-white/10">
                        {selectedNodeId && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Properties</h4>
                                <Input value={nodes.find(n => n.id === selectedNodeId)?.label || ''} onChange={e => updateNodeLabel(e.target.value)} />
                                <Button variant="outline" className="w-full text-red-400" onClick={handleDeleteSelected}>Delete Node</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-grow relative bg-[#080808] overflow-hidden cursor-crosshair touch-none">
                    <svg ref={svgRef} width="100%" height="100%" className="w-full h-full">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
                            </marker>
                        </defs>
                        {edges.map(edge => {
                            const from = nodes.find(n => n.id === edge.from);
                            const to = nodes.find(n => n.id === edge.to);
                            if (!from || !to) return null;
                            return (
                                <line 
                                    key={edge.id} 
                                    x1={from.x + from.w/2} y1={from.y + from.h/2} 
                                    x2={to.x + to.w/2} y2={to.y + to.h/2} 
                                    stroke="#555" strokeWidth="2" markerEnd="url(#arrowhead)" 
                                />
                            );
                        })}
                        {nodes.map(node => (
                            <g 
                                key={node.id} 
                                transform={`translate(${node.x}, ${node.y})`} 
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, node.id); }}
                                onTouchStart={(e) => { e.stopPropagation(); handleMouseDown(e, node.id); }}
                                className="cursor-move"
                            >
                                {renderShape(node)}
                                <text x={node.w/2} y={node.h/2} dy=".3em" textAnchor="middle" fill="white" fontSize="12" pointerEvents="none" style={{userSelect: 'none'}}>{node.label}</text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: ALGO VISUALIZER ---

const AlgoVisualEditor: React.FC<{ algo: AlgoVisual; onSave: (a: AlgoVisual) => void; onClose: () => void }> = ({ algo, onSave, onClose }) => {
    const [steps, setSteps] = useState<AlgoVisualStep[]>(algo.steps);
    const [title, setTitle] = useState(algo.title);
    const [currentStep, setCurrentStep] = useState(0);
    const [isEditingStep, setIsEditingStep] = useState(false);
    const [editingStepData, setEditingStepData] = useState<AlgoVisualStep>({ description: '', visualData: '' });

    const handleSaveStep = () => {
        const newSteps = [...steps];
        if (currentStep < newSteps.length) {
            newSteps[currentStep] = editingStepData;
        } else {
            newSteps.push(editingStepData);
        }
        setSteps(newSteps);
        setIsEditingStep(false);
    };
    
    const handleAddStep = () => {
        setEditingStepData({ description: 'New Step', visualData: '[]' });
        setCurrentStep(steps.length);
        setIsEditingStep(true);
    };

    const handleDeleteStep = () => {
        setSteps(steps.filter((_, i) => i !== currentStep));
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        setIsEditingStep(false);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col">
            <header className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <Input value={title} onChange={e => setTitle(e.target.value)} className="font-bold bg-transparent border-none !text-lg" />
                <div className="flex gap-2">
                     <Button variant="outline" onClick={onClose}>Close</Button>
                     <Button onClick={() => onSave({ ...algo, title, steps, updatedAt: Date.now() })}>Save Algo</Button>
                </div>
            </header>
            <div className="flex-grow flex flex-col p-4 items-center justify-center bg-[#050505]">
                <div className="w-full max-w-3xl bg-white/5 rounded-xl p-6 border border-white/10 min-h-[400px] flex flex-col relative">
                    {isEditingStep ? (
                         <div className="space-y-4 flex-grow">
                             <h4 className="font-bold text-white">Edit Step {currentStep + 1}</h4>
                             <textarea 
                                value={editingStepData.description} 
                                onChange={e => setEditingStepData({...editingStepData, description: e.target.value})} 
                                placeholder="Description..." 
                                className="glass-textarea w-full h-20"
                             />
                             <textarea 
                                value={editingStepData.visualData} 
                                onChange={e => setEditingStepData({...editingStepData, visualData: e.target.value})} 
                                placeholder="Visual Representation (ASCII or Text)..." 
                                className="glass-textarea w-full h-40 font-mono"
                             />
                             <div className="flex justify-end gap-2">
                                 <Button variant="glass" onClick={() => setIsEditingStep(false)}>Cancel</Button>
                                 <Button onClick={handleSaveStep}>Save Step</Button>
                             </div>
                         </div>
                    ) : (
                         steps.length > 0 && steps[currentStep] ? (
                             <div className="flex-grow flex flex-col items-center justify-center text-center">
                                 <pre className="text-xl md:text-4xl font-mono text-green-400 mb-8 whitespace-pre-wrap">{steps[currentStep].visualData}</pre>
                                 <p className="text-lg md:text-xl text-gray-300">{steps[currentStep].description}</p>
                             </div>
                         ) : (
                             <div className="flex-grow flex items-center justify-center text-gray-500">No steps defined. Add one.</div>
                         )
                    )}
                </div>
                
                <div className="mt-6 flex gap-4 items-center w-full max-w-3xl justify-between flex-wrap">
                    <div className="flex gap-2 w-full justify-center md:w-auto md:justify-start">
                        <Button disabled={currentStep === 0} onClick={() => setCurrentStep(c => c - 1)} variant="glass">Prev</Button>
                        <div className="text-gray-400 my-auto">Step {steps.length > 0 ? currentStep + 1 : 0} / {steps.length}</div>
                        <Button disabled={currentStep >= steps.length - 1} onClick={() => setCurrentStep(c => c + 1)} variant="glass">Next</Button>
                    </div>
                    <div className="flex gap-2 w-full justify-center md:w-auto md:justify-end">
                         {!isEditingStep && steps[currentStep] && <Button variant="outline" onClick={() => { setEditingStepData(steps[currentStep]); setIsEditingStep(true); }}>Edit</Button>}
                         {!isEditingStep && steps[currentStep] && <Button variant="outline" className="text-red-400" onClick={handleDeleteStep}>Del</Button>}
                         <Button onClick={handleAddStep}>+ Step</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const DesignStudio: React.FC = () => {
    const { designDiagrams, setDesignDiagrams, algoVisuals, setAlgoVisuals } = useAppContext();
    const [activeTab, setActiveTab] = useState<'diagrams' | 'algos'>('diagrams');
    const [editingDiagram, setEditingDiagram] = useState<DesignDiagram | null>(null);
    const [editingAlgo, setEditingAlgo] = useState<AlgoVisual | null>(null);

    const handleCreateDiagram = () => {
        const newDiagram: DesignDiagram = {
            id: Date.now(),
            title: 'New System Design',
            nodes: [],
            edges: [],
            updatedAt: Date.now(),
        };
        setEditingDiagram(newDiagram);
    };

    const handleCreateAlgo = () => {
        const newAlgo: AlgoVisual = {
            id: Date.now(),
            title: 'New Algorithm',
            steps: [],
            updatedAt: Date.now(),
        };
        setEditingAlgo(newAlgo);
    };
    
    const saveDiagram = (d: DesignDiagram) => {
        setDesignDiagrams(prev => {
            const exists = prev.find(ex => ex.id === d.id);
            if(exists) return prev.map(ex => ex.id === d.id ? d : ex);
            return [...prev, d];
        });
        setEditingDiagram(null);
    };

    const deleteDiagram = (id: number) => {
        if(window.confirm("Delete this diagram?")) {
            setDesignDiagrams(prev => prev.filter(d => d.id !== id));
        }
    };

    const saveAlgo = (a: AlgoVisual) => {
         setAlgoVisuals(prev => {
            const exists = prev.find(ex => ex.id === a.id);
            if(exists) return prev.map(ex => ex.id === a.id ? a : ex);
            return [...prev, a];
        });
        setEditingAlgo(null);
    };

    const deleteAlgo = (id: number) => {
         if(window.confirm("Delete this visualization?")) {
            setAlgoVisuals(prev => prev.filter(a => a.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('diagrams')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'diagrams' ? 'border-[var(--grad-1)] text-white' : 'border-transparent text-gray-400'}`}>System Design</button>
                    <button onClick={() => setActiveTab('algos')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'algos' ? 'border-[var(--grad-1)] text-white' : 'border-transparent text-gray-400'}`}>Algorithm Visuals</button>
                </div>
                <Button onClick={activeTab === 'diagrams' ? handleCreateDiagram : handleCreateAlgo}>+ Create New</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
                {activeTab === 'diagrams' && designDiagrams.map(d => (
                    <div key={d.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-all group relative aspect-video flex flex-col justify-center items-center cursor-pointer" onClick={() => setEditingDiagram(d)}>
                        <div className="text-4xl mb-2 opacity-50">💠</div>
                        <h4 className="font-bold text-center">{d.title}</h4>
                        <span className="text-xs text-gray-500">{d.nodes.length} nodes</span>
                        <Button variant="glass" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 scale-75 text-red-400" onClick={(e) => {e.stopPropagation(); deleteDiagram(d.id);}}>Del</Button>
                    </div>
                ))}
                {activeTab === 'algos' && algoVisuals.map(a => (
                    <div key={a.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-all group relative aspect-video flex flex-col justify-center items-center cursor-pointer" onClick={() => setEditingAlgo(a)}>
                        <div className="text-4xl mb-2 opacity-50">🎬</div>
                        <h4 className="font-bold text-center">{a.title}</h4>
                        <span className="text-xs text-gray-500">{a.steps.length} steps</span>
                        <Button variant="glass" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 scale-75 text-red-400" onClick={(e) => {e.stopPropagation(); deleteAlgo(a.id);}}>Del</Button>
                    </div>
                ))}
            </div>
            
            {activeTab === 'diagrams' && designDiagrams.length === 0 && <div className="text-center text-gray-500 py-10">No diagrams yet.</div>}
            {activeTab === 'algos' && algoVisuals.length === 0 && <div className="text-center text-gray-500 py-10">No visuals yet.</div>}

            {editingDiagram && <DiagramEditor diagram={editingDiagram} onSave={saveDiagram} onClose={() => setEditingDiagram(null)} />}
            {editingAlgo && <AlgoVisualEditor algo={editingAlgo} onSave={saveAlgo} onClose={() => setEditingAlgo(null)} />}
        </div>
    );
};

export default DesignStudio;
