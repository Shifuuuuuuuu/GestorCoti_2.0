<!-- src/views/DashboardEstadisticas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="dashboard-page with-sidenav">
    <div class="container py-4 py-md-5 position-relative">


      <transition name="fade">
        <div v-if="isLoading" class="loading-overlay" aria-live="polite" aria-busy="true">
          <div class="loading-card">
            <div class="spinner-border" role="status" aria-hidden="true"></div>
            <div class="mt-3 fw-medium">Cargando estadísticas…</div>
            <div class="text-muted small mt-1">Filtrando y preparando gráficos</div>
          </div>
        </div>
      </transition>


      <div :class="['content-wrap', { 'is-blurred': isLoading }]">

        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
          <h1 class="h5 h4-sm fw-semibold mb-0">Dashboard · Estadísticas</h1>

          <div class="d-flex align-items-stretch gap-2 flex-wrap">
            <button class="btn btn-outline-secondary btn-sm d-inline-flex d-md-none" @click="toggleFiltros(true)">
              <i class="bi bi-sliders2 me-1"></i> Filtros
            </button>

            <button class="btn btn-outline-secondary btn-sm" @click="refrescar" :disabled="isLoading">
              <i class="bi bi-arrow-clockwise me-1"></i> Refrescar
            </button>
          </div>
        </div>

        <div class="mb-3">
          <div class="btn-group flex-wrap gap-1">
            <button
              class="btn"
              :class="segmento==='empresa' ? 'btn-primary' : 'btn-outline-primary'"
              @click="setSegmento('empresa')"
              :disabled="isLoading"
              title="Ver estadísticas de SOLPED (operación/empresa)"
            >
              🏢 SOLPED Empresa
            </button>
            <button
              class="btn"
              :class="segmento==='taller' ? 'btn-primary' : 'btn-outline-primary'"
              @click="setSegmento('taller')"
              :disabled="isLoading"
              title="Ver estadísticas de SOLPED Taller"
            >
              🛠 SOLPED Taller
            </button>
          </div>
        </div>

        <div class="mb-3" v-if="segmento==='empresa'">
          <div class="btn-group flex-wrap gap-1">
            <button class="btn" :class="empresaSegmento==='todas' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('todas')" :disabled="isLoading">Todas</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Mining' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Mining')" :disabled="isLoading">⛏ Mining</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Servicio')" :disabled="isLoading">🛠 Servicios</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Hormigones')" :disabled="isLoading">🧱 Hormigones</button>
          </div>
        </div>

        <div class="card mb-4 d-none d-md-block">
          <div class="card-body">
            <div class="row g-2 align-items-end">
              <div class="col-12 col-md-2">
                <label class="form-label">Mes</label>
                <input type="month" class="form-control" v-model="filtroMes" @change="onFiltroChange" :disabled="isLoading" />
              </div>

              <div class="col-12 col-md-3" v-if="segmento==='empresa'">
                <label class="form-label">Contrato</label>
                <select class="form-select" v-model="filtroContratoSel" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in contratosOptions" :key="'con-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-3" v-else>
                <label class="form-label">Centro de Costo</label>
                <select class="form-select" v-model="filtroCentroCostoSel" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in centroCostoOptions" :key="'cc-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-2">
                <label class="form-label">Estatus SOLPED</label>
                <select class="form-select" v-model="filtroEstatusSolped" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in estatusSolpedOptions" :key="'es-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-2">
                <label class="form-label">Tipo SOLPED</label>
                <select class="form-select" v-model="filtroTipoSolped" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in tipoSolpedOptions" :key="'tp-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-2">
                <label class="form-label">Moneda OC</label>
                <select class="form-select" v-model="filtroMonedaOC" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todas</option>
                  <option v-for="opt in monedaOptions" :key="'mo-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Responsable OC</label>
                <select class="form-select" v-model="filtroResponsableOC" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in responsableOptions" :key="'re-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div class="col-12 col-md-2 ms-auto d-flex justify-content-end">
                <button class="btn btn-outline-secondary w-100" @click="limpiarFiltros" :disabled="isLoading">
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-3 mb-4">
          <div class="col-6 col-xl-3" v-for="k in kpiCards" :key="k.t">
            <div class="card shadow-sm border-0 h-100">
              <div class="card-body">
                <div class="small text-secondary mb-1">{{ k.t }}</div>
                <div class="h3 mb-0">{{ k.isMoney ? formatearCLP(k.v) : k.v }}</div>
                <div v-if="k.s" class="text-muted small">{{ k.s }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6 col-xl-3" v-for="k in kpiCardsExtra" :key="k.t">
            <div class="card shadow-sm border-0 h-100">
              <div class="card-body">
                <div class="small text-secondary mb-1">{{ k.t }}</div>
                <div class="h3 mb-0">
                  <template v-if="k.isPct">{{ k.v.toFixed(1) }}%</template>
                  <template v-else-if="k.isDays">{{ k.v.toFixed(1) }} d</template>
                  <template v-else-if="k.isMoney">{{ formatearCLP(k.v) }}</template>
                  <template v-else>{{ k.v }}</template>
                </div>
                <div v-if="k.s" class="text-muted small">{{ k.s }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Top creadores de {{ tituloSegmento }} (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cTopCreadores"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Top generadores de OC (mes)</div></div>
              <div class="card-body chart-fixed-h">
                <canvas ref="cTopOC"></canvas>
                <div class="text-end small text-muted mt-2">
                  Gasto total del mes: <strong>{{ formatearCLP(kpis.gastoMes) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Distribución de estatus ({{ tituloSegmento }})</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cEstatusPie"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Distribución por Tipo de {{ tituloSegmento }}</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cTipoSolpedPie"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header d-flex align-items-center justify-content-between">
                <div class="fw-medium">OC por Tipo SOLPED (Monto)</div>
                <span class="badge bg-dark-subtle text-dark-emphasis">
                  {{ ocTipoSolpedAggPayload.totalCount }} OC · {{ formatearCLP(ocTipoSolpedAggPayload.totalMonto) }}
                </span>
              </div>
              <div class="card-body chart-fixed-h">
                <div class="row g-3">
                  <div class="col-12 col-md-12">
                    <div class="pie-box"><canvas ref="cOcTipoSolpedMontoPie"></canvas></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Evolución diaria del gasto (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cGastoLine"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Top aprobadores (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cTopAprobadores"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">SOLPED pendientes por cotizadores (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cSolpedPendH"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">SOLPED pendientes por cotizadores (todos los meses)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cSolpedPendAll"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Gasto por Contrato </div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cGastoContratoH"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">OC por Contrato </div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cConteoContratoH"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header d-flex align-items-center justify-content-between">
                <div class="fw-medium">Cotizaciones aprobadas vs Órdenes subidas </div>
                <span class="badge bg-dark-subtle text-dark-emphasis" v-if="vsEditorsPayload?.labels?.length">
                  {{ vsEditorsPayload.labels.length }} usuarios
                </span>
              </div>
              <div class="card-body chart-fixed-h">
                <canvas ref="cVsAprobadasSubidas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm border-0 mt-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div class="fw-medium">Quién pide más {{ tituloSegmento }} (HOY)</div>
            <span class="badge text-bg-dark">{{ fechaHoyLegible }}</span>
          </div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:40px">#</th>
                  <th>Usuario / Solicitante</th>
                  <th class="text-end">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in topHoy" :key="row.nombre + i">
                  <td>{{ i + 1 }}</td>
                  <td>{{ row.nombre }}</td>
                  <td class="text-end fw-semibold">{{ row.cantidad }}</td>
                </tr>
                <tr v-if="topHoy.length === 0">
                  <td colspan="3" class="text-center text-muted py-4">Sin movimientos hoy con los filtros actuales.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="lastError" class="alert alert-danger mt-3" role="alert">
          <strong>Error:</strong> {{ lastError }}
        </div>
      </div>
    </div>


    <div v-if="filtrosOpen" class="offcanvas-backdrop" @click.self="toggleFiltros(false)">
      <div class="offcanvas-panel offcanvas-panel-sm">
        <div class="offcanvas-header">
          <h5 class="mb-0"><i class="bi bi-sliders2 me-2"></i>Filtros</h5>
          <button class="btn-close" @click="toggleFiltros(false)"></button>
        </div>
        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Mes</label>
              <input type="month" class="form-control" v-model="filtroMes" @change="onFiltroChange" :disabled="isLoading" />
            </div>

            <div class="col-12" v-if="segmento==='empresa'">
              <label class="form-label">Contrato</label>
              <select class="form-select" v-model="filtroContratoSel" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option v-for="opt in contratosOptions" :key="'conm-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12" v-else>
              <label class="form-label">Centro de Costo</label>
              <select class="form-select" v-model="filtroCentroCostoSel" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option v-for="opt in centroCostoOptions" :key="'ccm-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label">Estatus SOLPED</label>
              <select class="form-select" v-model="filtroEstatusSolped" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option v-for="opt in estatusSolpedOptions" :key="'esm-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label">Tipo SOLPED</label>
              <select class="form-select" v-model="filtroTipoSolped" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option v-for="opt in tipoSolpedOptions" :key="'tpm-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label">Moneda OC</label>
              <select class="form-select" v-model="filtroMonedaOC" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todas</option>
                <option v-for="opt in monedaOptions" :key="'mom-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label">Responsable OC</label>
              <select class="form-select" v-model="filtroResponsableOC" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option v-for="opt in responsableOptions" :key="'rem-'+opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="offcanvas-footer">
          <div class="d-flex gap-2 justify-content-between w-100">
            <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
            <button class="btn btn-primary" @click="toggleFiltros(false)">Aplicar</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from "vue";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/stores/firebase";

/* ====== Estado UI ====== */
const isLoading = ref(false);
const lastError = ref("");
const filtrosOpen = ref(false);
const toggleFiltros = (v) => { filtrosOpen.value = !!v; };

const segmento = ref(localStorage.getItem('xt_dashboard_segmento') || 'empresa');
function setSegmento(v) {
  if (v === 'empresa' || v === 'taller') {
    segmento.value = v;
    localStorage.setItem('xt_dashboard_segmento', v);
    scheduleReload();
  }
}

const empresasOptions = ["Xtreme Mining","Xtreme Servicio","Xtreme Hormigones","Xtreme Servicios"];
const empresaSegmento = ref('todas');
const filtroEmpresa = ref('');
const isExactEmpresa = computed(() => empresasOptions.includes(filtroEmpresa.value));
function setEmpresaSeg(v) {
  empresaSegmento.value = v;
  filtroEmpresa.value = (v === 'todas') ? '' : v;
  scheduleReload();
}


let debounceTimer = null;
function scheduleReload() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { cargarTodo(true); }, 200);
}

const filtroMes = ref(defMesActual());
const filtroEstatusOC = ref("");


const contratosOptions = ref([]);
const centroCostoOptions = ref([]);
const estatusSolpedOptions = ref([]);
const tipoSolpedOptions = ref([]);
const monedaOptions = ref([]);
const responsableOptions = ref([]);

const filtroContratoSel = ref("");
const filtroCentroCostoSel = ref("");
const filtroEstatusSolped = ref("");
const filtroTipoSolped = ref("");
const filtroMonedaOC = ref("");
const filtroResponsableOC = ref("");


const kpis = ref({
  creadasMes: 0,
  completadasMes: 0,
  ocMes: 0,
  gastoMes: 0,
  ticketProm: 0,
});


const kpisExtra = ref({
  conversionPct: 0,
  leadtimePromDias: 0,
  rechazoPct: 0,
  comentariosTallerMes: 0,
});

const tituloSegmento = computed(() => (segmento.value === 'empresa' ? 'SOLPED' : 'SOLPED Taller'));

const kpiCards = computed(() => ([
  { t: `${tituloSegmento.value} completadas (mes)`, v: kpis.value.completadasMes },
  { t: `OC generadas (mes)`, v: kpis.value.ocMes, s: (filtroEstatusOC.value ? `Filtro estatus: ${filtroEstatusOC.value}` : '—') },
  { t: `Gasto total (mes)`, v: kpis.value.gastoMes, isMoney: true },
]));


const topHoy = ref([]);

const ocTipoAggPayload = ref({ labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 });
const ocTipoSolpedAggPayload = ref({ labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 });

const cTopCreadores = ref(null);
const cTopOC = ref(null);
const cGastoContratoH = ref(null);
const cEstatusPie = ref(null);
const cGastoLine = ref(null);
const cTipoSolpedPie = ref(null);
const cTopAprobadores = ref(null);
const cMonedaPie = ref(null);
const cConteoContratoH = ref(null);
const cSolpedPendH = ref(null);
const cSolpedPendAll = ref(null);

const cVsAprobadasSubidas = ref(null);

const cOcTipoCountPie = ref(null);
const cOcTipoMontoPie = ref(null);
const cOcTipoSolpedCountPie = ref(null);
const cOcTipoSolpedMontoPie = ref(null);


let charts = {
  topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null,
  tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null,
  solpedPend: null, solpedPendAll: null,
  vsEditors: null,

  ocTipoCountPie: null,
  ocTipoMontoPie: null,
  ocTipoSolpedCountPie: null,
  ocTipoSolpedMontoPie: null,
};

let _lastPayloadKey = "";
let _lastPayloadJSON = "";

const fechaHoyLegible = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
});

onMounted(async () => { await cargarTodo(); window.addEventListener('resize', _onResize); });
onBeforeUnmount(() => { destroyAll(); window.removeEventListener('resize', _onResize); });

watch(
  [
    segmento, filtroMes, filtroEstatusOC, filtroContratoSel, filtroCentroCostoSel,
    filtroEstatusSolped, filtroTipoSolped, filtroMonedaOC, filtroResponsableOC, filtroEmpresa
  ],
  () => { scheduleReload(); }
);

function onFiltroChange() {  }
function refrescar() { cargarTodo(true); }
function _onResize(){}

function limpiarFiltros() {
  empresaSegmento.value = 'todas';
  filtroEmpresa.value = '';
  filtroContratoSel.value = "";
  filtroCentroCostoSel.value = "";
  filtroEstatusSolped.value = "";
  filtroTipoSolped.value = "";
  filtroMonedaOC.value = "";
  filtroResponsableOC.value = "";
  filtroEstatusOC.value = "";
  onFiltroChange();
}

function defMesActual() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function rangoDeMes(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return { start: new Date(y, m-1, 1, 0,0,0,0), end: new Date(y, m, 1, 0,0,0,0) };
}
function isInRange(dateLike, start, end) {
  const d = normalizarFecha(dateLike);
  return d >= start && d < end;
}
function esHoy(dateLike) {
  const d = normalizarFecha(dateLike), h = new Date();
  return d.getFullYear()===h.getFullYear() && d.getMonth()===h.getMonth() && d.getDate()===h.getDate();
}
function normalizarFecha(v) {
  if (!v) return new Date(0);
  if (v.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00");
    const p = Date.parse(v); if (!isNaN(p)) return new Date(p);
  }
  return new Date(0);
}
function formatearCLP(v) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v || 0);
}

