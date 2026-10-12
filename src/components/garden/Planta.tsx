import type { EtapaPlanta } from '../../services/usuariosServiceApi';
import { especieDeCategoria, type FormaPlanta, type PaletaPlanta } from '../../utils/jardin';

// Las plantas del jardín, en SVG (sin imágenes que descargar), con el mismo lenguaje de dibujo que el
// personaje del roadmap (Brote.tsx): hojas en forma de gota, flores de 5 pétalos, brillos al florecer. Son 5
// formas base (silueta de la planta) por 2 paletas de color — ver utils/jardin.ts para la combinación de cada
// categoría — así que son 10 especies con poco código: cada forma ya sabe dibujarse en sus 4 etapas.

interface Props {
  categoria: string;
  etapa: EtapaPlanta;
  /** Alto en píxeles; el ancho se calcula solo. */
  size?: number;
  celebra?: boolean;
  className?: string;
}

interface Paleta {
  hojaClara: string;
  hojaOscura: string;
  tallo: string;
  petalo: string;
  centro: string;
}

const PALETAS: Record<PaletaPlanta, Paleta> = {
  // cálida: la misma familia de verdes que Brote, con flores de coral y ámbar
  A: { hojaClara: '#3FBF7A', hojaOscura: '#2A8F58', tallo: '#2E9F5B', petalo: '#F2704E', centro: '#FBBF24' },
  // fresca: verdes más azulados (teal/menta), con flores rosa y oro pálido
  B: { hojaClara: '#5FD3C2', hojaOscura: '#0E8A7D', tallo: '#12A387', petalo: '#FF8FA3', centro: '#F5D98B' },
};

const HOJA = 'M0 0 C 7 -3, 13 -9, 14 -15 C 6 -15, 0.5 -9, 0 0 Z';

function Hoja({ x, y, giro, escala = 1, espejo = false, color }: { x: number; y: number; giro: number; escala?: number; espejo?: boolean; color: string }) {
  return <path d={HOJA} fill={color} transform={`translate(${x} ${y}) rotate(${espejo ? -giro : giro}) scale(${espejo ? -escala : escala} ${escala})`} />;
}

function HojaGorda({ x, y, giro, escala = 1, espejo = false, color }: { x: number; y: number; giro: number; escala?: number; espejo?: boolean; color: string }) {
  return (
    <ellipse
      cx={0}
      cy={-7}
      rx={3.4}
      ry={7.2}
      fill={color}
      transform={`translate(${x} ${y}) rotate(${espejo ? -giro : giro}) scale(${espejo ? -escala : escala} ${escala})`}
    />
  );
}

