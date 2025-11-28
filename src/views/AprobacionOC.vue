<!-- src/views/AprobaciónOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-oc-page">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm order-1" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0 order-2 flex-grow-1 text-center text-md-start">
          Aprobación de OC
        </h1>

        <!-- Controles en desktop/tablet -->
        <div class="d-none d-md-flex align-items-center gap-2 ms-auto order-3">
          <div class="input-group input-group-sm" style="width:260px;">
            <span class="input-group-text"><i class="bi bi-buildings"></i></span>
            <select v-model="empresaFiltro" class="form-select">
              <option value="TODAS">Todas las empresas</option>
              <option v-for="e in empresasCfg" :key="e.key" :value="e.key">
                {{ e.nombre }}
              </option>
            </select>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>

        <!-- Controles en móvil -->
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

      <!-- Mensaje rol -->
      <div v-if="!rolActual && !cargando" class="alert alert-warning">
        Tu usuario no tiene bandeja de aprobación asignada (o hoy estás fuera por vacaciones/estado).
      </div>

      <!-- Lista -->
      <div class="card" v-if="rolActual">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="minw-0">
            <div class="fw-semibold">Órdenes encontradas</div>
            <div class="small text-secondary text-truncate">
              Estado(s): <strong>{{ estatusFiltrado }}</strong> ·
              Empresa: <strong>{{ etiquetaEmpresaFiltro }}</strong>
              <span v-if="delegatedStatusesCount" class="ms-2 badge bg-warning-subtle text-warning-emphasis">
                Delegaciones activas: {{ delegatedStatusesCount }}
              </span>
            </div>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ ocsFiltradas.length }}</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargando" class="p-4 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="ocsFiltradas.length === 0" class="p-4 text-secondary text-center">
            No hay OCs para tu bandeja con los filtros actuales.
          </div>

          <div v-else class="list-group list-group-flush">
            <div v-for="oc in ocsFiltradas" :key="oc.__docId" class="list-group-item">
              <!-- Fila responsive -->
              <div class="row g-3 align-items-start">
                <!-- Col: info -->
                <div class="col-12 col-lg-9">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold">OC N° {{ oc.id ?? '—' }}</span>
                    <span class="badge" :class="estadoBadgeClass(oc.estatus)">
                      {{ prettyEstatus(oc) }}
                    </span>

                    <template v-if="getDelegationInfo(oc)">
                      <span class="badge bg-warning-subtle text-warning-emphasis">
                        Delegado: {{ getDelegationInfo(oc).from }} → {{ getDelegationInfo(oc).to }}
                      </span>
                    </template>
                  </div>

                  <!-- Chips resumen -->
                  <div class="oc-highlight mt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="oc-pill" title="Centro de costo">
                        <i class="bi bi-building me-1"></i>
                        <strong>Centro:</strong>
                        <span class="text-truncate d-inline-block maxw-180">
                          {{ oc.centroCostoNombre || '—' }}
                        </span>
                        <template> ({{ oc.centroCosto || '—' }})</template>
                      </span>

                      <span class="oc-pill" title="Empresa">
                        <i class="bi bi-diagram-3 me-1"></i>
                        <strong>Empresa:</strong>
                        <span class="text-truncate d-inline-block maxw-140">{{ oc._empresaNombre || oc.empresa || '—' }}</span>
                      </span>

                      <span class="oc-pill" title="Moneda">
                        <i class="bi bi-cash-coin me-1"></i>
                        <strong>Moneda:</strong> {{ oc.moneda || 'CLP' }}
                      </span>

                      <span class="oc-pill oc-pill-total" title="Total con IVA">
                        <i class="bi bi-coin me-1"></i>
                        <strong>Total:</strong>
                        {{ (oc.precioTotalConIVA ?? 0).toLocaleString('es-CL') }}
                      </span>
                    </div>
                  </div>

                  <!-- Compacto -->
                  <div class="text-body-secondary small mt-1 break-any">
                    <strong>Responsable:</strong> {{ oc.responsable || '—' }} ·
                    <strong>Subida:</strong> {{ fmtFecha(oc.fechaSubida) }}
                  </div>

                  <div v-if="oc.comentario" class="small mt-1 break-any">
                    <em>“{{ oc.comentario }}”</em>
                  </div>
                </div>

                <!-- Col: acciones -->
                <div class="col-12 col-lg-3">
                  <div class="d-grid gap-2 d-lg-flex justify-content-lg-end">
                    <button
                      class="btn btn-primary btn-sm"
                      @click="oc.expandido = !oc.expandido; if (oc.expandido) ensureSolpedAuthLoaded(oc)"
                    >
                      {{ oc.expandido ? 'Ocultar' : 'Ver' }} detalle
                    </button>
                    <button
                      v-if="oc.solpedId"
                      class="btn btn-secondary btn-sm"
                      @click="irASolped(oc)"
                    >
                      Ver SOLPED
                    </button>
                  </div>
                </div>
              </div>

              <!-- Detalle -->
              <transition name="fade">
                <div v-if="oc.expandido" class="mt-3">
                  <!-- Archivos (propios de la OC) -->
                  <div v-if="(oc.archivosStorage||[]).length" class="mb-3">
                    <div class="fw-semibold mb-2">📂 Archivos Adjuntos</div>

                    <div v-for="(a,i) in oc.archivosStorage" :key="a.url" class="card mb-2">
                      <div class="card-header d-flex align-items-center flex-wrap gap-2">
                        <div class="fw-semibold me-auto text-truncate">{{ a.nombre || ('archivo_'+(i+1)) }}</div>
                        <button class="btn btn-sm btn-primary" @click="openViewer(a)">
                          <i class="bi bi-arrows-fullscreen me-1"></i> Ver grande
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" @click="a.ver = !a.ver">
                          {{ a.ver ? 'Ocultar' : 'Mostrar' }}
                        </button>
                      </div>

                      <div v-if="a.ver" class="card-body">
                        <div
                          v-if="(a.tipo||'').includes('pdf')"
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
                            :alt="a.nombre || ('archivo_'+(i+1))"
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ===== Autorizaciones (desde SOLPED) ===== -->
                  <div class="mb-3">
                    <div class="fw-semibold mb-2">📝 Autorizaciones (desde SOLPED)</div>
                    <div v-if="getAuthState(oc).loading" class="text-secondary small">Cargando documentos…</div>

                    <template v-else>
                      <div v-if="getAuthList(oc).length" class="auth-list">
                        <div
                          v-for="(f, idx) in getAuthList(oc)"
                          :key="f.url + '_' + idx"
                          class="card auth-item mb-2"
                        >
                          <div class="card-body py-2">
                            <div class="row g-2 align-items-start">
                              <div class="col-auto">
                                <i :class="fileIcon(f)" class="fs-4"></i>
                              </div>

                              <div class="col minw-0">
                                <div class="d-flex flex-wrap align-items-center gap-2 minw-0">
                                  <span class="fw-semibold text-truncate flex-grow-1">{{ f.nombre || 'archivo' }}</span>
                                  <span class="badge bg-light text-body border">{{ prettyExt(f) }}</span>
                                  <span v-if="f.tamano" class="small text-secondary">· {{ fmtBytes(f.tamano) }}</span>
                                </div>

                                <div v-if="authPreviewOpen[authKey(oc, idx)]" class="mt-2">
                                  <div v-if="isPDF(f)" class="ratio ratio-16x9 auth-ratio">
                                    <iframe :src="f.url + '#toolbar=0'" class="auth-iframe" loading="lazy"></iframe>
                                  </div>
                                  <div v-else-if="isImage(f)" class="text-center auth-img-wrap">
                                    <img :src="f.url" :alt="f.nombre || 'imagen'" class="img-fluid rounded shadow-sm auth-img" loading="lazy">
                                  </div>
                                </div>
                              </div>

                              <div class="col-12 col-sm-auto">
                                <div class="d-grid d-sm-flex gap-2 justify-content-sm-end">
                                  <button class="btn btn-sm btn-primary" @click="openViewer(f)">
                                    <i class="bi bi-box-arrow-up-right me-1"></i> Abrir
                                  </button>
                                  <a class="btn btn-sm btn-outline-secondary" :href="f.url" target="_blank" rel="noopener">
                                    <i class="bi bi-arrow-bar-down"></i> Descargar
                                  </a>
                                  <button
                                    v-if="isPreviewable(f)"
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="toggleAuthPreview(oc, idx)"
                                  >
                                    <i class="bi" :class="authPreviewOpen[authKey(oc, idx)] ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    {{ authPreviewOpen[authKey(oc, idx)] ? 'Ocultar visor' : 'Ver en visor' }}
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
                  <!-- ===== Fin Autorizaciones ===== -->

                  <!-- Ítems -->
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
                        <tr v-for="it in oc.items || []" :key="it.__tempId || `${it.item}-${it.descripcion}`">
                          <td>{{ it.item }}</td>
                          <td class="break-any">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada ?? 0 }}</td>
                          <td class="text-center">
                            <span class="badge" :class="badgeItem(it.estado)">{{ it.estado || 'pendiente' }}</span>
                          </td>
                          <td class="d-none d-sm-table-cell break-any">{{ it.numero_interno || '—' }}</td>
                          <td class="d-none d-lg-table-cell break-any">{{ it.codigo_referencial || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Comentario acción -->
                  <div class="mb-2">
                    <label class="form-label">Comentario (obligatorio)</label>
                    <textarea class="form-control" rows="2" v-model="oc._comentarioAccion" placeholder="Explica tu decisión…"></textarea>
                  </div>

                  <!-- Botones acción -->
                  <div class="d-grid d-md-flex gap-2">
                    <button class="btn btn-success" :disabled="accionando" @click="aprobar(oc)">
                      <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                      Aprobar
                    </button>
                    <button class="btn btn-warning" :disabled="accionando" @click="solicitarAclaracion(oc)">
                      Solicitar aclaración
                    </button>
                    <button class="btn btn-danger" :disabled="accionando" @click="rechazar(oc)">
                      Rechazar
                    </button>
                  </div>

                  <!-- Historial -->
                  <div class="mt-3">
                    <div class="fw-semibold mb-2">🕓 Historial</div>
                    <ul class="list-unstyled small mb-0">
                      <li v-for="(h,idx) in oc.historial || []" :key="idx" class="break-any">
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

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Offcanvas filtros (móvil / tablet) - CUSTOM -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none" id="offFiltrosCustom">
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>

        <div
          class="oc-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros Aprobación OC"
          tabindex="0"
          @keydown.esc="closeFiltersMobile"
        >
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">Filtros</h2>

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">
                Limpiar
              </button>
              <button class="btn btn-sm btn-success" @click="applyFilters(); closeFiltersMobile()">
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
                <option v-for="e in empresasCfg" :key="e.key" :value="e.key">
                  {{ e.nombre }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== VISOR FULLSCREEN DE ADJUNTOS ===== -->
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
                target="_blank" rel="noopener"
                class="btn btn-sm btn-outline-light"
                title="Abrir en nueva pestaña / Descargar"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
              <div v-if="isImage(viewerItem)" class="btn-group btn-group-sm me-1" role="group" aria-label="Zoom">
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
    <!-- ===== FIN VISOR ===== -->

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc,
  getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const router = useRouter();
const volver = () => router.back();
const auth = useAuthStore();

/* =========================
   Toasts
   ========================= */
const toasts = ref([]);
const addToast = (type, text, timeout = 2800) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

/* =========================
   Usuario
   ========================= */
const userUid = ref('');
const usuarioNombre = ref('');

/* =========================
   Config flujo por empresa (AdminConfig)
   configuracion/aprobacion_oc_taller/empresas/*
   ========================= */
const rootRef = doc(db, 'configuracion', 'aprobacion_oc_taller');
const empresasCol = collection(rootRef, 'empresas');
const empresasCfg = ref([]); // [{key,nombre,activo,steps:[]}]
let unsubEmp = null;

const keyify = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};

const isInVacation = (vacaciones = [], dateISO = todayISO()) => {
  if (!Array.isArray(vacaciones)) return false;
  return vacaciones.some(v => v?.from && v?.to && String(v.from) <= dateISO && dateISO <= String(v.to));
};

const availableApprovers = (step) => {
  const arr = Array.isArray(step?.approvers) ? step.approvers : [];
  return arr.filter(a =>
    a?.uid &&
    a.activo !== false &&
    !isInVacation(a.vacaciones)
  );
};

const stepHasAvailableApprover = (step) => {
  if (!step) return false;
  if (step.activo === false) return false;
  return availableApprovers(step).length > 0;
};

const findEmpresaDoc = (empresaRaw) => {
  const raw = String(empresaRaw || '').trim();
  if (!raw) return null;

  const k = keyify(raw);
  let e = empresasCfg.value.find(x => x.key === k);
  if (e) return e;

  e = empresasCfg.value.find(x => keyify(x.nombre) === k);
  if (e) return e;

  const nr = keyify(raw).replace(/_/g, '');
  e = empresasCfg.value.find(x =>
    keyify(x.nombre).replace(/_/g, '').includes(nr) ||
    nr.includes(keyify(x.nombre).replace(/_/g, ''))
  );
  return e || null;
};

const getStepsForOC = (oc) => {
  const emp = findEmpresaDoc(oc?.empresa);
  const steps = Array.isArray(emp?.steps) ? emp.steps : [];
  return steps;
};

const findStepIndexByStatus = (steps, status) =>
  steps.findIndex(s => String(s?.inStatus || '') === String(status || ''));

/** Delegación: si step sin aprobadores, delega al step anterior disponible (si no, al siguiente) */
const findFallbackIndex = (steps, idx) => {
  if (!Array.isArray(steps) || idx < 0) return -1;
  if (stepHasAvailableApprover(steps[idx])) return idx;

  for (let d = 1; d < steps.length; d++) {
    const prev = idx - d;
    if (prev >= 0 && stepHasAvailableApprover(steps[prev])) return prev;

    const next = idx + d;
    if (next < steps.length && stepHasAvailableApprover(steps[next])) return next;
  }
  return -1;
};

/** Estados (bandejas) que el usuario debe ver hoy */
const statusesWanted = computed(() => {
  const uid = userUid.value;
  if (!uid) return [];

  const out = new Set();

  for (const emp of empresasCfg.value) {
    if (!emp || emp.activo === false) continue;
    const steps = Array.isArray(emp.steps) ? emp.steps : [];
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const inStatus = String(st?.inStatus || '').trim();
      if (!inStatus) continue;

      const f = findFallbackIndex(steps, i);
      if (f < 0) continue;

      const uidsAvail = new Set(availableApprovers(steps[f]).map(a => a.uid));
      if (uidsAvail.has(uid)) out.add(inStatus);
    }
  }
  return [...out];
});

const delegatedStatusesCount = computed(() => {
  const uid = userUid.value;
  if (!uid) return 0;
  let c = 0;

  for (const emp of empresasCfg.value) {
    if (!emp || emp.activo === false) continue;
    const steps = Array.isArray(emp.steps) ? emp.steps : [];
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const inStatus = String(st?.inStatus || '').trim();
      if (!inStatus) continue;

      const f = findFallbackIndex(steps, i);
      if (f < 0 || f === i) continue;

      const uidsAvail = new Set(availableApprovers(steps[f]).map(a => a.uid));
      if (uidsAvail.has(uid)) c++;
    }
  }
  return c;
});

