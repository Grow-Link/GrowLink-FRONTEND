import { describe, expect, it } from 'vitest';
import { construirRoadmap } from './roadmapModel';
import { alternativaDto, cursoDto, roadmapDto } from '../pruebas/datos';

/** Una ruta encadenada 1 -> 2 -> 3: cada curso tiene como prerrequisito el anterior. */
function cadenaDeTres() {
  return roadmapDto([
    cursoDto({ cursoId: 1, orden: 1 }),
    cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
    cursoDto({ cursoId: 3, orden: 3, prerequisitoIds: [2] }),
  ]);
}

describe('construirRoadmap — etapas', () => {
  it('pone en la etapa 0 lo que no depende de nada y va subiendo por la cadena de prerrequisitos', () => {
    const vista = construirRoadmap(cadenaDeTres(), new Set());

    expect(vista.nodes.map((n) => n.etapa)).toEqual([0, 1, 2]);
    expect(vista.stages).toHaveLength(3);
    expect(vista.stages.map((s) => s.nombre)).toEqual(['Cimientos', 'Construcción', 'Especialización']);
  });

  it('deja en la misma etapa los cursos que dependen del mismo prerrequisito', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1 }),
      cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
      cursoDto({ cursoId: 3, orden: 3, prerequisitoIds: [1] }),
    ]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes.map((n) => n.etapa)).toEqual([0, 1, 1]);
    expect(vista.stages).toHaveLength(2);
    expect(vista.stages[1].nodes.map((n) => n.cursoId)).toEqual([2, 3]);
  });

  it('numera las etapas sin huecos aunque la profundidad real los tenga', () => {
    // el 3 cuelga del 1 (profundidad 1) y el 4 del 3 (profundidad 2): no existe ninguno de profundidad
    // intermedia distinta, así que las etapas deben quedar 0, 1, 2 y no 0, 1, 3
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1 }),
      cursoDto({ cursoId: 3, orden: 2, prerequisitoIds: [1] }),
      cursoDto({ cursoId: 4, orden: 3, prerequisitoIds: [1, 3] }),
    ]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes.map((n) => n.etapa)).toEqual([0, 1, 2]);
  });

  it('ignora los prerrequisitos que no están en la ruta', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1, prerequisitoIds: [99] })]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes[0].etapa).toBe(0);
    expect(vista.nodes[0].prerequisitos).toEqual([]);
    expect(vista.nodes[0].status).toBe('current');
  });

  it('no se cuelga si los datos traen un ciclo de prerrequisitos', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1, prerequisitoIds: [2] }),
      cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
    ]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes).toHaveLength(2);
    // los dos quedan bloqueados: ninguno tiene su prerrequisito aprobado
    expect(vista.nodes.map((n) => n.status)).toEqual(['locked', 'locked']);
  });

  it('nombra la etapa «Tu ruta» cuando todo cabe en una, y «Dominio» en la última de cuatro', () => {
    const una = construirRoadmap(roadmapDto([cursoDto({ cursoId: 1 })]), new Set());
    expect(una.stages.map((s) => s.nombre)).toEqual(['Tu ruta']);

    const cuatro = construirRoadmap(
      roadmapDto([
        cursoDto({ cursoId: 1, orden: 1 }),
        cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
        cursoDto({ cursoId: 3, orden: 3, prerequisitoIds: [2] }),
        cursoDto({ cursoId: 4, orden: 4, prerequisitoIds: [3] }),
      ]),
      new Set()
    );
    expect(cuatro.stages.map((s) => s.nombre)).toEqual(['Cimientos', 'Construcción', 'Especialización', 'Dominio']);
  });

  it('ordena los cursos por `orden`, no por el orden en que llegaron', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 9, orden: 3 }), cursoDto({ cursoId: 4, orden: 1 }), cursoDto({ cursoId: 7, orden: 2 })]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes.map((n) => n.cursoId)).toEqual([4, 7, 9]);
  });
});

