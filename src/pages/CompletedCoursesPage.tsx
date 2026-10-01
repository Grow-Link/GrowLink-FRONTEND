import Navbar from '../components/Navbar';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

export default function CompletedCoursesPage() {
  const { navigate, currentUser } = useNavigation();
  const { completions, getCourse } = useAppData();

  if (!currentUser) return null;
  const mine = [...completions.filter((c) => c.userId === currentUser.id)].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const allSkills = [...new Set(mine.flatMap((c) => c.skillsUnlocked))];

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Historial</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Cursos completados</h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">{mine.length} curso{mine.length !== 1 ? 's' : ''} completado{mine.length !== 1 ? 's' : ''} en total.</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 lg:items-start">
          <div>
            {mine.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl">
                <p className="text-lg font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1.5">Aún no completas cursos</p>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-6">Cuando marques un curso como completado, aparecerá aquí para siempre.</p>
                <button onClick={() => navigate('catalog')} className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer">Explorar catálogo</button>
              </div>
            ) : (
              <div className="space-y-3">
                {mine.map((c) => {
                  const course = getCourse(c.courseId);
                  const isStale = !course || course.status !== 'active';
                  return (
                    <div key={c.id} className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 flex flex-wrap items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#4CE07E]/15 border border-[#4CE07E]/30 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#15803D] dark:text-[#4CE07E]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-[10rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => course && navigate('course-detail', { id: course.id })}
                            disabled={!course}
                            className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] hover:text-[#1E73E8] transition-colors text-left cursor-pointer disabled:cursor-default disabled:hover:text-[#0B1F3A]"
                          >
                            {c.courseTitle}
                          </button>
                          {isStale && (
                            <span className="text-[10px] font-bold text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#3A2A0D] border border-[#F59E0B]/40 px-1.5 py-0.5 rounded-md">
                              Ya no disponible
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{c.category}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {c.skillsUnlocked.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">{s}</span>
                        ))}
                      </div>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono shrink-0 ml-auto">
                        {new Date(c.completedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#0B1F3A] rounded-2xl p-5 relative overflow-hidden lg:sticky lg:top-24">
            <div className="absolute top-0 right-0 w-32 h-32 gl-gradient opacity-10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Habilidades desbloqueadas</p>
              {allSkills.length === 0 ? (
                <p className="text-sm text-[#8BA5C2]">Aún ninguna.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">{s}</span>
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
