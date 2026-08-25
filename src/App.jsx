import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import Login from "./Login.jsx";
import Tracker, { initialData, initialDataBlank } from "./Tracker.jsx";
import ProjectSelector, { PROJECTS } from "./ProjectSelector.jsx";

const DEBOUNCE_MS = 250;
const PROJECT_STORAGE_KEY = "activeProjectId";

// One-time DEI Maestros bootstrap (Coyol only, auto-applies once)
const DEI_BOOTSTRAP_ITEMS = [
  { concepto: "Adelanto Estudio Vial", fecha: "2024-04-01", destino: "Consultores Viales S.A.", factura: "Factura 1686", usd: "1130", crc: "" },
  { concepto: "Adelanto 75% Renders Proyecto", fecha: "2024-07-31", destino: "GCG Estudio AD S.A.", factura: "Factura 178", usd: "1483.13", crc: "" },
  { concepto: "Cancelación Renders Proyecto", fecha: "2024-08-14", destino: "GCG Estudio AD S.A.", factura: "Factura 179", usd: "494.38", crc: "" },
  { concepto: "Adelanto Reunión Fincas", fecha: "2024-09-02", destino: "Jesús Barquero Bolaños", factura: "Factura 278", usd: "1186.50", crc: "" },
  { concepto: "Topografía Terreno", fecha: "2024-10-10", destino: "Jesús Barquero Bolaños", factura: "Factura 292", usd: "4520", crc: "" },
  { concepto: "Adelanto 60% Prueba Bombeo, estudio y Viabilidad pozo", fecha: "2025-01-27", destino: "Hidros del Norte S.A.", factura: "Factura 564", usd: "2644.20", crc: "1322100" },
  { concepto: "Adelanto Viabilidad y Desfogue", fecha: "2025-03-12", destino: "Ismael Humberto Calderón Delgado", factura: "Factura 388", usd: "3000", crc: "" },
  { concepto: "Avance Estudio Vial", fecha: "2025-03-14", destino: "Consultores Viales S.A.", factura: "Factura 1902", usd: "904", crc: "" },
  { concepto: "Avance 2 Viabilidad y Desfogue", fecha: "2025-04-24", destino: "Ismael Humberto Calderón Delgado", factura: "Factura 296", usd: "5000", crc: "" },
  { concepto: "Adelanto Planos ARQ", fecha: "2025-05-05", destino: "GCG Estudio AD S.A.", factura: "Recibo 107", usd: "4000", crc: "" },
  { concepto: "Avance Estudio Vial", fecha: "2025-06-11", destino: "Consultores Viales S.A.", factura: "Factura 1971", usd: "3333.50", crc: "" },
  { concepto: "Saldo 40% Prueba Bombeo, estudio y Viabilidad pozo", fecha: "2025-06-13", destino: "Hidros del Norte S.A.", factura: "Factura 631", usd: "1762.80", crc: "881400" },
  { concepto: "Adelanto Planos MT y Infra", fecha: "2025-06-16", destino: "Extrapopescu", factura: "Recibo", usd: "14782", crc: "" },
  { concepto: "Avance 3 Viabilidad y Desfogue", fecha: "2025-06-18", destino: "Ismael Humberto Calderón Delgado", factura: "Factura 405", usd: "3000", crc: "" },
];
const DEI_BOOTSTRAP_FLAG = "deiBootstrap_v1";

const Splash = ({ msg }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 13 }}>
    {msg}
  </div>
);

