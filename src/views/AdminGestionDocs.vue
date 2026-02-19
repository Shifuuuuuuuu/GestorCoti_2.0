<!-- src/views/AdminGestionDocs.vue -->
<template>
  <div class="container-fluid py-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0">Gestor de documentos</h4>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary" @click="openCreateLoteModal">
          <i class="bi bi-folder-plus me-1"></i> Nuevo lote
        </button>

        <select
          class="form-select"
          style="min-width: 280px"
          v-model="selectedLoteId"
          @change="onChangeLote"
          :disabled="lotesForTab.length === 0"
        >
          <option value="" disabled>Selecciona un lote…</option>
          <option v-for="l in lotesForTab" :key="l.id" :value="l.id">
            {{ l.nombre || ("Lote " + l.id.slice(0, 6)) }}
          </option>
        </select>

        <div class="btn-group">
          <button class="btn btn-outline-dark" :class="{ active: tab === 'staging' }" @click="tab = 'staging'">
            Local
          </button>
          <button class="btn btn-outline-dark" :class="{ active: tab === 'cloud' }" @click="tab = 'cloud'">
            Nube
          </button>
        </div>
      </div>
    </div>

    <div v-if="tab === 'staging' && lotesForTab.length === 0" class="alert alert-warning">
      No hay lotes <b>pendientes</b> para revisión local. Crea un lote nuevo.
    </div>
    <div v-else-if="tab === 'cloud' && lotesForTab.length === 0" class="alert alert-warning">
      No hay lotes en <b>en_revision</b> o <b>revision_completada</b> para ver en Firestore.
    </div>

    <div v-if="tab === 'staging'" class="row g-3">
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold">Borradores (local)</div>

            <div class="d-flex gap-2">
              <label
                class="btn btn-danger btn-sm mb-0"
                :class="{ disabled: loteLocked }"
                :title="
                  loteLocked
                    ? 'Este lote ya no está en pendiente. Crea un lote nuevo para subir.'
                    : ''
                "
              >
                <i class="bi bi-upload me-1"></i> Cargar PDFs
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  class="d-none"
                  @change="onPickFilesLocal"
                  :disabled="loteLocked"
                />
              </label>

              <button class="btn btn-outline-secondary btn-sm" @click="clearStaging" :disabled="staged.length === 0">
                <i class="bi bi-trash me-1"></i> Limpiar
              </button>
            </div>
          </div>

          <div class="card-body">
            <div v-if="loteLocked" class="alert alert-danger py-2">
              Este lote ya está en <b>{{ selectedLote?.estado || "en_revision" }}</b>. Para subir más PDFs, crea un lote
              nuevo.
            </div>

            <div v-if="localBusy" class="p-2 rounded border bg-light-subtle mb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm text-danger"></div>
                <div class="flex-grow-1">
                  <div class="small fw-semibold">Procesando PDFs…</div>
                  <div class="small text-muted">{{ localStatus }}</div>
                  <div class="progress mt-1" style="height: 8px">
                    <div
                      class="progress-bar bg-danger progress-bar-striped progress-bar-animated"
                      :style="{ width: localProgress + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="small fw-semibold">{{ localProgress }}%</div>
              </div>
            </div>

            <div class="d-flex gap-2 mb-2 flex-wrap">
              <span class="badge text-bg-secondary">Total: {{ staged.length }}</span>
              <span class="badge text-bg-primary">OC: {{ stagedCounts.oc }}</span>
              <span class="badge text-bg-warning">Facturas: {{ stagedCounts.factura }}</span>
              <span class="badge text-bg-info">Guías: {{ stagedCounts.guia }}</span>
              <span class="badge text-bg-danger">Incoherentes: {{ stagedCounts.bad }}</span>
              <span class="badge text-bg-dark">Sin OC: {{ stagedMissingRefOcCount }}</span>
            </div>

            <div class="list-group" style="max-height: 65vh; overflow: auto">
              <button
                v-for="s in staged"
                :key="s.id"
                type="button"
                class="list-group-item list-group-item-action"
                :class="{ active: selectedStageId === s.id }"
                @click="selectStage(s)"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="me-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="badge" :class="tipoBadge(s.tipo)">{{ (s.tipo || "factura").toUpperCase() }}</span>

                      <span v-if="s.tipo === 'oc' && s.numero" class="badge oc-strong-badge" title="OC">
                        OC N° {{ s.numero }}
                      </span>

                      <span v-else-if="s.tipo !== 'oc' && (s.refOc || '').trim()" class="badge text-bg-light" title="OC asociada">
                        OC: {{ s.refOc }}
                      </span>

                      <span v-else-if="s.tipo !== 'oc'" class="badge text-bg-danger" title="Falta OC asociada">
                        Sin OC
                      </span>

                      <span class="badge" :class="s.coherence?.ok ? 'text-bg-success' : 'text-bg-danger'">
                        {{ s.coherence?.ok ? "OK" : "REVISAR" }}
                      </span>
                      <span class="badge text-bg-light">{{ s.pagesCount }} pág</span>
                      <span v-if="s.tipo === 'oc' && !s.numero" class="badge text-bg-danger">FALTA N°</span>
                    </div>

                    <div class="fw-semibold mt-1 text-truncate" style="max-width: 360px">
                      {{ s.parentName }} · parte {{ s.partIndex }}/{{ s.totalParts }}
                    </div>

                    <small class="text-muted">
                      N°: <span class="fw-semibold">{{ s.numero || "—" }}</span>
                      <span v-if="s.tipo !== 'oc'">
                        · OC: <span class="fw-semibold">{{ s.refOc || "—" }}</span></span
                      >
                      · Páginas: {{ s.pageRange }}
                    </small>

                    <div v-if="!s.coherence?.ok" class="small text-danger mt-1">
                      <div v-for="(r, i) in s.coherence?.reasons || []" :key="i">• {{ r }}</div>
                    </div>
                  </div>

                  <div class="d-flex flex-column gap-1 align-items-end">
                    <button class="btn btn-outline-dark btn-sm" @click.stop="openEditStageModal(s)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" @click.stop="removeStage(s.id)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </button>

              <div v-if="staged.length === 0" class="text-muted text-center py-4">
                Sube PDFs. Esto separa 1 página = 1 documento y clasifica automáticamente.
              </div>
            </div>

            <div class="d-grid gap-2 mt-3">
              <button
                class="btn btn-success"
                @click="uploadStagingToLote"
                :disabled="!selectedLoteId || staged.length === 0 || uploadBusy || loteLocked"
              >
                <i class="bi bi-cloud-arrow-up me-1"></i> Subir lote
              </button>

              <div v-if="uploadBusy" class="mt-2">
                <div class="small text-muted d-flex justify-content-between">
                  <span>{{ uploadStatus }}</span>
                  <span class="fw-semibold">{{ uploadProgress }}%</span>
                </div>
                <div class="progress" style="height: 10px">
                  <div
                    class="progress-bar bg-success progress-bar-striped progress-bar-animated"
                    :style="{ width: uploadProgress + '%' }"
                  ></div>
                </div>
              </div>

              <small class="text-muted"> *Sube cada “parte” como documento separado. </small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="card shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div class="fw-semibold d-flex align-items-center gap-2 flex-wrap">
              Vista previa (local)
              <span v-if="selectedStageFull" class="badge" :class="tipoBadge(stageForm.tipo)">
                {{ (stageForm.tipo || "factura").toUpperCase() }}
              </span>

              <span v-if="selectedStageFull" class="badge text-bg-light">
                <template v-if="stageForm.tipo === 'oc'"> N°: {{ stageForm.numero || "—" }} </template>
                <template v-else> OC: {{ stageForm.refOc || "—" }} </template>
              </span>
            </div>

            <div class="d-flex gap-2">
              <button
                v-if="selectedStageFull && stageForm.tipo !== 'oc'"
                class="btn btn-outline-secondary btn-sm"
                type="button"
                @click="gotoNextStagingMissingRefOc(selectedStageFull.id)"
                :disabled="stagedMissingRefOcCount === 0"
                title="Ir al siguiente borrador sin OC"
              >
                Siguiente sin OC
              </button>

              <button
                v-if="selectedStageFull && !stagePreviewUrl"
                class="btn btn-outline-dark btn-sm"
                type="button"
                @click="openStagePreview"
              >
                <i class="bi bi-eye me-1"></i> Ver
              </button>

              <button
                v-if="stagePreviewUrl"
                class="btn btn-outline-secondary btn-sm"
                type="button"
                @click="closeStagePreview"
              >
                <i class="bi bi-eye-slash me-1"></i> Ocultar
              </button>
            </div>
          </div>

          <div class="card-body">
            <div v-if="selectedStageFull" class="mb-3 p-2 rounded border bg-light-subtle">
              <div class="d-flex flex-wrap gap-2 align-items-end">
                <div style="min-width: 180px">
                  <label class="form-label mb-1 small text-muted">Tipo</label>
                  <select class="form-select form-select-sm" v-model="stageForm.tipo" @change="onStageTipoChanged">
                    <option value="oc">OC</option>
                    <option value="factura">Factura</option>
                    <option value="guia">Guía</option>
                  </select>
                </div>

                <div class="flex-grow-1">
                  <label class="form-label mb-1 small text-muted">
                    <template v-if="stageForm.tipo === 'oc'"> Número <span class="text-danger">*</span> </template>
                    <template v-else> OC asociada <span class="text-danger">*</span> </template>
                  </label>

                  <div class="input-group input-group-sm">
                    <input
                      class="form-control"
                      v-model="stageMainValue"
                      :placeholder="stageForm.tipo === 'oc' ? 'Ej: 62570' : 'Ej: 62570 (OC asociada)'"
                      @keyup.enter="saveStageQuick"
                      :class="stageCanSave ? '' : 'is-invalid'"
                    />

                    <button
                      v-if="stageSuggested"
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="useStageSuggested(stageSuggested)"
                      title="Usar sugerido"
                    >
                      Sugerido: {{ stageSuggested }}
                    </button>

                    <button class="btn btn-dark" type="button" @click="saveStageQuick" :disabled="stageQuickSaving || !stageCanSave">
                      <i class="bi bi-check2 me-1"></i> Guardar
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="selectedStageFull && (selectedStageFull.ocCandidates?.length || selectedStageFull.refOc)" class="mt-2">
                <div class="small text-muted mb-1">Sugerencias detectadas (click para usar):</div>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    v-for="c in selectedStageFull.ocCandidates || []"
                    :key="c.value + ':' + c.score"
                    class="btn btn-outline-primary btn-sm"
                    type="button"
                    @click="useStageSuggested(c.value)"
                    :title="c.source + ' · score ' + c.score"
                  >
                    {{ c.value }}
                  </button>
                  <button
                    v-if="
                      selectedStageFull.refOc &&
                      !(selectedStageFull.ocCandidates || []).some((x) => x.value === selectedStageFull.refOc)
                    "
                    class="btn btn-outline-primary btn-sm"
                    type="button"
                    @click="useStageSuggested(selectedStageFull.refOc)"
                  >
                    {{ selectedStageFull.refOc }}
                  </button>
                </div>
              </div>

              <div v-if="stageForm.tipo !== 'oc'" class="small text-muted mt-2">
                Tip: escribe la OC y presiona <b>Enter</b> para guardar y avanzar al siguiente “Sin OC”.
              </div>
            </div>

            <div v-if="stagePreviewUrl" class="ratio ratio-1x1" style="min-height: 620px">
              <iframe :src="stagePreviewUrl" style="border: 0"></iframe>
            </div>
            <div v-else class="text-muted text-center py-5">Selecciona una parte para previsualizar.</div>
          </div>
        </div>
      </div>
    </div>


    <div v-else class="row g-3">
      <div v-if="!selectedLoteId" class="col-12">
        <div class="alert alert-warning">Selecciona un lote para empezar.</div>
      </div>

      <template v-else>
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div class="fw-semibold d-flex align-items-center gap-2 flex-wrap">
                <i class="bi bi-pen me-1"></i>
                Firma masiva (OCs aprobadas del lote)
                <span class="badge text-bg-success">Aprobadas sin firma: {{ ocsAprobadasSinFirma.length }}</span>
                <span class="badge text-bg-secondary">Seleccionadas: {{ selectedToSignIds.length }}</span>
              </div>

              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-dark btn-sm" @click="selectAllOcsToSign" :disabled="ocsAprobadasSinFirma.length === 0">
                  <i class="bi bi-check2-square me-1"></i> Seleccionar todas
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="clearSelectedOcsToSign" :disabled="selectedToSignIds.length === 0">
                  <i class="bi bi-eraser me-1"></i> Limpiar
                </button>

                <button class="btn btn-danger btn-sm" @click="openSignModal" :disabled="selectedToSignIds.length === 0">
                  <i class="bi bi-pen-fill me-1"></i> Firmar y guardar
                </button>
              </div>
            </div>

            <div class="card-body">
              <div v-if="ocsAprobadasSinFirma.length === 0" class="text-muted">
                No hay OCs aprobadas pendientes de firma en este lote.
              </div>

              <div v-else class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th style="width: 44px"></th>
                      <th style="width: 110px">OC</th>
                      <th>Archivo</th>
                      <th style="width: 140px">Estado</th>
                      <th style="width: 160px">Última actualización</th>
                      <th style="width: 120px" class="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in ocsAprobadasSinFirma" :key="d.id">
                      <td>
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :checked="selectedToSignIds.includes(d.id)"
                          @change="toggleSelectOcToSign(d.id)"
                        />
                      </td>
                      <td>
                        <span class="badge oc-strong-badge">OC {{ d.numero || "—" }}</span>
                      </td>
                      <td class="text-truncate" style="max-width: 520px">
                        {{ d.archivo?.name || d.origen?.parentName || d.id }}
                      </td>
                      <td>
                        <span class="badge text-bg-success">APROBADO</span>
                        <span class="badge text-bg-warning ms-1">SIN FIRMA</span>
                        <span v-if="!docHasAnySource(d)" class="badge text-bg-danger ms-1">SIN PDF</span>
                      </td>
                      <td class="small text-muted">
                        {{ docUpdatedAtText(d) }}
                      </td>
                      <td class="text-end">
                        <a v-if="pdfUrlForDoc(d)" class="btn btn-outline-dark btn-sm" :href="pdfUrlForDoc(d)" target="_blank">
                          <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                        <button v-else class="btn btn-outline-secondary btn-sm" disabled title="Sin url/storagePath">
                          <i class="bi bi-ban"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="small text-muted mt-2">
                  *Esto firma la <b>OC</b> y guarda el PDF firmado en <b>Firebase Storage</b>, actualizando el campo
                  <code>firmado</code> en Firestore.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Documentos del lote</div>
              <div class="btn-group">
                <button class="btn btn-outline-dark btn-sm" :class="{ active: filtroEstado === 'pendiente' }" @click="filtroEstado = 'pendiente'">
                  Pendientes
                </button>
                <button class="btn btn-outline-dark btn-sm" :class="{ active: filtroEstado === 'aprobado' }" @click="filtroEstado = 'aprobado'">
                  Aprobados
                </button>
                <button class="btn btn-outline-dark btn-sm" :class="{ active: filtroEstado === 'rechazado' }" @click="filtroEstado = 'rechazado'">
                  Rechazados
                </button>
                <button class="btn btn-outline-dark btn-sm" :class="{ active: filtroEstado === 'todos' }" @click="filtroEstado = 'todos'">
                  Todos
                </button>
                <button class="btn btn-outline-danger btn-sm" :class="{ active: filtroEstado === 'sin_oc' }" @click="filtroEstado = 'sin_oc'">
                  Sin OC ({{ docsSinOc.length }})
                </button>
              </div>
            </div>

            <div class="card-body">
              <input v-model="search" class="form-control mb-3" placeholder="Buscar por nombre / número / tipo…" />

              <div class="d-flex gap-2 mb-2 flex-wrap">
                <span class="badge text-bg-secondary">OC: {{ counts.oc }}</span>
                <span class="badge text-bg-secondary">Facturas: {{ counts.factura }}</span>
                <span class="badge text-bg-secondary">Guías: {{ counts.guia }}</span>
                <span class="badge text-bg-secondary">Rechazados: {{ counts.rechazado }}</span>
              </div>

              <div class="d-flex flex-wrap gap-2 mb-3">
                <button class="btn btn-outline-secondary btn-sm" @click="downloadLotePdfOrdenado" :disabled="!selectedLoteId || filteredDocs.length === 0">
                  <i class="bi bi-file-earmark-pdf me-1"></i>
                  Descargar lote (PDF en orden)
                </button>
              </div>

              <div class="list-group" style="max-height: 60vh; overflow: auto">
                <button
                  v-for="d in filteredDocs"
                  :key="d.id"
                  type="button"
                  class="list-group-item list-group-item-action"
                  :class="{ active: selectedDocId === d.id }"
                  @click="selectDoc(d)"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="me-2">
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="badge" :class="tipoBadge(d.tipo)">{{ d.tipo?.toUpperCase() || "—" }}</span>
                        <span class="badge" :class="estadoBadge(d.estado)">{{ d.estado || "—" }}</span>

                        <span v-if="d.tipo === 'oc' && d.numero" class="badge oc-strong-badge" title="Orden de compra">
                          OC N° {{ d.numero }}
                        </span>

                        <span v-else-if="docRefOc(d)" class="badge text-bg-light" title="OC asociada"> OC: {{ docRefOc(d) }} </span>

                        <span v-else-if="d.tipo !== 'oc'" class="badge text-bg-danger" title="Falta OC"> Sin OC </span>

                        <span v-if="d.tipo === 'oc' && d.estado === 'aprobado' && !d.firmado?.url" class="badge text-bg-warning">
                          sin firma
                        </span>
                        <span v-if="d.tipo === 'oc' && d.firmado?.url" class="badge text-bg-success">
                          firmada
                        </span>
                      </div>

                      <div class="fw-semibold mt-1 text-truncate" style="max-width: 320px">
                        {{ d.archivo?.name || "PDF" }}
                      </div>

                      <small class="text-muted">
                        N°: <span class="fw-semibold">{{ d.numero || "—" }}</span>
                        <span v-if="d.origen?.pageRange"> · Páginas: {{ d.origen.pageRange }}</span>
                      </small>
                      <div
                        v-if="d.estado === 'rechazado' && hasRechazoMotivo(d)"
                        class="small text-danger mt-1"
                        style="white-space: normal"
                      >
                        <i class="bi bi-chat-left-text me-1"></i>
                        <b>Motivo:</b> {{ rechazoMotivo(d) }}
                      </div>
                    </div>
                  </div>
                </button>

                <div v-if="filteredDocs.length === 0" class="text-muted text-center py-4">Sin documentos con ese filtro.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header">
              <div class="d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-center">
                <div>
                  <div class="fw-semibold">Visor comparativo</div>
                  <small class="text-muted">Selecciona dos documentos para verlos lado a lado.</small>
                </div>
                <div class="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Izq.</span>
                    <select class="form-select form-select-sm" v-model="leftDocId">
                      <option value="">—</option>
                      <option v-for="d in docsOrdered" :key="'L' + d.id" :value="d.id">
                        {{ labelDoc(d) }}
                      </option>
                    </select>
                  </div>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">Der.</span>
                    <select class="form-select form-select-sm" v-model="rightDocId">
                      <option value="">—</option>
                      <option v-for="d in docsOrdered" :key="'R' + d.id" :value="d.id">
                        {{ labelDoc(d) }}
                      </option>
                    </select>
                  </div>
                  <button class="btn btn-outline-secondary btn-sm" type="button" @click="swapSides" :disabled="!leftDocId && !rightDocId">
                    <i class="bi bi-arrow-left-right me-1"></i> Intercambiar
                  </button>
                </div>
              </div>
            </div>

            <div class="card-body">
              <div
                v-if="selectedDoc && selectedDoc.estado === 'rechazado' && hasRechazoMotivo(selectedDoc)"
                class="alert alert-danger py-2"
              >
                <i class="bi bi-x-octagon me-2"></i>
                <b>Documento rechazado:</b> {{ rechazoMotivo(selectedDoc) }}
              </div>

              <div v-if="selectedDocNeedsOc" class="mb-3 p-2 rounded border bg-light-subtle">
                <div class="small text-muted mb-2">
                  Esta <b>{{ selectedDoc?.tipo }}</b> no tiene OC detectada. Escribe la OC, guarda y avanzará a la siguiente “Sin OC”.
                </div>

                <div class="input-group input-group-sm">
                  <span class="input-group-text">OC</span>
                  <input class="form-control" v-model="refOcDraft" placeholder="Ej: 62570" @keyup.enter="saveRefOcAndNext" />
                  <button class="btn btn-dark" type="button" @click="saveRefOcAndNext" :disabled="savingRefOc || !refOcDraft.trim()">
                    <span v-if="!savingRefOc"><i class="bi bi-check2 me-1"></i> Guardar y siguiente</span>
                    <span v-else><span class="spinner-border spinner-border-sm me-2"></span>Guardando…</span>
                  </button>
                  <button class="btn btn-outline-secondary" type="button" @click="gotoNextMissingOc(selectedDoc?.id)">Siguiente sin OC</button>
                </div>

                <div class="small text-muted mt-2">
                  Pendientes sin OC: <b>{{ docsSinOc.length }}</b>
                </div>
              </div>

              <div class="row g-2">
                <div class="col-12 col-md-6">
                  <div class="border rounded p-2 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="fw-semibold small">{{ leftDocTitle }}</div>
                      <a v-if="leftUrl" class="btn btn-outline-dark btn-sm" :href="leftUrl" target="_blank">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                    <div v-if="leftUrl" class="ratio ratio-1x1" style="min-height: 420px">
                      <iframe :src="leftUrl" style="border: 0"></iframe>
                    </div>
                    <div v-else class="text-muted text-center py-5">Selecciona un documento para este lado.</div>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="border rounded p-2 h-100">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="fw-semibold small">{{ rightDocTitle }}</div>
                      <a v-if="rightUrl" class="btn btn-outline-dark btn-sm" :href="rightUrl" target="_blank">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                    <div v-if="rightUrl" class="ratio ratio-1x1" style="min-height: 420px">
                      <iframe :src="rightUrl" style="border: 0"></iframe>
                    </div>
                    <div v-else class="text-muted text-center py-5">Selecciona un documento para este lado.</div>
                  </div>
                </div>
              </div>

              <div v-if="rightDoc && rightDoc.tipo === 'oc' && rightDoc.estado === 'aprobado' && !rightDoc.firmado?.url" class="alert alert-warning mt-3 mb-0">
                <i class="bi bi-info-circle me-2"></i>Esta OC está <b>aprobada</b> pero aún <b>no firmada</b>. Puedes firmarla arriba en “Firma masiva”.
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="modal fade" ref="createLoteModalEl" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo lote</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">Nombre</label>
            <input v-model="newLoteNombre" class="form-control" placeholder="Ej: Lote Diciembre" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" @click="createLote">Crear</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="editStageModalEl" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar borrador</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="editStage">
            <label class="form-label">Tipo</label>
            <select class="form-select mb-2" v-model="editStage.tipo">
              <option value="oc">OC</option>
              <option value="factura">Factura</option>
              <option value="guia">Guía</option>
            </select>

            <label class="form-label">
              <template v-if="editStage.tipo === 'oc'">Número</template>
              <template v-else>OC asociada</template>
            </label>

            <input class="form-control" v-model="editStageMainValue" placeholder="Ej: 62570" />
            <div class="form-text">En OC completa el número; en factura/guía completa la OC asociada para emparejar.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-dark" @click="saveEditStage">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="signModalEl" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Firmar y guardar
              <span class="badge text-bg-secondary ms-2">{{ selectedToSignIds.length }}</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="alert alert-light border mb-3">
              Se firmarán las OCs seleccionadas y se guardará el PDF firmado en Storage.
            </div>

            <div class="small text-muted mb-1">Firma:</div>
              <div class="border rounded p-2 bg-light-subtle d-flex justify-content-center">
                <img :src="firmaAlejandroUrl" alt="Firma Alejandro" style="max-height: 140px; max-width: 100%; object-fit: contain" />
            </div>

            <div v-if="signValidationError" class="alert alert-danger mt-3 mb-0">
              <i class="bi bi-exclamation-triangle me-2"></i>{{ signValidationError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger" @click="signSelectedOcs" :disabled="!canSignNow">
              <i class="bi bi-pen-fill me-1"></i> Firmar y guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="localBusy || uploadBusy || exportBusy || signBusy" class="busy-overlay">
        <div class="busy-card shadow-lg">
          <div class="d-flex align-items-center gap-3">
            <div class="busy-icon">
              <div class="spinner-border text-danger" role="status" v-if="localBusy && !uploadBusy && !exportBusy && !signBusy"></div>
              <div class="spinner-border text-success" role="status" v-else-if="uploadBusy"></div>
              <div class="spinner-border text-secondary" role="status" v-else-if="exportBusy"></div>
              <div class="spinner-border text-danger" role="status" v-else></div>
            </div>

            <div class="flex-grow-1">
              <div class="fw-semibold">
                {{
                  uploadBusy
                    ? "Subiendo lote a Firestore…"
                    : exportBusy
                      ? "Generando PDF del lote…"
                      : signBusy
                        ? "Firmando OCs…"
                        : "Procesando PDFs…"
                }}
              </div>
              <div class="small text-muted">
                {{
                  uploadBusy
                    ? uploadStatus
                    : exportBusy
                      ? exportStatus
                      : signBusy
                        ? signStatus
                        : localStatus
                }}
              </div>

              <div class="progress mt-2" style="height: 10px">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  :class="uploadBusy ? 'bg-success' : exportBusy ? 'bg-secondary' : 'bg-danger'"
                  :style="{
                    width:
                      (uploadBusy ? uploadProgress : exportBusy ? exportProgress : signBusy ? signProgress : localProgress) + '%',
                  }"
                ></div>
              </div>

              <div class="d-flex justify-content-between mt-1 small text-muted">
                <span>{{ uploadBusy ? uploadProgress : exportBusy ? exportProgress : signBusy ? signProgress : localProgress }}%</span>
                <span v-if="uploadBusy && uploadBytesTotal">{{ fmtBytes(uploadBytesDone) }} / {{ fmtBytes(uploadBytesTotal) }}</span>
              </div>
            </div>
          </div>

          <div class="busy-tip mt-3 small text-muted">No cierres la pestaña mientras termina 🙏</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as bootstrap from "bootstrap";

import { splitPdfPack } from "@/utils/pdfPackSplitter";
import { stagePut, stageList, stageDelete, stageClear, stageGet } from "@/services/stagingDb";
import { useAuthStore } from "@/stores/authService";
import firmaAlejandroUrl from "@/assets/firma-alejandro.png";

import { signPdfWithImageSmart } from "@/utils/ocSigner";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL, getBytes } from "firebase/storage";

