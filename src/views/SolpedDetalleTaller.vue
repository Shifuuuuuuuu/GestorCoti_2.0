<!-- src/views/SolpedDetalle-taller.vue -->
<template>
  <div class="solped-detalle-page">
    <div class="container py-4 py-md-5">
      <!-- Header -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <button class="btn btn-outline-secondary btn-sm" @click="volver">
            <i class="bi bi-arrow-left"></i> Volver
          </button>

          <h1 class="h4 fw-semibold mb-0">
            SOLPED Taller <span v-if="numeroSolpe">#{{ numeroSolpe }}</span>
          </h1>

        </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Cargando SOLPED…</div>
      </div>
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-else>
        <!-- Card resumen -->
        <div class="card card-elevated mb-3">
          <div class="card-header e d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-semibold">Resumen</span>
              <span class="badge" :class="estadoBadgeClass(docData.estatus)">
                {{ docData.estatus || '—' }}
              </span>
            </div>
            <div class="small ">
              <template v-if="docData.creado_en">
                Creado: <strong>{{ fmtFecha(docData.creado_en) }}</strong>
              </template>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <div class="small ">Empresa</div>
                <div class="fw-semibold">{{ docData.empresa || '—' }}</div>
              </div>
              <div class="col-12 col-md-6">
                <div class="small ">Fecha</div>
                <div class="fw-semibold">{{ docData.fecha || '—' }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small ">Solicitante</div>
                <div class="fw-semibold">{{ docData.nombre_solicitante || docData.usuario || '—' }}</div>
              </div>
              <div class="col-12 col-md-6">
                <div class="small">Tipo SOLPED</div>
                <div class="fw-semibold">{{ docData.tipo_solped || '—' }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small ">N° SOLPED</div>
                <div class="fw-semibold">{{ numeroSolpe || '—' }}</div>
              </div>
              <div class="col-12 col-md-6">
                <div class="small ">Centro de Costo</div>
                <div class="fw-semibold">{{ docData.centro_costo || '—' }}</div>
              </div>
              <div class="col-12 col-md-6" v-if="docData.total_estimado != null">
                <div class="small ">Total estimado</div>
                <div class="fw-semibold">{{ fmtMoneda(docData.total_estimado, docData.moneda || 'CLP') }}</div>
              </div>

              <div class="col-12" v-if="docData.descripcion_general">
                <div class="small ">Descripción general</div>
                <div class="border rounded p-2 ">{{ docData.descripcion_general }}</div>
              </div>
            </div>

            <!-- Autorización adjunta (opcional) -->
            <div v-if="docData.autorizacion_url" class="alert alert-light d-flex align-items-center mt-3">
              <i class="bi bi-paperclip me-2"></i>
              <div class="me-auto">
                <div class="fw-semibold mb-0">Autorización adjunta</div>
                <div class="small">{{ docData.autorizacion_nombre || 'Archivo' }}</div>
              </div>
              <div class="d-flex gap-2">
                <a :href="docData.autorizacion_url" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Ver</a>
                <a :href="docData.autorizacion_url" :download="docData.autorizacion_nombre || 'autorizacion'" class="btn btn-sm btn-outline-secondary">Descargar</a>
              </div>
            </div>
          </div>
        </div>

        <!-- OCs vinculadas (ordenes_oc_taller) -->
        <div class="card card-elevated mb-3">
          <div class="card-header  d-flex align-items-center justify-content-between">
            <span class="fw-semibold">🧾 Órdenes de Compra vinculadas</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ ocs.length }}</span>
          </div>
          <div class="card-body p-0">
            <div v-if="cargandoOCs" class="p-3 text-center">
              <div class="spinner-border" role="status"></div>
              <div class="mt-2">Buscando OCs…</div>
            </div>

            <div v-else-if="!ocs.length" class="p-3 text-secondary text-center">
              No hay órdenes de compra vinculadas a esta SOLPED.
            </div>

            <div v-else class="list-group list-group-flush">
              <div
                v-for="oc in ocs"
                :key="oc.__docId"
                class="list-group-item d-flex align-items-center"
              >
                <div class="me-auto">
                  <div class="d-flex align-items-center gap-2">
                    <strong>OC N° {{ oc.id ?? '—' }}</strong>
                    <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || '—' }}</span>
                  </div>
                  <div class="small text-secondary mt-1">
                    <strong>Subida:</strong> {{ fmtFecha(oc.fechaSubida) }}
                    <template v-if="oc.empresa"> · <strong>Empresa:</strong> {{ oc.empresa }}</template>
                    <template v-if="oc.centroCostoTexto"> · <strong>CC:</strong> {{ oc.centroCostoTexto }}</template>
                  </div>
                </div>

                <div class="ms-2 d-flex gap-2">
                  <router-link
                    :to="{ name: 'OrdenOCTallerDetalle', params: { id: oc.__docId } }"
                    class="btn btn-outline-primary btn-sm"
                    title="Ver detalle de OC"
                  >
                    Ver detalle
                  </router-link>
                  <a
                    v-if="oc.archivoOC?.url"
                    class="btn btn-sm btn-outline-secondary"
                    :href="oc.archivoOC.url"
                    target="_blank" rel="noopener"
                    title="Abrir archivo OC"
                  >
                    <i class="bi bi-box-arrow-up-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ítems -->
        <div class="card card-elevated mb-3">
          <div class="card-header ">
            <span class="fw-semibold">📦 Ítems solicitados</span>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width:64px;">Ítem</th>
                    <th>Descripción</th>
                    <th style="width:150px;">Código ref.</th>
                    <th style="width:150px;">N° interno</th>
                    <th class="text-center" style="width:100px;">Cant.</th>
                    <th class="text-center" style="width:120px;">Cotizada</th>
                    <th style="width:140px;">Estado</th>
                    <th style="width:120px;">Imagen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="it in itemsOrdenados" :key="`${it.item}-${it.descripcion}`">
                    <td class="text-secondary">{{ it.item ?? '—' }}</td>
                    <td class="fw-semibold">
                      {{ it.descripcion || '—' }}
                    </td>
                    <td>{{ it.codigo_referencial || '—' }}</td>
                    <td>{{ it.numero_interno || '—' }}</td>
                    <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                    <td class="text-center">{{ it.cantidad_cotizada ?? 0 }}</td>
                    <td>
                      <span class="badge" :class="itemEstadoBadge(it.estado)">{{ it.estado || '—' }}</span>
                    </td>
                    <td>
                      <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank" rel="noopener" class="thumbnail-link">
                        <img :src="it.imagen_url" alt="img" class="thumb-img">
                      </a>
                      <span v-else class="text-secondary">SIN IMAGEN</span>
                    </td>
                  </tr>
                  <tr v-if="!itemsOrdenados.length">
                    <td colspan="8" class="text-center text-secondary py-3">Sin ítems.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Historial de estados -->
        <div class="card card-elevated">
          <div class="card-header">
            <span class="fw-semibold">🕒 Historial de estados</span>
          </div>
          <div class="card-body">
            <div v-if="cargandoHistorial" class="text-center py-3">
              <div class="spinner-border" role="status"></div>
              <div class="mt-2">Cargando historial…</div>
            </div>

            <div v-else-if="!historial.length" class="text-secondary text-center">
              Sin movimientos.
            </div>

            <ul v-else class="timeline list-unstyled">
              <li v-for="(h, idx) in historialOrdenado" :key="idx" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge" :class="estadoBadgeClass(h.estatus)">{{ h.estatus || '—' }}</span>
                    <span class="small ">{{ fmtFecha(h.fecha) }}</span>
                  </div>
                  <div class="small mt-1" v-if="h.usuario"><strong>Usuario:</strong> {{ h.usuario }}</div>
                  <div class="small " v-if="h.detalle">{{ h.detalle }}</div><div class="small text-secondary" v-if="h.ocNumero">Cotización :{{ h.ocNumero }} </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error   = ref('');
