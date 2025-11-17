

import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SystemsView from './components/SystemsView';
import FileViewerModal from './components/ui/FileViewerModal';
import TaskViewerModal from './components/ui/TaskViewerModal';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import ScheduleEditorModal from './components/ui/ScheduleEditorModal';
import ParallaxBackground from './components/ui/ParallaxBackground';
import { useSwipeGestures } from './hooks/useSwipeGestures';
import CommandPalette from './components/ui/CommandPalette';
import QuickCreateModal from './components/ui/QuickCreateModal';
import FocusView from './components/dashboard/FocusView';
import CustomWallpaper from './components/ui/CustomWallpaper';
import LiveWallpaperControls from './components/ui/LiveWallpaperControls';

export type View = 'dashboard' | 'systems';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appSettings } = useAppContext();

    useEffect(() => {
        document.body.className = `theme-${appSettings.theme} layout-${appSettings.layout} font-${appSettings.fontFamily} ui-${appSettings.uiStyle}`;
        
        const { themeConfig } = appSettings;
        const safeThemeConfig = themeConfig || {
            accentHue: 211,
            accentSaturation: 100,
            accentLightness: 65,
            bgHue: 215,
            bgSaturation: 25,
            bgLightness: 10,
        };

        document.documentElement.style.setProperty('--accent-hue', String(safeThemeConfig.accentHue));
        document.documentElement.style.setProperty('--accent-saturation', `${safeThemeConfig.accentSaturation}%`);
        document.documentElement.style.setProperty('--accent-lightness', `${safeThemeConfig.accentLightness}%`);
        document.documentElement.style.setProperty('--bg-hue', String(safeThemeConfig.bgHue));
        document.documentElement.style.setProperty('--bg-saturation', `${safeThemeConfig.bgSaturation}%`);
        document.documentElement.style.setProperty('--bg-lightness', `${safeThemeConfig.bgLightness}%`);

    }, [appSettings]);

    const hasCustomWallpaper = appSettings.wallpaper && appSettings.wallpaper.type !== 'default';

    return (
        <>
            {hasCustomWallpaper ? (
                <CustomWallpaper wallpaper={appSettings.wallpaper} />
            ) : (
                <>
                    {appSettings.uiStyle === 'classic' && <ParallaxBackground />}
                    {appSettings.uiStyle === 'modern' && <div className="modern-background" />}
                </>
            )}
            {children}
        </>
    );
};

const AppContent: React.FC<{
    view: View;
    setView: (view: View) => void;
    isFocusMode: boolean;
    setIsFocusMode: (isFocus: boolean) => void;
}> = ({ view, setView, isFocusMode, setIsFocusMode }) => {
  const { viewingFile, viewingTask, viewingScheduleItem, appSettings, setEngagementLogs, setIsQuickCreateOpen, setIsCommandPaletteOpen } = useAppContext();
  const mainRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedView, setDisplayedView] = useState(view);

  const handleSetView = (newView: View) => {
    if (newView === view) return;
    setIsTransitioning(true);
    setTimeout(() => {
        setView(newView);
        setDisplayedView(newView);
        setIsTransitioning(false);
    }, 300); // Corresponds to the fade-out animation duration
  };


  useSwipeGestures({
      onSwipeLeft: () => view === 'dashboard' && handleSetView('systems'),
      onSwipeRight: () => view === 'systems' && handleSetView('dashboard'),
      onSwipeUp: () => setIsQuickCreateOpen(true),
      onSwipeDown: () => !isFocusMode && setIsFocusMode(true),
  }, mainRef);
  
  useEffect(() => {
    setEngagementLogs(prev => [...prev, {
        ts: Date.now(),
        activity: 'app_session_started'
    }]);
  }, [setEngagementLogs]);
  
  if (appSettings.uiStyle === 'modern') {
    return (
        <div className="min-h-screen">
            <div ref={mainRef} className="max-w-7xl mx-auto" style={{ padding: 'var(--widget-gap)' }}>
                 <div className={isFocusMode ? 'opacity-0 pointer-events-none' : 'transition-opacity'}>
                    <Header activeView={view} setActiveView={handleSetView} />
                </div>
                <main className={`modern-content-perspective`}>
                    <div className={`view-container ${isTransitioning ? 'fading-out' : ''}`}>
                        {displayedView === 'dashboard' && <DashboardView setIsFocusMode={setIsFocusMode} />}
                        {displayedView === 'systems' && <SystemsView />}
                    </div>
                </main>
                {!isFocusMode && viewingFile && <FileViewerModal />}
                {!isFocusMode && viewingTask && <TaskViewerModal />}
                {!isFocusMode && viewingScheduleItem && <ScheduleEditorModal />}
            </div>
        </div>
    );
  }

  return (
    <div ref={mainRef} className="main-content-wrapper">
      <div className={isFocusMode ? 'opacity-0 pointer-events-none' : 'transition-opacity'}>
        <Header activeView={view} setActiveView={setView} />
      </div>
      <main className={`dashboard-container ${isFocusMode ? 'fading-out' : ''}`}>
        {view === 'dashboard' && <DashboardView setIsFocusMode={setIsFocusMode} />}
        {view === 'systems' && <SystemsView />}
      </main>
      {!isFocusMode && viewingFile && <FileViewerModal />}
      {!isFocusMode && viewingTask && <TaskViewerModal />}
      {!isFocusMode && viewingScheduleItem && <ScheduleEditorModal />}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  return (
    <AppProvider>
      <AppWithContext view={view} setView={setView} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
    </AppProvider>
  );
};

// We need a sub-component to access the context providers
const AppWithContext: React.FC<{
    view: View, 
    setView: (v: View) => void, 
    isFocusMode: boolean, 
    setIsFocusMode: (f: boolean) => void 
}> = ({ view, setView, isFocusMode, setIsFocusMode }) => {
    const { isCommandPaletteOpen, setIsCommandPaletteOpen, isQuickCreateOpen, setIsQuickCreateOpen } = useAppContext();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && (e.target as HTMLElement).tagName.toLowerCase() !== 'input' && (e.target as HTMLElement).tagName.toLowerCase() !== 'textarea' && !(e.target as HTMLElement).isContentEditable) {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsCommandPaletteOpen]);

    return (
        <AppWrapper>
            <AppContent view={view} setView={setView} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
            {isFocusMode && <FocusView exitFocusMode={() => setIsFocusMode(false)} />}
            {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} setView={setView} enterFocusMode={() => setIsFocusMode(true)} />}
            {isQuickCreateOpen && <QuickCreateModal onClose={() => setIsQuickCreateOpen(false)} />}
            <GlobalAudioPlayer />
            <LiveWallpaperControls />
        </AppWrapper>
    );
}

export default App;