<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-solpes-page">
    <div class="container py-4">
     <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Admin · SOLPED Taller</h1>

        <!-- Toolbar en una línea -->
        <div class="toolbar d-flex align-items-stretch gap-2 flex-wrap">

          <!-- Buscar numero_solpe -->
          <div class="input-group toolbar-item" style="width: 240px;">
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

          <!-- Solicitante -->
          <div class="input-group toolbar-item" style="width: 320px;">
            <span class="input-group-text">Solicitante</span>
            <input
              class="form-control"
              v-model.trim="filtroSolicitante"
              placeholder="Ej: FRANK PINTO"
              @keyup.enter="aplicarFiltros"
            >
            <button
              v-if="filtroSolicitante"
              class="btn btn-outline-secondary"
              @click="filtroSolicitante=''; aplicarFiltros()"
              title="Limpiar solicitante">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Acciones filtros -->
          <button class="btn btn-success toolbar-item" @click="aplicarFiltros" title="Aplicar filtros">
            <i class="bi bi-funnel me-1"></i> Aplicar
          </button>

          <!-- Nueva -->
          <button class="btn btn-primary toolbar-item" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED (Taller)
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
        <span v-if="filtroSolicitante" class="badge bg-light text-dark border">
          Solicitante: {{ filtroSolicitante }} <span class="text-secondary">({{ filtroSolicExacto ? 'exacto' : 'contiene' }})</span>
          <button class="btn-close btn-close-white ms-2 small" @click="filtroSolicitante=''; aplicarFiltros()"></button>
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
                <th style="width:220px;">Acciones</th>
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
                <td class="fw-semibold">#{{ r.numero_solpe ?? '—' }}</td>
                <td>
                  <div class="fw-semibold">{{ r.centro_costo || '—' }}</div>
                  <div class="small text-secondary">
                    Solicitante: {{ r.nombre_solicitante || '—' }}
                  </div>
                </td>
                <td>{{ r.empresa || '—' }}</td>
                <td>
                  <span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
                </td>
                <td>{{ r.fecha || '—' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="abrirEditor(r)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="abrirConfirm(r)">
                      <i class="bi bi-trash3"></i>
                    </button>
                    <button class="btn btn-outline-secondary" @click="irADetalle(r)" title="Ver detalle">
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
            <div class="fw-semibold">Editar SOLPED Taller</div>
          </div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <!-- Encabezado -->
            <div class="col-6 col-md-3">
              <label class="form-label">N° SOLPE</label>
              <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Fecha</label>
              <input class="form-control" v-model="edit.fecha" placeholder="YYYY-MM-DD">
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="edit.empresa">
                <option>Xtreme Servicio</option>
                <option>Xtreme Servicios</option>
                <option>Xtreme Mining</option>
              </select>
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

            <!-- Centro de costo -->
            <div class="col-12">
              <label class="form-label">Centro de Costo</label>
              <div class="input-group">
                <select class="form-select" v-model="selectedCentroEdit" @change="applyCentroCosto(edit, selectedCentroEdit)">
                  <option value="">— Selecciona centro —</option>
                  <option v-for="opt in centrosOpts" :key="opt.key" :value="opt.key">
                    {{ opt.key }} — {{ opt.name }}
                  </option>
                </select>
                <input class="form-control" v-model="edit.centro_costo" placeholder="o escribe uno personalizado">
              </div>
            </div>

            <!-- Solicitante / sesión -->
            <div class="col-12 col-md-6">
              <label class="form-label">Nombre solicitante</label>
              <input class="form-control" v-model="edit.nombre_solicitante" placeholder="Ej: FRANK PINTO">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Usuario sesión</label>
              <input class="form-control" v-model="edit.usuario_sesion" placeholder="Ej: TALLER CM">
            </div>

            <!-- Cotizadores (checkboxes) -->
            <div class="col-12">
              <label class="form-label mb-1">Cotizadores</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.cotizadores">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

            <!-- Items -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItem('edit')">
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
                    <tr v-for="(it, idx) in edit.items" :key="`e-${idx}`">
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
                          <button class="btn btn-outline-secondary" @click="abrirModalItem('edit', it, idx)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="eliminarItem('edit', idx)">
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
            <button class="btn btn-outline-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal NUEVA SOLPED (Taller) -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva SOLPED (Taller)</h5>
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

            <!-- Centro de costo -->
            <div class="col-12">
              <label class="form-label">Centro de Costo</label>
              <div class="input-group">
                <select class="form-select" v-model="selectedCentroNuevo" @change="applyCentroCosto(nuevo, selectedCentroNuevo)">
                  <option value="">— Selecciona centro —</option>
                  <option v-for="opt in centrosOpts" :key="opt.key" :value="opt.key">
                    {{ opt.key }} — {{ opt.name }}
                  </option>
                </select>
                <input class="form-control" v-model="nuevo.centro_costo" placeholder="o escribe uno personalizado">
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label">Nombre solicitante</label>
              <input class="form-control" v-model="nuevo.nombre_solicitante" placeholder="FRANK PINTO">
            </div>
            <div class="col-md-6">
              <label class="form-label">Usuario sesión</label>
              <input class="form-control" v-model="nuevo.usuario_sesion" placeholder="TALLER CM">
            </div>

            <!-- Cotizadores -->
            <div class="col-12">
              <label class="form-label mb-1">Cotizadores</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="'n-'+p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.cotizadores">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

            <!-- Ítems en creación -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems (nuevo)</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItem('nuevo')">
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
                    <tr v-if="!nuevo.items?.length">
                      <td colspan="8" class="text-center text-secondary">Sin ítems.</td>
                    </tr>
                    <tr v-for="(it, idx) in nuevo.items" :key="`n-${idx}`">
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
                          <button class="btn btn-outline-secondary" @click="abrirModalItem('nuevo', it, idx)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click="eliminarItem('nuevo', idx)">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                <option>pendiente</option>
                <option>parcial</option>
                <option>completado</option>
                <option>revisión</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">N° interno</label>
              <input class="form-control" v-model="itemForm.numero_interno" placeholder="opcional">
            </div>
            <div class="col-md-6">
              <label class="form-label">Subir imagen (opcional)</label>
              <input id="inputImagenItem" type="file" class="form-control"
                accept="image/*" @change="onImagenItem">
              <div class="form-text">Se guarda en Storage.</div>
              <div v-if="itemForm.imagen_url" class="small mt-1">
                <a :href="itemForm.imagen_url" target="_blank">Ver imagen</a>
              </div>
            </div>
          </div>
        </div>
        <div class="vmodal-footer">
          <button class="btn btn-secondary" @click="cerrarModalItem">Cancelar</button>
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
            ¿Estás seguro que quieres eliminar la SOLPED Taller
            <strong>#{{ confirmRow?.numero_solpe ?? '—' }}</strong>?
          </p>

          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Empresa:</span> <strong>{{ confirmRow?.empresa || '—' }}</strong></li>
            <li><span class="text-secondary">Centro de costo:</span> <strong>{{ confirmRow?.centro_costo || '—' }}</strong></li>
            <li><span class="text-secondary">Solicitante:</span> <strong>{{ confirmRow?.nombre_solicitante || '—' }}</strong></li>
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
  doc, addDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "vue-router";

/* ---------- Constantes ---------- */
const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado","Cotizando","Revisión","Completado","Rechazado","Pendiente","Parcial","OC enviada a proveedor"
];
const COTIZADORES_OPCIONES = [
  "Luis Orellana",
  "Guillermo Manzor",
  "María José Ballesteros",
  "Ricardo Santibañez",
  "Felipe Gonzalez"
];

/* Centros de costo  */
const centrosCosto = {
  '27483': 'CONTRATO 27483 SUM. HORMIGON CHUCHICAMATA',
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
const filtroSolicitante = ref("");
const filtroSolicExacto = ref(false);
const filtroEstatus = ref([]);           // multi
const filtroEstatusHeader = ref("");     // select rápido (uno)
const filtrosActivos = ref(false);
let unsubFilter = null;

const hasActiveFilters = computed(() =>
  !!filtroFecha.value || !!filtroSolicitante.value || (filtroEstatus.value?.length || 0) > 0
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
const normalize = (v) => (v||"").toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();

/* ---------- Paginación (tiempo real) ---------- */
const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons/2));
  for (let i=0; i<maxButtons; i++) pages.push(start+i);
  return pages;
});

