export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface HorizontalTabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function HorizontalTabs({ tabs, active, onChange, className = '' }: HorizontalTabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b border-[#E1E6DF] dark:border-[#27403A] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isActive ? 'text-[#1F2D2A] dark:text-[#E6EFE9]' : 'text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#1F2D2A] dark:hover:text-[#E6EFE9]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`font-mono text-[11px] ${isActive ? 'text-[#0E8A7D]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>{tab.count}</span>
              )}
            </span>
            <span
              className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-all ${
                isActive ? 'gl-gradient opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
