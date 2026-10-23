import { useState, type ReactNode } from 'react';
import Button from '../Button';
import type { ExamenObjetivo, RoadmapNode } from '../../utils/roadmapModel';
import { ESTADO_UI } from './estado';

const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

interface NodePanelProps {
  nodo: RoadmapNode;
  /** true cuando es el panel automático del "siguiente paso" (nadie ha tocado nada todavía). */
  sugerido?: boolean;
  onSelectNode: (cursoId: number) => void;
  onTakeExam: (objetivo: ExamenObjetivo) => void;
  onOpenDetail: (cursoId: number) => void;
  onRegenerate: () => void;
  onClose?: () => void;
}

/** Una sección que se abre solo si la persona quiere: así el panel muestra lo esencial y no todo a la vez. */
function Seccion({ titulo, cuenta, children }: { titulo: string; cuenta?: number; children: ReactNode }) {
  return (
    <details className="group border-t border-[#E1E6DF] dark:border-[#27403A]">
      <summary className="flex items-center justify-between gap-3 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] focus-visible:outline-2 focus-visible:outline-[#12C2A8] rounded">
        <span>
          {titulo}
          {cuenta != null && <span className="ml-1.5 text-xs font-medium text-[#6B7A74] dark:text-[#98B0A6]">{cuenta}</span>}
        </span>
        <svg className="w-4 h-4 shrink-0 text-[#6B7A74] dark:text-[#98B0A6] transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

/**
 * Lo que necesita la persona cuando se para en un curso de su camino: qué hacer ahora (estudiarlo o presentar el
 * examen) y por qué está ahí. El resto (temario, habilidades, requisitos, otras opciones) queda a un toque.
 */
export default function NodePanel({ nodo, sugerido, onSelectNode, onTakeExam, onOpenDetail, onRegenerate, onClose }: NodePanelProps) {
  const [temarioCompleto, setTemarioCompleto] = useState(false);
  const ui = ESTADO_UI[nodo.status];
  const puedeExamen = (nodo.status === 'current' || nodo.status === 'available') && nodo.tieneExamen;
  const temario = temarioCompleto ? nodo.temario : nodo.temario.slice(0, 5);
  const aprobadoYDadoDeBaja = nodo.status === 'completed' && nodo.dadoDeBaja;
  const alternativas = nodo.status !== 'completed' ? nodo.alternativas : [];
  const sobreElCurso = Boolean(nodo.descripcion) || nodo.temario.length > 0;

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${ui.chip}`}>{sugerido && nodo.status === 'current' ? 'Tu siguiente paso' : ui.etiqueta}</span>
            {aprobadoYDadoDeBaja && (
              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${ESTADO_UI.unavailable.chip}`}>Ya no está disponible</span>
            )}
          </div>
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

      {/* ---- qué hacer ahora ---- */}
      <div className="mt-4 space-y-2.5">
        {nodo.status === 'completed' && (
          <p className="rounded-xl bg-[#4CE07E]/15 text-[#15803D] dark:text-[#4CE07E] text-sm font-semibold px-3.5 py-2.5">
            ✓ {nodo.cumplidoCon ? <>Cumpliste este paso con «{nodo.cumplidoCon.titulo}».</> : 'Ya aprobaste este curso.'} Sus habilidades están desbloqueadas.
          </p>
        )}

        {aprobadoYDadoDeBaja && (
          <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#2A1111] border border-[#FECACA] dark:border-[#4C1D1D] p-3.5">
            <p className="text-sm font-semibold text-[#DC2626] dark:text-[#F87171]">Este curso se dio de baja</p>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">
              Lo aprobaste y ese avance se conserva, pero ya no se recomienda. Actualiza tu roadmap para ver opciones activas.
            </p>
            <Button className="mt-2.5" size="sm" variant="primary" onClick={onRegenerate}>
              Actualizar mi roadmap
            </Button>
          </div>
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
            {nodo.tieneExamen && (
              <div className="mt-3 pt-3 border-t border-[#E1E6DF] dark:border-[#27403A]">
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] leading-relaxed">
                  ¿Ya sabes esto? Presenta el examen y salta este curso: si lo apruebas, queda completado y se abre lo que sigue.
                </p>
                <Button className="mt-2" size="sm" variant="secondary" onClick={() => onTakeExam(nodo)}>
                  Ya lo sé: presentar examen
                </Button>
              </div>
            )}
          </div>
        )}

        {(nodo.status === 'current' || nodo.status === 'available') && (
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
              <Button className="flex-1" variant="gradient" onClick={() => onTakeExam(nodo)} title="Se aprueba con 70 % o más; al aprobarlo el curso queda completado">
                Presentar examen
              </Button>
            )}
          </div>
        )}
      </div>

      {nodo.razon && (
        <p className="mt-4 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed">
          <span className="font-semibold text-[#B45309] dark:text-[#FBBF24]">Por qué está en tu ruta · </span>
          {nodo.razon}
        </p>
      )}

      {/* ---- el resto, a un toque ---- */}
      <div className="mt-4 border-b border-[#E1E6DF] dark:border-[#27403A]">
        {sobreElCurso && (
          <Seccion titulo="Sobre el curso">
            {nodo.descripcion && <p className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-relaxed">{nodo.descripcion}</p>}
            {nodo.temario.length > 0 && (
              <div className={nodo.descripcion ? 'mt-4' : ''}>
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
              </div>
            )}
          </Seccion>
        )}

        {nodo.habilidades.length > 0 && (
          <Seccion titulo="Habilidades que desbloqueas" cuenta={nodo.habilidades.length}>
            <div className="flex flex-wrap gap-1.5">
              {nodo.habilidades.map((h) => (
                <span key={h} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">
                  {h}
                </span>
              ))}
            </div>
          </Seccion>
        )}

        {nodo.prerequisitos.length > 0 && nodo.status !== 'locked' && (
          <Seccion titulo="Viene después de" cuenta={nodo.prerequisitos.length}>
            <ul className="space-y-1">
              {nodo.prerequisitos.map((p) => (
                <li key={p.cursoId}>
                  <button type="button" onClick={() => onSelectNode(p.cursoId)} className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] hover:underline cursor-pointer text-left">
                    <span className={p.hecho ? 'text-[#15803D]' : 'text-[#6B7A74]'}>{p.hecho ? '✓' : '○'}</span> {p.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {alternativas.length > 0 && (
          <Seccion titulo="Otras opciones para este paso" cuenta={alternativas.length}>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-2.5">
              Estos cursos cubren lo mismo que «{nodo.titulo}». Escoge el que prefieras: si apruebas su examen, este paso queda cumplido.
            </p>
            <ul className="space-y-2">
              {alternativas.map((alt) => (
                <li key={alt.cursoId} className="rounded-xl border border-[#E1E6DF] dark:border-[#27403A] p-3 bg-white dark:bg-[#1A2C27]">
                  <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{alt.titulo}</p>
                  <p className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">
                    {NIVEL_TEXTO[alt.nivel]}
                    {alt.horas != null && ` · ${alt.horas} h`}
                  </p>
                  {alt.habilidades.length > 0 && <p className="text-[11px] text-[#0B6F65] dark:text-[#5FD3C2] mt-1">Cubre: {alt.habilidades.join(', ')}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                    {alt.tieneExamen && (
                      <Button size="sm" variant="secondary" onClick={() => onTakeExam({ cursoId: alt.cursoId, titulo: alt.titulo, link: alt.link, paso: nodo.titulo })}>
                        Presentar su examen
                      </Button>
                    )}
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
          </Seccion>
        )}
      </div>

      <button type="button" onClick={() => onOpenDetail(nodo.cursoId)} className="mt-4 text-sm font-medium text-[#0E8A7D] dark:text-[#5FD3C2] hover:underline cursor-pointer">
        Ver la ficha completa del curso →
      </button>
    </div>
  );
}
