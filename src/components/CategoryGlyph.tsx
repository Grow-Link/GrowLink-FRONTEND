import type { ReactElement } from 'react';

const CATEGORY_STYLE: Record<string, { from: string; to: string; icon: ReactElement }> = {
  'Ciencia de Datos': {
    from: '#1E73E8', to: '#12C2A8',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V9m6 8V5M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2zM9 21v-4" />
    ),
  },
  'Desarrollo de Software': {
    from: '#12C2A8', to: '#4CE07E',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 9l-4 4 4 4m8-8l4 4-4 4M13 5l-2 14" />,
  },
  Finanzas: {
    from: '#1E73E8', to: '#0B1F3A',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.4-2.6-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  'Marketing Digital': {
    from: '#4CE07E', to: '#12C2A8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  },
  Liderazgo: {
    from: '#0B1F3A', to: '#1E73E8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
};

const DEFAULT_STYLE = { from: '#1E73E8', to: '#12C2A8' };

interface CategoryGlyphProps {
  category: string;
  className?: string;
}

export default function CategoryGlyph({ category, className = 'w-full h-full' }: CategoryGlyphProps) {
  const style = CATEGORY_STYLE[category];
  const gradientId = `cat-glyph-${category.replace(/\s+/g, '-')}`;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${style?.from ?? DEFAULT_STYLE.from}, ${style?.to ?? DEFAULT_STYLE.to})` }}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -left-2 -bottom-4 w-16 h-16 rounded-full bg-black/10 blur-lg" />
      <svg viewBox="0 0 24 24" fill="none" stroke="white" className="absolute inset-0 m-auto w-10 h-10 opacity-90" id={gradientId}>
        {style?.icon}
      </svg>
    </div>
  );
}
