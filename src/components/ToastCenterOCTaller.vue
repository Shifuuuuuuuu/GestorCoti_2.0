<!-- src/components/ToastCenterOCTaller.vue -->
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
        <strong class="me-auto">Órdenes de Compra (Taller)</strong>
        <small class="text-muted">{{ t.time }}</small>
        <button
          type="button"
          class="btn-close ms-2 mb-1"
          @click="toasts.remove(t.id)"
          aria-label="Close"
        ></button>
      </div>

      <div class="toast-body">
        <div class="fw-semibold">{{ t.title }}</div>
        <div class="small text-muted" v-if="t.subtitle">{{ t.subtitle }}</div>
        <div class="mt-1" v-if="t.body" style="white-space: pre-wrap;">{{ t.body }}</div>

        <RouterLink
          v-if="t._to"
          class="btn btn-sm btn-outline-primary mt-2"
          :to="t._to"
          @click="toasts.remove(t.id)"
        >
          Ver
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useToastStoreTaller } from '@/stores/toastStoreTaller'

const toasts = useToastStoreTaller()
const router = useRouter()

const safeToasts = computed(() =>
  toasts.items
    .filter(t => t.channel === 'oc_taller')
    .map(t => {
      let _to = null
      if (t.to) {
        try {
          const r = router.resolve(t.to)
          if (r?.href) _to = t.to
        } catch (e) {
          console.error('[ToastCenterOCTaller] resolve error:', e)
        }
      }
      return { ...t, _to }
    })
)
</script>
