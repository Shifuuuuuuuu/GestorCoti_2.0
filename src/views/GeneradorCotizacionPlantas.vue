<!-- src/views/GeneradorCotizacionPlantas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="generador-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate text-center flex-grow-1 d-none d-sm-block">
          Generador de Cotización · Plantas
        </h1>

        <button
          type="button"
          class="btn btn-outline-dark btn-sm"
          @click="toggleMisCotizaciones"
          :aria-pressed="mostrarMisCotizaciones.toString()"
        >
          <i class="bi bi-receipt-cutoff me-1"></i>
          {{ mostrarMisCotizaciones ? "Ocultar mis cotizaciones" : "Mis cotizaciones" }}
        </button>
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
          class="btn btn-outline-success btn-sm"
          @click="abrirCrucePrecios"
        >
          <i class="bi bi-shuffle me-1"></i>
          Cruce de precios
        </button>
      </div>

      <div class="row g-3">
        <div class="col-12" :class="mostrarEquipos ? 'col-lg-8' : 'col-lg-12'">
          <!-- MIS COTIZACIONES -->
          <div v-if="mostrarMisCotizaciones" class="card mb-3 card-elevated">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🧾 Mis cotizaciones de plantas</div>
              <span class="badge bg-dark-subtle text-dark-emphasis">{{ misCotizaciones.length }} en total</span>
            </div>

            <div class="card-body p-0">
              <div v-if="cargandoMisCotizaciones" class="p-3 text-center">
                <div class="spinner-border" role="status"></div>
                <div class="small mt-2">Cargando…</div>
              </div>

              <div v-else-if="misCotizaciones.length === 0" class="p-3 text-secondary text-center">
                No hay cotizaciones registradas.
              </div>

              <div v-else class="list-group list-group-flush">
                <div
                  class="list-group-item d-flex align-items-start flex-wrap gap-2"
                  v-for="oc in misCotizacionesPaginadas"
                  :key="oc.__docId"
                >
                  <div class="me-auto">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="fw-semibold">N° {{ oc.id ?? "—" }}</span>
                      <span class="badge" :class="estadoBadgeClass(oc.estatus)">
                        {{ oc.estatus || "—" }}
                      </span>
                    </div>

                    <div class="small text-secondary mt-1">
                      <strong>SOLPED:</strong> #{{ oc.numero_solpe || "—" }} ·
                      <strong>Centro:</strong> {{ oc.nombre_centro_costo || "—" }} ·
                      <strong>Total:</strong> {{ fmtMoney(oc.precioTotalConIVA, oc.moneda) }}
                    </div>

                    <div class="small text-secondary">
                      <strong>Fecha:</strong> {{ fmtFecha(oc.fechaSubida) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!cargandoMisCotizaciones && misCotizacionesTotalPages > 1" class="card-footer bg-white">
              <nav aria-label="Paginación mis cotizaciones">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: misCotizacionesPage === 1 }">
                    <button
                      type="button"
                      class="page-link"
                      @click="goMisCotizacionesPage(misCotizacionesPage - 1)"
                      :disabled="misCotizacionesPage === 1"
                    >
                      «
                    </button>
                  </li>

                  <li
                    class="page-item"
                    v-for="n in misCotizacionesVisiblePages"
                    :key="'mc-' + n"
                    :class="{ active: misCotizacionesPage === n }"
                  >
                    <button type="button" class="page-link" @click="goMisCotizacionesPage(n)">
                      {{ n }}
                    </button>
                  </li>

                  <li class="page-item" :class="{ disabled: misCotizacionesPage === misCotizacionesTotalPages }">
                    <button
                      type="button"
                      class="page-link"
                      @click="goMisCotizacionesPage(misCotizacionesPage + 1)"
                      :disabled="misCotizacionesPage === misCotizacionesTotalPages"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <!-- FORMULARIO -->
          <div class="card card-elevated">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Subir cotización de plantas</div>
              <span class="badge bg-primary-subtle text-primary-emphasis">Aprobador: Alejandro Candia</span>
            </div>

            <div class="card-body">
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
                    <span v-else class="spinner-border spinner-border-sm"></span>
                  </button>
                </div>

                <div class="form-text">Se asigna automáticamente y es de solo lectura.</div>
              </div>

              <!-- SELECT SOLPED -->
              <div class="mb-3">
                <label class="form-label">SOLPED de planta aprobada</label>
                <select
                  ref="solpedSelectRef"
                  class="form-select"
                  :class="{ 'is-invalid': invalidField === 'solped' }"
                  v-model="solpedSeleccionadaId"
                  @change="onChangeSolped"
                >
                  <option value="">— Selecciona —</option>
                  <option v-for="solpe in solpedDisponibles" :key="solpe.id" :value="solpe.id">
                    #{{ solpe.numero_solpe }} · {{ solpe.nombre_solped }} ·
                    {{ solpe.nombre_centro_costo }} ·
                    {{ solpe.usuario || "—" }} ·
                    Estatus: {{ solpe.estatus || "—" }}
                  </option>
                </select>
              </div>

              <!-- RESUMEN SOLPED -->
              <div v-if="solpedSeleccionada" class="row g-3 mt-1">
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">N° SOLPED</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.numero_solpe }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Centro de costo</div>
                  <div class="fw-semibold">
                    {{ solpedSeleccionada.numero_contrato }} — {{ solpedSeleccionada.nombre_centro_costo }}
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Empresa</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.empresa }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Tipo / Nombre</div>
                  <div class="fw-semibold">
                    {{ solpedSeleccionada.tipo_solped }} — {{ solpedSeleccionada.nombre_solped }}
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Aprobación SOLPED</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.estadoAprobacionSolped || "—" }}</div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Estatus actual</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.estatus || "—" }}</div>
                </div>
              </div>

              <!-- ITEMS -->
              <div v-if="solpedSeleccionada && itemsSolped.length" class="card mt-3">
                <div class="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div class="fw-semibold">📦 Ítems disponibles para cotizar</div>
                  <small class="text-secondary">Sólo se muestran ítems pendientes o parciales</small>
                </div>

                <div class="card-body">
                  <div class="table-responsive table-stacked-sm">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th style="width: 60px">Ítem</th>
                          <th>Descripción</th>
                          <th class="text-center">Cant. total</th>
                          <th class="text-center">Unidad</th>
                          <th class="text-center">Cotizado antes</th>
                          <th class="text-center">Disponible</th>
                          <th class="text-center">Estado</th>
                          <th style="width: 180px">Cant. a cotizar</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in itemsSolped" :key="it.__k">
                          <td data-label="Ítem">{{ it.item }}</td>

                          <td data-label="Descripción" class="w-50">
                            <div class="fw-semibold">{{ it.descripcion || "—" }}</div>
                            <div class="small text-secondary">
                              Código: {{ it.codigo_referencial || "SIN CÓDIGO" }}
                            </div>
                          </td>

                          <td data-label="Cant. total" class="text-center">
                            {{ formatCantidad2D(it.cantidad) }}
                          </td>

                          <td data-label="Unidad" class="text-center">
                            {{ it.unidad || "UNIDAD" }}
                          </td>

                          <td data-label="Cotizado antes" class="text-center">{{ it.cantidad_cotizada || 0 }}</td>
                          <td data-label="Disponible" class="text-center">{{ it.__max }}</td>

                          <td data-label="Estado" class="text-center">
                            <span
                              class="badge rounded-pill px-3"
                              :style="{ background: getBadgeColor(it.estado || 'pendiente'), color: '#fff' }"
                            >
                              {{ it.estado || "pendiente" }}
                            </span>
                          </td>

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
                              Total: {{ formatCantidad2D(it.cantidad) }} {{ it.unidad || "UNIDAD" }} ·
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

                  <!-- ADJUNTOS DE SOLPED -->
                  <div v-if="autorizacionesSolped.length" class="mt-3">
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div class="fw-semibold d-flex align-items-center gap-2">
                        <i class="bi bi-paperclip"></i>
                        Documentos adjuntos de la SOLPED
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

              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Centro de costo</label>
                  <input class="form-control" :value="nombreCentroCosto" readonly />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Aprobador sugerido</label>
                  <input class="form-control fw-semibold" :value="APROBADOR_FIJO" readonly />
                </div>
              </div>
              <div class="mb-3 mt-3">
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

                <div class="form-text">
                  Debes elegir un proveedor registrado en Firestore.
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
              <div class="alert alert-info d-flex align-items-start mt-3" role="alert">
                <i class="bi bi-person-check fs-5 me-2"></i>
                <div>
                  <div class="fw-semibold">Aprobador sugerido: {{ APROBADOR_FIJO }}</div>
                  <div class="small">La cotización se enviará a aprobación con estatus inicial <strong>Pendiente de Aprobación</strong>.</div>
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
                  <div class="form-text">Se formatea automáticamente según la moneda seleccionada.</div>
                </div>
              </div>

              <div class="mb-3 mt-3">
                <label class="form-label">Comentario</label>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="comentario"
                  placeholder="Agrega un comentario opcional…"
                ></textarea>
              </div>

              <!-- ARCHIVOS -->
              <div class="mb-3">
                <label class="form-label">Archivos PDF o Imagen</label>

                <input
                  id="inputArchivoPlantas"
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

                  <div class="fw-semibold mb-1">Arrastra aquí tus archivos</div>

                  <div class="text-secondary small mb-2">
                    o haz clic para seleccionarlos
                  </div>

                  <div class="d-flex justify-content-center flex-wrap gap-2">
                    <span class="badge bg-secondary-subtle text-secondary-emphasis">PDF</span>
                    <span class="badge bg-secondary-subtle text-secondary-emphasis">Imágenes</span>
                    <span class="badge bg-secondary-subtle text-secondary-emphasis">Excel → PDF</span>
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

                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="eliminarArchivo(i)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>

                <div class="card-body">
                  <div v-if="isPdfArchivo(archivo)" class="ratio ratio-16x9">
                    <iframe v-if="archivo.previewUrl" :src="archivo.previewUrl + '#toolbar=0'" style="border:none"></iframe>
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
                      <i class="bi" :class="isExcelArchivo(archivo) ? 'bi-file-earmark-excel-fill' : 'bi-file-earmark-fill'"></i>
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
                  </div>
                </div>
              </div>

              <div class="d-grid mt-3">
                <button
                  type="button"
                  class="btn btn-danger btn-lg"
                  :disabled="enviando"
                  @click="enviarCotizacion"
                >
                  <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
                  Enviar Cotización
                </button>
              </div>
            </div>
          </div>
        </div>
        <aside class="col-12 col-lg-4 d-none d-lg-block" v-if="mostrarEquipos">
          <div class="card h-100 card-elevated sticky-panel">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🔎 Buscar equipos</div>
              <button type="button" class="btn btn-sm btn-outline-secondary d-lg-none" @click="cerrarEquiposMobile">
                Cerrar
              </button>
            </div>

            <div class="card-body d-flex flex-column">
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  class="form-control"
                  placeholder="Busca por código, chasis, marca, modelo, localización, tipo…"
                  v-model="busquedaEquipo"
                  @input="aplicarFiltrosEquiposDebounced"
                />
              </div>

              <div v-if="equiposLoadingAll" class="text-center text-secondary py-2 small">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Cargando base de equipos…
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
                      <button type="button" class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <nav v-if="totalPagesEquipos > 1" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPageEquipos === 1 }">
                    <button
                      type="button"
                      class="page-link"
                      @click="goToPageEquipos(currentPageEquipos - 1)"
                      :disabled="currentPageEquipos === 1"
                    >
                      «
                    </button>
                  </li>

                  <li
                    class="page-item"
                    v-for="n in visiblePageButtonsEquipos"
                    :key="n"
                    :class="{ active: currentPageEquipos === n }"
                  >
                    <button type="button" class="page-link" @click="goToPageEquipos(n)">{{ n }}</button>
                  </li>

                  <li class="page-item" :class="{ disabled: currentPageEquipos === totalPagesEquipos }">
                    <button
                      type="button"
                      class="page-link"
                      @click="goToPageEquipos(currentPageEquipos + 1)"
                      :disabled="currentPageEquipos === totalPagesEquipos"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </aside>
      </div>
      </div>

    </div>

    <transition name="oc">
      <div v-if="showEquiposMobile" class="oc-wrap d-lg-none" @keydown.esc="cerrarEquiposMobile">
        <div class="oc-backdrop" @click="cerrarEquiposMobile"></div>

        <div class="oc-panel" role="dialog" aria-modal="true" aria-label="Buscar equipos">
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">🔎 Buscar equipos</h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-outline-dark" @click="cerrarEquiposMobile">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <div class="input-group mb-3">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                class="form-control"
                placeholder="Busca por código, chasis, marca, modelo, localización, tipo…"
                v-model="busquedaEquipo"
                @input="aplicarFiltrosEquiposDebounced"
              />
            </div>

            <div v-if="equiposLoadingAll" class="text-center text-secondary py-2 small">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Cargando base de equipos…
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
                    <button type="button" class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <nav v-if="totalPagesEquipos > 1" class="mt-3">
              <ul class="pagination justify-content-center mb-0">
                <li class="page-item" :class="{ disabled: currentPageEquipos === 1 }">
                  <button
                    type="button"
                    class="page-link"
                    @click="goToPageEquipos(currentPageEquipos - 1)"
                    :disabled="currentPageEquipos === 1"
                  >
                    «
                  </button>
                </li>

                <li
                  class="page-item"
                  v-for="n in visiblePageButtonsEquipos"
                  :key="n"
                  :class="{ active: currentPageEquipos === n }"
                >
                  <button type="button" class="page-link" @click="goToPageEquipos(n)">{{ n }}</button>
                </li>

                <li class="page-item" :class="{ disabled: currentPageEquipos === totalPagesEquipos }">
                  <button
                    type="button"
                    class="page-link"
                    @click="goToPageEquipos(currentPageEquipos + 1)"
                    :disabled="currentPageEquipos === totalPagesEquipos"
                  >
                    »
                  </button>
                </li>
              </ul>
            </nav>
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
<div
  v-if="modalProveedorAbierto"
  class="vmodal-backdrop"
  @click.self="modalProveedorAbierto = false"
