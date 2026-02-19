<!-- eslint-disable vue/multi-word-component-names -->
<!-- src/views/Login.vue -->
<template>
  <div class="auth-bg">
    <div class="container min-vh-100 d-flex align-items-center">
      <div class="row w-100 justify-content-center g-4">
        <div class="col-lg-6 d-none d-lg-block">
          <div class="hero card-ghost p-4 p-xl-5 h-100 d-flex">
            <div class="w-100">
              <div class="brand-carousel mb-4">
                <transition name="fade" mode="out-in">
                  <img
                    :key="carouselIndex"
                    :src="currentImage.src"
                    :class="['brand-slide', currentImage.size]"
                    alt="Brand"
                  />
                </transition>
              </div>

              <h1 class="display-6 text-secondary fw-semibold mb-3">Plataforma de SOLPED y Cotizaciones</h1>
              <p class="lead text-secondary-emphasis mb-4">
                Centraliza tus <strong>SOLPED</strong>, validaciones y cotizaciones en un mismo lugar.
                Acceso seguro y control por roles.
              </p>
              <ul class="hero-list">
                <li>Generadores: crea y gestiona tus solicitudes</li>
                <li>Edición y seguimiento de cotizaciones</li>
                <li>Aprobaciones con historial y trazabilidad</li>
                <li>Panel de administración para tu equipo</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-10 col-lg-5">
          <div class="card auth-card shadow-lg border-0">
            <div class="card-body p-4 p-md-5">
              <div class="text-center mb-4">
                <div class="logo-ring mb-3">
                  <img :src="currentImage.src" :class="['brand-logo', currentImage.size]" alt="Logo activo" />
                </div>
                <h2 class="h4 fw-semibold mb-1">Iniciar sesión</h2>
                <p class="text-muted mb-0">Usa tu correo corporativo.</p>
              </div>
              <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{{ error }}</div>
              </div>
              <form ref="formRef" class="needs-validation" novalidate @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label class="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    class="form-control"
                    :class="{'is-invalid': tried && !validEmail}"
                    v-model.trim="email"
                    required
                    autocomplete="email"
                    placeholder="tu@empresa.cl"
                  />
                  <div class="invalid-feedback">Ingresa un correo válido.</div>
                </div>
                <div class="mb-2">
                  <label class="form-label d-flex justify-content-between align-items-center">
                    <span>Contraseña</span>
                    <button type="button" class="btn btn-link p-0 small" @click="abrirReset">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </label>
                  <div class="input-group">
                    <input
                      :type="mostrarPass ? 'text' : 'password'"
                      class="form-control"
                      :class="{'is-invalid': tried && !password}"
                      v-model="password"
                      required
                      autocomplete="current-password"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="mostrarPass = !mostrarPass"
                      :aria-pressed="mostrarPass"
                    >
                      <i :class="mostrarPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                    <div class="invalid-feedback">La contraseña es obligatoria.</div>
                  </div>
                </div>
                <div class="d-flex flex-column gap-2 my-3">
                  <div class="form-check">
                    <input id="keep" class="form-check-input" type="checkbox" v-model="keep" />
                    <label class="form-check-label" for="keep">Mantener sesión</label>
                  </div>
                </div>
                <div class="d-grid mt-3">
                  <button class="btn btn-primary btn-lg" type="submit" :disabled="cargando">
                    <span v-if="!cargando">Ingresar</span>
                    <span v-else class="d-inline-flex align-items-center">
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Validando…
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div v-if="showReset" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,.5);">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content border-0 shadow">
                <div class="modal-header">
                  <h5 class="modal-title">Recuperar contraseña</h5>
                  <button type="button" class="btn-close" @click="cerrarReset"></button>
                </div>
                <div class="modal-body">
                  <p class="mb-2">Ingresa tu correo para recibir el enlace de restablecimiento.</p>
                  <input
                    type="email"
                    class="form-control"
                    :class="{'is-invalid': intentReset && !validResetEmail}"
                    v-model.trim="emailReset"
                    placeholder="tu@empresa.cl"
                    required
                  />
                  <div class="invalid-feedback">Ingresa un correo válido.</div>

                  <div v-if="msgReset" class="alert alert-info mt-3">{{ msgReset }}</div>
                  <div v-if="errorReset" class="alert alert-danger mt-3">{{ errorReset }}</div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" @click="cerrarReset">Cancelar</button>
                  <button class="btn btn-primary" :disabled="enviandoReset" @click="enviarReset">
                    <span v-if="!enviandoReset">Enviar</span>
                    <span v-else class="d-inline-flex align-items-center">
                      <span class="spinner-border spinner-border-sm me-2"></span> Enviando…
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authService";
import { db } from "../stores/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const imgHormigon = new URL("../assets/Xtreme Hormigoenes y mortero clear.png", import.meta.url).href;
const imgMining   = new URL("../assets/Logo Xtreme Mining.png", import.meta.url).href;
const imgServicios= new URL("../assets/Logo XT Servicios Transparente.png", import.meta.url).href;

