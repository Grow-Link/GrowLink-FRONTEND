// HU-12: arma el grafo del roadmap a partir de lo que devuelve cursos-service
// (GET /api/roadmap/mio: cada curso con sus prerequisitoIds reales). Son
// funciones puras, sin React, para poder razonar sobre ellas por separado.

export interface RoadmapCursoInput {
  cursoId: number;
  titulo: string;
  categoria: string;
  nivel: string;
  orden: number;
  prerequisitoIds: number[];
  /** Contrato bono: además de lo de arriba, cada curso del roadmap ya trae esto. */
  descripcion?: string;
  /** null en datos viejos que no tenían duración cargada. */
  duracionHoras?: number | null;
  habilidades?: string[];
  linkContenido?: string;
}

export type EstadoNodo = 'completed' | 'current' | 'available' | 'locked';

export interface GraphNode {
  id: number;
  titulo: string;
  categoria: string;
  nivel: string;
  orden: number;
  /** Columna del grafo: 0 si no requiere nada dentro de la ruta, si no 1 + la etapa más alta de sus prerequisitos. */
  etapa: number;
  estado: EstadoNodo;
  /** El curso ya no está activo en cursos-service (HU-09/HU-10). */
  inactivo: boolean;
  /** Prerequisitos que también están en la ruta. */
  requiere: number[];
  /** Prerequisitos reales que quedaron fuera de la ruta (otra categoría o nivel). */
  externos: number[];
  /** Cursos de la ruta que tienen a este como prerequisito. */
  desbloquea: number[];
  descripcion?: string;
  duracionHoras?: number | null;
  habilidades?: string[];
  linkContenido?: string;
}

export interface GraphEdge {
  from: number;
  to: number;
}

export interface RoadmapGraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  etapas: number;
}

export function buildRoadmapGraph(
  cursos: RoadmapCursoInput[],
  completados: ReadonlySet<number>,
  inactivos: ReadonlySet<number>
): RoadmapGraphModel {
  const enRuta = new Set(cursos.map((c) => c.cursoId));
  const porId = new Map(cursos.map((c) => [c.cursoId, c]));

  const requiere = new Map<number, number[]>();
  const desbloquea = new Map<number, number[]>(cursos.map((c) => [c.cursoId, []]));
  const edges: GraphEdge[] = [];
  for (const c of cursos) {
    const internos = [...new Set(c.prerequisitoIds)].filter((p) => enRuta.has(p) && p !== c.cursoId);
    requiere.set(c.cursoId, internos);
    for (const p of internos) {
      desbloquea.get(p)!.push(c.cursoId);
      edges.push({ from: p, to: c.cursoId });
    }
  }

  // camino más largo desde una raíz. cursos-service ya rechaza ciclos, pero si
  // llegara uno la arista que lo cierra simplemente no suma etapa
  const etapa = new Map<number, number>();
  const visitando = new Set<number>();
  const etapaDe = (id: number): number => {
    const conocida = etapa.get(id);
    if (conocida !== undefined) return conocida;
    if (visitando.has(id)) return -1;
    visitando.add(id);
    const previas = requiere.get(id)!.map(etapaDe);
    visitando.delete(id);
    const valor = previas.length === 0 ? 0 : Math.max(...previas) + 1;
    etapa.set(id, valor);
    return valor;
  };

  const ordenados = [...cursos].sort((a, b) => a.orden - b.orden);
  const nodes: GraphNode[] = ordenados.map((c) => {
    const req = requiere.get(c.cursoId)!;
    const estado: EstadoNodo = completados.has(c.cursoId)
      ? 'completed'
      : req.every((p) => completados.has(p))
        ? 'available'
        : 'locked';
    return {
      id: c.cursoId,
      titulo: c.titulo,
      categoria: c.categoria,
      nivel: c.nivel,
      orden: c.orden,
      etapa: Math.max(0, etapaDe(c.cursoId)),
      estado,
      inactivo: inactivos.has(c.cursoId),
      requiere: req,
      externos: [...new Set(c.prerequisitoIds)].filter((p) => !enRuta.has(p)),
      desbloquea: desbloquea.get(c.cursoId)!.sort((a, b) => porId.get(a)!.orden - porId.get(b)!.orden),
      descripcion: c.descripcion,
      duracionHoras: c.duracionHoras,
      habilidades: c.habilidades,
      linkContenido: c.linkContenido,
    };
  });

  // "estás aquí": el primer curso disponible según el orden sugerido, saltando
  // los que ya no están activos porque esos no se pueden tomar
  const actual = nodes.find((n) => n.estado === 'available' && !n.inactivo);
  if (actual) actual.estado = 'current';

  const etapas = nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.etapa)) + 1;
  return { nodes, edges, etapas };
}

