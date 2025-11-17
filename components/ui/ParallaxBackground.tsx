import React, { useState, useEffect } from 'react';

const ParallaxBackground: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            setPosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            <div
                className="absolute -inset-16 bg-gradient-to-b from-[var(--bg-gradient-start-ambient)] to-[var(--bg-gradient-end-ambient)] transition-colors duration-1000 ease-in-out"
                style={{ transform: `translate(${position.x * 10}px, ${position.y * 10}px) scale(1.2)` }}
            />
            <div
                className="absolute -inset-32 bg-[radial-gradient(ellipse_at_center,_var(--accent-color)_0%,_transparent_60%)] opacity-10 blur-3xl transition-transform duration-500 ease-out"
                style={{ transform: `translate(${position.x * -30}px, ${position.y * -30}px)` }}
            />
             <div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_var(--accent-color)_0%,_transparent_70%)] opacity-5 blur-3xl transition-transform duration-500 ease-out"
                style={{ transform: `translate(${position.x * -20}px, ${position.y * 30}px)` }}
            />
             <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_#fff_0%,_transparent_80%)] opacity-5 blur-3xl transition-transform duration-500 ease-out"
                style={{ transform: `translate(${position.x * 20}px, ${position.y * -10}px)` }}
            />
        </div>
    );
};

export default ParallaxBackground;
