import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '../store/NavigationContext';
import { mockGoal, mockOpportunities } from '../services/mockData';

type GoalType = 'financial' | 'professional';

export default function GoalPage() {
  const { navigate, hasActiveGoal, setHasActiveGoal } = useNavigation();
  const [selectedType, setSelectedType] = useState<GoalType>('financial');
  const [creatingNew, setCreatingNew] = useState(false);

  const relatedOpps = mockOpportunities.slice(0, 3);

  if (!hasActiveGoal || creatingNew) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">
                {creatingNew ? 'Cambiar meta' : 'Configurar meta'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">
                {creatingNew ? 'Define tu nueva meta' : 'Define tu proxima meta'}
              </h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-2 text-base sm:text-lg">
                La IA genera un roadmap personalizado basado en tu perfil y esta meta.
              </p>
            </div>

            {/* Goal type selector — editorial, side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {(['financial', 'professional'] as GoalType[]).map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`relative p-6 sm:p-8 rounded-2xl border-2 text-left cursor-pointer transition-all group ${
                      isSelected
                        ? 'border-[#1E73E8] bg-white dark:bg-[#0F2240] shadow-lg'
                        : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] hover:border-[#1E73E8]/50 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-[#1E73E8] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center ${
                      isSelected ? 'gl-gradient' : 'bg-[#EEF2F6] dark:bg-[#132A47]'
                    }`}>
                      {type === 'financial' ? (
                        <svg className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-xl mb-2">
                      {type === 'financial' ? 'Meta financiera' : 'Meta profesional'}
                    </h3>
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed">
                      {type === 'financial'
                        ? 'Incrementa tu ingreso mensual a un monto objetivo concreto. La IA diseña el camino mas rapido basado en tu perfil actual.'
                        : 'Alcanza un cargo especifico o nivel de seniority en tu industria. Ideal si tienes claro donde quieres llegar.'}
                    </p>
                    {isSelected && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-[#1E73E8] font-semibold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1E73E8]" />
                        Seleccionado
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-8 space-y-5">
              <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Detalles de la meta</h3>
              {selectedType === 'financial' ? (
                <>
                  <Input
                    label="Ingreso mensual objetivo (USD)"
                    type="number"
                    placeholder="6000"
                    prefix={<span className="font-mono text-sm">$</span>}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Ingreso mensual actual (USD)" type="number" placeholder="2800" prefix={<span className="font-mono text-sm">$</span>} />
                    <Input label="Plazo para alcanzarla" type="month" defaultValue="2025-12" />
                  </div>
                  <div className="p-5 bg-[#EFF6FF] dark:bg-[#132A47] rounded-xl border border-[#BFDBFE] dark:border-[#1C3254]">
                    <p className="text-sm font-semibold text-[#1E73E8]">Brecha estimada</p>
                    <p className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">+$3,200 USD/mes</p>
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">Equivale a incrementar tu ingreso un 114% en 15 meses</p>
                  </div>
                </>
              ) : (
                <>
                  <Input label="Cargo o posicion objetivo" placeholder="Senior Data Analyst / Data Science Lead" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Industria" placeholder="Tecnologia financiera (Fintech)" />
                    <Input label="Plazo estimado" type="month" defaultValue="2025-12" />
                  </div>
                  <Input label="Por que esta posicion?" placeholder="Describe brevemente tu motivacion..." />
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {creatingNew && (
                <Button variant="secondary" onClick={() => setCreatingNew(false)}>
                  Cancelar
                </Button>
              )}
              <Button variant="gradient" size="lg" onClick={() => { setHasActiveGoal(true); navigate('roadmap'); }} className="flex-1">
                Generar roadmap con IA
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />

      {/* Hero section — full width brand treatment */}
      <div className="bg-[#0B1F3A] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 gl-gradient opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#12C2A8] opacity-5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="max-w-3xl">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Meta activa</span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mt-3 leading-tight">
                {mockGoal.title}
              </h1>
              <p className="text-[#8BA5C2] mt-3 text-base">
                Progresando hacia $6,000 USD/mes · Plazo: Dic 2025
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-[#8BA5C2] uppercase tracking-wider font-semibold">Objetivo</p>
                  <p className="text-2xl font-display font-bold text-white mt-1">${mockGoal.targetAmount?.toLocaleString('en-US')} USD</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-[#8BA5C2] uppercase tracking-wider font-semibold">Ingreso actual</p>
                  <p className="text-2xl font-display font-bold text-white mt-1">$2,800 USD</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-[#8BA5C2] uppercase tracking-wider font-semibold">Tiempo restante</p>
                  <p className="text-2xl font-display font-bold text-white mt-1">18 sem.</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#8BA5C2]">Progreso hacia la meta</span>
                  <span className="text-sm font-mono font-bold text-white">{mockGoal.currentProgress}%</span>
                </div>
                <ProgressBar value={mockGoal.currentProgress} size="md" variant="gradient" />
                <p className="text-xs text-[#8BA5C2] mt-2">
                  Llevas $3,300 USD · Faltan $2,700 USD para alcanzar la meta
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="gradient" onClick={() => navigate('roadmap')}>
                  Ver mi roadmap
                </Button>
                <Button
                  variant="ghost"
                  className="!text-[#8BA5C2] hover:!text-white hover:!bg-white/10"
                  onClick={() => navigate('marketplace')}
                >
                  Explorar oportunidades
                </Button>
              </div>
            </div>

            {/* Right: activity summary */}
            <div className="w-full lg:w-72 shrink-0 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Actividad reciente</p>
                <div className="space-y-2.5">
                  {[
                    { txt: 'Completaste el paso 1: LinkedIn optimizado', time: 'hace 2 dias', color: '#4CE07E' },
                    { txt: 'Iniciaste el paso 2: Portafolio de proyectos', time: 'hace 5 dias', color: '#1E73E8' },
                    { txt: 'Perfil completado al 87%', time: 'hace 1 semana', color: '#12C2A8' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-xs text-[#D1DCF0] leading-snug">{item.txt}</p>
                        <p className="text-[10px] text-[#8BA5C2] font-mono mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Below hero: roadmap progress + opportunities + change goal */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
          {/* Left: roadmap progress preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Progreso del roadmap</h2>
                <button
                  onClick={() => navigate('roadmap')}
                  className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer"
                >
                  Ver completo
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Perfil profesional optimizado', status: 'completed', weeks: 4 },
                  { title: 'Portafolio de proyectos de datos', status: 'in_progress', weeks: 6 },
                  { title: 'Certificacion en ML aplicado', status: 'pending', weeks: 8 },
                  { title: 'Red de contactos estrategica', status: 'pending', weeks: 4 },
                  { title: 'Proceso de busqueda activa', status: 'pending', weeks: 6 },
                ].map((step, i) => {
                  const borderColor = step.status === 'completed' ? '#4CE07E' : step.status === 'in_progress' ? '#1E73E8' : '#DDE4ED';
                  const textColor = step.status === 'completed' ? 'text-[#15803D] dark:text-[#4CE07E]' : step.status === 'in_progress' ? 'text-[#1E73E8]' : 'text-[#6B7A99] dark:text-[#8BA5C2]';
                  const statusLabel = step.status === 'completed' ? 'Completado' : step.status === 'in_progress' ? 'En progreso' : 'Pendiente';
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 rounded-xl border-l-4 bg-[#F7F9FA] dark:bg-[#132A47]" style={{ borderLeftColor: borderColor }}>
                      <div className="flex-1 min-w-[12rem]">
                        <p className={`text-sm font-semibold ${step.status === 'pending' ? 'text-[#6B7A99] dark:text-[#8BA5C2]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                          {step.title}
                        </p>
                        <p className={`text-xs mt-0.5 font-semibold ${textColor}`}>{statusLabel}</p>
                      </div>
                      <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{step.weeks} sem.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Related opportunities */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Oportunidades para tu paso actual</h2>
                <button
                  onClick={() => navigate('marketplace')}
                  className="text-sm text-[#1E73E8] font-semibold hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              </div>
              <div className="space-y-3">
                {relatedOpps.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => navigate('opportunity-detail', { opportunity: opp })}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8]/40 hover:shadow-sm transition-all cursor-pointer bg-[#F7F9FA] dark:bg-[#132A47] text-left group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] group-hover:text-[#1E73E8] transition-colors">{opp.title}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{opp.provider.name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs font-mono font-bold text-[#12C2A8]">{opp.matchScore}% match</p>
                      <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] mt-0.5">
                        {opp.price === 0 ? 'Gratis' : `$${opp.price}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: change goal */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">Cambiar meta</h3>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-4 leading-relaxed">
                Si tu situacion ha cambiado o quieres ajustar tu objetivo, puedes redefinir tu meta. El sistema generara un nuevo roadmap personalizado.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => setCreatingNew(true)}>
                Redefinir meta
              </Button>
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-4">Estadisticas clave</h3>
              <div className="space-y-3">
                {[
                  { label: 'Compatibilidad de perfil', value: '87%', sub: 'con tu meta actual' },
                  { label: 'Matches en marketplace', value: '12', sub: 'oportunidades activas' },
                  { label: 'Semanas en plataforma', value: '6', sub: 'desde que te uniste' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-[#DDE4ED] dark:border-[#1C3254] last:border-0">
                    <div>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{stat.sub}</p>
                    </div>
                    <p className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
