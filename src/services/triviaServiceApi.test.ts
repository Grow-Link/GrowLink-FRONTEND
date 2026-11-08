import { describe, expect, it, vi } from 'vitest';
import {
  aceptarReto,
  agregarPregunta,
  crearSala,
  listarGanadores,
  listarMisPartidas,
  obtenerPartida,
  obtenerSala,
  rechazarReto,
  retar,
  retosRecibidos,
  salonDeLaFama,
} from './triviaServiceApi';
import { setSession, type BackendSession } from './backendSession';
import { jsonResponse, textoResponse } from '../pruebas/datos';
import { simularFetch } from '../pruebas/fetchFalso';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin = true;
  },
  obtenerAccessToken: vi.fn().mockResolvedValue('token-de-microsoft'),
  cerrarSesionMicrosoft: vi.fn(),
}));

const SESION: BackendSession = { token: 'jwt', usuarioId: 7, nombre: 'Mariana', rol: 'USUARIO' };

function partidaBackend(over: Record<string, unknown> = {}) {
  return {
    codigo: 'ABC123',
    categoria: 'INGENIERIA_SISTEMAS',
    numPreguntas: 10,
    duracionPreguntaSegundos: 15,
    totalJugadores: 3,
    ganadorUsuarioId: 7,
    ganadorNombre: 'Mariana',
    puntosGanador: 900,
    empate: false,
    duracionTotalSegundos: 180,
    finalizadaEn: '2026-03-01T10:00:00Z',
    ...over,
  };
}

describe('crearSala', () => {
  it('manda la categoría como el enum del backend y devuelve la sala convertida', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({ id: 1, codigo: 'ABC123', categoria: 'INGENIERIA_CIVIL', estado: 'ESPERA', numPreguntas: 10, duracionSegundos: 15, revanchaCodigo: null })
    );

    const sala = await crearSala({ categoria: 'Ingeniería Civil', hostUsuarioId: 7, hostNombre: 'Mariana', numPreguntas: 10, duracionSegundos: 15 });

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-trivia/api/salas',
      metodo: 'POST',
      cuerpo: { categoria: 'INGENIERIA_CIVIL', hostUsuarioId: 7, hostNombre: 'Mariana', numPreguntas: 10, duracionSegundos: 15 },
    });
    expect(sala).toEqual({ id: 1, codigo: 'ABC123', categoria: 'Ingeniería Civil', estado: 'ESPERA', numPreguntas: 10, duracionSegundos: 15, revanchaCodigo: null });
  });

  it('crear una sala no pide token (el endpoint es abierto)', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ id: 1, codigo: 'A' }));

    await crearSala({ categoria: 'Idiomas', hostUsuarioId: 7, hostNombre: 'Mariana', numPreguntas: 5, duracionSegundos: 10 });

    expect(fetchFalso.ultima().authorization).toBeNull();
  });

  it('un error del servidor sube con su mensaje', async () => {
    simularFetch(() => jsonResponse({ message: 'No hay preguntas de esa área' }, 422));

    await expect(
      crearSala({ categoria: 'Derecho', hostUsuarioId: 7, hostNombre: 'Mariana', numPreguntas: 5, duracionSegundos: 10 })
    ).rejects.toThrow('No hay preguntas de esa área');
  });
});

describe('obtenerSala', () => {
  it('codifica el código en la ruta', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ id: 1, codigo: 'A B' }));

    await obtenerSala('A B');

    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/salas/A%20B');
  });

  it('devuelve null si el código no existe', async () => {
    simularFetch(() => textoResponse('', 404));

    await expect(obtenerSala('NOEXISTE')).resolves.toBeNull();
  });

  it('arrastra el código de la revancha cuando ya hay una', async () => {
    simularFetch(() => jsonResponse({ id: 1, codigo: 'ABC', revanchaCodigo: 'XYZ' }));

    await expect(obtenerSala('ABC')).resolves.toMatchObject({ revanchaCodigo: 'XYZ' });
  });
});

describe('historial de partidas', () => {
  it('convierte los ganadores con su podio', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse([
        {
          partida: partidaBackend(),
          podio: [{ posicion: 1, usuarioId: 7, nombre: 'Mariana', puntos: 900, aciertos: 9 }],
        },
      ])
    );
    setSession(SESION);

    const ganadores = await listarGanadores(5);

    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/partidas/ganadores?limite=5');
    expect(ganadores[0].partida).toMatchObject({ codigo: 'ABC123', categoria: 'Ingeniería de Sistemas', empate: false });
    expect(ganadores[0].podio).toEqual([{ posicion: 1, usuarioId: 7, nombre: 'Mariana', puntos: 900, aciertos: 9 }]);
  });

  it('una partida sin ganador (empate o abandono) deja el ganador en null', async () => {
    simularFetch(() => jsonResponse([{ partida: partidaBackend({ ganadorUsuarioId: null, ganadorNombre: null, empate: true }), podio: [] }]));
    setSession(SESION);

    const [primera] = await listarGanadores();

    expect(primera.partida.ganadorUsuarioId).toBeNull();
    expect(primera.partida.empate).toBe(true);
  });

  it('una partida sin podio no rompe la conversión', async () => {
    simularFetch(() => jsonResponse([{ partida: partidaBackend() }]));
    setSession(SESION);

    await expect(listarGanadores()).resolves.toMatchObject([{ podio: [] }]);
  });

  it('el acta de una partida trae el ranking completo', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({ partida: partidaBackend(), ranking: [{ posicion: 2, usuarioId: 8, nombre: 'Ana', puntos: 400, aciertos: 4 }] })
    );
    setSession(SESION);

    const detalle = await obtenerPartida('ABC123');

    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/partidas/ABC123');
    expect(detalle.ranking).toHaveLength(1);
  });

  it('mis partidas traen mi puesto y mis puntos', async () => {
    simularFetch(() => jsonResponse([{ partida: partidaBackend(), miPosicion: 2, misPuntos: 400, misAciertos: 4 }]));
    setSession(SESION);

    await expect(listarMisPartidas()).resolves.toMatchObject([{ miPosicion: 2, misPuntos: 400, misAciertos: 4 }]);
  });

  it('el salón de la fama cuenta victorias y mejor puntaje', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([{ usuarioId: 7, nombre: 'Mariana', victorias: 5, mejorPuntaje: 900 }]));
    setSession(SESION);

    await expect(salonDeLaFama(3)).resolves.toEqual([{ usuarioId: 7, nombre: 'Mariana', victorias: 5, mejorPuntaje: 900 }]);
    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/partidas/salon-de-la-fama?limite=3');
  });

  it('el historial va con token: es información de la persona con sesión', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));
    setSession(SESION);

    await listarMisPartidas();

    expect(fetchFalso.ultima().authorization).toBe('Bearer jwt');
  });
});

