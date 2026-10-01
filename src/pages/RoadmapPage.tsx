import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import RoadmapGraph from '../components/RoadmapGraph';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

export default function RoadmapPage() {
  const { navigate, currentUser } = useNavigation();
  const { profiles, roadmaps, courses, generateRoadmap, roadmapHasStaleCourse } = useAppData();
  const [regenerating, setRegenerating] = useState(false);

  if (!currentUser) return null;
  const profile = profiles[currentUser.id];
  const roadmap = roadmaps[currentUser.id];

  if (!profile || !roadmap) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">Aún no tienes un roadmap</h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mb-6">Completa tu perfil primero para que podamos generar tu camino de cursos.</p>
          <Button variant="gradient" onClick={() => navigate('onboarding')}>Completar mi perfil</Button>
        </div>
      </div>
    );
  }

  const totalNodes = roadmap.nodes.length;
  const completedCount = roadmap.nodes.filter((n) => n.status === 'completed').length;
  const currentNode = roadmap.nodes.find((n) => n.status === 'current');
  const currentCourse = currentNode ? courses.find((c) => c.id === currentNode.courseId) : undefined;
  const progressPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  const stale = roadmapHasStaleCourse(currentUser.id);

  function handleRegenerate() {
    setRegenerating(true);
    setTimeout(() => {
      generateRoadmap(currentUser!.id);
      setRegenerating(false);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Roadmap generado por IA</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 leading-tight">
              Tu camino de aprendizaje
            </h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-2">
              Basado en tus metas, intereses y nivel · {totalNodes} cursos en el camino
            </p>
          </div>
          <Button variant="secondary" onClick={handleRegenerate} disabled={regenerating} className="self-start">
            {regenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Regenerando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerar con IA
              </>
            )}
          </Button>
        </div>

        {stale && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#3A2A0D] p-5">
            <div>
              <p className="font-display font-bold text-[#B45309] dark:text-[#FBBF24]">Un curso de tu roadmap ya no está disponible</p>
              <p className="text-sm text-[#92601C] dark:text-[#F3D08A] mt-1">Regénéralo para que la IA lo reemplace por una alternativa activa.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 lg:items-start">
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-4 sm:p-6">
            <RoadmapGraph
              nodes={roadmap.nodes}
              edges={roadmap.edges}
              courses={courses}
              onSelectCourse={(id) => navigate('course-detail', { id })}
            />
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-[#0B1F3A] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 gl-gradient opacity-10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Progreso del camino</p>
                <p className="text-3xl font-mono font-bold text-white mb-3">{progressPct}%</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full gl-gradient" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-[#8BA5C2] font-mono">{completedCount} de {totalNodes} completados</p>
              </div>
            </div>

            {currentCourse && (
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Estás aquí</p>
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">{currentCourse.title}</p>
                <Button variant="gradient" size="sm" className="w-full" onClick={() => navigate('course-detail', { id: currentCourse.id })}>
                  Ir al curso
                </Button>
              </div>
            )}

            <button
              onClick={() => navigate('catalog')}
              className="gl-card-hover w-full text-left bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 cursor-pointer"
            >
              <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Catálogo general</p>
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Explora todos los cursos por categoría y nivel</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
