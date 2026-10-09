// Conexión en vivo a una sala de trivia: STOMP nativo sobre WebSocket (sin
// SockJS) contra trivia-service, vía el proxy de Vite (/ws-trivia -> /ws,
// ver vite.config.ts) para no tener que lidiar con el origen en dev.
//
// Server -> cliente (un solo topic por sala, diferenciado por `type`):
//   /topic/salas.{codigo}: SALA_UPDATE | PREGUNTA | RESPUESTA_REGISTRADA | LEADERBOARD | RESULTADOS_FINALES | REVANCHA | ERROR
// Cliente -> server:
//   /app/salas/{codigo}/unirse   {usuarioId, nombre}
//   /app/salas/{codigo}/iniciar  (sin body)
//   /app/salas/{codigo}/responder {indice, opcionElegida}
//   /app/salas/{codigo}/revancha {usuarioId, nombre}
//
// El contrato no detalla el shape exacto de cada `ranking[i]` — se parsea de
// forma flexible (ver parseRankingItem en TriviaRoomPage) igual que el resto
// de clientes de este proyecto.

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws-trivia`;
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
  | { type: 'RESULTADOS_FINALES'; codigo: string; ranking: unknown[]; ganadorUsuarioId: number }
  /** Llega por el topic de la sala VIEJA cuando alguien propone revancha. */
  | { type: 'REVANCHA'; codigo: string; nuevoCodigo: string; hostUsuarioId: number; hostNombre: string }
  | { type: 'ERROR'; message: string };

export interface TriviaSocketHandlers {
  onMessage: (msg: SalaMensaje) => void;
  /** true justo cuando queda listo para publicar (ya se puede llamar a unirse). */
  onConnectionChange?: (connected: boolean) => void;
}

export class TriviaSocket {
  private client: Client;
  private subscription: StompSubscription | null = null;
  private handlers: TriviaSocketHandlers;

  constructor(private codigo: string, handlers: TriviaSocketHandlers) {
    this.handlers = handlers;
    this.client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      onConnect: () => {
        this.subscribeToCurrent();
        this.handlers.onConnectionChange?.(true);
      },
      onDisconnect: () => this.handlers.onConnectionChange?.(false),
      onWebSocketClose: () => this.handlers.onConnectionChange?.(false),
      onStompError: () => this.handlers.onConnectionChange?.(false),
    });
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

  private publish(accion: string, body?: unknown): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/salas/${this.codigo}/${accion}`,
      body: body !== undefined ? JSON.stringify(body) : '',
    });
  }
}
