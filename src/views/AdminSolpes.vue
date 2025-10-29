<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-solpes-page">
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Admin · SOLPES</h1>

        <!-- Toolbar en una línea -->
        <div class="toolbar d-flex align-items-stretch gap-2 flex-wrap">
          <!-- Buscar numero_solpe -->
          <div class="input-group toolbar-item" style="width: 240px;">
            <span class="input-group-text">#</span>
            <input
              class="form-control"
              placeholder="Buscar numero_solpe"
              v-model="buscarNumero"
              @keyup.enter="onBuscarNumero"
            />
            <button class="btn btn-outline-secondary" @click="onBuscarNumero" title="Buscar">
              <i class="bi bi-search"></i>
            </button>
            <button
              v-if="busquedaActiva"
              class="btn btn-outline-danger"
              @click="limpiarBusqueda"
              title="Limpiar búsqueda">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Estatus (rápido) -->
          <div class="input-group toolbar-item" style="width: 220px;">
            <span class="input-group-text">Estatus</span>
            <select class="form-select" v-model="filtroEstatusHeader" @change="onChangeEstatusHeader">
              <option value="">Todos</option>
              <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <!-- Fecha -->
          <div class="input-group toolbar-item" style="width: 200px;">
            <span class="input-group-text">Fecha</span>
            <input class="form-control" type="date" v-model="filtroFecha" @change="aplicarFiltros">
          </div>

          <!-- Usuario (desde colección solpes) -->
          <div class="input-group toolbar-item" style="width: 300px;">
            <span class="input-group-text">Usuario</span>
            <select class="form-select" v-model="filtroUsuario" @change="aplicarFiltros">
              <option value="">Todos</option>
              <option v-for="u in usuariosOpts" :key="u" :value="u">{{ u }}</option>
            </select>
            <button
              v-if="filtroUsuario"
              class="btn btn-outline-secondary"
              @click="filtroUsuario=''; aplicarFiltros()"
              title="Limpiar usuario">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Nueva -->
          <button class="btn btn-primary toolbar-item" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED
          </button>
        </div>
      </div>

      <!-- Chips de filtros activos -->
      <div v-if="hasActiveFilters" class="d-flex flex-wrap align-items-center gap-2 mb-2">
        <small class="text-secondary">Filtros activos:</small>

        <span v-if="filtroFecha" class="badge bg-light text-dark border">
          Fecha: {{ filtroFecha }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroFecha=''; aplicarFiltros()"></button>
        </span>

        <span v-if="filtroUsuario" class="badge bg-light text-dark border">
          Usuario: {{ filtroUsuario }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroUsuario=''; aplicarFiltros()"></button>
        </span>

        <span v-for="es in filtroEstatus" :key="es" class="badge bg-light text-dark border">
          {{ es }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeEstatus(es)"></button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="hasActiveFilters || busquedaActiva" class="text-secondary small ms-2">paginación desactivada</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th style="width:110px;"># SOLPE</th>
                <th>Centro de Costo</th>
                <th style="width:160px;">Empresa</th>
                <th style="width:140px;">Estatus</th>
                <th style="width:120px;">Fecha</th>
                <th style="width:180px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cargando">
                <td colspan="6" class="text-center py-4">
                  <div class="spinner-border" role="status"></div>
                  <div class="small text-secondary mt-2">Cargando…</div>
                </td>
              </tr>
              <tr v-else-if="rows.length === 0">
                <td colspan="6" class="text-center py-4 text-secondary">
                  Sin resultados.
                </td>
              </tr>
              <tr v-else v-for="r in rows" :key="r.__id">
                <td>
                  <div class="fw-semibold">#{{ r.numero_solpe ?? '—' }}</div>
                </td>
                <td>
                  <div class="fw-semibold">{{ r.numero_contrato || '—' }}</div>
                  <div class="small text-secondary">{{ r.nombre_centro_costo || '—' }}</div>
                </td>
                <td>{{ r.empresa || '—' }}</td>
                <td>
                  <span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
                </td>
                <td>{{ r.fecha || '—' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="abrirEditor(r)" title="Editar">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="abrirConfirm(r)" title="Eliminar">
                      <i class="bi bi-trash3"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="irADetalle(r)" title="Ver detalle">
                      <i class="bi bi-box-arrow-up-right"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="card-footer" v-if="!busquedaActiva && !hasActiveFilters">
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
            <div class="fw-semibold">Editar SOLPED</div>
          </div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <!-- Numero SOLPE + Usuario + Estatus + Fecha -->
            <div class="col-12 col-md-3">
              <label class="form-label">N° SOLPE</label>
              <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Usuario</label>
              <input class="form-control" v-model="edit.usuario">
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="edit.estatus">
                <option>Solicitado</option>
                <option>Cotizando</option>
                <option>Revisión</option>
                <option>Completado</option>
                <option>Rechazado</option>
                <option>Pendiente</option>
              </select>
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Fecha (YYYY-MM-DD)</label>
              <input class="form-control" v-model="edit.fecha" placeholder="2025-09-08">
            </div>

            <!-- Empresa -->
            <div class="col-12 col-md-4">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="edit.empresa">
                <option>Xtreme Hormigones</option>
                <option>Xtreme Servicio</option>
                <option>Xtreme Mining</option>
              </select>
            </div>

            <!-- Centro de costo -->
            <div class="col-12 col-md-8">
              <label class="form-label">Centro de Costo</label>
              <select class="form-select" v-model="selectedCentroEdit" @change="setCentroFromKey(edit, selectedCentroEdit)">
                <option value="">— Selecciona centro —</option>
                <option v-for="opt in centrosOpts" :key="opt.key" :value="opt.key">
                  {{ opt.key }} — {{ opt.name }}
                </option>
              </select>
            </div>

            <!-- Tipo y nombre SOLPED -->
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>
            <div class="col-12 col-md-8">
              <label class="form-label">Nombre SOLPED</label>
              <input class="form-control" v-model="edit.nombre_solped">
            </div>

            <!-- Dirigido A -->
            <div class="col-12">
              <label class="form-label mb-1">Dirigido A</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.dirigidoA">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

            <!-- Autorización (archivo) -->
            <div class="col-12">
              <label class="form-label">Documento adjunto de autorización</label>
              <div class="d-flex gap-2">
                <input
                  ref="inputAutorizacionEditEl"
                  id="inputAutorizacionEdit"
                  type="file"
                  class="d-none"
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  @change="onArchivoAutorizacionEdit"
                >
                <button class="btn btn-outline-secondary" @click="abrirSelectorAutorizacionEdit">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivo
                </button>
                <div class="small text-secondary" v-if="edit.autorizacion_nombre">
                  Actual: <strong>{{ edit.autorizacion_nombre }}</strong>
                </div>
              </div>
              <div v-if="edit.autorizacion_url" class="mt-2">
                <a :href="edit.autorizacion_url" target="_blank" class="small">Ver documento</a>
              </div>
            </div>

            <!-- Items -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItem()">
                  <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                </button>
              </div>

              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width:60px;">Ítem</th>
                      <th>Descripción</th>
                      <th style="width:100px;">Cant.</th>
                      <th style="width:110px;">Cotizada</th>
                      <th style="width:160px;">Código ref.</th>
                      <th style="width:140px;">Estado</th>
                      <th style="width:140px;">Img</th>
                      <th style="width:160px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!edit.items?.length">
                      <td colspan="8" class="text-center text-secondary">Sin ítems.</td>
                    </tr>
                    <tr v-for="(it, idx) in edit.items" :key="idx">
                      <td class="fw-semibold">{{ it.item }}</td>
                      <td class="small">
                        <div class="fw-semibold">{{ it.descripcion }}</div>
                        <div class="text-secondary">{{ it.numero_interno || '—' }}</div>
                      </td>
                      <td>{{ it.cantidad ?? 0 }}</td>
                      <td>{{ it.cantidad_cotizada ?? 0 }}</td>
                      <td>{{ it.codigo_referencial || '—' }}</td>
                      <td>{{ it.estado || '—' }}</td>
                      <td>
                        <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank" class="small">ver</a>
                        <span v-else class="text-secondary small">—</span>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="abrirModalItem(it, idx)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="eliminarItem(idx)">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Historial Estados -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Historial de Estados</div>
                <button class="btn btn-sm btn-outline-primary" @click="agregarHistorial()">
                  <i class="bi bi-plus-lg me-1"></i> Agregar
                </button>
              </div>
              <div class="list-group">
                <div class="list-group-item" v-for="(h, ix) in edit.historialEstados" :key="'h'+ix">
                  <div class="row g-2 align-items-center">
                    <div class="col-md-3">
                      <input class="form-control form-control-sm" v-model="h.fecha" placeholder="YYYY-MM-DD">
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
                <div v-if="!edit.historialEstados?.length" class="list-group-item text-secondary small">
                  Sin historial.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal NUEVA SOLPED -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva SOLPED</h5>
        </div>
        <div class="vmodal-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">N° SOLPE</label>
              <input class="form-control" v-model.number="nuevo.numero_solpe" type="number" min="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha</label>
              <input class="form-control" v-model="nuevo.fecha" placeholder="YYYY-MM-DD">
            </div>
            <div class="col-md-3">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="nuevo.empresa">
                <option>Xtreme Servicio</option>
                <option>Xtreme Servicios</option>
                <option>Xtreme Mining</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option>Solicitado</option>
                <option>Cotizando</option>
                <option>Revisión</option>
                <option>Completado</option>
                <option>Rechazado</option>
                <option>Pendiente</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label">Centro de Costo</label>
              <select class="form-select" v-model="selectedCentroNuevo">
                <option value="">— Selecciona centro —</option>
                <option v-for="opt in centrosOpts" :key="opt.key" :value="opt.key">
                  {{ opt.key }} — {{ opt.name }}
                </option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="nuevo.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>
            <div class="col-md-8">
              <label class="form-label">Nombre SOLPED</label>
              <input class="form-control" v-model="nuevo.nombre_solped">
            </div>

            <div class="col-12">
              <label class="form-label mb-1">Dirigido A</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="'n-'+p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.dirigidoA">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label">Autorización (PDF / imagen / Excel)</label>
              <div class="d-flex gap-2">
                <input
                  ref="inputAutorizacionNuevoEl"
                  id="inputAutorizacionNuevo"
                  type="file"
                  class="d-none"
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  @change="onArchivoAutorizacionNuevo"
                >
                <button class="btn btn-secondary" @click="abrirSelectorAutorizacionNuevo">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivo
                </button>
                <div class="small text-secondary" v-if="nuevo.autorizacion_nombre">
                  Seleccionado: <strong>{{ nuevo.autorizacion_nombre }}</strong>
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

    <!-- Modal Ítem (crear/editar) -->
    <div v-if="modalItem" class="vmodal-backdrop" @click.self="cerrarModalItem">
      <div class="vmodal" style="max-width: 720px;">
        <div class="vmodal-header">
          <h5 class="mb-0">{{ isEditItem ? 'Editar ítem' : 'Nuevo ítem' }}</h5>
          <button class="btn-close" @click="cerrarModalItem"></button>
        </div>
        <div class="vmodal-body">
          <div class="row g-3">
            <div class="col-md-2">
              <label class="form-label">Ítem</label>
              <input class="form-control" v-model.number="itemForm.item" type="number" min="1" :readonly="true">
              <div class="form-text">Autonumérico.</div>
            </div>
            <div class="col-md-10">
              <label class="form-label">Descripción</label>
              <input class="form-control" v-model="itemForm.descripcion">
            </div>

            <div class="col-md-3">
              <label class="form-label">Cantidad</label>
              <input class="form-control" v-model.number="itemForm.cantidad" type="number" min="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">Cotizada</label>
              <input class="form-control" v-model.number="itemForm.cantidad_cotizada" type="number" min="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">Código ref.</label>
              <input class="form-control" v-model="itemForm.codigo_referencial">
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" v-model="itemForm.estado">
                <option>Pendiente</option>
                <option>Parcial</option>
                <option>Completado</option>
                <option>Revisión</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">N° interno</label>
              <input class="form-control" v-model="itemForm.numero_interno" placeholder="opcional">
            </div>
            <div class="col-md-6">
              <label class="form-label">Subir imagen (opcional)</label>
              <input
                ref="inputImagenItemEl"
                id="inputImagenItem"
                type="file"
                class="form-control"
                accept="image/*"
                @change="onImagenItem"
              >
              <div class="form-text">Se guarda en Storage.</div>
              <div v-if="itemForm.imagen_url" class="small mt-1">
                <a :href="itemForm.imagen_url" target="_blank">Ver imagen</a>
              </div>
            </div>
          </div>
        </div>
        <div class="vmodal-footer">
          <button class="btn btn-outline-secondary" @click="cerrarModalItem">Cancelar</button>
          <button class="btn btn-primary" @click="guardarItemForm">
            Guardar ítem
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
            ¿Estás seguro que quieres eliminar la SOLPED
            <strong>#{{ confirmRow?.numero_solpe ?? '—' }}</strong>?
          </p>

          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Empresa:</span> <strong>{{ confirmRow?.empresa || '—' }}</strong></li>
            <li><span class="text-secondary">Centro de costo:</span> <strong>{{ confirmRow?.numero_contrato || '—' }}</strong> — {{ confirmRow?.nombre_centro_costo || '—' }}</li>
            <li><span class="text-secondary">Fecha:</span> <strong>{{ confirmRow?.fecha || '—' }}</strong></li>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { db } from "../stores/firebase";
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot,
  doc, addDoc, updateDoc, deleteDoc
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "vue-router";

/* ---------- Constantes ---------- */
const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado","Cotizando","Revisión","Completado","Rechazado","Pendiente","Parcial","OC enviada a proveedor"
];
const DIRIGIDO_OPCIONES = [
  "Luis Orellana","Guillermo Manzor","María José Ballesteros","Ricardo Santibañez","Felipe Gonzalez"
];

/* Centros de Costo */
const centrosCosto = { /* ... tus claves/nombres aquí ... */ };
const centrosOpts = Object.entries(centrosCosto).map(([k,v]) => ({key:k, name:v}));
const router = useRouter();

/* ---------- Estado listado & paginación ---------- */
const rows = ref([]);
const cargando = ref(true);
const currentPage = ref(1);
const hasNextPage = ref(false);
const pageCursors = ref([]);
let unsubList = null;

/* Búsqueda por numero_solpe */
const buscarNumero = ref("");
const busquedaActiva = ref(false);
let unsubSearch = null;

/* ---------- Filtros ---------- */
const filtroFecha = ref("");
const filtroUsuario = ref("");           // usuario seleccionado
const filtroEstatus = ref([]);           // multi
const filtroEstatusHeader = ref("");     // select rápido (uno)
let unsubFilter = null;

/* Lista de usuarios para el select */
const usuariosOpts = ref([]);            // se llena desde la colección
let unsubUsuarios = null;

const hasActiveFilters = computed(() =>
  !!filtroFecha.value || !!filtroUsuario.value || (filtroEstatus.value?.length || 0) > 0
);

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
  if (s.includes("complet")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("cotiz")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("escala")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};

/* ---------- Paginación (tiempo real) ---------- */
const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons/2));
  for (let i=0; i<maxButtons; i++) pages.push(start+i);
  return pages;
});

