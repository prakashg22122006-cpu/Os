
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Note } from '../../types';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const NOTE_COLORS = [
    { name: 'Default', bg: 'from-slate-800/50 to-slate-900/50', border: 'border-slate-700' },
    { name: 'Blue', bg: 'from-blue-800/50 to-blue-900/50', border: 'border-blue-700' },
    { name: 'Green', bg: 'from-green-800/50 to-green-900/50', border: 'border-green-700' },
    { name: 'Yellow', bg: 'from-yellow-800/50 to-yellow-900/50', border: 'border-yellow-700' },
    { name: 'Red', bg: 'from-red-800/50 to-red-900/50', border: 'border-red-700' },
];

const NoteEditorModal: React.FC<{ note: Partial<Note> | null; onSave: (note: Omit<Note, 'id' | 'ts' | 'updatedAt' | 'attachments'>) => void; onClose: () => void }> = ({ note, onSave, onClose }) => {
    const [title, setTitle] = useState(note?.title || 'New Note');
    const [content, setContent] = useState(note?.content || '');
    const [category, setCategory] = useState(note?.category || '');
    const [color, setColor] = useState(note?.color || NOTE_COLORS[0].name);

    const handleSave = () => {
        if (!title.trim()) return alert('Title is required.');
        onSave({ title, content, category, color, isPinned: note?.isPinned || false });
        onClose();
    };
    
    const selectedColorStyle = NOTE_COLORS.find(c => c.name === color) || NOTE_COLORS[0];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-gradient-to-b ${selectedColorStyle.bg} border ${selectedColorStyle.border} rounded-xl shadow-2xl w-full max-w-lg flex flex-col`} onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10">
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note Title" className="text-lg font-semibold !p-1" />
                </header>
                <main className="p-4 space-y-3">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        placeholder="Start typing..."
                        className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full box-border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5aa1ff]"
                    />
                    <div className="flex items-center gap-4">
                        <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (optional)" className="flex-grow"/>
                        <div className="flex gap-2 items-center">
                            <span className="text-sm text-gray-400">Color:</span>
                            {NOTE_COLORS.map(c => (
                                <button key={c.name} onClick={() => setColor(c.name)} title={c.name} className={`w-6 h-6 rounded-full bg-gradient-to-br ${c.bg} border-2 ${color === c.name ? 'border-white' : 'border-transparent'}`} />
                            ))}
                        </div>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Note</Button>
                </footer>
            </div>
        </div>
    );
};


const QuickNote: React.FC = () => {
  const { notes, setNotes, appSettings } = useAppContext();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  }, [notes]);
  
  const handleSaveNote = (noteData: Omit<Note, 'id' | 'ts' | 'updatedAt' | 'attachments'>) => {
    if (editingNote) {
        // Update existing note
        setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...editingNote, ...noteData, updatedAt: Date.now() } : n));
    } else {
        // Create new note
        const newNote: Note = {
            id: Date.now(),
            ts: Date.now(),
            updatedAt: Date.now(),
            attachments: [],
            ...noteData
        };
        setNotes(prev => [newNote, ...prev]);
    }
  };

  const openEditor = (note: Note | null = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };
  
  const deleteNote = (id: number) => {
      if (window.confirm('Delete this note?')) {
          setNotes(prev => prev.filter(n => n.id !== id));
      }
  };

  const togglePin = (id: number) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n));
  };
  
  if (appSettings.uiStyle === 'modern') {
    return (
        <div>
            <h3 className="text-xl font-bold mb-2">Announcements</h3>
            <div className="space-y-2">
                {sortedNotes.map(note => (
                    <div key={note.id} className="modern-announcement-item">
                        <p className="font-bold cursor-pointer" onClick={() => openEditor(note)}>{note.title}</p>
                        <p className="text-xs">{new Date(note.updatedAt).toLocaleDateString()}</p>
                    </div>
                ))}
                {sortedNotes.length === 0 && <p>No announcements yet.</p>}
            </div>
            {isModalOpen && <NoteEditorModal note={editingNote} onSave={handleSaveNote} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <CardHeader title="Quick Notes" />
       <div className="flex-grow min-h-0 overflow-y-auto pr-2">
        {sortedNotes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#9fb3cf] text-center">No notes yet. Add one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedNotes.map(note => {
              const colorStyle = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
              return (
                <div key={note.id} className={`bg-gradient-to-br ${colorStyle.bg} p-3 rounded-lg border ${colorStyle.border} flex flex-col justify-between`}>
                  <div>
                      <h5 className="font-bold truncate">{note.title}</h5>
                      <p className="text-xs text-gray-300 mb-2">{note.category}</p>
                      <p className="text-sm text-gray-200 line-clamp-3">{note.content}</p>
                  </div>
                  <div className="flex gap-1 items-center mt-3 pt-2 border-t border-white/10">
                      <Button variant="outline" className="text-xs !p-1.5" onClick={() => togglePin(note.id)} title={note.isPinned ? 'Unpin' : 'Pin'}>
                          {note.isPinned ? '📌' : '📍'}
                      </Button>
                      <Button variant="outline" className="text-xs !p-1.5" onClick={() => openEditor(note)}>Edit</Button>
                      <Button variant="outline" className="text-xs !p-1.5 ml-auto" onClick={() => deleteNote(note.id)}>Del</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Button onClick={() => openEditor(null)} className="absolute -top-1 right-0 text-lg !px-3">+</Button>

      {isModalOpen && <NoteEditorModal note={editingNote} onSave={handleSaveNote} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default QuickNote;