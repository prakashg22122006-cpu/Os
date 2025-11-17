import React, { useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { getFile } from '../utils/db';

const hexToRgb = (hex: string) => {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}


const GlobalAudioPlayer: React.FC = () => {
    const { musicPlayerState, setMusicPlayerState, tracks, playlists, visualizerCanvasRef, appSettings } = useAppContext();
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const currentObjectUrl = useRef<string | null>(null);

    const { currentTrackId, isPlaying, volume, isShuffled, currentPlaylistId } = musicPlayerState;

    // Setup audio context and analyser for visualizer
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !visualizerCanvasRef?.current) return;
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            analyserRef.current.fftSize = 256;
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = visualizerCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const { themeConfig } = appSettings;
        const safeThemeConfig = themeConfig || { accentHue: 211, accentSaturation: 100, accentLightness: 65 };
        const { accentHue, accentSaturation, accentLightness } = safeThemeConfig;
        
        const accentColorHex = hslToHex(accentHue, accentSaturation, accentLightness);
        const accentColorRgb = hexToRgb(accentColorHex);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            if (!ctx || !analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 55;
            const bars = bufferLength * 0.8; 

            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            for (let i = 0; i < bars; i++) {
                const barHeight = Math.pow(dataArray[i] / 255, 2) * 25;
                if (barHeight < 1) continue;
                
                const angle = (i / bars) * 2 * Math.PI;
                
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);

                const opacity = 0.5 + (dataArray[i] / 255) * 0.5;
                if (accentColorRgb) {
                    ctx.strokeStyle = `rgba(${accentColorRgb.r}, ${accentColorRgb.g}, ${accentColorRgb.b}, ${opacity})`;
                } else {
                    ctx.strokeStyle = `rgba(90, 161, 255, ${opacity})`;
                }

                ctx.beginPath();
                ctx.moveTo(radius, 0);
                ctx.lineTo(radius + barHeight, 0);
                ctx.stroke();

                ctx.restore();
            }
        };
        
        draw();

        return () => {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [visualizerCanvasRef, appSettings]);


    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrackId) return;
        
        // Ensure AudioContext is active on user gesture
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const loadTrack = async () => {
            const track = tracks.find(t => t.id === currentTrackId);
            if (!track) return;

            try {
                const fileData = await getFile(track.fileId);
                if (fileData) {
                    if (currentObjectUrl.current) {
                        URL.revokeObjectURL(currentObjectUrl.current);
                    }
                    const url = URL.createObjectURL(fileData.data);
                    currentObjectUrl.current = url;
                    audio.src = url;
                    // The `isPlaying` useEffect will handle playback.
                }
            } catch (error) {
                console.error("Error loading track:", error);
            }
        };

        loadTrack();

        return () => {
            if (currentObjectUrl.current) {
                URL.revokeObjectURL(currentObjectUrl.current);
                currentObjectUrl.current = null;
            }
        }
    }, [currentTrackId, tracks]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio && audio.src) {
            if (isPlaying) {
                audio.play().catch(e => console.error("Audio play failed:", e));
                 if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            } else {
                audio.pause();
            }
        }
    }, [isPlaying, currentTrackId]); // Re-run when track changes too

    const handlePlayNext = useCallback(() => {
        let playQueue: number[] = [];
        if (currentPlaylistId) {
            const playlist = playlists.find(p => p.id === currentPlaylistId);
            playQueue = playlist ? playlist.trackIds : [];
        } else {
            playQueue = tracks.map(t => t.id);
        }

        if (playQueue.length === 0) {
            setMusicPlayerState(p => ({ ...p, isPlaying: false, currentTrackId: null, currentTime: 0 }));
            return;
        }
        
        let currentIndex = playQueue.findIndex(id => id === currentTrackId);
        let nextIndex;

        if (isShuffled) {
            nextIndex = Math.floor(Math.random() * playQueue.length);
        } else {
            nextIndex = (currentIndex + 1) % playQueue.length;
        }
        
        const nextTrackId = playQueue[nextIndex];
        setMusicPlayerState(p => ({ ...p, currentTrackId: nextTrackId, currentTime: 0 }));

    }, [tracks, playlists, currentTrackId, currentPlaylistId, isShuffled, setMusicPlayerState]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setMusicPlayerState(p => ({ ...p, currentTime: audioRef.current!.currentTime }));
        }
    };

    return <audio ref={audioRef} onEnded={handlePlayNext} onTimeUpdate={handleTimeUpdate} crossOrigin="anonymous" />;
};

export default GlobalAudioPlayer;