import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CheckpointPath from '../components/CheckpointPath';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import { INTERESTS_OPTIONS, LEVELS } from '../services/mockData';
import type { Level } from '../types';

const CHECKPOINTS = [
  { label: 'Tus metas' },
  { label: 'Tus intereses' },
  { label: 'Tu nivel' },
];

const LEVEL_COPY: Record<Level, string> = {
  principiante: 'Estás empezando o quieres una base sólida antes de avanzar.',
  intermedio: 'Ya tienes experiencia práctica y buscas profundizar.',
  avanzado: 'Dominas los fundamentos y buscas retos de alto nivel.',
};

export default function OnboardingPage() {
  const { navigate, currentUser } = useNavigation();
  const { profiles, saveProfile } = useAppData();
  const existing = currentUser ? profiles[currentUser.id] : undefined;

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState(existing?.goals ?? '');
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? []);
  const [level, setLevel] = useState<Level>(existing?.level ?? 'principiante');

  const canAdvance = step === 0 ? goals.trim().length >= 10 : step === 1 ? interests.length > 0 : true;

  function toggleInterest(cat: string) {
    setInterests((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function handleFinish() {
    if (!currentUser) return;
    saveProfile(currentUser.id, { goals, interests, level });
    navigate('home');
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center mb-10">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Checkpoint {step + 1} de 3</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">
            {existing ? 'Actualiza tu perfil' : 'Construyamos tu camino'}
          </h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-2 max-w-lg mx-auto">
            Tres pasos rápidos. Con esto, GrowLink genera un roadmap de cursos hecho a tu medida.
          </p>
        </div>

        <div className="mb-10 px-2 sm:px-8">
          <CheckpointPath checkpoints={CHECKPOINTS} completedCount={step} />
        </div>

        <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6 sm:p-9">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1.5">¿Cuál es tu meta?</h2>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-5">Cuéntanos, en tus palabras, a dónde quieres llegar profesional o financieramente.</p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={5}
                placeholder="Ej. Quiero pasar de un rol operativo a uno de análisis de datos en los próximos 8 meses..."
                className="w-full px-4 py-3 border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl text-sm text-[#0B1F3A] dark:text-[#E2EBF6] bg-white dark:bg-[#132A47] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/10 focus:border-[#1E73E8] transition-all resize-none"
              />
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-2 font-mono">{goals.trim().length}/10 caracteres mínimo</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1.5">¿Qué áreas te interesan?</h2>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-5">Selecciona todas las que apliquen. Definen qué cursos entran en tu roadmap.</p>
              <div className="flex flex-wrap gap-2.5">
                {INTERESTS_OPTIONS.map((cat) => {
                  const selected = interests.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleInterest(cat)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-[#12C2A8] bg-[#12C2A8]/10 text-[#0F766E] dark:text-[#2DD4BF]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] hover:border-[#1E73E8]/40'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-4 font-mono">{interests.length} seleccionadas</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-1.5">¿Cuál es tu nivel actual?</h2>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-5">Ajustamos la dificultad y el punto de partida de tus cursos.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVELS.map((lv) => {
                  const selected = level === lv.value;
                  return (
                    <button
                      key={lv.value}
                      onClick={() => setLevel(lv.value)}
                      className={`p-5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        selected
                          ? 'border-[#1E73E8] bg-[#EFF6FF] dark:bg-[#0D1F3C]'
                          : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] hover:border-[#1E73E8]/40'
                      }`}
                    >
                      <p className={`font-display font-bold mb-1.5 ${selected ? 'text-[#1E73E8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>{lv.label}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed">{LEVEL_COPY[lv.value]}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#DDE4ED] dark:border-[#1C3254]">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Anterior
            </Button>
            {step < 2 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continuar
              </Button>
            ) : (
              <Button variant="gradient" onClick={handleFinish}>
                Guardar perfil
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
