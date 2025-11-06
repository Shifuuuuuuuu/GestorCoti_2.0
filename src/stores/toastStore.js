// src/stores/toastStore.js
import { defineStore } from 'pinia'

function nowLabel() {
  return new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date())
}

export const useToastStore = defineStore('toasts', {
  state: () => ({
    // { id, title, subtitle, body, time, variant, timeout, to, channel, icon }
    items: [],
    maxStack: 5,
  }),

  actions: {
    push({ title, subtitle = '', body = '', variant = 'info', timeout = 1000000, to = null, channel = 'general', icon = null }) {
      const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
      const item = { id, title, subtitle, body, time: nowLabel(), variant, timeout, to, channel, icon }
      this.items = [item, ...this.items].slice(0, this.maxStack)
      if (timeout > 0) setTimeout(() => this.remove(id), timeout)
      return id
    },

    remove(id) { this.items = this.items.filter(t => t.id !== id) },
    clear(channel) { this.items = channel ? this.items.filter(t => t.channel !== channel) : [] },

    // ===== Canal Órdenes de Compra (nuevo)
    pushOcAprobada(p)        { return this.push({ channel:'oc', variant:'success', icon:'bi-check2-circle',     ...p }) },
    pushOcPreaprobada(p)     { return this.push({ channel:'oc', variant:'info',    icon:'bi-clipboard-check',   ...p }) },
    pushOcCasiAprobada(p)    { return this.push({ channel:'oc', variant:'primary', icon:'bi-patch-check',       ...p }) },
    pushOcPendiente(p)       { return this.push({ channel:'oc', variant:'warning', icon:'bi-hourglass-split',   ...p }) },
    pushOcRechazada(p)       { return this.push({ channel:'oc', variant:'danger',  icon:'bi-x-octagon',         ...p }) },
  },
})