function cleanupSubs(){
  if (unsubList) { unsubList(); unsubList=null; }
  if (unsubSearch) { unsubSearch(); unsubSearch=null; }
  if (unsubFilter) { unsubFilter(); unsubFilter=null; }
  if (unsubUsuarios) { unsubUsuarios(); unsubUsuarios=null; }
}

/* Cargar usuarios únicos para el select (hasta 500 registros ordenados por usuario) */
function cargarUsuarios(){
  try{
    const qy = query(
      collection(db, "solpes"),
      orderBy("usuario"),
      limit(500)
    );
    unsubUsuarios = onSnapshot(qy, (snap) => {
      const set = new Set();
      snap.forEach(d => {
        const u = (d.data()?.usuario || "").toString().trim();
        if (u) set.add(u);
      });
      usuariosOpts.value = Array.from(set);
    });
  }catch(e){
    console.error(e);
    addToast("warning","No se pudieron cargar los usuarios para el filtro.");
  }
}

function subscribePage(page){
  cleanupSubs();
  cargarUsuarios(); // aseguramos opciones frescas
  cargando.value = true;
  busquedaActiva.value = false;

  let qy;
  if (page === 1) {
    qy = query(collection(db, "solpes"), orderBy("numero_solpe", "desc"), limit(PAGE_SIZE + 1));
  } else {
    const prevCursor = pageCursors.value[page-2];
    if (!prevCursor) { cargando.value = false; return; }
    qy = query(
      collection(db, "solpes"),
      orderBy("numero_solpe", "desc"),
      startAfter(prevCursor),
      limit(PAGE_SIZE + 1)
    );
  }

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
    addToast("danger", "Error listando SOLPES.");
    cargando.value = false;
  });
}

