import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ExamModal from '../components/ExamModal';
import MundoMap, { type TemaMundo } from '../components/roadmap/MundoMap';
import AventuraHud from '../components/roadmap/AventuraHud';
import NodePanel from '../components/roadmap/NodePanel';
import { useNavigation } from '../store/NavigationContext';
import { getPerfil, type Perfil } from '../services/usuariosServiceApi';
import { fetchRoadmap, generarRoadmap } from '../services/roadmapApi';
import { compartirPdfRoadmap, descargarPdfRoadmap, puedeCompartirPdf } from '../utils/roadmapPdf';
import { timeAgo } from '../utils/format';
import type { ExamenObjetivo, RoadmapView } from '../utils/roadmapModel';

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

interface MenuOpcionesProps {
  generando: boolean;
  pdf: 'idle' | 'descargando' | 'compartiendo';
  puedeCompartir: boolean;
  onActualizar: () => void;
  onCambiarMeta: () => void;
  onDescargar: () => void;
  onCompartir: () => void;
}

/** Las acciones que no se usan a cada rato (actualizar, cambiar la meta, el PDF), recogidas en un solo menú. */
function MenuOpciones({ generando, pdf, puedeCompartir, onActualizar, onCambiarMeta, onDescargar, onCompartir }: MenuOpcionesProps) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const item = 'w-full text-left px-3.5 py-2.5 text-sm font-medium text-[#1F2D2A] dark:text-[#E6EFE9] hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2';
  const elegir = (accion: () => void) => () => {
    setAbierto(false);
    accion();
  };

  return (
    <div ref={caja} className="relative shrink-0">
      <Button variant="secondary" size="sm" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
        {generando || pdf !== 'idle' ? <Spinner /> : null}
        Opciones
        <svg className={`w-3.5 h-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </Button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 z-40 w-56 overflow-hidden rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] shadow-xl gl-fade-up">
          <button type="button" role="menuitem" className={item} disabled={generando} onClick={elegir(onActualizar)}>
            Actualizar roadmap
          </button>
          <button type="button" role="menuitem" className={item} onClick={elegir(onCambiarMeta)}>
            Cambiar mi meta
          </button>
          <button type="button" role="menuitem" className={`${item} border-t border-[#E1E6DF] dark:border-[#27403A]`} disabled={pdf !== 'idle'} onClick={elegir(onDescargar)}>
            Descargar PDF
          </button>
          {puedeCompartir && (
            <button type="button" role="menuitem" className={item} disabled={pdf !== 'idle'} onClick={elegir(onCompartir)}>
              Compartir
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const CLAVE_VISTA = 'gl_vista_roadmap';

function temaGuardado(): TemaMundo {
  try {
    const v = localStorage.getItem(CLAVE_VISTA);
    return v === 'dia' || v === 'camino' ? 'dia' : 'noche';
  } catch {
    return 'noche';
  }
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
  const [examenDe, setExamenDe] = useState<ExamenObjetivo | null>(null);
  const [logro, setLogro] = useState<string | null>(null);
  const [pdf, setPdf] = useState<'idle' | 'descargando' | 'compartiendo'>('idle');
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [tipoMapa, setTipoMapa] = useState<TemaMundo>(temaGuardado);
  const [resumenAbierto, setResumenAbierto] = useState(false);

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

  function cambiarMapa(t: TemaMundo) {
    setTipoMapa(t);
    try {
      localStorage.setItem(CLAVE_VISTA, t);
    } catch {
      /* sin almacenamiento: la elección vale solo para esta visita */
    }
  }

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
      await generarRoadmap({
        goals: perfil.metas ?? '',
        interests: perfil.intereses,
        level: perfil.nivel ?? 'principiante',
        hoursPerWeek: perfil.horasPorSemana,
        weeks: perfil.semanas,
      });
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

  const quedan = vista.progreso.horasFaltan;
  const terminado = vista.progreso.total > 0 && vista.progreso.completados === vista.progreso.total;
  const hayAviso = Boolean(logro) || terminado || vista.hayDadosDeBaja || Boolean(errorGenerar) || Boolean(errorPdf);

  return (
    <div className={page}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* ---------------- encabezado: el título y una línea, nada más ---------------- */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[#0E8A7D] dark:text-[#5FD3C2] text-[11px] font-mono font-semibold tracking-widest uppercase">{etiquetaOrigen}</span>
              <h1 title={vista.meta || undefined} className="text-lg sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1 leading-tight text-balance line-clamp-3 sm:line-clamp-none">
                {vista.meta ? <>Tu ruta hacia <span className="text-[#0E8A7D] dark:text-[#5FD3C2]">«{vista.meta}»</span></> : 'Tu camino de aprendizaje'}
              </h1>
            </div>
            <MenuOpciones
              generando={generando}
              pdf={pdf}
              puedeCompartir={puedeCompartirPdf()}
              onActualizar={actualizarRoadmap}
              onCambiarMeta={() => navigate('onboarding')}
              onDescargar={bajarPdf}
              onCompartir={compartirPdf}
            />
          </div>
          <p className="mt-2 text-sm text-[#6B7A74] dark:text-[#98B0A6] flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{vista.areas.join(' · ')}</span>
            <span aria-hidden="true">·</span>
            <span>Parto como {vista.nivel}</span>
            {vista.tiempo && (
              <>
                <span aria-hidden="true">·</span>
                <span title="Tu ruta se armó para que lo que te falta quepa en este tiempo">
                  {vista.tiempo.horasPorSemana} h por semana × {vista.tiempo.semanas} semanas
                  {quedan > 0 ? ` · te faltan ${quedan} de ${vista.tiempo.presupuesto} h` : ''}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>Armado {timeAgo(vista.creadoEn)}</span>
            {(vista.resumen || vista.aprobadosAntes.length > 0) && (
              <button
                type="button"
                aria-expanded={resumenAbierto}
                onClick={() => setResumenAbierto((v) => !v)}
                className="font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer"
              >
                {resumenAbierto ? 'Ocultar' : '¿Por qué esta ruta?'}
              </button>
            )}
          </p>
          {resumenAbierto && (
            <div className="mt-2 max-w-3xl space-y-2 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed gl-fade-up">
              {vista.resumen && <p>{vista.resumen}</p>}
              {vista.aprobadosAntes.length > 0 && (
                <p>
                  <span className="font-semibold text-[#15803D] dark:text-[#4CE07E]">Lo que ya habías aprobado no se repite: </span>
                  {vista.aprobadosAntes.slice(0, 4).map((c) => c.titulo).join(', ')}
                  {vista.aprobadosAntes.length > 4 ? ` y ${vista.aprobadosAntes.length - 4} más` : ''}. Siguen en tu historial de aprobados.
                </p>
              )}
            </div>
          )}
        </header>

        {/* ---------------- avisos: solo cuando hay algo que decir ---------------- */}
        {hayAviso && (
          <div className="mt-4 space-y-3">
            {(errorGenerar || errorPdf) && (
              <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{errorGenerar ?? errorPdf}</p>
            )}
            {logro && (
              <div role="status" className="rounded-2xl border border-[#4CE07E]/50 bg-[#F0FDF4] dark:bg-[#0D2E1A] px-4 py-3 text-sm font-semibold text-[#15803D] dark:text-[#4CE07E] gl-fade-up">
                {logro}
              </div>
            )}
            {terminado && (
              <div className={`${card} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-[#F5A524]/60 bg-gradient-to-br from-[#FFFBEB] to-[#FBF3E4] dark:from-[#3A2A0D]/60 dark:to-[#2A200B]/60`}>
                <div>
                  <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">🌱 ¡Completaste tu roadmap! Ganaste una semilla para tu jardín.</p>
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1">Ábrelo para plantarla — ahí mismo se suma a tu jardín.</p>
                </div>
                <Button variant="gradient" onClick={() => navigate('garden')} className="shrink-0">Ir a mi jardín</Button>
              </div>
            )}
            {vista.hayDadosDeBaja && (
              <div role="alert" className="rounded-2xl border border-[#F5A524]/50 bg-[#FBF3E4] dark:bg-[#3A2A0D] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9]">
                  <strong>Algún curso de tu ruta ya no está disponible.</strong> Actualiza tu roadmap para ver otras opciones; lo que ya aprobaste se conserva.
                </p>
                <Button size="sm" onClick={actualizarRoadmap} disabled={generando}>
                  {generando ? <><Spinner /> Actualizando…</> : 'Actualizar ahora'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- tu avance, en una franja ---------------- */}
        <div className="mt-4">
          <AventuraHud vista={vista} onSelect={setSeleccionado} onNuevaMeta={() => navigate('onboarding')} />
        </div>

        {/* ---------------- mapa + panel ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 mt-4 items-start">
          <div className="min-w-0">
            <MundoMap vista={vista} selectedId={seleccionado} onSelect={setSeleccionado} tema={tipoMapa} onCambiarTema={cambiarMapa} />
          </div>

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
            setLogro(examenDe.paso ? `¡Aprobaste «${examenDe.titulo}»! Con eso cumpliste el paso «${examenDe.paso}».` : `¡Aprobaste «${examenDe.titulo}»! Tu roadmap ya avanzó.`);
            setRecarga((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
