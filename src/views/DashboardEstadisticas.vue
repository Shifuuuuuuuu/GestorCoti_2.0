<!-- DashboardEstadisticas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-4 py-md-5 position-relative">
    <!-- Overlay de loading -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay" aria-live="polite" aria-busy="true">
        <div class="loading-card">
          <div class="spinner-border" role="status" aria-hidden="true"></div>
          <div class="mt-3 fw-medium">Cargando estadísticas…</div>
          <div class="text-muted small mt-1">Filtrando y preparando gráficos</div>
        </div>
      </div>
    </transition>

    <!-- Contenido -->
    <div :class="['content-wrap', { 'is-blurred': isLoading }]">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Dashboard · Estadísticas</h1>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" @click="refrescar" :disabled="isLoading">
            <i class="bi bi-arrow-clockwise"></i> Refrescar
          </button>
        </div>
      </div>

      <!-- Segmento principal -->
      <div class="mb-3">
        <div class="btn-group">
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

      <!-- Segmento rápido por empresa -->
      <div class="mb-3">
        <div class="btn-group">
          <button class="btn" :class="empresaSegmento==='todas' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('todas')" :disabled="isLoading">Todas</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Mining' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Mining')" :disabled="isLoading">⛏ Mining</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Servicio')" :disabled="isLoading">🛠 Servicios</button>
          <button class="btn" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-secondary' : 'btn-outline-secondary'" @click="setEmpresaSeg('Xtreme Hormigones')" :disabled="isLoading">🧱 Hormigones</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-3">
              <label class="form-label">Mes</label>
              <input type="month" class="form-control" v-model="filtroMes" @change="onFiltroChange" :disabled="isLoading" />
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="filtroEmpresa" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todas</option>
                <option v-for="opt in empresasOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Contrato / Centro de Costo</label>
              <input class="form-control" placeholder="Ej: 27483, CANECHE, THPV-31…"
                     v-model="filtroContrato" @keyup.enter="onFiltroChange" :disabled="isLoading" />
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Estatus OC (opcional)</label>
              <select class="form-select" v-model="filtroEstatusOC" @change="onFiltroChange" :disabled="isLoading">
                <option value="">Todos</option>
                <option>Aprobado</option>
                <option>Preaprobado</option>
                <option>Rechazado</option>
                <option>Pendiente</option>
                <option>Revisión Guillermo</option>
                <option>Enviada a proveedor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs base -->
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

      <!-- KPIs avanzados -->
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

      <!-- Gráficos -->
      <div class="row g-4">
        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Top creadores de {{ tituloSegmento }} (mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cTopCreadores"></canvas></div>
          </div>
        </div>

        <!-- TOP GENERADORES DE OC (barras VERTICALES guiadas por #OC; tooltip muestra #OC + gasto) -->
        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Top generadores de OC (mes)</div></div>
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
            <div class="card-header "><div class="fw-medium">Distribución de estatus ({{ tituloSegmento }})</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cEstatusPie"></canvas></div>
          </div>
        </div>

        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Distribución por Tipo de {{ tituloSegmento }}</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cTipoSolpedPie"></canvas></div>
          </div>
        </div>

        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Evolución diaria del gasto (mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cGastoLine"></canvas></div>
          </div>
        </div>

        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Top aprobadores (mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cTopAprobadores"></canvas></div>
          </div>
        </div>

        <!-- PENDIENTES (mes) y (todos los meses) lado a lado -->
        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">SOLPED pendientes por cotizadores (mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cSolpedPendH"></canvas></div>
          </div>
        </div>

        <div class="col-12 col-xxl-6">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">SOLPED pendientes por cotizadores (todos los meses)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cSolpedPendAll"></canvas></div>
          </div>
        </div>

        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">Gasto por Contrato (mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cGastoContratoH"></canvas></div>
          </div>
        </div>

        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header "><div class="fw-medium">OC por Contrato ( mes)</div></div>
            <div class="card-body chart-fixed-h"><canvas ref="cConteoContratoH"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Tabla “Hoy” -->
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

      <!-- Error (si ocurre) -->
      <div v-if="lastError" class="alert alert-danger mt-3" role="alert">
        <strong>Error:</strong> {{ lastError }}
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

const segmento = ref(localStorage.getItem('xt_dashboard_segmento') || 'empresa'); // 'empresa' | 'taller'
function setSegmento(v) {
  if (v === 'empresa' || v === 'taller') {
    segmento.value = v;
    localStorage.setItem('xt_dashboard_segmento', v);
  }
}

// Debounce
let debounceTimer = null;
function scheduleReload() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { cargarTodo(); }, 250);
}

// Atajo empresa
const empresaSegmento = ref('todas');
function setEmpresaSeg(v) { empresaSegmento.value = v; filtroEmpresa.value = (v === 'todas') ? '' : v; }

// Filtros
const filtroMes = ref(defMesActual()); // YYYY-MM
const filtroEmpresa = ref("");
const filtroContrato = ref("");
const filtroEstatusOC = ref("");

const empresasOptions = ref(["Xtreme Servicio","Xtreme Servicios","Xtreme Mining","Xtreme Hormigones"]);

// KPIs
const kpis = ref({
  creadasMes: 0,
  completadasMes: 0,
  ocMes: 0,
  gastoMes: 0,
  ticketProm: 0,
});

// KPIs extra
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

// Top hoy tabla
const topHoy = ref([]);

// Chart refs
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
const cSolpedPendAll = ref(null); // << NUEVO

// Instancias Chart
let charts = {
  topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null,
  tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null,
  solpedPend: null, solpedPendAll: null // << NUEVO
};

// Snap anterior (para evitar redibujado)
let _lastPayloadKey = "";
let _lastPayloadJSON = "";

/* ====== Fechas / formato ====== */
const fechaHoyLegible = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
});

