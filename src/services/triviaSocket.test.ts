import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SalaMensaje, TriviaSocketHandlers } from './triviaSocket';

// Doble del cliente STOMP: guarda la configuración con la que lo creó TriviaSocket para poder disparar sus
// callbacks (onConnect, onStompError, beforeConnect) como lo haría el servidor, sin abrir ningún WebSocket.
const { clientes } = vi.hoisted(() => ({ clientes: [] as any[] }));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    config: any;
    connected = false;
    connectHeaders: Record<string, string> = {};
    activate = vi.fn();
    deactivate = vi.fn(async () => undefined);
    publish = vi.fn();
    suscripciones: string[] = [];
    unsubscribes = 0;
    subscribe = vi.fn((destino: string, callback: (frame: { body: string }) => void) => {
      this.suscripciones.push(destino);
      this.ultimoCallback = callback;
      return { unsubscribe: () => (this.unsubscribes += 1) };
    });
    ultimoCallback: ((frame: { body: string }) => void) | null = null;

    constructor(config: any) {
      this.config = config;
      clientes.push(this);
    }
  },
}));

vi.mock('./msalAuth', () => ({
  obtenerAccessToken: vi.fn(),
}));

const { obtenerAccessToken } = await import('./msalAuth');

/** El módulo lee VITE_WS_AUTH_HEADER al cargarse, así que cada prueba lo importa de nuevo. */
async function nuevoSocket(codigo: string, handlers: Partial<TriviaSocketHandlers> = {}) {
  vi.resetModules();
  const { TriviaSocket } = await import('./triviaSocket');
  const recibidos: SalaMensaje[] = [];
  const onAuthError = vi.fn();
  const onConnectionChange = vi.fn();
  const socket = new TriviaSocket(codigo, {
    onMessage: (m) => recibidos.push(m),
    onConnectionChange,
    onAuthError,
    ...handlers,
  });
  return { socket, cliente: clientes[clientes.length - 1], recibidos, onAuthError, onConnectionChange };
}

/** Un frame ERROR como el que manda el broker cuando el interceptor rechaza el CONNECT. */
function frameError(mensaje: string) {
  return { command: 'ERROR', headers: { message: mensaje }, body: '' } as any;
}

function entornoOidc() {
  vi.stubEnv('VITE_AUTH_MODE', 'oidc');
  vi.mocked(obtenerAccessToken).mockResolvedValue('token-de-microsoft');
}

beforeEach(() => {
  clientes.length = 0;
  vi.mocked(obtenerAccessToken).mockReset();
});

