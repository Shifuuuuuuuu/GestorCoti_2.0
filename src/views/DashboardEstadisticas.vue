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

              <div class="col-12 col-md-3" v-else-if="segmento==='taller'">
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
              <div class="card-body chart-fixed-h"><canvas ref="topCreadoresCanvas"></canvas></div>
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
                  <canvas ref="topOCCanvas"></canvas>
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
                  <canvas ref="ocStatusByUserCanvas"></canvas>
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
              <div class="card-body chart-fixed-h"><canvas ref="distEstatusCanvas"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Distribución por Tipo de {{ tituloSegmento }}</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="distTipoSolpedCanvas"></canvas></div>
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
                    <div class="pie-box"><canvas ref="ocTipoSolpedCanvas"></canvas></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xxl-6">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Top aprobadores (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="topAprobadoresCanvas"></canvas></div>
            </div>
          </div>

          <div class="col-12 col-xxl-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">SOLPED pendientes por cotizadores (mes)</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="pendMesCanvas"></canvas></div>
            </div>
          </div>


          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">Gasto por Contrato / CC</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="gastoContratoCanvas"></canvas></div>
            </div>
          </div>

          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header"><div class="fw-medium">OC por Contrato / CC</div></div>
              <div class="card-body chart-fixed-h"><canvas ref="conteoContratoCanvas"></canvas></div>
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
                <canvas ref="vsEditorsCanvas"></canvas>
              </div>
            </div>
          </div>
                  <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <div class="fw-medium">Promedio de cierre de SOLPED por cotizador</div>
              </div>

              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-dark-subtle text-dark-emphasis">
                  {{ cotizadorLeadPayload.rows.length }} cotizadores
                </span>

                <span
                  v-if="isAdmin && cotizadorLeadPayload.missingDates?.length"
                  class="badge text-bg-warning"
                >
                  {{ cotizadorLeadPayload.missingDates.length }} con fechas faltantes
                </span>
              </div>
            </div>

            <div class="card-body">
              <div class="row g-2 align-items-end mb-3">
                <div class="col-12 col-md-3 col-xl-2">
                  <label class="form-label mb-1">Tipo filtro fecha</label>
                  <select
                    class="form-select form-select-sm"
                    v-model="cotizadorLeadFiltroModoDraft"
                    :disabled="isLoadingCotizadorLead"
                  >
                    <option value="mes">Mes</option>
                    <option value="anio">Año</option>
                    <option value="dia">Día</option>
                  </select>
                </div>

                <div class="col-12 col-md-3 col-xl-2" v-if="cotizadorLeadFiltroModoDraft === 'mes'">
                  <label class="form-label mb-1">Mes</label>
                  <input
                    type="month"
                    class="form-control form-control-sm"
                    v-model="cotizadorLeadFiltroMesDraft"
                    :disabled="isLoadingCotizadorLead"
                  />
                </div>

                <div class="col-12 col-md-3 col-xl-2" v-if="cotizadorLeadFiltroModoDraft === 'anio'">
                  <label class="form-label mb-1">Año</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    class="form-control form-control-sm"
                    v-model="cotizadorLeadFiltroAnioDraft"
                    :disabled="isLoadingCotizadorLead"
                  />
                </div>

                <div class="col-12 col-md-3 col-xl-2" v-if="cotizadorLeadFiltroModoDraft === 'dia'">
                  <label class="form-label mb-1">Día</label>
                  <input
                    type="date"
                    class="form-control form-control-sm"
                    v-model="cotizadorLeadFiltroDiaDraft"
                    :disabled="isLoadingCotizadorLead"
                  />
                </div>

                <div class="col-12 col-md-3 col-xl-2">
                  <label class="form-label mb-1">Tipo SOLPED</label>
                  <select
                    class="form-select form-select-sm"
                    v-model="cotizadorLeadFiltroTipoSolpedDraft"
                    :disabled="isLoadingCotizadorLead"
                  >
                    <option value="">Todos</option>
                    <option
                      v-for="opt in tipoSolpedOptions"
                      :key="'lead-tipo-' + opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>
                </div>

                <div class="col-12 col-md-3 col-xl-2">
                  <button
                    class="btn btn-outline-secondary btn-sm w-100"
                    @click="limpiarFiltrosCotizadorLead"
                    :disabled="isLoadingCotizadorLead"
                  >
                    Limpiar filtros
                  </button>
                </div>

                <div class="col-12 col-md-3 col-xl-2">
                  <button
                    class="btn btn-outline-primary btn-sm w-100"
                    @click="refrescarCotizadorLeadCard"
                    :disabled="isLoadingCotizadorLead"
                  >
                    <span
                      v-if="isLoadingCotizadorLead"
                      class="spinner-border spinner-border-sm me-1"
                      aria-hidden="true"
                    ></span>
                    <i v-else class="bi bi-arrow-clockwise me-1"></i>
                    Refrescar
                  </button>
                </div>
              </div>

              <div class="chart-fixed-h mb-3" style="min-height: 340px;">
                <canvas ref="cotizadorLeadCanvas"></canvas>
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0 table-sticky">
                  <thead class="table-light">
                    <tr>
                      <th style="min-width: 220px;">Cotizador</th>
                      <th class="text-end">Prom. ponderado</th>
                      <th class="text-end">Completadas</th>
                      <th class="text-end">En proceso</th>
                      <th class="text-end">Total</th>
                      <th style="width: 110px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="row in cotizadorLeadPayload.rows" :key="row.cotizador">
                      <tr>
                        <td class="fw-medium">{{ row.cotizador }}</td>
                        <td class="text-end fw-semibold">{{ row.promedioDiasPonderado.toFixed(1) }} d</td>
                        <td class="text-end">{{ row.completadas }}</td>
                        <td class="text-end">{{ row.enProceso }}</td>
                        <td class="text-end">{{ row.total }}</td>
                        <td class="text-end">
                          <button
                            class="btn btn-sm btn-outline-primary"
                            @click="toggleCotizadorDetalle(row.cotizador)"
                          >
                            {{ cotizadorExpandido[row.cotizador] ? 'Ocultar' : 'Ver detalle' }}
                          </button>
                        </td>
                      </tr>

                      <tr v-if="cotizadorExpandido[row.cotizador]">
                        <td colspan="99" class="bg-light">
                          <div class="cotizador-detalle-card">
                            <div class="row g-2 align-items-end mb-3">
                              <div class="col-12 col-md-4">
                                <label class="form-label form-label-sm mb-1">Filtrar por estatus</label>
                                <select
                                  class="form-select form-select-sm"
                                  :value="getCotizadorFiltroEstado(row.cotizador)"
                                  @change="setCotizadorFiltroEstado(row.cotizador, $event.target.value)"
                                >
                                  <option value="">Todos</option>
                                  <option
                                    v-for="st in getCotizadorDetalleEstados(row)"
                                    :key="`${row.cotizador}-st-${st}`"
                                    :value="st"
                                  >
                                    {{ st }}
                                  </option>
                                </select>
                              </div>

                              <div class="col-12 col-md-3">
                                <label class="form-label form-label-sm mb-1">Mostrar</label>
                                <select
                                  class="form-select form-select-sm"
                                  :value="getCotizadorPageSize(row.cotizador)"
                                  @change="setCotizadorPageSize(row.cotizador, Number($event.target.value))"
                                >
                                  <option :value="10">10</option>
                                  <option :value="20">20</option>
                                  <option :value="30">30</option>
                                  <option :value="40">40</option>
                                  <option :value="50">50</option>
                                </select>
                              </div>

                              <div class="col-12 col-md-5">
                                <div class="small text-muted text-md-end">
                                  Mostrando
                                  <strong>{{ getCotizadorDetallePaginado(row).length }}</strong>
                                  de
                                  <strong>{{ getCotizadorDetalleFiltrado(row).length }}</strong>
                                  registros
                                </div>
                              </div>
                            </div>

                            <div
                              class="table-responsive cotizador-detalle-scroll"
                              :class="{ 'cotizador-detalle-scroll-activo': getCotizadorDetalleFiltrado(row).length > 50 }"
                            >
                              <table class="table table-sm mb-0">
                                <thead>
                                  <tr>
                                    <th>N° SOLPED</th>
                                    <th>Nombre</th>
                                    <th>Estatus</th>
                                    <th class="text-end">Días</th>
                                    <th class="text-end">Cant. Ítems</th>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr
                                    v-for="d in getCotizadorDetallePaginado(row)"
                                    :key="`${row.cotizador}-${d.origen}-${d.id}-${d.numero_solpe}`"
                                  >
                                    <td>{{ d.numero_solpe || '—' }}</td>
                                    <td>{{ d.nombre_solped }}</td>
                                    <td>{{ d.estatus }}</td>
                                    <td class="text-end fw-semibold">{{ d.dias.toFixed(1) }}</td>
                                    <td class="text-end">{{ d.peso }}</td>
                                    <td>{{ fmtFechaSolo(d.fechaInicio) }}</td>
                                    <td>{{ d.enCurso ? 'En curso' : fmtFechaSolo(d.fechaFin) }}</td>
                                  </tr>

                                  <tr v-if="!getCotizadorDetalleFiltrado(row).length">
                                    <td colspan="99" class="text-center text-muted py-3">Sin detalle.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div
                              v-if="getCotizadorDetalleFiltrado(row).length"
                              class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3"
                            >
                              <div class="small text-muted">
                                Página {{ getCotizadorPagina(row.cotizador) }} de {{ getCotizadorDetalleTotalPages(row) }}
                              </div>

                              <div class="btn-group btn-group-sm">
                                <button
                                  class="btn btn-outline-secondary"
                                  :disabled="getCotizadorPagina(row.cotizador) <= 1"
                                  @click="setCotizadorPagina(row.cotizador, getCotizadorPagina(row.cotizador) - 1)"
                                >
                                  Anterior
                                </button>

                                <button
                                  class="btn btn-outline-secondary"
                                  :disabled="getCotizadorPagina(row.cotizador) >= getCotizadorDetalleTotalPages(row)"
                                  @click="setCotizadorPagina(row.cotizador, getCotizadorPagina(row.cotizador) + 1)"
                                >
                                  Siguiente
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>

                    <tr v-if="!cotizadorLeadPayload.rows.length">
                      <td colspan="99" class="text-center text-muted py-3">
                        Sin datos para cotizadores con los filtros actuales.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="isAdmin" class="mt-4">
                <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                  <div class="fw-medium">SOLPED con fecha faltante</div>
                  <span class="badge text-bg-warning">
                    {{ cotizadorLeadPayload.missingDates?.length || 0 }} registros
                  </span>
                </div>

                <div class="table-responsive" v-if="cotizadorLeadPayload.missingDates?.length">
                  <table class="table table-sm align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>N° SOLPED</th>
                        <th>Nombre</th>
                        <th>Cotizador</th>
                        <th>Origen</th>
                        <th>Estatus</th>
                        <th>Falta</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="m in cotizadorLeadPayload.missingDates"
                        :key="`missing-${m.origen}-${m.id}-${m.numero_solpe}`"
                      >
                        <td>{{ m.numero_solpe || '—' }}</td>
                        <td>{{ m.nombre_solped || '—' }}</td>
                        <td>{{ m.cotizador || '—' }}</td>
                        <td>{{ m.origen }}</td>
                        <td>{{ m.estatus || '—' }}</td>
                        <td>
                          <span class="badge text-bg-danger">{{ m.missingType }}</span>
                        </td>
                        <td>{{ fmtFechaSolo(m.fechaInicio) }}</td>
                        <td>{{ m.enCurso ? 'En curso' : fmtFechaSolo(m.fechaFin) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="alert alert-light border mb-0">
                  No hay SOLPED con fecha de inicio/fin faltante para los filtros actuales.
                </div>
              </div>
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
import { onMounted, onBeforeUnmount, ref, computed, watch, nextTick } from "vue";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/stores/firebase";
import Chart from "chart.js/auto";
const cotizadorLeadPayload = ref({
  labels: [],
  dataInicio: [],
  dataFin: [],
  rows: [],
  missingDates: [],
});

const cotizadorExpandido = ref({});
const cotizadorDetalleFiltros = ref({});
const cotizadorDetallePaginacion = ref({});
const cotizadorDetallePageSize = ref({});

const OC_ESTATUS_CANON = [
  "Aprobado",
  "Preaprobado",
  "Pendiente de Aprobación",
  "Revisión Guillermo",
  "Enviada a proveedor",
  "Rechazado",
];
const isAdmin = computed(() => {
  return ["admin", "Admin", "administrador"].includes(localStorage.getItem("role") || "");
});


const cotizadorLeadFiltroModo = ref("mes");
const cotizadorLeadFiltroCampo = ref("inicio");
const cotizadorLeadFiltroMes = ref(defMesActual());
const cotizadorLeadFiltroAnio = ref(String(new Date().getFullYear()));
const cotizadorLeadFiltroDia = ref(new Date().toISOString().slice(0, 10));
const cotizadorLeadSoloCompletadas = ref(false);
const cotizadorLeadFiltroTipoSolped = ref("");

const cotizadorLeadFiltroModoDraft = ref(cotizadorLeadFiltroModo.value);
const cotizadorLeadFiltroMesDraft = ref(cotizadorLeadFiltroMes.value);
const cotizadorLeadFiltroAnioDraft = ref(cotizadorLeadFiltroAnio.value);
const cotizadorLeadFiltroDiaDraft = ref(cotizadorLeadFiltroDia.value);
const cotizadorLeadFiltroTipoSolpedDraft = ref(cotizadorLeadFiltroTipoSolped.value);

function aplicarFiltrosCotizadorLead() {
  cotizadorLeadFiltroModo.value = cotizadorLeadFiltroModoDraft.value || "mes";
  cotizadorLeadFiltroMes.value = cotizadorLeadFiltroMesDraft.value || defMesActual();
  cotizadorLeadFiltroAnio.value = String(
    cotizadorLeadFiltroAnioDraft.value || new Date().getFullYear()
  );
  cotizadorLeadFiltroDia.value =
    cotizadorLeadFiltroDiaDraft.value || new Date().toISOString().slice(0, 10);
  cotizadorLeadFiltroTipoSolped.value = cotizadorLeadFiltroTipoSolpedDraft.value || "";
}

function limpiarFiltrosCotizadorLead() {
  cotizadorLeadFiltroModoDraft.value = "mes";
  cotizadorLeadFiltroMesDraft.value = defMesActual();
  cotizadorLeadFiltroAnioDraft.value = String(new Date().getFullYear());
  cotizadorLeadFiltroDiaDraft.value = new Date().toISOString().slice(0, 10);
  cotizadorLeadFiltroTipoSolpedDraft.value = "";
}
function rangoDeAnio(yyyy) {
  const y = Number(yyyy);
  return {
    start: new Date(y, 0, 1, 0, 0, 0, 0),
    end: new Date(y + 1, 0, 1, 0, 0, 0, 0),
  };
}

function rangoDeDia(yyyyMMdd) {
  const d = normalizarFecha(yyyyMMdd);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
    end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0),
  };
}

