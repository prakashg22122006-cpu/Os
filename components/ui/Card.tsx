import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  isInteractive?: boolean;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
  isMaximized?: boolean;
  onMaximizeToggle?: () => void;
  onClose?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  isInteractive = false,
  isMinimized = false,
  onMinimizeToggle,
  isMaximized = false,
  onMaximizeToggle,
  onClose,
}) => {
  const finalClassName = `glass-panel relative flex flex-col ${isInteractive && !isMinimized ? 'glass-panel-interactive' : ''} ${className}`;

  return (
    <div className={finalClassName}>
      <header className="flex items-center justify-between p-4 md:p-6 pb-2">
        {title && <h3 className="text-base font-semibold text-gray-200">{title}</h3>}
        <div className="card-controls">
            {onMinimizeToggle && (
                 <button onClick={onMinimizeToggle} className="card-control-btn" aria-label={isMinimized ? 'Restore' : 'Minimize'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                </button>
            )}
            {onMaximizeToggle && (
                 <button onClick={onMaximizeToggle} className="card-control-btn" aria-label={isMaximized ? 'Restore' : 'Maximize'}>
                     {isMaximized ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m-4 8v4h4m8-12h4v4m-4 8h4v4" /></svg>
                     )}
                </button>
            )}
            {onClose && (
                <button onClick={onClose} className="card-control-btn" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
      </header>
      
      {!isMinimized && (
          <div className="flex-grow min-h-0">
            {children}
          </div>
      )}
    </div>
  );
};

export default Card;
