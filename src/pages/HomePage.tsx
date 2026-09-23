import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import CheckpointPath from '../components/CheckpointPath';
import HorizontalTabs from '../components/HorizontalTabs';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

const CHECKPOINTS = [{ label: 'Tus metas' }, { label: 'Tus intereses' }, { label: 'Tu nivel' }];
const HOME_TABS = [
  { key: 'roadmap', label: 'Mi roadmap' },
  { key: 'catalog', label: 'Catálogo' },
  { key: 'trivia', label: 'Trivia' },
];

export default function HomePage() {
  const { navigate, currentUser } = useNavigation();
  const { profiles, roadmaps, courses, completions, generateRoadmap, roadmapHasStaleCourse, getRelevance } = useAppData();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'catalog' | 'trivia'>('roadmap');

  if (!currentUser) return null;
  const profile = profiles[currentUser.id];
  const roadmap = roadmaps[currentUser.id];
  const myCompletions = completions.filter((c) => c.userId === currentUser.id);

  // ─── VARIANT 1: sin perfil ──────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#0B1F3A] p-8 sm:p-14 text-center">
            <div className="gl-float absolute top-0 right-0 w-72 h-72 gl-gradient opacity-15 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="gl-float absolute bottom-0 left-0 w-56 h-56 bg-[#12C2A8] opacity-10 rounded-full blur-3xl" style={{ animationDelay: '-3s' }} />
            <div className="relative z-10">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Bienvenido a GrowLink</span>
              <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mt-3 mb-4 leading-tight">
                Hola, {currentUser.name.split(' ')[0]}.<br />Aún no tienes un camino trazado.
              </h1>
              <p className="text-[#8BA5C2] text-base sm:text-lg max-w-xl mx-auto mb-10">
                Cuéntanos tus metas, tus intereses y tu nivel — en 3 pasos generamos un roadmap de cursos hecho para ti.
              </p>
              <div className="max-w-lg mx-auto mb-10">
                <CheckpointPath checkpoints={CHECKPOINTS} completedCount={0} variant="dark" />
              </div>
              <Button variant="gradient" size="lg" onClick={() => navigate('onboarding')}>
                Completar mi perfil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VARIANT 2: perfil listo, roadmap sin generar ──────────
  if (!roadmap) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="text-center mb-10">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Perfil completo</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 mb-3">
              Todo listo, {currentUser.name.split(' ')[0]}.
            </h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] max-w-lg mx-auto">
              Ya tenemos tus metas, intereses y nivel. Genera tu roadmap para ver el camino de cursos recomendado.
            </p>
          </div>

          <div className="max-w-lg mx-auto mb-10 px-2">
            <CheckpointPath checkpoints={CHECKPOINTS} completedCount={3} />
          </div>

          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Tu perfil</h2>
              <button onClick={() => navigate('onboarding')} className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer">
                Editar
              </button>
            </div>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed mb-4">{profile.goals}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.interests.map((i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254]">
                  {i}
                </span>
              ))}
            </div>
            <span className="inline-flex text-xs font-bold px-2.5 py-1 rounded-full bg-[#12C2A8]/10 text-[#0F766E] dark:text-[#2DD4BF] border border-[#12C2A8]/30 capitalize">
              Nivel {profile.level}
            </span>
          </div>

          <div className="text-center">
            <Button variant="gradient" size="lg" onClick={() => { generateRoadmap(currentUser.id); navigate('roadmap'); }}>
              Generar mi roadmap con IA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VARIANT 3: roadmap generado ───────────────────────────
  const totalNodes = roadmap.nodes.length;
  const completedNodes = roadmap.nodes.filter((n) => n.status === 'completed').length;
  const progressPct = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  const currentNode = roadmap.nodes.find((n) => n.status === 'current');
  const currentCourse = currentNode ? courses.find((c) => c.id === currentNode.courseId) : undefined;
  const stale = roadmapHasStaleCourse(currentUser.id);

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />

      <div className="bg-[#0B1F3A] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 gl-gradient opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#12C2A8] opacity-5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Tu roadmap</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mt-3 leading-tight max-w-2xl">
            Hola, {currentUser.name.split(' ')[0]} — vas al {progressPct}% de tu camino.
          </h1>
          <div className="mt-6 max-w-md">
            <ProgressBar value={progressPct} size="md" variant="gradient" />
            <p className="text-xs text-[#8BA5C2] mt-2 font-mono">{completedNodes} de {totalNodes} cursos completados</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {stale && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#3A2A0D] p-5">
            <div>
              <p className="font-display font-bold text-[#B45309] dark:text-[#FBBF24]">Tu roadmap tiene un curso que ya no está disponible</p>
              <p className="text-sm text-[#92601C] dark:text-[#F3D08A] mt-1">Regenera tu roadmap para reemplazarlo por una alternativa activa.</p>
            </div>
            <Button variant="secondary" onClick={() => generateRoadmap(currentUser.id)} className="self-start sm:self-auto shrink-0">
              Regenerar roadmap
            </Button>
          </div>
        )}

        <HorizontalTabs tabs={HOME_TABS} active={activeTab} onChange={(k) => setActiveTab(k as typeof activeTab)} className="mb-6" />

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          <div className="space-y-6">
            {activeTab === 'roadmap' && (currentCourse ? (
              <div className="gl-glow-teal relative overflow-hidden rounded-2xl bg-[#0B1F3A] p-6 sm:p-8">
                <div className="gl-float absolute top-0 right-0 w-56 h-56 gl-gradient opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase text-[#4CE07E] mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4CE07E] live-pulse" />
                    Curso actual en tu roadmap
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-snug mb-2">{currentCourse.title}</h2>
                  <p className="text-[#8BA5C2] text-sm leading-relaxed mb-5 max-w-xl">{currentCourse.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentCourse.skills.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">{s}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="gradient" onClick={() => navigate('course-detail', { id: currentCourse.id })}>
                      Ir al curso
                    </Button>
                    <Button variant="ghost" className="!text-[#8BA5C2] hover:!text-white hover:!bg-white/10" onClick={() => navigate('roadmap')}>
                      Ver roadmap completo
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-8 text-center">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-2">¡Completaste todos los cursos disponibles!</p>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-4">Explora el catálogo o amplía tus intereses para seguir avanzando.</p>
                <Button variant="gradient" onClick={() => navigate('catalog')}>Ver catálogo</Button>
              </div>
            ))}

            {activeTab === 'catalog' && (
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Recomendados para ti</h2>
                  <button onClick={() => navigate('catalog')} className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer">Ver catálogo completo</button>
                </div>
                <div className="space-y-2.5">
                  {[...courses]
                    .filter((c) => c.status === 'active')
                    .sort((a, b) => getRelevance(b, currentUser.id) - getRelevance(a, currentUser.id))
                    .slice(0, 4)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate('course-detail', { id: c.id })}
                        className="w-full flex items-center justify-between gap-3 py-2.5 border-b border-[#EEF2F6] dark:border-[#1C3254] last:border-0 text-left cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] group-hover:text-[#1E73E8] transition-colors truncate">{c.title}</p>
                          <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{c.category} · {c.level}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#12C2A8] shrink-0">{getRelevance(c, currentUser.id)}%</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'trivia' && (
              <div className="relative overflow-hidden rounded-2xl bg-[#0B1F3A] p-6 sm:p-8">
                <div className="gl-float absolute top-0 right-0 w-56 h-56 gl-gradient opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10">
                  <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Modo competitivo</span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white leading-snug mt-2 mb-2">Refuerza lo aprendido en salas de trivia</h2>
                  <p className="text-[#8BA5C2] text-sm leading-relaxed mb-6 max-w-xl">
                    Crea una sala o únete con un código, elige categoría y compite en tiempo real contra otros usuarios.
                  </p>
                  <Button variant="gradient" onClick={() => navigate('trivia')}>Ir a trivia</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => navigate('catalog')} className="gl-card-hover text-left bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 cursor-pointer">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Catálogo de cursos</p>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Explora todo lo disponible por categoría y nivel</p>
              </button>
              <button onClick={() => navigate('trivia')} className="gl-card-hover text-left bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 cursor-pointer">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Trivia por salas</p>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Compite en tiempo real y refuerza lo aprendido</p>
              </button>
              <button onClick={() => navigate('completed-courses')} className="gl-card-hover text-left bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 cursor-pointer">
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Historial de completados</p>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">{myCompletions.length} curso{myCompletions.length !== 1 ? 's' : ''} completado{myCompletions.length !== 1 ? 's' : ''}</p>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Tu perfil</p>
              <p className="text-sm text-[#0B1F3A] dark:text-[#E2EBF6] leading-relaxed mb-3">{profile.goals}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.interests.map((i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">{i}</span>
                ))}
              </div>
              <button onClick={() => navigate('onboarding')} className="text-xs text-[#1E73E8] font-semibold hover:underline cursor-pointer">Editar perfil</button>
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Últimos completados</p>
              {myCompletions.length === 0 ? (
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Aún no completas cursos.</p>
              ) : (
                <div className="space-y-2.5">
                  {[...myCompletions].reverse().slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] truncate">{c.courseTitle}</p>
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