function getCotizadorLeadDateRange() {
  if (cotizadorLeadFiltroModo.value === "anio") {
    return rangoDeAnio(cotizadorLeadFiltroAnio.value);
  }

  if (cotizadorLeadFiltroModo.value === "dia") {
    return rangoDeDia(cotizadorLeadFiltroDia.value);
  }

  return rangoDeMes(cotizadorLeadFiltroMes.value);
}

function fechaValida(d) {
  return d instanceof Date && !isNaN(d.getTime()) && d.getTime() > 0;
}
const isLoading = ref(false);
const lastError = ref("");
const isLoadingCotizadorLead = ref(false);
const cotizadorLeadBaseDocs = ref({
  solEmpresa: [],
  solTaller: [],
});
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
  debounceTimer = setTimeout(() => {
    cargarTodo(false);
  }, 350);
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

const topHoy = ref([]);

const ocTipoSolpedAggPayload = ref({ labels: [], counts: [], montos: [], totalCount: 0, totalMonto: 0 });
const ocStatusByUserPayload = ref({ users: [], rows: [], datasets: [] });

const editorDirigidoASelect = ref(localStorage.getItem("xt_dash_editor_dirigidoA") || "");
watch(editorDirigidoASelect, (v) => {
  try { localStorage.setItem("xt_dash_editor_dirigidoA", v || ""); } catch(e) {console.log(e)}
});

const topAprobadoresRows = ref([]);
const topCreadoresRows = ref([]);
const gastoContratoRows = ref([]);
const conteoContratoRows = ref([]);

const editorContratosAgg = ref({
  editors: [],
  topAll: [],
  perEditorTop: {},
  totals: { totalSolpes: 0, uniqueContratos: 0 },
});


function fmtFechaSolo(v) {
  const d = normalizarFecha(v);
  if (!(d instanceof Date) || isNaN(d.getTime()) || d.getTime() === 0) return "—";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function getCotizadorFiltroEstado(nombre) {
  return cotizadorDetalleFiltros.value[nombre] || "";
}

function setCotizadorFiltroEstado(nombre, value) {
  cotizadorDetalleFiltros.value[nombre] = value || "";
  cotizadorDetallePaginacion.value[nombre] = 1;
}

function getCotizadorPageSize(nombre) {
  return Number(cotizadorDetallePageSize.value[nombre] || 10);
}

function setCotizadorPageSize(nombre, value) {
  cotizadorDetallePageSize.value[nombre] = Number(value || 10);
  cotizadorDetallePaginacion.value[nombre] = 1;
}

function getCotizadorPagina(nombre) {
  return Number(cotizadorDetallePaginacion.value[nombre] || 1);
}

function setCotizadorPagina(nombre, page) {
  cotizadorDetallePaginacion.value[nombre] = Math.max(1, Number(page || 1));
}

function getCotizadorDetalleEstados(row) {
  const set = new Set(
    (row?.detalle || [])
      .map(d => String(d.estatus || "").trim())
      .filter(Boolean)
  );
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

function getCotizadorDetalleFiltrado(row) {
  const estado = getCotizadorFiltroEstado(row.cotizador);
  let arr = [...(row?.detalle || [])];

  if (estado) {
    arr = arr.filter(d => String(d.estatus || "").trim() === estado);
  }

  return arr;
}

function getCotizadorDetalleTotalPages(row) {
  const total = getCotizadorDetalleFiltrado(row).length;
  const size = getCotizadorPageSize(row.cotizador);
  return Math.max(1, Math.ceil(total / size));
}

function getCotizadorDetallePaginado(row) {
  const arr = getCotizadorDetalleFiltrado(row);
  const size = getCotizadorPageSize(row.cotizador);
  const totalPages = Math.max(1, Math.ceil(arr.length / size));

  let page = getCotizadorPagina(row.cotizador);
  if (page > totalPages) {
    page = totalPages;
    cotizadorDetallePaginacion.value[row.cotizador] = page;
  }

  const start = (page - 1) * size;
  const end = start + size;

  return arr.slice(start, end);
}

function toggleCotizadorDetalle(nombre) {
  cotizadorExpandido.value[nombre] = !cotizadorExpandido.value[nombre];

  if (cotizadorExpandido.value[nombre]) {
    if (!cotizadorDetallePaginacion.value[nombre]) cotizadorDetallePaginacion.value[nombre] = 1;
    if (!cotizadorDetallePageSize.value[nombre]) cotizadorDetallePageSize.value[nombre] = 10;
    if (!(nombre in cotizadorDetalleFiltros.value)) cotizadorDetalleFiltros.value[nombre] = "";
  }
}

let _lastPayloadKey = "";
let _lastPayloadJSON = "";

const fechaHoyLegible = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
});