function goToPage(n){
  if (hasActiveFilters.value || busquedaActiva.value) return;
  if (n < 1) return;
  if (n > currentPage.value + 1 && !hasNextPage.value) return;
  currentPage.value = n;
  subscribePage(n);
}

/* ---------- Búsqueda por numero_solpe ---------- */
function onBuscarNumero(){
  const qstr = (buscarNumero.value ?? "").trim();
  if (!qstr) { limpiarBusqueda(); return; }
  const n = parseInt(qstr, 10);
  if (isNaN(n)) { addToast("warning", "Ingresa un número válido."); return; }

  cleanupSubs();
  cargarUsuarios();
  cargando.value = true;
  busquedaActiva.value = true;

  const qy = query(
    collection(db, "solpes"),
    where("numero_solpe", "==", n),
    orderBy("numero_solpe", "desc"),
    limit(5)
  );

  unsubSearch = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ __id: d.id, ...d.data() }));
    rows.value = arr;
    cargando.value = false;
    hasNextPage.value = false;
  }, (err) => {
    console.error("onSnapshot search:", err);
    addToast("danger", "Error al buscar.");
    cargando.value = false;
  });
}

function limpiarBusqueda(){
  buscarNumero.value = "";
  busquedaActiva.value = false;
  currentPage.value = 1;
  subscribePage(1);
}

