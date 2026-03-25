<!-- src/views/DetalleSolpedPlanta.vue -->
<template>
  <div class="solped-detalle-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">
          SOLPED Planta <span v-if="numeroSolpe">#{{ numeroSolpe }}</span>
        </h1>

        <div></div>
      </div>

      <div v-if="loadingDoc" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
        <div class="mt-2">Cargando SOLPED de planta…</div>
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-else>
        <!-- RESUMEN -->
        <div class="card card-elevated mb-3">
          <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-semibold">Resumen</span>
              <span class="badge" :class="estadoBadgeClass(docData.estatus)">
                {{ docData.estatus || "—" }}
              </span>
              <span
                v-if="docData.estadoAprobacionSolped"
                class="badge bg-primary-subtle text-primary-emphasis"
              >
                {{ docData.estadoAprobacionSolped }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <div class="small text-secondary">Empresa</div>
                <div class="fw-semibold">{{ docData.empresa || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Fecha</div>
                <div class="fw-semibold">
                  {{ prettyFecha(docData.createdAt || docData.fecha || docData.fechaCreacion) || "—" }}
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Responsable</div>
                <div class="fw-semibold">{{ docData.usuario || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Cotizador / Dirigido a</div>
                <div class="fw-semibold">
                  <template v-if="Array.isArray(docData.dirigidoA) && docData.dirigidoA.length">
                    {{ docData.dirigidoA.join(" · ") }}
                  </template>
                  <template v-else>
                    {{ docData.dirigidoA || "—" }}
                  </template>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Tipo SOLPED</div>
                <div class="fw-semibold">{{ docData.tipo_solped || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">N° SOLPED</div>
                <div class="fw-semibold">{{ numeroSolpe || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Centro de Costo</div>
                <div class="fw-semibold">
                  {{ docData.numero_contrato || "—" }} — {{ docData.nombre_centro_costo || "—" }}
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="small text-secondary">Nombre SOLPED</div>
                <div class="fw-semibold">{{ docData.nombre_solped || "—" }}</div>
              </div>

              <div class="col-12 col-md-6" v-if="docData.tipo_flujo">
                <div class="small text-secondary">Prioridad</div>
                <div class="fw-semibold">{{ docData.prioridad_solped }}</div>
              </div>
              <div class="col-12 col-md-6" v-if="docData.tipo_flujo">
                <div class="small text-secondary">Días de Gestionar</div>
                <div class="fw-semibold">{{ docData.dias_estimados_gestion}}</div>
              </div>

              <div class="col-12 col-md-6" v-if="docData.comentario">
                <div class="small text-secondary">Comentario</div>
                <div class="fw-semibold">{{ docData.comentario }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADJUNTOS -->
        <div class="card card-elevated mb-3" v-if="Array.isArray(adjuntos) && adjuntos.length">
          <div class="card-header d-flex align-items-center justify-content-between">
            <span class="fw-semibold">📎 Documentos adjuntos</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ adjuntos.length }}</span>
          </div>

          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div
                v-for="(f, i) in adjuntos"
                :key="(f.url || i) + '_' + i"
                class="list-group-item d-flex align-items-start gap-3"
              >
                <div class="fs-5 lh-1 mt-1" :title="f.tipo">
                  <i :class="fileIcon(f)"></i>
                </div>

                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <a
                      class="fw-semibold text-decoration-none text-truncate"
                      :href="f.url"
                      target="_blank"
                      rel="noopener"
                      :title="f.nombre || 'archivo'"
                    >
                      {{ f.nombre || "archivo" }}
                    </a>

                    <span class="badge bg-light text-body border">{{ prettyExt(f) }}</span>
                    <span v-if="f.tamano" class="small text-secondary">· {{ fmtBytes(f.tamano) }}</span>
                  </div>

                  <div class="mt-2 d-flex gap-2 flex-wrap">
                    <a
                      class="btn btn-sm btn-primary"
                      :href="f.url"
                      target="_blank"
                      rel="noopener"
                    >
                      <i class="bi bi-box-arrow-up-right me-1"></i> Abrir
                    </a>

                    <button
                      v-if="isPreviewable(f)"
                      class="btn btn-sm btn-outline-secondary"
                      @click="togglePreview(i)"
                    >
                      <i class="bi" :class="previewOpen[i] ? 'bi-eye-slash' : 'bi-eye'"></i>
                      {{ previewOpen[i] ? "Ocultar visor" : "Ver en visor" }}
                    </button>
                  </div>

                  <div v-if="previewOpen[i]" class="mt-3">
                    <div v-if="isPDF(f)" class="ratio ratio-16x9">
                      <iframe :src="f.url + '#toolbar=0'" style="border:none;"></iframe>
                    </div>

                    <div v-else-if="isImage(f)" class="text-center">
                      <img
                        :src="f.url"
                        :alt="f.nombre || 'imagen'"
                        class="img-fluid rounded shadow-sm"
                        style="max-height:480px;object-fit:contain;"
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-elevated mb-3" v-else>
          <div class="card-header d-flex align-items-center justify-content-between">
            <span class="fw-semibold">📎 Documentos adjuntos</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">0</span>
          </div>
          <div class="card-body text-secondary">
            No hay adjuntos en esta SOLPED de planta.
          </div>
        </div>

        <!-- COTIZACIONES VINCULADAS -->
        <div class="card card-elevated mb-3">
          <div class="card-header d-flex align-items-center justify-content-between">
            <span class="fw-semibold">🧾 Cotizaciones vinculadas</span>
            <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ cotizaciones.length }}</span>
          </div>

          <div class="card-body p-0">
            <div v-if="cargandoCots" class="p-3">
              <div class="placeholder-glow">
                <div class="placeholder col-12 mb-2" style="height:18px"></div>
                <div class="placeholder col-10 mb-2" style="height:18px"></div>
                <div class="placeholder col-8" style="height:18px"></div>
              </div>
            </div>

            <div v-else-if="!cotizaciones.length" class="p-3 text-secondary text-center">
              No hay cotizaciones enlazadas a esta SOLPED de planta.
            </div>

            <div v-else class="list-group list-group-flush">
              <div
                v-for="c in cotizaciones"
                :key="c.__docId"
                class="list-group-item d-flex align-items-start flex-wrap gap-2"
              >
                <div class="me-auto">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold">N° {{ c.id ?? "—" }}</span>
                    <span class="badge" :class="estadoBadgeClass(c.estatus)">
                      {{ c.estatus || "—" }}
                    </span>
                  </div>

                  <div class="small text-secondary mt-1">
                    <strong>Total:</strong> {{ fmtMoneda(c.precioTotalConIVA, c.moneda) }} ·
                    <strong>Moneda:</strong> {{ c.moneda || "—" }} ·
                    <strong>Fecha:</strong> {{ fmtFecha(c.fechaSubida) }}
                  </div>

                  <div class="small text-secondary">
                    <strong>Empresa:</strong> {{ c.empresa || "—" }} ·
                    <strong>Responsable:</strong> {{ c.responsable || "—" }}
                  </div>
                </div>

                <div class="ms-2 d-flex gap-2">
                  <router-link
                    :to="linkOC(c)"
                    class="btn btn-outline-primary btn-sm"
                  >
                    Ver cotización
                  </router-link>

                  <a
                    v-if="firstArchivoOC(c)"
                    class="btn btn-sm btn-outline-secondary"
                    :href="firstArchivoOC(c)"
                    target="_blank"
                    rel="noopener"
                    title="Abrir archivo OC"
                  >
                    <i class="bi bi-box-arrow-up-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ITEMS -->
        <div class="card card-elevated mb-3">
          <div class="card-header">
            <span class="fw-semibold">📦 Ítems solicitados</span>
          </div>

          <div class="card-body">
            <div v-if="cargandoItems" class="placeholder-glow">
              <div class="placeholder col-12 mb-2" style="height:18px"></div>
              <div class="placeholder col-11 mb-2" style="height:18px"></div>
              <div class="placeholder col-9" style="height:18px"></div>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-sm align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width:64px;">Ítem</th>
                    <th>Descripción</th>
                    <th>Código ref.</th>
                    <th>Unidad</th>
                    <th class="text-center" style="width:100px;">Cant.</th>
                    <th class="text-center" style="width:100px;">Cotizada</th>
                    <th style="width:130px;">Estado</th>
                    <th style="width:120px;">Imagen</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="it in itemsOrdenados" :key="`${it.item}-${it.descripcion}-${it.numero_interno}`">
                    <td class="text-secondary">{{ it.item ?? "—" }}</td>
                    <td class="fw-semibold">{{ it.descripcion || "—" }}</td>
                    <td>{{ it.codigo_referencial || "—" }}</td>
                    <td>{{ it.unidad || "UNIDAD" }}</td>
                    <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                    <td class="text-center">{{ it.cantidad_cotizada ?? 0 }}</td>
                    <td>
                      <span class="badge" :class="itemEstadoBadge(it.estado)">
                        {{ it.estado || "—" }}
                      </span>
                    </td>
                    <td>
                      <a
                        v-if="it.imagen_url"
                        :href="it.imagen_url"
                        target="_blank"
                        rel="noopener"
                        class="thumbnail-link"
                        title="Abrir imagen"
                      >
                        <img :src="it.imagen_url" alt="img" class="thumb-img" loading="lazy">
                      </a>
                      <span v-else class="text-secondary">SIN IMAGEN</span>
                    </td>
                  </tr>

                  <tr v-if="!itemsOrdenados.length">
                    <td colspan="8" class="text-center text-secondary py-3">Sin ítems.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- HISTORIAL -->
        <div class="card card-elevated">
          <div class="card-header">
            <span class="fw-semibold">🕒 Historial de estados</span>
          </div>

          <div class="card-body">
            <div v-if="cargandoHistorial" class="placeholder-glow">
              <div class="placeholder col-12 mb-2" style="height:18px"></div>
              <div class="placeholder col-10 mb-2" style="height:18px"></div>
              <div class="placeholder col-8" style="height:18px"></div>
            </div>

            <div v-else-if="!historial.length" class="text-secondary text-center">
              Sin movimientos.
            </div>

            <ul v-else class="timeline list-unstyled">
              <li v-for="(h, idx) in historialOrdenado" :key="idx" class="timeline-item">
                <div class="timeline-dot"></div>

                <div class="timeline-content">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge" :class="estadoBadgeClass(h.estatus)">
                      {{ h.estatus || "—" }}
                    </span>
                    <span class="small text-secondary">{{ fmtFecha(h.fecha) }}</span>
                  </div>

                  <div class="small mt-1" v-if="h.usuario">
                    <strong>Usuario:</strong> {{ h.usuario }}
                  </div>

                  <div class="small text-secondary" v-if="h.comentario">
                    {{ h.comentario }}
                  </div>

                  <div class="small text-secondary" v-if="h.ocNumero">
                    Cotización: {{ h.ocNumero }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db } from "../stores/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";

const route = useRoute();
const router = useRouter();

const SOLPED_COLLECTION = "solpeds_plantas";
const COT_COLLECTION = "cotizaciones_plantas";

const loadingDoc = ref(true);
const error = ref("");
const docData = ref(null);
const previewOpen = ref({});

const historial = ref([]);
const cargandoHistorial = ref(true);

const cotizaciones = ref([]);
const cargandoCots = ref(true);

const cargandoItems = ref(true);

const volver = () => router.back();

const togglePreview = (i) => {
  previewOpen.value[i] = !previewOpen.value[i];
};

const numeroSolpe = computed(
  () => docData.value?.numero_solpe ?? docData.value?.numero_solped ?? ""
);

let loadToken = 0;
onBeforeUnmount(() => {
  loadToken++;
});

onMounted(async () => {
  const myToken = ++loadToken;

  try {
    const id = route.params.id;
    if (!id) {
      error.value = "Falta el ID del documento.";
      loadingDoc.value = false;
      return;
    }

    const dref = doc(db, SOLPED_COLLECTION, String(id));
    const snap = await getDoc(dref);

    if (!snap.exists()) {
      error.value = "No se encontró la SOLPED de planta.";
      loadingDoc.value = false;
      return;
    }

    if (myToken !== loadToken) return;

    docData.value = { __docId: snap.id, ...snap.data() };
    cargandoItems.value = false;
    loadingDoc.value = false;

    await Promise.allSettled([
      cargarHistorial(dref, myToken),
      cargarCotizacionesVinculadas(myToken),
    ]);
  } catch (e) {
    console.error(e);
    error.value = "Ocurrió un error al cargar la SOLPED de planta.";
    loadingDoc.value = false;
  }
});

const cargarHistorial = async (dref, token) => {
  cargandoHistorial.value = true;

  try {
    let docsList = [];

    try {
      const qy = query(collection(dref, "historialEstados"), orderBy("fecha", "desc"));
      const snap = await getDocs(qy);
      docsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      const snap = await getDocs(collection(dref, "historialEstados"));
      docsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docsList.sort((a, b) => dateLikeToMillis(b?.fecha) - dateLikeToMillis(a?.fecha));
    }

    if (token !== loadToken) return;
    historial.value = docsList;
  } catch (e) {
    console.error("Error historialEstados:", e);
    if (token !== loadToken) return;
    historial.value = [];
  } finally {
    if (token === loadToken) cargandoHistorial.value = false;
  }
};

const cargarCotizacionesVinculadas = async (token) => {
  cargandoCots.value = true;

  try {
    const resultadosMap = new Map();
    const solpedDocId = String(route.params.id || "");
    const numero = numeroSolpe.value;

    const intents = [];

    intents.push(
      getDocs(query(collection(db, COT_COLLECTION), where("solpedId", "==", solpedDocId)))
    );

    intents.push(
      getDocs(query(collection(db, COT_COLLECTION), where("numero_solpe", "==", numero)))
    );

    intents.push(
      getDocs(query(collection(db, COT_COLLECTION), where("numero_solpe", "==", Number(numero || 0))))
    );

    const settled = await Promise.allSettled(intents);

    settled.forEach((res) => {
      if (res.status !== "fulfilled") return;
      res.value.forEach((d) => {
        resultadosMap.set(d.id, { __docId: d.id, ...d.data() });
      });
    });

    if (token !== loadToken) return;

    cotizaciones.value = Array.from(resultadosMap.values()).sort(
      (a, b) =>
        dateLikeToMillis(b?.fechaSubida || b?.createdAt || b?.created_at) -
        dateLikeToMillis(a?.fechaSubida || a?.createdAt || a?.created_at)
    );
  } catch (e) {
    console.error("Error cargando cotizaciones vinculadas:", e);
    if (token !== loadToken) return;
    cotizaciones.value = [];
  } finally {
    if (token === loadToken) cargandoCots.value = false;
  }
};

const adjuntos = computed(() => {
  const arr = Array.isArray(docData.value?.autorizaciones)
    ? docData.value.autorizaciones
    : [];

  return arr
    .map((a) => ({
      nombre: a?.nombre || "",
      url: a?.url || "",
      tipo: a?.tipo || "",
      tamano: Number(a?.tamano || 0),
    }))
    .filter((a) => a.url);
});

const itemsOrdenados = computed(() => {
  const arr = Array.isArray(docData.value?.items) ? [...docData.value.items] : [];
  arr.sort((a, b) => (a.item ?? 0) - (b.item ?? 0));
  return arr;
});

const historialOrdenado = computed(() => {
  const arr = Array.isArray(historial.value) ? [...historial.value] : [];
  arr.sort((a, b) => dateLikeToMillis(b?.fecha) - dateLikeToMillis(a?.fecha));
  return arr;
});

const getExt = (f) => {
  const name = String(f?.nombre || f?.url || "").toLowerCase();
  const m = name.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return (m?.[1] || "").trim();
};

const prettyExt = (f) => {
  const ext = getExt(f);
  if (ext) return ext.toUpperCase();
  const t = String(f?.tipo || "").split("/").pop();
  return (t || "FILE").toUpperCase();
};

const isPDF = (f) => {
  const ext = getExt(f);
  if (ext === "pdf") return true;
  const t = String(f?.tipo || "").toLowerCase();
  return t.includes("application/pdf");
};

const isImage = (f) => {
  const ext = getExt(f);
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return true;
  const t = String(f?.tipo || "").toLowerCase();
  return t.startsWith("image/");
};

const isPreviewable = (f) => isPDF(f) || isImage(f);

const fileIcon = (f) => {
  const ext = getExt(f);
  if (isPDF(f)) return "bi bi-file-earmark-pdf text-danger";
  if (isImage(f)) return "bi bi-file-earmark-image text-primary";
  if (["xls", "xlsx", "csv"].includes(ext)) return "bi bi-file-earmark-spreadsheet text-success";
  if (["zip", "rar", "7z"].includes(ext)) return "bi bi-file-earmark-zip";
  if (["doc", "docx"].includes(ext)) return "bi bi-file-earmark-word text-primary";
  if (["ppt", "pptx"].includes(ext)) return "bi bi-file-earmark-ppt text-warning";
  return "bi bi-file-earmark";
};

const fmtBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const v = (b / Math.pow(1024, i)).toFixed(i ? 1 : 0);
  return `${v} ${u[i]}`;
};

const fmtFecha = (f) => {
  try {
    let d = null;
    if (f?.toDate) d = f.toDate();
    else if (typeof f === "string") d = new Date(f);
    else if (f instanceof Date) d = f;
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

const prettyFecha = (f) => fmtFecha(f);

const fmtMoneda = (n, c = "CLP") => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("es-CL", {
      style: "currency",
      currency: c,
      minimumFractionDigits: 0,
    });
  } catch {
    return `${c} ${v.toLocaleString("es-CL")}`;
  }
};

const dateLikeToMillis = (x) => {
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

const estadoBadgeClass = (estatus) => {
  const s = String(estatus || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("preaprob")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revision") || s.includes("revisión")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("pend")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("coti")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("complet")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("parcial")) return "bg-primary-subtle text-primary-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const itemEstadoBadge = (e) => {
  const s = String(e || "").toLowerCase();
  if (s.includes("complet")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("pend")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("parcial")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const firstArchivoOC = (c) => {
  if (Array.isArray(c?.archivoOC) && c.archivoOC.length) {
    return c.archivoOC[0]?.url || "";
  }
  if (c?.archivoOC?.url) return c.archivoOC.url;
  return "";
};

const linkOC = (c) => {
  return {
    name: "DetalleCotizacionPlanta",
    params: { id: c.__docId },
    query: {
      from: "solped-planta",
      solped: String(route.params.id || "")
    },
  };
};
</script>

<style scoped>
.solped-detalle-page {
  min-height: 100vh;
}

.card-elevated {
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.06) !important;
  border-radius: 0.9rem !important;
}

.thumb-img {
  width: 84px;
  height: 56px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.thumbnail-link:hover .thumb-img {
  transform: scale(1.02);
  transition: transform 0.15s ease;
}

.timeline {
  position: relative;
  margin: 0;
  padding: 0.25rem 0 0.25rem 0.5rem;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  margin-bottom: 12px;
}

.timeline-dot {
  position: absolute;
  left: 2px;
  top: 0.4rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e5e7eb;
}

.timeline-content {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.list-group-item .bi {
  vertical-align: -0.1rem;
}

.placeholder {
  border-radius: 0.5rem;
}

.min-w-0 {
  min-width: 0;
}
</style>
