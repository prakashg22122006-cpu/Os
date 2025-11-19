import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'glass' | 'sticker' | 'primary' | 'outline';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'glass', className = '', ...props }) => {
  const baseClasses = "font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg focus:ring-grad-1";
  
  const variantMap = {
    gradient: 'gradient-button',
    glass: 'glass-button',
    sticker: 'sticker-button',
    primary: 'gradient-button',
    outline: 'outline-button',
  };

  const finalClassName = `${baseClasses} ${variantMap[variant]} ${className}`;

  return (
    <button className={finalClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;