<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import TopNavbar from "@/components/TopNavbar.vue";
import SideNavbar from "@/components/SideNavbar.vue";

const route = useRoute();
const auth = useAuthStore();
const ui   = useUIStore();

onMounted(() => {
  if (auth?.profile) ui.loadFromProfile(auth.profile);
});
watch(() => auth.profile, (p) => p && ui.loadFromProfile(p));

const withSidebar    = computed(() => ui.isSidebar);
const isSidebarOpen  = computed(() => ui.isSidebarOpen);

// Auto-cerrar el drawer al ir al login
watch(() => route.name, (n) => {
  if (n === 'login') ui.closeSidebar();
});
</script>

<template>
  <div>
    <TopNavbar v-if="!withSidebar" />

    <!-- Botón burger flotante (solo móvil) cuando estamos en modo sidebar -->
    <button
      v-if="withSidebar"
      class="mobile-burger d-lg-none right"
      type="button"
      @click="ui.toggleSidebar()"
      aria-label="Abrir menú"
      :aria-expanded="isSidebarOpen.toString()"
    >
      <i class="bi bi-list"></i>
    </button>

    <SideNavbar v-if="withSidebar" />

    <!-- Backdrop en móvil -->
    <div
      v-if="withSidebar"
      class="sidebar-backdrop d-lg-none"
      :class="{ 'show': isSidebarOpen }"
      @click="ui.closeSidebar()"
    ></div>

    <main :class="withSidebar ? 'with-sidebar' : 'with-navbar'">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.with-navbar { padding-top: 68px; }       /* altura navbar fixed-top */
.with-sidebar { margin-left: 260px; padding: 16px; }

/* En móvil, el contenido NO se desplaza; el sidebar va como overlay */
@media (max-width: 991px){
  .with-sidebar { margin-left: 0; padding-top: 68px; }
}
/* Botón burger flotante en móvil */
.mobile-burger{
  position: fixed; top: 12px; z-index: 1050;
  width: 42px; height: 42px; border-radius: 10px; border: 0;
  background: #ffffff; color: #111; box-shadow: 0 8px 24px rgba(0,0,0,.18);
  display: grid; place-items: center; font-size: 22px;
}
/* variante a la derecha */
.mobile-burger.right{ right: 12px; left: auto; }

/* Backdrop del drawer en móvil (sin cambios) */
.sidebar-backdrop{
  position: fixed; inset: 0; z-index: 1039;
  background: rgba(0,0,0,.35);
  opacity: 0; pointer-events: none;
  transition: opacity .18s ease;
}
.sidebar-backdrop.show{
  opacity: 1; pointer-events: auto;
}

</style>