const docData = ref(null);

const historial = ref([]);
const cargandoHistorial = ref(true);

// OCs vinculadas (ordenes_oc_taller)
const ocs = ref([]);
const cargandoOCs = ref(true);

const volver = () => router.back();

const numeroSolpe = computed(() => {
  // en taller suele ser numero_solpe (numérico)
  return docData.value?.numero_solpe ?? docData.value?.numero_solped ?? '';
});

// ===== Fetch principal =====
onMounted(async () => {
  try {
    const id = route.params.id;
    if (!id) {
      error.value = 'Falta el ID del documento.';
      loading.value = false;
      return;
    }

    // Colección de taller
    const dref = doc(db, 'solped_taller', String(id));
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      error.value = 'No se encontró la SOLPED de taller.';
    } else {
      docData.value = normalizeDoc({ __docId: snap.id, ...snap.data() });

      // historialEstados (subcolección en el doc de taller)
      await cargarHistorial(dref);

      // OCs vinculadas desde ordenes_oc_taller
      await cargarOCsVinculadas();
    }
  } catch (e) {
    console.error(e);
    error.value = 'Ocurrió un error al cargar la SOLPED.';
  } finally {
    loading.value = false;
  }
});

// ===== Normalización simple =====
const normalizeDoc = (d) => {
  const n = { ...d };
  n.creado_en = coerceDateLike(n.creado_en);
  return n;
};
const coerceDateLike = (v) => {
  if (!v) return v;
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d) ? v : d;
  }
  return v;
};

