import type { ReactElement } from 'react';
import type { AccesorioId, Genero } from '../../utils/personaje';

// El personaje del roadmap, dibujado en SVG (sin imágenes que descargar). Cambia de forma según el rango (1 semilla
// … 5 florecido), de rostro según sea ella o él, y lleva los accesorios que ganó con cada área.

interface Props {
  genero: Genero;
  rango: number;
  accesorios: AccesorioId[];
  /** Alto en píxeles; el ancho se calcula solo. */
  size?: number;
  camina?: boolean;
  celebra?: boolean;
  className?: string;
}

const HOJA = 'M0 0 C 7 -3, 13 -9, 14 -15 C 6 -15, 0.5 -9, 0 0 Z';

function Hoja({ x, y, giro, escala = 1, espejo = false, color = '#3FBF7A' }: { x: number; y: number; giro: number; escala?: number; espejo?: boolean; color?: string }) {
  return (
    <path d={HOJA} fill={color} stroke="#2A8F58" strokeWidth={0.7} transform={`translate(${x} ${y}) rotate(${espejo ? -giro : giro}) scale(${espejo ? -escala : escala} ${escala})`} />
  );
}

function Flor({ x, y, r = 3.2, petalo = '#F2704E', centro = '#FBBF24' }: { x: number; y: number; r?: number; petalo?: string; centro?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r} rx={r * 0.62} ry={r * 0.9} fill={petalo} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.55} fill={centro} />
    </g>
  );
}

function Brillo({ x, y, s = 1, retraso = 0 }: { x: number; y: number; s?: number; retraso?: number }) {
  return (
    <path
      d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"
      fill="#FFF3B0"
      transform={`translate(${x} ${y}) scale(${s})`}
      className="gl-art-spark"
      style={{ ['--dur' as string]: '2.2s', animationDelay: `${retraso}s` }}
    />
  );
}

