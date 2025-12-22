<!-- src/components/TopNavbar.vue -->
<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";
import BrandCarousel from "@/components/BrandCarousel.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUIStore();

const isDark = computed(() => ui.isDark);
const isNavbar = computed(() => ui.isNavbar);

const { empresaMenu, tallerMenu, adminMenu, recepcionMenu } = useRoleMenus();
const showRecepcionMenu = computed(() => recepcionMenu.value.length > 0);

const isActive = (nameOrPath) =>
  !!nameOrPath && (route.name === nameOrPath || route.path === nameOrPath);

const showEmpresaMenu = computed(() => empresaMenu.value.length > 0);
const showTallerMenu = computed(() => tallerMenu.value.length > 0);
const showAdminMenu = computed(() => adminMenu.value.length > 0);

const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());
const photoUrl = computed(() =>
  auth?.user?.photoURL ||
  auth?.profile?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName.value || auth?.user?.email || "User"
  )}&background=EEE&color=111`
);

const winW = ref(typeof window !== "undefined" ? window.innerWidth : 1200);
const onResize = () => (winW.value = window.innerWidth);
const isMobile = computed(() => winW.value < 992);

const carouselW = computed(() => (isMobile.value ? 170 : 210));
const carouselH = computed(() => (isMobile.value ? 30 : 34));


const isMenuOpen = ref(false);
function setBodyScrollLocked(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
  document.documentElement.style.overflow = "";
}
const showSettings = ref(false);
function syncScrollLock() {
  setBodyScrollLocked(showSettings.value || isMenuOpen.value);
}


const collapseRef = ref(null);
let collapseInst = null;

function getCollapse() {
  const BS = window.bootstrap?.Collapse;
  if (!BS || !collapseRef.value) return null;
  collapseInst = BS.getOrCreateInstance(collapseRef.value, { toggle: false });
  return collapseInst;
}
function toggleCollapse() {
  getCollapse()?.toggle();
}
function closeCollapse() {
  getCollapse()?.hide();
}


const dropdownToggles = ref([]);
function setDropdownToggle(el) {
  if (el && !dropdownToggles.value.includes(el)) dropdownToggles.value.push(el);
}

function initDropdowns() {
  const Dropdown = window.bootstrap?.Dropdown;
  if (!Dropdown) return;

  dropdownToggles.value.forEach((el) => {
    Dropdown.getOrCreateInstance(el, {
      autoClose: true,
      boundary: "clippingParents",
    });
  });
}

function closeAllDropdowns() {
  const Dropdown = window.bootstrap?.Dropdown;
  if (!Dropdown) return;
  dropdownToggles.value.forEach((el) => Dropdown.getOrCreateInstance(el).hide());
}

async function refreshDropdowns() {
  await nextTick();
  initDropdowns();
}


const go = (loc) => {
  closeAllDropdowns();
  router.push(loc);
  closeCollapse();
};

const logout = async () => {
  closeAllDropdowns();
  await auth.logout();
  router.replace({ name: "login" });
  closeCollapse();
};

const goInicioFromCarousel = () => {
  closeAllDropdowns();
  if (route.name !== "Inicio") router.push({ name: "Inicio" });
  closeCollapse();
};

function handleDocClick(e) {
  if (!collapseRef.value) return;
  const isShown = collapseRef.value.classList.contains("show");
  if (!isShown) return;

  const nav = collapseRef.value.closest(".navbar");
  if (nav && !nav.contains(e.target)) closeCollapse();
}

const onKey = (e) => {
  if (e.key === "Escape") {
    if (showSettings.value) showSettings.value = false;
    else closeCollapse();
  }
};


const localTheme = ref(isDark.value ? "dark" : "light");
const localLayout = ref(isNavbar.value ? "navbar" : "sidebar");
const localPrimary = ref(ui.primary || "rojo");

watch(isDark, (v) => (localTheme.value = v ? "dark" : "light"));
watch(isNavbar, (v) => (localLayout.value = v ? "navbar" : "sidebar"));
watch(() => ui.primary, (p) => p && (localPrimary.value = p));

const openSettings = () => (showSettings.value = true);
const closeSettings = () => (showSettings.value = false);

const openSettingsFromUserMenu = () => {
  closeAllDropdowns();
  closeCollapse();
  openSettings();
};

const applySettings = async () => {
  await ui.setTheme(localTheme.value);
  await ui.setPrimary(localPrimary.value);
  await ui.setMenuStyle(localLayout.value);
  if (localLayout.value === "sidebar") closeCollapse();
  closeSettings();
};

const PRIMARY_OPTIONS = [
  { k: "turquesa", n: "Turquesa", c: "#0d9488" },
  { k: "azul", n: "Azul", c: "#2563eb" },
  { k: "verde", n: "Verde", c: "#16a34a" },
  { k: "rojo", n: "Rojo", c: "#c62828" },
  { k: "amarillo", n: "Amarillo", c: "#f59e0b" },
  { k: "rosado", n: "Rosado", c: "#db2777" },
  { k: "celeste", n: "Celeste", c: "#06b6d4" },
  { k: "violeta", n: "Violeta", c: "#7c3aed" },
  { k: "naranjo", n: "Naranjo", c: "#f97316" },
  { k: "gris", n: "Gris", c: "#6b7280" },
  { k: "negro", n: "Negro", c: "#111827" },
  { k: "lima", n: "Lima", c: "#84cc16" },
  { k: "esmeralda", n: "Esmeralda", c: "#10b981" },
  { k: "cian", n: "Cian", c: "#0891b2" },
  { k: "indigo", n: "Índigo", c: "#4f46e5" },
  { k: "marron", n: "Marrón", c: "#8b5e34" },
  { k: "granate", n: "Granate", c: "#991b1b" },
  { k: "oliva", n: "Oliva", c: "#708238" },
  { k: "menta", n: "Menta", c: "#2dd4bf" },
  { k: "salmon", n: "Salmón", c: "#fb7185" },
  { k: "dorado", n: "Dorado", c: "#d4af37" },
  { k: "cobre", n: "Cobre", c: "#b87333" },
];

function onShown() {
  isMenuOpen.value = true;
  syncScrollLock();
}
function onHidden() {
  isMenuOpen.value = false;
  syncScrollLock();
}
function bindCollapseEvents() {
  const el = collapseRef.value;
  if (!el) return;
  el.removeEventListener("shown.bs.collapse", onShown);
  el.removeEventListener("hidden.bs.collapse", onHidden);
  el.addEventListener("shown.bs.collapse", onShown);
  el.addEventListener("hidden.bs.collapse", onHidden);
}

/* ---------- lifecycle ---------- */
onMounted(() => {
  setBodyScrollLocked(false);

  getCollapse();
  initDropdowns();
  bindCollapseEvents();

  document.addEventListener("click", handleDocClick);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);

  syncScrollLock();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocClick);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", onResize);

  setBodyScrollLocked(false);

  const Dropdown = window.bootstrap?.Dropdown;
  if (Dropdown) dropdownToggles.value.forEach((el) => Dropdown.getInstance(el)?.dispose?.());
  dropdownToggles.value = [];
  collapseInst = null;
});

watch([showEmpresaMenu, showTallerMenu, showRecepcionMenu, showAdminMenu], () => refreshDropdowns());
watch(() => auth?.isAuthenticated, () => refreshDropdowns());
watch(showSettings, () => syncScrollLock());
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-xtreme fixed-top shadow-sm">
    <div class="container-fluid">

      <div class="top-row d-lg-none">
        <button
          class="navbar-toggler"
          type="button"
          @click.stop="toggleCollapse"
          aria-controls="mainNavbar"
          :aria-expanded="false"
          aria-label="Alternar navegación"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <button
          type="button"
          class="brand-hit ms-2"
          @click="goInicioFromCarousel"
          aria-label="Ir a Inicio"
          title="Ir a Inicio"
        >
          <BrandCarousel id="topBrandCarousel" :height="carouselH" :width="carouselW" />
        </button>
      </div>


      <button
        type="button"
        class="brand-hit d-none d-lg-inline-flex align-items-center"
        @click="goInicioFromCarousel"
        aria-label="Ir a Inicio"
        title="Ir a Inicio"
      >
        <BrandCarousel id="topBrandCarouselDesktop" :height="carouselH" :width="carouselW" />
      </button>


      <button
        class="navbar-toggler d-none"
        type="button"
        aria-hidden="true"
      ></button>

      <div class="collapse navbar-collapse w-100 mt-2 mt-lg-0" id="mainNavbar" ref="collapseRef">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li v-if="showEmpresaMenu" class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              data-bs-auto-close="true"
              ref="setDropdownToggle"
            >
              Empresa
            </button>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in empresaMenu" :key="'em-' + idx">
                <hr v-if="item === null" class="dropdown-divider" />
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  href="#"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>

          <li v-if="showTallerMenu" class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              data-bs-auto-close="true"
              ref="setDropdownToggle"
            >
              Taller
            </button>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in tallerMenu" :key="'ta-' + idx">
                <hr v-if="item === null" class="dropdown-divider" />
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  href="#"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>

          <li v-if="showAdminMenu" class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              data-bs-auto-close="true"
              ref="setDropdownToggle"
            >
              Admin
            </button>
            <ul class="dropdown-menu">
              <li v-for="(item, idx) in adminMenu" :key="'ad-' + idx">
                <hr v-if="item === null" class="dropdown-divider" />
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  href="#"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>
          <li v-if="showRecepcionMenu" class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              data-bs-auto-close="true"
              ref="setDropdownToggle"
            >
              Recepción
            </button>

            <ul class="dropdown-menu">
              <li v-for="(item, idx) in recepcionMenu" :key="'re-' + idx">
                <hr v-if="item === null" class="dropdown-divider" />
                <a
                  v-else
                  class="dropdown-item"
                  :class="{ active: isActive(item.name) }"
                  href="#"
                  @click.prevent="go({ name: item.name })"
                >
                  <i v-if="item.icon" :class="['bi', item.icon, 'me-2']"></i>{{ item.text }}
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto mb-2 mb-lg-0" v-if="auth?.isAuthenticated">
          <li class="nav-item dropdown">
            <button
              type="button"
              class="nav-link dropdown-toggle d-flex align-items-center gap-2"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              data-bs-auto-close="true"
              ref="setDropdownToggle"
            >
              <img :src="photoUrl" class="rounded-circle" width="28" height="28" />
              <span class="d-none d-sm-inline">{{ fullName || auth?.user?.email || "Usuario" }}</span>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li class="px-3 pt-2 pb-1 small text-muted">Rol: <strong>{{ role || "—" }}</strong></li>

              <li>
                <a class="dropdown-item" href="#" @click.prevent="openSettingsFromUserMenu">
                  <i class="bi bi-gear-fill me-2"></i> Configuración
                </a>
              </li>

              <li><hr class="dropdown-divider" /></li>

              <li>
                <a class="dropdown-item" href="#" @click.prevent="go({ name: 'PerfilUsuario' })">
                  <i class="bi bi-person-gear me-2"></i> Perfil
                </a>
              </li>

              <li>
                <a class="dropdown-item" href="#" @click.prevent="logout">
                  <i class="bi bi-box-arrow-right me-2"></i> Salir
                </a>
              </li>
            </ul>
          </li>
        </ul>

        <div v-else class="ms-auto">
          <router-link class="btn btn-sm btn-light" to="/login" @click="closeCollapse">
            Ingresar
          </router-link>
        </div>
      </div>
    </div>
  </nav>


  <div v-if="showSettings" class="settings-overlay" role="dialog" aria-modal="true" @click.self="closeSettings">
    <div class="settings-card settings-card--center">
      <div class="settings-card__header">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-sliders-2"></i>
          <strong>Preferencias</strong>
        </div>
        <button class="btn-close btn-close-white ms-auto" @click="closeSettings" aria-label="Cerrar"></button>
      </div>

      <div class="settings-card__body">
        <div class="mb-3">
          <div class="settings-label">Tema</div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Tema">
            <input type="radio" class="btn-check" name="theme" id="t-light" value="light" v-model="localTheme" />
            <label class="btn settings-pill" for="t-light"><i class="bi bi-brightness-high me-1"></i> Claro</label>

            <input type="radio" class="btn-check" name="theme" id="t-dark" value="dark" v-model="localTheme" />
            <label class="btn settings-pill" for="t-dark"><i class="bi bi-moon-stars me-1"></i> Oscuro</label>
          </div>
        </div>

        <div class="mb-2">
          <div class="settings-label">Estilo de menú</div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Estilo de menú">
            <input type="radio" class="btn-check" name="layout" id="m-navbar" value="navbar" v-model="localLayout" />
            <label class="btn settings-pill" for="m-navbar"><i class="bi bi-menu-button-wide me-1"></i> Barra superior</label>

            <input type="radio" class="btn-check" name="layout" id="m-sidebar" value="sidebar" v-model="localLayout" />
            <label class="btn settings-pill" for="m-sidebar"><i class="bi bi-layout-sidebar-inset me-1"></i> Menú lateral</label>
          </div>
        </div>

        <hr class="settings-divider" />

        <div class="mb-3">
          <div class="settings-label">Color primario</div>
          <div class="color-grid">
            <label v-for="opt in PRIMARY_OPTIONS" :key="opt.k" class="color-swatch" :title="opt.n">
              <input type="radio" class="visually-hidden" name="primary" :id="'p-' + opt.k" :value="opt.k" v-model="localPrimary" />
              <span class="swatch" :style="{ background: opt.c }"></span>
              <span class="swatch-label">{{ opt.n }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-card__footer">
        <button class="btn btn-sm btn-outline-light-subtle" @click="closeSettings">Cerrar</button>
        <button class="btn btn-sm btn-light" @click="applySettings"><i class="bi bi-check2-circle me-1"></i> Guardar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-xtreme { background: var(--xt-red) !important; }
.navbar .navbar-toggler { box-shadow: none !important; }
.navbar .nav-link.dropdown-toggle { background: transparent; border: 0; }


.top-row{
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
}

.brand-hit{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
  border-radius: 10px;
  touch-action: pan-y;
}
.brand-hit:focus{ outline: none; }
.brand-hit:focus-visible{
  outline: 2px solid rgba(255,255,255,.85);
  outline-offset: 4px;
}


@media (max-width: 991.98px){
  #mainNavbar{
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  #mainNavbar .navbar-nav .dropdown-menu{
    position: static;
    float: none;
    margin-top: .25rem;
  }
}


.settings-overlay{
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.56);
  z-index: 2001;
  padding: 20px;
}
.settings-card{
  border-radius: 14px;
  overflow: hidden;
  width: min(460px, 92vw);
  background: #ffffff;
  color: #1f2937;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 14px 40px rgba(0,0,0,.30), 0 6px 18px rgba(0,0,0,.20);
}
.settings-card__header{
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--xt-red), var(--xt-red-d2));
  color: #fff;
}
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
.settings-pill{
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 10px;
  line-height: 1;
  font-weight: 600;
  color: #374151;
}
.color-grid{
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 10px;
}
.color-swatch{
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 10px;
  background: rgba(0,0,0,.02);
  cursor: pointer;
}
.swatch{
  width: 20px; height: 20px; border-radius: 999px;
  box-shadow: 0 0 0 2px #fff inset, 0 1px 4px rgba(0,0,0,.25);
}
.swatch-label{ font-size: .875rem; font-weight: 600; color: #374151; }
.visually-hidden{ position: absolute !important; opacity: 0; }
</style>
