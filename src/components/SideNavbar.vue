<!-- src/components/SideNavbar.vue -->
<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";

const router = useRouter();
const route  = useRoute();
const auth   = useAuthStore();
const ui     = useUIStore();

const { empresaMenu, tallerMenu, adminMenu } = useRoleMenus();

const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
const role     = computed(() => (auth?.profile?.role || auth?.role || "").trim());
const photoUrl = computed(() =>
  auth?.user?.photoURL ||
  auth?.profile?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.value || auth?.user?.email || 'User')}&background=EEE&color=111`
);

const isDark   = computed(() => ui.isDark);
const isNavbar = computed(() => ui.isNavbar);

// -------- Navegación / cierre automático en móvil
const go = (loc) => {
  router.push(loc);
  ui.closeSidebar?.();
};
const logout = async () => {
  await auth.logout();
  router.replace({ name: "login" });
};

// proteger cuando nameOrPath sea null/undefined
const isActive = (nameOrPath) =>
  !!nameOrPath && (route.name === nameOrPath || route.path === nameOrPath);

// -------- Breakpoint reactivo (lg = 992px)
const winW = ref(typeof window !== "undefined" ? window.innerWidth : 1200);
const onResize = () => { winW.value = window.innerWidth; };
const isNarrow = computed(() => winW.value < 992);

// Bloquea scroll del body cuando el drawer está abierto en móvil
watch(() => ui.isSidebarOpen, (open) => {
  if (isNarrow.value) {
    document.body.style.overflow = open ? "hidden" : "";
  }
});

// ================= AJUSTES UNIFICADOS =================
const showSettings = ref(false);

// Estados locales sincronizados con el store
const localTheme    = ref(isDark.value ? "dark" : "light");
const localLayout   = ref(isNavbar.value ? "navbar" : "sidebar");
const localPrimary  = ref(ui.primary || "rojo");

watch(isDark,   v => { localTheme.value  = v ? "dark" : "light"; });
watch(isNavbar, v => { localLayout.value = v ? "navbar" : "sidebar"; });
watch(() => ui.primary, (p) => { if (p) localPrimary.value = p; });

const openSettings  = () => { showSettings.value = true; };
const closeSettings = () => { showSettings.value = false; };

const applySettings = async () => {
  await ui.setTheme(localTheme.value);          // clase en <html>
  await ui.setPrimary(localPrimary.value);      // actualiza --xt-red*
  await ui.setMenuStyle(localLayout.value);     // persiste en Firestore
  if (localLayout.value === "navbar") ui.closeSidebar?.();
  closeSettings();
};

// Eventos globales (ESC cierra ajustes o sidebar)
const onKey = (e) => {
  if (e.key === "Escape") {
    if (showSettings.value) closeSettings();
    else ui.closeSidebar?.();
  }
};

onMounted(() => {
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", onResize);
});

// Cerrar al cambiar de ruta (extra por si viene de links externos al menú)
watch(() => route.fullPath, () => ui.closeSidebar?.());

// Paleta para el grid (debe coincidir con PRIMARY_MAP del store)
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
  <!-- Backdrop solo en móvil (sidebar) -->
  <div
    v-if="ui.isSidebarOpen && isNarrow"
    class="sidebar-backdrop"
    @click="ui.closeSidebar?.()"
  ></div>

  <!-- Drawer: desktop visible, móvil entra/sale -->
  <aside
    class="app-sidebar"
    :class="{ 'is-open': ui.isSidebarOpen || !isNarrow }"
    aria-label="Menú lateral"
  >
    <div class="sidebar-header">
      <div class="d-flex align-items-center gap-2 w-100">
        <!-- Brand -->
        <router-link to="/" class="brand text-white text-decoration-none" @click="ui.closeSidebar?.()">
          Xtreme Solped
        </router-link>

        <!-- Botón AJUSTES (único) -->
        <button
          class="btn btn-sm btn-light ms-auto"
          @click.stop="openSettings"
          :aria-expanded="showSettings ? 'true' : 'false'"
          aria-haspopup="true"
          title="Ajustes"
        >
          <i class="bi bi-gear-fill"></i>
        </button>
      </div>
    </div>

    <!-- Usuario -->
    <div class="sidebar-user">
      <img :src="photoUrl" class="rounded-circle me-2" width="36" height="36" />
      <div class="d-flex flex-column">
        <strong class="text-white small">{{ fullName || 'Usuario' }}</strong>
        <span class="text-white-75 small">{{ role || '—' }}</span>
      </div>
    </div>

    <!-- Navegación -->
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

    <!-- Footer -->
    <div class="sidebar-footer">
      <a href="#" class="item" @click.prevent="go({ name: 'PerfilUsuario' })">
        <i class="bi bi-person-gear me-2"></i> Perfil
      </a>
      <a href="#" class="item" @click.prevent="logout">
        <i class="bi bi-box-arrow-right me-2"></i> Salir
      </a>
    </div>
  </aside>

  <!-- ====== MODAL de AJUSTES (centrado en pantalla) ====== -->
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

        <hr class="settings-divider" />

        <!-- COLOR PRIMARIO -->
        <div class="mb-1">
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

<!-- 🔴 BLOQUE GLOBAL: el color del sidebar viene de variables primarias -->
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

/* Utilidades */
.bg-xtreme { background-color: var(--xt-red) !important; }
.text-white-75{ color: var(--xt-white-75) !important; }
</style>

<!-- 🎯 BLOQUE SCOPED del componente -->
<style scoped>
/* Backdrop móvil */
.sidebar-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.56);
  z-index: 1039;
}

/* Drawer (usa variables primarias) */
.app-sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: 260px;
  background: var(--xt-red) !important;
  display: flex; flex-direction: column;
  z-index: 1040;
  box-shadow: 4px 0 20px var(--xt-black-18);
  will-change: transform;
  transition: transform .20s ease-out, box-shadow .2s ease-out;
}

/* Desktop >= lg: siempre visible */
@media (min-width: 992px){
  .app-sidebar { transform: translateX(0); }
}

/* Mobile < lg: oculto por defecto como drawer */
@media (max-width: 991.98px){
  .app-sidebar { transform: translateX(-102%); }
  .app-sidebar.is-open { transform: translateX(0); }
}

.sidebar-header {
  position: relative;
  height: 56px; padding: 0 12px;
  display: flex; align-items: center; justify-content: center;
  /* Degradado usando primario */
  background: linear-gradient(135deg, var(--xt-red), var(--xt-red-d2)) !important;
  border-bottom: 1px solid var(--xt-red-d2);
  color: var(--xt-white);
}

.brand{ font-weight: 700; letter-spacing: .2px; }

.sidebar-user {
  padding: 12px 14px; display: flex; align-items: center;
  background: linear-gradient(135deg, var(--xt-red-d1), var(--xt-red-d2)) !important;
  border-bottom: 1px solid var(--xt-red-d2);
  color: var(--xt-white);
}

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

/* ======= MODAL CENTRADO DE AJUSTES (idéntico al TopNavbar) ======= */
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
  background: #ffffff;             /* sólido (modo claro) */
  color: #1f2937;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow:
    0 14px 40px rgba(0,0,0,.30),
    0 6px 18px rgba(0,0,0,.20);
  transform: translateY(-4px);
  animation: cardIn .16s ease-out both;
}
@keyframes cardIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }

/* Header con degradado según primario */
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

/* ======= Grid de colores (igual que TopNavbar) ======= */
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
  pointer-events: none;
}

/* ✅ Marca visual del color seleccionado (modo claro) */
.visually-hidden:checked + .swatch {
  outline: 2px solid #111827;
  outline-offset: 2px;
}
/* ✅ Resalto del contenedor con :has() si el navegador lo soporta */
.color-swatch:has(input.visually-hidden:checked) {
  border-color: var(--xt-red);
  box-shadow: 0 0 0 2px var(--xt-red) inset;
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
  background: #1f2937;          /* gris 800 */
  color: #e5e7eb;
  border-color: rgba(255,255,255,.06);
  box-shadow:
    0 16px 36px rgba(0,0,0,.50),
    0 6px 16px rgba(0,0,0,.35);
}
:global(html.theme-dark) .settings-card__footer{
  background: #111827;          /* gris 900 */
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
:global(html.theme-dark) .color-swatch{
  border-color: rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
}
:global(html.theme-dark) .color-swatch:hover{
  background: rgba(255,255,255,.05);
}
:global(html.theme-dark) .color-swatch:has(input.visually-hidden:checked){
  border-color: var(--xt-white-60);
  box-shadow: 0 0 0 2px var(--xt-white-60) inset;
  background: rgba(255,255,255,.06);
}
:global(html.theme-dark) .swatch-label{ color: #e5e7eb; }
</style>
