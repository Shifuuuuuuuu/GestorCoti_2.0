<!-- src/views/OCDetalle-taller.vue -->
<template>
  <div class="container py-4 py-md-5">
    <!-- Header / Back -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>

      <h1 class="h4 fw-semibold mb-0">Detalle de Orden de Compra (Taller)</h1>

      <div class="d-flex align-items-center gap-2">
        <span v-if="docData" class="badge" :class="estadoBadgeClass(docData.estatus)">
          {{ docData.estatus || '—' }}
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2">Cargando orden de compra…</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else-if="docData" class="d-grid gap-3">

      <!-- Resumen principal -->
      <div class="card card-elevated">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            OC N° <span class="text-danger">{{ docData.id ?? '—' }}</span>
          </div>
          <div class="text-secondary small">
            Subida: <strong>{{ fmtFecha(docData.fechaSubida) }}</strong>
            <span v-if="docData.fechaAprobacion">
              · Aprobada: <strong>{{ fmtFecha(docData.fechaAprobacion) }}</strong>
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <div class="small">Empresa</div>
              <div class="fw-semibold">{{ docData.empresa || '—' }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="small">Centro de Costo</div>
              <div class="fw-semibold">{{ docData.centroCostoTexto || '—' }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="small">Aprobador sugerido</div>
              <div class="fw-semibold">{{ docData.aprobadorSugerido || '—' }}</div>
            </div>

            <div class="col-12 col-md-6" v-if="docData.aprobadoPor">
              <div class="small">Aprobado por</div>
              <div class="fw-semibold">{{ docData.aprobadoPor }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="small">Precio total con IVA</div>
              <div class="fw-semibold">{{ fmtMoneda(docData.precioTotalConIVA, docData.moneda) }}</div>
            </div>

            <div class="col-12 col-md-6" v-if="docData.comentario">
              <div class="small">Comentario</div>
              <div class="border rounded p-2 ">{{ docData.comentario }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Re-subir cotización (Editor) -> Rechazado o Pendiente (MÚLTIPLES archivos) -->
      <div v-if="canResubmitEditor" class="card border-2 border-danger-subtle">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold text-danger">Subir nueva cotización</div>
          <span class="small text-secondary">Selecciona múltiples PDF/imagenes. Estado pasa a “Revisión Guillermo”.</span>
        </div>
        <div class="card-body">
          <div v-if="submitError" class="alert alert-danger py-2 mb-3">{{ submitError }}</div>
          <div v-if="submitOk" class="alert alert-success py-2 mb-3">Cotización actualizada correctamente.</div>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Archivos de cotización (PDF/imagen)</label>
              <input
                id="filesNuevaCoti"
                class="form-control"
                type="file"
                multiple
                accept="application/pdf,image/*"
                @change="onFilesNuevaCoti"
              >
              <ul v-if="filesNuevaCoti.length" class="small mt-2 mb-0 list-unstyled">
                <li v-for="(f, i) in filesNuevaCoti" :key="'nc-'+i">
                  • {{ f.name }} <span class="text-muted">({{ (f.size/1024/1024).toFixed(2) }} MB)</span>
                </li>
              </ul>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Nuevo total con IVA</label>
              <input class="form-control" type="number" min="0" step="1"
                     v-model.number="nuevoPrecio" placeholder="Ej: 1250000">
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Nuevo estatus (informativo)</label>
              <select class="form-select" v-model="nuevoEstatus" disabled>
                <option selected>Revisión Guillermo</option>
              </select>
              <div class="form-text">Se forzará “Revisión Guillermo”.</div>
            </div>

            <div class="col-12">
              <label class="form-label">Comentario (motivo de nueva cotización)</label>
              <textarea class="form-control" rows="2" v-model="nuevoComentario"
                        placeholder="Ej: Ajuste por corrección de proveedor…"></textarea>
            </div>
          </div>
        </div>
        <div class="card-footer  d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="resetForm" :disabled="submitting">Limpiar</button>
          <button class="btn btn-danger" @click="subirNuevaCotizacion"
                  :disabled="submitting || !filesNuevaCoti.length">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Subir y actualizar
          </button>
        </div>
      </div>

      <!-- Subir OC aprobada (Editor) -> Enviada a proveedor (MÚLTIPLES archivos) -->
      <div v-if="canUploadOCProveedorEditor" class="card border-2 border-primary-subtle">
        <div class="card-header  d-flex align-items-center justify-content-between">
          <div class="fw-semibold text-primary">Subir Archivos OC (Aprobada)</div>
          <span class="small text-secondary">Cambiará el estado a “Enviada a proveedor”.</span>
        </div>
        <div class="card-body">
          <div v-if="sendError" class="alert alert-danger py-2 mb-3">{{ sendError }}</div>
          <div v-if="sendOk" class="alert alert-success py-2 mb-3">Archivo(s) OC subido(s) y estado actualizado.</div>

          <div class="row g-3">
            <div class="col-12 col-md-8">
              <label class="form-label">Archivos OC (PDF/imagen)</label>
              <input
                id="filesOCProveedor"
                class="form-control"
                type="file"
                multiple
                accept="application/pdf,image/*"
                @change="onFilesOCProveedor"
              >
              <ul v-if="filesOCProveedor.length" class="small mt-2 mb-0 list-unstyled">
                <li v-for="(f, i) in filesOCProveedor" :key="'sel-'+i">
                  • {{ f.name }} <span class="text-muted">({{ (f.size/1024/1024).toFixed(2) }} MB)</span>
                </li>
              </ul>
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Comentario (opcional)</label>
              <input class="form-control" v-model="comentarioEnvio" placeholder="Ej: Enviado por correo al proveedor">
            </div>
          </div>
        </div>
        <div class="card-footer  d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="resetEnvio" :disabled="sending">Limpiar</button>
          <button class="btn btn-primary" @click="subirOCProveedor"
                  :disabled="sending || !filesOCProveedor.length">
            <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
            Subir OC y marcar como enviada
          </button>
        </div>
      </div>

      <!-- Vinculación SOLPED -->
      <div class="card" v-if="docData.tipo_solped || docData.solpedId || docData.numero_solped">
        <div class="card-header  d-flex align-items-center justify-content-between">
          <span class="fw-semibold">Vinculación SOLPED</span>
          <router-link
            v-if="docData.solpedId"
            :to="{ name: 'SolpedTallerDetalle', params: { id: docData.solpedId } }"
            class="btn btn-sm btn-primary">
            Ver SOLPED
          </router-link>
        </div>

        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <div class="small ">Tipo SOLPED</div>
              <div class="fw-semibold">{{ docData.tipo_solped || '—' }}</div>
            </div>
            <div class="col-12 col-md-4" v-if="docData.numero_solped != null">
              <div class="small ">N° SOLPED</div>
              <div class="fw-semibold">{{ docData.numero_solped }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ítems -->
      <div class="card" v-if="(docData.items || []).length">
        <div class="card-header  d-flex align-items-center justify-content-between">
          <span class="fw-semibold">📦 Ítems</span>
          <span class="badge bg-secondary-subtle text-secondary-emphasis">
            {{ docData.items.length }} ítem(s)
          </span>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table align-middle table-sm">
              <thead class="table-light">
                <tr>
                  <th style="width:80px;">Ítem</th>
                  <th>Descripción</th>
                  <th style="width:160px;">Código ref.</th>
                  <th class="text-center" style="width:110px;">Cant.</th>
                  <th class="text-center" style="width:110px;">Cotizado</th>
                  <th style="width:160px;">N° interno</th>
                  <th style="width:140px;">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in docData.items" :key="it.__tempId || i">
                  <td>{{ it.item ?? i + 1 }}</td>
                  <td class="w-40"><div class="fw-semibold">{{ it.descripcion || '—' }}</div></td>
                  <td><span class="text-monospace">{{ it.codigo_referencial || '—' }}</span></td>
                  <td class="text-center">{{ it.cantidad ?? '—' }}</td>
                  <td class="text-center">{{ it.cantidad_cotizada ?? '—' }}</td>
                  <td>{{ it.numero_interno || '—' }}</td>
                  <td>
                    <span class="badge" :class="itemEstadoBadge(it.estado || it.estado_cotizacion)">
                      {{ it.estado || it.estado_cotizacion || '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Archivos como cards clickeables -->
      <div class="card" v-if="adjuntos.length">
        <div class="card-header  fw-semibold">📎 Archivos adjuntos</div>
        <div class="card-body">
          <div class="row g-3">
            <a v-for="(f, idx) in adjuntos" :key="'file-'+idx"
               class="col-12 col-md-6 col-lg-4 text-decoration-none"
               :href="f.url" target="_blank" rel="noopener"
               :title="f.nombre || 'Abrir adjunto'">
              <div class="attach-card h-100">
                <div class="d-flex align-items-center gap-3">
                  <div class="attach-icon"><i :class="iconFor(f.tipo, f.nombre)"></i></div>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold text-truncate">{{ f.nombre || 'Adjunto' }}</div>
                    <div class="small text-secondary text-truncate">
                      {{ f.tipo || extFromName(f.nombre) || 'archivo' }}
                    </div>
                  </div>
                  <i class="bi bi-box-arrow-up-right flex-shrink-0"></i>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Historial -->
      <div class="card" v-if="(docData.historial || []).length">
        <div class="card-header  fw-semibold">🕘 Historial</div>
        <div class="card-body">
          <div class="timeline">
            <div v-for="(h, i) in ordenarHistorial(docData.historial)" :key="'h-'+i" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="badge" :class="estadoBadgeClass(h.estatus)">{{ h.estatus || '—' }}</span>
                  <span class="small text-secondary">{{ fmtFecha(h.fecha) }}</span>
                </div>
                <div class="small mt-1"><strong>Usuario:</strong> {{ h.usuario || '—' }}</div>
                <div class="small mt-1" v-if="h.comentario"><strong>Comentario:</strong> {{ h.comentario }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /grid -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthStore } from '../stores/authService';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error   = ref('');
const docData = ref(null);
const volver = () => router.back();

/* ===== Utilidades ===== */
function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
}
function titleCase(s='') {
  return String(s).replace(/\s+/g,' ').trim().toLowerCase()
    .split(' ')
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
    .join(' ');
}

/* ===== Rol + datos del usuario (Usuarios/{uid}) ===== */
const userRole = ref('');
const isEditor = computed(() => norm(userRole.value) === 'editor');
const userDocData = ref(null);

async function loadUserData() {
  try {
    const uid = auth?.user?.uid;
    if (!uid) return;
    const uref = doc(db, 'Usuarios', uid);
    const usnap = await getDoc(uref);
    if (usnap.exists()) {
      const d = usnap.data() || {};
      userDocData.value = d;
      userRole.value = (d.role || d.rol || '').toString();
    }
  } catch (e) {
    console.warn('No se pudo cargar datos/rol del usuario:', e);
  }
}

/** Devuelve el mejor nombre posible del usuario actual */
function getUsuarioNombre() {
  const fromProfile = (auth?.profile?.fullName || '').trim();
  if (fromProfile) return fromProfile;

  const d = userDocData.value || {};
  const fromDoc = (d.fullName || d.fullname || d.nombreCompleto || '').toString().trim();
  if (fromDoc) return fromDoc;

  const nombres = (d.nombres || d.nombre || d.firstName || '').toString().trim();
  const apellidos = (d.apellidos || d.apellido || d.lastName || '').toString().trim();
  const combined = `${nombres} ${apellidos}`.trim();
  if (combined) return combined;

  const disp = (auth?.user?.displayName || '').trim();
  if (disp) return disp;

  const email = (auth?.user?.email || '').trim();
  if (email && email.includes('@')) {
    const local = email.split('@')[0].replace(/[._-]+/g,' ');
    return titleCase(local);
  }
  return 'Sistema';
}

/* ===== Fetch (colección: ordenes_oc_taller) ===== */
onMounted(async () => {
  try {
    await loadUserData();

    const id = route.params.id;
    if (!id) {
      error.value = 'Falta el ID del documento.';
      loading.value = false;
      return;
    }
    const dref = doc(db, 'ordenes_oc_taller', String(id));
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      error.value = 'No se encontró la orden de compra.';
    } else {
      docData.value = normalizeDoc({ __docId: snap.id, ...snap.data() });
    }
  } catch (e) {
    console.error(e);
    error.value = 'Ocurrió un error al cargar la orden de compra.';
  } finally {
    loading.value = false;
  }
});

/* ===== Normalización simple (fechas y arrays) ===== */
const normalizeDoc = (d) => {
  const n = { ...d };
  n.fechaSubida = coerceDateLike(n.fechaSubida);
  n.fechaAprobacion = coerceDateLike(n.fechaAprobacion);
  if (Array.isArray(n.historial)) {
    n.historial = n.historial.map(h => ({ ...h, fecha: coerceDateLike(h?.fecha) }));
  }
  if (!Array.isArray(n.archivosStorage)) n.archivosStorage = [];
  if (!Array.isArray(n.archivosOCProveedor)) n.archivosOCProveedor = [];
  if (!Array.isArray(n.items)) n.items = [];
  return n;
};

const coerceDateLike = (v) => {
  if (!v) return v;
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d;
  }
  return v;
};

/* ===== Adjuntos unificados (archivoOC + archivosStorage + archivosOCProveedor) ===== */
const adjuntos = computed(() => {
  const out = [];
  const a = docData.value?.archivoOC;
  if (a?.url) {
    out.push({
      nombre: a.nombre || 'Archivo OC',
      tipo: a.tipo || guessMimeFromName(a.nombre),
      url: a.url
    });
  }
  const arr1 = Array.isArray(docData.value?.archivosStorage) ? docData.value.archivosStorage : [];
  for (const x of arr1) {
    if (!x?.url) continue;
    out.push({
      nombre: x.nombre || 'Adjunto',
      tipo: x.tipo || guessMimeFromName(x.nombre),
      url: x.url
    });
  }
  const arr2 = Array.isArray(docData.value?.archivosOCProveedor) ? docData.value.archivosOCProveedor : [];
  for (const x of arr2) {
    if (!x?.url) continue;
    out.push({
      nombre: x.nombre || 'OC Enviada',
      tipo: x.tipo || guessMimeFromName(x.nombre),
      url: x.url
    });
  }
  return out;
});

/* ===== Flags de UI ===== */
// Re-subir: Rechazado o Pendiente
const canResubmitBase = computed(() => {
  const s = norm(docData.value?.estatus);
  return s.includes('rechaz') || s.includes('pendiente');
});

// Subir OC aprobada: EXACTAMENTE "Aprobado"
const canUploadOCProveedorBase = computed(() => norm(docData.value?.estatus) === 'aprobado');

/* ===== Solo permitir acciones a EDITOR ===== */
const canResubmitEditor = computed(() => isEditor.value && canResubmitBase.value);
const canUploadOCProveedorEditor = computed(() => isEditor.value && canUploadOCProveedorBase.value);

/* ===== Re-subir cotización (MÚLTIPLES archivos -> archivosStorage) ===== */
const filesNuevaCoti   = ref([]);
const nuevoPrecio      = ref(null);
const nuevoComentario  = ref('');
const nuevoEstatus     = ref('Revisión Guillermo');

const submitting = ref(false);
const submitOk   = ref(false);
const submitError= ref('');

const onFilesNuevaCoti = (e) => {
  filesNuevaCoti.value = Array.from(e.target.files || []);
  submitOk.value = false;
  submitError.value = '';
};

const resetForm = () => {
  filesNuevaCoti.value = [];
  nuevoPrecio.value = null;
  nuevoComentario.value = '';
  nuevoEstatus.value = 'Revisión Guillermo';
  submitOk.value = false;
  submitError.value = '';
  const el = document.getElementById('filesNuevaCoti');
  if (el) el.value = '';
};

const subirNuevaCotizacion = async () => {
  try {
    submitOk.value = false;
    submitError.value = '';

    if (!isEditor.value) {
      submitError.value = 'No tienes permisos para realizar esta acción.';
      return;
    }

    if (!docData.value?.__docId) {
      submitError.value = 'Documento no cargado.';
      return;
    }
    if (!filesNuevaCoti.value.length) {
      submitError.value = 'Debes seleccionar al menos un archivo de cotización.';
      return;
    }
    const precioNum = Number(nuevoPrecio.value ?? 0);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      submitError.value = 'El precio debe ser un número válido.';
      return;
    }

    submitting.value = true;

    // Subida en paralelo
    const storage = getStorage();
    const uploaded = await Promise.all(
      filesNuevaCoti.value.map(async (f) => {
        const path = `ordenes_oc_taller/${docData.value.__docId}/cotizacion_${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        return {
          nombre: f.name,
          tipo: f.type || 'application/octet-stream',
          url,
          fechaSubida: new Date().toISOString()
        };
      })
    );

    // Historial (una entrada por lote)
    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: 'Revisión Guillermo',
      fecha: new Date().toISOString(),
      usuario,
      comentario: (nuevoComentario.value || '').trim()
    });

    // Acumular archivosStorage
    const prev = Array.isArray(docData.value.archivosStorage) ? docData.value.archivosStorage : [];
    const archivosStorage = [...uploaded, ...prev];

    const dref = doc(db, 'ordenes_oc_taller', docData.value.__docId);
    const updates = {
      archivosStorage,
      precioTotalConIVA: precioNum,
      comentario: (nuevoComentario.value || '').trim(),
      estatus: 'Revisión Guillermo',
      historial: nuevoHist
    };
    await updateDoc(dref, updates);

    docData.value = normalizeDoc({ ...docData.value, ...updates });

    submitOk.value = true;
    resetForm();
  } catch (e) {
    console.error(e);
    submitError.value = 'No se pudo subir la(s) nueva(s) cotización(es). Intenta nuevamente.';
  } finally {
    submitting.value = false;
  }
};

/* ===== Subir OC aprobada (MÚLTIPLES archivos -> archivosOCProveedor + compat archivoOC) ===== */
const filesOCProveedor  = ref([]);
const comentarioEnvio   = ref('');
const sending           = ref(false);
const sendOk            = ref(false);
const sendError         = ref('');

const onFilesOCProveedor = (e) => {
  filesOCProveedor.value = Array.from(e.target.files || []);
  sendOk.value = false;
  sendError.value = '';
};

const resetEnvio = () => {
  filesOCProveedor.value = [];
  comentarioEnvio.value = '';
  sendOk.value = false;
  sendError.value = '';
  const el = document.getElementById('filesOCProveedor');
  if (el) el.value = '';
};

const subirOCProveedor = async () => {
  try {
    sendOk.value = false;
    sendError.value = '';

    if (!isEditor.value) {
      sendError.value = 'No tienes permisos para realizar esta acción.';
      return;
    }

    if (!docData.value?.__docId) {
      sendError.value = 'Documento no cargado.';
      return;
    }
    if (!filesOCProveedor.value.length) {
      sendError.value = 'Debes seleccionar al menos un archivo.';
      return;
    }

    sending.value = true;

    // Subir lote en paralelo
    const storage = getStorage();
    const uploaded = await Promise.all(
      filesOCProveedor.value.map(async (f) => {
        const path = `ordenes_oc_taller/${docData.value.__docId}/oc_enviada_${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        return {
          nombre: f.name,
          tipo: f.type || 'application/octet-stream',
          url,
          fechaSubida: new Date().toISOString()
        };
      })
    );

    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: 'Archivo(s) OC subido(s) (enviado a proveedor)',
      fecha: new Date().toISOString(),
      usuario,
      comentario: (comentarioEnvio.value || '').trim()
    });

    // Compatibilidad: archivoOC = primer archivo del lote
    const archivoOC = uploaded[0] || docData.value.archivoOC || null;

    // Acumular archivosOCProveedor
    const prev = Array.isArray(docData.value.archivosOCProveedor) ? docData.value.archivosOCProveedor : [];
    const archivosOCProveedor = [...uploaded, ...prev];

    const dref = doc(db, 'ordenes_oc_taller', docData.value.__docId);
    const updates = {
      archivoOC,
      archivosOCProveedor,
      historial: nuevoHist,
      estatus: 'Enviada a proveedor'
    };
    await updateDoc(dref, updates);

    docData.value = normalizeDoc({ ...docData.value, ...updates });

    sendOk.value = true;
    resetEnvio();
  } catch (e) {
    console.error(e);
    sendError.value = 'No se pudieron subir los archivos OC. Intenta nuevamente.';
  } finally {
    sending.value = false;
  }
};

/* ===== Utils ===== */
const fmtFecha = (f) => {
  try {
    if (!f) return '—';
    if (typeof f === 'string') return f;
    if (f instanceof Date) {
      return f.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    }
    if (f?.toDate) {
      const d = f.toDate();
      return d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    }
    return '—';
  } catch { return '—'; }
};

const fmtMoneda = (n, c = 'CLP') => {
  const v = Number(n || 0);
  try { return v.toLocaleString('es-CL', { style: 'currency', currency: c || 'CLP', minimumFractionDigits: 0 }); }
  catch { return `${c || 'CLP'} ${v.toLocaleString('es-CL')}`; }
};

const estadoBadgeClass = (estatus) => {
  const s = norm(estatus);
  if (s === 'aprobado') return 'bg-success-subtle text-success-emphasis';
  if (s === 'preaprobado') return 'bg-info-subtle text-info-emphasis';
  if (s.includes('pendiente')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('revision')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('proveedor') || s.includes('enviada')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const itemEstadoBadge = (e) => {
  const s = norm(e);
  if (s.includes('complet')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('parcial')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('revision')) return 'bg-info-subtle text-info-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const ordenarHistorial = (hist) => {
  const arr = Array.isArray(hist) ? [...hist] : [];
  arr.sort((a, b) => toMillis(b?.fecha) - toMillis(a?.fecha));
  return arr;
};

const toMillis = (x) => {
  if (!x) return 0;
  if (x?.toMillis) return x.toMillis();
  if (x?.toDate) return x.toDate().getTime();
  if (x instanceof Date) return x.getTime();
  if (typeof x === 'string') {
    const d = new Date(x);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
};

/* ===== Helpers para adjuntos ===== */
const extFromName = (name='') => {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
};

const guessMimeFromName = (name='') => {
  const ext = extFromName(name);
  if (!ext) return '';
  const map = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', csv: 'text/csv', json: 'application/json', xml: 'application/xml', zip: 'application/zip'
  };
  return map[ext] || '';
};

const iconFor = (mime='', name='') => {
  const m = (mime || guessMimeFromName(name) || '').toLowerCase();
  if (m.includes('pdf')) return 'bi bi-filetype-pdf';
  if (m.includes('image')) return 'bi bi-file-image';
  if (m.includes('sheet') || m.includes('excel') || /\.xl\w$/i.test(name||'')) return 'bi bi-file-earmark-spreadsheet';
  if (m.includes('word') || /\.docx?$/i.test(name||'')) return 'bi bi-filetype-docx';
  if (m.includes('powerpoint') || /\.pptx?$/i.test(name||'')) return 'bi bi-filetype-ppt';
  if (m.includes('json')) return 'bi bi-braces';
  if (m.includes('text') || /\.txt$/i.test(name||'')) return 'bi bi-filetype-txt';
  if (m.includes('zip') || /\.7z$|\.rar$/i.test(name||'')) return 'bi bi-file-zip';
  return 'bi bi-paperclip';
};
</script>

<style scoped>
/* Botones más cuadrados */
.btn { border-radius: 6px; }
.btn.btn-sm { border-radius: 6px; }

.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px  6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

/* Timeline sencillo */
.timeline{ position: relative; padding-left: 1.25rem; }
.timeline::before{
  content:""; position:absolute; left:.44rem; top:0; bottom:0; width:2px; background: #e5e7eb;
}
.timeline-item{ position: relative; margin-bottom:1rem; }
.timeline-dot{
  position:absolute; left:-.03rem; width:.75rem; height:.75rem; border-radius:50%;
  background:#ef4444; border:2px solid #fff; box-shadow:0 0 0 2px #e5e7eb; transform: translateY(.35rem);
}
.timeline-content{ padding-left:.75rem; }

/* Cards de adjuntos */
.attach-card{
  border: 1px solid #e5e7eb; border-radius: 12px;
  padding: .85rem .9rem; transition: transform .08s ease, box-shadow .12s ease, border-color .12s ease;
  box-shadow: 0 6px 16px rgba(2,6,23,.05);
}
.attach-card:hover{
  transform: translateY(-1px); border-color: #cbd5e1; box-shadow: 0 10px 24px rgba(2,6,23,.08);
}
.attach-icon{
  width: 42px; height: 42px; border-radius: 10px;
  display: grid; place-items: center; background: #f8fafc; border: 1px solid #e5e7eb; flex-shrink: 0;
}
.attach-icon i{ font-size: 1.25rem; }
</style>
