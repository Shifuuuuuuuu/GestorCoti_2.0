<template>
  <div class="hist-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">Historial de Cotizaciones</h1>

        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-primary btn-sm" @click="toggleSidebar">
            <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"></i>
            <span class="d-none d-sm-inline ms-1">{{ showSidebar ? 'Ocultar filtros' : 'Mostrar filtros' }}</span>
          </button>

          <!-- Switch Mis cotizaciones (header) -->
          <div class="form-check form-switch ms-2 d-none d-sm-flex align-items-center">
            <input
              class="form-check-input"
              type="checkbox"
              id="switchSoloMiasTop"
              v-model="soloMias"
              :title="'Ver sólo mis cotizaciones (campo responsable)'"
            />
            <label class="form-check-label ms-2 small" for="switchSoloMiasTop">
              Mis cotizaciones
            </label>
          </div>
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
              <input type="number" class="form-control" v-model.number="numeroOC" @keyup.enter="buscarOCExacta" placeholder="Ej: 1628">
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
                {{ ocEncontrada.empresa }} · {{ ocEncontrada.nombre_centro_costo || ocEncontrada.centroCostoNombre || '—' }}
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

      <!-- Segmento por empresa -->
      <div class="mb-3">
        <div class="btn-group">
          <button class="btn" :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('todas')">Todas</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Mining' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Mining')">⛏ Mining</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Servicio')">🛠 Servicio</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Hormigones')">🧱 Hormigones</button>
        </div>
      </div>

      <div class="row">
        <!-- Listado -->
        <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
          <div v-if="loading" class="loading-global">
            <div class="spinner-border me-2"></div> Cargando cotizaciones…
          </div>

          <template v-else>
            <!-- Paginación (superior pegajosa) -->
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
                <!-- CABECERA CON COLOR POR ESTADO SOLO PARA EDITOR -->
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
                      <div class="small ">Centro de Costo</div>
                      <div class="fw-semibold">
                        {{ oc.numero_contrato || oc.centroCosto || '—' }} — {{ oc.nombre_centro_costo || oc.centroCostoNombre || '—' }}
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="small ">Responsable</div>
                      <div class="fw-semibold">{{ oc.responsable || '—' }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small">Moneda</div>
                      <div class="fw-semibold">{{ oc.moneda || '—' }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="small">Total con IVA</div>
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
                  <div class="small ">
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
                <div class="ghost-eyes"></div>
                <div class="ghost-bottom"><div></div><div></div><div></div><div></div></div>
              </div>
              <p class="ghost-text">No hay cotizaciones con los filtros aplicados.</p>
            </div>

          </template>
        </div>

        <!-- Sidebar filtros (sticky en desktop) -->
        <aside v-if="showSidebar" class="col-12 col-lg-3 d-none d-lg-block">
          <div class="card card-elevated sticky-sidebar">
            <div class="card-header d-flex align-items-center justify-content-between">
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

              <!-- Centros de costo -->
              <div class="mb-2">
                <label class="form-label">Centro de costo (código)</label>
                <input class="form-control mb-2" v-model="centroPickerSearch" placeholder="Buscar código o nombre…" />
                <div class="border rounded p-2" style="max-height: 220px; overflow:auto;">
                  <div class="form-check" v-for="code in centrosFiltrados" :key="code">
                    <input class="form-check-input" type="checkbox"
                           :id="'cc_'+code"
                           :checked="selectedCentrosSet.has(code)"
                           @change="toggleCentro(code)">
                    <label class="form-check-label" :for="'cc_'+code">
                      <strong>{{ code }}</strong> — {{ centrosCosto[code] }}
                    </label>
                  </div>
                </div>
                <small class="text-secondary d-block mt-1">
                  Si seleccionas 1–10 códigos se filtra en servidor. Más de 10 se filtra en la página.
                </small>
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot, getDocs, getCountFromServer
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const router = useRouter();
const auth = useAuthStore();
const volver = () => router.back();

/* ========= Estado ========= */
const loading = ref(true);
const loadingSearch = ref(false);
const error = ref('');

const showSidebar = ref(true);
const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };

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

// Centros de costo
const centrosCosto = {
  "27483":"CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA",
  "PPCALAMA":"PLANTA PREDOSIFICADO CALAMA",
  "20915":"CONTRATO 20915 SUM. HORMIGON DAND",
  "23302-CARPETAS":"CONTRATO 23302 CARPETAS",
  "23302-AMPL":"CONTRATO 23302 AMPLIACION",
  "OFANDES":"OFICINA LOS ANDES",
  "CASAMATRIZ":"CASA MATRIZ",
  "RRHH":"RRHH",
  "FINANZAS":"FINANZAS",
  "SUST":"SUSTENTABILIDAD",
  "SOPTI":"SOPORTE TI",
  "STRIPCENTER":"STRIP CENTER",
  "PLANIF":"PLANIFICACION",
  "PPSB":"PLANTA PREDOSIFICADO SAN BERNARDO",
  "PHUSB":"PLANTA HORMIGON URB.SAN BERNARDO",
  "ALTOMAIPO":"ALTO MAIPO",
  "PHURAN":"PLANTA HORMIGON URB. RANCAGUA",
  "PARAN":"PLANTA ARIDOS RANCAGUA",
  "PASB":"PLANTA ARIDOS SAN BERNARDO",
  "22368":"CONTRATO 22368 SUM HORMIGON DET",
  "28662":"CONTRATO 28662 CARPETAS",
  "29207":"CONTRATO 29207 MINERIA",
  "INFRAESTRUCTURA":"CONTRATO INFRAESTRUCTURA DET",
  "HORMIGONES DET":"CONTRATO SUMINISTRO DE HORMIGONES DET",
  "HORMIGONES DAND":"CONTRATO SUMINISTRO DE HORMIGONES DAND",
  "23302":"CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND",
  "CARPETASDET":"CONTRATO CARPETAS DET",
  "30-10-11":"GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM",
  "SANJOAQUIN":"SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN",
  "URBANOS":"SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR",
  "CS":"CONTRATO DE SUMINISTRO DE HORMIGONES CS",
  "PREDOSIFICADO":"CONTRATO HORMIGONES Y PREDOSIFICADO",
  "CANECHE":"CONTRATO TALLER CANECHE",
  "CHUQUICAMATA":"CONTRATO CHUQUICAMATA"
};
const selectedCentros = ref([]);
const selectedCentrosSet = computed(() => new Set(selectedCentros.value));
const centroPickerSearch = ref('');
const centroSearch = ref('');

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
  try {
    return v.toLocaleString('es-CL', { style: 'currency', currency: c, minimumFractionDigits: 0 });
  } catch { return `${c} ${v.toLocaleString('es-CL')}`; }
};

