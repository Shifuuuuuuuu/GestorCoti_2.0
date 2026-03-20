<!-- src/views/AprobacionCotizacionesPlantas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm order-1" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0 order-2 flex-grow-1 text-center text-md-start">
          Aprobación de Cotizaciones · Plantas
        </h1>

        <div class="d-none d-md-flex align-items-center gap-2 ms-auto order-3">
          <div class="input-group input-group-sm" style="width:260px;">
            <span class="input-group-text"><i class="bi bi-buildings"></i></span>
            <select v-model="empresaFiltro" class="form-select">
              <option value="TODAS">Todas las empresas</option>
              <option v-for="e in empresasDisponibles" :key="e" :value="e">
                {{ e }}
              </option>
            </select>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>

        <div class="d-flex d-md-none align-items-center gap-2 ms-auto order-3">
          <button
            class="btn btn-outline-primary btn-sm"
            @click="toggleFiltersResponsive"
            :aria-expanded="showFiltersMobile"
            aria-controls="offFiltrosCustom"
          >
            <i class="bi bi-sliders"></i> Filtros
          </button>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>
      </div>

      <div v-if="!puedeVerBandeja && !cargando" class="alert alert-warning">
        Esta bandeja está disponible sólo para el aprobador configurado o usuarios Admin.
      </div>

      <div class="card" v-if="puedeVerBandeja">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="minw-0">
            <div class="fw-semibold">Cotizaciones encontradas</div>
            <div class="small text-secondary text-truncate">
              Estado: <strong>Pendiente de Aprobación</strong> ·
              Empresa: <strong>{{ etiquetaEmpresaFiltro }}</strong>
            </div>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ cotizacionesFiltradas.length }}</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargando" class="p-4 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="cotizacionesFiltradas.length === 0" class="p-4 text-secondary text-center">
            No hay cotizaciones de plantas pendientes de aprobación con los filtros actuales.
          </div>

          <div v-else class="list-group list-group-flush">
            <div
              v-for="cot in cotizacionesFiltradas"
              :key="cot.__docId"
              class="list-group-item"
            >
              <div class="row g-3 align-items-start">
                <div class="col-12 col-lg-9">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold">Cotización N° {{ cot.id ?? '—' }}</span>
                    <span class="badge" :class="estadoBadgeClass(cot.estatus)">
                      {{ cot.estatus || '—' }}
                    </span>
                  </div>

                  <div class="oc-highlight mt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="oc-pill" title="Centro de costo">
                        <i class="bi bi-building me-1"></i>
                        <strong>Centro:</strong>
                        <span class="text-truncate d-inline-block maxw-180">
                          {{ cot.nombre_centro_costo || '—' }}
                        </span>
                        <template> ({{ cot.numero_contrato || '—' }})</template>
                      </span>

                      <span class="oc-pill" title="SOLPED asociada">
                        <i class="bi bi-file-earmark-text me-1"></i>
                        <strong>SOLPED:</strong> {{ cot.numero_solpe || '—' }}
                      </span>

                      <span class="oc-pill" title="Empresa">
                        <i class="bi bi-diagram-3 me-1"></i>
                        <strong>Empresa:</strong>
                        <span class="text-truncate d-inline-block maxw-140">
                          {{ cot.empresa || '—' }}
                        </span>
                      </span>

                      <span class="oc-pill" title="Moneda">
                        <i class="bi bi-cash-coin me-1"></i>
                        <strong>Moneda:</strong> {{ cot.moneda || 'CLP' }}
                      </span>

                      <span class="oc-pill oc-pill-total" title="Total con IVA">
                        <i class="bi bi-coin me-1"></i>
                        <strong>Total:</strong>
                        {{ fmtMoney(cot.precioTotalConIVA, cot.moneda) }}
                      </span>

                      <span class="oc-pill" title="Aprobador sugerido">
                        <i class="bi bi-person-check me-1"></i>
                        <strong>Aprobador:</strong> {{ cot.aprobadorAsignado || cot.aprobadorSugerido || 'Alejandro Candia' }}
                      </span>
                    </div>
                  </div>

                  <div class="text-body-secondary small mt-1 break-any">
                    <strong>Responsable:</strong> {{ cot.responsable || '—' }} ·
                    <strong>Subida:</strong> {{ fmtFecha(cot.fechaSubida) }}
                  </div>

                  <div v-if="cot.comentario" class="small mt-1 break-any">
                    <em>“{{ cot.comentario }}”</em>
                  </div>
                </div>

                <div class="col-12 col-lg-3">
                  <div class="d-grid gap-2 d-lg-flex justify-content-lg-end">
                    <button
                      class="btn btn-primary btn-sm"
                      @click="cot.expandido = !cot.expandido; if (cot.expandido) ensureSolpedAuthLoaded(cot)"
                    >
                      {{ cot.expandido ? 'Ocultar' : 'Ver' }} detalle
                    </button>

                    <button
                      v-if="cot.solpedId"
                      class="btn btn-secondary btn-sm"
                      @click="irASolped(cot)"
                    >
                      Ver SOLPED
                    </button>
                  </div>
                </div>
              </div>

              <transition name="fade">
                <div v-if="cot.expandido" class="mt-3">
                  <!-- ARCHIVOS COTIZACION -->
                  <div v-if="(cot.archivosStorage || []).length" class="mb-3">
                    <div class="fw-semibold mb-2">📂 Archivos adjuntos</div>

                    <div
                      v-for="(a, i) in cot.archivosStorage"
                      :key="(a.url || i) + '_' + i"
                      class="card mb-2"
                    >
                      <div class="card-header d-flex align-items-center flex-wrap gap-2">
                        <div class="fw-semibold me-auto text-truncate">
                          {{ a.nombre || ('archivo_' + (i + 1)) }}
                        </div>

                        <button class="btn btn-sm btn-primary" @click="openViewer(a)">
                          <i class="bi bi-arrows-fullscreen me-1"></i> Ver grande
                        </button>

                        <button class="btn btn-sm btn-outline-secondary" @click="a.ver = !a.ver">
                          {{ a.ver ? 'Ocultar' : 'Mostrar' }}
                        </button>
                      </div>

                      <div v-if="a.ver" class="card-body">
                        <div
                          v-if="(a.tipo || '').includes('pdf')"
                          class="ratio ratio-16x9"
                          @click="isXs ? openViewer(a) : null"
                          style="cursor: var(--cur-ptr);"
                        >
                          <iframe :src="a.url" style="border:none;"></iframe>
                        </div>

                        <div v-else class="text-center">
                          <img
                            :src="a.url"
                            class="img-fluid rounded shadow-sm"
                            style="max-height:600px;object-fit:contain; cursor: var(--cur-ptr);"
                            @click="isXs ? openViewer(a) : null"
                            :alt="a.nombre || ('archivo_' + (i + 1))"
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- AUTORIZACIONES DESDE SOLPED -->
                  <div class="mb-3">
                    <div class="fw-semibold mb-2">📝 Autorizaciones (desde SOLPED Plantas)</div>
                    <div v-if="getAuthState(cot).loading" class="text-secondary small">
                      Cargando documentos…
                    </div>

                    <template v-else>
                      <div v-if="getAuthList(cot).length" class="auth-list">
                        <div
                          v-for="(f, idx) in getAuthList(cot)"
                          :key="(f.url || idx) + '_' + idx"
                          class="card auth-item mb-2"
                        >
                          <div class="card-body py-2">
                            <div class="row g-2 align-items-start">
                              <div class="col-auto">
                                <i :class="fileIcon(f)" class="fs-4"></i>
                              </div>

                              <div class="col minw-0">
                                <div class="d-flex flex-wrap align-items-center gap-2 minw-0">
                                  <span class="fw-semibold text-truncate flex-grow-1">
                                    {{ f.nombre || 'archivo' }}
                                  </span>
                                  <span class="badge bg-light text-body border">{{ prettyExt(f) }}</span>
                                  <span v-if="f.tamano" class="small text-secondary">
                                    · {{ fmtBytes(f.tamano) }}
                                  </span>
                                </div>

                                <div v-if="authPreviewOpen[authKey(cot, idx)]" class="mt-2">
                                  <div v-if="isPDF(f)" class="ratio ratio-16x9 auth-ratio">
                                    <iframe :src="f.url + '#toolbar=0'" class="auth-iframe" loading="lazy"></iframe>
                                  </div>
                                  <div v-else-if="isImage(f)" class="text-center auth-img-wrap">
                                    <img
                                      :src="f.url"
                                      :alt="f.nombre || 'imagen'"
                                      class="img-fluid rounded shadow-sm auth-img"
                                      loading="lazy"
                                    >
                                  </div>
                                </div>
                              </div>

                              <div class="col-12 col-sm-auto">
                                <div class="d-grid d-sm-flex gap-2 justify-content-sm-end">
                                  <button class="btn btn-sm btn-primary" @click="openViewer(f)">
                                    <i class="bi bi-box-arrow-up-right me-1"></i> Abrir
                                  </button>
                                  <a
                                    class="btn btn-sm btn-outline-secondary"
                                    :href="f.url"
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    <i class="bi bi-arrow-bar-down"></i> Descargar
                                  </a>
                                  <button
                                    v-if="isPreviewable(f)"
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="toggleAuthPreview(cot, idx)"
                                  >
                                    <i
                                      class="bi"
                                      :class="authPreviewOpen[authKey(cot, idx)] ? 'bi-eye-slash' : 'bi-eye'"
                                    ></i>
                                    {{ authPreviewOpen[authKey(cot, idx)] ? 'Ocultar visor' : 'Ver en visor' }}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else class="text-secondary small">
                        No hay documentos de autorización en la SOLPED asociada.
                      </div>
                    </template>
                  </div>

                  <!-- ITEMS -->
                  <div class="fw-semibold mb-2">📦 Ítems</div>
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th style="width:64px;">Ítem</th>
                          <th>Descripción</th>
                          <th class="text-center">Cant.</th>
                          <th class="text-center">Cotizada</th>
                          <th class="text-center">Estado</th>
                          <th class="d-none d-sm-table-cell">N° Interno</th>
                          <th class="d-none d-lg-table-cell">Código ref.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="it in cot.items || []"
                          :key="it.__tempId || `${it.item}-${it.descripcion}`"
                        >
                          <td>{{ it.item }}</td>
                          <td class="break-any">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada ?? it.cantidad_para_cotizar ?? 0 }}</td>
                          <td class="text-center">
                            <span class="badge" :class="badgeItem(it.estado_resultante || it.estado)">
                              {{ it.estado_resultante || it.estado || 'pendiente' }}
                            </span>
                          </td>
                          <td class="d-none d-sm-table-cell break-any">{{ it.numero_interno || '—' }}</td>
                          <td class="d-none d-lg-table-cell break-any">{{ it.codigo_referencial || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- COMENTARIO -->
                  <div class="mb-2">
                    <label class="form-label">Comentario (obligatorio)</label>
                    <textarea
                      class="form-control"
                      rows="2"
                      v-model="cot._comentarioAccion"
                      placeholder="Explica tu decisión…"
                    ></textarea>
                  </div>

                  <!-- ACCIONES -->
                  <div class="d-grid d-md-flex gap-2">
                    <button class="btn btn-success" :disabled="accionando" @click="aprobar(cot)">
                      <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                      Aprobar
                    </button>

                    <button class="btn btn-danger" :disabled="accionando" @click="rechazar(cot)">
                      Rechazar
                    </button>
                  </div>

                  <!-- HISTORIAL -->
                  <div class="mt-3">
                    <div class="fw-semibold mb-2">🕓 Historial</div>
                    <ul class="list-unstyled small mb-0">
                      <li
                        v-for="(h, idx) in cot.historial || []"
                        :key="idx"
                        class="break-any"
                      >
                        <strong>{{ h.usuario || '—' }}</strong> ·
                        <em>{{ h.estatus || '—' }}</em> ·
                        <span>{{ fmtFecha(h.fecha) }}</span>
                        <span v-if="h.comentario"> — “{{ h.comentario }}”</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- TOASTS -->
      <div class="toast-stack">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-box"
          :class="`toast-${t.type}`"
        >
          <i
            class="me-2"
            :class="t.type==='success'
              ? 'bi bi-check-circle-fill'
              : (t.type==='warning'
                ? 'bi bi-exclamation-triangle-fill'
                : 'bi bi-x-circle-fill')"
          ></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- FILTROS MOBILE -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none" id="offFiltrosCustom">
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>

        <div
          class="oc-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros Aprobación Cotizaciones Plantas"
          tabindex="0"
          @keydown.esc="closeFiltersMobile"
        >
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">Filtros</h2>

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">
                Limpiar
              </button>
              <button class="btn btn-sm btn-success" @click="closeFiltersMobile">
                Aplicar
              </button>
              <button class="btn btn-sm btn-outline-dark" @click="closeFiltersMobile" aria-label="Cerrar filtros">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <div class="mb-3">
              <label class="form-label">Empresa</label>
              <select v-model="empresaFiltro" class="form-select">
                <option value="TODAS">Todas las empresas</option>
                <option v-for="e in empresasDisponibles" :key="e" :value="e">
                  {{ e }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- VIEWER -->
    <transition name="viewer">
      <div v-if="viewerOpen" class="viewer-wrap" @keydown.esc="closeViewer" tabindex="0">
        <div class="viewer-backdrop" @click="closeOnBackdrop && closeViewer()"></div>

        <div class="viewer-panel" role="dialog" aria-modal="true" aria-label="Visor de adjunto">
          <div class="viewer-header">
            <div class="viewer-title text-truncate">
              {{ viewerItem?.nombre || 'Adjunto' }}
            </div>
            <div class="d-flex gap-2">
              <a
                v-if="viewerItem?.url"
                :href="viewerItem.url"
                target="_blank"
                rel="noopener"
                class="btn btn-sm btn-outline-light"
                title="Abrir en nueva pestaña / Descargar"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>

              <div v-if="isImage(viewerItem)" class="btn-group btn-group-sm me-1" role="group" aria-label="Zoom">
                <button class="btn btn-outline-light" @click="zoomOut" :disabled="zoom<=0.5">
                  <i class="bi bi-zoom-out"></i>
                </button>
                <button class="btn btn-outline-light" @click="resetZoom">
                  <i class="bi bi-aspect-ratio"></i>
                </button>
                <button class="btn btn-outline-light" @click="zoomIn" :disabled="zoom>=3">
                  <i class="bi bi-zoom-in"></i>
                </button>
              </div>

              <button class="btn btn-sm btn-light" @click="closeViewer" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="viewer-body">
            <div v-if="isImage(viewerItem)" class="viewer-img-wrap">
              <img
                :src="viewerItem.url"
                :alt="viewerItem.nombre || 'imagen'"
                class="viewer-img"
                :style="{ transform: `scale(${zoom})` }"
                @dblclick="toggleZoom"
              />
            </div>

            <div v-else class="viewer-pdf-wrap">
              <iframe :src="viewerItem?.url" class="viewer-pdf" title="PDF"></iframe>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const router = useRouter();
const volver = () => router.back();
const auth = useAuthStore();

const COT_COLLECTION = 'cotizaciones_plantas';
const SOLPED_COLLECTION = 'solpeds_plantas';
const APROBADOR_FIJO = 'Alejandro Candia';
const ESTATUS_PENDIENTE = 'Pendiente de Aprobación';

const normalize = (s) =>
  String(s || '')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const toasts = ref([]);
const addToast = (type, text, timeout = 2800) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

const userUid = ref('');
const usuarioNombre = ref('');
const esAlejandro = computed(() => normalize(usuarioNombre.value) === normalize(APROBADOR_FIJO));
const rolUsuario = ref('');

const esAdmin = computed(() => {
  return normalize(rolUsuario.value) === 'admin';
});

const puedeVerBandeja = computed(() => {
  return esAlejandro.value || esAdmin.value;
});
const empresaFiltro = ref('TODAS');
const showFiltersMobile = ref(false);

const cargando = ref(true);
const accionando = ref(false);
const cotizaciones = ref([]);
let unsubCotizaciones = null;

const toggleFiltersResponsive = () => {
  showFiltersMobile.value = !showFiltersMobile.value;
};
const closeFiltersMobile = () => {
  showFiltersMobile.value = false;
};
const limpiarFiltros = () => {
  empresaFiltro.value = 'TODAS';
};

const empresasDisponibles = computed(() => {
  const set = new Set();
  for (const c of cotizaciones.value) {
    if (c.empresa) set.add(c.empresa);
  }
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' }));
});

const etiquetaEmpresaFiltro = computed(() => {
  return empresaFiltro.value === 'TODAS' ? 'Todas las empresas' : empresaFiltro.value;
});

const cotizacionesFiltradas = computed(() => {
  let arr = cotizaciones.value.filter(c => normalize(c.estatus) === normalize(ESTATUS_PENDIENTE));

  if (empresaFiltro.value !== 'TODAS') {
    arr = arr.filter(c => String(c.empresa || '') === String(empresaFiltro.value));
  }

  return arr;
});

const pickUserName = (u = {}, fallback = '') => {
  return (
    u.fullName ||
    u.Nombre_completo ||
    u.nombre ||
    u.name ||
    u.displayName ||
    u.email ||
    fallback ||
    ''
  );
};

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : new Date(f));
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
};

const fmtMoney = (n, c = 'CLP') => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString('es-CL', {
      style: 'currency',
      currency: c || 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${c || 'CLP'} ${v.toLocaleString('es-CL')}`;
  }
};

const estadoBadgeClass = (estatus) => {
  const s = normalize(estatus);
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('pendiente')) return 'bg-warning-subtle text-warning-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const badgeItem = (estado) => {
  const s = normalize(estado || 'pendiente');
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('parcial')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('complet')) return 'bg-primary-subtle text-primary-emphasis';
  if (s.includes('pend')) return 'bg-secondary-subtle text-secondary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const actualizarEstadoCotizacionItems = (items = [], nuevoEstatus = '') => {
  const est = normalize(nuevoEstatus);
  let nuevoEstado = 'en_revision';

  if (est === normalize('Aprobado')) nuevoEstado = 'aprobado';
  else if (est === normalize('Rechazado')) nuevoEstado = 'rechazado';

  return (items || []).map((it) => ({
    ...it,
    estado_cotizacion: nuevoEstado,
  }));
};

async function obtenerNombreUsuario() {
  try {
    const uid = auth?.user?.uid || '';
    userUid.value = uid;

    let fullName = auth?.user?.displayName || auth?.user?.email || '';
    let role = '';

    if (uid) {
      let us = await getDoc(doc(db, 'Usuarios', uid));
      if (!us.exists()) us = await getDoc(doc(db, 'usuarios', uid));

      if (us.exists()) {
        const d = us.data() || {};
        fullName = pickUserName(d, fullName);
        role = d.role || d.rol || '';
      }
    }

    usuarioNombre.value = fullName || '';
    rolUsuario.value = role || '';
  } catch (e) {
    console.error(e);
    usuarioNombre.value = auth?.user?.displayName || auth?.user?.email || '';
    rolUsuario.value = '';
  }
}

function subscribeCotizaciones() {
  if (unsubCotizaciones) {
    unsubCotizaciones();
    unsubCotizaciones = null;
  }

  cargando.value = true;

  const qy = query(
    collection(db, COT_COLLECTION),
    where('estatus', '==', ESTATUS_PENDIENTE),
    orderBy('fechaSubida', 'desc')
  );

  unsubCotizaciones = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach((d) => {
      const data = d.data() || {};
      const aprobador = data.aprobadorAsignado || data.aprobadorSugerido || APROBADOR_FIJO;

      if (normalize(aprobador) !== normalize(APROBADOR_FIJO)) return;

      arr.push({
        __docId: d.id,
        ...data,
        archivosStorage: Array.isArray(data.archivosStorage)
          ? data.archivosStorage.map((a) => ({ ...a, ver: false }))
          : [],
        expandido: false,
        _comentarioAccion: '',
      });
    });

    arr.sort((a, b) =>
      (b.fechaSubida?.toMillis?.() ?? new Date(b.fechaSubida || 0).getTime()) -
      (a.fechaSubida?.toMillis?.() ?? new Date(a.fechaSubida || 0).getTime())
    );

    cotizaciones.value = arr;
    cargando.value = false;
  }, (err) => {
    console.error(err);
    addToast('danger', 'Error al cargar cotizaciones de plantas.');
    cargando.value = false;
  });
}

const irASolped = (cot) => {
  const id = cot?.solpedId;
  if (!id) {
    addToast('warning', 'Esta cotización no tiene SOLPED asociada.');
    return;
  }

  try {
    router.push({ name: 'HistorialSolpedPlantas', query: { id } });
  } catch {
    router.push(`/historial-solped-plantas?id=${id}`);
  }
};

/* =========================
   AUTORIZACIONES SOLPED
========================= */
const solpedAuthById = ref({});
const authPreviewOpen = ref({});

const authKey = (cot, idx) => `${cot.__docId || cot.solpedId || 'x'}_${idx}`;

const toggleAuthPreview = (cot, idx) => {
  const k = authKey(cot, idx);
  authPreviewOpen.value[k] = !authPreviewOpen.value[k];
};

const getAuthState = (cot) => {
  const sid = String(cot?.solpedId || '');
  return solpedAuthById.value[sid] || { loading: false, files: [] };
};

const getAuthList = (cot) => getAuthState(cot).files || [];

const getExt = (f) => {
  const name = String(f?.nombre || f?.url || '').toLowerCase();
  const m = name.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return (m?.[1] || '').trim();
};

const prettyExt = (f) => {
  const ext = getExt(f);
  if (ext) return ext.toUpperCase();
  const t = String(f?.tipo || '').split('/').pop();
  return (t || 'FILE').toUpperCase();
};

const isPDF = (f) => {
  const ext = getExt(f);
  if (ext === 'pdf') return true;
  const t = String(f?.tipo || '').toLowerCase();
  return t.includes('application/pdf');
};

const isImage = (file) => {
  const t = String(file?.tipo || '');
  return t.includes('image') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file?.url || ''));
};

const isPreviewable = (f) => isPDF(f) || isImage(f);

const fileIcon = (f) => {
  const ext = getExt(f);
  if (isPDF(f)) return 'bi bi-file-earmark-pdf text-danger';
  if (isImage(f)) return 'bi bi-file-earmark-image text-primary';
  if (['xls','xlsx','csv'].includes(ext)) return 'bi bi-file-earmark-spreadsheet text-success';
  if (['zip','rar','7z'].includes(ext)) return 'bi bi-file-earmark-zip';
  if (['doc','docx'].includes(ext)) return 'bi bi-file-earmark-word text-primary';
  if (['ppt','pptx'].includes(ext)) return 'bi bi-file-earmark-ppt text-warning';
  return 'bi bi-file-earmark';
};

const fmtBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (!b) return '—';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const v = (b / Math.pow(1024, i)).toFixed(i ? 1 : 0);
  return `${v} ${u[i]}`;
};

const ensureSolpedAuthLoaded = async (cot) => {
  const sid = String(cot?.solpedId || '');
  if (!sid) return;

  const cached = solpedAuthById.value[sid];
  if (cached && !cached.loading) return;

  solpedAuthById.value[sid] = { loading: true, files: [] };

  try {
    const sref = doc(db, SOLPED_COLLECTION, sid);
    const snap = await getDoc(sref);

    let files = [];
    if (snap.exists()) {
      const d = snap.data() || {};

      if (Array.isArray(d.autorizaciones) && d.autorizaciones.length) {
        files = d.autorizaciones
          .filter((x) => x?.url)
          .map((x) => ({
            nombre: x?.nombre || '',
            url: String(x?.url),
            tipo: x?.tipo || '',
            tamano: Number(x?.tamano || 0),
          }));
      }
    }

    solpedAuthById.value[sid] = { loading: false, files };
  } catch (e) {
    console.error('Error cargando autorizaciones de SOLPED Plantas:', e);
    solpedAuthById.value[sid] = { loading: false, files: [] };
  }
};

/* =========================
   VIEWER
========================= */
const isXs = ref(false);
let mqXs = null;
const updateXs = () => { isXs.value = !!mqXs?.matches; };

const viewerOpen = ref(false);
const viewerItem = ref(null);
const zoom = ref(1);
const closeOnBackdrop = true;

const openViewer = (file) => {
  viewerItem.value = file || null;
  viewerOpen.value = !!viewerItem.value;
  zoom.value = 1;
  setTimeout(() => { document.querySelector('.viewer-wrap')?.focus(); }, 0);
};
const closeViewer = () => {
  viewerOpen.value = false;
  viewerItem.value = null;
  zoom.value = 1;
};
const zoomIn = () => { zoom.value = Math.min(3, +(zoom.value + 0.25).toFixed(2)); };
const zoomOut = () => { zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2)); };
const resetZoom = () => { zoom.value = 1; };
const toggleZoom = () => { zoom.value = (zoom.value === 1 ? 2 : 1); };

watch(viewerOpen, v => {
  document.documentElement.style.overflow = v ? 'hidden' : '';
});

/* =========================
   HISTORIAL SOLPED
========================= */
const registrarHistorialSolpedAccionCotizacion = async ({
  solpedId,
  cotNumero,
  usuario,
  estatusCot,
  comentario,
}) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, SOLPED_COLLECTION, String(solpedId));
    await addDoc(collection(sref, 'historialEstados'), {
      estatus: estatusCot,
      fecha: serverTimestamp(),
      usuario: usuario || '—',
      origen: 'Acción Cotización Plantas',
      detalle: comentario || '',
      comentario: comentario || '',
      cotizacionNumero: cotNumero ?? null,
    });
  } catch (e) {
    console.warn('No se pudo registrar acción en historialEstados de la SOLPED:', e);
  }
};

/* =========================
   ACCIONES
========================= */
const canActOnCot = (cot) => {
  if (!esAlejandro.value) return false;
  return normalize(cot?.estatus) === normalize(ESTATUS_PENDIENTE);
};

const aprobar = async (cot) => {
  if (accionando.value) return;

  const comentario = String(cot._comentarioAccion || '').trim();
  if (!comentario) {
    addToast('warning', 'Escribe un comentario antes de aprobar.');
    return;
  }

  if (!canActOnCot(cot)) {
    addToast('warning', 'No puedes aprobar esta cotización.');
    return;
  }

  accionando.value = true;
  try {
    const nuevoEstatus = 'Aprobado';
    const nuevosItems = actualizarEstadoCotizacionItems(cot.items || [], nuevoEstatus);

    const nuevoHistorial = [
      ...((cot.historial || [])),
      {
        usuario: usuarioNombre.value || APROBADOR_FIJO,
        estatus: nuevoEstatus,
        fecha: new Date().toISOString(),
        comentario,
      },
    ];

    await updateDoc(doc(db, COT_COLLECTION, cot.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      aprobadoPor: usuarioNombre.value || APROBADOR_FIJO,
      comentario_aprobacion: comentario,
      items: nuevosItems,
      updated_at: serverTimestamp(),
    });

    await registrarHistorialSolpedAccionCotizacion({
      solpedId: cot.solpedId,
      cotNumero: cot.id,
      usuario: usuarioNombre.value || APROBADOR_FIJO,
      estatusCot: nuevoEstatus,
      comentario,
    });

    addToast('success', 'Cotización aprobada.');
    cotizaciones.value = cotizaciones.value.filter(x => x.__docId !== cot.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo aprobar la cotización.');
  } finally {
    accionando.value = false;
  }
};

const rechazar = async (cot) => {
  if (accionando.value) return;

  const comentario = String(cot._comentarioAccion || '').trim();
  if (!comentario) {
    addToast('warning', 'Escribe un comentario antes de rechazar.');
    return;
  }

  if (!canActOnCot(cot)) {
    addToast('warning', 'No puedes rechazar esta cotización.');
    return;
  }

  accionando.value = true;
  try {
    const nuevoEstatus = 'Rechazado';
    const nuevosItems = actualizarEstadoCotizacionItems(cot.items || [], nuevoEstatus);

    const nuevoHistorial = [
      ...((cot.historial || [])),
      {
        usuario: usuarioNombre.value || APROBADOR_FIJO,
        estatus: nuevoEstatus,
        fecha: new Date().toISOString(),
        comentario,
      },
    ];

    await updateDoc(doc(db, COT_COLLECTION, cot.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      rechazadoPor: usuarioNombre.value || APROBADOR_FIJO,
      comentario_rechazo: comentario,
      items: nuevosItems,
      updated_at: serverTimestamp(),
    });

    await registrarHistorialSolpedAccionCotizacion({
      solpedId: cot.solpedId,
      cotNumero: cot.id,
      usuario: usuarioNombre.value || APROBADOR_FIJO,
      estatusCot: nuevoEstatus,
      comentario,
    });

    addToast('danger', 'Cotización rechazada.');
    cotizaciones.value = cotizaciones.value.filter(x => x.__docId !== cot.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo rechazar la cotización.');
  } finally {
    accionando.value = false;
  }
};

onMounted(async () => {
  try {
    cargando.value = true;

    mqXs = window.matchMedia('(max-width: 576px)');
    updateXs();
    mqXs.addEventListener?.('change', updateXs);

    await obtenerNombreUsuario();
    subscribeCotizaciones();

    cargando.value = false;
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo inicializar la vista.');
    cargando.value = false;
  }
});

onBeforeUnmount(() => {
  unsubCotizaciones?.();
  mqXs?.removeEventListener?.('change', updateXs);
  mqXs = null;
  document.documentElement.style.overflow = '';
});
</script>

<style scoped>
.aprob-oc-page{ min-height:100vh; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

.oc-highlight{
  padding: .65rem .75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: .8rem;
  background: var(--bs-body-bg);
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
}
.oc-pill{
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  padding: .35rem .6rem;
  border-radius: 999px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  font-size: .9rem;
  line-height: 1;
  white-space: nowrap;
}
.oc-pill-total{
  border-color: var(--bs-primary-border-subtle, var(--bs-border-color));
  background: var(--bs-primary-bg-subtle, var(--bs-secondary-bg));
  color: var(--bs-primary-text);
  font-weight: 600;
}
.oc-pill i{ font-size: 1rem; opacity: .9; }

.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.minw-0{ min-width: 0; }
.maxw-180{ max-width: 180px; }
.maxw-140{ max-width: 140px; }

@media (max-width: 576px){
  .oc-highlight{ padding: .55rem .6rem; }
  .oc-pill{ font-size: .86rem; }
  .list-group-item .btn{ width: 100%; }
}
@media (min-width: 768px) and (max-width: 991.98px){
  .maxw-180{ max-width: 240px; }
  .maxw-140{ max-width: 180px; }
}

.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }

.oc-wrap{
  position: fixed; inset: 0;
  z-index: 2050;
}
.oc-backdrop{
  position: absolute; inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(1px);
}
.oc-panel{
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(92vw, 420px);
  background: var(--bs-body-bg, #fff);
  box-shadow: -8px 0 24px rgba(0,0,0,.2);
  display: flex; flex-direction: column;
  transform: translateX(0);
  animation: ocSlideIn .22s ease-out;
}
@keyframes ocSlideIn {
  from { transform: translateX(100%); opacity: .6; }
  to   { transform: translateX(0);     opacity: 1; }
}
.oc-header{
  padding: .9rem .9rem;
  border-bottom: 1px solid var(--bs-border-color, #e5e7eb);
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; background: var(--bs-body-bg, #fff); z-index: 1;
}
.oc-body{ padding: .9rem; overflow: auto; }

.auth-list { width: 100%; }
.auth-item .card-body { padding: .75rem .8rem; }
.auth-ratio { border-radius: .5rem; overflow: hidden; background: var(--bs-tertiary-bg, #0b0f14); }
.auth-iframe { width: 100%; height: 100%; border: 0; }
.auth-img-wrap { max-height: 420px; overflow: auto; }
.auth-img { max-height: 100%; object-fit: contain; }
.auth-item .badge { font-weight: 500; }

@media (max-width: 576px){
  .auth-img-wrap { max-height: 300px; }
  .auth-item .d-sm-flex > .btn { width: 100%; }
}
@media (min-width: 577px) and (max-width: 991.98px){
  .auth-img-wrap { max-height: 360px; }
}

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
.viewer-pdf-wrap{ width: 100%; height: 100%; }
.viewer-pdf{ width: 100%; height: 100%; border: none; }

@media (max-width: 576px){
  .viewer-panel{
    width: 100vw; height: 100vh; border-radius: 0;
  }
  .viewer-title{ max-width: 50vw; }
}

:global(:root){ --cur-ptr: pointer; }
</style>
