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

    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0">Aprobación Documental</h4>
        <small class="text-muted">
          Selecciona un lote → revisa comparativas → aprueba (firma OC) o rechaza (motivo) → avanza automático.
        </small>
      </div>

      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select class="form-select" style="min-width: 320px" v-model="selectedLoteId" @change="onChangeLote">
          <option value="" disabled>Selecciona un lote…</option>
          <option v-for="l in lotes" :key="l.id" :value="l.id">
            {{ l.nombre || ("Lote " + l.id.slice(0, 6)) }}
          </option>
        </select>

        <div class="input-group" style="min-width: 320px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input v-model="q" class="form-control" placeholder="Buscar (OC / factura / nombre / estado)…" />
          <button class="btn btn-outline-secondary" @click="q=''" title="Limpiar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <span class="badge text-bg-dark">Pendientes: {{ pendientesFiltradas.length }}</span>
          <span class="badge text-bg-success">Aprobadas: {{ aprobadasFiltradas.length }}</span>
          <span class="badge text-bg-danger">Rechazadas: {{ rechazadasFiltradas.length }}</span>
        </div>
        <button
          type="button"
          class="btn btn-outline-dark btn-sm"
          @click="toggleSidebar"
        >
          <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'"></i>
          {{ showSidebar ? 'Ocultar comparativas' : 'Mostrar comparativas' }}
        </button>
      </div>
    </div>

    <div v-if="!selectedLoteId" class="alert alert-warning">
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

              <button class="btn btn-success btn-sm" :disabled="!canApprove" @click="openApproveModal">
                <i class="bi bi-check2-circle me-1"></i>Aprobar + Firmar OC
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
                    <div class="col-12 col-md-6">
                      <div class="p-2 rounded border bg-light-subtle">
                        <div class="small text-muted">OC</div>
                        <div class="fw-semibold text-truncate">{{ ocNombreArchivo(currentCmp) || 'OC' }}</div>
                        <div class="small text-muted">
                          N°: <span class="fw-semibold">{{ currentOc?.numero || ocNumero(currentCmp) || '—' }}</span>
                        </div>
                        <div class="small text-muted" v-if="currentOc?.firmado?.url">
                          <i class="bi bi-pen me-1"></i>Ya firmada (se muestra la versión firmada)
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="p-2 rounded border bg-light-subtle">
                        <div class="small text-muted">
                          {{ otherTipo(currentCmp)==='factura' ? 'Factura' : 'Guía' }}
                        </div>
                        <div class="fw-semibold text-truncate">
                          {{ otherNombreArchivo(currentCmp) || 'Documento' }}
                        </div>
                        <div class="small text-muted">
                          Ref OC detectada:
                          <span class="fw-semibold">{{ otherDocRefOcText || '—' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="p-2 rounded border bg-white">
                        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                          <div class="fw-semibold small">
                            <i class="bi bi-chat-left-text me-1"></i>Comentario de la comparativa (opcional)
                          </div>
                          <button
                            class="btn btn-outline-dark btn-sm"
                            :disabled="
                              !currentCmp ||
                              commentSaving ||
                              commentDraft.trim() === (currentCmp.comentario||'').trim()
                            "
                            @click="saveComment"
                          >
                            <span v-if="!commentSaving">
                              <i class="bi bi-save me-1"></i>Guardar comentario
                            </span>
                            <span v-else>
                              <span class="spinner-border spinner-border-sm me-2"></span>Guardando…
                            </span>
                          </button>
                        </div>

                        <textarea
                          v-model="commentDraft"
                          class="form-control mt-2"
                          rows="2"
                          placeholder="Ej: se observa diferencia en monto / falta referencia / ok…"
                        ></textarea>

                        <div class="small text-muted mt-1">
                          Se guarda en la comparativa. Al rechazar, el motivo queda registrado también.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="row g-2">
                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="fw-semibold small">{{ leftTitle }}</div>
                          <a v-if="leftUrl" class="btn btn-outline-dark btn-sm" :href="leftUrl" target="_blank">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div v-if="leftUrl" class="viewer-frame">
                          <iframe :src="leftUrl" style="border:0; width:100%; height:100%"></iframe>
                        </div>
                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="viewer-card border rounded">
                        <div class="viewer-top d-flex justify-content-between align-items-center">
                          <div class="fw-semibold small">{{ rightTitle }}</div>
                          <a v-if="rightUrl" class="btn btn-outline-dark btn-sm" :href="rightUrl" target="_blank">
                            <i class="bi bi-box-arrow-up-right"></i>
                          </a>
                        </div>

                        <div v-if="rightUrl" class="viewer-frame">
                          <iframe :src="rightUrl" style="border:0; width:100%; height:100%"></iframe>
                        </div>
                        <div v-else class="text-muted text-center py-5">Sin documento</div>
                      </div>
                    </div>
                  </div>

                  <div class="small text-muted mt-3">
                    Tip: al aprobar, se intenta ubicar “Gerente General” para firmar en esa zona. Si no se encuentra,
                    cae a abajo-derecha.
                  </div>
                </div>
              </Transition>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="approveModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Aprobar + Firmar OC</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="alert alert-info mb-2">
              Se generará un PDF <b>firmado</b> de la OC, se subirá a Storage y la comparativa quedará como <b>aprobada</b>.
            </div>

            <div class="small">
              <div><span class="fw-semibold">Lote:</span> {{ loteNombreActual }}</div>
              <div><span class="fw-semibold">OC:</span> {{ currentOc ? labelDoc(currentOc) : '—' }}</div>
              <div><span class="fw-semibold">Documento:</span> {{ currentOther ? labelDoc(currentOther) : '—' }}</div>

              <div class="mt-2">
                <span class="fw-semibold">Firma:</span>
                <span :class="signatureFile ? 'text-success' : 'text-danger'">
                  {{ signatureFile ? signatureFile.name : 'No seleccionada' }}
                </span>
              </div>
            </div>

            <div v-if="!signatureFile" class="text-danger small mt-2">
              Debes cargar una firma para aprobar.
            </div>

            <div class="form-check mt-3">
              <input class="form-check-input" type="checkbox" id="chkAprobarDoc" v-model="alsoApproveOther" />
              <label class="form-check-label" for="chkAprobarDoc">
                Marcar también Factura/Guía como “aprobado”
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-success" :disabled="!canApprove" @click="approveAndSign">
              Aprobar y firmar
            </button>
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
            <label class="form-label">Motivo (obligatorio)</label>
            <textarea
              v-model="rejectReason"
              class="form-control"
              rows="4"
              placeholder="Ej: Documento no corresponde a esta OC / falta referencia / diferencias…"
            ></textarea>

            <div class="form-check mt-3">
              <input class="form-check-input" type="checkbox" id="chkRechazarOc" v-model="rejectOcToo" />
              <label class="form-check-label" for="chkRechazarOc">
                Rechazar también la OC (por defecto se rechaza solo Factura/Guía)
              </label>
            </div>

            <div class="small text-muted mt-2">
              Esto moverá la comparativa a “rechazadas” (con animación) y avanzará a la siguiente pendiente.
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" :disabled="!canReject || !rejectReason.trim()" @click="rejectComparison">
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

const listTab = ref("pendiente");
const q = ref("");

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

const approveModalEl = ref(null);
const rejectModalEl = ref(null);
let approveModal = null;
let rejectModal = null;


const signatureFile = ref(null);
const signaturePreview = ref("");


const rejectReason = ref("");
const rejectOcToo = ref(false);
const alsoApproveOther = ref(true);


const commentDraft = ref("");
const commentSaving = ref(false);

const docsById = computed(() => {
  const m = new Map();
  for (const d of docs.value) m.set(d.id, d);
  return m;
});

function labelDoc(d) {
  const n = d?.numero ? `N°${d.numero}` : "Sin N°";
  const nm = d?.archivo?.name ? d.archivo.name : (d?.id ? d.id.slice(0, 6) : "doc");
  return `${n} · ${nm}`;
}

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
function cmpTextIndex(c) {
  const oc = docsById.value.get(c?.ocId || "");
  const od = docsById.value.get(cmpOtherId(c));
  const parts = [
    c?.estado,
    oc?.numero,
    oc?.archivo?.name,
    od?.numero,
    od?.archivo?.name,
    otherTipo(c),
    c?.comentario,
  ]
    .filter(Boolean)
    .join(" ");
  return normalizeText(parts);
}

const filtered = computed(() => {
  const needle = normalizeText(q.value);
  if (!needle) return cmps.value;
  return cmps.value.filter((c) => cmpTextIndex(c).includes(needle));
});

const pendientesFiltradas = computed(() =>
  filtered.value.filter((c) => (c.estado || "pendiente") === "pendiente")
);
const aprobadasFiltradas = computed(() =>
  filtered.value.filter((c) => c.estado === "aprobado")
);
const rechazadasFiltradas = computed(() =>
  filtered.value.filter((c) => c.estado === "rechazado")
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

const loteNombreActual = computed(() => {
  const l = lotes.value.find((x) => x.id === selectedLoteId.value);
  return l?.nombre || (selectedLoteId.value ? `Lote ${selectedLoteId.value.slice(0, 6)}` : "—");
});

// visor
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

const canApprove = computed(() => {
  if (!currentCmp.value) return false;
  if ((currentCmp.value.estado || "pendiente") !== "pendiente") return false;
  if (!currentOc.value?.archivo) return false;
  if (!signatureFile.value) return false;
  return true;
});

const canReject = computed(() => {
  if (!currentCmp.value) return false;
  return (currentCmp.value.estado || "pendiente") === "pendiente";
});


onMounted(() => {
  approveModal = new bootstrap.Modal(approveModalEl.value);
  rejectModal = new bootstrap.Modal(rejectModalEl.value);

  unsubLotes = onSnapshot(
    query(collection(db, "lotes_docs"), orderBy("createdAt", "desc")),
    (snap) => {
      lotes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (!selectedLoteId.value) {
        const routeLote = route?.params?.loteId ? String(route.params.loteId) : "";
        selectedLoteId.value = routeLote || lotes.value[0]?.id || "";
        if (selectedLoteId.value) onChangeLote();
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


watch(selectedCmpId, () => {
  commentDraft.value = (currentCmp.value?.comentario || "").toString();
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
    if (usedOther.has(d.id)) continue;

    const nums = numbersForOther(d);
    if (!nums.length) continue;

    let chosenOc = null;
    let matchedValue = "";

    for (const n of nums) {
      const oc = ocIndex.get(n);
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

function openApproveModal() {
  alsoApproveOther.value = true;
  approveModal.show();
}
function openRejectModal() {
  rejectReason.value = "";
  rejectOcToo.value = false;
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
    return await getBytes(r);
  }

  if (archivo.url) {
    const resp = await fetch(archivo.url);
    if (!resp.ok) {
      throw new Error(`No se pudo descargar el PDF (HTTP ${resp.status})`);
    }
    return await resp.arrayBuffer();
  }

  throw new Error("Archivo sin storagePath ni url");
}


async function saveComment() {
  if (!currentCmp.value) return;
  const next = commentDraft.value.toString();

  commentSaving.value = true;
  try {
    await updateDoc(
      doc(
        db,
        "lotes_docs",
        selectedLoteId.value,
        "comparaciones",
        currentCmp.value.id
      ),
      {
        comentario: next,
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );
  } catch (e) {
    console.error(e);
    alert("Error guardando comentario: " + (e?.message || String(e)));
  } finally {
    commentSaving.value = false;
  }
}


async function approveAndSign() {
  if (!canApprove.value) return;

  const cmp = currentCmp.value;
  const oc = currentOc.value;
  const other = currentOther.value;

  approveModal.hide();

  try {
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
    const signedPath = `lotes_docs/${selectedLoteId.value}/docs/${oc.id}/signed_${stamp}.pdf`;
    const signedBlob = new Blob([signedBytes], { type: "application/pdf" });

    setBusy(
      true,
      "Subiendo PDF firmado…",
      "Guardando versión firmada en Storage",
      40
    );
    const signedUrl = await uploadDataToStorage(signedBlob, signedPath, (pct) => {
      const mapped = 40 + Math.round((pct * 55) / 100); // 40..95
      setBusy(
        true,
        "Subiendo PDF firmado…",
        "Guardando versión firmada en Storage",
        mapped
      );
    });

    setBusy(
      true,
      "Actualizando estados…",
      "Marcando comparativa y documentos como aprobados",
      96
    );


    await updateDoc(
      doc(
        db,
        "lotes_docs",
        selectedLoteId.value,
        "comparaciones",
        cmp.id
      ),
      {
        estado: "aprobado",
        comentario: commentDraft.value.toString(),
        aprobado: { at: serverTimestamp(), by: actorName.value },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );


    await updateDoc(
      doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id),
      {
        estado: "aprobado",
        firmado: {
          url: signedUrl,
          storagePath: signedPath,
          signedAt: serverTimestamp(),
          signedBy: actorName.value,
        },
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      }
    );


    if (alsoApproveOther.value && other?.id) {
      await updateDoc(
        doc(db, "lotes_docs", selectedLoteId.value, "docs", other.id),
        {
          estado: "aprobado",
          updatedAt: serverTimestamp(),
          updatedBy: actorName.value,
        }
      );
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
  if (!canReject.value || !rejectReason.value.trim()) return;

  const cmp = currentCmp.value;
  const oc = currentOc.value;
  const other = currentOther.value;

  rejectModal.hide();

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
        comentario: rejectReason.value.trim(),
        rechazado: {
          at: serverTimestamp(),
          by: actorName.value,
          motivo: rejectReason.value.trim(),
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
            motivo: rejectReason.value.trim(),
            at: serverTimestamp(),
            by: actorName.value,
          },
          updatedAt: serverTimestamp(),
          updatedBy: actorName.value,
        }
      );
    }
    if (rejectOcToo.value && oc?.id) {
      await updateDoc(
        doc(db, "lotes_docs", selectedLoteId.value, "docs", oc.id),
        {
          estado: "rechazado",
          rechazo: {
            motivo: rejectReason.value.trim(),
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
  const next = pendientesFiltradas.value.find((x) => x.id !== currentId);
  selectedCmpId.value = next ? next.id : "";
  if (!next) listTab.value = "pendiente";
}


function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function signPdfWithImageSmart(pdfArrayBuffer, imageFile, onStepProgress) {
  onStepProgress?.(15);
  const anchor = await findGerenteGeneralAnchor(pdfArrayBuffer).catch(() => null);
  onStepProgress?.(25);

  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

  const imgBytes = await imageFile.arrayBuffer();
  const isPng = (imageFile.type || "").toLowerCase().includes("png");
  const sigImg = isPng
    ? await pdfDoc.embedPng(imgBytes)
    : await pdfDoc.embedJpg(imgBytes);
  onStepProgress?.(30);

  const pages = pdfDoc.getPages();
  const pageIndex = anchor?.pageIndex ?? pages.length - 1;
  const page = pages[clamp(pageIndex, 0, pages.length - 1)];
  const { width, height } = page.getSize();

  const desiredW = Math.min(240, width * 0.34);
  const scale = desiredW / sigImg.width;
  const desiredH = sigImg.height * scale;

  const margin = 28;

  let x = width - desiredW - margin;
  let y = margin;

  if (anchor) {
    const px = (anchor.x / anchor.viewportW) * width;
    const py = (anchor.y / anchor.viewportH) * height;

    x = clamp(px + 18, margin, width - desiredW - margin);
    y = clamp(py + 14, margin, height - desiredH - margin);
  }

  page.drawImage(sigImg, { x, y, width: desiredW, height: desiredH });
  onStepProgress?.(38);

  return await pdfDoc.save();
}

async function findGerenteGeneralAnchor(pdfArrayBuffer) {
  const task = getDocument({
    data: new Uint8Array(pdfArrayBuffer),
    disableFontFace: true,
    useSystemFonts: true,
  });
  const pdf = await task.promise;

  const total = pdf.numPages;
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
        x: it.transform ? it.transform[4] : 0,
        y: it.transform ? it.transform[5] : 0,
      }));

    items.sort((a1, b1) => b1.y - a1.y || a1.x - b1.x);

    const Y_TOL = 2.6;
    const lines = [];
    for (const it of items) {
      const last = lines[lines.length - 1];
      if (!last || Math.abs(it.y - last.y) > Y_TOL)
        lines.push({ y: it.y, chunks: [it] });
      else last.chunks.push(it);
    }

    for (const ln of lines) {
      ln.chunks.sort((x1, x2) => x1.x - x2.x);
      const lineText = normalizeText(ln.chunks.map((c) => c.str).join(" "));

      if (!lineText.includes(a) || !lineText.includes(b)) continue;

      const minX = Math.min(...ln.chunks.map((c) => c.x));

      await pdf.destroy?.().catch(() => {});
      return {
        pageIndex: pNo - 1,
        x: minX,
        y: ln.y,
        viewportW: viewport.width,
        viewportH: viewport.height,
      };
    }
  }

  await pdf.destroy?.().catch(() => {});
  return null;
}
</script>

<style scoped>
.bg-light-subtle { background: rgba(0,0,0,.03); }

.list-wrap { max-height: 40vh; overflow: auto; padding: 2px; }

.viewer-card { background: #fff; overflow: hidden; }
.viewer-top {
  padding: .5rem .65rem;
  border-bottom: 1px solid rgba(0,0,0,.08);
  background: rgba(0,0,0,.02);
}
.viewer-frame {
  width: 100%;
  height: 82vh;
  max-height: 82vh;
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
</style>
