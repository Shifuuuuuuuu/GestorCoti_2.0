<!-- src/views/RecepcionOC.vue -->
<template>
  <div class="container-fluid py-3">

    <!-- Busy overlay -->
    <div v-if="busy.on" class="busy-overlay">
      <div class="busy-card shadow">
        <div class="d-flex align-items-center gap-3">
          <div class="spinner-border text-danger" role="status" aria-label="Cargando"></div>
          <div class="flex-grow-1">
            <div class="fw-semibold">{{ busy.label }}</div>
            <div class="text-muted small" v-if="busy.hint">{{ busy.hint }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0">Recepción OC Casa Matriz</h4>
        <small class="text-muted">
          OCs desde <b>Empresa</b>y <b>Taller</b>. Filtra por estatus y revisa ítems.
        </small>
      </div>

      <div class="d-flex gap-2 flex-wrap align-items-center">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-dark" :class="{active: source==='empresa'}" @click="source='empresa'">
            Empresa
          </button>
          <button class="btn btn-outline-dark" :class="{active: source==='taller'}" @click="source='taller'">
            Taller
          </button>
        </div>

        <select v-model="statusFiltro" class="form-select form-select-sm" style="width: 280px" title="Filtrar por estatus">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>

        <!-- pageSize SOLO afecta el “listado normal”. La búsqueda trae resultados aunque no estén en el pageSize -->
        <select v-model.number="pageSize" class="form-select form-select-sm" style="width: 120px" title="Cantidad">
          <option v-for="n in [10,20,30,40,50]" :key="n" :value="n">{{ n }}</option>
        </select>

        <button class="btn btn-outline-secondary btn-sm" @click="reload">
          <i class="bi bi-arrow-clockwise me-1"></i>Actualizar
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="row g-3">
      <!-- Lista -->
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm h-100">
          <div class="card-header d-flex align-items-center justify-content-between gap-2">
            <div class="fw-semibold">
              Lista OCs
              <span class="text-muted">({{ filteredList.length }})</span>
              <span v-if="isSearchMode" class="badge text-bg-info text-dark ms-2">
                Buscando (servidor)
              </span>
            </div>

            <!-- Buscador -->
            <div class="d-flex align-items-center gap-2" style="min-width: 220px; max-width: 360px; width: 100%;">
              <div class="input-group input-group-sm">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  ref="searchInputEl"
                  v-model="searchOc"
                  type="text"
                  class="form-control"
                  placeholder="Buscar: OC 63057 / 63057 / DIMACOT / PDF…"
                  @keyup.enter.prevent="onSearchEnter"
                />
                <button
                  v-if="searchOc"
                  class="btn btn-outline-secondary"
                  type="button"
                  title="Limpiar"
                  @click="clearSearch"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>

              <span class="badge text-bg-dark text-nowrap">{{ statusFiltro }}</span>
            </div>
          </div>

          <div class="card-body p-2">
            <div v-if="loadingList" class="p-3">
              <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm text-danger"></div>
                <div class="text-muted small">Cargando órdenes…</div>
              </div>
            </div>

            <div v-else>
              <div v-if="isSearchMode && searchingServer" class="px-2 py-2">
                <div class="d-flex align-items-center gap-2 small text-muted">
                  <span class="spinner-border spinner-border-sm text-danger"></span>
                  Buscando…
                </div>
              </div>

              <div v-if="filteredList.length===0" class="text-muted text-center py-4">
                <template v-if="!searchOc">
                  No hay OCs con estatus <b>{{ statusFiltro }}</b>.
                </template>
                <template v-else>
                  No hay resultados para <b>"{{ searchOc }}"</b>.
                  <div class="small mt-2">
                    Tip: prueba con <b>OC 63353</b>, <b>63353</b>, <b>DIMACOT</b> o <b>OC 63353 DIMACOT.pdf</b>.
                  </div>
                </template>
              </div>

              <div v-else class="list-group list-wrap">
                <button
                  v-for="o in filteredList"
                  :key="o.id"
                  type="button"
                  class="list-group-item list-group-item-action position-relative"
                  :class="{active: selectedId===o.id}"
                  @click="selectOc(o)"
                >
                  <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="me-2">
                      <div class="d-flex gap-2 flex-wrap align-items-center">
                        <span class="badge text-bg-primary">OC {{ ocNumero(o) }}</span>
                        <span class="badge text-bg-secondary" v-if="o.empresa">{{ o.empresa }}</span>
                        <span class="badge text-bg-dark">{{ (o.estatus||'').toString() }}</span>
                      </div>

                      <div class="fw-semibold mt-1 text-truncate" style="max-width: 320px;">
                        {{ o.archivoOC?.nombre || o.archivoOC?.name || o.nombre || "Orden de compra" }}
                      </div>

                      <small class="text-muted d-block text-truncate" style="max-width: 320px;">
                        Centro: {{ o.centroCostoNombre || o.centroCostoTexto || o.centroCosto || "—" }}
                      </small>

                      <small class="text-muted d-block" v-if="o.numero_solped || o.numero_solpe">
                        SOLPED: {{ o.numero_solped || o.numero_solpe }}
                      </small>
                    </div>

                    <div class="text-end small">
                      <div class="text-muted">{{ o.responsable || o.aprobadoPor || "—" }}</div>
                      <div class="text-muted">{{ o._fechaText || "" }}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle -->
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm h-100">
          <div class="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div class="fw-semibold d-flex align-items-center gap-2 flex-wrap">
              Detalle recepción
              <span v-if="currentOc" class="badge text-bg-primary">OC {{ ocNumero(currentOc) }}</span>
              <span v-if="currentOc" class="badge text-bg-dark">{{ currentOc.estatus }}</span>
              <span v-if="currentOc && currentOc.solpedId" class="badge text-bg-secondary">Con SOLPED</span>
              <span v-else-if="currentOc" class="badge text-bg-warning text-dark">Sin SOLPED</span>
            </div>

            <div class="d-flex gap-2 align-items-center flex-wrap">
              <a
                v-if="currentOc?.archivoOC?.url"
                class="btn btn-outline-dark btn-sm"
                :href="currentOc.archivoOC.url"
                target="_blank"
                rel="noopener"
              >
                <i class="bi bi-file-earmark-pdf me-1"></i>Ver OC
              </a>

              <button
                v-if="currentOc && (itemsUI.length>0)"
                class="btn btn-success btn-sm"
                :disabled="!canFinalize"
                @click="finalizeRecepcion"
              >
                <i class="bi bi-check2-circle me-1"></i>Finalizar recepción
              </button>
            </div>
          </div>

          <div class="card-body">
            <div v-if="!currentOc" class="text-muted text-center py-5">
              Selecciona una OC de la lista.
            </div>

            <template v-else>
              <!-- Bloque info -->
              <div class="row g-2">
                <div class="col-12 col-xl-6">
                  <div class="border rounded p-3 bg-light-subtle">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div class="fw-semibold">Información</div>
                        <div class="small text-muted">Colección: {{ currentCollectionLabel }}</div>
                      </div>
                      <span class="badge text-bg-secondary" v-if="currentOc.tipoCompra">{{ currentOc.tipoCompra }}</span>
                    </div>

                    <div class="mt-2 small">
                      <div><span class="text-muted">Responsable:</span> {{ currentOc.responsable || "—" }}</div>
                      <div><span class="text-muted">Centro costo:</span> {{ currentOc.centroCostoNombre || currentOc.centroCostoTexto || currentOc.centroCosto || "—" }}</div>
                      <div><span class="text-muted">Contrato:</span> {{ currentOc.numero_contrato || currentOc.numero_interno || "—" }}</div>
                      <div><span class="text-muted">Comentario:</span> {{ currentOc.comentario || "—" }}</div>
                      <div><span class="text-muted">SOLPED:</span> {{ currentOc.numero_solped || currentOc.numero_solpe || "—" }}</div>
                    </div>

                    <div class="mt-3">
                      <div class="small text-muted mb-1">Cotizaciones/adjuntos:</div>
                      <div v-if="Array.isArray(currentOc.archivosStorage) && currentOc.archivosStorage.length" class="d-flex flex-column gap-1">
                        <a
                          v-for="(a,idx) in currentOc.archivosStorage"
                          :key="idx"
                          class="btn btn-outline-secondary btn-sm text-start"
                          :href="a.url"
                          target="_blank"
                          rel="noopener"
                        >
                          <i class="bi bi-paperclip me-2"></i>{{ a.nombre || a.name || "Archivo" }}
                        </a>
                      </div>
                      <div v-else class="text-muted small">Sin adjuntos</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-xl-6">
                  <div class="border rounded p-3">
                    <div class="fw-semibold">Estado automático por “Recibido”</div>
                    <div class="small text-muted">
                      Regla: <b>0</b> → No llegó · <b>1..(cotizado-1)</b> → Parcial · <b>cotizado</b> → Completa.
                    </div>

                    <div v-if="itemsUI.length===0" class="mt-3">
                      <div class="alert alert-warning mb-0">
                        Esta OC no tiene ítems (o vienen vacíos). Aquí solo puedes cambiar el estatus.
                      </div>

                      <div class="mt-2 d-flex flex-wrap gap-2 align-items-center">
                        <select v-model="statusOnlyValue" class="form-select form-select-sm" style="width: 340px;">
                          <option :value="ESTADO_ENVIADA">{{ ESTADO_ENVIADA }}</option>
                          <option :value="ESTADO_PARTIAL">{{ ESTADO_PARTIAL }}</option>
                          <option :value="ESTADO_OK">{{ ESTADO_OK }}</option>
                        </select>

                        <button class="btn btn-outline-primary btn-sm" @click="updateStatusOnly">
                          Guardar estatus
                        </button>
                      </div>

                      <div class="mt-2">
                        <label class="form-label small text-muted mb-1">Comentario (opcional)</label>
                        <input v-model="statusOnlyNota" class="form-control form-control-sm" placeholder="Ej: sin ítems, solo cambio estatus…" />
                      </div>
                    </div>

                    <div v-else class="mt-3">
                      <div class="d-flex gap-2 flex-wrap align-items-center">
                        <span class="badge text-bg-success">Completas: {{ countEstado('completa') }}</span>
                        <span class="badge text-bg-warning text-dark">Parciales: {{ countEstado('parcial') }}</span>
                        <span class="badge text-bg-danger">No llegó: {{ countEstado('no_llego') }}</span>
                        <span class="badge text-bg-dark">Final: {{ calcFinalEstatusFromItems() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tabla ítems -->
              <div v-if="itemsUI.length>0" class="mt-3">
                <div class="table-responsive">
                  <table class="table table-sm align-middle">
                    <thead>
                      <tr class="text-muted">
                        <th style="min-width: 320px;">Ítem</th>
                        <th class="text-end" style="width: 120px;">Cotizado</th>
                        <th class="text-end" style="width: 160px;">Recibido</th>
                        <th style="width: 200px;">Estado recepción</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="it in itemsUI" :key="it.key">
                        <td>
                          <div class="fw-semibold">{{ it.descripcion || it.nombre || "Ítem" }}</div>
                          <div class="text-muted small">
                            {{ it.codigo_referencial || it.codigo || it.numero_interno || "" }}
                          </div>
                        </td>

                        <td class="text-end fw-semibold">
                          {{ fmtNum(it.qtyBase) }}
                        </td>

                        <td class="text-end">
                          <input
                            :ref="el => setQtyRef(it.key, el)"
                            type="number"
                            class="form-control form-control-sm text-end"
                            style="max-width: 160px; margin-left:auto;"
                            :min="0"
                            :max="it.qtyBase"
                            :value="getQty(it.key)"
                            @input="onQtyInput(it, $event)"
                            @change="onQtyCommit(it)"
                            @keyup.enter.prevent="advanceQty(it.key)"
                          />
                          <div class="small text-muted mt-1">
                            <span class="badge" :class="qtyBadge(it)">
                              {{ qtyHint(it) }}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span class="badge" :class="estadoBadge(itemEstado(it.key, it.qtyBase))">
                            {{ labelEstado(itemEstado(it.key, it.qtyBase)) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="small text-muted">
                  Tip: escribe la cantidad y presiona <b>Enter</b> para pasar al siguiente ítem.
                </div>
              </div>

            </template>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  arrayUnion,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "../stores/firebase";
import { useAuthStore } from "../stores/authService";

const auth = useAuthStore();

const actorName = computed(
  () =>
    auth?.profile?.Nombre_completo ||
    auth?.profile?.nombre ||
    auth?.user?.displayName ||
    auth?.user?.email ||
    "usuario"
);

// ===== Estados =====
const ESTADO_ENVIADA = "Enviada a proveedor";
const ESTADO_PARTIAL = "Recepcion parcial en casa matriz";
const ESTADO_OK      = "Recepcion completa en casa matriz";

// Colecciones
const COL_EMPRESA = "ordenes_oc";
const COL_TALLER  = "ordenes_oc_taller";

// Opciones UI
const statusOptions = [ESTADO_ENVIADA, ESTADO_PARTIAL, ESTADO_OK];
const statusFiltro = ref(ESTADO_ENVIADA);

// ===== UI State =====
const busy = ref({ on: false, label: "", hint: "" });
function setBusy(on, label = "", hint = "") {
  busy.value = { on, label, hint };
}

const source = ref("empresa"); // 'empresa' | 'taller'
const pageSize = ref(20);

const loadingList = ref(false);
const listEmpresa = ref([]);
const listTaller = ref([]);

const selectedId = ref("");

// ===== Buscador =====
const searchOc = ref("");
const searchInputEl = ref(null);

// ===== Search server =====
const searchingServer = ref(false);
const serverEmpresa = ref([]);
const serverTaller = ref([]);

// Cache de búsqueda
const SEARCH_CACHE_TTL_MS = 90_000;
const _searchCache = ref({ key: "", ts: 0, empresa: [], taller: [] });

// límites
const SEARCH_LIMIT = 120;
const SCAN_LIMIT = 900;

function normalizeText(s) {
  return String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractDigits(s) {
  const m = String(s || "").match(/\d{2,}/g);
  if (!m || !m.length) return "";
  m.sort((a, b) => b.length - a.length);
  return m[0] || "";
}

function stripExt(s) {
  return String(s || "").replace(/\.(pdf|png|jpg|jpeg)$/i, "").trim();
}

function ensurePdfName(name) {
  const n = String(name || "").trim();
  if (!n) return "";
  return /\.pdf$/i.test(n) ? n : `${n}.pdf`;
}

function clearSearch() {
  searchOc.value = "";
  nextTick(() => searchInputEl.value?.focus?.());
}

const isSearchMode = computed(() => normalizeText(searchOc.value).length >= 2);

function onSearchEnter() {
  if (filteredList.value.length === 1) selectOc(filteredList.value[0]);
}

// ===== Colección actual =====
const currentCollection = computed(() => (source.value === "empresa" ? COL_EMPRESA : COL_TALLER));
const currentCollectionLabel = computed(() => (source.value === "empresa" ? "Empresa" : "Taller"));

// ===== Helpers UI =====
function safeDateText(ts) {
  try {
    if (!ts) return "";
    if (typeof ts === "string") return new Date(ts).toLocaleString();
    if (ts?.toDate) return ts.toDate().toLocaleString();
    return "";
  } catch {
    return "";
  }
}

function normalizeDocForUI(docSnap) {
  const data = docSnap.data() || {};
  const docId = docSnap.id;
  const numericId = data.id;

  return {
    ...data,
    id: docId,
    __docId: docId,
    idNumero: numericId,
    _fechaText: safeDateText(data.fechaSubida || data.createdAt || data.updatedAt || null),
  };
}

function ocNumero(o) {
  const idNum = o?.idNumero;
  if (typeof idNum === "number") return String(idNum);
  if (typeof idNum === "string" && idNum.trim()) return idNum.trim();

  const n = o?.numero;
  if (n != null && String(n).trim() !== "") return String(n).trim();

  const from = o?.numero_oc;
  if (from != null && String(from).trim() !== "") return String(from).trim();

  return (o?.id || "").slice(0, 6);
}

// ===== Subscriptions (listado normal) =====
let unsubEmpresa = null;
let unsubTaller = null;

function stopSubs() {
  if (unsubEmpresa) { unsubEmpresa(); unsubEmpresa = null; }
  if (unsubTaller) { unsubTaller(); unsubTaller = null; }
}

function subscribeAll() {
  stopSubs();
  loadingList.value = true;

  const qEmpresa = query(
    collection(db, COL_EMPRESA),
    where("estatus", "==", statusFiltro.value),
    orderBy("fechaSubida", "desc"),
    limit(pageSize.value)
  );

  const qTaller = query(
    collection(db, COL_TALLER),
    where("estatus", "==", statusFiltro.value),
    orderBy("fechaSubida", "desc"),
    limit(pageSize.value)
  );

  unsubEmpresa = onSnapshot(
    qEmpresa,
    (snap) => {
      listEmpresa.value = snap.docs.map(normalizeDocForUI);
      loadingList.value = false;
      autoPickFirstIfMissing();
    },
    (e) => {
      console.error("Error snapshot empresa:", e);
      loadingList.value = false;
    }
  );

  unsubTaller = onSnapshot(
    qTaller,
    (snap) => {
      listTaller.value = snap.docs.map(normalizeDocForUI);
      loadingList.value = false;
      autoPickFirstIfMissing();
    },
    (e) => {
      console.error("Error snapshot taller:", e);
      loadingList.value = false;
    }
  );
}

function reload() {
  subscribeAll();
  if (isSearchMode.value) runServerSearchDebounced(true);
}

function autoPickFirstIfMissing() {
  if (searchOc.value) return;

  const base = baseList.value;
  if (selectedId.value && base.some(x => x.id === selectedId.value)) return;

  const first = base[0];
  selectedId.value = first?.id || "";
}

onMounted(() => subscribeAll());
onBeforeUnmount(() => stopSubs());

watch([statusFiltro, pageSize], () => {
  selectedId.value = "";
  subscribeAll();
  if (isSearchMode.value) runServerSearchDebounced(true);
});

// ===== Server Search =====
let _searchTimer = null;
let _searchToken = 0;

function runServerSearchDebounced(immediate = false) {
  if (_searchTimer) clearTimeout(_searchTimer);

  if (immediate) {
    runServerSearch().catch(console.error);
    return;
  }

  _searchTimer = setTimeout(() => {
    runServerSearch().catch(console.error);
  }, 320);
}

watch(searchOc, () => {
  const q = normalizeText(searchOc.value);
  if (!q) {
    serverEmpresa.value = [];
    serverTaller.value = [];
    return;
  }
  runServerSearchDebounced(false);
});

async function safeTryQuery(q) {
  try {
    return await getDocs(q);
  } catch (e) {
    console.warn("Query ignorada (probable índice faltante):", e?.message || e);
    return null;
  }
}

function buildArchivoNombreVariants(raw) {
  const out = new Set();
  const r = String(raw || "").trim();
  if (!r) return [];

  const base = stripExt(r);
  const norm = normalizeText(base);
  const digits = extractDigits(norm) || extractDigits(r);

  out.add(r);
  out.add(base);
  out.add(ensurePdfName(base));
  out.add(ensurePdfName(r));

  if (digits) {
    out.add(digits);
    out.add(`OC ${digits}`);
    out.add(`OC ${digits}.pdf`);

    if (norm.includes(digits)) {
      const tail = base
        .replace(new RegExp(`\\b${digits}\\b`, "i"), "")
        .replace(/^oc\s*/i, "")
        .trim();

      if (tail) {
        out.add(`OC ${digits} ${tail}`);
        out.add(`OC ${digits} ${tail}.pdf`);
      }
    }
  }

  return Array.from(out).map(x => String(x).trim()).filter(Boolean).slice(0, 14);
}

function buildPrefixCandidates(raw) {
  const out = new Set();
  const r = String(raw || "").trim();
  if (!r) return [];

  const base = stripExt(r).trim();
  out.add(base);
  out.add(base.toUpperCase());
  out.add(base.toLowerCase());

  const digits = extractDigits(base);
  if (digits) {
    out.add(`OC ${digits}`);
    out.add(`OC ${digits}`.toUpperCase());
    out.add(`oc ${digits}`.toLowerCase());
  }

  if (base.length >= 3) out.add(base);

  return Array.from(out).map(x => String(x).trim()).filter(x => x.length >= 2).slice(0, 10);
}

function docMatchesContains(docData, qNorm) {
  const blob = normalizeText([
    docData?.archivoOC?.nombre,
    docData?.archivoOC?.name,
    docData?.nombre,
    ocNumero(docData),
    docData?.idNumero,
    docData?.numero_oc,
    docData?.numero,
    docData?.numero_solped,
    docData?.numero_solpe,
    docData?.solpedId,
    docData?.empresa,
    docData?.estatus,
    docData?.responsable,
    docData?.aprobadoPor,
    docData?.centroCostoNombre,
    docData?.centroCostoTexto,
    docData?.centroCosto,
    docData?.numero_contrato,
    docData?.numero_interno,
  ].filter(Boolean).join(" | "));

  return blob.includes(qNorm);
}

async function searchInCollection(colName, termRaw, status) {
  const term = String(termRaw || "").trim();
  const qNorm = normalizeText(term);
  if (!qNorm) return [];

  const digits = extractDigits(term);
  const hasNum = !!digits;

  const merged = new Map();

  const addSnap = (snap) => {
    if (!snap?.docs?.length) return;
    snap.docs.forEach(d => {
      if (!merged.has(d.id)) merged.set(d.id, normalizeDocForUI(d));
    });
  };

  const nameVariants = buildArchivoNombreVariants(term);
  for (const v of nameVariants) {
    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("archivoOC.nombre", "==", v),
      limit(SEARCH_LIMIT)
    )));
    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("archivoOC.name", "==", v),
      limit(SEARCH_LIMIT)
    )));
  }

  if (hasNum) {
    const n = Number(digits);

    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("id", "==", n),
      limit(SEARCH_LIMIT)
    )));
    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("id", "==", digits),
      limit(SEARCH_LIMIT)
    )));

    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("numero_oc", "==", n),
      limit(SEARCH_LIMIT)
    )));
    addSnap(await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      where("numero_oc", "==", digits),
      limit(SEARCH_LIMIT)
    )));
  }

  const prefixes = buildPrefixCandidates(term);
  for (const pfx of prefixes) {
    const snap = await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      orderBy("archivoOC.nombre"),
      startAt(pfx),
      endAt(pfx + "\uf8ff"),
      limit(SEARCH_LIMIT)
    ));
    addSnap(snap);
  }

  if (merged.size < 6) {
    let snap = await safeTryQuery(query(
      collection(db, colName),
      where("estatus", "==", status),
      orderBy("fechaSubida", "desc"),
      limit(SCAN_LIMIT)
    ));

    if (!snap) {
      snap = await safeTryQuery(query(
        collection(db, colName),
        where("estatus", "==", status),
        limit(SCAN_LIMIT)
      ));
    }

    if (snap?.docs?.length) {
      for (const d of snap.docs) {
        if (merged.has(d.id)) continue;
        const normed = normalizeDocForUI(d);
        if (docMatchesContains(normed, qNorm)) {
          merged.set(d.id, normed);
          if (merged.size >= SEARCH_LIMIT) break;
        }
      }
    }
  }

  const arr = Array.from(merged.values());
  arr.sort((a, b) => {
    const ta = (a?.fechaSubida?.toMillis?.() ?? 0) || (a?.createdAt?.toMillis?.() ?? 0) || 0;
    const tb = (b?.fechaSubida?.toMillis?.() ?? 0) || (b?.createdAt?.toMillis?.() ?? 0) || 0;
    return tb - ta;
  });

  return arr;
}

