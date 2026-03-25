// src/config/menuPermissions.js

export function normKey(s) {
  return String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export const ALWAYS_ALLOWED_ROUTE_NAMES = [
  "Inicio",
  "PerfilUsuario",
  "oc-detalle",
  "OrdenOCTallerDetalle",
  "SolpedDetalle",
  "SolpedTallerDetalle",
];

export const MENU_DEFINITIONS = [
  {
    key: "solped",
    routeName: "solped",
    label: "Crear SOLPED",
    group: "Empresa",
    icon: "bi-file-earmark-plus",
    defaultRoles: ["Admin", "Generador solped"],
  },
  {
    key: "historial-solped",
    routeName: "historial-solped",
    label: "Historial SOLPED",
    group: "Empresa",
    icon: "bi-archive",
    defaultRoles: ["Admin", "Generador solped", "Editor", "Aprobador/Editor"],
  },
  {
    key: "GeneradorOC",
    routeName: "GeneradorOC",
    label: "Generador Cotización",
    group: "Empresa",
    icon: "bi-cart-plus",
    defaultRoles: ["Admin", "Editor"],
  },
  {
    key: "historial-oc",
    routeName: "historial-oc",
    label: "Historial Cotizaciones",
    group: "Empresa",
    icon: "bi-receipt-cutoff",
    defaultRoles: ["Admin", "Editor", "Aprobador/Editor"],
  },
  {
    key: "AprobacionOC",
    routeName: "AprobacionOC",
    label: "Aprobador Cotización",
    group: "Empresa",
    icon: "bi-clipboard-check",
    defaultRoles: ["Admin", "Aprobador/Editor"],
  },
  {
    key: "GenerarCotizacion",
    routeName: "GenerarCotizacion",
    label: "Generador de cotización",
    group: "Empresa",
    icon: "bi-calculator",
    defaultRoles: ["Admin", "Editor"],
  },

  {
    key: "SolpedTaller",
    routeName: "SolpedTaller",
    label: "Crear SOLPED (Taller)",
    group: "Taller",
    icon: "bi-wrench-adjustable",
    defaultRoles: ["Admin", "Generador solped"],
  },
  {
    key: "HistorialSolpedTaller",
    routeName: "HistorialSolpedTaller",
    label: "Historial SOLPED (Taller)",
    group: "Taller",
    icon: "bi-archive-fill",
    defaultRoles: ["Admin", "Generador solped", "Editor", "Aprobador/Editor"],
  },
  {
    key: "GeneradorOCTaller",
    routeName: "GeneradorOCTaller",
    label: "Generador Cotización (Taller)",
    group: "Taller",
    icon: "bi-tools",
    defaultRoles: ["Admin", "Editor"],
  },
  {
    key: "HistorialOCTaller",
    routeName: "HistorialOCTaller",
    label: "Historial Cotizaciones (Taller)",
    group: "Taller",
    icon: "bi-card-checklist",
    defaultRoles: ["Admin", "Editor", "Aprobador/Editor"],
  },
  {
    key: "AprobacionOCTaller",
    routeName: "AprobacionOCTaller",
    label: "Aprobador Cotización (Taller)",
    group: "Taller",
    icon: "bi-clipboard2-check",
    defaultRoles: ["Admin", "Aprobador/Editor"],
  },

  {
    key: "AdminSolpes",
    routeName: "AdminSolpes",
    label: "Admin SOLPED",
    group: "Admin",
    icon: "bi-folder-symlink",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminSolpedTaller",
    routeName: "AdminSolpedTaller",
    label: "Admin SOLPED (Taller)",
    group: "Admin",
    icon: "bi-folder-symlink-fill",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminSolpedPlantas",
    routeName: "AdminSolpedPlantas",
    label: "Admin SOLPED (PLANTAS)",
    group: "Admin",
    icon: "bi bi-building-add",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminOrdenesOC",
    routeName: "AdminOrdenesOC",
    label: "Admin OC",
    group: "Admin",
    icon: "bi-file-earmark-text",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminOrdenesOCTaller",
    routeName: "AdminOrdenesOCTaller",
    label: "Admin OC (Taller)",
    group: "Admin",
    icon: "bi-file-earmark-ruled",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminCotizacionPlantas",
    routeName: "AdminCotizacionPlantas",
    label: "Admin OC (PLANTAS)",
    group: "Admin",
    icon: "bi bi-building-gear",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminUsuarios",
    routeName: "AdminUsuarios",
    label: "Admin Usuarios",
    group: "Admin",
    icon: "bi-people",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminEquipos",
    routeName: "AdminEquipos",
    label: "Admin Equipos",
    group: "Admin",
    icon: "bi-truck",
    defaultRoles: ["Admin"],
  },
  {
    key: "ProveedoresView",
    routeName: "ProveedoresView",
    label: "Admin Proveedores",
    group: "Admin",
    icon: "bi bi-person-workspace",
    defaultRoles: ["Admin"],
  },
  {
    key: "DashboardEstadisticas",
    routeName: "DashboardEstadisticas",
    label: "Dashboard",
    group: "Admin",
    icon: "bi-speedometer2",
    defaultRoles: ["Admin"],
  },
  {
    key: "AdminConfig",
    routeName: "AdminConfig",
    label: "Configuración Reglas",
    group: "Admin",
    icon: "bi-sliders2-vertical",
    defaultRoles: ["Admin"],
  },
  {
    key: "SoporteGestion",
    routeName: "SoporteGestion",
    label: "Soporte Gestión",
    group: "Admin",
    icon: "bi-headset",
    defaultRoles: ["Admin"],
  },

  {
    key: "Soporte",
    routeName: "Soporte",
    label: "Soporte",
    group: "General",
    icon: "bi-life-preserver",
    defaultRoles: ["Admin", "Generador solped", "Editor", "Aprobador/Editor", "Recepcion_OC", "CargadorDoc"],
  },
  {
    key: "AdminGestionDocs",
    routeName: "AdminGestionDocs",
    label: "Gestor de Facturas",
    group: "Empresa",
    icon: "bi-folder2-open",
    defaultRoles: ["Admin", "Recepcion_OC", "CargadorDoc"],
  },
  {
    key: "AprobacionDocs",
    routeName: "AprobacionDocs",
    label: "Aprobador de Facturas",
    group: "Empresa",
    icon: "bi-file-earmark-check",
    defaultRoles: ["Admin"],
  },
  {
    key: "RecepcionOC",
    routeName: "RecepcionOC",
    label: "Recepción de OC",
    group: "General",
    icon: "bi-inbox",
    defaultRoles: ["Admin", "Editor", "Recepcion_OC"],
  },
  {
    key: "AiInspectorView",
    routeName: "AiInspectorView",
    label: "Chatbot",
    group: "Empresa",
    icon: "bi-robot",
    defaultRoles: ["Admin", "Aprobador/Editor"],
  },
  {
    key: "GenerarCertificados",
    routeName: "GenerarCertificados",
    label: "Generador de certificados",
    group: "Admin",
    icon: "bi-award",
    defaultRoles: ["Admin"],
  },
  {
    key: "SolpedPlantas",
    routeName: "SolpedPlantas",
    label: "Generador de Solped Plantas",
    group: "Plantas",
    icon: "bi bi-buildings",
    defaultRoles: ["Admin", "Generador solped"],
  },
  {
    key: "AprobacionSolped",
    routeName: "AprobacionSolped",
    label: "Aprobador de Solped Plantas",
    group: "Plantas",
    icon: "bi bi-file-check",
    defaultRoles: ["Admin", "Aprobador SOLPED"],
  },
  {
    key: "HistorialSolpedPlanta",
    routeName: "HistorialSolpedPlanta",
    label: "Historial Plantas",
    group: "Plantas",
    icon: "bi bi-file-richtext",
    defaultRoles: ["Admin", "Aprobador/Editor","Editor","Generador solped","Aprobador SOLPED"],
  },
  {
    key: "GeneradorCotizacionPlantas",
    routeName: "GeneradorCotizacionPlantas",
    label: "Generador Cotización Plantas",
    group: "Plantas",
    icon: "bi bi-clipboard2-plus",
    defaultRoles: ["Admin", "Editor"],
  },
  {
    key: "AprobacionCotizacionesPlantas",
    routeName: "AprobacionCotizacionesPlantas",
    label: "Aprobador Cotización Plantas",
    group: "Plantas",
    icon: "bi bi-clipboard2-check",
    defaultRoles: ["Admin", "Aprobador/Editor"],
  },
  {
    key: "HistorialCotizacionesPlantas",
    routeName: "HistorialCotizacionesPlantas",
    label: "Historial Cotización Plantas",
    group: "Plantas",
    icon: "bi bi-file-text",
    defaultRoles: ["Admin", "Aprobador/Editor","Editor","Aprobador SOLPED"],
  },
];
export const MENU_BY_KEY = Object.fromEntries(
  MENU_DEFINITIONS.map((item) => [normKey(item.key), item])
);

export const MENU_BY_ROUTE_NAME = Object.fromEntries(
  MENU_DEFINITIONS.map((item) => [String(item.routeName), item])
);

export function getMenuGroups() {
  return [...new Set(MENU_DEFINITIONS.map((x) => x.group))];
}

export function getLabelFromKey(key) {
  return MENU_BY_KEY[normKey(key)]?.label || key;
}

export function normalizeMenuPerms(menuPerms) {
  const obj = menuPerms && typeof menuPerms === "object" ? menuPerms : {};
  return {
    allow: Array.isArray(obj.allow)
      ? [...new Set(obj.allow.map((x) => String(x)))]
      : [],
    deny: Array.isArray(obj.deny)
      ? [...new Set(obj.deny.map((x) => String(x)))]
      : [],
  };
}

export function getDefaultMenuKeysByRole(role) {
  const roleStr = String(role || "").trim();
  return MENU_DEFINITIONS
    .filter((item) => item.defaultRoles.includes(roleStr))
    .map((item) => item.key);
}

export function buildUserPermissionSet({
  role,
  menuPerms,
  extraAllow = [],
  extraDeny = [],
  useRoleDefaultsWhenAllowEmpty = true,
}) {
  const perms = normalizeMenuPerms(menuPerms);

  const hasExplicitAllow = perms.allow.length > 0;

  const defaults =
    useRoleDefaultsWhenAllowEmpty && !hasExplicitAllow
      ? getDefaultMenuKeysByRole(role).map(normKey)
      : [];

  const allow = new Set([
    ...defaults,
    ...perms.allow.map(normKey),
    ...extraAllow.map(normKey),
  ]);

  const deny = new Set([
    ...perms.deny.map(normKey),
    ...extraDeny.map(normKey),
  ]);

  for (const d of deny) {
    allow.delete(d);
  }

  return { allow, deny, hasExplicitAllow };
}

export function canAccessMenuKey({
  role,
  menuPerms,
  targetKey,
  extraAllow = [],
  extraDeny = [],
  useRoleDefaultsWhenAllowEmpty = true,
}) {
  const key = normKey(targetKey);

  const { allow, deny, hasExplicitAllow } = buildUserPermissionSet({
    role,
    menuPerms,
    extraAllow,
    extraDeny,
    useRoleDefaultsWhenAllowEmpty,
  });

  if (deny.has(key)) return false;

  if (allow.has(key)) return true;

  if (hasExplicitAllow) return false;

  return false;
}

export const ROLE_MENU_TEMPLATES = {
  Admin: getDefaultMenuKeysByRole("Admin"),
  "Aprobador/Editor": getDefaultMenuKeysByRole("Aprobador/Editor"),
  "Generador solped": getDefaultMenuKeysByRole("Generador solped"),
  Editor: getDefaultMenuKeysByRole("Editor"),
  Recepcion_OC: getDefaultMenuKeysByRole("Recepcion_OC"),
  CargadorDoc: getDefaultMenuKeysByRole("CargadorDoc"),
  "Aprobador SOLPED": getDefaultMenuKeysByRole("Aprobador SOLPED")
};

export function getRoleMenuTemplate(role) {
  return [...(ROLE_MENU_TEMPLATES[String(role || "").trim()] || [])];
}
