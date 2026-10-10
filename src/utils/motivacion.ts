// La parte "de juego" del roadmap: nivel, logros y mensajes. Todo se calcula con lo que la persona ya hizo
// (cursos aprobados, horas, habilidades), nada se inventa. Los textos son sobrios a propósito: animan sin gritar.

import type { RoadmapNode, RoadmapView } from './roadmapModel';

export interface Rango {
  numero: number;
  nombre: string;
}

export function rangoDe(vista: RoadmapView): Rango {
  const { completados, total, porcentaje } = vista.progreso;
  if (total > 0 && completados === total) return { numero: 5, nombre: 'Ruta completa' };
  if (completados === 0) return { numero: 1, nombre: 'Primeros pasos' };
  if (porcentaje < 34) return { numero: 2, nombre: 'En marcha' };
  if (porcentaje < 67) return { numero: 3, nombre: 'Con ritmo' };
  return { numero: 4, nombre: 'Recta final' };
}

/** Horas que faltan para llegar al siguiente nivel, o null si ya está en el último. */
export function horasParaSubir(vista: RoadmapView): { horas: number; hacia: string } | null {
  const { completados, total, horasHechas, horasTotales } = vista.progreso;
  if (total === 0 || completados === total) return null;
  const umbrales = [
    { pct: 0.01, nombre: 'En marcha' },
    { pct: 0.34, nombre: 'Con ritmo' },
    { pct: 0.67, nombre: 'Recta final' },
    { pct: 1, nombre: 'Ruta completa' },
  ];
  const actual = horasHechas / Math.max(1, horasTotales);
  const siguiente = umbrales.find((u) => actual < u.pct);
  if (!siguiente) return null;
  return { horas: Math.max(1, Math.ceil(siguiente.pct * horasTotales - horasHechas)), hacia: siguiente.nombre };
}

export interface Logro {
  id: string;
  titulo: string;
  pista: string;
  conseguido: boolean;
}

export function logrosDe(vista: RoadmapView): Logro[] {
  const { completados, total, porcentaje, habilidadesDesbloqueadas } = vista.progreso;
  const primeraEtapa = vista.stages[0];
  return [
    { id: 'primer-paso', titulo: 'Primer paso', pista: 'Aprueba tu primer examen', conseguido: completados >= 1 },
    {
      id: 'primera-etapa',
      titulo: 'Cimientos listos',
      pista: 'Completa todos los cursos de la primera etapa',
      conseguido: !!primeraEtapa && primeraEtapa.nodes.length > 0 && primeraEtapa.completados === primeraEtapa.nodes.length,
    },
    { id: 'tres-cursos', titulo: 'Tres seguidos', pista: 'Aprueba 3 cursos', conseguido: completados >= 3 },
    { id: 'habilidades', titulo: 'Caja de herramientas', pista: 'Desbloquea 5 habilidades', conseguido: habilidadesDesbloqueadas.length >= 5 },
    { id: 'mitad', titulo: 'Mitad del camino', pista: 'Llega al 50% de tu ruta', conseguido: porcentaje >= 50 },
    { id: 'completa', titulo: 'Ruta completa', pista: 'Aprueba todos los cursos', conseguido: total > 0 && completados === total },
  ];
}

/** Lo que se abre al aprobar este curso: los cursos de la ruta que lo tienen como prerrequisito. */
export function loQueAbre(nodo: RoadmapNode, vista: RoadmapView): RoadmapNode[] {
  return vista.nodes.filter((n) => n.prerequisitos.some((p) => p.cursoId === nodo.cursoId));
}

/** El mensaje de arriba del roadmap: cambia según dónde va la persona. */
export function mensajeDelMomento(vista: RoadmapView): string {
  const { completados, total, porcentaje } = vista.progreso;
  const siguiente = vista.siguiente;
  if (total > 0 && completados === total) return 'Terminaste toda la ruta. Cuando quieras, define una meta más grande y seguimos.';
  if (!siguiente) return 'Por ahora no hay un curso disponible para seguir. Actualiza tu roadmap para ver otras opciones.';
  if (completados === 0) return `Todo mapa empieza con un primer paso, y el tuyo es «${siguiente.titulo}»${siguiente.horas != null ? `: unas ${siguiente.horas} horas de estudio` : ''}.`;
  if (total - completados === 1) return `Te queda un solo curso: «${siguiente.titulo}». Después de eso, la ruta es tuya.`;
  if (porcentaje >= 50) return `Ya pasaste la mitad del camino. «${siguiente.titulo}» se apoya en todo lo que llevas.`;
  return `Llevas ${completados} de ${total}. «${siguiente.titulo}» está listo cuando quieras.`;
}