async function runServerSearch() {
  const q = normalizeText(searchOc.value);
  if (!q || q.length < 2) {
    serverEmpresa.value = [];
    serverTaller.value = [];
    return;
  }

  const token = ++_searchToken;

  const cacheKey = `${statusFiltro.value}|${q}`;
  const now = Date.now();
  const fresh =
    (_searchCache.value.key === cacheKey) &&
    ((now - (_searchCache.value.ts || 0)) < SEARCH_CACHE_TTL_MS);

  if (fresh) {
    serverEmpresa.value = _searchCache.value.empresa || [];
    serverTaller.value = _searchCache.value.taller || [];
    // 👇 igual aplica auto-switch aunque venga cache
    autoSwitchSourceIfNeeded(serverEmpresa.value, serverTaller.value);
    ensureSelectionValidForCurrentBase();
    return;
  }

  searchingServer.value = true;
  try {
    const [emp, tal] = await Promise.all([
      searchInCollection(COL_EMPRESA, searchOc.value, statusFiltro.value),
      searchInCollection(COL_TALLER, searchOc.value, statusFiltro.value),
    ]);

    if (token !== _searchToken) return;

    serverEmpresa.value = emp;
    serverTaller.value = tal;

    _searchCache.value = {
      key: cacheKey,
      ts: now,
      empresa: emp,
      taller: tal,
    };

    // ✅ AUTO-CAMBIO: si en la pestaña actual no hay resultados, pero en la otra sí, se cambia solo
    autoSwitchSourceIfNeeded(emp, tal);

    // ✅ asegurar selección válida para la pestaña actual (y cargar recepción)
    ensureSelectionValidForCurrentBase();
  } finally {
    if (token === _searchToken) searchingServer.value = false;
  }
}

