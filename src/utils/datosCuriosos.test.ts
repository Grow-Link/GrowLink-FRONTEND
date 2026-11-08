import { describe, expect, it } from 'vitest';
import { FRASES_INGLES, datosDe, estudiaIngles } from './datosCuriosos';
import type { RoadmapNode } from './roadmapModel';

/** Lo poco que necesitan estas funciones de un nodo del roadmap. */
function nodo(titulo: string, categoria: string): RoadmapNode {
  return { titulo, categoria } as RoadmapNode;
}

describe('datosDe', () => {
  it('da los datos del curso cuando el curso está en la lista', () => {
    const datos = datosDe(nodo('Fundamentos de Programación', 'Ingeniería de Sistemas'));

    expect(datos.length).toBeGreaterThan(0);
    expect(datos.join(' ')).toContain('Ada Lovelace');
  });

  it('encuentra el curso aunque el título llegue con otras tildes o mayúsculas', () => {
    const conTildes = datosDe(nodo('Fundamentos de Programación', 'Ingeniería de Sistemas'));

    expect(datosDe(nodo('FUNDAMENTOS DE PROGRAMACION', 'Ingeniería de Sistemas'))).toEqual(conTildes);
    expect(datosDe(nodo('  fundamentos de programacion  ', 'Ingeniería de Sistemas'))).toEqual(conTildes);
  });

  it('cae en los datos del área cuando el curso no está en la lista', () => {
    // un curso que publicó otra persona: no tiene datos propios, pero su área sí
    const datos = datosDe(nodo('Curso nuevo de alguien más', 'Derecho'));

    expect(datos.length).toBeGreaterThan(0);
    expect(datos.join(' ')).toContain('Hammurabi');
  });

  it('devuelve una lista vacía si no hay nada para el curso ni para su área', () => {
    expect(datosDe(nodo('Curso raro', 'Gastronomía'))).toEqual([]);
  });
});

describe('estudiaIngles', () => {
  it('reconoce la ruta que tiene un curso del área de Idiomas', () => {
    expect(estudiaIngles([nodo('Inglés B1', 'Idiomas')])).toBe(true);
  });

  it('reconoce un curso de inglés aunque su área sea otra', () => {
    expect(estudiaIngles([nodo('Inglés técnico para ingeniería', 'Ingeniería de Sistemas')])).toBe(true);
    expect(estudiaIngles([nodo('Business English', 'Administración de Empresas')])).toBe(true);
  });

  it('no se activa en una ruta sin nada de inglés', () => {
    expect(estudiaIngles([nodo('Bases de Datos', 'Ingeniería de Sistemas'), nodo('Cálculo', 'Matemáticas')])).toBe(false);
    expect(estudiaIngles([])).toBe(false);
  });
});

describe('FRASES_INGLES', () => {
  it('toda frase tiene su traducción, para que nadie quede sin entender', () => {
    const todas = [...FRASES_INGLES.aprobo, ...FRASES_INGLES.saludo, ...FRASES_INGLES.bloqueado];

    expect(todas.length).toBeGreaterThan(0);
    for (const frase of todas) {
      expect(frase.en.trim()).not.toBe('');
      expect(frase.es.trim()).not.toBe('');
    }
  });
});
