



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AppSettings, DashboardWidgetSetting, SystemModuleSetting, ThemeConfig, PomodoroPreset, TimerMode, LiveCalendarType, LiveClockType, ToolbarItem } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AdvancedColorPicker from '../ui/AdvancedColorPicker';
import { addFile } from '../../utils/db';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[rgba(255,255,255,0.02)] border border-border-color p-4 rounded-xl">
        <h4 className="font-semibold text-text mb-3">{title}</h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <div className="mt-1">
            {children}
        </div>
    </div>
);

// --- Pomodoro Settings Components ---
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

const PomodoroSettings: React.FC = () => {
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
            <Button onClick={handleCreatePreset}>+ Create New Preset</Button>
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {pomodoroPresets.map(preset => (
                    <div key={preset.id}>
                        <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                            <p className="font-semibold">{preset.name}</p>
                            <div className="flex gap-2">
                                <Button
                                    variant={editingPresetId === preset.id ? 'primary' : 'outline'}
                                    className="text-xs"
                                    onClick={() => setEditingPresetId(editingPresetId === preset.id ? null : preset.id)}
                                >
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


// --- Calendar Settings Components ---
const CalendarTypeEditorModal: React.FC<{
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

const CalendarSettings: React.FC = () => {
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
            <Button onClick={() => handleOpenModal()}>+ Create New Calendar Type</Button>
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {liveCalendarTypes.map(calType => (
                    <div key={calType.id} className="p-3 bg-black/20 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-white">{calType.name}</h4>
                                <p className="text-sm text-gray-400">{calType.description}</p>
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
            {isModalOpen && <CalendarTypeEditorModal item={editingType} onSave={handleSave} onClose={handleCloseModal} />}
        </div>
    );
};


// --- Clock Settings Components ---
const ClockTypeEditorModal: React.FC<{
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

const ClockSettings: React.FC = () => {
    const { liveClockTypes, setLiveClockTypes, activeLiveClockTypeId, setActiveLiveClockTypeId } = useAppContext();
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
            <Button onClick={() => handleOpenModal()}>+ Create New Clock Type</Button>
            <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                 {liveClockTypes.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No clock types created yet. Click the button above to add your first one!</p>
                ) : (
                    liveClockTypes.map(clockType => (
                        <div key={clockType.id} className="p-3 bg-black/20 rounded-lg">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-white">{clockType.name}</h4>
                                    <p className="text-sm text-gray-400">{clockType.description}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-2">
                                    <Button
                                        variant={activeLiveClockTypeId === clockType.id ? 'primary' : 'outline'}
                                        className="text-xs"
                                        onClick={() => setActiveLiveClockTypeId(clockType.id)}
                                        disabled={activeLiveClockTypeId === clockType.id}
                                    >
                                        {activeLiveClockTypeId === clockType.id ? 'Active' : 'Set Active'}
                                    </Button>
                                    <Button variant="outline" className="text-xs" onClick={() => handleOpenModal(clockType)}>Edit</Button>
                                    <Button variant="outline" className="text-xs text-red-400" onClick={() => handleDelete(clockType.id)}>Delete</Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
             {isModalOpen && <ClockTypeEditorModal item={editingType} onSave={handleSave} onClose={handleCloseModal} />}
        </div>
    );
};

// --- Main SettingsManager Component ---
const SettingsManager: React.FC = () => {
    const { appSettings, setAppSettings } = useAppContext();
    const [widgets, setWidgets] = useState(appSettings.dashboardWidgets);
    const [modules, setModules] = useState(appSettings.systemModules);
    const [toolbar, setToolbar] = useState(appSettings.toolbar || []);
    const [customCss, setCustomCss] = useState(appSettings.customCSS || '');

    // Update local state if appSettings changes externally
    useEffect(() => {
        setWidgets(appSettings.dashboardWidgets);
        setModules(appSettings.systemModules);
        setToolbar(appSettings.toolbar || []);
    }, [appSettings]);

    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveCss = () => {
        handleSettingChange('customCSS', customCss);
        alert('Custom CSS saved and applied!');
    };

    const handleThemeConfigChange = (newConfig: Partial<ThemeConfig>) => {
        setAppSettings(prev => ({
            ...prev,
            themeConfig: {
                ...prev.themeConfig,
                ...newConfig
            }
        }));
    };

    const handleWidgetToggle = (id: string) => {
        const newWidgets = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
        setWidgets(newWidgets);
        handleSettingChange('dashboardWidgets', newWidgets);
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newWidgets.length) return;
        [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]]; // Swap
        setWidgets(newWidgets);
        handleSettingChange('dashboardWidgets', newWidgets);
    };
    
    const handleModuleToggle = (id: string) => {
        const newModules = modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
        setModules(newModules);
        handleSettingChange('systemModules', newModules);
    };

    const moveModule = (index: number, direction: 'up' | 'down') => {
        const newModules = [...modules];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newModules.length) return;
        [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]]; // Swap
        setModules(newModules);
        handleSettingChange('systemModules', newModules);
    };

    const handleToolbarToggle = (id: string) => {
        const newToolbar = toolbar.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t);
        setToolbar(newToolbar);
        handleSettingChange('toolbar', newToolbar);
    };

    const handleWallpaperTypeChange = (type: AppSettings['wallpaper']['type']) => {
        handleSettingChange('wallpaper', { ...appSettings.wallpaper, type });
    };

    const handleWallpaperImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imageId = await addFile(file);
            handleSettingChange('wallpaper', { type: 'image', imageId });
        } catch (error) {
            console.error("Failed to upload wallpaper image:", error);
            alert("Failed to upload image.");
        }
    };

    const removeWallpaperImage = () => {
        handleSettingChange('wallpaper', { type: 'default' });
    };
    
    const handleLiveWallpaperImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imageId = await addFile(file);
            handleSettingChange('wallpaper', {
                ...appSettings.wallpaper,
                type: 'live',
                liveConfig: {
                    ...(appSettings.wallpaper.liveConfig || { particleDensity: 0.5, particleOpacity: 0.5 }),
                    liveImageId: imageId,
                }
            });
        } catch (error) {
            console.error("Failed to upload live wallpaper background:", error);
            alert("Failed to upload image.");
        }
    };

    const removeLiveWallpaperImage = () => {
        handleSettingChange('wallpaper', {
            ...appSettings.wallpaper,
            type: 'live',
            liveConfig: {
                ...(appSettings.wallpaper.liveConfig || { particleDensity: 0.5, particleOpacity: 0.5 }),
                liveImageId: undefined,
            }
        });
    };


    const handleLiveWallpaperConfigChange = (key: 'particleDensity' | 'particleOpacity', value: number) => {
        handleSettingChange('wallpaper', {
            ...appSettings.wallpaper,
            liveConfig: {
                ...(appSettings.wallpaper.liveConfig || { particleDensity: 0.5, particleOpacity: 0.5 }),
                [key]: value
            }
        });
    };


    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <SettingsSection title="Appearance">
                        <SettingItem label="UI Style">
                            <div className="flex gap-2">
                                <Button variant={appSettings.uiStyle === 'classic' ? 'primary' : 'outline'} onClick={() => handleSettingChange('uiStyle', 'classic')}>Classic</Button>
                                <Button variant={appSettings.uiStyle === 'modern' ? 'primary' : 'outline'} onClick={() => handleSettingChange('uiStyle', 'modern')}>Modern</Button>
                            </div>
                        </SettingItem>
                        <SettingItem label="Theme">
                            <div className="flex gap-2">
                                <Button variant={appSettings.theme === 'dark' ? 'primary' : 'outline'} onClick={() => handleSettingChange('theme', 'dark')}>Dark</Button>
                                <Button variant={appSettings.theme === 'light' ? 'primary' : 'outline'} onClick={() => handleSettingChange('theme', 'light')}>Light</Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Adjust theme for best text contrast with your chosen background color.</p>
                        </SettingItem>
                        <SettingItem label="Layout Density">
                            <div className="flex gap-2">
                                <Button variant={appSettings.layout === 'spacious' ? 'primary' : 'outline'} onClick={() => handleSettingChange('layout', 'spacious')}>Spacious</Button>
                                <Button variant={appSettings.layout === 'cozy' ? 'primary' : 'outline'} onClick={() => handleSettingChange('layout', 'cozy')}>Cozy</Button>
                                <Button variant={appSettings.layout === 'compact' ? 'primary' : 'outline'} onClick={() => handleSettingChange('layout', 'compact')}>Compact</Button>
                            </div>
                        </SettingItem>
                        <SettingItem label="Font Family">
                            <div className="flex gap-2">
                                <Button variant={appSettings.fontFamily === 'sans' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'sans')}>Sans-Serif</Button>
                                <Button variant={appSettings.fontFamily === 'serif' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'serif')}>Serif</Button>
                                <Button variant={appSettings.fontFamily === 'mono' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'mono')}>Mono</Button>
                            </div>
                        </SettingItem>
                    </SettingsSection>

                    <SettingsSection title="God Level Customization">
                        <SettingItem label="Custom Font Family">
                            <Input 
                                value={appSettings.customFont || ''} 
                                onChange={e => handleSettingChange('customFont', e.target.value)} 
                                placeholder="e.g., 'Comic Sans MS', Roboto" 
                            />
                            <p className="text-xs text-gray-400 mt-1">Overrides the standard font selection.</p>
                        </SettingItem>
                        <SettingItem label="Glass Transparency">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="range" min="0" max="100" 
                                    value={appSettings.themeConfig.glassOpacity ?? 30}
                                    onChange={e => handleThemeConfigChange({ glassOpacity: parseInt(e.target.value) })}
                                    className="flex-grow"
                                />
                                <span className="w-10 text-right text-sm">{appSettings.themeConfig.glassOpacity ?? 30}%</span>
                            </div>
                        </SettingItem>
                        <SettingItem label="Glass Blur">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" min="0" max="50" 
                                    value={appSettings.themeConfig.glassBlur ?? 20}
                                    onChange={e => handleThemeConfigChange({ glassBlur: parseInt(e.target.value) })}
                                    className="flex-grow"
                                />
                                <span className="w-10 text-right text-sm">{appSettings.themeConfig.glassBlur ?? 20}px</span>
                            </div>
                        </SettingItem>
                        <SettingItem label="Corner Radius">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" min="0" max="50" 
                                    value={appSettings.themeConfig.borderRadius ?? 24}
                                    onChange={e => handleThemeConfigChange({ borderRadius: parseInt(e.target.value) })}
                                    className="flex-grow"
                                />
                                <span className="w-10 text-right text-sm">{appSettings.themeConfig.borderRadius ?? 24}px</span>
                            </div>
                        </SettingItem>
                    </SettingsSection>

                    <SettingsSection title="Wallpaper">
                        <SettingItem label="Wallpaper Type">
                            <div className="flex gap-2">
                                <Button variant={appSettings.wallpaper.type === 'default' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('default')}>Default</Button>
                                <Button variant={appSettings.wallpaper.type === 'image' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('image')}>Image</Button>
                                <Button variant={appSettings.wallpaper.type === 'live' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('live')}>Live</Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Overrides the default background for both Classic and Modern UI styles.</p>
                        </SettingItem>
                        {appSettings.wallpaper.type === 'image' && (
                            <SettingItem label="Upload Custom Image">
                                <div className="flex gap-2 items-center">
                                    <Input type="file" accept="image/*" onChange={handleWallpaperImageUpload} />
                                    {appSettings.wallpaper.imageId && (
                                        <Button variant="outline" onClick={removeWallpaperImage}>Remove</Button>
                                    )}
                                </div>
                            </SettingItem>
                        )}
                        {appSettings.wallpaper.type === 'live' && (
                            <>
                                <SettingItem label="Live Wallpaper Background">
                                    <div className="flex gap-2 items-center">
                                        <Input type="file" accept="image/*" onChange={handleLiveWallpaperImageUpload} />
                                        {appSettings.wallpaper.liveConfig?.liveImageId && (
                                            <Button variant="outline" onClick={removeLiveWallpaperImage}>Remove</Button>
                                        )}
                                    </div>
                                </SettingItem>
                                <SettingItem label="Particle Density">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={appSettings.wallpaper.liveConfig?.particleDensity || 0.5}
                                        onChange={(e) => handleLiveWallpaperConfigChange('particleDensity', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </SettingItem>
                                <SettingItem label="Particle Opacity">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={appSettings.wallpaper.liveConfig?.particleOpacity || 0.5}
                                        onChange={(e) => handleLiveWallpaperConfigChange('particleOpacity', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </SettingItem>
                            </>
                        )}
                    </SettingsSection>
                    
                    <SettingsSection title="Color Customization">
                        <SettingItem label="Accent Color">
                            <AdvancedColorPicker
                                hue={appSettings.themeConfig.accentHue}
                                saturation={appSettings.themeConfig.accentSaturation}
                                lightness={appSettings.themeConfig.accentLightness}
                                onChange={(c) => handleThemeConfigChange({ accentHue: c.h, accentSaturation: c.s, accentLightness: c.l })}
                            />
                        </SettingItem>
                         <SettingItem label="Background Color">
                            <AdvancedColorPicker
                                hue={appSettings.themeConfig.bgHue}
                                saturation={appSettings.themeConfig.bgSaturation}
                                lightness={appSettings.themeConfig.bgLightness}
                                onChange={(c) => handleThemeConfigChange({ bgHue: c.h, bgSaturation: c.s, bgLightness: c.l })}
                            />
                        </SettingItem>
                    </SettingsSection>
                </div>

                <div className="space-y-4">
                    <SettingsSection title="Toolbar Customization">
                        <p className="text-xs text-gray-400 -mt-2">Toggle icons in the top navigation bar.</p>
                         <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {toolbar.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-border-color">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={item.enabled} onChange={() => handleToolbarToggle(item.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--grad-1)] focus:ring-0"/>
                                        <span>{item.label}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </SettingsSection>

                    <SettingsSection title="Dashboard Widgets">
                        <p className="text-xs text-gray-400 -mt-2">Toggle visibility and re-order.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {widgets.map((widget, index) => (
                                <div key={widget.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-border-color">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={widget.enabled} onChange={() => handleWidgetToggle(widget.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--grad-1)] focus:ring-0"/>
                                        <span>{widget.name}</span>
                                    </label>
                                    <div className="flex gap-1">
                                        <Button variant="outline" className="text-xs !p-1" disabled={index === 0} onClick={() => moveWidget(index, 'up')}>↑</Button>
                                        <Button variant="outline" className="text-xs !p-1" disabled={index === widgets.length - 1} onClick={() => moveWidget(index, 'down')}>↓</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="System Modules">
                        <p className="text-xs text-gray-400 -mt-2">Toggle visibility and re-order.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {modules.map((module, index) => (
                                <div key={module.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-border-color">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={module.enabled} onChange={() => handleModuleToggle(module.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--grad-1)] focus:ring-0"/>
                                        <span>{module.name}</span>
                                    </label>
                                    <div className="flex gap-1">
                                        <Button variant="outline" className="text-xs !p-1" disabled={index === 0} onClick={() => moveModule(index, 'up')}>↑</Button>
                                        <Button variant="outline" className="text-xs !p-1" disabled={index === modules.length - 1} onClick={() => moveModule(index, 'down')}>↓</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SettingsSection>
                    <SettingsSection title="Focus & Pomodoro System">
                        <PomodoroSettings />
                    </SettingsSection>
                    <SettingsSection title="Live Calendar Systems">
                        <CalendarSettings />
                    </SettingsSection>
                    <SettingsSection title="Live Clock Systems">
                        <ClockSettings />
                    </SettingsSection>
                    <SettingsSection title="Custom CSS">
                        <p className="text-xs text-gray-400 -mt-2 mb-2">
                            Add your own CSS rules to further customize the look and feel. Use with caution as this can break the UI.
                        </p>
                        <textarea
                            value={customCss}
                            onChange={(e) => setCustomCss(e.target.value)}
                            rows={10}
                            placeholder={`/* Example: */\n.card-glow-on-hover {\n  border-radius: 4px;\n}`}
                            className="glass-textarea w-full font-mono text-sm placeholder:text-gray-500"
                        />
                        <Button onClick={handleSaveCss}>Save & Apply CSS</Button>
                    </SettingsSection>
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;