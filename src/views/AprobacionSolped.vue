<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-solped-page">
    <div class="container py-4 py-md-5">
      <!-- HEADER -->
      <div class="page-top mb-4">
        <div>
          <h1 class="h4 fw-semibold mb-1">Aprobación de SOLPED</h1>
          <p class="text-secondary mb-0">
            Revisión y aprobación de SOLPED de plantas.
          </p>
        </div>

        <div class="page-actions">
          <button
            class="btn btn-outline-dark"
            @click="showFiltros = !showFiltros"
          >
            <i class="bi me-1" :class="showFiltros ? 'bi-funnel-fill' : 'bi-funnel'"></i>
            {{ showFiltros ? "Ocultar filtros" : "Filtros" }}
          </button>

          <button class="btn btn-outline-secondary" @click="cargarSolpeds">
            <i class="bi bi-arrow-clockwise me-1"></i> Recargar
          </button>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger d-flex align-items-center mb-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>{{ error }}</div>
      </div>

      <!-- FILTROS -->
      <transition name="fade-slide">
        <div v-if="showFiltros" class="card shadow-sm border-0 mb-4 filter-card">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label">Buscar</label>
                <input
                  v-model="busqueda"
                  class="form-control"
                  placeholder="Número, nombre, usuario, centro de costo..."
                />
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Estado aprobación</label>
                <select class="form-select" v-model="estadoFiltro">
                  <option value="">— Todos —</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Solped Aprobada">Aprobado</option>
                  <option value="Solped Rechazada">Rechazado</option>
                </select>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Prioridad SOLPED</label>
                <select class="form-select" v-model="prioridadFiltro">
                  <option value="">— Todas —</option>
                  <option value="ALTA">ALTA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="BAJA">BAJA</option>
                </select>
              </div>

              <div class="col-12 col-md-2 d-flex align-items-end">
                <button class="btn btn-outline-dark w-100" @click="limpiarFiltros">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div v-if="cargando" class="text-center py-5">
        <div class="spinner-border"></div>
        <div class="small text-secondary mt-2">Cargando SOLPED...</div>
      </div>

      <div v-else>
        <div v-if="filtradas.length === 0" class="card shadow-sm border-0 empty-card">
          <div class="card-body text-center text-secondary py-5">
            No hay SOLPED disponibles para aprobación.
          </div>
        </div>

        <div v-else class="d-flex flex-column gap-3">
          <div
            v-for="solpe in filtradas"
            :key="solpe.id"
            class="card shadow-sm border-0 solpe-card"
          >
            <!-- HEADER CARD -->
            <div class="card-header bg-white solpe-header">
              <div class="solpe-header__main">
                <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <h2 class="h6 mb-0 fw-semibold">
                    SOLPED #{{ solpe.numero_solpe || "—" }}
                  </h2>

                  <span class="badge" :class="badgeEstadoClass(solpe.estadoAprobacionSolped)">
                    {{ solpe.estadoAprobacionSolped || "Pendiente" }}
                  </span>

                  <span class="badge" :class="badgePrioridadClass(solpe.prioridad_solped)">
                    {{ solpe.prioridad_solped || "MEDIA" }}
                  </span>
                </div>

                <div class="small text-secondary">
                  {{ solpe.nombre_solped || "SIN NOMBRE" }}
                </div>

                <div class="solpe-mini mt-2">
                  <span><i class="bi bi-building me-1"></i>{{ solpe.empresa || "—" }}</span>
                  <span><i class="bi bi-diagram-3 me-1"></i>{{ solpe.tipo_solped || "—" }}</span>
                  <span><i class="bi bi-calendar3 me-1"></i>{{ fmtFecha(solpe.fecha_str || solpe.createdAt || solpe.fecha) }}</span>
                </div>
              </div>

              <div class="solpe-header__actions">
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="toggleExpand(solpe.id)"
                >
                  <i class="bi" :class="expanded[solpe.id] ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  {{ expanded[solpe.id] ? "Ocultar" : "Ver detalle" }}
                </button>

                <button
                  v-if="(solpe.estadoAprobacionSolped || 'Pendiente') === 'Pendiente'"
                  class="btn btn-success btn-sm"
                  :disabled="accionandoId === solpe.id"
                  @click="aprobarSolped(solpe)"
                >
                  <span
                    v-if="accionandoId === solpe.id && accion === 'aprobar'"
                    class="spinner-border spinner-border-sm me-2"
                  ></span>
                  Aprobar
                </button>

                <button
                  v-if="(solpe.estadoAprobacionSolped || 'Pendiente') === 'Pendiente'"
                  class="btn btn-danger btn-sm"
                  :disabled="accionandoId === solpe.id"
                  @click="abrirModalRechazo(solpe)"
                >
                  Rechazar
                </button>
              </div>
            </div>

            <!-- DETAIL -->
            <div v-if="expanded[solpe.id]" class="card-body">
              <!-- BLOQUE 1 -->
              <div class="section-card mb-3">
                <div class="section-card__title">Resumen general</div>

                <div class="row g-3">
                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">N° SOLPED</small>
                      <strong>#{{ solpe.numero_solpe || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Empresa</small>
                      <strong>{{ solpe.empresa || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Estado</small>
                      <strong>{{ solpe.estadoAprobacionSolped || "Pendiente" }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Prioridad</small>
                      <span class="badge" :class="badgePrioridadClass(solpe.prioridad_solped)">
                        {{ solpe.prioridad_solped || "MEDIA" }}
                      </span>
                    </div>
                  </div>

                  <div class="col-12 col-md-8">
                    <div class="info-box">
                      <small class="text-secondary d-block">Nombre SOLPED</small>
                      <strong>{{ solpe.nombre_solped || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="info-box">
                      <small class="text-secondary d-block">Tipo SOLPED</small>
                      <strong>{{ solpe.tipo_solped || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Fecha</small>
                      <strong>{{ fmtFecha(solpe.fecha_str || solpe.createdAt || solpe.fecha) }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Días estimados</small>
                      <strong>{{ solpe.dias_estimados_gestion || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="info-box">
                      <small class="text-secondary d-block">Tipo flujo</small>
                      <strong>{{ solpe.tipo_flujo || "—" }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BLOQUE 2 -->
              <div class="section-card mb-3">
                <div class="section-card__title">Personas y centro de costo</div>

                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <div class="info-box">
                      <small class="text-secondary d-block">Solicitante</small>
                      <strong>{{ solpe.usuario || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="info-box">
                      <small class="text-secondary d-block">Cotizadores</small>
                      <div class="d-flex flex-wrap gap-1 mt-1">
                        <span
                          v-for="(c, idx) in (solpe.dirigidoA || [])"
                          :key="idx"
                          class="badge text-bg-light border"
                        >
                          {{ c }}
                        </span>
                        <span v-if="!(solpe.dirigidoA || []).length">—</span>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-md-4">
                    <div class="info-box">
                      <small class="text-secondary d-block">Centro de costo</small>
                      <strong>{{ solpe.numero_contrato || "—" }}</strong>
                    </div>
                  </div>

                  <div class="col-12 col-md-8">
                    <div class="info-box">
                      <small class="text-secondary d-block">Nombre centro de costo</small>
                      <strong>{{ solpe.nombre_centro_costo || "—" }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ARCHIVOS -->
              <div class="section-card mb-3">
                <div class="section-card__title">Archivos adjuntos</div>

                <div v-if="!(solpe.autorizaciones || []).length" class="text-secondary">
                  Sin archivos adjuntos.
                </div>

                <div v-else class="d-flex flex-column gap-2">
                  <div
                    v-for="(a, idx) in solpe.autorizaciones"
                    :key="idx"
                    class="file-row"
                  >
                    <div class="min-w-0">
                      <div class="fw-semibold text-truncate">
                        {{ a.nombre || 'Archivo' }}
                      </div>
                      <div class="small text-secondary">
                        {{ a.tipo || 'archivo' }}
                        <span v-if="a.tamano">· {{ fmtSize(a.tamano) }}</span>
                      </div>
                    </div>

                    <a
                      :href="a.url"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-outline-primary btn-sm"
                    >
                      Ver archivo
                    </a>
                  </div>
                </div>
              </div>

              <!-- ITEMS DESKTOP -->
              <div class="section-card mb-3 d-none d-md-block">
                <div class="section-card__title">Ítems</div>

                <div class="table-responsive">
                  <table class="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Descripción</th>
                        <th>Código</th>
                        <th>Cantidad</th>
                        <th>Stock</th>
                        <th>N° Interno / Patente</th>
                        <th>Prioridad</th>
                        <th>Imagen</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="it in (solpe.items || [])" :key="`${solpe.id}-${it.item}`">
                        <td>{{ it.item || "—" }}</td>
                        <td>{{ it.descripcion || "—" }}</td>
                        <td>{{ it.codigo_referencial || "—" }}</td>
                        <td>{{ it.cantidad ?? "—" }}</td>
                        <td>{{ it.stock ?? "—" }}</td>
                        <td>{{ it.numero_interno || "—" }}</td>
                        <td>
                          <span class="badge" :class="badgePrioridadClass(it.prioridad)">
                            {{ it.prioridad || "MEDIA" }}
                          </span>
                        </td>
                        <td>
                          <a
                            v-if="it.imagen_url"
                            :href="it.imagen_url"
                            target="_blank"
                            rel="noopener"
                            class="btn btn-outline-secondary btn-sm"
                          >
                            Ver
                          </a>
                          <span v-else>—</span>
                        </td>
                      </tr>

                      <tr v-if="!(solpe.items || []).length">
                        <td colspan="8" class="text-center text-secondary py-3">
                          Sin ítems.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ITEMS MOBILE -->
              <div class="section-card mb-3 d-md-none">
                <div class="section-card__title">Ítems</div>

                <div v-if="!(solpe.items || []).length" class="text-center text-secondary py-3">
                  Sin ítems.
                </div>

                <div v-else class="d-flex flex-column gap-2">
                  <div
                    v-for="it in (solpe.items || [])"
                    :key="`${solpe.id}-mobile-${it.item}`"
                    class="item-mobile-card"
                  >
                    <div class="item-mobile-top">
                      <div class="fw-semibold">Ítem #{{ it.item || "—" }}</div>
                      <span class="badge" :class="badgePrioridadClass(it.prioridad)">
                        {{ it.prioridad || "MEDIA" }}
                      </span>
                    </div>

                    <div class="item-mobile-grid">
                      <div class="item-line full">
                        <small>Descripción</small>
                        <strong>{{ it.descripcion || "—" }}</strong>
                      </div>

                      <div class="item-line">
                        <small>Código</small>
                        <strong>{{ it.codigo_referencial || "—" }}</strong>
                      </div>

                      <div class="item-line">
                        <small>Cantidad</small>
                        <strong>{{ it.cantidad ?? "—" }}</strong>
                      </div>

                      <div class="item-line">
                        <small>Stock</small>
                        <strong>{{ it.stock ?? "—" }}</strong>
                      </div>

                      <div class="item-line full">
                        <small>N° Interno / Patente</small>
                        <strong>{{ it.numero_interno || "—" }}</strong>
                      </div>
                    </div>

                    <div class="mt-2">
                      <a
                        v-if="it.imagen_url"
                        :href="it.imagen_url"
                        target="_blank"
                        rel="noopener"
                        class="btn btn-outline-secondary btn-sm w-100"
                      >
                        Ver imagen
                      </a>
                      <span v-else class="small text-secondary">Sin imagen</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- HISTORIAL -->
              <div v-if="historialMap[solpe.id]?.length" class="section-card">
                <div class="section-card__title">Historial</div>

                <div class="timeline">
                  <div
                    v-for="h in historialMap[solpe.id]"
                    :key="h.id"
                    class="timeline-item"
                  >
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="fw-semibold">
                        {{ h.estatus || h.estado || "Cambio" }}
                      </div>
                      <div class="small text-secondary">
                        {{ fmtFecha(h.fecha) }} · {{ h.usuario || "—" }}
                      </div>
                      <div v-if="h.comentario" class="mt-1">
                        {{ h.comentario }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL RECHAZO -->
    <div v-if="modalRechazoOpen" class="vmodal-backdrop" @click.self="cerrarModalRechazo">
      <div class="vmodal">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <h5 class="mb-0">Rechazar SOLPED</h5>
          <button class="btn-close" @click="cerrarModalRechazo" :disabled="accionandoId"></button>
        </div>

        <div class="vmodal-body">
          <p class="mb-2">
            SOLPED:
            <strong>#{{ selectedSolpe?.numero_solpe || "—" }}</strong>
            — {{ selectedSolpe?.nombre_solped || "SIN NOMBRE" }}
          </p>

          <label class="form-label">Comentario de rechazo</label>
          <textarea
            v-model="comentarioRechazo"
            class="form-control"
            rows="5"
            placeholder="Indica el motivo del rechazo..."
          ></textarea>

          <div v-if="comentarioError" class="text-danger small mt-2">
            {{ comentarioError }}
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarModalRechazo" :disabled="accionandoId">
            Cancelar
          </button>
          <button class="btn btn-danger" @click="rechazarSolped" :disabled="accionandoId">
            <span
              v-if="accionandoId && accion === 'rechazar'"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>

    <!-- TOASTS -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i
          class="me-2"
          :class="t.type==='success'
            ? 'bi bi-check-circle-fill'
            : (t.type==='warning'
              ? 'bi bi-exclamation-triangle-fill'
              : 'bi bi-x-circle-fill')"
        ></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from "vue";
import { db } from "@/stores/firebase";
import { useAuthStore } from "@/stores/authService";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

const auth = useAuthStore();

const SOLPES_COLLECTION = "solpeds_plantas";
const HISTORIAL_SUBCOL = "historialEstados";

const SOLPED_CENTROS_PLANTA = [
  "BETON_CALAMA",
  "FLUMECAR_CALAMA",
  "URBANA_CALAMA",
  "KM13_ANDINA",
  "NV17_ANDINA",
  "SAN_BERNARDO",
  "ARIDO_NOS",
  "OLIVAR",
  "CANECHE",
  "COLON",
  "AGUA_DULCE",
  "ESMERALDA",
  "ESTOCADA_8",
  "OP14",
  "ANDES_NORTE",
  "CHANCHADO"
];

const cargando = ref(false);
const error = ref("");
const solpeds = ref([]);

const busqueda = ref("");
const estadoFiltro = ref("");
const prioridadFiltro = ref("");
const showFiltros = ref(false);

const expanded = reactive({});
const historialMap = reactive({});
const historialUnsubs = reactive({});

const modalRechazoOpen = ref(false);
const selectedSolpe = ref(null);
const comentarioRechazo = ref("");
const comentarioError = ref("");

const accionandoId = ref("");
const accion = ref("");

const toasts = ref([]);
const addToast = (type, text, timeout = 3200) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => {
  toasts.value = toasts.value.filter((x) => x.id !== id);
};

const normalizar = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const usuarioActual = computed(() => {
  const u = auth?.user || {};
  const name =
    auth?.profile?.fullName ||
    auth?.profile?.nombre ||
    u?.displayName ||
    "";
  const email = u?.email || "";
  return {
    fullName: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
  };
});

const esRicardo = computed(() => {
  const n = normalizar(usuarioActual.value.fullName);
  const m = normalizar(usuarioActual.value.email);
  return n.includes("ricardo prouvay") || m.includes("ricardo");
});

const badgeEstadoClass = (estado) => {
  const e = String(estado || "Pendiente").toLowerCase();
  if (e.includes("aprobada") || e === "aprobado") return "text-bg-success";
  if (e.includes("rechazada") || e === "rechazado") return "text-bg-danger";
  return "text-bg-warning";
};

const badgePrioridadClass = (prioridad) => {
  const p = String(prioridad || "MEDIA").toUpperCase();
  if (p === "ALTA") return "bg-danger-subtle text-danger-emphasis";
  if (p === "BAJA") return "bg-secondary-subtle text-secondary-emphasis";
  return "bg-warning-subtle text-warning-emphasis";
};

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f ? new Date(f) : null);
    if (!d || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const fmtSize = (bytes) => {
  const n = Number(bytes || 0);
  if (!n) return "—";
  const mb = n / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = n / 1024;
  return `${kb.toFixed(1)} KB`;
};

const filtradas = computed(() => {
  const q = normalizar(busqueda.value);
  const estado = normalizar(estadoFiltro.value);
  const prioridad = normalizar(prioridadFiltro.value);

  return solpeds.value.filter((s) => {
    const texto = normalizar([
      s.numero_solpe,
      s.nombre_solped,
      s.usuario,
      s.empresa,
      s.numero_contrato,
      s.nombre_centro_costo,
      s.tipo_solped,
      s.prioridad_solped,
      s.estadoAprobacionSolped,
      ...(s.dirigidoA || [])
    ].join(" "));

    const estadoActual = normalizar(s.estadoAprobacionSolped || "Pendiente");
    const prioridadActual = normalizar(s.prioridad_solped || "MEDIA");

    const okBusqueda = q ? texto.includes(q) : true;
    const okEstado = estado ? estadoActual === estado : true;
    const okPrioridad = prioridad ? prioridadActual === prioridad : true;

    return okBusqueda && okEstado && okPrioridad;
  });
});

const limpiarFiltros = () => {
  busqueda.value = "";
  estadoFiltro.value = "";
  prioridadFiltro.value = "";
};

const desuscribirHistorial = (solpeId) => {
  if (historialUnsubs[solpeId]) {
    historialUnsubs[solpeId]();
    delete historialUnsubs[solpeId];
  }
};

const suscribirHistorial = (solpeId) => {
  if (!solpeId || historialUnsubs[solpeId]) return;

  try {
    const qHist = query(
      collection(db, SOLPES_COLLECTION, solpeId, HISTORIAL_SUBCOL),
      orderBy("fecha", "desc"),
      limit(50)
    );

    historialUnsubs[solpeId] = onSnapshot(
      qHist,
      (snap) => {
        historialMap[solpeId] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() || {})
        }));
      },
      (e) => {
        console.warn("No se pudo suscribir historial:", e);
        historialMap[solpeId] = [];
      }
    );
  } catch (e) {
    console.warn("Error al suscribir historial:", e);
    historialMap[solpeId] = [];
  }
};

const toggleExpand = async (id) => {
  expanded[id] = !expanded[id];

  if (expanded[id]) {
    suscribirHistorial(id);
  } else {
    desuscribirHistorial(id);
  }
};

let unsubscribeSolpeds = null;

const cargarSolpeds = async () => {
  if (unsubscribeSolpeds) {
    unsubscribeSolpeds();
    unsubscribeSolpeds = null;
  }

  cargando.value = true;
  error.value = "";

  try {
    const q1 = query(
      collection(db, SOLPES_COLLECTION),
      where("tipo_flujo", "==", "planta"),
      where("requiereAprobacionSolped", "==", true),
      orderBy("createdAt", "desc")
    );

    unsubscribeSolpeds = onSnapshot(
      q1,
      (snap) => {
        let arr = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() || {})
        }));

        arr = arr.filter((s) => {
          const centroOk = SOLPED_CENTROS_PLANTA.includes(String(s.numero_contrato || ""));
          const aprobador = normalizar(s.aprobadorSolped || "");
          return centroOk && (!aprobador || aprobador.includes("ricardo"));
        });

        solpeds.value = arr;

        const idsActuales = new Set(arr.map((x) => x.id));

        Object.keys(expanded).forEach((id) => {
          if (!idsActuales.has(id)) {
            delete expanded[id];
            delete historialMap[id];
            desuscribirHistorial(id);
          }
        });

        cargando.value = false;
      },
      (e) => {
        console.error(e);
        error.value = "No se pudieron cargar las SOLPED de aprobación.";
        cargando.value = false;
      }
    );
  } catch (e) {
    console.error(e);
    error.value = "No se pudieron cargar las SOLPED de aprobación.";
    cargando.value = false;
  }
};

const aprobarSolped = async (solpe) => {
  accionandoId.value = solpe.id;
  accion.value = "aprobar";

  try {
    const refSolpe = doc(db, SOLPES_COLLECTION, solpe.id);

    await updateDoc(refSolpe, {
      estadoAprobacionSolped: "Solped Aprobada",
      comentario_aprobacion_solped: "",
      fecha_aprobacion_solped: serverTimestamp(),
      usuario_aprobacion_solped: usuarioActual.value.fullName || usuarioActual.value.email || "Ricardo Prouvay",
      estatus: "Pendiente",
      requiereAprobacionSolped: false
    });

    await addDoc(collection(db, SOLPES_COLLECTION, solpe.id, HISTORIAL_SUBCOL), {
      fecha: serverTimestamp(),
      usuario: usuarioActual.value.fullName || usuarioActual.value.email || "Ricardo Prouvay",
      estatus: "Solped Aprobada",
      comentario: "Solped Aprobada"
    });

    addToast("success", `SOLPED #${solpe.numero_solpe} aprobada.`);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo aprobar la SOLPED.");
  } finally {
    accionandoId.value = "";
    accion.value = "";
  }
};

const abrirModalRechazo = (solpe) => {
  selectedSolpe.value = solpe;
  comentarioRechazo.value = "";
  comentarioError.value = "";
  modalRechazoOpen.value = true;
};

const cerrarModalRechazo = () => {
  if (accionandoId.value) return;
  modalRechazoOpen.value = false;
  selectedSolpe.value = null;
  comentarioRechazo.value = "";
  comentarioError.value = "";
};

const rechazarSolped = async () => {
  if (!selectedSolpe.value) return;

  const comentario = String(comentarioRechazo.value || "").trim();
  if (!comentario) {
    comentarioError.value = "Debes ingresar un comentario para rechazar.";
    return;
  }

  accionandoId.value = selectedSolpe.value.id;
  accion.value = "rechazar";

  try {
    const refSolpe = doc(db, SOLPES_COLLECTION, selectedSolpe.value.id);

    await updateDoc(refSolpe, {
      estadoAprobacionSolped: "Solped Rechazada",
      comentario_aprobacion_solped: comentario,
      fecha_aprobacion_solped: serverTimestamp(),
      usuario_aprobacion_solped: usuarioActual.value.fullName || usuarioActual.value.email || "Ricardo Prouvay",
      estatus: "Rechazada"
    });

    await addDoc(collection(db, SOLPES_COLLECTION, selectedSolpe.value.id, HISTORIAL_SUBCOL), {
      fecha: serverTimestamp(),
      usuario: usuarioActual.value.fullName || usuarioActual.value.email || "Ricardo Prouvay",
      estatus: "Solped Rechazada",
      comentario
    });

    addToast("warning", `SOLPED #${selectedSolpe.value.numero_solpe} rechazada.`);
    cerrarModalRechazo();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo rechazar la SOLPED.");
  } finally {
    accionandoId.value = "";
    accion.value = "";
  }
};

onMounted(async () => {
  if (!esRicardo.value) {
    console.warn("Usuario actual no coincide con Ricardo; se carga igual según permisos.");
  }
  await cargarSolpeds();
});

onBeforeUnmount(() => {
  if (unsubscribeSolpeds) {
    unsubscribeSolpeds();
    unsubscribeSolpeds = null;
  }

  Object.keys(historialUnsubs).forEach((id) => {
    try {
      historialUnsubs[id]();
    } catch {
      // nada
    }
    delete historialUnsubs[id];
  });
});
</script>

<style scoped>
.aprob-solped-page {
  min-height: 100vh;
}

.page-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.page-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-card,
.empty-card,
.solpe-card {
  border-radius: 16px;
}

.solpe-card {
  overflow: hidden;
}

.solpe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.solpe-header__main {
  min-width: 0;
  flex: 1 1 360px;
}

.solpe-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.solpe-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #64748b;
  font-size: 0.86rem;
}

.section-card {
  background: #f8fafc;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e9eef5;
}

.section-card__title {
  font-weight: 700;
  margin-bottom: 12px;
  color: #0f172a;
}

.info-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  height: 100%;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  background: #fff;
}

.item-mobile-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0.9rem;
}

.item-mobile-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.75rem;
}

.item-mobile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.item-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-line.full {
  grid-column: 1 / -1;
}

.item-line small {
  color: #64748b;
  font-size: 0.78rem;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.timeline-item {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 12px;
  align-items: start;
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #dc2626;
  margin-top: 6px;
}
.timeline-content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
}

.vmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.vmodal {
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
}
.vmodal-header,
.vmodal-footer {
  padding: 1rem 1.1rem;
  border-bottom: 1px solid #e5e7eb;
}
.vmodal-footer {
  border-bottom: 0;
  border-top: 1px solid #e5e7eb;
}
.vmodal-body {
  padding: 1rem 1.1rem;
}

.toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1300;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-box {
  display: flex;
  align-items: center;
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  color: #fff;
  min-width: 250px;
  max-width: 380px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}
.toast-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.toast-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.toast-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .page-top {
    align-items: stretch;
  }

  .page-actions {
    width: 100%;
  }

  .page-actions .btn {
    flex: 1 1 0;
  }

  .solpe-header {
    flex-direction: column;
    align-items: stretch;
  }

  .solpe-header__actions {
    justify-content: stretch;
    width: 100%;
  }

  .solpe-header__actions .btn {
    flex: 1 1 100%;
  }

  .file-row {
    flex-direction: column;
    align-items: stretch;
  }

  .item-mobile-grid {
    grid-template-columns: 1fr;
  }

  .info-box {
    padding: 0.75rem 0.85rem;
  }

  .section-card {
    padding: 12px;
  }

  .toast-stack {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }

  .toast-box {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
}
</style>
