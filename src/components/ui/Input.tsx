import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left rtl:text-right">
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 rtl:left-auto rtl:right-3.5 pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={generatedId}
          className={`w-full rounded-xl px-3.5 py-3 text-sm glass-input placeholder:text-slate-500 ${
            leftIcon ? 'pl-10 rtl:pl-3.5 rtl:pr-10' : ''
          } ${rightElement ? 'pr-12 rtl:pr-3.5 rtl:pl-12' : ''} ${
            error ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 rtl:right-auto rtl:left-3 text-xs text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};
