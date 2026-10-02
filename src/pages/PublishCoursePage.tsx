import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import { getSession } from '../services/backendSession';
import { LEVELS } from '../services/mockData';
import { CATEGORIAS_CURSOS, crearCurso, getHabilidades, sugerirPrerequisitos, type PrerequisitoSugerido } from '../services/cursosServiceApi';
import type { Level } from '../types';

const LEVEL_RANK: Record<Level, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

export default function PublishCoursePage() {
  const { navigate, paramId, currentUser } = useNavigation();
  const { courses, getCourse, updateCourse } = useAppData();

  const editingCourse = paramId ? getCourse(paramId) : undefined;
  const isEditing = Boolean(editingCourse);

  const [title, setTitle] = useState(editingCourse?.title ?? '');
  const [description, setDescription] = useState(editingCourse?.description ?? '');
  const [category, setCategory] = useState(editingCourse?.category ?? CATEGORIAS_CURSOS[0]);
  const [level, setLevel] = useState<Level>(editingCourse?.level ?? 'principiante');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(editingCourse?.skills ?? []);
  const [contentUrl, setContentUrl] = useState(editingCourse?.contentUrl ?? '');
  const [prerequisites, setPrerequisites] = useState<string[]>(editingCourse?.prerequisites ?? []);

  const [skillsOptions, setSkillsOptions] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillsReloadKey, setSkillsReloadKey] = useState(0);

  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestModoRespaldo, setSuggestModoRespaldo] = useState<boolean | null>(null);
  const [unmatchedSuggestions, setUnmatchedSuggestions] = useState<PrerequisitoSugerido[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCourse && editingCourse.publisherId !== currentUser?.id) {
      navigate('my-courses');
    }
  }, [editingCourse, currentUser, navigate]);

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
    setUnmatchedSuggestions([]);
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  const eligiblePrereqs = courses.filter(
    (c) => c.status === 'active' && c.id !== editingCourse?.id && c.category === category && LEVEL_RANK[c.level] < LEVEL_RANK[level]
  );

  async function suggestPrerequisites() {
    setSuggestLoading(true);
    setSuggestError(null);
    setUnmatchedSuggestions([]);
    try {
      const { prerequisitos, modoRespaldo } = await sugerirPrerequisitos({ categoria: category, nivel: level, titulo: title });
      const localIds = new Set(eligiblePrereqs.map((c) => c.id));
      const matched = prerequisitos.filter((p) => localIds.has(p.id));
      const unmatched = prerequisitos.filter((p) => !localIds.has(p.id));
      setPrerequisites(matched.map((p) => p.id));
      setUnmatchedSuggestions(unmatched);
      setSuggestModoRespaldo(modoRespaldo);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'No se pudo contactar a cursos-service.');
    } finally {
      setSuggestLoading(false);
    }
  }

  function togglePrereq(id: string) {
    setPrerequisites((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const canSuggest = title.trim().length > 0 && level !== 'principiante' && !suggestLoading;
  const canSubmit = Boolean(title.trim() && description.trim() && contentUrl.trim() && selectedSkills.length > 0 && !submitting);

  async function handleSubmit() {
    if (!currentUser || !canSubmit) return;
    if (isEditing && editingCourse) {
      // Editar sigue sobre el curso local mock — crearCurso() en cursos-service es solo para publicar nuevos.
      updateCourse(editingCourse.id, { title, description, category, level, skills: selectedSkills, contentUrl, prerequisites });
      navigate('my-courses');
      return;
    }

    const session = getSession();
    if (!session) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Los prerequisitos marcados a mano salen del catálogo local (mockData), no de cursos-service,
      // así que sus ids no son numéricos reales — se descartan y solo se mandan los que sí lo son
      // (los que vinieron de "Sugerir con IA", que sí son ids reales de cursos-service).
      const prerequisitoIds = prerequisites.map(Number).filter((n) => Number.isFinite(n));
      await crearCurso({
        titulo: title,
        descripcion: description,
        categoria: category,
        nivel: level,
        habilidades: selectedSkills,
        linkContenido: contentUrl,
        publicadorUsuarioId: session.usuarioId,
        prerequisitoIds,
      });
      navigate('my-courses');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo publicar el curso.');
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = CATEGORIAS_CURSOS.includes(category as (typeof CATEGORIAS_CURSOS)[number])
    ? CATEGORIAS_CURSOS
    : [category, ...CATEGORIAS_CURSOS];

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:items-start">
          <div className="space-y-6">
            <div>
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel publicador</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">
                {isEditing ? 'Editar curso' : 'Publicar curso'}
              </h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Define categoría, nivel y prerequisitos — así la IA lo incorpora correctamente a los roadmaps.</p>
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Detalles</h2>
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Estática y Resistencia de Materiales" />
              <div>
                <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe qué aprenderá el estudiante en este curso..."
                  className="w-full px-3.5 py-2.5 border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl text-sm text-[#0B1F3A] dark:text-[#E2EBF6] bg-white dark:bg-[#132A47] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/10 focus:border-[#1E73E8] transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] cursor-pointer"
                  >
                    {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Nivel</label>
                  <select
                    value={level}
                    onChange={(e) => { setLevel(e.target.value as Level); setPrerequisites([]); setSuggestModoRespaldo(null); setUnmatchedSuggestions([]); }}
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] cursor-pointer"
                  >
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Habilidades</label>
                  <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{category}</span>
                </div>
                {skillsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] py-3">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando habilidades de cursos-service...
                  </div>
                ) : skillsError ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                    <p className="text-xs text-[#DC2626] dark:text-[#F87171] flex-1">{skillsError}</p>
                    <button
                      onClick={() => setSkillsReloadKey((k) => k + 1)}
                      className="text-xs font-semibold text-[#DC2626] dark:text-[#F87171] underline cursor-pointer shrink-0"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : skillsOptions.length === 0 ? (
                  <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] py-1">cursos-service no tiene habilidades registradas para esta categoría.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillsOptions.map((skill) => {
                      const checked = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                            checked
                              ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white border-[#0B1F3A] dark:border-[#1C3254]'
                              : 'bg-white dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8] hover:text-[#1E73E8]'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Input label="Link de contenido" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Prerequisitos</h2>
                <button
                  onClick={suggestPrerequisites}
                  disabled={!canSuggest}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E73E8] border border-[#1E73E8]/30 hover:bg-[#EFF6FF] dark:hover:bg-[#0D1F3C] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {suggestLoading ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {suggestLoading ? 'Consultando cursos-service...' : 'Sugerir con IA'}
                </button>
              </div>

              {level === 'principiante' ? (
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Los cursos de nivel principiante no requieren prerequisitos.</p>
              ) : (
                <>
                  {suggestError && (
                    <div className="p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                      <p className="text-xs text-[#DC2626] dark:text-[#F87171]">{suggestError}</p>
                    </div>
                  )}

                  {suggestModoRespaldo !== null && (
                    <div
                      className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
                        suggestModoRespaldo
                          ? 'text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#3A2A0D] border-[#F59E0B]/40'
                          : 'text-[#0F766E] dark:text-[#2DD4BF] bg-[#12C2A8]/10 border-[#12C2A8]/30'
                      }`}
                    >
                      {suggestModoRespaldo
                        ? 'cursos-service respondió en modo de respaldo (sin IA disponible) — revisa la sugerencia antes de publicar.'
                        : 'Sugerencia generada por IA — puedes editarla libremente.'}
                    </div>
                  )}

                  {eligiblePrereqs.length === 0 ? (
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Aún no tienes cursos activos de nivel inferior en esta categoría para marcar como prerequisito manualmente. Usa "Sugerir con IA" para consultar el catálogo completo de cursos-service.</p>
                  ) : (
                    <div className="space-y-2">
                      {eligiblePrereqs.map((c) => {
                        const checked = prerequisites.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              checked ? 'border-[#12C2A8] bg-[#12C2A8]/10' : 'border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47]'
                            }`}
                          >
                            <input type="checkbox" checked={checked} onChange={() => togglePrereq(c.id)} className="accent-[#12C2A8]" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] truncate">{c.title}</p>
                              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] capitalize">{c.level}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {unmatchedSuggestions.length > 0 && (
                    <div className="p-3 rounded-xl border border-dashed border-[#DDE4ED] dark:border-[#1C3254]">
                      <p className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] mb-1.5">
                        cursos-service también sugirió estos cursos, pero no están en tu catálogo local todavía:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {unmatchedSuggestions.map((p) => (
                          <span key={p.id} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">
                            {p.titulo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
                <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{submitError}</p>
              </div>
            )}

            <Button variant="gradient" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publicando...
                </>
              ) : isEditing ? (
                'Guardar cambios'
              ) : (
                'Publicar curso'
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Vista previa en catálogo</p>
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] bg-[#F7F9FA] dark:bg-[#132A47]">{category}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-[#1E73E8]/30 text-[#1E73E8] bg-[#EFF6FF] dark:bg-[#0D1F3C] capitalize">{level}</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug">{title || 'Título del curso'}</h3>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1 line-clamp-2 leading-relaxed">{description || 'La descripción de tu curso aparecerá aquí...'}</p>
              </div>
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.slice(0, 4).map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">{s}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] pt-2 border-t border-[#EEF2F6] dark:border-[#1C3254]">
                {prerequisites.length > 0 ? `${prerequisites.length} prerequisito(s)` : 'Sin prerequisitos'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
