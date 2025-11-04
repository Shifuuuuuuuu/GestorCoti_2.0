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
              <button class="btn btn-outline-secondary" @click="saveLocalNow" :disabled="!localSaveEnabled">
                Guardar ahora
              </button>
              <button class="btn btn-outline-primary" @click="loadLocalNow">
                Recuperar
              </button>
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
                <input type="number" class="form-control" v-model="form.numero_solpe" readonly />
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

            <!-- Autorización -->
            <div class="col-12">
              <div class="form-check mb-2">
                <input id="chkAuth" class="form-check-input" type="checkbox" v-model="requiereAutorizacion" />
                <label class="form-check-label" for="chkAuth">Subir archivo adicional (opcional)</label>
              </div>

              <div v-if="requiereAutorizacion" class="dropzone" @click="$refs.inputAuth.click()">
                <i class="bi bi-cloud-arrow-up me-2 fs-5"></i>
                <div class="dz-text">
                  <strong>Subir Archivo</strong>
                  <div class="small text-secondary">PDF, JPG/PNG, XLS/XLSX, CSV</div>
                </div>
                <input
                  ref="inputAuth"
                  type="file"
                  class="d-none"
                  accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv"
                  @change="subirAutorizacion"
                />
              </div>

              <div v-if="form.autorizacion_nombre" class="file-pill alert alert-light d-flex align-items-center mt-2 mb-0">
                <i class="bi bi-paperclip me-2"></i>
                <div class="me-auto">{{ form.autorizacion_nombre }}</div>
                <button class="btn btn-sm btn-outline-danger" @click="eliminarAutorizacion" title="Eliminar">
                  <i class="bi bi-trash"></i>
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
                  <th style="width:120px;">Imagen</th>
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

                  <td :data-label="'Imagen'">
                    <input :ref="el => inputImagenRefs[i] = el" type="file" class="d-none" accept="image/*" @change="(e) => subirImagenItem(e, i)" />
                    <div v-if="item.imagen_url" class="d-flex align-items-center gap-2 flex-wrap">
                      <img :src="item.imagen_url" alt="img" class="thumb" />
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" @click="() => inputImagenRefs[i]?.click()" title="Cambiar imagen">
                          <i class="bi bi-image"></i>
                        </button>
                        <button class="btn btn-outline-danger" @click="eliminarImagenItem(i)" title="Eliminar imagen">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div v-else>
                      <button class="btn btn-sm btn-outline-secondary" @click="() => inputImagenRefs[i]?.click()" title="Subir imagen">
                        <i class="bi bi-image"></i>
                      </button>
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import { db, storage } from "../stores/firebase";
import {
  collection, addDoc, serverTimestamp, query, where,
  orderBy, limit, getDocs, setDoc, doc, increment, arrayUnion, getDoc,
  startAt, endAt, runTransaction
} from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
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
      autorizacion_url: null,
      autorizacion_nombre: null,
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
        form.numero_solpe = form.numero_solpe || 1;
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
      try { localStorage.setItem(LOCAL_PREF_KEY, localSaveEnabled.value ? "1" : "0"); } catch(e) {console.error(e)}
      if (localSaveEnabled.value) saveLocalNow();
    };

    const serializeForm = () => JSON.stringify({
      ...form,
      items: form.items.map(it => ({
        id: it.id,
        descripcion: it.descripcion,
        codigo_referencial: it.codigo_referencial,
        cantidad: it.cantidad,
        stock: it.stock,
        numero_interno: it.numero_interno,
        imagen_url: it.imagen_url
      }))
    });

    const applySerialized = (raw) => {
      try {
        const data = JSON.parse(raw || "{}");
        if (data.empresa) form.empresa = data.empresa;
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
      try {
        const raw = localStorage.getItem(perCompanyKey.value) || localStorage.getItem(lastKey.value);
        if (!raw) { addToast("danger","No hay borrador local para recuperar."); return; }
        await runWithoutAutosave(async () => {
          applySerialized(raw);
          if (form.empresa) await actualizarNumeroSolpePorEmpresa();
        });
        addToast("success","Borrador local recuperado.");
      } catch {
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

    watch(form, () => scheduleLocalSave(), { deep: true });
    watch(uid,  () => scheduleLocalSave());
    watch(() => form.empresa, () => scheduleLocalSave());

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

    /* ===== Archivos ===== */
    const subirAutorizacion = async (ev) => {
      const file = ev?.target?.files?.[0]; if (!file) return;
      try {
        const name = `autorizacion_${form.empresa || "gen"}_${form.numero_solpe || "temp"}_${Date.now()}_${file.name}`;
        const path = `solped_autorizaciones/${name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, file);
        form.autorizacion_url = await getDownloadURL(r);
        form.autorizacion_nombre = file.name;
        addToast("success", "Autorización subida correctamente.");
      } catch {
        error.value = "Error al subir autorización.";
        addToast("danger", "No se pudo subir la autorización.");
      } finally { ev.target.value = ""; }
    };
    const eliminarAutorizacion = () => {
      form.autorizacion_url = null;
      form.autorizacion_nombre = null;
      addToast("success", "Autorización eliminada.");
    };

    const subirImagenItem = async (ev, i) => {
      const file = ev?.target?.files?.[0]; if (!file) return;
      try {
        const name = `solped_${form.numero_solpe || "temp"}_${i}_${Date.now()}_${file.name}`;
        const path = `solped_images/${name}`;
        const r = sRef(storage, path);
        await uploadBytes(r, file);
        form.items[i].imagen_url = await getDownloadURL(r);
        addToast("success", `Imagen del ítem #${i+1} subida.`);
      } catch {
        error.value = "Error al subir la imagen del ítem.";
        addToast("danger", `No se pudo subir la imagen del ítem #${i+1}.`);
      } finally { ev.target.value = ""; }
    };
    const eliminarImagenItem = (i) => {
      form.items[i].imagen_url = "";
      addToast("success", `Imagen del ítem #${i+1} eliminada.`);
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
          autorizacion_url: form.autorizacion_url || null,
          autorizacion_nombre: form.autorizacion_nombre || null,
          createdAt: serverTimestamp(),
          items: form.items.map((it, idx) => ({
            item: idx + 1,
            descripcion: (it.descripcion || "").toUpperCase(),
            codigo_referencial: (it.codigo_referencial || "SIN CÓDIGO").toUpperCase(),
            cantidad: Number(it.cantidad || 0),
            stock: Number(it.stock || 0),
            numero_interno: (it.numero_interno || "SÍN PATENTE").toUpperCase(),
            imagen_url: it.imagen_url || null,
            estado: "pendiente",
          })),
        };

        await addDoc(collection(db, "solpes"), payload);

        // Catalogo de items
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
      form.autorizacion_url = null;
      form.autorizacion_nombre = null;
      form.items = [];
      requiereAutorizacion.value = false;
      suggests.value = {};
      focusRow.value = -1;
      if (keepEmpresa) form.empresa = empresaHold;
      else form.empresa = "";
      if (!form.items.length) agregarFila();
    };

    onMounted(async () => {
      setNow();
      try { localSaveEnabled.value = localStorage.getItem(LOCAL_PREF_KEY) === "1"; } catch(e) {console.error(e)}

      await loadUserFullName();

      try {
        const raw = sessionStorage.getItem("solped_draft");
        if (raw) {
          const draft = JSON.parse(raw);
          await runWithoutAutosave(async () => {
            await applyDraft(draft);
          });
          sessionStorage.removeItem("solped_draft");
        }
      } catch (e) { console.warn("Borrador inválido:", e); }

      try {
        const rawLocal = localStorage.getItem(perCompanyKey.value) || localStorage.getItem(lastKey.value);
        if (rawLocal) {
          await runWithoutAutosave(async () => {
            applySerialized(rawLocal);
            if (form.empresa) await actualizarNumeroSolpePorEmpresa();
          });
          addToast("success","Se recuperó un borrador local.");
        }
      } catch {/* noop */}

      if (form.empresa) await actualizarNumeroSolpePorEmpresa();
      if (!form.items.length) agregarFila();
      asegurarContratoPermitido();
    });

    return {
      form, requiereAutorizacion, inputImagenRefs,
      error, okMsg, enviandoSolpe, loadingNumero,
      usuarioNombre, cotizadoresFiltrados, centrosCosto, centrosDisponibles,
      suggests, focusRow,
      localSaveEnabled, saveLocalNow, loadLocalNow, clearLocalNow, persistLocalSavePref,
      toasts, addToast, closeToast,
      onEmpresaChange, onCentroCosto,
      agregarFila, eliminarFila, guardarFila,
      onNumeroInternoBlur, onDescInput, aplicarSugerencia, onDescBlur,
      guardarSolped,
      subirAutorizacion, eliminarAutorizacion,
      subirImagenItem, eliminarImagenItem,
      irHistorial,
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

/* Dropzone */
.dropzone{
  cursor:pointer; display:flex; align-items:center; gap:.75rem;
  border:1px dashed #cbd5e1; border-radius:.6rem;
  padding:1rem 1.1rem; color:#475569; background:#fff;
}
.dropzone:hover{ background:#f1f5f9; }
.dz-text{ line-height:1.1; }

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
/* 1) Ajustes XS/SM: la tabla se convierte en “cards” por fila */
@media (max-width: 768px){
  .page-head{ align-items:flex-start; }

  /* hace scroll horizontal solo si es necesario en otras tablas,
     pero en esta la convertimos en bloques */
  .responsive-stack thead{
    display:none;
  }
  .responsive-stack,
  .responsive-stack tbody,
  .responsive-stack tr,
  .responsive-stack td{
    display:block; width:100%;
  }

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

  /* Etiqueta del campo */
  .responsive-stack td[data-label]::before{
    content: attr(data-label);
    display:block;
    font-weight:600;
    font-size:.82rem;
    color:#6b7280;
    margin-bottom:4px;
  }

  /* Botoneras a ancho completo si hace falta */
  .responsive-stack td [class*="btn-group"]{
    width:100%; justify-content:flex-end; gap:6px; flex-wrap:nowrap;
  }

  /* Sugerencias: no cortar en móvil */
  .suggest-popover{
    position:relative;
    box-shadow: 0 10px 24px rgba(0,0,0,.18);
  }
}

/* 2) Modo oscuro: superficies coherentes con tu theme */
:global(html.theme-dark) .card-elevated{
  border-color: rgba(255,255,255,.08) !important;
  background: #111827 !important;
}
:global(html.theme-dark) .dropzone{
  background:#0f172a; color:#e5e7eb; border-color: rgba(255,255,255,.16);
}
:global(html.theme-dark) .dropzone:hover{ background:#0b1220; }
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
</style>
