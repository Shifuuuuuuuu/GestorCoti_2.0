// src/stores/authService.js
import { defineStore } from "pinia";
import { auth, db } from "@/stores/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useUIStore } from "@/stores/ui";

function normalizeMenuPerms(profile) {
  if (!profile || typeof profile !== "object") return null;

  const mp = profile.menuPerms || {};
  const allow = Array.isArray(mp.allow) ? mp.allow.map(String) : [];
  const deny = Array.isArray(mp.deny) ? mp.deny.map(String) : [];

  profile.menuPerms = { allow, deny };
  return profile;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    initializing: true,
    error: "",
    rememberedEmail: localStorage.getItem("rememberedEmail") || "",
    keepSession: localStorage.getItem("keepSession") === "1",
    _unsubProfile: null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    email: (s) => s.user?.email || s.profile?.email || "",
    role: (s) => (s.profile?.role || "").trim(),
    fullName: (s) => (s.profile?.fullName || s.user?.displayName || "").trim(),
    photoURL: (s) =>
      s.user?.photoURL ||
      s.profile?.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        (s.profile?.fullName || s.user?.email || "User").trim()
      )}&background=EEE&color=111`,
  },
  actions: {
    async initAuth() {
      return new Promise((resolve) => {
        const ui = useUIStore();

        if (this._unsubProfile) {
          this._unsubProfile();
          this._unsubProfile = null;
        }

        onAuthStateChanged(auth, (u) => {
          this.user = u || null;

          if (u?.uid) {
            const dref = doc(db, "Usuarios", u.uid);

            this._unsubProfile = onSnapshot(
              dref,
              (snap) => {
                const data = snap.exists() ? snap.data() : null;
                this.profile = normalizeMenuPerms(data);

                try {
                  ui.loadFromProfile(this.profile);
                } catch (e) {
                  console.error(e);
                }

                this.initializing = false;
                resolve(u);
              },
              (err) => {
                console.error("Perfil snapshot error:", err);
                this.profile = null;
                this.initializing = false;
                resolve(u);
              }
            );
          } else {
            this.profile = null;
            this.initializing = false;
            resolve(u);
          }
        });
      });
    },

    setRememberedEmail(email, remember) {
      if (remember && email) {
        localStorage.setItem("rememberedEmail", email);
        this.rememberedEmail = email;
      } else {
        localStorage.removeItem("rememberedEmail");
        this.rememberedEmail = "";
      }
    },

    setKeepSession(value) {
      this.keepSession = !!value;
      localStorage.setItem("keepSession", this.keepSession ? "1" : "0");
    },

    async login(email, password, keep = true) {
      this.error = "";
      await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      this.user = cred.user;
      return cred.user;
    },

    async logout() {
      if (this._unsubProfile) {
        this._unsubProfile();
        this._unsubProfile = null;
      }
      await signOut(auth);
      this.user = null;
      this.profile = null;
    },

    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email);
    },
  },
});
