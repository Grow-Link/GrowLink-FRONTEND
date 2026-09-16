import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '../store/NavigationContext';
import { mockUser } from '../services/mockData';

const ALL_SKILLS = [
  'Python', 'SQL', 'Excel avanzado', 'Power BI', 'Tableau', 'R',
  'Machine Learning', 'Análisis de datos', 'JavaScript', 'React',
  'Node.js', 'Java', 'Project Management', 'Liderazgo', 'Negociación',
  'Finanzas corporativas', 'Contabilidad', 'Marketing digital', 'SEO', 'UX/UI',
];

const sections = ['Información profesional', 'Estudios', 'Habilidades', 'Situación económica'];

const WORK_MODES = [
  'Tiempo completo — Empleado',
  'Tiempo completo — Independiente / Freelance',
  'Medio tiempo',
  'Freelance por proyecto',
  'Buscando empleo activamente',
  'Estudiante',
];

export default function ProfilePage() {
  const { navigate } = useNavigation();
  const [activeSection, setActiveSection] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(mockUser.skills);
  const [income, setIncome] = useState('2800');
  const [workMode, setWorkMode] = useState(WORK_MODES[0]);
  const [experience, setExperience] = useState(mockUser.experience);
  const [education, setEducation] = useState(mockUser.education);

  const completionPerSection = [25, 20, 37, 18];
  const totalCompletion = completionPerSection.slice(0, activeSection + 1).reduce((a, b) => a + b, 0);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function addExperience() {
    setExperience((prev) => [...prev, { role: '', company: '', years: 0, current: false }]);
  }

  function removeExperience(index: number) {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  }

  function addEducation() {
    setEducation((prev) => [...prev, { institution: '', degree: '', year: new Date().getFullYear() }]);
  }

  function removeEducation(index: number) {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 lg:sticky lg:top-24">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-6 pb-5 border-b border-[#DDE4ED] dark:border-[#1C3254]">
                <div className="w-16 h-16 rounded-2xl gl-gradient flex items-center justify-center text-white text-xl font-display font-bold mb-3">
                  VR
                </div>
                <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{mockUser.name}</p>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">Perfil en construccion</p>
              </div>

              {/* Completion */}
              <div className="mb-6 pb-5 border-b border-[#DDE4ED] dark:border-[#1C3254]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider">Completitud</span>
                  <span className="text-sm font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{totalCompletion}%</span>
                </div>
                <ProgressBar value={totalCompletion} size="md" variant="gradient" />
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-2">Un perfil completo obtiene 3x más matches</p>
              </div>

              {/* Section nav */}
              <nav className="space-y-1">
                {sections.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(i)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-left cursor-pointer transition-all ${
                      activeSection === i
                        ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                        : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        activeSection === i ? 'bg-white/20 text-white' : 'bg-[#EEF2F6] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2]'
                      }`}>
                        {i + 1}
                      </span>
                      {s}
                    </span>
                    {i < activeSection && (
                      <svg className="w-3.5 h-3.5 text-[#4CE07E] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-8">
              {activeSection === 0 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Informacion profesional</h2>
                    <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Tu experiencia actual y areas de trabajo.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Nombre completo" defaultValue={mockUser.name} />
                    <Input label="Correo electrónico" type="email" defaultValue={mockUser.email} />
                  </div>

                  {/* Experience */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Experiencia laboral</h3>
                      <Button variant="ghost" size="sm" onClick={addExperience}>+ Agregar</Button>
                    </div>
                    <div className="space-y-3">
                      {experience.map((exp, i) => (
                        <div key={i} className="p-4 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47]">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-3">
                            <Input
                              label="Cargo"
                              defaultValue={exp.role}
                              placeholder="Ej. Analista Junior"
                            />
                            <Input
                              label="Empresa"
                              defaultValue={exp.company}
                              placeholder="Ej. Grupo Financiero Norte"
                            />
                            <Input
                              label="Años"
                              type="number"
                              min={0}
                              defaultValue={String(exp.years)}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked={exp.current} className="accent-[#12C2A8]" />
                              <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Es mi trabajo actual</span>
                            </label>
                            <button
                              onClick={() => removeExperience(i)}
                              className="text-xs text-[#EF4444] font-semibold hover:underline cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 1 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Estudios</h2>
                    <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Tu formación académica y certificaciones.</p>
                  </div>

                  {education.map((edu, i) => (
                    <div key={i} className="p-5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Institución" defaultValue={edu.institution} placeholder="Ej. Universidad Autónoma" />
                        <Input label="Título / Grado" defaultValue={edu.degree} placeholder="Ej. Licenciatura en Economía" />
                        <Input label="Año de egreso" type="number" defaultValue={String(edu.year)} />
                      </div>
                      {education.length > 1 && (
                        <button
                          onClick={() => removeEducation(i)}
                          className="text-xs text-[#EF4444] font-semibold hover:underline cursor-pointer mt-3"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}

                  <Button variant="secondary" size="md" onClick={addEducation}>+ Agregar otro estudio</Button>
                </div>
              )}

              {activeSection === 2 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Habilidades</h2>
                    <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Selecciona todas las que apliquen. El algoritmo de match las usa directamente.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ALL_SKILLS.map((skill) => {
                      const selected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white border-[#0B1F3A] dark:border-[#1C3254]'
                              : 'bg-white dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8] hover:text-[#1E73E8]'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{selectedSkills.length} habilidades seleccionadas</span>
                    <div className="flex-1 h-px bg-[#DDE4ED] dark:bg-[#1C3254]" />
                  </div>
                </div>
              )}

              {activeSection === 3 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Situación económica actual</h2>
                    <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Esta información es privada y se usa exclusivamente para calcular tu meta y roadmap.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Ingreso mensual actual (USD)"
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      prefix={<span className="font-mono text-sm">$</span>}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Modalidad de trabajo</label>
                      <select
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value)}
                        className="border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] focus:ring-2 focus:ring-[#1E73E8]/10 transition-all cursor-pointer"
                      >
                        {WORK_MODES.map((mode) => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#F7F9FA] dark:bg-[#132A47] border border-[#DDE4ED] dark:border-[#1C3254]">
                    <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">Ingreso actual registrado</p>
                    <p className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">
                      ${Number(income).toLocaleString('en-US')}
                      <span className="text-base font-body font-normal text-[#6B7A99] dark:text-[#8BA5C2] ml-1">USD/mes</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-[#DDE4ED] dark:border-[#1C3254]">
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                  disabled={activeSection === 0}
                >
                  Anterior
                </Button>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="secondary">Guardar borrador</Button>
                  {activeSection < sections.length - 1 ? (
                    <Button variant="primary" onClick={() => setActiveSection(activeSection + 1)}>
                      Continuar
                    </Button>
                  ) : (
                    <Button variant="gradient" onClick={() => navigate('goal')}>
                      Completar perfil — Definir mi meta
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
