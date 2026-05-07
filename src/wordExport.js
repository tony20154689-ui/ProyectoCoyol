import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak,
} from "docx";
import { saveAs } from "file-saver";

const C = {
  primary: "0C4A6E",
  accent: "0369A1",
  light: "E0F2FE",
  orange: "F59E0B",
  green: "0D9488",
  red: "DC2626",
  gray: "64748B",
  lightGray: "F1F5F9",
  border: "E2E8F0",
  text: "0F172A",
  white: "FFFFFF",
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const borderAll = (color = C.border, size = 4) => ({
  top: { style: BorderStyle.SINGLE, size, color },
  bottom: { style: BorderStyle.SINGLE, size, color },
  left: { style: BorderStyle.SINGLE, size, color },
  right: { style: BorderStyle.SINGLE, size, color },
});

const txt = (text, opts = {}) => new TextRun({ text: text ?? "", ...opts });
const p = (children, opts = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], ...opts });
const heading = (text, color = C.primary, size = 28) =>
  p(txt(text, { bold: true, size, color, font: "Calibri" }), { spacing: { before: 240, after: 120 } });
const subheading = (text, color = C.accent) =>
  p(txt(text, { bold: true, size: 22, color, font: "Calibri" }), { spacing: { before: 200, after: 100 } });
const para = (text, opts = {}) =>
  p(txt(text || "—", { size: 20, color: C.text, font: "Calibri", ...opts }), { spacing: { after: 80 } });

const cell = (children, opts = {}) => new TableCell({
  children: Array.isArray(children) ? children : [children],
  ...opts,
});

const labelCell = (label) => cell(
  [p(txt(label, { bold: true, size: 18, color: C.gray, font: "Calibri" }))],
  { width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: C.lightGray, fill: C.lightGray }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }
);
const valueCell = (value) => cell(
  [p(txt(value || "—", { size: 20, color: C.text, font: "Calibri" }))],
  { width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }
);

const fmtFecha = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
};

const computeAvance = (estado, manual) => {
  if (estado === "Completado") return 100;
  if (estado === "Pendiente") return 0;
  if (estado === "N/A") return null;
  return manual ?? 0;
};

const getFrente = (id, data) => {
  const tasks = (data && data[id]) || [];
  const total = tasks.length;
  if (!total) return { total: 0, completados: 0, enProceso: 0, pendientes: 0, bloqueados: 0, avance: 0, estado: "Pendiente" };
  let completados = 0, enProceso = 0, pendientes = 0, bloqueados = 0, sum = 0, count = 0;
  tasks.forEach(t => {
    if (t.estado === "Completado") completados++;
    else if (t.estado === "En Proceso") enProceso++;
    else if (t.estado === "Pendiente") pendientes++;
    else if (t.estado === "Bloqueado") bloqueados++;
    const a = computeAvance(t.estado, t.avance);
    if (a !== null) { sum += a; count++; }
  });
  const avance = count ? sum / count : 0;
  let estado = "Pendiente";
  if (completados === total) estado = "Completado";
  else if (bloqueados > 0) estado = "Bloqueado";
  else if (enProceso > 0 || completados > 0) estado = "En Proceso";
  return { total, completados, enProceso, pendientes, bloqueados, avance, estado };
};

const splitParagraphs = (text) => (text || "—").split(/\n+/).map(line => line.trim()).filter(Boolean);

