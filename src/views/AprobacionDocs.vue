<!-- src/views/AprobacionDocs.vue -->
<template>
  <div class="container-fluid py-3">

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

    <div v-if="noLotesNotice" class="alert alert-info d-flex align-items-center justify-content-between gap-2">
      <div>
        <i class="bi bi-info-circle me-2"></i>{{ noLotesNotice }}
      </div>
      <button class="btn btn-sm btn-outline-dark" @click="dismissNoLotesNotice">OK</button>
    </div>

    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0">Aprobación Documental</h4>
        <small class="text-muted">
          Selecciona un lote → revisa comparativas → aprueba (firma OC) o rechaza (motivo).
        </small>
      </div>

      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select class="form-select" style="min-width: 320px" v-model="selectedLoteId" @change="onChangeLote" :disabled="!hasAnyActiveLote">
          <option value="" disabled>Selecciona un lote…</option>
          <option v-for="l in lotesActivos" :key="l.id" :value="l.id">
            {{ l.nombre || ("Lote " + l.id.slice(0, 6)) }}
          </option>
        </select>

        <div class="d-flex gap-2 flex-wrap">
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

    <div v-if="!hasAnyActiveLote" class="alert alert-warning">
      No hay lotes de docs pendientes para revisar.
    </div>

    <div v-else-if="!selectedLoteId" class="alert alert-warning">
      Selecciona un lote para ver sus comparativas pendientes y aprobar con firma.
    </div>

    <div v-else class="row g-3 align-items-stretch">
      <div v-if="showSidebar" class="col-12 col-lg-4">
        <div class="card shadow-sm h-100">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold d-flex align-items-center gap-2">
              Comparativas del lote
              <span v-if="loadingData" class="badge text-bg-secondary">cargando…</span>
            </div>

            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-dark" :class="{active: listTab==='pendiente'}" @click="listTab='pendiente'">
                Pendientes
              </button>
              <button class="btn btn-outline-dark" :class="{active: listTab==='aprobado'}" @click="listTab='aprobado'">
                Aprobadas
              </button>
              <button class="btn btn-outline-dark" :class="{active: listTab==='rechazado'}" @click="listTab='rechazado'">
                Rechazadas
              </button>
            </div>
          </div>

          <div class="card-body p-2 d-flex flex-column" style="height: 100%;">
            <div v-if="loadingData" class="p-3">
              <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm text-danger"></div>
                <div class="text-muted small">Cargando documentos y comparaciones…</div>
              </div>
              <div class="progress mt-3" style="height: 10px">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" style="width: 100%"></div>
              </div>
            </div>

            <div v-else class="list-wrap flex-grow-1">
              <TransitionGroup name="fade-slide" tag="div" class="list-group">
                <button
                  v-for="c in currentList"
                  :key="c.id"
                  type="button"
                  class="list-group-item list-group-item-action"
                  :class="{ active: selectedCmpId === c.id }"
                  @click="selectCmp(c.id)"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="me-2">
                      <div class="d-flex gap-2 flex-wrap align-items-center">
                        <span class="badge text-bg-primary">OC {{ ocNumero(c) || '—' }}</span>
                        <span class="badge" :class="estadoCmpBadge(c.estado)">
                          {{ (c.estado || 'pendiente').toUpperCase() }}
                        </span>
                        <span class="badge text-bg-warning" v-if="otherTipo(c)==='factura'">FACTURA</span>
                        <span class="badge text-bg-info" v-else>GUÍA</span>
                      </div>

                      <div class="fw-semibold mt-1 text-truncate" style="max-width: 320px;">
                        {{ ocNombreArchivo(c) || 'OC' }}
                      </div>

                      <small class="text-muted d-block text-truncate" style="max-width: 320px;">
                        ↔ {{ otherNombreArchivo(c) || 'Documento' }}
                      </small>

                      <small class="text-muted" v-if="c.comentario">
                        <i class="bi bi-chat-left-text me-1"></i>{{ c.comentario }}
                      </small>
                    </div>

                    <div class="text-end small">
                      <div class="text-muted" v-if="c.updatedAtText">{{ c.updatedAtText }}</div>
                      <div class="text-muted" v-else>&nbsp;</div>
                      <span class="badge text-bg-secondary" v-if="needsAttention(c)">revisar</span>
                    </div>
                  </div>
                </button>
              </TransitionGroup>

              <div v-if="currentList.length===0" class="text-muted text-center p-4">
                No hay comparativas en este estado.
              </div>
            </div>

            <div class="card shadow-sm mt-3">
              <div class="card-header fw-semibold">Firma (obligatoria para aprobar OC)</div>
              <div class="card-body">
                <input type="file" accept="image/*" class="form-control" @change="onPickSignature" />
                <div v-if="signaturePreview" class="mt-2">
                  <div class="small text-muted mb-1">Vista previa:</div>
                  <img :src="signaturePreview" class="img-fluid rounded border" />
                  <button class="btn btn-outline-secondary btn-sm mt-2" @click="clearSignature">
                    <i class="bi bi-x-lg me-1"></i>Quitar firma
                  </button>
                </div>
                <div class="small text-muted mt-2">
                  Al aprobar: se firma la OC, se sube a Storage y se actualizan estados.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div :class="showSidebar ? 'col-12 col-lg-8' : 'col-12'">
        <div class="card shadow-sm h-100">
          <div class="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
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
                listo para aprobar/rechazar
              </span>
            </div>

            <div class="d-flex gap-2 align-items-center">
              <button class="btn btn-outline-secondary btn-sm" :disabled="!currentCmp" @click="swapSides">
                <i class="bi bi-arrow-left-right me-1"></i>Intercambiar
              </button>

              <button class="btn btn-danger btn-sm" :disabled="!canReject" @click="openRejectModal">
                <i class="bi bi-x-circle me-1"></i>Rechazar
              </button>

              <button class="btn btn-success btn-sm" :disabled="!canApprove" @click="approveAndSign">
                <i class="bi bi-check2-circle me-1"></i>Aprobar
              </button>
            </div>
          </div>

          <div class="card-body">
            <div v-if="!currentCmp" class="text-muted text-center py-5">
              Selecciona una comparativa para visualizar y aprobar/rechazar.
            </div>

            <template v-else>
              <Transition name="fade-fast" mode="out-in">
                <div :key="currentCmp.id" class="cmp-block">
                <div class="row g-2 mb-3">
                  <div class="row g-2">
                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center gap-2">
                            <div class="fw-semibold small">{{ leftTitle }}</div>
                            <span
                              v-if="leftTitle === 'OC' && currentCmp"
                              class="badge text-bg-primary"
                            >
                              OC {{ currentOc?.numero || ocNumero(currentCmp) || '—' }}
                            </span>
                          </div>
                          <a v-if="leftUrl" class="btn btn-outline-dark btn-sm" :href="leftUrl" target="_blank">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div v-if="leftUrl" class="viewer-frame">
                          <img
                            v-if="leftIsImage"
                            :src="leftUrl"
                            class="viewer-img"
                            loading="lazy"
                            decoding="async"
                            alt="Documento"
                          />
                          <iframe
                            v-else
                            :key="leftUrl"
                            :src="leftUrl"
                            loading="lazy"
                            style="border:0; width:100%; height:100%"
                          ></iframe>
                        </div>
                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center gap-2">
                            <div class="fw-semibold small">{{ rightTitle }}</div>
                            <span
                              v-if="rightTitle !== 'OC' && otherDocRefOcText"
                              class="badge text-bg-secondary"
                            >
                              Ref OC {{ otherDocRefOcText }}
                            </span>
                          </div>
                          <a v-if="rightUrl" class="btn btn-outline-dark btn-sm" :href="rightUrl" target="_blank">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div v-if="rightUrl" class="viewer-frame">
                          <img
                            v-if="rightIsImage"
                            :src="rightUrl"
                            class="viewer-img"
                            loading="lazy"
                            decoding="async"
                            alt="Documento"
                          />
                          <iframe
                            v-else
                            :key="rightUrl"
                            :src="rightUrl"
                            loading="lazy"
                            style="border:0; width:100%; height:100%"
                          ></iframe>
                        </div>
                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </Transition>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="rejectModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rechazar</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">Motivos de rechazo (selección múltiple)</label>
              <div class="small text-muted mb-2">
                Marca uno o más motivos.
              </div>

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
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import * as bootstrap from "bootstrap";
import { PDFDocument } from "pdf-lib";

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
  where,
  limit,
} from "firebase/firestore";
import {
  getStorage,
  ref as sRef,
  uploadBytesResumable,
  getDownloadURL,
  getBytes,
} from "firebase/storage";
import { useAuthStore } from "@/stores/authService";
import firmaAlejandro from "@/assets/firma-alejandro.png";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";
GlobalWorkerOptions.workerSrc = pdfWorker;

