<!-- src/views/AprobacionDocs.vue -->
<template>
  <div class="container-fluid py-2 aprobacion-docs">

    <!-- Busy overlay -->
    <div v-if="busy.on" class="busy-overlay">
      <div class="busy-card shadow">
        <div class="d-flex align-items-center gap-3">
          <div class="spinner-border text-danger" role="status" aria-label="Cargando"></div>

          <div class="flex-grow-1">
            <div class="fw-semibold">{{ busy.label }}</div>
            <div class="text-muted small" v-if="busy.hint">{{ busy.hint }}</div>

            <div class="progress mt-2" style="height: 10px" v-if="busy.progress !== null">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                :style="{ width: busy.progress + '%' }"
              ></div>
            </div>
          </div>

          <div class="fw-semibold" v-if="busy.progress !== null">{{ busy.progress }}%</div>
        </div>
      </div>
    </div>

    <div v-if="noLotesNotice" class="alert alert-info d-flex align-items-center justify-content-between gap-2 mb-2">
      <div>
        <i class="bi bi-info-circle me-2"></i>{{ noLotesNotice }}
      </div>
      <button class="btn btn-sm btn-outline-dark" @click="dismissNoLotesNotice">OK</button>
    </div>

    <!-- Header compacto (para ganar pantalla) -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 topbar">
      <div class="min-w-0">
        <h4 class="mb-0">Aprobación Documental</h4>
        <small class="text-muted d-none d-md-inline">
          Selecciona un lote → revisa comparativas → aprueba o rechaza (con motivo).
        </small>
      </div>

      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select
          class="form-select"
          style="min-width: 320px"
          v-model="selectedLoteId"
          @change="onChangeLote"
          :disabled="!hasAnyActiveLote"
        >
          <option value="" disabled>Selecciona un lote…</option>
          <option v-for="l in lotesActivos" :key="l.id" :value="l.id">
            {{ l.nombre || ("Lote " + l.id.slice(0, 6)) }}
          </option>
        </select>

        <div class="d-flex gap-2 flex-wrap d-none d-md-flex">
          <span class="badge text-bg-dark">Pendientes: {{ pendientesFiltradas.length }}</span>
          <span class="badge text-bg-success">Aprobadas: {{ aprobadasFiltradas.length }}</span>
          <span class="badge text-bg-danger">Rechazadas: {{ rechazadasFiltradas.length }}</span>
        </div>

        <button
          type="button"
          class="btn btn-outline-dark btn-sm"
          @click="toggleSidebar"
          :disabled="!selectedLoteId"
        >
          <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'"></i>
          {{ showSidebar ? 'Ocultar comparativas' : 'Mostrar comparativas' }}
        </button>
      </div>
    </div>

    <div v-if="!hasAnyActiveLote" class="alert alert-warning mb-2">
      No hay lotes de docs pendientes para revisar.
    </div>

    <div v-else-if="!selectedLoteId" class="alert alert-warning mb-2">
      Selecciona un lote para ver sus comparativas pendientes.
    </div>

    <div v-else class="row g-2 align-items-stretch layout-row">
      <!-- Sidebar comparativas (más angosto) -->
      <div v-if="showSidebar" class="col-12 col-lg-2">
        <div class="card shadow-sm h-100 sidebar-card">
          <div class="card-header d-flex align-items-center justify-content-between py-2">
            <div class="fw-semibold d-flex align-items-center gap-2">
              Comparativas
              <span v-if="loadingData" class="badge text-bg-secondary">cargando…</span>
            </div>

            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-dark" :class="{active: listTab==='pendiente'}" @click="listTab='pendiente'">
                P
              </button>
              <button class="btn btn-outline-dark" :class="{active: listTab==='aprobado'}" @click="listTab='aprobado'">
                A
              </button>
              <button class="btn btn-outline-dark" :class="{active: listTab==='rechazado'}" @click="listTab='rechazado'">
                R
              </button>
            </div>
          </div>

          <div class="card-body p-2 d-flex flex-column">
            <div v-if="loadingData" class="p-2">
              <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm text-danger"></div>
                <div class="text-muted small">Cargando…</div>
              </div>
              <div class="progress mt-2" style="height: 10px">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" style="width: 100%"></div>
              </div>
            </div>

            <div v-else class="list-wrap flex-grow-1">
              <TransitionGroup name="fade-slide" tag="div" class="list-group">
                <button
                  v-for="c in currentList"
                  :key="c.id"
                  type="button"
                  class="list-group-item list-group-item-action py-2 px-2"
                  :class="{ active: selectedCmpId === c.id }"
                  @click="selectCmp(c.id)"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="me-1 min-w-0">
                      <div class="d-flex gap-1 flex-wrap align-items-center">
                        <span class="badge text-bg-primary">OC {{ ocNumero(c) || '—' }}</span>
                        <span class="badge" :class="estadoCmpBadge(c.estado)">
                          {{ (c.estado || 'pendiente').toUpperCase() }}
                        </span>
                        <span class="badge text-bg-warning" v-if="otherTipo(c)==='factura'">F</span>
                        <span class="badge text-bg-info" v-else>G</span>
                      </div>

                      <div class="fw-semibold mt-1 text-truncate" style="max-width: 100%;">
                        {{ ocNombreArchivo(c) || 'OC' }}
                      </div>

                      <small class="text-muted d-block text-truncate" style="max-width: 100%;">
                        ↔ {{ otherNombreArchivo(c) || 'Documento' }}
                      </small>
                    </div>

                    <div class="text-end small d-none d-lg-block">
                      <span class="badge text-bg-secondary" v-if="needsAttention(c)">!</span>
                    </div>
                  </div>
                </button>
              </TransitionGroup>

              <div v-if="currentList.length===0" class="text-muted text-center p-3">
                Sin items.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visor comparativo (casi pantalla completa) -->
      <div :class="showSidebar ? 'col-12 col-lg-10' : 'col-12'">
        <div class="card shadow-sm h-100 viewer-root">
          <div class="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between py-2">
            <div class="fw-semibold d-flex align-items-center gap-2 flex-wrap">
              Visor comparativo
              <span v-if="currentCmp" class="badge text-bg-primary">
                OC {{ currentOc?.numero || ocNumero(currentCmp) || '—' }}
              </span>
              <span v-if="currentCmp" class="badge" :class="estadoCmpBadge(currentCmp.estado)">
                {{ (currentCmp.estado || 'pendiente').toUpperCase() }}
              </span>
              <span
                v-if="currentCmp && (currentCmp.estado||'pendiente')==='pendiente'"
                class="badge text-bg-dark subtle-pulse"
              >
                listo
              </span>
            </div>

            <div class="d-flex gap-2 align-items-center flex-wrap">
              <div class="btn-group btn-group-sm" role="group" aria-label="Zoom">
                <button class="btn btn-outline-dark" @click="zoomOut" :disabled="zoom <= 0.6">
                  <i class="bi bi-dash-lg"></i>
                </button>
                <button class="btn btn-outline-dark" @click="resetZoom" title="Ajustar">
                  {{ Math.round(zoom * 100) }}%
                </button>
                <button class="btn btn-outline-dark" @click="zoomIn" :disabled="zoom >= 2.2">
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>

              <button class="btn btn-outline-secondary btn-sm" :disabled="!currentCmp" @click="swapSides">
                <i class="bi bi-arrow-left-right me-1"></i>Intercambiar
              </button>

              <button class="btn btn-danger btn-sm" :disabled="!canReject" @click="openRejectModal">
                <i class="bi bi-x-circle me-1"></i>Rechazar
              </button>

              <button class="btn btn-success btn-sm" :disabled="!canApprove" @click="approveOnly">
                <i class="bi bi-check2-circle me-1"></i>Aprobar
              </button>
            </div>
          </div>

          <!-- padding mínimo + altura máxima -->
          <div class="card-body p-1">
            <div v-if="!currentCmp" class="text-muted text-center py-5">
              Selecciona una comparativa para visualizar y aprobar/rechazar.
            </div>

            <template v-else>
              <Transition name="fade-fast">
                <div :key="currentCmp.id" class="cmp-block">
                  <div class="row g-1 mb-1">
                    <!-- LEFT -->
                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center gap-2">
                            <div class="fw-semibold small">{{ leftTitle }}</div>
                            <span v-if="leftTitle === 'OC' && currentCmp" class="badge text-bg-primary">
                              OC {{ currentOc?.numero || ocNumero(currentCmp) || '—' }}
                            </span>
                          </div>
                          <a v-if="leftUrl" class="btn btn-outline-dark btn-sm" :href="leftUrl" target="_blank" rel="noopener">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div
                          v-if="leftUrl"
                          class="viewer-frame viewer-scroll position-relative"
                          ref="leftScrollEl"
                          @scroll.passive="onViewerScroll('left')"
                          @pointerdown="onPanStart($event, 'left')"
                        >
                          <div v-if="leftLoading" class="viewer-loading">
                            <div class="text-center">
                              <div class="spinner-border text-danger" role="status"></div>
                              <div class="fw-semibold mt-2">Cargando {{ leftTitle }}…</div>
                              <div class="small text-muted" v-if="leftProgress !== null">{{ leftProgress }}%</div>
                            </div>
                          </div>

                          <div v-if="leftError" class="viewer-error">
                            <i class="bi bi-exclamation-triangle me-2"></i>{{ leftError }}
                          </div>

                          <img
                            v-if="leftIsImage"
                            :key="leftUrl"
                            :src="leftUrl"
                            class="viewer-img"
                            :style="{ width: Math.round(zoom * 100) + '%', height: 'auto' }"
                            loading="eager"
                            decoding="async"
                            alt="Documento"
                            @load="leftLoading=false; leftProgress=null; leftError=''"
                            @error="leftLoading=false; leftProgress=null; leftError='No se pudo cargar la imagen.'"
                          />

                          <div v-else ref="leftPdfHost" class="pdf-pages"></div>
                        </div>

                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>

                    <!-- RIGHT -->
                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center gap-2">
                            <div class="fw-semibold small">{{ rightTitle }}</div>
                            <span v-if="rightTitle !== 'OC' && otherDocRefOcText" class="badge text-bg-secondary">
                              Ref OC {{ otherDocRefOcText }}
                            </span>
                          </div>
                          <a v-if="rightUrl" class="btn btn-outline-dark btn-sm" :href="rightUrl" target="_blank" rel="noopener">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div
                          v-if="rightUrl"
                          class="viewer-frame viewer-scroll position-relative"
                          ref="rightScrollEl"
                          @scroll.passive="onViewerScroll('right')"
                          @pointerdown="onPanStart($event, 'right')"
                        >
                          <div v-if="rightLoading" class="viewer-loading">
                            <div class="text-center">
                              <div class="spinner-border text-danger" role="status"></div>
                              <div class="fw-semibold mt-2">Cargando {{ rightTitle }}…</div>
                              <div class="small text-muted" v-if="rightProgress !== null">{{ rightProgress }}%</div>
                            </div>
                          </div>

                          <div v-if="rightError" class="viewer-error">
                            <i class="bi bi-exclamation-triangle me-2"></i>{{ rightError }}
                          </div>

                          <img
                            v-if="rightIsImage"
                            :key="rightUrl"
                            :src="rightUrl"
                            class="viewer-img"
                            :style="{ width: Math.round(zoom * 100) + '%', height: 'auto' }"
                            loading="eager"
                            decoding="async"
                            alt="Documento"
                            @load="rightLoading=false; rightProgress=null; rightError=''"
                            @error="rightLoading=false; rightProgress=null; rightError='No se pudo cargar la imagen.'"
                          />

                          <div v-else ref="rightPdfHost" class="pdf-pages"></div>
                        </div>

                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>
                  </div>

                  <div v-if="needsAttention(currentCmp)" class="alert alert-warning mb-0 py-2">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Hay documentos sin URL/Storage. Revisa el lote (AdminGestionDocs) antes de firmar.
                  </div>
                </div>
              </Transition>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rechazo -->
    <div class="modal fade" ref="rejectModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rechazar</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Motivos de rechazo (selección múltiple)</label>
              <div class="small text-muted mb-2">Marca uno o más motivos.</div>

              <div class="d-flex flex-wrap gap-2 mb-2">
                <button type="button" class="btn btn-outline-dark btn-sm" @click="selectAllRejectReasons">
                  <i class="bi bi-check2-square me-1"></i>Seleccionar todo
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="clearRejectReasons">
                  <i class="bi bi-eraser me-1"></i>Limpiar
                </button>
              </div>

              <div class="reject-grid border rounded p-2">
                <label
                  v-for="r in rejectPresets"
                  :key="r"
                  class="form-check d-flex align-items-start gap-2 mb-2"
                >
                  <input class="form-check-input mt-1" type="checkbox" :value="r" v-model="rejectSelected" />
                  <span class="form-check-label">{{ r }}</span>
                </label>
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label fw-semibold">Motivo adicional (opcional)</label>
              <textarea
                v-model="rejectCustom"
                class="form-control"
                rows="3"
                placeholder="Escribe un motivo adicional si lo necesitas…"
              ></textarea>
            </div>

            <div class="alert alert-light border mt-3 mb-0" v-if="finalRejectReason.trim()">
              <div class="fw-semibold mb-1">Motivo:</div>
              <div class="small" style="white-space: pre-wrap;">{{ finalRejectReason }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" :disabled="!canReject || !finalRejectReason.trim()" @click="rejectComparison">
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import * as bootstrap from "bootstrap";

import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { useAuthStore } from "@/stores/authService";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const db = getFirestore();
const auth = useAuthStore();
const route = useRoute();

const actorName = computed(
  () =>
    auth?.profile?.Nombre_completo ||
    auth?.profile?.nombre ||
    auth?.user?.displayName ||
    auth?.user?.email ||
    "usuario"
);

const busy = ref({ on: false, label: "", hint: "", progress: null });
function setBusy(on, label = "", hint = "", progress = null) {
  busy.value = { on, label, hint, progress };
}

const noLotesNotice = ref("");
function dismissNoLotesNotice() { noLotesNotice.value = ""; }

const listTab = ref("pendiente");

const showSidebar = ref(false);
function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

const lotes = ref([]);
const selectedLoteId = ref("");

const docs = ref([]);
const cmps = ref([]);
const selectedCmpId = ref("");

let unsubLotes = null;
let unsubDocs = null;
let unsubCmps = null;

const loadingData = ref(false);
let docsReady = false;
let cmpsReady = false;
let autoMatchRunning = false;

const finishingLote = ref(false);

const rejectModalEl = ref(null);
let rejectModal = null;

const rejectPresets = [
  "Las cantidades no concuerdan",
  "El centro de costo está mal",
  "En la factura no sale la orden de compra",
  "La descripción de los productos no coincide",
  "El RUT del proveedor no coincide",
  "Aclaración requerida en la observación",
  "La condición de pago está mal",
];
const rejectSelected = ref([]);
const rejectCustom = ref("");

const finalRejectReason = computed(() => {
  const parts = [];
  if (Array.isArray(rejectSelected.value) && rejectSelected.value.length) {
    parts.push(rejectSelected.value.join("; "));
  }
  const extra = String(rejectCustom.value || "").trim();
  if (extra) parts.push(extra);
  return parts.join("\n");
});

const docsById = computed(() => {
  const m = new Map();
  for (const d of docs.value) m.set(d.id, d);
  return m;
});

function estadoCmpBadge(estado) {
  if (estado === "aprobado") return "text-bg-success";
  if (estado === "rechazado") return "text-bg-danger";
  return "text-bg-dark";
}

function normalizeText(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normEstado(s) {
  const v = normalizeText(String(s || ""));
  if (v === "en_revision" || v === "en revision" || v === "en-revision") return "en_revision";

  if (
    v === "revision_completada" ||
    v === "revision completada" ||
    v === "revision_completa" ||
    v === "revision completa" ||
    v === "revisión completa"
  ) {
    return "revision_completada";
  }

  return v || "";
}

function normCmpEstado(s) {
  const v = normalizeText(String(s || ""));
  if (!v) return "pendiente";
  if (v === "pendiente") return "pendiente";
  if (v === "aprobado") return "aprobado";
  if (v === "rechazado") return "rechazado";
  return v; // por si inventas otro estado
}

const lotesActivos = computed(() => {
  return lotes.value.filter((l) => normEstado(l.estado) !== "revision_completada");
});

const hasAnyActiveLote = computed(() => lotesActivos.value.length > 0);

function cmpOtherId(c) {
  return c?.otherId || c?.facturaId || c?.guiaId || "";
}
function otherTipo(c) {
  return c?.otherTipo || (c?.facturaId ? "factura" : c?.guiaId ? "guia" : "factura");
}
function ocNumero(c) {
  const oc = docsById.value.get(c?.ocId || "");
  return oc?.numero || "";
}
function ocNombreArchivo(c) {
  const oc = docsById.value.get(c?.ocId || "");
  return oc?.archivo?.name || "";
}
function otherNombreArchivo(c) {
  const od = docsById.value.get(cmpOtherId(c));
  return od?.archivo?.name || "";
}
function needsAttention(c) {
  const oc = docsById.value.get(c?.ocId || "");
  const od = docsById.value.get(cmpOtherId(c));
  return !oc || !od || !oc.archivo?.url || !od.archivo?.url;
}

const pendientesFiltradas = computed(() =>
  cmps.value.filter((c) => normCmpEstado(c.estado) === "pendiente")
);
const aprobadasFiltradas = computed(() =>
  cmps.value.filter((c) => normCmpEstado(c.estado) === "aprobado")
);
const rechazadasFiltradas = computed(() =>
  cmps.value.filter((c) => normCmpEstado(c.estado) === "rechazado")
);

let _finalizeTimer = 0;

function scheduleFinalizeCheck() {
  if (_finalizeTimer) clearTimeout(_finalizeTimer);
  _finalizeTimer = setTimeout(() => {
    completeCurrentLoteAndAdvance().catch((e) => console.error("finalize check error:", e));
  }, 250);
}


const currentList = computed(() => {
  if (listTab.value === "aprobado") return aprobadasFiltradas.value;
  if (listTab.value === "rechazado") return rechazadasFiltradas.value;
  return pendientesFiltradas.value;
});

const currentCmp = computed(
  () => cmps.value.find((x) => x.id === selectedCmpId.value) || null
);

const currentOc = computed(() => {
  const c = currentCmp.value;
  if (!c) return null;
  return docsById.value.get(c.ocId) || null;
});

const currentOther = computed(() => {
  const c = currentCmp.value;
  if (!c) return null;
  return docsById.value.get(cmpOtherId(c)) || null;
});

const otherDocRefOcText = computed(() => {
  const c  = currentCmp.value;
  const od = currentOther.value;
  const oc = currentOc.value;

  const fromCmp = c?.matchedRefOc || "";
  const ref   = od?.deteccion?.refOc || "";
  const cand0 = od?.deteccion?.ocCandidates?.[0]?.value || "";
  const raw = fromCmp || ref || cand0 || oc?.numero || "";

  return String(raw || "").trim();
});

const sideSwap = ref(false);
function swapSides() {
  sideSwap.value = !sideSwap.value;
}


function docViewUrl(d) {
  if (!d) return "";
  if (d.tipo === "oc") return d?.firmado?.url || d?.archivo?.url || "";
  return d?.archivo?.url || "";
}

const ocUrl = computed(() => docViewUrl(currentOc.value));
const otherUrl = computed(() => docViewUrl(currentOther.value));

const leftTitle = computed(() =>
  sideSwap.value
    ? otherTipo(currentCmp.value) === "factura"
      ? "Factura"
      : "Guía"
    : "OC"
);
const rightTitle = computed(() =>
  sideSwap.value ? "OC" : otherTipo(currentCmp.value) === "factura" ? "Factura" : "Guía"
);
const leftUrl = computed(() => (sideSwap.value ? otherUrl.value : ocUrl.value));
const rightUrl = computed(() => (sideSwap.value ? ocUrl.value : otherUrl.value));

function isImageUrl(url) {
  const base = String(url || "").toLowerCase().split("?")[0];
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(base);
}
function isImageDoc(d) {
  const ct = d?.archivo?.contentType || d?.archivo?.mimeType || d?.archivo?.type || "";
  if (ct && String(ct).startsWith("image/")) return true;

  const name = String(d?.archivo?.name || "").toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(name)) return true;

  const url = docViewUrl(d);
  return isImageUrl(url);
}

const leftDoc = computed(() => (sideSwap.value ? currentOther.value : currentOc.value));
const rightDoc = computed(() => (sideSwap.value ? currentOc.value : currentOther.value));

const leftIsImage = computed(() => isImageDoc(leftDoc.value));
const rightIsImage = computed(() => isImageDoc(rightDoc.value));

const canApprove = computed(() => {
  if (!currentCmp.value) return false;
  if ((currentCmp.value.estado || "pendiente") !== "pendiente") return false;

  const oc = currentOc.value;
  const other = currentOther.value;
  if (!oc || !other) return false;

  const hasOcFile = !!(oc?.archivo?.url || oc?.archivo?.storagePath || oc?.firmado?.url);
  if (!hasOcFile) return false;

  return true;
});

const canReject = computed(() => {
  if (!currentCmp.value) return false;
  return (currentCmp.value.estado || "pendiente") === "pendiente";
});

const zoom = ref(1.3);
const zoomIn = () => (zoom.value = Math.min(2.2, +(zoom.value + 0.15).toFixed(2)));
const zoomOut = () => (zoom.value = Math.max(0.6, +(zoom.value - 0.15).toFixed(2)));
const resetZoom = () => (zoom.value = 1);

const leftPdfHost = ref(null);
const rightPdfHost = ref(null);
const leftScrollEl = ref(null);
const rightScrollEl = ref(null);

const leftLoading = ref(false);
const rightLoading = ref(false);
const leftProgress = ref(null);
const rightProgress = ref(null);
const leftError = ref("");
const rightError = ref("");

let _leftRenderToken = 0;
let _rightRenderToken = 0;

let _syncLock = false;
let _rafSync = 0;
const pan = ref({
  active: false,
  from: "left",
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
  startScrollTop: 0,
  pointerId: null,
  moved: false,
});

function getPanEls(from) {
  const src = from === "left" ? leftScrollEl.value : rightScrollEl.value;
  const dst = from === "left" ? rightScrollEl.value : leftScrollEl.value;
  return { src, dst };
}

function onPanStart(ev, from) {
  const { src } = getPanEls(from);
  if (!src) return;

  // Solo mouse principal o touch/pen
  if (ev.pointerType === "mouse" && ev.button !== 0) return;

  // Evita iniciar drag cuando clickean botones/enlaces
  const tag = String(ev.target?.tagName || "").toLowerCase();
  if (tag === "a" || tag === "button" || tag === "input" || tag === "textarea") return;

  pan.value.active = true;
  pan.value.from = from;
  pan.value.startX = ev.clientX;
  pan.value.startY = ev.clientY;
  pan.value.startScrollLeft = src.scrollLeft;
  pan.value.startScrollTop = src.scrollTop;
  pan.value.pointerId = ev.pointerId;
  pan.value.moved = false;

  try {
    src.setPointerCapture(ev.pointerId);
  } catch (e) {console.log(e)}

  src.classList.add("is-panning");
  document.body.classList.add("no-select");

  window.addEventListener("pointermove", onPanMove, { passive: false });
  window.addEventListener("pointerup", onPanEnd, { passive: true });
  window.addEventListener("pointercancel", onPanEnd, { passive: true });
}

function onPanMove(ev) {
  if (!pan.value.active) return;

  const { src, dst } = getPanEls(pan.value.from);
  if (!src || !dst) return;

  ev.preventDefault?.();

  const dx = ev.clientX - pan.value.startX;
  const dy = ev.clientY - pan.value.startY;

  if (!pan.value.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
    pan.value.moved = true;
  }

  const nextLeft = pan.value.startScrollLeft - dx;
  const nextTop = pan.value.startScrollTop - dy;

  _syncLock = true;
  try {
    src.scrollLeft = nextLeft;
    src.scrollTop = nextTop;

    dst.scrollLeft = nextLeft;
    dst.scrollTop = nextTop;
  } finally {
    requestAnimationFrame(() => {
      _syncLock = false;
    });
  }
}

function onPanEnd() {
  if (!pan.value.active) return;

  const { src } = getPanEls(pan.value.from);
  if (src) src.classList.remove("is-panning");

  document.body.classList.remove("no-select");

  try {
    if (src && pan.value.pointerId != null) src.releasePointerCapture(pan.value.pointerId);
  } catch (e) {console.log(e)}

  pan.value.active = false;
  pan.value.pointerId = null;

  window.removeEventListener("pointermove", onPanMove);
  window.removeEventListener("pointerup", onPanEnd);
  window.removeEventListener("pointercancel", onPanEnd);
}


const pdfCache = new Map();

function clearPdfHost(host) {
  if (!host) return;
  host.innerHTML = "";
}
async function waitForHost(refEl, tokenOk, tries = 30) {
  for (let i = 0; i < tries; i++) {
    if (!tokenOk()) return null;
    await nextTick();
    await new Promise((r) => requestAnimationFrame(r));
    const el = refEl.value;
    if (el && el.clientWidth > 10) return el;
  }
  return null;
}

function getScrollRatios(el) {
  if (!el) return { rx: 0, ry: 0 };
  const maxY = Math.max(1, el.scrollHeight - el.clientHeight);
  const maxX = Math.max(1, el.scrollWidth - el.clientWidth);
  return {
    ry: el.scrollTop / maxY,
    rx: el.scrollLeft / maxX,
  };
}
function setScrollRatios(el, { rx, ry }) {
  if (!el) return;
  const maxY = Math.max(1, el.scrollHeight - el.clientHeight);
  const maxX = Math.max(1, el.scrollWidth - el.clientWidth);
  el.scrollTop = Math.round(ry * maxY);
  el.scrollLeft = Math.round(rx * maxX);
}

function onViewerScroll(from) {
  if (_syncLock) return;

  const src = from === "left" ? leftScrollEl.value : rightScrollEl.value;
  const dst = from === "left" ? rightScrollEl.value : leftScrollEl.value;
  if (!src || !dst) return;

  if (_rafSync) cancelAnimationFrame(_rafSync);
  _rafSync = requestAnimationFrame(() => {
    _syncLock = true;
    try {
      const ratios = getScrollRatios(src);
      setScrollRatios(dst, ratios);
    } finally {
      setTimeout(() => (_syncLock = false), 0);
    }
  });
}

function getDpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

async function getPdfDoc(url) {
  if (!pdfCache.has(url)) {
    const loadingTask = pdfjsLib.getDocument({
      url,
      disableAutoFetch: false,
      disableStream: false,
    });
    pdfCache.set(url, loadingTask.promise);
  }
  return pdfCache.get(url);
}

async function renderPdfInto({ hostEl, url, tokenOk, onProgress, fitZoom = 1 }) {
  if (!hostEl || !url) return;

  clearPdfHost(hostEl);

  const containerW =
    hostEl.clientWidth ||
    hostEl.parentElement?.clientWidth ||
    820;

  const dpr = getDpr();
  const pdf = await getPdfDoc(url);
  const total = pdf.numPages || 1;

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    if (!tokenOk()) return;

    const page = await pdf.getPage(pageNum);

    const v0 = page.getViewport({ scale: 1 });
    const fit = Math.max((containerW - 16) / v0.width, 0.5);
    const scale = fit * fitZoom;

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);

    const ctx = canvas.getContext("2d", { alpha: false });

    hostEl.appendChild(canvas);

    const renderCtx = {
      canvasContext: ctx,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    };

    await page.render(renderCtx).promise;

    if (onProgress) {
      const pct = Math.round((pageNum / total) * 100);
      onProgress(pct);
    }

    await new Promise((r) => requestAnimationFrame(r));
  }
}

