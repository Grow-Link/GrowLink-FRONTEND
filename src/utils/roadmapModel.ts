// Convierte lo que responde cursos-service en el "mapa por etapas" que pinta la pantalla del roadmap y que
// también usa el PDF: cada curso queda en una etapa según cuántos prerrequisitos de la ruta lo anteceden,
// y con un estado que depende de lo que la persona ya aprobó.

import type { Level } from '../types';
import { categoriaDesdeEnum, NIVEL_DESDE_BACKEND } from '../services/cursosServiceApi';

// ---- lo que manda el servidor ----------------------------------------------------------------------------

export interface AlternativaDto {
  cursoId: number;
  titulo: string;
  nivel: string;
  duracionHoras: number | null;
  linkContenido: string | null;
  habilidades: string[];
  /** Siempre mayor que 0: el servidor solo propone alternativas que tienen examen. */
  totalPreguntasExamen?: number;
}

export interface RoadmapCursoDto {
  cursoId: number;
  titulo: string;
  categoria: string;
  categoriaEtiqueta: string;
  nivel: string;
  orden: number;
  prerequisitoIds: number[];
  razon: string | null;
  descripcion: string | null;
  duracionHoras: number | null;
  temario: string[];
  habilidades: string[];
  linkContenido: string | null;
  activo: boolean;
  totalPreguntasExamen: number;
  alternativas: AlternativaDto[];
}

export interface RoadmapDto {
  id: number;
  usuarioId: number;
  metas: string | null;
  nivel: string;
  creadoEn: string;
  /** Quien armó el roadmap: la IA, o el modo de respaldo (sin IA). null en roadmaps viejos. */
  generadoPor?: 'IA' | 'RESPALDO' | null;
  resumen?: string | null;
  intereses?: string[];
  /** El tiempo con el que se armó la ruta (no vienen si no había límite). */
  horasPorSemana?: number | null;
  semanas?: number | null;
  presupuestoHoras?: number | null;
  cursos: RoadmapCursoDto[];
}

// ---- lo que usa la pantalla ------------------------------------------------------------------------------

/**
 * completed:    ya aprobó el examen.
 * current:      el siguiente paso recomendado (el primero que puede tomar ahora).
 * available:    puede tomarlo ya (sus prerrequisitos de la ruta están aprobados) pero no es el siguiente.
 * locked:       le falta aprobar algún prerrequisito.
 * unavailable:  el curso se dio de baja: ya no se recomienda y hay que actualizar el roadmap.
 */
export type NodeStatus = 'completed' | 'current' | 'available' | 'locked' | 'unavailable';

export interface Alternativa {
  cursoId: number;
  titulo: string;
  nivel: Level;
  horas: number | null;
  link: string | null;
  habilidades: string[];
  tieneExamen: boolean;
}

/** Lo que necesita el examen de un curso (el del paso o el de una de sus alternativas). */
export interface ExamenObjetivo {
  cursoId: number;
  titulo: string;
  link: string | null;
  /** Si es una alternativa: el título del paso de la ruta que va a cumplir. */
  paso?: string;
}

export interface RoadmapNode {
  cursoId: number;
  titulo: string;
  categoria: string;
  nivel: Level;
  orden: number;
  etapa: number;
  /** Los prerrequisitos que SÍ están en la ruta, con su estado. */
  prerequisitos: { cursoId: number; titulo: string; hecho: boolean }[];
  razon: string;
  descripcion: string;
  horas: number | null;
  temario: string[];
  habilidades: string[];
  link: string | null;
  tieneExamen: boolean;
  alternativas: Alternativa[];
  /** Si el paso se cumplió aprobando una alternativa (y no el curso de la ruta), cuál fue. */
  cumplidoCon: { cursoId: number; titulo: string; horas: number | null; habilidades: string[] } | null;
  status: NodeStatus;
}

export interface Stage {
  index: number;
  nombre: string;
  descripcion: string;
  nodes: RoadmapNode[];
  completados: number;
}

export interface Progreso {
  completados: number;
  total: number;
  horasHechas: number;
  horasTotales: number;
  porcentaje: number;
  habilidadesDesbloqueadas: string[];
  habilidadesTotales: string[];
}