/** ✅ Cambia source automáticamente si solo hay resultados en el otro */
function autoSwitchSourceIfNeeded(empArr, talArr) {
  if (!isSearchMode.value) return;

  const empCount = Array.isArray(empArr) ? empArr.length : 0;
  const talCount = Array.isArray(talArr) ? talArr.length : 0;

  if (source.value === "empresa" && empCount === 0 && talCount > 0) {
    source.value = "taller";
  } else if (source.value === "taller" && talCount === 0 && empCount > 0) {
    source.value = "empresa";
  }
}

/** ✅ Si selectedId no existe en baseList actual, toma el primero */
function ensureSelectionValidForCurrentBase() {
  const base = baseList.value;
  if (!Array.isArray(base) || base.length === 0) {
    selectedId.value = "";
    return;
  }

  if (!selectedId.value || !base.some(x => x.id === selectedId.value)) {
    selectedId.value = base[0].id;
  }

  // cargar recepcion (por si cambió de doc)
  nextTick(() => loadRecepcionFromExisting());
}

// ===== Lista base según source =====
const baseList = computed(() => {
  const normal = source.value === "empresa" ? listEmpresa.value : listTaller.value;
  const server = source.value === "empresa" ? serverEmpresa.value : serverTaller.value;
  return isSearchMode.value ? server : normal;
});

