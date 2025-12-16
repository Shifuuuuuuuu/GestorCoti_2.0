import { computed } from "vue";
import { useAuthStore } from "@/stores/authService";

// Reglas de visibilidad
export function useRoleMenus() {
  const auth = useAuthStore();

  const fullName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || "").trim());
  const email = computed(() => (auth?.user?.email || "").trim().toLowerCase());
  const role  = computed(() => (auth?.profile?.role || auth?.role || "").trim());

  // Excepciones
  const isTallerCMUser = computed(() => {
    const n = fullName.value.toLowerCase();
    return n === "taller cm" || email.value === "tallercm@xtremeservicios.cl";
  });

  // ✅ Excepción Guillermo
  const isGuillermo = computed(() => {
    const n = fullName.value.toLowerCase();
    return n === "guillermo manzor" || email.value === "gmanzor@xtrememining.cl";
  });

  // ⚠️ NUEVO: Excepción Juan Cubillos
  const isJuanCubillos = computed(() => {
    const n = fullName.value.toLowerCase();
    return n === "juan cubillos" || email.value === "jcubillos@xtrememining.cl";
    // agrega otros correos si usa más de uno
  });

  // Roles
  const isGenerador       = computed(() => role.value === "Generador solped");
  const isEditor          = computed(() => role.value === "Editor");
  const isAprobadorEditor = computed(() => role.value === "Aprobador/Editor");
  const isAdmin           = computed(() => role.value === "Admin");

  // Helpers
  const existsByName = (arr, name) => arr.some(it => it && it.name === name);
  const pushIfMissing = (arr, item) => { if (!existsByName(arr, item.name)) arr.push(item); };

  const empresaMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];

    let base = [];
    if (isAdmin.value) {
      base = [
        { name: "solped", text: "Crear SOLPED", icon: "bi-file-plus" },
        { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
        null,
        { name: "GeneradorOC", text: "Generador Cotización", icon: "bi-cart-plus" },
        { name: "historial-oc", text: "Historial Cotizaciones", icon: "bi-journal-text" },
        { name: "AprobacionOC", text: "Aprobador Cotización", icon: "bi-patch-check" },
      ];
    } else if (isGenerador.value && !isTallerCMUser.value) {
      base = [
        { name: "solped", text: "Crear SOLPED", icon: "bi-file-plus" },
        { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver"},
      ];
    } else if (isEditor.value) {
      base = [
        { name: "GeneradorOC", text: "Generador Cotización", icon: "bi-cart-plus" },
        { name: "historial-oc", text: "Historial Cotizaciones", icon: "bi-journal-text" },
        { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
      ];
    } else if (isAprobadorEditor.value) {
      base = [
        { name: "AprobacionOC", text: "Aprobador Cotización", icon: "bi-patch-check" },
        { name: "historial-oc", text: "Historial Cotizaciones", icon: "bi-journal-text" },
        { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
      ];
    }

    // ✅ Excepción Guillermo: Aprobación OC
    if (isGuillermo.value) {
      pushIfMissing(base, { name: "AprobacionOC", text: "Aprobador OC", icon: "bi-patch-check" });
    }


    return base;
  });

  const tallerMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];

    let base = [];
    if (isAdmin.value) {
      base = [
        { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        null,
        { name: "GeneradorOCTaller", text: "Generador Cotización (Taller)", icon: "bi-bag-plus" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver"},
      ];
    } else if (isGenerador.value && isTallerCMUser.value) {
      base = [
        { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver"}
      ];
    } else if (isEditor.value) {
      base = [
        { name: "GeneradorOCTaller", text: "Generador Cotización (Taller)", icon: "bi-bag-plus" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver"},
        { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line"}
      ];
    } else if (isAprobadorEditor.value) {
      base = [
        { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver"},
        { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line"}
      ];
    }

    // ✅ Excepción Guillermo: Aprobación OC Taller
    if (isGuillermo.value) {
      pushIfMissing(base, { name: "AprobacionOCTaller", text: "Aprobador OC (Taller)", icon: "bi-patch-check" });
    }

    // ⚠️ NUEVO: Excepción Juan Cubillos → que siempre vea SolpedTaller (aunque no sea usuario de taller)
    if (isJuanCubillos.value) {
      pushIfMissing(base, { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" });
      // opcional:
      // pushIfMissing(base, { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" });
    }

    return base;
  });

  const adminMenu = computed(() => {
    if (!auth?.isAuthenticated || !isAdmin.value) return [];
    return [
      { name: "AdminSolpes", text: "Admin SOLPED", icon: "bi-gear" },
      { name: "AdminOrdenesOC", text: "Admin OC", icon: "bi-gear-wide-connected" },
      null,
      { name: "AdminSolpedTaller", text: "Admin SOLPED (Taller)", icon: "bi-gear" },
      { name: "AdminOrdenesOCTaller", text: "Admin OC (Taller)", icon: "bi-gear-wide-connected" },
      null,
      { name: "AdminUsuarios", text: "Admin Usuarios", icon: "bi bi-person"},
      { name: "AdminEquipos", text: "Admin Equipos", icon: "bi bi-car-front"},
      { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line"},
      { name: "AdminConfig", text: "Configuracion Reglas", icon: "bi bi-pc-display-horizontal"},
      { name: "SoporteGestion", text: "SoporteGestion", icon: "bi bi-person-gear"},
      { name: "AdminGestionDocs", text: "Gestor de Facturas", icon: "bi bi-folder2-open"},
      { name: "AprobacionDocs", text: "Aprobador de Facturas", icon: "bi bi-clipboard2-check"}
    ];
  });

  return {
    empresaMenu,
    tallerMenu,
    adminMenu,
  };
}
