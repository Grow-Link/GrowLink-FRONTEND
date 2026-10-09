import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ExamModal from '../components/ExamModal';
import StageMap from '../components/roadmap/StageMap';
import NodePanel from '../components/roadmap/NodePanel';
import { useNavigation } from '../store/NavigationContext';
import { getPerfil, type Perfil } from '../services/usuariosServiceApi';
import { fetchRoadmap, generarRoadmap } from '../services/roadmapApi';
import { compartirPdfRoadmap, descargarPdfRoadmap, puedeCompartirPdf } from '../utils/roadmapPdf';
import { timeAgo } from '../utils/format';
import type { RoadmapNode, RoadmapView } from '../utils/roadmapModel';

// HU-12: el roadmap de la persona como un mapa por etapas. Cada curso es una parada; al tocarla se ve por qué
// está en la ruta, qué hacer ahora (estudiar o presentar el examen) y qué otras opciones hay para ese paso.

const page = 'min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]';
const card = 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl';

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
        <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function useEsEscritorio() {
  const consulta = '(min-width: 1024px)';
  const [esEscritorio, setEsEscritorio] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const alCambiar = () => setEsEscritorio(m.matches);
    m.addEventListener('change', alCambiar);
    return () => m.removeEventListener('change', alCambiar);
  }, []);
  return esEscritorio;
}

