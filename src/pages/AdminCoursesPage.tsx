import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useNavigation } from '../store/NavigationContext';
import { CATEGORIAS_CURSOS, darDeBajaCurso, listarCatalogo } from '../services/cursosServiceApi';
import { nombresDePersonas } from '../services/usuariosServiceApi';
import type { Course } from '../types';

const NIVEL_TEXTO: Record<Course['level'], string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

// Moderación: el admin ve los cursos activos de toda la plataforma y puede dar de baja cualquiera.
export default function AdminCoursesPage() {
  const { navigate } = useNavigation();
  const [cursos, setCursos] = useState<Course[] | null>(null);
  const [publicadores, setPublicadores] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [categoria, setCategoria] = useState<'all' | string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [aBajar, setABajar] = useState<Course | null>(null);
  const [bajando, setBajando] = useState(false);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);

  useEffect(() => {
    let ignorar = false;
    setError(null);
    Promise.all([listarCatalogo(), nombresDePersonas()])
      .then(([c, nombres]) => {
        if (ignorar) return;
        setCursos(c);
        setPublicadores(nombres);
      })
      .catch((e: unknown) => {
        if (!ignorar) setError(e instanceof Error ? e.message : 'No se pudieron cargar los cursos.');
      });
    return () => {
      ignorar = true;
    };
  }, [recarga]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (cursos ?? []).filter((c) => (categoria === 'all' || c.category === categoria) && (!q || c.title.toLowerCase().includes(q)));
  }, [cursos, categoria, busqueda]);

  async function confirmarBaja() {
    if (!aBajar) return;
    setBajando(true);
    setErrorBaja(null);
    try {
      await darDeBajaCurso(aBajar.id);
      setABajar(null);
      setRecarga((k) => k + 1);
    } catch (e) {
      setErrorBaja(e instanceof Error ? e.message : 'No se pudo dar de baja el curso.');
    } finally {
      setBajando(false);
    }
  }

  const nombreDe = (c: Course) => publicadores.get(c.publisherId) ?? c.publisherName;

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel de administración</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Moderación de cursos</h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">Puedes dar de baja cualquier curso activo, sin importar quién lo publicó. Dejará de recomendarse de inmediato.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título…"
            aria-label="Buscar curso"
            className="flex-1 min-w-[12rem] px-3.5 py-2.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#1A2C27] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] outline-none focus:border-[#0E8A7D]"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por área"
            className="px-3 py-2.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#1A2C27] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer"
          >
            <option value="all">Todas las áreas</option>
            {CATEGORIAS_CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] ml-auto">{filtrados.length} curso{filtrados.length !== 1 ? 's' : ''}</p>
        </div>

        {error ? (
          <div role="alert" className="rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-6 text-center">
            <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
          </div>
        ) : cursos === null ? (
          <p className="text-center text-sm text-[#6B7A74] dark:text-[#98B0A6] py-16">Cargando cursos…</p>
        ) : (
          <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#EDF1EA] dark:border-[#27403A]">
                  {['Curso', 'Área', 'Nivel', 'Horas', 'Publicador', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6F7F2] dark:divide-[#27403A]">
                {filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] max-w-xs">
                      <button type="button" onClick={() => navigate('course-detail', { id: c.id })} className="text-left hover:text-[#0E8A7D] cursor-pointer">{c.title}</button>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#6B7A74] dark:text-[#98B0A6]">{c.category}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6B7A74] dark:text-[#98B0A6]">{NIVEL_TEXTO[c.level]}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6B7A74] dark:text-[#98B0A6]">{c.durationHours ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6B7A74] dark:text-[#98B0A6]">{nombreDe(c)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => setABajar(c)} className="text-xs font-semibold text-[#DC2626] dark:text-[#F87171] hover:underline cursor-pointer">Dar de baja</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length === 0 && <p className="text-center text-sm text-[#6B7A74] dark:text-[#98B0A6] py-10">No hay cursos con ese filtro.</p>}
          </div>
        )}
      </main>

      {aBajar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirmar baja">
          <div className="absolute inset-0 bg-black/50" onClick={() => !bajando && setABajar(null)} />
          <div className="relative bg-white dark:bg-[#15231F] rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">¿Dar de baja este curso?</h3>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5 leading-relaxed">
              <span className="font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{aBajar.title}</span> de {nombreDe(aBajar)} saldrá del catálogo y dejará de recomendarse en los roadmaps.
            </p>
            {errorBaja && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{errorBaja}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setABajar(null)} disabled={bajando}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={confirmarBaja} disabled={bajando}>{bajando ? 'Dando de baja…' : 'Dar de baja'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
