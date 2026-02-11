<!-- src/views/GeneradorOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="generador-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate text-center flex-grow-1 d-none d-sm-block">
          Generador de Cotización
        </h1>

        <button
          class="btn btn-secondary btn-sm d-none d-lg-inline-flex"
          @click="toggleEquiposResponsive"
          :aria-pressed="mostrarEquipos.toString()"
        >
          <i class="bi bi-search me-1"></i>
          {{ mostrarEquipos ? "Ocultar" : "Buscar" }} equipos
        </button>

        <button
          class="btn btn-outline-dark btn-sm d-none d-md-inline-flex"
          @click="toggleMisOC"
          :aria-pressed="mostrarMisOC.toString()"
        >
          <i class="bi bi-receipt-cutoff me-1"></i>
          {{ mostrarMisOC ? "Ocultar mis Cotizaciones" : "Mis Cotizaciones" }}
        </button>

        <button
          class="btn btn-outline-primary btn-sm d-none d-md-inline-flex"
          @click="toggleResumenOC"
          :aria-pressed="mostrarResumenOC.toString()"
        >
          <i class="bi bi-graph-up-arrow me-1"></i>
          {{ mostrarResumenOC ? "Ocultar resumen OC" : "Resumen OC" }}
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
          <!-- ===== MIS OC ===== -->
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
                    <button class="btn btn-sm btn-outline-primary" @click="irADetalleOC(oc)">Ver detalle</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!cargandoMisOC && misOCTotalPages > 1" class="card-footer bg-white">
              <nav aria-label="Paginación OC">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: misOCCurrentPage === 1 }">
                    <button
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
                    <button class="page-link" @click="misOCGoTo(n)">{{ n }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: misOCCurrentPage === misOCTotalPages }">
                    <button
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

          <!-- ===== RESUMEN ===== -->
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
                    <button class="page-link" @click="resumenOCGoTo(n)">{{ n }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: resumenOCCurrentPage === resumenOCTotalPages }">
                    <button
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

          <!-- ===== FORM ===== -->
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
                <button class="btn btn-outline-dark btn-sm" @click="toggleMisOC" :aria-pressed="mostrarMisOC.toString()">
                  <i class="bi bi-receipt-cutoff"></i>
                </button>
                <button class="btn btn-outline-primary btn-sm" @click="toggleResumenOC" :aria-pressed="mostrarResumenOC.toString()">
                  <i class="bi bi-graph-up-arrow"></i>
                </button>
                <button class="btn btn-secondary btn-sm" @click="toggleEquiposResponsive" :aria-pressed="mostrarEquipos.toString()">
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
                <button class="btn btn-sm btn-dark mt-3" @click="router.push('/historial-oc')">Ver mis cotizaciones</button>
              </div>
            </div>

            <div class="card-body">
              <fieldset :disabled="formDisabled" style="border: 0; padding: 0; margin: 0">
                <!-- N° OC -->
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
                      class="btn btn-outline-secondary"
                      type="button"
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

                <!-- SOLPED -->
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="swSolped" v-model="usarSolped" @change="onToggleUsarSolped" />
                  <label class="form-check-label" for="swSolped">¿Asociar a una SOLPED?</label>
                </div>

                <div v-if="usarSolped" class="row g-2 align-items-end">
                  <div class="col-12">
                    <label class="form-label">SOLPED asociada</label>
                    <select class="form-select" v-model="solpedSeleccionadaId" @change="onChangeSolped">
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

                <!-- Items SOLPED -->
                <div v-if="usarSolped && itemsSolped.length" class="card mt-3">
                  <div class="card-header bg-white d-flex align-items-center justify-content-between">
                    <span class="fw-semibold">📦 Ítems de la SOLPED</span>
                    <small class="text-secondary d-none d-sm-inline">Desliza horizontalmente si es necesario</small>
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
                          <tr v-for="it in itemsSolped" :key="it.__tempId">
                            <td data-label="Ítem">{{ it.item }}</td>
                            <td data-label="Descripción" class="w-50">{{ it.descripcion }}</td>
                            <td data-label="Cant. total" class="text-center">{{ it.cantidad }}</td>
                            <td data-label="Cotizado antes" class="text-center">{{ it.cantidad_cotizada || 0 }}</td>
                            <td data-label="Cant. a cotizar">
                              <input
                                type="number"
                                class="form-control form-control-sm"
                                min="0"
                                :max="Math.max(0, (it.cantidad || 0) - (it.cantidad_cotizada || 0))"
                                v-model.number="it.cantidad_para_cotizar"
                              />
                              <div class="form-text">
                                Máx: {{ Math.max(0, (it.cantidad || 0) - (it.cantidad_cotizada || 0)) }}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- ✅ Documentos adjuntos desde SOLPED -->
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

                <!-- Centro costo -->
                <div class="mb-3">
                  <label class="form-label">Centro de Costo</label>
                  <div class="input-group">
                    <input class="form-control" :value="nombreCentroCosto || ''" placeholder="Selecciona un centro…" readonly />
                    <button class="btn btn-outline-primary" @click="modalCentroAbierto = true" aria-label="Seleccionar Centro de Costo">
                      <i class="bi bi-search"></i>
                    </button>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label">N° Patente / Stock</label>
                    <select class="form-select" v-model="tipoCompra">
                      <option value="stock">Stock</option>
                      <option value="patente">Patente</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-6" v-if="tipoCompra === 'patente'">
                    <label class="form-label">Patente destino</label>
                    <input class="form-control" v-model="destinoCompra" placeholder="Escribe la patente" />
                  </div>
                </div>

                <div class="row g-3 mt-1">
                  <div class="col-12 col-md-4">
                    <label class="form-label">Moneda</label>
                    <select class="form-select" v-model="monedaSeleccionada" @change="onCambioMoneda">
                      <option value="CLP">CLP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="UF">UF</option>
                    </select>
                  </div>
                  <div class="col-12 col-md-8">
                    <label class="form-label">Precio Total con IVA</label>
                    <input
                      class="form-control"
                      type="text"
                      :value="precioFormateado"
                      @input="formatearPrecio($event)"
                      placeholder="$ 0"
                      inputmode="numeric"
                    />
                    <div class="form-text">Se formatea automáticamente según moneda seleccionada.</div>
                  </div>
                </div>

                <div v-if="aprobadorSugerido" class="alert alert-info d-flex align-items-center mt-3">
                  <i class="bi bi-person-check me-2"></i>
                  <div><strong>Aprobador sugerido:</strong> {{ aprobadorSugerido }}</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Comentario</label>
                  <textarea class="form-control" rows="3" v-model="comentario" placeholder="Agrega un comentario opcional…"></textarea>
                </div>

                <!-- Archivos -->
                <div class="mb-3">
                  <label class="form-label">Archivos PDF, Imagen o Excel (se convierte a PDF)</label>

                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <input
                      id="inputArchivo"
                      type="file"
                      multiple
                      accept="application/pdf,image/*,.xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      class="d-none"
                      @change="onMultipleFilesSelected"
                    />
                    <button class="btn btn-outline-primary" @click="abrirSelectorArchivos">
                      <i class="bi bi-paperclip me-1"></i> Seleccionar archivos
                    </button>
                    <small class="text-secondary">Puedes subir más de uno.</small>
                  </div>

                  <div class="form-text">
                    Puedes adjuntar archivos nuevos y/o reutilizar documentos adjuntos desde la SOLPED.
                    Si seleccionas Excel/CSV, se convertirá a PDF automáticamente.
                  </div>
                </div>

                <!-- ✅ PREVIEW / DESCARGA SEGÚN TIPO -->
                <div v-for="(archivo, i) in archivos" :key="archivo.__k" class="card mb-2">
                  <div class="card-header d-flex align-items-center">
                    <div class="fw-semibold me-auto text-truncate">
                      <span v-if="archivo.fromSolped" class="badge bg-secondary-subtle text-secondary-emphasis me-2">SOLPED</span>
                      <span v-if="archivo.convertedFromExcel" class="badge bg-warning-subtle text-warning-emphasis me-2">EXCEL→PDF</span>
                      {{ archivo.name }}
                    </div>
                    <button class="btn btn-sm btn-outline-danger" @click="eliminarArchivo(i)" aria-label="Eliminar archivo">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>

                  <div class="card-body">
                    <!-- PDF -->
                    <div v-if="isPdfArchivo(archivo)" class="ratio ratio-16x9">
                      <iframe v-if="archivo.previewUrl" :src="archivo.previewUrl + '#toolbar=0'" style="border: none"></iframe>
                    </div>

                    <!-- Imagen -->
                    <div v-else-if="isImageArchivo(archivo)" class="text-center">
                      <img
                        v-if="archivo.previewUrl"
                        :src="archivo.previewUrl"
                        alt="Vista previa"
                        class="img-fluid rounded shadow-sm"
                        style="max-height: 700px; object-fit: contain"
                      />
                    </div>

                    <!-- ✅ Excel/otros: NO vista previa -> mostrar descarga -->
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

        <!-- ===== PANEL EQUIPOS DESKTOP ===== -->
        <aside class="col-12 col-lg-4 d-none d-lg-block" v-if="mostrarEquipos">
          <div class="card h-100 card-elevated sticky-panel">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🔎 Buscar equipos</div>
              <button class="btn btn-sm btn-outline-secondary d-lg-none" @click="cerrarEquiposMobile">Cerrar</button>
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
                      <button class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">Copiar</button>
                    </div>
                  </div>
                </div>
              </div>

              <nav v-if="totalPages > 1" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Anterior">
                      «
                    </button>
                  </li>
                  <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                    <button class="page-link" @click="goToPage(n)">{{ n }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" aria-label="Siguiente">
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

    <!-- ===== PANEL EQUIPOS MOBILE ===== -->
    <transition name="oc">
      <div v-if="showEquiposMobile" class="oc-wrap d-lg-none" @keydown.esc="cerrarEquiposMobile">
        <div class="oc-backdrop" @click="cerrarEquiposMobile"></div>

        <div class="oc-panel" role="dialog" aria-modal="true" aria-label="Buscar equipos">
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">🔎 Buscar equipos</h2>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-dark" @click="cerrarEquiposMobile" aria-label="Cerrar">
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
                    <button class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">Copiar</button>
                  </div>
                </div>
              </div>
            </div>

            <nav v-if="totalPages > 1" class="mt-3">
              <ul class="pagination justify-content-center mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Anterior">«</button>
                </li>
                <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                  <button class="page-link" @click="goToPage(n)">{{ n }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages " aria-label="Siguiente">»</button>
                </li>
              </ul>
            </nav>

            <div class="mt-2 small text-secondary" v-if="equiposLoaded && equiposAll.length">Base cargada: {{ equiposAll.length }} equipos.</div>
          </div>

          <div class="oc-footer">
            <button class="btn btn-outline-secondary" @click="cerrarEquiposMobile">Cerrar</button>
          </div>
        </div>
      </div>
    </transition>

    <button
      class="btn btn-primary floating-equipos-btn d-lg-none"
      @click="toggleEquiposResponsive"
      :title="showEquiposMobile ? 'Ocultar búsqueda de equipos' : 'Buscar equipos'"
      aria-label="Abrir buscador de equipos"
    >
      <i class="bi bi-search"></i>
    </button>

    <!-- ===== MODAL CENTRO COSTO ===== -->
    <div v-if="modalCentroAbierto" class="vmodal-backdrop" @click.self="modalCentroAbierto = false">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Selecciona Centro de Costo</h5>
        </div>
        <div class="vmodal-body">
          <div class="input-group mb-2">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input class="form-control" placeholder="Buscar contrato o código…" v-model="filtroCentro" />
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
          <button class="btn btn-outline-secondary" @click="modalCentroAbierto = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- ===== TOASTS ===== -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i
          class="me-2"
          :class="t.type === 'success' ? 'bi bi-check-circle-fill' : (t.type === 'warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"
        ></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>

    <!-- ===== OVERLAY CARGA (CONVERSIÓN / ENVÍO) ===== -->
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
  collection, getDocs, getDoc, doc, query, where, orderBy, limit, addDoc, updateDoc,
  onSnapshot, Timestamp, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

const router = useRouter();
const route = useRoute();
const volver = () => router.back();
const auth = useAuthStore();

/** ===== OVERLAY CARGA ===== */
const busy = reactive({
  on: false,
  label: "Procesando…",
  hint: "",
  progress: null, // number|null
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
  return totalAprobadasDelUsuario.value >= 10;
});

const mostrarBloqueoAprobadas = computed(() => {
  const roleKey = normalizeRole(userRole.value);
  const esEditor = roleKey === "editor";
  if (!esEditor) return false;
  if (!aprobadasListo.value) return false;
  return aprobadasState.ok && totalAprobadasDelUsuario.value >= 10;
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

  if (!equiposLoaded.value) {
    await ensureEquiposLoaded();
  }
  if (!equiposLoaded.value) {
    resultadosEquipos.value = [];
    return;
  }

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
  { Key: '23302', name:'CONTRATO 23302'}
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

const tipoCompra = ref("stock");
const destinoCompra = ref("");

const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");
const aprobadorSugerido = ref("");
const empresaPorDefecto = "Xtreme Servicio";
const tipoCambioUSD = 950;
const tipoCambioEUR = 1050;

const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");

/** ===== ARCHIVOS ===== **/
const archivos = ref([]);

/** ✅ Helpers de tipo para PREVIEW/DESCARGA */
const isPdfArchivo = (a) => {
  const t = String(a?.tipo || "").toLowerCase();
  const n = String(a?.name || "").toLowerCase();
  return t.includes("pdf") || n.endsWith(".pdf");
};
const isImageArchivo = (a) => {
  const t = String(a?.tipo || "").toLowerCase();
  return t.startsWith("image/");
};
const isExcelArchivo = (a) => {
  const t = String(a?.tipo || "").toLowerCase();
  const n = String(a?.name || "").toLowerCase();
  return (
    n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv") ||
    t.includes("spreadsheet") || t.includes("excel") || t.includes("vnd.ms-excel") ||
    t.includes("vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    t.includes("csv") || t.includes("text/csv")
  );
};

const abrirSelectorArchivos = () => {
  const input = document.getElementById("inputArchivo");
  if (input) input.click();
};

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
  // Requiere: npm i xlsx jspdf jspdf-autotable
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

const onMultipleFilesSelected = async (e) => {
  const list = Array.from(e.target.files || []);
  if (!list.length) return;

  setBusy(true, "Procesando archivos…", "Validando y preparando adjuntos", 5);

  try {
    let idx = 0;
    for (const file of list) {
      idx++;
      const pct = Math.round((idx / list.length) * 100);

      if (!file || file.size === 0) {
        addToast("warning", `Archivo inválido: ${file?.name || "desconocido"}`);
        continue;
      }

      // Excel/CSV -> PDF
      if (isExcelLike(file)) {
        setBusy(true, "Convirtiendo Excel a PDF…", file.name, Math.min(95, pct));
        try {
          const pdfFile = await excelFileToPdfFile(file);
          archivos.value.push({
            file: pdfFile,
            name: pdfFile.name,
            tipo: pdfFile.type,
            previewUrl: URL.createObjectURL(pdfFile),
            convertedFromExcel: true,
            __k: `${pdfFile.name}-${pdfFile.size}-${Date.now()}-${Math.random()}`,
          });
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

      setBusy(true, "Procesando archivos…", `${file.name}`, Math.min(95, pct));
    }

    if (!archivos.value.length) addToast("warning", "Ningún archivo válido fue seleccionado.");
  } finally {
    setBusy(false);
    try { if (e?.target) e.target.value = ""; } catch(e2) { console.log(e2); }
  }
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
    if (snap.exists()) {
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
      itemsSolped.value = todos
        .filter((it) => (it.estado || "").toLowerCase() !== "cotizado completado")
        .map((it) => ({
          ...it,
          cantidad_cotizada: Number(it.cantidad_cotizada || 0) || 0,
          cantidad_para_cotizar: 0,
          __tempId: `${it.item}-${it.descripcion}`,
        }));

      centroCosto.value = data.numero_contrato || centroCosto.value;
      archivos.value = archivos.value.filter((a) => !a?.fromSolped);
    }
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

  const empresa = (empresaBase || "").toLowerCase();

  if (empresa === "xtreme mining") {
    if (totalCLP <= 500000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 1000000) aprobadorSugerido.value = "Felipe Gonzalez / Ricardo Santibañez";
    else if (totalCLP <= 2000000) aprobadorSugerido.value = "Patricio Muñoz";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Juan Cubillos / César Palma";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else if (empresa === "xtreme servicio") {
    if (totalCLP <= 500000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Juan Cubillos";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else if (empresa === "xtreme hormigones") {
    if (totalCLP <= 1000000) aprobadorSugerido.value = "Felipe Gonzalez / Ricardo Santibañez";
    else if (totalCLP <= 3000000) aprobadorSugerido.value = "Patricio Muñoz";
    else if (totalCLP <= 7000000) aprobadorSugerido.value = "César Palma";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else {
    aprobadorSugerido.value = "Empresa no reconocida";
  }
};

const mapearItemsSegunRegla = (itemsFuente) => {
  const salida = (itemsFuente || []).map((item) => {
    const cantidadTotal = Number(item.cantidad || 0);
    const cantidadAntes = Number(item.cantidad_cotizada || 0);
    const cantidadNueva = Number(item.cantidad_para_cotizar || 0);
    const cantidadActualizada = cantidadAntes + cantidadNueva;

    const estadoVisual = cantidadNueva > 0 ? "revision" : "pendiente";
    let estadoCotizacion = "ninguno";
    if (cantidadTotal > 0 && cantidadActualizada >= cantidadTotal) {
      estadoCotizacion = "completo";
    } else if (cantidadNueva > 0) {
      estadoCotizacion = "parcial";
    }

    return {
      ...item,
      cantidad_cotizada: cantidadActualizada,
      cantidad_para_cotizar: cantidadNueva,
      estado: estadoVisual,
      estado_cotizacion: estadoCotizacion,
    };
  });

  return salida;
};

const actualizarSolpedAsociada = async (solpedId, itemsRegla, nombreUsuario) => {
  if (!solpedId) return;
  const srefDoc = doc(db, "solpes", solpedId);
  const ss = await getDoc(srefDoc);
  if (!ss.exists()) return;

  const dataSol = ss.data() || {};
  const originales = Array.isArray(dataSol.items) ? dataSol.items : [];
  const byKey = new Map(itemsRegla.map((it) => [`${it.item}-${it.descripcion}`, it]));

  const actualizados = originales.map((it) => {
    const clave = `${it.item}-${it.descripcion}`;
    const upd = byKey.get(clave);
    if (!upd) return it;

    const ant = Number(it.cantidad_cotizada || 0);
    const nueva = Number(upd.cantidad_para_cotizar || 0);
    const total = Number(it.cantidad || 0);
    const final = ant + nueva;

    const estadoVisual = nueva > 0 ? "revisión" : "pendiente";
    let estadoCot = "ninguno";
    if (total > 0 && final >= total) estadoCot = "completo";
    else if (nueva > 0) estadoCot = "revisión";

    return { ...it, cantidad_cotizada: final, estado: estadoVisual, estado_cotizacion: estadoCot };
  });

  await updateDoc(srefDoc, { items: actualizados, estatus: "Cotizado parcial" });

  const hcoll = collection(db, "solpes", solpedId, "historialEstados");
  await addDoc(hcoll, {
    usuario: nombreUsuario || "Sistema",
    fecha: serverTimestamp(),
    estatus: "Cotización enviada - Revisión Guillermo",
  });
};

const enviarOC = async () => {
  if (enviando.value) return;

  await refrescarAprobadasConCount();

  if (bloqueoPorAprobadas.value) {
    const msgExtra = aprobadasState.ok
      ? `Tienes ${totalAprobadasDelUsuario.value} cotizaciones en "Aprobado" (últimos 2 meses).`
      : `No se pudo validar el límite (índice/reglas).`;
    addToast("warning", `${msgExtra} Ve al detalle y súbelas antes de continuar.`);
    return;
  }

  if (!centroCosto.value.trim()) { addToast("warning", "Selecciona Centro de Costo"); return; }
  if (!tipoCompra.value) { addToast("warning", "Selecciona tipo de compra"); return; }
  if (tipoCompra.value === "patente" && !destinoCompra.value.trim()) { addToast("warning", "Ingresa la patente"); return; }
  if (!precioTotalConIVA.value || precioTotalConIVA.value <= 0) { addToast("warning", "Precio inválido"); return; }
  if (!monedaSeleccionada.value) { addToast("warning", "Selecciona moneda"); return; }
  if (usarSolped.value && !solpedSeleccionadaId.value) { addToast("warning", "Selecciona una SOLPED o desactiva la opción"); return; }

  // ✅ Validación items
  if (usarSolped.value && solpedSeleccionadaId.value) {
    const items = itemsSolped.value || [];
    const alguno = items.some((it) => Number(it?.cantidad_para_cotizar || 0) > 0);
    if (!alguno) {
      addToast("warning", "Debes ingresar al menos una 'Cant. a cotizar' (mayor a 0) para enviar la cotización.");
      return;
    }
    for (const it of items) {
      const total = Number(it?.cantidad || 0);
      const antes = Number(it?.cantidad_cotizada || 0);
      const max = Math.max(0, total - antes);
      const nueva = Number(it?.cantidad_para_cotizar || 0);

      if (nueva < 0) {
        addToast("warning", `Ítem ${it?.item ?? ""}: la cantidad a cotizar no puede ser negativa.`);
        return;
      }
      if (nueva > max) {
        addToast("warning", `Ítem ${it?.item ?? ""}: (${nueva}) supera el máximo permitido (${max}).`);
        return;
      }
    }
  }

  const tieneAlMenosUnAdjunto = archivos.value.length > 0;
  if (!tieneAlMenosUnAdjunto) {
    addToast("warning", "Debes adjuntar al menos un archivo (o reutilizar el/los adjuntos de la SOLPED).");
    return;
  }

  enviando.value = true;
  setBusy(true, "Enviando cotización…", "Subiendo archivos", 5);

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

    const qy = query(collection(db, "ordenes_oc"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId = Number(lastId) + 1;

    const centroFound = centrosCostoLista.value.find((c) => c.key === centroCosto.value);
    const centroNombre = centroFound?.name || "Desconocido";

    const empresaElegida = (usarSolped.value && solpedSeleccionada.value?.empresa)
      ? solpedSeleccionada.value.empresa
      : empresaPorDefecto;

    const estatusInicial = "Revisión Guillermo";
    const comentarioFinal = (comentario.value || "").trim();

    let itemsOC = [];
    if (usarSolped.value && solpedSeleccionadaId.value) {
      itemsOC = mapearItemsSegunRegla(itemsSolped.value);
    }

    const storage = getStorage();
    const subidos = [];

    const totalAdj = archivos.value.length || 1;
    let doneAdj = 0;

    for (const a of archivos.value) {
      doneAdj++;
      const pct = Math.min(90, 10 + Math.round((doneAdj / totalAdj) * 80));
      setBusy(true, "Enviando cotización…", `Subiendo adjunto ${doneAdj} de ${totalAdj}`, pct);

      // ✅ SOLPED (ya tiene URL) -> NO re-subir
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

      // ✅ archivo nuevo -> subir a Storage
      if (!a.file || a.file.size < 100) continue;

      const safeName = String(a.name || "archivo")
        .replace(/[^\w.\-() ]+/g, "_")
        .slice(0, 120);

      const path = `ordenes_oc/${newId}/${safeName}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, a.file);
      const url = await getDownloadURL(up.ref);
      subidos.push({ nombre: safeName, tipo: a.tipo, url, origen: "upload" });
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
      historial: [{
        usuario: nombreUsuario,
        estatus: estatusInicial,
        fecha: new Date().toISOString(),
        comentario: comentarioFinal,
      }],
      responsable: nombreUsuario,
      comentario: comentarioFinal,
      numero_contrato: centroCosto.value,
      nombre_centro_costo: centroNombre,
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,
      aprobadorSugerido: aprobadorSugerido.value || "",
      empresa: empresaElegida,
      archivosStorage: subidos,
      ...(usarSolped.value && solpedSeleccionadaId.value ? {
        solpedId: solpedSeleccionadaId.value,
        numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
        tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
        items: itemsOC,
      } : {
        tipo_solped: "Sin SOLPED",
      }),
    };

    const newDocRef = await addDoc(collection(db, "ordenes_oc"), dataToSave);
    const newDocId = newDocRef.id;
    await updateDoc(newDocRef, { __docId: newDocId });

    if (usarSolped.value && solpedSeleccionadaId.value) {
      await actualizarSolpedAsociada(solpedSeleccionadaId.value, itemsOC, nombreUsuario);
    }

    setBusy(true, "Listo ✅", "Cotización enviada correctamente", 100);
    addToast("success", "Cotización enviada exitosamente.");

    // reset
    centroCosto.value = "";
    tipoCompra.value = "stock";
    destinoCompra.value = "";
    for (const a of archivos.value) {
      try {
        if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
      } catch (e) { console.log(e); }
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
    monedaSeleccionada.value = "CLP";
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

watch(() => usuarioActual.value, async (nv) => {
  if (!nv) return;
  await refrescarAprobadasConCount();
  suscribirAprobadasLiveMinima();
  if (mostrarMisOC.value) suscribirMisOC();
  if (mostrarResumenOC.value) suscribirResumenOC(nv);
});

onMounted(async () => {
  computeIsDesktop();
  window.addEventListener("resize", onResize);

  await obtenerNombreUsuario();
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
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.documentElement.style.overflow = "";
  if (_unsubMisOC) _unsubMisOC();
  if (_unsubAprobadasLive) _unsubAprobadasLive();
  if (_unsubResumenOC) _unsubResumenOC();
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
  max-width: 560px;
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

/* ===== OVERLAY CARGA ===== */
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

/* ✅ Bloque descarga Excel */
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
</style>