watch([leftUrl, leftIsImage, zoom, () => currentCmp.value?.id], async () => {
  leftError.value = "";
  leftProgress.value = null;
  _leftRenderToken++;

  const url = leftUrl.value;

  leftLoading.value = !!url;
  clearPdfHost(leftPdfHost.value);

  if (!url) {
    leftLoading.value = false;
    return;
  }

  await nextTick();
  if (leftScrollEl.value) {
    leftScrollEl.value.scrollTop = 0;
    leftScrollEl.value.scrollLeft = 0;
  }

  if (leftIsImage.value) return;

  const token = _leftRenderToken;
  const tokenOk = () => _leftRenderToken === token;

  try {
    const host = await waitForHost(leftPdfHost, tokenOk);
    if (!host) {
      if (tokenOk()) {
        leftLoading.value = false;
        leftError.value = "No se pudo montar el visor a tiempo (DOM).";
      }
      return;
    }

    await renderPdfInto({
      hostEl: host,
      url,
      tokenOk,
      fitZoom: zoom.value,
      onProgress: (p) => (leftProgress.value = p),
    });

    if (tokenOk()) {
      leftLoading.value = false;
      leftProgress.value = null;
    }
  } catch (e) {
    console.warn("PDF left render error:", e);

    pdfCache.delete(url);

    if (tokenOk()) {
      leftLoading.value = false;
      leftProgress.value = null;
      leftError.value = "No se pudo renderizar el PDF. Usa (↗) para abrirlo.";
      clearPdfHost(leftPdfHost.value);
    }
  }
});