const rolActual = computed(() => (statusesWanted.value.length ? 'APROBADOR' : null));
const estatusFiltrado = computed(() => statusesWanted.value.join(' / ') || '—');

/* =========================
   Empresa filtro (empresaKey)
   ========================= */
const empresaFiltro = ref('TODAS');
const etiquetaEmpresaFiltro = computed(() => {
  if (empresaFiltro.value === 'TODAS') return 'Todas las empresas';
  const e = empresasCfg.value.find(x => x.key === empresaFiltro.value);
  return e?.nombre || empresaFiltro.value;
});

/* =========================
   Offcanvas custom (móvil)
   ========================= */
const showFiltersMobile = ref(false);
const toggleFiltersResponsive = () => { showFiltersMobile.value = !showFiltersMobile.value; };
const closeFiltersMobile = () => { showFiltersMobile.value = false; };
const applyFilters = () => {};
const limpiarFiltros = () => { empresaFiltro.value = 'TODAS'; };

/* =========================
   Visor fullscreen de adjuntos
   ========================= */
const isXs = window.matchMedia('(max-width: 576px)').matches;
const viewerOpen = ref(false);
const viewerItem = ref(null);
const zoom = ref(1);
const closeOnBackdrop = true;

const isImage = (file) => {
  const t = String(file?.tipo || '');
  return t.includes('image') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file?.url||''));
};
const openViewer = (file) => {
  viewerItem.value = file || null;
  viewerOpen.value = !!viewerItem.value;
  zoom.value = 1;
  setTimeout(()=> { (document.querySelector('.viewer-wrap'))?.focus(); }, 0);
};
const closeViewer = () => { viewerOpen.value = false; viewerItem.value = null; zoom.value = 1; };
const zoomIn = () => { zoom.value = Math.min(3, +(zoom.value + 0.25).toFixed(2)); };
const zoomOut = () => { zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2)); };
const resetZoom = () => { zoom.value = 1; };
const toggleZoom = () => { zoom.value = (zoom.value === 1 ? 2 : 1); };
watch(viewerOpen, v => { document.documentElement.style.overflow = v ? 'hidden' : ''; });

