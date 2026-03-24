import { ref, watch, onBeforeUnmount } from 'vue'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '@/stores/firebase'
import { useAuthStore } from '@/stores/authService'
import { useToastStore } from '@/stores/toastStore'

function normalizeText(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function isGeneradorSolped(profile) {
  const role = normalizeText(profile?.role || profile?.rol || '')
  return role === 'generador solped'
}

function isCotizadoCompletado(v) {
  return normalizeText(v) === 'cotizado completado'
}

function isRechazado(v) {
  const n = normalizeText(v)
  return n === 'rechazado' || n === 'solped rechazada'
}

function sameUser(usuarioSesion, me) {
  const val = normalizeText(usuarioSesion)
  if (!val) return false

  const fullName = normalizeText(me.fullName)
  const email = normalizeText(me.email)
  const uid = normalizeText(me.uid)

  return !!val && (
    val === fullName ||
    val === email ||
    val === uid
  )
}

function formatSubtitle(parts = []) {
  return parts.filter(Boolean).join(' · ')
}

function getCurrentStatus(data, collectionName) {
  if (collectionName === 'solpeds_plantas') {
    const estadoAprobacion = data?.estadoAprobacionSolped || ''
    if (isRechazado(estadoAprobacion)) return estadoAprobacion
  }

  return data?.estatus || ''
}

export function useSolpedCotizadoNotifications() {
  const auth = useAuthStore()
  const toasts = useToastStore()

  const unsubList = []
  const loadedMap = ref({
    solpes: false,
    solped_taller: false,
    solpeds_plantas: false,
  })

  const lastState = new Map()

  function pushEmpresa(docId, data, tipo = 'cotizado') {
    const to = docId
      ? { name: 'SolpedDetalle', params: { id: docId } }
      : null

    const esRechazado = tipo === 'rechazado'

    toasts.pushSolpedCotizada({
      title: esRechazado
        ? 'SOLPED rechazada'
        : 'SOLPED cotizada completamente',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.nombre_centro_costo || data.centro_costo || '—',
      ]),
      body:
        `Usuario: ${data.usuario_sesion || data.usuario || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}\n` +
        `Estado: ${data.estatus || '—'}`,
      to,
      variant: esRechazado ? 'danger' : 'success',
      icon: esRechazado ? 'bi-x-octagon' : 'bi-check2-circle',
      meta: { docId, collection: 'solpes', tipo },
    })
  }

  function pushTaller(docId, data, tipo = 'cotizado') {
    const to = docId
      ? { name: 'SolpedTallerDetalle', params: { id: docId } }
      : null

    const esRechazado = tipo === 'rechazado'

    toasts.pushSolpedTallerCotizada({
      title: esRechazado
        ? 'SOLPED Taller rechazada'
        : 'SOLPED Taller cotizada completamente',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.centro_costo || '—',
      ]),
      body:
        `Usuario: ${data.usuario_sesion || data.usuario || '—'}\n` +
        `Solicitante: ${data.nombre_solicitante || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}\n` +
        `Estado: ${data.estatus || '—'}`,
      to,
      variant: esRechazado ? 'danger' : 'warning',
      icon: esRechazado ? 'bi-x-octagon' : 'bi-tools',
      meta: { docId, collection: 'solped_taller', tipo },
    })
  }

  function pushPlantas(docId, data, tipo = 'cotizado') {
    const to = docId
      ? { name: 'DetalleSolpedPlanta', params: { id: docId } }
      : null

    const esRechazado = tipo === 'rechazado'
    const estadoMostrar = data.estadoAprobacionSolped || data.estatus || '—'

    toasts.pushSolpedPlantaCotizada({
      title: esRechazado
        ? 'SOLPED Planta rechazada'
        : 'SOLPED Planta cotizada completamente',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.nombre_centro_costo || data.centro_costo || '—',
      ]),
      body:
        `Usuario: ${data.usuario_sesion || data.usuario || '—'}\n` +
        `Prioridad: ${data.prioridad_solped || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}\n` +
        `Estado: ${estadoMostrar}`,
      to,
      variant: esRechazado ? 'danger' : 'success',
      icon: esRechazado ? 'bi-x-octagon' : 'bi-building-check',
      meta: { docId, collection: 'solpeds_plantas', tipo },
    })
  }

  function startListener({
    collectionName,
    loadedKey,
    pushFn,
    orderField,
    docLimit = 100,
    me,
  }) {
    const qRef = query(
      collection(db, collectionName),
      orderBy(orderField, 'desc'),
      limit(docLimit)
    )

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const isLoaded = loadedMap.value[loadedKey]

        if (!isLoaded) {
          snap.docs.forEach((d) => {
            const data = d.data() || {}
            lastState.set(`${collectionName}:${d.id}`, {
              status: getCurrentStatus(data, collectionName),
              usuario_sesion: data.usuario_sesion || data.usuario || '',
            })
          })
          loadedMap.value[loadedKey] = true
          return
        }

        snap.docChanges().forEach((ch) => {
          const docId = ch.doc.id
          const key = `${collectionName}:${docId}`
          const data = ch.doc.data() || {}

          const prev = lastState.get(key) || {}
          const prevStatus = prev.status || ''
          const currStatus = getCurrentStatus(data, collectionName)
          const owner = data.usuario_sesion || data.usuario || ''

          lastState.set(key, {
            status: currStatus,
            usuario_sesion: owner,
          })

          if (ch.type !== 'modified') return
          if (!sameUser(owner, me)) return

          const nowCotizado = isCotizadoCompletado(currStatus)
          const prevCotizado = isCotizadoCompletado(prevStatus)

          const nowRechazado = isRechazado(currStatus)
          const prevRechazado = isRechazado(prevStatus)

          if (nowCotizado && !prevCotizado) {
            pushFn(docId, data, 'cotizado')
            return
          }

          if (nowRechazado && !prevRechazado) {
            pushFn(docId, data, 'rechazado')
          }
        })
      },
      (e) => {
        console.warn(`[SOLPED cotizado notifications:${collectionName}]`, e)
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

    loadedMap.value = {
      solpes: false,
      solped_taller: false,
      solpeds_plantas: false,
    }

    lastState.clear()
  }

  watch(
    () => [auth.user, auth.profile],
    ([u, profile]) => {
      stop()
      if (!u) return
      if (!isGeneradorSolped(profile)) return

      const me = {
        uid: u.uid || '',
        email: u.email || '',
        fullName: profile?.fullName || profile?.Nombre_completo || u.displayName || '',
      }

      startListener({
        collectionName: 'solpes',
        loadedKey: 'solpes',
        pushFn: pushEmpresa,
        orderField: 'createdAt',
        docLimit: 100,
        me,
      })

      startListener({
        collectionName: 'solped_taller',
        loadedKey: 'solped_taller',
        pushFn: pushTaller,
        orderField: 'creado_en',
        docLimit: 100,
        me,
      })

      startListener({
        collectionName: 'solpeds_plantas',
        loadedKey: 'solpeds_plantas',
        pushFn: pushPlantas,
        orderField: 'createdAt',
        docLimit: 100,
        me,
      })
    },
    { immediate: true, deep: true }
  )

  onBeforeUnmount(() => stop())

  return { stop }
}