const CACHE_TTL_MS = 2 * 60 * 1000;
function cacheKey() {
  return [
    "dashV12",
    segmento.value,
    filtroMes.value || "_",
    empresaSegmento.value || "_",
    filtroEmpresa.value || "_",
    filtroContratoSel.value || "_",
    filtroCentroCostoSel.value || "_",
    filtroEstatusSolped.value || "_",
    filtroTipoSolped.value || "_",
    filtroMonedaOC.value || "_",
    filtroResponsableOC.value || "_",
    filtroEstatusOC.value || "_"
  ].join("|");
}
function getCache() {
  try {
    const raw = sessionStorage.getItem(cacheKey());
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || !o.t) return null;
    if (Date.now() - o.t > CACHE_TTL_MS) return null;
    return o.payload || null;
  } catch { return null; }
}
function setCache(payload) { try { sessionStorage.setItem(cacheKey(), JSON.stringify({ t: Date.now(), payload })); } catch(e){console.error(e)} }

function _normTxt(v='') {
  return String(v || "").normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
}


function ocMonto(o) {
  if (!o) return 0;
  if (typeof o.precioTotalConIVA === "number") return o.precioTotalConIVA;
  if (Array.isArray(o.items)) return o.items.reduce((a, it) => a + (Number(it.precioTotalConIVA) || 0), 0);
  return 0;
}
function ocTipoOC(o) {

  return (o?.tipo_oc || o?.tipoOrden || o?.tipo_orden || o?.tipo || o?.categoria || '—').toString().trim() || '—';
}
function ocSolpeNums(o) {
  const out = new Set();
  const push = (v) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out.add(n);
  };


  push(o?.numero_solpe);
  push(o?.numeroSolpe);
  push(o?.numero_solped);
  push(o?.numeroSolped);
  push(o?.solpedNumero);

  // items
  if (Array.isArray(o?.items)) {
    for (const it of o.items) {
      push(it?.numero_solped);
      push(it?.numero_solpe);
      push(it?.numeroSolped);
      push(it?.numeroSolpe);
    }
  }

  return [...out];
}
function buildSolIndexByNumero(solAll) {
  const map = new Map();
  for (const s of (solAll || [])) {
    const n = Number(s.numero_solpe || s.numeroSolpe || s.numero_solped || s.numeroSolped);
    if (Number.isFinite(n) && n > 0) map.set(n, s);
  }
  return map;
}
function solMatchesSolpedFilters(sol) {
  if (!sol) return false;


  if (segmento.value === 'empresa' && filtroEmpresa.value) {
    const emp = String(sol.empresa || sol.empresas || '');
    if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
  }

  if (segmento.value === 'empresa') {
    const c = String(sol.numero_contrato || sol.numeroContrato || '');
    if (filtroContratoSel.value && c !== filtroContratoSel.value) return false;
  } else {
    const cc = String(sol.centro_costo || sol.centroCosto || sol.centroCostoNombre || '');
    if (filtroCentroCostoSel.value && cc !== filtroCentroCostoSel.value) return false;
  }

  if (filtroEstatusSolped.value && _normTxt(sol.estatus || sol.estado || '') !== _normTxt(filtroEstatusSolped.value)) return false;
  if (filtroTipoSolped.value && _normTxt(sol.tipo_solped || '') !== _normTxt(filtroTipoSolped.value)) return false;

  return true;
}
function ocTipoSolped(o, solIndexAllByNumero) {

  const direct = (o?.tipo_solped || o?.tipoSolped || '').toString().trim();
  if (direct) return direct;


  const tiposItems = new Set();
  if (Array.isArray(o?.items)) {
    for (const it of o.items) {
      const t = (it?.tipo_solped || it?.tipoSolped || '').toString().trim();
      if (t) tiposItems.add(t);
    }
  }
  if (tiposItems.size === 1) return [...tiposItems][0];
  if (tiposItems.size > 1) return "Mixto";

  const nums = ocSolpeNums(o);
  const tiposSol = new Set();
  for (const n of nums) {
    const s = solIndexAllByNumero.get(n);
    const t = (s?.tipo_solped || '').toString().trim();
    if (t) tiposSol.add(t);
  }
  if (tiposSol.size === 1) return [...tiposSol][0];
  if (tiposSol.size > 1) return "Mixto";

  return nums.length ? "Sin tipo SOLPED" : "Sin SOLPED";
}


