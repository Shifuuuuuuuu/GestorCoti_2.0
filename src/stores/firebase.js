// src/stores/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ✅ App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ✅ Firebase AI Logic (Vertex AI Gemini)
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyDEv3scnjXxzWEZRBjY38SRgi5gCwCAyp0",
  authDomain: "xtremesolped.firebaseapp.com",
  projectId: "xtremesolped",
  storageBucket: "xtremesolped.firebasestorage.app",
  messagingSenderId: "731445433885",
  appId: "1:731445433885:web:dcf44a5f24dce64d3518f4",
  measurementId: "G-PTX7XN2BE2",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ SOLO EN LOCALHOST: genera el Debug Token REAL y lo muestra en consola
// (Este token NO es tu reCAPTCHA key. Es uno largo que debes registrar en Firebase App Check.)
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// ✅ App Check con reCAPTCHA v3
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// Firestore
initializeFirestore(app, { ignoreUndefinedProperties: true });
export const db = getFirestore(app, "rollback-2025-10-25");

// Auth / Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

// ✅ Vertex AI Gemini API (AI Logic)
export const ai = getAI(app, { backend: new VertexAIBackend("us-central1") });
export const geminiModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
