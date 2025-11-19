
import React, { useState, useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';
import { useAppContext } from '../context/AppContext';

const Header: React.FC = () => {
  const { appSettings, setAppSettings, setIsCommandPaletteOpen, setIsQuickCreateOpen, musicPlayerState, setMusicPlayerState, notifications, setNotifications } = useAppContext();
  const isMobile = useMobile();
  const [time, setTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (e: MouseEvent) => {
        if(notifRef.current && !notifRef.current.contains(e.target as Node)) {
            setIsNotifOpen(false);
        }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        clearInterval(timer);
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setAppSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const handleToolbarAction = (actionId: string) => {
      switch(actionId) {
          case 'search': setIsCommandPaletteOpen(true); break;
          case 'focus': setIsCommandPaletteOpen(true); break;
          case 'add': setIsQuickCreateOpen(true); break;
          case 'theme': toggleTheme(); break;
          case 'music': setMusicPlayerState(p => ({...p, isPlaying: !p.isPlaying})); break;
          default: break;
      }
  };

  const timeString = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--bg)]/80 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-transparent'} px-4 md:px-8 h-14 md:h-16 flex items-center justify-between`}
    >
        {/* Logo Section */}
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--grad-1)] to-[var(--grad-2)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--grad-1)]/30">
                S
            </div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Studyos</h1>
        </div>

        {/* Center Toolbar - Desktop Only */}
        {!isMobile && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
                {appSettings.toolbar?.filter(t => t.enabled).map(item => (
                    <button 
                        key={item.id}
                        onClick={() => handleToolbarAction(item.id)}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors tooltip-trigger relative group"
                        aria-label={item.label}
                    >
                        {item.icon === 'search' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        {item.icon === 'focus' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        {item.icon === 'add' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                        {item.icon === 'theme' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                        {item.icon === 'music' && <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${musicPlayerState.isPlaying ? 'text-[var(--grad-1)] animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>}
                        {item.icon === 'settings' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    </button>
                ))}
            </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
             {/* Clock (Mobile) */}
             {isMobile && <span className="text-xs font-mono opacity-70">{timeString}</span>}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </button>
                
                {/* Dropdown */}
                {isNotifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-offset)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-zoomIn">
                        <div className="p-3 border-b border-white/10 flex justify-between items-center">
                            <h4 className="font-bold text-sm">Notifications</h4>
                            <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-white">Clear All</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500">No new notifications</div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-white/[0.02]' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium">{notif.title}</p>
                                            <span className="text-[10px] text-gray-500">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Header;
