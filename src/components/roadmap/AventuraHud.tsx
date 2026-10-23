import { useState } from 'react';
import Button from '../Button';
import { horasParaSubir, logrosDe, rangoDe } from '../../utils/motivacion';
import type { RoadmapView } from '../../utils/roadmapModel';

interface Props {
  vista: RoadmapView;
  onSelect: (cursoId: number) => void;
  onNuevaMeta: () => void;
}

/**
 * Tu avance en una sola franja: nivel, barra (en horas aprobadas) y logros. Todo sale del avance real; no hay números
 * inventados. Los logros se abren a un toque; la misión de ahora vive en el panel del curso (y en esta franja solo en
 * el teléfono, donde el panel no está a la vista).
 */
export default function AventuraHud({ vista, onSelect, onNuevaMeta }: Props) {
  const [verLogros, setVerLogros] = useState(false);
  const rango = rangoDe(vista);
  const subir = horasParaSubir(vista);
  const logros = logrosDe(vista);
  const conseguidos = logros.filter((l) => l.conseguido).length;
  const { progreso } = vista;
  const mision = vista.siguiente;
  const terminado = progreso.total > 0 && progreso.completados === progreso.total;
  const pctHoras = progreso.horasTotales > 0 ? Math.round((progreso.horasHechas / progreso.horasTotales) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] p-3.5 sm:p-4" aria-label="Tu progreso">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl gl-gradient text-white flex flex-col items-center justify-center shrink-0">
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest leading-none opacity-90">Nivel</span>
            <span className="text-lg font-display font-extrabold leading-none mt-0.5">{rango.numero}</span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight">{rango.nombre}</p>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
              {subir ? `${subir.horas} h para «${subir.hacia}»` : terminado ? 'Llegaste al último nivel' : 'Aprueba un curso para subir de nivel'}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-[190px]">
          <div className="flex items-center justify-between gap-3 text-xs font-mono text-[#6B7A74] dark:text-[#98B0A6] mb-1.5">
            <span>{progreso.completados} de {progreso.total} cursos</span>
            <span>{progreso.horasHechas} / {progreso.horasTotales} h</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#EDF1EA] dark:bg-[#27403A] overflow-hidden" role="progressbar" aria-valuenow={pctHoras} aria-valuemin={0} aria-valuemax={100} aria-label="Horas aprobadas">
            <div className="h-full rounded-full gl-gradient transition-all duration-700" style={{ width: `${Math.max(pctHoras, progreso.completados > 0 ? 4 : 0)}%` }} />
          </div>
        </div>

        <button
          type="button"
          aria-expanded={verLogros}
          onClick={() => setVerLogros((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E1E6DF] dark:border-[#27403A] px-3 py-1.5 text-xs font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#F5A524] cursor-pointer transition-colors"
        >
          <span className="text-[#F5A524]" aria-hidden="true">★</span>
          Logros {conseguidos}/{logros.length}
          <svg className={`w-3.5 h-3.5 transition-transform ${verLogros ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {terminado && (
          <Button size="sm" variant="gradient" onClick={onNuevaMeta}>
            Definir una nueva meta
          </Button>
        )}
      </div>

      {verLogros && (
        <div className="mt-3.5 pt-3.5 border-t border-[#E1E6DF] dark:border-[#27403A] gl-fade-up">
          <ul className="flex flex-wrap gap-2">
            {logros.map((l) => (
              <li
                key={l.id}
                title={l.conseguido ? l.titulo : l.pista}
                className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-xs font-medium border ${
                  l.conseguido
                    ? 'bg-[#F5A524]/15 border-[#F5A524]/50 text-[#B45309] dark:text-[#FBBF24]'
                    : 'bg-[#F6F7F2] dark:bg-[#1A2C27] border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${l.conseguido ? 'bg-[#F5A524] text-white' : 'bg-[#E1E6DF] dark:bg-[#27403A]'}`}>
                  {l.conseguido ? '★' : '·'}
                </span>
                {l.titulo}
                {!l.conseguido && <span className="hidden sm:inline font-normal opacity-80">· {l.pista}</span>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-2.5">
            {progreso.habilidadesDesbloqueadas.length} de {progreso.habilidadesTotales.length} habilidades desbloqueadas
          </p>
        </div>
      )}

      {mision && (
        <button
          type="button"
          onClick={() => onSelect(mision.cursoId)}
          className="lg:hidden mt-3.5 w-full text-left rounded-xl bg-[#FBF3E4] dark:bg-[#3A2A0D]/60 border border-[#F5A524]/40 px-3.5 py-2.5 cursor-pointer"
        >
          <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#B45309] dark:text-[#FBBF24]">Tu siguiente paso</span>
          <span className="block font-display font-bold text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug mt-0.5">{mision.titulo}</span>
        </button>
      )}
    </section>
  );
}
