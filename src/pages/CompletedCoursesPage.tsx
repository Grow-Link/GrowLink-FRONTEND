import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { listarCompletados, type CursoCompletado } from '../services/cursosServiceApi';

const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

// HU-15: el historial de cursos aprobados. Cada uno se aprobó con su examen.
export default function CompletedCoursesPage() {
  const { navigate, currentUser } = useNavigation();
  const [completados, setCompletados] = useState<CursoCompletado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    setError(null);
    listarCompletados(Number(currentUser.id))
      .then((c) => {
        if (!ignorar) setCompletados([...c].sort((a, b) => b.fechaCompletado.localeCompare(a.fechaCompletado)));
      })
      .catch((e: unknown) => {
        if (!ignorar) setError(e instanceof Error ? e.message : 'No se pudo cargar tu historial.');
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser, recarga]);

  if (!currentUser) return null;
  const habilidades = [...new Set((completados ?? []).flatMap((c) => c.habilidades))];

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Historial</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Cursos aprobados</h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">
            {completados === null ? 'Cargando…' : `${completados.length} curso${completados.length !== 1 ? 's' : ''} aprobado${completados.length !== 1 ? 's' : ''} en total.`}
          </p>
        </div>

        {error ? (
          <div role="alert" className="rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-6 text-center">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 lg:items-start">
            <div>
              {completados === null ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] animate-pulse" />)}
                </div>
              ) : completados.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl">
                  <p className="text-lg font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-1.5">Aún no apruebas cursos</p>
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5 max-w-sm mx-auto">Cada curso se completa aprobando su examen. Empieza por tu siguiente paso en el roadmap.</p>
                  <Button variant="gradient" onClick={() => navigate('roadmap')}>Ir a mi roadmap</Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {completados.map((c) => (
                    <li key={c.cursoId} className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-[#4CE07E]/15 border border-[#4CE07E]/30 flex items-center justify-center shrink-0 text-[#15803D] dark:text-[#4CE07E] font-bold">✓</span>
                      <div className="flex-1 min-w-[10rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          {c.disponible ? (
                            <button type="button" onClick={() => navigate('course-detail', { id: String(c.cursoId) })} className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] hover:text-[#0E8A7D] transition-colors text-left cursor-pointer">
                              {c.titulo}
                            </button>
                          ) : (
                            <span className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{c.titulo}</span>
                          )}
                          {!c.disponible && (
                            <span className="text-[10px] font-bold text-[#B45309] dark:text-[#FBBF24] bg-[#FFFBEB] dark:bg-[#3A2A0D] border border-[#F59E0B]/40 px-1.5 py-0.5 rounded-md">Ya no disponible</span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">{c.categoria} · {NIVEL_TEXTO[c.nivel]}</p>
                        {c.habilidades.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.habilidades.map((h) => <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">{h}</span>)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono shrink-0 ml-auto">
                        {new Date(c.fechaCompletado).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] rounded-2xl p-5 relative overflow-hidden lg:sticky lg:top-24">
              <div className="absolute top-0 right-0 w-32 h-32 gl-gradient opacity-20 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <p className="text-xs text-[#BCC9C2] font-semibold uppercase tracking-wider mb-3">Habilidades desbloqueadas</p>
                {habilidades.length === 0 ? (
                  <p className="text-sm text-[#BCC9C2]">Aún ninguna.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {habilidades.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">{s}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