watch([rightUrl, rightIsImage, zoom, () => currentCmp.value?.id], async () => {
  rightError.value = "";
  rightProgress.value = null;
  _rightRenderToken++;

  const url = rightUrl.value;

  rightLoading.value = !!url;
  clearPdfHost(rightPdfHost.value);

  if (!url) {
    rightLoading.value = false;
    return;
  }

  await nextTick();
  if (rightScrollEl.value) {
    rightScrollEl.value.scrollTop = 0;
    rightScrollEl.value.scrollLeft = 0;
  }

  if (rightIsImage.value) return;

  const token = _rightRenderToken;
  const tokenOk = () => _rightRenderToken === token;

  try {
    const host = await waitForHost(rightPdfHost, tokenOk);
    if (!host) {
      if (tokenOk()) {
        rightLoading.value = false;
        rightError.value = "No se pudo montar el visor a tiempo (DOM).";
      }
      return;
    }

    await renderPdfInto({
      hostEl: host,
      url,
      tokenOk,
      fitZoom: zoom.value,
      onProgress: (p) => (rightProgress.value = p),
    });

    if (tokenOk()) {
      rightLoading.value = false;
      rightProgress.value = null;
    }
  } catch (e) {
    console.warn("PDF right render error:", e);
    pdfCache.delete(url);

    if (tokenOk()) {
      rightLoading.value = false;
      rightProgress.value = null;
      rightError.value = "No se pudo renderizar el PDF. Usa (↗) para abrirlo.";
      clearPdfHost(rightPdfHost.value);
    }
  }
});


