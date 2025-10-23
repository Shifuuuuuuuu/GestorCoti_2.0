// src/stores/ui.js
import { defineStore } from "pinia";
import { db } from "@/stores/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/stores/authService";

const LOCAL_KEY_STYLE = "ui.menuStyle"; // 'navbar' | 'sidebar'
const LOCAL_KEY_THEME = "ui.theme";     // 'light' | 'dark'

export const useUIStore = defineStore("ui", {
  state: () => ({
    menuStyle: localStorage.getItem(LOCAL_KEY_STYLE) || "navbar",
    theme: localStorage.getItem(LOCAL_KEY_THEME) || "light", // por defecto claro
    saving: false,
  }),
  getters: {
    isNavbar: (s) => s.menuStyle === "navbar",
    isSidebar: (s) => s.menuStyle === "sidebar",
    isDark: (s) => s.theme === "dark",
    isLight: (s) => s.theme === "light",
  },
  actions: {
    /** Llamar una sola vez al arrancar la app */
    initUI() {
      // si hay tema guardado en localStorage, aplícalo
      const t = localStorage.getItem(LOCAL_KEY_THEME);
      if (t === "dark" || t === "light") this.theme = t;

      // añade la clase al <html>
      this.applyTheme(this.theme);
    },

    applyTheme(theme) {
      const html = document.documentElement;
      html.classList.remove("theme-dark", "theme-light");
      html.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
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
          const nextUi = { ...(auth.profile?.ui || {}), menuStyle: style, theme: this.theme };
          await updateDoc(ref, { ui: nextUi });
        } catch (e) {
          console.warn("No se pudo guardar UI.menuStyle en Firestore:", e);
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
          const nextUi = { ...(auth.profile?.ui || {}), theme, menuStyle: this.menuStyle };
          await updateDoc(ref, { ui: nextUi });
        } catch (e) {
          console.warn("No se pudo guardar UI.theme en Firestore:", e);
        } finally {
          this.saving = false;
        }
      }
    },

    toggleTheme() { this.setTheme(this.isDark ? "light" : "dark"); },

    /** Cuando llega el perfil de Firestore, hidrata preferencias */
    loadFromProfile(profile) {
      if (!profile?.ui) return;
      const { menuStyle, theme } = profile.ui;

      if (menuStyle === "navbar" || menuStyle === "sidebar") {
        this.menuStyle = menuStyle;
        localStorage.setItem(LOCAL_KEY_STYLE, menuStyle);
      }
      if (theme === "light" || theme === "dark") {
        this.theme = theme;
        localStorage.setItem(LOCAL_KEY_THEME, theme);
        this.applyTheme(theme);
      }
    },
  },
});
