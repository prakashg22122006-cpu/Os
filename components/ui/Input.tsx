import React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`bg-transparent border border-[var(--input-border-color)] text-[var(--text-color-dim)] p-2 rounded-lg w-full box-border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;