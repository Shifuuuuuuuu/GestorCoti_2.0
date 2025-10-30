<!-- src/components/TopNavbar.vue -->
<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUIStore();

const isDark   = computed(() => ui.isDark);
const isNavbar = computed(() => ui.isNavbar);

const { empresaMenu, tallerMenu, adminMenu } = useRoleMenus();

const isActive = (nameOrPath) =>
  !!nameOrPath && (route.name === nameOrPath || route.path === nameOrPath);

const showEmpresaMenu = computed(() => empresaMenu.value.length > 0);
const showTallerMenu  = computed(() => tallerMenu.value.length > 0);
const showAdminMenu   = computed(() => adminMenu.value.length > 0);

const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());
const photoUrl = computed(() =>
  auth?.user?.photoURL ||
  auth?.profile?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.value || auth?.user?.email || 'User')}&background=EEE&color=111`
);

// -------- Collapse 100% controlado por JS (sin data-bs-*) --------
const collapseRef = ref(null);
let collapseInst = null;

function getCollapse() {
  const BS = window.bootstrap?.Collapse;
  if (!BS || !collapseRef.value) return null;
  collapseInst = BS.getOrCreateInstance(collapseRef.value, { toggle: false });
  return collapseInst;
}
function toggleCollapse() { getCollapse()?.toggle(); }
function closeCollapse()  { getCollapse()?.hide();  }
// cerrar al navegar
const go = (loc) => { router.push(loc); closeCollapse(); };
const logout = async () => { await auth.logout(); router.replace({ name: "login" }); };

// Cerrar collapse si clic fuera de la navbar
function handleDocClick(e) {
  if (!collapseRef.value) return;
  const isShown = collapseRef.value.classList.contains("show");
  if (!isShown) return;
  const nav = collapseRef.value.closest(".navbar");
  if (nav && !nav.contains(e.target)) closeCollapse();
}

onMounted(() => {
  getCollapse();
  document.addEventListener("click", handleDocClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocClick);
  collapseInst = null;
});

// ============== AJUSTES (overlay centrado, igual que en SideNavbar) ==============
const showSettings = ref(false);

// estados locales (reflejan el store)
const localTheme  = ref(isDark.value ? "dark" : "light");
const localLayout = ref(isNavbar.value ? "navbar" : "sidebar");
watch(isDark,   v => { localTheme.value  = v ? "dark" : "light"; });
watch(isNavbar, v => { localLayout.value = v ? "navbar" : "sidebar"; });

const openSettings  = () => { showSettings.value = true; };
const closeSettings = () => { showSettings.value = false; };

const applySettings = async () => {
  await ui.setTheme(localTheme.value);      // aplica clase al <html>
  await ui.setMenuStyle(localLayout.value); // persiste en Firestore
  if (localLayout.value === "sidebar") {
    // si pasas a sidebar desde navbar, cierra el collapse para no superponer
    closeCollapse();
  }
  closeSettings();
};

// ESC cierra overlay y también el collapse si estuviera abierto
const onKey = (e) => {
  if (e.key === "Escape") {
    if (showSettings.value) closeSettings();
    else closeCollapse();
  }
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-xtreme fixed-top shadow-sm">
    <div class="container-fluid align-items-center">

      <!-- Brand (izquierda) -->
      <router-link to="/" class="navbar-brand fw-semibold me-2 order-1">
        Xtreme Disponibilidad
      </router-link>

      <!-- Grupo derecho (móvil): hamburguesa + Ajustes -->
      <div class="d-flex align-items-center ms-auto order-3 gap-2">
        <!-- Hamburguesa (collapse controlado por JS) -->
        <button
          class="navbar-toggler d-lg-none"
          type="button"
          @click.stop="toggleCollapse"
          aria-controls="mainNavbar"
          :aria-expanded="false"
          aria-label="Alternar navegación"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- ÚNICO BOTÓN: Ajustes (abre overlay centrado) -->
        <button
          class="btn btn-sm btn-light"
          @click.stop="openSettings"
          title="Ajustes de interfaz"
          aria-haspopup="true"
          :aria-expanded="showSettings ? 'true' : 'false'"
        >
          <i class="bi bi-gear-fill"></i>
        </button>
      </div>



      <!-- CONTENIDO COLAPSABLE -->
      <div
        class="collapse navbar-collapse order-4 w-100 mt-2 mt-lg-0"
        id="mainNavbar"
        ref="collapseRef"
      >
        <!-- IZQUIERDA -->
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- EMPRESA -->
          <li v-if="showEmpresaMenu" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Empresa</a>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in empresaMenu" :key="'em-'+idx">
                <hr v-if="item===null" class="dropdown-divider" />
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
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
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
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
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
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
          <router-link class="btn btn-sm btn-light" to="/login" @click="closeCollapse">Ingresar</router-link>
        </div>
      </div>
    </div>
  </nav>

  <!-- ====== MODAL de AJUSTES (centrado en pantalla, igual al SideNavbar) ====== -->
  <div
    v-if="showSettings"
    class="settings-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Ajustes de interfaz"
    @click.self="closeSettings"
  >
    <div class="settings-card settings-card--center">
      <div class="settings-card__header">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-sliders-2"></i>
          <strong>Preferencias</strong>
        </div>
        <button class="btn-close btn-close-white ms-auto" @click="closeSettings" aria-label="Cerrar"></button>
      </div>

      <div class="settings-card__body">
        <!-- TEMA -->
        <div class="mb-3">
          <div class="settings-label">Tema</div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Tema">
            <input type="radio" class="btn-check" name="theme" id="t-light" value="light" v-model="localTheme">
            <label class="btn settings-pill" for="t-light">
              <i class="bi bi-brightness-high me-1"></i> Claro
            </label>

            <input type="radio" class="btn-check" name="theme" id="t-dark" value="dark" v-model="localTheme">
            <label class="btn settings-pill" for="t-dark">
              <i class="bi bi-moon-stars me-1"></i> Oscuro
            </label>
          </div>
        </div>

        <hr class="settings-divider" />

        <!-- LAYOUT -->
        <div class="mb-2">
          <div class="settings-label">Estilo de menú</div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Estilo de menú">
            <input type="radio" class="btn-check" name="layout" id="m-navbar" value="navbar" v-model="localLayout">
            <label class="btn settings-pill" for="m-navbar">
              <i class="bi bi-menu-button-wide me-1"></i> Barra superior
            </label>

            <input type="radio" class="btn-check" name="layout" id="m-sidebar" value="sidebar" v-model="localLayout">
            <label class="btn settings-pill" for="m-sidebar">
              <i class="bi bi-layout-sidebar-inset me-1"></i> Menú lateral
            </label>
          </div>
        </div>
      </div>

      <div class="settings-card__footer">
        <button class="btn btn-sm btn-outline-light-subtle" @click="closeSettings">Cerrar</button>
        <button class="btn btn-sm btn-light" @click="applySettings">
          <i class="bi bi-check2-circle me-1"></i> Guardar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-xtreme { background: #c62828; }

.navbar .btn,
.navbar .navbar-toggler{
  box-shadow: none !important;
}
.navbar .btn.btn-light,
.navbar .navbar-toggler{
  width: 40px; height: 40px; display: grid; place-items: center; padding: 0;
}

@media (max-width: 991.98px){
  .navbar{ z-index: 1050; }
  #mainNavbar .navbar-nav .dropdown-menu{
    position: static; float: none;
  }
}

/* ======= MODAL CENTRADO DE AJUSTES (mismo look que SideNavbar) ======= */
.settings-overlay{
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.48);
  z-index: 2001;
  padding: 16px;
  animation: overlayIn .12s ease-out both;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.settings-card{
  border-radius: 12px;
  overflow: hidden;
  width: min(420px, 92vw);
  background: #ffffff;
  color: #1f2937;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow:
    0 12px 36px rgba(0,0,0,.30),
    0 4px 14px rgba(0,0,0,.20);
  transform: translateY(-4px);
  animation: cardIn .16s ease-out both;
}
@keyframes cardIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }

.settings-card__header{
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #c62828, #8e1515);
  color: #fff;
}
.settings-card__header i{ font-size: 1.05rem; }

.settings-card__body{ padding: 16px 14px; }
.settings-card__footer{
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 14px;
  background: #fafafa;
  border-top: 1px solid rgba(0,0,0,.06);
}

.settings-label{
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .02em;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}
.settings-divider{
  border: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,.12), transparent);
  margin: 10px 0 12px;
}

/* Pills (radios bonitos) */
.settings-pill{
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 10px;
  line-height: 1;
  font-weight: 600;
  color: #374151;
  transition: all .12s ease;
}
.settings-pill:hover{ background: #e5e7eb; }
.btn-check:checked + .settings-pill{
  background: #111827;
  border-color: #111827;
  color: #fff;
}

/* Botón outline clarito para footer */
.btn-outline-light-subtle{
  --bs-btn-color: #374151;
  --bs-btn-border-color: #e5e7eb;
  --bs-btn-hover-bg: #f3f4f6;
  --bs-btn-hover-border-color: #d1d5db;
  --bs-btn-active-bg: #e5e7eb;
  --bs-btn-active-border-color: #d1d5db;
}

/* Modo oscuro */
:global(html.theme-dark) .settings-card{
  background: #1f2937;
  color: #e5e7eb;
  border-color: rgba(255,255,255,.06);
  box-shadow:
    0 16px 36px rgba(0,0,0,.50),
    0 6px 16px rgba(0,0,0,.35);
}
:global(html.theme-dark) .settings-card__footer{
  background: #111827;
  border-top-color: rgba(255,255,255,.06);
}
:global(html.theme-dark) .settings-label{ color: #9ca3af; }
:global(html.theme-dark) .settings-pill{
  background: #111827;
  border-color: #374151;
  color: #e5e7eb;
}
:global(html.theme-dark) .settings-pill:hover{ background: #0b1220; }
:global(html.theme-dark) .btn-check:checked + .settings-pill{
  background: #e5e7eb;
  border-color: #e5e7eb;
  color: #111827;
}
</style>
