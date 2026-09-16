import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import LiveIndicator from '../components/LiveIndicator';
import { useNavigation } from '../store/NavigationContext';
import { mockTriviaQuestions, mockPlayers } from '../services/mockData';
import { useTimer } from '../hooks/useTimer';
import type { Player } from '../types';

type GameMode = 'kahoot' | 'bloqueo';
type Stage = 'lobby' | 'create' | 'join' | 'waiting' | 'playing' | 'result';

const CATEGORIES = [
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Ingeniería Civil',
  'Ingeniería Electrónica',
  'Matemáticas Aplicadas',
];

interface ActiveDuel {
  id: string;
  host: string;
  category: string;
  mode: GameMode;
  current: number;
  max: number;
}

const ACTIVE_DUELS: ActiveDuel[] = [
  { id: '1', host: 'Carlos Mendez', category: 'Ingeniería de Sistemas', mode: 'kahoot', current: 2, max: 6 },
  { id: '2', host: 'Laura Torres', category: 'Matemáticas Aplicadas', mode: 'bloqueo', current: 4, max: 4 },
  { id: '3', host: 'Andrés Villareal', category: 'Ingeniería Industrial', mode: 'kahoot', current: 1, max: 8 },
  { id: '4', host: 'Sofia Gutierrez', category: 'Ingeniería Electrónica', mode: 'bloqueo', current: 3, max: 6 },
];

const WAITING_PLAYERS = [
  { name: 'Valentina Ríos', isYou: true },
  { name: 'Carlos Mendez', isYou: false },
  { name: 'Andrés Villareal', isYou: false },
];

