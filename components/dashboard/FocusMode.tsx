import React from 'react';
import Button from '../ui/Button';

interface FocusModeProps {
  setIsFocusMode: (isFocus: boolean) => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ setIsFocusMode }) => {
  return (
    <Button variant="cta" onClick={() => setIsFocusMode(true)}>
      Enter Focus Mode
    </Button>
  );
};

export default FocusMode;