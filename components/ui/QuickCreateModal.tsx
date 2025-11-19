
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
                id: Date.now(), ts: Date.now(), updatedAt: Date.now(), title, content: '', attachments: [], template: 'standard'
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
        <div className="quick-create-overlay" onClick={onClose}>
            <div className="quick-create-modal" onClick={e => e.stopPropagation()}>
                <h3 className="quick-create-title">Quick Create</h3>
                <div className="quick-create-tabs">
                    <button onClick={() => setType('task')} className={type === 'task' ? 'active' : ''}>Task</button>
                    <button onClick={() => setType('note')} className={type === 'note' ? 'active' : ''}>Note</button>
                    <button onClick={() => setType('event')} className={type === 'event' ? 'active' : ''}>Event</button>
                </div>
                <div className="quick-create-form">
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
                    {(type === 'task' || type === 'event') && (
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    )}
                    {type === 'event' && (
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                    )}
                </div>
                <div className="quick-create-actions">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Create</Button>
                </div>
            </div>
        </div>
    );
};

export default QuickCreateModal;