onMounted(async () => { await cargarTodo(); });
onBeforeUnmount(() => destroyAll());

watch([segmento, filtroMes, filtroEmpresa, filtroContrato, filtroEstatusOC], () => { scheduleReload(); });

function onFiltroChange() { /* watcher ya agenda recarga */ }
function refrescar() { cargarTodo(true); }

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
  if (v.toDate) return v.toDate();            // Firestore Timestamp
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

/* ====== CACHE ====== */
const CACHE_TTL_MS = 2 * 60 * 1000;
function cacheKey() {
  return [
    "dashV8",
    segmento.value,
    filtroMes.value,
    filtroEmpresa.value || "_",
    filtroContrato.value || "_",
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

/* ====== Query helpers con fallback ====== */
async function runQuerySafe(qPrimary, fallbackBuilderList = []) {
  try { return await getDocs(qPrimary); }
  catch (e) {
    for (const build of fallbackBuilderList) {
      try { return await getDocs(build()); } catch(e) {console.error(e)}
    }
    const base = qPrimary._query?.path?.segments?.[1];
    if (base) return await getDocs(collection(db, base));
    throw e;
  }
}
const isExactEmpresa = computed(() => empresasOptions.value.includes(filtroEmpresa.value));

/* ====== Normalizador de texto ====== */
function _normTxt(v='') {
  return String(v).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
}

/* ====== Carga / agregaciones ====== */
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
      // Mes
      const baseSol = query(
        collection(db, "solpes"),
        where("fecha", ">=", startStr),
        where("fecha", "<", endStr),
        orderBy("fecha", "asc")
      );
      const solQ = (isExactEmpresa.value && filtroEmpresa.value)
        ? query(baseSol, where("empresa", "==", filtroEmpresa.value))
        : baseSol;

      solPromise = runQuerySafe(
        solQ,
        [
          () => query(collection(db,"solpes"), where("fecha", ">=", startStr), where("fecha","<",endStr)),
          () => collection(db,"solpes")
        ]
      );

      let ocQ = query(
        collection(db, "ordenes_oc"),
        where("fechaSubida", ">=", start),
        where("fechaSubida", "<", end),
        orderBy("fechaSubida", "asc")
      );
      if (isExactEmpresa.value && filtroEmpresa.value) ocQ = query(ocQ, where("empresa","==",filtroEmpresa.value));
      if (filtroEstatusOC.value) ocQ = query(ocQ, where("estatus","==",filtroEstatusOC.value));

      ocPromise = runQuerySafe(
        ocQ,
        [
          () => query(collection(db, "ordenes_oc"), where("fechaSubida", ">=", start), where("fechaSubida", "<", end)),
          () => collection(db,"ordenes_oc")
        ]
      );

      // TODOS LOS MESES (solo SOLPED, para pendientes por cotizador global)
      solAllPromise = runQuerySafe(
        collection(db, "solpes"),
        [ () => collection(db,"solpes") ]
      );

    } else {
      // Mes
      const baseTal = query(
        collection(db, "solped_taller"),
        where("fecha", ">=", startStr),
        where("fecha", "<", endStr),
        orderBy("fecha", "asc")
      );
      const talQ = (isExactEmpresa.value && filtroEmpresa.value)
        ? query(baseTal, where("empresa","==",filtroEmpresa.value))
        : baseTal;

      solPromise = runQuerySafe(
        talQ,
        [
          () => query(collection(db,"solped_taller"), where("fecha", ">=", startStr), where("fecha","<",endStr)),
          () => collection(db,"solped_taller")
        ]
      );

      let ocTQ = query(
        collection(db, "ordenes_oc_taller"),
        where("fechaSubida", ">=", start),
        where("fechaSubida", "<", end),
        orderBy("fechaSubida", "asc")
      );
      if (isExactEmpresa.value && filtroEmpresa.value) ocTQ = query(ocTQ, where("empresa","==",filtroEmpresa.value));
      if (filtroEstatusOC.value) ocTQ = query(ocTQ, where("estatus","==",filtroEstatusOC.value));

      ocPromise = runQuerySafe(
        ocTQ,
        [
          () => query(collection(db,"ordenes_oc_taller"), where("fechaSubida", ">=", start), where("fechaSubida","<", end)),
          () => collection(db,"ordenes_oc_taller")
        ]
      );

      // TODOS LOS MESES (solo SOLPED Taller, para pendientes global)
      solAllPromise = runQuerySafe(
        collection(db, "solped_taller"),
        [ () => collection(db,"solped_taller") ]
      );
    }

    const [solSnap, ocSnap, solAllSnap] = await Promise.allSettled([solPromise, ocPromise, solAllPromise]);

    const baseSol = solSnap.status === "fulfilled" ? solSnap.value.docs.map(d => ({ id: d.id, ...d.data() })) : [];
    const baseOC  = ocSnap.status  === "fulfilled" ? ocSnap.value.docs.map(d => ({ id: d.id, ...d.data() }))  : [];
    const baseSolAll = solAllSnap.status === "fulfilled" ? solAllSnap.value.docs.map(d => ({ id: d.id, ...d.data() })) : [];

    const isEmpresaSeg = (segmento.value === 'empresa');

    // Filtros cliente — SOLPED (mes)
    const solMes = baseSol.filter(x => {
      const f = x.fechaSubida || x.creado_en || x.fecha;
      if (!isInRange(f, start, end)) return false;

      if (!isExactEmpresa.value && filtroEmpresa.value) {
        const emp = (x.empresa || x.empresas || "").toString().toLowerCase();
        if (!emp.includes(filtroEmpresa.value.toLowerCase())) return false;
      }
      if (filtroContrato.value) {
        const needle = filtroContrato.value.toLowerCase();
        const nn = isEmpresaSeg
          ? [x.numero_contrato, x.nombre_centro_costo]
          : [x.centro_costo];
        if (!nn.filter(Boolean).map(v => String(v).toLowerCase()).join(" | ").includes(needle)) return false;
      }
      return true;
    });

    // Filtros cliente — SOLPED (todos los meses)
    const solAll = baseSolAll.filter(x => {
      if (!isExactEmpresa.value && filtroEmpresa.value) {
        const emp = (x.empresa || x.empresas || "").toString().toLowerCase();
        if (!emp.includes(filtroEmpresa.value.toLowerCase())) return false;
      }
      if (filtroContrato.value) {
        const needle = filtroContrato.value.toLowerCase();
        const nn = isEmpresaSeg
          ? [x.numero_contrato, x.nombre_centro_costo]
          : [x.centro_costo];
        if (!nn.filter(Boolean).map(v => String(v).toLowerCase()).join(" | ").includes(needle)) return false;
      }
      return true;
    });

    // Filtros cliente — OC (mes)
    const ocFiltradas = baseOC.filter(x => {
      const f = x.fechaSubida || x.fecha || x.creado_en;
      if (!isInRange(f, start, end)) return false;

      if (!isExactEmpresa.value && filtroEmpresa.value) {
        const emp = (x.empresa || x.empresas || "").toString().toLowerCase();
        if (!emp.includes(filtroEmpresa.value.toLowerCase())) return false;
      }
      if (filtroContrato.value) {
        const needle = filtroContrato.value.toLowerCase();
        const nn = [
          x.numero_contrato, x.nombre_centro_costo, x.centroCosto, x.centroCostoNombre, x.centro_costo, x.centroCostoTexto
        ];
        if (!nn.filter(Boolean).map(v => String(v).toLowerCase()).join(" | ").includes(needle)) return false;
      }
      if (filtroEstatusOC.value) {
        if ((x.estatus||'').toString().toLowerCase() !== filtroEstatusOC.value.toLowerCase()) return false;
      }
      return true;
    });

    /* ===== KPIs base ===== */
    kpis.value.creadasMes = solMes.length;
    kpis.value.completadasMes = solMes.filter(x => _normTxt(x.estatus || x.estado || "") === "completado").length;
    kpis.value.ocMes = ocFiltradas.length;

    const totalOC = ocFiltradas.reduce((acc, x) => {
      if (typeof x.precioTotalConIVA === "number") return acc + x.precioTotalConIVA;
      if (Array.isArray(x.items)) return acc + x.items.reduce((a, it) => a + (Number(it.precioTotalConIVA) || 0), 0);
      return acc;
    }, 0);
    kpis.value.gastoMes = totalOC;
    kpis.value.ticketProm = ocFiltradas.length ? Math.round(totalOC / ocFiltradas.length) : 0;

    /* ===== KPIs avanzados ===== */
    // Conversión
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

    // Lead time promedio a Aprobado (días)
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

    // Tasa de rechazo
    const rechazadas = ocFiltradas.filter(o => _normTxt(o.estatus||"") === "rechazado").length;
    const rechazoPct = ocFiltradas.length ? (100 * rechazadas / ocFiltradas.length) : 0;

    // Comentarios Taller (mes)
    let comentariosTallerMes = 0;
    if (segmento.value === 'taller') {
      for (const s of solMes) if (Array.isArray(s.comentarios)) comentariosTallerMes += s.comentarios.length;
    }

    kpisExtra.value = { conversionPct, leadtimePromDias, rechazoPct, comentariosTallerMes };

    /* ===== Agregaciones para gráficos ===== */
    // Top creadores (usuario / solicitante)
    const topCreadores = contarPor(solMes, (x) =>
      isEmpresaSeg ? (x.usuario || x.dirigidoA?.[0] || '—') : (x.nombre_solicitante || x.usuario_sesion || x.usuario || '—')
    ).slice(0, 10);

    // Top generadores de OC (responsable)
    const mapCount = new Map(); // responsable -> conteo
    const mapSpend = new Map(); // responsable -> gasto
    for (const o of ocFiltradas) {
      const resp = (o.responsable || '—').toString();
      mapCount.set(resp, (mapCount.get(resp) || 0) + 1);
      const gasto = (typeof o.precioTotalConIVA === "number")
        ? o.precioTotalConIVA
        : (Array.isArray(o.items) ? o.items.reduce((a, it) => a + (Number(it.precioTotalConIVA)||0), 0) : 0);
      mapSpend.set(resp, (mapSpend.get(resp) || 0) + Number(gasto || 0));
    }
    const topOCEntries = [...mapCount.entries()].sort((a,b)=> b[1]-a[1]).slice(0, 10);
    const topOCLabels = topOCEntries.map(([k]) => k);
    const topOCValues = topOCEntries.map(([,v]) => v);
    const topOCSpends = topOCEntries.map(([k]) => mapSpend.get(k) || 0);

    // Gasto por contrato/CC
    const gastoContrato = agruparSuma(
      ocFiltradas,
      (x) => (x.numero_contrato || x.nombre_centro_costo || x.centroCosto || x.centroCostoNombre || x.centro_costo || x.centroCostoTexto || '—').toString(),
      (x) => (typeof x.precioTotalConIVA === "number")
        ? x.precioTotalConIVA
        : (Array.isArray(x.items) ? x.items.reduce((a, it) => a + (Number(it.precioTotalConIVA)||0), 0) : 0)
    ).slice(0, 12);

    // Conteo de OC por contrato/CC
    const conteoContrato = contarPor(ocFiltradas, (x) =>
      (x.numero_contrato || x.nombre_centro_costo || x.centroCosto || x.centroCostoNombre || x.centro_costo || x.centroCostoTexto || '—').toString()
    ).slice(0, 12);

    // Estatus pie
    const distEstatus = agruparConteo(solMes, (x) => (x.estatus || x.estado || '—').toString());

    // Tipo SOLPED pie
    const distTipoSolped = agruparConteo(solMes, (x) => (x.tipo_solped || '—').toString());

    // Serie diaria del gasto (mes)
    const serieGasto = serieDiariaGasto(ocFiltradas, start, end);

    // Top aprobadores
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

    // OC por moneda
    const distMoneda = agruparConteo(ocFiltradas, (x) => (x.moneda || 'CLP').toString().toUpperCase());

    // Top HOY
    const hoyList = solMes.filter(x => esHoy(x.fecha || x.creado_en || x.fechaSubida));
    const topHoyArr = contarPor(
      hoyList.map(x => ({ nombre: isEmpresaSeg ? (x.usuario || x.dirigidoA?.[0]) : (x.nombre_solicitante || x.usuario_sesion || x.usuario) })),
      (r) => (r && r.nombre) || '—'
    ).slice(0, 10);
    topHoy.value = topHoyArr.map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // SOLPED pendientes por cotizadores (MES) — SOLO 'pendiente'
    const pendEntries = pendientesPorDirigidoA(solMes, ['pendiente']).slice(0, 15);
    const pendLabels = pendEntries.map(([k]) => k);
    const pendValues = pendEntries.map(([,v]) => v);

    // SOLPED pendientes por cotizadores (TODOS LOS MESES) — SOLO 'pendiente'
    const pendAllEntries = pendientesPorDirigidoA(solAll, ['pendiente']).slice(0, 15);
    const pendAllLabels = pendAllEntries.map(([k]) => k);
    const pendAllValues = pendAllEntries.map(([,v]) => v);

    // Payload
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
      solpedPendAll: { labels: pendAllLabels, values: pendAllValues } // << NUEVO
    };

    // Evitar re-render idéntico
    const thisKey = cacheKey();
    const asJSON = JSON.stringify(payload);
    if (thisKey === _lastPayloadKey && asJSON === _lastPayloadJSON) {
      // sin cambios
    } else {
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

/* ====== Utils de agregación ====== */
function contarPor(arr, getKey) {
  const m = new Map();
  for (const x of arr) {
    const k = (getKey(x) || '—').toString().trim();
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a,b) => b[1]-a[1]);
}
function contarValores(list) {
  const m = new Map();
  for (const k of list) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a,b) => b[1]-a[1]);
}
function agruparSuma(arr, getKey, getVal) {
  const m = new Map();
  for (const x of arr) {
    const k = getKey(x); const v = Number(getVal(x) || 0);
    m.set(k, (m.get(k) || 0) + v);
  }
  return [...m.entries()].sort((a,b) => b[1]-a[1]);
}
function agruparConteo(arr, getKey) {
  const m = {};
  for (const x of arr) {
    const k = (getKey(x) || '—').toString();
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}
function serieDiariaGasto(ocs, start, end) {
  const labels = [];
  const values = [];
  const d = new Date(start);
  while (d < end) {
    labels.push(d.toISOString().slice(0,10));
    const daySum = ocs.reduce((acc, x) => {
      const fx = normalizarFecha(x.fechaSubida || x.fecha || x.creado_en);
      if (fx.getFullYear()===d.getFullYear() && fx.getMonth()===d.getMonth() && fx.getDate()===d.getDate()) {
        const val = (typeof x.precioTotalConIVA === "number")
          ? x.precioTotalConIVA
          : (Array.isArray(x.items) ? x.items.reduce((a, it) => a + (Number(it.precioTotalConIVA) || 0), 0) : 0);
        return acc + (Number(val) || 0);
      }
      return 0 + acc;
    }, 0);
    values.push(daySum);
    d.setDate(d.getDate()+1);
  }
  return { labels, values };
}

/* === Pendientes por dirigidoA — SOLO estatus permitidos (por defecto: 'pendiente') === */
function pendientesPorDirigidoA(solList, allowedStatuses = ['pendiente']) {
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
    if (Array.isArray(da)) {
      da.forEach(add);
    } else if (typeof da === 'string') {
      const parts = da.split(/[,;|]/).map(v => v.trim()).filter(Boolean);
      if (parts.length) parts.forEach(add); else add(da);
    }
  }

  return [...m.entries()].sort((a,b)=> b[1]-a[1]);
}

