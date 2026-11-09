import { describe, expect, it, vi } from 'vitest';
import { obtenerDashboardConcurrencia } from './metricasApi';
import { SessionExpiredError, setSession, type BackendSession } from './backendSession';
import { jsonResponse, textoResponse } from '../pruebas/datos';
import { simularFetch } from '../pruebas/fetchFalso';

vi.mock('./msalAuth', () => ({
  MicrosoftAuthError: class extends Error {
    readonly requiereLogin = true;
  },
  obtenerAccessToken: vi.fn().mockResolvedValue('token-de-microsoft'),
  cerrarSesionMicrosoft: vi.fn(),
}));

const SESION_ADMIN: BackendSession = { token: 'jwt-admin', usuarioId: 1, nombre: 'Admin', rol: 'ADMIN' };

describe('obtenerDashboardConcurrencia', () => {
  it('pide todo lo registrado si no se limita la ventana', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ salasActivas: 2 }));
    setSession(SESION_ADMIN);

    await obtenerDashboardConcurrencia();

    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/metricas/dashboard');
  });

  it('pasa la ventana de minutos cuando se pide', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({ salasActivas: 2 }));
    setSession(SESION_ADMIN);

    await obtenerDashboardConcurrencia(15);

    expect(fetchFalso.ultima().url).toBe('/api-trivia/api/metricas/dashboard?ultimosMinutos=15');
  });

  it('va con el token: el backend valida el rol ADMIN con lo que va firmado dentro', async () => {
    const fetchFalso = simularFetch(() => jsonResponse({}));
    setSession(SESION_ADMIN);

    await obtenerDashboardConcurrencia();

    expect(fetchFalso.ultima().authorization).toBe('Bearer jwt-admin');
  });

  it('devuelve las métricas tal como las manda trivia-service, con sus nulos', async () => {
    simularFetch(() =>
      jsonResponse({
        salasActivas: 3,
        salasEnEspera: 1,
        salasEnCurso: 2,
        participantesConectados: 9,
        latenciaPromedioMs: null,
        empatesResueltos: 0,
        partidasFinalizadas: 4,
        duracionPromedioPartidaMs: null,
        ventanaMinutos: null,
        generadoEn: '2026-03-01T10:00:00Z',
      })
    );
    setSession(SESION_ADMIN);

    const dashboard = await obtenerDashboardConcurrencia();

    // los nulos son parte del contrato (todavía no hay datos), no se convierten a 0
    expect(dashboard.latenciaPromedioMs).toBeNull();
    expect(dashboard.duracionPromedioPartidaMs).toBeNull();
    expect(dashboard.participantesConectados).toBe(9);
  });

  it('si alguien sin rol ADMIN las pide, el 403 cierra la sesión', async () => {
    simularFetch(() => textoResponse('', 403));
    setSession({ ...SESION_ADMIN, rol: 'USUARIO' });

    await expect(obtenerDashboardConcurrencia()).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
