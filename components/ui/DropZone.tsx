import React, { useState, useCallback, useRef } from 'react';

interface DropZoneProps {
  onDrop: (files: FileList) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, children, className, disabled }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [onDrop]);
  
  if (disabled) return <>{children}</>;

  return (
    <div
      className={`relative ${className || ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[var(--grad-1)]/20 backdrop-blur-sm z-10 flex items-center justify-center text-lg font-semibold border-2 border-dashed border-[var(--grad-1)] rounded-lg pointer-events-none">
          <p>Drop file(s) to upload</p>
        </div>
      )}
      {children}
    </div>
  );
};

export default DropZone;