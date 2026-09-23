interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (n: number) => string;
  presets?: { label: string; value: [number, number] }[];
}

export default function RangeSlider({ min, max, step = 1, value, onChange, formatValue, presets }: RangeSliderProps) {
  const [lo, hi] = value;
  const fmt = formatValue ?? ((n: number) => String(n));
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;

  function handleLo(next: number) {
    onChange([Math.min(next, hi), hi]);
  }
  function handleHi(next: number) {
    onChange([lo, Math.max(next, lo)]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{fmt(lo)}</span>
        <span className="font-mono text-xs font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{fmt(hi)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#EEF2F6] dark:bg-[#1C3254]" />
        <div
          className="absolute h-1.5 rounded-full gl-gradient"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => handleLo(Number(e.target.value))}
          className="gl-range-input absolute inset-x-0 w-full"
          style={{ zIndex: lo > max - 10 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => handleHi(Number(e.target.value))}
          className="gl-range-input absolute inset-x-0 w-full"
          style={{ zIndex: 4 }}
        />
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {presets.map((p) => {
            const isActive = lo === p.value[0] && hi === p.value[1];
            return (
              <button
                key={p.label}
                onClick={() => onChange(p.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#12C2A8] bg-[#12C2A8]/10 text-[#0F766E] dark:text-[#2DD4BF]'
                    : 'border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:border-[#1E73E8]/40'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