>
  <div class="vmodal">
    <div class="vmodal-header d-flex align-items-center justify-content-between">
      <h5 class="mb-0">Selecciona Proveedor</h5>

      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        @click="modalProveedorAbierto = false"
      >
        <i class="bi bi-x-lg"></i>
      </button>
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

    <div class="vmodal-footer d-flex justify-content-end">
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
<div v-if="modalCrucePrecios" class="vmodal-backdrop" @click.self="cerrarCrucePrecios">
  <div class="vmodal vmodal-xxl">
    <div class="vmodal-header d-flex align-items-center justify-content-between">
      <div>
        <h4 class="mb-0">Cruce de precios</h4>
        <div class="small text-secondary">
          Selecciona los ítems que quieres comparar. Funciona con los ítems pendientes o parciales de la SOLPED de plantas.
        </div>
      </div>

      <button type="button" class="btn btn-outline-secondary btn-sm" @click="cerrarCrucePrecios">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div class="vmodal-body">
      <div class="row g-3">
        <!-- IZQUIERDA -->
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
                        Cantidad: {{ formatCantidad2D(it.cantidad) }} {{ it.unidad || "UNIDAD" }} ·
                        Estado: {{ it.estado || "—" }}
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
                      <div class="col-12">
                        <label class="form-label form-label-sm">Código</label>
                        <input v-model="it.codigo_referencial" class="form-control form-control-sm" />
                      </div>
                    </div>

                    <div class="row g-2 mt-1">
                      <div class="col-6">
                        <label class="form-label form-label-sm">Cantidad</label>
                        <input
                          :value="formatCantidad2D(it.cantidad)"
                          type="text"
                          inputmode="numeric"
                          class="form-control form-control-sm"
                          @input="it.cantidad = formatCantidad2D($event.target.value)"
                        />
                      </div>

                      <div class="col-6">
                        <label class="form-label form-label-sm">Unidad</label>
                        <select v-model="it.unidad" class="form-select form-select-sm">
                          <option value="KG">KG</option>
                          <option value="LITROS">LITROS</option>
                          <option value="CM">CM</option>
                          <option value="MM">MM</option>
                          <option value="METROS">METROS</option>
                          <option value="UNIDAD">UNIDAD</option>
                        </select>
                      </div>
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

        <!-- DERECHA -->
        <div class="col-12 col-xl-8">
          <div class="card h-100 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div class="fw-semibold">Comparación manual por proveedor</div>
                <div class="small text-secondary">
                  Ítems seleccionados: {{ selectedCruceItems.length }} · PDF listo para adjuntar al final
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
                Selecciona uno o más ítems.
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
                        Cantidad total: {{ activeCruceItem.cantidadTotalDisplay || formatCantidad2D(activeCruceItem.cantidadTotal) }} {{ activeCruceItem.unidad || "UNIDAD" }}
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
                        <div class="fw-semibold">
                          {{ activeCruceItem.cantidadTotalDisplay || formatCantidad2D(activeCruceItem.cantidadTotal) }}
                          {{ activeCruceItem.unidad || "UNIDAD" }}
                        </div>
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
    <!-- TOASTS -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i
          class="me-2"
          :class="t.type === 'success'
            ? 'bi bi-check-circle-fill'
            : (t.type === 'warning'
              ? 'bi bi-exclamation-triangle-fill'
              : 'bi bi-x-circle-fill')"
        ></i>
        <span class="me-3">{{ t.text }}</span>
        <button type="button" class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>

    <!-- BUSY -->
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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from "vue";
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
  runTransaction,
  serverTimestamp,
  Timestamp,
  startAt,
  endAt,
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";
const modalCrucePrecios = ref(false);

