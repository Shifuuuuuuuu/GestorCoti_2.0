<!-- src/App.vue -->
<script setup>
import { onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/layouts/AppShell.vue";

import ToastCenterOC from "@/components/ToastCenterOC.vue";
import ToastCenterOCTaller from "@/components/ToastCenterOCTaller.vue";
import { useOCNotifications } from "@/composables/useOCNotifications";
import { useOCNotificationTaller } from "@/composables/useOCNotificationTaller";

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

const showShell = computed(() => route.name !== "login");
</script>

<template>
  <AppShell v-if="showShell" />
  <main v-else class="login-main">
    <router-view />
  </main>

  <ToastCenterOC />
  <ToastCenterOCTaller />
</template>

<style>
.login-main { padding-top: 24px; }
</style>
