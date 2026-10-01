import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#1E73E8] text-white hover:bg-[#1660CC] active:bg-[#1455B8]',
  secondary: 'bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254] hover:bg-[#EEF2F6] dark:hover:bg-[#1C3254]',
  ghost: 'text-[#0B1F3A] dark:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]',
  danger: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C1D1D] hover:bg-[#FEE2E2] dark:hover:bg-[#3A1616]',
  gradient: 'gl-gradient text-white hover:opacity-90 gl-glow-teal hover:scale-[1.02] active:scale-[0.97]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