const filteredList = computed(() => {
  const qn = normalizeText(searchOc.value);
  if (!qn) return baseList.value;
  return baseList.value.filter((o) => docMatchesContains(o, qn));
});

const currentOc = computed(() => baseList.value.find(x => x.id === selectedId.value) || null);

function selectOc(o) {
  selectedId.value = o.id;
  loadRecepcionFromExisting();
}

// ===== Items / Recepción =====
const recepcionQty = ref({});
const qtyRefs = ref(new Map());

function setQtyRef(key, el) {
  if (!key || !el) return;
  qtyRefs.value.set(key, el);
}

function getQty(key) {
  const v = recepcionQty.value[key];
  if (v == null || !Number.isFinite(Number(v))) return 0;
  return Number(v);
}

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function itemEstado(key, base) {
  const qty = getQty(key);
  const b = Number(base ?? 0);
  if (qty <= 0) return "no_llego";
  if (qty >= b) return "completa";
  return "parcial";
}

function labelEstado(s) {
  if (s === "completa") return "Completa";
  if (s === "parcial") return "Parcial";
  return "No llegó";
}

function estadoBadge(s) {
  if (s === "completa") return "text-bg-success";
  if (s === "parcial") return "text-bg-warning text-dark";
  return "text-bg-danger";
}

