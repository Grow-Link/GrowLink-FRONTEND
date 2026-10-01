import type { ReactNode } from 'react';

interface TooltipProps {
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({ title, description, children, side = 'top', className = '' }: TooltipProps) {
  const positionClasses = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <span className={`relative inline-flex group/tip ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${positionClasses} z-50 w-max max-w-[15rem] scale-95 opacity-0 transition-all duration-150 group-hover/tip:scale-100 group-hover/tip:opacity-100`}
      >
        <span className="block rounded-lg bg-[#0B1F3A] dark:bg-[#0F2240] border border-white/10 dark:border-[#1C3254] px-3 py-2 shadow-xl">
          <span className="block text-xs font-semibold text-white leading-snug">{title}</span>
          {description && <span className="block text-[11px] text-[#8BA5C2] leading-snug mt-0.5">{description}</span>}
        </span>
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0B1F3A] dark:bg-[#0F2240] border-white/10 dark:border-[#1C3254] rotate-45 ${
            side === 'top' ? '-bottom-1 border-r border-b' : '-top-1 border-l border-t'
          }`}
        />
      </span>
    </span>
  );
}
