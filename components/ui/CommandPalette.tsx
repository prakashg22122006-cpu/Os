
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import Input from './Input';

export type View = 'dashboard' | 'systems';

interface Command {
  id: string;
  name: string;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  setView: (view: View) => void;
  enterFocusMode: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, setView, enterFocusMode }) => {
    const { setIsQuickCreateOpen } = useAppContext();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const commands: Command[] = useMemo(() => [
        { id: 'dashboard', name: 'Go to Dashboard', action: () => setView('dashboard'), keywords: 'home main screen' },
        { id: 'systems', name: 'Go to Systems', action: () => setView('systems'), keywords: 'manage settings' },
        { id: 'focus', name: 'Enter Focus Mode', action: enterFocusMode, keywords: 'timer pomodoro deep work' },
        { id: 'quick_create', name: 'Quick Create...', action: () => setIsQuickCreateOpen(true), keywords: 'add new task note event' },
    ], [setView, enterFocusMode, setIsQuickCreateOpen]);

    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;
        const lowerQuery = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.name.toLowerCase().includes(lowerQuery) ||
            cmd.keywords?.toLowerCase().includes(lowerQuery)
        );
    }, [query, commands]);

    useEffect(() => {
        inputRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredCommands, selectedIndex, onClose]);
    
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const selectedItem = listRef.current?.children[selectedIndex] as HTMLLIElement;
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel w-full max-w-2xl p-4" onClick={e => e.stopPropagation()}>
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Type a command or search..."
                    className="w-full text-lg !border-0 !p-2 mb-2"
                />
                <ul ref={listRef} className="max-h-80 overflow-y-auto">
                    {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
                        <li
                            key={cmd.id}
                            className={`p-3 rounded-lg cursor-pointer text-text-dim transition-colors ${index === selectedIndex ? 'bg-white/10 text-text' : 'hover:bg-white/5'}`}
                            onClick={() => { cmd.action(); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {cmd.name}
                        </li>
                    )) : <li className="p-3 text-text-dim">No results found</li>}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