function Flor({ x, y, r, petalo, centro }: { x: number; y: number; r: number; petalo: string; centro: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r} rx={r * 0.6} ry={r * 0.88} fill={petalo} transform={`rotate(${a})`} />
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

interface Dibujo {
  tallo: { x: number; y: number }[];
  hojas: { x: number; y: number; giro: number; escala?: number; espejo?: boolean; gorda?: boolean }[];
  flores: { x: number; y: number; r: number }[];
}

const BASE_Y = 0; // de dónde nace cada tallo, relativo al suelo de la maceta

function dibujoDeForma(forma: FormaPlanta, etapa: EtapaPlanta): Dibujo {
  const vacio: Dibujo = { tallo: [], hojas: [], flores: [] };
  if (etapa === 'SEMILLA') return vacio;

  const brote = etapa === 'BROTE';

  switch (forma) {
    case 1: // tallo sencillo, una flor final arriba de todo
      return {
        tallo: [{ x: 0, y: brote ? 10 : 17 }],
        hojas: brote
          ? [{ x: 0, y: -8, giro: 22 }, { x: 0, y: -8, giro: 22, espejo: true }]
          : [
              { x: 0, y: -8, giro: 22 },
              { x: 0, y: -8, giro: 22, espejo: true },
              { x: 0, y: -14, giro: 18, escala: 1.05 },
              { x: 0, y: -14, giro: 18, escala: 1.05, espejo: true },
            ],
        flores: etapa === 'FLORECIDA' ? [{ x: 0, y: -19, r: 4.2 }] : [],
      };

    case 2: // arbusto: hojas en racimo, tres flores pequeñas al florecer
      return {
        tallo: [{ x: 0, y: brote ? 6 : 9 }],
        hojas: brote
          ? [{ x: 0, y: -6, giro: 50, escala: 0.8 }, { x: 0, y: -6, giro: 50, escala: 0.8, espejo: true }]
          : [
              { x: 0, y: -6, giro: 50, escala: 0.85 },
              { x: 0, y: -6, giro: 50, escala: 0.85, espejo: true },
              { x: 0, y: -6, giro: 85, escala: 0.95 },
              { x: 0, y: -6, giro: 85, escala: 0.95, espejo: true },
              { x: 0, y: -9, giro: 20, escala: 1 },
              { x: 0, y: -9, giro: 20, escala: 1, espejo: true },
            ],
        flores:
          etapa === 'FLORECIDA'
            ? [{ x: -6, y: -11, r: 2.6 }, { x: 6, y: -11, r: 2.6 }, { x: 0, y: -15, r: 3.4 }]
            : [],
      };

    case 3: // trepadora: hojas alternadas en zigzag, una flor cerca de la punta
      return {
        tallo: [{ x: 0, y: brote ? 12 : 21 }],
        hojas: brote
          ? [{ x: -3.5, y: -5, giro: -30, escala: 0.75 }, { x: 3.5, y: -9, giro: 30, escala: 0.75, espejo: true }]
          : [
              { x: -3.5, y: -5, giro: -30, escala: 0.8 },
              { x: 3.5, y: -9, giro: 30, escala: 0.8, espejo: true },
              { x: -4.5, y: -13, giro: -35, escala: 0.9 },
              { x: 4.5, y: -17, giro: 35, escala: 0.9, espejo: true },
            ],
        flores: etapa === 'FLORECIDA' ? [{ x: 3, y: -22, r: 3.6 }] : [],
      };

    case 4: {
      // suculenta: roseta baja de hojas gordas; solo al florecer sube una vara fina con una flor
      const altoRoseta = brote ? 3 : 4;
      return {
        tallo: etapa === 'FLORECIDA' ? [{ x: 0, y: altoRoseta }, { x: 0, y: 17 }] : [{ x: 0, y: altoRoseta }],
        hojas: brote
          ? [
              { x: 0, y: -3, giro: 60, escala: 0.85, gorda: true },
              { x: 0, y: -3, giro: 60, escala: 0.85, espejo: true, gorda: true },
            ]
          : [
              { x: 0, y: -3, giro: 60, escala: 0.95, gorda: true },
              { x: 0, y: -3, giro: 60, escala: 0.95, espejo: true, gorda: true },
              { x: 0, y: -3, giro: 95, escala: 1, gorda: true },
              { x: 0, y: -3, giro: 95, escala: 1, espejo: true, gorda: true },
              { x: 0, y: -4, giro: 20, escala: 0.8, gorda: true },
              { x: 0, y: -4, giro: 20, escala: 0.8, espejo: true, gorda: true },
            ],
        flores: etapa === 'FLORECIDA' ? [{ x: 0, y: -19, r: 4 }] : [],
      };
    }

    case 5: // flor doble: dos tallos cortos, cada uno con su propia flor al florecer
      return {
        tallo: [{ x: -5, y: brote ? 9 : 14 }, { x: 5, y: brote ? 9 : 14 }],
        hojas: brote
          ? [{ x: -5, y: -9, giro: 20, escala: 0.75, espejo: true }, { x: 5, y: -9, giro: 20, escala: 0.75 }]
          : [
              { x: -5, y: -9, giro: 20, escala: 0.8, espejo: true },
              { x: 5, y: -9, giro: 20, escala: 0.8 },
              { x: -5, y: -13, giro: 15, escala: 0.95 },
              { x: 5, y: -13, giro: 15, escala: 0.95, espejo: true },
            ],
        flores: etapa === 'FLORECIDA' ? [{ x: -5, y: -15, r: 3.4 }, { x: 5, y: -15, r: 3.4 }] : [],
      };
  }
}

const BORDE_BANCAL = '#A66A42';
const TIERRA = '#6B4A32';

/** Planta de la especie que toca según la categoría, en la etapa que diga el backend. */
export default function Planta({ categoria, etapa, size = 72, celebra = false, className = '' }: Props) {
  const { forma, paleta } = especieDeCategoria(categoria);
  const col = PALETAS[paleta];
  const dibujo = dibujoDeForma(forma, etapa);
  const florecida = etapa === 'FLORECIDA';

  return (
    <svg
      viewBox="0 0 100 112"
      height={size}
      width={(size * 100) / 112}
      role="img"
      aria-label={`Planta en etapa ${etapa.toLowerCase()}`}
      className={`${florecida && celebra ? 'gl-pop-in' : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* bancal de tierra a ras de suelo, para integrarse en la escena del jardín */}
      <ellipse cx={50} cy={84} rx={26} ry={9.5} fill={BORDE_BANCAL} />
      <ellipse cx={50} cy={79} rx={19} ry={5} fill={TIERRA} />

      {etapa === 'SEMILLA' && (
        <ellipse cx={50} cy={78} rx={4.6} ry={3.4} fill="#D9C08F" stroke={col.hojaOscura} strokeWidth={1} />
      )}

      {etapa !== 'SEMILLA' && (
        <g>
          {dibujo.tallo.map((t, i) => (
            <path key={i} d={`M${50 + t.x} 79 L${50 + t.x} ${79 - t.y}`} stroke={col.tallo} strokeWidth={2.2} strokeLinecap="round" />
          ))}
          {dibujo.hojas.map((h, i) =>
            h.gorda ? (
              <HojaGorda key={i} x={50 + h.x} y={79 + h.y} giro={h.giro} escala={h.escala} espejo={h.espejo} color={i % 2 === 0 ? col.hojaClara : col.hojaOscura} />
            ) : (
              <Hoja key={i} x={50 + h.x} y={79 + h.y} giro={h.giro} escala={h.escala} espejo={h.espejo} color={i % 2 === 0 ? col.hojaClara : col.hojaOscura} />
            )
          )}
          {dibujo.flores.map((f, i) => (
            <Flor key={i} x={50 + f.x} y={79 + f.y} r={f.r} petalo={col.petalo} centro={col.centro} />
          ))}
          {florecida && (
            <>
              <Brillo x={32} y={62} s={1.05} />
              <Brillo x={68} y={58} s={0.85} retraso={0.7} />
              <Brillo x={50} y={48} s={0.75} retraso={1.3} />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

/** Ícono de semilla sin plantar, para el semillero — tiñe su color con la especie de la categoría. */
export function SemillaIcono({ categoria, size = 36, className = '' }: { categoria: string; size?: number; className?: string }) {
  const { paleta } = especieDeCategoria(categoria);
  const col = PALETAS[paleta];
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="Semilla sin plantar" className={className}>
      <ellipse cx={16} cy={17} rx={9} ry={12} fill="#D9C08F" stroke={col.hojaOscura} strokeWidth={1.4} />
      <path d="M16 6 Q19 12 16 28" stroke={col.hojaOscura} strokeWidth={1} fill="none" opacity={0.5} />
      <ellipse cx={13} cy={11} rx={2.2} ry={3.4} fill={col.hojaClara} opacity={0.85} transform="rotate(-20 13 11)" />
    </svg>
  );
}

/** Bancal vacío, para los espacios libres del jardín. */
export function MacetaVacia({ size = 72, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 112" height={size} width={(size * 100) / 112} role="img" aria-label="Espacio libre" className={className} style={{ overflow: 'visible' }}>
      <ellipse cx={50} cy={84} rx={26} ry={9.5} fill="none" stroke="#C7D1CB" strokeWidth={1.6} strokeDasharray="5 5" />
    </svg>
  );
}
