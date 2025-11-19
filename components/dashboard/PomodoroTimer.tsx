
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppContext } from '../../context/AppContext';
import { PomodoroLog } from '../../types';

type PomodoroMode = 'work' | 'break' | 'deep';

interface PomodoroState {
  mode: PomodoroMode;
  remaining: number;
  running: boolean;
}

let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.");
    }
  }
  return audioContext;
};

const playSound = (type: 'start' | 'pause' | 'complete') => {
    const context = getAudioContext();
    if (!context) return;
    try {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
        if (type === 'start') {
            oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
        } else if (type === 'pause') {
            oscillator.frequency.setValueAtTime(261.63, context.currentTime); // C4
        } else {
            oscillator.frequency.setValueAtTime(659.25, context.currentTime); // E5
        }
        oscillator.start(context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
        oscillator.stop(context.currentTime + 0.3);
    } catch (e) { console.error("Error playing sound: ", e); }
};

const downloadJSON = (obj: any, name='export.json') => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
};

const CardHeader: React.FC<{ title: string, subtitle?: string }> = ({title, subtitle}) => ( <h3 className="m-0 mb-2 text-sm font-bold text-[var(--text-color-accent)]">{title} {subtitle && <small className="text-[var(--text-color-dim)] font-normal ml-1">{subtitle}</small>}</h3>);
const CircularProgress: React.FC<{ progress: number; time: string; size: number; strokeWidth: number; running?: boolean; children?: React.ReactNode }> = ({ progress, time, size, strokeWidth, running, children }) => {
    const dynamicAccentColor = 'var(--accent-color)';
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100 * circumference);
    return (<div className={`relative flex items-center justify-center`} style={{ width: size, height: size }}>
            {children}
            <svg className="transform -rotate-90" width={size} height={size} style={{ position: 'absolute' }}><defs><linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={dynamicAccentColor} /><stop offset="100%" stopColor={dynamicAccentColor} stopOpacity={0.7}/></linearGradient></defs><circle stroke="rgba(255, 255, 255, 0.1)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} /><circle stroke="url(#progressGradient)" fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }} strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2} /></svg>
            <div className={`absolute font-mono ${running ? 'pulsate' : ''}`} style={{ color: dynamicAccentColor, fontSize: Math.max(20, size / 6) }}>{time}</div>
        </div>);
};

const LogSessionModal: React.FC<{ sessionStats: { focusTime: number; breakTime: number; cycles: number }; onClose: () => void; onSave: (notes: string) => void; }> = ({ sessionStats, onClose, onSave }) => {
    const [notes, setNotes] = useState('');
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#0e1a32] to-[#0a1524] border border-[var(--accent-color)]/20 rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-white/10"><h4 className="font-semibold text-lg">Log Pomodoro Session</h4></header>
                <main className="p-4 space-y-3">
                    <div className="flex justify-around text-center">
                        <div><p className="text-sm text-gray-400">Focus Time</p><p className="text-2xl font-bold">{sessionStats.focusTime} min</p></div>
                        <div><p className="text-sm text-gray-400">Break Time</p><p className="text-2xl font-bold">{sessionStats.breakTime} min</p></div>
                        <div><p className="text-sm text-gray-400">Cycles</p><p className="text-2xl font-bold">{sessionStats.cycles}</p></div>
                    </div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Session notes..." className="bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] p-2 rounded-lg w-full box-border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]" />
                </main>
                <footer className="p-3 flex gap-2 justify-end border-t border-white/10">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(notes)}>Save Log</Button>
                </footer>
            </div>
        </div>
    );
};