function Brote({ genero, rango, accesorios, size = 64, camina = false, celebra = false, className = '' }: Props) {
  const tiene = (id: AccesorioId) => accesorios.includes(id);
  const casco = tiene('casco');
  const by = casco ? 25 : 31; // de dónde nace el brote
  const ella = genero === 'ella';
  const cuerpoDe = ella ? '#7AEBA5' : '#62DCC4';
  const cuerpoA = ella ? '#12C2A8' : '#0E9C8A';

  let hojas: ReactElement;
  if (rango <= 1) {
    hojas = (
      <>
        <path d={`M32 ${by} L32 ${by - 6}`} stroke="#2E9F5B" strokeWidth={2.2} strokeLinecap="round" />
        <Hoja x={32} y={by - 6} giro={20} escala={0.7} />
        {!casco && <path d="M23.5 33 Q32 24 40.5 33 Q32 29.5 23.5 33 Z" fill="#B8864B" />}
      </>
    );
  } else if (rango === 2) {
    hojas = (
      <>
        <path d={`M32 ${by} L32 ${by - 9}`} stroke="#2E9F5B" strokeWidth={2.4} strokeLinecap="round" />
        <Hoja x={32} y={by - 9} giro={25} escala={0.95} />
        <Hoja x={32} y={by - 9} giro={25} escala={0.95} espejo />
      </>
    );
  } else if (rango === 3) {
    hojas = (
      <>
        <path d={`M32 ${by} L32 ${by - 13}`} stroke="#2E9F5B" strokeWidth={2.6} strokeLinecap="round" />
        <Hoja x={32} y={by - 6} giro={55} escala={0.85} espejo color="#2FAE6C" />
        <Hoja x={32} y={by - 6} giro={55} escala={0.85} color="#2FAE6C" />
        <Hoja x={32} y={by - 13} giro={18} escala={1.05} />
        <Hoja x={32} y={by - 13} giro={18} escala={1.05} espejo />
        <circle cx={32} cy={by - 15.5} r={2.6} fill="#F2704E" />
      </>
    );
  } else if (rango === 4) {
    hojas = (
      <>
        <path d={`M32 ${by} L32 ${by - 14}`} stroke="#2E9F5B" strokeWidth={2.8} strokeLinecap="round" />
        <Hoja x={32} y={by - 5} giro={60} escala={0.95} espejo color="#2FAE6C" />
        <Hoja x={32} y={by - 5} giro={60} escala={0.95} color="#2FAE6C" />
        <Hoja x={32} y={by - 11} giro={28} escala={1.1} espejo />
        <Hoja x={32} y={by - 11} giro={28} escala={1.1} />
        <Flor x={32} y={by - 17} r={3.6} />
      </>
    );
  } else {
    hojas = (
      <>
        <path d={`M32 ${by} L32 ${by - 14}`} stroke="#2E9F5B" strokeWidth={3} strokeLinecap="round" />
        <Hoja x={32} y={by - 5} giro={62} escala={1} espejo color="#2FAE6C" />
        <Hoja x={32} y={by - 5} giro={62} escala={1} color="#2FAE6C" />
        <Hoja x={32} y={by - 10} giro={30} escala={1.1} espejo />
        <Hoja x={32} y={by - 10} giro={30} escala={1.1} />
        <Flor x={32} y={by - 18} r={4.6} petalo="#FF8FA3" />
        <Flor x={21} y={by - 9} r={2.4} petalo="#FBBF24" centro="#F2704E" />
        <Flor x={43} y={by - 9} r={2.4} petalo="#FBBF24" centro="#F2704E" />
        <Brillo x={13} y={by - 14} s={1.1} />
        <Brillo x={51} y={by - 18} s={0.9} retraso={0.8} />
        <Brillo x={32} y={by - 32} s={0.8} retraso={1.4} />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 64 84"
      height={size}
      width={(size * 64) / 84}
      className={`${camina ? 'gl-brote-camina' : ''} ${celebra ? 'gl-brote-celebra' : ''} ${className}`}
      role="img"
      aria-label={`Tu personaje: ${ella ? 'ella' : 'él'}, rango ${rango}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`brote-cuerpo-${genero}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cuerpoDe} />
          <stop offset="1" stopColor={cuerpoA} />
        </linearGradient>
      </defs>
      <ellipse cx={32} cy={79} rx={15} ry={3} fill="#000" opacity={0.25} />

      <g className="gl-brote-todo" style={{ transformOrigin: '32px 76px' }}>
        {tiene('mochila') && (
          <>
            <rect x={43} y={42} width={16} height={24} rx={6.5} fill="#F2704E" stroke="#C9503A" strokeWidth={0.8} />
            <rect x={46} y={49} width={10} height={6} rx={2} fill="#C9503A" opacity={0.7} />
          </>
        )}

        <ellipse className="gl-brote-pie-i" cx={24} cy={74} rx={6.4} ry={3.4} fill="#1F8F66" />
        <ellipse className="gl-brote-pie-d" cx={40} cy={74} rx={6.4} ry={3.4} fill="#1F8F66" />

        <g className="gl-brote-cuerpo">
          <ellipse cx={13.5} cy={56} rx={4.6} ry={7.4} fill={cuerpoA} transform="rotate(20 13.5 56)" />
          <ellipse cx={50.5} cy={56} rx={4.6} ry={7.4} fill={cuerpoA} transform="rotate(-20 50.5 56)" />
          <ellipse cx={32} cy={52} rx={18.5} ry={21.5} fill={`url(#brote-cuerpo-${genero})`} stroke="#0E8A6E" strokeWidth={0.8} />
          <ellipse cx={32} cy={59} rx={11.5} ry={12} fill="#fff" opacity={0.16} />

          {/* cara */}
          <ellipse cx={25} cy={46} rx={2.7} ry={3.5} fill="#10302A" />
          <ellipse cx={39} cy={46} rx={2.7} ry={3.5} fill="#10302A" />
          <circle cx={24.2} cy={44.7} r={1} fill="#fff" />
          <circle cx={38.2} cy={44.7} r={1} fill="#fff" />
          <circle cx={19.8} cy={52} r={3} fill="#F2704E" opacity={0.32} />
          <circle cx={44.2} cy={52} r={3} fill="#F2704E" opacity={0.32} />
          <path d="M28.2 52.6 Q32 56.6 35.8 52.6" stroke="#10302A" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          {ella ? (
            <>
              <path d="M21.4 43.4 L23 44.6 M20.8 46.4 L22.6 46.6" stroke="#10302A" strokeWidth={1.1} strokeLinecap="round" />
              <path d="M42.6 43.4 L41 44.6 M43.2 46.4 L41.4 46.6" stroke="#10302A" strokeWidth={1.1} strokeLinecap="round" />
            </>
          ) : (
            <path d="M21.5 40.4 L28 39.2 M36 39.2 L42.5 40.4" stroke="#10302A" strokeWidth={1.6} strokeLinecap="round" />
          )}

          {/* ropa y accesorios */}
          {!ella && <path d="M17.5 59.5 Q32 66 46.5 59.5 L44.8 63.6 Q32 70 19.2 63.6 Z" fill="#F5A524" stroke="#C9810E" strokeWidth={0.6} />}
          {tiene('gafas') && (
            <g fill="rgba(255,255,255,0.2)" stroke="#1F2D2A" strokeWidth={1.5}>
              <circle cx={25} cy={46} r={5.6} />
              <circle cx={39} cy={46} r={5.6} />
              <path d="M30.6 46 L33.4 46" fill="none" />
            </g>
          )}
          {tiene('laptop') && (
            <g>
              <rect x={22} y={63.5} width={20} height={8.5} rx={1.6} fill="#1B2B28" stroke="#CFE3F0" strokeWidth={1} />
              <path d="M25 66.5 H34 M25 69 H30" stroke="#5FD3C2" strokeWidth={1.1} strokeLinecap="round" />
              <path d="M19 72.6 L45 72.6 L43 74.4 L21 74.4 Z" fill="#9FB0C7" />
            </g>
          )}
          {tiene('maletin') && (
            <g>
              <path d="M51 61.5 v-3.2 h6.4 v3.2" stroke="#5E3D29" strokeWidth={1.4} fill="none" />
              <rect x={48} y={61.5} width={13} height={10} rx={2} fill="#8B5A3C" stroke="#5E3D29" strokeWidth={0.8} />
              <rect x={53.2} y={64.4} width={2.6} height={2.6} rx={0.6} fill="#F5D98B" />
            </g>
          )}
          {tiene('mochila') && <path d="M24.5 40 Q27.5 52 25.5 63" stroke="#C9503A" strokeWidth={2.4} strokeLinecap="round" fill="none" />}
          {tiene('medalla') && (
            <g>
              <path d="M22 56.5 L23.6 60.5 M27 56.5 L25.4 60.5" stroke="#F2704E" strokeWidth={1.8} />
              <circle cx={24.5} cy={62.4} r={3.3} fill="#F5D98B" stroke="#C9962B" strokeWidth={0.9} />
            </g>
          )}
        </g>

        {/* sobre la cabeza */}
        {casco && (
          <g>
            <path d="M20.5 36.5 Q32 20 43.5 36.5 Z" fill="#F5C13A" stroke="#C99A16" strokeWidth={0.8} />
            <rect x={18} y={35.4} width={28} height={3.6} rx={1.8} fill="#E0A91B" />
            <path d="M32 24 V35.6" stroke="#C99A16" strokeWidth={1} />
          </g>
        )}
        {ella && (
          <g transform={`translate(22.5 ${by + 1})`}>
            <path d="M0 0 L-6 -4 L-6 4 Z M0 0 L6 -4 L6 4 Z" fill="#F2704E" stroke="#C9503A" strokeWidth={0.6} />
            <circle r={1.7} fill="#C9503A" />
          </g>
        )}
        <g className="gl-brote-hojas" style={{ transformOrigin: `32px ${by}px` }}>
          {hojas}
        </g>
      </g>
    </svg>
  );
}

export default Brote;
