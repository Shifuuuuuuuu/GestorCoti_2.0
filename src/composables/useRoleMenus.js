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

function compactMenu(arr = []) {
  const out = [];
  for (const it of arr) {
    if (it === null) {
      if (out.length && out[out.length - 1] !== null) out.push(null);
    } else {
      out.push(it);
    }
  }
  while (out.length && out[0] === null) out.shift();
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

export function useRoleMenus() {
  const auth = useAuthStore();

  const fullName = computed(() =>
    (auth?.profile?.fullName || auth?.user?.displayName || "").trim()
  );
  const email = computed(() => (auth?.user?.email || "").trim().toLowerCase());

  const role = computed(() => (auth?.profile?.role || auth?.role || "").trim());
  const roleKey = computed(() => normalizeRoleKey(role.value));
  const menuPerms = computed(() => auth?.profile?.menuPerms || { allow: [], deny: [] });
  const allowedSet = computed(() => new Set((menuPerms.value.allow || []).map(String)));
  const deniedSet = computed(() => new Set((menuPerms.value.deny || []).map(String)));

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

  const isPatricioBustos = computed(() => normalize(fullName.value) === "patricio bustos");
  const isAxelBasicContreras = computed(() => normalize(fullName.value) === "axel basic contreras");
  const isGriselleMatus = computed(() => normalize(fullName.value) === "griselle matus");
  const isMariaJoseBallesteros = computed(() => {
    const n = normalize(fullName.value);
    return (
      n === "maria jose ballesteros" ||
      n === "maría jose ballesteros" ||
      email.value === "mballesteros@xtrememining.cl" ||
      email.value === "mjb@xtrememining.cl"
    );
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

  const isCargadorDoc = computed(() => {
    return roleKey.value === "cargadordoc" || roleKey.value === "cargador_doc";
  });

  const canSeeGenerarCotizacion = computed(() => {
    if (isTallerCMUser.value) return false;
    return (
      isAdmin.value ||
      isJuanCubillos.value ||
      isPatricioBustos.value ||
      isAxelBasicContreras.value ||
      isGriselleMatus.value
    );
  });

  const canSeeGenerarCotizacionEmpresa = computed(() => {
    if (isTallerCMUser.value) return false;
    return isEditor.value || isGenerador.value || canSeeGenerarCotizacion.value;
  });

  // ✅ Juan Cubillos incluido
  const canSeeAprobacionDocs = computed(() => {
    if (isAdmin.value || isAlejandroCandia.value || isJuanCubillos.value) return true;

    if (roleKey.value === "aprobador_facturas" || roleKey.value === "aprobador_docs") return true;

    // habilitar por menuPerms.allow si lo usas
    if (allowedSet.value.has("AprobacionDocs")) return true;

    return false;
  });

  const canSeeAprobacionOC = computed(() => {
    return isAdmin.value || isGuillermo.value || isAprobadorEditor.value || isMariaJoseBallesteros.value;
  });

  const canSeeAprobacionOCTaller = computed(() => {
    return isAdmin.value || isGuillermo.value || isAprobadorEditor.value || isMariaJoseBallesteros.value;
  });

  // ✅ deny manda siempre; bypass allow-list para AprobacionDocs si canSeeAprobacionDocs=true
  function isAllowedRouteName(name) {
    const n = String(name || "");
    if (!n) return false;

    if (n === "GenerarCotizacion" && isTallerCMUser.value) return false;

    // 1) deny manda siempre
    if (deniedSet.value.has(n)) return false;

    // 2) bypass allow para Facturas
    if (n === "AprobacionDocs" && canSeeAprobacionDocs.value) return true;

    // 3) allow-list normal
    const hasAllow = (menuPerms.value.allow || []).length > 0;
    if (hasAllow && !allowedSet.value.has(n)) return false;

    return true;
  }

  function filterMenuByPerms(menuArr) {
    const filtered = (menuArr || []).filter((it) => {
      if (it === null) return true;
      return isAllowedRouteName(it.name);
    });
    return compactMenu(filtered);
  }

  const existsByName = (arr, name) => arr.some((it) => it && it.name === name);
  const pushIfMissing = (arr, item) => {
    if (!existsByName(arr, item.name)) arr.push(item);
  };

  const alejandroUnifiedMenu = () => [
    { name: "AprobacionOC", text: "Aprobador Cotización", icon: "bi-patch-check" },
    { name: "AprobacionOCTaller", text: "Aprobador Cotización (Taller)", icon: "bi-patch-check" },
    { name: "AprobacionDocs", text: "Aprobador de Facturas", icon: "bi bi-clipboard2-check" },
    { name: "DashboardEstadisticas", text: "Dashboard", icon: "bi bi-bar-chart-line" },
    null,
    { name: "historial-solped", text: "Historial SOLPED", icon: "bi-clock-history" },
    { name: "historial-oc", text: "Historial Cotizaciones", icon: "bi-journal-text" },
    { name: "HistorialSolpedTaller", text: "Historial SOLPED (Taller)", icon: "bi-clock-history" },
    { name: "HistorialOCTaller", text: "Historial Cotizaciones (Taller)", icon: "bi-journal-text" },
  ];

  const empresaMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];

    if (isCargadorDoc.value) {
      return filterMenuByPerms([
        { name: "AdminGestionDocs", text: "Gestor de Facturas", icon: "bi bi-folder2-open" },
        { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
      ]);
    }

    if (isAlejandroCandia.value && !isAdmin.value) {
      return filterMenuByPerms(alejandroUnifiedMenu());
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

    if (canSeeAprobacionOC.value) {
      pushIfMissing(base, { name: "AprobacionOC", text: "Aprobador Cotización", icon: "bi-patch-check" });
    }

    if (canSeeGenerarCotizacionEmpresa.value) {
      pushIfMissing(base, {
        name: "GenerarCotizacion",
        text: "Generador de cotización",
        icon: "bi bi-clipboard2-minus",
      });
    }

    // ✅ Facturas SOLO una vez (en EMPRESA)
    if (canSeeAprobacionDocs.value) {
      pushIfMissing(base, {
        name: "AprobacionDocs",
        text: "Aprobador de Facturas",
        icon: "bi bi-clipboard2-check",
      });
    }

    return filterMenuByPerms(base);
  });

  const tallerMenu = computed(() => {
    if (!auth?.isAuthenticated) return [];
    if (isCargadorDoc.value) return [];
    if (isAlejandroCandia.value && !isAdmin.value) return [];

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

    if (canSeeAprobacionOCTaller.value) {
      pushIfMissing(base, {
        name: "AprobacionOCTaller",
        text: "Aprobador Cotización (Taller)",
        icon: "bi-patch-check",
      });
    }

    if (isJuanCubillos.value) {
      pushIfMissing(base, {
        name: "SolpedTaller",
        text: "Crear SOLPED (Taller)",
        icon: "bi-wrench-adjustable-circle",
      });
    }

    // ✅ IMPORTANTE: NO agregamos AprobacionDocs en TALLER
    // (así no se duplica el item para Juan ni para nadie)

    return filterMenuByPerms(base);
  });

  const adminMenu = computed(() => {
    if (!auth?.isAuthenticated || !isAdmin.value) return [];
    return filterMenuByPerms([
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
      { name: "RecepcionOC", text: "Recepción de OC", icon: "bi bi-receipt" },
      { name: "AiInspectorView", text: "Chatbot", icon: "bi bi-robot" },
      { name: "GenerarCertificados", text: "Generador de certificados", icon: "bi bi-clipboard2" },
    ]);
  });

  const recepcionMenu = computed(() => {
    if (!auth?.isAuthenticated || !isRecepcion.value) return [];
    return filterMenuByPerms([
      { name: "RecepcionOC", text: "Recepción de OC", icon: "bi bi-receipt" },
      { name: "Soporte", text: "Soporte", icon: "bi bi-life-preserver" },
    ]);
  });

  return {
    empresaMenu,
    tallerMenu,
    adminMenu,
    recepcionMenu,
  };
}
