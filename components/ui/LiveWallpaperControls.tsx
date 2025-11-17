import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';

const LiveWallpaperControls: React.FC = () => {
    const { appSettings, setAppSettings } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const config = appSettings.wallpaper.liveConfig;

    const handleChange = (key: 'particleDensity' | 'particleOpacity', value: number) => {
        setAppSettings(prev => ({
            ...prev,
            wallpaper: {
                ...prev.wallpaper,
                liveConfig: {
                    ...(prev.wallpaper.liveConfig || { particleDensity: 0.5, particleOpacity: 0.5 }),
                    [key]: value
                }
            }
        }));
    };

    if (appSettings.wallpaper.type !== 'live') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[250]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 shadow-lg hover:bg-black/50 transition-colors"
                aria-label="Open live wallpaper controls"
                aria-expanded={isOpen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            </button>
            {isOpen && (
                <div
                    ref={panelRef}
                    className="absolute bottom-16 right-0 w-64 bg-black/50 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/10"
                    role="dialog"
                    aria-label="Live Wallpaper Controls"
                >
                    <h4 className="font-bold text-sm mb-3 text-white">Live Wallpaper</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-300 flex justify-between">
                                <span>Particle Density</span>
                                <span>{Math.round((config?.particleDensity || 0.5) * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={config?.particleDensity || 0.5}
                                onChange={e => handleChange('particleDensity', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                aria-label="Particle Density"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-300 flex justify-between">
                                <span>Particle Opacity</span>
                                <span>{Math.round((config?.particleOpacity || 0.5) * 100)}%</span>
                            </label>
                             <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={config?.particleOpacity || 0.5}
                                onChange={e => handleChange('particleOpacity', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                aria-label="Particle Opacity"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveWallpaperControls;
