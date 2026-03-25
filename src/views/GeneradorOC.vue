<!-- src/views/GeneradorOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="generador-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate text-center flex-grow-1 d-none d-sm-block">
          Generador de Cotización
        </h1>

        <button
          type="button"
          class="btn btn-secondary btn-sm d-none d-lg-inline-flex"
          @click="toggleEquiposResponsive"
          :aria-pressed="mostrarEquipos.toString()"
        >
          <i class="bi bi-search me-1"></i>
          {{ mostrarEquipos ? "Ocultar" : "Buscar" }} equipos
        </button>

        <button
          type="button"
          class="btn btn-outline-dark btn-sm d-none d-md-inline-flex"
          @click="toggleMisOC"
          :aria-pressed="mostrarMisOC.toString()"
        >
          <i class="bi bi-receipt-cutoff me-1"></i>
          {{ mostrarMisOC ? "Ocultar mis Cotizaciones" : "Mis Cotizaciones" }}
        </button>

        <button
          type="button"
          class="btn btn-outline-primary btn-sm d-none d-md-inline-flex"
          @click="toggleResumenOC"
          :aria-pressed="mostrarResumenOC.toString()"
        >
          <i class="bi bi-graph-up-arrow me-1"></i>
          {{ mostrarResumenOC ? "Ocultar resumen OC" : "Resumen OC" }}
        </button>
        <button
          type="button"
          class="btn btn-outline-success btn-sm d-none d-md-inline-flex"
          @click="abrirCrucePrecios"
          :disabled="cargandoCrucePrecios"
        >
          <span v-if="cargandoCrucePrecios" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-shuffle me-1"></i>
          Cruce de precios
        </button>
      </div>

      <div
        v-if="mostrarBloqueoAprobadas"
        class="alert alert-danger d-flex align-items-start gap-2 mb-3"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill fs-5"></i>
        <div>
          <div class="fw-semibold">
            Límite alcanzado: tienes {{ totalAprobadasDelUsuario }} cotizaciones en estado
            <u>Aprobado</u>.
          </div>
          <div class="small">
            Para continuar generando nuevas cotizaciones, primero debes <strong>subir</strong> o gestionar las aprobadas.
            Ve al detalle de tus cotizaciones y completa el proceso.
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12" :class="mostrarEquipos ? 'col-lg-8' : 'col-lg-12'">
          <div v-if="mostrarMisOC" class="card mb-3 card-elevated">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🧾 Mis Cotizaciones</div>
              <span class="badge bg-dark-subtle text-dark-emphasis">{{ misOC.length }} en total</span>
            </div>

            <div class="card-body p-0">
              <div v-if="cargandoMisOC" class="p-3 text-center">
                <div class="spinner-border" role="status"></div>
                <div class="small mt-2">Cargando…</div>
              </div>

              <div v-else-if="misOC.length === 0" class="p-3 text-secondary text-center">
                No hay órdenes este mes.
              </div>

              <div v-else class="list-group list-group-flush">
                <div
                  class="list-group-item d-flex align-items-start flex-wrap gap-2"
                  v-for="oc in misOCPaged"
                  :key="oc.__docId"
                >
                  <div class="me-auto">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="fw-semibold">N° {{ oc.id ?? "—" }}</span>
                      <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || "—" }}</span>
                    </div>
                    <div class="small text-secondary mt-1">
                      <strong>Centro:</strong> {{ oc.centroCostoNombre || "—" }} ·
                      <strong>Moneda:</strong> {{ oc.moneda || "—" }} ·
                      <strong>Total:</strong> {{ (oc.precioTotalConIVA ?? 0).toLocaleString("es-CL") }}
                    </div>
                    <div class="small text-secondary">
                      <strong>Fecha:</strong> {{ fmtFecha(oc.fechaSubida) }}
                    </div>
                  </div>
                  <div class="ms-auto">
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="irADetalleOC(oc)">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!cargandoMisOC && misOCTotalPages > 1" class="card-footer bg-white">
              <nav aria-label="Paginación OC">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: misOCCurrentPage === 1 }">
                    <button
                      type="button"
                      class="page-link"
                      @click="misOCGoTo(misOCCurrentPage - 1)"
                      :disabled="misOCCurrentPage === 1"
                      aria-label="Anterior"
                    >
                      «
                    </button>
                  </li>

                  <li
                    class="page-item"
                    v-for="n in misOCVisiblePages"
                    :key="'pg-' + n"
                    :class="{ active: misOCCurrentPage === n }"
                  >
                    <button type="button" class="page-link" @click="misOCGoTo(n)">{{ n }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: misOCCurrentPage === misOCTotalPages }">
                    <button
                      type="button"
                      class="page-link"
                      @click="misOCGoTo(misOCCurrentPage + 1)"
                      :disabled="misOCTotalPages === misOCCurrentPage"
                      aria-label="Siguiente"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          <div v-if="mostrarResumenOC" class="card mb-3 card-elevated">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">📊 Resumen de mis Cotizaciones</div>
              <span class="badge bg-dark-subtle text-dark-emphasis">{{ resumenOC.length }} fila</span>
            </div>

            <div class="card-body p-0">
              <div v-if="cargandoResumenOC" class="p-3 text-center">
                <div class="spinner-border" role="status" aria-hidden="true"></div>
                <div class="small mt-2">Cargando…</div>
              </div>

              <div v-else-if="!resumenOC.length" class="p-3 text-secondary text-center">
                Sin datos en este mes.
              </div>

              <div v-else class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Responsable</th>
                      <th class="text-center">Aprobado</th>
                      <th class="text-center">Rechazado</th>
                      <th class="text-center">Preaprobado</th>
                      <th class="text-center">Pend. Aprob.</th>
                      <th class="text-center">Rev. Guillermo</th>
                      <th class="text-center">Env. Prove.</th>
                      <th class="text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in resumenOCPaged" :key="row.responsable">
                      <td class="fw-semibold">{{ row.responsable }}</td>
                      <td class="text-center">
                        <span class="badge bg-success-subtle text-success-emphasis">{{ row.aprobado }}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-danger-subtle text-danger-emphasis">{{ row.rechazado }}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-info-subtle text-info-emphasis">{{ row.preaprobado }}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-warning-subtle text-warning-emphasis">{{ row.pendiente }}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-primary-subtle text-primary-emphasis">{{ row.revision }}</span>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-info-subtle text-info-emphasis">{{ row.proveedor }}</span>
                      </td>
                      <td class="text-center fw-semibold">{{ row.total }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="!cargandoResumenOC && resumenOCTotalPages > 1" class="card-footer bg-white">
              <nav aria-label="Paginación resumen oc">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: resumenOCCurrentPage === 1 }">
                    <button
                      type="button"
                      class="page-link"
                      @click="resumenOCGoTo(resumenOCCurrentPage - 1)"
                      :disabled="resumenOCCurrentPage === 1"
                    >
                      «
                    </button>
                  </li>

                  <li
                    class="page-item"
                    v-for="n in resumenOCVisiblePages"
                    :key="'pg-resumen-oc-' + n"
                    :class="{ active: resumenOCCurrentPage === n }"
                  >
                    <button type="button" class="page-link" @click="resumenOCGoTo(n)">{{ n }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: resumenOCCurrentPage === resumenOCTotalPages }">
                    <button
                      type="button"
                      class="page-link"
                      @click="resumenOCGoTo(resumenOCCurrentPage + 1)"
                      :disabled="resumenOCCurrentPage === resumenOCTotalPages"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          <div class="card card-elevated position-relative overflow-hidden" :class="{ 'is-locked': bloqueoPorAprobadas }">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold d-flex align-items-center gap-2">
                <span>Subir Cotización</span>
                <span
                  v-if="mostrarBloqueoAprobadas"
                  class="badge bg-danger-subtle text-danger-emphasis d-inline-flex align-items-center gap-1"
                >
                  <i class="bi bi-lock-fill"></i> Bloqueado
                </span>
              </div>

              <div class="d-flex gap-2 d-lg-none">
                <button type="button" class="btn btn-outline-dark btn-sm" @click="toggleMisOC" :aria-pressed="mostrarMisOC.toString()">
                  <i class="bi bi-receipt-cutoff"></i>
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm" @click="toggleResumenOC" :aria-pressed="mostrarResumenOC.toString()">
                  <i class="bi bi-graph-up-arrow"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="toggleEquiposResponsive" :aria-pressed="mostrarEquipos.toString()">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>

            <div v-if="mostrarBloqueoAprobadas" class="lock-overlay">
              <div class="lock-box text-center">
                <i class="bi bi-lock-fill display-6 d-block mb-2"></i>
                <div class="fw-semibold">Formulario bloqueado</div>
                <div class="small text-secondary">
                  Debes gestionar tus cotizaciones <strong>Aprobadas</strong> y subir la orden de compra correspondiente
                  antes de continuar con el proceso.
                </div>
                <button type="button" class="btn btn-sm btn-dark mt-3" @click="router.push('/historial-oc')">
                  Ver mis cotizaciones
                </button>
              </div>
            </div>

            <div class="card-body">
              <fieldset :disabled="formDisabled" style="border: 0; padding: 0; margin: 0">
                <div class="mb-3">
                  <label class="form-label d-flex align-items-center justify-content-between">
                    <span>N° de Cotización</span>
                    <small v-if="cargandoNuevoId" class="text-secondary">Cargando…</small>
                  </label>

                  <div class="input-group">
                    <span class="input-group-text">N°</span>

                    <input
                      class="form-control fw-semibold"
                      :class="{ 'border-primary': !!nuevoIdVisual && !cargandoNuevoId }"
                      type="text"
                      :value="cargandoNuevoId ? '' : (nuevoIdVisual ?? '—').toString()"
                      :placeholder="cargandoNuevoId ? 'Cargando…' : '—'"
                      readonly
                    />

                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="cargarSiguienteNumero"
                      :disabled="cargandoNuevoId"
                      title="Recargar número"
                    >
                      <span v-if="!cargandoNuevoId"><i class="bi bi-arrow-clockwise"></i></span>
                      <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </button>
                  </div>

                  <div class="form-text">Se asigna automáticamente y es de solo lectura.</div>
                </div>
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="swSolped" v-model="usarSolped" @change="onToggleUsarSolped" />
                  <label class="form-check-label" for="swSolped">¿Asociar a una SOLPED?</label>
                </div>

                <div v-if="usarSolped" class="row g-2 align-items-end">
                  <div class="col-12">
                    <label class="form-label">SOLPED asociada</label>
                    <select
                      ref="solpedSelectRef"
                      class="form-select"
                      :class="{ 'is-invalid': invalidField === 'solped' }"
                      v-model="solpedSeleccionadaId"
                      @change="onChangeSolped"
                    >
                      <option value="">— Selecciona —</option>
                      <option v-for="solpe in solpedDisponibles" :key="solpe.id" :value="solpe.id">
                        #{{ solpe.numero_solpe }} - {{ solpe.nombre_solped }} ({{ solpe.tipo_solped }}) ·
                        {{ solpe.nombre_centro_costo }} · {{ solpe.usuario || "—" }} · {{ solpe.empresa || "—" }}
                      </option>
                    </select>
                  </div>
                </div>

                <div v-if="usarSolped && solpedSeleccionada" class="row g-3 mt-1">
                  <div class="col-12 col-md-6">
                    <div class="small text-secondary">N° SOLPED</div>
                    <div class="fw-semibold">{{ solpedSeleccionada.numero_solpe }}</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="small text-secondary">Centro de Costo</div>
                    <div class="fw-semibold">{{ solpedSeleccionada.numero_contrato }} — {{ solpedSeleccionada.nombre_centro_costo }}</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="small text-secondary">Empresa</div>
                    <div class="fw-semibold">{{ solpedSeleccionada.empresa }}</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="small text-secondary">Tipo / Nombre</div>
                    <div class="fw-semibold">{{ solpedSeleccionada.tipo_solped }} — {{ solpedSeleccionada.nombre_solped }}</div>
                  </div>
                </div>

                <div v-if="usarSolped && itemsSolped.length" class="card mt-3">
                  <div class="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="fw-semibold">📦 Ítems de la SOLPED</div>

                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <small class="text-secondary d-none d-sm-inline">Desliza horizontalmente si es necesario</small>

                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        @click="abrirCrucePrecios"
                        :disabled="cargandoCrucePrecios"
                      >
                        <span v-if="cargandoCrucePrecios" class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-shuffle me-1"></i>
                        Cruce de precios
                      </button>
                    </div>
                  </div>

                  <div class="card-body">
                    <div class="table-responsive table-stacked-sm">
                      <table class="table table-sm align-middle">
                        <thead class="table-light">
                          <tr>
                            <th style="width: 60px">Ítem</th>
                            <th>Descripción</th>
                            <th class="text-center">Cant. total</th>
                            <th class="text-center">Cotizado antes</th>
                            <th style="width: 180px">Cant. a cotizar</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="it in itemsSolped" :key="it.__k">
                            <td data-label="Ítem">{{ it.item }}</td>
                            <td data-label="Descripción" class="w-50">{{ it.descripcion }}</td>
                            <td data-label="Cant. total" class="text-center">{{ it.cantidad }}</td>
                            <td data-label="Cotizado antes" class="text-center">{{ it.cantidad_cotizada || 0 }}</td>
                            <td data-label="Cant. a cotizar">
                              <input
                                :ref="(el) => setItemCantidadRef(it.__k, el)"
                                v-model.number="it.cantidad_para_cotizar"
                                type="number"
                                min="0"
                                :max="it.__max"
                                class="form-control form-control-sm text-center"
                                :class="{ 'is-invalid': it.__invalid || invalidField === `item-${it.__k}` }"
                                @input="onInputCantidad(it); clearInvalidField(`item-${it.__k}`)"
                              />
                              <div class="form-text mb-0">
                                Total: {{ it.cantidad }} ·
                                Cotizado antes: {{ it.cantidad_cotizada || 0 }} ·
                                Disponible: {{ it.__max }} ·
                                Restante: {{ it.__restante }}
                              </div>
                              <div v-if="it.__invalid" class="invalid-feedback d-block">
                                Se ajustó al máximo permitido.
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-if="autorizacionesSolped.length" class="mt-3">
                      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div class="fw-semibold d-flex align-items-center gap-2">
                          <i class="bi bi-paperclip"></i>
                          Documentos adjuntos (SOLPED)
                        </div>

                        <div class="small text-secondary">
                          {{ autorizacionesSolped.length }} archivo(s)
                        </div>
                      </div>

                      <div class="list-group mt-2">
                        <label
                          v-for="(a, idx) in autorizacionesSolped"
                          :key="a.__k"
                          class="list-group-item d-flex align-items-start gap-2"
                        >
                          <input
                            class="form-check-input mt-1"
                            type="radio"
                            name="radAdjSolped"
                            :value="idx"
                            v-model.number="autorizacionSeleccionadaIndex"
                            @change="onChangeAutorizacionSeleccionada"
                          />

                          <div class="flex-grow-1 minw-0">
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                              <div class="fw-semibold text-truncate">{{ a.nombre || "Archivo" }}</div>
                              <span class="badge bg-secondary-subtle text-secondary-emphasis">
                                {{ prettyTipo(a.tipo) }}
                              </span>
                              <span class="badge bg-dark-subtle text-dark-emphasis" v-if="a.tamano">
                                {{ prettyBytes(a.tamano) }}
                              </span>
                              <span
                                class="badge bg-success-subtle text-success-emphasis"
                                v-if="isAdjuntoEnArchivos(a)"
                                title="Ya agregado a la cotización"
                              >
                                <i class="bi bi-check2-circle"></i> Agregado
                              </span>
                            </div>

                            <div class="d-flex gap-2 mt-2 flex-wrap">
                              <a :href="a.url" target="_blank" rel="noopener" class="btn btn-sm btn-primary">
                                Ver
                              </a>

                              <button
                                v-if="!isAdjuntoEnArchivos(a)"
                                type="button"
                                class="btn btn-sm btn-outline-success"
                                @click.prevent="agregarAdjuntoSolped(a)"
                              >
                                <i class="bi bi-plus-lg me-1"></i> Reutilizar
                              </button>

                              <button
                                v-else
                                type="button"
                                class="btn btn-sm btn-outline-danger"
                                @click.prevent="quitarAdjuntoSolped(a)"
                              >
                                <i class="bi bi-trash me-1"></i> Quitar
                              </button>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <hr class="my-4" />
                                  <div class="mb-3">
                    <label class="form-label">Proveedor</label>

                    <div class="input-group">
                      <input
                        class="form-control"
                        :class="{ 'is-invalid': invalidField === 'proveedor' }"
                        :value="proveedorNombre"
                        placeholder="Selecciona un proveedor…"
                        readonly
                      />

                      <button
                        type="button"
                        class="btn btn-outline-primary"
                        :class="{ 'btn-danger': invalidField === 'proveedor' }"
                        @click="modalProveedorAbierto = true"
                        aria-label="Seleccionar proveedor"
                      >
                        <i class="bi bi-search"></i>
                      </button>

                      <button
                        v-if="proveedorSeleccionado"
                        type="button"
                        class="btn btn-outline-danger"
                        @click="limpiarProveedorSeleccionado"
                        aria-label="Quitar proveedor"
                        title="Quitar proveedor"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>

                    <div
                      v-if="proveedorSeleccionado"
                      class="provider-selected-card mt-2"
                    >
                      <div class="provider-selected-icon">
                        <i class="bi bi-building"></i>
                      </div>

                      <div class="flex-grow-1 minw-0">
                        <div class="fw-semibold text-truncate">{{ proveedorNombre }}</div>
                        <div class="small text-secondary">RUT: {{ proveedorRut }}</div>
                      </div>
                    </div>
                  </div>
                <div class="mb-3">
                  <label class="form-label">Centro de Costo</label>
                  <div class="input-group">
                    <input class="form-control" :value="nombreCentroCosto || ''" placeholder="Selecciona un centro…" readonly />
                    <button
                      ref="centroCostoBtnRef"
                      type="button"
                      class="btn btn-outline-primary"
                      :class="{ 'btn-danger': invalidField === 'centroCosto' }"
                      @click="modalCentroAbierto = true"
                      aria-label="Seleccionar Centro de Costo"
                    >
                      <i class="bi bi-search"></i>
                    </button>
                  </div>
                  <div class="form-text">
                    Debes <strong>elegir</strong> un centro de costo antes de enviar.
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label">N° Patente / Stock</label>
                    <select
                      ref="tipoCompraRef"
                      class="form-select"
                      :class="{ 'is-invalid': invalidField === 'tipoCompra' }"
                      v-model="tipoCompra"
                      @change="clearInvalidField('tipoCompra')"
                    >
                      <option value="stock">Stock</option>
                      <option value="patente">Patente</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-6" v-if="tipoCompra === 'patente'">
                    <label class="form-label">Patente destino</label>
                    <input
                      ref="destinoCompraRef"
                      class="form-control"
                      :class="{ 'is-invalid': invalidField === 'destinoCompra' }"
                      v-model="destinoCompra"
                      @input="clearInvalidField('destinoCompra')"
                      placeholder="Escribe la patente"
                    />
                  </div>
                </div>

                <div class="row g-3 mt-1">
                  <div class="col-12 col-md-4">
                    <label class="form-label">Moneda</label>
                    <select
                      ref="monedaRef"
                      class="form-select"
                      :class="{ 'is-invalid': invalidField === 'moneda' }"
                      v-model="monedaSeleccionada"
                      @change="onCambioMoneda(); clearInvalidField('moneda')"
                    >
                      <option value="CLP">CLP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="UF">UF</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-8">
                    <label class="form-label">Precio Total con IVA</label>
                    <input
                      ref="precioTotalRef"
                      class="form-control"
                      :class="{ 'is-invalid': invalidField === 'precioTotalConIVA' }"
                      type="text"
                      :value="precioFormateado"
                      @input="formatearPrecio($event); clearInvalidField('precioTotalConIVA')"
                      placeholder="$ 0"
                      inputmode="numeric"
                    />
                    <div class="form-text">Se formatea automáticamente según moneda seleccionada.</div>
                  </div>
                </div>
                <div
                  v-if="aprobadorUI.show"
                  class="alert d-flex align-items-start mt-3"
                  :class="aprobadorUI.cls"
                  role="alert"
                >
                  <i class="bi fs-5 me-2" :class="aprobadorUI.icon"></i>
                  <div>
                    <div class="fw-semibold">{{ aprobadorUI.title }}</div>
                    <div class="small" v-if="aprobadorUI.subtitle">{{ aprobadorUI.subtitle }}</div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Comentario</label>
                  <textarea class="form-control" rows="3" v-model="comentario" placeholder="Agrega un comentario opcional…"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Archivos PDF o Imagen (se convierte a PDF)</label>

                  <input
                    id="inputArchivo"
                    type="file"
                    multiple
                    accept="application/pdf,image/*,.xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    class="d-none"
                    @change="onMultipleFilesSelected"
                  />

                  <div
                    ref="archivosDropzoneRef"
                    class="dropzone-upload"
                    :class="{
                      'is-dragging': dragOverArchivos,
                      'border border-danger': invalidField === 'archivos'
                    }"
                    @click="abrirSelectorArchivos"
                    @dragenter.prevent="onDragEnterArchivos"
                    @dragover.prevent="onDragOverArchivos"
                    @dragleave.prevent="onDragLeaveArchivos"
                    @drop.prevent="onDropArchivos"
                  >
                    <div class="dropzone-icon">
                      <i class="bi bi-cloud-arrow-up"></i>
                    </div>

                    <div class="fw-semibold mb-1">
                      Arrastra aquí tus archivos
                    </div>

                    <div class="text-secondary small mb-2">
                      o haz clic para seleccionarlos
                    </div>

                    <div class="d-flex justify-content-center flex-wrap gap-2">
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">PDF</span>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">Imágenes</span>
                    </div>
                  </div>
                </div>
                <div v-for="(archivo, i) in archivos" :key="archivo.__k" class="card mb-2">
                  <div class="card-header d-flex align-items-center">
                    <div class="fw-semibold me-auto text-truncate">
                      <span v-if="archivo.fromSolped" class="badge bg-secondary-subtle text-secondary-emphasis me-2">SOLPED</span>
                      <span v-if="archivo.convertedFromExcel" class="badge bg-warning-subtle text-warning-emphasis me-2">EXCEL→PDF</span>
                      {{ archivo.name }}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="eliminarArchivo(i)" aria-label="Eliminar archivo">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>

                  <div class="card-body">
                    <div v-if="isPdfArchivo(archivo)" class="ratio ratio-16x9">
                      <iframe v-if="archivo.previewUrl" :src="archivo.previewUrl + '#toolbar=0'" style="border: none"></iframe>
                    </div>
                    <div v-else-if="isImageArchivo(archivo)" class="text-center">
                      <img
                        v-if="archivo.previewUrl"
                        :src="archivo.previewUrl"
                        alt="Vista previa"
                        class="img-fluid rounded shadow-sm"
                        style="max-height: 700px; object-fit: contain"
                      />
                    </div>
                    <div v-else class="excel-fallback text-center">
                      <div class="excel-icon">
                        <i
                          class="bi"
                          :class="isExcelArchivo(archivo) ? 'bi-file-earmark-excel-fill' : 'bi-file-earmark-fill'"
                        ></i>
                      </div>

                      <div class="fw-semibold mt-2">
                        {{ isExcelArchivo(archivo) ? "Documento Excel" : "Documento" }}
                      </div>

                      <div class="text-secondary small mt-1">
                        No hay vista previa para este formato. Puedes descargar el archivo.
                      </div>

                      <div class="d-flex justify-content-center gap-2 flex-wrap mt-3">
                        <a
                          class="btn btn-success btn-sm"
                          :href="archivo.url || archivo.previewUrl"
                          :download="archivo.name"
                          target="_blank"
                          rel="noopener"
                        >
                          <i class="bi bi-download me-1"></i> Descargar
                        </a>
                      </div>

                      <div class="mt-2">
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">
                          {{ prettyTipo(archivo.tipo || archivo.name) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="d-grid mt-3">
                  <button
                    type="button"
                    class="btn btn-danger btn-lg"
                    :disabled="enviando || bloqueoPorAprobadas"
                    :title="bloqueoPorAprobadas ? 'No puedes enviar nuevas cotizaciones: límite de aprobadas alcanzado' : ''"
                    @click="enviarOC"
                  >
                    <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
                    Enviar Cotización
                  </button>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
        <aside class="col-12 col-lg-4 d-none d-lg-block" v-if="mostrarEquipos">
          <div class="card h-100 card-elevated sticky-panel">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🔎 Buscar equipos</div>
              <button type="button" class="btn btn-sm btn-outline-secondary d-lg-none" @click="cerrarEquiposMobile">Cerrar</button>
            </div>

            <div class="card-body d-flex flex-column">
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  class="form-control"
                  placeholder="Busca por código, chasis, marca, modelo, localización, tipo… (ej: 2864 / silo)"
                  v-model="busquedaEquipo"
                  @input="aplicarFiltrosEquiposDebounced"
                />
              </div>

              <div v-if="equiposLoadingAll" class="text-center text-secondary py-2 small">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Cargando base de equipos ({{ equiposAll.length }} / 650 aprox.)…
              </div>

              <div v-if="(busquedaEquipo || '').trim().length < 2" class="text-center text-secondary py-3 small">
                Escribe al menos 2 caracteres.
              </div>

              <div v-if="cargandoEquipos" class="text-center py-3">
                <div class="spinner-border" role="status"></div>
                <div class="mt-2">Buscando…</div>
              </div>

              <div
                v-if="!cargandoEquipos && (busquedaEquipo || '').trim().length >= 2 && resultadosEquipos.length === 0"
                class="text-center text-secondary py-3"
              >
                No se encontraron resultados.
              </div>

              <div class="list-group equipos-list flex-grow-1" v-if="pagedEquipos.length">
                <div class="list-group-item p-3" v-for="e in pagedEquipos" :key="e.id || e.codigo">
                  <div class="d-flex align-items-start">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center mb-2 flex-wrap gap-2">
                        <h6 class="mb-0">
                          <strong>{{ e.codigo || "SIN CÓDIGO" }}</strong>
                        </h6>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">
                          {{ e.tipo_equipo || "Tipo?" }}
                        </span>
                      </div>

                      <div class="row g-2 text-secondary small">
                        <div class="col-12">
                          <div><strong>Año:</strong> {{ e.ano || "—" }}</div>
                          <div><strong>Clasificación:</strong> {{ e.clasificacion1 || "—" }}</div>
                          <div><strong>Equipo:</strong> {{ e.equipo || "—" }}</div>
                          <div><strong>Localización:</strong> {{ e.localizacion || "—" }}</div>
                          <div><strong>Marca:</strong> {{ e.marca || "—" }}</div>
                          <div><strong>Modelo:</strong> {{ e.modelo || "—" }}</div>
                          <div><strong>N° Chasis:</strong> {{ e.numero_chasis || "—" }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="ms-3">
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">Copiar</button>
                    </div>
                  </div>
                </div>
              </div>

              <nav v-if="totalPages > 1" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button type="button" class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Anterior">
                      «
                    </button>
                  </li>
                  <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                    <button type="button" class="page-link" @click="goToPage(n)">{{ n }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button type="button" class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" aria-label="Siguiente">
                      »
                    </button>
                  </li>
                </ul>
              </nav>

              <div class="mt-2 small text-secondary" v-if="equiposLoaded && equiposAll.length">
                Base cargada: {{ equiposAll.length }} equipos.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <transition name="oc">
      <div v-if="showEquiposMobile" class="oc-wrap d-lg-none" @keydown.esc="cerrarEquiposMobile">
        <div class="oc-backdrop" @click="cerrarEquiposMobile"></div>

        <div class="oc-panel" role="dialog" aria-modal="true" aria-label="Buscar equipos">
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">🔎 Buscar equipos</h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-outline-dark" @click="cerrarEquiposMobile" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <div class="input-group mb-3">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                class="form-control"
                placeholder="Busca por código, chasis, marca, modelo, localización, tipo… (ej: 2864 / silo)"
                v-model="busquedaEquipo"
                @input="aplicarFiltrosEquiposDebounced"
              />
            </div>

            <div v-if="equiposLoadingAll" class="text-center text-secondary py-2 small">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Cargando base de equipos ({{ equiposAll.length }} / 650 aprox.)…
            </div>

            <div v-if="(busquedaEquipo || '').trim().length < 2" class="text-center text-secondary py-3 small">
              Escribe al menos 2 caracteres.
            </div>

            <div v-if="cargandoEquipos" class="text-center py-3">
              <div class="spinner-border" role="status"></div>
              <div class="mt-2">Buscando…</div>
            </div>

            <div
              v-if="!cargandoEquipos && (busquedaEquipo || '').trim().length >= 2 && resultadosEquipos.length === 0"
              class="text-center text-secondary py-3"
            >
              No se encontraron resultados.
            </div>

            <div class="list-group equipos-list" v-if="pagedEquipos.length">
              <div class="list-group-item p-3" v-for="e in pagedEquipos" :key="e.id || e.codigo">
                <div class="d-flex align-items-start">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2 flex-wrap gap-2">
                      <h6 class="mb-0"><strong>{{ e.codigo || "SIN CÓDIGO" }}</strong></h6>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">
                        {{ e.tipo_equipo || "Tipo?" }}
                      </span>
                    </div>

                    <div class="text-secondary small">
                      <div><strong>Año:</strong> {{ e.ano || "—" }}</div>
                      <div><strong>Clasificación:</strong> {{ e.clasificacion1 || "—" }}</div>
                      <div><strong>Equipo:</strong> {{ e.equipo || "—" }}</div>
                      <div><strong>Localización:</strong> {{ e.localizacion || "—" }}</div>
                      <div><strong>Marca:</strong> {{ e.marca || "—" }}</div>
                      <div><strong>Modelo:</strong> {{ e.modelo || "—" }}</div>
                      <div><strong>N° Chasis:</strong> {{ e.numero_chasis || "—" }}</div>
                    </div>
                  </div>

                  <div class="ms-3">
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">Copiar</button>
                  </div>
                </div>
              </div>
            </div>

            <nav v-if="totalPages > 1" class="mt-3">
              <ul class="pagination justify-content-center mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button type="button" class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Anterior">«</button>
                </li>
                <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                  <button type="button" class="page-link" @click="goToPage(n)">{{ n }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button type="button" class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages " aria-label="Siguiente">»</button>
                </li>
              </ul>
            </nav>

            <div class="mt-2 small text-secondary" v-if="equiposLoaded && equiposAll.length">Base cargada: {{ equiposAll.length }} equipos.</div>
          </div>

          <div class="oc-footer">
            <button type="button" class="btn btn-outline-secondary" @click="cerrarEquiposMobile">Cerrar</button>
          </div>
        </div>
      </div>
    </transition>

    <button
      type="button"
      class="btn btn-primary floating-equipos-btn d-lg-none"
      @click="toggleEquiposResponsive"
      :title="showEquiposMobile ? 'Ocultar búsqueda de equipos' : 'Buscar equipos'"
      aria-label="Abrir buscador de equipos"
    >
      <i class="bi bi-search"></i>
    </button>

    <div v-if="modalCentroAbierto" class="vmodal-backdrop" @click.self="modalCentroAbierto = false">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Selecciona Centro de Costo</h5>
        </div>
        <div class="vmodal-body">
          <div class="input-group mb-2">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              class="form-control"
              placeholder="Buscar contrato o código…"
              v-model="filtroCentro"
              @keydown.enter.prevent="onEnterCentro"
            />
          </div>

          <div v-if="!(filtroCentro || '').trim()" class="small text-secondary mb-2">
            Escribe o elige un centro de costo de la lista.
          </div>

          <div v-if="(filtroCentro || '').trim() && centrosFiltrados.length === 0" class="alert alert-warning py-2">
            No se encontró ningún centro. Escribe o elige un centro de costo.
          </div>

          <div class="list-group vmodal-list">
            <button
              type="button"
              class="list-group-item list-group-item-action"
              v-for="c in centrosFiltrados"
              :key="c.key"
              @click="seleccionarCentro(c); modalCentroAbierto = false"
            >
              <div class="fw-semibold">{{ c.key }}</div>
              <div class="small text-secondary">{{ c.name }}</div>
            </button>
          </div>
        </div>
        <div class="vmodal-footer">
          <button type="button" class="btn btn-outline-secondary" @click="modalCentroAbierto = false">Cerrar</button>
        </div>
      </div>
    </div>
    <div
      v-if="modalProveedorAbierto"
      class="vmodal-backdrop"
      @click.self="modalProveedorAbierto = false"
    >
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Selecciona Proveedor</h5>
        </div>

        <div class="vmodal-body">
          <div class="input-group mb-2">
            <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span>
            <input
              class="form-control"
              placeholder="Buscar por nombre o RUT…"
              v-model="proveedorBusqueda"
              @input="buscarProveedores"
              @keydown.enter.prevent="onEnterProveedor"
            />
          </div>

          <div v-if="!(proveedorBusqueda || '').trim()" class="small text-secondary mb-2">
            Escribe el nombre o RUT del proveedor.
          </div>

          <div v-if="proveedoresBuscando" class="text-center py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <div class="small mt-2">Buscando proveedor…</div>
          </div>

          <div
            v-else-if="(proveedorBusqueda || '').trim() && proveedoresResultados.length === 0"
            class="alert alert-warning py-2 mb-0"
          >
            Ese proveedor aún no está agregado.
          </div>

          <div
            v-else-if="proveedoresResultados.length"
            class="list-group vmodal-list proveedor-list"
          >
            <button
              type="button"
              class="list-group-item list-group-item-action proveedor-item"
              v-for="prov in proveedoresResultados"
              :key="prov.id"
              @click="seleccionarProveedor(prov)"
            >
              <div class="d-flex align-items-start gap-2">
                <div class="provider-result-icon">
                  <i class="bi bi-building"></i>
                </div>

                <div class="flex-grow-1 minw-0 text-start">
                  <div class="fw-semibold text-truncate">{{ prov.nombre }}</div>
                  <div class="small text-secondary">RUT: {{ prov.rut || "—" }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="vmodal-footer">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="modalProveedorAbierto = false"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i
          class="me-2"
          :class="t.type === 'success' ? 'bi bi-check-circle-fill' : (t.type === 'warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"
        ></i>
        <span class="me-3">{{ t.text }}</span>
        <button type="button" class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
    <div v-if="modalCrucePrecios" class="vmodal-backdrop" @click.self="cerrarCrucePrecios">
      <div class="vmodal vmodal-xxl">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="mb-0">Cruce de precios</h4>
            <div class="small text-secondary">
              Selecciona los ítems que quieres comparar. Funciona con SOLPED y también sin SOLPED.
            </div>
          </div>

          <button type="button" class="btn btn-outline-secondary btn-sm" @click="cerrarCrucePrecios">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="vmodal-body">
          <div class="row g-3">
            <!-- COLUMNA IZQUIERDA -->
            <div class="col-12 col-xl-4">
              <div class="card h-100 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div class="fw-semibold">Ítems a cruzar</div>

                  <button
                    type="button"
                    class="btn btn-sm btn-outline-dark"
                    @click="agregarItemManualCruce"
                  >
                    <i class="bi bi-plus-lg me-1"></i>
                    Agregar ítem manual
                  </button>
                </div>

                <div class="card-body">
                  <div v-if="itemsCruceBase.length" class="mb-3">
                    <div class="small text-secondary mb-2">
                      Ítems pendientes/parciales disponibles
                    </div>

                    <div class="list-group cruce-items-list-scroll">
                      <label
                        v-for="it in itemsCruceBase"
                        :key="it.uid"
                        class="list-group-item d-flex align-items-start gap-2"
                      >
                        <input
                          class="form-check-input mt-1"
                          type="checkbox"
                          :value="it.uid"
                          v-model="selectedCruceKeys"
                        />

                        <div class="flex-grow-1 minw-0">
                          <div class="fw-semibold">{{ it.descripcion || "Ítem" }}</div>
                          <div class="small text-secondary">
                            Código: {{ it.codigo_referencial || "SIN CÓDIGO" }} ·
                            N° interno: {{ it.numero_interno || "—" }} ·
                            Estado: {{ it.estado_cotizacion || it.estado || "—" }}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div v-if="manualCruceItems.length">
                    <div class="small text-secondary mb-2">Ítems manuales</div>

                    <div class="cruce-items-list-scroll">
                      <div
                        v-for="(it, idx) in manualCruceItems"
                        :key="it.uid"
                        class="border rounded p-2 mb-2 bg-light"
                      >
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <div class="fw-semibold">Manual {{ idx + 1 }}</div>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            @click="eliminarItemManualCruce(it.uid)"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>

                        <div class="form-check mb-2">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :value="it.uid"
                            v-model="selectedCruceKeys"
                            :id="`sel-manual-${it.uid}`"
                          />
                          <label class="form-check-label" :for="`sel-manual-${it.uid}`">
                            Usar en cruce
                          </label>
                        </div>

                        <div class="mb-2">
                          <label class="form-label form-label-sm">Descripción</label>
                          <input v-model="it.descripcion" class="form-control form-control-sm" />
                        </div>

                        <div class="row g-2">
                          <div class="col-6">
                            <label class="form-label form-label-sm">Código</label>
                            <input v-model="it.codigo_referencial" class="form-control form-control-sm" />
                          </div>
                          <div class="col-6">
                            <label class="form-label form-label-sm">N° interno</label>
                            <input v-model="it.numero_interno" class="form-control form-control-sm" />
                          </div>
                        </div>

                        <div class="mt-2">
                          <label class="form-label form-label-sm">Cantidad</label>
                          <input v-model.number="it.cantidad" type="number" min="1" class="form-control form-control-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="!itemsCruceBase.length && !manualCruceItems.length" class="alert alert-warning mb-0">
                    No hay ítems disponibles. Puedes agregar uno manualmente.
                  </div>
                </div>

                <div class="card-footer bg-white d-flex gap-2 flex-wrap">

                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="limpiarCruceManual"
                  >
                    Limpiar comparación
                  </button>
                </div>
              </div>
            </div>

            <!-- COLUMNA DERECHA -->
            <div class="col-12 col-xl-8">
              <div class="card h-100 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <div class="fw-semibold">Comparación manual por proveedor</div>
                    <div class="small text-secondary">
                      Ítems seleccionados: {{ selectedCruceItems.length }} · Navegación rápida por ítem · PDF listo para adjuntar al final
                    </div>
                  </div>
                </div>
                <div class="card-body border-bottom bg-body-tertiary">
                  <div class="row g-2 small">
                    <div class="col-12 col-md-3">
                      <div class="text-secondary">Ítems con mejor opción</div>
                      <div class="fw-semibold">{{ resumenCruce.itemsConsiderados }}</div>
                    </div>
                    <div class="col-12 col-md-3">
                      <div class="text-secondary">Subtotal</div>
                      <div class="fw-semibold">
                        {{ formatMoneySmart(resumenCruce.subtotal, monedaSeleccionada || "CLP") }}
                      </div>
                    </div>
                    <div class="col-12 col-md-3">
                      <div class="text-secondary">IVA (19%)</div>
                      <div class="fw-semibold">
                        {{ formatMoneySmart(resumenCruce.iva, monedaSeleccionada || "CLP") }}
                      </div>
                    </div>
                    <div class="col-12 col-md-3">
                      <div class="text-secondary">Total con IVA</div>
                      <div class="fw-semibold text-danger">
                        {{ formatMoneySmart(resumenCruce.totalConIVA, monedaSeleccionada || "CLP") }}
                      </div>
                    </div>
                  </div>
                </div>
                  <div class="card-body cruce-body-scroll">
                    <div v-if="!cruceManualItems.length" class="text-center text-secondary py-5">
                      Selecciona uno o más ítems y presiona <strong>Preparar cruce</strong>.
                    </div>

                    <div v-else-if="activeCruceItem" class="d-flex flex-column gap-3">
                      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="fw-semibold">
                          Ítem {{ cruceManualIndex + 1 }} de {{ totalCruceItems }}
                        </div>

                        <div class="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            @click="goCrucePrev"
                            :disabled="cruceManualIndex === 0"
                          >
                            <i class="bi bi-arrow-left me-1"></i>
                            Anterior
                          </button>

                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            @click="guardarYSiguienteCruce"
                          >
                            Guardar y seguir
                            <i class="bi bi-arrow-right ms-1"></i>
                          </button>

                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            @click="goCruceNext"
                            :disabled="cruceManualIndex >= totalCruceItems - 1"
                          >
                            Siguiente
                            <i class="bi bi-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </div>

                      <div class="card border shadow-sm">
                        <div class="card-header bg-light d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <div class="fw-semibold">{{ activeCruceItem.descripcion || "Ítem" }}</div>
                            <div class="small text-secondary">
                              Código: {{ activeCruceItem.codigo_referencial || "SIN CÓDIGO" }} ·
                              N° interno: {{ activeCruceItem.numero_interno || "—" }}
                            </div>
                          </div>

                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            @click="agregarProveedorACruce(activeCruceItem.uid)"
                          >
                            <i class="bi bi-plus-lg me-1"></i>
                            Agregar proveedor
                          </button>
                        </div>

                        <div class="card-body border-bottom bg-body-tertiary">
                          <div class="row g-2 small">
                            <div class="col-6 col-md-3">
                              <div class="text-secondary">Cant. total</div>
                              <div class="fw-semibold">{{ activeCruceItem.cantidadTotal }}</div>
                            </div>
                            <div class="col-6 col-md-3">
                              <div class="text-secondary">Cotizado antes</div>
                              <div class="fw-semibold">{{ activeCruceItem.cotizadoAntes }}</div>
                            </div>
                            <div class="col-6 col-md-3">
                              <div class="text-secondary">Máx. permitido</div>
                              <div class="fw-semibold text-danger">{{ activeCruceItem.maxPermitido }}</div>
                            </div>
                            <div class="col-6 col-md-3">
                              <div class="text-secondary">Restante</div>
                              <div class="fw-semibold text-primary">{{ activeCruceItem.restante }}</div>
                            </div>
                          </div>
                        </div>

                        <div class="card-body p-0">
                          <div class="table-responsive cruce-table-scroll">
                            <table class="table table-sm align-middle mb-0">
                              <thead class="table-light">
                                <tr>
                                  <th style="width: 60px;" class="text-center">★</th>
                                  <th>Proveedor</th>
                                  <th style="width: 140px;" class="text-center">Cantidad</th>
                                  <th style="width: 180px;" class="text-end">Precio unitario</th>
                                  <th style="width: 180px;" class="text-end">Total</th>
                                  <th style="width: 90px;" class="text-center">Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  v-for="op in activeCruceItem.opciones"
                                  :key="op.uid"
                                  :class="{ 'table-warning': op.esMejor }"
                                >
                                  <td class="text-center">
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-star-choice"
                                      :class="{ active: op.esMejor }"
                                      title="Marcar como opción recomendada"
                                      @click="marcarProveedorMejor(activeCruceItem.uid, op.uid)"
                                    >
                                      {{ op.esMejor ? "★" : "☆" }}
                                    </button>
                                  </td>

                                  <td>
                                    <div class="proveedor-field">
                                      <div class="input-group input-group-sm">
                                        <input
                                          v-model="op.proveedor"
                                          class="form-control form-control-sm"
                                          placeholder="Nombre proveedor"
                                          @input="onProveedorInput(activeCruceItem.uid, op.uid)"
                                          @blur="onProveedorBlur(activeCruceItem.uid, op.uid)"
                                        />
                                        <button
                                          v-if="String(op.proveedor || '').trim()"
                                          type="button"
                                          class="btn btn-outline-danger"
                                          title="Limpiar nombre"
                                          @click="limpiarNombreProveedor(activeCruceItem.uid, op.uid)"
                                        >
                                          <i class="bi bi-x-lg"></i>
                                        </button>
                                      </div>

                                      <div
                                        v-if="proveedoresReutilizables.length"
                                        class="d-flex flex-wrap gap-1 mt-2"
                                      >
                                        <button
                                          v-for="nombre in proveedoresReutilizablesFiltrados(op.proveedor)"
                                          :key="`${op.uid}-${nombre}`"
                                          type="button"
                                          class="btn btn-sm btn-outline-secondary proveedor-chip"
                                          @click="reutilizarNombreProveedor(activeCruceItem.uid, op.uid, nombre)"
                                        >
                                          {{ nombre }}
                                        </button>
                                      </div>
                                    </div>
                                  </td>

                                  <td class="text-center">
                                    <input
                                      v-model.number="activeCruceItem.cantidad"
                                      type="number"
                                      min="1"
                                      :max="activeCruceItem.maxPermitido || 1"
                                      class="form-control form-control-sm text-center"
                                      @input="recalcularTotalesItemCruce(activeCruceItem.uid); syncCantidadCruceToSolpedItem(activeCruceItem)"
                                    />
                                    <div class="form-text mb-0">
                                      Máx: {{ activeCruceItem.maxPermitido }} · Restante: {{ activeCruceItem.restante }}
                                    </div>
                                  </td>

                                  <td>
                                    <input
                                      v-model.number="op.precioUnitario"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      class="form-control form-control-sm text-end"
                                      placeholder="0"
                                      @input="recalcularTotalesItemCruce(activeCruceItem.uid)"
                                    />
                                  </td>

                                  <td class="text-end fw-semibold">
                                    {{ formatMoneySmart(op.total, monedaSeleccionada || "CLP") }}
                                  </td>

                                  <td class="text-center">
                                    <button
                                      type="button"
                                      class="btn btn-sm btn-outline-danger"
                                      @click="eliminarProveedorDeCruce(activeCruceItem.uid, op.uid)"
                                    >
                                      <i class="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                <div class="card-footer bg-white d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    type="button"
                    class="btn btn-danger"
                    @click="generarPdfCruceManual"
                    :disabled="!cruceManualItems.length"
                  >
                    <i class="bi bi-file-earmark-pdf me-1"></i>
                    Generar PDF y aplicar cruce
                  </button>

                  <button type="button" class="btn btn-outline-secondary" @click="cerrarCrucePrecios">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="busy.on" class="busy-overlay" role="alert" aria-live="polite">
      <div class="busy-card shadow">
        <div class="d-flex align-items-center gap-3">
          <div class="spinner-border text-danger" role="status" aria-label="Cargando"></div>

          <div class="flex-grow-1">
            <div class="fw-semibold">{{ busy.label }}</div>
            <div class="text-muted small" v-if="busy.hint">{{ busy.hint }}</div>

            <div class="progress mt-2" style="height: 10px" v-if="busy.progress !== null">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                :style="{ width: busy.progress + '%' }"
              ></div>
            </div>
          </div>

          <div class="fw-semibold" v-if="busy.progress !== null">{{ busy.progress }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { db } from "../stores/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  runTransaction,
  startAt,
  endAt
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";
const modalCrucePrecios = ref(false);


const manualCruceItems = ref([]);
const selectedCruceKeys = ref([]);
const cruceManualItems = ref([]);
const router = useRouter();
const route = useRoute();
const volver = () => router.back();
const auth = useAuthStore();
const dragOverArchivos = ref(false);
let dragCounterArchivos = 0;
const busy = reactive({
  on: false,
  label: "Procesando…",
  hint: "",
  progress: null,
});
const setBusy = (on, label = "Procesando…", hint = "", progress = null) => {
  busy.on = on;
  busy.label = label;
  busy.hint = hint;
  busy.progress = progress;
};

const userRole = ref("");
const totalAprobadasDelUsuario = ref(0);
const aprobadasState = reactive({
  loading: false,
  ok: false,
  error: null,
  lastCheckedAt: null,
});

const normalizePlain = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizarRut = (v) =>
  String(v || "")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();

const normalizarTextoBusqueda = (v) =>
  String(v || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const limpiarProveedorSeleccionado = () => {
  proveedorSeleccionado.value = null;
};

const seleccionarProveedor = (prov) => {
  proveedorSeleccionado.value = {
    id: prov.id,
    nombre: prov.nombre || "",
    rut: prov.rut || "",
  };
  modalProveedorAbierto.value = false;
  proveedorBusqueda.value = "";
  proveedoresResultados.value = [];
  clearInvalidField?.("proveedor");
};
const buscarProveedores = async () => {
  const raw = String(proveedorBusqueda.value || "").trim();

  if (!raw) {
    proveedoresResultados.value = [];
    return;
  }

  proveedoresBuscando.value = true;

  try {
    const texto = normalizarTextoBusqueda(raw);
    const rutPlano = normalizarRut(raw);

    const resultadosMap = new Map();

    try {
      const qNombre = query(
        collection(db, "proveedores"),
        orderBy("nombre"),
        startAt(raw),
        endAt(raw + "\uf8ff"),
        limit(8)
      );

      const snapNombre = await getDocs(qNombre);
      snapNombre.forEach((d) => {
        const data = d.data() || {};
        resultadosMap.set(d.id, {
          id: d.id,
          nombre: data.nombre || "",
          rut: data.rut || "",
        });
      });
    } catch (e) {
      console.warn("Búsqueda por nombre proveedor:", e);
    }


    try {
      const qBase = query(
        collection(db, "proveedores"),
        orderBy("nombre"),
        limit(300)
      );

      const snapBase = await getDocs(qBase);
      snapBase.forEach((d) => {
        const data = d.data() || {};
        const nombre = String(data.nombre || "");
        const rut = String(data.rut || "");

        const nombreNorm = normalizarTextoBusqueda(nombre);
        const rutNorm = normalizarRut(rut);

        const coincideNombre =
          texto && nombreNorm.includes(texto);

        const coincideRut =
          rutPlano && rutNorm.includes(rutPlano);

        if (coincideNombre || coincideRut) {
          resultadosMap.set(d.id, {
            id: d.id,
            nombre,
            rut,
          });
        }
      });
    } catch (e) {
      console.warn("Búsqueda base proveedor:", e);
    }

    proveedoresResultados.value = Array.from(resultadosMap.values())
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));
  } catch (error) {
    console.error("Error buscando proveedores:", error);
    addToast("danger", "No se pudieron buscar los proveedores.");
    proveedoresResultados.value = [];
  } finally {
    proveedoresBuscando.value = false;
  }
};
const onEnterProveedor = async () => {
  await buscarProveedores();

  if (proveedoresResultados.value.length === 1) {
    seleccionarProveedor(proveedoresResultados.value[0]);
  }
};

const num = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const itemIdentityKey = (it) => {
  const itemN = num(it?.item, 0);
  const ni = String(it?.numero_interno || "").trim();
  const desc = normalizePlain(it?.descripcion || "");
  return `${itemN}|${ni}|${desc}`;
};
const buildProveedorUid = () =>
  `prov-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getCantidadItemCruce = (item) => {
  const total = Math.max(0, Number(item?.cantidad ?? 0));
  const cotizadoAntes = Math.max(0, Number(item?.cantidad_cotizada ?? 0));
  const disponible = Math.max(0, total - cotizadoAntes);

  if (disponible <= 0) return 0;

  const manual = Number(item?.cantidad_para_cotizar ?? 0);
  if (Number.isFinite(manual) && manual > 0) {
    return Math.min(manual, disponible);
  }

  return disponible;
};

const crearOpcionProveedor = (nombre = "") => ({
  uid: buildProveedorUid(),
  proveedor: nombre,
  precioUnitario: 0,
  total: 0,
  observacion: "",
  esMejor: false,
});

const crearCruceManualDesdeItem = (item) => {
  const cantidadTotal = Number(item?.cantidad ?? 0);
  const cotizadoAntes = Number(item?.cantidad_cotizada ?? 0);
  const maxPermitido = Math.max(0, cantidadTotal - cotizadoAntes);

  const cantidadInicialRaw = Number(item?.cantidad_para_cotizar ?? 0);

  const cantidadInicial =
    maxPermitido > 0
      ? Math.min(Math.max(0, cantidadInicialRaw), maxPermitido)
      : 0;

  return {
    uid: item.uid,
    descripcion: item.descripcion || "",
    codigo_referencial: item.codigo_referencial || "",
    numero_interno: item.numero_interno || "",
    cantidadTotal,
    cotizadoAntes,
    maxPermitido,
    restante: Math.max(0, maxPermitido - cantidadInicial),
    cantidad: cantidadInicial,
    opciones: [
      crearOpcionProveedor(""),
      crearOpcionProveedor(""),
    ],
  };
};
const cruceManualIndex = ref(0);

const activeCruceItem = computed(() => {
  return cruceManualItems.value[cruceManualIndex.value] || null;
});

const totalCruceItems = computed(() => cruceManualItems.value.length);
const onInputCantidad = (it) => {
  clampCantidadParaCotizar(it);
};
const clampCantidadCruceManual = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const cantidadTotal = Math.max(0, Number(item.cantidadTotal || 0));
  const cotizadoAntes = Math.max(0, Number(item.cotizadoAntes || 0));
  const max = Math.max(0, cantidadTotal - cotizadoAntes);

  item.maxPermitido = max;

  let cantidad = Number(item.cantidad || 0);

  if (!Number.isFinite(cantidad)) cantidad = 0;
  if (cantidad < 0) cantidad = 0;
  if (cantidad > max) cantidad = max;

  item.cantidad = cantidad;
  item.restante = Math.max(0, max - cantidad);
};

const goCrucePrev = () => {
  if (cruceManualIndex.value > 0) {
    cruceManualIndex.value -= 1;
  }
};

const goCruceNext = () => {
  if (cruceManualIndex.value < cruceManualItems.value.length - 1) {
    cruceManualIndex.value += 1;
  }
};

const guardarYSiguienteCruce = () => {
  const item = activeCruceItem.value;
  if (!item) return;

  clampCantidadCruceManual(item.uid);
  recalcularTotalesItemCruce(item.uid);

  syncCantidadCruceToSolpedItem(item);

  if (cruceManualIndex.value < cruceManualItems.value.length - 1) {
    cruceManualIndex.value += 1;
    addToast("success", "Ítem guardado. Cantidad sincronizada con la SOLPED.");
  } else {
    addToast("success", "Último ítem del cruce completado.");
  }
};

const syncCruceManualItems = () => {
  const seleccionados = selectedCruceItems.value || [];
  const actuales = cruceManualItems.value || [];

  const nuevos = seleccionados.map((it) => {
    const existe = actuales.find((x) => x.uid === it.uid);

    const cantidadTotal = Number(it?.cantidad ?? 0);
    const cotizadoAntes = Number(it?.cantidad_cotizada ?? 0);
    const maxPermitido = Math.max(0, cantidadTotal - cotizadoAntes);

    if (existe) {
      existe.descripcion = it.descripcion || existe.descripcion;
      existe.codigo_referencial = it.codigo_referencial || existe.codigo_referencial;
      existe.numero_interno = it.numero_interno || existe.numero_interno;
      existe.cantidadTotal = cantidadTotal;
      existe.cotizadoAntes = cotizadoAntes;
      existe.maxPermitido = maxPermitido;

      if (!Number.isFinite(Number(existe.cantidad)) || Number(existe.cantidad) <= 0) {
        existe.cantidad = getCantidadItemCruce(it);
      }

      clampCantidadCruceManual(existe.uid);
      recalcularTotalesItemCruce(existe.uid);
      recalcularMejorOpcion(existe.uid);
      return existe;
    }

    const nuevo = crearCruceManualDesdeItem(it);
    clampCantidadCruceManual(nuevo.uid);
    return nuevo;
  });

  cruceManualItems.value = nuevos;

  if (cruceManualIndex.value > cruceManualItems.value.length - 1) {
    cruceManualIndex.value = Math.max(0, cruceManualItems.value.length - 1);
  }
};

const agregarProveedorACruce = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  item.opciones.push(crearOpcionProveedor(""));
};

const normalizarProveedorNombre = (s) =>
  String(s || "").replace(/\s+/g, " ").trim();

const normalizarProveedorNombreSuave = (s) =>
  String(s || "").replace(/\s{2,}/g, " ");

const proveedoresReutilizables = computed(() => {
  const usados = new Map();

  for (const item of cruceManualItems.value || []) {
    for (const op of item.opciones || []) {
      const nombre = normalizarProveedorNombre(op.proveedor);
      if (!nombre) continue;

      const key = nombre.toLowerCase();
      if (!usados.has(key)) {
        usados.set(key, nombre);
      }
    }
  }

  return Array.from(usados.values());
});

const proveedoresReutilizablesFiltrados = (actual = "") => {
  const actualNorm = normalizarProveedorNombre(actual).toLowerCase();

  return proveedoresReutilizables.value.filter((nombre) => {
    return nombre.toLowerCase() !== actualNorm;
  });
};

const reutilizarNombreProveedor = (itemUid, opcionUid, nombre) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = normalizarProveedorNombre(nombre);
};

const limpiarNombreProveedor = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = "";
};

const onProveedorInput = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = normalizarProveedorNombreSuave(op.proveedor);
};

const onProveedorBlur = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = normalizarProveedorNombre(op.proveedor);
};

const eliminarProveedorDeCruce = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const borrada = item.opciones.find((x) => x.uid === opcionUid);
  item.opciones = item.opciones.filter((x) => x.uid !== opcionUid);

  if (borrada?.esMejor) {
    item.opciones.forEach((op) => {
      op.esMejor = false;
    });
  }
};

const recalcularTotalesItemCruce = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  clampCantidadCruceManual(itemUid);

  const cantidad = Number(item.cantidad || 0);

  item.opciones.forEach((op) => {
    const pu = Number(op.precioUnitario || 0);
    op.total = pu > 0 && cantidad > 0 ? pu * cantidad : 0;
  });

  recalcularMejorOpcion(itemUid);
};

const recalcularMejorOpcion = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const validas = getOpcionesValidasCruce(item);
  if (!validas.length) {
    item.opciones.forEach((op) => {
      op.esMejor = false;
    });
    return;
  }

  const tieneMarcada = validas.some((op) => op.esMejor);
  if (tieneMarcada) return;

  let masBarata = validas[0];
  for (const op of validas) {
    if (Number(op.total || 0) < Number(masBarata.total || 0)) {
      masBarata = op;
    }
  }

  item.opciones.forEach((op) => {
    op.esMejor = op.uid === masBarata.uid;
  });
};
const marcarProveedorMejor = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  item.opciones.forEach((op) => {
    op.esMejor = op.uid === opcionUid;
  });

  recalcularTotalesItemCruce(itemUid);
};
const limpiarCruceManual = () => {
  cruceManualItems.value = [];
  manualCruceItems.value = [];
  selectedCruceKeys.value = [];
};


const validarCruceManual = () => {
  if (!cruceManualItems.value.length) {
    addToast("warning", "No hay cruce manual para generar.");
    return false;
  }

  for (const item of cruceManualItems.value) {
    const tieneUnaValida = item.opciones.some((op) => {
      const proveedor = String(op.proveedor || "").trim();
      const pu = Number(op.precioUnitario || 0);
      return proveedor && pu > 0;
    });

    if (!tieneUnaValida) {
      addToast("warning", `El ítem "${item.descripcion || item.uid}" no tiene proveedores válidos.`);
      return false;
    }
  }

  return true;
};
async function generarPdfCruceManual() {
  if (!validarCruceManual()) return;

  aplicarCruceAPrecioYItems({ showToast: true, closeModal: false });

  const maxProveedores = Math.max(
    1,
    ...cruceManualItems.value.map((item) => getOpcionesValidasCruce(item).length || 0)
  );

  const usarLandscape = maxProveedores >= 3;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF({
    orientation: usarLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = maxProveedores >= 5 ? 14 : 24;

  const colorRojo = [220, 38, 38];
  const colorRojoSuave = [254, 242, 242];
  const colorGrisTexto = [75, 85, 99];
  const colorGrisLinea = [229, 231, 235];
  const colorVerdeSuave = [240, 253, 244];
  const colorNegro = [17, 24, 39];
  const colorBlanco = [255, 255, 255];
  const colorAzulSuave = [239, 246, 255];

  let y = 34;

  const drawHeader = () => {
    pdf.setFillColor(...colorRojo);
    pdf.roundedRect(marginX, 20, pageWidth - marginX * 2, 54, 12, 12, "F");

    pdf.setTextColor(...colorBlanco);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Cruce de precios", marginX + 16, 44);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Comparación consolidada por ítem y proveedor", marginX + 16, 62);

    y = 92;
  };

  const ensureSpace = (needed = 120) => {
    if (y + needed > pageHeight - 35) {
      pdf.addPage();
      drawHeader();
    }
  };

  const shortenText = (txt, max = 28) => {
    const s = String(txt || "").trim();
    if (!s) return "—";
    if (s.length <= max) return s;
    return `${s.slice(0, max - 3)}...`;
  };

  const makeProveedorHeaders = (count) => {
    const headers = [];
    for (let i = 0; i < count; i++) {
      headers.push(`Proveedor ${i + 1}`);
      headers.push("Total");
    }
    return headers;
  };

  drawHeader();

  // ===== RESUMEN GENERAL =====
  ensureSpace(95);

  pdf.setFillColor(...colorRojoSuave);
  pdf.setDrawColor(...colorGrisLinea);
  pdf.roundedRect(marginX, y, pageWidth - marginX * 2, 58, 10, 10, "FD");

  pdf.setTextColor(...colorNegro);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Resumen general", marginX + 14, y + 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colorGrisTexto);

  const totalCantidad = cruceManualItems.value.reduce(
    (acc, item) => acc + Number(item?.cantidad || 0),
    0
  );

  const totalCotizadoAntes = cruceManualItems.value.reduce(
    (acc, item) => acc + Number(item?.cotizadoAntes || 0),
    0
  );

  pdf.text(`Ítems: ${cruceManualItems.value.length}`, marginX + 14, y + 36);
  pdf.text(`Cantidad total cotizada: ${totalCantidad}`, marginX + 130, y + 36);
  pdf.text(`Cotizado antes: ${totalCotizadoAntes}`, marginX + 310, y + 36);

  y += 74;

  // ===== TABLA =====
  const head = [[
    "Ítems",
    "Cantidad",
    ...makeProveedorHeaders(maxProveedores),
  ]];

  const body = cruceManualItems.value.map((item) => {
    const opcionesValidas = getOpcionesValidasCruce(item);

    const row = [
      item.descripcion || "Sin descripción",
      String(item.cantidad || 0),
    ];

    for (let i = 0; i < maxProveedores; i++) {
      const op = opcionesValidas[i];

      if (op) {
        row.push(shortenText(op.proveedor || "—", maxProveedores >= 5 ? 14 : 24));
        row.push(formatMoneySmart(op.total, monedaSeleccionada.value || "CLP"));
      } else {
        row.push("—");
        row.push("—");
      }
    }

    return row;
  });

  // ===== ANCHOS DINÁMICOS =====
  const availableWidth = pageWidth - marginX * 2;

  let itemColWidth = usarLandscape ? 150 : 125;
  let qtyColWidth = 52;

  if (maxProveedores >= 5) {
    itemColWidth = 110;
    qtyColWidth = 42;
  }

  const remainingWidth = availableWidth - itemColWidth - qtyColWidth;
  const pairWidth = Math.max(72, remainingWidth / maxProveedores);

  const providerWidth = Math.max(42, pairWidth * 0.58);
  const totalWidth = Math.max(30, pairWidth * 0.42);

  const baseFontSize =
    maxProveedores >= 7 ? 5.8 :
    maxProveedores >= 6 ? 6.2 :
    maxProveedores >= 5 ? 6.8 :
    maxProveedores >= 4 ? 7.2 :
    8;

  const headFontSize =
    maxProveedores >= 7 ? 5.6 :
    maxProveedores >= 6 ? 6 :
    maxProveedores >= 5 ? 6.4 :
    maxProveedores >= 4 ? 6.8 :
    8;

  const cellPadding =
    maxProveedores >= 6 ? 2.2 :
    maxProveedores >= 4 ? 3 :
    5;

  const columnStyles = {
    0: { cellWidth: itemColWidth },
    1: { cellWidth: qtyColWidth, halign: "center" },
  };

  for (let i = 0; i < maxProveedores; i++) {
    const provCol = 2 + i * 2;
    const totalCol = provCol + 1;

    columnStyles[provCol] = {
      cellWidth: providerWidth,
      halign: "left",
    };

    columnStyles[totalCol] = {
      cellWidth: totalWidth,
      halign: "right",
    };
  }

  autoTable(pdf, {
    startY: y,
    head,
    body,
    margin: { left: marginX, right: marginX },
    theme: "grid",
    tableWidth: "auto",
    styles: {
      fontSize: baseFontSize,
      cellPadding,
      lineColor: colorGrisLinea,
      lineWidth: 0.6,
      textColor: colorNegro,
      overflow: "linebreak",
      valign: "middle",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: colorRojo,
      textColor: colorBlanco,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: headFontSize,
    },
    bodyStyles: {
      fillColor: colorBlanco,
    },
    columnStyles,
    horizontalPageBreak: maxProveedores >= 6,
    horizontalPageBreakRepeat: [0, 1],

    didParseCell: function (data) {
      if (data.section !== "body") return;

      const rowIndex = data.row.index;
      const item = cruceManualItems.value[rowIndex];
      if (!item) return;

      const opcionesValidas = getOpcionesValidasCruce(item);

      for (let i = 0; i < maxProveedores; i++) {
        const op = opcionesValidas[i];
        if (!op?.esMejor) continue;

        const provCol = 2 + i * 2;
        const totalCol = provCol + 1;

        if (data.column.index === provCol || data.column.index === totalCol) {
          data.cell.styles.fillColor = colorVerdeSuave;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = pdf.lastAutoTable.finalY + 20;

  ensureSpace(100);

  pdf.setFillColor(...colorAzulSuave);
  pdf.setDrawColor(...colorGrisLinea);
  pdf.roundedRect(marginX, y, pageWidth - marginX * 2, 92, 10, 10, "FD");

  pdf.setTextColor(...colorNegro);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Resumen", marginX + 16, y + 22);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  pdf.text(
    `Subtotal: ${formatMoneySmart(resumenCruce.value.subtotal, monedaSeleccionada.value || "CLP")}`,
    marginX + 16,
    y + 46
  );

  pdf.text(
    `IVA (19%): ${formatMoneySmart(resumenCruce.value.iva, monedaSeleccionada.value || "CLP")}`,
    marginX + 16,
    y + 64
  );

  pdf.setFont("helvetica", "bold");
  pdf.text(
    `Total con IVA: ${formatMoneySmart(resumenCruce.value.totalConIVA, monedaSeleccionada.value || "CLP")}`,
    marginX + 16,
    y + 82
  );

  const pdfBlob = pdf.output("blob");
  const fileName = `cruce_precios_${Date.now()}.pdf`;
  const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

  archivos.value.unshift({
    file: pdfFile,
    name: pdfFile.name,
    tipo: pdfFile.type,
    previewUrl: URL.createObjectURL(pdfFile),
    generatedCruce: true,
    __k: `${pdfFile.name}-${pdfFile.size}-${Date.now()}-${Math.random()}`,
  });

  addToast("success", "PDF del cruce agregado a archivos. También se actualizó total con IVA y cantidades.");
  cerrarCrucePrecios();
}

const normalizarEstadoCantidades = ({ total, cotizada }) => {
  const t = Math.max(0, num(total, 0));
  const cRaw = Math.max(0, num(cotizada, 0));
  const c = t > 0 ? Math.min(cRaw, t) : cRaw;

  if (t <= 0) {
    return {
      finalCotizada: c,
      estado_cotizacion: c > 0 ? "revisión" : "pendiente",
      estado: c > 0 ? "completado" : "pendiente",
    };
  }

  if (c <= 0) {
    return {
      finalCotizada: 0,
      estado_cotizacion: "pendiente",
      estado: "pendiente",
    };
  }

  if (c < t) {
    return {
      finalCotizada: c,
      estado_cotizacion: "revisión",
      estado: "parcial",
    };
  }

  return {
    finalCotizada: t,
    estado_cotizacion: "revisión",
    estado: "completado",
  };
};

const computeEstadoItem = ({ total, antes, nueva }) => {
  const final = num(antes, 0) + num(nueva, 0);
  return normalizarEstadoCantidades({ total, cotizada: final });
};

const clampCantidadParaCotizar = (it) => {
  const total = Math.max(0, num(it?.cantidad, 0));
  const cotizadoAntes = Math.max(0, num(it?.cantidad_cotizada, 0));
  const disponible = Math.max(0, total - cotizadoAntes);

  const raw = num(it?.cantidad_para_cotizar, 0);
  const ajustado = Math.min(Math.max(0, raw), disponible);

  it.__max = disponible;
  it.cantidad_para_cotizar = ajustado;
  it.__restante = Math.max(0, disponible - ajustado);
  it.__invalid = raw !== ajustado;
};


const buildItemsSolpedForUI = (solpedItems = []) => {
  return (solpedItems || [])
    .map((it, idx) => {
      const total = Math.max(0, num(it?.cantidad, 0));
      const cotizadoAntesRaw = Math.max(0, num(it?.cantidad_cotizada, 0));
      const cotizadoAntes = Math.min(cotizadoAntesRaw, total);
      const disponible = Math.max(0, total - cotizadoAntes);

      const itemNormalizado = {
        ...it,
        item: num(it?.item, idx + 1),
        cantidad: total,
        cantidad_cotizada: cotizadoAntes,
        estado: disponible === 0 ? "completado" : (cotizadoAntes > 0 ? "parcial" : "pendiente"),
        estado_cotizacion: disponible === 0 ? "completo" : (cotizadoAntes > 0 ? "parcial" : "pendiente"),
      };

      const baseKey = itemIdentityKey(itemNormalizado);

      return {
        ...itemNormalizado,
        cantidad_para_cotizar: 0,
        __sourceIndex: idx,
        __key: baseKey,
        __k: `${baseKey}|${idx}`,
        __max: disponible,
        __restante: 0,
        __invalid: false,
      };
    })
    .filter((it) => it.__max > 0);
};

const buildSelections = (itemsUI = []) => {
  return (itemsUI || [])
    .map((it) => {
      clampCantidadParaCotizar(it);
      return {
        sourceIndex: num(it.__sourceIndex, -1),
        key: it.__key,
        item: num(it.item, 0),
        numero_interno: String(it.numero_interno || "").trim(),
        descripcion: String(it.descripcion || ""),
        cantidad_para_cotizar: num(it.cantidad_para_cotizar, 0),
      };
    })
    .filter((x) => x.cantidad_para_cotizar > 0);
};

const buildItemsOCFromUI = (itemsUI = []) => {
  const out = [];

  for (const it of itemsUI || []) {
    clampCantidadParaCotizar(it);

    const nueva = num(it.cantidad_para_cotizar, 0);
    if (nueva <= 0) continue;

    const total = num(it.cantidad, 0);
    const antes = num(it.cantidad_cotizada, 0);
    const st = computeEstadoItem({ total, antes, nueva });

    out.push({
      item: num(it.item, 0),
      descripcion: String(it.descripcion || ""),
      cantidad: total,
      cantidad_cotizada_antes: antes,
      cantidad_para_cotizar: nueva,
      cantidad_cotizada: st.finalCotizada,
      codigo_referencial: it.codigo_referencial || "SIN CÓDIGO",
      numero_interno: it.numero_interno || "",
      imagen_url: it.imagen_url ?? null,
      stock: num(it.stock, 0),
      estado: st.estado,
      estado_cotizacion: st.estado_cotizacion,
    });
  }

  return out;
};
const esAprobadoFinal = (estatus) => {
  const k = normalizePlain(estatus);
  return k === "aprobado" || k === "aprobada";
};
const normalizeRole = (s) => normalizePlain(s).replace(/\s+/g, "_");

const aprobadasListo = computed(() =>
  aprobadasState.lastCheckedAt !== null && !aprobadasState.loading
);

const bloqueoPorAprobadas = computed(() => {
  const roleKey = normalizeRole(userRole.value);
  const esEditor = roleKey === "editor";
  if (!esEditor) return false;
  if (!aprobadasListo.value) return false;
  if (!aprobadasState.ok) return true;
  return totalAprobadasDelUsuario.value >= 30;
});

const mostrarBloqueoAprobadas = computed(() => {
  const roleKey = normalizeRole(userRole.value);
  const esEditor = roleKey === "editor";
  if (!esEditor) return false;
  if (!aprobadasListo.value) return false;
  return aprobadasState.ok && totalAprobadasDelUsuario.value >= 30;
});

const enviando = ref(false);
const formDisabled = computed(() => mostrarBloqueoAprobadas.value || enviando.value);

const rangeUltimosDosMeses = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const inicio = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const fin = new Date(y, m + 1, 1, 0, 0, 0, 0);
  return { from: Timestamp.fromDate(inicio), to: Timestamp.fromDate(fin) };
};

const toasts = ref([]);
const addToast = (type, text, timeout = 2800) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

const isDesktop = ref(false);
const showEquiposMobile = ref(false);
const mostrarEquipos = ref(false);

const computeIsDesktop = () => { isDesktop.value = window.innerWidth >= 992; };
const openEquiposMobile = async () => {
  showEquiposMobile.value = true;
  document.documentElement.style.overflow = "hidden";
  await ensureEquiposLoaded();
};
const cerrarEquiposMobile = () => {
  showEquiposMobile.value = false;
  document.documentElement.style.overflow = "";
};
const toggleEquiposResponsive = async () => {
  computeIsDesktop();
  if (isDesktop.value) {
    mostrarEquipos.value = !mostrarEquipos.value;
    if (mostrarEquipos.value) await ensureEquiposLoaded();
  } else {
    if (showEquiposMobile.value) cerrarEquiposMobile();
    else await openEquiposMobile();
  }
};
const onResize = () => {
  const wasOpen = showEquiposMobile.value;
  computeIsDesktop();
  if (isDesktop.value && wasOpen) cerrarEquiposMobile();
};

const busquedaEquipo = ref("");
const cargandoEquipos = ref(false);
const resultadosEquipos = ref([]);
const pageSize = 5;
const currentPage = ref(1);
let debounceTimer = null;
let lastSearchToken = 0;
const cacheResultados = new Map();

const totalPages = computed(() => Math.max(1, Math.ceil(resultadosEquipos.value.length / pageSize)));
const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const pagedEquipos = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return resultadosEquipos.value.slice(start, start + pageSize);
});
const goToPage = (n) => { if (n < 1 || n > totalPages.value) return; currentPage.value = n; };

const SEARCH_FIELDS = [
  "clasificacion1",
  "codigo",
  "equipo",
  "localizacion",
  "marca",
  "modelo",
  "numero_chasis",
  "tipo_equipo",
];

const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const compact = (s) => norm(s).replace(/[^a-z0-9]+/g, "");

const splitTokens = (q) => {
  const parts = norm(q).split(/[^a-z0-9]+/g).filter(Boolean);
  return parts.filter((t) => t.length >= 2);
};

const haystackEquipo = (e) => {
  const s = SEARCH_FIELDS.map((k) => norm(e?.[k])).join(" ");
  return s.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
};

const buildEquipIndexRow = (e) => {
  const h = haystackEquipo(e);
  const tokenSet = new Set(h.split(" ").filter(Boolean));
  return {
    ...e,
    __hay: h,
    __codeCompact: compact(e?.codigo),
    __tokens: tokenSet,
  };
};

const scoreEquipo = (e, qRaw, qTokens, qCompact) => {
  let score = 0;
  if (e.__codeCompact && qCompact && e.__codeCompact === qCompact) score += 3000;
  if (e.__codeCompact && qCompact && e.__codeCompact.includes(qCompact)) score += 900;

  const startsBoost = ["codigo", "numero_chasis", "modelo", "equipo", "marca"];
  for (const k of startsBoost) {
    const v = String(e?.[k] ?? "");
    const hv = norm(v).replace(/[^a-z0-9]+/g, " ").trim();
    if (hv && qRaw && hv.startsWith(norm(qRaw))) score += 700;
  }

  const h = e.__hay || "";
  const qFull = norm(qRaw).replace(/[^a-z0-9]+/g, " ").trim();
  if (qFull && h.includes(qFull)) score += 400;

  for (const t of qTokens) {
    if (e.__tokens?.has(t)) score += 220;
    else if (h.includes(t)) score += 80;
  }

  return score;
};

const equiposAll = ref([]);
const equiposIndex = ref([]);
const equiposLoaded = ref(false);
const equiposLoadingAll = ref(false);

async function ensureEquiposLoaded() {
  if (equiposLoaded.value || equiposLoadingAll.value) return;
  equiposLoadingAll.value = true;
  try {
    const snap = await getDocs(collection(db, "equipos"));
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    equiposAll.value = arr;
    equiposIndex.value = arr.map(buildEquipIndexRow);
    equiposLoaded.value = true;
  } catch (e) {
    console.error("[equipos] load all error:", e);
    equiposAll.value = [];
    equiposIndex.value = [];
    equiposLoaded.value = false;
    addToast("danger", "No se pudieron cargar los equipos (revisa permisos/firestore).");
  } finally {
    equiposLoadingAll.value = false;
  }
}

const aplicarFiltrosEquiposDebounced = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const q = (busquedaEquipo.value || "").trim();
    if (q.length >= 2) buscarEquipos(q);
    else { resultadosEquipos.value = []; currentPage.value = 1; }
  }, 300);
};

const buscarEquipos = async (q) => {
  const qTrim = (q || "").trim();
  const qNorm = norm(qTrim);
  currentPage.value = 1;

  if (qNorm.length < 2) {
    resultadosEquipos.value = [];
    return;
  }

  if (!equiposLoaded.value) await ensureEquiposLoaded();
  if (!equiposLoaded.value) { resultadosEquipos.value = []; return; }

  if (cacheResultados.has(qNorm)) {
    resultadosEquipos.value = cacheResultados.get(qNorm);
    return;
  }

  const token = ++lastSearchToken;
  cargandoEquipos.value = true;

  try {
    const qTokens = splitTokens(qNorm);
    const qComp = compact(qTrim);

    let arr = equiposIndex.value;

    if (qTokens.length >= 1) {
      arr = arr.filter((e) => qTokens.every((t) => (e.__hay || "").includes(t)));
    } else {
      const qFull = qNorm.replace(/[^a-z0-9]+/g, " ");
      arr = arr.filter((e) => (e.__hay || "").includes(qFull));
    }

    if (token !== lastSearchToken) return;

    const ranked = arr
      .map((e) => ({ e, s: scoreEquipo(e, qTrim, qTokens, qComp) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => {
        const out = { ...x.e };
        delete out.__hay;
        delete out.__tokens;
        delete out.__codeCompact;
        return out;
      })
      .slice(0, 200);

    resultadosEquipos.value = ranked;
    cacheResultados.set(qNorm, ranked);
  } catch (e) {
    console.error("[equipos] buscarEquipos error:", e);
    addToast("danger", "Error al buscar equipos.");
    resultadosEquipos.value = [];
  } finally {
    if (token === lastSearchToken) cargandoEquipos.value = false;
  }
};

const copiarEquipo = async (e) => {
  const texto =
`Código: ${e.codigo || "—"}
Equipo: ${e.equipo || "—"}
Marca/Modelo: ${e.marca || "—"} / ${e.modelo || "—"}
N° Chasis: ${e.numero_chasis || "—"}
Localización: ${e.localizacion || "—"}
Año: ${e.ano || "—"}
Tipo: ${e.tipo_equipo || "—"}
Clasificación: ${e.clasificacion1 || "—"}`;
  try {
    await navigator?.clipboard?.writeText(texto);
    addToast("success", "Datos copiados al portapapeles.");
  } catch {
    addToast("warning", "No se pudo copiar. Selecciona y copia manualmente.");
  }
};

const solpedDisponibles = ref([]);
const solpedSeleccionadaId = ref("");
const solpedSeleccionada = ref(null);
const itemsSolped = ref([]);
const autorizacionesSolped = ref([]);
const autorizacionSeleccionadaIndex = ref(0);

const modalCentroAbierto = ref(false);
const modalProveedorAbierto = ref(false);
const proveedorBusqueda = ref("");
const proveedoresResultados = ref([]);
const proveedoresBuscando = ref(false);

const proveedorSeleccionado = ref(null);
const proveedorNombre = computed(() => proveedorSeleccionado.value?.nombre || "");
const proveedorRut = computed(() => proveedorSeleccionado.value?.rut || "");
const centroCosto = ref("");
const filtroCentro = ref("");

const centrosCostoLista = ref([
  { key: "30858", name: "CONTRATO 30858 INFRA CHUQUICAMATA" },
  { key: "27483", name: "CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA" },
  { key: "PPCALAMA", name: "PLANTA PREDOSIFICADO CALAMA" },
  { key: "20915", name: "CONTRATO 20915 SUM. HORMIGON DAND" },
  { key: "CASAMATRIZ", name: "CASA MATRIZ" },
  { key: "PPSB", name: "PLANTA PREDOSIFICADO SAN BERNARDO" },
  { key: "PHUSB", name: "PLANTA HORMIGON URB.SAN BERNARDO" },
  { key: "PHURAN", name: "PLANTA HORMIGON URB. RANCAGUA" },
  { key: "PARAN", name: "PLANTA ARIDOS RANCAGUA" },
  { key: "PASB", name: "PLANTA ARIDOS SAN BERNARDO" },
  { key: "22368", name: "CONTRATO 22368 SUM HORMIGON DET" },
  { key: "28662", name: "CONTRATO 28662 CARPETAS" },
  { key: "29207", name: "CONTRATO 29207 MINERIA" },
  { key: "23302", name: "CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND" },
  { key: "SANJOAQUIN", name: "SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN" },
  { key: "CANECHE", name: "CONTRATO TALLER CANECHE" },
  { key: "30-10-11", name: "GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM" },
  { key: "10-10-20", name: "TALLER SAN BERNARDO" },
  { key: "31155", name: "DIVISION ANDINA 4600031155 Y 23302 CARPETAS" },
  { key: "23302", name: "CONTRATO 23302" },
  { key: "GPLA", name: "GPLA 4600031750" },
  { key: "BETON_CALAMA", name: "PLANTA BETON CALAMA" },
  { key: "FLUMECAR_CALAMA", name: "PLANTA FLUMECAR CALAMA" },
  { key: "URBANA_CALAMA", name: "PLANTA URBANA CALAMA" },
  { key: "KM13_ANDINA", name: "PLANTA KM13 ANDINA" },
  { key: "NV17_ANDINA", name: "PLANTA NV17 ANDINA" },
  { key: "SAN_BERNARDO", name: "PLANTA SAN BERNANDO" },
  { key: "ARIDO_NOS", name: "PLANTA DE ÁRIDO NOS" },
  { key: "OLIVAR", name: "PLANTA OLIVAR" },
  { key: "CANECHAL", name: "PLANTA CANECHE" },
  { key: "COLON", name: "PLANTA COLÓN" },
  { key: "AGUA_DULCE", name: "PLANTA AGUA DULCE" },
  { key: "ESMERALDA", name: "PLANTA ESMERALDA" },
  { key: "ESTOCADA_8", name: "PLANTA ESTOCADA 8" },
  { key: "OP14", name: "PLANTA OP14" },
  { key: "ANDES_NORTE", name: "PLANTA ANDES NORTE" },
  { key: "CHANCHADO", name: "PLANTA CHANCHADO" },

]);

const centrosFiltrados = computed(() => {
  const f = (filtroCentro.value || "").toLowerCase();
  if (!f) return centrosCostoLista.value;
  return centrosCostoLista.value.filter((c) => c.key.toLowerCase().includes(f) || c.name.toLowerCase().includes(f));
});
const nombreCentroCosto = computed(() => {
  const found = centrosCostoLista.value.find((c) => c.key === centroCosto.value);
  return found?.name || "";
});
const seleccionarCentro = (c) => { centroCosto.value = c.key; };

const onEnterCentro = () => {
  const f = (filtroCentro.value || "").trim();
  if (!f) {
    addToast("warning", "Escribe o elige un centro de costo.");
    return;
  }
  const list = centrosFiltrados.value || [];
  if (!list.length) {
    addToast("warning", "No se encontró centro. Escribe o elige un centro de costo.");
    return;
  }
  seleccionarCentro(list[0]);
  modalCentroAbierto.value = false;
  addToast("success", `Centro seleccionado: ${list[0].key}`);
};

const tipoCompra = ref("stock");
const destinoCompra = ref("");

const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");

const aprobadorSugerido = ref("");
const aprobadorAsignado = ref("");
const empresaPorDefecto = "Xtreme Servicio";
const tipoCambioUSD = 950;
const tipoCambioEUR = 1050;
const ESTATUS_FIJO_INICIAL = "Revisión Guillermo";
const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");
const archivos = ref([]);

const isExcelLike = (file) => {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  const extExcel = name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");
  const mimeExcel =
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("vnd.ms-excel") ||
    type.includes("vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    type.includes("csv") ||
    type.includes("text/csv");
  return extExcel || mimeExcel;
};

const toSafePdfName = (originalName) => {
  const base = String(originalName || "cotizacion")
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 90);
  return `${base}.pdf`;
};

async function excelFileToPdfFile(file) {
  const XLSXmod = await import("xlsx");
  const XLSX = XLSXmod.default || XLSXmod;
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) throw new Error("Excel sin hojas.");

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });

  const MAX_ROWS = 120;
  const MAX_COLS = 12;
  const trimmed = rows.slice(0, MAX_ROWS).map((r) => (Array.isArray(r) ? r.slice(0, MAX_COLS) : []));

  const docPdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  docPdf.setFontSize(12);
  docPdf.text(`Cotización (convertido desde Excel)`, 40, 40);
  docPdf.setFontSize(9);
  docPdf.text(`Archivo: ${file.name}`, 40, 56);

  const headerRow = trimmed[0] && trimmed[0].length ? trimmed[0] : [];
  const bodyRows = trimmed.length > 1 ? trimmed.slice(1) : [];

  const head = headerRow.length ? [headerRow.map((x) => String(x ?? ""))] : [];
  const body = bodyRows.map((r) => r.map((x) => String(x ?? "")));

  autoTable(docPdf, {
    startY: 70,
    head,
    body: body.length ? body : [["(Sin datos)"]],
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [245, 245, 245], textColor: 20 },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  const pdfBlob = docPdf.output("blob");
  const pdfName = toSafePdfName(file.name);
  return new File([pdfBlob], pdfName, { type: "application/pdf" });
}

const abrirSelectorArchivos = () => {
  const input = document.getElementById("inputArchivo");
  if (input) input.click();
};

const archivoYaAgregado = (file) => {
  const name = String(file?.name || "").trim().toLowerCase();
  const size = Number(file?.size || 0);

  return archivos.value.some((a) => {
    if (a?.fromSolped) return false;
    const aName = String(a?.name || "").trim().toLowerCase();
    const aSize = Number(a?.file?.size || 0);
    return aName === name && aSize === size;
  });
};

const procesarArchivosEntrantes = async (files = []) => {
  const list = Array.from(files || []);
  if (!list.length) return;

  setBusy(true, "Procesando archivos…", "Validando y preparando adjuntos", 5);

  let agregados = 0;

  try {
    let idx = 0;

    for (const file of list) {
      idx++;
      const pct = Math.round((idx / list.length) * 100);

      if (!file || file.size === 0) {
        addToast("warning", `Archivo inválido: ${file?.name || "desconocido"}`);
        continue;
      }

      if (archivoYaAgregado(file)) {
        addToast("warning", `El archivo "${file.name}" ya fue agregado.`);
        continue;
      }

      if (isExcelLike(file)) {
        setBusy(true, "Convirtiendo Excel a PDF…", file.name, Math.min(95, pct));
        try {
          const pdfFile = await excelFileToPdfFile(file);

          if (archivoYaAgregado(pdfFile)) {
            addToast("warning", `El archivo convertido "${pdfFile.name}" ya fue agregado.`);
            continue;
          }

          archivos.value.push({
            file: pdfFile,
            name: pdfFile.name,
            tipo: pdfFile.type,
            previewUrl: URL.createObjectURL(pdfFile),
            convertedFromExcel: true,
            __k: `${pdfFile.name}-${pdfFile.size}-${Date.now()}-${Math.random()}`,
          });

          agregados++;
          addToast("success", `Excel convertido a PDF: ${pdfFile.name}`);
        } catch (err) {
          console.error("Excel->PDF error:", err);
          addToast(
            "danger",
            `No se pudo convertir "${file.name}". Convierte a PDF (Imprimir → Guardar como PDF) o sube imagen/PDF.`
          );
        }
        continue;
      }

      const t = String(file.type || "").toLowerCase();
      const esPDF = t.includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf");
      const esIMG = t.startsWith("image/");

      if (!esPDF && !esIMG) {
        addToast("warning", `Formato no soportado: "${file.name}". Solo PDF, imágenes o Excel (se convierte).`);
        continue;
      }

      archivos.value.push({
        file,
        name: file.name,
        tipo: file.type,
        previewUrl: URL.createObjectURL(file),
        __k: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      });

      agregados++;
      setBusy(true, "Procesando archivos…", `${file.name}`, Math.min(95, pct));
    }

    if (!agregados) {
      addToast("warning", "Ningún archivo válido fue agregado.");
    }
  } finally {
    setBusy(false);
  }
};

const onMultipleFilesSelected = async (e) => {
  try {
    const list = Array.from(e?.target?.files || []);
    await procesarArchivosEntrantes(list);
  } finally {
    try {
      if (e?.target) e.target.value = "";
    } catch (err) {
      console.log(err);
    }
  }
};

const onDragEnterArchivos = () => {
  dragCounterArchivos += 1;
  dragOverArchivos.value = true;
};

const onDragOverArchivos = () => {
  dragOverArchivos.value = true;
};

const onDragLeaveArchivos = () => {
  dragCounterArchivos = Math.max(0, dragCounterArchivos - 1);
  if (dragCounterArchivos === 0) {
    dragOverArchivos.value = false;
  }
};

const onDropArchivos = async (e) => {
  dragCounterArchivos = 0;
  dragOverArchivos.value = false;

  const dt = e?.dataTransfer;
  if (!dt) return;

  const files = Array.from(dt.files || []);
  if (!files.length) {
    addToast("warning", "No se detectaron archivos para subir.");
    return;
  }

  await procesarArchivosEntrantes(files);
};
const keyFromUrl = (u) => String(u || "").split("?")[0];

const isAdjuntoEnArchivos = (adj) => {
  const url = adj?.url;
  if (!url) return false;
  return archivos.value.some((a) => a?.fromSolped && keyFromUrl(a.url) === keyFromUrl(url));
};

const agregarAdjuntoSolped = (adj) => {
  if (!adj?.url) return;
  if (isAdjuntoEnArchivos(adj)) return;

  archivos.value.unshift({
    fromSolped: true,
    name: adj.nombre || "documento_solped",
    tipo: adj.tipo || "application/octet-stream",
    url: adj.url,
    previewUrl: adj.url,
    __k: `solped-${keyFromUrl(adj.url)}-${Math.random()}`,
  });

  addToast("success", "Adjunto SOLPED agregado para reutilizar.");
};

const quitarAdjuntoSolped = (adj) => {
  if (!adj?.url) return;
  const k = keyFromUrl(adj.url);
  archivos.value = archivos.value.filter((a) => !(a?.fromSolped && keyFromUrl(a.url) === k));
  addToast("success", "Adjunto SOLPED removido.");
};

const onChangeAutorizacionSeleccionada = () => {};

const eliminarArchivo = (idx) => {
  try {
    const a = archivos.value[idx];
    if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
  } catch (e) { console.log(e); }
  archivos.value.splice(idx, 1);
  addToast("success", "Archivo eliminado.");
};

const usarSolped = ref(true);
const nuevoIdVisual = ref(null);
const cargandoNuevoId = ref(false);
const comentario = ref("");
const invalidField = ref("");

const solpedSelectRef = ref(null);
const centroCostoBtnRef = ref(null);
const tipoCompraRef = ref(null);
const destinoCompraRef = ref(null);
const monedaRef = ref(null);
const precioTotalRef = ref(null);
const archivosDropzoneRef = ref(null);

const itemCantidadRefs = ref({});

const setItemCantidadRef = (key, el) => {
  if (!key) return;
  if (el) itemCantidadRefs.value[key] = el;
  else delete itemCantidadRefs.value[key];
};

const clearInvalidField = (key = "") => {
  if (invalidField.value === key) invalidField.value = "";
};

const waitNextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const scrollToAndFocus = async (el, extra = {}) => {
  if (!el) return;
  await waitNextFrame();

  try {
    el.scrollIntoView({
      behavior: "smooth",
      block: extra.block || "center",
      inline: "nearest",
    });
  } catch(e) {console.log(e)}

  setTimeout(() => {
    try {
      if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    } catch(e) {console.log(e)}
  }, 250);
};

const triggerValidationError = async ({ key, message, el, beforeFocus }) => {
  invalidField.value = key || "";
  addToast("warning", message || "Falta completar un campo.");

  if (typeof beforeFocus === "function") {
    await beforeFocus();
  }

  await scrollToAndFocus(el);
};

const validarFormularioAntesDeEnviar = async () => {
  invalidField.value = "";

  if (!centroCosto.value.trim()) {
    await triggerValidationError({
      key: "centroCosto",
      message: "Falta seleccionar el Centro de Costo.",
      el: centroCostoBtnRef.value,
    });
    return false;
  }

  if (!tipoCompra.value) {
    await triggerValidationError({
      key: "tipoCompra",
      message: "Falta seleccionar el tipo de compra.",
      el: tipoCompraRef.value,
    });
    return false;
  }

  if (tipoCompra.value === "patente" && !destinoCompra.value.trim()) {
    await triggerValidationError({
      key: "destinoCompra",
      message: "Falta escribir la patente destino.",
      el: destinoCompraRef.value,
    });
    return false;
  }

  if (!monedaSeleccionada.value) {
    await triggerValidationError({
      key: "moneda",
      message: "Falta seleccionar la moneda.",
      el: monedaRef.value,
    });
    return false;
  }

  if (!precioTotalConIVA.value || precioTotalConIVA.value <= 0) {
    await triggerValidationError({
      key: "precioTotalConIVA",
      message: "Falta ingresar un precio total con IVA válido.",
      el: precioTotalRef.value,
    });
    return false;
  }
  if (!proveedorSeleccionado.value?.nombre || !proveedorSeleccionado.value?.rut) {
    invalidField.value = "proveedor";
    addToast("warning", "Debes seleccionar un proveedor.");
    return false;
  }
  if (usarSolped.value && !solpedSeleccionadaId.value) {
    await triggerValidationError({
      key: "solped",
      message: "Falta seleccionar una SOLPED asociada.",
      el: solpedSelectRef.value,
    });
    return false;
  }

  if (usarSolped.value && solpedSeleccionadaId.value) {
    const itemsValidos = (itemsSolped.value || []).filter((it) => num(it.cantidad_para_cotizar, 0) > 0);

    if (!itemsValidos.length) {
      const primerItem = itemsSolped.value?.[0];
      const itemKey = primerItem?.__k ? `item-${primerItem.__k}` : "solped";

      await triggerValidationError({
        key: itemKey,
        message: "Falta ingresar al menos una cantidad a cotizar en los ítems de la SOLPED.",
        el: primerItem?.__k ? itemCantidadRefs.value[primerItem.__k] : solpedSelectRef.value,
      });
      return false;
    }
  }

  if (!archivos.value.length) {
    await triggerValidationError({
      key: "archivos",
      message: "Falta adjuntar al menos un archivo.",
      el: archivosDropzoneRef.value,
    });
    return false;
  }

  invalidField.value = "";
  return true;
};
const prettyBytes = (n) => {
  const x = Number(n || 0);
  if (!x) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(x)/Math.log(1024)));
  const v = x / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const prettyTipo = (t) => {
  const s = String(t || "").toLowerCase();
  if (!s) return "archivo";
  if (s.includes("pdf")) return "PDF";
  if (s.startsWith("image/")) return "Imagen";
  if (s.includes("sheet") || s.includes("excel") || s.includes("csv") || s.endsWith(".xlsx") || s.endsWith(".xls") || s.endsWith(".csv")) return "Excel";
  return s;
};

const buildCruceUid = () => `cruce-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const itemsCruceBase = computed(() => {
  if (!usarSolped.value) return [];

  return (itemsSolped.value || [])
    .map((it) => {
      const cantidad = Math.max(0, Number(it?.cantidad ?? 0));
      const cantidadCotizada = Math.max(0, Number(it?.cantidad_cotizada ?? 0));
      const disponible = Math.max(0, cantidad - cantidadCotizada);

      return {
        ...it,
        cantidad,
        cantidad_cotizada: cantidadCotizada,
        restante_cruce: disponible,
        uid: it.__key || buildCruceUid(),
        source: "solped",
      };
    })
    .filter((it) => it.restante_cruce > 0);
});

const selectedCruceItems = computed(() => {
  const base = itemsCruceBase.value;
  const manual = manualCruceItems.value;
  const all = [...base, ...manual];
  return all.filter((x) => selectedCruceKeys.value.includes(x.uid));
});

const cerrarCrucePrecios = () => {
  modalCrucePrecios.value = false;
  cruceManualIndex.value = 0;
};
const formatMoneySmart = (value, moneda = "CLP") => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";

  try {
    return n.toLocaleString("es-CL", {
      style: "currency",
      currency: moneda || "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${moneda || "CLP"} ${n.toLocaleString("es-CL")}`;
  }
};

const IVA_RATE = 0.19;

const roundMoney = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
};

const getOpcionesValidasCruce = (item) => {
  return (item?.opciones || []).filter((op) => {
    const proveedor = String(op?.proveedor || "").trim();
    const pu = Number(op?.precioUnitario || 0);
    return proveedor && pu > 0;
  });
};

const getMejorOpcionCruce = (item) => {
  const validas = getOpcionesValidasCruce(item);
  if (!validas.length) return null;

  const marcada = validas.find((op) => op.esMejor);
  if (marcada) return marcada;

  // si no hay estrella, usa la válida más barata
  return [...validas].sort((a, b) => Number(a.total || 0) - Number(b.total || 0))[0] || null;
};

const resumenCruce = computed(() => {
  let subtotal = 0;
  let itemsConsiderados = 0;
  let itemsDestacados = 0;

  for (const item of cruceManualItems.value || []) {
    const mejor = getMejorOpcionCruce(item);
    if (!mejor) continue;

    const total = Number(mejor.total || 0);
    if (total > 0) {
      subtotal += total;
      itemsConsiderados += 1;
      if (mejor.esMejor) itemsDestacados += 1;
    }
  }

  const iva = subtotal * IVA_RATE;
  const totalConIVA = subtotal + iva;

  return {
    itemsConsiderados,
    itemsDestacados,
    subtotal: roundMoney(subtotal),
    iva: roundMoney(iva),
    totalConIVA: roundMoney(totalConIVA),
  };
});

const syncCantidadCruceToSolpedItem = (cruceItem) => {
  if (!cruceItem) return;
  if (!usarSolped.value) return;
  if (!itemsSolped.value?.length) return;

  const idx = itemsSolped.value.findIndex((it) => it.__key === cruceItem.uid);
  if (idx < 0) return;

  const target = itemsSolped.value[idx];
  const cantidadCruce = Math.max(0, Number(cruceItem.cantidad || 0));

  target.cantidad_para_cotizar = Math.min(cantidadCruce, Number(target.__max || 0));
  clampCantidadParaCotizar(target);
};

const aplicarCruceAPrecioYItems = ({ showToast = true, closeModal = false } = {}) => {
  // 1) copiar cantidades del cruce hacia SOLPED
  if (usarSolped.value && itemsSolped.value?.length) {
    for (const item of cruceManualItems.value || []) {
      syncCantidadCruceToSolpedItem(item);
    }
  }

  // 2) calcular precio total con IVA desde las opciones destacadas / mejores
  const totalCruce = Number(resumenCruce.value.totalConIVA || 0);

  if (totalCruce > 0) {
    formatearPrecConValor(totalCruce);
  }

  if (showToast) {
    if (totalCruce > 0) {
      addToast(
        "success",
        "Cruce aplicado: cantidades copiadas a la SOLPED y total con IVA actualizado."
      );
    } else {
      addToast(
        "warning",
        "Se copiaron cantidades, pero no había proveedores válidos destacados para calcular el total."
      );
    }
  }

  if (closeModal) {
    cerrarCrucePrecios();
  }
};
const agregarItemManualCruce = () => {
  const uid = buildCruceUid();
  manualCruceItems.value.push({
    uid,
    source: "manual",
    item: manualCruceItems.value.length + 1,
    descripcion: "",
    codigo_referencial: "",
    numero_interno: "",
    cantidad: 1,
    estado: "pendiente",
    estado_cotizacion: "pendiente",
  });
};

const eliminarItemManualCruce = (uid) => {
  manualCruceItems.value = manualCruceItems.value.filter((x) => x.uid !== uid);
  selectedCruceKeys.value = selectedCruceKeys.value.filter((x) => x !== uid);
};

const abrirCrucePrecios = async () => {
  modalCrucePrecios.value = true;

  if (usarSolped.value && itemsCruceBase.value.length && !selectedCruceKeys.value.length) {
    selectedCruceKeys.value = itemsCruceBase.value.map((x) => x.uid);
  }
};



const obtenerNombreUsuario = async () => {
  try {
    const uid = myUid.value;
    if (!uid) return;
    const dref = doc(db, "Usuarios", uid);
    const snap = await getDoc(dref);
    if (snap.exists()) {
      const data = snap.data() || {};
      usuarioActual.value = data.fullName || auth?.user?.displayName || auth?.user?.email || "";
      userRole.value = data.role || "";
    }
  } catch (e) {
    console.error(e);
  }
};

const aprobacionCfg = reactive({
  loading: false,
  ok: false,
  error: null,

  empresaDocId: "",
  empresaSlug: "",
  empresaNombre: "",

  raw: null,
  steps: [],

  approverByUid: new Map(),
  approverByName: new Map(),

  lastUpdatedAt: null,
});

let _unsubCfgEmpresa = null;
const nameKey = (s) => normalizePlain(s).replace(/\s+/g, " ").trim();

const slugEmpresa = (empresaName) => {
  const base = normalizePlain(empresaName)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const alias = {
    "xtreme_servicio": "xtreme_servicio",
    "xtreme-servicio": "xtreme_servicio",
    "xtreme_servicios": "xtreme_servicio",
    "xtreme-mining": "xtreme_mining",
    "xtreme_mining": "xtreme_mining",
    "xtreme-hormigones": "xtreme_hormigones",
    "xtreme_hormigones": "xtreme_hormigones",
  };

  return alias[base] || base || "xtreme_servicio";
};

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toList = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/[,;|]+/g).map((x) => x.trim()).filter(Boolean);
  if (typeof v === "object") return Object.keys(v).map((x) => String(x || "").trim()).filter(Boolean);
  return [];
};

const pickFirst = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
};
const ymdToInt = (s) => {
  const m = String(s || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
};
const todayInt = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
const estaEnVacaciones = (vacacionesArr) => {
  const list = Array.isArray(vacacionesArr) ? vacacionesArr : [];
  if (!list.length) return false;

  const t = todayInt();
  for (const r of list) {
    if (r?.activo === false) continue;
    const from = ymdToInt(pickFirst(r?.from, r?.desde));
    const to = ymdToInt(pickFirst(r?.to, r?.hasta));
    if (from && to && t >= from && t <= to) return true;
  }
  return false;
};
const buildStepsFromRaw = (raw) => {
  const steps = Array.isArray(raw?.steps) ? raw.steps : [];

  const out = steps.map((st, idx) => {
    const min = toNum(pickFirst(st?.min, st?.desde, st?.from)) ?? 0;
    const max = toNum(pickFirst(st?.max, st?.hasta, st?.to)) ?? Number.POSITIVE_INFINITY;

    const approvers = (Array.isArray(st?.approvers) ? st.approvers : []).map((ap) => {
      const fullName = String(ap?.fullName || ap?.nombre || ap?.name || "").trim();
      return {
        uid: String(ap?.uid || ap?.userId || "").trim(),
        email: String(ap?.email || "").trim(),
        fullName,
        activo: ap?.activo === false ? false : true,
        vacaciones: Array.isArray(ap?.vacaciones) ? ap.vacaciones : [],
        reemplazos: toList(ap?.reemplazos || ap?.reemplazo || ap?.suplentes || ap?.suplente),
      };
    }).filter((a) => a.fullName || a.uid || a.email);

    const delegation = st?.delegation && typeof st.delegation === "object" ? st.delegation : {};
    const delegationRules =
      Array.isArray(delegation?.rules) ? delegation.rules :
      (Array.isArray(st?.rules) ? st.rules : []);

    return {
      idx,
      id: String(st?.id || `st_${idx + 1}`).trim(),
      activo: st?.activo === false ? false : true,
      nombre: String(st?.nombre || st?.inStatus || `Paso ${idx + 1}`).trim(),
      inStatus: String(st?.inStatus || st?.nombre || "").trim(),
      approveTo: String(st?.approveTo || "Aprobado").trim(),
      overTo: String(st?.overTo || "").trim(),
      locked: !!st?.locked,
      min,
      max,
      toStepId: String(st?.toStepId || "").trim(),
      delegation: {
        mode: String(delegation?.mode || "").trim(),
        rules: delegationRules,
      },
      approvers,
    };
  });

  out.sort((a, b) => (a.min - b.min) || ((a.max ?? Infinity) - (b.max ?? Infinity)) || (a.idx - b.idx));
  return out;
};

const rebuildApproverMaps = (steps) => {
  const byUid = new Map();
  const byName = new Map();

  for (const st of steps || []) {
    for (const ap of st.approvers || []) {
      if (ap.uid) byUid.set(ap.uid, ap);
      if (ap.fullName) byName.set(nameKey(ap.fullName), ap);
    }
  }

  aprobacionCfg.approverByUid = byUid;
  aprobacionCfg.approverByName = byName;
};

function resetCfgEmpresa() {
  if (_unsubCfgEmpresa) {
    _unsubCfgEmpresa();
    _unsubCfgEmpresa = null;
  }
  aprobacionCfg.loading = false;
  aprobacionCfg.ok = false;
  aprobacionCfg.error = null;

  aprobacionCfg.empresaDocId = "";
  aprobacionCfg.empresaSlug = "";
  aprobacionCfg.empresaNombre = "";
  aprobacionCfg.raw = null;
  aprobacionCfg.steps = [];
  aprobacionCfg.approverByUid = new Map();
  aprobacionCfg.approverByName = new Map();
  aprobacionCfg.lastUpdatedAt = null;
}
function suscribirCfgEmpresa(empresaDocId) {
  const docId1 = empresaDocId || "xtreme_servicio";
  const docId2 = docId1.includes("_") ? docId1.replace(/_/g, "-") : docId1.replace(/-/g, "_");

  if (aprobacionCfg.empresaSlug === docId1 && _unsubCfgEmpresa) return;

  resetCfgEmpresa();

  aprobacionCfg.loading = true;
  aprobacionCfg.empresaDocId = docId1;
  aprobacionCfg.empresaSlug = docId1;

  const mkRef = (id) => doc(db, "configuracion", "aprobacion_oc_taller", "empresas", id);

  const subTo = (idToUse) => {
    const dref = mkRef(idToUse);

    _unsubCfgEmpresa = onSnapshot(
      dref,
      (snap) => {
        aprobacionCfg.loading = false;

        if (!snap.exists()) {
          if (idToUse === docId1 && docId2 && docId2 !== docId1) {
            resetCfgEmpresa();
            aprobacionCfg.loading = true;
            aprobacionCfg.empresaDocId = docId2;
            aprobacionCfg.empresaSlug = docId2;
            subTo(docId2);
            return;
          }

          aprobacionCfg.ok = false;
          aprobacionCfg.error = new Error(`No existe config para empresa: ${idToUse}`);
          aprobacionCfg.raw = null;
          aprobacionCfg.steps = [];
          rebuildApproverMaps([]);
          aprobacionCfg.lastUpdatedAt = Date.now();
          calcularAprobador();
          return;
        }

        const raw = snap.data() || {};
        aprobacionCfg.raw = raw;
        aprobacionCfg.empresaNombre = String(raw?.nombre || "").trim();
        aprobacionCfg.steps = buildStepsFromRaw(raw);
        rebuildApproverMaps(aprobacionCfg.steps);

        aprobacionCfg.ok = true;
        aprobacionCfg.error = null;
        aprobacionCfg.lastUpdatedAt = Date.now();

        calcularAprobador();
      },
      (err) => {
        aprobacionCfg.loading = false;
        aprobacionCfg.ok = false;
        aprobacionCfg.error = err;
        aprobacionCfg.raw = null;
        aprobacionCfg.steps = [];
        rebuildApproverMaps([]);
        aprobacionCfg.lastUpdatedAt = Date.now();
        calcularAprobador();
      }
    );
  };

  subTo(docId1);
}

function isDisponibleApprover(ap) {
  if (!ap) return false;
  if (!String(ap?.fullName || "").trim()) return false;
  if (ap.activo === false) return false;
  if (estaEnVacaciones(ap.vacaciones)) return false;
  return true;
}

const DEFAULT_FALLBACK = {
  [nameKey("Guillermo Manzor")]: ["Juan Cubillos", "Alejandro Candia"],
  [nameKey("Juan Cubillos")]: ["Alejandro Candia"],
  [nameKey("Alejandro Candia")]: ["Juan Cubillos"],
};

function getReemplazos(ap, step) {
  const out = [];

  for (const r of (ap?.reemplazos || [])) out.push(r);

  const rules = Array.isArray(step?.delegation?.rules) ? step.delegation.rules : [];
  for (const rule of rules) {
    const fromUid = String(rule?.fromUid || rule?.from_uid || "").trim();
    const fromName = String(rule?.fromName || rule?.from || "").trim();
    const toUid = toList(rule?.toUid || rule?.to_uid);
    const toName = toList(rule?.toName || rule?.to);

    const match =
      (fromUid && ap?.uid && fromUid === ap.uid) ||
      (fromName && ap?.fullName && nameKey(fromName) === nameKey(ap.fullName));

    if (match) {
      for (const u of toUid) out.push({ __uid: String(u).trim() });
      for (const n of toName) out.push(String(n).trim());
    }
  }

  const fb = DEFAULT_FALLBACK[nameKey(ap?.fullName)] || [];
  for (const n of fb) out.push(n);

  const normalized = [];
  for (const r of out) {
    if (!r) continue;

    if (typeof r === "object" && r.__uid) {
      const ap2 = aprobacionCfg.approverByUid.get(r.__uid);
      if (ap2) normalized.push(ap2);
      continue;
    }

    if (typeof r === "string") {
      const ap2 = aprobacionCfg.approverByName.get(nameKey(r));
      if (ap2) normalized.push(ap2);
      else normalized.push({ uid: "", email: "", fullName: r, activo: true, vacaciones: [], reemplazos: [] });
    }
  }

  return normalized;
}
function resolverAprobador(approvers = [], step = null) {
  const queue = (approvers || []).filter(Boolean);
  const base = queue[0]?.fullName || "";
  const visited = new Set();
  let baseMotivo = "";

  while (queue.length) {
    const candidato = queue.shift();
    const k = candidato?.uid ? `uid:${candidato.uid}` : `nm:${nameKey(candidato?.fullName || "")}`;
    if (!k || visited.has(k)) continue;
    visited.add(k);

    if (isDisponibleApprover(candidato)) {
      const reemplazo = base && nameKey(candidato.fullName) !== nameKey(base);
      const motivo = reemplazo ? "reemplazo" : "regla";
      const detalle = reemplazo
        ? `Reemplazo por ${baseMotivo || "no disponible"} de ${base}`
        : "Asignado por regla (steps)";

      return {
        fullName: candidato.fullName || "",
        uid: candidato.uid || "",
        email: candidato.email || "",
        base,
        motivo,
        detalle,
      };
    }

    if (base && nameKey(candidato?.fullName) === nameKey(base) && !baseMotivo) {
      if (candidato?.activo === false) baseMotivo = "inactivo";
      else if (estaEnVacaciones(candidato?.vacaciones)) baseMotivo = "vacaciones";
      else baseMotivo = "no_disponible";
    }

    const repl = getReemplazos(candidato, step);
    for (const r of repl) queue.push(r);
  }

  return {
    fullName: "",
    uid: "",
    email: "",
    base,
    motivo: "sin_disponible",
    detalle: base ? `Sin aprobador disponible (base: ${base})` : "Sin aprobador disponible",
  };
}
function pickStep(totalCLP) {
  const steps = aprobacionCfg.steps || [];
  if (!steps.length) return null;

  const match = steps.find((s) =>
    s.activo !== false &&
    totalCLP >= (s.min ?? 0) &&
    totalCLP <= (s.max ?? Number.POSITIVE_INFINITY)
  );

  return match || steps.find((s) => s.activo !== false) || steps[0] || null;
}

function candidatosDesdeCfg(totalCLP) {
  const step = pickStep(totalCLP);
  const candidatos = step?.approvers || [];
  return { step, candidatos };
}

const aprobadorMeta = reactive({
  base: "",
  final: "",
  finalUid: "",
  finalEmail: "",
  motivo: "",
  detalle: "",
  bloquea: false,
  stepId: "",
  stepNombre: "",
  inStatus: "",
  approveTo: "",
  overTo: "",
  min: null,
  max: null,
  locked: false,
  regla: null,
});

const aprobadorUI = computed(() => {
  if (aprobacionCfg.loading) {
    return {
      show: true,
      cls: "alert-secondary",
      icon: "bi-hourglass-split",
      title: "Cargando reglas de aprobación…",
      subtitle: `Empresa config: ${aprobacionCfg.empresaSlug || "—"}`,
    };
  }

  if (!aprobadorMeta.final) {
    const msg = aprobacionCfg.ok
      ? "No hay aprobadores disponibles (inactivos o en vacaciones). Revisa steps/approvers."
      : "No se pudo cargar la configuración (revisa permisos / doc empresa).";
    return {
      show: true,
      cls: "alert-danger",
      icon: "bi-person-x",
      title: "Sin aprobador disponible",
      subtitle: msg,
    };
  }

  const extra = aprobadorMeta.stepId
    ? `Estatus: ${aprobadorMeta.stepNombre || aprobadorMeta.stepId} `
    : "";

  if (aprobadorMeta.motivo === "reemplazo") {
    return {
      show: true,
      cls: "alert-warning",
      icon: "bi-person-exclamation",
      title: `Aprobador sugerido (reemplazo): ${aprobadorMeta.final}`,
      subtitle: `${aprobadorMeta.detalle || ""}${extra ? " — " + extra : ""}`,
    };
  }

  return {
    show: true,
    cls: "alert-info",
    icon: "bi-person-check",
    title: `Aprobador sugerido: ${aprobadorMeta.final}`,
    subtitle: extra,
  };
});
const isPdfArchivo = (a) => {
  const t = String(a?.tipo ?? a?.type ?? "").toLowerCase();
  const n = String(a?.name ?? a?.nombre ?? "").toLowerCase();
  return t.includes("pdf") || n.endsWith(".pdf");
};

const isImageArchivo = (a) => {
  const t = String(a?.tipo ?? a?.type ?? "").toLowerCase();
  return t.startsWith("image/");
};

const isExcelArchivo = (a) => {
  const t = String(a?.tipo ?? a?.type ?? "").toLowerCase();
  const n = String(a?.name ?? a?.nombre ?? "").toLowerCase();
  return (
    n.endsWith(".xlsx") ||
    n.endsWith(".xls") ||
    n.endsWith(".csv") ||
    t.includes("spreadsheet") ||
    t.includes("excel") ||
    t.includes("vnd.ms-excel") ||
    t.includes("vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    t.includes("csv") ||
    t.includes("text/csv")
  );
};

async function refrescarAprobadasConCount() {
  const nombre = (usuarioActual.value || "").trim();
  aprobadasState.loading = true;
  aprobadasState.ok = false;
  aprobadasState.error = null;

  try {
    if (!nombre) {
      totalAprobadasDelUsuario.value = 0;
      aprobadasState.ok = true;
      return;
    }

    const { from, to } = rangeUltimosDosMeses();
    const qRange = query(
      collection(db, "ordenes_oc"),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc"),
      limit(250)
    );

    const snap = await getDocs(qRange);
    let c = 0;
    snap.forEach((d) => {
      const x = d.data() || {};
      if (esAprobadoFinal(x.estatus)) c++;
    });

    totalAprobadasDelUsuario.value = c;
    aprobadasState.ok = true;
  } catch (e) {
    console.error("refrescarAprobadasConCount error:", e);
    aprobadasState.error = e;
    totalAprobadasDelUsuario.value = 0;
  } finally {
    aprobadasState.loading = false;
    aprobadasState.lastCheckedAt = Date.now();
  }
}

let _unsubAprobadasLive = null;
function suscribirAprobadasLiveMinima() {
  const nombre = (usuarioActual.value || "").trim();
  if (!nombre) return;

  if (_unsubAprobadasLive) {
    _unsubAprobadasLive();
    _unsubAprobadasLive = null;
  }

  try {
    const { from, to } = rangeUltimosDosMeses();
    const qLive = query(
      collection(db, "ordenes_oc"),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc"),
      limit(250)
    );

    _unsubAprobadasLive = onSnapshot(
      qLive,
      (snap) => {
        let c = 0;
        snap.forEach((d) => {
          const x = d.data() || {};
          if (esAprobadoFinal(x.estatus)) c++;
        });
        totalAprobadasDelUsuario.value = c;
        aprobadasState.ok = true;
        aprobadasState.error = null;
      },
      (err) => {
        console.error("suscribirAprobadasLiveMinima error:", err);
        aprobadasState.ok = false;
        aprobadasState.error = err;
      }
    );
  } catch (e) {
    console.error("suscribirAprobadasLiveMinima catch:", e);
    aprobadasState.ok = false;
    aprobadasState.error = e;
  }
}

const cargarSolpedSolicitadasOptimizada = async () => {
  try {
    let arr = [];
    const estatusValidos = ["Solicitado", "Pendiente", "Parcial", "Cotizado parcial", "Cotizado Parcial"];
    if (usuarioActual.value) {
      const qy = query(
        collection(db, "solpes"),
        where("dirigidoA", "array-contains", usuarioActual.value),
        where("estatus", "in", estatusValidos)
      );
      const snap = await getDocs(qy);
      arr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.numero_solpe || 0) - (b.numero_solpe || 0));
    } else {
      const qy = query(collection(db, "solpes"), where("estatus", "in", estatusValidos));
      const snap = await getDocs(qy);
      arr = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.numero_solpe || 0) - (b.numero_solpe || 0));
    }
    solpedDisponibles.value = arr;
  } catch (e) {
    console.error(e);
  }
};

const cargarSiguienteNumero = async () => {
  if (cargandoNuevoId.value) return;
  cargandoNuevoId.value = true;

  try {
    const qy = query(collection(db, "ordenes_oc"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const last = snap.docs[0]?.data()?.id || 0;
    nuevoIdVisual.value = Number(last) + 1;
  } catch (e) {
    console.error("cargarSiguienteNumero error:", e);
    nuevoIdVisual.value = 1;
  } finally {
    cargandoNuevoId.value = false;
  }
};

const onToggleUsarSolped = () => {
  if (!usarSolped.value) {
    solpedSeleccionada.value = null;
    solpedSeleccionadaId.value = "";
    itemsSolped.value = [];
    autorizacionesSolped.value = [];
    autorizacionSeleccionadaIndex.value = 0;
    archivos.value = archivos.value.filter((a) => !a?.fromSolped);
  }
  calcularAprobador();
};

const onChangeSolped = async () => {
  if (!solpedSeleccionadaId.value) {
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    autorizacionesSolped.value = [];
    autorizacionSeleccionadaIndex.value = 0;
    archivos.value = archivos.value.filter((a) => !a?.fromSolped);
    return;
  }

  try {
    const dref = doc(db, "solpes", solpedSeleccionadaId.value);
    const snap = await getDoc(dref);
    if (!snap.exists()) return;

    const data = snap.data() || {};
    solpedSeleccionada.value = data;

    const authArr = Array.isArray(data.autorizaciones) ? data.autorizaciones : [];
    autorizacionesSolped.value = authArr.map((a, i) => ({
      nombre: a?.nombre || `archivo_${i + 1}`,
      tipo: a?.tipo || "",
      url: a?.url || "",
      tamano: a?.tamano || 0,
      __k: `${a?.url || a?.nombre || i}-${Math.random()}`,
    }));
    autorizacionSeleccionadaIndex.value = 0;

    const todos = Array.isArray(data.items) ? data.items : [];
    itemsSolped.value = buildItemsSolpedForUI(todos);

    for (const it of itemsSolped.value) clampCantidadParaCotizar(it);

    centroCosto.value = data.numero_contrato || centroCosto.value;

    archivos.value = archivos.value.filter((a) => !a?.fromSolped);

    calcularAprobador();
  } catch (e) {
    console.error(e);
  }
};

const onCambioMoneda = () => { formatearPrecConValor(precioTotalConIVA.value); };
const formatearPrecio = (ev) => {
  const input = (ev?.target?.value ?? "").toString();
  const soloNumeros = input.replace(/\D/g, "");
  const valor = soloNumeros ? parseInt(soloNumeros, 10) : 0;
  formatearPrecConValor(valor);
};
const formatearPrecConValor = (valor) => {
  precioTotalConIVA.value = valor;
  const m = monedaSeleccionada.value || "CLP";
  try {
    precioFormateado.value = valor.toLocaleString("es-CL", {
      style: "currency",
      currency: m,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    precioFormateado.value = `${m} ${valor.toLocaleString("es-CL")}`;
  }
  calcularAprobador();
};

const calcularAprobador = () => {
  let totalCLP = precioTotalConIVA.value;
  const mon = (monedaSeleccionada.value || "CLP").toUpperCase();
  if (mon === "USD") totalCLP *= tipoCambioUSD;
  else if (mon === "EUR") totalCLP *= tipoCambioEUR;

  const empresaBase = usarSolped.value
    ? (solpedSeleccionada.value?.empresa || empresaPorDefecto)
    : empresaPorDefecto;

  const empresaDocId = slugEmpresa(empresaBase);
  suscribirCfgEmpresa(empresaDocId);

  const { step, candidatos } = candidatosDesdeCfg(totalCLP);
  const res = resolverAprobador(candidatos, step);

  aprobadorSugerido.value = res.fullName || "";
  aprobadorAsignado.value = res.fullName || "";

  aprobadorMeta.base = res.base || "";
  aprobadorMeta.final = res.fullName || "";
  aprobadorMeta.finalUid = res.uid || "";
  aprobadorMeta.finalEmail = res.email || "";
  aprobadorMeta.motivo = res.motivo || "";
  aprobadorMeta.detalle = res.detalle || "";
  aprobadorMeta.bloquea = !res.fullName;

  aprobadorMeta.stepId = step?.id || "";
  aprobadorMeta.stepNombre = step?.nombre || "";
  aprobadorMeta.inStatus = step?.inStatus || step?.nombre || "";
  aprobadorMeta.approveTo = step?.approveTo || "Aprobado";
  aprobadorMeta.overTo = step?.overTo || "";
  aprobadorMeta.min = step?.min ?? null;
  aprobadorMeta.max = step?.max ?? null;
  aprobadorMeta.locked = !!step?.locked;

  aprobadorMeta.regla = step ? ({
    id: step.id || "",
    label: step.nombre || "",
    min: step.min ?? null,
    max: step.max ?? null,
    inStatus: step.inStatus || "",
    approveTo: step.approveTo || "Aprobado",
    overTo: step.overTo || "",
    locked: !!step.locked,
  }) : null;
};

const actualizarSolpedAsociada = async (solpedId, selections, nombreUsuario, estatusInicial) => {
  if (!solpedId) return;
  if (!Array.isArray(selections) || selections.length === 0) return;

  const srefDoc = doc(db, "solpes", solpedId);

  await runTransaction(db, async (tx) => {
    const ss = await tx.get(srefDoc);
    if (!ss.exists()) return;

    const dataSol = ss.data() || {};
    const originales = Array.isArray(dataSol.items) ? dataSol.items : [];

    const selByIndex = new Map();
    const selByKey = new Map();

    for (const s of selections) {
      const qty = Math.max(0, num(s.cantidad_para_cotizar, 0));
      if (qty <= 0) continue;

      if (num(s.sourceIndex, -1) >= 0) {
        selByIndex.set(num(s.sourceIndex, -1), qty);
      }

      if (s.key) {
        selByKey.set(String(s.key), qty);
      }
    }

    const actualizados = originales.map((it, idx) => {
      const total = num(it?.cantidad, 0);
      const antes = num(it?.cantidad_cotizada, 0);

      const identity = itemIdentityKey({
        ...it,
        item: num(it?.item, idx + 1),
      });

      const qtySeleccionada =
        (selByIndex.has(idx) ? selByIndex.get(idx) : undefined) ??
        (selByKey.has(identity) ? selByKey.get(identity) : 0);

      if (qtySeleccionada > 0) {
        const st = computeEstadoItem({
          total,
          antes,
          nueva: qtySeleccionada,
        });

        return {
          ...it,
          item: num(it?.item, idx + 1),
          cantidad: total,
          cantidad_cotizada: st.finalCotizada,
          estado: st.estado,
          estado_cotizacion: st.estado_cotizacion,
        };
      }
      const normalizado = normalizarEstadoCantidades({
        total,
        cotizada: antes,
      });

      return {
        ...it,
        item: num(it?.item, idx + 1),
        cantidad: total,
        cantidad_cotizada: normalizado.finalCotizada,
        estado: normalizado.estado,
        estado_cotizacion: normalizado.estado_cotizacion,
      };
    });

    const allComplete = actualizados.every((it) => {
      const total = num(it?.cantidad, 0);
      const cot = num(it?.cantidad_cotizada, 0);
      return total <= 0 || cot >= total;
    });

    const anyCotizado = actualizados.some((it) => num(it?.cantidad_cotizada, 0) > 0);

    const nextEstatus = allComplete
      ? "Cotizado Completado"
      : (anyCotizado ? "Cotizado Parcial" : (dataSol.estatus || "Pendiente"));

    tx.update(srefDoc, {
      items: actualizados,
      estatus: nextEstatus,
      updated_at: serverTimestamp(),
    });
  });

  const hcoll = collection(db, "solpes", solpedId, "historialEstados");
  await addDoc(hcoll, {
    usuario: nombreUsuario || "Sistema",
    fecha: serverTimestamp(),
    estatus: `Cotización enviada - ${estatusInicial || "Pendiente de Aprobación"}`,
  });
};
const enviarOC = async () => {
  if (enviando.value) return;

  await refrescarAprobadasConCount();
  if (bloqueoPorAprobadas.value) {
    const msgExtra = aprobadasState.ok
      ? `Tienes ${totalAprobadasDelUsuario.value} cotizaciones en "Aprobado" (últimos 2 meses).`
      : `No se pudo validar el límite (config/índice/permisos).`;
    addToast("warning", `${msgExtra} Ve al detalle y súbelas antes de continuar.`);
    return;
  }

  if (aprobacionCfg.loading) {
    addToast("warning", "Espera un momento: cargando reglas de aprobación…");
    return;
  }

  calcularAprobador();
  if (aprobadorMeta.bloquea) {
    addToast(
      "danger",
      "No hay aprobador disponible (inactivo/vacaciones o config no válida). No se puede enviar."
    );
    return;
  }

  const formOk = await validarFormularioAntesDeEnviar();
  if (!formOk) return;

  let selections = [];
  if (usarSolped.value && solpedSeleccionadaId.value) {
    selections = buildSelections(itemsSolped.value);
  }

  enviando.value = true;
  setBusy(true, "Enviando cotización…", "Preparando datos", 5);

  try {
    let nombreUsuario = auth?.user?.displayName || auth?.user?.email || "Desconocido";
    const uid = myUid.value;

    if (uid) {
      const usnap = await getDoc(doc(db, "Usuarios", uid));
      if (usnap.exists()) {
        const u = usnap.data() || {};
        nombreUsuario = u.fullName || nombreUsuario;
      }
    }

    setBusy(true, "Enviando cotización…", "Calculando número…", 10);

    const qy = query(
      collection(db, "ordenes_oc"),
      orderBy("id", "desc"),
      limit(1)
    );
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId = Number(lastId) + 1;

    const centroFound = centrosCostoLista.value.find((c) => c.key === centroCosto.value);
    const centroNombre = centroFound?.name || "Desconocido";

    const empresaElegida =
      (usarSolped.value && solpedSeleccionada.value?.empresa)
        ? solpedSeleccionada.value.empresa
        : empresaPorDefecto;

    const estatusInicial = ESTATUS_FIJO_INICIAL;
    const comentarioFinal = (comentario.value || "").trim();

    let itemsOC = [];
    if (usarSolped.value && solpedSeleccionadaId.value) {
      itemsOC = buildItemsOCFromUI(itemsSolped.value);

      if (!itemsOC.length) {
        addToast("warning", "No hay ítems válidos para cotizar (revisa cantidades).");
        return;
      }
    }

    const storage = getStorage();
    const subidos = [];

    const totalAdj = archivos.value.length || 1;
    let doneAdj = 0;

    for (const a of archivos.value) {
      doneAdj++;
      const pct = Math.min(90, 10 + Math.round((doneAdj / totalAdj) * 80));
      setBusy(
        true,
        "Enviando cotización…",
        `Subiendo adjunto ${doneAdj} de ${totalAdj}`,
        pct
      );

      if (a?.fromSolped && a?.url) {
        subidos.push({
          nombre: a.name,
          tipo: a.tipo || "application/octet-stream",
          url: a.url,
          origen: "solped",
          solpedId: solpedSeleccionadaId.value || null,
        });
        continue;
      }

      if (!a.file || a.file.size < 100) continue;

      const safeName = String(a.name || "archivo")
        .replace(/[^\w.\-() ]+/g, "_")
        .slice(0, 120);

      const path = `ordenes_oc/${newId}/${safeName}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, a.file);
      const url = await getDownloadURL(up.ref);

      subidos.push({
        nombre: safeName,
        tipo: a.tipo || a.file.type || "application/octet-stream",
        url,
        origen: "upload",
      });
    }

    setBusy(true, "Enviando cotización…", "Guardando documento en Firestore…", 95);

    const dataToSave = {
      id: newId,
      centroCosto: centroCosto.value,
      centroCostoNombre: centroNombre,
      tipoCompra: tipoCompra.value,
      destinoCompra: tipoCompra.value === "patente" ? destinoCompra.value : "",
      estatus: estatusInicial,
      fechaSubida: serverTimestamp(),
      historial: [
        {
          usuario: nombreUsuario,
          estatus: estatusInicial,
          fecha: new Date().toISOString(),
          comentario: comentarioFinal,
        },
      ],
      responsable: nombreUsuario,
      comentario: comentarioFinal,
      numero_contrato: centroCosto.value,
      nombre_centro_costo: centroNombre,
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,
      proveedor: proveedorSeleccionado.value?.nombre || "",
      rutProveedor: proveedorSeleccionado.value?.rut || "",
      aprobadorSugerido: aprobadorAsignado.value || "",
      aprobadorBase: aprobadorMeta.base || "",
      aprobadorMotivo: aprobadorMeta.motivo || "",
      aprobadorDetalle: aprobadorMeta.detalle || "",

      aprobadorReglaId: aprobadorMeta.stepId || aprobadorMeta.regla?.id || "",
      aprobadorReglaLabel: aprobadorMeta.stepNombre || aprobadorMeta.regla?.label || "",
      aprobadorEmpresaSlug: aprobacionCfg.empresaSlug || aprobacionCfg.empresaDocId || "",

      empresa: empresaElegida,
      archivosStorage: subidos,

      ...(usarSolped.value && solpedSeleccionadaId.value
        ? {
            solpedId: solpedSeleccionadaId.value,
            numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
            tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
            items: itemsOC,
          }
        : {
            tipo_solped: "Sin SOLPED",
          }),
    };

    const newDocRef = await addDoc(collection(db, "ordenes_oc"), dataToSave);
    const newDocId = newDocRef.id;
    await updateDoc(newDocRef, { __docId: newDocId });

    if (usarSolped.value && solpedSeleccionadaId.value) {
      await actualizarSolpedAsociada(
        solpedSeleccionadaId.value,
        selections,
        nombreUsuario,
        estatusInicial
      );
    }

    setBusy(true, "Listo ✅", "Cotización enviada correctamente", 100);
    addToast("success", "Cotización enviada exitosamente.");

    centroCosto.value = "";
    tipoCompra.value = "stock";
    destinoCompra.value = "";

    for (const a of archivos.value) {
      try {
        if (a?.previewUrl && !a?.fromSolped) {
          URL.revokeObjectURL(a.previewUrl);
        }
      } catch (e) {
        console.log(e);
      }
    }

    archivos.value = [];

    comentario.value = "";
    usarSolped.value = true;
    solpedSeleccionadaId.value = "";
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    autorizacionesSolped.value = [];
    autorizacionSeleccionadaIndex.value = 0;

    precioTotalConIVA.value = 0;
    precioFormateado.value = "";

    aprobadorSugerido.value = "";
    aprobadorAsignado.value = "";

    proveedorSeleccionado.value = null;

    aprobadorMeta.base = "";
    aprobadorMeta.final = "";
    aprobadorMeta.finalUid = "";
    aprobadorMeta.finalEmail = "";
    aprobadorMeta.motivo = "";
    aprobadorMeta.detalle = "";
    aprobadorMeta.bloquea = false;
    aprobadorMeta.stepId = "";
    aprobadorMeta.stepNombre = "";
    aprobadorMeta.inStatus = "";
    aprobadorMeta.approveTo = "";
    aprobadorMeta.overTo = "";
    aprobadorMeta.min = null;
    aprobadorMeta.max = null;
    aprobadorMeta.locked = false;
    aprobadorMeta.regla = null;

    monedaSeleccionada.value = "CLP";
    invalidField.value = "";

    await cargarSiguienteNumero();

    const inputEl = document.getElementById("inputArchivo");
    if (inputEl) inputEl.value = "";
  } catch (e) {
    console.error(e);
    addToast("danger", "Error al enviar la cotización.");
  } finally {
    enviando.value = false;
    setTimeout(() => setBusy(false), 450);
  }
};

const mostrarMisOC = ref(false);
const cargandoMisOC = ref(false);
const misOC = ref([]);
const misOCCurrentPage = ref(1);
const misOCPageSize = 2;

const misOCTotalPages = computed(() => Math.max(1, Math.ceil(misOC.value.length / misOCPageSize)));
const misOCVisiblePages = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, misOCCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(misOCTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const misOCPaged = computed(() => {
  const start = (misOCCurrentPage.value - 1) * misOCPageSize;
  return misOC.value.slice(start, start + misOCPageSize);
});
const misOCGoTo = (n) => { if (n < 1 || n > misOCTotalPages.value) return; misOCCurrentPage.value = n; };

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : null);
    if (!d) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch { return "—"; }
};

const estadoBadgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("preaprob")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("escala") || s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("pendiente")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const irADetalleOC = (oc) => { router.push(`/oc/${oc.__docId}`); };

let _unsubMisOC = null;
const suscribirMisOC = () => {
  if (_unsubMisOC) { _unsubMisOC(); _unsubMisOC = null; }
  const nombre = usuarioActual.value; if (!nombre) return;
  const { from, to } = rangeUltimosDosMeses();
  const qy = query(
    collection(db, "ordenes_oc"),
    where("responsable", "==", nombre),
    where("fechaSubida", ">=", from),
    where("fechaSubida", "<", to),
    orderBy("fechaSubida", "desc")
  );
  _unsubMisOC = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach((docu) => arr.push({ __docId: docu.id, ...docu.data() }));
    arr.sort((a, b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0));
    misOC.value = arr;
    misOCCurrentPage.value = 1;
  }, (err) => {
    console.error("onSnapshot últimos 2 meses:", err);
  });
};

const desuscribirMisOC = () => {
  if (_unsubMisOC) { _unsubMisOC(); _unsubMisOC = null; }
  misOC.value = [];
  misOCCurrentPage.value = 1;
  cargandoMisOC.value = false;
};

const toggleMisOC = () => {
  mostrarMisOC.value = !mostrarMisOC.value;
  if (mostrarMisOC.value) { if (usuarioActual.value) suscribirMisOC(); }
  else { desuscribirMisOC(); }
};

const mostrarResumenOC = ref(false);
const cargandoResumenOC = ref(false);
const resumenOC = ref([]);
const resumenOCPageSize = 10;
const resumenOCCurrentPage = ref(1);
let _unsubResumenOC = null;

const resumenOCTotalPages = computed(() =>
  Math.max(1, Math.ceil(resumenOC.value.length / resumenOCPageSize))
);
const resumenOCVisiblePages = computed(() => {
  const maxButtons = 8;
  const pages = [];
  let start = Math.max(1, resumenOCCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(resumenOCTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const resumenOCPaged = computed(() => {
  const start = (resumenOCCurrentPage.value - 1) * resumenOCPageSize;
  return resumenOC.value.slice(start, start + resumenOCPageSize);
});
const resumenOCGoTo = (n) => {
  if (n < 1 || n > resumenOCTotalPages.value) return;
  resumenOCCurrentPage.value = n;
};

function mapEstatusCategoriaOC(estatusRaw) {
  const s = String(estatusRaw || "").toLowerCase().trim();
  if (s.includes("proveedor")) return "Enviada a proveedor";
  if (s.includes("aprobado") && !s.includes("preaprob")) return "Aprobado";
  if (s.includes("preaprob")) return "Preaprobado";
  if (s.includes("rechaz") || s.includes("escala")) return "Rechazado";
  if (s.includes("pendiente")) return "Pendiente de Aprobación";
  if (s.includes("revisión") || s.includes("revision")) return "Revisión Guillermo";
  return "Otros";
}

function desuscribirResumenOC() {
  if (_unsubResumenOC) { _unsubResumenOC(); _unsubResumenOC = null; }
  resumenOC.value = [];
  resumenOCCurrentPage.value = 1;
  cargandoResumenOC.value = false;
}

function suscribirResumenOC(nombre) {
  desuscribirResumenOC();
  cargandoResumenOC.value = true;

  if (!nombre) { cargandoResumenOC.value = false; return; }

  const { from, to } = rangeUltimosDosMeses();

  try {
    const qy = query(
      collection(db, "ordenes_oc"),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc")
    );

    _unsubResumenOC = onSnapshot(qy, (snap) => {
      const row = {
        responsable: nombre,
        aprobado: 0,
        rechazado: 0,
        preaprobado: 0,
        pendiente: 0,
        revision: 0,
        proveedor: 0,
        otros: 0,
        total: 0,
      };

      snap.forEach((d) => {
        const x = d.data() || {};
        const cat = mapEstatusCategoriaOC(x.estatus);
        if (cat === "Aprobado") row.aprobado++;
        else if (cat === "Rechazado") row.rechazado++;
        else if (cat === "Preaprobado") row.preaprobado++;
        else if (cat === "Pendiente de Aprobación") row.pendiente++;
        else if (cat === "Revisión Guillermo") row.revision++;
        else if (cat === "Enviada a proveedor") row.proveedor++;
        else row.otros++;
        row.total++;
      });

      resumenOC.value = row.total > 0 ? [row] : [];
      resumenOCCurrentPage.value = 1;
      cargandoResumenOC.value = false;
    }, (err) => {
      console.error("onSnapshot resumen OC (2 meses):", err);
      cargandoResumenOC.value = false;
    });
  } catch (e) {
    console.error("suscribirResumenOC (2 meses) error:", e);
    cargandoResumenOC.value = false;
  }
}

const toggleResumenOC = () => {
  mostrarResumenOC.value = !mostrarResumenOC.value;
  if (mostrarResumenOC.value) suscribirResumenOC(usuarioActual.value);
  else desuscribirResumenOC();
};
watch(
  () => selectedCruceItems.value.map((x) => x.uid).join("|"),
  () => {
    if (modalCrucePrecios.value) {
      syncCruceManualItems();
    }
  }
);
watch(() => usuarioActual.value, async (nv) => {
  if (!nv) return;
  await refrescarAprobadasConCount();
  suscribirAprobadasLiveMinima();
  if (mostrarMisOC.value) suscribirMisOC();
  if (mostrarResumenOC.value) suscribirResumenOC(nv);
});
watch(
  () => modalCrucePrecios.value,
  (open) => {
    if (open && usarSolped.value && itemsCruceBase.value.length && !selectedCruceKeys.value.length) {
      selectedCruceKeys.value = itemsCruceBase.value.map((x) => x.uid);
    }
  }
);
onMounted(async () => {
  computeIsDesktop();
  window.addEventListener("resize", onResize);

  await obtenerNombreUsuario();

  suscribirCfgEmpresa(slugEmpresa(empresaPorDefecto));

  await refrescarAprobadasConCount();
  suscribirAprobadasLiveMinima();

  await cargarSolpedSolicitadasOptimizada();
  await cargarSiguienteNumero();

  const pre = route?.query?.fromSolpedId ? String(route.query.fromSolpedId) : "";
  if (pre) {
    usarSolped.value = true;
    const yaEsta = solpedDisponibles.value.some((s) => s.id === pre);
    if (!yaEsta) {
      try {
        const ds = await getDoc(doc(db, "solpes", pre));
        if (ds.exists()) {
          const data = ds.data() || {};
          solpedDisponibles.value = [{ id: pre, ...data }, ...solpedDisponibles.value];
        }
      } catch (e) { console.error("No se pudo precargar SOLPED", e); }
    }
    solpedSeleccionadaId.value = pre;
    await onChangeSolped();
    addToast("success", "SOLPED preseleccionada desde el historial.");
  }

  calcularAprobador();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.documentElement.style.overflow = "";
  if (_unsubMisOC) _unsubMisOC();
  if (_unsubAprobadasLive) _unsubAprobadasLive();
  if (_unsubResumenOC) _unsubResumenOC();
  if (_unsubCfgEmpresa) _unsubCfgEmpresa();
  if (debounceTimer) clearTimeout(debounceTimer);

  for (const a of archivos.value) {
    try {
      if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
    } catch (e) { console.log(e); }
  }
});
</script>



<style scoped>
.generador-oc-page { min-height: 100vh; }

.card-elevated {
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
}

.card.is-locked { position: relative; filter: none; }
.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(2px);
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.lock-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: .85rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 10px 24px rgba(0,0,0,.12);
  max-width: 420px;
}
.dropzone-upload{
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 28px 18px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all .2s ease;
  user-select: none;
}


.dropzone-upload:hover{
  border-color: #94a3b8;
  background: #f1f5f9;
}

.dropzone-upload.is-dragging{
  border-color: #dc2626;
  background: rgba(220, 38, 38, .06);
  box-shadow: 0 0 0 4px rgba(220, 38, 38, .08);
  transform: scale(1.01);
}

.dropzone-icon{
  font-size: 42px;
  line-height: 1;
  color: #dc2626;
  margin-bottom: 10px;
}
.sticky-panel { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: hidden; }
.sticky-panel .card-body { overflow: auto; }

.equipos-list { max-height: 55vh; overflow: auto; }

.table-stacked-sm table { width: 100%; }
@media (max-width: 576px) {
  .table-stacked-sm thead { display: none; }
  .table-stacked-sm tbody tr {
    display: block;
    border: 1px solid #e5e7eb;
    border-radius: .5rem;
    margin-bottom: .75rem;
    padding: .5rem .5rem .25rem;
    box-shadow: 0 4px 10px rgba(0,0,0,.04);
  }
  .table-stacked-sm tbody td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .35rem .25rem;
    border: 0 !important;
  }
  .table-stacked-sm tbody td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: .75rem;
    color: #475569;
  }
}

.vmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1080;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.vmodal {
  width: 100%;
  max-width: 1600px;
  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
  overflow: hidden;
  background: #fff;
}
.vmodal-header, .vmodal-footer {
  padding: .9rem 1rem;
  border-bottom: 1px solid #eee;
}
.vmodal-footer { border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body { padding: 1rem; max-height: 65vh; overflow: auto; }
.vmodal-list { max-height: 55vh; overflow: auto; }

.toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-box {
  display: flex;
  align-items: center;
  padding: .6rem .8rem;
  border-radius: .5rem;
  color: #fff;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success { background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning { background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger  { background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white { filter: invert(1) grayscale(100%) brightness(200%); }

.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }
.oc-wrap { position: fixed; inset: 0; z-index: 1080; }
.oc-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(1px); }
.oc-panel {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(92vw, 420px);
  background: #fff;
  box-shadow: -8px 0 24px rgba(0,0,0,.2);
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  animation: ocSlideIn .22s ease-out;
}
@keyframes ocSlideIn {
  from { transform: translateX(100%); opacity: .6; }
  to   { transform: translateX(0); opacity: 1; }
}
.oc-header { padding: .9rem .9rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
.oc-body { padding: .9rem; overflow: auto; }
.oc-footer { margin-top: auto; padding: .9rem; border-top: 1px solid #e5e7eb; display: flex; gap: .5rem; justify-content: flex-end; }
.best-star{
  font-size: 1.2rem;
  color: #f59e0b;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.25);
}

.btn-star-choice{
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  line-height: 1;
  color: #94a3b8;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  transition: all .18s ease;
}

.btn-star-choice:hover{
  transform: scale(1.08);
  background: rgba(245, 158, 11, 0.08);
  color: #f59e0b;
}

.btn-star-choice.active{
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.22);
}

.table-warning td{
  background: rgba(245, 158, 11, 0.08) !important;
}
.cruce-items-list-scroll{
  max-height: 48vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.cruce-items-list-scroll::-webkit-scrollbar{
  width: 8px;
}

.cruce-items-list-scroll::-webkit-scrollbar-thumb{
  background: rgba(148, 163, 184, 0.7);
  border-radius: 999px;
}

.cruce-items-list-scroll::-webkit-scrollbar-track{
  background: rgba(226, 232, 240, 0.5);
  border-radius: 999px;
}
.floating-equipos-btn {
  position: fixed;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 1200;
  border-radius: 12px;
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

@media (max-width: 420px) {
  .card-header .small { font-size: .8rem; }
}

.busy-overlay{
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: 1rem;
}
.busy-card{
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0,0,0,.08);
}

.excel-fallback{
  border: 1px dashed rgba(0,0,0,.12);
  border-radius: 12px;
  padding: 18px 14px;
  background: rgba(16,185,129,.04);
}
.excel-icon{
  font-size: 44px;
  line-height: 1;
  color: #16a34a;
}
.vmodal-xxl{
  max-width: min(1700px, 96vw);
}

.cruce-body-scroll{
  max-height: 72vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.cruce-table-scroll{
  max-height: 48vh;
  overflow: auto;
}
.provider-selected-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.provider-selected-icon,
.provider-result-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
  color: #1d4ed8;
  border: 1px solid rgba(29, 78, 216, 0.12);
}

.proveedor-list {
  max-height: 320px;
  overflow-y: auto;
  border-radius: 14px;
}

.proveedor-item {
  border: 1px solid rgba(15, 23, 42, 0.06);
  transition: all 0.18s ease;
}

.proveedor-item:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.minw-0 {
  min-width: 0;
}
.cruce-table-scroll table thead th{
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8f9fa !important;
}
.proveedor-field {
  min-width: 220px;
}

.proveedor-chip {
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.74rem;
  line-height: 1.1;
}
.proveedor-field {
  min-width: 220px;
}

.proveedor-field .form-control {
  white-space: nowrap;
}
.proveedor-chip:hover {
  transform: translateY(-1px);
}
</style>
