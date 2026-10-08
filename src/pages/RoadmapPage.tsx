import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import RoadmapGraph from '../components/RoadmapGraph';
import { ESTADO_LABEL, GraphLegend } from '../components/PrerequisiteGraph';
import { useNavigation } from '../store/NavigationContext';
import { getPerfil, type Perfil } from '../services/usuariosServiceApi';
import { fetchRoadmap, generarRoadmap, nivelLabel, type RoadmapBackendData } from '../services/roadmapApi';
import { categoriaDesdeEnum } from '../services/cursosServiceApi';
import { buildRoadmapGraph, type GraphNode } from '../utils/roadmapGraph';
import { timeAgo } from '../utils/format';
import { downloadRoadmapPdf } from '../utils/roadmapPdf';

// HU-12: el roadmap guardado en cursos-service (HU-11) visto como grafo de
// prerequisitos. Los datos vienen del backend real; el perfil (metas, intereses,
// nivel) para regenerar sigue saliendo del onboarding del frontend.

const page = 'min-h-screen bg-[#F7F9FA] dark:bg-[#081629]';
const card = 'bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl';

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CenteredMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={page}>
      <Navbar />
      <div className="max-w-lg mx-auto text-center px-4 py-24">
        <h1 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { navigate, currentUser } = useNavigation();

  // undefined = cargando por primera vez, null = el usuario todavía no tiene roadmap
  const [data, setData] = useState<RoadmapBackendData | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    let ignore = false;
    setLoadError(null);
    Promise.all([fetchRoadmap(), getPerfil()])
      .then(([d, p]) => {
        if (!ignore) {
          setData(d);
          setProfile(p);
        }
      })
      .catch((e: Error) => {
        if (!ignore) setLoadError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, [currentUser, reloadKey]);

  // Escape cierra el detalle desde cualquier parte de la página (no solo desde el grafo)
  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const graph = useMemo(
    () => (data ? buildRoadmapGraph(data.roadmap.cursos, data.completados, data.inactivos) : null),
    [data]
  );

  if (!currentUser) return null;
  const hasProfile = profile?.completo ?? false;

  async function handleGenerate() {
    if (!profile || !hasProfile) {
      navigate('onboarding');
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      await generarRoadmap({ goals: profile.metas ?? '', interests: profile.intereses, level: profile.nivel ?? 'principiante' });
      setSelectedId(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setGenerateError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!graphRef.current || !data) return;
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      const nodes = data.roadmap.cursos;
      const total = nodes.length;
      const done = data.completados.size;
      await downloadRoadmapPdf(graphRef.current, {
        nombre: currentUser?.name ?? 'usuario',
        progresoPct: total > 0 ? Math.round((done / total) * 100) : 0,
        totalCursos: total,
        completados: done,
      });
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'No se pudo generar el PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (data === undefined) {
    if (loadError) {
      return (
        <CenteredMessage title="No pudimos cargar tu roadmap">
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mb-2">{loadError}</p>
          <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-6">
            Revisa que usuarios-service (8080) y cursos-service (8086) estén corriendo con el mismo GROWLINK_JWT_SECRET.
          </p>
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Reintentar</Button>
        </CenteredMessage>
      );
    }
    return (
      <CenteredMessage title="Cargando tu roadmap…">
        <div className="flex justify-center text-[#12C2A8]"><Spinner /></div>
      </CenteredMessage>
    );
  }

  if (data === null || !graph) {
    return (
      <CenteredMessage title="Aún no tienes un roadmap">
        <p className="text-[#6B7A99] dark:text-[#8BA5C2] mb-6">
          {hasProfile
            ? 'Genera tu camino de cursos a partir de tus metas, intereses y nivel.'
            : 'Completa tu perfil primero para que podamos generar tu camino de cursos.'}
        </p>
        {hasProfile ? (
          <Button variant="gradient" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Spinner /> Generando…</> : 'Generar mi roadmap'}
          </Button>
        ) : (
          <Button variant="gradient" onClick={() => navigate('onboarding')}>Completar mi perfil</Button>
        )}
        {generateError && <p className="text-sm text-[#DC2626] dark:text-[#F87171] mt-4">{generateError}</p>}
      </CenteredMessage>
    );
  }

  const nodes = graph.nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const totalNodes = nodes.length;
  const completedCount = nodes.filter((n) => n.estado === 'completed').length;
  const progressPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  const current = nodes.find((n) => n.estado === 'current');
  const stale = nodes.some((n) => n.inactivo && n.estado !== 'completed');
  const selected = selectedId !== null ? byId.get(selectedId) : undefined;

  return (
    <div className={page}>
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">
              {data.roadmap.generadoPor === 'IA'
                ? 'Roadmap generado por IA'
                : data.roadmap.generadoPor === 'RESPALDO'
                  ? 'Roadmap en modo de respaldo (sin IA)'
                  : 'Tu roadmap'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 leading-tight">
              Tu camino de aprendizaje
            </h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-2">
              {totalNodes === 0
                ? 'Sin cursos por ahora'
                : `${totalNodes} ${totalNodes === 1 ? 'curso' : 'cursos'} en ${graph.etapas} ${graph.etapas === 1 ? 'etapa' : 'etapas'}`}{' '}
              · generado {timeAgo(data.roadmap.creadoEn)}
            </p>
            {data.roadmap.generadoPor === 'RESPALDO' && (
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1 max-w-xl">
                Se ordenó con los prerequisitos reales de los cursos de tus intereses y tu nivel. La recomendación según tus
                metas con IA se activa cuando el servicio tiene su llave configurada.
              </p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
              {totalNodes > 0 && (
                <Button variant="secondary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                  {downloadingPdf ? (
                    <><Spinner /> Generando PDF...</>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </Button>
              )}
              <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Spinner /> Regenerando...</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerar roadmap
                  </>
                )}
              </Button>
            </div>
            {generateError && <p className="text-xs text-[#DC2626] dark:text-[#F87171]">{generateError}</p>}
            {downloadError && <p className="text-xs text-[#DC2626] dark:text-[#F87171]">{downloadError}</p>}
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-4 text-sm text-[#DC2626] dark:text-[#F87171]">
            No se pudo actualizar el roadmap: {loadError}
          </div>
        )}

        {stale && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#3A2A0D] p-5">
            <div>
              <p className="font-display font-bold text-[#B45309] dark:text-[#FBBF24]">Un curso de tu roadmap ya no está disponible</p>
              <p className="text-sm text-[#92601C] dark:text-[#F3D08A] mt-1">Regenéralo para que la IA lo reemplace por una alternativa activa.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_288px] gap-6 lg:items-start">
          <div className={`${card} p-3 min-w-0`}>
            {totalNodes === 0 ? (
              <div className="text-center px-4 py-16">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">Tu roadmap no tiene cursos</p>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                  No hay cursos activos que coincidan con tus intereses y nivel. Regenéralo cuando se publiquen cursos nuevos.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pb-3 mb-1 border-b border-[#DDE4ED] dark:border-[#1C3254]">
                  <GraphLegend />
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] shrink-0">Toca un curso para ver qué requiere y qué desbloquea</p>
                </div>
                <div ref={graphRef} className="py-2">
                  <RoadmapGraph graph={graph} selectedId={selectedId} onSelect={setSelectedId} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-[#0B1F3A] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 gl-gradient opacity-10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Progreso del camino</p>
                <p className="text-3xl font-mono font-bold text-white mb-3">{progressPct}%</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full gl-gradient" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-[#8BA5C2] font-mono">{completedCount} de {totalNodes} completados</p>
              </div>
            </div>

            {selected ? (
              <CourseDetailPanel
                node={selected}
                byId={byId}
                data={data}
                onSelect={setSelectedId}
              />
            ) : (
              current && (
                <div className={`${card} p-5`}>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Estás aquí</p>
                  <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1">{current.titulo}</p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mb-3">
                    Etapa {current.etapa + 1} · {nivelLabel(current.nivel)}
                  </p>
                  <Button variant="gradient" size="sm" className="w-full" onClick={() => setSelectedId(current.id)}>
                    Ver en el grafo
                  </Button>
                </div>
              )
            )}

            <button
              onClick={() => navigate('catalog')}
              className="gl-card-hover w-full text-left bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 cursor-pointer"
            >
              <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Catálogo general</p>
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Explora todos los cursos por categoría y nivel</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseDetailPanel({
  node,
  byId,
  data,
  onSelect,
}: {
  node: GraphNode;
  byId: Map<number, GraphNode>;
  data: RoadmapBackendData;
  onSelect: (id: number | null) => void;
}) {
  const check = (
    <svg className="w-3.5 h-3.5 shrink-0 text-[#15803D] dark:text-[#4CE07E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-label="completado">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );

  const linkList = (ids: number[]) => (
    <ul className="space-y-1">
      {ids.map((id) => {
        const n = byId.get(id)!;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="w-full flex items-center gap-2 text-left text-sm rounded-lg px-2 py-1.5 hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#6B7A99] dark:text-[#8BA5C2]">#{n.orden + 1}</span>
              <span className="flex-1 min-w-0 truncate">{n.titulo}</span>
              {n.estado === 'completed' && check}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const heading = (text: string, color: string) => (
    <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${color}`}>{text}</p>
  );

  return (
    <div className={`${card} p-5 gl-fade-up`} aria-live="polite">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider">
          Etapa {node.etapa + 1} · #{node.orden + 1} en el orden sugerido
        </p>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Cerrar detalle"
          className="text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-white cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="font-display font-bold text-lg leading-snug text-[#0B1F3A] dark:text-[#E2EBF6]">{node.titulo}</p>
      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1 mb-4">
        {categoriaDesdeEnum(node.categoria)} · {nivelLabel(node.nivel)} ·{' '}
        <span className="font-semibold">{node.inactivo && node.estado !== 'completed' ? 'No disponible' : ESTADO_LABEL[node.estado]}</span>
      </p>

      {node.inactivo && node.estado !== 'completed' && (
        <p className="text-xs rounded-lg p-2.5 mb-4 bg-[#FFFBEB] dark:bg-[#3A2A0D] text-[#B45309] dark:text-[#FBBF24]">
          Este curso fue dado de baja. Regenera tu roadmap para reemplazarlo.
        </p>
      )}

      <div className="space-y-4">
        <div>
          {heading('Requiere', 'text-[#1E73E8] dark:text-[#7CB6FF]')}
          {node.requiere.length > 0 ? (
            linkList(node.requiere)
          ) : (
            node.externos.length === 0 && (
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] px-2">Nada: puedes empezar por aquí.</p>
            )
          )}
          {node.externos.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-[#6B7A99] dark:text-[#8BA5C2] px-2 mb-1">Fuera de tu ruta (otra categoría o nivel):</p>
              <ul className="space-y-1">
                {node.externos.map((id) => {
                  const ext = data.externos.get(id);
                  return (
                    <li key={id} className="flex items-center gap-2 text-sm px-2 py-1 text-[#6B7A99] dark:text-[#8BA5C2]">
                      <span className="flex-1 min-w-0 truncate">
                        {ext ? `${ext.titulo} · ${categoriaDesdeEnum(ext.categoria)}` : `Curso #${id}`}
                      </span>
                      {data.completados.has(id) && check}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <div>
          {heading('Desbloquea', 'text-[#0F9E89] dark:text-[#2DD4BF]')}
          {node.desbloquea.length > 0 ? (
            linkList(node.desbloquea)
          ) : (
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] px-2">Ningún otro curso de tu ruta.</p>
          )}
        </div>
      </div>
    </div>
  );
}
