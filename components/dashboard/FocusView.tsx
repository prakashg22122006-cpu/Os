import React, { useEffect, useState, useRef } from 'react';
import PomodoroTimer from './PomodoroTimer';
import MusicPlayer from './MusicPlayer';
import Button from '../ui/Button';

interface FocusViewProps {
  exitFocusMode: () => void;
}

const FocusView: React.FC<FocusViewProps> = ({ exitFocusMode }) => {
    const [isExiting, setIsExiting] = useState(false);
    const particleContainerRef = useRef<HTMLDivElement>(null);

    const handleExit = () => {
        setIsExiting(true);
        setTimeout(exitFocusMode, 500); // Match animation duration
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleExit();
            }
        };

        const generateParticles = () => {
            const container = particleContainerRef.current;
            if (!container) return;
            // Clear existing particles if any
            container.innerHTML = '';
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'zen-particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 20}s`;
                particle.style.animationDuration = `${Math.random() * 10 + 15}s`;
                const size = `${Math.random() * 2 + 1}px`;
                particle.style.width = size;
                particle.style.height = size;
                container.appendChild(particle);
            }
        };

        generateParticles();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className={`zen-chamber-overlay ${isExiting ? 'exiting' : ''}`}>
            <div ref={particleContainerRef} className="zen-particle-container"></div>
            <div className="zen-content">
                <div className="zen-timer-container">
                    <PomodoroTimer viewMode="focus" size={300} />
                </div>
                <div className="w-full max-w-md mt-8">
                  <MusicPlayer viewMode="focus" />
                </div>
                <Button variant="outline" onClick={handleExit} className="mt-8 !bg-transparent hover:!bg-white/10">
                    Exit Zen Chamber (Esc)
                </Button>
            </div>
        </div>
    );
};

export default FocusView;