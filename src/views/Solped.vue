<!-- eslint-disable vue/multi-word-component-names -->
<!-- src/views/Solpes.vue -->
<template>
  <div class="solped-page">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <header class="page-head mb-4">
        <div class="page-head__left">
          <h1 class="h4 fw-semibold mb-1">Creación de SOLPED</h1>
          <p class="text-secondary mb-0">Complete los datos y envíe la solicitud.</p>
          <small class="text-secondary d-inline d-sm-none mt-2">
            Usuario: <strong>{{ usuarioNombre || '-' }}</strong>
          </small>
        </div>

        <div class="page-head__right">
          <router-link
            class="btn btn-outline-primary btn-sm"
            :to="{ name: 'historial-solped' }"
            title="Ver historial de SOLPED"
          >
            <i class="bi bi-clock-history me-1"></i>
            Historial
          </router-link>
          <small class="text-secondary d-none d-sm-inline">
            Usuario: <strong>{{ usuarioNombre || '-' }}</strong>
          </small>
        </div>
      </header>

      <!-- Alertas -->
      <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i><div>{{ error }}</div>
      </div>
      <div v-if="okMsg" class="alert alert-success d-flex align-items-center" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i><div>{{ okMsg }}</div>
      </div>

      <!-- Card: Datos generales -->
      <section class="card card-elevated mb-4">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h2 class="h6 mb-0 fw-semibold">Datos generales</h2>

          <!-- Guardado local -->
          <div class="d-flex align-items-center gap-2 flex-wrap justify-content-end w-auto">
            <div class="form-check form-switch">
              <input
                id="swLocalSave"
                class="form-check-input"
                type="checkbox"
                v-model="localSaveEnabled"
                @change="persistLocalSavePref"
              >
              <label class="form-check-label small" for="swLocalSave">
                Guardar local automáticamente
              </label>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-danger" @click="clearLocalNow">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-3 p-md-4">
          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label class="form-label">N° SOLPED</label>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control"
                  :value="form.empresa ? (form.numero_solpe ?? '') : ''"
                  :placeholder="form.empresa ? '' : 'Selecciona empresa para generar N°'"
                  :disabled="!form.empresa"
                  readonly
                />
                <span v-if="loadingNumero" class="input-group-text bg-light">
                  <span class="spinner-border spinner-border-sm"></span>
                </span>
              </div>
              <div class="form-text">Se asigna automáticamente por empresa.</div>
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="form.empresa" @change="onEmpresaChange" required>
                <option value="" disabled>Selecciona empresa</option>
                <option value="Xtreme Servicio">Xtreme Servicios</option>
                <option value="Xtreme Mining">Xtreme Mining</option>
                <option value="Xtreme Hormigones">Xtreme Hormigones</option>
              </select>
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Fecha</label>
              <input type="datetime-local" class="form-control" v-model="form.fecha" readonly />
              <div class="form-text">Automática (momento actual).</div>
            </div>

            <div class="col-12 col-md-8">
              <label class="form-label">Nombre de la SOLPED</label>
              <input
                class="form-control"
                v-model="form.nombre_solped"
                @input="form.nombre_solped = (form.nombre_solped || '').toUpperCase()"
                placeholder="EJ: INSUMOS OFICINA JUNIO"
                required
              />
              <div class="form-text">Usa un nombre claro para facilitar búsqueda.</div>
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Tipo de SOLPED</label>
              <select class="form-select" v-model="form.tipo_solped" required>
                <option value="" disabled>Seleccionar tipo</option>
                <option>EPP</option>
                <option>INSUMOS DE OFICINA</option>
                <option>SERVICIOS DE TERCEROS</option>
                <option>REPUESTOS</option>
                <option>MATERIALES</option>
                <option>HERRAMIENTAS</option>
                <option>LUBRICANTES</option>
                <option>NEUMÁTICOS</option>
                <option>EDP</option>
                <option>MATERIAS PRIMA</option>
                <option>INSUMOS DE MINERÍA</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Cotizadores</label>
              <select class="form-select" multiple v-model="form.dirigidoA">
                <option v-for="u in cotizadoresFiltrados" :key="u" :value="u">{{ u }}</option>
              </select>
              <div class="form-text">Puedes elegir más de uno.</div>
              <div v-if="form.dirigidoA?.length" class="mt-2">
                <span v-for="u in form.dirigidoA" :key="u" class="badge rounded-pill text-bg-light border me-1 mb-1">
                  <i class="bi bi-person-circle me-1"></i>{{ u }}
                </span>
              </div>
            </div>

            <!-- Centro de costo -->
            <div class="col-12 col-md-6">
              <label class="form-label">Centro de costo</label>

              <div v-if="!Object.keys(centrosDisponibles).length" class="alert alert-warning py-2 small">
                No tienes contratos asignados. Solicita a un administrador que te asigne uno o más.
              </div>

              <select class="form-select"
                      v-model="form.numero_contrato"
                      @change="onCentroCosto"
                      :disabled="!Object.keys(centrosDisponibles).length"
                      required>
                <option value="" disabled>Selecciona centro de costo</option>
                <option v-for="(label, code) in centrosDisponibles" :key="code" :value="code">
                  {{ code }} — {{ label }}
                </option>
              </select>

              <div class="form-text">
                Guardado: <strong>{{ form.nombre_centro_costo || '-' }}</strong>
              </div>
            </div>

            <!-- Adjuntos (múltiples, opcional) -->
            <div class="col-12">
              <div class="form-check mb-2">
                <input id="chkAdj" class="form-check-input" type="checkbox" v-model="requiereAutorizacion" />
                <label class="form-check-label" for="chkAdj">Subir archivos adicionales (opcional)</label>
              </div>

              <!-- DROPZONE con botones Archivos/Carpeta -->
              <div
                v-if="requiereAutorizacion"
                class="dropzone"
                :class="{
                  'opacity-50 pointer-events-none': !form.empresa,
                  'is-dragover': isDragging
                }"
                @click="form.empresa && $refs.inputAdjuntos.click()"
                @dragover.prevent="onDragOver"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop"
              >
                <i class="bi bi-cloud-arrow-up me-2 fs-5"></i>
                <div class="dz-text">
                  <strong>Subir archivos o carpetas</strong>
                  <div class="small text-secondary">
                    Arrastra y suelta <u>archivos o carpetas</u> aquí, o usa los botones →
                    PDF, JPG/PNG, XLS/XLSX, CSV, <b>ZIP</b>, <b>RAR</b> · hasta {{ MAX_FILES }} archivos · máx {{ MAX_SIZE_MB }} MB c/u · total {{ MAX_TOTAL_MB }} MB
                  </div>
                </div>

                <div class="ms-auto d-flex gap-2">
                  <button
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    @click.stop="$refs.inputAdjuntos.click()"
                    :disabled="!form.empresa"
                    title="Seleccionar archivos"
                  >
                    <i class="bi bi-file-earmark-plus"></i> Archivos
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    @click.stop="$refs.inputFolder.click()"
                    :disabled="!form.empresa"
                    title="Seleccionar carpeta"
                  >
                    <i class="bi bi-folder-plus"></i> Carpeta
                  </button>
                </div>

                <!-- Input de archivos -->
                <input
                  ref="inputAdjuntos"
                  type="file"
                  class="d-none"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv,.zip,.rar"
                  @change="subirAdjuntos"
                />

                <!-- Input de carpeta -->
                <input
                  ref="inputFolder"
                  type="file"
                  class="d-none"
                  webkitdirectory
                  directory
                  @change="subirCarpeta"
                />

                <!-- Overlay de carga -->
                <div v-if="uploadingAdjuntos" class="dz-loading">
                  <div class="dz-loading-box">
                    <div class="spinner-border me-2" role="status"></div>
                    <div class="flex-grow-1">
                      <div class="small fw-semibold">Subiendo archivos… {{ uploadedCount }}/{{ uploadTotal }}</div>
                      <div class="progress mt-1" style="height: 6px;">
                        <div class="progress-bar" role="progressbar" :style="{ width: totalProgress + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Píldoras de archivos -->
              <div v-if="form.autorizaciones?.length" class="mt-2 d-flex flex-wrap gap-2">
                <div
                  v-for="(f, idx) in form.autorizaciones"
                  :key="f.url + idx"
                  class="file-pill alert alert-light d-flex align-items-center mb-0"
                  style="gap:.5rem;"
                >
                  <i class="bi bi-paperclip"></i>
                  <a :href="f.url" target="_blank" rel="noopener" class="text-decoration-none me-1">
                    {{ f.nombre }}
                  </a>
                  <span class="badge text-bg-light border">{{ f.tipo || 'archivo' }}</span>
                  <span v-if="f.tamano" class="small text-muted">· {{ (f.tamano/1024/1024).toFixed(1) }} MB</span>
                  <button class="btn btn-sm btn-outline-danger ms-2" @click="eliminarAdjunto(idx)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <!-- Botón limpiar todo -->
              <div v-if="form.autorizaciones?.length" class="mt-2">
                <button class="btn btn-sm btn-outline-danger" @click="limpiarAdjuntos">
                  Limpiar adjuntos
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Card: Ítems -->
      <section class="card card-elevated">
        <div class="card-header">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h2 class="h6 mb-0 fw-semibold">Tabla de ítems</h2>
              <small class="text-secondary">Descripción, cantidades y datos referenciales.</small>
            </div>
            <div class="d-flex gap-2 w-auto">
              <button class="btn btn-outline-secondary btn-sm" @click="agregarFila" title="Agregar fila">
                <i class="bi bi-plus-lg"></i>
              </button>
              <button class="btn btn-success btn-sm" :disabled="enviandoSolpe" @click="guardarSolped" title="Enviar">
                <i v-if="!enviandoSolpe" class="bi bi-send-fill"></i>
                <span v-else class="d-inline-flex align-items-center">
                  <span class="spinner-border spinner-border-sm me-1"></span> Enviando…
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 responsive-stack">
              <thead>
                <tr>
                  <th style="width:56px;">#</th>
                  <th>Descripción</th>
                  <th style="width:160px;">Código</th>
                  <th style="width:120px;">Cantidad</th>
                  <th style="width:120px;">Stock</th>
                  <th style="width:180px;">N° Interno / Patente</th>
                  <th style="width:180px;">Imagen</th>
                  <th style="width:110px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in form.items" :key="item.id">
                  <td class="text-secondary" :data-label="'#'">{{ i + 1 }}</td>

                  <td class="position-relative" :data-label="'Descripción'">
                    <input
                      class="form-control form-control-sm"
                      v-model="item.descripcion"
                      @focus="focusRow = i"
                      @blur="onDescBlur(i)"
                      @input="onDescInput(i)"
                      placeholder="Describe el ítem"
                    />
                    <!-- Sugerencias -->
                    <ul v-if="suggests[i]?.length && focusRow === i" class="list-group suggest-popover">
                      <li
                        class="list-group-item list-group-item-action"
                        v-for="s in suggests[i]"
                        :key="s"
                        @mousedown.prevent
                        @click="aplicarSugerencia(i, s)"
                      >
                        {{ s }}
                      </li>
                    </ul>
                  </td>

                  <td :data-label="'Código'">
                    <input class="form-control form-control-sm" v-model="item.codigo_referencial"
                           @input="item.codigo_referencial = (item.codigo_referencial||'').toUpperCase()"
                           placeholder="Opcional" />
                  </td>

                  <td :data-label="'Cantidad'">
                    <input type="number" min="0" class="form-control form-control-sm" v-model.number="item.cantidad" placeholder="0" />
                  </td>

                  <td :data-label="'Stock'">
                    <input type="number" min="0" class="form-control form-control-sm" v-model.number="item.stock" placeholder="0" />
                  </td>

                  <td :data-label="'N° Interno / Patente'">
                    <input
                      class="form-control form-control-sm"
                      v-model="item.numero_interno"
                      @blur="onNumeroInternoBlur(i)"
                      @input="item.numero_interno = (item.numero_interno || '').toUpperCase()"
                      placeholder="ABC-123"
                    />
                  </td>

                  <!-- IMAGEN con drag & drop + progreso -->
                  <td :data-label="'Imagen'">
                    <input
                      :ref="el => inputImagenRefs[i] = el"
                      type="file"
                      class="d-none"
                      accept="image/*"
                      @change="(e) => subirImagenItem(e, i)"
                    />

                    <div
                      class="img-drop"
                      :class="{
                        'is-dragover': getRowUpload(i).dragover,
                        'is-loading': getRowUpload(i).uploading
                      }"
                      @dragover.prevent="onImgDragOver(i)"
                      @dragleave.prevent="onImgDragLeave(i)"
                      @drop.prevent="onImgDrop($event, i)"
                      @click="() => !item.imagen_url && inputImagenRefs[i]?.click()"
                    >
                      <template v-if="item.imagen_url">
                        <img :src="item.imagen_url" alt="img" class="thumb" />
                        <div class="btn-group btn-group-sm ms-2">
                          <button class="btn btn-outline-secondary" @click="() => inputImagenRefs[i]?.click()" title="Cambiar imagen">
                            <i class="bi bi-image"></i>
                          </button>
                          <button
                            class="btn btn-outline-danger"
                            @click.stop="eliminarImagenItem(i)"
                            title="Eliminar imagen"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </template>
                      <template v-else>
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-image"></i>
                          <span class="small text-secondary">Arrastra una imagen aquí o selecciona una</span>
                        </div>
                      </template>

                      <div v-if="getRowUpload(i).uploading" class="img-loading">
                        <div class="img-loading-box">
                          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                          <div class="flex-grow-1">
                            <div class="small fw-semibold">Subiendo imagen… {{ getRowUpload(i).progress }}%</div>
                            <div class="progress mt-1" style="height:6px;">
                              <div class="progress-bar" role="progressbar" :style="{ width: getRowUpload(i).progress + '%' }"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td :data-label="'Acciones'">
                    <div class="btn-group btn-group-sm w-100 w-sm-auto">
                      <button class="btn btn-outline-primary" @click="guardarFila(i)" title="Guardar fila">
                        <i class="bi bi-save"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="eliminarFila(i)" title="Eliminar fila">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!form.items.length">
                  <td colspan="8" class="text-center text-secondary py-4">No hay ítems. Usa “+”.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>

    <!-- TOASTS (abajo-derecha) -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { db, storage } from "../stores/firebase";
