<!-- eslint-disable vue/multi-word-component-names -->
<!-- src/views/SolpedTaller.vue -->
<template>
  <div class="solped-taller-page">
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="page-title mb-0">
          <i class="bi bi-gear"></i>
          Creación de SOLPED (Taller)
        </h1>

        <router-link
          class="btn btn-outline-primary btn-sm ms-auto"
          :to="{ name: 'HistorialSolpedTaller' }"
          title="Ver historial de SOLPED (Taller)"
        >
          <i class="bi bi-clock-history me-1"></i>
          Historial
        </router-link>
      </div>

      <!-- Banner de conexión / consentimiento -->
      <div class="row g-2 align-items-center mb-3">
        <div class="col-12" v-if="!isOnline">
          <div class="alert alert-warning d-flex align-items-center mb-0">
            <i class="bi bi-wifi-off me-2"></i>
            <div>
              Estás sin conexión. <strong>El envío quedará pendiente</strong> hasta que vuelva Internet.
              <span v-if="!localConsent" class="ms-1">Activa el guardado local para no perder cambios.</span>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="card card-slim">
            <div class="card-body py-2 d-flex flex-wrap align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-hdd"></i>
                <strong>Guardado local</strong>
              </div>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="swLocal"
                  v-model="localConsent"
                  @change="persistLocalConsent"
                >
                <label class="form-check-label" for="swLocal">
                  {{ localConsent ? 'Activado' : 'Desactivado' }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ALERTA GLOBAL -->
      <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i><div>{{ error }}</div>
      </div>

      <!-- ================== DATOS GENERALES ================== -->
      <div class="card card-squared mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Datos generales</h5>
            <small class="text-muted">Campos obligatorios <span class="text-danger">*</span></small>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <span class="kpi-chip">Faltan: {{ faltantesGenerales }}</span>
            <span v-if="nombreInvalido" class="kpi-chip kpi-warn">Revisa el nombre del solicitante</span>
          </div>
        </div>

        <div class="card-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Número de SOLPED</label>
              <input type="number" class="form-control" v-model="solpe.numero_solpe" readonly>
            </div>

            <div class="col-12">
              <label class="form-label">Empresa</label>
              <input type="text" class="form-control" v-model="solpe.empresa" readonly>
            </div>

            <div class="col-12">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-control" v-model="solpe.fecha" readonly>
            </div>

            <!-- Nombre solicitante -->
            <div class="col-12">
              <label class="form-label">Nombre del solicitante <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                :class="{'is-invalid': (nombreInvalido || (intentadoGuardar && !solpe.nombre_solicitante.trim()))}"
                v-model="solpe.nombre_solicitante"
                placeholder="Ej: JUAN PÉREZ"
                @input="onNombreSolicitanteChange(); triggerAutoSave()"
              >
              <div v-if="nombreInvalido" class="invalid-feedback d-block">
                El nombre del solicitante no puede ser igual al usuario de sesión (“{{ nombreSesion }}”).
              </div>
              <div v-else-if="intentadoGuardar && !solpe.nombre_solicitante.trim()" class="invalid-feedback d-block">
                Falta el campo: Nombre del solicitante.
              </div>
            </div>

            <!-- Centro de costo -->
            <div class="col-12">
              <label class="form-label">Patente o N° interno (Centro de costo) <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                :class="{'is-invalid': (intentadoGuardar && !solpe.centro_costo.trim())}"
                v-model="solpe.centro_costo"
                placeholder="Ej: JCHJ-82 / OT 051236 / 23302 DET"
                @input="triggerAutoSave()"
              >
              <div v-if="intentadoGuardar && !solpe.centro_costo.trim()" class="invalid-feedback d-block">
                Falta el campo: Patente o N° interno (Centro de costo).
              </div>
            </div>

            <!-- Tipo de SOLPED (select) -->
            <div class="col-12">
              <label class="form-label">Tipo de SOLPED</label>
              <select class="form-select" v-model="solpe.tipo_solped" @change="triggerAutoSave()">
                <option value="REPUESTOS">Repuestos</option>
                <option value="MATERIALES">Materiales</option>
                <option value="HERRAMIENTAS">Herramientas</option>
              </select>
            </div>

            <!-- ✅ Cotizadores NO se muestran en HTML.
                 Se cargan y sincronizan desde Firestore internamente (solpe.cotizadores). -->
          </div>

          <div class="mt-3">
            <span v-if="faltantesGenerales === 0" class="badge bg-success">Datos generales completos</span>
            <span v-else class="badge bg-warning text-dark">Faltan {{ faltantesGenerales }} campo(s)</span>
          </div>
        </div>
      </div>

      <!-- ================== ÍTEMS ================== -->
      <div class="card card-squared">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Ítems solicitados</h5>
            <small class="text-muted">Describe con detalle. Arrastra una imagen a la fila o usa la zona de carga.</small>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-secondary flex-fill" @click="agregarFila(); triggerAutoSave()">
              <i class="bi bi-plus-lg"></i> Agregar ítem
            </button>
            <button
              class="btn btn-success ms-auto"
              @click="guardarSolpe"
              :disabled="enviandoSolpe || nombreInvalido || faltantesGenerales>0 || itemsIncompletos>0"
            >
              <span v-if="enviandoSolpe" class="spinner-border spinner-border-sm me-2"></span>
              Enviar SOLPED
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="table-responsive">
            <table class="table align-middle table-plain">
              <thead>
                <tr>
                  <th style="width:64px;">#</th>
                  <th class="th-desc">Descripción <span class="text-danger">*</span></th>
                  <th>Código (opcional)</th>
                  <th style="width:140px;">Cantidad <span class="text-danger">*</span></th>
                  <th>N° Interno / Patente (opcional)</th>
                  <th style="min-width:240px;">Imagen</th>
                  <th style="width:126px;">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(item, i) in solpe.items"
                  :key="item.id"
                  class="item-row"
                  @dragover.prevent="onDragOver(i)"
                  @dragleave.prevent="onDragLeave(i)"
                  @drop.prevent="onDrop($event, i)"
                  :class="{'drag-over': dragOverIndex === i}"
                >
                  <td class="text-muted">{{ i+1 }}</td>

                  <td class="position-relative td-desc">
                    <div class="position-relative">
                      <div class="input-with-icon">
                        <i class="bi bi-search"></i>
                        <textarea
                          :ref="(el) => setDescInputRef(i, el)"
                          class="form-control desc-input"
                          :class="{
                            'is-invalid': campoInvalido(item,'descripcion'),
                            'is-expanded': focusedDescIndex === i
                          }"
                          v-model="item.descripcion"
                          :readonly="!item.editando"
                          rows="1"
                          placeholder="Ej: FILTRO DE AIRE"
                          autocomplete="off"
                          @input="onDescInput(i,$event)"
                          @focus="onDescFocus(i)"
                          @blur="onDescBlur(i)"
                          @keydown="onDescKeydown($event, i)"
                        ></textarea>
                      </div>

                      <!-- Sugerencias (arriba + teclado) -->
                      <div
                        v-if="item.editando && suggestOpenIndex===i && (catalogLoading || suggestions(i).length)"
                        class="suggest-box suggest-box--fixed"
                        :style="suggestFixedStyle"
                        @mouseenter="suggestHovering=true"
                        @mouseleave="suggestHovering=false"
                      >
                        <div class="suggest-head">
                          <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-magic"></i>
                            <strong>Sugerencias</strong>
                            <span class="badge bg-light text-dark border">{{ suggestions(i).length }}</span>
                          </div>
                          <div class="hint">
                            <span class="kbd">↑</span><span class="kbd">↓</span>
                            <span class="d-none d-md-inline"> navegar · </span>
                            <span class="kbd">Enter</span><span class="d-none d-md-inline"> seleccionar · </span>
                            <span class="kbd">Tab</span><span class="d-none d-md-inline"> siguiente campo · </span>
                            <span class="kbd">Esc</span>
                          </div>
                        </div>

                        <ul class="list-unstyled mb-0">
                          <li v-if="catalogLoading && !suggestions(i).length" class="suggest-empty">
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Cargando sugerencias…
                          </li>
                          <li v-else-if="!catalogLoading && !suggestions(i).length" class="suggest-empty">
                            No hay coincidencias. Escribe más letras.
                          </li>
                          <li
                            v-for="(s, idx) in suggestions(i)"
                            :key="s.id || idx"
                            class="suggest-item"
                            :class="{ 'is-active': idx === suggestActivePos }"
                            @mouseenter="suggestActivePos = idx"
                            @mousedown.prevent="() => {}"
                            @dblclick.prevent="applySuggestion(i, s)"
                          >
                            <div class="suggest-text">
                              <span v-html="renderSuggestMatch(item.descripcion, (s.descripcion_raw || s.descripcion_upper || ''))"></span>
                              <small v-if="s.codigo_referencial" class="text-muted ms-2">({{ s.codigo_referencial }})</small>
                            </div>
                            <span v-if="s.usage_count" class="badge bg-light text-dark border">{{ s.usage_count }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </td>

                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="item.codigo_referencial"
                      :readonly="!item.editando"
                      placeholder="Ej: COD-1234"
                      @input="onUpperItem(i,'codigo_referencial',$event); triggerAutoSave()"
                    >
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      class="form-control text-end"
                      :class="{'is-invalid': campoInvalido(item,'cantidad')}"
                      v-model.number="item.cantidad"
                      :readonly="!item.editando"
                      placeholder="1"
                      @keyup.enter="autoAgregarSiUltimoCompleto(i)"
                      @blur="autoAgregarSiUltimoCompleto(i)"
                      @change="triggerAutoSave()"
                    >
                  </td>

                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="item.numero_interno"
                      :readonly="!item.editando"
                      placeholder="Ej: INT-045 o ABCD-12"
                      @input="onUpperItem(i,'numero_interno',$event); triggerAutoSave()"
                    >
                  </td>

                  <td>
                    <div v-if="item.imagen_url" class="image-container">
                      <img :src="item.imagen_url" alt="Imagen ítem">
                      <div class="mt-2 d-flex gap-2">
                        <button class="btn btn-sm btn-outline-danger" @click="eliminarImagen(i)" :disabled="deletingImagen === i">
                          <span v-if="deletingImagen === i" class="spinner-border spinner-border-sm me-1"></span>
                          Eliminar
                        </button>
                        <button class="btn btn-sm btn-outline-primary" @click="seleccionarArchivo(i)" :disabled="subiendoImagen === i">
                          <span v-if="subiendoImagen === i" class="spinner-border spinner-border-sm me-1"></span>
                          Cambiar…
                        </button>
                      </div>
                    </div>

                    <div v-else class="dropzone" @click="seleccionarArchivo(i)">
                      <i class="bi bi-image"></i>
                      <div class="hint">
                        <span v-if="subiendoImagen === i" class="spinner-border spinner-border-sm me-2"></span>
                        Haz clic o arrastra una imagen aquí
                      </div>
                      <input class="d-none" type="file" accept="image/*" :ref="el=>fileInputs[i]=el" @change="subirImagenReferencia($event,i)">
                    </div>
                  </td>

                  <td>
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm btn-outline-primary" v-if="!item.editando" @click="editarItem(i); triggerAutoSave()" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button class="btn btn-sm btn-success" v-if="item.editando" @click="guardarItem(i); triggerAutoSave()" title="Guardar">
                        <i class="bi bi-save"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarItem(i); triggerAutoSave()" title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!solpe.items.length">
                  <td colspan="7" class="text-center text-secondary py-4">
                    No hay ítems. Usa “Agregar ítem” para comenzar.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Overlay global de envío -->
    <div v-if="enviandoSolpe" class="overlay">
      <div class="spinner-border" role="status" aria-hidden="true"></div>
      <div class="mt-2">Enviando SOLPED…</div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, onBeforeUnmount, nextTick } from "vue";
