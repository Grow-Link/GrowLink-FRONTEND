import { CATEGORY_STYLE } from './CategoryGlyph';

interface CourseArtProps {
  category: string;
  /** Con esto cada curso se ve distinto (ángulo, formas y chispas), pero siempre igual para el mismo curso. */
  seed: string;
  className?: string;
  /** Más grande en la ficha del curso. */
  grande?: boolean;
}

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const POR_DEFECTO = { from: '#0E8A7D', to: '#12C2A8' };

/**
 * La ilustración de un curso: un degradado del color de su área con formas que flotan, una cuadrícula que se
 * desplaza, chispas que titilan y el icono del área meciéndose. Si el contenedor es una .gl-card-3d, además hay un
 * brillo que sigue al cursor. Es puro CSS (nada de imágenes que descargar) y se apaga con "reducir movimiento".
 */
export default function CourseArt({ category, seed, className = 'h-24', grande = false }: CourseArtProps) {
  const estilo = CATEGORY_STYLE[category];
  const from = estilo?.from ?? POR_DEFECTO.from;
  const to = estilo?.to ?? POR_DEFECTO.to;
  const h = hash(seed + category);
  const angulo = 115 + (h % 90);
  const x1 = 10 + (h % 50);
  const x2 = 45 + ((h >> 3) % 45);
  const y1 = 5 + ((h >> 5) % 40);
  // cada curso tiene su propio acento cálido, su anillo y su lado donde brilla
  const calido = ['#F5A524', '#F2704E', '#FBBF24', '#4CE07E'][(h >> 7) % 4];
  const ladoDerecho = (h >> 9) % 2 === 0;
  const anillo = 44 + ((h >> 11) % 40);
  const chispas = Array.from({ length: 5 }, (_, i) => ({
    x: 8 + ((h >> (i * 3)) % 84),
    y: 10 + ((h >> (i * 2 + 1)) % 72),
    dur: 2.2 + ((h >> i) % 18) / 10,
    delay: -(((h >> (i + 2)) % 25) / 10),
    tam: 2 + ((h >> (i + 4)) % 3),
  }));

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(${angulo}deg, ${from}, ${to})` }} aria-hidden="true">
      <div
        className="gl-art-grid absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="gl-art-blob-a absolute rounded-full bg-white/25 blur-2xl" style={{ width: '46%', height: '110%', left: `${x1}%`, top: '-30%', ['--dur' as string]: '7s' }} />
      <div className="gl-art-blob-a absolute rounded-full blur-2xl opacity-45" style={{ width: '38%', height: '80%', background: calido, [ladoDerecho ? 'right' : 'left']: '-10%', bottom: '-35%', ['--dur' as string]: '8s' }} />
      <div className="gl-art-spin absolute rounded-full border-2 border-dashed border-white/35" style={{ width: anillo, height: anillo, [ladoDerecho ? 'left' : 'right']: '8%', top: '14%' }} />
      <div className="gl-art-blob-b absolute rounded-full bg-black/15 blur-2xl" style={{ width: '40%', height: '90%', left: `${x2}%`, top: `${y1}%`, ['--dur' as string]: '9s' }} />
      {chispas.map((c, i) => (
        <span
          key={i}
          className="gl-art-spark absolute rounded-full bg-white"
          style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.tam, height: c.tam, animationDelay: `${c.delay}s`, ['--dur' as string]: `${c.dur}s` }}
        />
      ))}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        className={`gl-art-bob absolute inset-0 m-auto drop-shadow-lg opacity-95 ${grande ? 'w-16 h-16' : 'w-10 h-10'}`}
      >
        {estilo?.icon}
      </svg>
      <div className="gl-art-shine absolute inset-0 pointer-events-none" />
    </div>
  );
}