export default function TriviaDuelPage() {
  const { navigate } = useNavigation();

  // Lobby stage machine
  const [stage, setStage] = useState<Stage>('lobby');
  const [isHost, setIsHost] = useState(false);

  // Create form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Join state
  const [joinedDuel, setJoinedDuel] = useState<ActiveDuel | null>(null);

  // Waiting room
  const [waitingPlayers, setWaitingPlayers] = useState(WAITING_PLAYERS);
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);

  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('kahoot');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(2400);
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [streak, setStreak] = useState(3);
  const [blockedOption, setBlockedOption] = useState<{ index: number; by: string } | null>(null);
  const { seconds, formatted, reset } = useTimer(20, false);

  const question = mockTriviaQuestions[questionIndex % mockTriviaQuestions.length];
  const totalQuestions = 10;

  // Simulate players joining the waiting room when hosting
  useEffect(() => {
    if (stage !== 'waiting') return;
    const timer = setTimeout(() => {
      setWaitingPlayers((prev) =>
        prev.some((p) => p.name === 'Laura Torres')
          ? prev
          : [...prev, { name: 'Laura Torres', isYou: false }]
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  // Countdown before game starts
  useEffect(() => {
    if (waitingCountdown === null) return;
    if (waitingCountdown <= 0) {
      reset(20);
      setStage('playing');
      return;
    }
    const t = setTimeout(() => setWaitingCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [waitingCountdown]);

  // Timer exhausted
  useEffect(() => {
    if (seconds === 0 && !answered && stage === 'playing') {
      handleAnswer(-1);
    }
  }, [seconds, stage]);

  // Bloqueo: simulate opponent block
  useEffect(() => {
    if (gameMode !== 'bloqueo' || answered || blockedOption !== null || stage !== 'playing') return;
    const delay = Math.floor(Math.random() * 8000) + 4000;
    const timer = setTimeout(() => {
      const randomPlayer = players.find((p) => !p.isCurrentUser);
      const randomOption = Math.floor(Math.random() * question.options.length);
      if (randomPlayer && !answered) {
        setBlockedOption({ index: randomOption, by: randomPlayer.name });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [gameMode, questionIndex, answered, blockedOption, stage]);

  function handleAnswer(idx: number) {
    if (answered) return;
    if (gameMode === 'bloqueo' && blockedOption && idx === blockedOption.index) return;

    setSelected(idx);
    setAnswered(true);

    const correct = idx === question.correctIndex;
    const points = correct ? Math.max(100, seconds * 50) : 0;

    if (correct) {
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      if (gameMode === 'bloqueo') setBlockedOption({ index: idx, by: 'Tu' });
    } else {
      setStreak(0);
    }

    setPlayers((prev) =>
      prev
        .map((p) =>
          p.isCurrentUser
            ? { ...p, score: p.score + points, streak: correct ? p.streak + 1 : 0 }
            : { ...p, score: p.score + (Math.random() > 0.5 ? Math.floor(Math.random() * 600) : 0) }
        )
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({ ...p, position: i + 1 }))
    );

    setTimeout(() => {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((q) => q + 1);
        setSelected(null);
        setAnswered(false);
        setBlockedOption(null);
        reset(20);
      } else {
        setStage('result');
      }
    }, 2000);
  }

  function startGame() {
    setGameMode(selectedMode ?? 'kahoot');
    setWaitingCountdown(3);
  }

  function resetAll() {
    setStage('lobby');
    setIsHost(false);
    setSelectedCategory('');
    setMaxPlayers(6);
    setSelectedMode(null);
    setJoinedDuel(null);
    setWaitingPlayers(WAITING_PLAYERS);
    setWaitingCountdown(null);
    setQuestionIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(2400);
    setStreak(3);
    setBlockedOption(null);
    reset(20);
  }

  const timerFraction = seconds / 20;
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
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-3 mb-4">Duelo de trivia</h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-lg max-w-md mx-auto leading-relaxed">
                Demuestra lo que sabes y compite contra otros profesionales en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Create */}
              <button
                onClick={() => { setIsHost(true); setStage('create'); }}
                className="gl-card-hover relative p-6 sm:p-8 rounded-2xl border-2 border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#12C2A8] bg-white dark:bg-[#0F2240] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#12C2A8] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#12C2A8]/10 dark:bg-[#12C2A8]/20 border border-[#12C2A8]/30 flex items-center justify-center mb-5 relative z-10">
                  <svg className="w-6 h-6 text-[#12C2A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2 relative z-10 group-hover:text-[#12C2A8] transition-colors">
                  Crear nuevo duelo
                </h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm leading-relaxed relative z-10">
                  Elige la temática, el modo de juego y el número de jugadores. Comparte el código y espera a que lleguen.
                </p>
                <div className="mt-5 relative z-10">
                  <span className="text-xs text-[#12C2A8] font-semibold border border-[#12C2A8]/30 px-2 py-0.5 rounded-md">Ser anfitrión</span>
                </div>
              </button>

              {/* Join */}
              <button
                onClick={() => { setIsHost(false); setStage('join'); }}
                className="gl-card-hover relative p-6 sm:p-8 rounded-2xl border-2 border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8] bg-white dark:bg-[#0F2240] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] text-left cursor-pointer transition-colors group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#1E73E8] opacity-5 blur-2xl translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#1E73E8]/10 dark:bg-[#1E73E8]/20 border border-[#1E73E8]/30 flex items-center justify-center mb-5 relative z-10">
                  <svg className="w-6 h-6 text-[#1E73E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2 relative z-10 group-hover:text-[#1E73E8] transition-colors">
                  Unirse a un duelo
                </h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm leading-relaxed relative z-10">
                  Explora los duelos activos en este momento y únete al que más te interese.
                </p>
                <div className="mt-5 flex items-center gap-3 relative z-10">
                  <span className="text-xs text-[#1E73E8] font-semibold border border-[#1E73E8]/30 px-2 py-0.5 rounded-md">Jugador</span>
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{ACTIVE_DUELS.filter(d => d.current < d.max).length} disponibles</span>
                </div>
              </button>
            </div>

            {/* Stats strip */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: '1,240', label: 'Duelos jugados hoy' },
                { value: '4.2s', label: 'Tiempo promedio de respuesta' },
                { value: '61%', label: 'Tasa de aciertos globales' },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{s.value}</p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CREATE ─────────────────────────────────────────────────
  if (stage === 'create') {
    const canCreate = selectedCategory !== '' && selectedMode !== null;
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
              <h2 className="text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 mb-1">Configurar duelo</h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2]">Define las reglas de tu sala antes de empezar.</p>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">Temática</label>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'border-[#12C2A8] bg-[#12C2A8]/10 text-[#12C2A8]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] hover:border-[#1E73E8]/40 hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max players */}
              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">
                  Máximo de jugadores — <span className="text-[#0B1F3A] dark:text-[#E2EBF6]">{maxPlayers}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full accent-[#12C2A8] cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">2</span>
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">10</span>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-3">Modo de juego</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedMode('kahoot')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedMode === 'kahoot'
                        ? 'border-[#12C2A8] bg-[#12C2A8]/10'
                        : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:border-[#1E73E8]/40'
                    }`}
                  >
                    <p className={`font-semibold mb-1 ${selectedMode === 'kahoot' ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>Kahoot</p>
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Velocidad = mas puntos</p>
                  </button>
                  <button
                    onClick={() => setSelectedMode('bloqueo')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedMode === 'bloqueo'
                        ? 'border-[#1E73E8] bg-[#1E73E8]/10'
                        : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:border-[#1E73E8]/40'
                    }`}
                  >
                    <p className={`font-semibold mb-1 ${selectedMode === 'bloqueo' ? 'text-[#1E73E8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>Bloqueo</p>
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Estrategia y rapidez</p>
                  </button>
                </div>
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={!canCreate}
                onClick={() => {
                  setWaitingPlayers([{ name: 'Valentina Ríos', isYou: true }]);
                  setStage('waiting');
                }}
              >
                Crear sala y esperar jugadores
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
        <div className="flex-1 px-4 sm:px-8 py-12 max-w-[1440px] mx-auto w-full">
          <button onClick={() => setStage('lobby')} className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>

          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[#1E73E8] text-xs font-mono font-semibold tracking-widest uppercase">Duelos activos</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">Elige tu duelo</h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">{ACTIVE_DUELS.filter(d => d.current < d.max).length} salas disponibles ahora mismo.</p>
            </div>
            <LiveIndicator label="EN VIVO" color="teal" size="md" />
          </div>

          <div className="space-y-3 max-w-3xl">
            {ACTIVE_DUELS.map((duel) => {
              const isFull = duel.current >= duel.max;
              return (
                <div
                  key={duel.id}
                  className={`flex flex-wrap items-center gap-4 sm:gap-5 p-5 rounded-2xl border transition-all ${
                    isFull
                      ? 'border-[#EEF2F6] dark:border-[#132A47] bg-[#F7F9FA] dark:bg-[#0F2240]/60 opacity-50'
                      : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:border-[#1E73E8]/30 hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
                  }`}
                >
                  {/* Category + host */}
                  <div className="flex-1 min-w-[10rem]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        duel.mode === 'kahoot'
                          ? 'text-[#12C2A8] border-[#12C2A8]/30'
                          : 'text-[#1E73E8] border-[#1E73E8]/30'
                      }`}>
                        {duel.mode === 'kahoot' ? 'Kahoot' : 'Bloqueo'}
                      </span>
                      {isFull && <span className="text-xs text-[#EF4444] font-semibold">Sala llena</span>}
                    </div>
                    <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] truncate">{duel.category}</p>
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">Anfitrión: {duel.host}</p>
                  </div>

                  {/* Players */}
                  <div className="text-center shrink-0">
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider mb-1">Jugadores</p>
                    <p className="font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">
                      <span className={duel.current >= duel.max ? 'text-[#EF4444]' : 'text-[#15803D] dark:text-[#4CE07E]'}>{duel.current}</span>
                      <span className="text-[#6B7A99] dark:text-[#8BA5C2]"> / {duel.max}</span>
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-20 sm:w-24 shrink-0 hidden sm:block">
                    <div className="h-1.5 bg-[#EEF2F6] dark:bg-[#1C3254] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(duel.current / duel.max) * 100}%`,
                          background: isFull ? '#EF4444' : 'linear-gradient(90deg, #1E73E8, #12C2A8)',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={isFull}
                    onClick={() => {
                      setJoinedDuel(duel);
                      setSelectedMode(duel.mode);
                      setSelectedCategory(duel.category);
                      setWaitingPlayers([
                        { name: duel.host, isYou: false },
                        { name: 'Valentina Ríos', isYou: true },
                      ]);
                      setStage('waiting');
                    }}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed bg-[#EEF2F6] dark:bg-[#1C3254] text-[#0B1F3A] dark:text-[#E2EBF6] hover:bg-[#12C2A8] hover:text-white disabled:opacity-40 shrink-0"
                  >
                    Unirse
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── WAITING ROOM ────────────────────────────────────────────
  if (stage === 'waiting') {
    const duelInfo = joinedDuel ?? {
      category: selectedCategory,
      mode: selectedMode ?? 'kahoot',
      max: maxPlayers,
    };
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="max-w-lg w-full">
            {/* Room code */}
            <div className="text-center mb-10">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Sala de espera</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-3 mb-2">{duelInfo.category}</h2>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  duelInfo.mode === 'kahoot'
                    ? 'text-[#12C2A8] border-[#12C2A8]/40 bg-[#12C2A8]/10'
                    : 'text-[#1E73E8] border-[#1E73E8]/40 bg-[#1E73E8]/10'
                }`}>
                  Modo {duelInfo.mode === 'kahoot' ? 'Kahoot' : 'Bloqueo'}
                </span>
                {isHost && (
                  <div className="flex items-center gap-2 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-full px-3 py-1">
                    <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Código:</span>
                    <span className="text-xs font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6] tracking-widest">GW-4872</span>
                  </div>
                )}
              </div>
            </div>

            {/* Players list */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl overflow-hidden mb-6">
              <div className="px-5 py-3.5 border-b border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-between">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Jugadores en sala</p>
                <div className="flex items-center gap-2">
                  <LiveIndicator label="" color="green" />
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{waitingPlayers.length} / {duelInfo.max}</span>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {waitingPlayers.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    p.isYou ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/20' : 'bg-[#F7F9FA] dark:bg-[#132A47] border border-[#EEF2F6] dark:border-[#1C3254]'
                  }`}>
                    <div className="w-8 h-8 rounded-full gl-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {p.name[0]}
                    </div>
                    <span className={`text-sm font-semibold ${p.isYou ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                      {p.name}
                      {p.isYou && <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-normal ml-2">(tú)</span>}
                    </span>
                    {i === 0 && !p.isYou && (
                      <span className="ml-auto text-xs text-[#F59E0B] font-semibold border border-[#F59E0B]/30 px-2 py-0.5 rounded-md">Anfitrión</span>
                    )}
                    {i === 0 && p.isYou && (
                      <span className="ml-auto text-xs text-[#12C2A8] font-semibold border border-[#12C2A8]/30 px-2 py-0.5 rounded-md">Anfitrión</span>
                    )}
                  </div>
                ))}
                {/* Waiting slot animation */}
                {waitingPlayers.length < duelInfo.max && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#DDE4ED] dark:border-[#1C3254]">
                    <div className="w-8 h-8 rounded-full border border-dashed border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#6B7A99]/50 dark:text-[#8BA5C2]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Esperando jugador...</span>
                    <span className="ml-auto flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#DDE4ED] dark:bg-[#1C3254] animate-pulse" style={{ animationDelay: `${d * 0.2}s` }} />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown overlay */}
            {waitingCountdown !== null && (
              <div className="text-center mb-4">
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mb-2 font-mono">El duelo comienza en...</p>
                <p className="text-8xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{waitingCountdown}</p>
              </div>
            )}

            {waitingCountdown === null && (
              isHost ? (
                <div className="space-y-3">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={waitingPlayers.length < 2}
                    onClick={startGame}
                  >
                    Iniciar duelo ahora
                  </Button>
                  {waitingPlayers.length < 2 && (
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] text-center font-mono">
                      Se necesita al menos 1 jugador más para iniciar.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">El anfitrión iniciará el duelo cuando todos estén listos.</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setStage('lobby')}>
                    Salir de la sala
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT ─────────────────────────────────────────────────
  if (stage === 'result') {
    const myPos = players.find((p) => p.isCurrentUser)?.position ?? 1;
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <div className="text-8xl mb-6">{myPos === 1 ? '🏆' : myPos <= 3 ? '🥈' : '🎯'}</div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">
              {myPos === 1 ? 'Ganaste el duelo!' : `Posicion #${myPos}`}
            </h2>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-lg mb-2">Puntuacion final — {gameMode === 'bloqueo' ? 'Modo Bloqueo' : 'Modo Kahoot'}</p>
            <p className="text-6xl font-mono font-bold text-[#12C2A8] mb-8">{score.toLocaleString()}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" size="lg" onClick={() => navigate('marketplace')}>
                Ir al marketplace
              </Button>
              <Button variant="secondary" size="lg" onClick={resetAll}>
                Jugar de nuevo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] flex flex-col">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <LiveIndicator label="DUELO EN VIVO" color="teal" size="md" />
            <span className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm font-mono">{players.length} jugadores</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              gameMode === 'bloqueo'
                ? 'bg-[#1E73E8]/10 dark:bg-[#1E73E8]/20 text-[#1E73E8] border border-[#1E73E8]/30'
                : 'bg-[#12C2A8]/10 dark:bg-[#12C2A8]/20 text-[#12C2A8] border border-[#12C2A8]/30'
            }`}>
              {gameMode === 'bloqueo' ? 'Modo Bloqueo' : 'Modo Kahoot'}
            </span>
            <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono border border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] px-2 py-0.5 rounded-md">
              {selectedCategory}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider">Pregunta</p>
              <p className="text-[#0B1F3A] dark:text-[#E2EBF6] font-mono font-bold">{(questionIndex % mockTriviaQuestions.length) + 1} / {totalQuestions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider">Tu puntaje</p>
              <p className="font-mono font-bold text-[#15803D] dark:text-[#4CE07E]">{score.toLocaleString()}</p>
            </div>
            {streak > 1 && (
              <div className="text-center">
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-wider">Racha</p>
                <p className="font-mono font-bold text-[#B45309] dark:text-[#F59E0B]">x{streak}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
          {/* Main question area */}
          <div className="flex-1 flex flex-col">
            {/* Timer arc */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" className="text-[#EEF2F6] dark:text-[#1C3254]" stroke="currentColor" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke={timerColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerFraction)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl" style={{ color: timerColor }}>
                  {seconds}
                </span>
              </div>
              <div className="flex-1 h-1 bg-[#EEF2F6] dark:bg-[#1C3254] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(questionIndex / totalQuestions) * 100}%`,
                    background: 'linear-gradient(90deg, #1E73E8, #12C2A8)',
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-8 mb-6">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono uppercase tracking-widest mb-4">Pregunta {(questionIndex % mockTriviaQuestions.length) + 1}</p>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug">{question.question}</h2>
            </div>

            {/* Answer options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {question.options.map((option, i) => {
                const isBlocked = gameMode === 'bloqueo' && blockedOption && blockedOption.index === i && !answered;
                let state: 'default' | 'correct' | 'wrong' | 'missed' | 'blocked' = 'default';
                if (isBlocked) state = 'blocked';
                else if (answered) {
                  if (i === question.correctIndex) state = 'correct';
                  else if (i === selected) state = 'wrong';
                  else state = 'missed';
                }
                const stateClasses: Record<string, string> = {
                  default: 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:border-[#1E73E8]/40 text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer',
                  correct: 'border-[#4CE07E] bg-[#4CE07E]/10 text-[#15803D] dark:text-[#4CE07E]',
                  wrong: 'border-[#EF4444] bg-[#EF4444]/10 text-[#DC2626] dark:text-[#EF4444]',
                  missed: 'border-[#EEF2F6] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2]',
                  blocked: 'border-[#F59E0B]/40 bg-[#F59E0B]/5 text-[#B45309] dark:text-[#FBBF24] cursor-not-allowed',
                };
                return (
                  <button
                    key={i}
                    onClick={() => !answered && state !== 'blocked' && handleAnswer(i)}
                    disabled={answered || state === 'blocked'}
                    className={`p-5 rounded-2xl border-2 text-left font-semibold transition-all flex flex-col gap-2 ${state === 'correct' ? 'gl-pop-in' : ''} ${stateClasses[state]}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-mono font-bold shrink-0 ${
                        state === 'default' ? 'bg-[#F7F9FA] dark:bg-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]' :
                        state === 'correct' ? 'bg-[#4CE07E]/20 text-[#15803D] dark:text-[#4CE07E]' :
                        state === 'wrong' ? 'bg-[#EF4444]/20 text-[#DC2626] dark:text-[#EF4444]' :
                        state === 'blocked' ? 'bg-[#F59E0B]/10 text-[#B45309] dark:text-[#F59E0B]' :
                        'bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2]'
                      }`}>
                        {state === 'blocked' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : ['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span className="text-sm leading-snug">{option}</span>
                    </div>
                    {state === 'blocked' && blockedOption && (
                      <p className="text-xs text-[#B45309] dark:text-[#FBBF24] font-semibold font-mono ml-12">
                        BLOQUEADO por {blockedOption.by}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {gameMode === 'bloqueo' && !answered && (
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] text-center mt-3 font-mono">
                Modo Bloqueo: el primero en responder correctamente bloquea esa opcion para todos
              </p>
            )}
          </div>

          {/* Leaderboard sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl overflow-hidden h-80 lg:h-full flex flex-col">
              <div className="p-4 border-b border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-between">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Leaderboard</p>
                <LiveIndicator label="VIVO" color="green" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className={`gl-card-hover flex items-center gap-3 p-3 rounded-xl ${
                      player.isCurrentUser
                        ? 'bg-[#12C2A8]/10 border border-[#12C2A8]/30'
                        : 'bg-[#F7F9FA] dark:bg-[#132A47] border border-[#EEF2F6] dark:border-[#1C3254]'
                    }`}
                  >
                    <span className={`text-sm font-mono font-bold w-5 text-center shrink-0 ${i === 0 ? 'gl-bounce' : ''} ${
                      i === 0 ? 'text-[#B45309] dark:text-[#F59E0B]' : i === 1 ? 'text-[#64748B] dark:text-[#94A3B8]' : i === 2 ? 'text-[#9A5A24] dark:text-[#CD7C2F]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                    <div className="w-7 h-7 rounded-lg gl-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {player.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${player.isCurrentUser ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                        {player.name}
                      </p>
                      {player.streak > 1 && (
                        <p className="text-[10px] text-[#B45309] dark:text-[#F59E0B] font-mono">racha x{player.streak}</p>
                      )}
                    </div>
                    <p className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{player.score.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
