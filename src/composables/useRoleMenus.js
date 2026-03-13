// src/composables/useRoleMenus.js
import { computed } from "vue";
import { useAuthStore } from "@/stores/authService";
import {
  MENU_DEFINITIONS,
  canAccessMenuKey,
  normKey,
} from "@/config/menuPermissions";

const normalize = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

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

  const email = computed(() =>
    (auth?.user?.email || "").trim().toLowerCase()
  );

  const role = computed(() =>
    (auth?.profile?.role || auth?.role || "").trim()
  );

  const menuPerms = computed(() =>
    auth?.profile?.menuPerms || { allow: [], deny: [] }
  );

  const specialAccess = computed(() => {
    const n = normalize(fullName.value);

    const isTallerCMUser =
      n === "taller cm" || email.value === "tallercm@xtremeservicios.cl";

    const isGuillermo =
      n === "guillermo manzor" || email.value === "gmanzor@xtrememining.cl";

    const isJuanCubillos =
      n === "juan cubillos" || email.value === "jcubillos@xtrememining.cl";

    const isAlejandroCandia =
      n === "alejandro candia" || email.value === "acp@xtrememining.cl";

    const isMariaJoseBallesteros =
      n === "maria jose ballesteros" ||
      n === "maría jose ballesteros" ||
      email.value === "mballesteros@xtrememining.cl" ||
      email.value === "mjb@xtrememining.cl";

    const isPatricioBustos = n === "patricio bustos";
    const isAxelBasicContreras = n === "axel basic contreras";
    const isGriselleMatus = n === "griselle matus";

    const extraAllow = [];
    const extraDeny = [];

    if (isTallerCMUser && normKey(role.value) === "generador_solped") {
      extraAllow.push(
        "SolpedTaller",
        "HistorialSolpedTaller",
        "HistorialOCTaller",
        "Soporte"
      );
    }

    if (isGuillermo || isMariaJoseBallesteros || normKey(role.value) === "aprobador_editor") {
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

    return { extraAllow, extraDeny };
  });

  const visibleMenus = computed(() => {
    if (!auth?.isAuthenticated) return [];

    const { extraAllow, extraDeny } = specialAccess.value;

    return MENU_DEFINITIONS
      .filter((item) =>
        canAccessMenuKey({
          role: role.value,
          menuPerms: menuPerms.value,
          targetKey: item.key,
          extraAllow,
          extraDeny,
          useRoleDefaultsWhenAllowEmpty: true,
        })
      )
      .map((item) => ({
        name: item.routeName,
        text: item.label,
        icon: item.icon,
        group: item.group,
        key: item.key,
      }));
  });

  const empresaMenu = computed(() =>
    compactMenu(visibleMenus.value.filter((x) => x.group === "Empresa"))
  );

  const tallerMenu = computed(() =>
    compactMenu(visibleMenus.value.filter((x) => x.group === "Taller"))
  );

  const adminMenu = computed(() =>
    compactMenu(visibleMenus.value.filter((x) => x.group === "Admin"))
  );

  const recepcionMenu = computed(() =>
    compactMenu(
      visibleMenus.value.filter(
        (x) =>
          x.key === "RecepcionOC" ||
          x.key === "Soporte"
      )
    )
  );

  return {
    empresaMenu,
    tallerMenu,
    adminMenu,
    recepcionMenu,
    visibleMenus,
  };
}