describe('construirRoadmap — estado de cada paso', () => {
  it('marca como `current` solo el primer paso disponible y los demás como `available`', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1 }), cursoDto({ cursoId: 2, orden: 2 })]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes.map((n) => n.status)).toEqual(['current', 'available']);
    expect(vista.siguiente?.cursoId).toBe(1);
  });

  it('abre el siguiente paso cuando el prerrequisito ya está aprobado', () => {
    const vista = construirRoadmap(cadenaDeTres(), new Set([1]));

    expect(vista.nodes.map((n) => n.status)).toEqual(['completed', 'current', 'locked']);
    expect(vista.nodes[1].prerequisitos).toEqual([{ cursoId: 1, titulo: 'Curso 1', hecho: true }]);
  });

  it('no deja ningún paso como `current` cuando ya aprobó todo', () => {
    const vista = construirRoadmap(cadenaDeTres(), new Set([1, 2, 3]));

    expect(vista.siguiente).toBeNull();
    expect(vista.progreso.porcentaje).toBe(100);
  });

  it('marca `unavailable` el curso dado de baja que todavía no había aprobado, y no lo propone como siguiente', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1, activo: false }), cursoDto({ cursoId: 2, orden: 2 })]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes.map((n) => n.status)).toEqual(['unavailable', 'current']);
    expect(vista.siguiente?.cursoId).toBe(2);
    expect(vista.hayDadosDeBaja).toBe(true);
  });

  it('un curso ya aprobado que se da de baja sigue contando como completado', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1, activo: false })]);

    const vista = construirRoadmap(dto, new Set([1]));

    expect(vista.nodes[0].status).toBe('completed');
    expect(vista.nodes[0].dadoDeBaja).toBe(true);
    expect(vista.hayDadosDeBaja).toBe(true);
    expect(vista.progreso.completados).toBe(1);
  });

  it('un curso dado de baja no bloquea la ruta si su prerrequisito estaba cumplido', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1 }),
      cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1], activo: false }),
    ]);

    const vista = construirRoadmap(dto, new Set([1]));

    expect(vista.nodes[1].status).toBe('unavailable');
    expect(vista.siguiente).toBeNull();
  });
});

describe('construirRoadmap — alternativas que cumplen el paso', () => {
  it('cuenta el paso como cumplido si aprobó una alternativa, y dice con cuál', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1, alternativas: [alternativaDto({ cursoId: 50, titulo: 'Otro camino', duracionHoras: 4 })] }),
    ]);

    const vista = construirRoadmap(dto, new Set([50]));

    expect(vista.nodes[0].status).toBe('completed');
    expect(vista.nodes[0].cumplidoCon).toEqual({ cursoId: 50, titulo: 'Otro camino', horas: 4, habilidades: [] });
  });

  it('una alternativa aprobada también abre los pasos que venían después', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1, alternativas: [alternativaDto({ cursoId: 50 })] }),
      cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] }),
    ]);

    const vista = construirRoadmap(dto, new Set([50]));

    expect(vista.nodes[1].status).toBe('current');
    expect(vista.nodes[1].prerequisitos[0].hecho).toBe(true);
  });

  it('cuando aprobó el curso de la ruta, cumplidoCon queda en null aunque haya alternativas', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, orden: 1, alternativas: [alternativaDto({ cursoId: 50 })] })]);

    const vista = construirRoadmap(dto, new Set([1]));

    expect(vista.nodes[0].cumplidoCon).toBeNull();
  });

  it('las horas hechas y las habilidades cuentan las del curso que de verdad aprobó', () => {
    const dto = roadmapDto([
      cursoDto({
        cursoId: 1,
        orden: 1,
        duracionHoras: 20,
        habilidades: ['Java'],
        alternativas: [alternativaDto({ cursoId: 50, duracionHoras: 6, habilidades: ['Kotlin'] })],
      }),
    ]);

    const vista = construirRoadmap(dto, new Set([50]));

    expect(vista.progreso.horasHechas).toBe(6);
    expect(vista.progreso.habilidadesDesbloqueadas).toEqual(['Kotlin']);
    // la habilidad que dio la alternativa también entra en el total, para no mostrar «1 de 1» mal contado
    expect(vista.progreso.habilidadesTotales.sort()).toEqual(['Java', 'Kotlin']);
  });

  it('una alternativa sin preguntas de examen se marca como que no tiene examen', () => {
    const dto = roadmapDto([
      cursoDto({
        cursoId: 1,
        totalPreguntasExamen: 0,
        alternativas: [alternativaDto({ cursoId: 50, totalPreguntasExamen: 0 }), alternativaDto({ cursoId: 51 })],
      }),
    ]);

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nodes[0].tieneExamen).toBe(false);
    expect(vista.nodes[0].alternativas.map((a) => a.tieneExamen)).toEqual([false, true]);
  });
});