onMounted(() => {
  rejectModal = new bootstrap.Modal(rejectModalEl.value);

  unsubLotes = onSnapshot(
    query(collection(db, "lotes_docs"), orderBy("createdAt", "desc")),
    (snap) => {
      lotes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (!selectedLoteId.value) {
        const routeLote = route?.params?.loteId ? String(route.params.loteId) : "";
        const fallback = routeLote || lotesActivos.value[0]?.id || "";
        selectedLoteId.value = fallback;

        if (selectedLoteId.value) onChangeLote();
      } else {
        const cur = lotes.value.find((l) => l.id === selectedLoteId.value);
        if (cur && normEstado(cur.estado) === "revision_completada") {
          switchToNextActiveLoteOrNotice("El lote actual ya fue marcado como revisión completada.");
        }
      }
    }
  );
});

onBeforeUnmount(() => {
  if (unsubLotes) unsubLotes();
  if (unsubDocs) unsubDocs();
  if (unsubCmps) unsubCmps();
  if (_rafSync) cancelAnimationFrame(_rafSync);
  clearPdfHost(leftPdfHost.value);
  clearPdfHost(rightPdfHost.value);
  window.removeEventListener("pointermove", onPanMove);
  window.removeEventListener("pointerup", onPanEnd);
  window.removeEventListener("pointercancel", onPanEnd);
  document.body.classList.remove("no-select");

});

