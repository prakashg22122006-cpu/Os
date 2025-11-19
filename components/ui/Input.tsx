
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement> | React.SelectHTMLAttributes<HTMLSelectElement>;

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    
    const type = (props as any).type;

    if (type === 'textarea') {
      return (
        <textarea
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          className={`glass-textarea w-full ${className}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    if (type === 'select') {
       return (
        <select
          ref={ref as React.ForwardedRef<HTMLSelectElement>}
          className={`glass-select w-full ${className}`}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {props.children}
        </select>
       )
    }

    return (
      <input
        ref={ref as React.ForwardedRef<HTMLInputElement>}
        className={`glass-input w-full ${className}`}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
