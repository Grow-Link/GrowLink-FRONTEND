// Descarga el mapa ilustrado del roadmap como PDF: una captura del elemento
// (html2canvas-pro, soporta los colores modernos que usa Tailwind 4) pegada
// debajo de un encabezado con el progreso. Carga las librerías bajo demanda
// para no pesar el bundle inicial de una página que la mayoría ni visita.

export interface RoadmapPdfMeta {
  nombre: string;
  progresoPct: number;
  totalCursos: number;
  completados: number;
}

export async function downloadRoadmapPdf(element: HTMLElement, meta: RoadmapPdfMeta): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    backgroundColor: null,
  });

  const imgData = canvas.toDataURL('image/png');
  const pageWidth = 800;
  const margin = 32;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height / canvas.width) * contentWidth;
  const headerHeight = 130;
  const pageHeight = headerHeight + imgHeight + margin;

  const pdf = new jsPDF({ unit: 'pt', format: [pageWidth, pageHeight] });

  pdf.setFillColor(11, 31, 58); // #0B1F3A
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text('Tu camino de aprendizaje', margin, 46);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(139, 165, 194); // #8BA5C2
  pdf.text(`GrowLink · ${meta.nombre}`, margin, 70);
  pdf.text(`${meta.completados} de ${meta.totalCursos} cursos completados (${meta.progresoPct}%)`, margin, 88);
  pdf.text(
    `Generado el ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin,
    106
  );

  pdf.addImage(imgData, 'PNG', margin, headerHeight, contentWidth, imgHeight);

  const slug = meta.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  pdf.save(`roadmap-${slug || 'growlink'}.pdf`);
}
