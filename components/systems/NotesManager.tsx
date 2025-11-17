import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Note, StoredFile } from '../../types';
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

  const loadFileMetadata = async () => {
      const files = await getFiles();
      setAllFiles(files);
  };

  useEffect(() => {
    loadFileMetadata();
  }, []);
  
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
      (note.content && note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(term)) // Search content as plain text
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
  
  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: 'New Note',
      content: 'Start writing...',
      attachments: [],
      ts: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      color: 'Default',
      tags: [],
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
        } catch (error) {
            console.error("Failed to attach file:", error);
            alert("Failed to attach file.");
        } finally {
            if (attachFileRef.current) attachFileRef.current.value = "";
        }
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
        if (fileData) {
            setViewingFile(fileData);
        }
    } catch (error) {
         console.error("Failed to view file:", error);
         alert("Could not open the file.");
    }
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
            if (file.type === 'application/json') {
                const data = JSON.parse(result);
                if (Array.isArray(data)) {
                    setNotes(prev => [...prev, ...data]);
                    alert(`${data.length} notes imported from JSON.`);
                }
            } else if (file.type.startsWith('text/')) {
                const newNote: Note = {
                    id: Date.now(),
                    ts: Date.now(),
                    updatedAt: Date.now(),
                    title: file.name,
                    content: result,
                    attachments: [],
                };
                setNotes(prev => [newNote, ...prev]);
                alert(`Note imported from ${file.name}`);
            } else {
                alert('Unsupported file type. Please select a JSON or TXT file.');
            }
        } catch (error) {
            alert('Error parsing file.');
        } finally {
            if (importFileRef.current) importFileRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };

  const renderInitialEmptyState = () => (
    <div className={`flex flex-col items-center justify-center text-center text-[var(--text-color-dim)] ${isFullScreen ? 'h-[calc(100vh-6rem)]' : 'h-[36rem]'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-xl font-semibold text-[var(--text-color)]">Your Knowledge Base Awaits</h3>
      <p className="max-w-xs mt-2 mb-6">Create your first note to capture ideas, lecture summaries, and everything in between.</p>
      <Button onClick={createNote}>Create Your First Note</Button>
    </div>
  );

  return (
    <div ref={containerRef} className={`bg-gradient-to-b from-[rgba(255,255,255,0.01)] to-[rgba(255,255,255,0.02)] p-4 rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <CardHeader title="Notes & Resource Library" subtitle="Your personal knowledge base" />
          <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
        </div>

        {notes.length === 0 ? renderInitialEmptyState() : (
          <div className={`flex flex-col md:flex-row gap-4 ${isFullScreen ? 'h-[calc(100vh-6rem)]' : 'h-[36rem]'}`}>
            <div className="w-full md:w-1/3 border-r border-[var(--card-border-color)] pr-4 flex flex-col">
              <div className="flex gap-2 mb-2">
                <Button onClick={createNote} className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    New Note
                  </span>
                </Button>
              </div>
              <div className="relative mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--text-color-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input type="search" placeholder="Search notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-9"/>
              </div>
              <div className="space-y-2 overflow-y-auto flex-grow">
                {filteredNotes.length === 0 ? (
                  <div className="text-center text-[var(--text-color-dim)] p-4 mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-semibold text-sm">No notes found</p>
                    <p className="text-xs">Try a different search term.</p>
                  </div>
                ) : filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-2.5 rounded-lg cursor-pointer border-l-4 transition-colors ${activeNoteId === note.id ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]' : 'hover:bg-white/5 border-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold truncate text-[var(--text-color-accent)]">{note.title}</h4>
                        {note.isPinned && <span className="text-xs">📌</span>}
                    </div>
                    <p className="text-xs text-[var(--text-color-dim)]">Updated: {new Date(note.updatedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col">
              {activeNote ? (
                <div className="flex-grow flex flex-col min-h-0">
                    <Input 
                        value={activeNote.title}
                        onChange={(e) => updateNote('title', e.target.value)}
                        className="mb-2 text-lg font-bold flex-shrink-0"
                    />

                    <div className="flex-grow min-h-0">
                        <RichTextEditor
                            value={activeNote.content}
                            onChange={(content) => updateNote('content', content)}
                        />
                    </div>
                    
                    <div className="mt-4 pt-2 border-t border-[var(--card-border-color)] flex-shrink-0 space-y-2">
                        <div>
                             <label className="text-sm font-semibold text-gray-400">Tags (comma-separated)</label>
                             <Input 
                                value={activeNote.tags?.join(', ') || ''}
                                onChange={(e) => updateNote('tags', e.target.value.split(',').map(t=>t.trim()).filter(Boolean))}
                                placeholder="e.g., project-x, ideas, research"
                            />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={activeNote.isPinned || false} onChange={(e) => updateNote('isPinned', e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0" />
                                Pin Note
                            </label>
                            <div className="flex gap-1.5 items-center">
                                {NOTE_COLORS.map(c => (
                                    <button key={c.name} onClick={() => updateNote('color', c.name)} title={c.name} className={`w-5 h-5 rounded-full bg-gradient-to-br ${c.bg} border-2 ${activeNote.color === c.name ? 'border-white' : 'border-transparent'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-[var(--card-border-color)] flex-shrink-0">
                        <h5 className="font-semibold text-[#cfe8ff] mb-2">Attachments</h5>
                         <Button variant="outline" className="text-sm mb-2" onClick={() => attachFileRef.current?.click()}>Attach File</Button>
                        <input type="file" ref={attachFileRef} onChange={handleAttachFile} className="hidden" />
                        <div className="space-y-2 max-h-24 overflow-y-auto pr-2">
                            {noteAttachments.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.02)]">
                                    <div>
                                        <p className="font-semibold truncate max-w-xs text-sm">{file.name}</p>
                                        <p className="text-xs text-[#9fb3cf]">{formatBytes(file.size)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="text-xs px-2 py-1" onClick={() => handleViewFile(file.id)}>View</Button>
                                        <Button variant="outline" className="text-xs px-2 py-1" onClick={() => handleRemoveAttachment(file.id)}>Remove</Button>
                                    </div>
                                </div>
                            ))}
                             {noteAttachments.length === 0 && (
                                <p className="text-sm text-[#9fb3cf]">No attachments for this note.</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--card-border-color)] flex items-center gap-2 flex-shrink-0">
                         <div className="ml-auto flex items-center gap-2">
                            <Button variant="outline" className="text-sm" onClick={() => downloadJSON(notes, 'notes.json')}>Export All</Button>
                            <Button variant="outline" className="text-sm" onClick={() => importFileRef.current?.click()}>Import</Button>
                            <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json,text/plain" />
                            <Button variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-400/10" onClick={() => deleteNote(activeNote.id)}>Delete Note</Button>
                        </div>
                    </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color-dim)]">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <h3 className="text-xl font-semibold text-[var(--text-color)]">Select a Note</h3>
                  <p className="max-w-xs mt-2">Choose a note from the list on the left to view or edit its content.</p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default NotesManager;