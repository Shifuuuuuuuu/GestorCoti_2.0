<!-- src/views/ProveedoresView.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-proveedores-page">
    <div class="page-glow glow-1"></div>
    <div class="page-glow glow-2"></div>

    <div class="container py-4 py-md-5 position-relative">
      <!-- HEADER / HERO -->
      <section class="hero-card mb-4">
        <div class="hero-pattern"></div>

        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap position-relative">
          <div>
            <div class="hero-badge mb-2">
              <i class="bi bi-buildings me-2"></i>
              Gestión administrativa
            </div>

            <h1 class="hero-title mb-1">Proveedores</h1>
            <p class="hero-subtitle mb-0">
              Administra proveedores con un registro simple y carga masiva desde Excel.
            </p>
          </div>

          <div class="hero-actions d-none d-md-flex align-items-stretch gap-2 flex-wrap w-100 w-xl-auto ms-xl-3">
            <div class="search-shell minw-320">
              <i class="bi bi-search search-icon"></i>
              <input
                class="search-input"
                placeholder="Buscar por nombre o RUT"
                v-model="buscarTexto"
              />
              <button
                v-if="buscarTexto"
                class="search-clear"
                @click="limpiarBusqueda"
                title="Limpiar búsqueda"
                type="button"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <button class="btn btn-soft-primary btn-toolbar" @click="cargarProveedores">
              <i class="bi bi-arrow-clockwise me-1"></i> Recargar
            </button>

            <button class="btn btn-soft-success btn-toolbar" @click="abrirSelectorExcel" :disabled="cargandoExcel">
              <span v-if="cargandoExcel" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-file-earmark-excel me-1"></i>
              Carga masiva
            </button>

            <button class="btn btn-brand btn-toolbar" @click="abrirModalNuevo">
              <i class="bi bi-plus-lg me-1"></i> Nuevo proveedor
            </button>

            <input
              ref="excelInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="d-none"
              @change="procesarExcel"
            />
          </div>
        </div>

        <div class="d-flex d-md-none flex-column gap-2 mt-3 position-relative">
          <div class="search-shell w-100">
            <i class="bi bi-search search-icon"></i>
            <input
              class="search-input"
              placeholder="Buscar por nombre o RUT"
              v-model="buscarTexto"
            />
            <button
              v-if="buscarTexto"
              class="search-clear"
              @click="limpiarBusqueda"
              type="button"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="d-flex gap-2 w-100">
            <button class="btn btn-soft-primary flex-fill btn-toolbar" @click="cargarProveedores">
              <i class="bi bi-arrow-clockwise me-1"></i> Recargar
            </button>
            <button class="btn btn-soft-success flex-fill btn-toolbar" @click="abrirSelectorExcel" :disabled="cargandoExcel">
              <span v-if="cargandoExcel" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-file-earmark-excel me-1"></i> Excel
            </button>
            <button class="btn btn-brand flex-fill btn-toolbar" @click="abrirModalNuevo">
              <i class="bi bi-plus-lg me-1"></i> Nuevo
            </button>
          </div>

          <input
            ref="excelInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            class="d-none"
            @change="procesarExcel"
          />
        </div>
      </section>

      <!-- RESUMEN -->
      <section class="stats-strip mb-4">
        <div class="stat-pill">
          <div class="stat-icon stat-icon-blue">
            <i class="bi bi-buildings"></i>
          </div>
          <div>
            <div class="stat-label">Total</div>
            <div class="stat-value">{{ rows.length }}</div>
          </div>
        </div>

        <div class="stat-pill">
          <div class="stat-icon stat-icon-slate">
            <i class="bi bi-funnel"></i>
          </div>
          <div>
            <div class="stat-label">Mostrando</div>
            <div class="stat-value">{{ rowsFiltradas.length }}</div>
          </div>
        </div>

        <div class="stat-pill" v-if="buscarTexto">
          <div class="stat-icon stat-icon-emerald">
            <i class="bi bi-search"></i>
          </div>
          <div class="min-w-0">
            <div class="stat-label">Búsqueda activa</div>
            <div class="stat-value text-truncate" style="max-width: 220px;">{{ buscarTexto }}</div>
          </div>
        </div>
      </section>

      <!-- TABLA / LISTADO -->
      <section class="list-shell">
        <div class="list-header">
          <div>
            <div class="list-title">Listado de proveedores</div>
            <div class="list-subtitle">
              Solo se administra nombre y RUT.
            </div>
          </div>

          <div class="list-counter">
            <span>{{ rowsFiltradas.length }}</span>
          </div>
        </div>

        <!-- TABLA DESKTOP -->
        <div class="table-responsive d-none d-md-block">
          <table class="table providers-table align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 80px;">#</th>
                <th>Proveedor</th>
                <th style="width: 190px;">RUT</th>
                <th style="width: 220px;">Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="cargando">
                <td colspan="6" class="text-center py-5">
                  <div class="loading-wrap">
                    <div class="spinner-border" role="status"></div>
                    <div class="small text-secondary mt-3">Cargando proveedores…</div>
                  </div>
                </td>
              </tr>

              <tr v-else-if="rowsFiltradas.length === 0">
                <td colspan="6" class="text-center py-5">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="bi bi-inbox"></i>
                    </div>
                    <div class="empty-title">No hay proveedores registrados</div>
                    <div class="empty-text">
                      Agrega proveedores manualmente o mediante Excel.
                    </div>
                  </div>
                </td>
              </tr>

              <tr v-else v-for="(r, index) in rowsFiltradas" :key="r.__id">
                <td>
                  <div class="row-index">{{ index + 1 }}</div>
                </td>

                <td>
                  <div class="provider-main">
                    <div class="provider-avatar">
                      {{ (r.nombre || "P").charAt(0).toUpperCase() }}
                    </div>

                    <div class="min-w-0">
                      <div class="provider-name text-truncate">{{ r.nombre || "—" }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="rut-chip">
                    <i class="bi bi-person-vcard me-1"></i>
                    {{ r.rut || "—" }}
                  </span>
                </td>

                <td>
                  <div class="action-group d-none d-sm-inline-flex">
                    <button class="btn action-btn action-edit" @click="abrirEditor(r)" title="Editar">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn action-btn action-delete" @click="abrirConfirm(r)" title="Eliminar">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>

                  <div class="dropdown d-inline d-sm-none">
                    <button
                      class="btn btn-soft-secondary btn-sm dropdown-toggle"
                      data-bs-toggle="dropdown"
                      type="button"
                    >
                      Acciones
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2">
                      <li>
                        <button class="dropdown-item rounded-3" @click="abrirDetalle(r)">
                          <i class="bi bi-eye me-2"></i>Ver
                        </button>
                      </li>
                      <li>
                        <button class="dropdown-item rounded-3" @click="abrirEditor(r)">
                          <i class="bi bi-pencil-square me-2"></i>Editar
                        </button>
                      </li>
                      <li><hr class="dropdown-divider" /></li>
                      <li>
                        <button class="dropdown-item rounded-3 text-danger" @click="abrirConfirm(r)">
                          <i class="bi bi-trash3 me-2"></i>Eliminar
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- LISTADO MOBILE -->
        <div class="mobile-cards d-block d-md-none">
          <div v-if="cargando" class="text-center py-5">
            <div class="loading-wrap">
              <div class="spinner-border" role="status"></div>
              <div class="small text-secondary mt-3">Cargando proveedores…</div>
            </div>
          </div>

          <div v-else-if="rowsFiltradas.length === 0" class="py-5">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-inbox"></i>
              </div>
              <div class="empty-title">No hay proveedores registrados</div>
              <div class="empty-text">
                Agrega un nuevo proveedor o súbelos desde Excel.
              </div>
            </div>
          </div>

          <div v-else class="mobile-grid">
            <article v-for="r in rowsFiltradas" :key="r.__id" class="provider-mobile-card">
              <div class="mobile-card-top">
                <div class="provider-main min-w-0">
                  <div class="provider-avatar">
                    {{ (r.nombre || "P").charAt(0).toUpperCase() }}
                  </div>

                  <div class="min-w-0">
                    <div class="provider-name text-truncate">{{ r.nombre || "—" }}</div>
                    <div class="provider-address text-truncate">{{ r.rut || "—" }}</div>
                  </div>
                </div>

                <button class="btn action-btn action-view btn-sm" @click="abrirDetalle(r)">
                  <i class="bi bi-eye"></i>
                </button>
              </div>

              <div class="mobile-card-body">
                <div class="mobile-info-row">
                  <span class="mobile-info-label">RUT</span>
                  <span class="mobile-info-value">{{ r.rut || "—" }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Creado</span>
                  <span class="mobile-info-value">{{ prettyTS(r.createdAt) }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Actualizado</span>
                  <span class="mobile-info-value">{{ prettyTS(r.updatedAt) }}</span>
                </div>
              </div>

              <div class="mobile-card-actions">
                <button class="btn btn-soft-primary flex-fill" @click="abrirEditor(r)">
                  <i class="bi bi-pencil-square me-1"></i> Editar
                </button>
                <button class="btn btn-soft-danger" @click="abrirConfirm(r)">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- TOASTS -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i
            class="me-2"
            :class="t.type === 'success'
              ? 'bi bi-check-circle-fill'
              : (t.type === 'warning'
                ? 'bi bi-exclamation-triangle-fill'
                : 'bi bi-x-circle-fill')"
          ></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVO -->
    <div v-if="modalNuevo" class="vmodal-backdrop" @click.self="cerrarModalNuevo">
      <div class="vmodal">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">Crear registro</div>
            <h5 class="mb-0 fw-bold">Nuevo proveedor</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-md-8">
                <label class="form-label">Nombre proveedor *</label>
                <input
                  class="form-control modern-input"
                  v-model="nuevo.nombre"
                  placeholder="Ej: Comercial Xtreme SpA"
                />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">RUT *</label>
                <input
                  class="form-control modern-input"
                  v-model="nuevo.rut"
                  @input="onRutInputNuevo"
                  maxlength="12"
                  placeholder="21.098.143-8"
                />
                <div class="form-text">Se formatea automáticamente.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="vmodal-footer">
          <button class="btn btn-soft-secondary" @click="cerrarModalNuevo">Cancelar</button>
          <button class="btn btn-brand" :disabled="creando" @click="crearProveedor">
            <span v-if="creando" class="spinner-border spinner-border-sm me-2"></span>
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- EDITOR -->
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Editar registro</div>
            <div class="fw-bold fs-5 text-truncate">Proveedor</div>
          </div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-md-8">
                <label class="form-label">Nombre proveedor *</label>
                <input
                  class="form-control modern-input"
                  v-model="edit.nombre"
                  placeholder="Nombre proveedor"
                />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">RUT *</label>
                <input
                  class="form-control modern-input"
                  v-model="edit.rut"
                  @input="onRutInputEdit"
                  maxlength="12"
                  placeholder="21.098.143-8"
                />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Fecha creación</label>
                <input class="form-control modern-input soft-disabled" :value="prettyTS(edit.createdAt)" disabled />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Última actualización</label>
                <input class="form-control modern-input soft-disabled" :value="prettyTS(edit.updatedAt)" disabled />
              </div>
            </div>
          </div>
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-end gap-2 flex-wrap">
            <button class="btn btn-soft-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-brand" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DETALLE -->
    <div v-if="detalleAbierto" class="offcanvas-backdrop" @click.self="cerrarDetalle">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Vista de detalle</div>
            <div class="fw-bold fs-5 text-truncate">Proveedor</div>
          </div>
          <button class="btn-close" @click="cerrarDetalle"></button>
        </div>

        <div class="offcanvas-body">
          <div class="detalle-card">
            <div class="detalle-hero">
              <div class="detalle-avatar">
                {{ (detalle.nombre || "P").charAt(0).toUpperCase() }}
              </div>

              <div class="min-w-0">
                <div class="detalle-titulo text-truncate">
                  {{ detalle.nombre || "—" }}
                </div>
                <div class="detalle-subtitulo text-truncate">
                  Proveedor registrado
                </div>
              </div>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-12 col-md-6">
                <div class="detail-label">RUT</div>
                <div class="detail-value"><i class="bi bi-person-vcard me-2"></i>{{ detalle.rut || "—" }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="detail-label">Fecha creación</div>
                <div class="detail-value"><i class="bi bi-calendar3 me-2"></i>{{ prettyTS(detalle.createdAt) }}</div>
              </div>

              <div class="col-12 col-md-6">
                <div class="detail-label">Última actualización</div>
                <div class="detail-value"><i class="bi bi-clock-history me-2"></i>{{ prettyTS(detalle.updatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-end gap-2 flex-wrap">
            <button class="btn btn-soft-primary" @click="editarDesdeDetalle">
              <i class="bi bi-pencil-square me-1"></i> Editar
            </button>
            <button class="btn btn-soft-secondary" @click="cerrarDetalle">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ELIMINAR -->
    <div v-if="confirmOpen" class="vmodal-backdrop" @click.self="cerrarConfirm">
      <div class="vmodal modal-sm-pro">
        <div class="vmodal-header d-flex align-items-center gap-3">
          <div class="confirm-icon">
            <i class="bi bi-trash3-fill"></i>
          </div>
          <div>
            <div class="modal-kicker text-danger-emphasis">Acción delicada</div>
            <h5 class="mb-0 fw-bold">Confirmar eliminación</h5>
            <small class="text-secondary">Esta acción no se puede deshacer</small>
          </div>
          <button class="btn-close ms-auto" @click="cerrarConfirm" :disabled="eliminando"></button>
        </div>

        <div class="vmodal-body">
          <p class="mb-3">
            ¿Seguro que quieres eliminar el proveedor
            <strong>{{ confirmRow?.nombre || "—" }}</strong>?
          </p>

          <div class="confirm-box">
            <div class="confirm-row">
              <span>RUT</span>
              <strong>{{ confirmRow?.rut || "—" }}</strong>
            </div>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarConfirm" :disabled="eliminando">
            Cancelar
          </button>
          <button class="btn btn-danger btn-delete-strong" @click="confirmarEliminar" :disabled="eliminando">
            <span v-if="eliminando" class="spinner-border spinner-border-sm me-2"></span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import * as XLSX from "xlsx";
import { db } from "@/stores/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const rows = ref([]);
const cargando = ref(true);
const cargandoExcel = ref(false);
let unsubList = null;

const buscarTexto = ref("");
const excelInput = ref(null);

const modalNuevo = ref(false);
const creando = ref(false);

const editorAbierto = ref(false);
const guardando = ref(false);
const seleccion = ref(null);
const edit = ref({});

const detalleAbierto = ref(false);
const detalle = ref({});

const confirmOpen = ref(false);
const confirmRow = ref(null);
const eliminando = ref(false);

const toasts = ref([]);

const nuevoBase = () => ({
  nombre: "",
  rut: "",
});

const nuevo = ref(nuevoBase());

const addToast = (type, text, timeout = 2600) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};

const closeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const prettyTS = (v) => {
  if (!v) return "—";
  if (v instanceof Timestamp) return formatDate(v.toDate());
  if (v?.seconds) return formatDate(new Date(v.seconds * 1000));
  if (v instanceof Date) return formatDate(v);
  if (typeof v === "string") return v.replace("T", " ").replace("Z", "");
  return String(v);
};

function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function normalizarTexto(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function cleanRut(value) {
  return String(value || "")
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

function formatRut(value) {
  const clean = cleanRut(value);
  if (!clean) return "";
  if (clean.length === 1) return clean;

  const dv = clean.slice(-1);
  let body = clean.slice(0, -1);

  body = body.replace(/^0+/, "") || "0";

  let formattedBody = "";
  let count = 0;

  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body[i] + formattedBody;
    count++;
    if (count === 3 && i !== 0) {
      formattedBody = "." + formattedBody;
      count = 0;
    }
  }

  return `${formattedBody}-${dv}`;
}

function validarRut(rutCompleto) {
  const clean = cleanRut(rutCompleto);
  if (clean.length < 2) return false;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  if (!/^\d+$/.test(body)) return false;

  let suma = 0;
  let multiplo = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    suma += Number(body[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = 11 - (suma % 11);
  let dvEsperado = "";

  if (resto === 11) dvEsperado = "0";
  else if (resto === 10) dvEsperado = "K";
  else dvEsperado = String(resto);

  return dvEsperado === dv.toUpperCase();
}

function onRutInputNuevo() {
  nuevo.value.rut = formatRut(nuevo.value.rut);
}

function onRutInputEdit() {
  edit.value.rut = formatRut(edit.value.rut);
}

function cargarProveedores() {
  if (unsubList) {
    unsubList();
    unsubList = null;
  }

  cargando.value = true;

  const qy = query(collection(db, "proveedores"), orderBy("createdAt", "desc"));

  unsubList = onSnapshot(
    qy,
    (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ __id: d.id, ...d.data() }));
      rows.value = arr;
      cargando.value = false;
    },
    (err) => {
      console.error(err);
      addToast("danger", "Error cargando proveedores.");
      cargando.value = false;
    }
  );
}

const rowsFiltradas = computed(() => {
  const q = normalizarTexto(buscarTexto.value);
  if (!q) return rows.value;

  return rows.value.filter((r) => {
    return [r.nombre, r.rut].some((campo) => normalizarTexto(campo).includes(q));
  });
});

function limpiarBusqueda() {
  buscarTexto.value = "";
}

function abrirModalNuevo() {
  nuevo.value = nuevoBase();
  modalNuevo.value = true;
}

function cerrarModalNuevo() {
  if (creando.value) return;
  modalNuevo.value = false;
  nuevo.value = nuevoBase();
}

async function crearProveedor() {
  try {
    if (!nuevo.value.nombre?.trim()) {
      addToast("warning", "Debes ingresar el nombre del proveedor.");
      return;
    }

    if (!nuevo.value.rut?.trim()) {
      addToast("warning", "Debes ingresar el RUT.");
      return;
    }

    nuevo.value.rut = formatRut(nuevo.value.rut);

    if (!validarRut(nuevo.value.rut)) {
      addToast("warning", "El RUT ingresado no es válido.");
      return;
    }

    const rutNormalizado = cleanRut(nuevo.value.rut);

    const existe = rows.value.some((r) => cleanRut(r.rut) === rutNormalizado);
    if (existe) {
      addToast("warning", "Ya existe un proveedor con ese RUT.");
      return;
    }

    creando.value = true;

    await addDoc(collection(db, "proveedores"), {
      nombre: nuevo.value.nombre.trim(),
      rut: nuevo.value.rut.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    addToast("success", "Proveedor creado correctamente.");
    cerrarModalNuevo();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear el proveedor.");
  } finally {
    creando.value = false;
  }
}

function abrirEditor(row) {
  seleccion.value = row;
  edit.value = {
    nombre: row.nombre || "",
    rut: row.rut || "",
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
  editorAbierto.value = true;
}

function cerrarEditor() {
  if (guardando.value) return;
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
}

async function guardarEdicion() {
  try {
    if (!seleccion.value?.__id) return;

    if (!edit.value.nombre?.trim()) {
      addToast("warning", "Debes ingresar el nombre del proveedor.");
      return;
    }

    if (!edit.value.rut?.trim()) {
      addToast("warning", "Debes ingresar el RUT.");
      return;
    }

    edit.value.rut = formatRut(edit.value.rut);

    if (!validarRut(edit.value.rut)) {
      addToast("warning", "El RUT ingresado no es válido.");
      return;
    }

    const rutNormalizado = cleanRut(edit.value.rut);

    const existeOtro = rows.value.some(
      (r) => r.__id !== seleccion.value.__id && cleanRut(r.rut) === rutNormalizado
    );

    if (existeOtro) {
      addToast("warning", "Ya existe otro proveedor con ese RUT.");
      return;
    }

    guardando.value = true;

    await updateDoc(doc(db, "proveedores", seleccion.value.__id), {
      nombre: edit.value.nombre.trim(),
      rut: edit.value.rut.trim(),
      updatedAt: serverTimestamp(),
    });

    addToast("success", "Proveedor actualizado correctamente.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar la edición.");
  } finally {
    guardando.value = false;
  }
}

function cerrarDetalle() {
  detalleAbierto.value = false;
  detalle.value = {};
}

function editarDesdeDetalle() {
  const row = { ...detalle.value };
  cerrarDetalle();
  abrirEditor(row);
}

function abrirConfirm(row) {
  confirmRow.value = row;
  confirmOpen.value = true;
}

function cerrarConfirm() {
  if (eliminando.value) return;
  confirmOpen.value = false;
  confirmRow.value = null;
}

async function confirmarEliminar() {
  try {
    if (!confirmRow.value?.__id) return;

    eliminando.value = true;
    await deleteDoc(doc(db, "proveedores", confirmRow.value.__id));

    addToast("success", "Proveedor eliminado correctamente.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar el proveedor.");
  } finally {
    eliminando.value = false;
  }
}

function abrirSelectorExcel() {
  if (cargandoExcel.value) return;
  excelInput.value?.click();
}

function valorFilaPorLlaves(row, llaves = []) {
  for (const key of Object.keys(row || {})) {
    const normalizado = normalizarTexto(key);
    if (llaves.includes(normalizado)) {
      return row[key];
    }
  }
  return "";
}

function extraerProveedorDesdeFila(row) {
  const rut = valorFilaPorLlaves(row, ["rut"]);
  const nombre = valorFilaPorLlaves(row, [
    "nombre",
    "proveedor",
    "razon social",
    "razon_social",
    "razón social",
  ]);

  return {
    rut: formatRut(String(rut || "").trim()),
    nombre: String(nombre || "").trim(),
  };
}

async function procesarExcel(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    cargandoExcel.value = true;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      addToast("warning", "El archivo no contiene hojas válidas.");
      return;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!jsonRows.length) {
      addToast("warning", "El archivo no contiene registros.");
      return;
    }

    // Opción 2: NO validar dígito verificador
    const proveedoresPreparados = jsonRows
      .map(extraerProveedorDesdeFila)
      .filter((item) => item.nombre && item.rut);

    if (!proveedoresPreparados.length) {
      addToast("warning", "No se encontraron filas válidas con columnas nombre/proveedor y rut.");
      return;
    }

    const existentesSnap = await getDocs(collection(db, "proveedores"));
    const rutsExistentes = new Set();

    existentesSnap.forEach((d) => {
      const data = d.data();
      if (data?.rut) rutsExistentes.add(cleanRut(data.rut));
    });

    const rutsArchivo = new Set();
    const finales = [];

    for (const item of proveedoresPreparados) {
      const rutLimpio = cleanRut(item.rut);
      if (!rutLimpio) continue;
      if (rutsExistentes.has(rutLimpio)) continue;
      if (rutsArchivo.has(rutLimpio)) continue;

      rutsArchivo.add(rutLimpio);
      finales.push({
        nombre: item.nombre.trim(),
        rut: formatRut(item.rut),
      });
    }

    if (!finales.length) {
      addToast("warning", "No hay nuevos proveedores para cargar. Puede que ya existan por RUT.");
      return;
    }

    const chunkSize = 450;

    for (let i = 0; i < finales.length; i += chunkSize) {
      const chunk = finales.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const ref = doc(collection(db, "proveedores"));
        batch.set(ref, {
          nombre: item.nombre,
          rut: item.rut,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }

    addToast("success", `Carga masiva completada. Se agregaron ${finales.length} proveedores.`);
  } catch (error) {
    console.error(error);
    addToast("danger", "No se pudo procesar el archivo Excel.");
  } finally {
    cargandoExcel.value = false;
    if (excelInput.value) excelInput.value.value = "";
  }
}

onMounted(() => {
  cargarProveedores();
});

onBeforeUnmount(() => {
  if (unsubList) unsubList();
});
</script>

<style scoped>
:root {
  color-scheme: light;
}

.page-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

.glow-1 {
  width: 280px;
  height: 280px;
  top: -60px;
  right: -40px;
  background: rgba(37, 99, 235, 0.12);
}

.glow-2 {
  width: 240px;
  height: 240px;
  left: -80px;
  bottom: 80px;
  background: rgba(16, 185, 129, 0.10);
}

.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88));
  border: 1px solid rgba(255,255,255,0.75);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 700;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.hero-title {
  font-size: clamp(1.7rem, 2vw, 2.2rem);
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  max-width: 760px;
  color: #64748b;
  font-size: 0.98rem;
}

.hero-actions {
  position: relative;
  z-index: 1;
}

.search-shell {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 52px;
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  overflow: hidden;
}

.search-shell:focus-within {
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10), inset 0 1px 0 rgba(255,255,255,0.6);
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #64748b;
  font-size: 0.95rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 52px;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 0 44px 0 44px;
  color: #0f172a;
  font-size: 0.95rem;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-clear {
  position: absolute;
  right: 10px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  display: grid;
  place-items: center;
  transition: 0.2s ease;
}

.search-clear:hover {
  background: rgba(148, 163, 184, 0.12);
  color: #0f172a;
}

.minw-320 {
  min-width: 320px;
}

.btn-toolbar {
  min-height: 52px;
  border-radius: 16px;
  padding-inline: 1rem;
  font-weight: 700;
  border-width: 1px;
}

.btn-brand {
  color: #fff;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
}

.btn-brand:hover,
.btn-brand:focus {
  color: #fff;
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
}

.btn-soft-primary {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.09);
  border: 1px solid rgba(37, 99, 235, 0.16);
  font-weight: 700;
}

.btn-soft-primary:hover,
.btn-soft-primary:focus {
  color: #1742b8;
  background: rgba(37, 99, 235, 0.14);
  border-color: rgba(37, 99, 235, 0.22);
}

.btn-soft-secondary {
  color: #334155;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.18);
  font-weight: 700;
}

.btn-soft-secondary:hover,
.btn-soft-secondary:focus {
  color: #0f172a;
  background: rgba(148, 163, 184, 0.18);
}

.btn-soft-danger {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.16);
  font-weight: 700;
}

.btn-soft-danger:hover,
.btn-soft-danger:focus {
  color: #b91c1c;
  background: rgba(220, 38, 38, 0.12);
}

.btn-soft-success {
  color: #047857;
  background: rgba(16, 185, 129, 0.10);
  border: 1px solid rgba(16, 185, 129, 0.18);
  font-weight: 700;
}

.btn-soft-success:hover,
.btn-soft-success:focus {
  color: #065f46;
  background: rgba(16, 185, 129, 0.14);
}

.stats-strip {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  min-width: 180px;
  border-radius: 20px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(255,255,255,0.76);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(10px);
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1rem;
}

.stat-icon-blue {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.stat-icon-slate {
  background: rgba(71, 85, 105, 0.12);
  color: #334155;
}

.stat-icon-emerald {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.stat-label {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 700;
}

.stat-value {
  font-size: 1.05rem;
  color: #0f172a;
  font-weight: 800;
}

.list-shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.76);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.2rem 1.3rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.74));
}

.list-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.list-subtitle {
  font-size: 0.88rem;
  color: #64748b;
}

.list-counter {
  min-width: 52px;
  height: 52px;
  padding: 0 0.9rem;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
  font-weight: 800;
  font-size: 1rem;
  border: 1px solid rgba(37, 99, 235, 0.16);
}

.providers-table {
  --bs-table-bg: transparent;
  --bs-table-striped-bg: rgba(248, 250, 252, 0.72);
  --bs-table-hover-bg: rgba(37, 99, 235, 0.035);
  margin: 0;
}

.providers-table thead th {
  background: rgba(248, 250, 252, 0.92);
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding: 1rem 1rem;
  white-space: nowrap;
}

.providers-table tbody td {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: #1e293b;
}

.providers-table tbody tr {
  transition: background 0.2s ease, transform 0.2s ease;
}

.providers-table tbody tr:hover {
  background: rgba(37, 99, 235, 0.02);
}

.row-index {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.11);
  color: #334155;
  font-weight: 800;
}

.provider-main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.provider-avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1d4ed8;
  font-weight: 800;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
}

.provider-name {
  font-size: 0.96rem;
  font-weight: 800;
  color: #0f172a;
}

.provider-address {
  color: #64748b;
  font-size: 0.83rem;
}

.rut-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #0f172a;
  font-size: 0.83rem;
  font-weight: 700;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  color: #334155;
  font-size: 0.84rem;
  font-weight: 700;
}

