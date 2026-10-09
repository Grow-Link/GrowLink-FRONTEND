import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import CatalogCard from '../components/CatalogCard';
import { useNavigation } from '../store/NavigationContext';
import {
  actualizarPrerequisitos,
  CATEGORIAS_CURSOS,
  crearCurso,
  editarCurso,
  getHabilidades,
  listarCatalogo,
  obtenerCurso,
  sugerirPrerequisitos,
  type PreguntaExamenInput,
  type PrerequisitoSugerido,
} from '../services/cursosServiceApi';
import type { Course, Level } from '../types';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];
const LEVEL_RANK: Record<Level, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

const MIN_PREGUNTAS = 3;
const MAX_PREGUNTAS = 15;
const MIN_TEMAS = 3;
const MAX_TEMAS = 30;

const card = 'bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6';
const campo =
  'w-full px-3.5 py-2.5 border border-[#E1E6DF] dark:border-[#27403A] rounded-xl text-sm text-[#1F2D2A] dark:text-[#E6EFE9] bg-white dark:bg-[#1A2C27] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] focus:outline-none focus:ring-2 focus:ring-[#0E8A7D]/10 focus:border-[#0E8A7D] transition-all';

interface PreguntaForm {
  enunciado: string;
  opciones: [string, string, string, string];
  correcta: number;
}

const preguntaVacia = (): PreguntaForm => ({ enunciado: '', opciones: ['', '', '', ''], correcta: 0 });

/** Lo que falta o está mal en el examen, con un texto que sirva para corregirlo. Vacío = está bien. */
function problemasDelExamen(preguntas: PreguntaForm[]): string[] {
  const problemas: string[] = [];
  if (preguntas.length < MIN_PREGUNTAS) problemas.push(`Agrega al menos ${MIN_PREGUNTAS} preguntas.`);
  preguntas.forEach((p, i) => {
    const n = i + 1;
    if (p.enunciado.trim().length < 5) problemas.push(`Pregunta ${n}: escribe el enunciado.`);
    const opciones = p.opciones.map((o) => o.trim());
    if (opciones.some((o) => o === '')) problemas.push(`Pregunta ${n}: completa las 4 opciones.`);
    else if (new Set(opciones.map((o) => o.toLowerCase())).size < 4) problemas.push(`Pregunta ${n}: las 4 opciones deben ser distintas.`);
  });
  return problemas;
}

