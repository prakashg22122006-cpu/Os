
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PomodoroLog, Task, PomodoroPreset, TimerMode } from '../../types';
import MusicPlayer from './MusicPlayer';

// --- Sound Effects ---
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) { console.error("Web Audio API not supported"); }
    }
    return audioContext;
};

const playSound = (type: 'start' | 'pause' | 'complete') => {
    const context = getAudioContext(); if (!context) return;
    try {
        const o = context.createOscillator(); const g = context.createGain();
        o.connect(g); g.connect(context.destination); g.gain.setValueAtTime(0, context.currentTime);
        g.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
        if (type === 'start') o.frequency.setValueAtTime(523.25, context.currentTime);
        else if (type === 'pause') o.frequency.setValueAtTime(261.63, context.currentTime);
        else o.frequency.setValueAtTime(659.25, context.currentTime);
        o.start(context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
        o.stop(context.currentTime + 0.3);
    } catch (e) { console.error("Error playing sound: ", e); }
};

// --- Child Components ---

const formatTime = (sec: number): string => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

const CircularProgress: React.FC<{ progress: number; time: string; running: boolean; color: string }> = ({ progress, time, running, color }) => {
    const size = 300; const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2; const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100 * circumference);
    return (<div className={`relative flex items-center justify-center`} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 absolute" width={size} height={size}>
                <circle stroke="rgba(255, 255, 255, 0.1)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
                <circle stroke={color} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" r={radius} cx={size/2} cy={size/2} />
            </svg>
            <div className={`absolute font-mono text-6xl ${running ? 'pulsate' : ''}`} style={{ color }}>{time}</div>
        </div>);
};

const FeedbackModal: React.FC<{ onSave: (log: Partial<PomodoroLog> & { taskCompleted?: boolean }) => void; hasLinkedTask: boolean; }> = ({ onSave, hasLinkedTask }) => {
    const [focus, setFocus] = useState(3);
    const [energy, setEnergy] = useState(3);
    const [notes, setNotes] = useState('');
    const [taskCompleted, setTaskCompleted] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] p-6 rounded-xl shadow-2xl w-full max-w-md animate-zoomIn">
                <h3 className="font-bold text-xl mb-4">Session Complete!</h3>
                <div className="space-y-4">
                    {hasLinkedTask && (
                        <label className="flex items-center gap-3 bg-black/20 p-3 rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
                            <input type="checkbox" checked={taskCompleted} onChange={e => setTaskCompleted(e.target.checked)} className="w-5 h-5 accent-[var(--grad-1)]" />
                            <span>Mark task as completed?</span>
                        </label>
                    )}
                    <div>
                        <label className="text-sm text-gray-400">Focus Level</label>
                        <div className="flex justify-between mt-1">
                            {[1, 2, 3, 4, 5].map(v => <button key={v} onClick={() => setFocus(v)} className={`w-8 h-8 rounded-full transition-all ${focus === v ? 'bg-[var(--grad-1)] text-white scale-110' : 'bg-white/10 hover:bg-white/20'}`}>{v}</button>)}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Energy Level</label>
                        <div className="flex justify-between mt-1">
                            {[1, 2, 3, 4, 5].map(v => <button key={v} onClick={() => setEnergy(v)} className={`w-8 h-8 rounded-full transition-all ${energy === v ? 'bg-[var(--grad-3)] text-white scale-110' : 'bg-white/10 hover:bg-white/20'}`}>{v}</button>)}
                        </div>
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes (optional)..." className="glass-textarea w-full h-20" />
                    <Button onClick={() => onSave({ focusRating: focus, energyRating: energy, notes, taskCompleted })} className="w-full">Save & Close</Button>
                </div>
            </div>
        </div>
    );
};

interface FocusViewProps {
    exitFocusMode: () => void;
}