/* ---------- FILTROS ---------- */
function onChangeEstatusHeader(){
  filtroEstatus.value = filtroEstatusHeader.value ? [filtroEstatusHeader.value] : [];
  aplicarFiltros();
}
function removeEstatus(es){
  filtroEstatus.value = filtroEstatus.value.filter(x => x !== es);
  if (filtroEstatusHeader.value === es) filtroEstatusHeader.value = "";
  aplicarFiltros();
}

function buildFilterQuery(){
  const wh = [];

  if (filtroFecha.value) {
    wh.push(where("fecha","==", filtroFecha.value));
  }

  if (filtroUsuario.value) {
    wh.push(where("usuario","==", filtroUsuario.value));
  }

  if (filtroEstatus.value.length === 1) {
    wh.push(where("estatus","==", filtroEstatus.value[0]));
  } else if (filtroEstatus.value.length >= 2 && filtroEstatus.value.length <= 10) {
    wh.push(where("estatus","in", filtroEstatus.value));
  }

  return query(
    collection(db, "solpes"),
    ...wh,
    orderBy("numero_solpe","desc"),
    limit(80)
  );
}

function aplicarFiltros(){
  if (!hasActiveFilters.value){
    currentPage.value = 1;
    subscribePage(1);
    return;
  }

  cleanupSubs();
  cargarUsuarios();
  cargando.value = true;
  busquedaActiva.value = false;

  const qy = buildFilterQuery();

  unsubFilter = onSnapshot(qy, (snap) => {
    let arr = [];
    snap.forEach(d => arr.push({ __id: d.id, ...d.data() }));

    // salvaguarda por si hay +10 estados marcados (Firestore no soporta in > 10)
    if (filtroEstatus.value.length > 10) {
      const set = new Set(filtroEstatus.value);
      arr = arr.filter(r => set.has(r.estatus));
    }

    rows.value = arr;
    cargando.value = false;
    hasNextPage.value = false;
  }, (err) => {
    console.error("onSnapshot filter:", err);
    addToast("danger", "Error aplicando filtros.");
    cargando.value = false;
  });
}

