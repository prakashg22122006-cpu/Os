import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CustomWheel, WheelOption } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { addFile, getFile } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
    {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
  </h3>
);

const WheelEditorModal: React.FC<{
    wheel: Partial<CustomWheel>;
    onSave: (wheel: CustomWheel) => void;
    onClose: () => void;
    onDelete: (id: number) => void;
}> = ({ wheel, onSave, onClose, onDelete }) => {
    const [name, setName] = useState(wheel.name || '');
    const [options, setOptions] = useState<WheelOption[]>(wheel.options || []);
    const [newOption, setNewOption] = useState({ type: 'text', label: '', value: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddOption = async () => {
        if (!newOption.label.trim()) return alert('Option label is required.');
        if (newOption.type === 'text' && !(newOption.value as string).trim()) return alert('Option value is required.');

        let value: string | number = newOption.value;
        if (newOption.type === 'file') {
            const file = fileInputRef.current?.files?.[0];
            if (!file) return alert('Please select a file for the file option.');
            try {
                value = await addFile(file);
            } catch (e) {
                alert('Failed to save file.');
                return;
            }
        }
        
        const optionToAdd: WheelOption = { id: Date.now(), type: newOption.type as 'text' | 'file', label: newOption.label, value };
        setOptions(prev => [...prev, optionToAdd]);
        setNewOption({ type: 'text', label: '', value: '' });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeOption = (id: number) => {
        setOptions(prev => prev.filter(opt => opt.id !== id));
    };

    const handleSave = () => {
        if (!name.trim()) return alert('Wheel name is required.');
        if (options.length < 2) return alert('A wheel must have at least 2 options.');
        onSave({ id: wheel.id || Date.now(), name, options });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--accent-color)]/20 rounded-xl shadow-2xl w-full max-w-lg h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-semibold text-lg">{wheel.id ? 'Edit Wheel' : 'Create New Wheel'}</h4>
                    {wheel.id && <Button variant="outline" className="text-red-400 border-red-500/50 hover:bg-red-500/10 text-xs" onClick={() => onDelete(wheel.id!)}>Delete Wheel</Button>}
                </header>
                <main className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-semibold">Wheel Name</label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Daily Rewards" />
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold mb-2">Options ({options.length})</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {options.map(opt => (
                                <div key={opt.id} className="flex justify-between items-center p-2 bg-black/20 rounded-lg text-sm">
                                    <span>{opt.label} ({opt.type})</span>
                                    <Button variant="outline" className="!p-1 text-xs" onClick={() => removeOption(opt.id)}>Remove</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 border border-dashed border-white/10 rounded-lg space-y-2">
                        <h5 className="font-semibold text-sm">Add New Option</h5>
                        <Input value={newOption.label} onChange={e => setNewOption(p => ({ ...p, label: e.target.value }))} placeholder="Option Label (e.g., Mystery Prize)" />
                        <select value={newOption.type} onChange={e => setNewOption(p => ({ ...p, type: e.target.value, value: '' }))} className="bg-transparent border border-[var(--input-border-color)] rounded-lg p-2 w-full text-sm">
                            <option value="text" className="bg-[var(--option-bg-color)]">Text Prize</option>
                            <option value="file" className="bg-[var(--option-bg-color)]">File Prize (Image, PDF, etc.)</option>
                        </select>
                        {newOption.type === 'text' ? (
                            <Input value={newOption.value as string} onChange={e => setNewOption(p => ({ ...p, value: e.target.value }))} placeholder="Enter text prize..." />
                        ) : (
                            <Input type="file" ref={fileInputRef} />
                        )}
                        <Button onClick={handleAddOption} className="w-full">Add Option</Button>
                    </div>
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Wheel</Button>
                </footer>
            </div>
        </div>
    );
};

const GamificationWidget: React.FC = () => {
    const { customWheels, setCustomWheels, setViewingFile } = useAppContext();
    const [selectedWheelId, setSelectedWheelId] = useState<number | null>(customWheels[0]?.id || null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<WheelOption | null>(null);
    const [rotation, setRotation] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingWheel, setEditingWheel] = useState<Partial<CustomWheel> | null>(null);

    const selectedWheel = useMemo(() => customWheels.find(w => w.id === selectedWheelId), [customWheels, selectedWheelId]);

    const handleSpin = () => {
        if (isSpinning || !selectedWheel || selectedWheel.options.length < 2) {
            if(selectedWheel && selectedWheel.options.length < 2) alert("This wheel needs at least 2 options to spin.");
            return;
        }

        setIsSpinning(true);
        setResult(null);
        const newRotation = rotation + 360 * 5 + Math.random() * 360;
        setRotation(newRotation);

        setTimeout(() => {
            const finalAngle = newRotation % 360;
            const sliceAngle = 360 / selectedWheel.options.length;
            const resultIndex = Math.floor((360 - finalAngle) / sliceAngle);
            const spinResult = selectedWheel.options[resultIndex];
            
            setResult(spinResult);
            setIsSpinning(false);
        }, 4000);
    };

    const handleSaveWheel = (wheelData: CustomWheel) => {
        setCustomWheels(prev => {
            const exists = prev.some(w => w.id === wheelData.id);
            if (exists) {
                return prev.map(w => w.id === wheelData.id ? wheelData : w);
            }
            return [...prev, wheelData];
        });
        setIsEditing(false);
        setEditingWheel(null);
    };
    
    const handleDeleteWheel = (id: number) => {
        if(window.confirm("Are you sure you want to delete this wheel? This action cannot be undone.")) {
            const remainingWheels = customWheels.filter(w => w.id !== id);
            setCustomWheels(remainingWheels);
            if (selectedWheelId === id) {
                setSelectedWheelId(remainingWheels.length > 0 ? remainingWheels[0].id : null);
            }
            setIsEditing(false);
            setEditingWheel(null);
        }
    }

    const handleViewFile = async () => {
        if (result?.type === 'file') {
            const fileData = await getFile(result.value as number);
            if (fileData) setViewingFile(fileData);
            setResult(null);
        }
    };

    const ResultModal = () => (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResult(null)}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--accent-color)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col items-center text-center p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[var(--accent-color)] mb-2">You got: {result?.label}!</h2>
                {result?.type === 'text' && <p className="text-lg mb-6">{result.value}</p>}
                {result?.type === 'file' ? <Button onClick={handleViewFile}>View File</Button> : <Button onClick={() => setResult(null)}>Awesome!</Button>}
            </div>
        </div>
    );
    
    const options = selectedWheel?.options || [];
    const numOptions = options.length;
    const sliceAngle = numOptions > 0 ? 360 / numOptions : 0;
    const wheelColors = ['#5aa1ff', '#3bb0ff', '#23c4ff', '#00d7ff', '#00e7f5', '#8463ff', '#c263ff'];

    return (
        <div className="flex flex-col items-center justify-between h-full p-4">
            {result && <ResultModal />}
            {isEditing && editingWheel && <WheelEditorModal wheel={editingWheel} onSave={handleSaveWheel} onClose={() => setIsEditing(false)} onDelete={handleDeleteWheel} />}
            
            <div className="flex justify-between items-center w-full">
                <select value={selectedWheelId || ''} onChange={e => setSelectedWheelId(Number(e.target.value))} className="bg-transparent border border-[var(--input-border-color)] text-sm rounded-lg p-2 flex-grow">
                     {customWheels.length === 0 && <option>No wheels configured</option>}
                    {customWheels.map(wheel => <option key={wheel.id} value={wheel.id} className="bg-[var(--option-bg-color)]">{wheel.name}</option>)}
                </select>
                <div className="flex gap-2 ml-2">
                    <Button variant="outline" className="!p-2" onClick={() => { setEditingWheel(selectedWheel || {}); setIsEditing(true); }}>⚙️</Button>
                    <Button variant="outline" className="!p-2" onClick={() => { setEditingWheel({}); setIsEditing(true); }}>+</Button>
                </div>
            </div>
            
            <div className="relative w-64 h-64 flex items-center justify-center my-4">
                <div className="absolute -top-2 w-0 h-0 border-x-[12px] border-x-transparent border-b-[24px] border-b-white z-20 drop-shadow-lg" />
                <div className="absolute -inset-2 rounded-full border-8 border-slate-700/50" />
                
                <div
                    className="relative w-full h-full rounded-full transition-transform duration-[4000ms] ease-out shadow-2xl"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(${
                                numOptions > 0
                                    ? options.map((opt, i) =>
                                        `${wheelColors[i % wheelColors.length]} ${i * sliceAngle}deg, ${wheelColors[i % wheelColors.length]} ${(i + 1) * sliceAngle}deg`
                                      ).join(', ')
                                    : '#4b5563 0deg 360deg'
                            })`
                        }}
                    />
                    
                    {options.map((option, i) => {
                        const angle = i * sliceAngle + sliceAngle / 2;
                        return (
                            <div
                                key={option.id}
                                className="absolute top-0 left-0 w-full h-full flex items-start justify-center"
                                style={{ transform: `rotate(${angle}deg)` }}
                            >
                                <span className="text-white font-bold text-sm pt-4 max-w-[50%] text-center break-words">
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#071023] rounded-full border-4 border-white/80 shadow-inner z-10" />
                </div>
            </div>

            <Button onClick={handleSpin} disabled={isSpinning || !selectedWheel || numOptions < 2} className="px-8 py-3 text-lg font-bold tracking-wider">
                {isSpinning ? 'Spinning...' : 'SPIN!'}
            </Button>
        </div>
    );
};

export default GamificationWidget;