interface Particle {
    id: number;
    left: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

const FocusView: React.FC<FocusViewProps> = ({ exitFocusMode }) => {
    const { activePomodoro, setActivePomodoro, pomodoroPresets, viewingTask, setPomodoroLogs, setTasks } = useAppContext();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [completedLogId, setCompletedLogId] = useState<number | null>(null);
    const [zenParticles, setZenParticles] = useState<Particle[]>([]);

    const preset = useMemo(() => pomodoroPresets.find(p => p.id === activePomodoro.presetId) || pomodoroPresets[0], [pomodoroPresets, activePomodoro.presetId]);
    const currentMode = useMemo(() => preset?.modes.find(m => m.id === preset.sequence[activePomodoro.sequenceIndex]) || preset?.modes[0], [preset, activePomodoro.sequenceIndex]);
    const totalDuration = currentMode ? currentMode.duration * 60 : 25 * 60;

    // Initialize enhanced particles
    useEffect(() => {
        const particles = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100, // 0-100% width
            size: Math.random() * 4 + 1, // 1-5px size
            duration: 15 + Math.random() * 25, // 15-40s duration
            delay: Math.random() * -30, // Start randomly in cycle
            opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 opacity
        }));
        setZenParticles(particles);
    }, []);

    useEffect(() => {
        let interval: number | null = null;
        if (activePomodoro.running && activePomodoro.remaining > 0) {
            interval = window.setInterval(() => {
                setActivePomodoro(prev => {
                    if (prev.remaining <= 1) {
                        // Timer Finished
                        if (interval) clearInterval(interval);
                        handleComplete(true); // true = finished naturally
                        return { ...prev, remaining: 0, running: false, isPaused: false };
                    }
                    return { ...prev, remaining: prev.remaining - 1 };
                });
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [activePomodoro.running]);

    const toggleTimer = () => {
        if (activePomodoro.running) {
            // Pause
            playSound('pause');
            setActivePomodoro(prev => ({ ...prev, running: false, isPaused: true }));
        } else {
            // Start / Resume
            playSound('start');
            setActivePomodoro(prev => ({ 
                ...prev, 
                running: true, 
                isPaused: false,
                startTime: prev.startTime || Date.now() // Set start time if not set
            }));
        }
    };

    const handleComplete = (finishedNaturally: boolean) => {
        playSound(finishedNaturally ? 'complete' : 'pause');
        
        const endTime = Date.now();
        const startTime = activePomodoro.startTime || (endTime - (activePomodoro.remaining * 1000)); // Fallback if null
        
        // Calculate actual duration spent in minutes
        const spentSeconds = totalDuration - activePomodoro.remaining;
        const spentMinutes = Math.max(0.1, spentSeconds / 60);

        // Automatic Logging
        const newLog: PomodoroLog = {
            ts: startTime,
            startTime: startTime,
            endTime: endTime,
            duration: parseFloat(spentMinutes.toFixed(2)),
            modeName: currentMode?.name || 'Focus',
            presetName: preset?.name || 'Default',
            completed: finishedNaturally,
            linkedTaskId: viewingTask?.id,
        };

        setPomodoroLogs(prev => [newLog, ...prev]);
        setCompletedLogId(newLog.ts);

        if (finishedNaturally) {
            setIsFeedbackOpen(true);
        }
    };

    const handleStop = () => {
        if (activePomodoro.running || activePomodoro.remaining !== totalDuration) {
            if (window.confirm("Stop session? Progress will be logged.")) {
                handleComplete(false); // Log partial
                resetTimer();
                exitFocusMode();
            }
        } else {
            exitFocusMode();
        }
    };

    const resetTimer = () => {
        setActivePomodoro(prev => ({ ...prev, remaining: totalDuration, running: false, startTime: null, isPaused: false }));
    };

    const handleFeedbackSave = (data: Partial<PomodoroLog> & { taskCompleted?: boolean }) => {
        if (completedLogId) {
            setPomodoroLogs(prev => prev.map(log => log.ts === completedLogId ? { ...log, ...data } : log));
        }
        if (data.taskCompleted && viewingTask) {
            setTasks(prev => prev.map(t => t.id === viewingTask.id ? { ...t, status: 'Done' } : t));
        }
        setIsFeedbackOpen(false);
        
        // Advance sequence
        const nextIndex = (activePomodoro.sequenceIndex + 1) % preset.sequence.length;
        const nextModeId = preset.sequence[nextIndex];
        const nextMode = preset.modes.find(m => m.id === nextModeId);
        
        setActivePomodoro({
            presetId: preset.id,
            sequenceIndex: nextIndex,
            remaining: nextMode ? nextMode.duration * 60 : 25 * 60,
            running: false,
            startTime: null,
            isPaused: false
        });
    };
    
    // Dynamic Background Calculation
    const modeColor = currentMode?.color || 'var(--grad-1)';
    const pulseSpeed = activePomodoro.remaining < 60 ? '1.5s' : activePomodoro.remaining < 300 ? '3s' : '6s';
    
    return (
        <div className="zen-chamber-overlay flex flex-col items-center justify-center overflow-hidden relative">
            {/* Dynamic Breathing Background */}
            <div 
                className="absolute inset-0 z-0 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${modeColor}20 0%, transparent 70%)`,
                    animation: activePomodoro.running ? `breathing-bg ${pulseSpeed} infinite ease-in-out` : 'none',
                    opacity: activePomodoro.running ? 0.8 : 0.4
                }}
            />
            
             {/* Enhanced Particles */}
            <div className="zen-particle-container pointer-events-none z-0">
                {zenParticles.map(p => (
                    <div 
                        key={p.id} 
                        className="absolute rounded-full bg-white" 
                        style={{ 
                            left: `${p.left}%`, 
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            opacity: p.opacity,
                            boxShadow: `0 0 ${p.size * 2}px ${modeColor}`,
                            animation: `float-up ${p.duration}s linear infinite`,
                            animationDelay: `${p.delay}s`
                        }} 
                    />
                ))}
            </div>
            
            {/* Custom Animations for this component */}
            <style>{`
                @keyframes breathing-bg {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
                @keyframes float-up {
                    0% { transform: translateY(110vh) translateX(0); opacity: 0; }
                    10% { opacity: var(--p-opacity, 0.5); }
                    90% { opacity: var(--p-opacity, 0.5); }
                    100% { transform: translateY(-10vh) translateX(20px); opacity: 0; }
                }
            `}</style>

            <div className="zen-content-wrapper">
                 {viewingTask && (
                    <div className="mb-8 p-4 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md text-center animate-fade-in-up shadow-lg w-full max-w-md">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Working on</span>
                        <h2 className="text-2xl font-bold text-white mt-1 tracking-tight">{viewingTask.title}</h2>
                    </div>
                )}

                <div className="mb-12 relative group cursor-pointer transition-transform duration-300 hover:scale-105" onClick={toggleTimer}>
                    <div className="absolute inset-0 rounded-full bg-black/30 blur-2xl transform scale-90"></div>
                    <CircularProgress 
                        progress={((totalDuration - activePomodoro.remaining) / totalDuration) * 100} 
                        time={formatTime(activePomodoro.remaining)} 
                        running={activePomodoro.running} 
                        color={modeColor} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 rounded-full backdrop-blur-sm">
                         <span className="text-6xl text-white drop-shadow-lg">{activePomodoro.running ? '⏸' : '▶'}</span>
                    </div>
                </div>

                <div className="flex gap-6">
                    <Button onClick={toggleTimer} className="px-8 py-3 text-lg min-w-[140px] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                        {activePomodoro.running ? 'Pause' : activePomodoro.remaining !== totalDuration ? 'Resume' : 'Start'}
                    </Button>
                    <Button variant="outline" onClick={handleStop} className="px-8 py-3 text-lg border-white/20 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200">
                        Stop
                    </Button>
                </div>

                 <div className="mt-12 w-full bg-black/30 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
                    <MusicPlayer viewMode="focus" />
                </div>
            </div>

            {isFeedbackOpen && <FeedbackModal onSave={handleFeedbackSave} hasLinkedTask={!!viewingTask} />}
        </div>
    );
};

export default FocusView;