function onChangeLote() {
  if (!selectedLoteId.value) return;

  docs.value = [];
  cmps.value = [];
  selectedCmpId.value = "";
  listTab.value = "pendiente";

  docsReady = false;
  cmpsReady = false;
  loadingData.value = true;

  if (unsubDocs) unsubDocs();
  if (unsubCmps) unsubCmps();

  unsubDocs = onSnapshot(
    query(
      collection(db, "lotes_docs", selectedLoteId.value, "docs"),
      orderBy("createdAt", "desc")
    ),
    (snap) => {
      docs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docsReady = true;
      loadingData.value = !(docsReady && cmpsReady);

      maybeAutoMatch();
      autoPickIfNone();
    }
  );

  unsubCmps = onSnapshot(
    query(
      collection(db, "lotes_docs", selectedLoteId.value, "comparaciones"),
      orderBy("updatedAt", "desc")
    ),
    (snap) => {
      cmps.value = snap.docs.map((d) => {
        const data = d.data();
        const updatedAtText = data?.updatedAt?.toDate
          ? data.updatedAt.toDate().toLocaleString()
          : "";
        return { id: d.id, ...data, updatedAtText };
      });
      cmpsReady = true;
      loadingData.value = !(docsReady && cmpsReady);

      maybeAutoMatch();
      autoPickIfNone();
    }
  );
}

