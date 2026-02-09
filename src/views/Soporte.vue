<!-- src/views/Soporte.vue -->
<template>
  <div class="soporte-page container py-4 py-md-5">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <h1 class="h5 fw-semibold mb-0 order-2 order-md-1">Soporte</h1>
      <button class="btn btn-outline-secondary btn-sm order-1 order-md-2 ms-auto" @click="volver">
        <i class="bi bi-arrow-left"></i> <span class="d-none d-sm-inline">Volver</span>
      </button>
    </div>

    <!-- Alerta de error -->
    <div v-if="error" class="alert alert-danger d-flex justify-content-between align-items-start">
      <div class="me-3">{{ error }}</div>
      <button class="btn-close" @click="error=''"></button>
    </div>

    <!-- Formulario de ticket -->
    <div class="card card-elevated mb-4">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="fw-semibold">Crear ticket</div>
        <span class="small text-secondary">Cuéntanos tu problema</span>
      </div>

      <div class="card-body">
        <div class="row g-3">
          <div class="col-12 col-md-4">
            <label class="form-label">Tipo de problema</label>
            <select class="form-select" v-model="form.tipo">
              <option disabled value="">Selecciona…</option>
              <option>Contraseña</option>
              <option>Correo</option>
              <option>Solped</option>
              <option>Cotización</option>
              <option>Equipo</option>
              <option>Mejoras</option>
              <option>Otro</option>
            </select>
          </div>

          <div class="col-12 col-md-8">
            <label class="form-label">Asunto</label>
            <input class="form-control" v-model="form.asunto" placeholder="Ej: No puedo ingresar al sistema" />
          </div>

          <div class="col-12">
            <label class="form-label">Descripción del caso</label>
            <textarea class="form-control" rows="4" v-model="form.descripcion" placeholder="Describe el problema con el mayor detalle posible…"></textarea>
            <small class="text-secondary">Incluye códigos, pantallazos o pasos para reproducir si es posible.</small>
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Adjuntar imagen (opcional)</label>
            <input type="file" class="form-control" accept="image/*" @change="onPickFile" />
            <div v-if="fileName" class="small text-secondary mt-1">
              Archivo: <strong>{{ fileName }}</strong>
            </div>
          </div>

          <div class="col-12 col-md-6 d-grid d-md-flex align-items-end justify-content-md-end">
            <button class="btn btn-primary w-100 w-md-auto" :disabled="!canSend || sending" @click="enviarTicket">
              <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
              Enviar ticket
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial del usuario -->
    <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
      <h2 class="h6 fw-semibold mb-0">Mi historial de soporte</h2>

      <!-- Controles de filtro/search: stack en móvil -->
      <div class="d-flex flex-column flex-sm-row gap-2 ms-sm-auto w-100 w-sm-auto">
        <select class="form-select form-select-sm w-100 w-sm-auto" v-model="filtroEstado">
          <option value="">Todos</option>
          <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
        </select>
        <input class="form-control form-control-sm w-100 w-sm-auto" placeholder="Buscar…" v-model="q" />
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border"></div>
      <div class="small text-secondary mt-2">Cargando tus tickets…</div>
    </div>

    <div v-else>
      <div v-if="listadoFiltrado.length === 0" class="alert alert-secondary">
        No tienes tickets con los filtros actuales.
      </div>

      <div v-for="t in listadoFiltrado" :key="t.id" class="card card-elevated mb-2">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="minw-0">
            <div class="fw-semibold text-truncate">{{ t.asunto || 'Sin asunto' }}</div>
            <div class="small text-secondary">
              #{{ t.numero || '—' }} · {{ formatDateTime(t.created_at) }} · Tipo: {{ t.tipo || '—' }}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 w-100 w-sm-auto">
            <span class="badge ms-auto ms-sm-0" :class="badgeClass(t.estatus)">{{ t.estatus }}</span>
            <button class="btn btn-sm btn-outline-primary w-100 w-sm-auto" @click="toggleExpand(t)">
              {{ expandId===t.id ? 'Ocultar' : 'Ver' }} detalle
            </button>
          </div>
        </div>

        <div v-if="expandId===t.id" class="card-body">
          <p class="mb-2 break-any">{{ t.descripcion }}</p>

          <div v-if="t.imagen_url" class="mb-3">
            <div class="thumb-wrap" @click="openImg(t.imagen_url)" title="Ver grande">
              <img :src="t.imagen_url" class="thumb img-fluid" :alt="t.asunto || 'imagen ticket'"/>
            </div>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-link btn-sm p-0" @click="openImg(t.imagen_url)">Abrir imagen</button>
              <a class="btn btn-link btn-sm p-0" :href="t.imagen_url" target="_blank" rel="noopener">Descargar</a>
            </div>
          </div>

          <div class="row g-2 small text-secondary mb-3">
            <div class="col-12 col-sm">Asignado a: <strong>{{ t.asignado_a_nombre || '—' }}</strong></div>
            <div class="col-12 col-sm">Última actualización: <strong>{{ formatDateTime(t.updated_at) || '—' }}</strong></div>
          </div>

          <div>
            <div class="fw-semibold mb-1">Respuestas</div>
            <div v-if="!t.respuestas?.length" class="text-secondary small">Aún no hay respuestas.</div>
            <div v-else class="list-group mb-3">
              <div v-for="(r, idx) in t.respuestas" :key="idx" class="list-group-item">
                <div class="d-flex justify-content-between gap-3">
                  <strong class="text-truncate">{{ r.usuario || 'Soporte' }}</strong>
                  <small class="text-secondary text-nowrap">{{ formatDateTime(r.fecha) }}</small>
                </div>
                <div class="mt-1 break-any">{{ r.texto }}</div>
              </div>
            </div>
          </div>

          <div v-if="t.estatus==='Resuelto'" class="alert alert-success py-2 small mb-0">
            📌 Este ticket fue marcado como <strong>Resuelto</strong>.
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Visor fullscreen (imágenes) ===== -->
    <transition name="viewer">
      <div v-if="viewerOpen" class="viewer-wrap" @keydown.esc="closeViewer" tabindex="0">
        <div class="viewer-backdrop" @click="closeViewer"></div>

        <div class="viewer-panel" role="dialog" aria-modal="true" aria-label="Visor de imagen">
          <div class="viewer-header">
            <div class="viewer-title text-truncate">
              {{ viewerName || 'Imagen' }}
            </div>
            <div class="d-flex gap-2">
              <a
                v-if="viewerUrl"
                :href="viewerUrl"
                target="_blank" rel="noopener"
                class="btn btn-sm btn-outline-light"
                title="Abrir en nueva pestaña / Descargar"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
              <div class="btn-group btn-group-sm me-1" role="group" aria-label="Zoom">
                <button class="btn btn-outline-light" @click="zoomOut" :disabled="zoom<=0.5"><i class="bi bi-zoom-out"></i></button>
                <button class="btn btn-outline-light" @click="resetZoom"><i class="bi bi-aspect-ratio"></i></button>
                <button class="btn btn-outline-light" @click="zoomIn" :disabled="zoom>=3"><i class="bi bi-zoom-in"></i></button>
              </div>
              <button class="btn btn-sm btn-light" @click="closeViewer" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="viewer-body">
            <div class="viewer-img-wrap">
              <img
                :src="viewerUrl"
                :alt="viewerName || 'imagen'"
                class="viewer-img"
                :style="{ transform: `scale(${zoom})` }"
                @dblclick="toggleZoom"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- ===== FIN visor ===== -->
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authService";
import { db } from "../stores/firebase";
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, where, orderBy, getDocs
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Soporte",
  setup() {
    const router = useRouter();
    const volver = () => router.back();

    const auth = useAuthStore();
    const my = ref({ uid: "", nombre: "", email: "" });

    const error = ref("");
    const sending = ref(false);
    const file = ref(null);
    const fileName = ref("");
    const loading = ref(true);

    const form = ref({
      tipo: "",
      asunto: "",
      descripcion: ""
    });

    const estados = ["Pendiente", "En revisión", "Resuelto"];
    const filtroEstado = ref("");
    const q = ref("");

    const tickets = ref([]);
    const expandId = ref(null);
    const toggleExpand = (t) => (expandId.value = expandId.value === t.id ? null : t.id);

    const canSend = computed(() =>
      !!form.value.tipo && !!form.value.asunto && !!form.value.descripcion && !sending.value
    );

    const formatDateTime = (d) => {
      if (!d) return "";
      const dd = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
      if (isNaN(dd)) return "";
      return dd.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
    };

    const badgeClass = (st) => ({
      'bg-secondary text-white': st === 'Pendiente',
      'bg-info text-white': st === 'En revisión',
      'bg-success text-white': st === 'Resuelto'
    });

    const onPickFile = (e) => {
      const f = e.target.files?.[0];
      file.value = f || null;
      fileName.value = f ? f.name : "";
    };

    /* ===== Visor fullscreen ===== */
    const viewerOpen = ref(false);
    const viewerUrl = ref("");
    const viewerName = ref("");
    const zoom = ref(1);
    const openImg = (url) => {
      viewerUrl.value = url || "";
      viewerName.value = "Adjunto";
      viewerOpen.value = !!viewerUrl.value;
      zoom.value = 1;
      // foco para cerrar con ESC
      setTimeout(() => { document.querySelector('.viewer-wrap')?.focus(); }, 0);
    };
    const closeViewer = () => { viewerOpen.value = false; viewerUrl.value = ""; zoom.value = 1; };
    const zoomIn = () => { zoom.value = Math.min(3, +(zoom.value + 0.25).toFixed(2)); };
    const zoomOut = () => { zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2)); };
    const resetZoom = () => { zoom.value = 1; };
    const toggleZoom = () => { zoom.value = zoom.value === 1 ? 2 : 1; };

    watch(viewerOpen, (v) => {
      document.documentElement.style.overflow = v ? 'hidden' : '';
    });

    const generarCorrelativo = async () => {
      try {
        const today = new Date();
        const ymd = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
        const qy = query(collection(db, "soportes"), where("fecha_ymd", "==", ymd));
        const snap = await getDocs(qy);
        return `${ymd}-${String((snap?.size || 0) + 1).padStart(4,'0')}`;
      } catch {
        return `TCK-${Date.now()}`;
      }
    };

    const enviarTicket = async () => {
      if (!canSend.value) return;
      sending.value = true;
      error.value = "";
      try {
        const storage = getStorage();
        let imagen_url = "";

        if (file.value) {
          const path = `soporte_imagenes/${auth?.user?.uid || "anon"}/${Date.now()}_${file.value.name}`;
          const sref = storageRef(storage, path);
          await uploadBytes(sref, file.value);
          imagen_url = await getDownloadURL(sref);
        }

        const numero = await generarCorrelativo();
        const payload = {
          numero,
          fecha_ymd: numero.split("-")[0] || null,
          uid: auth?.user?.uid || null,
          nombre_usuario: auth?.user?.displayName || auth?.user?.email || "Usuario",
          email_usuario: auth?.user?.email || null,
          tipo: form.value.tipo,
          asunto: form.value.asunto,
          descripcion: form.value.descripcion,
          imagen_url,
          estatus: "Pendiente",
          asignado_a_uid: null,
          asignado_a_nombre: null,
          respuestas: [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        await addDoc(collection(db, "soportes"), payload);

        // limpiar
        form.value = { tipo: "", asunto: "", descripcion: "" };
        file.value = null;
        fileName.value = "";
      } catch (e) {
        console.error(e);
        error.value = "No se pudo enviar tu ticket. Intenta nuevamente.";
      } finally {
        sending.value = false;
      }
    };

    const listadoFiltrado = computed(() => {
      const txt = q.value.trim().toUpperCase();
      return tickets.value.filter(t => {
        if (filtroEstado.value && t.estatus !== filtroEstado.value) return false;
        if (!txt) return true;
        const hay = [
          t.numero, t.asunto, t.descripcion, t.tipo, t.asignado_a_nombre
        ].join(" | ").toUpperCase();
        return hay.includes(txt);
      });
    });

    onMounted(async () => {
      my.value = {
        uid: auth?.user?.uid || "",
        nombre: auth?.user?.displayName || "",
        email: auth?.user?.email || ""
      };

      // Suscripción en tiempo real a los tickets del usuario
      const qy = query(
        collection(db, "soportes"),
        where("uid", "==", my.value.uid || "__none__"),
        orderBy("created_at", "desc")
      );

      onSnapshot(qy, (snap) => {
        const arr = [];
        snap.forEach(d => {
          arr.push({ id: d.id, ...d.data() });
        });
        tickets.value = arr;
        loading.value = false;
      }, (err) => {
        console.error(err);
        loading.value = false;
        error.value = "No se pudo cargar tu historial.";
      });
    });

    return {
      volver,
      error, sending, form, onPickFile, fileName, canSend, enviarTicket,
      tickets, loading, estados, filtroEstado, q,
      listadoFiltrado, formatDateTime, expandId, toggleExpand, openImg, badgeClass,
      // visor
      viewerOpen, viewerUrl, viewerName, closeViewer, zoomIn, zoomOut, resetZoom, toggleZoom, zoom
    };
  }
};
</script>

