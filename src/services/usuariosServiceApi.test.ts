import { describe, expect, it, vi } from 'vitest';
import {
  buscarPersonas,
  elegirRol,
  getEstadoHome,
  getPerfil,
  getUsuarioMe,
  getUsuariosQuemados,
  guardarIntereses,
  guardarNivel,
  guardarTiempo,
  iniciarSesionConToken,
  login,
  logout,
  nombresDePersonas,
  obtenerJardin,
  plantarSemilla,
  regarPlanta,
  rolDesdeBackend,
} from './usuariosServiceApi';
import { getSession, setSession, type BackendSession } from './backendSession';
import { cerrarSesionMicrosoft, obtenerAccessToken } from './msalAuth';
import { jsonResponse, textoResponse } from '../pruebas/datos';
import { simularFetch, simularFetchEnOrden } from '../pruebas/fetchFalso';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin = true;
  },
  obtenerAccessToken: vi.fn().mockResolvedValue('token-de-microsoft'),
  cerrarSesionMicrosoft: vi.fn().mockResolvedValue(undefined),
}));

const SESION: BackendSession = { token: 'jwt', usuarioId: 7, nombre: 'Mariana', rol: 'USUARIO' };

describe('rolDesdeBackend', () => {
  it('traduce los roles del backend a los del frontend', () => {
    expect(rolDesdeBackend('USUARIO')).toBe('user');
    expect(rolDesdeBackend('PUBLICADOR')).toBe('publisher');
    expect(rolDesdeBackend('ADMIN')).toBe('admin');
  });

  it('cae en «user» si llega un rol que no se conoce', () => {
    expect(rolDesdeBackend('MODERADOR')).toBe('user');
    expect(rolDesdeBackend('')).toBe('user');
  });
});

describe('getUsuariosQuemados', () => {
  it('convierte la lista del backend y rellena lo que no venga', () => {
    simularFetch(() => jsonResponse([{ id: 1, nombre: 'Ana', rol: 'PUBLICADOR', cargo: 'Docente' }, { id: '2' }]));

    return expect(getUsuariosQuemados()).resolves.toEqual([
      { id: 1, nombre: 'Ana', rol: 'PUBLICADOR', cargo: 'Docente' },
      { id: 2, nombre: '', rol: 'USUARIO', cargo: undefined },
    ]);
  });

  it('devuelve una lista vacía si el backend no manda un arreglo', async () => {
    simularFetch(() => jsonResponse({ usuarios: [] }));

    await expect(getUsuariosQuemados()).resolves.toEqual([]);
  });

  it('va sin token: es la lista que se ve antes de iniciar sesión', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));

    await getUsuariosQuemados();

    expect(fetchFalso.ultima().authorization).toBeNull();
  });
});

describe('login (modo legacy)', () => {
  it('manda el id elegido y guarda la sesión con el usuario que resolvió el backend', async () => {
    const fetchFalso = simularFetch(() =>
      jsonResponse({ token: 'jwt-nuevo', usuario: { id: 3, nombre: 'Beto Ramírez', rol: 'PUBLICADOR', cargo: 'Docente' } })
    );

    const session = await login({ id: 3, nombre: 'Beto', rol: 'USUARIO' });

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-usuarios/api/auth/login',
      metodo: 'POST',
      cuerpo: { usuarioId: 3 },
    });
    expect(session).toEqual({ token: 'jwt-nuevo', usuarioId: 3, nombre: 'Beto Ramírez', rol: 'PUBLICADOR', cargo: 'Docente' });
    expect(getSession()).toEqual(session);
  });

  it('si la respuesta no trae el usuario, usa el que eligió la pantalla', async () => {
    simularFetch(() => jsonResponse({ token: 'jwt-nuevo' }));

    const session = await login({ id: 5, nombre: 'Ana', rol: 'ADMIN' });

    expect(session).toMatchObject({ usuarioId: 5, nombre: 'Ana', rol: 'ADMIN' });
  });

  it('no deja sesión guardada si el backend rechaza el login', async () => {
    simularFetch(() => jsonResponse({ message: 'Ese usuario no existe' }, 404));

    await expect(login({ id: 99, nombre: 'Nadie', rol: 'USUARIO' })).rejects.toThrow('Ese usuario no existe');
    expect(getSession()).toBeNull();
  });
});

describe('logout', () => {
  it('borra la sesión de la app y también la de MSAL', async () => {
    setSession(SESION);

    await logout();

    expect(getSession()).toBeNull();
    expect(vi.mocked(cerrarSesionMicrosoft)).toHaveBeenCalled();
  });
});

