import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import CatalogCard from '../components/CatalogCard';
import RangeSlider from '../components/RangeSlider';
import { AccordionSection } from '../components/Accordion';
import { useNavigation } from '../store/NavigationContext';
import { listarCatalogo, listarCompletados } from '../services/cursosServiceApi';
import { fetchRoadmap } from '../services/roadmapApi';
import { getPerfil } from '../services/usuariosServiceApi';
import type { Course, Level } from '../types';

// HU-13: el catálogo. Búsqueda y filtros a la izquierda (como en un marketplace), tarjetas densas a la derecha.
// Cada tarjeta lleva a la ficha del curso; completar un curso solo se hace aprobando su examen, no desde aquí.

type Orden = 'recomendado' | 'az' | 'horas-asc' | 'horas-desc' | 'nivel';

const NIVELES: { value: Level; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];
const RANGO_NIVEL: Record<Level, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

function quitarTildes(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function CourseCatalogPage() {
  const { navigate, currentUser } = useNavigation();
  const esUsuario = currentUser?.role === 'user';

  const [cursos, setCursos] = useState<Course[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  // solo para quien tiene roadmap: qué cursos ya aprobó, cuáles están en su ruta y qué áreas le interesan
  const [aprobados, setAprobados] = useState<Set<string>>(new Set());
  const [enRoadmap, setEnRoadmap] = useState<Set<string>>(new Set());
  const [areasDeInteres, setAreasDeInteres] = useState<string[]>([]);
  const [nivelPropio, setNivelPropio] = useState<Level | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<Level[]>([]);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [soloConExamen, setSoloConExamen] = useState(false);
  const [soloMiRuta, setSoloMiRuta] = useState(false);
  const [ocultarAprobados, setOcultarAprobados] = useState(false);
  const [rangoHoras, setRangoHoras] = useState<[number, number] | null>(null);
  const [orden, setOrden] = useState<Orden>(esUsuario ? 'recomendado' : 'az');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [verTodasHabilidades, setVerTodasHabilidades] = useState(false);

  useEffect(() => {
    let ignorar = false;
    setCargando(true);
    setError(null);
    listarCatalogo()
      .then((data) => {
        if (!ignorar) setCursos(data);
      })
      .catch((err: unknown) => {
        if (!ignorar) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
      })
      .finally(() => {
        if (!ignorar) setCargando(false);
      });
    return () => {
      ignorar = true;
    };
  }, [recarga]);

  useEffect(() => {
    if (!esUsuario || !currentUser) return;
    let ignorar = false;
    Promise.all([listarCompletados(Number(currentUser.id)), fetchRoadmap().catch(() => null), getPerfil().catch(() => null)]).then(
      ([completados, vista, perfil]) => {
        if (ignorar) return;
        setAprobados(new Set(completados.map((c) => String(c.cursoId))));
        setEnRoadmap(new Set((vista?.nodes ?? []).map((n) => String(n.cursoId))));
        setAreasDeInteres(perfil?.intereses ?? []);
        setNivelPropio(perfil?.nivel ?? null);
      }
    ).catch(() => undefined);
    return () => {
      ignorar = true;
    };
  }, [esUsuario, currentUser]);

  const horasMaximas = useMemo(() => Math.max(10, ...cursos.map((c) => c.durationHours ?? 0)), [cursos]);
  const rango: [number, number] = rangoHoras ?? [0, horasMaximas];

  const conteoPorArea = useMemo(() => contar(cursos.map((c) => c.category)), [cursos]);
  const conteoPorNivel = useMemo(() => contar(cursos.map((c) => c.level)), [cursos]);
  const habilidadesPopulares = useMemo(
    () =>
      Object.entries(contar(cursos.flatMap((c) => c.skills)))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([nombre, n]) => ({ nombre, n })),
    [cursos]
  );

  const visibles = useMemo(() => {
    const q = quitarTildes(busqueda.trim());
    const lista = cursos.filter((c) => {
      if (q && !quitarTildes(`${c.title} ${c.description} ${c.category} ${c.skills.join(' ')} ${(c.syllabus ?? []).join(' ')}`).includes(q)) return false;
      if (areas.length > 0 && !areas.includes(c.category)) return false;
      if (niveles.length > 0 && !niveles.includes(c.level)) return false;
      if (habilidades.length > 0 && !habilidades.every((h) => c.skills.includes(h))) return false;
      if (soloConExamen && (c.examQuestions ?? 0) === 0) return false;
      if (soloMiRuta && !enRoadmap.has(c.id)) return false;
      if (ocultarAprobados && aprobados.has(c.id)) return false;
      const horas = c.durationHours ?? 0;
      if (rangoHoras && (horas < rango[0] || horas > rango[1])) return false;
      return true;
    });

    const puntaje = (c: Course) =>
      (enRoadmap.has(c.id) ? 100 : 0) +
      (areasDeInteres.includes(c.category) ? 40 : 0) +
      (nivelPropio && c.level === nivelPropio ? 15 : 0) -
      (aprobados.has(c.id) ? 60 : 0);

    return [...lista].sort((a, b) => {
      switch (orden) {
        case 'recomendado':
          return puntaje(b) - puntaje(a) || a.title.localeCompare(b.title);
        case 'horas-asc':
          return (a.durationHours ?? 0) - (b.durationHours ?? 0) || a.title.localeCompare(b.title);
        case 'horas-desc':
          return (b.durationHours ?? 0) - (a.durationHours ?? 0) || a.title.localeCompare(b.title);
        case 'nivel':
          return RANGO_NIVEL[a.level] - RANGO_NIVEL[b.level] || a.title.localeCompare(b.title);
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [cursos, busqueda, areas, niveles, habilidades, soloConExamen, soloMiRuta, ocultarAprobados, rangoHoras, rango, orden, enRoadmap, aprobados, areasDeInteres, nivelPropio]);

  const filtrosActivos =
    areas.length + niveles.length + habilidades.length + (soloConExamen ? 1 : 0) + (soloMiRuta ? 1 : 0) + (ocultarAprobados ? 1 : 0) + (rangoHoras ? 1 : 0);

  function limpiarFiltros() {
    setBusqueda('');
    setAreas([]);
    setNiveles([]);
    setHabilidades([]);
    setSoloConExamen(false);
    setSoloMiRuta(false);
    setOcultarAprobados(false);
    setRangoHoras(null);
  }

  const alternar = <T,>(lista: T[], valor: T) => (lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  const panelFiltros = (
    <div>
      <AccordionSection title="Área" count={areas.length || undefined}>
        <div className="space-y-1.5">
          {Object.entries(conteoPorArea)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([area, n]) => (
              <Casilla key={area} marcado={areas.includes(area)} onChange={() => setAreas(alternar(areas, area))} etiqueta={area} detalle={n} />
            ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Nivel" count={niveles.length || undefined}>
        <div className="space-y-1.5">
          {NIVELES.map((n) => (
            <Casilla key={n.value} marcado={niveles.includes(n.value)} onChange={() => setNiveles(alternar(niveles, n.value))} etiqueta={n.label} detalle={conteoPorNivel[n.value] ?? 0} />
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Duración">
        <RangeSlider min={0} max={horasMaximas} step={1} value={rango} onChange={(v) => setRangoHoras(v[0] === 0 && v[1] === horasMaximas ? null : v)} formatValue={(n) => `${n} h`} />
      </AccordionSection>

      <AccordionSection title="Habilidad" count={habilidades.length || undefined} defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5">
          {(verTodasHabilidades ? habilidadesPopulares : habilidadesPopulares.slice(0, 14)).map(({ nombre, n }) => {
            const activa = habilidades.includes(nombre);
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => setHabilidades(alternar(habilidades, nombre))}
                aria-pressed={activa}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
                  activa
                    ? 'bg-[#12C2A8] text-white border-[#12C2A8]'
                    : 'border-[#E1E6DF] dark:border-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#12C2A8]'
                }`}
              >
                {nombre} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
        {habilidadesPopulares.length > 14 && (
          <button type="button" onClick={() => setVerTodasHabilidades((v) => !v)} className="mt-2 text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">
            {verTodasHabilidades ? 'Ver menos' : `Ver las ${habilidadesPopulares.length}`}
          </button>
        )}
      </AccordionSection>

      <AccordionSection title="Más opciones">
        <div className="space-y-1.5">
          <Casilla marcado={soloConExamen} onChange={() => setSoloConExamen(!soloConExamen)} etiqueta="Solo con examen" />
          {esUsuario && (
            <>
              <Casilla marcado={soloMiRuta} onChange={() => setSoloMiRuta(!soloMiRuta)} etiqueta="Solo los de mi roadmap" detalle={enRoadmap.size} />
              <Casilla marcado={ocultarAprobados} onChange={() => setOcultarAprobados(!ocultarAprobados)} etiqueta="Ocultar los que ya aprobé" detalle={aprobados.size} />
            </>
          )}
        </div>
      </AccordionSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">Catálogo de cursos</h1>
          <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1">
            {cargando ? 'Cargando…' : `${cursos.length} cursos disponibles. Entra a uno para ver su temario, estudiar y presentar su examen.`}
          </p>
        </div>

        {/* ---------- barra de búsqueda y orden ---------- */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <label className="flex-1 flex items-center gap-2.5 bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-xl px-4 py-2.5 focus-within:border-[#0E8A7D] focus-within:ring-2 focus-within:ring-[#0E8A7D]/10 transition-all">
            <svg className="w-4 h-4 text-[#6B7A74] dark:text-[#98B0A6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por curso, tema o habilidad…"
              className="flex-1 min-w-0 bg-transparent text-sm text-[#1F2D2A] dark:text-[#E6EFE9] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] outline-none"
              aria-label="Buscar cursos"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos(true)}
              className="lg:hidden flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer"
            >
              Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
            </button>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              aria-label="Ordenar por"
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer"
            >
              {esUsuario && <option value="recomendado">Recomendados para ti</option>}
              <option value="az">Nombre (A-Z)</option>
              <option value="horas-asc">Más cortos primero</option>
              <option value="horas-desc">Más largos primero</option>
              <option value="nivel">Nivel: de básico a avanzado</option>
            </select>
          </div>
        </div>

        {filtrosActivos > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {areas.map((a) => <Etiqueta key={a} texto={a} onQuitar={() => setAreas(alternar(areas, a))} />)}
            {niveles.map((n) => <Etiqueta key={n} texto={NIVELES.find((x) => x.value === n)!.label} onQuitar={() => setNiveles(alternar(niveles, n))} />)}
            {habilidades.map((h) => <Etiqueta key={h} texto={h} onQuitar={() => setHabilidades(alternar(habilidades, h))} />)}
            {rangoHoras && <Etiqueta texto={`${rango[0]}–${rango[1]} h`} onQuitar={() => setRangoHoras(null)} />}
            {soloConExamen && <Etiqueta texto="Con examen" onQuitar={() => setSoloConExamen(false)} />}
            {soloMiRuta && <Etiqueta texto="De mi roadmap" onQuitar={() => setSoloMiRuta(false)} />}
            {ocultarAprobados && <Etiqueta texto="Sin aprobados" onQuitar={() => setOcultarAprobados(false)} />}
            <button type="button" onClick={limpiarFiltros} className="text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">Limpiar todo</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
          <aside className="hidden lg:block self-start sticky top-20 bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl px-4 max-h-[calc(100vh-6rem)] overflow-y-auto" aria-label="Filtros">
            {panelFiltros}
          </aside>

          <section aria-live="polite">
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-3">
              {visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'}
            </p>

            {error ? (
              <div role="alert" className="rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-6 text-center">
                <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{error}</p>
                <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
              </div>
            ) : cargando ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] animate-pulse" />
                ))}
              </div>
            ) : visibles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E1E6DF] dark:border-[#27403A] p-10 text-center">
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">No encontramos cursos con esos filtros</p>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1 mb-4">Prueba quitando alguno o buscando con otras palabras.</p>
                <Button variant="secondary" size="sm" onClick={limpiarFiltros}>Limpiar filtros</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibles.map((c) => (
                  <CatalogCard key={c.id} course={c} aprobado={aprobados.has(c.id)} enRoadmap={enRoadmap.has(c.id)} onOpen={() => navigate('course-detail', { id: c.id })} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {filtrosAbiertos && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setFiltrosAbiertos(false)}>
          <div className="gl-sheet-up w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#15231F] rounded-t-3xl px-5 pt-4 pb-6" role="dialog" aria-modal="true" aria-label="Filtros" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9]">Filtros</h2>
              <button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7A74] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A] cursor-pointer">✕</button>
            </div>
            {panelFiltros}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={limpiarFiltros}>Limpiar</Button>
              <Button variant="primary" className="flex-1" onClick={() => setFiltrosAbiertos(false)}>Ver {visibles.length} {visibles.length === 1 ? 'curso' : 'cursos'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function contar(valores: string[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const v of valores) conteo[v] = (conteo[v] ?? 0) + 1;
  return conteo;
}

function Casilla({ marcado, onChange, etiqueta, detalle }: { marcado: boolean; onChange: () => void; etiqueta: string; detalle?: number }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] cursor-pointer select-none py-0.5">
      <input type="checkbox" checked={marcado} onChange={onChange} className="w-4 h-4 accent-[#0E8A7D] cursor-pointer" />
      <span className="flex-1 leading-snug">{etiqueta}</span>
      {detalle !== undefined && <span className="text-xs font-mono text-[#6B7A74] dark:text-[#98B0A6]">{detalle}</span>}
    </label>
  );
}

function Etiqueta({ texto, onQuitar }: { texto: string; onQuitar: () => void }) {
  return (
    <button type="button" onClick={onQuitar} aria-label={`Quitar filtro ${texto}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12C2A8]/12 text-[#0B6F65] dark:text-[#5FD3C2] text-xs font-semibold hover:bg-[#12C2A8]/20 cursor-pointer">
      {texto} <span aria-hidden="true">✕</span>
    </button>
  );
}
