<!-- src/views/OCDetalle.vue -->
<template>
  <div class="container py-4 py-md-5">
    <!-- Header / Back -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>

      <h1 class="h4 fw-semibold mb-0">Detalle de Cotización</h1>

      <div class="d-flex align-items-center gap-2">
        <span v-if="docData" class="badge" :class="estadoBadgeClass(docData.estatus)">
          {{ docData.estatus || '—' }}
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2">Cargando cotización…</div>
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
            Cotización N° <span class="text-danger">{{ docData.id ?? '—' }}</span>
          </div>
          <div class="small">
            Creada: <strong>{{ fmtFecha(docData.fechaSubida) }}</strong>
            <span v-if="docData.fechaAprobacion"> · Aprobada: <strong>{{ fmtFecha(docData.fechaAprobacion) }}</strong></span>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <div class="small">Responsable</div>
              <div class="fw-semibold">{{ docData.responsable || '—' }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="small">Empresa</div>
              <div class="fw-semibold">{{ docData.empresa || '—' }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="small">Centro de Costo</div>
              <div class="fw-semibold">
                {{ docData.numero_contrato || docData.centroCosto || '—' }} — {{ docData.nombre_centro_costo || docData.centroCostoNombre || '—' }}
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="small">Tipo de compra</div>
              <div class="fw-semibold">
                {{ docData.tipoCompra || '—' }} <span v-if="docData.destinoCompra">· {{ docData.destinoCompra }}</span>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <div class="small">Moneda</div>
              <div class="fw-semibold">{{ docData.moneda || '—' }}</div>
            </div>
            <div class="col-12 col-md-4">
              <div class="small">Total con IVA</div>
              <div class="fw-semibold">{{ fmtMoneda(docData.precioTotalConIVA, docData.moneda) }}</div>
            </div>
            <div class="col-12 col-md-4">
              <div class="small">Aprobador sugerido</div>
              <div class="fw-semibold">{{ docData.aprobadorSugerido || '—' }}</div>
            </div>

            <div class="col-12" v-if="docData.aprobadoPor">
              <div class="small">Aprobado por</div>
              <div class="fw-semibold">{{ docData.aprobadoPor }}</div>
            </div>

            <div class="col-12" v-if="docData.comentario">
              <div class="small">Comentario</div>
              <div class="border rounded p-2">{{ docData.comentario }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Re-subir cotización (solo Editor) para Rechazado o Pendiente de Aprobación -->
      <div v-if="canResubmitEditor" class="card border-2 border-danger-subtle">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold text-danger">Subir nueva cotización</div>
          <span class="small text-secondary">Actualiza archivosStorage, precio y comentario. Estado pasa a “Revisión Guillermo”.</span>
        </div>
        <div class="card-body">
          <div v-if="submitError" class="alert alert-danger py-2 mb-3">{{ submitError }}</div>
          <div v-if="submitOk" class="alert alert-success py-2 mb-3">Cotización actualizada correctamente.</div>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Archivo de cotización (PDF/imagen)</label>
              <input id="fileNuevaCoti" class="form-control" type="file"
                     accept="application/pdf,image/*" @change="onFileNuevaCoti">
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Nuevo total con IVA</label>
              <input class="form-control" type="number" min="0" step="1"
                     v-model.number="nuevoPrecio" placeholder="Ej: 1250000">
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Nuevo estatus (opcional)</label>
              <select class="form-select" v-model="nuevoEstatus">
                <option>Pendiente de Aprobación</option>
                <option>Rechazado</option>
                <option>Aprobado</option>
              </select>
              <small class="text-secondary">Se ignorará y se usará “Revisión Guillermo”.</small>
            </div>

            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="nuevoComentario"
                        placeholder="Motivo de la nueva cotización…"></textarea>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="resetForm" :disabled="submitting">Limpiar</button>
          <button class="btn btn-danger" @click="subirNuevaCotizacion"
                  :disabled="submitting || !nuevoArchivo">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Subir y actualizar
          </button>
        </div>
      </div>

      <!-- Subir OC ya aprobada (solo Editor) -> cambia a 'Enviada a proveedor' -->
      <div v-if="canUploadOCProveedorEditor" class="card border-2 border-primary-subtle">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold text-primary">Subir Archivo OC (Aprobada)</div>
        </div>
        <div class="card-body">
          <div v-if="sendError" class="alert alert-danger py-2 mb-3">{{ sendError }}</div>
          <div v-if="sendOk" class="alert alert-success py-2 mb-3">Archivo OC subido y estado actualizado.</div>

          <div class="row g-3">
            <div class="col-12 col-md-8">
              <label class="form-label">Archivo OC (PDF/imagen)</label>
              <input id="fileOCProveedor" class="form-control" type="file"
                     accept="application/pdf,image/*" @change="onFileOCProveedor">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Comentario (opcional)</label>
              <input class="form-control" v-model="comentarioEnvio" placeholder="Ej: Enviado por correo al proveedor">
            </div>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="resetEnvio" :disabled="sending">Limpiar</button>
          <button class="btn btn-primary" @click="subirOCProveedor"
                  :disabled="sending || !archivoOCProveedor">
            <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
            Subir OC
          </button>
        </div>
      </div>

      <!-- Vinculación SOLPED -->
      <div class="card" v-if="docData.tipo_solped || docData.solpedId || docData.numero_solped">
        <div class="card-header d-flex align-items-center justify-content-between">
          <span class="fw-semibold">Vinculación SOLPED</span>
          <router-link
            v-if="docData.solpedId"
            class="btn btn-sm btn-outline-primary"
            :to="{ name: 'SolpedDetalle', params: { id: docData.solpedId } }"
          >
            Ver SOLPED
          </router-link>
        </div>

        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <div class="small text-secondary">Tipo SOLPED</div>
              <div class="fw-semibold">
                {{ docData.tipo_solped || 'Sin SOLPED' }}
              </div>
            </div>
            <div class="col-12 col-md-4" v-if="docData.numero_solped != null">
              <div class="small text-secondary">N° SOLPED</div>
              <div class="fw-semibold">{{ docData.numero_solped }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ítems -->
      <div class="card" v-if="(docData.items || []).length">
        <div class="card-header d-flex align-items-center justify-content-between">
          <span class="fw-semibold">📦 Estado de ítems</span>
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
                  <td class="w-40">
                    <div class="fw-semibold">{{ it.descripcion || '—' }}</div>
                  </td>
                  <td><span class="text-monospace">{{ it.codigo_referencial || '—' }}</span></td>
                  <td class="text-center">{{ it.cantidad ?? '—' }}</td>
                  <td class="text-center">{{ it.cantidad_cotizada ?? '—' }}</td>
                  <td>{{ it.numero_interno || '—' }}</td>
                  <td>
                    <span class="badge" :class="itemEstadoBadge(it.estado_cotizacion)">
                      {{ it.estado_cotizacion || '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Archivos -->
      <div class="card" v-if="tieneArchivos">
        <div class="card-header fw-semibold">📎 Archivos adjuntos</div>
        <div class="card-body">
          <div class="list-group">
            <!-- Archivo OC principal -->
            <a
              v-if="docData.archivoOC?.url"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :href="docData.archivoOC.url"
              target="_blank" rel="noopener"
            >
              <i class="bi bi-file-earmark-text me-2"></i>
              <div class="me-auto">
                <div class="fw-semibold">{{ docData.archivoOC?.nombre || 'Archivo OC' }}</div>
                <div class="small text-secondary">{{ docData.archivoOC?.tipo || '—' }}</div>
              </div>
              <i class="bi bi-box-arrow-up-right ms-2"></i>
            </a>

            <!-- archivosStorage -->
            <a
              v-for="(a, idx) in (docData.archivosStorage || [])"
              :key="'att-'+idx"
              class="list-group-item list-group-item-action d-flex align-items-center"
              :href="a.url"
              target="_blank" rel="noopener"
            >
              <i class="bi bi-paperclip me-2"></i>
              <div class="me-auto">
                <div class="fw-semibold">{{ a.nombre || 'Adjunto' }}</div>
                <div class="small text-secondary">{{ a.tipo || '—' }}</div>
              </div>
              <i class="bi bi-box-arrow-up-right ms-2"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Historial -->
      <div class="card" v-if="(docData.historial || []).length">
        <div class="card-header fw-semibold">🕘 Historial</div>
        <div class="card-body">
          <div class="timeline">
            <div v-for="(h, i) in ordenarHistorial(docData.historial)" :key="'h-'+i" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" :class="estadoBadgeClass(h.estatus)">{{ h.estatus || '—' }}</span>
                  <span class="small text-secondary">{{ fmtFecha(h.fecha) }}</span>
                </div>
                <div class="small mt-1">
                  <strong>Usuario:</strong> {{ h.usuario || '—' }}
                </div>
                <div class="small mt-1" v-if="h.comentario">
                  <strong>Comentario:</strong> {{ h.comentario }}
                </div>
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

/* ===== Utils ===== */
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

/* ====== Rol + datos del usuario (desde colección Usuarios) ====== */
const userRole = ref(''); // e.g. 'Editor', 'Admin', 'Aprobador/Editor'
const isEditor = computed(() => norm(userRole.value) === 'editor');
const userDocData = ref(null); // para extraer fullName/nombres/apellidos desde BD

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
    console.warn('No se pudo cargar datos de usuario:', e);
  }
}

/** Resuelve el mejor nombre posible del usuario actual */
function getUsuarioNombre() {
  // 1) profile.fullName del store
  const fromProfile = (auth?.profile?.fullName || '').trim();
  if (fromProfile) return fromProfile;

  // 2) Documento en 'Usuarios' (varios campos posibles)
  const d = userDocData.value || {};
  const fromDoc =
    (d.fullName || d.fullname || d.nombreCompleto || '').toString().trim();
  if (fromDoc) return fromDoc;

  const nombres = (d.nombres || d.nombre || d.firstName || '').toString().trim();
  const apellidos = (d.apellidos || d.apellido || d.lastName || '').toString().trim();
  const combined = `${nombres} ${apellidos}`.trim();
  if (combined) return combined;

  // 3) displayName de Firebase Auth
  const disp = (auth?.user?.displayName || '').trim();
  if (disp) return disp;

  // 4) local-part del email (capitalizado bonito)
  const email = (auth?.user?.email || '').trim();
  if (email && email.includes('@')) {
    const local = email.split('@')[0].replace(/[._-]+/g,' ');
    return titleCase(local);
  }

  // 5) fallback
  return 'Sistema';
}

// ===== Fetch (colección: ordenes_oc) =====
onMounted(async () => {
  try {
    await loadUserData();

    const id = route.params.id;
    if (!id) {
      error.value = 'Falta el ID del documento.';
      loading.value = false;
      return;
    }
    const dref = doc(db, 'ordenes_oc', String(id));
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      error.value = 'No se encontró la cotización.';
    } else {
      const data = { __docId: snap.id, ...snap.data() };
      if (!Array.isArray(data.archivosStorage)) data.archivosStorage = [];
      if (!Array.isArray(data.items)) data.items = [];
      docData.value = data;
    }
  } catch (e) {
    console.error(e);
    error.value = 'Ocurrió un error al cargar la cotización.';
  } finally {
    loading.value = false;
  }
});

// ===== Flags de UI =====
const canResubmitBase = computed(() => {
  const s = norm(docData.value?.estatus);
  return s.includes('rechaz') || s.includes('pendiente'); // Rechazado o Pendiente de Aprobación
});

// Sólo si es exactamente “Aprobado”
const canUploadOCProveedorBase = computed(() => {
  const s = norm(docData.value?.estatus);
  return s === 'aprobado';
});

const canResubmitEditor = computed(() => isEditor.value && canResubmitBase.value);
const canUploadOCProveedorEditor = computed(() => isEditor.value && canUploadOCProveedorBase.value);

// ===== Re-subir cotización =====
const nuevoArchivo = ref(null);
const nuevoPrecio = ref(null);
const nuevoComentario = ref('');
const nuevoEstatus = ref('Pendiente de Aprobación'); // se ignora, queda 'Revisión Guillermo'

const submitting = ref(false);
const submitOk = ref(false);
const submitError = ref('');

const onFileNuevaCoti = (e) => {
  const f = (e.target.files || [])[0];
  nuevoArchivo.value = f || null;
  submitOk.value = false;
  submitError.value = '';
};
const resetForm = () => {
  nuevoArchivo.value = null;
  nuevoPrecio.value = null;
  nuevoComentario.value = '';
  nuevoEstatus.value = 'Pendiente de Aprobación';
  submitOk.value = false;
  submitError.value = '';
  const el = document.getElementById('fileNuevaCoti');
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
    if (!nuevoArchivo.value) {
      submitError.value = 'Debes seleccionar un archivo de cotización.';
      return;
    }
    const precioNum = Number(nuevoPrecio.value);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      submitError.value = 'El precio debe ser un número válido.';
      return;
    }

    submitting.value = true;

    // 1) Subir archivo a Storage
    const storage = getStorage();
    const path = `ordenes_oc/${docData.value.__docId}/cotizacion_${Date.now()}_${nuevoArchivo.value.name}`;
    const sRef = sref(storage, path);
    const up = await uploadBytes(sRef, nuevoArchivo.value);
    const url = await getDownloadURL(up.ref);

    const nuevoAdj = {
      nombre: nuevoArchivo.value.name,
      tipo: nuevoArchivo.value.type || 'application/octet-stream',
      url,
      fechaSubida: new Date().toISOString()
    };

    // Historial: “Revisión Guillermo”
    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: 'Revisión Guillermo',
      fecha: new Date().toISOString(),
      usuario,
      comentario: (nuevoComentario.value || '').trim()
    });

    // Actualización
    const archivosStorage = Array.isArray(docData.value.archivosStorage)
      ? [nuevoAdj, ...docData.value.archivosStorage] : [nuevoAdj];

    const dref = doc(db, 'ordenes_oc', docData.value.__docId);
    const updates = {
      archivosStorage,
      precioTotalConIVA: precioNum,
      comentario: (nuevoComentario.value || '').trim(),
      estatus: 'Revisión Guillermo',
      historial: nuevoHist
    };
    await updateDoc(dref, updates);

    docData.value = { ...docData.value, ...updates };

    submitOk.value = true;
    resetForm();
  } catch (e) {
    console.error(e);
    submitError.value = 'No se pudo subir la nueva cotización. Intenta nuevamente.';
  } finally {
    submitting.value = false;
  }
};