import {
  collection, addDoc, serverTimestamp, query, where,
  orderBy, limit, getDocs, setDoc, doc, increment, arrayUnion, getDoc,
  startAt, endAt, runTransaction, updateDoc, Timestamp
} from "firebase/firestore";
import { ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";
import { useRouter } from "vue-router";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Solpes",
  setup() {
    const router = useRouter();
    const irHistorial = () => router.push({ name: "historial-solped" });
    const auth = useAuthStore();

    /* ===== Usuario (fullName) + contratos asignados ===== */
    const userFullName = ref("");
    const usuarioNombre = computed(() => userFullName.value || "");
    const uid = computed(() => auth?.user?.uid || "");

    const centrosAsignados = ref([]); // string[]

    /* ===== Límites adjuntos ===== */
    const MAX_FILES     = 10;
    const MAX_SIZE_MB   = 25;
    const MAX_TOTAL_MB  = 100;

    const ALLOWED_EXTS = new Set(["jpg","jpeg","png","pdf","xls","xlsx","csv","zip","rar"]);

    const centrosCosto = {
      '30858': 'CONTRATO 30858 INFRA CHUQUICAMATA',
      '27483': 'CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA',
      'PPCALAMA': 'PLANTA PREDOSIFICADO CALAMA',
      '20915': 'CONTRATO 20915 SUM. HORMIGON DAND',
      '23302-CARPETAS': 'CONTRATO 23302 CARPETAS',
      '23302-AMPL': 'CONTRATO 23302 AMPLIACION',
      'OFANDES': 'OFICINA LOS ANDES',
      'CASAMATRIZ': 'CASA MATRIZ',
      'RRHH': 'RRHH',
      'FINANZAS': 'FINANZAS',
      'SUST': 'SUSTENTABILIDAD',
      'SOPTI': 'SOPORTE TI',
      'STRIPCENTER': 'STRIP CENTER',
      'PLANIF': 'PLANIFICACION',
      'PPSB': 'PLANTA PREDOSIFICADO SAN BERNARDO',
      'PHUSB': 'PLANTA HORMIGON URB.SAN BERNARDO',
      'ALTOMAIPO': 'ALTO MAIPO',
      'PHURAN': 'PLANTA HORMIGON URB. RANCAGUA',
      'PARAN': 'PLANTA ARIDOS RANCAGUA',
      'PASB': 'PLANTA ARIDOS SAN BERNARDO',
      '22368': 'CONTRATO 22368 SUM HORMIGON DET',
      '28662': 'CONTRATO 28662 CARPETAS',
      '29207': 'CONTRATO 29207 MINERIA',
      'HROMIGONES DET': 'CONTRATO SUMINISTRO DE HORMIGONES DET',
      'HORMIGONES DAMD': 'CONTRATO SUMINISTRO DE HORMIGONES DAND',
      '23302': 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND',
      'DET': 'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET',
      'SANJOAQUIN': 'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN',
      'URBANOS': 'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR',
      'CS': 'CONTRATO DE SUMINISTRO DE HORMIGONES CS',
      'PREDOSIFICADO': 'CONTRATO HORMIGONES Y PREDOSIFICADO',
      'CANECHE': 'CONTRATO TALLER CANECHE',
      'INFRAESTRUCTURA': 'CONTRATO INFRAESTRUCTURA DET',
      'CHUQUICAMATA': 'CONTRATO CHUQUICAMATA',
      'CARPETASDET': 'CONTRATO CARPETAS DET',
      '30-10-11': 'GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM'
    };

    const centrosDisponibles = computed(() => {
      const out = {};
      const asg = Array.isArray(centrosAsignados.value) ? centrosAsignados.value : [];
      for (const code of asg) {
        if (centrosCosto[code]) out[code] = centrosCosto[code];
      }
      return out;
    });

    const loadUserFullName = async () => {
      try {
        const id = uid.value;
        if (!id) return;
        const snap = await getDoc(doc(db, "Usuarios", id));
        const data = snap.exists() ? snap.data() : null;
        userFullName.value = (data?.fullName || data?.fullname || "").toString().trim();

        const arr = Array.isArray(data?.centrosAsignados) ? data.centrosAsignados : [];
        centrosAsignados.value = arr.map(x => String(x));
      } catch (e) {
        console.warn("No se pudo obtener fullName/contratos de Usuarios:", e);
      }
    };

    /* ===== Helpers fecha ===== */
    const nowLocal = () => {
      const d = new Date(), p=(n)=>String(n).padStart(2,"0");
      return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    const setNow = () => (form.fecha = nowLocal());

    /* ===== Normalización catálogo ===== */
    const normalize = (v) => (v||"")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\/\s\-\._]/g,"")
      .replace(/\s+/g," ")
      .trim();
    const toDocId = (norm) => norm.replace(/\//g,"_");

    /* ===== Estado general ===== */
    const form = reactive({
      numero_solpe: null,
      empresa: "",
      fecha: nowLocal(),
      nombre_solped: "",
      tipo_solped: "",
      dirigidoA: [],
      numero_contrato: "",
      nombre_centro_costo: "",
      autorizaciones: [],
      items: [],
      estatus: "Pendiente",
    });

    const requiereAutorizacion = ref(false);
    const inputImagenRefs = reactive({});
    const error = ref("");
    const okMsg = ref("");
    const enviandoSolpe = ref(false);
    const loadingNumero = ref(false);

    const suggests = reactive({});
    const timers = reactive({});
    const focusRow = ref(-1);

    /* ===== Toasts ===== */
    const toasts = ref([]);
    const addToast = (type, text, timeout = 3000) => {
      const id = Date.now() + Math.random();
      toasts.value.push({ id, type, text });
      setTimeout(() => closeToast(id), timeout);
    };
    const closeToast = (id) => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    };

    /* ===== Estado drag & drop / subida (adjuntos múltiples) ===== */
    const isDragging = ref(false);
    const uploadingAdjuntos = ref(false);
    const totalProgress = ref(0);
    const uploadTotal = ref(0);
    const uploadedCount = ref(0);
    const perFileProgress = ref([]);

    /* ===== Estado de imagen por fila (drag/progreso) ===== */
    const rowUpload = reactive({});
    const getRowUpload = (i) => {
      if (!rowUpload[i]) rowUpload[i] = { uploading: false, progress: 0, dragover: false };
      return rowUpload[i];
    };
    const onImgDragOver = (i) => { getRowUpload(i).dragover = true; };
    const onImgDragLeave = (i) => { getRowUpload(i).dragover = false; };
    const onImgDrop = (ev, i) => {
      const file = Array.from(ev?.dataTransfer?.files || []).find(f => (f.type || "").startsWith("image/"));
      if (file) subirImagenItemFile(file, i);
      getRowUpload(i).dragover = false;
    };

    /* ===== Cotizadores ===== */
    const cotizadoresServicios = ["Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];
    const cotizadoresMining   = ["Ricardo Santibañez", "Felipe Gonzalez","Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];
    const cotizadoresHorm     = ["Ricardo Santibañez", "Felipe Gonzalez","Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];
    const cotizadoresFiltrados = computed(() => {
      if (form.empresa === "Xtreme Mining") return cotizadoresMining;
      if (form.empresa === "Xtreme Hormigones") return cotizadoresHorm;
      if (form.empresa === "Xtreme Servicio") return cotizadoresServicios;
      return [];
    });

    /* ===== Centro de costo ===== */
    const onCentroCosto = () => {
      const code = form.numero_contrato || "";
      form.nombre_centro_costo = centrosCosto[code] || "";
    };

    /* ===== Numeración por empresa (preview) ===== */
    const onEmpresaChange = async () => {
      if (!form.empresa) return;
      await actualizarNumeroSolpePorEmpresa();
      scheduleLocalSave();
      // Antes forzaba siempre un save; ahora solo si el autosave está encendido
      if (localSaveEnabled.value) saveLocalNow();
    };


    const actualizarNumeroSolpePorEmpresa = async () => {
      try {
        loadingNumero.value = true; error.value = "";
        const qy = query(
          collection(db, "solpes"),
          where("empresa", "==", form.empresa),
          orderBy("numero_solpe", "desc"),
          limit(1)
        );
        const snap = await getDocs(qy);
        form.numero_solpe = snap.empty ? 1 : (Number(snap.docs[0].data()?.numero_solpe) || 0) + 1;
      } catch (e) {
        console.error("Error al obtener número de SOLPED:", e);
        // ⬇️ antes: form.numero_solpe = form.numero_solpe || 1;
        // ahora: no toques el valor si falla; déjalo null para que no muestre nada
        form.numero_solpe = null;
        error.value = "No se pudo obtener el número de SOLPED (ver índice).";
      } finally {
        loadingNumero.value = false;
      }
    };

    /* ======= DRAFT desde Historial ======= */
    const applyDraft = async (draft) => {
      try {
        form.empresa = draft.empresa || "";
        form.numero_contrato = draft.numero_contrato || "";
        form.nombre_centro_costo = draft.nombre_centro_costo || "";
        form.tipo_solped = draft.tipo_solped || "";
        form.nombre_solped = (draft.nombre_solped || "").toUpperCase();
        form.dirigidoA = Array.isArray(draft.dirigidoA) ? draft.dirigidoA.slice(0) : [];
        form.items = (draft.items || []).map((it, idx) => ({
          id: idx + 1,
          descripcion: (it.descripcion || "").toUpperCase(),
          codigo_referencial: (it.codigo_referencial || "").toUpperCase(),
          cantidad: Number(it.cantidad || 0),
          stock: Number(it.stock || 0),
          numero_interno: (it.numero_interno || "").toUpperCase(),
          imagen_url: it.imagen_url || "",
        }));
        if (!form.items.length) agregarFila();
        setNow();
        if (form.empresa) await actualizarNumeroSolpePorEmpresa();
        asegurarContratoPermitido();
      } catch (e) {
        console.error("No se pudo aplicar el borrador:", e);
        addToast("danger", "No se pudo aplicar el borrador.");
      }
    };

    /* ======= Guardado local ======= */
    const LOCAL_PREF_KEY = "solped_local_enabled";
    const localSaveEnabled = ref(false);

    const perCompanyKey = computed(() => `solped_local_${uid.value || "anon"}_${form.empresa || "gen"}`);
    const lastKey       = computed(() => `solped_local_last_${uid.value || "anon"}`);

    const suppressLocalSave = ref(false);
    const runWithoutAutosave = async (fn) => {
      const prev = suppressLocalSave.value;
      suppressLocalSave.value = true;
      try { await fn(); } finally { suppressLocalSave.value = prev; }
    };

    let localTimer = null;

    const persistLocalSavePref = () => {
      try { localStorage.setItem(LOCAL_PREF_KEY, localSaveEnabled.value ? "1" : "0"); } catch(e) { console.error(e); }
      if (localSaveEnabled.value) {
        saveLocalNow();
        addToast("success", "Autosave activado.");
      } else {
        // Limpia claves más comunes para evitar que reaparezcan datos
        try {
          localStorage.removeItem(perCompanyKey.value);
          localStorage.removeItem(lastKey.value);
        } catch (e) { console.error(e); }
        addToast("success", "Autosave desactivado. No se guardará ni restaurará automáticamente.");
      }
    };


    const serializeForm = () => {
      const base = {
        ...form,
        // IMPORTANTE: nunca persistir numero_solpe si aún no hay empresa
        numero_solpe: form.empresa ? form.numero_solpe : null,
        savedEmpresa: form.empresa || "gen",
        updatedAt: Date.now(),
        items: form.items.map(it => ({
          id: it.id,
          descripcion: it.descripcion,
          codigo_referencial: it.codigo_referencial,
          cantidad: it.cantidad,
          stock: it.stock,
          numero_interno: it.numero_interno,
          imagen_url: it.imagen_url
        }))
      };
      return JSON.stringify(base);
    };

    const applySerialized = (raw) => {
      try {
        const data = JSON.parse(raw || "{}");

        // Solo aplica empresa si viene en el borrador
        if (data.empresa) form.empresa = data.empresa;

        // Nunca traigas número si no hay empresa
        form.numero_solpe = data.empresa ? (data.numero_solpe ?? null) : null;

        form.numero_contrato      = data.numero_contrato      || "";
        form.nombre_centro_costo  = data.nombre_centro_costo  || "";
        form.tipo_solped          = data.tipo_solped          || "";
        form.nombre_solped        = (data.nombre_solped || "").toUpperCase();
        form.dirigidoA            = Array.isArray(data.dirigidoA) ? data.dirigidoA : [];
        form.items = Array.isArray(data.items) && data.items.length
          ? data.items.map((it,i)=>({
              id: it.id ?? (i+1),
              descripcion: (it.descripcion || "").toUpperCase(),
              codigo_referencial: (it.codigo_referencial || "").toUpperCase(),
              cantidad: Number(it.cantidad || 0),
              stock: Number(it.stock || 0),
              numero_interno: (it.numero_interno || "").toUpperCase(),
              imagen_url: it.imagen_url || ""
            }))
          : [];
        if (!form.items.length) agregarFila();
        setNow();
        asegurarContratoPermitido();
      } catch (e) {
        console.error("No se pudo parsear borrador local:", e);
      }
    };

    const formHasContent = () => {
      const hasHeader =
        (form.empresa && form.empresa.trim() !== "") ||
        (form.nombre_solped && form.nombre_solped.trim() !== "") ||
        (form.tipo_solped && form.tipo_solped.trim() !== "") ||
        (form.numero_contrato && String(form.numero_contrato).trim() !== "") ||
        (Array.isArray(form.dirigidoA) && form.dirigidoA.length > 0);

      const hasItems = Array.isArray(form.items) && form.items.some(it =>
        (it?.descripcion && it.descripcion.trim() !== "") ||
        (it?.numero_interno && it.numero_interno.trim() !== "") ||
        Number(it?.cantidad || 0) > 0 ||
        Number(it?.stock || 0) > 0 ||
        (it?.codigo_referencial && it.codigo_referencial.trim() !== "") ||
        (it?.imagen_url && it.imagen_url.trim() !== "")
      );

      return hasHeader || hasItems;
    };

    const scheduleLocalSave = () => {
      if (!localSaveEnabled.value || suppressLocalSave.value) return;
      if (!formHasContent()) return;

      if (localTimer) clearTimeout(localTimer);
      localTimer = setTimeout(() => {
        try {
          const payload = serializeForm();
          localStorage.setItem(perCompanyKey.value, payload);
          localStorage.setItem(lastKey.value, payload);
        } catch (e) { console.warn("No se pudo guardar local:", e); }
      }, 400);
    };

    const saveLocalNow = () => {
      if (!localSaveEnabled.value) return; // <- clave
      try {
        const payload = serializeForm();
        localStorage.setItem(perCompanyKey.value, payload);
        localStorage.setItem(lastKey.value, payload);
        addToast("success", "Borrador local guardado.");
      } catch {
        addToast("danger", "No se pudo guardar localmente.");
      }
    };


    const loadLocalNow = async () => {
      // Permite restaurar manualmente aunque el autosave esté apagado:
      // NO hacemos early return. (Así el botón "Recuperar" funciona siempre)

      try {
        const uidNow = uid.value || "anon";
        const candidates = new Set();

        candidates.add(perCompanyKey.value);
        candidates.add(`solped_local_last_${uidNow}`);
        candidates.add(`solped_local_last_anon`);

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(`solped_local_${uidNow}_`)) candidates.add(k);
        }

        let bestRaw = null, bestTs = -1, bestEmpresa = null;
        for (const k of candidates) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          try {
            const data = JSON.parse(raw);
            const ts = Number(data?.updatedAt || 0);
            if (ts > bestTs) {
              bestTs = ts;
              bestRaw = raw;
              bestEmpresa = data?.savedEmpresa || data?.empresa || null;
            }
          } catch { /* ignore */ }
        }

        if (!bestRaw) { addToast("danger","No hay borrador local para recuperar."); return; }

        await runWithoutAutosave(async () => {
          // Asegura empresa ANTES de refrescar número
          if (!form.empresa && bestEmpresa) form.empresa = bestEmpresa;
          applySerialized(bestRaw);
          if (form.empresa) await actualizarNumeroSolpePorEmpresa();
          // Solo re-graba si el autosave está encendido
          if (localSaveEnabled.value) saveLocalNow();
        });

        addToast("success","Borrador local recuperado.");
      } catch (e) {
        console.error(e);
        addToast("danger","No se pudo recuperar el borrador local.");
      }
    };

    const clearLocalNow = async () => {
      try {
        await runWithoutAutosave(async () => {
          localStorage.removeItem(perCompanyKey.value);
          localStorage.removeItem(lastKey.value);
        });
        addToast("success","Borrador local limpiado.");
      } catch { /* noop */ }
    };

    // Autosave (si está encendido) ante cambios
    watch(form, () => scheduleLocalSave(), { deep: true });
    watch(uid,  () => scheduleLocalSave());
    watch(() => form.empresa, (val) => {
      if (!val) {
        form.numero_solpe = null; // limpia si quita empresa
      }
    });



    /* ===== Sugerencias ===== */
    const onDescInput = (i) => {
      focusRow.value = i;
      clearTimeout(timers[i]);
      timers[i] = setTimeout(() => fetchSuggest(i), 250);
      form.items[i].descripcion = (form.items[i].descripcion || "").toUpperCase();
    };
    const fetchSuggest = async (i) => {
      const raw = form.items[i]?.descripcion || "";
      const normPrefix = normalize(raw);
      if (!normPrefix || normPrefix.length < 2) { suggests[i] = []; return; }
      try {
        const qy = query(
          collection(db, "items_catalog"),
          orderBy("norm"),
          startAt(normPrefix),
          endAt(normPrefix + "\uf8ff"),
          limit(6)
        );
        const snap = await getDocs(qy);
        suggests[i] = snap.docs.map(d => d.data()?.original || d.id);
      } catch (e) {
        console.warn("fallback suggests:", e);
        suggests[i] = [];
      }
    };
    const onDescBlur = (i) => {
      setTimeout(() => { focusRow.value = -1; suggests[i] = []; }, 200);
    };
    const aplicarSugerencia = (i, texto) => {
      form.items[i].descripcion = (texto || "").toUpperCase();
      suggests[i] = []; focusRow.value = -1;
    };

    /* ===== Drag & drop handlers (Adjuntos múltiples) ===== */
    const onDragOver = (ev) => {
      if (!form.empresa) return;
      isDragging.value = true;
      try { ev.dataTransfer.dropEffect = "copy"; } catch(e) { console.warn("Error setting dropEffect:", e); }
    };
    const onDragLeave = () => { isDragging.value = false; };

    const gatherFilesFromItems = async (items) => {
      const out = [];
      const readers = items
        .map((it) => (typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null))
        .filter(Boolean)
        .map((entry) => traverseFileTree(entry));
      if (!readers.length) return out;
      const chunks = await Promise.all(readers);
      for (const arr of chunks) out.push(...arr);
      return out;
    };

    const traverseFileTree = (entry, path = "") =>
      new Promise((resolve) => {
        const results = [];
        if (!entry) return resolve(results);

        if (entry.isFile) {
          entry.file((file) => {
            const rel = path ? `${path}/${file.name}` : file.name;
            try { Object.defineProperty(file, "_relativePath", { value: rel, enumerable: false }); } catch(e) { console.error(e) }
            results.push(file);
            resolve(results);
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = [];
          const readEntries = () => {
            dirReader.readEntries(async (batch) => {
              if (!batch.length) {
                const subs = await Promise.all(entries.map((e) => traverseFileTree(e, path ? `${path}/${entry.name}` : entry.name)));
                resolve(subs.flat());
                return;
              }
              entries.push(...batch);
              readEntries();
            });
          };
          readEntries();
        } else {
          resolve(results);
        }
      });

    const onDrop = async (ev) => {
      if (!form.empresa) return;
      isDragging.value = false;

      const dt = ev.dataTransfer;
      const items = Array.from(dt?.items || []);
      const filesFromItems = await gatherFilesFromItems(items);

      const plainFiles = Array.from(dt?.files || []);
      const all = filesFromItems.length ? filesFromItems : plainFiles;
      if (!all.length) return;

      await handleFiles(all);
    };

    const subirAdjuntos = async (ev) => {
      const files = Array.from(ev?.target?.files || []);
      ev.target.value = "";
      if (!files.length) return;
      await handleFiles(files);
    };

    const subirCarpeta = async (ev) => {
      const files = Array.from(ev?.target?.files || []);
      ev.target.value = "";
      if (!files.length) return;
      await handleFiles(files);
    };

    const updateGlobalProgress = () => {
      if (!perFileProgress.value.length) { totalProgress.value = 0; return; }
      const sum = perFileProgress.value.reduce((a,b)=> a + (b||0), 0);
      totalProgress.value = Math.round(sum / perFileProgress.value.length);
    };

    const inferTipo = (filename = "") => {
      const ext = filename.split(".").pop()?.toLowerCase();
      const map = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg:"image/jpeg",
        png: "image/png",
        xls: "application/vnd.ms-excel",
        xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
        zip: "application/zip",
        rar: "application/x-rar-compressed"
      };
      return map[ext] || "application/octet-stream";
    };

    const handleFiles = async (files) => {
      try {
        if (form.autorizaciones.length + files.length > MAX_FILES) {
          addToast("danger", `Máximo ${MAX_FILES} archivos.`);
          return;
        }

        const currentTotal = (form.autorizaciones || []).reduce((a,b)=> a + (b.tamano || 0), 0) / 1024 / 1024;
        const newTotal = files.reduce((a,f)=> a + f.size, 0) / 1024 / 1024;
        if (currentTotal + newTotal > MAX_TOTAL_MB) {
          addToast("danger", `Supera el total permitido (${MAX_TOTAL_MB} MB).`);
          return;
        }

        const bad = files.filter(f => !ALLOWED_EXTS.has((f.name.split(".").pop() || "").toLowerCase()));
        if (bad.length) {
          addToast("danger", `Formato no permitido: ${bad.map(b=>b.name).join(", ")}`);
          return;
        }

        uploadingAdjuntos.value = true;
        uploadTotal.value = files.length;
        uploadedCount.value = 0;
        perFileProgress.value = files.map(()=>0);
        totalProgress.value = 0;

        const sanitizeSeg = (s) => (s || "")
          .replace(/[^\w\-.]+/g, "_")
          .replace(/^_+|_+$/g, "");

        for (let idx = 0; idx < files.length; idx++) {
          const file = files[idx];
          const sizeMB = file.size / 1024 / 1024;
          if (sizeMB > MAX_SIZE_MB) {
            addToast("danger", `“${file.name}” supera ${MAX_SIZE_MB} MB.`);
            perFileProgress.value[idx] = 100;
            updateGlobalProgress();
            continue;
          }

          const rawRel =
            (file.webkitRelativePath && file.webkitRelativePath.replace(/^\/+/, "")) ||
            (file._relativePath && String(file._relativePath).replace(/^\/+/, "")) ||
            file.name;

          const safeRel = rawRel
            .split("/")
            .map(sanitizeSeg)
            .filter(Boolean)
            .join("/");

          const safeEmpresa = (form.empresa || "gen").replace(/\s+/g, "_");
          const safeNum = String(form.numero_solpe || "temp");
          const timestamp = Date.now();

          const path = `solped_adjuntos/${safeEmpresa}_${safeNum}/${timestamp}/${safeRel}`;
          const r = sRef(storage, path);

          const task = uploadBytesResumable(r, file);

          await new Promise((resolve, reject) => {
            task.on("state_changed",
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                perFileProgress.value[idx] = pct;
                updateGlobalProgress();
              },
              (err) => reject(err),
              async () => {
                try {
                  const url = await getDownloadURL(task.snapshot.ref);
                  form.autorizaciones.push({
                    nombre: file.name,
                    url,
                    tipo: file.type || inferTipo(file.name),
                    tamano: file.size
                  });

                  uploadedCount.value += 1;
                  perFileProgress.value[idx] = 100;
                  updateGlobalProgress();
                  resolve();
                } catch (e) { reject(e); }
              }
            );
          });
        }

        addToast("success", "Adjuntos subidos correctamente.");
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudieron subir uno o más adjuntos.");
      } finally {
        uploadingAdjuntos.value = false;
        totalProgress.value = 0;
        perFileProgress.value = [];
      }
    };

    const eliminarAdjunto = (idx) => {
      form.autorizaciones.splice(idx, 1);
      addToast("success", "Adjunto eliminado.");
    };

    const limpiarAdjuntos = () => {
      form.autorizaciones = [];
      addToast("success", "Se limpiaron los adjuntos.");
    };

    /* ===== Ítems ===== */
    const agregarFila = () => {
      const nid = form.items.length ? form.items[form.items.length - 1].id + 1 : 1;
      form.items.push({
        id: nid,
        descripcion: "",
        codigo_referencial: "",
        cantidad: null,
        stock: null,
        numero_interno: "",
        imagen_url: ""
      });
    };
    const eliminarFila = (idx) => {
      form.items.splice(idx, 1);
      addToast("success", "Fila eliminada.");
    };
    const guardarFila = (idx) => {
      focusRow.value = -1;
      suggests[idx] = [];
      addToast("success", `Fila #${idx+1} guardada.`);
    };
    const onNumeroInternoBlur = (i) => {
      const isLast = i === form.items.length - 1;
      const it = form.items[i];
      const filaCompleta = (it?.descripcion?.trim()?.length || 0) > 0 &&
                           (it?.numero_interno?.trim()?.length || 0) > 0;
      if (isLast && filaCompleta) agregarFila();
    };

    /* ======= Anticolisión ======= */
    const seedCounterIfNeeded = async (empresa) => {
      const ctrRef = doc(db, "solpe_counters", empresa);
      const snap = await getDoc(ctrRef);
      if (snap.exists()) return;
      const qy = query(
        collection(db, "solpes"),
        where("empresa","==", empresa),
        orderBy("numero_solpe","desc"),
        limit(1)
      );
      const last = await getDocs(qy);
      const start = last.empty ? 1 : (Number(last.docs[0].data()?.numero_solpe) || 0) + 1;
      await setDoc(ctrRef, { next: start }, { merge: true });
    };

    const getNextNumeroTransaccional = async (empresa) => {
      const ctrRef = doc(db, "solpe_counters", empresa);
      await seedCounterIfNeeded(empresa);
      const numero = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ctrRef);
        const curr = (snap.exists() && Number(snap.data().next)) || 1;
        tx.set(ctrRef, { next: curr + 1 }, { merge: true });
        return curr;
      });
      return numero;
    };

    /* ===== Validaciones ===== */
    const asegurarContratoPermitido = () => {
      const code = String(form.numero_contrato || "");
      const set = new Set(centrosAsignados.value || []);
      if (!code || !set.has(code)) {
        form.numero_contrato = "";
        form.nombre_centro_costo = "";
      }
    };

    const validarAntesDeGuardar = () => {
      if (!Array.isArray(centrosAsignados.value) || centrosAsignados.value.length === 0) {
        return "Tu usuario no tiene contratos asignados. Contacta a un administrador.";
      }
      if (!form.empresa) return "Debes seleccionar la Empresa.";
      if (!form.numero_contrato) return "Debes seleccionar un Centro de Costo.";
      if (!form.nombre_centro_costo) return "Error interno: no se pudo resolver el nombre del Centro de Costo.";
      if (!form.nombre_solped?.trim()) return "Debes ingresar el nombre de la SOLPED.";
      if (!form.tipo_solped) return "Debes seleccionar el tipo de SOLPED.";
      if (!form.dirigidoA?.length) return "Debes seleccionar al menos un cotizador.";
      if (!form.items?.length) return "Debes agregar al menos un ítem.";
      for (const it of form.items) {
        if (!it.descripcion?.trim() || !it.numero_interno?.trim()) {
          return "Cada ítem debe tener Descripción y N° Interno/Patente.";
        }
      }
      return "";
    };

    /* ===== Envío ===== */
    const guardarSolped = async () => {
      error.value = ""; okMsg.value = "";
      const msg = validarAntesDeGuardar(); if (msg) { error.value = msg; addToast("danger", msg); return; }

      try {
        enviandoSolpe.value = true; setNow();

        const numeroAsignado = await getNextNumeroTransaccional(form.empresa);

        let numeroFinal = numeroAsignado;
        const dupCheck = async (num) => {
          const qDup = query(
            collection(db,"solpes"),
            where("empresa","==", form.empresa),
            where("numero_solpe","==", num),
            limit(1)
          );
          const s = await getDocs(qDup);
          return !s.empty;
        };
        if (await dupCheck(numeroFinal)) {
          numeroFinal = await getNextNumeroTransaccional(form.empresa);
        }
        form.numero_solpe = numeroFinal;

        const payload = {
          numero_solpe: numeroFinal,
          empresa: form.empresa,
          fecha: form.fecha,
          fecha_str: new Date(),
          nombre_solped: (form.nombre_solped || "").toUpperCase(),
          tipo_solped: form.tipo_solped,
          dirigidoA: form.dirigidoA,
          numero_contrato: form.numero_contrato,
          nombre_centro_costo: form.nombre_centro_costo || "",
          usuario: usuarioNombre.value || "",
          estatus: form.estatus || "Pendiente",
          autorizaciones: (form.autorizaciones || []).map(a => ({
            nombre: a.nombre,
            url: a.url,
            tipo: a.tipo || null,
            tamano: a.tamano || null
          })),
          createdAt: serverTimestamp(),
          items: form.items.map((it, idx) => ({
            item: idx + 1,
            descripcion: (it.descripcion || "").toUpperCase(),
            codigo_referencial: (it.codigo_referencial || "SIN CÓDIGO").toUpperCase(),
            cantidad: Number(it.cantidad || 0),
            stock: Number(it.stock || 0),
            numero_interno: (it.numero_interno || "SIN PATENTE").toUpperCase(),
            imagen_url: it.imagen_url || null,
            estado: "pendiente",
          })),
        };

        const docRef = await addDoc(collection(db, "solpes"), payload);

        await addDoc(collection(docRef, "historialEstados"), {
          fecha: serverTimestamp(),
          usuario: usuarioNombre.value || "",
          estatus: "Pendiente",
          comentario: "Creación de SOLPED"
        });

        await updateDoc(docRef, {
          historialEstados: arrayUnion({
            fecha: Timestamp.now(),
            usuario: usuarioNombre.value || "",
            estatus: "Pendiente",
            comentario: "Creación de SOLPED"
          })
        });

        for (const it of form.items) {
          const original = (it.descripcion || "").trim();
          const norm = normalize(original);
          if (!norm || norm.length < 2) continue;
          const id = toDocId(norm);
          const refd = doc(db, "items_catalog", id);
          const snap = await getDoc(refd);
          if (!snap.exists()) {
            await setDoc(refd, {
              original: original,
              norm,
              usos: 1,
              primera_vez: new Date(),
              ultima_vez: new Date(),
              empresas: form.empresa ? [form.empresa] : []
            });
          } else {
            await setDoc(refd, {
              original: snap.data()?.original || original,
              norm,
              usos: increment(1),
              ultima_vez: new Date(),
              empresas: arrayUnion(form.empresa)
            }, { merge: true });
          }
        }

        okMsg.value = `SOLPED #${numeroFinal} guardada con éxito.`;
        addToast("success", "SOLPED enviada correctamente.");

        await clearLocalNow();

        await runWithoutAutosave(async () => {
          await resetForm(true);
          await actualizarNumeroSolpePorEmpresa();
        });

      } catch (e) {
        console.error(e);
        const m = "Error al guardar la SOLPED.";
        error.value = m;
        addToast("danger", m);
      } finally {
        enviandoSolpe.value = false;
      }
    };

    const resetForm = async (keepEmpresa = true) => {
      const empresaHold = form.empresa;
      form.numero_solpe = null;
      form.fecha = nowLocal();
      form.nombre_solped = "";
      form.tipo_solped = "";
      form.dirigidoA = [];
      form.numero_contrato = "";
      form.nombre_centro_costo = "";
      form.autorizaciones = [];
      form.items = [];
      requiereAutorizacion.value = false;

      Object.keys(suggests).forEach(k => { delete suggests[k]; });
      focusRow.value = -1;

      if (keepEmpresa) form.empresa = empresaHold;
      else form.empresa = "";

      if (!form.items.length) agregarFila();
    };

    /* ===== Imagen por ítem: click o drag con progreso ===== */
    const subirImagenItem = async (ev, i) => {
      const file = ev?.target?.files?.[0]; if (!file) return;
      await subirImagenItemFile(file, i);
      ev.target.value = "";
    };

    async function subirImagenItemFile(file, i) {
      const row = getRowUpload(i);
      try {
        row.uploading = true;
        row.progress = 0;

        const safeName = (file.name || "img").replace(/[^\w\-.]+/g, "_");
        const name = `solped_${form.numero_solpe || "temp"}_${i}_${Date.now()}_${safeName}`;
        const path = `solped_images/${name}`;
        const r = sRef(storage, path);

        const task = uploadBytesResumable(r, file);
        await new Promise((resolve, reject) => {
          task.on("state_changed",
            (snap) => {
              row.progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            },
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              form.items[i].imagen_url = url;
              addToast("success", `Imagen del ítem #${i+1} subida.`);
              resolve();
            }
          );
        });
      } catch (e) {
        console.error(e);
        error.value = "Error al subir la imagen del ítem.";
        addToast("danger", `No se pudo subir la imagen del ítem #${i+1}.`);
      } finally {
        row.uploading = false;
        setTimeout(() => (row.progress = 0), 400);
      }
    }

    // Eliminar imagen item
    function eliminarImagenItem(i) {
      if (form.items[i]) form.items[i].imagen_url = "";
      const row = getRowUpload(i);
      if (row) { row.uploading = false; row.progress = 0; row.dragover = false; }
      addToast("success", `Imagen del ítem #${i+1} eliminada.`);
    }

    // Save “último snap” al cerrar/recargar pestaña
    const beforeUnload = (e) => { console.error(e);
      if (!localSaveEnabled.value) return; // <- respeta el switch
      try {
        const payload = serializeForm();
        localStorage.setItem(perCompanyKey.value, payload);
        localStorage.setItem(lastKey.value, payload);
      } catch(e) { console.error("No se pudo guardar local al salir:", e); }
    };


    onMounted(async () => {
      setNow();
      try { localSaveEnabled.value = localStorage.getItem(LOCAL_PREF_KEY) === "1"; } catch(e) { console.error(e); }

      await loadUserFullName();

      // Borrador desde sessionStorage (respetando empresa)
      try {
        const raw = sessionStorage.getItem("solped_draft");
        if (raw) {
          const draft = JSON.parse(raw);
          await runWithoutAutosave(async () => { await applyDraft(draft); });
          sessionStorage.removeItem("solped_draft");
        }
      } catch (e) { console.warn("Borrador inválido:", e); }

      // ⬇️ Solo auto-recupera si el autosave está encendido
      if (localSaveEnabled.value) {
        await loadLocalNow();
      }

      if (form.empresa) await actualizarNumeroSolpePorEmpresa();
      if (!form.items.length) agregarFila();
      asegurarContratoPermitido();

      window.addEventListener("beforeunload", beforeUnload);
    });


    onUnmounted(() => {
      window.removeEventListener("beforeunload", beforeUnload);
    });

    return {
      // estado / data
      form, requiereAutorizacion, inputImagenRefs,
      error, okMsg, enviandoSolpe, loadingNumero,
      usuarioNombre, cotizadoresFiltrados, centrosCosto, centrosDisponibles,
      suggests, focusRow,
      localSaveEnabled,

      // drag & drop / upload state (adjuntos)
      isDragging, uploadingAdjuntos, totalProgress, uploadTotal, uploadedCount,

      // límites adjuntos
      MAX_FILES, MAX_SIZE_MB, MAX_TOTAL_MB,

      // toasts
      toasts, addToast, closeToast,

      // acciones generales
      onEmpresaChange, onCentroCosto,
      saveLocalNow, loadLocalNow, clearLocalNow, persistLocalSavePref,

      // items
      agregarFila, eliminarFila, guardarFila,
      onNumeroInternoBlur, onDescInput, aplicarSugerencia, onDescBlur,

      // archivos adjuntos
      subirAdjuntos, subirCarpeta, eliminarAdjunto, limpiarAdjuntos,
      onDragOver, onDragLeave, onDrop,

      // imágenes por ítem
      subirImagenItem, getRowUpload, onImgDragOver, onImgDragLeave, onImgDrop,

      // final
      guardarSolped, irHistorial, eliminarImagenItem,
    };
  },
};
</script>


