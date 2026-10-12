import { useMemo, type ReactElement } from 'react';
import { useTheme } from '../../store/ThemeContext';
import type { PlantaJardin } from '../../services/usuariosServiceApi';
import Planta, { MacetaVacia } from './Planta';
import { ETAPA_LABEL } from '../../utils/jardin';

// El jardín como una escena de juego: césped a cuadros, cerca de madera alrededor y los 6 bancales en una
// grilla prolija de parcelas de tierra — como en los juegos de jardín (Merge Flora, Plants vs. Zombies), pero
// con la paleta serena de GrowLink. Todo sigue siendo SVG por código (nada de imágenes externas, igual que
// Brote o el mapa del roadmap), así se ve bien en modo oscuro y no pesa.

interface Props {
  plantaPorEspacio: Map<number, PlantaJardin>;
  totalEspacios: number;
  puedePlantar: boolean;
  plantando: boolean;
  regandoId: number | null;
  gotaEnEspacio: number | null;
  onClickEspacio: (num: number) => void;
}

const W = 760;
const H = 520;
const FENCE = 30;
const TILE = 148;

// grilla prolija de 3 columnas x 2 filas, en el mismo orden que manda el backend (espacio 0 a 5)
const COLS = [168, 380, 592];
const ROWS = [192, 378];
const POSICIONES: { x: number; y: number }[] = ROWS.flatMap((y) => COLS.map((x) => ({ x, y })));

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PaletaEscena {
  pasto1: string;
  pasto2: string;
  tierra: string;
  tierraBorde: string;
  tierraSombra: string;
  valla: string;
  vallaSombra: string;
  arbusto1: string;
  arbusto2: string;
  flor: string[];
}

const PALETAS: Record<'light' | 'dark', PaletaEscena> = {
  light: {
    pasto1: '#8FD15C',
    pasto2: '#7CC24C',
    tierra: '#8B5E3C',
    tierraBorde: '#6B4426',
    tierraSombra: 'rgba(0,0,0,0.18)',
    valla: '#F2EADA',
    vallaSombra: '#D6C9A8',
    arbusto1: '#3FBF7A',
    arbusto2: '#2FAE6C',
    flor: ['#F2704E', '#F5A524', '#FF8FA3', '#FFFFFF'],
  },
  dark: {
    pasto1: '#1F4A2C',
    pasto2: '#193F25',
    tierra: '#5A3C26',
    tierraBorde: '#3C2814',
    tierraSombra: 'rgba(0,0,0,0.35)',
    valla: '#5C6B63',
    vallaSombra: '#3F4A45',
    arbusto1: '#1E8F6A',
    arbusto2: '#17755A',
    flor: ['#C9603C', '#C98A1E', '#C97690', '#D9D9C8'],
  },
};

/** Una estaca de la cerca, con puntita — para el riel de arriba y el de abajo. */
function Estaca({ x, y, pal }: { x: number; y: number; pal: PaletaEscena }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-4.5} y={-22} width={9} height={22} rx={2} fill={pal.valla} stroke={pal.vallaSombra} strokeWidth={1} />
      <path d="M-4.5 -22 L0 -29 L4.5 -22 Z" fill={pal.valla} stroke={pal.vallaSombra} strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
}

/** Un poste derecho, sin punta — para los rieles de los costados (una estaca rotada se veía como escalera). */
function Poste({ x, y, pal }: { x: number; y: number; pal: PaletaEscena }) {
  return <rect x={x - 4.5} y={y - 11} width={9} height={22} rx={3} fill={pal.valla} stroke={pal.vallaSombra} strokeWidth={1} />;
}

