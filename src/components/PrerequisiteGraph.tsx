import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { categoriaDesdeEnum } from '../services/cursosServiceApi';
import { nivelLabel } from '../services/roadmapApi';
import {
  edgePaths,
  fitLayoutOptions,
  layoutRoadmapGraph,
  type EstadoNodo,
  type GraphNode,
  type LayoutOptions,
  type RoadmapGraphModel,
} from '../utils/roadmapGraph';

// HU-12: el roadmap como grafo dirigido. Una columna por etapa y una flecha por
// cada relación de prerequisito real (de cursos-service): A → B = "A es requisito de B".

interface PrerequisiteGraphProps {
  graph: RoadmapGraphModel;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

// tamaño ideal; si no caben todas las etapas, fitLayoutOptions angosta las tarjetas
const BASE: LayoutOptions = { cardW: 240, cardH: 116, gapX: 88, gapY: 20, padX: 12, padY: 12, headerH: 34 };

export const ESTADO_LABEL: Record<EstadoNodo, string> = {
  completed: 'Completado',
  current: 'Estás aquí',
  available: 'Disponible',
  locked: 'Bloqueado',
};

type EdgeKind = 'neutral' | 'done' | 'prereq' | 'unlock';

const EDGE_STROKE: Record<EdgeKind, string> = {
  neutral: 'stroke-[#B6C2D4] dark:stroke-[#36507A]',
  done: 'stroke-[#4CE07E] dark:stroke-[#2E9E5B]',
  prereq: 'stroke-[#1E73E8] dark:stroke-[#5B9BFF]',
  unlock: 'stroke-[#12C2A8] dark:stroke-[#2DD4BF]',
};

const EDGE_FILL: Record<EdgeKind, string> = {
  neutral: 'fill-[#B6C2D4] dark:fill-[#36507A]',
  done: 'fill-[#4CE07E] dark:fill-[#2E9E5B]',
  prereq: 'fill-[#1E73E8] dark:fill-[#5B9BFF]',
  unlock: 'fill-[#12C2A8] dark:fill-[#2DD4BF]',
};

const CARD_ESTADO: Record<EstadoNodo, string> = {
  completed: 'bg-[#F0FDF4] dark:bg-[#0D2E1A] border-[#4CE07E] dark:border-[#2E9E5B]',
  current: 'bg-white dark:bg-[#0B1F3A] border-2 border-[#12C2A8] gl-glow-teal',
  available: 'bg-white dark:bg-[#0B1F3A] border-[#1E73E8]/60 dark:border-[#5B9BFF]/60',
  locked: 'bg-[#F7F9FA] dark:bg-[#0C1C33] border-[#DDE4ED] dark:border-[#1C3254]',
};

function EstadoChip({ node }: { node: GraphNode }) {
  if (node.inactivo && node.estado !== 'completed') {
    return (
      <span className="shrink-0 inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] dark:bg-[#3A2A0D] text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#78350F]">
        No disponible
      </span>
    );
  }
  const cls: Record<EstadoNodo, string> = {
    completed: 'bg-[#4CE07E] text-[#0B1F3A]',
    current: 'gl-gradient text-white',
    available: 'bg-[#EFF6FF] dark:bg-[#0D1F3C] text-[#1D4ED8] dark:text-[#93C5FD]',
    locked: 'bg-[#EEF2F6] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2]',
  };
  return (
    <span className={`shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold ${cls[node.estado]}`}>
      {node.estado === 'locked' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {ESTADO_LABEL[node.estado]}
    </span>
  );
}

export default function PrerequisiteGraph({ graph, selectedId, onSelect }: PrerequisiteGraphProps) {
  const markerPrefix = useId().replace(/:/g, '');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [disponible, setDisponible] = useState(0);
  const [bordes, setBordes] = useState({ inicio: true, fin: true });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const medir = () => setDisponible(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = useMemo(() => fitLayoutOptions(BASE, graph.etapas, disponible), [graph.etapas, disponible]);
  const layout = useMemo(() => layoutRoadmapGraph(graph, L), [graph, L]);
  const paths = useMemo(() => edgePaths(graph, layout, L), [graph, layout, L]);
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const desborda = disponible > 0 && layout.width > disponible + 1;

  // para mostrar el desvanecido solo del lado donde hay más grafo escondido
  const actualizarBordes = () => {
    const el = scrollRef.current;
    if (el) setBordes({ inicio: el.scrollLeft <= 2, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };

  // si no cabe todo (p. ej. en el celular), arranca mostrando "estás aquí",
  // con media etapa anterior a la vista para que se note que hay más a la izquierda
  useEffect(() => {
    const el = scrollRef.current;
    const actual = graph.nodes.find((n) => n.estado === 'current');
    if (el && desborda && actual) el.scrollLeft = Math.max(0, layout.pos.get(actual.id)!.x - L.padX - L.gapX - L.cardW / 2);
    actualizarBordes();
  }, [graph, desborda]);

  // Lo que se resalta: el curso bajo el cursor, o si no hay, el seleccionado
  const focusId = hoveredId ?? selectedId;
  const focus = focusId !== null ? byId.get(focusId) : undefined;

  const edges = graph.edges.map((e) => ({ ...e, d: paths.get(`${e.from}-${e.to}`)! }));

  const kindOf = (e: { from: number; to: number }): EdgeKind => {
    if (focus && e.to === focus.id) return 'prereq';
    if (focus && e.from === focus.id) return 'unlock';
    return byId.get(e.from)?.estado === 'completed' ? 'done' : 'neutral';
  };

  // las flechas resaltadas se pintan al final para que queden encima
  const isRelated = (e: { from: number; to: number }) => !!focus && (e.to === focus.id || e.from === focus.id);
  const sortedEdges = [...edges].sort((a, b) => Number(isRelated(a)) - Number(isRelated(b)));

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setHoveredId(null);
      onSelect(null);
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {desborda && (
        <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] px-1 pt-2">
          Desliza para ver las {graph.etapas} etapas <span aria-hidden="true">↔</span>
        </p>
      )}
      <div className="relative">
        <div ref={scrollRef} onScroll={actualizarBordes} className="overflow-x-auto">
          <div
            role="group"
            aria-label={`Grafo de prerequisitos: ${graph.nodes.length} cursos en ${graph.etapas} etapas`}
            className="relative mx-auto"
            style={{ width: layout.width, height: layout.height }}
          >
            {/* columnas (etapas) */}
            {layout.columnas.map((c) => (
              <div key={c.etapa} className="absolute" style={{ left: c.x, top: L.padY, width: L.cardW }}>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6B7A99] dark:text-[#8BA5C2]">
                  Etapa {c.etapa + 1}
                </p>
              </div>
            ))}
            {layout.columnas.map((c) => (
              <div
                key={`band-${c.etapa}`}
                aria-hidden="true"
                className="absolute rounded-xl bg-[#F7F9FA] dark:bg-[#0B1C33]/60"
                style={{ left: c.x - 8, top: L.padY + L.headerH - 10, width: L.cardW + 16, bottom: L.padY - 10 }}
              />
            ))}

            {/* flechas: A → B = "A es requisito de B" */}
            <svg width={layout.width} height={layout.height} className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <defs>
                {(Object.keys(EDGE_FILL) as EdgeKind[]).map((k) => (
                  <marker key={k} id={`${markerPrefix}-${k}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} markerUnits="userSpaceOnUse" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" className={EDGE_FILL[k]} />
                  </marker>
                ))}
              </defs>
              {sortedEdges.map((e) => {
                const kind = kindOf(e);
                const related = kind === 'prereq' || kind === 'unlock';
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={e.d}
                    fill="none"
                    strokeWidth={related ? 3 : 2}
                    strokeLinecap="round"
                    markerEnd={`url(#${markerPrefix}-${kind})`}
                    className={`${EDGE_STROKE[kind]} transition-opacity duration-150 ${focus && !related ? 'opacity-15' : 'opacity-100'}`}
                  />
                );
              })}
            </svg>

            {/* cursos */}
            {graph.nodes.map((n) => {
              const p = layout.pos.get(n.id)!;
              const isFocus = focus?.id === n.id;
              const isPrereq = !!focus && focus.requiere.includes(n.id);
              const isUnlock = !!focus && focus.desbloquea.includes(n.id);
              const dimmed = !!focus && !isFocus && !isPrereq && !isUnlock;
              const muted = n.estado === 'locked';
              const noDisponible = n.inactivo && n.estado !== 'completed';
              const cardCls = noDisponible
                ? 'bg-[#FFFBEB]/60 dark:bg-[#3A2A0D]/40 border-2 border-dashed border-[#F59E0B]'
                : CARD_ESTADO[n.estado];
              const ring = isPrereq
                ? 'ring-2 ring-[#1E73E8] dark:ring-[#5B9BFF]'
                : isUnlock
                  ? 'ring-2 ring-[#12C2A8] dark:ring-[#2DD4BF]'
                  : selectedId === n.id
                    ? 'ring-2 ring-[#0B1F3A] dark:ring-[#E2EBF6]'
                    : '';

              const requiere = n.requiere.map((id) => byId.get(id)?.titulo).filter(Boolean).join(', ');
              const label = [
                `${n.titulo}`,
                `${categoriaDesdeEnum(n.categoria)}, ${nivelLabel(n.nivel)}`,
                `Etapa ${n.etapa + 1}`,
                noDisponible ? 'No disponible' : ESTADO_LABEL[n.estado],
                requiere ? `Requiere: ${requiere}` : 'No requiere otros cursos de la ruta',
              ].join('. ');

              return (
                <button
                  key={n.id}
                  type="button"
                  aria-label={label}
                  aria-pressed={selectedId === n.id}
                  onClick={() => onSelect(selectedId === n.id ? null : n.id)}
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId((h) => (h === n.id ? null : h))}
                  onFocus={() => setHoveredId(n.id)}
                  onBlur={() => setHoveredId((h) => (h === n.id ? null : h))}
                  className={`absolute flex flex-col text-left rounded-xl border p-3 cursor-pointer transition-[opacity,transform,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E73E8] dark:focus-visible:ring-offset-[#0F2240] ${cardCls} ${ring} ${
                    isFocus || selectedId === n.id ? '-translate-y-0.5 shadow-xl z-20' : 'z-10'
                  } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
                  style={{ left: p.x, top: p.y, width: L.cardW, height: L.cardH }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-[10px] font-bold text-[#6B7A99] dark:text-[#8BA5C2]">#{n.orden + 1}</span>
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#6B7A99] dark:text-[#8BA5C2]">
                      {categoriaDesdeEnum(n.categoria)}
                    </span>
                  </div>
                  <p
                    title={n.titulo}
                    className={`mt-1 font-display font-bold text-[13px] leading-snug line-clamp-2 ${
                      muted ? 'text-[#6B7A99] dark:text-[#8BA5C2]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'
                    }`}
                  >
                    {n.titulo}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-1.5 min-w-0">
                    <span className="min-w-0 truncate text-[11px] text-[#6B7A99] dark:text-[#8BA5C2]">{nivelLabel(n.nivel)}</span>
                    <EstadoChip node={n} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {desborda && !bordes.inicio && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-[#0F2240] to-transparent"
          />
        )}
        {desborda && !bordes.fin && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-[#0F2240] to-transparent"
          />
        )}
      </div>
    </div>
  );
}

export function GraphLegend() {
  const item = (swatch: string, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${swatch}`} aria-hidden="true" />
      {text}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B7A99] dark:text-[#8BA5C2]">
      {item('bg-[#4CE07E]', 'Completado')}
      {item('gl-gradient', 'Estás aquí')}
      {item('border-2 border-[#1E73E8]', 'Disponible')}
      {item('bg-[#DDE4ED] dark:bg-[#1C3254]', 'Bloqueado')}
      {item('border-2 border-dashed border-[#F59E0B]', 'No disponible')}
      <span className="inline-flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true">
          <path d="M1 5 H21" strokeWidth={2} className="stroke-[#B6C2D4] dark:stroke-[#36507A]" />
          <path d="M20 1 L27 5 L20 9 z" className="fill-[#B6C2D4] dark:fill-[#36507A]" />
        </svg>
        es requisito de
      </span>
    </div>
  );
}
