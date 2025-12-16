<!-- src/views/AprobacionDocumental.vue -->
<template>
  <div class="container-fluid py-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0">Aprobación Documental</h4>
        <small class="text-muted">Primero separa + valida local, luego sube al lote y revisa.</small>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary" @click="openCreateLoteModal">
          <i class="bi bi-folder-plus me-1"></i> Nuevo lote
        </button>

        <select class="form-select" style="min-width: 280px" v-model="selectedLoteId" @change="onChangeLote">
          <option value="" disabled>Selecciona un lote…</option>
          <option v-for="l in lotes" :key="l.id" :value="l.id">
            {{ l.nombre || ("Lote " + l.id.slice(0,6)) }}
          </option>
        </select>

        <div class="btn-group">
          <button class="btn btn-outline-dark" :class="{active: tab==='staging'}" @click="tab='staging'">Revisión local</button>
          <button class="btn btn-outline-dark" :class="{active: tab==='cloud'}" @click="tab='cloud'">En Firestore</button>
        </div>
      </div>
    </div>


    <div v-if="tab==='staging'" class="row g-3">
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold">Borradores (local)</div>

            <div class="d-flex gap-2">
              <label class="btn btn-danger btn-sm mb-0">
                <i class="bi bi-upload me-1"></i> Cargar PDFs (paquetes)
                <input type="file" multiple accept="application/pdf" class="d-none" @change="onPickFilesLocal" />
              </label>

              <button class="btn btn-outline-secondary btn-sm" @click="clearStaging" :disabled="staged.length===0">
                <i class="bi bi-trash me-1"></i> Limpiar
              </button>
            </div>
          </div>

          <div class="card-body">

            <div v-if="localBusy" class="p-2 rounded border bg-light-subtle mb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm text-danger"></div>
                <div class="flex-grow-1">
                  <div class="small fw-semibold">Procesando PDFs…</div>
                  <div class="small text-muted">{{ localStatus }}</div>
                  <div class="progress mt-1" style="height: 8px;">
                    <div class="progress-bar bg-danger progress-bar-striped progress-bar-animated" :style="{ width: localProgress + '%' }"></div>
                  </div>
                </div>
                <div class="small fw-semibold">{{ localProgress }}%</div>
              </div>
            </div>

            <div class="d-flex gap-2 mb-2 flex-wrap">
              <span class="badge text-bg-secondary">Total: {{ staged.length }}</span>
              <span class="badge text-bg-primary">OC: {{ stagedCounts.oc }}</span>
              <span class="badge text-bg-warning">Facturas: {{ stagedCounts.factura }}</span>
              <span class="badge text-bg-info">Guías: {{ stagedCounts.guia }}</span>
              <span class="badge text-bg-danger">Incoherentes: {{ stagedCounts.bad }}</span>
            </div>

            <div class="list-group" style="max-height: 65vh; overflow:auto;">
              <button
                v-for="s in staged"
                :key="s.id"
                type="button"
                class="list-group-item list-group-item-action"
                :class="{ active: selectedStageId === s.id }"
                @click="selectStage(s)"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="me-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="badge" :class="tipoBadge(s.tipo)">{{ (s.tipo || 'factura').toUpperCase() }}</span>
                      <span class="badge" :class="s.coherence?.ok ? 'text-bg-success' : 'text-bg-danger'">
                        {{ s.coherence?.ok ? 'OK' : 'REVISAR' }}
                      </span>
                      <span class="badge text-bg-light">{{ s.pagesCount }} pág</span>
                      <span v-if="s.tipo==='oc' && !s.numero" class="badge text-bg-danger">FALTA N°</span>
                    </div>

                    <div class="fw-semibold mt-1 text-truncate" style="max-width: 360px;">
                      {{ s.parentName }} · parte {{ s.partIndex }}/{{ s.totalParts }}
                    </div>

                    <small class="text-muted">
                      N°: <span class="fw-semibold">{{ s.numero || '—' }}</span>
                      · Páginas: {{ s.pageRange }}
                    </small>

                    <div v-if="!s.coherence?.ok" class="small text-danger mt-1">
                      <div v-for="(r, i) in (s.coherence?.reasons || [])" :key="i">• {{ r }}</div>
                    </div>
                  </div>

                  <div class="d-flex flex-column gap-1 align-items-end">
                    <button class="btn btn-outline-dark btn-sm" @click.stop="openEditStageModal(s)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" @click.stop="removeStage(s.id)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </button>

              <div v-if="staged.length===0" class="text-muted text-center py-4">
                Sube PDFs. Esto separa 1 página = 1 documento y clasifica automáticamente.
              </div>
            </div>

            <div class="d-grid gap-2 mt-3">
              <button class="btn btn-success" @click="uploadStagingToLote" :disabled="!selectedLoteId || staged.length===0 || uploadBusy">
                <i class="bi bi-cloud-arrow-up me-1"></i> Subir revisados al lote
              </button>

              <div v-if="uploadBusy" class="mt-2">
                <div class="small text-muted d-flex justify-content-between">
                  <span>{{ uploadStatus }}</span>
                  <span class="fw-semibold">{{ uploadProgress }}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>

              <small class="text-muted">
                *Sube cada “parte” como documento separado.
              </small>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-7">
        <div class="card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div class="fw-semibold d-flex align-items-center gap-2 flex-wrap">
              Vista previa (local)
              <span v-if="selectedStageFull" class="badge" :class="tipoBadge(stageForm.tipo)">
                {{ (stageForm.tipo || 'factura').toUpperCase() }}
              </span>
              <span v-if="selectedStageFull" class="badge text-bg-light">
                N°: {{ stageForm.numero || '—' }}
              </span>
            </div>
            <a v-if="stagePreviewUrl" class="btn btn-outline-dark btn-sm" :href="stagePreviewUrl" target="_blank">
              <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>

          <div class="card-body">
            <div v-if="selectedStageFull" class="mb-3 p-2 rounded border bg-light-subtle">
              <div class="d-flex flex-wrap gap-2 align-items-end">
                <div style="min-width: 180px;">
                  <label class="form-label mb-1 small text-muted">Tipo</label>
                  <select class="form-select form-select-sm" v-model="stageForm.tipo" @change="onStageTipoChanged">
                    <option value="oc">OC</option>
                    <option value="factura">Factura</option>
                    <option value="guia">Guía</option>
                  </select>
                </div>

                <div class="flex-grow-1">
                  <label class="form-label mb-1 small text-muted">
                    Número <span v-if="stageForm.tipo==='oc'" class="text-danger">*</span>
                  </label>

                  <div class="input-group input-group-sm">
                    <input
                      class="form-control"
                      v-model="stageForm.numero"
                      :placeholder="stageForm.tipo==='oc' ? 'Ej: 62570' : 'Opcional (puede quedar vacío)'"
                      @keyup.enter="saveStageQuick"
                      :class="stageForm.tipo==='oc' && !stageForm.numero.trim() ? 'is-invalid' : ''"
                    />
                    <button
                      v-if="stageSuggested"
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="useStageSuggested(stageSuggested)"
                      title="Usar sugerido"
                    >
                      Sugerido: {{ stageSuggested }}
                    </button>
                    <button class="btn btn-dark" type="button" @click="saveStageQuick" :disabled="stageQuickSaving">
                      <i class="bi bi-check2 me-1"></i> Guardar
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="selectedStageFull?.tipo==='oc' && (selectedStageFull?.ocCandidates?.length || selectedStageFull?.refOc)" class="mt-2">
                <div class="small text-muted mb-1">Sugerencias detectadas (click para usar):</div>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    v-for="c in (selectedStageFull.ocCandidates || [])"
                    :key="c.value + ':' + c.score"
                    class="btn btn-outline-primary btn-sm"
                    type="button"
                    @click="useStageSuggested(c.value)"
                    :title="c.source + ' · score ' + c.score"
                  >
                    {{ c.value }}
                  </button>
                  <button
                    v-if="selectedStageFull.refOc && !(selectedStageFull.ocCandidates||[]).some(x=>x.value===selectedStageFull.refOc)"
                    class="btn btn-outline-primary btn-sm"
                    type="button"
                    @click="useStageSuggested(selectedStageFull.refOc)"
                  >
                    {{ selectedStageFull.refOc }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="stagePreviewUrl" class="ratio ratio-1x1" style="min-height: 620px;">
              <iframe :src="stagePreviewUrl" style="border:0;"></iframe>
            </div>
            <div v-else class="text-muted text-center py-5">
              Selecciona una parte para previsualizar.
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="row g-3">
      <div v-if="!selectedLoteId" class="col-12">
        <div class="alert alert-warning">Crea o selecciona un lote para empezar.</div>
      </div>

      <template v-else>
        <div class="col-12 col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Documentos del lote</div>
              <div class="btn-group">
                <button class="btn btn-outline-dark btn-sm" :class="{active: filtroEstado==='pendiente'}" @click="filtroEstado='pendiente'">Pendientes</button>
                <button class="btn btn-outline-dark btn-sm" :class="{active: filtroEstado==='aprobado'}" @click="filtroEstado='aprobado'">Aprobados</button>
                <button class="btn btn-outline-dark btn-sm" :class="{active: filtroEstado==='rechazado'}" @click="filtroEstado='rechazado'">Rechazados</button>
                <button class="btn btn-outline-dark btn-sm" :class="{active: filtroEstado==='todos'}" @click="filtroEstado='todos'">Todos</button>
              </div>
            </div>

            <div class="card-body">
              <input v-model="search" class="form-control mb-3" placeholder="Buscar por nombre / número / tipo…" />

              <div class="d-flex gap-2 mb-2 flex-wrap">
                <span class="badge text-bg-secondary">OC: {{ counts.oc }}</span>
                <span class="badge text-bg-secondary">Facturas: {{ counts.factura }}</span>
                <span class="badge text-bg-secondary">Guías: {{ counts.guia }}</span>
                <span class="badge text-bg-secondary">Rechazados: {{ counts.rechazado }}</span>
              </div>

              <div class="d-flex flex-wrap gap-2 mb-3">
                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="downloadLoteResumenCsv"
                  :disabled="!selectedLoteId || filteredDocs.length === 0"
                >
                  <i class="bi bi-download me-1"></i>
                  Descargar listado (CSV)
                </button>

                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="downloadLotePdfOrdenado"
                  :disabled="!selectedLoteId || filteredDocs.length === 0"
                >
                  <i class="bi bi-file-earmark-pdf me-1"></i>
                  Descargar lote (PDF en orden)
                </button>
              </div>

              <div class="list-group" style="max-height: 60vh; overflow:auto;">
                <button
                  v-for="d in filteredDocs"
                  :key="d.id"
                  type="button"
                  class="list-group-item list-group-item-action"
                  :class="{ active: selectedDocId === d.id }"
                  @click="selectDoc(d)"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="me-2">
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="badge" :class="tipoBadge(d.tipo)">{{ d.tipo?.toUpperCase() || '—' }}</span>
                        <span class="badge" :class="estadoBadge(d.estado)">{{ d.estado || '—' }}</span>
                      </div>

                      <div class="fw-semibold mt-1 text-truncate" style="max-width: 320px;">
                        {{ d.archivo?.name || 'PDF' }}
                      </div>

                      <small class="text-muted">
                        N°: <span class="fw-semibold">{{ d.numero || '—' }}</span>
                        <span v-if="d.origen?.pageRange"> · Páginas: {{ d.origen.pageRange }}</span>
                      </small>
                    </div>
                  </div>
                </button>

                <div v-if="filteredDocs.length===0" class="text-muted text-center py-4">
                  Sin documentos con ese filtro.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header">
              <div class="d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-center">
                <div>
                  <div class="fw-semibold">Visor comparativo</div>
                  <small class="text-muted">Selecciona dos documentos para verlos lado a lado.</small>
                </div>
                <div class="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Izq.</span>
                    <select class="form-select form-select-sm" v-model="leftDocId">
                      <option value="">—</option>
                      <option v-for="d in docs" :key="'L'+d.id" :value="d.id">
                        {{ labelDoc(d) }}
                      </option>
                    </select>
                  </div>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Der.</span>
                    <select class="form-select form-select-sm" v-model="rightDocId">
                      <option value="">—</option>
                      <option v-for="d in docs" :key="'R'+d.id" :value="d.id">
                        {{ labelDoc(d) }}
                      </option>
                    </select>
                  </div>
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    type="button"
                    @click="swapSides"
                    :disabled="!leftDocId && !rightDocId"
                  >
                    <i class="bi bi-arrow-left-right me-1"></i> Intercambiar
                  </button>
                </div>
              </div>
            </div>

            <div class="card-body">
              <div class="row g-2">
                <div class="col-12 col-md-6">
                  <div class="border rounded p-2 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="fw-semibold small">
                        {{ leftDocTitle }}
                      </div>
                      <a v-if="leftUrl" class="btn btn-outline-dark btn-sm" :href="leftUrl" target="_blank">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                    <div v-if="leftUrl" class="ratio ratio-1x1" style="min-height: 420px;">
                      <iframe :src="leftUrl" style="border:0;"></iframe>
                    </div>
                    <div v-else class="text-muted text-center py-5">Selecciona un documento para este lado.</div>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="border rounded p-2 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="fw-semibold small">
                        {{ rightDocTitle }}
                      </div>
                      <a v-if="rightUrl" class="btn btn-outline-dark btn-sm" :href="rightUrl" target="_blank">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                    <div v-if="rightUrl" class="ratio ratio-1x1" style="min-height: 420px;">
                      <iframe :src="rightUrl" style="border:0;"></iframe>
                    </div>
                    <div v-else class="text-muted text-center py-5">Selecciona un documento para este lado.</div>
                  </div>
                </div>
              </div>

              <div class="mt-3 small text-muted">
                Si un documento tiene una versión firmada (<code>firmado.url</code>), se mostrará esa versión; en caso contrario se usa el PDF original.
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="modal fade" ref="createLoteModalEl" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo lote</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">Nombre</label>
            <input v-model="newLoteNombre" class="form-control" placeholder="Ej: Lote Diciembre" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" @click="createLote">Crear</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="editStageModalEl" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar borrador</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="editStage">
            <label class="form-label">Tipo</label>
            <select class="form-select mb-2" v-model="editStage.tipo">
              <option value="oc">OC</option>
              <option value="factura">Factura</option>
              <option value="guia">Guía</option>
            </select>

            <label class="form-label">Número</label>
            <input class="form-control" v-model="editStage.numero" placeholder="Ej: 62570" />
            <div class="form-text">En OC conviene completar si falta; en factura/guía puede quedar vacío.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-dark" @click="saveEditStage">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="localBusy || uploadBusy" class="busy-overlay">
        <div class="busy-card shadow-lg">
          <div class="d-flex align-items-center gap-3">
            <div class="busy-icon">
              <div class="spinner-border text-danger" role="status" v-if="localBusy && !uploadBusy"></div>
              <div class="spinner-border text-success" role="status" v-else></div>
            </div>

            <div class="flex-grow-1">
              <div class="fw-semibold">
                {{ uploadBusy ? "Subiendo lote a Firestore…" : "Procesando PDFs…" }}
              </div>
              <div class="small text-muted">
                {{ uploadBusy ? uploadStatus : localStatus }}
              </div>

              <div class="progress mt-2" style="height: 10px;">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  :class="uploadBusy ? 'bg-success' : 'bg-danger'"
                  :style="{ width: (uploadBusy ? uploadProgress : localProgress) + '%' }"
                ></div>
              </div>

              <div class="d-flex justify-content-between mt-1 small text-muted">
                <span>{{ uploadBusy ? uploadProgress : localProgress }}%</span>
                <span v-if="uploadBusy && uploadBytesTotal">
                  {{ fmtBytes(uploadBytesDone) }} / {{ fmtBytes(uploadBytesTotal) }}
                </span>
              </div>
            </div>
          </div>

          <div class="busy-tip mt-3 small text-muted">
            No cierres la pestaña mientras termina 🙏
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import * as bootstrap from "bootstrap";

import { splitPdfPack } from "@/utils/pdfPackSplitter";
import { stagePut, stageList, stageDelete, stageClear, stageGet } from "@/services/stagingDb";
import { useAuthStore } from "@/stores/authService";

import {
  getFirestore, collection, doc, addDoc, setDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const db = getFirestore();
const storage = getStorage();

const auth = useAuthStore();
const actorName = computed(() =>
  auth?.profile?.Nombre_completo ||
  auth?.profile?.nombre ||
  auth?.user?.displayName ||
  auth?.user?.email ||
  "usuario"
);

const tab = ref("staging");


const lotes = ref([]);
const selectedLoteId = ref("");
const docs = ref([]);
const selectedDocId = ref(null);

const filtroEstado = ref("pendiente");
const search = ref("");


const leftDocId = ref("");
const rightDocId = ref("");


const staged = ref([]);
const selectedStageId = ref(null);
const selectedStageFull = ref(null);
const stagePreviewUrl = ref("");
const localBusy = ref(false);
const uploadBusy = ref(false);


const localProgress = ref(0);
const localStatus = ref("");

const uploadProgress = ref(0);
const uploadStatus = ref("");

const uploadBytesDone = ref(0);
const uploadBytesTotal = ref(0);

function fmtBytes(n) {
  const v = Number(n || 0);
  if (!v) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}



function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function csvEscape(value) {
  const s = (value ?? "").toString();
  if (s.includes('"') || s.includes(";") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function getSelectedLoteSafeName(suffix) {
  const lote = lotes.value.find((x) => x.id === selectedLoteId.value) || null;
  const base =
    (lote?.nombre || `Lote_${(selectedLoteId.value || "").slice(0, 6)}`).replace(
      /[^\w\-]+/g,
      "_"
    );
  return `${base}_${suffix}`;
}

function downloadLoteResumenCsv() {
  const list = filteredDocs.value;
  if (!selectedLoteId.value || !list.length) return;

  const estadoName = filtroEstado.value || "todos";
  const fileName = getSelectedLoteSafeName(`listado_${estadoName}.csv`);

  const header = [
    "DocID",
    "Tipo",
    "Estado",
    "Numero",
    "Archivo",
    "Firmado",
    "StoragePath",
    "CreadoPor",
    "CreadoEn",
  ];

  const rows = [header.map(csvEscape).join(";")];

  list.forEach((d) => {
    const createdAt = d.createdAt?.toDate
      ? d.createdAt.toDate().toISOString()
      : "";
    rows.push(
      [
        d.id,
        d.tipo || "",
        d.estado || "",
        d.numero || "",
        d.archivo?.name || "",
        d.firmado?.url ? "SI" : "",
        d.archivo?.storagePath || "",
        d.createdBy || "",
        createdAt,
      ]
        .map(csvEscape)
        .join(";")
    );
  });

  const csv = rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, fileName);
}


async function downloadLotePdfOrdenado() {
  const list = filteredDocs.value;
  if (!selectedLoteId.value || !list.length) return;

  const estadoName = filtroEstado.value || "todos";
  const fileName = getSelectedLoteSafeName(`docs_${estadoName}.pdf`);

  const outPdf = await PDFDocument.create();

  const sorted = [...list].sort((a, b) => {
    const nameA = a.origen?.parentName || "";
    const nameB = b.origen?.parentName || "";
    const cmpName = nameA.localeCompare(nameB);
    if (cmpName !== 0) return cmpName;

    const idxA = a.origen?.partIndex || 0;
    const idxB = b.origen?.partIndex || 0;
    if (idxA !== idxB) return idxA - idxB;

    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tA - tB;
  });

  for (const d of sorted) {
    let url = null;
    if (d.firmado?.url) {
      url = d.firmado.url;
    } else if (d.archivo?.url) {
      url = d.archivo.url;
    }

    if (!url) continue;

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn("No se pudo descargar PDF de doc", d.id);
        continue;
      }
      const bytes = await resp.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const srcPages = srcPdf.getPages();
      const copiedPages = await outPdf.copyPages(
        srcPdf,
        srcPages.map((_, idx) => idx)
      );
      copiedPages.forEach((p) => outPdf.addPage(p));
    } catch (err) {
      console.error("Error agregando doc al lote PDF", d.id, err);
    }
  }

  const finalBytes = await outPdf.save();
  const blob = new Blob([finalBytes], { type: "application/pdf" });
  downloadBlob(blob, fileName);
}


const stageForm = ref({ tipo: "factura", numero: "" });
const stageQuickSaving = ref(false);

const stageSuggested = computed(() => {
  const s = selectedStageFull.value;
  if (!s || stageForm.value.tipo !== "oc") return "";
  return (s.refOc || s.ocCandidates?.[0]?.value || "").toString().trim();
});


const createLoteModalEl = ref(null);
const editStageModalEl = ref(null);

let createLoteModal, editStageModal;

const newLoteNombre = ref("");
const editStage = ref(null);

const tipoBadge = (t) => {
  if (t === "oc") return "text-bg-primary";
  if (t === "factura") return "text-bg-warning";
  if (t === "guia") return "text-bg-info";
  return "text-bg-secondary";
};
const estadoBadge = (s) => {
  if (s === "aprobado") return "text-bg-success";
  if (s === "rechazado") return "text-bg-danger";
  if (s === "reemplazado") return "text-bg-secondary";
  return "text-bg-dark";
};
const labelDoc = (d) => {
  const n = d?.numero ? `N°${d.numero}` : "Sin N°";
  const nm = d?.archivo?.name ? d.archivo.name : (d?.id ? d.id.slice(0, 6) : "doc");
  return `${n} · ${nm}`;
};

const counts = computed(() => {
  const c = { oc: 0, factura: 0, guia: 0, rechazado: 0 };
  for (const d of docs.value) {
    if (d.tipo === "oc") c.oc++;
    if (d.tipo === "factura") c.factura++;
    if (d.tipo === "guia") c.guia++;
    if (d.estado === "rechazado") c.rechazado++;
  }
  return c;
});

const filteredDocs = computed(() => {
  const q = search.value.trim().toLowerCase();
  return docs.value
    .filter((d) => (filtroEstado.value === "todos" ? true : d.estado === filtroEstado.value))
    .filter((d) => {
      if (!q) return true;
      const hay = [d.archivo?.name, d.numero, d.tipo, d.estado].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
});


const leftDoc = computed(() => docs.value.find((d) => d.id === leftDocId.value) || null);
const rightDoc = computed(() => docs.value.find((d) => d.id === rightDocId.value) || null);

const pdfUrlForDoc = (d) => (d ? (d.firmado?.url || d.archivo?.url || "") : "");

const leftUrl = computed(() => pdfUrlForDoc(leftDoc.value));
const rightUrl = computed(() => pdfUrlForDoc(rightDoc.value));

const leftDocTitle = computed(() => leftDoc.value ? labelDoc(leftDoc.value) : "Documento izquierdo");
const rightDocTitle = computed(() => rightDoc.value ? labelDoc(rightDoc.value) : "Documento derecho");

const stagedCounts = computed(() => {
  const c = { oc: 0, factura: 0, guia: 0, bad: 0 };
  for (const s of staged.value) {
    if (s.tipo === "oc") c.oc++;
    if (s.tipo === "factura") c.factura++;
    if (s.tipo === "guia") c.guia++;
    if (!s.coherence?.ok) c.bad++;
  }
  return c;
});


let unsubLotes = null;
let unsubDocs = null;

onMounted(async () => {
  createLoteModal = new bootstrap.Modal(createLoteModalEl.value);
  editStageModal = new bootstrap.Modal(editStageModalEl.value);

  const qL = query(collection(db, "lotes_docs"), orderBy("createdAt", "desc"));
  unsubLotes = onSnapshot(qL, (snap) => {
    lotes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!selectedLoteId.value && lotes.value.length) {
      selectedLoteId.value = lotes.value[0].id;
      onChangeLote();
    }
  });

  await loadStaging();
});

onBeforeUnmount(() => {
  if (unsubLotes) unsubLotes();
  if (unsubDocs) unsubDocs();
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);
});

watch(tab, async (t) => {
  if (t === "staging") await loadStaging();
});

async function loadStaging() {
  staged.value = await stageList();
  if (!staged.value.find((x) => x.id === selectedStageId.value)) {
    selectedStageId.value = null;
    selectedStageFull.value = null;
    setStagePreview(null);
  }
}

function setStagePreview(blob) {
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);
  stagePreviewUrl.value = blob ? URL.createObjectURL(blob) : "";
}

