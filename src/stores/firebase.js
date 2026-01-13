// src/stores/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
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
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

initializeFirestore(app, { ignoreUndefinedProperties: true });
export const db = getFirestore(app, "rollback-2025-10-25");

export const auth = getAuth(app);
export const storage = getStorage(app);
export const ai = getAI(app, { backend: new VertexAIBackend("us-central1") });
export const geminiModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
