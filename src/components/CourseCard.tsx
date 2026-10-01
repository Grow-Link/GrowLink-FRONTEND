import { useState } from 'react';
import Badge from './Badge';
import Tooltip from './Tooltip';
import CategoryGlyph from './CategoryGlyph';
import { timeAgo } from '../utils/format';
import type { Course } from '../types';

const LEVEL_LABEL: Record<Course['level'], string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

interface CourseCardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}

interface CourseCardProps {
  course: Course;
  onSelect: () => void;
  isCompleted?: boolean;
  isPrerequisiteInRoadmap?: boolean;
  relevance?: number;
  showRelevance?: boolean;
  actions?: CourseCardAction[];
}

export default function CourseCard({ course, onSelect, isCompleted, isPrerequisiteInRoadmap, relevance, showRelevance = true, actions }: CourseCardProps) {
  const [favorited, setFavorited] = useState(false);
  const relevanceValue = relevance ?? 50;
  const relevanceTier = relevanceValue >= 80 ? 'alta' : relevanceValue >= 50 ? 'media' : 'baja';
  const relevanceColor = relevanceValue >= 80 ? '#15803D' : relevanceValue >= 50 ? '#1E73E8' : '#6B7A99';

  return (
    <div
      className={`gl-hover-reveal group relative bg-white dark:bg-[#0F2240] border rounded-2xl overflow-hidden flex flex-col transition-all ${
        course.status === 'inactive' ? 'border-[#DDE4ED] dark:border-[#1C3254] opacity-75' : 'border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8]/40 hover:shadow-lg'
      }`}
    >
      <button onClick={onSelect} className="text-left cursor-pointer flex flex-col flex-1">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug group-hover:text-[#1E73E8] transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1 font-medium">
            {LEVEL_LABEL[course.level]} · {course.category}
          </p>
        </div>

        {/* Thumbnail */}
        <div className="relative mx-4 h-28 rounded-xl overflow-hidden">
          <CategoryGlyph category={course.category} />

          {/* Floating circular icon buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <span
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              role="button"
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all cursor-pointer"
              title="Vista previa"
            >
              <svg className="w-3.5 h-3.5 text-[#0B1F3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setFavorited((f) => !f); }}
              role="button"
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all cursor-pointer"
              title={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg className={`w-3.5 h-3.5 ${favorited ? 'text-[#EF4444]' : 'text-[#0B1F3A]'}`} fill={favorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
          </div>

          {isCompleted && (
            <div className="absolute top-2 left-2">
              <Badge variant="success">Completado</Badge>
            </div>
          )}

          {/* Overlaid status badges bottom-left */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {isPrerequisiteInRoadmap && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#0B1F3A]/85 text-white backdrop-blur-sm">
                Prerequisito de tu roadmap
              </span>
            )}
            {relevanceValue >= 80 && !isPrerequisiteInRoadmap && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#12C2A8]/90 text-white backdrop-blur-sm">
                Recomendado
              </span>
            )}
            {course.status === 'inactive' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EF4444]/90 text-white backdrop-blur-sm">
                Dado de baja
              </span>
            )}
          </div>
        </div>

        {showRelevance && (
          <>
            {/* Primary stat */}
            <div className="px-4 pt-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider font-semibold">Relevancia para ti</p>
                <p className="font-mono text-xl font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{relevanceValue}%</p>
              </div>
              <span
                className="text-[11px] font-mono font-bold px-2 py-1 rounded-md"
                style={{ color: relevanceColor, backgroundColor: `${relevanceColor}1A` }}
              >
                {relevanceTier}
              </span>
            </div>

            {/* Gradient progress with exact marker */}
            <div className="px-4 pt-2.5">
              <div className="relative h-1.5 rounded-full bg-[#EEF2F6] dark:bg-[#1C3254]">
                <div className="absolute inset-y-0 left-0 rounded-full gl-gradient" style={{ width: `${relevanceValue}%` }} />
                <div
                  className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#0B1F3A] dark:border-[#E2EBF6] shadow"
                  style={{ left: `${relevanceValue}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Skills with tooltip */}
        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
          {course.skills.slice(0, 3).map((skill) => (
            <Tooltip key={skill} title={skill} description="Habilidad que desbloqueas al completar este curso.">
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254] cursor-default">
                {skill}
              </span>
            </Tooltip>
          ))}
        </div>

        {/* Status row */}
        <div className="px-4 py-3 mt-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className={`gl-status-dot ${course.status === 'active' ? 'bg-[#4CE07E]' : 'bg-[#EF4444]'}`} />
            <span className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2]">{course.status === 'active' ? 'Activo' : 'De baja'}</span>
          </span>
          <span className="font-mono text-[11px] text-[#6B7A99] dark:text-[#8BA5C2]">actualizado {timeAgo(course.createdAt)}</span>
        </div>
      </button>

      {/* Hover-reveal action footer */}
      {actions && actions.length > 0 && (
        <div className="gl-hover-footer absolute bottom-0 left-0 right-0 flex border-t border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] z-10">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={(e) => { e.stopPropagation(); action.onClick(); }}
              className={`flex-1 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
                action.variant === 'primary'
                  ? 'text-white gl-gradient'
                  : 'text-[#0B1F3A] dark:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
