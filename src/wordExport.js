import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak, ImageRun,
} from "docx";
import { saveAs } from "file-saver";

const loadImageBuffer = async (url) => {
  try { const res = await fetch(url); if (!res.ok) return null; return await res.arrayBuffer(); }
  catch { return null; }
};

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
// Split into blocks by blank line; within a block preserve line breaks.
const splitBlocks = (text) => (text || "").split(/\n\s*\n+/).map(b => b.replace(/\r/g, "").split("\n").map(l => l.trim()).filter(Boolean)).filter(b => b.length);

export async function generateMinutaWord({ entry, data, FRENTES, project }) {
  const projectTitle = project?.name ? `Proyecto ${project.name.replace(/^BODEGAS\s+/i, "Bodegas ")}` : "Proyecto Bodegas Coyol";
  const projectSubtitle = project?.subtitle || "Ganadera San Lorenzo, S.A.";
  const projectShort = project?.short || "Coyol";
  const fecha = fmtFecha(entry.fecha);
  const [coverImg, logoZen, logoDei] = await Promise.all([
    loadImageBuffer("/portada.jpg"),
    loadImageBuffer("/logos/grupo-zen.png"),
    loadImageBuffer("/logos/deindustrial.png"),
  ]);

  const logoChildren = [];
  if (logoZen) logoChildren.push(new ImageRun({ data: logoZen, transformation: { width: 58, height: 58 } }));
  if (logoZen && logoDei) logoChildren.push(txt("        ", { font: "Calibri" }));
  if (logoDei) logoChildren.push(new ImageRun({ data: logoDei, transformation: { width: 150, height: 57 } }));

  // ===== Cover header =====
  const cover = [
    ...(logoChildren.length ? [new Paragraph({ children: logoChildren, alignment: AlignmentType.CENTER, spacing: { after: 160 } })] : [
      p([
        txt("GRUPO ZEN", { bold: true, size: 16, color: C.gray, font: "Calibri" }),
        txt("    ·    ", { size: 16, color: C.border, font: "Calibri" }),
        txt("DEINDUSTRIAL", { bold: true, size: 16, color: C.gray, font: "Calibri" }),
      ], { alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
    ]),
    ...(coverImg ? [new Paragraph({
      children: [new ImageRun({ data: coverImg, transformation: { width: 624, height: 308 } })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })] : []),
    p(txt("ACTA DE REUNIÓN", { bold: true, size: 36, color: C.primary, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    p(txt(projectTitle, { size: 28, color: C.accent, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    p(txt(projectSubtitle, { italics: true, size: 20, color: C.gray, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    p(txt(fecha.toUpperCase(), { bold: true, size: 22, color: C.orange, font: "Calibri" }),
      { alignment: AlignmentType.CENTER, spacing: { after: 320 } }),
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

  // ===== Consolidado: Decisiones Tomadas y Pendientes por Resolver =====
  const decisionesBlocks = [];
  const pendientesBlocks = [];
  allFrentes.forEach(f => {
    const tasks = (data && data[f.id]) || [];
    const conDecision = tasks.filter(t => (t.decisiones || "").trim());
    const conPendiente = tasks.filter(t => (t.notas || "").trim() && t.estado !== "Completado");
    if (conDecision.length) {
      decisionesBlocks.push(p([txt(`${f.icon}  `, { size: 18, font: "Calibri" }), txt(f.name, { bold: true, size: 20, color: C.primary, font: "Calibri" })], { spacing: { before: 160, after: 60 } }));
      conDecision.forEach(t => {
        decisionesBlocks.push(p([txt("✓ ", { size: 18, color: C.green, bold: true, font: "Calibri" }), txt(t.tarea, { bold: true, size: 18, color: C.text, font: "Calibri" })], { spacing: { after: 20 }, indent: { left: 200 } }));
        splitBlocks(t.decisiones).forEach(block => {
          block.forEach((line, i) => decisionesBlocks.push(p(txt((i === 0 ? "• " : "   ") + line, { size: 18, color: C.text, font: "Calibri" }), { spacing: { after: i === block.length - 1 ? 60 : 10 }, indent: { left: 460 } })));
        });
      });
    }
    if (conPendiente.length) {
      pendientesBlocks.push(p([txt(`${f.icon}  `, { size: 18, font: "Calibri" }), txt(f.name, { bold: true, size: 20, color: C.primary, font: "Calibri" })], { spacing: { before: 160, after: 60 } }));
      conPendiente.forEach(t => {
        pendientesBlocks.push(p([
          txt("○ ", { size: 18, color: C.orange, bold: true, font: "Calibri" }),
          txt(t.tarea, { bold: true, size: 18, color: C.text, font: "Calibri" }),
          txt(`  —  ${t.estado}`, { size: 16, color: estadoColor(t.estado), bold: true, font: "Calibri" }),
          ...(t.responsable ? [txt(`  ·  ${t.responsable}`, { size: 15, color: C.gray, italics: true, font: "Calibri" })] : []),
        ], { spacing: { after: 20 }, indent: { left: 200 } }));
        splitBlocks(t.notas).forEach(block => {
          block.forEach((line, i) => pendientesBlocks.push(p(txt((i === 0 ? "• " : "   ") + line, { size: 18, color: C.text, font: "Calibri" }), { spacing: { after: i === block.length - 1 ? 60 : 10 }, indent: { left: 460 } })));
        });
      });
    }
  });
  if (decisionesBlocks.length === 0) decisionesBlocks.push(para("No hay decisiones registradas en las tareas.", { italics: true, color: C.gray }));
  if (pendientesBlocks.length === 0) pendientesBlocks.push(para("No hay pendientes abiertos registrados en las tareas.", { italics: true, color: C.gray }));

  // ===== Detalle por frente (informe ejecutivo completo) =====
  const prioColor = (p2) => p2 === "Alta" ? C.red : p2 === "Media" ? C.orange : C.gray;
  const sortTasks = (tasks) => [...tasks].sort((a, b) => {
    const ord = { "Bloqueado": 0, "En Proceso": 1, "Pendiente": 2, "Completado": 3, "N/A": 4 };
    return (ord[a.estado] ?? 9) - (ord[b.estado] ?? 9);
  });

  const headCell = (label, w, align = AlignmentType.LEFT) => cell(
    [p(txt(label, { bold: true, size: 14, color: C.white, font: "Calibri" }), { alignment: align })],
    { width: { size: w, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: C.primary, fill: C.primary }, margins: { top: 90, bottom: 90, left: 110, right: 110 } }
  );

  const detailBlocks = [];
  allFrentes.forEach((f, fi) => {
    const tasks = sortTasks((data && data[f.id]) || []);
    if (fi > 0) detailBlocks.push(p(txt("", {}), { spacing: { before: 200 } }));
    // Frente heading
    detailBlocks.push(p([
      txt(`${f.icon}  `, { size: 24, font: "Calibri" }),
      txt(f.name, { bold: true, size: 24, color: C.primary, font: "Calibri" }),
    ], { spacing: { before: 240, after: 40 }, border: { bottom: { color: C.accent, space: 2, style: BorderStyle.SINGLE, size: 8 } } }));
    detailBlocks.push(p([
      txt(`Avance ${Math.round(f.stats.avance)}%`, { bold: true, size: 18, color: C.accent, font: "Calibri" }),
      txt(`   ·   ${f.stats.total} tareas   ·   ${f.stats.completados} listas   ·   ${f.stats.enProceso} en proceso   ·   ${f.stats.pendientes} pendientes   ·   ${f.stats.bloqueados} bloqueadas`, { size: 16, color: C.gray, font: "Calibri" }),
    ], { spacing: { before: 80, after: 120 } }));

    if (tasks.length === 0) {
      detailBlocks.push(para("Sin tareas registradas en este frente.", { italics: true, color: C.gray }));
      return;
    }

    // Full task table
    const headerRow = new TableRow({ tableHeader: true, children: [
      headCell("#", 5, AlignmentType.CENTER),
      headCell("TAREA", 40),
      headCell("RESPONSABLE", 20),
      headCell("PRIOR.", 9, AlignmentType.CENTER),
      headCell("ESTADO", 13, AlignmentType.CENTER),
      headCell("AVANCE", 7, AlignmentType.CENTER),
      headCell("F. LÍMITE", 6, AlignmentType.CENTER),
    ] });
    const rows = tasks.map((t, idx) => {
      const bg = idx % 2 ? C.white : C.lightGray;
      const sh = { type: ShadingType.SOLID, color: bg, fill: bg };
      const m = { top: 80, bottom: 80, left: 110, right: 110 };
      const av = computeAvance(t.estado, t.avance);
      return new TableRow({ children: [
        cell([p(txt(String(idx + 1), { size: 15, color: C.gray, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
        cell([p(txt(t.tarea || "—", { size: 16, color: C.text, font: "Calibri" }))], { shading: sh, margins: m }),
        cell([p(txt(t.responsable || "—", { size: 15, color: C.text, font: "Calibri" }))], { shading: sh, margins: m }),
        cell([p(txt(t.prioridad || "—", { size: 14, color: prioColor(t.prioridad), bold: true, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
        cell([p(txt(t.estado || "—", { size: 14, color: estadoColor(t.estado), bold: true, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
        cell([p(txt(av !== null ? `${av}%` : "N/A", { size: 15, color: C.accent, bold: true, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
        cell([p(txt(t.fechaLimite ? fmtFecha(t.fechaLimite) : "—", { size: 13, color: C.gray, font: "Calibri" }), { alignment: AlignmentType.CENTER })], { shading: sh, margins: m }),
      ] });
    });
    detailBlocks.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: borderAll(C.border, 4), rows: [headerRow, ...rows] }));

    // Pendientes y decisiones del frente
    const conContenido = tasks.filter(t => (t.notas || "").trim() || (t.decisiones || "").trim());
    if (conContenido.length) {
      detailBlocks.push(p(txt("Pendientes y decisiones", { bold: true, size: 17, color: C.primary, font: "Calibri" }), { spacing: { before: 160, after: 60 } }));
      conContenido.forEach(t => {
        detailBlocks.push(p(txt(t.tarea, { bold: true, size: 16, color: C.text, font: "Calibri" }), { spacing: { before: 80, after: 20 }, indent: { left: 160 } }));
        if ((t.notas || "").trim()) splitBlocks(t.notas).forEach(block => {
          block.forEach((line, i) => {
            const children = i === 0
              ? [txt("○ Pendiente: ", { size: 15, color: C.orange, bold: true, font: "Calibri" }), txt(line, { size: 15, color: C.text, font: "Calibri" })]
              : [txt(line, { size: 15, color: C.text, font: "Calibri" })];
            detailBlocks.push(p(children, { spacing: { after: i === block.length - 1 ? 40 : 10 }, indent: { left: i === 0 ? 360 : 640 } }));
          });
        });
        if ((t.decisiones || "").trim()) splitBlocks(t.decisiones).forEach(block => {
          block.forEach((line, i) => {
            const children = i === 0
              ? [txt("✓ Decisión: ", { size: 15, color: C.green, bold: true, font: "Calibri" }), txt(line, { size: 15, color: C.text, font: "Calibri" })]
              : [txt(line, { size: 15, color: C.text, font: "Calibri" })];
            detailBlocks.push(p(children, { spacing: { after: i === block.length - 1 ? 40 : 10 }, indent: { left: i === 0 ? 360 : 640 } }));
          });
        });
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
    creator: `${projectTitle} Tracker`,
    title: `Acta de Reunión — ${fecha}`,
    description: `Acta ejecutiva del ${projectTitle.toLowerCase()}`,
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
        heading("Decisiones Tomadas", C.primary, 28),
        para("Decisiones registradas en las tareas de cada frente.", { italics: true, color: C.gray }),
        ...decisionesBlocks,
        heading("Pendientes por Resolver", C.primary, 28),
        para("Asuntos abiertos que requieren seguimiento, agrupados por frente.", { italics: true, color: C.gray }),
        ...pendientesBlocks,
        new Paragraph({ children: [new PageBreak()] }),
        heading("Detalle Operativo por Frente", C.primary, 28),
        para("Tareas relevantes activas, bloqueadas o pendientes en cada área de trabajo.", { italics: true, color: C.gray }),
        ...detailBlocks,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = `Acta-${projectShort}-${entry.fecha || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, safeName);
}
