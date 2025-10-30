<!-- src/views/GeneradorOCTaller.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="generador-oc-page">
    <div class="container py-4 py-md-5">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">Generador OC (Taller)</h1>

        <button
          class="btn btn-secondary btn-sm"
          @click="toggleEquiposPanel"
          :aria-pressed="mostrarEquipos.toString()">
          <i class="bi bi-search me-1"></i> {{ mostrarEquipos ? 'Ocultar' : 'Buscar' }} equipos
        </button>
      </div>

      <!-- Toggle: Historial OC Taller (mes actual) -->
      <div class="d-flex justify-content-end mb-2">
        <button
          class="btn btn-secondary btn-sm"
          @click="toggleOCTallerMes"
          :aria-pressed="mostrarOCTallerMes.toString()">
          <i class="bi bi-receipt-cutoff me-1"></i>
          {{ mostrarOCTallerMes ? 'Ocultar OC del mes' : 'Mostrar mis OC' }}
        </button>
      </div>

      <!-- Card: OC Taller del mes actual -->
      <div v-if="mostrarOCTallerMes" class="card mb-3">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">🧾 OC Taller (mes actual)</div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ ocTallerMes.length }} en total</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargandoOCTallerMes" class="p-3 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="ocTallerMes.length === 0" class="p-3 text-secondary text-center">
            No hay órdenes enviadas este mes.
          </div>

          <div v-else class="list-group list-group-flush">
            <div
              class="list-group-item d-flex align-items-start"
              v-for="oc in ocTallerMesPaged"
              :key="oc.__docId"
            >
              <div class="me-auto">
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-semibold">N° {{ oc.id ?? '—' }}</span>
                  <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || '—' }}</span>
                </div>

                <div class="small text-secondary mt-1">
                  <strong>Centro:</strong> {{ oc.centroCostoTexto || '—' }} ·
                  <strong>Moneda:</strong> {{ oc.moneda || '—' }} ·
                  <strong>Total:</strong> {{ (oc.precioTotalConIVA ?? 0).toLocaleString('es-CL') }}
                </div>
                <div class="small text-secondary">
                  <strong>Fecha:</strong> {{ fmtFecha(oc.fechaSubida) }}
                </div>

                <div v-if="oc.comentario" class="small mt-1">
                  <em>“{{ oc.comentario }}”</em>
                </div>
              </div>

              <div class="ms-2">
                <button class="btn btn-sm btn-outline-primary" @click="irADetalleOCTaller(oc)">
                  Ver detalle
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="!cargandoOCTallerMes && ocTallerMesTotalPages > 1" class="card-footer bg-white">
          <nav aria-label="Paginación OC Taller">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: ocTallerMesCurrentPage === 1 }">
                <button class="page-link" @click="ocTallerMesGoTo(ocTallerMesCurrentPage - 1)" :disabled="ocTallerMesCurrentPage === 1">«</button>
              </li>
              <li
                class="page-item"
                v-for="n in ocTallerMesVisiblePages"
                :key="'pg-ocmes-'+n"
                :class="{ active: ocTallerMesCurrentPage === n }">
                <button class="page-link" @click="ocTallerMesGoTo(n)">{{ n }}</button>
              </li>
              <li class="page-item" :class="{ disabled: ocTallerMesCurrentPage === ocTallerMesTotalPages }">
                <button class="page-link" @click="ocTallerMesGoTo(ocTallerMesCurrentPage + 1)" :disabled="ocTallerMesCurrentPage === ocTallerMesTotalPages">»</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Layout principal -->
      <div class="row g-3">
        <!-- Columna izquierda -->
        <div class="col-12" :class="mostrarEquipos ? 'col-lg-8' : 'col-lg-12'">
          <!-- Card principal -->
          <div class="card card-elevated position-relative overflow-hidden">
            <div class="card-header  d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Subir Cotización (Taller)</div>
            </div>

            <div class="card-body">
              <!-- Nº de Cotización (ID correlativo) -->
              <div class="mb-3">
                <label class="form-label">N° de Cotización</label>
                <div class="input-group">
                  <span class="input-group-text">N°</span>
                  <input
                    class="form-control fw-semibold"
                    :class="{'border-primary': !!nuevoIdVisual}"
                    type="text"
                    :value="(nuevoIdVisual ?? '—').toString()"
                    readonly>
                </div>
              </div>

              <!-- Asociar SOLPED -->
              <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="swSolped" v-model="usarSolped" @change="onToggleUsarSolped">
                <label class="form-check-label" for="swSolped">¿Asociar a una SOLPED?</label>
              </div>

              <!-- Selector SOLPED -->
              <div v-if="usarSolped" class="row g-2 align-items-end">
                <div class="col-12">
                  <label class="form-label">SOLPED asociada</label>
                  <select class="form-select" v-model="solpedSeleccionadaId" @change="onChangeSolped">
                    <option value="">— Selecciona —</option>
                    <option
                      v-for="solpe in solpedDisponibles"
                      :key="solpe.id"
                      :value="solpe.id">
                      #{{ solpe.numero_solpe }} - {{ solpe.nombre_solped }} ({{ solpe.tipo_solped }}) ·
                      {{ solpe.nombre_centro_costo }} · {{ solpe.usuario || '—' }} · {{ solpe.empresa || '—' }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Ficha SOLPED -->
              <div v-if="usarSolped && solpedSeleccionada" class="row g-3 mt-1">
                <div class="col-12 col-md-4">
                  <div class="small text-secondary">N° SOLPED</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.numero_solpe }}</div>
                </div>
                <div class="col-12 col-md-8">
                  <div class="small text-secondary">Centro de Costo</div>
                  <div class="fw-semibold">
                    <template v-if="solpedSeleccionada.centro_costo && solpedSeleccionada.nombre_centro_costo">
                      {{ solpedSeleccionada.centro_costo }} — {{ solpedSeleccionada.nombre_centro_costo }}
                    </template>
                    <template v-else>
                      {{ solpedSeleccionada.nombre_centro_costo || solpedSeleccionada.centro_costo || '—' }}
                    </template>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Empresa</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.empresa }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Tipo / Nombre</div>
                  <div class="fw-semibold">
                    {{ solpedSeleccionada.tipo_solped }}
                  </div>
                </div>
              </div>

              <!-- Ítems de SOLPED -->
              <div v-if="usarSolped && itemsSolped.length" class="card mt-3">
                <div class="card-header bg-white">
                  <span class="fw-semibold">📦 Ítems de la SOLPED</span>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th style="width: 48px;">Ítem</th>
                          <th>Descripción</th>
                          <th class="text-center">Cant. total</th>
                          <th class="text-center">Cotizado antes</th>
                          <th style="width: 160px;">Cant. a cotizar</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in itemsSolped" :key="it.__tempId">
                          <td>{{ it.item }}</td>
                          <td class="w-50">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada || 0 }}</td>
                          <td>
                            <input
                              type="number"
                              class="form-control form-control-sm"
                              min="0"
                              :max="Math.max(0, (it.cantidad || 0) - (it.cantidad_cotizada || 0))"
                              v-model.number="it.cantidad_para_cotizar" />
                            <div class="form-text">
                              Máx: {{ Math.max(0, (it.cantidad || 0) - (it.cantidad_cotizada || 0)) }}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Autorización adjunta de la SOLPED -->
                  <div v-if="autorizacionUrlRaw" class="alert alert-light d-flex align-items-center mt-3">
                    <i class="bi bi-paperclip me-2"></i>
                    <div class="me-auto">
                      <div class="fw-semibold mb-0">Autorización adjunta</div>
                      <div class="small">{{ autorizacionNombre || 'Archivo' }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <a :href="autorizacionUrlRaw" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Ver</a>
                      <a :href="autorizacionUrlRaw" :download="autorizacionNombre || 'autorizacion'" class="btn btn-sm btn-outline-secondary">Descargar</a>
                    </div>
                  </div>

                  <div v-if="autorizacionEsPDF" class="ratio ratio-16x9 mt-2">
                    <iframe :src="autorizacionUrlRaw + '#toolbar=0'" style="border:none;"></iframe>
                  </div>
                  <div v-else-if="autorizacionEsImagen" class="text-center mt-2">
                    <img :src="autorizacionUrlRaw" alt="Autorización" class="img-fluid rounded shadow-sm" style="max-height:500px; object-fit:contain;">
                  </div>
                </div>
              </div>

              <hr class="my-4">

              <!-- Centro de costo -->
              <div class="mb-3">
                <label class="form-label">Centro de Costo</label>
                <input class="form-control" v-model="centroCostoTexto" placeholder="Ej: THPV-31" />
                <div class="form-text" v-if="centroCostoTextoAyuda">
                  Sugerencia: {{ centroCostoTextoAyuda }}
                </div>
              </div>

              <!-- Empresa -->
              <div class="mb-3">
                <label class="form-label">Empresa</label>
                <select class="form-select" v-model="empresaSeleccionada">
                  <option value="Xtreme Servicios">Xtreme Servicios</option>
                </select>
              </div>

              <!-- Moneda + Precio -->
              <div class="row g-3 mt-1">
                <div class="col-12 col-md-4">
                  <label class="form-label">Moneda</label>
                  <select class="form-select" v-model="monedaSeleccionada" @change="onCambioMoneda">
                    <option value="CLP">CLP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="UF">UF</option>
                  </select>
                </div>
                <div class="col-12 col-md-8">
                  <label class="form-label">Precio Total con IVA</label>
                  <input class="form-control" type="text" :value="precioFormateado" @input="formatearPrecio($event)" placeholder="$ 0">
                  <div>
                    Se formatea automáticamente según moneda seleccionada.
                  </div>
                </div>
              </div>

              <!-- Aprobador sugerido -->
              <div v-if="aprobadorSugerido" class="alert alert-info d-flex align-items-center mt-3">
                <i class="bi bi-person-check me-2"></i>
                <div><strong>Aprobador sugerido:</strong> {{ aprobadorSugerido }}</div>
              </div>

              <!-- Comentario -->
              <div class="mb-3">
                <label class="form-label">Comentario</label>
                <textarea class="form-control" rows="3" v-model="comentario" placeholder="Agrega un comentario opcional…"></textarea>
              </div>

              <!-- Archivos (PDF/Imágenes) -> archivosStorage[] -->
              <div class="mb-3">
                <label class="form-label">Archivos PDF o Imagen (cotizaciones)</label>
                <div class="d-flex gap-2">
                  <input id="inputArchivo" type="file" multiple accept="application/pdf,image/*" class="d-none" @change="onMultipleFilesSelected">
                  <button class="btn btn-outline-primary" @click="abrirSelectorArchivos">
                    <i class="bi bi-paperclip me-1"></i> Seleccionar archivos
                  </button>
                </div>
              </div>

              <!-- Previews -->
              <div v-for="(archivo, i) in archivos" :key="archivo.__k" class="card mb-2">
                <div class="card-header  d-flex align-items-center">
                  <div class="fw-semibold me-auto">{{ archivo.name }}</div>
                  <button class="btn btn-sm btn-outline-danger" @click="eliminarArchivo(i)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="archivo.tipo?.includes('pdf')" class="ratio ratio-16x9">
                    <iframe v-if="archivo.previewUrl" :src="archivo.previewUrl" style="border:none;"></iframe>
                  </div>
                  <div v-else class="text-center">
                    <img v-if="archivo.previewUrl" :src="archivo.previewUrl" alt="Vista previa" class="img-fluid rounded shadow-sm" style="max-height:700px; object-fit:contain;">
                  </div>
                </div>
              </div>

              <!-- Enviar -->
              <div class="d-grid mt-3">
                <button class="btn btn-danger btn-lg" :disabled="enviando" @click="enviarOC">
                  <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
                  Enviar Cotización (Taller)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Panel de Equipos -->
        <div class="col-12 col-lg-4" v-if="mostrarEquipos">
          <div class="card h-100">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🔎 Buscar equipos</div>
              <button class="btn btn-sm btn-outline-secondary d-lg-none" @click="mostrarEquipos=false">
                Cerrar
              </button>
            </div>
            <div class="card-body d-flex flex-column">
              <div class="input-group mb-3">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  class="form-control"
                  placeholder="Escribe al menos 2 caracteres"
                  v-model="busquedaEquipo"
                  @input="aplicarFiltrosEquiposDebounced" />
              </div>

              <div v-if="(busquedaEquipo||'').trim().length < 2" class="text-center text-secondary py-3">
                Escribe para buscar. No se muestran datos hasta que ingreses al menos 2 caracteres.
              </div>

              <div v-if="cargandoEquipos" class="text-center py-3">
                <div class="spinner-border" role="status"></div>
                <div class="mt-2">Buscando…</div>
              </div>

              <div v-if="!cargandoEquipos && (busquedaEquipo||'').trim().length >= 2 && resultadosEquipos.length === 0" class="text-center text-secondary py-3">
                No se encontraron resultados.
              </div>

              <div
                class="list-group equipos-list flex-grow-1"
                v-if="pagedEquipos.length"
                style="max-height:72vh"
              >
                <div class="list-group-item p-3" v-for="e in pagedEquipos" :key="e.id || e.codigo">
                  <div class="d-flex align-items-start">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center mb-2">
                        <h6 class="mb-0 me-2">
                          <strong>{{ e.codigo || 'SIN CÓDIGO' }}</strong>
                        </h6>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">
                          {{ e.tipo_equipo || 'Tipo?' }}
                        </span>
                      </div>

                      <div class="row g-2 text-secondary small">
                        <div class="col-12 col-md-12">
                          <div><strong>Año:</strong> {{ e.ano || '—' }}</div>
                          <div><strong>Clasificación:</strong> {{ e.clasificacion1 || '—' }}</div>
                          <div><strong>Equipo:</strong> {{ e.equipo || '—' }}</div>
                          <div><strong>Localización:</strong> {{ e.localizacion || '—' }}</div>
                          <div><strong>Marca:</strong> {{ e.marca || '—' }}</div>
                          <div><strong>Modelo:</strong> {{ e.modelo || '—' }}</div>
                          <div><strong>N° Chasis:</strong> {{ e.numero_chasis || '—' }}</div>
                        </div>
                      </div>
                    </div>

                    <div class="ms-3">
                      <button class="btn btn-sm btn-outline-primary" @click="copiarEquipo(e)">
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Paginación Bootstrap -->
              <nav v-if="totalPages > 1" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Anterior">«</button>
                  </li>
                  <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                    <button class="page-link" @click="goToPage(n)">{{ n }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" aria-label="Siguiente">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { db } from "../stores/firebase";
import {
  collection, getDocs, getDoc, doc, query, where, orderBy, limit, addDoc, updateDoc,
  startAt, endAt, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

/* ====== OC Taller del mes (tiempo real + paginación) ====== */
const mostrarOCTallerMes = ref(false);
const cargandoOCTallerMes = ref(false);
const ocTallerMes = ref([]);
const ocTallerMesPageSize = 2;
const ocTallerMesCurrentPage = ref(1);
let _unsubOCTallerMes = null;

const ocTallerMesTotalPages = computed(() =>
  Math.max(1, Math.ceil(ocTallerMes.value.length / ocTallerMesPageSize))
);
const ocTallerMesVisiblePages = computed(() => {
  const maxButtons = 8;
  const pages = [];
  let start = Math.max(1, ocTallerMesCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(ocTallerMesTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const ocTallerMesPaged = computed(() => {
  const start = (ocTallerMesCurrentPage.value - 1) * ocTallerMesPageSize;
  return ocTallerMes.value.slice(start, start + ocTallerMesPageSize);
});
const ocTallerMesGoTo = (n) => {
  if (n < 1 || n > ocTallerMesTotalPages.value) return;
  ocTallerMesCurrentPage.value = n;
};

const rangoMesActual = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from, to };
};

const suscribirOCTallerMes = () => {
  if (_unsubOCTallerMes) { _unsubOCTallerMes(); _unsubOCTallerMes = null; }
  cargandoOCTallerMes.value = true;

  const { from, to } = rangoMesActual();

  try {
    const qy = query(
      collection(db, "ordenes_oc_taller"),
      where("estatus", "==", "Enviada a proveedor"),
      where("fechaSubida", ">=", from),
      where("fechaSubida", "<", to),
      orderBy("fechaSubida", "desc")
    );

    _unsubOCTallerMes = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach(docu => arr.push({ __docId: docu.id, ...docu.data() }));
      arr.sort((a,b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0));
      ocTallerMes.value = arr;
      ocTallerMesCurrentPage.value = 1;
      cargandoOCTallerMes.value = false;
    }, (err) => {
      console.warn("Index requerido o error en query con estatus==Enviada a proveedor:", err?.message || err);
      suscribirOCTallerMesFallback();
    });
  } catch (e) {
    console.warn("Fallo query principal, se usa fallback:", e?.message || e);
    suscribirOCTallerMesFallback();
  }
};

const suscribirOCTallerMesFallback = () => {
  if (_unsubOCTallerMes) { _unsubOCTallerMes(); _unsubOCTallerMes = null; }

  const { from, to } = rangoMesActual();
  const qy2 = query(
    collection(db, "ordenes_oc_taller"),
    where("fechaSubida", ">=", from),
    where("fechaSubida", "<", to),
    orderBy("fechaSubida", "desc")
  );

  _unsubOCTallerMes = onSnapshot(qy2, (snap) => {
    let arr = [];
    snap.forEach(docu => arr.push({ __docId: docu.id, ...docu.data() } ));
    arr = arr.filter(x => (x.estatus || "").toLowerCase() === "enviada a proveedor");
    arr.sort((a,b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0));
    ocTallerMes.value = arr;
    ocTallerMesCurrentPage.value = 1;
    cargandoOCTallerMes.value = false;
  }, (err) => {
    console.error("onSnapshot fallback:", err);
    cargandoOCTallerMes.value = false;
  });
};

const desuscribirOCTallerMes = () => {
  if (_unsubOCTallerMes) { _unsubOCTallerMes(); _unsubOCTallerMes = null; }
  ocTallerMes.value = [];
  ocTallerMesCurrentPage.value = 1;
  cargandoOCTallerMes.value = false;
};

const toggleOCTallerMes = () => {
  mostrarOCTallerMes.value = !mostrarOCTallerMes.value;
  if (mostrarOCTallerMes.value) suscribirOCTallerMes();
  else desuscribirOCTallerMes();
};

const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : null);
    if (!d) return "—";
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch { return "—"; }
};

const estadoBadgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("proveedor")) return "bg-primary-subtle text-primary-emphasis";
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("preaprob")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("escala")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

