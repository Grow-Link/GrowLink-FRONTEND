// Lo que corre antes de cada archivo de pruebas.
//
// Entre pruebas no debe quedar nada pegado: ni la sesión en sessionStorage, ni el modo de autenticación que
// una prueba haya fijado con vi.stubEnv, ni un fetch simulado de la prueba anterior.

import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
