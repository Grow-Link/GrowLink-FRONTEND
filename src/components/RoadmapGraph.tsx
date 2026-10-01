import { useMemo } from 'react';
import type { Course, RoadmapNode, RoadmapEdge, RoadmapNodeStatus } from '../types';

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
}

const COL_WIDTH = 296;
const ROW_HEIGHT = 208;
const CARD_W = 232;
const CARD_H = 108;
const PAD_X = 32;
const PAD_Y = 104;

const STATUS_STYLE: Record<RoadmapNodeStatus, { border: string; bg: string; text: string; badge: string }> = {
  completed: { border: 'border-[#4CE07E]', bg: 'bg-[#F0FDF4] dark:bg-[#0D2E1A]', text: 'text-[#15803D] dark:text-[#4CE07E]', badge: 'Completado' },
  current: { border: 'border-transparent', bg: 'gl-gradient', text: 'text-white', badge: 'Estás aquí' },
  available: { border: 'border-[#1E73E8]', bg: 'bg-white dark:bg-[#0F2240]', text: 'text-[#1E73E8]', badge: 'Disponible' },
  locked: { border: 'border-[#DDE4ED] dark:border-[#1C3254]', bg: 'bg-[#F7F9FA] dark:bg-[#0B1830]', text: 'text-[#6B7A99] dark:text-[#8BA5C2]', badge: 'Bloqueado' },
};

export default function RoadmapGraph({ nodes, edges, courses, onSelectCourse }: RoadmapGraphProps) {
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const layout = useMemo(() => {
    const tierGroups = new Map<number, RoadmapNode[]>();
    nodes.forEach((n) => {
      if (!tierGroups.has(n.tier)) tierGroups.set(n.tier, []);
      tierGroups.get(n.tier)!.push(n);
    });
    const maxTier = Math.max(0, ...nodes.map((n) => n.tier));
    const maxRows = Math.max(1, ...[...tierGroups.values()].map((g) => g.length));

    const positions = new Map<string, { x: number; y: number }>();
    tierGroups.forEach((group, tier) => {
      const zigzag = tier % 2 === 1 ? ROW_HEIGHT / 2 : 0;
      group.forEach((node, i) => {
        positions.set(node.id, {
          x: PAD_X + tier * COL_WIDTH,
          y: PAD_Y + zigzag + i * ROW_HEIGHT,
        });
      });
    });

    const width = PAD_X * 2 + (maxTier + 1) * COL_WIDTH - (COL_WIDTH - CARD_W);
    const height = PAD_Y * 2 + maxRows * ROW_HEIGHT + ROW_HEIGHT / 2;
    return { positions, width, height };
  }, [nodes]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.courseId, n])), [nodes]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative" style={{ width: layout.width, height: layout.height, minWidth: '100%' }}>
        <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
          <defs>
            <linearGradient id="rm-path-done" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4CE07E" />
              <stop offset="100%" stopColor="#12C2A8" />
            </linearGradient>
            <linearGradient id="rm-path-active" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#12C2A8" />
              <stop offset="100%" stopColor="#1E73E8" />
            </linearGradient>
          </defs>
          {edges.map((edge, i) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;
            const p1 = layout.positions.get(from.id);
            const p2 = layout.positions.get(to.id);
            if (!p1 || !p2) return null;
            const x1 = p1.x + CARD_W;
            const y1 = p1.y + CARD_H / 2;
            const x2 = p2.x;
            const y2 = p2.y + CARD_H / 2;
            const mx = (x1 + x2) / 2;
            const isDone = from.status === 'completed';
            const isActive = isDone && (to.status === 'current' || to.status === 'available');
            const stroke = isDone ? (isActive ? 'url(#rm-path-active)' : 'url(#rm-path-done)') : '#AFC0D6';
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth={isDone ? 3 : 2.5}
                strokeDasharray={isDone ? undefined : '7 5'}
                strokeLinecap="round"
                className="dark:opacity-80"
                opacity={isDone ? 1 : 0.85}
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const course = courseById.get(node.courseId);
          if (!course) return null;
          const pos = layout.positions.get(node.id);
          if (!pos) return null;
          const style = STATUS_STYLE[node.status];
          const isCurrent = node.status === 'current';
          const isLocked = node.status === 'locked';
          const isStale = course.status !== 'active' && node.status !== 'completed';

          return (
            <button
              key={node.id}
              onClick={() => !isLocked && onSelectCourse(course.id)}
              disabled={isLocked}
              style={{ left: pos.x, top: pos.y, width: CARD_W }}
              className={`group/node gl-card-hover absolute rounded-2xl border-2 p-4 text-left transition-all ${style.border} ${style.bg} ${
                isCurrent ? 'z-20 scale-[1.14] shadow-2xl gl-glow-teal' : 'z-10'
              } ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              <div
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-30 w-52 scale-95 opacity-0 transition-all duration-150 group-hover/node:scale-100 group-hover/node:opacity-100"
              >
                <div className="rounded-lg bg-[#0B1F3A] border border-white/10 px-3 py-2 shadow-xl">
                  <p className="text-xs font-bold text-white leading-snug line-clamp-1">{course.title}</p>
                  <p className="text-[11px] text-[#8BA5C2] leading-snug mt-1 line-clamp-2">{course.description}</p>
                  <p className="text-[10px] font-mono text-[#4CE07E] mt-1 line-clamp-1">{course.skills.join(' · ')}</p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#0B1F3A] border-r border-b border-white/10 rotate-45" />
              </div>

              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isCurrent ? 'text-white/80' : style.text}`}>
                  {style.badge}
                </span>
                {node.status === 'completed' && (
                  <svg className={`w-4 h-4 shrink-0 ${style.text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {isLocked && (
                  <svg className="w-4 h-4 shrink-0 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <p className={`font-display font-bold leading-snug mb-1 ${isCurrent ? 'text-white text-base' : 'text-[#0B1F3A] dark:text-[#E2EBF6] text-sm'}`}>
                {course.title}
              </p>
              <p className={`text-xs ${isCurrent ? 'text-white/75' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
                {course.category} · {course.level}
              </p>
              {isStale && (
                <span className="inline-block mt-2 text-[10px] font-bold text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#3A2A0D] border border-[#F59E0B]/40 px-1.5 py-0.5 rounded-md">
                  Ya no disponible
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