async function selectStage(s) {
  selectedStageId.value = s.id;
  const full = await stageGet(s.id);
  if (!full) return;

  selectedStageFull.value = { ...s, ...full };

  stageForm.value = {
    tipo: selectedStageFull.value.tipo || "factura",
    numero: selectedStageFull.value.numero || "",
  };

  setStagePreview(full?.blob || null);
}

function onStageTipoChanged() {}

function buildCoherence(tipo, numero) {
  const reasons = [];
  if (tipo === "oc" && !String(numero || "").trim()) {
    reasons.push("OC sin número (completar para emparejar).");
  }
  return { ok: reasons.length === 0, reasons };
}

async function saveStageQuick() {
  if (!selectedStageFull.value) return;

  stageQuickSaving.value = true;
  try {
    const current = await stageGet(selectedStageFull.value.id);
    if (!current) return;

    const nextTipo = stageForm.value.tipo;
    const nextNumero = String(stageForm.value.numero || "").trim();

    const coherence = buildCoherence(nextTipo, nextNumero);

    await stagePut({
      ...current,
      tipo: nextTipo,
      numero: nextNumero,
      coherence,
    });

    await loadStaging();

    const again = await stageGet(selectedStageFull.value.id);
    selectedStageFull.value = { ...selectedStageFull.value, ...again, tipo: nextTipo, numero: nextNumero, coherence };
  } finally {
    stageQuickSaving.value = false;
  }
}

