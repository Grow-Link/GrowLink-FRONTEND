import type { CSSProperties, ReactNode } from 'react';

// Piezas compartidas por las escenas del catálogo (por área, en CourseScene, y por curso, en CourseMotifs):
// los colores, el estilo de las animaciones y unos cuantos dibujos pequeños que se repiten (engranaje, panel, lupa…).

export const B = 'rgba(255,255,255,0.95)'; // trazo y relleno claros
export const S = 'rgba(255,255,255,0.4)'; // trazo suave
export const P = 'rgba(8,30,28,0.32)'; // paneles oscuros translúcidos

export const estilo = (dur: string, retraso = 0): CSSProperties => ({ ['--dur' as string]: dur, animationDelay: `${retraso}s` });

/** Un engranaje con dientes cuadrados, centrado en 0,0 (se coloca con un transform). */
export function dientes(r: number, n: number): string {
  const h = r * 0.24;
  const pasos = n * 4;
  const pts: string[] = [];
  for (let i = 0; i < pasos; i++) {
    const a = (i / pasos) * Math.PI * 2;
    const rad = i % 4 === 1 || i % 4 === 2 ? r + h : r;
    pts.push(`${(rad * Math.cos(a)).toFixed(1)} ${(rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

export function Engranaje({ x, y, r, n, dur, inverso = false, relleno = B, hueco = 0.36 }: { x: number; y: number; r: number; n: number; dur: string; inverso?: boolean; relleno?: string; hueco?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={inverso ? 'gl-esc-gira-inv' : 'gl-esc-gira'} style={estilo(dur)}>
        <path d={dientes(r, n)} fill={relleno} />
        <circle r={r * hueco} fill="rgba(8,30,28,0.45)" />
        <circle r={r * 0.12} fill={relleno} />
      </g>
    </g>
  );
}

/** Un panel oscuro translúcido (ventana, tabla, tarjeta). */
export function Panel({ x, y, w, h, r = 5, children }: { x: number; y: number; w: number; h: number; r?: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={P} stroke={S} />
      {children}
    </g>
  );
}

export function Punto({ x, y, r = 3, color = B }: { x: number; y: number; r?: number; color?: string }) {
  return <circle cx={x} cy={y} r={r} fill={color} />;
}

/** Una lupa, centrada en su lente. */
export function Lupa({ x, y, dur = '4s', retraso = 0 }: { x: number; y: number; dur?: string; retraso?: number }) {
  return (
    <g className="gl-esc-flota" style={estilo(dur, retraso)} transform={`translate(${x} ${y})`}>
      <circle r={9} fill="rgba(255,255,255,0.18)" stroke={B} strokeWidth={2.4} />
      <path d="M6.5 6.5 L14 14" stroke={B} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  );
}

export function Moneda({ x, y, r = 7, dur = '3.6s', retraso = 0 }: { x: number; y: number; r?: number; dur?: string; retraso?: number }) {
  return (
    <g className="gl-esc-flota" style={estilo(dur, retraso)}>
      <circle cx={x} cy={y} r={r} fill="#FBBF24" stroke="rgba(0,0,0,0.14)" />
      <text x={x} y={y + r * 0.38} textAnchor="middle" fontSize={r * 1.15} fontWeight={800} fill="rgba(80,50,0,0.85)" fontFamily="Georgia, serif">$</text>
    </g>
  );
}

/** Un globo de texto con su colita. */
export function Burbuja({ x, y, w, h = 22, texto, relleno = B, color = 'rgba(8,60,56,0.92)', dur = '3.6s', retraso = 0, tam = 12 }: { x: number; y: number; w: number; h?: number; texto: string; relleno?: string; color?: string; dur?: string; retraso?: number; tam?: number }) {
  return (
    <g className="gl-esc-habla" style={estilo(dur, retraso)}>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={relleno} />
      <path d={`M${x + 9} ${y + h - 1} L${x + 5} ${y + h + 8} L${x + 20} ${y + h - 1} Z`} fill={relleno} />
      <text x={x + w / 2} y={y + h / 2 + tam * 0.36} textAnchor="middle" fontSize={tam} fontWeight={800} fill={color} fontFamily="system-ui, sans-serif">{texto}</text>
    </g>
  );
}

/** Un nodo de grafo o de red. */
export function Nodo({ x, y, r = 5, relleno = B, pulso = false, retraso = 0 }: { x: number; y: number; r?: number; relleno?: string; pulso?: boolean; retraso?: number }) {
  return <circle cx={x} cy={y} r={r} fill={relleno} className={pulso ? 'gl-esc-pulso' : undefined} style={pulso ? estilo('1.8s', retraso) : undefined} />;
}

/** Un grupo que gira alrededor del punto x,y (a diferencia de gl-esc-gira, que gira sobre su propio centro). */
export function Giro({ x, y, dur, inverso = false, children }: { x: number; y: number; dur: string; inverso?: boolean; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={inverso ? 'gl-esc-gira-inv' : 'gl-esc-gira'} style={{ ...estilo(dur), transformBox: 'view-box', transformOrigin: '0px 0px' }}>
        {children}
      </g>
    </g>
  );
}