/* ======== Roles ======== */
const isEditor = computed(() => {
  const r = (auth?.profile?.role || auth?.role || '').toLowerCase().trim();
  return r === 'editor'; // ajusta si tu rol tiene otro nombre
});

/* ======== Normalizador + clases por estado ======== */
function estadoKey(estatusRaw) {
  const s = String(estatusRaw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .trim();

  // 1) primero "preaprobado" para no chocar con "aprobado"
  if (s.includes('preaprob')) return 'preaprobado';

  // 2) luego todo lo pendiente (incluye "pendiente de aprobacion")
  if (s.includes('pend') || s.includes('aprobacion')) return 'pendiente';

  // 3) ahora sí "aprobado"
  if (s.includes('aprob')) return 'aprobado';

  // 4) resto
  if (s.includes('rechaz')) return 'rechazado';
  if (s.includes('proveedor') || s.includes('enviada')) return 'enviada';
  if (s.includes('revision')) return 'revision';
  return 'otro';
}


const estadoBadgeClass = (estatus) => `badge-${estadoKey(estatus)}`;
const estadoHeaderClass = (estatus) => `hdr-${estadoKey(estatus)}`;

const isClickableToDetail = (oc) => {
  const k = estadoKey(oc?.estatus);
  return k === 'rechazado' || k === 'pendiente';
};
const onCardClick = (oc) => { if (isClickableToDetail(oc)) goOC(oc); };

/* ========= Centros ========= */
const centrosOrdenados = computed(() =>
  Object.keys(centrosCosto).sort((a,b) => (centrosCosto[a]||'').localeCompare(centrosCosto[b]||'', 'es', {sensitivity:'base'}))
);
const centrosFiltrados = computed(() => {
  const q = centroPickerSearch.value.trim().toLowerCase();
  if (!q) return centrosOrdenados.value;
  return centrosOrdenados.value.filter(code =>
    code.toLowerCase().includes(q) || String(centrosCosto[code]||'').toLowerCase().includes(q)
  );
});
const toggleCentro = (code) => {
  const set = new Set(selectedCentros.value);
  if (set.has(code)) set.delete(code); else set.add(code);
  selectedCentros.value = Array.from(set);
  applyFilters();
};
const removeCentro = (code) => {
  selectedCentros.value = selectedCentros.value.filter(c => c !== code);
  applyFilters();
};

/* ========= Flags ========= */
const isDigits = (v) => /^[0-9\-]+$/.test((v||'').trim());
const centroNombreFiltroActivo = computed(() => centroSearch.value && !isDigits(centroSearch.value));
const clientCentrosOverflow = computed(() => selectedCentros.value.length > 10);

const hasActiveFilters = computed(() =>
  !!filtroFecha.value ||
  filtroEstatus.value.length ||
  soloMias.value ||
  empresaSegmento.value !== 'todas' ||
  !!centroSearch.value ||
  selectedCentros.value.length > 0
);

/* ========= Usuario actual ========= */
const currentUserName = computed(() => (auth?.profile?.fullName || auth?.user?.displayName || '').trim());

/* ========= Persistencia local ========= */
const LS_SOLO_MIAS_KEY = 'histOC:soloMias';

function loadSoloMiasFromLS() {
  try {
    const val = localStorage.getItem(LS_SOLO_MIAS_KEY);
    if (val === '1') soloMias.value = true;
    if (val === '0') soloMias.value = false;
  } catch(e) {console.error(e)}
}
watch(soloMias, (val) => {
  try { localStorage.setItem(LS_SOLO_MIAS_KEY, val ? '1' : '0'); } catch(e) {console.error(e)}
});

/* ========= Query builder ========= */
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
    } catch (e){console.error(e)}
  }

  if (soloMias.value) {
    const fullName = currentUserName.value;
    if (fullName) wh.push(where('responsable', '==', fullName));
  }

  if (selectedCentros.value.length === 1) {
    wh.push(where('numero_contrato', '==', selectedCentros.value[0]));
  } else if (selectedCentros.value.length >= 2 && selectedCentros.value.length <= 10) {
    wh.push(where('numero_contrato', 'in', selectedCentros.value.slice(0, 10)));
  }

  return wh;
};

