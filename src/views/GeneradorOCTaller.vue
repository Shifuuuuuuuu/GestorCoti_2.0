<!-- src/views/GeneradorOCTaller.vue -->
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
          Generador Cotización (Taller)
        </h1>

        <button class="btn btn-secondary btn-sm" @click="toggleEquiposPanel" :aria-pressed="mostrarEquipos.toString()">
          <i class="bi bi-search me-1"></i>
          {{ mostrarEquipos ? "Ocultar" : "Buscar" }} equipos
        </button>
      </div>

      <div
        v-if="!isAuthReady || !usuarioActual"
        class="alert alert-warning d-flex align-items-start gap-2 mb-3"
        role="alert"
      >
        <i class="bi bi-info-circle fs-5"></i>
        <div>
          <div class="fw-semibold">Debes iniciar sesión para ver tu información.</div>
          <div class="small">Esta vista muestra únicamente tus cotizaciones y tu resumen del mes.</div>
        </div>
      </div>

      <div class="d-flex justify-content-end flex-wrap gap-2 mb-2">
        <button
          class="btn btn-outline-dark btn-sm"
          @click="toggleOCTallerMes"
          :disabled="!usuarioActual"
          :aria-pressed="mostrarOCTallerMes.toString()"
        >
          <i class="bi bi-receipt-cutoff me-1"></i>
          {{ mostrarOCTallerMes ? "Ocultar mis cotizaciones" : "Mis Cotizaciones" }}
        </button>

        <button
          class="btn btn-outline-primary btn-sm"
          @click="toggleResumenUsuarios"
          :disabled="!usuarioActual"
          :aria-pressed="mostrarResumenUsuarios.toString()"
        >
          <i class="bi bi-person-lines-fill me-1"></i>
          {{ mostrarResumenUsuarios ? "Ocultar mi resumen" : "Mi resumen (mes actual)" }}
        </button>
      </div>

      <div
        v-if="bloqueoPorAprobadasTaller"
        class="alert alert-danger d-flex align-items-start gap-2 mb-3"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill fs-5"></i>
        <div>
          <div class="fw-semibold">
            Límite alcanzado: tienes {{ totalAprobadasDelUsuarioTaller }} cotizaciones del Taller en estado
            <u>Aprobado</u> (últimos 2 meses).
          </div>
          <div class="small">
            Para continuar generando nuevas cotizaciones, primero debes <strong>subir</strong> o gestionar las aprobadas.
            Ve al detalle de tus cotizaciones y completa el proceso.
          </div>
        </div>
      </div>

      <div v-if="mostrarOCTallerMes" class="card mb-3 card-elevated">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">🧾 Mis cotizaciones</div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ ocTallerMes.length }} en total</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargandoOCTallerMes" class="p-3 text-center">
            <div class="spinner-border" role="status" aria-hidden="true"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="ocTallerMes.length === 0" class="p-3 text-secondary text-center">
            No tienes órdenes enviadas este mes.
          </div>

          <div v-else class="list-group list-group-flush">
            <div
              class="list-group-item d-flex align-items-start flex-wrap gap-2"
              v-for="oc in ocTallerMesPaged"
              :key="oc.__docId"
            >
              <div class="me-auto">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="fw-semibold">N° {{ oc.id ?? "—" }}</span>
                  <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || "—" }}</span>
                </div>

                <div class="small text-secondary mt-1">
                  <strong>Centro:</strong> {{ oc.centroCostoTexto || "—" }} ·
                  <strong>Moneda:</strong> {{ oc.moneda || "—" }} ·
                  <strong>Total:</strong> {{ (oc.precioTotalConIVA ?? 0).toLocaleString("es-CL") }}
                </div>
                <div class="small text-secondary">
                  <strong>Fecha:</strong> {{ fmtFecha(oc.fechaSubida) }}
                </div>

                <div v-if="oc.comentario" class="small mt-1">
                  <em>“{{ oc.comentario }}”</em>
                </div>
              </div>

              <div class="ms-auto">
                <button class="btn btn-sm btn-outline-primary" @click="irADetalleOCTaller(oc)">
                  Ver detalle
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!cargandoOCTallerMes && ocTallerMesTotalPages > 1" class="card-footer bg-white">
          <nav aria-label="Paginación OC Taller">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: ocTallerMesCurrentPage === 1 }">
                <button class="page-link" @click="ocTallerMesGoTo(ocTallerMesCurrentPage - 1)" :disabled="ocTallerMesCurrentPage === 1">
                  «
                </button>
              </li>
              <li
                class="page-item"
                v-for="n in ocTallerMesVisiblePages"
                :key="'pg-ocmes-' + n"
                :class="{ active: ocTallerMesCurrentPage === n }"
              >
                <button class="page-link" @click="ocTallerMesGoTo(n)">{{ n }}</button>
              </li>
              <li class="page-item" :class="{ disabled: ocTallerMesCurrentPage === ocTallerMesTotalPages }">
                <button class="page-link" @click="ocTallerMesGoTo(ocTallerMesCurrentPage + 1)" :disabled="ocTallerMesCurrentPage === ocTallerMesTotalPages">
                  »
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div v-if="mostrarResumenUsuarios" class="card mb-3 card-elevated">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">📊 Resumen de mis Cotizaciones</div>
        </div>

        <div class="card-body p-0">
          <div v-if="cargandoResumenUsuarios" class="p-3 text-center">
            <div class="spinner-border" role="status" aria-hidden="true"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="!resumenUsuarios.length" class="p-3 text-secondary text-center">
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
                <tr v-for="row in resumenUsuariosPaged" :key="row.responsable">
                  <td class="fw-semibold">{{ row.responsable }}</td>
                  <td class="text-center"><span class="badge bg-success-subtle text-success-emphasis">{{ row.aprobado }}</span></td>
                  <td class="text-center"><span class="badge bg-danger-subtle text-danger-emphasis">{{ row.rechazado }}</span></td>
                  <td class="text-center"><span class="badge bg-info-subtle text-info-emphasis">{{ row.preaprobado }}</span></td>
                  <td class="text-center"><span class="badge bg-warning-subtle text-warning-emphasis">{{ row.pendiente }}</span></td>
                  <td class="text-center"><span class="badge bg-primary-subtle text-primary-emphasis">{{ row.revision }}</span></td>
                  <td class="text-center"><span class="badge bg-info-subtle text-info-emphasis">{{ row.proveedor }}</span></td>
                  <td class="text-center fw-semibold">{{ row.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="!cargandoResumenUsuarios && resumenTotalPages > 1" class="card-footer bg-white">
          <nav aria-label="Paginación resumen usuarios">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: resumenCurrentPage === 1 }">
                <button class="page-link" @click="resumenGoTo(resumenCurrentPage - 1)" :disabled="resumenCurrentPage === 1">«</button>
              </li>
              <li class="page-item" v-for="n in resumenVisiblePages" :key="'pg-resumen-' + n" :class="{ active: resumenCurrentPage === n }">
                <button class="page-link" @click="resumenGoTo(n)">{{ n }}</button>
              </li>
              <li class="page-item" :class="{ disabled: resumenCurrentPage === resumenTotalPages }">
                <button class="page-link" @click="resumenGoTo(resumenCurrentPage + 1)" :disabled="resumenCurrentPage === resumenTotalPages">»</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12" :class="mostrarEquipos ? 'col-lg-8' : 'col-lg-12'">
          <div class="card card-elevated position-relative overflow-hidden">
            <div v-if="bloqueoPorAprobadasTaller" class="lock-overlay">
              <div class="lock-box text-center">
                <i class="bi bi-lock-fill display-6 d-block mb-2"></i>
                <div class="fw-semibold">Formulario bloqueado</div>
                <div class="small text-muted mt-1">
                  Debes gestionar tus cotizaciones <strong>Aprobadas</strong> y subir la orden de compra correspondiente antes de continuar con el proceso.
                </div>

                <div class="mt-3">
                  <button class="btn btn-dark btn-sm" @click="router.push({ name: 'HistorialOCTaller' })">
                    Ver mis cotizaciones (Taller)
                  </button>
                </div>
              </div>
            </div>

            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold d-flex align-items-center gap-2">
                <i v-if="bloqueoPorAprobadasTaller" class="bi bi-lock-fill text-danger"></i>
                <span>Subir Cotización (Taller)</span>
              </div>
            </div>

            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">N° de Cotización</label>

                <div class="input-group">
                  <span class="input-group-text">N°</span>

                  <input
                    class="form-control fw-semibold"
                    :class="{ 'border-primary': !!nuevoIdVisual }"
                    type="text"
                    :value="cargandoNumero ? 'Cargando…' : (nuevoIdVisual ?? '—').toString()"
                    readonly
                  />

                  <button class="btn btn-outline-secondary" type="button" @click="cargarSiguienteNumero" :disabled="cargandoNumero" title="Recargar número">
                    <span v-if="cargandoNumero" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <i v-else class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>

                <div v-if="errorNumero" class="form-text text-danger">{{ errorNumero }}</div>
              </div>

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
                      #{{ solpe.numero_solpe }} - {{ solpe.nombre_solped || solpe.tipo_solped }} ·
                      {{ solpe.nombre_centro_costo || solpe.centro_costo }} · {{ solpe.usuario || '—' }} · {{ solpe.empresa || '—' }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="usarSolped && solpedSeleccionada" class="row g-3 mt-1">
                <div class="col-12 col-md-4">
                  <div class="small text-secondary">N° SOLPED</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.numero_solpe }}</div>
                </div>
                <div class="col-12 col-md-8">
                  <div class="small text-secondary">Centro de Costo</div>
                  <div class="fw-semibold">
                    <template v-if="solpedSeleccionada.centro_costo && solpedSeleccionada.nombre_centro_costo">
                      {{ solpedSeleccionada.centro_costo }} — {{ solpedSeleccionada.nombre_centro_costo }}
                    </template>
                    <template v-else>
                      {{ solpedSeleccionada.nombre_centro_costo || solpedSeleccionada.centro_costo || "—" }}
                    </template>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Empresa</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.empresa }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Tipo / Nombre</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.tipo_solped }}</div>
                </div>
              </div>

              <div v-if="usarSolped && itemsSolped.length" class="card mt-3">
                <div class="card-header bg-white d-flex align-items-center justify-content-between">
                  <span class="fw-semibold">📦 Ítems de la SOLPED</span>
                  <small class="text-secondary d-none d-sm-inline">Desliza horizontalmente si es necesario</small>
                </div>

                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th style="width: 48px;">Ítem</th>
                          <th>Descripción</th>
                          <th class="text-center">Cant. total</th>
                          <th class="text-center">Cant. Pendiente</th>
                          <th style="width: 180px;">Cant. a cotizar</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in itemsSolped" :key="it.__k">
                          <td>{{ it.item }}</td>
                          <td class="w-50">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad }}</td>
                          <td class="text-center fw-semibold">{{ it.__restan }}</td>
                          <td>
                          <input
                            type="number"
                            class="form-control form-control-sm"
                            :class="{ 'is-invalid': it.__invalid }"
                            min="0"
                            :max="it.__restan"
                            v-model.number="it.cantidad_para_cotizar"
                            @input="clampCantidad(it)"
                            @blur="clampCantidad(it)"
                          />
                          <div class="form-text">
                            Disponible: {{ it.__restan }}
                          </div>
                          <div v-if="it.__invalid" class="invalid-feedback d-block">
                            Se ajustó al máximo permitido.
                          </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-if="autorizacionUrlRaw" class="alert alert-light d-flex align-items-center mt-3 flex-wrap gap-2">
                    <i class="bi bi-paperclip"></i>
                    <div class="me-auto ms-2">
                      <div class="fw-semibold mb-0">Autorización adjunta</div>
                      <div class="small">{{ autorizacionNombre || "Archivo" }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <a :href="autorizacionUrlRaw" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Ver</a>
                      <a :href="autorizacionUrlRaw" :download="autorizacionNombre || 'autorizacion'" class="btn btn-sm btn-outline-secondary">Descargar</a>
                    </div>
                  </div>

                  <div v-if="autorizacionEsPDF" class="ratio ratio-16x9 mt-2">
                    <iframe :src="autorizacionUrlRaw + '#toolbar=0'" style="border:none;"></iframe>
                  </div>
                  <div v-else-if="autorizacionEsImagen" class="text-center mt-2">
                    <img :src="autorizacionUrlRaw" alt="Autorización" class="img-fluid rounded shadow-sm" style="max-height:500px; object-fit:contain;">
                  </div>
                </div>
              </div>

              <hr class="my-4">

              <div class="mb-3">
                <label class="form-label">Centro de Costo</label>
                <input class="form-control" v-model="centroCostoTexto" placeholder="Ej: THPV-31" />
                <div class="form-text" v-if="centroCostoTextoAyuda">Sugerencia: {{ centroCostoTextoAyuda }}</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Empresa</label>
                <select class="form-select" v-model="empresaSeleccionada">
                  <option value="Xtreme Servicios">Xtreme Servicios</option>
                  <option value="Xtreme Servicio">Xtreme Servicio</option>
                </select>
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
                    aria-describedby="precioHelp"
                  >
                  <div id="precioHelp" class="form-text">Se formatea automáticamente según moneda seleccionada.</div>
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

              <div class="mb-3">
                <label class="form-label">Archivos PDF o Imagen (cotizaciones)</label>

                <input
                  id="inputArchivo"
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  class="d-none"
                  @change="onMultipleFilesSelected"
                >

                <div
                  class="dropzone-upload"
                  :class="{ 'is-dragging': dragOverArchivos }"
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
                  <div class="fw-semibold me-auto text-truncate">{{ archivo.name }}</div>
                  <button class="btn btn-sm btn-outline-danger" @click="eliminarArchivo(i)" aria-label="Eliminar archivo">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="archivo.tipo?.includes('pdf')" class="ratio ratio-16x9">
                    <iframe v-if="archivo.previewUrl" :src="archivo.previewUrl" style="border:none;"></iframe>
                  </div>
                  <div v-else class="text-center">
                    <img v-if="archivo.previewUrl" :src="archivo.previewUrl" alt="Vista previa" class="img-fluid rounded shadow-sm" style="max-height:700px; object-fit:contain;">
                  </div>
                </div>
              </div>

              <div class="d-grid mt-3">
                <button
                  class="btn btn-danger btn-lg"
                  :disabled="enviando || bloqueoPorAprobadasTaller || !usuarioActual"
                  :title="bloqueoPorAprobadasTaller ? 'No puedes enviar nuevas cotizaciones: límite de Aprobadas alcanzado' : ''"
                  @click="enviarOC"
                >
                  <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
                  Enviar Cotización (Taller)
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside class="col-12 col-lg-4 d-none d-lg-block" v-if="mostrarEquipos">
          <div class="card h-100 card-elevated sticky-panel">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🔎 Buscar equipos</div>
              <button class="btn btn-sm btn-outline-secondary d-lg-none" @click="mostrarEquipos=false">Cerrar</button>
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

              <div v-if="(busquedaEquipo||'').trim().length < 2" class="text-center text-secondary py-3 small">
                Escribe para buscar. No se muestran datos hasta que ingreses al menos 2 caracteres.
              </div>

              <div v-if="cargandoEquipos" class="text-center py-3">
                <div class="spinner-border" role="status" aria-hidden="true"></div>
                <div class="mt-2">Buscando…</div>
              </div>

              <div v-if="!cargandoEquipos && (busquedaEquipo||'').trim().length >= 2 && resultadosEquipos.length === 0" class="text-center text-secondary py-3">
                No se encontraron resultados.
              </div>

              <div class="list-group equipos-list flex-grow-1" v-if="pagedEquipos.length">
                <div class="list-group-item p-3" v-for="e in pagedEquipos" :key="e.id || e.codigo">
                  <div class="d-flex align-items-start">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center mb-2 flex-wrap gap-2">
                        <h6 class="mb-0"><strong>{{ e.codigo || 'SIN CÓDIGO' }}</strong></h6>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">
                          {{ e.tipo_equipo || 'Tipo?' }}
                        </span>
                      </div>

                      <div class="text-secondary small">
                        <div><strong>Año:</strong> {{ e.ano || '—' }}</div>
                        <div><strong>Clasificación:</strong> {{ e.clasificacion1 || '—' }}</div>
                        <div><strong>Equipo:</strong> {{ e.equipo || '—' }}</div>
                        <div><strong>Localización:</strong> {{ e.localizacion || '—' }}</div>
                        <div><strong>Marca:</strong> {{ e.marca || '—' }}</div>
                        <div><strong>Modelo:</strong> {{ e.modelo || '—' }}</div>
                        <div><strong>N° Chasis:</strong> {{ e.numero_chasis || '—' }}</div>
                      </div>
                    </div>

                    <div class="ms-3">
                      <button class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">
                        Copiar
                      </button>
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
                    <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" aria-label="Siguiente">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
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
  serverTimestamp,
  onSnapshot,
  Timestamp,
  getCountFromServer,
  runTransaction,
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

const router = useRouter();
const route = useRoute();
const volver = () => router.back();

const auth = useAuthStore();
const isAuthReady = ref(false);
const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");
const userRole = ref("");

const APPLY_TO_ROLES = ["editor"];
const MAX_OC_APROBADAS_TALLER = Number(import.meta.env.VITE_MAX_OC_APROBADAS_TALLER ?? 20);

const totalAprobadasDelUsuarioTaller = ref(0);
const bloqueoPorAprobadasTaller = computed(() => {
  const roleLower = String(userRole.value || "").trim().toLowerCase();
  if (!APPLY_TO_ROLES.includes(roleLower)) return false;
  return totalAprobadasDelUsuarioTaller.value >= MAX_OC_APROBADAS_TALLER;
});

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
const closeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const enviando = ref(false);
const usarSolped = ref(true);
const nuevoIdVisual = ref(null);
const cargandoNumero = ref(false);
const errorNumero = ref("");
const comentario = ref("");

const centroCostoTexto = ref("");
const empresaSeleccionada = ref("Xtreme Servicios");
const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");
const aprobadorSugerido = ref("");

const tipoCambioUSD = 950;
const tipoCambioEUR = 1050;
const ESTATUS_FIJO_INICIAL = "Revisión Guillermo";

const mostrarEquipos = ref(false);

const nnum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const normalizePlain = (s) =>
  String(s || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

const itemIdentityKey = (it) => {
  const itemN = nnum(it?.item, 0);
  const ni = String(it?.numero_interno || "").trim();
  const desc = normalizePlain(it?.descripcion || "");
  return `${itemN}|${ni}|${desc}`;
};

const isItemCompleto = (it) => {
  const total = nnum(it?.cantidad, 0);
  const cot = nnum(it?.cantidad_cotizada, 0);
  return total > 0 && cot >= total;
};

const normalizarEstadoCantidades = ({ total, cotizada }) => {
  const t = Math.max(0, nnum(total, 0));
  const cRaw = Math.max(0, nnum(cotizada, 0));
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
  const final = nnum(antes, 0) + nnum(nueva, 0);
  return normalizarEstadoCantidades({ total, cotizada: final });
};

const clampCantidadParaCotizar = (it) => {
  const total = nnum(it?.cantidad, 0);
  const antes = nnum(it?.cantidad_cotizada, 0);
  const max = Math.max(0, total - antes);

  const raw = nnum(it?.cantidad_para_cotizar, 0);
  const v = Math.min(Math.max(0, raw), max);

  it.__max = max;
  it.cantidad_para_cotizar = v;
  it.__restante = Math.max(0, max - v);
  it.__restan = it.__restante;
  it.__invalid = raw !== v;
};

const clampCantidad = (it) => clampCantidadParaCotizar(it);


const buildItemsSolpedForUI = (solpedItems = []) => {
  return (solpedItems || [])
    .map((it, idx) => {
      const total = nnum(it?.cantidad, 0);
      const antes = nnum(it?.cantidad_cotizada, 0);
      const normalizado = normalizarEstadoCantidades({ total, cotizada: antes });
      const max = Math.max(0, total - normalizado.finalCotizada);

      const itemNormalizado = {
        ...it,
        item: nnum(it?.item, idx + 1),
        cantidad: total,
        cantidad_cotizada: normalizado.finalCotizada,
        estado: normalizado.estado,
        estado_cotizacion: normalizado.estado_cotizacion,
      };

      const baseKey = itemIdentityKey(itemNormalizado);

      return {
        ...itemNormalizado,
        cantidad_para_cotizar: 0,
        __sourceIndex: idx,
        __key: baseKey,
        __tempId: `${baseKey}|${idx}`,
        __k: `${baseKey}|${idx}`,
        __max: max,
        __restante: max,
        __restan: max,
        __invalid: false,
      };
    })
    .filter((it) => !isItemCompleto(it));
};

const buildSelectionsTaller = (itemsUI = []) => {
  return (itemsUI || [])
    .map((it) => {
      clampCantidadParaCotizar(it);
      return {
        sourceIndex: nnum(it.__sourceIndex, -1),
        key: String(it.__key || ""),
        item: nnum(it.item, 0),
        numero_interno: String(it.numero_interno || "").trim(),
        descripcion: String(it.descripcion || ""),
        __tempId: String(it.__tempId || "").trim(),
        qty: nnum(it.cantidad_para_cotizar, 0),
      };
    })
    .filter((x) => x.qty > 0);
};

const buildItemsOC_Taller = (
  itemsUI = [],
  selections = [],
  nombreUsuario = "",
  solpedId = "",
  solpedSel = null,
  moneda = "CLP",
  totalConIVA = 0
) => {
  const selByIndex = new Map();
  const selByKey = new Map();

  for (const s of selections || []) {
    const qty = Math.max(0, nnum(s.qty, 0));
    if (qty <= 0) continue;

    if (nnum(s.sourceIndex, -1) >= 0) {
      selByIndex.set(nnum(s.sourceIndex, -1), qty);
    }

    if (s.key) {
      selByKey.set(String(s.key), qty);
    }
  }

  const out = [];

  for (const it of itemsUI || []) {
    clampCantidadParaCotizar(it);

    const qty =
      (selByIndex.has(nnum(it.__sourceIndex, -1)) ? selByIndex.get(nnum(it.__sourceIndex, -1)) : undefined) ??
      (selByKey.has(String(it.__key || "")) ? selByKey.get(String(it.__key || "")) : 0);

    if (!qty || qty <= 0) continue;

    const total = nnum(it.cantidad, 0);
    const antes = nnum(it.cantidad_cotizada, 0);
    const st = computeEstadoItem({ total, antes, nueva: qty });

    out.push({
      item: nnum(it.item, 0),
      descripcion: String(it.descripcion || ""),
      cantidad: total,
      cantidad_cotizada_antes: antes,
      cantidad_para_cotizar: qty,
      cantidad_cotizada: st.finalCotizada,
      codigo_referencial: it.codigo_referencial || "SIN CÓDIGO",
      numero_interno: it.numero_interno || "",
      imagen_url: it.imagen_url ?? null,
      stock: nnum(it.stock, 0),
      estado: st.estado,
      estado_cotizacion: st.estado_cotizacion,

      solpedId,
      numero_solped: solpedSel?.numero_solpe || 0,
      tipo_solped: solpedSel?.tipo_solped || "No definido",
      moneda,
      precioTotalConIVA: totalConIVA,
      responsable: nombreUsuario,

      __tempId: String(it.__tempId || ""),
      __sourceIndex: nnum(it.__sourceIndex, -1),
      __itemKey: String(it.__key || ""),
    });
  }

  return out;
};

const archivos = ref([]);
const dragOverArchivos = ref(false);
let dragCounterArchivos = 0;
const abrirSelectorArchivos = () => {
  const input = document.getElementById("inputArchivo");
  if (input) input.click();
};

const archivoYaAgregado = (file) => {
  const name = String(file?.name || "").trim().toLowerCase();
  const size = Number(file?.size || 0);

  return archivos.value.some((a) => {
    const aName = String(a?.name || "").trim().toLowerCase();
    const aSize = Number(a?.file?.size || 0);
    return aName === name && aSize === size;
  });
};

const procesarArchivosEntrantes = async (files = []) => {
  const list = Array.from(files || []);
  if (!list.length) return;

  let agregados = 0;

  for (const file of list) {
    if (!file || file.size === 0) {
      addToast("warning", `Archivo inválido: ${file?.name || "desconocido"}`);
      continue;
    }

    if (archivoYaAgregado(file)) {
      addToast("warning", `El archivo "${file.name}" ya fue agregado.`);
      continue;
    }

    const t = String(file.type || "").toLowerCase();
    const esPDF = t.includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf");
    const esIMG = t.startsWith("image/");

    if (!esPDF && !esIMG) {
      addToast("warning", `Formato no soportado: "${file.name}". Solo PDF o imágenes.`);
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
  }

  if (!agregados) {
    addToast("warning", "Ningún archivo válido fue agregado.");
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

const eliminarArchivo = (idx) => {
  const a = archivos.value[idx];
  try {
    if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
  } catch (e) {
    console.log(e);
  }
  archivos.value.splice(idx, 1);
  addToast("success", "Archivo eliminado.");
};

const solpedDisponibles = ref([]);
const solpedSeleccionadaId = ref("");
const solpedSeleccionada = ref(null);
const itemsSolped = ref([]);

const autorizacionNombre = ref(null);
const autorizacionUrlRaw = ref(null);
const autorizacionEsPDF = ref(false);
const autorizacionEsImagen = ref(false);

const theAutorizacionReset = () => {
  autorizacionNombre.value = null;
  autorizacionUrlRaw.value = null;
  autorizacionEsPDF.value = false;
  autorizacionEsImagen.value = false;
};

const centrosCostoDict = {
  "27483": "CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA",
  "23302-CARPETAS": "CONTRATO 23302 CARPETAS",
};

const centroCostoTextoAyuda = computed(() => {
  const v = (centroCostoTexto.value || "").trim();
  return centrosCostoDict[v] || "";
});

const onToggleUsarSolped = () => {
  if (!usarSolped.value) {
    solpedSeleccionada.value = null;
    solpedSeleccionadaId.value = "";
    itemsSolped.value = [];
    theAutorizacionReset();
  }
  calcularAprobador();
};

const onChangeSolped = async () => {
  if (!solpedSeleccionadaId.value) {
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    theAutorizacionReset();
    return;
  }

  try {
    const dref = doc(db, "solped_taller", solpedSeleccionadaId.value);
    const snap = await getDoc(dref);
    if (!snap.exists()) return;

    const data = snap.data() || {};
    const st = String(data.estatus || "").trim().toLowerCase();
    const allowed = ["pendiente", "parcial", "cotizado parcial", "cotizado completado"];

    if (!allowed.includes(st)) {
      addToast("warning", "Esta SOLPED no está en estado Pendiente / Parcial / Cotizando.");
      solpedSeleccionada.value = null;
      solpedSeleccionadaId.value = "";
      itemsSolped.value = [];
      theAutorizacionReset();
      return;
    }

    solpedSeleccionada.value = data;

    centroCostoTexto.value = (
      data.nombre_centro_costo ||
      data.centro_costo ||
      data.numero_contrato ||
      ""
    ).toString();

    autorizacionNombre.value = data.autorizacion_nombre || null;
    autorizacionUrlRaw.value = data.autorizacion_url || null;

    const guess = String((autorizacionNombre.value || autorizacionUrlRaw.value || "")).toLowerCase();
    autorizacionEsPDF.value = guess.endsWith(".pdf");
    autorizacionEsImagen.value = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(guess);

    const todos = Array.isArray(data.items) ? data.items : [];
    itemsSolped.value = buildItemsSolpedForUI(todos);

    for (const it of itemsSolped.value) clampCantidadParaCotizar(it);

    if (data.empresa) empresaSeleccionada.value = data.empresa;
    calcularAprobador();
  } catch (e) {
    console.error(e);
  }
};

const onCambioMoneda = () => {
  formatearPrecConValor(precioTotalConIVA.value);
};

const formatearPrecio = (ev) => {
  const input = String(ev?.target?.value ?? "");
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
  let totalCLP = nnum(precioTotalConIVA.value, 0);
  const mon = String(monedaSeleccionada.value || "CLP").toUpperCase();

  if (mon === "USD") totalCLP *= tipoCambioUSD;
  else if (mon === "EUR") totalCLP *= tipoCambioEUR;

  const empresa = String(empresaSeleccionada.value || "").toLowerCase();

  if (empresa.includes("xtreme")) {
    if (totalCLP <= 500000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Alejandro Candia";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else {
    aprobadorSugerido.value = "";
  }
};

const actualizarSolpedTaller_postOC = async (solpedId, selections, nombreUsuario, estatusInicial) => {
  if (!solpedId) return;
  if (!Array.isArray(selections) || selections.length === 0) return;

  const srefDoc = doc(db, "solped_taller", solpedId);

  await runTransaction(db, async (tx) => {
    const ss = await tx.get(srefDoc);
    if (!ss.exists()) return;

    const dataSol = ss.data() || {};
    const originales = Array.isArray(dataSol.items) ? dataSol.items : [];

    const selByIndex = new Map();
    const selByKey = new Map();

    for (const s of selections) {
      const qty = Math.max(0, nnum(s.qty, 0));
      if (qty <= 0) continue;

      if (nnum(s.sourceIndex, -1) >= 0) {
        selByIndex.set(nnum(s.sourceIndex, -1), qty);
      }

      if (s.key) {
        selByKey.set(String(s.key), qty);
      }
    }

    const actualizados = originales.map((it, idx) => {
      const total = nnum(it?.cantidad, 0);
      const antes = nnum(it?.cantidad_cotizada, 0);

      const identity = itemIdentityKey({
        ...it,
        item: nnum(it?.item, idx + 1),
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
          item: nnum(it?.item, idx + 1),
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
        item: nnum(it?.item, idx + 1),
        cantidad: total,
        cantidad_cotizada: normalizado.finalCotizada,
        estado: normalizado.estado,
        estado_cotizacion: normalizado.estado_cotizacion,
      };
    });

    const allComplete = actualizados.every((it) => {
      const total = nnum(it?.cantidad, 0);
      const cot = nnum(it?.cantidad_cotizada, 0);
      return total <= 0 || cot >= total;
    });

    const anyCotizado = actualizados.some((it) => nnum(it?.cantidad_cotizada, 0) > 0);

    const nextEstatus = allComplete
      ? "Cotizado Completado"
      : (anyCotizado ? "Cotizado Parcial" : (dataSol.estatus || "Pendiente"));

    tx.update(srefDoc, {
      items: actualizados,
      estatus: nextEstatus,
      updated_at: serverTimestamp(),
    });
  });

  await addDoc(collection(db, "solped_taller", solpedId, "historialEstados"), {
    usuario: nombreUsuario || "Sistema",
    fecha: serverTimestamp(),
    estatus: `Cotización enviada - ${estatusInicial || "Pendiente de Aprobación"}`,
  });
};

const enviarOC = async () => {
  if (enviando.value) return;

  await refrescarAprobadasConCountTaller();

  if (bloqueoPorAprobadasTaller.value) {
    addToast(
      "warning",
      `Tienes ${totalAprobadasDelUsuarioTaller.value} cotizaciones del Taller en "Aprobado" en los últimos 2 meses. Ve al detalle y súbelas antes de continuar.`
    );
    return;
  }

  if (!usuarioActual.value) {
    addToast("warning", "Debes iniciar sesión.");
    return;
  }
  if (!centroCostoTexto.value.trim()) {
    addToast("warning", "Ingresa Centro de Costo");
    return;
  }
  if (!precioTotalConIVA.value || precioTotalConIVA.value <= 0) {
    addToast("warning", "Precio inválido");
    return;
  }
  if (!monedaSeleccionada.value) {
    addToast("warning", "Selecciona moneda");
    return;
  }
  if (usarSolped.value && !solpedSeleccionadaId.value) {
    addToast("warning", "Selecciona una SOLPED o desactiva la opción");
    return;
  }
  if (archivos.value.length === 0) {
    addToast("warning", "Debes subir al menos un archivo de cotización");
    return;
  }

  let selections = [];
  if (usarSolped.value && solpedSeleccionadaId.value) {
    selections = buildSelectionsTaller(itemsSolped.value);
    if (!selections.length) {
      addToast("warning", "Debes ingresar cantidad a cotizar en al menos un ítem.");
      return;
    }
  }

  const nombreUsuario = (usuarioActual.value || "").trim();
  const comentarioFinal = (comentario.value || "").trim();
  enviando.value = true;

  try {
    const qy = query(collection(db, "ordenes_oc_taller"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId = Number(lastId) + 1;

    calcularAprobador();
    const aprobador = aprobadorSugerido.value || "";
    const estatusInicial = ESTATUS_FIJO_INICIAL;

    const storage = getStorage();
    const subidos = [];

    for (const a of archivos.value) {
      if (!a.file || a.file.size < 100) continue;

      const safeName = String(a.name || "archivo")
        .replace(/[^\w.\-() ]+/g, "_")
        .slice(0, 120);

      const path = `ordenes_oc_taller/${newId}/${safeName}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, a.file);
      const url = await getDownloadURL(up.ref);

      subidos.push({
        nombre: safeName,
        tipo: a.tipo || a.file.type || "application/octet-stream",
        url,
      });
    }

    let itemsFinal = [];
    if (usarSolped.value && solpedSeleccionadaId.value && solpedSeleccionada.value) {
      itemsFinal = buildItemsOC_Taller(
        itemsSolped.value,
        selections,
        nombreUsuario,
        solpedSeleccionadaId.value,
        solpedSeleccionada.value,
        monedaSeleccionada.value,
        precioTotalConIVA.value
      );

      if (!itemsFinal.length) {
        addToast("warning", "No hay ítems válidos para cotizar (revisa cantidades).");
        return;
      }
    }

    const historialEntry = {
      usuario: nombreUsuario,
      estatus: estatusInicial,
      fecha: new Date().toISOString(),
      comentario: comentarioFinal,
    };

    const dataToSave = {
      id: newId,
      empresa: empresaSeleccionada.value,
      centroCostoTexto: centroCostoTexto.value,
      comentario: comentarioFinal,
      aprobadorSugerido: aprobador,
      aprobadoPor: "",
      estatus: estatusInicial,
      fechaAprobacion: null,
      fechaSubida: serverTimestamp(),
      archivosStorage: subidos,
      historial: [historialEntry],
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,
      responsable: nombreUsuario,

      ...(usarSolped.value && solpedSeleccionadaId.value
        ? {
            solpedId: solpedSeleccionadaId.value,
            numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
            tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
            items: itemsFinal,
          }
        : {
            tipo_solped: "Sin SOLPED",
            items: [],
          }),
    };

    const newRef = await addDoc(collection(db, "ordenes_oc_taller"), dataToSave);
    await updateDoc(newRef, { __docId: newRef.id });

    if (usarSolped.value && solpedSeleccionadaId.value) {
      await actualizarSolpedTaller_postOC(
        solpedSeleccionadaId.value,
        selections,
        nombreUsuario,
        estatusInicial
      );
    }

    addToast("success", "Cotización (Taller) enviada exitosamente.");
    router.push({ name: "OrdenOCTallerDetalle", params: { id: newRef.id } });

    resetFormulario();
    await cargarSiguienteNumero();

    const inputEl = document.getElementById("inputArchivo");
    if (inputEl) inputEl.value = "";
  } catch (e) {
    console.error(e);
    addToast("danger", "Error al enviar la cotización de Taller.");
  } finally {
    enviando.value = false;
  }
};

const irADetalleOCTaller = (ocOrId) => {
  const id = typeof ocOrId === "string" ? ocOrId : (ocOrId?.__docId || ocOrId?.id || "");
  if (!id) {
    addToast("warning", "No se pudo obtener el ID de la OC.");
    return;
  }
  router.push({ name: "OrdenOCTallerDetalle", params: { id } });
};

function resetFormulario() {
  centroCostoTexto.value = "";
  empresaSeleccionada.value = "Xtreme Servicios";

  for (const a of archivos.value) {
    try {
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
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
  precioTotalConIVA.value = 0;
  precioFormateado.value = "";
  aprobadorSugerido.value = "";
  monedaSeleccionada.value = "CLP";
  theAutorizacionReset();
}

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : null);
    if (!d) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const estadoBadgeClass = (estatus) => {
  const s = String(estatus || "").toLowerCase();
  if (s.includes("proveedor")) return "bg-primary-subtle text-primary-emphasis";
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("preaprob")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("escala")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("pendiente")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const mostrarOCTallerMes = ref(false);
const cargandoOCTallerMes = ref(false);
const ocTallerMes = ref([]);
const ocTallerMesPageSize = 2;
const ocTallerMesCurrentPage = ref(1);
let _unsubOCTallerMes = null;

const ocTallerMesTotalPages = computed(() =>
  Math.max(1, Math.ceil(ocTallerMes.value.length / ocTallerMesPageSize))
);

const ocTallerMesVisiblePages = computed(() => {
  const maxButtons = 8;
  const pages = [];
  let start = Math.max(1, ocTallerMesCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(ocTallerMesTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const ocTallerMesPaged = computed(() => {
  const start = (ocTallerMesCurrentPage.value - 1) * ocTallerMesPageSize;
  return ocTallerMes.value.slice(start, start + ocTallerMesPageSize);
});

const ocTallerMesGoTo = (n) => {
  if (n < 1 || n > ocTallerMesTotalPages.value) return;
  ocTallerMesCurrentPage.value = n;
};

function suscribirOCTallerMes(nombre) {
  if (_unsubOCTallerMes) {
    _unsubOCTallerMes();
    _unsubOCTallerMes = null;
  }

  ocTallerMes.value = [];
  ocTallerMesCurrentPage.value = 1;
  cargandoOCTallerMes.value = true;

  if (!nombre) {
    cargandoOCTallerMes.value = false;
    return;
  }

  const { from, to } = rangeUltimosDosMeses();

  try {
    const qy = query(
      collection(db, "ordenes_oc_taller"),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc")
    );

    _unsubOCTallerMes = onSnapshot(
      qy,
      (snap) => {
        const arr = [];
        snap.forEach((docu) => arr.push({ __docId: docu.id, ...docu.data() }));
        ocTallerMes.value = arr.sort(
          (a, b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0)
        );
        ocTallerMesCurrentPage.value = 1;
        cargandoOCTallerMes.value = false;
      },
      () => {
        cargandoOCTallerMes.value = false;
      }
    );
  } catch {
    cargandoOCTallerMes.value = false;
  }
}

const desuscribirOCTallerMes = () => {
  if (_unsubOCTallerMes) {
    _unsubOCTallerMes();
    _unsubOCTallerMes = null;
  }
  ocTallerMes.value = [];
  ocTallerMesCurrentPage.value = 1;
  cargandoOCTallerMes.value = false;
};

const toggleOCTallerMes = () => {
  mostrarOCTallerMes.value = !mostrarOCTallerMes.value;
  if (mostrarOCTallerMes.value) suscribirOCTallerMes(usuarioActual.value);
  else desuscribirOCTallerMes();
};

const mostrarResumenUsuarios = ref(false);
const cargandoResumenUsuarios = ref(false);
const resumenUsuarios = ref([]);
const resumenPageSize = 10;
const resumenCurrentPage = ref(1);
let _unsubResumenUsuarios = null;

const resumenTotalPages = computed(() =>
  Math.max(1, Math.ceil(resumenUsuarios.value.length / resumenPageSize))
);

const resumenVisiblePages = computed(() => {
  const maxButtons = 8;
  const pages = [];
  let start = Math.max(1, resumenCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(resumenTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const resumenUsuariosPaged = computed(() => {
  const start = (resumenCurrentPage.value - 1) * resumenPageSize;
  return resumenUsuarios.value.slice(start, start + resumenPageSize);
});

const resumenGoTo = (n) => {
  if (n < 1 || n > resumenTotalPages.value) return;
  resumenCurrentPage.value = n;
};

function mapEstatusCategoria(estatusRaw) {
  const s = String(estatusRaw || "").toLowerCase().trim();
  if (s.includes("proveedor")) return "Enviada a proveedor";
  if (s.includes("aprobado") && !s.includes("preaprob")) return "Aprobado";
  if (s.includes("preaprob")) return "Preaprobado";
  if (s.includes("rechaz") || s.includes("escala")) return "Rechazado";
  if (s.includes("pendiente")) return "Pendiente de Aprobación";
  if (s.includes("revisión") || s.includes("revision")) return "Revisión Guillermo";
  return "Otros";
}

function desuscribirResumenUsuarios() {
  if (_unsubResumenUsuarios) {
    _unsubResumenUsuarios();
    _unsubResumenUsuarios = null;
  }
  resumenUsuarios.value = [];
  resumenCurrentPage.value = 1;
  cargandoResumenUsuarios.value = false;
}

function suscribirResumenUsuarios(nombre) {
  desuscribirResumenUsuarios();
  cargandoResumenUsuarios.value = true;

  if (!nombre) {
    cargandoResumenUsuarios.value = false;
    return;
  }

  const { from, to } = rangeUltimosDosMeses();

  try {
    const qy = query(
      collection(db, "ordenes_oc_taller"),
      where("responsable", "==", nombre),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc")
    );

    _unsubResumenUsuarios = onSnapshot(
      qy,
      (snap) => {
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
          const cat = mapEstatusCategoria(x.estatus);
          if (cat === "Aprobado") row.aprobado++;
          else if (cat === "Rechazado") row.rechazado++;
          else if (cat === "Preaprobado") row.preaprobado++;
          else if (cat === "Pendiente de Aprobación") row.pendiente++;
          else if (cat === "Revisión Guillermo") row.revision++;
          else if (cat === "Enviada a proveedor") row.proveedor++;
          else row.otros++;
          row.total++;
        });

        resumenUsuarios.value = row.total > 0 ? [row] : [];
        resumenCurrentPage.value = 1;
        cargandoResumenUsuarios.value = false;
      },
      () => {
        cargandoResumenUsuarios.value = false;
      }
    );
  } catch {
    cargandoResumenUsuarios.value = false;
  }
}

const toggleResumenUsuarios = () => {
  mostrarResumenUsuarios.value = !mostrarResumenUsuarios.value;
  if (mostrarResumenUsuarios.value) suscribirResumenUsuarios(usuarioActual.value);
  else desuscribirResumenUsuarios();
};

let _unsubAprobadasLiveTaller = null;

async function refrescarAprobadasConCountTaller() {
  try {
    const nombre = (usuarioActual.value || "").trim();
    if (!nombre) {
      totalAprobadasDelUsuarioTaller.value = 0;
      return;
    }

    const { from, to } = rangeUltimosDosMeses();
    const qy = query(
      collection(db, "ordenes_oc_taller"),
      where("responsable", "==", nombre),
      where("estatus", "==", "Aprobado"),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to)
    );
    const snap = await getCountFromServer(qy);
    totalAprobadasDelUsuarioTaller.value = snap.data().count || 0;
  } catch (e) {
    console.error("getCountFromServer (taller) error:", e);
    totalAprobadasDelUsuarioTaller.value = 0;
  }
}

function suscribirAprobadasLiveMinimaTaller() {
  if (_unsubAprobadasLiveTaller) {
    _unsubAprobadasLiveTaller();
    _unsubAprobadasLiveTaller = null;
  }

  const nombre = (usuarioActual.value || "").trim();
  if (!nombre) return;

  try {
    const { from, to } = rangeUltimosDosMeses();
    const qy = query(
      collection(db, "ordenes_oc_taller"),
      where("responsable", "==", nombre),
      where("estatus", "==", "Aprobado"),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc"),
      limit(1)
    );

    _unsubAprobadasLiveTaller = onSnapshot(qy, async () => {
      await refrescarAprobadasConCountTaller();
    });
  } catch (e) {
    console.error("suscribirAprobadasLiveMinimaTaller:", e);
  }
}

const obtenerNombreUsuario = async () => {
  try {
    const uid = myUid.value;
    if (uid) {
      const dref = doc(db, "Usuarios", uid);
      const snap = await getDoc(dref);
      if (snap.exists()) {
        const data = snap.data() || {};
        usuarioActual.value = data.fullName || auth?.user?.displayName || auth?.user?.email || "";
        userRole.value = data.role || "";
      }
    }

    if (!usuarioActual.value) {
      usuarioActual.value = auth?.user?.displayName || auth?.user?.email || "";
    }
  } catch (e) {
    console.error(e);
  } finally {
    isAuthReady.value = true;
  }
};

const cargarSolpedSolicitadas = async () => {
  try {
    let arr = [];
    try {
      const qy = query(
        collection(db, "solped_taller"),
        where("estatus", "in", ["Pendiente", "Parcial", "Cotizado Parcial", "Cotizado Completado"])
      );
      const snap = await getDocs(qy);
      arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      const snap = await getDocs(collection(db, "solped_taller"));
      arr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) =>
          ["pendiente", "parcial", "cotizado parcial", "cotizado completado"].includes(
            String(x.estatus || "").trim().toLowerCase()
          )
        );
    }

    solpedDisponibles.value = arr.sort((a, b) => (a.numero_solpe || 0) - (b.numero_solpe || 0));
  } catch (e) {
    console.error(e);
  }
};

const cargarSiguienteNumero = async () => {
  if (cargandoNumero.value) return;
  cargandoNumero.value = true;
  errorNumero.value = "";

  try {
    const qy = query(collection(db, "ordenes_oc_taller"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const last = snap.docs[0]?.data()?.id || 0;
    nuevoIdVisual.value = Number(last) + 1;
  } catch (e) {
    console.error("cargarSiguienteNumero (taller):", e);
    nuevoIdVisual.value = 1;
    errorNumero.value = "No se pudo obtener el número. Se asignó 1 por defecto.";
  } finally {
    cargandoNumero.value = false;
  }
};

const busquedaEquipo = ref("");
const cargandoEquipos = ref(false);
const resultadosEquipos = ref([]);
const currentPage = ref(1);
const equiposPageSize = 5;
let debounce = null;
let lastSearchToken = 0;
const cacheResultados = new Map();

const equiposAll = ref([]);
const equiposIndex = ref([]);
const equiposLoaded = ref(false);
const equiposLoadingAll = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(resultadosEquipos.value.length / equiposPageSize)));
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
  const start = (currentPage.value - 1) * equiposPageSize;
  return resultadosEquipos.value.slice(start, start + equiposPageSize);
});
const goToPage = (n) => {
  if (n < 1 || n > totalPages.value) return;
  currentPage.value = n;
};

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

const normEq = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const compactEq = (s) => normEq(s).replace(/[^a-z0-9]+/g, "");

const splitTokens = (q) =>
  normEq(q)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .filter((t) => t.length >= 2);

const haystackEquipo = (e) => {
  const s = SEARCH_FIELDS.map((k) => normEq(e?.[k])).join(" ");
  return s.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
};

const buildEquipIndexRow = (e) => {
  const h = haystackEquipo(e);
  return {
    ...e,
    __hay: h,
    __tokens: new Set(h.split(" ").filter(Boolean)),
    __codeCompact: compactEq(e?.codigo),
  };
};

const scoreEquipo = (e, qRaw, qTokens, qCompact) => {
  let score = 0;
  const h = e.__hay || "";
  const qFull = normEq(qRaw).replace(/[^a-z0-9]+/g, " ").trim();

  if (e.__codeCompact && qCompact && e.__codeCompact === qCompact) score += 3000;
  if (e.__codeCompact && qCompact && e.__codeCompact.includes(qCompact)) score += 900;
  if (qFull && h.includes(qFull)) score += 400;

  for (const t of qTokens) {
    if (e.__tokens?.has(t)) score += 220;
    else if (h.includes(t)) score += 80;
  }

  const startsBoost = ["codigo", "numero_chasis", "modelo", "equipo", "marca"];
  for (const k of startsBoost) {
    const v = normEq(e?.[k]);
    if (v && qFull && v.startsWith(qFull)) score += 700;
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
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(async () => {
    const q = (busquedaEquipo.value || "").trim();
    if (q.length >= 2) await buscarEquipos(q);
    else {
      resultadosEquipos.value = [];
      currentPage.value = 1;
    }
  }, 250);
};

const buscarEquipos = async (q) => {
  const qTrim = String(q || "").trim();
  const qKey = normEq(qTrim);
  currentPage.value = 1;

  if (qKey.length < 2) {
    resultadosEquipos.value = [];
    return;
  }

  if (!equiposLoaded.value) await ensureEquiposLoaded();
  if (!equiposLoaded.value) {
    resultadosEquipos.value = [];
    return;
  }

  if (cacheResultados.has(qKey)) {
    resultadosEquipos.value = cacheResultados.get(qKey);
    return;
  }

  const token = ++lastSearchToken;
  cargandoEquipos.value = true;

  try {
    const qTokens = splitTokens(qKey);
    const qCompact = compactEq(qTrim);

    let base = equiposIndex.value;
    if (qTokens.length) {
      base = base.filter((e) => qTokens.every((t) => (e.__hay || "").includes(t)));
    } else {
      base = base.filter((e) => (e.__hay || "").includes(qKey));
    }

    if (token !== lastSearchToken) return;

    const ranked = base
      .map((e) => ({ e, s: scoreEquipo(e, qTrim, qTokens, qCompact) }))
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
    cacheResultados.set(qKey, ranked);
  } catch (e) {
    console.error("[equipos] buscarEquipos error:", e);
    resultadosEquipos.value = [];
    addToast("danger", "Error al buscar equipos.");
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

const toggleEquiposPanel = async () => {
  mostrarEquipos.value = !mostrarEquipos.value;
  if (mostrarEquipos.value) {
    await ensureEquiposLoaded();
  }
};

watch(usuarioActual, async (nv, ov) => {
  if (nv && nv !== ov) {
    await refrescarAprobadasConCountTaller();
    suscribirAprobadasLiveMinimaTaller();
    if (mostrarOCTallerMes.value) suscribirOCTallerMes(nv);
    if (mostrarResumenUsuarios.value) suscribirResumenUsuarios(nv);
  }
});

onMounted(async () => {
  await obtenerNombreUsuario();

  if (usuarioActual.value) {
    await refrescarAprobadasConCountTaller();
    suscribirAprobadasLiveMinimaTaller();
  }

  await cargarSolpedSolicitadas();
  await cargarSiguienteNumero();

  const preId = String(route?.query?.fromSolpedId || "").trim();
  if (preId) {
    usarSolped.value = true;
    solpedSeleccionadaId.value = preId;
    await onChangeSolped();
  }
});

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce);
  if (_unsubOCTallerMes) _unsubOCTallerMes();
  if (_unsubAprobadasLiveTaller) {
    _unsubAprobadasLiveTaller();
    _unsubAprobadasLiveTaller = null;
  }
  if (_unsubResumenUsuarios) {
    _unsubResumenUsuarios();
    _unsubResumenUsuarios = null;
  }

  for (const a of archivos.value) {
    try {
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
    } catch (e) {
      console.log(e);
    }
  }
});
</script>

<style scoped>
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

.generador-oc-page{ min-height:100vh; }

.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
}

.sticky-panel{ position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: hidden; }
.sticky-panel .card-body{ overflow: auto; }

.equipos-list{ max-height: 55vh; overflow: auto; }

.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

.lock-overlay{
  position: absolute; inset: 0; background: rgba(255,255,255,.7);
  backdrop-filter: blur(2px); z-index: 5; display: grid; place-items: center; padding: 1rem;
}
.lock-box{
  background: #fff; border: 1px solid #e5e7eb; border-radius: .85rem; padding: 1rem 1.25rem;
  box-shadow: 0 10px 24px rgba(0,0,0,.12); max-width: 420px;
}

.table td, .table th { vertical-align: middle; }

@media (max-width: 420px){
  .card-header .small{ font-size: .8rem; }
}
</style>