/* =========================
   Autorizaciones SOLPED
   ========================= */
const solpedAuthById = ref({});
const authKey = (oc, idx) => `${oc.__docId || oc.solpedId || 'x'}_${idx}`;
const authPreviewOpen = ref({});
const toggleAuthPreview = (oc, idx) => {
  const k = authKey(oc, idx);
  authPreviewOpen.value[k] = !authPreviewOpen.value[k];
};

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

const getAuthState = (oc) => {
  const sid = String(oc?.solpedId || '');
  return solpedAuthById.value[sid] || { loading: false, files: [] };
};
const getAuthList = (oc) => getAuthState(oc).files || [];

const ensureSolpedAuthLoaded = async (oc) => {
  const sid = String(oc?.solpedId || '');
  if (!sid) return;

  const cached = solpedAuthById.value[sid];
  if (cached && !cached.loading) return;

  solpedAuthById.value[sid] = { loading: true, files: [] };
  try {
    const sref = doc(db, 'solpes', sid);
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
            tamano: Number(x?.tamano || 0)
          }));
      }

      if (!files.length && d.autorizacion_url) {
        files = [{
          nombre: d.autorizacion_nombre || 'Autorización',
          url: String(d.autorizacion_url),
          tipo: 'application/pdf',
          tamano: undefined
        }];
      }
    }

    solpedAuthById.value[sid] = { loading: false, files };
  } catch (e) {
    console.error('Error cargando autorizaciones de SOLPED:', e);
    solpedAuthById.value[sid] = { loading: false, files: [] };
  }
};