onMounted(async () => { await cargarTodo(); });
onBeforeUnmount(() => { destroyAll();  });

watch(
  [
    segmento, filtroMes, filtroEstatusOC, filtroContratoSel, filtroCentroCostoSel,
    filtroEstatusSolped, filtroTipoSolped, filtroMonedaOC, filtroResponsableOC, filtroEmpresa
  ],
  () => { scheduleReload(); }
);

function onFiltroChange() {
  scheduleReload();
}
function refrescar() {
  const key = cacheKey();
  const dKey = datasetKey();

  try { sessionStorage.removeItem(key); } catch(e) {console.log(e)}
  memCache.delete(dKey);

  cargarTodo(true);
}

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
  editorDirigidoASelect.value = "";
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

const memCache = new Map();

function getMemCache(key) {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL_MS) {
    memCache.delete(key);
    return null;
  }
  return hit.payload;
}

function setMemCache(key, payload) {
  memCache.set(key, {
    t: Date.now(),
    payload,
  });
}

function cacheKey() {
  return [
    "dashV15",
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
    filtroEstatusOC.value || "_",
  ].join("|");
}

function datasetKey() {
  return [
    "dashDatasetV2",
    segmento.value,
    filtroMes.value || "_",
    empresaSegmento.value || "_",
    filtroEmpresa.value || "_",
    filtroContratoSel.value || "_",
    filtroCentroCostoSel.value || "_",
  ].join("|");
}
function mapDocs(snap) {
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
function getMonthRangeStrings(yyyymm) {
  const safe = yyyymm || defMesActual();
  const y = Number(safe.slice(0, 4));
  const m = Number(safe.slice(5));
  const d = new Date(y, m, 1);

  return {
    startStr: `${safe}-01`,
    endStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
  };
}

function filtrarBaseCotizadorLeadDocs(solEmpresaFuenteLead = [], solTallerFuenteLead = []) {
  const solEmpresaFiltradasLead = (solEmpresaFuenteLead || []).filter((s) => {
    if (filtroEmpresa.value) {
      const emp = String(s.empresa || s.empresas || "");
      if (
        isExactEmpresa.value
          ? emp !== filtroEmpresa.value
          : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))
      ) {
        return false;
      }
    }

    if (
      filtroEstatusSolped.value &&
      _normTxt(s.estatus || s.estado || "") !== _normTxt(filtroEstatusSolped.value)
    ) {
      return false;
    }

    if (
      filtroTipoSolped.value &&
      _normTxt(s.tipo_solped || "") !== _normTxt(filtroTipoSolped.value)
    ) {
      return false;
    }

    if (
      filtroContratoSel.value &&
      String(s.numero_contrato || s.numeroContrato || "") !== filtroContratoSel.value
    ) {
      return false;
    }

    return true;
  });

  const solTallerFiltradasLead = (solTallerFuenteLead || []).filter((s) => {
    if (
      filtroEstatusSolped.value &&
      _normTxt(s.estatus || s.estado || "") !== _normTxt(filtroEstatusSolped.value)
    ) {
      return false;
    }

    if (
      filtroTipoSolped.value &&
      _normTxt(s.tipo_solped || "") !== _normTxt(filtroTipoSolped.value)
    ) {
      return false;
    }

    if (
      filtroCentroCostoSel.value &&
      String(s.centro_costo || s.centroCosto || "") !== filtroCentroCostoSel.value
    ) {
      return false;
    }

    return true;
  });

  return {
    solEmpresaFiltradasLead,
    solTallerFiltradasLead,
  };
}