const makePageQuery = (pageNumber=1) => {
  const wh = buildBaseWhere();
  const base = query(
    collection(db, 'ordenes_oc'),
    ...wh,
    orderBy('fechaSubida', 'desc'),
    limit(pageSize.value)
  );
  if (pageNumber > 1 && cursors.value[pageNumber - 1]) {
    return query(base, startAfter(cursors.value[pageNumber - 1]));
  }
  return base;
};

/* ========= Suscripción ========= */
const subscribePage = () => {
  if (typeof unsubscribe === 'function') { unsubscribe(); unsubscribe = null; }

  loading.value = true;
  const q = makePageQuery(page.value);

  unsubscribe = onSnapshot(q, async (snap) => {
    let docs = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));

    if (clientCentrosOverflow.value) {
      const set = new Set(selectedCentros.value);
      docs = docs.filter(oc => set.has(oc.numero_contrato));
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
    const countQ = query(collection(db, 'ordenes_oc'), ...wh);
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

  if (centroNombreFiltroActivo.value) {
    const q = centroSearch.value.trim().toLowerCase();
    out = out.filter(oc => {
      const pool = [ oc.centroCostoNombre, oc.nombre_centro_costo ].filter(Boolean).map(x => String(x).toLowerCase());
      return pool.some(s => s.includes(q));
    });
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
const goOC = (oc) => router.push({ name: 'oc-detalle', params: { id: oc.__docId } });
const goSolped = (oc) => {
  const id = oc?.solpedId;
  if (id) router.push({ name: 'SolpedDetalle', params: { id } });
};

/* ========= Búsqueda exacta ========= */
const buscarOCExacta = async () => {
  ocEncontrada.value = null;
  const n = Number(numeroOC.value || 0);
  if (!n) return;
  loadingSearch.value = true;
  try {
    const wh = buildBaseWhere();
    const q = query(collection(db, 'ordenes_oc'), ...wh, where('id','==', n), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) ocEncontrada.value = { __docId: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) {
    console.error(e);
  } finally {
    loadingSearch.value = false;
  }
};

/* ========= Init ========= */
onMounted(async () => {
  loadSoloMiasFromLS();
  subscribePage();
  await refreshCount();
});
onBeforeUnmount(() => { if (typeof unsubscribe === 'function') unsubscribe(); });

watch([empresaSegmento, soloMias, filtroFecha, () => filtroEstatus.value.slice(), pageSize], () => {
  applyFilters();
});
</script>

<style scoped>
.hist-oc-page{ min-height:100vh; }
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

/* Paginación superior pegajosa */
.sticky-pager{ position: sticky; top: 8px; z-index: 5; background: transparent; backdrop-filter: blur(3px); }

/* Sidebar filtros pegajoso en desktop */
.sticky-sidebar{ position: sticky; top: 12px; }

/* Botón flotante filtros en móvil */
.floating-filters-btn{
  position: fixed; right: 16px; bottom: 16px; z-index: 20;
  border-radius: 9999px; width: 48px; height: 48px; display: grid; place-items: center;
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

/* Ghost vacío */
.ghost-wrap{ text-align:center; padding:2rem 0; color:#64748b; }
.ghost{
  width:120px; height:140px; margin:0 auto; background:#fff; border-radius:60px 60px 20px 20px;
  position:relative; box-shadow:0 10px 20px rgba(0,0,0,.08);
  animation: floaty 3s ease-in-out infinite;
}
.ghost:before{
  content:''; position:absolute; top:-12px; left:50%; transform:translateX(-50%);
  width:60px; height:12px; background:#e2e8f0; border-radius:6px; filter:blur(2px);
}
.ghost-eyes{ position:absolute; top:45px; left:50%; transform:translateX(-50%); width:60px; height:14px; display:flex; justify-content:space-between; }
.ghost-eyes:before, .ghost-eyes:after{ content:''; width:14px; height:14px; background:#111827; border-radius:50%; }
.ghost-bottom{ position:absolute; bottom:-12px; left:0; right:0; display:flex; justify-content:space-between; padding:0 6px; }
.ghost-text{ margin-top:1rem; font-weight:500; }
@keyframes floaty{ 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }

/* Badge close */
.badge .btn-close{ width:.6rem; height:.6rem; filter: invert(1) grayscale(100%) brightness(0.4); }

/* Switch header */
.form-check.form-switch .form-check-input{ cursor: pointer; }

/* ========= PALETA PERSONALIZADA POR ESTADO =========
   - preaprobado: azul-cian
   - aprobado:    verde
   - pendiente:   ámbar
   - rechzado:    rojo
   - enviada:     azul
   - revision:    gris/violeta leve
   - otro:        gris
*/

/* BADGES */
.badge-status{ font-weight:600; border:0; }
.badge-aprobado{    background:#e7f6e9; color:#166534; }   /* green */
.badge-preaprobado{ background:#e6f3fb; color:#0b4a6f; }   /* teal/sky */
.badge-pendiente{   background:#fff1db; color:#92400e; }   /* amber */
.badge-rechazado{   background:#fee2e2; color:#991b1b; }   /* red */
.badge-enviada{     background:#e8edff; color:#1e3a8a; }   /* blue */
.badge-revision{    background:#efe9ff; color:#5b21b6; }   /* indigo */
.badge-otro{        background:#f1f5f9; color:#334155; }   /* slate */

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
