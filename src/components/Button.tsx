import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#0E8A7D] text-white hover:bg-[#0B7368] active:bg-[#09645A]',
  secondary: 'bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#1F2D2A] dark:text-[#E6EFE9] border border-[#E1E6DF] dark:border-[#27403A] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A]',
  ghost: 'text-[#1F2D2A] dark:text-[#E6EFE9] hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27]',
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