function cleanupSubs(){
  if (unsubList){ unsubList(); unsubList=null; }
  if (unsubSearch){ unsubSearch(); unsubSearch=null; }
  if (unsubFilter){ unsubFilter(); unsubFilter=null; }
}

function subscribePage(page){
  cleanupSubs();
  cargando.value = true;
  busquedaActiva.value = false;
  filtrosActivos.value = false;

  let qy;
  if (page === 1) {
    qy = query(
      collection(db, "solped_taller"),
      orderBy("numero_solpe", "desc"),
      limit(PAGE_SIZE + 1)
    );
  } else {
    const prevCursor = pageCursors.value[page-2];
    if (!prevCursor) { cargando.value = false; return; }
    qy = query(
      collection(db, "solped_taller"),
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
    addToast("danger", "Error listando SOLPED Taller.");
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
  cargando.value = true;
  busquedaActiva.value = true;

  const qy = query(
    collection(db, "solped_taller"),
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

/* ---------- FILTRO RÁPIDO (header) ---------- */
function onChangeEstatusHeader(){
  // sincroniza el select rápido con el filtro multi
  filtroEstatus.value = filtroEstatusHeader.value ? [filtroEstatusHeader.value] : [];
  aplicarFiltros();
}

/* ---------- FILTROS: aplicar / limpiar ---------- */
function buildFilterQuery(){
  const wh = [];

  if (filtroFecha.value) {
    wh.push(where("fecha","==", filtroFecha.value));
  }

  if (filtroEstatus.value.length === 1) {
    wh.push(where("estatus","==", filtroEstatus.value[0]));
  } else if (filtroEstatus.value.length >= 2 && filtroEstatus.value.length <= 10) {
    wh.push(where("estatus","in", filtroEstatus.value));
  }

  if (filtroSolicExacto.value && filtroSolicitante.value) {
    wh.push(where("nombre_solicitante","==", filtroSolicitante.value));
  }

  const base = query(
    collection(db, "solped_taller"),
    ...wh,
    orderBy("numero_solpe","desc"),
    limit(80)
  );
  return base;
}

function aplicarFiltros(){
  if (!hasActiveFilters.value){
    filtrosActivos.value = false;
    currentPage.value = 1;
    subscribePage(1);
    return;
  }

  cleanupSubs();
  cargando.value = true;
  filtrosActivos.value = true;
  busquedaActiva.value = false;

  const qy = buildFilterQuery();

  unsubFilter = onSnapshot(qy, (snap) => {
    let arr = [];
    snap.forEach(d => arr.push({ __id: d.id, ...d.data() }));

    if (!filtroSolicExacto.value && filtroSolicitante.value) {
      const q = normalize(filtroSolicitante.value);
      arr = arr.filter(r => normalize(r?.nombre_solicitante||'').includes(q));
    }
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
  filtroSolicitante.value = "";
  filtroSolicExacto.value = false;
  filtroEstatus.value = [];
  filtroEstatusHeader.value = ""; // limpia el quick-select también
  aplicarFiltros();
}

function removeEstatus(es){
  filtroEstatus.value = filtroEstatus.value.filter(x => x!==es);
  // si quitaste el único seleccionado desde chips, limpia el header
  if (filtroEstatus.value.length !== 1) filtroEstatusHeader.value = "";
  else filtroEstatusHeader.value = filtroEstatus.value[0];
  aplicarFiltros();
}

/* ---------- Navegar a detalle ---------- */
const irADetalle = (row) => {
  const id = row?.__id;
  if (!id) { addToast("warning", "No se encontró el ID del documento."); return; }
  router.push({ name: "SolpedTallerDetalle", params: { id } });
};

/* ---------- Editor (offcanvas) ---------- */
const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);
const selectedCentroEdit = ref("");

const applyCentroCosto = (target, key) => {
  if (!key || !(key in centrosCosto)) {
    if ('centro_costo' in target) target.centro_costo = '';
    if ('numero_contrato' in target) target.numero_contrato = '';
    if ('nombre_centro_costo' in target) target.nombre_centro_costo = '';
    return;
  }
  if ('centro_costo' in target) target.centro_costo = centrosCosto[key];
  if ('numero_contrato' in target) target.numero_contrato = key;
  if ('nombre_centro_costo' in target) target.nombre_centro_costo = centrosCosto[key];
};

function abrirEditor(row){
  seleccion.value = row;
  edit.value = deepClone({
    centro_costo: row.centro_costo ?? "",
    cotizadores: Array.isArray(row.cotizadores) ? [...row.cotizadores] : [],
    creado_en: row.creado_en ?? null,
    empresa: row.empresa ?? "Xtreme Servicios",
    estatus: row.estatus ?? "Solicitado",
    fecha: row.fecha ?? "",
    items: Array.isArray(row.items) ? deepClone(row.items) : [],
    lastSeenComentarios: row.lastSeenComentarios ?? {},
    nombre_solicitante: row.nombre_solicitante ?? "",
    numero_solpe: row.numero_solpe ?? null,
    tipo_solped: row.tipo_solped ?? "",
    usuario_sesion: row.usuario_sesion ?? "",
    historialEstados: Array.isArray(row.historialEstados) ? deepClone(row.historialEstados) : []
  });

  const foundKey = Object.keys(centrosCosto).find(k => centrosCosto[k] === edit.value.centro_costo) || "";
  selectedCentroEdit.value = foundKey;

  editorAbierto.value = true;
}

/* ---------- Guardar Edición ---------- */
async function guardarEdicion(){
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const id = seleccion.value.__id;
    const dref = doc(db, "solped_taller", id);

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
    addToast("success", "SOLPED Taller actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

function cerrarEditor(){
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  selectedCentroEdit.value = "";
}

/* ---------- Historial ---------- */
function agregarHistorial(){
  if (!Array.isArray(edit.value.historialEstados)) edit.value.historialEstados = [];
  edit.value.historialEstados.push({
    fecha: new Date().toISOString().slice(0,10),
    estatus: edit.value.estatus || "Actualizado",
    usuario: edit.value.nombre_solicitante || edit.value.usuario_sesion || ""
  });
}
function eliminarHistorial(ix){
  edit.value.historialEstados.splice(ix, 1);
}

/* ---------- Ítems (modal compartido: edición o creación) ---------- */
const modalItem = ref(false);
const isEditItem = ref(false);
const itemIndex = ref(-1);
const itemForm = ref({
  item: 1,
  descripcion: "",
  cantidad: 0,
  cantidad_cotizada: 0,
  codigo_referencial: "",
  estado: "pendiente",
  numero_interno: "",
  imagen_url: null
});
const imagenItemFile = ref(null);
/** 'edit' | 'nuevo' */
const itemTarget = ref('edit');

function abrirModalItem(target = 'edit', it=null, idx=-1){
  itemTarget.value = target;

  const arr = target === 'edit' ? (edit.value.items || []) : (nuevo.value.items || []);
  if (!it) {
    const maxIt = arr.reduce((m, a) => Math.max(m, Number(a?.item ?? 0)), 0);
    itemForm.value = {
      item: maxIt + 1,
      descripcion: "",
      cantidad: 0,
      cantidad_cotizada: 0,
      codigo_referencial: "",
      estado: "pendiente",
      numero_interno: "",
      imagen_url: null
    };
    isEditItem.value = false;
    itemIndex.value = -1;
  } else {
    itemForm.value = deepClone(it);
    isEditItem.value = true;
    itemIndex.value = idx;
  }
  imagenItemFile.value = null;
  const el = document.getElementById("inputImagenItem");
  if (el) el.value = "";
  modalItem.value = true;
}
function cerrarModalItem(){ modalItem.value = false; }

function onImagenItem(e){
  const f = (e.target.files || [])[0];
  imagenItemFile.value = f || null;
}

async function guardarItemForm(){
  try {
    if (imagenItemFile.value) {
      if (itemTarget.value === 'edit' && seleccion.value) {
        const storage = getStorage();
        const id = seleccion.value.__id;
        const path = `solped_taller/${id}/items/${Date.now()}_${imagenItemFile.value.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, imagenItemFile.value);
        const url = await getDownloadURL(up.ref);
        itemForm.value.imagen_url = url;
      } else {
        addToast("warning", "La imagen se subirá después de crear la SOLPED.");
      }
    }

    const normalized = {
      ...itemForm.value,
      item: Number(itemForm.value.item ?? 0),
      cantidad: Number(itemForm.value.cantidad ?? 0),
      cantidad_cotizada: Number(itemForm.value.cantidad_cotizada ?? 0)
    };

    const listRef = itemTarget.value === 'edit'
      ? (edit.value.items || (edit.value.items = []))
      : (nuevo.value.items || (nuevo.value.items = []));

    if (isEditItem.value && itemIndex.value >= 0) {
      listRef.splice(itemIndex.value, 1, normalized);
    } else {
      listRef.push(normalized);
    }
    modalItem.value = false;
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar el ítem.");
  }
}

function eliminarItem(target, idx){
  const listRef = target === 'edit' ? (edit.value.items || []) : (nuevo.value.items || []);
  listRef.splice(idx, 1);
}

/* ---------- Nueva SOLPED (Taller) ---------- */
const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});
const selectedCentroNuevo = ref("");

function defaultNueva(){
  return {
    centro_costo: "",
    cotizadores: [],
    creado_en: null,
    empresa: "Xtreme Servicios",
    estatus: "Solicitado",
    fecha: new Date().toISOString().slice(0,10),
    items: [],
    lastSeenComentarios: {},
    nombre_solicitante: "",
    numero_solpe: null,
    tipo_solped: "",
    usuario_sesion: "",
    historialEstados: []
  };
}
function abrirModalNueva(){
  nuevo.value = defaultNueva();
  selectedCentroNuevo.value = "";
  modalNueva.value = true;
}
function cerrarModalNueva(){ modalNueva.value = false; }

async function crearNueva(){
  try {
    creando.value = true;

    applyCentroCosto(nuevo.value, selectedCentroNuevo.value);

    if (typeof nuevo.value.numero_solpe === "string") {
      const n = parseInt(nuevo.value.numero_solpe, 10);
      nuevo.value.numero_solpe = isNaN(n) ? null : n;
    }

    nuevo.value.items = (nuevo.value.items || []).map(it => ({
      ...it,
      item: Number(it.item ?? 0),
      cantidad: Number(it.cantidad ?? 0),
      cantidad_cotizada: Number(it.cantidad_cotizada ?? 0)
    }));

    const payload = deepClone(nuevo.value);
    payload.creado_en = serverTimestamp();

    const docRef = await addDoc(collection(db, "solped_taller"), payload);

    addToast("success", `SOLPED Taller creada (ID: ${docRef.id}${payload.numero_solpe ? ` · #${payload.numero_solpe}` : ""}).`);
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la SOLPED Taller.");
  } finally {
    creando.value = false;
  }
}

/* ---------- Confirmación de eliminación ---------- */
const confirmOpen = ref(false);
const confirmRow  = ref(null);
const eliminando  = ref(false);

function abrirConfirm(row){
  confirmRow.value = row;
  confirmOpen.value = true;
}
function cerrarConfirm(){
  if (eliminando.value) return;
  confirmOpen.value = false;
  confirmRow.value = null;
}
async function confirmarEliminar(){
  if (!confirmRow.value?.__id) return;
  try {
    eliminando.value = true;
    await deleteDoc(doc(db, "solped_taller", confirmRow.value.__id));
    addToast("success", "SOLPED Taller eliminada.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar.");
  } finally {
    eliminando.value = false;
  }
}

/* ---------- Lifecycle ---------- */
onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => { cleanupSubs(); });
</script>

<style scoped>
.admin-solpes-page{
  min-height:100vh;
}

/* Offcanvas */
.offcanvas-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: grid; place-items: end; z-index: 1080;
}
.offcanvas-panel{
  width: min(860px, 100%);
  height: 100vh;
  box-shadow: -12px 0 32px rgba(0,0,0,.25);
  animation: slideIn .22s ease-out;
  display: flex; flex-direction: column;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
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
/* Toolbar: que todo quede de la misma altura y alineado */
.toolbar .toolbar-item .form-control,
.toolbar .toolbar-item .form-select,
.toolbar .toolbar-item .btn,
.toolbar .toolbar-item .input-group-text {
  height: 38px;
}

.toolbar .input-group-text {
  min-width: 64px;            /* etiquetas más legibles */
  justify-content: center;
}

@media (max-width: 992px){
  /* En pantallas chicas, que puedan envolver bonito */
  .toolbar .toolbar-item{
    flex: 1 1 auto;
  }
}

/* Modal */
.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1080; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 640px;  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid rgba(0,0,0,.05);
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

/* Icono/encabezado del modal de eliminación */
.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}

/* Botón peligro más “soft” al pasar */
.btn-danger:hover{
  filter: brightness(0.95);
}
</style>
