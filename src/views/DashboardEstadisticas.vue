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

        <!-- Segmentos -->
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

            <!-- ✅ NUEVO -->
            <button
              class="btn"
              :class="segmento==='general' ? 'btn-primary' : 'btn-outline-primary'"
              @click="setSegmento('general')"
              :disabled="isLoading"
              title="Suma de Empresa + Taller"
            >
              🧩 SOLPED General
            </button>
          </div>
        </div>

        <!-- Filtro empresa (solo segmento empresa) -->
        <div class="mb-3" v-if="segmento==='empresa'">
          <div class="btn-group flex-wrap gap-1">
            <button class="btn" :class="empresaSegmento==='todas' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('todas')" :disabled="isLoading">Todas</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Mining' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Mining')" :disabled="isLoading">⛏ Mining</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Servicio')" :disabled="isLoading">🛠 Servicios</button>
            <button class="btn" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Hormigones')" :disabled="isLoading">🧱 Hormigones</button>
          </div>
        </div>

        <!-- Filtros (desktop) -->
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

              <div class="col-12 col-md-3" v-else-if="segmento==='taller'">
                <label class="form-label">Centro de Costo</label>
                <select class="form-select" v-model="filtroCentroCostoSel" @change="onFiltroChange" :disabled="isLoading">
                  <option value="">Todos</option>
                  <option v-for="opt in centroCostoOptions" :key="'cc-'+opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <!-- En General ocultamos contrato/cc (porque mezcla ambas) -->
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
              <div class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <div class="fw-medium">Top generadores de OC (mes)</div>

                <span class="badge bg-dark-subtle text-dark-emphasis">
                  Gasto mes: <strong class="ms-1">{{ formatearCLP(kpis.gastoMes) }}</strong>
                </span>
              </div>

              <div class="card-body">
                <div class="chart-fixed-h">
                  <canvas ref="cTopOC"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header d-flex align-items-center justify-content-between">
                <div class="fw-medium">Desglose OC por cotizador y estatus (mes)</div>
                <span class="badge bg-dark-subtle text-dark-emphasis" v-if="ocStatusByUserPayload?.users?.length">
                  {{ ocStatusByUserPayload.users.length }} usuarios (top)
                </span>
              </div>

              <div class="card-body">
                <div class="chart-fixed-h mb-3" style="min-height: 420px;">
                  <canvas ref="cOcStatusByUser"></canvas>
                </div>

                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0 table-sticky">
                    <thead class="table-light">
                      <tr>
                        <th style="min-width: 220px;">Cotizador</th>
                        <th class="text-end" v-for="st in OC_ESTATUS_CANON" :key="'h-'+st">{{ st }}</th>
                        <th class="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in ocStatusByUserPayload.rows" :key="row.user">
                        <td class="fw-medium">{{ row.user }}</td>
                        <td class="text-end" v-for="st in OC_ESTATUS_CANON" :key="row.user+'-'+st">{{ row.counts[st] || 0 }}</td>
                        <td class="text-end fw-semibold">{{ row.total }}</td>
                      </tr>
                      <tr v-if="!ocStatusByUserPayload.rows.length">
                        <td colspan="99" class="text-center text-muted py-3">Sin datos para el mes con estos filtros.</td>
                      </tr>
                    </tbody>
                  </table>
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
              <div class="card-header"><div class="fw-medium">Gasto por Contrato / CC</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cGastoContratoH"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">OC por Contrato / CC</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="cConteoContratoH"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header d-flex align-items-center justify-content-between">
                <div class="fw-medium">Cotizaciones aprobadas vs Órdenes subidas</div>
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

            <div class="col-12" v-else-if="segmento==='taller'">
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
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/stores/firebase";


const OC_ESTATUS_CANON = [
  "Aprobado",
  "Preaprobado",
  "Pendiente de Aprobación",
  "Revisión Guillermo",
  "Enviada a proveedor",
  "Rechazado",
];

const isLoading = ref(false);
const lastError = ref("");
const filtrosOpen = ref(false);
const toggleFiltros = (v) => { filtrosOpen.value = !!v; };

