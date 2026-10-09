import { useCallback, useEffect, useState } from 'react';
import Button from './Button';
import Confetti from './Confetti';
import { obtenerExamen, presentarExamen, type Examen, type ResultadoExamen } from '../services/cursosServiceApi';

interface ExamModalProps {
  cursoId: number | string;
  titulo: string;
  onClose: () => void;
  /** Se llama cuando la persona aprobó (el curso ya quedó completado en el servidor). */
  onApproved?: (resultado: ResultadoExamen) => void;
  /** Enlace al contenido del curso, para repasar si no aprobó. */
  linkContenido?: string | null;
}

const LETRAS = ['A', 'B', 'C', 'D'];

/**
 * El examen de un curso: es la única forma de completarlo. Las preguntas se muestran de a una, y la
 * calificación la hace el servidor (aquí nunca se conoce la respuesta correcta).
 */
export default function ExamModal({ cursoId, titulo, onClose, onApproved, linkContenido }: ExamModalProps) {
  const [examen, setExamen] = useState<Examen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);

  const cargar = useCallback(() => {
    setExamen(null);
    setError(null);
    setResultado(null);
    setIndice(0);
    obtenerExamen(cursoId)
      .then((e) => {
        setExamen(e);
        setRespuestas(e.preguntas.map(() => -1));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No pudimos cargar el examen.'));
  }, [cursoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !enviando) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onClose]);

  async function enviar() {
    if (!examen) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await presentarExamen(cursoId, respuestas);
      setResultado(r);
      if (r.aprobado) onApproved?.(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tus respuestas.');
    } finally {
      setEnviando(false);
    }
  }

  const pregunta = examen?.preguntas[indice];
  const esUltima = examen ? indice === examen.preguntas.length - 1 : false;
  const contestadas = respuestas.filter((r) => r >= 0).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Examen de ${titulo}`}>
      {resultado?.aprobado && <Confetti />}
      <div className="gl-sheet-up w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#15231F] rounded-t-3xl sm:rounded-3xl border border-[#E1E6DF] dark:border-[#27403A] shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 sm:px-7 pt-5 pb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#12C2A8]">Examen del curso</p>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar examen"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#6B7A74] dark:text-[#98B0A6] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A] cursor-pointer disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <div className="px-5 sm:px-7 pb-6">
          {error && !resultado && (
            <div className="rounded-xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-4 text-sm text-[#DC2626] dark:text-[#F87171]">
              {error}
              <div className="mt-3 flex gap-2">
                {!examen && <Button size="sm" variant="secondary" onClick={cargar}>Reintentar</Button>}
                <Button size="sm" variant="ghost" onClick={onClose}>Cerrar</Button>
              </div>
            </div>
          )}

          {!examen && !error && (
            <p className="py-10 text-center text-sm text-[#6B7A74] dark:text-[#98B0A6]">Preparando tu examen…</p>
          )}

          {examen?.yaCompletado && !resultado && (
            <div className="py-8 text-center">
              <p className="text-4xl">🎓</p>
              <p className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">Ya aprobaste este curso</p>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1">Quedó guardado en tus cursos completados.</p>
              <Button className="mt-5" variant="primary" onClick={onClose}>Seguir</Button>
            </div>
          )}

          {examen && !examen.yaCompletado && !resultado && pregunta && (
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-2">
                <span>
                  Pregunta {indice + 1} de {examen.preguntas.length}
                </span>
                <span>Necesitas {examen.minimoAprobacion}% para aprobar</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#EDF1EA] dark:bg-[#27403A] overflow-hidden mb-5">
                <div className="h-full gl-gradient transition-all duration-300" style={{ width: `${((indice + 1) / examen.preguntas.length) * 100}%` }} />
              </div>

              <p className="font-display font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] text-base sm:text-lg leading-snug mb-4">{pregunta.enunciado}</p>
              <div className="space-y-2.5" role="radiogroup" aria-label="Opciones">
                {pregunta.opciones.map((op, i) => {
                  const elegida = respuestas[indice] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={elegida}
                      onClick={() => setRespuestas((prev) => prev.map((r, k) => (k === indice ? i : r)))}
                      className={`w-full flex items-start gap-3 text-left rounded-xl border-2 px-4 py-3 transition-all cursor-pointer ${
                        elegida
                          ? 'border-[#12C2A8] bg-[#12C2A8]/10'
                          : 'border-[#E1E6DF] dark:border-[#27403A] hover:border-[#0E8A7D]/50 bg-white dark:bg-[#1A2C27]'
                      }`}
                    >
                      <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${elegida ? 'bg-[#12C2A8] text-white' : 'bg-[#EDF1EA] dark:bg-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]'}`}>
                        {LETRAS[i]}
                      </span>
                      <span className="text-sm text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug">{op}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button variant="ghost" onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0 || enviando}>
                  Anterior
                </Button>
                {esUltima ? (
                  <Button variant="gradient" onClick={enviar} disabled={enviando || contestadas < examen.preguntas.length}>
                    {enviando ? 'Calificando…' : 'Enviar examen'}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setIndice((i) => i + 1)} disabled={respuestas[indice] < 0}>
                    Siguiente
                  </Button>
                )}
              </div>
              {esUltima && contestadas < examen.preguntas.length && (
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-3 text-right">Contesta todas las preguntas para enviarlo.</p>
              )}
            </div>
          )}

          {resultado && (
            <div className="py-6 text-center">
              <div className={`gl-score-pop mx-auto w-24 h-24 rounded-full flex flex-col items-center justify-center text-white ${resultado.aprobado ? 'gl-gradient gl-glow-teal' : 'bg-[#F2704E]'}`}>
                <span className="text-3xl font-display font-extrabold leading-none">{resultado.porcentaje}%</span>
                <span className="text-[11px] opacity-90 mt-1">
                  {resultado.aciertos}/{resultado.total}
                </span>
              </div>
              {resultado.aprobado ? (
                <>
                  <h3 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-5">¡Aprobaste!</h3>
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1">
                    {resultado.cursoCompletado ? 'El curso quedó completado y tus habilidades desbloqueadas.' : 'Este curso ya estaba completado.'}
                  </p>
                  <Button className="mt-6" variant="gradient" onClick={onClose}>Seguir con mi ruta</Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-5">Casi lo logras</h3>
                  <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1 max-w-sm mx-auto">
                    Necesitabas {resultado.minimoAprobacion}% y sacaste {resultado.porcentaje}%. Repasa el contenido y vuelve a intentarlo: no hay límite de intentos.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                    {linkContenido && (
                      <a href={linkContenido} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#E1E6DF] dark:border-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9] hover:bg-[#EDF1EA] dark:hover:bg-[#27403A]">
                        Repasar el contenido ↗
                      </a>
                    )}
                    <Button variant="primary" onClick={cargar}>Intentar de nuevo</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
