import { describe, expect, it, vi } from 'vitest';
import { aparienciaDe, firmaDe, guardarFirma, guardarGenero, leerFirma, leerGenero, novedadesEntre } from './personaje';
import { construirRoadmap, type RoadmapView } from './roadmapModel';
import { cursoDto, roadmapDto } from '../pruebas/datos';

function vistaCon(cursos: { cursoId: number; categoria: string }[], aprobados: number[]): RoadmapView {
  const dto = roadmapDto(
    cursos.map((c, i) => cursoDto({ cursoId: c.cursoId, orden: i + 1, categoriaEtiqueta: c.categoria }))
  );
  return construirRoadmap(dto, new Set(aprobados));
}

describe('aparienciaDe', () => {
  it('empieza como semilla sin nada aprobado y sin accesorios', () => {
    const apariencia = aparienciaDe(vistaCon([{ cursoId: 1, categoria: 'Ingeniería de Sistemas' }], []));

    expect(apariencia).toEqual({ rango: 1, forma: 'Semilla', accesorios: [] });
  });

  it('crece de forma según el rango de la ruta', () => {
    const cursos = Array.from({ length: 4 }, (_, i) => ({ cursoId: i + 1, categoria: 'Derecho' }));

    expect(aparienciaDe(vistaCon(cursos, [1, 2, 3, 4])).forma).toBe('Florecido');
    expect(aparienciaDe(vistaCon(cursos, [1])).forma).toBe('Brote');
  });

  it('da el accesorio del área de cada curso aprobado, sin repetir', () => {
    const vista = vistaCon(
      [
        { cursoId: 1, categoria: 'Ingeniería de Sistemas' },
        { cursoId: 2, categoria: 'Matemáticas' },
        { cursoId: 3, categoria: 'Ingeniería de Sistemas' },
      ],
      [1, 2, 3]
    );

    expect(aparienciaDe(vista).accesorios.map((a) => a.id)).toEqual(['laptop', 'gafas']);
  });

  it('reúne en un solo casco las áreas que comparten accesorio', () => {
    const vista = vistaCon(
      [
        { cursoId: 1, categoria: 'Ingeniería Civil' },
        { cursoId: 2, categoria: 'Ingeniería Mecánica' },
      ],
      [1, 2]
    );
    const accesorios = aparienciaDe(vista).accesorios;

    expect(accesorios).toHaveLength(1);
    // el motivo es el primer curso que lo desbloqueó, en el orden de la ruta
    expect(accesorios[0]).toMatchObject({ id: 'casco', motivo: 'Ingeniería Civil' });
  });

  it('da la medalla de explorador a las áreas sin accesorio propio', () => {
    const vista = vistaCon([{ cursoId: 1, categoria: 'Ingeniería Ambiental' }], [1]);

    expect(aparienciaDe(vista).accesorios).toEqual([
      { id: 'medalla', nombre: 'una medalla de explorador', motivo: 'Ingeniería Ambiental' },
    ]);
  });

  it('solo cuenta los cursos aprobados, no los que faltan', () => {
    const vista = vistaCon(
      [
        { cursoId: 1, categoria: 'Ingeniería de Sistemas' },
        { cursoId: 2, categoria: 'Idiomas' },
      ],
      [1]
    );

    expect(aparienciaDe(vista).accesorios.map((a) => a.id)).toEqual(['laptop']);
  });
});

describe('firmaDe y novedadesEntre', () => {
  it('la firma cambia cuando cambia el rango o los accesorios', () => {
    const sinNada = aparienciaDe(vistaCon([{ cursoId: 1, categoria: 'Idiomas' }], []));
    const conUno = aparienciaDe(vistaCon([{ cursoId: 1, categoria: 'Idiomas' }], [1]));

    expect(firmaDe(sinNada)).toBe('1|');
    expect(firmaDe(conUno)).not.toBe(firmaDe(sinNada));
  });

  it('la primera vez no hay nada que celebrar (no se conoce el estado anterior)', () => {
    const ahora = aparienciaDe(vistaCon([{ cursoId: 1, categoria: 'Idiomas' }], [1]));

    expect(novedadesEntre(null, ahora)).toEqual([]);
  });

  it('no repite novedades si nada cambió desde la última vez', () => {
    const ahora = aparienciaDe(vistaCon([{ cursoId: 1, categoria: 'Idiomas' }], [1]));

    expect(novedadesEntre(firmaDe(ahora), ahora)).toEqual([]);
  });

  it('cuenta el cambio de forma y cada accesorio nuevo', () => {
    const cursos = [
      { cursoId: 1, categoria: 'Ingeniería de Sistemas' },
      { cursoId: 2, categoria: 'Matemáticas' },
    ];
    const antes = aparienciaDe(vistaCon(cursos, [1]));
    const ahora = aparienciaDe(vistaCon(cursos, [1, 2]));

    const novedades = novedadesEntre(firmaDe(antes), ahora);

    expect(novedades.map((n) => n.titulo)).toEqual([
      'Ahora es un florecido',
      'Consiguió unas gafas de analista',
    ]);
    expect(novedades[1].detalle).toBe('Por aprobar un curso de Matemáticas.');
  });

  it('no anuncia un cambio de forma si el rango bajó o se quedó igual', () => {
    const cursos = [{ cursoId: 1, categoria: 'Idiomas' }];
    const ahora = aparienciaDe(vistaCon(cursos, [1]));

    // una firma anterior con rango más alto: no se anuncia ningún crecimiento
    const novedades = novedadesEntre(`9|${ahora.accesorios.map((a) => a.id).join(',')}`, ahora);

    expect(novedades).toEqual([]);
  });
});

describe('lo que se recuerda en el navegador', () => {
  it('el género por defecto es «ella» y se puede guardar', () => {
    expect(leerGenero()).toBe('ella');

    guardarGenero('el');
    expect(leerGenero()).toBe('el');

    guardarGenero('ella');
    expect(leerGenero()).toBe('ella');
  });

  it('la firma se guarda por usuario, no se mezcla entre personas', () => {
    guardarFirma(1, '3|laptop');
    guardarFirma(2, '1|');

    expect(leerFirma(1)).toBe('3|laptop');
    expect(leerFirma(2)).toBe('1|');
    expect(leerFirma(99)).toBeNull();
  });

  it('sin almacenamiento disponible no se cae: sigue con los valores por defecto', () => {
    // navegación privada, o almacenamiento bloqueado: localStorage lanza al escribir y al leer
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(() => guardarGenero('el')).not.toThrow();
    expect(() => guardarFirma(1, '2|gafas')).not.toThrow();
    expect(leerGenero()).toBe('ella');
    expect(leerFirma(1)).toBeNull();
  });
});
