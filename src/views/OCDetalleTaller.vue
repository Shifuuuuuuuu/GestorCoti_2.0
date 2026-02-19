<!-- src/views/OCDetalle-taller.vue -->
<template>
  <div class="container py-4 py-md-5">
    <transition name="fade">
      <div v-if="busy.on" class="busy-overlay">
        <div class="busy-card shadow-lg">
          <div class="d-flex align-items-center gap-3">
            <div class="spinner-border text-danger" role="status" aria-hidden="true"></div>
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ busy.label }}</div>
              <div class="text-muted small" v-if="busy.hint">{{ busy.hint }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
      <button class="btn btn-outline-secondary btn-sm" @click="volver" :disabled="busy.on">
        <i class="bi bi-arrow-left"></i> Volver
      </button>

      <h1 class="h4 fw-semibold mb-0">Detalle de Orden de Compra (Taller)</h1>

      <div class="d-flex align-items-center gap-2">
        <template v-if="docData">
          <template v-if="!editingDetalle">
            <span class="badge" :class="estadoBadgeClass(docData.estatus)">
              {{ docData.estatus || "—" }}
            </span>
          </template>

          <template v-else>
            <select class="form-select form-select-sm w-auto" v-model="draftEstatus" :disabled="busy.on">
              <option value="Pendiente de Aprobación">Pendiente de Aprobación</option>
              <option value="Revisión Guillermo">Revisión Guillermo</option>
              <option value="Preaprobado">Preaprobado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Enviada a proveedor">Enviada a proveedor</option>
              <option :value="draftEstatus">Otro: {{ draftEstatus }}</option>
            </select>
          </template>
          <template v-if="!editingDetalle">
            <button
              v-if="canEditDetalle"
              class="btn btn-danger btn-sm"
              @click="startEditDetalle"
              :disabled="busy.on || loading"
              title="Editar detalle (estatus, total, comentario y archivos)"
            >
              <i class="bi bi-pencil-square"></i> Editar
            </button>
          </template>

          <template v-else>
            <button class="btn btn-outline-secondary btn-sm" @click="cancelEditDetalle" :disabled="busy.on">
              <i class="bi bi-x-circle"></i> Cancelar
            </button>
            <button class="btn btn-danger btn-sm" @click="saveEditDetalle" :disabled="busy.on">
              <i class="bi bi-check2-circle"></i> Guardar
            </button>
          </template>
        </template>
      </div>
    </div>
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2">Cargando orden de compra…</div>
    </div>

    <template v-else>
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      <div v-if="flash.show" class="alert alert-dismissible" :class="flashClass">
        <div class="d-flex align-items-start gap-2">
          <i v-if="flash.type === 'success'" class="bi bi-check-circle-fill"></i>
          <i v-else-if="flash.type === 'danger'" class="bi bi-exclamation-triangle-fill"></i>
          <i v-else class="bi bi-info-circle-fill"></i>
          <div class="flex-grow-1">{{ flash.message }}</div>
          <button type="button" class="btn-close" aria-label="Close" @click="hideFlash"></button>
        </div>
      </div>
      <div v-if="docData" class="d-grid gap-3">
        <div class="card card-elevated">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold">
              OC N° <span class="text-danger">{{ docData.id ?? "—" }}</span>
            </div>
            <div class="text-secondary small">
              Subida: <strong>{{ fmtFecha(docData.fechaSubida) }}</strong>
              <span v-if="docData.fechaAprobacion">
                · Aprobada: <strong>{{ fmtFecha(docData.fechaAprobacion) }}</strong>
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <div class="small">Empresa</div>
                <div class="fw-semibold">{{ docData.empresa || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small">Centro de Costo</div>
                <div class="fw-semibold">{{ docData.centroCostoTexto || "—" }}</div>
              </div>

              <div class="col-12 col-md-6" v-if="docData.aprobadoPor">
                <div class="small">Aprobado por</div>
                <div class="fw-semibold">{{ docData.aprobadoPor }}</div>
              </div>
              <div class="col-12 col-md-6">
                <div class="small">Precio total con IVA</div>
                <template v-if="!editingDetalle">
                  <div class="fw-semibold">
                    {{ fmtMoneda(docData.precioTotalConIVA, docData.moneda || "CLP") }}
                  </div>
                </template>
                <template v-else>
                  <input
                    class="form-control"
                    type="number"
                    min="0"
                    step="1"
                    v-model.number="draftPrecioTotal"
                    placeholder="Ej: 187398"
                    :disabled="busy.on"
                  />
                  <div class="form-text">Se guardará al presionar <b>Guardar</b>.</div>
                </template>
              </div>

              <div class="col-12">
                <div class="small">Comentario</div>
                <template v-if="!editingDetalle">
                  <div class="border rounded p-2" style="white-space: pre-wrap">
                    {{ docData.comentario || "—" }}
                  </div>
                </template>
                <template v-else>
                  <textarea
                    class="form-control"
                    rows="3"
                    v-model="draftComentario"
                    placeholder="Editar comentario…"
                    :disabled="busy.on"
                  ></textarea>
                  <div class="form-text">Se guardará al presionar <b>Guardar</b>.</div>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div v-if="canResubmitEditor" class="card border-2 border-danger-subtle">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold text-danger">Subir nueva cotización</div>
            <span class="small text-secondary">
              Selecciona múltiples PDF/imagenes. Estado pasa a “Revisión Guillermo”.
            </span>
          </div>
          <div class="card-body">
            <div v-if="submitError" class="alert alert-danger py-2 mb-3">{{ submitError }}</div>
            <div v-if="submitOk" class="alert alert-success py-2 mb-3">Cotización actualizada correctamente.</div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Archivos de cotización (PDF/imagen)</label>
                <input
                  id="filesNuevaCoti"
                  class="form-control"
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  @change="onFilesNuevaCoti"
                  :disabled="busy.on || editingDetalle"
                />
                <ul v-if="filesNuevaCoti.length" class="small mt-2 mb-0 list-unstyled">
                  <li v-for="(f, i) in filesNuevaCoti" :key="'nc-' + i">
                    • {{ f.name }} <span class="text-muted">({{ (f.size / 1024 / 1024).toFixed(2) }} MB)</span>
                  </li>
                </ul>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Nuevo total con IVA</label>
                <input
                  class="form-control"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="nuevoPrecio"
                  placeholder="Ej: 1250000"
                  :disabled="busy.on || editingDetalle"
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Nuevo estatus (informativo)</label>
                <select class="form-select" v-model="nuevoEstatus" disabled>
                  <option selected>Revisión Guillermo</option>
                </select>
                <div class="form-text">Se forzará “Revisión Guillermo”.</div>
              </div>

              <div class="col-12">
                <label class="form-label">Comentario (motivo de nueva cotización)</label>
                <textarea
                  class="form-control"
                  rows="2"
                  v-model="nuevoComentario"
                  placeholder="Ej: Ajuste por corrección de proveedor…"
                  :disabled="busy.on || editingDetalle"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="card-footer d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" @click="resetForm" :disabled="submitting || busy.on || editingDetalle">
              Limpiar
            </button>
            <button
              class="btn btn-danger"
              @click="subirNuevaCotizacion"
              :disabled="submitting || busy.on || editingDetalle || !filesNuevaCoti.length"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              Subir y actualizar
            </button>
          </div>
        </div>
        <div v-if="canUploadArchivoOCEditor" class="card border-2 border-primary-subtle">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold text-primary">Subir OC enviada</div>
            <span class="small text-secondary">Al subir, cambiará el estado a “Enviada a proveedor”.</span>
          </div>

          <div class="card-body">
            <div v-if="sendError" class="alert alert-danger py-2 mb-3">{{ sendError }}</div>
            <div v-if="sendOk" class="alert alert-success py-2 mb-3">Archivo OC subido y estado actualizado.</div>

            <div class="row g-3">
              <div class="col-12 col-md-8">
                <label class="form-label">Archivo OC (PDF/imagen)</label>
                <input
                  id="fileArchivoOC"
                  class="form-control"
                  type="file"
                  accept="application/pdf,image/*"
                  @change="onFileArchivoOC"
                  :disabled="busy.on || editingDetalle"
                />
                <div v-if="fileArchivoOC" class="small mt-2">
                  • {{ fileArchivoOC.name }}
                  <span class="text-muted">({{ (fileArchivoOC.size / 1024 / 1024).toFixed(2) }} MB)</span>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Comentario (opcional)</label>
                <input
                  class="form-control"
                  v-model="comentarioEnvio"
                  placeholder="Ej: Enviado por correo al proveedor"
                  :disabled="busy.on || editingDetalle"
                />
              </div>
            </div>
          </div>

          <div class="card-footer d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="resetEnvio" :disabled="sending || busy.on || editingDetalle">
              Limpiar
            </button>
            <button
              class="btn btn-primary"
              @click="subirArchivoOC"
              :disabled="sending || busy.on || editingDetalle || !fileArchivoOC"
            >
              <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
              Subir y marcar como enviada
            </button>
          </div>
        </div>
        <div class="card" v-if="docData.tipo_solped || docData.solpedId || docData.numero_solped">
          <div class="card-header d-flex align-items-center justify-content-between">
            <span class="fw-semibold">Vinculación SOLPED</span>
            <router-link
              v-if="docData.solpedId"
              :to="{ name: 'SolpedTallerDetalle', params: { id: docData.solpedId } }"
              class="btn btn-sm btn-primary"
              :class="{ disabled: busy.on }"
            >
              Ver SOLPED
            </router-link>
          </div>

          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <div class="small">Tipo SOLPED</div>
                <div class="fw-semibold">{{ docData.tipo_solped || "—" }}</div>
              </div>
              <div class="col-12 col-md-4" v-if="docData.numero_solped != null">
                <div class="small">N° SOLPED</div>
                <div class="fw-semibold">{{ docData.numero_solped }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card" v-if="(docData.items || []).length">
          <div class="card-header d-flex align-items-center justify-content-between">
            <span class="fw-semibold">📦 Ítems</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ docData.items.length }} ítem(s)</span>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table align-middle table-sm">
                <thead class="table-light">
                  <tr>
                    <th style="width: 80px">Ítem</th>
                    <th>Descripción</th>
                    <th style="width: 160px">Código ref.</th>
                    <th class="text-center" style="width: 110px">Cant.</th>
                    <th class="text-center" style="width: 110px">Cotizado</th>
                    <th style="width: 160px">N° interno</th>
                    <th style="width: 140px">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(it, i) in docData.items" :key="it.__tempId || i">
                    <td>{{ it.item ?? i + 1 }}</td>
                    <td class="w-40">
                      <div class="fw-semibold">{{ it.descripcion || "—" }}</div>
                    </td>
                    <td><span class="text-monospace">{{ it.codigo_referencial || "—" }}</span></td>
                    <td class="text-center">{{ it.cantidad ?? "—" }}</td>
                    <td class="text-center">{{ it.cantidad_cotizada ?? "—" }}</td>
                    <td>{{ it.numero_interno || "—" }}</td>
                    <td>
                      <span class="badge" :class="itemEstadoBadge(it.estado || it.estado_cotizacion)">
                        {{ it.estado || it.estado_cotizacion || "—" }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="card" v-if="tieneArchivos || editingDetalle">
          <div class="card-header fw-semibold d-flex align-items-center justify-content-between">
            <span>📎 Archivos adjuntos</span>
            <span v-if="editingDetalle" class="badge bg-warning-subtle text-warning-emphasis">Modo edición</span>
          </div>

          <div class="card-body">
            <div class="mb-3">
              <div class="fw-semibold mb-2">Archivo OC</div>
              <div v-if="archivoOCArrayView.length" class="list-group">
                <div
                  v-for="(a, idx) in archivoOCArrayView"
                  :key="'ocmap-' + idx"
                  class="list-group-item d-flex align-items-center"
                >
                  <a class="d-flex align-items-center text-decoration-none flex-grow-1" :href="a.url" target="_blank" rel="noopener">
                    <i class="bi bi-file-earmark-text me-2"></i>
                    <div class="me-auto">
                      <div class="fw-semibold">{{ a.nombre || "Archivo OC" }}</div>
                      <div class="small text-secondary">{{ a.tipo || "—" }} · {{ fmtFecha(a.fechaSubida) }}</div>
                    </div>
                    <i class="bi bi-box-arrow-up-right ms-2"></i>
                  </a>

                  <button
                    v-if="editingDetalle && canEditDetalle"
                    class="btn btn-sm btn-outline-danger ms-3"
                    @click.prevent="askDelete('archivoOC', idx, a)"
                    :disabled="busy.on || confirmDel.show"
                    title="Eliminar archivoOC"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
              <div v-else class="text-secondary small">Sin archivoOC.</div>
            </div>

            <div class="mb-2">
              <div class="fw-semibold mb-2">Cotizaciones</div>
              <div v-if="(docData.archivosStorage || []).length" class="list-group">
                <div
                  v-for="(a, idx) in (docData.archivosStorage || [])"
                  :key="'att-' + idx"
                  class="list-group-item d-flex align-items-center"
                >
                  <a class="d-flex align-items-center text-decoration-none flex-grow-1" :href="a.url" target="_blank" rel="noopener">
                    <i class="bi bi-paperclip me-2"></i>
                    <div class="me-auto">
                      <div class="fw-semibold">{{ a.nombre || "Adjunto" }}</div>
                      <div class="small text-secondary">{{ a.tipo || "—" }} · {{ fmtFecha(a.fechaSubida) }}</div>
                    </div>
                    <i class="bi bi-box-arrow-up-right ms-2"></i>
                  </a>

                  <button
                    v-if="editingDetalle && canEditDetalle"
                    class="btn btn-sm btn-outline-danger ms-3"
                    @click.prevent="askDelete('archivosStorage', idx, a)"
                    :disabled="busy.on || confirmDel.show"
                    title="Eliminar adjunto"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
              <div v-else class="text-secondary small">Sin archivosStorage.</div>
            </div>
            <div v-if="editingDetalle" class="mt-3">
              <div class="alert alert-warning border-0 mb-3">
                <i class="bi bi-info-circle me-1"></i>
                Aquí puedes <b>agregar</b> nuevos archivos. También puedes eliminar los existentes con el basurero.
              </div>

              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Agregar cotizaciones</label>
                  <input
                    id="fileEditAdjuntos"
                    class="form-control"
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    @change="onPickEditAdjuntos"
                    :disabled="busy.on"
                  />
                  <ul v-if="editAdjuntos.length" class="small mt-2 mb-0 list-unstyled">
                    <li v-for="(f, i) in editAdjuntos" :key="'ea-' + i">
                      • {{ f.name }} <span class="text-muted">({{ (f.size / 1024 / 1024).toFixed(2) }} MB)</span>
                    </li>
                  </ul>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Agregar archivo OC</label>
                  <input
                    id="fileEditArchivoOC"
                    class="form-control"
                    type="file"
                    accept="application/pdf,image/*"
                    @change="onPickEditArchivoOC"
                    :disabled="busy.on"
                  />
                  <div v-if="editArchivoOCFile" class="small mt-2">
                    • {{ editArchivoOCFile.name }}
                    <span class="text-muted">({{ (editArchivoOCFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" v-if="(docData.historial || []).length">
          <div class="card-header fw-semibold">🕘 Historial</div>
          <div class="card-body">
            <div class="timeline">
              <div v-for="(h, i) in ordenarHistorial(docData.historial)" :key="'h-' + i" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <span class="badge" :class="estadoBadgeClass(h.estatus)">{{ h.estatus || "—" }}</span>
                    <span class="small text-secondary">{{ fmtFecha(h.fecha) }}</span>
                  </div>
                  <div class="small mt-1"><strong>Usuario:</strong> {{ h.usuario || "—" }}</div>
                  <div class="small mt-1" v-if="h.comentario"><strong>Comentario:</strong> {{ h.comentario }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
    <transition name="modal-fade">
      <div v-if="confirmDel.show" class="modal-backdrop-custom" @click.self="closeConfirm()">
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom">
          <div class="modal-content shadow-lg border-0 modal-surface">
            <div class="modal-header border-0 px-4 pt-4 pb-3">
              <div class="d-flex align-items-start gap-3 flex-grow-1 pe-2 minw-0">
                <div class="modal-icon">
                  <i class="bi bi-trash3"></i>
                </div>
                <div class="minw-0">
                  <div class="h5 mb-1">¿Eliminar archivo?</div>
                  <div class="text-muted small mb-0">
                    Se quitará del documento y se intentará borrar del Storage.
                  </div>
                </div>
              </div>

              <button type="button" class="icon-btn" @click="closeConfirm()" :disabled="confirmBusy" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="modal-body px-4 pt-0 pb-3">
              <div v-if="confirmErr" class="alert alert-danger py-2 mb-3">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                {{ confirmErr }}
              </div>

              <div class="file-card">
                <div class="d-flex align-items-start gap-3">
                  <div class="file-ico"><i class="bi bi-file-earmark-text"></i></div>
                  <div class="minw-0 flex-grow-1">
                    <div class="fw-semibold text-truncate file-name">{{ confirmDel.nombre || "Archivo" }}</div>
                    <div class="small text-muted text-truncate">{{ confirmDel.tipo || "—" }}</div>
                  </div>
                </div>
              </div>

              <div class="mt-3 small text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Si no se puede borrar en Storage, igual se quitará del registro.
              </div>
            </div>

            <div class="modal-footer border-0 px-4 pb-4 pt-0">
              <div class="d-flex justify-content-end gap-2 w-100">
                <button class="btn btn-outline-secondary modal-btn" @click="closeConfirm()" :disabled="confirmBusy">
                  Cancelar
                </button>
                <button class="btn btn-danger modal-btn" @click="confirmDelete" :disabled="confirmBusy">
                  <span v-if="confirmBusy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  {{ confirmBusy ? "Eliminando…" : "Eliminar" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db } from "../stores/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const docData = ref(null);

const busy = ref({ on: false, label: "Procesando…", hint: "" });
const volver = () => router.back();

const flash = ref({ show: false, type: "success", message: "" });
const flashTimer = ref(null);

const flashClass = computed(() => {
  if (flash.value.type === "success") return "alert-success";
  if (flash.value.type === "danger") return "alert-danger";
  return "alert-info";
});

function showFlash(type, message, ms = 2600) {
  flash.value = { show: true, type, message };
  if (flashTimer.value) clearTimeout(flashTimer.value);
  flashTimer.value = setTimeout(() => (flash.value.show = false), ms);
}
function hideFlash() {
  flash.value.show = false;
  if (flashTimer.value) clearTimeout(flashTimer.value);
}
onBeforeUnmount(() => {
  if (flashTimer.value) clearTimeout(flashTimer.value);
});

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
function titleCase(s = "") {
  return String(s)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}
function safeName(name = "archivo") {
  return String(name)
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 140);
}
function coerceDateLike(v) {
  if (!v) return v;
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d;
  }
  return v;
}

function normalizeDoc(d) {
  const n = { ...(d || {}) };
  n.fechaSubida = coerceDateLike(n.fechaSubida);
  n.fechaAprobacion = coerceDateLike(n.fechaAprobacion);

  if (Array.isArray(n.historial)) {
    n.historial = n.historial.map((h) => ({ ...h, fecha: coerceDateLike(h?.fecha) }));
  }
  if (!Array.isArray(n.archivosStorage)) n.archivosStorage = [];
  if (!Array.isArray(n.items)) n.items = [];
  return n;
}

const userRole = ref("");
const userDocData = ref(null);

async function loadUserData() {
  try {
    const uid = auth?.user?.uid;
    if (!uid) return;
    const uref = doc(db, "Usuarios", uid);
    const usnap = await getDoc(uref);
    if (usnap.exists()) {
      const d = usnap.data() || {};
      userDocData.value = d;
      userRole.value = (d.role || d.rol || "").toString();
    }
  } catch (e) {
    console.warn("No se pudo cargar datos/rol del usuario:", e);
  }
}

function getUsuarioNombre() {
  const fromProfile = (auth?.profile?.fullName || auth?.fullName || "").trim();
  if (fromProfile) return fromProfile;

  const d = userDocData.value || {};
  const fromDoc = (d.fullName || d.fullname || d.nombreCompleto || "").toString().trim();
  if (fromDoc) return fromDoc;

  const nombres = (d.nombres || d.nombre || d.firstName || "").toString().trim();
  const apellidos = (d.apellidos || d.apellido || d.lastName || "").toString().trim();
  const combined = `${nombres} ${apellidos}`.trim();
  if (combined) return combined;

  const disp = (auth?.user?.displayName || "").trim();
  if (disp) return disp;

  const email = (auth?.user?.email || "").trim();
  if (email && email.includes("@")) {
    const local = email.split("@")[0].replace(/[._-]+/g, " ");
    return titleCase(local);
  }
  return "Sistema";
}

const roleEffective = computed(() => (auth?.role || userRole.value || "").toString());
const isEditor = computed(() => norm(roleEffective.value) === "editor");
const canEditDetalle = computed(() => !!docData.value?.__docId && isEditor.value);

const archivoOCArrayView = computed(() => {
  const d = docData.value || {};
  const out = [];
  if (Array.isArray(d.archivoOC)) out.push(...d.archivoOC);
  else if (d.archivoOC && typeof d.archivoOC === "object" && d.archivoOC.url) out.push(d.archivoOC);
  return out.filter((x) => x?.url);
});

function getArchivoOCArrayRaw() {
  const d = docData.value || {};
  if (Array.isArray(d.archivoOC)) return d.archivoOC.map((x) => ({ ...x }));
  if (d.archivoOC && typeof d.archivoOC === "object" && d.archivoOC.url) return [{ ...d.archivoOC }];
  return [];
}

async function reloadDoc() {
  const id = route.params.id;
  if (!id) return;

  const dref = doc(db, "ordenes_oc_taller", String(id));
  const snap = await getDoc(dref);
  if (!snap.exists()) return;

  docData.value = normalizeDoc({ __docId: snap.id, ...snap.data() });
}

onMounted(async () => {
  try {
    await loadUserData();
    const id = route.params.id;
    if (!id) {
      error.value = "Falta el ID del documento.";
      loading.value = false;
      return;
    }
    await reloadDoc();
    if (!docData.value) error.value = "No se encontró la orden de compra.";
  } catch (e) {
    console.error(e);
    error.value = "Ocurrió un error al cargar la orden de compra.";
  } finally {
    loading.value = false;
  }
});

const canResubmitBase = computed(() => {
  const s = norm(docData.value?.estatus);
  return s.includes("rechaz") || s.includes("pendiente");
});
const canUploadArchivoOCBase = computed(() => norm(docData.value?.estatus) === "aprobado");

const canResubmitEditor = computed(() => isEditor.value && canResubmitBase.value);
const canUploadArchivoOCEditor = computed(() => isEditor.value && canUploadArchivoOCBase.value);

const editingDetalle = ref(false);
const draftEstatus = ref("Pendiente de Aprobación");
const draftComentario = ref("");
const draftPrecioTotal = ref(0);

const editAdjuntos = ref([]);
const editArchivoOCFile = ref(null);

function startEditDetalle() {
  if (!canEditDetalle.value) return;
  hideFlash();
  editingDetalle.value = true;

  draftEstatus.value = (docData.value?.estatus || "Pendiente de Aprobación").toString();
  draftComentario.value = (docData.value?.comentario || "").toString();
  draftPrecioTotal.value = Number(docData.value?.precioTotalConIVA || 0);

  editAdjuntos.value = [];
  editArchivoOCFile.value = null;

  const a = document.getElementById("fileEditAdjuntos");
  if (a) a.value = "";
  const b = document.getElementById("fileEditArchivoOC");
  if (b) b.value = "";
}

function cancelEditDetalle() {
  editingDetalle.value = false;
  editAdjuntos.value = [];
  editArchivoOCFile.value = null;

  draftEstatus.value = (docData.value?.estatus || "Pendiente de Aprobación").toString();
  draftComentario.value = (docData.value?.comentario || "").toString();
  draftPrecioTotal.value = Number(docData.value?.precioTotalConIVA || 0);

  const a = document.getElementById("fileEditAdjuntos");
  if (a) a.value = "";
  const b = document.getElementById("fileEditArchivoOC");
  if (b) b.value = "";
}

function onPickEditAdjuntos(e) {
  editAdjuntos.value = Array.from(e?.target?.files || []);
}
function onPickEditArchivoOC(e) {
  const f = (e?.target?.files || [])[0];
  editArchivoOCFile.value = f || null;
}
function storageRefFromDownloadURL(url) {
  if (!url) return null;
  const u = String(url);

  if (u.startsWith("gs://")) return sref(getStorage(), u);

  const idx = u.indexOf("/o/");
  if (idx !== -1) {
    const after = u.substring(idx + 3);
    const encodedPath = after.split("?")[0];
    const path = decodeURIComponent(encodedPath);
    return sref(getStorage(), path);
  }

  return sref(getStorage(), u);
}

function isOwnedByThisDoc(fileObj) {
  const dId = String(docData.value?.__docId || "");
  if (!dId) return false;

  const p = String(fileObj?.path || "");
  if (p && p.startsWith(`ordenes_oc_taller/${dId}/`)) return true;

  const url = String(fileObj?.url || "");
  if (!url) return false;
  return url.includes(`ordenes_oc_taller%2F${encodeURIComponent(dId)}%2F`);
}

async function safeDeleteFileObj(fileObj) {
  try {
    if (!fileObj) return;
    if (!isOwnedByThisDoc(fileObj)) return;

    const storage = getStorage();
    if (fileObj.path) {
      await deleteObject(sref(storage, fileObj.path));
      return;
    }
    if (fileObj.url) {
      const r = storageRefFromDownloadURL(fileObj.url);
      if (!r) return;
      await deleteObject(r);
    }
  } catch(e) {console.log(e)
  }
}

async function uploadOne(file, folder, prefix) {
  const storage = getStorage();
  const dId = String(docData.value.__docId);

  const path = `ordenes_oc_taller/${dId}/${folder}/${prefix}_${Date.now()}_${safeName(file.name)}`;
  const r = sref(storage, path);

  const up = await uploadBytes(r, file);
  const url = await getDownloadURL(up.ref);

  return {
    nombre: file.name,
    tipo: file.type || "application/octet-stream",
    url,
    fechaSubida: new Date().toISOString(),
    path,
    origen: "ordenes_oc_taller",
  };
}

async function saveEditDetalle() {
  try {
    error.value = "";
    hideFlash();

    if (!canEditDetalle.value) {
      error.value = "No tienes permisos para editar esta OC.";
      return;
    }
    if (!docData.value?.__docId) {
      error.value = "Documento no cargado.";
      return;
    }

    const precioNum = Number(draftPrecioTotal.value ?? 0);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      error.value = "El total con IVA debe ser un número válido.";
      return;
    }

    busy.value.on = true;
    busy.value.label = "Guardando cambios…";
    busy.value.hint = "";

    const dId = docData.value.__docId;
    const dref = doc(db, "ordenes_oc_taller", dId);

    const usuario = getUsuarioNombre();
    const hist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];

    const prevEstatus = (docData.value.estatus || "").toString();
    const nextEstatus = (draftEstatus.value || "").toString().trim();

    hist.push({
      estatus: nextEstatus || "Editado",
      fecha: new Date().toISOString(),
      usuario,
      comentario: `Edición manual: estatus "${prevEstatus || "—"}" → "${nextEstatus || "—"}"`,
    });

    const updates = {
      estatus: nextEstatus || docData.value.estatus || "Pendiente de Aprobación",
      comentario: (draftComentario.value || "").toString().trim(),
      precioTotalConIVA: precioNum,
      historial: hist,
    };
    if (editAdjuntos.value.length) {
      const actuales = Array.isArray(docData.value.archivosStorage) ? [...docData.value.archivosStorage] : [];
      const nuevos = [];

      for (let i = 0; i < editAdjuntos.value.length; i++) {
        const f = editAdjuntos.value[i];
        busy.value.label = `Subiendo adjuntos… (${i + 1}/${editAdjuntos.value.length})`;
        busy.value.hint = f.name;
        const meta = await uploadOne(f, "adjuntos", "adjunto");
        nuevos.push({
          nombre: meta.nombre,
          tipo: meta.tipo,
          url: meta.url,
          fechaSubida: meta.fechaSubida,
          path: meta.path,
        });
      }

      updates.archivosStorage = [...nuevos, ...actuales];
      hist.push({
        estatus: "Adjuntos actualizados",
        fecha: new Date().toISOString(),
        usuario,
        comentario: `Se agregaron ${nuevos.length} archivo(s) a archivos.`,
      });
    }
    if (editArchivoOCFile.value) {
      const actuales = getArchivoOCArrayRaw();
      const f = editArchivoOCFile.value;

      busy.value.label = "Subiendo archivoOC…";
      busy.value.hint = f.name;

      const meta = await uploadOne(f, "oc", "archivoOC");
      const nuevo = {
        nombre: meta.nombre,
        tipo: meta.tipo,
        url: meta.url,
        fechaSubida: meta.fechaSubida,
        path: meta.path,
      };

      const merged = [nuevo, ...actuales];
      let nextArchivoOC = null;
      if (merged.length === 1) nextArchivoOC = merged[0];
      else if (merged.length > 1) nextArchivoOC = merged;

      updates.archivoOC = nextArchivoOC;

      hist.push({
        estatus: "Archivo OC actualizado",
        fecha: new Date().toISOString(),
        usuario,
        comentario: `Se agregó 1 archivo a archivo OC: ${nuevo.nombre}`,
      });
    }

    busy.value.label = "Actualizando documento…";
    busy.value.hint = "";
    await updateDoc(dref, updates);

    await reloadDoc();
    editingDetalle.value = false;

    editAdjuntos.value = [];
    editArchivoOCFile.value = null;

    const a = document.getElementById("fileEditAdjuntos");
    if (a) a.value = "";
    const b = document.getElementById("fileEditArchivoOC");
    if (b) b.value = "";

    showFlash("success", "Cambios guardados correctamente ✅");
  } catch (e) {
    console.error(e);
    error.value = "No se pudieron guardar los cambios. Intenta nuevamente.";
    showFlash("danger", "No se pudieron guardar los cambios.");
  } finally {
    busy.value.on = false;
    busy.value.label = "Procesando…";
    busy.value.hint = "";
  }
}

const confirmDel = ref({
  show: false,
  key: "",
  idx: -1,
  nombre: "",
  tipo: "",
});
const confirmErr = ref("");
const deleting = ref({ key: "", idx: -1 });

const confirmBusy = computed(() => {
  if (!confirmDel.value.show) return false;
  return deleting.value.key === confirmDel.value.key && deleting.value.idx === confirmDel.value.idx;
});

function askDelete(key, idx, fileObj) {
  if (!editingDetalle.value || !canEditDetalle.value) return;
  hideFlash();
  confirmErr.value = "";

  confirmDel.value = {
    show: true,
    key,
    idx,
    nombre: fileObj?.nombre || "Archivo",
    tipo: fileObj?.tipo || "—",
  };
}

function closeConfirm(force = false) {
  if (!force && confirmBusy.value) return;
  confirmErr.value = "";
  confirmDel.value = { show: false, key: "", idx: -1, nombre: "", tipo: "" };
}

async function confirmDelete() {
  if (confirmBusy.value) return;
  confirmErr.value = "";
  const { key, idx } = confirmDel.value;
  const ok = await performDelete(key, idx);
  if (ok) closeConfirm(true);
}

async function performDelete(key, idx) {
  try {
    if (!editingDetalle.value || !canEditDetalle.value) return false;
    if (!docData.value?.__docId) return false;

    deleting.value = { key, idx };
    busy.value.on = true;
    busy.value.label = "Eliminando archivo…";
    busy.value.hint = "";

    const usuario = getUsuarioNombre();
    const hist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    const dref = doc(db, "ordenes_oc_taller", docData.value.__docId);

    if (key === "archivoOC") {
      const arr = getArchivoOCArrayRaw();
      const target = arr[idx];
      if (!target) return false;

      await safeDeleteFileObj(target);
      arr.splice(idx, 1);

      hist.push({
        estatus: "Archivo eliminado",
        fecha: new Date().toISOString(),
        usuario,
        comentario: `Eliminado archivo OC: ${target.nombre || "Archivo"}`,
      });

      let nextArchivoOC = null;
      if (arr.length === 1) nextArchivoOC = arr[0];
      else if (arr.length > 1) nextArchivoOC = arr;

      await updateDoc(dref, { archivoOC: nextArchivoOC, historial: hist });
      await reloadDoc();
      showFlash("success", "Archivo eliminado ✅");
      return true;
    }

    if (key === "archivosStorage") {
      const arr = Array.isArray(docData.value.archivosStorage) ? [...docData.value.archivosStorage] : [];
      const target = arr[idx];
      if (!target) return false;

      await safeDeleteFileObj(target);
      arr.splice(idx, 1);

      hist.push({
        estatus: "Archivo eliminado",
        fecha: new Date().toISOString(),
        usuario,
        comentario: `Eliminado archivo: ${target.nombre || "Adjunto"}`,
      });

      await updateDoc(dref, { archivosStorage: arr, historial: hist });
      await reloadDoc();
      showFlash("success", "Adjunto eliminado ✅");
      return true;
    }

    return false;
  } catch (e) {
    console.error(e);
    confirmErr.value = "No se pudo eliminar el archivo. Intenta nuevamente.";
    showFlash("danger", "No se pudo eliminar el archivo.");
    return false;
  } finally {
    deleting.value = { key: "", idx: -1 };
    busy.value.on = false;
    busy.value.label = "Procesando…";
    busy.value.hint = "";
  }
}
const filesNuevaCoti = ref([]);
const nuevoPrecio = ref(null);
const nuevoComentario = ref("");
const nuevoEstatus = ref("Revisión Guillermo");

const submitting = ref(false);
const submitOk = ref(false);
const submitError = ref("");

const onFilesNuevaCoti = (e) => {
  filesNuevaCoti.value = Array.from(e.target.files || []);
  submitOk.value = false;
  submitError.value = "";
};

const resetForm = () => {
  filesNuevaCoti.value = [];
  nuevoPrecio.value = null;
  nuevoComentario.value = "";
  nuevoEstatus.value = "Revisión Guillermo";
  submitOk.value = false;
  submitError.value = "";
  const el = document.getElementById("filesNuevaCoti");
  if (el) el.value = "";
};

const subirNuevaCotizacion = async () => {
  try {
    submitOk.value = false;
    submitError.value = "";

    if (!isEditor.value) {
      submitError.value = "No tienes permisos para realizar esta acción.";
      return;
    }
    if (!docData.value?.__docId) {
      submitError.value = "Documento no cargado.";
      return;
    }
    if (!filesNuevaCoti.value.length) {
      submitError.value = "Debes seleccionar al menos un archivo de cotización.";
      return;
    }

    const precioNum = Number(nuevoPrecio.value ?? 0);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      submitError.value = "El precio debe ser un número válido.";
      return;
    }

    submitting.value = true;
    busy.value.on = true;
    busy.value.label = "Subiendo cotización…";
    busy.value.hint = "";

    const storage = getStorage();
    const uploaded = await Promise.all(
      filesNuevaCoti.value.map(async (f) => {
        const path = `ordenes_oc_taller/${docData.value.__docId}/cotizacion_${Date.now()}_${safeName(f.name)}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        return {
          nombre: f.name,
          tipo: f.type || "application/octet-stream",
          url,
          fechaSubida: new Date().toISOString(),
          path,
        };
      })
    );

    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: "Revisión Guillermo",
      fecha: new Date().toISOString(),
      usuario,
      comentario: (nuevoComentario.value || "").trim(),
    });

    const prev = Array.isArray(docData.value.archivosStorage) ? docData.value.archivosStorage : [];
    const archivosStorage = [...uploaded, ...prev];

    const dref = doc(db, "ordenes_oc_taller", docData.value.__docId);
    const updates = {
      archivosStorage,
      precioTotalConIVA: precioNum,
      comentario: (nuevoComentario.value || "").trim(),
      estatus: "Revisión Guillermo",
      historial: nuevoHist,
    };
    await updateDoc(dref, updates);

    await reloadDoc();
    submitOk.value = true;
    resetForm();
    showFlash("success", "Cotización actualizada ✅");
  } catch (e) {
    console.error(e);
    submitError.value = "No se pudo subir la(s) nueva(s) cotización(es). Intenta nuevamente.";
    showFlash("danger", "No se pudo actualizar la cotización.");
  } finally {
    submitting.value = false;
    busy.value.on = false;
    busy.value.label = "Procesando…";
    busy.value.hint = "";
  }
};
const fileArchivoOC = ref(null);
const comentarioEnvio = ref("");
const sending = ref(false);
const sendOk = ref(false);
const sendError = ref("");

const onFileArchivoOC = (e) => {
  fileArchivoOC.value = (e?.target?.files || [])[0] || null;
  sendOk.value = false;
  sendError.value = "";
};

const resetEnvio = () => {
  fileArchivoOC.value = null;
  comentarioEnvio.value = "";
  sendOk.value = false;
  sendError.value = "";
  const el = document.getElementById("fileArchivoOC");
  if (el) el.value = "";
};

const subirArchivoOC = async () => {
  try {
    sendOk.value = false;
    sendError.value = "";

    if (!isEditor.value) {
      sendError.value = "No tienes permisos para realizar esta acción.";
      return;
    }
    if (!docData.value?.__docId) {
      sendError.value = "Documento no cargado.";
      return;
    }
    if (!fileArchivoOC.value) {
      sendError.value = "Debes seleccionar un archivo.";
      return;
    }

    sending.value = true;
    busy.value.on = true;
    busy.value.label = "Subiendo archivoOC…";
    busy.value.hint = fileArchivoOC.value.name;

    const meta = await uploadOne(fileArchivoOC.value, "oc", "archivoOC");
    const nuevo = {
      nombre: meta.nombre,
      tipo: meta.tipo,
      url: meta.url,
      fechaSubida: meta.fechaSubida,
      path: meta.path,
    };
    const actuales = getArchivoOCArrayRaw();
    const merged = [nuevo, ...actuales];

    let nextArchivoOC = null;
    if (merged.length === 1) nextArchivoOC = merged[0];
    else if (merged.length > 1) nextArchivoOC = merged;

    const usuario = getUsuarioNombre();
    const nuevoHist = Array.isArray(docData.value.historial) ? [...docData.value.historial] : [];
    nuevoHist.push({
      estatus: "Enviada a proveedor",
      fecha: new Date().toISOString(),
      usuario,
      comentario: (comentarioEnvio.value || "").trim(),
    });

    const dref = doc(db, "ordenes_oc_taller", docData.value.__docId);
    const updates = {
      archivoOC: nextArchivoOC,
      historial: nuevoHist,
      estatus: "Enviada a proveedor",
    };

    await updateDoc(dref, updates);
    await reloadDoc();

    sendOk.value = true;
    resetEnvio();
    showFlash("success", "Archivo OC subido y enviada ✅");
  } catch (e) {
    console.error(e);
    sendError.value = "No se pudo subir el archivo OC. Intenta nuevamente.";
    showFlash("danger", "No se pudo subir la OC.");
  } finally {
    sending.value = false;
    busy.value.on = false;
    busy.value.label = "Procesando…";
    busy.value.hint = "";
  }
};
const fmtFecha = (f) => {
  try {
    if (!f) return "—";
    if (typeof f === "string") return f;
    let d = null;
    if (f?.toDate) d = f.toDate();
    else if (f instanceof Date) d = f;
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const fmtMoneda = (n, c = "CLP") => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("es-CL", { style: "currency", currency: c || "CLP", minimumFractionDigits: 0 });
  } catch {
    return `${c || "CLP"} ${v.toLocaleString("es-CL")}`;
  }
};

const estadoBadgeClass = (estatus) => {
  const s = norm(estatus);
  if (s === "aprobado") return "bg-success-subtle text-success-emphasis";
  if (s === "preaprobado") return "bg-info-subtle text-info-emphasis";
  if (s.includes("pendiente")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("proveedor") || s.includes("enviada")) return "bg-primary-subtle text-primary-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const itemEstadoBadge = (e) => {
  const s = norm(e);
  if (s.includes("complet")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("parcial")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("revision")) return "bg-info-subtle text-info-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const ordenarHistorial = (hist) => {
  const arr = Array.isArray(hist) ? [...hist] : [];
  arr.sort((a, b) => toMillis(b?.fecha) - toMillis(a?.fecha));
  return arr;
};

const toMillis = (x) => {
  if (!x) return 0;
  if (x?.toMillis) return x.toMillis();
  if (x?.toDate) return x.toDate().getTime();
  if (x instanceof Date) return x.getTime();
  if (typeof x === "string") {
    const d = new Date(x);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
};

const tieneArchivos = computed(() => {
  const oc = archivoOCArrayView.value.length > 0;
  const a = (docData.value?.archivosStorage || []).length > 0;
  return oc || a;
});
</script>

<style scoped>
.card-elevated {
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.06) !important;
  border-radius: 0.9rem !important;
}

.timeline {
  position: relative;
  padding-left: 1.25rem;
}
.timeline::before {
  content: "";
  position: absolute;
  left: 0.44rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}
.timeline-item {
  position: relative;
  margin-bottom: 1rem;
}
.timeline-dot {
  position: absolute;
  left: -0.03rem;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e5e7eb;
  transform: translateY(0.35rem);
}
.timeline-content {
  padding-left: 0.75rem;
}

.busy-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 16px;
}
.busy-card {
  width: min(720px, 96vw);
  background: #fff;
  border-radius: 16px;
  padding: 16px 18px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 2200;
  display: grid;
  place-items: center;
  padding: 16px;
  backdrop-filter: blur(6px);
}
.modal-dialog-custom {
  width: min(680px, 96vw);
  margin: 0;
}
.modal-surface {
  background: #ffffff;
  color: #111827;
  border-radius: 22px;
  overflow: hidden;
}
.minw-0 {
  min-width: 0;
}
.modal-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-size: 1.25rem;
  flex: 0 0 auto;
}
.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  color: #111827;
  transition: background 0.15s ease, transform 0.05s ease;
  flex: 0 0 auto;
}
.icon-btn:hover {
  background: #e5e7eb;
}
.icon-btn:active {
  transform: scale(0.98);
}
.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.file-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 16px 18px;
}
.file-ico {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  flex: 0 0 auto;
}
.file-name {
  color: #111827;
}
.modal-btn {
  min-width: 130px;
  padding: 10px 18px;
  border-radius: 14px;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
