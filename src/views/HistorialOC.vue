<!-- src/views/HistorialOC.vue -->
<template>
  <div class="hist-oc-page">
    <div class="container py-4 py-md-5">
      <!-- Top bar -->
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate flex-grow-1 text-center d-none d-sm-block">
          Historial de Cotizaciones
        </h1>
        <h1 class="h6 fw-semibold mb-0 text-truncate d-sm-none">Historial OC</h1>

        <div class="d-flex align-items-center gap-2">
          <!-- En desktop alterna sidebar; en móvil abre offcanvas -->
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

          <!-- Switch Mis cotizaciones (oculto en xs) -->
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
          <div v-if="ocEncontrada" class="alert alert-light d-flex align-items-center mt-3 flex-wrap gap-2">
            <div class="me-auto">
              <div class="fw-semibold">Resultado: N° {{ ocEncontrada.id ?? '—' }}</div>
              <div class="small text-secondary">
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
        <div class="btn-group flex-wrap">
          <button class="btn btn-sm" :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('todas')">Todas</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Mining' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Mining')">⛏ Mining</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Servicio')">🛠 Servicio</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Hormigones')">🧱 Hormigones</button>
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
                :class="{
                  'oc-clickable': isClickableToDetail(oc),
                  'oc-missing-oc': faltaSubirOC(oc)
                }"
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

                  <div class="small text-secondary">
                    Subida: <strong>{{ fmtFecha(oc.fechaSubida) }}</strong>
                    <span v-if="oc.fechaAprobacion"> · Aprobada: <strong>{{ fmtFecha(oc.fechaAprobacion) }}</strong></span>
                  </div>
                </div>

                <div class="card-body">
                  <!-- 🔶 ALERTA AMARILLA -->
                  <div v-if="faltaSubirOC(oc)" class="alert alert-warning d-flex align-items-center mb-3" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <div class="fw-semibold">Falta subir OC</div>
                  </div>

                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <div class="small text-secondary">Centro de Costo</div>
                      <div class="fw-semibold">
                        {{ oc.numero_contrato || oc.centroCosto || '—' }} — {{ oc.nombre_centro_costo || oc.centroCostoNombre || '—' }}
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="small text-secondary">Responsable</div>
                      <div class="fw-semibold">{{ oc.responsable || '—' }}</div>
                    </div>

                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Moneda</div>
                      <div class="fw-semibold">{{ oc.moneda || '—' }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Total con IVA</div>
                      <div class="fw-semibold">{{ fmtMoneda(oc.precioTotalConIVA, oc.moneda) }}</div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="small text-secondary">Aprobador sugerido</div>
                      <div class="fw-semibold">{{ oc.aprobadorSugerido || '—' }}</div>
                    </div>

                    <div class="col-12">
                      <div class="small text-secondary">Comentario</div>
                      <div class="border rounded p-2">{{ oc.comentario || '—' }}</div>
                    </div>
                  </div>

                  <!-- Vinculado a SOLPED -->
                  <div class="mt-3 d-flex align-items-center gap-2"
                       v-if="oc.solpedId || oc.numero_solped != null">
                    <i class="bi bi-link-45deg"></i>
                    <span class="small text-secondary">Vinculado a SOLPED</span>

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

                <div class="card-footer d-flex align-items-center justify-content-between">
                  <div class="small text-secondary">
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

    <!-- Offcanvas filtros (móvil / tablet) -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none">
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>

        <div
          class="oc-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros historial OC"
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

    <!-- Botón flotante filtros (móvil) -->
    <button
      class="btn btn-primary floating-filters-btn d-lg-none"
      @click="toggleFiltersResponsive"
      :title="showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'"
      aria-label="Abrir filtros"
    >
      <i class="bi bi-funnel"></i>
    </button>

    <!-- Botón flotante: volver arriba (móvil) -->
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
  collection, query, where, orderBy, limit, startAfter, onSnapshot, getDocs, getCountFromServer
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

/* ========== Subcomponente: FiltroForm ========== */
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
    mobile: Boolean
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
          ['Aprobado','Preaprobado','Pendiente de Aprobación','Revisión Guillermo','Enviada a proveedor','Rechazado'].map(s =>
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

      h('div', { class: 'mb-3' }, [
        h('label', { class: 'form-label' }, 'Centro (texto contiene)'),
        h('input', {
          class: 'form-control',
          placeholder: 'Ej: San Bernardo / Caneche',
          value: props.centroSearch,
          onInput: e => emit('update:centro-search', e.target.value)
        }),
        h('small', { class: 'text-secondary' }, 'Se aplica en la página.')
      ]),

      h('div', { class: 'form-check mb-3' }, [
        h('input', {
          class: 'form-check-input',
          type: 'checkbox',
          id: `chkMine_${props.mobile ? 'm' : 'd'}`,
          checked: props.soloMias,
          onChange: e => emit('update:solo-mias', e.target.checked)
        }),
        h('label', { class: 'form-check-label', for: `chkMine_${props.mobile ? 'm' : 'd'}` }, 'Ver sólo mis cotizaciones')
      ]),

      h('div', { class: 'mb-0' }, [
        h('label', { class: 'form-label' }, 'Tamaño de página'),
        h('select', {
          class: 'form-select',
          value: props.pageSize,
          onChange: e => emit('update:page-size', Number(e.target.value))
        },
          [5,10,20,30,40,50].map(n => h('option', { value: n }, String(n)))
        )
      ])
    ]
  }
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

  if (s.includes('preaprob')) return 'preaprobado';
  if (s.includes('pend') || s.includes('aprobacion')) return 'pendiente';
  if (s.includes('aprob')) return 'aprobado';
  if (s.includes('rechaz')) return 'rechazado';
  if (s.includes('proveedor') || s.includes('enviada')) return 'enviada';
  if (s.includes('revision')) return 'revision';
  if (s.includes('recepcion') && s.includes('completa')) return 'recepcion-completa';
  if (s.includes('recepcion') && s.includes('parcial'))  return 'recepcion-parcial';

  return 'otro';
}

