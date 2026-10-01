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
    <div className={`flex items-center gap-1 border-b border-[#DDE4ED] dark:border-[#1C3254] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isActive ? 'text-[#0B1F3A] dark:text-[#E2EBF6]' : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`font-mono text-[11px] ${isActive ? 'text-[#1E73E8]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>{tab.count}</span>
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
