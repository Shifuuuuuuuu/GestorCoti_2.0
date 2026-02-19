// src/composables/useOCNotificationTaller.js
import { ref, watch, onBeforeUnmount } from 'vue'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/stores/firebase'
import { useAuthStore } from '@/stores/authService'
import { useToastStoreTaller } from '@/stores/toastStoreTaller'


export function useOCNotificationTaller() {
  const auth = useAuthStore()
  const toasts = useToastStoreTaller()
  const loaded = ref(false)

  const unsubList = []
  const lastStatus = new Map()

  function buildTo(docId /* string */) {
    return { name: 'OrdenOCTallerDetalle', params: { id: String(docId) }, query: {} }
  }

  function pushByStatus(docId, data) {
    const est = String(data?.estatus || '').trim()
    const ocId = data?.id ?? '—'
    const empresa = data?.empresa || '—'
    const total = Number(data?.precioTotalConIVA || 0).toLocaleString('es-CL')
    const subtitle = `OC Taller N° ${ocId} · ${empresa}`
    const body = `Total: ${total}`
    const to = buildTo(docId)

    if (/^aprobado/i.test(est)) {
      toasts.pushOcTallerAprobada({ title: '¡OC Taller Aprobada!', subtitle, body, to })
    } else if (/^preaprobado/i.test(est)) {
      toasts.pushOcTallerPreaprobada({ title: 'OC Taller Preaprobada', subtitle, body, to })
    } else if (/^casi/i.test(est) || /casi aprobado/i.test(est)) {
      toasts.pushOcTallerCasiAprobada({ title: 'OC Taller Casi Aprobada', subtitle, body, to })
    } else if (/pendiente/i.test(est)) {
      toasts.pushOcTallerPendiente({ title: 'OC Taller Pendiente', subtitle, body, to })
    } else if (/rechaz/i.test(est)) {
      toasts.pushOcTallerRechazada({ title: 'OC Taller Rechazada', subtitle, body, to })
    }
  }

  function startFor(field, value) {
    if (!value) return
    const qRef = query(
      collection(db, 'ordenes_oc_taller'),
      where(field, '==', value),
      orderBy('fechaSubida', 'desc'),
      limit(50)
    )

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        if (loaded.value) {
          snap.docChanges().forEach((ch) => {
            if (ch.type !== 'modified') return
            const id = ch.doc.id
            const data = ch.doc.data()
            const prev = lastStatus.get(id)?.estatus
            const now = data.estatus
            if (prev && now && prev !== now) {
              pushByStatus(id, data)
            }
          })
        }

        snap.docs.forEach((d) => {
          const data = d.data() || {}
          lastStatus.set(d.id, {
            estatus: data.estatus,
            idOc: data.id,
            empresa: data.empresa,
            total: data.precioTotalConIVA
          })
        })

        loaded.value = true
      },
      (e) => {
        console.warn('[OC_TALLER notifs] onSnapshot error:', e)
      }
    )

    unsubList.push(unsub)
  }

  function stop() {
    while (unsubList.length) {
      try {
        const u = unsubList.pop()
        if (typeof u === 'function') u()
      } catch (e) {
        console.error('[OC_TALLER notifs] stop error:', e)
      }
    }
    loaded.value = false
    lastStatus.clear()
  }

  watch(
    () => auth.user,
    (u) => {
      stop()
      if (!u) return

      const fullName = (auth?.profile?.fullName || u.displayName || '').trim()
      const uid = u.uid
      if (fullName) startFor('responsable', fullName)
      startFor('responsable', uid)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => stop())
  return { stop }
}