async function cargarDocsBaseCotizadorLead() {
  const usarMes = cotizadorLeadFiltroModo.value === "mes";
  let solEmpresaFuenteLead = [];
  let solTallerFuenteLead = [];

  if (segmento.value === "empresa" || segmento.value === "general") {
    if (usarMes) {
      const { startStr, endStr } = getMonthRangeStrings(cotizadorLeadFiltroMes.value);

      const snap = await getDocs(
        query(
          collection(db, "solpes"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        )
      );

      solEmpresaFuenteLead = mapDocs(snap);
    } else {
      const snap = await getDocs(
        query(collection(db, "solpes"), orderBy("createdAt", "desc"), limit(1200))
      );

      solEmpresaFuenteLead = mapDocs(snap);
    }
  }

  if (segmento.value === "taller" || segmento.value === "general") {
    if (usarMes) {
      const { startStr, endStr } = getMonthRangeStrings(cotizadorLeadFiltroMes.value);

      const snap = await getDocs(
        query(
          collection(db, "solped_taller"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        )
      );

      solTallerFuenteLead = mapDocs(snap);
    } else {
      const snap = await getDocs(
        query(collection(db, "solped_taller"), orderBy("creado_en", "desc"), limit(1200))
      );

      solTallerFuenteLead = mapDocs(snap);
    }
  }

  return {
    solEmpresaFuenteLead,
    solTallerFuenteLead,
  };
}

async function refrescarCotizadorLeadCard() {
  isLoadingCotizadorLead.value = true;

  try {
    aplicarFiltrosCotizadorLead();

    const { solEmpresaFuenteLead, solTallerFuenteLead } =
      await cargarDocsBaseCotizadorLead();

    const { solEmpresaFiltradasLead, solTallerFiltradasLead } =
      filtrarBaseCotizadorLeadDocs(solEmpresaFuenteLead, solTallerFuenteLead);

    cotizadorLeadBaseDocs.value = {
      solEmpresa: solEmpresaFiltradasLead || [],
      solTaller: solTallerFiltradasLead || [],
    };

    recalcularCotizadorLeadSolo();
  } catch (err) {
    console.error(err);
    lastError.value =
      err && err.message
        ? err.message
        : "No se pudo refrescar la card de cotizadores.";
    isLoadingCotizadorLead.value = false;
  }
}
function needsWideData() {
  return (
    segmento.value === "general" ||
    cotizadorLeadFiltroModo.value === "anio" ||
    cotizadorLeadFiltroModo.value === "dia" ||
    cotizadorLeadFiltroCampo.value === "fin" ||
    cotizadorLeadSoloCompletadas.value
  );
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

function canonOcStatus(raw) {
  const n = _normTxt(raw || "");
  if (!n) return "Pendiente de Aprobación";

  if (n.includes("aprobado") && !n.includes("pre")) return "Aprobado";
  if (n.includes("pre") && n.includes("aprob")) return "Preaprobado";
  if (n.includes("prepaprob")) return "Preaprobado";
  if (n.includes("pend")) return "Pendiente de Aprobación";
  if (n.includes("revision guillermo") || (n.includes("revision") && n.includes("guillermo")) || (n.includes("revisión") && n.includes("guillermo"))) {
    return "Revisión Guillermo";
  }
  if (n.includes("proveedor")) return "Enviada a proveedor";
  if (n.includes("rech")) return "Rechazado";
  if (n.includes("aprob")) return "Aprobado";
  return "Pendiente de Aprobación";
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

function solIsCompletedLike(sol) {
  const canon = canonSolpedStatus(sol?.estatus || sol?.estado || "");
  const n = _normTxt(canon);

  if (!n) return false;
  if (n === "completado") return true;

  if ((n.includes("cotizado") || n.includes("cotizando")) && (n.includes("parcial") || n.includes("complet"))) {
    return true;
  }

  return false;
}

function canonSolpedStatus(raw) {
  const txt = String(raw || "").trim();
  const n = _normTxt(txt);

  if (n.includes("cotizando") && n.includes("parcial")) return "Cotizado Parcial";
  if (n.includes("cotizando") && n.includes("complet")) return "Cotizado Completado";

  if (n.includes("cotizado") && n.includes("parcial")) return "Cotizado Parcial";
  if (n.includes("cotizado") && n.includes("complet")) return "Cotizado Completado";

  return txt;
}
function esCotizadoCompletado(raw) {
  const n = _normTxt(raw || "");

  return [
    _normTxt("Cotizado Completado"),
    _normTxt("Completado"),
    _normTxt("Pedido en Casa matriz"),
    _normTxt("Parcial, Pedido en Casa matriz"),
  ].includes(n);
}
function esSolpedRechazada(raw) {
  const n = _normTxt(raw || "");
  return n.includes("rechaz");
}

function fechaInicioSolped(sol, origen = "empresa") {
  if (origen === "taller") {
    if (sol?.creado_en) return normalizarFecha(sol.creado_en);
    if (sol?.fecha) return normalizarFecha(sol.fecha);
    if (sol?.createdAt) return normalizarFecha(sol.createdAt);
    if (sol?.fechaSubida) return normalizarFecha(sol.fechaSubida);
    return new Date(0);
  }

  if (sol?.createdAt) return normalizarFecha(sol.createdAt);
  if (sol?.creado_en) return normalizarFecha(sol.creado_en);
  if (sol?.fecha) return normalizarFecha(sol.fecha);
  if (sol?.fechaSubida) return normalizarFecha(sol.fechaSubida);
  return new Date(0);
}

function fechaFinSolped(sol) {
  if (esCotizadoCompletado(sol.estatus || sol.estado || "")) {
    return normalizarFecha(sol.updated_at || sol.updatedAt || sol.fechaActualizacion);
  }
  return null;
}

function diasEntreFechas(inicio, fin) {
  const ms = fin - inicio;
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function pesoSolped(sol) {
  const items = Array.isArray(sol.items) ? sol.items : [];
  return Math.max(1, items.length);
}

function numeroSolpedOf(sol) {
  return Number(sol.numero_solpe || sol.numeroSolpe || sol.numero_solped || sol.numeroSolped || 0);
}

function nombreSolpedOf(sol) {
  return String(sol.nombre_solped || sol.nombre || sol.descripcion || "Sin nombre");
}

function cotizadoresDeSolped(sol, origen = "empresa") {
  if (origen === "taller") {
    const arr = Array.isArray(sol.cotizadores) ? sol.cotizadores : [];
    return arr.map(x => String(x || "").trim()).filter(Boolean);
  }

  const arr = Array.isArray(sol.dirigidoA) ? sol.dirigidoA : [];
  return arr.map(x => String(x || "").trim()).filter(Boolean);
}
function buildCotizadorLeadAgg(solEmpresa = [], solTaller = []) {
  const map = new Map();
  const ahora = new Date();
  const missingDates = [];

  const { start: filtroStart, end: filtroEnd } = getCotizadorLeadDateRange();

  const pushSol = (sol, origen) => {
    const estatusRaw = sol.estatus || sol.estado || "";
    if (esSolpedRechazada(estatusRaw)) return;

    const tipoSolpedActual = String(sol.tipo_solped || "").trim();
    if (
      cotizadorLeadFiltroTipoSolped.value &&
      _normTxt(tipoSolpedActual) !== _normTxt(cotizadorLeadFiltroTipoSolped.value)
    ) {
      return;
    }

    const cotizadores = cotizadoresDeSolped(sol, origen);
    if (!cotizadores.length) return;

    const completo = esCotizadoCompletado(estatusRaw);
    const inicio = fechaInicioSolped(sol, origen);
    const finReal = completo ? fechaFinSolped(sol) : null;

    const tieneInicio = fechaValida(inicio);
    const tieneFin = !completo || fechaValida(finReal);

    if (!tieneInicio || !tieneFin) {
      missingDates.push({
        id: sol.id || "",
        numero_solpe: numeroSolpedOf(sol),
        nombre_solped: nombreSolpedOf(sol),
        estatus: String(estatusRaw || "—"),
        origen,
        cotizador: cotizadores.join(", ") || "—",
        fechaInicio: tieneInicio ? inicio : null,
        fechaFin: tieneFin ? finReal : null,
        enCurso: !completo,
        missingType: !tieneInicio && !tieneFin
          ? "Inicio y fin"
          : (!tieneInicio ? "Inicio" : "Fin"),
      });
    }

    if (!tieneInicio) return;
    if (completo && !tieneFin) return;

    const fechaFiltro = cotizadorLeadFiltroCampo.value === "fin"
      ? (completo ? finReal : null)
      : inicio;

    if (!fechaValida(fechaFiltro)) return;
    if (!(fechaFiltro >= filtroStart && fechaFiltro < filtroEnd)) return;

    if (cotizadorLeadSoloCompletadas.value && !completo) return;

    const finCalculo = completo ? finReal : ahora;
    const dias = diasEntreFechas(inicio, finCalculo);
    const peso = pesoSolped(sol);

    const detalle = {
      id: sol.id || "",
      numero_solpe: numeroSolpedOf(sol),
      nombre_solped: nombreSolpedOf(sol),
      estatus: String(estatusRaw || "—"),
      origen,
      dias,
      peso,
      fechaInicio: inicio,
      fechaFin: completo ? finReal : null,
      enCurso: !completo,
      empresa: sol.empresa || "",
      contrato: sol.numero_contrato || sol.centro_costo || "",
      itemsCount: Array.isArray(sol.items) ? sol.items.length : 0,
    };

    for (const cot of cotizadores) {
      if (!map.has(cot)) {
        map.set(cot, {
          cotizador: cot,
          totalPeso: 0,
          totalDiasXPeso: 0,
          totalDiasInicio: 0,
          totalDiasFin: 0,
          countInicio: 0,
          countFin: 0,
          completadas: 0,
          enProceso: 0,
          total: 0,
          detalle: [],
        });
      }

      const row = map.get(cot);
      row.totalPeso += peso;
      row.totalDiasXPeso += dias * peso;
      row.total += 1;
      row.totalDiasInicio += dias;
      row.countInicio += 1;

      if (completo) {
        row.completadas += 1;
        row.totalDiasFin += dias;
        row.countFin += 1;
      } else {
        row.enProceso += 1;
      }

      row.detalle.push(detalle);
    }
  };

  for (const sol of solEmpresa || []) pushSol(sol, "empresa");
  for (const sol of solTaller || []) pushSol(sol, "taller");

  const rows = [...map.values()]
    .map(r => ({
      ...r,
      promedioDiasPonderado: r.totalPeso ? (r.totalDiasXPeso / r.totalPeso) : 0,
      promedioInicio: r.countInicio ? (r.totalDiasInicio / r.countInicio) : 0,
      promedioFin: r.countFin ? (r.totalDiasFin / r.countFin) : 0,
      detalle: [...(r.detalle || [])].sort((a, b) => {
        const na = Number(a.numero_solpe || 0);
        const nb = Number(b.numero_solpe || 0);
        if (nb !== na) return nb - na;
        const fa = normalizarFecha(a.fechaInicio).getTime();
        const fb = normalizarFecha(b.fechaInicio).getTime();
        return fb - fa;
      }),
    }))
    .sort((a, b) => b.promedioDiasPonderado - a.promedioDiasPonderado);

  missingDates.sort((a, b) => {
    const na = Number(b.numero_solpe || 0) - Number(a.numero_solpe || 0);
    if (na !== 0) return na;
    return String(a.cotizador || "").localeCompare(String(b.cotizador || ""), "es");
  });

  return {
    labels: rows.map(r => r.cotizador),
    dataInicio: rows.map(r => Number(r.promedioInicio.toFixed(1))),
    dataFin: rows.map(r => Number(r.promedioFin.toFixed(1))),
    rows,
    missingDates,
  };
}
function recalcularCotizadorLeadSolo() {
  isLoadingCotizadorLead.value = true;

  try {
    const agg = buildCotizadorLeadAgg(
      cotizadorLeadBaseDocs.value.solEmpresa || [],
      cotizadorLeadBaseDocs.value.solTaller || []
    );

    cotizadorLeadPayload.value = {
      labels: agg.labels || [],
      dataInicio: agg.dataInicio || [],
      dataFin: agg.dataFin || [],
      rows: agg.rows || [],
      missingDates: agg.missingDates || [],
    };

    nextTick(() => {
      try {
      renderOrUpdateBarChart(chartCotizadorLead, cotizadorLeadCanvas, {
        labels: [...(cotizadorLeadPayload.value.labels || [])],
        datasets: [
          {
            label: "Prom. inicio",
            data: [...(cotizadorLeadPayload.value.dataInicio || [])],
            borderWidth: 1,
            maxBarThickness: 26,
          },
          {
            label: "Prom. fin",
            data: [...(cotizadorLeadPayload.value.dataFin || [])],
            borderWidth: 1,
            maxBarThickness: 26,
          },
        ],
      });
      } finally {
        isLoadingCotizadorLead.value = false;
      }
    });
  } catch (e) {
    console.warn("No se pudo recalcular la card de cotizador", e);
    isLoadingCotizadorLead.value = false;
  }
}
const CATALOG_TTL_MS = 12 * 60 * 60 * 1000;
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
    const sample = [];

    if (segmento.value === 'empresa') {
      const snap = await getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(900)));
      snap.forEach(d => sample.push(d.data() || {}));
      contratosOptions.value = uniqSorted(sample.map(x => x.numero_contrato || x.numeroContrato || ''));
      centroCostoOptions.value = uniqSorted(sample.map(x => x.nombre_centro_costo || x.centroCostoNombre || ''));
    } else if (segmento.value === 'taller') {
      const snap = await getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(900)));
      snap.forEach(d => sample.push(d.data() || {}));
      contratosOptions.value = [];
      centroCostoOptions.value = uniqSorted(sample.map(x => x.centro_costo || x.centroCosto || x.centroCostoNombre || ''));
    } else {
      const [a, b] = await Promise.allSettled([
        getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(500))),
        getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(500))),
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

function solDirigidoAList(sol) {
  const da = sol?.dirigidoA;
  if (Array.isArray(da)) return da.map(x => String(x || "").trim()).filter(Boolean);
  if (typeof da === "string") return da.split(/[,;|]/).map(v => v.trim()).filter(Boolean);
  return [];
}

function solContratoParts(sol) {
  const num = String(sol?.numero_contrato || sol?.numeroContrato || "").trim();
  const rawNombre = String(sol?.nombre_centro_costo || sol?.nombreCentroCosto || "").trim();

  let nombre = rawNombre;
  if (num && rawNombre) {
    const re = new RegExp(`^\\s*contrato\\s*${num}\\s*`, "i");
    nombre = rawNombre.replace(re, "").trim();
  }

  const key = (num || nombre || rawNombre || "—");
  return { key, num: num || "", nombre: (nombre || rawNombre || "") };
}