const SyncIndicator = ({ status }) => {
  if (status === "idle") return null;
  const map = {
    pending: { color: "#f59e0b", bg: "#fef3c7", border: "#fde68a", text: "● Cambios sin guardar…" },
    saving:  { color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", text: "↻ Guardando en la nube…" },
    saved:   { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", text: "✓ Guardado" },
    error:   { color: "#991b1b", bg: "#fee2e2", border: "#fecaca", text: "⚠ Error al guardar" },
  };
  const m = map[status] || map.idle;
  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 250, background: m.bg, color: m.color, border: `1px solid ${m.border}`, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      {m.text}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(undefined);
  const [project, setProject] = useState(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(PROJECT_STORAGE_KEY) : null;
    return saved ? PROJECTS.find(p => p.id === saved) || null : null;
  });
  const [data, setDataLocal] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");

  const dataRef = useRef(null);
  const writeTimer = useRef(null);
  const writingRef = useRef(false);
  const queuedSnapshotRef = useRef(null);
  const savedToastTimer = useRef(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  const selectProject = (p) => {
    setProject(p);
    try { localStorage.setItem(PROJECT_STORAGE_KEY, p.id); } catch {}
  };
  const switchProject = () => {
    try { localStorage.removeItem(PROJECT_STORAGE_KEY); } catch {}
    setProject(null);
    setDataLocal(null);
    dataRef.current = null;
  };

  useEffect(() => {
    if (!user || !project) { setDataLocal(null); dataRef.current = null; return; }
    const docRef = doc(db, "appData", project.docId);
    let seeded = false;
    const unsub = onSnapshot(docRef, async (s) => {
      if (!s.exists()) {
        if (seeded) return;
        seeded = true;
        try {
          const seed = project.id === "saro" ? initialDataBlank() : initialData();
          await setDoc(docRef, { data: seed, updatedAt: serverTimestamp(), updatedBy: user.email || user.uid });
        } catch (err) { setLoadError("No se pudo inicializar la base de datos: " + err.message); }
        return;
      }
      const d = s.data();
      if (!d?.data) return;
      if (writingRef.current) {
        queuedSnapshotRef.current = d.data;
      } else {
        dataRef.current = d.data;
        setDataLocal(d.data);
      }
    }, (err) => setLoadError("Error leyendo datos: " + err.message));
    return () => unsub();
  }, [user, project]);

  const flushWrite = async () => {
    if (!dataRef.current || !user || !project) return;
    writingRef.current = true;
    setSyncStatus("saving");
    try {
      await setDoc(doc(db, "appData", project.docId), {
        data: dataRef.current,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || user.uid,
      });
      setSyncStatus("saved");
      if (savedToastTimer.current) clearTimeout(savedToastTimer.current);
      savedToastTimer.current = setTimeout(() => setSyncStatus("idle"), 1500);
    } catch (err) {
      console.error("Error guardando:", err);
      setSyncStatus("error");
    } finally {
      writingRef.current = false;
      if (queuedSnapshotRef.current) {
        const queued = queuedSnapshotRef.current;
        queuedSnapshotRef.current = null;
        dataRef.current = queued;
        setDataLocal(queued);
      }
    }
  };

  const setData = (updater) => {
    setDataLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      dataRef.current = next;
      setSyncStatus("pending");
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(flushWrite, DEBOUNCE_MS);
      return next;
    });
  };

  useEffect(() => {
    const handler = () => {
      if (writeTimer.current) {
        clearTimeout(writeTimer.current);
        flushWrite();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  });

  // SARO one-time migration: if clientes still uses Coyol's bodegaA/B/C schema, replace with D1-D6 grid
  const saroMigrationRanRef = useRef(false);
  useEffect(() => {
    if (!data || !user || !project || project.id !== "saro" || saroMigrationRanRef.current) return;
    const hasD1 = data.clientes?.bodegaD1 !== undefined;
    if (hasD1) return;
    saroMigrationRanRef.current = true;
    setData(prev => {
      const blank = initialDataBlank();
      return { ...prev, clientes: blank.clientes };
    });
  }, [data, user, project]);

  // One-time DEI bootstrap: Coyol only
  const bootstrapRanRef = useRef(false);
  useEffect(() => {
    if (!data || !user || !project || project.id !== "coyol" || bootstrapRanRef.current) return;
    if (data._migrations?.[DEI_BOOTSTRAP_FLAG]) return;
    bootstrapRanRef.current = true;
    setData(prev => {
      const existing = prev.maestros?.dei || [];
      const maxId = existing.length ? Math.max(...existing.map(i => i.id || 0)) : 0;
      const newItems = DEI_BOOTSTRAP_ITEMS.map((it, i) => ({ ...it, id: maxId + 1 + i, comprobante: [] }));
      return {
        ...prev,
        maestros: { ...(prev.maestros || {}), dei: [...existing, ...newItems] },
        _migrations: { ...(prev._migrations || {}), [DEI_BOOTSTRAP_FLAG]: new Date().toISOString() },
      };
    });
  }, [data, user, project]);

  if (user === undefined) return <Splash msg="Cargando…" />;
  if (!user) return <Login />;
  if (!project) return <ProjectSelector user={user} onSelect={selectProject} />;
  if (loadError) return <Splash msg={loadError} />;
  if (!data) return <Splash msg={`Cargando datos de ${project.short}…`} />;

  return (
    <>
      <Tracker
        data={data}
        setData={setData}
        user={user}
        onLogout={() => signOut(auth)}
        project={project}
        onSwitchProject={switchProject}
      />
      <SyncIndicator status={syncStatus} />
    </>
  );
}
