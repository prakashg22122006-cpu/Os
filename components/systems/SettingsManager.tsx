
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AppSettings, ThemeConfig } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AdvancedColorPicker from '../ui/AdvancedColorPicker';
import { addFile } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h3 className="m-0 text-lg font-semibold text-[var(--text-color-accent)]">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--text-color-dim)] mt-0.5">{subtitle}</p>}
    </div>
);

const THEME_PRESETS = [
    { name: 'Deep Space', accent: '#3bb0ff', bg: '#0b1626', config: { accentHue: 204, accentSaturation: 100, accentLightness: 61, bgHue: 216, bgSaturation: 55, bgLightness: 10 } },
    { name: 'Cyberpunk', accent: '#f43f5e', bg: '#180412', config: { accentHue: 345, accentSaturation: 90, accentLightness: 60, bgHue: 310, bgSaturation: 70, bgLightness: 5 } },
    { name: 'Forest', accent: '#34d399', bg: '#051a10', config: { accentHue: 158, accentSaturation: 64, accentLightness: 51, bgHue: 150, bgSaturation: 67, bgLightness: 6 } },
    { name: 'Sunset', accent: '#fbbf24', bg: '#1f1005', config: { accentHue: 38, accentSaturation: 96, accentLightness: 56, bgHue: 25, bgSaturation: 60, bgLightness: 7 } },
    { name: 'Royal', accent: '#a855f7', bg: '#12051f', config: { accentHue: 271, accentSaturation: 91, accentLightness: 65, bgHue: 270, bgSaturation: 70, bgLightness: 7 } },
    { name: 'Monochrome', accent: '#94a3b8', bg: '#0f172a', config: { accentHue: 215, accentSaturation: 20, accentLightness: 65, bgHue: 220, bgSaturation: 45, bgLightness: 11 } },
];

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${active ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-md' : 'text-[var(--text-color-dim)] hover:bg-white/5'}`}
    >
        {children}
    </button>
);

