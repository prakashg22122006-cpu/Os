
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { CodeSnippet, Algorithm, BugLog, SnippetVersion } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

// --- Visualizer Logic ---

type VisualizerActionType = 'compare' | 'swap' | 'set' | 'sorted' | 'pivot' | 'idle';

interface VisualizerStep {
    arr: number[];
    indices: number[]; // Indices involved in the action
    type: VisualizerActionType;
    message: string;
}

// Generator Functions for Algorithms
function* bubbleSort(initialArr: number[]): Generator<VisualizerStep, void, unknown> {
    let arr = [...initialArr];
    let n = arr.length;
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            yield { arr: [...arr], indices: [j, j + 1], type: 'compare', message: `Comparing ${arr[j]} and ${arr[j+1]}` };
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                yield { arr: [...arr], indices: [j, j + 1], type: 'swap', message: `Swapping ${arr[j]} > ${arr[j+1]}` };
            }
        }
        yield { arr: [...arr], indices: [n - i - 1], type: 'sorted', message: `${arr[n-i-1]} is sorted` };
    }
    yield { arr: [...arr], indices: [], type: 'idle', message: 'Sorting Complete' };
}

function* selectionSort(initialArr: number[]): Generator<VisualizerStep, void, unknown> {
    let arr = [...initialArr];
    let n = arr.length;
    
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            yield { arr: [...arr], indices: [minIdx, j], type: 'compare', message: `Comparing minimum ${arr[minIdx]} with ${arr[j]}` };
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
                yield { arr: [...arr], indices: [minIdx], type: 'pivot', message: `New minimum found: ${arr[minIdx]}` };
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            yield { arr: [...arr], indices: [i, minIdx], type: 'swap', message: `Swapping ${arr[i]} and ${arr[minIdx]}` };
        }
        yield { arr: [...arr], indices: [i], type: 'sorted', message: `${arr[i]} is sorted` };
    }
    yield { arr: [...arr], indices: [], type: 'idle', message: 'Sorting Complete' };
}

function* insertionSort(initialArr: number[]): Generator<VisualizerStep, void, unknown> {
    let arr = [...initialArr];
    let n = arr.length;
    
    yield { arr: [...arr], indices: [0], type: 'sorted', message: 'First element is considered sorted' };

    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        
        yield { arr: [...arr], indices: [i], type: 'pivot', message: `Selected key: ${key}` };

        while (j >= 0 && arr[j] > key) {
            yield { arr: [...arr], indices: [j, j + 1], type: 'compare', message: `Comparing ${arr[j]} > ${key}` };
            arr[j + 1] = arr[j];
            yield { arr: [...arr], indices: [j, j + 1], type: 'set', message: `Moving ${arr[j]} forward` };
            j = j - 1;
        }
        arr[j + 1] = key;
        yield { arr: [...arr], indices: [j + 1], type: 'set', message: `Inserted ${key} at index ${j + 1}` };
    }
    yield { arr: [...arr], indices: [], type: 'idle', message: 'Sorting Complete' };
}

function* quickSort(initialArr: number[]): Generator<VisualizerStep, void, unknown> {
    let arr = [...initialArr];
    
    function* partition(low: number, high: number): Generator<VisualizerStep, number, unknown> {
        let pivot = arr[high];
        yield { arr: [...arr], indices: [high], type: 'pivot', message: `Pivot chosen: ${pivot}` };
        
        let i = low - 1;
        for (let j = low; j < high; j++) {
            yield { arr: [...arr], indices: [j, high], type: 'compare', message: `Comparing ${arr[j]} with pivot ${pivot}` };
            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                yield { arr: [...arr], indices: [i, j], type: 'swap', message: `Swapping ${arr[i]} and ${arr[j]}` };
            }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        yield { arr: [...arr], indices: [i + 1, high], type: 'swap', message: `Moving pivot to correct position` };
        return i + 1;
    }

    function* sort(low: number, high: number): Generator<VisualizerStep, void, unknown> {
        if (low < high) {
            const pi = yield* partition(low, high);
            yield { arr: [...arr], indices: [pi], type: 'sorted', message: `${arr[pi]} is sorted` };
            yield* sort(low, pi - 1);
            yield* sort(pi + 1, high);
        } else if (low === high) {
            yield { arr: [...arr], indices: [low], type: 'sorted', message: `${arr[low]} is sorted` };
        }
    }

    yield* sort(0, arr.length - 1);
    yield { arr: [...arr], indices: [], type: 'idle', message: 'Sorting Complete' };
}


