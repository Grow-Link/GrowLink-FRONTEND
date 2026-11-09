// Constructores de datos para las pruebas: arman las respuestas de los backends con lo mínimo que hace falta
// y dejan que cada prueba sobrescriba solo lo que le interesa. Así cada prueba se lee por lo que cambia.

import type { AlternativaDto, RoadmapCursoDto, RoadmapDto } from '../utils/roadmapModel';

export function cursoDto(over: Partial<RoadmapCursoDto> & { cursoId: number }): RoadmapCursoDto {
  return {
    titulo: `Curso ${over.cursoId}`,
    categoria: 'INGENIERIA_SISTEMAS',
    categoriaEtiqueta: '',
    nivel: 'PRINCIPIANTE',
    orden: over.cursoId,
    prerequisitoIds: [],
    razon: null,
    descripcion: null,
    duracionHoras: 10,
    temario: [],
    habilidades: [],
    linkContenido: null,
    activo: true,
    totalPreguntasExamen: 5,
    alternativas: [],
    ...over,
  };
}

export function alternativaDto(over: Partial<AlternativaDto> & { cursoId: number }): AlternativaDto {
  return {
    titulo: `Alternativa ${over.cursoId}`,
    nivel: 'PRINCIPIANTE',
    duracionHoras: 8,
    linkContenido: null,
    habilidades: [],
    totalPreguntasExamen: 3,
    ...over,
  };
}

export function roadmapDto(cursos: RoadmapCursoDto[], over: Partial<RoadmapDto> = {}): RoadmapDto {
  return {
    id: 1,
    usuarioId: 7,
    metas: 'Ser arquitecta de software',
    nivel: 'PRINCIPIANTE',
    creadoEn: '2026-01-10T12:00:00Z',
    cursos,
    ...over,
  };
}

/** Una Response como la que devolvería fetch, para los dobles de prueba de los servicios. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Una respuesta sin cuerpo JSON (lo que devuelve el proxy cuando no logra llegar al servicio). */
export function textoResponse(texto: string, status = 200): Response {
  return new Response(texto, { status, headers: { 'Content-Type': 'text/html' } });
}