.action-group {
  gap: 0.45rem;
}

.action-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  box-shadow: none;
  transition: 0.2s ease;
}

.action-view {
  background: rgba(51, 65, 85, 0.08);
  color: #334155;
}

.action-view:hover {
  background: rgba(51, 65, 85, 0.14);
  color: #0f172a;
}

.action-edit {
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
}

.action-edit:hover {
  background: rgba(37, 99, 235, 0.16);
  color: #1e40af;
}

.action-delete {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

.action-delete:hover {
  background: rgba(220, 38, 38, 0.13);
  color: #b91c1c;
}

.mobile-cards {
  padding: 1rem;
}

.mobile-grid {
  display: grid;
  gap: 0.95rem;
}

.provider-mobile-card {
  border-radius: 22px;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.mobile-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.mobile-card-body {
  margin-top: 0.95rem;
  display: grid;
  gap: 0.55rem;
}

.mobile-info-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.18);
}

.mobile-info-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.mobile-info-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
}

.mobile-info-value {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 600;
}

.mobile-card-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
}

.loading-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 1rem;
  text-align: center;
}

.empty-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.10);
  color: #64748b;
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.empty-text {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 420px;
}

.toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-box {
  min-width: 280px;
  max-width: 420px;
  color: #fff;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(8px);
}

