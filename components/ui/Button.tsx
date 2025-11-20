
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'cta';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-[var(--accent-color)] text-[var(--accent-text-color)] hover:opacity-90",
    outline: "bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] hover:bg-[var(--button-outline-hover-bg)]",
    cta: "bg-[var(--accent-color)] text-[var(--accent-text-color)] p-3 rounded-xl border-0 w-full cursor-pointer mt-2.5 hover:opacity-90"
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