async function useStageSuggested(val) {
  stageForm.value.numero = String(val || "").trim();
  await saveStageQuick();
}


async function onPickFilesLocal(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  if (!files.length) return;

  localBusy.value = true;
  localProgress.value = 0;
  localStatus.value = `Preparando… (0/${files.length})`;

  const errors = [];
  let processedFiles = 0;

  try {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      localStatus.value = `Procesando ${i + 1}/${files.length}: ${f.name}`;
      localProgress.value = Math.round((i / files.length) * 100);

      try {
        const { docs: parts } = await splitPdfPack(f);

        for (const p of parts) {
          const id = uuidv4();
          await stagePut({
            id,
            createdAt: Date.now(),
            tipo: p.tipo,
            numero: p.numero,
            refOc: p.refOc || "",
            ocCandidates: p.ocCandidates || [],
            tipoConfidence: p.tipoConfidence ?? null,
            dteTipo: p.dteTipo ?? null,
            ruts: p.ruts,
            pagesCount: p.pagesCount,
            pageRange: p.pageRange,
            coherence: p.coherence,
            parentName: p.parentName,
            partIndex: p.partIndex,
            totalParts: p.totalParts,
            blob: p.blob,
          });
        }

        processedFiles++;
      } catch (err) {
        console.error("Error en archivo:", f.name, err);
        errors.push({ file: f.name, err: String(err?.message || err) });
      }

      localProgress.value = Math.round(((i + 1) / files.length) * 100);
    }

    localStatus.value = `Listo  Procesados ${processedFiles}/${files.length}`;
    await loadStaging();

    if (errors.length) {
      alert(
        `Se procesaron ${processedFiles}/${files.length} PDFs.\n` +
        `Fallaron ${errors.length}.\n` +
        `Revisa consola.`
      );
    }
  } finally {
    setTimeout(() => {
      localBusy.value = false;
      localProgress.value = 0;
      localStatus.value = "";
    }, 350);
  }
}

