
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Track, Playlist } from '../../types';
import { addFile } from '../../utils/db';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
    <h3 className="m-0 mb-2 text-sm font-bold text-[#cfe8ff]">
        {title} {subtitle && <small className="text-[#9fb3cf] font-normal ml-1">{subtitle}</small>}
    </h3>
);

const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
        };
        audio.onerror = () => reject("Error loading audio file.");
        audio.src = window.URL.createObjectURL(file);
    });
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60).toString().padStart(2, '0');
    const sec = (floorSeconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
};

interface MusicPlayerProps {
    viewMode?: 'compact' | 'focus';
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ viewMode = 'compact' }) => {
    const { tracks, setTracks, playlists, setPlaylists, musicPlayerState, setMusicPlayerState, setVisualizerCanvasRef } = useAppContext();
    const { currentTrackId, isPlaying, currentTime, volume } = musicPlayerState;
    const currentTrack = useMemo(() => tracks.find(t => t.id === currentTrackId), [tracks, currentTrackId]);
    
    const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
    const importFileRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setVisualizerCanvasRef(canvasRef);
        return () => setVisualizerCanvasRef(null);
    }, [setVisualizerCanvasRef]);


    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        for (const file of files) {
            try {
                const duration = await getAudioDuration(file);
                const fileId = await addFile(file);
                const newTrack: Track = {
                    id: Date.now() + Math.random(),
                    fileId,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Unknown Artist',
                    duration,
                };
                setTracks(prev => [...prev, newTrack]);
            } catch (error) {
                console.error('Failed to import track:', error);
                alert(`Could not import ${file.name}.`);
            }
        }
        if (importFileRef.current) importFileRef.current.value = "";
    };

    const playTrack = (trackId: number) => {
        setMusicPlayerState(p => ({ ...p, currentTrackId: trackId, isPlaying: true, currentTime: 0 }));
    };

    const togglePlayPause = () => {
        if (!currentTrackId) {
            if (tracks.length > 0) playTrack(tracks[0].id);
            return;
        }
        setMusicPlayerState(p => ({ ...p, isPlaying: !p.isPlaying }));
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setMusicPlayerState(p => ({ ...p, currentTime: newTime }));
        // Note: The actual seeking is handled by the GlobalAudioPlayer's effect
    };
    
    const playerControls = (
        <div className="flex flex-col items-center w-full gap-2 px-4">
            <div className="text-center">
                <p className="font-bold text-white truncate max-w-xs">{currentTrack?.title || 'No Music Selected'}</p>
                <p className="text-xs text-[#9fb3cf]">{currentTrack?.artist || ' '}</p>
            </div>
            <div className="w-full flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={currentTrack?.duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={`glowing-progress-bar w-full ${isPlaying ? 'pulsing' : ''}`}
                    disabled={!currentTrack}
                />
                <span className="text-xs font-mono">{formatTime(currentTrack?.duration || 0)}</span>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="outline" className="!p-2 material-press">⏮</Button>
                <Button onClick={togglePlayPause} className="!p-3 text-xl material-press">{isPlaying ? '⏸' : '▶'}</Button>
                <Button variant="outline" className="!p-2 material-press">⏭</Button>
            </div>
        </div>
    );
    
    if (viewMode === 'focus') {
      return playerControls;
    }

    return (
        <div className="flex flex-col h-full">
            <CardHeader title="Reactive Audio Console" />
            <div className="relative w-full h-40 flex items-center justify-center mb-2">
                <canvas ref={canvasRef} width="160" height="160" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></canvas>
                <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`} style={{width: 100, height: 100}}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    </div>
                </div>
            </div>
            
            {playerControls}
            
            <div className="flex-grow min-h-0 flex flex-col mt-4">
                <div className="flex border-b border-white/10 mb-2">
                   <button onClick={() => setActiveTab('library')} className={`px-3 py-1 text-sm ${activeTab==='library' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Library</button>
                   <button onClick={() => setActiveTab('playlists')} className={`px-3 py-1 text-sm ${activeTab==='playlists' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Playlists</button>
                   <div className="flex-grow" />
                   <Button variant="outline" className="text-xs !py-1 !px-2" onClick={() => importFileRef.current?.click()}>+ Import</Button>
                   <input type="file" ref={importFileRef} onChange={handleFileImport} multiple accept="audio/*" className="hidden" />
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-1">
                    {activeTab === 'library' && (
                        tracks.length > 0 ? tracks.map(track => (
                            <div key={track.id} className="playlist-item-lift flex items-center justify-between p-2 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold">{track.title}</p>
                                    <p className="text-xs text-gray-400">{track.artist}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-gray-400">{formatTime(track.duration)}</span>
                                    <Button variant="outline" className="text-xs !p-1.5 material-press" onClick={() => playTrack(track.id)}>▶</Button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-gray-400 py-4">Your music library is empty.</p>
                    )}
                     {activeTab === 'playlists' && (
                         <p className="text-sm text-center text-gray-400 py-4">Playlist feature coming soon.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicPlayer;
