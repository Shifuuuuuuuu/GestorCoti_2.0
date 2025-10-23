// src/stores/messagingStore.js
import { defineStore } from 'pinia'
import { app } from '@/stores/firebase'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

export const useMessagingStore = defineStore('messaging', {
  state: () => ({
    permission: (typeof Notification !== 'undefined' ? Notification.permission : 'default'),
    fcmToken: '',
    lastMessage: null,
    isSupported: true,
  }),

  actions: {
    async init() {
      try {
        const supported = await isSupported()
        if (!supported) {
          this.isSupported = false
          return
        }
        this.isSupported = true

        const messaging = getMessaging(app)
        onMessage(messaging, (payload) => {
          this.lastMessage = payload
          window.dispatchEvent(new CustomEvent('fcm:toast', { detail: payload }))
        })
      } catch (e) {
        console.error('[FCM:init] error:', e)
        this.isSupported = false
      }
    },

    async requestPermissionAndToken({ serviceWorkerRegistration } = {}) {
      try {
        if (!('Notification' in window)) {
          this.isSupported = false
          return null
        }

        const perm = await Notification.requestPermission()
        this.permission = perm
        if (perm !== 'granted') return null

        const messaging = getMessaging(app)
        const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || import.meta.env.VITE_VAPID_KEY
        const token = await getToken(messaging, {
          vapidKey,
          ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
        })

        this.fcmToken = token || ''
        return token || null
      } catch (e) {
        console.error('[FCM:getToken] error:', e)
        return null
      }
    },
  },
})
