<!-- src/views/GenerarCertificados.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-4 py-lg-5">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div>
        <h1 class="h4 fw-semibold mb-1">Generador de Certificados</h1>
        <div class="text-muted small">Mantención / Operatividad · Vista previa · Guarda en Firestore + PDF</div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="resetAll">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Limpiar
        </button>

        <button class="btn btn-primary" :disabled="!canSave || saving" @click="guardarCertificado">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-save2 me-1"></i>
          Guardar + PDF
        </button>

        <button class="btn btn-outline-dark" :disabled="!hasPreview" @click="generarPdfSolo">
          <i class="bi bi-filetype-pdf me-1"></i> PDF (sin guardar)
        </button>
      </div>
    </div>

    <div class="row g-3">
      <!-- FORM -->
      <div class="col-12 col-lg-5 no-print">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="fw-semibold">Formulario</div>
              <span class="badge text-bg-light border">
                {{ form.tipo === "MANTENCION" ? "Certificado de Mantención" : "Certificado de Operatividad" }}
              </span>
            </div>

            <hr class="my-3" />

            <!-- Tipo + Numero auto + Unidad -->
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label">Tipo de certificado</label>
                <select v-model="form.tipo" class="form-select" @change="onTipoChange">
                  <option value="MANTENCION">MANTENCIÓN</option>
                  <option value="OPERATIVIDAD">OPERATIVIDAD</option>
                </select>
              </div>

              <!-- Unidad -->
              <div class="col-12">
                <label class="form-label">Unidad de lectura</label>
                <select v-model="form.unidadLectura" class="form-select">
                  <option value="Km">Km</option>
                  <option value="Hrs">Hrs</option>
                </select>
                <div class="form-text">Se refleja en vista previa, PDF y Firestore.</div>
              </div>

              <div class="col-12">
                <label class="form-label d-flex align-items-center justify-content-between">
                  <span>N° Certificado (auto)</span>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    @click="cargarProximoNumero"
                    :disabled="loadingCounter"
                    title="Actualizar número desde Firestore"
                  >
                    <span v-if="loadingCounter" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-arrow-clockwise me-1"></i>
                    Actualizar N°
                  </button>
                </label>

                <input class="form-control" :value="displayNumero" disabled />
              </div>
            </div>

            <hr class="my-3" />

            <div class="mb-2">
              <label class="form-label">Buscar equipo</label>
              <input
                v-model.trim="equipoSearch"
                class="form-control"
                placeholder="Buscar por código/patente, marca, modelo, chasis…"
              />
              <div class="form-text">
                Cargando últimos <b>{{ equiposCache.length }}</b>
              </div>
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

            <!-- Equipo seleccionado -->
            <div v-if="selectedEquipo" class="alert alert-light border small mb-3">
              <div class="fw-semibold">Equipo seleccionado</div>
              <div class="text-muted">
                <b>{{ form.patente }}</b> · Interno: <b>{{ form.numeroInterno || "—" }}</b>
              </div>
              <div class="text-muted mt-1">
                {{ form.marca || "—" }} · {{ form.modelo || "—" }}
              </div>
            </div>

            <hr class="my-3" />

            <!-- CAMPOS SEGÚN TIPO -->
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
                  <input
                    v-model="form.kmOtRaw"
                    class="form-control"
                    placeholder="132309"
                    @input="recalcMantencion"
                    :disabled="form.equipoNuevo"
                  />
                </div>

                <div class="col-6">
                  <label class="form-label">Lectura actual ({{ unidad }})</label>
                  <input v-model="form.kmActualRaw" class="form-control" placeholder="135671" @input="recalcMantencion" />
                </div>

                <div class="col-6">
                  <label class="form-label">Intervalo preventiva ({{ unidad }})</label>
                  <input v-model="form.intervaloRaw" class="form-control" placeholder="10000" @input="recalcMantencion" />
                </div>

                <div class="col-6">
                  <label class="form-label">Próxima Mantención ({{ unidad }})</label>
                  <input v-model="form.proximaMantencionRaw" class="form-control" placeholder="142309" />
                  <div class="form-text">Auto: lectura OT + intervalo (puedes editar).</div>
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
          </div>
        </div>
      </div>

      <!-- PREVIEW -->
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

            <div v-else ref="previewRef" class="cert-sheet p-3 p-md-4" id="cert-preview">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="d-flex align-items-center gap-3">
                  <img :src="logoMiningSrc" class="cert-logo" alt="Logo" />
                  <div class="small text-muted">
                    <div class="fw-semibold">Xtreme Mining Ltda.</div>
                    <div>Documento interno</div>
                  </div>
                </div>

                <div class="text-end">
                  <div class="small">
                    <div class="fw-semibold">CERTIFICADO N° {{ displayNumero }}</div>
                    <div class="mt-1">
                      <span class="fw-semibold">{{ ciudad }}</span>, {{ fechaEmisionFmt }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-center my-4">
                <div class="cert-title">CERTIFICADO DE {{ form.tipo === "MANTENCION" ? "MANTENCIÓN" : "OPERATIVIDAD" }}</div>
              </div>

              <div class="cert-body">
                <p class="mb-2">
                  <b>Xtreme Mining Ltda.</b> Mediante el presente documento, certifica que el equipo identificado con la placa
                  <b class="px-2 py-1 border rounded bg-light">{{ form.patente || "—" }}</b>
                  y número interno
                  <b class="px-2 py-1 border rounded bg-light">{{ form.numeroInterno || "—" }}</b>,
                  {{ cuerpoPrincipal }}
                </p>

                <div v-if="form.tipo === 'MANTENCION' && !form.equipoNuevo" class="mt-3">
                  <p class="mb-2">
                    Su última mantención realizada <b>{{ fechaUltimaOtFmt }}</b>
                    a los <b>{{ kmOtFmt }}</b> {{ unidad }} y registrada con la orden de trabajo <b>{{ form.ultimaOt || "—" }}</b>.
                    Consta que la unidad se encuentra en condición estándar, tanto en su parte mecánica, hidráulica y estructural.
                  </p>

                  <p class="mb-3">
                    Mantención realizada por personal calificado y certificado por representante de la marca de acuerdo a documento anexo.
                  </p>
                </div>

                <div v-if="form.tipo === 'MANTENCION' && form.equipoNuevo" class="mt-3">
                  <p class="mb-3">
                    Se señala que el equipo es nuevo, y que se encuentra en óptimas condiciones para operar con normalidad en minería.
                  </p>
                </div>

                <div v-if="form.tipo === 'OPERATIVIDAD'" class="mt-3">
                  <p class="mb-2">
                    Se constata el estado: <b>{{ form.estadoOperatividad }}</b>
                    (inspección: <b>{{ fechaInspeccionFmt }}</b>).
                  </p>
                  <p class="mb-3" v-if="form.observaciones">
                    <b>Observaciones:</b> {{ form.observaciones }}
                  </p>
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
              </div>

              <div class="cert-footer small text-muted mt-4">
                Documento generado desde sistema interno · {{ new Date().getFullYear() }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="saveOk" class="alert alert-success mt-3">
          ✅ Certificado guardado en Firestore.
          <span v-if="lastSavedId" class="small text-muted">ID: {{ lastSavedId }}</span>
        </div>

        <div v-if="saveErr" class="alert alert-danger mt-3">
          ❌ {{ saveErr }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
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
} from "firebase/firestore";

import { PDFDocument, StandardFonts, rgb} from "pdf-lib";
import logoMiningImg from "../assets/Logo Xtreme Mining.png";
import firmaImg from "../assets/firma_juan_cubillos.png";
import timbreOperativoImg from "../assets/timbre_operativo.png";
import timbreCheckImg from "../assets/timbre_check.png";

const logoMiningSrc = logoMiningImg;
const firmaSrc = firmaImg;
const timbreOperativoSrc = timbreOperativoImg;
const timbreCheckSrc = timbreCheckImg;

const DATABASE_ID = "rollback-2025-10-25";

const FIRMANTE = Object.freeze({
  nombre: "Juan Cubillos Polloni",
  rut: "19.245.263-5",
  cargo: "Jefe Corporativo Mantenimiento Flota",
});

const app = getApp();
const db = getFirestore(app, DATABASE_ID);

const ciudad = "Santiago";

const loadingEquipos = ref(false);
const equiposCache = ref([]);
const equipoSearch = ref("");
const selectedEquipo = ref(null);

const saving = ref(false);
const saveOk = ref(false);
const saveErr = ref("");
const lastSavedId = ref("");

const previewRef = ref(null);

const loadingCounter = ref(false);
const counterNext = ref(null);
const counterDocId = ref(null);

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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
});

