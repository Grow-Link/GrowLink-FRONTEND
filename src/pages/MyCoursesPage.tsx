import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { darDeBajaCurso, listarPorPublicador } from '../services/cursosServiceApi';
import type { Course } from '../types';

const NIVEL_TEXTO: Record<Course['level'], string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const card = 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl';

// HU-07: el panel del publicador. Los publicadores gestionan sus cursos; el roadmap es para quienes aprenden.
export default function MyCoursesPage() {
  const { navigate, currentUser } = useNavigation();
  const [cursos, setCursos] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [aBajar, setABajar] = useState<Course | null>(null);
  const [bajando, setBajando] = useState(false);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    setError(null);
    listarPorPublicador(Number(currentUser.id))
      .then((c) => {
        if (!ignorar) setCursos(c);
      })
      .catch((e: unknown) => {
        if (!ignorar) setError(e instanceof Error ? e.message : 'No se pudieron cargar tus cursos.');
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser, recarga]);

  if (!currentUser) return null;
  const activos = (cursos ?? []).filter((c) => c.status === 'active').length;

  async function confirmarBaja() {
    if (!aBajar) return;
    setBajando(true);
    setErrorBaja(null);
    try {
      await darDeBajaCurso(aBajar.id);
      setABajar(null);
      setRecarga((k) => k + 1);
    } catch (e) {
      setErrorBaja(e instanceof Error ? e.message : 'No se pudo dar de baja el curso.');
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel publicador</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Mis cursos</h1>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">
              {cursos ? `${activos} activo${activos !== 1 ? 's' : ''} de ${cursos.length} publicado${cursos.length !== 1 ? 's' : ''}` : 'Cargando…'}
            </p>
          </div>
          <Button variant="gradient" onClick={() => navigate('publish-course')} className="self-start sm:self-auto">
            + Publicar curso
          </Button>
        </div>

        <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-6 rounded-xl bg-[#12C2A8]/8 border border-[#12C2A8]/20 px-4 py-3">
          Lo que publiques aparece en el catálogo y se recomienda en los roadmaps de las personas que aprenden. Si das de baja un curso, deja de recomendarse.
          Los roadmaps son para quienes estudian: como publicador tú gestionas contenido, y puedes jugar trivia como cualquiera.
        </p>

        {error ? (
          <div role="alert" className="rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-6 text-center">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
          </div>
        ) : cursos === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className={`${card} h-24 animate-pulse`} />)}
          </div>
        ) : cursos.length === 0 ? (
          <div className={`text-center py-16 ${card}`}>
            <p className="text-lg font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1.5">Aún no has publicado cursos</p>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-6 max-w-sm mx-auto">Publica tu primer curso con su temario y su examen: aparecerá en el catálogo y en los roadmaps de quienes lo necesiten.</p>
            <Button variant="gradient" onClick={() => navigate('publish-course')}>Publicar mi primer curso</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {cursos.map((c) => (
              <li key={c.id} className={`${card} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${c.status === 'inactive' ? 'opacity-70' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => navigate('course-detail', { id: c.id })} className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] hover:text-[#0E8A7D] text-left cursor-pointer">
                      {c.title}
                    </button>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.status === 'active' ? 'bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E]' : 'bg-[#FEF2F2] dark:bg-[#2A1111] text-[#DC2626] dark:text-[#F87171]'}`}>
                      {c.status === 'active' ? 'Activo' : 'Dado de baja'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">
                    {c.category} · {NIVEL_TEXTO[c.level]}
                    {c.durationHours != null && ` · ${c.durationHours} h`} · {c.syllabus?.length ?? 0} temas ·{' '}
                    {(c.examQuestions ?? 0) > 0 ? `examen de ${c.examQuestions} preguntas` : 'sin examen'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => navigate('course-detail', { id: c.id })}>Ver ficha</Button>
                  {c.status === 'active' && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => navigate('publish-course', { id: c.id })}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => setABajar(c)}>Dar de baja</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {aBajar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirmar baja">
          <div className="absolute inset-0 bg-black/50" onClick={() => !bajando && setABajar(null)} />
          <div className="relative bg-white dark:bg-[#15231F] rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">¿Dar de baja este curso?</h3>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5 leading-relaxed">
              <span className="font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{aBajar.title}</span> saldrá del catálogo y dejará de recomendarse en los roadmaps.
              Quienes ya lo aprobaron conservan su registro. No se puede reactivar desde aquí.
            </p>
            {errorBaja && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{errorBaja}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setABajar(null)} disabled={bajando}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={confirmarBaja} disabled={bajando}>{bajando ? 'Dando de baja…' : 'Dar de baja'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
