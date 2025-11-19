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
                <input class="form-check-input" type="checkbox" id="swLocal" v-model="localConsent" @change="persistLocalConsent">
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
        <div class="card-header  d-flex justify-content-between align-items-center">
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
              <input type="text" class="form-control" value="Xtreme Servicios" readonly>
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

          <!-- Botón AGREGAR -->
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-secondary flex-fill" @click="agregarFila(); triggerAutoSave()">
              <i class="bi bi-plus-lg"></i> Agregar ítem
            </button>
            <button
              class="btn btn-success ms-auto"
              @click="guardarSolpe"
              :disabled="enviandoSolpe || nombreInvalido || faltantesGenerales>0 || itemsIncompletos>0">
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
                  <th>Descripción <span class="text-danger">*</span></th>
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

                  <!-- Descripción + sugerencias -->
                  <td class="position-relative">
                    <input
                      type="text"
                      class="form-control"
                      :class="{'is-invalid': campoInvalido(item,'descripcion')}"
                      v-model="item.descripcion"
                      :readonly="!item.editando"
                      placeholder="Ej: FILTRO DE AIRE"
                      @input="onUpperItem(i,'descripcion',$event); triggerAutoSave(); showSuggestFor(i)"
                      @focus="showSuggestFor(i)"
                      @blur="hideSuggestSoon(i)"
                      @keyup.enter="autoAgregarSiUltimoCompleto(i)"
                    >
                    <!-- Caja de sugerencias -->
                    <ul
                      v-if="item.editando && suggestOpenIndex===i && suggestions(i).length"
                      class="suggest-box list-unstyled mb-0"
                      @mouseenter="suggestHovering=true"
                      @mouseleave="suggestHovering=false"
                    >
                      <li
                        v-for="(s, idx) in suggestions(i)"
                        :key="idx"
                        class="suggest-item"
                        @mousedown.prevent="applySuggestion(i, s)"
                      >
                        <i class="bi bi-magic me-2"></i>{{ s.descripcion_raw }}
                        <small v-if="s.codigo_referencial" class="text-muted ms-2">({{ s.codigo_referencial }})</small>
                      </li>
                    </ul>
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
                    <!-- Imagen existente -->
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

                    <!-- Dropzone / input -->
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

                <!-- Si no hay ítems -->
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
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import imageCompression from "browser-image-compression";
import { db } from "../stores/firebase";
import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, getDoc, updateDoc, where
} from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

