// El PDF del roadmap: no es una foto de la pantalla, es un documento propio que agrega lo que la ventana no
// muestra de un vistazo. Trae la portada con la meta, el resumen y el avance, el mapa de la ruta por etapas
// (cada parada lleva a la ficha de su curso dentro del mismo PDF), y una ficha por curso con su descripción,
// horas, temario, habilidades, prerrequisitos, enlace y otras opciones. Los enlaces son clicables, así que
// también funciona desde un celular. Las librerías se cargan bajo demanda para no pesar el bundle inicial.

import type { jsPDF } from 'jspdf';
import type { NodeStatus, RoadmapNode, RoadmapView } from './roadmapModel';

type RGB = [number, number, number];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 56;

const INK: RGB = [31, 45, 42];
const MUTED: RGB = [107, 122, 116];
const TEAL: RGB = [14, 138, 125];
const MINT: RGB = [18, 194, 168];
const LINE: RGB = [225, 230, 223];
const PAPER: RGB = [246, 247, 242];
const SAND: RGB = [251, 243, 228];

const ESTADO_COLOR: Record<NodeStatus, { fondo: RGB; texto: RGB; etiqueta: string }> = {
  completed: { fondo: [76, 224, 126], texto: [255, 255, 255], etiqueta: 'Completado' },
  current: { fondo: [245, 165, 36], texto: [255, 255, 255], etiqueta: 'Siguiente paso' },
  available: { fondo: [255, 255, 255], texto: INK, etiqueta: 'Disponible' },
  locked: { fondo: [225, 230, 223], texto: MUTED, etiqueta: 'Bloqueado' },
  unavailable: { fondo: [254, 226, 226], texto: [185, 28, 28], etiqueta: 'No disponible' },
};

const NIVEL: Record<string, string> = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

/** El PDF usa fuentes estándar (Latin-1): se quitan emojis y símbolos que no se podrían dibujar. */
function limpio(texto: string): string {
  return texto
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E -ÿ\n]/g, '');
}

interface Chip {
  pagina: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cursoId: number;
}

export interface ResultadoPdf {
  blob: Blob;
  nombreArchivo: string;
}