interface PomodoroTimerProps { 
    viewMode?: 'compact' | 'focus'; 
    size?: number; 
    onRunningStateChange?: (isRunning: boolean) => void; 
    setIsFocusMode: (val: boolean) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ viewMode = 'compact', size, onRunningStateChange, setIsFocusMode }) => {
  const { pomodoroLogs, setPomodoroLogs, appSettings, setAppSettings, setEngagementLogs } = useAppContext();
  const [variant, setVariant] = useState<'classic' | '52/17' | '90-deep'>('classic');

  const durations = useMemo(() => {
      if (variant === '52/17') return { work: 52, break: 17, deep: 52 };
      if (variant === '90-deep') return { work: 90, break: 20, deep: 90 };
      return appSettings.defaults.pomodoro;
  }, [variant, appSettings.defaults.pomodoro]);
  
  const [pom, setPom] = useLocalStorage<PomodoroState>('pom', { mode: 'work', remaining: durations.work * 60, running: false });
  const [sessionStats, setSessionStats] = useState({ focusTime: 0, breakTime: 0, cycles: 0 });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [particles, setParticles] = useState<any[]>([]);
  const lastMinute = useRef(Math.floor(pom.remaining / 60));

  const formatTime = (sec: number): string => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  // Reset logic when variant changes
  useEffect(() => {
      if (!pom.running) {
          setPom(p => ({ ...p, remaining: durations[p.mode] * 60 }));
      }
  }, [variant, durations, setPom, pom.mode, pom.running]);

  useEffect(() => {
    onRunningStateChange?.(pom.running);
    if (!pom.running) return;

    const timer = setInterval(() => {
      setPom(p => {
        if (p.remaining > 0) {
          const currentMinute = Math.floor((p.remaining - 1) / 60);
          if (currentMinute < lastMinute.current) {
            setRippleKey(k => k + 1); 
            lastMinute.current = currentMinute;
          }

          if (Math.random() > 0.7) {
              const newParticle = {
                id: Math.random(),
                x: 50 + Math.sin(p.remaining) * (Math.random() * 50 + 40),
                y: 50 + Math.cos(p.remaining) * (Math.random() * 50 + 40),
                size: Math.random() * 3 + 1,
                tx: `${Math.random() * 40 - 20}px`,
                ty: `${Math.random() * 40 - 20}px`,
              };
              setParticles(current => [...current.slice(-10), newParticle]);
          }

          return { ...p, remaining: p.remaining - 1 };
        }
        clearInterval(timer);
        playSound('complete');
        
        setSessionStats(s => {
            if (p.mode === 'work' || p.mode === 'deep') {
                return { ...s, focusTime: s.focusTime + durations[p.mode] };
            }
            return { ...s, breakTime: s.breakTime + durations.break, cycles: s.cycles + 1 };
        });

        alert('Session finished!');
        
        const nextMode = (p.mode === 'work' || p.mode === 'deep') ? 'break' : 'work';
        return { running: false, mode: nextMode, remaining: durations[nextMode] * 60 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pom.running, setPom, durations, onRunningStateChange]);

  const setMode = (mode: PomodoroMode) => {
    setPom({ running: false, mode, remaining: durations[mode] * 60 });
    lastMinute.current = durations[mode];
  };
  const handleStart = () => { 
      setPom(p => ({ ...p, running: true })); 
      playSound('start');
      lastMinute.current = Math.floor(pom.remaining / 60);
      if (variant === '90-deep' && viewMode !== 'focus') {
          setIsFocusMode(true);
      }
  };
  const handlePause = () => { setPom(p => ({ ...p, running: false })); playSound('pause'); };
  const handleReset = () => { setMode(pom.mode); };

  const handleSaveLog = (notes: string) => {
    const newLog: PomodoroLog = { ts: Date.now(), ...sessionStats, notes, variant };
    setPomodoroLogs(prev => [newLog, ...prev]);
    
    setEngagementLogs(prev => [...prev, {
        ts: Date.now(),
        activity: 'save_study_session',
        details: { name: `Pomodoro (${variant}): ${sessionStats.focusTime} min` }
    }]);

    setSessionStats({ focusTime: 0, breakTime: 0, cycles: 0 });
    setIsLogModalOpen(false);
    alert('Session logged successfully!');
  };

  const importLogs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) {
                setPomodoroLogs(data);
                alert('Pomodoro logs imported!');
            }
        } catch (error) { alert('Error parsing file'); }
        if (importFileRef.current) importFileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const progressPercentage = useMemo(() => {
    const total = durations[pom.mode] * 60;
    return total <= 0 ? 0 : ((total - pom.remaining) / total) * 100;
  }, [pom.mode, pom.remaining, durations]);
  
  const modes: { key: PomodoroMode, label: string }[] = [{ key: 'work', label: 'Work' }, { key: 'break', label: 'Break' }];

  const timerUI = (isLarge: boolean) => (
    <div className="flex flex-col items-center gap-4 p-2 w-full">
        {!pom.running && (
            <div className="flex gap-2 mb-2">
                <select 
                    value={variant} 
                    onChange={e => setVariant(e.target.value as any)} 
                    className="bg-black/30 border border-white/10 rounded text-xs p-1"
                >
                    <option value="classic">Classic (25/5)</option>
                    <option value="52/17">52/17 Flow</option>
                    <option value="90-deep">90m Deep Work</option>
                </select>
            </div>
        )}
        <div className="flex gap-2 mb-2">
            {modes.map(({key, label}) => <Button key={key} variant="outline" className={pom.mode === key ? 'bg-[rgba(255,255,255,0.2)] text-white border-white/30' : ''} onClick={() => setMode(key)}>{label}</Button>)}
        </div>
        <CircularProgress progress={progressPercentage} time={formatTime(pom.remaining)} size={size || (isLarge ? 300 : 150)} strokeWidth={isLarge ? 16 : 10} running={pom.running}>
            {pom.running && <div key={rippleKey} className="ripple-halo" />}
            {particles.map(p => (
                <div key={p.id} className="particle" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, '--tx': p.tx, '--ty': p.ty } as React.CSSProperties}/>
            ))}
        </CircularProgress>
        <div className="flex gap-2 mt-2">
            <Button onClick={pom.running ? handlePause : handleStart} className="px-5 py-2">{pom.running ? 'Pause' : 'Start'}</Button>
            <Button variant="outline" onClick={handleReset} className="px-5 py-2">Reset</Button>
        </div>
    </div>
  );

  if (viewMode === 'focus') return timerUI(true);

  return (
    <div className="flex flex-col h-full">
        <CardHeader title="Pomodoro Timer" subtitle={variant === '90-deep' ? "Deep Work Mode" : "Focus & Flow"} />
        <div className="flex-grow flex flex-col items-center justify-center">
            {timerUI(false)}
        </div>
        <div className="w-full mt-auto pt-4 border-t border-[var(--input-border-color)]">
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsLogModalOpen(true)} disabled={pom.running || sessionStats.focusTime === 0}>Log Session</Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowHistory(s => !s)}>{showHistory ? 'Hide' : 'Show'} History</Button>
            </div>
            {showHistory && (
                <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Session History</h4>
                    <div className="space-y-2 max-h-24 overflow-y-auto pr-2">
                        {pomodoroLogs.length === 0 ? <p className="text-xs text-gray-400">No logs yet.</p> : pomodoroLogs.map(log => (
                            <div key={log.ts} className="text-xs p-1 bg-white/5 rounded">
                                <span>{new Date(log.ts).toLocaleDateString()}: {log.focusTime}min ({log.variant || 'classic'})</span>
                                {log.notes && <p className="text-gray-400 italic">"{log.notes}"</p>}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Button variant="outline" className="text-xs" onClick={() => downloadJSON(pomodoroLogs, 'pomodoro-logs.json')}>Export</Button>
                        <Button variant="outline" className="text-xs" onClick={() => importFileRef.current?.click()}>Import</Button>
                        <input type="file" ref={importFileRef} onChange={importLogs} className="hidden" accept="application/json" />
                    </div>
                </div>
            )}
        </div>
        {isLogModalOpen && <LogSessionModal sessionStats={sessionStats} onClose={() => setIsLogModalOpen(false)} onSave={handleSaveLog} />}
    </div>
  );
};

export default PomodoroTimer;
