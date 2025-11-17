import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { View } from '../../App';

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
        { id: 'add_task', name: 'Add a new task', action: () => { setIsQuickCreateOpen(true); /* More specific action could be added later */ }, keywords: 'todo' },
        { id: 'add_note', name: 'Add a new note', action: () => { setIsQuickCreateOpen(true); }, keywords: 'idea' },
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
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Type a command..."
                    className="command-palette-input"
                />
                <ul ref={listRef} className="command-palette-list">
                    {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
                        <li
                            key={cmd.id}
                            className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => { cmd.action(); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {cmd.name}
                        </li>
                    )) : <li className="command-palette-item">No results found</li>}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
