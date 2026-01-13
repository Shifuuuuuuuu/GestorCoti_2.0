// src/composables/useRoleMenus.js
import { computed } from "vue";
import { useAuthStore } from "@/stores/authService";

const normalize = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const normalizeRoleKey = (s) => normalize(s).replace(/\s+/g, "_");

export function useRoleMenus() {
  const auth = useAuthStore();

  const fullName = computed(() =>
    (auth?.profile?.fullName || auth?.user?.displayName || "").trim()
  );
  const email = computed(() =>
    (auth?.user?.email || "").trim().toLowerCase()
  );

  const role = computed(() =>
    (auth?.profile?.role || auth?.role || "").trim()
  );

  const roleKey = computed(() => normalizeRoleKey(role.value));

  const isTallerCMUser = computed(() => {
    const n = normalize(fullName.value);
    return n === "taller cm" || email.value === "tallercm@xtremeservicios.cl";
  });

  const isGuillermo = computed(() => {
    const n = normalize(fullName.value);
    return n === "guillermo manzor" || email.value === "gmanzor@xtrememining.cl";
  });

  const isJuanCubillos = computed(() => {
    const n = normalize(fullName.value);
    return n === "juan cubillos" || email.value === "jcubillos@xtrememining.cl";
  });

  const isAlejandroCandia = computed(() => {
    const n = normalize(fullName.value);
    return n === "alejandro candia" || email.value === "acp@xtrememining.cl";
  });

  const isGenerador = computed(() => roleKey.value === "generador_solped");
  const isEditor = computed(() => roleKey.value === "editor");
  const isAprobadorEditor = computed(
    () => roleKey.value === "aprobador/editor" || roleKey.value === "aprobador_editor"
  );
  const isAdmin = computed(() => roleKey.value === "admin");

  const isRecepcion = computed(() => {
    return (
      roleKey.value === "recepcion_oc" ||
      roleKey.value === "recepcion" ||
      normalizeRoleKey(role.value) === "recepcion_oc"
    );
  });

  const canSeeGenerarCotizacion = computed(() => isAdmin.value || isJuanCubillos.value);
  const canSeeAprobacionDocs = computed(() => isAdmin.value || isAlejandroCandia.value);

  const existsByName = (arr, name) => arr.some((it) => it && it.name === name);
  const pushIfMissing = (arr, item) => {
    if (!existsByName(arr, item.name)) arr.push(item);
  };

  const alejandroUnifiedMenu = () => ([
    { name: "AprobacionOC", text: "Aprobador Cotización", icon: "bi-patch-check" },
    { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
    { name: "AprobacionDocs", text: "Aprobador de Facturas", icon: "bi bi-clipboard2-check" },
    { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line" },
    null,
    { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
    { name: "historial-oc", text: "Historial Cotizaciones", icon: "bi-journal-text" },
    { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
    { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
  ]);

  const empresaMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];

    if (isAlejandroCandia.value && !isAdmin.value) {
      return alejandroUnifiedMenu();
    }

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
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
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

    if (isGuillermo.value) {
      pushIfMissing(base, { name: "AprobacionOC", text: "Aprobador OC", icon: "bi-patch-check" });
    }

    // ✅ Juan (y Admin) => Generador de Cotización SOLO en EMPRESA
    if (canSeeGenerarCotizacion.value) {
      pushIfMissing(base, {
        name: "GenerarCotizacion",
        text: "Generador de cotización",
        icon: "bi bi-clipboard2-minus",
      });
    }

    if (canSeeAprobacionDocs.value) {
      pushIfMissing(base, {
        name: "AprobacionDocs",
        text: "Aprobador de Facturas",
        icon: "bi bi-clipboard2-check",
      });
    }

    return base;
  });

  const tallerMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];

    if (isAlejandroCandia.value && !isAdmin.value) {
      return [];
    }

    let base = [];

    if (isAdmin.value) {
      base = [
        { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        null,
        { name: "GeneradorOCTaller", text: "Generador Cotización (Taller)", icon: "bi-bag-plus" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
      ];
    } else if (isGenerador.value && isTallerCMUser.value) {
      base = [
        { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
      ];
    } else if (isEditor.value) {
      base = [
        { name: "GeneradorOCTaller", text: "Generador Cotización (Taller)", icon: "bi-bag-plus" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
        { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line" },
      ];
    } else if (isAprobadorEditor.value) {
      base = [
        { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
        { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
        { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
        { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line" },
        { name: "AiInspectorView", text: "Chatbot", icon: "bi bi-robot" },
      ];
    }

    if (isGuillermo.value) {
      pushIfMissing(base, { name: "AprobacionOCTaller", text: "Aprobador OC (Taller)", icon: "bi-patch-check" });
    }

    if (isJuanCubillos.value) {
      pushIfMissing(base, { name: "SolpedTaller", text: "Crear SOLPED (Taller)", icon: "bi-wrench-adjustable-circle" });
    }

    // ✅ Evitar duplicado: NO agregar GenerarCotizacion en TALLER para Juan
    if (canSeeGenerarCotizacion.value && !isJuanCubillos.value) {
      pushIfMissing(base, {
        name: "GenerarCotizacion",
        text: "Generador de cotización",
        icon: "bi bi-clipboard2-minus",
      });
    }

    if (canSeeAprobacionDocs.value) {
      pushIfMissing(base, { name: "AprobacionDocs", text: "Aprobador de Facturas", icon: "bi bi-clipboard2-check" });
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
      { name: "AdminUsuarios", text: "Admin Usuarios", icon: "bi bi-person" },
      { name: "AdminEquipos", text: "Admin Equipos", icon: "bi bi-car-front" },
      { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line" },
      { name: "AdminConfig", text: "Configuracion Reglas", icon: "bi bi-pc-display-horizontal" },
      { name: "SoporteGestion", text: "SoporteGestion", icon: "bi bi-person-gear" },
      { name: "AdminGestionDocs", text: "Gestor de Facturas", icon: "bi bi-folder2-open" },
      { name: "AprobacionDocs", text: "Aprobador de Facturas", icon: "bi bi-clipboard2-check" },
      { name: "RecepcionOC", text: "Recepción de OC", icon: "bi bi-receipt" },
      { name: "AiInspectorView", text: "Chatbot", icon: "bi bi-robot" },
      { name: "GenerarCotizacion", text: "Generador de cotización", icon: "bi bi-clipboard2-minus" },
      { name: "GenerarCertificados", text: "Generador de certificados", icon: "bi bi-clipboard2" },
    ];
  });

  const recepcionMenu = computed(() => {
    if (!auth?.isAuthenticated || !isRecepcion.value) return [];
    return [
      { name: "RecepcionOC", text: "Recepción de OC", icon: "bi bi-receipt" },
      { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
    ];
  });

  return {
    empresaMenu,
    tallerMenu,
    adminMenu,
    recepcionMenu,
  };
}