function fmtNum(n) {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? String(v) : "0";
}

const itemsUI = computed(() => {
  const oc = currentOc.value;
  const items = Array.isArray(oc?.items) ? oc.items : [];

  return items.map((it, idx) => {
    const key = String(it.__tempId || it.key || it.descripcion || it.nombre || it.codigo_referencial || it.codigo || idx);
    const qtyBaseRaw =
      it.cantidad_cotizada ??
      it.cantidad ??
      it.cantidad_para_cotizar ??
      it.cantidad_solicitada_oc ??
      0;

    const qtyBase = Number(qtyBaseRaw ?? 0);

    return {
      ...it,
      key,
      qtyBase: Number.isFinite(qtyBase) ? qtyBase : 0,
      descripcion: it.descripcion || it.nombre || "",
    };
  });
});

function qtyBadge(it) {
  const st = itemEstado(it.key, it.qtyBase);
  if (st === "completa") return "text-bg-success";
  if (st === "parcial") return "text-bg-warning text-dark";
  return "text-bg-danger";
}

function qtyHint(it) {
  const st = itemEstado(it.key, it.qtyBase);
  const qty = getQty(it.key);
  if (st === "completa") return `OK (${qty}/${it.qtyBase})`;
  if (st === "parcial") return `Parcial (${qty}/${it.qtyBase})`;
  return `No llegó (${qty}/${it.qtyBase})`;
}