/* =========================
   Badges / utils
   ========================= */
const estadoBadgeClass = (estatus) => {
  const s = (estatus||'').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('preaprob')) return 'bg-info-subtle text-info-emphasis';
  if (s.includes('casi')) return 'bg-primary-subtle text-primary-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('revisión') || s.includes('revision')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('proveedor')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};
const badgeItem = (estado) => {
  const s = (estado || 'pendiente').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('revis')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('pend')) return 'bg-secondary-subtle text-secondary-emphasis';
  if (s.includes('complet')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};
const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : new Date(f));
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
  } catch { return '—'; }
};

const getDelegationInfo = (oc) => {
  const steps = getStepsForOC(oc);
  const idx = findStepIndexByStatus(steps, oc?.estatus);
  if (idx < 0) return null;
  const f = findFallbackIndex(steps, idx);
  if (f < 0 || f === idx) return null;
  return {
    from: steps[idx]?.nombre || steps[idx]?.inStatus || 'etapa',
    to: steps[f]?.nombre || steps[f]?.inStatus || 'delegado'
  };
};

const prettyEstatus = (oc) => {
  const est = String(oc?.estatus || '—');
  const info = getDelegationInfo(oc);
  if (!info) return est;
  return `${est} (delegado)`;
};

/* =========================
   Permiso: puedo actuar en esta OC hoy
   ========================= */