const estadoBadgeClass  = (estatus) => `badge-${estadoKey(estatus)}`;
const estadoHeaderClass = (estatus) => `hdr-${estadoKey(estatus)}`;

function hasArchivoOC(oc) {
  const a = oc?.archivoOC;

  if (Array.isArray(a) && a.length > 0) {
    for (const item of a) {
      if (typeof item === 'string' && item.trim() !== '') return true;
      if (item && typeof item === 'object') {
        if (typeof item.url  === 'string' && item.url.trim()  !== '') return true;
        if (typeof item.path === 'string' && item.path.trim() !== '') return true;
        if (
          typeof item.nombre === 'string' && item.nombre.trim() !== '' &&
          typeof item.tipo   === 'string' && item.tipo.trim()   !== ''
        ) return true;
      }
    }
  }
  if (a && typeof a === 'object' && !Array.isArray(a)) {
    if (typeof a.url  === 'string' && a.url.trim()  !== '') return true;
    if (typeof a.path === 'string' && a.path.trim() !== '') return true;
    if (
      typeof a.nombre === 'string' && a.nombre.trim() !== '' &&
      typeof a.tipo   === 'string' && a.tipo.trim()   !== ''
    ) return true;
  }
  if (typeof a === 'string'  && a.trim() !== '') return true;
  if (typeof a === 'boolean' && a === true)      return true;

  if (typeof oc?.archivoOCUrl === 'string' && oc.archivoOCUrl.trim() !== '') return true;
  return false;
}

function faltaSubirOC(oc) {
  return estadoKey(oc?.estatus) === 'aprobado' && !hasArchivoOC(oc);
}

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const volver = () => {
  // por si vuelves a una vista anterior y quieres conservar estado aquí también
  persistRouteState();
  router.back();
};

const isDesktop = ref(false);
const computeIsDesktop = () => { isDesktop.value = window.innerWidth >= 992; };

const LS_SHOW_SIDEBAR = 'histOC:showSidebar';
const showSidebar = ref(true);
const showFiltersMobile = ref(false);

const openFiltersMobile = () => {
  showFiltersMobile.value = true;
  document.documentElement.style.overflow = 'hidden';
};
const closeFiltersMobile = () => {
  showFiltersMobile.value = false;
  document.documentElement.style.overflow = '';
};
const toggleSidebarOnly = () => {
  showSidebar.value = !showSidebar.value;
  try { localStorage.setItem(LS_SHOW_SIDEBAR, showSidebar.value ? '1' : '0'); } catch(e){console.error('persist sidebar error', e);}
};
const toggleFiltersResponsive = () => {
  computeIsDesktop();
  if (isDesktop.value) toggleSidebarOnly();
  else (showFiltersMobile.value ? closeFiltersMobile() : openFiltersMobile());
};
const handleResize = () => {
  const wasMobileOpen = showFiltersMobile.value;
  computeIsDesktop();
  if (isDesktop.value && wasMobileOpen) closeFiltersMobile();
};

const loading = ref(true);
const loadingSearch = ref(false);
const error = ref('');

const pageDocs = ref([]);
const displayList = computed(() => applyClientFilters(pageDocs.value));

