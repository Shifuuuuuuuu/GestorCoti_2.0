<!-- src/components/SideNavbar.vue -->
<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authService";
import { useUIStore } from "@/stores/ui";
import { useRoleMenus } from "@/composables/useRoleMenus";
import BrandCarousel from "@/components/BrandCarousel.vue";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/stores/firebase";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const ui = useUIStore();

const { empresaMenu, tallerMenu, adminMenu, recepcionMenu } = useRoleMenus();

const fullName = computed(
  () =>
    (auth?.profile?.fullName ||
      auth?.profile?.Nombre_completo ||
      auth?.user?.displayName ||
      "").trim()
);

const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());

const photoUrl = computed(
  () =>
    auth?.user?.photoURL ||
    auth?.profile?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName.value || auth?.user?.email || "User"
    )}&background=EEE&color=111`
);

const isDark = computed(() => ui.isDark);
const isNavbar = computed(() => ui.isNavbar);

const appVersion = computed(
  // eslint-disable-next-line no-undef
  () => (typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__)
);

const go = (loc) => {
  router.push(loc);
  ui.closeSidebar?.();
};

const logout = async () => {
  await auth.logout();
  router.replace({ name: "login" });
  ui.closeSidebar?.();
};

const goInicioFromCarousel = () => {
  if (route.name !== "Inicio") router.push({ name: "Inicio" });
  ui.closeSidebar?.();
};

const isActive = (nameOrPath) =>
  !!nameOrPath && (route.name === nameOrPath || route.path === nameOrPath);

const winW = ref(typeof window !== "undefined" ? window.innerWidth : 1200);
const onResize = () => {
  winW.value = window.innerWidth;
};
const isNarrow = computed(() => winW.value < 992);

watch(
  () => ui.isSidebarOpen,
  (open) => {
    if (isNarrow.value) document.body.style.overflow = open ? "hidden" : "";
  }
);

watch(() => route.fullPath, () => ui.closeSidebar?.());

const showSettings = ref(false);

const localTheme = ref(isDark.value ? "dark" : "light");
const localLayout = ref(isNavbar.value ? "navbar" : "sidebar");
const localPrimary = ref(ui.primary || "rojo");

watch(isDark, (v) => {
  localTheme.value = v ? "dark" : "light";
});
watch(isNavbar, (v) => {
  localLayout.value = v ? "navbar" : "sidebar";
});
watch(
  () => ui.primary,
  (p) => {
    if (p) localPrimary.value = p;
  }
);

const openSettings = () => {
  showSettings.value = true;
};
const closeSettings = () => {
  showSettings.value = false;
};

const applySettings = async () => {
  await ui.setTheme(localTheme.value);
  await ui.setPrimary(localPrimary.value);
  await ui.setMenuStyle(localLayout.value);
  if (localLayout.value === "navbar") ui.closeSidebar?.();
  closeSettings();
};

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

const normalize = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isEditorRole = computed(
  () => normalize(role.value).replace(/\s+/g, "_") === "editor"
);

const unreadEmpresa = ref(0);
const unreadTaller = ref(0);

const empresaTimes = ref([]);
const tallerTimes = ref([]);

const empresaIds = ref(new Set());
const tallerIds = ref(new Set());


const bounceEmpresa = ref(false);
const bounceTaller = ref(false);
let bounceTimerEmp = null;
let bounceTimerTal = null;

function triggerBounceEmpresa() {
  bounceEmpresa.value = false;
  requestAnimationFrame(() => {
    bounceEmpresa.value = true;
    if (bounceTimerEmp) clearTimeout(bounceTimerEmp);
    bounceTimerEmp = setTimeout(() => (bounceEmpresa.value = false), 1100);
  });
}
function triggerBounceTaller() {
  bounceTaller.value = false;
  requestAnimationFrame(() => {
    bounceTaller.value = true;
    if (bounceTimerTal) clearTimeout(bounceTimerTal);
    bounceTimerTal = setTimeout(() => (bounceTaller.value = false), 1100);
  });
}

const isViewingEmpresa = computed(() => route.name === "historial-solped");
const isViewingTaller = computed(() => route.name === "HistorialSolpedTaller");


const SEEN_KEY_EMPRESA = computed(() => `seen_solpes_empresa_${auth?.user?.uid || "anon"}`);
const SEEN_KEY_TALLER  = computed(() => `seen_solpes_taller_${auth?.user?.uid || "anon"}`);

const getSeen = (k) => Number(localStorage.getItem(k) || "0");
const setSeen = (k, ms) => localStorage.setItem(k, String(ms));


function getStartOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isPendingStatus(estatus) {
  const e = normalize(estatus);
  return e === "pendiente" || e.includes("pendiente");
}

function tsToMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") {
    const nanos = typeof ts.nanoseconds === "number" ? ts.nanoseconds : 0;
    return ts.seconds * 1000 + Math.floor(nanos / 1e6);
  }
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

function getMsFromSolpeEmpresa(d) {
  const msTs = tsToMs(d?.createdAt) || tsToMs(d?.fecha_str);
  if (msTs) return msTs;

  const iso = String(d?.fecha || "").trim();
  const ms = iso ? Date.parse(iso) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function getMsFromSolpeTaller(d) {
  const msTs = tsToMs(d?.creado_en) || tsToMs(d?.updated_at);
  if (msTs) return msTs;

  const iso = String(d?.fecha || "").trim();
  const ms = iso ? Date.parse(iso) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function toNameString(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    return (
      v?.Nombre_completo ||
      v?.nombre ||
      v?.fullName ||
      v?.name ||
      v?.displayName ||
      ""
    );
  }
  return "";
}

function arrayHasName(arr, myNorm) {
  const tokens = myNorm.split(" ").filter(Boolean);
  const list = Array.isArray(arr) ? arr : [];

  return list.some((it) => {
    const s = normalize(toNameString(it));
    if (!s) return false;
    if (s === myNorm) return true;
    if (s.includes(myNorm)) return true;
    return tokens.length ? tokens.every((t) => s.includes(t)) : false;
  });
}

function playNotif() {
  try {
    const a = new Audio("/notif.mp3");
    a.volume = 0.25;
    a.play().catch(() => {});
  } catch(e) {console.log(e)}
}


function recomputeUnread() {
  const since = getStartOfTodayMs();

  const seenEmpresa = getSeen(SEEN_KEY_EMPRESA.value);
  const seenTaller = getSeen(SEEN_KEY_TALLER.value);

  const minEmpresa = Math.max(since, seenEmpresa);
  const minTaller = Math.max(since, seenTaller);

  unreadEmpresa.value = isViewingEmpresa.value
    ? 0
    : empresaTimes.value.filter((t) => t > minEmpresa).length;

  unreadTaller.value = isViewingTaller.value
    ? 0
    : tallerTimes.value.filter((t) => t > minTaller).length;

  if (!isViewingEmpresa.value && unreadEmpresa.value > 0) triggerBounceEmpresa();
  if (!isViewingTaller.value && unreadTaller.value > 0) triggerBounceTaller();
}

function markSeenEmpresa() {
  setSeen(SEEN_KEY_EMPRESA.value, Date.now());
  recomputeUnread();
}
function markSeenTaller() {
  setSeen(SEEN_KEY_TALLER.value, Date.now());
  recomputeUnread();
}

watch(
  () => route.name,
  (name) => {
    if (!isEditorRole.value) return;
    if (name === "historial-solped") markSeenEmpresa();
    if (name === "HistorialSolpedTaller") markSeenTaller();
  },
  { immediate: true }
);

let unsubEmpresa = null;
let unsubTaller = null;
let badgeTimer = null;

function startBadges() {
  if (!isEditorRole.value) return;

  const myNameRaw = String(
    auth?.profile?.Nombre_completo ||
      auth?.profile?.fullName ||
      auth?.user?.displayName ||
      fullName.value ||
      ""
  ).trim();

  const myNorm = normalize(myNameRaw);
  if (!myNorm) return;

  unsubEmpresa = onSnapshot(
    query(collection(db, "solpes"), where("estatus", "==", "Pendiente")),
    (snap) => {
      const since = getStartOfTodayMs();

      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const mine = raw.filter((d) => arrayHasName(d?.dirigidoA, myNorm));
      const pendingAll = mine.filter((d) => isPendingStatus(d?.estatus));

      const todayDocs = pendingAll.filter((d) => {
        const ms = getMsFromSolpeEmpresa(d);
        return ms && ms >= since;
      });

      const newIds = new Set(todayDocs.map((x) => x.id));
      const prevIds = empresaIds.value;
      const isFirstLoad = prevIds.size === 0;
      const added = [...newIds].filter((id) => !prevIds.has(id));

      if (isViewingEmpresa.value) {
        if (todayDocs.length) setSeen(SEEN_KEY_EMPRESA.value, Date.now());
      } else {
        if (added.length && !isFirstLoad) {
          playNotif();
          triggerBounceEmpresa();
        }
      }

      empresaIds.value = newIds;
      empresaTimes.value = todayDocs.map(getMsFromSolpeEmpresa).filter(Boolean);

      recomputeUnread();
    }
  );

  unsubTaller = onSnapshot(
    query(collection(db, "solped_taller"), where("estatus", "==", "Pendiente")),
    (snap) => {
      const since = getStartOfTodayMs();

      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const mine = raw.filter((d) => arrayHasName(d?.cotizadores, myNorm));
      const pendingAll = mine.filter((d) => isPendingStatus(d?.estatus));

      const todayDocs = pendingAll.filter((d) => {
        const ms = getMsFromSolpeTaller(d);
        return ms && ms >= since;
      });

      const newIds = new Set(todayDocs.map((x) => x.id));
      const prevIds = tallerIds.value;
      const isFirstLoad = prevIds.size === 0;
      const added = [...newIds].filter((id) => !prevIds.has(id));

      if (isViewingTaller.value) {
        if (todayDocs.length) setSeen(SEEN_KEY_TALLER.value, Date.now());
      } else {
        if (added.length && !isFirstLoad) {
          playNotif();
          triggerBounceTaller();
        }
      }

      tallerIds.value = newIds;
      tallerTimes.value = todayDocs.map(getMsFromSolpeTaller).filter(Boolean);

      recomputeUnread();
    }
  );


  badgeTimer = window.setInterval(() => {
    const since = getStartOfTodayMs();
    empresaTimes.value = empresaTimes.value.filter((ms) => ms >= since);
    tallerTimes.value = tallerTimes.value.filter((ms) => ms >= since);
    recomputeUnread();
  }, 60 * 1000);
}

function stopBadges() {
  if (unsubEmpresa) unsubEmpresa();
  if (unsubTaller) unsubTaller();
  unsubEmpresa = null;
  unsubTaller = null;

  if (badgeTimer) window.clearInterval(badgeTimer);
  badgeTimer = null;

  if (bounceTimerEmp) clearTimeout(bounceTimerEmp);
  if (bounceTimerTal) clearTimeout(bounceTimerTal);
  bounceTimerEmp = null;
  bounceTimerTal = null;

  empresaIds.value = new Set();
  tallerIds.value = new Set();
  empresaTimes.value = [];
  tallerTimes.value = [];
  unreadEmpresa.value = 0;
  unreadTaller.value = 0;
  bounceEmpresa.value = false;
  bounceTaller.value = false;
}

onMounted(() => startBadges());
onBeforeUnmount(() => stopBadges());


watch(
  () => [auth?.user?.uid, fullName.value, role.value, isEditorRole.value],
  () => {
    stopBadges();
    startBadges();
  }
);
</script>

<template>
  <div v-if="ui.isSidebarOpen && isNarrow" class="sidebar-backdrop" @click="ui.closeSidebar?.()"></div>

  <aside class="app-sidebar" :class="{ 'is-open': ui.isSidebarOpen || !isNarrow }" aria-label="Menú lateral">
    <div class="sidebar-header">
      <div class="sidebar-header__center">
        <button type="button" class="brand-hit" @click="goInicioFromCarousel" aria-label="Ir a Inicio" title="Ir a Inicio">
          <BrandCarousel id="sideBrandCarousel" :height="44" :width="240" />
        </button>
      </div>
    </div>

    <div class="sidebar-user">
      <img :src="photoUrl" class="rounded-circle me-2" width="36" height="36" />
      <div class="d-flex flex-column">
        <strong class="text-white small">{{ fullName || "Usuario" }}</strong>
        <span class="text-white-75 small">{{ role || "—" }}</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div v-if="empresaMenu.length" class="group">
        <div class="group-title">Empresa</div>
        <template v-for="(it, i) in empresaMenu" :key="'e-' + i">
          <hr v-if="it === null" class="divider" />
          <a v-else href="#" class="item" :class="{ active: isActive(it.name) }" @click.prevent="go({ name: it.name })">
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>
            <span class="item-text">{{ it.text }}</span>

            <span
              v-if="isEditorRole && it.name === 'historial-solped' && unreadEmpresa > 0"
              class="ms-auto notif-badge"
              :class="{ 'badge-bounce': bounceEmpresa }"
              :title="`Pendientes de hoy (desde 00:00): ${unreadEmpresa}`"
            >
              {{ unreadEmpresa }}
            </span>
          </a>
        </template>
      </div>

      <div v-if="tallerMenu.length" class="group">
        <div class="group-title">Taller</div>
        <template v-for="(it, i) in tallerMenu" :key="'t-' + i">
          <hr v-if="it === null" class="divider" />
          <a v-else href="#" class="item" :class="{ active: isActive(it.name) }" @click.prevent="go({ name: it.name })">
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>
            <span class="item-text">{{ it.text }}</span>

            <!-- 🔴 Badge Historial SOLPED (Taller) -->
            <span
              v-if="isEditorRole && it.name === 'HistorialSolpedTaller' && unreadTaller > 0"
              class="ms-auto notif-badge"
              :class="{ 'badge-bounce': bounceTaller }"
              :title="`Pendientes de hoy (desde 00:00): ${unreadTaller}`"
            >
              {{ unreadTaller }}
            </span>
          </a>
        </template>
      </div>

      <div v-if="recepcionMenu.length" class="group">
        <div class="group-title">Recepción</div>
        <template v-for="(it, i) in recepcionMenu" :key="'r-' + i">
          <hr v-if="it === null" class="divider" />
          <a v-else href="#" class="item" :class="{ active: isActive(it.name) }" @click.prevent="go({ name: it.name })">
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>{{ it.text }}
          </a>
        </template>
      </div>

      <div v-if="adminMenu.length" class="group">
        <div class="group-title">Admin</div>
        <template v-for="(it, i) in adminMenu" :key="'a-' + i">
          <hr v-if="it === null" class="divider" />
          <a v-else href="#" class="item" :class="{ active: isActive(it.name) }" @click.prevent="go({ name: it.name })">
            <i v-if="it.icon" :class="['bi', it.icon, 'me-2']"></i>{{ it.text }}
          </a>
        </template>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button
        type="button"
        class="item item-btn"
        @click.stop="openSettings"
        :aria-expanded="showSettings ? 'true' : 'false'"
        aria-haspopup="true"
        title="Ajustes"
      >
        <i class="bi bi-gear-fill me-2"></i> Ajustes
        <span class="ms-auto badge badge-version" title="Versión">
          <i class="bi bi-tag me-1"></i> v{{ appVersion }}
        </span>
      </button>

      <a href="#" class="item" @click.prevent="go({ name: 'PerfilUsuario' })">
        <i class="bi bi-person-gear me-2"></i> Perfil
      </a>

      <a href="#" class="item" @click.prevent="logout">
        <i class="bi bi-box-arrow-right me-2"></i> Salir
      </a>
    </div>
  </aside>

  <div v-if="showSettings" class="settings-overlay" role="dialog" aria-modal="true" aria-label="Ajustes de interfaz" @click.self="closeSettings">
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
            <label class="btn settings-pill" for="t-light">
              <i class="bi bi-brightness-high me-1"></i> Claro
            </label>

            <input type="radio" class="btn-check" name="theme" id="t-dark" value="dark" v-model="localTheme" />
            <label class="btn settings-pill" for="t-dark">
              <i class="bi bi-moon-stars me-1"></i> Oscuro
            </label>
          </div>
        </div>

        <hr class="settings-divider" />

        <div class="mb-2">
          <div class="settings-label">Estilo de menú</div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Estilo de menú">
            <input type="radio" class="btn-check" name="layout" id="m-navbar" value="navbar" v-model="localLayout" />
            <label class="btn settings-pill" for="m-navbar">
              <i class="bi bi-menu-button-wide me-1"></i> Barra superior
            </label>

            <input type="radio" class="btn-check" name="layout" id="m-sidebar" value="sidebar" v-model="localLayout" />
            <label class="btn settings-pill" for="m-sidebar">
              <i class="bi bi-layout-sidebar-inset me-1"></i> Menú lateral
            </label>
          </div>
        </div>

        <hr class="settings-divider" />

        <div class="mb-1">
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
        <button class="btn btn-sm btn-light" @click="applySettings">
          <i class="bi bi-check2-circle me-1"></i> Guardar
        </button>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --xt-red: #c62828;
  --xt-red-d1: #b71c1c;
  --xt-red-d2: #8e1515;

  --xt-white: #ffffff;
  --xt-white-75: rgba(255, 255, 255, 0.75);
  --xt-white-60: rgba(255, 255, 255, 0.6);
  --xt-white-10: rgba(255, 255, 255, 0.1);

  --xt-black-18: rgba(0, 0, 0, 0.18);
}

.bg-xtreme {
  background-color: var(--xt-red) !important;
}
.text-white-75 {
  color: var(--xt-white-75) !important;
}
.text-white-60 {
  color: var(--xt-white-60) !important;
}

.badge-version {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-weight: 600;
  letter-spacing: 0.2px;
}
</style>

<style scoped>
/* 👇 estilos iguales (no cambié nada de tu look) */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.56);
  z-index: 1039;
}

.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--xt-red) !important;
  display: flex;
  flex-direction: column;
  z-index: 1040;
  box-shadow: 4px 0 20px var(--xt-black-18);
  will-change: transform;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

@media (min-width: 992px) {
  .app-sidebar {
    transform: translateX(0);
  }
}
@media (max-width: 991.98px) {
  .app-sidebar {
    transform: translateX(-102%);
  }
  .app-sidebar.is-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  position: relative;
  height: 72px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--xt-red), var(--xt-red-d2)) !important;
  border-bottom: 1px solid var(--xt-red-d2);
  color: var(--xt-white);
}
.sidebar-header__center {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-hit {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
  border-radius: 10px;
}

.sidebar-user {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--xt-red-d1), var(--xt-red-d2)) !important;
  border-bottom: 1px solid var(--xt-red-d2);
  color: var(--xt-white);
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow: auto;
}
.group {
  margin-bottom: 8px;
}
.group-title {
  color: var(--xt-white-60);
  font-size: 12px;
  text-transform: uppercase;
  padding: 6px 8px;
}

.item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--xt-white);
  text-decoration: none;
}
.item:hover {
  background: var(--xt-red-d1);
  color: var(--xt-white);
}
.item.active {
  background: var(--xt-red-d1);
  box-shadow: inset 3px 0 0 var(--xt-white);
}

.item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.notif-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #ff2d2d;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22);
}

/* ✅ Animación salto (cuando llega nueva o cuando hay pendientes) */
.badge-bounce{
  animation: badgeJump 0.9s cubic-bezier(.2,.9,.25,1) both;
  transform-origin: center;
}
@keyframes badgeJump{
  0%   { transform: translateY(0) scale(1); }
  18%  { transform: translateY(-8px) scale(1.06); }
  36%  { transform: translateY(0) scale(1); }
  52%  { transform: translateY(-5px) scale(1.04); }
  68%  { transform: translateY(0) scale(1); }
  100% { transform: translateY(0) scale(1); }
}

.divider {
  border-color: var(--xt-white-10);
}
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--xt-red-d2);
}

.item-btn {
  background: transparent;
  border: 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

/* Settings UI */
.settings-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.56);
  z-index: 2001;
  padding: 20px;
}
.settings-card {
  border-radius: 14px;
  overflow: hidden;
  width: min(460px, 92vw);
  background: #ffffff;
  color: #1f2937;
}
.settings-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--xt-red), var(--xt-red-d2));
  color: #fff;
}
.settings-card__body {
  padding: 16px 14px;
}
.settings-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 14px;
  background: #fafafa;
}

/* (resto de tus estilos de settings) */
.settings-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}
.settings-divider {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.12), transparent);
  margin: 10px 0 12px;
}
.settings-pill {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px 10px;
  line-height: 1;
  font-weight: 600;
  color: #374151;
  transition: all 0.12s ease;
}
.settings-pill:hover {
  background: #e5e7eb;
}
.color-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.color-swatch {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: 0.12s ease;
  user-select: none;
}
.color-swatch:hover {
  background: rgba(0, 0, 0, 0.04);
}
.swatch {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px #fff inset, 0 1px 4px rgba(0, 0, 0, 0.25);
}
.swatch-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}
.visually-hidden {
  position: absolute !important;
  opacity: 0;
  pointer-events: none;
}
.visually-hidden:checked + .swatch {
  outline: 2px solid #111827;
  outline-offset: 2px;
}
.color-swatch:has(input.visually-hidden:checked) {
  border-color: var(--xt-red);
  box-shadow: 0 0 0 2px var(--xt-red) inset;
  background: rgba(0, 0, 0, 0.04);
}
.btn-outline-light-subtle {
  --bs-btn-color: #374151;
  --bs-btn-border-color: #e5e7eb;
  --bs-btn-hover-bg: #f3f4f6;
  --bs-btn-hover-border-color: #d1d5db;
  --bs-btn-active-bg: #e5e7eb;
  --bs-btn-active-border-color: #d1d5db;
}
:global(html.theme-dark) .settings-card {
  background: #1f2937;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.06);
}
:global(html.theme-dark) .settings-card__footer {
  background: #111827;
  border-top-color: rgba(255, 255, 255, 0.06);
}
:global(html.theme-dark) .settings-label {
  color: #9ca3af;
}
:global(html.theme-dark) .settings-pill {
  background: #111827;
  border-color: #374151;
  color: #e5e7eb;
}
:global(html.theme-dark) .settings-pill:hover {
  background: #0b1220;
}
:global(html.theme-dark) .visually-hidden:checked + .swatch {
  outline: 2px solid #e5e7eb;
  outline-offset: 2px;
}
:global(html.theme-dark) .color-swatch:has(input.visually-hidden:checked) {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
  background: rgba(255, 255, 255, 0.06);
}
:global(html.theme-dark) .swatch-label {
  color: #e5e7eb;
}
</style>
