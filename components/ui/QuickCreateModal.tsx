import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from './Button';
import Input from './Input';
import { Task, Note, Event } from '../../types';

const QuickCreateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { setTasks, setNotes, setEvents } = useAppContext();
    const [type, setType] = useState<'task' | 'note' | 'event'>('task');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;

        if (type === 'task') {
            const newTask: Task = {
                id: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), title,
                status: 'Backlog', priority: 'None', dueDate: date,
                attachments: [], subtasks: [], dependencies: [],
            };
            setTasks(prev => [newTask, ...prev]);
        } else if (type === 'note') {
            const newNote: Note = {
                id: Date.now(), ts: Date.now(), updatedAt: Date.now(), title, content: '', attachments: []
            };
            setNotes(prev => [newNote, ...prev]);
        } else if (type === 'event') {
            const newEvent: Event = {
                ts: Date.now(), date, time, title,
            };
            setEvents(prev => [newEvent, ...prev]);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Quick Create</h3>
                <div className="flex items-center gap-2 p-1 glass-panel rounded-full mb-4">
                    <button onClick={() => setType('task')} className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'task' ? 'bg-white text-black' : 'text-text-dim hover:text-text'}`}>Task</button>
                    <button onClick={() => setType('note')} className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'note' ? 'bg-white text-black' : 'text-text-dim hover:text-text'}`}>Note</button>
                    <button onClick={() => setType('event')} className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'event' ? 'bg-white text-black' : 'text-text-dim hover:text-text'}`}>Event</button>
                </div>
                <div className="space-y-4">
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
                    {(type === 'task' || type === 'event') && (
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    )}
                    {type === 'event' && (
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="glass" onClick={onClose}>Cancel</Button>
                    <Button variant="gradient" onClick={handleSave}>Create</Button>
                </div>
            </div>
        </div>
    );
};

export default QuickCreateModal;