const numeroOC = ref(null);
const ocEncontrada = ref(null);

const filtroFecha = ref('');
const filtroEstatus = ref([]);
const soloMias = ref(false);
const empresaSegmento = ref('todas');

const centrosCosto = {
  "30858":"CONTRATO 30858 INFRA CHUQUICAMATA",
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

const page = ref(1);
const pageSize = ref(5);
const totalCount = ref(0);
const pageFrom = computed(() => totalCount.value ? (page.value - 1) * pageSize.value + 1 : 0);
const pageTo   = computed(() => Math.min(totalCount.value, page.value * pageSize.value));
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

const cursors = ref({});
let unsubscribe = null;
const savedScrollY = ref(0);

/* ========= NUEVO: Estado para restauración de página ========= */
const booting = ref(true);
const ROUTE_STATE_KEY = computed(() => `histOC:routeState:${String(route?.name || 'HistorialOC')}`);

function persistRouteState() {
  try {
    const payload = {
      page: Number(page.value || 1),
      pageSize: Number(pageSize.value || 5),
      scrollY: Number(window.scrollY || 0),
      ts: Date.now()
    };
    sessionStorage.setItem(ROUTE_STATE_KEY.value, JSON.stringify(payload));
  } catch (e) {
    console.error('persistRouteState error', e);
  }
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

/* ========= NUEVO: precarga cursores hasta la página deseada ========= */
async function ensureCursorsForPage(targetPage) {
  const p = Number(targetPage || 1);
  if (p <= 1) return;

  // reconstruye cursors[1..p-1] si no están
  const wh = buildBaseWhere();
  let prevCursor = null;

  for (let i = 1; i <= p - 1; i++) {
    if (cursors.value[i]) {
      prevCursor = cursors.value[i];
      continue;
    }

    let q = query(
      collection(db, 'ordenes_oc'),
      ...wh,
      orderBy('fechaSubida', 'desc'),
      limit(pageSize.value)
    );

    if (prevCursor) q = query(q, startAfter(prevCursor));

    const snap = await getDocs(q);
    const last = snap.docs[snap.docs.length - 1] || null;
    cursors.value[i] = last || null;
    prevCursor = last || null;

    if (!last) break; // no hay más documentos para seguir avanzando
  }
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

const isEditor = computed(() => {
  const r = (auth?.profile?.role || auth?.role || '').toLowerCase().trim();
  return r === 'editor';
});

const isClickableToDetail = (oc) => {
  const k = estadoKey(oc?.estatus);
  return k === 'rechazado' || k === 'pendiente';
};
const onCardClick = (oc) => { if (isClickableToDetail(oc)) goOC(oc); };

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
const LS_FILTERS = 'histOC:filters_v1';
const LS_SOLO_MIAS_KEY = 'histOC:soloMias';

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
      const legacy = localStorage.getItem(LS_SOLO_MIAS_KEY);
      if (legacy === '1') soloMias.value = true;
      if (legacy === '0') soloMias.value = false;
    }
  } catch(e){console.error('load persisted filters error', e);}
}
function onStorageSync(e){
  if (e.key === LS_FILTERS && e.newValue){
    loadPersistedFilters();
    applyFilters();
  } else if (e.key === LS_SHOW_SIDEBAR && e.newValue !== null){
    showSidebar.value = (e.newValue === '1');
  }
}

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
    } catch (e){console.error('fecha filtro error', e);}
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

const applyFilters = () => {
  persistFilters();
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

const goPage = async (p) => {
  if (p < 1) p = 1;
  if (p > totalPages.value) p = totalPages.value;

  savedScrollY.value = window.scrollY;
  page.value = p;

  // NUEVO: si alguien salta a una página y no hay cursor previo, lo preparamos
  if (page.value > 1 && !cursors.value[page.value - 1]) {
    try { await ensureCursorsForPage(page.value); } catch(e){ console.error('ensureCursorsForPage error', e); }
  }

  subscribePage();
};

const nextPage = () => goPage(page.value + 1);
const prevPage = () => goPage(page.value - 1);

const goOC = (oc) => {
  persistRouteState();
  router.push({ name: 'oc-detalle', params: { id: oc.__docId } });
};
const goSolped = (oc) => {
  const id = oc?.solpedId;
  if (!id) return;
  persistRouteState();
  router.push({ name: 'SolpedDetalle', params: { id } });
};

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

const showScrollTop = ref(false);
const onScroll = () => {
  showScrollTop.value = window.scrollY > 300;
};
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ========= NUEVO: guardar estado al salir ========= */
onBeforeRouteLeave(() => {
  persistRouteState();
});

/* ========= Init / Cleanup ========= */
onMounted(async () => {
  computeIsDesktop();
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', onScroll, { passive: true });

  // carga filtros + sidebar persistidos
  loadPersistedFilters();

  // NUEVO: restaura page + scroll (si vienes “de vuelta”)
  const st = loadRouteState();
  if (st) {
    if ([5,10,20,30,40,50].includes(Number(st.pageSize))) pageSize.value = Number(st.pageSize);
    const restoredPage = Math.max(1, Number(st.page || 1));
    const restoredScroll = Math.max(0, Number(st.scrollY || 0));

    page.value = restoredPage;
    savedScrollY.value = restoredScroll;

    // precargar cursores si la página es > 1 (necesario para startAfter)
    if (page.value > 1) {
      try { await ensureCursorsForPage(page.value); } catch(e){ console.error('restore ensureCursorsForPage error', e); }
    }
  }

  // suscribe y cuenta
  subscribePage();
  await refreshCount();

  // sincroniza entre pestañas
  window.addEventListener('storage', onStorageSync);

  booting.value = false;
});

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe();
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', onScroll);
  document.documentElement.style.overflow = '';
});
onUnmounted(() => { window.removeEventListener('storage', onStorageSync); });

