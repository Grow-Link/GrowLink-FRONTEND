import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import CheckpointPath from '../components/CheckpointPath';
import { useNavigation } from '../store/NavigationContext';
import { getEstadoHome, getPerfil, type EstadoHome, type Perfil } from '../services/usuariosServiceApi';
import { fetchRoadmap, generarRoadmap } from '../services/roadmapApi';
import { listarCompletados, type CursoCompletado } from '../services/cursosServiceApi';
import { timeAgo } from '../utils/format';
import type { RoadmapView } from '../utils/roadmapModel';

const CHECKPOINTS = [{ label: 'Áreas' }, { label: 'Tu meta' }, { label: 'Tu punto de partida' }];
const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

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

export default function HomePage() {
  const { navigate, currentUser } = useNavigation();

  // undefined = cargando por primera vez
  const [estado, setEstado] = useState<EstadoHome | undefined>(undefined);
  const [perfil, setPerfil] = useState<Perfil | undefined>(undefined);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  const [vista, setVista] = useState<RoadmapView | null | undefined>(undefined);
  const [errorRoadmap, setErrorRoadmap] = useState<string | null>(null);
  const [completados, setCompletados] = useState<CursoCompletado[]>([]);

  const [generando, setGenerando] = useState(false);
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null);

  // HU-01/HU-10: qué variante del Home mostrar viene de usuarios-service, no de un estado local simulado.
  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    setEstadoError(null);
    Promise.all([getEstadoHome(), getPerfil()])
      .then(([e, p]) => {
        if (ignorar) return;
        setEstado(e);
        setPerfil(p);
      })
      .catch((err: unknown) => {
        if (!ignorar) setEstadoError(err instanceof Error ? err.message : 'No se pudo cargar tu estado.');
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser, recarga]);

  useEffect(() => {
    if (estado?.estado !== 'CON_ROADMAP' || !currentUser) return;
    let ignorar = false;
    setErrorRoadmap(null);
    Promise.all([fetchRoadmap(), listarCompletados(Number(currentUser.id))])
      .then(([v, c]) => {
        if (ignorar) return;
        setVista(v);
        setCompletados(c);
      })
      .catch((err: unknown) => {
        if (!ignorar) setErrorRoadmap(err instanceof Error ? err.message : 'No se pudo cargar tu roadmap.');
      });
    return () => {
      ignorar = true;
    };
  }, [estado, currentUser, recarga]);

  if (!currentUser) return null;
  const nombre = currentUser.name.split(' ')[0];

  async function generarConMiPerfil() {
    if (!perfil) return;
    setGenerando(true);
    setErrorGenerar(null);
    try {
      await generarRoadmap({ goals: perfil.metas ?? '', interests: perfil.intereses, level: perfil.nivel ?? 'principiante' });
      setRecarga((k) => k + 1);
    } catch (err) {
      setErrorGenerar(err instanceof Error ? err.message : 'No se pudo generar el roadmap.');
    } finally {
      setGenerando(false);
    }
  }

  // ─── cargando / error al pedir el estado del Home ──────────
  if (estado === undefined) {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          {estadoError ? (
            <>
              <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">No pudimos cargar tu estado</h1>
              <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">{estadoError}</p>
              <Button variant="secondary" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
            </>
          ) : (
            <div className="flex justify-center text-[#12C2A8]"><Spinner /></div>
          )}
        </div>
      </div>
    );
  }

  // ─── VARIANTE 1: sin perfil ─────────────────────────────────
  if (estado.estado === 'SIN_PERFIL') {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] p-7 sm:p-14 text-center">
            <div className="gl-float absolute top-0 right-0 w-72 h-72 gl-gradient opacity-20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Bienvenido a GrowLink</span>
              <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mt-3 mb-4 leading-tight">
                Hola, {nombre}.<br />Armemos tu camino.
              </h1>
              <p className="text-[#BCC9C2] text-base sm:text-lg max-w-xl mx-auto mb-8">
                Elige un área, cuéntanos qué quieres lograr y desde dónde partes. En tres pasos te armamos una ruta de cursos con tiempos, temario y exámenes.
              </p>
              <div className="max-w-lg mx-auto mb-8">
                <CheckpointPath checkpoints={CHECKPOINTS} completedCount={0} variant="dark" />
              </div>
              <Button variant="gradient" size="lg" onClick={() => navigate('onboarding')}>
                Armar mi roadmap
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VARIANTE 2: perfil listo, roadmap sin generar ─────────
  if (estado.estado === 'CON_PERFIL_SIN_ROADMAP') {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
          <div className="text-center mb-8">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Perfil guardado</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2 mb-3">Todo listo, {nombre}.</h1>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] max-w-lg mx-auto">Ya tenemos tu meta. Genera tu roadmap para ver el camino de cursos paso a paso.</p>
          </div>

          {perfil && (
            <div className={`${card} p-6 mb-6`}>
              {perfil.metas && <p className="text-[#1F2D2A] dark:text-[#E6EFE9] font-display font-semibold leading-snug mb-3">«{perfil.metas}»</p>}
              <div className="flex flex-wrap gap-2">
                {perfil.intereses.map((i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#1F2D2A] dark:text-[#E6EFE9] border border-[#E1E6DF] dark:border-[#27403A]">{i}</span>
                ))}
                {perfil.nivel && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">Parto como {perfil.nivel}</span>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="gradient" size="lg" onClick={generarConMiPerfil} disabled={generando}>
              {generando ? <><Spinner /> Generando tu roadmap…</> : 'Generar mi roadmap'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('onboarding')}>Cambiar mi meta</Button>
          </div>
          {errorGenerar && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171] mt-4 text-center">{errorGenerar}</p>}
        </div>
      </div>
    );
  }

  // ─── VARIANTE 3: roadmap generado ──────────────────────────
  const siguiente = vista?.siguiente ?? null;
  const progreso = vista?.progreso;

  return (
    <div className={page}>
      <Navbar />

      <div className="bg-gradient-to-br from-[#0E8A7D] to-[#0B6F65] relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-[#12C2A8]/25 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <span className="text-[#B7E3DA] text-xs font-mono font-semibold tracking-widest uppercase">Tu progreso</span>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-white mt-2 leading-tight max-w-2xl">
            Hola, {nombre}
            {progreso ? <> — vas al <span className="text-[#F5D98B]">{progreso.porcentaje}%</span> de tu ruta.</> : '.'}
          </h1>
          {progreso && (
            <div className="mt-5 max-w-md">
              <ProgressBar value={progreso.porcentaje} size="md" variant="gradient" />
              <p className="text-xs text-[#D3EEE8] mt-2 font-mono">
                {progreso.completados} de {progreso.total} cursos aprobados · {progreso.horasHechas} de {progreso.horasTotales} horas
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {errorRoadmap && (
          <div role="alert" className="mb-6 rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-4 text-sm text-[#DC2626] dark:text-[#F87171]">
            No se pudo cargar el detalle de tu roadmap: {errorRoadmap}
          </div>
        )}

        {vista?.hayDadosDeBaja && (
          <div role="alert" className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F5A524]/40 bg-[#FBF3E4] dark:bg-[#3A2A0D] p-5">
            <div>
              <p className="font-display font-bold text-[#B45309] dark:text-[#FBBF24]">Tu roadmap tiene cursos que ya no están disponibles</p>
              <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Actualízalo y los reemplazamos por otras opciones activas.</p>
            </div>
            <Button variant="primary" onClick={generarConMiPerfil} disabled={generando} className="self-start sm:self-auto shrink-0">
              {generando ? <><Spinner /> Actualizando…</> : 'Actualizar roadmap'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8">
          <div className="space-y-6">
            {vista === undefined ? (
              <div className={`${card} p-8 text-center`}><div className="flex justify-center text-[#12C2A8]"><Spinner /></div></div>
            ) : siguiente ? (
              <section className="relative overflow-hidden rounded-3xl bg-[#1F2D2A] p-6 sm:p-8">
                <div className="gl-float absolute top-0 right-0 w-56 h-56 gl-gradient opacity-25 blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase text-[#F5A524] mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524] live-pulse" />
                    Tu siguiente paso
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-snug mb-2">{siguiente.titulo}</h2>
                  <p className="text-[#BCC9C2] text-sm mb-1">
                    {siguiente.categoria} · {NIVEL_TEXTO[siguiente.nivel]}
                    {siguiente.horas != null && ` · ${siguiente.horas} horas`}
                  </p>
                  {siguiente.razon && <p className="text-[#98B0A6] text-sm leading-relaxed mb-5 max-w-xl">{siguiente.razon}</p>}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="gradient" onClick={() => navigate('roadmap')}>Continuar mi ruta</Button>
                    {siguiente.link && (
                      <a href={siguiente.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border border-white/25 text-white hover:bg-white/10 transition-colors">
                        Ir al curso ↗
                      </a>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className={`${card} p-8 text-center`}>
                <p className="text-4xl">🏆</p>
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mt-2 mb-1">¡Completaste todo tu roadmap!</p>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-4">Define una meta nueva para seguir creciendo.</p>
                <Button variant="gradient" onClick={() => navigate('onboarding')}>Definir una nueva meta</Button>
              </section>
            )}

            {vista && vista.stages.length > 0 && (
              <section className={`${card} p-5 sm:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg">Tu ruta por etapas</h2>
                  <button type="button" onClick={() => navigate('roadmap')} className="text-sm text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Ver el mapa completo</button>
                </div>
                <ol className="space-y-3">
                  {vista.stages.map((etapa) => (
                    <li key={etapa.index} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full gl-gradient text-white text-sm font-bold flex items-center justify-center shrink-0">{etapa.index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{etapa.nombre}</p>
                        <ProgressBar value={etapa.completados} max={etapa.nodes.length} size="sm" variant="teal" />
                      </div>
                      <span className="text-xs font-mono text-[#6B7A74] dark:text-[#98B0A6] shrink-0">{etapa.completados}/{etapa.nodes.length}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => navigate('catalog')} className={`gl-card-hover text-left ${card} p-5 cursor-pointer`}>
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Catálogo de cursos</p>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">Busca y filtra todo lo disponible</p>
              </button>
              <button onClick={() => navigate('trivia')} className={`gl-card-hover text-left ${card} p-5 cursor-pointer`}>
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Trivia en vivo</p>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">Compite o reta a alguien</p>
              </button>
              <button onClick={() => navigate('completed-courses')} className={`gl-card-hover text-left ${card} p-5 cursor-pointer`}>
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Mis cursos aprobados</p>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">{completados.length} {completados.length === 1 ? 'curso' : 'cursos'} en tu historial</p>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {perfil && (
              <div className={`${card} p-5`}>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-semibold uppercase tracking-wider mb-3">Tu meta</p>
                {perfil.metas && <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed mb-3">«{perfil.metas}»</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {perfil.intereses.map((i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#6B7A74] dark:text-[#98B0A6] border border-[#E1E6DF] dark:border-[#27403A]">{i}</span>
                  ))}
                </div>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-3">Trivias ganadas: <span className="font-mono font-bold">{perfil.triviasGanadas}</span></p>
                <button onClick={() => navigate('onboarding')} className="text-xs text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Cambiar mi meta</button>
              </div>
            )}

            <div className={`${card} p-5`}>
              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-semibold uppercase tracking-wider mb-3">Últimos aprobados</p>
              {completados.length === 0 ? (
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">Aún no apruebas cursos. Presenta tu primer examen desde el roadmap.</p>
              ) : (
                <div className="space-y-2.5">
                  {[...completados]
                    .sort((a, b) => b.fechaCompletado.localeCompare(a.fechaCompletado))
                    .slice(0, 4)
                    .map((c) => (
                      <div key={c.cursoId} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{c.titulo}</p>
                          <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">{timeAgo(c.fechaCompletado)}</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4CE07E] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
