import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import Login from "./Login.jsx";
import Tracker, { initialData } from "./Tracker.jsx";

const DOC_REF = doc(db, "appData", "main");
const DEBOUNCE_MS = 250;

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
