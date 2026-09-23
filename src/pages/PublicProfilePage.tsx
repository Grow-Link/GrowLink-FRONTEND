import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

export default function PublicProfilePage() {
  const { currentUser, navigate } = useNavigation();
  const { profiles, roadmaps, completions, courses, triviaQuestions } = useAppData();

  if (!currentUser) return null;
  const initials = currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const profile = profiles[currentUser.id];
  const roadmap = roadmaps[currentUser.id];
  const myCompletions = completions.filter((c) => c.userId === currentUser.id);
  const myCourses = courses.filter((c) => c.publisherId === currentUser.id);
  const myQuestions = triviaQuestions.filter((q) => q.publisherId === currentUser.id);

  const roadmapProgress = roadmap ? Math.round((roadmap.nodes.filter((n) => n.status === 'completed').length / Math.max(1, roadmap.nodes.length)) * 100) : 0;
  const unlockedSkills = [...new Set(myCompletions.flatMap((c) => c.skillsUnlocked))];

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />

      <div className="bg-[#0B1F3A] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 gl-gradient opacity-10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/3" />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gl-gradient flex items-center justify-center text-white text-2xl sm:text-3xl font-display font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">Tu perfil</span>
              </div>
              <p className="text-[#8BA5C2] mb-4">{currentUser.headline}{currentUser.org ? ` · ${currentUser.org}` : ''}</p>

              {currentUser.role === 'user' ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-white">{myCompletions.length}</p>
                    <p className="text-xs text-[#8BA5C2]">Cursos completados</p>
                  </div>
                  <div className="w-px h-8 bg-white/20 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-white">{roadmapProgress}%</p>
                    <p className="text-xs text-[#8BA5C2]">Progreso de roadmap</p>
                  </div>
                  <div className="w-px h-8 bg-white/20 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-white capitalize">{profile?.level ?? '—'}</p>
                    <p className="text-xs text-[#8BA5C2]">Nivel</p>
                  </div>
                </div>
              ) : currentUser.role === 'publisher' ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-white">{myCourses.filter((c) => c.status === 'active').length}</p>
                    <p className="text-xs text-[#8BA5C2]">Cursos activos</p>
                  </div>
                  <div className="w-px h-8 bg-white/20 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-white">{myQuestions.length}</p>
                    <p className="text-xs text-[#8BA5C2]">Preguntas de trivia</p>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-[#8BA5C2]">Cuenta de administración de plataforma</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          <div className="space-y-6">
            {currentUser.role === 'user' && (
              <>
                <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
                  <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Meta</h2>
                  {profile ? (
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed">{profile.goals}</p>
                  ) : (
                    <button onClick={() => navigate('onboarding')} className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer">
                      Completar mi perfil
                    </button>
                  )}
                </div>

                {profile && (
                  <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
                    <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Intereses</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254]">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
                  <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Habilidades desbloqueadas</h2>
                  {unlockedSkills.length === 0 ? (
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Completa cursos para desbloquear habilidades.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {unlockedSkills.map((s) => (
                        <span key={s} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {currentUser.role === 'publisher' && (
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Cursos publicados</h2>
                {myCourses.length === 0 ? (
                  <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Aún no publicas cursos.</p>
                ) : (
                  <div className="space-y-2.5">
                    {myCourses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate('course-detail', { id: c.id })}
                        className="w-full flex items-center justify-between py-2.5 border-b border-[#DDE4ED] dark:border-[#1C3254] last:border-0 text-left cursor-pointer group"
                      >
                        <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] group-hover:text-[#1E73E8] transition-colors">{c.title}</p>
                        <span className={`text-xs font-semibold ${c.status === 'active' ? 'text-[#15803D] dark:text-[#4CE07E]' : 'text-[#DC2626] dark:text-[#F87171]'}`}>
                          {c.status === 'active' ? 'Activo' : 'De baja'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {currentUser.role === 'user' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Progreso de roadmap</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">Completado</span>
                  <span className="font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{roadmapProgress}%</span>
                </div>
                <ProgressBar value={roadmapProgress} size="md" variant="gradient" />
              </div>

              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Estadísticas</p>
                <div className="space-y-3">
                  {[
                    { label: 'Cursos completados', value: String(myCompletions.length) },
                    { label: 'Habilidades', value: String(unlockedSkills.length) },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{stat.label}</p>
                      <p className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