.toast-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.toast-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.toast-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.vmodal-backdrop,
.offcanvas-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(7px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.vmodal {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.72);
  box-shadow: 0 36px 90px rgba(15, 23, 42, 0.24);
  animation: fadeUp 0.22s ease;
}

.modal-sm-pro {
  max-width: 560px;
}

.vmodal-header,
.vmodal-footer {
  padding: 1.15rem 1.25rem;
  background: transparent;
}

.vmodal-header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.vmodal-body {
  padding: 1.25rem;
  max-height: 70vh;
  overflow: auto;
}

.vmodal-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.modal-kicker {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 800;
  margin-bottom: 0.2rem;
}

.form-block {
  border-radius: 22px;
  padding: 1rem;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.modern-input {
  min-height: 48px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255,255,255,0.95);
  box-shadow: none;
  color: #0f172a;
}

.modern-input:focus {
  border-color: rgba(37, 99, 235, 0.30);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
}

.soft-disabled {
  background: rgba(248, 250, 252, 0.9) !important;
  color: #64748b !important;
}

.offcanvas-panel {
  margin-left: auto;
  width: min(780px, 100%);
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  box-shadow: -16px 0 44px rgba(15, 23, 42, 0.22);
  animation: slideInRight 0.24s ease;
  border-top-left-radius: 28px;
  border-bottom-left-radius: 28px;
  overflow: hidden;
}

