
import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import FileViewerModal from './components/ui/FileViewerModal';
import TaskViewerModal from './components/ui/TaskViewerModal';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import ScheduleEditorModal from './components/ui/ScheduleEditorModal';
import CommandPalette from './components/ui/CommandPalette';
import QuickCreateModal from './components/ui/QuickCreateModal';
import FocusView from './components/dashboard/FocusView';
import CustomWallpaper from './components/ui/CustomWallpaper';
import LiveWallpaperControls from './components/ui/LiveWallpaperControls';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

const AppContent: React.FC<{
    isFocusMode: boolean;
    setIsFocusMode: (isFocus: boolean) => void;
}> = ({ isFocusMode, setIsFocusMode }) => {
  const { viewingFile, viewingTask, viewingScheduleItem, appSettings } = useAppContext();
  
  return (
    <div className="min-h-screen relative">
        <CustomWallpaper wallpaper={appSettings.wallpaper} />
        <LiveWallpaperControls />
        <Header />
        <main className={`transition-all duration-500 ease-in-out ${isFocusMode ? 'scale-95 blur-sm brightness-50 pointer-events-none' : 'scale-100 blur-0 brightness-100'}`}>
            <div className="view-container space-y-6 pb-20 px-1 md:px-8 lg:px-12 pt-2 md:pt-4 h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] overflow-hidden">
                <DashboardView setIsFocusMode={setIsFocusMode} />
            </div>
        </main>
        {viewingFile && <FileViewerModal />}
        {viewingTask && <TaskViewerModal />}
        {viewingScheduleItem && <ScheduleEditorModal />}
    </div>
  );
};

const App: React.FC = () => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  return (
    <AppProvider>
      <AppWithContext isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
    </AppProvider>
  );
};

const AppWithContext: React.FC<{
    isFocusMode: boolean, 
    setIsFocusMode: (f: boolean) => void 
}> = ({ isFocusMode, setIsFocusMode }) => {
    const { isCommandPaletteOpen, setIsCommandPaletteOpen, isQuickCreateOpen, setIsQuickCreateOpen, appSettings } = useAppContext();

    // Theme Application Effect
    useEffect(() => {
        const root = document.documentElement;
        if (!appSettings) return;

        const { 
            theme = 'dark', 
            fontFamily = 'sans', 
            customFont = '',
            layout = 'cozy', 
            themeConfig = {}, 
            uiStyle = 'classic', 
            customCSS 
        } = appSettings;

        // 1. Typography
        if (customFont && customFont.trim() !== '') {
             root.style.setProperty('--font-sans', customFont);
        } else {
            const fonts = {
                sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                serif: '"Lora", serif',
                mono: '"Fira Code", monospace'
            };
            root.style.setProperty('--font-sans', fonts[fontFamily] || fonts['sans']);
        }

        // 2. Layout Density (Scaling)
        const densities = {
            compact: '14px',
            cozy: '16px',
            spacious: '18px'
        };
        root.style.fontSize = densities[layout] || densities['cozy'];
        root.setAttribute('data-layout', layout);

        // 3. UI Style
        root.setAttribute('data-ui-style', uiStyle);

        // 4. Theme (Light/Dark Text Colors)
        root.setAttribute('data-theme', theme);
        if (theme === 'light') {
            root.style.setProperty('--text', '#1a1a1a');
            root.style.setProperty('--text-dim', '#555555');
            root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.15)');
        } else {
            root.style.setProperty('--text', '#EAEAEA');
            root.style.setProperty('--text-dim', '#888888');
            root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
        }

        // 5. Custom Colors & Advanced Config
        const { 
            accentHue = 211, 
            accentSaturation = 100, 
            accentLightness = 65, 
            bgHue = 215, 
            bgSaturation = 25, 
            bgLightness = 10,
            glassOpacity = 30,
            glassBlur = 20,
            borderRadius = 32
        } = themeConfig;
        
        const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;
        
        root.style.setProperty('--grad-1', hsl(accentHue, accentSaturation, accentLightness));
        root.style.setProperty('--grad-2', hsl((accentHue + 40) % 360, accentSaturation, accentLightness));
        root.style.setProperty('--bg', hsl(bgHue, bgSaturation, bgLightness));
        
        const offsetL = bgLightness > 50 ? Math.max(0, bgLightness - 5) : Math.min(100, bgLightness + 5);
        root.style.setProperty('--bg-offset', hsl(bgHue, bgSaturation, offsetL));

        root.style.setProperty('--glass-opacity', `${glassOpacity}%`);
        root.style.setProperty('--glass-blur', `${glassBlur}px`);
        root.style.setProperty('--border-radius', `${borderRadius}px`);

        // 6. Custom CSS Injection
        const cssId = 'user-custom-css';
        let style = document.getElementById(cssId);
        if (!style) {
            style = document.createElement('style');
            style.id = cssId;
            document.head.appendChild(style);
        }
        style.textContent = customCSS || '';

    }, [appSettings]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && e.target === document.body) {
                e.preventDefault();
                setIsCommandPaletteOpen(open => !open);
            }
        };
        document.body.addEventListener('keydown', handleKeyDown);
        return () => document.body.removeEventListener('keydown', handleKeyDown);
    }, [setIsCommandPaletteOpen]);

    const handleSetView = (view: 'dashboard' | 'systems') => {
        // No-op for now as we unified views, but kept for prop compatibility if needed
    };
    
    return (
        <AppWrapper>
            <AppContent isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
            <GlobalAudioPlayer />

            {isFocusMode && <FocusView exitFocusMode={() => setIsFocusMode(false)} />}
            {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} setView={handleSetView} enterFocusMode={() => { setIsCommandPaletteOpen(false); setIsFocusMode(true); }} />}
            {isQuickCreateOpen && <QuickCreateModal onClose={() => setIsQuickCreateOpen(false)} />}
        </AppWrapper>
    );
};

export default App;