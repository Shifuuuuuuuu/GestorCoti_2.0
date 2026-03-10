<!-- src/views/GenerarCertificados.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-4 py-lg-5">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div>
        <h1 class="h4 fw-semibold mb-1">Generador de Certificados</h1>
        <div class="text-muted small">
          Mantención / Operatividad / Torque / Citación · Vista previa · Guarda en Firestore + PDF
        </div>

        <div v-if="isEditing" class="mt-2">
          <span class="badge text-bg-warning text-dark border">
            Editando Certificado N° {{ String(editingNumero || "—") }}
          </span>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-dark" @click="openHistorial">
          <i class="bi bi-clock-history me-1"></i> Historial
        </button>

        <button class="btn btn-outline-secondary" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Limpiar
        </button>

        <button class="btn btn-primary" :disabled="!canSave || saving" @click="guardarCertificado">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-save2 me-1"></i>
          {{ isEditing ? "Actualizar + PDF" : "Guardar + PDF" }}
        </button>

        <button class="btn btn-outline-dark" :disabled="!hasPreview" @click="generarPdfSolo">
          <i class="bi bi-filetype-pdf me-1"></i> PDF (sin guardar)
        </button>
      </div>
    </div>

    <div class="row g-3">

      <div class="col-12 col-lg-5 no-print">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="fw-semibold">Formulario</div>
              <span class="badge text-bg-light border">{{ tipoLabelForm }}</span>
            </div>

            <hr class="my-3" />

            <div class="row g-2">
              <div class="col-12">
                <label class="form-label">Tipo de certificado</label>
                <select v-model="form.tipo" class="form-select" @change="onTipoChange">
                  <option value="MANTENCION">MANTENCIÓN</option>
                  <option value="OPERATIVIDAD">OPERATIVIDAD</option>
                  <option value="TORQUE">TORQUE</option>
                  <option value="CITACION_PREVENTIVO">CITACIÓN MANT. PREVENTIVO</option>
                </select>
              </div>

              <div class="col-12" v-if="form.tipo !== 'CITACION_PREVENTIVO'">
                <label class="form-label">Unidad de lectura</label>
                <select v-model="form.unidadLectura" class="form-select">
                  <option value="Km">Km</option>
                  <option value="Hrs">Hrs</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label d-flex align-items-center justify-content-between">
                  <span>N° Certificado</span>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    @click="cargarProximoNumero"
                    :disabled="loadingCounter || isEditing"
                    title="Actualizar número desde Firestore"
                  >
                    <span v-if="loadingCounter" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-arrow-clockwise me-1"></i>
                    Actualizar N°
                  </button>
                </label>

                <input class="form-control" :value="displayNumero" disabled />
                <div class="form-text" v-if="isEditing">Estás editando: se mantiene el número del certificado.</div>
                <div class="form-text" v-else-if="form.tipo === 'TORQUE'">
                  Contador TORQUE independiente (inicia en <b>192</b> si no existe).
                </div>
              </div>
            </div>

            <hr class="my-3" />

            <div class="mb-2">
              <label class="form-label">Buscar equipo</label>
              <input
                v-model.trim="equipoSearch"
                class="form-control"
                placeholder="Buscar por código (patente), marca, modelo, chasis…"
              />
              <div class="form-text">Cargando últimos <b>{{ equiposCache.length }}</b></div>
            </div>

            <div class="list-group mb-3" style="max-height: 240px; overflow:auto;">
              <button
                v-for="e in equiposFiltrados"
                :key="e.id"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                :class="{ active: selectedEquipo?.id === e.id }"
                type="button"
                @click="seleccionarEquipo(e)"
              >
                <div class="me-2">
                  <div class="fw-semibold">
                    {{ e.codigo || extraerCodigoDesdeString(e.equipo) || "SIN CÓDIGO" }}
                    <span class="opacity-75">·</span>
                    {{ e.marca || "SIN MARCA" }}
                  </div>
                  <div class="small opacity-75 text-truncate" style="max-width: 360px;">
                    {{ e.equipo || e.modelo || e.tipo_equipo || "—" }}
                  </div>
                </div>
                <span class="badge text-bg-light border">{{ e.tipo_equipo || "—" }}</span>
              </button>

              <div v-if="equiposCache.length && !equiposFiltrados.length" class="list-group-item text-muted small">
                No hay coincidencias con “{{ equipoSearch }}”.
              </div>

              <div v-if="loadingEquipos" class="list-group-item">
                <span class="spinner-border spinner-border-sm me-2"></span> Cargando equipos…
              </div>
            </div>

            <div v-if="selectedEquipo" class="alert alert-light border small mb-3">
              <div class="fw-semibold">Equipo seleccionado</div>
              <div class="text-muted">
                <b>{{ form.patente }}</b> · Interno: <b>{{ form.numeroInterno || "—" }}</b>
              </div>
              <div class="text-muted mt-1">{{ form.marca || "—" }} · {{ form.modelo || "—" }}</div>
            </div>

            <hr class="my-3" />

            <div v-if="form.tipo === 'MANTENCION'">
              <div class="d-flex align-items-center justify-content-between">
                <div class="fw-semibold">Datos Mantención</div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="nuevo" v-model="form.equipoNuevo" />
                  <label class="form-check-label small" for="nuevo">Equipo nuevo</label>
                </div>
              </div>

              <div class="row g-2 mt-1">
                <div class="col-6">
                  <label class="form-label">Última OT preventiva</label>
                  <input v-model.trim="form.ultimaOt" class="form-control" placeholder="56095" :disabled="form.equipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Fecha última OT</label>
                  <input v-model="form.fechaUltimaOt" type="date" class="form-control" :disabled="form.equipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Lectura OT ({{ unidad }})</label>
                  <input v-model="form.kmOtRaw" class="form-control" placeholder="132309" @input="recalcMantencion" :disabled="form.equipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Lectura actual ({{ unidad }})</label>
                  <input v-model="form.kmActualRaw" class="form-control" placeholder="135671" @input="recalcMantencion" />
                </div>

                <div class="col-6">
                  <label class="form-label">Intervalo preventiva ({{ unidad }})</label>
                  <input
                    v-model="form.intervaloRaw"
                    class="form-control"
                    :placeholder="preventivoDetectado ? String(preventivoDetectado.intervalo) : '10000'"
                    @input="recalcMantencion"
                  />
                </div>

                <div class="col-6">
                  <label class="form-label">Próxima Mantención ({{ unidad }})</label>
                  <input v-model="form.proximaMantencionRaw" class="form-control" placeholder="142309" />
                  <div class="form-text">Auto: lectura OT + intervalo (puedes editar).</div>
                </div>
              </div>
            </div>

            <div v-else-if="form.tipo === 'TORQUE'">
              <div class="d-flex align-items-center justify-content-between">
                <div class="fw-semibold">Datos Torque</div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="nuevoTorque" v-model="form.torqueEquipoNuevo" @change="onTorqueNuevoChange" />
                  <label class="form-check-label small" for="nuevoTorque">Equipo nuevo (sin torque aún)</label>
                </div>
              </div>

              <div class="row g-2 mt-1">
                <div class="col-6">
                  <label class="form-label">Última OT (torque)</label>
                  <input v-model.trim="form.ultimaOtTorque" class="form-control" placeholder="53868" :disabled="form.torqueEquipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Fecha última OT (torque)</label>
                  <input v-model="form.fechaUltimaOtTorque" type="date" class="form-control" @input="recalcTorque" :disabled="form.torqueEquipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Lectura en OT ({{ unidad }})</label>
                  <input v-model="form.lecturaOtTorqueRaw" class="form-control" placeholder="14171" :disabled="form.torqueEquipoNuevo" />
                </div>

                <div class="col-6">
                  <label class="form-label">Lectura actual ({{ unidad }})</label>
                  <input v-model="form.kmActualRaw" class="form-control" placeholder="14171" />
                </div>

                <div class="col-12">
                  <label class="form-label">Próximo Torque (fecha)</label>
                  <input v-model="form.proximoTorqueFecha" type="date" class="form-control" />
                </div>
              </div>
            </div>

            <div v-else-if="form.tipo === 'CITACION_PREVENTIVO'">
              <div class="fw-semibold">Citación a Mantención Preventivo</div>

              <div class="row g-2 mt-2">
                <div class="col-12">
                  <label class="form-label">Servicio</label>
                  <input v-model.trim="form.citServicio" class="form-control" placeholder="Reparación / Mantención preventiva" />
                </div>
                <div class="col-6">
                  <label class="form-label">Unidad de lectura</label>
                  <select v-model="form.citUnidadLectura" class="form-select">
                    <option value="Km">Km</option>
                    <option value="Hrs">Hrs</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label">Lectura ({{ form.citUnidadLectura }})</label>
                  <input
                    v-model.trim="form.citLecturaRaw"
                    class="form-control"
                    placeholder="Ej: 132309"
                  />
                </div>
                <div class="col-6">
                  <label class="form-label">Fecha de citación</label>
                  <input v-model="form.citFechaCitacion" type="date" class="form-control" />
                </div>

                <div class="col-6">
                  <label class="form-label">Fecha de atención</label>
                  <input v-model="form.citFechaAtencion" type="date" class="form-control" />
                </div>

                <div class="col-6">
                  <label class="form-label">Hora</label>
                  <input v-model="form.citHora" type="time" class="form-control" />
                </div>

                <div class="col-6">
                  <label class="form-label">Sucursal</label>
                  <input v-model.trim="form.citSucursal" class="form-control" placeholder="Rancagua" />
                </div>

                <div class="col-12">
                  <div class="form-text">
                    * Patente = <b>codigo</b> del equipo · N° Interno = <b>numero_interno</b> del equipo · Vehículo = <b>marca + modelo</b>
                  </div>
                </div>
              </div>
            </div>

            <div v-else>
              <div class="fw-semibold">Datos Operatividad</div>
              <div class="row g-2 mt-1">
                <div class="col-6">
                  <label class="form-label">Estado</label>
                  <select v-model="form.estadoOperatividad" class="form-select">
                    <option value="Operativo">Operativo</option>
                    <option value="No Operativo">No Operativo</option>
                    <option value="NA">NA</option>
                  </select>
                </div>

                <div class="col-6">
                  <label class="form-label">Fecha inspección</label>
                  <input v-model="form.fechaInspeccion" type="date" class="form-control" />
                </div>

                <div class="col-12">
                  <label class="form-label">Observaciones</label>
                  <textarea v-model.trim="form.observaciones" class="form-control" rows="3" placeholder="Observaciones…"></textarea>
                </div>
              </div>
            </div>

            <div v-if="saveErr" class="alert alert-danger mt-3 mb-0">❌ {{ saveErr }}</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div class="fw-semibold">Vista previa</div>
              <button class="btn btn-sm btn-outline-secondary no-print" :disabled="!hasPreview" @click="scrollToPreview">
                <i class="bi bi-eye me-1"></i> Ver certificado
              </button>
            </div>

            <hr class="my-3" />

            <div v-if="!hasPreview" class="text-muted small">
              Selecciona un equipo y completa los datos del formulario para ver la vista previa.
            </div>

            <div v-else ref="previewRef" class="cert-sheet p-3 p-md-4 position-relative" id="cert-preview">

              <img v-if="stampPreviewSrc" :src="stampPreviewSrc" class="cert-stamp" alt="Timbre" />

              <div class="qr-wrap" v-if="qrDataUrl && form.tipo !== 'CITACION_PREVENTIVO'">
                <img :src="logoServiciosSrc" class="qr-logo" alt="Logo XT Servicios" />
                <img :src="qrDataUrl" class="qr-img" alt="QR" />
              </div>

              <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="d-flex align-items-center gap-3">
                  <img :src="logoHeaderSrc" class="cert-logo" alt="Logo" />
                  <div class="small text-muted">
                    <div class="fw-semibold">{{ headerEmpresaTxt }}</div>
                    <div>Documento interno</div>
                  </div>
                </div>

                <div class="text-end">
                  <div class="small">
                    <div class="fw-semibold">
                      {{ form.tipo === "CITACION_PREVENTIVO" ? "CITACIÓN N°" : "CERTIFICADO N°" }} {{ displayNumero }}
                    </div>
                    <div class="mt-1">
                      <span class="fw-semibold">{{ ciudad }}</span>, {{ fechaEmisionFmt }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-center my-4">
                <div class="cert-title">
                  {{ form.tipo === "CITACION_PREVENTIVO" ? "CITACIÓN A MANTENIMIENTO PREVENTIVO" : `CERTIFICADO DE ${tipoLabelTitle}` }}
                </div>
              </div>

              <div class="cert-body">
                <template v-if="form.tipo === 'CITACION_PREVENTIVO'">
                  <div class="mb-3">
                    <div class="section-title">1. ANTECEDENTES DEL VEHÍCULO</div>
                    <p class="mb-3">
                      Por medio del presente documento se solicita la presentación en taller del vehículo que se detalla a continuación,
                      con el objetivo de dar cumplimiento al programa de mantenimiento preventivo establecido según el kilometraje y las
                      recomendaciones del fabricante.
                    </p>
                    <div class="row g-2 small mt-2">
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Patente:</span><b>{{ form.patente || "—" }}</b>
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* N° Interno:</span><b>{{ form.numeroInterno || "—" }}</b>
                        </div>
                      </div>
                      <div class="col-12">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Vehículo:</span><b>{{ vehiculoFmt || "—" }}</b>
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Fecha citación:</span><b>{{ fmtDMY(form.citFechaCitacion) }}</b>
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Lectura actual:</span>
                          <b>{{ citLecturaFmt }}</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mb-2">
                    <div class="section-title">2. DETALLE RESERVA EN SERVICIO TÉCNICO</div>

                    <div class="row g-2 small mt-2">
                      <div class="col-12">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Servicio:</span><b class="text-break">{{ form.citServicio || "—" }}</b>
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Fecha atención:</span><b>{{ fmtDMY(form.citFechaAtencion) }}</b>
                        </div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Hora:</span><b>{{ form.citHora || "—" }}</b>
                        </div>
                      </div>
                      <div class="col-12">
                        <div class="d-flex justify-content-between border rounded px-2 py-1">
                          <span>* Sucursal:</span><b>{{ form.citSucursal || "—" }}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3">
                    <p class="mb-2">
                      La intervención será realizada conforme a la pauta de mantenimiento establecida por kilometraje, ejecutándose las
                      actividades correspondientes al programa de mantenimiento preventivo del vehículo, de acuerdo con las recomendaciones
                      del fabricante.
                    </p>
                    <p class="mb-0">
                      Se solicita gestionar la disponibilidad de la unidad en la fecha indicada, con el propósito de garantizar la
                      continuidad operativa de la flota y asegurar el cumplimiento de los estándares de mantenimiento y confiabilidad
                      establecidos por la organización.
                    </p>
                  </div>
                  <div class="mt-5 pt-4 d-flex justify-content-center">
                    <div class="text-center" style="min-width: 320px;">
                      <div class="border-top pt-2"></div>
                      <div class="fw-semibold">{{ FIRMANTE.nombre }}</div>
                      <div class="small">{{ FIRMANTE.rut }}</div>
                      <div class="small text-muted mt-1">{{ FIRMANTE.cargo }}</div>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <p class="mb-2">
                    <b>XT Servicios</b> Mediante el presente documento, certifica que el equipo identificado con la placa
                    <b class="px-2 py-1 border rounded bg-light">{{ form.patente || "—" }}</b>
                    y número interno
                    <b class="px-2 py-1 border rounded bg-light">{{ form.numeroInterno || "—" }}</b>,
                    {{ cuerpoPrincipal }}
                  </p>

                  <div v-if="form.tipo === 'MANTENCION' && !form.equipoNuevo" class="mt-3">
                    <p class="mb-2">
                      Su última mantención realizada <b>{{ fechaUltimaOtFmt }}</b>
                      a los <b>{{ kmOtFmt }}</b> {{ unidad }} y registrada con la orden de trabajo <b>{{ form.ultimaOt || "—" }}</b>.
                      Constata que la unidad se encuentra en condición estándar, tanto en su parte mecánica, hidráulica y estructural.
                    </p>
                    <p class="mb-3">
                      Mantención realizada por personal calificado y certificado por representante de la marca de acuerdo a documento anexo.
                    </p>
                  </div>

                  <div v-if="form.tipo === 'MANTENCION' && form.equipoNuevo" class="mt-3">
                    <p class="mb-3">Se señala que el equipo es nuevo, y que se encuentra en óptimas condiciones para operar con normalidad.</p>
                  </div>

                  <div v-if="form.tipo === 'TORQUE' && !form.torqueEquipoNuevo" class="mt-3">
                    <p class="mb-2">
                      Su última revisión de torque, realizada el día <b>{{ fechaUltimaTorqueFmt }}</b>
                      a los <b>{{ lecturaOtTorqueFmt }}</b> {{ unidad }} y registrada con la orden de trabajo
                      <b>{{ form.ultimaOtTorque || "—" }}</b>.
                      Consta que la unidad se encuentra correctamente torqueada de acuerdo a manual de fabricante.
                    </p>
                    <p class="mb-3">Los valores de torque aplicados, se detallan en la tabla adjunta.</p>
                  </div>

                  <div v-if="form.tipo === 'TORQUE' && form.torqueEquipoNuevo" class="mt-3">
                    <p class="mb-2">
                      Se señala que el equipo es nuevo, por lo cual no registra aún una orden de trabajo de revisión de torque.
                      Se programa su próxima revisión para el día <b>{{ proximoTorqueFmt }}</b>.
                      Consta que la unidad se encuentra en condiciones para operar y que los valores de torque referenciales se indican en la tabla adjunta.
                    </p>
                  </div>

                  <div v-if="form.tipo === 'OPERATIVIDAD'" class="mt-3">
                    <p class="mb-2">
                      Se constata el estado: <b>{{ form.estadoOperatividad }}</b> (inspección: <b>{{ fechaInspeccionFmt }}</b>).
                    </p>
                    <p class="mb-3" v-if="form.observaciones"><b>Observaciones:</b> {{ form.observaciones }}</p>
                  </div>

                  <div class="mt-4">
                    <div class="fw-semibold mb-2">Detalles del equipo</div>
                    <div class="row g-2 small">
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Marca:</span><b>{{ form.marca || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Modelo:</span><b>{{ form.modelo || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Tipo de equipo:</span><b>{{ form.tipoEquipo || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* N° Chasis:</span><b class="text-break">{{ form.numeroChasis || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* N° Motor:</span><b>{{ form.numeroMotor || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* N° Interno:</span><b>{{ form.numeroInterno || "—" }}</b></div>
                      </div>
                      <div class="col-12 col-md-6">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Lectura actual:</span><b>{{ kmActualFmt }} {{ unidad }}</b></div>
                      </div>

                      <div class="col-12 col-md-6" v-if="form.tipo === 'MANTENCION'">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Próxima Mantención:</span><b>{{ proximaMantencionFmt }} {{ unidad }}</b></div>
                      </div>

                      <div class="col-12 col-md-6" v-if="form.tipo === 'TORQUE'">
                        <div class="d-flex justify-content-between border rounded px-2 py-1"><span>* Próximo Torque:</span><b>{{ proximoTorqueFmt }}</b></div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 pt-4 d-flex justify-content-center">
                    <div class="text-center" style="min-width: 320px;">
                      <div class="border-top pt-2"></div>
                      <div class="fw-semibold">{{ FIRMANTE.nombre }}</div>
                      <div class="small">{{ FIRMANTE.rut }}</div>
                      <div class="small text-muted mt-1">{{ FIRMANTE.cargo }}</div>
                    </div>
                  </div>
                </template>
              </div>

              <div class="cert-footer small text-muted mt-4">Documento generado desde sistema interno · {{ new Date().getFullYear() }}</div>
            </div>
          </div>
        </div>

        <div v-if="saveOk" class="alert alert-success mt-3">✅ Certificado guardado/actualizado.</div>

        <div v-if="lastSavedId && form.tipo !== 'CITACION_PREVENTIVO'" class="alert alert-light border mt-2">
          <div class="small text-muted mb-1">Link verificación:</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <code class="me-2">{{ verifyUrlFromId(lastSavedId) }}</code>
            <button class="btn btn-sm btn-outline-secondary" type="button" @click="copyVerifyUrl(lastSavedId)">
              <i class="bi bi-clipboard me-1"></i> Copiar
            </button>
            <button class="btn btn-sm btn-outline-primary" type="button" @click="openVerify(lastSavedId)">
              <i class="bi bi-box-arrow-up-right me-1"></i> Abrir
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" tabindex="-1" ref="histModalEl" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0">Historial de Certificados</h5>
              <span class="badge text-bg-light border" v-if="histCount">
                {{ histVisibleCount }}{{ histVisibleCount !== histCount ? ` / ${histCount}` : "" }}
              </span>
            </div>
            <button type="button" class="btn-close" @click="closeHistorial"></button>
          </div>

          <div class="modal-body">
            <div class="d-flex gap-2 align-items-center flex-wrap mb-3">
              <div class="input-group" style="max-width: 620px;">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  class="form-control"
                  v-model.trim="histSearch"
                  placeholder="Buscar por N°, tipo, interno, patente, marca, modelo o fecha…"
                />
                <button class="btn btn-outline-secondary" @click="loadHistorial" :disabled="histLoading" type="button">
                  <span v-if="histLoading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i>
                  Actualizar
                </button>
              </div>

              <select v-model="histTipoFilter" class="form-select" style="max-width: 260px;">
                <option value="">Todos los tipos</option>
                <option value="MANTENCION">MANTENCIÓN</option>
                <option value="OPERATIVIDAD">OPERATIVIDAD</option>
                <option value="TORQUE">TORQUE</option>
                <option value="CITACION_PREVENTIVO">CITACIÓN MANT. PREVENTIVO</option>
              </select>

              <div class="ms-auto d-flex gap-2">
                <button class="btn btn-outline-secondary" @click="closeHistorial" type="button">Cerrar</button>
              </div>
            </div>
            <div v-if="histErr" class="alert alert-danger">{{ histErr }}</div>

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width: 120px;">N°</th>
                    <th style="width: 140px;">Fecha</th>
                    <th style="width: 220px;">Tipo</th>
                    <th>Equipo</th>
                    <th class="text-end" style="width: 360px;">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="histLoading">
                    <td colspan="5" class="py-4 text-center text-muted">
                      <span class="spinner-border spinner-border-sm me-2"></span> Cargando certificados…
                    </td>
                  </tr>

                  <tr v-for="c in historialFiltrado" :key="c.id">
                    <td><span class="badge text-bg-dark">#{{ String(c.numero || 0) }}</span></td>
                    <td class="small">{{ fmtDMY(c.fechaEmisionStr) }}</td>
                    <td class="fw-semibold">
                      <span class="badge" :class="tipoBadgeClass(c.tipo)">{{ c.tipo || "—" }}</span>
                    </td>
                    <td>
                      <div class="fw-semibold">
                        {{ c.interno || "—" }} <span class="text-muted">·</span> {{ c.patente || "—" }}
                      </div>
                      <div class="small text-muted">{{ c.marca || "" }} {{ c.modelo || "" }}</div>
                    </td>

                    <td class="text-end">
                      <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" @click="editarDesdeHistorial(c)" type="button">
                          <i class="bi bi-pencil me-1"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" @click="openDeleteConfirm(c)" type="button">
                          <i class="bi bi-trash me-1"></i> Eliminar
                        </button>
                        <button class="btn btn-sm btn-danger" @click="reDescargarCertificado(c)" type="button">
                          <i class="bi bi-download me-1"></i> PDF
                        </button>
                        <button
                          v-if="c.tipo !== 'CITACION_PREVENTIVO'"
                          class="btn btn-sm btn-outline-dark"
                          @click="openVerify(c.id)"
                          type="button"
                        >
                          <i class="bi bi-qr-code-scan me-1"></i> Verificar
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!histLoading && !historialFiltrado.length">
                    <td colspan="5" class="py-4 text-center text-muted">No hay certificados para mostrar.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="small text-muted mt-2">
              Tip: “Editar” carga el certificado en el formulario. Luego usa “Actualizar + PDF”.
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeHistorial" type="button">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" tabindex="-1" ref="delModalEl" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title mb-0">Confirmar eliminación</h5>
            <button type="button" class="btn-close" @click="closeDeleteConfirm"></button>
          </div>

          <div class="modal-body">
            <div v-if="delErr" class="alert alert-danger">{{ delErr }}</div>
            <p class="mb-2">¿Seguro que deseas eliminar el certificado <b>#{{ String(delNumero || "—") }}</b>?</p>
            <div class="text-muted small">Esta acción no se puede deshacer.</div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeDeleteConfirm" :disabled="delBusy" type="button">Cancelar</button>
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
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Modal } from "bootstrap";
import { getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import logoXtImg from "../assets/Logo XT Servicios Transparente.png";
import firmaImg from "../assets/firma_juan_cubillos.png";
import timbreOperativoImg from "../assets/timbre_operativo.png";
import timbreCheckImg from "../assets/timbre_check.png";
import torqueTablaImg from "../assets/Torque_equipos.png";
import logoMiningImg from "../assets/Logo Xtreme Mining.png";
const firmaSrc = firmaImg;
const timbreOperativoSrc = timbreOperativoImg;
const timbreCheckSrc = timbreCheckImg;
const torqueTablaSrc = torqueTablaImg;
const logoMiningSrc = logoMiningImg;
const logoServiciosSrc = logoXtImg;
const DATABASE_ID = "rollback-2025-10-25";

const FIRMANTE = Object.freeze({
  nombre: "Juan Cubillos Polloni",
  rut: "19.245.263-5",
  cargo: "Jefe Corporativo Mantenimiento Flota",
});

const app = getApp();
const db = getFirestore(app, DATABASE_ID);
const ciudad = "Santiago";
const PREVENTIVOS_MOTORES = Object.freeze({
  "TRACTO CAMION": { intervalo: 20000, unidad: "Km" },
  "CAMIONETA": { intervalo: 10000, unidad: "Km" },
  "CAMION MIXER": { intervalo: 500, unidad: "Hrs" },
  "TORNADO S2": { intervalo: 250, unidad: "Hrs" },
  "GENERADOR": { intervalo: 250, unidad: "Hrs" },
  "GRUA HORQUILLA": { intervalo: 250, unidad: "Hrs" },
  "CARRO BOMBA": { intervalo: 500, unidad: "Hrs" },
  "MINI CARGADOR": { intervalo: 250, unidad: "Hrs" },
  "RETRO EXCAVADORA": { intervalo: 250, unidad: "Hrs" },
  "CAMION PLUMA": { intervalo: 10000, unidad: "Km" },
  "MANIPULADOR TELESCOPIO": { intervalo: 250, unidad: "Hrs" },
  "TELESCOPIO": { intervalo: 250, unidad: "Hrs" },
  "CAMION TOLVA": { intervalo: 10000, unidad: "Km" },
  "CARGADOR FRONTAL": { intervalo: 400, unidad: "Hrs" },
  "ALJIBE": { intervalo: 10000, unidad: "Km" },
  "MIXER PERFIL BAJO": { intervalo: 250, unidad: "Hrs" },
  "ACUÑADOR": { intervalo: 100, unidad: "Hrs" },
});

function normalizeEquipoTipo(tipo) {
  return String(tipo || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPreventivoByTipoEquipo(tipo) {
  const t = normalizeEquipoTipo(tipo);
  if (!t) return null;

  if (PREVENTIVOS_MOTORES[t]) return PREVENTIVOS_MOTORES[t];

  // aliases / coincidencias flexibles
  if (t.includes("TRACTO") && t.includes("CAMION")) return PREVENTIVOS_MOTORES["TRACTO CAMION"];
  if (t.includes("CAMIONETA")) return PREVENTIVOS_MOTORES["CAMIONETA"];
  if (t.includes("CAMION") && t.includes("MIXER")) return PREVENTIVOS_MOTORES["CAMION MIXER"];
  if (t.includes("TORNADO")) return PREVENTIVOS_MOTORES["TORNADO S2"];
  if (t.includes("GENERADOR")) return PREVENTIVOS_MOTORES["GENERADOR"];
  if (t.includes("GRUA") && t.includes("HORQUILLA")) return PREVENTIVOS_MOTORES["GRUA HORQUILLA"];
  if (t.includes("CARRO") && t.includes("BOMBA")) return PREVENTIVOS_MOTORES["CARRO BOMBA"];
  if (t.includes("MINI") && t.includes("CARGADOR")) return PREVENTIVOS_MOTORES["MINI CARGADOR"];
  if (t.includes("RETRO") && t.includes("EXCAVADORA")) return PREVENTIVOS_MOTORES["RETRO EXCAVADORA"];
  if (t.includes("CAMION") && t.includes("PLUMA")) return PREVENTIVOS_MOTORES["CAMION PLUMA"];
  if (t.includes("MANIPULADOR") && t.includes("TELESCOP")) return PREVENTIVOS_MOTORES["MANIPULADOR TELESCOPIO"];
  if (t.includes("TELESCOP")) return PREVENTIVOS_MOTORES["TELESCOPIO"];
  if (t.includes("CAMION") && t.includes("TOLVA")) return PREVENTIVOS_MOTORES["CAMION TOLVA"];
  if (t.includes("CARGADOR") && t.includes("FRONTAL")) return PREVENTIVOS_MOTORES["CARGADOR FRONTAL"];
  if (t.includes("ALJIBE")) return PREVENTIVOS_MOTORES["ALJIBE"];
  if (t.includes("MIXER") && t.includes("PERFIL") && t.includes("BAJO")) return PREVENTIVOS_MOTORES["MIXER PERFIL BAJO"];
  if (t.includes("ACUÑADOR") || t.includes("ACUNADOR")) return PREVENTIVOS_MOTORES["ACUÑADOR"];

  return null;
}

function aplicarPreventivoAutomaticoDesdeEquipo(tipoEquipo) {
  const cfg = getPreventivoByTipoEquipo(tipoEquipo);
  if (!cfg) return;
  form.value.unidadLectura = cfg.unidad;

  form.value.citUnidadLectura = cfg.unidad;

  form.value.intervaloRaw = String(cfg.intervalo);

  recalcMantencion();
}
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function parseIntLoose(v) {
  if (v == null) return NaN;
  const s = String(v).replace(/[^\d-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
function fmtCL(n) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-CL").format(n);
}
function fmtDMY(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return "—";
  return `${d}-${m}-${y}`;
}
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
function addMonthsISO(iso, months) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map((x) => Number(x));
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + Number(months || 0));
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function addDaysISO(iso, days) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + Number(days || 0));
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function safeFilePart(str) {
  return String(str || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ");
}
function buildPdfFilename() {
  const prefix =
    form.value.tipo === "MANTENCION" ? "C.MANTENCION"
    : form.value.tipo === "OPERATIVIDAD" ? "C.OPERATIVIDAD"
    : form.value.tipo === "TORQUE" ? "C.TORQUE"
    : "C.CITACION";

  const codigoEquipo = safeFilePart(form.value.patente || "SIN-CODIGO");
  const fecha = safeFilePart(fmtDMY(form.value.fechaEmision || todayISO()));
  return `${prefix} ${codigoEquipo} ${fecha}.pdf`;
}
function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function fetchAsArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar asset: " + url);
  return await res.arrayBuffer();
}
function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

const histModalEl = ref(null);
const delModalEl = ref(null);
let histModal = null;
let delModal = null;

onMounted(() => {
  if (histModalEl.value) histModal = new Modal(histModalEl.value, { backdrop: true, keyboard: true, focus: true });
  if (delModalEl.value) delModal = new Modal(delModalEl.value, { backdrop: "static", keyboard: true, focus: true });
});
onBeforeUnmount(() => {
  try { histModal?.dispose?.(); } catch(e) { console.log(e); }
  try { delModal?.dispose?.(); } catch(e) { console.log(e); }
});

const loadingEquipos = ref(false);
const equiposCache = ref([]);
const equipoSearch = ref("");
const selectedEquipo = ref(null);

const saving = ref(false);
const saveOk = ref(false);
const saveErr = ref("");
const lastSavedId = ref("");
const lastSavedNumero = ref(null);

const previewRef = ref(null);

const loadingCounter = ref(false);
const counterNext = ref(null);

const isEditing = ref(false);
const editingId = ref(null);
const editingNumero = ref(null);

const histLoading = ref(false);
const histErr = ref("");
const histSearch = ref("");
const histList = ref([]);
const histTipoFilter = ref("");

const histCount = computed(() => histList.value.length);
const histVisibleCount = computed(() => historialFiltrado.value.length);
const qrDataUrl = ref("");
const lastQrValue = ref("");

const form = ref({
  tipo: "MANTENCION",
  ciudad,
  fechaEmision: todayISO(),
  numero: null,

  unidadLectura: "Km",
  patente: "",
  numeroInterno: "",
  marca: "",
  modelo: "",
  tipoEquipo: "",
  numeroChasis: "",
  numeroMotor: "",
  equipoNuevo: false,
  ultimaOt: "",
  fechaUltimaOt: "",
  kmOtRaw: "",
  kmActualRaw: "",
  intervaloRaw: "10000",
  proximaMantencionRaw: "",
  estadoOperatividad: "Operativo",
  fechaInspeccion: todayISO(),
  observaciones: "",
  torqueEquipoNuevo: false,
  ultimaOtTorque: "",
  fechaUltimaOtTorque: "",
  lecturaOtTorqueRaw: "",
  proximoTorqueFecha: "",

  citServicio: "Reparación / Mantención preventiva",
  citFechaCitacion: todayISO(),
  citFechaAtencion: "",
  citHora: "",
  citSucursal: "",
  citUnidadLectura: "Km",
  citLecturaRaw: ""
});

const unidad = computed(() => form.value.unidadLectura || "Km");
const preventivoDetectado = computed(() => {
  return getPreventivoByTipoEquipo(form.value.tipoEquipo);
});

const logoHeaderSrc = computed(() => logoMiningImg);
const headerEmpresaTxt = computed(() => "XT Servicios");
const vehiculoFmt = computed(() => {
  const a = String(form.value.marca || "").trim();
  const b = String(form.value.modelo || "").trim();
  return [a, b].filter(Boolean).join(" ");
});
const citLecturaFmt = computed(() => {
  const n = parseIntLoose(form.value.citLecturaRaw);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const u = form.value.citUnidadLectura || "Km";
  return `${fmtCL(n)} ${u}`;
});
const stampPreviewSrc = computed(() => {
  if (form.value.tipo === "CITACION_PREVENTIVO") return null;
  if (form.value.tipo === "OPERATIVIDAD") return timbreOperativoSrc;
  return timbreCheckSrc;
});

function tipoBadgeClass(tipo) {
  if (tipo === "MANTENCION") return "text-bg-primary";
  if (tipo === "OPERATIVIDAD") return "text-bg-success";
  if (tipo === "TORQUE") return "text-bg-warning text-dark";
  if (tipo === "CITACION_PREVENTIVO") return "text-bg-info";
  return "text-bg-secondary";
}
const tipoLabelForm = computed(() => {
  if (form.value.tipo === "MANTENCION") return "Certificado de Mantención";
  if (form.value.tipo === "OPERATIVIDAD") return "Certificado de Operatividad";
  if (form.value.tipo === "TORQUE") return "Certificado de Torque";
  return "Citación Mant. Preventivo";
});
const tipoLabelTitle = computed(() => {
  if (form.value.tipo === "MANTENCION") return "MANTENCIÓN";
  if (form.value.tipo === "OPERATIVIDAD") return "OPERATIVIDAD";
  if (form.value.tipo === "TORQUE") return "TORQUE";
  return "CITACIÓN A MANTENIMIENTO PREVENTIVO";
});

function extraerCodigoDesdeString(str) {
  if (!str) return "";
  const m = String(str).match(/\[([^\]]+)\]\s*$/);
  return m?.[1] || "";
}
const equiposFiltrados = computed(() => {
  const q = norm(equipoSearch.value);
  const list = equiposCache.value || [];
  if (!q) return list.slice(0, 20);

  const out = list.filter((e) => {
    const codigo = norm(e.codigo || extraerCodigoDesdeString(e.equipo));
    const equipo = norm(e.equipo);
    const marca = norm(e.marca);
    const modelo = norm(e.modelo);
    const chasis = norm(e.numero_chasis);
    const tipo = norm(e.tipo_equipo);
    const interno = norm(e.numero_interno || e.numeroInterno);
    return codigo.includes(q) || equipo.includes(q) || marca.includes(q) || modelo.includes(q) || chasis.includes(q) || tipo.includes(q) || interno.includes(q);
  });

  return out.slice(0, 30);
});

function seleccionarEquipo(e) {
  selectedEquipo.value = e;

  const codigo = e.codigo || extraerCodigoDesdeString(e.equipo) || "";
  const tipoEquipo = e.tipo_equipo || e.tipoEquipo || e.equipo || "";

  form.value.patente = codigo || "";
  form.value.numeroInterno = e.numero_interno || e.numeroInterno || "";
  form.value.marca = e.marca || "";
  form.value.modelo = e.modelo || "";
  form.value.tipoEquipo = tipoEquipo || "";
  form.value.numeroChasis = e.numero_chasis || "";
  form.value.numeroMotor = e.numero_motor || e.numeroMotor || "";

  aplicarPreventivoAutomaticoDesdeEquipo(tipoEquipo);

  recalcMantencion();
  recalcTorque();
}

async function loadEquiposCache() {
  loadingEquipos.value = true;
  try {
    const q = query(collection(db, "equipos"), orderBy("actualizado", "desc"), limit(1000));
    const snap = await getDocs(q);
    equiposCache.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } finally {
    loadingEquipos.value = false;
  }
}

function recalcMantencion() {
  if (form.value.tipo !== "MANTENCION") return;
  const kmOt = parseIntLoose(form.value.kmOtRaw);
  const intervalo = parseIntLoose(form.value.intervaloRaw);
  if (Number.isFinite(kmOt) && Number.isFinite(intervalo) && kmOt > 0 && intervalo > 0) {
    form.value.proximaMantencionRaw = String(kmOt + intervalo);
  }
}
function recalcTorque() {
  if (form.value.tipo !== "TORQUE") return;
  const base = form.value.torqueEquipoNuevo ? form.value.fechaEmision : form.value.fechaUltimaOtTorque;
  if (!base) {
    form.value.proximoTorqueFecha = "";
    return;
  }
  form.value.proximoTorqueFecha = addMonthsISO(base, 3);
}
function onTorqueNuevoChange() {
  if (form.value.tipo !== "TORQUE") return;
  if (form.value.torqueEquipoNuevo) {
    form.value.ultimaOtTorque = "";
    form.value.fechaUltimaOtTorque = "";
    form.value.lecturaOtTorqueRaw = "";
  }
  recalcTorque();
}

async function onTipoChange() {
  saveOk.value = false;
  saveErr.value = "";
  if (!isEditing.value) form.value.numero = null;

  if (form.value.tipo === "OPERATIVIDAD") form.value.equipoNuevo = false;
  if (form.value.tipo !== "TORQUE") form.value.torqueEquipoNuevo = false;

  if (form.value.tipo === "CITACION_PREVENTIVO") {
    qrDataUrl.value = "";
    lastQrValue.value = "";
  }

  if (!isEditing.value) await cargarProximoNumero();
  recalcTorque();
}

const fechaEmisionFmt = computed(() => fmtDMY(form.value.fechaEmision));
const fechaUltimaOtFmt = computed(() => fmtDMY(form.value.fechaUltimaOt));
const fechaInspeccionFmt = computed(() => fmtDMY(form.value.fechaInspeccion));

const kmOtFmt = computed(() => fmtCL(parseIntLoose(form.value.kmOtRaw)));
const kmActualFmt = computed(() => fmtCL(parseIntLoose(form.value.kmActualRaw)));
const proximaMantencionFmt = computed(() => fmtCL(parseIntLoose(form.value.proximaMantencionRaw)));

const fechaUltimaTorqueFmt = computed(() => fmtDMY(form.value.fechaUltimaOtTorque));
const lecturaOtTorqueFmt = computed(() => fmtCL(parseIntLoose(form.value.lecturaOtTorqueRaw)));
const proximoTorqueFmt = computed(() => fmtDMY(form.value.proximoTorqueFecha));

const cuerpoPrincipal = computed(() => {
  return "se encuentra con sus mantenciones y revisiones al día según la pauta del fabricante, encontrándose en condiciones para operar con normalidad.";
});

const hasPreview = computed(() => {
  if (!selectedEquipo.value || !form.value.patente || !form.value.numeroInterno) return false;

  if (form.value.tipo === "CITACION_PREVENTIVO") {
    return !!(
      form.value.citServicio &&
      form.value.citFechaCitacion &&
      form.value.citFechaAtencion &&
      form.value.citHora &&
      form.value.citSucursal &&
      form.value.citUnidadLectura &&
      Number.isFinite(parseIntLoose(form.value.citLecturaRaw)) &&
      parseIntLoose(form.value.citLecturaRaw) > 0
    );
  }
  return true;
});

const canSave = computed(() => {
  if (!selectedEquipo.value) return false;
  if (!form.value.patente || !form.value.numeroInterno) return false;

  if (form.value.tipo === "CITACION_PREVENTIVO") {
    if (!form.value.citServicio) return false;
    if (!form.value.citFechaCitacion) return false;
    if (!form.value.citFechaAtencion) return false;
    if (!form.value.citHora) return false;
    if (!form.value.citSucursal) return false;

    if (!form.value.citUnidadLectura) return false;
    const n = parseIntLoose(form.value.citLecturaRaw);
    if (!Number.isFinite(n) || n <= 0) return false;

    return true;
  }
  if (form.value.tipo === "MANTENCION") {
    if (!form.value.equipoNuevo) {
      if (!form.value.ultimaOt) return false;
      if (!form.value.fechaUltimaOt) return false;
      if (!Number.isFinite(parseIntLoose(form.value.kmOtRaw)) || parseIntLoose(form.value.kmOtRaw) <= 0) return false;
    }
    if (!Number.isFinite(parseIntLoose(form.value.kmActualRaw)) || parseIntLoose(form.value.kmActualRaw) <= 0) return false;
  }

  if (form.value.tipo === "TORQUE") {
    if (!form.value.torqueEquipoNuevo) {
      if (!form.value.ultimaOtTorque) return false;
      if (!form.value.fechaUltimaOtTorque) return false;
      if (!Number.isFinite(parseIntLoose(form.value.lecturaOtTorqueRaw)) || parseIntLoose(form.value.lecturaOtTorqueRaw) <= 0) return false;
    }
    if (!Number.isFinite(parseIntLoose(form.value.kmActualRaw)) || parseIntLoose(form.value.kmActualRaw) <= 0) return false;
    if (!form.value.proximoTorqueFecha) return false;
  }

  if (form.value.tipo === "OPERATIVIDAD") {
    if (!form.value.fechaInspeccion) return false;
    if (!form.value.estadoOperatividad) return false;
  }

  return true;
});

const displayNumero = computed(() => {
  const nSaved = Number(form.value.numero);
  if (Number.isFinite(nSaved) && nSaved >= 1) return nSaved;

  const nNext = Number(counterNext.value);
  if (Number.isFinite(nNext) && nNext >= 1) return nNext;

  return "—";
});

async function resolveCounterDocIdByTipo(tipo) {
  if (tipo === "MANTENCION") return "mantencion";
  if (tipo === "OPERATIVIDAD") return "operatividad";
  if (tipo === "TORQUE") return "torque";
  if (tipo === "CITACION_PREVENTIVO") return "citacion_preventivo";

  return "global";
}

async function cargarProximoNumero() {
  loadingCounter.value = true;
  try {
    const id = await resolveCounterDocIdByTipo(form.value.tipo);
    const ref = doc(db, "counters_certificados", id);
    const snap = await getDoc(ref);

    // ✅ fallbacks por tipo
    let fallback = 1;
    if (form.value.tipo === "TORQUE") fallback = 192;
    if (form.value.tipo === "MANTENCION") fallback = 982;
    if (form.value.tipo === "OPERATIVIDAD") fallback = 1;
    if (form.value.tipo === "CITACION_PREVENTIVO") fallback = 1;

    const raw = snap.exists() ? Number(snap.data()?.next) : fallback;
    const nextVal = Number.isFinite(raw) && raw >= 1 ? raw : fallback;

    counterNext.value = nextVal;
  } catch (e) {
    console.error(e);
    // ✅ fallback seguro si falla lectura
    if (form.value.tipo === "TORQUE") counterNext.value = 192;
    else if (form.value.tipo === "MANTENCION") counterNext.value = 982;
    else counterNext.value = 1;
  } finally {
    loadingCounter.value = false;
  }
}

function verifyUrlFromId(id) {
  const origin = window.location.origin;
  return `${origin}/verify-certificado?c=${encodeURIComponent(id)}`;
}
async function buildQrDataUrl(value) {
  try {
    return await QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 240 });
  } catch (e) {
    console.error("QR error:", e);
    return "";
  }
}
async function refreshQrPreview() {
  if (form.value.tipo === "CITACION_PREVENTIVO") {
    qrDataUrl.value = "";
    lastQrValue.value = "";
    return;
  }
  const id = isEditing.value ? (editingId.value || "") : (lastSavedId.value || "");
  const val = id ? verifyUrlFromId(id) : "";
  if (!val) {
    qrDataUrl.value = "";
    lastQrValue.value = "";
    return;
  }
  if (val === lastQrValue.value && qrDataUrl.value) return;
  lastQrValue.value = val;
  qrDataUrl.value = await buildQrDataUrl(val);
}
async function copyVerifyUrl(id) {
  try {
    await navigator.clipboard.writeText(verifyUrlFromId(id));
  } catch (e) {
    console.log(e);
    alert("No se pudo copiar. Revisa permisos del navegador.");
  }
}
function openVerify(id) {
  window.open(verifyUrlFromId(id), "_blank");
}

function computeVigenciaHastaStr() {
  if (form.value.tipo === "OPERATIVIDAD") return addDaysISO(form.value.fechaInspeccion || form.value.fechaEmision, 30);
  if (form.value.tipo === "TORQUE") return form.value.proximoTorqueFecha || addDaysISO(form.value.fechaEmision, 90);
  return addDaysISO(form.value.fechaEmision, 90);
}

function buildPayload(numeroAsignado, verificationId) {
  const withQr = form.value.tipo !== "CITACION_PREVENTIVO";

  const payload = {
    tipo: form.value.tipo,
    numero: numeroAsignado,
    ciudad,
    fechaEmisionStr: form.value.fechaEmision,

    unidadLectura: form.value.tipo === "CITACION_PREVENTIVO" ? null : (form.value.unidadLectura || "Km"),

    verificationId: withQr ? (verificationId || null) : null,
    verificationUrl: withQr && verificationId ? verifyUrlFromId(verificationId) : null,
    vigenciaHastaStr: withQr ? computeVigenciaHastaStr() : null,

    equipoId: selectedEquipo.value?.id || null,
    equipoSnapshot: {
      patente: form.value.patente || "",
      numeroInterno: form.value.numeroInterno || "",
      marca: form.value.marca || "",
      modelo: form.value.modelo || "",
      tipoEquipo: form.value.tipoEquipo || "",
      numeroChasis: form.value.numeroChasis || "",
      numeroMotor: form.value.numeroMotor || "",
    },

    firmante: { ...FIRMANTE },
    texto: { cuerpoPrincipal: cuerpoPrincipal.value },

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (form.value.tipo === "MANTENCION") {
    payload.mantencion = {
      equipoNuevo: !!form.value.equipoNuevo,
      ultimaOt: form.value.ultimaOt || "",
      fechaUltimaOtStr: form.value.fechaUltimaOt || "",
      lecturaOt: parseIntLoose(form.value.kmOtRaw),
      lecturaActual: parseIntLoose(form.value.kmActualRaw),
      intervalo: parseIntLoose(form.value.intervaloRaw),
      proximaMantencion: parseIntLoose(form.value.proximaMantencionRaw),
    };
  }

  if (form.value.tipo === "OPERATIVIDAD") {
    payload.operatividad = {
      estado: form.value.estadoOperatividad || "",
      fechaInspeccionStr: form.value.fechaInspeccion || "",
      observaciones: form.value.observaciones || "",
    };
  }

  if (form.value.tipo === "TORQUE") {
    payload.torque = {
      equipoNuevo: !!form.value.torqueEquipoNuevo,
      ultimaOt: form.value.ultimaOtTorque || "",
      fechaUltimaOtStr: form.value.fechaUltimaOtTorque || "",
      lecturaOt: parseIntLoose(form.value.lecturaOtTorqueRaw),
      lecturaActual: parseIntLoose(form.value.kmActualRaw),
      proximoTorqueStr: form.value.proximoTorqueFecha || "",
      intervaloMeses: 3,
    };
  }

  if (form.value.tipo === "CITACION_PREVENTIVO") {
    payload.citacion = {
      servicio: form.value.citServicio || "",
      fechaCitacionStr: form.value.citFechaCitacion || "",
      fechaAtencionStr: form.value.citFechaAtencion || "",
      hora: form.value.citHora || "",
      sucursal: form.value.citSucursal || "",
      vehiculo: vehiculoFmt.value || "",
      unidadLectura: form.value.citUnidadLectura || "Km",
      lecturaActual: parseIntLoose(form.value.citLecturaRaw)
    };
  }

  return payload;
}

function modelFromDoc(data) {
  const eq = data?.equipoSnapshot || {};
  const mant = data?.mantencion || {};
  const op = data?.operatividad || {};
  const tq = data?.torque || {};
  const cit = data?.citacion || {};

  return {
    tipo: data?.tipo || "MANTENCION",
    fechaEmision: data?.fechaEmisionStr || todayISO(),
    unidadLectura: data?.unidadLectura || "Km",

    patente: eq.patente || "",
    numeroInterno: eq.numeroInterno || "",
    marca: eq.marca || "",
    modelo: eq.modelo || "",
    tipoEquipo: eq.tipoEquipo || "",
    numeroChasis: eq.numeroChasis || "",
    numeroMotor: eq.numeroMotor || "",

    equipoNuevo: !!mant.equipoNuevo,
    ultimaOt: mant.ultimaOt || "",
    fechaUltimaOt: mant.fechaUltimaOtStr || "",
    kmOtRaw: Number.isFinite(mant.lecturaOt) ? String(mant.lecturaOt) : "",
    kmActualRaw:
    data?.tipo === "TORQUE"
      ? (Number.isFinite(tq.lecturaActual) ? String(tq.lecturaActual) : "")
      : (Number.isFinite(mant.lecturaActual) ? String(mant.lecturaActual) : ""),
    intervaloRaw: Number.isFinite(mant.intervalo) ? String(mant.intervalo) : "10000",
    proximaMantencionRaw: Number.isFinite(mant.proximaMantencion) ? String(mant.proximaMantencion) : "",

    estadoOperatividad: op.estado || "Operativo",
    fechaInspeccion: op.fechaInspeccionStr || todayISO(),
    observaciones: op.observaciones || "",

    torqueEquipoNuevo: !!tq.equipoNuevo,
    ultimaOtTorque: tq.ultimaOt || "",
    fechaUltimaOtTorque: tq.fechaUltimaOtStr || "",
    lecturaOtTorqueRaw: Number.isFinite(tq.lecturaOt) ? String(tq.lecturaOt) : "",
    proximoTorqueFecha: tq.proximoTorqueStr || "",

    citServicio: cit.servicio || "Reparación / Mantención preventiva",
    citFechaCitacion: cit.fechaCitacionStr || todayISO(),
    citFechaAtencion: cit.fechaAtencionStr || "",
    citHora: cit.hora || "",
    citSucursal: cit.sucursal || "",
    citUnidadLectura: cit.unidadLectura || "Km",
    citLecturaRaw: Number.isFinite(cit.lecturaActual) ? String(cit.lecturaActual) : "",
    cuerpoPrincipal: data?.texto?.cuerpoPrincipal || "",
    verificationId: data?.verificationId || "",
    verificationUrl: data?.verificationUrl || "",
  };
}

function modelFromForm(extra = {}) {
  return {
    tipo: form.value.tipo,
    fechaEmision: form.value.fechaEmision,
    unidadLectura: form.value.unidadLectura || "Km",

    patente: form.value.patente,
    numeroInterno: form.value.numeroInterno,
    marca: form.value.marca,
    modelo: form.value.modelo,
    tipoEquipo: form.value.tipoEquipo,
    numeroChasis: form.value.numeroChasis,
    numeroMotor: form.value.numeroMotor,

    equipoNuevo: !!form.value.equipoNuevo,
    ultimaOt: form.value.ultimaOt,
    fechaUltimaOt: form.value.fechaUltimaOt,
    kmOtRaw: form.value.kmOtRaw,
    kmActualRaw: form.value.kmActualRaw,
    intervaloRaw: form.value.intervaloRaw,
    proximaMantencionRaw: form.value.proximaMantencionRaw,

    estadoOperatividad: form.value.estadoOperatividad,
    fechaInspeccion: form.value.fechaInspeccion,
    observaciones: form.value.observaciones,

    torqueEquipoNuevo: !!form.value.torqueEquipoNuevo,
    ultimaOtTorque: form.value.ultimaOtTorque,
    fechaUltimaOtTorque: form.value.fechaUltimaOtTorque,
    lecturaOtTorqueRaw: form.value.lecturaOtTorqueRaw,
    proximoTorqueFecha: form.value.proximoTorqueFecha,

    citServicio: form.value.citServicio,
    citFechaCitacion: form.value.citFechaCitacion,
    citFechaAtencion: form.value.citFechaAtencion,
    citHora: form.value.citHora,
    citSucursal: form.value.citSucursal,
    citUnidadLectura: form.value.citUnidadLectura,
    citLecturaRaw: form.value.citLecturaRaw,

    cuerpoPrincipal: cuerpoPrincipal.value,
    ...extra,
  };
}

async function buildPdfBytesFromModel(model, numero, verificationUrl) {
  const m = model;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.08, 0.08, 0.08);
  const borderColor = rgb(0.18, 0.18, 0.18);

  const M = 22;
  const innerPad = 22;
  const contentLeft = M + innerPad;
  const contentRight = width - (M + innerPad);
  const contentWidth = contentRight - contentLeft;

  const drawRight = (text, y, size, fnt = font, color = dark) => {
    const x = contentRight - fnt.widthOfTextAtSize(text, size);
    page.drawText(text, { x, y, size, font: fnt, color });
  };
  const drawCentered = (text, y, size, fnt = font, color = dark) => {
    const x = (width - fnt.widthOfTextAtSize(text, size)) / 2;
    page.drawText(text, { x, y, size, font: fnt, color });
  };
  const wrapText = (text, fnt, size, maxW) => {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      const wpx = fnt.widthOfTextAtSize(test, size);
      if (wpx <= maxW) cur = test;
      else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const drawWrappedBlockLeft = (text, y, size, blockW, lineH, fnt = font, color = dark) => {
    const lines = wrapText(text, fnt, size, blockW);
    const blockX = (width - blockW) / 2;
    for (const ln of lines) {
      page.drawText(ln, { x: blockX, y, size, font: fnt, color });
      y -= lineH;
    }
    return y;
  };

  page.drawRectangle({
    x: M,
    y: M,
    width: width - M * 2,
    height: height - M * 2,
    borderColor,
    borderWidth: 1.0,
  });

  if (m.tipo !== "CITACION_PREVENTIVO") {
    const isOp = m.tipo === "OPERATIVIDAD";
    const isMantOrTorque = m.tipo === "MANTENCION" || m.tipo === "TORQUE";
    let stampSrc = null;
    if (isOp) stampSrc = timbreOperativoSrc;
    if (isMantOrTorque) stampSrc = timbreCheckSrc;

    if (stampSrc) {
      try {
        const stampBytes = await fetchAsArrayBuffer(stampSrc);
        const stamp = await pdfDoc.embedPng(stampBytes);
        const stampW = 140;
        const stampH = (stamp.height / stamp.width) * stampW;
        page.drawImage(stamp, {
          x: M + 16,
          y: M + 22,
          width: stampW,
          height: stampH,
          opacity: isOp ? 0.34 : 0.28,
        });
      } catch (e) {
        console.warn("Stamp no pudo cargarse:", e);
      }
    }
  }

  let y = height - M - innerPad;

  // ✅ Header = Mining
  const headerLogoBytes = await fetchAsArrayBuffer(logoMiningSrc);
  const headerLogo = await pdfDoc.embedPng(headerLogoBytes);

  // ✅ QR Logo = Servicios
  const qrLogoBytes = await fetchAsArrayBuffer(logoServiciosSrc);
  const qrLogo = await pdfDoc.embedPng(qrLogoBytes);

  // ---- HEADER LOGO (Mining) ----
  const logoW = 170;
  const logoH = (headerLogo.height / headerLogo.width) * logoW;

  page.drawImage(headerLogo, {
    x: contentLeft,
    y: y - logoH + 6,
    width: logoW,
    height: logoH,
  });

  const numLabel = m.tipo === "CITACION_PREVENTIVO" ? `CITACIÓN N° ${numero}` : `CERTIFICADO N° ${numero}`;
  drawRight(numLabel, y - 4, 10.5, bold, dark);
  drawRight(`${ciudad}, ${fmtDMY(m.fechaEmision)}`, y - 20, 9.8, font, dark);

  y -= logoH + 24;

  const bodySize = 9.3;
  const lineH = 14;
  const blockW = Math.min(470, contentWidth);

  if (m.tipo === "CITACION_PREVENTIVO") {
    drawCentered("CITACIÓN A MANTENIMIENTO", y, 14, bold, dark);
    y -= 18;
    drawCentered("PREVENTIVO", y, 14, bold, dark);
    y -= 28;

    const citPad = 22;
    const citLeft = contentLeft + citPad;
    const citRight = contentRight - citPad;
    const citBlockW = Math.min(440, citRight - citLeft);

    const introCit =
      "Por medio del presente documento se solicita la presentación en taller del vehículo que se detalla a continuación, " +
      "con el objetivo de dar cumplimiento al programa de mantenimiento preventivo establecido según el kilometraje y las " +
      "recomendaciones del fabricante.";

    y = drawWrappedBlockLeft(introCit, y, bodySize, citBlockW, lineH, font, dark);
    y -= 10;

    const blue = rgb(0.12, 0.28, 0.55);

    const drawSectionTitle = (t) => {
      page.drawText(t, { x: citLeft, y, size: 10.5, font: bold, color: blue });
      y -= 10;
      page.drawLine({
        start: { x: citLeft, y },
        end: { x: citRight, y },
        thickness: 1,
        color: rgb(0.75, 0.82, 0.9),
      });
      y -= 16;
    };

    const labelX = citLeft;
    const valueX = citLeft + 190;
    const rowH = 16;

    const drawRow = (lab, val) => {
      page.drawText(lab, { x: labelX, y, size: 9.6, font: bold, color: dark });
      const lines = wrapText(String(val || "—"), font, 9.6, citRight - valueX);
      page.drawText(lines[0] || "—", { x: valueX, y, size: 9.6, font, color: dark });
      let yy = y;
      for (let i = 1; i < lines.length; i++) {
        yy -= 12;
        page.drawText(lines[i], { x: valueX, y: yy, size: 9.6, font, color: dark });
      }
      y = yy - rowH;
    };

    const citUnidad = m.citUnidadLectura || "Km";
    const citLect = fmtCL(parseIntLoose(m.citLecturaRaw));

    drawSectionTitle("1. ANTECEDENTES DEL VEHÍCULO");
    drawRow("* Patente:", m.patente || "—");
    drawRow("* Vehículo:", [m.marca, m.modelo].filter(Boolean).join(" ") || "—");
    drawRow("* Número interno:", m.numeroInterno || "—");
    drawRow("* Fecha citación:", fmtDMY(m.citFechaCitacion) || "—");
    drawRow("* Lectura actual:", citLect === "—" ? "—" : `${citLect} ${citUnidad}`);
    y -= 8;

    drawSectionTitle("2. DETALLE RESERVA EN SERVICIO TÉCNICO");
    drawRow("* Servicio:", m.citServicio || "—");
    drawRow("* Fecha atención:", fmtDMY(m.citFechaAtencion) || "—");
    drawRow("* Hora:", m.citHora || "—");
    drawRow("* Sucursal:", m.citSucursal || "—");

    y -= 6;

    const pA =
      "La intervención será realizada conforme a la pauta de mantenimiento establecida por kilometraje, ejecutándose las " +
      "actividades correspondientes al programa de mantenimiento preventivo del vehículo, de acuerdo con las recomendaciones del fabricante.";

    y = drawWrappedBlockLeft(pA, y, bodySize, citBlockW, lineH, font, dark);
    y -= 8;

    const pB =
      "Se solicita gestionar la disponibilidad de la unidad en la fecha indicada, con el propósito de garantizar la " +
      "continuidad operativa de la flota y asegurar el cumplimiento de los estándares de mantenimiento y confiabilidad " +
      "establecidos por la organización.";

    y = drawWrappedBlockLeft(pB, y, bodySize, citBlockW, lineH, font, dark);
    y -= 10;

    const signLineY = M + 120;

    let sig = null;
    const sigW = 170;
    let sigH = 0;
    try {
      const sigBytes = await fetchAsArrayBuffer(firmaSrc);
      sig = await pdfDoc.embedPng(sigBytes);
      sigH = (sig.height / sig.width) * sigW;
    } catch (e) {
      console.warn("Firma no pudo cargarse:", e);
    }

    page.drawLine({
      start: { x: width / 2 - 105, y: signLineY },
      end: { x: width / 2 + 105, y: signLineY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    if (sig) {
      page.drawImage(sig, { x: (width - sigW) / 2, y: signLineY + 12, width: sigW, height: sigH });
    }

    drawCentered(FIRMANTE.nombre, signLineY - 18, 10, bold, dark);
    drawCentered(FIRMANTE.rut, signLineY - 32, 9.2, font, dark);
    drawCentered(FIRMANTE.cargo, signLineY - 46, 9.2, font, dark);

    return await pdfDoc.save();
  }

  const tipoTxt = m.tipo === "MANTENCION" ? "MANTENCIÓN" : m.tipo === "OPERATIVIDAD" ? "OPERATIVIDAD" : "TORQUE";

  drawCentered(`CERTIFICADO DE ${tipoTxt}`, y, 12.5, bold, dark);
  y -= 32;

  const unidadLocal = m.unidadLectura || "Km";
  const placa = m.patente || "—";
  const interno = m.numeroInterno || "—";
  const cuerpo =
    m.cuerpoPrincipal ||
    "se encuentra con sus mantenciones y revisiones al día según la pauta del fabricante, encontrándose en condiciones para operar con normalidad.";

  const intro =
    `XT Servicios. Mediante el presente documento, certifica que el equipo identificado con la placa ${placa} ` +
    `Número interno ${interno}, ` +
    cuerpo;

  y = drawWrappedBlockLeft(intro, y, bodySize, blockW, lineH, font, dark);
  y -= 10;

  if (m.tipo === "MANTENCION" && !m.equipoNuevo) {
    const lecturaOT = fmtCL(parseIntLoose(m.kmOtRaw));
    const ultimaOT = m.ultimaOt || "—";
    const fechaUlt = fmtDMY(m.fechaUltimaOt);

    const p1 =
      `Su última mantención realizada el ${fechaUlt} a los ${lecturaOT} ${unidadLocal} y registrada con la orden de trabajo ` +
      `${ultimaOT}. Constata que la unidad se encuentra en condición estándar, tanto en su parte mecánica, hidráulica y estructural.`;

    y = drawWrappedBlockLeft(p1, y, bodySize, blockW, lineH, font, dark);
    y -= 10;

    const p2 = "Mantención realizada por personal calificado y certificado por representante de la marca de acuerdo a documento anexo.";
    y = drawWrappedBlockLeft(p2, y, bodySize, blockW, lineH, font, dark);
    y -= 16;
  }

  if (m.tipo === "MANTENCION" && m.equipoNuevo) {
    const pNew = "Se señala que el equipo es nuevo, y que se encuentra en óptimas condiciones para operar con normalidad.";
    y = drawWrappedBlockLeft(pNew, y, bodySize, blockW, lineH, font, dark);
    y -= 16;
  }

  if (m.tipo === "OPERATIVIDAD") {
    const pOp = `Se constata el estado: ${m.estadoOperatividad || "—"} (inspección: ${fmtDMY(m.fechaInspeccion)}).`;
    y = drawWrappedBlockLeft(pOp, y, bodySize, blockW, lineH, font, dark);
    y -= 12;

    if (m.observaciones) {
      y = drawWrappedBlockLeft(`Observaciones: ${m.observaciones}`, y, bodySize, blockW, lineH, font, dark);
      y -= 12;
    }
  }

  if (m.tipo === "TORQUE") {
    const lecturaOT = fmtCL(parseIntLoose(m.lecturaOtTorqueRaw));
    const ultimaOT = m.ultimaOtTorque || "—";
    const fechaUlt = fmtDMY(m.fechaUltimaOtTorque);

    const p1 =
      `Su última revisión de torque, realizada el día ${fechaUlt} a los ${lecturaOT} ${unidadLocal} y registrada con la orden de trabajo ` +
      `${ultimaOT}. Consta que la unidad se encuentra correctamente torqueada de acuerdo a manual de fabricante.`;

    y = drawWrappedBlockLeft(p1, y, bodySize, blockW, lineH, font, dark);
    y -= 10;

    const p2 = "Los valores de torque aplicados, se detallan en la tabla adjunta.";
    y = drawWrappedBlockLeft(p2, y, bodySize, blockW, lineH, font, dark);
    y -= 18;
  }

  drawCentered("Detalles del equipo", y, 10.5, bold, dark);
  y -= 18;

  const lecturaActual = fmtCL(parseIntLoose(m.kmActualRaw));
  const proxMant = fmtCL(parseIntLoose(m.proximaMantencionRaw));
  const proxTorque = fmtDMY(m.proximoTorqueFecha);

  const rowsAll = [
    ["* Marca:", m.marca || "—"],
    ["* Modelo:", m.modelo || "—"],
    ["* Tipo de equipo:", m.tipoEquipo || "—"],
    ["* N° Chasis:", m.numeroChasis || "—"],
    ["* N° Motor:", m.numeroMotor || "—"],
    ["* N° Interno:", m.numeroInterno || "—"],
    ["* Lectura actual:", `${lecturaActual}${lecturaActual === "—" ? "" : ` ${unidadLocal}`}`],
    ...(m.tipo === "MANTENCION" ? [["* Próxima Mantención:", `${proxMant}${proxMant === "—" ? "" : ` ${unidadLocal}`}`]] : []),
    ...(m.tipo === "TORQUE" ? [["* Próximo Torque:", proxTorque || "—"]] : []),
  ];

  const sizeDet = 9.2;
  const gap = 10;

  let maxLabelW = 0;
  let maxValueW = 0;
  for (const [lab, val] of rowsAll) {
    const labelW = bold.widthOfTextAtSize(lab, sizeDet);
    const valueW = font.widthOfTextAtSize(String(val ?? "—"), sizeDet);
    if (labelW > maxLabelW) maxLabelW = labelW;
    if (valueW > maxValueW) maxValueW = valueW;
  }

  let detailsBlockW = maxLabelW + gap + maxValueW;
  const maxAllowedW = blockW;
  if (detailsBlockW > maxAllowedW) {
    detailsBlockW = maxAllowedW;
    maxValueW = Math.max(60, detailsBlockW - maxLabelW - gap);
  }

  const blockX = (width - detailsBlockW) / 2;
  const valueX = blockX + maxLabelW + gap;
  const rowGap = 14;

  for (const [lab, val] of rowsAll) {
    const valueStr = String(val ?? "—");
    page.drawText(lab, { x: blockX, y, size: sizeDet, font: bold, color: dark });

    const valueLines = wrapText(valueStr, font, sizeDet, maxValueW);
    page.drawText(valueLines[0] || "—", { x: valueX, y, size: sizeDet, font, color: dark });

    let yy = y;
    for (let i = 1; i < valueLines.length; i++) {
      yy -= 12;
      page.drawText(valueLines[i], { x: valueX, y: yy, size: sizeDet, font, color: dark });
    }
    y = yy - rowGap;
  }

  y -= 6;
  const signLineY = M + 120;

  if (m.tipo === "TORQUE") {
    try {
      const imgBytes = await fetchAsArrayBuffer(torqueTablaSrc);
      const img = await pdfDoc.embedPng(imgBytes);

      const MAX_W = Math.min(340, blockW);
      const MAX_H = 160;
      const reservedBottomY = signLineY + 12 + 90;

      const rawW = MAX_W;
      const rawH = (img.height / img.width) * rawW;

      const availableH = Math.max(60, y - reservedBottomY);
      const scale = Math.min(1, MAX_W / rawW, MAX_H / rawH, availableH / rawH);

      const drawW = rawW * scale;
      const drawH = rawH * scale;

      const x = (width - drawW) / 2;
      const imgY = y - drawH;

      if (imgY >= reservedBottomY - 2) {
        page.drawImage(img, { x, y: imgY, width: drawW, height: drawH });
        y = imgY - 18;
      }
    } catch (e) {
      console.error("No se pudo incrustar Torque_equipos.png en PDF:", e);
      y -= 6;
    }
  }

  let sig = null;
  const sigW = 170;
  let sigH = 0;
  try {
    const sigBytes = await fetchAsArrayBuffer(firmaSrc);
    sig = await pdfDoc.embedPng(sigBytes);
    sigH = (sig.height / sig.width) * sigW;
  } catch (e) {
    console.warn("Firma no pudo cargarse:", e);
  }

  page.drawLine({
    start: { x: width / 2 - 105, y: signLineY },
    end: { x: width / 2 + 105, y: signLineY },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });

  if (sig) {
    page.drawImage(sig, { x: (width - sigW) / 2, y: signLineY + 12, width: sigW, height: sigH });
  }

  drawCentered(FIRMANTE.nombre, signLineY - 18, 10, bold, dark);
  drawCentered(FIRMANTE.rut, signLineY - 32, 9.2, font, dark);
  drawCentered(FIRMANTE.cargo, signLineY - 46, 9.2, font, dark);

  if (verificationUrl) {
    try {
      const qrPngDataUrl = await buildQrDataUrl(verificationUrl);
      const qrBytes = dataUrlToUint8Array(qrPngDataUrl);
      const qrImg = await pdfDoc.embedPng(qrBytes);

      const qrW = 95;
      const qrH = 95;
      const qrX = width - M - 16 - qrW;
      const qrY = M + 60;

      // ✅ QR logo = Servicios
      const smallLogoW = 95;
      const smallLogoH = (qrLogo.height / qrLogo.width) * smallLogoW;
      const smallLogoY = qrY + qrH + 8;

      page.drawImage(qrLogo, { x: qrX, y: smallLogoY, width: smallLogoW, height: smallLogoH });
      page.drawImage(qrImg, { x: qrX, y: qrY, width: qrW, height: qrH });
    } catch (e) {
      console.warn("No se pudo dibujar QR/logo en PDF:", e);
    }
  }

  return await pdfDoc.save();
}


async function generarPdfSolo() {
  if (!hasPreview.value) return;

  const numeroTemp = displayNumero.value === "—" ? "SN" : displayNumero.value;

  const verificationUrl = form.value.tipo === "CITACION_PREVENTIVO" ? null : null;

  const bytes = await buildPdfBytesFromModel(modelFromForm(), numeroTemp, verificationUrl);
  downloadPdf(bytes, buildPdfFilename());
}

function openHistorial() {
  histErr.value = "";
  histSearch.value = "";
  histTipoFilter.value = "";
  histModal?.show();
  loadHistorial();
}
function closeHistorial() {
  histErr.value = "";
  histModal?.hide();
}
const historialFiltrado = computed(() => {
  const q = norm(histSearch.value || "");
  const tipoSel = String(histTipoFilter.value || "").trim();

  return (histList.value || []).filter((c) => {
    const coincideTipo = !tipoSel || c.tipo === tipoSel;
    if (!coincideTipo) return false;

    if (!q) return true;

    const texto = [
      c.numero,
      c.tipo,
      c.interno,
      c.patente,
      c.fechaEmisionStr,
      c.marca,
      c.modelo,
    ]
      .map((v) => norm(v))
      .join(" ");

    return texto.includes(q);
  });
});
async function loadHistorial() {
  histLoading.value = true;
  histErr.value = "";

  try {
    const snap = await getDocs(collection(db, "certificados"));

    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      const eq = data.equipoSnapshot || {};

      const createdAtMs =
        data.createdAt?.toMillis?.() ||
        data.updatedAt?.toMillis?.() ||
        0;

      return {
        id: d.id,
        numero: Number(data.numero || 0),
        tipo: data.tipo || "",
        fechaEmisionStr: data.fechaEmisionStr || "",
        interno: eq.numeroInterno || "",
        patente: eq.patente || "",
        marca: eq.marca || "",
        modelo: eq.modelo || "",
        createdAtMs,
      };
    });

    items.sort((a, b) => {
      if (b.createdAtMs !== a.createdAtMs) return b.createdAtMs - a.createdAtMs;
      return (b.numero || 0) - (a.numero || 0);
    });

    histList.value = items;
  } catch (e) {
    console.error(e);
    histErr.value = "No se pudo cargar el historial. Revisa permisos/reglas y consola.";
  } finally {
    histLoading.value = false;
  }
}

const delId = ref(null);
const delNumero = ref(null);
const delBusy = ref(false);
const delErr = ref("");

function openDeleteConfirm(c) {
  delErr.value = "";
  delBusy.value = false;
  delId.value = c?.id || null;
  delNumero.value = c?.numero || null;
  delModal?.show();
}
function closeDeleteConfirm() {
  delErr.value = "";
  delModal?.hide();
}
async function confirmDelete() {
  if (!delId.value || delBusy.value) return;
  delBusy.value = true;
  delErr.value = "";
  try {
    await deleteDoc(doc(db, "certificados", delId.value));
    if (isEditing.value && editingId.value === delId.value) resetAll();
    await loadHistorial();
    delModal?.hide();
  } catch (e) {
    console.error(e);
    delErr.value = "No se pudo eliminar. Revisa permisos/reglas y consola.";
  } finally {
    delBusy.value = false;
  }
}

function limpiarDatosCertificadosManteniendoEquipo() {
  form.value.equipoNuevo = false;
  form.value.ultimaOt = "";
  form.value.fechaUltimaOt = "";
  form.value.kmOtRaw = "";
  form.value.kmActualRaw = "";
  form.value.proximaMantencionRaw = "";
  aplicarPreventivoAutomaticoDesdeEquipo(form.value.tipoEquipo);
  form.value.estadoOperatividad = "Operativo";
  form.value.fechaInspeccion = todayISO();
  form.value.observaciones = "";

  form.value.torqueEquipoNuevo = false;
  form.value.ultimaOtTorque = "";
  form.value.fechaUltimaOtTorque = "";
  form.value.lecturaOtTorqueRaw = "";
  form.value.proximoTorqueFecha = "";

  form.value.citServicio = "Reparación / Mantención preventiva";
  form.value.citFechaCitacion = todayISO();
  form.value.citFechaAtencion = "";
  form.value.citHora = "";
  form.value.citSucursal = "";
  form.value.citUnidadLectura = "Km";
  form.value.citLecturaRaw = "";

  form.value.fechaEmision = todayISO();
  form.value.numero = null;

  recalcMantencion();
  recalcTorque();
}

async function guardarCertificado() {
  if (saving.value) return;
  saving.value = true;
  saveOk.value = false;
  saveErr.value = "";
  lastSavedId.value = "";
  lastSavedNumero.value = null;

  try {
    if (isEditing.value && editingId.value) {
      const numero = Number(form.value.numero || editingNumero.value);
      const verificationId = editingId.value;

      const payload = buildPayload(numero, verificationId);
      delete payload.createdAt;
      payload.updatedAt = serverTimestamp();

      await updateDoc(doc(db, "certificados", editingId.value), payload);

      lastSavedId.value = editingId.value;
      lastSavedNumero.value = numero;
      saveOk.value = true;

      await refreshQrPreview();

      const withQr = form.value.tipo !== "CITACION_PREVENTIVO";
      const bytes = await buildPdfBytesFromModel(
        modelFromForm(),
        numero,
        withQr ? verifyUrlFromId(verificationId) : null
      );
      downloadPdf(bytes, buildPdfFilename());

      await loadHistorial();
      return;
    }

    const certificadosRef = collection(db, "certificados");
    const counterId = await resolveCounterDocIdByTipo(form.value.tipo);
    const counterRef = doc(db, "counters_certificados", counterId);

    const result = await runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef);

      let fallback = 1;
      if (form.value.tipo === "TORQUE") fallback = 192;
      if (form.value.tipo === "MANTENCION") fallback = 982;
      if (form.value.tipo === "OPERATIVIDAD") fallback = 1;
      if (form.value.tipo === "CITACION_PREVENTIVO") fallback = 1;

      const nextRaw = counterSnap.exists() ? Number(counterSnap.data()?.next) : fallback;
      const nextVal = Number.isFinite(nextRaw) && nextRaw >= 1 ? nextRaw : fallback;

      const numeroAsignado = nextVal;
      const nextToStore = nextVal + 1;

      tx.set(counterRef, { next: nextToStore, updatedAt: serverTimestamp(), tipo: form.value.tipo }, { merge: true });

      const newDocRef = doc(certificadosRef);
      const verificationId = newDocRef.id;

      const payload = buildPayload(numeroAsignado, verificationId);
      tx.set(newDocRef, payload);

      return { id: verificationId, numero: numeroAsignado, next: nextToStore };
    });

    lastSavedId.value = result.id;
    lastSavedNumero.value = result.numero;
    saveOk.value = true;

    await refreshQrPreview();

    const withQr = form.value.tipo !== "CITACION_PREVENTIVO";
    const bytes = await buildPdfBytesFromModel(
      modelFromForm(),
      result.numero,
      withQr ? verifyUrlFromId(result.id) : null
    );
    downloadPdf(bytes, buildPdfFilename());

    await loadHistorial();
    counterNext.value = result.next;

    limpiarDatosCertificadosManteniendoEquipo();
    await cargarProximoNumero();
  } catch (err) {
    console.error(err);
    saveErr.value = "Error guardando/actualizando o generando PDF. Revisa consola y reglas/permisos de Firestore.";
  } finally {
    saving.value = false;
  }
}

async function editarDesdeHistorial(c) {
  try {
    const snap = await getDoc(doc(db, "certificados", c.id));
    if (!snap.exists()) {
      alert("No se encontró el certificado.");
      return;
    }

    const data = snap.data() || {};
    const m = modelFromDoc(data);

    isEditing.value = true;
    editingId.value = c.id;
    editingNumero.value = data.numero || c.numero || null;

    form.value.tipo = m.tipo || "MANTENCION";
    form.value.fechaEmision = m.fechaEmision || todayISO();
    form.value.numero = Number(editingNumero.value || null);
    form.value.unidadLectura = m.unidadLectura || "Km";

    form.value.patente = m.patente || "";
    form.value.numeroInterno = m.numeroInterno || "";
    form.value.marca = m.marca || "";
    form.value.modelo = m.modelo || "";
    form.value.tipoEquipo = m.tipoEquipo || "";
    form.value.numeroChasis = m.numeroChasis || "";
    form.value.numeroMotor = m.numeroMotor || "";

    form.value.equipoNuevo = !!m.equipoNuevo;
    form.value.ultimaOt = m.ultimaOt || "";
    form.value.fechaUltimaOt = m.fechaUltimaOt || "";
    form.value.kmOtRaw = m.kmOtRaw || "";
    form.value.kmActualRaw = m.kmActualRaw || "";
    form.value.intervaloRaw = m.intervaloRaw || "10000";
    form.value.proximaMantencionRaw = m.proximaMantencionRaw || "";

    form.value.estadoOperatividad = m.estadoOperatividad || "Operativo";
    form.value.fechaInspeccion = m.fechaInspeccion || todayISO();
    form.value.observaciones = m.observaciones || "";

    form.value.torqueEquipoNuevo = !!m.torqueEquipoNuevo;
    form.value.ultimaOtTorque = m.ultimaOtTorque || "";
    form.value.fechaUltimaOtTorque = m.fechaUltimaOtTorque || "";
    form.value.lecturaOtTorqueRaw = m.lecturaOtTorqueRaw || "";
    form.value.proximoTorqueFecha = m.proximoTorqueFecha || "";
    form.value.citServicio = m.citServicio || "Reparación / Mantención preventiva";
    form.value.citFechaCitacion = m.citFechaCitacion || todayISO();
    form.value.citFechaAtencion = m.citFechaAtencion || "";
    form.value.citHora = m.citHora || "";
    form.value.citSucursal = m.citSucursal || "";
    form.value.citUnidadLectura = m.citUnidadLectura || "Km";
    form.value.citLecturaRaw = m.citLecturaRaw || "";

    const equipoId = data.equipoId || null;
    const found = equipoId ? equiposCache.value.find((x) => x.id === equipoId) : null;
    selectedEquipo.value = found || { id: equipoId || "snapshot", ...data.equipoSnapshot };

    recalcMantencion();
    recalcTorque();

    closeHistorial();
    window.scrollTo({ top: 0, behavior: "smooth" });

    await refreshQrPreview();
  } catch (e) {
    console.error(e);
    alert("No se pudo cargar para editar. Revisa consola.");
  }
}

async function reDescargarCertificado(c) {
  try {
    const snap = await getDoc(doc(db, "certificados", c.id));
    if (!snap.exists()) {
      alert("No se encontró el certificado.");
      return;
    }

    const data = snap.data() || {};
    const numero = data.numero || c.numero || "SN";
    const model = modelFromDoc(data);

    const withQr = model.tipo !== "CITACION_PREVENTIVO";
    const verificationUrl = withQr ? (data?.verificationUrl || (c.id ? verifyUrlFromId(c.id) : null)) : null;

    const bytes = await buildPdfBytesFromModel(model, numero, verificationUrl);
    downloadPdf(bytes, buildPdfFilename());
  } catch (e) {
    console.error(e);
    alert("No se pudo generar el PDF. Revisa consola.");
  }
}

function scrollToPreview() {
  const el = previewRef.value;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAll() {
  selectedEquipo.value = null;
  equipoSearch.value = "";
  isEditing.value = false;
  editingId.value = null;
  editingNumero.value = null;

  form.value.tipo = "MANTENCION";
  form.value.numero = null;
  form.value.unidadLectura = "Km";
  form.value.fechaEmision = todayISO();
  form.value.patente = "";
  form.value.numeroInterno = "";
  form.value.marca = "";
  form.value.modelo = "";
  form.value.tipoEquipo = "";
  form.value.numeroChasis = "";
  form.value.numeroMotor = "";
  form.value.equipoNuevo = false;
  form.value.ultimaOt = "";
  form.value.fechaUltimaOt = "";
  form.value.kmOtRaw = "";
  form.value.kmActualRaw = "";
  form.value.intervaloRaw = "";
  form.value.proximaMantencionRaw = "";
  form.value.estadoOperatividad = "Operativo";
  form.value.fechaInspeccion = todayISO();
  form.value.observaciones = "";
  form.value.torqueEquipoNuevo = false;
  form.value.ultimaOtTorque = "";
  form.value.fechaUltimaOtTorque = "";
  form.value.lecturaOtTorqueRaw = "";
  form.value.proximoTorqueFecha = "";
  form.value.citServicio = "Reparación / Mantención preventiva";
  form.value.citFechaCitacion = todayISO();
  form.value.citFechaAtencion = "";
  form.value.citHora = "";
  form.value.citSucursal = "";

  saveOk.value = false;
  saveErr.value = "";
  lastSavedId.value = "";
  lastSavedNumero.value = null;

  qrDataUrl.value = "";
  lastQrValue.value = "";

  cargarProximoNumero();
}

watch([lastSavedId, editingId, isEditing, () => form.value.tipo], async () => {
  await refreshQrPreview();
});

onMounted(async () => {
  await loadEquiposCache();
  await cargarProximoNumero();
});
</script>

<style scoped>
.cert-sheet {
  background: #fff;
  border: 1px solid rgba(0,0,0,.1);
  border-radius: 14px;
  min-height: 900px;
}
.cert-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
}
.cert-title {
  font-weight: 800;
  letter-spacing: .4px;
  font-size: 20px;
}
.cert-body {
  font-size: 14px;
  line-height: 1.55;
}
.cert-footer {
  border-top: 1px dashed rgba(0,0,0,.2);
  padding-top: 10px;
}

.cert-stamp{
  position: absolute;
  left: 18px;
  bottom: 120px;
  width: 140px;
  height: auto;
  opacity: .28;
  z-index: 2;
}

.qr-wrap{
  position:absolute;
  right: 18px;
  bottom: 120px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.qr-logo{
  width: 110px;
  height: auto;
  object-fit: contain;
  opacity: .95;
}
.qr-img{
  width: 110px;
  height: 110px;
  object-fit: contain;
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 8px;
  background: #fff;
  padding: 6px;
}

.section-title{
  font-weight: 800;
  letter-spacing: .2px;
  color: #1f4a87;
}
</style>
