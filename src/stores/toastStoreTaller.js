// src/stores/toastStoreTaller.js
import { defineStore } from 'pinia'

function nowLabel() {
  return new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date())
}

export const useToastStoreTaller = defineStore('toasts_taller', {
  state: () => ({
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
    pushOcTallerAprobada(p)     { return this.push({ channel:'oc_taller', variant:'success', icon:'bi-check2-circle',     ...p }) },
    pushOcTallerPreaprobada(p)  { return this.push({ channel:'oc_taller', variant:'info',    icon:'bi-clipboard-check',   ...p }) },
    pushOcTallerCasiAprobada(p) { return this.push({ channel:'oc_taller', variant:'primary', icon:'bi-patch-check',       ...p }) },
    pushOcTallerPendiente(p)    { return this.push({ channel:'oc_taller', variant:'warning', icon:'bi-hourglass-split',   ...p }) },
    pushOcTallerRechazada(p)    { return this.push({ channel:'oc_taller', variant:'danger',  icon:'bi-x-octagon',         ...p }) },
  },
})
