import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export default function Input({ label, hint, error, prefix, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{label}</label>
      )}
      <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1A2C27] transition-all ${
        error
          ? 'border-[#EF4444] focus-within:ring-2 focus-within:ring-[#EF4444]/20'
          : 'border-[#E1E6DF] dark:border-[#27403A] focus-within:border-[#0E8A7D] focus-within:ring-2 focus-within:ring-[#0E8A7D]/10'
      }`}>
        {prefix && <span className="text-[#6B7A74] dark:text-[#98B0A6] shrink-0">{prefix}</span>}
        <input
          className={`flex-1 min-w-0 bg-transparent text-sm text-[#1F2D2A] dark:text-[#E6EFE9] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] outline-none ${className}`}
          {...props}
        />
        {suffix && <span className="text-[#6B7A74] dark:text-[#98B0A6] shrink-0">{suffix}</span>}
      </div>
      {hint && !error && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{hint}</p>}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