const vsEditorsPayload = ref({ labels: [], aprobadas: [], subidas: [] });


async function cargarTodo(force=false) {
  isLoading.value = true;
  lastError.value = "";

  if (!force) {
    const hit = getCache();
    if (hit) { pintarDesdePayload(hit); isLoading.value = false; return; }
  }

  const { start, end } = rangoDeMes(filtroMes.value);
  const startStr = `${filtroMes.value}-01`;
  const endStr = (() => {
    const y = Number(filtroMes.value.slice(0,4)), m = Number(filtroMes.value.slice(5));
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  })();

  try {
    let solPromise, ocPromise, solAllPromise;

    if (segmento.value === 'empresa') {
      const baseSol = query(
        collection(db, "solpes"),
        where("fecha", ">=", startStr),
        where("fecha", "<", endStr),
        orderBy("fecha", "asc")
      );
      solPromise = getDocs(baseSol);

      let ocQ = query(
        collection(db, "ordenes_oc"),
        where("fechaSubida", ">=", start),
        where("fechaSubida", "<", end),
        orderBy("fechaSubida", "asc")
      );
      if (filtroEstatusOC.value) ocQ = query(ocQ, where("estatus","==",filtroEstatusOC.value));
      ocPromise = getDocs(ocQ);


      solAllPromise = getDocs(collection(db, "solpes"));
    } else {
      const baseTal = query(
        collection(db, "solped_taller"),
        where("fecha", ">=", startStr),
        where("fecha", "<", endStr),
        orderBy("fecha", "asc")
      );
      solPromise = getDocs(baseTal);

      let ocTQ = query(
        collection(db, "ordenes_oc_taller"),
        where("fechaSubida", ">=", start),
        where("fechaSubida", "<", end),
        orderBy("fechaSubida", "asc")
      );
      if (filtroEstatusOC.value) ocTQ = query(ocTQ, where("estatus","==",filtroEstatusOC.value));
      ocPromise = getDocs(ocTQ);

      solAllPromise = getDocs(collection(db, "solped_taller"));
    }

    const [solSnap, ocSnap, solAllSnap] = await Promise.allSettled([solPromise, ocPromise, solAllPromise]);

    const baseSol = solSnap.status === "fulfilled" ? solSnap.value.docs.map(d => ({ id: d.id, ...d.data() })) : [];
    const baseOC  = ocSnap.status  === "fulfilled" ? ocSnap.value.docs.map(d => ({ id: d.id, ...d.data() }))  : [];
    const baseSolAll = solAllSnap.status === "fulfilled" ? solAllSnap.value.docs.map(d => ({ id: d.id, ...d.data() })) : [];

    // === Construcción de opciones (catálogos) desde los datos consultados ===
    const uniq = (arr) =>
      [...new Set(arr.map(v => String(v ?? '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));

    if (segmento.value === 'empresa') {
      contratosOptions.value = uniq(baseSolAll.map(x => x.numero_contrato || x.numeroContrato || ''));
      centroCostoOptions.value = uniq(baseSolAll.map(x => x.nombre_centro_costo || x.centroCostoNombre || ''));
    } else {
      contratosOptions.value = []; // no aplica
      centroCostoOptions.value = uniq(baseSolAll.map(x => x.centro_costo || x.centroCosto || x.centroCostoNombre || ''));
    }
    estatusSolpedOptions.value = uniq(baseSolAll.map(x => (x.estatus || x.estado || '')).map(String));
    tipoSolpedOptions.value    = uniq(baseSolAll.map(x => (x.tipo_solped || '')).map(String));
    monedaOptions.value        = uniq(baseOC.map(o => (o.moneda || 'CLP').toString().toUpperCase()));
    responsableOptions.value   = uniq(baseOC.map(o => (o.responsable || '—').toString()));

    // Index SOLPED (para hacer match OC ↔ SOLPED por número)
    const solIndexAllByNumero = buildSolIndexByNumero(baseSolAll);

    // ===== Filtros sobre SOLPED del mes =====
    const solMes = baseSol.filter(x => {
      const f = x.fechaSubida || x.creado_en || x.fecha;
      if (!isInRange(f, start, end)) return false;

      // Empresa (solo en segmento empresa)
      if (segmento.value === 'empresa' && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || '');
        if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
      }

      // Contrato / Centro de costo exactos
      if (segmento.value === 'empresa') {
        if (filtroContratoSel.value && String(x.numero_contrato || x.numeroContrato || '') !== filtroContratoSel.value) return false;
      } else {
        if (filtroCentroCostoSel.value && String(x.centro_costo || x.centroCosto || x.centroCostoNombre || '') !== filtroCentroCostoSel.value) return false;
      }

      // Estatus y Tipo
      if (filtroEstatusSolped.value && _normTxt(x.estatus || x.estado || '') !== _normTxt(filtroEstatusSolped.value)) return false;
      if (filtroTipoSolped.value && _normTxt(x.tipo_solped || '') !== _normTxt(filtroTipoSolped.value)) return false;

      return true;
    });

    // ✅ NUEVO: bandera si hay filtros “de SOLPED” activos (para aplicarlos a OC también)
    const solpedFiltersActive =
      (!!filtroEmpresa.value && segmento.value === 'empresa') ||
      (!!filtroContratoSel.value && segmento.value === 'empresa') ||
      (!!filtroCentroCostoSel.value && segmento.value === 'taller') ||
      !!filtroEstatusSolped.value ||
      !!filtroTipoSolped.value;

    // ===== Filtros sobre OC del mes =====
    const ocFiltradas = baseOC.filter(x => {
      const f = x.fechaSubida || x.fecha || x.creado_en;
      if (!isInRange(f, start, end)) return false;

      // Empresa (solo en segmento empresa)
      if (segmento.value === 'empresa' && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || '');
        if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
      }

      // Contrato/CC directo en OC (si existe)
      const valContrato = (x.numero_contrato || x.numeroContrato || '').toString();
      const valCC = (x.nombre_centro_costo || x.centroCostoNombre || x.centro_costo || x.centroCosto || x.centroCostoTexto || '').toString();
      if (segmento.value === 'empresa') {
        if (filtroContratoSel.value && valContrato && valContrato !== filtroContratoSel.value) return false;
      } else {
        if (filtroCentroCostoSel.value && valCC && valCC !== filtroCentroCostoSel.value) return false;
      }

      // OC filters
      if (filtroEstatusOC.value && _normTxt(x.estatus||'') !== _normTxt(filtroEstatusOC.value)) return false;
      if (filtroMonedaOC.value && (x.moneda || 'CLP').toString().toUpperCase() !== filtroMonedaOC.value) return false;
      if (filtroResponsableOC.value && (x.responsable || '—').toString() !== filtroResponsableOC.value) return false;

      // ✅ FIX CLAVE:
      // Si hay filtros de SOLPED activos, la OC debe matchear por SOLPED asociado (numero_solpe/numero_solped en doc o items)
      if (solpedFiltersActive) {
        const nums = ocSolpeNums(x);

        // Si hay números de SOLPED asociados → al menos uno debe calzar filtros SOLPED
        if (nums.length) {
          let ok = false;
          for (const n of nums) {
            const sol = solIndexAllByNumero.get(n);
            if (solMatchesSolpedFilters(sol)) { ok = true; break; }
          }
          if (!ok) return false;
        } else {
          // Si la OC no tiene link a SOLPED, fallback:
          // - si OC trae tipo_solped, lo comparamos
          if (filtroTipoSolped.value) {
            const t = (x.tipo_solped || x.tipoSolped || '').toString();
            if (!t || _normTxt(t) !== _normTxt(filtroTipoSolped.value)) return false;
          }
          // - si OC trae estatus_solped (raro), lo comparamos
          if (filtroEstatusSolped.value) {
            const es = (x.estatus_solped || x.estado_solped || '').toString();
            if (es && _normTxt(es) !== _normTxt(filtroEstatusSolped.value)) return false;
          }
          // - si no hay contrato/CC en OC, no lo forzamos aquí (ya filtraste arriba si existía)
        }
      }

      // Si el usuario filtró contrato/CC y la OC no trae ese campo, igual puede pasar por match SOLPED (arriba).
      // Si no trae SOLPED ni campo, quedará fuera solo si tipo/estatus SOLPED lo exige.

      // Si se filtró contrato/CC y la OC trae un contrato/CC vacío, pero sí tiene SOLPED asociado, también vale por match.
      if (segmento.value === 'empresa' && filtroContratoSel.value && !valContrato) {
        const nums = ocSolpeNums(x);
        if (nums.length) {
          let ok = false;
          for (const n of nums) {
            const sol = solIndexAllByNumero.get(n);
            const c = String(sol?.numero_contrato || sol?.numeroContrato || '');
            if (c === filtroContratoSel.value && solMatchesSolpedFilters(sol)) { ok = true; break; }
          }
          if (!ok) return false;
        }
      }
      if (segmento.value === 'taller' && filtroCentroCostoSel.value && !valCC) {
        const nums = ocSolpeNums(x);
        if (nums.length) {
          let ok = false;
          for (const n of nums) {
            const sol = solIndexAllByNumero.get(n);
            const cc = String(sol?.centro_costo || sol?.centroCosto || sol?.centroCostoNombre || '');
            if (cc === filtroCentroCostoSel.value && solMatchesSolpedFilters(sol)) { ok = true; break; }
          }
          if (!ok) return false;
        }
      }

      return true;
    });

    /* ===== KPIs base ===== */
    kpis.value.creadasMes = solMes.length;
    kpis.value.completadasMes = solMes.filter(x => _normTxt(x.estatus || x.estado || "") === "completado").length;
    kpis.value.ocMes = ocFiltradas.length;

    const totalOC = ocFiltradas.reduce((acc, x) => acc + ocMonto(x), 0);
    kpis.value.gastoMes = totalOC; // ✅ ahora sí respeta tipo/estatus/contrato/empresa/cc vía match SOLPED
    kpis.value.ticketProm = ocFiltradas.length ? Math.round(totalOC / ocFiltradas.length) : 0;

    /* ===== KPIs avanzados ===== */
    let conversionPct = 0;
    if (segmento.value === 'taller') {
      const setSol = new Set(solMes.map(x => Number(x.numero_solpe)).filter(Boolean));
      const setOcSol = new Set();
      for (const o of ocFiltradas) {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => { const n = Number(it.numero_solped || it.numero_solpe); if (n) setOcSol.add(n); });
        }
      }
      const match = [...setSol].filter(n => setOcSol.has(n)).length;
      conversionPct = setSol.size ? (100 * match / setSol.size) : 0;
    } else {
      const ocConSol = ocFiltradas.filter(o => _normTxt(o.tipo_solped || "") !== "sin solped").length;
      conversionPct = solMes.length ? (100 * ocConSol / solMes.length) : 0;
    }

    const toDays = (ms) => (ms / (1000*60*60*24));
    const leadTimes = [];
    for (const o of ocFiltradas) {
      const fInicio = normalizarFecha(o.fechaSubida || o.fecha || o.creado_en);
      let fAprob = o.fechaAprobacion ? normalizarFecha(o.fechaAprobacion) : null;
      if (!fAprob && Array.isArray(o.historial)) {
        const ap = o.historial.find(h => _normTxt(h.estatus||"") === "aprobado");
        if (ap?.fecha) fAprob = normalizarFecha(ap.fecha);
      }
      if (fInicio && fAprob && fAprob > fInicio) leadTimes.push(toDays(fAprob - fInicio));
    }
    const leadtimePromDias = leadTimes.length ? (leadTimes.reduce((a,b)=>a+b,0) / leadTimes.length) : 0;

    const rechazadas = ocFiltradas.filter(o => _normTxt(o.estatus||"") === "rechazado").length;
    const rechazoPct = ocFiltradas.length ? (100 * rechazadas / ocFiltradas.length) : 0;

    let comentariosTallerMes = 0;
    if (segmento.value === 'taller') {
      for (const s of solMes) if (Array.isArray(s.comentarios)) comentariosTallerMes += s.comentarios.length;
    }

    kpisExtra.value = { conversionPct, leadtimePromDias, rechazoPct, comentariosTallerMes };

    /* ===== Agregaciones para gráficos ===== */
    const contarPor = (arr, getKey) => {
      const m = new Map();
      for (const x of arr) {
        const k = (getKey(x) || '—').toString().trim();
        if (!k) continue;
        m.set(k, (m.get(k) || 0) + 1);
      }
      return [...m.entries()].sort((a,b) => b[1]-a[1]);
    };
    const contarValores = (list) => {
      const m = new Map();
      for (const k of list) m.set(k, (m.get(k) || 0) + 1);
      return [...m.entries()].sort((a,b) => b[1]-a[1]);
    };
    const agruparSuma = (arr, getKey, getVal) => {
      const m = new Map();
      for (const x of arr) {
        const k = getKey(x); const v = Number(getVal(x) || 0);
        m.set(k, (m.get(k) || 0) + v);
      }
      return [...m.entries()].sort((a,b) => b[1]-a[1]);
    };
    const agruparConteo = (arr, getKey) => {
      const m = {};
      for (const x of arr) {
        const k = (getKey(x) || '—').toString();
        m[k] = (m[k] || 0) + 1;
      }
      return m;
    };

    const topCreadores = contarPor(solMes, (x) =>
      (segmento.value === 'empresa')
        ? (x.usuario || x.dirigidoA?.[0] || '—')
        : (x.nombre_solicitante || x.usuario_sesion || x.usuario || '—')
    ).slice(0, 10);

    const mapCount = new Map();
    const mapSpend = new Map();
    for (const o of ocFiltradas) {
      const resp = (o.responsable || '—').toString();
      mapCount.set(resp, (mapCount.get(resp) || 0) + 1);
      mapSpend.set(resp, (mapSpend.get(resp) || 0) + ocMonto(o));
    }
    const topOCEntries = [...mapCount.entries()].sort((a,b)=> b[1]-a[1]).slice(0, 10);
    const topOCLabels = topOCEntries.map(([k]) => k);
    const topOCValues = topOCEntries.map(([,v]) => v);
    const topOCSpends = topOCEntries.map(([k]) => mapSpend.get(k) || 0);

    const gastoContrato = agruparSuma(
      ocFiltradas,
      (x) => (x.numero_contrato || x.nombre_centro_costo || x.centroCosto || x.centroCostoNombre || x.centro_costo || x.centroCostoTexto || '—').toString(),
      (x) => ocMonto(x)
    ).slice(0, 12);

    const conteoContrato = contarPor(ocFiltradas, (x) =>
      (x.numero_contrato || x.nombre_centro_costo || x.centroCosto || x.centroCostoNombre || x.centro_costo || x.centroCostoTexto || '—').toString()
    ).slice(0, 12);

    const distEstatus = agruparConteo(solMes, (x) => (x.estatus || x.estado || '—').toString());
    const distTipoSolped = agruparConteo(solMes, (x) => (x.tipo_solped || '—').toString());

    const serieDiariaGasto = (ocs, start, end) => {
      const labels = [];
      const values = [];
      const d = new Date(start);
      while (d < end) {
        labels.push(d.toISOString().slice(0,10));
        const daySum = ocs.reduce((acc, x) => {
          const fx = normalizarFecha(x.fechaSubida || x.fecha || x.creado_en);
          if (fx.getFullYear()===d.getFullYear() && fx.getMonth()===d.getMonth() && fx.getDate()===d.getDate()) {
            return acc + ocMonto(x);
          }
          return acc;
        }, 0);
        values.push(daySum);
        d.setDate(d.getDate()+1);
      }
      return { labels, values };
    };
    const serieGasto = serieDiariaGasto(ocFiltradas, start, end);

    const aprobEntries = [];
    for (const o of ocFiltradas) {
      if (Array.isArray(o.historial)) {
        o.historial.forEach(h => {
          const es = _normTxt(h.estatus||"");
          if (es === "aprobado" || es === "preaprobado") aprobEntries.push(h.usuario || '—');
        });
      }
    }
    const topAprobadores = contarValores(aprobEntries).slice(0, 10);
    const distMoneda = agruparConteo(ocFiltradas, (x) => (x.moneda || 'CLP').toString().toUpperCase());

    const hoyList = solMes.filter(x => esHoy(x.fecha || x.creado_en || x.fechaSubida));
    const topHoyArr = contarPor(
      hoyList.map(x => ({ nombre: (segmento.value === 'empresa') ? (x.usuario || x.dirigidoA?.[0]) : (x.nombre_solicitante || x.usuario_sesion || x.usuario) })),
      (r) => (r && r.nombre) || '—'
    ).slice(0, 10);
    topHoy.value = topHoyArr.map(([nombre, cantidad]) => ({ nombre, cantidad }));

    const pendientesPorDirigidoA = (solList, allowedStatuses = ['pendiente']) => {
      const allow = new Set(allowedStatuses.map(_normTxt));
      const soloPermitidos = solList.filter(s => allow.has(_normTxt(s.estatus || s.estado || '')));
      const m = new Map();
      const add = (name) => {
        const k = String(name || '—').trim();
        if (!k) return;
        m.set(k, (m.get(k) || 0) + 1);
      };
      for (const s of soloPermitidos) {
        const da = s.dirigidoA;
        if (Array.isArray(da)) da.forEach(add);
        else if (typeof da === 'string') {
          const parts = da.split(/[,;|]/).map(v => v.trim()).filter(Boolean);
          if (parts.length) parts.forEach(add); else add(da);
        }
      }
      return [...m.entries()].sort((a,b)=> b[1]-a[1]);
    };

    const pendEntries = pendientesPorDirigidoA(solMes, ['pendiente']).slice(0, 15);
    const pendLabels = pendEntries.map(([k]) => k);
    const pendValues = pendEntries.map(([,v]) => v);

    const pendAllEntries = pendientesPorDirigidoA(baseSolAll, ['pendiente']).slice(0, 15);
    const pendAllLabels = pendAllEntries.map(([k]) => k);
    const pendAllValues = pendAllEntries.map(([,v]) => v);

    /* ===== ✅ NUEVO: Pies OC por tipo (count y monto) ===== */
    const aggByKey = (ocs, getKey) => {
      const mCount = new Map();
      const mMonto = new Map();
      for (const o of ocs) {
        const k = String(getKey(o) || '—').trim() || '—';
        mCount.set(k, (mCount.get(k) || 0) + 1);
        mMonto.set(k, (mMonto.get(k) || 0) + ocMonto(o));
      }
      const labels = [...mCount.keys()].sort((a,b)=>a.localeCompare(b,'es'));
      const counts = labels.map(l => mCount.get(l) || 0);
      const montos = labels.map(l => mMonto.get(l) || 0);
      return {
        labels,
        counts,
        montos,
        totalCount: ocs.length,
        totalMonto: montos.reduce((a,b)=>a+b,0),
      };
    };

    const ocTipoAgg = aggByKey(ocFiltradas, ocTipoOC);
    const ocTipoSolpedAgg = aggByKey(ocFiltradas, (o) => ocTipoSolped(o, solIndexAllByNumero));

    /* ===== NUEVO: VS Cotizaciones Aprobadas vs Órdenes Subidas (solo EDITORS) ===== */
    // Traer 'Usuarios' con role editor
    let editorsSet = new Set();
    try {
      const usersQ = query(collection(db, "Usuarios"), where("role", "in", ["editor", "Editor"]));
      const usersSnap = await getDocs(usersQ);
      usersSnap.forEach(d => {
        const u = d.data() || {};
        const name = (u.fullName || u.displayName || u.email || "").toString().trim();
        if (name) editorsSet.add(name);
      });
    } catch (e) {
      console.warn("No se pudo cargar Usuarios (role=editor). VS quedará vacío.", e);
    }

    // Reglas de estatus para las dos series
    const isAprobadaLike = (s) => {
      const n = _normTxt(s || "");
      // Incluye Aprobado, Preaprobado, Revisión Guillermo
      return n === "aprobado" || n === "preaprobado" || n.includes("revision") || n.includes("revisión");
    };
    const isSubidaProveedor = (s) => _normTxt(s || "").includes("proveedor");

    // Agrupar por responsable, solo si está en editorsSet
    const porResp = new Map(); // resp -> { aprobadas: n, subidas: n }
    for (const o of ocFiltradas) {
      const resp = (o.responsable || "—").toString().trim();
      if (!resp || !editorsSet.has(resp)) continue;

      const est = o.estatus || "";
      const cur = porResp.get(resp) || { aprobadas: 0, subidas: 0 };
      if (isAprobadaLike(est)) cur.aprobadas += 1;
      if (isSubidaProveedor(est)) cur.subidas += 1;
      porResp.set(resp, cur);
    }

    const entriesVS = [...porResp.entries()]
      .sort((a,b) => (b[1].aprobadas + b[1].subidas) - (a[1].aprobadas + a[1].subidas))
      .slice(0, 20);

    const vsLabels = entriesVS.map(([k]) => k);
    const vsAprobadas = entriesVS.map(([,v]) => v.aprobadas);
    const vsSubidas = entriesVS.map(([,v]) => v.subidas);

    const payload = {
      kpis: { ...kpis.value },
      kpisExtra: { ...kpisExtra.value },
      topCreadores,
      topOC: { labels: topOCLabels, counts: topOCValues, spends: topOCSpends },
      gastoContrato, conteoContrato,
      distEstatus, distTipoSolped, distMoneda,
      serieGasto,
      topAprobadores,
      topHoy: topHoy.value,
      solpedPend: { labels: pendLabels, values: pendValues },
      solpedPendAll: { labels: pendAllLabels, values: pendAllValues },

      // NUEVO payload VS
      vsEditors: { labels: vsLabels, aprobadas: vsAprobadas, subidas: vsSubidas },

      // ✅ NUEVO payload pies OC
      ocTipoAgg,
      ocTipoSolpedAgg,
    };

    const thisKey = cacheKey();
    const asJSON = JSON.stringify(payload);
    if (thisKey !== _lastPayloadKey || asJSON !== _lastPayloadJSON) {
      pintarDesdePayload(payload);
      _lastPayloadKey = thisKey;
      _lastPayloadJSON = asJSON;
      setCache(payload);
    }
  } catch (err) {
    console.error(err);
    lastError.value = (err && err.message) ? err.message : 'No se pudieron cargar las estadísticas.';
  } finally {
    isLoading.value = false;
  }
}