export async function generateMinutaWord({ entry, data, FRENTES }) {
  const fecha = fmtFecha(entry.fecha);

  // ===== Cover header =====
  const cover = [
    p([
      txt("GRUPO ZEN", { bold: true, size: 16, color: C.gray, font: "Calibri" }),
      txt("    ·    ", { size: 16, color: C.border, font: "Calibri" }),
      txt("DEINDUSTRIAL", { bold: true, size: 16, color: C.gray, font: "Calibri" }),
    ], { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    p(txt("ACTA DE REUNIÓN", { bold: true, size: 36, color: C.primary, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    p(txt("Proyecto Bodegas Coyol", { size: 28, color: C.accent, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    p(txt("Ganadera San Lorenzo, S.A.", { italics: true, size: 20, color: C.gray, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 320 } }),
    p(txt(fecha.toUpperCase(), { bold: true, size: 22, color: C.orange, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
  ];

  // ===== Información general (table) =====
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderAll(C.border, 4),
    rows: [
      new TableRow({ children: [labelCell("Fecha"), valueCell(fecha)] }),
      new TableRow({ children: [labelCell("Participantes"), valueCell(entry.participantes)] }),
      new TableRow({ children: [labelCell("Frente(s) tratado(s)"), valueCell(entry.frentes)] }),
      new TableRow({ children: [labelCell("Responsable"), valueCell(entry.responsable)] }),
      new TableRow({ children: [labelCell("Fecha límite de seguimiento"), valueCell(fmtFecha(entry.fechaLimite))] }),
      new TableRow({ children: [labelCell("Estado"), valueCell(entry.cumplido ? "✓ Cumplido" : "Pendiente de seguimiento")] }),
    ],
  });

  // ===== Acuerdos / Compromisos =====
  const acuerdosBlock = [
    subheading("Acuerdos"),
    ...splitParagraphs(entry.acuerdos).map(line => para(`• ${line}`)),
  ];
  const compromisosBlock = [
    subheading("Compromisos"),
    ...splitParagraphs(entry.compromisos).map(line => para(`• ${line}`)),
  ];

  // ===== Tablero ejecutivo =====
  const allFrentes = (FRENTES || []).map(f => ({ ...f, stats: getFrente(f.id, data) }));
  const totalTasks = allFrentes.reduce((a, f) => a + f.stats.total, 0);
  const totalCompletadas = allFrentes.reduce((a, f) => a + f.stats.completados, 0);
  const totalProceso = allFrentes.reduce((a, f) => a + f.stats.enProceso, 0);
  const totalPendientes = allFrentes.reduce((a, f) => a + f.stats.pendientes, 0);
  const totalBloqueadas = allFrentes.reduce((a, f) => a + f.stats.bloqueados, 0);
  const avgGlobal = allFrentes.length ? Math.round(allFrentes.reduce((a, f) => a + f.stats.avance, 0) / allFrentes.length) : 0;

  const kpiCell = (label, value, color) => cell([
    p(txt(label, { bold: true, size: 14, color: C.gray, font: "Calibri" }), { alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    p(txt(String(value), { bold: true, size: 36, color, font: "Calibri" }), { alignment: AlignmentType.CENTER }),
  ], { margins: { top: 200, bottom: 200, left: 100, right: 100 }, shading: { type: ShadingType.SOLID, color: C.lightGray, fill: C.lightGray } });

  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderAll(C.border, 4),
    rows: [
      new TableRow({ children: [
        kpiCell("AVANCE GLOBAL", `${avgGlobal}%`, C.accent),
        kpiCell("FRENTES", String(allFrentes.length), C.primary),
        kpiCell("TAREAS LISTAS", `${totalCompletadas}/${totalTasks}`, C.green),
        kpiCell("EN PROCESO", String(totalProceso), C.orange),
        kpiCell("BLOQUEADAS", String(totalBloqueadas), C.red),
      ] }),
    ],
  });

  // ===== Resumen por frente (table) =====
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      cell([p(txt("FRENTE", { bold: true, size: 16, color: C.white, font: "Calibri" }))], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 140, right: 140 } }),
      cell([p(txt("AVANCE", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
      cell([p(txt("LISTAS", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
      cell([p(txt("PROC.", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
      cell([p(txt("PEND.", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
      cell([p(txt("BLOQ.", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
      cell([p(txt("ESTADO", { bold: true, size: 16, color: C.white, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 120, bottom: 120, left: 80, right: 80 } }),
    ],
  });

  const estadoColor = (e) => e === "Completado" ? C.green : e === "Bloqueado" ? C.red : e === "En Proceso" ? C.orange : C.gray;

  const frenteRows = allFrentes.map((f, idx) => {
    const bg = idx % 2 ? C.white : C.lightGray;
    const sh = { type: ShadingType.SOLID, color: bg, fill: bg };
    const m = { top: 100, bottom: 100, left: 140, right: 140 };
    return new TableRow({ children: [
      cell([p([txt(`${f.icon}  `, { size: 18, font: "Calibri" }), txt(f.name, { bold: true, size: 18, color: C.text, font: "Calibri" })])], { shading: sh, margins: m }),
      cell([p(txt(`${Math.round(f.stats.avance)}%`, { bold: true, size: 20, color: C.accent, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      cell([p(txt(String(f.stats.completados), { size: 18, color: C.green, font: "Calibri", bold: true }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      cell([p(txt(String(f.stats.enProceso), { size: 18, color: C.orange, font: "Calibri", bold: true }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      cell([p(txt(String(f.stats.pendientes), { size: 18, color: C.gray, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      cell([p(txt(String(f.stats.bloqueados), { size: 18, color: C.red, font: "Calibri", bold: f.stats.bloqueados > 0 }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      cell([p(txt(f.stats.estado, { size: 16, color: estadoColor(f.stats.estado), font: "Calibri", bold: true }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
    ] });
  });

  const frentesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderAll(C.border, 4),
    rows: [tableHeaderRow, ...frenteRows],
  });

  // ===== Detalle por frente (top tasks) =====
  const detailBlocks = [];
  allFrentes.forEach(f => {
    const tasks = (data && data[f.id]) || [];
    const top = tasks.filter(t => t.estado !== "N/A").sort((a, b) => {
      const ord = { "Bloqueado": 0, "En Proceso": 1, "Pendiente": 2, "Completado": 3 };
      return (ord[a.estado] ?? 9) - (ord[b.estado] ?? 9);
    }).slice(0, 6);
    detailBlocks.push(
      p([
        txt(`${f.icon}  `, { size: 22, font: "Calibri" }),
        txt(f.name, { bold: true, size: 22, color: C.primary, font: "Calibri" }),
        txt(`    ${Math.round(f.stats.avance)}% · ${f.stats.completados}/${f.stats.total} listas`, { size: 16, color: C.gray, font: "Calibri" }),
      ], { spacing: { before: 200, after: 100 } })
    );
    if (top.length === 0) {
      detailBlocks.push(para("Sin tareas registradas.", { italics: true, color: C.gray }));
    } else {
      top.forEach(t => {
        detailBlocks.push(p([
          txt("• ", { size: 20, color: C.gray, font: "Calibri" }),
          txt(t.tarea, { size: 20, color: C.text, font: "Calibri" }),
          txt(`  —  ${t.estado}`, { size: 18, color: estadoColor(t.estado), bold: true, font: "Calibri" }),
          ...(t.responsable ? [txt(`  ·  ${t.responsable}`, { size: 16, color: C.gray, italics: true, font: "Calibri" })] : []),
        ], { spacing: { after: 60 }, indent: { left: 200 } }));
      });
    }
  });

  // ===== Footer =====
  const footer = new Footer({
    children: [
      p([
        txt("Acta generada automáticamente · ", { size: 14, color: C.gray, font: "Calibri" }),
        txt(new Date().toLocaleString("es-CR"), { size: 14, color: C.gray, font: "Calibri", italics: true }),
        txt("    ·    Página ", { size: 14, color: C.gray, font: "Calibri" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 14, color: C.gray, font: "Calibri" }),
        txt(" de ", { size: 14, color: C.gray, font: "Calibri" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: C.gray, font: "Calibri" }),
      ], { alignment: AlignmentType.CENTER }),
    ],
  });

  // ===== Document =====
  const doc = new Document({
    creator: "Bodegas Coyol Tracker",
    title: `Acta de Reunión — ${fecha}`,
    description: "Acta ejecutiva del proyecto Bodegas Coyol",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
      footers: { default: footer },
      children: [
        ...cover,
        // Separator line
        p(txt("", {}), { border: { bottom: { color: C.border, space: 1, style: BorderStyle.SINGLE, size: 6 } }, spacing: { after: 240 } }),
        heading("Información General", C.primary, 28),
        infoTable,
        heading("Acuerdos y Compromisos", C.primary, 28),
        ...acuerdosBlock,
        ...compromisosBlock,
        new Paragraph({ children: [new PageBreak()] }),
        heading("Tablero Ejecutivo · Estado General del Proyecto", C.primary, 28),
        para("Resumen consolidado al momento de generar esta acta.", { italics: true, color: C.gray }),
        kpiTable,
        heading("Resumen por Frente", C.primary, 28),
        frentesTable,
        new Paragraph({ children: [new PageBreak()] }),
        heading("Detalle Operativo por Frente", C.primary, 28),
        para("Tareas relevantes activas, bloqueadas o pendientes en cada área de trabajo.", { italics: true, color: C.gray }),
        ...detailBlocks,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = `Acta-Coyol-${entry.fecha || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, safeName);
}