const segmento = ref(localStorage.getItem('xt_dashboard_segmento') || 'empresa');
function setSegmento(v) {
  if (v === 'empresa' || v === 'taller' || v === 'general') {
    segmento.value = v;
    localStorage.setItem('xt_dashboard_segmento', v);
    if (v === 'general') {
      empresaSegmento.value = 'todas';
      filtroEmpresa.value = '';
      filtroContratoSel.value = '';
      filtroCentroCostoSel.value = '';
    }

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

const tituloSegmento = computed(() => {
  if (segmento.value === 'empresa') return 'SOLPED';
  if (segmento.value === 'taller') return 'SOLPED Taller';
  return 'SOLPED (Empresa + Taller)';
});

const kpiCards = computed(() => ([
  { t: `${tituloSegmento.value} completadas (mes)`, v: kpis.value.completadasMes },
  { t: `OC generadas (mes)`, v: kpis.value.ocMes, s: (filtroEstatusOC.value ? `Filtro estatus: ${filtroEstatusOC.value}` : '—') },
  { t: `Gasto total (mes)`, v: kpis.value.gastoMes, isMoney: true },
]));



/* ====== Datos auxiliares ====== */
const topHoy = ref([]);

const ocTipoAggPayload = ref({ labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 });
const ocTipoSolpedAggPayload = ref({ labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 });

/* ✅ NUEVO payload para desglose por usuario/estatus */
const ocStatusByUserPayload = ref({ users: [], rows: [], datasets: [] });

/* ====== Refs charts ====== */
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

/* ✅ NUEVO */
const cOcStatusByUser = ref(null);

let charts = {
  topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null,
  tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null,
  solpedPend: null, solpedPendAll: null, vsEditors: null,

  ocTipoCountPie: null,
  ocTipoMontoPie: null,
  ocTipoSolpedCountPie: null,
  ocTipoSolpedMontoPie: null,

  ocStatusByUser: null,
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

function onFiltroChange() {}
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
    "dashV13",
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
function setCache(payload) { try { sessionStorage.setItem(cacheKey(), JSON.stringify({ t: Date.now(), payload })); } catch(e){ console.error(e); } }

function _normTxt(v='') {
  return String(v || "").normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
}

/* ====== Canon de estatus OC ====== */
function canonOcStatus(raw) {
  const n = _normTxt(raw || "");
  if (!n) return "Pendiente de Aprobación";

  if (n.includes("aprobado") && !n.includes("pre")) return "Aprobado";
  if (n.includes("pre") && n.includes("aprob")) return "Preaprobado";
  if (n.includes("prepaprob")) return "Preaprobado"; // typo frecuente
  if (n.includes("pend")) return "Pendiente de Aprobación";
  if (n.includes("revision guillermo") || (n.includes("revision") && n.includes("guillermo")) || (n.includes("revisión") && n.includes("guillermo"))) {
    return "Revisión Guillermo";
  }
  if (n.includes("proveedor")) return "Enviada a proveedor";
  if (n.includes("rech")) return "Rechazado";

  // fallback
  if (n.includes("aprob")) return "Aprobado";
  return "Pendiente de Aprobación";
}

/* ====== Utils OC/SOLPED ====== */
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

  // Empresa solo aplica en segmento empresa
  if (segmento.value === 'empresa' && filtroEmpresa.value) {
    const emp = String(sol.empresa || sol.empresas || '');
    if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
  }

  // Contrato/CC solo aplica si corresponde
  if (segmento.value === 'empresa') {
    const c = String(sol.numero_contrato || sol.numeroContrato || '');
    if (filtroContratoSel.value && c !== filtroContratoSel.value) return false;
  } else if (segmento.value === 'taller') {
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

/* ✅ NUEVO: SOLPED completado-like (incluye cotizado parcial/completado) */
function solIsCompletedLike(sol) {
  const canon = canonSolpedStatus(sol?.estatus || sol?.estado || "");
  const n = _normTxt(canon);

  if (!n) return false;
  if (n === "completado") return true;

  // ✅ incluye cotizado/cotizando parcial o completado
  if ((n.includes("cotizado") || n.includes("cotizando")) && (n.includes("parcial") || n.includes("complet"))) {
    return true;
  }

  return false;
}

// ✅ Normaliza estatus SOLPED para conteos (arregla "Cotizando" -> "Cotizado")
function canonSolpedStatus(raw) {
  const txt = String(raw || "").trim();
  const n = _normTxt(txt);

  // si viene "cotizando parcial" lo convertimos a "Cotizado Parcial"
  if (n.includes("cotizando") && n.includes("parcial")) return "Cotizado Parcial";

  // si viene "cotizando completado" o similar
  if (n.includes("cotizando") && n.includes("complet")) return "Cotizado Completado";

  // si ya viene bien, devolvemos el original (pero con capitalización estándar cuando aplique)
  if (n.includes("cotizado") && n.includes("parcial")) return "Cotizado Parcial";
  if (n.includes("cotizado") && n.includes("complet")) return "Cotizado Completado";

  return txt; // otros estatus quedan iguales
}

/* ====== Catálogos (rápidos) ====== */
const CATALOG_TTL_MS = 12 * 60 * 60 * 1000; // 12h
function catKey() { return `dashCatV2:${segmento.value}`; }
function getCatalogCache() {
  try {
    const raw = sessionStorage.getItem(catKey());
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o?.t || !o?.payload) return null;
    if (Date.now() - o.t > CATALOG_TTL_MS) return null;
    return o.payload;
  } catch { return null; }
}
function setCatalogCache(payload) {
  try { sessionStorage.setItem(catKey(), JSON.stringify({ t: Date.now(), payload })); } catch(e) {console.log(e)}
}
function uniqSorted(arr) {
  return [...new Set(arr.map(v => String(v ?? '').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'es'));
}

async function cargarCatalogosRapidos() {
  const hit = getCatalogCache();
  if (hit) {
    contratosOptions.value = hit.contratos || [];
    centroCostoOptions.value = hit.cc || [];
    estatusSolpedOptions.value = hit.estSol || [];
    tipoSolpedOptions.value = hit.tipoSol || [];
    return;
  }

  try {
    // Tomamos una “muestra grande” reciente (limit) en vez de traerse toda la colección
    const sample = [];

    if (segmento.value === 'empresa') {
      const snap = await getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(1200)));
      snap.forEach(d => sample.push(d.data() || {}));
      contratosOptions.value = uniqSorted(sample.map(x => x.numero_contrato || x.numeroContrato || ''));
      centroCostoOptions.value = uniqSorted(sample.map(x => x.nombre_centro_costo || x.centroCostoNombre || ''));
    } else if (segmento.value === 'taller') {
      const snap = await getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(1200)));
      snap.forEach(d => sample.push(d.data() || {}));
      contratosOptions.value = [];
      centroCostoOptions.value = uniqSorted(sample.map(x => x.centro_costo || x.centroCosto || x.centroCostoNombre || ''));
    } else {
      // general: mezcla
      const [a, b] = await Promise.allSettled([
        getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(900))),
        getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(900))),
      ]);
      if (a.status === "fulfilled") a.value.forEach(d => sample.push(d.data() || {}));
      if (b.status === "fulfilled") b.value.forEach(d => sample.push(d.data() || {}));
      contratosOptions.value = [];
      centroCostoOptions.value = [];
    }

    estatusSolpedOptions.value = uniqSorted(sample.map(x => (x.estatus || x.estado || '')).map(String));
    tipoSolpedOptions.value = uniqSorted(sample.map(x => (x.tipo_solped || '')).map(String));

    setCatalogCache({
      contratos: contratosOptions.value,
      cc: centroCostoOptions.value,
      estSol: estatusSolpedOptions.value,
      tipoSol: tipoSolpedOptions.value,
    });
  } catch (e) {
    console.warn("No se pudo cargar catálogos rápidos", e);
  }
}

