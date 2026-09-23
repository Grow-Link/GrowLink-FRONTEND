import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORIES, LEVELS } from '../services/mockData';
import type { Level } from '../types';

const LEVEL_RANK: Record<Level, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

export default function PublishCoursePage() {
  const { navigate, paramId, currentUser } = useNavigation();
  const { courses, getCourse, publishCourse, updateCourse } = useAppData();

  const editingCourse = paramId ? getCourse(paramId) : undefined;
  const isEditing = Boolean(editingCourse);

  const [title, setTitle] = useState(editingCourse?.title ?? '');
  const [description, setDescription] = useState(editingCourse?.description ?? '');
  const [category, setCategory] = useState(editingCourse?.category ?? CATEGORIES[0]);
  const [level, setLevel] = useState<Level>(editingCourse?.level ?? 'principiante');
  const [skills, setSkills] = useState(editingCourse?.skills.join(', ') ?? '');
  const [contentUrl, setContentUrl] = useState(editingCourse?.contentUrl ?? '');
  const [prerequisites, setPrerequisites] = useState<string[]>(editingCourse?.prerequisites ?? []);
  const [suggested, setSuggested] = useState(false);

  useEffect(() => {
    if (editingCourse && editingCourse.publisherId !== currentUser?.id) {
      navigate('my-courses');
    }
  }, [editingCourse, currentUser, navigate]);

  const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
  const eligiblePrereqs = courses.filter(
    (c) => c.status === 'active' && c.id !== editingCourse?.id && c.category === category && LEVEL_RANK[c.level] < LEVEL_RANK[level]
  );

  function suggestPrerequisites() {
    setPrerequisites(eligiblePrereqs.map((c) => c.id));
    setSuggested(true);
  }

  function togglePrereq(id: string) {
    setPrerequisites((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const canSubmit = title.trim() && description.trim() && contentUrl.trim() && skillList.length > 0;

  function handleSubmit() {
    if (!currentUser || !canSubmit) return;
    if (isEditing && editingCourse) {
      updateCourse(editingCourse.id, { title, description, category, level, skills: skillList, contentUrl, prerequisites });
    } else {
      publishCourse({
        title, description, category, level, skills: skillList, contentUrl, prerequisites,
        publisherId: currentUser.id, publisherName: currentUser.org ?? currentUser.name,
      });
    }
    navigate('my-courses');
  }

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
              <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Machine Learning Aplicado a Finanzas" />
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
                    onChange={(e) => { setCategory(e.target.value); setPrerequisites([]); setSuggested(false); }}
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] cursor-pointer"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Nivel</label>
                  <select
                    value={level}
                    onChange={(e) => { setLevel(e.target.value as Level); setPrerequisites([]); setSuggested(false); }}
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] cursor-pointer"
                  >
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Habilidades (separadas por comas)" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, Machine Learning, SQL" />
              <Input label="Link de contenido" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Prerequisitos</h2>
                <button
                  onClick={suggestPrerequisites}
                  disabled={level === 'principiante' || eligiblePrereqs.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E73E8] border border-[#1E73E8]/30 hover:bg-[#EFF6FF] dark:hover:bg-[#0D1F3C] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Sugerir con IA
                </button>
              </div>
              {level === 'principiante' ? (
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Los cursos de nivel principiante no requieren prerequisitos.</p>
              ) : eligiblePrereqs.length === 0 ? (
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">No hay cursos activos de nivel inferior en esta categoría todavía.</p>
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
                  {suggested && <p className="text-xs text-[#12C2A8] font-semibold">Sugerencia de IA aplicada — puedes editarla libremente.</p>}
                </div>
              )}
            </div>

            <Button variant="gradient" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isEditing ? 'Guardar cambios' : 'Publicar curso'}
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
              {skillList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skillList.slice(0, 4).map((s) => (
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
