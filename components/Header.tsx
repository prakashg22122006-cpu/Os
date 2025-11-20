
import React from 'react';
import type { View } from '../App';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const navButtonClass = "bg-transparent border-0 text-[var(--text-color-dim)] py-2 px-3 rounded-lg cursor-pointer transition-colors";
  const activeButtonClass = "bg-gradient-to-r from-[var(--accent-color)]/10 to-[var(--accent-color)]/5 text-[var(--accent-color)]";
  
  return (
    <header className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#09293b] to-[#123a5a] flex-shrink-0"></div>
      <h1 className="text-lg font-semibold text-[var(--accent-color)] hidden sm:block">Studyos — Personal Study OS</h1>
      <nav className="flex gap-2 ml-3">
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`${navButtonClass} ${activeView === 'dashboard' ? activeButtonClass : ''}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveView('systems')}
          className={`${navButtonClass} ${activeView === 'systems' ? activeButtonClass : ''}`}
        >
          Systems
        </button>
      </nav>
      <div className="ml-auto flex gap-3 items-center text-[var(--text-color-dim)]">
        <span className="hidden md:inline">offline • local</span>
        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center font-bold">
          P
        </div>
      </div>
    </header>
  );
};

export default Header;