/* ========= Observadores ========= */
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

/* Paginación superior pegajosa */
.sticky-pager{ position: sticky; top: 8px; z-index: 5; backdrop-filter: blur(3px); }

/* Sidebar filtros pegajoso en desktop */
.sticky-sidebar{ position: sticky; top: 12px; }

/* Botón flotante filtros (móvil) */
.floating-filters-btn{
  position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 20;
  border-radius: 12px; width: 48px; height: 48px; display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

/* Botón flotante “volver arriba” (móvil) */
.floating-top-btn{
  position: fixed; right: 16px; bottom: calc(80px + env(safe-area-inset-bottom));
  z-index: 20;
  border-radius: 12px; width: 48px; height: 48px; display: grid; place-items: center;
  backdrop-filter: blur(4px);
  box-shadow: 0 10px 20px rgba(0,0,0,.18);
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

/* Badge close */
.badge .btn-close{ width:.6rem; height:.6rem; filter: invert(1) grayscale(100%) brightness(0.4); }

/* Switch header */
.form-check.form-switch .form-check-input{ cursor: pointer; }
.oc-missing-oc{
  border-color:#f59e0b !important; /* amarillo */
  box-shadow:0 0 0 2px rgba(245, 158, 11, .15), 0 12px 24px rgba(245, 158, 11, .18) !important;
}

.badge-status{ font-weight:600; border:0; }
.badge-aprobado{    background:#e7f6e9; color:#166534; }
.badge-preaprobado{ background:#e6f3fb; color:#0b4a6f; }
.badge-pendiente{   background:#fff1db; color:#92400e; }
.badge-rechazado{   background:#fee2e2; color:#991b1b; }
.badge-enviada{     background:#e8edff; color:#1e3a8a; }
.badge-revision{    background:#efe9ff; color:#5b21b6; }
.badge-recepcion-completa{ background:#d1fae5; color:#065f46; }
.badge-recepcion-parcial{  background:#cffafe; color:#155e75; }
.badge-otro{        background:#f1f5f9; color:#334155; }

.hdr-aprobado{    background:#e7f6e9 !important; color:#0f5132 !important; border-bottom:1px solid #ccead2 !important; }
.hdr-preaprobado{ background:#e6f3fb !important; color:#0b4a6f !important; border-bottom:1px solid #c7e6f7 !important; }
.hdr-pendiente{   background:#fff1db !important; color:#7c2d12 !important; border-bottom:1px solid #ffe1b6 !important; }
.hdr-rechazado{   background:#fee2e2 !important; color:#7f1d1d !important; border-bottom:1px solid #fecaca !important; }
.hdr-enviada{     background:#e8edff !important; color:#1e3a8a !important; border-bottom:1px solid #cdd6ff !important; }
.hdr-revision{    background:#efe9ff !important; color:#4c1d95 !important; border-bottom:1px solid #dfd3ff !important; }
.hdr-recepcion-completa{ background:#d1fae5 !important; color:#065f46 !important; border-bottom:1px solid #a7f3d0 !important; }
.hdr-recepcion-parcial{  background:#cffafe !important; color:#155e75 !important; border-bottom:1px solid #a5f3fc !important; }
.hdr-otro{        background:#f1f5f9 !important; color:#334155 !important; border-bottom:1px solid #e2e8f0 !important; }

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

/* Ajustes compactos en xs */
@media (max-width: 420px){
  .card-header .small{ font-size: .8rem; }
}
</style>
