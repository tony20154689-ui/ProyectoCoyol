import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";

export const PROJECTS = [
  {
    id: "coyol",
    docId: "main",
    name: "BODEGAS COYOL",
    short: "Coyol",
    subtitle: "Proyecto Bodegas Coyol · Grupo ZEN · Ganadera San Lorenzo, S.A.",
    accent: "#0369a1",
    icon: "🏭",
  },
  {
    id: "saro",
    docId: "saro",
    name: "BODEGAS SARO",
    short: "SARO",
    subtitle: "Proyecto Bodegas SARO · Grupo ZEN",
    accent: "#15803d",
    icon: "🏗️",
  },
];

export default function ProjectSelector({ user, onSelect }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #0284c7 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", maxWidth: 620, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#0369a1", textTransform: "uppercase", marginBottom: 6 }}>Tablero de Seguimiento</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0c4a6e", fontFamily: "'Outfit', sans-serif", margin: 0 }}>Elegí un proyecto</h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0" }}>Sesión: <strong>{user?.email}</strong></p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {PROJECTS.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: "#fff",
                border: `2px solid ${p.accent}20`,
                borderRadius: 12,
                padding: "22px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all .15s",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.accent; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${p.accent}25`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${p.accent}20`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 32 }}>{p.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: p.accent, fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{p.subtitle}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 22, textAlign: "center" }}>
          <button onClick={() => signOut(auth)} style={{ background: "transparent", color: "#94a3b8", border: "none", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
