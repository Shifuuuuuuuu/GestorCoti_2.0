<!-- src/views/Soporte.vue -->
<template>
  <div class="soporte-page">
    <div class="container py-4 py-md-5">
      <!-- HEADER -->
      <section class="hero-support mb-4">
        <div class="hero-support__content">
          <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap">
            <div>
              <div class="eyebrow mb-2">
                <i class="bi bi-life-preserver me-2"></i>
                Centro de soporte
              </div>
              <h1 class="hero-title mb-2">Soporte</h1>
              <p class="hero-subtitle mb-0">
                Crea tickets, adjunta evidencias y revisa el estado de tus solicitudes en un solo lugar.
              </p>
            </div>
          </div>

          <div class="hero-stats mt-4">
            <div class="stat-card">
              <div class="stat-icon stat-icon-neutral">
                <i class="bi bi-ticket-detailed"></i>
              </div>
              <div>
                <div class="stat-value">{{ tickets.length }}</div>
                <div class="stat-label">Tickets totales</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-warning">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div>
                <div class="stat-value">{{ pendientesCount }}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-info">
                <i class="bi bi-search"></i>
              </div>
              <div>
                <div class="stat-value">{{ revisionCount }}</div>
                <div class="stat-label">En revisión</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-success">
                <i class="bi bi-check2-circle"></i>
              </div>
              <div>
                <div class="stat-value">{{ resueltosCount }}</div>
                <div class="stat-label">Resueltos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ALERTAS -->
      <div
        v-if="success"
        class="alert alert-success d-flex align-items-start justify-content-between gap-3 shadow-sm border-0 rounded-4"
      >
        <div class="d-flex align-items-start gap-2">
          <i class="bi bi-check-circle-fill mt-1"></i>
          <div>{{ success }}</div>
        </div>
        <button class="btn-close" @click="success=''"></button>
      </div>

      <div
        v-if="error"
        class="alert alert-danger d-flex align-items-start justify-content-between gap-3 shadow-sm border-0 rounded-4"
      >
        <div class="d-flex align-items-start gap-2">
          <i class="bi bi-exclamation-octagon-fill mt-1"></i>
          <div>{{ error }}</div>
        </div>
        <button class="btn-close" @click="error=''"></button>
      </div>

      <!-- CREAR TICKET -->
      <div class="support-card support-card--form mb-4">
        <div class="support-card__header">
          <div>
            <div class="section-kicker">Nuevo caso</div>
            <h2 class="section-title mb-1">Crear ticket</h2>
            <p class="section-subtitle mb-0">
              Cuéntanos qué ocurrió y adjunta imágenes o PDF si necesitas mostrar evidencia.
            </p>
          </div>

          <div class="header-chip">
            <i class="bi bi-shield-check me-2"></i>
            Atención interna
          </div>
        </div>

        <div class="support-card__body">
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label class="form-label fw-semibold">Tipo de problema</label>
              <div class="input-icon-wrap">
                <i class="bi bi-tags input-icon"></i>
                <select class="form-select form-control-pro" v-model="form.tipo">
                  <option disabled value="">Selecciona…</option>
                  <option>Contraseña</option>
                  <option>Correo</option>
                  <option>Solped</option>
                  <option>Cotización</option>
                  <option>Equipo</option>
                  <option>Mejoras</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div class="col-12 col-md-8">
              <label class="form-label fw-semibold">Asunto</label>
              <div class="input-icon-wrap">
                <i class="bi bi-pencil-square input-icon"></i>
                <input
                  class="form-control form-control-pro"
                  v-model="form.asunto"
                  placeholder="Ej: No puedo ingresar al sistema"
                />
              </div>
            </div>

            <div v-if="mostrarCampoReferencia" class="col-12 col-md-6">
              <label class="form-label fw-semibold">
                {{ form.tipo === 'Solped' ? 'Número de SOLPED' : 'Número de Cotización' }}
              </label>
              <div class="input-icon-wrap">
                <i class="bi bi-hash input-icon"></i>
                <input
                  class="form-control form-control-pro"
                  v-model="form.referenciaProblema"
                  :placeholder="form.tipo === 'Solped' ? 'Ej: 1517' : 'Ej: 3004'"
                />
              </div>
              <small class="text-secondary">
                Este dato quedará guardado junto al ticket.
              </small>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Descripción del caso</label>
              <textarea
                class="form-control form-control-pro textarea-pro"
                rows="5"
                v-model="form.descripcion"
                placeholder="Describe el problema con el mayor detalle posible…"
              ></textarea>
              <small class="text-secondary">
                Incluye códigos, mensajes de error, pantallazos o pasos para reproducir el problema.
              </small>
            </div>

            <div class="col-12 col-lg-7">
              <label class="form-label fw-semibold">
                Adjuntar archivos (opcional)
              </label>

              <div
                class="upload-dropzone"
                :class="{ 'upload-dropzone--drag': dragActive }"
                @dragenter.prevent="onDragEnter"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop"
              >
                <div class="upload-dropzone__icon">
                  <i class="bi bi-cloud-arrow-up"></i>
                </div>

                <div class="upload-dropzone__content">
                  <div class="upload-dropzone__title">
                    Arrastra tus archivos aquí o selecciónalos manualmente
                  </div>
                  <div class="upload-dropzone__text">
                    Permitidos: JPG, JPEG, PNG, WEBP y PDF · Máximo 10 archivos
                  </div>
                </div>

                <label class="btn btn-outline-danger btn-sm mb-0">
                  <i class="bi bi-paperclip me-1"></i>
                  Seleccionar archivos
                  <input
                    ref="fileInput"
                    type="file"
                    class="d-none"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    @change="onPickFiles"
                  />
                </label>
              </div>

              <div class="small text-secondary mt-2">
                {{ archivosSeleccionados.length }}/10 archivo(s) seleccionados
              </div>

              <div v-if="archivosSeleccionados.length" class="selected-files mt-3">
                <div
                  v-for="(f, idx) in archivosSeleccionados"
                  :key="`${f.name}-${idx}`"
                  class="selected-file"
                >
                  <div class="selected-file__left">
                    <div class="selected-file__icon">
                      <i :class="isPdfFile(f) ? 'bi bi-file-earmark-pdf' : 'bi bi-file-earmark-image'"></i>
                    </div>
                    <div class="minw-0">
                      <div class="selected-file__name text-truncate">{{ f.name }}</div>
                      <div class="selected-file__meta">
                        {{ formatFileSize(f.size) }}
                      </div>
                    </div>
                  </div>

                  <button class="btn btn-sm btn-outline-danger" @click="removeSelectedFile(idx)">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </div>

              <div v-if="sending && uploadProgress > 0" class="mt-3">
                <div class="d-flex justify-content-between align-items-center small mb-1">
                  <span class="text-secondary">Subiendo archivos…</span>
                  <strong>{{ uploadProgress }}%</strong>
                </div>
                <div class="progress progress-upload">
                  <div
                    class="progress-bar bg-danger"
                    role="progressbar"
                    :style="{ width: `${uploadProgress}%` }"
                    :aria-valuenow="uploadProgress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-5 d-flex align-items-end">
              <div class="w-100 submit-panel">
                <div class="submit-panel__text">
                  Tu ticket quedará registrado con estado inicial <strong>Pendiente</strong>.
                </div>
                <button class="btn btn-danger btn-send w-100" :disabled="!canSend || sending" @click="enviarTicket">
                  <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-send me-2"></i>
                  Enviar ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORIAL HEADER -->
      <div class="support-card mb-3">
        <div class="support-card__body py-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div class="section-kicker">Seguimiento</div>
              <h2 class="section-title mb-1">Mi historial de soporte</h2>
              <p class="section-subtitle mb-0">
                Revisa el avance de tus tickets y las respuestas del equipo de soporte.
              </p>
            </div>

            <div class="filters-wrap">
              <div class="filter-control">
                <i class="bi bi-funnel"></i>
                <select class="form-select form-select-sm filter-input" v-model="filtroEstado">
                  <option value="">Todos</option>
                  <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>

              <div class="filter-control filter-control--search">
                <i class="bi bi-search"></i>
                <input
                  class="form-control form-control-sm filter-input"
                  placeholder="Buscar por número, asunto o tipo…"
                  v-model="q"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="loading-panel">
        <div class="spinner-border text-danger" role="status"></div>
        <div class="small text-secondary mt-3">Cargando tus tickets…</div>
      </div>

      <!-- LISTADO -->
      <div v-else>
        <div v-if="listadoFiltrado.length === 0" class="support-empty">
          <div class="support-empty__icon">
            <i class="bi bi-inbox"></i>
          </div>
          <h3 class="support-empty__title">No hay tickets para mostrar</h3>
          <p class="support-empty__text mb-0">
            No tienes tickets con los filtros actuales. Prueba cambiando el estado o el texto de búsqueda.
          </p>
        </div>

        <div v-for="t in listadoFiltrado" :key="t.id" class="support-ticket mb-3">
          <div class="support-ticket__header">
            <div class="support-ticket__main minw-0">
              <div class="ticket-title-row">
                <div class="ticket-title text-truncate">{{ t.asunto || 'Sin asunto' }}</div>
                <span class="badge badge-status ms-sm-2" :class="badgeClass(t.estatus)">
                  {{ t.estatus }}
                </span>
              </div>

              <div class="ticket-meta">
                <span><i class="bi bi-hash me-1"></i>{{ t.numero || '—' }}</span>
                <span><i class="bi bi-calendar3 me-1"></i>{{ formatDateTime(t.created_at) }}</span>
                <span><i class="bi bi-diagram-3 me-1"></i>{{ t.tipo || '—' }}</span>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <button class="btn btn-outline-secondary btn-sm" @click="toggleExpand(t)">
                <i class="bi me-1" :class="expandId===t.id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                {{ expandId===t.id ? 'Ocultar detalle' : 'Ver detalle' }}
              </button>
            </div>
          </div>

          <transition name="expand-fade">
            <div v-if="expandId===t.id" class="support-ticket__body">
              <div class="row g-4">
                <div class="col-12 col-lg-8">
                  <div class="detail-block">
                    <div class="detail-block__label">Descripción del caso</div>
                    <div class="detail-block__content break-any">
                      {{ t.descripcion }}
                    </div>

                    <div
                      v-if="(t.tipo === 'Solped' || t.tipo === 'Cotización') && t.referenciaProblema"
                      class="reference-box mt-3"
                    >
                      <div class="reference-box__label">
                        {{ t.tipo === 'Solped' ? 'SOLPED relacionada' : 'Cotización relacionada' }}
                      </div>
                      <div class="reference-box__value">
                        {{ t.referenciaProblema }}
                      </div>
                    </div>
                  </div>

                  <div class="detail-block mt-3">
                    <div class="detail-block__label mb-2">Respuestas</div>

                    <div v-if="!t.respuestas?.length" class="empty-replies">
                      <i class="bi bi-chat-dots me-2"></i>
                      Aún no hay respuestas del equipo de soporte.
                    </div>

                    <div v-else class="responses-list">
                      <div v-for="(r, idx) in t.respuestas" :key="idx" class="response-item">
                        <div class="response-item__top">
                          <div class="response-user">
                            <span class="response-avatar">
                              {{ (r.usuario || 'S').charAt(0).toUpperCase() }}
                            </span>
                            <strong>{{ r.usuario || 'Soporte' }}</strong>
                          </div>
                          <small class="text-secondary">{{ formatDateTime(r.fecha) }}</small>
                        </div>

                        <div class="response-text break-any">
                          {{ r.texto }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="t.estatus==='Resuelto'" class="resolved-banner mt-3">
                    <i class="bi bi-patch-check-fill me-2"></i>
                    Este ticket fue marcado como <strong>Resuelto</strong>.
                  </div>
                </div>

                <div class="col-12 col-lg-4">
                  <div class="side-panel">
                    <div class="side-panel__item">
                      <div class="side-panel__label">Asignado a</div>
                      <div class="side-panel__value">{{ t.asignado_a_nombre || '—' }}</div>
                    </div>

                    <div class="side-panel__item">
                      <div class="side-panel__label">Última actualización</div>
                      <div class="side-panel__value">{{ formatDateTime(t.updated_at) || '—' }}</div>
                    </div>

                    <div class="side-panel__item">
                      <div class="side-panel__label mb-2">Adjuntos</div>

                      <!-- Compatibilidad ticket antiguo -->
                      <div v-if="!getAdjuntosTicket(t).length && t.imagen_url" class="ticket-image-card">
                        <div class="thumb-wrap" @click="openImg(t.imagen_url)" title="Ver grande">
                          <img
                            :src="t.imagen_url"
                            class="thumb img-fluid"
                            :alt="t.asunto || 'imagen ticket'"
                          />
                          <div class="thumb-overlay">
                            <i class="bi bi-zoom-in"></i>
                          </div>
                        </div>

                        <div class="d-flex gap-2 mt-3">
                          <button class="btn btn-outline-danger btn-sm flex-fill" @click="openImg(t.imagen_url)">
                            Ver
                          </button>
                          <a
                            class="btn btn-outline-secondary btn-sm flex-fill"
                            :href="t.imagen_url"
                            target="_blank"
                            rel="noopener"
                          >
                            Descargar
                          </a>
                        </div>
                      </div>

                      <div v-else-if="getAdjuntosTicket(t).length" class="attachments-list">
                        <div
                          v-for="(a, idx) in getAdjuntosTicket(t)"
                          :key="`${a.url}-${idx}`"
                          class="attachment-item"
                        >
                          <div class="attachment-item__left">
                            <div class="attachment-item__icon">
                              <i :class="a.tipo === 'pdf' ? 'bi bi-file-earmark-pdf' : 'bi bi-file-earmark-image'"></i>
                            </div>
                            <div class="minw-0">
                              <div class="attachment-item__name text-truncate">
                                {{ a.nombre || `Adjunto ${idx + 1}` }}
                              </div>
                              <div class="attachment-item__meta text-secondary">
                                {{ a.tipo === 'pdf' ? 'PDF' : 'Imagen' }}
                              </div>
                            </div>
                          </div>

                          <div class="d-flex gap-2">
                            <button
                              v-if="a.tipo !== 'pdf'"
                              class="btn btn-outline-danger btn-sm"
                              @click="openImg(a.url, a.nombre)"
                            >
                              Ver
                            </button>
                            <a
                              v-else
                              class="btn btn-outline-secondary btn-sm"
                              :href="a.url"
                              target="_blank"
                              rel="noopener"
                            >
                              Abrir PDF
                            </a>
                            <a
                              class="btn btn-outline-secondary btn-sm"
                              :href="a.url"
                              target="_blank"
                              rel="noopener"
                            >
                              Descargar
                            </a>
                          </div>
                        </div>
                      </div>

                      <div v-else class="text-secondary small">Sin archivos adjuntos.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- VISOR -->
    <transition name="viewer">
      <div v-if="viewerOpen" class="viewer-wrap" @keydown.esc="closeViewer" tabindex="0">
        <div class="viewer-backdrop" @click="closeViewer"></div>

        <div class="viewer-panel" role="dialog" aria-modal="true" aria-label="Visor de imagen">
          <div class="viewer-header">
            <div class="viewer-title text-truncate">
              {{ viewerName || 'Imagen' }}
            </div>

            <div class="d-flex gap-2 align-items-center">
              <a
                v-if="viewerUrl"
                :href="viewerUrl"
                target="_blank"
                rel="noopener"
                class="btn btn-sm btn-outline-light"
                title="Abrir en nueva pestaña / Descargar"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>

              <div class="btn-group btn-group-sm me-1" role="group" aria-label="Zoom">
                <button class="btn btn-outline-light" @click="zoomOut" :disabled="zoom<=0.5">
                  <i class="bi bi-zoom-out"></i>
                </button>
                <button class="btn btn-outline-light" @click="resetZoom">
                  <i class="bi bi-aspect-ratio"></i>
                </button>
                <button class="btn btn-outline-light" @click="zoomIn" :disabled="zoom>=3">
                  <i class="bi bi-zoom-in"></i>
                </button>
              </div>

              <button class="btn btn-sm btn-light" @click="closeViewer" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="viewer-body">
            <div class="viewer-img-wrap">
              <img
                :src="viewerUrl"
                :alt="viewerName || 'imagen'"
                class="viewer-img"
                :style="{ transform: `scale(${zoom})` }"
                @dblclick="toggleZoom"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "../stores/authService";
import { db } from "../stores/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Soporte",
  setup() {
    const auth = useAuthStore();
    const my = ref({ uid: "", nombre: "", email: "" });

    const error = ref("");
    const success = ref("");
    const sending = ref(false);
    const loading = ref(true);
    const uploadProgress = ref(0);

    const fileInput = ref(null);
    const dragActive = ref(false);
    const archivosSeleccionados = ref([]);

    const form = ref({
      tipo: "",
      asunto: "",
      descripcion: "",
      referenciaProblema: ""
    });

    const estados = ["Pendiente", "En revisión", "Resuelto"];
    const filtroEstado = ref("");
    const q = ref("");

    const tickets = ref([]);
    const expandId = ref(null);
    const toggleExpand = (t) => (expandId.value = expandId.value === t.id ? null : t.id);

    const mostrarCampoReferencia = computed(() =>
      form.value.tipo === "Solped" || form.value.tipo === "Cotización"
    );

    const canSend = computed(() => {
      const base = !!form.value.tipo && !!form.value.asunto && !!form.value.descripcion && !sending.value;
      if (!base) return false;
      if (mostrarCampoReferencia.value && !String(form.value.referenciaProblema || "").trim()) return false;
      return true;
    });

    const formatDateTime = (d) => {
      if (!d) return "";
      const dd = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
      if (isNaN(dd)) return "";
      return dd.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
    };

    const formatFileSize = (bytes) => {
      if (!bytes && bytes !== 0) return "";
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(2)} MB`;
    };

    const badgeClass = (st) => ({
      "badge-pending": st === "Pendiente",
      "badge-review": st === "En revisión",
      "badge-done": st === "Resuelto"
    });

    const pendientesCount = computed(() =>
      tickets.value.filter(t => t.estatus === "Pendiente").length
    );

    const revisionCount = computed(() =>
      tickets.value.filter(t => t.estatus === "En revisión").length
    );

    const resueltosCount = computed(() =>
      tickets.value.filter(t => t.estatus === "Resuelto").length
    );

    const isAllowedFile = (file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
      ];
      const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      const name = String(file?.name || "").toLowerCase();
      return allowedTypes.includes(file?.type) || allowedExt.some(ext => name.endsWith(ext));
    };

    const isPdfFile = (file) => {
      return file?.type === "application/pdf" || String(file?.name || "").toLowerCase().endsWith(".pdf");
    };

    const normalizeAdjuntoType = (file) => (isPdfFile(file) ? "pdf" : "imagen");

    const clearAlerts = () => {
      error.value = "";
      success.value = "";
    };

    const addFiles = (incoming) => {
      clearAlerts();

      const newFiles = Array.from(incoming || []);
      if (!newFiles.length) return;

      const invalids = newFiles.filter(f => !isAllowedFile(f));
      if (invalids.length) {
        error.value = "Solo se permiten archivos JPG, JPEG, PNG, WEBP o PDF.";
        return;
      }

      const actuales = [...archivosSeleccionados.value];
      const combinados = [...actuales];

      for (const file of newFiles) {
        const exists = combinados.some(
          f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        );
        if (!exists) combinados.push(file);
      }

      if (combinados.length > 10) {
        error.value = "Solo puedes subir un máximo de 10 archivos.";
        return;
      }

      archivosSeleccionados.value = combinados;
      success.value = `${newFiles.length} archivo(s) agregado(s) correctamente.`;
    };

    const onPickFiles = (e) => {
      addFiles(e.target.files);
      if (e?.target) e.target.value = "";
    };

    const removeSelectedFile = (idx) => {
      archivosSeleccionados.value.splice(idx, 1);
    };

    const onDragEnter = () => {
      dragActive.value = true;
    };

    const onDragOver = () => {
      dragActive.value = true;
    };

    const onDragLeave = (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        dragActive.value = false;
      }
    };

    const onDrop = (e) => {
      dragActive.value = false;
      addFiles(e.dataTransfer?.files || []);
    };

    const viewerOpen = ref(false);
    const viewerUrl = ref("");
    const viewerName = ref("");
    const zoom = ref(1);

    const openImg = (url, name = "Adjunto") => {
      viewerUrl.value = url || "";
      viewerName.value = name || "Adjunto";
      viewerOpen.value = !!viewerUrl.value;
      zoom.value = 1;
      setTimeout(() => {
        document.querySelector(".viewer-wrap")?.focus();
      }, 0);
    };

    const closeViewer = () => {
      viewerOpen.value = false;
      viewerUrl.value = "";
      zoom.value = 1;
    };

    const zoomIn = () => {
      zoom.value = Math.min(3, +(zoom.value + 0.25).toFixed(2));
    };

    const zoomOut = () => {
      zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2));
    };

    const resetZoom = () => {
      zoom.value = 1;
    };

    const toggleZoom = () => {
      zoom.value = zoom.value === 1 ? 2 : 1;
    };

    watch(viewerOpen, (v) => {
      document.documentElement.style.overflow = v ? "hidden" : "";
    });

    watch(
      () => form.value.tipo,
      (nuevo) => {
        if (nuevo !== "Solped" && nuevo !== "Cotización") {
          form.value.referenciaProblema = "";
        }
      }
    );

    const generarCorrelativo = async () => {
      try {
        const today = new Date();
        const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
        const qy = query(collection(db, "soportes"), where("fecha_ymd", "==", ymd));
        const snap = await getDocs(qy);
        return `${ymd}-${String((snap?.size || 0) + 1).padStart(4, "0")}`;
      } catch {
        return `TCK-${Date.now()}`;
      }
    };

    const uploadOneFile = async (file, idx, total) => {
      const storage = getStorage();
      const uid = auth?.user?.uid || "anon";
      const path = `soporte_adjuntos/${uid}/${Date.now()}_${idx}_${file.name}`;
      const sref = storageRef(storage, path);
      const task = uploadBytesResumable(sref, file);

      return await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            const filePercent = snapshot.totalBytes
              ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              : 0;

            const globalPercent = Math.round((((idx) + (filePercent / 100)) / total) * 100);
            uploadProgress.value = globalPercent;
          },
          (err) => reject(err),
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve({
                nombre: file.name,
                tipo: normalizeAdjuntoType(file),
                mimeType: file.type || "",
                size: file.size || 0,
                url,
                path
              });
            } catch (e) {
              reject(e);
            }
          }
        );
      });
    };

    const enviarTicket = async () => {
      if (!canSend.value) return;
      sending.value = true;
      uploadProgress.value = 0;
      clearAlerts();

      try {
        const numero = await generarCorrelativo();
        const totalFiles = archivosSeleccionados.value.length;
        const adjuntos = [];

        for (let i = 0; i < totalFiles; i++) {
          const subido = await uploadOneFile(archivosSeleccionados.value[i], i, totalFiles);
          adjuntos.push(subido);
        }

        uploadProgress.value = totalFiles ? 100 : 0;

        const payload = {
          numero,
          fecha_ymd: numero.split("-")[0] || null,
          uid: auth?.user?.uid || null,
          nombre_usuario: auth?.user?.displayName || auth?.user?.email || "Usuario",
          email_usuario: auth?.user?.email || null,
          tipo: form.value.tipo,
          asunto: form.value.asunto,
          descripcion: form.value.descripcion,
          referenciaProblema: mostrarCampoReferencia.value ? String(form.value.referenciaProblema || "").trim() : "",
          imagen_url: adjuntos.find(a => a.tipo === "imagen")?.url || "",
          adjuntos,
          estatus: "Pendiente",
          asignado_a_uid: null,
          asignado_a_nombre: null,
          respuestas: [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };

        await addDoc(collection(db, "soportes"), payload);

        form.value = {
          tipo: "",
          asunto: "",
          descripcion: "",
          referenciaProblema: ""
        };
        archivosSeleccionados.value = [];
        uploadProgress.value = 0;
        success.value = "Tu ticket se envió correctamente.";
      } catch (e) {
        console.error(e);
        error.value = "No se pudo enviar tu ticket. Revisa los archivos e intenta nuevamente.";
      } finally {
        sending.value = false;
      }
    };

    const getAdjuntosTicket = (ticket) => {
      if (Array.isArray(ticket?.adjuntos) && ticket.adjuntos.length) return ticket.adjuntos;
      return [];
    };

    const listadoFiltrado = computed(() => {
      const txt = q.value.trim().toUpperCase();
      return tickets.value.filter((t) => {
        if (filtroEstado.value && t.estatus !== filtroEstado.value) return false;
        if (!txt) return true;

        const hay = [
          t.numero,
          t.asunto,
          t.descripcion,
          t.tipo,
          t.asignado_a_nombre,
          t.referenciaProblema
        ].join(" | ").toUpperCase();

        return hay.includes(txt);
      });
    });

    onMounted(async () => {
      my.value = {
        uid: auth?.user?.uid || "",
        nombre: auth?.user?.displayName || "",
        email: auth?.user?.email || ""
      };

      const qy = query(
        collection(db, "soportes"),
        where("uid", "==", my.value.uid || "__none__"),
        orderBy("created_at", "desc")
      );

      onSnapshot(
        qy,
        (snap) => {
          const arr = [];
          snap.forEach((d) => {
            arr.push({ id: d.id, ...d.data() });
          });
          tickets.value = arr;
          loading.value = false;
        },
        (err) => {
          console.error(err);
          loading.value = false;
          error.value = "No se pudo cargar tu historial.";
        }
      );
    });

    return {
      error,
      success,
      sending,
      loading,
      form,
      estados,
      filtroEstado,
      q,
      tickets,
      expandId,
      viewerOpen,
      viewerUrl,
      viewerName,
      zoom,
      uploadProgress,
      dragActive,
      archivosSeleccionados,
      mostrarCampoReferencia,
      fileInput,

      canSend,
      listadoFiltrado,
      pendientesCount,
      revisionCount,
      resueltosCount,

      toggleExpand,
      formatDateTime,
      formatFileSize,
      badgeClass,
      openImg,
      closeViewer,
      zoomIn,
      zoomOut,
      resetZoom,
      toggleZoom,
      enviarTicket,
      onPickFiles,
      removeSelectedFile,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      getAdjuntosTicket,
      isPdfFile
    };
  }
};
</script>

<style scoped>
.soporte-page {
  min-height: 100vh;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.hero-support {
  border-radius: 22px;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.05);
}

.hero-support__content {
  padding: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: var(--bs-secondary-bg);
  color: var(--bs-secondary-color, var(--bs-body-color));
  border: 1px solid var(--bs-border-color);
}

.hero-title {
  font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--bs-body-color);
}

.hero-subtitle {
  max-width: 760px;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 18px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.stat-icon-neutral {
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
}

.stat-icon-warning {
  background: rgba(255, 193, 7, 0.12);
  color: #c28700;
}

.stat-icon-info {
  background: rgba(108, 117, 125, 0.14);
  color: var(--bs-body-color);
}

.stat-icon-success {
  background: rgba(25, 135, 84, 0.14);
  color: #198754;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  color: var(--bs-body-color);
}

.stat-label {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.support-card {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 22px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.04);
}

.support-card--form {
  overflow: hidden;
}

.support-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.35rem 0;
  flex-wrap: wrap;
}

.support-card__body {
  padding: 1.35rem;
}

.section-kicker {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #dc2626;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--bs-body-color);
}

.section-subtitle {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.95rem;
}

.header-chip {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--bs-secondary-bg);
  color: var(--bs-secondary-color, var(--bs-body-color));
  font-weight: 700;
  border: 1px solid var(--bs-border-color);
}

.input-icon-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bs-secondary-color, #6c757d);
  z-index: 2;
}

.form-control-pro {
  min-height: 48px;
  border-radius: 14px;
  padding-left: 2.6rem;
  border: 1px solid var(--bs-border-color);
  box-shadow: none;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.form-control-pro:focus,
.filter-input:focus,
.textarea-pro:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 0.22rem rgba(220, 38, 38, 0.08);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.textarea-pro {
  border-radius: 16px;
  border: 1px solid var(--bs-border-color);
  padding: 0.9rem 1rem;
  resize: vertical;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.upload-dropzone {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed var(--bs-border-color);
  border-radius: 18px;
  transition: 0.2s ease;
  flex-wrap: wrap;
  background: var(--bs-tertiary-bg);
}

.upload-dropzone--drag {
  border-color: #dc2626;
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.08);
  background: color-mix(in srgb, var(--bs-tertiary-bg) 70%, rgba(220, 38, 38, 0.08));
}

.upload-dropzone__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.upload-dropzone__content {
  flex: 1;
  min-width: 220px;
}

.upload-dropzone__title {
  font-weight: 700;
  color: var(--bs-body-color);
}

.upload-dropzone__text {
  font-size: 0.9rem;
  color: var(--bs-secondary-color, #6c757d);
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 14px;
  background: var(--bs-body-bg);
}

.selected-file__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.selected-file__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  flex-shrink: 0;
}

.selected-file__name {
  font-weight: 700;
  color: var(--bs-body-color);
}

.selected-file__meta {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.85rem;
}

.progress-upload {
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bs-secondary-bg);
}

.submit-panel {
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.submit-panel__text {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.92rem;
  margin-bottom: 0.85rem;
}

.btn-send {
  min-height: 48px;
  border-radius: 14px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(220, 38, 38, 0.12);
}

.filters-wrap {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  width: 100%;
  max-width: 520px;
}

.filter-control {
  position: relative;
  flex: 1 1 160px;
}

.filter-control i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bs-secondary-color, #6c757d);
  z-index: 2;
}

.filter-input {
  min-height: 40px;
  border-radius: 12px;
  padding-left: 2.2rem;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.filter-control--search {
  flex: 1 1 240px;
}

.loading-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 22px;
}

.support-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bs-body-bg);
  border: 1px dashed var(--bs-border-color);
  border-radius: 22px;
}

.support-empty__icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 1rem;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  font-size: 1.7rem;
}

.support-empty__title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--bs-body-color);
}

.support-empty__text {
  max-width: 560px;
  margin: 0 auto;
  color: var(--bs-secondary-color, #6c757d);
}

.support-ticket {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 22px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.support-ticket__header {
  padding: 1rem 1.15rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.support-ticket__body {
  border-top: 1px solid var(--bs-border-color);
  padding: 1.2rem 1.15rem 1.25rem;
  background: var(--bs-body-bg);
}

.ticket-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ticket-title {
  font-weight: 800;
  color: var(--bs-body-color);
  font-size: 1rem;
}

.ticket-meta {
  margin-top: 0.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem 1rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.88rem;
}

.badge-status {
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  font-weight: 800;
  font-size: 0.75rem;
}

.badge-pending {
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
}

.badge-review {
  background: rgba(108, 117, 125, 0.15);
  color: var(--bs-body-color);
}

.badge-done {
  background: rgba(25, 135, 84, 0.14);
  color: #198754;
}

.detail-block {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.detail-block__label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #dc2626;
}

.detail-block__content {
  margin-top: 0.45rem;
  color: var(--bs-body-color);
  line-height: 1.65;
}

.reference-box {
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
}

.reference-box__label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-secondary-color, #6c757d);
}

.reference-box__value {
  margin-top: 0.25rem;
  font-weight: 700;
  color: var(--bs-body-color);
}

.empty-replies {
  display: flex;
  align-items: center;
  padding: 0.95rem 1rem;
  background: var(--bs-tertiary-bg);
  border: 1px dashed var(--bs-border-color);
  color: var(--bs-secondary-color, #6c757d);
  border-radius: 14px;
  font-size: 0.92rem;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.response-item {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 0.9rem 1rem;
}

.response-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.response-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.response-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #ef4444;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.response-text {
  margin-top: 0.55rem;
  color: var(--bs-body-color);
  line-height: 1.6;
}

.resolved-banner {
  display: flex;
  align-items: center;
  padding: 0.95rem 1rem;
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
  border: 1px solid rgba(25, 135, 84, 0.24);
  border-radius: 16px;
  font-size: 0.95rem;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.side-panel__item {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.side-panel__label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #dc2626;
}

.side-panel__value {
  margin-top: 0.35rem;
  color: var(--bs-body-color);
  font-weight: 600;
}

.ticket-image-card {
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 0.85rem;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 14px;
  background: var(--bs-tertiary-bg);
}

.attachment-item__left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.attachment-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  flex-shrink: 0;
}

.attachment-item__name {
  font-weight: 700;
  color: var(--bs-body-color);
}

.attachment-item__meta {
  font-size: 0.82rem;
}

.thumb-wrap {
  position: relative;
  display: inline-block;
  width: 100%;
  cursor: pointer;
}

.thumb {
  width: 100%;
  max-width: 100%;
  height: 210px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid var(--bs-border-color);
  display: block;
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(24,24,27,0.04) 0%, rgba(24,24,27,0.42) 100%);
  color: #fff;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: 0.18s ease;
  font-size: 1.25rem;
}

.thumb-wrap:hover .thumb-overlay {
  opacity: 1;
}

.break-any {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.minw-0 {
  min-width: 0;
}

.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: all 0.18s ease;
  overflow: hidden;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}

.expand-fade-enter-to,
.expand-fade-leave-from {
  opacity: 1;
  max-height: 1200px;
  transform: translateY(0);
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 0.18s ease;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

.viewer-wrap {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(2px);
}

.viewer-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(96vw, 1200px);
  height: min(92vh, 900px);
  background: #111827;
  color: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  overflow: hidden;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.viewer-title {
  font-weight: 700;
  max-width: 60vw;
}

.viewer-body {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
}

.viewer-img-wrap {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: auto;
}

.viewer-img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.12s ease;
  will-change: transform;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

@media (max-width: 991.98px) {
  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767.98px) {
  .hero-support__content {
    padding: 1.1rem;
  }

  .support-card__header,
  .support-card__body,
  .support-ticket__header,
  .support-ticket__body {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .ticket-title-row {
    align-items: flex-start;
  }

  .upload-dropzone {
    align-items: flex-start;
  }
}

@media (max-width: 576px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .filters-wrap {
    max-width: 100%;
  }

  .viewer-panel {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .viewer-title {
    max-width: 45vw;
  }

  .thumb {
    height: 180px;
  }

  .attachment-item,
  .selected-file {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
