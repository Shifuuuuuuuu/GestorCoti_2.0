<!-- src/views/Soporte.vue -->
<template>
  <div class="soporte-page container py-4 py-md-5">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h5 fw-semibold mb-0">Soporte</h1>
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
    </div>

    <!-- Alerta de error -->
    <div v-if="error" class="alert alert-danger d-flex justify-content-between align-items-start">
      <div>{{ error }}</div>
      <button class="btn-close" @click="error=''"></button>
    </div>

    <!-- Formulario de ticket -->
    <div class="card card-elevated mb-4">
      <div class="card-header d-flex align-items-center justify-content-between">
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
            <button class="btn btn-primary" :disabled="!canSend || sending" @click="enviarTicket">
              <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
              Enviar ticket
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial del usuario -->
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h2 class="h6 fw-semibold mb-0">Mi historial de soporte</h2>
      <div class="d-flex gap-2">
        <select class="form-select form-select-sm w-auto" v-model="filtroEstado">
          <option value="">Todos</option>
          <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
        </select>
        <input class="form-control form-control-sm w-auto" placeholder="Buscar…" v-model="q" />
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border"></div>
      <div class="small text-secondary mt-2">Cargando tus tickets…</div>
    </div>

    <div v-else>
      <div v-if="listadoFiltrado.length === 0" class="alert">
        No tienes tickets con los filtros actuales.
      </div>

      <div v-for="t in listadoFiltrado" :key="t.id" class="card card-elevated mb-2">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div>
            <div class="fw-semibold">{{ t.asunto || 'Sin asunto' }}</div>
            <div class="small text-secondary">
              #{{ t.numero || '—' }} · {{ formatDateTime(t.created_at) }} · Tipo: {{ t.tipo || '—' }}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="badgeClass(t.estatus)">{{ t.estatus }}</span>
            <button class="btn btn-sm btn-outline-primary" @click="toggleExpand(t)">
              {{ expandId===t.id ? 'Ocultar' : 'Ver' }} detalle
            </button>
          </div>
        </div>

        <div v-if="expandId===t.id" class="card-body">
          <p class="mb-2">{{ t.descripcion }}</p>

          <div v-if="t.imagen_url" class="mb-2">
            <img :src="t.imagen_url" class="thumb" @click="openImg(t.imagen_url)" />
            <button class="btn btn-link btn-sm" @click="openImg(t.imagen_url)">Abrir imagen</button>
          </div>

          <div class="row g-2 small text-secondary mb-3">
            <div class="col">Asignado a: <strong>{{ t.asignado_a_nombre || '—' }}</strong></div>
            <div class="col">Última actualización: <strong>{{ formatDateTime(t.updated_at) || '—' }}</strong></div>
          </div>

          <div>
            <div class="fw-semibold mb-1">Respuestas</div>
            <div v-if="!t.respuestas?.length" class="text-secondary small">Aún no hay respuestas.</div>
            <div v-else class="list-group mb-3">
              <div v-for="(r, idx) in t.respuestas" :key="idx" class="list-group-item">
                <div class="d-flex justify-content-between">
                  <strong>{{ r.usuario || 'Soporte' }}</strong>
                  <small class="text-secondary">{{ formatDateTime(r.fecha) }}</small>
                </div>
                <div class="mt-1">{{ r.texto }}</div>
              </div>
            </div>
          </div>

          <div v-if="t.estatus==='Resuelto'" class="alert alert-success py-2 small">
            📌 Este ticket fue marcado como <strong>Resuelto</strong>.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
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
      return dd.toLocaleString();
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

    const openImg = (url) => window.open(url, "_blank");

    const generarCorrelativo = async () => {
      // Simple correlativo por fecha + tamaño actual (evita colisiones comunes)
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
      listadoFiltrado, formatDateTime, expandId, toggleExpand, openImg, badgeClass
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
}
.badge{ border-radius:999px; font-weight:700; }
</style>
