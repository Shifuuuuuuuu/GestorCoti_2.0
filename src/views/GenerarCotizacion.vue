<!-- src/views/GenerarCotizacion.vue -->
<template>
  <div class="container py-4 py-lg-5">
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
      <div>
        <h1 class="h4 mb-0 fw-bold">Generar Cotización</h1>
        <div class="text-muted small">
          Formulario + cálculo automático + PDF + Firestore
          <span v-if="isEditing" class="ms-2 badge text-bg-warning text-dark border">
            Editando N° {{ String(editingNumero).padStart(3, "0") }}
          </span>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-dark" @click="openHistorial" :disabled="saving">
          <i class="bi bi-clock-history me-1"></i> Historial
        </button>

        <button class="btn btn-outline-secondary" @click="resetForm" :disabled="saving">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Limpiar
        </button>

        <button class="btn btn-danger" @click="guardarYGenerar" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-filetype-pdf me-1"></i>
          {{ isEditing ? "Actualizar y Generar PDF" : "Guardar y Generar PDF" }}
        </button>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-7">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h2 class="h6 fw-bold mb-0">Datos de Cotización</h2>
              <span class="badge text-bg-light border">IVA: {{ Math.round(ivaRate * 100) }}%</span>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Fecha</label>
                <input type="date" class="form-control" v-model="form.fecha" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Empresa (Cliente)</label>
                <input class="form-control" v-model.trim="form.clienteEmpresa" placeholder="Ej: Xtreme Mining" />
              </div>
            </div>

            <hr class="my-4" />

            <div class="d-flex align-items-center justify-content-between mb-2">
              <h2 class="h6 fw-bold mb-0">Ítems</h2>
              <div class="small text-muted">Edita: descripción, valor unitario, cantidad y descuento (%)</div>
            </div>

            <div class="table-responsive table-center">
              <table class="table align-middle table-fixed">
                <thead>
                  <tr class="table-danger">
                    <th style="min-width: 320px;">Descripción</th>
                    <th class="text-end" style="min-width: 160px;">Valor Unitario</th>
                    <th class="text-end" style="min-width: 120px;">Cantidad</th>
                    <th class="text-end" style="min-width: 140px;">Descuento %</th>
                    <th style="width: 1px;"></th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(it, idx) in form.items" :key="it.id">
                    <td>
                      <input class="form-control" v-model.trim="it.descripcion" placeholder="Ej: Servicio / repuesto..." />
                      <div v-if="errors[`item_desc_${idx}`]" class="text-danger small mt-1">
                        {{ errors[`item_desc_${idx}`] }}
                      </div>
                    </td>

                    <td class="text-end">
                      <input type="number" class="form-control text-end" v-model.number="it.valorUnitario" min="0" step="1" />
                    </td>

                    <td class="text-end">
                      <input type="number" class="form-control text-end" v-model.number="it.cantidad" min="0" step="1" />
                    </td>

                    <td class="text-end">
                      <input
                        type="number"
                        class="form-control text-end"
                        v-model.number="it.descuentoPct"
                        min="0"
                        max="100"
                        step="1"
                        @blur="it.descuentoPct = clampPercent(it.descuentoPct)"
                      />
                    </td>

                    <td class="text-end">
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="removeItem(idx)"
                        :disabled="form.items.length === 1 || saving"
                        title="Eliminar ítem"
                        type="button"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr>
                    <td colspan="5">
                      <button class="btn btn-outline-danger" @click="addItem" :disabled="saving" type="button">
                        <i class="bi bi-plus-circle me-1"></i> Agregar ítem
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <hr class="my-4" />
            <h2 class="h6 fw-bold mb-3">Condiciones</h2>

            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Plazo de entrega</label>
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control text-end"
                    v-model.number="form.plazoEntregaDias"
                    min="1"
                    step="1"
                    @blur="form.plazoEntregaDias = sanitizePositiveInt(form.plazoEntregaDias, 2)"
                  />
                  <span class="input-group-text">días hábiles</span>
                </div>
                <div class="form-text">Se mostrará como: <b>{{ formPlazoEntregaStr }}</b></div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Validez</label>
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control text-end"
                    v-model.number="form.validezDias"
                    min="1"
                    step="1"
                    @blur="form.validezDias = sanitizePositiveInt(form.validezDias, 7)"
                  />
                  <span class="input-group-text">días</span>
                </div>
                <div class="form-text">Se mostrará como: <b>{{ formValidezStr }}</b></div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Condición de pago</label>
                <select class="form-select" v-model="form.pagoTipo">
                  <option v-for="o in PAGO_OPTS" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
                <div class="form-text">Se mostrará como: <b>{{ formPagoStr }}</b></div>
              </div>
            </div>

            <hr class="my-4" />

            <div class="d-flex align-items-center justify-content-between mb-2">
              <h2 class="h6 fw-bold mb-0">Datos</h2>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" type="button" @click="restoreFirmaDefaults" :disabled="saving">
                  <i class="bi bi-arrow-counterclockwise me-1"></i> Restaurar
                </button>
                <button class="btn btn-sm btn-outline-danger" type="button" @click="clearFirmaLocal" :disabled="saving">
                  <i class="bi bi-trash3 me-1"></i> Borrar local
                </button>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Nombre</label>
                <input class="form-control" v-model.trim="form.firmaNombre" placeholder="Ej: Guillermo Manzor" />
                <div class="form-text">Se guarda localmente los datos</div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Teléfono</label>
                <input
                  class="form-control"
                  v-model.trim="form.firmaTelefono"
                  placeholder="+56 9 XXXX XXXX"
                  inputmode="tel"
                  @blur="form.firmaTelefono = formatPhoneCL(form.firmaTelefono)"
                />
                <div class="form-text">Se formatea al salir del campo.</div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Mail</label>
                <input
                  class="form-control"
                  v-model.trim="form.firmaEmail"
                  placeholder="correo@empresa.cl"
                  inputmode="email"
                  @blur="form.firmaEmail = normalizeEmail(form.firmaEmail)"
                />
              </div>
            </div>

            <div v-if="errors._form" class="alert alert-danger mt-3 mb-0">
              {{ errors._form }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-5">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <h2 class="h6 fw-bold mb-0">Vista previa</h2>
              <span class="badge text-bg-secondary">PDF</span>
            </div>
            <div class="text-muted small mb-3">Así se verá el estilo del PDF.</div>

            <div class="preview-paper bg-white p-3">
              <div class="d-flex justify-content-between align-items-start">
                <img :src="logoUrl" alt="XT Servicios" class="preview-logo" />
                <div class="preview-title-bar">
                  <div class="preview-title">COTIZACIÓN</div>
                </div>
              </div>

              <div class="mt-4">
                <div class="preview-box-title">XTREME SERVICIOS</div>
                <div class="preview-box-muted">{{ emisor.direccion }}</div>
                <div class="preview-box-muted">RUT: {{ emisor.rut }}</div>
              </div>

              <div class="preview-sep my-3"></div>

              <div class="preview-intro">
                <div class="t2"><b>Empresa:</b> {{ form.clienteEmpresa || "—" }}</div>
                <div class="t3">
                  En atención a su gentil solicitud de cotización, tenemos el agrado de hacer llegar a usted nuestra propuesta:
                </div>
              </div>

              <div class="preview-table">
                <div class="preview-head">
                  <div class="c-desc">I T E M S</div>
                  <div class="c-qty text-end">C A N T.</div>
                  <div class="c-unit text-end">P R E C I O</div>
                  <div class="c-dto text-end">D T O</div>
                  <div class="c-sub text-end">S U B T O T A L</div>
                </div>

                <div class="preview-rows">
                  <div class="preview-row" v-for="(it, idx) in form.items" :key="it.id + '_p'">
                    <div class="c-desc">{{ it.descripcion || `Ítem ${idx + 1}` }}</div>
                    <div class="c-qty text-end">{{ it.cantidad || 0 }}</div>
                    <div class="c-unit text-end">{{ fmtCLP(it.valorUnitario || 0) }}</div>
                    <div class="c-dto text-end">{{ clampPercent(it.descuentoPct || 0) }}%</div>
                    <div class="c-sub text-end">{{ fmtCLP(itemNeto(it)) }}</div>
                  </div>
                </div>
              </div>

              <div class="preview-sep my-3"></div>

              <div class="d-flex justify-content-between align-items-start">
                <div class="small">
                  <div><b>Plazo:</b> {{ formPlazoEntregaStr }}</div>
                  <div><b>Validez:</b> {{ formValidezStr }}</div>
                  <div><b>Pago:</b> {{ formPagoStr }}</div>
                </div>

                <div class="preview-totals">
                  <div class="d-flex justify-content-between gap-3">
                    <span class="lbl">TOTAL:</span>
                    <span class="val">{{ fmtCLP(totalNeto) }}</span>
                  </div>
                  <div class="d-flex justify-content-between gap-3">
                    <span class="lbl">IMPUESTOS:</span>
                    <span class="val">{{ fmtCLP(totalIva) }}</span>
                  </div>
                  <div class="d-flex justify-content-between gap-3 fw-bold">
                    <span class="lbl">A PAGAR:</span>
                    <span class="val">{{ fmtCLP(totalGeneral) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 text-center small text-dark">
                <div class="fw-bold">Cordialmente, {{ form.firmaNombre }}</div>
                <div>Teléfono: {{ form.firmaTelefono }}</div>
                <div>Mail: {{ form.firmaEmail }}</div>
              </div>

              <div class="preview-footer mt-4">
                <div>{{ form.web || "www.xtrememining.cl" }}</div>
                <div class="sep"></div>
                <div>{{ form.telEmpresa || "+56 9 3430 3873" }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HISTORIAL -->
    <div class="modal fade" tabindex="-1" ref="histModalEl" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0">Historial de Cotizaciones</h5>
              <span class="badge text-bg-light border" v-if="histCount">{{ histCount }}</span>
            </div>
            <button type="button" class="btn-close" @click="closeHistorial"></button>
          </div>

          <div class="modal-body">
            <div class="d-flex gap-2 align-items-center flex-wrap mb-3">
              <div class="input-group" style="max-width: 520px;">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control" v-model.trim="histSearch" placeholder="Buscar por N°, empresa, fecha…" />
                <button class="btn btn-outline-secondary" @click="loadHistorial" :disabled="histLoading" type="button">
                  <span v-if="histLoading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i>
                  Actualizar
                </button>
              </div>

              <div class="ms-auto d-flex gap-2">
                <button class="btn btn-outline-secondary" @click="closeHistorial" type="button">Cerrar</button>
              </div>
            </div>

            <div v-if="histErr" class="alert alert-danger">{{ histErr }}</div>

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width: 110px;">N°</th>
                    <th style="width: 140px;">Fecha</th>
                    <th>Empresa</th>
                    <th class="text-end" style="width: 160px;">Total</th>
                    <th class="text-end" style="width: 260px;">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="histLoading">
                    <td colspan="5" class="py-4 text-center text-muted">
                      <span class="spinner-border spinner-border-sm me-2"></span> Cargando cotizaciones…
                    </td>
                  </tr>

                  <tr v-for="c in historialFiltrado" :key="c.id">
                    <td>
                      <span class="badge text-bg-dark">#{{ String(c.numero || 0).padStart(3, "0") }}</span>
                    </td>
                    <td class="small">{{ fmtFechaLarga(c.fecha) }}</td>
                    <td class="fw-semibold">{{ c.clienteEmpresa || "—" }}</td>
                    <td class="text-end fw-bold">{{ fmtCLP(c.total || 0) }}</td>
                    <td class="text-end">
                      <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" @click="openActions(c)" type="button">
                          <i class="bi bi-sliders me-1"></i> Abrir
                        </button>
                        <button class="btn btn-sm btn-danger" @click="reDescargarCotizacion(c)" type="button">
                          <i class="bi bi-download me-1"></i> PDF
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!histLoading && !historialFiltrado.length">
                    <td colspan="5" class="py-4 text-center text-muted">No hay cotizaciones para mostrar.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="small text-muted mt-2">
              Tip: “Abrir” te deja editar dentro de un modal (guardar, eliminar y descargar PDF).
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeHistorial" type="button">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ACCIONES -->
    <div class="modal fade" tabindex="-1" ref="actModalEl" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-0">
                Cotización #{{ String(actNumero || 0).padStart(3, "0") }}
              </h5>
              <div class="text-muted small">
                Editar / Guardar / Eliminar / Descargar PDF
              </div>
            </div>
            <button type="button" class="btn-close" @click="closeActions"></button>
          </div>

          <div class="modal-body">
            <div v-if="actErr" class="alert alert-danger">{{ actErr }}</div>

            <div v-if="actLoading" class="py-4 text-center text-muted">
              <span class="spinner-border spinner-border-sm me-2"></span> Cargando…
            </div>

            <div v-else>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label fw-semibold">Fecha</label>
                  <input type="date" class="form-control" v-model="actForm.fecha" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label fw-semibold">Empresa (Cliente)</label>
                  <input class="form-control" v-model.trim="actForm.clienteEmpresa" />
                </div>
              </div>

              <hr class="my-4" />

              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0">Ítems</h6>
                <button class="btn btn-sm btn-outline-danger" @click="actAddItem" :disabled="actSaving" type="button">
                  <i class="bi bi-plus-circle me-1"></i> Agregar ítem
                </button>
              </div>

              <div class="table-responsive">
                <table class="table align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>Descripción</th>
                      <th class="text-end" style="width: 160px;">Valor Unit.</th>
                      <th class="text-end" style="width: 120px;">Cant.</th>
                      <th class="text-end" style="width: 140px;">Desc. %</th>
                      <th class="text-end" style="width: 1px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, idx) in actForm.items" :key="it.id">
                      <td>
                        <input class="form-control" v-model.trim="it.descripcion" />
                        <div v-if="actErrors[`item_desc_${idx}`]" class="text-danger small mt-1">
                          {{ actErrors[`item_desc_${idx}`] }}
                        </div>
                      </td>
                      <td class="text-end">
                        <input type="number" class="form-control text-end" v-model.number="it.valorUnitario" min="0" step="1" />
                      </td>
                      <td class="text-end">
                        <input type="number" class="form-control text-end" v-model.number="it.cantidad" min="0" step="1" />
                      </td>
                      <td class="text-end">
                        <input
                          type="number"
                          class="form-control text-end"
                          v-model.number="it.descuentoPct"
                          min="0"
                          max="100"
                          step="1"
                          @blur="it.descuentoPct = clampPercent(it.descuentoPct)"
                        />
                        <div class="small text-muted mt-1">Neto: <b>{{ fmtCLP(itemNeto(it)) }}</b></div>
                      </td>
                      <td class="text-end">
                        <button
                          class="btn btn-sm btn-outline-danger"
                          @click="actRemoveItem(idx)"
                          :disabled="actForm.items.length === 1 || actSaving"
                          type="button"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="actErrors._form" class="alert alert-danger mb-0">
                {{ actErrors._form }}
              </div>

              <hr class="my-4" />

              <h6 class="fw-bold mb-3">Condiciones</h6>
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Plazo de entrega</label>
                  <div class="input-group">
                    <input
                      type="number"
                      class="form-control text-end"
                      v-model.number="actForm.plazoEntregaDias"
                      min="1"
                      step="1"
                      @blur="actForm.plazoEntregaDias = sanitizePositiveInt(actForm.plazoEntregaDias, 2)"
                    />
                    <span class="input-group-text">días hábiles</span>
                  </div>
                  <div class="form-text">Se mostrará como: <b>{{ actPlazoEntregaStr }}</b></div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Validez</label>
                  <div class="input-group">
                    <input
                      type="number"
                      class="form-control text-end"
                      v-model.number="actForm.validezDias"
                      min="1"
                      step="1"
                      @blur="actForm.validezDias = sanitizePositiveInt(actForm.validezDias, 7)"
                    />
                    <span class="input-group-text">días</span>
                  </div>
                  <div class="form-text">Se mostrará como: <b>{{ actValidezStr }}</b></div>
                </div>

                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Condición de pago</label>
                  <select class="form-select" v-model="actForm.pagoTipo">
                    <option v-for="o in PAGO_OPTS" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </option>
                  </select>
                  <div class="form-text">Se mostrará como: <b>{{ actPagoStr }}</b></div>
                </div>
              </div>

              <hr class="my-4" />

              <h6 class="fw-bold mb-3">Firma (Cordialmente)</h6>
              <div class="row g-3">
                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Nombre</label>
                  <input class="form-control" v-model.trim="actFirma.nombre" />
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Teléfono</label>
                  <input
                    class="form-control"
                    v-model.trim="actFirma.telefono"
                    inputmode="tel"
                    @blur="actFirma.telefono = formatPhoneCL(actFirma.telefono)"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label fw-semibold">Mail</label>
                  <input class="form-control" v-model.trim="actFirma.email" inputmode="email" @blur="actFirma.email = normalizeEmail(actFirma.email)" />
                </div>
              </div>

              <hr class="my-4" />

              <div class="d-flex justify-content-end">
                <div style="min-width: 260px;" class="small">
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Neto</span>
                    <b>{{ fmtCLP(actTotalNeto) }}</b>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">IVA</span>
                    <b>{{ fmtCLP(actTotalIva) }}</b>
                  </div>
                  <div class="d-flex justify-content-between fs-6">
                    <span class="text-muted">Total</span>
                    <b>{{ fmtCLP(actTotalGeneral) }}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer d-flex justify-content-between">
            <button class="btn btn-outline-secondary" @click="backToHistorial" type="button">
              <i class="bi bi-arrow-left me-1"></i> Volver al historial
            </button>

            <div class="d-flex gap-2">
              <button class="btn btn-outline-danger" @click="openDeleteConfirm" :disabled="actSaving || actLoading" type="button">
                <i class="bi bi-trash me-1"></i> Eliminar
              </button>
              <button class="btn btn-danger" @click="actGuardarYDescargar" :disabled="actSaving || actLoading" type="button">
                <span v-if="actSaving" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-save2 me-1"></i> Guardar y PDF
              </button>

              <button class="btn btn-outline-danger" @click="actDescargarDesdeFirestore" :disabled="actSaving || actLoading" type="button">
                <i class="bi bi-download me-1"></i> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ELIMINAR -->
    <div class="modal fade" tabindex="-1" ref="delModalEl" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title mb-0">Confirmar eliminación</h5>
            <button type="button" class="btn-close" @click="closeDeleteConfirm"></button>
          </div>

          <div class="modal-body">
            <div v-if="delErr" class="alert alert-danger">{{ delErr }}</div>

            <p class="mb-2">
              ¿Seguro que deseas eliminar la cotización
              <b>#{{ String(delNumero || 0).padStart(3, "0") }}</b>?
            </p>
            <div class="text-muted small">
              Esta acción no se puede deshacer.
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeDeleteConfirm" :disabled="delBusy" type="button">
              Cancelar
            </button>

            <button class="btn btn-danger" @click="confirmDelete" :disabled="delBusy" type="button">
              <span v-if="delBusy" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-trash me-1"></i>
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { Modal } from "bootstrap";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logoUrl from "@/assets/Logo XT Servicios Transparente.png";
import { db, auth } from "../stores/firebase";
import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

const ivaRate = 0.19;

const emisor = {
  direccion: "El Nevado 1139, Lampa",
  rut: "76.655.406-7",
  razon: "XTREME SERVICIOS",
};

const PAGO_OPTS = [
  { value: "CREDITO", label: "Crédito" },
  { value: "DEBITO", label: "Débito" },
  { value: "A_CONVENIR", label: "A convenir" },
];

function pagoLabel(tipo) {
  return (PAGO_OPTS.find((x) => x.value === tipo) || PAGO_OPTS[2]).label;
}

function pluralDia(n) {
  return Number(n) === 1 ? "día" : "días";
}

function sanitizePositiveInt(val, fallback) {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function clampPercent(val) {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function parseFirstInt(text, fallback) {
  const m = String(text || "").match(/(\d+)/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parsePagoTipo(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("cr")) return "CREDITO";
  if (t.includes("dé") || t.includes("debi")) return "DEBITO";
  if (t.includes("a convenir")) return "A_CONVENIR";
  return "A_CONVENIR";
}

function normalizeEmail(v) {
  const s = String(v || "").trim();
  return s ? s.toLowerCase() : "";
}

function formatPhoneCL(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  let d = raw.replace(/\D/g, "");
  if (!d) return "";

  if (d.startsWith("56")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);

  if (d.length > 9) d = d.slice(d.length - 9);

  if (d.length === 9) {
    const a = d.slice(0, 1);
    const b = d.slice(1, 5);
    const c = d.slice(5, 9);
    return `+56 ${a} ${b} ${c}`;
  }

  if (d.length >= 8) return `+56 ${d}`;
  return raw;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

const makeItem = () => ({
  id: uid(),
  descripcion: "",
  valorUnitario: 0,
  cantidad: 0,
  descuentoPct: 0,
});

const LS_FIRMA_KEY = "xt_cotizacion_firma_v1";

const FIRMA_DEFAULTS = Object.freeze({
  firmaNombre: "Guillermo Manzor",
  firmaTelefono: "+56 9 5414 6017",
  firmaEmail: "gmanzor@xtrememining.cl",
});

function loadFirmaLocal() {
  try {
    const raw = localStorage.getItem(LS_FIRMA_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return {
      firmaNombre: String(obj.firmaNombre || "").trim(),
      firmaTelefono: String(obj.firmaTelefono || "").trim(),
      firmaEmail: String(obj.firmaEmail || "").trim(),
    };
  } catch (e) {
    console.warn("[firma] no se pudo leer localStorage", e);
    return null;
  }
}

function saveFirmaLocal(payload) {
  try {
    localStorage.setItem(
      LS_FIRMA_KEY,
      JSON.stringify({
        firmaNombre: String(payload.firmaNombre || "").trim(),
        firmaTelefono: String(payload.firmaTelefono || "").trim(),
        firmaEmail: String(payload.firmaEmail || "").trim(),
        updatedAt: Date.now(),
      })
    );
  } catch (e) {
    console.warn("[firma] no se pudo guardar localStorage", e);
  }
}

function clearFirmaLocal() {
  try {
    localStorage.removeItem(LS_FIRMA_KEY);
  } catch (e) {
    console.warn("[firma] no se pudo limpiar localStorage", e);
  }
  form.value.firmaNombre = FIRMA_DEFAULTS.firmaNombre;
  form.value.firmaTelefono = FIRMA_DEFAULTS.firmaTelefono;
  form.value.firmaEmail = FIRMA_DEFAULTS.firmaEmail;
}

function restoreFirmaDefaults() {
  form.value.firmaNombre = FIRMA_DEFAULTS.firmaNombre;
  form.value.firmaTelefono = FIRMA_DEFAULTS.firmaTelefono;
  form.value.firmaEmail = FIRMA_DEFAULTS.firmaEmail;
  saveFirmaLocal({
    firmaNombre: form.value.firmaNombre,
    firmaTelefono: form.value.firmaTelefono,
    firmaEmail: form.value.firmaEmail,
  });
}

const form = ref({
  fecha: todayISO(),
  clienteEmpresa: "Xtreme Mining",
  items: [makeItem()],
  plazoEntregaDias: 2,
  validezDias: 7,
  pagoTipo: "A_CONVENIR",
  firmaNombre: FIRMA_DEFAULTS.firmaNombre,
  firmaTelefono: FIRMA_DEFAULTS.firmaTelefono,
  firmaEmail: FIRMA_DEFAULTS.firmaEmail,
  web: "www.xtrememining.cl",
  telEmpresa: "+56 9 3430 3873",
});

const formPlazoEntregaStr = computed(() => {
  const n = sanitizePositiveInt(form.value.plazoEntregaDias, 2);
  return `${n} ${pluralDia(n)} hábiles`;
});
const formValidezStr = computed(() => {
  const n = sanitizePositiveInt(form.value.validezDias, 7);
  return `${n} ${pluralDia(n)}`;
});
const formPagoStr = computed(() => pagoLabel(form.value.pagoTipo));

const saving = ref(false);
const errors = ref({});

const isEditing = ref(false);
const editingId = ref(null);
const editingNumero = ref(null);

const histModalEl = ref(null);
const actModalEl = ref(null);
const delModalEl = ref(null);
let histModal = null;
let actModal = null;
let delModal = null;

onMounted(() => {
  if (histModalEl.value) {
    histModal = new Modal(histModalEl.value, { backdrop: true, keyboard: true, focus: true });
  }
  if (actModalEl.value) {
    actModal = new Modal(actModalEl.value, { backdrop: true, keyboard: true, focus: true });
  }
  if (delModalEl.value) {
    delModal = new Modal(delModalEl.value, { backdrop: "static", keyboard: true, focus: true });
  }
  const saved = loadFirmaLocal();
  if (saved) {
    if (saved.firmaNombre) form.value.firmaNombre = saved.firmaNombre;
    if (saved.firmaTelefono) form.value.firmaTelefono = saved.firmaTelefono;
    if (saved.firmaEmail) form.value.firmaEmail = saved.firmaEmail;
  }
});

watch(
  () => [form.value.firmaNombre, form.value.firmaTelefono, form.value.firmaEmail],
  () => {
    saveFirmaLocal({
      firmaNombre: form.value.firmaNombre,
      firmaTelefono: form.value.firmaTelefono,
      firmaEmail: form.value.firmaEmail,
    });
  }
);

onBeforeUnmount(() => {
  try { histModal?.dispose?.(); } catch(e) { console.log(e); }
  try { actModal?.dispose?.(); } catch(e) { console.log(e); }
  try { delModal?.dispose?.(); } catch(e) { console.log(e); }
});

const histLoading = ref(false);
const histErr = ref("");
const histSearch = ref("");
const histList = ref([]);

const histCount = computed(() => histList.value.length);

const historialFiltrado = computed(() => {
  const q = String(histSearch.value || "").toLowerCase().trim();
  if (!q) return histList.value;
  return histList.value.filter((c) => {
    const n = String(c.numero || "").includes(q);
    const emp = String(c.clienteEmpresa || "").toLowerCase().includes(q);
    const f = String(c.fecha || "").includes(q);
    return n || emp || f;
  });
});

function openHistorial() {
  histErr.value = "";
  histModal?.show();
  loadHistorial();
}
function closeHistorial() {
  histErr.value = "";
  histModal?.hide();
}

async function loadHistorial() {
  histLoading.value = true;
  histErr.value = "";
  try {
    const qy = query(collection(db, "cotizaciones"), orderBy("createdAt", "desc"), limit(80));
    const snap = await getDocs(qy);
    histList.value = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        numero: data.numero || 0,
        fecha: data.fecha || "",
        clienteEmpresa: data?.cliente?.empresa || data?.clienteEmpresa || "",
        total: data?.totales?.total ?? 0,
        raw: data,
      };
    });
  } catch (e) {
    console.error(e);
    histErr.value = "No se pudo cargar el historial. Revisa permisos/reglas y consola.";
  } finally {
    histLoading.value = false;
  }
}

function roundCLP(n) {
  return Math.round(Number(n || 0));
}
function fmtCLP(value) {
  const n = roundCLP(value);
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}
function fmtFechaLarga(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function itemBruto(it) {
  const unit = roundCLP(it.valorUnitario);
  const qty = roundCLP(it.cantidad);
  return roundCLP(unit * qty);
}
function itemDescuentoMonto(it) {
  const bruto = itemBruto(it);
  const pct = clampPercent(it.descuentoPct);
  return roundCLP((bruto * pct) / 100);
}
function itemNeto(it) {
  const bruto = itemBruto(it);
  const desc = itemDescuentoMonto(it);
  return roundCLP(bruto - desc);
}
function itemIva(it) {
  return roundCLP(itemNeto(it) * ivaRate);
}


const totalNeto = computed(() => form.value.items.reduce((acc, it) => acc + itemNeto(it), 0));
const totalIva = computed(() => form.value.items.reduce((acc, it) => acc + itemIva(it), 0));
const totalGeneral = computed(() => roundCLP(totalNeto.value + totalIva.value));

function addItem() {
  form.value.items.push(makeItem());
}
function removeItem(idx) {
  if (form.value.items.length <= 1) return;
  form.value.items.splice(idx, 1);
}

function resetForm() {
  errors.value = {};
  isEditing.value = false;
  editingId.value = null;
  editingNumero.value = null;
  const saved = loadFirmaLocal();

  form.value = {
    fecha: todayISO(),
    clienteEmpresa: "Xtreme Mining",
    items: [makeItem()],
    plazoEntregaDias: 2,
    validezDias: 7,
    pagoTipo: "A_CONVENIR",

    firmaNombre: saved?.firmaNombre || FIRMA_DEFAULTS.firmaNombre,
    firmaTelefono: saved?.firmaTelefono || FIRMA_DEFAULTS.firmaTelefono,
    firmaEmail: saved?.firmaEmail || FIRMA_DEFAULTS.firmaEmail,

    web: "www.xtrememining.cl",
    telEmpresa: "+56 9 3430 3873",
  };
}

function validate() {
  const e = {};
  if (!form.value.fecha) e._form = "Debes seleccionar una fecha.";
  if (!form.value.clienteEmpresa?.trim()) e._form = "Debes ingresar la empresa cliente.";

  const hasAtLeastOneValidItem = form.value.items.some(
    (it) => String(it.descripcion || "").trim() && roundCLP(it.valorUnitario) > 0 && roundCLP(it.cantidad) > 0
  );
  if (!hasAtLeastOneValidItem) e._form = "Debes ingresar al menos 1 ítem con descripción, valor unitario y cantidad mayor a 0.";

  form.value.items.forEach((it, idx) => {
    if (!String(it.descripcion || "").trim()) e[`item_desc_${idx}`] = "Ingresa descripción.";
    it.descuentoPct = clampPercent(it.descuentoPct);
  });

  errors.value = e;
  return Object.keys(e).length === 0;
}

async function getNextNumeroCotizacion() {
  const counterRef = doc(db, "counters", "cotizaciones");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    let n = 1;
    if (snap.exists()) n = Number((snap.data() || {}).next || 1);
    tx.set(counterRef, { next: n + 1 }, { merge: true });
    return n;
  });
}

function buildCondicionesFromForm(src) {
  const plazoDias = sanitizePositiveInt(src.plazoEntregaDias, 2);
  const valDias = sanitizePositiveInt(src.validezDias, 7);
  const pagoTipo = src.pagoTipo || "A_CONVENIR";
  return {
    plazoEntrega: `${plazoDias} ${pluralDia(plazoDias)} hábiles`,
    validez: `${valDias} ${pluralDia(valDias)}`,
    pago: pagoLabel(pagoTipo),

    plazoEntregaDias: plazoDias,
    validezDias: valDias,
    pagoTipo,
  };
}

async function guardarYGenerar() {
  if (saving.value) return;
  errors.value = {};
  if (!validate()) return;

  saving.value = true;
  try {
    form.value.firmaTelefono = formatPhoneCL(form.value.firmaTelefono);
    form.value.firmaEmail = normalizeEmail(form.value.firmaEmail);

    const itemsComputed = form.value.items
      .filter((it) => String(it.descripcion || "").trim())
      .map((it) => {
        const valorUnitario = roundCLP(it.valorUnitario);
        const cantidad = roundCLP(it.cantidad);
        const descuentoPct = clampPercent(it.descuentoPct);
        const bruto = roundCLP(valorUnitario * cantidad);
        const descuentoMonto = roundCLP((bruto * descuentoPct) / 100);
        const neto = roundCLP(bruto - descuentoMonto);
        const iva = roundCLP(neto * ivaRate);
        const total = roundCLP(neto + iva);

        return {
          descripcion: String(it.descripcion || "").trim(),
          valorUnitario,
          cantidad,
          descuentoPct,
          bruto,
          descuentoMonto,
          neto,
          iva,
          total,
        };
      });

    const user = auth?.currentUser || null;
    const condiciones = buildCondicionesFromForm(form.value);

    if (isEditing.value && editingId.value) {
      const payloadUpdate = {
        fecha: form.value.fecha,
        emisor: { ...emisor },
        cliente: { empresa: form.value.clienteEmpresa.trim() },
        condiciones,
        contacto: {
          web: form.value.web.trim(),
          telEmpresa: form.value.telEmpresa.trim(),
        },
        firma: {
          nombre: form.value.firmaNombre.trim(),
          telefono: form.value.firmaTelefono.trim(),
          email: form.value.firmaEmail.trim(),
        },
        ivaRate,
        items: itemsComputed,
        totales: {
          neto: totalNeto.value,
          iva: totalIva.value,
          total: totalGeneral.value,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user ? { uid: user.uid, email: user.email || null } : null,
      };

      await updateDoc(doc(db, "cotizaciones", editingId.value), payloadUpdate);

      const dataForPdf = {
        tipo: "cotizacion",
        numero: editingNumero.value,
        fecha: form.value.fecha,
        emisor: { ...emisor },
        cliente: { empresa: form.value.clienteEmpresa.trim() },
        condiciones,
        contacto: { ...payloadUpdate.contacto },
        firma: { ...payloadUpdate.firma },
        ivaRate,
        items: itemsComputed,
        totales: { neto: totalNeto.value, iva: totalIva.value, total: totalGeneral.value },
      };

      const pdfBytes = await buildPdf(dataForPdf);
      downloadPdf(pdfBytes, `Cotizacion-${String(editingNumero.value).padStart(3, "0")}.pdf`);
      await loadHistorial();
      return;
    }

    const numero = await getNextNumeroCotizacion();

    const payload = {
      tipo: "cotizacion",
      numero,
      fecha: form.value.fecha,
      emisor: { ...emisor },
      cliente: { empresa: form.value.clienteEmpresa.trim() },
      condiciones,
      contacto: {
        web: form.value.web.trim(),
        telEmpresa: form.value.telEmpresa.trim(),
      },
      firma: {
        nombre: form.value.firmaNombre.trim(),
        telefono: form.value.firmaTelefono.trim(),
        email: form.value.firmaEmail.trim(),
      },
      ivaRate,
      items: itemsComputed,
      totales: { neto: totalNeto.value, iva: totalIva.value, total: totalGeneral.value },
      createdAt: serverTimestamp(),
      createdBy: user ? { uid: user.uid, email: user.email || null } : null,
    };

    await addDoc(collection(db, "cotizaciones"), payload);

    const pdfBytes = await buildPdf(payload);
    downloadPdf(pdfBytes, `Cotizacion-${String(numero).padStart(3, "0")}.pdf`);

    await loadHistorial();
  } catch (err) {
    console.error(err);
    errors.value = { _form: "Ocurrió un error al guardar/actualizar o generar PDF. Revisa la consola." };
  } finally {
    saving.value = false;
  }
}

const actId = ref(null);
const actNumero = ref(0);
const actLoading = ref(false);
const actSaving = ref(false);
const actErr = ref("");
const actErrors = ref({});


const actFirma = ref({ nombre: "", telefono: "", email: "" });
const actContacto = ref({ web: "", telEmpresa: "" });

const actForm = ref({
  fecha: todayISO(),
  clienteEmpresa: "",
  items: [makeItem()],
  plazoEntregaDias: 2,
  validezDias: 7,
  pagoTipo: "A_CONVENIR",
});

const actPlazoEntregaStr = computed(() => {
  const n = sanitizePositiveInt(actForm.value.plazoEntregaDias, 2);
  return `${n} ${pluralDia(n)} hábiles`;
});
const actValidezStr = computed(() => {
  const n = sanitizePositiveInt(actForm.value.validezDias, 7);
  return `${n} ${pluralDia(n)}`;
});
const actPagoStr = computed(() => pagoLabel(actForm.value.pagoTipo));

const actTotalNeto = computed(() => actForm.value.items.reduce((acc, it) => acc + itemNeto(it), 0));
const actTotalIva = computed(() => actForm.value.items.reduce((acc, it) => acc + itemIva(it), 0));
const actTotalGeneral = computed(() => roundCLP(actTotalNeto.value + actTotalIva.value));

function actAddItem() {
  actForm.value.items.push(makeItem());
}
function actRemoveItem(idx) {
  if (actForm.value.items.length <= 1) return;
  actForm.value.items.splice(idx, 1);
}

function actValidate() {
  const e = {};
  if (!actForm.value.fecha) e._form = "Debes seleccionar una fecha.";
  if (!actForm.value.clienteEmpresa?.trim()) e._form = "Debes ingresar la empresa cliente.";

  const hasAtLeastOneValidItem = actForm.value.items.some(
    (it) => String(it.descripcion || "").trim() && roundCLP(it.valorUnitario) > 0 && roundCLP(it.cantidad) > 0
  );
  if (!hasAtLeastOneValidItem) e._form = "Debes ingresar al menos 1 ítem válido (desc + valor + cantidad > 0).";

  actForm.value.items.forEach((it, idx) => {
    if (!String(it.descripcion || "").trim()) e[`item_desc_${idx}`] = "Ingresa descripción.";
    it.descuentoPct = clampPercent(it.descuentoPct);
  });

  actErrors.value = e;
  return Object.keys(e).length === 0;
}

async function openActions(c) {
  actErr.value = "";
  actErrors.value = {};
  actLoading.value = true;

  try {
    const snap = await getDoc(doc(db, "cotizaciones", c.id));
    if (!snap.exists()) throw new Error("No existe");

    const data = snap.data() || {};

    actId.value = c.id;
    actNumero.value = Number(data.numero || c.numero || 0);

    actForm.value.fecha = data.fecha || todayISO();
    actForm.value.clienteEmpresa = data?.cliente?.empresa || data?.clienteEmpresa || "";

    const items = Array.isArray(data.items) ? data.items : [];
    actForm.value.items = items.length
      ? items.map((it) => ({
          id: uid(),
          descripcion: it.descripcion || "",
          valorUnitario: Number(it.valorUnitario || 0),
          cantidad: Number(it.cantidad || 0),
          descuentoPct: clampPercent(it.descuentoPct ?? it.descuento ?? 0),
        }))
      : [makeItem()];

    const cond = data.condiciones || {};
    actForm.value.plazoEntregaDias =
      Number(cond.plazoEntregaDias) > 0 ? Number(cond.plazoEntregaDias) : parseFirstInt(cond.plazoEntrega, 2);
    actForm.value.validezDias =
      Number(cond.validezDias) > 0 ? Number(cond.validezDias) : parseFirstInt(cond.validez, 7);
    actForm.value.pagoTipo = cond.pagoTipo || parsePagoTipo(cond.pago);

    actFirma.value = {
      nombre: data?.firma?.nombre || "",
      telefono: data?.firma?.telefono || "",
      email: data?.firma?.email || "",
    };
    actContacto.value = {
      web: data?.contacto?.web || "www.xtrememining.cl",
      telEmpresa: data?.contacto?.telEmpresa || "+56 9 3430 3873",
    };

    histModal?.hide();
    actModal?.show();
  } catch (e) {
    console.error(e);
    actErr.value = "No se pudo abrir la cotización. Revisa consola/permisos.";
  } finally {
    actLoading.value = false;
  }
}

function closeActions() {
  actModal?.hide();
}

function backToHistorial() {
  actModal?.hide();
  histModal?.show();
}

async function actGuardarYDescargar() {
  if (actSaving.value || actLoading.value) return;
  actErr.value = "";
  actErrors.value = {};
  if (!actValidate()) return;

  actSaving.value = true;
  try {
    actFirma.value.telefono = formatPhoneCL(actFirma.value.telefono);
    actFirma.value.email = normalizeEmail(actFirma.value.email);

    const itemsComputed = actForm.value.items
      .filter((it) => String(it.descripcion || "").trim())
      .map((it) => {
        const valorUnitario = roundCLP(it.valorUnitario);
        const cantidad = roundCLP(it.cantidad);
        const descuentoPct = clampPercent(it.descuentoPct);
        const bruto = roundCLP(valorUnitario * cantidad);
        const descuentoMonto = roundCLP((bruto * descuentoPct) / 100);
        const neto = roundCLP(bruto - descuentoMonto);
        const iva = roundCLP(neto * ivaRate);
        const total = roundCLP(neto + iva);

        return {
          descripcion: String(it.descripcion || "").trim(),
          valorUnitario,
          cantidad,
          descuentoPct,
          bruto,
          descuentoMonto,
          neto,
          iva,
          total,
        };
      });

    const user = auth?.currentUser || null;
    const condiciones = buildCondicionesFromForm(actForm.value);

    const payloadUpdate = {
      fecha: actForm.value.fecha,
      cliente: { empresa: actForm.value.clienteEmpresa.trim() },
      condiciones,
      firma: {
        nombre: String(actFirma.value.nombre || "").trim(),
        telefono: String(actFirma.value.telefono || "").trim(),
        email: String(actFirma.value.email || "").trim(),
      },
      contacto: { ...actContacto.value },
      ivaRate,
      items: itemsComputed,
      totales: {
        neto: actTotalNeto.value,
        iva: actTotalIva.value,
        total: actTotalGeneral.value,
      },
      updatedAt: serverTimestamp(),
      updatedBy: user ? { uid: user.uid, email: user.email || null } : null,
    };

    await updateDoc(doc(db, "cotizaciones", actId.value), payloadUpdate);

    const dataForPdf = {
      tipo: "cotizacion",
      numero: actNumero.value,
      fecha: actForm.value.fecha,
      emisor: { ...emisor },
      cliente: { empresa: actForm.value.clienteEmpresa.trim() },
      condiciones,
      contacto: { ...actContacto.value },
      firma: { ...payloadUpdate.firma },
      ivaRate,
      items: itemsComputed,
      totales: { neto: actTotalNeto.value, iva: actTotalIva.value, total: actTotalGeneral.value },
    };

    const pdfBytes = await buildPdf(dataForPdf);
    downloadPdf(pdfBytes, `Cotizacion-${String(actNumero.value).padStart(3, "0")}.pdf`);

    await loadHistorial();
    actModal?.hide();
    histModal?.show();
  } catch (e) {
    console.error(e);
    actErr.value = "No se pudo guardar. Revisa permisos/reglas y consola.";
  } finally {
    actSaving.value = false;
  }
}

const delId = ref(null);
const delNumero = ref(0);
const delBusy = ref(false);
const delErr = ref("");

function openDeleteConfirm() {
  if (!actId.value) return;

  delErr.value = "";
  delBusy.value = false;

  delId.value = actId.value;
  delNumero.value = actNumero.value;

  actModal?.hide();
  delModal?.show();
}

function closeDeleteConfirm() {
  delErr.value = "";
  delModal?.hide();

  actModal?.show();
}

async function confirmDelete() {
  if (!delId.value || delBusy.value) return;

  delBusy.value = true;
  delErr.value = "";
  try {
    await deleteDoc(doc(db, "cotizaciones", delId.value));
    if (isEditing.value && editingId.value === delId.value) resetForm();

    await loadHistorial();
    delModal?.hide();
    histModal?.show();
  } catch (e) {
    console.error(e);
    delErr.value = "No se pudo eliminar. Revisa permisos/reglas y consola.";
  } finally {
    delBusy.value = false;
  }
}

async function actDescargarDesdeFirestore() {
  if (!actId.value) return;
  try {
    const snap = await getDoc(doc(db, "cotizaciones", actId.value));
    if (!snap.exists()) {
      alert("No se encontró la cotización.");
      return;
    }
    const data = snap.data() || {};
    const pdfBytes = await buildPdf(data);
    downloadPdf(pdfBytes, `Cotizacion-${String(data.numero || actNumero.value || 0).padStart(3, "0")}.pdf`);
  } catch (e) {
    console.error(e);
    alert("No se pudo generar el PDF. Revisa consola.");
  }
}

async function reDescargarCotizacion(c) {
  try {
    const snap = await getDoc(doc(db, "cotizaciones", c.id));
    if (!snap.exists()) {
      alert("No se encontró la cotización.");
      return;
    }
    const data = snap.data() || {};
    const pdfBytes = await buildPdf(data);
    downloadPdf(pdfBytes, `Cotizacion-${String(data.numero || c.numero || 0).padStart(3, "0")}.pdf`);
  } catch (e) {
    console.error(e);
    alert("No se pudo generar el PDF. Revisa consola.");
  }
}

function wrapTextByWidth(text, font, fontSize, maxWidth, maxLines = 2) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const wpx = font.widthOfTextAtSize(test, fontSize);
    if (wpx <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);

  const joined = lines.join(" ");
  if (joined.length < String(text || "").length && lines.length) {
    const last = lines.length - 1;
    const s = lines[last];
    lines[last] = s.length > 1 ? s.slice(0, Math.max(1, s.length - 1)) + "…" : "…";
  }
  return lines;
}

function ensureCondStrings(cond = {}) {
  const plazo = cond.plazoEntrega || (cond.plazoEntregaDias ? `${cond.plazoEntregaDias} ${pluralDia(cond.plazoEntregaDias)} hábiles` : "");
  const validez = cond.validez || (cond.validezDias ? `${cond.validezDias} ${pluralDia(cond.validezDias)}` : "");
  const pago = cond.pago || (cond.pagoTipo ? pagoLabel(cond.pagoTipo) : "");
  return { plazo, validez, pago };
}

async function buildPdf(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const redBar = rgb(0.78, 0.0, 0.0);
  const gray = rgb(0.40, 0.40, 0.40);
  const lineGray = rgb(0.82, 0.82, 0.82);
  const black = rgb(0, 0, 0);
  const borderPlomo = rgb(0.55, 0.55, 0.55);

  const M = 34;
  const innerW = width - M * 2;

  const drawCentered = (txt, y, size, isBold = false, color = gray) => {
    const f = isBold ? fontBold : font;
    const s = String(txt ?? "");
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: width / 2 - w / 2, y, size, font: f, color });
  };

  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderColor: borderPlomo,
    borderWidth: 1.4,
  });

  const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
  const logoPng = await pdfDoc.embedPng(logoBytes);
  const logoW = 200;
  const logoH = (logoPng.height / logoPng.width) * logoW;

  let y = height - M;
  page.drawImage(logoPng, { x: M, y: y - logoH, width: logoW, height: logoH });

  const barH = 28;
  const barW = 250;
  const barX = width - M - barW;
  const barY = y - 8 - barH;

  page.drawRectangle({ x: barX, y: barY, width: barW, height: barH, color: redBar });

  const title = "COTIZACIÓN";
  const titleSize = 16;
  page.drawText(title, {
    x: barX + (barW - fontBold.widthOfTextAtSize(title, titleSize)) / 2,
    y: barY + 7,
    size: titleSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const numStr = String(data.numero || 0).padStart(3, "0");
  page.drawText(fmtFechaLarga(data.fecha), { x: barX, y: barY - 14, size: 9.5, font, color: gray });
  page.drawText(`N° ${numStr}`, {
    x: barX + barW - fontBold.widthOfTextAtSize(`N° ${numStr}`, 9.5),
    y: barY - 14,
    size: 9.5,
    font: fontBold,
    color: gray,
  });

  y = y - Math.max(logoH, 60) - 18;
  page.drawText((data.emisor?.razon || emisor.razon).toUpperCase(), { x: M, y, size: 10.5, font: fontBold, color: black });
  page.drawText(data.emisor?.direccion || emisor.direccion, { x: M, y: y - 14, size: 9.5, font, color: gray });
  page.drawText(`RUT: ${data.emisor?.rut || emisor.rut}`, { x: M, y: y - 28, size: 9.5, font, color: gray });

  y -= 54;

  page.drawText(`Empresa: ${data?.cliente?.empresa || "—"}`, { x: M, y, size: 10, font, color: gray });
  y -= 16;

  const introText =
    "En atención a su gentil solicitud de cotización, tenemos el agrado de hacer llegar a usted nuestra propuesta:";
  const introLines = wrapTextByWidth(introText, font, 9.5, innerW - 10, 3);
  for (const ln of introLines) {
    page.drawText(ln, { x: M, y, size: 9.5, font, color: gray });
    y -= 12;
  }
  y -= 6;

  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: lineGray });
  y -= 18;

  const tableX = M;
  const tableW = innerW;

  // ✅ columnas con DTO%
  const colDesc = Math.floor(tableW * 0.50);
  const colQty  = Math.floor(tableW * 0.10);
  const colUnit = Math.floor(tableW * 0.16);
  const colDto  = Math.floor(tableW * 0.08);

  const spaced = (s) => s.split("").join(" ");
  const headSize = 9.2;
  const rowSize = 9.5;

  page.drawText(spaced("ITEMS"), { x: tableX, y, size: headSize, font: fontBold, color: gray });
  page.drawText(spaced("CANT."), {
    x: tableX + colDesc + colQty - fontBold.widthOfTextAtSize(spaced("CANT."), headSize),
    y,
    size: headSize,
    font: fontBold,
    color: gray,
  });
  page.drawText(spaced("PRECIO"), {
    x: tableX + colDesc + colQty + colUnit - fontBold.widthOfTextAtSize(spaced("PRECIO"), headSize),
    y,
    size: headSize,
    font: fontBold,
    color: gray,
  });
  page.drawText(spaced("DTO%"), {
    x: tableX + colDesc + colQty + colUnit + colDto - fontBold.widthOfTextAtSize(spaced("DTO%"), headSize),
    y,
    size: headSize,
    font: fontBold,
    color: gray,
  });
  page.drawText(spaced("SUBTOTAL"), {
    x: tableX + tableW - fontBold.widthOfTextAtSize(spaced("SUBTOTAL"), headSize),
    y,
    size: headSize,
    font: fontBold,
    color: gray,
  });

  y -= 10;
  page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 1.2, color: rgb(0.35, 0.35, 0.35) });
  y -= 10;

  const items = Array.isArray(data.items) ? data.items : [];
  for (const it of items) {
    const descLines = wrapTextByWidth(it.descripcion, font, rowSize, colDesc - 6, 2);
    const rowH = 18 + (descLines.length - 1) * 12;

    page.drawText(descLines[0] || "", { x: tableX, y, size: rowSize, font, color: black });
    if (descLines[1]) page.drawText(descLines[1], { x: tableX, y: y - 12, size: rowSize, font, color: black });

    const midY = y - (descLines.length === 2 ? 6 : 0);

    const qtyStr = String(it.cantidad || 0);
    const unitStr = fmtCLP(it.valorUnitario || 0);
    const dtoStr = `${clampPercent(it.descuentoPct ?? 0)}%`;
    const subStr = fmtCLP(it.neto || 0);

    page.drawText(qtyStr, {
      x: tableX + colDesc + colQty - font.widthOfTextAtSize(qtyStr, rowSize),
      y: midY,
      size: rowSize,
      font,
      color: black
    });

    page.drawText(unitStr, {
      x: tableX + colDesc + colQty + colUnit - font.widthOfTextAtSize(unitStr, rowSize),
      y: midY,
      size: rowSize,
      font,
      color: black
    });

    page.drawText(dtoStr, {
      x: tableX + colDesc + colQty + colUnit + colDto - font.widthOfTextAtSize(dtoStr, rowSize),
      y: midY,
      size: rowSize,
      font,
      color: black
    });

    page.drawText(subStr, {
      x: tableX + tableW - font.widthOfTextAtSize(subStr, rowSize),
      y: midY,
      size: rowSize,
      font,
      color: black
    });

    y -= rowH;
  }

  y -= 6;
  page.drawLine({ start: { x: tableX, y }, end: { x: tableX + tableW, y }, thickness: 1.2, color: rgb(0.35, 0.35, 0.35) });

  const footerH = 26;
  const footerY = 28;

  const sigBaseY = footerY + footerH + 22;
  const condTopY = sigBaseY + 62;

  page.drawLine({ start: { x: M, y: condTopY + 34 }, end: { x: width - M, y: condTopY + 34 }, thickness: 1, color: lineGray });

  const totalsX = M + innerW - 210;

  const condStr = ensureCondStrings(data?.condiciones || {});
  page.drawText(`Plazo de entrega: ${condStr.plazo || ""}`, { x: M, y: condTopY + 18, size: 10, font, color: gray });
  page.drawText(`Validez: ${condStr.validez || ""}`, { x: M, y: condTopY + 4, size: 10, font, color: gray });
  page.drawText(`Condición de pago: ${condStr.pago || ""}`, { x: M, y: condTopY - 10, size: 10, font, color: gray });

  const v1 = fmtCLP(data?.totales?.neto || 0);
  const v2 = fmtCLP(data?.totales?.iva || 0);
  const v3 = fmtCLP(data?.totales?.total || 0);

  page.drawText("TOTAL:", { x: totalsX, y: condTopY + 18, size: 10.5, font: fontBold, color: gray });
  page.drawText(v1, { x: M + innerW - font.widthOfTextAtSize(v1, 10.5), y: condTopY + 18, size: 10.5, font, color: gray });

  page.drawText("IMPUESTOS:", { x: totalsX, y: condTopY + 4, size: 10.5, font: fontBold, color: gray });
  page.drawText(v2, { x: M + innerW - font.widthOfTextAtSize(v2, 10.5), y: condTopY + 4, size: 10.5, font, color: gray });

  page.drawText("A PAGAR:", { x: totalsX, y: condTopY - 12, size: 11.5, font: fontBold, color: black });
  page.drawText(v3, { x: M + innerW - fontBold.widthOfTextAtSize(v3, 11.5), y: condTopY - 12, size: 11.5, font: fontBold, color: black });

  const firmaNombre = data?.firma?.nombre || "";
  const firmaTel = data?.firma?.telefono || "";
  const firmaMail = data?.firma?.email || "";

  if (firmaNombre) drawCentered(`Cordialmente, ${firmaNombre}`, sigBaseY + 18, 10.5, true, black);
  if (firmaTel) drawCentered(`Teléfono: ${firmaTel}`, sigBaseY + 4, 9.8, false, black);
  if (firmaMail) drawCentered(`Mail: ${firmaMail}`, sigBaseY - 10, 9.8, false, black);

  page.drawRectangle({ x: M, y: footerY, width: innerW, height: footerH, color: redBar });

  const web = data?.contacto?.web || "www.xtrememining.cl";
  const tel = data?.contacto?.telEmpresa || "+56 9 3430 3873";

  const footerTextSize = 9.5;
  const textY = footerY + 8;

  const sep = "|";
  const totalFooterW =
    font.widthOfTextAtSize(web, footerTextSize) +
    font.widthOfTextAtSize("   " + sep + "   ", footerTextSize) +
    font.widthOfTextAtSize(tel, footerTextSize);

  let fx = M + (innerW - totalFooterW) / 2;

  page.drawText(web, { x: fx, y: textY, size: footerTextSize, font, color: rgb(1, 1, 1) });
  fx += font.widthOfTextAtSize(web, footerTextSize);

  page.drawText(`   ${sep}   `, { x: fx, y: textY, size: footerTextSize, font: fontBold, color: rgb(1, 1, 1) });
  fx += font.widthOfTextAtSize(`   ${sep}   `, footerTextSize);

  page.drawText(tel, { x: fx, y: textY, size: footerTextSize, font, color: rgb(1, 1, 1) });

  return await pdfDoc.save();
}