export interface LayoutOptions {
  cardW: number;
  cardH: number;
  gapX: number;
  gapY: number;
  padX: number;
  padY: number;
  /** Espacio arriba para el título de cada etapa. */
  headerH: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  pos: Map<number, { x: number; y: number }>;
  columnas: { etapa: number; x: number }[];
}

/**
 * Una columna por etapa, de izquierda a derecha. Dentro de cada columna los
 * cursos se ordenan con el baricentro de sus vecinos (un barrido hacia la
 * derecha, uno hacia la izquierda y otro hacia la derecha, como en Sugiyama)
 * para que las flechas se crucen lo menos posible.
 */
export function layoutRoadmapGraph(graph: RoadmapGraphModel, o: LayoutOptions): GraphLayout {
  const columnas: GraphNode[][] = Array.from({ length: graph.etapas }, () => []);
  graph.nodes.forEach((n) => columnas[n.etapa].push(n)); // ya vienen por orden sugerido

  const maxFilas = Math.max(0, ...columnas.map((c) => c.length));
  const paso = o.cardH + o.gapY;
  const fila = new Map<number, number>(); // posición vertical en "filas", centrada

  const ubicar = (col: GraphNode[]) => {
    const offset = (maxFilas - col.length) / 2;
    col.forEach((n, i) => fila.set(n.id, offset + i));
  };

  const ordenarPor = (col: GraphNode[], vecinos: (n: GraphNode) => number[]) => {
    const clave = new Map(
      col.map((n) => {
        const ys = vecinos(n).map((v) => fila.get(v)).filter((y): y is number => y !== undefined);
        return [n.id, ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : (fila.get(n.id) ?? n.orden)];
      })
    );
    col.sort((a, b) => clave.get(a.id)! - clave.get(b.id)! || a.orden - b.orden);
    ubicar(col);
  };

  columnas.forEach((col, i) => (i === 0 ? ubicar(col) : ordenarPor(col, (n) => n.requiere)));
  for (let i = columnas.length - 2; i >= 0; i--) ordenarPor(columnas[i], (n) => n.desbloquea);
  for (let i = 1; i < columnas.length; i++) ordenarPor(columnas[i], (n) => n.requiere);

  const pos = new Map<number, { x: number; y: number }>();
  graph.nodes.forEach((n) => {
    pos.set(n.id, { x: o.padX + n.etapa * (o.cardW + o.gapX), y: o.padY + o.headerH + fila.get(n.id)! * paso });
  });

  return {
    width: o.padX * 2 + graph.etapas * o.cardW + Math.max(0, graph.etapas - 1) * o.gapX,
    height: o.padY * 2 + o.headerH + maxFilas * paso - (maxFilas > 0 ? o.gapY : 0),
    pos,
    columnas: columnas.map((_, i) => ({ etapa: i, x: o.padX + i * (o.cardW + o.gapX) })),
  };
}

const MIN_CARD_W = 176;
const MIN_GAP_X = 48;

/**
 * Ajusta el ancho de las tarjetas (y si hace falta el espacio entre etapas)
 * para que todas las etapas quepan en `disponible` px. Si ni con el mínimo
 * caben, devuelve el mínimo y el grafo se desplaza horizontalmente.
 */