const canActOnOC = (oc) => {
  const uid = userUid.value;
  if (!uid) return false;

  const steps = getStepsForOC(oc);
  const idx = findStepIndexByStatus(steps, oc?.estatus);
  if (idx < 0) return false;

  const f = findFallbackIndex(steps, idx);
  if (f < 0) return false;

  const uidsAvail = new Set(availableApprovers(steps[f]).map(a => a.uid));
  return uidsAvail.has(uid);
};

/* =========================
   Suscripción OCs (chunked IN <= 10)
   ========================= */
const cargando = ref(true);
const ocs = ref([]);
let unsubsOCs = [];

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const rebuildOCsFromChunks = (chunkMaps) => {
  const map = new Map();
  for (const m of chunkMaps) for (const [id, val] of m.entries()) map.set(id, val);

  const arr = [...map.values()]
    .map(oc => ({
      ...oc,
      _empresaKey: findEmpresaDoc(oc?.empresa)?.key || keyify(oc?.empresa || ''),
      _empresaNombre: findEmpresaDoc(oc?.empresa)?.nombre || (oc?.empresa || ''),
    }))
    .filter(oc => canActOnOC(oc));

  arr.sort((a,b) =>
    (b.fechaSubida?.toMillis?.() ?? new Date(b.fechaSubida || 0).getTime()) -
    (a.fechaSubida?.toMillis?.() ?? new Date(a.fechaSubida || 0).getTime())
  );

  ocs.value = arr;
  cargando.value = false;
};

const subscribeOCs = () => {
  unsubsOCs.forEach(fn => fn?.());
  unsubsOCs = [];
  cargando.value = true;

  const statuses = statusesWanted.value.filter(Boolean);
  if (!statuses.length) {
    ocs.value = [];
    cargando.value = false;
    return;
  }

  const chunks = chunk(statuses, 10);
  const chunkMaps = chunks.map(() => new Map());

  chunks.forEach((stChunk, idx) => {
    const qy = query(
      collection(db, 'ordenes_oc'),
      where('estatus', 'in', stChunk),
      orderBy('fechaSubida', 'desc')
    );

    const unsub = onSnapshot(qy, (snap) => {
      const m = new Map();
      snap.forEach(d => {
        const data = d.data() || {};
        const archivos = Array.isArray(data.archivosStorage)
          ? data.archivosStorage.map(a => ({ ...a, ver:false }))
          : [];

        m.set(d.id, {
          __docId: d.id,
          ...data,
          archivosStorage: archivos,
          expandido: false,
          _comentarioAccion: ''
        });
      });

      chunkMaps[idx] = m;
      rebuildOCsFromChunks(chunkMaps);
    }, (err) => {
      console.error(err);
      addToast('danger', 'Error al cargar OCs.');
      cargando.value = false;
    });

    unsubsOCs.push(unsub);
  });
};

/* =========================
   Empresa filtro
   ========================= */
const ocsFiltradas = computed(() => {
  if (empresaFiltro.value === 'TODAS') return ocs.value;
  return ocs.value.filter(oc => String(oc._empresaKey || '') === String(empresaFiltro.value));
});

/* =========================
   Navegación a SOLPED
   ========================= */
const irASolped = (oc) => {
  const id = oc?.solpedId;
  if (!id) { addToast('warning','Esta OC no tiene SOLPED asociada.'); return; }
  try { router.push({ name: 'SolpedDetalle', params: { id } }); }
  catch { router.push(`/solped/${id}`); }
};

/* =========================================================
   Historial en solpes/historialEstados (por cambio estatus OC)
   ========================================================= */
