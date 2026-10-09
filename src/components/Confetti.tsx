import { useEffect, useMemo, useState } from 'react';

const COLORES = ['#12C2A8', '#4CE07E', '#F5A524', '#F2704E', '#0E8A7D', '#FBBF24'];

interface ConfettiProps {
  /** Cuántas piezas caen. 40 se siente festivo sin pesar. */
  piezas?: number;
}

/** Lluvia de confeti de una sola vez (se queda en pantalla ~4 s y no atrapa clics). */
export default function Confetti({ piezas = 40 }: ConfettiProps) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(id);
  }, []);

  const lista = useMemo(
    () =>
      Array.from({ length: piezas }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.4 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 540,
        color: COLORES[i % COLORES.length],
      })),
    [piezas]
  );

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {lista.map((p) => (
        <span
          key={p.id}
          className="gl-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              '--delay': `${p.delay}s`,
              '--dur': `${p.dur}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
