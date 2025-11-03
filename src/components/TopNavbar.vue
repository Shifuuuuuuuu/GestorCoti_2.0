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

/* ---------- Collapse 100% controlado por JS ---------- */
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

const go = (loc) => { router.push(loc); closeCollapse(); };
const logout = async () => { await auth.logout(); router.replace({ name: "login" }); };

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

/* ============== AJUSTES (overlay centrado, igual que en SideNavbar) ============== */
const showSettings  = ref(false);
const localTheme    = ref(isDark.value ? "dark" : "light");
const localLayout   = ref(isNavbar.value ? "navbar" : "sidebar");
const localPrimary  = ref(ui.primary || "rojo");

watch(isDark,   v => { localTheme.value   = v ? "dark" : "light"; });
watch(isNavbar, v => { localLayout.value  = v ? "navbar" : "sidebar"; });
watch(() => ui.primary, p => { if (p) localPrimary.value = p; });

const openSettings  = () => { showSettings.value = true; };
const closeSettings = () => { showSettings.value = false; };

const applySettings = async () => {
  await ui.setTheme(localTheme.value);        // clase en <html>
  await ui.setPrimary(localPrimary.value);    // actualiza --xt-red, --xt-red-d1, --xt-red-d2
  await ui.setMenuStyle(localLayout.value);   // persiste estilo
  if (localLayout.value === "sidebar") closeCollapse();
  closeSettings();
};

// ESC cierra overlay y/o collapse
const onKey = (e) => {
  if (e.key === "Escape") {
    if (showSettings.value) closeSettings();
    else closeCollapse();
  }
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

/* Paleta visual (debe coincidir con PRIMARY_MAP del store) */
const PRIMARY_OPTIONS = [
  {k:'turquesa', n:'Turquesa', c:'#0d9488'},
  {k:'azul',     n:'Azul',     c:'#2563eb'},
  {k:'verde',    n:'Verde',    c:'#16a34a'},
  {k:'rojo',     n:'Rojo',     c:'#c62828'},
  {k:'amarillo', n:'Amarillo', c:'#f59e0b'},
  {k:'rosado',   n:'Rosado',   c:'#db2777'},
  {k:'celeste',  n:'Celeste',  c:'#06b6d4'},
  {k:'violeta',  n:'Violeta',  c:'#7c3aed'},
  {k:'naranjo',  n:'Naranjo',  c:'#f97316'},
  {k:'gris',     n:'Gris',     c:'#6b7280'},
  {k:'negro',    n:'Negro',    c:'#111827'},
  {k:'lima',     n:'Lima',     c:'#84cc16'},
  {k:'esmeralda',n:'Esmeralda',c:'#10b981'},
  {k:'cian',     n:'Cian',     c:'#0891b2'},
  {k:'indigo',   n:'Índigo',   c:'#4f46e5'},
  {k:'marron',   n:'Marrón',   c:'#8b5e34'},
  {k:'granate',  n:'Granate',  c:'#991b1b'},
  {k:'oliva',    n:'Oliva',    c:'#708238'},
  {k:'menta',    n:'Menta',    c:'#2dd4bf'},
  {k:'salmon',   n:'Salmón',   c:'#fb7185'},
  {k:'dorado',   n:'Dorado',   c:'#d4af37'},
  {k:'cobre',    n:'Cobre',    c:'#b87333'},
];
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-xtreme fixed-top shadow-sm">
    <div class="container-fluid align-items-center">

      <!-- Brand -->
      <router-link to="/" class="navbar-brand fw-semibold me-2 order-1">
        Xtreme Disponibilidad
      </router-link>

      <!-- Grupo derecho (móvil): hamburguesa + Ajustes -->
      <div class="d-flex align-items-center ms-auto order-3 gap-2">
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

        <!-- Botón Ajustes (abre overlay centrado) -->
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

  <!-- ====== MODAL de AJUSTES (idéntico a SideNavbar) ====== -->
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

        <hr class="settings-divider" />

        <!-- COLOR PRIMARIO -->
        <div class="mb-3">
          <div class="settings-label">Color primario</div>
          <div class="color-grid">
            <label
              v-for="opt in PRIMARY_OPTIONS"
              :key="opt.k"
              class="color-swatch"
              :title="opt.n"
            >
              <input
                type="radio"
                class="visually-hidden"
                name="primary"
                :id="'p-'+opt.k"
                :value="opt.k"
                v-model="localPrimary"
              />
              <span class="swatch" :style="{ background: opt.c }"></span>
              <span class="swatch-label">{{ opt.n }}</span>
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
/* 🔁 El topbar usa la variable primaria (que cambia con ui.setPrimary) */
.bg-xtreme { background: var(--xt-red) !important; }

/* Botones en la navbar */
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

/* ======= MODAL CENTRADO DE AJUSTES (idéntico) ======= */
.settings-overlay{
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.56);
  z-index: 2001;
  padding: 20px;
  animation: overlayIn .12s ease-out both;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.settings-card{
  border-radius: 14px;
  overflow: hidden;
  width: min(460px, 92vw);
  background: #ffffff;
  color: #1f2937;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow:
    0 14px 40px rgba(0,0,0,.30),
    0 6px 18px rgba(0,0,0,.20);
  transform: translateY(-4px);
  animation: cardIn .16s ease-out both;
}
@keyframes cardIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }

/* Header con degradado según primario (igual al SideNavbar) */
.settings-card__header{
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--xt-red), var(--xt-red-d2));
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

/* Etiquetas y divisores */
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

/* ======= Grid de colores ======= */
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
  transition: .12s ease;
  user-select: none;
}
.color-swatch:hover{ background: rgba(0,0,0,.04); }
.swatch{
  width: 20px; height: 20px; border-radius: 999px;
  box-shadow: 0 0 0 2px #fff inset, 0 1px 4px rgba(0,0,0,.25);
}
.swatch-label{
  font-size: .875rem; font-weight: 600; color: #374151;
}

/* Radios ocultos pero clickeables (van dentro del label) */
.visually-hidden{
  position: absolute !important;
  opacity: 0;
}

/* ✅ Marca visual del seleccionado (modo claro) */
.visually-hidden:checked + .swatch {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

/* ✅ Resalto del contenedor completo usando :has() (si el navegador lo soporta) */
.color-swatch:has(input.visually-hidden:checked) {
  border-color: var(--xt-red);
  box-shadow: 0 0 0 2px var(--xt-red, #c62828) inset;
  background: rgba(0,0,0,.04);
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

/* ======= Modo oscuro ======= */
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

/* Seleccionado en oscuro */
:global(html.theme-dark) .visually-hidden:checked + .swatch{
  outline: 2px solid #e5e7eb;
  outline-offset: 2px;
}
:global(html.theme-dark) .color-swatch:has(input.visually-hidden:checked){
  border-color: var(--xt-white-60);
  box-shadow: 0 0 0 2px var(--xt-white-60) inset;
  background: rgba(255,255,255,.06);
}
</style>