// ===== Subir OC aprobada =====
const archivoOCProveedor = ref(null);
const comentarioEnvio = ref('');
const sending = ref(false);
const sendOk = ref(false);
const sendError = ref('');

const onFileOCProveedor = (e) => {
  const f = (e.target.files || [])[0];
  archivoOCProveedor.value = f || null;
  sendOk.value = false;
  sendError.value = '';
};
const resetEnvio = () => {
  archivoOCProveedor.value = null;
  comentarioEnvio.value = '';
  sendOk.value = false;
  sendError.value = '';
  const el = document.getElementById('fileOCProveedor');
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
    if (!archivoOCProveedor.value) {
      sendError.value = 'Debes seleccionar el archivo OC.';
      return;
    }

    sending.value = true;

    // 1) Subir archivo a Storage
    const storage = getStorage();
    const path = `ordenes_oc/${docData.value.__docId}/oc_enviada_${Date.now()}_${archivoOCProveedor.value.name}`;
    const sRef = sref(storage, path);
    const up = await uploadBytes(sRef, archivoOCProveedor.value);
    const url = await getDownloadURL(up.ref);

    const archivoOC = {
      nombre: archivoOCProveedor.value.name,
      tipo: archivoOCProveedor.value.type || 'application/octet-stream',
      url,
      fechaSubida: new Date().toISOString()
    };

    // Historial
    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: 'Archivo OC subido (enviado a proveedor)',
      fecha: new Date().toISOString(),
      usuario,
      comentario: (comentarioEnvio.value || '').trim()
    });

    // Actualización
    const dref = doc(db, 'ordenes_oc', docData.value.__docId);
    const updates = {
      archivoOC,
      historial: nuevoHist,
      estatus: 'Enviada a proveedor'
    };
    await updateDoc(dref, updates);

    docData.value = { ...docData.value, ...updates };

    sendOk.value = true;
    resetEnvio();
  } catch (e) {
    console.error(e);
    sendError.value = 'No se pudo subir el archivo OC. Intenta nuevamente.';
  } finally {
    sending.value = false;
  }
};

