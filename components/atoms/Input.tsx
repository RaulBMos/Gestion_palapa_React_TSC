import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  icon?: LucideIcon;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  type = 'text',
  icon: Icon,
  error,
  helper,
  required = false,
  disabled = false,
  fullWidth = true,
  className = '',
  onChange,
  onBlur,
  onFocus,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange?.(newValue);
  };

  const baseClasses = 'px-4 py-3.5 bg-white border rounded-xl outline-none transition-all font-medium';
  const sizeClasses = fullWidth ? 'w-full' : '';
  const stateClasses = error
    ? 'border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
    : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500';
  const disabledClasses = disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : '';

  const inputClasses = [
    baseClasses,
    sizeClasses,
    stateClasses,
    disabledClasses,
    Icon ? 'pl-12' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          type={type}
          value={value || ''}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-slate-500">{helper}</p>
      )}
    </div>
  );
};