const unidad = computed(() => form.value.unidadLectura || "Km");

function extraerCodigoDesdeString(str) {
  if (!str) return "";
  const m = String(str).match(/\[([^\]]+)\]\s*$/);
  return m?.[1] || "";
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
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
    return (
      codigo.includes(q) ||
      equipo.includes(q) ||
      marca.includes(q) ||
      modelo.includes(q) ||
      chasis.includes(q) ||
      tipo.includes(q)
    );
  });

  return out.slice(0, 30);
});

function seleccionarEquipo(e) {
  selectedEquipo.value = e;

  const codigo = e.codigo || extraerCodigoDesdeString(e.equipo) || "";
  form.value.patente = codigo || "";
  form.value.numeroInterno = e.numero_interno || e.numeroInterno || codigo || "";
  form.value.marca = e.marca || "";
  form.value.modelo = e.modelo || "";
  form.value.tipoEquipo = e.tipo_equipo || "";
  form.value.numeroChasis = e.numero_chasis || "";
  form.value.numeroMotor = e.numero_motor || e.numeroMotor || "";

  recalcMantencion();
}

async function loadEquiposCache() {
  loadingEquipos.value = true;
  try {
    const q = query(collection(db, "equipos"), orderBy("actualizado", "desc"), limit(300));
    const snap = await getDocs(q);
    equiposCache.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } finally {
    loadingEquipos.value = false;
  }
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

function recalcMantencion() {
  if (form.value.tipo !== "MANTENCION") return;
  const kmOt = parseIntLoose(form.value.kmOtRaw);
  const intervalo = parseIntLoose(form.value.intervaloRaw);
  if (Number.isFinite(kmOt) && Number.isFinite(intervalo) && kmOt > 0 && intervalo > 0) {
    form.value.proximaMantencionRaw = String(kmOt + intervalo);
  }
}

function onTipoChange() {
  saveOk.value = false;
  saveErr.value = "";
  form.value.numero = null;
  if (form.value.tipo === "OPERATIVIDAD") form.value.equipoNuevo = false;
}

const fechaEmisionFmt = computed(() => fmtDMY(form.value.fechaEmision));
const fechaUltimaOtFmt = computed(() => fmtDMY(form.value.fechaUltimaOt));
const fechaInspeccionFmt = computed(() => fmtDMY(form.value.fechaInspeccion));

const kmOtFmt = computed(() => fmtCL(parseIntLoose(form.value.kmOtRaw)));
const kmActualFmt = computed(() => fmtCL(parseIntLoose(form.value.kmActualRaw)));
const proximaMantencionFmt = computed(() => fmtCL(parseIntLoose(form.value.proximaMantencionRaw)));

const cuerpoPrincipal = computed(() => {
  if (form.value.tipo === "OPERATIVIDAD") {
    return "se encuentra con sus mantenciones y revisiones al día según la pauta del fabricante, encontrándose en condiciones para operar con normalidad en minería.";
  }

  if (form.value.equipoNuevo) {
    return "aún no cumple con el kilometraje para poder realizar la primera mantención programada.";
  }
  return "se encuentra con sus mantenciones y revisiones al día según la pauta del fabricante, encontrándose en condiciones para operar con normalidad en minería.";
});


const hasPreview = computed(() => !!(selectedEquipo.value && form.value.patente && form.value.numeroInterno));

const canSave = computed(() => {
  if (!selectedEquipo.value) return false;
  if (!form.value.patente || !form.value.numeroInterno) return false;

  if (form.value.tipo === "MANTENCION") {
    if (!form.value.equipoNuevo) {
      if (!form.value.ultimaOt) return false;
      if (!form.value.fechaUltimaOt) return false;
      if (!Number.isFinite(parseIntLoose(form.value.kmOtRaw)) || parseIntLoose(form.value.kmOtRaw) <= 0) return false;
    }
    if (!Number.isFinite(parseIntLoose(form.value.kmActualRaw)) || parseIntLoose(form.value.kmActualRaw) <= 0) return false;
  } else {
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

async function resolveCounterDocId() {
  if (counterDocId.value) return counterDocId.value;

  const colRef = collection(db, "counters_certificados");
  const snap = await getDocs(query(colRef, limit(1)));

  if (!snap.empty) {
    counterDocId.value = snap.docs[0].id;
    return counterDocId.value;
  }

  counterDocId.value = "global";
  return counterDocId.value;
}

async function cargarProximoNumero() {
  loadingCounter.value = true;
  try {
    const id = await resolveCounterDocId();
    const ref = doc(db, "counters_certificados", id);

    const snap = await getDoc(ref);
    const raw = snap.exists() ? Number(snap.data()?.next) : 1;
    const nextVal = Number.isFinite(raw) && raw >= 1 ? raw : 1;

    counterNext.value = nextVal;
  } catch (e) {
    console.error(e);
    counterNext.value = 1;
  } finally {
    loadingCounter.value = false;
  }
}

function buildPayload(numeroAsignado) {
  const payload = {
    tipo: form.value.tipo,
    numero: numeroAsignado,
    ciudad,
    fechaEmisionStr: form.value.fechaEmision,
    unidadLectura: form.value.unidadLectura || "Km",

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

    texto: {
      cuerpoPrincipal: cuerpoPrincipal.value,
    },

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
  } else {
    payload.operatividad = {
      estado: form.value.estadoOperatividad || "",
      fechaInspeccionStr: form.value.fechaInspeccion || "",
      observaciones: form.value.observaciones || "",
    };
  }

  return payload;
}

async function fetchAsArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar asset: " + url);
  return await res.arrayBuffer();
}


async function buildPdfBytes({ numero}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.08, 0.08, 0.08);
  const borderColor = rgb(0.18, 0.18, 0.18);

  const unidadLocal = form.value.unidadLectura || "Km";

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

  {
    const isOp = form.value.tipo === "OPERATIVIDAD";
    const isMant = form.value.tipo === "MANTENCION";

    let stampSrc = null;
    if (isOp) stampSrc = timbreOperativoSrc;
    if (isMant) stampSrc = timbreCheckSrc;

    if (stampSrc) {
      const stampBytes = await fetchAsArrayBuffer(stampSrc);
      const stamp = await pdfDoc.embedPng(stampBytes);

      const stampW = 140;
      const stampH = (stamp.height / stamp.width) * stampW;

      const stampX = M + 16;
      const stampY = M + 22;

      const opacity = isOp ? 0.34 : 0.28;

      page.drawImage(stamp, {
        x: stampX,
        y: stampY,
        width: stampW,
        height: stampH,
        opacity,
      });
    }
  }


  let y = height - M - innerPad;

  const logoMiningBytes = await fetchAsArrayBuffer(logoMiningSrc);
  const logoMining = logoMiningSrc.toLowerCase().includes(".png")
    ? await pdfDoc.embedPng(logoMiningBytes)
    : await pdfDoc.embedJpg(logoMiningBytes);

  const logoMiningW = 165;
  const logoMiningH = (logoMining.height / logoMining.width) * logoMiningW;

  page.drawImage(logoMining, {
    x: contentLeft,
    y: y - logoMiningH + 6,
    width: logoMiningW,
    height: logoMiningH,
  });

  drawRight(`CERTIFICADO N° ${numero}`, y - 4, 10.5, bold, dark);
  drawRight(`${ciudad}, ${fmtDMY(form.value.fechaEmision)}`, y - 20, 9.8, font, dark);

  y -= (logoMiningH + 24);

  const tipoTxt = form.value.tipo === "MANTENCION" ? "MANTENCIÓN" : "OPERATIVIDAD";
  drawCentered(`CERTIFICADO DE ${tipoTxt}`, y, 12.5, bold, dark);
  y -= 32;

  const bodySize = 9.3;
  const lineH = 14;
  const blockW = Math.min(470, contentWidth);

  const placa = form.value.patente || "—";
  const interno = form.value.numeroInterno || "—";

  const cuerpoOperatividad =
    "se encuentra con sus mantenciones y revisiones al día según la pauta del fabricante, encontrándose en condiciones para operar con normalidad en minería.";

  const intro =
    `Xtreme Mining Ltda. Mediante el presente documento, certifica que el equipo identificado con la placa ${placa} ` +
    `Número interno ${interno}, ` +
    (form.value.tipo === "OPERATIVIDAD" ? cuerpoOperatividad : cuerpoPrincipal.value);

  y = drawWrappedBlockLeft(intro, y, bodySize, blockW, lineH, font, dark);
  y -= 10;


  const debeMostrarUltimaMantencion =
    (form.value.tipo === "MANTENCION" && !form.value.equipoNuevo) ||
    (form.value.tipo === "OPERATIVIDAD");

  if (debeMostrarUltimaMantencion) {
    const lecturaOT = fmtCL(parseIntLoose(form.value.kmOtRaw));
    const ultimaOT = form.value.ultimaOt || "—";
    const fechaUlt = fmtDMY(form.value.fechaUltimaOt);

    const p1 =
      `Su última mantención realizada el ${fechaUlt} a los ${lecturaOT}${unidadLocal} y registrada con la orden de trabajo ` +
      `${ultimaOT}. Constata que la unidad se encuentra en condición estándar, tanto en su parte mecánica, hidráulica y estructural.`;

    y = drawWrappedBlockLeft(p1, y, bodySize, blockW, lineH, font, dark);
    y -= 10;

    const p2 =
      "Mantención realizada por personal calificado y certificado por representante de la marca de acuerdo a documento anexo.";

    y = drawWrappedBlockLeft(p2, y, bodySize, blockW, lineH, font, dark);
    y -= 16;
  }


  if (form.value.tipo === "MANTENCION" && form.value.equipoNuevo) {
    const pNew =
      "Se señala que el equipo es nuevo, y que se encuentra en óptimas condiciones para operar con normalidad en minería.";
    y = drawWrappedBlockLeft(pNew, y, bodySize, blockW, lineH, font, dark);
    y -= 16;
  }

  drawCentered("Detalles del equipo", y, 10.5, bold, dark);
  y -= 18;

  const lectura = fmtCL(parseIntLoose(form.value.kmActualRaw));
  const prox = fmtCL(parseIntLoose(form.value.proximaMantencionRaw));

  const rowsAll = [
    ["* Marca:", form.value.marca || "—"],
    ["* Modelo:", form.value.modelo || "—"],
    ["* Tipo de equipo:", form.value.tipoEquipo || "—"],
    ["* N° Chasis:", form.value.numeroChasis || "—"],
    ["* N° Motor:", form.value.numeroMotor || "—"],
    ["* N° Interno:", form.value.numeroInterno || "—"],
    ["* Lectura actual:", `${lectura}${lectura === "—" ? "" : ` ${unidadLocal}`}`],
    ...(form.value.tipo === "MANTENCION"
      ? [["* Próxima Mantención:", `${prox}${prox === "—" ? "" : ` ${unidadLocal}`}`]]
      : []),
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

  const signLineY = M + 120;
  page.drawLine({
    start: { x: width / 2 - 105, y: signLineY },
    end: { x: width / 2 + 105, y: signLineY },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });

  if (firmaSrc) {
    const sigBytes = await fetchAsArrayBuffer(firmaSrc);
    const sig = firmaSrc.toLowerCase().includes(".png")
      ? await pdfDoc.embedPng(sigBytes)
      : await pdfDoc.embedJpg(sigBytes);

    const sigW = 170;
    const sigH = (sig.height / sig.width) * sigW;

    page.drawImage(sig, {
      x: (width - sigW) / 2,
      y: signLineY + 12,
      width: sigW,
      height: sigH,
    });
  }

  drawCentered(FIRMANTE.nombre, signLineY - 18, 10, bold, dark);
  drawCentered(FIRMANTE.rut, signLineY - 32, 9.2, font, dark);
  drawCentered(FIRMANTE.cargo, signLineY - 46, 9.2, font, dark);



  return await pdfDoc.save();
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

async function generarPdfSolo() {
  if (!hasPreview.value) return;

  const numeroTemp = displayNumero.value === "—" ? "SN" : displayNumero.value;
  const bytes = await buildPdfBytes({ numero: numeroTemp, idDoc: "SIN_GUARDAR", onlyPdf: true });

  downloadPdf(bytes, buildPdfFilename());
}


async function guardarCertificado() {
  saving.value = true;
  saveOk.value = false;
  saveErr.value = "";
  lastSavedId.value = "";

  try {
    const certificadosRef = collection(db, "certificados");
    const id = await resolveCounterDocId();
    const counterRef = doc(db, "counters_certificados", id);

    const result = await runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef);

      const nextRaw = counterSnap.exists() ? Number(counterSnap.data()?.next) : 1;
      const nextVal = Number.isFinite(nextRaw) && nextRaw >= 1 ? nextRaw : 1;

      const numeroAsignado = nextVal;
      const nextToStore = nextVal + 1;

      tx.set(counterRef, { next: nextToStore, updatedAt: serverTimestamp() }, { merge: true });

      const newDocRef = doc(certificadosRef);
      const payload = buildPayload(numeroAsignado);
      tx.set(newDocRef, payload);

      return { id: newDocRef.id, numero: numeroAsignado, next: nextToStore };
    });

    form.value.numero = result.numero;
    counterNext.value = result.next;
    lastSavedId.value = result.id;
    saveOk.value = true;

    const bytes = await buildPdfBytes({ numero: result.numero, idDoc: result.id, onlyPdf: false });
    downloadPdf(bytes, buildPdfFilename());
  } catch (err) {
    console.error(err);
    saveErr.value = "Error guardando o generando PDF. Revisa consola y reglas/permisos de Firestore.";
  } finally {
    saving.value = false;
  }
}


function scrollToPreview() {
  const el = previewRef.value;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function safeFilePart(str) {
  return String(str || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ");
}

function buildPdfFilename() {
  const prefix = form.value.tipo === "MANTENCION" ? "C.MANTENCION" : "C.OPERATIVIDAD";

  const codigoEquipo = safeFilePart(form.value.numeroInterno || form.value.codigo || "SIN-CODIGO");

  const fecha = safeFilePart(fmtDMY(form.value.fechaEmision || todayISO()));

  return `${prefix} ${codigoEquipo} ${fecha}.pdf`;
}

function resetAll() {
  selectedEquipo.value = null;
  equipoSearch.value = "";
  form.value.numero = null;

  form.value.tipo = "MANTENCION";
  form.value.unidadLectura = "Km";

  form.value.equipoNuevo = false;
  form.value.ultimaOt = "";
  form.value.fechaUltimaOt = "";
  form.value.kmOtRaw = "";
  form.value.kmActualRaw = "";
  form.value.intervaloRaw = "10000";
  form.value.proximaMantencionRaw = "";
  form.value.estadoOperatividad = "Operativo";
  form.value.fechaInspeccion = todayISO();
  form.value.observaciones = "";
  form.value.patente = "";
  form.value.numeroInterno = "";
  form.value.marca = "";
  form.value.modelo = "";
  form.value.tipoEquipo = "";
  form.value.numeroChasis = "";
  form.value.numeroMotor = "";

  saveOk.value = false;
  saveErr.value = "";
  lastSavedId.value = "";

  cargarProximoNumero();
}

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
</style>
