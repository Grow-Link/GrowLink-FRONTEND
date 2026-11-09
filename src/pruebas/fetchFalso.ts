// Un fetch simulado para probar la capa de servicios: registra cada llamada (url, método, cuerpo y el
// encabezado Authorization) y responde lo que diga la prueba. No hay red de por medio.

import { expect, vi } from 'vitest';

export interface LlamadaFetch {
  url: string;
  metodo: string;
  /** El cuerpo ya convertido de JSON, o undefined si la petición no llevaba cuerpo. */
  cuerpo: any;
  /** El valor del encabezado Authorization, o null si la petición fue sin token. */
  authorization: string | null;
}

export interface FetchSimulado {
  llamadas: LlamadaFetch[];
  /** La última llamada; falla la prueba si no hubo ninguna. */
  ultima: () => LlamadaFetch;
}

type Responder = (llamada: LlamadaFetch) => Response | Promise<Response>;

/** Instala un fetch que responde con `responder`. Se desinstala solo al terminar la prueba (ver setup.ts). */
export function simularFetch(responder: Responder): FetchSimulado {
  const llamadas: LlamadaFetch[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const cuerpoCrudo = init?.body;
      const llamada: LlamadaFetch = {
        url: String(input),
        metodo: (init?.method ?? 'GET').toUpperCase(),
        cuerpo: typeof cuerpoCrudo === 'string' && cuerpoCrudo ? JSON.parse(cuerpoCrudo) : undefined,
        authorization: new Headers(init?.headers).get('Authorization'),
      };
      llamadas.push(llamada);
      return responder(llamada);
    })
  );

  return {
    llamadas,
    ultima: () => {
      expect(llamadas.length, 'se esperaba al menos una llamada a fetch').toBeGreaterThan(0);
      return llamadas[llamadas.length - 1];
    },
  };
}

/** Responde las peticiones en orden, una respuesta por llamada. Falla si llegan más de las previstas. */
export function simularFetchEnOrden(respuestas: (Response | (() => Response))[]): FetchSimulado {
  let i = 0;
  return simularFetch(() => {
    expect(i, 'llegaron más llamadas a fetch que respuestas preparadas').toBeLessThan(respuestas.length);
    const siguiente = respuestas[i++];
    return typeof siguiente === 'function' ? siguiente() : siguiente;
  });
}

/** Un fetch que siempre falla, como cuando el servicio no está corriendo. */
export function simularFetchCaido(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    })
  );
}
