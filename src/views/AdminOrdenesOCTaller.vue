<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-oc-page">
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Admin · Órdenes OC (Taller)</h1>

        <div class="d-flex flex-wrap gap-2">
          <!-- Buscador (ID doc o id numérico) -->
          <div class="input-group" style="width: 300px;">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              class="form-control"
              placeholder="ID doc o ID (número)"
              v-model="buscarTexto"
              @keyup.enter="onBuscar"
            />
            <button class="btn btn-outline-secondary" @click="onBuscar">Buscar</button>
            <button
              v-if="busquedaActiva"
              class="btn btn-outline-danger"
              @click="limpiarBusqueda"
              title="Limpiar búsqueda">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Filtros -->
          <div class="input-group" style="width: 230px;">
            <span class="input-group-text">Estatus</span>
            <select class="form-select" v-model="filtroEstatus" @change="aplicarFiltros">
              <option value="">Todos</option>
              <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="input-group" style="width: 250px;">
            <span class="input-group-text">Responsable</span>
            <select class="form-select" v-model="filtroResponsable" @change="aplicarFiltros">
              <option value="">Todos</option>
              <option v-for="r in RESPONSABLES_OPC" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <button class="btn btn-primary" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva OC (Taller)
          </button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">Listado ({{ rows.length }} / pág.)</div>
        </div>

        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead >
              <tr>
                <th style="width:110px;">ID</th>
                <th>Centro Costo</th>
                <th style="width:180px;">Responsable</th>
                <th style="width:140px;">Estatus</th>
                <th style="width:140px;">Empresa</th>
                <th style="width:150px;">Fecha subida</th>
                <th style="width:220px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="7" class="text-center py-4">
                  <div class="spinner-border" role="status"></div>
                  <div class="small text-secondary mt-2">Cargando…</div>
                </td>
              </tr>
              <tr v-else-if="rows.length === 0">
                <td colspan="7" class="text-center py-4 text-secondary">Sin resultados.</td>
              </tr>
              <tr v-else v-for="r in rows" :key="r.__id">
                <td class="fw-semibold">#{{ r.id ?? '—' }}</td>
                <td>
                  <div class="fw-semibold">{{ r.centroCostoTexto || '—' }}</div>
                </td>
                <td>{{ r.responsable || '—' }}</td>
                <td><span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span></td>
                <td>{{ r.empresa || '—' }}</td>
                <td>{{ prettyTS(r.fechaSubida) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" title="Editar" @click="abrirEditor(r)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <!-- abrir modal confirmación -->
                    <button class="btn btn-outline-danger" title="Eliminar" @click="abrirConfirm(r)">
                      <i class="bi bi-trash3"></i>
                    </button>
                    <button class="btn btn-outline-secondary" title="Ver archivo OC" @click="verArchivoOC(r)">
                      <i class="bi bi-file-earmark-pdf"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="card-footer " v-if="!busquedaActiva">
          <nav aria-label="Paginación">
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">«</button>
              </li>

              <li
                class="page-item"
                v-for="n in visiblePageButtons"
                :key="n"
                :class="{ active: currentPage === n }">
                <button class="page-link" @click="goToPage(n)">{{ n }}</button>
              </li>

              <li class="page-item" :class="{ disabled: !hasNextPage }">
                <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="!hasNextPage">»</button>
              </li>
            </ul>
          </nav>
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

    <!-- Offcanvas Editor -->
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div>
            <div class="fw-semibold">Editar Orden OC (Taller)</div>
          </div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <!-- Básicos -->
            <div class="col-6 col-md-2">
              <label class="form-label">ID</label>
              <input class="form-control" v-model.number="edit.id" type="number" min="0">
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha subida</label>
              <input type="datetime-local" class="form-control" v-model="fechaSubidaLocal">
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha aprobación</label>
              <input type="datetime-local" class="form-control" v-model="fechaAprobacionLocal">
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="edit.empresa" placeholder="Xtreme Servicios">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="edit.estatus">
                <option v-for="s in ESTATUS_OPC" :key="s">{{ s }}</option>
              </select>
            </div>

            <!-- Centro de costo -->
            <div class="col-12 col-md-6">
              <label class="form-label">Centro Costo (texto)</label>
              <input class="form-control" v-model="edit.centroCostoTexto" placeholder="THPV-31">
            </div>

            <!-- Responsable / Aprobaciones -->
            <div class="col-12 col-md-4">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="edit.responsable">
                <option value="">— Selecciona —</option>
                <option v-for="r in RESPONSABLES_OPC" :key="r">{{ r }}</option>
              </select>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Aprobador sugerido</label>
              <input class="form-control" v-model="edit.aprobadorSugerido" placeholder="Juan Cubillos">
            </div>

            <!-- Asociación SOLPED (opcional a nivel doc) -->
            <div class="col-12 col-md-4">
              <label class="form-label">Número SOLPED (asociar)</label>
              <input class="form-control" v-model="edit.numero_solped" placeholder="p.ej. 18">
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="REPUESTOS / Sin SOLPED">
            </div>

            <!-- Económicos -->
            <div class="col-6 col-md-3">
              <label class="form-label">Moneda</label>
              <input class="form-control" v-model="edit.moneda" placeholder="CLP">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Total c/ IVA</label>
              <input class="form-control" v-model.number="edit.precioTotalConIVA" type="number" min="0">
            </div>

            <!-- Comentario -->
            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="edit.comentario" placeholder="Notas / observaciones"></textarea>
            </div>

            <!-- Archivo OC (único) -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivo OC (único)</div>
                <div class="d-flex gap-2">
                  <input id="inputArchivoOC" type="file" class="d-none"
                    accept="application/pdf,image/*"
                    @change="onArchivoOC">
                  <button class="btn btn-sm btn-outline-secondary" @click="() => document.getElementById('inputArchivoOC')?.click()">
                    <i class="bi bi-paperclip me-1"></i> Reemplazar archivo OC
                  </button>
                  <button class="btn btn-sm btn-outline-danger" v-if="edit.archivoOC?.url" @click="borrarArchivoOC">
                    <i class="bi bi-trash3 me-1"></i> Quitar archivo OC
                  </button>
                </div>
              </div>
              <div class="list-group">
                <div class="list-group-item" v-if="edit.archivoOC?.url">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="small">
                      <i class="bi bi-file-earmark-text me-2"></i>
                      <strong>{{ edit.archivoOC?.nombre }}</strong>
                      <span class="text-secondary ms-2">{{ edit.archivoOC?.tipo }}</span>
                      <span class="text-secondary ms-2">{{ prettyTS(edit.archivoOC?.fechaSubida) }}</span>
                    </div>
                    <a class="btn btn-sm btn-outline-secondary" :href="edit.archivoOC?.url" target="_blank">Ver</a>
                  </div>
                </div>
                <div v-else class="list-group-item text-secondary small">Sin archivo OC.</div>
              </div>
            </div>

            <!-- Archivos Storage (múltiples) -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivos en Storage</div>
                <div class="d-flex gap-2">
                  <input id="inputArchivosStorage" type="file" class="d-none"
                    multiple accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosStorage">
                  <button class="btn btn-sm btn-outline-secondary" @click="() => document.getElementById('inputArchivosStorage')?.click()">
                    <i class="bi bi-cloud-upload me-1"></i> Agregar archivos
                  </button>
                </div>
              </div>
              <div class="list-group">
                <div class="list-group-item d-flex align-items-center justify-content-between"
                  v-for="(a, ai) in edit.archivosStorage" :key="'st'+ai">
                  <div class="small">
                    <i class="bi bi-file-earmark me-2"></i>
                    <strong>{{ a.nombre }}</strong>
                    <span class="text-secondary ms-2">{{ a.tipo || 'archivo' }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <a class="btn btn-sm btn-outline-secondary" :href="a.url" target="_blank">Ver</a>
                    <button class="btn btn-sm btn-outline-danger" @click="eliminarArchivoStorage(ai)">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
                <div v-if="!edit.archivosStorage?.length" class="list-group-item text-secondary small">Sin archivos.</div>
              </div>
            </div>

            <!-- Historial -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Historial</div>
                <button class="btn btn-sm btn-outline-primary" @click="agregarHistorial">
                  <i class="bi bi-plus-lg me-1"></i> Agregar
                </button>
              </div>
              <div class="list-group">
                <div class="list-group-item" v-for="(h, ix) in edit.historial" :key="'h'+ix">
                  <div class="row g-2 align-items-center">
                    <div class="col-md-3">
                      <input class="form-control form-control-sm" v-model="h.fecha" placeholder="ISO 2025-09-16T12:21:34.628Z">
                    </div>
                    <div class="col-md-4">
                      <input class="form-control form-control-sm" v-model="h.estatus" placeholder="Estatus">
                    </div>
                    <div class="col-md-5 d-flex">
                      <input class="form-control form-control-sm me-2" v-model="h.usuario" placeholder="Usuario">
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarHistorial(ix)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!edit.historial?.length" class="list-group-item text-secondary small">Sin historial.</div>
              </div>
            </div>

          </div>
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal NUEVA OC (Taller) -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva Orden OC (Taller)</h5>
        </div>
        <div class="vmodal-body">
          <div class="row g-3">
            <div class="col-6 col-md-3">
              <label class="form-label">ID</label>
              <input class="form-control" v-model.number="nuevo.id" type="number" min="0">
            </div>
            <div class="col-6 col-md-5">
              <label class="form-label">Fecha subida</label>
              <input type="datetime-local" class="form-control" v-model="nuevoFechaSubidaLocal">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="nuevo.empresa" placeholder="Xtreme Servicios">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option v-for="s in ESTATUS_OPC" :key="s">{{ s }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Centro Costo (texto)</label>
              <input class="form-control" v-model="nuevo.centroCostoTexto" placeholder="THPV-31">
            </div>

            <div class="col-md-6">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="nuevo.responsable">
                <option value="">— Selecciona —</option>
                <option v-for="r in RESPONSABLES_OPC" :key="r">{{ r }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Aprobado por</label>
              <input class="form-control" v-model="nuevo.aprobadoPor">
            </div>
            <div class="col-md-6">
              <label class="form-label">Aprobador sugerido</label>
              <input class="form-control" v-model="nuevo.aprobadorSugerido">
            </div>
            <div class="col-md-6">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="nuevo.tipo_solped" placeholder="REPUESTOS / Sin SOLPED">
            </div>

            <div class="col-md-6">
              <label class="form-label">Número SOLPED (asociar)</label>
              <input class="form-control" v-model="nuevo.numero_solped" placeholder="18">
            </div>
            <div class="col-md-3">
              <label class="form-label">Moneda</label>
              <input class="form-control" v-model="nuevo.moneda" placeholder="CLP">
            </div>
            <div class="col-md-3">
              <label class="form-label">Total c/ IVA</label>
              <input class="form-control" v-model.number="nuevo.precioTotalConIVA" type="number" min="0">
            </div>

            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="nuevo.comentario"></textarea>
            </div>

            <!-- Cargar archivoOC inicial -->
            <div class="col-12">
              <label class="form-label">Archivo OC (PDF/imagen)</label>
              <div class="d-flex gap-2">
                <input id="inputArchivoOCNuevo" type="file" class="d-none"
                  accept="application/pdf,image/*"
                  @change="onArchivoOCNuevo">
                <button class="btn btn-secondary" @click="() => document.getElementById('inputArchivoOCNuevo')?.click()">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivo OC
                </button>
                <div class="small text-secondary" v-if="archivoOCNuevoNombre">
                  Seleccionado: <strong>{{ archivoOCNuevoNombre }}</strong>
                </div>
              </div>
            </div>

            <!-- Adjuntos múltiples -->
            <div class="col-12">
              <label class="form-label">Archivos Storage (múltiples)</label>
              <div class="d-flex gap-2">
                <input id="inputArchivosStorageNuevo" type="file" class="d-none"
                  multiple
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  @change="onArchivosStorageNuevo">
                <button class="btn btn-secondary" @click="() => document.getElementById('inputArchivosStorageNuevo')?.click()">
                  <i class="bi bi-cloud-upload me-1"></i> Seleccionar archivos
                </button>
                <div class="small text-secondary" v-if="previewArchivosStorageNuevo.length">
                  {{ previewArchivosStorageNuevo.length }} archivo(s) listo(s).
                </div>
              </div>
            </div>

          </div>
        </div>
        <div class="vmodal-footer">
          <button class="btn btn-secondary" @click="cerrarModalNueva">Cancelar</button>
          <button class="btn btn-primary" :disabled="creando" @click="crearNueva">
            <span v-if="creando" class="spinner-border spinner-border-sm me-2"></span>
            Crear
          </button>
        </div>
      </div>
    </div>

    <!-- Modal CONFIRMAR ELIMINACIÓN -->
    <div v-if="confirmOpen" class="vmodal-backdrop" @click.self="cerrarConfirm">
      <div class="vmodal" style="max-width: 520px;">
        <div class="vmodal-header d-flex align-items-center gap-2">
          <div class="confirm-icon">
            <i class="bi bi-trash3-fill"></i>
          </div>
          <div>
            <h5 class="mb-0">Confirmar eliminación</h5>
            <small class="text-secondary">Esta acción no se puede deshacer</small>
          </div>
          <button class="btn-close ms-auto" @click="cerrarConfirm" :disabled="eliminando"></button>
        </div>

        <div class="vmodal-body">
          <p class="mb-3">
            ¿Seguro que quieres eliminar la Orden OC (Taller)
            <strong>#{{ confirmRow?.id ?? '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Empresa:</span> <strong>{{ confirmRow?.empresa || '—' }}</strong></li>
            <li><span class="text-secondary">Centro costo:</span> <strong>{{ confirmRow?.centroCostoTexto || '—' }}</strong></li>
            <li><span class="text-secondary">Responsable:</span> <strong>{{ confirmRow?.responsable || '—' }}</strong></li>
            <li><span class="text-secondary">Fecha subida:</span> <strong>{{ prettyTS(confirmRow?.fechaSubida) }}</strong></li>
          </ul>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarConfirm" :disabled="eliminando">
            Cancelar
          </button>
          <button class="btn btn-danger" @click="confirmarEliminar" :disabled="eliminando">
            <span v-if="eliminando" class="spinner-border spinner-border-sm me-2"></span>
            Eliminar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { db } from "../stores/firebase";
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot,
  doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ========== Helpers de fecha ========== */
function toDate(val){
  if (!val) return null;
  if (typeof val === "object" && typeof val.toDate === "function") { try { return val.toDate(); } catch { return null; } }
  if (val && typeof val.seconds === "number") { return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds || 0)/1e6)); }
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
function toLocalInputValue(value){
  const d = toDate(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2,"0");
  const yyyy = d.getFullYear(), mm = pad(d.getMonth()+1), dd = pad(d.getDate()), hh = pad(d.getHours()), mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fromLocalInputValue(val){
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------- Constantes ---------- */
const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado","Aprobado","Rechazado","Preaprobado","Casi Aprobado","Pendiente de Aprobación","Enviada a proveedor","Revisión Guillermo"
];
const RESPONSABLES_OPC = [
  "Luis Orellana","Guillermo Manzor","María José Ballesteros","Juan Cubillos"
];

/* ---------- Estado listado & paginación ---------- */
const rows = ref([]);
const cargando = ref(true);
const currentPage = ref(1);
const hasNextPage = ref(false);
const pageCursors = ref([]);
let unsubList = null;

/* Búsqueda / Filtros */
const buscarTexto = ref("");
const busquedaActiva = ref(false);
const filtroEstatus = ref("");
const filtroResponsable = ref("");
let unsubSearch = null;

/* ---------- Toasts ---------- */
const toasts = ref([]);
const addToast = (type, text, timeout = 2600) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

/* ---------- Utils ---------- */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const badgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("complet") || s.includes("aprob") || s.includes("recep")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("curso") || s.includes("enviada") || s.includes("revisión")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("anul")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("solicit")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};
const prettyTS = (v) => {
  if (!v) return "—";
  if (v instanceof Timestamp) return v.toDate().toISOString().replace("T"," ").replace("Z","");
  if (v?.seconds) return new Date(v.seconds*1000).toISOString().replace("T"," ").replace("Z","");
  if (typeof v === "string") return v.replace("T"," ").replace("Z","");
  return String(v);
};

/* ---------- Paginación (tiempo real) ---------- */
const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons/2));
  for (let i=0; i<maxButtons; i++) pages.push(start+i);
  return pages;
});