const db = getFirestore();
const storage = getStorage();

const auth = useAuthStore();
const actorName = computed(
  () => auth?.profile?.Nombre_completo || auth?.profile?.nombre || auth?.user?.displayName || auth?.user?.email || "usuario"
);

const tab = ref("staging");

const lotes = ref([]);
const selectedLoteId = ref("");
const docs = ref([]);
const selectedDocId = ref(null);

const filtroEstado = ref("pendiente");
const search = ref("");

const leftDocId = ref("");
const rightDocId = ref("");

const staged = ref([]);
const selectedStageId = ref(null);
const selectedStageFull = ref(null);
const stagePreviewUrl = ref("");
const localBusy = ref(false);
const uploadBusy = ref(false);
const exportBusy = ref(false);

const localProgress = ref(0);
const localStatus = ref("");

const uploadProgress = ref(0);
const uploadStatus = ref("");

const exportProgress = ref(0);
const exportStatus = ref("");
const uploadBytesDone = ref(0);
const uploadBytesTotal = ref(0);

const signBusy = ref(false);
const signProgress = ref(0);
const signStatus = ref("");

const signModalEl = ref(null);
let signModal;

const signaturePreviewUrl = ref("");
const signValidationError = ref("");

const selectedToSignIds = ref([]);

function normalizeText(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normEstado(s) {
  const v = normalizeText(String(s || ""));
  if (!v) return "pendiente";

  if (v === "pendiente") return "pendiente";
  if (v === "en revision" || v === "en-revision" || v === "en_revision") return "en_revision";

  if (
    v === "revision_completada" ||
    v === "revision completada" ||
    v === "revisión completada" ||
    v === "revision_completa" ||
    v === "revision completa" ||
    v === "revisión completa"
  ) {
    return "revision_completada";
  }

  if (
    v === "doc_descargados" ||
    v === "docs_descargados" ||
    v === "documentos descargados" ||
    v === "documentos_descargados"
  ) {
    return "doc_descargados";
  }

  return v;
}

const lotesForTab = computed(() => {
  const t = tab.value;

  if (t === "staging") {
    return lotes.value.filter((l) => normEstado(l.estado) === "pendiente");
  }


  return lotes.value.filter((l) => {
    const st = normEstado(l.estado);
    return st === "en_revision" || st === "revision_completada" || st === "doc_descargados";
  });
});

function ensureSelectedLoteForTab() {
  const list = lotesForTab.value;

  if (!list.length) {
    selectedLoteId.value = "";
    docs.value = [];
    selectedDocId.value = null;
    leftDocId.value = "";
    rightDocId.value = "";
    refOcDraft.value = "";
    if (unsubDocs) unsubDocs();
    unsubDocs = null;
    return;
  }

  const exists = list.some((l) => l.id === selectedLoteId.value);
  if (!selectedLoteId.value || !exists) {
    selectedLoteId.value = list[0].id;
  }

  if (tab.value === "cloud") onChangeLote();
}

const selectedLote = computed(() => lotes.value.find((x) => x.id === selectedLoteId.value) || null);
const loteLocked = computed(() => {
  const st = String(selectedLote.value?.estado || "pendiente");
  return normEstado(st) !== "pendiente";
});

function fmtBytes(n) {
  const v = Number(n || 0);
  if (!v) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = v;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function getSelectedLoteSafeName(suffix) {
  const lote = lotes.value.find((x) => x.id === selectedLoteId.value) || null;
  const base = (lote?.nombre || `Lote_${(selectedLoteId.value || "").slice(0, 6)}`).replace(/[^\w\-]+/g, "_");
  return `${base}_${suffix}`;
}

async function getDocBytesPreferStorage(d) {
  const sp = d?.firmado?.storagePath || d?.archivo?.storagePath || "";
  if (sp) {
    return await getBytes(sRef(storage, sp));
  }
  const url = d?.firmado?.url || d?.archivo?.url || "";
  if (!url) throw new Error("Documento sin storagePath ni url");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("No se pudo descargar el documento");
  return new Uint8Array(await resp.arrayBuffer());
}

function isPdfDoc(d) {
  const name = String(d?.archivo?.name || "").toLowerCase();
  const mime = String(d?.archivo?.mime || d?.archivo?.type || "").toLowerCase();
  const sp = String(d?.archivo?.storagePath || d?.firmado?.storagePath || "").toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf") || sp.endsWith(".pdf");
}

function wrapText(font, text, size, maxWidth) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return ["—"];
  const words = t.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function addRejectedSummary(outPdf, list) {
  const font = await outPdf.embedFont(StandardFonts.Helvetica);
  const bold = await outPdf.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 36;

  let page = outPdf.addPage([pageW, pageH]);
  let y = pageH - margin;

  const drawHeader = () => {
    page.drawText("Resumen de documentos rechazados", { x: margin, y, size: 16, font: bold });
    y -= 22;

    page.drawText(`Total: ${list.length}`, { x: margin, y, size: 10, font });
    y -= 18;

    page.drawText("OC", { x: margin, y, size: 9, font: bold });
    page.drawText("Tipo/N°", { x: margin + 70, y, size: 9, font: bold });
    page.drawText("Archivo", { x: margin + 150, y, size: 9, font: bold });
    page.drawText("Motivo", { x: margin + 320, y, size: 9, font: bold });
    y -= 12;

    page.drawLine({
      start: { x: margin, y },
      end: { x: pageW - margin, y },
      thickness: 1,
      color: rgb(0.75, 0.75, 0.75),
    });
    y -= 10;
  };

  drawHeader();

  for (const d of list) {
    const oc = docRefOc(d) || (d.tipo === "oc" ? String(d.numero || "").trim() : "");
    const tipoNum = `${(d.tipo || "—").toUpperCase()} ${d.numero ? `N° ${d.numero}` : ""}`.trim();
    const archivo = d.archivo?.name || d.origen?.parentName || d.id;

    const motivo = d?.motivo || d?.rechazo?.motivo || "—";
    const motivoLines = wrapText(font, motivo, 9, pageW - 36 - (36 + 320));
    const rowH = Math.max(14, motivoLines.length * 10);

    if (y - rowH < margin + 20) {
      page = outPdf.addPage([pageW, pageH]);
      y = pageH - margin;
      drawHeader();
    }

    page.drawText(String(oc || "—"), { x: margin, y, size: 9, font });
    page.drawText(tipoNum || "—", { x: margin + 70, y, size: 9, font });
    page.drawText(archivo, { x: margin + 150, y: y, size: 9, font });

    let my = y;
    for (const ln of motivoLines.slice(0, 6)) {
      page.drawText(ln, { x: margin + 320, y: my, size: 9, font });
      my -= 10;
    }

    y -= rowH;
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: pageW - margin, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= 6;
  }
}


async function markLoteDownloadProgress(estadoName) {
  if (!selectedLoteId.value) return;

  const lote = selectedLote.value || null;
  const prev = lote?.descargas || {};
  const now = serverTimestamp();

  const prevA = !!prev?.aprobadoAt;
  const prevR = !!prev?.rechazadoAt;
  const prevT = !!prev?.todosAt;

  const nextA = prevA || estadoName === "aprobado";
  const nextR = prevR || estadoName === "rechazado";
  const nextT = prevT || estadoName === "todos";

  const payload = {
    updatedAt: now,
    updatedBy: actorName.value,
    "descargas.lastAt": now,
    "descargas.lastBy": actorName.value,
    "descargas.lastFiltro": estadoName,
  };

  if (estadoName === "aprobado") {
    payload["descargas.aprobadoAt"] = now;
    payload["descargas.aprobadoBy"] = actorName.value;
  } else if (estadoName === "rechazado") {
    payload["descargas.rechazadoAt"] = now;
    payload["descargas.rechazadoBy"] = actorName.value;
  } else if (estadoName === "todos") {
    payload["descargas.todosAt"] = now;
    payload["descargas.todosBy"] = actorName.value;
  }

  const shouldFinalize = nextT || (nextA && nextR);

  if (shouldFinalize) {
    payload.estado = "doc_descargados";
    payload.descargadosAt = now;
    payload.descargadosBy = actorName.value;
  }

  await updateDoc(doc(db, "lotes_docs", selectedLoteId.value), payload);

  await addHist("lote_descarga", {
    filtro: estadoName,
    finalizado: shouldFinalize,
  });

  if (shouldFinalize) {
    await addHist("lote_estado", { estado: "doc_descargados" });
  }
}

async function downloadLotePdfOrdenado() {
  const list = filteredDocs.value;
  if (!selectedLoteId.value || !list.length) return;

  exportBusy.value = true;
  exportProgress.value = 0;
  exportStatus.value = `Preparando… (0/${list.length})`;

  try {
    const estadoName = filtroEstado.value || "todos";

    const fileName = getSelectedLoteSafeName(
      estadoName === "rechazado" ? "rechazadas_con_motivo.pdf" : `docs_${estadoName}.pdf`
    );

    const outPdf = await PDFDocument.create();

    const exportRejectedWithReason = estadoName === "rechazado";
    const stampFont = exportRejectedWithReason ? await outPdf.embedFont(StandardFonts.HelveticaBold) : null;

    const sorted = [...list].sort((a, b) => {
      const nameA = a.origen?.parentName || "";
      const nameB = b.origen?.parentName || "";
      const cmpName = nameA.localeCompare(nameB);
      if (cmpName !== 0) return cmpName;

      const idxA = a.origen?.partIndex || 0;
      const idxB = b.origen?.partIndex || 0;
      if (idxA !== idxB) return idxA - idxB;

      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tA - tB;
    });

    if (exportRejectedWithReason) {
      await addRejectedSummary(outPdf, sorted);
    }

    for (let i = 0; i < sorted.length; i++) {
      const d = sorted[i];

      const pretty = d.archivo?.name || d.origen?.parentName || d.id;
      exportStatus.value = `Agregando ${i + 1}/${sorted.length}: ${pretty}`;
      exportProgress.value = Math.min(99, Math.round((i / Math.max(1, sorted.length)) * 100));

      try {
        const bytes = await getDocBytesPreferStorage(d);

        if (!isPdfDoc(d)) {
          exportProgress.value = Math.min(99, Math.round(((i + 1) / Math.max(1, sorted.length)) * 100));
          continue;
        }

        const srcPdf = await PDFDocument.load(bytes);
        const srcPages = srcPdf.getPages();
        const copiedPages = await outPdf.copyPages(
          srcPdf,
          srcPages.map((_, idx) => idx)
        );

        if (exportRejectedWithReason && copiedPages.length) {
          const motivo = String(d?.motivo || d?.rechazo?.motivo || "").trim();
          if (motivo) {
            const p0 = copiedPages[0];
            const msg = `RECHAZADO: ${motivo}`;
            const maxW = p0.getWidth() - 60;
            const lines = wrapText(stampFont, msg, 10, maxW).slice(0, 2);

            let yy = p0.getHeight() - 28;
            for (const ln of lines) {
              p0.drawText(ln, {
                x: 30,
                y: yy,
                size: 10,
                font: stampFont,
                color: rgb(0.75, 0, 0),
                opacity: 0.85,
              });
              yy -= 12;
            }
          }
        }

        copiedPages.forEach((p) => outPdf.addPage(p));
      } catch (err) {
        console.error("Error agregando doc al lote PDF", d.id, err);
      }

      exportProgress.value = Math.min(99, Math.round(((i + 1) / Math.max(1, sorted.length)) * 100));
    }

    exportStatus.value = "Generando PDF final…";
    exportProgress.value = 99;

    const finalBytes = await outPdf.save({ useObjectStreams: true });
    const blob = new Blob([finalBytes], { type: "application/pdf" });

    exportProgress.value = 100;
    exportStatus.value = "Listo ✅ Descargando…";
    downloadBlob(blob, fileName);
    await markLoteDownloadProgress(estadoName);

  } finally {
    setTimeout(() => {
      exportBusy.value = false;
      exportProgress.value = 0;
      exportStatus.value = "";
    }, 450);
  }
}

function docRefOc(d) {
  const manual = String(d?.refOc || "").trim();
  if (manual) return manual;
  const det = String(d?.deteccion?.refOc || "").trim();
  return det;
}

function ocKeyOfDoc(d) {
  if (!d) return "";
  if (d.tipo === "oc") return String(d.numero || "").trim();
  return docRefOc(d);
}

function ocKeyToNumber(k) {
  const s = String(k || "").trim();
  if (!s) return Number.MAX_SAFE_INTEGER;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function tipoPriority(t) {
  if (t === "oc") return 0;
  if (t === "factura") return 1;
  if (t === "guia") return 2;
  return 9;
}

const docsOrdered = computed(() => {
  const arr = [...docs.value];
  return arr.sort((a, b) => {
    const ka = ocKeyOfDoc(a);
    const kb = ocKeyOfDoc(b);

    const na = ocKeyToNumber(ka);
    const nb = ocKeyToNumber(kb);

    const aNo = !ka;
    const bNo = !kb;
    if (aNo !== bNo) return aNo ? 1 : -1;

    if (na !== nb) return na - nb;
    const cmpK = String(ka).localeCompare(String(kb), undefined, { numeric: true, sensitivity: "base" });
    if (cmpK !== 0) return cmpK;

    const pa = tipoPriority(a.tipo);
    const pb = tipoPriority(b.tipo);
    if (pa !== pb) return pa - pb;

    const fa = String(a.numero || a.archivo?.name || "");
    const fb = String(b.numero || b.archivo?.name || "");
    return fa.localeCompare(fb, undefined, { numeric: true, sensitivity: "base" });
  });
});

const docsSinOc = computed(() => docsOrdered.value.filter((d) => d.tipo !== "oc" && !docRefOc(d)));

const stageForm = ref({ tipo: "factura", numero: "", refOc: "" });
const stageQuickSaving = ref(false);

const stageMainValue = computed({
  get() {
    return stageForm.value.tipo === "oc" ? stageForm.value.numero : stageForm.value.refOc;
  },
  set(v) {
    if (stageForm.value.tipo === "oc") stageForm.value.numero = v;
    else stageForm.value.refOc = v;
  },
});

const stageCanSave = computed(() => {
  const t = stageForm.value.tipo;
  if (t === "oc") return !!String(stageForm.value.numero || "").trim();
  return !!String(stageForm.value.refOc || "").trim();
});

const stageSuggested = computed(() => {
  const s = selectedStageFull.value;
  if (!s) return "";
  const cand = (s.ocCandidates || [])[0]?.value || s.refOc || "";
  return String(cand || "").trim();
});

const stagedMissingRefOcCount = computed(() => staged.value.filter((x) => x.tipo !== "oc" && !String(x.refOc || "").trim()).length);

function findNextStagingMissingRefOc(afterId) {
  const list = staged.value || [];
  if (!list.length) return null;

  let idx = list.findIndex((x) => x.id === afterId);
  if (idx < 0) idx = -1;

  for (let step = 1; step <= list.length; step++) {
    const it = list[(idx + step) % list.length];
    if (it && it.tipo !== "oc" && !String(it.refOc || "").trim()) return it;
  }
  return null;
}

async function gotoNextStagingMissingRefOc(afterId) {
  const next = findNextStagingMissingRefOc(afterId);
  if (next) await selectStage(next);
  else alert("✅ No quedan facturas/guías sin OC en borradores.");
}

const createLoteModalEl = ref(null);
const editStageModalEl = ref(null);
let createLoteModal, editStageModal;

const newLoteNombre = ref("");
const editStage = ref(null);

const editStageMainValue = computed({
  get() {
    if (!editStage.value) return "";
    return editStage.value.tipo === "oc" ? editStage.value.numero || "" : editStage.value.refOc || "";
  },
  set(v) {
    if (!editStage.value) return;
    if (editStage.value.tipo === "oc") editStage.value.numero = v;
    else editStage.value.refOc = v;
  },
});

const tipoBadge = (t) => {
  if (t === "oc") return "text-bg-primary";
  if (t === "factura") return "text-bg-warning";
  if (t === "guia") return "text-bg-info";
  return "text-bg-secondary";
};
const estadoBadge = (s) => {
  if (s === "aprobado") return "text-bg-success";
  if (s === "rechazado") return "text-bg-danger";
  if (s === "reemplazado") return "text-bg-secondary";
  return "text-bg-dark";
};
const labelDoc = (d) => {
  const n = d?.numero ? `N°${d.numero}` : "Sin N°";
  const nm = d?.archivo?.name ? d.archivo.name : d?.id ? d.id.slice(0, 6) : "doc";
  return `${n} · ${nm}`;
};

const counts = computed(() => {
  const c = { oc: 0, factura: 0, guia: 0, rechazado: 0 };
  for (const d of docs.value) {
    if (d.tipo === "oc") c.oc++;
    if (d.tipo === "factura") c.factura++;
    if (d.tipo === "guia") c.guia++;
    if (d.estado === "rechazado") c.rechazado++;
  }
  return c;
});

const filteredDocs = computed(() => {
  const q = search.value.trim().toLowerCase();

  return docsOrdered.value
    .filter((d) => {
      if (filtroEstado.value === "todos") return true;
      if (filtroEstado.value === "sin_oc") return d.tipo !== "oc" && !docRefOc(d);
      return d.estado === filtroEstado.value;
    })
    .filter((d) => {
      if (!q) return true;
      const hay = [d.archivo?.name, d.numero, d.tipo, d.estado, docRefOc(d)].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
});

const leftDoc = computed(() => docs.value.find((d) => d.id === leftDocId.value) || null);
const rightDoc = computed(() => docs.value.find((d) => d.id === rightDocId.value) || null);

const pdfUrlForDoc = (d) => (d ? d.firmado?.url || d.archivo?.url || "" : "");

const leftUrl = computed(() => makeViewerUrl(pdfUrlForDoc(leftDoc.value)));
const rightUrl = computed(() => makeViewerUrl(pdfUrlForDoc(rightDoc.value)));


const leftDocTitle = computed(() => (leftDoc.value ? labelDoc(leftDoc.value) : "Documento izquierdo"));
const rightDocTitle = computed(() => (rightDoc.value ? labelDoc(rightDoc.value) : "Documento derecho"));

const stagedCounts = computed(() => {
  const c = { oc: 0, factura: 0, guia: 0, bad: 0 };
  for (const s of staged.value) {
    if (s.tipo === "oc") c.oc++;
    if (s.tipo === "factura") c.factura++;
    if (s.tipo === "guia") c.guia++;
    if (!s.coherence?.ok) c.bad++;
  }
  return c;
});

const selectedDoc = computed(() => docs.value.find((d) => d.id === selectedDocId.value) || null);
const selectedDocNeedsOc = computed(() => !!selectedDoc.value && selectedDoc.value.tipo !== "oc" && !docRefOc(selectedDoc.value));

const refOcDraft = ref("");
const savingRefOc = ref(false);

watch(
  selectedDoc,
  (d) => {
    refOcDraft.value = docRefOc(d) || "";
  },
  { immediate: true }
);

function findOcDocByNumero(ocNumero) {
  const n = String(ocNumero || "").trim();
  if (!n) return null;
  return docs.value.find((d) => d.tipo === "oc" && String(d.numero || "").trim() === n) || null;
}

function gotoNextMissingOc(afterId) {
  const list = docsSinOc.value;
  if (!list.length) {
    alert("✅ No quedan facturas/guías sin OC.");
    return;
  }
  let idx = -1;
  if (afterId) idx = list.findIndex((x) => x.id === afterId);
  const next = list[(idx + 1) % list.length];
  selectDoc(next);
}

async function saveRefOcAndNext() {
  if (!selectedLoteId.value || !selectedDoc.value) return;
  const d = selectedDoc.value;
  if (d.tipo === "oc") return;

  const oc = String(refOcDraft.value || "").trim();
  if (!oc) return;

  savingRefOc.value = true;
  try {
    await updateDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", d.id), {
      refOc: oc,
      estado: "en_revision",
      updatedAt: serverTimestamp(),
      updatedBy: actorName.value,
    });

    await addHist("assign_oc_manual", { docId: d.id, tipo: d.tipo, numero: d.numero || "", refOc: oc });

    const ocDoc = findOcDocByNumero(oc);
    if (ocDoc) {
      leftDocId.value = d.id;
      rightDocId.value = ocDoc.id;
    }

    gotoNextMissingOc(d.id);
  } finally {
    savingRefOc.value = false;
  }
}


function docHasAnySource(d) {
  const sp = d?.archivo?.storagePath || d?.firmado?.storagePath;
  const url = d?.archivo?.url || d?.firmado?.url;
  return !!(sp || url);
}

function docUpdatedAtText(d) {
  const ts = d?.updatedAt?.toDate ? d.updatedAt.toDate() : null;
  if (ts) return ts.toLocaleString();
  const cts = d?.createdAt?.toDate ? d.createdAt.toDate() : null;
  return cts ? cts.toLocaleString() : "—";
}

const ocsAprobadasSinFirma = computed(() => {
  return docs.value
    .filter((d) => d.tipo === "oc")
    .filter((d) => d.estado === "aprobado")
    .filter((d) => !d.firmado?.url && !d.firmado?.storagePath);
});

function toggleSelectOcToSign(docId) {
  const id = String(docId || "");
  if (!id) return;
  const cur = new Set(selectedToSignIds.value);
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  selectedToSignIds.value = Array.from(cur);
}

function selectAllOcsToSign() {
  selectedToSignIds.value = ocsAprobadasSinFirma.value.map((d) => d.id);
}
function clearSelectedOcsToSign() {
  selectedToSignIds.value = [];
}


const canSignNow = computed(() => {
  if (!selectedLoteId.value) return false;
  if (!selectedToSignIds.value.length) return false;
  return true;
});


function validateBeforeSign() {
  signValidationError.value = "";
  if (!selectedLoteId.value) {
    signValidationError.value = "Falta lote seleccionado.";
    return false;
  }
  if (!selectedToSignIds.value.length) {
    signValidationError.value = "No hay OCs seleccionadas.";
    return false;
  }

  const missingPdf = selectedToSignIds.value
    .map((id) => docs.value.find((d) => d.id === id))
    .filter(Boolean)
    .filter((d) => !docHasAnySource(d));

  if (missingPdf.length) {
    signValidationError.value = "Hay OCs sin url/storagePath. Corrige el lote antes de firmar.";
    return false;
  }

  return true;
}

function openSignModal() {
  signValidationError.value = "";
  signModal.show();
}


function uploadDataToStorage(data, path, opts = {}) {
  return new Promise((resolve, reject) => {
    const r = sRef(storage, path);
    const task = uploadBytesResumable(r, data);

    task.on(
      "state_changed",
      (snap) => {
        if (opts?.onProgress) opts.onProgress(snap);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

async function signSelectedOcs() {
  if (!validateBeforeSign()) return;

  signModal.hide();
  signBusy.value = true;
  signProgress.value = 0;
  signStatus.value = "Preparando…";

  const loteId = selectedLoteId.value;
  const ids = [...selectedToSignIds.value];

  try {
    const resp = await fetch(firmaAlejandroUrl);
    if (!resp.ok) throw new Error("No se pudo cargar firma-alejandro.png desde assets");
    const blob = await resp.blob();
    const img = new File([blob], "firma-alejandro.png", { type: blob.type || "image/png" });

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const d = docs.value.find((x) => x.id === id);
      if (!d) continue;

      signStatus.value = `Firmando OC ${d.numero || "—"} (${i + 1}/${ids.length})`;
      const baseStart = Math.round((i / Math.max(1, ids.length)) * 100);
      const baseEnd = Math.round(((i + 1) / Math.max(1, ids.length)) * 100);

      signProgress.value = Math.min(99, baseStart + 2);
      const originalBytes = await getDocBytesPreferStorage(d);
      const signedBytes = await signPdfWithImageSmart(originalBytes, img, (p) => {
        const frac = Math.max(0, Math.min(1, p / 60));
        const mapped = Math.round(baseStart + frac * (baseEnd - baseStart) * 0.65);
        signProgress.value = Math.min(99, mapped);
      });
      const nextVersion = Number(d?.version || 1) + 1;
      const signedPath = `lotes_docs/${loteId}/docs/${d.id}/signed_v${nextVersion}.pdf`;

      const url = await uploadDataToStorage(signedBytes, signedPath, {
        onProgress: (snap) => {
          const frac = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0;
          const mapped = Math.round(baseStart + 0.7 * (baseEnd - baseStart) + frac * 0.25 * (baseEnd - baseStart));
          signProgress.value = Math.min(99, mapped);
        },
      });
      await updateDoc(doc(db, "lotes_docs", loteId, "docs", d.id), {
        firmado: { url, storagePath: signedPath, at: serverTimestamp(), by: actorName.value, version: nextVersion },
        version: nextVersion,
        updatedAt: serverTimestamp(),
        updatedBy: actorName.value,
      });

      await addHist("oc_signed", { docId: d.id, numero: d.numero || "", version: nextVersion });

      signProgress.value = Math.min(99, baseEnd);
    }

    signStatus.value = "Listo ✅ OCs firmadas y guardadas";
    signProgress.value = 100;

    selectedToSignIds.value = [];
  } catch (e) {
    console.error(e);
    alert("Error firmando: " + (e?.message || String(e)));
  } finally {
    setTimeout(() => {
      signBusy.value = false;
      signProgress.value = 0;
      signStatus.value = "";
    }, 600);
  }
}

async function loadStaging() {
  staged.value = await stageList();
  if (!staged.value.find((x) => x.id === selectedStageId.value)) {
    selectedStageId.value = null;
    selectedStageFull.value = null;
    setStagePreview();
  }
}

function setStagePreview() {
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);
  stagePreviewUrl.value = "";
}

async function selectStage(s) {
  selectedStageId.value = s.id;

  const full = await stageGet(s.id);
  if (!full) return;

  selectedStageFull.value = { ...s, ...full };

  stageForm.value = {
    tipo: selectedStageFull.value.tipo || "factura",
    numero: selectedStageFull.value.numero || "",
    refOc: selectedStageFull.value.refOc || "",
  };

  setStagePreview();

  openStagePreview();
}


function openStagePreview() {
  const blob = selectedStageFull.value?.blob || null;
  if (!blob) return;
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);
  stagePreviewUrl.value = URL.createObjectURL(blob);
}

function closeStagePreview() {
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);
  stagePreviewUrl.value = "";
}

function onStageTipoChanged() {}

function buildCoherence(tipo, numero, refOc) {
  const reasons = [];
  const t = String(tipo || "").trim();

  if (t === "oc") {
    if (!String(numero || "").trim()) reasons.push("OC sin número (completar para emparejar).");
  } else {
    if (!String(refOc || "").trim()) reasons.push("Falta OC asociada (para emparejar).");
  }

  return { ok: reasons.length === 0, reasons };
}

async function saveStageQuick() {
  if (!selectedStageFull.value) return;
  stageQuickSaving.value = true;

  try {
    const current = await stageGet(selectedStageFull.value.id);
    if (!current) return;

    const nextTipo = stageForm.value.tipo;
    const nextNumero = String(stageForm.value.numero || "").trim();
    const nextRefOc = String(stageForm.value.refOc || "").trim();

    const coherence = buildCoherence(nextTipo, nextNumero, nextRefOc);

    await stagePut({ ...current, tipo: nextTipo, numero: nextNumero, refOc: nextRefOc, coherence });

    await loadStaging();

    const again = await stageGet(selectedStageFull.value.id);
    selectedStageFull.value = { ...selectedStageFull.value, ...again, tipo: nextTipo, numero: nextNumero, refOc: nextRefOc, coherence };
    stageForm.value = { tipo: nextTipo, numero: nextNumero, refOc: nextRefOc };

    if (nextTipo !== "oc" && nextRefOc) await gotoNextStagingMissingRefOc(selectedStageFull.value.id);
  } finally {
    stageQuickSaving.value = false;
  }
}

async function useStageSuggested(val) {
  const v = String(val || "").trim();
  stageMainValue.value = v;
  await saveStageQuick();
}

const OC_MIN_LEN = 4;
const OC_MAX_LEN = 7;
const AUTO_MATCH_MAX_UPDATES = 250;



function _pickBestDigits(raw) {
  const s = String(raw || "");
  const hits = s.match(new RegExp(`\\b\\d{${OC_MIN_LEN},${OC_MAX_LEN}}\\b`, "g")) || [];
  if (!hits.length) return "";
  hits.sort((a, b) => b.length - a.length);
  return hits[0] || "";
}

function _normalizeOc(v) {
  const best = _pickBestDigits(v);
  return best ? String(best) : "";
}

function _extractOcFromStringSmart(str) {

  const s = String(str || "");
  const strong = [
    /(?:\boc\b\s*[:#-]?\s*)(\d{4,7})/i,
    /(?:\borden\s+de\s+compra\b.*?)(\d{4,7})/i,
    /(?:\bn[°º]?\s*oc\b\s*[:#-]?\s*)(\d{4,7})/i,
  ];
  for (const rx of strong) {
    const m = s.match(rx);
    if (m && m[1]) return String(m[1]);
  }

  return _pickBestDigits(s);
}

function _groupBy(arr, keyFn) {
  const m = new Map();
  for (const it of arr || []) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

function _sortByPartIndex(list) {
  return (list || []).slice().sort((a, b) => (Number(a.partIndex || 0) - Number(b.partIndex || 0)));
}

function _buildOcIndexFromParts(parts) {
  const ocParts = (parts || [])
    .filter(p => String(p.tipo || "").toLowerCase() === "oc")
    .map(p => ({
      id: p.id,
      partIndex: Number(p.partIndex || 0),
      numero: _normalizeOc(p.numero) || _extractOcFromStringSmart(p.parentName) || "",
      parentName: String(p.parentName || ""),
    }))
    .filter(x => !!x.numero);

  const byParent = _groupBy(ocParts, x => x.parentName || "__no_parent__");
  return { ocParts, byParent };
}

function _bestNearbyOcForPart(part, ocListSamePack) {
  const idx = Number(part.partIndex || 0);
  if (!ocListSamePack?.length) return null;

  let bestNext = null;
  for (const oc of ocListSamePack) {
    if (Number(oc.partIndex || 0) >= idx) {
      bestNext = oc;
      break;
    }
  }
  if (bestNext) return { numero: bestNext.numero, score: 95, reason: "nearby_next_oc" };

  const lastPrev = ocListSamePack[ocListSamePack.length - 1];
  return { numero: lastPrev.numero, score: 85, reason: "nearby_prev_oc" };
}


function _scoreCandidate({ numero, sourceScore = 0, reason = "" }, packOcSet, globalOcSet) {
  if (!numero) return -1;
  let s = sourceScore;

  if (packOcSet?.has(numero)) s += 60;

  if (globalOcSet?.has(numero)) s += 25;

  if (reason.includes("strong")) s += 25;
  if (reason.includes("nearby")) s += 60;

  if (String(numero).length === 5) s += 5;

  return s;
}

function _pickBestCandidate(candidates, packOcSet, globalOcSet) {
  let best = null;
  let bestScore = -1;

  for (const c of candidates || []) {
    const numero = _normalizeOc(c.numero || c.value || "");
    if (!numero) continue;
    const score = _scoreCandidate(
      { numero, sourceScore: Number(c.score || 0), reason: String(c.reason || c.source || "") },
      packOcSet,
      globalOcSet
    );
    if (score > bestScore) {
      bestScore = score;
      best = { numero, score, reason: c.reason || c.source || "candidate" };
    }
  }

  return best;
}

function _autoAssignRefOcForParts(parts, globalOcSet) {
  const { byParent } = _buildOcIndexFromParts(parts);
  const packOcNumbers = new Set(
    (parts || [])
      .filter(p => String(p.tipo || "").toLowerCase() === "oc")
      .map(p => _normalizeOc(p.numero) || _extractOcFromStringSmart(p.parentName))
      .filter(Boolean)
  );

  for (const p of parts || []) {
    const tipo = String(p.tipo || "").toLowerCase();
    if (tipo === "oc") {
      if (!String(p.numero || "").trim()) {
        const inf = _extractOcFromStringSmart(p.parentName);
        if (inf) {
          p.numero = inf;
          p.numeroAuto = true;
        }
      }
      continue;
    }
    if (tipo !== "factura" && tipo !== "guia") continue;
    const existing = _normalizeOc(p.refOc);
    if (existing) {
      p.refOc = existing;
      continue;
    }

    const parent = String(p.parentName || "");
    const ocListSamePack = _sortByPartIndex(byParent.get(parent) || []);
    const packOcSet = new Set(ocListSamePack.map(x => x.numero).filter(Boolean));

    const candidates = [];

    if (Array.isArray(p.ocCandidates)) {
      for (const c of p.ocCandidates) {
        candidates.push({
          numero: c?.value,
          score: Number(c?.score || 0),
          source: c?.source || "ocCandidates"
        });
      }
    }

    const fromName = _extractOcFromStringSmart(p.parentName);
    if (fromName) candidates.push({ numero: fromName, score: 30, reason: "strong_from_parentName" });

    const nearby = _bestNearbyOcForPart(p, ocListSamePack);
    if (nearby?.numero) candidates.push({ numero: nearby.numero, score: nearby.score, reason: nearby.reason });
    const best = _pickBestCandidate(candidates, packOcSet, globalOcSet);
    if (best && (String(best.reason || "").includes("nearby") || best.score >= 70)) {
      p.refOc = best.numero;
      p.refOcAuto = true;
    }
    if (typeof buildCoherence === "function") {
      const c = buildCoherence(p.tipo, p.numero, p.refOc);
      p.coherence = c;
    }
  }

  for (const n of packOcNumbers) globalOcSet.add(n);

  return parts;
}

async function autoFixStagingMissingRefOc() {
  try {
    const list = await stageList();
    const globalOcSet = new Set(
      (list || [])
        .filter((x) => String(x.tipo || "").toLowerCase() === "oc")
        .map((x) => _normalizeOc(x.numero) || _extractOcFromStringSmart(x.parentName))
        .filter(Boolean)
    );

    const byParent = _groupBy(list, (x) => String(x.parentName || ""));
    let updates = 0;

    for (const [parentName, group] of byParent.entries()) {
      if (updates >= AUTO_MATCH_MAX_UPDATES) break;
      const ocList = _sortByPartIndex(
        group
          .filter((x) => String(x.tipo || "").toLowerCase() === "oc")
          .map((x) => ({
            id: x.id,
            partIndex: Number(x.partIndex || 0),
            numero: _normalizeOc(x.numero) || _extractOcFromStringSmart(x.parentName) || "",
            parentName,
          }))
          .filter((x) => !!x.numero)
      );

      if (!ocList.length) continue;
      const needs = group.filter((x) => {
        const t = String(x.tipo || "").toLowerCase();
        if (t !== "factura" && t !== "guia") return false;
        return !_normalizeOc(x.refOc);
      });

      for (const s of needs) {
        if (updates >= AUTO_MATCH_MAX_UPDATES) break;

        const full = await stageGet(s.id);
        if (!full) continue;
        const idx = Number(s.partIndex || 0);
        let best = null;
        let bestDist = Number.POSITIVE_INFINITY;

        for (const oc of ocList) {
          const dist = Math.abs(Number(oc.partIndex || 0) - idx);
          const ocIdx = Number(oc.partIndex || 0);
          const bestIdx = Number(best?.partIndex || 0);

          if (dist < bestDist || (dist === bestDist && ocIdx > bestIdx)) {
            bestDist = dist;
            best = oc;
          }

        }

        if (!best?.numero) continue;

        const newRef = _normalizeOc(best.numero);
        if (!newRef) continue;

        const next = {
          ...full,
          refOc: newRef,
          refOcAuto: true,
        };
        next.coherence = buildCoherence(next.tipo, next.numero, next.refOc);

        await stagePut(next);
        globalOcSet.add(newRef);
        updates++;
      }
    }
  } catch (e) {
    console.warn("autoFixStagingMissingRefOc:", e);
  }
}


async function onPickFilesLocal(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  if (!files.length) return;

  localBusy.value = true;
  localProgress.value = 0;
  localStatus.value = `Preparando… (0/${files.length})`;

  const errors = [];
  let processedFiles = 0;

  try {
    const existing = await stageList();
    const globalOcSet = new Set(
      (existing || [])
        .filter(x => String(x.tipo || "").toLowerCase() === "oc")
        .map(x => _normalizeOc(x.numero) || _extractOcFromStringSmart(x.parentName))
        .filter(Boolean)
    );

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      localStatus.value = `Procesando ${i + 1}/${files.length}: ${f.name}`;
      localProgress.value = Math.round((i / files.length) * 100);

      try {
        const { docs: parts } = await splitPdfPack(f);

        _autoAssignRefOcForParts(parts, globalOcSet);

        for (const p of parts) {
          const id = uuidv4();
          await stagePut({
            id,
            createdAt: Date.now(),
            tipo: p.tipo,
            numero: p.numero,
            numeroAuto: !!p.numeroAuto,
            refOc: p.refOc || "",
            refOcAuto: !!p.refOcAuto,
            ocCandidates: p.ocCandidates || [],
            tipoConfidence: p.tipoConfidence ?? null,
            dteTipo: p.dteTipo ?? null,
            ruts: p.ruts,
            pagesCount: p.pagesCount,
            pageRange: p.pageRange,
            coherence: p.coherence || buildCoherence(p.tipo, p.numero, p.refOc),
            parentName: p.parentName,
            partIndex: p.partIndex,
            totalParts: p.totalParts,
            blob: p.blob,
          });
        }

        processedFiles++;
      } catch (err) {
        console.error("Error en archivo:", f.name, err);
        errors.push({ file: f.name, err: String(err?.message || err) });
      }

      localProgress.value = Math.round(((i + 1) / files.length) * 100);
    }

    localStatus.value = `Listo ✅ Procesados ${processedFiles}/${files.length}`;
    await loadStaging();
    await autoFixStagingMissingRefOc();
    await loadStaging();

    if (errors.length) {
      alert(`Se procesaron ${processedFiles}/${files.length} PDFs.\nFallaron ${errors.length}.\nRevisa consola.`);
    }
  } finally {
    setTimeout(() => {
      localBusy.value = false;
      localProgress.value = 0;
      localStatus.value = "";
    }, 350);
  }
}


async function removeStage(id) {
  if (selectedStageId.value === id) {
    selectedStageId.value = null;
    selectedStageFull.value = null;
    setStagePreview();
  }
  await stageDelete(id);
  await loadStaging();
}

async function clearStaging() {
  selectedStageId.value = null;
  selectedStageFull.value = null;
  setStagePreview();
  await stageClear();
  await loadStaging();
}

function openEditStageModal(s) {
  editStage.value = { ...s };
  editStageModal.show();
}

async function saveEditStage() {
  const full = await stageGet(editStage.value.id);
  if (!full) return;

  const tipo = editStage.value.tipo;
  const numero = String(editStage.value.numero || "").trim();
  const refOc = String(editStage.value.refOc || "").trim();

  const coherence = buildCoherence(tipo, numero, refOc);

  await stagePut({ ...full, tipo, numero, refOc, coherence });

  editStageModal.hide();
  await loadStaging();

  if (selectedStageId.value === editStage.value.id) {
    const again = await stageGet(editStage.value.id);
    selectedStageFull.value = { ...selectedStageFull.value, ...again, tipo, numero, refOc, coherence };
    setStagePreview();
    stageForm.value = { tipo, numero, refOc };
  }
}

async function uploadStagingToLote() {
  if (!selectedLoteId.value || staged.value.length === 0) return;

  if (loteLocked.value) {
    alert("Este lote ya no está en pendiente. Crea un lote nuevo para subir más PDFs.");
    return;
  }

  uploadBusy.value = true;

  uploadProgress.value = 0;
  uploadBytesDone.value = 0;
  uploadBytesTotal.value = 0;
  uploadStatus.value = `Preparando subida… (0/${staged.value.length})`;

  const total = staged.value.length;
  let completedBytes = 0;

  try {
    for (let i = 0; i < total; i++) {
      const s = staged.value[i];
      const full = await stageGet(s.id);
      if (!full?.blob) continue;

      uploadBytesTotal.value += full.blob.size;

      const docId = uuidv4();
      const storagePath = `lotes_docs/${selectedLoteId.value}/docs/${docId}/original.pdf`;

      uploadStatus.value = `Subiendo ${i + 1}/${total}: ${s.parentName} (parte ${s.partIndex}/${s.totalParts})`;

      const url = await uploadDataToStorage(full.blob, storagePath, {
        onProgress: (snap) => {
          const fracFile = snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0;
          const fracTotal = (i + fracFile) / total;

          uploadProgress.value = Math.min(99, Math.round(fracTotal * 100));
          uploadBytesDone.value = completedBytes + snap.bytesTransferred;
        },
      });

      completedBytes += full.blob.size;
      uploadBytesDone.value = completedBytes;

      await setDoc(doc(db, "lotes_docs", selectedLoteId.value, "docs", docId), {
        tipo: s.tipo,
        estado: "pendiente",
        numero: s.numero || "",
        refOc: (full.refOc || ""),
        archivo: {
          name: `${s.parentName} (parte ${s.partIndex}-${s.totalParts}).pdf`,
          size: full.blob.size,
          mime: "application/pdf",
          storagePath,
          url,
        },
        firmado: null,
        rechazo: null,
        reemplazaA: null,
        version: 1,
        origen: {
          parentName: s.parentName,
          partIndex: s.partIndex,
          totalParts: s.totalParts,
          pageRange: s.pageRange,
        },
        deteccion: {
          tipoConfidence: full.tipoConfidence ?? null,
          dteTipo: full.dteTipo ?? null,
          refOc: full.refOc || "",
          ocCandidates: full.ocCandidates || [],
        },
        createdAt: serverTimestamp(),
        createdBy: actorName.value,
      });

      await addHist("upload_split", {
        fromStagingId: s.id,
        docId,
        tipo: s.tipo,
        numero: s.numero,
        parentName: s.parentName
      });
    }

    await updateDoc(doc(db, "lotes_docs", selectedLoteId.value), {
      estado: "en_revision",
      uploadedAt: serverTimestamp(),
      uploadedBy: actorName.value,
      updatedAt: serverTimestamp(),
      updatedBy: actorName.value,
    });

    await addHist("lote_estado", { estado: "en_revision" });

    uploadProgress.value = 100;
    uploadStatus.value = "Listo  Lote subido correctamente";

    await clearStaging();

    tab.value = "cloud";
  } finally {
    setTimeout(() => {
      uploadBusy.value = false;
      uploadProgress.value = 0;
      uploadStatus.value = "";
      uploadBytesDone.value = 0;
      uploadBytesTotal.value = 0;
    }, 450);
  }
}

function selectDoc(d) {
  selectedDocId.value = d.id;

  if (d.tipo !== "oc") {
    const refOc = docRefOc(d);
    const ocDoc = refOc ? findOcDocByNumero(refOc) : null;

    leftDocId.value = d.id;
    if (ocDoc) rightDocId.value = ocDoc.id;
    else if (!rightDocId.value || rightDocId.value === d.id) rightDocId.value = "";
    return;
  }

  if (!leftDocId.value) leftDocId.value = d.id;
  else if (!rightDocId.value && d.id !== leftDocId.value) rightDocId.value = d.id;
  else leftDocId.value = d.id;
}

function swapSides() {
  const tmp = leftDocId.value;
  leftDocId.value = rightDocId.value;
  rightDocId.value = tmp;
}
function rechazoMotivo(d) {
  const m =
    d?.motivo ||
    d?.rechazo?.motivo ||
    d?.rechazo?.comentario ||
    d?.rechazo?.razon ||
    "";
  return String(m || "").trim();
}

function hasRechazoMotivo(d) {
  return !!rechazoMotivo(d);
}

function openCreateLoteModal() {
  newLoteNombre.value = "";
  createLoteModal.show();
}

async function createLote() {
  const payload = {
    nombre: newLoteNombre.value.trim() || `Lote ${new Date().toISOString().slice(0, 10)}`,
    createdAt: serverTimestamp(),
    createdBy: actorName.value,
    estado: "pendiente",
  };

  const refDoc = await addDoc(collection(db, "lotes_docs"), payload);

  tab.value = "staging";
  selectedLoteId.value = refDoc.id;

  createLoteModal.hide();
  onChangeLote();
  await addHist("lote_create", { nombre: payload.nombre });
}

async function addHist(tipo, detalle) {
  if (!selectedLoteId.value) return;
  await addDoc(collection(db, "lotes_docs", selectedLoteId.value, "historial"), {
    tipo,
    detalle,
    at: serverTimestamp(),
    by: actorName.value,
  });
}

function onChangeLote() {
  docs.value = [];
  selectedDocId.value = null;
  leftDocId.value = "";
  rightDocId.value = "";
  refOcDraft.value = "";

  selectedToSignIds.value = [];

  if (unsubDocs) unsubDocs();
  unsubDocs = null;

  if (!selectedLoteId.value) return;
  if (tab.value === "staging") return;

  const qD = query(collection(db, "lotes_docs", selectedLoteId.value, "docs"), orderBy("createdAt", "desc"));
  unsubDocs = onSnapshot(qD, (snap) => {
    docs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
}
let unsubLotes = null;
let unsubDocs = null;

onMounted(async () => {
  createLoteModal = new bootstrap.Modal(createLoteModalEl.value);
  editStageModal = new bootstrap.Modal(editStageModalEl.value);
  signModal = new bootstrap.Modal(signModalEl.value);

  const qL = query(collection(db, "lotes_docs"), orderBy("createdAt", "desc"));
  unsubLotes = onSnapshot(qL, (snap) => {
    lotes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ensureSelectedLoteForTab();
  });

  await loadStaging();
});
function makeViewerUrl(url) {
  if (!url) return "";
  const clean = String(url || "");
  if (/\.pdf(\?|$)/i.test(clean) || clean.includes("application/pdf")) {
    return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(clean)}`;
  }
  return clean;
}

onBeforeUnmount(() => {
  if (unsubLotes) unsubLotes();
  if (unsubDocs) unsubDocs();
  if (stagePreviewUrl.value) URL.revokeObjectURL(stagePreviewUrl.value);

  if (signaturePreviewUrl.value) URL.revokeObjectURL(signaturePreviewUrl.value);
});

watch(tab, async (t) => {
  if (t === "staging") {
    if (unsubDocs) unsubDocs();
    unsubDocs = null;
    docs.value = [];
    selectedDocId.value = null;
    leftDocId.value = "";
    rightDocId.value = "";
    refOcDraft.value = "";
    selectedToSignIds.value = [];
    await loadStaging();
  }
  ensureSelectedLoteForTab();
});
</script>

<style scoped>
.bg-light-subtle {
  background: rgba(0, 0, 0, 0.03);
}

.busy-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.busy-card {
  width: min(560px, 94vw);
  background: #fff;
  border-radius: 18px;
  padding: 18px 18px 14px;
}

.busy-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
}

.busy-tip {
  opacity: 0.85;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.oc-strong-badge {
  font-size: 0.92rem;
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  background: #0d6efd;
  color: #fff;
  letter-spacing: 0.2px;
  font-weight: 700;
}

.list-group-item.active {
  background-color: rgba(13, 110, 253, 0.12) !important;
  border-color: rgba(13, 110, 253, 0.25) !important;
  color: #212529 !important;
}
.list-group-item.active .text-muted {
  color: rgba(33, 37, 41, 0.65) !important;
}
</style>
