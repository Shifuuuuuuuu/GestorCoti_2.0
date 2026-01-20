// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authService";

const Login = () => import("../views/Login.vue");
const Inicio = () => import("../views/Inicio.vue");
const Solped = () => import("../views/Solped.vue");
const HistorialSolped = () => import("../views/HistorialSolped.vue");
const SolpedTaller = () => import("../views/SolpedTaller.vue");
const HistorialSolpedTaller = () => import("../views/HistorialSolpedTaller.vue");
const GeneradorOC = () => import("../views/GeneradorOC.vue");
const OCDetalle = () => import("../views/OCDetalle.vue");
const SolpedDetalle = () => import("../views/SolpedDetalle.vue");
const HistorialOC = () => import("../views/HistorialOC.vue");

/* Taller */
const OrdenOCTallerDetalle = () => import("../views/OCDetalleTaller.vue");
const SolpedTallerDetalle = () => import("../views/SolpedDetalleTaller.vue");
const GeneradorOCTaller = () => import("../views/GeneradorOCTaller.vue");
const HistorialOCTaller = () => import("../views/HistorialOCTaller.vue");

/* Admin */
const AdminSolpes = () => import("../views/AdminSolpes.vue");
const AdminSolpedTaller = () => import("../views/AdminSolpedTaller.vue");
const AdminOrdenesOC = () => import("../views/AdminOrdenesOC.vue");
const AdminOrdenesOCTaller = () => import("../views/AdminOrdenesOCTaller.vue");
const AdminUsuarios = () => import("../views/AdminUsuarios.vue");
const AdminEquipos = () => import("../views/AdminEquipos.vue");
const AprobacionOC = () => import("../views/AprobacionOC.vue");
const AprobacionOCTaller = () => import("../views/AprobacionOCTaller.vue");
const PerfilUsuario = () => import("../views/PerfilUsuario.vue");
const Soporte = () => import("../views/Soporte.vue");
const SoporteGestion = () => import("../views/SoporteGestion.vue");
const DashboardEstadisticas = () => import("../views/DashboardEstadisticas.vue");
const AdminConfig = () => import("../views/AdminConfig.vue");
const AdminGestionDocs = () => import("../views/AdminGestionDocs.vue");
const AprobacionDocs = () => import("../views/AprobacionDocs.vue");
const RecepcionOC = () => import("../views/RecepcionOC.vue");
const AiInspectorView = () => import("../views/AiInspectorView.vue");
const GenerarCotizacion = () => import("../views/GenerarCotizacion.vue");
const GenerarCertificados = () => import("../views/GenerarCertificados.vue");