function buildBaseQuery(page, withFilters = true){
  const col = collection(db, "ordenes_oc_taller");
  let clauses = [ orderBy("id", "desc") ];
  if (withFilters) {
    if (filtroEstatus.value) clauses.unshift(where("estatus", "==", filtroEstatus.value));
    if (filtroResponsable.value) clauses.unshift(where("responsable", "==", filtroResponsable.value));
  }
  if (page === 1) {
    clauses.push(limit(PAGE_SIZE + 1));
    return query(col, ...clauses);
  } else {
    const prevCursor = pageCursors.value[page-2];
    if (!prevCursor) return null;
    clauses.splice(clauses.findIndex(c => c.type === "orderBy") + 1, 0, startAfter(prevCursor));
    clauses.push(limit(PAGE_SIZE + 1));
    return query(col, ...clauses);
  }
}

function subscribePage(page){
  if (unsubList) { unsubList(); unsubList = null; }
  if (unsubSearch) { unsubSearch(); unsubSearch = null; }

  cargando.value = true;
  busquedaActiva.value = false;

  const qy = buildBaseQuery(page, true);
  if (!qy) { cargando.value = false; return; }

  unsubList = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ __id: d.id, ...d.data(), __snap: d }));
    hasNextPage.value = arr.length > PAGE_SIZE;
    const pageDocs = arr.slice(0, PAGE_SIZE);
    rows.value = pageDocs.map(x => { const y = { ...x }; delete y.__snap; return y; });
    const lastSnap = pageDocs.length ? pageDocs[pageDocs.length-1].__snap : null;
    if (lastSnap) pageCursors.value[page-1] = lastSnap;
    cargando.value = false;
  }, (err) => {
    console.error("onSnapshot page:", err);
    addToast("danger", "Error listando OC Taller (posible índice compuesto faltante).");
    cargando.value = false;
  });
}

