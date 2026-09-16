import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { useNavigation } from '../store/NavigationContext';
import { mockTematicas } from '../services/mockData';
import type { Tematica } from '../types';

interface ModalProps {
  tema: Tematica | null;
  onClose: () => void;
  onSave: (tema: Partial<Tematica>) => void;
}

function TematicaModal({ tema, onClose, onSave }: ModalProps) {
  const [name, setName] = useState(tema?.name ?? '');
  const [description, setDescription] = useState(tema?.description ?? '');
  const [category, setCategory] = useState(tema?.category ?? 'Tecnología');

  const categories = ['Tecnología', 'Finanzas', 'Marketing', 'Management', 'Negocios', 'Habilidades'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">
            {tema ? 'Editar temática' : 'Nueva temática'}
          </h3>
          <button onClick={onClose} className="text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre de la temática"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ciencia de datos"
          />
          <div>
            <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del tipo de oportunidades que incluye..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] rounded-xl text-sm text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/10 focus:border-[#1E73E8] transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white border-[#0B1F3A] dark:border-[#1C3254]'
                      : 'bg-white dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#0B1F3A] dark:hover:border-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-[#EEF2F6] dark:border-[#1C3254]">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            variant="gradient"
            className="flex-1"
            disabled={!name.trim()}
            onClick={() => { onSave({ name, description, category }); onClose(); }}
          >
            {tema ? 'Guardar cambios' : 'Crear temática'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminThemesPage() {
  const { navigate } = useNavigation();
  const [temas, setTemas] = useState<Tematica[]>(mockTematicas);
  const [modal, setModal] = useState<{ open: boolean; tema: Tematica | null }>({ open: false, tema: null });
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = temas.filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterActive === 'all' || (filterActive === 'active' ? t.isActive : !t.isActive);
    return matchesSearch && matchesStatus;
  });

  function toggleActive(id: string) {
    setTemas((prev) => prev.map((t) => t.id === id ? { ...t, isActive: !t.isActive } : t));
  }

  function handleSave(id: string | null, data: Partial<Tematica>) {
    if (id) {
      setTemas((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
    } else {
      const newTema: Tematica = {
        id: String(Date.now()),
        name: data.name ?? '',
        description: data.description ?? '',
        category: data.category ?? 'Tecnología',
        opportunityCount: 0,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setTemas((prev) => [newTema, ...prev]);
    }
  }

  const activeCount = temas.filter((t) => t.isActive).length;
  const totalOpp = temas.reduce((a, t) => a + t.opportunityCount, 0);

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      {modal.open && (
        <TematicaModal
          tema={modal.tema}
          onClose={() => setModal({ open: false, tema: null })}
          onSave={(data) => handleSave(modal.tema?.id ?? null, data)}
        />
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Administración</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-1">Gestión de temáticas</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Controla qué categorías están disponibles en el marketplace</p>
          </div>
          <Button variant="gradient" size="lg" onClick={() => setModal({ open: true, tema: null })} className="self-start">
            + Nueva temática
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total temáticas', value: String(temas.length) },
            { label: 'Activas', value: String(activeCount) },
            { label: 'Inactivas', value: String(temas.length - activeCount) },
            { label: 'Total oportunidades', value: totalOpp.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-[#0F2240] rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] p-4">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1 sm:max-w-sm relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar temática o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/20 focus:border-[#1E73E8] transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl p-1 self-start">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filterActive === f ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white' : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>
          <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{filtered.length} resultados</span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#EEF2F6] dark:border-[#1C3254]">
                <th className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">Tematica</th>
                <th className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">Categoría</th>
                <th className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">Oportunidades</th>
                <th className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">Estado</th>
                <th className="text-left text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider px-6 py-3.5">Creada</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F9FA] dark:divide-[#1C3254]">
              {filtered.map((tema) => (
                <tr key={tema.id} className="group hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] transition-colors border-b border-[#F7F9FA] dark:border-[#1C3254] last:border-0">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{tema.name}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5 max-w-xs truncate">{tema.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="default">{tema.category}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{tema.opportunityCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(tema.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        tema.isActive ? 'bg-[#12C2A8]' : 'bg-[#DDE4ED]'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        tema.isActive ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className={`ml-2 text-xs font-semibold ${tema.isActive ? 'text-[#15803D] dark:text-[#4CE07E]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
                      {tema.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{tema.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ open: true, tema })}
                        className="text-xs text-[#1E73E8] font-semibold hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                      <span className="text-[#DDE4ED] dark:text-[#1C3254]">·</span>
                      <button
                        onClick={() => setTemas((prev) => prev.filter((t) => t.id !== tema.id))}
                        className="text-xs text-[#EF4444] font-semibold hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#6B7A99] dark:text-[#8BA5C2]">
              <p className="text-lg font-semibold">Sin resultados</p>
              <p className="text-sm mt-1">Prueba con otro término o crea una nueva temática.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