function _addContratoCount(map, parts) {
  const cur = map.get(parts.key) || { key: parts.key, num: parts.num, nombre: parts.nombre, count: 0 };
  cur.count += 1;
  if (!cur.num && parts.num) cur.num = parts.num;
  if (!cur.nombre && parts.nombre) cur.nombre = parts.nombre;
  map.set(parts.key, cur);
}

function _topRowsFromMap(map, take = 12) {
  const arr = [...map.values()].sort((a, b) => b.count - a.count).slice(0, take);
  const max = arr[0]?.count || 1;
  return arr.map(r => ({ ...r, pct: Math.round(100 * r.count / max) }));
}

function buildEditorContratosAgg(solList, editorsArr) {
  const editors = uniqSorted(editorsArr || []);
  const normToName = new Map(editors.map(n => [_normTxt(n), n]));

  const globalMap = new Map();
  const perEditor = new Map();
  editors.forEach(e => perEditor.set(e, new Map()));

  const seenSol = new Set();
  for (const sol of (solList || [])) {
    const daList = solDirigidoAList(sol);
    if (!daList.length) continue;

    const matchedEditors = [];
    for (const nm of daList) {
      const canon = normToName.get(_normTxt(nm));
      if (canon) matchedEditors.push(canon);
    }
    if (!matchedEditors.length) continue;

    const parts = solContratoParts(sol);

    const uid = sol.id || `${sol.numero_solpe || sol.numeroSolpe || ""}-${sol.fecha || ""}-${parts.key}`;
    if (!seenSol.has(uid)) {
      seenSol.add(uid);
      _addContratoCount(globalMap, parts);
    }

    const uniqueEditors = [...new Set(matchedEditors)];
    for (const ed of uniqueEditors) {
      const m = perEditor.get(ed) || new Map();
      _addContratoCount(m, parts);
      perEditor.set(ed, m);
    }
  }

  const topAll = _topRowsFromMap(globalMap, 12);
  const perEditorTop = {};
  for (const ed of editors) perEditorTop[ed] = _topRowsFromMap(perEditor.get(ed) || new Map(), 12);

  return {
    editors,
    topAll,
    perEditorTop,
    totals: { totalSolpes: seenSol.size, uniqueContratos: globalMap.size },
  };
}

const vsEditorsPayload = ref({ labels: [], aprobadas: [], subidas: [] });

const topCreadoresCanvas = ref(null);
const topOCCanvas = ref(null);
const gastoContratoCanvas = ref(null);
const conteoContratoCanvas = ref(null);
const distEstatusCanvas = ref(null);
const distTipoSolpedCanvas = ref(null);
const topAprobadoresCanvas = ref(null);
const pendMesCanvas = ref(null);
const vsEditorsCanvas = ref(null);
const ocTipoSolpedCanvas = ref(null);
const ocStatusByUserCanvas = ref(null);
const cotizadorLeadCanvas = ref(null);

const chartTopCreadores = ref(null);
const chartTopOC = ref(null);
const chartGastoContrato = ref(null);
const chartConteoContrato = ref(null);
const chartDistEstatus = ref(null);
const chartDistTipoSolped = ref(null);
const chartSerieGasto = ref(null);
const chartTopAprobadores = ref(null);
const chartPendMes = ref(null);
const chartPendAll = ref(null);
const chartVsEditors = ref(null);
const chartOcTipo = ref(null);
const chartOcTipoSolped = ref(null);
const chartOcStatusByUser = ref(null);
const chartDistMoneda = ref(null);
const chartCotizadorLead = ref(null);

