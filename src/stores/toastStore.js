import { defineStore } from 'pinia'

function nowLabel() {
  return new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(new Date())
}

export const useToastStore = defineStore('toasts', {
  state: () => ({
    items: [],
    maxStack: 8,
  }),

  actions: {
    push({
      title,
      subtitle = '',
      body = '',
      variant = 'info',
      timeout = 1000000,
      to = null,
      channel = 'general',
      icon = null,
      meta = null,
    }) {
      const id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
      const item = {
        id,
        title,
        subtitle,
        body,
        time: nowLabel(),
        variant,
        timeout,
        to,
        channel,
        icon,
        meta,
      }

      this.items = [item, ...this.items].slice(0, this.maxStack)
      if (timeout > 0) setTimeout(() => this.remove(id), timeout)
      return id
    },

    remove(id) {
      this.items = this.items.filter(t => t.id !== id)
    },

    clear(channel) {
      this.items = channel ? this.items.filter(t => t.channel !== channel) : []
    },

    pushOcAprobada(p)     { return this.push({ channel:'oc',        variant:'success', icon:'bi-check2-circle',   ...p }) },
    pushOcPreaprobada(p)  { return this.push({ channel:'oc',        variant:'info',    icon:'bi-clipboard-check', ...p }) },
    pushOcCasiAprobada(p) { return this.push({ channel:'oc',        variant:'primary', icon:'bi-patch-check',     ...p }) },
    pushOcPendiente(p)    { return this.push({ channel:'oc',        variant:'warning', icon:'bi-hourglass-split', ...p }) },
    pushOcRechazada(p)    { return this.push({ channel:'oc',        variant:'danger',  icon:'bi-x-octagon',       ...p }) },

    pushSolpedGeneral(p)  { return this.push({ channel:'solped',         variant:'info',    icon:'bi-bell-fill',          ...p }) },
    pushSolpedTaller(p)   { return this.push({ channel:'solped_taller',  variant:'warning', icon:'bi-tools',              ...p }) },
    pushSolpedPlantas(p)  { return this.push({ channel:'solped_plantas', variant:'success', icon:'bi-building-fill-add',  ...p }) },

    pushSolpedCotizada(p)       { return this.push({ channel:'solped_cotizada',        variant:'success', icon:'bi-check2-circle',  ...p }) },
    pushSolpedTallerCotizada(p) { return this.push({ channel:'solped_taller_cotizada', variant:'warning', icon:'bi-tools',          ...p }) },
    pushSolpedPlantaCotizada(p) { return this.push({ channel:'solped_planta_cotizada', variant:'success', icon:'bi-building-check', ...p }) },
  },
})
