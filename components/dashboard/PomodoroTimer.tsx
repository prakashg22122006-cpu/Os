import React, { useState, useEffect, useMemo } from 'react';
import Button from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { PomodoroPreset, TimerMode } from '../../types';

interface PomodoroTimerProps {
    setIsFocusMode: (isFocus: boolean) => void;
}

const formatTime = (sec: number): string => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

const CircularProgress: React.FC<{ progress: number; time: string; color: string }> = ({ progress, time, color }) => {
    const size = 150;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100 * circumference);
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 absolute" width={size} height={size}>
                <circle stroke="rgba(255, 255, 255, 0.1)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s linear' }}
                    strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2}
                />
            </svg>
            <div className="absolute font-mono text-3xl" style={{ color }}>{time}</div>
        </div>
    );
};


const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ setIsFocusMode }) => {
    const { pomodoroPresets, activePomodoro, setActivePomodoro } = useAppContext();
    
    const { preset, currentMode, totalDuration } = useMemo(() => {
        const preset = pomodoroPresets.find(p => p.id === activePomodoro.presetId) || pomodoroPresets[0];
        if (!preset) return { preset: null, currentMode: null, totalDuration: 0 };
        
        const modeId = preset.sequence[activePomodoro.sequenceIndex];
        const currentMode = preset.modes.find(m => m.id === modeId);
        const totalDuration = currentMode ? currentMode.duration * 60 : 0;
        
        return { preset, currentMode, totalDuration };
    }, [activePomodoro.presetId, activePomodoro.sequenceIndex, pomodoroPresets]);

    // This effect ensures the timer resets if the preset changes or if it's not running
    useEffect(() => {
        if (!activePomodoro.running && preset) {
            const firstModeId = preset.sequence[0];
            const firstMode = preset.modes.find(m => m.id === firstModeId);
            if (firstMode) {
                setActivePomodoro(p => ({
                    ...p,
                    presetId: preset.id,
                    sequenceIndex: 0,
                    remaining: firstMode.duration * 60,
                }));
            }
        }
    }, [activePomodoro.running, preset, setActivePomodoro]);
    
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPresetId = Number(e.target.value);
        const newPreset = pomodoroPresets.find(p => p.id === newPresetId);
        if (newPreset) {
            const firstModeId = newPreset.sequence[0];
            const firstMode = newPreset.modes.find(m => m.id === firstModeId);
            setActivePomodoro({
                presetId: newPresetId,
                sequenceIndex: 0,
                remaining: firstMode ? firstMode.duration * 60 : 0,
                running: false,
                startTime: null,
                isPaused: false,
            });
        }
    };
    
    const progressPercentage = totalDuration > 0 ? ((totalDuration - activePomodoro.remaining) / totalDuration) * 100 : 0;

    return (
        <div className="flex flex-col h-full items-center justify-between p-4">
            <div>
                <select value={activePomodoro.presetId || ''} onChange={handlePresetChange} className="glass-select">
                    {pomodoroPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <p className="text-center text-lg font-semibold mt-2" style={{ color: currentMode?.color }}>
                    {currentMode?.name || 'Select Preset'}
                </p>
            </div>
            
            <CircularProgress
                progress={progressPercentage}
                time={formatTime(activePomodoro.remaining)}
                color={currentMode?.color || 'var(--grad-1)'}
            />

            <Button variant="gradient" onClick={() => setIsFocusMode(true)} className="w-full !mt-0">
                Start Focus Session
            </Button>
        </div>
    );
};

export default PomodoroTimer;