<style scoped>
/* ----- Layout general ----- */
.solped-page{ min-height:100vh; }

/* Header responsivo */
.page-head{
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
}
.page-head__left{ min-width:0; }
.page-head__right{ display:flex; align-items:center; gap:10px; }

/* ----- Card estilo ----- */
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
}

/* Dropzone (adjuntos múltiples) */
.dropzone{
  position: relative;
  cursor:pointer; display:flex; align-items:center; gap:.75rem;
  border:1px dashed #cbd5e1; border-radius:.6rem;
  padding:1rem 1.1rem; color:#475569; background:#fff;
  transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.dropzone .btn{ white-space: nowrap; }
.dropzone:hover{ background:#f1f5f9; }
.dropzone.is-dragover{
  border-color:#60a5fa; background:#eff6ff;
  box-shadow: 0 0 0 3px rgba(59,130,246,.15);
}
.dz-text{ line-height:1.1; }

/* Overlay de carga (adjuntos múltiples) */
.dz-loading{
  position:absolute; inset:0; background: rgba(255,255,255,.8);
  display:flex; align-items:center; justify-content:center;
  border-radius:.6rem;
}
:global(html.theme-dark) .dz-loading{ background: rgba(17,24,39,.75); }
.dz-loading-box{
  display:flex; align-items:center; gap:.6rem; width:100%;
  max-width:520px; padding:.6rem .8rem; border-radius:.6rem;
  background: rgba(255,255,255,.9);
  box-shadow: 0 10px 24px rgba(0,0,0,.15);
}
:global(html.theme-dark) .dz-loading-box{
  background: rgba(31,41,55,.9); color:#e5e7eb;
}

.file-pill {
  padding: .4rem .6rem;
  border-radius: .6rem;
}

/* Tabla / inputs */
.table td, .table th{ vertical-align:middle; }
.thumb{ width:40px; height:40px; object-fit:cover; border-radius:4px; }

/* Sugerencias debajo del input */
.suggest-popover{
  position:absolute; z-index:2000; left:0; right:0; top:100%;
  margin-top:4px; box-shadow: 0 12px 28px rgba(0,0,0,.18);
  border:1px solid #e5e7eb; border-radius:.5rem; overflow:hidden;
  max-height: 240px; overflow-y: auto; background:#fff;
}

/* TOASTS */
.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1080;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem;
  border-radius: .5rem; color: #fff; min-width: 260px; max-width: 360px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* Permitir que el popover sobresalga del contenedor */
:deep(.card .table-responsive){ overflow: visible !important; }
:deep(table), :deep(tbody), :deep(tr), :deep(td){ overflow: visible !important; }

/* =====================  RESPONSIVE  ===================== */
@media (max-width: 768px){
  .page-head{ align-items:flex-start; }

  .responsive-stack thead{ display:none; }
  .responsive-stack,
  .responsive-stack tbody,
  .responsive-stack tr,
  .responsive-stack td{ display:block; width:100%; }

  .responsive-stack tr{
    background: var(--card-bg, #ffffff);
    border:1px solid var(--card-border, #e5e7eb);
    border-radius:12px;
    padding:10px 10px 6px;
    margin:10px 0;
    box-shadow: 0 6px 16px rgba(0,0,0,.06);
  }

  .responsive-stack td{
    border:none !important;
    padding:8px 6px !important;
  }

  .responsive-stack td[data-label]::before{
    content: attr(data-label);
    display:block;
    font-weight:600;
    font-size:.82rem;
    color:#6b7280;
    margin-bottom:4px;
  }

  .responsive-stack td [class*="btn-group"]{
    width:100%; justify-content:flex-end; gap:6px; flex-wrap:nowrap;
  }

  .suggest-popover{
    position:relative;
    box-shadow: 0 10px 24px rgba(0,0,0,.18);
  }
}

/* 2) Modo oscuro */
:global(html.theme-dark) .card-elevated{
  border-color: rgba(255,255,255,.08) !important;
  background: #111827 !important;
}
:global(html.theme-dark) .dropzone{
  background:#0f172a; color:#e5e7eb; border-color: rgba(255,255,255,.16);
}
:global(html.theme-dark) .dropzone:hover{ background:#0b1220; }
:global(html.theme-dark) .dropzone.is-dragover{
  border-color:#60a5fa; background:#0b1220;
  box-shadow: 0 0 0 3px rgba(59,130,246,.25);
}
:global(html.theme-dark) .responsive-stack tr{
  --card-bg:#111827; --card-border:rgba(255,255,255,.08);
  color:#e5e7eb;
}
:global(html.theme-dark) .responsive-stack td[data-label]::before{
  color:#9ca3af;
}
:global(html.theme-dark) .suggest-popover{
  background:#0b1220; border-color: rgba(255,255,255,.12);
}
:global(html.theme-dark) .list-group-item{
  background:transparent; color:#e5e7eb; border-color: rgba(255,255,255,.08);
}

/* Dropzone de imagen por fila */
.img-drop{
  position: relative;
  display:flex;
  align-items:center;
  gap:.5rem;
  border:1px dashed #cbd5e1;
  border-radius:.5rem;
  padding:.4rem .6rem;
  min-height:48px;
  background:#fff;
  cursor:pointer;
  transition: background .15s, border-color .15s, box-shadow .15s;
}
.img-drop:hover{ background:#f8fafc; }
.img-drop.is-dragover{
  border-color:#60a5fa; background:#eff6ff;
  box-shadow: 0 0 0 3px rgba(59,130,246,.15);
}
.img-drop.is-loading{ pointer-events:none; }
.img-loading{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  background: rgba(255,255,255,.85); border-radius:.5rem;
}
.img-loading-box{
  display:flex; align-items:center; gap:.6rem; width:100%;
  max-width:420px; padding:.5rem .7rem; border-radius:.5rem;
  background:#fff; box-shadow: 0 8px 20px rgba(0,0,0,.12);
}
:global(html.theme-dark) .img-drop{
  background:#0f172a; color:#e5e7eb; border-color: rgba(255,255,255,.16);
}
:global(html.theme-dark) .img-drop:hover{ background:#0b1220; }
:global(html.theme-dark) .img-drop.is-dragover{
  border-color:#60a5fa; background:#0b1220;
  box-shadow: 0 0 0 3px rgba(59,130,246,.25);
}
:global(html.theme-dark) .img-loading{
  background: rgba(17,24,39,.8);
}
:global(html.theme-dark) .img-loading-box{
  background: rgba(31,41,55,.95); color:#e5e7eb;
}
</style>