export async function crearPdfRoadmap(vista: RoadmapView, nombre: string): Promise<ResultadoPdf> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 0;

  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const paginaActual = () => doc.getCurrentPageInfo().pageNumber;

  const nuevaPagina = () => {
    doc.addPage();
    y = MARGIN;
  };
  const asegurar = (alto: number) => {
    if (y + alto > BOTTOM) nuevaPagina();
  };

  // escribe un párrafo (con saltos de página línea por línea) y devuelve cuántas líneas usó
  const parrafo = (texto: string, opts: { x?: number; ancho?: number; tam?: number; estilo?: 'normal' | 'bold' | 'italic'; color?: RGB; interlineado?: number } = {}) => {
    const { x = MARGIN, ancho = CONTENT_W, tam = 10, estilo = 'normal', color = INK, interlineado = 1.35 } = opts;
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    const lineas: string[] = doc.splitTextToSize(limpio(texto), ancho);
    const alto = tam * interlineado;
    for (const linea of lineas) {
      asegurar(alto);
      doc.text(linea, x, y + tam);
      y += alto;
    }
    return lineas.length;
  };

  const enlace = (etiqueta: string, url: string, opts: { x?: number; ancho?: number; tam?: number } = {}) => {
    const { x = MARGIN, ancho = CONTENT_W, tam = 9.5 } = opts;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(tam);
    doc.setTextColor(...TEAL);
    const lineas: string[] = doc.splitTextToSize(limpio(etiqueta), ancho);
    for (const linea of lineas) {
      asegurar(tam * 1.4);
      doc.textWithLink(linea, x, y + tam, { url });
      y += tam * 1.4;
    }
  };

  // ------------------------------------------------------------------ portada
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 150, 'F');
  doc.setFillColor(...MINT);
  doc.rect(0, 150, PAGE_W, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GROWLINK', MARGIN, 44);
  doc.setFontSize(27);
  doc.text('Mi roadmap de aprendizaje', MARGIN, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(limpio(`${nombre}  |  ${fecha}`), MARGIN, 108);
  doc.setFontSize(9.5);
  doc.text(
    vista.generadoPor === 'IA' ? 'Ruta armada con inteligencia artificial' : vista.generadoPor === 'RESPALDO' ? 'Ruta armada en modo de respaldo (sin IA)' : 'Ruta personalizada',
    MARGIN,
    128
  );
  y = 176;

  // la meta
  doc.setFillColor(...SAND);
  const metaLineas: string[] = doc.splitTextToSize(limpio(vista.meta || 'Sin meta definida'), CONTENT_W - 28);
  const altoMeta = 34 + metaLineas.length * 16;
  doc.roundedRect(MARGIN, y, CONTENT_W, altoMeta, 8, 8, 'F');
  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('MI META', MARGIN + 14, y + 20);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(metaLineas, MARGIN + 14, y + 38);
  y += altoMeta + 14;

  if (vista.resumen) {
    parrafo(vista.resumen, { tam: 10.5, color: INK });
    y += 6;
  }

  // el avance en cuatro cifras
  const p = vista.progreso;
  const cifras: { valor: string; etiqueta: string }[] = [
    { valor: `${p.porcentaje}%`, etiqueta: 'de avance' },
    { valor: `${p.completados}/${p.total}`, etiqueta: 'cursos aprobados' },
    { valor: `${p.horasHechas}/${p.horasTotales} h`, etiqueta: 'de estudio' },
    { valor: `${p.habilidadesDesbloqueadas.length}/${p.habilidadesTotales.length}`, etiqueta: 'habilidades' },
  ];
  const anchoCifra = (CONTENT_W - 3 * 10) / 4;
  cifras.forEach((c, i) => {
    const x = MARGIN + i * (anchoCifra + 10);
    doc.setFillColor(...PAPER);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, y, anchoCifra, 56, 8, 8, 'FD');
    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(c.valor, x + anchoCifra / 2, y + 27, { align: 'center' });
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(c.etiqueta, x + anchoCifra / 2, y + 44, { align: 'center' });
  });
  y += 56 + 10;

  // barra de avance
  doc.setFillColor(...LINE);
  doc.roundedRect(MARGIN, y, CONTENT_W, 7, 3.5, 3.5, 'F');
  if (p.porcentaje > 0) {
    doc.setFillColor(...MINT);
    doc.roundedRect(MARGIN, y, Math.max(7, (CONTENT_W * p.porcentaje) / 100), 7, 3.5, 3.5, 'F');
  }
  y += 22;

  if (vista.siguiente) {
    parrafo(`Siguiente paso recomendado: ${vista.siguiente.titulo}`, { tam: 11, estilo: 'bold', color: [180, 83, 9] });
    y += 4;
  } else if (p.total > 0 && p.completados === p.total) {
    parrafo('Terminaste toda tu ruta. Felicitaciones!', { tam: 11, estilo: 'bold', color: [21, 128, 61] });
    y += 4;
  }

  // ------------------------------------------------------------------ mapa de la ruta
  y += 6;
  asegurar(60);
  parrafo('El mapa de tu ruta', { tam: 15, estilo: 'bold' });
  parrafo('Toca una parada para ir a la ficha de ese curso.', { tam: 9, color: MUTED });
  y += 6;

  const chips: Chip[] = [];
  let numero = 0;
  for (const etapa of vista.stages) {
    asegurar(70);
    doc.setFillColor(...TEAL);
    doc.circle(MARGIN + 10, y + 10, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(String(etapa.index + 1), MARGIN + 10, y + 13.5, { align: 'center' });
    doc.setTextColor(...INK);
    doc.setFontSize(11);
    doc.text(limpio(`${etapa.nombre}`), MARGIN + 28, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(limpio(`${etapa.descripcion}  (${etapa.completados}/${etapa.nodes.length})`), MARGIN + 28, y + 20);
    y += 30;

    const columnas = 3;
    const gap = 8;
    const anchoChip = (CONTENT_W - gap * (columnas - 1)) / columnas;
    const altoChip = 40;
    for (let i = 0; i < etapa.nodes.length; i += columnas) {
      asegurar(altoChip + gap);
      etapa.nodes.slice(i, i + columnas).forEach((nodo, k) => {
        numero += 1;
        const c = ESTADO_COLOR[nodo.status];
        const x = MARGIN + k * (anchoChip + gap);
        doc.setFillColor(...c.fondo);
        doc.setDrawColor(...(nodo.status === 'available' ? MINT : c.fondo));
        doc.setLineWidth(nodo.status === 'available' ? 1.2 : 0.5);
        doc.roundedRect(x, y, anchoChip, altoChip, 6, 6, 'FD');
        doc.setTextColor(...c.texto);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const titulo: string[] = doc.splitTextToSize(`${numero}. ${limpio(nodo.titulo)}`, anchoChip - 14).slice(0, 2);
        doc.text(titulo, x + 7, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`${c.etiqueta}${nodo.horas != null ? '  |  ' + nodo.horas + ' h' : ''}`, x + 7, y + altoChip - 7);
        chips.push({ pagina: paginaActual(), x, y, w: anchoChip, h: altoChip, cursoId: nodo.cursoId });
      });
      y += altoChip + gap;
    }
    y += 6;
  }

  // leyenda
  asegurar(24);
  doc.setFontSize(8);
  let lx = MARGIN;
  (['completed', 'current', 'available', 'locked'] as NodeStatus[]).forEach((s) => {
    const c = ESTADO_COLOR[s];
    doc.setFillColor(...c.fondo);
    doc.setDrawColor(...(s === 'available' ? MINT : c.fondo));
    doc.roundedRect(lx, y, 10, 10, 2, 2, 'FD');
    doc.setTextColor(...MUTED);
    doc.text(c.etiqueta, lx + 14, y + 8);
    lx += 14 + doc.getTextWidth(c.etiqueta) + 18;
  });
  y += 20;

  // ------------------------------------------------------------------ una ficha por curso
  // las fichas siguen justo después del mapa, sin dejar media página en blanco
  y += 18;
  asegurar(200);
  parrafo('Cada curso, en detalle', { tam: 17, estilo: 'bold' });
  parrafo('Lo que vas a ver, por que esta en tu ruta y donde estudiarlo.', { tam: 9.5, color: MUTED });
  y += 10;

  const paginaDeFicha = new Map<number, number>();
  vista.nodes.forEach((nodo, i) => {
    fichaDeCurso(nodo, i + 1);
  });

  function fichaDeCurso(nodo: RoadmapNode, n: number) {
    asegurar(120);
    paginaDeFicha.set(nodo.cursoId, paginaActual());
    const c = ESTADO_COLOR[nodo.status];

    // franja de título
    doc.setFillColor(...PAPER);
    doc.setDrawColor(...LINE);
    const titulo: string[] = doc.splitTextToSize(`${n}. ${limpio(nodo.titulo)}`, CONTENT_W - 130);
    const altoTitulo = 18 + titulo.length * 16;
    doc.roundedRect(MARGIN, y, CONTENT_W, altoTitulo, 8, 8, 'FD');
    doc.setFillColor(...(nodo.status === 'available' ? MINT : c.fondo));
    doc.roundedRect(MARGIN, y, 6, altoTitulo, 3, 3, 'F');
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(titulo, MARGIN + 16, y + 21);
    doc.setFontSize(8.5);
    doc.setTextColor(...(nodo.status === 'locked' ? MUTED : TEAL));
    doc.text(c.etiqueta.toUpperCase(), PAGE_W - MARGIN - 10, y + 21, { align: 'right' });
    y += altoTitulo + 8;

    const datos = [
      nodo.categoria,
      NIVEL[nodo.nivel],
      nodo.horas != null ? `${nodo.horas} horas` : null,
      nodo.tieneExamen ? 'Con examen para completarlo' : null,
    ].filter(Boolean);
    parrafo(datos.join('   |   '), { tam: 9.5, color: MUTED });
    y += 4;

    if (nodo.razon) {
      parrafo('Por que esta en tu ruta', { tam: 9, estilo: 'bold', color: [180, 83, 9] });
      parrafo(nodo.razon, { tam: 10, estilo: 'italic' });
      y += 4;
    }
    if (nodo.descripcion) {
      parrafo(nodo.descripcion, { tam: 10 });
      y += 4;
    }
    if (nodo.temario.length > 0) {
      parrafo('Temario', { tam: 9, estilo: 'bold', color: TEAL });
      nodo.temario.forEach((tema, i) => parrafo(`${i + 1}. ${tema}`, { x: MARGIN + 10, ancho: CONTENT_W - 10, tam: 9.5 }));
      y += 4;
    }
    if (nodo.habilidades.length > 0) {
      parrafo(`Habilidades que desbloqueas: ${nodo.habilidades.join(', ')}`, { tam: 9.5 });
    }
    if (nodo.prerequisitos.length > 0) {
      parrafo(`Viene despues de: ${nodo.prerequisitos.map((p) => `${p.titulo}${p.hecho ? ' (aprobado)' : ''}`).join(', ')}`, { tam: 9.5 });
    }
    if (nodo.link) {
      y += 2;
      enlace(`Ir al curso: ${nodo.link}`, nodo.link);
    }
    if (nodo.alternativas.length > 0) {
      y += 3;
      parrafo('Otras opciones para este paso', { tam: 9, estilo: 'bold', color: TEAL });
      nodo.alternativas.forEach((alt) => {
        const detalle = `${alt.titulo} (${NIVEL[alt.nivel]}${alt.horas != null ? ', ' + alt.horas + ' h' : ''})`;
        if (alt.link) enlace(`- ${detalle}: ${alt.link}`, alt.link, { x: MARGIN + 10, ancho: CONTENT_W - 10, tam: 9 });
        else parrafo(`- ${detalle}`, { x: MARGIN + 10, ancho: CONTENT_W - 10, tam: 9 });
      });
    }
    y += 16;
  }

  // ------------------------------------------------------------------ enlaces internos del mapa y pie de página
  const total = doc.getNumberOfPages();
  for (const chip of chips) {
    const destino = paginaDeFicha.get(chip.cursoId);
    if (!destino) continue;
    doc.setPage(chip.pagina);
    doc.link(chip.x, chip.y, chip.w, chip.h, { pageNumber: destino });
  }
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(MARGIN, PAGE_H - 40, PAGE_W - MARGIN, PAGE_H - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(limpio(`GrowLink  |  Roadmap de ${nombre}`), MARGIN, PAGE_H - 26);
    doc.text(`Pagina ${i} de ${total}`, PAGE_W - MARGIN, PAGE_H - 26, { align: 'right' });
  }

  const slug = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { blob: (doc as jsPDF).output('blob'), nombreArchivo: `roadmap-${slug || 'growlink'}.pdf` };
}

/** Descarga el PDF. En celulares que lo permiten, también se puede compartir directo (WhatsApp, correo...). */
export async function descargarPdfRoadmap(vista: RoadmapView, nombre: string): Promise<void> {
  const { blob, nombreArchivo } = await crearPdfRoadmap(vista, nombre);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** true si este navegador deja compartir un archivo PDF (casi siempre, un celular). */
export function puedeCompartirPdf(): boolean {
  try {
    const prueba = new File([new Blob(['x'], { type: 'application/pdf' })], 'roadmap.pdf', { type: 'application/pdf' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [prueba] });
  } catch {
    return false;
  }
}

export async function compartirPdfRoadmap(vista: RoadmapView, nombre: string): Promise<void> {
  const { blob, nombreArchivo } = await crearPdfRoadmap(vista, nombre);
  const archivo = new File([blob], nombreArchivo, { type: 'application/pdf' });
  await navigator.share({ files: [archivo], title: 'Mi roadmap de GrowLink' });
}