.offcanvas-header,
.offcanvas-footer {
  padding: 1.15rem 1.2rem;
  background: transparent;
}

.offcanvas-header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.offcanvas-body {
  padding: 1.15rem;
  overflow: auto;
  flex: 1;
}

.offcanvas-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.confirm-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-size: 1.1rem;
  flex: 0 0 auto;
}

.confirm-box {
  border-radius: 18px;
  padding: 0.9rem 1rem;
  background: rgba(255,255,255,0.68);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.confirm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.18);
}

.confirm-row:last-child {
  border-bottom: 0;
}

.confirm-row span {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
}

.confirm-row strong {
  color: #0f172a;
  text-align: right;
  word-break: break-word;
}

.btn-delete-strong {
  box-shadow: 0 10px 22px rgba(220, 38, 38, 0.22);
}

.detalle-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 24px;
  padding: 1.1rem;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}

.detalle-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.05));
}

.detalle-avatar {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 800;
  font-size: 1.25rem;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
}

.detalle-titulo {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.15rem;
}

.detalle-subtitulo {
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 600;
}

.detail-label {
  font-size: 0.78rem;
  color: #64748b;
  margin-bottom: 0.3rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  padding: 0.8rem 0.9rem;
  min-height: 50px;
  display: flex;
  align-items: center;
  color: #0f172a;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
}

.form-label {
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.45rem;
}

.form-text {
  color: #64748b;
  font-size: 0.78rem;
}

.dropdown-item {
  font-weight: 600;
  padding: 0.65rem 0.8rem;
}

.btn-close {
  box-shadow: none !important;
}

.min-w-0 {
  min-width: 0;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(28px);
    opacity: 0.82;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 991.98px) {
  .hero-card {
    padding: 1.2rem;
  }

  .list-header {
    padding: 1rem;
  }
}

@media (max-width: 767.98px) {
  .toast-stack {
    left: 12px;
    right: 12px;
    top: 12px;
  }

  .toast-box {
    min-width: 0;
    max-width: 100%;
  }

  .offcanvas-panel {
    width: 100%;
    border-radius: 0;
  }

  .vmodal {
    max-width: 100%;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 1.55rem;
  }

  .stat-pill {
    flex: 1 1 100%;
  }

  .mobile-cards {
    padding: 0.85rem;
  }

  .vmodal-body,
  .offcanvas-body,
  .vmodal-header,
  .vmodal-footer,
  .offcanvas-header,
  .offcanvas-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .detalle-hero {
    align-items: flex-start;
  }
}
</style>