function goToPage(n){
  if (n < 1) return;
  if (n > currentPage.value + 1 && !hasNextPage.value) return;
  currentPage.value = n;
  subscribePage(n);
}
function aplicarFiltros(){ currentPage.value = 1; subscribePage(1); }

/* ---------- Buscar por ID doc o id numérico ---------- */
async function onBuscar(){
  const raw = (buscarTexto.value ?? "").trim();
  if (!raw) { limpiarBusqueda(); return; }

  const num = parseInt(raw, 10);
  if (!isNaN(num) && String(num) === raw) {
    if (unsubList) { unsubList(); unsubList = null; }
    if (unsubSearch) { unsubSearch(); unsubSearch = null; }
    cargando.value = true; busquedaActiva.value = true;

    const col = collection(db, "ordenes_oc_taller");
    const clauses = [ where("id", "==", num), orderBy("id", "desc"), limit(10) ];
    if (filtroEstatus.value) clauses.unshift(where("estatus","==",filtroEstatus.value));
    if (filtroResponsable.value) clauses.unshift(where("responsable","==",filtroResponsable.value));
    const qy = query(col, ...clauses);

    unsubSearch = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ __id: d.id, ...d.data() }));
      rows.value = arr;
      cargando.value = false;
      hasNextPage.value = false;
    }, (err) => {
      console.error("onSnapshot search id:", err);
      addToast("danger", "Error en búsqueda por ID.");
      cargando.value = false;
    });
    return;
  }

  if (raw.length >= 8) {
    if (unsubList) { unsubList(); unsubList = null; }
    if (unsubSearch) { unsubSearch(); unsubSearch = null; }
    cargando.value = true; busquedaActiva.value = true;
    try {
      const dref = doc(db, "ordenes_oc_taller", raw);
      const d = await getDoc(dref);
      const found = d.exists() ? [{ __id: d.id, ...d.data() }] : [];
      rows.value = found;
      cargando.value = false;
      hasNextPage.value = false;
      if (!found.length) addToast("warning", "No se encontró la OC Taller con ese ID de documento.");
    } catch (e) {
      console.error(e);
      addToast("danger", "Error en búsqueda por ID de documento.");
      cargando.value = false;
    }
    return;
  }

  addToast("warning", "Ingresa un ID numérico o un ID de documento válido.");
}
function limpiarBusqueda(){
  buscarTexto.value = "";
  busquedaActiva.value = false;
  currentPage.value = 1;
  subscribePage(1);
}

