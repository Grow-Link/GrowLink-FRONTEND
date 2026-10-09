import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { getPerfil, type Perfil } from '../services/usuariosServiceApi';
import { listarCompletados, listarPorPublicador, type CursoCompletado } from '../services/cursosServiceApi';
import { fetchRoadmap } from '../services/roadmapApi';
import { listarMisPartidas, type MiPartida } from '../services/triviaServiceApi';
import type { Course } from '../types';
import type { RoadmapView } from '../utils/roadmapModel';

const card = 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6';
const chip = 'px-3 py-1.5 rounded-lg text-sm font-medium bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#1F2D2A] dark:text-[#E6EFE9] border border-[#E1E6DF] dark:border-[#27403A]';

// El perfil de la persona con sesión, con sus datos reales. Quien aprende ve su meta y su avance; quien publica
// ve sus cursos; y todos ven sus partidas de trivia.
export default function PublicProfilePage() {
  const { currentUser, navigate } = useNavigation();
  const rol = currentUser?.role;

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapView | null>(null);
  const [completados, setCompletados] = useState<CursoCompletado[]>([]);
  const [cursos, setCursos] = useState<Course[]>([]);
  const [partidas, setPartidas] = useState<MiPartida[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    const id = Number(currentUser.id);
    const sinFallo = <T,>(p: Promise<T>, vacio: T) => p.catch(() => vacio);
    Promise.all([
      rol === 'user' ? sinFallo(getPerfil(), null) : Promise.resolve(null),
      rol === 'user' ? sinFallo(fetchRoadmap(), null) : Promise.resolve(null),
      rol === 'user' ? sinFallo(listarCompletados(id), [] as CursoCompletado[]) : Promise.resolve([] as CursoCompletado[]),
      rol === 'publisher' ? sinFallo(listarPorPublicador(id), [] as Course[]) : Promise.resolve([] as Course[]),
      rol !== 'admin' ? sinFallo(listarMisPartidas(5), [] as MiPartida[]) : Promise.resolve([] as MiPartida[]),
    ]).then(([p, r, c, k, m]) => {
      if (ignorar) return;
      setPerfil(p);
      setRoadmap(r);
      setCompletados(c);
      setCursos(k);
      setPartidas(m);
      setCargando(false);
    });
    return () => {
      ignorar = true;
    };
  }, [currentUser, rol]);

  if (!currentUser) return null;
  const iniciales = currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  const habilidades = [...new Set(completados.flatMap((c) => c.habilidades))];
  const activos = cursos.filter((c) => c.status === 'active');
  const victorias = partidas.filter((p) => p.miPosicion === 1 && p.partida.ganadorUsuarioId === Number(currentUser.id)).length;

  const estadisticas =
    rol === 'user'
      ? [
          { v: String(completados.length), l: 'Cursos aprobados' },
          { v: `${roadmap?.progreso.porcentaje ?? 0}%`, l: 'Avance del roadmap' },
          { v: String(perfil?.triviasGanadas ?? 0), l: 'Trivias ganadas' },
        ]
      : rol === 'publisher'
        ? [
            { v: String(activos.length), l: 'Cursos activos' },
            { v: String(cursos.length), l: 'Cursos publicados' },
            { v: String(victorias), l: 'Trivias ganadas (recientes)' },
          ]
        : [];

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />

      <div className="bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-[#12C2A8]/20 blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gl-gradient flex items-center justify-center text-white text-2xl sm:text-3xl font-display font-bold shrink-0">{iniciales}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{currentUser.name}</h1>
            <p className="text-[#BCC9C2] mt-1">{currentUser.headline}</p>
            {rol === 'admin' ? (
              <p className="text-sm text-[#BCC9C2] mt-3">Cuenta de administración de la plataforma.</p>
            ) : (
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {estadisticas.map((e) => (
                  <div key={e.l}>
                    <p className="text-2xl font-display font-bold text-white">{cargando ? '…' : e.v}</p>
                    <p className="text-xs text-[#BCC9C2]">{e.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          {rol === 'user' && (
            <>
              <section className={card}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg">Mi meta</h2>
                  <button type="button" onClick={() => navigate('onboarding')} className="text-sm text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Cambiar</button>
                </div>
                {perfil?.metas ? (
                  <>
                    <p className="text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed">«{perfil.metas}»</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {perfil.intereses.map((i) => <span key={i} className={chip}>{i}</span>)}
                      {perfil.nivel && <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2] capitalize">Parto como {perfil.nivel}</span>}
                    </div>
                  </>
                ) : (
                  <Button variant="gradient" size="sm" onClick={() => navigate('onboarding')}>Armar mi roadmap</Button>
                )}
              </section>

              {roadmap && (
                <section className={card}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg">Mi roadmap</h2>
                    <button type="button" onClick={() => navigate('roadmap')} className="text-sm text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Abrirlo</button>
                  </div>
                  <ProgressBar value={roadmap.progreso.porcentaje} size="md" variant="gradient" showLabel />
                  <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-2">
                    {roadmap.progreso.completados} de {roadmap.progreso.total} cursos aprobados · {roadmap.progreso.horasHechas} de {roadmap.progreso.horasTotales} horas
                  </p>
                </section>
              )}

              <section className={card}>
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mb-3">Habilidades desbloqueadas</h2>
                {habilidades.length === 0 ? (
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Aprueba cursos para desbloquear habilidades.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">{habilidades.map((h) => <span key={h} className={chip}>{h}</span>)}</div>
                )}
              </section>
            </>
          )}

          {rol === 'publisher' && (
            <section className={card}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg">Mis cursos</h2>
                <button type="button" onClick={() => navigate('my-courses')} className="text-sm text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Gestionar</button>
              </div>
              {cursos.length === 0 ? (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Aún no has publicado cursos.</p>
              ) : (
                <ul className="space-y-2">
                  {cursos.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => navigate('course-detail', { id: c.id })} className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] px-4 py-2.5 text-left hover:border-[#12C2A8] cursor-pointer">
                        <span className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{c.title}</span>
                        <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] shrink-0">{c.status === 'active' ? 'Activo' : 'Dado de baja'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {rol === 'admin' && (
            <section className={card}>
              <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mb-2">Administración</h2>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-4">Desde aquí supervisas la plataforma: métricas de uso y moderación del catálogo.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => navigate('admin-dashboard')}>Ver métricas</Button>
                <Button variant="secondary" onClick={() => navigate('admin-courses')}>Moderar cursos</Button>
              </div>
            </section>
          )}
        </div>

        {rol !== 'admin' && (
          <aside className="space-y-4">
            <section className={card}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Mis partidas</h2>
                <button type="button" onClick={() => navigate('trivia')} className="text-xs text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold hover:underline cursor-pointer">Jugar</button>
              </div>
              {partidas.length === 0 ? (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Todavía no has jugado trivias.</p>
              ) : (
                <ul className="space-y-2.5">
                  {partidas.map((p) => (
                    <li key={p.partida.codigo} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{p.miPosicion === 1 ? '🏆' : p.miPosicion === 2 ? '🥈' : p.miPosicion === 3 ? '🥉' : '🎯'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{p.partida.categoria}</p>
                        <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">Puesto {p.miPosicion} de {p.partida.totalJugadores} · {p.misPuntos} pts</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        )}
      </main>
    </div>
  );
}