async function removeStage(id) {
  if (selectedStageId.value === id) {
    selectedStageId.value = null;
    selectedStageFull.value = null;
    setStagePreview(null);
  }
  await stageDelete(id);
  await loadStaging();
}

async function clearStaging() {
  selectedStageId.value = null;
  selectedStageFull.value = null;
  setStagePreview(null);
  await stageClear();
  await loadStaging();
}

function openEditStageModal(s) {
  editStage.value = { ...s };
  editStageModal.show();
}

async function saveEditStage() {
  const full = await stageGet(editStage.value.id);
  if (!full) return;

  const coherence = buildCoherence(editStage.value.tipo, editStage.value.numero);

  await stagePut({
    ...full,
    tipo: editStage.value.tipo,
    numero: String(editStage.value.numero || "").trim(),
    coherence,
  });

  editStageModal.hide();
  await loadStaging();

  if (selectedStageId.value === editStage.value.id) {
    const again = await stageGet(editStage.value.id);
    selectedStageFull.value = {
      ...selectedStageFull.value,
      ...again,
      tipo: editStage.value.tipo,
      numero: String(editStage.value.numero || "").trim(),
      coherence
    };
    setStagePreview(again?.blob || null);
    stageForm.value = { tipo: editStage.value.tipo, numero: String(editStage.value.numero || "").trim() };
  }
}