describe('la conexión', () => {
  it('apunta al proxy del WebSocket y no a trivia-service directamente', async () => {
    const { cliente } = await nuevoSocket('ABC123');

    expect(cliente.config.brokerURL).toBe(`ws://${window.location.host}/ws-trivia`);
  });

  it('se suscribe al topic de la sala al conectarse', async () => {
    const { cliente, onConnectionChange } = await nuevoSocket('ABC123');

    cliente.config.onConnect();

    expect(cliente.suscripciones).toEqual(['/topic/salas.ABC123']);
    expect(onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('avisa cuando se cae la conexión', async () => {
    const { cliente, onConnectionChange } = await nuevoSocket('ABC123');

    cliente.config.onWebSocketClose();

    expect(onConnectionChange).toHaveBeenCalledWith(false);
  });

  it('cambiar de sala mueve la suscripción sin desconectar', async () => {
    const { socket, cliente } = await nuevoSocket('ABC123');
    cliente.config.onConnect();
    cliente.connected = true;

    socket.cambiarSala('XYZ789');

    expect(cliente.suscripciones).toEqual(['/topic/salas.ABC123', '/topic/salas.XYZ789']);
    expect(cliente.unsubscribes).toBe(1);
    expect(cliente.deactivate).not.toHaveBeenCalled();
  });
});

describe('los mensajes de la sala', () => {
  it('entrega lo que llega por el topic ya convertido', async () => {
    const { cliente, recibidos } = await nuevoSocket('ABC123');
    cliente.config.onConnect();

    cliente.ultimoCallback!({ body: JSON.stringify({ type: 'SALA_UPDATE', codigo: 'ABC123', estado: 'ESPERA', participantes: [] }) });

    expect(recibidos).toEqual([{ type: 'SALA_UPDATE', codigo: 'ABC123', estado: 'ESPERA', participantes: [] }]);
  });

  it('un frame que no es JSON se ignora, no tumba la conexión', async () => {
    const { cliente, recibidos } = await nuevoSocket('ABC123');
    cliente.config.onConnect();

    expect(() => cliente.ultimoCallback!({ body: 'esto no es json' })).not.toThrow();
    expect(recibidos).toEqual([]);
  });
});

describe('lo que se publica', () => {
  it('manda cada acción a su destino, con el usuarioId en el cuerpo', async () => {
    const { socket, cliente } = await nuevoSocket('ABC123');
    cliente.connected = true;

    socket.unirse(7, 'Mariana');
    socket.iniciar();
    socket.responder(7, 2, 3);
    socket.revancha(7, 'Mariana');
    socket.salir(7);

    expect(cliente.publish.mock.calls.map(([c]: any[]) => c)).toEqual([
      { destination: '/app/salas/ABC123/unirse', body: JSON.stringify({ usuarioId: 7, nombre: 'Mariana' }) },
      { destination: '/app/salas/ABC123/iniciar', body: '' },
      { destination: '/app/salas/ABC123/responder', body: JSON.stringify({ usuarioId: 7, indice: 2, opcionElegida: 3 }) },
      { destination: '/app/salas/ABC123/revancha', body: JSON.stringify({ usuarioId: 7, nombre: 'Mariana' }) },
      { destination: '/app/salas/ABC123/salir', body: JSON.stringify({ usuarioId: 7 }) },
    ]);
  });

  it('sin conexión no publica nada (en vez de lanzar un error)', async () => {
    const { socket, cliente } = await nuevoSocket('ABC123');
    cliente.connected = false;

    expect(() => socket.salir(7)).not.toThrow();
    expect(cliente.publish).not.toHaveBeenCalled();
  });
});

describe('el token en el CONNECT, modo legacy', () => {
  it('no manda encabezados ni pide ningún token', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'legacy');
    const { cliente } = await nuevoSocket('ABC123');

    await cliente.config.beforeConnect();

    expect(cliente.connectHeaders).toEqual({});
    expect(vi.mocked(obtenerAccessToken)).not.toHaveBeenCalled();
  });

  it('un ERROR de STOMP solo avisa que se cayó, sin reintentos ni mensajes de sesión', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'legacy');
    const { cliente, onAuthError, onConnectionChange } = await nuevoSocket('ABC123');

    cliente.config.onStompError(frameError('Unauthorized'));

    expect(onConnectionChange).toHaveBeenCalledWith(false);
    expect(onAuthError).not.toHaveBeenCalled();
    expect(cliente.deactivate).not.toHaveBeenCalled();
  });
});

describe('el token en el CONNECT, modo oidc', () => {
  it('manda el access token en el encabezado Authorization del CONNECT', async () => {
    entornoOidc();
    const { cliente } = await nuevoSocket('ABC123');

    await cliente.config.beforeConnect();

    expect(cliente.connectHeaders).toEqual({ Authorization: 'Bearer token-de-microsoft' });
    // sin forzar renovación: en la primera conexión vale el token que MSAL tenga vigente
    expect(vi.mocked(obtenerAccessToken)).toHaveBeenCalledWith(false);
  });

  it('el nombre del encabezado se puede cambiar por variable de entorno', async () => {
    entornoOidc();
    vi.stubEnv('VITE_WS_AUTH_HEADER', 'X-Authorization');
    const { cliente } = await nuevoSocket('ABC123');

    await cliente.config.beforeConnect();

    expect(cliente.connectHeaders).toEqual({ 'X-Authorization': 'Bearer token-de-microsoft' });
  });

  it('si no se puede obtener el token, avisa y no manda un encabezado a medias', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');
    vi.mocked(obtenerAccessToken).mockRejectedValue(new Error('Tu sesión de Microsoft venció.'));
    const { cliente, onAuthError } = await nuevoSocket('ABC123');

    await cliente.config.beforeConnect();

    expect(cliente.connectHeaders).toEqual({});
    expect(onAuthError).toHaveBeenCalledWith('Tu sesión de Microsoft venció.');
  });
});

