import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import Login from "./Login.jsx";
import Tracker, { initialData } from "./Tracker.jsx";

const DOC_REF = doc(db, "appData", "main");

const Splash = ({ msg }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 13 }}>
    {msg}
  </div>
);

export default function App() {
  const [user, setUser] = useState(undefined);
  const [data, setDataLocal] = useState(null);
  const [loadError, setLoadError] = useState("");
  const writeTimer = useRef(null);
  const skipNextWrite = useRef(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  useEffect(() => {
    if (!user) { setDataLocal(null); return; }
    let unsub;
    (async () => {
      try {
        const snap = await getDoc(DOC_REF);
        if (!snap.exists()) {
          const seed = initialData();
          await setDoc(DOC_REF, { data: seed, updatedAt: serverTimestamp(), updatedBy: user.email || user.uid });
        }
        unsub = onSnapshot(DOC_REF, (s) => {
          const d = s.data();
          if (d?.data) {
            skipNextWrite.current = true;
            setDataLocal(d.data);
          }
        }, (err) => setLoadError("Error leyendo datos: " + err.message));
      } catch (err) {
        setLoadError("No se pudo cargar la base de datos: " + err.message);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [user]);

  const setData = (updater) => {
    setDataLocal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        setDoc(DOC_REF, { data: next, updatedAt: serverTimestamp(), updatedBy: user?.email || user?.uid || "anon" })
          .catch((err) => console.error("Error guardando:", err));
      }, 600);
      return next;
    });
  };

  if (user === undefined) return <Splash msg="Cargando…" />;
  if (!user) return <Login />;
  if (loadError) return <Splash msg={loadError} />;
  if (!data) return <Splash msg="Cargando datos del proyecto…" />;

  return <Tracker data={data} setData={setData} user={user} onLogout={() => signOut(auth)} />;
}
