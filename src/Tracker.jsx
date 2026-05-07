import { useState, useEffect, useRef } from "react";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase.js";

const ESTADOS = ["Pendiente", "En Proceso", "Completado", "Bloqueado", "N/A"];
const PRIORIDADES = ["Alta", "Media", "Baja"];
const EC = {
  Completado: { bg: "#0369a1", text: "#fff" },
  "En Proceso": { bg: "#f59e0b", text: "#1e293b" },
  Pendiente: { bg: "#94a3b8", text: "#fff" },
  Bloqueado: { bg: "#dc2626", text: "#fff" },
  "N/A": { bg: "#cbd5e1", text: "#64748b" },
};
const PC = {
  Alta: { bg: "#fee2e2", text: "#991b1b" },
  Media: { bg: "#fef3c7", text: "#92400e" },
  Baja: { bg: "#dbeafe", text: "#1e40af" },
};

const FRENTES = [
  { id: "financiero", icon: "💰", name: "Financiero", short: "Finan.", full: "Estructuración Financiera" },
  { id: "legal", icon: "⚖️", name: "Legal", short: "Legal", full: "Estructuración Legal" },
  { id: "fiscal", icon: "📋", name: "Fiscal", short: "Fiscal", full: "Estructuración Fiscal" },
  { id: "permisologia", icon: "📄", name: "Diseño y Permisología", short: "Diseño", full: "Diseño y Permisología" },
  { id: "comercializacion", icon: "🏢", name: "Comercialización", short: "Comer.", full: "Pre-colocación / Comercialización" },
  { id: "construccion", icon: "🏗️", name: "Construcción", short: "Const.", full: "Movimientos de Tierra / Construcción" },
  { id: "entregas", icon: "🔑", name: "Entregas", short: "Entreg.", full: "Entregas de Bodegas" },
  { id: "puesta", icon: "🚀", name: "Puesta en Marcha", short: "Puesta", full: "Puesta en Marcha del Proyecto" },
];

const AutoTextarea = ({ value, onChange, style, ...rest }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      style={{ resize: "none", overflow: "hidden", whiteSpace: "pre-wrap", wordBreak: "break-word", ...style }}
      {...rest}
    />
  );
};

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
};

