<!-- src/views/VerifyCertificado.vue -->
<template>

    <div class="container py-4 py-lg-5">
      <div class="text-center mb-4 mb-lg-5">
        <div class="verify-badge mx-auto mb-3">
          <i class="bi bi-patch-check-fill"></i>
        </div>
        <h1 class="verify-title mb-2">Verificación de Certificado</h1>
        <p class="verify-subtitle mb-0">
          Validación oficial del certificado registrado en el sistema.
        </p>
      </div>

      <div v-if="busy" class="row justify-content-center">
        <div class="col-12 col-xl-9">
          <div class="card border-0 shadow-lg verify-card">
            <div class="card-body p-4 p-lg-5 text-center">
              <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
              <h4 class="fw-bold mb-2">Verificando certificado...</h4>
              <div class="text-muted">
                Estamos consultando la información en Firestore.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="err" class="row justify-content-center">
        <div class="col-12 col-xl-9">
          <div class="card border-0 shadow-lg verify-card error-card">
            <div class="card-body p-4 p-lg-5">
              <div class="text-center mb-4">
                <div class="status-icon danger mx-auto mb-3">
                  <i class="bi bi-x-octagon-fill"></i>
                </div>
                <h3 class="fw-bold mb-2">Certificado no válido</h3>
                <p class="text-muted mb-0">
                  No fue posible verificar este certificado.
                </p>
              </div>

              <div class="alert alert-danger border-0 soft-danger mb-0 text-center">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ err }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="cert" class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <div
            class="card border-0 shadow-lg verify-card overflow-hidden"
            :class="isVigente ? 'success-card' : 'expired-card'"
          >
            <div class="top-banner">
              <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="status-icon" :class="isVigente ? 'success' : 'warning'">
                    <i
                      class="bi"
                      :class="isVigente ? 'bi-shield-check' : 'bi-exclamation-triangle'"
                    ></i>
                  </div>

                  <div>
                    <div class="text-white-50 small text-uppercase fw-semibold mb-1">
                      Estado del certificado
                    </div>
                    <h2 class="mb-1 fw-bold text-white">
                      {{ isVigente ? "Certificado Verificado" : "Certificado Vencido" }}
                    </h2>
                    <div class="text-white-50">
                      {{ isVigente ? "Documento válido y vigente" : "La vigencia del documento expiró" }}
                    </div>
                  </div>
                </div>

                <div class="text-lg-end">
                  <div class="banner-pill">
                    <i class="bi bi-calendar-check me-2"></i>
                    Vence el {{ fmtDMY(vigenciaHastaCalculada) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="card-body p-4 p-lg-5">
              <div class="row g-4">
                <div class="col-12 col-lg-7">
                  <div class="section-card mb-4">
                    <div class="section-title">
                      <i class="bi bi-file-earmark-check me-2"></i>
                      Información del certificado
                    </div>

                    <div class="info-grid">
                      <div class="info-item">
                        <span class="label">N° Certificado</span>
                        <span class="value">#{{ cert.numero || "—" }}</span>
                      </div>

                      <div class="info-item">
                        <span class="label">Tipo</span>
                        <span class="value">
                          <span class="badge rounded-pill text-bg-light border px-3 py-2">
                            {{ tipoLabel }}
                          </span>
                        </span>
                      </div>

                      <div class="info-item">
                        <span class="label">Fecha de emisión</span>
                        <span class="value">{{ fmtDMY(cert.fechaEmisionStr) }}</span>
                      </div>

                      <div class="info-item">
                        <span class="label">Vigencia</span>
                        <span class="value">{{ vigenciaMesesLabel }}</span>
                      </div>

                      <div class="info-item">
                        <span class="label">Válido hasta</span>
                        <span class="value fw-bold">
                          {{ fmtDMY(vigenciaHastaCalculada) }}
                        </span>
                      </div>

                      <div class="info-item">
                        <span class="label">Estado</span>
                        <span class="value">
                          <span
                            class="badge rounded-pill px-3 py-2"
                            :class="isVigente ? 'text-bg-success' : 'text-bg-warning text-dark'"
                          >
                            <i
                              class="bi me-1"
                              :class="isVigente ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"
                            ></i>
                            {{ isVigente ? "Vigente" : "Vencido" }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="section-card" v-if="cert.texto?.cuerpoPrincipal">
                    <div class="section-title">
                      <i class="bi bi-card-text me-2"></i>
                      Descripción
                    </div>
                    <p class="mb-0 description-text">
                      {{ cert.texto.cuerpoPrincipal }}
                    </p>
                  </div>
                </div>

                <div class="col-12 col-lg-5">
                  <div class="section-card mb-4">
                    <div class="section-title">
                      <i class="bi bi-truck me-2"></i>
                      Equipo asociado
                    </div>

                    <div class="side-list">
                      <div class="side-item">
                        <span>Patente</span>
                        <strong>{{ cert.equipo?.patente || "—" }}</strong>
                      </div>
                      <div class="side-item">
                        <span>N° Interno</span>
                        <strong>{{ cert.equipo?.numeroInterno || "—" }}</strong>
                      </div>
                      <div class="side-item">
                        <span>Marca</span>
                        <strong>{{ cert.equipo?.marca || "—" }}</strong>
                      </div>
                      <div class="side-item">
                        <span>Modelo</span>
                        <strong>{{ cert.equipo?.modelo || "—" }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="section-card">
                    <div class="section-title">
                      <i class="bi bi-person-badge me-2"></i>
                      Firmante
                    </div>

                    <div class="side-list">
                      <div class="side-item">
                        <span>Nombre</span>
                        <strong>{{ cert.firmante?.nombre || "—" }}</strong>
                      </div>
                      <div class="side-item">
                        <span>RUT</span>
                        <strong>{{ cert.firmante?.rut || "—" }}</strong>
                      </div>
                      <div class="side-item">
                        <span>Cargo</span>
                        <strong>{{ cert.firmante?.cargo || "—" }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="footer-note mt-4" :class="isVigente ? 'footer-ok' : 'footer-warning'">
                <i
                  class="bi me-2"
                  :class="isVigente ? 'bi-patch-check-fill' : 'bi-clock-history'"
                ></i>
                <span v-if="isVigente">
                  Este certificado se encuentra validado y vigente hasta el
                  <strong>{{ fmtDMY(vigenciaHastaCalculada) }}</strong>.
                </span>
                <span v-else>
                  Este certificado se encuentra vencido desde el
                  <strong>{{ fmtDMY(vigenciaHastaCalculada) }}</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="row justify-content-center">
        <div class="col-12 col-xl-8">
          <div class="card border-0 shadow-lg verify-card">
            <div class="card-body p-4 p-lg-5 text-center">
              <div class="status-icon neutral mx-auto mb-3">
                <i class="bi bi-qr-code-scan"></i>
              </div>
              <h3 class="fw-bold mb-2">No se recibió un código de verificación</h3>
              <p class="text-muted mb-0">
                Abre esta página desde el QR del certificado para validar automáticamente el documento.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-4">
        <small class="text-muted">
          Sistema de validación de certificados
        </small>
      </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const DATABASE_ID = "rollback-2025-10-25";
const app = getApp();
const db = getFirestore(app, DATABASE_ID);

const busy = ref(false);
const err = ref("");
const cert = ref(null);

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtDMY(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return "—";
  return `${d}-${m}-${y}`;
}

function normalizeTipo(tipo) {
  return String(tipo || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function addMonthsToISO(isoDate, monthsToAdd) {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).split("-").map(Number);
  if (!y || !m || !d) return "";

  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + Number(monthsToAdd || 0));

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function extractIdFromValue(value) {
  const v = String(value || "").trim();
  if (!v) return "";

  try {
    if (v.includes("?")) {
      const u = new URL(v, window.location.origin);
      const id = u.searchParams.get("c");
      return id || "";
    }
  } catch (e) {
    console.log(e);
  }

  const m = v.match(/(?:\?|&|^)c=([^&]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  return v;
}

function getVigenciaMesesByTipo(tipo) {
  const t = normalizeTipo(tipo);

  if (t.includes("mantencion") || t.includes("mantencion")) return 9;
  if (t.includes("torque")) return 3;
  if (t.includes("operatividad")) return 3;

  return 3;
}

const tipoLabel = computed(() => {
  const t = normalizeTipo(cert.value?.tipo);

  if (t.includes("mantencion")) return "Mantención";
  if (t.includes("torque")) return "Torque";
  if (t.includes("operatividad")) return "Operatividad";

  return cert.value?.tipo || "—";
});

const vigenciaMeses = computed(() => {
  return getVigenciaMesesByTipo(cert.value?.tipo);
});

const vigenciaMesesLabel = computed(() => {
  return `${vigenciaMeses.value} meses`;
});

const vigenciaHastaCalculada = computed(() => {
  const fecha = cert.value?.fechaEmisionStr;
  if (!fecha) return "";
  return addMonthsToISO(fecha, vigenciaMeses.value);
});

const isVigente = computed(() => {
  if (!vigenciaHastaCalculada.value) return false;
  return todayISO() <= vigenciaHastaCalculada.value;
});

async function verifyById(id) {
  if (!id) {
    err.value = "No se detectó un código de verificación válido.";
    cert.value = null;
    return;
  }

  busy.value = true;
  err.value = "";
  cert.value = null;

  try {
    const snap = await getDoc(doc(db, "certificados", id));

    if (!snap.exists()) {
      err.value = "Certificado no encontrado o ya no disponible.";
      return;
    }

    const data = snap.data() || {};

    cert.value = {
      numero: data.numero || 0,
      tipo: data.tipo || "",
      fechaEmisionStr: data.fechaEmisionStr || "",
      equipo: data.equipoSnapshot || {},
      firmante: data.firmante || {},
      texto: data.texto || {},
    };
  } catch (e) {
    console.error(e);
    err.value = "Error consultando Firestore. Revisa permisos, reglas o conexión.";
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const c = params.get("c");
  const id = extractIdFromValue(c || "");
  if (id) verifyById(id);
});
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(25, 135, 84, 0.10), transparent 30%),
    radial-gradient(circle at top right, rgba(13, 110, 253, 0.10), transparent 30%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.verify-title {
  font-size: clamp(1.7rem, 2vw, 2.4rem);
  font-weight: 800;
  color: #152033;
  letter-spacing: -0.02em;
}

.verify-subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.verify-badge {
  width: 78px;
  height: 78px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: #198754;
  background: linear-gradient(135deg, rgba(25, 135, 84, 0.12), rgba(25, 135, 84, 0.06));
  border: 1px solid rgba(25, 135, 84, 0.15);
  box-shadow: 0 10px 30px rgba(25, 135, 84, 0.12);
}

.verify-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
}

.top-banner {
  padding: 1.5rem 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.success-card .top-banner {
  background: linear-gradient(135deg, #0f5132 0%, #198754 100%);
}

.expired-card .top-banner {
  background: linear-gradient(135deg, #7c5a00 0%, #d39e00 100%);
}

.banner-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 1.15rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.status-icon {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.status-icon.success {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.status-icon.warning {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.status-icon.danger {
  background: rgba(220, 53, 69, 0.12);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.14);
}

.status-icon.neutral {
  background: rgba(108, 117, 125, 0.12);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.14);
}

.section-card {
  background: #ffffff;
  border: 1px solid #e9eef5;
  border-radius: 22px;
  padding: 1.2rem;
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.04);
}

.section-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  gap: 0.85rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  background: #f8fafc;
}

.info-item .label {
  color: #6b7280;
  font-size: 0.92rem;
}

.info-item .value {
  color: #111827;
  font-weight: 700;
  text-align: right;
}

.side-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.side-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.side-item span {
  color: #6b7280;
  font-size: 0.92rem;
}

.side-item strong {
  color: #111827;
  text-align: right;
}

.description-text {
  color: #374151;
  line-height: 1.7;
  white-space: pre-line;
}

.footer-note {
  border-radius: 18px;
  padding: 1rem 1.15rem;
  font-weight: 500;
}

.footer-ok {
  background: rgba(25, 135, 84, 0.08);
  color: #0f5132;
  border: 1px solid rgba(25, 135, 84, 0.15);
}

.footer-warning {
  background: rgba(255, 193, 7, 0.12);
  color: #7a5900;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.error-card {
  background: rgba(255, 255, 255, 0.98);
}

.soft-danger {
  background: rgba(220, 53, 69, 0.08);
  color: #842029;
}

@media (max-width: 991.98px) {
  .top-banner {
    padding: 1.25rem;
  }

  .verify-card {
    border-radius: 22px;
  }

  .section-card {
    border-radius: 18px;
    padding: 1rem;
  }

  .info-item,
  .side-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-item .value,
  .side-item strong {
    text-align: left;
  }
}
</style>
