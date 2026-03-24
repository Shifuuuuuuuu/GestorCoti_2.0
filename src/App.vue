<script setup>
import { onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/layouts/AppShell.vue";

import ToastCenterOC from "@/components/ToastCenterOC.vue";
import ToastCenterOCTaller from "@/components/ToastCenterOCTaller.vue";
import ToastCenterSolped from "@/components/ToastCenterSolped.vue";
import ToastCenterSolpedTaller from "@/components/ToastCenterSolpedTaller.vue";
import ToastCenterSolpedPlantas from "@/components/ToastCenterSolpedPlantas.vue";

import ToastCenterSolpedCotizada from "@/components/ToastCenterSolpedCotizada.vue";
import ToastCenterSolpedTallerCotizada from "@/components/ToastCenterSolpedTallerCotizada.vue";
import ToastCenterSolpedPlantaCotizada from "@/components/ToastCenterSolpedPlantaCotizada.vue";

import { useOCNotifications } from "@/composables/useOCNotifications";
import { useOCNotificationTaller } from "@/composables/useOCNotificationTaller";
import { useSolpedNotifications } from "@/composables/useSolpedNotifications";
import { useSolpedCotizadoNotifications } from "@/composables/useSolpedCotizadoNotifications";

const route = useRoute();
const auth = useAuthStore();
const ui = useUIStore();

onMounted(() => {
  ui.initUI();
});

watch(
  () => auth.profile,
  (p) => {
    if (p) ui.loadFromProfile(p);
  },
  { immediate: true }
);

useOCNotifications();
useOCNotificationTaller();
useSolpedNotifications();
useSolpedCotizadoNotifications();

const hideShellRoutes = ["login", "NotFound"];
const showShell = computed(() => !hideShellRoutes.includes(String(route.name || "")));
</script>

<template>
  <AppShell v-if="showShell" />

  <main v-else class="standalone-main">
    <router-view />
  </main>

  <ToastCenterOC />
  <ToastCenterOCTaller />
  <ToastCenterSolped />
  <ToastCenterSolpedTaller />
  <ToastCenterSolpedPlantas />

  <ToastCenterSolpedCotizada />
  <ToastCenterSolpedTallerCotizada />
  <ToastCenterSolpedPlantaCotizada />
</template>

<style>
.standalone-main {
  min-height: 100vh;
}
</style>