/** Cerca de madera alrededor de todo el jardín: estacas con punta arriba/abajo, postes derechos a los costados. */
function Cerca({ pal }: { pal: PaletaEscena }) {
  const paso = 22;
  const estacas: ReactElement[] = [];
  const postes: ReactElement[] = [];
  let key = 0;
  for (let x = FENCE / 2; x <= W - FENCE / 2; x += paso) estacas.push(<Estaca key={key++} x={x} y={FENCE} pal={pal} />);
  for (let x = FENCE / 2; x <= W - FENCE / 2; x += paso) estacas.push(<Estaca key={key++} x={x} y={H - FENCE + 10} pal={pal} />);
  for (let y = FENCE + paso; y <= H - FENCE - paso / 2; y += paso) postes.push(<Poste key={key++} x={FENCE} y={y} pal={pal} />);
  for (let y = FENCE + paso; y <= H - FENCE - paso / 2; y += paso) postes.push(<Poste key={key++} x={W - FENCE} y={y} pal={pal} />);
  return (
    <g>
      <rect x={FENCE / 2 - 2} y={FENCE - 11} width={W - FENCE + 4} height={5} rx={2.5} fill={pal.vallaSombra} />
      <rect x={FENCE / 2 - 2} y={H - FENCE - 1} width={W - FENCE + 4} height={5} rx={2.5} fill={pal.vallaSombra} />
      <rect x={FENCE - 2.5} y={FENCE} width={5} height={H - 2 * FENCE} rx={2.5} fill={pal.vallaSombra} />
      <rect x={W - FENCE - 2.5} y={FENCE} width={5} height={H - 2 * FENCE} rx={2.5} fill={pal.vallaSombra} />
      {postes}
      {estacas}
    </g>
  );
}

function Arbusto({ x, y, s, pal }: { x: number; y: number; s: number; pal: PaletaEscena }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={26} rx={30} ry={7} fill="#000" opacity={0.12} />
      <circle cx={-16} cy={4} r={20} fill={pal.arbusto2} />
      <circle cx={16} cy={4} r={20} fill={pal.arbusto2} />
      <circle cx={0} cy={-10} r={24} fill={pal.arbusto1} />
    </g>
  );
}

/** Pasto a cuadros, como en el jardín de la referencia — alterna dos verdes en una grilla pareja. */
function Pasto({ pal }: { pal: PaletaEscena }) {
  const celda = 38;
  const cuadros: ReactElement[] = [];
  let fila = 0;
  for (let y = FENCE; y < H - FENCE; y += celda, fila++) {
    let col = 0;
    for (let x = FENCE; x < W - FENCE; x += celda, col++) {
      cuadros.push(<rect key={`${fila}-${col}`} x={x} y={y} width={celda + 0.5} height={celda + 0.5} fill={(fila + col) % 2 === 0 ? pal.pasto1 : pal.pasto2} />);
    }
  }
  return <g>{cuadros}</g>;
}

function fondoDecorativo(pal: PaletaEscena): ReactElement[] {
  const rand = mulberry32(11);
  const els: ReactElement[] = [];
  els.push(<Arbusto key="b1" x={92} y={96} s={0.85} pal={pal} />);
  els.push(<Arbusto key="b2" x={W - 92} y={96} s={0.95} pal={pal} />);
  els.push(<Arbusto key="b3" x={92} y={H - 96} s={0.7} pal={pal} />);
  els.push(<Arbusto key="b4" x={W - 92} y={H - 96} s={0.8} pal={pal} />);
  // un par de florcitas sueltas en el pasto, lejos de las parcelas
  for (let i = 0; i < 4; i++) {
    const x = 60 + rand() * (W - 120);
    const y = i % 2 === 0 ? FENCE + 26 : H - FENCE - 26;
    const cerca = POSICIONES.some((p) => Math.hypot(p.x - x, p.y - y) < TILE * 0.8);
    if (cerca) continue;
    els.push(<circle key={`f${i}`} cx={x} cy={y} r={3.4} fill={pal.flor[i % pal.flor.length]} />);
  }
  return els;
}

