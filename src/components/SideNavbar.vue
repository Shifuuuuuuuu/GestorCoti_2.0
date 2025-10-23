<script setup>
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";

const router = useRouter();
const route  = useRoute();
const auth   = useAuthStore();
const ui     = useUIStore();
const isDark = computed(() => ui.isDark);
const toggleTheme = () => ui.toggleTheme();
const { empresaMenu, tallerMenu, adminMenu } = useRoleMenus();

const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());
const photoUrl = computed(() =>
  auth?.user?.photoURL ||
  auth?.profile?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.value || auth?.user?.email || 'User')}&background=EEE&color=111`
);

const go = (loc) => router.push(loc);
const logout = async () => { await auth.logout(); router.replace({ name: "login" }); };

// proteger cuando nameOrPath sea null/undefined
const isActive = (nameOrPath) =>
  !!nameOrPath && (route.name === nameOrPath || route.path === nameOrPath);

const switching = ref(false);
const switchTo = async (style) => {
  switching.value = true;
  await ui.setMenuStyle(style);
  switching.value = false;
};
</script>

<template>
  <aside class="app-sidebar bg-xtreme">
    <div class="sidebar-header">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-light" :disabled="switching" @click="switchTo('navbar')" title="Cambiar a Navbar">
          <i class="bi bi-menu-up"></i>
        </button>

        <!-- NUEVO: Toggle tema -->
        <button class="btn btn-sm btn-light" @click="toggleTheme" title="Cambiar tema">
          <i v-if="isDark" class="bi bi-sun"></i>
          <i v-else class="bi bi-moon"></i>
        </button>

        <router-link to="/" class="brand text-white text-decoration-none">
          Xtreme Disponibilidad
        </router-link>
      </div>
    </div>

    <div class="sidebar-user">
      <img :src="photoUrl" class="rounded-circle me-2" width="36" height="36" />
      <div class="d-flex flex-column">
        <strong class="text-white small">{{ fullName || 'Usuario' }}</strong>
        <span class="text-white-50 small">{{ role || '—' }}</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <!-- EMPRESA -->
      <div v-if="empresaMenu.length" class="group">
        <div class="group-title">Empresa</div>

        <template v-for="(it, i) in empresaMenu" :key="'e-'+i">
          <hr v-if="it===null" class="divider" />
          <a
            v-else
            href="#"
            class="item"
            :class="{ active: isActive(it.name) }"
            @click.prevent="go({ name: it.name })"
          >
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>{{ it.text }}
          </a>
        </template>
      </div>

      <!-- TALLER -->
      <div v-if="tallerMenu.length" class="group">
        <div class="group-title">Taller</div>

        <template v-for="(it, i) in tallerMenu" :key="'t-'+i">
          <hr v-if="it===null" class="divider" />
          <a
            v-else
            href="#"
            class="item"
            :class="{ active: isActive(it.name) }"
            @click.prevent="go({ name: it.name })"
          >
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>{{ it.text }}
          </a>
        </template>
      </div>

      <!-- ADMIN -->
      <div v-if="adminMenu.length" class="group">
        <div class="group-title">Admin</div>

        <template v-for="(it, i) in adminMenu" :key="'a-'+i">
          <hr v-if="it===null" class="divider" />
          <a
            v-else
            href="#"
            class="item"
            :class="{ active: isActive(it.name) }"
            @click.prevent="go({ name: it.name })"
          >
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>{{ it.text }}
          </a>
        </template>
      </div>
    </nav>

    <div class="sidebar-footer">
      <a href="#" class="item" @click.prevent="go({ name: 'PerfilUsuario' })">
        <i class="bi bi-person-gear me-2"></i> Perfil
      </a>
      <a href="#" class="item" @click.prevent="logout">
        <i class="bi bi-box-arrow-right me-2"></i> Salir
      </a>
    </div>
  </aside>
</template>

<!-- 🔴 BLOQUE GLOBAL: variables + utilidad bg-xtreme -->
<style>
:root{
  --xt-red:    #c62828;
  --xt-red-d1: #b71c1c;
  --xt-red-d2: #8e1515;

  --xt-white:    #ffffff;
  --xt-white-75: rgba(255,255,255,.75);
  --xt-white-60: rgba(255,255,255,.6);
  --xt-white-10: rgba(255,255,255,.10);

  --xt-black-18: rgba(0,0,0,.18);
}

/* utilidad global por si la quieres usar en otros lados */
.bg-xtreme { background-color: var(--xt-red) !important; }
</style>

<!-- 🎯 BLOQUE SCOPED del componente -->
<style scoped>
.app-sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: 260px;
  /* color directo + refuerzo con !important por Bootstrap */
  background-color: #c62828 !important;
  display: flex; flex-direction: column;
  z-index: 1040;
  box-shadow: 4px 0 20px var(--xt-black-18);
}

.sidebar-header {
  height: 56px; padding: 0 12px;
  display: flex; align-items: center; justify-content: space-between;
  background-color: var(--xt-red) !important;
  border-bottom: 1px solid var(--xt-red-d2);
}

.sidebar-user {
  padding: 12px 14px; display: flex; align-items: center;
  background-color: var(--xt-red-d1) !important;
  border-bottom: 1px solid var(--xt-red-d2);
}

.brand-dot { width: 10px; height: 10px; border-radius: 9999px; background: var(--xt-white); display: inline-block; }

.sidebar-nav { flex: 1; padding: 8px; overflow: auto; }
.group { margin-bottom: 8px; }
.group-title { color: var(--xt-white-60); font-size: 12px; text-transform: uppercase; padding: 6px 8px; }

.item {
  display: flex; align-items: center;
  padding: 8px 10px; border-radius: 8px;
  color: var(--xt-white); text-decoration: none;
  transition: background .15s ease, transform .06s ease;
}
.item:hover { background: var(--xt-red-d1); color: var(--xt-white); }
.item.active { background: var(--xt-red-d1); box-shadow: inset 3px 0 0 var(--xt-white); }

.divider { border-color: var(--xt-white-10); }
.sidebar-footer { padding: 8px; border-top: 1px solid var(--xt-red-d2); }
</style>
