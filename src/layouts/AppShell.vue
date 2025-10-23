<!-- src/layouts/AppShell.vue -->
<script setup>
import { computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import TopNavbar from "@/components/TopNavbar.vue";
import SideNavbar from "@/components/SideNavbar.vue";

const auth = useAuthStore();
const ui = useUIStore();

onMounted(() => {
  if (auth?.profile) ui.loadFromProfile(auth.profile);
});
watch(() => auth.profile, (p) => p && ui.loadFromProfile(p));

const withSidebar = computed(() => ui.isSidebar);
</script>

<template>
  <div>
    <TopNavbar v-if="!withSidebar" />
    <SideNavbar v-else />

    <main :class="withSidebar ? 'with-sidebar' : 'with-navbar'">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.with-navbar { padding-top: 68px; }       /* altura navbar fixed-top */
.with-sidebar { margin-left: 260px; padding: 16px; }
@media (max-width: 991px){
  .with-sidebar { margin-left: 0; padding-top: 68px; }
}
</style>
