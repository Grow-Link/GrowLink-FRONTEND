// ATRIBUTO confidencialidad (S3): el front cifra lo que manda y descifra lo que recibe, ENCIMA de HTTPS (no en lugar
// de él). Para cada petición a un microservicio:
//   1. crea una llave AES-256-GCM nueva, solo para esa petición
//   2. la envuelve con la llave pública RSA del servicio (RSA-OAEP, SHA-256) y la manda en X-GL-Clave
//   3. cifra el cuerpo con esa llave (IV de 12 bytes al frente) y lo manda como application/octet-stream,
//      con el tipo original en X-GL-Tipo
//   4. el servicio descifra, responde y cifra la respuesta con la MISMA llave (otro IV); aquí se descifra
// La llave pública se pide una vez por servicio (GET /api/seguridad/clave-publica) y se recuerda. La privada nunca
// sale de los servicios. Todo con Web Crypto del navegador, sin librerías.
//
// Si no se puede cifrar (el servicio no tiene la llave pública, el navegador no tiene Web Crypto, o es un cuerpo que
// no es texto) la petición sale como siempre: el cifrado no deja a nadie sin servicio. Quien quiera exigirlo lo
// hace en el servicio (GROWLINK_CIFRADO_OBLIGATORIO). Los WebSocket de la trivia quedan fuera: van por wss.
//
// VITE_CIFRADO: `off` lo apaga, `on` lo prende; sin valor está prendido, salvo en las pruebas (ahí hay que prenderlo
// a propósito, para que los fetch simulados no reciban una llamada de más).

const PREFIJOS = ['/api-usuarios', '/api-cursos', '/api-trivia'] as const;
const TIPO_CIFRADO = 'application/octet-stream';
const BYTES_IV = 12;
/** Si pedir la llave pública falla, no se vuelve a intentar durante este tiempo (las peticiones salen sin cifrar). */
const ESPERA_TRAS_FALLO_MS = 30_000;

export const CABECERA_CLAVE = 'X-GL-Clave';
export const CABECERA_CIFRADO = 'X-GL-Cifrado';
export const CABECERA_TIPO = 'X-GL-Tipo';

export function cifradoActivo(): boolean {
  const valor = import.meta.env.VITE_CIFRADO;
  if (valor === 'off') return false;
  if (valor === 'on') return true;
  return import.meta.env.MODE !== 'test';
}

export interface PeticionCifrada {
  url: string;
  init: RequestInit | undefined;
  /** La llave AES de esta petición, para descifrar la respuesta. null si la petición salió sin cifrar. */
  llave: CryptoKey | null;
}

interface LlavePublica {
  llave: CryptoKey | null;
  hasta: number;
}

const llavesPublicas = new Map<string, Promise<LlavePublica>>();

/** Olvida las llaves públicas recordadas: se usa cuando el servicio rechaza una petición por no poder descifrarla. */
export function olvidarLlavesPublicas(): void {
  llavesPublicas.clear();
}

function prefijoDe(url: string): string | undefined {
  return PREFIJOS.find((p) => url.startsWith(`${p}/`));
}

function aBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arreglo = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let texto = '';
  for (const b of arreglo) texto += String.fromCharCode(b);
  return btoa(texto);
}

function desdeBase64(base64: string): Uint8Array {
  const texto = atob(base64);
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i += 1) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

async function pedirLlavePublica(prefijo: string): Promise<LlavePublica> {
  try {
    const res = await fetch(`${prefijo}/api/seguridad/clave-publica`);
    if (!res.ok) throw new Error(String(res.status));
    const { clave } = (await res.json()) as { clave?: string };
    if (!clave) throw new Error('sin clave');
    const llave = await crypto.subtle.importKey(
      'spki',
      desdeBase64(clave) as BufferSource,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    return { llave, hasta: Number.POSITIVE_INFINITY };
  } catch {
    return { llave: null, hasta: Date.now() + ESPERA_TRAS_FALLO_MS };
  }
}

async function llavePublicaDe(prefijo: string): Promise<CryptoKey | null> {
  let pedida = llavesPublicas.get(prefijo);
  if (pedida) {
    const actual = await pedida;
    if (actual.llave || actual.hasta > Date.now()) return actual.llave;
  }
  pedida = pedirLlavePublica(prefijo);
  llavesPublicas.set(prefijo, pedida);
  return (await pedida).llave;
}

async function cifrarTexto(llave: CryptoKey, texto: string): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(BYTES_IV));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, llave, new TextEncoder().encode(texto))
  );
  const salida = new Uint8Array(BYTES_IV + cifrado.length);
  salida.set(iv, 0);
  salida.set(cifrado, BYTES_IV);
  return salida;
}

/** Prepara la petición para salir cifrada. Si no se puede (o no corresponde), la devuelve igual, con llave null. */
export async function cifrarPeticion(url: string, init?: RequestInit): Promise<PeticionCifrada> {
  const sinCifrar: PeticionCifrada = { url, init, llave: null };
  const prefijo = prefijoDe(url);
  if (!cifradoActivo() || !prefijo || typeof crypto === 'undefined' || !crypto.subtle) return sinCifrar;

  const cuerpo = init?.body;
  if (cuerpo !== undefined && cuerpo !== null && typeof cuerpo !== 'string') return sinCifrar;

  const publica = await llavePublicaDe(prefijo);
  if (!publica) return sinCifrar;

  const llave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const envuelta = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publica, await crypto.subtle.exportKey('raw', llave));

  const headers = new Headers(init?.headers);
  headers.set(CABECERA_CLAVE, aBase64(envuelta));
  let nuevoCuerpo: BodyInit | null | undefined = cuerpo;
  if (typeof cuerpo === 'string' && cuerpo !== '') {
    headers.set(CABECERA_TIPO, headers.get('Content-Type') ?? 'application/json');
    headers.set('Content-Type', TIPO_CIFRADO);
    nuevoCuerpo = (await cifrarTexto(llave, cuerpo)) as BodyInit;
  }
  return { url, init: { ...init, headers, body: nuevoCuerpo }, llave };
}

/** Si la respuesta viene cifrada, la descifra y devuelve una igual a la que habría llegado sin cifrar. */
export async function descifrarRespuesta(res: Response, llave: CryptoKey): Promise<Response> {
  if (res.headers.get(CABECERA_CIFRADO) !== '1') return res;
  const datos = new Uint8Array(await res.arrayBuffer());
  const claro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: datos.slice(0, BYTES_IV) as BufferSource },
    llave,
    datos.slice(BYTES_IV) as BufferSource
  );
  const headers = new Headers(res.headers);
  for (const nombre of [CABECERA_CIFRADO, CABECERA_TIPO, 'Content-Length', 'Content-Type']) headers.delete(nombre);
  headers.set('Content-Type', res.headers.get(CABECERA_TIPO) ?? 'application/json');
  return new Response(claro, { status: res.status, statusText: res.statusText, headers });
}