// ===== Historial =====
const cargarHistorial = async (dref) => {
  cargandoHistorial.value = true;
  try {
    let docs = [];
    try {
      const qy = query(collection(dref, 'historialEstados'), orderBy('fecha', 'desc'));
      const snap = await getDocs(qy);
      docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(e)
      const snap = await getDocs(collection(dref, 'historialEstados'));
      docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => dateLikeToMillis(b?.fecha) - dateLikeToMillis(a?.fecha));
    }
    historial.value = docs;
  } catch (e) {
    console.error('Error historialEstados:', e);
    historial.value = [];
  } finally {
    cargandoHistorial.value = false;
  }
};

// ===== OCs vinculadas (ordenes_oc_taller) =====
const cargarOCsVinculadas = async () => {
  cargandoOCs.value = true;
  try {
    const lista = [];

    const solpedDocId = route.params.id;
    // 1) Buscar por solpedId == id del doc
    let snap1;
    try {
      const q1 = query(
        collection(db, 'ordenes_oc_taller'),
        where('solpedId', '==', String(solpedDocId)),
        orderBy('fechaSubida', 'desc')
      );
      snap1 = await getDocs(q1);
    } catch (e) {
      console.error(e)
      const q1 = query(collection(db, 'ordenes_oc_taller'), where('solpedId', '==', String(solpedDocId)));
      snap1 = await getDocs(q1);
    }
    snap1.forEach(d => lista.push(cleanOC({ __docId: d.id, ...d.data() })));

    // 2) Si no hay, intentar por numero_solped (numérico)
    if (lista.length === 0 && numeroSolpe.value) {
      const n = Number(numeroSolpe.value);
      if (!Number.isNaN(n)) {
        let snap2;
        try {
          const q2 = query(
            collection(db, 'ordenes_oc_taller'),
            where('numero_solped', '==', n),
            orderBy('fechaSubida', 'desc')
          );
          snap2 = await getDocs(q2);
        } catch (e) {
          console.error(e)
          const q2 = query(collection(db, 'ordenes_oc_taller'), where('numero_solped', '==', n));
          snap2 = await getDocs(q2);
        }
        snap2.forEach(d => lista.push(cleanOC({ __docId: d.id, ...d.data() })));
      }
    }

    // Ordenar por fechaSubida desc en cliente por seguridad
    lista.sort((a, b) => dateLikeToMillis(b?.fechaSubida) - dateLikeToMillis(a?.fechaSubida));
    ocs.value = lista;
  } catch (e) {
    console.error('Error cargando OCs vinculadas:', e);
    ocs.value = [];
  } finally {
    cargandoOCs.value = false;
  }
};

const cleanOC = (x) => {
  const n = { ...x };
  n.fechaSubida = coerceDateLike(n.fechaSubida);
  return n;
};

// ===== Derivados / helpers =====
const itemsOrdenados = computed(() => {
  const arr = Array.isArray(docData.value?.items) ? [...docData.value.items] : [];
  arr.sort((a, b) => (a.item ?? 0) - (b.item ?? 0));
  return arr;
});

const historialOrdenado = computed(() => {
  const arr = Array.isArray(historial.value) ? [...historial.value] : [];
  arr.sort((a, b) => dateLikeToMillis(b?.fecha) - dateLikeToMillis(a?.fecha));
  return arr;
});

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

const estadoBadgeClass = (estatus) => {
  const s = (estatus || '').toLowerCase();
  if (s.includes('complet')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('preaprob')) return 'bg-info-subtle text-info-emphasis';
  if (s.includes('rechaz') || s.includes('escala')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('revisión') || s.includes('revision')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('solicit') || s.includes('oc enviada')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const itemEstadoBadge = (e) => {
  const s = (e || '').toLowerCase();
  if (s.includes('complet')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('parcial')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('pend')) return 'bg-secondary-subtle text-secondary-emphasis';
  if (s.includes('revision') || s.includes('revisión')) return 'bg-info-subtle text-info-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};
</script>

<style scoped>
.solped-detalle-page{
  min-height:100vh;
}

/* Card estética */
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

/* thumbs */
.thumb-img{
  width: 84px;
  height: 56px;
  object-fit: cover;
  border-radius: .5rem;
  border: 1px solid #e5e7eb;
}
.thumbnail-link:hover .thumb-img{
  transform: scale(1.02);
  transition: transform .15s ease;
}

/* Timeline simple */
.timeline{
  position: relative;
  margin: 0;
  padding: .25rem 0 .25rem .5rem;
}
.timeline::before{
  content:'';
  position:absolute;
  left:8px;
  top:0;
  bottom:0;
  width:2px;
  background:#e5e7eb;
}
.timeline-item{
  position:relative;
  padding-left:24px;
  margin-bottom:12px;
}
.timeline-dot{
  position:absolute;
  left:2px;
  top:.4rem;
  width:12px;
  height:12px;
  border-radius:50%;
  background:#ef4444; /* rojo corporativo */
  border:2px solid #fff;
  box-shadow:0 0 0 2px #e5e7eb;
}
.timeline-content{
  border:1px solid #e5e7eb;
  border-radius:.5rem;
  padding:.5rem .75rem;
}
</style>
