import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LiveCalendarType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-text">
        {title} {subtitle && <small className="text-text-dim font-normal ml-1">{subtitle}</small>}
    </h3>
);

const TypeEditorModal: React.FC<{
    item: Partial<LiveCalendarType> | null;
    onSave: (itemData: Omit<LiveCalendarType, 'id'> & { id?: number }) => void;
    onClose: () => void;
}> = ({ item, onSave, onClose }) => {
    const [name, setName] = useState(item?.name || '');
    const [description, setDescription] = useState(item?.description || '');

    const handleSave = () => {
        if (!name.trim() || !description.trim()) {
            alert('Name and description are required.');
            return;
        }
        onSave({ id: item?.id, name, description });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-bg-offset to-bg border border-[var(--grad-1)]/20 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">{item?.id ? 'Edit' : 'Create'} Calendar Type</h4></header>
                <main className="p-4 space-y-3">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Calendar Name" />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Description..."
                        rows={4}
                        className="glass-textarea w-full"
                    />
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </footer>
            </div>
        </div>
    );
};


const CalendarManager: React.FC = () => {
    const { liveCalendarTypes, setLiveCalendarTypes, activeLiveCalendarTypeId, setActiveLiveCalendarTypeId } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<LiveCalendarType> | null>(null);

    const handleOpenModal = (item?: LiveCalendarType) => {
        setEditingType(item || {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingType(null);
        setIsModalOpen(false);
    };
    
    const handleSave = (itemData: Omit<LiveCalendarType, 'id'> & { id?: number }) => {
        if (itemData.id) { // Update
            setLiveCalendarTypes(prev => prev.map(t => t.id === itemData.id ? { ...t, ...itemData } as LiveCalendarType : t));
        } else { // Create
            setLiveCalendarTypes(prev => [{ ...itemData, id: Date.now() } as LiveCalendarType, ...prev]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (liveCalendarTypes.length <= 1) {
            alert("You must have at least one calendar type.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this calendar type?")) {
            setLiveCalendarTypes(prev => prev.filter(t => t.id !== id));
        }
    };

    return (
        <div>
            <CardHeader title="Live Calendar Systems" subtitle="Customize your calendar methodologies" />
            <div className="mb-4">
                <Button onClick={() => handleOpenModal()}>+ Create New Calendar Type</Button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {liveCalendarTypes.map(calType => (
                    <div key={calType.id} className="p-3 bg-black/20 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-white">{calType.name}</h4>
                                <p className="text-sm text-text-dim">{calType.description}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-2">
                                <Button 
                                    variant={activeLiveCalendarTypeId === calType.id ? 'primary' : 'outline'}
                                    className="text-xs"
                                    onClick={() => setActiveLiveCalendarTypeId(calType.id)}
                                    disabled={activeLiveCalendarTypeId === calType.id}
                                >
                                    {activeLiveCalendarTypeId === calType.id ? 'Active' : 'Set Active'}
                                </Button>
                                <Button variant="outline" className="text-xs" onClick={() => handleOpenModal(calType)}>Edit</Button>
                                <Button variant="outline" className="text-xs text-red-400" onClick={() => handleDelete(calType.id)}>Delete</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <TypeEditorModal item={editingType} onSave={handleSave} onClose={handleCloseModal} />}
        </div>
    );
};

export default CalendarManager;