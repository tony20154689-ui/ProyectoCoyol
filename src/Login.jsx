import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (ex) {
      const code = ex?.code || "";
      if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
        setErr("Correo o contraseña incorrectos.");
      } else if (code.includes("too-many-requests")) {
        setErr("Demasiados intentos. Esperá unos minutos.");
      } else {
        setErr("No se pudo iniciar sesión: " + (ex?.message || code));
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0c4a6e", fontFamily: "'Outfit', sans-serif" }}>BODEGAS COYOL</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 22 }}>Tablero de Seguimiento · Iniciar sesión</div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Correo</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginTop: 4, marginBottom: 14, fontSize: 14 }} />
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Contraseña</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, marginTop: 4, marginBottom: 14, fontSize: 14 }} />
        {err && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 14px", background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Ingresando…" : "Ingresar"}</button>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 14, textAlign: "center" }}>Los usuarios se administran desde Firebase Console.</div>
      </form>
    </div>
  );
}
