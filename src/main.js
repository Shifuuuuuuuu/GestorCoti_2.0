// src/main.js
import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/authService";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { listenAppVersion } from "@/utils/version-listener.js";

// PWA auto-update
import { registerSW } from "virtual:pwa-register";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);


// PWA: registra y fuerza activación cuando haya nueva versión
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true); // aplica actualización sin preguntar
  },
  onOfflineReady() {
    // opcional: mostrar un toast "Listo para offline"
  },
});

// Evitar loops de recarga al cambiar el controlador del SW
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// 🧹 MIGRACIÓN: desregistrar cualquier SW antiguo de FCM (mantener por 1 release)
if ("serviceWorker" in navigator) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map((reg) => {
          const url =
            reg.active?.scriptURL ||
            reg.installing?.scriptURL ||
            reg.waiting?.scriptURL ||
            "";
          if (
            url.includes("firebase-messaging-sw.js") ||
            url.includes("/fcm/")
          ) {
            return reg.unregister().catch(() => {});
          }
          return Promise.resolve();
        })
      );
    } catch (e) {
      console.warn("No se pudo desregistrar SWs antiguos de FCM:", e);
    }
  })();
}

(async () => {
  // Versión remota (si la usas). No relacionado con FCM.
  listenAppVersion();

  const authStore = useAuthStore();
  await authStore.initAuth();
  app.mount("#app");
})();
