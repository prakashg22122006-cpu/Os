import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PomodoroPreset, TimerMode } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-text">
        {title} {subtitle && <small className="text-text-dim font-normal ml-1">{subtitle}</small>}
    </h3>
);

const ModeEditor: React.FC<{
    mode: TimerMode;
    onUpdate: (updatedMode: TimerMode) => void;
    onDelete: () => void;
}> = ({ mode, onUpdate, onDelete }) => {
    return (
        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
            <Input type="color" value={mode.color} onChange={e => onUpdate({ ...mode, color: e.target.value })} className="p-1 h-10 w-10 flex-shrink-0" />
            <Input value={mode.name} onChange={e => onUpdate({ ...mode, name: e.target.value })} placeholder="Mode Name" className="flex-grow" />
            <Input type="number" value={mode.duration} onChange={e => onUpdate({ ...mode, duration: parseInt(e.target.value) || 0 })} placeholder="Mins" className="w-20" />
            <Button variant="outline" onClick={onDelete} className="text-xs !p-1.5">X</Button>
        </div>
    );
};

const PresetEditor: React.FC<{
    preset: PomodoroPreset;
    onSave: (updatedPreset: PomodoroPreset) => void;
    onCancel: () => void;
}> = ({ preset, onSave, onCancel }) => {
    const [editedPreset, setEditedPreset] = useState<PomodoroPreset>(preset);

    const updateField = (field: keyof PomodoroPreset, value: any) => {
        setEditedPreset(p => ({ ...p, [field]: value }));
    };

    const handleModeUpdate = (updatedMode: TimerMode) => {
        updateField('modes', editedPreset.modes.map(m => m.id === updatedMode.id ? updatedMode : m));
    };
    
    const handleModeDelete = (id: string) => {
        if (editedPreset.modes.length <= 1) {
            alert("A preset must have at least one mode.");
            return;
        }
        updateField('modes', editedPreset.modes.filter(m => m.id !== id));
        updateField('sequence', editedPreset.sequence.filter(seqId => seqId !== id)); // Also remove from sequence
    };
    
    const addMode = () => {
        const newMode: TimerMode = { id: `mode_${Date.now()}`, name: 'New Mode', duration: 10, color: '#ffffff' };
        updateField('modes', [...editedPreset.modes, newMode]);
    };
    
    const addToSequence = (modeId: string) => {
        updateField('sequence', [...editedPreset.sequence, modeId]);
    };
    
    const removeFromSequence = (index: number) => {
        const newSequence = [...editedPreset.sequence];
        newSequence.splice(index, 1);
        updateField('sequence', newSequence);
    };

    return (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
            <h4 className="text-lg font-bold">Editing: {preset.name}</h4>
            <Input value={editedPreset.name} onChange={e => updateField('name', e.target.value)} placeholder="Preset Name" />
            
            <div>
                <h5 className="font-semibold mb-2">Timer Modes</h5>
                <div className="space-y-2">
                    {editedPreset.modes.map(mode => (
                        <ModeEditor key={mode.id} mode={mode} onUpdate={handleModeUpdate} onDelete={() => handleModeDelete(mode.id)} />
                    ))}
                </div>
                <Button variant="outline" onClick={addMode} className="mt-2 text-sm">+ Add Mode</Button>
            </div>
            
             <div>
                <h5 className="font-semibold mb-2">Sequence Builder</h5>
                 <div className="flex flex-wrap gap-2 mb-2">
                    <span className="my-auto text-sm text-gray-400">Add to sequence:</span>
                    {editedPreset.modes.map(mode => (
                        <Button key={mode.id} variant="outline" className="text-xs" style={{ borderColor: mode.color, color: mode.color }} onClick={() => addToSequence(mode.id)}>{mode.name}</Button>
                    ))}
                </div>
                <div className="p-2 bg-black/20 rounded-lg min-h-[50px] flex flex-wrap gap-2">
                    {editedPreset.sequence.map((modeId, index) => {
                        const mode = editedPreset.modes.find(m => m.id === modeId);
                        if (!mode) return null;
                        return (
                            <div key={index} className="flex items-center gap-1 text-sm rounded px-2 py-1" style={{ backgroundColor: mode.color + '33' }}>
                                <span style={{ color: mode.color }}>{mode.name}</span>
                                <button onClick={() => removeFromSequence(index)} className="font-bold text-xs" style={{ color: mode.color }}>x</button>
                            </div>
                        )
                    })}
                    {editedPreset.sequence.length === 0 && <span className="text-xs text-gray-500 p-2">Click buttons above to build your sequence.</span>}
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={() => onSave(editedPreset)}>Save Preset</Button>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
};


const PomodoroManager: React.FC = () => {
    const { pomodoroPresets, setPomodoroPresets } = useAppContext();
    const [editingPresetId, setEditingPresetId] = useState<number | null>(null);

    const handleCreatePreset = () => {
        const newPreset: PomodoroPreset = {
            id: Date.now(),
            name: 'New Custom Preset',
            modes: [{ id: 'work', name: 'Work', duration: 25, color: '#ef4444' }],
            sequence: ['work'],
        };
        setPomodoroPresets(prev => [...prev, newPreset]);
        setEditingPresetId(newPreset.id);
    };

    const handleSavePreset = (updatedPreset: PomodoroPreset) => {
        setPomodoroPresets(prev => prev.map(p => p.id === updatedPreset.id ? updatedPreset : p));
        setEditingPresetId(null);
    };
    
    const handleDeletePreset = (id: number) => {
        if (pomodoroPresets.length <= 1) return alert("You must have at least one preset.");
        if (window.confirm("Delete this preset?")) {
            setPomodoroPresets(prev => prev.filter(p => p.id !== id));
            if (editingPresetId === id) setEditingPresetId(null);
        }
    };

    const editingPreset = pomodoroPresets.find(p => p.id === editingPresetId);

    return (
        <div>
            <CardHeader title="Focus & Pomodoro System" subtitle="Create and manage your focus presets" />
            <Button onClick={handleCreatePreset}>+ Create New Preset</Button>
            
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {pomodoroPresets.map(preset => (
                    <div key={preset.id}>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                            <p className="font-semibold">{preset.name}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" className="text-xs" onClick={() => setEditingPresetId(editingPresetId === preset.id ? null : preset.id)}>
                                    {editingPresetId === preset.id ? 'Close' : 'Edit'}
                                </Button>
                                <Button variant="outline" className="text-red-400 text-xs" onClick={() => handleDeletePreset(preset.id)}>Delete</Button>
                            </div>
                        </div>
                        {editingPresetId === preset.id && editingPreset && (
                             <PresetEditor
                                preset={editingPreset}
                                onSave={handleSavePreset}
                                onCancel={() => setEditingPresetId(null)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PomodoroManager;