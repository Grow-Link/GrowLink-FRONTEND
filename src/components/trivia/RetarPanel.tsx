import { useEffect, useRef, useState } from 'react';
import Button from '../Button';
import ConfigPartidaForm, { CONFIG_INICIAL, type ConfigPartida } from './ConfigPartida';
import { buscarPersonas, type PersonaBuscada } from '../../services/usuariosServiceApi';
import { retar, retosEnviados, type Reto } from '../../services/triviaServiceApi';
import { getSession } from '../../services/backendSession';
import { sonar } from '../../utils/sonidos';

const ROL_TEXTO: Record<string, string> = { USUARIO: 'Aprendiz', PUBLICADOR: 'Publicador', ADMIN: 'Administrador' };
const ESTADO_RETO: Record<Reto['estado'], { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Esperando respuesta', clase: 'bg-[#F5A524]/20 text-[#B45309] dark:text-[#FBBF24]' },
  ACEPTADO: { texto: 'Aceptó', clase: 'bg-[#4CE07E]/20 text-[#15803D] dark:text-[#4CE07E]' },
  RECHAZADO: { texto: 'Rechazó', clase: 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171]' },
  EXPIRADO: { texto: 'Venció', clase: 'bg-[#EDF1EA] dark:bg-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]' },
};

interface Props {
  /** Cuando el reto ya se envió: la sala quedó creada y quien reta pasa a esperar en ella. */
  onRetoEnviado: (reto: Reto) => void;
  /** Para precargar a alguien (por ejemplo, la «revancha» al terminar una partida). */
  personaInicial?: { id: number; nombre: string } | null;
}

/** Buscar a una persona y mandarle «te reto a una trivia». Crea la sala y la deja esperando. */
export default function RetarPanel({ onRetoEnviado, personaInicial }: Props) {
  const session = getSession();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<PersonaBuscada[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [elegida, setElegida] = useState<{ id: number; nombre: string } | null>(personaInicial ?? null);
  const [config, setConfig] = useState<ConfigPartida>(CONFIG_INICIAL);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Reto[]>([]);
  const peticion = useRef(0);

  // búsqueda con una pequeña espera para no preguntar en cada letra
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) {
      setResultados([]);
      setErrorBusqueda(null);
      return;
    }
    const controlador = new AbortController();
    const numero = ++peticion.current;
    setBuscando(true);
    const id = window.setTimeout(() => {
      buscarPersonas(q, controlador.signal)
        .then((lista) => {
          if (numero === peticion.current) {
            setResultados(lista);
            setErrorBusqueda(null);
          }
        })
        .catch((e: unknown) => {
          if (!controlador.signal.aborted && numero === peticion.current) setErrorBusqueda(e instanceof Error ? e.message : 'No se pudo buscar.');
        })
        .finally(() => {
          if (numero === peticion.current) setBuscando(false);
        });
    }, 300);
    return () => {
      window.clearTimeout(id);
      controlador.abort();
    };
  }, [texto]);

  // los retos que mandé, con su estado, se refrescan solos
  useEffect(() => {
    let vivo = true;
    const cargar = () => retosEnviados().then((r) => vivo && setEnviados(r)).catch(() => undefined);
    cargar();
    const id = window.setInterval(cargar, 6000);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, []);

  async function enviar() {
    if (!elegida || !config.categoria || !session) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const reto = await retar({
        retadoUsuarioId: elegida.id,
        retadoNombre: elegida.nombre,
        retadorNombre: session.nombre,
        categoria: config.categoria,
        numPreguntas: config.numPreguntas,
        duracionSegundos: config.duracionSegundos,
        mensaje: mensaje.trim() || undefined,
      });
      sonar('reto');
      onRetoEnviado(reto);
    } catch (e) {
      setErrorEnvio(e instanceof Error ? e.message : 'No se pudo enviar el reto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {!elegida ? (
        <div>
          <label className="block text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2" htmlFor="buscar-persona">
            ¿A quién quieres retar?
          </label>
          <input
            id="buscar-persona"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Busca por nombre o cargo…"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] outline-none focus:border-[#0E8A7D] focus:ring-2 focus:ring-[#0E8A7D]/10"
          />
          <div className="mt-3 space-y-2" aria-live="polite">
            {texto.trim().length < 2 && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">Escribe al menos 2 letras.</p>}
            {errorBusqueda && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{errorBusqueda}</p>}
            {buscando && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">Buscando…</p>}
            {!buscando && texto.trim().length >= 2 && !errorBusqueda && resultados.length === 0 && (
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">No encontramos a nadie con «{texto.trim()}».</p>
            )}
            {resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setElegida({ id: p.id, nombre: p.nombre })}
                className="w-full flex items-center gap-3 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] px-4 py-3 text-left hover:border-[#12C2A8] transition-colors cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full gl-gradient text-white text-sm font-bold flex items-center justify-center shrink-0">{p.nombre[0]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{p.nombre}</span>
                  <span className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] truncate">{p.cargo ?? ROL_TEXTO[p.rol]}</span>
                </span>
                <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] shrink-0">🏆 {p.triviasGanadas}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-[#12C2A8]/10 border border-[#12C2A8]/30 px-4 py-3">
            <span className="w-10 h-10 rounded-full gl-gradient text-white font-bold flex items-center justify-center shrink-0">{elegida.nombre[0]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">Vas a retar a</p>
              <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{elegida.nombre}</p>
            </div>
            <button type="button" onClick={() => setElegida(null)} className="text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">Cambiar</button>
          </div>

          <ConfigPartidaForm valor={config} onChange={setConfig} />

          <div>
            <label htmlFor="mensaje-reto" className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider mb-2">Mensaje (opcional)</label>
            <input
              id="mensaje-reto"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={140}
              placeholder="¡Te reto a una trivia!"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] outline-none focus:border-[#0E8A7D]"
            />
          </div>

          {errorEnvio && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{errorEnvio}</p>}
          <Button variant="gradient" size="lg" className="w-full" disabled={!config.categoria || enviando} onClick={enviar}>
            {enviando ? 'Enviando reto…' : `Retar a ${elegida.nombre.split(' ')[0]}`}
          </Button>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] text-center">Se crea la sala y tú esperas dentro. El reto vence en 5 minutos.</p>
        </div>
      )}

      {enviados.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2">Retos que enviaste</h3>
          <ul className="space-y-2">
            {enviados.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] px-4 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{r.retadoNombre}</span>
                  <span className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] truncate">{r.categoria} · {r.numPreguntas} preguntas</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${ESTADO_RETO[r.estado].clase}`}>{ESTADO_RETO[r.estado].texto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
