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
    <div className="border-b border-[#EEF2F6] dark:border-[#1C3254] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3.5 cursor-pointer group"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider group-hover:text-[#0B1F3A] dark:group-hover:text-[#E2EBF6] transition-colors">
          {title}
          {count !== undefined && <span className="font-mono normal-case text-[10px] text-[#6B7A99] dark:text-[#8BA5C2]">({count})</span>}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[#6B7A99] dark:text-[#8BA5C2] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
