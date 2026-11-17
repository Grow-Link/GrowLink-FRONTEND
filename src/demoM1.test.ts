import { describe, expect, it } from 'vitest';

// PRUEBA A PROPOSITO QUE FALLA, solo para la demostracion del escenario M1 (el pipeline se detiene).
// No se mezcla a main: se cierra el pull request y se borra la rama.
describe('demostracion M1', () => {
  it('esta prueba falla a proposito para que el CI quede en rojo', () => {
    expect(1 + 1).toBe(3);
  });
});