<style scoped>
.card-elevated{
  border:1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
}

.thumb{
  width:120px; height:120px; object-fit:cover; border-radius:8px; border:1px solid #e5e7eb;
  cursor: var(--cur-ptr, pointer);
}
.thumb-wrap{ display:inline-block; }
.badge{ border-radius:999px; font-weight:700; }

.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.minw-0{ min-width: 0; }

/* Responsive helpers */
@media (max-width: 576px){
  .w-md-auto{ width: auto; } /* noop en XS */
  .w-100-xs{ width: 100%!important; }
}

/* ===== Visor Fullscreen (modal/lightbox) ===== */
.viewer-enter-active, .viewer-leave-active { transition: opacity .18s ease; }
.viewer-enter-from, .viewer-leave-to { opacity: 0; }

.viewer-wrap{
  position: fixed; inset: 0; z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.viewer-backdrop{
  position: absolute; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(2px);
}
.viewer-panel{
  position: relative; z-index: 1; display: flex; flex-direction: column;
  width: min(96vw, 1200px); height: min(92vh, 900px);
  background: #0b0f14; color: #fff; border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.viewer-header{
  display: flex; align-items: center; justify-content: space-between;
  gap: .75rem; padding: .6rem .75rem .6rem .9rem;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.viewer-title{ font-weight: 600; max-width: 60vw; }
.viewer-body{
  position: relative; flex: 1; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #0b0f14;
}

/* Imagen */
.viewer-img-wrap{
  width: 100%; height: 100%;
  display: grid; place-items: center; overflow: auto;
}
.viewer-img{
  max-width: 100%; max-height: 100%;
  transition: transform .12s ease;
  will-change: transform;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* Móvil: panel fullscreen */
@media (max-width: 576px){
  .viewer-panel{
    width: 100vw; height: 100vh; border-radius: 0;
  }
  .viewer-title{ max-width: 50vw; }
}

/* Cursor utilitario */
:root { --cur-ptr: pointer; }
</style>