const initialData = () => ({
  financiero: [
    { id:1, area:"Crédito / Banco", tarea:"Apoyo en solicitudes de crédito ante entidad financiera", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:2, area:"Crédito / Banco", tarea:"Actualizaciones bancarias y gestión de servicios de deuda", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:3, area:"Crédito / Banco", tarea:"Acceso y configuración de cuentas bancarias", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"En caso de Financiar con Davibank se deben abrir cuentas", archivos:[] },
    { id:4, area:"Crédito / Banco", tarea:"Decisión de fondeo Bridgestone", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:0, notas:"Opción 1: Firesale Bodega B\nOpción 2: Forward Purchase Fondo Aris\nOpción 3: Inyección capital $2kk", archivos:[] },
    { id:5, area:"Facturación", tarea:"Definición inicio recepción de facturas Ganadera", responsable:"Antony Aguilar / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"A la espera de hitos.", archivos:[] },
    { id:6, area:"Facturación", tarea:"Emisión de facturas electrónicas", responsable:"Antony Aguilar / ZEN", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:7, area:"Facturación", tarea:"Recepción y validación facturas proveedores", responsable:"Antony Aguilar / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:0, notas:"A la espera de hitos.", archivos:[] },
    { id:8, area:"Facturación", tarea:"Pago oportuno de facturas aprobadas", responsable:"Antony Aguilar / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:9, area:"Maestros", tarea:"Conciliar Maestro del Proyecto", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:10, area:"Maestros", tarea:"Maestro de las Desarrolladoras (GZCR / DEI)", responsable:"DEINDUSTRIAL / ZEN", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"Se irá actualizando", archivos:[] },
    { id:11, area:"Maestros", tarea:"Plan de Negocios - Modelo Financiero", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"Sujeto a cambios", archivos:[] },
    { id:12, area:"Maestros", tarea:"Plan de Negocios - EERR y flujo de caja", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:13, area:"Maestros", tarea:"Master Plan", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:14, area:"Contabilidad", tarea:"Control contabilidad mensual y EEFF", responsable:"Noelia Calderón", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:15, area:"Contabilidad", tarea:"Cierre contable anual y auditoría", responsable:"Noelia Calderón", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
  ],
  legal: [
    { id:1, area:"Societario", tarea:"Revisión acta constitutiva / pacto social", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:2, area:"Societario", tarea:"Actas de asamblea según necesidades", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:3, area:"Societario", tarea:"Formalización aportes de capital", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"Pendiente estructura DEI/GZCR", archivos:[] },
    { id:4, area:"Societario", tarea:"Documentación devoluciones capital", responsable:"Asesor Legal / ZEN", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:5, area:"Contratos", tarea:"Revisión contratos desarrolladora(s)", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:6, area:"Contratos", tarea:"Contratos arrendamiento bodegas", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:30, notas:"Revisión contrato Bridgestone", archivos:[] },
    { id:7, area:"Otros", tarea:"Poderes notariales vigentes", responsable:"Asesor Legal / ZEN", prioridad:"Media", estado:"En Proceso", fechaLimite:"", avance:50, notas:"Preguntar a Sfera", archivos:[] },
    { id:8, area:"Contratos", tarea:"Contratos arrendamiento (2do lote)", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:30, notas:"", archivos:[] },
    { id:9, area:"Otros", tarea:"Poderes notariales (JG)", responsable:"Asesor Legal / ZEN", prioridad:"Media", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:10, area:"Otros", tarea:"Registro Transparencia y Beneficiarios", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"Coordinar con Rebeca Milgram", archivos:[] },
  ],
  fiscal: [
    { id:1, area:"Inscripción", tarea:"Inscripción contribuyente ante DGTD", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:2, area:"Declaraciones", tarea:"Declaraciones IVA mensuales (D-150)", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:3, area:"Declaraciones", tarea:"Retenciones en la fuente", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:4, area:"Declaraciones", tarea:"Impuesto sobre la renta anual", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:5, area:"Declaraciones", tarea:"Impuesto personas jurídicas", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:6, area:"Declaraciones", tarea:"Timbre educación y cultura", responsable:"Asesor Fiscal / Antony", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:7, area:"Cumplimiento", tarea:"Declaración partes relacionadas", responsable:"Asesor Fiscal / Antony", prioridad:"Media", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Cumplimiento", tarea:"Obligaciones tributarias municipales", responsable:"Asesor Fiscal / Antony", prioridad:"Media", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
  ],
  permisologia: [
    { id:1, area:"CFIA", tarea:"Visa planos constructivos ante CFIA", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:2, area:"SETENA", tarea:"Viabilidad ambiental (EIA)", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:66, notas:"", archivos:[] },
    { id:3, area:"Municipalidad", tarea:"Permiso construcción Muni Alajuela", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:4, area:"Municipalidad", tarea:"Alineamientos viales y acceso", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"Completado", archivos:[] },
    { id:5, area:"AyA / ESPH", tarea:"Conexión agua potable", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:6, area:"ICE / CNFL", tarea:"Conexión energía eléctrica", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:7, area:"Bomberos", tarea:"Visado planos contra incendios", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Min. Salud", tarea:"Permisos sanitarios (PTAR)", responsable:"DEINDUSTRIAL", prioridad:"Media", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:9, area:"MOPT", tarea:"Acceso red vial nacional CCAR", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"Próximo miércoles", archivos:[] },
    { id:10, area:"Seg. ZEN", tarea:"Archivo permisos obtenidos", responsable:"Antony / ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:11, area:"Seg. ZEN", tarea:"Monitoreo vencimientos permisos", responsable:"Antony", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:12, area:"Seg. ZEN", tarea:"Permiso Obra en Cause - MINAE", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"Aprobado 23 abril 2026", archivos:[] },
  ],
  comercializacion: [
    { id:1, area:"Mercado", tarea:"Análisis tarifas Zona Franca Coyol", responsable:"DEINDUSTRIAL", prioridad:"Media", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:2, area:"Mercado", tarea:"Perfil bodega y cliente objetivo", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:3, area:"Prospección", tarea:"Listado prospectos pre-colocación", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:4, area:"Prospección", tarea:"Presentación a prospectos", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:50, notas:"", archivos:[] },
    { id:5, area:"Negociación", tarea:"Condiciones de arrendamiento", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:25, notas:"", archivos:[] },
    { id:6, area:"Negociación", tarea:"LOI firmadas", responsable:"DEINDUSTRIAL", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:10, notas:"", archivos:[] },
    { id:7, area:"Contratos", tarea:"Formalización contratos arrendamiento", responsable:"DEINDUSTRIAL / Legal", prioridad:"Alta", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Contratos", tarea:"Depósitos y garantías", responsable:"Antony", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:9, area:"Gestión", tarea:"Pipeline comercial", responsable:"DEINDUSTRIAL", prioridad:"Media", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:10, area:"Gestión", tarea:"Visitas prospectos al terreno", responsable:"DEINDUSTRIAL", prioridad:"Media", estado:"En Proceso", fechaLimite:"", avance:0, notas:"", archivos:[] },
  ],
  construccion: [
    { id:1, area:"Mov. Tierra", tarea:"Movimientos de tierra", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:2, area:"Mov. Tierra", tarea:"Topografía y trazado", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:3, area:"Infraestr.", tarea:"Vías internas y accesos", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:4, area:"Infraestr.", tarea:"Redes agua pluvial y sanitaria", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:5, area:"Infraestr.", tarea:"Red eléctrica e iluminación", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:6, area:"Estructura", tarea:"Cimentaciones y estructuras", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:7, area:"Estructura", tarea:"Paredes, techos y cerramientos", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Acabados", tarea:"Puertas, portones y seguridad", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:9, area:"Acabados", tarea:"Acabados interiores y exteriores", responsable:"DEINDUSTRIAL / Zebol", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:10, area:"Control", tarea:"Supervisión e inspección", responsable:"ZEN / DEINDUSTRIAL", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:11, area:"Control", tarea:"Valuaciones de obra", responsable:"ZEN / DEINDUSTRIAL", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:12, area:"Control", tarea:"Cronograma construcción", responsable:"ZEN / DEINDUSTRIAL", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:13, area:"Control", tarea:"Gestión cambios al alcance", responsable:"ZEN / DEINDUSTRIAL", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
  ],
  entregas: [
    { id:1, area:"Planificación", tarea:"Cronograma entregas por bodega", responsable:"DEINDUSTRIAL/ ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:2, area:"Planificación", tarea:"Checklist entrega por bodega", responsable:"ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:3, area:"Entrega", tarea:"Inspección previa: acabados", responsable:"ZEN / Inspector", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:4, area:"Entrega", tarea:"Acta de entrega firmada", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:5, area:"Entrega", tarea:"Inventario de condiciones", responsable:"ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:6, area:"Entrega", tarea:"Llaves, accesos y manuales", responsable:"Desarrollador", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:7, area:"Post-Entrega", tarea:"Garantías de construcción", responsable:"ZEN / Desarrollador", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Post-Entrega", tarea:"Defectos post-entrega", responsable:"DEINDUSTRIAL", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
  ],
  puesta: [
    { id:1, area:"Operaciones", tarea:"Modelo operativo del proyecto", responsable:"DEINDUSTRIAL/ ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:2, area:"Operaciones", tarea:"Seguridad y vigilancia", responsable:"DEINDUSTRIAL/Zebol", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:3, area:"Operaciones", tarea:"Limpieza y mantenimiento", responsable:"DEINDUSTRIAL/Zebol", prioridad:"Media", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:4, area:"Operaciones", tarea:"Reglamento interno parque", responsable:"Asesor Legal / ZEN", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:5, area:"Facturación", tarea:"Sistema facturación alquileres", responsable:"Antony", prioridad:"Alta", estado:"Completado", fechaLimite:"", avance:100, notas:"", archivos:[] },
    { id:6, area:"Facturación", tarea:"Primer ciclo facturación", responsable:"Antony", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:7, area:"Facturación", tarea:"Cobro depósitos y alquileres", responsable:"Antony", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:8, area:"Reportes", tarea:"Primer reporte financiero", responsable:"Antony / Noelia", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
    { id:9, area:"Reportes", tarea:"Reunión cierre y arranque", responsable:"ZEN / Socios", prioridad:"Alta", estado:"Pendiente", fechaLimite:"", avance:0, notas:"", archivos:[] },
  ],
  bitacora: [
    { id:1, fecha:"2026-03-12", participantes:"Antony, Aris, Jose, Noelia", frentes:"Seguimiento de avances", acuerdos:"N/A", compromisos:"Alineamientos viales y permisos CCAR", responsable:"", fechaLimite:"", cumplido:false },
    { id:2, fecha:"2026-04-23", participantes:"Hans, Aris, Antony", frentes:"Decisión Financiera Bridgestone", acuerdos:"N/A", compromisos:"Opción 1: Firesale Bodega B\nOpción 2: Forward Purchase\nOpción 3: Inyección $2kk", responsable:"", fechaLimite:"2026-05-31", cumplido:false },
  ],
  maestros: { zen: [
    {id:1,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2023-11-14",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"4409.25",crc:"",comprobante:[]},
    {id:2,concepto:"Honorarios Legales Engagement Letter Fase 1 y 2",fecha:"2023-11-14",destino:"Sfera Legal S.R.L.",factura:"",usd:"-4409.25",crc:"",comprobante:[]},
    {id:3,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2024-01-27",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"135.94",crc:"69330",comprobante:[]},
    {id:4,concepto:"Impuesto de Personas Jurídicas 2024",fecha:"2024-01-27",destino:"Ministerio de Hacienda",factura:"",usd:"-135.94",crc:"-69330",comprobante:[]},
    {id:5,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-01-29",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"232.4",crc:"115550",comprobante:[]},
    {id:6,concepto:"Impuesto de Personas Jurídicas 2025",fecha:"2025-01-29",destino:"Ministerio de Hacienda",factura:"",usd:"-232.4",crc:"-115550",comprobante:[]},
    {id:7,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-03-12",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"370.98",crc:"",comprobante:[]},
    {id:8,concepto:"Limpieza Propiedad",fecha:"2025-03-12",destino:"Javier Barboza Jiménez",factura:"",usd:"-370.98",crc:"",comprobante:[]},
    {id:9,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-03-12",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"1980.25",crc:"",comprobante:[]},
    {id:10,concepto:"Estudio Geofísico Agua Subsuelo",fecha:"2025-03-12",destino:"Geostratu Consultores S.A.",factura:"",usd:"-1980.25",crc:"",comprobante:[]},
    {id:11,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-05-15",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"1465.5",crc:"",comprobante:[]},
    {id:12,concepto:"Gastos de Traspaso Interno Ganadera San Lorenzo",fecha:"2025-05-15",destino:"Sfera Legal S.R.L.",factura:"",usd:"-1465.5",crc:"",comprobante:[]},
    {id:13,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-08-08",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"11346.75",crc:"",comprobante:[]},
    {id:14,concepto:"Honorarios Diseño Estructural",fecha:"2025-08-08",destino:"GCG Estudio AD S.A.",factura:"",usd:"-11346.75",crc:"",comprobante:[]},
    {id:15,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-08-08",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"8065.25",crc:"",comprobante:[]},
    {id:16,concepto:"Honorarios Diseño Estructural",fecha:"2025-08-08",destino:"Guidi Estructurales S.A.",factura:"",usd:"-8065.25",crc:"",comprobante:[]},
    {id:17,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-08-08",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"8065.25",crc:"",comprobante:[]},
    {id:18,concepto:"Honorarios Diseño Estructural",fecha:"2025-08-08",destino:"Consultores GGM Ingenieria S.A.",factura:"",usd:"-8065.25",crc:"",comprobante:[]},
    {id:19,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-09-21",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"8065.25",crc:"",comprobante:[]},
    {id:20,concepto:"Honorarios Diseño Estructural",fecha:"2025-09-21",destino:"Guidi Estructurales S.A.",factura:"",usd:"-8065.25",crc:"",comprobante:[]},
    {id:21,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-11-15",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"11209.89",crc:"",comprobante:[]},
    {id:22,concepto:"Honorarios Diseño Estructural",fecha:"2025-11-15",destino:"Guidi Estructurales S.A.",factura:"",usd:"-11209.89",crc:"",comprobante:[]},
    {id:23,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-11-15",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"1051.13",crc:"",comprobante:[]},
    {id:24,concepto:"Honorarios Diseño Estructural",fecha:"2025-11-15",destino:"Consultores GGM Ingenieria S.A.",factura:"",usd:"-1051.13",crc:"",comprobante:[]},
    {id:25,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-11-22",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"1477.72",crc:"",comprobante:[]},
    {id:26,concepto:"Honorarios Diseño Estructural",fecha:"2025-11-22",destino:"GCG Estudio AD S.A.",factura:"",usd:"-1477.72",crc:"",comprobante:[]},
    {id:27,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2025-12-16",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"9113.63",crc:"",comprobante:[]},
    {id:28,concepto:"Honorarios Diseño Estructural",fecha:"2025-12-16",destino:"Consultores GGM Ingenieria S.A.",factura:"",usd:"-9113.63",crc:"",comprobante:[]},
    {id:29,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2026-02-07",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"2261.5",crc:"",comprobante:[]},
    {id:30,concepto:"Honorarios Legales Contratos Comerciales",fecha:"2026-02-07",destino:"Sfera Legal S.R.L.",factura:"",usd:"-2261.5",crc:"",comprobante:[]},
    {id:31,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2026-02-20",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"3956.5",crc:"",comprobante:[]},
    {id:32,concepto:"Honorarios Legales Contrato Comercial Tico Electronics",fecha:"2026-02-20",destino:"Sfera Legal S.R.L.",factura:"",usd:"-3956.5",crc:"",comprobante:[]},
    {id:33,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2026-02-25",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"3211.27",crc:"",comprobante:[]},
    {id:34,concepto:"Honorarios Diseño Estructural",fecha:"2026-02-25",destino:"GCG Estudio AD S.A.",factura:"",usd:"-3211.27",crc:"",comprobante:[]},
    {id:35,concepto:"Desembolso Crédito Puente Grupo ZEN",fecha:"2026-04-07",destino:"Grupo Zen Costa Rica GZCR S.A.",factura:"",usd:"1629.29",crc:"",comprobante:[]},
    {id:36,concepto:"Honorarios Legales Retainer Engagement Letter Final",fecha:"2026-04-07",destino:"Sfera Legal S.R.L.",factura:"",usd:"-1629.29",crc:"",comprobante:[]},
  ], dei: [], proyecto: [] },
  clientes: {
    bodegaA: { cliente: "", contacto: "", telefono: "", email: "", area: "4,063 m²", renta: "", plazo: "", inicioContrato: "", estado: "Disponible", notas: "", archivos: [] },
    bodegaB: { cliente: "", contacto: "", telefono: "", email: "", area: "15,163 m²", renta: "", plazo: "", inicioContrato: "", estado: "Disponible", notas: "", archivos: [] },
    bodegaC: { cliente: "Bridgestone", contacto: "", telefono: "", email: "", area: "7,123 m²", renta: "", plazo: "", inicioContrato: "", estado: "En Negociación", notas: "Incluye mezzanine 200 m²", archivos: [] },
  },
});

const computeAvance = (estado, manual) => {
  if (estado === "Completado") return 100;
  if (estado === "Pendiente") return 0;
  if (estado === "N/A") return null;
  return manual;
};

const getFrente = (id, data) => {
  const tasks = data[id] || [];
  const valid = tasks.filter(t => t.estado !== "N/A");
  const total = valid.length;
  const completados = valid.filter(t => t.estado === "Completado").length;
  const enProceso = valid.filter(t => t.estado === "En Proceso").length;
  const avgs = valid.map(t => computeAvance(t.estado, t.avance)).filter(v => v !== null);
  const avance = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
  const bloqueados = valid.filter(t => t.estado === "Bloqueado").length;
  const estado = completados === total && total > 0 ? "Completado" : bloqueados > 0 ? "Bloqueado" : enProceso > 0 || completados > 0 ? "En Proceso" : "Pendiente";
  return { total, completados, enProceso, avance, estado, bloqueados, pendientes: valid.filter(t=>t.estado==="Pendiente").length };
};

const Badge = ({ type, value }) => {
  const c = type === "estado" ? EC[value] : PC[value];
  if (!c) return <span>{value}</span>;
  return <span style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{value}</span>;
};

const ProgressBar = ({ value, h = 8 }) => {
  const pct = Math.round(value || 0);
  const color = pct >= 80 ? "#0369a1" : pct >= 40 ? "#0284c7" : pct > 0 ? "#38bdf8" : "#e2e8f0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
      <div style={{ flex: 1, height: h, background: "#e2e8f0", borderRadius: h, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: h, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#0c4a6e", minWidth: 32, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
    </div>
  );
};

const s = {
  lbl: { fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 3, fontWeight: 600 },
  inp: { background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", fontFamily: "inherit", outline: "none" },
  sel: { background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 6px", fontSize: 11, cursor: "pointer", width: "100%" },
  tInp: { background: "transparent", color: "#0f172a", border: "1px solid transparent", borderRadius: 4, padding: "4px 6px", fontSize: 12, width: "100%", outline: "none", fontFamily: "inherit" },
};

const fileIcon = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["xlsx","xls","csv"].includes(ext)) return "📊";
  return "📎";
};

const fmtBytes = (b) => { if (!b && b !== 0) return ""; if (b < 1024) return b + " B"; if (b < 1024*1024) return (b/1024).toFixed(1) + " KB"; return (b/1024/1024).toFixed(1) + " MB"; };
const fmtDate = (ts) => { if (!ts) return ""; const d = new Date(ts); return d.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" }); };
const isImage = (name = "") => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);

const NotesModal = ({ title, value, onSave, onClose }) => {
  const [text, setText] = useState(value || "");
  const dirty = text !== (value || "");
  const handleClose = () => {
    if (dirty && !confirm("Tenés cambios sin guardar. ¿Cerrar sin guardar?")) return;
    onClose();
  };
  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 720, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>Anotaciones</div>
            <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || ""}</div>
          </div>
          <button onClick={handleClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>
        <div style={{ flex: 1, padding: 20, background: "#f8fafc", overflow: "auto" }}>
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tus notas aquí…" style={{ width: "100%", minHeight: 320, padding: 14, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, outline: "none", resize: "vertical", background: "#fff", color: "#0f172a" }} />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{text.length} caracteres · {text.split(/\s+/).filter(Boolean).length} palabras</div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={handleClose} style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSave(text)} disabled={!dirty} style={{ background: dirty ? "linear-gradient(135deg, #0369a1, #0284c7)" : "#cbd5e1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: dirty ? "pointer" : "not-allowed" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

const FilesModal = ({ archivos, onChange, onClose, title }) => {
  const ref = useRef();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [uploads, setUploads] = useState({});

  const sanitize = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadOne = (file) => new Promise((resolve, reject) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `attachments/${id}-${sanitize(file.name)}`;
    const sref = storageRef(storage, path);
    const task = uploadBytesResumable(sref, file);
    setUploads(prev => ({ ...prev, [id]: { name: file.name, progress: 0 } }));
    task.on("state_changed",
      (snap) => {
        const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploads(prev => ({ ...prev, [id]: { name: file.name, progress } }));
      },
      (err) => {
        setUploads(prev => { const n = { ...prev }; delete n[id]; return n; });
        reject(err);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploads(prev => { const n = { ...prev }; delete n[id]; return n; });
          resolve({ name: file.name, size: file.size, type: file.type, url, path, ts: Date.now() });
        } catch (err) { reject(err); }
      }
    );
  });

  const addFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;
    try {
      const results = await Promise.all(files.map(uploadOne));
      onChange([...archivos, ...results]);
    } catch (err) {
      alert("Error al subir archivo(s): " + (err?.message || err));
    }
  };
  const onPick = (e) => { addFiles(e.target.files); e.target.value = ""; };
  const onDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };
  const remove = async (idx) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    const f = archivos[idx];
    if (f?.path) {
      try { await deleteObject(storageRef(storage, f.path)); }
      catch (err) { console.warn("No se pudo borrar de Storage:", err.message); }
    }
    onChange(archivos.filter((_, i) => i !== idx));
  };
  const isBroken = (f) => !f.url || f.url.startsWith("blob:") || (!f.path && !f.url.startsWith("http"));
  const fileLinkProps = (f) => isBroken(f)
    ? { href: "#", onClick: (e) => { e.preventDefault(); alert("⚠️ Este archivo se subió antes de la actualización a Firebase Storage y ya no se puede abrir.\n\nPor favor, eliminalo y volvelo a subir."); } }
    : { href: f.url, target: "_blank", rel: "noopener noreferrer" };
  const startRename = (i, name) => { setRenaming(i); setRenameVal(name); };
  const saveRename = () => {
    if (renaming === null) return;
    const trimmed = renameVal.trim();
    if (trimmed) onChange(archivos.map((f, i) => i === renaming ? { ...f, name: trimmed } : f));
    setRenaming(null); setRenameVal("");
  };

  const filtered = archivos
    .map((f, idx) => ({ ...f, _idx: idx }))
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "newest") return (b.ts || 0) - (a.ts || 0);
      if (sort === "oldest") return (a.ts || 0) - (b.ts || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return (b.size || 0) - (a.size || 0);
      return 0;
    });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 760, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📎</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>Archivos adjuntos</div>
            <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || ""} · {archivos.length} archivo(s)</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button onClick={() => ref.current?.click()} style={{ background: "linear-gradient(135deg, #0369a1, #0284c7)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ＋ Subir archivos
          </button>
          <input ref={ref} type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip" onChange={onPick} style={{ display: "none" }} />
          <input type="text" placeholder="Buscar por nombre…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 140, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none" }} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, background: "#fff", cursor: "pointer" }}>
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="name">Nombre A-Z</option>
            <option value="size">Tamaño</option>
          </select>
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setView("list")} title="Lista" style={{ background: view === "list" ? "#e0f2fe" : "#fff", color: view === "list" ? "#0369a1" : "#64748b", border: "none", padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>☰</button>
            <button onClick={() => setView("grid")} title="Cuadrícula" style={{ background: view === "grid" ? "#e0f2fe" : "#fff", color: view === "grid" ? "#0369a1" : "#64748b", border: "none", padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, borderLeft: "1px solid #e2e8f0" }}>▦</button>
          </div>
        </div>

        {/* Content */}
        <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{ flex: 1, overflow: "auto", padding: 20, background: "#f8fafc" }}>
          {Object.keys(uploads).length > 0 && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>Subiendo {Object.keys(uploads).length} archivo(s)…</div>
              {Object.entries(uploads).map(([id, u]) => (
                <div key={id} style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#1e40af", marginBottom: 2 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{u.name}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>{u.progress}%</span>
                  </div>
                  <div style={{ height: 4, background: "#dbeafe", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${u.progress}%`, background: "#2563eb", transition: "width 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {archivos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📁</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>No hay archivos adjuntos</div>
              <div style={{ fontSize: 12 }}>Click en <strong>＋ Subir archivos</strong> o arrastrá archivos aquí.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13 }}>Ningún archivo coincide con "{search}".</div>
          ) : view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {filtered.map((f) => (
                <div key={f._idx} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <a {...fileLinkProps(f)} style={{ height: 100, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", textDecoration: "none" }}>
                    {isImage(f.name) && f.url
                      ? <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 38 }}>{fileIcon(f.name)}</span>}
                  </a>
                  <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div title={f.name} style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                      <span>{fmtDate(f.ts)}</span><span>{fmtBytes(f.size)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                      <a {...fileLinkProps(f)} style={{ flex: 1, background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 5, padding: "4px", fontSize: 10, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", lineHeight: "16px" }}>Abrir</a>
                      <button onClick={() => startRename(f._idx, f.name)} title="Renombrar" style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 5, padding: "4px 6px", fontSize: 10, cursor: "pointer" }}>✎</button>
                      <button onClick={() => remove(f._idx)} title="Eliminar" style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 5, padding: "4px 6px", fontSize: 10, cursor: "pointer" }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((f) => (
                <div key={f._idx} style={{ background: isBroken(f) ? "#fffbeb" : "#fff", borderRadius: 10, border: isBroken(f) ? "1px solid #fde68a" : "1px solid #e2e8f0", padding: "10px 12px", display: "flex", alignItems: "center", gap: 12 }}>
                  <a {...fileLinkProps(f)} style={{ width: 44, height: 44, background: "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", overflow: "hidden", textDecoration: "none" }}>
                    {isImage(f.name) && f.url
                      ? <img src={f.url} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 22 }}>{fileIcon(f.name)}</span>}
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {renaming === f._idx ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }} style={{ flex: 1, padding: "4px 8px", border: "1px solid #0369a1", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        <button onClick={saveRename} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>OK</button>
                      </div>
                    ) : (
                      <>
                        <a {...fileLinkProps(f)} title={f.name} style={{ display: "block", fontSize: 13, fontWeight: 600, color: isBroken(f) ? "#92400e" : "#0369a1", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2, textDecoration: "none" }}>{isBroken(f) ? "⚠️ " : ""}{f.name}</a>
                        <div style={{ fontSize: 10, color: "#94a3b8", display: "flex", gap: 10 }}>
                          <span>📅 {fmtDate(f.ts)}</span>
                          <span>📦 {fmtBytes(f.size)}</span>
                          {isBroken(f) && <span style={{ color: "#92400e", fontWeight: 600 }}>· Re-subir</span>}
                        </div>
                      </>
                    )}
                  </div>
                  {renaming !== f._idx && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <a {...fileLinkProps(f)} title="Abrir" style={{ background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Abrir</a>
                      <button onClick={() => startRename(f._idx, f.name)} title="Renombrar" style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✎</button>
                      <button onClick={() => remove(f._idx)} title="Eliminar" style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>🗑</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid #e2e8f0", fontSize: 10, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
          <span>💡 También podés arrastrar archivos al área central.</span>
          <span>Total: {fmtBytes(archivos.reduce((s, f) => s + (f.size || 0), 0))}</span>
        </div>
      </div>
    </div>
  );
};

const FileAttachments = ({ archivos = [], onChange, title }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: archivos.length ? "#0369a1" : "#e0f2fe", color: archivos.length ? "#fff" : "#0369a1", border: "1px solid " + (archivos.length ? "#0369a1" : "#bae6fd"), borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
        📎 Adjuntos
        {archivos.length > 0 && (
          <span style={{ background: archivos.length ? "#fff" : "#0369a1", color: archivos.length ? "#0369a1" : "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800, minWidth: 18, textAlign: "center" }}>{archivos.length}</span>
        )}
      </button>
      {open && <FilesModal archivos={archivos} onChange={onChange} onClose={() => setOpen(false)} title={title} />}
    </>
  );
};

const TaskCard = ({ t, i, onUpdate, onDelete, onMove, total }) => {
  const [open, setOpen] = useState(false);
  const eff = computeAvance(t.estado, t.avance);
  const isOverdue = t.fechaLimite && t.estado !== "Completado" && new Date(t.fechaLimite) < new Date();
  return (
    <div style={{ background: isOverdue ? "#fef2f2" : "#fff", borderRadius: 10, border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 24 }}>
          {onMove && i > 0 && <button onClick={(e) => { e.stopPropagation(); onMove(i, i - 1); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 4, width: 22, height: 18, fontSize: 10, color: "#64748b", cursor: "pointer", padding: 0 }}>▲</button>}
          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{i + 1}</span>
          {onMove && i < (total - 1) && <button onClick={(e) => { e.stopPropagation(); onMove(i, i + 1); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 4, width: 22, height: 18, fontSize: 10, color: "#64748b", cursor: "pointer", padding: 0 }}>▼</button>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, marginBottom: 4 }}>{t.tarea}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge type="estado" value={t.estado} />
            <Badge type="prioridad" value={t.prioridad} />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{t.area}</span>
            {(t.archivos||[]).length > 0 && <span style={{ fontSize: 10, color: "#0369a1" }}>📎{t.archivos.length}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: eff >= 80 ? "#0369a1" : eff > 0 ? "#0284c7" : "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{eff !== null ? `${eff}%` : "—"}</div>
          <div style={{ fontSize: 14, color: "#94a3b8", transform: open ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▾</div>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div><label style={s.lbl}>Tarea</label><input value={t.tarea} onChange={e => onUpdate("tarea", e.target.value)} style={s.inp} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={s.lbl}>Área</label><input value={t.area} onChange={e => onUpdate("area", e.target.value)} style={s.inp} /></div>
              <div><label style={s.lbl}>Responsable</label><input value={t.responsable} onChange={e => onUpdate("responsable", e.target.value)} style={s.inp} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={s.lbl}>Estado</label><select value={t.estado} onChange={e => onUpdate("estado", e.target.value)} style={s.inp}>{ESTADOS.map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label style={s.lbl}>Prioridad</label><select value={t.prioridad} onChange={e => onUpdate("prioridad", e.target.value)} style={s.inp}>{PRIORIDADES.map(o => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={s.lbl}>Fecha Límite</label><input type="date" value={t.fechaLimite} onChange={e => onUpdate("fechaLimite", e.target.value)} style={s.inp} /></div>
              <div>
                <label style={s.lbl}>Avance %</label>
                {(t.estado === "En Proceso" || t.estado === "Bloqueado")
                  ? <input type="number" min={0} max={100} value={t.avance} onChange={e => onUpdate("avance", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} style={s.inp} />
                  : <div style={{ ...s.inp, background: "#f1f5f9", color: "#64748b" }}>{eff !== null ? `${eff}% (auto)` : "N/A"}</div>}
              </div>
            </div>
            <div><label style={s.lbl}>Notas</label><textarea value={t.notas} onChange={e => onUpdate("notas", e.target.value)} rows={3} style={{ ...s.inp, resize: "vertical" }} /></div>
            <div><label style={s.lbl}>Archivos adjuntos</label><FileAttachments archivos={t.archivos||[]} onChange={v => onUpdate("archivos", v)} title={t.tarea} /></div>
            <button onClick={onDelete} style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar tarea</button>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskRow = ({ t, i, onUpdate, onDelete, onMove, dragOverIdx, setDragOverIdx, total }) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const eff = computeAvance(t.estado, t.avance);
  const isOverdue = t.fechaLimite && t.estado !== "Completado" && new Date(t.fechaLimite) < new Date();
  const isDragOver = dragOverIdx === i;
  const onDragStart = (e) => { e.dataTransfer.setData("text/plain", String(i)); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverIdx !== i) setDragOverIdx(i); };
  const onDragLeave = () => { if (dragOverIdx === i) setDragOverIdx(null); };
  const onDrop = (e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData("text/plain"), 10); if (!isNaN(from) && from !== i) onMove(from, i); setDragOverIdx(null); };
  return (
    <tr onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={{ background: isOverdue ? "#fef2f2" : i % 2 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0", borderTop: isDragOver ? "2px solid #0369a1" : undefined }}>
      <td style={{ padding: "7px 6px", whiteSpace: "nowrap" }}>
        <span draggable onDragStart={onDragStart} title="Arrastrar para reordenar" style={{ cursor: "grab", color: "#cbd5e1", fontSize: 14, marginRight: 4, userSelect: "none" }}>⋮⋮</span>
        <span style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{i + 1}</span>
      </td>
      <td style={{ padding: "7px 6px", minWidth: 130 }}><input value={t.area} onChange={e => onUpdate("area", e.target.value)} style={s.tInp} /></td>
      <td style={{ padding: "7px 6px", minWidth: 360, maxWidth: 460 }}>
        <AutoTextarea value={t.tarea} onChange={e => onUpdate("tarea", e.target.value)} style={{ ...s.tInp, fontSize: 13, lineHeight: 1.4, padding: "6px 8px" }} />
      </td>
      <td style={{ padding: "7px 6px", minWidth: 150 }}><input value={t.responsable} onChange={e => onUpdate("responsable", e.target.value)} style={s.tInp} /></td>
      <td style={{ padding: "7px 6px" }}><select value={t.prioridad} onChange={e => onUpdate("prioridad", e.target.value)} style={s.sel}>{PRIORIDADES.map(o => <option key={o}>{o}</option>)}</select></td>
      <td style={{ padding: "7px 6px" }}><select value={t.estado} onChange={e => onUpdate("estado", e.target.value)} style={s.sel}>{ESTADOS.map(o => <option key={o}>{o}</option>)}</select></td>
      <td style={{ padding: "7px 6px" }}><input type="date" value={t.fechaLimite} onChange={e => onUpdate("fechaLimite", e.target.value)} style={{ ...s.tInp, minWidth: 110 }} /></td>
      <td style={{ padding: "7px 6px", minWidth: 70 }}>
        {(t.estado === "En Proceso" || t.estado === "Bloqueado")
          ? <input type="number" min={0} max={100} value={t.avance} onChange={e => onUpdate("avance", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} style={{ ...s.tInp, width: 52, textAlign: "center", border: "1px solid #cbd5e1", borderRadius: 4 }} />
          : <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: eff >= 80 ? "#0369a1" : "#64748b" }}>{eff !== null ? `${eff}%` : "N/A"}</span>}
      </td>
      <td style={{ padding: "7px 6px" }}>
        <div onClick={() => setNotesOpen(true)} style={{ cursor: "pointer", fontSize: 12, color: t.notas ? "#0f172a" : "#94a3b8", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notas || "—"}</div>
        {notesOpen && <NotesModal title={t.tarea} value={t.notas || ""} onSave={(v) => { onUpdate("notas", v); setNotesOpen(false); }} onClose={() => setNotesOpen(false)} />}
      </td>
      <td style={{ padding: "7px 6px" }}>
        <FileAttachments archivos={t.archivos||[]} onChange={v => onUpdate("archivos", v)} title={t.tarea} />
      </td>
      <td style={{ padding: "7px 4px" }}><button onClick={onDelete} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button></td>
    </tr>
  );
};

const ResumenView = ({ data, isMobile, onSelectFrente }) => {
  const gs = FRENTES.map(f => ({ ...f, stats: getFrente(f.id, data) }));
  const comp = gs.filter(f => f.stats.estado === "Completado").length;
  const proc = gs.filter(f => f.stats.estado === "En Proceso").length;
  const pend = gs.filter(f => f.stats.estado === "Pendiente").length;
  const bloq = gs.filter(f => f.stats.estado === "Bloqueado").length;
  const avg = gs.reduce((a, f) => a + f.stats.avance, 0) / gs.length;
  const kpis = [{ l:"Frentes", v:gs.length, c:"#0369a1" }, { l:"Listos", v:comp, c:"#0d9488" }, { l:"Proceso", v:proc, c:"#f59e0b" }, { l:"Pend.", v:pend, c:"#94a3b8" }, { l:"Bloq.", v:bloq, c:"#dc2626" }];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: isMobile ? 6 : 10, marginBottom: isMobile ? 12 : 20 }}>
        {kpis.map(k => (<div key={k.l} style={{ background: "#fff", borderRadius: 10, padding: isMobile ? "8px 6px" : "14px 16px", borderLeft: `3px solid ${k.c}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{k.l}</div>
          <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: k.c }}>{k.v}</div>
        </div>))}
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: isMobile ? "10px 12px" : "14px 18px", marginBottom: isMobile ? 12 : 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Avance Global</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0369a1", fontFamily: "'DM Mono', monospace" }}>{Math.round(avg)}%</span>
        </div>
        <ProgressBar value={avg} h={10} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {gs.map(f => (<div key={f.id} role="button" tabIndex={0} onClick={() => onSelectFrente && onSelectFrente(f.id)} {...(!isMobile ? { onMouseEnter: (e) => { e.currentTarget.style.transform = "translateX(2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(3,105,161,0.12)"; e.currentTarget.style.background = "#f0f9ff"; }, onMouseLeave: (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; e.currentTarget.style.background = "#fff"; } } : {})} style={{ background: "#fff", borderRadius: 10, padding: isMobile ? "10px 10px" : "12px 16px", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.15s", WebkitTapHighlightColor: "rgba(3,105,161,0.15)" }}>
          <span style={{ fontSize: isMobile ? 16 : 20, flexShrink: 0 }}>{f.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#0f172a" }}>{f.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{f.stats.completados}/{f.stats.total}</div>
          </div>
          {!isMobile && <Badge type="estado" value={f.stats.estado} />}
          <div style={{ minWidth: isMobile ? 80 : 140 }}><ProgressBar value={f.stats.avance} h={6} /></div>
          <span style={{ fontSize: 14, color: "#cbd5e1", flexShrink: 0 }}>›</span>
        </div>))}
      </div>
    </div>
  );
};

const FrenteView = ({ frenteId, data, setData, isMobile }) => {
  const frente = FRENTES.find(f => f.id === frenteId);
  const tasks = data[frenteId] || [];
  const stats = getFrente(frenteId, data);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const upd = (tid, f, v) => setData(prev => { const nd = { ...prev }; nd[frenteId] = nd[frenteId].map(t => { if (t.id !== tid) return t; const u = { ...t, [f]: v }; if (f === "estado") u.avance = computeAvance(v, t.avance) ?? t.avance; return u; }); return nd; });
  const add = () => { const mx = tasks.length ? Math.max(...tasks.map(t => t.id)) : 0; setData(prev => ({ ...prev, [frenteId]: [...prev[frenteId], { id: mx+1, area: "", tarea: "Nueva tarea", responsable: "", prioridad: "Media", estado: "Pendiente", fechaLimite: "", avance: 0, notas: "", archivos: [] }] })); };
  const del = (id) => setData(prev => ({ ...prev, [frenteId]: prev[frenteId].filter(t => t.id !== id) }));
  const move = (from, to) => { if (from === to || from < 0 || to < 0 || from >= tasks.length || to >= tasks.length) return; setData(prev => { const arr = [...(prev[frenteId] || [])]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return { ...prev, [frenteId]: arr }; }); };
  const kpis = [{ l:"Total", v:stats.total, c:"#0369a1" }, { l:"Listas", v:stats.completados, c:"#0d9488" }, { l:"Proceso", v:stats.enProceso, c:"#f59e0b" }, { l:"Avance", v:`${Math.round(stats.avance)}%`, c:"#0369a1" }];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: isMobile ? 20 : 24 }}>{frente.icon}</span>
        <div><h2 style={{ margin: 0, fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#0f172a" }}>{isMobile ? frente.name : frente.full}</h2><p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Grupo ZEN / Ganadera San Lorenzo, S.A.</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {kpis.map(k => (<div key={k.l} style={{ background: "#fff", borderRadius: 8, padding: "6px 4px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 8, color: "#94a3b8", textTransform: "uppercase" }}>{k.l}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: k.c, fontFamily: "'DM Mono', monospace" }}>{k.v}</div>
        </div>))}
      </div>
      {isMobile ? (
        <div>{tasks.map((t, i) => <TaskCard key={t.id} t={t} i={i} total={tasks.length} onUpdate={(f, v) => upd(t.id, f, v)} onDelete={() => del(t.id)} onMove={move} />)}</div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f1f5f9" }}>
              {["#","Área","Tarea","Responsable","Prior.","Estado","F.Límite","Avance","Notas","📎",""].map(h => (
                <th key={h} style={{ padding: "9px 6px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{tasks.map((t, i) => <TaskRow key={t.id} t={t} i={i} total={tasks.length} onUpdate={(f, v) => upd(t.id, f, v)} onDelete={() => del(t.id)} onMove={move} dragOverIdx={dragOverIdx} setDragOverIdx={setDragOverIdx} />)}</tbody>
          </table>
        </div>
      )}
      <button onClick={add} style={{ marginTop: 10, background: "#fff", color: "#0369a1", border: "1px dashed #93c5fd", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}>+ Agregar tarea</button>
    </div>
  );
};

const BitacoraView = ({ data, setData, isMobile }) => {
  const entries = data.bitacora || [];
  const addE = () => { const mx = entries.length ? Math.max(...entries.map(e => e.id)) : 0; setData(prev => ({ ...prev, bitacora: [...prev.bitacora, { id: mx+1, fecha: new Date().toISOString().split("T")[0], participantes: "", frentes: "", acuerdos: "", compromisos: "", responsable: "", fechaLimite: "", cumplido: false }] })); };
  const upd = (id, f, v) => setData(prev => ({ ...prev, bitacora: prev.bitacora.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const del = (id) => setData(prev => ({ ...prev, bitacora: prev.bitacora.filter(e => e.id !== id) }));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#0f172a" }}>📅 Bitácora</h2>
        <button onClick={addE} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Reunión</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map(e => (<div key={e.id} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? 12 : 18, border: "1px solid #e2e8f0", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <button onClick={() => del(e.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div><label style={s.lbl}>Fecha</label><input type="date" value={e.fecha} onChange={ev => upd(e.id, "fecha", ev.target.value)} style={s.inp} /></div>
            <div><label style={s.lbl}>Participantes</label><input value={e.participantes} onChange={ev => upd(e.id, "participantes", ev.target.value)} style={s.inp} /></div>
            <div><label style={s.lbl}>Frente(s)</label><input value={e.frentes} onChange={ev => upd(e.id, "frentes", ev.target.value)} style={s.inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><label style={s.lbl}>Acuerdos</label><textarea value={e.acuerdos} onChange={ev => upd(e.id, "acuerdos", ev.target.value)} rows={3} style={{ ...s.inp, resize: "vertical" }} /></div>
            <div><label style={s.lbl}>Compromisos</label><textarea value={e.compromisos} onChange={ev => upd(e.id, "compromisos", ev.target.value)} rows={3} style={{ ...s.inp, resize: "vertical" }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <div><label style={s.lbl}>Responsable</label><input value={e.responsable} onChange={ev => upd(e.id, "responsable", ev.target.value)} style={s.inp} /></div>
            <div><label style={s.lbl}>Fecha límite</label><input type="date" value={e.fechaLimite} onChange={ev => upd(e.id, "fechaLimite", ev.target.value)} style={s.inp} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 4 }}>
              <input type="checkbox" checked={e.cumplido} onChange={ev => upd(e.id, "cumplido", ev.target.checked)} style={{ accentColor: "#0369a1", width: 18, height: 18 }} />
              <span style={{ fontSize: 12, color: e.cumplido ? "#0369a1" : "#94a3b8", fontWeight: 600 }}>{e.cumplido ? "Cumplido" : "Pend."}</span>
            </div>
          </div>
        </div>))}
      </div>
    </div>
  );
};

const SeguimientoView = ({ data, setData, isMobile, sub: subProp, setSub: setSubProp }) => {
  const [subInternal, setSubInternal] = useState(FRENTES[0].id);
  const sub = subProp ?? subInternal;
  const setSub = setSubProp ?? setSubInternal;
  const subTabs = [...FRENTES.map(f => ({ id: f.id, icon: f.icon, label: isMobile ? f.short : f.name })), { id: "bitacora", icon: "📅", label: isMobile ? "Bitác." : "Bitácora" }];
  return (
    <div>
      <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #e2e8f0", marginBottom: 16, WebkitOverflowScrolling: "touch" }}>
        {subTabs.map(tab => { const active = sub === tab.id; const stats = tab.id !== "bitacora" ? getFrente(tab.id, data) : null; return (
          <button key={tab.id} onClick={() => setSub(tab.id)} style={{ display: "flex", alignItems: "center", gap: isMobile ? 2 : 6, padding: isMobile ? "8px 8px" : "10px 14px", background: "transparent", border: "none", borderBottom: active ? "2px solid #0369a1" : "2px solid transparent", color: active ? "#0369a1" : "#94a3b8", cursor: "pointer", fontSize: isMobile ? 10 : 12, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontSize: isMobile ? 12 : 14 }}>{tab.icon}</span><span>{tab.label}</span>
            {stats && !isMobile && <span style={{ background: active ? "#e0f2fe" : "#f1f5f9", color: active ? "#0369a1" : "#94a3b8", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 10, fontFamily: "'DM Mono', monospace" }}>{Math.round(stats.avance)}%</span>}
          </button>
        ); })}
      </div>
      {sub === "bitacora" ? <BitacoraView data={data} setData={setData} isMobile={isMobile} /> : <FrenteView frenteId={sub} data={data} setData={setData} isMobile={isMobile} />}
    </div>
  );
};

const MaestroCard = ({ item, idx, updItem, delItem }) => {
  const [open, setOpen] = useState(false);
  const parseNum = (v) => { const n = parseFloat(String(v).replace(/,/g, "")); return isNaN(n) ? 0 : n; };
  const fmtUSD = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCRC = (v) => v.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace", minWidth: 18, paddingTop: 2 }}>{idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{item.concepto || "Sin concepto"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: "#64748b" }}>
            <span>{item.fecha}</span>
            <span>→ {item.destino || "—"}</span>
            {item.factura && <span>📄 {item.factura}</span>}
            {(item.comprobante||[]).length > 0 && <span style={{ color: "#0369a1" }}>📎{item.comprobante.length}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {parseNum(item.usd) !== 0 && <div style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e", fontFamily: "'DM Mono', monospace" }}>${fmtUSD(parseNum(item.usd))}</div>}
          {parseNum(item.crc) !== 0 && <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>₡{fmtCRC(parseNum(item.crc))}</div>}
          <div style={{ fontSize: 14, color: "#94a3b8", transform: open ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▾</div>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <div><label style={s.lbl}>Concepto</label><input value={item.concepto} onChange={e => updItem(item.id, "concepto", e.target.value)} style={s.inp} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={s.lbl}>Fecha</label><input type="date" value={item.fecha} onChange={e => updItem(item.id, "fecha", e.target.value)} style={s.inp} /></div>
              <div><label style={s.lbl}>Destino / Origen</label><input value={item.destino} onChange={e => updItem(item.id, "destino", e.target.value)} style={s.inp} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><label style={s.lbl}>Factura</label><input value={item.factura} onChange={e => updItem(item.id, "factura", e.target.value)} style={s.inp} /></div>
              <div><label style={s.lbl}>USD $</label><input value={item.usd} onChange={e => updItem(item.id, "usd", e.target.value)} style={s.inp} placeholder="0.00" /></div>
              <div><label style={s.lbl}>CRC ₡</label><input value={item.crc} onChange={e => updItem(item.id, "crc", e.target.value)} style={s.inp} placeholder="0.00" /></div>
            </div>
            <div><label style={s.lbl}>Comprobante</label><FileAttachments archivos={item.comprobante||[]} onChange={v => updItem(item.id, "comprobante", v)} title={item.concepto} /></div>
            <button onClick={() => delItem(item.id)} style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar registro</button>
          </div>
        </div>
      )}
    </div>
  );
};

const MaestroTableRow = ({ item, idx, updItem, delItem }) => {
  return (
    <tr style={{ background: idx % 2 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
      <td style={{ padding: "7px 8px" }}><span style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{idx + 1}</span></td>
      <td style={{ padding: "7px 8px", minWidth: 320, maxWidth: 460 }}>
        <AutoTextarea value={item.concepto} onChange={e => updItem(item.id, "concepto", e.target.value)} placeholder="Concepto" style={{ ...s.tInp, fontSize: 13, lineHeight: 1.4, padding: "6px 8px" }} />
      </td>
      <td style={{ padding: "7px 8px" }}><input type="date" value={item.fecha} onChange={e => updItem(item.id, "fecha", e.target.value)} style={{ ...s.tInp, minWidth: 115 }} /></td>
      <td style={{ padding: "7px 8px", minWidth: 180, maxWidth: 280 }}>
        <AutoTextarea value={item.destino} onChange={e => updItem(item.id, "destino", e.target.value)} placeholder="Destino u origen" style={{ ...s.tInp, fontSize: 13, lineHeight: 1.4, padding: "6px 8px" }} />
      </td>
      <td style={{ padding: "7px 8px", minWidth: 100 }}><input value={item.factura} onChange={e => updItem(item.id, "factura", e.target.value)} style={s.tInp} placeholder="N° factura" /></td>
      <td style={{ padding: "7px 8px", minWidth: 100, textAlign: "right" }}><input value={item.usd} onChange={e => updItem(item.id, "usd", e.target.value)} style={{ ...s.tInp, textAlign: "right", fontFamily: "'DM Mono', monospace" }} placeholder="0.00" /></td>
      <td style={{ padding: "7px 8px", minWidth: 110, textAlign: "right" }}><input value={item.crc} onChange={e => updItem(item.id, "crc", e.target.value)} style={{ ...s.tInp, textAlign: "right", fontFamily: "'DM Mono', monospace" }} placeholder="0.00" /></td>
      <td style={{ padding: "7px 8px" }}>
        <FileAttachments archivos={item.comprobante||[]} onChange={v => updItem(item.id, "comprobante", v)} title={item.concepto} />
      </td>
      <td style={{ padding: "7px 4px" }}><button onClick={() => delItem(item.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button></td>
    </tr>
  );
};

const MaestrosView = ({ data, setData, isMobile }) => {
  const [tab, setTab] = useState("zen");
  const [filters, setFilters] = useState({ concepto: "", fecha: "", destino: "", factura: "" });
  const [showFilters, setShowFilters] = useState(false);
  const tabs = [{ id: "zen", label: "ZEN", icon: "🏢" }, { id: "dei", label: "DEI", icon: "🏗️" }, { id: "proyecto", label: "Proyecto", icon: "📐" }];
  const items = data.maestros?.[tab] || [];

  const addItem = () => {
    const mx = items.length ? Math.max(...items.map(i => i.id)) : 0;
    setData(prev => ({ ...prev, maestros: { ...prev.maestros, [tab]: [...(prev.maestros?.[tab] || []), { id: mx + 1, concepto: "", fecha: new Date().toISOString().split("T")[0], destino: "", factura: "", usd: "", crc: "", comprobante: [] }] } }));
  };
  const updItem = (id, f, v) => setData(prev => ({ ...prev, maestros: { ...prev.maestros, [tab]: (prev.maestros?.[tab] || []).map(i => i.id === id ? { ...i, [f]: v } : i) } }));
  const delItem = (id) => setData(prev => ({ ...prev, maestros: { ...prev.maestros, [tab]: (prev.maestros?.[tab] || []).filter(i => i.id !== id) } }));

  const filtered = items.filter(i => {
    if (filters.concepto && !i.concepto?.toLowerCase().includes(filters.concepto.toLowerCase())) return false;
    if (filters.fecha && i.fecha !== filters.fecha) return false;
    if (filters.destino && !i.destino?.toLowerCase().includes(filters.destino.toLowerCase())) return false;
    if (filters.factura && !i.factura?.toLowerCase().includes(filters.factura.toLowerCase())) return false;
    return true;
  });

  const parseNum = (v) => { const n = parseFloat(String(v).replace(/,/g, "")); return isNaN(n) ? 0 : n; };
  const totalUSD = filtered.reduce((a, i) => a + parseNum(i.usd), 0);
  const totalCRC = filtered.reduce((a, i) => a + parseNum(i.crc), 0);
  const fmtUSD = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCRC = (v) => v.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const clearFilters = () => setFilters({ concepto: "", fecha: "", destino: "", factura: "" });
  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}>
        {tabs.map(t => (<button key={t.id} onClick={() => { setTab(t.id); clearFilters(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "8px 14px" : "10px 20px", background: "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #0369a1" : "2px solid transparent", color: tab === t.id ? "#0369a1" : "#94a3b8", cursor: "pointer", fontSize: isMobile ? 12 : 14, fontWeight: tab === t.id ? 700 : 500 }}>
          <span>{t.icon}</span><span>{t.label}</span>
          {(data.maestros?.[t.id]||[]).length > 0 && <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 10, fontFamily: "'DM Mono', monospace" }}>{(data.maestros?.[t.id]||[]).length}</span>}
        </button>))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#0f172a" }}>Maestro — {tabs.find(t => t.id === tab)?.label}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ background: hasFilters ? "#e0f2fe" : "#f8fafc", color: hasFilters ? "#0369a1" : "#64748b", border: `1px solid ${hasFilters ? "#93c5fd" : "#e2e8f0"}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            🔍 Filtros {hasFilters && "●"}
          </button>
          <button onClick={addItem} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Registro</button>
        </div>
      </div>

      {showFilters && (
        <div style={{ background: "#fff", borderRadius: 10, padding: isMobile ? 10 : 14, border: "1px solid #e2e8f0", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <div><label style={s.lbl}>Concepto</label><input value={filters.concepto} onChange={e => setFilters(p => ({ ...p, concepto: e.target.value }))} style={s.inp} placeholder="Buscar..." /></div>
            <div><label style={s.lbl}>Fecha</label><input type="date" value={filters.fecha} onChange={e => setFilters(p => ({ ...p, fecha: e.target.value }))} style={s.inp} /></div>
            <div><label style={s.lbl}>Destino / Origen</label><input value={filters.destino} onChange={e => setFilters(p => ({ ...p, destino: e.target.value }))} style={s.inp} placeholder="Buscar..." /></div>
            <div><label style={s.lbl}>Factura</label><input value={filters.factura} onChange={e => setFilters(p => ({ ...p, factura: e.target.value }))} style={s.inp} placeholder="Buscar..." /></div>
            {hasFilters && <button onClick={clearFilters} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>✕ Limpiar</button>}
          </div>
          {hasFilters && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Mostrando {filtered.length} de {items.length} registros</div>}
        </div>
      )}

      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No hay registros{hasFilters ? " con estos filtros" : ""}. {!hasFilters && "Agrega el primero."}</div>}

      {filtered.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: isMobile ? 700 : "auto" }}>
            <thead><tr style={{ background: "#f1f5f9" }}>
              {["#", "Concepto", "Fecha", "Destino / Origen", "Factura", "USD $", "CRC ₡", "📎", ""].map(h => (
                <th key={h} style={{ padding: "9px 8px", textAlign: h === "USD $" || h === "CRC ₡" ? "right" : "left", color: "#64748b", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap", position: "sticky", top: 0, background: "#f1f5f9" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((item, idx) => <MaestroTableRow key={item.id} item={item} idx={idx} updItem={updItem} delItem={delItem} />)}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f9ff", borderTop: "2px solid #0369a1" }}>
                <td colSpan={5} style={{ padding: "10px 8px", fontWeight: 800, fontSize: 13, color: "#0c4a6e", textAlign: "right" }}>SALDO</td>
                <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 13, color: "#0c4a6e", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>${fmtUSD(totalUSD)}</td>
                <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 13, color: "#0c4a6e", textAlign: "right", fontFamily: "'DM Mono', monospace" }}>₡{fmtCRC(totalCRC)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button onClick={addItem} style={{ marginTop: 10, background: "#fff", color: "#0369a1", border: "1px dashed #93c5fd", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}>+ Agregar registro</button>
    </div>
  );
};

const BODEGA_ESTADOS = ["Disponible", "En Negociación", "Contrato Firmado", "Ocupada"];
const BE_COLORS = { "Disponible": "#94a3b8", "En Negociación": "#f59e0b", "Contrato Firmado": "#0369a1", "Ocupada": "#0d9488" };

const SiteMap = ({ clientes, selected, onSelect, isMobile }) => {
  const w = isMobile ? 320 : 500;
  const h = isMobile ? 580 : 900;
  const getColor = (id) => {
    const c = clientes[id];
    return BE_COLORS[c?.estado] || "#e2e8f0";
  };
  const getFill = (id) => {
    const c = clientes[id];
    return c?.estado === "Disponible" ? "rgba(148,163,184,0.15)" : c?.estado === "En Negociación" ? "rgba(245,158,11,0.15)" : c?.estado === "Contrato Firmado" ? "rgba(3,105,161,0.15)" : "rgba(13,148,136,0.15)";
  };

  return (
    <svg viewBox="0 0 500 900" width={w} height={h} style={{ display: "block", margin: "0 auto" }}>
      {/* Background terrain */}
      <rect x="0" y="0" width="500" height="900" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

      {/* Property boundary */}
      <polygon points="120,30 420,30 450,50 460,200 470,350 470,500 460,600 450,700 430,780 350,850 200,870 140,850 100,800 80,700 70,600 70,450 80,300 90,200 100,100" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,3" />

      {/* Rio Alajuela */}
      <path d="M60,280 Q120,300 180,310 Q250,320 320,300 Q400,280 470,290" fill="none" stroke="#7dd3fc" strokeWidth="3" opacity="0.6" />
      <text x="250" y="295" textAnchor="middle" fontSize="8" fill="#0284c7" fontWeight="600">RÍO ALAJUELA</text>

      {/* Laguna 1 */}
      <ellipse cx="350" cy="260" rx="35" ry="15" fill="#bae6fd" opacity="0.4" stroke="#7dd3fc" strokeWidth="1" />
      <text x="350" y="263" textAnchor="middle" fontSize="7" fill="#0284c7">LAGUNA</text>

      {/* Laguna 2 */}
      <ellipse cx="220" cy="330" rx="40" ry="12" fill="#bae6fd" opacity="0.4" stroke="#7dd3fc" strokeWidth="1" />
      <text x="220" y="333" textAnchor="middle" fontSize="7" fill="#0284c7">LAGUNA</text>

      {/* PTAR */}
      <rect x="95" y="300" width="40" height="25" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <text x="115" y="316" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">PTAR</text>

      {/* Trees along river */}
      {[150,180,210,240,270,300,330,360,390].map((x,i) => <circle key={`t${i}`} cx={x} cy={310 + Math.sin(i)*8} r="6" fill="#86efac" opacity="0.5" />)}

      {/* Parqueo indicators */}
      <rect x="140" y="240" width="50" height="14" rx="3" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
      <text x="165" y="250" textAnchor="middle" fontSize="6" fill="#94a3b8">41 Parqueos</text>
      <rect x="140" y="350" width="50" height="14" rx="3" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
      <text x="165" y="360" textAnchor="middle" fontSize="6" fill="#94a3b8">40 Parqueos</text>

      {/* ── BODEGA C (top) ── */}
      <g onClick={() => onSelect("bodegaC")} style={{ cursor: "pointer" }}>
        <rect x="150" y="60" width="280" height="170" rx="6" fill={getFill("bodegaC")} stroke={selected === "bodegaC" ? "#0369a1" : getColor("bodegaC")} strokeWidth={selected === "bodegaC" ? 3 : 1.5} />
        {/* Dock lines */}
        {Array.from({length:16}).map((_,i) => <line key={`d${i}`} x1="150" y1={70 + i*10} x2="145" y2={70 + i*10} stroke="#cbd5e1" strokeWidth="1" />)}
        <text x="290" y="130" textAnchor="middle" fontSize="18" fontWeight="800" fill={getColor("bodegaC")}>BODEGA C</text>
        <text x="290" y="150" textAnchor="middle" fontSize="10" fill="#64748b">7,123 m²</text>
        {clientes.bodegaC?.cliente && <text x="290" y="168" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{clientes.bodegaC.cliente}</text>}
        {/* Mezzanine */}
        <rect x="155" y="195" width="60" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5" />
        <text x="185" y="211" textAnchor="middle" fontSize="7" fill="#92400e">Mezzanine 200m²</text>
      </g>

      {/* ── BODEGA B (center) ── */}
      <g onClick={() => onSelect("bodegaB")} style={{ cursor: "pointer" }}>
        <rect x="130" y="400" width="310" height="260" rx="6" fill={getFill("bodegaB")} stroke={selected === "bodegaB" ? "#0369a1" : getColor("bodegaB")} strokeWidth={selected === "bodegaB" ? 3 : 1.5} />
        <text x="285" y="520" textAnchor="middle" fontSize="22" fontWeight="800" fill={getColor("bodegaB")}>BODEGA B</text>
        <text x="285" y="545" textAnchor="middle" fontSize="12" fill="#64748b">15,163 m²</text>
        {clientes.bodegaB?.cliente && <text x="285" y="565" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">{clientes.bodegaB.cliente}</text>}
        {/* Dimensions */}
        <text x="285" y="415" textAnchor="middle" fontSize="8" fill="#94a3b8">102.99 m</text>
        <text x="445" y="530" textAnchor="middle" fontSize="8" fill="#94a3b8" transform="rotate(90,445,530)">145 m</text>
      </g>

      {/* ── BODEGA A (bottom) ── */}
      <g onClick={() => onSelect("bodegaA")} style={{ cursor: "pointer" }}>
        <rect x="250" y="730" width="160" height="100" rx="6" fill={getFill("bodegaA")} stroke={selected === "bodegaA" ? "#0369a1" : getColor("bodegaA")} strokeWidth={selected === "bodegaA" ? 3 : 1.5} />
        <text x="330" y="775" textAnchor="middle" fontSize="16" fontWeight="800" fill={getColor("bodegaA")}>BODEGA A</text>
        <text x="330" y="795" textAnchor="middle" fontSize="10" fill="#64748b">4,063 m²</text>
        {clientes.bodegaA?.cliente && <text x="330" y="812" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{clientes.bodegaA.cliente}</text>}
        <text x="330" y="743" textAnchor="middle" fontSize="8" fill="#94a3b8">79 m</text>
        <text x="415" y="780" textAnchor="middle" fontSize="8" fill="#94a3b8" transform="rotate(90,415,780)">50 m</text>
      </g>

      {/* Parqueos bottom */}
      <rect x="150" y="730" width="80" height="55" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.5" />
      <text x="190" y="762" textAnchor="middle" fontSize="7" fill="#94a3b8">36 Parqueos</text>

      {/* North arrow */}
      <g transform="translate(440,50)">
        <circle r="16" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
        <polygon points="0,-12 4,-2 -4,-2" fill="#0f172a" />
        <text x="0" y="8" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">N</text>
      </g>

      {/* Legend */}
      <g transform="translate(20,860)">
        {Object.entries(BE_COLORS).map(([label, color], i) => (
          <g key={label} transform={`translate(${i * 115}, 0)`}>
            <rect width="10" height="10" rx="2" fill={color} />
            <text x="14" y="9" fontSize="8" fill="#64748b">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
};

const BodegaDetail = ({ id, data, setData, isMobile }) => {
  const labels = { bodegaA: "Bodega A", bodegaB: "Bodega B", bodegaC: "Bodega C" };
  const c = data.clientes?.[id];
  if (!c) return null;
  const upd = (f, v) => setData(prev => ({ ...prev, clientes: { ...prev.clientes, [id]: { ...prev.clientes[id], [f]: v } } }));

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: isMobile ? 14 : 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0c4a6e" }}>🏭 {labels[id]}</h3>
        <span style={{ background: BE_COLORS[c.estado], color: "#fff", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{c.estado}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div><label style={s.lbl}>Área</label><div style={{ ...s.inp, background: "#f1f5f9", color: "#64748b" }}>{c.area}</div></div>
        <div><label style={s.lbl}>Estado</label><select value={c.estado} onChange={e => upd("estado", e.target.value)} style={s.inp}>{BODEGA_ESTADOS.map(o => <option key={o}>{o}</option>)}</select></div>
        <div><label style={s.lbl}>Cliente</label><input value={c.cliente} onChange={e => upd("cliente", e.target.value)} style={s.inp} placeholder="Nombre del cliente" /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div><label style={s.lbl}>Contacto</label><input value={c.contacto} onChange={e => upd("contacto", e.target.value)} style={s.inp} placeholder="Nombre de contacto" /></div>
        <div><label style={s.lbl}>Teléfono</label><input value={c.telefono} onChange={e => upd("telefono", e.target.value)} style={s.inp} placeholder="+506 ..." /></div>
        <div><label style={s.lbl}>Email</label><input value={c.email} onChange={e => upd("email", e.target.value)} style={s.inp} placeholder="email@empresa.com" /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div><label style={s.lbl}>Renta mensual</label><input value={c.renta} onChange={e => upd("renta", e.target.value)} style={s.inp} placeholder="$0.00" /></div>
        <div><label style={s.lbl}>Plazo contrato</label><input value={c.plazo} onChange={e => upd("plazo", e.target.value)} style={s.inp} placeholder="Ej: 5 años" /></div>
        {!isMobile && <div><label style={s.lbl}>Inicio contrato</label><input type="date" value={c.inicioContrato} onChange={e => upd("inicioContrato", e.target.value)} style={s.inp} /></div>}
      </div>
      {isMobile && <div style={{ marginBottom: 12 }}><label style={s.lbl}>Inicio contrato</label><input type="date" value={c.inicioContrato} onChange={e => upd("inicioContrato", e.target.value)} style={s.inp} /></div>}

      <div style={{ marginBottom: 12 }}><label style={s.lbl}>Notas</label><textarea value={c.notas} onChange={e => upd("notas", e.target.value)} rows={3} style={{ ...s.inp, resize: "vertical" }} /></div>

      <div><label style={s.lbl}>Documentos del cliente</label><FileAttachments archivos={c.archivos||[]} onChange={v => upd("archivos", v)} title={c.cliente || c.empresa || c.nombre || ""} /></div>
    </div>
  );
};

const ClientesView = ({ data, setData, isMobile }) => {
  const [selected, setSelected] = useState("bodegaC");
  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#0c4a6e" }}>Mapa del Proyecto — Asignación de Clientes</h2>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: "#94a3b8" }}>Toca una bodega en el mapa para ver y editar los datos del cliente</p>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 24, alignItems: "flex-start" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: isMobile ? 8 : 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexShrink: 0 }}>
          <SiteMap clientes={data.clientes || {}} selected={selected} onSelect={setSelected} isMobile={isMobile} />
        </div>
        <div style={{ flex: 1, width: "100%", minWidth: 0 }}>
          <BodegaDetail id={selected} data={data} setData={setData} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
};

export { initialData };
export default function Tracker({ data, setData, user, onLogout }) {
  const isMobile = useIsMobile();
  const importRef = useRef();
  const [section, setSection] = useState("resumen");
  const [seguimientoSub, setSeguimientoSub] = useState(FRENTES[0].id);
  const [toast, setToast] = useState("");
  const goToFrente = (id) => { setSeguimientoSub(id); setSection("seguimiento"); };
  const resetData = () => { if (confirm("¿Restablecer datos originales? Esto sobrescribe lo guardado en la nube.")) setData(initialData()); };

  const exportData = () => {
    const clean = JSON.parse(JSON.stringify(data));
    const strip = (obj) => { if (Array.isArray(obj)) return obj.map(strip); if (obj && typeof obj === "object") { const n = {}; for (const [k,v] of Object.entries(obj)) { if (k === "archivos" || k === "comprobante") { n[k] = (v||[]).map(f => ({ name: f.name, size: f.size, type: f.type, ts: f.ts, url: f.url, path: f.path })); } else { n[k] = strip(v); } } return n; } return obj; };
    const exported = strip(clean);
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bodegas-coyol-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    setToast("✅ Datos exportados"); setTimeout(() => setToast(""), 2500);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.financiero && parsed.maestros && parsed.clientes) {
          setData(parsed);
          setToast("✅ Datos cargados correctamente"); setTimeout(() => setToast(""), 2500);
        } else { setToast("❌ Archivo no válido"); setTimeout(() => setToast(""), 3000); }
      } catch { setToast("❌ Error al leer el archivo"); setTimeout(() => setToast(""), 3000); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const navItems = [{ id: "resumen", icon: "🏠", label: "Resumen" }, { id: "seguimiento", icon: "📊", label: "Seguimiento" }, { id: "maestros", icon: "📁", label: "Maestros" }, { id: "clientes", icon: "🏭", label: "Clientes" }];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f1f5f9", color: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; background: #f1f5f9; }
        ::-webkit-scrollbar { width: 5px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        input, select, textarea { font-family: inherit; }
      `}</style>

      {!isMobile && (
        <aside style={{ width: 210, background: "#fff", borderRight: "1px solid #e2e8f0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0c4a6e", fontFamily: "'Outfit', sans-serif" }}>BODEGAS COYOL</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Tablero de Seguimiento</div>
          </div>
          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {navItems.map(item => (<button key={item.id} onClick={() => setSection(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", background: section === item.id ? "#e0f2fe" : "transparent", border: "none", borderRadius: 10, color: section === item.id ? "#0369a1" : "#64748b", cursor: "pointer", fontSize: 14, fontWeight: section === item.id ? 700 : 500, textAlign: "left", marginBottom: 4, borderLeft: section === item.id ? "3px solid #0369a1" : "3px solid transparent" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span><span>{item.label}</span>
            </button>))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={exportData} style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 6, padding: "8px 12px", fontSize: 11, cursor: "pointer", width: "100%", fontWeight: 600 }}>⬇ Exportar datos</button>
            <button onClick={() => importRef.current?.click()} style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, padding: "8px 12px", fontSize: 11, cursor: "pointer", width: "100%", fontWeight: 600 }}>⬆ Importar datos</button>
            <button onClick={resetData} style={{ background: "#f8fafc", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 11, cursor: "pointer", width: "100%", fontWeight: 600 }}>Restablecer datos</button>
            {user && (<div style={{ marginTop: 6, paddingTop: 8, borderTop: "1px dashed #e2e8f0", fontSize: 10, color: "#64748b" }}>
              <div style={{ marginBottom: 6, wordBreak: "break-all" }}>👤 {user.email}</div>
              <button onClick={onLogout} style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 10, cursor: "pointer", width: "100%", fontWeight: 600 }}>Cerrar sesión</button>
            </div>)}
          </div>
        </aside>
      )}

      <main style={{ flex: 1, overflow: "auto", paddingBottom: isMobile ? 68 : 0 }}>
        <header style={{ padding: isMobile ? "10px 14px" : "14px 28px", borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 13, fontWeight: 800, color: "#0c4a6e", fontFamily: "'Outfit', sans-serif" }}>BODEGAS COYOL</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{navItems.find(n=>n.id===section)?.label}</div></div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={exportData} style={{ background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>⬇</button>
                <button onClick={() => importRef.current?.click()} style={{ background: "#f0fdf4", color: "#15803d", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>⬆</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h1 style={{ fontSize: 16, fontWeight: 800, color: "#0c4a6e", fontFamily: "'Outfit', sans-serif", margin: 0 }}>{navItems.find(n=>n.id===section)?.icon} {navItems.find(n=>n.id===section)?.label}</h1><p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Proyecto Bodegas Coyol · Grupo ZEN · Ganadera San Lorenzo, S.A.</p></div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{new Date().toLocaleDateString("es-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          )}
        </header>
        <div style={{ padding: isMobile ? "12px 10px" : "24px 28px", maxWidth: 1400 }}>
          {section === "resumen" && <ResumenView data={data} isMobile={isMobile} onSelectFrente={goToFrente} />}
          {section === "seguimiento" && <SeguimientoView data={data} setData={setData} isMobile={isMobile} sub={seguimientoSub} setSub={setSeguimientoSub} />}
          {section === "maestros" && <MaestrosView data={data} setData={setData} isMobile={isMobile} />}
          {section === "clientes" && <ClientesView data={data} setData={setData} isMobile={isMobile} />}
        </div>
      </main>

      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
          {navItems.map(item => (<button key={item.id} onClick={() => setSection(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0 8px", background: "transparent", border: "none", color: section === item.id ? "#0369a1" : "#94a3b8", cursor: "pointer", fontSize: 10, fontWeight: section === item.id ? 700 : 500 }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span><span>{item.label}</span>
          </button>))}
        </nav>
      )}

      <input ref={importRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />

      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#0f172a", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 600, zIndex: 200, border: "1px solid #e2e8f0" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
