import { describe, expect, it } from 'vitest';

// Prueba rota A PROPOSITO para la demo del escenario M1: el CI debe quedar en rojo y el despliegue no debe correr.
describe('FAIL-GRWLNK', () => {
  it('una prueba rota detiene el pipeline', () => {
    expect(1 + 1, 'FAIL-GRWLNK: prueba rota a proposito, escenario M1').toBe(3);
  });
});
