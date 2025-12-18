// src/stores/firebase.js
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Usa SIEMPRE las mismas credenciales que el SW
const firebaseConfig = {
  apiKey: "AIzaSyDEv3scnjXxzWEZRBjY38SRgi5gCwCAyp0",
  authDomain: "xtremesolped.firebaseapp.com",
  projectId: "xtremesolped",
  storageBucket: "xtremesolped.firebasestorage.app",
  messagingSenderId: "731445433885",
  appId: "1:731445433885:web:dcf44a5f24dce64d3518f4",
  measurementId: "G-PTX7XN2BE2"
}

// Evita doble inicialización si en otro lado también importaste Firebase
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
initializeFirestore(app, { ignoreUndefinedProperties: true })

export const db = getFirestore(app, 'rollback-2025-10-25')
export const auth = getAuth(app, 'rollback-2025-10-25')
export const storage = getStorage(app)