function limpiarFiltros(){
  filtroFecha.value = "";
  filtroUsuario.value = "";
  filtroEstatus.value = [];
  filtroEstatusHeader.value = "";
  aplicarFiltros();
}

/* ---------- Refs para inputs de archivos ---------- */
const inputAutorizacionEditEl = ref(null);
const inputAutorizacionNuevoEl = ref(null);
const inputImagenItemEl = ref(null);

function abrirSelectorAutorizacionEdit(){
  inputAutorizacionEditEl.value?.click();
}
function abrirSelectorAutorizacionNuevo(){
  inputAutorizacionNuevoEl.value?.click();
}

/* ---------- Editor (offcanvas) y resto de lógica ---------- */
const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);
const selectedCentroEdit = ref("");

function setCentroFromKey(targetObj, key){
  if (!key || !centrosCosto[key]) {
    targetObj.numero_contrato = "";
    targetObj.nombre_centro_costo = "";
    return;
  }
  targetObj.numero_contrato = key;
  targetObj.nombre_centro_costo = centrosCosto[key];
}

function abrirEditor(row){
  seleccion.value = row;
  edit.value = deepClone({
    autorizacion_nombre: row.autorizacion_nombre ?? null,
    autorizacion_url: row.autorizacion_url ?? null,
    dirigidoA: Array.isArray(row.dirigidoA) ? [...row.dirigidoA] : [],
    empresa: row.empresa ?? "Xtreme Servicio",
    estatus: row.estatus ?? "Pendiente",
    fecha: row.fecha ?? "",
    items: Array.isArray(row.items) ? deepClone(row.items) : [],
    nombre_centro_costo: row.nombre_centro_costo ?? "",
    nombre_solped: row.nombre_solped ?? "",
    numero_contrato: row.numero_contrato ?? "",
    numero_solpe: row.numero_solpe ?? null,
    tipo_solped: row.tipo_solped ?? "",
    usuario: row.usuario ?? "",
    historialEstados: Array.isArray(row.historialEstados) ? deepClone(row.historialEstados) : []
  });

  const foundKey = edit.value.numero_contrato && centrosCosto[edit.value.numero_contrato]
    ? edit.value.numero_contrato
    : Object.keys(centrosCosto).find(k => centrosCosto[k] === edit.value.nombre_centro_costo) || "";
  selectedCentroEdit.value = foundKey;

  editorAbierto.value = true;
  resetUploadUI();
}

