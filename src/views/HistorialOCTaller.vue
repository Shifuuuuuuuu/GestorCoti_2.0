<template>
  <div class="hist-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">Historial de Cotizaciones · Taller</h1>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" @click="toggleSidebar">
            <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"></i>
            <span class="d-none d-sm-inline ms-1">{{ showSidebar ? 'Ocultar filtros' : 'Mostrar filtros' }}</span>
          </button>
        </div>
      </div>

      <!-- Error global -->
      <div v-if="error" class="alert alert-danger d-flex align-items-center mb-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>{{ error }}</div>
      </div>

      <!-- Buscador exacto por N° OC -->
      <div class="card card-elevated mb-3">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">🔎 Buscar por N° de Cotización</div>
          <div class="small text-secondary">Búsqueda exacta</div>
        </div>
        <div class="card-body">
          <div class="row g-2">
            <div class="col-12 col-sm-9">
              <input type="number" class="form-control" v-model.number="numeroOC" @keyup.enter="buscarOCExacta" placeholder="Ej: 21">
            </div>
            <div class="col-12 col-sm-3 d-grid">
              <button class="btn btn-danger" @click="buscarOCExacta">
                <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-2"></span>
                Buscar
              </button>
            </div>
          </div>
          <div v-if="ocEncontrada" class="alert d-flex align-items-center mt-3">
            <div class="me-auto">
              <div class="fw-semibold">Resultado: N° {{ ocEncontrada.id ?? '—' }}</div>
              <div class="small ">
                {{ ocEncontrada.empresa }} · {{ ocEncontrada.centroCostoTexto || '—' }}
                · {{ fmtFecha(ocEncontrada.fechaSubida) }}
              </div>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="goOC(ocEncontrada)">Ver detalle</button>
          </div>
        </div>
      </div>

      <!-- Chips de filtros activos -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2" v-if="hasActiveFilters">
        <small class="text-secondary">Filtros:</small>

        <span v-if="filtroFecha" class="badge bg-light text-dark border">
          Fecha: {{ filtroFecha }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroFecha=''; applyFilters()"></button>
        </span>

        <span v-for="s in filtroEstatus" :key="'es-'+s" class="badge bg-light text-dark border">
          {{ s }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeEstatus(s)"></button>
        </span>

        <!-- Chips de centros -->
        <span v-for="code in selectedCentros" :key="'cc-'+code" class="badge bg-light text-dark border">
          {{ centrosCosto[code] || code }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeCentro(code)"></button>
        </span>

        <span v-if="centroSearch" class="badge bg-light text-dark border">
          Centro (texto): {{ centroSearch }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeCentroChip()"></button>
        </span>

        <span v-if="soloMias" class="badge bg-light text-dark border">
          Mis cotizaciones
          <button class="btn-close btn-close-white ms-2 small" @click="soloMias=false; applyFilters()"></button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
      </div>

      <!-- Segmento por empresa (solo “todas” en esta vista) -->
      <div class="mb-3">
        <div class="btn-group">
          <button class="btn" :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('todas')">Todas</button>
        </div>
      </div>

      <div class="row">
        <!-- Listado -->
        <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
          <div v-if="loading" class="loading-global">
            <div class="spinner-border me-2"></div> Cargando cotizaciones…
          </div>

          <template v-else>
            <!-- Paginación (superior) -->
            <nav v-if="totalPages > 1" class="mt-3 sticky-pager">
              <ul class="pagination justify-content-center mb-1">
                <li class="page-item" :class="{disabled: page===1}">
                  <button class="page-link" @click="prevPage" :disabled="page===1">Anterior</button>
                </li>
                <li class="page-item" :class="{disabled: page===totalPages}">
                  <button class="page-link" @click="nextPage" :disabled="page===totalPages">Siguiente</button>
                </li>
              </ul>
              <div class="text-center small text-secondary">
                Mostrando {{ pageFrom }}–{{ pageTo }} de {{ totalCount }}
                <span v-if="centroNombreFiltroActivo || clientCentrosOverflow" class="text-muted">
                  (algunos filtros se aplican en esta página)
                </span>
              </div>
            </nav>

            <div v-for="(lista, empresa) in agrupadasPaged" :key="empresa" class="mb-3">
              <div class="card border bg-white mb-2">
                <div class="card-body py-2">
                  <i class="bi bi-building me-2"></i>
                  <strong>{{ empresa }}</strong>
                  <span class="text-secondary small ms-2">({{ lista.length }})</span>
                </div>
              </div>

              <div
                v-for="oc in lista"
                :key="oc.__docId"
                class="card card-elevated mb-2 oc-card"
                :class="{'oc-clickable': isClickableToDetail(oc)}"
                @click="onCardClick(oc)"
              >
                <!-- ⬇️ CABECERA con color por estado SOLO si es editor -->
                <div
                  class="card-header d-flex justify-content-between align-items-center"
                  :class="isEditor ? estadoHeaderClass(oc.estatus) : ''"
                >
                  <div class="d-flex align-items-center gap-3">
                    <div class="fw-semibold">
                      🧾 N° <span class="text-danger">{{ oc.id ?? '—' }}</span>
                    </div>
                    <span class="badge badge-status" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || '—' }}</span>
                  </div>

                  <div class="small ">
                    Subida: <strong>{{ fmtFecha(oc.fechaSubida) }}</strong>
                    <span v-if="oc.fechaAprobacion"> · Aprobada: <strong>{{ fmtFecha(oc.fechaAprobacion) }}</strong></span>
                  </div>
                </div>

                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <div class="small">Centro de Costo</div>
                      <div class="fw-semibold">
                        {{ oc.centroCostoTexto || '—' }}
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="small">Responsable</div>
                      <div class="fw-semibold">{{ oc.responsable || '—' }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small">Moneda</div>
                      <div class="fw-semibold">{{ oc.moneda || '—' }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="small ">Total con IVA</div>
                      <div class="fw-semibold">{{ fmtMoneda(oc.precioTotalConIVA, oc.moneda) }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="small ">Aprobador sugerido</div>
                      <div class="fw-semibold">{{ oc.aprobadorSugerido || '—' }}</div>
                    </div>

                    <div class="col-12">
                      <div class="small ">Comentario</div>
                      <div class="border rounded p-2 ">{{ oc.comentario || '—' }}</div>
                    </div>
                  </div>

                  <!-- Vinculado a SOLPED -->
                  <div class="mt-3 d-flex align-items-center gap-2"
                       v-if="oc.solpedId || oc.numero_solped != null">
                    <i class="bi bi-link-45deg"></i>
                    <span class="small">Vinculado a SOLPED</span>

                    <span class="badge bg-secondary-subtle text-secondary-emphasis">
                      N° {{ oc.numero_solped ?? '—' }}
                    </span>

                    <button class="btn btn-sm btn-outline-secondary"
                            v-if="oc.solpedId"
                            @click.stop="goSolped(oc)">
                      Ver SOLPED
                    </button>
                  </div>
                </div>

                <div class="card-footer  d-flex align-items-center justify-content-between">
                  <div class="small">
                    Empresa: <strong>{{ oc.empresa }}</strong> · Ítems: <strong>{{ (oc.items?.length||0) }}</strong>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-primary" @click.stop="goOC(oc)">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vacío -->
            <div v-if="displayList.length===0" class="ghost-wrap">
              <div class="ghost">
                <div class="ghost-eyes">
                  <span></span><span></span>
                </div>
              </div>
              <p class="ghost-text">No hay cotizaciones con los filtros aplicados.</p>
            </div>
          </template>
        </div>

        <!-- Sidebar filtros (sticky en desktop) -->
        <aside v-if="showSidebar" class="col-12 col-lg-3 d-none d-lg-block">
          <div class="card card-elevated sticky-sidebar">
            <div class="card-header  d-flex align-items-center justify-content-between">
              <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success" @click="applyFilters">Aplicar</button>
                <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              </div>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Fecha (subida)</label>
                <input type="date" class="form-control" v-model="filtroFecha">
              </div>

              <div class="mb-3">
                <label class="form-label">Estado</label>
                <select class="form-select" multiple v-model="filtroEstatus">
                  <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
                </select>
                <small class="text-secondary">Puedes seleccionar varios (máx. 10).</small>
              </div>

              <div class="mb-3">
                <label class="form-label">Centro (texto contiene)</label>
                <input class="form-control" v-model="centroSearch" placeholder="Ej: THPV / CAREN">
                <small class="text-secondary">Se aplica en la página.</small>
              </div>

              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="chkMine" v-model="soloMias">
                <label class="form-check-label" for="chkMine">Ver sólo mis cotizaciones</label>
              </div>

              <div class="mb-0">
                <label class="form-label">Tamaño de página</label>
                <select class="form-select" v-model.number="pageSize" @change="applyFilters">
                  <option v-for="n in [5,10,20,30,40,50]" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Botón flotante filtros (móvil) -->
    <button
      class="btn btn-primary floating-filters-btn d-lg-none"
      @click="toggleSidebar"
      :title="showSidebar ? 'Ocultar filtros' : 'Mostrar filtros'"
    >
      <i class="bi bi-funnel"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot, getDocs, getCountFromServer
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const router = useRouter();
const auth = useAuthStore();
const volver = () => router.back();

/* ========= Claves de persistencia ========= */
const LS_FILTERS       = 'histOCTaller:filters_v1';
const LS_SHOW_SIDEBAR  = 'histOCTaller:showSidebar';
const LS_SOLO_MIAS_KEY = 'histOCTaller:soloMias'; // compat backward

/* ========= Estado ========= */
const loading = ref(true);
const loadingSearch = ref(false);
const error = ref('');

/* ===== Sidebar persistente ===== */
const showSidebar = ref(true);
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
  try { localStorage.setItem(LS_SHOW_SIDEBAR, showSidebar.value ? '1' : '0'); } catch(e){console.error('persist sidebar error', e);}
};

// Datos de la página actual (en vivo)
const pageDocs = ref([]);
const displayList = computed(() => applyClientFilters(pageDocs.value));

// Buscador exacto
const numeroOC = ref(null);
const ocEncontrada = ref(null);

// Filtros base
const filtroFecha = ref('');
const filtroEstatus = ref([]);
const soloMias = ref(false);
const empresaSegmento = ref('todas');

// Centros (referenciales que muestras como chips arriba)
const centrosCosto = {
  "THPV-31": "Taller HP Vulcanización 31",
  "CASAMATRIZ": "Casa Matriz",
  "PPSB": "Planta Predosificado San Bernardo",
  "CANECHE": "Contrato Taller Caneche",
  "CHUQUICAMATA": "Contrato Chuquicamata"
};
const selectedCentros = ref([]);           // si los manejas por otra UI, quedan guardados igual
const centroPickerSearch = ref('');        // reservado si luego agregas selector de centros
const centroSearch = ref('');              // client-side contains

/* ========= Identidad del usuario ========= */
const myName = computed(() =>
  (auth?.profile?.fullName || auth?.user?.displayName || '').trim()
);

/* ========= Paginación y conteo ========= */
const page = ref(1);
const pageSize = ref(5);
const totalCount = ref(0);
const pageFrom = computed(() => totalCount.value ? (page.value - 1) * pageSize.value + 1 : 0);
const pageTo   = computed(() => Math.min(totalCount.value, page.value * pageSize.value));
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

// Cursores y scroll
const cursors = ref({});
let unsubscribe = null;
const savedScrollY = ref(0);

/* ========= Helpers ========= */
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
const fmtMoneda = (n, c='CLP') => {
  const v = Number(n || 0);
  try { return v.toLocaleString('es-CL', { style: 'currency', currency: c, minimumFractionDigits: 0 }); }
  catch { return `${c} ${v.toLocaleString('es-CL')}`; }
};

/* ======== Roles: solo editor ve header coloreado ======== */
const isEditor = computed(() => {
  const r = (auth?.profile?.role || auth?.role || '').toLowerCase().trim();
  return r === 'editor';
});

/* ======== Normalizador + mapeo de estado ======== */
function estadoKey(estatusRaw) {
  const s = String(estatusRaw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .trim();

  if (s.includes('preaprob')) return 'preaprobado';
  if (s.includes('pend') || s.includes('aprobacion')) return 'pendiente';
  if (s.includes('aprob')) return 'aprobado';
  if (s.includes('rechaz')) return 'rechazado';
  if (s.includes('proveedor') || s.includes('enviada')) return 'enviada';
  if (s.includes('revision')) return 'revision';
  return 'otro';
}
const estadoBadgeClass  = (estatus) => `badge-${estadoKey(estatus)}`;
const estadoHeaderClass = (estatus) => `hdr-${estadoKey(estatus)}`;

const isClickableToDetail = (oc) => {
  const k = estadoKey(oc?.estatus);
  return k === 'rechazado' || k === 'pendiente';
};
const onCardClick = (oc) => { if (isClickableToDetail(oc)) goOC(oc); };

/* ========= Flags de filtros aplicados ========= */
const centroNombreFiltroActivo = computed(() => !!centroSearch.value);
const clientCentrosOverflow = computed(() => selectedCentros.value.length > 10);

const hasActiveFilters = computed(() =>
  !!filtroFecha.value ||
  filtroEstatus.value.length ||
  soloMias.value ||
  empresaSegmento.value !== 'todas' ||
  !!centroSearch.value ||
  selectedCentros.value.length > 0
);

/* ========= Persistencia de filtros ========= */
function persistFilters(){
  const payload = {
    filtroFecha: filtroFecha.value || '',
    filtroEstatus: Array.isArray(filtroEstatus.value) ? filtroEstatus.value : [],
    selectedCentros: Array.isArray(selectedCentros.value) ? selectedCentros.value : [],
    centroSearch: centroSearch.value || '',
    empresaSegmento: empresaSegmento.value || 'todas',
    soloMias: !!soloMias.value,
    pageSize: Number(pageSize.value || 5)
  };
  try { localStorage.setItem(LS_FILTERS, JSON.stringify(payload)); } catch(e){console.error('persist filters error', e);}
}

function loadPersistedFilters(){
  try {
    // Sidebar
    const sb = localStorage.getItem(LS_SHOW_SIDEBAR);
    if (sb === '0') showSidebar.value = false;
    if (sb === '1') showSidebar.value = true;

    const raw = localStorage.getItem(LS_FILTERS);
    if (raw) {
      const f = JSON.parse(raw);
      filtroFecha.value      = f.filtroFecha ?? '';
      filtroEstatus.value    = Array.isArray(f.filtroEstatus) ? f.filtroEstatus : [];
      selectedCentros.value  = Array.isArray(f.selectedCentros) ? f.selectedCentros : [];
      centroSearch.value     = f.centroSearch ?? '';
      empresaSegmento.value  = f.empresaSegmento ?? 'todas';
      soloMias.value         = !!f.soloMias;
      if ([5,10,20,30,40,50].includes(Number(f.pageSize))) pageSize.value = Number(f.pageSize);
    } else {
      // compat anterior: sólo "Mis cotizaciones"
      const legacy = localStorage.getItem(LS_SOLO_MIAS_KEY);
      if (legacy === '1') soloMias.value = true;
      if (legacy === '0') soloMias.value = false;
    }
  } catch(e){console.error('load persisted filters error', e);}
}

/** Sincroniza entre pestañas */
function onStorageSync(e){
  if (e.key === LS_FILTERS && e.newValue){
    loadPersistedFilters();
    applyFilters();
  } else if (e.key === LS_SHOW_SIDEBAR && e.newValue !== null){
    showSidebar.value = (e.newValue === '1');
  }
}

/* ========= Query builder (server-side) ========= */
const buildBaseWhere = () => {
  const wh = [];

  if (empresaSegmento.value !== 'todas') {
    wh.push(where('empresa', '==', empresaSegmento.value));
  }

  if (filtroEstatus.value.length === 1) {
    wh.push(where('estatus', '==', filtroEstatus.value[0]));
  } else if (filtroEstatus.value.length > 1) {
    wh.push(where('estatus', 'in', filtroEstatus.value.slice(0, 10)));
  }

  if (filtroFecha.value) {
    try {
      const start = new Date(`${filtroFecha.value}T00:00:00`);
      const end   = new Date(`${filtroFecha.value}T23:59:59.999`);
      wh.push(where('fechaSubida','>=', start));
      wh.push(where('fechaSubida','<=', end));
    } catch (e){ console.error(e) }
  }

  if (soloMias.value) {
    const name = myName.value;
    if (name) wh.push(where('responsable', '==', name));
  }

  if (selectedCentros.value.length === 1) {
    wh.push(where('centroCostoTexto', '==', selectedCentros.value[0]));
  } else if (selectedCentros.value.length >= 2 && selectedCentros.value.length <= 10) {
    wh.push(where('centroCostoTexto', 'in', selectedCentros.value));
  }
  // >10 -> filtro en cliente

  return wh;
};

const makePageQuery = (pageNumber=1) => {
  const wh = buildBaseWhere();
  const base = query(
    collection(db, 'ordenes_oc_taller'),
    ...wh,
    orderBy('fechaSubida', 'desc'),
    limit(pageSize.value)
  );
  if (pageNumber > 1 && cursors.value[pageNumber - 1]) {
    return query(base, startAfter(cursors.value[pageNumber - 1]));
  }
  return base;
};

/* ========= Suscripción y scroll persistente ========= */
const subscribePage = () => {
  if (typeof unsubscribe === 'function') { unsubscribe(); unsubscribe = null; }

  loading.value = true;
  const q = makePageQuery(page.value);

  unsubscribe = onSnapshot(q, async (snap) => {
    let docs = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));

    // Si centros seleccionados >10, aplica filtro por texto en cliente
    if (clientCentrosOverflow.value) {
      const set = new Set(selectedCentros.value.map(x => (x||'').toLowerCase()));
      docs = docs.filter(oc => set.has(String(oc.centroCostoTexto||'').toLowerCase()));
    }

    pageDocs.value = docs;

    const last = snap.docs[snap.docs.length - 1] || null;
    cursors.value[page.value] = last || null;

    loading.value = false;

    await nextTick();
    window.scrollTo(0, savedScrollY.value);
  }, (e) => {
    console.error(e);
    error.value = 'No se pudieron cargar las cotizaciones de la página.';
    loading.value = false;
  });
};

/* ========= Conteo exacto ========= */
const refreshCount = async () => {
  try {
    const wh = buildBaseWhere();
    const countQ = query(collection(db, 'ordenes_oc_taller'), ...wh);
    const res = await getCountFromServer(countQ);
    totalCount.value = res.data().count || 0;
  } catch (e) {
    console.error('count error', e);
    totalCount.value = Math.max(totalCount.value || 0, pageDocs.value.length);
  }
};

/* ========= Filtro cliente ========= */
function applyClientFilters(arr) {
  let out = Array.isArray(arr) ? arr : [];

  // Fallback “Mis cotizaciones” por si en server no calzó (tildes/caso)
  if (soloMias.value) {
    const me = (myName.value || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
    out = out.filter(oc => (String(oc.responsable||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim()) === me);
  }

  // Texto contiene en centroCostoTexto
  if (centroNombreFiltroActivo.value) {
    const q = centroSearch.value.trim().toLowerCase();
    out = out.filter(oc => String(oc.centroCostoTexto||'').toLowerCase().includes(q));
  }

  return out;
}

/* ========= Agrupado ========= */
const agruparPorEmpresa = (arr=[]) => {
  const out = {};
  (arr||[]).forEach(o => {
    const k = o?.empresa || 'Sin Empresa';
    if (!Array.isArray(out[k])) out[k] = [];
    out[k].push(o);
  });
  return out;
};
const agrupadasPaged = computed(() => agruparPorEmpresa(displayList.value));

/* ========= Acciones ========= */
const listaEstatus = [
  'Aprobado','Preaprobado','Pendiente de Aprobación','Revisión Guillermo',
  'Enviada a proveedor','Rechazado'
];

const applyFilters = () => {
  persistFilters();            // guarda cada vez que aplicas
  page.value = 1;
  cursors.value = {};
  savedScrollY.value = window.scrollY;
  subscribePage();
  refreshCount();
};
const limpiarFiltros = () => {
  filtroFecha.value   = '';
  filtroEstatus.value = [];
  centroSearch.value  = '';
  selectedCentros.value = [];
  centroPickerSearch.value = '';
  soloMias.value      = false;
  empresaSegmento.value = 'todas';
  pageSize.value = 5;
  applyFilters();
};
const removeEstatus = (s) => { filtroEstatus.value = filtroEstatus.value.filter(x => x !== s); applyFilters(); };
const removeCentroChip = () => { centroSearch.value = ''; applyFilters(); };
const removeCentro = (code) => { selectedCentros.value = selectedCentros.value.filter(c => c !== code); applyFilters(); };
const setEmpresaSeg = (v) => { empresaSegmento.value = v; applyFilters(); };

const goPage = (p) => {
  if (p < 1) p = 1;
  if (p > totalPages.value) p = totalPages.value;
  savedScrollY.value = window.scrollY;
  page.value = p;
  subscribePage();
};
const nextPage = () => goPage(page.value + 1);
const prevPage = () => goPage(page.value - 1);

/* ========= Navegación ========= */
const goOC = (oc) => router.push({ name: 'OrdenOCTallerDetalle', params: { id: oc.__docId } });
const goSolped = (oc) => { const id = oc?.solpedId; if (id) router.push({ name: 'SolpedTallerDetalle', params: { id } }); };

/* ========= Búsqueda exacta ========= */
const buscarOCExacta = async () => {
  ocEncontrada.value = null;
  const n = Number(numeroOC.value || 0);
  if (!n) return;
  loadingSearch.value = true;
  try {
    const wh = buildBaseWhere();
    const q = query(collection(db, 'ordenes_oc_taller'), ...wh, where('id','==', n), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) ocEncontrada.value = { __docId: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) {
    console.error(e);
  } finally {
    loadingSearch.value = false;
  }
};

/* ========= Init / watchers ========= */
onMounted(async () => {
  // Cargar filtros + sidebar persistidos
  loadPersistedFilters();

  // Suscripción + conteo
  subscribePage();
  await refreshCount();

  // Sincroniza entre pestañas
  window.addEventListener('storage', onStorageSync);
});
onBeforeUnmount(() => { if (typeof unsubscribe === 'function') unsubscribe(); });
onUnmounted(() => { window.removeEventListener('storage', onStorageSync); });

watch(
  [empresaSegmento, soloMias, filtroFecha, () => filtroEstatus.value.slice(), pageSize, selectedCentros, () => centroSearch.value],
  () => { applyFilters(); },
  { deep: true }
);
</script>

<style scoped>
.hist-oc-page{
  min-height:100vh;
}
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

/* Paginación superior pegajosa */
.sticky-pager{
  position: sticky;
  top: 8px;
  z-index: 5;
  background: transparent;
  backdrop-filter: blur(3px);
}

/* Sidebar filtros pegajoso en desktop */
.sticky-sidebar{
  position: sticky;
  top: 12px;
}

/* Botón flotante filtros en móvil */
.floating-filters-btn{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  border-radius: 9999px;
  width: 48px; height: 48px;
  display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

/* Tarjeta clickable si está rechazado o pendiente */
.oc-card.oc-clickable{
  cursor:pointer;
  border-color:#ef4444 !important;
  box-shadow:0 0 0 2px rgba(239,68,68,.15), 0 12px 24px rgba(239,68,68,.18) !important;
}

/* Loading global */
.loading-global{
  display:flex; align-items:center; justify-content:center;
  padding:2rem; border:1px dashed #e5e7eb; border-radius:.75rem;
}

/* Fantasma vacío */
.ghost-wrap{ text-align:center; padding:2rem 0; color:#64748b; }
.ghost{
  width:120px; height:140px; margin:0 auto; background:#fff; border-radius:60px 60px 20px 20px;
  position:relative; box-shadow:0 10px 20px rgba(0,0,0,.08);
  animation: floaty 3s ease-in-out infinite;
}
.ghost-eyes{
  position:absolute; top:45px; left:50%; transform:translateX(-50%);
  width:60px; height:14px; display:flex; justify-content:space-between; align-items:center;
}
.ghost-eyes span{
  width:14px; height:14px; background:#111827; border-radius:50%;
  display:inline-block;
}
.ghost-text{ margin-top:1rem; font-weight:500; }
@keyframes floaty{ 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }

/* Badge close */
.badge .btn-close{ width:.6rem; height:.6rem; filter: invert(1) grayscale(100%) brightness(0.4); }

/* ========= PALETA PERSONALIZADA POR ESTADO ========= */
.badge-status{ font-weight:600; border:0; }
.badge-aprobado{    background:#e7f6e9; color:#166534; }
.badge-preaprobado{ background:#e6f3fb; color:#0b4a6f; }
.badge-pendiente{   background:#fff1db; color:#92400e; }
.badge-rechazado{   background:#fee2e2; color:#991b1b; }
.badge-enviada{     background:#e8edff; color:#1e3a8a; }
.badge-revision{    background:#efe9ff; color:#5b21b6; }
.badge-otro{        background:#f1f5f9; color:#334155; }

/* HEADERS (SOLO EDITOR) */
.hdr-aprobado{
  background:#e7f6e9 !important; color:#0f5132 !important; border-bottom:1px solid #ccead2 !important;
}
.hdr-preaprobado{
  background:#e6f3fb !important; color:#0b4a6f !important; border-bottom:1px solid #c7e6f7 !important;
}
.hdr-pendiente{
  background:#fff1db !important; color:#7c2d12 !important; border-bottom:1px solid #ffe1b6 !important;
}
.hdr-rechazado{
  background:#fee2e2 !important; color:#7f1d1d !important; border-bottom:1px solid #fecaca !important;
}
.hdr-enviada{
  background:#e8edff !important; color:#1e3a8a !important; border-bottom:1px solid #cdd6ff !important;
}
.hdr-revision{
  background:#efe9ff !important; color:#4c1d95 !important; border-bottom:1px solid #dfd3ff !important;
}
.hdr-otro{
  background:#f1f5f9 !important; color:#334155 !important; border-bottom:1px solid #e2e8f0 !important;
}
</style>
