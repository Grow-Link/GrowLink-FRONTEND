import { describe, expect, it, vi } from 'vitest';
import {
  CATEGORIAS_CURSOS,
  CATEGORIA_ENUM,
  NIVEL_A_BACKEND,
  NIVEL_DESDE_BACKEND,
  actualizarPrerequisitos,
  categoriaDesdeEnum,
  crearCurso,
  darDeBajaCurso,
  editarCurso,
  getHabilidades,
  listarAreas,
  listarCatalogo,
  listarCompletados,
  listarPorPublicador,
  obtenerCurso,
  obtenerExamen,
  parseCurso,
  presentarExamen,
  sugerirPrerequisitos,
} from './cursosServiceApi';
import { setSession, type BackendSession } from './backendSession';
import { jsonResponse, textoResponse } from '../pruebas/datos';
import { simularFetch, simularFetchEnOrden } from '../pruebas/fetchFalso';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin = true;
  },
  obtenerAccessToken: vi.fn().mockResolvedValue('token-de-microsoft'),
  cerrarSesionMicrosoft: vi.fn(),
}));

const SESION: BackendSession = { token: 'jwt', usuarioId: 7, nombre: 'Mariana', rol: 'PUBLICADOR' };

/** Un CursoResponse como el que manda cursos-service. */
function cursoBackend(over: Record<string, unknown> = {}) {
  return {
    id: 10,
    titulo: 'Bases de Datos',
    descripcion: 'Modelo relacional',
    categoria: 'INGENIERIA_SISTEMAS',
    nivel: 'INTERMEDIO',
    habilidades: [{ id: 1, nombre: 'SQL', categoria: 'INGENIERIA_SISTEMAS' }],
    linkContenido: 'https://ejemplo.test/curso',
    prerequisitoIds: [3, 4],
    publicadorUsuarioId: 2,
    activo: true,
    duracionHoras: 20,
    temario: ['Álgebra relacional', 'Normalización'],
    totalPreguntasExamen: 10,
    ...over,
  };
}

describe('categorías y niveles', () => {
  it('traduce el enum del backend al nombre que se muestra, y al revés', () => {
    for (const categoria of CATEGORIAS_CURSOS) {
      expect(categoriaDesdeEnum(CATEGORIA_ENUM[categoria])).toBe(categoria);
    }
  });

  it('deja pasar tal cual un valor de categoría que no conoce', () => {
    expect(categoriaDesdeEnum('GASTRONOMIA')).toBe('GASTRONOMIA');
  });

  it('los tres niveles van y vuelven sin perderse', () => {
    for (const [enumBackend, nivel] of Object.entries(NIVEL_DESDE_BACKEND)) {
      expect(NIVEL_A_BACKEND[nivel]).toBe(enumBackend);
    }
  });
});

describe('parseCurso', () => {
  it('convierte un curso completo al tipo del frontend', () => {
    const curso = parseCurso(cursoBackend());

    expect(curso).toMatchObject({
      id: '10',
      title: 'Bases de Datos',
      category: 'Ingeniería de Sistemas',
      level: 'intermedio',
      skills: ['SQL'],
      prerequisites: ['3', '4'],
      publisherId: '2',
      status: 'active',
      durationHours: 20,
      syllabus: ['Álgebra relacional', 'Normalización'],
      examQuestions: 10,
    });
  });

  it('marca como inactivo el curso dado de baja', () => {
    expect(parseCurso(cursoBackend({ activo: false })).status).toBe('inactive');
  });

  it('no se cae con un curso al que le faltan campos', () => {
    const curso = parseCurso({ id: 1 });

    expect(curso).toMatchObject({
      id: '1',
      title: '',
      level: 'principiante',
      skills: [],
      prerequisites: [],
      durationHours: null,
      syllabus: [],
      examQuestions: 0,
    });
  });
});