const irADetalle = (row) => {
  const id = row?.__id;
  if (!id) { addToast("warning", "No se encontró el ID del documento."); return; }
  router.push({ name: "SolpedDetalle", params: { id } });
};

function cerrarEditor(){
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  resetUploadUI();
}

/* ---------- Autorización (archivo) ---------- */
const archivoAutorizacionEdit = ref(null);
const archivoAutorizacionNuevo = ref(null);

function resetUploadUI(){
  archivoAutorizacionEdit.value = null;
  archivoAutorizacionNuevo.value = null;
  if (inputAutorizacionEditEl.value) inputAutorizacionEditEl.value.value = "";
  if (inputAutorizacionNuevoEl.value) inputAutorizacionNuevoEl.value.value = "";
  if (inputImagenItemEl.value) inputImagenItemEl.value.value = "";
}
function onArchivoAutorizacionEdit(e){
  const f = (e.target.files || [])[0];
  if (!f) return;
  archivoAutorizacionEdit.value = f;
  edit.value.autorizacion_nombre = f.name;
}
function onArchivoAutorizacionNuevo(e){
  const f = (e.target.files || [])[0];
  if (!f) return;
  archivoAutorizacionNuevo.value = f;
  nuevo.value.autorizacion_nombre = f.name;
}

/* ---------- Guardar Edición ---------- */
async function guardarEdicion(){
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const id = seleccion.value.__id;
    const dref = doc(db, "solpes", id);

    if (archivoAutorizacionEdit.value) {
      const storage = getStorage();
      const path = `solpes/${id}/autorizacion/${Date.now()}_${archivoAutorizacionEdit.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoAutorizacionEdit.value);
      const url = await getDownloadURL(up.ref);
      edit.value.autorizacion_url = url;
    }

    if (typeof edit.value.numero_solpe === "string") {
      const n = parseInt(edit.value.numero_solpe, 10);
      edit.value.numero_solpe = isNaN(n) ? null : n;
    }
    edit.value.items = (edit.value.items || []).map(it => ({
      ...it,
      item: Number(it.item ?? 0),
      cantidad: Number(it.cantidad ?? 0),
      cantidad_cotizada: Number(it.cantidad_cotizada ?? 0)
    }));

    await updateDoc(dref, deepClone(edit.value));
    addToast("success", "SOLPED actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

/* ---------- Confirmación de borrado ---------- */
const confirmOpen = ref(false);
const confirmRow  = ref(null);
const eliminando  = ref(false);

function abrirConfirm(row){ confirmRow.value = row; confirmOpen.value = true; }
function cerrarConfirm(){ if (!eliminando.value){ confirmOpen.value = false; confirmRow.value = null; } }
async function confirmarEliminar(){
  if (!confirmRow.value?.__id) return;
  try {
    eliminando.value = true;
    await deleteDoc(doc(db, "solpes", confirmRow.value.__id));
    addToast("success", "SOLPED eliminada.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar.");
  } finally {
    eliminando.value = false;
  }
}

/* ---------- Ítems (modal) ---------- */
const modalItem = ref(false);
const isEditItem = ref(false);
const itemIndex = ref(-1);
const itemForm = ref({
  item: 1, descripcion: "", cantidad: 0, cantidad_cotizada: 0,
  codigo_referencial: "", estado: "Pendiente", numero_interno: "", imagen_url: null
});
const imagenItemFile = ref(null);

function abrirModalItem(it=null, idx=-1){
  if (!it) {
    const arr = Array.isArray(edit.value.items) ? edit.value.items : [];
    const maxIt = arr.reduce((m, a) => Math.max(m, Number(a?.item ?? 0)), 0);
    itemForm.value = {
      ...itemForm.value,
      item: maxIt + 1, descripcion:"", cantidad:0, cantidad_cotizada:0,
      codigo_referencial:"", estado:"Pendiente", numero_interno:"", imagen_url:null
    };
    isEditItem.value = false; itemIndex.value = -1;
  } else {
    itemForm.value = deepClone(it);
    isEditItem.value = true; itemIndex.value = idx;
  }
  imagenItemFile.value = null;
  if (inputImagenItemEl.value) inputImagenItemEl.value.value = "";
  modalItem.value = true;
}
function cerrarModalItem(){ modalItem.value = false; }
function onImagenItem(e){ const f = (e.target.files || [])[0]; imagenItemFile.value = f || null; }

async function guardarItemForm(){
  try {
    if (imagenItemFile.value && seleccion.value) {
      const storage = getStorage();
      const id = seleccion.value.__id;
      const path = `solpes/${id}/items/${Date.now()}_${imagenItemFile.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, imagenItemFile.value);
      const url = await getDownloadURL(up.ref);
      itemForm.value.imagen_url = url;
    }
    const normalized = {
      ...itemForm.value,
      item: Number(itemForm.value.item ?? 0),
      cantidad: Number(itemForm.value.cantidad ?? 0),
      cantidad_cotizada: Number(itemForm.value.cantidad ?? 0) < 0 ? 0 : Number(itemForm.value.cantidad_cotizada ?? 0)
    };
    if (!Array.isArray(edit.value.items)) edit.value.items = [];
    if (isEditItem.value && itemIndex.value >= 0) edit.value.items.splice(itemIndex.value, 1, normalized);
    else edit.value.items.push(normalized);
    modalItem.value = false;
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar el ítem.");
  }
}
function eliminarItem(idx){ edit.value.items.splice(idx, 1); }

