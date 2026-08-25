import PptxGenJS from "pptxgenjs";

const C = {
  primary: "0C4A6E",
  accent: "0369A1",
  light: "E0F2FE",
  orange: "F59E0B",
  green: "0D9488",
  red: "DC2626",
  gray: "64748B",
  lightGray: "F1F5F9",
  white: "FFFFFF",
  dark: "0F172A",
};

const computeAvance = (estado, manual) => {
  if (estado === "Completado") return 100;
  if (estado === "Pendiente") return 0;
  if (estado === "N/A") return null;
  return manual ?? 0;
};

const getFrente = (id, data) => {
  const tasks = (data && data[id]) || [];
  const valid = tasks.filter(t => t.estado !== "N/A");
  const total = valid.length;
  let completados = 0, enProceso = 0, pendientes = 0, bloqueados = 0, sum = 0, count = 0;
  valid.forEach(t => {
    if (t.estado === "Completado") completados++;
    else if (t.estado === "En Proceso") enProceso++;
    else if (t.estado === "Pendiente") pendientes++;
    else if (t.estado === "Bloqueado") bloqueados++;
    const a = computeAvance(t.estado, t.avance);
    if (a !== null) { sum += a; count++; }
  });
  const avance = count ? Math.round(sum / count) : 0;
  return { total, completados, enProceso, pendientes, bloqueados, avance };
};

const fmtFecha = (iso) => {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
};

const firstLines = (text, max) => (text || "").split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, max);
const oneLine = (text) => (text || "").split(/\n+/).map(s => s.trim()).filter(Boolean).join(" — ");

const loadImageDataUrl = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => { const r = new FileReader(); r.onloadend = () => resolve(r.result); r.onerror = () => resolve(null); r.readAsDataURL(blob); });
  } catch { return null; }
};