export interface RoadmapView {
  id: number;
  meta: string;
  nivel: Level;
  creadoEn: string;
  generadoPor: 'IA' | 'RESPALDO' | null;
  resumen: string;
  areas: string[];
  /** El tiempo con el que se armó la ruta, o null si no tenía límite. */
  tiempo: { horasPorSemana: number; semanas: number; presupuesto: number } | null;
  nodes: RoadmapNode[];
  stages: Stage[];
  progreso: Progreso;
  /** El siguiente paso recomendado, o null si ya terminó (o si todo lo que queda está dado de baja). */
  siguiente: RoadmapNode | null;
  /** Hay cursos de la ruta que se dieron de baja: conviene actualizar el roadmap. */
  hayDadosDeBaja: boolean;
}

const NOMBRES_ETAPA: { nombre: string; descripcion: string }[] = [
  { nombre: 'Cimientos', descripcion: 'Las bases que sostienen todo lo demás.' },
  { nombre: 'Construcción', descripcion: 'Aquí empiezas a hacer cosas de verdad.' },
  { nombre: 'Especialización', descripcion: 'Profundizas en lo que más te acerca a tu meta.' },
  { nombre: 'Dominio', descripcion: 'El último tramo: lo que te hace destacar.' },
];

function nombreDeEtapa(indice: number, total: number): { nombre: string; descripcion: string } {
  if (total === 1) return { nombre: 'Tu ruta', descripcion: 'Estos cursos te llevan directo a tu meta.' };
  if (indice === 0) return NOMBRES_ETAPA[0];
  if (indice === total - 1) return total > 3 ? NOMBRES_ETAPA[3] : NOMBRES_ETAPA[2];
  return indice === 1 ? NOMBRES_ETAPA[1] : NOMBRES_ETAPA[2];
}