const routes = [
  // LOGIN (pública)
  { path: "/login", name: "login", component: Login, meta: { guestOnly: true } },
  { path: "/", redirect: { name: "Inicio" } },

  // Base
  { path: "/inicio", name: "Inicio", component: Inicio, meta: { requiresAuth: true } },
  { path: "/perfil-usuario", name: "PerfilUsuario", component: PerfilUsuario, meta: { requiresAuth: true } },

  // Chatbot
  { path: "/Chatbot", name: "AiInspectorView", component: AiInspectorView, meta: { requiresAuth: true, menuKey: "AiInspectorView" } },

  // EMPRESA
  { path: "/solped", name: "solped", component: Solped, meta: { requiresAuth: true, menuKey: "solped" } },
  { path: "/historial-solped", name: "historial-solped", component: HistorialSolped, meta: { requiresAuth: true, menuKey: "historial-solped" } },

  { path: "/generador-oc", name: "GeneradorOC", component: GeneradorOC, meta: { requiresAuth: true, menuKey: "GeneradorOC" } },
  { path: "/historial-oc", name: "historial-oc", component: HistorialOC, meta: { requiresAuth: true, menuKey: "historial-oc" } },

  // Detalles (empresa) → heredan permiso desde historial
  { path: "/oc/:id", name: "oc-detalle", component: OCDetalle, meta: { requiresAuth: true, menuKey: "historial-oc" } },
  { path: "/solped/:id", name: "SolpedDetalle", component: SolpedDetalle, meta: { requiresAuth: true, menuKey: "historial-solped" } },

  // TALLER
  { path: "/solped-taller", name: "SolpedTaller", component: SolpedTaller, meta: { requiresAuth: true, menuKey: "SolpedTaller" } },
  { path: "/historial-solped-taller", name: "HistorialSolpedTaller", component: HistorialSolpedTaller, meta: { requiresAuth: true, menuKey: "HistorialSolpedTaller" } },

  { path: "/generador-oc-taller", name: "GeneradorOCTaller", component: GeneradorOCTaller, meta: { requiresAuth: true, menuKey: "GeneradorOCTaller" } },
  { path: "/historial-oc-taller", name: "HistorialOCTaller", component: HistorialOCTaller, meta: { requiresAuth: true, menuKey: "HistorialOCTaller" } },

  // Detalles (taller) → heredan permiso desde historial taller
  { path: "/ordenes-oc-taller/:id", name: "OrdenOCTallerDetalle", component: OrdenOCTallerDetalle, meta: { requiresAuth: true, menuKey: "HistorialOCTaller" } },
  { path: "/solped-taller/:id", name: "SolpedTallerDetalle", component: SolpedTallerDetalle, meta: { requiresAuth: true, menuKey: "HistorialSolpedTaller" } },

  // ADMIN
  { path: "/admin-solped", name: "AdminSolpes", component: AdminSolpes, meta: { requiresAuth: true, menuKey: "AdminSolpes" } },
  { path: "/admin-solped-taller", name: "AdminSolpedTaller", component: AdminSolpedTaller, meta: { requiresAuth: true, menuKey: "AdminSolpedTaller" } },
  { path: "/admin-oc", name: "AdminOrdenesOC", component: AdminOrdenesOC, meta: { requiresAuth: true, menuKey: "AdminOrdenesOC" } },
  { path: "/admin-oc-taller", name: "AdminOrdenesOCTaller", component: AdminOrdenesOCTaller, meta: { requiresAuth: true, menuKey: "AdminOrdenesOCTaller" } },
  { path: "/admin-usuarios", name: "AdminUsuarios", component: AdminUsuarios, meta: { requiresAuth: true, menuKey: "AdminUsuarios" } },
  { path: "/admin-equipos", name: "AdminEquipos", component: AdminEquipos, meta: { requiresAuth: true, menuKey: "AdminEquipos" } },
  { path: "/dashboard", name: "DashboardEstadisticas", component: DashboardEstadisticas, meta: { requiresAuth: true, menuKey: "DashboardEstadisticas" } },
  { path: "/Config", name: "AdminConfig", component: AdminConfig, meta: { requiresAuth: true, menuKey: "AdminConfig" } },

  // Validador OC
  { path: "/aprobador-oc", name: "AprobacionOC", component: AprobacionOC, meta: { requiresAuth: true, menuKey: "AprobacionOC" } },
  { path: "/aprobador-oc-taller", name: "AprobacionOCTaller", component: AprobacionOCTaller, meta: { requiresAuth: true, menuKey: "AprobacionOCTaller" } },

  // Soporte
  { path: "/soporte", name: "Soporte", component: Soporte, meta: { requiresAuth: true, menuKey: "Soporte" } },
  { path: "/soporte-gestor", name: "SoporteGestion", component: SoporteGestion, meta: { requiresAuth: true, menuKey: "SoporteGestion" } },

  // Docs
  { path: "/gestor-docs", name: "AdminGestionDocs", component: AdminGestionDocs, meta: { requiresAuth: true, menuKey: "AdminGestionDocs" } },
  { path: "/aprobacion-docs", name: "AprobacionDocs", component: AprobacionDocs, meta: { requiresAuth: true, menuKey: "AprobacionDocs" } },

  // Recepción
  { path: "/recepcion-oc", name: "RecepcionOC", component: RecepcionOC, meta: { requiresAuth: true, menuKey: "RecepcionOC" } },

  // Extras
  { path: "/generador-coti", name: "GenerarCotizacion", component: GenerarCotizacion, meta: { requiresAuth: true, menuKey: "GenerarCotizacion" } },
  { path: "/generador-certificados", name: "GenerarCertificados", component: GenerarCertificados, meta: { requiresAuth: true, menuKey: "GenerarCertificados" } },

  // fallback
  { path: "/:pathMatch(.*)*", redirect: { name: "Inicio" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
const ALWAYS_ALLOWED = new Set(["Inicio", "PerfilUsuario"]);

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  if (auth.initializing) {
    await auth.initAuth();
  }

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const guestOnly = to.matched.some((r) => r.meta.guestOnly);

  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login" });
  }

  if (guestOnly && auth.isAuthenticated) {
    return next({ name: "Inicio" });
  }

  if (requiresAuth) {
    const perms = auth?.profile?.menuPerms || { allow: [], deny: [] };
    const allow = Array.isArray(perms.allow) ? perms.allow.map(String) : [];
    const deny = Array.isArray(perms.deny) ? perms.deny.map(String) : [];

    const routeKey = String(to.meta?.menuKey || to.name || "");

    if (ALWAYS_ALLOWED.has(String(to.name || ""))) return next();

    if (routeKey && deny.includes(routeKey)) {
      return next({ name: "Inicio" });
    }

    if (allow.length > 0) {
      if (!routeKey || !allow.includes(routeKey)) {
        return next({ name: "Inicio" });
      }
    }
  }

  next();
});

export default router;