const router = useRouter();
const route = useRoute();
const volver = () => router.back();
const auth = useAuthStore();

/* ======= Estado base ======= */
const enviando = ref(false);
const usarSolped = ref(true);
const nuevoIdVisual = ref(null);
const comentario = ref("");

/* Equipos: oculto por defecto */
const mostrarEquipos = ref(false);
const toggleEquiposPanel = () => { mostrarEquipos.value = !mostrarEquipos.value; };

/* Campos principales del doc (taller) */
const centroCostoTexto = ref("");
const empresaSeleccionada = ref("Xtreme Servicios");
const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");
const aprobadorSugerido = ref("");

/* Reglas simples de aprobadores */
const tipoCambioUSD = 950;
const tipoCambioEUR = 1050;

/* Usuario actual */
const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");

/* ====== Asociación SOLPED (opcional) ====== */
const solpedDisponibles = ref([]);
const solpedSeleccionadaId = ref("");
const solpedSeleccionada = ref(null);
const itemsSolped = ref([]);

/* Autorización (derivada de la SOLPED) */
const autorizacionNombre = ref(null);
const autorizacionUrlRaw = ref(null);
const autorizacionEsPDF = ref(false);
const autorizacionEsImagen = ref(false);
const theAutorizacionReset = () => {
  autorizacionNombre.value = null;
  autorizacionUrlRaw.value = null;
  autorizacionEsPDF.value = false;
  autorizacionEsImagen.value = false;
};

