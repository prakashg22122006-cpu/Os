
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Class, StoredFile } from '../../types';
import Button from './Button';
import Input from './Input';
import RichTextEditor from './RichTextEditor';
import { addFile, getFile } from '../../utils/db';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleEditorModal: React.FC = () => {
    const { viewingScheduleItem, setViewingScheduleItem, classes, setClasses, setViewingFile } = useAppContext();
    const [itemData, setItemData] = useState<Partial<Class>>({});
    const [attachedFiles, setAttachedFiles] = useState<StoredFile[]>([]);
    const attachFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewingScheduleItem) {
            setItemData({
                ...viewingScheduleItem,
                day: viewingScheduleItem.day || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                attachments: viewingScheduleItem.attachments || [],
                note_richtext: viewingScheduleItem.note_richtext || '',
            });
        }
    }, [viewingScheduleItem]);

    useEffect(() => {
        const loadAttachments = async () => {
            if (itemData.attachments && itemData.attachments.length > 0) {
                const files = await Promise.all(itemData.attachments.map(id => getFile(id)));
                setAttachedFiles(files.filter(Boolean) as StoredFile[]);
            } else {
                setAttachedFiles([]);
            }
        };
        loadAttachments();
    }, [itemData.attachments]);

    if (!viewingScheduleItem) return null;

    const handleClose = () => setViewingScheduleItem(null);

    const handleSave = () => {
        if (!itemData.name || !itemData.time) {
            alert("Event name and start time are required.");
            return;
        }

        if (itemData.ts) { // Existing item
            setClasses(prev => prev.map(c => c.ts === itemData.ts ? { ...c, ...itemData } as Class : c));
        } else { // New item
            const newItem: Class = {
                ts: Date.now(),
                name: 'New Event',
                time: '09:00',
                location: '',
                day: 'Monday',
                ...itemData
            };
            setClasses(prev => [newItem, ...prev]);
        }
        handleClose();
    };

    const handleDelete = () => {
        if (itemData.ts && window.confirm("Are you sure you want to delete this event?")) {
            setClasses(prev => prev.filter(c => c.ts !== itemData.ts));
            handleClose();
        }
    };

    const handleChange = (field: keyof Class, value: any) => {
        setItemData(prev => ({ ...prev, [field]: value }));
    };

    const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const fileId = await addFile(file);
                handleChange('attachments', [...(itemData.attachments || []), fileId]);
            } catch (error) {
                alert("Failed to attach file.");
            }
        }
    };

    const handleRemoveAttachment = (fileId: number) => {
        handleChange('attachments', (itemData.attachments || []).filter(id => id !== fileId));
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content glass-panel w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-border-color flex-shrink-0">
                    <Input value={itemData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Event Name" className="text-xl font-bold !p-1 !border-0 bg-transparent" />
                </header>
                <main className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Notes</label>
                            <div className="h-48 mt-1">
                                <RichTextEditor value={itemData.note_richtext || ''} onChange={(content) => handleChange('note_richtext', content)} />
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Attachments</label>
                            <Button variant="glass" className="text-xs" onClick={() => attachFileRef.current?.click()}>+ Attach File</Button>
                            <input type="file" ref={attachFileRef} onChange={handleAttachFile} className="hidden" />
                            <div className="space-y-1 mt-2 max-h-24 overflow-y-auto pr-2">
                                {attachedFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-black/30 rounded text-sm group">
                                        <span className="truncate pr-2 cursor-pointer" onClick={async () => setViewingFile(await getFile(file.id) as any)}>{file.name}</span>
                                        <button className="text-text-dim opacity-0 group-hover:opacity-100" onClick={() => handleRemoveAttachment(file.id)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                         <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Day of Week</label>
                             <select 
                                value={itemData.day || 'Monday'} 
                                onChange={e => handleChange('day', e.target.value)}
                                className="glass-select w-full"
                            >
                                {DAYS_OF_WEEK.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Start Time</label>
                            <Input type="time" value={itemData.time || ''} onChange={e => handleChange('time', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">End Time</label>
                            <Input type="time" value={itemData.endTime || ''} onChange={e => handleChange('endTime', e.target.value)} />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Location</label>
                            <Input value={itemData.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="e.g., Library" />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-text-dim mb-2">Color Tag</label>
                            <Input type="color" value={itemData.color || '#8E2DE2'} onChange={e => handleChange('color', e.target.value)} className="w-full h-10 p-1 bg-transparent border-0" />
                        </div>
                    </div>
                </main>
                <footer className="p-4 flex justify-between border-t border-border-color flex-shrink-0">
                    <div>
                        {itemData.ts && <Button variant="glass" className="text-red-400 border-red-500/30 hover:bg-red-500/20" onClick={handleDelete}>Delete</Button>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="glass" onClick={handleClose}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSave}>Save</Button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ScheduleEditorModal;
