import { describe, expect, it } from 'vitest';
import { horasParaSubir, logrosDe, loQueAbre, mensajeDelMomento, rangoDe } from './motivacion';
import { construirRoadmap, type RoadmapView } from './roadmapModel';
import { cursoDto, roadmapDto } from '../pruebas/datos';

/** Una vista de roadmap con `total` cursos iguales, de los cuales los primeros `completados` están aprobados. */
function vistaCon(total: number, completados: number, horasPorCurso = 10): RoadmapView {
  const cursos = Array.from({ length: total }, (_, i) => cursoDto({ cursoId: i + 1, orden: i + 1, duracionHoras: horasPorCurso }));
  const aprobados = new Set(cursos.slice(0, completados).map((c) => c.cursoId));
  return construirRoadmap(roadmapDto(cursos), aprobados);
}

describe('rangoDe', () => {
  it('empieza en «Primeros pasos» sin nada aprobado', () => {
    expect(rangoDe(vistaCon(4, 0))).toEqual({ numero: 1, nombre: 'Primeros pasos' });
  });

  it('sube de rango según el porcentaje de la ruta', () => {
    expect(rangoDe(vistaCon(10, 1))).toMatchObject({ numero: 2, nombre: 'En marcha' }); // 10%
    expect(rangoDe(vistaCon(10, 4))).toMatchObject({ numero: 3, nombre: 'Con ritmo' }); // 40%
    expect(rangoDe(vistaCon(10, 7))).toMatchObject({ numero: 4, nombre: 'Recta final' }); // 70%
  });

  it('llega a «Ruta completa» solo cuando están todos', () => {
    expect(rangoDe(vistaCon(3, 2)).numero).toBe(4);
    expect(rangoDe(vistaCon(3, 3))).toEqual({ numero: 5, nombre: 'Ruta completa' });
  });

  it('una ruta sin cursos no cuenta como completa', () => {
    expect(rangoDe(vistaCon(0, 0))).toEqual({ numero: 1, nombre: 'Primeros pasos' });
  });
});

describe('horasParaSubir', () => {
  it('dice cuántas horas faltan para el siguiente rango y cuál es', () => {
    // 4 cursos de 10 horas = 40 en total, ninguno hecho: el primer umbral está en el 1%
    expect(horasParaSubir(vistaCon(4, 0))).toEqual({ horas: 1, hacia: 'En marcha' });
  });

  it('apunta al umbral siguiente, no al que ya pasó', () => {
    // 1 de 4 hecho = 10 horas de 40 (25%): el siguiente umbral es 34% -> 13.6 horas, faltan 4 (redondeando hacia arriba)
    expect(horasParaSubir(vistaCon(4, 1))).toEqual({ horas: 4, hacia: 'Con ritmo' });
  });

  it('nunca ofrece subir con 0 horas de estudio', () => {
    const faltan = horasParaSubir(vistaCon(100, 1));

    expect(faltan?.horas).toBeGreaterThanOrEqual(1);
  });

  it('devuelve null si ya terminó la ruta o si no hay ruta', () => {
    expect(horasParaSubir(vistaCon(3, 3))).toBeNull();
    expect(horasParaSubir(vistaCon(0, 0))).toBeNull();
  });
});

describe('logrosDe', () => {
  it('no da ningún logro cuando todavía no ha aprobado nada', () => {
    const logros = logrosDe(vistaCon(6, 0));

    expect(logros.filter((l) => l.conseguido)).toEqual([]);
    expect(logros.map((l) => l.id)).toEqual(['primer-paso', 'primera-etapa', 'tres-cursos', 'habilidades', 'mitad', 'completa']);
  });

  it('da «primer paso» con el primer curso aprobado, pero no «tres seguidos»', () => {
    const logros = logrosDe(vistaCon(6, 1));
    const conseguido = (id: string) => logros.find((l) => l.id === id)!.conseguido;

    expect(conseguido('primer-paso')).toBe(true);
    expect(conseguido('tres-cursos')).toBe(false);
  });

  it('da «cimientos listos» cuando la primera etapa está completa', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1 }), cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] })]);
    const logros = logrosDe(construirRoadmap(dto, new Set([1])));

    expect(logros.find((l) => l.id === 'primera-etapa')!.conseguido).toBe(true);
  });

  it('da «caja de herramientas» a partir de 5 habilidades desbloqueadas', () => {
    const conCuatro = roadmapDto([cursoDto({ cursoId: 1, habilidades: ['a', 'b', 'c', 'd'] })]);
    const conCinco = roadmapDto([cursoDto({ cursoId: 1, habilidades: ['a', 'b', 'c', 'd', 'e'] })]);
    const logro = (dto: typeof conCuatro) => logrosDe(construirRoadmap(dto, new Set([1]))).find((l) => l.id === 'habilidades')!.conseguido;

    expect(logro(conCuatro)).toBe(false);
    expect(logro(conCinco)).toBe(true);
  });

  it('da «mitad del camino» y «ruta completa» en sus marcas', () => {
    const mitad = logrosDe(vistaCon(4, 2));
    expect(mitad.find((l) => l.id === 'mitad')!.conseguido).toBe(true);
    expect(mitad.find((l) => l.id === 'completa')!.conseguido).toBe(false);

    expect(logrosDe(vistaCon(4, 4)).find((l) => l.id === 'completa')!.conseguido).toBe(true);
  });
});

describe('loQueAbre', () => {
  it('lista los cursos de la ruta que tienen a este como prerrequisito', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1 }),
      cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
      cursoDto({ cursoId: 3, orden: 3, prerequisitoIds: [1] }),
      cursoDto({ cursoId: 4, orden: 4, prerequisitoIds: [2] }),
    ]);
    const vista = construirRoadmap(dto, new Set());

    expect(loQueAbre(vista.nodes[0], vista).map((n) => n.cursoId)).toEqual([2, 3]);
    expect(loQueAbre(vista.nodes[3], vista)).toEqual([]);
  });
});

describe('mensajeDelMomento', () => {
  it('celebra cuando la ruta está terminada', () => {
    expect(mensajeDelMomento(vistaCon(3, 3))).toMatch(/Terminaste toda la ruta/);
  });

  it('nombra el primer paso y sus horas cuando no ha empezado', () => {
    const mensaje = mensajeDelMomento(vistaCon(3, 0, 12));

    expect(mensaje).toContain('«Curso 1»');
    expect(mensaje).toContain('12 horas');
  });

  it('no inventa horas si el curso no las tiene', () => {
    const vista = construirRoadmap(roadmapDto([cursoDto({ cursoId: 1, duracionHoras: null })]), new Set());

    expect(mensajeDelMomento(vista)).toBe('Todo mapa empieza con un primer paso, y el tuyo es «Curso 1».');
  });

  it('avisa cuando queda un solo curso', () => {
    expect(mensajeDelMomento(vistaCon(3, 2))).toMatch(/Te queda un solo curso/);
  });

  it('reconoce que pasó la mitad del camino', () => {
    expect(mensajeDelMomento(vistaCon(10, 6))).toMatch(/Ya pasaste la mitad del camino/);
  });

  it('cuenta el avance cuando va por debajo de la mitad', () => {
    expect(mensajeDelMomento(vistaCon(10, 2))).toMatch(/Llevas 2 de 10/);
  });

  it('pide actualizar la ruta si no queda ningún curso disponible', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, activo: false })]);

    expect(mensajeDelMomento(construirRoadmap(dto, new Set()))).toMatch(/Actualiza tu roadmap/);
  });
});
