import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCaCqOA6bwxdRlzSzm_S5cuyM5dESGcuo",
  authDomain: "proyecto-coyol.firebaseapp.com",
  projectId: "proyecto-coyol",
  storageBucket: "proyecto-coyol.firebasestorage.app",
  messagingSenderId: "645215533691",
  appId: "1:645215533691:web:5c88bd53a9b6e5a1be40de",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
