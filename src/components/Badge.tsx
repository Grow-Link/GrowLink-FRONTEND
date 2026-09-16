import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'blue' | 'teal' | 'navy';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]',
  success: 'bg-[#F0FDF4] dark:bg-[#0D2E1A] text-[#15803D] dark:text-[#4CE07E] border border-[#BBF7D0] dark:border-[#166534]',
  warning: 'bg-[#FFFBEB] dark:bg-[#3A2A0D] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#78350F]',
  danger: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171] border border-[#FECACA] dark:border-[#4C1D1D]',
  info: 'bg-[#EFF6FF] dark:bg-[#0D1F3C] text-[#1D4ED8] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1C3254]',
  blue: 'bg-[#1E73E8] text-white',
  teal: 'bg-[#12C2A8] text-white',
  navy: 'bg-[#0B1F3A] text-white',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface TypeBadgeProps {
  type: 'course' | 'job' | 'service';
}

const typeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  course: { label: 'Curso', variant: 'info' },
  job: { label: 'Empleo', variant: 'success' },
  service: { label: 'Servicio', variant: 'teal' },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const { label, variant } = typeMap[type];
  return <Badge variant={variant}>{label}</Badge>;
}
