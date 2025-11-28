// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authService";

/* === Lazy imports de vistas === */
const Login            = () => import("../views/Login.vue");
const Inicio           = () => import("../views/Inicio.vue");
const Solped           = () => import("../views/Solped.vue");
const HistorialSolped  = () => import("../views/HistorialSolped.vue");
const SolpedTaller     = () => import("../views/SolpedTaller.vue");
const HistorialSolpedTaller = () => import("../views/HistorialSolpedTaller.vue");
const GeneradorOC      = () => import("../views/GeneradorOC.vue");
const OCDetalle        = () => import("../views/OCDetalle.vue");
const SolpedDetalle    = () => import("../views/SolpedDetalle.vue");
const HistorialOC      = () => import("../views/HistorialOC.vue");

/* Taller */
const OrdenOCTallerDetalle = () => import("../views/OCDetalleTaller.vue");
const SolpedTallerDetalle  = () => import("../views/SolpedDetalleTaller.vue");
const GeneradorOCTaller    = () => import("../views/GeneradorOCTaller.vue");
const HistorialOCTaller    = () => import("../views/HistorialOCTaller.vue");

/* Admin */
const AdminSolpes        = () => import("../views/AdminSolpes.vue");
const AdminSolpedTaller  = () => import("../views/AdminSolpedTaller.vue");
const AdminOrdenesOC     = () => import("../views/AdminOrdenesOC.vue");
const AdminOrdenesOCTaller = () => import("../views/AdminOrdenesOCTaller.vue");
const AdminUsuarios      = () => import("../views/AdminUsuarios.vue");
const AdminEquipos       = () => import("../views/AdminEquipos.vue");
const AprobacionOC       = () => import("../views/AprobacionOC.vue");
const AprobacionOCTaller = () => import("../views/AprobacionOCTaller.vue");
const PerfilUsuario      = () => import("../views/PerfilUsuario.vue");
const Soporte            = () => import("../views/Soporte.vue");
const SoporteGestion     = () => import("../views/SoporteGestion.vue");
const DashboardEstadisticas = () => import("../views/DashboardEstadisticas.vue");
const AdminConfig        = () => import("../views/AdminConfig.vue");

const routes = [
  // LOGIN (pública)
  { path: "/login", name: "login", component: Login, meta: { guestOnly: true } },

  // 🔹 INICIO (home después de login)
  { path: "/inicio", name: "Inicio", component: Inicio, meta: { requiresAuth: true } },

  // ✅ raíz -> Inicio (si ya está logueado el guardia lo deja pasar)
  { path: "/", redirect: { name: "Inicio" } },

  // EMPRESA
  { path: "/solped",           name: "solped",           component: Solped,           meta: { requiresAuth: true } },
  { path: "/historial-solped", name: "historial-solped", component: HistorialSolped,  meta: { requiresAuth: true } },

  // TALLER
  { path: "/solped-taller",          name: "SolpedTaller",          component: SolpedTaller,          meta: { requiresAuth: true } },
  { path: "/historial-solped-taller",name: "HistorialSolpedTaller", component: HistorialSolpedTaller, meta: { requiresAuth: true } },

  { path: "/generador-oc", name: "GeneradorOC", component: GeneradorOC, meta: { requiresAuth: true } },
  { path: "/historial-oc", name: "historial-oc", component: HistorialOC, meta: { requiresAuth: true } },

  /* Detalles (empresa) */
  { path: "/oc/:id",     name: "oc-detalle",    component: OCDetalle,     meta: { requiresAuth: true } },
  { path: "/solped/:id", name: "SolpedDetalle", component: SolpedDetalle, meta: { requiresAuth: true } },

  /* Detalles (taller) */
  { path: "/ordenes-oc-taller/:id", name: "OrdenOCTallerDetalle", component: OrdenOCTallerDetalle, meta: { requiresAuth: true } },
  { path: "/solped-taller/:id",     name: "SolpedTallerDetalle",  component: SolpedTallerDetalle,  meta: { requiresAuth: true } },
  { path: "/generador-oc-taller",   name: "GeneradorOCTaller",    component: GeneradorOCTaller,    meta: { requiresAuth: true } },
  { path: "/historial-oc-taller",   name: "HistorialOCTaller",    component: HistorialOCTaller,    meta: { requiresAuth: true } },

  /* admin */
  { path: "/admin-solped",        name: "AdminSolpes",        component: AdminSolpes,        meta: { requiresAuth: true } },
  { path: "/admin-solped-taller", name: "AdminSolpedTaller",  component: AdminSolpedTaller,  meta: { requiresAuth: true } },
  { path: "/admin-oc",            name: "AdminOrdenesOC",     component: AdminOrdenesOC,     meta: { requiresAuth: true } },
  { path: "/admin-oc-taller",     name: "AdminOrdenesOCTaller", component: AdminOrdenesOCTaller, meta: { requiresAuth: true } },
  { path: "/admin-usuarios",      name: "AdminUsuarios",      component: AdminUsuarios,      meta: { requiresAuth: true } },
  { path: "/admin-equipos",       name: "AdminEquipos",       component: AdminEquipos,       meta: { requiresAuth: true } },
  { path: "/dashboard",           name: "DashboardEstadisticas", component: DashboardEstadisticas, meta: { requiresAuth: true } },
  { path: "/Config",         name: "AdminConfig",        component: AdminConfig,        meta: { requiresAuth: true } },

  /* validador OC */
  { path: "/aprobador-oc",        name: "AprobacionOC",       component: AprobacionOC,       meta: { requiresAuth: true } },
  { path: "/aprobador-oc-taller", name: "AprobacionOCTaller", component: AprobacionOCTaller, meta: { requiresAuth: true } },

  /* otros */
  { path: "/soporte",         name: "Soporte",        component: Soporte,        meta: { requiresAuth: true } },
  { path: "/soporte-gestor",  name: "SoporteGestion", component: SoporteGestion, meta: { requiresAuth: true } },
  { path: "/perfil-usuario",  name: "PerfilUsuario",  component: PerfilUsuario,  meta: { requiresAuth: true } },

  // 404 -> Inicio
  { path: "/:pathMatch(.*)*", redirect: { name: "Inicio" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  if (auth.initializing) {
    await auth.initAuth();
  }

  const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
  const guestOnly    = to.matched.some(r => r.meta.guestOnly);

  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login" });
  }

  if (guestOnly && auth.isAuthenticated) {
    // si ya está logueado y va al login lo mando a Inicio
    return next({ name: "Inicio" });
  }

  next();
});

export default router;