async function cargarTodo(force = false) {
  isLoading.value = true;
  lastError.value = "";

  cargarCatalogosRapidos().catch(() => {});

  if (!force) {
    const hit = getCache();
    if (hit) {
      pintarDesdePayload(hit);
      isLoading.value = false;
      return;
    }
  }

  const dKey = datasetKey();
  const memHit = !force ? getMemCache(dKey) : null;

  const { start, end } = rangoDeMes(filtroMes.value);
  const startStr = `${filtroMes.value}-01`;
  const endStr = (() => {
    const y = Number(filtroMes.value.slice(0, 4));
    const m = Number(filtroMes.value.slice(5));
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  })();

  try {
    let solDocsMes = [];
    let solDocsMesTaller = [];
    let ocDocsMes = [];
    let ocDocsMesTaller = [];

    let solAllForPend = [];
    let solAllEmpresaWide = [];
    let solAllTallerWide = [];

    if (segmento.value === "empresa") {
      if (memHit?.empresa) {
        solDocsMes = memHit.empresa.solDocsMes || [];
        ocDocsMes = memHit.empresa.ocDocsMes || [];
        solAllForPend = memHit.empresa.solAllForPend || [];
        solAllEmpresaWide = memHit.empresa.solAllEmpresaWide || [];
      } else {
        const solQ = query(
          collection(db, "solpes"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        );

        const ocQ = query(
          collection(db, "ordenes_oc"),
          where("fechaSubida", ">=", start),
          where("fechaSubida", "<", end),
          orderBy("fechaSubida", "asc")
        );

        const promises = [
          getDocs(solQ),
          getDocs(ocQ),
          getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(600))),
        ];

        if (needsWideData()) {
          promises.push(
            getDocs(query(collection(db, "solpes"), orderBy("createdAt", "desc"), limit(1200)))
          );
        }

        const results = await Promise.allSettled(promises);

        solDocsMes = results[0].status === "fulfilled" ? mapDocs(results[0].value) : [];
        ocDocsMes = results[1].status === "fulfilled" ? mapDocs(results[1].value) : [];
        solAllForPend = results[2]?.status === "fulfilled" ? mapDocs(results[2].value) : [];
        solAllEmpresaWide = results[3]?.status === "fulfilled" ? mapDocs(results[3].value) : [];

        setMemCache(dKey, {
          empresa: {
            solDocsMes,
            ocDocsMes,
            solAllForPend,
            solAllEmpresaWide,
          },
        });
      }
    }

    if (segmento.value === "taller") {
      if (memHit?.taller) {
        solDocsMesTaller = memHit.taller.solDocsMesTaller || [];
        ocDocsMesTaller = memHit.taller.ocDocsMesTaller || [];
        solAllForPend = memHit.taller.solAllForPend || [];
        solAllTallerWide = memHit.taller.solAllTallerWide || [];
      } else {
        const solQ = query(
          collection(db, "solped_taller"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        );

        const ocQ = query(
          collection(db, "ordenes_oc_taller"),
          where("fechaSubida", ">=", start),
          where("fechaSubida", "<", end),
          orderBy("fechaSubida", "asc")
        );

        const promises = [
          getDocs(solQ),
          getDocs(ocQ),
          getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(600))),
        ];

        if (needsWideData()) {
          promises.push(
            getDocs(query(collection(db, "solped_taller"), orderBy("creado_en", "desc"), limit(1200)))
          );
        }

        const results = await Promise.allSettled(promises);

        solDocsMesTaller = results[0].status === "fulfilled" ? mapDocs(results[0].value) : [];
        ocDocsMesTaller = results[1].status === "fulfilled" ? mapDocs(results[1].value) : [];
        solAllForPend = results[2]?.status === "fulfilled" ? mapDocs(results[2].value) : [];
        solAllTallerWide = results[3]?.status === "fulfilled" ? mapDocs(results[3].value) : [];

        setMemCache(dKey, {
          taller: {
            solDocsMesTaller,
            ocDocsMesTaller,
            solAllForPend,
            solAllTallerWide,
          },
        });
      }
    }

    if (segmento.value === "general") {
      if (memHit?.general) {
        solDocsMes = memHit.general.solDocsMes || [];
        solDocsMesTaller = memHit.general.solDocsMesTaller || [];
        ocDocsMes = memHit.general.ocDocsMes || [];
        ocDocsMesTaller = memHit.general.ocDocsMesTaller || [];
        solAllForPend = memHit.general.solAllForPend || [];
        solAllEmpresaWide = memHit.general.solAllEmpresaWide || [];
        solAllTallerWide = memHit.general.solAllTallerWide || [];
      } else {
        const solEmpQ = query(
          collection(db, "solpes"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        );

        const solTalQ = query(
          collection(db, "solped_taller"),
          where("fecha", ">=", startStr),
          where("fecha", "<", endStr),
          orderBy("fecha", "asc")
        );

        const ocEmpQ = query(
          collection(db, "ordenes_oc"),
          where("fechaSubida", ">=", start),
          where("fechaSubida", "<", end),
          orderBy("fechaSubida", "asc")
        );

        const ocTalQ = query(
          collection(db, "ordenes_oc_taller"),
          where("fechaSubida", ">=", start),
          where("fechaSubida", "<", end),
          orderBy("fechaSubida", "asc")
        );

        const promises = [
          getDocs(solEmpQ),
          getDocs(solTalQ),
          getDocs(ocEmpQ),
          getDocs(ocTalQ),
          getDocs(query(collection(db, "solpes"), orderBy("fecha", "desc"), limit(400))),
          getDocs(query(collection(db, "solped_taller"), orderBy("fecha", "desc"), limit(400))),
        ];

        if (needsWideData()) {
          promises.push(
            getDocs(query(collection(db, "solpes"), orderBy("createdAt", "desc"), limit(800))),
            getDocs(query(collection(db, "solped_taller"), orderBy("creado_en", "desc"), limit(800)))
          );
        }

        const results = await Promise.allSettled(promises);

        solDocsMes = results[0].status === "fulfilled" ? mapDocs(results[0].value) : [];
        solDocsMesTaller = results[1].status === "fulfilled" ? mapDocs(results[1].value) : [];
        ocDocsMes = results[2].status === "fulfilled" ? mapDocs(results[2].value) : [];
        ocDocsMesTaller = results[3].status === "fulfilled" ? mapDocs(results[3].value) : [];

        const pendA = results[4]?.status === "fulfilled" ? mapDocs(results[4].value) : [];
        const pendB = results[5]?.status === "fulfilled" ? mapDocs(results[5].value) : [];
        solAllForPend = [...pendA, ...pendB];

        solAllEmpresaWide = results[6]?.status === "fulfilled" ? mapDocs(results[6].value) : [];
        solAllTallerWide = results[7]?.status === "fulfilled" ? mapDocs(results[7].value) : [];

        setMemCache(dKey, {
          general: {
            solDocsMes,
            solDocsMesTaller,
            ocDocsMes,
            ocDocsMesTaller,
            solAllForPend,
            solAllEmpresaWide,
            solAllTallerWide,
          },
        });
      }
    }

    const baseSolMes =
      segmento.value === "empresa"
        ? solDocsMes
        : segmento.value === "taller"
          ? solDocsMesTaller
          : [...solDocsMes, ...solDocsMesTaller];

    const baseOCMes =
      segmento.value === "empresa"
        ? ocDocsMes
        : segmento.value === "taller"
          ? ocDocsMesTaller
          : [...ocDocsMes, ...ocDocsMesTaller];

    monedaOptions.value = uniqSorted(
      baseOCMes.map((o) => (o.moneda || "CLP").toString().toUpperCase())
    );
    responsableOptions.value = uniqSorted(
      baseOCMes.map((o) => (o.responsable || "—").toString())
    );

    const solMes = baseSolMes.filter((x) => {
      const f = x.fechaSubida || x.creado_en || x.fecha || x.createdAt;
      if (!isInRange(f, start, end)) return false;

      if (segmento.value === "empresa" && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || "");
        if (
          isExactEmpresa.value
            ? emp !== filtroEmpresa.value
            : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))
        ) return false;
      }

      if (segmento.value === "empresa") {
        if (
          filtroContratoSel.value &&
          String(x.numero_contrato || x.numeroContrato || "") !== filtroContratoSel.value
        ) return false;
      } else if (segmento.value === "taller") {
        if (
          filtroCentroCostoSel.value &&
          String(x.centro_costo || x.centroCosto || x.centroCostoNombre || "") !== filtroCentroCostoSel.value
        ) return false;
      }

      if (
        filtroEstatusSolped.value &&
        _normTxt(x.estatus || x.estado || "") !== _normTxt(filtroEstatusSolped.value)
      ) return false;

      if (
        filtroTipoSolped.value &&
        _normTxt(x.tipo_solped || "") !== _normTxt(filtroTipoSolped.value)
      ) return false;

      return true;
    });

    const solpedFiltersActive =
      ((segmento.value === "empresa") && (!!filtroEmpresa.value || !!filtroContratoSel.value)) ||
      ((segmento.value === "taller") && !!filtroCentroCostoSel.value) ||
      !!filtroEstatusSolped.value ||
      !!filtroTipoSolped.value;

    const solIndexDocs = [
      ...baseSolMes,
      ...solAllEmpresaWide,
      ...solAllTallerWide,
    ];

    const solIndexAllByNumero = buildSolIndexByNumero(solIndexDocs);

    const ocFiltradas = baseOCMes.filter((x) => {
      const f = x.fechaSubida || x.fecha || x.creado_en;
      if (!isInRange(f, start, end)) return false;

      if (segmento.value === "empresa" && filtroEmpresa.value) {
        const emp = String(x.empresa || x.empresas || "");
        if (
          isExactEmpresa.value
            ? emp !== filtroEmpresa.value
            : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))
        ) return false;
      }

      const valContrato = (x.numero_contrato || x.numeroContrato || "").toString();
      const valCC = (
        x.nombre_centro_costo ||
        x.centroCostoNombre ||
        x.centro_costo ||
        x.centroCosto ||
        x.centroCostoTexto ||
        ""
      ).toString();

      if (segmento.value === "empresa") {
        if (filtroContratoSel.value && valContrato && valContrato !== filtroContratoSel.value) return false;
      } else if (segmento.value === "taller") {
        if (filtroCentroCostoSel.value && valCC && valCC !== filtroCentroCostoSel.value) return false;
      }

      if (filtroEstatusOC.value && _normTxt(x.estatus || "") !== _normTxt(filtroEstatusOC.value)) return false;
      if (filtroMonedaOC.value && (x.moneda || "CLP").toString().toUpperCase() !== filtroMonedaOC.value) return false;
      if (filtroResponsableOC.value && (x.responsable || "—").toString() !== filtroResponsableOC.value) return false;

      if (solpedFiltersActive) {
        const ns = ocSolpeNums(x);
        if (ns.length) {
          let ok = false;
          for (const n of ns) {
            const sol = solIndexAllByNumero.get(n);
            if (solMatchesSolpedFilters(sol)) {
              ok = true;
              break;
            }
          }
          if (!ok) return false;
        } else {
          if (filtroTipoSolped.value) {
            const t = (x.tipo_solped || x.tipoSolped || "").toString();
            if (!t || _normTxt(t) !== _normTxt(filtroTipoSolped.value)) return false;
          }
        }
      }

      return true;
    });

    kpis.value.creadasMes = solMes.length;
    kpis.value.completadasMes = solMes.filter(solIsCompletedLike).length;
    kpis.value.ocMes = ocFiltradas.length;

    const totalOC = ocFiltradas.reduce((acc, x) => acc + ocMonto(x), 0);
    kpis.value.gastoMes = totalOC;
    kpis.value.ticketProm = ocFiltradas.length ? Math.round(totalOC / ocFiltradas.length) : 0;

    const setSol = new Set(
      solMes
        .map((x) => Number(x.numero_solpe || x.numeroSolpe || x.numero_solped || x.numeroSolped))
        .filter(Boolean)
    );

    const setOcSol = new Set();
    for (const o of ocFiltradas) ocSolpeNums(o).forEach((n) => setOcSol.add(n));

    const match = [...setSol].filter((n) => setOcSol.has(n)).length;
    const conversionPct = setSol.size ? (100 * match / setSol.size) : 0;

    const toDays = (ms) => ms / (1000 * 60 * 60 * 24);
    const leadTimes = [];

    for (const o of ocFiltradas) {
      const fInicio = normalizarFecha(o.fechaSubida || o.fecha || o.creado_en);
      let fAprob = o.fechaAprobacion ? normalizarFecha(o.fechaAprobacion) : null;

      if (!fAprob && Array.isArray(o.historial)) {
        const ap = o.historial.find((h) => _normTxt(h.estatus || "") === "aprobado");
        if (ap?.fecha) fAprob = normalizarFecha(ap.fecha);
      }

      if (fInicio && fAprob && fAprob > fInicio) {
        leadTimes.push(toDays(fAprob - fInicio));
      }
    }

    const leadtimePromDias = leadTimes.length
      ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
      : 0;

    const rechazadas = ocFiltradas.filter((o) => _normTxt(o.estatus || "") === "rechazado").length;
    const rechazoPct = ocFiltradas.length ? (100 * rechazadas / ocFiltradas.length) : 0;

    let comentariosTallerMes = 0;
    if (segmento.value !== "empresa") {
      for (const s of solMes) {
        if (Array.isArray(s.comentarios)) comentariosTallerMes += s.comentarios.length;
      }
    }

    kpisExtra.value = { conversionPct, leadtimePromDias, rechazoPct, comentariosTallerMes };

    const contarPor = (arr, getKey) => {
      const m = new Map();
      for (const x of arr) {
        const k = (getKey(x) || "—").toString().trim();
        if (!k) continue;
        m.set(k, (m.get(k) || 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const contarValores = (list) => {
      const m = new Map();
      for (const k of list) m.set(k, (m.get(k) || 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const agruparSuma = (arr, getKey, getVal) => {
      const m = new Map();
      for (const x of arr) {
        const k = getKey(x);
        const v = Number(getVal(x) || 0);
        m.set(k, (m.get(k) || 0) + v);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const agruparConteo = (arr, getKey) => {
      const m = {};
      for (const x of arr) {
        const k = (getKey(x) || "—").toString();
        m[k] = (m[k] || 0) + 1;
      }
      return m;
    };

    const topCreadores = contarPor(solMes, (x) => {
      if (segmento.value === "empresa") return x.usuario || x.dirigidoA?.[0] || "—";
      return x.nombre_solicitante || x.usuario_sesion || x.usuario || x.dirigidoA?.[0] || "—";
    }).slice(0, 10);

    const mapCount = new Map();
    const mapSpend = new Map();

    for (const o of ocFiltradas) {
      const resp = (o.responsable || "—").toString();
      mapCount.set(resp, (mapCount.get(resp) || 0) + 1);
      mapSpend.set(resp, (mapSpend.get(resp) || 0) + ocMonto(o));
    }

    const topOCEntries = [...mapCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topOCLabels = topOCEntries.map(([k]) => k);
    const topOCValues = topOCEntries.map(([, v]) => v);
    const topOCSpends = topOCEntries.map(([k]) => mapSpend.get(k) || 0);

    const gastoContrato = agruparSuma(
      ocFiltradas,
      (x) =>
        (
          x.numero_contrato ||
          x.nombre_centro_costo ||
          x.centroCosto ||
          x.centroCostoNombre ||
          x.centro_costo ||
          x.centroCostoTexto ||
          "—"
        ).toString(),
      (x) => ocMonto(x)
    ).slice(0, 12);

    const conteoContrato = contarPor(
      ocFiltradas,
      (x) =>
        (
          x.numero_contrato ||
          x.nombre_centro_costo ||
          x.centroCosto ||
          x.centroCostoNombre ||
          x.centro_costo ||
          x.centroCostoTexto ||
          "—"
        ).toString()
    ).slice(0, 12);

    const distEstatus = agruparConteo(solMes, (x) => canonSolpedStatus(x.estatus || x.estado || "—"));
    const distTipoSolped = agruparConteo(solMes, (x) => (x.tipo_solped || "—").toString());

    const bucket = new Map();
    for (const o of ocFiltradas) {
      const fx = normalizarFecha(o.fechaSubida || o.fecha || o.creado_en);
      if (!fx) continue;
      const key = fx.toISOString().slice(0, 10);
      bucket.set(key, (bucket.get(key) || 0) + ocMonto(o));
    }

    const serieDiariaGasto = (startD, endD) => {
      const labels = [];
      const values = [];
      const d = new Date(startD);

      while (d < endD) {
        const k = d.toISOString().slice(0, 10);
        labels.push(k);
        values.push(bucket.get(k) || 0);
        d.setDate(d.getDate() + 1);
      }

      return { labels, values };
    };

    const serieGasto = serieDiariaGasto(start, end);

    const aprobEntries = [];
    for (const o of ocFiltradas) {
      if (Array.isArray(o.historial)) {
        o.historial.forEach((h) => {
          const es = _normTxt(h.estatus || "");
          if (es === "aprobado" || es === "preaprobado") aprobEntries.push(h.usuario || "—");
        });
      }
    }

    const topAprobadores = contarValores(aprobEntries).slice(0, 10);
    const distMoneda = agruparConteo(ocFiltradas, (x) => (x.moneda || "CLP").toString().toUpperCase());

    const hoyList = solMes.filter((x) => esHoy(x.fecha || x.creado_en || x.fechaSubida));
    const topHoyArr = contarPor(
      hoyList.map((x) => ({ nombre: x.usuario || x.nombre_solicitante || x.usuario_sesion || x.dirigidoA?.[0] || "—" })),
      (r) => (r && r.nombre) || "—"
    ).slice(0, 10);

    topHoy.value = topHoyArr.map(([nombre, cantidad]) => ({ nombre, cantidad }));

    const pendientesPorDirigidoA = (solList, allowedStatuses = ["pendiente"]) => {
      const allow = new Set(allowedStatuses.map(_normTxt));
      const soloPermitidos = solList.filter((s) => allow.has(_normTxt(s.estatus || s.estado || "")));
      const m = new Map();

      const add = (name) => {
        const k = String(name || "—").trim();
        if (!k) return;
        m.set(k, (m.get(k) || 0) + 1);
      };

      for (const s of soloPermitidos) {
        const da = s.dirigidoA;
        if (Array.isArray(da)) da.forEach(add);
        else if (typeof da === "string") {
          const parts = da.split(/[,;|]/).map((v) => v.trim()).filter(Boolean);
          if (parts.length) parts.forEach(add);
          else add(da);
        }
      }

      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const pendEntries = pendientesPorDirigidoA(solMes, ["pendiente"]).slice(0, 15);
    const pendLabels = pendEntries.map(([k]) => k);
    const pendValues = pendEntries.map(([, v]) => v);

    const pendAllEntries = pendientesPorDirigidoA(solAllForPend, ["pendiente"]).slice(0, 15);
    const pendAllLabels = pendAllEntries.map(([k]) => k);
    const pendAllValues = pendAllEntries.map(([, v]) => v);

    const aggByKey = (ocs, getKey) => {
      const mCount = new Map();
      const mMonto = new Map();

      for (const o of ocs) {
        const k = String(getKey(o) || "—").trim() || "—";
        mCount.set(k, (mCount.get(k) || 0) + 1);
        mMonto.set(k, (mMonto.get(k) || 0) + ocMonto(o));
      }

      const labels = [...mCount.keys()].sort((a, b) => a.localeCompare(b, "es"));
      const counts = labels.map((l) => mCount.get(l) || 0);
      const montos = labels.map((l) => mMonto.get(l) || 0);

      return {
        labels,
        counts,
        montos,
        totalCount: ocs.length,
        totalMonto: montos.reduce((a, b) => a + b, 0),
      };
    };

    const ocTipoAgg = aggByKey(ocFiltradas, ocTipoOC);
    const ocTipoSolpedAgg = aggByKey(ocFiltradas, (o) => ocTipoSolped(o, solIndexAllByNumero));

    let editorsSet = new Set();
    try {
      const usersQ = query(collection(db, "Usuarios"), where("role", "in", ["editor", "Editor"]));
      const usersSnap = await getDocs(usersQ);
      usersSnap.forEach((d) => {
        const u = d.data() || {};
        const name = (u.fullName || u.displayName || u.email || "").toString().trim();
        if (name) editorsSet.add(name);
      });
    } catch (e) {
      console.warn("No se pudo cargar Usuarios (role=editor). VS quedará vacío.", e);
    }

    let editorContratosAgg = {
      editors: [],
      topAll: [],
      perEditorTop: {},
      totals: { totalSolpes: 0, uniqueContratos: 0 },
    };

    try {
      const solEmpresaOnly = (solMes || []).filter(
        (s) => s.numero_contrato || s.numeroContrato || s.nombre_centro_costo || s.nombreCentroCosto
      );

      if (editorsSet.size) {
        editorContratosAgg = buildEditorContratosAgg(solEmpresaOnly, [...editorsSet]);
      }
    } catch (e) {
      console.warn("No se pudo construir editorContratosAgg", e);
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
      .sort((a, b) => (b[1].aprobadas + b[1].subidas) - (a[1].aprobadas + a[1].subidas))
      .slice(0, 20);

    const vsLabels = entriesVS.map(([k]) => k);
    const vsAprobadas = entriesVS.map(([, v]) => v.aprobadas);
    const vsSubidas = entriesVS.map(([, v]) => v.subidas);

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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([u]) => u);

    const datasetsStatus = OC_ESTATUS_CANON.map((st) => ({
      label: st,
      data: usersTop.map((u) => perUser.get(u)?.get(st) || 0),
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

    // ===== CAMBIO APLICADO PARA LA CARD DE COTIZADOR =====
    const solEmpresaFuenteLead =
      segmento.value === "taller"
        ? []
        : (solAllEmpresaWide?.length ? solAllEmpresaWide : solDocsMes);

    const solTallerFuenteLead =
      segmento.value === "empresa"
        ? []
        : (solAllTallerWide?.length ? solAllTallerWide : solDocsMesTaller);

    const solEmpresaFiltradasLead = (solEmpresaFuenteLead || []).filter((s) => {
      if (filtroEmpresa.value) {
        const emp = String(s.empresa || s.empresas || "");
        if (
          isExactEmpresa.value
            ? emp !== filtroEmpresa.value
            : !_normTxt(emp).includes(_normTxt(filtroEmpresa.value))
        ) {
          return false;
        }
      }

      if (
        filtroEstatusSolped.value &&
        _normTxt(s.estatus || s.estado || "") !== _normTxt(filtroEstatusSolped.value)
      ) {
        return false;
      }

      if (
        filtroTipoSolped.value &&
        _normTxt(s.tipo_solped || "") !== _normTxt(filtroTipoSolped.value)
      ) {
        return false;
      }

      if (
        filtroContratoSel.value &&
        String(s.numero_contrato || s.numeroContrato || "") !== filtroContratoSel.value
      ) {
        return false;
      }

      return true;
    });

    const solTallerFiltradasLead = (solTallerFuenteLead || []).filter((s) => {
      if (
        filtroEstatusSolped.value &&
        _normTxt(s.estatus || s.estado || "") !== _normTxt(filtroEstatusSolped.value)
      ) {
        return false;
      }

      if (
        filtroTipoSolped.value &&
        _normTxt(s.tipo_solped || "") !== _normTxt(filtroTipoSolped.value)
      ) {
        return false;
      }

      if (
        filtroCentroCostoSel.value &&
        String(s.centro_costo || s.centroCosto || "") !== filtroCentroCostoSel.value
      ) {
        return false;
      }

      return true;
    });

    cotizadorLeadBaseDocs.value = {
      solEmpresa: solEmpresaFiltradasLead || [],
      solTaller: solTallerFiltradasLead || [],
    };

    const cotizadorLeadAgg = buildCotizadorLeadAgg(
      solEmpresaFiltradasLead,
      solTallerFiltradasLead
    );
    // ===== FIN CAMBIO CARD COTIZADOR =====

    const payload = {
      kpis: { ...kpis.value },
      kpisExtra: { ...kpisExtra.value },
      topCreadores,
      topOC: { labels: topOCLabels, counts: topOCValues, spends: topOCSpends },
      gastoContrato,
      conteoContrato,
      distEstatus,
      distTipoSolped,
      distMoneda,
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
      },
      editorContratosAgg,
      cotizadorLeadAgg,
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
    lastError.value =
      err && err.message
        ? err.message
        : "No se pudieron cargar las estadísticas.";
  } finally {
    isLoading.value = false;
  }
}

function destroyAll() {
  const allCharts = [
    chartTopCreadores,
    chartTopOC,
    chartGastoContrato,
    chartConteoContrato,
    chartDistEstatus,
    chartDistTipoSolped,
    chartSerieGasto,
    chartTopAprobadores,
    chartPendMes,
    chartPendAll,
    chartVsEditors,
    chartOcTipo,
    chartOcTipoSolped,
    chartOcStatusByUser,
    chartDistMoneda,
    chartCotizadorLead,
  ];

  allCharts.forEach((chartRef) => {
    if (chartRef.value) {
      try {
        chartRef.value.destroy();
      } catch (e) {
        console.warn("No se pudo destruir chart", e);
      }
      chartRef.value = null;
    }
  });
}


function pintarDesdePayload(payload) {
  if (!payload || typeof payload !== "object") {
    isLoading.value = false;
    return;
  }

  const payloadJSON = JSON.stringify(payload);
  if (_lastPayloadJSON === payloadJSON) {
    isLoading.value = false;
    return;
  }

  _lastPayloadJSON = payloadJSON;

  kpis.value = payload.kpis || {
    creadasMes: 0,
    completadasMes: 0,
    ocMes: 0,
    gastoMes: 0,
    ticketProm: 0,
  };

  kpisExtra.value = payload.kpisExtra || {
    conversionPct: 0,
    leadtimePromDias: 0,
    rechazoPct: 0,
    comentariosTallerMes: 0,
  };

  topHoy.value = Array.isArray(payload.topHoy) ? payload.topHoy : [];
  topCreadoresRows.value = Array.isArray(payload.topCreadores) ? payload.topCreadores : [];
  gastoContratoRows.value = Array.isArray(payload.gastoContrato) ? payload.gastoContrato : [];
  conteoContratoRows.value = Array.isArray(payload.conteoContrato) ? payload.conteoContrato : [];
  topAprobadoresRows.value = Array.isArray(payload.topAprobadores) ? payload.topAprobadores : [];

  vsEditorsPayload.value = payload.vsEditors || { labels: [], aprobadas: [], subidas: [] };

  ocStatusByUserPayload.value = payload.ocStatusByUser || {
    users: [],
    rows: [],
    datasets: [],
  };

  ocTipoSolpedAggPayload.value = payload.ocTipoSolpedAgg || {
    labels: [],
    counts: [],
    montos: [],
    totalCount: 0,
    totalMonto: 0,
  };

  cotizadorLeadPayload.value = payload.cotizadorLeadAgg || {
    labels: [],
    dataInicio: [],
    dataFin: [],
    rows: [],
    missingDates: [],
  };

  editorContratosAgg.value = payload.editorContratosAgg || {
    editors: [],
    topAll: [],
    perEditorTop: {},
    totals: { totalSolpes: 0, uniqueContratos: 0 },
  };

  nextTick(() => {
    try {
      renderOrUpdateBarChart(chartTopCreadores, topCreadoresCanvas, {
        labels: topCreadoresRows.value.map(([k]) => k),
        datasets: [{
          label: "SOLPEDs",
          data: topCreadoresRows.value.map(([, v]) => v),
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateBarChart(chartTopOC, topOCCanvas, {
        labels: payload.topOC?.labels || [],
        datasets: [{
          label: "Cantidad OC",
          data: payload.topOC?.counts || [],
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateGroupedBarChart(chartOcStatusByUser, ocStatusByUserCanvas, {
        labels: ocStatusByUserPayload.value.users || [],
        datasets: Array.isArray(ocStatusByUserPayload.value.datasets)
          ? ocStatusByUserPayload.value.datasets.map(ds => ({
              ...ds,
              borderWidth: 1,
              maxBarThickness: 18,
              categoryPercentage: 0.7,
              barPercentage: 0.9,
            }))
          : [],
      });

      renderOrUpdateDoughnutChart(chartDistEstatus, distEstatusCanvas, {
        labels: Object.keys(payload.distEstatus || {}),
        datasets: [{
          data: Object.values(payload.distEstatus || {}),
          borderWidth: 1,
        }],
      });

      renderOrUpdateDoughnutChart(chartDistTipoSolped, distTipoSolpedCanvas, {
        labels: Object.keys(payload.distTipoSolped || {}),
        datasets: [{
          data: Object.values(payload.distTipoSolped || {}),
          borderWidth: 1,
        }],
      });

      renderOrUpdateDoughnutChart(chartOcTipoSolped, ocTipoSolpedCanvas, {
        labels: ocTipoSolpedAggPayload.value.labels || [],
        datasets: [{
          data: ocTipoSolpedAggPayload.value.montos || [],
          borderWidth: 1,
        }],
      });

      renderOrUpdateBarChart(chartTopAprobadores, topAprobadoresCanvas, {
        labels: topAprobadoresRows.value.map(([k]) => k),
        datasets: [{
          label: "Aprobaciones",
          data: topAprobadoresRows.value.map(([, v]) => v),
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateBarChart(chartPendMes, pendMesCanvas, {
        labels: payload.solpedPend?.labels || [],
        datasets: [{
          label: "Pendientes mes",
          data: payload.solpedPend?.values || [],
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateBarChart(chartGastoContrato, gastoContratoCanvas, {
        labels: gastoContratoRows.value.map(([k]) => k),
        datasets: [{
          label: "Monto",
          data: gastoContratoRows.value.map(([, v]) => v),
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateBarChart(chartConteoContrato, conteoContratoCanvas, {
        labels: conteoContratoRows.value.map(([k]) => k),
        datasets: [{
          label: "Cantidad",
          data: conteoContratoRows.value.map(([, v]) => v),
          borderWidth: 1,
          maxBarThickness: 28,
        }],
      });

      renderOrUpdateBarChart(chartVsEditors, vsEditorsCanvas, {
        labels: vsEditorsPayload.value.labels || [],
        datasets: [
          {
            label: "Aprobadas",
            data: vsEditorsPayload.value.aprobadas || [],
            borderWidth: 1,
            maxBarThickness: 24,
          },
          {
            label: "Subidas proveedor",
            data: vsEditorsPayload.value.subidas || [],
            borderWidth: 1,
            maxBarThickness: 24,
          },
        ],
      });

    renderOrUpdateBarChart(chartCotizadorLead, cotizadorLeadCanvas, {
      labels: [...(cotizadorLeadPayload.value.labels || [])],
      datasets: [
        {
          label: "Prom. inicio",
          data: [...(cotizadorLeadPayload.value.dataInicio || [])],
          borderWidth: 1,
          maxBarThickness: 26,
        },
        {
          label: "Prom. fin",
          data: [...(cotizadorLeadPayload.value.dataFin || [])],
          borderWidth: 1,
          maxBarThickness: 26,
        },
      ],
    });
    } catch (e) {
      console.warn("Error pintando charts", e);
    } finally {
      isLoading.value = false;
    }
  });
}

function renderOrUpdateBarChart(chartRef, canvasRef, data) {
  if (!canvasRef.value) return;

  const safeData = toPlainChartData(data);

  if (chartRef.value) {
    try {
      chartRef.value.data.labels = [...safeData.labels];
      chartRef.value.data.datasets = safeData.datasets.map((ds) => ({
        ...ds,
        data: Array.isArray(ds.data) ? [...ds.data] : [],
      }));
      chartRef.value.update();
      return;
    } catch (e) {console.log(e)
      try { chartRef.value.destroy(); } catch(e) {console.log(e)}
      chartRef.value = null;
    }
  }

  chartRef.value = new Chart(canvasRef.value, {
    type: "bar",
    data: safeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
function toPlainChartData(data = {}) {
  return {
    labels: Array.isArray(data.labels) ? [...data.labels] : [],
    datasets: Array.isArray(data.datasets)
      ? data.datasets.map((ds) => ({
          ...ds,
          data: Array.isArray(ds.data) ? [...ds.data] : [],
        }))
      : [],
  };
}
function renderOrUpdateGroupedBarChart(chartRef, canvasRef, data) {
  if (!canvasRef.value) return;

  const safeData = toPlainChartData(data);

  if (chartRef.value) {
    try {
      chartRef.value.data.labels = [...safeData.labels];
      chartRef.value.data.datasets = safeData.datasets.map((ds) => ({
        ...ds,
        data: Array.isArray(ds.data) ? [...ds.data] : [],
      }));
      chartRef.value.update();
      return;
    } catch (e) {console.log(e)
      try { chartRef.value.destroy(); } catch(e) {console.log(e)}
      chartRef.value = null;
    }
  }

  chartRef.value = new Chart(canvasRef.value, {
    type: "bar",
    data: safeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: false },
        y: { stacked: false, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}
function renderOrUpdateDoughnutChart(chartRef, canvasRef, data) {
  if (!canvasRef.value) return;

  const safeData = toPlainChartData(data);

  if (chartRef.value) {
    try {
      chartRef.value.data.labels = [...safeData.labels];
      chartRef.value.data.datasets = safeData.datasets.map((ds) => ({
        ...ds,
        data: Array.isArray(ds.data) ? [...ds.data] : [],
      }));
      chartRef.value.update();
      return;
    } catch (e) {
      try { chartRef.value.destroy(); } catch {console.log(e)}
      chartRef.value = null;
    }
  }

  chartRef.value = new Chart(canvasRef.value, {
    type: "doughnut",
    data: safeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
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
.cotizador-detalle-card{
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 14px;
  padding: 14px;
}

.cotizador-detalle-scroll{
  overflow-x: auto;
}

.cotizador-detalle-scroll-activo{
  max-height: 520px;
  overflow-y: auto;
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 12px;
}
.form-check.form-switch {
  padding-top: .35rem;
}

.alert-light.border {
  border-radius: 12px;
}
.form-label-sm{
  font-size: .82rem;
  font-weight: 600;
}
</style>