const registrarHistorialSolpedAccionOC = async ({ solpedId, ocNumero, usuario, estatusOC, comentario }) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, 'solpes', String(solpedId));
    await addDoc(collection(sref, 'historialEstados'), {
      estatus: estatusOC,
      fecha: serverTimestamp(),
      usuario: usuario || '—',
      origen: 'Acción OC',
      detalle: comentario || '',
      comentario: comentario || '',
      ocNumero: ocNumero ?? null
    });
  } catch (e) {
    console.warn('No se pudo registrar acción de OC en historialEstados de la SOLPED:', e);
  }
};

/* =========================================================
   Actualizar SOLPED con avances de esta OC (tu versión)
   ========================================================= */
const DEBUG = false;
const s = (obj) => { try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; } };
const dlog = (tag, payload = {}) => {
  if (!DEBUG) return;
  try { console.groupCollapsed(`[AprobOC] ${tag}`); console.log(payload); }
  finally { console.groupEnd?.(); }
};

const actualizarSolpedConOC = async (oc, aprobador, comentario, estatusOC) => {
  const solpedId = oc?.solpedId; if (!solpedId) return;
  const sref = doc(db, 'solpes', String(solpedId));
  const ss = await getDoc(sref); if (!ss.exists()) return;

  const sdata = ss.data() || {};
  const itemsSol = Array.isArray(sdata.items) ? [...sdata.items] : [];
  const ocItems = Array.isArray(oc.items) ? oc.items : [];
  const ocKey = String(oc.id ?? oc.__docId ?? '');

  dlog('SOLPED:update:init', {
    solpedId, ocId: oc.id, ocKey,
    itemsOC: s(ocItems),
    itemsSolpedBefore: s(itemsSol.map(it => ({
      item: it.item, desc: it.descripcion, cant: it.cantidad, cot: it.cantidad_cotizada, estado: it.estado, cotPorOC: it.cotPorOC
    })))
  });

  let huboAvance = false;

  const norm = (x) => String(x||'').trim().toLowerCase();
  const idxNI = new Map(), idxCR = new Map(), idxItemNum = new Map(), descCount = new Map();

  itemsSol.forEach((it, i) => {
    const ni = norm(it.numero_interno);
    const cr = norm(it.codigo_referencial);
    const itn = (it.item != null) ? String(it.item) : '';
    const ds = norm(it.descripcion);
    if (ni) idxNI.set(ni, i);
    if (cr) idxCR.set(cr, i);
    if (itn) idxItemNum.set(itn, i);
    if (ds) descCount.set(ds, (descCount.get(ds) || 0) + 1);
  });

  const findIndex = (ocIt) => {
    const kNI = norm(ocIt.numero_interno);
    const kCR = norm(ocIt.codigo_referencial);
    const kIT = (ocIt.item != null) ? String(ocIt.item) : '';
    const kDS = norm(ocIt.descripcion);
    if (kNI && idxNI.has(kNI)) return idxNI.get(kNI);
    if (kCR && idxCR.has(kCR)) return idxCR.get(kCR);
    if (kIT && idxItemNum.has(kIT)) return idxItemNum.get(kIT);
    if (kDS && descCount.get(kDS) === 1) return itemsSol.findIndex(s2 => norm(s2.descripcion) === kDS);
    return -1;
  };

  ocItems.forEach(ocIt => {
    const idx = findIndex(ocIt);
    if (idx < 0) { dlog('SOLPED:update:no-match', { ocIt: s(ocIt) }); return; }

    const before = s(itemsSol[idx]);
    const sIt = { ...itemsSol[idx] };

    const cantSolic = Number(sIt.cantidad || 0);
    const ya = Number(sIt.cantidad_cotizada || 0);
    if (!sIt.cotPorOC || typeof sIt.cotPorOC !== 'object') sIt.cotPorOC = {};

    const totalEnOC = Number(ocIt.cantidad_cotizada || 0);
    const yaAportadoPorEstaOC = Number(sIt.cotPorOC[ocKey] || 0);

    let delta = totalEnOC - yaAportadoPorEstaOC;
    let nuevo = ya + delta;

    dlog('SOLPED:update:calc-beforeClamp', {
      matchIndex: idx, ocIt: s(ocIt), itemBefore: before,
      cantSolic, ya, totalEnOC, yaAportadoPorEstaOC, delta, nuevo
    });

    if (!isFinite(delta) || isNaN(delta) || delta <= 0) {
      dlog('SOLPED:update:skip-delta<=0', { idx, delta, totalEnOC, yaAportadoPorEstaOC });
      return;
    }

    if (nuevo > cantSolic) {
      delta -= (nuevo - cantSolic);
      nuevo = cantSolic;
      dlog('SOLPED:update:clamped', { idx, delta, nuevo, cantSolic });
      if (delta <= 0) return;
    }

    sIt.cotPorOC[ocKey] = yaAportadoPorEstaOC + delta;
    sIt.cantidad_cotizada = nuevo;

    itemsSol[idx] = sIt;
    huboAvance = true;

    dlog('SOLPED:update:item-after', { matchIndex: idx, itemAfter: s(itemsSol[idx]) });
  });

  let cambiosEstado = false;
  for (let i = 0; i < itemsSol.length; i++) {
    const it = itemsSol[i];
    const cant = Number(it.cantidad || 0);
    const cot  = Number(it.cantidad_cotizada || 0);
    const nuevoEstado = (cot >= cant && cant > 0) ? 'completado'
      : (cot > 0) ? 'parcial'
        : 'pendiente';
    if ((it.estado || '') !== nuevoEstado) {
      itemsSol[i] = { ...it, estado: nuevoEstado };
      cambiosEstado = true;
    }
  }

  const allFull = itemsSol.every(x => Number(x.cantidad_cotizada || 0) >= Number(x.cantidad || 0));
  const anyCot  = itemsSol.some(x => Number(x.cantidad_cotizada || 0) > 0);
  const nuevoEstatusSol = allFull ? 'Completado' : (anyCot ? 'Parcial' : 'Pendiente');

  dlog('SOLPED:update:huboAvance?', { huboAvance, cambiosEstado, nuevoEstatusSol });

  const debeActualizar = huboAvance || cambiosEstado || (String(sdata.estatus || '') !== String(nuevoEstatusSol));
  if (debeActualizar) {
    await updateDoc(sref, {
      items: itemsSol,
      estatus: nuevoEstatusSol,
      updated_at: new Date()
    });

    try {
      await addDoc(collection(sref, 'historialEstados'), {
        origen: 'Aprobación OC',
        usuario: aprobador || '—',
        estatus: nuevoEstatusSol,
        detalle: comentario || '',
        comentario: comentario || '',
        ocNumero: oc?.id ?? null,
        fecha: serverTimestamp()
      });
    } catch (e) {
      console.warn('No se pudo registrar historialEstados (operativo) de la SOLPED:', e);
    }
  }

  if (estatusOC) {
    await registrarHistorialSolpedAccionOC({
      solpedId,
      ocNumero: oc?.id,
      usuario: aprobador || '—',
      estatusOC,
      comentario: comentario || ''
    });
  }
};