export default function EscenaJardin({ plantaPorEspacio, totalEspacios, puedePlantar, plantando, regandoId, gotaEnEspacio, onClickEspacio }: Props) {
  const { isDark } = useTheme();
  const pal = PALETAS[isDark ? 'dark' : 'light'];
  const decoracion = useMemo(() => fondoDecorativo(pal), [pal]);

  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;

  const espacios = Array.from({ length: Math.min(totalEspacios, POSICIONES.length) }, (_, i) => i);

  return (
    <div className="relative w-full max-w-[820px] mx-auto overflow-hidden rounded-2xl select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect x={0} y={0} width={W} height={H} fill={pal.valla} />
        <Pasto pal={pal} />
        {decoracion}
        <Cerca pal={pal} />
        {/* parcela de tierra de cada bancal: un cuadro con marco, para que cada espacio se note clarito */}
        {espacios.map((num) => {
          const pos = POSICIONES[num];
          return (
            <g key={num}>
              <rect x={pos.x - TILE / 2 + 4} y={pos.y - TILE / 2 + 7} width={TILE} height={TILE} rx={14} fill={pal.tierraSombra} />
              <rect x={pos.x - TILE / 2} y={pos.y - TILE / 2} width={TILE} height={TILE} rx={14} fill={pal.tierraBorde} />
              <rect x={pos.x - TILE / 2 + 6} y={pos.y - TILE / 2 + 6} width={TILE - 12} height={TILE - 12} rx={10} fill={pal.tierra} />
            </g>
          );
        })}
      </svg>

      {espacios.map((num) => {
        const pos = POSICIONES[num];
        const planta = plantaPorEspacio.get(num);
        const ocupado = planta !== undefined;
        const puedeInteractuar = ocupado ? planta.etapa !== 'FLORECIDA' && regandoId === null : puedePlantar && !plantando;

        return (
          <button
            key={num}
            type="button"
            onClick={() => onClickEspacio(num)}
            disabled={ocupado ? regandoId !== null : !puedePlantar || plantando}
            title={ocupado ? (planta.etapa !== 'FLORECIDA' ? 'Tocar para regar (gasta una gota)' : 'Esta planta ya floreció') : puedePlantar ? 'Plantar aquí' : 'Espacio libre'}
            className={`absolute flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform ${
              puedeInteractuar ? 'hover:scale-105' : 'cursor-default'
            } disabled:cursor-default`}
            style={{ left: pctX(pos.x), top: pctY(pos.y), width: `${(TILE / W) * 100}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              {gotaEnEspacio === num && (
                <svg viewBox="0 0 24 24" fill="#5FD3C2" className="absolute left-1/2 -translate-x-1/2 w-5 h-5 pointer-events-none z-10" style={{ top: '-30%', animation: 'escCae 0.65s ease-in forwards' }} aria-hidden="true">
                  <path d="M12 2.5c3 4.2 7 9 7 12.8a7 7 0 11-14 0c0-3.8 4-8.6 7-12.8Z" />
                </svg>
              )}
              {ocupado ? <Planta categoria={planta.categoria} etapa={planta.etapa} size={78} celebra={regandoId === planta.id} /> : <MacetaVacia size={66} />}
            </div>
            <div
              className={`rounded-lg px-2 py-1 text-center shadow-sm border ${
                ocupado && planta.etapa === 'FLORECIDA'
                  ? 'bg-[#FFFBEB]/95 dark:bg-[#3A2A0D]/90 border-[#F5A524]/50'
                  : 'bg-white/90 dark:bg-[#15231F]/85 border-[#E1E6DF]/70 dark:border-[#27403A]/70'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight">
                {ocupado ? ETAPA_LABEL[planta.etapa] : puedePlantar ? 'Plantar aquí' : 'Libre'}
              </p>
              {ocupado && (
                <p className="text-[9px] sm:text-[10px] text-[#6B7A74] dark:text-[#98B0A6] leading-tight">
                  {planta.etapa === 'FLORECIDA' ? '¡Floreció!' : `${planta.riegos} de ${planta.riegosNecesarios} riegos`}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