describe('getPerfil', () => {
  it('traduce intereses y nivel a lo que muestra el frontend', async () => {
    simularFetch(() =>
      jsonResponse({
        metas: 'Ser arquitecta',
        intereses: ['INGENIERIA_SISTEMAS', 'MATEMATICAS'],
        nivel: 'INTERMEDIO',
        completo: true,
        triviasGanadas: 4,
        horasPorSemana: 6,
        semanas: 8,
      })
    );
    setSession(SESION);

    await expect(getPerfil()).resolves.toEqual({
      metas: 'Ser arquitecta',
      intereses: ['Ingeniería de Sistemas', 'Matemáticas'],
      nivel: 'intermedio',
      completo: true,
      triviasGanadas: 4,
      horasPorSemana: 6,
      semanas: 8,
    });
  });

  it('un perfil vacío queda con todo en null, sin inventar valores', async () => {
    simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await expect(getPerfil()).resolves.toEqual({
      metas: null,
      intereses: [],
      nivel: null,
      completo: false,
      triviasGanadas: 0,
      horasPorSemana: null,
      semanas: null,
    });
  });

  it('un nivel que no se reconoce queda en null, no en principiante', async () => {
    simularFetch(() => jsonResponse({ nivel: 'EXPERTO' }));
    setSession(SESION);

    await expect(getPerfil()).resolves.toMatchObject({ nivel: null });
  });
});

describe('guardar el perfil', () => {
  it('manda los intereses como el enum del backend y descarta lo que no existe', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await guardarIntereses(['Ingeniería Civil', 'Gastronomía', 'Idiomas']);

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-usuarios/api/perfil/intereses',
      metodo: 'PUT',
      cuerpo: { intereses: ['INGENIERIA_CIVIL', 'IDIOMAS'] },
    });
  });

  it('manda el nivel en mayúsculas', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await guardarNivel('avanzado');

    expect(fetchFalso.ultima().cuerpo).toEqual({ nivel: 'AVANZADO' });
  });

  it('manda el tiempo solo si están las horas y las semanas', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await guardarTiempo(6, 8);
    expect(fetchFalso.ultima().cuerpo).toEqual({ horasPorSemana: 6, semanas: 8 });

    // sin límite de tiempo: el cuerpo va vacío y el backend quita la restricción
    await guardarTiempo(null, null);
    expect(fetchFalso.ultima().cuerpo).toEqual({});

    await guardarTiempo(6, null);
    expect(fetchFalso.ultima().cuerpo).toEqual({});
  });
});

describe('getEstadoHome', () => {
  it('devuelve el estado y las secciones que manda el backend', async () => {
    simularFetch(() => jsonResponse({ estado: 'CON_ROADMAP', secciones: ['roadmap', 'trivia'] }));
    setSession(SESION);

    await expect(getEstadoHome()).resolves.toEqual({ estado: 'CON_ROADMAP', secciones: ['roadmap', 'trivia'] });
  });

  it('ante una respuesta incompleta asume que todavía no hay perfil', async () => {
    simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await expect(getEstadoHome()).resolves.toEqual({ estado: 'SIN_PERFIL', secciones: [] });
  });
});

describe('getUsuarioMe y la elección de rol', () => {
  it('pregunta quién soy con el token y marca que falta escoger el rol', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    const fetchFalso = simularFetch(() =>
      jsonResponse({ id: 12, nombre: 'Mariana Malagón', rol: 'USUARIO', rolElegido: false })
    );

    const me = await getUsuarioMe();

    expect(fetchFalso.ultima().url).toBe('/api-usuarios/api/usuarios/me');
    expect(fetchFalso.ultima().authorization).toBe('Bearer token-de-microsoft');
    expect(me).toEqual({ id: 12, nombre: 'Mariana Malagón', rol: 'USUARIO', cargo: undefined, rolElegido: false });
  });

  it('si el campo rolElegido no viene, no se le vuelve a pedir el rol', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    simularFetch(() => jsonResponse({ id: 12, nombre: 'Mariana', rol: 'USUARIO' }));

    await expect(getUsuarioMe()).resolves.toMatchObject({ rolElegido: true });
  });

  it('manda el rol escogido y devuelve el usuario ya actualizado', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    const fetchFalso = simularFetch(() =>
      jsonResponse({ id: 12, nombre: 'Mariana', rol: 'PUBLICADOR', rolElegido: true })
    );

    const me = await elegirRol('PUBLICADOR');

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-usuarios/api/usuarios/me/rol',
      metodo: 'PUT',
      cuerpo: { rol: 'PUBLICADOR' },
    });
    expect(me).toMatchObject({ rol: 'PUBLICADOR', rolElegido: true });
  });

  it('un 403 al guardar el rol sube con el mensaje del servidor, para poder reintentar', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    simularFetchEnOrden([
      jsonResponse({ message: 'No puedes cambiar tu rol' }, 403),
      jsonResponse({ message: 'No puedes cambiar tu rol' }, 403),
    ]);

    await expect(elegirRol('USUARIO')).rejects.toThrow();
  });

  it('iniciarSesionConToken guarda la sesión sin token: el access token lo administra MSAL', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    simularFetch(() => jsonResponse({ id: 12, nombre: 'Mariana', rol: 'USUARIO', cargo: 'Estudiante', rolElegido: true }));

    const { session, rolElegido } = await iniciarSesionConToken();

    expect(session).toEqual({ token: '', usuarioId: 12, nombre: 'Mariana', rol: 'USUARIO', cargo: 'Estudiante' });
    expect(rolElegido).toBe(true);
    expect(getSession()).toEqual(session);
    expect(vi.mocked(obtenerAccessToken)).toHaveBeenCalled();
  });
});

