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
      } else if (code.includes("invalid-email")) {
        setErr("El correo no tiene un formato válido.");
      } else {
        setErr("No se pudo iniciar sesión: " + (ex?.message || code));
      }
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    marginTop: 6,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    background: "#fff",
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #f59e0b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        input:focus { border-color: #0369a1 !important; box-shadow: 0 0 0 3px rgba(3,105,161,0.12) !important; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Decorative shapes */}
      <div style={{ position: "absolute", top: -120, right: -120, width: 380, height: 380, borderRadius: "50%", background: "rgba(245,158,11,0.18)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 320, height: 320, borderRadius: "50%", background: "rgba(56,189,248,0.25)", filter: "blur(40px)" }} />

      <div style={{
        background: "rgba(255,255,255,0.98)",
        borderRadius: 20,
        padding: 0,
        width: "100%",
        maxWidth: 880,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5) inset",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        animation: "fadeIn 0.5s ease-out",
      }}>
        {/* Left panel: brand */}
        <div style={{
          background: "linear-gradient(160deg, #0c4a6e 0%, #075985 100%)",
          color: "#fff",
          padding: "44px 38px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 480,
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, borderRadius: "50%", background: "rgba(245,158,11,0.12)", transform: "translate(50%,-50%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: 6, display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, animation: "float 4s ease-in-out infinite" }}>
                <img src="/logos/grupo-zen.png" alt="Grupo ZEN" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }} />
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", height: 48, animation: "float 4s ease-in-out infinite 0.5s" }}>
                <img src="/logos/deindustrial.png" alt="Deindustrial" style={{ height: "100%", objectFit: "contain" }} />
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "#7dd3fc", marginBottom: 8, textTransform: "uppercase" }}>Tablero de Seguimiento</div>
            <h1 style={{ fontSize: 34, fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.05, marginBottom: 14, letterSpacing: -0.5 }}>
              Bodegas<br />Coyol
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, maxWidth: 280 }}>
              Plataforma central de coordinación entre <strong style={{ color: "#fff" }}>Grupo ZEN</strong> y <strong style={{ color: "#fff" }}>Deindustrial</strong> para el desarrollo del proyecto Ganadera Santa Leonor S.A.
            </p>
          </div>
          <div style={{ position: "relative", zIndex: 1, fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: 1, fontFamily: "'DM Mono', monospace" }}>
            © {new Date().getFullYear()} · GRUPO ZEN · DEINDUSTRIAL
          </div>
        </div>

        {/* Right panel: form */}
        <div style={{ padding: "44px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Iniciar sesión</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>Ingresá con tu cuenta autorizada para continuar.</p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Correo electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" style={inputStyle} autoComplete="email" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} autoComplete="current-password" />
            </div>

            {err && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 16, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠️</span><span>{err}</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%",
              padding: "13px 16px",
              background: loading ? "#64748b" : "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(3,105,161,0.35)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
              onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
              onMouseUp={(e) => e.currentTarget.style.transform = ""}
            >
              {loading ? "Ingresando…" : "Ingresar →"}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px dashed #e2e8f0", fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
            🔐 Acceso restringido a usuarios autorizados.<br />
            Los usuarios se administran desde Firebase Console.
          </div>
        </div>
      </div>
    </div>
  );
}
