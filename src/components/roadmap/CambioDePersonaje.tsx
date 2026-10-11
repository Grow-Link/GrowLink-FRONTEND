import { useEffect, useRef } from 'react';
import Brote from './Brote';
import Confetti from '../Confetti';
import type { AccesorioId, Apariencia, Genero, Novedad } from '../../utils/personaje';

// La pantalla que aparece cuando el personaje cambia (crece de forma o gana un accesorio), como el aviso de
// "evolución" de un videojuego: el antes pequeño y apagado, el ahora grande, y qué fue lo que cambió.

interface Props {
  genero: Genero;
  antes: { rango: number; accesorios: AccesorioId[] };
  ahora: Apariencia;
  novedades: Novedad[];
  onCerrar: () => void;
}

export default function CambioDePersonaje({ genero, antes, ahora, novedades, onCerrar }: Props) {
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boton.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const evoluciono = ahora.rango > antes.rango;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#050D0C]/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tu personaje cambió" onClick={onCerrar}>
      <Confetti piezas={46} />
      <div className="gl-cambio-tarjeta relative w-full max-w-md overflow-hidden rounded-3xl border border-[#F5A524]/40 text-center shadow-2xl" style={{ background: 'linear-gradient(to bottom, #0B1B18, #123C3A)' }} onClick={(e) => e.stopPropagation()}>
        <div aria-hidden="true" className="gl-cambio-rayos absolute left-1/2 top-24 -ml-[260px] -mt-[260px] w-[520px] h-[520px] opacity-30" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(245,217,139,0.5) 0deg 7deg, transparent 7deg 20deg)', maskImage: 'radial-gradient(circle, black 0%, transparent 68%)', WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 68%)' }} />

        <div className="relative px-6 pt-7 pb-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#F5D98B]">{evoluciono ? 'Tu personaje evolucionó' : 'Tu personaje tiene algo nuevo'}</p>

          <div className="relative mt-4 flex items-end justify-center gap-4 sm:gap-6">
            <div className="opacity-50 saturate-50 scale-75 origin-bottom">
              <Brote genero={genero} rango={antes.rango} accesorios={antes.accesorios} size={110} />
            </div>
            <svg className="w-7 h-7 mb-10 text-[#F5D98B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
            <div className="relative">
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-8 rounded-full bg-[#F5D98B]/25 blur-2xl" />
              <Brote genero={genero} rango={ahora.rango} accesorios={ahora.accesorios.map((a) => a.id)} size={190} celebra className="relative" />
            </div>
          </div>

          <h2 className="mt-3 font-display font-bold text-2xl text-white">{ahora.forma}</h2>
          <ul className="mt-3 space-y-2 text-left">
            {novedades.map((n) => (
              <li key={n.titulo} className="flex items-start gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-3.5 py-2.5">
                <span className="mt-0.5 text-[#F5D98B]" aria-hidden="true">★</span>
                <span>
                  <span className="block text-sm font-semibold text-white">{n.titulo}</span>
                  <span className="block text-xs text-[#98B0A6] mt-0.5">{n.detalle}</span>
                </span>
              </li>
            ))}
          </ul>

          <button ref={boton} type="button" onClick={onCerrar} className="mt-6 w-full rounded-xl gl-gradient text-white font-semibold py-3 cursor-pointer shadow-lg hover:brightness-110 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  );
}
