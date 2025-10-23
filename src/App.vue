<!-- src/App.vue -->
<script setup>
import { onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/layouts/AppShell.vue";

const route = useRoute();
const auth = useAuthStore();
const ui = useUIStore();

onMounted(async () => {
  await auth.initAuth();
  ui.initUI();
});

// si quieres hidratar desde perfil cuando lo cargue:
watch(() => auth.profile, (p) => { if (p) ui.loadFromProfile(p); }, { immediate: true });

const showShell = computed(() => route.name !== "login");
</script>

<template>
  <AppShell v-if="showShell" />
  <main v-else class="login-main">
    <router-view />
  </main>
</template>

<style>
.login-main { padding-top: 24px; }
</style>