/* ====== Archivos ====== */
const archivos = ref([]);

/* ===== Diccionario opcional código -> nombre legible (para hint) ===== */
const centrosCostoDict = {
  "27483":"CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA",
  "23302-CARPETAS":"CONTRATO 23302 CARPETAS",
  // agrega aquí el resto si quieres hints
};
const centroCostoTextoAyuda = computed(() => {
  const v = (centroCostoTexto.value || '').trim();
  return centrosCostoDict[v] || '';
});

/* ==== Files ==== */
const abrirSelectorArchivos = () => {
  const input = document.getElementById("inputArchivo");
  if (input) input.click();
};
const onMultipleFilesSelected = (e) => {
  const list = Array.from(e.target.files || []);
  for (const file of list) {
    if (!file || file.size === 0 || !file.type) {
      addToast("warning", `Archivo inválido: ${file?.name || 'desconocido'}`);
      continue;
    }
    archivos.value.push({
      file,
      name: file.name,
      tipo: file.type,
      previewUrl: URL.createObjectURL(file),
      __k: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`
    });
  }
  if (!archivos.value.length) addToast("warning", "Ningún archivo válido fue seleccionado.");
};
const eliminarArchivo = (idx) => {
  archivos.value.splice(idx, 1);
  addToast("success", "Archivo eliminado.");
};

/* ====== Toasts ====== */
const toasts = ref([]);
const addToast = (type, text, timeout = 2800) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

/* ====== Carga inicial ====== */
onMounted(async () => {
  await obtenerNombreUsuario();
  await cargarSolpedSolicitadas();
  await cargarSiguienteNumero();

  // Si vienes desde el historial con ?fromSolpedId=...
  const preId = (route?.query?.fromSolpedId || '').toString();
  if (preId) {
    usarSolped.value = true;
    solpedSeleccionadaId.value = preId;
    // ⚠️ Sólo cargamos la SOLPED. NO autollenamos "cantidad_para_cotizar".
    await onChangeSolped(); // deja cantidad_para_cotizar = 0 para cada ítem
  }
});

const obtenerNombreUsuario = async () => {
  try {
    const uid = myUid.value;
    if (!uid) return;

    // 1° prioridad: Usuarios/{uid}.fullName
    const dref = doc(db, "Usuarios", uid);
    const snap = await getDoc(dref);

    if (snap.exists()) {
      const data = snap.data() || {};
      usuarioActual.value = data.fullName || "";
    }

    // 2° fallback: auth.displayName
    if (!usuarioActual.value) {
      usuarioActual.value = auth?.user?.displayName || "";
    }
    // 3° fallback: auth.email
    if (!usuarioActual.value) {
      usuarioActual.value = auth?.user?.email || "";
    }
  } catch (e) {
    console.error(e);
  }
};


/* ====== SOLPED ====== */
const onToggleUsarSolped = () => {
  if (!usarSolped.value) {
    solpedSeleccionada.value = null;
    solpedSeleccionadaId.value = "";
    itemsSolped.value = [];
    theAutorizacionReset();
  }
  calcularAprobador();
};

const onChangeSolped = async () => {
  if (!solpedSeleccionadaId.value) {
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    theAutorizacionReset();
    return;
  }
  try {
    const dref = doc(db, "solped_taller", solpedSeleccionadaId.value);
    const snap = await getDoc(dref);
    if (snap.exists()) {
      const data = snap.data() || {};

      // Validar estado: sólo Pendiente o Parcial
      const st = (data.estatus || '').toString().trim().toLowerCase();
      if (!(st === 'pendiente' || st === 'parcial')) {
        addToast('warning', 'Esta SOLPED no está en estado Pendiente o Parcial.');
        solpedSeleccionada.value = null;
        solpedSeleccionadaId.value = '';
        itemsSolped.value = [];
        theAutorizacionReset();
        return;
      }

      solpedSeleccionada.value = data;

      // === AUTOCOMPLETAR: Centro de Costo (texto) ===
      centroCostoTexto.value =
        (data.nombre_centro_costo || data.centro_costo || data.numero_contrato || "").toString();

      // Autorización (si existe)
      autorizacionNombre.value = data.autorizacion_nombre || null;
      autorizacionUrlRaw.value = data.autorizacion_url || null;
      const guess = ((autorizacionNombre.value || autorizacionUrlRaw.value || "") + "").toLowerCase();
      autorizacionEsPDF.value = guess.endsWith(".pdf");
      autorizacionEsImagen.value = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(guess);

      // Ítems no completados
      const todos = Array.isArray(data.items) ? data.items : [];
      itemsSolped.value = todos
        .filter(it => (it.estado || "").toLowerCase() !== "completado")
        .map(it => ({
          ...it,
          cantidad_cotizada: it.cantidad_cotizada || 0,
          cantidad_para_cotizar: 0,
          __tempId: `${it.item}-${it.descripcion}`
        }));

      // Empresa sugerida desde la SOLPED
      if (data.empresa) {
        empresaSeleccionada.value = data.empresa;
      }
    }
  } catch(e){ console.error(e); }
};

/* ====== Moneda / precio / aprobador ====== */
const onCambioMoneda = () => { formatearPrecConValor(precioTotalConIVA.value); };
const formatearPrecio = (ev) => {
  const input = (ev?.target?.value ?? "").toString();
  const soloNumeros = input.replace(/\D/g, "");
  const valor = soloNumeros ? parseInt(soloNumeros, 10) : 0;
  formatearPrecConValor(valor);
};
const formatearPrecConValor = (valor) => {
  precioTotalConIVA.value = valor;
  const m = monedaSeleccionada.value || "CLP";
  try {
    precioFormateado.value = valor.toLocaleString("es-CL", {
      style: "currency",
      currency: m,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch {
    precioFormateado.value = `${m} ${valor.toLocaleString("es-CL")}`;
  }
  calcularAprobador();
};

const calcularAprobador = () => {
  let totalCLP = precioTotalConIVA.value;
  const mon = (monedaSeleccionada.value || "CLP").toUpperCase();
  if (mon === "USD") totalCLP *= tipoCambioUSD;
  else if (mon === "EUR") totalCLP *= tipoCambioEUR;

  const empresa = (empresaSeleccionada.value || "").toLowerCase();

  if (empresa === "xtreme servicios") {
    if (totalCLP <= 250000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Juan Cubillos";
    else aprobadorSugerido.value = "Alejandro Candia";
  }
};

/* ===== Helpers ===== */
function mapearItemsReglaRevision(itemsOrigen, numeroInternoTexto, moneda, totalConIVA, responsable, solpedId, solpedSel) {
  const salida = [];
  for (const it of itemsOrigen) {
    const cantAnt   = Number(it.cantidad_cotizada || 0);
    const cantNueva = Number(it.cantidad_para_cotizar || 0);
    const cantAct   = cantAnt + cantNueva;

    const estado            = cantNueva > 0 ? 'revision' : 'pendiente';
    const estado_cotizacion = cantNueva > 0 ? 'revision' : 'ninguno';

    salida.push({
      ...it,
      cantidad: Number(it.cantidad || 0),
      cantidad_cotizada: cantAct,
      cantidad_para_cotizar: cantNueva,
      estado,
      estado_cotizacion,
      codigo_referencial: it.codigo_referencial || 'SIN CÓDIGO',
      imagen_url: it.imagen_url ?? null,
      numero_interno: numeroInternoTexto || it.numero_interno || '',
      numero_solped: solpedSel?.numero_solpe || it.numero_solped || 0,
      moneda,
      precioTotalConIVA: totalConIVA,
      responsable,                  // << fullName
      solpedId,
      tipo_solped: solpedSel?.tipo_solped || it.tipo_solped || 'No definido',
      __tempId: it.__tempId
    });
  }
  return salida;
}


async function actualizarSolpedTaller_postOC(solpedId, itemsIngresados, nombreUsuario, ocNumero, ocDocId) {
  if (!solpedId) return;

  const dref = doc(db, 'solped_taller', solpedId);
  const ss = await getDoc(dref);
  if (!ss.exists()) return;

  const dataSol = ss.data() || {};
  const originales = Array.isArray(dataSol.items) ? dataSol.items : [];

  const actualizados = originales.map((it) => {
    const clave = `${it.item}-${it.descripcion}`;
    const upd = itemsIngresados.find((x) => x.__tempId === clave);
    if (!upd) return it;

    const ant = Number(it.cantidad_cotizada || 0);
    const nueva = Number(upd.cantidad_para_cotizar || 0);
    const final = ant + nueva;

    const estado = nueva > 0 ? 'pendiente' : 'pendiente';
    const estado_cotizacion = nueva > 0 ? 'revision' : 'ninguno';

    return { ...it, cantidad_cotizada: final, estado, estado_cotizacion };
  });

  await updateDoc(dref, { items: actualizados, estatus: 'Pendiente' });

  // Registro en subcolección historialEstados
  const hcoll = collection(db, 'solped_taller', solpedId, 'historialEstados');
  await addDoc(hcoll, {
    usuario: nombreUsuario,
    fecha: serverTimestamp(),
    estatus: 'Cotizando - Revisión Guillermo',
    detalle: `Se subió cotización (OC Taller N° ${ocNumero})`,
    ocId: ocDocId,
    ocNumero
  });
}

/* ====== Guardar OC (Taller) ====== */
const enviarOC = async () => {
  if (enviando.value) return;

  // Validaciones
  if (!centroCostoTexto.value.trim()) { addToast("warning","Ingresa Centro de Costo (texto)"); return; }
  if (!precioTotalConIVA.value || precioTotalConIVA.value <= 0) { addToast("warning","Precio inválido"); return; }
  if (!monedaSeleccionada.value) { addToast("warning","Selecciona moneda"); return; }
  if (usarSolped.value && !solpedSeleccionadaId.value) { addToast("warning","Selecciona una SOLPED o desactiva la opción"); return; }
  if (archivos.value.length === 0) { addToast("warning","Debes subir al menos un archivo de cotización"); return; }

  // Responsable: fullName desde obtenerNombreUsuario()
  const nombreUsuario = (usuarioActual.value || "").trim();
  if (!nombreUsuario) { addToast("danger", "No se encontró tu nombre (fullName)."); return; }

  // Comentario EXACTO del usuario (sin textos añadidos)
  const comentarioFinal = (comentario.value || "").trim();

  enviando.value = true;

  try {
    // Nuevo ID correlativo
    const qy = query(collection(db, "ordenes_oc_taller"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId = Number(lastId) + 1;

    // Aprobador / estatus inicial
    calcularAprobador();
    const aprobador = aprobadorSugerido.value || "";
    const estatusInicial = "Revisión Guillermo";

    // Subir archivos
    const storage = getStorage();
    const subidos = [];
    for (const a of archivos.value) {
      if (!a.file || a.file.size < 100) {
        console.warn("Archivo inválido o muy pequeño:", a?.name);
        continue;
      }
      const path = `ordenes_oc_taller/${newId}/${a.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, a.file);
      const url = await getDownloadURL(up.ref);
      subidos.push({ nombre: a.name, tipo: a.tipo, url });
    }

    // Ítems (si hay SOLPED)
    let itemsFinal = [];
    if (usarSolped.value && solpedSeleccionadaId.value && solpedSeleccionada.value) {
      itemsFinal = mapearItemsReglaRevision(
        itemsSolped.value,
        centroCostoTexto.value,
        monedaSeleccionada.value,
        precioTotalConIVA.value,
        nombreUsuario,
        solpedSeleccionadaId.value,
        solpedSeleccionada.value
      );
    }

    // Historial inicial (incluye el comentario del usuario)
    const historialEntry = {
      usuario: nombreUsuario,
      estatus: estatusInicial,
      fecha: new Date().toISOString(),
      comentario: comentarioFinal
    };

    // Documento a guardar
    const dataToSave = {
      id: newId,
      empresa: empresaSeleccionada.value,
      centroCostoTexto: centroCostoTexto.value,
      comentario: comentarioFinal,
      aprobadorSugerido: aprobador,
      aprobadoPor: "",
      estatus: estatusInicial,
      fechaAprobacion: null,
      fechaSubida: serverTimestamp(),
      archivosStorage: subidos,
      historial: [ historialEntry ],
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,
      responsable: nombreUsuario,
      ...(usarSolped.value && solpedSeleccionadaId.value ? {
        solpedId: solpedSeleccionadaId.value,
        numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
        tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
        items: itemsFinal
      } : {
        tipo_solped: "Sin SOLPED",
        items: []
      })
    };

    // Guardar
    const newRef = await addDoc(collection(db, "ordenes_oc_taller"), dataToSave);

    // Actualizar SOLPED (si aplica)
    if (usarSolped.value && solpedSeleccionadaId.value) {
      await actualizarSolpedTaller_postOC(
        solpedSeleccionadaId.value,
        itemsSolped.value,
        nombreUsuario,
        newId,
        newRef.id
      );
    }

    addToast("success","Cotización (Taller) enviada exitosamente.");
    router.push({ name: 'OrdenOCTallerDetalle', params: { id: newRef.id } });

    resetFormulario();
    await cargarSiguienteNumero();

    const inputEl = document.getElementById("inputArchivo");
    if (inputEl) inputEl.value = "";
  } catch (e) {
    console.error(e);
    addToast("danger","Error al enviar la cotización de Taller.");
  } finally {
    enviando.value = false;
  }
};


const irADetalleOCTaller = (ocOrId) => {
  const id = typeof ocOrId === 'string' ? ocOrId : (ocOrId?.__docId || ocOrId?.id || '');
  if (!id) {
    addToast('warning', 'No se pudo obtener el ID de la OC.');
    return;
  }
  router.push({ name: 'OrdenOCTallerDetalle', params: { id } });
};

function resetFormulario() {
  centroCostoTexto.value = "";
  empresaSeleccionada.value = "Xtreme Servicios";
  archivos.value = [];
  comentario.value = "";
  usarSolped.value = true;
  solpedSeleccionadaId.value = "";
  solpedSeleccionada.value = null;
  itemsSolped.value = [];
  precioTotalConIVA.value = 0;
  precioFormateado.value = "";
  aprobadorSugerido.value = "";
  monedaSeleccionada.value = "CLP";
}

/* ===== Panel Equipos (optimizado) ===== */
const busquedaEquipo = ref("");
const cargandoEquipos = ref(false);
const resultadosEquipos = ref([]);
const pageSize = 5;
const currentPage = ref(1);

const totalPages = computed(() => Math.max(1, Math.ceil(resultadosEquipos.value.length / pageSize)));
const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const pagedEquipos = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return resultadosEquipos.value.slice(start, start + pageSize);
});
const goToPage = (n) => { if (n < 1 || n > totalPages.value) return; currentPage.value = n; };

