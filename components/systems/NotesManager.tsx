import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Note, StoredFile, LinkResource } from '../../types';
import { addFile, getFiles, getFile, updateFileMetadata, deleteFile } from '../../utils/db';
import RichTextEditor from '../ui/RichTextEditor';
import DropZone from '../ui/DropZone';

// --- ICONS ---
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5.293a1 1 0 01.707.293L12 6H8a2 2 0 00-2 2v1H4a2 2 0 01-2-2V6z" /><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A1 1 0 012 9V4a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;

const getResourceIcon = (type: string, mimeType?: string) => {
    if (type === 'note') return <NoteIcon />;
    if (type === 'link' || type === 'tool') return <LinkIcon />;
    return <FileIcon />;
};

interface UnifiedResource {
    id: number;
    ts: number;
    title: string;
    type: 'note' | 'file' | 'link' | 'tool';
    tags?: string[];
    folder?: string;
    // Note specific
    content?: string;
    attachments?: number[];
    isPinned?: boolean;
    // File specific
    size?: number;
    mimeType?: string;
    // Link specific
    url?: string;
    description?: string;
}

const EmptyState: React.FC<{ onAction: () => void }> = ({ onAction }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-dim)] p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-[var(--text)]">Your Knowledge Base Awaits</h3>
        <p className="max-w-xs mt-2 mb-6">Create your first note, save a link, or upload a file to begin building your digital brain.</p>
        <Button onClick={onAction}>Create Your First Note</Button>
    </div>
);