// ===== Utils de presentación =====
const fmtFecha = (f) => {
  try {
    let d = null;
    if (f?.toDate) d = f.toDate();
    else if (typeof f === 'string') d = new Date(f);
    else if (f instanceof Date) d = f;
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return '—'; }
};

const fmtMoneda = (n, c = 'CLP') => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString('es-CL', { style: 'currency', currency: c, minimumFractionDigits: 0 });
  } catch {
    return `${c} ${v.toLocaleString('es-CL')}`;
  }
};

const estadoBadgeClass = (estatus) => {
  const s = norm(estatus);

  if (s === 'aprobado') return 'bg-success-subtle text-success-emphasis';
  if (s === 'preaprobado') return 'bg-info-subtle text-info-emphasis';
  if (s === 'pendiente de aprobacion' || s === 'pendiente') return 'bg-warning-subtle text-warning-emphasis';
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
  arr.sort((a, b) => dateLikeToMillis(b?.fecha) - dateLikeToMillis(a?.fecha));
  return arr;
};

const dateLikeToMillis = (x) => {
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

const tieneArchivos = computed(() => {
  const a = (docData.value?.archivosStorage || []).length > 0;
  const b = !!docData.value?.archivoOC?.url;
  return a || b;
});
</script>

<style scoped>
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

/* Timeline sencillo */
.timeline{
  position: relative;
  padding-left: 1.25rem;
}
.timeline::before{
  content:"";
  position:absolute;
  left:.44rem;
  top:0;
  bottom:0;
  width:2px;
  background: #e5e7eb;
}
.timeline-item{
  position: relative;
  margin-bottom:1rem;
}
.timeline-dot{
  position:absolute;
  left:-.03rem;
  width:.75rem;
  height:.75rem;
  border-radius:50%;
  background:#ef4444;
  border:2px solid #fff;
  box-shadow:0 0 0 2px #e5e7eb;
  transform: translateY(.35rem);
}
.timeline-content{
  padding-left:.75rem;
}
</style>