/* ---------- Editor (offcanvas) ---------- */
const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);

/* Campos de calendario (editor) */
const fechaSubidaLocal = ref("");     // YYYY-MM-DDTHH:mm
const fechaAprobacionLocal = ref(""); // YYYY-MM-DDTHH:mm

// Archivo OC (único) - edición
const archivoOCFile = ref(null);
function onArchivoOC(e){ const f = (e.target.files || [])[0]; archivoOCFile.value = f || null; }
function borrarArchivoOC(){ edit.value.archivoOC = null; }

// Archivos Storage (múltiples) - edición
const nuevosStorageFiles = ref([]);
function onArchivosStorage(e){ nuevosStorageFiles.value = Array.from(e.target.files || []); }
function eliminarArchivoStorage(ix){ edit.value.archivosStorage.splice(ix, 1); }

function abrirEditor(row){
  seleccion.value = row;
  edit.value = deepClone({
    aprobadoPor: row.aprobadoPor ?? "",
    aprobadorSugerido: row.aprobadorSugerido ?? "",
    archivoOC: row.archivoOC ?? null,
    archivosStorage: Array.isArray(row.archivosStorage) ? deepClone(row.archivosStorage) : [],
    centroCostoTexto: row.centroCostoTexto ?? "",
    comentario: row.comentario ?? "",
    empresa: row.empresa ?? "Xtreme Servicios",
    estatus: row.estatus ?? "Solicitado",
    fechaAprobacion: row.fechaAprobacion ?? null,
    fechaSubida: row.fechaSubida ?? null,
    historial: Array.isArray(row.historial) ? deepClone(row.historial) : [],
    id: row.id ?? null,
    moneda: row.moneda ?? "CLP",
    precioTotalConIVA: row.precioTotalConIVA ?? 0,
    responsable: row.responsable ?? "",
    tipoCompra: row.tipoCompra ?? "",
    tipo_solped: row.tipo_solped ?? "Sin SOLPED",
    numero_solped: row.numero_solped ?? ""
  });

  // Pinta valores en inputs datetime-local
  fechaSubidaLocal.value = toLocalInputValue(edit.value.fechaSubida);
  fechaAprobacionLocal.value = toLocalInputValue(edit.value.fechaAprobacion);

  editorAbierto.value = true;

  // reset inputs file
  const a = document.getElementById("inputArchivoOC"); if (a) a.value = "";
  const b = document.getElementById("inputArchivosStorage"); if (b) b.value = "";
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];
}
function cerrarEditor(){
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];
}