function uploadDataToStorage(data, path, opts = {}) {
  return new Promise((resolve, reject) => {
    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, data);

    task.on(
      "state_changed",
      (snap) => { if (opts?.onProgress) opts.onProgress(snap); },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}


async function uploadStagingToLote() {
  if (!selectedLoteId.value || staged.value.length === 0) return;

  uploadBusy.value = true;

  uploadProgress.value = 0;
  uploadBytesDone.value = 0;
  uploadBytesTotal.value = 0;
  uploadStatus.value = `Preparando subida… (0/${staged.value.length})`;

  const total = staged.value.length;
  let completedBytes = 0;

  try {
    for (let i = 0; i < total; i++) {
      const s = staged.value[i];
      const full = await stageGet(s.id);
      if (!full?.blob) continue;

      uploadBytesTotal.value += full.blob.size;

      const docId = uuidv4();
      const storagePath = `lotes_docs/${selectedLoteId.value}/docs/${docId}/original.pdf`;

      uploadStatus.value = `Subiendo ${i + 1}/${total}: ${s.parentName} (parte ${s.partIndex}/${s.totalParts})`;

      const url = await uploadDataToStorage(full.blob, storagePath, {
        onProgress: (snap) => {
          const fracFile = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0;
          const fracTotal = (i + fracFile) / total;

          uploadProgress.value = Math.min(99, Math.round(fracTotal * 100));
          uploadBytesDone.value = completedBytes + snap.bytesTransferred;
        },
      });

      completedBytes += full.blob.size;
      uploadBytesDone.value = completedBytes;

      await setDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", docId), {
        tipo: s.tipo,
        estado: "pendiente",
        numero: s.numero || "",
        archivo: {
          name: `${s.parentName} (parte ${s.partIndex}-${s.totalParts}).pdf`,
          size: full.blob.size,
          mime: "application/pdf",
          storagePath,
          url,
        },
        firmado: null,
        rechazo: null,
        reemplazaA: null,
        version: 1,
        origen: {
          parentName: s.parentName,
          partIndex: s.partIndex,
          totalParts: s.totalParts,
          pageRange: s.pageRange,
        },
        deteccion: {
          tipoConfidence: full.tipoConfidence ?? null,
          dteTipo: full.dteTipo ?? null,
          refOc: full.refOc || "",
          ocCandidates: full.ocCandidates || [],
        },
        createdAt: serverTimestamp(),
        createdBy: actorName.value,
      });

      await addHist("upload_split", {
        fromStagingId: s.id,
        docId,
        tipo: s.tipo,
        numero: s.numero,
        parentName: s.parentName
      });
    }

    uploadProgress.value = 100;
    uploadStatus.value = "Listo  Lote subido correctamente";

    await clearStaging();
    tab.value = "cloud";
  } finally {
    setTimeout(() => {
      uploadBusy.value = false;
      uploadProgress.value = 0;
      uploadStatus.value = "";
      uploadBytesDone.value = 0;
      uploadBytesTotal.value = 0;
    }, 450);
  }
}

