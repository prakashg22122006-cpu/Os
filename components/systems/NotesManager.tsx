
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Note, StoredFile, NoteTemplate, MindMapNode } from '../../types';
import { addFile, getFiles, getFile } from '../../utils/db';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import RichTextEditor from '../ui/RichTextEditor';

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

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const NOTE_COLORS = [
    { name: 'Default', bg: 'from-slate-800/50 to-slate-900/50', border: 'border-slate-700' },
    { name: 'Blue', bg: 'from-blue-800/50 to-blue-900/50', border: 'border-blue-700' },
    { name: 'Green', bg: 'from-green-800/50 to-green-900/50', border: 'border-green-700' },
    { name: 'Yellow', bg: 'from-yellow-800/50 to-yellow-900/50', border: 'border-yellow-700' },
    { name: 'Red', bg: 'from-red-800/50 to-red-900/50', border: 'border-red-700' },
];

const MindMapEditor: React.FC<{ data: Note['mindMapData'], onChange: (data: Note['mindMapData']) => void }> = ({ data, onChange }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const safeData = data || { rootId: 'root', nodes: [{ id: 'root', text: 'Central Topic', x: 400, y: 300, children: [] }] };

    const handleMouseDown = (id: string) => {
        setDraggingId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId && svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const newNodes = safeData.nodes.map(n => n.id === draggingId ? { ...n, x, y } : n);
            onChange({ ...safeData, nodes: newNodes });
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };
    
    const addNode = (parentId: string) => {
        const parent = safeData.nodes.find(n => n.id === parentId);
        if (!parent) return;
        
        const newNodeId = Date.now().toString();
        const newNode: MindMapNode = {
            id: newNodeId,
            text: 'New Idea',
            x: parent.x + 100,
            y: parent.y + (Math.random() * 100 - 50),
            children: []
        };
        
        const newNodes = [...safeData.nodes, newNode].map(n => n.id === parentId ? { ...n, children: [...n.children, newNodeId] } : n);
        onChange({ ...safeData, nodes: newNodes });
    };
    
    const updateText = (id: string, text: string) => {
        const newNodes = safeData.nodes.map(n => n.id === id ? { ...n, text } : n);
        onChange({ ...safeData, nodes: newNodes });
    };

    return (
        <div className="w-full h-full bg-slate-900 relative overflow-hidden rounded-lg border border-slate-700">
            <svg 
                ref={svgRef} 
                width="100%" 
                height="100%" 
                onMouseMove={handleMouseMove} 
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Edges */}
                {safeData.nodes.map(node => (
                    node.children.map(childId => {
                        const child = safeData.nodes.find(n => n.id === childId);
                        if (!child) return null;
                        return (
                            <line 
                                key={`${node.id}-${child.id}`} 
                                x1={node.x} y1={node.y} 
                                x2={child.x} y2={child.y} 
                                stroke="#5aa1ff" 
                                strokeWidth="2" 
                                opacity="0.5"
                            />
                        );
                    })
                ))}
                
                {/* Nodes */}
                {safeData.nodes.map(node => (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle 
                            r="40" 
                            fill="#1e293b" 
                            stroke={node.id === safeData.rootId ? '#ef4444' : '#5aa1ff'} 
                            strokeWidth="2"
                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(node.id); }}
                            className="cursor-move"
                        />
                        <foreignObject x="-35" y="-15" width="70" height="30">
                            <input 
                                value={node.text} 
                                onChange={(e) => updateText(node.id, e.target.value)}
                                className="w-full h-full bg-transparent text-center text-xs text-white border-none outline-none"
                            />
                        </foreignObject>
                        <circle 
                            r="8" cx="35" cy="0" fill="#10b981" className="cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); addNode(node.id); }}
                        />
                        <text x="35" y="4" textAnchor="middle" fontSize="10" fill="white" pointerEvents="none">+</text>
                    </g>
                ))}
            </svg>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                Drag nodes to move. Click green + to add child.
            </div>
        </div>
    );
};