const carouselImgs = [
  { src: imgHormigon,  size: "sm" },
  { src: imgMining,    size: "sm" },
  { src: imgServicios, size: "sm" },
];

const carouselIndex  = ref(0);
const currentImage   = computed(() => carouselImgs[carouselIndex.value]);

let carouselTimer = null;
onMounted(() => {
  carouselTimer = setInterval(() => {
    carouselIndex.value = (carouselIndex.value + 1) % carouselImgs.length;
  }, 3000);
});
onBeforeUnmount(() => {
  if (carouselTimer) clearInterval(carouselTimer);
});

const router = useRouter();
const auth = useAuthStore();
const email = ref(auth.rememberedEmail || "");
const password = ref("");
const remember = ref(!!auth.rememberedEmail);
const keep = ref(auth.keepSession);
const mostrarPass = ref(false);
const cargando = ref(false);
const error = computed(() => auth.error);
const formRef = ref(null);
const tried = ref(false);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validEmail = computed(() => emailRegex.test(email.value));
const validForm = computed(() => validEmail.value && !!password.value);
const showReset = ref(false);
const emailReset = ref(email.value);
const enviandoReset = ref(false);
const msgReset = ref("");
const errorReset = ref("");
const intentReset = ref(false);
const validResetEmail = computed(() => emailRegex.test(emailReset.value || ""));

const COLLECTION = "Usuarios";

const fetchProfile = async (uid, userEmail) => {
  const byUid = await getDoc(doc(db, COLLECTION, uid));
  if (byUid.exists()) return { id: byUid.id, ...byUid.data() };
  const q = query(collection(db, COLLECTION), where("email", "==", userEmail));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  return { email: userEmail };
};

const routeFor = (profile) => {
  const raw =
    profile?.role ?? profile?.rol ?? profile?.roleName ?? profile?.perfil ?? "";
  const roleStr = Array.isArray(raw) ? raw.join(" ") : String(raw);
  const role = roleStr
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[\/,|]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const fullName = (profile?.fullName || profile?.nombre || "").toLowerCase();
  const mail     = (profile?.email || "").toLowerCase();
  const isTallerCM =
    role.includes("taller cm") ||
    fullName.includes("taller cm") ||
    mail === "tallercm@xtremeservicios.cl";
  if (isTallerCM) return { name: "SolpedTaller" };

  const isGuillermo =
    fullName.includes("guillermo manzor") || mail === "gmanzor@xtrememining.cl";
  if (isGuillermo) return { name: "AprobacionOC" };
  if (role.includes("admin")) return { name: "AdminUsuarios" };
  if (role.includes("aprobador")) return { name: "AprobacionOC" };

  if (role.includes("recepcion") || role.includes("recepcion oc")) {
    return { name: "RecepcionOC" };
  }
  if (role.includes("cargadordoc") || role.includes("cargador doc")) {
    return { name: "AdminGestionDocs" };
  }

  if (role.includes("editor") && !role.includes("aprobador")) return { name: "GeneradorOC" };

  if (role.includes("generador")) return { name: "solped" };
  return { name: "solped" };
};


