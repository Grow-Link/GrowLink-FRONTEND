import { useState } from 'react';
import Button from '../Button';
import type { RoadmapNode } from '../../utils/roadmapModel';
import { ESTADO_UI } from './estado';

const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

interface NodePanelProps {
  nodo: RoadmapNode;
  /** true cuando es el panel automático del "siguiente paso" (nadie ha tocado nada todavía). */
  sugerido?: boolean;
  onSelectNode: (cursoId: number) => void;
  onTakeExam: (nodo: RoadmapNode) => void;
  onOpenDetail: (cursoId: number) => void;
  onRegenerate: () => void;
  onClose?: () => void;
}

/**
 * Lo que necesita la persona cuando se para en un curso de su camino: por qué está ahí, qué hacer ahora
 * (estudiarlo o presentar el examen), y qué otras opciones tiene para ese mismo paso. Todo sin salir del roadmap.
 */
export default function NodePanel({ nodo, sugerido, onSelectNode, onTakeExam, onOpenDetail, onRegenerate, onClose }: NodePanelProps) {
  const [temarioCompleto, setTemarioCompleto] = useState(false);
  const ui = ESTADO_UI[nodo.status];
  const puedeExamen = (nodo.status === 'current' || nodo.status === 'available') && nodo.tieneExamen;
  const temario = temarioCompleto ? nodo.temario : nodo.temario.slice(0, 5);

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${ui.chip}`}>{sugerido ? 'Tu siguiente paso' : ui.etiqueta}</span>
          <h2 className="font-display font-bold text-xl text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug mt-2">{nodo.titulo}</h2>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">
            {nodo.categoria} · {NIVEL_TEXTO[nodo.nivel]}
            {nodo.horas != null && ` · ${nodo.horas} horas`}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="lg:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#6B7A74] dark:text-[#98B0A6] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A] cursor-pointer">
            ✕
          </button>
        )}
      </div>

      {nodo.razon && (
        <div className="mt-4 rounded-xl bg-[#FBF3E4] dark:bg-[#3A2A0D]/50 border border-[#F5A524]/30 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B45309] dark:text-[#FBBF24]">Por qué está en tu ruta</p>
          <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] mt-1 leading-relaxed">{nodo.razon}</p>
        </div>
      )}

      {/* ---- qué hacer ahora ---- */}
      <div className="mt-4 space-y-2.5">
        {nodo.status === 'completed' && (
          <p className="rounded-xl bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E] text-sm font-semibold px-3.5 py-2.5">
            ✓ Ya aprobaste este curso. Sus habilidades están desbloqueadas.
          </p>
        )}

        {nodo.status === 'unavailable' && (
          <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#2A1111] border border-[#FECACA] dark:border-[#4C1D1D] p-3.5">
            <p className="text-sm font-semibold text-[#DC2626] dark:text-[#F87171]">Este curso ya no está disponible</p>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">Quien lo publicó lo dio de baja. Actualiza tu roadmap y lo reemplazamos por otra opción.</p>
            <Button className="mt-2.5" size="sm" variant="primary" onClick={onRegenerate}>
              Actualizar mi roadmap
            </Button>
          </div>
        )}

        {nodo.status === 'locked' && (
          <div className="rounded-xl bg-[#EDF1EA] dark:bg-[#1A2C27] p-3.5">
            <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">Antes necesitas aprobar:</p>
            <ul className="mt-1.5 space-y-1">
              {nodo.prerequisitos
                .filter((p) => !p.hecho)
                .map((p) => (
                  <li key={p.cursoId}>
                    <button type="button" onClick={() => onSelectNode(p.cursoId)} className="text-sm text-[#0E8A7D] dark:text-[#5FD3C2] font-medium hover:underline cursor-pointer text-left">
                      → {p.titulo}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {(nodo.status === 'current' || nodo.status === 'available') && (
          <>
            <div className="flex flex-col sm:flex-row gap-2.5">
              {nodo.link ? (
                <a
                  href={nodo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0E8A7D] text-white hover:bg-[#0B7368] transition-colors"
                >
                  Ir al curso <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <p className="flex-1 text-xs text-[#6B7A74] dark:text-[#98B0A6] self-center">Este curso aún no tiene enlace de contenido.</p>
              )}
              {puedeExamen && (
                <Button className="flex-1" variant="gradient" onClick={() => onTakeExam(nodo)}>
                  Presentar examen
                </Button>
              )}
            </div>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">
              Estudia el contenido en el enlace y, cuando te sientas listo, presenta el examen aquí mismo: al aprobarlo, el curso queda completado y tu roadmap avanza.
            </p>
          </>
        )}

        <button type="button" onClick={() => onOpenDetail(nodo.cursoId)} className="text-sm font-medium text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">
          Ver la ficha completa del curso →
        </button>
      </div>

      {nodo.descripcion && <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed mt-5">{nodo.descripcion}</p>}

      {nodo.temario.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2">Temario</h3>
          <ol className="space-y-1.5">
            {temario.map((tema, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-[#1F2D2A] dark:text-[#E6EFE9]">
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[#12C2A8]/15 text-[#0B6F65] dark:text-[#5FD3C2] text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="leading-snug">{tema}</span>
              </li>
            ))}
          </ol>
          {nodo.temario.length > 5 && (
            <button type="button" onClick={() => setTemarioCompleto((v) => !v)} className="mt-2 text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">
              {temarioCompleto ? 'Ver menos' : `Ver los ${nodo.temario.length} temas`}
            </button>
          )}
        </section>
      )}

      {nodo.habilidades.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2">Habilidades que desbloqueas</h3>
          <div className="flex flex-wrap gap-1.5">
            {nodo.habilidades.map((h) => (
              <span key={h} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">
                {h}
              </span>
            ))}
          </div>
        </section>
      )}

      {nodo.prerequisitos.length > 0 && nodo.status !== 'locked' && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-2">Viene después de</h3>
          <ul className="space-y-1">
            {nodo.prerequisitos.map((p) => (
              <li key={p.cursoId}>
                <button type="button" onClick={() => onSelectNode(p.cursoId)} className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] hover:underline cursor-pointer text-left">
                  <span className={p.hecho ? 'text-[#15803D]' : 'text-[#6B7A74]'}>{p.hecho ? '✓' : '○'}</span> {p.titulo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nodo.alternativas.length > 0 && nodo.status !== 'completed' && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B7A74] dark:text-[#98B0A6] mb-1">Otras opciones para este paso</h3>
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-2.5">Cursos del catálogo que trabajan lo mismo, por si prefieres otro estilo.</p>
          <ul className="space-y-2">
            {nodo.alternativas.map((alt) => (
              <li key={alt.cursoId} className="rounded-xl border border-[#E1E6DF] dark:border-[#27403A] p-3 bg-white dark:bg-[#1A2C27]">
                <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{alt.titulo}</p>
                <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
                  {NIVEL_TEXTO[alt.nivel]}
                  {alt.horas != null && ` · ${alt.horas} h`}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {alt.link && (
                    <a href={alt.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline">
                      Ir al curso ↗
                    </a>
                  )}
                  <button type="button" onClick={() => onOpenDetail(alt.cursoId)} className="text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] hover:underline cursor-pointer">
                    Ver ficha
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
