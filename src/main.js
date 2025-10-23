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
import { Toast } from "bootstrap";

import {
  autoUpdateTokenOnAuthStateChanged,
  listenForegroundMessages,
} from "@/stores/messagingService.js";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

(async () => {
  // 1) REGISTRA EL SW CON BASE_URL y espera a ready
  let swReg = null;
  if ("serviceWorker" in navigator) {
    try {
      const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
      swReg = await navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL });
      await navigator.serviceWorker.ready; // clave: espera activación
    } catch (err) {
      console.error("SW register error:", err);
    }
  }

  // 2) ENGANCHA FCM DESPUÉS de que el SW esté listo
  autoUpdateTokenOnAuthStateChanged({
    collectionName: "Usuarios",
    serviceWorkerRegistration: swReg,
  });

  listenForegroundMessages((payload) => {
    const title = payload?.notification?.title || "Notificación";
    const body = payload?.notification?.body || "";
    showBootstrapToast(title, body);
  });

  function showBootstrapToast(title, body) {
    let container = document.getElementById("fcm-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "fcm-toast-container";
      container.className = "position-fixed bottom-0 end-0 p-3";
      container.style.zIndex = 1080;
      document.body.appendChild(container);
    }
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${title}</strong>
        <small>ahora</small>
        <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${body}</div>
    `;
    const toast = new Toast(toastEl, { autohide: true, delay: 5000 });
    container.appendChild(toastEl);
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  }

  const authStore = useAuthStore();
  await authStore.initAuth();
  app.mount("#app");
})();