/* ---------- Nueva SOLPED ---------- */
const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});
const selectedCentroNuevo = ref("");

function defaultNueva(){
  return {
    autorizacion_nombre: null, autorizacion_url: null, dirigidoA: [],
    empresa: "Xtreme Servicio", estatus: "Pendiente",
    fecha: new Date().toISOString().slice(0,10),
    items: [], nombre_centro_costo: "", nombre_solped: "",
    numero_contrato: "", numero_solpe: null, tipo_solped: "", usuario: "",
    historialEstados: []
  };
}
function abrirModalNueva(){ nuevo.value = defaultNueva(); selectedCentroNuevo.value = ""; resetUploadUI(); modalNueva.value = true; }
function cerrarModalNueva(){ modalNueva.value = false; }

async function crearNueva(){
  try {
    creando.value = true;
    setCentroFromKey(nuevo.value, selectedCentroNuevo.value);
    if (typeof nuevo.value.numero_solpe === "string") {
      const n = parseInt(nuevo.value.numero_solpe, 10);
      nuevo.value.numero_solpe = isNaN(n) ? null : n;
    }
    const payload = deepClone(nuevo.value);
    const docRef = await addDoc(collection(db, "solpes"), payload);

    if (archivoAutorizacionNuevo.value) {
      const storage = getStorage();
      const path = `solpes/${docRef.id}/autorizacion/${Date.now()}_${archivoAutorizacionNuevo.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoAutorizacionNuevo.value);
      const url = await getDownloadURL(up.ref);
      await updateDoc(doc(db, "solpes", docRef.id), {
        autorizacion_nombre: archivoAutorizacionNuevo.value.name,
        autorizacion_url: url
      });
    }

    addToast("success", "SOLPED creada.");
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la SOLPED.");
  } finally {
    creando.value = false;
  }
}

/* ---------- Historial helpers (faltaban en tu snippet visible) ---------- */
function agregarHistorial(){
  if (!Array.isArray(edit.value.historialEstados)) edit.value.historialEstados = [];
  edit.value.historialEstados.push({ fecha: "", estatus: "", usuario: "" });
}
function eliminarHistorial(ix){
  if (!Array.isArray(edit.value.historialEstados)) return;
  edit.value.historialEstados.splice(ix,1);
}

/* ---------- Lifecycle ---------- */
onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => { cleanupSubs(); });
</script>

<style scoped>
.admin-solpes-page{ min-height:100vh; }

/* Toolbar: alturas alineadas */
.toolbar .toolbar-item .form-control,
.toolbar .toolbar-item .form-select,
.toolbar .toolbar-item .btn,
.toolbar .toolbar-item .input-group-text { height: 38px; }
.toolbar .input-group-text{ min-width: 64px; justify-content: center; }
@media (max-width: 992px){ .toolbar .toolbar-item{ flex: 1 1 auto; } }

/* Offcanvas */
.offcanvas-backdrop{ position: fixed; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: end; z-index: 1080; }
.offcanvas-panel{
  width: min(820px, 100%);
  background: var(--bs-body-bg); color: var(--bs-body-color);
  height: 100vh; box-shadow: -12px 0 32px rgba(0,0,0,.25);
  animation: slideIn .22s ease-out; display: flex; flex-direction: column;
}
.offcanvas-header, .offcanvas-footer{ padding: .9rem 1rem; border-bottom: 1px solid #eee; }
.offcanvas-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.offcanvas-body{ padding: 1rem; overflow: auto; flex: 1 1 auto; min-height: 0; }
@keyframes slideIn{ from{ transform: translateX(20px); opacity:.0; } to{ transform: translateX(0); opacity:1; } }

/* Modal */
.vmodal-backdrop{ position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1080; display: grid; place-items: center; padding: 1rem; }
.vmodal{
  width: 100%; max-width: 640px; border-radius: .75rem; box-shadow: 0 20px 50px rgba(0,0,0,.25);
  overflow: hidden; background: var(--bs-body-bg); color: var(--bs-body-color); border: 1px solid rgba(0,0,0,.05);
}
.vmodal-header, .vmodal-footer{ padding: .9rem 1rem; border-bottom: 1px solid #eee; }
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }

/* Toasts */
.toast-stack{ position: fixed; right: 16px; bottom: 16px; z-index: 1200; display: flex; flex-direction: column; gap: 10px; }
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* Modal confirm */
.confirm-icon{
  width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626); color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}

/* Botón peligro más “soft” al pasar */
.btn-danger:hover{ filter: brightness(0.95); }
</style>