describe('cuando el servidor rechaza el token del CONNECT', () => {
  it('le da una oportunidad más, y esa vez pide el token renovado a la fuerza', async () => {
    entornoOidc();
    const { cliente, onAuthError } = await nuevoSocket('ABC123');
    await cliente.config.beforeConnect();

    cliente.config.onStompError(frameError('401 Unauthorized'));

    // todavía no se le muestra el error: el cliente se reconecta solo y vuelve a intentar
    expect(onAuthError).not.toHaveBeenCalled();
    expect(cliente.deactivate).not.toHaveBeenCalled();

    vi.mocked(obtenerAccessToken).mockResolvedValue('token-renovado');
    await cliente.config.beforeConnect();

    expect(vi.mocked(obtenerAccessToken)).toHaveBeenLastCalledWith(true);
    expect(cliente.connectHeaders).toEqual({ Authorization: 'Bearer token-renovado' });
  });

  it('si con el token renovado también lo rechaza, deja de reintentar y muestra el error', async () => {
    entornoOidc();
    const { cliente, onAuthError } = await nuevoSocket('ABC123');

    cliente.config.onStompError(frameError('401 Unauthorized'));
    cliente.config.onStompError(frameError('Access denied: invalid token'));

    expect(cliente.deactivate).toHaveBeenCalled();
    expect(onAuthError).toHaveBeenCalledWith('Access denied: invalid token');
  });

  it('un error que no es de token no gasta el reintento ni se le muestra como sesión vencida', async () => {
    entornoOidc();
    const { cliente, onAuthError } = await nuevoSocket('ABC123');

    cliente.config.onStompError(frameError('La sala ya no existe'));

    expect(onAuthError).not.toHaveBeenCalled();
    expect(cliente.deactivate).not.toHaveBeenCalled();

    // y el reintento sigue disponible para un rechazo de token de verdad
    cliente.config.onStompError(frameError('401 Unauthorized'));
    expect(cliente.deactivate).not.toHaveBeenCalled();
  });

  it('reconoce el rechazo venga en inglés o en español', async () => {
    for (const mensaje of ['Forbidden', 'Token JWT no válido', 'No autorizado', 'credenciales inválidas']) {
      entornoOidc();
      const { cliente, onAuthError } = await nuevoSocket('ABC123');

      cliente.config.onStompError(frameError(mensaje));
      cliente.config.onStompError(frameError(mensaje));

      expect(onAuthError, mensaje).toHaveBeenCalled();
    }
  });

  it('tras conectar bien, el reintento vuelve a estar disponible', async () => {
    entornoOidc();
    const { cliente, onAuthError } = await nuevoSocket('ABC123');

    cliente.config.onStompError(frameError('401 Unauthorized'));
    cliente.config.onConnect();
    cliente.config.onStompError(frameError('401 Unauthorized'));

    expect(onAuthError).not.toHaveBeenCalled();
    expect(cliente.deactivate).not.toHaveBeenCalled();
  });

  it('si el frame no trae mensaje, el aviso explica qué hacer', async () => {
    entornoOidc();
    const { cliente, onAuthError } = await nuevoSocket('ABC123');

    cliente.config.onStompError({ command: 'ERROR', headers: {}, body: 'token' });
    cliente.config.onStompError({ command: 'ERROR', headers: {}, body: 'token' });

    expect(onAuthError).toHaveBeenCalledWith(
      'La conexión en vivo rechazó tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo.'
    );
  });
});
