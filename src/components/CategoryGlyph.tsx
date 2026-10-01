import type { ReactElement } from 'react';

const CATEGORY_STYLE: Record<string, { from: string; to: string; icon: ReactElement }> = {
  'Ingeniería de Sistemas': {
    from: '#1E73E8', to: '#12C2A8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />,
  },
  'Ingeniería Civil': {
    from: '#0B1F3A', to: '#1E73E8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01" />,
  },
  'Ingeniería Industrial': {
    from: '#12C2A8', to: '#4CE07E',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  'Ingeniería Electrónica': {
    from: '#1E73E8', to: '#0B1F3A',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 7h10v10H7V7zM9 9h6v6H9V9z" />,
  },
  'Ingeniería Mecánica': {
    from: '#4CE07E', to: '#12C2A8',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l2.77-2.77a4.5 4.5 0 01-5.94 5.94l-5.91 5.91a2.121 2.121 0 11-3-3l5.91-5.91a4.5 4.5 0 015.94-5.94l-2.76 2.77z"
      />
    ),
  },
  'Ingeniería Ambiental': {
    from: '#12C2A8', to: '#4CE07E',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.98 14.98 0 013 9 14.98 14.98 0 01-3 9 14.98 14.98 0 01-3-9 14.98 14.98 0 013-9z" />,
  },
  Matemáticas: {
    from: '#1E73E8', to: '#12C2A8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V9m6 8V5M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2zM9 21v-4" />,
  },
  'Administración de Empresas': {
    from: '#1E73E8', to: '#0B1F3A',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.4-2.6-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  Idiomas: {
    from: '#12C2A8', to: '#4CE07E',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  },
  Derecho: {
    from: '#0B1F3A', to: '#1E73E8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
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