const cerrarSolpedSiCompleta = async (solpedId) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, 'solpes', solpedId);
    const ss = await getDoc(sref);
    if (!ss.exists()) return;

    const data = ss.data() || {};
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return;

    const todosCompletos = items.every(it => Number(it.cantidad_cotizada || 0) >= Number(it.cantidad || 0));
    if (todosCompletos && (data.estatus || '').toLowerCase() !== 'completado') {
      await updateDoc(sref, { estatus: 'Completado' });
      addToast('success', 'SOLPED completada ✔');
    }
  } catch (e) {
    console.error('cerrarSolpedSiCompleta:', e);
  }
};

/* =========================================================
   Resolver siguiente estatus al aprobar (saltando steps sin gente)
   ========================================================= */
const computeNextStatusOnApprove = (steps, currentStatus, monto, actingUid) => {
  const idx0 = findStepIndexByStatus(steps, currentStatus);
  if (idx0 < 0) return 'Aprobado';

  const indexByStatus = new Map(steps.map((s, i) => [String(s?.inStatus || ''), i]));
  const visited = new Set();
  let idx = idx0;

  while (true) {
    const st = steps[idx];
    if (!st) return 'Aprobado';

    const max = Number(st.max ?? 0);
    const approveTo = String(st.approveTo || 'Aprobado').trim() || 'Aprobado';
    const overTo = String(st.overTo || '').trim();

    if (monto <= max) return approveTo;
    if (!overTo) return approveTo;

    const j = indexByStatus.get(overTo);
    if (j == null) return overTo;

    const av = availableApprovers(steps[j]).map(a => a.uid);
    const avSet = new Set(av);
    const nextHasApprovers = stepHasAvailableApprover(steps[j]);
    const onlyMeInNext = (avSet.size === 1 && avSet.has(actingUid));

    if (!nextHasApprovers || onlyMeInNext) {
      const key = `${j}`;
      if (visited.has(key)) return overTo;
      visited.add(key);
      idx = j;
      continue;
    }

    return overTo;
  }
};

/* =========================
   Acciones
   ========================= */
const accionando = ref(false);

const solicitarAclaracion = async (oc) => {
  if (accionando.value) return;
  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de solicitar aclaración.'); return; }
  if (!canActOnOC(oc)) { addToast('warning','No puedes solicitar aclaración en este estado.'); return; }

  accionando.value = true;
  try {
    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Pendiente de Aprobación', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Pendiente de Aprobación',
      historial: nuevoHistorial
    });

    await registrarHistorialSolpedAccionOC({
      solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
      estatusOC: 'Pendiente de Aprobación', comentario
    });

    addToast('warning', 'Solicitada aclaración: estado → Pendiente de Aprobación');
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo solicitar la aclaración.');
  } finally {
    accionando.value = false;
  }
};

