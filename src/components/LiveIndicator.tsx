interface LiveIndicatorProps {
  label?: string;
  color?: 'teal' | 'green' | 'red';
  size?: 'sm' | 'md';
}

const colorMap = {
  teal: { dot: 'bg-[#12C2A8]', ring: 'bg-[#12C2A8]/30', text: 'text-[#12C2A8]' },
  green: { dot: 'bg-[#4CE07E]', ring: 'bg-[#4CE07E]/30', text: 'text-[#4CE07E]' },
  red: { dot: 'bg-[#EF4444]', ring: 'bg-[#EF4444]/30', text: 'text-[#EF4444]' },
};

export default function LiveIndicator({ label = 'EN VIVO', color = 'teal', size = 'sm' }: LiveIndicatorProps) {
  const c = colorMap[color];
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const ringSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-widest ${c.text} ${textSize}`}>
      <span className={`relative flex items-center justify-center ${ringSize}`}>
        <span className={`absolute inline-flex h-full w-full rounded-full ${c.ring} live-pulse`} />
        <span className={`relative inline-flex rounded-full ${dotSize} ${c.dot}`} />
      </span>
      {label}
    </span>
  );
}
