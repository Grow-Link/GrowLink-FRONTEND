import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CheckpointPath from '../components/CheckpointPath';
import CategoryGlyph from '../components/CategoryGlyph';
import { useNavigation } from '../store/NavigationContext';
import { BackendError } from '../services/backendSession';
import { getPerfil, guardarIntereses, guardarMetas, guardarNivel } from '../services/usuariosServiceApi';
import { listarAreas, type AreaResumen } from '../services/cursosServiceApi';
import { generarRoadmap } from '../services/roadmapApi';
import type { Level } from '../types';

const CHECKPOINTS = [{ label: 'Áreas' }, { label: 'Tu meta' }, { label: 'Tu punto de partida' }];

const LEVELS: { value: Level; label: string; copy: string }[] = [
  { value: 'principiante', label: 'Estoy empezando', copy: 'Es nuevo para mí, o solo lo he probado un poco. Quiero una base sólida.' },
  { value: 'intermedio', label: 'Ya tengo práctica', copy: 'Conozco lo básico y he hecho cosas. Quiero profundizar y llenar vacíos.' },
  { value: 'avanzado', label: 'Lo domino', copy: 'Tengo experiencia real. Busco retos y especializarme.' },
];

const PASOS_GENERANDO = ['Leyendo tu meta', 'Buscando entre los cursos disponibles', 'Ordenando tu ruta paso a paso'];

interface ErrorDeMeta {
  tipo: 'sin-sentido' | 'sin-cursos' | 'otro';
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
          setElegidas(perfil.intereses.filter((i) => vigentes.has(i)));
          setMeta(perfil.metas ?? '');
          if (perfil.nivel) setNivel(perfil.nivel);
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

  const metaLimpia = meta.trim();
  const metaPareceValida = metaLimpia.length >= 10 && /[a-záéíóúñ]{3,}/i.test(metaLimpia);
  const puedeAvanzar = paso === 0 ? elegidas.length > 0 : paso === 1 ? metaPareceValida : true;

  function alternarArea(etiqueta: string) {
    setElegidas((prev) => (prev.includes(etiqueta) ? prev.filter((e) => e !== etiqueta) : [...prev, etiqueta]));
  }

  async function crearRoadmap() {
    setGenerando(true);
    setErrorMeta(null);
    try {
      // primero se genera: si la meta no sirve, no se guarda nada y la persona puede corregirla
      await generarRoadmap({ goals: metaLimpia, interests: elegidas, level: nivel });
      await guardarMetas(metaLimpia);
      await guardarIntereses(elegidas);
      await guardarNivel(nivel);
      navigate('roadmap', { replace: true });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No pudimos crear tu roadmap.';
      const estado = err instanceof BackendError ? err.status : undefined;
      setErrorMeta({ tipo: estado === 400 ? 'sin-sentido' : estado === 422 ? 'sin-cursos' : 'otro', mensaje });
      setPaso(1);
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
              <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1">¿En qué área quieres crecer?</h2>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5">Elige una o varias. Estas son las áreas con cursos disponibles hoy.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {areas.map((area) => (
                  <TarjetaArea key={area.area} area={area} elegida={elegidas.includes(area.etiqueta)} onToggle={() => alternarArea(area.etiqueta)} />
                ))}
              </div>
              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-4">
                {elegidas.length === 0 ? 'Elige al menos un área para continuar.' : `${elegidas.length} ${elegidas.length === 1 ? 'área elegida' : 'áreas elegidas'}`}
              </p>
            </div>
          )}

          {paso === 1 && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1">¿Qué quieres lograr?</h2>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-4">
                Cuéntalo en una frase, con el tema concreto. Debe estar dentro de:{' '}
                <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">{elegidas.join(', ')}</strong>.
              </p>

              {errorMeta && <AvisoDeMeta error={errorMeta} areas={areasElegidas} />}

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
              <Button variant="gradient" onClick={crearRoadmap}>
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

function AvisoDeMeta({ error, areas }: { error: ErrorDeMeta; areas: AreaResumen[] }) {
  const titulo =
    error.tipo === 'sin-sentido' ? 'No entendimos esa meta' : error.tipo === 'sin-cursos' ? 'Todavía no tenemos cursos para eso' : 'No pudimos crear tu roadmap';
  return (
    <div className="mb-4 rounded-xl border border-[#F5A524]/50 bg-[#FBF3E4] dark:bg-[#3A2A0D] dark:border-[#78350F] p-4" role="alert">
      <p className="text-sm font-semibold text-[#B45309] dark:text-[#FBBF24]">{titulo}</p>
      <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">{error.mensaje}</p>
      {error.tipo !== 'otro' && areas.length > 0 && (
        <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-2">
          Recuerda: solo podemos armar rutas con las áreas que elegiste ({areas.map((a) => a.etiqueta).join(', ')}). Prueba con un tema concreto de esas áreas.
        </p>
      )}
    </div>
  );
}
