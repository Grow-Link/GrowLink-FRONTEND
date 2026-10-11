// El personaje del roadmap: un brote que crece con la ruta. Su forma depende del rango (el mismo que el nivel de
// la pantalla) y los accesorios, de las áreas en las que ya aprobó cursos. Todo se calcula con el progreso real.

import { rangoDe } from './motivacion';
import type { RoadmapView } from './roadmapModel';

export type Genero = 'ella' | 'el';
export type AccesorioId = 'laptop' | 'gafas' | 'maletin' | 'mochila' | 'casco' | 'medalla';

export interface Accesorio {
  id: AccesorioId;
  nombre: string;
  /** Por qué lo tiene: qué área lo desbloqueó. */
  motivo: string;
}

export interface Apariencia {
  rango: number;
  /** Cómo se llama su forma actual. */
  forma: string;
  accesorios: Accesorio[];
}

const FORMAS = ['Semilla', 'Brote', 'Planta', 'Arbolito', 'Florecido'];
const ARTICULO = ['una', 'un', 'una', 'un', 'un'];

const POR_AREA: Record<string, { id: AccesorioId; nombre: string }> = {
  'Ingeniería de Sistemas': { id: 'laptop', nombre: 'una laptop' },
  Matemáticas: { id: 'gafas', nombre: 'unas gafas de analista' },
  'Administración de Empresas': { id: 'maletin', nombre: 'un maletín' },
  Idiomas: { id: 'mochila', nombre: 'una mochila de viajero' },
  'Ingeniería Industrial': { id: 'casco', nombre: 'un casco de obra' },
  'Ingeniería Civil': { id: 'casco', nombre: 'un casco de obra' },
  'Ingeniería Mecánica': { id: 'casco', nombre: 'un casco de obra' },
};
const POR_DEFECTO = { id: 'medalla' as AccesorioId, nombre: 'una medalla de explorador' };

export function aparienciaDe(vista: RoadmapView): Apariencia {
  const rango = rangoDe(vista).numero;
  const vistas = new Set<AccesorioId>();
  const accesorios: Accesorio[] = [];
  [...vista.nodes]
    .filter((n) => n.status === 'completed')
    .sort((a, b) => a.orden - b.orden)
    .forEach((n) => {
      const a = POR_AREA[n.categoria] ?? POR_DEFECTO;
      if (vistas.has(a.id)) return;
      vistas.add(a.id);
      accesorios.push({ id: a.id, nombre: a.nombre, motivo: n.categoria });
    });
  return { rango, forma: FORMAS[rango - 1] ?? FORMAS[0], accesorios };
}

/** Se guarda lo último que vio la persona; si cambia, hay algo nuevo que celebrar. */
export function firmaDe(a: Apariencia): string {
  return `${a.rango}|${a.accesorios.map((x) => x.id).join(',')}`;
}

export interface Novedad {
  titulo: string;
  detalle: string;
}

/** Qué cambió respecto de la última vez que la persona vio a su personaje. */
export function novedadesEntre(firmaAntes: string | null, ahora: Apariencia): Novedad[] {
  if (firmaAntes === null) return [];
  const [rangoAntes = '1', accesoriosAntes = ''] = firmaAntes.split('|');
  const tenia = new Set(accesoriosAntes.split(',').filter(Boolean));
  const lista: Novedad[] = [];
  if (ahora.rango > Number(rangoAntes)) {
    lista.push({ titulo: `Ahora es ${ARTICULO[ahora.rango - 1] ?? 'un'} ${ahora.forma.toLowerCase()}`, detalle: 'Creció porque tu ruta avanzó de nivel.' });
  }
  ahora.accesorios
    .filter((a) => !tenia.has(a.id))
    .forEach((a) => lista.push({ titulo: `Consiguió ${a.nombre}`, detalle: `Por aprobar un curso de ${a.motivo}.` }));
  return lista;
}

// ---- lo que se recuerda en este navegador ---------------------------------------------------------------------------

const CLAVE_GENERO = 'gl_brote_genero';
const claveFirma = (usuarioId: number) => `gl_brote_firma_${usuarioId}`;

export function leerGenero(): Genero {
  try {
    return localStorage.getItem(CLAVE_GENERO) === 'el' ? 'el' : 'ella';
  } catch {
    return 'ella';
  }
}

export function guardarGenero(g: Genero): void {
  try {
    localStorage.setItem(CLAVE_GENERO, g);
  } catch {
    /* sin almacenamiento: vale solo para esta visita */
  }
}

export function leerFirma(usuarioId: number): string | null {
  try {
    return localStorage.getItem(claveFirma(usuarioId));
  } catch {
    return null;
  }
}

export function guardarFirma(usuarioId: number, firma: string): void {
  try {
    localStorage.setItem(claveFirma(usuarioId), firma);
  } catch {
    /* igual que arriba */
  }
}