/* ====== Charts ====== */
function destroyAll() {
  Object.values(charts).forEach(ch => { try { ch && ch.destroy && ch.destroy(); } catch(e) {console.error(e)} });
  charts = {
    topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null,
    tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null,
    solpedPend: null, solpedPendAll: null, vsEditors: null,

    ocTipoCountPie: null,
    ocTipoMontoPie: null,
    ocTipoSolpedCountPie: null,
    ocTipoSolpedMontoPie: null,
  };
}

function drawBar(canvas, key, labels, values, dsLabel, formatter, extraTooltipCb) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: dsLabel, data: values, maxBarThickness: 28, borderWidth: 1 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const base = `${dsLabel}: ${formatter ? formatter(ctx.parsed.y) : ctx.parsed.y}`;
              const ext = extraTooltipCb ? extraTooltipCb(ctx) : '';
              return ext ? `${base}  —  ${ext}` : base;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero:true, ticks:{ callback: (v) => formatter ? formatter(v) : v } },
        x: { ticks:{ autoSkip:false } }
      }
    }
  });
}

function drawHBar(canvas, key, labels, values, dsLabel, formatter, extraTooltipCb) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: dsLabel, data: values, maxBarThickness: 28, borderWidth: 1 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend:{ display:false },
        tooltip:{ callbacks:{ label:(ctx)=> {
          const base = `${dsLabel}: ${formatter ? formatter(ctx.parsed.x) : ctx.parsed.x}`;
          const ext = extraTooltipCb ? extraTooltipCb(ctx) : '';
          return ext ? `${base}  —  ${ext}` : base;
        }}}
      },
      layout: { padding: { right: 8, left: 8 } },
      scales: {
        x: { beginAtZero:true, ticks:{ callback:(v)=> formatter ? formatter(v) : v }},
        y: { ticks:{ autoSkip:false, mirror:false }}
      }
    }
  });
}

