import { describe, expect, it } from 'vitest';
import { ETAPA_LABEL, ETAPA_ORDEN, especieDeCategoria } from './jardin';
import { CATEGORIAS_CURSOS, CATEGORIA_ENUM } from '../services/cursosServiceApi';

describe('especieDeCategoria', () => {
  it('reconoce el enum completo del backend', () => {
    expect(especieDeCategoria('INGENIERIA_CIVIL')).toEqual({ forma: 2, paleta: 'A' });
  });

  it('reconoce también la forma corta del enum', () => {
    // el endpoint de jardín todavía se está construyendo y puede mandar CIVIL en vez de INGENIERIA_CIVIL
    expect(especieDeCategoria('CIVIL')).toEqual(especieDeCategoria('INGENIERIA_CIVIL'));
  });

  it('reconoce el nombre que muestra el frontend, con tildes y espacios', () => {
    expect(especieDeCategoria('Ingeniería Civil')).toEqual({ forma: 2, paleta: 'A' });
    expect(especieDeCategoria('Administración de Empresas')).toEqual({ forma: 3, paleta: 'B' });
    expect(especieDeCategoria('Matemáticas')).toEqual({ forma: 2, paleta: 'B' });
  });

  it('cae en la especie por defecto si la categoría no se conoce', () => {
    expect(especieDeCategoria('GASTRONOMIA')).toEqual({ forma: 1, paleta: 'A' });
    expect(especieDeCategoria('')).toEqual({ forma: 1, paleta: 'A' });
  });

  it('le da una especie distinta a cada una de las 10 categorías del catálogo', () => {
    // la idea del jardín es que se note de qué área es cada planta: 5 formas × 2 paletas, sin repetir
    const especies = CATEGORIAS_CURSOS.map((c) => especieDeCategoria(c)).map((e) => `${e.forma}${e.paleta}`);

    expect(new Set(especies).size).toBe(CATEGORIAS_CURSOS.length);
  });

  it('da la misma especie para el nombre que se muestra y para su enum', () => {
    for (const categoria of CATEGORIAS_CURSOS) {
      expect(especieDeCategoria(categoria)).toEqual(especieDeCategoria(CATEGORIA_ENUM[categoria]));
    }
  });
});

describe('etapas de una planta', () => {
  it('van de semilla a florecida y todas tienen nombre para mostrar', () => {
    expect(ETAPA_ORDEN).toEqual(['SEMILLA', 'BROTE', 'PLANTA', 'FLORECIDA']);
    expect(ETAPA_ORDEN.map((e) => ETAPA_LABEL[e])).toEqual(['Semilla', 'Brote', 'Planta', 'Florecida']);
  });
});
