import { useRef, type MouseEvent } from 'react';
import CourseArt from './CourseArt';
import type { Course } from '../types';

const NIVEL_TEXTO: Record<Course['level'], string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const NIVEL_PUNTOS: Record<Course['level'], number> = { principiante: 1, intermedio: 2, avanzado: 3 };

interface CatalogCardProps {
  course: Course;
  aprobado?: boolean;
  enRoadmap?: boolean;
  onOpen: () => void;
}

/**
 * Una tarjeta del catálogo: toda ella es el acceso a la ficha del curso, sin botones sueltos. Muestra lo que
 * ayuda a decidir (área, nivel, horas, temas, examen, habilidades) y marca lo que ya es parte de tu camino.
 */
export default function CatalogCard({ course, aprobado, enRoadmap, onOpen }: CatalogCardProps) {
  const tarjeta = useRef<HTMLButtonElement>(null);

  // la tarjeta se inclina un poco hacia el cursor y el brillo de la ilustración lo sigue (sin re-renderizar)
  function alMover(e: MouseEvent<HTMLButtonElement>) {
    const el = tarjeta.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--lift', '-3px');
  }

  function alSalir() {
    const el = tarjeta.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--lift', '0px');
  }

  const temas = course.syllabus?.length ?? 0;
  const habilidades = course.skills.slice(0, 3);
  const extra = course.skills.length - habilidades.length;

  return (
    <button
      ref={tarjeta}
      type="button"
      onClick={onOpen}
      onMouseMove={alMover}
      onMouseLeave={alSalir}
      className="gl-card-3d group text-left bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl overflow-hidden flex flex-col transition-all hover:border-[#12C2A8]/60 cursor-pointer"
    >
      <div className="relative h-32">
        <CourseArt category={course.category} seed={course.id + course.title} titulo={course.title} habilidades={course.skills} className="w-full h-full" />
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
          {aprobado && <span className="px-2 py-0.5 rounded-md bg-[#4CE07E] text-[#0F3D22] text-[11px] font-bold">✓ Aprobado</span>}
          {enRoadmap && !aprobado && <span className="px-2 py-0.5 rounded-md bg-[#F5A524] text-white text-[11px] font-bold">En tu roadmap</span>}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] leading-snug line-clamp-2 group-hover:text-[#0E8A7D] dark:group-hover:text-[#5FD3C2] transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-1">{course.category}</p>

        <div className="flex items-center gap-3 mt-3 text-xs text-[#1F2D2A] dark:text-[#E6EFE9]">
          <span className="inline-flex items-center gap-1" title={NIVEL_TEXTO[course.level]}>
            <span className="inline-flex gap-0.5" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`w-1.5 h-3.5 rounded-sm ${n <= NIVEL_PUNTOS[course.level] ? 'bg-[#12C2A8]' : 'bg-[#E1E6DF] dark:bg-[#27403A]'}`} />
              ))}
            </span>
            {NIVEL_TEXTO[course.level]}
          </span>
          {course.durationHours != null && <span>⏱ {course.durationHours} h</span>}
          {temas > 0 && <span>{temas} temas</span>}
        </div>

        {habilidades.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {habilidades.map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-full text-[11px] bg-[#12C2A8]/10 text-[#0B6F65] dark:text-[#5FD3C2]">{h}</span>
            ))}
            {extra > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">+{extra}</span>}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">
          <span>{(course.examQuestions ?? 0) > 0 ? `Examen de ${course.examQuestions} preguntas` : 'Sin examen todavía'}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0E8A7D] dark:text-[#5FD3C2] font-semibold">Ver ficha →</span>
        </div>
      </div>
    </button>
  );
}
