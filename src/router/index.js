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

const OrdenOCTallerDetalle = () => import("../views/OCDetalleTaller.vue");
const SolpedTallerDetalle = () => import("../views/SolpedDetalleTaller.vue");
const GeneradorOCTaller = () => import("../views/GeneradorOCTaller.vue");
const HistorialOCTaller = () => import("../views/HistorialOCTaller.vue");

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
  { path: "/login", name: "login", component: Login, meta: { guestOnly: true } },
  { path: "/", redirect: { name: "Inicio" } },

  { path: "/inicio", name: "Inicio", component: Inicio, meta: { requiresAuth: true } },
  { path: "/perfil-usuario", name: "PerfilUsuario", component: PerfilUsuario, meta: { requiresAuth: true } },

  { path: "/Chatbot", name: "AiInspectorView", component: AiInspectorView, meta: { requiresAuth: true, menuKey: "AiInspectorView" } },

  { path: "/solped", name: "solped", component: Solped, meta: { requiresAuth: true, menuKey: "solped" } },
  { path: "/historial-solped", name: "historial-solped", component: HistorialSolped, meta: { requiresAuth: true, menuKey: "historial-solped" } },

  { path: "/generador-oc", name: "GeneradorOC", component: GeneradorOC, meta: { requiresAuth: true, menuKey: "GeneradorOC" } },
  { path: "/historial-oc", name: "historial-oc", component: HistorialOC, meta: { requiresAuth: true, menuKey: "historial-oc" } },

  { path: "/oc/:id", name: "oc-detalle", component: OCDetalle, meta: { requiresAuth: true, menuKey: "historial-oc" } },
  { path: "/solped/:id", name: "SolpedDetalle", component: SolpedDetalle, meta: { requiresAuth: true, menuKey: "historial-solped" } },

  { path: "/solped-taller", name: "SolpedTaller", component: SolpedTaller, meta: { requiresAuth: true, menuKey: "SolpedTaller" } },
  { path: "/historial-solped-taller", name: "HistorialSolpedTaller", component: HistorialSolpedTaller, meta: { requiresAuth: true, menuKey: "HistorialSolpedTaller" } },

  { path: "/generador-oc-taller", name: "GeneradorOCTaller", component: GeneradorOCTaller, meta: { requiresAuth: true, menuKey: "GeneradorOCTaller" } },
  { path: "/historial-oc-taller", name: "HistorialOCTaller", component: HistorialOCTaller, meta: { requiresAuth: true, menuKey: "HistorialOCTaller" } },

  { path: "/ordenes-oc-taller/:id", name: "OrdenOCTallerDetalle", component: OrdenOCTallerDetalle, meta: { requiresAuth: true, menuKey: "HistorialOCTaller" } },
  { path: "/solped-taller/:id", name: "SolpedTallerDetalle", component: SolpedTallerDetalle, meta: { requiresAuth: true, menuKey: "HistorialSolpedTaller" } },

  { path: "/admin-solped", name: "AdminSolpes", component: AdminSolpes, meta: { requiresAuth: true, menuKey: "AdminSolpes" } },
  { path: "/admin-solped-taller", name: "AdminSolpedTaller", component: AdminSolpedTaller, meta: { requiresAuth: true, menuKey: "AdminSolpedTaller" } },
  { path: "/admin-oc", name: "AdminOrdenesOC", component: AdminOrdenesOC, meta: { requiresAuth: true, menuKey: "AdminOrdenesOC" } },
  { path: "/admin-oc-taller", name: "AdminOrdenesOCTaller", component: AdminOrdenesOCTaller, meta: { requiresAuth: true, menuKey: "AdminOrdenesOCTaller" } },
  { path: "/admin-usuarios", name: "AdminUsuarios", component: AdminUsuarios, meta: { requiresAuth: true, menuKey: "AdminUsuarios" } },
  { path: "/admin-equipos", name: "AdminEquipos", component: AdminEquipos, meta: { requiresAuth: true, menuKey: "AdminEquipos" } },
  { path: "/dashboard", name: "DashboardEstadisticas", component: DashboardEstadisticas, meta: { requiresAuth: true, menuKey: "DashboardEstadisticas" } },
  { path: "/Config", name: "AdminConfig", component: AdminConfig, meta: { requiresAuth: true, menuKey: "AdminConfig" } },

  { path: "/aprobador-oc", name: "AprobacionOC", component: AprobacionOC, meta: { requiresAuth: true, menuKey: "AprobacionOC" } },
  { path: "/aprobador-oc-taller", name: "AprobacionOCTaller", component: AprobacionOCTaller, meta: { requiresAuth: true, menuKey: "AprobacionOCTaller" } },

  { path: "/soporte", name: "Soporte", component: Soporte, meta: { requiresAuth: true, menuKey: "Soporte" } },
  { path: "/soporte-gestor", name: "SoporteGestion", component: SoporteGestion, meta: { requiresAuth: true, menuKey: "SoporteGestion" } },

  { path: "/gestor-docs", name: "AdminGestionDocs", component: AdminGestionDocs, meta: { requiresAuth: true, menuKey: "AdminGestionDocs" } },
  { path: "/aprobacion-docs", name: "AprobacionDocs", component: AprobacionDocs, meta: { requiresAuth: true, menuKey: "AprobacionDocs" } },

  { path: "/recepcion-oc", name: "RecepcionOC", component: RecepcionOC, meta: { requiresAuth: true, menuKey: "RecepcionOC" } },

  { path: "/generador-coti", name: "GenerarCotizacion", component: GenerarCotizacion, meta: { requiresAuth: true, menuKey: "GenerarCotizacion" } },
  { path: "/generador-certificados", name: "GenerarCertificados", component: GenerarCertificados, meta: { requiresAuth: true, menuKey: "GenerarCertificados" } },

  { path: "/:pathMatch(.*)*", redirect: { name: "Inicio" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const ALWAYS_ALLOWED = new Set([
  "Inicio",
  "PerfilUsuario",
  "oc-detalle",
  "OrdenOCTallerDetalle",
  "SolpedDetalle",
  "SolpedTallerDetalle",
]);

function normKey(s) {
  return String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function getUserFlags(auth) {
  const fullName = String(
    auth?.profile?.fullName ||
      auth?.profile?.Nombre_completo ||
      auth?.user?.displayName ||
      ""
  ).trim();

  const email = String(auth?.user?.email || "").trim().toLowerCase();
  const role = String(auth?.profile?.role || auth?.role || "").trim();

  const nName = normKey(fullName);
  const nRole = normKey(role);

  const isTallerCMUser = nName === "taller_cm" || email === "tallercm@xtremeservicios.cl";

  return { fullName, email, role, nRole, isTallerCMUser };
}

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
    if (ALWAYS_ALLOWED.has(String(to.name || ""))) return next();

    const { nRole, isTallerCMUser } = getUserFlags(auth);

    const routeKeyRaw = String(to.meta?.menuKey || to.name || "");
    const routeKey = normKey(routeKeyRaw);

    if (isTallerCMUser && nRole === "generador_solped") {
      const allowedForTallerCM = new Set([
        normKey("SolpedTaller"),
        normKey("HistorialSolpedTaller"),
        normKey("SolpedTallerDetalle"),
        normKey("HistorialOCTaller"),
        normKey("OrdenOCTallerDetalle"),
        normKey("Soporte"),
        normKey("Inicio"),
        normKey("PerfilUsuario"),
      ]);

      if (allowedForTallerCM.has(routeKey)) {
        return next();
      }
    }

    const perms = auth?.profile?.menuPerms || { allow: [], deny: [] };
    const allowRaw = Array.isArray(perms.allow) ? perms.allow.map(String) : [];
    const denyRaw = Array.isArray(perms.deny) ? perms.deny.map(String) : [];

    const allowSet = new Set(allowRaw.map(normKey));
    const denySet = new Set(denyRaw.map(normKey));

    const candidates = new Set([
      normKey(routeKeyRaw),
      normKey(to.name),
      normKey(to.path),
    ]);

    for (const c of candidates) {
      if (c && denySet.has(c)) return next({ name: "Inicio" });
    }

    if (allowSet.size > 0) {
      let ok = false;
      for (const c of candidates) {
        if (c && allowSet.has(c)) {
          ok = true;
          break;
        }
      }
      if (!ok) return next({ name: "Inicio" });
    }
  }

  next();
});

export default router;
