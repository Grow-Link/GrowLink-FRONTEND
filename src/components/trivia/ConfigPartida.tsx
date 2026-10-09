import { CATEGORIAS_CURSOS } from '../../services/cursosServiceApi';
import type { TriviaQuestionCount, TriviaSecondsPerQuestion } from '../../types';

export interface ConfigPartida {
  categoria: string;
  numPreguntas: TriviaQuestionCount;
  duracionSegundos: TriviaSecondsPerQuestion;
}

export const CONFIG_INICIAL: ConfigPartida = { categoria: '', numPreguntas: 10, duracionSegundos: 15 };

const PREGUNTAS: TriviaQuestionCount[] = [5, 10, 15];
const SEGUNDOS: TriviaSecondsPerQuestion[] = [10, 15, 20];

interface Props {
  valor: ConfigPartida;
  onChange: (siguiente: ConfigPartida) => void;
}

/** Categoría, número de preguntas y tiempo por pregunta: lo mismo para crear una sala o para retar a alguien. */
export default function ConfigPartidaForm({ valor, onChange }: Props) {
  const boton = (activo: boolean) =>
    `py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
      activo ? 'border-[#0E8A7D] bg-[#0E8A7D]/10 text-[#0E8A7D] dark:text-[#5FD3C2]' : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#0E8A7D]/40'
    }`;

  return (
    <div className="space-y-5">
      <div>
        <p className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider mb-2.5">Categoría</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIAS_CURSOS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ ...valor, categoria: cat })}
              aria-pressed={valor.categoria === cat}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer ${
                valor.categoria === cat
                  ? 'border-[#12C2A8] bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]'
                  : 'border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-[#1F2D2A] dark:text-[#E6EFE9] hover:border-[#0E8A7D]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider mb-2.5">Preguntas</p>
          <div className="grid grid-cols-3 gap-2">
            {PREGUNTAS.map((n) => (
              <button key={n} type="button" onClick={() => onChange({ ...valor, numPreguntas: n })} aria-pressed={valor.numPreguntas === n} className={boton(valor.numPreguntas === n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono uppercase tracking-wider mb-2.5">Segundos c/u</p>
          <div className="grid grid-cols-3 gap-2">
            {SEGUNDOS.map((s) => (
              <button key={s} type="button" onClick={() => onChange({ ...valor, duracionSegundos: s })} aria-pressed={valor.duracionSegundos === s} className={boton(valor.duracionSegundos === s)}>
                {s}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
