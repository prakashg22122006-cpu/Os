import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  widgetName?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onToggleFullScreen?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  widgetName,
  isMinimized = false,
  onToggleMinimize,
  onToggleFullScreen,
}) => {
  const finalClassName = `
    bg-gradient-to-b from-[hsla(var(--bg-hue),15%,15%,0.5)] to-[hsla(var(--bg-hue),15%,10%,0.6)]
    backdrop-blur-md
    border border-[hsla(var(--bg-hue),20%,100%,0.08)] rounded-xl 
    shadow-[0_8px_20px_var(--shadow-color)] card-glow-on-hover relative
    h-full flex flex-col
    ${isMinimized ? 'card-minimized' : ''}
    ${className}
  `;

  return (
    <div className={finalClassName} style={{ padding: isMinimized ? undefined : 'var(--card-padding)'}}>
      {(onToggleMinimize || onToggleFullScreen) && (
        <div className="card-controls">
          {onToggleMinimize && (
            <button title="Minimize/Restore" className="card-control-btn" onClick={onToggleMinimize}>
              {isMinimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
              )}
            </button>
          )}
          {onToggleFullScreen && (
            <button title="Toggle Fullscreen" className="card-control-btn" onClick={onToggleFullScreen}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 0h-4v4m0-4l-5 5M4 16v4h4m12 0h-4v-4m0 4l-5-5" /></svg>
            </button>
          )}
        </div>
      )}
      {isMinimized && widgetName ? (
        <div className="card-minimized-header">
            <span>{widgetName}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default Card;