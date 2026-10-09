import type { NodeStatus } from '../../utils/roadmapModel';

export const ESTADO_UI: Record<NodeStatus, { etiqueta: string; chip: string; tarjeta: string }> = {
  completed: {
    etiqueta: 'Completado',
    chip: 'bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E]',
    tarjeta: 'border-[#4CE07E]/50 bg-[#F0FDF4] dark:bg-[#0D2E1A]/60 dark:border-[#166534]',
  },
  current: {
    etiqueta: 'Tu siguiente paso',
    chip: 'bg-[#F5A524]/20 text-[#B45309] dark:text-[#FBBF24]',
    tarjeta: 'border-[#F5A524] bg-[#FFFBEB] dark:bg-[#3A2A0D]/60 dark:border-[#B45309]',
  },
  available: {
    etiqueta: 'Disponible',
    chip: 'bg-[#12C2A8]/15 text-[#0B6F65] dark:text-[#5FD3C2]',
    tarjeta: 'border-[#12C2A8]/50 bg-white dark:bg-[#15231F] dark:border-[#0E8A7D]',
  },
  locked: {
    etiqueta: 'Bloqueado',
    chip: 'bg-[#EDF1EA] dark:bg-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]',
    tarjeta: 'border-[#E1E6DF] bg-[#F6F7F2] dark:bg-[#15231F]/60 dark:border-[#27403A] opacity-80',
  },
  unavailable: {
    etiqueta: 'Ya no está disponible',
    chip: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171]',
    tarjeta: 'border-[#FECACA] bg-[#FEF2F2] dark:bg-[#2A1111]/60 dark:border-[#4C1D1D]',
  },
};

/** El circulito de la izquierda de cada curso: el estado se entiende de un vistazo, sin leer. */
export function IconoEstado({ status, numero, className = 'w-9 h-9' }: { status: NodeStatus; numero: number; className?: string }) {
  const base = `${className} rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm`;
  switch (status) {
    case 'completed':
      return (
        <span className={`${base} bg-[#4CE07E] text-white`} aria-label="Completado">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case 'current':
      return (
        <span className={`${base} bg-[#F5A524] text-white gl-soft-pulse`} aria-label="Siguiente paso">
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      );
    case 'available':
      return (
        <span className={`${base} border-2 border-[#12C2A8] text-[#0E8A7D] bg-white dark:bg-[#15231F]`} aria-label="Disponible">
          {numero}
        </span>
      );
    case 'locked':
      return (
        <span className={`${base} bg-[#E1E6DF] dark:bg-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]`} aria-label="Bloqueado">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path strokeLinecap="round" d="M8 11V8a4 4 0 118 0v3" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={`${base} border-2 border-[#DC2626] text-[#DC2626]`} aria-label="No disponible">
          !
        </span>
      );
  }
}
