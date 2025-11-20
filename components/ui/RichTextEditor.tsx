import React, { useRef, useEffect } from 'react';
import Button from './Button';

const RichTextEditor: React.FC<{ value: string; onChange: (content: string) => void }> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };
    
    const execCmd = (cmd: string) => {
        document.execCommand(cmd, false);
        editorRef.current?.focus();
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
        <div className="flex-grow flex flex-col">
            <div className="flex gap-2 mb-2 p-2 bg-[rgba(255,255,255,0.03)] rounded-lg">
                <Button variant="outline" className="text-xs px-2 py-1" onClick={() => execCmd('bold')}>B</Button>
                <Button variant="outline" className="text-xs px-2 py-1" onClick={() => execCmd('italic')}>I</Button>
                <Button variant="outline" className="text-xs px-2 py-1" onClick={() => execCmd('underline')}>U</Button>
                <Button variant="outline" className="text-xs px-2 py-1" onClick={() => execCmd('insertUnorderedList')}>List</Button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="bg-transparent border border-[rgba(255,255,255,0.08)] text-[#9fb3cf] p-2 rounded-lg w-full flex-grow box-border focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
        </div>
    );
};

export default RichTextEditor;
