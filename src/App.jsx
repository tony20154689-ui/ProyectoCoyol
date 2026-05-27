import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import Login from "./Login.jsx";
import Tracker, { initialData } from "./Tracker.jsx";

const DOC_REF = doc(db, "appData", "main");
const DEBOUNCE_MS = 250;

// One-time DEI Maestros bootstrap (auto-applies once, then flagged)
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
  const [data, setDataLocal] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");

  const dataRef = useRef(null);
  const writeTimer = useRef(null);
  const writingRef = useRef(false);
  const queuedSnapshotRef = useRef(null);
  const savedToastTimer = useRef(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  useEffect(() => {
    if (!user) { setDataLocal(null); dataRef.current = null; return; }
    let seeded = false;
    const unsub = onSnapshot(DOC_REF, async (s) => {
      if (!s.exists()) {
        if (seeded) return;
        seeded = true;
        try {
          const seed = initialData();
          await setDoc(DOC_REF, { data: seed, updatedAt: serverTimestamp(), updatedBy: user.email || user.uid });
        } catch (err) { setLoadError("No se pudo inicializar la base de datos: " + err.message); }
        return; // next snapshot delivers the seeded data
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
  }, [user]);

  const flushWrite = async () => {
    if (!dataRef.current || !user) return;
    writingRef.current = true;
    setSyncStatus("saving");
    try {
      await setDoc(DOC_REF, {
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

  // Flush pending write on tab close / navigation
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

  // One-time DEI bootstrap: runs once when data loads and flag not set
  const bootstrapRanRef = useRef(false);
  useEffect(() => {
    if (!data || !user || bootstrapRanRef.current) return;
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
  }, [data, user]);

  if (user === undefined) return <Splash msg="Cargando…" />;
  if (!user) return <Login />;
  if (loadError) return <Splash msg={loadError} />;
  if (!data) return <Splash msg="Cargando datos del proyecto…" />;

  return (
    <>
      <Tracker data={data} setData={setData} user={user} onLogout={() => signOut(auth)} />
      <SyncIndicator status={syncStatus} />
    </>
  );
}
