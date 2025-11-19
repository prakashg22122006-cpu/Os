// This component is no longer needed as the functionality is merged into PomodoroTimer.tsx and FocusView.tsx
// Keeping the file to prevent import errors, but it's effectively deprecated.
import React from 'react';

const FocusMode: React.FC<{ setIsFocusMode: (isFocus: boolean) => void; }> = ({ setIsFocusMode }) => {
  return null;
};

export default FocusMode;
