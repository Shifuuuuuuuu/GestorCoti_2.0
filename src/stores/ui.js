// src/stores/ui.js
import { defineStore } from "pinia";
import { db } from "@/stores/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/stores/authService";

const LOCAL_KEY_STYLE   = "ui.menuStyle"; // 'navbar' | 'sidebar'
const LOCAL_KEY_THEME   = "ui.theme";     // 'light' | 'dark'
const LOCAL_KEY_PRIMARY = "ui.primary";   // clave de PRIMARY_MAP

// Paletas con 3 tonos (base, d1, d2) para mapear a tus variables --xt-red, --xt-red-d1, --xt-red-d2
const PRIMARY_MAP = {
  // Existentes
  turquesa: { base: "#0d9488", d1: "#0b776d", d2: "#075a53" }, // teal
  azul:     { base: "#2563eb", d1: "#1e4fc2", d2: "#173d96" },
  verde:    { base: "#16a34a", d1: "#14833e", d2: "#0f6230" },
  rojo:     { base: "#c62828", d1: "#b71c1c", d2: "#8e1515" },
  amarillo: { base: "#f59e0b", d1: "#c47e08", d2: "#915e06" },
  rosado:   { base: "#db2777", d1: "#b01f61", d2: "#88184d" },
  celeste:  { base: "#06b6d4", d1: "#0891b2", d2: "#0e7490" }, // cyan claro
  violeta:  { base: "#7c3aed", d1: "#622fbc", d2: "#4a248c" },
  naranjo:  { base: "#f97316", d1: "#c75c12", d2: "#98460e" },

  // NUEVOS
  gris:     { base: "#6b7280", d1: "#4b5563", d2: "#374151" },
  negro:    { base: "#111827", d1: "#0b1220", d2: "#060a12" },
  lima:     { base: "#84cc16", d1: "#65a30d", d2: "#4d7c0f" },
  esmeralda:{ base: "#10b981", d1: "#0e9870", d2: "#0b7657" },
  cian:     { base: "#0891b2", d1: "#0e7490", d2: "#155e75" },
  indigo:   { base: "#4f46e5", d1: "#3b36b3", d2: "#2a2785" },
  marron:   { base: "#8b5e34", d1: "#6f4a29", d2: "#55381f" },
  granate:  { base: "#991b1b", d1: "#7f1616", d2: "#661111" },
  oliva:    { base: "#708238", d1: "#57682c", d2: "#455224" },
  menta:    { base: "#2dd4bf", d1: "#14b8a6", d2: "#0d9488" },
  salmon:   { base: "#fb7185", d1: "#e11d48", d2: "#be123c" },
  dorado:   { base: "#d4af37", d1: "#b68e2d", d2: "#8f6f22" },
  cobre:    { base: "#b87333", d1: "#915c29", d2: "#6e461f" },
};