describe('retos', () => {
  it('manda el reto con la categoría traducida y devuelve el reto creado', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({
        id: 1,
        retadorUsuarioId: 7,
        retadorNombre: 'Mariana',
        retadoUsuarioId: 8,
        retadoNombre: 'Ana',
        categoria: 'MATEMATICAS',
        numPreguntas: 5,
        duracionSegundos: 10,
        mensaje: '¡A ver!',
        codigoSala: 'XYZ789',
        estado: 'PENDIENTE',
        creadoEn: '2026-03-01T10:00:00Z',
        expiraEn: '2026-03-01T10:30:00Z',
      })
    );
    setSession(SESION);

    const reto = await retar({
      retadoUsuarioId: 8,
      retadoNombre: 'Ana',
      retadorNombre: 'Mariana',
      categoria: 'Matemáticas',
      numPreguntas: 5,
      duracionSegundos: 10,
      mensaje: '¡A ver!',
    });

    expect(fetchFalso.ultima().cuerpo).toMatchObject({ categoria: 'MATEMATICAS', retadoUsuarioId: 8 });
    expect(reto).toMatchObject({ id: 1, categoria: 'Matemáticas', estado: 'PENDIENTE', codigoSala: 'XYZ789' });
  });

  it('los retos recibidos se convierten uno por uno, y sin mensaje queda texto vacío', async () => {
    simularFetch(() =>
      jsonResponse([
        { id: 1, retadorUsuarioId: 7, retadorNombre: 'Mariana', retadoUsuarioId: 8, retadoNombre: 'Ana', categoria: 'IDIOMAS', numPreguntas: 5, duracionSegundos: 10, codigoSala: 'A', estado: 'PENDIENTE', creadoEn: 'x', expiraEn: 'y' },
      ])
    );
    setSession(SESION);

    const retos = await retosRecibidos();

    expect(retos).toHaveLength(1);
    expect(retos[0]).toMatchObject({ categoria: 'Idiomas', mensaje: '' });
  });

  it('aceptar y rechazar van al endpoint de su acción', async () => {
    const respuesta = { id: 1, retadorUsuarioId: 7, retadoUsuarioId: 8, categoria: 'IDIOMAS', codigoSala: 'A', estado: 'ACEPTADO', creadoEn: 'x', expiraEn: 'y', numPreguntas: 5, duracionSegundos: 10, retadorNombre: 'M', retadoNombre: 'A' };
    const fetchFalso = simularFetch(() => jsonResponse(respuesta));
    setSession(SESION);

    await aceptarReto(1);
    expect(fetchFalso.ultima()).toMatchObject({ url: '/api-trivia/api/retos/1/aceptar', metodo: 'POST' });

    await rechazarReto(1);
    expect(fetchFalso.ultima()).toMatchObject({ url: '/api-trivia/api/retos/1/rechazar', metodo: 'POST' });
  });
});

describe('agregarPregunta', () => {
  it('manda la categoría traducida y devuelve la pregunta guardada', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({ id: 9, categoria: 'INGENIERIA_CIVIL', texto: '¿Qué es un voladizo?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 1 })
    );
    setSession(SESION);

    const pregunta = await agregarPregunta({ categoria: 'Ingeniería Civil', texto: '¿Qué es un voladizo?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 1 });

    expect(fetchFalso.ultima().cuerpo).toMatchObject({ categoria: 'INGENIERIA_CIVIL', respuestaCorrecta: 1 });
    expect(pregunta).toEqual({ id: 9, categoria: 'Ingeniería Civil', texto: '¿Qué es un voladizo?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 1 });
  });

  it('si el servidor dice que no tiene cursos en esa área, el mensaje llega a la pantalla', async () => {
    simularFetch(() => jsonResponse({ message: 'No tienes cursos publicados en esa área' }, 403));
    setSession(SESION);

    await expect(
      agregarPregunta({ categoria: 'Derecho', texto: '¿?', opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: 0 })
    ).rejects.toThrow();
  });
});