const traducirError = (code) => {
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/missing-password": "Debes ingresar la contraseña.",
    "auth/invalid-credential": "Credenciales incorrectas.",
    "auth/user-disabled": "El usuario está deshabilitado.",
    "auth/user-not-found": "Usuario no encontrado.",
    "auth/wrong-password": "Contraseña incorrecta.",
  };
  return map[code] || code;
};

const handleSubmit = async () => {
  tried.value = true;
  auth.error = "";

  if (formRef.value && !formRef.value.checkValidity()) {
    formRef.value.classList.add("was-validated");
  }
  if (!validForm.value) return;

  cargando.value = true;
  try {
    auth.setRememberedEmail(email.value, remember.value);
    auth.setKeepSession(keep.value);

    const user = await auth.login(email.value, password.value, keep.value);
    const profile = await fetchProfile(user.uid, user.email);
    const target = routeFor(profile);

    if (target?.name) {
      await router.push({ name: target.name });
    } else if (target?.path) {
      await router.push(target.path);
    } else {
      await router.push({ name: "solped" });
    }
  } catch (e) {
    const code = e?.code || e?.message || "Error al iniciar sesión";
    auth.error = traducirError(code);
  } finally {
    cargando.value = false;
  }
};

const abrirReset = () => {
  msgReset.value = "";
  errorReset.value = "";
  intentReset.value = false;
  emailReset.value = email.value || "";
  showReset.value = true;
};
const cerrarReset = () => (showReset.value = false);

const enviarReset = async () => {
  intentReset.value = true;
  errorReset.value = "";
  msgReset.value = "";
  if (!validResetEmail.value) return;
  enviandoReset.value = true;
  try {
    await auth.resetPassword(emailReset.value);
    msgReset.value = "Te enviamos un correo para restablecer tu contraseña.";
  } catch (e) {
    const code = e?.code || e?.message || "No se pudo enviar el correo.";
    errorReset.value = traducirError(code);
  } finally {
    enviandoReset.value = false;
  }
};
</script>

<style scoped>
.auth-bg {
  min-height: 100vh;
}
.auth-card {
  border-radius: 18px;
  backdrop-filter: blur(7px);
  background: rgba(255,255,255,0.9);
}

.card-ghost {
  border-radius: 18px;
  border-color: rgba(var(--bs-success-rgb), var(--bs-border-opacity)) !important;
  backdrop-filter: blur(6px);
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(2,6,23,0.08);
}
.hero-list { margin: 0; padding-left: 1.2rem; color: #64748b; }
.hero-list li { margin-bottom: .5rem; }
.brand-carousel {
  height: 100px;
  display: grid;
  place-items: center;
}
.brand-slide {
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(2,6,23,0.12));
}
.brand-slide.lg { max-height: 96px; }
.brand-slide.sm { max-height: 60px; }
.logo-ring {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-inline: auto;
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.6)),
    conic-gradient(from 180deg at 50% 50%, #e11d48, #ef4444, #f97316, #e11d48);
  padding: 2px;
}
.brand-logo {
  object-fit: contain;
  background: white;
  border-radius: 50%;
  display: block;
}
.brand-logo.lg { width: 78px; height: 78px; padding: 10px; }
.brand-logo.sm { width: 56px; height: 56px; padding: 8px; }

.form-control, .form-select, .input-group .btn {
  background-color: #fff;
  border-color: #e5e7eb;
  color: #111827;
}
.form-control::placeholder { color: #9ca3af; }
.form-control:focus, .form-select:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 .25rem rgba(99,102,241,.15);
}

.btn-primary {
  background-image: linear-gradient(135deg, #e11d48, #ef4444 40%, #f97316);
  border: none;
}
.btn-primary:hover { filter: brightness(1.06); }

.modal-content { border-radius: 14px; }

.fade-enter-active, .fade-leave-active { transition: opacity .5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
