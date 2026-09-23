import { useState } from 'react';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import { useAppData } from '../store/AppDataContext';
import { CATEGORIES } from '../services/mockData';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminCoursesPage() {
  const { courses, setCourseStatus } = useAppData();
  const [category, setCategory] = useState<'all' | string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = courses.filter(
    (c) => (category === 'all' || c.category === category) && (status === 'all' || c.status === status)
  );
  const confirmTarget = confirmId ? courses.find((c) => c.id === confirmId) : undefined;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel de administración</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Moderación de cursos</h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Puedes dar de baja cualquier curso de la plataforma, sin importar el publicador.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="px-3 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Dados de baja</option>
          </select>
          <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] ml-auto">{filtered.length} curso{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl overflow-hidden">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#EEF2F6] dark:border-[#1C3254]">
                {['Curso', 'Categoría', 'Nivel', 'Publicador', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F9FA] dark:divide-[#1C3254]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] max-w-xs truncate">{c.title}</td>
                  <td className="px-6 py-4 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{c.category}</td>
                  <td className="px-6 py-4 text-sm text-[#6B7A99] dark:text-[#8BA5C2] capitalize">{c.level}</td>
                  <td className="px-6 py-4 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{c.publisherName}</td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'active' ? 'success' : 'danger'}>
                      {c.status === 'active' ? 'Activo' : 'De baja'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.status === 'active' ? (
                      <button
                        onClick={() => setConfirmId(c.id)}
                        className="text-xs font-semibold text-[#DC2626] dark:text-[#F87171] hover:underline cursor-pointer"
                      >
                        Dar de baja
                      </button>
                    ) : (
                      <button
                        onClick={() => setCourseStatus(c.id, 'active')}
                        className="text-xs font-semibold text-[#15803D] dark:text-[#4CE07E] hover:underline cursor-pointer"
                      >
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">¿Dar de baja este curso?</h3>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-6 leading-relaxed">
              <span className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{confirmTarget.title}</span> de {confirmTarget.publisherName} dejará de aparecer en el catálogo y en nuevos roadmaps.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#DDE4ED] dark:border-[#1C3254] text-[#0B1F3A] dark:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] transition-all cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => { setCourseStatus(confirmTarget.id, 'inactive'); setConfirmId(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] transition-all cursor-pointer"
              >
                Dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