export const useUIStore = defineStore("ui", {
  state: () => ({
    menuStyle: localStorage.getItem(LOCAL_KEY_STYLE) || "navbar",
    theme:     localStorage.getItem(LOCAL_KEY_THEME) || "light",
    primary:   localStorage.getItem(LOCAL_KEY_PRIMARY) || "rojo", // por defecto rojo
    saving: false,
    isSidebarOpen: false,
  }),
  getters: {
    isNavbar: (s) => s.menuStyle === "navbar",
    isSidebar: (s) => s.menuStyle === "sidebar",
    isDark: (s) => s.theme === "dark",
    isLight: (s) => s.theme === "light",
    primaryList: () => Object.keys(PRIMARY_MAP),
  },
  actions: {
    initUI() {
      // tema
      const t = localStorage.getItem(LOCAL_KEY_THEME);
      if (t === "dark" || t === "light") this.theme = t;
      this.applyTheme(this.theme);

      // primario
      const p = localStorage.getItem(LOCAL_KEY_PRIMARY);
      if (p && PRIMARY_MAP[p]) this.primary = p;
      this.applyPrimary(this.primary);
    },

    applyTheme(theme) {
      const html = document.documentElement;
      html.classList.remove("theme-dark", "theme-light");
      html.classList.add(theme === "dark" ? "theme-dark" : "theme-light");

      // 🔑 Clave para que Bootstrap 5.3+ cambie sus tokens (fondo, texto, etc.)
      html.setAttribute("data-bs-theme", theme === "dark" ? "dark" : "light");
    },

    applyPrimary(primaryKey) {
      const pal = PRIMARY_MAP[primaryKey] || PRIMARY_MAP.rojo;
      const root = document.documentElement;

      // mapea a tus variables existentes (reutilizadas en componentes)
      root.style.setProperty("--xt-red",    pal.base);
      root.style.setProperty("--xt-red-d1", pal.d1);
      root.style.setProperty("--xt-red-d2", pal.d2);

      // utilidades base
      root.style.setProperty("--xt-white",    "#ffffff");
      root.style.setProperty("--xt-white-75", "rgba(255,255,255,.75)");
      root.style.setProperty("--xt-white-60", "rgba(255,255,255,.6)");
      root.style.setProperty("--xt-white-10", "rgba(255,255,255,.10)");
      root.style.setProperty("--xt-black-18", "rgba(0,0,0,.18)");
    },

    async setMenuStyle(style = "navbar") {
      if (style !== "navbar" && style !== "sidebar") return;
      this.menuStyle = style;
      localStorage.setItem(LOCAL_KEY_STYLE, style);

      const auth = useAuthStore();
      if (auth?.user?.uid) {
        try {
          this.saving = true;
          const ref = doc(db, "Usuarios", auth.user.uid);
          const nextUi = { ...(auth.profile?.ui || {}), menuStyle: style, theme: this.theme, primary: this.primary };
          await updateDoc(ref, { ui: nextUi });
        } catch (e) {
          console.warn("No se pudo guardar UI.menuStyle:", e);
        } finally {
          this.saving = false;
        }
      }
    },

    async setTheme(theme = "light") {
      if (theme !== "light" && theme !== "dark") return;
      this.theme = theme;
      localStorage.setItem(LOCAL_KEY_THEME, theme);
      this.applyTheme(theme);

      const auth = useAuthStore();
      if (auth?.user?.uid) {
        try {
          this.saving = true;
          const ref = doc(db, "Usuarios", auth.user.uid);
          const nextUi = { ...(auth.profile?.ui || {}), theme, menuStyle: this.menuStyle, primary: this.primary };
          await updateDoc(ref, { ui: nextUi });
        } catch (e) {
          console.warn("No se pudo guardar UI.theme:", e);
        } finally {
          this.saving = false;
        }
      }
    },

    async setPrimary(primary = "rojo") {
      if (!PRIMARY_MAP[primary]) return;
      this.primary = primary;
      localStorage.setItem(LOCAL_KEY_PRIMARY, primary);
      this.applyPrimary(primary);

      const auth = useAuthStore();
      if (auth?.user?.uid) {
        try {
          this.saving = true;
          const ref = doc(db, "Usuarios", auth.user.uid);
          const nextUi = { ...(auth.profile?.ui || {}), primary, theme: this.theme, menuStyle: this.menuStyle };
          await updateDoc(ref, { ui: nextUi });
        } catch (e) {
          console.warn("No se pudo guardar UI.primary:", e);
        } finally {
          this.saving = false;
        }
      }
    },

    toggleTheme() { this.setTheme(this.isDark ? "light" : "dark"); },

    loadFromProfile(profile) {
      if (!profile?.ui) return;
      const { menuStyle, theme, primary } = profile.ui;

      if (menuStyle === "navbar" || menuStyle === "sidebar") {
        this.menuStyle = menuStyle;
        localStorage.setItem(LOCAL_KEY_STYLE, menuStyle);
      }
      if (theme === "light" || theme === "dark") {
        this.theme = theme;
        localStorage.setItem(LOCAL_KEY_THEME, theme);
        this.applyTheme(theme);
      }
      if (primary && PRIMARY_MAP[primary]) {
        this.primary = primary;
        localStorage.setItem(LOCAL_KEY_PRIMARY, primary);
        this.applyPrimary(primary);
      } else {
        this.applyPrimary(this.primary);
      }
    },

    openSidebar()  { this.isSidebarOpen = true;  },
    closeSidebar() { this.isSidebarOpen = false; },
    toggleSidebar(){ this.isSidebarOpen = !this.isSidebarOpen; },
  },
});
