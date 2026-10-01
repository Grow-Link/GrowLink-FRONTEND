import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import HorizontalTabs from '../components/HorizontalTabs';
import RangeSlider from '../components/RangeSlider';
import { AccordionSection } from '../components/Accordion';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORIES, LEVELS } from '../services/mockData';
import type { Level } from '../types';

type ViewTab = 'all' | 'roadmap' | 'recommended';

export default function CourseCatalogPage() {
  const { navigate, currentUser } = useNavigation();
  const { courses, isCourseCompleted, completeCourse, getRelevance, profiles, roadmaps } = useAppData();

  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Level[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [relevanceRange, setRelevanceRange] = useState<[number, number]>([0, 100]);
  const [search, setSearch] = useState('');

  const profile = currentUser ? profiles[currentUser.id] : undefined;
  const roadmap = currentUser ? roadmaps[currentUser.id] : undefined;
  const roadmapCourseIds = new Set(roadmap?.nodes.map((n) => n.courseId) ?? []);

  const active = courses.filter((c) => c.status === 'active');
  const allSkills = useMemo(() => [...new Set(active.flatMap((c) => c.skills))].sort(), [active]);

  function toggle<T>(arr: T[], value: T, setter: (v: T[]) => void) {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedSkills([]);
    setRelevanceRange([0, 100]);
    setSearch('');
    setViewTab('all');
  }

  const bySearch = active.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const filtered = bySearch.filter((c) => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level);
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((s) => c.skills.includes(s));
    const rel = getRelevance(c, currentUser?.id);
    const matchesRelevance = rel >= relevanceRange[0] && rel <= relevanceRange[1];
    const matchesTab =
      viewTab === 'all' || (viewTab === 'roadmap' && roadmapCourseIds.has(c.id)) || (viewTab === 'recommended' && rel >= 80);
    return matchesCategory && matchesLevel && matchesSkills && matchesRelevance && matchesTab;
  });

  const categoryCounts = (cat: string) => bySearch.filter((c) => c.category === cat).length;
  const levelCounts = (lv: Level) => bySearch.filter((c) => c.level === lv).length;

  const tabs = profile
    ? [
        { key: 'all', label: 'Todos', count: bySearch.length },
        { key: 'roadmap', label: 'En tu roadmap', count: bySearch.filter((c) => roadmapCourseIds.has(c.id)).length },
        { key: 'recommended', label: 'Recomendados', count: bySearch.filter((c) => getRelevance(c, currentUser?.id) >= 80).length },
      ]
    : [{ key: 'all', label: 'Todos', count: bySearch.length }];

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Catálogo</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Todos los cursos</h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Explora el catálogo completo, filtra por categoría, nivel y habilidades.</p>
        </div>

        <HorizontalTabs tabs={tabs} active={viewTab} onChange={(k) => setViewTab(k as ViewTab)} className="mb-6" />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl px-5 lg:sticky lg:top-24 flex flex-col max-h-[calc(100vh-7rem)]">
              <div className="flex-1 overflow-y-auto">
                <AccordionSection title="Categoría" count={selectedCategories.length || undefined}>
                  <div className="space-y-1">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg cursor-pointer hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggle(selectedCategories, cat, setSelectedCategories)}
                          className="accent-[#1E73E8]"
                        />
                        <span className="flex-1 text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{cat}</span>
                        <span className="font-mono text-xs text-[#6B7A99] dark:text-[#8BA5C2]">{categoryCounts(cat)}</span>
                      </label>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection title="Nivel" count={selectedLevels.length || undefined}>
                  <div className="space-y-1">
                    {LEVELS.map((lv) => (
                      <label key={lv.value} className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg cursor-pointer hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]">
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(lv.value)}
                          onChange={() => toggle(selectedLevels, lv.value, setSelectedLevels)}
                          className="accent-[#1E73E8]"
                        />
                        <span className="flex-1 text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{lv.label}</span>
                        <span className="font-mono text-xs text-[#6B7A99] dark:text-[#8BA5C2]">{levelCounts(lv.value)}</span>
                      </label>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection title="Habilidades" count={selectedSkills.length || undefined} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {allSkills.map((skill) => {
                      const isSel = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggle(selectedSkills, skill, setSelectedSkills)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                            isSel
                              ? 'border-[#1E73E8] bg-[#1E73E8]/10 text-[#1E73E8]'
                              : 'border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:border-[#1E73E8]/40'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </AccordionSection>

                {profile && (
                  <AccordionSection title="Relevancia para ti">
                    <RangeSlider
                      min={0}
                      max={100}
                      step={5}
                      value={relevanceRange}
                      onChange={setRelevanceRange}
                      formatValue={(n) => `${n}%`}
                      presets={[
                        { label: 'Todas', value: [0, 100] },
                        { label: '70%+', value: [70, 100] },
                        { label: '90%+', value: [90, 100] },
                      ]}
                    />
                  </AccordionSection>
                )}
              </div>

              <div className="py-4 border-t border-[#EEF2F6] dark:border-[#1C3254] shrink-0">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 rounded-xl text-sm font-semibold border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] hover:border-[#0B1F3A] dark:hover:border-[#8BA5C2] transition-all cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div className="flex-1 sm:max-w-sm relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por título o habilidad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/20 focus:border-[#1E73E8] transition-all"
                />
              </div>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] whitespace-nowrap font-mono">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((course) => {
                  const completed = currentUser ? isCourseCompleted(currentUser.id, course.id) : false;
                  const actions =
                    currentUser?.role === 'user'
                      ? [
                          { label: 'Ver detalle', onClick: () => navigate('course-detail', { id: course.id }) },
                          completed
                            ? { label: 'Completado', onClick: () => navigate('course-detail', { id: course.id }) }
                            : { label: 'Marcar completado', variant: 'primary' as const, onClick: () => completeCourse(currentUser.id, course.id) },
                        ]
                      : [{ label: 'Ver detalle', onClick: () => navigate('course-detail', { id: course.id }) }];
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isCompleted={completed}
                      isPrerequisiteInRoadmap={roadmapCourseIds.has(course.id)}
                      relevance={getRelevance(course, currentUser?.id)}
                      onSelect={() => navigate('course-detail', { id: course.id })}
                      actions={actions}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl">
                <p className="text-lg font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Sin resultados</p>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Prueba otro término de búsqueda o ajusta los filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
