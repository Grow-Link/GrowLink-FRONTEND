import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ConcurrenciaEnVivo from '../components/ConcurrenciaEnVivo';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { listarAreas, type AreaResumen } from '../services/cursosServiceApi';
import { obtenerDashboardConcurrencia, type DashboardConcurrencia } from '../services/metricasApi';
import { listarGanadores, type PartidaConPodio } from '../services/triviaServiceApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Panel del administrador: todo sale de los servicios reales (catálogo de cursos y trivia), nada inventado.

function KPI({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-between min-h-[120px] ${accent ? 'bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] border-transparent' : 'bg-white dark:bg-[#15231F] border-[#E1E6DF] dark:border-[#27403A]'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent ? 'text-[#BCC9C2]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>{label}</p>
      <div>
        <p className={`text-4xl font-display font-bold tabular-nums ${accent ? 'text-white' : 'text-[#1F2D2A] dark:text-[#E6EFE9]'}`}>{value}</p>
        <p className={`text-xs mt-1 ${accent ? 'text-[#BCC9C2]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>{sub}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2D2A] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-[#98B0A6] text-xs font-mono mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { navigate } = useNavigation();
  const [areas, setAreas] = useState<AreaResumen[] | null>(null);
  const [trivia, setTrivia] = useState<DashboardConcurrencia | null>(null);
  const [partidas, setPartidas] = useState<PartidaConPodio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vivo = true;
    setError(null);
    Promise.all([listarAreas(), obtenerDashboardConcurrencia().catch(() => null), listarGanadores(6).catch(() => [] as PartidaConPodio[])])
      .then(([a, t, p]) => {
        if (!vivo) return;
        setAreas(a);
        setTrivia(t);
        setPartidas(p);
      })
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'No se pudieron cargar las métricas.'));
    return () => {
      vivo = false;
    };
  }, [recarga]);

  const totalCursos = (areas ?? []).reduce((s, a) => s + a.cursos, 0);
  const totalHoras = (areas ?? []).reduce((s, a) => s + a.horasTotales, 0);
  const datosAreas = (areas ?? []).map((a) => ({ area: a.etiqueta, cursos: a.cursos })).sort((a, b) => b.cursos - a.cursos);

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel de administración</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Métricas de plataforma</h1>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">Datos reales al {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('admin-courses')} className="self-start">Moderar cursos</Button>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
          </div>
        )}

        <ConcurrenciaEnVivo />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPI label="Cursos activos" value={areas ? String(totalCursos) : '…'} sub="en el catálogo" accent />
          <KPI label="Áreas con cursos" value={areas ? String(areas.length) : '…'} sub="disponibles hoy" />
          <KPI label="Horas de contenido" value={areas ? String(totalHoras) : '…'} sub="sumando todos los cursos" />
          <KPI label="Partidas de trivia" value={trivia ? String(trivia.partidasFinalizadas) : '…'} sub="terminadas" />
          <KPI label="Jugadores en salas" value={trivia ? String(trivia.participantesConectados) : '…'} sub={trivia ? `${trivia.salasActivas} salas activas` : 'ahora mismo'} />
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <section className="bg-white dark:bg-[#15231F] rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mb-1">Cursos por área</h2>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] text-sm mb-5">Cómo se reparte el catálogo hoy</p>
            {areas === null ? (
              <div className="h-64 rounded-xl bg-[#F6F7F2] dark:bg-[#1A2C27] animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, datosAreas.length * 44)}>
                <BarChart data={datosAreas} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E6DF" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7A74', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="area" width={150} tick={{ fontSize: 11, fill: '#6B7A74' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cursos" name="Cursos" fill="#12C2A8" radius={[0, 6, 6, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-white text-lg mb-4">Últimas partidas de trivia</h2>
            {partidas.length === 0 ? (
              <p className="text-sm text-[#BCC9C2]">Todavía no se ha jugado ninguna partida.</p>
            ) : (
              <ul className="space-y-3">
                {partidas.map(({ partida }) => (
                  <li key={partida.codigo} className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{partida.ganadorNombre ? '🏆' : '🤝'}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white leading-snug truncate">{partida.ganadorNombre ? `Ganó ${partida.ganadorNombre}` : 'Sin ganador'}{partida.empate ? ' (empate)' : ''}</p>
                      <p className="text-[11px] text-[#BCC9C2] font-mono">
                        {partida.categoria} · {partida.totalJugadores} jugadores · {new Date(partida.finalizadaEn).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