const AlgorithmVisualizer: React.FC<{ initialAlgo?: string; onBack?: () => void }> = ({ initialAlgo, onBack }) => {
    const [algoType, setAlgoType] = useState(initialAlgo || 'bubble');
    const [arraySize, setArraySize] = useState(15);
    const [speed, setSpeed] = useState(100); // ms
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [visualState, setVisualState] = useState<VisualizerStep>({ arr: [], indices: [], type: 'idle', message: 'Ready' });
    const arrRef = useRef<number[]>([]); 
    const generatorRef = useRef<Generator<VisualizerStep, void, unknown> | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (initialAlgo) setAlgoType(initialAlgo);
    }, [initialAlgo]);

    const generateArray = useCallback(() => {
        const newArr = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 50) + 5);
        setVisualState({ arr: newArr, indices: [], type: 'idle', message: 'Ready' });
        arrRef.current = newArr; // Update ref
        generatorRef.current = null;
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [arraySize]);

    useEffect(() => {
        generateArray();
    }, [generateArray]);

    const initGenerator = () => {
        const currentArr = arrRef.current; 
        if (algoType === 'bubble') generatorRef.current = bubbleSort(currentArr);
        else if (algoType === 'selection') generatorRef.current = selectionSort(currentArr);
        else if (algoType === 'insertion') generatorRef.current = insertionSort(currentArr);
        else if (algoType === 'quick') generatorRef.current = quickSort(currentArr);
    };

    const step = useCallback(() => {
        if (!generatorRef.current) initGenerator();
        const next = generatorRef.current?.next();
        
        if (next && !next.done) {
            setVisualState(next.value);
            arrRef.current = next.value.arr;
        } else {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [algoType]); 

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(step, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, speed, step]);

    const getBarColor = (index: number) => {
        if (visualState.type === 'sorted' && visualState.indices.includes(index)) return 'bg-green-500'; 
        if (visualState.type === 'compare' && visualState.indices.includes(index)) return 'bg-yellow-400';
        if (visualState.type === 'swap' && visualState.indices.includes(index)) return 'bg-red-500';
        if (visualState.type === 'pivot' && visualState.indices.includes(index)) return 'bg-purple-500';
        if (visualState.type === 'set' && visualState.indices.includes(index)) return 'bg-blue-400';
        return 'bg-blue-600';
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-black/20 rounded-lg border border-white/10 items-center">
                 {onBack && (
                    <Button variant="outline" onClick={onBack} className="mr-2 text-xs">← Database</Button>
                 )}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Algorithm</label>
                    <select value={algoType} onChange={e => { setAlgoType(e.target.value); generateArray(); }} className="bg-[#0b1626] border border-white/20 rounded p-1 text-sm text-white">
                        <option value="bubble">Bubble Sort</option>
                        <option value="selection">Selection Sort</option>
                        <option value="insertion">Insertion Sort</option>
                        <option value="quick">Quick Sort</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Size: {arraySize}</label>
                    <input type="range" min="5" max="50" value={arraySize} onChange={e => setArraySize(Number(e.target.value))} className="w-24 accent-[var(--accent-color)]" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Speed: {speed}ms</label>
                    <input type="range" min="10" max="500" step="10" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24 accent-[var(--accent-color)]" />
                </div>
                <div className="flex items-end gap-2 ml-auto">
                     <Button variant="outline" onClick={step} disabled={isPlaying} className="text-xs">Step</Button>
                    <Button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</Button>
                    <Button variant="outline" onClick={generateArray} className="text-red-400 border-red-500/50 hover:bg-red-500/10">Reset</Button>
                </div>
            </div>
            
            <div className="flex-grow bg-black/40 rounded-lg border border-white/10 relative flex items-end justify-center gap-1 p-4 overflow-hidden">
                 <div className="absolute top-4 left-4 text-sm font-mono text-green-400 bg-black/50 p-2 rounded border border-green-500/30 z-10">
                    {visualState.message}
                </div>
                {visualState.arr.map((val, idx) => (
                    <div 
                        key={idx} 
                        className={`w-full max-w-[30px] rounded-t-sm transition-all duration-100 ${getBarColor(idx)} flex flex-col justify-end items-center`}
                        style={{ height: `${(val / 60) * 100}%` }}
                    >
                        {arraySize <= 20 && <span className="text-[10px] text-white/70 -mt-6 pointer-events-none">{val}</span>}
                    </div>
                ))}
            </div>
             <div className="mt-4 flex gap-4 justify-center text-xs text-gray-400">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Compare</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Swap</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Sorted</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Pivot/Key</span>
            </div>
        </div>
    );
};

