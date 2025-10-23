<!-- src/views/GeneradorOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="generador-oc-page">
    <div class="container py-4 py-md-5">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">Generador OC</h1>

        <!-- Toggle Equipos -->
        <button
          class="btn btn-secondary btn-sm"
          @click="toggleEquiposPanel"
          :aria-pressed="mostrarEquipos.toString()">
          <i class="bi bi-search me-1"></i> {{ mostrarEquipos ? 'Ocultar' : 'Buscar' }} equipos
        </button>
      </div>

      <!-- Layout principal -->
      <div class="row g-3">
        <!-- Columna izquierda -->
        <div class="col-12" :class="mostrarEquipos ? 'col-lg-8' : 'col-lg-12'">

          <!-- Mis OC (toggle) -->
          <div class="d-flex justify-content-end mb-2">
            <button
              class="btn btn-secondary  btn-sm"
              @click="toggleMisOC"
              :aria-pressed="mostrarMisOC.toString()">
              <i class="bi bi-receipt-cutoff me-1"></i>
              {{ mostrarMisOC ? 'Ocultar mis OC' : 'Mostrar mis OC' }}
            </button>
          </div>

          <!-- Mis OC enviadas -->
          <div v-if="mostrarMisOC" class="card mb-3">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">🧾 Mis OC enviadas (mes actual y mes pasado)</div>
              <span class="badge bg-dark-subtle text-dark-emphasis">
                {{ misOC.length }} en total
              </span>
            </div>

            <div class="card-body p-0">
              <div v-if="cargandoMisOC" class="p-3 text-center">
                <div class="spinner-border" role="status"></div>
                <div class="small mt-2">Cargando…</div>
              </div>

              <div v-else-if="misOC.length === 0" class="p-3 text-secondary text-center">
                No hay órdenes en los últimos 2 meses.
              </div>

              <div v-else class="list-group list-group-flush">
                <div
                  class="list-group-item d-flex align-items-start"
                  v-for="oc in misOCPaged"
                  :key="oc.__docId"
                >
                  <div class="me-auto">
                    <div class="d-flex align-items-center gap-2">
                      <span class="fw-semibold">N° {{ oc.id ?? '—' }}</span>
                      <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus || '—' }}</span>
                    </div>
                    <div class="small text-secondary mt-1">
                      <strong>Centro:</strong> {{ oc.centroCostoNombre || '—' }} ·
                      <strong>Moneda:</strong> {{ oc.moneda || '—' }} ·
                      <strong>Total:</strong> {{ (oc.precioTotalConIVA ?? 0).toLocaleString('es-CL') }}
                    </div>
                    <div class="small text-secondary">
                      <strong>Fecha:</strong> {{ fmtFecha(oc.fechaSubida) }}
                    </div>
                  </div>
                  <div class="ms-2">
                    <button class="btn btn-sm btn-outline-primary" @click="irADetalleOC(oc)">Ver detalle</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación (2 por página) -->
            <div v-if="!cargandoMisOC && misOCTotalPages > 1" class="card-footer bg-white">
              <nav aria-label="Paginación OC">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: misOCCurrentPage === 1 }">
                    <button class="page-link" @click="misOCGoTo(misOCCurrentPage - 1)" :disabled="misOCCurrentPage === 1">«</button>
                  </li>
                  <li
                    class="page-item"
                    v-for="n in misOCVisiblePages"
                    :key="'pg-'+n"
                    :class="{ active: misOCCurrentPage === n }">
                    <button class="page-link" @click="misOCGoTo(n)">{{ n }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: misOCCurrentPage === misOCTotalPages }">
                    <button class="page-link" @click="misOCGoTo(misOCCurrentPage + 1)" :disabled="misOCCurrentPage === misOCTotalPages">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
          <!-- /Mis OC -->

          <!-- Card principal: Subir Cotización -->
          <div class="card card-elevated position-relative overflow-hidden">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Subir Cotización</div>
            </div>

            <div class="card-body">
              <!-- Nº de Cotización -->
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
                <div>Se asigna automáticamente y es de solo lectura.</div>
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
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">N° SOLPED</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.numero_solpe }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Centro de Costo</div>
                  <div class="fw-semibold">
                    {{ solpedSeleccionada.numero_contrato }} — {{ solpedSeleccionada.nombre_centro_costo }}
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Empresa</div>
                  <div class="fw-semibold">{{ solpedSeleccionada.empresa }}</div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="small text-secondary">Tipo / Nombre</div>
                  <div class="fw-semibold">
                    {{ solpedSeleccionada.tipo_solped }} — {{ solpedSeleccionada.nombre_solped }}
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

                  <!-- Autorización adjunta -->
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
                <div class="input-group">
                  <input class="form-control" :value="nombreCentroCosto || ''" placeholder="Selecciona un centro…" readonly>
                  <button class="btn btn-outline-primary" @click="modalCentroAbierto = true">
                    <i class="bi bi-search"></i>
                  </button>
                </div>
              </div>

              <!-- Tipo compra -->
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">N° Patente / Stock</label>
                  <select class="form-select" v-model="tipoCompra">
                    <option value="stock">Stock</option>
                    <option value="patente">Patente</option>
                  </select>
                </div>
                <div class="col-12 col-md-6" v-if="tipoCompra==='patente'">
                  <label class="form-label">Patente destino</label>
                  <input class="form-control" v-model="destinoCompra" placeholder="Escribe la patente">
                </div>
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

              <!-- Archivos -->
              <div class="mb-3">
                <label class="form-label">Archivos PDF o Imagen</label>
                <div class="d-flex gap-2">
                  <input id="inputArchivo" type="file" multiple accept="application/pdf,image/*" class="d-none" @change="onMultipleFilesSelected">
                  <button class="btn btn-outline-primary" @click="abrirSelectorArchivos">
                    <i class="bi bi-paperclip me-1"></i> Seleccionar archivos
                  </button>
                  <small>Puedes subir más de uno.</small>
                </div>
              </div>

              <!-- Previews -->
              <div v-for="(archivo, i) in archivos" :key="archivo.__k" class="card mb-2">
                <div class="card-header d-flex align-items-center">
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
                  Enviar Cotización
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Equipos -->
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
                  placeholder="Escribe al menos 2 caracteres (ej: 'jumbo')"
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
              <!-- Paginación -->
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

    <!-- Modal Centro de Costo -->
    <div v-if="modalCentroAbierto" class="vmodal-backdrop" @click.self="modalCentroAbierto=false">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Selecciona Centro de Costo</h5>
        </div>
        <div class="vmodal-body">
          <div class="input-group mb-2">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input class="form-control" placeholder="Buscar contrato o código…" v-model="filtroCentro">
          </div>

          <div class="list-group vmodal-list">
            <button
              type="button"
              class="list-group-item list-group-item-action"
              v-for="c in centrosFiltrados"
              :key="c.key"
              @click="seleccionarCentro(c); modalCentroAbierto=false">
              <div class="fw-semibold">{{ c.key }}</div>
              <div class="small text-secondary">{{ c.name }}</div>
            </button>
          </div>
        </div>
        <div class="vmodal-footer">
          <button class="btn btn-outline-secondary" @click="modalCentroAbierto=false">Cerrar</button>
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
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router"; /* ⬅️ leemos query fromSolpedId */
import { db } from "../stores/firebase";
import {
  collection, getDocs, getDoc, doc, query, where, orderBy, limit, addDoc, updateDoc,
  startAt, endAt, onSnapshot, Timestamp, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";

const router = useRouter();
const route = useRoute();          /* ⬅️ */
const volver = () => router.back();
const auth = useAuthStore();

/* ======= Estado base ======= */
const enviando = ref(false);
const usarSolped = ref(true);
const nuevoIdVisual = ref(null);
const comentario = ref("");

/* Equipos */
const mostrarEquipos = ref(false);
const toggleEquiposPanel = () => { mostrarEquipos.value = !mostrarEquipos.value; };

const solpedDisponibles = ref([]);
const solpedSeleccionadaId = ref("");
const solpedSeleccionada = ref(null);
const itemsSolped = ref([]);

/* Autorización (SOLPED) */
const autorizacionNombre = ref(null);
const autorizacionUrlRaw = ref(null);
const autorizacionEsPDF = ref(false);
const autorizacionEsImagen = ref(false);

/* Centro de costo (modal) */
const modalCentroAbierto = ref(false);
const centroCosto = ref("");
const filtroCentro = ref("");
const centrosCostoLista = ref([
  { key: '27483', name: 'CONTRATO 27483 SUM. HORMIGON CHUCHICAMATA' },
  { key: 'PPCALAMA', name: 'PLANTA PREDOSIFICADO CALAMA' },
  { key: '20915', name: 'CONTRATO 20915 SUM. HORMIGON DAND' },
  { key: '23302-CARPETAS', name: 'CONTRATO 23302 CARPETAS' },
  { key: '23302-AMPL', name: 'CONTRATO 23302 AMPLIACION' },
  { key: 'OFANDES', name: 'OFICINA LOS ANDES' },
  { key: 'CASAMATRIZ', name: 'CASA MATRIZ' },
  { key: 'RRHH', name: 'RRHH' },
  { key: 'FINANZAS', name: 'FINANZAS' },
  { key: 'SUST', name: 'SUSTENTABILIDAD' },
  { key: 'SOPTI', name: 'SOPORTE TI' },
  { key: 'STRIPCENTER', name: 'STRIP CENTER' },
  { key: 'PLANIF', name: 'PLANIFICACION' },
  { key: 'PPSB', name: 'PLANTA PREDOSIFICADO SAN BERNARDO' },
  { key: 'PHUSB', name: 'PLANTA HORMIGON URB.SAN BERNARDO' },
  { key: 'ALTOMAIPO', name: 'ALTO MAIPO' },
  { key: 'PHURAN', name: 'PLANTA HORMIGON URB. RANCAGUA' },
  { key: 'PARAN', name: 'PLANTA ARIDOS RANCAGUA' },
  { key: 'PASB', name: 'PLANTA ARIDOS SAN BERNARDO' },
  { key: '22368', name: 'CONTRATO 22368 SUM HORMIGON DET' },
  { key: '28662', name: 'CONTRATO 28662 CARPETAS' },
  { key: '29207', name: 'CONTRATO 29207 MINERIA' },
  { key: 'HORMIGONES DET', name: 'CONTRATO SUMINISTRO DE HORMIGONES DET' },
  { key: 'HORMIGONES DAND', name: 'CONTRATO SUMINISTRO DE HORMIGONES DAND' },
  { key: '23302', name: 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND' },
  { key: 'DET', name: 'CONTRATO REPARACIÓN DE CARPETAS DE RODADO DET' },
  { key: 'SANJOAQUIN', name: 'SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN' },
  { key: 'URBANOS', name: 'SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR' },
  { key: 'CS', name: 'CONTRATO DE SUMINISTRO DE HORMIGONES CS' },
  { key: 'PREDOSIFICADO', name: 'CONTRATO HORMIGONES Y PREDOSIFICADO' },
  { key: 'CANECHE', name: 'CONTRATO TALLER CANECHE' },
  { key: 'INFRAESTRUCTURA', name: 'CONTRATO INFRAESTRUCTURA DET' },
  { key: 'CHUQUICAMATA', name: 'CONTRATO CHUQUICAMATA' },
  { key: 'CARPETASDET', name: 'CONTRATO CARPETAS DET' },
  { key: '30-10-11', name: 'GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM' },
  { key: '28662', name: 'CONTRATO 28662 CARPETAS' },
  { key: '23302', name: 'CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND' },
]);
const centrosFiltrados = computed(() => {
  const f = (filtroCentro.value || "").toLowerCase();
  if (!f) return centrosCostoLista.value;
  return centrosCostoLista.value.filter(c =>
    c.key.toLowerCase().includes(f) || c.name.toLowerCase().includes(f)
  );
});
const nombreCentroCosto = computed(() => {
  const found = centrosCostoLista.value.find(c => c.key === centroCosto.value);
  return found?.name || "";
});
const seleccionarCentro = (c) => { centroCosto.value = c.key; };

/* Tipo compra / destino */
const tipoCompra = ref("stock");
const destinoCompra = ref("");

/* Moneda / precio / aprobador */
const monedaSeleccionada = ref("CLP");
const precioTotalConIVA = ref(0);
const precioFormateado = ref("");
const aprobadorSugerido = ref("");
const empresaPorDefecto = "Xtreme Servicio";
const tipoCambioUSD = 950;
const tipoCambioEUR = 1050;

const myUid = computed(() => auth?.user?.uid || null);
const usuarioActual = ref("");

/* Archivos */
const archivos = ref([]); // { file, name, tipo, previewUrl, __k }
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

/* Toasts */
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

  /* ⬇️ Auto-preseleccionar SOLPED si venimos desde Historial (fromSolpedId) */
  const pre = route?.query?.fromSolpedId ? String(route.query.fromSolpedId) : "";
  if (pre) {
    usarSolped.value = true;
    // Si la lista ya la trae, basta con setear el id; si no, hacemos fetch directo.
    const yaEsta = solpedDisponibles.value.some(s => s.id === pre);
    if (!yaEsta) {
      try {
        const ds = await getDoc(doc(db,"solpes", pre));
        if (ds.exists()) {
          const data = ds.data() || {};
          solpedDisponibles.value = [{ id: pre, ...data }, ...solpedDisponibles.value];
        }
      } catch (e) { console.error("No se pudo precargar SOLPED", e); }
    }
    solpedSeleccionadaId.value = pre;
    await onChangeSolped();
    addToast("success","SOLPED preseleccionada desde el historial.");
  }
  // Mis OC: carga diferida (no suscribimos aquí)
});

