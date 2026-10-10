import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTheme } from '../../store/ThemeContext';
import { loQueAbre } from '../../utils/motivacion';
import type { NodeStatus, RoadmapNode, RoadmapView } from '../../utils/roadmapModel';

// El mapa del roadmap: el mismo caminito ilustrado, pero armado como un tablero en serpentina (el camino va y
// vuelve por filas) en vez de una tira vertical. Entra en mucho menos alto, y cada parada es una tarjeta con lo
// que importa a simple vista: nivel, horas, estado y cuántos cursos abre. Al pasar el cursor sale el detalle
// (por qué está, temas, habilidades); al tocar, se abre el panel completo.

interface Props {
  vista: RoadmapView;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

interface Pt {
  x: number;
  y: number;
}

const PALETAS = {
  light: {
    bgTop: '#DDF5EA', bgBottom: '#BDEAD3', hill: '#A8E2C2', hill2: '#93D8B2',
    mountain: '#86BAD6', mountain2: '#659DC2', snow: '#FFFFFF',
    tree1: '#2FBF7A', tree2: '#4CE07E', tree3: '#12A387', trunk: '#8B6B4A',
    river: '#7CC7F0', road: '#F7F0D8', roadEdge: '#D2C596', dash: '#FFFFFF',
    wall: '#F6CE86', roof: '#E8604C', door: '#8B5A3C', stone: '#C9D3E2', stoneDark: '#9FB0C7',
    cloud: 'rgba(255,255,255,0.85)',
  },
  dark: {
    bgTop: '#0C2B2F', bgBottom: '#0B3A3C', hill: '#0F4A4C', hill2: '#125A58',
    mountain: '#1B5568', mountain2: '#13404F', snow: '#CFE3F0',
    tree1: '#1E8F6A', tree2: '#2BB67D', tree3: '#12766F', trunk: '#5B4A3A',
    river: '#1F7FB0', road: '#D6D1B6', roadEdge: '#8F8A6E', dash: '#F4F1E0',
    wall: '#C9A468', roof: '#B84A3C', door: '#5E3D29', stone: '#8FA2BC', stoneDark: '#647A98',
    cloud: 'rgba(214, 235, 226, 0.14)',
  },
};

const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

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

// curva suave que pasa por todos los puntos (Catmull-Rom convertida a Bézier)
function tramo(p: Pt[], i: number): { c1: Pt; c2: Pt; fin: Pt } {
  const p0 = p[Math.max(0, i - 1)];
  const p1 = p[i];
  const p2 = p[i + 1];
  const p3 = p[Math.min(p.length - 1, i + 2)];
  return {
    c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
    fin: p2,
  };
}

function bezier(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

const TOKEN = 56;
const ALTO_FILA = 208;
const ARRIBA = 150;

const ESTADO_CHIP: Record<NodeStatus, string> = {
  completed: 'bg-[#4CE07E]/20 text-[#15803D] dark:text-[#4CE07E]',
  current: 'bg-[#F5A524]/25 text-[#B45309] dark:text-[#FBBF24]',
  available: 'bg-[#12C2A8]/15 text-[#0B6F65] dark:text-[#5FD3C2]',
  locked: 'bg-[#EDF1EA] dark:bg-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]',
  unavailable: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171]',
};

function textoDeEstado(n: RoadmapNode): string {
  switch (n.status) {
    case 'completed':
      return 'Aprobado';
    case 'current':
      return 'Tu siguiente paso';
    case 'available':
      return 'Listo para ti';
    case 'unavailable':
      return 'Ya no disponible';
    default: {
      const falta = n.prerequisitos.find((p) => !p.hecho);
      return falta ? `Antes: ${falta.titulo}` : 'Bloqueado';
    }
  }
}

export default function AventuraMap({ vista, selectedId, onSelect }: Props) {
  const { isDark } = useTheme();
  const pal = isDark ? PALETAS.dark : PALETAS.light;
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(760);
  const [sobre, setSobre] = useState<number | null>(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setAncho(Math.max(300, Math.round(el.getBoundingClientRect().width)));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // por etapa y, dentro de cada una, en el orden sugerido: así las etiquetas de etapa nunca se cruzan
  const nodos = useMemo(() => [...vista.nodes].sort((a, b) => a.etapa - b.etapa || a.orden - b.orden), [vista.nodes]);
  const porId = useMemo(() => new Map(nodos.map((n) => [n.cursoId, n])), [nodos]);
  const columnas = Math.min(nodos.length || 1, ancho >= 760 ? 4 : ancho >= 520 ? 3 : 2);

  const diseno = useMemo(() => {
    const margen = 18;
    const ranura = (ancho - margen * 2) / columnas;
    const filas = Math.ceil(nodos.length / columnas);
    const puntos: Pt[] = nodos.map((_, i) => {
      const f = Math.floor(i / columnas);
      const c = i % columnas;
      const col = f % 2 === 0 ? c : columnas - 1 - c;
      return { x: margen + ranura * (col + 0.5), y: ARRIBA + f * ALTO_FILA + (i % 2 === 0 ? 0 : 20) };
    });

    // el camino: casa -> paradas (con una vuelta en U al final de cada fila) -> castillo
    const ruta: { p: Pt; nodo: number | null }[] = [];
    const casa: Pt = { x: puntos[0]?.x ?? ancho / 2, y: ARRIBA - 92 };
    ruta.push({ p: casa, nodo: null });
    nodos.forEach((_, i) => {
      ruta.push({ p: puntos[i], nodo: i });
      const f = Math.floor(i / columnas);
      const ultimaDeFila = (i + 1) % columnas === 0 && i < nodos.length - 1;
      if (ultimaDeFila) {
        const haciaDerecha = f % 2 === 0;
        ruta.push({ p: { x: haciaDerecha ? ancho - 10 : 10, y: puntos[i].y + ALTO_FILA * 0.62 }, nodo: null });
      }
    });
    const ult = puntos[nodos.length - 1] ?? casa;
    const filaUlt = Math.floor((nodos.length - 1) / columnas);
    const huecoEnFila = nodos.length % columnas !== 0;
    const haciaDerechaUlt = filaUlt % 2 === 0;
    const castillo: Pt = huecoEnFila
      ? { x: ult.x + (haciaDerechaUlt ? ranura : -ranura), y: ult.y - 4 }
      : { x: ult.x, y: ult.y + ALTO_FILA * 0.74 };
    ruta.push({ p: castillo, nodo: null });

    const alto = Math.max(castillo.y + 120, ARRIBA + (filas - 1) * ALTO_FILA + 250);
    return { puntos, ruta, casa, castillo, alto, ranura };
  }, [nodos, columnas, ancho]);

  const { puntos, ruta, casa, castillo, alto, ranura } = diseno;
  const pts = ruta.map((r) => r.p);

  const caminoD = useMemo(() => {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const t = tramo(pts, i);
      d += ` C ${t.c1.x} ${t.c1.y}, ${t.c2.x} ${t.c2.y}, ${t.fin.x} ${t.fin.y}`;
    }
    return d;
  }, [pts]);

  // lo andado: el verde llega hasta la última parada aprobada o la actual
  const hastaWp = useMemo(() => {
    let mejor = 0;
    ruta.forEach((r, wp) => {
      if (r.nodo !== null && (nodos[r.nodo].status === 'completed' || nodos[r.nodo].status === 'current')) mejor = wp;
    });
    return mejor;
  }, [ruta, nodos]);

  const andadoD = useMemo(() => {
    if (hastaWp === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < hastaWp; i++) {
      const t = tramo(pts, i);
      d += ` C ${t.c1.x} ${t.c1.y}, ${t.c2.x} ${t.c2.y}, ${t.fin.x} ${t.fin.y}`;
    }
    return d;
  }, [pts, hastaWp]);

  const paisaje = useMemo(() => {
    const rand = mulberry32(nodos.length * 7919 + Math.round(ancho / 40));
    const muestras: Pt[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const t = tramo(pts, i);
      for (let k = 0; k <= 1; k += 1 / 18) muestras.push(bezier(pts[i], t.c1, t.c2, t.fin, k));
    }
    const els: ReactElement[] = [];
    let key = 0;

    for (let y = 300; y < alto; y += 380) {
      const izq = ((y / 380) | 0) % 2 === 0;
      els.push(<ellipse key={key++} cx={izq ? 20 : ancho - 20} cy={y} rx={200} ry={120} fill={pal.hill} opacity={0.7} />);
      els.push(<ellipse key={key++} cx={izq ? ancho - 30 : 40} cy={y + 170} rx={180} ry={100} fill={pal.hill2} opacity={0.55} />);
    }

    // cordillera de arriba
    const n = Math.ceil(ancho / 150) + 1;
    for (let i = 0; i < n; i++) {
      const cx = i * (ancho / (n - 1)) + (rand() - 0.5) * 24;
      const h = 70 + rand() * 60;
      const w = 190;
      const base = 112;
      els.push(<path key={key++} d={`M ${cx - w / 2} ${base} L ${cx} ${base - h} L ${cx + w / 2} ${base} Z`} fill={i % 2 === 0 ? pal.mountain : pal.mountain2} />);
      const sx = (w / 2) * 0.34;
      const sy = h * 0.34;
      els.push(
        <path key={key++} d={`M ${cx} ${base - h} L ${cx + sx} ${base - h + sy} L ${cx + sx * 0.35} ${base - h + sy * 0.8} L ${cx} ${base - h + sy * 1.1} L ${cx - sx * 0.5} ${base - h + sy * 0.8} L ${cx - sx} ${base - h + sy} Z`} fill={pal.snow} />
      );
    }

    // un lago
    const ly = ARRIBA + ALTO_FILA * 0.52;
    els.push(<ellipse key={key++} cx={ancho - 60} cy={ly} rx={44} ry={20} fill={pal.river} opacity={0.9} />);

    for (let i = 0; i < 3 + Math.round(alto / 500); i++) {
      const cx = 60 + rand() * (ancho - 120);
      const cy = 30 + rand() * (alto - 100);
      els.push(
        <g key={key++} className="gl-cloud" style={{ animationDelay: `${-i * 3}s` }}>
          <ellipse cx={cx} cy={cy} rx={40} ry={11} fill={pal.cloud} />
          <ellipse cx={cx - 18} cy={cy - 8} rx={20} ry={11} fill={pal.cloud} />
          <ellipse cx={cx + 14} cy={cy - 10} rx={24} ry={13} fill={pal.cloud} />
        </g>
      );
    }

    // árboles lejos del camino y de las tarjetas
    const arboles: { x: number; y: number; s: number; c: string; pino: boolean }[] = [];
    const meta = Math.round((ancho * alto) / 9000);
    let intentos = 0;
    while (arboles.length < meta && intentos < meta * 16) {
      intentos++;
      const x = 14 + rand() * (ancho - 28);
      const y = 124 + rand() * (alto - 150);
      if (muestras.some((p) => Math.hypot(p.x - x, p.y - y) < 46)) continue;
      if (puntos.some((p) => Math.abs(x - p.x) < ranura / 2 - 2 && y > p.y - 44 && y < p.y + 132)) continue;
      if (Math.hypot(x - (ancho - 60), y - ly) < 60) continue;
      if (arboles.some((a) => Math.hypot(a.x - x, a.y - y) < 30)) continue;
      arboles.push({ x, y, s: 0.8 + rand() * 0.5, c: [pal.tree1, pal.tree2, pal.tree3][Math.floor(rand() * 3)], pino: rand() < 0.45 });
    }
    arboles
      .sort((a, b) => a.y - b.y)
      .forEach((a) => {
        const tf = `translate(${a.x} ${a.y}) scale(${a.s})`;
        els.push(
          a.pino ? (
            <g key={key++} transform={tf}>
              <rect x={-2} y={0} width={4} height={10} fill={pal.trunk} />
              <path d="M0 -36 L14 -10 L-14 -10 Z" fill={a.c} />
              <path d="M0 -24 L18 4 L-18 4 Z" fill={a.c} />
            </g>
          ) : (
            <g key={key++} transform={tf}>
              <rect x={-2.5} y={-4} width={5} height={14} fill={pal.trunk} />
              <circle cx={0} cy={-16} r={15} fill={a.c} />
              <circle cx={-6} cy={-21} r={7} fill={pal.tree2} opacity={0.55} />
            </g>
          )
        );
      });
    return els;
  }, [nodos.length, pts, alto, ancho, pal, puntos, ranura]);

  const foco = sobre ?? selectedId;
  const nodoFoco = foco !== null ? porId.get(foco) : undefined;
  const requisitosFoco = new Set(nodoFoco ? nodoFoco.prerequisitos.map((p) => p.cursoId) : []);
  const abreFoco = new Set(nodoFoco ? loQueAbre(nodoFoco, vista).map((n) => n.cursoId) : []);

  return (
    <div ref={contenedor} className="relative w-full select-none" style={{ height: alto }}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: `linear-gradient(to bottom, ${pal.bgTop}, ${pal.bgBottom})` }}>
        <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} className="absolute inset-0" aria-hidden="true">
          {paisaje}

          <path d={caminoD} fill="none" stroke={pal.roadEdge} strokeWidth={48} strokeLinecap="round" strokeLinejoin="round" />
          <path d={caminoD} fill="none" stroke={pal.road} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
          {andadoD && <path d={andadoD} fill="none" stroke="#4CE07E" strokeWidth={14} strokeLinecap="round" opacity={0.9} />}
          <path d={caminoD} fill="none" stroke={pal.dash} strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" opacity={0.9} />

          <g transform={`translate(${casa.x} ${casa.y}) scale(1.25)`}>
            <ellipse cx={0} cy={10} rx={28} ry={6} fill="#000" opacity={0.15} />
            <rect x={-22} y={-22} width={44} height={30} fill={pal.wall} rx={2} />
            <path d="M-29 -20 L0 -48 L29 -20 Z" fill={pal.roof} />
            <rect x={-5} y={-8} width={10} height={16} fill={pal.door} />
            <rect x={-17} y={-15} width={8} height={8} fill="#FFFFFF" opacity={0.75} />
            <rect x={9} y={-15} width={8} height={8} fill="#FFFFFF" opacity={0.75} />
          </g>

          <g transform={`translate(${castillo.x} ${castillo.y + 34}) scale(1.05)`}>
            <ellipse cx={0} cy={2} rx={58} ry={8} fill="#000" opacity={0.15} />
            <rect x={-40} y={-52} width={80} height={54} fill={pal.stone} />
            <rect x={-56} y={-74} width={28} height={76} fill={pal.stoneDark} />
            <rect x={28} y={-74} width={28} height={76} fill={pal.stoneDark} />
            {[-56, -46, -36, 28, 38, 48].map((cx) => (
              <rect key={cx} x={cx} y={-82} width={8} height={9} fill={pal.stoneDark} />
            ))}
            <path d="M-14 2 L-14 -20 A14 14 0 0 1 14 -20 L14 2 Z" fill={pal.door} />
            <path d="M0 -82 L0 -112" stroke={pal.trunk} strokeWidth={3} />
            <path d="M0 -112 L26 -104 L0 -96 Z" fill="#4CE07E" />
          </g>
        </svg>
      </div>

      {nodos.map((n, i) => {
        const pt = puntos[i];
        const actual = n.status === 'current';
        const hecho = n.status === 'completed';
        const bloqueado = n.status === 'locked' || n.status === 'unavailable';
        const elegido = selectedId === n.cursoId;
        const esRequisito = requisitosFoco.has(n.cursoId);
        const abre = loQueAbre(n, vista).length;
        const esAbierto = abreFoco.has(n.cursoId);
        const etapaNueva = i === 0 || nodos[i - 1].etapa !== n.etapa;
        const etapa = vista.stages[n.etapa];
        const anchoTarjeta = Math.min(168, ranura - 10);
        const borde = pt.x - ancho / 2;

        const ficha = hecho
          ? 'bg-[#4CE07E] text-white ring-4 ring-white/90'
          : actual
            ? 'gl-gradient text-white ring-4 ring-white gl-glow-teal'
            : bloqueado
              ? 'bg-[#BCC9C2] dark:bg-[#4A5F5A] text-white ring-4 ring-white/70 dark:ring-white/20'
              : 'bg-white text-[#0E8A7D] ring-4 ring-[#0E8A7D]';

        return (
          <div
            key={n.cursoId}
            className={`absolute ${sobre === n.cursoId ? 'z-40' : actual ? 'z-20' : 'z-10'}`}
            style={{ left: pt.x, top: pt.y - TOKEN / 2, transform: 'translateX(-50%)' }}
            onMouseEnter={() => setSobre(n.cursoId)}
            onMouseLeave={() => setSobre((s) => (s === n.cursoId ? null : s))}
          >
            {etapaNueva && etapa && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1F2D2A]/85 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 shadow">
                Etapa {n.etapa + 1} · {etapa.nombre}
              </span>
            )}
            {actual && (
              <span className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#F5A524] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg gl-bounce">
                Aquí vas
                <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#F5A524] rotate-45" />
              </span>
            )}
            {(esRequisito || esAbierto) && (
              <span className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${esRequisito ? 'bg-[#0E8A7D] text-white' : 'bg-white text-[#0E8A7D]'}`}>
                {esRequisito ? 'Requisito' : 'Se abre después'}
              </span>
            )}

            <button
              type="button"
              onClick={() => onSelect(elegido ? null : n.cursoId)}
              onFocus={() => setSobre(n.cursoId)}
              onBlur={() => setSobre((s) => (s === n.cursoId ? null : s))}
              aria-pressed={elegido}
              aria-label={`${n.titulo}. ${textoDeEstado(n)}`}
              className="flex flex-col items-center cursor-pointer group"
            >
              <span className="relative block" style={{ width: TOKEN, height: TOKEN }}>
                {actual && <span className="absolute inset-0 rounded-full gl-gradient opacity-40 animate-ping" />}
                <span
                  className={`relative w-full h-full rounded-full flex items-center justify-center font-display font-bold text-lg shadow-xl transition-transform group-hover:scale-110 ${ficha} ${actual ? 'scale-110' : ''} ${
                    elegido ? 'outline outline-4 outline-offset-4 outline-[#1F2D2A] dark:outline-[#E6EFE9]' : ''
                  }`}
                >
                  {hecho ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : bloqueado ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
              </span>

              <span
                className={`mt-2 rounded-xl border px-2.5 py-2 shadow-md backdrop-blur-sm text-left transition-colors ${
                  elegido ? 'bg-white dark:bg-[#1F2D2A] border-[#0E8A7D]' : 'bg-white/92 dark:bg-[#1F2D2A]/88 border-white dark:border-white/10 group-hover:border-[#12C2A8]'
                }`}
                style={{ width: anchoTarjeta }}
              >
                <span className="block font-display font-bold leading-snug text-[12px] text-[#1F2D2A] dark:text-[#E6EFE9] line-clamp-2">{n.titulo}</span>
                <span className="block mt-1 text-[10.5px] text-[#6B7A74] dark:text-[#98B0A6] truncate">
                  {NIVEL_TEXTO[n.nivel]}
                  {n.horas != null && ` · ${n.horas} h`}
                  {abre > 0 && ` · abre ${abre}`}
                </span>
                <span className={`block mt-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold truncate ${ESTADO_CHIP[n.status]}`}>{textoDeEstado(n)}</span>
              </span>
            </button>

            {sobre === n.cursoId && (
              <div
                role="tooltip"
                className="gl-fade-up absolute top-full mt-2 z-50 w-64 pointer-events-none"
                style={{ left: borde < -ancho / 2 + 150 ? 0 : borde > ancho / 2 - 150 ? 'auto' : '50%', right: borde > ancho / 2 - 150 ? 0 : 'auto', transform: borde >= -ancho / 2 + 150 && borde <= ancho / 2 - 150 ? 'translateX(-50%)' : undefined }}
              >
                <div className="rounded-xl bg-[#1F2D2A] border border-white/10 px-3.5 py-3 shadow-2xl">
                  <p className="text-xs font-bold text-white leading-snug">{n.titulo}</p>
                  {n.razon && <p className="text-[11px] text-[#F5D98B] leading-snug mt-1.5">{n.razon}</p>}
                  {n.temario.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {n.temario.slice(0, 3).map((t) => (
                        <li key={t} className="text-[11px] text-[#BCC9C2] leading-snug truncate">· {t}</li>
                      ))}
                      {n.temario.length > 3 && <li className="text-[10px] text-[#98B0A6]">y {n.temario.length - 3} temas más</li>}
                    </ul>
                  )}
                  {n.habilidades.length > 0 && <p className="text-[10px] text-[#7EDCCB] mt-2 leading-snug">Desbloquea: {n.habilidades.join(', ')}</p>}
                  <p className="text-[10px] font-mono text-[#98B0A6] mt-2">Toca para ver cómo empezar</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