function drawPie(canvas, key, labels, values, valueFormatter) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();

  const total = values.reduce((a,b)=>a+(Number(b)||0), 0) || 0;

  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: { labels, datasets: [{ data: values }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.parsed) || 0;
              const pct = total ? (100 * v / total) : 0;
              const pretty = valueFormatter ? valueFormatter(v) : v;
              return `${ctx.label}: ${pretty} (${pct.toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });
}

function drawLineMoney(canvas, key, labels, values, dsLabel) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: dsLabel, data: values, tension: 0.25, fill: false }] },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=> `${dsLabel}: ${formatearCLP(ctx.parsed.y)}` }}} ,
      scales:{ y:{ ticks:{ callback:(v)=> formatearCLP(v) }, beginAtZero:true } }
    }
  });
}

// NUEVO: barras agrupadas (dos datasets)
function drawGroupedBar(canvas, key, labels, series, formatters = {}) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: series.map((s) => ({
        label: s.label,
        data: s.data,
        maxBarThickness: 28,
        borderWidth: 1
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              const fmt = formatters[ctx.datasetIndex];
              return `${ctx.dataset.label}: ${fmt ? fmt(v) : v}`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => v } },
        x: { ticks: { autoSkip: false } }
      }
    }
  });
}

function pintarDesdePayload(p){
  // KPIs/tabla
  kpis.value = { ...p.kpis };
  kpisExtra.value = { ...p.kpisExtra };
  topHoy.value = p.topHoy || [];

  // ✅ payloads pies OC
  ocTipoAggPayload.value = p.ocTipoAgg || { labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 };
  ocTipoSolpedAggPayload.value = p.ocTipoSolpedAgg || { labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 };

  // Gráficos existentes
  drawBar(cTopCreadores.value, 'topCread', (p.topCreadores||[]).map(([k])=>k), (p.topCreadores||[]).map(([,v])=>v), 'Creadas');
  drawPie(cEstatusPie.value, 'estatusPie', Object.keys(p.distEstatus || {}), Object.values(p.distEstatus || {}));
  drawLineMoney(cGastoLine.value, 'gastoLine', p.serieGasto.labels, p.serieGasto.values, 'Gasto diario');
  drawHBar(cGastoContratoH.value, 'gastoContrato', p.gastoContrato.map(([k])=>k), p.gastoContrato.map(([,v])=>v), 'Gasto CLP', formatearCLP);
  drawPie(cTipoSolpedPie.value, 'tipoSolped', Object.keys(p.distTipoSolped || {}), Object.values(p.distTipoSolped || {}));
  drawBar(cTopAprobadores.value, 'topAprob', (p.topAprobadores||[]).map(([k])=>k), (p.topAprobadores||[]).map(([,v])=>v), 'Aprobaciones');
  drawPie(cMonedaPie.value, 'monedaPie', Object.keys(p.distMoneda || {}), Object.values(p.distMoneda || {}));
  drawHBar(cConteoContratoH.value, 'conteoContrato', p.conteoContrato.map(([k])=>k), p.conteoContrato.map(([,v])=>v), 'OC', null);

  if (p.topOC && Array.isArray(p.topOC.labels)) {
    drawBar(
      cTopOC.value,
      'topOC',
      p.topOC.labels,
      p.topOC.counts,
      'OC',
      null,
      (ctx) => `Gasto: ${formatearCLP(p.topOC.spends[ctx.dataIndex] || 0)}`
    );
  }

  if (p.solpedPend) {
    drawBar(cSolpedPendH.value, 'solpedPend', p.solpedPend.labels, p.solpedPend.values, 'Pendientes', null);
  }
  if (p.solpedPendAll) {
    drawBar(cSolpedPendAll.value, 'solpedPendAll', p.solpedPendAll.labels, p.solpedPendAll.values, 'Pendientes', null);
  }

  // VS data visible + chart
  vsEditorsPayload.value = p.vsEditors || { labels: [], aprobadas: [], subidas: [] };
  if (p.vsEditors && Array.isArray(p.vsEditors.labels)) {
    drawGroupedBar(
      cVsAprobadasSubidas.value,
      'vsEditors',
      p.vsEditors.labels,
      [
        { label: 'Cotizaciones aprobadas', data: p.vsEditors.aprobadas },
        { label: 'Órdenes subidas', data: p.vsEditors.subidas },
      ]
    );
  }

  // ✅ NUEVO: tortas OC (Cantidad y Monto)
  if (p.ocTipoAgg?.labels?.length) {
    drawPie(cOcTipoCountPie.value, 'ocTipoCountPie', p.ocTipoAgg.labels, p.ocTipoAgg.counts);
    drawPie(cOcTipoMontoPie.value, 'ocTipoMontoPie', p.ocTipoAgg.labels, p.ocTipoAgg.montos, formatearCLP);
  } else {
    charts.ocTipoCountPie?.destroy?.(); charts.ocTipoMontoPie?.destroy?.();
  }

  if (p.ocTipoSolpedAgg?.labels?.length) {
    drawPie(cOcTipoSolpedCountPie.value, 'ocTipoSolpedCountPie', p.ocTipoSolpedAgg.labels, p.ocTipoSolpedAgg.counts);
    drawPie(cOcTipoSolpedMontoPie.value, 'ocTipoSolpedMontoPie', p.ocTipoSolpedAgg.labels, p.ocTipoSolpedAgg.montos, formatearCLP);
  } else {
    charts.ocTipoSolpedCountPie?.destroy?.(); charts.ocTipoSolpedMontoPie?.destroy?.();
  }
}
</script>

<style scoped>
:root{ --sidenav-w: 264px; }

.dashboard-page{ min-height: 100vh; background: #f8fafc; }
@media (min-width: 992px){
  .dashboard-page.with-sidenav{ padding-left: var(--sidenav-w); }
}


@media (min-width: 576px){ .h4-sm{ font-size: 1.35rem; } }

.card { border-radius: 1rem; }
.card-header { border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
.card-body { min-height: 280px; }
.table > :not(caption) > * > * { vertical-align: middle; }

/* Botoneras que envuelven bien en móviles */
.btn-group.flex-wrap .btn{ border-radius: .5rem !important; }
.btn-group.flex-wrap .btn + .btn{ margin-left: .25rem; }
@media (max-width: 576px){
  .btn-group.flex-wrap{ gap: .25rem; }
}

/* Charts: altura flexible y canvases llenan ancho */
.chart-fixed-h{ min-height: 300px; max-height: 380px; }
canvas{ width:100% !important; height:100% !important; display:block; }

/* Caja para 2 pies dentro del mismo card sin que se rompa */
.pie-box{
  height: 260px;
}

/* Loading UX */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: start center;
  padding-top: 12vh;
  background: rgba(248, 249, 250, 0.107);
  backdrop-filter: blur(3px);
}
.loading-card {
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  text-align: center;
}

.content-wrap.is-blurred { filter: blur(1.5px); pointer-events: none; user-select: none; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Offcanvas filtros móvil */
.offcanvas-backdrop{
  position: fixed; inset: 0; z-index: 1080; display: grid; place-items: center;
  background: rgba(0,0,0,.45);
}
.offcanvas-panel{
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 560px; max-width: 95vw;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  display: flex; flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,.25);
  border-top-left-radius:.75rem; border-bottom-left-radius:.75rem;
  animation: slideIn .18s ease-out both;
}
.offcanvas-panel-sm{ width: 420px; max-width: 96vw; }
@keyframes slideIn { from{ transform: translateX(20px); opacity: 0; } to{ transform:none; opacity:1; } }
.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem; border-bottom: 1px solid var(--bs-border-color);
}
.offcanvas-footer{ border-top: 1px solid var(--bs-border-color); border-bottom: 0; }
.offcanvas-body{ padding: 1rem; overflow: auto; }


select.form-select { max-width: 100%; text-overflow: ellipsis; }
</style>