function onQtyInput(it, ev) {
  const raw = ev?.target?.value;
  const v = clamp(raw, 0, it.qtyBase);
  recepcionQty.value = { ...recepcionQty.value, [it.key]: v };
}

function onQtyCommit(it) {
  const v = clamp(getQty(it.key), 0, it.qtyBase);
  recepcionQty.value = { ...recepcionQty.value, [it.key]: v };

  if (v === 0 || v === Number(it.qtyBase ?? 0)) {
    setTimeout(() => advanceQty(it.key), 0);
  }
}

function advanceQty(currentKey) {
  const keys = itemsUI.value.map(x => x.key);
  const idx = keys.indexOf(currentKey);
  const nextKey = idx >= 0 ? keys[idx + 1] : null;

  if (nextKey) {
    const el = qtyRefs.value.get(nextKey);
    if (el && typeof el.focus === "function") {
      el.focus();
      el.select?.();
    }
  }
}

// ===== Recepción previa =====
function loadRecepcionFromExisting() {
  const oc = currentOc.value;
  if (!oc) return;

  const existing = oc?.recepcionCasaMatriz?.items;
  if (Array.isArray(existing) && existing.length) {
    const map = {};
    for (const r of existing) {
      if (!r?.key) continue;
      const base = Number(r.baseCotizada ?? 0);
      const rec = clamp(r.recibido ?? 0, 0, base > 0 ? base : 999999);
      map[String(r.key)] = rec;
    }
    recepcionQty.value = map;
    return;
  }

  const map = {};
  for (const it of itemsUI.value) map[it.key] = 0;
  recepcionQty.value = map;
}

