import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CheckpointPath from '../components/CheckpointPath';
import CategoryGlyph from '../components/CategoryGlyph';
import { useNavigation } from '../store/NavigationContext';
import { BackendError } from '../services/backendSession';
import { getPerfil, guardarIntereses, guardarMetas, guardarNivel, guardarTiempo } from '../services/usuariosServiceApi';
import { listarAreas, type AreaResumen } from '../services/cursosServiceApi';
import { generarRoadmap } from '../services/roadmapApi';
import type { Level } from '../types';

const CHECKPOINTS = [{ label: 'Áreas' }, { label: 'Tu meta' }, { label: 'Punto de partida y tiempo' }];

// el tiempo es opcional: horas por semana x semanas = el tope de horas de la ruta
const HORAS_POR_SEMANA = [2, 5, 10, 15, 20];
const PLAZOS: { semanas: number; label: string }[] = [
  { semanas: 4, label: '1 mes' },
  { semanas: 13, label: '3 meses' },
  { semanas: 26, label: '6 meses' },
  { semanas: 52, label: '1 año' },
];

const LEVELS: { value: Level; label: string; copy: string }[] = [
  { value: 'principiante', label: 'Estoy empezando', copy: 'Es nuevo para mí, o solo lo he probado un poco. Quiero una base sólida.' },
  { value: 'intermedio', label: 'Ya tengo práctica', copy: 'Conozco lo básico y he hecho cosas. Quiero profundizar y llenar vacíos.' },
  { value: 'avanzado', label: 'Lo domino', copy: 'Tengo experiencia real. Busco retos y especializarme.' },
];

const PASOS_GENERANDO = ['Leyendo tu meta', 'Buscando entre los cursos disponibles', 'Ordenando tu ruta paso a paso'];

interface ErrorDeMeta {
  tipo: 'sin-sentido' | 'sin-cursos' | 'tiempo' | 'plan' | 'otro';
  mensaje: string;
}

