
import React, { useEffect, useState, useRef } from 'react';
import { WallpaperConfig } from '../../types';
import { getFile } from '../../utils/db';

interface CustomWallpaperProps {
    wallpaper: WallpaperConfig;
}

const ImageWallpaper: React.FC<{ imageId: number }> = ({ imageId }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        const fetchImage = async () => {
            const fileData = await getFile(imageId);
            if (fileData) {
                objectUrl = URL.createObjectURL(fileData.data);
                setImageUrl(objectUrl);
            }
        };

        fetchImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId]);

    return (
        <div 
            className="custom-wallpaper-image"
            style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }}
        />
    );
};

const LiveWallpaper: React.FC<{ config?: WallpaperConfig['liveConfig'] }> = ({ config }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [backgroundImage, setBackgroundImage] = useState<ImageBitmap | null>(null);

    useEffect(() => {
        if (config?.liveImageId) {
            getFile(config.liveImageId).then(fileData => {
                if (fileData) {
                    createImageBitmap(fileData.data).then(setBackgroundImage);
                } else {
                    setBackgroundImage(null);
                }
            });
        } else {
            setBackgroundImage(null);
        }
    }, [config?.liveImageId]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        
        const density = config?.particleDensity ?? 0.5;
        const opacity = config?.particleOpacity ?? 0.5;

        const particleCount = 10 + Math.floor(density * 140); // Map 0-1 to 10-150 particles

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: Math.random() * 0.5 - 0.25,
                    vy: Math.random() * 0.5 - 0.25,
                    radius: Math.random() * 2 + 1,
                });
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (backgroundImage) {
                const canvasAspect = canvas.width / canvas.height;
                const imageAspect = backgroundImage.width / backgroundImage.height;
                let sx = 0, sy = 0, sWidth = backgroundImage.width, sHeight = backgroundImage.height;

                if (canvasAspect > imageAspect) {
                    sHeight = backgroundImage.width / canvasAspect;
                    sy = (backgroundImage.height - sHeight) / 2;
                } else {
                    sWidth = backgroundImage.height * canvasAspect;
                    sx = (backgroundImage.width - sWidth) / 2;
                }
                ctx.drawImage(backgroundImage, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [config?.particleDensity, config?.particleOpacity, backgroundImage]);

    return <canvas ref={canvasRef} className="custom-wallpaper-live" />;
};


const CustomWallpaper: React.FC<CustomWallpaperProps> = ({ wallpaper }) => {
    if (wallpaper.type === 'image' && wallpaper.imageId) {
        return <ImageWallpaper imageId={wallpaper.imageId} />;
    }
    if (wallpaper.type === 'live') {
        return <LiveWallpaper config={wallpaper.liveConfig} />;
    }
    return null;
};

export default CustomWallpaper;
