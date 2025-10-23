// src/services/messagingService.js
import { app, db, auth } from '@/stores/firebase'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  deleteToken, // ⬅️ nuevo
} from 'firebase/messaging'
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

async function getSWRegistrationFallback(passedReg) {
  if (passedReg) return passedReg
  if (!('serviceWorker' in navigator)) return null
  try {
    // Espera a que el SW esté listo (evita condiciones de carrera)
    const reg = await navigator.serviceWorker.ready
    return reg || null
  } catch {
    return null
  }
}

export async function requestAndSaveFcmToken({ userDocPath, serviceWorkerRegistration } = {}) {
  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('[FCM] No soportado en este navegador')
      return null
    }
    if (!('Notification' in window)) {
      console.warn('[FCM] API Notification no disponible')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Permiso denegado por el usuario')
      return null
    }

    const messaging = getMessaging(app)
    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || import.meta.env.VITE_VAPID_KEY
    if (!vapidKey) {
      console.error('[FCM] VAPID key no configurada. Define VITE_FCM_VAPID_KEY en .env.local')
      return null
    }

    const swReg = await getSWRegistrationFallback(serviceWorkerRegistration)

    // 🔧 Limpia token previo (si existe) para evitar estados corruptos
    try { await deleteToken(messaging) } catch (e) {console.error(e)}

    let token = null
    try {
      token = await getToken(messaging, {
        vapidKey,
        ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
      })
    } catch (e) {
      // Reintento suave: volver a limpiar y pedir sin registration explícita
      try {
        try { await deleteToken(messaging) } catch (e) {console.error(e)}
        token = await getToken(messaging, { vapidKey })
      } catch (e2) {
        throw e2
      }
    }

    if (!token) {
      return null
    }

    const ref = doc(db, userDocPath)
    const snap = await getDoc(ref)
    const data = {
      token,
      tokenUpdatedAt: serverTimestamp(),
      lastUserAgent: navigator.userAgent,
    }

    if (snap.exists()) {
      await updateDoc(ref, data)
    } else {
      await setDoc(ref, data, { merge: true })
    }

    return token
  } catch (err) {
    console.error('[FCM] Error al pedir/guardar token:', err)
    return null
  }
}

export function listenForegroundMessages(callback) {
  isSupported().then((supported) => {
    if (!supported) return
    const messaging = getMessaging(app)
    onMessage(messaging, (payload) => {
      callback?.(payload)
      window.dispatchEvent(new CustomEvent('fcm:toast', { detail: payload }))
    })
  })
}

export function autoUpdateTokenOnAuthStateChanged({
  collectionName = 'Usuarios',
  serviceWorkerRegistration,
} = {}) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return
    const userDocPath = `${collectionName}/${user.uid}`
    await requestAndSaveFcmToken({ userDocPath, serviceWorkerRegistration })
  })
}
