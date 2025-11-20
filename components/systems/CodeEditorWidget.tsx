
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { CodeSnippet } from '../../types';
import { useMobile } from '../../hooks/useMobile';

const CodeEditorWidget: React.FC = () => {
    const { codeSnippets, setCodeSnippets } = useAppContext();
    const [activeSnippetId, setActiveSnippetId] = useState<number | null>(codeSnippets[0]?.id || null);
    const [newSnippetName, setNewSnippetName] = useState('');
    const isMobile = useMobile();
    const [showSidebar, setShowSidebar] = useState(true);

    const activeSnippet = codeSnippets.find(s => s.id === activeSnippetId);

    const createSnippet = () => {
        const name = newSnippetName.trim() || 'Untitled';
        const newSnippet: CodeSnippet = {
            id: Date.now(),
            title: name,
            language: 'javascript',
            code: '// Store your code snippets here\n',
            updatedAt: Date.now(),
        };
        setCodeSnippets(prev => [newSnippet, ...prev]);
        setActiveSnippetId(newSnippet.id);
        setNewSnippetName('');
        if(isMobile) setShowSidebar(false);
    };

    const updateCode = (val: string) => {
        if (activeSnippetId) {
            setCodeSnippets(prev => prev.map(s => s.id === activeSnippetId ? { ...s, code: val, updatedAt: Date.now() } : s));
        }
    };

    const deleteSnippet = (id: number) => {
        if(window.confirm('Delete this snippet?')) {
             setCodeSnippets(prev => prev.filter(s => s.id !== id));
             if(activeSnippetId === id) setActiveSnippetId(null);
        }
    }

    // Simple syntax highlighting logic (very basic for visual effect)
    const renderHighlightedCode = (code: string) => {
        const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export'];
        return code.split(/(\s+)/).map((word, index) => {
            if (keywords.includes(word)) {
                return <span key={index} className="text-purple-400 font-bold">{word}</span>;
            } else if (word.startsWith('"') || word.startsWith("'")) {
                return <span key={index} className="text-green-400">{word}</span>;
            } else if (!isNaN(Number(word))) {
                return <span key={index} className="text-orange-400">{word}</span>;
            }
            return word;
        });
    };

    return (
        <div className="flex h-full gap-4 relative">
            {/* Toggle Sidebar Mobile */}
            {isMobile && (
                <div className="absolute top-0 right-0 z-10 p-2">
                    <Button variant="glass" className="text-xs" onClick={() => setShowSidebar(!showSidebar)}>{showSidebar ? 'View Editor' : 'View List'}</Button>
                </div>
            )}

            {/* Sidebar */}
            <div className={`${showSidebar ? 'flex' : 'hidden'} w-full md:w-64 flex-shrink-0 flex-col border-r border-white/10 pr-4 md:flex`}>
                <div className="flex gap-2 mb-4">
                    <Input value={newSnippetName} onChange={e => setNewSnippetName(e.target.value)} placeholder="New snippet..." className="text-sm" />
                    <Button onClick={createSnippet} className="px-2 py-1 text-sm">+</Button>
                </div>
                <div className="overflow-y-auto flex-grow space-y-1">
                    {codeSnippets.map(snippet => (
                        <div key={snippet.id} className={`flex justify-between items-center p-2 rounded cursor-pointer text-sm group ${activeSnippetId === snippet.id ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5'}`} onClick={() => { setActiveSnippetId(snippet.id); if(isMobile) setShowSidebar(false); }}>
                             <span className="truncate">{snippet.title}</span>
                             <button onClick={(e) => {e.stopPropagation(); deleteSnippet(snippet.id)}} className="opacity-100 md:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">x</button>
                        </div>
                    ))}
                    {codeSnippets.length === 0 && <p className="text-xs text-gray-500 text-center pt-4">No snippets.</p>}
                </div>
            </div>

            {/* Editor Area */}
            <div className={`${!showSidebar || !isMobile ? 'flex' : 'hidden'} md:flex flex-grow flex-col min-w-0`}>
                {activeSnippet ? (
                    <>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">{activeSnippet.language} • {new Date(activeSnippet.updatedAt).toLocaleString()}</span>
                         </div>
                         <div className="flex-grow bg-[#1e1e1e] rounded-lg overflow-hidden flex flex-col font-mono text-sm relative border border-white/10">
                             {/* Simple textarea overlay for editing */}
                            <textarea 
                                value={activeSnippet.code} 
                                onChange={e => updateCode(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 resize-none focus:outline-none z-10"
                                spellCheck={false}
                            />
                            {/* Syntax Highlighting Layer */}
                            <pre className="absolute inset-0 w-full h-full p-4 pointer-events-none whitespace-pre-wrap break-words text-gray-300 z-0">
                                {renderHighlightedCode(activeSnippet.code)}
                            </pre>
                         </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                        Select or create a snippet to manage your code library.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditorWidget;
