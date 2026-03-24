<template>
  <div class="toast-container position-fixed end-0 p-3" style="z-index:1080; top: 18%;">
    <div
      v-for="t in safeToasts"
      :key="t.id"
      class="toast show align-items-center"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <i class="me-2" :class="['bi', t.icon || 'bi-check2-square']"></i>
        <strong class="me-auto">SOLPED Empresa</strong>
        <small class="text-muted">{{ t.time }}</small>
        <button type="button" class="btn-close ms-2 mb-1" @click="toasts.remove(t.id)"></button>
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
          Ver SOLPED
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
    .filter(t => t.channel === 'solped_cotizada')
    .map(t => {
      let _to = null
      if (t.to) {
        try {
          const r = router.resolve(t.to)
          if (r?.href) _to = t.to
        } catch (e) {
          console.error('[ToastCenterSolpedCotizada] Ruta inválida:', e)
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
  max-width: 390px;
  box-shadow:
    0 10px 24px rgba(0,0,0,.15),
    0 3px 8px rgba(0,0,0,.10);
  border-radius: 10px;
}
.toast-header {
  border-bottom: 1px solid rgba(0,0,0,.05);
}
</style>