import imageCompression from "browser-image-compression";
import { db } from "../stores/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  where,
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

export default {
  name: "SolpedTaller",
  setup() {
    const auth = useAuthStore();
    const storage = getStorage();

    const error = ref("");
    const isOnline = ref(navigator.onLine);

    // ======= Estado principal =======
    const solpe = reactive({
      numero_solpe: null,
      fecha: "",
      empresa: "Xtreme Servicio", // ✅ fijo
      nombre_solicitante: "",
      cotizadores: [], // ✅ se llena SOLO desde Firestore (no editable)
      tipo_solped: "REPUESTOS",
      centro_costo: "",
      items: [],
      estatus: "Pendiente",
    });

    // ======= Cotizadores (lógica interna, sin UI) =======
    const cotizadoresEmpresa = ref([]); // se mantiene para lógica/sync (no se muestra)
    const loadingCotizadores = ref(false);
    let unsubCotizadores = null;

    // Sesión / validaciones
    const nombreSesion = ref(null);
    const nombreInvalido = ref(false);
    const enviandoSolpe = ref(false);
    const intentadoGuardar = ref(false);

    // Subida/Eliminación de imagen
    const fileInputs = reactive([]);
    const subiendoImagen = ref(-1);
    const deletingImagen = ref(-1);
    const dragOverIndex = ref(-1);

    // Consentimiento guardado local
    const LS_LOCAL_CONSENT = "solped_taller_local_consent";
    const localConsent = ref(true);

    // Draft local
    const DRAFT_KEY = "solped_taller_draft_v1";
    const JUST_SENT_KEY = "solped_taller_just_sent";
    const IMPORT_KEY = "solped_taller_import";
    let saveTimer = null;

    const hasMeaningfulState = (s) => {
      const nombreOk = !!(s.nombre_solicitante || "").trim();
      const ccOk = !!(s.centro_costo || "").trim();
      const items = Array.isArray(s.items) ? s.items : [];
      const itemsConContenido = items.some((it) => {
        const descOk = !!(it?.descripcion || "").trim();
        const cantOk = Number(it?.cantidad) > 0;
        const imgOk = !!(it?.imagen_url || "").trim();
        const codOk = !!(it?.codigo_referencial || "").trim();
        const numOk = !!(it?.numero_interno || "").trim();
        return descOk || cantOk || imgOk || codOk || numOk;
      });
      return nombreOk || ccOk || itemsConContenido;
    };

    // ======================
    // Catálogo (predicciones)
    // ======================
    const catalog = ref([]);
    const catalogLoading = ref(false);
    const suggestOpenIndex = ref(-1);
    const suggestActivePos = ref(0);
    let suggestHideTimer = null;
    const suggestHovering = ref(false);

    // Límite de sugerencias
    const SUGGEST_LIMIT = 100;

    // Refs para posicionar el popover (evitar recorte dentro de tablas/scroll)
    const descInputEls = ref([]); // refs a <textarea> descripción por fila
    const focusedDescIndex = ref(-1);

    const suggestPos = reactive({
      left: 0,
      width: 0,
      bottom: 0,      // distancia desde el borde inferior del viewport (para abrir hacia arriba)
      maxHeight: 260,
    });

    const setDescInputRef = (i, el) => {
      if (!el) return;
      descInputEls.value[i] = el;
    };

    const computeSuggestPos = (i) => {
      const el = descInputEls.value?.[i];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const gap = 8;

      // Popover hacia ARRIBA: lo “anclamos” al borde superior del input usando bottom.
      const bottom = Math.max(8, window.innerHeight - rect.top + gap);
      const maxHeight = Math.max(180, Math.min(520, rect.top - 12)); // aprovecha espacio disponible arriba

      suggestPos.left = Math.round(rect.left);
      suggestPos.width = Math.round(rect.width);
      suggestPos.bottom = Math.round(bottom);
      suggestPos.maxHeight = Math.round(maxHeight);
    };

    const updateSuggestPos = async (i) => {
      await nextTick();
      computeSuggestPos(i);
    };

    const reposition = () => {
      if (suggestOpenIndex.value >= 0) computeSuggestPos(suggestOpenIndex.value);
    };

    const suggestFixedStyle = computed(() => ({
      left: suggestPos.left + "px",
      width: suggestPos.width + "px",
      bottom: suggestPos.bottom + "px",
      maxHeight: suggestPos.maxHeight + "px",
    }));

    const autoGrowDesc = (i) => {
      const el = descInputEls.value?.[i];
      if (!el) return;
      el.style.height = "auto";
      const max = 140; // px
      el.style.height = Math.min(el.scrollHeight, max) + "px";
    };

    const shrinkDesc = (i) => {
      const el = descInputEls.value?.[i];
      if (!el) return;
      el.style.height = "44px";
    };

    const onDescFocus = async (i) => {
      focusedDescIndex.value = i;
      autoGrowDesc(i);
      showSuggestFor(i);
      await updateSuggestPos(i);
    };

    const onDescBlur = () => {
      focusedDescIndex.value = -1;
      hideSuggestSoon();
      setTimeout(() => {
        const i = focusedDescIndex.value;
        if (i >= 0) shrinkDesc(i);
      }, 10);
    };

    const onDescInput = async (i, ev) => {
      onUpperItem(i, "descripcion", ev);
      triggerAutoSave();
      autoGrowDesc(i);
      showSuggestFor(i);
      await updateSuggestPos(i);
    };

    // Toasts
    const toasts = ref([]);
    const addToast = (type, text, timeout = 2400) => {
      const id = Date.now() + Math.random();
      toasts.value.push({ id, type, text });
      setTimeout(() => closeToast(id), timeout);
    };
    const closeToast = (id) => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    };

    // ============ Util =============
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const upper = (v) => (v || "").toString().toUpperCase();
    const normalize = (v) =>
      upper(v)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

    const escapeHtml = (s = "") =>
      String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    // Resalta coincidencia (cualquier posición, no solo prefijo)
    const renderSuggestMatch = (typed, full) => {
      const t = String(typed || "").trim();
      const f = String(full || "");
      if (!t) return escapeHtml(f);

      const fUp = f.toUpperCase();
      const tUp = t.toUpperCase();
      const idx = fUp.indexOf(tUp);

      if (idx >= 0) {
        const a = escapeHtml(f.slice(0, idx));
        const b = escapeHtml(f.slice(idx, idx + t.length));
        const c = escapeHtml(f.slice(idx + t.length));
        return `${a}<mark>${b}</mark>${c}`;
      }
      return escapeHtml(f);
    };

    // ===============
    // Matching “mejor”
    // ===============
    const scoreMatch = (termNorm, textNorm) => {
      if (!termNorm || !textNorm) return 0;

      // exacto
      if (termNorm === textNorm) return 1000;

      // empieza por
      if (textNorm.startsWith(termNorm)) return 900;

      // palabra empieza por (ej: "FILTRO AIRE" si term "AIR")
      const words = textNorm.split(/\s+/g).filter(Boolean);
      if (words.some((w) => w.startsWith(termNorm))) return 800;

      // contiene
      if (textNorm.includes(termNorm)) return 650;

      // contiene por tokens (todas las palabras del término aparecen)
      const tks = termNorm.split(/\s+/g).filter(Boolean);
      if (tks.length > 1) {
        let ok = 0;
        for (const tk of tks) {
          if (tk.length >= 2 && textNorm.includes(tk)) ok++;
        }
        if (ok === tks.length) return 600;
        if (ok > 0) return 500 + ok * 10;
      }

      return 0;
    };

    // ====== Online / Offline listeners ======
    const onOnline = () => {
      isOnline.value = true;
      addToast("success", "Conexión restaurada.");
    };
    const onOffline = () => {
      isOnline.value = false;
      addToast("danger", "Sin conexión. Tus cambios quedan locales.");
    };

    // ====== Consentimiento local ======
    const persistLocalConsent = () => {
      try {
        localStorage.setItem(LS_LOCAL_CONSENT, localConsent.value ? "1" : "0");
      } catch (e) {
        console.error(e);
      }
      if (!localConsent.value) {
        addToast("danger", "Guardado local desactivado.");
      } else {
        addToast("success", "Guardado local activado.");
        triggerAutoSave();
      }
    };

    // ====== Autosave ======
    const triggerAutoSave = () => {
      if (!localConsent.value) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraftSafely, 500);
    };

    const saveDraftSafely = () => {
      if (!localConsent.value) return;
      if (!hasMeaningfulState(solpe)) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (e) {
          console.error(e);
        }
        return;
      }
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            ts: Date.now(),
            data: JSON.parse(JSON.stringify(solpe)),
          })
        );
      } catch {
        /* ignore */
      }
    };

    const hasMeaningfulDraft = (draft) => {
      if (!draft) return false;
      const s = draft.data || {};
      const nombreOk = !!(s.nombre_solicitante || "").trim();
      const ccOk = !!(s.centro_costo || "").trim();
      const items = Array.isArray(s.items) ? s.items : [];
      const itemsConContenido = items.some((it) => {
        return (
          !!(it?.descripcion || "").trim() ||
          Number(it?.cantidad) > 0 ||
          !!(it?.imagen_url || "").trim() ||
          !!(it?.codigo_referencial || "").trim() ||
          !!(it?.numero_interno || "").trim()
        );
      });
      return nombreOk || ccOk || itemsConContenido;
    };

    const tryRestoreDraft = () => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!hasMeaningfulDraft(draft)) return;

        const data = draft.data || {};
        const { ...rest } = data;

        Object.assign(solpe, {
          ...rest,
          fecha: formatDate(new Date()),
        });

        addToast("success", "Borrador restaurado.");
      } catch {
        /* ignore */
      }
    };

    const clearDraft = () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        console.error(e);
      }
    };

    function sanitizeUpper(v) {
      return (v || "").toString().toUpperCase();
    }

    const aplicarImportacionDesdeHistorial = async () => {
      try {
        const raw = sessionStorage.getItem(IMPORT_KEY);
        if (!raw) return false;

        const imp = JSON.parse(raw);
        sessionStorage.removeItem(IMPORT_KEY);

        const hoy = formatDate(new Date());

        Object.assign(solpe, {
          numero_solpe: null,
          fecha: hoy,
          empresa: "Xtreme Servicio",
          nombre_solicitante: sanitizeUpper(imp.nombre_solicitante || ""),
          // cotizadores NO se tocan aquí: los setea la suscripción
          tipo_solped: imp.tipo_solped || "REPUESTOS",
          centro_costo: sanitizeUpper(imp.centro_costo || ""),
          items: (Array.isArray(imp.items) ? imp.items : []).map((it, idx) => ({
            id: idx + 1,
            descripcion: sanitizeUpper(it.descripcion || ""),
            codigo_referencial: sanitizeUpper(it.codigo_referencial || ""),
            cantidad: Number(it.cantidad || 1),
            numero_interno: sanitizeUpper(it.numero_interno || ""),
            imagen_url: it.imagen_url || "",
            editando: true,
          })),
          estatus: "Pendiente",
        });

        onNombreSolicitanteChange();

        if (!solpe.numero_solpe) {
          solpe.numero_solpe = await obtenerNumeroActualDesdeColeccion();
        }

        triggerAutoSave();
        addToast("success", "Se importó la SOLPED desde historial. Revisa y envía.");
        return true;
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudo importar la SOLPED desde historial.");
        return false;
      }
    };

    // ======= KPIs / validaciones =======
    const faltantesGenerales = computed(() => {
      let f = 0;
      if (!(solpe.nombre_solicitante || "").trim()) f++;
      if (!(solpe.centro_costo || "").trim()) f++;
      // ✅ obligatorio (aunque no se muestre)
      if (!Array.isArray(solpe.cotizadores) || solpe.cotizadores.length === 0) f++;
      if (nombreInvalido.value) f++;
      return f;
    });

    const itemsIncompletos = computed(() => {
      return solpe.items.filter((it) => isItemIncompleto(it)).length;
    });

    const campoInvalido = (item, campo) => {
      if (!intentadoGuardar.value && !item.editando) return false;
      if (campo === "descripcion") return !(item.descripcion && item.descripcion.trim().length > 0);
      if (campo === "cantidad") return !(item.cantidad && item.cantidad > 0);
      return false;
    };

    const isItemIncompleto = (it) => {
      return !(it.descripcion || "").trim() || !(Number(it.cantidad) > 0);
    };

    // ======= Nombre solicitante =======
    const onNombreSolicitanteChange = () => {
      solpe.nombre_solicitante = upper(solpe.nombre_solicitante);
      const solicitante = (solpe.nombre_solicitante || "").trim();
      const sesion = (nombreSesion.value || "").trim();
      nombreInvalido.value = !!solicitante && !!sesion && solicitante === sesion;
      triggerAutoSave();
    };

    // ======= Ítems =======
    const agregarFila = () => {
      const nextId = solpe.items.length ? solpe.items[solpe.items.length - 1].id + 1 : 1;
      solpe.items.push({
        id: nextId,
        descripcion: "",
        codigo_referencial: "",
        cantidad: null,
        numero_interno: "",
        imagen_url: "",
        editando: true,
      });
    };

    const eliminarItem = (i) => {
      solpe.items.splice(i, 1);
      triggerAutoSave();
    };
    const editarItem = (i) => {
      solpe.items[i].editando = true;
      triggerAutoSave();
    };
    const guardarItem = (i) => {
      solpe.items[i].editando = false;
      triggerAutoSave();
    };

    const autoAgregarSiUltimoCompleto = (i) => {
      const esUltimo = i === solpe.items.length - 1;
      if (!esUltimo) return;
      const it = solpe.items[i];
      if (!isItemIncompleto(it)) {
        agregarFila();
        triggerAutoSave();
      }
    };

    const onUpperItem = (i, key, ev) => {
      const v = upper(ev?.target?.value ?? "");
      solpe.items[i][key] = v;
      triggerAutoSave();
    };

    const seleccionarArchivo = (i) => {
      const el = fileInputs[i];
      if (el && el.click) el.click();
    };

    const subirImagenReferencia = async (event, index) => {
      try {
        const file = event?.target?.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
          addToast("danger", "Archivo no válido. Solo imágenes.");
          return;
        }
        await handleFileUpload(file, index);
      } catch (e) {
        console.error(e);
        addToast("danger", "Error al subir imagen");
      }
    };

    const handleFileUpload = async (file, index) => {
      subiendoImagen.value = index;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1000,
          useWebWorker: true,
        });

        const nombre = `solped_taller_${solpe.numero_solpe || "temp"}_${index}_${Date.now()}.jpg`;
        const ruta = `solped_taller_images/${nombre}`;
        const refUp = sRef(storage, ruta);

        await uploadBytes(refUp, compressed);
        const url = await getDownloadURL(refUp);
        solpe.items[index].imagen_url = url;
        addToast("success", "Imagen subida");
        triggerAutoSave();
      } finally {
        subiendoImagen.value = -1;
      }
    };

    const onDragOver = (i) => {
      dragOverIndex.value = i;
    };
    const onDragLeave = (i) => {
      if (dragOverIndex.value === i) dragOverIndex.value = -1;
    };
    const onDrop = async (ev, i) => {
      try {
        dragOverIndex.value = -1;
        const file = ev.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
          addToast("danger", "Archivo no válido. Solo imágenes.");
          return;
        }
        await handleFileUpload(file, i);
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudo cargar la imagen.");
      }
    };

    const eliminarImagen = async (i) => {
      const url = solpe.items[i]?.imagen_url;
      if (!url) return;
      deletingImagen.value = i;
      try {
        const path = decodeURIComponent(url.split("/o/")[1]?.split("?")[0] || "");
        if (path) {
          const refDel = sRef(storage, path);
          await deleteObject(refDel);
        }
      } catch (e) {
        console.warn("No se pudo eliminar en storage, limpio el campo.", e);
      } finally {
        solpe.items[i].imagen_url = "";
        deletingImagen.value = -1;
        addToast("success", "Imagen eliminada");
        triggerAutoSave();
      }
    };

    // ======= Correlativo =======
    const obtenerSiguienteNumeroDesdeColeccion = async () => {
      try {
        const counterRef = doc(db, "solped_counters", "solped_taller");

        const nextNumber = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(counterRef);

          if (!snap.exists()) {
            transaction.set(counterRef, { lastNumber: 1 });
            return 1;
          }

          const data = snap.data() || {};
          const last = Number(data.lastNumber || 0);
          const newNumber = last + 1;

          transaction.update(counterRef, { lastNumber: newNumber });
          return newNumber;
        });

        return nextNumber;
      } catch (e) {
        console.error("Error correlativo (solped_counters):", e);
        return 1;
      }
    };

    const obtenerNumeroActualDesdeColeccion = async () => {
      try {
        const counterRef = doc(db, "solped_counters", "solped_taller");
        const snap = await getDoc(counterRef);
        if (!snap.exists()) return 0;
        const data = snap.data() || {};
        return Number(data.lastNumber || 0);
      } catch (e) {
        console.error("Error obteniendo número actual:", e);
        return 0;
      }
    };

    // ======= Catálogo =======
    const loadCatalog = async () => {
      catalogLoading.value = true;
      try {
        const qy = query(collection(db, "items_catalog"), orderBy("usage_count", "desc"));
        const snap = await getDocs(qy);
        catalog.value = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      } catch (e) {
        console.warn("No se pudo cargar items_catalog:", e);
      } finally {
        catalogLoading.value = false;
      }
    };

    // ✅ Mejor sugeridor + límite 20
    const suggestions = (i) => {
      const typed = solpe.items[i]?.descripcion || "";
      const term = normalize(typed);

      const list = catalog.value || [];

      // Si escriben poco, mostrar “top usados”
      if (!term || term.length < 2) {
        return list.slice(0, SUGGEST_LIMIT);
      }

      // Scoring + orden
      const scored = [];
      for (const it of list) {
        const base = it.descripcion_upper || it.descripcion_raw || "";
        const text = normalize(base);
        const sc = scoreMatch(term, text);
        if (sc > 0) {
          scored.push({ it, sc });
        }
      }

      scored.sort((a, b) => {
        if (b.sc !== a.sc) return b.sc - a.sc;
        // desempate: usage_count desc
        const bu = Number(b.it.usage_count || 0);
        const au = Number(a.it.usage_count || 0);
        if (bu !== au) return bu - au;
        return String(a.it.descripcion_upper || a.it.descripcion_raw || "").localeCompare(
          String(b.it.descripcion_upper || b.it.descripcion_raw || ""),
          "es",
          { sensitivity: "base" }
        );
      });

      const out = scored.slice(0, SUGGEST_LIMIT).map((x) => x.it);
      return out.length ? out : list.slice(0, SUGGEST_LIMIT);
    };

    const showSuggestFor = async (i) => {
      suggestOpenIndex.value = i;
      suggestActivePos.value = 0;
      clearTimeout(suggestHideTimer);
      await updateSuggestPos(i);
    };

    const hideSuggestSoon = () => {
      clearTimeout(suggestHideTimer);
      suggestHideTimer = setTimeout(() => {
        if (!suggestHovering.value) suggestOpenIndex.value = -1;
      }, 120);
    };

    const applySuggestion = (i, s) => {
      solpe.items[i].descripcion = upper(s.descripcion_raw || s.descripcion_upper || "");

      // Código: si la sugerencia trae código, reemplaza; si no, mantiene lo escrito
      if (s.codigo_referencial) {
        solpe.items[i].codigo_referencial = upper(s.codigo_referencial);
      }

      suggestOpenIndex.value = -1;
      addToast("success", "Sugerencia aplicada.");
      triggerAutoSave();
      autoAgregarSiUltimoCompleto(i);
    };

    // ✅ KEYDOWN: Enter aplica / Tab NO aplica (solo navega)
    const onDescKeydown = (ev, i) => {
      const isOpen = (solpe.items[i]?.editando && suggestOpenIndex.value === i);
      if (!isOpen) return;

      const list = suggestions(i) || [];
      const hasList = list.length > 0;

      if (ev.key === "Escape") {
        ev.preventDefault();
        suggestOpenIndex.value = -1;
        return;
      }

      if (ev.key === "ArrowDown") {
        if (!hasList) return;
        ev.preventDefault();
        suggestActivePos.value = Math.min(list.length - 1, (suggestActivePos.value || 0) + 1);
        return;
      }

      if (ev.key === "ArrowUp") {
        if (!hasList) return;
        ev.preventDefault();
        suggestActivePos.value = Math.max(0, (suggestActivePos.value || 0) - 1);
        return;
      }

      // ✅ Enter: selecciona sugerencia (si existe). Si no hay sugerencias, evita salto de línea y permite tu flujo normal.
      if (ev.key === "Enter") {
        ev.preventDefault(); // evita newline en textarea
        if (hasList) {
          const chosen = list[suggestActivePos.value || 0];
          if (chosen) applySuggestion(i, chosen);
        } else {
          autoAgregarSiUltimoCompleto(i);
        }
        return;
      }

      // ✅ Tab: NO seleccionar. Solo cerrar dropdown y dejar que el navegador cambie de campo.
      if (ev.key === "Tab") {
        // NO preventDefault
        suggestOpenIndex.value = -1;
        return;
      }
    };

    const upsertCatalogForItems = async (items) => {
      try {
        for (const it of items) {
          const descUpper = upper(it.descripcion || "").trim();
          if (!descUpper) continue;

          const qy = query(collection(db, "items_catalog"), where("descripcion_upper", "==", descUpper), limit(1));
          const snap = await getDocs(qy);

          if (!snap.empty) {
            const dref = doc(db, "items_catalog", snap.docs[0].id);
            const prev = snap.docs[0].data() || {};
            await updateDoc(dref, {
              usage_count: Number(prev.usage_count || 0) + 1,
              last_used: serverTimestamp(),
              ...(it.codigo_referencial ? { codigo_referencial: upper(it.codigo_referencial) } : {}),
            });
          } else {
            await addDoc(collection(db, "items_catalog"), {
              descripcion_upper: descUpper,
              descripcion_raw: it.descripcion,
              codigo_referencial: it.codigo_referencial || null,
              usage_count: 1,
              created_at: serverTimestamp(),
              last_used: serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.warn("No se pudo actualizar items_catalog:", e);
      }
    };

    // ======= ✅ Cotizadores desde configuración (SIN UI, NO editable) =======
    const keyifyEmpresa = (empresaNombre) => {
      const n = normalize(empresaNombre).toLowerCase();
      if (n.includes("xtreme") && (n.includes("servicio") || n.includes("servicios"))) return "xtreme_servicio";
      return n.replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
    };

    const parseDate = (v) => {
      if (!v) return null;
      if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof v?.toDate === "function") return v.toDate();
      if (v instanceof Date) return v;
      return null;
    };

    const isInVacationToday = (vacaciones) => {
      if (!Array.isArray(vacaciones) || vacaciones.length === 0) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return vacaciones.some((r) => {
        const desde = parseDate(r?.desde || r?.from || r?.start);
        const hasta = parseDate(r?.hasta || r?.to || r?.end);

        if (!desde && !hasta) return false;

        const d0 = desde ? new Date(desde) : null;
        const d1 = hasta ? new Date(hasta) : null;
        if (d0) d0.setHours(0, 0, 0, 0);
        if (d1) d1.setHours(0, 0, 0, 0);

        if (d0 && d1) return today >= d0 && today <= d1;
        if (d0 && !d1) return today >= d0;
        if (!d0 && d1) return today <= d1;
        return false;
      });
    };

    const subscribeCotizadoresEmpresa = (empresaNombre) => {
      if (typeof unsubCotizadores === "function") unsubCotizadores();
      unsubCotizadores = null;

      cotizadoresEmpresa.value = [];
      loadingCotizadores.value = true;

      const empresaKey = keyifyEmpresa(empresaNombre);

      const empresaRef = doc(db, "configuracion", "aprobacion_oc_taller", "empresas", empresaKey);
      const cotCol = collection(empresaRef, "cotizadores");
      const qCot = query(cotCol);

      unsubCotizadores = onSnapshot(
        qCot,
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((c) => c && c.activo !== false)
            .filter((c) => !isInVacationToday(c.vacaciones || []))
            .map((c) => ({
              uid: String(c.uid || c.id || ""),
              fullName: String(c.fullName || c.nombre || c.email || "—").trim(),
              email: String(c.email || "").trim(),
            }))
            .filter((c) => c.uid && c.fullName)
            .sort((a, b) =>
              (a.fullName || "").localeCompare(b.fullName || "", "es", { sensitivity: "base" })
            );

          cotizadoresEmpresa.value = list;

          solpe.cotizadores = list.map((x) => x.fullName);

          if (!solpe.cotizadores.length) {
            addToast("danger", "No hay cotizadores configurados/activos para Xtreme Servicio.");
          }

          loadingCotizadores.value = false;
          triggerAutoSave();
        },
        (err) => {
          console.warn("No se pudieron cargar cotizadores:", err);
          cotizadoresEmpresa.value = [];
          solpe.cotizadores = [];
          loadingCotizadores.value = false;
          addToast("danger", "No se pudieron cargar cotizadores (config).");
          triggerAutoSave();
        }
      );
    };

    // ======= Guardar =======
    const guardarSolpe = async () => {
      if (enviandoSolpe.value) return;
      intentadoGuardar.value = true;

      const missing = [];
      const solicitante = upper((solpe.nombre_solicitante || "").trim());
      const sesion = upper((nombreSesion.value || "").trim());

      if (!solicitante) missing.push("Nombre del solicitante");
      if (!(solpe.centro_costo || "").trim()) missing.push("Patente o N° interno (Centro de costo)");
      if (!Array.isArray(solpe.cotizadores) || solpe.cotizadores.length === 0) missing.push("Cotizadores (config)");

      if (solicitante && sesion && solicitante === sesion) {
        nombreInvalido.value = true;
        missing.push(`Nombre del solicitante (no puede ser "${nombreSesion.value}")`);
      }

      if (missing.length) {
        addToast("danger", "Faltan datos: " + missing.join(", "));
        return;
      }

      if (!solpe.items.length) {
        addToast("warning", "Agrega al menos un ítem");
        return;
      }
      for (const it of solpe.items) {
        if (isItemIncompleto(it)) {
          addToast("warning", "Cada ítem debe tener Descripción y Cantidad (>0)");
          return;
        }
      }

      enviandoSolpe.value = true;
      try {
        const numeroAsignado = await obtenerSiguienteNumeroDesdeColeccion();
        solpe.numero_solpe = numeroAsignado;

        const payload = {
          numero_solpe: numeroAsignado,
          fecha: solpe.fecha,
          empresa: solpe.empresa,
          nombre_solicitante: solicitante,
          cotizadores: solpe.cotizadores,
          tipo_solped: solpe.tipo_solped,
          centro_costo: (solpe.centro_costo || "").trim(),
          estatus: "Pendiente",
          items: (solpe.items || []).map((it, idx) => ({
            item: idx + 1,
            descripcion: (it.descripcion || "").trim(),
            codigo_referencial: (it.codigo_referencial || "").trim() || "SIN CÓDIGO",
            cantidad: Number(it.cantidad),
            numero_interno: (it.numero_interno || "").trim() || "SIN PATENTE",
            imagen_url: it.imagen_url || null,
            estado: "pendiente",
          })),
          creado_en: serverTimestamp(),
          usuario_sesion: nombreSesion.value || null,
        };

        const docRef = await addDoc(collection(db, "solped_taller"), payload);
        await addDoc(collection(db, "solped_taller", docRef.id, "historialEstados"), {
          fecha: new Date(),
          estatus: "Pendiente",
          usuario: solicitante,
        });

        await upsertCatalogForItems(payload.items);

        addToast("success", "SOLPED de taller creada");

        clearDraft();
        sessionStorage.setItem(JUST_SENT_KEY, "1");

        await resetearFormulario();
      } catch (e) {
        console.error(e);
        addToast("danger", "Error al guardar la SOLPED");
      } finally {
        enviandoSolpe.value = false;
        intentadoGuardar.value = false;
      }
    };

    const resetearFormulario = async () => {
      const hoy = formatDate(new Date());
      Object.assign(solpe, {
        numero_solpe: await obtenerNumeroActualDesdeColeccion(),
        fecha: hoy,
        empresa: "Xtreme Servicio",
        nombre_solicitante: "",
        cotizadores: Array.isArray(cotizadoresEmpresa.value) ? cotizadoresEmpresa.value.map((x) => x.fullName) : [],
        tipo_solped: "REPUESTOS",
        centro_costo: "",
        items: [],
        estatus: "Pendiente",
      });
      nombreInvalido.value = false;
      triggerAutoSave();
    };

    // ======= Sesión =======
    const loadSesionName = async () => {
      try {
        const uid = auth?.user?.uid;
        let full = (auth?.user?.displayName || auth?.user?.email || "") || "";
        if (uid) {
          const me = await getDoc(doc(db, "Usuarios", uid));
          if (me.exists()) full = me.data()?.fullName || full;
        }
        nombreSesion.value = upper(full) || null;
      } catch (e) {
        console.error(e);
      }
    };

    // ======= Init =======
    onMounted(async () => {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);

      try {
        const saved = localStorage.getItem(LS_LOCAL_CONSENT);
        if (saved === "0") localConsent.value = false;
        if (saved === "1") localConsent.value = true;
      } catch (e) {
        console.error(e);
      }

      try {
        await loadSesionName();
        solpe.fecha = formatDate(new Date());

        subscribeCotizadoresEmpresa(solpe.empresa);

        const imported = await aplicarImportacionDesdeHistorial();

        const justSent = sessionStorage.getItem(JUST_SENT_KEY) === "1";
        if (justSent) {
          sessionStorage.removeItem(JUST_SENT_KEY);
        } else if (!imported && localConsent.value) {
          tryRestoreDraft();
        }

        if (!solpe.numero_solpe) {
          solpe.numero_solpe = await obtenerNumeroActualDesdeColeccion();
          triggerAutoSave();
        }

        await loadCatalog();
      } catch (e) {
        console.error(e);
        error.value = "No se pudo inicializar la vista.";
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);

      if (typeof unsubCotizadores === "function") unsubCotizadores();
    });

    return {
      // estado
      solpe,
      error,
      nombreSesion,
      nombreInvalido,
      enviandoSolpe,
      intentadoGuardar,
      isOnline,
      fileInputs,
      subiendoImagen,
      deletingImagen,
      dragOverIndex,
      localConsent,

      // kpis
      faltantesGenerales,
      itemsIncompletos,

      // catálogo/sugerencias
      catalog,
      catalogLoading,
      suggestions,
      suggestOpenIndex,
      suggestHovering,
      showSuggestFor,
      hideSuggestSoon,
      applySuggestion,

      // sugerencias UX
      suggestActivePos,
      onDescKeydown,
      renderSuggestMatch,

      // popover fijo + textarea autosize
      suggestFixedStyle,
      setDescInputRef,
      focusedDescIndex,
      onDescInput,
      onDescFocus,
      onDescBlur,

      // toasts
      toasts,
      addToast,
      closeToast,

      // fns
      onNombreSolicitanteChange,
      triggerAutoSave,
      persistLocalConsent,
      campoInvalido,
      isItemIncompleto,
      agregarFila,
      eliminarItem,
      editarItem,
      guardarItem,
      seleccionarArchivo,
      subirImagenReferencia,
      eliminarImagen,
      guardarSolpe,
      resetearFormulario,
      onUpperItem,
      autoAgregarSiUltimoCompleto,
      onDragOver,
      onDragLeave,
      onDrop,
    };
  },
};
</script>