export async function generateMinutaPpt({ entry, data, FRENTES, project }) {
  const brandName = project?.name || "BODEGAS COYOL";
  const projectShort = project?.short || "Coyol";
  const authorName = project?.name ? project.name.replace(/^BODEGAS\s+/i, "Bodegas ") : "Bodegas Coyol";
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = authorName;
  pptx.company = "Grupo ZEN · Deindustrial";

  const W = 13.33, H = 7.5;
  const frentes = (FRENTES || []).map(f => ({ ...f, stats: getFrente(f.id, data) }));
  const totalTasks = frentes.reduce((a, f) => a + f.stats.total, 0);
  const completadas = frentes.reduce((a, f) => a + f.stats.completados, 0);
  const enProceso = frentes.reduce((a, f) => a + f.stats.enProceso, 0);
  const bloqueadas = frentes.reduce((a, f) => a + f.stats.bloqueados, 0);
  const avgGlobal = frentes.length ? Math.round(frentes.reduce((a, f) => a + f.stats.avance, 0) / frentes.length) : 0;

  // ============ SLIDE 1 — Portada con imagen ============
  const [coverImg, logoZen, logoDei] = await Promise.all([
    loadImageDataUrl("/portada.jpg"),
    loadImageDataUrl("/logos/grupo-zen.png"),
    loadImageDataUrl("/logos/deindustrial.png"),
  ]);
  const s1 = pptx.addSlide();
  s1.background = { color: C.primary };
  if (coverImg) {
    s1.addImage({ data: coverImg, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
    // dark band at bottom for legibility
    s1.addShape(pptx.ShapeType.rect, { x: 0, y: 4.7, w: W, h: 2.8, fill: { color: "000000", transparency: 35 } });
  }
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.22, fill: { color: C.orange } });
  // Logo chip (white rounded bar, top-left)
  if (logoZen || logoDei) {
    s1.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 0.45, w: 4.3, h: 1.05, fill: { color: C.white }, line: { type: "none" }, rectRadius: 0.1, shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.3 } });
    if (logoZen) s1.addImage({ data: logoZen, x: 0.72, y: 0.58, w: 0.8, h: 0.8, sizing: { type: "contain", w: 0.8, h: 0.8 } });
    if (logoDei) s1.addImage({ data: logoDei, x: 1.75, y: 0.66, w: 2.85, h: 0.62, sizing: { type: "contain", w: 2.85, h: 0.62 } });
  }
  s1.addText(brandName, { x: 0.8, y: 4.95, w: 9.5, h: 0.95, fontSize: 50, bold: true, color: C.white, fontFace: "Calibri", shadow: { type: "outer", color: "000000", blur: 4, offset: 2, angle: 90, opacity: 0.6 } });
  s1.addText("Reporte Ejecutivo · Avance del Proyecto", { x: 0.82, y: 5.85, w: 9.5, h: 0.5, fontSize: 20, color: C.white, fontFace: "Calibri" });
  s1.addText(fmtFecha(entry.fecha).toUpperCase(), { x: 0.82, y: 6.4, w: 9.5, h: 0.5, fontSize: 17, bold: true, color: C.orange, fontFace: "Calibri" });
  // Big progress badge
  s1.addShape(pptx.ShapeType.ellipse, { x: 10.3, y: 5.0, w: 2.2, h: 2.2, fill: { color: C.accent }, line: { color: C.white, width: 3 } });
  s1.addText([
    { text: `${avgGlobal}%\n`, options: { fontSize: 40, bold: true, color: C.white, fontFace: "Calibri" } },
    { text: "AVANCE", options: { fontSize: 12, color: C.light, fontFace: "Calibri", charSpacing: 1 } },
  ], { x: 10.3, y: 5.0, w: 2.2, h: 2.2, align: "center", valign: "middle" });

  // ============ SLIDE 2 — Tablero (KPIs) ============
  const s2 = pptx.addSlide();
  s2.background = { color: C.white };
  s2.addText("TABLERO GENERAL", { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 30, bold: true, color: C.primary, fontFace: "Calibri" });
  s2.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.15, w: 12.1, h: 0, line: { color: C.orange, width: 2.5 } });
  const kpis = [
    { l: "AVANCE GLOBAL", v: `${avgGlobal}%`, c: C.accent },
    { l: "TAREAS LISTAS", v: `${completadas}/${totalTasks}`, c: C.green },
    { l: "EN PROCESO", v: `${enProceso}`, c: C.orange },
    { l: "BLOQUEADAS", v: `${bloqueadas}`, c: C.red },
  ];
  const cardW = 2.85, gap = 0.28, startX = (W - (cardW * 4 + gap * 3)) / 2;
  kpis.forEach((k, i) => {
    const x = startX + i * (cardW + gap);
    s2.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: cardW, h: 2.1, fill: { color: C.lightGray }, line: { color: k.c, width: 2 }, rectRadius: 0.1 });
    s2.addText(k.v, { x, y: 1.95, w: cardW, h: 1.1, align: "center", fontSize: 46, bold: true, color: k.c, fontFace: "Calibri" });
    s2.addText(k.l, { x, y: 3.05, w: cardW, h: 0.5, align: "center", fontSize: 13, bold: true, color: C.gray, fontFace: "Calibri", charSpacing: 1 });
  });
  // Estado resumen line
  s2.addText([
    { text: "Frentes activos: ", options: { bold: true, color: C.primary } },
    { text: `${frentes.length}`, options: { color: C.dark } },
    { text: "      Reunión: ", options: { bold: true, color: C.primary } },
    { text: fmtFecha(entry.fecha), options: { color: C.dark } },
    { text: "      Participantes: ", options: { bold: true, color: C.primary } },
    { text: entry.participantes || "—", options: { color: C.dark } },
  ], { x: 0.6, y: 4.4, w: 12.1, h: 0.6, fontSize: 16, fontFace: "Calibri" });

  // ============ SLIDE 3 — Avance por frente (bar chart) ============
  const s3 = pptx.addSlide();
  s3.background = { color: C.white };
  s3.addText("AVANCE POR FRENTE", { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 30, bold: true, color: C.primary, fontFace: "Calibri" });
  s3.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.15, w: 12.1, h: 0, line: { color: C.orange, width: 2.5 } });
  const barTop = 1.5, rowH = (H - barTop - 0.5) / frentes.length;
  const labelW = 3.6, barX = 4.3, barMaxW = 7.2;
  frentes.forEach((f, i) => {
    const y = barTop + i * rowH + (rowH - 0.42) / 2;
    s3.addText(`${f.icon} ${f.name}`, { x: 0.6, y: y - 0.04, w: labelW, h: 0.5, fontSize: 14, bold: true, color: C.dark, fontFace: "Calibri", valign: "middle" });
    s3.addShape(pptx.ShapeType.roundRect, { x: barX, y, w: barMaxW, h: 0.42, fill: { color: C.lightGray }, line: { type: "none" }, rectRadius: 0.05 });
    const fillW = Math.max(0.05, barMaxW * (f.stats.avance / 100));
    const col = f.stats.bloqueados > 0 ? C.red : f.stats.avance >= 80 ? C.green : f.stats.avance >= 40 ? C.accent : C.orange;
    s3.addShape(pptx.ShapeType.roundRect, { x: barX, y, w: fillW, h: 0.42, fill: { color: col }, line: { type: "none" }, rectRadius: 0.05 });
    s3.addText(`${f.stats.avance}%`, { x: barX + barMaxW + 0.15, y: y - 0.04, w: 1.0, h: 0.5, fontSize: 15, bold: true, color: C.primary, fontFace: "Calibri", valign: "middle" });
  });

  // ============ SLIDE 4 — Decisiones clave ============
  const s4 = pptx.addSlide();
  s4.background = { color: C.white };
  s4.addText("DECISIONES CLAVE", { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 30, bold: true, color: C.primary, fontFace: "Calibri" });
  s4.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.15, w: 12.1, h: 0, line: { color: C.orange, width: 2.5 } });
  const decisiones = [];
  if (entry.acuerdos && oneLine(entry.acuerdos)) decisiones.push({ frente: "Reunión", text: oneLine(entry.acuerdos) });
  frentes.forEach(f => {
    const tasks = (data && data[f.id]) || [];
    tasks.forEach(t => { const d = oneLine(t.decisiones); if (d) decisiones.push({ frente: f.name, text: d }); });
  });
  const topDec = decisiones.slice(0, 7);
  if (topDec.length === 0) {
    s4.addText("Sin decisiones registradas en este periodo.", { x: 0.6, y: 1.6, w: 12, h: 0.6, fontSize: 18, italic: true, color: C.gray, fontFace: "Calibri" });
  } else {
    s4.addText(topDec.map(d => ({
      text: `${d.text}`,
      options: { bullet: { code: "2713", indent: 20 }, color: C.dark, fontSize: 18, fontFace: "Calibri", paraSpaceAfter: 10 },
    })), { x: 0.7, y: 1.5, w: 12, h: 5.6, valign: "top" });
  }

  // ============ SLIDE 5 — Pendientes / Próximos pasos ============
  const s5 = pptx.addSlide();
  s5.background = { color: C.primary };
  s5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.25, fill: { color: C.orange } });
  s5.addText("PRÓXIMOS PASOS", { x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 30, bold: true, color: C.white, fontFace: "Calibri" });
  const pendientes = [];
  if (entry.compromisos && oneLine(entry.compromisos)) pendientes.push(oneLine(entry.compromisos));
  frentes.forEach(f => {
    const tasks = (data && data[f.id]) || [];
    tasks.forEach(t => { const n = oneLine(t.notas); if (n && t.estado !== "Completado") pendientes.push(`[${f.name}] ${n}`); });
  });
  const topPend = pendientes.slice(0, 7);
  if (topPend.length === 0) {
    s5.addText("Sin pendientes abiertos.", { x: 0.6, y: 1.6, w: 12, h: 0.6, fontSize: 18, italic: true, color: C.light, fontFace: "Calibri" });
  } else {
    s5.addText(topPend.map(t => ({
      text: t,
      options: { bullet: { code: "25B8", indent: 20 }, color: C.white, fontSize: 18, fontFace: "Calibri", paraSpaceAfter: 10 },
    })), { x: 0.7, y: 1.5, w: 12, h: 5.2, valign: "top" });
  }
  if (entry.responsable && entry.responsable.trim()) {
    s5.addText(`Responsable de seguimiento: ${entry.responsable}${entry.fechaLimite ? "  ·  Fecha límite: " + fmtFecha(entry.fechaLimite) : ""}`, { x: 0.6, y: 6.8, w: 12.1, h: 0.5, fontSize: 13, color: "94A3B8", fontFace: "Calibri" });
  }

  const fileName = `Presentacion-${projectShort}-${entry.fecha || new Date().toISOString().split("T")[0]}.pptx`;
  await pptx.writeFile({ fileName });
}