export default {
  name: "SolpedTaller",
  setup() {
    const irHistorial = () => router.push({ name: "historial-solped-taller" });
    const router = useRouter();
    const auth = useAuthStore();
    const storage = getStorage();

    const error = ref("");
    const isOnline = ref(navigator.onLine);

    // ======= Estado principal =======
    const solpe = reactive({
      numero_solpe: null,
      fecha: "",
      empresa: "Xtreme Servicios",
      nombre_solicitante: "",
      cotizadores: ["Guillermo Manzor","Camila Ricci", "María José Ballesteros"],
      tipo_solped: "REPUESTOS", // <-- ahora editable con el select
      centro_costo: "",
      items: [],
      estatus: "Pendiente",
    });

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
    const IMPORT_KEY = 'solped_taller_import';
    const hasMeaningfulState = (s) => {
      const nombreOk = !!(s.nombre_solicitante||"").trim();
      const ccOk = !!(s.centro_costo||"").trim();
      const items = Array.isArray(s.items) ? s.items : [];
      const itemsConContenido = items.some(it => {
        const descOk = !!(it?.descripcion||"").trim();
        const cantOk = Number(it?.cantidad) > 0;
        const imgOk  = !!(it?.imagen_url||"").trim();
        const codOk  = !!(it?.codigo_referencial||"").trim();
        const numOk  = !!(it?.numero_interno||"").trim();
        return descOk || cantOk || imgOk || codOk || numOk;
      });
      return nombreOk || ccOk || itemsConContenido;
    };
    let saveTimer = null;

    // Catálogo (predicciones)
    const catalog = ref([]);
    const suggestOpenIndex = ref(-1);
    let suggestHideTimer = null;
    const suggestHovering = ref(false);

    // Toasts
    const toasts = ref([]);
    const addToast = (type, text, timeout=2400) => {
      const id = Date.now() + Math.random();
      toasts.value.push({id, type, text});
      setTimeout(()=>closeToast(id), timeout);
    };
    const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

    // ============ Util =============
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = (d.getMonth()+1).toString().padStart(2,'0');
      const day = d.getDate().toString().padStart(2,'0');
      return `${y}-${m}-${day}`;
    };
    const upper = (v) => (v||"").toString().toUpperCase();
    const normalize = (v) => upper(v).normalize("NFD").replace(/\p{Diacritic}/gu,"");

    // ====== Online / Offline listeners ======
    const onOnline = () => { isOnline.value = true; addToast("success","Conexión restaurada."); };
    const onOffline = () => { isOnline.value = false; addToast("danger","Sin conexión. Tus cambios quedan locales."); };

    // ====== Consentimiento local ======
    const persistLocalConsent = () => {
      try { localStorage.setItem(LS_LOCAL_CONSENT, localConsent.value ? "1":"0"); } catch(e) {console.error(e)}
      if (!localConsent.value) {
        addToast("danger","Guardado local desactivado.");
      } else {
        addToast("success","Guardado local activado.");
        triggerAutoSave();
      }
    };
    function sanitizeUpper(v) {
      return (v || '').toString().toUpperCase();
    }
    const aplicarImportacionDesdeHistorial = async () => {
      try {
        const raw = sessionStorage.getItem(IMPORT_KEY);
        if (!raw) return false;

        const imp = JSON.parse(raw);
        sessionStorage.removeItem(IMPORT_KEY); // consumir una sola vez

        // Forzamos fecha de hoy y correlativo nuevo (se calcula luego)
        const hoy = formatDate(new Date());

        // Precargamos los campos principales
        Object.assign(solpe, {
          numero_solpe: null,           // se calculará después
          fecha: hoy,                   // hoy
          empresa: imp.empresa || 'Xtreme Servicios',
          nombre_solicitante: sanitizeUpper(imp.nombre_solicitante || ''),
          cotizadores: solpe.cotizadores, // mantenemos la lista default
          tipo_solped: imp.tipo_solped || 'REPUESTOS',
          centro_costo: sanitizeUpper(imp.centro_costo || ''),
          items: (Array.isArray(imp.items) ? imp.items : []).map((it, idx) => ({
            id: idx + 1,
            descripcion: sanitizeUpper(it.descripcion || ''),
            codigo_referencial: sanitizeUpper(it.codigo_referencial || ''),
            cantidad: Number(it.cantidad || 1),
            numero_interno: sanitizeUpper(it.numero_interno || ''),
            imagen_url: it.imagen_url || '',
            editando: true
          })),
          estatus: 'Pendiente'
        });

        // Validación del nombre (tu lógica existente)
        onNombreSolicitanteChange();

        // Correlativo nuevo si aún no lo tiene
        if (!solpe.numero_solpe) {
          solpe.numero_solpe = await obtenerSiguienteNumeroDesdeColeccion();
        }

        // Guardamos borrador si está activado
        triggerAutoSave();

        // Aviso al usuario
        addToast('success', 'Se importó la SOLPED desde historial. Revisa y envía.');
        return true;
      } catch (e) {
        console.error(e);
        addToast('danger', 'No se pudo importar la SOLPED desde historial.');
        return false;
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
        try { localStorage.removeItem(DRAFT_KEY); } catch(e) {console.error(e)}
        return;
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          ts: Date.now(),
          data: JSON.parse(JSON.stringify(solpe))
        }));
      } catch { /* ignore */ }
    };

    const hasMeaningfulDraft = (draft) => {
      if (!draft) return false;
      const s = draft.data || {};
      const nombreOk = !!(s.nombre_solicitante||"").trim();
      const ccOk = !!(s.centro_costo||"").trim();
      const items = Array.isArray(s.items) ? s.items : [];
      const itemsConContenido = items.some(it => {
        return !!(it?.descripcion||"").trim() || (Number(it?.cantidad)>0) ||
               !!(it?.imagen_url||"").trim() || !!(it?.codigo_referencial||"").trim() ||
               !!(it?.numero_interno||"").trim();
      });
      return nombreOk || ccOk || itemsConContenido;
    };

    const tryRestoreDraft = () => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!hasMeaningfulDraft(draft)) return;
        Object.assign(solpe, { ...draft.data, fecha: formatDate(new Date()) });
        addToast("success", "Borrador restaurado.");
      } catch { /* ignore */ }
    };

    const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch(e) {console.error(e)} };

    // ======= KPIs / validaciones =======
    const faltantesGenerales = computed(() => {
      let f = 0;
      if (!(solpe.nombre_solicitante||"").trim()) f++;
      if (!(solpe.centro_costo||"").trim()) f++;
      if (nombreInvalido.value) f++;
      return f;
    });

    const itemsIncompletos = computed(() => {
      return solpe.items.filter(it => isItemIncompleto(it)).length;
    });

    const campoInvalido = (item, campo) => {
      if (!intentadoGuardar.value && !item.editando) return false;
      if (campo === 'descripcion') return !(item.descripcion && item.descripcion.trim().length>0);
      if (campo === 'cantidad') return !(item.cantidad && item.cantidad>0);
      return false;
    };

    const isItemIncompleto = (it) => {
      return !(it.descripcion||"").trim() || !(Number(it.cantidad)>0);
    };

    // ======= Nombre solicitante =======
    const onNombreSolicitanteChange = () => {
      solpe.nombre_solicitante = upper(solpe.nombre_solicitante);
      const solicitante = (solpe.nombre_solicitante||"").trim();
      const sesion = (nombreSesion.value||"").trim();
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
        editando: true
      });
    };

    const eliminarItem = (i) => { solpe.items.splice(i,1); triggerAutoSave(); };
    const editarItem = (i) => { solpe.items[i].editando = true; triggerAutoSave(); };
    const guardarItem = (i) => { solpe.items[i].editando = false; triggerAutoSave(); };

    // Auto-agregar una fila cuando el último ítem queda completo
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
          addToast("danger","Archivo no válido. Solo imágenes.");
          return;
        }
        await handleFileUpload(file, index);
      } catch (e) {
        console.error(e);
        addToast("danger","Error al subir imagen");
      }
    };

    const handleFileUpload = async (file, index) => {
      subiendoImagen.value = index;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1000,
          useWebWorker: true
        });

        const nombre = `solped_taller_${solpe.numero_solpe || 'temp'}_${index}_${Date.now()}.jpg`;
        const ruta = `solped_taller_images/${nombre}`;
        const refUp = sRef(storage, ruta);

        await uploadBytes(refUp, compressed);
        const url = await getDownloadURL(refUp);
        solpe.items[index].imagen_url = url;
        addToast("success","Imagen subida");
        triggerAutoSave();
      } finally {
        subiendoImagen.value = -1;
      }
    };

    // Drag & Drop imagen
    const onDragOver = (i) => { dragOverIndex.value = i; };
    const onDragLeave = (i) => { if (dragOverIndex.value === i) dragOverIndex.value = -1; };
    const onDrop = async (ev, i) => {
      try {
        dragOverIndex.value = -1;
        const file = ev.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
          addToast("danger","Archivo no válido. Solo imágenes.");
          return;
        }
        await handleFileUpload(file, i);
      } catch(e) {
        console.error(e);
        addToast("danger","No se pudo cargar la imagen.");
      }
    };

    const eliminarImagen = async (i) => {
      const url = solpe.items[i]?.imagen_url;
      if (!url) return;
      deletingImagen.value = i;
      try {
        // Best effort: deducir path desde la URL pública
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
        addToast("success","Imagen eliminada");
        triggerAutoSave();
      }
    };

    // ======= Correlativo =======
    const obtenerSiguienteNumeroDesdeColeccion = async () => {
      try {
        const qy = query(collection(db, "solped_taller"), orderBy("numero_solpe","desc"), limit(1));
        const snap = await getDocs(qy);
        if (snap.empty) return 1;
        const maxNum = Number(snap.docs[0].data()?.numero_solpe) || 0;
        return maxNum + 1;
      } catch (e) {
        console.error("Error correlativo:", e);
        return 1;
      }
    };

    // ======= Catálogo: cargar / sugerir / actualizar =======
    const loadCatalog = async () => {
      try {
        const qy = query(collection(db, "items_catalog"), orderBy("usage_count","desc"));
        const snap = await getDocs(qy);
        catalog.value = snap.docs.map(d => ({
          id: d.id,
          ...(d.data()||{})
        }));
      } catch (e) {
        console.warn("No se pudo cargar items_catalog:", e);
      }
    };

    const suggestions = (i) => {
      const term = normalize(solpe.items[i]?.descripcion || "");
      if (!term || term.length < 2) return [];
      const top = [];
      for (const it of catalog.value) {
        const text = normalize(it.descripcion_upper || it.descripcion_raw || "");
        if (text.includes(term)) {
          top.push(it);
          if (top.length >= 5) break;
        }
      }
      return top;
    };

    const showSuggestFor = (i) => {
      suggestOpenIndex.value = i;
      clearTimeout(suggestHideTimer);
    };
    const hideSuggestSoon = () => {
      clearTimeout(suggestHideTimer);
      suggestHideTimer = setTimeout(() => {
        if (!suggestHovering.value) suggestOpenIndex.value = -1;
      }, 120);
    };

    const applySuggestion = (i, s) => {
      solpe.items[i].descripcion = upper(s.descripcion_raw || s.descripcion_upper || "");
      if (s.codigo_referencial && !solpe.items[i].codigo_referencial) {
        solpe.items[i].codigo_referencial = upper(s.codigo_referencial);
      }
      suggestOpenIndex.value = -1;
      addToast("success","Sugerencia aplicada.");
      triggerAutoSave();
      autoAgregarSiUltimoCompleto(i);
    };

    const upsertCatalogForItems = async (items) => {
      try {
        for (const it of items) {
          const descUpper = upper(it.descripcion||"").trim();
          if (!descUpper) continue;

          const qy = query(collection(db, "items_catalog"), where("descripcion_upper","==", descUpper), limit(1));
          const snap = await getDocs(qy);

          if (!snap.empty) {
            const dref = doc(db, "items_catalog", snap.docs[0].id);
            const prev = snap.docs[0].data() || {};
            await updateDoc(dref, {
              usage_count: Number(prev.usage_count||0)+1,
              last_used: serverTimestamp(),
              ...(it.codigo_referencial ? { codigo_referencial: upper(it.codigo_referencial) } : {})
            });
          } else {
            await addDoc(collection(db, "items_catalog"), {
              descripcion_upper: descUpper,
              descripcion_raw: it.descripcion,
              codigo_referencial: it.codigo_referencial || null,
              usage_count: 1,
              created_at: serverTimestamp(),
              last_used: serverTimestamp()
            });
          }
        }
      } catch (e) {
        console.warn("No se pudo actualizar items_catalog:", e);
      }
    };

    // ======= Guardar =======
    const guardarSolpe = async () => {
      if (enviandoSolpe.value) return;
      intentadoGuardar.value = true;

      const missing = [];
      const solicitante = upper((solpe.nombre_solicitante||"").trim());
      const sesion = upper((nombreSesion.value||"").trim());

      if (!solicitante) missing.push("Nombre del solicitante");
      if (!(solpe.centro_costo||"").trim()) missing.push("Patente o N° interno (Centro de costo)");

      if (solicitante && sesion && solicitante === sesion) {
        nombreInvalido.value = true;
        missing.push(`Nombre del solicitante (no puede ser "${nombreSesion.value}")`);
      }

      if (missing.length) {
        addToast("danger", "Faltan datos: " + missing.join(", "));
        return;
      }

      if (!solpe.items.length) {
        addToast("warning","Agrega al menos un ítem");
        return;
      }
      for (const it of solpe.items) {
        if (isItemIncompleto(it)) {
          addToast("warning","Cada ítem debe tener Descripción y Cantidad (>0)");
          return;
        }
      }

      enviandoSolpe.value = true;
      try {
        if (!solpe.numero_solpe) {
          solpe.numero_solpe = await obtenerSiguienteNumeroDesdeColeccion();
        }

        const payload = {
          numero_solpe: solpe.numero_solpe,
          fecha: solpe.fecha,
          empresa: "Xtreme Servicios",
          nombre_solicitante: solicitante,
          cotizadores: solpe.cotizadores,
          tipo_solped: solpe.tipo_solped, // <-- usa el valor elegido en el select
          centro_costo: (solpe.centro_costo||"").trim(),
          estatus: "Pendiente",
          items: (solpe.items||[]).map((it, idx) => ({
            item: idx+1,
            descripcion: (it.descripcion||"").trim(),
            codigo_referencial: (it.codigo_referencial||"").trim() || "SIN CÓDIGO",
            cantidad: Number(it.cantidad),
            numero_interno: (it.numero_interno||"").trim() || "SIN PATENTE",
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
          usuario: solicitante
        });

        // Actualizar catálogo (solo al enviar)
        await upsertCatalogForItems(payload.items);

        addToast("success","SOLPED de taller creada");

        clearDraft();
        sessionStorage.setItem(JUST_SENT_KEY, "1");

        await resetearFormulario();

      } catch (e) {
        console.error(e);
        addToast("danger","Error al guardar la SOLPED");
      } finally {
        enviandoSolpe.value = false;
        intentadoGuardar.value = false;
      }
    };

    const resetearFormulario = async () => {
      const hoy = formatDate(new Date());
      Object.assign(solpe, {
        numero_solpe: await obtenerSiguienteNumeroDesdeColeccion(),
        fecha: hoy,
        empresa: "Xtreme Servicios",
        nombre_solicitante: "",
        cotizadores: ["Guillermo Manzor", "Luis Orellana", "María José Ballesteros"],
        tipo_solped: "REPUESTOS", // <-- valor por defecto al reset
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
      } catch(e){ console.error(e);}
    };

    const goBack = () => {
      router.push({ name: "MenuTaller" }).catch(()=> router.back());
    };
    const goHistorialTaller = () => {
      if (router.hasRoute('HistorialSolpedTaller')) {
        router.push({ name: 'HistorialSolpedTaller' });
      } else {
        router.push('/historial-solped-taller');
      }
    };

    // ======= Init =======
    onMounted(async () => {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);

      try {
        const saved = localStorage.getItem(LS_LOCAL_CONSENT);
        if (saved === "0") localConsent.value = false;
        if (saved === "1") localConsent.value = true;
      } catch (e){ console.error(e); }

      try {
        await loadSesionName();
        solpe.fecha = formatDate(new Date());

        // 1) Si venimos desde "Historial" con importación, lo aplicamos primero
        const imported = await aplicarImportacionDesdeHistorial();

        // 2) Si NO hubo importación, intentamos restaurar borrador local
        const justSent = sessionStorage.getItem(JUST_SENT_KEY) === "1";
        if (justSent) {
          sessionStorage.removeItem(JUST_SENT_KEY);
        } else if (!imported && localConsent.value) {
          tryRestoreDraft();
        }

        // 3) Si aún no hay correlativo, lo pedimos
        if (!solpe.numero_solpe) {
          solpe.numero_solpe = await obtenerSiguienteNumeroDesdeColeccion();
          triggerAutoSave();
        }

        await loadCatalog();
      } catch (e) {
        console.error(e);
        error.value = "No se pudo inicializar la vista.";
      }
    });


    return {
      // estado
      solpe, error, nombreSesion, nombreInvalido,
      enviandoSolpe, intentadoGuardar, isOnline,
      fileInputs, subiendoImagen, deletingImagen, dragOverIndex,
      localConsent,

      // kpis
      faltantesGenerales, itemsIncompletos,

      // catálogo/sugerencias
      catalog, suggestions, suggestOpenIndex, suggestHovering,
      showSuggestFor, hideSuggestSoon, applySuggestion,

      // toasts
      toasts, addToast, closeToast,

      // fns
      goBack,
      onNombreSolicitanteChange, triggerAutoSave, persistLocalConsent,
      campoInvalido, isItemIncompleto,
      agregarFila, eliminarItem, editarItem, guardarItem,
      seleccionarArchivo, subirImagenReferencia, eliminarImagen,
      guardarSolpe, resetearFormulario,
      onUpperItem, autoAgregarSiUltimoCompleto,
      onDragOver, onDragLeave, onDrop, hasMeaningfulState,irHistorial,goHistorialTaller
    };
  }
};
</script>

