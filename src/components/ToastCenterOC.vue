<!-- src/components/ToastCenterOC.vue -->
<template>
  <div class="toast-container position-fixed end-0 p-3" style="z-index:1080; top: 11%;">
    <div
      v-for="t in safeToasts"
      :key="t.id"
      class="toast show align-items-center"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <i class="me-2" :class="['bi', t.icon || 'bi-info-circle']"></i>
        <strong class="me-auto">Órdenes de Compra</strong>
        <small class="text-muted">{{ t.time }}</small>
        <button type="button" class="btn-close ms-2 mb-1" @click="toasts.remove(t.id)" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        <div class="fw-semibold">{{ t.title }}</div>
        <div class="small text-muted" v-if="t.subtitle">{{ t.subtitle }}</div>
        <div class="mt-1" v-if="t.body" style="white-space: pre-wrap;">{{ t.body }}</div>
        <button
          v-if="t._to"
          class="btn btn-sm btn-outline-primary mt-2"
          @click="go(t)"
        >
          Ver
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToastStore } from '@/stores/toastStore'

const toasts = useToastStore()
const router = useRouter()

const safeToasts = computed(() =>
  toasts.items
    .filter(t => t.channel === 'oc')
    .map(t => {
      let routeCandidate = null

      if (t.to) {
        routeCandidate = t.to
      } else if (t.ocId) {
        routeCandidate = { name: 'oc-detalle', params: { id: t.ocId } }
      } else if (t.docId) {
        routeCandidate = { name: 'oc-detalle', params: { id: t.docId } }
      }

      let _to = null
      if (routeCandidate) {
        try {
          const r = router.resolve(routeCandidate)
          if (r?.href) _to = routeCandidate
        } catch (e) {
          console.error('[ToastCenterOC] Ruta inválida para toast OC:', e)
        }
      }

      return { ...t, _to }
    })
)

const go = async (t) => {
  if (!t?._to) return
  try {
    await router.push(t._to)
  } finally {
    toasts.remove(t.id)
  }
}
</script>

<style scoped>
.toast {
  min-width: 320px;
  max-width: 380px;
  box-shadow:
    0 10px 24px rgba(0,0,0,.15),
    0 3px  8px rgba(0,0,0,.10);
  border-radius: 10px;
}
.toast-header {
  border-bottom: 1px solid rgba(0,0,0,.05);
}
</style>