export default function PublishCoursePage() {
  const { navigate, goBack, canGoBack, paramId, currentUser } = useNavigation();

  const [editando, setEditando] = useState<Course | null>(null);
  const [cargandoCurso, setCargandoCurso] = useState(Boolean(paramId));
  const [errorCurso, setErrorCurso] = useState<string | null>(null);
  const esEdicion = Boolean(paramId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIAS_CURSOS[0]);
  const [level, setLevel] = useState<Level>('principiante');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [horas, setHoras] = useState('');
  const [temario, setTemario] = useState<string[]>(['', '', '']);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaForm[]>([preguntaVacia(), preguntaVacia(), preguntaVacia()]);
  const [reemplazarExamen, setReemplazarExamen] = useState(true);

  const [catalogo, setCatalogo] = useState<Course[]>([]);
  const [skillsOptions, setSkillsOptions] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillsReloadKey, setSkillsReloadKey] = useState(0);

  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestModoRespaldo, setSuggestModoRespaldo] = useState<boolean | null>(null);

  const [intento, setIntento] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // el catálogo real, para elegir prerrequisitos entre cursos que existen de verdad
  useEffect(() => {
    listarCatalogo().then(setCatalogo).catch(() => setCatalogo([]));
  }, []);

  // al editar se carga el curso real y se verifica que sea de quien lo edita
  useEffect(() => {
    if (!paramId) return;
    let ignorar = false;
    obtenerCurso(paramId)
      .then((c) => {
        if (ignorar) return;
        if (!c) {
          setErrorCurso('Ese curso no existe.');
          return;
        }
        if (c.publisherId !== currentUser?.id) {
          navigate('my-courses');
          return;
        }
        setEditando(c);
        setTitle(c.title);
        setDescription(c.description);
        setCategory(c.category);
        setLevel(c.level);
        setSelectedSkills(c.skills);
        setContentUrl(c.contentUrl);
        setHoras(c.durationHours != null ? String(c.durationHours) : '');
        setTemario(c.syllabus && c.syllabus.length > 0 ? c.syllabus : ['', '', '']);
        setPrerequisites(c.prerequisites);
        // si ya tiene examen se conserva a menos que se pida reemplazarlo (el servidor no devuelve las respuestas correctas)
        setReemplazarExamen((c.examQuestions ?? 0) === 0);
      })
      .catch((err: unknown) => {
        if (!ignorar) setErrorCurso(err instanceof Error ? err.message : 'No se pudo cargar el curso.');
      })
      .finally(() => {
        if (!ignorar) setCargandoCurso(false);
      });
    return () => {
      ignorar = true;
    };
  }, [paramId, currentUser, navigate]);

  // Catálogo cerrado de habilidades por categoría, desde cursos-service.
  useEffect(() => {
    const controller = new AbortController();
    setSkillsLoading(true);
    setSkillsError(null);
    getHabilidades(category, controller.signal)
      .then((habilidades) => {
        setSkillsOptions(habilidades);
        setSelectedSkills((prev) => prev.filter((s) => habilidades.includes(s)));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSkillsOptions([]);
        setSkillsError(err instanceof Error ? err.message : 'No se pudieron cargar las habilidades.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setSkillsLoading(false);
      });
    return () => controller.abort();
  }, [category, skillsReloadKey]);

  function handleCategoryChange(next: string) {
    setCategory(next);
    setPrerequisites([]);
    setSuggestModoRespaldo(null);
    setSuggestError(null);
  }

  const toggleSkill = (skill: string) => setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const eligiblePrereqs = useMemo(
    () => catalogo.filter((c) => c.id !== editando?.id && c.category === category && LEVEL_RANK[c.level] < LEVEL_RANK[level]),
    [catalogo, editando, category, level]
  );

  async function suggestPrerequisites() {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const { prerequisitos, modoRespaldo }: { prerequisitos: PrerequisitoSugerido[]; modoRespaldo: boolean } = await sugerirPrerequisitos({ categoria: category, nivel: level, titulo: title });
      const ids = new Set(eligiblePrereqs.map((c) => c.id));
      setPrerequisites(prerequisitos.map((p) => p.id).filter((id) => ids.has(id)));
      setSuggestModoRespaldo(modoRespaldo);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'No se pudo contactar a cursos-service.');
    } finally {
      setSuggestLoading(false);
    }
  }

  const togglePrereq = (id: string) => setPrerequisites((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  // ---------------- validación ----------------
  const horasNum = Number(horas);
  const temasLimpios = temario.map((t) => t.trim()).filter(Boolean);
  const examenAEnviar = !esEdicion || reemplazarExamen;
  const problemasExamen = examenAEnviar ? problemasDelExamen(preguntas) : [];

  const problemas: string[] = [];
  if (title.trim().length < 3) problemas.push('Escribe un título.');
  if (description.trim().length < 30) problemas.push('La descripción debe tener al menos 30 caracteres.');
  if (!/^https?:\/\/\S+\.\S+/.test(contentUrl.trim())) problemas.push('El enlace al contenido debe empezar con http:// o https://.');
  if (!Number.isInteger(horasNum) || horasNum < 1 || horasNum > 500) problemas.push('Indica las horas del curso (entre 1 y 500).');
  if (temasLimpios.length < MIN_TEMAS) problemas.push(`El temario necesita al menos ${MIN_TEMAS} temas.`);
  if (selectedSkills.length === 0) problemas.push('Elige al menos una habilidad.');
  problemas.push(...problemasExamen);

  async function handleSubmit() {
    setIntento(true);
    if (!currentUser || problemas.length > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const examen: PreguntaExamenInput[] = preguntas.map((p) => ({
        enunciado: p.enunciado.trim(),
        opciones: p.opciones.map((o) => o.trim()),
        respuestaCorrecta: p.correcta,
      }));
      const prerequisitoIds = prerequisites.map(Number).filter((n) => Number.isFinite(n));
      if (editando) {
        await editarCurso(editando.id, {
          titulo: title.trim(),
          descripcion: description.trim(),
          categoria: category,
          nivel: level,
          habilidades: selectedSkills,
          linkContenido: contentUrl.trim(),
          duracionHoras: horasNum,
          temario: temasLimpios,
          ...(reemplazarExamen ? { examen } : {}),
        });
        await actualizarPrerequisitos(editando.id, prerequisitoIds);
      } else {
        await crearCurso({
          titulo: title.trim(),
          descripcion: description.trim(),
          categoria: category,
          nivel: level,
          habilidades: selectedSkills,
          linkContenido: contentUrl.trim(),
          publicadorUsuarioId: Number(currentUser.id),
          prerequisitoIds,
          duracionHoras: horasNum,
          temario: temasLimpios,
          examen,
        });
      }
      navigate('my-courses', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el curso.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cargandoCurso) {
    return (
      <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
        <Navbar />
        <p className="text-center text-sm text-[#6B7A74] dark:text-[#98B0A6] py-24">Cargando curso…</p>
      </div>
    );
  }

  if (errorCurso) {
    return (
      <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <p className="text-[#DC2626] dark:text-[#F87171] mb-5">{errorCurso}</p>
          <Button variant="secondary" onClick={() => navigate('my-courses')}>Volver a mis cursos</Button>
        </div>
      </div>
    );
  }

  // vista previa: la misma tarjeta que verá el catálogo
  const vistaPrevia: Course = {
    id: 'previa',
    title: title || 'Título del curso',
    description,
    category,
    level,
    skills: selectedSkills,
    contentUrl,
    prerequisites,
    publisherId: currentUser?.id ?? '',
    publisherName: currentUser?.name ?? '',
    status: 'active',
    createdAt: '',
    durationHours: horasNum > 0 ? horasNum : null,
    syllabus: temasLimpios,
    examQuestions: examenAEnviar ? preguntas.length : editando?.examQuestions ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:items-start">
          <div className="space-y-6">
            <div>
              <button type="button" onClick={() => (canGoBack ? goBack() : navigate('my-courses'))} className="text-sm font-medium text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#0E8A7D] mb-3 cursor-pointer">
                ← Volver a mis cursos
              </button>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{esEdicion ? 'Editar curso' : 'Publicar curso'}</h1>
              <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1 text-sm">
                Lo que escribas aquí es lo que verán las personas en el catálogo y en su roadmap: descripción, temario y horas. El examen es lo que permite completar el curso.
              </p>
            </div>

            <div className={`${card} space-y-4`}>
              <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">1. Detalles</h2>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Python desde Cero" />
              <div>
                <label className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] block mb-1.5">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="¿Qué va a aprender la persona y para qué le sirve?" className={`${campo} resize-none`} />
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">{description.trim().length} caracteres (mínimo 30)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] block mb-1.5">Área</label>
                  <select value={category} disabled={esEdicion} onChange={(e) => handleCategoryChange(e.target.value)} className={`${campo} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}>
                    {CATEGORIAS_CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {esEdicion && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">El área no cambia al editar.</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] block mb-1.5">Nivel</label>
                  <select value={level} onChange={(e) => { setLevel(e.target.value as Level); setPrerequisites([]); setSuggestModoRespaldo(null); }} className={`${campo} cursor-pointer`}>
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <Input label="Horas del curso" type="number" min={1} max={500} value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej. 12" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">Habilidades que desbloquea</label>
                  <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{category}</span>
                </div>
                {skillsLoading ? (
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] py-2">Cargando habilidades…</p>
                ) : skillsError ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                    <p className="text-xs text-[#DC2626] dark:text-[#F87171] flex-1">{skillsError}</p>
                    <button type="button" onClick={() => setSkillsReloadKey((k) => k + 1)} className="text-xs font-semibold text-[#DC2626] dark:text-[#F87171] underline cursor-pointer shrink-0">Reintentar</button>
                  </div>
                ) : skillsOptions.length === 0 ? (
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] py-1">No hay habilidades registradas para esta área.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillsOptions.map((skill) => {
                      const marcado = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          aria-pressed={marcado}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                            marcado
                              ? 'bg-[#0E8A7D] text-white border-[#0E8A7D]'
                              : 'bg-white dark:bg-[#1A2C27] text-[#6B7A74] dark:text-[#98B0A6] border-[#E1E6DF] dark:border-[#27403A] hover:border-[#0E8A7D] hover:text-[#0E8A7D]'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Input label="Enlace al contenido" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." hint="Dónde estudia la persona este curso (video, plataforma, documento)." />
            </div>

            <div className={`${card} space-y-3`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">2. Temario</h2>
                <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{temasLimpios.length} {temasLimpios.length === 1 ? 'tema' : 'temas'}</span>
              </div>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Lista, en orden, lo que se ve en el curso. Mínimo {MIN_TEMAS} temas.</p>
              <ol className="space-y-2">
                {temario.map((tema, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-[#12C2A8]/15 text-[#0B6F65] dark:text-[#5FD3C2] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <input value={tema} onChange={(e) => setTemario((prev) => prev.map((t, k) => (k === i ? e.target.value : t)))} placeholder="Ej. Variables y tipos de datos" className={campo} aria-label={`Tema ${i + 1}`} />
                    <button type="button" onClick={() => setTemario((prev) => (prev.length > 1 ? prev.filter((_, k) => k !== i) : prev))} aria-label={`Quitar tema ${i + 1}`} className="w-8 h-8 shrink-0 rounded-lg text-[#6B7A74] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A] cursor-pointer">✕</button>
                  </li>
                ))}
              </ol>
              {temario.length < MAX_TEMAS && (
                <Button variant="secondary" size="sm" onClick={() => setTemario((prev) => [...prev, ''])}>+ Agregar tema</Button>
              )}
            </div>

            <div className={`${card} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">3. Examen</h2>
                {esEdicion && (editando?.examQuestions ?? 0) > 0 && (
                  <label className="flex items-center gap-2 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer">
                    <input type="checkbox" checked={reemplazarExamen} onChange={(e) => setReemplazarExamen(e.target.checked)} className="accent-[#0E8A7D]" />
                    Reemplazar el examen actual
                  </label>
                )}
              </div>

              {esEdicion && !reemplazarExamen ? (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">
                  Se conserva el examen actual ({editando?.examQuestions} preguntas). Marca «Reemplazar» si quieres escribir uno nuevo.
                </p>
              ) : (
                <>
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">
                    Quien lo apruebe (70% o más) completa el curso. De {MIN_PREGUNTAS} a {MAX_PREGUNTAS} preguntas, cada una con 4 opciones distintas y una sola correcta.
                  </p>
                  <div className="space-y-4">
                    {preguntas.map((p, i) => (
                      <div key={i} className="rounded-xl border border-[#E1E6DF] dark:border-[#27403A] p-4 bg-[#F6F7F2]/60 dark:bg-[#1A2C27]/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6]">Pregunta {i + 1}</span>
                          {preguntas.length > MIN_PREGUNTAS && (
                            <button type="button" onClick={() => setPreguntas((prev) => prev.filter((_, k) => k !== i))} className="text-xs text-[#DC2626] dark:text-[#F87171] hover:underline cursor-pointer">Quitar</button>
                          )}
                        </div>
                        <input value={p.enunciado} onChange={(e) => setPreguntas((prev) => prev.map((q, k) => (k === i ? { ...q, enunciado: e.target.value } : q)))} placeholder="Enunciado de la pregunta" className={campo} aria-label={`Enunciado de la pregunta ${i + 1}`} />
                        <div className="mt-3 space-y-2" role="radiogroup" aria-label={`Opciones de la pregunta ${i + 1}`}>
                          {p.opciones.map((op, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correcta-${i}`}
                                checked={p.correcta === j}
                                onChange={() => setPreguntas((prev) => prev.map((q, k) => (k === i ? { ...q, correcta: j } : q)))}
                                className="accent-[#12C2A8] w-4 h-4 shrink-0 cursor-pointer"
                                aria-label={`Marcar la opción ${j + 1} como correcta`}
                              />
                              <input
                                value={op}
                                onChange={(e) =>
                                  setPreguntas((prev) =>
                                    prev.map((q, k) => (k === i ? { ...q, opciones: q.opciones.map((o, m) => (m === j ? e.target.value : o)) as PreguntaForm['opciones'] } : q))
                                  )
                                }
                                placeholder={`Opción ${j + 1}${p.correcta === j ? ' (correcta)' : ''}`}
                                className={campo}
                                aria-label={`Opción ${j + 1} de la pregunta ${i + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {preguntas.length < MAX_PREGUNTAS && (
                    <Button variant="secondary" size="sm" onClick={() => setPreguntas((prev) => [...prev, preguntaVacia()])}>+ Agregar pregunta</Button>
                  )}
                </>
              )}
            </div>

            <div className={`${card} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">4. Prerrequisitos</h2>
                <button
                  type="button"
                  onClick={suggestPrerequisites}
                  disabled={!(title.trim().length > 0 && level !== 'principiante') || suggestLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0E8A7D] border border-[#0E8A7D]/30 hover:bg-[#ECF7F4] dark:hover:bg-[#10211D] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {suggestLoading ? 'Consultando…' : 'Sugerir con IA'}
                </button>
              </div>

              {level === 'principiante' ? (
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Los cursos de nivel principiante no requieren prerrequisitos.</p>
              ) : (
                <>
                  {suggestError && <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171]">{suggestError}</p>}
                  {suggestModoRespaldo !== null && (
                    <p className={`text-xs font-semibold px-3 py-2 rounded-lg border ${suggestModoRespaldo ? 'text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#3A2A0D] border-[#F59E0B]/40' : 'text-[#0F766E] dark:text-[#2DD4BF] bg-[#12C2A8]/10 border-[#12C2A8]/30'}`}>
                      {suggestModoRespaldo ? 'Sugerencia en modo de respaldo (sin IA): revísala antes de publicar.' : 'Sugerencia generada por IA: puedes editarla libremente.'}
                    </p>
                  )}
                  {eligiblePrereqs.length === 0 ? (
                    <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">No hay cursos de un nivel menor en esta área para usar como prerrequisito.</p>
                  ) : (
                    <div className="space-y-2">
                      {eligiblePrereqs.map((c) => {
                        const marcado = prerequisites.includes(c.id);
                        return (
                          <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${marcado ? 'border-[#12C2A8] bg-[#12C2A8]/10' : 'border-[#E1E6DF] dark:border-[#27403A] bg-[#F6F7F2] dark:bg-[#1A2C27]'}`}>
                            <input type="checkbox" checked={marcado} onChange={() => togglePrereq(c.id)} className="accent-[#12C2A8]" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{c.title}</p>
                              <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] capitalize">{c.level}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {intento && problemas.length > 0 && (
              <div role="alert" className="p-4 rounded-xl border border-[#F5A524]/40 bg-[#FBF3E4] dark:bg-[#3A2A0D]">
                <p className="text-sm font-semibold text-[#B45309] dark:text-[#FBBF24] mb-1.5">Falta un poco para poder guardarlo:</p>
                <ul className="list-disc pl-5 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] space-y-0.5">
                  {problemas.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            )}
            {submitError && (
              <div role="alert" className="p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{submitError}</p>
              </div>
            )}

            <Button variant="gradient" size="lg" className="w-full" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Publicar curso'}
            </Button>
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-semibold uppercase tracking-wider mb-3">Así se verá en el catálogo</p>
            <CatalogCard course={vistaPrevia} onOpen={() => undefined} />
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-3">
              {prerequisites.length > 0 ? `${prerequisites.length} prerrequisito(s)` : 'Sin prerrequisitos'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