describe('listar el catálogo', () => {
  it('sin filtros pide el catálogo completo', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([cursoBackend()]));
    setSession(SESION);

    const cursos = await listarCatalogo();

    expect(fetchFalso.ultima().url).toBe('/api-cursos/api/cursos');
    expect(cursos).toHaveLength(1);
  });

  it('manda la categoría y el nivel como los enums del backend', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));
    setSession(SESION);

    await listarCatalogo('Ingeniería Civil', 'avanzado');

    expect(fetchFalso.ultima().url).toBe('/api-cursos/api/cursos?categoria=INGENIERIA_CIVIL&nivel=AVANZADO');
  });

  it('deja pasar una categoría desconocida sin romper la consulta', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));
    setSession(SESION);

    await listarCatalogo('GASTRONOMIA');

    expect(fetchFalso.ultima().url).toContain('categoria=GASTRONOMIA');
  });

  it('devuelve una lista vacía si la respuesta no es un arreglo', async () => {
    simularFetch(() => jsonResponse({ cursos: [] }));
    setSession(SESION);

    await expect(listarCatalogo()).resolves.toEqual([]);
  });

  it('filtra por publicador cuando se piden los cursos propios', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));
    setSession(SESION);

    await listarPorPublicador(2);

    expect(fetchFalso.ultima().url).toBe('/api-cursos/api/cursos?publicadorUsuarioId=2');
  });
});

describe('obtenerCurso', () => {
  it('devuelve el curso cuando existe', async () => {
    simularFetch(() => jsonResponse(cursoBackend()));
    setSession(SESION);

    await expect(obtenerCurso(10)).resolves.toMatchObject({ id: '10' });
  });

  it('devuelve null con un 404, en vez de lanzar un error', async () => {
    simularFetch(() => textoResponse('', 404));
    setSession(SESION);

    await expect(obtenerCurso(999)).resolves.toBeNull();
  });
});

describe('listarAreas', () => {
  it('convierte el resumen y pone la etiqueta si el backend no la manda', async () => {
    simularFetch(() =>
      jsonResponse([
        { area: 'INGENIERIA_CIVIL', cursos: 4, horasTotales: 60, principiante: 2, intermedio: 1, avanzado: 1, habilidades: ['Concreto'], ejemplos: ['Estática'] },
        { area: 'IDIOMAS', etiqueta: 'Idiomas y más' },
      ])
    );
    setSession(SESION);

    const areas = await listarAreas();

    expect(areas[0]).toEqual({
      area: 'INGENIERIA_CIVIL',
      etiqueta: 'Ingeniería Civil',
      cursos: 4,
      horasTotales: 60,
      principiante: 2,
      intermedio: 1,
      avanzado: 1,
      habilidades: ['Concreto'],
      ejemplos: ['Estática'],
    });
    expect(areas[1]).toMatchObject({ etiqueta: 'Idiomas y más', cursos: 0, habilidades: [] });
  });
});

describe('exámenes', () => {
  it('convierte el examen y no espera que venga la respuesta correcta', async () => {
    simularFetch(() =>
      jsonResponse({
        cursoId: '10',
        titulo: 'Bases de Datos',
        minimoAprobacion: 80,
        yaCompletado: false,
        preguntas: [{ id: 1, enunciado: '¿Qué es una llave primaria?', opciones: ['a', 'b', 'c', 'd'] }],
      })
    );
    setSession(SESION);

    const examen = await obtenerExamen(10);

    expect(examen).toEqual({
      cursoId: 10,
      titulo: 'Bases de Datos',
      minimoAprobacion: 80,
      yaCompletado: false,
      preguntas: [{ id: 1, enunciado: '¿Qué es una llave primaria?', opciones: ['a', 'b', 'c', 'd'] }],
    });
  });

  it('usa 70 como mínimo de aprobación si el backend no lo manda', async () => {
    simularFetch(() => jsonResponse({ cursoId: 10 }));
    setSession(SESION);

    await expect(obtenerExamen(10)).resolves.toMatchObject({ minimoAprobacion: 70, preguntas: [] });
  });

  it('manda las respuestas en orden y devuelve el resultado', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({ aprobado: true, aciertos: 8, total: 10, porcentaje: 80, minimoAprobacion: 70, cursoCompletado: true })
    );
    setSession(SESION);

    const resultado = await presentarExamen(10, [0, 2, -1]);

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-cursos/api/cursos/10/examen',
      metodo: 'POST',
      // -1 es "la dejó en blanco"
      cuerpo: { respuestas: [0, 2, -1] },
    });
    expect(resultado.aprobado).toBe(true);
  });
});

