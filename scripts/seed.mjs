// Seed Firestore with the JSON backup. Run once with:
//   node scripts/seed.mjs ./bodegas-coyol-data.json
// Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account key JSON,
// OR set serviceAccountKey.json in repo root (gitignored).
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2];
if (!file) { console.error("Uso: node scripts/seed.mjs <ruta-al-json>"); process.exit(1); }

const data = JSON.parse(readFileSync(resolve(file), "utf8"));

const keyPath = resolve("serviceAccountKey.json");
const credential = existsSync(keyPath)
  ? cert(JSON.parse(readFileSync(keyPath, "utf8")))
  : applicationDefault();

initializeApp({ credential, projectId: "proyecto-coyol" });
const db = getFirestore();

await db.doc("appData/main").set({
  data,
  updatedAt: new Date(),
  updatedBy: "seed-script",
});
console.log("✅ Datos cargados a appData/main");
process.exit(0);