/* ====== Charts ====== */
function destroyAll() {
  Object.values(charts).forEach(ch => { try { ch && ch.destroy && ch.destroy(); } catch(e) {console.error(e)} });
  charts = { topCread: null, topOC: null, gastoContrato: null, estatusPie: null, gastoLine: null, tipoSolped: null, topAprob: null, monedaPie: null, conteoContrato: null, solpedPend: null, solpedPendAll: null };
}
function drawBar(canvas, key, labels, values, dsLabel, formatter, extraTooltipCb) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: dsLabel,
        data: values,
        maxBarThickness: 28,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
    data: {
      labels,
      datasets: [{
        label: dsLabel,
        data: values,
        maxBarThickness: 28,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend:{ display:false },
        tooltip:{
          callbacks:{
            label:(ctx)=>{
              const base = `${dsLabel}: ${formatter ? formatter(ctx.parsed.x) : ctx.parsed.x}`;
              const ext = extraTooltipCb ? extraTooltipCb(ctx) : '';
              return ext ? `${base}  —  ${ext}` : base;
            }
          }
        }
      },
      layout: { padding: { right: 8, left: 8 } },
      scales: {
        x: { beginAtZero:true, ticks:{ callback:(v)=> formatter ? formatter(v) : v }},
        y: { ticks:{ autoSkip:false, mirror:false }}
      }
    }
  });
}
function drawPie(canvas, key, labels, values) {
  if (!window.Chart || !canvas) return;
  charts[key]?.destroy?.();
  charts[key] = new window.Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: { labels, datasets: [{ data: values }] },
    options: { responsive: true, maintainAspectRatio: false }
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

function pintarDesdePayload(p){
  // KPIs
  kpis.value = { ...p.kpis };
  kpisExtra.value = { ...p.kpisExtra };

  // Tabla “hoy”
  topHoy.value = p.topHoy || [];

  // Gráficos existentes
  drawBar(cTopCreadores.value, 'topCread', (p.topCreadores||[]).map(([k])=>k), (p.topCreadores||[]).map(([,v])=>v), 'Creadas');
  drawPie(cEstatusPie.value, 'estatusPie', Object.keys(p.distEstatus || {}), Object.values(p.distEstatus || {}));
  drawLineMoney(cGastoLine.value, 'gastoLine', p.serieGasto.labels, p.serieGasto.values, 'Gasto diario');
  drawHBar(cGastoContratoH.value, 'gastoContrato', p.gastoContrato.map(([k])=>k), p.gastoContrato.map(([,v])=>v), 'Gasto CLP', formatearCLP);
  drawPie(cTipoSolpedPie.value, 'tipoSolped', Object.keys(p.distTipoSolped || {}), Object.values(p.distTipoSolped || {}));
  drawBar(cTopAprobadores.value, 'topAprob', (p.topAprobadores||[]).map(([k])=>k), (p.topAprobadores||[]).map(([,v])=>v), 'Aprobaciones');
  drawPie(cMonedaPie.value, 'monedaPie', Object.keys(p.distMoneda || {}), Object.values(p.distMoneda || {}));
  drawHBar(cConteoContratoH.value, 'conteoContrato', p.conteoContrato.map(([k])=>k), p.conteoContrato.map(([,v])=>v), 'OC', null);

  // TOP generadores de OC — VERTICAL (conteo) + tooltip con gasto
  if (p.topOC && Array.isArray(p.topOC.labels)) {
    const labels = p.topOC.labels;
    const counts = p.topOC.counts;
    const spends = p.topOC.spends; // alineado a labels
    drawBar(
      cTopOC.value,
      'topOC',
      labels,
      counts,
      'OC',
      null,
      (ctx) => `Gasto: ${formatearCLP(spends[ctx.dataIndex] || 0)}`
    );
  }

  // SOLPED pendientes por cotizadores (MES) — SOLO 'pendiente'
  if (p.solpedPend) {
    drawBar(
      cSolpedPendH.value,
      'solpedPend',
      p.solpedPend.labels,
      p.solpedPend.values,
      'Pendientes',
      null
    );
  }

  // SOLPED pendientes por cotizadores (TODOS LOS MESES) — SOLO 'pendiente'
  if (p.solpedPendAll) {
    drawBar(
      cSolpedPendAll.value,
      'solpedPendAll',
      p.solpedPendAll.labels,
      p.solpedPendAll.values,
      'Pendientes',
      null
    );
  }
}
</script>

<style scoped>
.card { border-radius: 1rem; }
.card-header { border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
.card-body { min-height: 280px; }
.table > :not(caption) > * > * { vertical-align: middle; }

.btn-group .btn { border-radius: .5rem !important; }
.btn-group .btn + .btn { margin-left: .25rem; }

/* Altura fija para evitar “estiramientos” de los charts */
.chart-fixed-h { min-height: 320px; max-height: 360px; }

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

.content-wrap.is-blurred {
  filter: blur(1.5px);
  pointer-events: none;
  user-select: none;
}
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