<style scoped>
.solped-taller-page{
  min-height:100vh;
}

.page-title{
  font-size: 1.35rem;
  font-weight: 700;
  display:flex; align-items:center; gap:.5rem;
}

/* Card cuadrada y limpia */
.card-squared{
  border:1px solid #e5e7eb;
  border-radius: 8px !important;
  box-shadow:
    0 8px 20px rgba(0,0,0,.04),
    0 2px  6px rgba(0,0,0,.04);
}
.card-slim{
  border:1px solid #e5e7eb;
  border-radius: 8px;
}

/* KPI chip */
.kpi-chip{
  display:inline-block; padding:.25rem .6rem; border-radius:999px;
  background:#eef2ff; color:#3730a3; font-weight:600; font-size:.8rem;
}
.kpi-warn{ background:#fff7ed; color:#c2410c; }

/* Tabla minimalista */

.table-plain tbody td{
  border-top:1px solid #f1f5f9;
}

/* Fila de ítem (drag & drop) */
.item-row{ transition: background-color .15s ease; }
.item-row.drag-over{ background: #f8fafc; }

/* Imagen */
.image-container img{
  width: 140px; height: 90px; object-fit: cover; border-radius:6px; border:1px solid #e5e7eb;
}

/* Dropzone */
.dropzone{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height: 110px;
  border:2px dashed #cbd5e1; border-radius:8px;  cursor:pointer;
  transition: border-color .15s ease, background-color .15s ease;
}
.dropzone:hover{ border-color:#94a3b8; background:#f8fafc; }
.dropzone .hint{ font-size:.85rem; color:#64748b; }
.dropzone i{ font-size: 1.5rem; color:#64748b; }

/* Sugerencias */
.suggest-box{
  position:absolute; z-index: 20; left:0; right:0; top: 100%;
  background:#fff; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 8px 8px;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
  max-height: 220px; overflow:auto;
}
.suggest-item{
  padding: .45rem .6rem; cursor:pointer; display:flex; align-items:center;
}
.suggest-item:hover{ background:#f8fafc; }

/* Toasts abajo-derecha */
.toast-stack{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1080;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* Overlay global */
.overlay{
  position: fixed; inset: 0; background: rgba(15,23,42,.35);
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  color:#fff; z-index: 2000; text-shadow: 0 1px 2px rgba(0,0,0,.4);
}
</style>