const NotesManager: React.FC = () => {
    const { notes, setNotes, linkResources, setLinkResources, setViewingFile } = useAppContext();
    const [dbFiles, setDbFiles] = useState<StoredFile[]>([]);
    
    type FilterType = 'all' | 'notes' | 'files' | 'links';
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResourceId, setSelectedResourceId] = useState<{ id: number, type: UnifiedResource['type'] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = useCallback(async () => { setDbFiles(await getFiles()); }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);

    const unifiedResources = useMemo<UnifiedResource[]>(() => {
        const unifiedNotes: UnifiedResource[] = notes.map(n => ({ ...n, type: 'note', title: n.title || 'Untitled Note' }));
        const unifiedFiles: UnifiedResource[] = dbFiles.map(f => ({ ...f, type: 'file', title: f.name }));
        const unifiedLinks: UnifiedResource[] = linkResources.map(l => ({ ...l, title: l.title || l.url }));
        return [...unifiedNotes, ...unifiedFiles, ...unifiedLinks].sort((a, b) => b.ts - a.ts);
    }, [notes, dbFiles, linkResources]);

    const { folders, tags } = useMemo(() => {
        const folderSet = new Set<string>();
        const tagSet = new Set<string>();
        unifiedResources.forEach(r => {
            if(r.folder && r.folder.trim() !== '') folderSet.add(r.folder.trim());
            r.tags?.forEach(t => {
                if(t.trim() !== '') tagSet.add(t.trim())
            });
        });
        return { folders: Array.from(folderSet).sort(), tags: Array.from(tagSet).sort() };
    }, [unifiedResources]);
    
    const filteredResources = useMemo(() => {
        return unifiedResources.filter(res => {
            const lowerSearch = searchTerm.toLowerCase();
            if(searchTerm && !res.title.toLowerCase().includes(lowerSearch) && !(res.tags?.join(' ').toLowerCase().includes(lowerSearch))) return false;
            if(selectedFolder && res.folder !== selectedFolder) return false;
            if(selectedTag && !(res.tags || []).includes(selectedTag)) return false;
            if(activeFilter !== 'all') {
                if (activeFilter === 'notes' && res.type !== 'note') return false;
                if (activeFilter === 'files' && res.type !== 'file') return false;
                if (activeFilter === 'links' && res.type !== 'link' && res.type !== 'tool') return false;
            }
            return true;
        });
    }, [unifiedResources, searchTerm, selectedFolder, selectedTag, activeFilter]);

    const activeResource = useMemo(() => {
        if (!selectedResourceId) return null;
        return unifiedResources.find(r => r.id === selectedResourceId.id && r.type === selectedResourceId.type);
    }, [selectedResourceId, unifiedResources]);
    
    const createNote = () => {
        const newNote: Note = {
            id: Date.now(), title: 'New Note', content: '', attachments: [], ts: Date.now(), updatedAt: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedResourceId({ id: newNote.id, type: 'note' });
    };

    const addLink = () => {
        const url = prompt("Enter URL:");
        if (url) {
            const newLink: LinkResource = { id: Date.now(), ts: Date.now(), title: url, url, type: 'link' };
            setLinkResources(prev => [newLink, ...prev]);
            setSelectedResourceId({ id: newLink.id, type: 'link' });
        }
    };
    
    const handleFilesUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        try {
            let lastNewId: number | null = null;
            for (const file of Array.from(files)) {
                lastNewId = await addFile(file);
            }
            await loadFiles();
            if (lastNewId) {
                setSelectedResourceId({ id: lastNewId, type: 'file' });
            }
        } catch (error) {
            console.error('File upload failed', error);
            alert('File upload failed.');
        }
    };

    const updateResource = (id: number, type: UnifiedResource['type'], updates: Partial<UnifiedResource>) => {
        if (type === 'note') {
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } as Note : n));
        } else if (type === 'file') {
            updateFileMetadata(id, updates).then(loadFiles);
        } else if (type === 'link' || type === 'tool') {
            setLinkResources(prev => prev.map(l => l.id === id ? { ...l, ...updates } as LinkResource : l));
        }
    };
    
    const deleteResource = (id: number, type: UnifiedResource['type']) => {
        if (!window.confirm("Are you sure?")) return;
        if (type === 'note') setNotes(prev => prev.filter(n => n.id !== id));
        if (type === 'file') deleteFile(id).then(loadFiles);
        if (type === 'link' || type === 'tool') setLinkResources(prev => prev.filter(l => l.id !== id));
        setSelectedResourceId(null);
    }
    
    if (unifiedResources.length === 0) {
        return <EmptyState onAction={createNote} />;
    }

    return (
        <div className="flex h-[80vh]">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-[var(--border-color)] p-2 flex flex-col">
                <div className="flex gap-2 mb-2">
                    <Button onClick={createNote} className="flex-1">New Note</Button>
                    <Button onClick={addLink} className="flex-1">Add Link</Button>
                </div>
                 <Button variant="glass" onClick={() => fileInputRef.current?.click()} className="w-full mb-4">Upload File</Button>
                 <input type="file" ref={fileInputRef} onChange={(e) => handleFilesUpload(e.target.files)} className="hidden" multiple />

                <nav className="space-y-1 text-sm">
                    {(['all', 'notes', 'files', 'links'] as FilterType[]).map(f => (
                        <button key={f} onClick={() => { setActiveFilter(f); setSelectedFolder(null); setSelectedTag(null); }} className={`w-full text-left p-2 rounded flex items-center gap-2 ${activeFilter === f && !selectedFolder && !selectedTag ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-semibold' : 'hover:bg-white/5'}`}>
                           {f === 'all' ? '🗂️' : f === 'notes' ? <NoteIcon/> : f === 'files' ? <FileIcon/> : <LinkIcon/>} <span className="capitalize">{f}</span>
                        </button>
                    ))}
                </nav>
                 <div className="mt-4 pt-4 border-t border-[var(--border-color)] overflow-y-auto">
                    <h4 className="px-2 mb-1 text-xs font-semibold uppercase text-gray-500 flex items-center gap-2"><FolderIcon /> Folders</h4>
                     {folders.map(f => (
                        <button key={f} onClick={() => { setSelectedFolder(f); setSelectedTag(null); }} className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 truncate ${selectedFolder === f ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-semibold' : 'hover:bg-white/5'}`}>
                            {f}
                        </button>
                     ))}
                     <h4 className="px-2 mt-4 mb-1 text-xs font-semibold uppercase text-gray-500 flex items-center gap-2"><TagIcon /> Tags</h4>
                      {tags.map(t => (
                        <button key={t} onClick={() => { setSelectedTag(t); setSelectedFolder(null); }} className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 truncate ${selectedTag === t ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-semibold' : 'hover:bg-white/5'}`}>
                           #{t}
                        </button>
                     ))}
                 </div>
            </div>
            
            <DropZone onDrop={handleFilesUpload} className="flex-grow flex min-w-0">
                {/* Item List */}
                <div className="w-80 flex-shrink-0 border-r border-[var(--border-color)] p-2 flex flex-col">
                    <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mb-2"/>
                    <div className="overflow-y-auto space-y-1">
                        {filteredResources.map(res => (
                            <div key={`${res.type}-${res.id}`} onClick={() => setSelectedResourceId({id: res.id, type: res.type})} className={`p-2 rounded-lg cursor-pointer ${selectedResourceId?.id === res.id && selectedResourceId?.type === res.type ? 'bg-[var(--grad-1)]/20' : 'hover:bg-white/5'}`}>
                                <div className="flex items-start gap-2">
                                    <span className="mt-1 text-gray-500">{getResourceIcon(res.type, res.mimeType)}</span>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold truncate">{res.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(res.ts).toLocaleDateString()}
                                            {res.folder && ` • ${res.folder}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor/Viewer */}
                <div className="flex-grow p-4 flex flex-col">
                    {activeResource ? (
                        <>
                            <div className="flex justify-between items-start mb-2">
                                <Input value={activeResource.title} onChange={e => updateResource(activeResource.id, activeResource.type, { title: e.target.value })} className="text-xl font-bold !p-1 !border-0"/>
                                <Button variant="glass" className="text-red-400 border-red-500/50 hover:bg-red-500/10 text-xs" onClick={() => deleteResource(activeResource.id, activeResource.type)}>Delete</Button>
                            </div>
                            {activeResource.type === 'note' && (
                                <div className="flex-grow min-h-0">
                                    <RichTextEditor value={activeResource.content || ''} onChange={content => updateResource(activeResource.id, 'note', { content })} />
                                </div>
                            )}
                            {(activeResource.type === 'link' || activeResource.type === 'tool') && (
                                <div className="space-y-2">
                                    <Input value={activeResource.url || ''} onChange={e => updateResource(activeResource.id, activeResource.type, { url: e.target.value })} />
                                    <textarea value={activeResource.description || ''} onChange={e => updateResource(activeResource.id, activeResource.type, { description: e.target.value })} placeholder="Description..." rows={4} className="glass-textarea w-full text-sm" />
                                </div>
                            )}
                            {activeResource.type === 'file' && (
                                 <div className="space-y-2 text-sm text-gray-300">
                                    <p><strong>Type:</strong> {activeResource.mimeType}</p>
                                    <p><strong>Size:</strong> {activeResource.size ? (activeResource.size / 1024).toFixed(2) : 0} KB</p>
                                    <Button onClick={async () => setViewingFile(await getFile(activeResource.id))}>View File</Button>
                                </div>
                            )}
                             <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                 <h5 className="text-sm font-semibold mb-2">Metadata</h5>
                                  <div className="flex gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400">Folder</label>
                                        <Input value={activeResource.folder || ''} onChange={e => updateResource(activeResource.id, activeResource.type, { folder: e.target.value })} placeholder="e.g., UNI" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Tags (comma-separated)</label>
                                        <Input value={(activeResource.tags || []).join(', ')} onChange={e => updateResource(activeResource.id, activeResource.type, { tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean) })} placeholder="e.g., important, to-read" />
                                    </div>
                                  </div>
                             </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Select an item to view</div>
                    )}
                </div>
            </DropZone>
        </div>
    );
};

export default NotesManager;