function selectDoc(d) {
  selectedDocId.value = d.id;

  if (!leftDocId.value) {
    leftDocId.value = d.id;
  } else if (!rightDocId.value && d.id !== leftDocId.value) {
    rightDocId.value = d.id;
  } else {
    leftDocId.value = d.id;
  }
}

function swapSides() {
  const tmp = leftDocId.value;
  leftDocId.value = rightDocId.value;
  rightDocId.value = tmp;
}



function openCreateLoteModal() {
  newLoteNombre.value = "";
  createLoteModal.show();
}

async function createLote() {
  const payload = {
    nombre: newLoteNombre.value.trim() || `Lote ${new Date().toISOString().slice(0, 10)}`,
    createdAt: serverTimestamp(),
    createdBy: actorName.value,
    estado: "pendiente",
  };

  const refDoc = await addDoc(collection(db, "lotes_docs"), payload);
  selectedLoteId.value = refDoc.id;

  createLoteModal.hide();
  onChangeLote();
  await addHist("lote_create", { nombre: payload.nombre });
}

async function addHist(tipo, detalle) {
  if (!selectedLoteId.value) return;
  await addDoc(collection(db, "lotes_docs", selectedLoteId.value, "historial"), {
    tipo,
    detalle,
    at: serverTimestamp(),
    by: actorName.value,
  });
}

function onChangeLote() {
  docs.value = [];
  selectedDocId.value = null;
  leftDocId.value = "";
  rightDocId.value = "";

  if (unsubDocs) unsubDocs();

  const qD = query(collection(db, "lotes_docs", selectedLoteId.value, "docs"), orderBy("createdAt", "desc"));
  unsubDocs = onSnapshot(qD, (snap) => {
    docs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
}
</script>

<style scoped>
.bg-light-subtle { background: rgba(0,0,0,.03); }


.busy-overlay{
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(6px);
}

.busy-card{
  width: min(560px, 94vw);
  background: #fff;
  border-radius: 18px;
  padding: 18px 18px 14px;
}

.busy-icon{
  width: 44px;
  height: 44px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius: 14px;
  background: rgba(0,0,0,.03);
}

.busy-tip{
  opacity: .85;
}


.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
