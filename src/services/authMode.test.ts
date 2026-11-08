import { describe, expect, it, vi } from 'vitest';
import { esOidc, modoAuth } from './authMode';

describe('modoAuth', () => {
  it('sin configurar nada queda en legacy, para que el login actual siga funcionando', () => {
    expect(modoAuth()).toBe('legacy');
    expect(esOidc()).toBe(false);
  });

  it('reconoce el modo oidc', () => {
    vi.stubEnv('VITE_AUTH_MODE', 'oidc');

    expect(modoAuth()).toBe('oidc');
    expect(esOidc()).toBe(true);
  });

  it('cualquier otro valor cae en legacy en vez de dejar la app sin forma de entrar', () => {
    for (const valor of ['', 'OIDC', 'microsoft', 'azure', 'true']) {
      vi.stubEnv('VITE_AUTH_MODE', valor);

      expect(modoAuth(), valor).toBe('legacy');
    }
  });
});
