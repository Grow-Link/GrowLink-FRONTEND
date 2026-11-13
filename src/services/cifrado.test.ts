import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { send } from './backendSession';
import { cifradoActivo, olvidarLlavesPublicas } from './cifrado';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {},
  obtenerAccessToken: vi.fn(),
}));

// Un "servicio" de mentira que hace lo mismo que CifradoFilter: publica una llave RSA, desenvuelve la llave AES de
// cada petición, descifra el cuerpo, responde y cifra la respuesta con la misma llave. Si el front cifra mal, aquí
// no se entiende nada; si el servicio de verdad cambia su formato, esta prueba y CifradoDeCanalTest lo delatan.
const BYTES_IV = 12;
const aBase64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)));
const deBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function servicioFalso(opciones: { sinLlave?: boolean; rechazarLaPrimera?: boolean } = {}) {
  const par = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const publica = aBase64(await crypto.subtle.exportKey('spki', par.publicKey));
  const vistas: { url: string; cuerpoEnElCanal?: string; headers: Headers; claro?: string }[] = [];
  let pedidasLasLlaves = 0;
  let rechazos = opciones.rechazarLaPrimera ? 1 : 0;

  const fetchFalso = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/seguridad/clave-publica')) {
      pedidasLasLlaves += 1;
      if (opciones.sinLlave) return new Response('no hay', { status: 404 });
      return new Response(JSON.stringify({ clave: publica }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const headers = new Headers(init?.headers);
    const visto: (typeof vistas)[number] = { url, headers };
    vistas.push(visto);
    const envuelta = headers.get('X-GL-Clave');
    if (!envuelta) return new Response(JSON.stringify({ eco: init?.body ?? null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (rechazos > 0) {
      rechazos -= 1;
      return new Response('{"message":"No se pudo descifrar la peticion."}', { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const aes = await crypto.subtle.importKey('raw', await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, par.privateKey, deBase64(envuelta)), 'AES-GCM', false, ['encrypt', 'decrypt']);
    const cuerpo = init?.body as Uint8Array | undefined;
    if (cuerpo) {
      visto.cuerpoEnElCanal = new TextDecoder('latin1').decode(cuerpo);
      visto.claro = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: cuerpo.slice(0, BYTES_IV) }, aes, cuerpo.slice(BYTES_IV)));
    }
    const respuesta = new TextEncoder().encode(JSON.stringify({ recibido: visto.claro ?? null, secreto: 'contenido-sensible' }));
    const iv = crypto.getRandomValues(new Uint8Array(BYTES_IV));
    const cifrada = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, respuesta));
    const salida = new Uint8Array(BYTES_IV + cifrada.length);
    salida.set(iv);
    salida.set(cifrada, BYTES_IV);
    return new Response(salida, {
      status: 201,
      headers: { 'X-GL-Cifrado': '1', 'X-GL-Tipo': 'application/json', 'Content-Type': 'application/octet-stream' },
    });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return { vistas, llavesPedidas: () => pedidasLasLlaves };
}

describe('cifrado de las peticiones a los servicios', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CIFRADO', 'on');
    olvidarLlavesPublicas();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('en las pruebas está apagado salvo que se prenda a propósito, y VITE_CIFRADO=off manda sobre todo', () => {
    vi.stubEnv('VITE_CIFRADO', '');
    expect(cifradoActivo()).toBe(false);
    vi.stubEnv('VITE_CIFRADO', 'on');
    expect(cifradoActivo()).toBe(true);
    vi.stubEnv('VITE_CIFRADO', 'off');
    expect(cifradoActivo()).toBe(false);
  });

  it('el cuerpo sale cifrado (no se lee en el canal), el servicio lo entiende y la respuesta vuelve descifrada', async () => {
    const servicio = await servicioFalso();

    const res = await send('/api-usuarios/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioId: 7 }) }, 'usuarios-service');

    const visto = servicio.vistas[0];
    expect(visto.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(visto.headers.get('X-GL-Tipo')).toBe('application/json');
    expect(visto.headers.get('X-GL-Clave')).toBeTruthy();
    expect(visto.cuerpoEnElCanal).not.toContain('usuarioId');
    expect(visto.claro).toBe('{"usuarioId":7}');
    // quien llama recibe lo de siempre: mismo estado, mismo tipo, mismo JSON
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('X-GL-Cifrado')).toBeNull();
    expect(await res.json()).toEqual({ recibido: '{"usuarioId":7}', secreto: 'contenido-sensible' });
  });

  it('un GET (sin cuerpo) también pide la respuesta cifrada, y cada petición usa una llave nueva', async () => {
    const servicio = await servicioFalso();

    const a = await send('/api-cursos/api/cursos', undefined, 'cursos-service');
    const b = await send('/api-cursos/api/cursos', undefined, 'cursos-service');

    expect((await a.json()).secreto).toBe('contenido-sensible');
    expect((await b.json()).secreto).toBe('contenido-sensible');
    expect(servicio.vistas[0].headers.get('X-GL-Clave')).not.toBe(servicio.vistas[1].headers.get('X-GL-Clave'));
    // la llave pública se pide una sola vez por servicio
    expect(servicio.llavesPedidas()).toBe(1);
  });

  it('si el servicio no tiene la llave pública, la petición sale sin cifrar y funciona igual', async () => {
    const servicio = await servicioFalso({ sinLlave: true });

    const res = await send('/api-trivia/api/preguntas', { method: 'POST', body: JSON.stringify({ a: 1 }) }, 'trivia-service');

    expect(servicio.vistas[0].headers.get('X-GL-Clave')).toBeNull();
    expect(await res.json()).toEqual({ eco: '{"a":1}' });
  });

  it('un cuerpo que no es texto no se cifra, y una direccion que no es de un servicio nuestro ni siquiera sale', async () => {
    const servicio = await servicioFalso();

    await send('/api-cursos/api/subir', { method: 'POST', body: new Blob(['x']) }, 'cursos-service');
    expect(servicio.vistas.every((v) => v.headers.get('X-GL-Clave') === null)).toBe(true);

    // send solo llama a /api-usuarios, /api-cursos y /api-trivia: cualquier otra direccion se rechaza antes de tocar la red
    const antes = servicio.vistas.length;
    await expect(send('/otra-cosa/x', undefined, 'otro')).rejects.toThrow('Direccion no permitida');
    await expect(send('https://sitio-ajeno.example/api-cursos/x', undefined, 'otro')).rejects.toThrow('Direccion no permitida');
    expect(servicio.vistas.length).toBe(antes);
  });

  it('si el servicio no pudo descifrar (cambió de llave), se vuelve a pedir la llave y se intenta una vez más', async () => {
    const servicio = await servicioFalso({ rechazarLaPrimera: true });

    const res = await send('/api-usuarios/api/auth/login', { method: 'POST', body: JSON.stringify({ usuarioId: 1 }) }, 'usuarios-service');

    expect(res.status).toBe(201);
    expect(servicio.vistas).toHaveLength(2);
    expect(servicio.llavesPedidas()).toBe(2);
  });
});
