import { useMemo, useState, type ReactElement } from 'react';
import { useTheme } from '../store/ThemeContext';
import { categoriaDesdeEnum } from '../services/cursosServiceApi';
import { nivelLabel } from '../services/roadmapApi';
import type { EstadoNodo, GraphNode, RoadmapGraphModel } from '../utils/roadmapGraph';

// El mapa ilustrado (la versión "bonita" que también se ve en el landing) —
// antes trabajaba con el Roadmap de mentira (RoadmapNode/RoadmapEdge +
// Course[] del mock). Ahora consume directo el RoadmapGraphModel real de
// cursos-service (ver utils/roadmapGraph.ts): cada GraphNode ya trae título,
// categoría, nivel y estado, así que no hace falta una tabla de cursos aparte.
// Misma interfaz de props que PrerequisiteGraph.tsx para poder intercambiarlos.

interface RoadmapGraphProps {
  graph: RoadmapGraphModel;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  compact?: boolean;
}

interface Pt {
  x: number;
  y: number;
}

const W = 800;
const X_L = 300;
const X_R = 500;

const PALETTES = {
  light: {
    bgTop: '#D9F4E7', bgBottom: '#B4E8CD', hill: '#A2E0BE', hill2: '#8DD6AE',
    mountain: '#7FB4D3', mountain2: '#5E97BE', snow: '#FFFFFF',
    tree1: '#2FBF7A', tree2: '#4CE07E', tree3: '#12A387', trunk: '#8B6B4A',
    river: '#7CC7F0', riverLight: '#B9E4FA', road: '#F7F0D8', roadEdge: '#D2C596', dash: '#FFFFFF',
    wall: '#F6CE86', roof: '#E8604C', door: '#8B5A3C', stone: '#C9D3E2', stoneDark: '#9FB0C7',
    cloud: 'rgba(255,255,255,0.85)',
  },
  dark: {
    bgTop: '#0A2A3A', bgBottom: '#0B3446', hill: '#0F4A55', hill2: '#125A5E',
    mountain: '#1B4F7A', mountain2: '#13385C', snow: '#CFE3F5',
    tree1: '#1E8F6A', tree2: '#2BB67D', tree3: '#12766F', trunk: '#5B4A3A',
    river: '#1F7FB0', riverLight: '#3FA3D0', road: '#D6D1B6', roadEdge: '#8F8A6E', dash: '#F4F1E0',
    wall: '#C9A468', roof: '#B84A3C', door: '#5E3D29', stone: '#8FA2BC', stoneDark: '#647A98',
    cloud: 'rgba(207,227,245,0.14)',
  },
};

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