/* Sincroniza inputs datetime-local -> objeto edit (Timestamp) */
watch(fechaSubidaLocal, (val) => {
  const d = fromLocalInputValue(val);
  edit.value.fechaSubida = d ? Timestamp.fromDate(d) : null;
});
watch(fechaAprobacionLocal, (val) => {
  const d = fromLocalInputValue(val);
  edit.value.fechaAprobacion = d ? Timestamp.fromDate(d) : null;
});

/* ---------- Guardar Edición ---------- */
async function guardarEdicion() {
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const idDoc = seleccion.value.__id;
    const dref = doc(db, "ordenes_oc_taller", idDoc);

    // Reemplazar archivoOC si corresponde
    if (archivoOCFile.value) {
      const storage = getStorage();
      const path = `ordenes_oc_taller/${idDoc}/oc_enviada_${Date.now()}_${archivoOCFile.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoOCFile.value);
      const url = await getDownloadURL(up.ref);

      edit.value.archivoOC = {
        nombre: archivoOCFile.value.name,
        tipo: archivoOCFile.value.type || "application/octet-stream",
        url,
        fechaSubida: Timestamp.fromDate(new Date())
      };
      archivoOCFile.value = null;
    }

    // Agregar archivosStorage nuevos
    if (nuevosStorageFiles.value?.length) {
      const storage = getStorage();
      const uploads = [];
      for (const f of nuevosStorageFiles.value) {
        const path = `ordenes_oc_taller/${idDoc}/${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({ nombre: f.name, tipo: f.type || "application/octet-stream", url });
      }
      if (!Array.isArray(edit.value.archivosStorage)) edit.value.archivosStorage = [];
      edit.value.archivosStorage.push(...uploads);
      nuevosStorageFiles.value = [];
    }

    // Normalizaciones numéricas
    if (typeof edit.value.id === "string") {
      const n = parseInt(edit.value.id, 10);
      edit.value.id = isNaN(n) ? null : n;
    }
    if (typeof edit.value.precioTotalConIVA === "string") {
      const n = parseInt(edit.value.precioTotalConIVA, 10);
      edit.value.precioTotalConIVA = isNaN(n) ? 0 : n;
    }

    // Ítems si existieran
    if (Array.isArray(edit.value.items)) {
      edit.value.items = edit.value.items.map(it => ({
        ...it,
        item: Number(it.item ?? 0),
        cantidad: Number(it.cantidad ?? 0),
        cantidad_cotizada: Number(it.cantidad_cotizada ?? it.cantidad ?? 0),
        precio_unitario: Number(it.precio_unitario ?? 0),
        precioTotalConIVA: Number(it.precioTotalConIVA ?? 0),
      }));
    }

    await updateDoc(dref, deepClone(edit.value));
    addToast("success", "Orden OC Taller actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

/* ---------- Historial ---------- */
function agregarHistorial(){
  if (!Array.isArray(edit.value.historial)) edit.value.historial = [];
  edit.value.historial.push({
    estatus: edit.value.estatus || "Actualizado",
    fecha: new Date().toISOString(),
    usuario: edit.value.responsable || edit.value.aprobadoPor || ""
  });
}
function eliminarHistorial(ix){ edit.value.historial.splice(ix, 1); }

/* ---------- Modal de confirmación de borrado ---------- */
const confirmOpen = ref(false);
const confirmRow  = ref(null);
const eliminando  = ref(false);

function abrirConfirm(row){ confirmRow.value = row; confirmOpen.value = true; }
function cerrarConfirm(){ if (eliminando.value) return; confirmOpen.value = false; confirmRow.value = null; }
async function confirmarEliminar(){
  if (!confirmRow.value?.__id) return;
  try {
    eliminando.value = true;
    await deleteDoc(doc(db, "ordenes_oc_taller", confirmRow.value.__id));
    addToast("success", "Orden OC Taller eliminada.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar.");
  } finally {
    eliminando.value = false;
  }
}

/* ---------- Crear nueva OC ---------- */
const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});
const archivoOCNuevo = ref(null);
const archivoOCNuevoNombre = ref("");
const previewArchivosStorageNuevo = ref([]);

