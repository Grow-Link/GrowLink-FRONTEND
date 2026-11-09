// Conexión en vivo a una sala de trivia: STOMP nativo sobre WebSocket (sin
// SockJS) contra trivia-service, vía el proxy de Vite (/ws-trivia -> /ws,
// ver vite.config.ts) para no tener que lidiar con el origen en dev.
//
// Server -> cliente (un solo topic por sala, diferenciado por `type`):
//   /topic/salas.{codigo}: SALA_UPDATE | PREGUNTA | RESPUESTA_REGISTRADA | LEADERBOARD | RESULTADOS_FINALES |
//                          REVANCHA | JUGADOR_SALIO | ERROR
// Cliente -> server:
//   /app/salas/{codigo}/unirse   {usuarioId, nombre}
//   /app/salas/{codigo}/iniciar  (sin body)
//   /app/salas/{codigo}/responder {indice, opcionElegida}
//   /app/salas/{codigo}/revancha {usuarioId, nombre}
//   /app/salas/{codigo}/salir    {usuarioId}
//
// El contrato no detalla el shape exacto de cada `ranking[i]` — se parsea de
// forma flexible (ver parseRankingItem en TriviaRoomPage) igual que el resto
// de clientes de este proyecto.

import { Client, type IFrame, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { esOidc } from './authMode';
import { obtenerAccessToken } from './msalAuth';

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws-trivia`;
}

/**
 * Encabezado nativo del frame CONNECT en el que trivia-service espera el token.
 *
 * StompAuthChannelInterceptor (trivia-service) lee el token de los encabezados nativos del CONNECT con la
 * convención de Spring: `Authorization: Bearer <token>`. NO se pudo confirmar contra ese repositorio desde
 * aquí, así que el nombre se puede cambiar con VITE_WS_AUTH_HEADER sin tocar este archivo — si el
 * interceptor lee otro (`X-Authorization`, `token`...), basta la variable de entorno.
 */
const WS_AUTH_HEADER = (import.meta.env.VITE_WS_AUTH_HEADER ?? '').trim() || 'Authorization';

/** ¿El servidor cortó el CONNECT por el token, o por otra cosa? */
function esRechazoDeToken(frame: IFrame): boolean {
  const texto = `${frame.headers?.message ?? ''} ${frame.body ?? ''}`.toLowerCase();
  return /401|403|unauthor|no autoriz|forbidden|prohib|token|jwt|credential|credencial/.test(texto);
}

export interface ParticipanteMsg {
  usuarioId: number;
  nombre: string;
}

export type SalaMensaje =
  | { type: 'SALA_UPDATE'; codigo: string; estado: string; participantes: ParticipanteMsg[] }
  | { type: 'PREGUNTA'; codigo: string; indice: number; totalPreguntas: number; texto: string; opciones: string[]; duracionSegundos: number; enviadaEnEpochMs: number }
  /** Llega apenas ESE jugador responde (no espera a los demás) — solo para feedback inmediato suyo. */
  | { type: 'RESPUESTA_REGISTRADA'; codigo: string; usuarioId: number; indice: number; correcta: boolean; puntos: number }
  | { type: 'LEADERBOARD'; codigo: string; ranking: unknown[] }
  | {
      type: 'RESULTADOS_FINALES';
      codigo: string;
      ranking: unknown[];
      ganadorUsuarioId: number | null;
      ganadoresUsuarioIds?: number[];
      empate?: boolean;
      numPreguntas?: number;
      /** La partida terminó porque los demás se salieron, no porque se acabaron las preguntas — no hay ganador. */
      abandono?: boolean;
    }
  /** Llega por el topic de la sala VIEJA cuando alguien propone revancha. */
  | { type: 'REVANCHA'; codigo: string; nuevoCodigo: string; hostUsuarioId: number; hostNombre: string }
  /** Alguien se salió de la sala (botón de salir, o STOMP se desconectó y el servidor lo detectó). */
  | { type: 'JUGADOR_SALIO'; codigo: string; usuarioId: number; nombre: string; nuevoHostUsuarioId: number | null; estado: string }
  | { type: 'ERROR'; message: string };

export interface TriviaSocketHandlers {
  onMessage: (msg: SalaMensaje) => void;
  /** true justo cuando queda listo para publicar (ya se puede llamar a unirse). */
  onConnectionChange?: (connected: boolean) => void;
  /**
   * El servidor rechazó la conexión por el token y el reintento con un token renovado tampoco pasó
   * (modo oidc). Ya no se reintenta más: hay que mostrarle el error a la persona.
   */
  onAuthError?: (mensaje: string) => void;
}

export class TriviaSocket {
  private client: Client;
  private subscription: StompSubscription | null = null;
  private handlers: TriviaSocketHandlers;
  /** La próxima conexión pide un token nuevo a la fuerza (lo activa un rechazo por token). */
  private renovarToken = false;
  /** Ya se gastó el único reintento con token renovado. */
  private reintentoGastado = false;

  constructor(private codigo: string, handlers: TriviaSocketHandlers) {
    this.handlers = handlers;
    this.client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      // En modo legacy el CONNECT va sin encabezados, exactamente como antes.
      beforeConnect: async () => {
        if (!esOidc()) return;
        try {
          const token = await obtenerAccessToken(this.renovarToken);
          this.renovarToken = false;
          this.client.connectHeaders = { [WS_AUTH_HEADER]: `Bearer ${token}` };
        } catch (err) {
          this.client.connectHeaders = {};
          this.handlers.onAuthError?.(
            err instanceof Error ? err.message : 'No se pudo obtener el token para la conexión en vivo.'
          );
        }
      },
      onConnect: () => {
        this.reintentoGastado = false;
        this.subscribeToCurrent();
        this.handlers.onConnectionChange?.(true);
      },
      onDisconnect: () => this.handlers.onConnectionChange?.(false),
      onWebSocketClose: () => this.handlers.onConnectionChange?.(false),
      onStompError: (frame) => this.manejarStompError(frame),
    });
  }

  /**
   * Un ERROR de STOMP. Si fue por el token (modo oidc) se le da UNA oportunidad más con un token renovado:
   * el servidor cierra el socket después del ERROR y el cliente ya se reconecta solo (reconnectDelay), y
   * en esa reconexión beforeConnect pide el token a la fuerza. Si vuelve a pasar, se deja de reintentar y
   * se muestra el error.
   */
  private manejarStompError(frame: IFrame): void {
    this.handlers.onConnectionChange?.(false);
    if (!esOidc() || !esRechazoDeToken(frame)) return;

    if (this.reintentoGastado) {
      void this.client.deactivate();
      this.handlers.onAuthError?.(
        frame.headers?.message?.trim() ||
          'La conexión en vivo rechazó tu sesión. Vuelve a iniciar sesión e inténtalo de nuevo.'
      );
      return;
    }
    this.reintentoGastado = true;
    this.renovarToken = true;
  }

  private subscribeToCurrent(): void {
    this.subscription?.unsubscribe();
    this.subscription = this.client.subscribe(`/topic/salas.${this.codigo}`, (frame: IMessage) => {
      try {
        this.handlers.onMessage(JSON.parse(frame.body) as SalaMensaje);
      } catch {
        // frame que no es JSON válido: se ignora, no se cae la conexión
      }
    });
  }

  /**
   * Mueve esta MISMA conexión WS a otra sala, sin desconectar — lo usa quien
   * propone una revancha. El backend no asocia nada a la conexión (el
   * usuarioId siempre va en el body de cada mensaje, no por sesión); lo que
   * ya registró fue el "revancha" que mandó: ese mensaje crea la sala nueva
   * y lo deja como host/participante ahí mismo, así que no hace falta volver
   * a mandar "unirse". Reusar la conexión es solo para no hacerlo esperar un
   * reconnect de WS cuando ya está conectado y lo único que cambia es la sala.
   */
  cambiarSala(nuevoCodigo: string): void {
    this.codigo = nuevoCodigo;
    if (this.client.connected) this.subscribeToCurrent();
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    void this.client.deactivate();
  }

  unirse(usuarioId: number, nombre: string): void {
    this.publish('unirse', { usuarioId, nombre });
  }

  iniciar(): void {
    this.publish('iniciar');
  }

  // El backend no asocia la sesión WS a un usuario (igual que unirse): cada
  // mensaje que necesita saber quién lo manda lleva usuarioId explícito en el
  // body — RespuestaRequest(Long usuarioId, int indice, int opcionElegida).
  responder(usuarioId: number, indice: number, opcionElegida: number): void {
    this.publish('responder', { usuarioId, indice, opcionElegida });
  }

  revancha(usuarioId: number, nombre: string): void {
    this.publish('revancha', { usuarioId, nombre });
  }

  /** Avisa que esta persona se sale de la sala — en espera o a media partida. */
  salir(usuarioId: number): void {
    this.publish('salir', { usuarioId });
  }

  private publish(accion: string, body?: unknown): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/salas/${this.codigo}/${accion}`,
      body: body !== undefined ? JSON.stringify(body) : '',
    });
  }
}
