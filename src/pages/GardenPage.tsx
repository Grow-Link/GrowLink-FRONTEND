import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { MacetaVacia, SemillaIcono } from '../components/garden/Planta';
import EscenaJardin from '../components/garden/EscenaJardin';
import { useNavigation } from '../store/NavigationContext';
import {
  obtenerJardin,
  plantarSemilla,
  regarPlanta,
  type Jardin,
  type PlantaJardin,
  type SemillaJardin,
} from '../services/usuariosServiceApi';
import { sonar } from '../utils/sonidos';
import { timeAgo } from '../utils/format';

// El Jardín: una semilla por cada roadmap completado, una gota por cada trivia ganada. Todo el estado
// (gotas, semillas, plantas) vive en usuarios-service — este GET también sincroniza semillas nuevas, así que
// basta con volver a cargar la página para que aparezca la del último roadmap que se terminó.

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

function GotaIcono({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c3 4.2 7 9 7 12.8a7 7 0 11-14 0c0-3.8 4-8.6 7-12.8Z" />
    </svg>
  );
}

export default function GardenPage() {
  const { navigate, currentUser } = useNavigation();

  const [jardin, setJardin] = useState<Jardin | undefined>(undefined);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  const [semillaElegida, setSemillaElegida] = useState<SemillaJardin | null>(null);
  const [plantando, setPlantando] = useState(false);
  const [errorPlantar, setErrorPlantar] = useState<string | null>(null);

  const [regandoId, setRegandoId] = useState<number | null>(null);
  const [errorRegar, setErrorRegar] = useState<string | null>(null);
  const [gotaEnEspacio, setGotaEnEspacio] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    setErrorCarga(null);
    obtenerJardin()
      .then((j) => {
        if (!ignorar) setJardin(j);
      })
      .catch((e: Error) => {
        if (!ignorar) setErrorCarga(e.message);
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser, recarga]);

  if (!currentUser) return null;

  function elegirSemilla(s: SemillaJardin) {
    setErrorPlantar(null);
    setSemillaElegida((actual) => (actual?.id === s.id ? null : s));
  }

  async function plantarEn(espacio: number) {
    if (!semillaElegida || !jardin) return;
    setPlantando(true);
    setErrorPlantar(null);
    try {
      const planta = await plantarSemilla(semillaElegida.id, espacio);
      setJardin({
        ...jardin,
        semillas: jardin.semillas.filter((s) => s.id !== semillaElegida.id),
        plantas: [...jardin.plantas, planta],
      });
      setSemillaElegida(null);
      sonar('unirse');
    } catch (e) {
      setErrorPlantar(e instanceof Error ? e.message : 'No se pudo plantar la semilla.');
    } finally {
      setPlantando(false);
    }
  }

  async function regar(p: PlantaJardin) {
    if (!jardin || p.etapa === 'FLORECIDA' || regandoId !== null) return;
    if (jardin.gotas <= 0) {
      setErrorRegar('No te quedan gotas. Gana una trivia para conseguir más.');
      return;
    }
    setRegandoId(p.id);
    setErrorRegar(null);
    setGotaEnEspacio(p.espacio);
    try {
      const { gotas, planta } = await regarPlanta(p.id);
      setJardin({ ...jardin, gotas, plantas: jardin.plantas.map((x) => (x.id === planta.id ? planta : x)) });
      sonar(planta.etapa === 'FLORECIDA' ? 'racha' : 'correcto');
    } catch (e) {
      setErrorRegar(e instanceof Error ? e.message : 'No se pudo regar la planta.');
    } finally {
      setRegandoId(null);
      window.setTimeout(() => setGotaEnEspacio(null), 700);
    }
  }

  // ─── cargando / error ────────────────────────────────────────
  if (jardin === undefined) {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          {errorCarga ? (
            <>
              <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">No pudimos cargar tu jardín</h1>
              <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">{errorCarga}</p>
              <Button variant="secondary" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
            </>
          ) : (
            <div className="flex justify-center text-[#12C2A8]"><Spinner /></div>
          )}
        </div>
      </div>
    );
  }

  const plantaPorEspacio = new Map(jardin.plantas.map((p) => [p.espacio, p]));
  const florecidas = jardin.plantas.filter((p) => p.etapa === 'FLORECIDA').length;
  const hayAlgo = jardin.semillas.length > 0 || jardin.plantas.length > 0;

  return (
    <div className={page}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ---------------- encabezado ---------------- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E8A7D] via-[#0B7A6E] to-[#0B6F65] text-white p-5 sm:p-8">
          <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#12C2A8]/25 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <span className="text-[#B7E3DA] text-xs font-mono font-semibold tracking-widest uppercase">Tu jardín</span>
              <h1 className="text-2xl sm:text-4xl font-display font-bold mt-2 leading-tight">Cada logro, una planta</h1>
              <p className="mt-2 text-[#D3EEE8] text-sm sm:text-base max-w-md">
                Un roadmap completado te da una semilla. Una trivia ganada te da una gota para regarla.
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/12 backdrop-blur-sm px-5 py-3.5 self-start">
              <GotaIcono className="w-7 h-7 text-[#5FD3C2]" />
              <div>
                <p className="text-2xl font-display font-extrabold leading-none">{jardin.gotas}</p>
                <p className="text-[11px] text-[#D3EEE8] mt-0.5">{jardin.gotas === 1 ? 'gota disponible' : 'gotas disponibles'}</p>
              </div>
            </div>
          </div>
          {florecidas > 0 && (
            <p className="relative mt-4 text-sm text-[#F5D98B] font-semibold">
              🌸 {florecidas} {florecidas === 1 ? 'planta florecida' : 'plantas florecidas'}
            </p>
          )}
        </section>

        {!hayAlgo ? (
          // ---------------- estado vacío total ----------------
          <div className={`${card} mt-6 p-8 sm:p-12 text-center`}>
            <div className="flex justify-center mb-4"><MacetaVacia size={88} /></div>
            <h2 className="font-display font-bold text-xl text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">Tu jardín está esperando su primera semilla</h2>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] max-w-md mx-auto mb-6">
              Completa un roadmap para ganar una semilla, y gana una trivia para conseguir la primera gota con la que regarla.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="gradient" onClick={() => navigate('roadmap')}>Ir a mi roadmap</Button>
              <Button variant="secondary" onClick={() => navigate('trivia')}>Jugar trivia</Button>
            </div>
          </div>
        ) : (
          <>
            {/* ---------------- semillero ---------------- */}
            <section className={`${card} mt-6 p-5 sm:p-6`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Semillero</h2>
                <span className="text-xs font-mono text-[#6B7A74] dark:text-[#98B0A6]">{jardin.semillas.length} sin plantar</span>
              </div>

              {jardin.semillas.length === 0 ? (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">
                  No tienes semillas sin plantar. Completa otro roadmap para ganar una nueva.
                </p>
              ) : (
                <>
                  <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-3">Toca una semilla y luego un espacio libre del jardín para plantarla.</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {jardin.semillas.map((s) => {
                      const elegida = semillaElegida?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => elegirSemilla(s)}
                          aria-pressed={elegida}
                          className={`gl-card-hover shrink-0 w-36 text-left rounded-2xl border-2 p-3 cursor-pointer transition-colors ${
                            elegida
                              ? 'border-[#0E8A7D] bg-[#0E8A7D]/10 ring-2 ring-offset-2 ring-[#0E8A7D] ring-offset-white dark:ring-offset-[#15231F]'
                              : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] hover:border-[#12C2A8]'
                          }`}
                        >
                          <SemillaIcono categoria={s.categoria} size={32} />
                          <p className="text-xs font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2 leading-snug line-clamp-2">{s.titulo}</p>
                          <p className="text-[10px] text-[#6B7A74] dark:text-[#98B0A6] mt-1">{s.categoria}</p>
                          <p className="text-[10px] text-[#6B7A74] dark:text-[#98B0A6]">{timeAgo(s.obtenidaEn)}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {semillaElegida && (
                <div role="status" className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#0E8A7D]/40 bg-[#0E8A7D]/10 px-3.5 py-2.5">
                  <p className="text-xs text-[#0B6F65] dark:text-[#5FD3C2] font-semibold">
                    «{semillaElegida.titulo}» lista para plantar — toca un espacio libre abajo.
                  </p>
                  <button type="button" onClick={() => setSemillaElegida(null)} className="text-xs text-[#6B7A74] dark:text-[#98B0A6] hover:underline cursor-pointer shrink-0">
                    Cancelar
                  </button>
                </div>
              )}
              {errorPlantar && <p role="alert" className="mt-3 text-sm text-[#DC2626] dark:text-[#F87171]">{errorPlantar}</p>}
            </section>

            {/* ---------------- el jardín ---------------- */}
            <section className={`${card} mt-5 p-5 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Tu jardín</h2>
                <span className="text-xs font-mono text-[#6B7A74] dark:text-[#98B0A6]">{jardin.plantas.length}/{jardin.espacios} espacios ocupados</span>
              </div>
              {errorRegar && <p role="alert" className="mb-3 text-sm text-[#DC2626] dark:text-[#F87171]">{errorRegar}</p>}

              <EscenaJardin
                plantaPorEspacio={plantaPorEspacio}
                totalEspacios={jardin.espacios}
                puedePlantar={semillaElegida !== null}
                plantando={plantando}
                regandoId={regandoId}
                gotaEnEspacio={gotaEnEspacio}
                onClickEspacio={(num) => {
                  const planta = plantaPorEspacio.get(num);
                  if (planta) void regar(planta);
                  else void plantarEn(num);
                }}
              />

              {jardin.gotas === 0 && jardin.plantas.some((p) => p.etapa !== 'FLORECIDA') && (
                <p className="mt-4 text-xs text-center text-[#B45309] dark:text-[#FBBF24]">
                  No te quedan gotas para regar. Gana una partida de trivia para conseguir más.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