const obtenerNombreUsuario = async () => {
  try {
    const uid = myUid.value;
    if (!uid) return;
    const dref = doc(db, "Usuarios", uid);
    const snap = await getDoc(dref);
    if (snap.exists()) {
      const data = snap.data() || {};
      usuarioActual.value = data.fullName || "";
    }
  } catch(e){ console.error(e); }
};

const cargarSolpedSolicitadas = async () => {
  try {
    let arr = [];
    if (usuarioActual.value) {
      const qy = query(
        collection(db, "solpes"),
        where("estatus", "in", ["Solicitado", "Pendiente", "Parcial"])
      );
      const snap = await getDocs(qy);
      arr = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => {
          const da = Array.isArray(s.dirigidoA) ? s.dirigidoA : [];
          return da.includes(usuarioActual.value);
        })
        .sort((a,b) => (a.numero_solpe||0)-(b.numero_solpe||0));
    } else {
      const qy = query(collection(db, "solpes"), where("estatus", "in", ["Solicitado", "Pendiente", "Parcial"]));
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                     .sort((a,b) => (a.numero_solpe||0)-(b.numero_solpe||0));
    }
    solpedDisponibles.value = arr;
  } catch(e){ console.error(e); }
};

const cargarSiguienteNumero = async () => {
  try {
    const qy = query(collection(db, "ordenes_oc"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const last = snap.docs[0]?.data()?.id || 0;
    nuevoIdVisual.value = Number(last) + 1;
  } catch {
    nuevoIdVisual.value = 1;
  }
};

/* ====== SOLPED ====== */
const onToggleUsarSolped = () => {
  if (!usarSolped.value) {
    solpedSeleccionada.value = null;
    solpedSeleccionadaId.value = "";
    itemsSolped.value = [];
    autorizacionNombre.value = null;
    autorizacionUrlRaw.value = null;
    autorizacionEsPDF.value = false;
    autorizacionEsImagen.value = false;
  }
  calcularAprobador();
};

const onChangeSolped = async () => {
  if (!solpedSeleccionadaId.value) {
    solpedSeleccionada.value = null;
    itemsSolped.value = [];
    autorizacionNombre.value = null;
    autorizacionUrlRaw.value = null;
    autorizacionEsPDF.value = false;
    autorizacionEsImagen.value = false;
    return;
  }
  try {
    const dref = doc(db, "solpes", solpedSeleccionadaId.value);
    const snap = await getDoc(dref);
    if (snap.exists()) {
      const data = snap.data() || {};
      solpedSeleccionada.value = data;

      // Autorización
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

      // Sugerir centro de costo
      centroCosto.value = data.numero_contrato || centroCosto.value;
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

  const empresaBase = usarSolped.value
    ? (solpedSeleccionada.value?.empresa || empresaPorDefecto)
    : empresaPorDefecto;

  const empresa = (empresaBase || "").toLowerCase();

  if (empresa === "xtreme mining") {
    if (totalCLP <= 250000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 1000000) aprobadorSugerido.value = "Felipe Gonzalez / Ricardo Santibañez";
    else if (totalCLP <= 2000000) aprobadorSugerido.value = "Patricio Muñoz";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Juan Cubillos / César Palma";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else if (empresa === "xtreme servicio") {
    if (totalCLP <= 250000) aprobadorSugerido.value = "Guillermo Manzor";
    else if (totalCLP <= 5000000) aprobadorSugerido.value = "Juan Cubillos";
    else aprobadorSugerido.value = "Alejandro Candia";
  } else {
    aprobadorSugerido.value = "Empresa no reconocida";
  }
};

/* ====== Guardar OC ====== */
const enviarOC = async () => {
  if (enviando.value) return;

  // Validaciones
  if (!centroCosto.value.trim())                  { addToast("warning","Selecciona Centro de Costo"); return; }
  if (!tipoCompra.value)                          { addToast("warning","Selecciona tipo de compra"); return; }
  if (tipoCompra.value === "patente" && !destinoCompra.value.trim())
                                                  { addToast("warning","Ingresa la patente"); return; }
  if (!precioTotalConIVA.value || precioTotalConIVA.value <= 0)
                                                  { addToast("warning","Precio inválido"); return; }
  if (!monedaSeleccionada.value)                  { addToast("warning","Selecciona moneda"); return; }
  if (usarSolped.value && !solpedSeleccionadaId.value)
                                                  { addToast("warning","Selecciona una SOLPED o desactiva la opción"); return; }
  if (archivos.value.length === 0)                { addToast("warning","Debes subir al menos un archivo"); return; }

  enviando.value = true;

  try {
    // Usuario actual
    let nombreUsuario = auth?.user?.displayName || auth?.user?.email || "Desconocido";
    const uid = myUid.value;
    if (uid) {
      const usnap = await getDoc(doc(db, "Usuarios", uid));
      if (usnap.exists()) {
        const u = usnap.data() || {};
        nombreUsuario = u.fullName || nombreUsuario;
      }
    }

    // Correlativo
    const qy = query(collection(db, "ordenes_oc"), orderBy("id", "desc"), limit(1));
    const snap = await getDocs(qy);
    const lastId = snap.docs[0]?.data()?.id || 0;
    const newId  = Number(lastId) + 1;

    // Centro costo
    const centroFound  = centrosCostoLista.value.find(c => c.key === centroCosto.value);
    const centroNombre = centroFound?.name || "Desconocido";

    // Empresa
    const empresaElegida = (usarSolped.value && solpedSeleccionada.value?.empresa)
      ? solpedSeleccionada.value.empresa
      : empresaPorDefecto;

    // Estatus inicial
    const estatusInicial = "Revisión Guillermo";

    // Comentario
    const comentarioFinal = (comentario.value || "").trim();

    // Ítems desde SOLPED (si aplica)
    let itemsOC = [];
    if (usarSolped.value && solpedSeleccionadaId.value) {
      itemsOC = mapearItemsSegunRegla(itemsSolped.value);
    }

    // Subir archivos
    const storage = getStorage();
    const subidos = [];
    for (const a of archivos.value) {
      if (!a.file || a.file.size < 100) continue;
      const path = `ordenes_oc/${newId}/${a.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, a.file);
      const url = await getDownloadURL(up.ref);
      subidos.push({ nombre: a.name, tipo: a.tipo, url });
    }

    // Construir documento
    const dataToSave = {
      id: newId,
      centroCosto: centroCosto.value,
      centroCostoNombre: centroNombre,
      tipoCompra: tipoCompra.value,
      destinoCompra: tipoCompra.value === "patente" ? destinoCompra.value : "",
      estatus: estatusInicial,
      fechaSubida: serverTimestamp(),
      historial: [{
        usuario: nombreUsuario,
        estatus: estatusInicial,
        fecha: new Date().toISOString(),
        comentario: comentarioFinal
      }],
      responsable: nombreUsuario,
      comentario: comentarioFinal,
      numero_contrato: centroCosto.value,
      nombre_centro_costo: centroNombre,
      moneda: monedaSeleccionada.value,
      precioTotalConIVA: precioTotalConIVA.value,
      aprobadorSugerido: aprobadorSugerido.value || "",
      empresa: empresaElegida,
      archivosStorage: subidos,
      ...(usarSolped.value && solpedSeleccionadaId.value ? {
        solpedId: solpedSeleccionadaId.value,
        numero_solped: solpedSeleccionada.value?.numero_solpe || 0,
        tipo_solped: solpedSeleccionada.value?.tipo_solped || "No definido",
        items: itemsOC
      } : {
        tipo_solped: "Sin SOLPED"
      })
    };

    // Guardar
    const newDocRef = await addDoc(collection(db, "ordenes_oc"), dataToSave);
    const newDocId = newDocRef.id;
    await updateDoc(newDocRef, { __docId: newDocId });

    // Actualizar SOLPED asociada
    if (usarSolped.value && solpedSeleccionadaId.value) {
      await actualizarSolpedAsociada(solpedSeleccionadaId.value, itemsOC, nombreUsuario);
    }

    addToast("success","Cotización enviada exitosamente.");

    // Reset UI
    centroCosto.value = "";
    tipoCompra.value = "stock";
    destinoCompra.value = "";
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
    await cargarSiguienteNumero();

    const inputEl = document.getElementById("inputArchivo");
    if (inputEl) inputEl.value = "";

  } catch (e) {
    console.error(e);
    addToast("danger","Error al enviar la cotización.");
  } finally {
    enviando.value = false;
  }
};

/* ===== Panel Equipos… (sin cambios funcionales relevantes) ===== */
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

const camposBusqueda = ["equipo", "clasificacion1", "codigo", "tipo_equipo", "marca"];
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
  }, 250);
};
let debounce = null;

const variantesDe = (s) => {
  const t = (s || "").trim();
  const arr = [ t, t.toLowerCase(), t.toUpperCase(), t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() ].filter(Boolean);
  return [...new Set(arr)];
};

const buscarEquipos = async (q) => {
  cargandoEquipos.value = true;
  currentPage.value = 1;
  try {
    const variantes = variantesDe(q);
    const vistos = new Set();
    const resultados = [];

    for (const campo of camposBusqueda) {
      for (const v of variantes) {
        try {
          const qref = query(
            collection(db, "equipos"),
            orderBy(campo),
            startAt(v),
            endAt(v + "\uf8ff"),
            limit(100)
          );
          const snap = await getDocs(qref);
          for (const d of snap.docs) {
            const item = { id: d.id, ...d.data() };
            if (!vistos.has(item.id)) {
              vistos.add(item.id);
              resultados.push(item);
            }
          }
        } catch (e) {
          console.warn(`Query por campo "${campo}" falló o requiere índice:`, e?.message || e);
        }
      }
    }

    const qlow = q.toLowerCase();
    const filtrados = resultados.filter(e => {
      const valores = [ e.equipo, e.clasificacion1, e.codigo, e.tipo_equipo, e.marca ].filter(Boolean).map(v => String(v).toLowerCase());
      return valores.some(v => v.includes(qlow));
    });

    filtrados.sort((a, b) => {
      if (a.creado && b.creado) return (b.creado?.seconds || b.creado) - (a.creado?.seconds || a.creado);
      if (a.codigo && b.codigo && a.codigo !== b.codigo) return String(a.codigo).localeCompare(String(b.codigo));
      return String(a.equipo || "").localeCompare(String(b.equipo || ""));
    });

    resultadosEquipos.value = filtrados;
  } catch (e) {
    console.error("Error en búsqueda de equipos:", e);
    addToast("danger", "Error al buscar equipos.");
    resultadosEquipos.value = [];
  } finally {
    cargandoEquipos.value = false;
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

/* ====== Mis OC enviadas (diferido) ====== */
const mostrarMisOC = ref(false);
const cargandoMisOC = ref(false);
const misOC = ref([]);
const misOCCurrentPage = ref(1);
const misOCPageSize = 2;

const misOCTotalPages = computed(() => Math.max(1, Math.ceil(misOC.value.length / misOCPageSize)));
const misOCVisiblePages = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, misOCCurrentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(misOCTotalPages.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const misOCPaged = computed(() => {
  const start = (misOCCurrentPage.value - 1) * misOCPageSize;
  return misOC.value.slice(start, start + misOCPageSize);
});
const misOCGoTo = (n) => { if (n < 1 || n > misOCTotalPages.value) return; misOCCurrentPage.value = n; };
const fmtFecha = (f) => {
  try { const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : null); if (!d) return "—"; return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }); }
  catch { return "—"; }
};
const estadoBadgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("preaprob")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("escala") || s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};
const irADetalleOC = (oc) => { router.push(`/oc/${oc.__docId}`); };

let _unsubMisOC = null;
const rangeUltimos2Meses = () => {
  const now = new Date();
  const from = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
  const to   = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0));
  return { from, to };
};
const suscribirMisOC = () => {
  if (_unsubMisOC) { _unsubMisOC(); _unsubMisOC = null; }
  const nombre = usuarioActual.value; if (!nombre) return;
  const { from, to } = rangeUltimos2Meses();
  const qy = query(
    collection(db, "ordenes_oc"),
    where("responsable", "==", nombre),
    where("fechaSubida", ">=", from),
    where("fechaSubida", "<", to),
    orderBy("fechaSubida", "desc")
  );
  _unsubMisOC = onSnapshot(qy, (snap) => {
    const arr = []; snap.forEach(docu => arr.push({ __docId: docu.id, ...docu.data() }));
    arr.sort((a,b) => (b.fechaSubida?.toMillis?.() ?? 0) - (a.fechaSubida?.toMillis?.() ?? 0));
    misOC.value = arr; misOCCurrentPage.value = 1;
  }, (err) => { console.error("onSnapshot mes actual:", err); });
};
const desuscribirMisOC = () => {
  if (_unsubMisOC) { _unsubMisOC(); _unsubMisOC = null; }
  misOC.value = []; misOCCurrentPage.value = 1; cargandoMisOC.value = false;
};
const toggleMisOC = () => {
  mostrarMisOC.value = !mostrarMisOC.value;
  if (mostrarMisOC.value) { if (usuarioActual.value) suscribirMisOC(); }
  else { desuscribirMisOC(); }
};
watch(usuarioActual, (nv) => { if (nv && mostrarMisOC.value) suscribirMisOC(); });

/* ====== Actualizar SOLPED vinculada ====== */
const actualizarSolpedAsociada = async (solpedId, itemsRegla, nombreUsuario) => {
  if (!solpedId) return;
  const sref = doc(db, "solpes", solpedId);
  const ss = await getDoc(sref);
  if (!ss.exists()) return;

  const dataSol = ss.data() || {};
  const originales = Array.isArray(dataSol.items) ? dataSol.items : [];
  const byKey = new Map(itemsRegla.map(it => [ `${it.item}-${it.descripcion}`, it ]));

  const actualizados = originales.map(it => {
    const clave = `${it.item}-${it.descripcion}`;
    const upd = byKey.get(clave);
    if (!upd) return it;

    const ant   = Number(it.cantidad_cotizada || 0);
    const nueva = Number(upd.cantidad_para_cotizar || 0);
    const total = Number(it.cantidad || 0);
    const final = ant + nueva;

    const estadoVisual = nueva > 0 ? "revisión" : "pendiente";
    let estadoCot = "ninguno";
    if (total > 0 && final >= total)      estadoCot = "completo";
    else if (nueva > 0)                   estadoCot = "revisión";

    return { ...it, cantidad_cotizada: final, estado: estadoVisual, estado_cotizacion: estadoCot };
  });

  await updateDoc(sref, { items: actualizados, estatus: "Pendiente" });

  const hcoll = collection(db, "solpes", solpedId, "historialEstados");
  await addDoc(hcoll, {
    usuario: nombreUsuario || "Sistema",
    fecha: serverTimestamp(),
    estatus: "Cotización enviada - Revisión Guillermo"
  });
};

const mapearItemsSegunRegla = (itemsFuente) => {
  const salida = (itemsFuente || []).map(item => {
    const cantidadTotal       = Number(item.cantidad || 0);
    const cantidadAntes       = Number(item.cantidad_cotizada || 0);
    const cantidadNueva       = Number(item.cantidad_para_cotizar || 0);
    const cantidadActualizada = cantidadAntes + cantidadNueva;

    const estadoVisual = cantidadNueva > 0 ? "revision" : "pendiente";
    let estadoCotizacion = "ninguno";
    if (cantidadTotal > 0 && cantidadActualizada >= cantidadTotal) {
      estadoCotizacion = "completo";
    } else if (cantidadNueva > 0) {
      estadoCotizacion = "parcial";
    }

    return {
      ...item,
      cantidad_cotizada: cantidadActualizada,
      cantidad_para_cotizar: cantidadNueva,
      estado: estadoVisual,
      estado_cotizacion: estadoCotizacion
    };
  });

  return salida;
};

onBeforeUnmount(() => { if (_unsubMisOC) _unsubMisOC(); });
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

/* Modal 100% Vue */
.vmodal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1080;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.vmodal{
  width: 100%;
  max-width: 560px;
  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
  overflow: hidden;
}
.vmodal-header, .vmodal-footer{
  padding: .9rem 1rem;
  border-bottom: 1px solid #eee;
}
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }
.vmodal-list{ max-height: 55vh; overflow: auto; }

/* Lista de equipos scrollable */
.equipos-list{
  max-height: 50vh;
  overflow: auto;
}

/* Toasts abajo-derecha */
.toast-stack{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-box{
  display: flex;
  align-items: center;
  padding: .6rem .8rem;
  border-radius: .5rem;
  color: #fff;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{ background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }
</style>