const db = getFirestore();
const storage = getStorage();
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

const signatureFile = ref(null);
const signaturePreview = ref("");

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
  if (v === "revision completa" || v === "revisión completa" || v === "revision_completa") return "revision_completa";
  return v || "";
}

const lotesActivos = computed(() => {
  return lotes.value.filter((l) => normEstado(l.estado) !== "revision_completa");
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
  cmps.value.filter((c) => (c.estado || "pendiente") === "pendiente")
);
const aprobadasFiltradas = computed(() =>
  cmps.value.filter((c) => c.estado === "aprobado")
);
const rechazadasFiltradas = computed(() =>
  cmps.value.filter((c) => c.estado === "rechazado")
);

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
  const hasOriginal = !!oc?.archivo;
  const hasSigned = !!oc?.firmado?.url;
  if (!hasOriginal && !hasSigned) return false;

  if (!hasSigned && !signatureFile.value) return false;

  return true;
});

const canReject = computed(() => {
  if (!currentCmp.value) return false;
  return (currentCmp.value.estado || "pendiente") === "pendiente";
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
        else noLotesNotice.value = "No hay lotes de docs pendientes para revisar.";
      } else {
        const cur = lotes.value.find((l) => l.id === selectedLoteId.value);
        if (cur && normEstado(cur.estado) === "revision_completa") {
          switchToNextActiveLoteOrNotice("El lote actual ya fue marcado como revisión completa.");
        }
      }
    }
  );

  preloadDefaultSignature();
});

