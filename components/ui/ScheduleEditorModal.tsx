import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Class, StoredFile } from '../../types';
import Button from './Button';
import Input from './Input';
import RichTextEditor from './RichTextEditor';
import { addFile, getFile } from '../../utils/db';

const ScheduleEditorModal: React.FC = () => {
    const { viewingScheduleItem, setViewingScheduleItem, classes, setClasses, setViewingFile } = useAppContext();
    const [itemData, setItemData] = useState<Partial<Class>>({});
    const [attachedFiles, setAttachedFiles] = useState<StoredFile[]>([]);
    const attachFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewingScheduleItem) {
            setItemData({
                ...viewingScheduleItem,
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[#5aa1ff]/20 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10 flex-shrink-0">
                    <Input value={itemData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Event Name" className="text-lg font-semibold !p-1" />
                </header>
                <main className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Notes</label>
                            <div className="h-48 mt-1">
                                <RichTextEditor value={itemData.note_richtext || ''} onChange={(content) => handleChange('note_richtext', content)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Attachments</label>
                            <Button variant="outline" className="text-xs mt-1" onClick={() => attachFileRef.current?.click()}>+ Attach File</Button>
                            <input type="file" ref={attachFileRef} onChange={handleAttachFile} className="hidden" />
                            <div className="space-y-1 mt-2 max-h-24 overflow-y-auto pr-2">
                                {attachedFiles.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-1 bg-black/20 rounded text-sm">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <div className="flex-shrink-0 flex gap-1">
                                            <Button variant="outline" className="text-xs !p-1" onClick={() => setViewingFile(file as any)}>View</Button>
                                            <Button variant="outline" className="text-xs !p-1" onClick={() => handleRemoveAttachment(file.id)}>X</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Start Time</label>
                            <Input type="time" value={itemData.time || ''} onChange={e => handleChange('time', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">End Time</label>
                            <Input type="time" value={itemData.endTime || ''} onChange={e => handleChange('endTime', e.target.value)} className="mt-1" />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-gray-400">Location</label>
                            <Input value={itemData.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="e.g., Library Room 201" className="mt-1" />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-gray-400">Color Tag</label>
                            <Input type="color" value={itemData.color || '#5aa1ff'} onChange={e => handleChange('color', e.target.value)} className="mt-1 w-full h-10 p-1" />
                        </div>
                    </div>
                </main>
                <footer className="p-3 flex justify-between border-t border-white/10 flex-shrink-0">
                    <div>
                        {itemData.ts && <Button variant="outline" className="text-red-400 border-red-500/50 hover:bg-red-500/10" onClick={handleDelete}>Delete Event</Button>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ScheduleEditorModal;
