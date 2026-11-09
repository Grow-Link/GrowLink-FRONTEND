import { describe, expect, it, vi } from 'vitest';
import { fetchRoadmap, generarRoadmap, nivelLabel } from './roadmapApi';
import { SessionExpiredError, setSession, type BackendSession } from './backendSession';
import { cursoDto, jsonResponse, roadmapDto, textoResponse } from '../pruebas/datos';
import { simularFetch, simularFetchEnOrden } from '../pruebas/fetchFalso';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin = true;
  },
  obtenerAccessToken: vi.fn().mockResolvedValue('token-de-microsoft'),
  cerrarSesionMicrosoft: vi.fn(),
}));

const SESION: BackendSession = { token: 'jwt', usuarioId: 7, nombre: 'Mariana', rol: 'USUARIO' };

/** Un curso completado como lo manda GET /api/cursos/completados. */
function completado(over: Record<string, unknown>) {
  return { cursoId: 1, titulo: 'Curso', categoria: 'INGENIERIA_SISTEMAS', fechaCompletado: '2026-01-01T00:00:00Z', ...over };
}

describe('fetchRoadmap', () => {
  it('pide el roadmap y los completados de la persona con sesión, y los une', async () => {
    const fetchFalso = simularFetchEnOrden([
      jsonResponse(roadmapDto([cursoDto({ cursoId: 1, orden: 1 }), cursoDto({ cursoId: 2, orden: 2, prerequisitoIds: [1] })])),
      jsonResponse([completado({ cursoId: 1 })]),
    ]);
    setSession(SESION);

    const vista = await fetchRoadmap();

    expect(fetchFalso.llamadas.map((l) => l.url)).toEqual([
      '/api-cursos/api/roadmap/mio?usuarioId=7',
      '/api-cursos/api/cursos/completados?usuarioId=7',
    ]);
    expect(vista?.progreso).toMatchObject({ completados: 1, total: 2 });
    expect(vista?.siguiente?.cursoId).toBe(2);
  });

  it('devuelve null cuando la persona todavía no tiene roadmap (404)', async () => {
    const fetchFalso = simularFetch(() => textoResponse('', 404));
    setSession(SESION);

    await expect(fetchRoadmap()).resolves.toBeNull();
    // ni siquiera pide los completados: no hay ruta con la que cruzarlos
    expect(fetchFalso.llamadas).toHaveLength(1);
  });

  it('sin sesión no llama a nadie', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));

    await expect(fetchRoadmap()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchFalso.llamadas).toEqual([]);
  });

  it('separa lo que ya había aprobado antes de armar la ruta, en las áreas de la ruta', async () => {
    simularFetchEnOrden([
      jsonResponse(
        roadmapDto([cursoDto({ cursoId: 1, orden: 1 })], { creadoEn: '2026-02-01T00:00:00Z', intereses: ['INGENIERIA_SISTEMAS'] })
      ),
      jsonResponse([
        // de su área y aprobado ANTES de armar la ruta: se muestra como ya hecho
        completado({ cursoId: 80, titulo: 'Álgebra', fechaCompletado: '2026-01-15T00:00:00Z' }),
        // de su área pero aprobado DESPUÉS: no es algo que la ruta debiera haber incluido
        completado({ cursoId: 81, titulo: 'Después', fechaCompletado: '2026-03-01T00:00:00Z' }),
        // de otra área: no tiene que ver con esta ruta
        completado({ cursoId: 82, titulo: 'Otra área', categoria: 'DERECHO', fechaCompletado: '2026-01-02T00:00:00Z' }),
        // está en la ruta: ya aparece como paso completado, no hace falta repetirlo
        completado({ cursoId: 1, titulo: 'Curso 1', fechaCompletado: '2026-01-03T00:00:00Z' }),
      ]),
    ]);
    setSession(SESION);

    const vista = await fetchRoadmap();

    expect(vista?.aprobadosAntes).toEqual([{ cursoId: 80, titulo: 'Álgebra' }]);
  });

  it('sin áreas declaradas en la ruta, no filtra por área', async () => {
    simularFetchEnOrden([
      jsonResponse(roadmapDto([cursoDto({ cursoId: 1 })], { creadoEn: '2026-02-01T00:00:00Z' })),
      jsonResponse([completado({ cursoId: 82, titulo: 'Otra área', categoria: 'DERECHO', fechaCompletado: '2026-01-02T00:00:00Z' })]),
    ]);
    setSession(SESION);

    await expect(fetchRoadmap()).resolves.toMatchObject({ aprobadosAntes: [{ cursoId: 82, titulo: 'Otra área' }] });
  });

  it('descarta los completados sin fecha, porque no se puede saber si fueron antes', async () => {
    simularFetchEnOrden([
      jsonResponse(roadmapDto([cursoDto({ cursoId: 1 })], { intereses: ['INGENIERIA_SISTEMAS'] })),
      jsonResponse([{ cursoId: 80, titulo: 'Sin fecha', categoria: 'INGENIERIA_SISTEMAS' }]),
    ]);
    setSession(SESION);

    await expect(fetchRoadmap()).resolves.toMatchObject({ aprobadosAntes: [] });
  });
});

