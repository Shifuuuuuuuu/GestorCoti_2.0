<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUIStore();

const isDark = computed(() => ui.isDark);
const toggleTheme = () => ui.toggleTheme();

const { empresaMenu, tallerMenu, adminMenu } = useRoleMenus();

const isActive = (nameOrPath) =>
  route.name === nameOrPath || route.path === nameOrPath;

const showEmpresaMenu = computed(() => empresaMenu.value.length > 0);
const showTallerMenu = computed(() => tallerMenu.value.length > 0);
const showAdminMenu = computed(() => adminMenu.value.length > 0);

const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());
const photoUrl = computed(() =>
  auth?.user?.photoURL ||
  auth?.profile?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.value || auth?.user?.email || 'User')}&background=EEE&color=111`
);

const closeCollapse = () => {
  const el = document.getElementById("mainNavbar");
  if (!el) return;
  const bs = window.bootstrap?.Collapse || window.bootstrap;
  if (!bs) return;
  const instance = bs.getInstance ? bs.getInstance(el) : null;
  instance?.hide?.();
};
const go = (loc) => { router.push(loc); closeCollapse(); };
const logout = async () => { await auth.logout(); router.replace({ name: "login" }); };

const switching = ref(false);
const switchTo = async (style) => {
  switching.value = true;
  await ui.setMenuStyle(style);
  // no recarga necesaria si AppShell switch-ea por estado
  switching.value = false;
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-xtreme fixed-top shadow-sm">
    <div class="container-fluid">
      <!-- Toggle Sidebar/Nav -->
      <button
        class="btn btn-sm btn-light me-2"
        :disabled="switching"
        @click="switchTo(ui.isNavbar ? 'sidebar' : 'navbar')"
        title="Cambiar estilo de menú"
      >
        <i :class="ui.isNavbar ? 'bi bi-layout-sidebar-inset' : 'bi bi-menu-up'"></i>
      </button>

      <!-- Toggler colapso -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <button class="btn btn-sm btn-light" @click="toggleTheme" title="Cambiar tema">
        <i v-if="isDark" class="bi bi-sun"></i>
        <i v-else class="bi bi-moon"></i>
      </button>
      <!-- Brand -->
      <router-link to="/" class="navbar-brand d-flex align-items-center gap-2">
        <span class="fw-semibold">Xtreme Disponibilidad</span>
      </router-link>

      <div class="collapse navbar-collapse" id="mainNavbar">
        <!-- IZQUIERDA -->
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- EMPRESA -->
          <li v-if="showEmpresaMenu" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
              Empresa
            </a>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in empresaMenu" :key="'em-'+idx">
                <hr v-if="item===null" class="dropdown-divider" />
                <a v-else class="dropdown-item" :class="{ active: isActive(item.name) }" @click.prevent="go({ name: item.name })">
                  <i :class="['bi me-2', item.icon]"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>

          <!-- TALLER -->
          <li v-if="showTallerMenu" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Taller</a>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in tallerMenu" :key="'ta-'+idx">
                <hr v-if="item===null" class="dropdown-divider" />
                <a v-else class="dropdown-item" :class="{ active: isActive(item.name) }" @click.prevent="go({ name: item.name })">
                  <i :class="['bi me-2', item.icon]"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>

          <!-- ADMIN -->
          <li v-if="showAdminMenu" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Admin</a>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in adminMenu" :key="'ad-'+idx">
                <hr v-if="item===null" class="dropdown-divider" />
                <a v-else class="dropdown-item" :class="{ active: isActive(item.name) }" @click.prevent="go({ name: item.name })">
                  <i :class="['bi me-2', item.icon]"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <!-- DERECHA -->
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0" v-if="auth?.isAuthenticated">
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
              <img :src="photoUrl" class="rounded-circle" width="28" height="28" />
              <span class="d-none d-sm-inline">{{ fullName || auth?.user?.email || 'Usuario' }}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li class="px-3 py-2 small text-muted">Rol: <strong>{{ role || '—' }}</strong></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="go({ name: 'PerfilUsuario' })">
                  <i class="bi bi-person-gear me-2"></i>Perfil
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="logout">
                  <i class="bi bi-box-arrow-right me-2"></i>Salir
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <div v-else class="ms-auto">
          <router-link class="btn btn-sm btn-light" to="/login">Ingresar</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.bg-xtreme { background: #c62828; }
.brand-dot { width: 12px; height: 12px; border-radius: 9999px; background: #fff; display: inline-block; }
</style>
