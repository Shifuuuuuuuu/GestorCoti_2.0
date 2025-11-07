// src/utils/version-listener.js
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'

// Comparador SemVer básico: "3.10.2" vs "3.2.15"
function compareSemver(a, b) {
  const pa = String(a || '0.0.0').split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b || '0.0.0').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1
    if (pa[i] < pb[i]) return -1
  }
  return 0
}

export function listenAppVersion() {
  const CURRENT = (typeof globalThis.__APP_VERSION__ !== 'undefined' ? globalThis.__APP_VERSION__ : '0.0.0')

  const db = getFirestore()
  const ref = doc(db, 'app', 'version') // { current: "0.0.0" }
  let first = true

  return onSnapshot(ref, (snap) => {
    const remote = snap.data()?.current
    if (!remote) return

    // Evita recargar apenas abre por primera vez
    if (first) { first = false; return }

    // Solo recarga si la versión remota es MAYOR a la actual
    if (compareSemver(remote, CURRENT) > 0) {
      // Forzamos un hard reload para saltar cachés
      window.location.reload()
    }
  })
}
