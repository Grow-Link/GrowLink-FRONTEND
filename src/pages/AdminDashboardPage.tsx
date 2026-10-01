import Navbar from '../components/Navbar';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';
import { mockAdminMetrics } from '../services/mockData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';

function KPI({ label, value, sub, trend, accent = false }: {
  label: string; value: string; sub: string; trend?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col justify-between min-h-[120px] ${
      accent ? 'bg-[#0B1F3A] border-[#0B1F3A]' : 'bg-white dark:bg-[#0F2240] border-[#DDE4ED] dark:border-[#1C3254]'
    }`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent ? 'text-[#8BA5C2]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>{label}</p>
      <div>
        <p className={`text-4xl font-display font-bold font-mono tabular-nums ${accent ? 'text-white' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trend && <span className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-[#4CE07E]' : 'text-[#EF4444]'}`}>{trend}</span>}
          <span className={`text-xs ${accent ? 'text-[#8BA5C2]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>{sub}</span>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1F3A] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-[#8BA5C2] text-xs font-mono mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { navigate } = useNavigation();
  const { courses } = useAppData();
  const m = mockAdminMetrics;
  const activeCourses = courses.filter((c) => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel de administración</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Métricas de plataforma</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Datos al {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button
            onClick={() => navigate('admin-courses')}
            className="self-start text-sm text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#0B1F3A] dark:hover:border-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Moderar cursos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="col-span-1">
            <KPI label="Usuarios activos" value={m.activeUsers.toLocaleString()} sub="este mes" trend={`+${m.userGrowthPercent}%`} accent />
          </div>
          <KPI label="Completan su roadmap" value={`${m.roadmapCompletionRate}%`} sub="de usuarios con roadmap" trend="+3.8% vs trimestre anterior" />
          <KPI label="Cursos activos" value={String(activeCourses)} sub="en el catálogo" />
          <KPI label="Salas de trivia ahora" value={String(m.activeTriviaRoomsNow)} sub="en curso" trend="+5 vs hace 1h" />
          <KPI label="Pico de concurrencia hoy" value={String(m.peakConcurrentToday)} sub="usuarios simultáneos" />
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6 mb-6">
          <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Concurrencia de hoy</h3>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mt-0.5">Usuarios activos y salas de trivia por franja horaria</p>
              </div>
              <span className="text-sm font-mono font-bold text-[#4CE07E] bg-[#F0FDF4] px-3 py-1 rounded-lg border border-[#BBF7D0]">Pico {m.peakConcurrentToday}</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={m.concurrency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="activeUsers" name="Usuarios activos" stroke="#1E73E8" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="activeTriviaRooms" name="Salas de trivia" stroke="#12C2A8" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
            <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-1">Cursos por categoría</h3>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mb-6">Distribución del catálogo</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={m.categoryDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 10, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Cursos" fill="#12C2A8" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Cursos completados</h3>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mt-0.5">Por mes — últimos 7 meses</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={m.monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4CE07E" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4CE07E" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7A99', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="completions" name="Completados" stroke="#4CE07E" strokeWidth={2.5} fill="url(#compGrad)" dot={false} activeDot={{ r: 4, fill: '#4CE07E', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0B1F3A] rounded-2xl p-6">
            <h3 className="font-display font-bold text-white text-lg mb-4">Actividad reciente</h3>
            <div className="space-y-3">
              {[
                { msg: 'Nueva sala de trivia iniciada en Ciencia de Datos', time: 'hace 4 min', color: '#12C2A8' },
                { msg: '47 nuevos usuarios registrados hoy', time: 'hace 12 min', color: '#4CE07E' },
                { msg: 'Sala de trivia finalizada — 6 jugadores', time: 'hace 28 min', color: '#1E73E8' },
                { msg: 'Curso "Arquitectura de Software" dado de baja', time: 'hace 1h', color: '#F59E0B' },
                { msg: 'Nuevo curso publicado en Finanzas', time: 'hace 2h', color: '#8BA5C2' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#D1DCF0] text-xs leading-snug">{item.msg}</p>
                    <p className="text-[#8BA5C2] text-[10px] font-mono mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