function autoPickIfNone() {
  if (selectedCmpId.value) return;
  const first = pendientesFiltradas.value[0];
  if (first) selectedCmpId.value = first.id;
}

function selectCmp(id) {
  selectedCmpId.value = id;
}

function normNumber(n) {
  return (n || "").toString().replace(/[^\d]/g, "").trim();
}

function buildOcIndex() {
  const map = new Map();

  for (const d of docs.value) {
    if (d.tipo !== "oc") continue;
    if ((d.estado || "pendiente") !== "pendiente") continue;

    const values = new Set();

    const n1 = normNumber(d.numero);
    if (n1) values.add(n1);

    const ref = normNumber(d?.deteccion?.refOc);
    if (ref) values.add(ref);

    const candidates = Array.isArray(d?.deteccion?.ocCandidates)
      ? d.deteccion.ocCandidates
      : [];
    for (const c of candidates) {
      const v = normNumber(c?.value);
      if (v) values.add(v);
    }

    for (const v of values) {
      if (!map.has(v)) map.set(v, d);
    }
  }

  return map;
}

function buildUsedSets() {
  const usedOther = new Set();
  for (const c of cmps.value) {
    const oid = cmpOtherId(c);
    if (oid) usedOther.add(oid);
  }
  return { usedOther };
}