export function construirRoadmap(dto: RoadmapDto, completados: Set<number>): RoadmapView {
  const cursos = [...dto.cursos].sort((a, b) => a.orden - b.orden);
  const enRuta = new Map(cursos.map((c) => [c.cursoId, c]));

  // etapa = largo de la cadena de prerrequisitos que están en la ruta
  const cacheEtapa = new Map<number, number>();
  const etapaDe = (id: number, visitando: Set<number> = new Set()): number => {
    if (cacheEtapa.has(id)) return cacheEtapa.get(id)!;
    if (visitando.has(id)) return 0; // por si algún dato trae un ciclo, no se cuelga
    visitando.add(id);
    const previos = (enRuta.get(id)?.prerequisitoIds ?? []).filter((p) => enRuta.has(p));
    const etapa = previos.length === 0 ? 0 : 1 + Math.max(...previos.map((p) => etapaDe(p, visitando)));
    visitando.delete(id);
    cacheEtapa.set(id, etapa);
    return etapa;
  };

  // un PASO queda cumplido si se aprobó el curso de la ruta o cualquiera de sus alternativas (las alternativas
  // cubren todo lo del paso). Eso también abre lo que viene después.
  const cumplidoPor = new Map<number, AlternativaDto | 'principal'>();
  cursos.forEach((c) => {
    if (completados.has(c.cursoId)) cumplidoPor.set(c.cursoId, 'principal');
    else {
      const alt = (c.alternativas ?? []).find((a) => completados.has(a.cursoId));
      if (alt) cumplidoPor.set(c.cursoId, alt);
    }
  });
  const cumple = (id: number) => cumplidoPor.has(id);

  let yaHayActual = false;
  const nodes: RoadmapNode[] = cursos.map((c) => {
    const previos = c.prerequisitoIds.filter((p) => enRuta.has(p));
    const prerrequisitosHechos = previos.every((p) => cumple(p));

    let status: NodeStatus;
    if (cumple(c.cursoId)) status = 'completed';
    else if (!c.activo) status = 'unavailable';
    else if (!prerrequisitosHechos) status = 'locked';
    else if (!yaHayActual) {
      status = 'current';
      yaHayActual = true;
    } else status = 'available';

    return {
      cursoId: c.cursoId,
      titulo: c.titulo,
      categoria: c.categoriaEtiqueta || categoriaDesdeEnum(c.categoria),
      nivel: NIVEL_DESDE_BACKEND[c.nivel] ?? 'principiante',
      orden: c.orden,
      etapa: etapaDe(c.cursoId),
      prerequisitos: previos.map((p) => ({ cursoId: p, titulo: enRuta.get(p)!.titulo, hecho: cumple(p) })),
      razon: c.razon ?? '',
      descripcion: c.descripcion ?? '',
      horas: c.duracionHoras,
      temario: c.temario ?? [],
      habilidades: c.habilidades ?? [],
      link: c.linkContenido || null,
      tieneExamen: (c.totalPreguntasExamen ?? 0) > 0,
      alternativas: (c.alternativas ?? []).map((a) => ({
        cursoId: a.cursoId,
        titulo: a.titulo,
        nivel: NIVEL_DESDE_BACKEND[a.nivel] ?? 'principiante',
        horas: a.duracionHoras,
        link: a.linkContenido || null,
        habilidades: a.habilidades ?? [],
        tieneExamen: (a.totalPreguntasExamen ?? 0) > 0,
      })),
      cumplidoCon: (() => {
        const por = cumplidoPor.get(c.cursoId);
        return por && por !== 'principal' ? { cursoId: por.cursoId, titulo: por.titulo, horas: por.duracionHoras, habilidades: por.habilidades ?? [] } : null;
      })(),
      status,
    };
  });

  // etapas sin huecos (0, 1, 2...) aunque falte alguna intermedia
  const etapasUsadas = [...new Set(nodes.map((n) => n.etapa))].sort((a, b) => a - b);
  const posicion = new Map(etapasUsadas.map((e, i) => [e, i]));
  nodes.forEach((n) => (n.etapa = posicion.get(n.etapa)!));

  const stages: Stage[] = etapasUsadas.map((_, i) => {
    const deLaEtapa = nodes.filter((n) => n.etapa === i);
    return {
      index: i,
      ...nombreDeEtapa(i, etapasUsadas.length),
      nodes: deLaEtapa,
      completados: deLaEtapa.filter((n) => n.status === 'completed').length,
    };
  });

  const hechos = nodes.filter((n) => n.status === 'completed');
  const horas = (lista: RoadmapNode[]) => lista.reduce((suma, n) => suma + (n.horas ?? 0), 0);
  // lo ya hecho cuenta con el curso que de verdad se aprobó (el de la ruta o su alternativa)
  const horasHechas = hechos.reduce((suma, n) => suma + (n.cumplidoCon ? n.cumplidoCon.horas ?? 0 : n.horas ?? 0), 0);
  const habilidadesDesbloqueadas = [...new Set(hechos.flatMap((n) => (n.cumplidoCon ? n.cumplidoCon.habilidades : n.habilidades)))];
  // lo que da una alternativa también cuenta como parte del total (si no, saldría "2 de 1 habilidades")
  const habilidadesTotales = [...new Set([...nodes.flatMap((n) => n.habilidades), ...habilidadesDesbloqueadas])];

  return {
    id: dto.id,
    meta: dto.metas ?? '',
    nivel: NIVEL_DESDE_BACKEND[dto.nivel] ?? 'principiante',
    creadoEn: dto.creadoEn,
    generadoPor: dto.generadoPor ?? null,
    resumen: dto.resumen ?? '',
    areas: (dto.intereses ?? []).map(categoriaDesdeEnum),
    tiempo:
      dto.horasPorSemana && dto.semanas
        ? { horasPorSemana: dto.horasPorSemana, semanas: dto.semanas, presupuesto: dto.presupuestoHoras ?? dto.horasPorSemana * dto.semanas }
        : null,
    nodes,
    stages,
    progreso: {
      completados: hechos.length,
      total: nodes.length,
      horasHechas,
      horasTotales: horas(nodes),
      porcentaje: nodes.length === 0 ? 0 : Math.round((hechos.length / nodes.length) * 100),
      habilidadesDesbloqueadas,
      habilidadesTotales,
    },
    siguiente: nodes.find((n) => n.status === 'current') ?? null,
    hayDadosDeBaja: nodes.some((n) => n.status === 'unavailable'),
  };
}