/* ====== VS payload ====== */
const vsEditorsPayload = ref({ labels: [], aprobadas: [], subidas: [] });

/* ====== Helper: chunks para queries IN ====== */
function chunkArray(arr, size=10) {
  const out = [];
  for (let i=0; i<arr.length; i+=size) out.push(arr.slice(i, i+size));
  return out;
}

/* ====== Cargar dashboard ====== */
async function cargarTodo(force=false) {
  isLoading.value = true;
  lastError.value = "";

  // catálogos “rápidos” (no bloquea)
  cargarCatalogosRapidos().catch(()=>{});

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
    /* === 1) Traer datos base por mes (queries acotadas) === */
    let solDocsMes = [];
    let solDocsMesTaller = [];
    let ocDocsMes = [];
    let ocDocsMesTaller = [];
    let solAllForPend = []; // para "pendientes (todos los meses)" (muestra limitada)

    if (segmento.value === 'empresa') {
      const solQ = query(collection(db, "solpes"), where("fecha", ">=", startStr), where("fecha", "<", endStr), orderBy("fecha", "asc"));
      const ocQ  = query(collection(db, "ordenes_oc"), where("fechaSubida", ">=", start), where("fechaSubida", "<", end), orderBy("fechaSubida", "asc"));

      const [solSnap, ocSnap, solPendSnap] = await Promise.allSettled([
        getDocs(solQ),
        getDocs(ocQ),
        getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(2500))),
      ]);

      solDocsMes = solSnap.status === "fulfilled" ? solSnap.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      ocDocsMes  = ocSnap.status  === "fulfilled" ? ocSnap.value.docs.map(d => ({ id:d.id, ...d.data() }))  : [];
      solAllForPend = solPendSnap.status === "fulfilled" ? solPendSnap.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
    }

    if (segmento.value === 'taller') {
      const solQ = query(collection(db, "solped_taller"), where("fecha", ">=", startStr), where("fecha", "<", endStr), orderBy("fecha", "asc"));
      const ocQ  = query(collection(db, "ordenes_oc_taller"), where("fechaSubida", ">=", start), where("fechaSubida", "<", end), orderBy("fechaSubida", "asc"));

      const [solSnap, ocSnap, solPendSnap] = await Promise.allSettled([
        getDocs(solQ),
        getDocs(ocQ),
        getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(2500))),
      ]);

      solDocsMesTaller = solSnap.status === "fulfilled" ? solSnap.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      ocDocsMesTaller  = ocSnap.status  === "fulfilled" ? ocSnap.value.docs.map(d => ({ id:d.id, ...d.data() }))  : [];
      solAllForPend = solPendSnap.status === "fulfilled" ? solPendSnap.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
    }

    if (segmento.value === 'general') {
      const solEmpQ = query(collection(db, "solpes"), where("fecha", ">=", startStr), where("fecha", "<", endStr), orderBy("fecha", "asc"));
      const solTalQ = query(collection(db, "solped_taller"), where("fecha", ">=", startStr), where("fecha", "<", endStr), orderBy("fecha", "asc"));
      const ocEmpQ  = query(collection(db, "ordenes_oc"), where("fechaSubida", ">=", start), where("fechaSubida", "<", end), orderBy("fechaSubida", "asc"));
      const ocTalQ  = query(collection(db, "ordenes_oc_taller"), where("fechaSubida", ">=", start), where("fechaSubida", "<", end), orderBy("fechaSubida", "asc"));

      const [solEmp, solTal, ocEmp, ocTal, pendEmp, pendTal] = await Promise.allSettled([
        getDocs(solEmpQ),
        getDocs(solTalQ),
        getDocs(ocEmpQ),
        getDocs(ocTalQ),
        getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(1500))),
        getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(1500))),
      ]);

      solDocsMes = solEmp.status === "fulfilled" ? solEmp.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      solDocsMesTaller = solTal.status === "fulfilled" ? solTal.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      ocDocsMes = ocEmp.status === "fulfilled" ? ocEmp.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      ocDocsMesTaller = ocTal.status === "fulfilled" ? ocTal.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];

      const pendA = pendEmp.status === "fulfilled" ? pendEmp.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      const pendB = pendTal.status === "fulfilled" ? pendTal.value.docs.map(d => ({ id:d.id, ...d.data() })) : [];
      solAllForPend = [...pendA, ...pendB];
    }

    /* === 2) Unificar listas según segmento === */
    const baseSolMes = (segmento.value === "empresa") ? solDocsMes
                    : (segmento.value === "taller")  ? solDocsMesTaller
                    : [...solDocsMes, ...solDocsMesTaller];

    const baseOCMes = (segmento.value === "empresa") ? ocDocsMes
                  : (segmento.value === "taller")  ? ocDocsMesTaller
                  : [...ocDocsMes, ...ocDocsMesTaller];

    /* === 3) Catálogos OC (desde lo del mes: rápido) === */
    monedaOptions.value = uniqSorted(baseOCMes.map(o => (o.moneda || 'CLP').toString().toUpperCase()));
    responsableOptions.value = uniqSorted(baseOCMes.map(o => (o.responsable || '—').toString()));

    /* === 4) Filtro SOLPED del mes === */
    const solMes = baseSolMes.filter(x => {
      const f = x.fechaSubida || x.creado_en || x.fecha;
      if (!isInRange(f, start, end)) return false;

      // Empresa sólo en empresa (no general)
      if (segmento.value === 'empresa' && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || '');
        if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
      }

      // Contrato/CC solo cuando aplica
      if (segmento.value === 'empresa') {
        if (filtroContratoSel.value && String(x.numero_contrato || x.numeroContrato || '') !== filtroContratoSel.value) return false;
      } else if (segmento.value === 'taller') {
        if (filtroCentroCostoSel.value && String(x.centro_costo || x.centroCosto || x.centroCostoNombre || '') !== filtroCentroCostoSel.value) return false;
      }

      if (filtroEstatusSolped.value && _normTxt(x.estatus || x.estado || '') !== _normTxt(filtroEstatusSolped.value)) return false;
      if (filtroTipoSolped.value && _normTxt(x.tipo_solped || '') !== _normTxt(filtroTipoSolped.value)) return false;

      return true;
    });

    const solpedFiltersActive =
      ((segmento.value === 'empresa') && (!!filtroEmpresa.value || !!filtroContratoSel.value)) ||
      ((segmento.value === 'taller') && !!filtroCentroCostoSel.value) ||
      !!filtroEstatusSolped.value ||
      !!filtroTipoSolped.value;

    /* === 5) Construir índice SOLPED “target” (solo los necesarios por OC) === */
    const nums = new Set();
    for (const o of baseOCMes) ocSolpeNums(o).forEach(n => nums.add(n));
    const numsArr = [...nums];

    const solIndexDocs = [];
    // añadimos los del mes ya traídos (sirven de base)
    solIndexDocs.push(...baseSolMes);

    // intentamos traer por IN (batched) para mejorar match (si fallara, seguimos con los del mes)
    async function fetchByNumero(collName) {
      if (!numsArr.length) return;
      const chunks = chunkArray(numsArr, 10); // safe
      for (const ch of chunks) {
        try {
          const snap = await getDocs(query(collection(db, collName), where("numero_solpe", "in", ch)));
          snap.forEach(d => solIndexDocs.push({ id:d.id, ...d.data() }));
        } catch (e) {
          // si hay mismatch de tipos o falta índice, no bloqueamos
          console.warn(`No se pudo fetchByNumero(${collName})`, e);
          break;
        }
      }
    }

    if (segmento.value === "empresa") await fetchByNumero("solpes");
    else if (segmento.value === "taller") await fetchByNumero("solped_taller");
    else {
      await Promise.allSettled([fetchByNumero("solpes"), fetchByNumero("solped_taller")]);
    }

    const solIndexAllByNumero = buildSolIndexByNumero(solIndexDocs);

    /* === 6) Filtro OC del mes (incluye match a SOLPED si hay filtros de SOLPED activos) === */
    const ocFiltradas = baseOCMes.filter(x => {
      const f = x.fechaSubida || x.fecha || x.creado_en;
      if (!isInRange(f, start, end)) return false;

      // Empresa solo en segmento empresa
      if (segmento.value === 'empresa' && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || '');
        if (isExactEmpresa.value ? (emp !== filtroEmpresa.value) : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))) return false;
      }

      // Contrato/CC directo (si existe) solo cuando aplica (no en general)
      const valContrato = (x.numero_contrato || x.numeroContrato || '').toString();
      const valCC = (x.nombre_centro_costo || x.centroCostoNombre || x.centro_costo || x.centroCosto || x.centroCostoTexto || '').toString();
      if (segmento.value === 'empresa') {
        if (filtroContratoSel.value && valContrato && valContrato !== filtroContratoSel.value) return false;
      } else if (segmento.value === 'taller') {
        if (filtroCentroCostoSel.value && valCC && valCC !== filtroCentroCostoSel.value) return false;
      }

      // filtros OC
      if (filtroEstatusOC.value && _normTxt(x.estatus||'') !== _normTxt(filtroEstatusOC.value)) return false;
      if (filtroMonedaOC.value && (x.moneda || 'CLP').toString().toUpperCase() !== filtroMonedaOC.value) return false;
      if (filtroResponsableOC.value && (x.responsable || '—').toString() !== filtroResponsableOC.value) return false;

      // match SOLPED si hay filtros SOLPED activos
      if (solpedFiltersActive) {
        const ns = ocSolpeNums(x);
        if (ns.length) {
          let ok = false;
          for (const n of ns) {
            const sol = solIndexAllByNumero.get(n);
            if (solMatchesSolpedFilters(sol)) { ok = true; break; }
          }
          if (!ok) return false;
        } else {
          // fallback mínimo si no hay solpe en la OC
          if (filtroTipoSolped.value) {
            const t = (x.tipo_solped || x.tipoSolped || '').toString();
            if (!t || _normTxt(t) !== _normTxt(filtroTipoSolped.value)) return false;
          }
        }
      }

      return true;
    });

    /* ===== KPIs ===== */
    kpis.value.creadasMes = solMes.length;
    kpis.value.completadasMes = solMes.filter(solIsCompletedLike).length; // ✅ incluye cotizado parcial/completado
    kpis.value.ocMes = ocFiltradas.length;

    const totalOC = ocFiltradas.reduce((acc, x) => acc + ocMonto(x), 0);
    kpis.value.gastoMes = totalOC;
    kpis.value.ticketProm = ocFiltradas.length ? Math.round(totalOC / ocFiltradas.length) : 0;

    /* ===== KPIs avanzados ===== */
    // conversión: aproximación por match OC ↔ SOLPED (por numero)
    const setSol = new Set(solMes.map(x => Number(x.numero_solpe || x.numeroSolpe || x.numero_solped || x.numeroSolped)).filter(Boolean));
    const setOcSol = new Set();
    for (const o of ocFiltradas) ocSolpeNums(o).forEach(n => setOcSol.add(n));
    const match = [...setSol].filter(n => setOcSol.has(n)).length;
    const conversionPct = setSol.size ? (100 * match / setSol.size) : 0;

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
    // solo cuenta comentarios si estás viendo taller o general (porque puede incluir docs de taller)
    if (segmento.value !== 'empresa') {
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

    const topCreadores = contarPor(solMes, (x) => {
      if (segmento.value === 'empresa') return (x.usuario || x.dirigidoA?.[0] || '—');
      // taller o general (puede venir con campos de ambos)
      return (x.nombre_solicitante || x.usuario_sesion || x.usuario || x.dirigidoA?.[0] || '—');
    }).slice(0, 10);

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

    const distEstatus = agruparConteo(solMes, (x) => canonSolpedStatus(x.estatus || x.estado || '—'));
    const distTipoSolped = agruparConteo(solMes, (x) => (x.tipo_solped || '—').toString());

    const bucket = new Map();
    for (const o of ocFiltradas) {
      const fx = normalizarFecha(o.fechaSubida || o.fecha || o.creado_en);
      const key = fx.toISOString().slice(0,10);
      bucket.set(key, (bucket.get(key) || 0) + ocMonto(o));
    }
    const serieDiariaGasto = (startD, endD) => {
      const labels = [];
      const values = [];
      const d = new Date(startD);
      while (d < endD) {
        const k = d.toISOString().slice(0,10);
        labels.push(k);
        values.push(bucket.get(k) || 0);
        d.setDate(d.getDate()+1);
      }
      return { labels, values };
    };
    const serieGasto = serieDiariaGasto(start, end);

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
      hoyList.map(x => ({ nombre: (x.usuario || x.nombre_solicitante || x.usuario_sesion || x.dirigidoA?.[0] || '—') })),
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

    // "todos los meses": usamos muestra limitada (solAllForPend)
    const pendAllEntries = pendientesPorDirigidoA(solAllForPend, ['pendiente']).slice(0, 15);
    const pendAllLabels = pendAllEntries.map(([k]) => k);
    const pendAllValues = pendAllEntries.map(([,v]) => v);

    /* ===== Pies OC ===== */
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
      return { labels, counts, montos, totalCount: ocs.length, totalMonto: montos.reduce((a,b)=>a+b,0) };
    };
    const ocTipoAgg = aggByKey(ocFiltradas, ocTipoOC);
    const ocTipoSolpedAgg = aggByKey(ocFiltradas, (o) => ocTipoSolped(o, solIndexAllByNumero));

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

    const isAprobadaLike = (s) => {
      const n = _normTxt(s || "");
      return n === "aprobado" || n === "preaprobado" || n.includes("revision") || n.includes("revisión");
    };
    const isSubidaProveedor = (s) => _normTxt(s || "").includes("proveedor");

    const porResp = new Map();
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

    const perUser = new Map();
    const perUserTotal = new Map();
    for (const o of ocFiltradas) {
      const user = (o.responsable || "—").toString().trim() || "—";
      const st = canonOcStatus(o.estatus);
      if (!perUser.has(user)) perUser.set(user, new Map());
      const m = perUser.get(user);
      m.set(st, (m.get(st) || 0) + 1);
      perUserTotal.set(user, (perUserTotal.get(user) || 0) + 1);
    }

    const usersTop = [...perUserTotal.entries()]
      .sort((a,b) => b[1]-a[1])
      .slice(0, 15)
      .map(([u]) => u);

    const datasetsStatus = OC_ESTATUS_CANON.map((st) => ({
      label: st,
      data: usersTop.map(u => (perUser.get(u)?.get(st) || 0)),
      borderWidth: 1,
      maxBarThickness: 26,
    }));

    const rows = usersTop.map((u) => {
      const counts = {};
      let total = 0;
      for (const st of OC_ESTATUS_CANON) {
        const v = perUser.get(u)?.get(st) || 0;
        counts[st] = v;
        total += v;
      }
      return { user: u, counts, total };
    });

    /* ===== Payload ===== */
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

      vsEditors: { labels: vsLabels, aprobadas: vsAprobadas, subidas: vsSubidas },

      ocTipoAgg,
      ocTipoSolpedAgg,

      ocStatusByUser: {
        users: usersTop,
        rows,
        datasets: datasetsStatus,
      }
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