describe('construirRoadmap — progreso', () => {
  it('suma horas, porcentaje y habilidades de lo aprobado', () => {
    const dto = roadmapDto([
      cursoDto({ cursoId: 1, orden: 1, duracionHoras: 10, habilidades: ['SQL', 'Modelado'] }),
      cursoDto({ cursoId: 2, orden: 2, duracionHoras: 30, habilidades: ['SQL', 'Índices'] }),
    ]);

    const { progreso } = construirRoadmap(dto, new Set([1]));

    expect(progreso).toMatchObject({ completados: 1, total: 2, horasHechas: 10, horasTotales: 40, horasFaltan: 30, porcentaje: 50 });
    // sin repetir SQL, que lo dan los dos cursos
    expect(progreso.habilidadesDesbloqueadas).toEqual(['SQL', 'Modelado']);
    expect(progreso.habilidadesTotales).toEqual(['SQL', 'Modelado', 'Índices']);
  });

  it('trata como 0 horas los cursos sin duración, en vez de romper la suma', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, duracionHoras: null }), cursoDto({ cursoId: 2, duracionHoras: 5 })]);

    const { progreso } = construirRoadmap(dto, new Set([1]));

    expect(progreso.horasHechas).toBe(0);
    expect(progreso.horasTotales).toBe(5);
  });

  it('redondea el porcentaje', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1 }), cursoDto({ cursoId: 2 }), cursoDto({ cursoId: 3 })]);

    expect(construirRoadmap(dto, new Set([1])).progreso.porcentaje).toBe(33);
    expect(construirRoadmap(dto, new Set([1, 2])).progreso.porcentaje).toBe(67);
  });

  it('un roadmap sin cursos no divide por cero', () => {
    const vista = construirRoadmap(roadmapDto([]), new Set());

    expect(vista.progreso).toMatchObject({ completados: 0, total: 0, porcentaje: 0, horasTotales: 0, horasFaltan: 0 });
    expect(vista.stages).toEqual([]);
    expect(vista.siguiente).toBeNull();
    expect(vista.hayDadosDeBaja).toBe(false);
  });
});

describe('construirRoadmap — datos de la ruta', () => {
  it('traduce nivel, categorías e intereses a lo que muestra el frontend', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, nivel: 'AVANZADO', categoria: 'MATEMATICAS' })], {
      nivel: 'INTERMEDIO',
      intereses: ['INGENIERIA_CIVIL', 'IDIOMAS'],
    });

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nivel).toBe('intermedio');
    expect(vista.nodes[0].nivel).toBe('avanzado');
    expect(vista.nodes[0].categoria).toBe('Matemáticas');
    expect(vista.areas).toEqual(['Ingeniería Civil', 'Idiomas']);
  });

  it('prefiere la etiqueta de categoría que manda el servidor cuando viene', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, categoria: 'LO_QUE_SEA', categoriaEtiqueta: 'Mecatrónica' })]);

    expect(construirRoadmap(dto, new Set()).nodes[0].categoria).toBe('Mecatrónica');
  });

  it('cae a principiante si el nivel que llega no se reconoce', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1, nivel: 'EXPERTO' })], { nivel: 'EXPERTO' });

    const vista = construirRoadmap(dto, new Set());

    expect(vista.nivel).toBe('principiante');
    expect(vista.nodes[0].nivel).toBe('principiante');
  });

  it('calcula el presupuesto de horas cuando el servidor no lo manda', () => {
    const dto = roadmapDto([cursoDto({ cursoId: 1 })], { horasPorSemana: 6, semanas: 8 });

    expect(construirRoadmap(dto, new Set()).tiempo).toEqual({ horasPorSemana: 6, semanas: 8, presupuesto: 48 });
  });

  it('deja el tiempo en null si la ruta se armó sin límite', () => {
    expect(construirRoadmap(roadmapDto([cursoDto({ cursoId: 1 })]), new Set()).tiempo).toBeNull();
    expect(construirRoadmap(roadmapDto([cursoDto({ cursoId: 1 })], { horasPorSemana: 6 }), new Set()).tiempo).toBeNull();
  });

  it('arrastra los cursos que ya había aprobado antes de armar la ruta', () => {
    const antes = [{ cursoId: 80, titulo: 'Álgebra lineal' }];

    const vista = construirRoadmap(roadmapDto([cursoDto({ cursoId: 1 })]), new Set(), antes);

    expect(vista.aprobadosAntes).toEqual(antes);
  });

  it('sin ese dato, aprobadosAntes queda vacío (roadmaps de antes de la función)', () => {
    expect(construirRoadmap(roadmapDto([cursoDto({ cursoId: 1 })]), new Set()).aprobadosAntes).toEqual([]);
  });
});