watch(
  () => selectedId.value,
  () => {
    recepcionQty.value = {};
    setTimeout(loadRecepcionFromExisting, 0);
  }
);

// ===== Contadores / final estatus =====
function countEstado(st) {
  return itemsUI.value.filter(it => itemEstado(it.key, it.qtyBase) === st).length;
}

function calcFinalEstatusFromItems() {
  if (itemsUI.value.length === 0) return currentOc.value?.estatus || ESTADO_ENVIADA;
  const allComplete = itemsUI.value.every(it => itemEstado(it.key, it.qtyBase) === "completa");
  return allComplete ? ESTADO_OK : ESTADO_PARTIAL;
}

const canFinalize = computed(() => {
  if (!currentOc.value) return false;
  if (itemsUI.value.length === 0) return false;
  return true;
});

function buildRecepcionPayload() {
  const nowIso = new Date().toISOString();
  const items = itemsUI.value.map(it => {
    const recibido = clamp(getQty(it.key), 0, it.qtyBase);
    const estado = itemEstado(it.key, it.qtyBase);
    return {
      key: it.key,
      descripcion: it.descripcion || it.nombre || "",
      baseCotizada: it.qtyBase,
      recibido,
      estado,
      updatedAtIso: nowIso,
    };
  });

  return {
    items,
    updatedAt: serverTimestamp(),
    updatedBy: actorName.value,
  };
}

function buildHistorialEntry(estatus, comentario = "") {
  return {
    estatus: String(estatus || ""),
    comentario: String(comentario || ""),
    fecha: new Date().toISOString(),
    usuario: actorName.value,
  };
}

