import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { timeAgo } from './format';

const AHORA = new Date('2026-03-15T12:00:00Z');

/** Una fecha a X minutos de AHORA, en el formato en el que llegan las del backend. */
function haceMinutos(minutos: number): string {
  return new Date(AHORA.getTime() - minutos * 60_000).toISOString();
}

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dice «justo ahora» hasta que pasa el primer minuto', () => {
    expect(timeAgo(haceMinutos(0))).toBe('justo ahora');
    expect(timeAgo(haceMinutos(0.9))).toBe('justo ahora');
  });

  it('cuenta en minutos durante la primera hora', () => {
    expect(timeAgo(haceMinutos(1))).toBe('hace 1 min');
    expect(timeAgo(haceMinutos(59))).toBe('hace 59 min');
  });

  it('pasa a horas al llegar a los 60 minutos y a días al llegar a 24 horas', () => {
    expect(timeAgo(haceMinutos(60))).toBe('hace 1h');
    expect(timeAgo(haceMinutos(60 * 23))).toBe('hace 23h');
    expect(timeAgo(haceMinutos(60 * 24))).toBe('hace 1d');
    expect(timeAgo(haceMinutos(60 * 24 * 29))).toBe('hace 29d');
  });

  it('pasa a meses a los 30 días y concuerda el plural', () => {
    expect(timeAgo(haceMinutos(60 * 24 * 30))).toBe('hace 1 mes');
    expect(timeAgo(haceMinutos(60 * 24 * 60))).toBe('hace 2 meses');
  });

  it('pasa a años a los 12 meses y concuerda el plural', () => {
    expect(timeAgo(haceMinutos(60 * 24 * 30 * 12))).toBe('hace 1 año');
    expect(timeAgo(haceMinutos(60 * 24 * 30 * 24))).toBe('hace 2 años');
  });

  it('una fecha en el futuro no se muestra en negativo', () => {
    const futuro = new Date(AHORA.getTime() + 5 * 60_000).toISOString();

    expect(timeAgo(futuro)).toBe('justo ahora');
  });
});
