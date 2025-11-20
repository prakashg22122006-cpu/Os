
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { addFile, getFiles, getFile, deleteFile, updateFileMetadata } from '../../utils/db';
import { StoredFile, LinkResource } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useMobile } from '../../hooks/useMobile';

// --- ICONS ---
const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);
const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 8v-5z" />
    </svg>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);
const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);
const FilePlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);


const formatBytes = (bytes: number | undefined) => {
  if (bytes === undefined) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2 < 0 ? 0 : 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getResourceIcon = (type: string, mimeType?: string) => {
    if (type === 'link') return '🔗';
    if (type === 'tool') return '🛠️';
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.startsWith('video/')) return '🎬';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType?.startsWith('text/')) return '📝';
    return '📁';
};

interface UnifiedResource {
    id: number;
    ts: number;
    title: string;
    type: 'file' | 'link' | 'tool';
    size?: number;
    tags?: string[];
    folder?: string;
    mimeType?: string;
    url?: string;
    description?: string;
}

const ResourceThumbnail: React.FC<{ resource: UnifiedResource }> = ({ resource }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (resource.type === 'file' && resource.mimeType?.startsWith('image/')) {
            getFile(resource.id).then(fileData => {
                if (fileData) {
                    objectUrl = URL.createObjectURL(fileData.data);
                    setThumbUrl(objectUrl);
                }
            });
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
    }, [resource.id, resource.type, resource.mimeType]);

    if (thumbUrl) {
        return <img src={thumbUrl} alt={resource.title} className="w-full h-full object-cover" />;
    }
    return <div className="text-3xl flex items-center justify-center h-full text-gray-400">{getResourceIcon(resource.type, resource.mimeType)}</div>;
};