const manualCruceItems = ref([]);
const selectedCruceKeys = ref([]);
const cruceManualItems = ref([]);
const cruceManualIndex = ref(0);

const mostrarEquipos = ref(false);
const isDesktop = ref(false);
const showEquiposMobile = ref(false);

const busquedaEquipo = ref("");
const cargandoEquipos = ref(false);
const resultadosEquipos = ref([]);
const currentPageEquipos = ref(1);

const equiposAll = ref([]);
const equiposIndex = ref([]);
const equiposLoaded = ref(false);
const equiposLoadingAll = ref(false);

let debounceTimerEquipos = null;
let lastSearchTokenEquipos = 0;
const cacheResultadosEquipos = new Map();

const totalCruceItems = computed(() => cruceManualItems.value.length);

const activeCruceItem = computed(() => {
  return cruceManualItems.value[cruceManualIndex.value] || null;
});

const itemsCruceBase = computed(() => {
  return (itemsSolped.value || [])
    .map((it) => {
      const cantidadNum = parseCantidad2D(it?.cantidad ?? 1);
      const cantidadCotizada = Math.max(0, Number(it?.cantidad_cotizada ?? 0));
      const disponible = Math.max(0, cantidadNum - cantidadCotizada);

      return {
        ...it,
        cantidad: formatCantidad2D(it?.cantidad ?? 1),
        cantidad_num: cantidadNum,
        unidad: normalizeUnidadPlantas(it?.unidad),
        cantidad_cotizada: cantidadCotizada,
        restante_cruce: disponible,
        uid: it.__key || `cruce-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        source: "solped",
      };
    })
    .filter((it) => it.restante_cruce > 0);
});

const selectedCruceItems = computed(() => {
  const all = [...itemsCruceBase.value, ...manualCruceItems.value];
  return all.filter((x) => selectedCruceKeys.value.includes(x.uid));
});
const onEnterProveedor = async () => {
  await buscarProveedores();

  if (proveedoresResultados.value.length === 1) {
    seleccionarProveedor(proveedoresResultados.value[0]);
  }
};
const proveedoresReutilizables = computed(() => {
  const usados = new Map();

  for (const item of cruceManualItems.value || []) {
    for (const op of item.opciones || []) {
      const nombre = String(op.proveedor || "").replace(/\s+/g, " ").trim();
      if (!nombre) continue;
      const key = nombre.toLowerCase();
      if (!usados.has(key)) usados.set(key, nombre);
    }
  }

  return Array.from(usados.values());
});

const resumenCruce = computed(() => {
  let subtotal = 0;
  let itemsConsiderados = 0;

  for (const item of cruceManualItems.value || []) {
    const mejor = getMejorOpcionCruce(item);
    if (!mejor) continue;

    const total = Number(mejor.total || 0);
    if (total > 0) {
      subtotal += total;
      itemsConsiderados += 1;
    }
  }

  const iva = subtotal * 0.19;
  const totalConIVA = subtotal + iva;

  return {
    itemsConsiderados,
    subtotal: Math.round(subtotal),
    iva: Math.round(iva),
    totalConIVA: Math.round(totalConIVA),
  };
});

const totalPagesEquipos = computed(() => Math.max(1, Math.ceil(resultadosEquipos.value.length / 5)));

const visiblePageButtonsEquipos = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPageEquipos.value - Math.floor(maxButtons / 2));
  let end = Math.min(totalPagesEquipos.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const pagedEquipos = computed(() => {
  const start = (currentPageEquipos.value - 1) * 5;
  return resultadosEquipos.value.slice(start, start + 5);
});

const normalizeTextEquipos = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const compactEquipos = (s) => normalizeTextEquipos(s).replace(/[^a-z0-9]+/g, "");

const splitTokensEquipos = (q) => {
  const parts = normalizeTextEquipos(q).split(/[^a-z0-9]+/g).filter(Boolean);
  return parts.filter((t) => t.length >= 2);
};

const SEARCH_FIELDS_EQUIPOS = [
  "clasificacion1",
  "codigo",
  "equipo",
  "localizacion",
  "marca",
  "modelo",
  "numero_chasis",
  "tipo_equipo",
];

const haystackEquipo = (e) => {
  const s = SEARCH_FIELDS_EQUIPOS.map((k) => normalizeTextEquipos(e?.[k])).join(" ");
  return s.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
};

const buildEquipIndexRow = (e) => {
  const h = haystackEquipo(e);
  const tokenSet = new Set(h.split(" ").filter(Boolean));
  return {
    ...e,
    __hay: h,
    __codeCompact: compactEquipos(e?.codigo),
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
    const hv = normalizeTextEquipos(v).replace(/[^a-z0-9]+/g, " ").trim();
    if (hv && qRaw && hv.startsWith(normalizeTextEquipos(qRaw))) score += 700;
  }

  const h = e.__hay || "";
  const qFull = normalizeTextEquipos(qRaw).replace(/[^a-z0-9]+/g, " ").trim();
  if (qFull && h.includes(qFull)) score += 400;

  for (const t of qTokens) {
    if (e.__tokens?.has(t)) score += 220;
    else if (h.includes(t)) score += 80;
  }

  return score;
};

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
    addToast("danger", "No se pudieron cargar los equipos.");
  } finally {
    equiposLoadingAll.value = false;
  }
}

const aplicarFiltrosEquiposDebounced = () => {
  if (debounceTimerEquipos) clearTimeout(debounceTimerEquipos);
  debounceTimerEquipos = setTimeout(() => {
    const q = (busquedaEquipo.value || "").trim();
    if (q.length >= 2) buscarEquipos(q);
    else {
      resultadosEquipos.value = [];
      currentPageEquipos.value = 1;
    }
  }, 300);
};

const buscarEquipos = async (q) => {
  const qTrim = (q || "").trim();
  const qNorm = normalizeTextEquipos(qTrim);
  currentPageEquipos.value = 1;

  if (qNorm.length < 2) {
    resultadosEquipos.value = [];
    return;
  }

  if (!equiposLoaded.value) await ensureEquiposLoaded();
  if (!equiposLoaded.value) {
    resultadosEquipos.value = [];
    return;
  }

  if (cacheResultadosEquipos.has(qNorm)) {
    resultadosEquipos.value = cacheResultadosEquipos.get(qNorm);
    return;
  }

  const token = ++lastSearchTokenEquipos;
  cargandoEquipos.value = true;

  try {
    const qTokens = splitTokensEquipos(qNorm);
    const qComp = compactEquipos(qTrim);

    let arr = equiposIndex.value;

    if (qTokens.length >= 1) {
      arr = arr.filter((e) => qTokens.every((t) => (e.__hay || "").includes(t)));
    } else {
      const qFull = qNorm.replace(/[^a-z0-9]+/g, " ");
      arr = arr.filter((e) => (e.__hay || "").includes(qFull));
    }

    if (token !== lastSearchTokenEquipos) return;

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
    cacheResultadosEquipos.set(qNorm, ranked);
  } catch (e) {
    console.error("[equipos] buscarEquipos error:", e);
    addToast("danger", "Error al buscar equipos.");
    resultadosEquipos.value = [];
  } finally {
    if (token === lastSearchTokenEquipos) cargandoEquipos.value = false;
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
    addToast("warning", "No se pudo copiar. Hazlo manualmente.");
  }
};

const computeIsDesktop = () => {
  isDesktop.value = window.innerWidth >= 992;
};

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

const onResizeEquipos = () => {
  const wasOpen = showEquiposMobile.value;
  computeIsDesktop();
  if (isDesktop.value && wasOpen) cerrarEquiposMobile();
};

const goToPageEquipos = (n) => {
  if (n < 1 || n > totalPagesEquipos.value) return;
  currentPageEquipos.value = n;
};

const buildProveedorUid = () =>
  `prov-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const crearOpcionProveedor = (nombre = "") => ({
  uid: buildProveedorUid(),
  proveedor: nombre,
  precioUnitario: 0,
  total: 0,
  observacion: "",
  esMejor: false,
});

const getCantidadItemCruce = (item) => {
  const total = Math.max(0, Number(item?.cantidad ?? 0));
  const cotizadoAntes = Math.max(0, Number(item?.cantidad_cotizada ?? 0));
  const disponible = Math.max(0, total - cotizadoAntes);

  if (disponible <= 0) return 0;

  const manual = Number(item?.cantidad_para_cotizar ?? 0);
  if (Number.isFinite(manual) && manual > 0) return Math.min(manual, disponible);

  return disponible;
};

const crearCruceManualDesdeItem = (item) => {
  const cantidadTotal = parseCantidad2D(item?.cantidad ?? 1);
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
    unidad: normalizeUnidadPlantas(item?.unidad),
    cantidadTotal,
    cantidadTotalDisplay: formatCantidad2D(item?.cantidad ?? 1),
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

const getOpcionesValidasCruce = (item) => {
  return (item?.opciones || []).filter((op) => {
    const proveedor = String(op?.proveedor || "").trim();
    const pu = Number(op?.precioUnitario || 0);
    return proveedor && pu > 0;
  });
};

const recalcularMejorOpcion = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const validas = getOpcionesValidasCruce(item);
  if (!validas.length) {
    item.opciones.forEach((op) => { op.esMejor = false; });
    return;
  }

  const tieneMarcada = validas.some((op) => op.esMejor);
  if (tieneMarcada) return;

  let masBarata = validas[0];
  for (const op of validas) {
    if (Number(op.total || 0) < Number(masBarata.total || 0)) masBarata = op;
  }

  item.opciones.forEach((op) => {
    op.esMejor = op.uid === masBarata.uid;
  });
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

const getMejorOpcionCruce = (item) => {
  const validas = getOpcionesValidasCruce(item);
  if (!validas.length) return null;

  const marcada = validas.find((op) => op.esMejor);
  if (marcada) return marcada;

  return [...validas].sort((a, b) => Number(a.total || 0) - Number(b.total || 0))[0] || null;
};

const syncCantidadCruceToSolpedItem = (cruceItem) => {
  if (!cruceItem) return;
  if (!itemsSolped.value?.length) return;

  const idx = itemsSolped.value.findIndex((it) => it.__key === cruceItem.uid);
  if (idx < 0) return;

  const target = itemsSolped.value[idx];
  const cantidadCruce = Math.max(0, Number(cruceItem.cantidad || 0));

  target.cantidad_para_cotizar = Math.min(cantidadCruce, Number(target.__max || 0));
  clampCantidadParaCotizar(target);
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

const abrirCrucePrecios = async () => {
  modalCrucePrecios.value = true;

  if (itemsCruceBase.value.length && !selectedCruceKeys.value.length) {
    selectedCruceKeys.value = itemsCruceBase.value.map((x) => x.uid);
  }
};

const cerrarCrucePrecios = () => {
  modalCrucePrecios.value = false;
  cruceManualIndex.value = 0;
};

const agregarItemManualCruce = () => {
  const uid = `cruce-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  manualCruceItems.value.push({
    uid,
    source: "manual",
    item: manualCruceItems.value.length + 1,
    descripcion: "",
    codigo_referencial: "",
    cantidad: "01",
    unidad: "UNIDAD",
    estado: "pendiente",
  });
};

const eliminarItemManualCruce = (uid) => {
  manualCruceItems.value = manualCruceItems.value.filter((x) => x.uid !== uid);
  selectedCruceKeys.value = selectedCruceKeys.value.filter((x) => x !== uid);
};

const limpiarCruceManual = () => {
  cruceManualItems.value = [];
  manualCruceItems.value = [];
  selectedCruceKeys.value = [];
};

const goCrucePrev = () => {
  if (cruceManualIndex.value > 0) cruceManualIndex.value -= 1;
};

const goCruceNext = () => {
  if (cruceManualIndex.value < cruceManualItems.value.length - 1) cruceManualIndex.value += 1;
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

const agregarProveedorACruce = (itemUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;
  item.opciones.push(crearOpcionProveedor(""));
};

const marcarProveedorMejor = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  item.opciones.forEach((op) => {
    op.esMejor = op.uid === opcionUid;
  });

  recalcularTotalesItemCruce(itemUid);
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

const reutilizarNombreProveedor = (itemUid, opcionUid, nombre) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = String(nombre || "").replace(/\s+/g, " ").trim();
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

  op.proveedor = String(op.proveedor || "").replace(/\s{2,}/g, " ");
};

const onProveedorBlur = (itemUid, opcionUid) => {
  const item = cruceManualItems.value.find((x) => x.uid === itemUid);
  if (!item) return;

  const op = item.opciones.find((x) => x.uid === opcionUid);
  if (!op) return;

  op.proveedor = String(op.proveedor || "").replace(/\s+/g, " ").trim();
};

const proveedoresReutilizablesFiltrados = (actual = "") => {
  const actualNorm = String(actual || "").replace(/\s+/g, " ").trim().toLowerCase();
  return proveedoresReutilizables.value.filter((nombre) => nombre.toLowerCase() !== actualNorm);
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

const aplicarCruceAPrecioYItems = ({ showToast = true, closeModal = false } = {}) => {
  if (itemsSolped.value?.length) {
    for (const item of cruceManualItems.value || []) {
      syncCantidadCruceToSolpedItem(item);
    }
  }

  const totalCruce = Number(resumenCruce.value.totalConIVA || 0);

  if (totalCruce > 0) formatearPrecConValor(totalCruce);

  if (showToast) {
    if (totalCruce > 0) {
      addToast("success", "Cruce aplicado: cantidades copiadas y total actualizado.");
    } else {
      addToast("warning", "Se copiaron cantidades, pero no había proveedores válidos para calcular total.");
    }
  }

  if (closeModal) cerrarCrucePrecios();
};

async function generarPdfCruceManual() {
  if (!validarCruceManual()) return;

  aplicarCruceAPrecioYItems({ showToast: true, closeModal: false });

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const body = cruceManualItems.value.map((item) => {
    const mejor = getMejorOpcionCruce(item);
    return [
      item.descripcion || "Sin descripción",
      String(item.cantidad || 0),
      mejor?.proveedor || "—",
      formatMoneySmart(mejor?.total || 0, monedaSeleccionada.value || "CLP"),
    ];
  });

  pdf.setFontSize(14);
  pdf.text("Cruce de precios", 40, 40);

  autoTable(pdf, {
    startY: 60,
    head: [["Ítem", "Cantidad", "Proveedor recomendado", "Total"]],
    body,
    styles: { fontSize: 8, cellPadding: 4 },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

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

  addToast("success", "PDF del cruce agregado a archivos.");
  cerrarCrucePrecios();
}

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const volver = () => router.back();

const SOLPED_COLLECTION = "solpeds_plantas";
const COT_COLLECTION = "cotizaciones_plantas"; // si quieres otra colección, cambia esto

const APROBADOR_FIJO = "Alejandro Candia";
const ESTATUS_COTIZACION_INICIAL = "Pendiente de Aprobación";

const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");

const toasts = ref([]);
const addToast = (type, text, timeout = 3000) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

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

const cargandoNuevoId = ref(false);
const nuevoIdVisual = ref(null);
const enviando = ref(false);

const solpedDisponibles = ref([]);
const solpedSeleccionadaId = ref("");
const solpedSeleccionada = ref(null);
const itemsSolped = ref([]);
const autorizacionesSolped = ref([]);
const autorizacionSeleccionadaIndex = ref(0);

const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");
const comentario = ref("");

const archivos = ref([]);
const dragOverArchivos = ref(false);
let dragCounterArchivos = 0;

const invalidField = ref("");
const solpedSelectRef = ref(null);
const monedaRef = ref(null);
const precioTotalRef = ref(null);
const archivosDropzoneRef = ref(null);
const itemCantidadRefs = ref({});

const mostrarMisCotizaciones = ref(false);
const cargandoMisCotizaciones = ref(false);
const misCotizaciones = ref([]);
let _unsubMisCotizaciones = null;

const misCotizacionesPage = ref(1);
const misCotizacionesPageSize = 4;

const misCotizacionesTotalPages = computed(() =>
  Math.max(1, Math.ceil(misCotizaciones.value.length / misCotizacionesPageSize))
);

const misCotizacionesVisiblePages = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, misCotizacionesPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(misCotizacionesTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const misCotizacionesPaginadas = computed(() => {
  const start = (misCotizacionesPage.value - 1) * misCotizacionesPageSize;
  return misCotizaciones.value.slice(start, start + misCotizacionesPageSize);
});

const goMisCotizacionesPage = (n) => {
  if (n < 1 || n > misCotizacionesTotalPages.value) return;
  misCotizacionesPage.value = n;
};

const nombreCentroCosto = computed(() => {
  return solpedSeleccionada.value?.nombre_centro_costo || "";
});

const normalizePlain = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

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

const getColorByStatus = (estatus) => {
  const e = String(estatus || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  switch (e) {
    case "pendiente":
      return "#fd7e14";
    case "parcial":
    case "cotizado parcial":
      return "#0dcaf0";
    case "completado":
    case "cotizado completado":
      return "#20c997";
    case "rechazado":
      return "#dc3545";
    case "solped aprobada":
      return "#198754";
    default:
      return "#6c757d";
  }
};
const getBadgeColor = (estatus) => getColorByStatus(estatus);

const estadoBadgeClass = (estatus) => {
  const s = String(estatus || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("pendiente")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : new Date(f));
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const fmtMoney = (n, c = "CLP") => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("es-CL", {
      style: "currency",
      currency: c || "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${c || "CLP"} ${v.toLocaleString("es-CL")}`;
  }
};

const prettyBytes = (n) => {
  const x = Number(n || 0);
  if (!x) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(x) / Math.log(1024)));
  const v = x / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const prettyTipo = (t) => {
  const s = String(t || "").toLowerCase();
  if (!s) return "archivo";
  if (s.includes("pdf")) return "PDF";
  if (s.startsWith("image/")) return "Imagen";
  if (s.includes("sheet") || s.includes("excel") || s.includes("csv")) return "Excel";
  return s;
};

const setItemCantidadRef = (key, el) => {
  if (!key) return;
  if (el) itemCantidadRefs.value[key] = el;
  else delete itemCantidadRefs.value[key];
};

const waitNextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const scrollToAndFocus = async (el) => {
  if (!el) return;
  await waitNextFrame();
  try {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  } catch(e) {console.log(e)}
  setTimeout(() => {
    try {
      if (typeof el.focus === "function") el.focus({ preventScroll: true });
    } catch(e) {console.log(e)}
  }, 250);
};
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

const clearInvalidField = (name) => {
  if (invalidField.value === name) invalidField.value = "";
};

const limpiarProveedorSeleccionado = () => {
  proveedorSeleccionado.value = null;
  clearInvalidField("proveedor");
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
  clearInvalidField("proveedor");
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

    // búsqueda por nombre con prefijo
    try {
      const qNombre = query(
        collection(db, "proveedores"),
        orderBy("nombre"),
        startAt(raw),
        endAt(raw + "\uf8ff"),
        limit(600)
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
      console.warn("Error búsqueda por nombre:", e);
    }
    try {
      const qBase = query(
        collection(db, "proveedores"),
        orderBy("nombre"),
        limit(600)
      );

      const snapBase = await getDocs(qBase);

      snapBase.forEach((d) => {
        const data = d.data() || {};
        const nombre = String(data.nombre || "");
        const rut = String(data.rut || "");

        const nombreNorm = normalizarTextoBusqueda(nombre);
        const rutNorm = normalizarRut(rut);

        const coincideNombre = texto && nombreNorm.includes(texto);
        const coincideRut = rutPlano && rutNorm.includes(rutPlano);

        if (coincideNombre || coincideRut) {
          resultadosMap.set(d.id, {
            id: d.id,
            nombre,
            rut,
          });
        }
      });
    } catch (e) {
      console.warn("Error búsqueda base proveedor:", e);
    }

    proveedoresResultados.value = Array.from(resultadosMap.values()).sort((a, b) =>
      String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
    );
  } catch (error) {
    console.error("Error buscando proveedores:", error);
    proveedoresResultados.value = [];
    addToast("danger", "No se pudieron buscar los proveedores.");
  } finally {
    proveedoresBuscando.value = false;
  }
};
const triggerValidationError = async ({ key, message, el }) => {
  invalidField.value = key || "";
  addToast("warning", message || "Falta completar un campo.");
  await scrollToAndFocus(el);
};

const normalizarEstadoCantidades = ({ total, cotizada }) => {
  const t = Math.max(0, num(total, 0));
  const cRaw = Math.max(0, num(cotizada, 0));
  const c = t > 0 ? Math.min(cRaw, t) : cRaw;

  if (t <= 0) {
    return {
      finalCotizada: c,
      estado: c > 0 ? "completado" : "pendiente",
    };
  }

  if (c <= 0) {
    return {
      finalCotizada: 0,
      estado: "pendiente",
    };
  }

  if (c < t) {
    return {
      finalCotizada: c,
      estado: "parcial",
    };
  }

  return {
    finalCotizada: t,
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

const onInputCantidad = (it) => {
  clampCantidadParaCotizar(it);
};

const buildItemsSolpedForUI = (solpedItems = []) => {
  return (solpedItems || [])
    .map((it, idx) => {
      const total = Math.max(0, num(it?.cantidad, 0));
      const cotizadoAntesRaw = Math.max(0, num(it?.cantidad_cotizada, 0));
      const cotizadoAntes = Math.min(cotizadoAntesRaw, total);
      const disponible = Math.max(0, total - cotizadoAntes);

      const estadoNormalizado = normalizarEstadoCantidades({
        total,
        cotizada: cotizadoAntes,
      });

      const base = {
        ...it,
        item: num(it?.item, idx + 1),
        cantidad: total,
        cantidad_cotizada: cotizadoAntes,
        estado: estadoNormalizado.estado,
      };

      const baseKey = itemIdentityKey(base);

      return {
        ...base,
        cantidad_para_cotizar: 0,
        __sourceIndex: idx,
        __key: baseKey,
        __k: `${baseKey}|${idx}`,
        __max: disponible,
        __restante: 0,
        __invalid: false,
      };
    })
    .filter((it) => {
      const estado = String(it.estado || "").toLowerCase();
      return it.__max > 0 && (estado === "pendiente" || estado === "parcial" || !estado);
    });
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

const buildItemsCotizacionFromUI = (itemsUI = []) => {
  const out = [];

  for (const it of itemsUI || []) {
    clampCantidadParaCotizar(it);

    const nueva = num(it.cantidad_para_cotizar, 0);
    if (nueva <= 0) continue;

    const total = parseCantidad2D(it.cantidad ?? 1);
    const antes = num(it.cantidad_cotizada, 0);
    const st = computeEstadoItem({ total, antes, nueva });

    out.push({
      item: num(it.item, 0),
      descripcion: String(it.descripcion || ""),
      cantidad: formatCantidad2D(it.cantidad ?? 1),
      cantidad_cotizada_antes: antes,
      cantidad_para_cotizar: nueva,
      cantidad_cotizada: st.finalCotizada,
      codigo_referencial: it.codigo_referencial || "SIN CÓDIGO",
      unidad: normalizeUnidadPlantas(it.unidad || "UNIDAD"),
      imagen_url: it.imagen_url ?? null,
      stock: num(it.stock, 0),
      estado_resultante: st.estado,
      prioridad: it.prioridad || "MEDIA",
    });
  }

  return out;
};

const validarFormularioAntesDeEnviar = async () => {
  invalidField.value = "";

  if (!solpedSeleccionadaId.value) {
    await triggerValidationError({
      key: "solped",
      message: "Falta seleccionar una SOLPED aprobada.",
      el: solpedSelectRef.value,
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

  const itemsValidos = (itemsSolped.value || []).filter((it) => num(it.cantidad_para_cotizar, 0) > 0);
  if (!itemsValidos.length) {
    const primerItem = itemsSolped.value?.[0];
    const itemKey = primerItem?.__k ? `item-${primerItem.__k}` : "solped";

    await triggerValidationError({
      key: itemKey,
      message: "Debes ingresar al menos una cantidad a cotizar.",
      el: primerItem?.__k ? itemCantidadRefs.value[primerItem.__k] : solpedSelectRef.value,
    });
    return false;
  }

  if (!archivos.value.length) {
    await triggerValidationError({
      key: "archivos",
      message: "Debes adjuntar al menos un archivo.",
      el: archivosDropzoneRef.value,
    });
    return false;
  }

  invalidField.value = "";
  return true;
};

async function obtenerNombreUsuario() {
  try {
    const uid = myUid.value;
    if (!uid) return;

    const dref = doc(db, "Usuarios", uid);
    const snap = await getDoc(dref);

    if (snap.exists()) {
      const data = snap.data() || {};
      usuarioActual.value = data.fullName || auth?.user?.displayName || auth?.user?.email || "";
    } else {
      usuarioActual.value = auth?.user?.displayName || auth?.user?.email || "";
    }
  } catch (e) {
    console.error(e);
    usuarioActual.value = auth?.user?.displayName || auth?.user?.email || "";
  }
}

async function cargarSiguienteNumero() {
  if (cargandoNuevoId.value) return;
  cargandoNuevoId.value = true;

  try {
    const qy = query(collection(db, COT_COLLECTION), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const last = snap.docs[0]?.data()?.id || 0;
    nuevoIdVisual.value = Number(last) + 1;
  } catch (e) {
    console.error("cargarSiguienteNumero error:", e);
    nuevoIdVisual.value = 1;
  } finally {
    cargandoNuevoId.value = false;
  }
}

const estatusPermitidosSolped = new Set(["pendiente", "cotizado parcial"]);

async function cargarSolpedsPlantasCotizables() {
  try {
    const qy = query(
      collection(db, SOLPED_COLLECTION),
      where("estadoAprobacionSolped", "==", "Solped Aprobada")
    );

    const snap = await getDocs(qy);

    const arr = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => {
        const estatus = String(s.estatus || "").trim().toLowerCase();
        if (!estatusPermitidosSolped.has(estatus)) return false;

        const items = Array.isArray(s.items) ? s.items : [];
        return items.some((it) => {
          const total = Math.max(0, num(it?.cantidad, 0));
          const cotizado = Math.max(0, num(it?.cantidad_cotizada, 0));
          return total - cotizado > 0;
        });
      })
      .sort((a, b) => Number(a.numero_solpe || 0) - Number(b.numero_solpe || 0));

    solpedDisponibles.value = arr;
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudieron cargar las SOLPED de plantas.");
  }
}

async function onChangeSolped() {
  if (!solpedSeleccionadaId.value) {
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    autorizacionesSolped.value = [];
    autorizacionSeleccionadaIndex.value = 0;
    archivos.value = archivos.value.filter((a) => !a?.fromSolped);
    return;
  }

  try {
    const dref = doc(db, SOLPED_COLLECTION, solpedSeleccionadaId.value);
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
    itemsSolped.value = buildItemsSolpedForUI(Array.isArray(data.items) ? data.items : []);

    for (const it of itemsSolped.value) clampCantidadParaCotizar(it);

    archivos.value = archivos.value.filter((a) => !a?.fromSolped);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo cargar la SOLPED seleccionada.");
  }
}

const onCambioMoneda = () => {
  formatearPrecConValor(precioTotalConIVA.value);
};

const formatearPrecio = (ev) => {
  const input = (ev?.target?.value ?? "").toString();
  const soloNumeros = input.replace(/\D/g, "");
  const valor = soloNumeros ? parseInt(soloNumeros, 10) : 0;
  formatearPrecConValor(valor);
};

const formatearPrecConValor = (valor) => {
  precioTotalConIVA.value = Number(valor || 0);
  const m = monedaSeleccionada.value || "CLP";
  try {
    precioFormateado.value = Number(valor || 0).toLocaleString("es-CL", {
      style: "currency",
      currency: m,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    precioFormateado.value = `${m} ${Number(valor || 0).toLocaleString("es-CL")}`;
  }
};

const rangeUltimosDosMeses = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const inicio = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const fin = new Date(y, m + 1, 1, 0, 0, 0, 0);
  return { from: Timestamp.fromDate(inicio), to: Timestamp.fromDate(fin) };
};

function suscribirMisCotizaciones() {
  if (_unsubMisCotizaciones) {
    _unsubMisCotizaciones();
    _unsubMisCotizaciones = null;
  }

  const nombre = usuarioActual.value;
  if (!nombre) return;

  cargandoMisCotizaciones.value = true;

  try {
    const { from, to } = rangeUltimosDosMeses();
    const qy = query(
      collection(db, COT_COLLECTION),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc")
    );

    _unsubMisCotizaciones = onSnapshot(
      qy,
      (snap) => {
        const arr = [];
        snap.forEach((docu) => arr.push({ __docId: docu.id, ...docu.data() }));
        arr.sort((a, b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0));
        misCotizaciones.value = arr;
        misCotizacionesPage.value = 1;
        cargandoMisCotizaciones.value = false;
      },
      (err) => {
        console.error(err);
        cargandoMisCotizaciones.value = false;
      }
    );
  } catch (e) {
    console.error(e);
    cargandoMisCotizaciones.value = false;
  }
}

function desuscribirMisCotizaciones() {
  if (_unsubMisCotizaciones) {
    _unsubMisCotizaciones();
    _unsubMisCotizaciones = null;
  }
  misCotizaciones.value = [];
  misCotizacionesPage.value = 1;
  cargandoMisCotizaciones.value = false;
}

const toggleMisCotizaciones = () => {
  mostrarMisCotizaciones.value = !mostrarMisCotizaciones.value;
  if (mostrarMisCotizaciones.value) suscribirMisCotizaciones();
  else desuscribirMisCotizaciones();
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

  addToast("success", "Adjunto SOLPED agregado.");
};

const quitarAdjuntoSolped = (adj) => {
  if (!adj?.url) return;
  const k = keyFromUrl(adj.url);
  archivos.value = archivos.value.filter((a) => !(a?.fromSolped && keyFromUrl(a.url) === k));
  addToast("success", "Adjunto SOLPED removido.");
};

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

const toSafePdfName = (originalName) => {
  const base = String(originalName || "cotizacion")
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 90);
  return `${base}.pdf`;
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
  docPdf.text("Cotización (convertido desde Excel)", 40, 40);
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
  const input = document.getElementById("inputArchivoPlantas");
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
          console.error(err);
          addToast("danger", `No se pudo convertir "${file.name}".`);
        }
        continue;
      }

      const t = String(file.type || "").toLowerCase();
      const esPDF = t.includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf");
      const esIMG = t.startsWith("image/");

      if (!esPDF && !esIMG) {
        addToast("warning", `Formato no soportado: "${file.name}".`);
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
    } catch(e) {console.log(e)}
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
  if (dragCounterArchivos === 0) dragOverArchivos.value = false;
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

const eliminarArchivo = (idx) => {
  try {
    const a = archivos.value[idx];
    if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
  } catch(e) {console.log(e)}
  archivos.value.splice(idx, 1);
  addToast("success", "Archivo eliminado.");
};
const modalProveedorAbierto = ref(false);
const proveedorBusqueda = ref("");
const proveedoresResultados = ref([]);
const proveedoresBuscando = ref(false);
const proveedorSeleccionado = ref(null);

const proveedorNombre = computed(() => proveedorSeleccionado.value?.nombre || "");
const proveedorRut = computed(() => proveedorSeleccionado.value?.rut || "");
async function actualizarSolpedPlantaAsociada(solpedId, selections, nombreUsuario, estatusInicial, numeroCotizacion) {
  if (!solpedId) return;
  if (!Array.isArray(selections) || selections.length === 0) return;

  const srefDoc = doc(db, SOLPED_COLLECTION, solpedId);

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

  await addDoc(collection(db, SOLPED_COLLECTION, solpedId, "historialEstados"), {
    usuario: nombreUsuario || "Sistema",
    fecha: serverTimestamp(),
    estatus: estatusInicial || "Pendiente de Aprobación",
    comentario: `Cotización enviada N° ${numeroCotizacion || "—"} desde plantas`,
  });
}
async function enviarCotizacion() {
  if (enviando.value) return;

  const formOk = await validarFormularioAntesDeEnviar();
  if (!formOk) return;

  const selections = buildSelections(itemsSolped.value);
  const itemsCotizacion = buildItemsCotizacionFromUI(itemsSolped.value);

  if (!itemsCotizacion.length) {
    addToast("warning", "No hay ítems válidos para cotizar.");
    return;
  }

  enviando.value = true;
  setBusy(true, "Enviando cotización…", "Preparando datos", 5);

  try {
    let nombreUsuario = auth?.user?.displayName || auth?.user?.email || "Desconocido";
    const uid = auth?.user?.uid || "";

    if (uid) {
      const usnap = await getDoc(doc(db, "Usuarios", uid));
      if (usnap.exists()) {
        const u = usnap.data() || {};
        nombreUsuario = u.fullName || nombreUsuario;
      }
    }

    setBusy(true, "Enviando cotización…", "Calculando número…", 10);

    const qy = query(
      collection(db, COT_COLLECTION),
      orderBy("id", "desc"),
      limit(1)
    );
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId = Number(lastId) + 1;

    const comentarioFinal = (comentario.value || "").trim();

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

      const path = `${COT_COLLECTION}/${newId}/${safeName}`;
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
      estatus: ESTATUS_COTIZACION_INICIAL,
      fechaSubida: serverTimestamp(),
      historial: [
        {
          usuario: nombreUsuario,
          estatus: ESTATUS_COTIZACION_INICIAL,
          fecha: new Date().toISOString(),
          comentario: comentarioFinal,
        },
      ],
      responsable: nombreUsuario,
      comentario: comentarioFinal,
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,

      proveedor: proveedorSeleccionado.value?.nombre || "",
      rutProveedor: proveedorSeleccionado.value?.rut || "",

      aprobadorSugerido: APROBADOR_FIJO,
      empresa: solpedSeleccionada.value?.empresa || "",
      solpedId: solpedSeleccionadaId.value,
      numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
      tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
      numero_contrato: solpedSeleccionada.value?.numero_contrato || "",
      nombre_centro_costo: solpedSeleccionada.value?.nombre_centro_costo || "",
      nombre_solped: solpedSeleccionada.value?.nombre_solped || "",
      usuario_solped: solpedSeleccionada.value?.usuario || "",
      archivosStorage: subidos,
      items: itemsCotizacion,
    };

    const newDocRef = await addDoc(collection(db, COT_COLLECTION), dataToSave);
    const newDocId = newDocRef.id;
    await updateDoc(newDocRef, { __docId: newDocId });

    await actualizarSolpedPlantaAsociada(
      solpedSeleccionadaId.value,
      selections,
      nombreUsuario,
      ESTATUS_COTIZACION_INICIAL,
      newId
    );

    setBusy(true, "Listo ✅", "Cotización enviada correctamente", 100);
    addToast("success", "Cotización de plantas enviada exitosamente.");

    for (const a of archivos.value) {
      try {
        if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
      } catch (e) {
        console.log(e);
      }
    }

    archivos.value = [];
    comentario.value = "";
    solpedSeleccionadaId.value = "";
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    autorizacionesSolped.value = [];
    autorizacionSeleccionadaIndex.value = 0;
    precioTotalConIVA.value = 0;
    precioFormateado.value = "";
    monedaSeleccionada.value = "CLP";
    proveedorSeleccionado.value = null;
    proveedorBusqueda.value = "";
    proveedoresResultados.value = [];
    invalidField.value = "";

    await cargarSiguienteNumero();
    await cargarSolpedsPlantasCotizables();

    if (mostrarMisCotizaciones.value) {
      desuscribirMisCotizaciones();
      suscribirMisCotizaciones();
    }

    const inputEl = document.getElementById("inputArchivoPlantas");
    if (inputEl) inputEl.value = "";
  } catch (e) {
    console.error(e);
    addToast("danger", "Error al enviar la cotización.");
  } finally {
    enviando.value = false;
    setTimeout(() => setBusy(false), 450);
  }
}
const parseCantidad2D = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return 1;

  const n = Number(raw.replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 1) return 1;

  return Math.floor(n);
};

const formatCantidad2D = (value) => {
  const num = parseCantidad2D(value);
  return String(num).padStart(2, "0");
};

const unidadesValidasPlantas = ["KG", "LITROS", "CM", "MM", "METROS", "UNIDAD"];

const normalizeUnidadPlantas = (value) => {
  const u = String(value || "").trim().toUpperCase();
  return unidadesValidasPlantas.includes(u) ? u : "UNIDAD";
};
watch(
  () => selectedCruceItems.value.map((x) => x.uid).join("|"),
  () => {
    if (modalCrucePrecios.value) {
      syncCruceManualItems();
    }
  }
);
onMounted(async () => {
  await obtenerNombreUsuario();
  await cargarSiguienteNumero();
  await cargarSolpedsPlantasCotizables();
  computeIsDesktop();
  window.addEventListener("resize", onResizeEquipos);
  const pre = route?.query?.fromSolpedId ? String(route.query.fromSolpedId) : "";
  if (pre) {
    const yaEsta = solpedDisponibles.value.some((s) => s.id === pre);
    if (!yaEsta) {
      try {
        const ds = await getDoc(doc(db, SOLPED_COLLECTION, pre));
        if (ds.exists()) {
          const data = ds.data() || {};
          solpedDisponibles.value = [{ id: pre, ...data }, ...solpedDisponibles.value];
        }
      } catch (e) {
        console.error(e);
      }
    }
    solpedSeleccionadaId.value = pre;
    await onChangeSolped();
    addToast("success", "SOLPED de planta preseleccionada desde el historial.");
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResizeEquipos);
  document.documentElement.style.overflow = "";
  if (debounceTimerEquipos) clearTimeout(debounceTimerEquipos);
  if (_unsubMisCotizaciones) _unsubMisCotizaciones();

  for (const a of archivos.value) {
    try {
      if (a?.previewUrl && !a?.fromSolped) URL.revokeObjectURL(a.previewUrl);
    } catch(e) {console.log(e)}
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

.toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
.sticky-panel {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 24px);
  overflow: hidden;
}

.sticky-panel .card-body {
  overflow: auto;
}

.equipos-list {
  max-height: 100vh;
  overflow: auto;
}

.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }

.oc-wrap {
  position: fixed;
  inset: 0;
  z-index: 1080;
}

.oc-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(1px);
}

.oc-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
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

.oc-header {
  padding: .9rem .9rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.oc-body {
  padding: .9rem;
  overflow: auto;
}

.oc-footer {
  margin-top: auto;
  padding: .9rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: .5rem;
  justify-content: flex-end;
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

.vmodal-footer {
  border-top: 1px solid #eee;
  border-bottom: 0;
}

.vmodal-body {
  padding: 1rem;
  max-height: 65vh;
  overflow: auto;
}

.vmodal-xxl {
  max-width: min(1700px, 96vw);
}

.cruce-body-scroll {
  max-height: 72vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.cruce-table-scroll {
  max-height: 48vh;
  overflow: auto;
}

.cruce-table-scroll table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8f9fa !important;
}

.cruce-items-list-scroll {
  max-height: 48vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.cruce-items-list-scroll::-webkit-scrollbar {
  width: 8px;
}

.cruce-items-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7);
  border-radius: 999px;
}

.cruce-items-list-scroll::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.5);
  border-radius: 999px;
}

.btn-star-choice {
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  line-height: 1;
  color: #94a3b8;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  transition: all .18s ease;
}

.btn-star-choice:hover {
  transform: scale(1.08);
  background: rgba(245, 158, 11, 0.08);
  color: #f59e0b;
}

.btn-star-choice.active {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.22);
}

.table-warning td {
  background: rgba(245, 158, 11, 0.08) !important;
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

@media (max-width: 420px) {
  .card-header .small { font-size: .8rem; }
}
</style>
