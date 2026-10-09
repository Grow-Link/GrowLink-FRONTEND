import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '../store/NavigationContext';
import { aceptarReto, rechazarReto, retosRecibidos, type Reto } from '../services/triviaServiceApi';
import { sonar } from '../utils/sonidos';

/** Clave donde se deja el código de la sala a la que hay que entrar cuando se acepta un reto. */
export const CLAVE_UNIRSE_SALA = 'gl_trivia_unirse';
export const EVENTO_UNIRSE_SALA = 'gl:unirse-sala';

// los retos que ya se anunciaron, para no volver a sonar cada vez que cambia de pantalla
const anunciados = new Set<number>();

function restante(expiraEn: string, ahora: number): string {
  const s = Math.max(0, Math.round((new Date(expiraEn).getTime() - ahora) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** La campana de retos: avisa cuando alguien te reta a una trivia y deja aceptar o rechazar sin salir de donde estás. */
export default function RetosCampana() {
  const { navigate } = useNavigation();
  const [retos, setRetos] = useState<Reto[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<Reto | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = useCallback(() => {
    retosRecibidos()
      .then((lista) => {
        setRetos(lista);
        const nuevo = lista.find((r) => !anunciados.has(r.id));
        lista.forEach((r) => anunciados.add(r.id));
        if (nuevo) {
          sonar('reto');
          setAviso(nuevo);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    cargar();
    const id = window.setInterval(cargar, 5000);
    return () => window.clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    if (!abierto && !aviso) return;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [abierto, aviso]);

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(id);
  }, [aviso]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  async function aceptar(reto: Reto) {
    setOcupado(reto.id);
    setError(null);
    try {
      const aceptado = await aceptarReto(reto.id);
      try {
        sessionStorage.setItem(CLAVE_UNIRSE_SALA, aceptado.codigoSala);
      } catch {
        // sin almacenamiento: el evento de abajo basta si ya estás en la trivia
      }
      window.dispatchEvent(new CustomEvent(EVENTO_UNIRSE_SALA, { detail: aceptado.codigoSala }));
      setAbierto(false);
      setAviso(null);
      cargar();
      navigate('trivia');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aceptar el reto.');
      cargar();
    } finally {
      setOcupado(null);
    }
  }

  async function rechazar(reto: Reto) {
    setOcupado(reto.id);
    setError(null);
    try {
      await rechazarReto(reto.id);
      setAviso(null);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar el reto.');
    } finally {
      setOcupado(null);
    }
  }

  const tarjeta = (reto: Reto) => (
    <li key={reto.id} className="rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] p-3.5">
      <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">
        <span className="text-[#F2704E]">⚔</span> {reto.retadorNombre} te reta
      </p>
      <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
        {reto.categoria} · {reto.numPreguntas} preguntas · {reto.duracionSegundos}s c/u · vence en {restante(reto.expiraEn, ahora)}
      </p>
      {reto.mensaje && <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] italic mt-1.5">«{reto.mensaje}»</p>}
      <div className="flex gap-2 mt-3">
        <button type="button" disabled={ocupado === reto.id} onClick={() => aceptar(reto)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white gl-gradient disabled:opacity-50 cursor-pointer">
          {ocupado === reto.id ? '…' : '¡Acepto!'}
        </button>
        <button type="button" disabled={ocupado === reto.id} onClick={() => rechazar(reto)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A] disabled:opacity-50 cursor-pointer">
          Ahora no
        </button>
      </div>
    </li>
  );

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-label={retos.length > 0 ? `Tienes ${retos.length} reto${retos.length > 1 ? 's' : ''} de trivia` : 'Retos de trivia'}
        aria-expanded={abierto}
        title="Retos de trivia"
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7A74] dark:text-[#98B0A6] hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] hover:text-[#1F2D2A] dark:hover:text-[#E6EFE9] transition-all cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {retos.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#F2704E] text-white text-[10px] font-bold flex items-center justify-center gl-soft-pulse">
            {retos.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#F6F7F2] dark:bg-[#0E1815] border border-[#E1E6DF] dark:border-[#27403A] rounded-xl shadow-lg p-3 z-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2 px-1">Retos de trivia</p>
          {retos.length === 0 ? (
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] px-1 py-3">No tienes retos pendientes. Cuando alguien te rete, aparecerá aquí.</p>
          ) : (
            <ul className="space-y-2">{retos.map(tarjeta)}</ul>
          )}
          {error && <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171] mt-2 px-1">{error}</p>}
        </div>
      )}

      {aviso && !abierto && (
        <div role="status" className="gl-sheet-up fixed top-20 right-4 z-[55] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-[#F2704E] bg-white dark:bg-[#15231F] p-4 shadow-2xl">
          <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">⚔ {aviso.retadorNombre} te reta a una trivia</p>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">{aviso.categoria} · {aviso.numPreguntas} preguntas</p>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => aceptar(aviso)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white gl-gradient cursor-pointer">¡Acepto!</button>
            <button type="button" onClick={() => setAbierto(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6] cursor-pointer">Ver</button>
            <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="px-2 text-[#6B7A74] cursor-pointer">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
