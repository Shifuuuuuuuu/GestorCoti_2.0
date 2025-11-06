<!-- src/App.vue -->
<script setup>
import { onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/layouts/AppShell.vue";

import ToastCenterOC from "@/components/ToastCenterOC.vue";
import ToastCenterOCTaller from "@/components/ToastCenterOCTaller.vue";              // 👈 nuevo
import { useOCNotifications } from "@/composables/useOCNotifications";
import { useOCNotificationTaller } from "@/composables/useOCNotificationTaller";    // 👈 nuevo

const route = useRoute();
const auth = useAuthStore();
const ui = useUIStore();

onMounted(async () => {
  await auth.initAuth();
  ui.initUI();
});

watch(() => auth.profile, (p) => { if (p) ui.loadFromProfile(p); }, { immediate: true });

// Listeners globales
useOCNotifications();        // OC "normal"
useOCNotificationTaller();   // OC TALLER  👈

const showShell = computed(() => route.name !== "login");
</script>

<template>
  <AppShell v-if="showShell" />
  <main v-else class="login-main">
    <router-view />
  </main>

  <!-- Toasts persistentes -->
  <ToastCenterOC />
  <ToastCenterOCTaller />  <!-- 👈 nuevo -->
</template>

<style>
.login-main { padding-top: 24px; }
</style>
