# Proyecto Coyol — Tablero de Seguimiento

Aplicación React (Vite) para el seguimiento del proyecto **Bodegas Coyol** (Grupo ZEN · Ganadera San Lorenzo, S.A.). Datos persistidos en **Cloud Firestore**, autenticación con **Firebase Auth** (email + contraseña), hospedada en **Firebase Hosting**.

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # build de producción a /dist
npm run deploy       # build + firebase deploy
npm run deploy:rules # solo reglas de Firestore
npm run seed -- ./bodegas-coyol-data.json   # cargar JSON de respaldo a Firestore (1 sola vez)
```

## Estructura

- `src/firebase.js` — configuración del SDK
- `src/App.jsx` — wrapper con auth + sincronización Firestore
- `src/Login.jsx` — pantalla de inicio de sesión
- `src/Tracker.jsx` — UI principal del tablero
- `firestore.rules` — reglas (solo usuarios autenticados)
- `scripts/seed.mjs` — carga inicial desde JSON

## Administración de usuarios

Crear usuarios manualmente en **Firebase Console → Authentication → Users → Add user**.
