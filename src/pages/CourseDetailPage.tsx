import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CategoryGlyph from '../components/CategoryGlyph';
import ExamModal from '../components/ExamModal';
import { useNavigation } from '../store/NavigationContext';
import { darDeBajaCurso, listarCompletados, obtenerCurso } from '../services/cursosServiceApi';
import { fetchRoadmap } from '../services/roadmapApi';
import { nombresDePersonas } from '../services/usuariosServiceApi';
import type { Course } from '../types';
import type { RoadmapNode } from '../utils/roadmapModel';

const NIVEL_TEXTO: Record<Course['level'], string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

const page = 'min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]';
const card = 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl';

// La ficha de un curso: qué se ve (temario), qué se necesita antes, dónde estudiarlo y cómo completarlo. La única
// forma de completarlo es aprobar su examen, así que no hay un botón de "marcar como completado".
export default function CourseDetailPage() {
  const { paramId, navigate, goBack, canGoBack, currentUser } = useNavigation();
  const rol = currentUser?.role;

  const [curso, setCurso] = useState<Course | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [prerequisitos, setPrerequisitos] = useState<Course[]>([]);
  const [aprobados, setAprobados] = useState<Set<string>>(new Set());
  const [nodoRoadmap, setNodoRoadmap] = useState<RoadmapNode | null>(null);
  const [examenAbierto, setExamenAbierto] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [nombres, setNombres] = useState<Map<string, string>>(new Map());
  const [bajando, setBajando] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);

  useEffect(() => {
    if (!paramId || !currentUser) return;
    let ignorar = false;
    setError(null);
    nombresDePersonas().then((m) => !ignorar && setNombres(m));
    obtenerCurso(paramId)
      .then(async (c) => {
        if (ignorar) return;
        setCurso(c);
        if (!c) return;
        const previos = await Promise.allSettled(c.prerequisites.map((id) => obtenerCurso(id)));
        if (ignorar) return;
        setPrerequisitos(previos.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : [])));

        if (rol === 'user') {
          const [completados, vista] = await Promise.all([listarCompletados(Number(currentUser.id)), fetchRoadmap().catch(() => null)]);
          if (ignorar) return;
          setAprobados(new Set(completados.map((x) => String(x.cursoId))));
          setNodoRoadmap(vista?.nodes.find((n) => String(n.cursoId) === c.id) ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!ignorar) setError(err instanceof Error ? err.message : 'No se pudo cargar el curso.');
      });
    return () => {
      ignorar = true;
    };
  }, [paramId, currentUser, rol, recarga]);

  if (!currentUser) return null;

  const volver = () => (canGoBack ? goBack() : navigate(rol === 'publisher' ? 'my-courses' : rol === 'admin' ? 'admin-courses' : 'catalog'));

  if (error) {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">No pudimos cargar el curso</h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
            <Button variant="ghost" onClick={volver}>Volver</Button>
          </div>
        </div>
      </div>
    );
  }

  if (curso === undefined) {
    return (
      <div className={page}>
        <Navbar />
        <p className="text-center text-sm text-[#6B7A74] dark:text-[#98B0A6] py-24">Cargando curso…</p>
      </div>
    );
  }

  if (curso === null) {
    return (
      <div className={page}>
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">Ese curso no existe</h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">Puede que haya sido eliminado o que el enlace esté mal.</p>
          <Button variant="primary" onClick={volver}>Volver</Button>
        </div>
      </div>
    );
  }

  const aprobado = aprobados.has(curso.id);
  const inactivo = curso.status === 'inactive';
  const esDueno = rol === 'publisher' && curso.publisherId === currentUser.id;
  const puedeDarDeBaja = !inactivo && (esDueno || rol === 'admin');
  const previosPendientes = prerequisitos.filter((p) => !aprobados.has(p.id));
  const tieneExamen = (curso.examQuestions ?? 0) > 0;

  async function darDeBaja() {
    setBajando(true);
    setErrorBaja(null);
    try {
      await darDeBajaCurso(curso!.id);
      setConfirmarBaja(false);
      setRecarga((k) => k + 1);
    } catch (err) {
      setErrorBaja(err instanceof Error ? err.message : 'No se pudo dar de baja el curso.');
    } finally {
      setBajando(false);
    }
  }

  return (
    <div className={page}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button type="button" onClick={volver} className="text-sm font-medium text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#0E8A7D] dark:hover:text-[#5FD3C2] mb-4 cursor-pointer">
          ← Volver
        </button>

        <section className="rounded-3xl overflow-hidden border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F]">
          <div className="relative h-28 sm:h-36">
            <CategoryGlyph category={curso.category} className="w-full h-full" />
          </div>
          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#12C2A8]/12 text-[#0B6F65] dark:text-[#5FD3C2]">{curso.category}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EDF1EA] dark:bg-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9]">{NIVEL_TEXTO[curso.level]}</span>
              {aprobado && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#4CE07E] text-[#0F3D22]">✓ Aprobado</span>}
              {nodoRoadmap && !aprobado && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5A524] text-white">En tu roadmap</span>}
              {inactivo && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626]">Dado de baja</span>}
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight">{curso.title}</h1>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 mt-5">
              <Dato etiqueta="Duración" valor={curso.durationHours != null ? `${curso.durationHours} horas` : 'No indicada'} />
              <Dato etiqueta="Temario" valor={`${curso.syllabus?.length ?? 0} temas`} />
              <Dato etiqueta="Examen" valor={tieneExamen ? `${curso.examQuestions} preguntas` : 'Aún sin examen'} />
              <Dato etiqueta="Publicado por" valor={nombres.get(curso.publisherId) ?? curso.publisherName} />
            </dl>
          </div>
        </section>

        {inactivo && (
          <div role="alert" className="mt-4 rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] px-4 py-3 text-sm text-[#DC2626] dark:text-[#F87171]">
            Este curso fue dado de baja: ya no aparece en el catálogo ni se recomienda en los roadmaps nuevos.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6 items-start">
          <div className="space-y-6">
            {nodoRoadmap?.razon && (
              <section className="rounded-2xl bg-[#FBF3E4] dark:bg-[#3A2A0D]/50 border border-[#F5A524]/30 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#B45309] dark:text-[#FBBF24]">Por qué está en tu ruta</h2>
                <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1.5 leading-relaxed">{nodoRoadmap.razon}</p>
              </section>
            )}

            <section className={`${card} p-5 sm:p-6`}>
              <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">De qué trata</h2>
              <p className="text-sm sm:text-base text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed">{curso.description || 'El publicador aún no agregó una descripción.'}</p>
            </section>

            <section className={`${card} p-5 sm:p-6`}>
              <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">Temario</h2>
              {curso.syllabus && curso.syllabus.length > 0 ? (
                <ol className="space-y-2.5">
                  {curso.syllabus.map((tema, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-[#12C2A8]/15 text-[#0B6F65] dark:text-[#5FD3C2] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm sm:text-base text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{tema}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">El publicador todavía no cargó el temario.</p>
              )}
            </section>

            {curso.skills.length > 0 && (
              <section className={`${card} p-5 sm:p-6`}>
                <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">Habilidades que desbloqueas</h2>
                <div className="flex flex-wrap gap-2">
                  {curso.skills.map((h) => (
                    <span key={h} className="px-3 py-1 rounded-full text-sm bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">{h}</span>
                  ))}
                </div>
              </section>
            )}

            {prerequisitos.length > 0 && (
              <section className={`${card} p-5 sm:p-6`}>
                <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] mb-1">Conviene saber antes</h2>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-3">Estos cursos preparan el terreno para este.</p>
                <ul className="space-y-2">
                  {prerequisitos.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => navigate('course-detail', { id: p.id })} className="w-full flex items-center gap-3 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] px-3.5 py-2.5 text-left hover:border-[#12C2A8] transition-colors cursor-pointer">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${aprobados.has(p.id) ? 'bg-[#4CE07E] text-white' : 'bg-[#EDF1EA] dark:bg-[#27403A] text-[#6B7A74]'}`}>
                          {aprobados.has(p.id) ? '✓' : '○'}
                        </span>
                        <span className="flex-1 text-sm font-medium text-[#1F2D2A] dark:text-[#E6EFE9]">{p.title}</span>
                        <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{NIVEL_TEXTO[p.level]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className={`${card} p-5 lg:sticky lg:top-20 space-y-3`} aria-label="Acciones del curso">
            {rol === 'user' && (
              <>
                {aprobado ? (
                  <div className="rounded-xl bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E] px-3.5 py-3 text-sm font-semibold">✓ Ya aprobaste este curso.</div>
                ) : (
                  <>
                    <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed">
                      Estudia el contenido y, cuando estés listo, presenta el examen. Con {70}% o más, el curso queda completado.
                    </p>
                    {previosPendientes.length > 0 && (
                      <p className="text-xs rounded-lg bg-[#FBF3E4] dark:bg-[#3A2A0D]/50 text-[#B45309] dark:text-[#FBBF24] px-3 py-2">
                        Te recomendamos aprobar antes: {previosPendientes.map((p) => p.title).join(', ')}.
                      </p>
                    )}
                  </>
                )}
                {curso.contentUrl && !inactivo && (
                  <a href={curso.contentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0E8A7D] text-white hover:bg-[#0B7368] transition-colors">
                    Ir al curso ↗
                  </a>
                )}
                {!aprobado && !inactivo && tieneExamen && (
                  <Button className="w-full" variant="gradient" onClick={() => setExamenAbierto(true)}>
                    Presentar examen
                  </Button>
                )}
                {!aprobado && !inactivo && !tieneExamen && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">Este curso aún no tiene examen, así que todavía no se puede completar.</p>}
                {nodoRoadmap && (
                  <Button className="w-full" variant="secondary" onClick={() => navigate('roadmap')}>
                    Ver en mi roadmap
                  </Button>
                )}
              </>
            )}

            {esDueno && (
              <Button className="w-full" variant="primary" onClick={() => navigate('publish-course', { id: curso.id })}>
                Editar curso
              </Button>
            )}
            {puedeDarDeBaja && (
              <>
                {!confirmarBaja ? (
                  <Button className="w-full" variant="danger" onClick={() => setConfirmarBaja(true)}>
                    Dar de baja
                  </Button>
                ) : (
                  <div className="rounded-xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-3">
                    <p className="text-xs text-[#DC2626] dark:text-[#F87171]">Saldrá del catálogo y dejará de recomendarse. Las personas que ya lo aprobaron lo conservan en su historial.</p>
                    <div className="flex gap-2 mt-2.5">
                      <Button size="sm" variant="danger" onClick={darDeBaja} disabled={bajando}>{bajando ? 'Dando de baja…' : 'Sí, dar de baja'}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmarBaja(false)} disabled={bajando}>Cancelar</Button>
                    </div>
                  </div>
                )}
                {errorBaja && <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171]">{errorBaja}</p>}
              </>
            )}
          </aside>
        </div>
      </main>

      {examenAbierto && (
        <ExamModal
          cursoId={curso.id}
          titulo={curso.title}
          linkContenido={curso.contentUrl}
          onClose={() => setExamenAbierto(false)}
          onApproved={() => setRecarga((k) => k + 1)}
        />
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6]">{etiqueta}</dt>
      <dd className="text-sm sm:text-base font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{valor}</dd>
    </div>
  );
}
