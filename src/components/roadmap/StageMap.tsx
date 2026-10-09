import type { RoadmapNode, Stage } from '../../utils/roadmapModel';
import { ESTADO_UI, IconoEstado } from './estado';

const NIVEL_TEXTO: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

// cada etapa tiene su propio tono, de más fresco a más cálido, para sentir que se avanza
const TONOS_ETAPA = [
  'from-[#0E8A7D] to-[#12C2A8]',
  'from-[#12C2A8] to-[#4CE07E]',
  'from-[#4CE07E] to-[#F5A524]',
  'from-[#F5A524] to-[#F2704E]',
];

interface StageMapProps {
  stages: Stage[];
  selectedId: number | null;
  onSelect: (cursoId: number) => void;
}

/**
 * El mapa por etapas: cada etapa es un tramo del camino, con sus cursos como paradas. Arriba de cada tramo se ve
 * cuánto se lleva avanzado; al tocar una parada se abre su detalle (por qué está ahí, qué hacer, dónde estudiar).
 */
export default function StageMap({ stages, selectedId, onSelect }: StageMapProps) {
  let numero = 0;
  return (
    <ol className="space-y-6">
      {stages.map((etapa) => {
        const todoHecho = etapa.completados === etapa.nodes.length;
        return (
          <li key={etapa.index} className="relative">
            {etapa.index < stages.length - 1 && (
              <span aria-hidden="true" className="hidden sm:block absolute left-[19px] top-14 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#12C2A8]/60 to-[#12C2A8]/10" />
            )}
            <div className="flex items-center gap-3 mb-3">
              <span className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${TONOS_ETAPA[Math.min(etapa.index, TONOS_ETAPA.length - 1)]} text-white font-display font-extrabold flex items-center justify-center shadow-md`}>
                {todoHecho ? '✓' : etapa.index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-tight">
                  Etapa {etapa.index + 1} · {etapa.nombre}
                </h3>
                <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{etapa.descripcion}</p>
              </div>
              <span className="shrink-0 text-xs font-mono font-semibold text-[#6B7A74] dark:text-[#98B0A6]">
                {etapa.completados}/{etapa.nodes.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:pl-[52px]">
              {etapa.nodes.map((nodo) => {
                numero += 1;
                return <TarjetaCurso key={nodo.cursoId} nodo={nodo} numero={numero} seleccionado={selectedId === nodo.cursoId} onSelect={onSelect} />;
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TarjetaCurso({ nodo, numero, seleccionado, onSelect }: { nodo: RoadmapNode; numero: number; seleccionado: boolean; onSelect: (id: number) => void }) {
  const ui = ESTADO_UI[nodo.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(nodo.cursoId)}
      aria-pressed={seleccionado}
      className={`text-left rounded-2xl border-2 p-3.5 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${ui.tarjeta} ${
        seleccionado ? 'ring-2 ring-offset-2 ring-[#0E8A7D] ring-offset-[#F6F7F2] dark:ring-offset-[#0E1815]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <IconoEstado status={nodo.status} numero={numero} />
        <div className="min-w-0 flex-1">
          <p className={`font-display font-semibold leading-snug text-[#1F2D2A] dark:text-[#E6EFE9] ${nodo.status === 'locked' ? 'opacity-70' : ''}`}>{nodo.titulo}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">
            <span>{NIVEL_TEXTO[nodo.nivel]}</span>
            {nodo.horas != null && (
              <>
                <span aria-hidden="true">·</span>
                <span>{nodo.horas} h</span>
              </>
            )}
            {nodo.tieneExamen && (
              <>
                <span aria-hidden="true">·</span>
                <span>con examen</span>
              </>
            )}
          </div>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[11px] font-semibold ${ui.chip}`}>{ui.etiqueta}</span>
        </div>
      </div>
    </button>
  );
}
