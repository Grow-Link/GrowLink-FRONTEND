// Conexión en vivo a una sala de trivia: STOMP nativo sobre WebSocket (sin
// SockJS) contra trivia-service, vía el proxy de Vite (/ws-trivia -> /ws,
// ver vite.config.ts) para no tener que lidiar con el origen en dev.
//
// Server -> cliente (un solo topic por sala, diferenciado por `type`):
//   /topic/salas/{codigo}: SALA_UPDATE | PREGUNTA | LEADERBOARD | RESULTADOS_FINALES | ERROR
// Cliente -> server:
//   /app/salas/{codigo}/unirse   {usuarioId, nombre}
//   /app/salas/{codigo}/iniciar  (sin body)
//   /app/salas/{codigo}/responder {indice, opcionElegida}
//
// El contrato no detalla el shape exacto de cada `ranking[i]` — se parsea de
// forma flexible (ver parseRankingItem en TriviaRoomPage) igual que el resto
// de clientes de este proyecto.

import { Client, type IMessage } from '@stomp/stompjs';

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
  | { type: 'LEADERBOARD'; codigo: string; ranking: unknown[] }
  | { type: 'RESULTADOS_FINALES'; codigo: string; ranking: unknown[]; ganadorUsuarioId: number }
  | { type: 'ERROR'; message: string };

export interface TriviaSocketHandlers {
  onMessage: (msg: SalaMensaje) => void;
  /** true justo cuando queda listo para publicar (ya se puede llamar a unirse). */
  onConnectionChange?: (connected: boolean) => void;
}

export class TriviaSocket {
  private client: Client;

  constructor(private codigo: string, handlers: TriviaSocketHandlers) {
    this.client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      onConnect: () => {
        this.client.subscribe(`/topic/salas/${this.codigo}`, (frame: IMessage) => {
          try {
            handlers.onMessage(JSON.parse(frame.body) as SalaMensaje);
          } catch {
            // frame que no es JSON válido: se ignora, no se cae la conexión
          }
        });
        handlers.onConnectionChange?.(true);
      },
      onDisconnect: () => handlers.onConnectionChange?.(false),
      onWebSocketClose: () => handlers.onConnectionChange?.(false),
      onStompError: () => handlers.onConnectionChange?.(false),
    });
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

  private publish(accion: string, body?: unknown): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: `/app/salas/${this.codigo}/${accion}`,
      body: body !== undefined ? JSON.stringify(body) : '',
    });
  }
}