const DetailsPanel: React.FC<{
    resource: UnifiedResource;
    onUpdateFile: (id: number, updates: Partial<Pick<StoredFile, 'name' | 'tags' | 'folder'>>) => void;
    onUpdateLink: (updatedLink: LinkResource) => void;
    onDeleteFile: (id: number) => void;
    onDeleteLink: (id: number) => void;
    allFolders: string[];
    onClose?: () => void; // For mobile close
}> = ({ resource, onUpdateFile, onUpdateLink, onDeleteFile, onDeleteLink, allFolders, onClose }) => {
    const { setViewingFile } = useAppContext();
    const [title, setTitle] = useState(resource.title);
    const [tagInput, setTagInput] = useState('');
    
    useEffect(() => { setTitle(resource.title); }, [resource]);

    const handleTitleBlur = () => {
        if (title === resource.title) return;
        if (resource.type === 'file') {
            onUpdateFile(resource.id, { name: title });
        } else {
            onUpdateLink({ ...resource, title } as LinkResource);
        }
    };
    
    const handleUpdateLink = (field: keyof LinkResource, value: string) => {
        onUpdateLink({ ...resource, [field]: value } as LinkResource);
    }
    
    const handleAddTag = () => {
        if (tagInput && !(resource.tags || []).includes(tagInput)) {
            const newTags = [...(resource.tags || []), tagInput];
            if (resource.type === 'file') {
                onUpdateFile(resource.id, { tags: newTags });
            } else {
                onUpdateLink({ ...resource, tags: newTags } as LinkResource);
            }
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = (resource.tags || []).filter(t => t !== tagToRemove);
        if (resource.type === 'file') {
            onUpdateFile(resource.id, { tags: newTags });
        } else {
            onUpdateLink({ ...resource, tags: newTags } as LinkResource);
        }
    };

    const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newFolder = e.target.value;
        if (resource.type === 'file') {
            onUpdateFile(resource.id, { folder: newFolder });
        } else {
            onUpdateLink({ ...resource, folder: newFolder } as LinkResource);
        }
    };

    const handleView = async () => {
        if (resource.type === 'file') {
            const fileData = await getFile(resource.id);
            if (fileData) setViewingFile(fileData);
        } else if (resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        }
    };
    
    const handleDelete = () => {
        if (resource.type === 'file') {
            onDeleteFile(resource.id);
        } else {
            onDeleteLink(resource.id);
        }
        if(onClose) onClose();
    };

    return (
        <div className="w-full md:w-1/4 flex flex-col gap-4 p-2 md:p-0 bg-[#151515] md:bg-transparent h-full overflow-y-auto absolute md:static top-0 left-0 z-20 md:z-0">
            {onClose && <Button variant="glass" className="md:hidden" onClick={onClose}>← Back</Button>}
            <div className="h-48 bg-black/20 rounded-lg overflow-hidden border border-border-color flex-shrink-0"><ResourceThumbnail resource={resource} /></div>
            <Input value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleBlur} />
            <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-2 rounded-lg border border-border-color">
                <p><strong>Type:</strong> <span className="capitalize">{resource.type}</span> {resource.type === 'file' && `(${resource.mimeType})`}</p>
                {resource.size !== undefined && <p><strong>Size:</strong> {formatBytes(resource.size)}</p>}
                <p><strong>Added:</strong> {new Date(resource.ts).toLocaleString()}</p>
            </div>
            {resource.type !== 'file' && (
                <>
                    <Input value={resource.url || ''} onChange={e => handleUpdateLink('url', e.target.value)} placeholder="URL" />
                    <textarea value={resource.description || ''} onChange={e => handleUpdateLink('description', e.target.value)} placeholder="Description..." rows={3} className="glass-textarea w-full text-sm" />
                </>
            )}
            <div>
                <label className="text-sm font-semibold text-gray-400">Folder</label>
                <select value={resource.folder || '/'} onChange={handleFolderChange} className="glass-select w-full mt-1">
                    {allFolders.map(f => <option key={f} value={f}>{f === '/' ? 'All Resources' : f}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-400">Tags</label>
                <div className="flex gap-2 mt-1">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                    <Button variant="glass" onClick={handleAddTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {(resource.tags || []).map(tag => (
                        <div key={tag} className="bg-[var(--grad-1)]/20 text-[var(--grad-1)] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {tag} <button onClick={() => handleRemoveTag(tag)} className="font-bold">x</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-2 mt-auto pb-4">
                <Button variant="outline" className="flex-1" onClick={handleView}>View</Button>
                <Button variant="outline" className="flex-1 text-red-400 border-red-500/50 hover:bg-red-500/10" onClick={handleDelete}>Delete</Button>
            </div>
        </div>
    );
};

const LinkEditorModal: React.FC<{
    resource?: Partial<LinkResource>;
    onSave: (resourceData: Omit<LinkResource, 'id' | 'ts'> & { id?: number }) => void;
    onClose: () => void;
}> = ({ resource, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: resource?.title || '',
        url: resource?.url || '',
        description: resource?.description || '',
        type: resource?.type || 'link',
    });

    const handleSave = () => {
        if (!formData.title.trim() || !formData.url.trim()) return alert("Title and URL are required.");
        onSave({ ...formData, type: formData.type as 'link' | 'tool', id: resource?.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-bg to-bg-offset border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">{resource?.id ? 'Edit Resource' : 'Add New Resource'}</h4></header>
                <main className="p-4 space-y-3">
                    <Input value={formData.title} onChange={e => setFormData(f => ({...f, title: e.target.value}))} placeholder="Title" />
                    <Input value={formData.url} onChange={e => setFormData(f => ({...f, url: e.target.value}))} placeholder="URL" />
                    <textarea value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} placeholder="Description (optional)..." rows={3} className="glass-textarea w-full text-sm" />
                    <select value={formData.type} onChange={e => setFormData(f => ({...f, type: e.target.value as 'link' | 'tool'}))} className="glass-select w-full">
                        <option value="link">Study Material / Link</option>
                        <option value="tool">Tool</option>
                    </select>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save</Button>
                </footer>
            </div>
        </div>
    );
};


const EmptyState: React.FC<{ onUpload: () => void; onAddLink: () => void; }> = ({ onUpload, onAddLink }) => (
    <div className="h-[40rem] flex flex-col items-center justify-center text-center text-gray-400 p-4">
        <FilePlusIcon className="w-20 h-20 opacity-30 mb-4" />
        <h3 className="text-xl font-semibold text-gray-200">Your Digital Resource Cabinet</h3>
        <p className="max-w-md mt-2 mb-6">Upload lecture notes, save links to study materials, and keep track of useful tools—all in one place.</p>
        <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onUpload} className="flex items-center justify-center gap-2"><UploadIcon /> Upload File</Button>
            <Button onClick={onAddLink} className="flex items-center justify-center gap-2"><LinkIcon /> Add Link/Tool</Button>
        </div>
    </div>
);

const FileManager: React.FC = () => {
    const { linkResources, setLinkResources, ...appContext } = useAppContext();
    const [allDbFiles, setAllDbFiles] = useState<StoredFile[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
    const [selectedResourceType, setSelectedResourceType] = useState<'file' | 'link' | 'tool' | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('/');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingLink, setEditingLink] = useState<Partial<LinkResource> | null>(null);
    const isMobile = useMobile();
    const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

    const loadFiles = useCallback(async () => { setAllDbFiles(await getFiles()); }, []);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    
    const allResources: UnifiedResource[] = useMemo(() => {
        const unifiedFiles: UnifiedResource[] = allDbFiles.map(f => ({
            id: f.id, ts: f.ts, title: f.name, type: 'file', size: f.size, tags: f.tags, folder: f.folder, mimeType: f.type,
        }));
        const unifiedLinks: UnifiedResource[] = linkResources.map(l => ({
            id: l.id, ts: l.ts, title: l.title, type: l.type, url: l.url, description: l.description, tags: l.tags, folder: l.folder,
        }));
        return [...unifiedFiles, ...unifiedLinks].sort((a, b) => b.ts - a.ts);
    }, [allDbFiles, linkResources]);

    const { folders, allTags } = useMemo(() => {
        const folderSet = new Set<string>(['/']);
        const tagSet = new Set<string>();
        allResources.forEach(r => {
            folderSet.add(r.folder || '/');
            (r.tags || []).forEach(t => tagSet.add(t));
        });
        return { folders: Array.from(folderSet).sort(), allTags: Array.from(tagSet).sort() };
    }, [allResources]);

    const filteredResources = useMemo(() => {
        return allResources.filter(res => {
            const inFolder = (res.folder || '/') === selectedFolder;
            const hasTags = selectedTags.length === 0 || selectedTags.every(st => (res.tags || []).includes(st));
            const matchesSearch = !searchTerm || res.title.toLowerCase().includes(searchTerm.toLowerCase());
            return inFolder && hasTags && matchesSearch;
        });
    }, [allResources, selectedFolder, selectedTags, searchTerm]);
    
    const selectedResource = useMemo(() => allResources.find(f => f.id === selectedResourceId && f.type === selectedResourceType), [allResources, selectedResourceId, selectedResourceType]);

    const handleUpload = async (filesToUpload: FileList | null) => {
        if (!filesToUpload || filesToUpload.length === 0) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(filesToUpload)) { await addFile(file); }
        } catch (error) { alert("An error occurred during upload."); }
        finally { await loadFiles(); setIsUploading(false); }
    };
    
    const handleUpdateFile = async (id: number, updates: Partial<Pick<StoredFile, 'name' | 'tags' | 'folder'>>) => {
        await updateFileMetadata(id, updates);
        await loadFiles();
    };

    const handleUpdateLink = (updatedLink: LinkResource) => {
        setLinkResources(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
    };

    const handleDeleteFile = async (id: number) => {
        if (window.confirm('Delete this file permanently?')) {
            await deleteFile(id);
            if (selectedResourceId === id) setSelectedResourceId(null);
            await loadFiles();
        }
    };
    
    const handleDeleteLink = (id: number) => {
        if (window.confirm('Delete this resource permanently?')) {
            setLinkResources(prev => prev.filter(l => l.id !== id));
            if (selectedResourceId === id) setSelectedResourceId(null);
        }
    };
    
    const handleSaveLink = (resourceData: Omit<LinkResource, 'id' | 'ts'> & { id?: number }) => {
        if (resourceData.id) { // Update existing
            setLinkResources(prev => prev.map(l => l.id === resourceData.id ? {...l, ...resourceData} : l));
        } else { // Create new
            const newLink: LinkResource = { ...resourceData, id: Date.now(), ts: Date.now() };
            setLinkResources((prev: LinkResource[]) => [newLink, ...prev]);
        }
    };

    const handleNewFolder = () => {
        const name = prompt("New folder name:");
        if (name && !folders.includes(name)) {
            alert(`Folder "${name}" is now available. Move a resource into it to make it permanent.`);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        handleUpload(e.dataTransfer.files);
    };
    
    if (allResources.length === 0 && !isUploading) {
        return <EmptyState onUpload={() => fileInputRef.current?.click()} onAddLink={() => setEditingLink({})} />;
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[80vh] md:h-[40rem] relative">
            {editingLink && <LinkEditorModal resource={editingLink} onSave={handleSaveLink} onClose={() => setEditingLink(null)} />}
            
            {isMobile && (
                <div className="absolute top-0 right-0 z-20 p-2">
                    <Button variant="glass" className="text-xs" onClick={() => setMobileShowSidebar(!mobileShowSidebar)}>{mobileShowSidebar ? 'Hide Folders' : 'Show Folders'}</Button>
                </div>
            )}

            <div className={`${mobileShowSidebar ? 'flex' : 'hidden'} w-full md:w-1/4 md:border-r border-border-color pr-0 md:pr-4 flex-col order-2 md:order-1 md:flex flex-shrink-0`}>
                 <div className="flex gap-2 w-full mb-4">
                    <Button variant="glass" onClick={() => setEditingLink({})} className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm"><LinkIcon className="h-4 w-4"/> Add Link</Button>
                    <Button variant="outline" onClick={handleNewFolder} className="flex-1 flex items-center justify-center gap-2 text-xs md:text-sm"><FolderIcon /> New Folder</Button>
                </div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-gray-400"><FolderIcon /> Folders</h4>
                <div className="flex flex-wrap md:block gap-2 space-y-0 md:space-y-1 mb-4 max-h-40 md:max-h-[50%] overflow-y-auto">
                    {folders.map(f => (
                        <button key={f} onClick={() => { setSelectedFolder(f); if(isMobile) setMobileShowSidebar(false); }} className={`px-3 py-1.5 md:w-full text-left md:p-1.5 rounded text-sm flex items-center gap-2 ${selectedFolder === f ? 'bg-[var(--grad-1)]/20 text-[var(--grad-1)] font-semibold' : 'hover:bg-white/5 text-gray-400 bg-white/5 md:bg-transparent'}`}>
                            {f === '/' ? '🗂️' : <FolderIcon className="h-4 w-4"/>} {f === '/' ? 'All' : f}
                        </button>
                    ))}
                </div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-gray-400"><TagIcon /> Tags</h4>
                <div className="flex flex-wrap gap-1 overflow-y-auto flex-grow">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => { setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]); if(isMobile) setMobileShowSidebar(false); }} 
                        className={`text-xs px-2 py-1 rounded-full border ${selectedTags.includes(tag) ? 'bg-[var(--grad-1)]/30 text-[var(--grad-1)] border-[var(--grad-1)]/50' : 'bg-white/5 border-transparent'}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-2/4 flex flex-col order-1 md:order-2 h-full min-w-0">
                <div className="flex gap-2 mb-2 flex-shrink-0 flex-wrap">
                    <div className="relative flex-grow min-w-[150px]">
                        <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 text-sm" />
                    </div>
                    <div className="flex bg-bg-offset border border-border-color rounded-lg p-0.5">
                        <Button variant={viewMode === 'list' ? 'primary' : 'outline'} onClick={() => setViewMode('list')} className="!p-1.5 !border-0"><ListIcon /></Button>
                        <Button variant={viewMode === 'grid' ? 'primary' : 'outline'} onClick={() => setViewMode('grid')} className="!p-1.5 !border-0"><GridIcon /></Button>
                    </div>
                    <Button variant="glass" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs md:text-sm"><UploadIcon /> Upload</Button>
                    <input type="file" multiple ref={fileInputRef} onChange={e => handleUpload(e.target.files)} className="hidden" />
                </div>
                <div onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }} onDragLeave={() => setIsDraggingOver(false)} onDrop={handleDrop} className="relative flex-grow border border-dashed border-border-color rounded-lg p-2 overflow-y-auto">
                    {isDraggingOver && <div className="absolute inset-0 bg-[var(--grad-1)]/20 backdrop-blur-sm z-10 flex items-center justify-center text-lg font-semibold border-2 border-dashed border-[var(--grad-1)] rounded-lg pointer-events-none"><UploadIcon className="mr-2"/> Drop files to upload</div>}
                    {isUploading ? <p className="text-center p-8">Uploading...</p> : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {filteredResources.map(res => (
                                    <div key={`${res.type}-${res.id}`} onClick={() => { setSelectedResourceId(res.id); setSelectedResourceType(res.type); }} className={`aspect-square bg-black/20 rounded-lg overflow-hidden cursor-pointer border-2 ${selectedResourceId === res.id && selectedResourceType === res.type ? 'border-[var(--grad-1)]' : 'border-transparent'}`}>
                                        <div className="w-full h-full relative group">
                                            <ResourceThumbnail resource={res} />
                                            <p className="absolute bottom-0 left-0 right-0 text-xs truncate p-1 bg-black/50 text-white">{res.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredResources.map(res => (
                                    <div key={`${res.type}-${res.id}`} onClick={() => { setSelectedResourceId(res.id); setSelectedResourceType(res.type); }} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedResourceId === res.id && selectedResourceType === res.type ? 'bg-[var(--grad-1)]/20' : 'hover:bg-white/5'}`}>
                                        <div className="text-2xl">{getResourceIcon(res.type, res.mimeType)}</div>
                                        <div className="flex-grow min-w-0"><p className="text-sm font-semibold truncate">{res.title}</p><p className="text-xs text-gray-400">{formatBytes(res.size)}</p></div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                                            {(res.tags || []).map(t => <span key={t} className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{t}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedResource ? (
                <DetailsPanel 
                    resource={selectedResource} 
                    onUpdateFile={handleUpdateFile} 
                    onUpdateLink={handleUpdateLink} 
                    onDeleteFile={handleDeleteFile} 
                    onDeleteLink={handleDeleteLink} 
                    allFolders={folders} 
                    onClose={() => setSelectedResourceId(null)}
                />
            ) : (
                <div className="hidden md:flex w-full md:w-1/4 items-center justify-center bg-black/20 rounded-lg text-gray-400 text-center p-4 border border-border-color order-3">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                        Select a resource to see details
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileManager;