// --- Snippet & Algorithm Editors --- (No changes needed to SnippetEditor, keeping it truncated for brevity if possible, but full content required)

const SnippetEditor: React.FC<{ snippet?: CodeSnippet, onSave: (s: CodeSnippet) => void, onClose: () => void }> = ({ snippet, onSave, onClose }) => {
    const [data, setData] = useState<Partial<CodeSnippet>>(snippet || { tags: [], versions: [] });
    const [tagInput, setTagInput] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const handleSave = () => {
        if (!data.title || !data.code) return alert("Title and Code are required.");
        onSave({
            id: data.id || Date.now(),
            title: data.title!,
            language: data.language || 'javascript',
            code: data.code!,
            tags: data.tags || [],
            category: data.category || '',
            ts: data.ts || Date.now(),
            versions: data.versions || []
        });
        onClose();
    };

    const handleSaveVersion = () => {
        if (!data.code) return;
        const label = prompt("Version label (optional):", `v${(data.versions?.length || 0) + 1}`);
        if (label === null) return; 
        
        const newVersion: SnippetVersion = {
            id: Date.now().toString(),
            ts: Date.now(),
            code: data.code,
            label: label || `Version ${(data.versions?.length || 0) + 1}`
        };
        
        setData(prev => ({ ...prev, versions: [newVersion, ...(prev.versions || [])] }));
    };

    const handleRestore = (v: SnippetVersion) => {
        if (window.confirm(`Revert to version "${v.label}"? Current changes will be lost.`)) {
            setData(prev => ({ ...prev, code: v.code }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-[#0b1626] border border-white/10 rounded-xl shadow-2xl w-full h-[85vh] flex flex-col transition-all duration-300 ${showHistory ? 'max-w-6xl' : 'max-w-3xl'}`} onClick={e => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-lg">Snippet Editor</h4>
                        <span className="text-xs text-gray-500">{data.versions?.length || 0} versions</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>{showHistory ? 'Hide History' : 'Show History'}</Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Snippet</Button>
                    </div>
                </header>
                
                <div className="flex flex-grow overflow-hidden">
                    <main className="flex-grow p-4 flex flex-col gap-3 overflow-y-auto">
                        <div className="flex gap-2">
                            <Input value={data.title || ''} onChange={e => setData({...data, title: e.target.value})} placeholder="Title" className="font-semibold" />
                            <select value={data.language || 'javascript'} onChange={e => setData({...data, language: e.target.value})} className="bg-[#0f172a] border border-white/10 rounded p-2 text-sm text-white">
                                {['javascript', 'typescript', 'python', 'cpp', 'java', 'sql', 'html', 'css'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400 uppercase font-semibold">Code Content</label>
                            <button onClick={handleSaveVersion} className="text-xs text-[var(--accent-color)] hover:underline">+ Save Version</button>
                        </div>
                        <textarea value={data.code || ''} onChange={e => setData({...data, code: e.target.value})} className="flex-grow bg-[#0f172a] font-mono text-sm p-4 rounded-lg border border-white/10 text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]" placeholder="// Paste code here..." spellCheck={false} />
                        <div className="flex gap-2 items-center">
                            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag (Enter)..." onKeyDown={e => { if(e.key === 'Enter' && tagInput.trim()) { setData({...data, tags: [...(data.tags||[]), tagInput.trim()]}); setTagInput(''); } }} className="max-w-xs" />
                            <div className="flex gap-1 flex-wrap">{data.tags?.map(t => <span key={t} className="text-xs bg-[var(--accent-color)]/10 text-[var(--accent-color)] px-2 py-1 rounded border border-[var(--accent-color)]/20 flex items-center gap-1">{t} <button onClick={() => setData({...data, tags: data.tags?.filter(tag => tag !== t)})} className="hover:text-white">×</button></span>)}</div>
                        </div>
                    </main>

                    {showHistory && (
                        <aside className="w-80 border-l border-white/10 bg-black/20 flex flex-col flex-shrink-0 p-3 overflow-y-auto space-y-3">
                            <h5 className="font-bold text-sm text-gray-400">Version History</h5>
                            {data.versions?.map(v => (
                                <div key={v.id} className="bg-[#0f172a] border border-white/5 p-3 rounded-lg hover:border-[var(--accent-color)]/30 transition-colors">
                                    <div className="flex justify-between mb-1"><span className="font-semibold text-sm truncate">{v.label}</span><span className="text-[10px] text-gray-500">{new Date(v.ts).toLocaleDateString()}</span></div>
                                    <div className="text-[10px] text-gray-600 font-mono mb-2 truncate bg-black/30 p-1 rounded">{v.code.substring(0, 40)}...</div>
                                    <Button variant="outline" className="text-xs w-full" onClick={() => handleRestore(v)}>Revert</Button>
                                </div>
                            ))}
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

const AlgorithmEditor: React.FC<{ algo?: Algorithm, onSave: (a: Algorithm) => void, onClose: () => void }> = ({ algo, onSave, onClose }) => {
    const [data, setData] = useState<Partial<Algorithm>>(algo || { status: 'To Learn' });

    const handleSave = () => {
        if (!data.name) return alert("Name is required.");
        onSave({
            id: data.id || Date.now(),
            name: data.name!,
            type: data.type || 'Other',
            complexityTime: data.complexityTime || '',
            complexitySpace: data.complexitySpace || '',
            description: data.description || '',
            codeExample: data.codeExample || '',
            status: data.status || 'To Learn',
            notes: data.notes || ''
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0b1626] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-bold text-lg">{data.id ? 'Edit Algorithm' : 'New Algorithm'}</h4></header>
                <main className="p-4 space-y-4 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                        <Input value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} placeholder="Algorithm Name" />
                        <select value={data.type || 'Other'} onChange={e => setData({...data, type: e.target.value as any})} className="bg-[#0f172a] border border-white/10 rounded p-2 text-sm text-white">
                            <option value="Sorting">Sorting</option>
                            <option value="Searching">Searching</option>
                            <option value="Graph">Graph</option>
                            <option value="DP">DP</option>
                            <option value="Tree">Tree</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input value={data.complexityTime || ''} onChange={e => setData({...data, complexityTime: e.target.value})} placeholder="Time Complexity (e.g. O(n log n))" />
                        <Input value={data.complexitySpace || ''} onChange={e => setData({...data, complexitySpace: e.target.value})} placeholder="Space Complexity" />
                    </div>
                    <select value={data.status || 'To Learn'} onChange={e => setData({...data, status: e.target.value as any})} className="bg-[#0f172a] border border-white/10 rounded p-2 text-sm w-full text-white">
                        <option value="To Learn">To Learn</option>
                        <option value="Learning">Learning</option>
                        <option value="Mastered">Mastered</option>
                    </select>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Description</label>
                        <textarea value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} rows={4} className="w-full bg-[#0f172a] p-2 rounded border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-[var(--accent-color)]" placeholder="How does it work?" />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 uppercase font-semibold block mb-1">Code Example</label>
                        <textarea value={data.codeExample || ''} onChange={e => setData({...data, codeExample: e.target.value})} rows={10} className="w-full bg-[#0f172a] font-mono p-2 rounded border border-white/10 text-sm text-green-300 focus:outline-none focus:border-[var(--accent-color)]" placeholder="Paste implementation here..." spellCheck={false} />
                    </div>
                </main>
                <footer className="p-3 border-t border-white/10 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Algorithm</Button>
                </footer>
            </div>
        </div>
    );
};

const AlgoTracker: React.FC<{ onPractice: (algoName: string) => void }> = ({ onPractice }) => {
    const { algorithms, setAlgorithms } = useAppContext();
    const [editing, setEditing] = useState<Algorithm | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleSave = (a: Algorithm) => {
        if (editing) setAlgorithms(prev => prev.map(item => item.id === a.id ? a : item));
        else setAlgorithms(prev => [...prev, a]);
        setEditing(null);
        setIsAdding(false);
    };

    const handleDelete = (id: number) => {
        if (confirm("Delete algorithm?")) setAlgorithms(prev => prev.filter(a => a.id !== id));
    };

    const handlePractice = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('bubble')) onPractice('bubble');
        else if (lowerName.includes('selection')) onPractice('selection');
        else if (lowerName.includes('insertion')) onPractice('insertion');
        else if (lowerName.includes('quick')) onPractice('quick');
        else alert("Visualizer not available for this specific algorithm yet. Try Bubble, Selection, Insertion or Quick Sort.");
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between mb-4">
                 <Input placeholder="Search algorithms..." className="max-w-xs" />
                 <Button onClick={() => setIsAdding(true)}>+ Add Algorithm</Button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-grow pr-2">
                {algorithms.map(algo => (
                    <div key={algo.id} className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                        <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setExpandedId(expandedId === algo.id ? null : algo.id)}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-300">{algo.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${algo.status === 'Mastered' ? 'border-green-500 text-green-400' : algo.status === 'Learning' ? 'border-yellow-500 text-yellow-400' : 'border-gray-500 text-gray-400'}`}>{algo.status}</span>
                                    <span className="text-xs text-gray-500 bg-black/30 px-1 rounded">{algo.type}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                    <span>Time: <span className="text-white">{algo.complexityTime}</span></span>
                                    <span>Space: <span className="text-white">{algo.complexitySpace}</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="text-xs !px-2 !py-1 bg-blue-500/10 text-blue-300 border-blue-500/30" onClick={(e) => { e.stopPropagation(); handlePractice(algo.name); }}>Practice</Button>
                                <Button variant="outline" className="text-xs !px-2 !py-1" onClick={(e) => { e.stopPropagation(); setEditing(algo); }}>Edit</Button>
                                <Button variant="outline" className="text-xs !px-2 !py-1 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(algo.id); }}>Del</Button>
                            </div>
                        </div>
                        {expandedId === algo.id && (
                            <div className="p-3 bg-black/20 border-t border-white/5 text-sm space-y-3 animate-in">
                                {algo.description && (
                                    <div>
                                        <strong className="text-xs text-gray-500 uppercase">Description</strong>
                                        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{algo.description}</p>
                                    </div>
                                )}
                                {algo.codeExample && (
                                    <div>
                                        <strong className="text-xs text-gray-500 uppercase">Code Example</strong>
                                        <pre className="mt-1 p-3 bg-black/40 rounded text-xs font-mono text-green-300 overflow-x-auto border border-white/5">{algo.codeExample}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {algorithms.length === 0 && <p className="text-center text-gray-500 mt-8">No algorithms tracked yet.</p>}
            </div>
            {(isAdding || editing) && <AlgorithmEditor algo={editing || undefined} onSave={handleSave} onClose={() => { setIsAdding(false); setEditing(null); }} />}
        </div>
    );
};

const SnippetLibrary: React.FC = () => {
    const { codeSnippets, setCodeSnippets } = useAppContext();
    const [filter, setFilter] = useState('');
    const [editing, setEditing] = useState<CodeSnippet | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const filtered = useMemo(() => codeSnippets.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || s.tags.some(t => t.includes(filter))), [codeSnippets, filter]);
    const handleDelete = (id: number) => { if (confirm("Delete snippet?")) setCodeSnippets(prev => prev.filter(s => s.id !== id)); };
    const handleSave = (s: CodeSnippet) => {
        if (editing) setCodeSnippets(prev => prev.map(item => item.id === s.id ? s : item));
        else setCodeSnippets(prev => [s, ...prev]);
        setEditing(null); setIsAdding(false);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4">
                <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search snippets..." className="flex-grow" />
                <Button onClick={() => setIsAdding(true)}>+ New Snippet</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4 flex-grow pr-2">
                {filtered.map(s => (
                    <div key={s.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors group cursor-pointer" onClick={() => setEditing(s)}>
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-blue-300 truncate">{s.title}</h5>
                            <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-400">{s.language}</span>
                        </div>
                        <pre className="text-[10px] bg-black/20 p-2 rounded font-mono text-gray-400 overflow-hidden h-16 mb-2 opacity-70">{s.code}</pre>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-1">{s.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] bg-blue-500/10 text-blue-400 px-1 rounded">{t}</span>)}</div>
                            <span className="text-[10px] text-gray-600">{s.versions?.length || 0} ver</span>
                        </div>
                        <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="outline" className="text-xs !py-1 !px-2 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {(isAdding || editing) && <SnippetEditor snippet={editing || undefined} onSave={handleSave} onClose={() => { setIsAdding(false); setEditing(null); }} />}
        </div>
    );
};

const BugTracker: React.FC = () => {
    const { bugLogs, setBugLogs } = useAppContext();
    const [newIssue, setNewIssue] = useState('');
    
    const addBug = () => {
        if (!newIssue.trim()) return;
        setBugLogs(prev => [{ id: Date.now(), issue: newIssue, severity: 'Medium', status: 'Open', ts: Date.now() }, ...prev]);
        setNewIssue('');
    };
    
    const updateBug = (id: number, updates: Partial<BugLog>) => {
        setBugLogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-2 mb-4">
                <Input value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="Log a new bug..." />
                <Button onClick={addBug}>Log Bug</Button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {bugLogs.map(bug => (
                    <div key={bug.id} className={`p-3 rounded-lg border border-white/5 ${bug.status === 'Resolved' ? 'bg-green-900/10 opacity-60' : 'bg-white/5'}`}>
                        <div className="flex justify-between items-start">
                            <p className={`font-medium ${bug.status === 'Resolved' ? 'line-through text-gray-500' : 'text-white'}`}>{bug.issue}</p>
                            <select 
                                value={bug.status} 
                                onChange={e => updateBug(bug.id, { status: e.target.value as any })} 
                                className={`text-xs bg-transparent border rounded p-1 ${bug.status === 'Resolved' ? 'text-green-400 border-green-500/30' : 'text-yellow-400 border-yellow-500/30'}`}
                            >
                                <option value="Open" className="bg-[#0b1626]">Open</option>
                                <option value="In Progress" className="bg-[#0b1626]">In Progress</option>
                                <option value="Resolved" className="bg-[#0b1626]">Resolved</option>
                            </select>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 items-center">
                            <span>{new Date(bug.ts).toLocaleDateString()}</span>
                            <select 
                                value={bug.severity} 
                                onChange={e => updateBug(bug.id, { severity: e.target.value as any })} 
                                className="bg-transparent outline-none cursor-pointer hover:text-white"
                            >
                                <option value="Low" className="bg-[#0b1626]">Low Priority</option>
                                <option value="Medium" className="bg-[#0b1626]">Medium Priority</option>
                                <option value="High" className="bg-[#0b1626]">High Priority</option>
                                <option value="Critical" className="bg-[#0b1626]">Critical</option>
                            </select>
                            <button onClick={() => { if(confirm('Delete?')) setBugLogs(p => p.filter(b => b.id !== bug.id)) }} className="ml-auto text-red-400 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const CodingManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'snippets' | 'algorithms' | 'visualizer' | 'bugs'>('algorithms');
    const [visualizerAlgo, setVisualizerAlgo] = useState<string>('bubble');

    const TABS = [
        { id: 'snippets', label: 'Snippet Library' },
        { id: 'algorithms', label: 'Algorithm Database' },
        { id: 'visualizer', label: 'Algo Visualizer' },
        { id: 'bugs', label: 'Bug Tracker' },
    ];

    const handleLaunchPractice = (algoName: string) => {
        setVisualizerAlgo(algoName);
        setActiveTab('visualizer');
    };

    return (
        <div className="h-full flex flex-col">
            <CardHeader title="Coding & Dev System" subtitle="Snippets, Algorithms & Debugging" />
            <div className="flex border-b border-white/10 mb-4 overflow-x-auto flex-shrink-0">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-grow min-h-0 overflow-hidden">
                {activeTab === 'snippets' && <SnippetLibrary />}
                {activeTab === 'algorithms' && <AlgoTracker onPractice={handleLaunchPractice} />}
                {activeTab === 'visualizer' && (
                    <AlgorithmVisualizer 
                        initialAlgo={visualizerAlgo} 
                        onBack={() => setActiveTab('algorithms')} 
                    />
                )}
                {activeTab === 'bugs' && <BugTracker />}
            </div>
        </div>
    );
};

export default CodingManager;
