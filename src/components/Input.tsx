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
        <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{label}</label>
      )}
      <div className={`flex items-center gap-2 border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] transition-all ${
        error
          ? 'border-[#EF4444] focus-within:ring-2 focus-within:ring-[#EF4444]/20'
          : 'border-[#DDE4ED] dark:border-[#1C3254] focus-within:border-[#1E73E8] focus-within:ring-2 focus-within:ring-[#1E73E8]/10'
      }`}>
        {prefix && <span className="text-[#6B7A99] dark:text-[#8BA5C2] shrink-0">{prefix}</span>}
        <input
          className={`flex-1 min-w-0 bg-transparent text-sm text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] outline-none ${className}`}
          {...props}
        />
        {suffix && <span className="text-[#6B7A99] dark:text-[#8BA5C2] shrink-0">{suffix}</span>}
      </div>
      {hint && !error && <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">{hint}</p>}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