/* Calendario para nueva */
const nuevoFechaSubidaLocal = ref("");

function defaultNuevo(){
  return {
    id: null,
    empresa: "Xtreme Servicios",
    estatus: "Solicitado",
    comentario: "",
    centroCostoTexto: "",
    responsable: "",
    aprobadoPor: "",
    aprobadorSugerido: "",
    tipoCompra: "stock",
    tipo_solped: "Sin SOLPED",
    numero_solped: "",
    moneda: "CLP",
    precioTotalConIVA: 0,
    // archivos
    archivoOC: null,
    archivosStorage: [],
    // timestamps
    fechaSubida: null,
    fechaAprobacion: null,
    // otros
    historial: [],
    items: []
  };
}
function abrirModalNueva(){
  nuevo.value = defaultNuevo();
  archivoOCNuevo.value = null;
  archivoOCNuevoNombre.value = "";
  previewArchivosStorageNuevo.value = [];
  nuevoFechaSubidaLocal.value = toLocalInputValue(new Date());
  modalNueva.value = true;
}
function cerrarModalNueva(){ modalNueva.value = false; }
function onArchivoOCNuevo(e){
  const f = (e.target.files || [])[0];
  archivoOCNuevo.value = f || null;
  archivoOCNuevoNombre.value = f?.name || "";
}
function onArchivosStorageNuevo(e){
  previewArchivosStorageNuevo.value = Array.from(e.target.files || []);
}

