// A qué especie del jardín corresponde cada categoría: 5 formas de planta × 2 paletas de color, una
// combinación propia por categoría (10 categorías, igual que las de cursos-service). Las claves cubren tanto
// el enum completo del backend (INGENIERIA_CIVIL) como la forma corta que a veces se usa (CIVIL), porque el
// endpoint de jardín todavía se está construyendo en usuarios-service y no hay forma de confirmar cuál manda.

export type FormaPlanta = 1 | 2 | 3 | 4 | 5;
export type PaletaPlanta = 'A' | 'B';

export interface Especie {
  forma: FormaPlanta;
  paleta: PaletaPlanta;
}

const ESPECIE_POR_CATEGORIA: Record<string, Especie> = {
  INGENIERIA_SISTEMAS: { forma: 1, paleta: 'A' },
  SISTEMAS: { forma: 1, paleta: 'A' },

  INGENIERIA_CIVIL: { forma: 2, paleta: 'A' },
  CIVIL: { forma: 2, paleta: 'A' },

  INGENIERIA_INDUSTRIAL: { forma: 3, paleta: 'A' },
  INDUSTRIAL: { forma: 3, paleta: 'A' },

  INGENIERIA_ELECTRONICA: { forma: 4, paleta: 'A' },
  ELECTRONICA: { forma: 4, paleta: 'A' },

  INGENIERIA_MECANICA: { forma: 5, paleta: 'A' },
  MECANICA: { forma: 5, paleta: 'A' },

  INGENIERIA_AMBIENTAL: { forma: 1, paleta: 'B' },
  AMBIENTAL: { forma: 1, paleta: 'B' },

  MATEMATICAS: { forma: 2, paleta: 'B' },
  ADMINISTRACION_EMPRESAS: { forma: 3, paleta: 'B' },
  IDIOMAS: { forma: 4, paleta: 'B' },
  DERECHO: { forma: 5, paleta: 'B' },
};

const DEFAULT_ESPECIE: Especie = { forma: 1, paleta: 'A' };

/** `categoria` puede venir ya convertida a texto para mostrar (ver categoriaDesdeEnum) o como enum crudo. */
function normalizar(categoria: string): string {
  return categoria
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function especieDeCategoria(categoria: string): Especie {
  return ESPECIE_POR_CATEGORIA[normalizar(categoria)] ?? DEFAULT_ESPECIE;
}

export const ETAPA_LABEL: Record<string, string> = {
  SEMILLA: 'Semilla',
  BROTE: 'Brote',
  PLANTA: 'Planta',
  FLORECIDA: 'Florecida',
};

export const ETAPA_ORDEN = ['SEMILLA', 'BROTE', 'PLANTA', 'FLORECIDA'] as const;
