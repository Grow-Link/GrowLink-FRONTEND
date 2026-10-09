import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Confetti from '../components/Confetti';
import HorizontalTabs from '../components/HorizontalTabs';
import LiveIndicator from '../components/LiveIndicator';
import ConfigPartidaForm, { CONFIG_INICIAL, type ConfigPartida } from '../components/trivia/ConfigPartida';
import RetarPanel from '../components/trivia/RetarPanel';
import GanadoresPanel from '../components/trivia/GanadoresPanel';
import { CLAVE_UNIRSE_SALA, EVENTO_UNIRSE_SALA } from '../components/RetosCampana';
import { useNavigation } from '../store/NavigationContext';
import { getSession } from '../services/backendSession';
import { crearSala, obtenerPartida, obtenerSala, type DetallePartida, type Reto, type Sala } from '../services/triviaServiceApi';
import { TriviaSocket, type ParticipanteMsg, type SalaMensaje } from '../services/triviaSocket';
import { estaSilenciado, silenciar, sonar } from '../utils/sonidos';
import type { TriviaParticipant } from '../types';

// Sala de trivia real contra trivia-service. POST/GET /api/salas para crear/consultar la sala; todo lo demás
// (unirse, iniciar, preguntas, leaderboard, resultados) va por STOMP sobre WS — ver triviaSocket.ts.
// trivia-service nunca manda la respuesta correcta en la pregunta (anti-trampa): el acierto de cada quien llega
// en RESPUESTA_REGISTRADA, solo para quien respondió.

type Stage = 'lobby' | 'create' | 'join' | 'waiting' | 'playing' | 'result';
type PestanaLobby = 'jugar' | 'retar' | 'ganadores';

type PreguntaMsg = Extract<SalaMensaje, { type: 'PREGUNTA' }>;

interface RankingItem {
  usuarioId: number;
  nombre: string;
  score: number;
  aciertos: number;
}

interface Finalista {
  id: string;
  name: string;
  score: number;
  aciertos: number;
  isCurrentUser: boolean;
}

const PESTANAS = [
  { key: 'jugar', label: 'Jugar' },
  { key: 'retar', label: 'Retar a alguien' },
  { key: 'ganadores', label: 'Ganadores' },
];

// colores de las cuatro opciones: cálidos y frescos, para que cada una se reconozca rápido
const COLOR_OPCION = ['#12C2A8', '#F2704E', '#F5A524', '#0E8A7D'];

const FELICITACIONES = ['¡Excelente!', '¡Así se hace!', '¡Imparable!', '¡Qué nivel!', '¡Muy bien!', '¡Brillante!'];
const ANIMOS = ['¡Casi!', 'La próxima es tuya', 'Sigue, que vas bien', '¡Ánimo!'];

const elegir = (lista: string[]) => lista[Math.floor(Math.random() * lista.length)];

function parseRankingItem(item: unknown): RankingItem {
  const o = item as any;
  return {
    usuarioId: Number(o?.usuarioId ?? o?.id ?? -1),
    nombre: String(o?.nombre ?? o?.name ?? '???'),
    score: Number(o?.puntaje ?? o?.puntuacion ?? o?.score ?? o?.puntos ?? 0),
    aciertos: Number(o?.aciertos ?? 0),
  };
}

// SALA_UPDATE no dice quién es el anfitrión entre los participantes — se asume que es quien aparece primero.
function mergeParticipantes(prev: TriviaParticipant[], llegaron: ParticipanteMsg[], miUsuarioId: number): TriviaParticipant[] {
  const porId = new Map(prev.map((p) => [p.id, p]));
  return llegaron.map((m, i) => {
    const id = String(m.usuarioId);
    const existente = porId.get(id);
    return {
      id,
      name: m.nombre,
      score: existente?.score ?? 0,
      streak: existente?.streak ?? 0,
      lastGain: existente?.lastGain ?? 0,
      isHost: i === 0,
      isCurrentUser: m.usuarioId === miUsuarioId,
    };
  });
}

function mergeLeaderboard(prev: TriviaParticipant[], ranking: unknown[], miUsuarioId: number): TriviaParticipant[] {
  const porId = new Map(prev.map((p) => [p.id, p]));
  return ranking.map(parseRankingItem).map((r, i) => {
    const id = String(r.usuarioId);
    const existente = porId.get(id);
    return {
      id,
      name: r.nombre !== '???' ? r.nombre : (existente?.name ?? '???'),
      score: r.score,
      streak: existente?.streak ?? 0,
      lastGain: existente ? r.score - existente.score : 0,
      isHost: existente?.isHost ?? i === 0,
      isCurrentUser: r.usuarioId === miUsuarioId,
    };
  });
}

function PositionBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-mono font-bold ${up ? 'text-[#15803D] dark:text-[#4CE07E]' : 'text-[#DC2626] dark:text-[#F87171]'}`}>
      <svg className={`w-3 h-3 ${up ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      {Math.abs(delta)}
    </span>
  );
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const pagina = 'min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815] flex flex-col';

export default function TriviaRoomPage() {
  const { navigate, currentUser } = useNavigation();
  const session = getSession();

  const [stage, setStage] = useState<Stage>('lobby');
  const [pestana, setPestana] = useState<PestanaLobby>('jugar');
  const [personaRevancha, setPersonaRevancha] = useState<{ id: number; nombre: string } | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [sala, setSala] = useState<Sala | null>(null);
  const [retoActual, setRetoActual] = useState<Reto | null>(null);

  const [config, setConfig] = useState<ConfigPartida>(CONFIG_INICIAL);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [wsErrorMsg, setWsErrorMsg] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [silencio, setSilencio] = useState(estaSilenciado());

  const [participants, setParticipants] = useState<TriviaParticipant[]>([]);
  const [prevPositions, setPrevPositions] = useState<Record<string, number>>({});

  const [question, setQuestion] = useState<PreguntaMsg | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ correcta: boolean; puntos: number; mensaje: string } | null>(null);
  const [racha, setRacha] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [finalRanking, setFinalRanking] = useState<Finalista[]>([]);
  const [winnerIds, setWinnerIds] = useState<number[]>([]);
  const [empate, setEmpate] = useState(false);
  const [detallePartida, setDetallePartida] = useState<DetallePartida | null>(null);

  const socketRef = useRef<TriviaSocket | null>(null);
  const participantsRef = useRef<TriviaParticipant[]>([]);
  const answeredRef = useRef(false);
  const rachaRef = useRef(0);
  const ultimoTick = useRef<number | null>(null);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  // "unirse" registra la fila en sala_participante Y ata esta conexión STOMP a un usuarioId. Al host,
  // POST /api/salas ya lo registró, así que su "unirse" choca con una llave duplicada — pero igual hay que
  // mandarlo para asociar su sesión de WS; ese error se filtra. El ref evita mandarlo dos veces si STOMP reconecta.
  const joinedCodeRef = useRef<string | null>(null);

  // Conexión STOMP: una por sala. Se abre al entrar a una sala (crear o unirse) y se cierra al salir.
  useEffect(() => {
    if (!sala || !session) return;
    const socket = new TriviaSocket(sala.codigo, {
      onMessage: handleSocketMessage,
      onConnectionChange: (connected) => {
        setWsConnected(connected);
        if (connected && joinedCodeRef.current !== sala.codigo) {
          socket.unirse(session.usuarioId, session.nombre);
          joinedCodeRef.current = sala.codigo;
        }
      },
    });
    socket.connect();
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala?.codigo, isHost]);

  function handleSocketMessage(msg: SalaMensaje) {
    if (!session) return;
    switch (msg.type) {
      case 'SALA_UPDATE':
        setParticipants((prev) => {
          const siguiente = mergeParticipantes(prev, msg.participantes, session.usuarioId);
          if (siguiente.length > prev.length && prev.length > 0) sonar('unirse');
          return siguiente;
        });
        break;
      case 'PREGUNTA':
        // si la pregunta anterior se quedó sin contestar, la racha se corta
        if (!answeredRef.current && rachaRef.current > 0 && question) {
          rachaRef.current = 0;
          setRacha(0);
        }
        setPrevPositions(Object.fromEntries([...participantsRef.current].sort((a, b) => b.score - a.score).map((p, i) => [p.id, i])));
        setQuestion(msg);
        setSelected(null);
        setAnswered(false);
        setAnswerResult(null);
        setStarting(false);
        setStage('playing');
        ultimoTick.current = null;
        sonar('pregunta');
        break;
      case 'RESPUESTA_REGISTRADA':
        // Llega para cada jugador que responde, no solo para mí — si es de otro, se ignora.
        if (msg.usuarioId !== session.usuarioId) break;
        if (msg.correcta) {
          rachaRef.current += 1;
          setRacha(rachaRef.current);
          sonar(rachaRef.current === 3 || rachaRef.current === 5 ? 'racha' : 'correcto');
        } else {
          rachaRef.current = 0;
          setRacha(0);
          sonar('incorrecto');
        }
        setAnswerResult({ correcta: msg.correcta, puntos: msg.puntos, mensaje: msg.correcta ? elegir(FELICITACIONES) : elegir(ANIMOS) });
        break;
      case 'LEADERBOARD':
        setParticipants((prev) => mergeLeaderboard(prev, msg.ranking, session.usuarioId));
        break;
      case 'RESULTADOS_FINALES': {
        const ranked: Finalista[] = msg.ranking
          .map(parseRankingItem)
          .sort((a, b) => b.score - a.score || b.aciertos - a.aciertos)
          .map((r) => ({ id: String(r.usuarioId), name: r.nombre, score: r.score, aciertos: r.aciertos, isCurrentUser: r.usuarioId === session.usuarioId }));
        const ganadores = msg.ganadoresUsuarioIds ?? (msg.ganadorUsuarioId != null ? [msg.ganadorUsuarioId] : []);
        setFinalRanking(ranked);
        setWinnerIds(ganadores);
        setEmpate(Boolean(msg.empate) || ganadores.length > 1);
        setStage('result');
        sonar(ganadores.includes(session.usuarioId) ? 'ganar' : 'terminar');
        // el acta de la partida ya quedó guardada: de ahí salen la duración total y los demás detalles
        obtenerPartida(msg.codigo).then(setDetallePartida).catch(() => undefined);
        break;
      }
      case 'ERROR':
        // Ruido conocido e inofensivo: el "unirse" del host choca con la fila que ya insertó POST /api/salas.
        if (!/sala_participante/i.test(msg.message)) setWsErrorMsg(msg.message);
        setStarting(false);
        break;
    }
  }

  // Si alguien aceptó un reto (o se llegó aquí desde la campana), se entra directo a esa sala.
  useEffect(() => {
    const entrar = (codigo: string) => {
      try {
        sessionStorage.removeItem(CLAVE_UNIRSE_SALA);
      } catch {
        // no pasa nada
      }
      void unirseAlCodigo(codigo);
    };
    let pendiente: string | null = null;
    try {
      pendiente = sessionStorage.getItem(CLAVE_UNIRSE_SALA);
    } catch {
      pendiente = null;
    }
    if (pendiente) entrar(pendiente);
    const alEvento = (e: Event) => entrar(String((e as CustomEvent).detail));
    window.addEventListener(EVENTO_UNIRSE_SALA, alEvento);
    return () => window.removeEventListener(EVENTO_UNIRSE_SALA, alEvento);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuenta regresiva local de la pregunta: se deriva de enviadaEnEpochMs + duracionSegundos
  // (el servidor es quien manda cuándo se acaba el tiempo, esto solo lo refleja visualmente).
  useEffect(() => {
    if (!question) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [question?.indice]);

  const elapsedSec = question ? (now - question.enviadaEnEpochMs) / 1000 : 0;
  const secondsLeft = question ? Math.max(0, Math.ceil(question.duracionSegundos - elapsedSec)) : 0;
  const timerFraction = question && question.duracionSegundos > 0 ? Math.max(0, Math.min(1, secondsLeft / question.duracionSegundos)) : 0;
  const timeUp = question !== null && secondsLeft <= 0;

  // tic-tac en los últimos 3 segundos, solo para quien todavía no ha respondido
  useEffect(() => {
    if (stage !== 'playing' || !question || answered) return;
    if (secondsLeft > 0 && secondsLeft <= 3 && ultimoTick.current !== secondsLeft) {
      ultimoTick.current = secondsLeft;
      sonar('tick');
    }
  }, [secondsLeft, stage, question, answered]);

  if (!currentUser || !session) return null;

  function prepararComoHost(nueva: Sala) {
    joinedCodeRef.current = null;
    // POST /api/salas ya registró al host como participante: se agrega de una vez en vez de esperar un SALA_UPDATE
    setParticipants([{ id: String(session!.usuarioId), name: session!.nombre, score: 0, streak: 0, lastGain: 0, isHost: true, isCurrentUser: true }]);
    setIsHost(true);
    setSala(nueva);
    setStage('waiting');
  }

  async function handleCreate() {
    if (!config.categoria || !session) return;
    setCreating(true);
    setCreateError(null);
    try {
      const nueva = await crearSala({
        categoria: config.categoria,
        hostUsuarioId: session.usuarioId,
        hostNombre: session.nombre,
        numPreguntas: config.numPreguntas,
        duracionSegundos: config.duracionSegundos,
      });
      setRetoActual(null);
      prepararComoHost(nueva);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la sala.');
    } finally {
      setCreating(false);
    }
  }

  // quien retó: la sala ya existe (la creó el reto), solo hay que entrar a esperar
  async function alRetoEnviado(reto: Reto) {
    const encontrada = await obtenerSala(reto.codigoSala).catch(() => null);
    if (!encontrada) return;
    setRetoActual(reto);
    prepararComoHost(encontrada);
  }

  async function unirseAlCodigo(codigoCrudo: string) {
    const codigo = codigoCrudo.trim().toUpperCase();
    if (!codigo) return;
    setJoining(true);
    setJoinError(null);
    try {
      const encontrada = await obtenerSala(codigo);
      if (!encontrada) {
        setJoinError('No encontramos una sala con ese código.');
        setStage('join');
        return;
      }
      if (encontrada.estado !== 'ESPERANDO') {
        setJoinError('Esa sala ya empezó o terminó.');
        setStage('join');
        return;
      }
      joinedCodeRef.current = null;
      setParticipants([]);
      setIsHost(false);
      setRetoActual(null);
      setSala(encontrada);
      setStage('waiting');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'No se pudo buscar la sala.');
      setStage('join');
    } finally {
      setJoining(false);
    }
  }

  function startGame() {
    setStarting(true);
    setWsErrorMsg(null);
    rachaRef.current = 0;
    setRacha(0);
    socketRef.current?.iniciar();
  }

  function handleAnswer(idx: number) {
    if (answered || timeUp || !question || !session) return;
    setSelected(idx);
    setAnswered(true);
    socketRef.current?.responder(session.usuarioId, question.indice, idx);
  }

  function resetAll(destino: PestanaLobby = 'jugar') {
    joinedCodeRef.current = null;
    setStage('lobby');
    setPestana(destino);
    setIsHost(false);
    setSala(null);
    setRetoActual(null);
    setConfig(CONFIG_INICIAL);
    setCreateError(null);
    setJoinCode('');
    setJoinError(null);
    setWsErrorMsg(null);
    setStarting(false);
    setParticipants([]);
    setPrevPositions({});
    setQuestion(null);
    setSelected(null);
    setAnswered(false);
    setAnswerResult(null);
    setRacha(0);
    rachaRef.current = 0;
    setFinalRanking([]);
    setWinnerIds([]);
    setEmpate(false);
    setDetallePartida(null);
  }

  function alternarSonido() {
    silenciar(!silencio);
    setSilencio(!silencio);
  }

  const ranked = [...participants].sort((a, b) => b.score - a.score);
  const miParticipante = ranked.find((p) => p.isCurrentUser);
  const timerColor = timerFraction < 0.25 ? '#F2704E' : timerFraction < 0.5 ? '#F5A524' : '#12C2A8';

  const botonSonido = (
    <button
      type="button"
      onClick={alternarSonido}
      aria-label={silencio ? 'Activar sonido' : 'Silenciar sonido'}
      title={silencio ? 'Activar sonido' : 'Silenciar sonido'}
      className="w-9 h-9 rounded-full border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] flex items-center justify-center text-base hover:border-[#12C2A8] cursor-pointer"
    >
      {silencio ? '🔇' : '🔊'}
    </button>
  );

  // ─── LOBBY ──────────────────────────────────────────────────
  if (stage === 'lobby') {
    return (
      <div className={pagina}>
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Modo competitivo</span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">Trivia en vivo</h1>
              <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1.5 max-w-md">Compite en tiempo real, reta a alguien en particular y mira quién manda en el salón de la fama.</p>
            </div>
            {botonSonido}
          </div>

          <HorizontalTabs tabs={PESTANAS} active={pestana} onChange={(k) => setPestana(k as PestanaLobby)} className="mb-6" />

          {pestana === 'jugar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                onClick={() => setStage('create')}
                className="gl-card-hover relative p-6 sm:p-7 rounded-2xl border-2 border-[#E1E6DF] dark:border-[#27403A] hover:border-[#12C2A8] bg-white dark:bg-[#15231F] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#12C2A8] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-15 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#12C2A8]/10 border border-[#12C2A8]/30 flex items-center justify-center mb-5 relative z-10 text-2xl">🎯</div>
                <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2 relative z-10 group-hover:text-[#0E8A7D] transition-colors">Crear sala</h2>
                <p className="text-[#6B7A74] dark:text-[#98B0A6] text-sm leading-relaxed relative z-10">Elige categoría, preguntas y tiempo. Comparte el código y espera a que lleguen.</p>
              </button>
              <button
                onClick={() => setStage('join')}
                className="gl-card-hover relative p-6 sm:p-7 rounded-2xl border-2 border-[#E1E6DF] dark:border-[#27403A] hover:border-[#F2704E] bg-white dark:bg-[#15231F] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#F2704E] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-15 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#F2704E]/10 border border-[#F2704E]/30 flex items-center justify-center mb-5 relative z-10 text-2xl">🚪</div>
                <h2 className="text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2 relative z-10 group-hover:text-[#F2704E] transition-colors">Unirse con un código</h2>
                <p className="text-[#6B7A74] dark:text-[#98B0A6] text-sm leading-relaxed relative z-10">Entra con el código de 6 letras que te compartió quien creó la sala.</p>
              </button>
              <button
                onClick={() => setPestana('retar')}
                className="gl-card-hover sm:col-span-2 relative p-5 rounded-2xl border-2 border-dashed border-[#E1E6DF] dark:border-[#27403A] hover:border-[#F5A524] bg-white/60 dark:bg-[#15231F]/60 text-left cursor-pointer transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">⚔️</span>
                <span>
                  <span className="block font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">¿Quieres un duelo? Reta a alguien</span>
                  <span className="block text-sm text-[#6B7A74] dark:text-[#98B0A6]">Busca a una persona, mándale un «te reto a una trivia» y esperen juntos en la sala.</span>
                </span>
              </button>
            </div>
          )}

          {pestana === 'retar' && (
            <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-7">
              <RetarPanel onRetoEnviado={alRetoEnviado} personaInicial={personaRevancha} />
            </div>
          )}

          {pestana === 'ganadores' && <GanadoresPanel />}
        </main>
      </div>
    );
  }

  // ─── CREATE ─────────────────────────────────────────────────
  if (stage === 'create') {
    const canCreate = config.categoria !== '' && !creating;
    return (
      <div className={pagina}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="max-w-xl w-full">
            <button onClick={() => setStage('lobby')} className="flex items-center gap-2 text-sm text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#1F2D2A] dark:hover:text-[#E6EFE9] cursor-pointer mb-6 transition-colors">
              ← Volver
            </button>
            <div className="mb-6">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Anfitrión</span>
              <h2 className="text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2 mb-1">Configurar sala</h2>
              <p className="text-[#6B7A74] dark:text-[#98B0A6]">Define las reglas antes de invitar a los demás.</p>
            </div>
            <div className="space-y-6">
              <ConfigPartidaForm valor={config} onChange={setConfig} />
              {createError && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{createError}</p>}
              <Button variant="gradient" size="lg" className="w-full" disabled={!canCreate} onClick={handleCreate}>
                {creating ? <><Spinner /> Creando sala…</> : 'Crear sala y esperar jugadores'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── JOIN ────────────────────────────────────────────────────
  if (stage === 'join') {
    return (
      <div className={pagina}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="max-w-md w-full">
            <button onClick={() => { setJoinError(null); setStage('lobby'); }} className="flex items-center gap-2 text-sm text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#1F2D2A] dark:hover:text-[#E6EFE9] cursor-pointer mb-6 transition-colors">
              ← Volver
            </button>
            <div className="mb-6">
              <span className="text-[#F2704E] text-xs font-mono font-semibold tracking-widest uppercase">Unirse</span>
              <h2 className="text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2 mb-1">Ingresa el código</h2>
              <p className="text-[#6B7A74] dark:text-[#98B0A6]">El código de 6 letras te lo comparte quien creó la sala.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void unirseAlCodigo(joinCode); }} className="space-y-4">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="GL7X9K"
                autoFocus
                aria-label="Código de la sala"
                className="w-full text-center tracking-[0.5em] uppercase font-mono font-bold text-2xl px-4 py-4 border-2 border-[#E1E6DF] dark:border-[#27403A] rounded-xl bg-white dark:bg-[#15231F] text-[#1F2D2A] dark:text-[#E6EFE9] placeholder:text-[#E1E6DF] dark:placeholder:text-[#27403A] focus:outline-none focus:border-[#0E8A7D] transition-all"
              />
              {joinError && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171] text-center">{joinError}</p>}
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={joinCode.trim().length === 0 || joining}>
                {joining ? <><Spinner /> Buscando sala…</> : 'Unirme a la sala'}
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ─── WAITING ROOM ────────────────────────────────────────────
  if (stage === 'waiting') {
    const esperandoA = retoActual && participants.length < 2 ? retoActual.retadoNombre : null;
    return (
      <div className={pagina}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="max-w-lg w-full">
            <div className="text-center mb-7">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Sala de espera</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-3 mb-3">{sala?.categoria}</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full border text-[#0B6F65] dark:text-[#5FD3C2] border-[#12C2A8]/40 bg-[#12C2A8]/10">
                  {sala?.numPreguntas} preguntas · {sala?.duracionSegundos}s c/u
                </span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(sala?.codigo ?? '').catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                  className="flex items-center gap-2 bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-full px-3 py-1 cursor-pointer hover:border-[#12C2A8]"
                  title="Copiar código"
                >
                  <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{copied ? 'Copiado ✓' : 'Código:'}</span>
                  <span className="text-xs font-mono font-bold text-[#1F2D2A] dark:text-[#E6EFE9] tracking-widest">{sala?.codigo}</span>
                </button>
                {!wsConnected && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-[#B45309] dark:text-[#FBBF24]">
                    <Spinner className="w-3.5 h-3.5" /> Conectando…
                  </span>
                )}
                {botonSonido}
              </div>
              {retoActual && (
                <p className="mt-3 text-sm text-[#6B7A74] dark:text-[#98B0A6]">
                  {esperandoA ? <>⚔️ Esperando a <strong className="text-[#1F2D2A] dark:text-[#E6EFE9]">{esperandoA}</strong> (tiene 5 minutos para aceptar tu reto)</> : '⚔️ ¡Tu retado ya llegó!'}
                </p>
              )}
            </div>

            {wsErrorMsg && (
              <div role="alert" className="mb-5 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{wsErrorMsg}</p>
              </div>
            )}

            <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl overflow-hidden mb-6">
              <div className="px-5 py-3.5 border-b border-[#E1E6DF] dark:border-[#27403A] flex items-center justify-between">
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Participantes</p>
                <div className="flex items-center gap-2">
                  <LiveIndicator label="" color="green" />
                  <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono">{participants.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {participants.map((p) => (
                  <div key={p.id} className={`gl-pop-in flex items-center gap-3 px-4 py-3 rounded-xl ${p.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/20' : 'bg-[#F6F7F2] dark:bg-[#1A2C27] border border-[#EDF1EA] dark:border-[#27403A]'}`}>
                    <div className="relative w-8 h-8 rounded-full gl-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {p.name[0]}
                      <span className="gl-status-dot bg-[#4CE07E] live-pulse absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#15231F]" />
                    </div>
                    <span className={`text-sm font-semibold ${p.isCurrentUser ? 'text-[#0B6F65] dark:text-[#5FD3C2]' : 'text-[#1F2D2A] dark:text-[#E6EFE9]'}`}>
                      {p.name}{p.isCurrentUser && <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-normal ml-2">(tú)</span>}
                    </span>
                    {p.isHost && <span className="ml-auto text-xs text-[#B45309] dark:text-[#FBBF24] font-semibold border border-[#F5A524]/40 px-2 py-0.5 rounded-md">Anfitrión</span>}
                  </div>
                ))}
                {participants.length === 0 && <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] text-center py-2">Conectando a la sala…</p>}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#E1E6DF] dark:border-[#27403A]">
                  <div className="w-8 h-8 rounded-full border border-dashed border-[#E1E6DF] dark:border-[#27403A]" />
                  <span className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Esperando más jugadores…</span>
                  <span className="ml-auto flex gap-1">
                    {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#12C2A8]/60 animate-pulse" style={{ animationDelay: `${d * 0.2}s` }} />)}
                  </span>
                </div>
              </div>
            </div>

            {starting ? (
              <div className="text-center mb-4">
                <div className="flex justify-center text-[#12C2A8] mb-2"><Spinner className="w-6 h-6" /></div>
                <p className="text-[#6B7A74] dark:text-[#98B0A6] text-sm font-mono">Iniciando sala…</p>
              </div>
            ) : isHost ? (
              <div className="space-y-3">
                <Button variant="gradient" size="lg" className="w-full" disabled={participants.length < 2 || !wsConnected} onClick={startGame}>
                  ¡Empezar la trivia!
                </Button>
                {participants.length < 2 && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] text-center font-mono">Se necesita al menos 1 jugador más para empezar.</p>}
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => resetAll()}>Cancelar sala</Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">El anfitrión empezará la trivia cuando todos estén listos.</p>
                <Button variant="secondary" className="mt-4" onClick={() => resetAll()}>Salir de la sala</Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── RESULT / PODIUM ────────────────────────────────────────
  if (stage === 'result') {
    const podium = finalRanking.slice(0, 3);
    const rest = finalRanking.slice(3);
    const heightFor = (i: number) => (i === 0 ? 'h-40' : i === 1 ? 'h-28' : 'h-20');
    const orderFor = (i: number) => (i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3');
    const colorFor = (i: number) => (i === 0 ? '#F5A524' : i === 1 ? '#94A3B8' : '#CD7C2F');
    const myRank = finalRanking.findIndex((p) => p.isCurrentUser) + 1;
    const amIWinner = winnerIds.includes(session.usuarioId);
    const total = finalRanking.length;
    const ganadoresNombres = finalRanking.filter((p) => winnerIds.includes(Number(p.id))).map((p) => p.name);
    const rival = total === 2 ? finalRanking.find((p) => !p.isCurrentUser) : undefined;
    const numPreguntas = sala?.numPreguntas ?? detallePartida?.partida.numPreguntas ?? 0;

    const titulo = amIWinner
      ? empate ? '¡Empataste en lo más alto!' : '¡Ganaste la trivia! 🏆'
      : myRank === 2 ? '¡Segundo lugar, qué buen nivel!' : myRank === 3 ? '¡En el podio! Tercer lugar' : myRank > 0 ? `Terminaste en el puesto #${myRank}` : 'Trivia finalizada';
    const subtitulo =
      winnerIds.length === 0
        ? 'Nadie sumó puntos esta vez. ¡La revancha es tuya!'
        : amIWinner
          ? empate ? `Compartes la victoria con ${ganadoresNombres.filter((n) => n !== session.nombre).join(' y ')}.` : 'Tu victoria quedó registrada en tu perfil y en el salón de la fama.'
          : empate ? `Ganaron ${ganadoresNombres.join(' y ')}, empatados.` : `Ganó ${ganadoresNombres[0]}. ¡Felicitaciones!`;

    return (
      <div className={pagina}>
        <Navbar />
        {(amIWinner || total > 0) && <Confetti piezas={amIWinner ? 70 : 24} />}
        <main className="flex-1 flex flex-col items-center px-4 py-10">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase mb-2">Trivia finalizada · {sala?.categoria}</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2 text-center">{titulo}</h2>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-8 text-center max-w-md">{subtitulo}</p>

          <div className="flex items-end justify-center gap-3 sm:gap-4 mb-10 w-full max-w-lg">
            {podium.map((p, i) => (
              <div key={p.id} className={`flex flex-col items-center flex-1 ${orderFor(i)} gl-pop-in`} style={{ animationDelay: `${i * 0.15}s` }}>
                {winnerIds.includes(Number(p.id)) && <span className="text-2xl -mb-1">👑</span>}
                <div className="w-11 h-11 rounded-full gl-gradient flex items-center justify-center text-white font-bold mb-2">{p.name[0]}</div>
                <p className={`text-sm font-semibold mb-2 text-center truncate max-w-[6.5rem] ${p.isCurrentUser ? 'text-[#0B6F65] dark:text-[#5FD3C2]' : 'text-[#1F2D2A] dark:text-[#E6EFE9]'}`}>{p.name}</p>
                <div className={`w-full ${heightFor(i)} rounded-t-xl flex flex-col items-center justify-start pt-3 gap-1`} style={{ background: `linear-gradient(180deg, ${colorFor(i)}, #1F2D2A)` }}>
                  <span className="text-white font-display font-bold text-xl">{i + 1}</span>
                  <span className="text-white/90 text-xs font-mono">{p.score.toLocaleString()} pts</span>
                  <span className="text-white/70 text-[11px]">{p.aciertos}/{numPreguntas}</span>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="w-full max-w-md space-y-2 mb-8">
              {rest.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/30' : 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A]'}`}>
                  <span className="text-sm font-mono font-bold text-[#6B7A74] dark:text-[#98B0A6] w-5">{i + 4}</span>
                  <span className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] flex-1">{p.name}</span>
                  <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{p.aciertos}/{numPreguntas}</span>
                  <span className="font-mono font-bold text-sm text-[#1F2D2A] dark:text-[#E6EFE9]">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {detallePartida && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mb-8 text-center">
              {[
                { v: String(detallePartida.partida.totalJugadores), l: 'jugadores' },
                { v: String(detallePartida.partida.numPreguntas), l: 'preguntas' },
                { v: `${detallePartida.partida.duracionPreguntaSegundos}s`, l: 'por pregunta' },
                { v: `${Math.floor(detallePartida.partida.duracionTotalSegundos / 60)}:${String(detallePartida.partida.duracionTotalSegundos % 60).padStart(2, '0')}`, l: 'duración total' },
              ].map((d) => (
                <div key={d.l} className="rounded-xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] py-3">
                  <dd className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{d.v}</dd>
                  <dt className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">{d.l}</dt>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            {rival && (
              <Button variant="gradient" size="lg" onClick={() => { setPersonaRevancha({ id: Number(rival.id), nombre: rival.name }); resetAll('retar'); }}>
                ⚔️ Revancha con {rival.name.split(' ')[0]}
              </Button>
            )}
            <Button variant={rival ? 'secondary' : 'gradient'} size="lg" onClick={() => resetAll('jugar')}>Jugar otra vez</Button>
            <Button variant="secondary" size="lg" onClick={() => resetAll('ganadores')}>Ver ganadores</Button>
            <Button variant="ghost" size="lg" onClick={() => navigate(currentUser.role === 'publisher' ? 'my-courses' : 'home')}>Salir</Button>
          </div>
        </main>
      </div>
    );
  }

  // ─── PLAYING ────────────────────────────────────────────────
  if (!question) {
    return (
      <div className={pagina}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div className="flex flex-col items-center gap-3 text-[#6B7A74] dark:text-[#98B0A6]">
            <Spinner className="w-6 h-6" />
            <p>Esperando la primera pregunta…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pagina}>
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5 sm:py-8 flex-1 flex flex-col w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <LiveIndicator label="EN VIVO" color="teal" size="md" />
            <span className="text-[#6B7A74] dark:text-[#98B0A6] text-sm font-mono">{participants.length} jugadores</span>
            <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] border border-[#E1E6DF] dark:border-[#27403A] bg-[#F6F7F2] dark:bg-[#1A2C27] px-2 py-0.5 rounded-md">{sala?.categoria}</span>
            {botonSonido}
          </div>
          <div className="flex items-center gap-5">
            {racha >= 2 && <span className="gl-pop-in px-3 py-1 rounded-full bg-[#F5A524]/20 text-[#B45309] dark:text-[#FBBF24] text-sm font-bold">🔥 Racha x{racha}</span>}
            <div className="text-center">
              <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider">Pregunta</p>
              <p className="text-[#1F2D2A] dark:text-[#E6EFE9] font-mono font-bold">{question.indice + 1} / {question.totalPreguntas}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider">Tu puntaje</p>
              <p className="font-mono font-bold text-[#15803D] dark:text-[#4CE07E]">{(miParticipante?.score ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {wsErrorMsg && (
          <div role="alert" className="mb-4 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{wsErrorMsg}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 flex-1">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className={`relative w-16 h-16 shrink-0 ${secondsLeft <= 3 && !answered && secondsLeft > 0 ? 'gl-shake' : ''}`} key={secondsLeft <= 3 ? secondsLeft : 'n'}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" className="text-[#EDF1EA] dark:text-[#27403A]" stroke="currentColor" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerFraction)}`} style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl" style={{ color: timerColor }}>{secondsLeft}</span>
              </div>
              <div className="flex-1 h-1.5 bg-[#EDF1EA] dark:bg-[#27403A] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 gl-gradient" style={{ width: `${((question.indice + 1) / question.totalPreguntas) * 100}%` }} />
              </div>
            </div>

            <div key={question.indice} className="gl-fade-up bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-8 mb-5">
              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-widest mb-3">Pregunta {question.indice + 1}</p>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{question.texto}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {question.opciones.map((option, i) => {
                const isSelected = answered && i === selected;
                const locked = answered || timeUp;
                const color = COLOR_OPCION[i % COLOR_OPCION.length];
                const estado =
                  isSelected && answerResult
                    ? answerResult.correcta
                      ? 'border-[#4CE07E] bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E] scale-[1.02]'
                      : 'border-[#F2704E] bg-[#F2704E]/10 text-[#C2410C] dark:text-[#FDBA74]'
                    : isSelected
                      ? 'border-[#0E8A7D] bg-[#0E8A7D]/10 text-[#0E8A7D] dark:text-[#5FD3C2]'
                      : locked
                        ? 'border-[#EDF1EA] dark:border-[#27403A] bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#6B7A74] dark:text-[#98B0A6] opacity-60'
                        : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] hover:-translate-y-0.5 hover:shadow-md text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer';
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={locked}
                    className={`p-4 sm:p-5 rounded-2xl border-2 text-left font-semibold transition-all flex items-center gap-4 ${estado}`}
                    style={!locked ? { borderLeftColor: color, borderLeftWidth: 6 } : undefined}
                  >
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-mono font-bold shrink-0 text-white" style={{ background: locked && !isSelected ? '#98B0A6' : color }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="text-sm leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="min-h-[3.5rem] mt-4 text-center" aria-live="polite">
              {answerResult ? (
                <div className="gl-pop-in inline-flex flex-col items-center">
                  <p className={`text-lg font-display font-bold ${answerResult.correcta ? 'text-[#15803D] dark:text-[#4CE07E]' : 'text-[#C2410C] dark:text-[#FDBA74]'}`}>{answerResult.mensaje}</p>
                  {answerResult.correcta && <p className="font-mono font-bold text-[#15803D] dark:text-[#4CE07E]">+{answerResult.puntos} puntos</p>}
                </div>
              ) : answered ? (
                <p className="font-mono font-bold text-[#0E8A7D] dark:text-[#5FD3C2]">Respuesta enviada — esperando a los demás…</p>
              ) : timeUp ? (
                <p className="font-mono font-bold text-[#C2410C] dark:text-[#FDBA74]">Se acabó el tiempo</p>
              ) : null}
            </div>
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl overflow-hidden h-72 lg:h-full flex flex-col">
              <div className="p-4 border-b border-[#E1E6DF] dark:border-[#27403A] flex items-center justify-between">
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Marcador</p>
                <LiveIndicator label="VIVO" color="green" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ranked.map((player, i) => {
                  const delta = prevPositions[player.id] !== undefined ? prevPositions[player.id] - i : 0;
                  return (
                    <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${player.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/30' : 'bg-[#F6F7F2] dark:bg-[#1A2C27] border border-[#EDF1EA] dark:border-[#27403A]'} ${delta !== 0 ? 'gl-pop-in' : ''}`}>
                      <span className={`text-sm font-mono font-bold w-5 text-center shrink-0 ${i === 0 ? 'text-[#B45309] dark:text-[#F5A524]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>{i === 0 ? '👑' : i + 1}</span>
                      <div className="w-7 h-7 rounded-lg gl-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">{player.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${player.isCurrentUser ? 'text-[#0B6F65] dark:text-[#5FD3C2]' : 'text-[#1F2D2A] dark:text-[#E6EFE9]'}`}>{player.name}</p>
                      </div>
                      <PositionBadge delta={delta} />
                      <p className="font-mono font-bold text-sm text-[#1F2D2A] dark:text-[#E6EFE9]">{player.score.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