onBeforeUnmount(() => {
  if (unsubLotes) unsubLotes();
  if (unsubDocs) unsubDocs();
  if (unsubCmps) unsubCmps();
  if (signaturePreview.value) URL.revokeObjectURL(signaturePreview.value);
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

  if (nuevosPairs.length) {
    console.log(
      `AutoMatch: creadas ${nuevosPairs.length} comparaciones en lote ${selectedLoteId.value}`
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

function onPickSignature(e) {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (!f) return;

  if (signaturePreview.value) URL.revokeObjectURL(signaturePreview.value);
  signatureFile.value = f;
  signaturePreview.value = URL.createObjectURL(f);
}

function clearSignature() {
  if (signaturePreview.value) URL.revokeObjectURL(signaturePreview.value);
  signaturePreview.value = "";
  signatureFile.value = null;
}

async function preloadDefaultSignature() {
  try {
    const resp = await fetch(firmaAlejandro);
    if (!resp.ok) {
      console.warn("No se pudo cargar firma por defecto, HTTP", resp.status);
      return;
    }
    const blob = await resp.blob();

    const file = new File([blob], "firma-alejandro.png", {
      type: blob.type || "image/png",
    });

    if (signaturePreview.value) {
      URL.revokeObjectURL(signaturePreview.value);
    }

    signatureFile.value = file;
    signaturePreview.value = URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error precargando firma por defecto:", e);
  }
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


function uploadDataToStorage(data, path, onProgress) {
  return new Promise((resolve, reject) => {
    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, data);
    task.on(
      "state_changed",
      (snap) => {
        if (!onProgress) return;
        const pct = snap.totalBytes
          ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          : 0;
        onProgress(pct);
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

async function loadPdfBytesFromStorageFile(archivo) {
  if (!archivo) throw new Error("OC sin archivo");

  if (archivo.storagePath) {
    const r = sRef(storage, archivo.storagePath);
    const u8 = await getBytes(r);
    return u8;
  }

  if (archivo.url) {
    const resp = await fetch(archivo.url);
    if (!resp.ok) throw new Error(`No se pudo descargar el PDF (HTTP ${resp.status})`);
    const ab = await resp.arrayBuffer();
    return new Uint8Array(ab);
  }

  throw new Error("Archivo sin storagePath ni url");
}

async function approveAndSign() {
  if (!canApprove.value) return;

  const cmp = currentCmp.value;
  const oc = currentOc.value;
  const other = currentOther.value;

  try {
    let signedUrl = oc?.firmado?.url || null;
    let signedPath = oc?.firmado?.storagePath || null;
    let didSignNow = false;

    if (!signedUrl) {
      setBusy(
        true,
        "Firmando OC…",
        "Buscando “Gerente General” y generando PDF firmado",
        0
      );

      const archivoOc = oc?.archivo;
      if (!archivoOc) throw new Error("OC sin archivo original.");

      const pdfBytes = await loadPdfBytesFromStorageFile(archivoOc);

      setBusy(true, "Firmando OC…", "Insertando firma en el PDF", 10);
      const signedBytes = await signPdfWithImageSmart(
        pdfBytes,
        signatureFile.value,
        (p) => {
          setBusy(true, "Firmando OC…", "Insertando firma en el PDF", p);
        }
      );

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      signedPath = `lotes_docs/${selectedLoteId.value}/docs/${oc.id}/signed_${stamp}.pdf`;
      const signedBlob = new Blob([signedBytes], { type: "application/pdf" });

      setBusy(
        true,
        "Subiendo PDF firmado…",
        "Guardando versión firmada",
        40
      );

      signedUrl = await uploadDataToStorage(signedBlob, signedPath, (pct) => {
        const mapped = 40 + Math.round((pct * 55) / 100);
        setBusy(
          true,
          "Subiendo PDF firmado…",
          "Guardando versión firmada",
          mapped
        );
      });

      didSignNow = true;
    } else {
      setBusy(true, "Aprobando…", "OC ya viene firmada, solo marcando estados", 60);
    }

    setBusy(
      true,
      "Finalizando estados…",
      "Marcando comparativa y documentos como aprobados",
      96
    );

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

    if (didSignNow) {
      await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id), {
        estado: "aprobado",
        firmado: {
          url: signedUrl,
          storagePath: signedPath,
          signedAt: serverTimestamp(),
          signedBy: actorName.value,
        },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });
    } else {
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

    setBusy(true, "Listo ", "Avanzando a la siguiente pendiente…", 100);

    animateAdvance(cmp.id);
  } catch (err) {
    console.error(err);
    alert("Error aprobando/firmando: " + (err?.message || String(err)));
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
      doc(
        db,
        "lotes_docs",
        selectedLoteId.value,
        "comparaciones",
        cmp.id
      ),
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
      await updateDoc(
        doc(db, "lotes_docs", selectedLoteId.value, "docs", other.id),
        {
          estado: "rechazado",
          rechazo: {
            motivo: motivo,
            at: serverTimestamp(),
            by: actorName.value,
          },
          updatedAt: serverTimestamp(),
          updatedBy: actorName.value,
        }
      );
    }
    if (oc?.id) {
      await updateDoc(
        doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id),
        {
          estado: "rechazado",
          rechazo: {
            motivo: motivo,
            at: serverTimestamp(),
            by: actorName.value,
          },
          updatedAt: serverTimestamp(),
          updatedBy: actorName.value,
        }
      );
    }

    setBusy(true, "Listo ", "Avanzando a la siguiente pendiente…", 100);
    animateAdvance(cmp.id);
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
  async ([loteId, isLoading, isAutoMatching, pendingCount]) => {
    if (!loteId) return;
    if (isLoading) return;
    if (isAutoMatching) return;
    if (finishingLote.value) return;
    if (pendingCount === 0) {
      await completeCurrentLoteAndAdvance();
    }
  }
);

async function completeCurrentLoteAndAdvance() {
  const loteId = selectedLoteId.value;
  if (!loteId) return;

  finishingLote.value = true;

  try {
    setBusy(true, "Finalizando lote…", "Verificando que no queden pendientes", 10);

    const qPend = query(
      collection(db, "lotes_docs", loteId, "comparaciones"),
      where("estado", "==", "pendiente"),
      limit(1)
    );
    const snapPend = await getDocs(qPend);
    if (!snapPend.empty) return;

    setBusy(true, "Finalizando lote…", "Marcando estado del lote", 55);

    await updateDoc(doc(db, "lotes_docs", loteId), {
      estado: "Revisión completa",
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

async function signPdfWithImageSmart(pdfArrayBuffer, imageFile, onStepProgress) {
  const toU8Copy = (data) => {
    if (!data) throw new Error("PDF vacío");
    if (data instanceof Uint8Array) return data.slice();
    if (data instanceof ArrayBuffer) return new Uint8Array(data).slice();
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
    }
    throw new Error("Tipo de PDF no soportado (usa ArrayBuffer o Uint8Array)");
  };

  const isFin = (n) => Number.isFinite(n);

  if (!imageFile) throw new Error("Falta archivo de firma");
  const pdfU8 = toU8Copy(pdfArrayBuffer);

  onStepProgress?.(15);

  const anchor = await findGerenteGeneralAnchor(pdfU8).catch(() => null);

  onStepProgress?.(20);

  const pdfDoc = await PDFDocument.load(pdfU8);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const imgBytes = toU8Copy(await imageFile.arrayBuffer());
  const isPng = String(imageFile.type || "").toLowerCase().includes("png");
  const sigImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

  onStepProgress?.(28);

  const desiredW = 150;
  const desiredH = desiredW * 0.55;
  const margin = 30;

  let page = lastPage;
  let width = page.getWidth();
  let height = page.getHeight();

  let x = width - desiredW - margin;
  let y = margin;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const anchorOk =
    anchor &&
    isFin(anchor.pageIndex) &&
    pages[anchor.pageIndex] &&
    isFin(anchor.viewportW) && anchor.viewportW > 0 &&
    isFin(anchor.viewportH) && anchor.viewportH > 0 &&
    (isFin(anchor.x0) || isFin(anchor.x)) &&
    (isFin(anchor.x1) || isFin(anchor.x)) &&
    isFin(anchor.y);

  if (anchorOk) {
    page = pages[anchor.pageIndex] || lastPage;
    width = page.getWidth();
    height = page.getHeight();

    const x0 = isFin(anchor.x0) ? anchor.x0 : anchor.x;
    const x1 = isFin(anchor.x1) ? anchor.x1 : anchor.x;

    const centerViewportX = (x0 + x1) / 2;

    const cx = (centerViewportX / anchor.viewportW) * width;
    const py = (anchor.y / anchor.viewportH) * height;

    const Y_UP = -5;
    const X_RIGHT = 25;

    if (isFin(cx) && isFin(py)) {
      x = clamp(cx - desiredW / 2 + X_RIGHT, margin, width - desiredW - margin);
      y = clamp(py + Y_UP, margin, height - desiredH - margin);
    }
  }

  if (!isFin(x) || !isFin(y)) {
    page = lastPage;
    width = page.getWidth();
    height = page.getHeight();
    x = width - desiredW - margin;
    y = margin;
  }

  page.drawImage(sigImg, { x, y, width: desiredW, height: desiredH });

  onStepProgress?.(38);
  const out = await pdfDoc.save();
  onStepProgress?.(40);
  return out;
}

async function findGerenteGeneralAnchor(pdfArrayBuffer) {
  const toU8Copy = (data) => {
    if (!data) throw new Error("PDF vacío");
    if (data instanceof Uint8Array) return data.slice();
    if (data instanceof ArrayBuffer) return new Uint8Array(data).slice();
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
    }
    throw new Error("Tipo de PDF no soportado (usa ArrayBuffer o Uint8Array)");
  };

  const isFin = (n) => Number.isFinite(n);

  const dataForPdfJs = toU8Copy(pdfArrayBuffer);

  const task = getDocument({
    data: dataForPdfJs,
    disableWorker: true,
  });

  const pdf = await task.promise;
  try {
    const total = pdf.numPages || 0;
    if (!total) return null;

    const pagesToTry = [];
    for (let i = total; i >= 1 && pagesToTry.length < 3; i--) pagesToTry.push(i);

    const a = "gerente";
    const b = "general";

    for (const pNo of pagesToTry) {
      const page = await pdf.getPage(pNo);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const items = (content.items || [])
        .filter((it) => it && typeof it.str === "string" && it.str.trim() !== "")
        .map((it) => ({
          str: it.str,
          x: isFin(it?.transform?.[4]) ? Number(it.transform[4]) : 0,
          y: isFin(it?.transform?.[5]) ? Number(it.transform[5]) : 0,
        }));

      items.sort((a1, b1) => b1.y - a1.y || a1.x - b1.x);

      const Y_TOL = 2.6;
      const lines = [];
      for (const it of items) {
        const last = lines[lines.length - 1];
        if (!last || Math.abs(it.y - last.y) > Y_TOL) lines.push({ y: it.y, chunks: [it] });
        else last.chunks.push(it);
      }

      for (const ln of lines) {
        const chunks = ln.chunks.slice().sort((x, y) => x.x - y.x);
        const lineText = normalizeText(chunks.map((c) => c.str).join(" "));
        if (!lineText.includes(a) || !lineText.includes(b)) continue;

        const ggChunks = chunks.filter((c) => {
          const s = normalizeText(c.str);
          return s.includes(a) || s.includes(b);
        });
        if (!ggChunks.length) continue;

        const xs = ggChunks.map((c) => c.x).filter(isFin);
        if (!xs.length) continue;

        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);

        return {
          pageIndex: pNo - 1,
          x0,
          x1,
          y: isFin(ln.y) ? ln.y : ggChunks[0].y,
          viewportW: viewport.width,
          viewportH: viewport.height,
        };
      }
    }

    return null;
  } finally {
    try { await pdf?.destroy?.(); } catch (e) { console.log(e); }
    try { await task?.destroy?.(); } catch (e) { console.log(e); }
  }
}
</script>

<style scoped>
.bg-light-subtle { background: rgba(0,0,0,.03); }

.list-wrap { max-height: 55vh; overflow: auto; padding: 2px; }

.viewer-card { background: #fff; overflow: hidden; }
.viewer-top {
  padding: .5rem .65rem;
  border-bottom: 1px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.02);
}
.viewer-frame {
  width: 100%;
  height: 88vh;
  max-height: 88vh;
  background: #111;
}

.viewer-img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
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
  .viewer-frame { height: 60vh; max-height: 60vh; }
}

.reject-grid{
  max-height: 220px;
  overflow: auto;
  background: rgba(0,0,0,.02);
}

</style>
