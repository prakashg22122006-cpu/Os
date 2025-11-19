
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Track, Playlist } from '../../types';
import { addFile } from '../../utils/db';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
    const { currentTrackId, isPlaying, currentTime, volume, isShuffled, currentPlaylistId } = musicPlayerState;
    const currentTrack = useMemo(() => tracks.find(t => t.id === currentTrackId), [tracks, currentTrackId]);
    
    const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const importFileRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (viewMode === 'compact') {
            setVisualizerCanvasRef(canvasRef);
            return () => setVisualizerCanvasRef(null);
        }
    }, [setVisualizerCanvasRef, viewMode]);


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
            const queue = getPlayQueue();
            if (queue.length > 0) playTrack(queue[0]);
            return;
        }
        setMusicPlayerState(p => ({ ...p, isPlaying: !p.isPlaying }));
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setMusicPlayerState(p => ({ ...p, currentTime: newTime }));
    };
    
    const getPlayQueue = () => {
        if (currentPlaylistId) {
            const playlist = playlists.find(p => p.id === currentPlaylistId);
            return playlist ? playlist.trackIds : [];
        } else {
            return tracks.map(t => t.id);
        }
    };

    const handleSkip = (direction: 'next' | 'prev') => {
        const playQueue = getPlayQueue();

        if (playQueue.length === 0) return;
        
        // If current track isn't in queue (e.g. playlist changed), start from 0
        let currentIndex = playQueue.findIndex(id => id === currentTrackId);
        if (currentIndex === -1) currentIndex = 0;
        
        let nextIndex;

        if (isShuffled && direction === 'next') {
            let randomIndex = Math.floor(Math.random() * playQueue.length);
            if (playQueue.length > 1 && randomIndex === currentIndex) {
                randomIndex = (randomIndex + 1) % playQueue.length;
            }
            nextIndex = randomIndex;
        } else {
            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % playQueue.length;
            } else { // 'prev'
                nextIndex = (currentIndex - 1 + playQueue.length) % playQueue.length;
            }
        }
        
        const nextTrackId = playQueue[nextIndex];
        setMusicPlayerState(p => ({ ...p, currentTrackId: nextTrackId, currentTime: 0, isPlaying: true }));
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setMusicPlayerState(p => ({ ...p, volume: newVolume }));
    };
    
    const createPlaylist = () => {
        if(!newPlaylistName.trim()) return;
        const newPlaylist: Playlist = {
            id: Date.now(),
            name: newPlaylistName,
            trackIds: []
        };
        setPlaylists(prev => [...prev, newPlaylist]);
        setNewPlaylistName('');
    };
    
    const deletePlaylist = (id: number) => {
        if(window.confirm("Delete playlist?")) {
             setPlaylists(prev => prev.filter(p => p.id !== id));
             if(currentPlaylistId === id) setMusicPlayerState(p => ({ ...p, currentPlaylistId: null }));
        }
    };

    const addToPlaylist = (trackId: number) => {
        if (!currentPlaylistId) {
            alert("Select a playlist in the 'Playlists' tab first.");
            return;
        }
        setPlaylists(prev => prev.map(p => {
            if (p.id === currentPlaylistId) {
                if (p.trackIds.includes(trackId)) return p;
                return { ...p, trackIds: [...p.trackIds, trackId] };
            }
            return p;
        }));
    };
    
    const removeFromPlaylist = (trackId: number) => {
         if (!currentPlaylistId) return;
         setPlaylists(prev => prev.map(p => {
            if (p.id === currentPlaylistId) {
                return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
            }
            return p;
        }));
    };
    
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    
    const playerControls = (
        <div className={`flex flex-col items-center w-full gap-2 ${viewMode === 'focus' ? '' : 'px-4'}`}>
             <div className="w-full flex justify-end mb-1">
                 <select
                    value={currentPlaylistId || ''}
                    onChange={(e) => {
                         const val = e.target.value;
                         setMusicPlayerState(p => ({ ...p, currentPlaylistId: val ? Number(val) : null }));
                    }}
                    className="bg-transparent text-xs font-medium text-gray-400 hover:text-white border-none outline-none cursor-pointer appearance-none text-right pr-1"
                    aria-label="Select Playlist"
                >
                    <option value="">All Tracks</option>
                    {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div className="text-center">
                <p className="font-bold text-white truncate max-w-xs">{currentTrack?.title || 'No Music Selected'}</p>
                <p className="text-xs text-gray-400">{currentTrack?.artist || (currentTrack ? 'Unknown Artist' : ' ')}</p>
            </div>
            <div className="w-full flex items-center gap-2">
                <span className="text-xs font-mono w-10 text-right">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={currentTrack?.duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={`glowing-progress-bar w-full ${isPlaying ? 'pulsing' : ''}`}
                    disabled={!currentTrack}
                />
                <span className="text-xs font-mono w-10">{formatTime(currentTrack?.duration || 0)}</span>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="glass" className="!p-2 material-press" onClick={() => handleSkip('prev')}>⏮</Button>
                <Button onClick={togglePlayPause} className="!p-3 text-xl material-press min-w-[3rem] flex items-center justify-center">{isPlaying ? '⏸' : '▶'}</Button>
                <Button variant="glass" className="!p-2 material-press" onClick={() => handleSkip('next')}>⏭</Button>
            </div>
             <div className="w-full max-w-[200px] flex items-center gap-2 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    aria-label="Volume"
                />
            </div>
        </div>
    );
    
    if (viewMode === 'focus') {
      return playerControls;
    }

    return (
        <div className="flex flex-col h-full p-4">
            <div className="relative w-full h-40 flex items-center justify-center mb-2">
                <canvas ref={canvasRef} width="160" height="160" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></canvas>
                <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`} style={{width: 100, height: 100}}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500/50" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                    </div>
                </div>
            </div>
            
            {playerControls}
            
            <div className="flex-grow min-h-0 flex flex-col mt-4">
                <div className="flex border-b border-white/10 mb-2">
                   <button onClick={() => setActiveTab('library')} className={`px-3 py-1 text-sm transition-colors ${activeTab === 'library' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Library</button>
                   <button onClick={() => setActiveTab('playlists')} className={`px-3 py-1 text-sm transition-colors ${activeTab === 'playlists' ? 'text-[var(--grad-1)] border-b-2 border-[var(--grad-1)]' : 'text-gray-400'}`}>Playlists</button>
                   <div className="flex-grow" />
                   <Button variant="glass" className="text-xs !py-1 !px-2" onClick={() => importFileRef.current?.click()}>+ Import</Button>
                   <input type="file" ref={importFileRef} onChange={handleFileImport} multiple accept="audio/*" className="hidden" />
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-1">
                    {activeTab === 'library' && (
                        tracks.length > 0 ? tracks.map(track => (
                            <div key={track.id} className="playlist-item-lift flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <div className="overflow-hidden">
                                    <p className={`text-sm font-semibold truncate ${currentTrackId === track.id ? 'text-[var(--grad-1)]' : ''}`}>{track.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                     <span className="text-xs text-gray-400 hidden sm:block">{formatTime(track.duration)}</span>
                                    <Button variant="glass" className="text-xs !p-1.5 material-press" onClick={() => playTrack(track.id)}>▶</Button>
                                    <Button variant="glass" className="text-xs !p-1.5 material-press" title={currentPlaylistId ? `Add to ${currentPlaylist?.name}` : 'Select a playlist to add'} onClick={() => addToPlaylist(track.id)}>+</Button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-gray-400 py-4">Your music library is empty.</p>
                    )}
                     {activeTab === 'playlists' && (
                         <div className="space-y-4">
                             <div className="flex gap-2">
                                 <Input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="New Playlist Name" className="text-xs !p-1" />
                                 <Button onClick={createPlaylist} className="text-xs !p-1">Create</Button>
                            </div>
                            <div className="space-y-1">
                                {playlists.map(p => (
                                     <div key={p.id} className={`flex flex-col p-2 rounded-lg cursor-pointer border ${currentPlaylistId === p.id ? 'border-[var(--grad-1)] bg-[var(--grad-1)]/10' : 'border-transparent bg-white/5'}`} onClick={() => setMusicPlayerState(s => ({...s, currentPlaylistId: p.id}))}>
                                         <div className="flex justify-between items-center">
                                            <span className="font-bold text-sm">{p.name} <span className="text-xs font-normal text-gray-400">({p.trackIds.length} tracks)</span></span>
                                            <Button variant="glass" className="text-xs text-red-400 !p-1" onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}>Del</Button>
                                         </div>
                                         {currentPlaylistId === p.id && (
                                             <div className="mt-2 pl-2 border-l border-white/10 space-y-1">
                                                 {p.trackIds.map(tid => {
                                                     const t = tracks.find(tr => tr.id === tid);
                                                     if(!t) return null;
                                                     return (
                                                         <div key={tid} className="flex justify-between items-center text-xs text-gray-300">
                                                             <span className="truncate">{t.title}</span>
                                                             <button onClick={(e) => { e.stopPropagation(); removeFromPlaylist(tid); }} className="text-red-400 hover:text-red-300">x</button>
                                                         </div>
                                                     )
                                                 })}
                                                 {p.trackIds.length === 0 && <span className="text-xs text-gray-500 italic">Empty. Add tracks from Library tab.</span>}
                                             </div>
                                         )}
                                     </div>
                                ))}
                                {playlists.length === 0 && <p className="text-gray-500 text-xs text-center">No playlists.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicPlayer;
