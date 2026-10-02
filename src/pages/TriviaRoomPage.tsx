import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import LiveIndicator from '../components/LiveIndicator';
import { useNavigation } from '../store/NavigationContext';
import { getSession } from '../services/backendSession';
import { crearSala, obtenerSala, type Sala } from '../services/triviaServiceApi';
import { TriviaSocket, type ParticipanteMsg, type SalaMensaje } from '../services/triviaSocket';
import { CATEGORIES } from '../services/mockData';
import type { TriviaParticipant, TriviaQuestionCount, TriviaSecondsPerQuestion } from '../types';

// HU-etapa3: sala de trivia real contra trivia-service. POST/GET /api/salas
// para crear/consultar la sala; todo lo demás (unirse, iniciar, preguntas,
// leaderboard, resultados) va por STOMP sobre WS — ver triviaSocket.ts.
// trivia-service nunca manda la respuesta correcta en la pregunta (anti-trampa),
// así que al responder no se puede pintar la opción en verde/rojo: solo se
// marca cuál elegiste, y el puntaje real llega después por LEADERBOARD.

type Stage = 'lobby' | 'create' | 'join' | 'waiting' | 'playing' | 'result';

const QUESTION_COUNTS: TriviaQuestionCount[] = [5, 10, 15];
const SECONDS_OPTIONS: TriviaSecondsPerQuestion[] = [10, 15, 20];

type PreguntaMsg = Extract<SalaMensaje, { type: 'PREGUNTA' }>;

interface RankingItem {
  usuarioId: number;
  nombre: string;
  score: number;
}

// El contrato no fija el shape exacto de cada item de `ranking` — se parsea
// probando varios nombres posibles, igual que el resto de clientes del proyecto.
function parseRankingItem(item: unknown): RankingItem {
  const o = item as any;
  return {
    usuarioId: Number(o?.usuarioId ?? o?.id ?? -1),
    nombre: String(o?.nombre ?? o?.name ?? '???'),
    score: Number(o?.puntaje ?? o?.puntuacion ?? o?.score ?? o?.puntos ?? 0),
  };
}

// SALA_UPDATE no dice quién es el anfitrión entre los participantes — se asume
// que es quien aparece primero (quien crea la sala es, en la práctica, el
// primero en mandar "unirse"). Da igual para habilitar "Iniciar sala": eso se
// controla con el `isHost` local de quien creó la sala, no con esta lista.
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