function numbersForOther(doc) {
  const nums = [];

  const ref = normNumber(doc?.deteccion?.refOc);
  if (ref) nums.push(ref);

  const candidates = Array.isArray(doc?.deteccion?.ocCandidates)
    ? doc.deteccion.ocCandidates
    : [];
  for (const c of candidates) {
    const v = normNumber(c?.value);
    if (v && !nums.includes(v)) nums.push(v);
  }

  const selfNum = normNumber(doc.numero);
  if (selfNum && !nums.includes(selfNum)) nums.push(selfNum);

  return nums;
}

async function autoMatchComparisons() {
  if (!selectedLoteId.value) return;
  if (!docs.value.length) return;

  const ocIndex = buildOcIndex();
  const { usedOther } = buildUsedSets();

  const nuevosPairs = [];

  for (const d of docs.value) {
    if (d.tipo !== "factura" && d.tipo !== "guia") continue;
    if ((d.estado || "pendiente") !== "pendiente") continue;
    if (usedOther.has(d.id)) continue;

    const nums = numbersForOther(d);
    if (!nums.length) continue;

    let chosenOc = null;
    let matchedValue = "";

    for (const n of nums) {
      const oc = ocIndex.get(n);
      if (oc && (oc.estado || "pendiente") !== "pendiente") continue;
      if (oc) {
        chosenOc = oc;
        matchedValue = n;
        break;
      }
    }

    if (!chosenOc) continue;

    const exists = cmps.value.some(
      (c) => c.ocId === chosenOc.id && cmpOtherId(c) === d.id
    );
    if (exists) continue;

    nuevosPairs.push({ oc: chosenOc, other: d, matchedValue });
    usedOther.add(d.id);
  }

  for (const pair of nuevosPairs) {
    await addDoc(
      collection(db, "lotes_docs", selectedLoteId.value, "comparaciones"),
      {
        ocId: pair.oc.id,
        otherId: pair.other.id,
        otherTipo: pair.other.tipo || "factura",
        estado: "pendiente",
        comentario: "",
        autoMatched: true,
        matchedRefOc: pair.matchedValue || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );
  }
}

function maybeAutoMatch() {
  if (!selectedLoteId.value) return;
  if (!docsReady || !cmpsReady) return;
  if (autoMatchRunning) return;

  autoMatchRunning = true;
  autoMatchComparisons()
    .catch((e) => console.error("Error autoMatchComparisons:", e))
    .finally(() => {
      autoMatchRunning = false;
    });
}

function selectAllRejectReasons() {
  rejectSelected.value = [...rejectPresets];
}
function clearRejectReasons() {
  rejectSelected.value = [];
  rejectCustom.value = "";
}

function openRejectModal() {
  rejectSelected.value = [];
  rejectCustom.value = "";
  rejectModal.show();
}

async function approveOnly() {
  if (!canApprove.value) return;

  const cmp = currentCmp.value;
  const oc = currentOc.value;
  const other = currentOther.value;

  try {
    setBusy(true, "Aprobando…", "Marcando estados en Firestore", 35);

    await updateDoc(
      doc(db, "lotes_docs", selectedLoteId.value, "comparaciones", cmp.id),
      {
        estado: "aprobado",
        comentario: (cmp?.comentario || "").toString(),
        aprobado: { at: serverTimestamp(), by: actorName.value },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );

    if (oc?.id) {
      await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id), {
        estado: "aprobado",
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });
    }
    if (other?.id) {
      await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", other.id), {
        estado: "aprobado",
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });
    }

    setBusy(true, "Listo ✅", "Avanzando a la siguiente pendiente…", 100);
    animateAdvance(cmp.id);
    scheduleFinalizeCheck();
  } catch (err) {
    console.error(err);
    alert("Error aprobando: " + (err?.message || String(err)));
  } finally {
    setTimeout(() => setBusy(false), 350);
  }
}

async function rejectComparison() {
  if (!canReject.value || !finalRejectReason.value.trim()) return;

  const cmp = currentCmp.value;
  const oc = currentOc.value;
  const other = currentOther.value;

  rejectModal.hide();

  const motivo = finalRejectReason.value.trim();

  try {
    setBusy(true, "Rechazando…", "Guardando motivo y actualizando estados", 15);

    await updateDoc(
      doc(db, "lotes_docs", selectedLoteId.value, "comparaciones", cmp.id),
      {
        estado: "rechazado",
        comentario: motivo,
        rechazado: {
          at: serverTimestamp(),
          by: actorName.value,
          motivo: motivo,
        },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );

    if (other?.id) {
      await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", other.id), {
        estado: "rechazado",
        rechazo: { motivo, at: serverTimestamp(), by: actorName.value },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });
    }
    if (oc?.id) {
      await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id), {
        estado: "rechazado",
        rechazo: { motivo, at: serverTimestamp(), by: actorName.value },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });
    }

    setBusy(true, "Listo ✅", "Avanzando a la siguiente pendiente…", 100);
    animateAdvance(cmp.id);
    scheduleFinalizeCheck();
  } catch (err) {
    console.error(err);
    alert("Error rechazando: " + (err?.message || String(err)));
  } finally {
    setTimeout(() => setBusy(false), 350);
  }
}