describe('el jardín', () => {
  it('convierte el estado completo y traduce las categorías', async () => {
    simularFetch(() =>
      jsonResponse({
        gotas: 3,
        espacios: 6,
        semillas: [{ id: 1, categoria: 'INGENIERIA_CIVIL', roadmapId: 9, titulo: 'Ruta civil', obtenidaEn: '2026-02-01' }],
        plantas: [{ id: 2, categoria: 'IDIOMAS', roadmapId: 8, espacio: 0, riegos: 1, riegosNecesarios: 3, etapa: 'BROTE', plantadaEn: '2026-01-01', florecidaEn: null }],
      })
    );
    setSession(SESION);

    const jardin = await obtenerJardin();

    expect(jardin.gotas).toBe(3);
    expect(jardin.semillas[0].categoria).toBe('Ingeniería Civil');
    expect(jardin.plantas[0]).toMatchObject({ categoria: 'Idiomas', etapa: 'BROTE', riegos: 1, florecidaEn: null });
  });

  it('un jardín recién creado trae los valores por defecto', async () => {
    simularFetch(() => jsonResponse({}));
    setSession(SESION);

    await expect(obtenerJardin()).resolves.toEqual({ gotas: 0, espacios: 6, semillas: [], plantas: [] });
  });

  it('plantar manda el espacio elegido', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ id: 4, etapa: 'SEMILLA' }));
    setSession(SESION);

    await plantarSemilla(4, 2);

    expect(fetchFalso.ultima()).toMatchObject({
      url: '/api-usuarios/api/jardin/plantas/4/plantar',
      metodo: 'POST',
      cuerpo: { espacio: 2 },
    });
  });

  it('regar devuelve las gotas que quedan y la planta actualizada', async () => {
    simularFetch(() => jsonResponse({ gotas: 2, planta: { id: 4, etapa: 'PLANTA', riegos: 2, categoria: 'DERECHO' } }));
    setSession(SESION);

    const resultado = await regarPlanta(4);

    expect(resultado.gotas).toBe(2);
    expect(resultado.planta).toMatchObject({ id: 4, etapa: 'PLANTA', riegos: 2, categoria: 'Derecho' });
  });

  it('un 409 al regar (sin gotas) sube como error con el mensaje del servidor', async () => {
    simularFetch(() => jsonResponse({ message: 'No tienes gotas' }, 409));
    setSession(SESION);

    await expect(regarPlanta(4)).rejects.toThrow('No tienes gotas');
  });
});

describe('buscarPersonas', () => {
  it('no llama al backend con menos de dos letras', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([]));
    setSession(SESION);

    await expect(buscarPersonas(' a ')).resolves.toEqual([]);
    expect(fetchFalso.llamadas).toEqual([]);
  });

  it('codifica el texto buscado y convierte los resultados', async () => {
    const fetchFalso = simularFetch(() => jsonResponse([{ id: 3, nombre: 'Ana Ruiz', rol: 'USUARIO', triviasGanadas: 2 }]));
    setSession(SESION);

    const personas = await buscarPersonas('ana ruiz');

    expect(fetchFalso.ultima().url).toBe('/api-usuarios/api/usuarios/buscar?q=ana%20ruiz');
    expect(personas).toEqual([{ id: 3, nombre: 'Ana Ruiz', rol: 'USUARIO', cargo: undefined, triviasGanadas: 2 }]);
  });
});

describe('nombresDePersonas', () => {
  it('arma un mapa de id a nombre para mostrar quién publicó cada curso', async () => {
    simularFetch(() => jsonResponse([{ id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Beto' }]));

    const mapa = await nombresDePersonas();

    expect(mapa.get('1')).toBe('Ana');
    expect(mapa.get('2')).toBe('Beto');
  });

  it('si el servicio no responde devuelve un mapa vacío, no rompe la pantalla', async () => {
    simularFetch(() => textoResponse('', 503));

    await expect(nombresDePersonas()).resolves.toEqual(new Map());
  });
});
