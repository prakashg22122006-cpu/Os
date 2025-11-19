
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { VisionCard, JournalEntry, Mood } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { addFile, getFile } from '../../utils/db';
import RichTextEditor from '../ui/RichTextEditor';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-text">
        {title} {subtitle && <small className="text-text-dim font-normal ml-1">{subtitle}</small>}
    </h3>
);

const downloadJSON = (obj: any, name = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

// --- VISION BOARD ---

const ImageCardContent: React.FC<{ fileId: number }> = ({ fileId }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    useEffect(() => {
        let objectUrl: string | null = null;
        getFile(fileId).then(fileData => {
            if (fileData) {
                objectUrl = URL.createObjectURL(fileData.data);
                setImageUrl(objectUrl);
            }
        });
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }
    }, [fileId]);

    return imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" alt="Vision board item" /> : <div className="p-2 text-xs">Loading...</div>;
};


const VisionBoard: React.FC = () => {
    const { visionBoardCards, setVisionBoardCards, setViewingFile } = useAppContext();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    const handleAddCard = async (type: 'goal' | 'image', file?: File) => {
        let content = '';
        if (type === 'goal') {
            content = prompt('Enter your goal or affirmation:') || 'New Goal';
        } else if (file) {
            try {
                const fileId = await addFile(file);
                content = String(fileId);
            } catch (error) {
                alert('Failed to save image.');
                return;
            }
        } else { return; }

        const newCard: VisionCard = {
            id: Date.now(),
            type,
            content,
            position: { x: 20, y: 20 },
        };
        setVisionBoardCards(prev => [...prev, newCard]);
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleAddCard('image', file);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const deleteCard = (id: number) => {
        if (window.confirm('Delete this card?')) {
            setVisionBoardCards(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleCardClick = async (card: VisionCard) => {
        if (card.type === 'image') {
            const fileData = await getFile(parseInt(card.content));
            if (fileData) setViewingFile(fileData);
        } else {
            const newContent = prompt('Edit goal:', card.content);
            if (newContent !== null) {
                setVisionBoardCards(prev => prev.map(c => c.id === card.id ? { ...c, content: newContent } : c));
            }
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
        e.dataTransfer.setData('cardId', String(id));
        e.dataTransfer.setData('offsetX', String(e.nativeEvent.offsetX));
        e.dataTransfer.setData('offsetY', String(e.nativeEvent.offsetY));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const id = Number(e.dataTransfer.getData('cardId'));
        const offsetX = Number(e.dataTransfer.getData('offsetX'));
        const offsetY = Number(e.dataTransfer.getData('offsetY'));
        const boardBounds = boardRef.current?.getBoundingClientRect();
        if (!boardBounds) return;

        const x = e.clientX - boardBounds.left - offsetX;
        const y = e.clientY - boardBounds.top - offsetY;

        setVisionBoardCards(prev => prev.map(c => c.id === id ? { ...c, position: { x, y } } : c));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex gap-2 mb-2">
                <Button onClick={() => handleAddCard('goal')}>+ Add Goal</Button>
                <Button variant="outline" onClick={() => imageInputRef.current?.click()}>+ Add Image</Button>
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            <div
                ref={boardRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative flex-grow bg-black/20 rounded-lg p-2 border border-dashed border-white/10 min-h-[300px] overflow-auto"
            >
                {visionBoardCards.map(card => (
                    <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        style={{ left: card.position.x, top: card.position.y }}
                        className="absolute w-48 h-32 bg-slate-700 rounded-lg shadow-lg cursor-grab active:cursor-grabbing group"
                    >
                        <div className="w-full h-full overflow-hidden rounded-lg" onClick={() => handleCardClick(card)}>
                           {card.type === 'image' ? <ImageCardContent fileId={parseInt(card.content)} /> : <p className="p-2 text-sm">{card.content}</p>}
                        </div>
                        <Button variant="outline" onClick={() => deleteCard(card.id)} className="absolute top-1 right-1 text-xs !p-1 opacity-0 group-hover:opacity-100 transition-opacity">X</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- JOURNAL ---

const MOODS: { mood: Mood; emoji: string }[] = [
    { mood: 'Happy', emoji: '😊' },
    { mood: 'Productive', emoji: '🚀' },
    { mood: 'Neutral', emoji: '😐' },
    { mood: 'Sad', emoji: '😢' },
    { mood: 'Stressed', emoji: '😩' },
];

const JournalEditorModal: React.FC<{ entry?: JournalEntry, onSave: (entryData: Omit<JournalEntry, 'id'|'ts'> & { id?: number }) => void, onClose: () => void }> = ({ entry, onSave, onClose }) => {
    const [data, setData] = useState<Omit<JournalEntry, 'id'|'ts'>>({
        date: entry?.date || new Date().toISOString().split('T')[0],
        mood: entry?.mood || 'Neutral',
        content: entry?.content || '',
        attachments: entry?.attachments || [],
    });
    
    const handleSubmit = () => { onSave({ ...data, id: entry?.id }); onClose(); };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-bg-offset to-bg border border-blue-500/20 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">{entry ? 'Edit Entry' : 'New Journal Entry'}</h4></header>
                <main className="p-4 space-y-3 flex-grow overflow-y-auto flex flex-col">
                    <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input type="date" value={data.date} onChange={e => setData(d => ({ ...d, date: e.target.value }))} />
                        <div className="p-2 bg-black/20 rounded-lg flex justify-around items-center">
                            {MOODS.map(({ mood, emoji }) => (
                                <button key={mood} title={mood} onClick={() => setData(d => ({ ...d, mood }))} className={`text-2xl rounded-full p-1 transition-transform ${data.mood === mood ? 'bg-blue-500/30 scale-125' : 'opacity-50 hover:opacity-100'}`}>{emoji}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <RichTextEditor value={data.content} onChange={content => setData(d => ({ ...d, content }))} />
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Entry</Button>
                </footer>
            </div>
        </div>
    );
};

const Journal: React.FC = () => {
    const { journalEntries, setJournalEntries } = useAppContext();
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    
    const sortedEntries = useMemo(() => [...journalEntries].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [journalEntries]);

    const handleSave = (entryData: Omit<JournalEntry, 'id' | 'ts'> & { id?: number }) => {
        if (entryData.id) {
            setJournalEntries(prev => prev.map(e => e.id === entryData.id ? { ...e, ...entryData } : e));
        } else {
            const newEntry: JournalEntry = { ...entryData, id: Date.now(), ts: Date.now() };
            setJournalEntries(prev => [newEntry, ...prev]);
        }
    };
    
    const handleDelete = (id: number) => {
        if (window.confirm('Delete this journal entry?')) {
            setJournalEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) { setJournalEntries(data); alert('Journal imported.'); }
            } catch (err) { alert('Invalid file.'); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex gap-2 mb-2">
                <Button onClick={() => setEditingEntry({} as JournalEntry)}>+ New Entry</Button>
                <Button variant="outline" onClick={() => downloadJSON(journalEntries, 'journal_export.json')}>Export</Button>
                <Button variant="outline" onClick={() => importFileRef.current?.click()}>Import</Button>
                <input type="file" ref={importFileRef} onChange={handleImport} accept="application/json" className="hidden" />
            </div>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                {sortedEntries.map(entry => (
                    <div key={entry.id} className="p-3 bg-black/20 rounded-lg">
                        <div className="flex justify-between items-start">
                           <div>
                                <span className="text-2xl mr-2">{MOODS.find(m => m.mood === entry.mood)?.emoji}</span>
                                <span className="font-bold">{entry.date}</span>
                           </div>
                           <div className="flex gap-2">
                                <Button variant="outline" className="text-xs !p-1.5" onClick={() => setEditingEntry(entry)}>Edit</Button>
                                <Button variant="outline" className="text-xs !p-1.5" onClick={() => handleDelete(entry.id)}>Del</Button>
                           </div>
                        </div>
                        <div className="prose prose-sm prose-invert mt-2 text-text-dim max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }}></div>
                    </div>
                ))}
            </div>
            {editingEntry && <JournalEditorModal entry={editingEntry.id ? editingEntry : undefined} onSave={handleSave} onClose={() => setEditingEntry(null)} />}
        </div>
    );
};


// --- MAIN COMPONENT ---

const VisionAndJournalManager: React.FC = () => {
    const { setBackgroundOverlay } = useAppContext();
    const [activeTab, setActiveTab] = useState<'vision' | 'journal'>('vision');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'journal') {
            setBackgroundOverlay('paper');
        } else {
            setBackgroundOverlay('none');
        }
        
        // Cleanup on unmount or tab change
        return () => {
            setBackgroundOverlay('none');
        };
    }, [activeTab, setBackgroundOverlay]);


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

    return (
        <div ref={containerRef} className={`p-4 rounded-xl ${isFullScreen ? 'h-screen w-screen overflow-y-auto bg-gradient-to-b from-bg to-bg-offset' : ''}`}>
            <div className="flex justify-between items-center mb-4">
                <CardHeader title="Inner World" subtitle="Vision Board & Journal" />
                <Button variant="outline" onClick={toggleFullScreen}>{isFullScreen ? 'Exit Full-Screen' : 'Full-Screen'}</Button>
            </div>
            <div className="flex border-b border-white/10 mb-4">
                <button onClick={() => setActiveTab('vision')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'vision' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Vision Board</button>
                <button onClick={() => setActiveTab('journal')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'journal' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Journal</button>
            </div>
            <div className={`${isFullScreen ? 'h-[calc(100vh-10rem)]' : 'h-[26rem]'}`}>
                {activeTab === 'vision' && <VisionBoard />}
                {activeTab === 'journal' && <Journal />}
            </div>
        </div>
    );
};

export default VisionAndJournalManager;