/* Campos a cubrir (más amplio) */
const camposBusqueda = [
  "codigo",
  "equipo",
  "clasificacion1",
  "tipo_equipo",
  "marca",
  "modelo",
  "descripcion",
  "patente",
  "numero_chasis",
  "localizacion"
];

/* Normalización */
const norm = (s) => String(s||'')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu,'')
  .toLowerCase()
  .trim();

/* Variantes de entrada (para prefix-search) */
const variantesDe = (s) => {
  const t = (s || "").trim();
  const v = norm(t);
  const start = v.charAt(0).toUpperCase() + v.slice(1);
  return [...new Set([t, v, t.toUpperCase(), start])].filter(Boolean);
};

/* Levenshtein light (recortado) */
function lev(a, b){
  a = (a||'').slice(0,64); b = (b||'').slice(0,64);
  const m = Array.from({length: a.length+1}, (_,i)=>[i]);
  for(let j=0;j<=b.length;j++){ m[0][j]=j; }
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+cost);
    }
  }
  return m[a.length][b.length];
}

/* Ranking: exacto > empieza-con > incluye > parecido */
function scoreEquipo(e, qNorm){
  const vals = [
    e.codigo, e.patente, e.descripcion, e.equipo,
    e.marca, e.modelo, e.numero_chasis, e.localizacion, e.clasificacion1, e.tipo_equipo
  ].filter(Boolean).map(v => norm(v));

  if (vals.includes(qNorm)) return 1000;

  const crit = ['codigo','patente','modelo','numero_chasis','equipo'].map(k => norm(e[k]||''));
  if (crit.some(v => v.startsWith(qNorm))) return 700;

  if (vals.some(v => v.includes(qNorm))) return 400;

  const near = crit.reduce((best, v) => Math.min(best, lev(v, qNorm)), 9);
  if (near <= 2) return 300 - (near * 50);

  return 0;
}