export default function TriviaRoomPage() {
  const { navigate, currentUser } = useNavigation();
  const session = getSession();

  const [stage, setStage] = useState<Stage>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [sala, setSala] = useState<Sala | null>(null);

  const [createCategory, setCreateCategory] = useState('');
  const [numQuestions, setNumQuestions] = useState<TriviaQuestionCount>(10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<TriviaSecondsPerQuestion>(15);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [wsErrorMsg, setWsErrorMsg] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [participants, setParticipants] = useState<TriviaParticipant[]>([]);
  const [prevPositions, setPrevPositions] = useState<Record<string, number>>({});

  const [question, setQuestion] = useState<PreguntaMsg | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [finalRanking, setFinalRanking] = useState<TriviaParticipant[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);

  const socketRef = useRef<TriviaSocket | null>(null);
  const participantsRef = useRef<TriviaParticipant[]>([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // "unirse" hace dos cosas en el backend: registra la fila en sala_participante
  // Y ata esta conexión STOMP a un usuarioId (sin eso, /responder no sabe quién
  // contestó y el backend responde con un error de "usuario_id" nulo — se
  // confirmó probando con dos usuarios reales). Al host, POST /api/salas ya lo
  // registró como participante, así que su "unirse" choca con una llave
  // duplicada — pero igual hay que mandarlo para que el backend asocie su sesión
  // de WS; el error que devuelve ese choque se filtra para no alarmar de más
  // (ver FILTERED_ERROR_SNIPPETS). El ref evita mandarlo dos veces si STOMP
  // reconecta (o por el doble montaje de efectos de StrictMode en dev).
  const joinedCodeRef = useRef<string | null>(null);

  const shareLink = sala ? `growlink.app/trivia/unirse/${sala.codigo}` : '';

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
        setParticipants((prev) => mergeParticipantes(prev, msg.participantes, session.usuarioId));
        break;
      case 'PREGUNTA':
        setPrevPositions(
          Object.fromEntries([...participantsRef.current].sort((a, b) => b.score - a.score).map((p, i) => [p.id, i]))
        );
        setQuestion(msg);
        setSelected(null);
        setAnswered(false);
        setStarting(false);
        setStage('playing');
        break;
      case 'LEADERBOARD':
        setParticipants((prev) => mergeLeaderboard(prev, msg.ranking, session.usuarioId));
        break;
      case 'RESULTADOS_FINALES': {
        const ranked = msg.ranking
          .map(parseRankingItem)
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({
            id: String(r.usuarioId),
            name: r.nombre,
            score: r.score,
            streak: 0,
            lastGain: 0,
            isHost: i === 0,
            isCurrentUser: r.usuarioId === session.usuarioId,
          }));
        setFinalRanking(ranked);
        setWinnerId(msg.ganadorUsuarioId);
        setStage('result');
        break;
      }
      case 'ERROR':
        // Ruido conocido e inofensivo: el "unirse" del host siempre choca con la fila que
        // ya insertó POST /api/salas (ver el comentario arriba de joinedCodeRef). No se
        // oculta ningún otro error, solo este.
        if (!/sala_participante/i.test(msg.message)) setWsErrorMsg(msg.message);
        setStarting(false);
        break;
    }
  }

  // Cuenta regresiva local de la pregunta: se deriva de enviadaEnEpochMs + duracionSegundos
  // (el servidor es quien manda cuándo se acaba el tiempo, esto solo lo refleja visualmente).
  useEffect(() => {
    if (!question) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [question?.indice]);

  if (!currentUser || !session) return null;

  const elapsedSec = question ? (now - question.enviadaEnEpochMs) / 1000 : 0;
  const secondsLeft = question ? Math.max(0, Math.ceil(question.duracionSegundos - elapsedSec)) : 0;
  const timerFraction = question && question.duracionSegundos > 0 ? Math.max(0, Math.min(1, secondsLeft / question.duracionSegundos)) : 0;
  const timeUp = question !== null && secondsLeft <= 0;

  async function handleCreate() {
    if (!createCategory || !session) return;
    setCreating(true);
    setCreateError(null);
    try {
      const nuevaSala = await crearSala({
        categoria: createCategory,
        hostUsuarioId: session.usuarioId,
        hostNombre: session.nombre,
        numPreguntas: numQuestions,
        duracionSegundos: secondsPerQuestion,
      });
      // POST /api/salas ya nos registró como participante en el backend (no mandamos
      // "unirse" por WS para el host — ver el comentario en el efecto de conexión),
      // así que nos agregamos de una vez localmente en vez de esperar un SALA_UPDATE
      // que nadie va a disparar hasta que llegue el primer invitado.
      setParticipants([{ id: String(session.usuarioId), name: session.nombre, score: 0, streak: 0, lastGain: 0, isHost: true, isCurrentUser: true }]);
      setIsHost(true);
      setSala(nuevaSala);
      setStage('waiting');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'No se pudo crear la sala.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinSubmit() {
    const codigo = joinCode.trim().toUpperCase();
    if (!codigo) return;
    setJoining(true);
    setJoinError(null);
    try {
      const encontrada = await obtenerSala(codigo);
      if (!encontrada) {
        setJoinError('No encontramos una sala con ese código.');
        return;
      }
      setParticipants([]);
      setIsHost(false);
      setSala(encontrada);
      setStage('waiting');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'No se pudo buscar la sala.');
    } finally {
      setJoining(false);
    }
  }

  function startGame() {
    setStarting(true);
    setWsErrorMsg(null);
    socketRef.current?.iniciar();
  }

  function handleAnswer(idx: number) {
    if (answered || !question || !session) return;
    setSelected(idx);
    setAnswered(true);
    socketRef.current?.responder(session.usuarioId, question.indice, idx);
  }

  function rankedParticipants() {
    return [...participants].sort((a, b) => b.score - a.score);
  }

  function resetAll() {
    joinedCodeRef.current = null;
    setStage('lobby');
    setIsHost(false);
    setSala(null);
    setCreateCategory('');
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
    setFinalRanking([]);
    setWinnerId(null);
  }

  const ranked = rankedParticipants();
  const miParticipante = ranked.find((p) => p.isCurrentUser);
  const timerColor = timerFraction < 0.25 ? '#EF4444' : timerFraction < 0.5 ? '#F59E0B' : '#12C2A8';

  // ─── LOBBY ──────────────────────────────────────────────────
  if (stage === 'lobby') {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Modo competitivo</span>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-3 mb-4">Trivia por salas</h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-lg max-w-md mx-auto leading-relaxed">
                Crea una sala o únete con un código y compite en tiempo real contra otros usuarios.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                onClick={() => setStage('create')}
                className="gl-card-hover relative p-6 sm:p-8 rounded-2xl border-2 border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#12C2A8] bg-white dark:bg-[#0F2240] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#12C2A8] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#12C2A8]/10 dark:bg-[#12C2A8]/20 border border-[#12C2A8]/30 flex items-center justify-center mb-5 relative z-10">
                  <svg className="w-6 h-6 text-[#12C2A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2 relative z-10 group-hover:text-[#12C2A8] transition-colors">Crear sala</h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm leading-relaxed relative z-10">Elige categoría, número de preguntas y tiempo. Comparte el código y espera a que lleguen.</p>
                <div className="mt-5 relative z-10">
                  <span className="text-xs text-[#12C2A8] font-semibold border border-[#12C2A8]/30 px-2 py-0.5 rounded-md">Ser anfitrión</span>
                </div>
              </button>

              <button
                onClick={() => setStage('join')}
                className="gl-card-hover relative p-6 sm:p-8 rounded-2xl border-2 border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8] bg-white dark:bg-[#0F2240] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#1E73E8] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#1E73E8]/10 dark:bg-[#1E73E8]/20 border border-[#1E73E8]/30 flex items-center justify-center mb-5 relative z-10">
                  <svg className="w-6 h-6 text-[#1E73E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2 relative z-10 group-hover:text-[#1E73E8] transition-colors">Unirse a una sala</h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm leading-relaxed relative z-10">Entra con el código de 6 letras que te compartió el anfitrión.</p>
                <div className="mt-5 relative z-10">
                  <span className="text-xs text-[#1E73E8] font-semibold border border-[#1E73E8]/30 px-2 py-0.5 rounded-md">Jugador</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CREATE ─────────────────────────────────────────────────
  if (stage === 'create') {
    const canCreate = createCategory !== '' && !creating;
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="max-w-xl w-full">
            <button onClick={() => setStage('lobby')} className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>

            <div className="mb-8">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Anfitrión</span>
              <h2 className="text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 mb-1">Configurar sala</h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2]">Define las reglas antes de invitar a los demás.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">Categoría</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCreateCategory(cat)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer ${
                        createCategory === cat
                          ? 'border-[#12C2A8] bg-[#12C2A8]/10 text-[#12C2A8]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] hover:border-[#1E73E8]/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">Número de preguntas</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        numQuestions === n
                          ? 'border-[#1E73E8] bg-[#1E73E8]/10 text-[#1E73E8]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] hover:border-[#1E73E8]/40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">Duración por pregunta</label>
                <div className="grid grid-cols-3 gap-2">
                  {SECONDS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSecondsPerQuestion(s)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        secondsPerQuestion === s
                          ? 'border-[#1E73E8] bg-[#1E73E8]/10 text-[#1E73E8]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] hover:border-[#1E73E8]/40'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {createError && <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{createError}</p>}

              <Button variant="gradient" size="lg" className="w-full" disabled={!canCreate} onClick={handleCreate}>
                {creating ? <><Spinner /> Creando sala...</> : 'Crear sala y esperar jugadores'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── JOIN ────────────────────────────────────────────────────
  if (stage === 'join') {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="max-w-md w-full">
            <button onClick={() => setStage('lobby')} className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>

            <div className="mb-8">
              <span className="text-[#1E73E8] text-xs font-mono font-semibold tracking-widest uppercase">Unirse</span>
              <h2 className="text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 mb-1">Ingresa el código</h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2]">El código de 6 letras te lo comparte quien creó la sala.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinSubmit();
              }}
              className="space-y-4"
            >
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="GL7X9K"
                autoFocus
                className="w-full text-center tracking-[0.5em] uppercase font-mono font-bold text-2xl px-4 py-4 border-2 border-[#DDE4ED] dark:border-[#1C3254] rounded-xl bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#DDE4ED] dark:placeholder:text-[#1C3254] focus:outline-none focus:border-[#1E73E8] transition-all"
              />
              {joinError && <p className="text-sm text-[#DC2626] dark:text-[#F87171] text-center">{joinError}</p>}
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={joinCode.trim().length === 0 || joining}>
                {joining ? <><Spinner /> Buscando sala...</> : 'Unirme a la sala'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── WAITING ROOM ────────────────────────────────────────────
  if (stage === 'waiting') {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Sala de espera</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-3 mb-3">{sala?.categoria}</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full border text-[#12C2A8] border-[#12C2A8]/40 bg-[#12C2A8]/10">
                  {sala?.numPreguntas} preguntas · {sala?.duracionSegundos}s c/u
                </span>
                <div className="flex items-center gap-2 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-full px-3 py-1">
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Código:</span>
                  <span className="text-xs font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6] tracking-widest">{sala?.codigo}</span>
                </div>
                {!wsConnected && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-[#B45309] dark:text-[#FBBF24]">
                    <Spinner className="w-3.5 h-3.5" /> Conectando...
                  </span>
                )}
              </div>
              {isHost && (
                <button
                  onClick={() => { navigator.clipboard?.writeText(shareLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-[#1E73E8] font-semibold hover:underline cursor-pointer font-mono"
                >
                  {copied ? 'Enlace copiado' : shareLink}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>

            {wsErrorMsg && (
              <div className="mb-5 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{wsErrorMsg}</p>
              </div>
            )}

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl overflow-hidden mb-6">
              <div className="px-5 py-3.5 border-b border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-between">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Participantes</p>
                <div className="flex items-center gap-2">
                  <LiveIndicator label="" color="green" />
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{participants.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {participants.map((p) => (
                  <div key={p.id} className={`gl-pop-in flex items-center gap-3 px-4 py-3 rounded-xl ${
                    p.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/20' : 'bg-[#F7F9FA] dark:bg-[#132A47] border border-[#EEF2F6] dark:border-[#1C3254]'
                  }`}>
                    <div className="relative w-8 h-8 rounded-full gl-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {p.name[0]}
                      <span className="gl-status-dot bg-[#4CE07E] live-pulse absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#0F2240]" />
                    </div>
                    <span className={`text-sm font-semibold ${p.isCurrentUser ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                      {p.name}{p.isCurrentUser && <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-normal ml-2">(tú)</span>}
                    </span>
                    <span className="text-[10px] font-mono text-[#15803D] dark:text-[#4CE07E] font-semibold">Conectado</span>
                    {p.isHost && (
                      <span className="ml-auto text-xs text-[#F59E0B] font-semibold border border-[#F59E0B]/30 px-2 py-0.5 rounded-md">Anfitrión</span>
                    )}
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] text-center py-2">Conectando a la sala...</p>
                )}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#DDE4ED] dark:border-[#1C3254]">
                  <div className="w-8 h-8 rounded-full border border-dashed border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#6B7A99]/50 dark:text-[#8BA5C2]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Esperando más jugadores...</span>
                  <span className="ml-auto flex gap-1">
                    {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#DDE4ED] dark:bg-[#1C3254] animate-pulse" style={{ animationDelay: `${d * 0.2}s` }} />)}
                  </span>
                </div>
              </div>
            </div>

            {starting ? (
              <div className="text-center mb-4">
                <div className="flex justify-center text-[#12C2A8] mb-2"><Spinner className="w-6 h-6" /></div>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm font-mono">Iniciando sala...</p>
              </div>
            ) : isHost ? (
              <div className="space-y-3">
                <Button variant="gradient" size="lg" className="w-full" disabled={participants.length < 2 || !wsConnected} onClick={startGame}>
                  Iniciar sala ahora
                </Button>
                {participants.length < 2 && (
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] text-center font-mono">Se necesita al menos 1 jugador más para iniciar.</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">El anfitrión iniciará la sala cuando todos estén listos.</p>
                <Button variant="secondary" className="mt-4" onClick={resetAll}>Salir de la sala</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT / PODIUM ────────────────────────────────────────
  if (stage === 'result') {
    const podium = finalRanking.slice(0, 3);
    const rest = finalRanking.slice(3);
    const heightFor = (i: number) => (i === 0 ? 'h-40' : i === 1 ? 'h-28' : 'h-20');
    const orderFor = (i: number) => (i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3');
    const colorFor = (i: number) => (i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7C2F');
    const myRank = finalRanking.findIndex((p) => p.isCurrentUser) + 1;
    const amIWinner = winnerId !== null && winnerId === session.usuarioId;

    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase mb-2">Sala finalizada</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-8 text-center">
            {amIWinner ? '¡Ganaste la sala!' : myRank > 0 ? `Terminaste en el puesto #${myRank}` : 'Sala finalizada'}
          </h2>

          <div className="flex items-end justify-center gap-4 mb-10 w-full max-w-lg">
            {podium.map((p, i) => (
              <div key={p.id} className={`flex flex-col items-center flex-1 ${orderFor(i)} gl-pop-in`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-11 h-11 rounded-full gl-gradient flex items-center justify-center text-white font-bold mb-2">{p.name[0]}</div>
                <p className={`text-sm font-semibold mb-2 text-center truncate max-w-[6.5rem] ${p.isCurrentUser ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>{p.name}</p>
                <div
                  className={`w-full ${heightFor(i)} rounded-t-xl flex flex-col items-center justify-start pt-3 gap-1`}
                  style={{ background: `linear-gradient(180deg, ${colorFor(i)}, #0B1F3A)` }}
                >
                  <span className="text-white font-display font-bold text-xl">{i + 1}</span>
                  <span className="text-white/80 text-xs font-mono">{p.score.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="w-full max-w-md space-y-2 mb-10">
              {rest.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/30' : 'bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254]'}`}>
                  <span className="text-sm font-mono font-bold text-[#6B7A99] dark:text-[#8BA5C2] w-5">{i + 4}</span>
                  <span className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] flex-1">{p.name}</span>
                  <span className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="gradient" size="lg" onClick={resetAll}>Jugar de nuevo</Button>
            <Button variant="secondary" size="lg" onClick={() => navigate(currentUser.role === 'publisher' ? 'my-courses' : 'home')}>
              Salir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ────────────────────────────────────────────────
  if (!question) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div className="flex flex-col items-center gap-3 text-[#6B7A99] dark:text-[#8BA5C2]">
            <Spinner className="w-6 h-6" />
            <p>Esperando la primera pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <LiveIndicator label="SALA EN VIVO" color="teal" size="md" />
            <span className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm font-mono">{participants.length} jugadores</span>
            <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono border border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] px-2 py-0.5 rounded-md">{sala?.categoria}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider">Pregunta</p>
              <p className="text-[#0B1F3A] dark:text-[#E2EBF6] font-mono font-bold">{question.indice + 1} / {question.totalPreguntas}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider">Tu puntaje</p>
              <p className="font-mono font-bold text-[#15803D] dark:text-[#4CE07E]">{(miParticipante?.score ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {wsErrorMsg && (
          <div className="mb-5 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{wsErrorMsg}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" className="text-[#EEF2F6] dark:text-[#1C3254]" stroke="currentColor" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerFraction)}`}
                    style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl" style={{ color: timerColor }}>{secondsLeft}</span>
              </div>
              <div className="flex-1 h-1 bg-[#EEF2F6] dark:bg-[#1C3254] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(question.indice / question.totalPreguntas) * 100}%`, background: 'linear-gradient(90deg, #1E73E8, #12C2A8)' }} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-8 mb-6">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-widest mb-4">Pregunta {question.indice + 1}</p>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug">{question.texto}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {question.opciones.map((option, i) => {
                // trivia-service nunca manda la respuesta correcta — solo se puede marcar cuál elegiste.
                const isSelected = answered && i === selected;
                const locked = answered || timeUp;
                const stateClasses = isSelected
                  ? 'border-[#1E73E8] bg-[#1E73E8]/10 text-[#1E73E8]'
                  : locked
                    ? 'border-[#EEF2F6] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] opacity-60'
                    : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:border-[#1E73E8]/40 text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer';
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={locked}
                    className={`p-5 rounded-2xl border-2 text-left font-semibold transition-all flex items-center gap-4 ${stateClasses}`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-mono font-bold shrink-0 ${
                      isSelected ? 'bg-[#1E73E8]/20 text-[#1E73E8]' : 'bg-[#F7F9FA] dark:bg-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]'
                    }`}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="text-sm leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>

            {answered ? (
              <p className="text-center mt-4 font-mono font-bold text-[#1E73E8]">
                {miParticipante && miParticipante.lastGain > 0 ? `+${miParticipante.lastGain} puntos` : 'Respuesta enviada — esperando resultados...'}
              </p>
            ) : timeUp ? (
              <p className="text-center mt-4 font-mono font-bold text-[#DC2626] dark:text-[#F87171]">Tiempo agotado</p>
            ) : null}
          </div>

          {/* Leaderboard */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl overflow-hidden h-80 lg:h-full flex flex-col">
              <div className="p-4 border-b border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-between">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Leaderboard</p>
                <LiveIndicator label="VIVO" color="green" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {ranked.map((player, i) => {
                  const delta = prevPositions[player.id] !== undefined ? prevPositions[player.id] - i : 0;
                  return (
                    <div
                      key={player.id}
                      className={`gl-card-hover flex items-center gap-3 p-3 rounded-xl transition-all ${
                        player.isCurrentUser ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/30' : 'bg-[#F7F9FA] dark:bg-[#132A47] border border-[#EEF2F6] dark:border-[#1C3254]'
                      } ${delta !== 0 ? 'gl-pop-in' : ''}`}
                    >
                      <span className={`text-sm font-mono font-bold w-5 text-center shrink-0 ${i === 0 ? 'text-[#B45309] dark:text-[#F59E0B]' : i === 1 ? 'text-[#64748B] dark:text-[#94A3B8]' : i === 2 ? 'text-[#9A5A24] dark:text-[#CD7C2F]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
                        {i + 1}
                      </span>
                      <div className="relative w-7 h-7 rounded-lg gl-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {player.name[0]}
                        <span className="gl-status-dot bg-[#4CE07E] absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#0F2240]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${player.isCurrentUser ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>{player.name}</p>
                      </div>
                      <PositionBadge delta={delta} />
                      <p className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{player.score.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