function Anillo({ porcentaje }: { porcentaje: number }) {
  const largo = 2 * Math.PI * 46;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
        <circle
          cx="55"
          cy="55"
          r="46"
          fill="none"
          stroke="#F5D98B"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={largo}
          strokeDashoffset={largo * (1 - porcentaje / 100)}
          className="gl-ring-draw"
          style={{ ['--ring-total' as string]: largo }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-display font-extrabold leading-none">{porcentaje}%</span>
        <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">de tu ruta</span>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { navigate, currentUser } = useNavigation();
  const esEscritorio = useEsEscritorio();

  // undefined = cargando por primera vez, null = todavía no tiene roadmap
  const [vista, setVista] = useState<RoadmapView | null | undefined>(undefined);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [examenDe, setExamenDe] = useState<RoadmapNode | null>(null);
  const [logro, setLogro] = useState<string | null>(null);
  const [pdf, setPdf] = useState<'idle' | 'descargando' | 'compartiendo'>('idle');
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    setErrorCarga(null);
    Promise.all([fetchRoadmap(), getPerfil()])
      .then(([v, p]) => {
        if (!ignorar) {
          setVista(v);
          setPerfil(p);
        }
      })
      .catch((e: Error) => {
        if (!ignorar) setErrorCarga(e.message);
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser, recarga]);

  useEffect(() => {
    if (!logro) return;
    const id = window.setTimeout(() => setLogro(null), 7000);
    return () => window.clearTimeout(id);
  }, [logro]);

  const cerrarHoja = useCallback(() => setSeleccionado(null), []);
  useEffect(() => {
    if (seleccionado === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !examenDe) cerrarHoja();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seleccionado, examenDe, cerrarHoja]);

  if (!currentUser) return null;
  const tienePerfil = perfil?.completo ?? false;

  async function actualizarRoadmap() {
    if (!perfil || !tienePerfil) {
      navigate('onboarding');
      return;
    }
    setGenerando(true);
    setErrorGenerar(null);
    try {
      await generarRoadmap({ goals: perfil.metas ?? '', interests: perfil.intereses, level: perfil.nivel ?? 'principiante' });
      setSeleccionado(null);
      setRecarga((k) => k + 1);
    } catch (e) {
      setErrorGenerar((e as Error).message);
    } finally {
      setGenerando(false);
    }
  }

  async function bajarPdf() {
    if (!vista) return;
    setPdf('descargando');
    setErrorPdf(null);
    try {
      await descargarPdfRoadmap(vista, currentUser?.name ?? 'usuario');
    } catch (e) {
      setErrorPdf(e instanceof Error ? e.message : 'No se pudo generar el PDF.');
    } finally {
      setPdf('idle');
    }
  }

  async function compartirPdf() {
    if (!vista) return;
    setPdf('compartiendo');
    setErrorPdf(null);
    try {
      await compartirPdfRoadmap(vista, currentUser?.name ?? 'usuario');
    } catch (e) {
      // si la persona cierra el menú de compartir no es un error
      if (!(e instanceof DOMException && e.name === 'AbortError')) setErrorPdf(e instanceof Error ? e.message : 'No se pudo compartir el PDF.');
    } finally {
      setPdf('idle');
    }
  }

  if (vista === undefined) {
    if (errorCarga) {
      return (
        <CenteredMessage title="No pudimos cargar tu roadmap">
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">{errorCarga}</p>
          <Button variant="secondary" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
        </CenteredMessage>
      );
    }
    return (
      <CenteredMessage title="Cargando tu roadmap…">
        <div className="flex justify-center text-[#12C2A8]"><Spinner /></div>
      </CenteredMessage>
    );
  }

  if (vista === null) {
    return (
      <CenteredMessage title="Aún no tienes un roadmap">
        <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">
          Cuéntanos qué quieres lograr y armamos tu ruta paso a paso con los cursos que de verdad tenemos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="gradient" onClick={() => navigate('onboarding')}>Armar mi roadmap</Button>
          {tienePerfil && (
            <Button variant="secondary" onClick={actualizarRoadmap} disabled={generando}>
              {generando ? <><Spinner /> Generando…</> : 'Usar mi perfil guardado'}
            </Button>
          )}
        </div>
        {errorGenerar && <p className="text-sm text-[#DC2626] dark:text-[#F87171] mt-4">{errorGenerar}</p>}
      </CenteredMessage>
    );
  }

  const nodoSeleccionado = vista.nodes.find((n) => n.cursoId === seleccionado) ?? null;
  // en escritorio el panel nunca está vacío: si nadie tocó nada, muestra el siguiente paso
  const nodoDelPanel = nodoSeleccionado ?? (esEscritorio ? vista.siguiente ?? vista.nodes[0] ?? null : null);
  const terminado = vista.progreso.total > 0 && vista.progreso.completados === vista.progreso.total;
  const etiquetaOrigen =
    vista.generadoPor === 'IA' ? 'Armado con inteligencia artificial' : vista.generadoPor === 'RESPALDO' ? 'Armado en modo de respaldo (sin IA)' : 'Tu roadmap';

  const panel = nodoDelPanel && (
    <NodePanel
      key={nodoDelPanel.cursoId}
      nodo={nodoDelPanel}
      sugerido={!nodoSeleccionado}
      onSelectNode={setSeleccionado}
      onTakeExam={setExamenDe}
      onOpenDetail={(id) => navigate('course-detail', { id: String(id) })}
      onRegenerate={actualizarRoadmap}
      onClose={cerrarHoja}
    />
  );

  return (
    <div className={page}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ---------------- encabezado ---------------- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E8A7D] via-[#0B7A6E] to-[#0B6F65] text-white p-5 sm:p-8">
          <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#12C2A8]/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -left-10 -bottom-20 w-56 h-56 rounded-full bg-[#F5A524]/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <span className="text-[#B7E3DA] text-xs font-mono font-semibold tracking-widest uppercase">{etiquetaOrigen}</span>
              <h1 className="text-2xl sm:text-4xl font-display font-bold mt-2 leading-tight">
                {vista.meta ? <>Tu ruta hacia <span className="text-[#F5D98B]">«{vista.meta}»</span></> : 'Tu camino de aprendizaje'}
              </h1>
              {vista.resumen && <p className="mt-3 text-[#D3EEE8] text-sm sm:text-base leading-relaxed max-w-2xl">{vista.resumen}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                {vista.areas.map((a) => (
                  <span key={a} className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium">{a}</span>
                ))}
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium">Parto como {vista.nivel}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium">Armado {timeAgo(vista.creadoEn)}</span>
              </div>
            </div>
            <Anillo porcentaje={vista.progreso.porcentaje} />
          </div>

          <dl className="relative grid grid-cols-3 gap-2 sm:gap-4 mt-6">
            {[
              { valor: `${vista.progreso.completados}/${vista.progreso.total}`, etiqueta: 'cursos aprobados' },
              { valor: `${vista.progreso.horasHechas}/${vista.progreso.horasTotales} h`, etiqueta: 'de estudio' },
              { valor: `${vista.progreso.habilidadesDesbloqueadas.length}/${vista.progreso.habilidadesTotales.length}`, etiqueta: 'habilidades' },
            ].map((d) => (
              <div key={d.etiqueta} className="rounded-2xl bg-white/12 backdrop-blur-sm px-3 py-3 text-center">
                <dd className="text-base sm:text-2xl font-display font-bold whitespace-nowrap">{d.valor}</dd>
                <dt className="text-[11px] sm:text-xs text-[#D3EEE8]">{d.etiqueta}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- acciones ---------------- */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4">
          <Button variant="secondary" size="sm" onClick={() => navigate('onboarding')}>Cambiar mi meta</Button>
          <Button variant="secondary" size="sm" onClick={actualizarRoadmap} disabled={generando}>
            {generando ? <><Spinner /> Actualizando…</> : 'Actualizar roadmap'}
          </Button>
          <Button variant="secondary" size="sm" onClick={bajarPdf} disabled={pdf !== 'idle'}>
            {pdf === 'descargando' ? <><Spinner /> Preparando PDF…</> : 'Descargar PDF'}
          </Button>
          {puedeCompartirPdf() && (
            <Button variant="secondary" size="sm" onClick={compartirPdf} disabled={pdf !== 'idle'}>
              {pdf === 'compartiendo' ? <><Spinner /> Compartiendo…</> : 'Compartir'}
            </Button>
          )}
        </div>
        {(errorGenerar || errorPdf) && (
          <p role="alert" className="mt-3 text-sm text-[#DC2626] dark:text-[#F87171]">{errorGenerar ?? errorPdf}</p>
        )}

        {/* ---------------- avisos ---------------- */}
        {logro && (
          <div role="status" className="mt-4 rounded-2xl border border-[#4CE07E]/50 bg-[#F0FDF4] dark:bg-[#0D2E1A] px-4 py-3 text-sm font-semibold text-[#15803D] dark:text-[#4CE07E] gl-fade-up">
            {logro}
          </div>
        )}
        {vista.hayDadosDeBaja && (
          <div role="alert" className="mt-4 rounded-2xl border border-[#F5A524]/50 bg-[#FBF3E4] dark:bg-[#3A2A0D] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9]">
              <strong>Algunos cursos de tu ruta ya no están disponibles.</strong> Actualiza tu roadmap y los reemplazamos por otras opciones; mientras tanto no se recomiendan.
            </p>
            <Button size="sm" onClick={actualizarRoadmap} disabled={generando}>Actualizar ahora</Button>
          </div>
        )}
        {terminado && (
          <div className={`${card} mt-4 p-5 text-center`}>
            <p className="text-4xl">🏆</p>
            <h2 className="font-display font-bold text-xl text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">¡Completaste toda tu ruta!</h2>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1">Estás listo para el siguiente reto. Define una meta nueva y seguimos creciendo.</p>
            <div className="flex flex-wrap justify-center gap-2.5 mt-4">
              <Button variant="gradient" onClick={() => navigate('onboarding')}>Definir una nueva meta</Button>
              <Button variant="secondary" onClick={() => navigate('trivia')}>Celebrar con una trivia</Button>
            </div>
          </div>
        )}

        {/* ---------------- siguiente paso (atajo) ---------------- */}
        {vista.siguiente && !terminado && (
          <button
            type="button"
            onClick={() => setSeleccionado(vista.siguiente!.cursoId)}
            className="mt-4 w-full text-left rounded-2xl border-2 border-[#F5A524] bg-[#FFFBEB] dark:bg-[#3A2A0D]/60 px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="w-10 h-10 rounded-full bg-[#F5A524] text-white flex items-center justify-center gl-soft-pulse shrink-0">
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#B45309] dark:text-[#FBBF24]">Tu siguiente paso</span>
              <span className="block font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{vista.siguiente.titulo}</span>
              <span className="block text-xs text-[#6B7A74] dark:text-[#98B0A6]">
                {vista.siguiente.horas != null ? `${vista.siguiente.horas} horas · ` : ''}toca para ver cómo empezar
              </span>
            </span>
            <span aria-hidden="true" className="text-[#B45309] text-xl">→</span>
          </button>
        )}

        {/* ---------------- mapa + panel ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 mt-6 items-start">
          <StageMap stages={vista.stages} selectedId={seleccionado} onSelect={setSeleccionado} />

          {esEscritorio ? (
            <aside className={`${card} sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto`} aria-label="Detalle del curso">
              {panel ?? <p className="p-5 text-sm text-[#6B7A74]">Toca un curso del mapa para ver su detalle.</p>}
            </aside>
          ) : (
            nodoSeleccionado && (
              <div className="fixed inset-0 z-40 flex items-end bg-black/45" onClick={cerrarHoja}>
                <div
                  className="gl-sheet-up w-full max-h-[88vh] overflow-y-auto bg-white dark:bg-[#15231F] rounded-t-3xl border-t border-[#E1E6DF] dark:border-[#27403A]"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Detalle del curso"
                  onClick={(e) => e.stopPropagation()}
                >
                  {panel}
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {examenDe && (
        <ExamModal
          cursoId={examenDe.cursoId}
          titulo={examenDe.titulo}
          linkContenido={examenDe.link}
          onClose={() => setExamenDe(null)}
          onApproved={() => {
            setLogro(`¡Aprobaste «${examenDe.titulo}»! Tu roadmap ya avanzó.`);
            setRecarga((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