// ===== SOLPED trazabilidad =====
async function updateSolpedTrazabilidad(ocDoc, nuevoEstatus, colName) {
  const solpedStatus = (nuevoEstatus === ESTADO_OK)
    ? "Pedido en Casa matriz"
    : "Parcial, Pedido en Casa matriz";

  const isTaller = (String(colName || "") === COL_TALLER);
  const solpedCollection = isTaller ? "solpes_taller" : "solpes";

  let solpedRef = null;

  const solpedId = ocDoc?.solpedId;
  if (solpedId) {
    const candidate = doc(db, solpedCollection, String(solpedId));
    try {
      const snap = await getDoc(candidate);
      if (snap.exists()) solpedRef = candidate;
    } catch (e) {
      console.warn("No se pudo verificar solpedId:", e);
    }
  }

  if (!solpedRef) {
    const num = ocDoc?.numero_solped ?? ocDoc?.numero_solpe;
    if (num != null && String(num).trim() !== "") {
      const q1 = query(collection(db, solpedCollection), where("numero_solpe", "==", num), limit(1));
      const s1 = await getDocs(q1);
      if (!s1.empty) solpedRef = doc(db, solpedCollection, s1.docs[0].id);
      else {
        const q2 = query(collection(db, solpedCollection), where("numero_solped", "==", num), limit(1));
        const s2 = await getDocs(q2);
        if (!s2.empty) solpedRef = doc(db, solpedCollection, s2.docs[0].id);
      }
    }
  }

  if (!solpedRef) return;

  await updateDoc(solpedRef, {
    estatus: solpedStatus,
    updatedAt: serverTimestamp(),
    updatedBy: actorName.value,
  });

  await addDoc(collection(solpedRef, "historialEstados"), {
    estatus: solpedStatus,
    fecha: new Date().toISOString(),
    usuario: actorName.value,
    coleccion: String(colName || ""),
    idNumero: (ocDoc?.idNumero != null ? ocDoc.idNumero : null),
  });
}

// ===== Finalizar recepción =====
async function finalizeRecepcion() {
  if (!currentOc.value) return;

  const colName = currentCollection.value;
  const ocDoc = currentOc.value;
  const nuevoEstatus = calcFinalEstatusFromItems();

  try {
    setBusy(true, "Finalizando…", "Guardando recepción y cambiando estatus");

    const ocRef = doc(db, colName, String(ocDoc.__docId || ocDoc.id));

    await updateDoc(ocRef, {
      estatus: nuevoEstatus,
      recepcionCasaMatriz: {
        ...buildRecepcionPayload(),
        finalizadaAt: serverTimestamp(),
        finalizadaBy: actorName.value,
        finalEstatus: nuevoEstatus,
      },
      historial: arrayUnion(buildHistorialEntry(nuevoEstatus, "Recepción Casa Matriz")),
      updatedAt: serverTimestamp(),
      updatedBy: actorName.value,
    });

    await updateSolpedTrazabilidad(ocDoc, nuevoEstatus, colName);

    const arr = filteredList.value.length ? filteredList.value : baseList.value;
    const idx = arr.findIndex(x => x.id === ocDoc.id);
    const next = idx >= 0 ? (arr[idx + 1] || arr[0]) : arr[0];
    selectedId.value = next?.id || "";
  } catch (e) {
    console.error(e);
    alert("Error finalizando recepción: " + (e?.message || String(e)));
  } finally {
    setBusy(false);
  }
}

// ===== Cambio de estatus solo (cuando no hay items) =====
const statusOnlyValue = ref(ESTADO_ENVIADA);
const statusOnlyNota = ref("");

watch(
  () => currentOc.value?.id,
  () => {
    statusOnlyValue.value = currentOc.value?.estatus || ESTADO_ENVIADA;
    statusOnlyNota.value = "";
  }
);

async function updateStatusOnly() {
  if (!currentOc.value) return;

  const ocDoc = currentOc.value;
  const colName = currentCollection.value;

  try {
    setBusy(true, "Actualizando…", "Guardando estatus");
    const ocRef = doc(db, colName, String(ocDoc.__docId || ocDoc.id));

    await updateDoc(ocRef, {
      estatus: statusOnlyValue.value,
      historial: arrayUnion(buildHistorialEntry(statusOnlyValue.value, statusOnlyNota.value.trim())),
      recepcionCasaMatriz: {
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
        nota: statusOnlyNota.value.trim(),
      },
      updatedAt: serverTimestamp(),
      updatedBy: actorName.value,
    });

    await updateSolpedTrazabilidad(ocDoc, statusOnlyValue.value, colName);
  } catch (e) {
    console.error(e);
    alert("Error guardando estatus: " + (e?.message || String(e)));
  } finally {
    setBusy(false);
  }
}
</script>

<style scoped>
.bg-light-subtle { background: rgba(0,0,0,.03); }

.list-wrap { max-height: 72vh; overflow: auto; }

.list-group-item.active {
  color: #111 !important;
  background: rgba(var(--bs-info-rgb), .14) !important;
  border-color: rgba(var(--bs-info-rgb), .35) !important;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(var(--bs-info-rgb), .22);
}
.list-group-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: var(--bs-primary);
}
.list-group-item:hover { background: rgba(var(--bs-primary-rgb), .08); }

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