const NotesManager: React.FC = () => {
  const { notes, setNotes, setViewingFile } = useAppContext();
  const [activeNoteId, setActiveNoteId] = useLocalStorage<number | null>('activeNoteId', null);
  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);
  const [allFiles, setAllFiles] = useState<StoredFile[]>([]);
  const attachFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlurting, setShowBlurting] = useState(false);

  const loadFileMetadata = async () => {
      const files = await getFiles();
      setAllFiles(files);
  };

  useEffect(() => { loadFileMetadata(); }, []);
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch(err => alert(`Fullscreen error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);
    if (!searchTerm.trim()) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(note => 
      note.title.toLowerCase().includes(term) ||
      (note.tags && note.tags.join(' ').toLowerCase().includes(term)) ||
      (note.content && note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(term))
    );
  }, [notes, searchTerm]);
  
  useEffect(() => {
    if (activeNoteId === null && filteredNotes.length > 0) {
      setActiveNoteId(filteredNotes[0].id);
    }
    if (activeNoteId !== null && !notes.some(n => n.id === activeNoteId)) {
      setActiveNoteId(notes.length > 0 ? notes[0].id : null);
    }
  }, [notes, activeNoteId, setActiveNoteId, filteredNotes]);
  
  const createNote = (template: NoteTemplate = 'standard') => {
    const newNote: Note = {
      id: Date.now(),
      title: template === 'cornell' ? 'Cornell Note' : template === 'mindmap' ? 'Mind Map' : 'New Note',
      content: '',
      attachments: [],
      ts: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      color: 'Default',
      tags: [],
      template,
      cornellCues: '',
      cornellSummary: '',
      blurtingPrompt: '',
      blurtingAnswer: '',
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const updateNote = (field: keyof Note, value: any) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => 
        n.id === activeNoteId ? { ...n, [field]: value, updatedAt: Date.now() } : n
    ));
  };
  
  const handleAttachFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeNoteId) return;
    const file = event.target.files?.[0];
    if (file) {
        try {
            const newFileId = await addFile(file);
            setNotes(prev => prev.map(n => 
                n.id === activeNoteId ? { ...n, attachments: [...(n.attachments || []), newFileId] } : n
            ));
            loadFileMetadata();
        } catch (error) { alert("Failed to attach file."); }
        finally { if (attachFileRef.current) attachFileRef.current.value = ""; }
    }
  };

  const handleRemoveAttachment = (fileId: number) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
        if (n.id === activeNoteId) {
            const updatedAttachments = (n.attachments || []).filter(id => id !== fileId);
            return { ...n, attachments: updatedAttachments };
        }
        return n;
    }));
  };
  
  const handleViewFile = async (id: number) => {
    try {
        const fileData = await getFile(id);
        if (fileData) setViewingFile(fileData);
    } catch (error) { alert("Could not open the file."); }
  };
  
  const noteAttachments = useMemo(() => {
    if (!activeNote || !activeNote.attachments) return [];
    return allFiles.filter(file => activeNote.attachments.includes(file.id));
  }, [activeNote, allFiles]);
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        try {
            const data = JSON.parse(result);
            if (Array.isArray(data)) {
                setNotes(prev => [...prev, ...data]);
                alert(`${data.length} notes imported from JSON.`);
            }
        } catch (error) { alert('Error parsing file.'); }
        finally { if (importFileRef.current) importFileRef.current.value = ""; }
    };
    reader.readAsText(file);
  };

  const renderEditor = () => {
    if (!activeNote) return null;

    switch (activeNote.template) {
        case 'mindmap':
            return (
                <MindMapEditor 
                    data={activeNote.mindMapData} 
                    onChange={(data) => updateNote('mindMapData', data)} 
                />
            );
        case 'cornell':
            return (
                <div className="flex flex-col h-full gap-2">
                    <div className="flex flex-grow gap-2 h-2/3">
                        <div className="w-1/3 flex flex-col border border-white/10 rounded-lg p-2">
                            <label className="text-xs text-gray-400 uppercase mb-1">Cues / Questions</label>
                            <textarea 
                                className="flex-grow bg-transparent w-full resize-none outline-none text-sm"
                                value={activeNote.cornellCues} 
                                onChange={e => updateNote('cornellCues', e.target.value)} 
                                placeholder="Keywords, questions..." 
                            />
                        </div>
                        <div className="w-2/3 flex flex-col border border-white/10 rounded-lg p-2">
                            <label className="text-xs text-gray-400 uppercase mb-1">Notes</label>
                            <RichTextEditor value={activeNote.content} onChange={c => updateNote('content', c)} />
                        </div>
                    </div>
                    <div className="h-1/3 border border-white/10 rounded-lg p-2 flex flex-col">
                        <label className="text-xs text-gray-400 uppercase mb-1">Summary</label>
                        <textarea 
                            className="flex-grow bg-transparent w-full resize-none outline-none text-sm"
                            value={activeNote.cornellSummary} 
                            onChange={e => updateNote('cornellSummary', e.target.value)} 
                            placeholder="Summary of the lecture..." 
                        />
                    </div>
                </div>
            );
        case 'blurting':
            return (
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/30 text-xs">
                        <strong>Blurting Method:</strong> Read the content, hide it, then type everything you remember below.
                    </div>
                    <div className="flex-1 flex flex-col">
                         <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-400 uppercase">Original Content</label>
                            <Button variant="outline" className="text-xs !py-0.5" onClick={() => setShowBlurting(!showBlurting)}>
                                {showBlurting ? 'Hide Content' : 'Show Content'}
                            </Button>
                        </div>
                        {showBlurting ? (
                             <RichTextEditor value={activeNote.content} onChange={c => updateNote('content', c)} />
                        ) : (
                            <div className="flex-grow bg-black/20 rounded flex items-center justify-center text-gray-500 italic">
                                Content Hidden. Start blurting below.
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col">
                        <label className="text-xs text-gray-400 uppercase mb-1">Your Recall (Blurting Area)</label>
                        <textarea 
                            className="flex-grow bg-black/20 border border-white/10 rounded p-2 w-full resize-none outline-none"
                            value={activeNote.blurtingAnswer} 
                            onChange={e => updateNote('blurtingAnswer', e.target.value)} 
                            placeholder="Type everything you remember..." 
                        />
                    </div>
                </div>
            );
        case 'feynman':
            return (
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-blue-500/10 p-2 rounded border border-blue-500/30 text-xs">
                        <strong>Feynman Technique:</strong> Explain the concept simply, as if teaching a 5-year-old. Identify gaps.
                    </div>
                    <div className="flex-grow flex flex-col">
                        <RichTextEditor value={activeNote.content} onChange={c => updateNote('content', c)} />
                    </div>
                </div>
            );
        case 'zettel':
        case 'standard':
        default:
             return <RichTextEditor value={activeNote.content} onChange={c => updateNote('content', c)} />;
    }
  };

  return (
    <div ref={containerRef} className={`bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-4 rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <CardHeader title="Notes & Knowledge Base" subtitle="Cornell, Zettelkasten, Mind Maps" />
          <div className="flex gap-2">
               <select className="bg-black/30 border border-white/10 rounded text-xs p-1" onChange={e => createNote(e.target.value as any)} value="">
                   <option value="" disabled>+ New Note Type</option>
                   <option value="standard">Standard Note</option>
                   <option value="cornell">Cornell Note</option>
                   <option value="mindmap">Mind Map</option>
                   <option value="blurting">Blurting Session</option>
                   <option value="feynman">Feynman Technique</option>
               </select>
               <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full' : 'Full'}</Button>
          </div>
        </div>

        <div className={`flex flex-col md:flex-row gap-4 ${isFullScreen ? 'h-[calc(100vh-6rem)]' : 'h-[36rem]'}`}>
            <div className="w-full md:w-1/4 border-r border-[var(--card-border-color)] pr-4 flex flex-col">
              <div className="relative mb-2">
                <Input type="search" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!p-1 text-sm"/>
              </div>
              <div className="space-y-1 overflow-y-auto flex-grow pr-1">
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-2 rounded cursor-pointer border-l-2 transition-colors ${activeNoteId === note.id ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]' : 'hover:bg-white/5 border-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold truncate text-xs text-[var(--text-color-accent)]">{note.title}</h4>
                        <span className="text-[10px] opacity-50 uppercase">{note.template === 'standard' ? '' : note.template}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-3/4 flex flex-col">
              {activeNote ? (
                <>
                    <div className="flex gap-2 mb-2">
                         <Input 
                            value={activeNote.title}
                            onChange={(e) => updateNote('title', e.target.value)}
                            className="text-lg font-bold flex-grow"
                        />
                         <Button variant="outline" className="text-xs text-red-400" onClick={() => deleteNote(activeNote.id)}>Del</Button>
                    </div>
                    <div className="flex-grow min-h-0 border border-white/5 rounded-lg p-2 bg-black/10">
                        {renderEditor()}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-[var(--card-border-color)] flex flex-wrap gap-2 items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400">Tags:</span>
                             <Input 
                                value={activeNote.tags?.join(', ') || ''}
                                onChange={(e) => updateNote('tags', e.target.value.split(',').map(t=>t.trim()).filter(Boolean))}
                                placeholder="tag1, tag2"
                                className="!p-1 text-xs w-40"
                            />
                            <Button variant="outline" className="text-xs !p-1" onClick={() => attachFileRef.current?.click()}>📎 Attach</Button>
                            <input type="file" ref={attachFileRef} onChange={handleAttachFile} className="hidden" />
                         </div>
                         <div className="flex gap-1 text-xs">
                             {noteAttachments.map(f => (
                                 <span key={f.id} className="bg-white/10 px-2 py-1 rounded flex items-center gap-1">
                                     {f.name} 
                                     <button onClick={() => handleViewFile(f.id)}>👁️</button>
                                     <button onClick={() => handleRemoveAttachment(f.id)}>×</button>
                                 </span>
                             ))}
                         </div>
                    </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color-dim)]">
                  <p>Select or create a note to begin.</p>
                </div>
              )}
            </div>
          </div>
    </div>
  );
};

export default NotesManager;