/* Debounce + cancelación + caché */
let debounce = null;
let lastSearchToken = 0;
const cacheResultados = new Map(); // key = query normalizada -> array

const aplicarFiltrosEquiposDebounced = () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    const q = (busquedaEquipo.value || "").trim();
    if (q.length >= 2) {
      buscarEquipos(q);
    } else {
      resultadosEquipos.value = [];
      currentPage.value = 1;
    }
  }, 450); // un poco más largo mejora UX y reduce lecturas
};


const buscarEquipos = async (q) => {
  const qNorm = norm(q);
  currentPage.value = 1;

  // Caché
  if (cacheResultados.has(qNorm)) {
    resultadosEquipos.value = cacheResultados.get(qNorm);
    return;
  }

  // Reutiliza resultados de un prefijo ya cacheado si existe (filtrado local)
  const pref = [...cacheResultados.keys()].find(k => qNorm.startsWith(k) && k.length >= 2);
  if (pref) {
    const base = cacheResultados.get(pref) || [];
    const filtradosLocal = base.filter(e => {
      const vals = [
        e.codigo, e.patente, e.descripcion, e.equipo,
        e.marca, e.modelo, e.numero_chasis, e.localizacion, e.clasificacion1, e.tipo_equipo
      ].filter(Boolean).map(v => norm(v));
      return vals.some(v => v.includes(qNorm));
    });
    if (filtradosLocal.length >= 10) {
      resultadosEquipos.value = filtradosLocal
        .map(r => ({ r, s: scoreEquipo(r, qNorm)}))
        .sort((a,b)=>b.s-a.s)
        .map(x=>x.r);
      cacheResultados.set(qNorm, resultadosEquipos.value);
      return;
    }
  }

  // Cancelación
  const token = ++lastSearchToken;
  cargandoEquipos.value = true;

  try {
    const variantes = variantesDe(q);
    const vistos = new Set();
    const acumulado = [];

    const perCampo = async (campo) => {
      const promesas = variantes.map(async (v) => {
        try {
          const qref = query(
            collection(db, "equipos"),
            orderBy(campo),
            startAt(v),
            endAt(v + "\uf8ff"),
            limit(25) // más pequeño que antes
          );
          const snap = await getDocs(qref);
          for (const d of snap.docs) {
            const item = { id: d.id, ...d.data() };
            if (!vistos.has(item.id)) {
              vistos.add(item.id);
              acumulado.push(item);
            }
          }
        } catch (e) {
          console.error(`Error buscando equipos por campo ${campo} y variante ${v}:`, e);
        }
      });
      await Promise.all(promesas);
    };

    // Campos críticos primero
    const criticos = ["codigo","patente","modelo","numero_chasis","equipo"];
    const secundarios = camposBusqueda.filter(c => !criticos.includes(c));
    await Promise.all(criticos.map(perCampo));

    // Complementa si quedó corto
    if (acumulado.length < 60) {
      await Promise.all(secundarios.map(perCampo));
    }

    if (token !== lastSearchToken) return; // petición obsoleta

    // Ranking y recorte
    const rankeados = acumulado
      .map(r => ({ r, s: scoreEquipo(r, qNorm) }))
      .filter(x => x.s > 0)
      .sort((a,b)=>b.s - a.s)
      .map(x => x.r);

    const finales = rankeados.length ? rankeados : acumulado.filter(e => {
      const vals = [
        e.codigo, e.patente, e.descripcion, e.equipo,
        e.marca, e.modelo, e.numero_chasis, e.localizacion, e.clasificacion1, e.tipo_equipo
      ].filter(Boolean).map(v => norm(v));
      return vals.some(v => v.includes(qNorm));
    });

    resultadosEquipos.value = finales.slice(0, 200);
    cacheResultados.set(qNorm, resultadosEquipos.value);
  } catch (e) {
    console.error("Error en búsqueda de equipos:", e);
    addToast("danger", "Error al buscar equipos.");
    resultadosEquipos.value = [];
  } finally {
    if (token === lastSearchToken) cargandoEquipos.value = false;
  }
};


