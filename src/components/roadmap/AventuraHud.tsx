import Button from '../Button';
import { horasParaSubir, logrosDe, loQueAbre, mensajeDelMomento, rangoDe } from '../../utils/motivacion';
import type { RoadmapNode, RoadmapView } from '../../utils/roadmapModel';

interface Props {
  vista: RoadmapView;
  onSelect: (cursoId: number) => void;
  onTakeExam: (nodo: RoadmapNode) => void;
  onNuevaMeta: () => void;
}

/**
 * La parte de "juego" del roadmap: tu nivel, la barra de avance (en horas aprobadas), la misión de ahora con lo
 * que se abre al cumplirla, y los logros. Todo sale del avance real; no hay números inventados.
 */
export default function AventuraHud({ vista, onSelect, onTakeExam, onNuevaMeta }: Props) {
  const rango = rangoDe(vista);
  const subir = horasParaSubir(vista);
  const logros = logrosDe(vista);
  const conseguidos = logros.filter((l) => l.conseguido).length;
  const { progreso } = vista;
  const mision = vista.siguiente;
  const abre = mision ? loQueAbre(mision, vista) : [];
  const terminado = progreso.total > 0 && progreso.completados === progreso.total;
  const pctHoras = progreso.horasTotales > 0 ? Math.round((progreso.horasHechas / progreso.horasTotales) * 100) : 0;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4" aria-label="Tu progreso">
      {/* ---------- nivel, avance y logros ---------- */}
      <div className="rounded-2xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl gl-gradient text-white flex flex-col items-center justify-center shrink-0 gl-glow-teal">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest leading-none opacity-90">Nivel</span>
            <span className="text-2xl font-display font-extrabold leading-none mt-0.5">{rango.numero}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight">{rango.nombre}</p>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
              {subir ? `${subir.horas} h para llegar a «${subir.hacia}»` : terminado ? 'Llegaste al último nivel' : 'Aprueba tu primer curso para subir de nivel'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-extrabold text-2xl text-[#0E8A7D] dark:text-[#5FD3C2] leading-none">{progreso.porcentaje}%</p>
            <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] mt-1">de la ruta</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7A74] dark:text-[#98B0A6] mb-1.5">
            <span>
              {progreso.horasHechas} / {progreso.horasTotales} h
            </span>
            <span>
              {progreso.completados} de {progreso.total} cursos · {progreso.habilidadesDesbloqueadas.length} de {progreso.habilidadesTotales.length} habilidades
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#EDF1EA] dark:bg-[#27403A] overflow-hidden" role="progressbar" aria-valuenow={pctHoras} aria-valuemin={0} aria-valuemax={100} aria-label="Horas aprobadas">
            <div className="h-full rounded-full gl-gradient transition-all duration-700" style={{ width: `${Math.max(pctHoras, progreso.completados > 0 ? 4 : 0)}%` }} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2">
            Logros · {conseguidos} de {logros.length}
          </p>
          <ul className="flex flex-wrap gap-2">
            {logros.map((l) => (
              <li
                key={l.id}
                title={l.conseguido ? l.titulo : l.pista}
                className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-xs font-medium border ${
                  l.conseguido
                    ? 'bg-[#F5A524]/15 border-[#F5A524]/50 text-[#B45309] dark:text-[#FBBF24]'
                    : 'bg-[#F6F7F2] dark:bg-[#1A2C27] border-[#E1E6DF] dark:border-[#27403A] text-[#98A39E] dark:text-[#6B7A74]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${l.conseguido ? 'bg-[#F5A524] text-white' : 'bg-[#E1E6DF] dark:bg-[#27403A]'}`}>
                  {l.conseguido ? '★' : '·'}
                </span>
                {l.titulo}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- la misión de ahora ---------- */}
      <div className="rounded-2xl border-2 border-[#F5A524]/70 bg-gradient-to-br from-[#FFFBEB] to-[#FBF3E4] dark:from-[#3A2A0D]/70 dark:to-[#2A200B]/70 p-4 sm:p-5 flex flex-col">
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#B45309] dark:text-[#FBBF24]">{terminado ? 'Ruta completada' : 'Misión actual'}</p>
        <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1.5 leading-relaxed">{mensajeDelMomento(vista)}</p>

        {mision ? (
          <>
            <button
              type="button"
              onClick={() => onSelect(mision.cursoId)}
              className="mt-3 text-left rounded-xl bg-white/80 dark:bg-[#15231F]/80 border border-[#F5A524]/40 px-3.5 py-3 hover:border-[#F5A524] transition-colors cursor-pointer"
            >
              <span className="block font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{mision.titulo}</span>
              <span className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">
                {mision.horas != null ? `${mision.horas} h · ` : ''}
                {mision.tieneExamen ? 'con examen, se aprueba con 70%' : 'sin examen todavía'}
              </span>
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/60 dark:bg-[#15231F]/60 px-2.5 py-2">
                <p className="font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6]">Al cumplirla</p>
                <p className="text-[#1F2D2A] dark:text-[#E6EFE9] mt-0.5 leading-snug">
                  {mision.horas != null ? `+${mision.horas} h de avance` : 'Sube tu avance'}
                  {mision.habilidades.length > 0 && ` y ${mision.habilidades.length} ${mision.habilidades.length === 1 ? 'habilidad' : 'habilidades'}`}
                </p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-[#15231F]/60 px-2.5 py-2">
                <p className="font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6]">Se abre</p>
                <p className="text-[#1F2D2A] dark:text-[#E6EFE9] mt-0.5 leading-snug line-clamp-2">
                  {abre.length > 0 ? abre.map((n) => n.titulo).join(', ') : 'Es un tramo final de tu ruta'}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-3 flex flex-wrap gap-2">
              {mision.link && (
                <a
                  href={mision.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0E8A7D] text-white hover:bg-[#0B7368] transition-colors"
                >
                  Ir al curso <span aria-hidden="true">↗</span>
                </a>
              )}
              {mision.tieneExamen && (
                <Button variant="gradient" size="md" onClick={() => onTakeExam(mision)}>
                  Presentar examen
                </Button>
              )}
            </div>
          </>
        ) : terminado ? (
          <div className="mt-auto pt-3">
            <Button variant="gradient" onClick={onNuevaMeta}>
              Definir una nueva meta
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
