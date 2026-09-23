import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Tooltip from '../components/Tooltip';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

const LEVEL_LABEL: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const LEVEL_VARIANT: Record<string, 'success' | 'info' | 'warning'> = { principiante: 'success', intermedio: 'info', avanzado: 'warning' };

export default function CourseDetailPage() {
  const { navigate, paramId, currentUser } = useNavigation();
  const { getCourse, courses, completions, completeCourse, isCourseCompleted } = useAppData();

  const course = paramId ? getCourse(paramId) : undefined;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">Curso no encontrado</h1>
          <Button variant="gradient" onClick={() => navigate('catalog')}>Volver al catálogo</Button>
        </div>
      </div>
    );
  }

  const isUser = currentUser?.role === 'user';
  const alreadyCompleted = currentUser ? isCourseCompleted(currentUser.id, course.id) : false;
  const prereqCourses = course.prerequisites.map((id) => courses.find((c) => c.id === id)).filter(Boolean) as typeof courses;
  const completedIds = new Set(completions.filter((c) => c.userId === currentUser?.id).map((c) => c.courseId));
  const allPrereqsDone = prereqCourses.every((p) => completedIds.has(p.id));
  const completionRecord = completions.find((c) => c.userId === currentUser?.id && c.courseId === course.id);

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-8 lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="default">{course.category}</Badge>
              <Badge variant={LEVEL_VARIANT[course.level]}>{LEVEL_LABEL[course.level]}</Badge>
              {course.status === 'inactive' && <Badge variant="danger">Dado de baja por el publicador</Badge>}
              {alreadyCompleted && <Badge variant="success">Completado</Badge>}
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-tight mb-4">{course.title}</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-base leading-relaxed mb-6 max-w-2xl">{course.description}</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {course.skills.map((skill) => (
                <span key={skill} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F2240] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254] font-medium">
                  {skill}
                </span>
              ))}
            </div>

            {/* Prerequisites */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6 mb-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Prerequisitos</h2>
              {prereqCourses.length === 0 ? (
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Este curso no requiere cursos previos.</p>
              ) : (
                <div className="space-y-2.5">
                  {prereqCourses.map((p) => {
                    const done = completedIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate('course-detail', { id: p.id })}
                        className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] text-left cursor-pointer hover:border-[#1E73E8]/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Tooltip title={p.title} description={p.description}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-[#4CE07E] text-white' : 'bg-[#DDE4ED] dark:bg-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
                              {done ? (
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              )}
                            </span>
                          </Tooltip>
                          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] truncate">{p.title}</p>
                        </div>
                        <span className={`text-xs font-semibold shrink-0 ${done ? 'text-[#15803D] dark:text-[#4CE07E]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
                          {done ? 'Completado' : 'Pendiente'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-1">Publicado por</p>
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{course.publisherName}</p>
              </div>
              <a
                href={course.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254] hover:bg-[#EEF2F6] dark:hover:bg-[#1C3254] transition-all"
              >
                Ir al contenido del curso
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {isUser && (
                alreadyCompleted ? (
                  <div className="text-center py-2.5 rounded-xl bg-[#F0FDF4] dark:bg-[#0D2E1A] border border-[#BBF7D0] dark:border-[#166534]">
                    <p className="text-sm font-semibold text-[#15803D] dark:text-[#4CE07E]">
                      Completado el {completionRecord && new Date(completionRecord.completedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => currentUser && completeCourse(currentUser.id, course.id)}
                    >
                      Marcar como completado
                    </Button>
                    {!allPrereqsDone && prereqCourses.length > 0 && (
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-2 text-center">Aún tienes prerequisitos pendientes.</p>
                    )}
                  </div>
                )
              )}
            </div>

            {course.skills.length > 0 && (
              <div className="bg-[#0B1F3A] rounded-2xl p-5">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Habilidades que desbloqueas</p>
                <div className="flex flex-wrap gap-1.5">
                  {course.skills.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white border border-white/10">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