const SettingsManager: React.FC = () => {
    const { appSettings, setAppSettings } = useAppContext();
    const [activeTab, setActiveTab] = useState<'appearance' | 'workspace' | 'modules'>('appearance');

    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleThemeConfigChange = (newConfig: Partial<ThemeConfig>) => {
        setAppSettings(prev => ({
            ...prev,
            themeConfig: { ...prev.themeConfig, ...newConfig }
        }));
    };

    const handleApplyPreset = (config: ThemeConfig) => {
        setAppSettings(prev => ({
            ...prev,
            themeConfig: config,
        }));
    };

    const handleWallpaperImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imageId = await addFile(file);
            handleSettingChange('wallpaper', { ...appSettings.wallpaper, type: 'image', imageId });
        } catch (error) { alert("Failed to upload image."); }
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
        } catch (error) { alert("Failed to upload live bg."); }
    };
    
    const toggleWidget = (id: string) => {
        const widgets = appSettings.dashboardWidgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
        handleSettingChange('dashboardWidgets', widgets);
    };
    
    const toggleModule = (id: string) => {
        const modules = appSettings.systemModules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
        handleSettingChange('systemModules', modules);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <CardHeader title="Settings Center" subtitle="Customize your personal OS experience" />
            
            <div className="flex gap-2 mb-6 border-b border-[var(--card-border-color)] pb-4 overflow-x-auto">
                <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')}>🎨 Appearance & Theme</TabButton>
                <TabButton active={activeTab === 'workspace'} onClick={() => setActiveTab('workspace')}>⚙️ Workspace & Layout</TabButton>
                <TabButton active={activeTab === 'modules'} onClick={() => setActiveTab('modules')}>📦 Modules & Widgets</TabButton>
            </div>

            <div className="space-y-8">
                {activeTab === 'appearance' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
                                <h4 className="font-semibold mb-4">Theme Presets</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {THEME_PRESETS.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => handleApplyPreset(preset.config)}
                                            className="flex flex-col items-center gap-2 p-2 rounded-lg border border-transparent hover:border-[var(--accent-color)] transition-all group"
                                        >
                                            <div className="w-full aspect-video rounded-md shadow-lg flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: preset.bg }}>
                                                <div className="w-8 h-8 rounded-full shadow-md" style={{ backgroundColor: preset.accent }}></div>
                                            </div>
                                            <span className="text-xs text-[var(--text-color-dim)] group-hover:text-[var(--text-color)]">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
                                <h4 className="font-semibold mb-4">Wallpaper</h4>
                                <div className="flex gap-2 mb-4">
                                    {(['default', 'image', 'live'] as const).map(type => (
                                        <Button
                                            key={type}
                                            variant={appSettings.wallpaper.type === type ? 'primary' : 'outline'}
                                            onClick={() => handleSettingChange('wallpaper', { ...appSettings.wallpaper, type })}
                                            className="flex-1 capitalize"
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                                {appSettings.wallpaper.type === 'image' && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-400">Upload a static background image.</p>
                                        <Input type="file" accept="image/*" onChange={handleWallpaperImageUpload} />
                                    </div>
                                )}
                                {appSettings.wallpaper.type === 'live' && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-400">Background image for particle effects.</p>
                                        <Input type="file" accept="image/*" onChange={handleLiveWallpaperImageUpload} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
                            <h4 className="font-semibold mb-4">Custom Colors</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm mb-2 text-[var(--text-color-dim)]">Accent Color</label>
                                    <AdvancedColorPicker
                                        hue={appSettings.themeConfig.accentHue}
                                        saturation={appSettings.themeConfig.accentSaturation}
                                        lightness={appSettings.themeConfig.accentLightness}
                                        onChange={(c) => handleThemeConfigChange({ accentHue: c.h, accentSaturation: c.s, accentLightness: c.l })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2 text-[var(--text-color-dim)]">Background Tint</label>
                                    <AdvancedColorPicker
                                        hue={appSettings.themeConfig.bgHue}
                                        saturation={appSettings.themeConfig.bgSaturation}
                                        lightness={appSettings.themeConfig.bgLightness}
                                        onChange={(c) => handleThemeConfigChange({ bgHue: c.h, bgSaturation: c.s, bgLightness: c.l })}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'workspace' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl space-y-4">
                             <h4 className="font-semibold">Interface Style</h4>
                             <div>
                                <label className="text-sm text-[var(--text-color-dim)] block mb-2">UI Mode</label>
                                <div className="flex gap-2">
                                    <Button variant={appSettings.uiStyle === 'classic' ? 'primary' : 'outline'} onClick={() => handleSettingChange('uiStyle', 'classic')} className="flex-1">Classic (Parallax)</Button>
                                    <Button variant={appSettings.uiStyle === 'modern' ? 'primary' : 'outline'} onClick={() => handleSettingChange('uiStyle', 'modern')} className="flex-1">Modern (Glass)</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-color-dim)] block mb-2">Layout Density</label>
                                <select 
                                    value={appSettings.layout} 
                                    onChange={e => handleSettingChange('layout', e.target.value)}
                                    className="w-full bg-[var(--bg-gradient-start)] border border-[var(--input-border-color)] p-2 rounded-lg"
                                >
                                    <option value="spacious">Spacious</option>
                                    <option value="cozy">Cozy</option>
                                    <option value="compact">Compact</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-color-dim)] block mb-2">Typography</label>
                                <div className="flex gap-2">
                                     <Button variant={appSettings.fontFamily === 'sans' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'sans')} className="flex-1 font-sans">Sans</Button>
                                     <Button variant={appSettings.fontFamily === 'serif' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'serif')} className="flex-1 font-serif">Serif</Button>
                                     <Button variant={appSettings.fontFamily === 'mono' ? 'primary' : 'outline'} onClick={() => handleSettingChange('fontFamily', 'mono')} className="flex-1 font-mono">Mono</Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl space-y-4">
                            <h4 className="font-semibold">Time & Date</h4>
                            <div>
                                <label className="text-sm text-[var(--text-color-dim)] block mb-2">Time Format</label>
                                <div className="flex gap-2">
                                    <Button variant={appSettings.timeFormat === '12h' ? 'primary' : 'outline'} onClick={() => handleSettingChange('timeFormat', '12h')} className="flex-1">12 Hour (AM/PM)</Button>
                                    <Button variant={appSettings.timeFormat === '24h' ? 'primary' : 'outline'} onClick={() => handleSettingChange('timeFormat', '24h')} className="flex-1">24 Hour</Button>
                                </div>
                            </div>
                        </div>
                     </div>
                )}

                {activeTab === 'modules' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
                            <h4 className="font-semibold mb-2">Dashboard Widgets</h4>
                            <p className="text-xs text-gray-400 mb-4">Toggle visibility on the main dashboard.</p>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {appSettings.dashboardWidgets.map(widget => (
                                    <div key={widget.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span>{widget.name}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={widget.enabled} onChange={() => toggleWidget(widget.id)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
                            <h4 className="font-semibold mb-2">System Modules</h4>
                            <p className="text-xs text-gray-400 mb-4">Enable or disable major system features.</p>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {appSettings.systemModules.map(module => (
                                    <div key={module.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span>{module.name}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={module.enabled} onChange={() => toggleModule(module.id)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsManager;
