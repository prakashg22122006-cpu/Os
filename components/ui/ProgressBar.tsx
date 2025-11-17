
import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color, height = 'h-2.5' }) => {
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  const progressColor = color || (normalizedValue < 30 ? 'bg-red-500' : normalizedValue < 70 ? 'bg-yellow-500' : 'bg-green-500');

  return (
    <div className={`w-full bg-[rgba(255,255,255,0.1)] rounded-full ${height}`}>
      <div
        className={`${progressColor} ${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${normalizedValue}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
