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

import { registerSW } from "virtual:pwa-register";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

let swUpdateTriggered = false;

const triggerSWUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    swUpdateTriggered = true;
    triggerSWUpdate(true);
  },
  onOfflineReady() {},
});

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!swUpdateTriggered) return;
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
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
          if (url.includes("firebase-messaging-sw.js") || url.includes("/fcm/")) {
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
  listenAppVersion();

  const authStore = useAuthStore();
  await authStore.initAuth();

  await router.isReady();

  app.mount("#app");

  const last = localStorage.getItem("lastRoute");
  const current = router.currentRoute.value;

  if (authStore.user) {
    if (current.name === "login") {
      if (last) router.replace(last).catch(() => {});
      else router.replace({ name: "home" }).catch(() => {});
    }
  } else {
    if (current.meta?.requiresAuth) {
      router.replace({ name: "login" }).catch(() => {});
    }
  }

})();
