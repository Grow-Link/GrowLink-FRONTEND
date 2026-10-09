// Descarga el roadmap como PDF multipágina (A4): portada con metas/nivel/
// progreso/horas, el mapa ilustrado (captura con html2canvas-pro, escalado
// para cabe sin deformarse) y una sección de "Detalle de cursos" en texto
// real de jsPDF (splitTextToSize) — así se puede seleccionar y buscar, y no
// es solo una foto del grafo. Ninguna ficha se corta entre páginas. Carga
// las librerías bajo demanda para no pesar el bundle de quien no la usa.
//
// jsPDF con la fuente helvetica solo dibuja WinAnsi/Latin-1 — tildes y ñ
// funcionan, pero nada de emojis ni símbolos raros en los textos de acá.

export interface RoadmapPdfCurso {
  orden: number;
  titulo: string;
  categoria: string;
  nivel: string;
  duracionHoras: number | null;
  descripcion: string;
  habilidades: string[];
  prerequisiteTitles: string[];
  completado: boolean;
  linkContenido: string;
}

export interface RoadmapPdfMeta {
  nombre: string;
  metas: string | null;
  nivel: string | null;
  progresoPct: number;
  totalCursos: number;
  completados: number;
  /** null si ningún curso del roadmap tiene duración cargada. */
  totalHoras: number | null;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const NAVY: [number, number, number] = [11, 31, 58];
const MUTED: [number, number, number] = [107, 122, 153];
const TEXT: [number, number, number] = [40, 48, 61];
const LINK: [number, number, number] = [30, 115, 232];
const BORDER: [number, number, number] = [221, 228, 237];

export async function downloadRoadmapPdf(
  graphElement: HTMLElement,
  meta: RoadmapPdfMeta,
  cursos: RoadmapPdfCurso[]
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(graphElement, {
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    backgroundColor: null,
  });

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  drawCoverPage(doc, meta);
  drawGraphPage(doc, canvas);
  drawCourseDetailPages(doc, cursos);
  paginate(doc);

  const slug = meta.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  doc.save(`roadmap-${slug || 'growlink'}.pdf`);
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function drawCoverPage(doc: any, meta: RoadmapPdfMeta): void {
  const bandH = 150;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, bandH, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Tu camino de aprendizaje', MARGIN, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(139, 165, 194);
  doc.text(`GrowLink . ${meta.nombre}`, MARGIN, 80);
  doc.text(`Generado el ${fechaHoy()}`, MARGIN, 98);
  doc.text(`${meta.completados} de ${meta.totalCursos} cursos completados (${meta.progresoPct}%)`, MARGIN, 116);
  if (meta.totalHoras != null) {
    doc.text(`${meta.totalHoras} horas estimadas en total`, MARGIN, 134);
  }

  let y = bandH + 44;
  const heading = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(text, MARGIN, y);
    y += 20;
  };
  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 15 + 26;
  };

  heading('Tus metas');
  paragraph(meta.metas && meta.metas.trim() ? meta.metas : 'Sin metas registradas.');

  heading('Tu nivel');
  paragraph(meta.nivel ? capitalize(meta.nivel) : 'No especificado.');

  heading('Progreso');
  const barW = CONTENT_W;
  const barH = 10;
  doc.setFillColor(238, 242, 246);
  doc.roundedRect(MARGIN, y, barW, barH, 4, 4, 'F');
  doc.setFillColor(76, 224, 126);
  doc.roundedRect(MARGIN, y, Math.max(barH, (barW * meta.progresoPct) / 100), barH, 4, 4, 'F');
}