const cargarSolpedSolicitadas = async () => {
  try {
    // Mostrar sólo Pendiente / Parcial para asociar
    let arr = [];
    try {
      const qy = query(
        collection(db, "solped_taller"),
        where("estatus", "in", ["Pendiente", "Parcial"])
      );
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      // Fallback sin índice
      const snap = await getDocs(collection(db, "solped_taller"));
      arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(x => ['pendiente','parcial'].includes(String(x.estatus||'').trim().toLowerCase()));
    }
    solpedDisponibles.value = arr.sort((a,b) => (a.numero_solpe||0) - (b.numero_solpe||0));
  } catch(e){ console.error(e); }
};

const cargarSiguienteNumero = async () => {
  try {
    const qy = query(collection(db, "ordenes_oc_taller"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const last = snap.docs[0]?.data()?.id || 0;
    nuevoIdVisual.value = Number(last) + 1;
  } catch {
    nuevoIdVisual.value = 1;
  }
};

const copiarEquipo = async (e) => {
  const texto =
`Código: ${e.codigo || '—'}
Equipo: ${e.equipo || '—'}
Marca/Modelo: ${e.marca || '—'} / ${e.modelo || '—'}
N° Chasis: ${e.numero_chasis || '—'}
Localización: ${e.localizacion || '—'}
Año: ${e.ano || '—'}
Tipo: ${e.tipo_equipo || '—'}
Clasificación: ${e.clasificacion1 || '—'}`;
  try {
    await navigator?.clipboard?.writeText(texto);
    addToast("success","Datos copiados al portapapeles.");
  } catch {
    addToast("warning","No se pudo copiar. Selecciona y copia manualmente.");
  }
};

/* Cleanup */
onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce);
  if (_unsubOCTallerMes) _unsubOCTallerMes();
});
</script>

<style scoped>
.generador-oc-page{
  min-height:100vh;
}
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
}
.equipos-list{ max-height: 50vh; overflow: auto; }
.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }
</style>
