<!-- src/views/SoporteGestion.vue -->
<template>
  <div class="soporte-gestion container py-4 py-md-5">
    <!-- Top -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h5 fw-semibold mb-0">Gestión de Soporte</h1>
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
    </div>

    <!-- Sin permisos -->
    <div v-if="!canManage" class="alert alert-warning d-flex justify-content-between align-items-start">
      <div>
        No tienes permisos para ver esta página.
        <div class="small mt-1 text-secondary">
          (debug) rol leído: <code>{{ myRole || '—' }}</code> · uid: <code>{{ my.uid || '—' }}</code>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" @click="reloadRole">Reintentar rol</button>
    </div>

    <template v-else>
      <!-- Filtros -->
      <div class="card card-elevated mb-3">
        <div class="card-body">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-sm-4 col-md-3">
              <select class="form-select" v-model="filtroEstado">
                <option value="">Todos</option>
                <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>

            <div class="col-12 col-sm-4 col-md-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="chkIncluyeRev" v-model="incluirRevisionSiempre">
                <label class="form-check-label small" for="chkIncluyeRev">
                  Incluir “En revisión”
                </label>
              </div>
            </div>

            <div class="col-12 col-sm-8 col-md-4">
              <input class="form-control" placeholder="Buscar (asunto, usuario, número…)" v-model="q" />
            </div>

            <div class="col-6 col-sm-4 col-md-2 d-grid">
              <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
            </div>

            <div class="col-6 col-sm text-sm-end small text-secondary mt-2 mt-sm-0">
              {{ ticketsFiltrados.length }} ticket(s)
            </div>
          </div>
        </div>
      </div>

      <!-- ====== LISTA SM+ (tabla) ====== -->
      <div class="table-responsive d-none d-sm-block">
        <table class="table table-sm align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Estado</th>
              <th>Asunto</th>
              <th>Tipo</th>
              <th>Usuario</th>
              <th>Asignado</th>
              <th>Creado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in ticketsFiltrados" :key="t.id">
              <td>{{ t.numero || '—' }}</td>
              <td><span class="badge" :class="badgeClass(t.estatus)">{{ t.estatus }}</span></td>
              <td class="w-25 text-truncate" :title="t.asunto">{{ t.asunto }}</td>
              <td>{{ t.tipo }}</td>
              <td>
                <div class="small">{{ t.nombre_usuario }}</div>
                <div class="text-secondary small text-truncate" :title="t.email_usuario">{{ t.email_usuario }}</div>
              </td>
              <td>{{ t.asignado_a_nombre || '—' }}</td>
              <td class="small">{{ formatDateTime(t.created_at) }}</td>
              <td class="text-end">
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="openCanvas(t)">Ver / Responder</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="tomar(t)" :disabled="takingId===t.id">
                    <span v-if="takingId===t.id" class="spinner-border spinner-border-sm me-1"></span>
                    Tomar
                  </button>
                  <button class="btn btn-sm btn-outline-success" @click="marcarResuelto(t)">Resolver</button>
                  <button class="btn btn-sm btn-outline-danger" @click="eliminar(t)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ====== LISTA XS (cards) ====== -->
      <div class="d-sm-none">
        <div v-for="t in ticketsFiltrados" :key="t.id" class="ticket-card">
          <div class="d-flex align-items-start gap-2">
            <span class="badge me-1" :class="badgeClass(t.estatus)">{{ t.estatus }}</span>
            <div class="flex-grow-1">
              <div class="fw-semibold text-truncate" :title="t.asunto">{{ t.asunto }}</div>
              <div class="small text-secondary">
                #{{ t.numero || '—' }} · {{ t.tipo }} · {{ formatDateTime(t.created_at) }}
              </div>
              <div class="small mt-1">
                <i class="bi bi-person me-1"></i>{{ t.nombre_usuario }}
              </div>
              <div class="small text-secondary text-truncate" :title="t.email_usuario">{{ t.email_usuario }}</div>
              <div class="small mt-1">
                <i class="bi bi-briefcase me-1"></i>Asignado: <strong>{{ t.asignado_a_nombre || '—' }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-2 d-grid gap-2">
            <button class="btn btn-sm btn-primary" @click="openCanvas(t)">Ver / Responder</button>
            <button class="btn btn-sm btn-outline-secondary" @click="tomar(t)" :disabled="takingId===t.id">
              <span v-if="takingId===t.id" class="spinner-border spinner-border-sm me-1"></span> Tomar
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-success flex-fill" @click="marcarResuelto(t)">Resolver</button>
              <button class="btn btn-sm btn-outline-danger flex-fill" @click="eliminar(t)">Eliminar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== Offcanvas Detalle ====== -->
      <div class="offcanvas offcanvas-end offcanvas-mobile-full" tabindex="-1" ref="offRef">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title">Ticket #{{ sel?.numero || '—' }}</h5>
          <button type="button" class="btn-close" @click="closeCanvas"></button>
        </div>
        <div class="offcanvas-body">
          <div v-if="!sel" class="text-secondary small">Sin selección.</div>

          <template v-else>
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div class="min-w-0">
                <div class="fw-semibold text-truncate">{{ sel.asunto }}</div>
                <div class="small text-secondary">
                  Tipo: {{ sel.tipo }} · Estado:
                  <span class="badge" :class="badgeClass(sel.estatus)">{{ sel.estatus }}</span>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline-secondary" @click="cambiarEstado(sel,'Pendiente')">Pendiente</button>
                <button class="btn btn-sm btn-outline-info" @click="cambiarEstado(sel,'En revisión')">En revisión</button>
                <button class="btn btn-sm btn-outline-success" @click="cambiarEstado(sel,'Resuelto')">Resuelto</button>
              </div>
            </div>

            <div class="mb-2 small">
              <strong>Usuario:</strong> {{ sel.nombre_usuario }}
              <span class="text-secondary">({{ sel.email_usuario || '—' }})</span>
            </div>

            <div class="mb-3 prewrap">{{ sel.descripcion }}</div>

            <div v-if="sel.imagen_url" class="mb-3">
              <img :src="sel.imagen_url" class="thumb" @click="openImg(sel.imagen_url)" />
              <button class="btn btn-link btn-sm" @click="openImg(sel.imagen_url)">Abrir imagen</button>
            </div>

            <div class="border rounded p-2 mb-3">
              <div class="small text-secondary">Asignado a</div>
              <div class="d-flex flex-wrap align-items-center gap-2">
                <div class="fw-semibold">{{ sel.asignado_a_nombre || '—' }}</div>
                <button class="btn btn-sm btn-outline-primary" @click="tomar(sel)">Tomar</button>
                <button class="btn btn-sm btn-outline-secondary" @click="liberar(sel)" :disabled="!sel.asignado_a_uid">Liberar</button>
              </div>
            </div>

            <div class="mb-3">
              <div class="fw-semibold mb-1">Respuestas</div>
              <div v-if="!sel.respuestas?.length" class="text-secondary small">Aún no hay respuestas.</div>
              <div v-else class="list-group mb-2">
                <div v-for="(r, idx) in sel.respuestas" :key="idx" class="list-group-item">
                  <div class="d-flex justify-content-between gap-2">
                    <strong class="text-truncate">{{ r.usuario }}</strong>
                    <small class="text-secondary">{{ formatDateTime(r.fecha) }}</small>
                  </div>
                  <div class="mt-1 prewrap">{{ r.texto }}</div>
                </div>
              </div>
              <div class="input-group">
                <input class="form-control" v-model="respuesta" placeholder="Escribe una respuesta…" @keyup.enter="enviarRespuesta" />
                <button class="btn btn-primary" :disabled="!respuesta.trim()" @click="enviarRespuesta">Responder</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authService";
import { db } from "../stores/firebase";
import {
  collection, onSnapshot, query, orderBy, updateDoc, doc,
  serverTimestamp, deleteDoc, getDoc
} from "firebase/firestore";

export default {
  name: "SoporteGestion",
  setup() {
    const router = useRouter();
    const volver = () => router.back();

    const auth = useAuthStore();
    const my = ref({
      uid: auth?.user?.uid || "",
      nombre: auth?.user?.displayName || auth?.user?.email || "Soporte"
    });

    // Rol
    const myRole = ref(
      (auth?.user?.role || auth?.user?.rol || "").toString().trim().toLowerCase()
    );
    const allowedRoles = new Set(["admin", "soporte", "aprobador/editor"]);
    const canManage = computed(() => allowedRoles.has((myRole.value || "").toLowerCase()));

    const reloadRole = async () => {
      try {
        const uid = my.value.uid;
        if (!uid) return;
        const usnap = await getDoc(doc(db, "Usuarios", uid));
        if (usnap.exists()) {
          const u = usnap.data() || {};
          const found = (u.role || u.rol || "").toString().trim().toLowerCase();
          if (found) myRole.value = found;
        }
      } catch (e) {
        console.warn("No se pudo cargar el rol desde Firestore:", e);
      }
    };

    const estados = ["Pendiente", "En revisión", "Resuelto"];
    const filtroEstado = ref("");
    const incluirRevisionSiempre = ref(false);
    const q = ref("");

    const tickets = ref([]);
    const takingId = ref(null);

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

    const limpiarFiltros = () => {
      filtroEstado.value = "";
      incluirRevisionSiempre.value = false;
      q.value = "";
    };

    const ticketsFiltrados = computed(() => {
      const txt = q.value.trim().toUpperCase();
      return tickets.value.filter(t => {
        if (filtroEstado.value) {
          const esMismo = t.estatus === filtroEstado.value;
          const esRevision = incluirRevisionSiempre.value && t.estatus === "En revisión";
          if (!esMismo && !esRevision) return false;
        }
        if (!txt) return true;
        const hay = [t.numero, t.asunto, t.descripcion, t.nombre_usuario, t.asignado_a_nombre]
          .join(" | ")
          .toUpperCase();
        return hay.includes(txt);
      });
    });

    // Offcanvas
    const offRef = ref(null);
    const sel = ref(null);
    const respuesta = ref("");
    const openImg = (url) => window.open(url, "_blank");

    const openCanvas = (t) => {
      sel.value = t;
      const offcanvas = window.bootstrap?.Offcanvas ? new window.bootstrap.Offcanvas(offRef.value) : null;
      offcanvas?.show();
    };
    const closeCanvas = () => {
      const inst = window.bootstrap?.Offcanvas?.getInstance(offRef.value);
      inst?.hide();
      sel.value = null;
      respuesta.value = "";
    };

    const tomar = async (t) => {
      if (!canManage.value) return;
      takingId.value = t.id;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          asignado_a_uid: my.value.uid || null,
          asignado_a_nombre: my.value.nombre || "Soporte",
          estatus: "En revisión",
          updated_at: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      } finally {
        takingId.value = null;
      }
    };

    const liberar = async (t) => {
      if (!canManage.value) return;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          asignado_a_uid: null,
          asignado_a_nombre: null,
          estatus: "Pendiente",
          updated_at: serverTimestamp()
        });
      } catch (e) { console.error(e); }
    };

    const cambiarEstado = async (t, nuevo) => {
      if (!canManage.value) return;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          estatus: nuevo,
          updated_at: serverTimestamp()
        });
      } catch (e) { console.error(e); }
    };

    const marcarResuelto = (t) => cambiarEstado(t, "Resuelto");

    const enviarRespuesta = async () => {
      if (!sel.value || !respuesta.value.trim()) return;
      try {
        const current = sel.value.respuestas || [];
        const nueva = {
          uid: my.value.uid || null,
          usuario: my.value.nombre || "Soporte",
          texto: respuesta.value.trim(),
          fecha: new Date()
        };
        const updated = [...current, nueva];
        await updateDoc(doc(db, "soportes", sel.value.id), {
          respuestas: updated,
          updated_at: serverTimestamp()
        });
        respuesta.value = "";
      } catch (e) { console.error(e); }
    };

    const eliminar = async (t) => {
      if (!canManage.value) return;
      if (!confirm(`¿Eliminar ticket #${t.numero}? Esta acción no se puede deshacer.`)) return;
      try { await deleteDoc(doc(db, "soportes", t.id)); }
      catch (e) { console.error(e); }
    };

    onMounted(async () => {
      await reloadRole();
      const qy = query(collection(db, "soportes"), orderBy("created_at", "desc"));
      onSnapshot(qy, (snap) => {
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        tickets.value = arr;
        if (sel.value) {
          const nv = arr.find(x => x.id === sel.value.id);
          if (nv) sel.value = nv;
        }
      }, (err) => console.error(err));
    });

    return {
      volver,
      my, myRole, reloadRole,
      canManage, estados, filtroEstado, incluirRevisionSiempre, q, limpiarFiltros,
      ticketsFiltrados, formatDateTime, badgeClass,
      openCanvas, closeCanvas, offRef, sel, respuesta, enviarRespuesta,
      tomar, liberar, cambiarEstado, marcarResuelto, eliminar, takingId,
      openImg
    };
  }
};
</script>

<style scoped>
/* Tarjeta y sombras */
.card-elevated{
  border:1px solid var(--bs-border-color);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
}

/* Badge */
.badge{ border-radius:999px; font-weight:700; }

/* Miniatura */
.thumb{
  width:160px; height:160px; object-fit:cover;
  border-radius:8px; border:1px solid #e5e7eb; cursor: zoom-in;
}

/* Cards móviles */
.ticket-card{
  border:1px solid var(--bs-border-color);
  border-radius:12px;
  padding: .8rem;
  margin-bottom: .8rem;
  box-shadow: 0 6px 16px rgba(0,0,0,.05);
  background: var(--bs-body-bg);
}

/* Offcanvas full screen en móviles */
.offcanvas-mobile-full{ width: 480px; }
@media (max-width: 576px){
  .offcanvas-mobile-full{ width: 100% !important; }
}

/* Evitar cortes de texto */
.prewrap{ white-space: pre-wrap; word-break: break-word; }

/* Truncamiento elegante */
.min-w-0{ min-width: 0; }
.text-truncate{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