const aprobar = async (oc) => {
  if (accionando.value) return;
  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de aprobar.'); return; }
  if (!canActOnOC(oc)) { addToast('warning','No puedes aprobar este estado.'); return; }

  accionando.value = true;
  try {
    const steps = getStepsForOC(oc);
    const monto = Number(oc.precioTotalConIVA || 0);

    const nuevoEstatus = computeNextStatusOnApprove(steps, oc.estatus, monto, userUid.value) || 'Aprobado';

    const nuevosItems = (oc.items || []).map((it) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'aprobado' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: nuevoEstatus, fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      items: nuevosItems,
      aprobadoPor: usuarioNombre.value || ''
    });

    if (String(nuevoEstatus).toLowerCase() === 'aprobado') {
      await actualizarSolpedConOC({ ...oc, items: nuevosItems }, usuarioNombre.value || '—', comentario, nuevoEstatus);
      await cerrarSolpedSiCompleta(oc.solpedId);
    } else {
      await registrarHistorialSolpedAccionOC({
        solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
        estatusOC: nuevoEstatus, comentario
      });
    }

    addToast('success', `OC → ${nuevoEstatus}`);
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo aprobar la OC.');
  } finally {
    accionando.value = false;
  }
};

const rechazar = async (oc) => {
  if (accionando.value) return;
  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de rechazar.'); return; }
  if (!canActOnOC(oc)) { addToast('warning','No puedes rechazar este estado.'); return; }

  accionando.value = true;
  try {
    const nuevosItems = (oc.items || []).map((it) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'pendiente' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Rechazado', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Rechazado',
      historial: nuevoHistorial,
      items: nuevosItems
    });

    await registrarHistorialSolpedAccionOC({
      solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
      estatusOC: 'Rechazado', comentario
    });

    addToast('danger', 'OC rechazada.');
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo rechazar la OC.');
  } finally {
    accionando.value = false;
  }
};

/* =========================
   Mount / Unmount
   ========================= */
onMounted(async () => {
  try {
    cargando.value = true;

    // usuario
    const uid = auth?.user?.uid || '';
    userUid.value = uid;

    let fullName = auth?.user?.displayName || auth?.user?.email || '';
    if (uid) {
      try {
        const us = await getDoc(doc(db, 'Usuarios', uid));
        if (us.exists()) {
          const d = us.data() || {};
          fullName = d.fullName || fullName;
        }
      } catch { /* ignore */ }
    }
    usuarioNombre.value = fullName || '';

    // empresas/steps
    unsubEmp = onSnapshot(query(empresasCol, orderBy('nombre')), (snap) => {
      const arr = [];
      snap.forEach(snapDoc => {
        const d = snapDoc.data() || {};
        arr.push({
          key: snapDoc.id,
          nombre: d.nombre || snapDoc.id,
          activo: d.activo !== false,
          steps: Array.isArray(d.steps) ? d.steps : []
        });
      });
      empresasCfg.value = arr;

      if (empresaFiltro.value !== 'TODAS' && !arr.some(e => e.key === empresaFiltro.value)) {
        empresaFiltro.value = 'TODAS';
      }
    });

    cargando.value = false;
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo inicializar la vista.');
    cargando.value = false;
  }
});

onBeforeUnmount(() => {
  unsubEmp?.();
  unsubsOCs.forEach(fn => fn?.());
  unsubsOCs = [];
});

watch(
  () => `${userUid.value}|${statusesWanted.value.slice().sort().join('|')}`,
  () => subscribeOCs(),
  { immediate: true }
);
</script>

<style scoped>
.aprob-oc-page{ min-height:100vh; }

/* Animación detalle */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Toasts */
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

/* Chips resumen */
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

/* Utilidades de corte y wrap */
.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.minw-0{ min-width: 0; }
.maxw-180{ max-width: 180px; }
.maxw-140{ max-width: 140px; }

/* Responsive */
@media (max-width: 576px){
  .oc-highlight{ padding: .55rem .6rem; }
  .oc-pill{ font-size: .86rem; }
  .list-group-item .btn{ width: 100%; }
}
@media (min-width: 768px) and (max-width: 991.98px){
  .maxw-180{ max-width: 240px; }
  .maxw-140{ max-width: 180px; }
}

/* Offcanvas móvil CUSTOM */
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

/* Autorizaciones responsive */
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

/* Visor Fullscreen */
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

/* PDF */
.viewer-pdf-wrap{ width: 100%; height: 100%; }
.viewer-pdf{ width: 100%; height: 100%; border: none; }

@media (max-width: 576px){
  .viewer-panel{
    width: 100vw; height: 100vh; border-radius: 0;
  }
  .viewer-title{ max-width: 50vw; }
}

/* cursor utilitario */
:root { --cur-ptr: pointer; }
</style>
