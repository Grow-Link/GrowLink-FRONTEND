export interface Checkpoint {
  label: string;
  sublabel?: string;
}

interface CheckpointPathProps {
  checkpoints: Checkpoint[];
  completedCount: number;
  variant?: 'light' | 'dark';
}

export default function CheckpointPath({ checkpoints, completedCount, variant = 'light' }: CheckpointPathProps) {
  const isDarkVariant = variant === 'dark';
  const mutedText = isDarkVariant ? 'text-[#8BA5C2]' : 'text-[#6B7A99] dark:text-[#8BA5C2]';
  const labelText = isDarkVariant ? 'text-white' : 'text-[#0B1F3A] dark:text-[#E2EBF6]';
  const trackBase = isDarkVariant ? 'bg-white/10' : 'bg-[#EEF2F6] dark:bg-[#1C3254]';
  const idleNode = isDarkVariant
    ? 'bg-white/5 border-white/20 text-[#8BA5C2]'
    : 'bg-white dark:bg-[#0F2240] border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]';

  return (
    <div className="flex items-start">
      {checkpoints.map((cp, i) => {
        const isDone = i < completedCount;
        const isCurrent = i === completedCount;
        const isLast = i === checkpoints.length - 1;
        return (
          <div key={cp.label} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center shrink-0" style={{ width: '4.5rem' }}>
              <div
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-all ${
                  isDone
                    ? 'bg-[#4CE07E] border-[#4CE07E] text-white'
                    : isCurrent
                    ? 'gl-gradient border-transparent text-white gl-glow-teal scale-110'
                    : idleNode
                }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <p className={`text-xs font-semibold mt-2 text-center leading-snug ${isDone || isCurrent ? labelText : mutedText}`}>{cp.label}</p>
              {cp.sublabel && <p className={`text-[10px] mt-0.5 text-center ${mutedText}`}>{cp.sublabel}</p>}
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-5 rounded-full overflow-hidden ${trackBase}`}>
                <div
                  className="h-full gl-gradient rounded-full transition-all duration-700"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
