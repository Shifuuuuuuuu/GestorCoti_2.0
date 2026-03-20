<!-- src/views/HistorialCotizacionesPlantas.vue -->
<template>
  <div class="hist-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate flex-grow-1 text-center d-none d-sm-block">
          Historial de Cotizaciones · Plantas
        </h1>
        <h1 class="h6 fw-semibold mb-0 text-truncate d-sm-none">Historial Plantas</h1>

        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-primary btn-sm" @click="toggleFiltersResponsive">
            <i
              class="bi"
              :class="(isDesktop
                       ? (showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset')
                       : (showFiltersMobile ? 'bi-x-lg' : 'bi-funnel'))"
            ></i>
            <span class="d-none d-sm-inline ms-1">
              {{ isDesktop ? (showSidebar ? 'Ocultar filtros' : 'Mostrar filtros')
                           : (showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros') }}
            </span>
          </button>

          <div
            v-if="puedeVerMisCotizaciones"
            class="form-check form-switch ms-2 d-none d-sm-flex align-items-center"
          >
            <input
              class="form-check-input"
              type="checkbox"
              id="switchSoloMiasTop"
              v-model="soloMias"
              :title="'Ver sólo mis cotizaciones de plantas'"
            />
            <label class="form-check-label ms-2 small" for="switchSoloMiasTop">
              Mis cotizaciones
            </label>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger d-flex align-items-center mb-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>{{ error }}</div>
      </div>

      <!-- BUSCADOR -->
      <div class="card card-elevated mb-3">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">🔎 Buscar cotización de plantas (N° o archivo)</div>
          <div class="small text-secondary">Página + Firestore</div>
        </div>

        <div class="card-body">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-sm-9">
              <input
                type="text"
                class="form-control"
                v-model="searchText"
                @keyup.enter="buscarGlobal"
                placeholder="Ej: 12 / cotizacion / pdf / nombre archivo"
              />
            </div>

            <div class="col-12 col-sm-3 d-grid">
              <button class="btn btn-danger" @click="buscarGlobal">
                <span v-if="loadingGlobalSearch" class="spinner-border spinner-border-sm me-2"></span>
                Buscar
              </button>
            </div>
          </div>

          <div v-if="lastSearchTextTrim && pageMatchesCount >= 0" class="mt-2 small text-secondary">
            Coincidencias en esta página (por nombre de archivo): <strong>{{ pageMatchesCount }}</strong>
          </div>

          <div v-if="resultadosBusqueda.length" class="mt-3">
            <div class="small text-secondary mb-2">
              Resultados Firestore: {{ resultadosBusqueda.length }}
            </div>

            <div
              v-for="r in resultadosBusqueda"
              :key="r.__docId"
              class="alert alert-light d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2"
            >
              <div class="me-auto">
                <div class="fw-semibold">🧾 N° {{ r.id ?? '—' }}</div>
                <div class="small text-secondary">
                  {{ r.empresa || 'Xtreme Servicio' }} · {{ fmtFecha(r.fechaSubida) }}
                </div>
                <div class="small">
                  <strong>Archivo:</strong> {{ getArchivoNombre(r) || '—' }}
                </div>
              </div>

              <button class="btn btn-sm btn-outline-primary" @click="goCotizacion(r)">
                Ver detalle
              </button>
            </div>
          </div>

          <div v-else-if="searchedOnce" class="alert alert-warning mt-3 mb-0">
            No se encontraron coincidencias en Firestore con ese texto.
          </div>
        </div>
      </div>

      <!-- CHIPS FILTROS -->
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

        <span v-for="code in selectedCentros" :key="'cc-'+code" class="badge bg-light text-dark border">
          {{ centrosCosto[code] || code }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeCentro(code)"></button>
        </span>

        <span v-if="centroSearch" class="badge bg-light text-dark border">
          Centro (texto): {{ centroSearch }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeCentroChip()"></button>
        </span>

        <span v-if="soloMias && puedeVerMisCotizaciones" class="badge bg-light text-dark border">
          Mis cotizaciones
          <button class="btn-close btn-close-white ms-2 small" @click="soloMias=false; applyFilters()"></button>
        </span>
        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
      </div>

      <!-- SEGMENTO EMPRESA -->
      <div class="mb-3">
        <div class="btn-group flex-wrap">
          <button class="btn btn-sm" :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('todas')">Plantas</button>
        </div>
      </div>

      <div class="row">
        <!-- LISTADO -->
        <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
          <div v-if="loading" class="loading-global">
            <div class="spinner-border me-2"></div> Cargando cotizaciones…
          </div>

          <template v-else>
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
                v-for="cot in lista"
                :key="cot.__docId"
                class="card card-elevated mb-2 oc-card"
                :class="{ 'oc-clickable': isClickableToDetail(cot) }"
                @click="onCardClick(cot)"
              >
                <div
                  class="card-header d-flex justify-content-between align-items-center"
                  :class="estadoHeaderClass(cot.estatus)"
                >
                  <div class="d-flex align-items-center gap-3">
                    <div class="fw-semibold">
                      🧾 N° <span class="text-danger">{{ cot.id ?? '—' }}</span>
                    </div>
                    <span class="badge badge-status" :class="estadoBadgeClass(cot.estatus)">
                      {{ cot.estatus || '—' }}
                    </span>
                  </div>

                  <div class="small text-secondary">
                    Subida: <strong>{{ fmtFecha(cot.fechaSubida) }}</strong>
                  </div>
                </div>

                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <div class="small text-secondary">Centro de Costo</div>
                      <div class="fw-semibold">
                        {{ cot.numero_contrato || '—' }} — {{ cot.nombre_centro_costo || '—' }}
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="small text-secondary">Responsable</div>
                      <div class="fw-semibold">{{ cot.responsable || '—' }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Moneda</div>
                      <div class="fw-semibold">{{ cot.moneda || '—' }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Total con IVA</div>
                      <div class="fw-semibold">{{ fmtMoneda(cot.precioTotalConIVA, cot.moneda) }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Aprobador</div>
                      <div class="fw-semibold">{{ cot.aprobadorAsignado || cot.aprobadorSugerido || 'Alejandro Candia' }}</div>
                    </div>

                    <div class="col-12">
                      <div class="small text-secondary">Comentario</div>
                      <div class="border rounded p-2">{{ cot.comentario || '—' }}</div>
                    </div>
                  </div>

                  <div class="mt-3 d-flex align-items-center gap-2 flex-wrap" v-if="cot.solpedId || cot.numero_solpe != null">
                    <i class="bi bi-link-45deg"></i>
                    <span class="small text-secondary">Vinculado a SOLPED de plantas</span>

                    <span class="badge bg-secondary-subtle text-secondary-emphasis">
                      N° {{ cot.numero_solpe ?? '—' }}
                    </span>

                    <button
                      class="btn btn-sm btn-outline-secondary"
                      v-if="cot.solpedId"
                      @click.stop="goSolped(cot)"
                    >
                      Ver SOLPED
                    </button>
                  </div>
                </div>

                <div class="card-footer d-flex align-items-center justify-content-between">
                  <div class="small text-secondary">
                    Empresa: <strong>{{ cot.empresa || '—' }}</strong> · Ítems: <strong>{{ (cot.items?.length || 0) }}</strong>
                  </div>

                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-primary" @click.stop="goCotizacion(cot)">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="displayList.length===0" class="ghost-wrap">
              <div class="ghost">
                <div class="ghost-eyes"></div>
                <div class="ghost-bottom"><div></div><div></div><div></div><div></div></div>
              </div>
              <p class="ghost-text">No hay cotizaciones con los filtros aplicados.</p>
            </div>
          </template>
        </div>

        <!-- SIDEBAR FILTROS -->
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
              <FiltroForm
                v-model:filtro-fecha="filtroFecha"
                v-model:filtro-estatus="filtroEstatus"
                v-model:centro-search="centroSearch"
                v-model:centro-picker-search="centroPickerSearch"
                :centros-costo="centrosCosto"
                :centros-filtrados="centrosFiltrados"
                :selected-centros="selectedCentros"
                :selected-centros-set="selectedCentrosSet"
                :solo-mias="soloMias"
                :page-size="pageSize"
                :puede-ver-mis-cotizaciones="puedeVerMisCotizaciones"
                @toggle-centro="toggleCentro"
                @remove-centro="removeCentro"
                @apply="applyFilters"
                @limpiar="limpiarFiltros"
                @update:solo-mias="(v)=> soloMias = v"
                @update:page-size="(v)=> { pageSize = v; applyFilters(); }"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- FILTROS MOBILE -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none">
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>

        <div
          class="oc-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros historial cotizaciones plantas"
          @keydown.esc="closeFiltersMobile"
        >
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              <button class="btn btn-sm btn-success" @click="applyFilters(); closeFiltersMobile()">Aplicar</button>
              <button class="btn btn-sm btn-outline-dark" @click="closeFiltersMobile" aria-label="Cerrar filtros">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <FiltroForm
              v-model:filtro-fecha="filtroFecha"
              v-model:filtro-estatus="filtroEstatus"
              v-model:centro-search="centroSearch"
              v-model:centro-picker-search="centroPickerSearch"
              :centros-costo="centrosCosto"
              :centros-filtrados="centrosFiltrados"
              :selected-centros="selectedCentros"
              :selected-centros-set="selectedCentrosSet"
              :solo-mias="soloMias"
              :page-size="pageSize"
              :puede-ver-mis-cotizaciones="puedeVerMisCotizaciones"
              mobile
              @toggle-centro="toggleCentro"
              @remove-centro="removeCentro"
              @apply="applyFilters"
              @limpiar="limpiarFiltros"
              @update:solo-mias="(v)=> soloMias = v"
              @update:page-size="(v)=> { pageSize = v; }"
            />
          </div>

          <div class="oc-footer">
            <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
            <button class="btn btn-success" @click="applyFilters(); closeFiltersMobile()">Aplicar</button>
          </div>
        </div>
      </div>
    </transition>

    <button
      class="btn btn-primary floating-filters-btn d-lg-none"
      @click="toggleFiltersResponsive"
      :title="showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'"
      aria-label="Abrir filtros"
    >
      <i class="bi bi-funnel"></i>
    </button>

    <button
      v-show="showScrollTop"
      class="btn btn-outline-dark floating-top-btn d-lg-none"
      @click="scrollToTop"
      aria-label="Volver arriba"
      :title="'Volver arriba'"
    >
      <i class="bi bi-arrow-up"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch, nextTick, h } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, limit,
  startAfter,
  getDocs, getCountFromServer, doc, getDoc
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const FiltroForm = {
  name: 'FiltroForm',
  props: {
    filtroFecha: String,
    filtroEstatus: Array,
    centroSearch: String,
    centroPickerSearch: String,
    centrosCosto: Object,
    centrosFiltrados: Array,
    selectedCentros: Array,
    selectedCentrosSet: Object,
    soloMias: Boolean,
    pageSize: Number,
    mobile: Boolean,
    puedeVerMisCotizaciones: Boolean,
  },
  emits: [
    'update:filtro-fecha',
    'update:filtro-estatus',
    'update:centro-search',
    'update:centro-picker-search',
    'update:solo-mias',
    'update:page-size',
    'toggle-centro',
    'remove-centro',
    'apply',
    'limpiar'
  ],
  setup(props, { emit }) {
    return () => [
      h('div', { class: 'mb-3' }, [
        h('label', { class: 'form-label' }, 'Fecha (subida)'),
        h('input', {
          type: 'date',
          class: 'form-control',
          value: props.filtroFecha,
          onInput: e => emit('update:filtro-fecha', e.target.value)
        })
      ]),

      h('div', { class: 'mb-3' }, [
        h('label', { class: 'form-label' }, 'Estado'),
        h('select', {
          class: 'form-select',
          multiple: true,
          value: props.filtroEstatus,
          onChange: e => emit('update:filtro-estatus', Array.from(e.target.selectedOptions).map(o => o.value))
        },
          ['Aprobado','Pendiente de Aprobación','Rechazado'].map(s =>
            h('option', { value: s }, s)
          )
        ),
        h('small', { class: 'text-secondary' }, 'Puedes seleccionar varios (máx. 10).')
      ]),

      h('div', { class: 'mb-2' }, [
        h('label', { class: 'form-label' }, 'Centro de costo (código)'),
        h('input', {
          class: 'form-control mb-2',
          placeholder: 'Buscar código o nombre…',
          value: props.centroPickerSearch,
          onInput: e => emit('update:centro-picker-search', e.target.value)
        }),
        h('div', {
          class: 'border rounded p-2',
          style: { maxHeight: props.mobile ? '46vh' : '220px', overflow: 'auto' }
        },
          (props.centrosFiltrados || []).map(code =>
            h('div', { class: 'form-check', key: code }, [
              h('input', {
                class: 'form-check-input',
                type: 'checkbox',
                id: `cc_${code}`,
                checked: props.selectedCentrosSet && props.selectedCentrosSet.has && props.selectedCentrosSet.has(code),
                onChange: () => emit('toggle-centro', code)
              }),
              h('label', { class: 'form-check-label', for: `cc_${code}` }, [
                h('strong', code),
                ` — ${props.centrosCosto ? (props.centrosCosto[code] || '') : ''}`
              ])
            ])
          )
        ),
        h('small', { class: 'text-secondary d-block mt-1' },
          'Si seleccionas 1–10 códigos se filtra en servidor. Más de 10 se filtra en la página.'
        )
      ]),

      props.puedeVerMisCotizaciones
        ? h('div', { class: 'form-check mb-3' }, [
            h('input', {
              class: 'form-check-input',
              type: 'checkbox',
              id: `chkMine_${props.mobile ? 'm' : 'd'}`,
              checked: props.soloMias,
              onChange: e => emit('update:solo-mias', e.target.checked)
            }),
            h(
              'label',
              { class: 'form-check-label', for: `chkMine_${props.mobile ? 'm' : 'd'}` },
              'Ver sólo mis cotizaciones'
            )
          ])
        : null,

      h('div', { class: 'mb-0' }, [
        h('label', { class: 'form-label' }, 'Tamaño de página'),
        h('select', {
          class: 'form-select',
          value: props.pageSize,
          onChange: e => emit('update:page-size', Number(e.target.value))
        },
          [5,10,20,30,40,50,100,200,300,400,500].map(n => h('option', { value: n }, String(n)))
        )
      ])
    ];
  }
};

const COL_COTIZACIONES = 'cotizaciones_plantas';
const SEARCH_LIMIT = 20;

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const rawRole = computed(() =>
  String(auth?.profile?.role || auth?.profile?.rol || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
);

const puedeVerMisCotizaciones = computed(() => rawRole.value.includes('editor'));
const _recentCache = ref({ ts: 0, docs: [] });

function _stripExt(name) {
  const s = String(name || '').trim();
  return s.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, '').trim();
}

function _normTxt(v) {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _extractBestNumber(text) {
  const matches = String(text || '').match(/\d{1,}/g) || [];
  if (!matches.length) return '';
  matches.sort((a, b) => b.length - a.length);
  return matches[0] || '';
}

function _buildNameVariants(raw) {
  const out = new Set();
  const r = String(raw || '').trim();
  if (!r) return [];

  const base = _stripExt(r);
  out.add(r);
  out.add(base);

  if (!/\.pdf$/i.test(r)) out.add(`${r}.pdf`);
  if (!/\.pdf$/i.test(base)) out.add(`${base}.pdf`);

  const num = _extractBestNumber(r);
  if (num) {
    out.add(`cotizacion ${num}`);
    out.add(`cotizacion_${num}`);
    out.add(`cotizacion-${num}`);
  }

  return Array.from(out).map(x => String(x).trim()).filter(Boolean).slice(0, 12);
}

function _makePrefixCandidates(raw) {
  const out = new Set();
  const r = String(raw || '').trim();
  if (!r) return [];

  out.add(r);
  out.add(_stripExt(r));
  out.add(r.toUpperCase());
  out.add(_stripExt(r).toUpperCase());
  out.add(r.toLowerCase());
  out.add(_stripExt(r).toLowerCase());

  const num = _extractBestNumber(r);
  if (num) {
    out.add(`cotizacion ${num}`);
    out.add(`cotizacion_${num}`);
    out.add(`cotizacion-${num}`);
  }

  return Array.from(out)
    .map(x => String(x || '').trim())
    .filter(x => x.length >= 2)
    .slice(0, 8);
}

async function _safeGetDocs(q) {
  try { return await getDocs(q); }
  catch (e) { console.warn('getDocs error:', e); return null; }
}

const loading = ref(true);
const error = ref('');

const searchText = ref('');
const resultadosBusqueda = ref([]);
const loadingGlobalSearch = ref(false);
const searchedOnce = ref(false);
const lastSearchText = ref('');
const lastSearchTextTrim = computed(() => String(lastSearchText.value || '').trim());

const filtroFecha = ref('');
const filtroEstatus = ref([]);
const soloMias = ref(false);
const empresaSegmento = ref('todas');

const showSidebar = ref(true);
const showFiltersMobile = ref(false);
const isDesktop = ref(false);

const pageDocs = ref([]);
const page = ref(1);
const pageSize = ref(5);
const totalCount = ref(0);
const cursors = ref({});
const savedScrollY = ref(0);
const booting = ref(true);

const LS_FILTERS = 'histCotPlantas:filters_v1';
const LS_SHOW_SIDEBAR = 'histCotPlantas:showSidebar';
const ROUTE_STATE_KEY = computed(() => `histCotPlantas:routeState:${String(route?.name || 'HistorialCotizacionesPlantas')}`);

const centrosCosto = {
  "BETON_CALAMA": "PLANTA BETON CALAMA",
  "FLUMECAR_CALAMA": "PLANTA FLUMECAR CALAMA",
  "URBANA_CALAMA": "PLANTA URBANA CALAMA",
  "KM13_ANDINA": "PLANTA KM13 ANDINA",
  "NV17_ANDINA": "PLANTA NV17 ANDINA",
  "SAN_BERNARDO": "PLANTA SAN BERNANDO",
  "ARIDO_NOS": "PLANTA DE ÁRIDO NOS",
  "OLIVAR": "PLANTA OLIVAR",
  "COLON": "PLANTA COLÓN",
  "AGUA_DULCE": "PLANTA AGUA DULCE",
  "ESMERALDA": "PLANTA ESMERALDA",
  "ESTOCADA_8": "PLANTA ESTOCADA 8",
  "OP14": "PLANTA OP14",
  "ANDES_NORTE": "PLANTA ANDES NORTE",
  "CHANCHADO": "PLANTA CHANCHADO"
};

const selectedCentros = ref([]);
const selectedCentrosSet = computed(() => new Set(selectedCentros.value));
const centroPickerSearch = ref('');
const centroSearch = ref('');

const displayList = computed(() => applyClientFilters(pageDocs.value));
const pageFrom = computed(() => totalCount.value ? (page.value - 1) * pageSize.value + 1 : 0);
const pageTo = computed(() => Math.min(totalCount.value, page.value * pageSize.value));
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

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

const currentUserName = computed(() => (
  auth?.profile?.fullName ||
  auth?.user?.displayName ||
  auth?.user?.email ||
  ''
).trim());

const centroNombreFiltroActivo = computed(() => centroSearch.value && !/^[0-9\-A-Z_]+$/i.test((centroSearch.value || '').trim()));
const clientCentrosOverflow = computed(() => selectedCentros.value.length > 10);

const hasActiveFilters = computed(() =>
  !!filtroFecha.value ||
  filtroEstatus.value.length ||
  soloMias.value ||
  empresaSegmento.value !== 'todas' ||
  !!centroSearch.value ||
  selectedCentros.value.length > 0
);

const showScrollTop = ref(false);

function computeIsDesktop() {
  isDesktop.value = window.innerWidth >= 992;
}

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

function _estadoKeyPlano(v) {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .trim();
}

function estadoKey(estatusRaw) {
  const s = _estadoKeyPlano(estatusRaw);

  if (s.includes('pend')) return 'pendiente';
  if (s.includes('aprob')) return 'aprobado';
  if (s.includes('rechaz')) return 'rechazado';
  return 'otro';
}

const estadoBadgeClass  = (estatus) => `badge-${estadoKey(estatus)}`;
const estadoHeaderClass = (estatus) => `hdr-${estadoKey(estatus)}`;

function getArchivoNombre(cot) {
  const st = cot?.archivosStorage;
  if (Array.isArray(st) && st.length) {
    const first = st.find(x => x && typeof x === 'object' && (x.nombre || x.name));
    if (first?.nombre) return String(first.nombre);
    if (first?.name) return String(first.name);
  }
  return '';
}

function isClickableToDetail(cot) {
  const k = estadoKey(cot?.estatus);
  return k === 'rechazado' || k === 'pendiente';
}

function onCardClick(cot) {
  if (isClickableToDetail(cot)) goCotizacion(cot);
}

function agruparPorEmpresa(arr = []) {
  const out = {};
  (arr || []).forEach(o => {
    const k = o?.empresa || 'Sin Empresa';
    if (!Array.isArray(out[k])) out[k] = [];
    out[k].push(o);
  });
  return out;
}

const agrupadasPaged = computed(() => agruparPorEmpresa(displayList.value));

function toggleCentro(code) {
  const set = new Set(selectedCentros.value);
  if (set.has(code)) set.delete(code);
  else set.add(code);
  selectedCentros.value = Array.from(set);
  applyFilters();
}

function removeCentro(code) {
  selectedCentros.value = selectedCentros.value.filter(c => c !== code);
  applyFilters();
}

function removeCentroChip() {
  centroSearch.value = '';
  applyFilters();
}

function removeEstatus(s) {
  filtroEstatus.value = filtroEstatus.value.filter(x => x !== s);
  applyFilters();
}

function setEmpresaSeg(v) {
  empresaSegmento.value = v;
  applyFilters();
}

function openFiltersMobile() {
  showFiltersMobile.value = true;
  document.documentElement.style.overflow = 'hidden';
}

function closeFiltersMobile() {
  showFiltersMobile.value = false;
  document.documentElement.style.overflow = '';
}

function toggleSidebarOnly() {
  showSidebar.value = !showSidebar.value;
  try { localStorage.setItem(LS_SHOW_SIDEBAR, showSidebar.value ? '1' : '0'); } catch(e) {console.log(e)}
}

function toggleFiltersResponsive() {
  computeIsDesktop();
  if (isDesktop.value) toggleSidebarOnly();
  else (showFiltersMobile.value ? closeFiltersMobile() : openFiltersMobile());
}

function handleResize() {
  const wasMobileOpen = showFiltersMobile.value;
  computeIsDesktop();
  if (isDesktop.value && wasMobileOpen) closeFiltersMobile();
}

function persistRouteState() {
  try {
    const payload = {
      page: Number(page.value || 1),
      pageSize: Number(pageSize.value || 5),
      scrollY: Number(window.scrollY || 0),
      ts: Date.now()
    };
    sessionStorage.setItem(ROUTE_STATE_KEY.value, JSON.stringify(payload));
  } catch(e) {console.log(e)}
}

function loadRouteState() {
  try {
    const raw = sessionStorage.getItem(ROUTE_STATE_KEY.value);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || typeof st !== 'object') return null;
    return st;
  } catch {
    return null;
  }
}

function persistFilters() {
  const payload = {
    filtroFecha: filtroFecha.value || '',
    filtroEstatus: Array.isArray(filtroEstatus.value) ? filtroEstatus.value : [],
    selectedCentros: Array.isArray(selectedCentros.value) ? selectedCentros.value : [],
    centroSearch: centroSearch.value || '',
    empresaSegmento: empresaSegmento.value || 'todas',
    soloMias: !!soloMias.value,
    pageSize: Number(pageSize.value || 5)
  };
  try { localStorage.setItem(LS_FILTERS, JSON.stringify(payload)); } catch(e) {console.log(e)}
}

function loadPersistedFilters() {
  try {
    const sb = localStorage.getItem(LS_SHOW_SIDEBAR);
    if (sb === '0') showSidebar.value = false;
    if (sb === '1') showSidebar.value = true;

    const raw = localStorage.getItem(LS_FILTERS);
    if (!raw) return;

    const f = JSON.parse(raw);
    filtroFecha.value = f.filtroFecha ?? '';
    filtroEstatus.value = Array.isArray(f.filtroEstatus) ? f.filtroEstatus : [];
    selectedCentros.value = Array.isArray(f.selectedCentros) ? f.selectedCentros : [];
    centroSearch.value = f.centroSearch ?? '';
    empresaSegmento.value = f.empresaSegmento ?? 'todas';
    soloMias.value = !!f.soloMias;
    if ([5,10,20,30,40,50,100,200,300,400,500].includes(Number(f.pageSize))) pageSize.value = Number(f.pageSize);
  } catch(e) {console.log(e)}
}

function onStorageSync(e) {
  if (e.key === LS_FILTERS && e.newValue) {
    loadPersistedFilters();
    applyFilters();
  } else if (e.key === LS_SHOW_SIDEBAR && e.newValue !== null) {
    showSidebar.value = (e.newValue === '1');
  }
}

function buildBaseWhere() {
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
      const end = new Date(`${filtroFecha.value}T23:59:59.999`);
      wh.push(where('fechaSubida', '>=', start));
      wh.push(where('fechaSubida', '<=', end));
    } catch(e) {console.log(e)}
  }

  if (soloMias.value && puedeVerMisCotizaciones.value) {
    const fullName = currentUserName.value;
    if (fullName) wh.push(where('responsable', '==', fullName));
  }

  if (selectedCentros.value.length === 1) {
    wh.push(where('numero_contrato', '==', selectedCentros.value[0]));
  } else if (selectedCentros.value.length >= 2 && selectedCentros.value.length <= 10) {
    wh.push(where('numero_contrato', 'in', selectedCentros.value.slice(0, 10)));
  }

  return wh;
}

function makePageQuery(pageNumber = 1) {
  const wh = buildBaseWhere();
  const base = query(
    collection(db, COL_COTIZACIONES),
    ...wh,
    orderBy('fechaSubida', 'desc'),
    limit(pageSize.value)
  );

  if (pageNumber > 1 && cursors.value[pageNumber - 1]) {
    return query(base, startAfter(cursors.value[pageNumber - 1]));
  }
  return base;
}

async function ensureCursorsForPage(targetPage) {
  const p = Number(targetPage || 1);
  if (p <= 1) return;

  const wh = buildBaseWhere();
  let prevCursor = null;

  for (let i = 1; i <= p - 1; i++) {
    if (cursors.value[i]) {
      prevCursor = cursors.value[i];
      continue;
    }

    let q = query(
      collection(db, COL_COTIZACIONES),
      ...wh,
      orderBy('fechaSubida', 'desc'),
      limit(pageSize.value)
    );

    if (prevCursor) q = query(q, startAfter(prevCursor));

    const snap = await getDocs(q);
    const last = snap.docs[snap.docs.length - 1] || null;
    cursors.value[i] = last || null;
    prevCursor = last || null;
    if (!last) break;
  }
}

async function fetchPage() {
  loading.value = true;
  error.value = '';

  try {
    const q = makePageQuery(page.value);
    const snap = await getDocs(q);

    let docs = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));

    if (clientCentrosOverflow.value) {
      const set = new Set(selectedCentros.value);
      docs = docs.filter(cot => set.has(cot.numero_contrato));
    }

    pageDocs.value = docs;
    const last = snap.docs[snap.docs.length - 1] || null;
    cursors.value[page.value] = last || null;

    loading.value = false;

    await nextTick();
    window.scrollTo(0, savedScrollY.value);
  } catch (e) {
    console.error(e);
    error.value = 'No se pudieron cargar las cotizaciones de plantas.';
    loading.value = false;
  }
}

async function refreshCount() {
  try {
    const wh = buildBaseWhere();
    const countQ = query(collection(db, COL_COTIZACIONES), ...wh);
    const res = await getCountFromServer(countQ);
    totalCount.value = res.data().count || 0;
  } catch (e) {
    console.error('count error', e);
    totalCount.value = Math.max(totalCount.value || 0, pageDocs.value.length);
  }
}

function applyClientFilters(arr) {
  let out = Array.isArray(arr) ? arr : [];

  if (centroNombreFiltroActivo.value) {
    const q = centroSearch.value.trim().toLowerCase();
    out = out.filter(cot => {
      const pool = [cot.nombre_centro_costo].filter(Boolean).map(x => String(x).toLowerCase());
      return pool.some(s => s.includes(q));
    });
  }

  return out;
}

const pageMatchesCount = computed(() => {
  const qn = _normTxt(lastSearchText.value);
  if (!qn) return 0;
  return (pageDocs.value || []).filter(cot => _normTxt(getArchivoNombre(cot)).includes(qn)).length;
});

async function buscarGlobal() {
  resultadosBusqueda.value = [];
  searchedOnce.value = false;

  const raw = String(searchText.value || "").trim();
  if (!raw) return;

  lastSearchText.value = raw;
  loadingGlobalSearch.value = true;

  try {
    const merged = new Map();
    const baseCol = collection(db, COL_COTIZACIONES);

    const addSnap = (snap) => {
      if (!snap?.docs?.length) return;
      for (const d of snap.docs) {
        if (!merged.has(d.id)) merged.set(d.id, { __docId: d.id, ...d.data() });
      }
    };

    const addDocIfExists = (ds) => {
      if (ds?.exists?.()) merged.set(ds.id, { __docId: ds.id, ...ds.data() });
    };

    const tasks = [];

    if (raw.length >= 8) {
      tasks.push((async () => {
        try {
          const ds = await getDoc(doc(db, COL_COTIZACIONES, raw));
          addDocIfExists(ds);
        } catch(e) {console.log(e)}
      })());
    }

    const num = _extractBestNumber(raw);
    if (num) {
      const n = Number(num);
      if (!Number.isNaN(n)) {
        tasks.push(_safeGetDocs(query(baseCol, where("id", "==", n), limit(SEARCH_LIMIT))).then(addSnap));
        tasks.push(_safeGetDocs(query(baseCol, where("id", "==", String(num)), limit(SEARCH_LIMIT))).then(addSnap));
      }
    }

    const variants = _buildNameVariants(raw);
    const prefixes = _makePrefixCandidates(raw);

    await Promise.allSettled(tasks);

    if (merged.size === 0) {
      const now = Date.now();
      const isCacheFresh = (now - (_recentCache.value.ts || 0)) < 90_000;
      let recentDocs = _recentCache.value.docs || [];

      if (!isCacheFresh || !recentDocs.length) {
        let snap = await _safeGetDocs(query(baseCol, orderBy("fechaSubida", "desc"), limit(250)));
        if (!snap) snap = await _safeGetDocs(query(baseCol, limit(250)));
        recentDocs = (snap?.docs || []).map(d => ({ __docId: d.id, ...d.data() }));
        _recentCache.value = { ts: now, docs: recentDocs };
      }

      const needle = _normTxt(_stripExt(raw));

      for (const cot of recentDocs) {
        const fileNames = Array.isArray(cot.archivosStorage)
          ? cot.archivosStorage.map(a => _normTxt(_stripExt(a?.nombre || a?.name || '')))
          : [];

        const hitFile = fileNames.some(x => x.includes(needle));
        const hitNum = String(cot.id ?? '').includes(num || '');
        const hitSimple = variants.some(v => _normTxt(v) && fileNames.some(fn => fn.includes(_normTxt(v))));
        const hitPrefix = prefixes.some(p => _normTxt(p) && fileNames.some(fn => fn.includes(_normTxt(p))));

        if (hitFile || hitNum || hitSimple || hitPrefix) {
          if (!merged.has(cot.__docId)) merged.set(cot.__docId, cot);
          if (merged.size >= SEARCH_LIMIT) break;
        }
      }
    }

    resultadosBusqueda.value = Array.from(merged.values()).slice(0, SEARCH_LIMIT);
    searchedOnce.value = true;
  } catch (e) {
    console.error("buscarGlobal error", e);
    searchedOnce.value = true;
  } finally {
    loadingGlobalSearch.value = false;
  }
}

function applyFilters() {
  persistFilters();
  page.value = 1;
  cursors.value = {};
  savedScrollY.value = window.scrollY;
  fetchPage();
  refreshCount();
}

function limpiarFiltros() {
  filtroFecha.value = '';
  filtroEstatus.value = [];
  centroSearch.value = '';
  selectedCentros.value = [];
  centroPickerSearch.value = '';
  soloMias.value = false;
  empresaSegmento.value = 'todas';
  pageSize.value = 5;
  applyFilters();
}

async function goPage(p) {
  if (p < 1) p = 1;
  if (p > totalPages.value) p = totalPages.value;

  savedScrollY.value = window.scrollY;
  page.value = p;

  if (page.value > 1 && !cursors.value[page.value - 1]) {
    try { await ensureCursorsForPage(page.value); } catch (e) { console.error(e); }
  }

  fetchPage();
}

const nextPage = () => goPage(page.value + 1);
const prevPage = () => goPage(page.value - 1);

function goCotizacion(cot) {
  persistRouteState();
  try {
    router.push({ name: 'DetalleCotizacionPlanta', params: { id: cot.__docId } });
  } catch {
    router.push(`/detalle-coti-planta/${cot.__docId}`);
  }
}

function goSolped(cot) {
  const id = cot?.solpedId;
  if (!id) return;
  persistRouteState();
  try {
    router.push({ name: 'DetalleSolpedPlanta', params: { id } });
  } catch {
    router.push(`/detalle-solped-planta/${id}`);
  }
}

function volver() {
  persistRouteState();
  router.back();
}

function onScroll() {
  showScrollTop.value = window.scrollY > 300;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onBeforeRouteLeave(() => {
  persistRouteState();
});

onMounted(async () => {
  computeIsDesktop();
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('storage', onStorageSync);

  loadPersistedFilters();
  if (!puedeVerMisCotizaciones.value) {
    soloMias.value = false;
  }
  const st = loadRouteState();
  if (st) {
    if ([5,10,20,30,40,50,100,200,300,400,500].includes(Number(st.pageSize))) pageSize.value = Number(st.pageSize);
    const restoredPage = Math.max(1, Number(st.page || 1));
    const restoredScroll = Math.max(0, Number(st.scrollY || 0));

    page.value = restoredPage;
    savedScrollY.value = restoredScroll;

    if (page.value > 1) {
      try { await ensureCursorsForPage(page.value); } catch (e) { console.error(e); }
    }
  }

  await fetchPage();
  await refreshCount();

  booting.value = false;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', onScroll);
  document.documentElement.style.overflow = '';
});

onUnmounted(() => {
  window.removeEventListener('storage', onStorageSync);
});

watch(
  [empresaSegmento, soloMias, filtroFecha, () => filtroEstatus.value.slice(), pageSize, selectedCentros, () => centroSearch.value],
  () => {
    if (booting.value) return;
    applyFilters();
  },
  { deep: true }
);
</script>

<style scoped>
.hist-oc-page{ min-height:100vh; }
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius:.9rem !important;
}

.sticky-pager{ position: sticky; top: 8px; z-index: 5; backdrop-filter: blur(3px); }
.sticky-sidebar{ position: sticky; top: 12px; }

.floating-filters-btn{
  position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 20;
  border-radius: 12px; width: 48px; height: 48px; display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

.floating-top-btn{
  position: fixed; right: 16px; bottom: calc(80px + env(safe-area-inset-bottom));
  z-index: 20;
  border-radius: 12px; width: 48px; height: 48px; display: grid; place-items: center;
  backdrop-filter: blur(4px);
  box-shadow: 0 10px 20px rgba(0,0,0,.18);
}

.oc-card.oc-clickable{
  cursor:pointer;
  border-color:#ef4444 !important;
  box-shadow:0 0 0 2px rgba(239,68,68,.15), 0 12px 24px rgba(239,68,68,.18) !important;
}

.loading-global{
  display:flex; align-items:center; justify-content:center;
  padding:2rem; border:1px dashed #e5e7eb; border-radius:.75rem;
}

.ghost-wrap{ text-align:center; padding:2rem 0; color:#64748b; }
.ghost{
  width:120px; height:140px; margin:0 auto; background:#fff; border-radius:60px 60px 20px 20px;
  position:relative; box-shadow: 0 10px 20px rgba(0,0,0,.08);
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

.badge .btn-close{ width:.6rem; height:.6rem; filter: invert(1) grayscale(100%) brightness(0.4); }
.form-check.form-switch .form-check-input{ cursor: pointer; }

.badge-status{ font-weight:600; border:0; }
.badge-aprobado{ background:#e7f6e9; color:#166534; }
.badge-pendiente{ background:#fff1db; color:#92400e; }
.badge-rechazado{ background:#fee2e2; color:#991b1b; }
.badge-otro{ background:#f1f5f9; color:#334155; }

.hdr-aprobado{ background:#e7f6e9 !important; color:#0f5132 !important; border-bottom:1px solid #ccead2 !important; }
.hdr-pendiente{ background:#fff1db !important; color:#7c2d12 !important; border-bottom:1px solid #ffe1b6 !important; }
.hdr-rechazado{ background:#fee2e2 !important; color:#7f1d1d !important; border-bottom:1px solid #fecaca !important; }
.hdr-otro{ background:#f1f5f9 !important; color:#334155 !important; border-bottom:1px solid #e2e8f0 !important; }

.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }
.oc-wrap{ position: fixed; inset: 0; z-index: 1080; }
.oc-backdrop{ position: absolute; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(1px); }
.oc-panel{
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(92vw, 420px);
  background: #fff; box-shadow: -8px 0 24px rgba(0,0,0,.2);
  display: flex; flex-direction: column;
  transform: translateX(0); animation: ocSlideIn .22s ease-out;
}
@keyframes ocSlideIn { from { transform: translateX(100%); opacity: .6; } to { transform: translateX(0); opacity: 1; } }
.oc-header{ padding: .9rem .9rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
.oc-body{ padding: .9rem; overflow: auto; }
.oc-footer{ margin-top: auto; padding: .9rem; border-top: 1px solid #e5e7eb; display: flex; gap: .5rem; justify-content: flex-end; }

@media (max-width: 420px){
  .card-header .small{ font-size: .8rem; }
}
</style>
