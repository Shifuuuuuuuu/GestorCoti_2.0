// src/composables/useOCNotifications.js
import { ref, watch, onBeforeUnmount } from 'vue'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/stores/firebase'
import { useAuthStore } from '@/stores/authService'
import { useToastStore } from '@/stores/toastStore'


export function useOCNotifications() {
  const auth = useAuthStore()
  const toasts = useToastStore()
  const loaded = ref(false)

  const unsubList = []
  const lastStatus = new Map()

  function pushByStatus(docId, data) {
    const est = String(data.estatus || '').trim()
    const ocId = data.id ?? '—'
    const empresa = data.empresa || '—'
    const total = Number(data.precioTotalConIVA || 0).toLocaleString('es-CL')

    const subtitle = `OC N° ${ocId} · ${empresa}`
    const body = `Total: ${total}`

    const to = docId ? { name: 'oc-detalle', params: { id: docId } } : null

    const basePayload = {
      title: '',
      subtitle,
      body,
      docId,
      ocId,
      to,
    }

    if (/^aprobado/i.test(est)) {
      toasts.pushOcAprobada({ ...basePayload, title: '¡OC Aprobada!' })
    } else if (/^preaprobado/i.test(est)) {
      toasts.pushOcPreaprobada({ ...basePayload, title: 'OC Preaprobada' })
    } else if (/^casi/i.test(est) || /casi aprobado/i.test(est)) {
      toasts.pushOcCasiAprobada({ ...basePayload, title: 'OC Casi Aprobada' })
    } else if (/pendiente/i.test(est)) {
      toasts.pushOcPendiente({ ...basePayload, title: 'OC Pendiente de Aprobación' })
    } else if (/rechaz/i.test(est)) {
      toasts.pushOcRechazada({ ...basePayload, title: 'OC Rechazada' })
    }
  }

  function startFor(field, value) {
    if (!value) return
    const qRef = query(
      collection(db, 'ordenes_oc'),
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
            total: data.precioTotalConIVA,
          })
        })
        loaded.value = true
      },
      (e) => {
        console.warn('[OC notifs]', e)
      }
    )

    unsubList.push(unsub)
  }

  function stop() {
    while (unsubList.length) {
      try {
        unsubList.pop()()
      } catch (e) {
        console.error(e)
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