function animateAdvance(currentId) {
  const list = pendientesFiltradas.value;
  if (!list.length) {
    selectedCmpId.value = "";
    listTab.value = "pendiente";
    return;
  }

  const idx = list.findIndex((x) => x.id === currentId);
  if (idx >= 0) {
    for (let step = 1; step <= list.length; step++) {
      const cand = list[(idx + step) % list.length];
      if (cand && cand.id !== currentId) {
        selectedCmpId.value = cand.id;
        return;
      }
    }
  }

  const first = list.find((x) => x.id !== currentId) || null;
  selectedCmpId.value = first ? first.id : "";
  if (!first) listTab.value = "pendiente";
}

watch(
  () => [selectedLoteId.value, loadingData.value, autoMatchRunning, pendientesFiltradas.value.length],
  ([loteId, isLoading, isAutoMatching, pendingCount]) => {
    if (!loteId) return;
    if (isLoading) return;
    if (isAutoMatching) return;
    if (finishingLote.value) return;

    if (pendingCount === 0) {
      scheduleFinalizeCheck();
    }
  }
);


async function completeCurrentLoteAndAdvance() {
  const loteId = selectedLoteId.value;
  if (!loteId) return;

  if (finishingLote.value) return;
  finishingLote.value = true;

  try {
    setBusy(true, "Finalizando lote…", "Verificando que no queden pendientes", 10);

    // ✅ Trae todas las comparaciones del lote y verifica en JS
    const snap = await getDocs(collection(db, "lotes_docs", loteId, "comparaciones"));

    const stillPending = snap.docs.some((d) => {
      const data = d.data() || {};
      return normCmpEstado(data.estado) === "pendiente";
    });

    if (stillPending) return;

    setBusy(true, "Finalizando lote…", "Marcando estado del lote", 55);

    await updateDoc(doc(db, "lotes_docs", loteId), {
      estado: "revision_completada",
      revisionCompletaAt: serverTimestamp(),
      revisionCompletaBy: actorName.value,
      updatedAt: serverTimestamp(),
      updatedBy: actorName.value,
    });

    setBusy(true, "Finalizando lote…", "Buscando siguiente lote", 85);
    await switchToNextActiveLoteOrNotice("✅ Lote finalizado: Revisión completa.");
  } catch (e) {
    console.error("Error completando lote:", e);
    noLotesNotice.value = "No se pudo marcar el lote como Revisión completa. Revisa consola.";
  } finally {
    setTimeout(() => setBusy(false), 350);
    finishingLote.value = false;
  }
}

async function switchToNextActiveLoteOrNotice(messageWhenSwitch) {
  const curId = selectedLoteId.value;
  const next = lotesActivos.value.find((l) => l.id !== curId) || null;

  if (next?.id) {
    noLotesNotice.value = messageWhenSwitch || "";
    selectedLoteId.value = next.id;
    onChangeLote();
    return;
  }

  selectedLoteId.value = "";
  docs.value = [];
  cmps.value = [];
  selectedCmpId.value = "";
  listTab.value = "pendiente";

  noLotesNotice.value = "No hay lotes de docs pendientes para revisar.";
}
</script>

<style scoped>
.aprobacion-docs{
  min-height: 100vh;
}
.viewer-scroll {
  cursor: grab;
}
.viewer-scroll.is-panning {
  cursor: grabbing;
}

/* Evita selección de texto durante drag (global) */
:global(body.no-select) {
  user-select: none !important;
}

.topbar h4 { font-size: 1.15rem; }

.sidebar-card .list-wrap{
  max-height: calc(100vh - 160px);
  overflow: auto;
}

.viewer-root{
  height: calc(100vh - 110px);
}

.viewer-card { background: #fff; overflow: hidden; }
.viewer-top {
  padding: .45rem .6rem;
  border-bottom: 1px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.02);
}

.viewer-frame {
  width: 100%;
  height: calc(100vh - 185px);
  max-height: calc(100vh - 185px);
  background: #111;
}
.viewer-scroll{
  overflow: auto;
  overscroll-behavior: contain;
}

.viewer-loading{
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.92);
  z-index: 5;
}

.viewer-error{
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  z-index: 6;
  background: rgba(220,53,69,.12);
  border: 1px solid rgba(220,53,69,.25);
  color: #7a0b16;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
}

.pdf-pages{
  padding: 8px 8px 18px;
  background: #111;
  min-width: 100%;
}
.pdf-pages canvas{
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto 12px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,.15);
}

.viewer-img{
  display: block;
  margin: 0 auto;
  background: #111;
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all .18s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }

.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity .14s ease, transform .14s ease; }
.fade-fast-enter-from { opacity: 0; transform: translateY(6px); }
.fade-fast-leave-to { opacity: 0; transform: translateY(-6px); }

.subtle-pulse {
  animation: pulse 1.6s ease-in-out infinite;
  opacity: .9;
}
@keyframes pulse {
  0%,100% { transform: translateY(0); opacity: .85; }
  50% { transform: translateY(-1px); opacity: 1; }
}

.busy-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.38);
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 16px;
}
.busy-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  width: min(700px, 96vw);
  border: 1px solid rgba(0,0,0,.08);
}

@media (max-width: 768px) {
  .viewer-root{ height: auto; }
  .viewer-frame {
    height: 62vh;
    max-height: 62vh;
  }
}

.reject-grid{
  max-height: 220px;
  overflow: auto;
  background: rgba(0,0,0,.02);
}
</style>
