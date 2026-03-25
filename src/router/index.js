// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authService";
import {
  ALWAYS_ALLOWED_ROUTE_NAMES,
  MENU_BY_ROUTE_NAME,
  canAccessMenuKey,
  normKey,
} from "@/config/menuPermissions";

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
const VerifyCertificado = () => import("../views/VerifyCertificado.vue");
const NotFound = () => import("../views/NotFound.vue");
const SolpedPlantas = () => import("../views/SolpedPlantas.vue");
const AprobacionSolped = () => import("../views/AprobacionSolped.vue");
const HistorialSolpedPlanta = () => import("../views/HistorialSolpedPlanta.vue");
const GeneradorCotizacionPlantas = () => import("../views/GeneradorCotizacionPlantas.vue");
const AprobacionCotizacionesPlantas = () => import("../views/AprobacionCotizacionesPlantas.vue");
const HistorialCotizacionesPlantas = () => import("../views/HistorialCotizacionesPlantas.vue");
const DetalleCotizacionPlanta = () => import("../views/DetalleCotizacionPlanta.vue");
const DetalleSolpedPlanta = () => import("../views/DetalleSolpedPlanta.vue");
const AdminSolpedPlantas = () => import ("../views/AdminSolpedPlantas.vue");
const AdminCotizacionPlantas = () => import ("../views/AdminCotizacionPlantas.vue");
const ProveedoresView = () => import("../views/ProveedoresView.vue");
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

  { path: "/verify-certificado", component: VerifyCertificado },
  { path: "/solped-plantas", name:"SolpedPlantas" , component: SolpedPlantas, meta: { requiresAuth: true, menuKey: "SolpedPlantas"}},
  { path: "/aprobacion-plantas", name: "AprobacionSolped", component : AprobacionSolped, meta: { requiresAuth: true, menuKey: "AprobacionSolped" }},
  { path: "/historial-plantas", name: "HistorialSolpedPlanta", component: HistorialSolpedPlanta, meta: { requiresAuth: true, menuKey: "HistorialSolpedPlanta"}},
  { path: "/generador-coti-plantas", name: "GeneradorCotizacionPlantas", component: GeneradorCotizacionPlantas, meta: { requiresAuth: true, menuKey: "GeneradorCotizacionPlantas"}},
  { path: "/aprobador-coti-plantas", name: "AprobacionCotizacionesPlantas", component: AprobacionCotizacionesPlantas, meta: { requiresAuth: true, menuKey: "AprobacionCotizacionesPlantas"}},
  { path: "/historial-coti-plantas", name: "HistorialCotizacionesPlantas", component: HistorialCotizacionesPlantas, meta: { requiresAuth: true, menuKey: "HistorialCotizacionesPlantas"}},
  { path: "/detalle-coti-planta/:id", name: "DetalleCotizacionPlanta", component: DetalleCotizacionPlanta, meta: { requiresAuth: true, menuKey: "HistorialCotizacionesPlantas"}},
  { path: "/detalle-solped-planta/:id", name: "DetalleSolpedPlanta", component: DetalleSolpedPlanta, meta: { requiresAuth: true, menuKey: "HistorialSolpedPlanta"}},
  { path: "/admin-solped-plantas", name: "AdminSolpedPlantas", component: AdminSolpedPlantas, meta: { requiresAuth: true, menuKey: "AdminSolpedPlantas"}},
  { path: "/admin-coti-plantas", name: "AdminCotizacionPlantas", component: AdminCotizacionPlantas, meta: { requiresAuth: true, menuKey: "AdminCotizacionPlantas"}},
  { path: "/admin-proveedores", name: "ProveedoresView", component: ProveedoresView, meta: { requiresAuth: true, menuKey: "ProveedoresView" }},
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound, meta: { public: true },
},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const ALWAYS_ALLOWED = new Set(ALWAYS_ALLOWED_ROUTE_NAMES);

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

  if (!requiresAuth) return next();

  if (ALWAYS_ALLOWED.has(String(to.name || ""))) {
    return next();
  }

  const profile = auth?.profile || {};
  const role = profile?.role || auth?.role || "";
  const menuPerms = profile?.menuPerms || { allow: [], deny: [] };

  const fullName = String(
    profile?.fullName ||
      profile?.Nombre_completo ||
      auth?.user?.displayName ||
      ""
  ).trim().toLowerCase();

  const email = String(auth?.user?.email || "").trim().toLowerCase();

  const routeDef = MENU_BY_ROUTE_NAME[String(to.name || "")];
  const routeKey = routeDef?.key || String(to.meta?.menuKey || to.name || "");

  let extraAllow = [];
  let extraDeny = [];

  const isTallerCMUser =
    fullName === "taller cm" || email === "tallercm@xtremeservicios.cl";

  const isGuillermo =
    fullName === "guillermo manzor" || email === "gmanzor@xtrememining.cl";

  const isJuanCubillos =
    fullName === "juan cubillos" || email === "jcubillos@xtrememining.cl";

  const isAlejandroCandia =
    fullName === "alejandro candia" || email === "acp@xtrememining.cl";

  const isMariaJoseBallesteros =
    fullName === "maria jose ballesteros" ||
    fullName === "maría jose ballesteros" ||
    email === "mballesteros@xtrememining.cl" ||
    email === "mjb@xtrememining.cl";

  const isPatricioBustos = fullName === "patricio bustos";
  const isAxelBasicContreras = fullName === "axel basic contreras";
  const isGriselleMatus = fullName === "griselle matus";

  if (isTallerCMUser && normKey(role) === "generador_solped") {
    extraAllow.push(
      "SolpedTaller",
      "HistorialSolpedTaller",
      "HistorialOCTaller",
      "Soporte"
    );
  }

  if (isGuillermo || isMariaJoseBallesteros || normKey(role) === "aprobador_editor") {
    extraAllow.push("AprobacionOC", "AprobacionOCTaller");
  }

  if (isAlejandroCandia || isJuanCubillos) {
    extraAllow.push("AprobacionDocs");
  }

  if (isJuanCubillos || isPatricioBustos || isAxelBasicContreras || isGriselleMatus) {
    extraAllow.push("GenerarCotizacion");
  }

  if (isTallerCMUser) {
    extraDeny.push("GenerarCotizacion");
  }

  const allowed = canAccessMenuKey({
    role,
    menuPerms,
    targetKey: routeKey,
    extraAllow,
    extraDeny,
    useRoleDefaultsWhenAllowEmpty: true,
  });

  if (!allowed) {
    return next({ name: "Inicio" });
  }

  next();
});

export default router;