export function fitLayoutOptions(base: LayoutOptions, etapas: number, disponible: number): LayoutOptions {
  if (etapas <= 0 || disponible <= 0) return base;
  for (const gapX of [base.gapX, MIN_GAP_X]) {
    const cardW = Math.floor((disponible - 2 * base.padX - (etapas - 1) * gapX) / etapas);
    if (cardW >= MIN_CARD_W) return { ...base, gapX, cardW: Math.min(base.cardW, cardW) };
  }
  return { ...base, gapX: MIN_GAP_X, cardW: MIN_CARD_W };
}

/**
 * Trazo SVG de cada flecha, por clave `${from}-${to}`.
 * - Cada flecha sale/entra a una altura distinta de la tarjeta (ordenadas por
 *   la posición del otro extremo) para que no se amontonen en un solo punto.
 * - Si salta etapas, cruza cada columna intermedia por el hueco entre tarjetas
 *   más cercano a la recta, en vez de pasar por encima de un curso.
 */
export function edgePaths(graph: RoadmapGraphModel, layout: GraphLayout, o: LayoutOptions): Map<string, string> {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const yDe = (id: number) => layout.pos.get(id)!.y;

  const columnas: number[][] = Array.from({ length: graph.etapas }, () => []);
  graph.nodes.forEach((n) => columnas[n.etapa].push(layout.pos.get(n.id)!.y));
  columnas.forEach((ys) => ys.sort((a, b) => a - b));

  const port = (vecinos: number[], otro: number) => {
    const orden = [...vecinos].sort((a, b) => yDe(a) - yDe(b));
    const k = orden.length;
    const sep = k > 1 ? Math.min(14, (o.cardH - 48) / (k - 1)) : 0;
    return (orden.indexOf(otro) - (k - 1) / 2) * sep;
  };

  // y por donde cruzar la columna `etapa`, lo más cerca posible de `ideal`
  const hueco = (etapa: number, ideal: number) => {
    const ys = columnas[etapa];
    const minY = o.padY + o.headerH;
    const arriba = ys[0] - o.gapY / 2;
    const abajo = ys[ys.length - 1] + o.cardH + o.gapY / 2;
    const candidatos = [
      ideal <= arriba ? Math.max(minY, ideal) : arriba,
      ...ys.slice(1).map((y) => y - o.gapY / 2),
      ideal >= abajo ? ideal : abajo,
    ];
    return candidatos.reduce((mejor, y) => (Math.abs(y - ideal) < Math.abs(mejor - ideal) ? y : mejor));
  };

  const curva = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(24, (x2 - x1) / 2);
    return ` C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const paths = new Map<string, string>();
  for (const e of graph.edges) {
    const from = byId.get(e.from)!;
    const to = byId.get(e.to)!;
    const a = layout.pos.get(e.from)!;
    const b = layout.pos.get(e.to)!;
    const x1 = a.x + o.cardW;
    const y1 = a.y + o.cardH / 2 + port(from.desbloquea, e.to);
    const x2 = b.x - 7; // deja espacio para la punta de la flecha
    const y2 = b.y + o.cardH / 2 + port(to.requiere, e.from);

    let d = `M ${x1} ${y1}`;
    let px = x1;
    let py = y1;
    for (let etapa = from.etapa + 1; etapa < to.etapa; etapa++) {
      const colX = o.padX + etapa * (o.cardW + o.gapX);
      const t = (colX + o.cardW / 2 - x1) / (x2 - x1);
      const wy = hueco(etapa, y1 + (y2 - y1) * t);
      d += curva(px, py, colX, wy) + ` L ${colX + o.cardW} ${wy}`;
      px = colX + o.cardW;
      py = wy;
    }
    paths.set(`${e.from}-${e.to}`, d + curva(px, py, x2, y2));
  }
  return paths;
}
