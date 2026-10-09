import { useState, type ReactNode } from 'react';

interface AccordionSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AccordionSection({ title, count, defaultOpen = true, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#EDF1EA] dark:border-[#27403A] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3.5 cursor-pointer group"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wider group-hover:text-[#1F2D2A] dark:group-hover:text-[#E6EFE9] transition-colors">
          {title}
          {count !== undefined && <span className="font-mono normal-case text-[10px] text-[#6B7A74] dark:text-[#98B0A6]">({count})</span>}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[#6B7A74] dark:text-[#98B0A6] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
