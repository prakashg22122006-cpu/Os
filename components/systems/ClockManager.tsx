import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LiveClockType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-text">
        {title} {subtitle && <small className="text-text-dim font-normal ml-1">{subtitle}</small>}
    </h3>
);

const TypeEditorModal: React.FC<{
    item: Partial<LiveClockType> | null;
    onSave: (itemData: Omit<LiveClockType, 'id'> & { id?: number }) => void;
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
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">{item?.id ? 'Edit' : 'Create'} Clock Type</h4></header>
                <main className="p-4 space-y-3">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Clock Name" />
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


const ClockManager: React.FC = () => {
    const { liveClockTypes, setLiveClockTypes } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<LiveClockType> | null>(null);

    const handleOpenModal = (item?: LiveClockType) => {
        setEditingType(item || {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingType(null);
        setIsModalOpen(false);
    };
    
    const handleSave = (itemData: Omit<LiveClockType, 'id'> & { id?: number }) => {
        if (itemData.id) { // Update
            setLiveClockTypes(prev => prev.map(t => t.id === itemData.id ? { ...t, ...itemData } as LiveClockType : t));
        } else { // Create
            setLiveClockTypes(prev => [{ ...itemData, id: Date.now() } as LiveClockType, ...prev]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this clock type?")) {
            setLiveClockTypes(prev => prev.filter(t => t.id !== id));
        }
    };

    return (
        <div>
            <CardHeader title="Live Clock Systems" subtitle="Customize your clock and time-tracking types" />
            <div className="mb-4">
                <Button onClick={() => handleOpenModal()}>+ Create New Clock Type</Button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                 {liveClockTypes.length === 0 ? (
                    <p className="text-center text-text-dim py-8">No clock types created yet. Click the button above to add your first one!</p>
                ) : (
                    liveClockTypes.map(clockType => (
                        <div key={clockType.id} className="p-3 bg-black/20 rounded-lg">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-white">{clockType.name}</h4>
                                    <p className="text-sm text-text-dim">{clockType.description}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-2">
                                    <Button variant="outline" className="text-xs" onClick={() => handleOpenModal(clockType)}>Edit</Button>
                                    <Button variant="outline" className="text-xs text-red-400" onClick={() => handleDelete(clockType.id)}>Delete</Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
             {isModalOpen && <TypeEditorModal item={editingType} onSave={handleSave} onClose={handleCloseModal} />}
        </div>
    );
};

export default ClockManager;