function drawGraphPage(doc: any, canvas: HTMLCanvasElement): void {
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('Tu mapa de aprendizaje', MARGIN, MARGIN + 10);

  const availW = CONTENT_W;
  const availH = PAGE_H - MARGIN * 2 - 40;
  const scale = Math.min(availW / canvas.width, availH / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  const x = MARGIN + (availW - w) / 2;
  const y = MARGIN + 40;
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
}

const LINE_H = 13;
const GAP_AFTER_SECTION = 6;
const GAP_BETWEEN_FICHAS = 16;
const FICHA_PAD = 14;

function medirFicha(doc: any, curso: RoadmapPdfCurso): { descLines: string[]; skillsLines: string[]; prereqLines: string[]; linkLines: string[]; height: number } {
  const textW = CONTENT_W - FICHA_PAD * 2;
  doc.setFontSize(10);
  const descLines: string[] = doc.splitTextToSize(curso.descripcion.trim() || 'Sin descripción.', textW);
  const skillsLines: string[] = doc.splitTextToSize(
    `Habilidades: ${curso.habilidades.length ? curso.habilidades.join(', ') : 'Ninguna registrada'}`,
    textW
  );
  const prereqLines: string[] = doc.splitTextToSize(
    `Prerrequisitos: ${curso.prerequisiteTitles.length ? curso.prerequisiteTitles.join(', ') : 'Ninguno'}`,
    textW
  );
  const linkLines: string[] = curso.linkContenido ? doc.splitTextToSize(`Contenido: ${curso.linkContenido}`, textW) : [];

  let height = FICHA_PAD; // top padding
  height += LINE_H + 4; // titulo
  height += LINE_H + GAP_AFTER_SECTION; // meta (categoria/nivel/horas/estado)
  height += descLines.length * LINE_H + GAP_AFTER_SECTION;
  height += skillsLines.length * LINE_H + GAP_AFTER_SECTION;
  height += prereqLines.length * LINE_H + (linkLines.length ? GAP_AFTER_SECTION : 0);
  height += linkLines.length * LINE_H;
  height += FICHA_PAD; // bottom padding

  return { descLines, skillsLines, prereqLines, linkLines, height };
}

function drawCourseDetailPages(doc: any, cursos: RoadmapPdfCurso[]): void {
  doc.addPage();
  let y = MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Detalle de cursos', MARGIN, y + 10);
  y += 40;

  const bottomLimit = PAGE_H - MARGIN;

  for (const curso of cursos) {
    const medida = medirFicha(doc, curso);

    if (y + medida.height > bottomLimit) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setDrawColor(...BORDER);
    doc.roundedRect(MARGIN, y, CONTENT_W, medida.height, 6, 6);

    let cy = y + FICHA_PAD + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(`${curso.orden}. ${curso.titulo}`, MARGIN + FICHA_PAD, cy);
    cy += LINE_H + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const duracionTxt = curso.duracionHoras != null ? `${curso.duracionHoras} horas` : 'Duración no especificada';
    doc.text(`${curso.categoria} . ${curso.nivel} . ${duracionTxt} . ${curso.completado ? 'Completado' : 'Pendiente'}`, MARGIN + FICHA_PAD, cy);
    cy += LINE_H + GAP_AFTER_SECTION;

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(medida.descLines, MARGIN + FICHA_PAD, cy);
    cy += medida.descLines.length * LINE_H + GAP_AFTER_SECTION;

    doc.text(medida.skillsLines, MARGIN + FICHA_PAD, cy);
    cy += medida.skillsLines.length * LINE_H + GAP_AFTER_SECTION;

    doc.text(medida.prereqLines, MARGIN + FICHA_PAD, cy);
    cy += medida.prereqLines.length * LINE_H;

    if (medida.linkLines.length) {
      cy += GAP_AFTER_SECTION;
      doc.setTextColor(...LINK);
      doc.text(medida.linkLines, MARGIN + FICHA_PAD, cy);
    }

    y += medida.height + GAP_BETWEEN_FICHAS;
  }
}

function paginate(doc: any): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Página ${i} de ${total}`, PAGE_W - MARGIN, PAGE_H - 20, { align: 'right' });
  }
}