describe('listarCompletados', () => {
  it('convierte el historial, incluyendo los cursos ya dados de baja', async () => {
    simularFetch(() =>
      jsonResponse([
        { cursoId: 10, titulo: 'Bases de Datos', categoria: 'INGENIERIA_SISTEMAS', nivel: 'INTERMEDIO', habilidades: [{ nombre: 'SQL' }], fechaCompletado: '2026-02-01', disponible: false },
      ])
    );
    setSession(SESION);

    await expect(listarCompletados(7)).resolves.toEqual([
      {
        cursoId: 10,
        titulo: 'Bases de Datos',
        categoria: 'Ingeniería de Sistemas',
        nivel: 'intermedio',
        habilidades: ['SQL'],
        fechaCompletado: '2026-02-01',
        disponible: false,
      },
    ]);
  });
});

describe('publicar y editar', () => {
  it('resuelve los ids de las habilidades por su nombre antes de crear el curso', async () => {
    const fetchFalso = simularFetchEnOrden([
      // 1) el catálogo de habilidades de la categoría
      jsonResponse([
        { id: 1, nombre: 'SQL', categoria: 'INGENIERIA_SISTEMAS' },
        { id: 2, nombre: 'Modelado', categoria: 'INGENIERIA_SISTEMAS' },
        { id: 3, nombre: 'Redes', categoria: 'INGENIERIA_SISTEMAS' },
      ]),
      // 2) el curso creado
      jsonResponse(cursoBackend()),
    ]);
    setSession(SESION);

    await crearCurso({
      titulo: 'Bases de Datos',
      descripcion: 'Modelo relacional',
      categoria: 'Ingeniería de Sistemas',
      nivel: 'intermedio',
      habilidades: ['SQL', 'Modelado', 'Inventada'],
      linkContenido: 'https://ejemplo.test/curso',
      publicadorUsuarioId: 2,
      prerequisitoIds: [3],
      duracionHoras: 20,
      temario: ['Normalización'],
      examen: [{ enunciado: '¿Y?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 0 }],
    });

    expect(fetchFalso.llamadas[0].url).toBe('/api-cursos/api/habilidades?categoria=INGENIERIA_SISTEMAS');
    expect(fetchFalso.llamadas[1].cuerpo).toMatchObject({
      categoria: 'INGENIERIA_SISTEMAS',
      nivel: 'INTERMEDIO',
      // solo los ids de las que existen: «Inventada» se descarta
      habilidadIds: [1, 2],
      prerequisitoIds: [3],
    });
  });

  it('al editar no manda el examen si no se tocó, para que el curso conserve el que tenía', async () => {
    const fetchFalso = simularFetchEnOrden([jsonResponse([]), jsonResponse(cursoBackend())]);
    setSession(SESION);

    await editarCurso(10, {
      titulo: 'Bases de Datos II',
      descripcion: 'Más a fondo',
      categoria: 'Ingeniería de Sistemas',
      nivel: 'avanzado',
      habilidades: [],
      linkContenido: 'https://ejemplo.test/curso',
      duracionHoras: 25,
      temario: [],
    });

    const cuerpo = fetchFalso.llamadas[1].cuerpo;
    expect(fetchFalso.llamadas[1].metodo).toBe('PUT');
    expect(cuerpo).not.toHaveProperty('examen');
    expect(cuerpo).toMatchObject({ titulo: 'Bases de Datos II', nivel: 'AVANZADO' });
  });

  it('al editar sí manda el examen cuando se reemplazó', async () => {
    const fetchFalso = simularFetchEnOrden([jsonResponse([]), jsonResponse(cursoBackend())]);
    setSession(SESION);

    await editarCurso(10, {
      titulo: 'x',
      descripcion: 'y',
      categoria: 'Ingeniería de Sistemas',
      nivel: 'principiante',
      habilidades: [],
      linkContenido: '',
      duracionHoras: 1,
      temario: [],
      examen: [{ enunciado: '¿Y?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 2 }],
    });

    expect(fetchFalso.llamadas[1].cuerpo.examen).toHaveLength(1);
  });

  it('reemplaza los prerequisitos con un PUT', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await actualizarPrerequisitos(10, [3, 4]);

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-cursos/api/cursos/10/prerequisitos',
      metodo: 'PUT',
      cuerpo: { prerequisitoIds: [3, 4] },
    });
  });

  it('dar de baja es un PATCH y no espera cuerpo de vuelta', async () => {
    const fetchFalso = simularFetch(() => new Response(null, { status: 204 }));
    setSession(SESION);

    await expect(darDeBajaCurso(10)).resolves.toBeUndefined();
    expect(fetchFalso.ultima()).toMatchObject({ url: '/api-cursos/api/cursos/10/baja', metodo: 'PATCH' });
  });

  it('si dar de baja falla, el mensaje del servidor sube como error', async () => {
    simularFetch(() => jsonResponse({ message: 'Ese curso no es tuyo' }, 409));
    setSession(SESION);

    await expect(darDeBajaCurso(10)).rejects.toThrow('Ese curso no es tuyo');
  });
});

describe('getHabilidades', () => {
  it('pide el catálogo con el enum de la categoría, no con el nombre que se muestra', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([{ id: 1, nombre: 'Concreto' }]));
    setSession(SESION);

    const habilidades = await getHabilidades('Ingeniería Civil');

    expect(fetchFalso.ultima().url).toBe('/api-cursos/api/habilidades?categoria=INGENIERIA_CIVIL');
    expect(habilidades).toEqual(['Concreto']);
  });

  it('acepta las tres formas en las que puede llegar la lista', async () => {
    setSession(SESION);

    simularFetch(() => jsonResponse(['SQL', 'Redes']));
    await expect(getHabilidades('Idiomas')).resolves.toEqual(['SQL', 'Redes']);

    simularFetch(() => jsonResponse({ habilidades: [{ nombre: 'SQL' }] }));
    await expect(getHabilidades('Idiomas')).resolves.toEqual(['SQL']);
  });
});