<style scoped>
.solped-taller-page{ min-height:100vh; }

/* ===== UI más "redondeada" (menos cuadrada) ===== */
:deep(.form-control),
:deep(.form-select),
:deep(.btn),
:deep(.table),
:deep(.badge) {
  border-radius: 12px;
}

.page-title{
  font-size: 1.35rem;
  font-weight: 700;
  display:flex; align-items:center; gap:.5rem;
}

.card-squared{
  border:1px solid #e5e7eb;
  border-radius: 14px !important;
  box-shadow: 0 8px 20px rgba(0,0,0,.04), 0 2px  6px rgba(0,0,0,.04);
}
.card-slim{ border:1px solid #e5e7eb; border-radius: 14px; }

.kpi-chip{
  display:inline-block; padding:.25rem .6rem; border-radius:999px;
  background:#eef2ff; color:#3730a3; font-weight:600; font-size:.8rem;
}
.kpi-warn{ background:#fff7ed; color:#c2410c; }

.table-plain tbody td{ border-top:1px solid #f1f5f9; }

.table-responsive{ overflow-y: visible; }

.table-plain thead th{
  font-size: 1rem;
  font-weight: 700;
}
.th-desc{
  font-size: 1.08rem;
  font-weight: 800;
  min-width: 420px;
}

.td-desc{ min-width: 420px; }

.item-row{ transition: background-color .15s ease; }
.item-row.drag-over{ background: #f8fafc; }

.image-container img{
  width: 140px; height: 90px; object-fit: cover; border-radius:10px; border:1px solid #e5e7eb;
}

.dropzone{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height: 110px;
  border:2px dashed #cbd5e1; border-radius:14px; cursor:pointer;
  transition: border-color .15s ease, background-color .15s ease;
}
.dropzone:hover{ border-color:#94a3b8; background:#f8fafc; }
.dropzone .hint{ font-size:.85rem; color:#64748b; }
.dropzone i{ font-size: 1.5rem; color:#64748b; }

.suggest-box{
  position:absolute; z-index: 20; left:0; right:0;
  top: auto;
  bottom: 100%;
  margin-bottom: 6px;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
  overflow: hidden;
  max-height: 240px;
  overflow: hidden;
}

.suggest-box--fixed{
  position: fixed !important;
  z-index: 4000 !important;
  left: 0;
  right: auto;
  bottom: auto;
  top: auto;
  margin-bottom: 0;
  overflow: auto;
}

.suggest-box ul{
  max-height: 240px;
  overflow: auto;
  margin: 0;
  padding: 6px 0 8px;
}

.suggest-head{
  position: sticky;
  top: 0;
  z-index: 2;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding: .5rem .65rem;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
}

.hint{ font-size: .78rem; color:#64748b; }
.kbd{
  display:inline-block;
  padding: .1rem .35rem;
  border:1px solid #d1d5db;
  border-bottom-width: 2px;
  border-radius: .35rem;
  background:#fff;
  font-size:.75rem;
  line-height:1.2;
  margin: 0 2px;
}

.suggest-item{
  border-radius: 12px;
  margin: 6px 8px;
  padding: .6rem .7rem;
  cursor:pointer;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:.6rem;
  color:#0f172a;
}
.suggest-item:hover{
  background:#f8fafc;
  color:#0f172a;
}
.suggest-item.is-active{
  background:#e0f2fe;
  outline: 2px solid rgba(2, 132, 199, .18);
  outline-offset: -2px;
  color:#0f172a;
}
.suggest-text{ min-width: 0; white-space: normal; overflow: visible; text-overflow: initial; line-height: 1.25; }
.suggest-box mark{
  background: rgba(255, 193, 7, 0.35);
  padding: 0 2px;
  border-radius: 4px;
}

.suggest-empty{
  padding: .6rem .7rem;
  color: #64748b;
  display:flex;
  align-items:center;
  gap:.5rem;
}

.input-with-icon{
  position: relative;
}
.input-with-icon > i{
  position:absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color:#94a3b8;
  pointer-events:none;
  font-size: 1.05rem;
}
.input-with-icon > textarea{
  padding-left: 44px;
  min-height: 46px;
  height: 44px;
  font-size: 1.05rem;
  line-height: 1.25;
  resize: none;
  overflow: hidden;
  border-radius: 12px;
  color: #0f172a !important;
}
.input-with-icon > textarea:focus{
  color: #0f172a !important;
}

.desc-input.is-expanded{
  font-size: 1.12rem;
}

/* Dark mode */
:global(html.theme-dark) .suggest-box{
  background: rgba(17,24,39,.98);
  border-color: rgba(255,255,255,.08);
}
:global(html.theme-dark) .suggest-head{
  background: rgba(31,41,55,.92);
  border-bottom-color: rgba(255,255,255,.08);
}
:global(html.theme-dark) .suggest-item{
  border-radius: 12px;
  margin: 6px 8px;
  color:#e5e7eb;
}
:global(html.theme-dark) .suggest-item:hover{
  background: rgba(31,41,55,.7);
  color:#e5e7eb;
}
:global(html.theme-dark) .suggest-item.is-active{
  background: rgba(2,132,199,.22);
  color:#e5e7eb;
}
:global(html.theme-dark) .suggest-box mark{
  background: rgba(245,158,11,.25);
  color:#e5e7eb;
}

.toast-box{
  display: flex;
  align-items: center;
  padding: .6rem .8rem;
  border-radius: 10px;
  color: #fff;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-danger{ background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

.overlay{
  position: fixed; inset: 0; background: rgba(15,23,42,.35);
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  color:#fff; z-index: 2000; text-shadow: 0 1px 2px rgba(0,0,0,.4);
}
</style>
