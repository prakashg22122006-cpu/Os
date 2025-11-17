import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AppSettings, DashboardWidgetSetting, SystemModuleSetting, ThemeConfig } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AdvancedColorPicker from '../ui/AdvancedColorPicker';
import { addFile } from '../../utils/db';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-4 text-lg font-semibold text-[var(--text-color-accent)]">
        {title} {subtitle && <small className="text-[var(--text-color-dim)] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--card-border-color)] p-4 rounded-xl">
        <h4 className="font-semibold text-[var(--text-color-accent)] mb-3">{title}</h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="text-sm font-medium text-[var(--text-color-dim)]">{label}</label>
        <div className="mt-1">
            {children}
        </div>
    </div>
);

const SettingsManager: React.FC = () => {
    const { appSettings, setAppSettings } = useAppContext();
    const [widgets, setWidgets] = useState(appSettings.dashboardWidgets);
    const [modules, setModules] = useState(appSettings.systemModules);

    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
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
            <CardHeader title="Settings" subtitle="Customize your workspace" />
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
                            <p className="text-xs text-[var(--text-color-dim)] mt-2">Adjust theme for best text contrast with your chosen background color.</p>
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

                    <SettingsSection title="Wallpaper">
                        <SettingItem label="Wallpaper Type">
                            <div className="flex gap-2">
                                <Button variant={appSettings.wallpaper.type === 'default' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('default')}>Default</Button>
                                <Button variant={appSettings.wallpaper.type === 'image' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('image')}>Image</Button>
                                <Button variant={appSettings.wallpaper.type === 'live' ? 'primary' : 'outline'} onClick={() => handleWallpaperTypeChange('live')}>Live</Button>
                            </div>
                            <p className="text-xs text-[var(--text-color-dim)] mt-2">Overrides the default background for both Classic and Modern UI styles.</p>
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
                    <SettingsSection title="Dashboard Widgets">
                        <p className="text-xs text-[var(--text-color-dim)] -mt-2">Toggle visibility and re-order.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {widgets.map((widget, index) => (
                                <div key={widget.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--card-border-color)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={widget.enabled} onChange={() => handleWidgetToggle(widget.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0"/>
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
                        <p className="text-xs text-[var(--text-color-dim)] -mt-2">Toggle visibility and re-order.</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {modules.map((module, index) => (
                                <div key={module.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--card-border-color)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={module.enabled} onChange={() => handleModuleToggle(module.id)} className="form-checkbox h-4 w-4 rounded bg-transparent border-gray-600 text-[var(--accent-color)] focus:ring-0"/>
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
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;