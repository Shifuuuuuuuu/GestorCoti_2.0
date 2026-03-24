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

function asArray(v) {
  return Array.isArray(v) ? v : []
}

function extractCandidateStrings(arr) {
  const out = []

  for (const x of asArray(arr)) {
    if (typeof x === 'string') {
      out.push(x)
      continue
    }

    if (x && typeof x === 'object') {
      out.push(
        x.fullName,
        x.nombre,
        x.name,
        x.email,
        x.correo,
        x.uid,
        x.id
      )
    }
  }

  return out.filter(Boolean).map(normalizeText)
}

function matchesUserInField(value, me) {
  const tokens = new Set([
    normalizeText(me.fullName),
    normalizeText(me.email),
    normalizeText(me.uid),
  ])

  if ([...tokens].every(x => !x)) return false

  if (typeof value === 'string') {
    const v = normalizeText(value)
    return tokens.has(v)
  }

  if (Array.isArray(value)) {
    const candidates = extractCandidateStrings(value)
    return candidates.some(v => tokens.has(v))
  }

  if (value && typeof value === 'object') {
    const candidates = extractCandidateStrings([value])
    return candidates.some(v => tokens.has(v))
  }

  return false
}

function formatSubtitle(parts = []) {
  return parts.filter(Boolean).join(' · ')
}

export function useSolpedNotifications() {
  const auth = useAuthStore()
  const toasts = useToastStore()

  const unsubList = []
  const loadedMap = ref({
    solpes: false,
    solped_taller: false,
    solpeds_plantas: false,
  })

  const seenIds = new Set()

  function pushSolpeGeneral(docId, data) {
    const to = docId
      ? { name: 'SolpedDetalle', params: { id: docId } }
      : null

    toasts.pushSolpedGeneral({
      title: 'Se subió nueva SOLPED',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.nombre_centro_costo || '—',
      ]),
      body:
        `Usuario: ${data.usuario || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}`,
      to,
      meta: { docId, collection: 'solpes' },
    })
  }

  function pushSolpeTaller(docId, data) {
    const to = docId
      ? { name: 'SolpedTallerDetalle', params: { id: docId } }
      : null

    toasts.pushSolpedTaller({
      title: 'Se subió nueva SOLPED Taller',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.centro_costo || '—',
      ]),
      body:
        `Solicitante: ${data.nombre_solicitante || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}`,
      to,
      meta: {
        docId,
        numero_solpe: data.numero_solpe ?? null,
        collection: 'solped_taller',
      },
    })
  }

  function pushSolpePlantas(docId, data) {
    const to = docId
      ? { name: 'DetalleSolpedPlanta', params: { id: docId } }
      : null

    toasts.pushSolpedPlantas({
      title: 'Se subió nueva SOLPED Planta',
      subtitle: formatSubtitle([
        `SOLPED #${data.numero_solpe ?? '—'}`,
        data.nombre_centro_costo || '—',
      ]),
      body:
        `Usuario: ${data.usuario || '—'}\n` +
        `Prioridad: ${data.prioridad_solped || '—'}\n` +
        `Tipo: ${data.tipo_solped || '—'}`,
      to,
      meta: { docId, collection: 'solpeds_plantas' },
    })
  }

  function startListener({
    collectionName,
    loadedKey,
    matchFn,
    pushFn,
    orderField = 'createdAt',
    docLimit = 80,
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
            seenIds.add(`${collectionName}:${d.id}`)
          })
          loadedMap.value[loadedKey] = true
          return
        }

        snap.docChanges().forEach((ch) => {
          if (ch.type !== 'added') return

          const idKey = `${collectionName}:${ch.doc.id}`
          if (seenIds.has(idKey)) return
          seenIds.add(idKey)

          const data = ch.doc.data() || {}
          if (!matchFn(data)) return

          pushFn(ch.doc.id, data)
        })
      },
      (e) => {
        console.warn(`[SOLPED notifications:${collectionName}]`, e)
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

    seenIds.clear()
  }

  watch(
    () => [auth.user, auth.profile],
    ([u, profile]) => {
      stop()
      if (!u) return

      const me = {
        uid: u.uid || '',
        email: u.email || '',
        fullName: profile?.fullName || u.displayName || '',
      }

      startListener({
        collectionName: 'solpes',
        loadedKey: 'solpes',
        matchFn: (data) => matchesUserInField(data.dirigidoA, me),
        pushFn: pushSolpeGeneral,
        orderField: 'createdAt',
        docLimit: 80,
      })

      startListener({
        collectionName: 'solped_taller',
        loadedKey: 'solped_taller',
        matchFn: (data) => matchesUserInField(data.cotizadores, me),
        pushFn: pushSolpeTaller,
        orderField: 'creado_en',
        docLimit: 80,
      })

      startListener({
        collectionName: 'solpeds_plantas',
        loadedKey: 'solpeds_plantas',
        matchFn: (data) => matchesUserInField(data.dirigidoA, me),
        pushFn: pushSolpePlantas,
        orderField: 'createdAt',
        docLimit: 80,
      })
    },
    { immediate: true, deep: true }
  )

  onBeforeUnmount(() => stop())

  return { stop }
}
