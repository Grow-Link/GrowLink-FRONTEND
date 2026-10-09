interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'gradient' | 'blue' | 'teal' | 'green';
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  gradient: 'gl-gradient',
  blue: 'bg-[#0E8A7D]',
  teal: 'bg-[#12C2A8]',
  green: 'bg-[#4CE07E]',
};

const sizeClasses: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
};

export default function ProgressBar({
  value,
  max = 100,
  variant = 'gradient',
  size = 'sm',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-[#EDF1EA] dark:bg-[#27403A] rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variantClasses[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] tabular-nums min-w-[3rem] text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