describe('sugerirPrerequisitos', () => {
  it('manda categoría y nivel como los enums del backend', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ prerequisitos: [], modoRespaldo: false }));
    setSession(SESION);

    await sugerirPrerequisitos({ categoria: 'Ingeniería Civil', nivel: 'intermedio', titulo: 'Hormigón' });

    expect(fetchFalso.ultima().cuerpo).toMatchObject({ categoria: 'INGENIERIA_CIVIL', nivel: 'INTERMEDIO', titulo: 'Hormigón' });
  });

  it('entiende las sugerencias vengan como objetos o como texto', async () => {
    setSession(SESION);

    simularFetch(() => jsonResponse({ prerequisitos: [{ cursoId: 5, titulo: 'Estática' }], modoRespaldo: false }));
    await expect(sugerirPrerequisitos({ categoria: 'Ingeniería Civil', nivel: 'INTERMEDIO', titulo: 'x' })).resolves.toEqual({
      prerequisitos: [{ id: '5', titulo: 'Estática' }],
      modoRespaldo: false,
    });

    simularFetch(() => jsonResponse(['Estática']));
    await expect(sugerirPrerequisitos({ categoria: 'Ingeniería Civil', nivel: 'INTERMEDIO', titulo: 'x' })).resolves.toMatchObject({
      prerequisitos: [{ id: 'Estática', titulo: 'Estática' }],
    });
  });

  it('asume modo de respaldo cuando la respuesta no dice si hubo IA', async () => {
    simularFetch(() => jsonResponse({ prerequisitos: [] }));
    setSession(SESION);

    await expect(
      sugerirPrerequisitos({ categoria: 'Ingeniería Civil', nivel: 'INTERMEDIO', titulo: 'x' })
    ).resolves.toMatchObject({ modoRespaldo: true });
  });
});
