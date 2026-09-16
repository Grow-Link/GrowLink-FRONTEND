import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { mockRoadmap, mockGoal, mockOpportunities } from '../services/mockData';
import type { StepStatus } from '../types';

const statusConfig: Record<StepStatus, { label: string; borderColor: string; dot: string; text: string }> = {
  completed: {
    label: 'Completado',
    borderColor: '#4CE07E',
    dot: 'bg-[#4CE07E] border-[#4CE07E]',
    text: 'text-[#15803D] dark:text-[#4CE07E]',
  },
  in_progress: {
    label: 'En progreso',
    borderColor: '#1E73E8',
    dot: 'bg-[#1E73E8] border-[#1E73E8] shadow-[0_0_0_4px_rgba(30,115,232,0.2)]',
    text: 'text-[#1E73E8]',
  },
  pending: {
    label: 'Pendiente',
    borderColor: '#DDE4ED',
    dot: 'bg-white dark:bg-[#0F2240] border-[#DDE4ED] dark:border-[#1C3254]',
    text: 'text-[#6B7A99] dark:text-[#8BA5C2]',
  },
};

export default function RoadmapPage() {
  const { navigate, setHasActiveGoal } = useNavigation();
  const [steps, setSteps] = useState(mockRoadmap.steps);
  const [regenerating, setRegenerating] = useState(false);
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(true);
  const [goalPromptDismissed, setGoalPromptDismissed] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalWeeks = steps.reduce((a, s) => a + s.estimatedWeeks, 0);
  const doneWeeks = steps
    .filter((s) => s.status === 'completed')
    .reduce((a, s) => a + s.estimatedWeeks, 0);
  const progressPct = Math.round((doneWeeks / totalWeeks) * 100);
  const allStepsDone = steps.every((s) => s.status === 'completed');

  const relatedOpps = mockOpportunities.slice(0, 3);

  function handleRegenerate() {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      setShowUpdatedBadge(true);
    }, 2000);
  }

  function markStepComplete(stepId: string) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx === -1) return prev;
      return prev.map((s, i) => {
        if (i === idx) return { ...s, status: 'completed' as StepStatus };
        if (i === idx + 1 && s.status === 'pending') return { ...s, status: 'in_progress' as StepStatus };
        return s;
      });
    });
    setJustCompletedId(stepId);
    setTimeout(() => setJustCompletedId(null), 900);
  }

  function handleDefineNewGoal() {
    setHasActiveGoal(false);
    navigate('goal');
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Roadmap IA</span>
              {showUpdatedBadge && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CCFBF1] dark:bg-[#0D3830] text-[#0F766E] dark:text-[#2DD4BF] text-xs font-semibold border border-[#99F6E4] dark:border-[#134E4A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF] live-pulse" />
                  Actualizado IA
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-tight max-w-2xl">
              {mockGoal.title}
            </h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-2">
              Generado el {new Date(mockRoadmap.generatedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} · {totalWeeks} semanas estimadas
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="self-start"
          >
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

        {/* 2-column layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 lg:items-start">
          {/* Left: timeline */}
          <div>
            {/* Progress strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Semanas completadas', value: `${doneWeeks}`, sub: `de ${totalWeeks} sem.` },
                { label: 'Paso actual', value: 'Portafolio', sub: 'Paso 2 de 5' },
                { label: 'Progreso meta', value: `${mockGoal.currentProgress}%`, sub: 'Ingreso +18%' },
                { label: 'Tiempo restante', value: '18 sem.', sub: 'a Dic 2025' },
              ].map((stat) => (
                <div key={stat.label} className="gl-card-hover bg-white dark:bg-[#0F2240] rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] p-4">
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{stat.value}</p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Timeline steps */}
            <div className="space-y-3">
              {steps.map((step, i) => {
                const cfg = statusConfig[step.status];
                const isPending = step.status === 'pending';

                const isJustCompleted = justCompletedId === step.id;

                return (
                  <div
                    key={step.id}
                    className={`gl-card-hover border-l-4 bg-white dark:bg-[#0F2240] rounded-2xl p-4 sm:p-6 border border-[#DDE4ED] dark:border-[#1C3254] transition-all ${
                      isPending ? 'opacity-60' : 'shadow-sm'
                    } ${isJustCompleted ? 'gl-pop-in' : ''}`}
                    style={{ borderLeftColor: cfg.borderColor }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 border-2 ${
                          step.status === 'completed'
                            ? 'bg-[#4CE07E] border-[#4CE07E] text-white'
                            : step.status === 'in_progress'
                            ? 'bg-[#1E73E8] border-[#1E73E8] text-white'
                            : 'bg-white dark:bg-[#0F2240] border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]'
                        }`}>
                          {step.status === 'completed' ? (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : step.order}
                        </span>
                        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{step.estimatedWeeks} sem.</span>
                    </div>

                    <h3 className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">{step.title}</h3>
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed mb-4">{step.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {step.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {step.status === 'in_progress' && (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" size="sm" onClick={() => navigate('marketplace')}>
                            Ver oportunidades
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => markStepComplete(step.id)}>
                            Marcar como completado
                          </Button>
                        </div>
                      )}
                      {step.status === 'completed' && (
                        <Button variant="secondary" size="sm" onClick={() => navigate('marketplace')}>
                          Revisitar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All steps completed — prompt to set a new goal */}
            {allStepsDone && !goalPromptDismissed && (
              <div className="gl-pop-in mt-6 relative overflow-hidden rounded-2xl gl-glow-teal">
                <div className="absolute inset-0 bg-[#0B1F3A]" />
                <div className="gl-float absolute right-0 top-0 w-64 h-full gl-gradient opacity-10 blur-xl" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <div className="gl-bounce w-10 h-10 rounded-xl gl-gradient flex items-center justify-center shrink-0 text-lg">
                      🎉
                    </div>
                    <div>
                      <p className="font-display font-bold text-white text-lg">¡Completaste todos los pasos de tu roadmap!</p>
                      <p className="text-[#8BA5C2] text-sm mt-1">¿Quieres definir una nueva meta para que la IA arme tu próximo roadmap?</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setGoalPromptDismissed(true)}
                      className="text-sm text-[#8BA5C2] hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Más tarde
                    </button>
                    <Button variant="gradient" onClick={handleDefineNewGoal}>
                      Definir nueva meta
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            {!allStepsDone && (
              <div className="mt-6 bg-[#0B1F3A] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-white text-lg">El marketplace tiene oportunidades para tu paso actual</p>
                  <p className="text-[#8BA5C2] text-sm mt-1">3 cursos y 1 empleo coinciden con tu perfil y roadmap</p>
                </div>
                <Button variant="gradient" size="lg" onClick={() => navigate('marketplace')} className="self-start sm:self-auto">
                  Ver matches ahora
                </Button>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Goal progress card */}
            <div className="bg-[#0B1F3A] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 gl-gradient opacity-10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-1">Meta activa</p>
                <p className="text-sm font-display font-bold text-white leading-snug mb-4">{mockGoal.title}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8BA5C2]">Progreso</span>
                    <span className="text-white font-mono font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gl-gradient"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('goal')}
                  className="text-xs text-[#8BA5C2] hover:text-white transition-colors cursor-pointer"
                >
                  Ver detalle de meta
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="gl-card-hover bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Estadisticas</p>
              <div className="space-y-3">
                {[
                  { label: 'Pasos completados', value: `${completedCount}/${mockRoadmap.steps.length}` },
                  { label: 'Semanas restantes', value: `${totalWeeks - doneWeeks} sem.` },
                  { label: 'Progreso total', value: `${progressPct}%` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{stat.label}</p>
                    <p className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related opportunities */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider">Oportunidades sugeridas</p>
                <button
                  onClick={() => navigate('marketplace')}
                  className="text-xs text-[#1E73E8] font-semibold hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              </div>
              <div className="space-y-2.5">
                {relatedOpps.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => navigate('opportunity-detail', { opportunity: opp })}
                    className="w-full text-left flex items-center justify-between py-2.5 border-b border-[#DDE4ED] dark:border-[#1C3254] last:border-0 group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] truncate group-hover:text-[#1E73E8] transition-colors">{opp.title}</p>
                      <p className="text-[10px] text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{opp.provider.name}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#12C2A8] ml-2 shrink-0">{opp.matchScore}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
