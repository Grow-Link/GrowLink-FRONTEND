import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'blue' | 'teal' | 'navy';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#6B7A74] dark:text-[#98B0A6] border border-[#E1E6DF] dark:border-[#27403A]',
  success: 'bg-[#F0FDF4] dark:bg-[#0D2E1A] text-[#15803D] dark:text-[#4CE07E] border border-[#BBF7D0] dark:border-[#166534]',
  warning: 'bg-[#FFFBEB] dark:bg-[#3A2A0D] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#78350F]',
  danger: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C1D1D]',
  info: 'bg-[#ECF7F4] dark:bg-[#10211D] text-[#0B6F65] dark:text-[#9BE0D3] border border-[#B7E3DA] dark:border-[#27403A]',
  blue: 'bg-[#0E8A7D] text-white',
  teal: 'bg-[#12C2A8] text-white',
  navy: 'bg-[#1F2D2A] text-white',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