function bezierPoint(a: Pt, b: Pt, k: number, t: number): Pt {
  const c1 = { x: a.x, y: a.y + k };
  const c2 = { x: b.x, y: b.y - k };
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

function segPath(a: Pt, b: Pt) {
  const k = (b.y - a.y) * 0.55;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
}

const ESTADO_LABEL: Record<EstadoNodo, string> = {
  completed: 'Completado',
  current: 'Estás aquí',
  available: 'Disponible',
  locked: 'Bloqueado',
};

export default function RoadmapGraph({ graph, selectedId, onSelect, compact = false }: RoadmapGraphProps) {
  const { isDark } = useTheme();
  const pal = isDark ? PALETTES.dark : PALETTES.light;
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // un solo camino serpenteante, en el mismo orden sugerido que usa el resto de la app
  const nodes = useMemo(() => [...graph.nodes].sort((a, b) => a.etapa - b.etapa || a.orden - b.orden), [graph.nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const S = compact ? 140 : 172;
  const TOP = compact ? 210 : 250;
  const TAIL = compact ? 170 : 210;

  const layout = useMemo(() => {
    const start: Pt = { x: 400, y: TOP - 105 };
    const nodePts = nodes.map((_, i) => ({ x: i % 2 === 0 ? X_L : X_R, y: TOP + i * S }));
    const lastY = nodePts.length ? nodePts[nodePts.length - 1].y : TOP;
    const end: Pt = { x: 400, y: lastY + S * 0.95 };
    const H = end.y + TAIL;
    const points = [start, ...nodePts, end];
    return { start, nodePts, end, points, H };
  }, [nodes, S, TOP, TAIL]);

  const { points, nodePts, start, end, H } = layout;

  const roadD = useMemo(() => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const k = (b.y - a.y) * 0.55;
      d += ` C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
    }
    return d;
  }, [points]);

  const scenery = useMemo(() => {
    const rand = mulberry32(nodes.length * 7919 + 13);
    const roadSamples: Pt[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const k = (points[i + 1].y - points[i].y) * 0.55;
      for (let t = 0; t <= 1; t += 1 / 22) roadSamples.push(bezierPoint(points[i], points[i + 1], k, t));
    }
    const riverX = (y: number) => 72 + Math.sin(y / 150) * 34;
    const nearRoad = (x: number, y: number, r: number) => roadSamples.some((p) => Math.hypot(p.x - x, p.y - y) < r);

    const els: ReactElement[] = [];
    let key = 0;

    // hills
    for (let y = 320; y < H; y += 360) {
      const left = ((y / 360) | 0) % 2 === 0;
      els.push(<ellipse key={key++} cx={left ? 40 : 770} cy={y} rx={220} ry={130} fill={pal.hill} opacity={0.75} />);
      els.push(<ellipse key={key++} cx={left ? 770 : 30} cy={y + 190} rx={200} ry={110} fill={pal.hill2} opacity={0.6} />);
    }

    // top mountain range
    const range: ReactElement[] = [];
    for (let i = 0; i < 6; i++) {
      const cx = i * 165 - 10 + rand() * 30;
      const h = 130 + rand() * 80;
      const w = 230;
      const base = 205;
      const col = i % 2 === 0 ? pal.mountain : pal.mountain2;
      range.push(<path key={`m${i}`} d={`M ${cx - w / 2} ${base} L ${cx} ${base - h} L ${cx + w / 2} ${base} Z`} fill={col} />);
      const sx = w / 2 * 0.36;
      const sy = h * 0.36;
      range.push(
        <path
          key={`s${i}`}
          d={`M ${cx} ${base - h} L ${cx + sx} ${base - h + sy} L ${cx + sx * 0.4} ${base - h + sy * 0.8} L ${cx} ${base - h + sy * 1.1} L ${cx - sx * 0.5} ${base - h + sy * 0.8} L ${cx - sx} ${base - h + sy} Z`}
          fill={pal.snow}
        />
      );
    }
    els.push(<g key={key++}>{range}</g>);

    // side mountains along the way
    for (let y = 700; y < H - 300; y += 720) {
      const left = ((y / 720) | 0) % 2 === 0;
      const cx = left ? 60 : 745;
      const h = 120;
      els.push(<path key={key++} d={`M ${cx - 110} ${y + 60} L ${cx} ${y - h} L ${cx + 110} ${y + 60} Z`} fill={pal.mountain2} />);
      els.push(
        <path key={key++} d={`M ${cx} ${y - h} L ${cx + 38} ${y - h + 44} L ${cx + 14} ${y - h + 36} L ${cx} ${y - h + 50} L ${cx - 18} ${y - h + 36} L ${cx - 38} ${y - h + 44} Z`} fill={pal.snow} />
      );
    }

    // river (left)
    let rd = `M ${riverX(230)} 230`;
    for (let y = 250; y <= H; y += 24) rd += ` L ${riverX(y)} ${y}`;
    els.push(<path key={key++} d={rd} fill="none" stroke={pal.river} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />);
    els.push(<path key={key++} d={rd} fill="none" stroke={pal.riverLight} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />);

    // pond (right)
    const py = TOP + (nodes.length * S) * 0.45;
    els.push(<ellipse key={key++} cx={700} cy={py} rx={64} ry={32} fill={pal.river} />);
    els.push(<ellipse key={key++} cx={690} cy={py - 5} rx={34} ry={13} fill={pal.riverLight} opacity={0.5} />);

    // clouds
    const cloudCount = 3 + Math.round(H / 520);
    for (let i = 0; i < cloudCount; i++) {
      const cx = 80 + rand() * 640;
      const cy = 40 + (i * (H - 120)) / cloudCount + rand() * 60;
      els.push(
        <g key={key++} className="gl-cloud" style={{ animationDelay: `${-i * 3}s` }}>
          <ellipse cx={cx} cy={cy} rx={46} ry={13} fill={pal.cloud} />
          <ellipse cx={cx - 22} cy={cy - 9} rx={24} ry={13} fill={pal.cloud} />
          <ellipse cx={cx + 16} cy={cy - 12} rx={28} ry={15} fill={pal.cloud} />
        </g>
      );
    }

    // trees + props scattered away from the road
    const items: { x: number; y: number; type: 'pine' | 'round' | 'house' | 'tent'; s: number; c: string }[] = [];
    const target = Math.round(H / 34);
    let attempts = 0;
    while (items.length < target && attempts < target * 14) {
      attempts++;
      const x = 24 + rand() * 752;
      const y = 235 + rand() * (H - 300);
      if (nearRoad(x, y, 78)) continue;
      if (points.slice(1, -1).some((p) => Math.abs(y - p.y) < 52 && Math.abs(x - p.x) < 250)) continue;
      if (Math.abs(x - riverX(y)) < 40) continue;
      if (Math.hypot(x - 700, y - py) < 88) continue;
      if (items.some((it) => Math.hypot(it.x - x, it.y - y) < 34)) continue;
      const r = rand();
      const type = r < 0.42 ? 'pine' : r < 0.9 ? 'round' : r < 0.96 ? 'house' : 'tent';
      const c = [pal.tree1, pal.tree2, pal.tree3][Math.floor(rand() * 3)];
      items.push({ x, y, type, s: 0.85 + rand() * 0.55, c });
    }
    items.sort((a, b) => a.y - b.y);
    items.forEach((it) => {
      const tf = `translate(${it.x} ${it.y}) scale(${it.s})`;
      if (it.type === 'pine') {
        els.push(
          <g key={key++} transform={tf}>
            <rect x={-2} y={0} width={4} height={10} fill={pal.trunk} />
            <path d="M0 -36 L14 -10 L-14 -10 Z" fill={it.c} />
            <path d="M0 -24 L18 4 L-18 4 Z" fill={it.c} />
          </g>
        );
      } else if (it.type === 'round') {
        els.push(
          <g key={key++} transform={tf}>
            <rect x={-2.5} y={-4} width={5} height={14} fill={pal.trunk} />
            <circle cx={0} cy={-16} r={15} fill={it.c} />
            <circle cx={-6} cy={-21} r={7} fill={pal.tree2} opacity={0.55} />
          </g>
        );
      } else if (it.type === 'house') {
        els.push(
          <g key={key++} transform={tf}>
            <rect x={-20} y={-20} width={40} height={28} fill={pal.wall} rx={2} />
            <path d="M-26 -18 L0 -42 L26 -18 Z" fill={pal.roof} />
            <rect x={-5} y={-8} width={10} height={16} fill={pal.door} />
          </g>
        );
      } else {
        els.push(
          <g key={key++} transform={tf}>
            <path d="M-20 6 L0 -22 L20 6 Z" fill={pal.wall} />
            <path d="M-6 6 L0 -8 L6 6 Z" fill={pal.door} />
            <path d="M0 -22 L0 -34" stroke={pal.trunk} strokeWidth={2} />
            <path d="M0 -34 L12 -30 L0 -26 Z" fill={pal.roof} />
          </g>
        );
      }
    });

    return els;
  }, [nodes.length, points, H, pal, S, TOP]);

  const hoveredNode = hoveredId !== null ? byId.get(hoveredId) : undefined;
  const focusNode = hoveredNode ?? (selectedId !== null ? byId.get(selectedId) : undefined);
  const idxById = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);

  const relationArcs = useMemo(() => {
    if (!focusNode) return [];
    const hi = idxById.get(focusNode.id);
    if (hi === undefined) return [];
    const h = nodePts[hi];
    const arcs: { d: string; kind: 'prereq' | 'unlock'; key: string }[] = [];
    const build = (other: Pt, kind: 'prereq' | 'unlock', k: string) => {
      const sideA = other.x < 400 ? -1 : 1;
      const sideB = h.x < 400 ? -1 : 1;
      const dy = h.y - other.y;
      arcs.push({
        d: `M ${other.x} ${other.y} C ${other.x + sideA * 190} ${other.y + dy * 0.25}, ${h.x + sideB * 190} ${h.y - dy * 0.25}, ${h.x} ${h.y}`,
        kind,
        key: k,
      });
    };
    focusNode.requiere.forEach((id) => {
      const i = idxById.get(id);
      if (i !== undefined) build(nodePts[i], 'prereq', `p-${id}`);
    });
    focusNode.desbloquea.forEach((id) => {
      const i = idxById.get(id);
      if (i !== undefined) build(nodePts[i], 'unlock', `u-${id}`);
    });
    return arcs;
  }, [focusNode, idxById, nodePts]);

  const trailSegments = points.slice(0, -1).map((a, k) => {
    const node = nodes[k];
    const done = node && (node.estado === 'completed' || node.estado === 'current');
    return done ? segPath(a, points[k + 1]) : null;
  });

  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;

  return (
    <div
      className="relative w-full max-w-[780px] mx-auto overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: `${W} / ${H}`, containerType: 'inline-size', background: `linear-gradient(to bottom, ${pal.bgTop}, ${pal.bgBottom})` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        {scenery}

        {/* road */}
        <path d={roadD} fill="none" stroke={pal.roadEdge} strokeWidth={54} strokeLinecap="round" strokeLinejoin="round" />
        <path d={roadD} fill="none" stroke={pal.road} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
        {trailSegments.map((d, i) =>
          d ? <path key={i} d={d} fill="none" stroke="#4CE07E" strokeWidth={16} strokeLinecap="round" opacity={0.9} /> : null
        )}
        <path d={roadD} fill="none" stroke={pal.dash} strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" opacity={0.9} />

        {/* relations on hover/select */}
        {relationArcs.map((a) => (
          <g key={a.key}>
            <path d={a.d} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
            <path d={a.d} fill="none" stroke={a.kind === 'prereq' ? '#1E73E8' : '#12C2A8'} strokeWidth={4} strokeDasharray="9 8" strokeLinecap="round" />
          </g>
        ))}

        {/* start house */}
        <g transform={`translate(${start.x} ${start.y - 12}) scale(1.5)`}>
          <ellipse cx={0} cy={10} rx={30} ry={7} fill="#000" opacity={0.15} />
          <rect x={-22} y={-22} width={44} height={30} fill={pal.wall} rx={2} />
          <path d="M-29 -20 L0 -48 L29 -20 Z" fill={pal.roof} />
          <rect x={-5} y={-8} width={10} height={16} fill={pal.door} />
          <rect x={-17} y={-15} width={8} height={8} fill="#FFFFFF" opacity={0.75} />
          <rect x={9} y={-15} width={8} height={8} fill="#FFFFFF" opacity={0.75} />
        </g>

        {/* finish castle */}
        <g transform={`translate(${end.x} ${end.y + 62}) scale(1.35)`}>
          <ellipse cx={0} cy={2} rx={62} ry={9} fill="#000" opacity={0.15} />
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

      {/* nodes */}
      {nodes.map((node, i) => {
        const pt = nodePts[i];
        const side: 'left' | 'right' = pt.x < 400 ? 'left' : 'right';
        const isCurrent = node.estado === 'current';
        const isLocked = node.estado === 'locked';
        const isDone = node.estado === 'completed';
        const isStale = node.inactivo && !isDone;
        const hovered = hoveredId === node.id;
        const isSelected = selectedId === node.id;
        const isPrereq = !!focusNode && focusNode.id !== node.id && focusNode.requiere.includes(node.id);
        const isUnlock = !!focusNode && focusNode.id !== node.id && focusNode.desbloquea.includes(node.id);
        const size = isCurrent ? 76 : 58;

        const nodeClasses = isDone
          ? 'bg-[#4CE07E] text-white ring-4 ring-white/90'
          : isCurrent
          ? 'gl-gradient text-white ring-4 ring-white gl-glow-teal'
          : isLocked
          ? 'bg-[#B6C2D4] dark:bg-[#4A5F7C] text-white ring-4 ring-white/70 dark:ring-white/20'
          : 'bg-white text-[#1E73E8] ring-4 ring-[#1E73E8]';

        const prereqTitles = node.requiere.map((id) => byId.get(id)?.titulo).filter(Boolean) as string[];
        const unlockTitles = node.desbloquea.map((id) => byId.get(id)?.titulo).filter(Boolean) as string[];

        return (
          <div
            key={node.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${hovered ? 'z-40' : isCurrent ? 'z-20' : 'z-10'}`}
            style={{ left: pctX(pt.x), top: pctY(pt.y) }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId((h) => (h === node.id ? null : h))}
          >
            {isCurrent && (
              <>
                <span className="absolute inset-0 rounded-full gl-gradient opacity-40 animate-ping" />
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0B1F3A] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                  ESTÁS AQUÍ
                  <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#0B1F3A] rotate-45" />
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => onSelect(isSelected ? null : node.id)}
              onFocus={() => setHoveredId(node.id)}
              onBlur={() => setHoveredId((h) => (h === node.id ? null : h))}
              aria-label={`${node.titulo} — ${ESTADO_LABEL[node.estado]}`}
              aria-pressed={isSelected}
              className={`relative rounded-full flex items-center justify-center font-display font-bold text-xl shadow-xl transition-transform cursor-pointer hover:scale-110 ${nodeClasses} ${
                isSelected ? 'outline outline-4 outline-offset-4 outline-[#0B1F3A] dark:outline-[#E2EBF6]' :
                isPrereq ? 'outline outline-4 outline-offset-4 outline-[#1E73E8]' : isUnlock ? 'outline outline-4 outline-offset-4 outline-[#12C2A8]' : ''
              }`}
              style={{ width: size, height: size }}
            >
              {isDone ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : isLocked ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <span className={isCurrent ? 'text-3xl' : ''}>{i + 1}</span>
              )}
            </button>

            {/* label */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 pointer-events-none w-max ${
                side === 'left' ? 'right-full mr-3 sm:mr-4 text-right' : 'left-full ml-3 sm:ml-4 text-left'
              }`}
              style={{
                maxWidth: 'min(196px, calc(37.5cqw - 52px))',
                ...(isCurrent ? { marginLeft: side === 'right' ? 8 : undefined, marginRight: side === 'left' ? 8 : undefined } : {}),
              }}
            >
              <div className="rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border shadow-md backdrop-blur-sm bg-white/90 dark:bg-[#0B1F3A]/85 border-white dark:border-white/10">
                <p className="font-display font-bold leading-snug text-[11px] sm:text-sm text-[#0B1F3A] dark:text-[#E2EBF6] line-clamp-2">{node.titulo}</p>
                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5 truncate">{nivelLabel(node.nivel)}</p>
                {isStale && <p className="text-[9px] sm:text-[10px] font-bold text-[#B45309] dark:text-[#FBBF24] mt-0.5">No disponible</p>}
              </div>
            </div>

            {/* tooltip */}
            {hovered && (
              <div
                role="tooltip"
                className={`gl-fade-up absolute z-50 w-60 pointer-events-none ${isCurrent ? 'bottom-[calc(100%+3rem)]' : 'bottom-full mb-3'} ${
                  side === 'left' ? 'left-[-10px]' : 'right-[-10px]'
                }`}
              >
                <div className="rounded-xl bg-[#0B1F3A] border border-white/10 px-3.5 py-3 shadow-2xl">
                  <p className="text-xs font-bold text-white leading-snug">{node.titulo}</p>
                  <p className="text-[11px] text-[#8BA5C2] leading-snug mt-1">
                    {categoriaDesdeEnum(node.categoria)} · {nivelLabel(node.nivel)} · Etapa {node.etapa + 1}
                  </p>
                  <p className="text-[10px] font-mono text-[#4CE07E] mt-1.5">{ESTADO_LABEL[node.estado]}</p>
                  {prereqTitles.length > 0 && (
                    <p className="text-[10px] text-[#8BA5C2] mt-2 leading-snug">
                      <span className="font-mono font-bold text-[#7CB6FF]">REQUIERE </span>
                      {prereqTitles.join(', ')}
                    </p>
                  )}
                  {unlockTitles.length > 0 && (
                    <p className="text-[10px] text-[#8BA5C2] mt-1 leading-snug">
                      <span className="font-mono font-bold text-[#2DD4BF]">DESBLOQUEA </span>
                      {unlockTitles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