export default function OnboardingPage() {
  const { navigate, currentUser } = useNavigation();

  const [areas, setAreas] = useState<AreaResumen[] | null>(null);
  const [errorAreas, setErrorAreas] = useState<string | null>(null);
  const [tienePerfil, setTienePerfil] = useState(false);

  const [paso, setPaso] = useState(0);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [meta, setMeta] = useState('');
  const [nivel, setNivel] = useState<Level>('principiante');
  const [horasSemana, setHorasSemana] = useState<number | null>(null);
  const [plazo, setPlazo] = useState<number | null>(null);

  const [generando, setGenerando] = useState(false);
  const [pasoGenerando, setPasoGenerando] = useState(0);
  const [errorMeta, setErrorMeta] = useState<ErrorDeMeta | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    Promise.all([listarAreas(), getPerfil().catch(() => null)])
      .then(([listaAreas, perfil]) => {
        if (ignorar) return;
        setAreas(listaAreas);
        if (perfil) {
          // solo se recuerdan áreas que todavía existen: si un área se quedó sin cursos, ya no se puede elegir
          const vigentes = new Set(listaAreas.map((a) => a.etiqueta));
          // plan gratuito: un solo tema (una sola área); si el perfil guardaba varias, se parte de la primera
          setElegidas(perfil.intereses.filter((i) => vigentes.has(i)).slice(0, 1));
          setMeta(perfil.metas ?? '');
          if (perfil.nivel) setNivel(perfil.nivel);
          setHorasSemana(perfil.horasPorSemana);
          setPlazo(perfil.semanas);
          setTienePerfil(perfil.completo);
        }
      })
      .catch((err: unknown) => {
        if (!ignorar) setErrorAreas(err instanceof Error ? err.message : 'No pudimos cargar las áreas disponibles.');
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser]);

  // mientras se genera, la pantalla va "narrando" lo que pasa para que la espera no se sienta vacía
  useEffect(() => {
    if (!generando) return;
    setPasoGenerando(0);
    const id = window.setInterval(() => setPasoGenerando((p) => Math.min(p + 1, PASOS_GENERANDO.length - 1)), 1600);
    return () => window.clearInterval(id);
  }, [generando]);

  const areasElegidas = useMemo(() => (areas ?? []).filter((a) => elegidas.includes(a.etiqueta)), [areas, elegidas]);

  // ideas de meta que salen de lo que de verdad hay en las áreas elegidas
  const ideas = useMemo(() => {
    const fuente = areasElegidas.length > 0 ? areasElegidas : (areas ?? []);
    return fuente.flatMap((a) => a.habilidades.slice(0, 3).map((h) => `Quiero aprender ${h}`)).slice(0, 6);
  }, [areas, areasElegidas]);

  const totalCursos = (areas ?? []).reduce((suma, a) => suma + a.cursos, 0);
  const totalHoras = (areas ?? []).reduce((suma, a) => suma + a.horasTotales, 0);

  // el tiempo vale solo si se eligieron las dos cosas
  const tiempoElegido = horasSemana !== null && plazo !== null;
  const horasEnTotal = tiempoElegido ? horasSemana * plazo : null;
  const horasDeLasAreas = areasElegidas.reduce((suma, a) => suma + a.horasTotales, 0);

  const metaLimpia = meta.trim();
  const metaPareceValida = metaLimpia.length >= 10 && /[a-záéíóúñ]{3,}/i.test(metaLimpia);
  const tiempoACompletar = (horasSemana === null) !== (plazo === null);
  const puedeAvanzar = paso === 0 ? elegidas.length > 0 : paso === 1 ? metaPareceValida : !tiempoACompletar;

  // plan gratuito: un roadmap es de UN solo tema, así que elegir un área reemplaza a la anterior
  function alternarArea(etiqueta: string) {
    setElegidas((prev) => (prev.includes(etiqueta) ? [] : [etiqueta]));
    if (errorMeta) setErrorMeta(null);
  }

  async function crearRoadmap() {
    setGenerando(true);
    setErrorMeta(null);
    try {
      // primero se genera: si la meta no sirve, no se guarda nada y la persona puede corregirla
      await generarRoadmap({
        goals: metaLimpia,
        interests: elegidas,
        level: nivel,
        hoursPerWeek: tiempoElegido ? horasSemana : null,
        weeks: tiempoElegido ? plazo : null,
      });
      await guardarMetas(metaLimpia);
      await guardarIntereses(elegidas);
      await guardarNivel(nivel);
      await guardarTiempo(tiempoElegido ? horasSemana : null, tiempoElegido ? plazo : null);
      navigate('roadmap', { replace: true });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No pudimos crear tu roadmap.';
      const estado = err instanceof BackendError ? err.status : undefined;
      // el servidor avisa del tiempo con "tiempo disponible": ese error se corrige en el paso 3, no en la meta
      const porTiempo = estado === 422 && /tiempo disponible/i.test(mensaje);
      // el límite del plan gratuito: si pasa por las áreas se corrige en el paso 1; si es por la meta, en el paso 2
      const porPlan = estado === 422 && /plan gratuito/i.test(mensaje);
      setErrorMeta({
        tipo: porTiempo ? 'tiempo' : porPlan ? 'plan' : estado === 400 ? 'sin-sentido' : estado === 422 ? 'sin-cursos' : 'otro',
        mensaje,
      });
      setPaso(porTiempo ? 2 : porPlan && /una sola área/i.test(mensaje) ? 0 : 1);
    } finally {
      setGenerando(false);
    }
  }

  if (!areas && !errorAreas) {
    return (
      <Fondo>
        <div className="max-w-lg mx-auto text-center px-4 py-24 flex justify-center text-[#12C2A8]">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </Fondo>
    );
  }

  if (errorAreas || !areas || areas.length === 0) {
    return (
      <Fondo>
        <div className="max-w-lg mx-auto text-center px-4 py-20">
          <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">
            {errorAreas ? 'No pudimos cargar el catálogo' : 'Todavía no hay cursos publicados'}
          </h1>
          <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-2">
            {errorAreas ?? 'Cuando haya cursos disponibles podrás armar tu roadmap aquí.'}
          </p>
          <Button className="mt-6" variant="secondary" onClick={() => navigate('home')}>
            Volver al inicio
          </Button>
        </div>
      </Fondo>
    );
  }

  if (generando) {
    return (
      <Fondo>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="mx-auto w-16 h-16 rounded-full gl-gradient flex items-center justify-center gl-glow-teal">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-6">Armando tu roadmap</h1>
          <ul className="mt-6 space-y-2.5 text-left inline-block">
            {PASOS_GENERANDO.map((texto, i) => (
              <li key={texto} className={`flex items-center gap-2.5 text-sm transition-opacity ${i <= pasoGenerando ? 'opacity-100' : 'opacity-30'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < pasoGenerando ? 'bg-[#12C2A8] text-white' : i === pasoGenerando ? 'bg-[#F5A524] text-white animate-pulse' : 'bg-[#E1E6DF] dark:bg-[#27403A]'}`}>
                  {i < pasoGenerando ? '✓' : ''}
                </span>
                <span className="text-[#1F2D2A] dark:text-[#E6EFE9]">{texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </Fondo>
    );
  }

  return (
    <Fondo>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Paso {paso + 1} de 3</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">
            {tienePerfil ? 'Ajusta tu ruta' : 'Armemos tu camino'}
          </h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-2 max-w-lg mx-auto text-sm sm:text-base">
            Hoy tenemos <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">{totalCursos} cursos</strong> en{' '}
            <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">{areas.length} áreas</strong> ({totalHoras} horas de contenido).
            Tu roadmap se arma solo con lo que hay aquí.
          </p>
        </div>

        <div className="mb-8 px-2 sm:px-8">
          <CheckpointPath checkpoints={CHECKPOINTS} completedCount={paso} />
        </div>

        <div className="bg-white dark:bg-[#15231F] rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] p-5 sm:p-8">
          {paso === 0 && (
            <div>
              {errorMeta && errorMeta.tipo === 'plan' && <AvisoDeMeta error={errorMeta} areas={areasElegidas} />}
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">¿En qué área quieres crecer?</h2>
                <span className="text-xs font-mono font-semibold uppercase tracking-wide text-[#0E8A7D] dark:text-[#5FD3C2]">Plan gratuito · 1 tema</span>
              </div>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5">
                Elige una. Con el plan gratuito cada roadmap se arma sobre un solo tema; varias áreas a la vez estarán en el plan premium.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {areas.map((area) => (
                  <TarjetaArea key={area.area} area={area} elegida={elegidas.includes(area.etiqueta)} onToggle={() => alternarArea(area.etiqueta)} />
                ))}
              </div>
              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-4">
                {elegidas.length === 0 ? 'Elige un área para continuar.' : `Área elegida: ${elegidas[0]}`}
              </p>
            </div>
          )}

          {paso === 1 && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1">¿Qué quieres lograr?</h2>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-4">
                Cuéntalo en una frase, con <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">una sola meta y un solo tema</strong>. Debe estar dentro de:{' '}
                <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">{elegidas.join(', ')}</strong>.
              </p>

              {errorMeta && errorMeta.tipo !== 'tiempo' && <AvisoDeMeta error={errorMeta} areas={areasElegidas} />}

              <textarea
                value={meta}
                onChange={(e) => {
                  setMeta(e.target.value);
                  if (errorMeta) setErrorMeta(null);
                }}
                rows={3}
                maxLength={300}
                placeholder={ideas[0] ? `Ej. ${ideas[0]}` : 'Ej. Quiero aprender a programar'}
                className="w-full px-4 py-3 border border-[#E1E6DF] dark:border-[#27403A] rounded-xl text-sm text-[#1F2D2A] dark:text-[#E6EFE9] bg-white dark:bg-[#1A2C27] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] focus:outline-none focus:ring-2 focus:ring-[#0E8A7D]/10 focus:border-[#0E8A7D] transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">
                  {metaLimpia.length < 10 ? 'Escribe al menos 10 caracteres.' : metaPareceValida ? 'Listo, se ve bien.' : 'Usa palabras reales para describir tu meta.'}
                </p>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono">{meta.length}/300</p>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <p className="rounded-lg bg-[#4CE07E]/10 text-[#15803D] dark:text-[#4CE07E] px-3 py-2">✓ «Quiero aprender Python para analizar datos»</p>
                <p className="rounded-lg bg-[#F2704E]/10 text-[#B4492E] dark:text-[#F2A08A] px-3 py-2">✗ «Python, contabilidad y diseño»: son tres temas, elige uno</p>
              </div>

              {ideas.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wide mb-2">¿Sin ideas? Toca una</p>
                  <div className="flex flex-wrap gap-2">
                    {ideas.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => {
                          setMeta(idea);
                          setErrorMeta(null);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#E1E6DF] dark:border-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#12C2A8] hover:bg-[#12C2A8]/10 transition-colors cursor-pointer"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div>
              {errorMeta && errorMeta.tipo === 'tiempo' && <AvisoDeMeta error={errorMeta} areas={areasElegidas} />}
              <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1">¿Desde dónde partimos?</h2>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5">
                Pensando en tu meta <em className="text-[#1F2D2A] dark:text-[#E6EFE9] not-italic font-semibold">«{metaLimpia.length > 90 ? `${metaLimpia.slice(0, 90)}…` : metaLimpia}»</em>,
                ¿cuánto sabes ya de ese tema? Así saltamos lo que no necesitas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVELS.map((lv) => {
                  const seleccionado = nivel === lv.value;
                  return (
                    <button
                      key={lv.value}
                      type="button"
                      onClick={() => setNivel(lv.value)}
                      className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        seleccionado
                          ? 'border-[#0E8A7D] bg-[#ECF7F4] dark:bg-[#10211D]'
                          : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#1A2C27] hover:border-[#0E8A7D]/40'
                      }`}
                    >
                      <p className={`font-display font-bold mb-1.5 ${seleccionado ? 'text-[#0E8A7D]' : 'text-[#1F2D2A] dark:text-[#E6EFE9]'}`}>{lv.label}</p>
                      <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] leading-relaxed">{lv.copy}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E1E6DF] dark:border-[#27403A]">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">¿Cuánto tiempo puedes dedicarle?</h2>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6]">Opcional</span>
                </div>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-4">
                  Si nos dices cuánto tiempo tienes, armamos una ruta que quepa en él. Si prefieres no ponerle límite, déjalo así.
                </p>

                <p className="text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wide mb-2">Horas por semana</p>
                <div className="flex flex-wrap gap-2">
                  {HORAS_POR_SEMANA.map((h) => (
                    <Chip key={h} activo={horasSemana === h} onClick={() => { setHorasSemana(horasSemana === h ? null : h); if (errorMeta) setErrorMeta(null); }}>
                      {h} h
                    </Chip>
                  ))}
                </div>

                <p className="text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wide mt-4 mb-2">En cuánto tiempo</p>
                <div className="flex flex-wrap gap-2">
                  {PLAZOS.map((p) => (
                    <Chip key={p.semanas} activo={plazo === p.semanas} onClick={() => { setPlazo(plazo === p.semanas ? null : p.semanas); if (errorMeta) setErrorMeta(null); }}>
                      {p.label}
                    </Chip>
                  ))}
                  <Chip activo={!tiempoElegido && horasSemana === null && plazo === null} onClick={() => { setHorasSemana(null); setPlazo(null); }}>
                    Sin límite
                  </Chip>
                </div>

                <p className="text-xs mt-3 min-h-[1.25rem] text-[#6B7A74] dark:text-[#98B0A6]" aria-live="polite">
                  {tiempoElegido
                    ? `Tendrías unas ${horasEnTotal} horas en total. Los cursos de tus áreas suman ${horasDeLasAreas} h: armaremos la ruta más útil que quepa.`
                    : horasSemana !== null || plazo !== null
                      ? 'Elige también el otro dato (horas por semana y plazo van juntos), o quita el límite con «Sin límite».'
                      : ''}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E1E6DF] dark:border-[#27403A]">
            {paso === 0 ? (
              <Button variant="ghost" onClick={() => navigate(tienePerfil ? 'roadmap' : 'home')}>
                Cancelar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setPaso((p) => p - 1)}>
                Anterior
              </Button>
            )}
            {paso < 2 ? (
              <Button variant="primary" onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar}>
                Continuar
              </Button>
            ) : (
              <Button variant="gradient" onClick={crearRoadmap} disabled={!puedeAvanzar}>
                Crear mi roadmap
              </Button>
            )}
          </div>
        </div>
      </div>
    </Fondo>
  );
}

function Fondo({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      {children}
    </div>
  );
}

function TarjetaArea({ area, elegida, onToggle }: { area: AreaResumen; elegida: boolean; onToggle: () => void }) {
  const total = Math.max(1, area.cursos);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={elegida}
      className={`relative text-left rounded-xl border-2 p-4 transition-all cursor-pointer ${
        elegida ? 'border-[#12C2A8] bg-[#12C2A8]/[0.07]' : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#1A2C27] hover:border-[#0E8A7D]/40'
      }`}
    >
      {elegida && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#12C2A8] text-white flex items-center justify-center text-xs font-bold">✓</span>
      )}
      <div className="flex items-center gap-3">
        <CategoryGlyph category={area.etiqueta} className="w-11 h-11 rounded-lg shrink-0" />
        <div className="min-w-0">
          <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight pr-6">{area.etiqueta}</p>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
            {area.cursos} {area.cursos === 1 ? 'curso' : 'cursos'} · {area.horasTotales} h
          </p>
        </div>
      </div>

      <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-[#EDF1EA] dark:bg-[#27403A]" title="Principiante · Intermedio · Avanzado">
        <span className="bg-[#4CE07E]" style={{ width: `${(area.principiante / total) * 100}%` }} />
        <span className="bg-[#12C2A8]" style={{ width: `${(area.intermedio / total) * 100}%` }} />
        <span className="bg-[#0E8A7D]" style={{ width: `${(area.avanzado / total) * 100}%` }} />
      </div>
      <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] mt-1">
        {area.principiante} principiante · {area.intermedio} intermedio · {area.avanzado} avanzado
      </p>

      {area.ejemplos.length > 0 && (
        <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-2.5 leading-relaxed">
          <span className="font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">Por ejemplo: </span>
          {area.ejemplos.join(' · ')}
        </p>
      )}
    </button>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
        activo
          ? 'border-[#0E8A7D] bg-[#ECF7F4] dark:bg-[#10211D] text-[#0E8A7D] dark:text-[#5FD3C2]'
          : 'border-[#E1E6DF] dark:border-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#12C2A8]'
      }`}
    >
      {children}
    </button>
  );
}

function AvisoDeMeta({ error, areas }: { error: ErrorDeMeta; areas: AreaResumen[] }) {
  const titulo =
    error.tipo === 'sin-sentido'
      ? 'No entendimos esa meta'
      : error.tipo === 'sin-cursos'
        ? 'Todavía no tenemos cursos para eso'
        : error.tipo === 'tiempo'
          ? 'Con ese tiempo no alcanza'
          : error.tipo === 'plan'
            ? 'Una cosa a la vez (plan gratuito)'
            : 'No pudimos crear tu roadmap';
  return (
    <div className="mb-4 rounded-xl border border-[#F5A524]/50 bg-[#FBF3E4] dark:bg-[#3A2A0D] dark:border-[#78350F] p-4" role="alert">
      <p className="text-sm font-semibold text-[#B45309] dark:text-[#FBBF24]">{titulo}</p>
      <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">{error.mensaje}</p>
      {error.tipo !== 'otro' && error.tipo !== 'tiempo' && error.tipo !== 'plan' && areas.length > 0 && (
        <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-2">
          Recuerda: solo podemos armar rutas con las áreas que elegiste ({areas.map((a) => a.etiqueta).join(', ')}). Prueba con un tema concreto de esas áreas.
        </p>
      )}
    </div>
  );
}