function downloadPdf(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.card { border-radius: 1rem; }
.table > :not(caption) > * > * { vertical-align: middle; }

.table-center{ max-width: 980px; margin: 0 auto; }
.table-fixed{ width: 100%; }

.preview-paper{
  height: 520px;
  overflow: hidden;
  border: 2px solid #2f2f2f;
  border-radius: 12px;
}

.preview-logo{
  width: 90px;
  height: auto;
  object-fit: contain;
  opacity: .95;
}

.preview-title-bar{
  width: 220px;
  height: 28px;
  background: rgba(200, 0, 0, .75);
  border-radius: 10px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.preview-title{
  color: #fff;
  font-weight: 800;
  letter-spacing: .08em;
}

.preview-box-title{
  font-weight: 800;
  letter-spacing: .04em;
}
.preview-box-muted{
  color: #777;
  font-size: 11px;
}

.preview-sep{ height: 1px; background: #e6e6e6; }

.preview-intro{
  margin-top: 10px;
  margin-bottom: 10px;
  color:#333;
}
.preview-intro .t2{
  font-size: 12px;
  color:#555;
  margin-bottom: 6px;
}
.preview-intro .t3{
  font-size: 12px;
  color:#666;
  line-height: 1.25;
}

.preview-table .preview-head,
.preview-table .preview-row{
  display:flex;
  gap: 10px;
}
.c-desc{ width: 44%; }
.c-qty{ width: 10%; }
.c-unit{ width: 18%; }
.c-dto{ width: 10%; }
.c-sub{ width: 18%; }

.preview-head{
  color: #666;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .12em;
  padding-bottom: 8px;
  border-bottom: 2px solid #444;
}
.preview-row{
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.preview-totals{
  min-width: 210px;
  font-size: 12px;
  color: #666;
}

.preview-footer{
  height: 28px;
  border-radius: 10px;
  background: rgba(200, 0, 0, .65);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 12px;
  font-size: 12px;
}
.preview-footer .sep{
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,.7);
}
</style>
