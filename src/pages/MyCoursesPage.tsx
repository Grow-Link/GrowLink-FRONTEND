import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CourseCard from '../components/CourseCard';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import type { Course } from '../types';

export default function MyCoursesPage() {
  const { navigate, currentUser } = useNavigation();
  const { courses, setCourseStatus } = useAppData();
  const [confirmTarget, setConfirmTarget] = useState<Course | null>(null);

  if (!currentUser) return null;
  const myCourses = courses.filter((c) => c.publisherId === currentUser.id);
  const activeCount = myCourses.filter((c) => c.status === 'active').length;

  function handleConfirmDeactivate() {
    if (confirmTarget) setCourseStatus(confirmTarget.id, 'inactive');
    setConfirmTarget(null);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel publicador</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Mis cursos</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">{activeCount} activo{activeCount !== 1 ? 's' : ''} de {myCourses.length} publicado{myCourses.length !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="gradient" onClick={() => navigate('publish-course')} className="self-start sm:self-auto">
            + Publicar curso
          </Button>
        </div>

        {myCourses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl gl-gradient flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1.5">Aún no has publicado cursos</p>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-6 max-w-sm mx-auto">Comparte tu conocimiento — publica tu primer curso y aparecerá en el catálogo y en los roadmaps de los usuarios interesados.</p>
            <Button variant="gradient" onClick={() => navigate('publish-course')}>Publicar mi primer curso</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showRelevance={false}
                onSelect={() => navigate('course-detail', { id: course.id })}
                actions={[
                  { label: 'Editar', onClick: () => navigate('publish-course', { id: course.id }) },
                  course.status === 'active'
                    ? { label: 'Dar de baja', onClick: () => setConfirmTarget(course) }
                    : { label: 'Reactivar', variant: 'primary', onClick: () => setCourseStatus(course.id, 'active') },
                ]}
              />
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmTarget(null)} />
          <div className="relative bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">¿Dar de baja este curso?</h3>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-6 leading-relaxed">
              <span className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{confirmTarget.title}</span> dejará de aparecer en el catálogo. Los usuarios que ya lo completaron conservarán su registro. No se elimina, puedes reactivarlo cuando quieras.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmTarget(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleConfirmDeactivate}>Dar de baja</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