describe('generarRoadmap', () => {
  it('manda el perfil con los enums del backend y el id de la sesión', async () => {
    const fetchFalso = simularFetch(() => jsonResponse(roadmapDto([cursoDto({ cursoId: 1 })])));
    setSession(SESION);

    await generarRoadmap({ goals: 'Ser arquitecta', interests: ['Ingeniería de Sistemas', 'Matemáticas'], level: 'intermedio' });

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-cursos/api/roadmap/generar',
      metodo: 'POST',
      cuerpo: {
        usuarioId: 7,
        metas: 'Ser arquitecta',
        intereses: ['INGENIERIA_SISTEMAS', 'MATEMATICAS'],
        nivel: 'INTERMEDIO',
      },
    });
  });

  it('incluye el tiempo solo si están las horas y las semanas', async () => {
    const fetchFalso = simularFetch(() => jsonResponse(roadmapDto([cursoDto({ cursoId: 1 })])));
    setSession(SESION);

    await generarRoadmap({ goals: 'x', interests: [], level: 'principiante', hoursPerWeek: 6, weeks: 8 });
    expect(fetchFalso.ultima().cuerpo).toMatchObject({ horasPorSemana: 6, semanas: 8 });

    await generarRoadmap({ goals: 'x', interests: [], level: 'principiante', hoursPerWeek: 6, weeks: null });
    expect(fetchFalso.ultima().cuerpo).not.toHaveProperty('horasPorSemana');
  });

  it('un 400 (meta sin sentido) sube con el mensaje del servidor', async () => {
    simularFetch(() => jsonResponse({ message: 'Describe mejor tu meta' }, 400));
    setSession(SESION);

    await expect(generarRoadmap({ goals: 'asdf', interests: [], level: 'principiante' })).rejects.toThrow('Describe mejor tu meta');
  });

  it('un 422 (no hay cursos para eso) también llega como mensaje', async () => {
    simularFetch(() => jsonResponse({ message: 'No hay cursos para esas áreas' }, 422));
    setSession(SESION);

    await expect(generarRoadmap({ goals: 'x', interests: ['Derecho'], level: 'avanzado' })).rejects.toThrow(
      'No hay cursos para esas áreas'
    );
  });
});

describe('nivelLabel', () => {
  it('pone en bonito los tres niveles', () => {
    expect(nivelLabel('PRINCIPIANTE')).toBe('Principiante');
    expect(nivelLabel('AVANZADO')).toBe('Avanzado');
  });

  it('deja tal cual lo que no reconoce', () => {
    expect(nivelLabel('EXPERTO')).toBe('EXPERTO');
  });
});
