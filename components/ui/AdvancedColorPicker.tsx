import React, { useState, useEffect, useRef } from 'react';
import Input from './Input';

// Color conversion helpers
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

function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l_ = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l_ > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l_ * 100) };
}

function hsvToHsl(h: number, s: number, v: number): { h: number, s: number, l: number } {
    s /= 100;
    v /= 100;
    const l = v * (1 - s / 2);
    const newS = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    return { h, s: newS * 100, l: l * 100 };
}

function hslToHsv(h: number, s: number, l: number): { h: number, s: number, v: number } {
    s /= 100;
    l /= 100;
    const v = l + s * Math.min(l, 1 - l);
    const newS = v === 0 ? 0 : 2 * (1 - l / v);
    return { h, s: newS * 100, v: v * 100 };
}


interface AdvancedColorPickerProps {
    hue: number;
    saturation: number;
    lightness: number;
    onChange: (color: { h: number; s: number; l: number }) => void;
}

const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({ hue, saturation, lightness, onChange }) => {
    const [hex, setHex] = useState(() => hslToHex(hue, saturation, lightness));
    const satValRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHex(hslToHex(hue, saturation, lightness));
    }, [hue, saturation, lightness]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setHex(newHex);
        if (/^#?[0-9a-f]{6}$/i.test(newHex)) {
            const newHsl = hexToHsl(newHex);
            if (newHsl) onChange({ h: newHsl.h, s: newHsl.s, l: newHsl.l });
        }
    };

    const handleHslChange = (part: 'h' | 's' | 'l', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;
        const newColor = { h: hue, s: saturation, l: lightness };
        if (part === 'h' && numValue >= 0 && numValue <= 360) newColor.h = numValue;
        if ((part === 's' || part === 'l') && numValue >= 0 && numValue <= 100) newColor[part] = numValue;
        onChange(newColor);
    };
    
    // Generic mouse handler for sliders
    const handleMouseEvent = (
        ref: React.RefObject<HTMLDivElement>,
        callback: (x: number, y: number) => void
    ) => (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        
        const update = (mouseEvent: MouseEvent) => {
            const x = Math.max(0, Math.min(1, (mouseEvent.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (mouseEvent.clientY - rect.top) / rect.height));
            callback(x, y);
        };
        
        update(e.nativeEvent);

        const onMouseUp = () => {
            document.removeEventListener('mousemove', update);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', update);
        document.addEventListener('mouseup', onMouseUp);
    };

    const hsv = hslToHsv(hue, saturation, lightness);

    return (
        <div className="color-picker-wrapper">
            <div className="color-picker-main">
                <div
                    ref={satValRef}
                    className="color-picker-saturation"
                    style={{ background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))` }}
                    onMouseDown={handleMouseEvent(satValRef, (x, y) => {
                        const newHsl = hsvToHsl(hue, x * 100, (1 - y) * 100);
                        onChange({ h: hue, s: newHsl.s, l: newHsl.l });
                    })}
                >
                    <div className="color-picker-saturation-handle" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
                </div>
                <div
                    ref={hueRef}
                    className="color-picker-hue"
                    onMouseDown={handleMouseEvent(hueRef, (_, y) => onChange({ h: Math.round(y * 360), s: saturation, l: lightness }))}
                >
                    <div className="color-picker-hue-handle" style={{ top: `${(hue / 360) * 100}%` }} />
                </div>
            </div>
            <div className="color-picker-inputs">
                <div className="color-picker-preview" style={{ background: `hsl(${hue}, ${saturation}%, ${lightness}%)` }} />
                <div className="w-full flex gap-1">
                    <label className="flex-1"><span>HEX</span><Input value={hex} onChange={handleHexChange} className="!p-1 text-xs" /></label>
                </div>
                <div className="w-full flex gap-1">
                    <label className="flex-1"><span>H</span><Input type="number" value={hue} onChange={(e) => handleHslChange('h', e.target.value)} className="!p-1 text-xs" /></label>
                    <label className="flex-1"><span>S</span><Input type="number" value={Math.round(saturation)} onChange={(e) => handleHslChange('s', e.target.value)} className="!p-1 text-xs" /></label>
                    <label className="flex-1"><span>L</span><Input type="number" value={Math.round(lightness)} onChange={(e) => handleHslChange('l', e.target.value)} className="!p-1 text-xs" /></label>
                </div>
            </div>
        </div>
    );
};

export default AdvancedColorPicker;