function destroyAll() {
  Object.values(charts).forEach(ch => { try { ch && ch.destroy && ch.destroy(); } catch(e) { console.error(e); } });
  charts = {
    topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null,
    tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null,
    solpedPend: null, solpedPendAll: null, vsEditors: null,

    ocTipoCountPie: null,
    ocTipoMontoPie: null,
    ocTipoSolpedCountPie: null,
    ocTipoSolpedMontoPie: null,

    ocStatusByUser: null,
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


function drawMultiBarsByUser(canvas, key, labels, datasets) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();


  const ds = (datasets || []).map(d => ({
    ...d,
    borderWidth: 1,

    barThickness: 10,
    maxBarThickness: 14,
    categoryPercentage: 0.9,
    barPercentage: 0.9,
  }));

  charts[key] = new window.Chart(canvas.getContext("2d"), {
    type: "bar",
    data: { labels, datasets: ds },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x ?? 0}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          stacked: false,
          ticks: { precision: 0 }
        },
        y: {
          stacked: false,
          ticks: { autoSkip: false }
        }
      }
    }
  });
}

function pintarDesdePayload(p){

  kpis.value = { ...p.kpis };
  kpisExtra.value = { ...p.kpisExtra };
  topHoy.value = p.topHoy || [];


  ocTipoAggPayload.value = p.ocTipoAgg || { labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 };
  ocTipoSolpedAggPayload.value = p.ocTipoSolpedAgg || { labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 };


  ocStatusByUserPayload.value = p.ocStatusByUser || { users: [], rows: [], datasets: [] };


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

  if (p.solpedPend) drawBar(cSolpedPendH.value, 'solpedPend', p.solpedPend.labels, p.solpedPend.values, 'Pendientes', null);
  if (p.solpedPendAll) drawBar(cSolpedPendAll.value, 'solpedPendAll', p.solpedPendAll.labels, p.solpedPendAll.values, 'Pendientes', null);


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

  if (p.ocStatusByUser?.users?.length && p.ocStatusByUser?.datasets?.length) {
    drawMultiBarsByUser(
      cOcStatusByUser.value,
      "ocStatusByUser",
      p.ocStatusByUser.users,
      p.ocStatusByUser.datasets
    );
  } else {
    charts.ocStatusByUser?.destroy?.();
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

.btn-group.flex-wrap .btn{ border-radius: .5rem !important; }
.btn-group.flex-wrap .btn + .btn{ margin-left: .25rem; }
@media (max-width: 576px){
  .btn-group.flex-wrap{ gap: .25rem; }
}

.chart-fixed-h{ min-height: 300px; max-height: 420px; }
canvas{ width:100% !important; height:100% !important; display:block; }

.pie-box{ height: 260px; }


.table-sticky thead th{
  position: sticky;
  top: 0;
  z-index: 1;
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