async function crearNueva(){
  try {
    creando.value = true;

    if (typeof nuevo.value.id === "string") {
      const n = parseInt(nuevo.value.id, 10);
      nuevo.value.id = isNaN(n) ? null : n;
    }
    if (typeof nuevo.value.precioTotalConIVA === "string") {
      const n = parseInt(nuevo.value.precioTotalConIVA, 10);
      nuevo.value.precioTotalConIVA = isNaN(n) ? 0 : n;
    }

    // Setear fechaSubida desde input calendario
    const d = fromLocalInputValue(nuevoFechaSubidaLocal.value);
    nuevo.value.fechaSubida = d ? Timestamp.fromDate(d) : null;

    // 1) crea doc base
    const payload = deepClone(nuevo.value);
    payload.archivoOC = null;
    payload.archivosStorage = [];
    const dref = await addDoc(collection(db, "ordenes_oc_taller"), payload);

    // 2) subir archivoOC si hay
    if (archivoOCNuevo.value) {
      const storage = getStorage();
      const path = `ordenes_oc_taller/${dref.id}/oc_enviada_${Date.now()}_${archivoOCNuevo.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoOCNuevo.value);
      const url = await getDownloadURL(up.ref);
      await updateDoc(doc(db, "ordenes_oc_taller", dref.id), {
        archivoOC: {
          nombre: archivoOCNuevo.value.name,
          tipo: archivoOCNuevo.value.type || "application/octet-stream",
          url,
          fechaSubida: Timestamp.fromDate(new Date())
        }
      });
    }

    // 3) subir archivosStorage si hay
    if (previewArchivosStorageNuevo.value.length) {
      const storage = getStorage();
      const uploads = [];
      for (const f of previewArchivosStorageNuevo.value) {
        const path = `ordenes_oc_taller/${dref.id}/${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({ nombre: f.name, tipo: f.type || "application/octet-stream", url });
      }
      await updateDoc(doc(db, "ordenes_oc_taller", dref.id), { archivosStorage: uploads });
    }

    addToast("success", `OC Taller creada${payload.id ? ` (#${payload.id})` : ""}.`);
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la Orden OC Taller.");
  } finally {
    creando.value = false;
  }
}

/* ---------- Acciones auxiliares ---------- */
function verArchivoOC(row){
  const url = row?.archivoOC?.url;
  if (!url) { addToast("warning", "Esta OC Taller no tiene archivoOC aún."); return; }
  window.open(url, "_blank");
}

/* ---------- Lifecycle ---------- */
onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => {
  if (unsubList) unsubList();
  if (unsubSearch) unsubSearch();
});
</script>

<style scoped>
.admin-oc-page{
  min-height:100vh;
}

/* Offcanvas */
.offcanvas-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: grid; place-items: end; z-index: 1080;
}
.offcanvas-panel{
  width: min(900px, 100%);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  height: 100vh;
  box-shadow: -12px 0 32px rgba(0,0,0,.25);
  animation: slideIn .22s ease-out;
  display: flex; flex-direction: column;
}
.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem;
  border-bottom: 1px solid #eee;
}
.offcanvas-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.offcanvas-body{
  padding: 1rem;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
}
@keyframes slideIn{
  from{ transform: translateX(20px); opacity:.0; }
  to{ transform: translateX(0); opacity:1; }
}

/* Modal */
.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1080; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 700px;  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}
.vmodal-header, .vmodal-footer{
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }

/* Toasts */
.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* Icono del modal de eliminación */
.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}
</style>
