<!-- src/views/AdminOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-oc-page">
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
        <h1 class="h5 h4-md fw-semibold mb-0">Admin · Órdenes OC</h1>
        <div class="d-none d-md-flex align-items-stretch gap-2 flex-wrap w-100 w-lg-auto ms-md-3">
          <div class="input-group minw-280">
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
          <button class="btn btn-outline-primary" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span
              v-if="hasActiveFilters"
              class="badge bg-primary-subtle text-primary-emphasis ms-2"
              >{{ totalFiltrosActivos }}</span
            >
          </button>

          <button class="btn btn-primary" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva OC
          </button>
        </div>
        <div class="d-flex d-md-none w-100 gap-2">
          <button class="btn btn-outline-secondary flex-fill" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span
              v-if="hasActiveFilters"
              class="badge bg-primary-subtle text-primary-emphasis ms-1"
              >{{ totalFiltrosActivos }}</span
            >
          </button>
          <button class="btn btn-primary flex-fill" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva
          </button>
        </div>
      </div>
      <div v-if="hasActiveFilters || busquedaActiva" class="d-flex flex-wrap align-items-center gap-2 mb-2">
        <small class="text-secondary">Filtros activos:</small>

        <span v-if="filtroEstatus" class="badge bg-light text-dark border">
          Estatus: {{ filtroEstatus }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroEstatus=''; aplicarFiltros()"></button>
        </span>

        <span v-if="filtroResponsable" class="badge bg-light text-dark border">
          Responsable: {{ filtroResponsable }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroResponsable=''; aplicarFiltros()"></button>
        </span>

        <span v-if="busquedaActiva" class="badge bg-info-subtle text-info-emphasis">
          Búsqueda aplicada
          <button class="btn-close btn-close-white ms-2 small" @click="limpiarBusqueda()"></button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros" v-if="hasActiveFilters || busquedaActiva">
          Limpiar todo
        </button>
      </div>
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="busquedaActiva || hasActiveFilters" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>
          <div class="d-flex d-md-none gap-2">
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="ID doc o ID" v-model="buscarTexto" @keyup.enter="onBuscar">
              <button class="btn btn-outline-secondary" @click="onBuscar">Buscar</button>
            </div>
            <button
              v-if="busquedaActiva"
              class="btn btn-sm btn-outline-danger"
              @click="limpiarBusqueda"
              title="Limpiar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th style="width:110px;">ID</th>
                <th>Centro Costo</th>
                <th style="width:180px;">Responsable</th>
                <th style="width:160px;">Estatus</th>
                <th class="d-none d-lg-table-cell" style="width:160px;">Empresa</th>
                <th class="d-none d-md-table-cell" style="width:170px;">Fecha subida</th>
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
                  <div class="fw-semibold text-truncate">
                    {{ r.centroCostoNombre || r.nombre_centro_costo || r.centroCosto || r.numero_contrato || '—' }}
                  </div>
                  <div class="small text-secondary d-md-none mt-1">
                    <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                  </div>
                </td>
                <td>{{ r.responsable || '—' }}</td>
                <td><span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span></td>
                <td class="d-none d-lg-table-cell">{{ r.empresa || '—' }}</td>
                <td class="d-none d-md-table-cell">{{ prettyTS(r.fechaSubida) }}</td>
                <td>
                  <div class="d-none d-sm-inline-flex btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" title="Editar" @click="abrirEditor(r)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Eliminar" @click="abrirConfirm(r)">
                      <i class="bi bi-trash3"></i>
                    </button>
                    <button class="btn btn-outline-secondary" title="Ver archivo OC" @click="verArchivoOC(r)">
                      <i class="bi bi-file-earmark-pdf"></i>
                    </button>
                  </div>
                  <div class="dropdown d-inline d-sm-none">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" type="button">
                      Acciones
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li><button class="dropdown-item" @click="abrirEditor(r)"><i class="bi bi-pencil-square me-2"></i>Editar</button></li>
                      <li><button class="dropdown-item" @click="verArchivoOC(r)"><i class="bi bi-file-earmark-pdf me-2"></i>Ver archivo</button></li>
                      <li><hr class="dropdown-divider"></li>
                      <li><button class="dropdown-item text-danger" @click="abrirConfirm(r)"><i class="bi bi-trash3 me-2"></i>Eliminar</button></li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-block d-md-none">
          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border" role="status"></div>
            <div class="small text-secondary mt-2">Cargando…</div>
          </div>
          <div v-else-if="rows.length === 0" class="text-center py-4 text-secondary">Sin resultados.</div>

          <div v-else class="list-group list-group-flush">
            <div v-for="r in rows" :key="r.__id" class="list-group-item">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-semibold">#{{ r.id ?? '—' }}</div>
                  <div class="small text-secondary"><i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}</div>
                </div>
                <span class="badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>
              <div class="mt-2 small">
                <div class="text-truncate">
                  <span class="text-secondary">Centro costo:</span>
                  {{ r.centroCostoNombre || r.nombre_centro_costo || r.centroCosto || r.numero_contrato || '—' }}
                </div>
                <div class="text-truncate"><span class="text-secondary">Empresa:</span> {{ r.empresa || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Responsable:</span> {{ r.responsable || '—' }}</div>
              </div>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-primary btn-sm flex-fill" @click="abrirEditor(r)">
                  <i class="bi bi-pencil-square me-1"></i> Editar
                </button>
                <button class="btn btn-outline-secondary btn-sm flex-fill" @click="verArchivoOC(r)">
                  <i class="bi bi-file-earmark-pdf me-1"></i> Archivo
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="abrirConfirm(r)">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer" v-if="!busquedaActiva && !hasActiveFilters">
          <nav aria-label="Paginación">
            <ul class="pagination justify-content-center mb-0 flex-wrap gap-1">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">«</button>
              </li>
              <li class="page-item" v-for="n in visiblePageButtons" :key="n" :class="{ active: currentPage === n }">
                <button class="page-link" @click="goToPage(n)">{{ n }}</button>
              </li>
              <li class="page-item" :class="{ disabled: !hasNextPage }">
                <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="!hasNextPage">»</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filtros</div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Buscar OC</label>
              <div class="input-group">
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
                  title="Limpiar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="filtroEstatus" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="filtroResponsable" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option v-for="r in RESPONSABLES_OPC" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="offcanvas-footer d-flex justify-content-between">
          <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar todo</button>
          <button class="btn btn-primary" @click="mobileApplyFilters">Aplicar</button>
        </div>
      </div>
    </div>
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold text-truncate">Editar Orden OC</div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-6 col-md-2">
              <label class="form-label">ID</label>
              <input class="form-control" v-model.number="edit.id" type="number" min="0">
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha subida</label>
              <input type="text" class="form-control" :value="prettyTS(edit.fechaSubida)" disabled>
              <div class="form-text">Se fija automáticamente y no se modifica.</div>
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha aprobación</label>
              <input type="text" class="form-control" :value="prettyTS(edit.fechaAprobacion)" disabled>
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="edit.empresa" placeholder="Xtreme Servicio">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="edit.estatus">
                <option v-for="s in ESTATUS_OPC" :key="s">{{ s }}</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Centro Costo (código)</label>
              <input class="form-control" v-model="edit.centroCosto" placeholder="CASAMATRIZ">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Centro Costo (nombre)</label>
              <input class="form-control" v-model="edit.centroCostoNombre" placeholder="CASA MATRIZ">
            </div>
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
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between">
                <label class="form-label fw-semibold mb-0">Asociar SOLPED (Pendiente / Parcial)</label>
                <div>
                  <span v-if="edit.solpedId" class="badge bg-primary me-2">
                    Asociada: #{{ edit.numero_solped }}
                  </span>
                  <button
                    v-if="edit.solpedId"
                    class="btn btn-sm btn-outline-danger"
                    :disabled="guardandoSolped"
                    @click="quitarAsociacionSolped"
                  >
                    Quitar asociación
                  </button>
                </div>
              </div>

              <div class="row g-2 align-items-center mt-1">
                <div class="col-12 col-md-8">
                  <select
                    class="form-select"
                    :disabled="cargandoSolpeds || guardandoSolped"
                    v-model="solpedSeleccionId"
                    @change="onSeleccionarSolped"
                  >
                    <option value="">— Selecciona una SOLPED —</option>
                    <option v-for="s in solpedsFiltradas" :key="s.id" :value="s.id">
                      #{{ s.numero_solpe }} · {{ s.tipo_solped ?? 'SIN TIPO' }} · {{ s.centroCostoTexto ?? 's/CC' }} · {{ s.estatus }}
                    </option>
                  </select>
                </div>
                <div class="col-12 col-md-4">
                  <input
                    v-model="solpedBusqueda"
                    type="text"
                    class="form-control"
                    placeholder="Buscar por número, tipo o CC…"
                    :disabled="cargandoSolpeds"
                  />
                </div>
              </div>
              <div class="form-text">
                Se guardan automáticamente <strong>numero_solped</strong> (número) y <strong>solpedId</strong>.
              </div>
              <div class="small mt-1">
                <span v-if="cargandoSolpeds" class="text-secondary">Cargando SOLPEDs…</span>
                <span v-else-if="!solpedsFiltradas.length" class="text-secondary">No hay SOLPEDs pendientes/parciales.</span>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="Sin SOLPED / REPUESTOS / ...">
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo compra</label>
              <input class="form-control" v-model="edit.tipoCompra" placeholder="stock / emergencia / ...">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Moneda</label>
              <input class="form-control" v-model="edit.moneda" placeholder="CLP">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Total c/ IVA</label>
              <input class="form-control" v-model.number="edit.precioTotalConIVA" type="number" min="0">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Destino compra</label>
              <input class="form-control" v-model="edit.destinoCompra" placeholder="">
            </div>
            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="edit.comentario" placeholder="Notas / observaciones"></textarea>
            </div>
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivo OC (único)</div>
                <div class="d-flex gap-2 flex-wrap">
                  <input
                    ref="inputArchivoOCEl"
                    type="file"
                    class="d-none"
                    accept="application/pdf,image/*"
                    @change="onArchivoOC"
                  >
                  <button class="btn btn-sm btn-outline-secondary" @click="openArchivoOCPicker">
                    <i class="bi bi-paperclip me-1"></i> Reemplazar archivo OC
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
                    <div class="d-flex gap-2">
                      <a class="btn btn-sm btn-outline-secondary" :href="edit.archivoOC?.url" target="_blank">Ver</a>
                      <button class="btn btn-sm btn-outline-danger" @click="borrarArchivoOC">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="list-group-item text-secondary small">Sin archivo OC.</div>
              </div>
            </div>
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivos en Storage</div>
                <div class="d-flex gap-2 flex-wrap">
                  <input
                    ref="inputArchivosStorageEl"
                    type="file"
                    class="d-none"
                    multiple
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosStorage"
                  >
                  <button class="btn btn-sm btn-outline-secondary" @click="openArchivosStoragePicker">
                    <i class="bi bi-cloud-upload me-1"></i> Agregar archivos
                  </button>
                </div>
              </div>
              <div class="list-group">
                <div
                  class="list-group-item d-flex align-items-center justify-content-between"
                  v-for="(a, ai) in edit.archivosStorage"
                  :key="'st'+ai"
                >
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
              <div class="form-text">
                Nota: el botón “Eliminar” solo quita el link del documento (no borra el archivo del Storage).
              </div>
            </div>
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
                      <input class="form-control form-control-sm" :value="prettyTS(h.fecha ?? h._previewFecha)" disabled>
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
          <div class="d-flex justify-content-end gap-2 flex-wrap">
            <button class="btn btn-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva Orden OC</h5>
        </div>
        <div class="vmodal-body">
          <div class="row g-3">
            <div class="col-6 col-md-3">
              <label class="form-label">ID</label>
              <input class="form-control" v-model.number="nuevo.id" type="number" min="0">
            </div>
            <div class="col-6 col-md-5">
              <label class="form-label">Fecha subida</label>
              <input type="text" class="form-control" :value="prettyTS(new Date())" disabled>
              <div class="form-text">Se guardará automáticamente con la hora del servidor.</div>
            </div>

            <div class="col-6 col-md-4">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="nuevo.empresa" placeholder="Xtreme Servicio">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option v-for="s in ESTATUS_OPC" :key="'n-'+s">{{ s }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Centro Costo (código)</label>
              <input class="form-control" v-model="nuevo.centroCosto" placeholder="CASAMATRIZ">
            </div>
            <div class="col-md-6">
              <label class="form-label">Centro Costo (nombre)</label>
              <input class="form-control" v-model="nuevo.centroCostoNombre" placeholder="CASA MATRIZ">
            </div>

            <div class="col-md-6">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="nuevo.responsable">
                <option value="">— Selecciona —</option>
                <option v-for="r in RESPONSABLES_OPC" :key="'nr-'+r">{{ r }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Aprobado por</label>
              <input class="form-control" v-model="nuevo.aprobadoPor">
            </div>

            <div class="col-md-6">
              <label class="form-label">Tipo compra</label>
              <input class="form-control" v-model="nuevo.tipoCompra" placeholder="stock">
            </div>
            <div class="col-md-6">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="nuevo.tipo_solped" placeholder="Sin SOLPED">
            </div>

            <div class="col-md-6">
              <label class="form-label">Número SOLPED (asociar)</label>
              <input class="form-control" v-model="nuevo.numero_solped" placeholder="29">
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
            <div class="col-12">
              <label class="form-label">Archivo OC (PDF/imagen)</label>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  ref="inputArchivoOCNuevoEl"
                  type="file"
                  class="d-none"
                  accept="application/pdf,image/*"
                  @change="onArchivoOCNuevo"
                >
                <button class="btn btn-secondary" @click="openArchivoOCNuevoPicker">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivo OC
                </button>
                <div class="small text-secondary" v-if="archivoOCNuevoNombre">
                  Seleccionado: <strong>{{ archivoOCNuevoNombre }}</strong>
                </div>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Archivos Storage (múltiples)</label>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  ref="inputArchivosStorageNuevoEl"
                  type="file"
                  class="d-none"
                  multiple
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  @change="onArchivosStorageNuevo"
                >
                <button class="btn btn-secondary" @click="openArchivosStorageNuevoPicker">
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
            ¿Seguro que quieres eliminar la Orden OC
            <strong>#{{ confirmRow?.id ?? '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Empresa:</span> <strong>{{ confirmRow?.empresa || '—' }}</strong></li>
            <li><span class="text-secondary">Centro costo:</span> <strong>{{ confirmRow?.centroCostoNombre || confirmRow?.nombre_centro_costo || confirmRow?.centroCosto || '—' }}</strong></li>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { db } from "../stores/firebase";
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot,
  doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, getDocs, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";

const prettyTS = (v) => {
  if (!v) return "—";
  if (v instanceof Timestamp) return v.toDate().toISOString().replace("T", " ").replace("Z", "");
  if (v?.seconds) return new Date(v.seconds * 1000).toISOString().replace("T", " ").replace("Z", "");
  if (v instanceof Date) return v.toISOString().replace("T", " ").replace("Z", "");
  if (typeof v === "string") return v.replace("T", " ").replace("Z", "");
  return String(v);
};

function cloneForUI(x) {
  if (x === null || typeof x !== "object") return x;
  if (x instanceof Date || x instanceof Timestamp) return x;
  if (Array.isArray(x)) return x.map(cloneForUI);
  const out = {};
  for (const [k, v] of Object.entries(x)) out[k] = cloneForUI(v);
  return out;
}

function safeCloneFirestore(x) {
  if (x === null || typeof x !== "object") return x;
  if (x instanceof Date || x instanceof Timestamp) return x;
  if (Array.isArray(x)) return x.map(safeCloneFirestore);
  const out = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === "_previewFecha") continue;
    out[k] = safeCloneFirestore(v);
  }
  return out;
}

const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado","Aprobado","Rechazado","Preaprobado","Casi Aprobado","Pendiente de Aprobación","Enviada a proveedor","Revisión Guillermo"
];
const RESPONSABLES_OPC = [
  "Luis Orellana","Guillermo Manzor","María José Ballesteros","Ricardo Santibañez","Felipe Gonzalez","Juan Cubillos"
];

const rows = ref([]);
const cargando = ref(true);
const currentPage = ref(1);
const hasNextPage = ref(false);
const pageCursors = ref([]);
let unsubList = null;

const buscarTexto = ref("");
const busquedaActiva = ref(false);
const filtroEstatus = ref("");
const filtroResponsable = ref("");
let unsubSearch = null;
const toasts = ref([]);
const addToast = (type, text, timeout = 2600) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };
const badgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("complet") || s.includes("aprob") || s.includes("recep")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("curso") || s.includes("enviada") || s.includes("revisión")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("anul")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("solicit")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};
const mobileFiltersOpen = ref(false);
const hasActiveFilters = computed(() => !!filtroEstatus.value || !!filtroResponsable.value);
const totalFiltrosActivos = computed(() => (filtroEstatus.value ? 1 : 0) + (filtroResponsable.value ? 1 : 0));
function mobileApplyFilters(){
  aplicarFiltros();
  mobileFiltersOpen.value = false;
}
function limpiarFiltros(){
  filtroEstatus.value = "";
  filtroResponsable.value = "";
  if (busquedaActiva.value) limpiarBusqueda();
  else aplicarFiltros();
}

const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const maxReach = currentPage.value + (hasNextPage.value ? 2 : 1);
  const start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
  const pages = [];
  for (let n = start; n < start + maxButtons; n++) {
    if (n <= maxReach) pages.push(n);
  }
  if (!pages.includes(currentPage.value)) pages.push(currentPage.value);
  pages.sort((a,b)=>a-b);
  return pages;
});

function buildPageQuery(page, withFilters = true) {
  const colRef = collection(db, "ordenes_oc");
  const constraints = [];

  if (withFilters) {
    if (filtroEstatus.value) constraints.push(where("estatus", "==", filtroEstatus.value));
    if (filtroResponsable.value) constraints.push(where("responsable", "==", filtroResponsable.value));
  }

  constraints.push(orderBy("id", "desc"));

  if (page > 1) {
    const prevCursor = pageCursors.value[page - 2];
    if (!prevCursor) return null;
    constraints.push(startAfter(prevCursor));
  }

  constraints.push(limit(PAGE_SIZE + 1));
  return query(colRef, ...constraints);
}

function subscribePage(page){
  if (unsubList) { unsubList(); unsubList = null; }
  if (unsubSearch) { unsubSearch(); unsubSearch = null; }

  cargando.value = true;
  busquedaActiva.value = false;

  const qy = buildPageQuery(page, true);
  if (!qy) { cargando.value = false; return; }

  unsubList = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ __id: d.id, ...d.data(), __snap: d }));
    hasNextPage.value = arr.length > PAGE_SIZE;

    const pageDocs = arr.slice(0, PAGE_SIZE);
    rows.value = pageDocs.map(x => { const y = { ...x }; delete y.__snap; return y; });

    const lastSnap = pageDocs.length ? pageDocs[pageDocs.length - 1].__snap : null;
    if (lastSnap) pageCursors.value[page - 1] = lastSnap;

    cargando.value = false;
  }, (err) => {
    console.error("onSnapshot page:", err);
    addToast("danger", "Error listando OC (posible índice compuesto faltante).");
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
function aplicarFiltros(){ currentPage.value = 1; subscribePage(1); }

async function onBuscar(){
  const raw = (buscarTexto.value ?? "").trim();
  if (!raw) { limpiarBusqueda(); return; }
  const num = parseInt(raw, 10);
  if (!isNaN(num) && String(num) === raw) {
    if (unsubList) { unsubList(); unsubList = null; }
    if (unsubSearch) { unsubSearch(); unsubSearch = null; }
    cargando.value = true;
    busquedaActiva.value = true;

    const colRef = collection(db, "ordenes_oc");
    const constraints = [ where("id", "==", num) ];
    if (filtroEstatus.value) constraints.push(where("estatus","==",filtroEstatus.value));
    if (filtroResponsable.value) constraints.push(where("responsable","==",filtroResponsable.value));
    constraints.push(limit(20));

    const qy = query(colRef, ...constraints);

    unsubSearch = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ __id: d.id, ...d.data() }));
      rows.value = arr.sort((a,b)=>(b.id??0)-(a.id??0));
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
    cargando.value = true;
    busquedaActiva.value = true;
    try {
      const dref = doc(db, "ordenes_oc", raw);
      const d = await getDoc(dref);
      const found = d.exists() ? [{ __id: d.id, ...d.data() }] : [];
      rows.value = found;
      cargando.value = false;
      hasNextPage.value = false;
      if (!found.length) addToast("warning", "No se encontró la OC con ese ID de documento.");
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

const inputArchivoOCEl = ref(null);
const inputArchivosStorageEl = ref(null);
const inputArchivoOCNuevoEl = ref(null);
const inputArchivosStorageNuevoEl = ref(null);

const triggerPicker = (el) => {
  if (!el) return;
  el.value = "";
  el.click();
};

function openArchivoOCPicker(){ triggerPicker(inputArchivoOCEl.value); }
function openArchivosStoragePicker(){ triggerPicker(inputArchivosStorageEl.value); }
function openArchivoOCNuevoPicker(){ triggerPicker(inputArchivoOCNuevoEl.value); }
function openArchivosStorageNuevoPicker(){ triggerPicker(inputArchivosStorageNuevoEl.value); }

const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);


const archivoOCFile = ref(null);
function onArchivoOC(e){
  const f = (e.target.files || [])[0];
  archivoOCFile.value = f || null;
}
function borrarArchivoOC(){ edit.value.archivoOC = null; }


const nuevosStorageFiles = ref([]);
function onArchivosStorage(e){ nuevosStorageFiles.value = Array.from(e.target.files || []); }
function eliminarArchivoStorage(ix){ edit.value.archivosStorage.splice(ix, 1); }

const SOLPEDS_COL = "solpes";
const cargandoSolpeds = ref(false);
const guardandoSolped = ref(false);
const solpeds = ref([]);
const solpedBusqueda = ref("");
const solpedSeleccionId = ref("");

const solpedsFiltradas = computed(() => {
  const q = solpedBusqueda.value.trim().toLowerCase();
  if (!q) return solpeds.value;
  return solpeds.value.filter(s => {
    const num = String(s.numero_solpe ?? "").toLowerCase();
    const tipo = String(s.tipo_solped ?? "").toLowerCase();
    const cc  = String(s.centroCostoTexto ?? "").toLowerCase();
    return num.includes(q) || tipo.includes(q) || cc.includes(q);
  });
});

async function cargarSolpedsPendientes(){
  cargandoSolpeds.value = true;
  try {
    const colRef = collection(db, SOLPEDS_COL);
    const q1 = query(
      colRef,
      where("estatus", "in", ["Pendiente","Parcial","pendiente","parcial"]),
      orderBy("numero_solpe", "desc"),
      limit(300)
    );
    const snap = await getDocs(q1);
    const items = [];
    snap.forEach(d => {
      const x = d.data();
      if (typeof x.numero_solpe === "number") {
        items.push({
          id: d.id,
          numero_solpe: x.numero_solpe,
          estatus: x.estatus ?? "",
          tipo_solped: x.tipo_solped,
          centroCostoTexto: x.centroCostoTexto
        });
      }
    });
    items.sort((a,b) => {
      const ap = String(a.estatus).toLowerCase() === "parcial";
      const bp = String(b.estatus).toLowerCase() === "parcial";
      if (ap !== bp) return ap ? -1 : 1;
      return (b.numero_solpe ?? 0) - (a.numero_solpe ?? 0);
    });
    solpeds.value = items;
  } catch (e) {
    console.error(e);
    addToast("danger","Error cargando SOLPEDs.");
  } finally {
    cargandoSolpeds.value = false;
  }
}

async function onSeleccionarSolped(){
  if (!seleccion.value) return;
  const sel = solpeds.value.find(s => s.id === solpedSeleccionId.value);
  if (!sel) return;

  guardandoSolped.value = true;
  try {
    const dref = doc(db, "ordenes_oc", seleccion.value.__id);
    await updateDoc(dref, {
      solpedId: sel.id,
      numero_solped: sel.numero_solpe
    });
    edit.value.solpedId = sel.id;
    edit.value.numero_solped = sel.numero_solpe;
    addToast("success","SOLPED asociada.");
  } catch (e) {
    console.error(e);
    addToast("danger","No se pudo asociar la SOLPED.");
  } finally {
    guardandoSolped.value = false;
  }
}

async function quitarAsociacionSolped(){
  if (!seleccion.value) return;
  if (!confirm("¿Quitar la SOLPED asociada de esta orden?")) return;
  guardandoSolped.value = true;
  try {
    const dref = doc(db, "ordenes_oc", seleccion.value.__id);
    await updateDoc(dref, { solpedId: null, numero_solped: null });
    edit.value.solpedId = null;
    edit.value.numero_solped = null;
    solpedSeleccionId.value = "";
    addToast("success","Asociación eliminada.");
  } catch (e) {
    console.error(e);
    addToast("danger","No se pudo quitar la asociación.");
  } finally {
    guardandoSolped.value = false;
  }
}

function abrirEditor(row){
  seleccion.value = row;

  edit.value = cloneForUI({
    aprobadoPor: row.aprobadoPor ?? "",
    aprobadorSugerido: row.aprobadorSugerido ?? "",
    archivoOC: row.archivoOC ?? null,
    archivosStorage: Array.isArray(row.archivosStorage) ? row.archivosStorage : [],
    centroCosto: row.centroCosto ?? row.numero_contrato ?? "",
    centroCostoNombre: row.centroCostoNombre ?? row.nombre_centro_costo ?? "",
    comentario: row.comentario ?? "",
    destinoCompra: row.destinoCompra ?? "",
    empresa: row.empresa ?? "Xtreme Servicio",
    estatus: row.estatus ?? "Solicitado",
    fechaAprobacion: row.fechaAprobacion ?? null,
    fechaSubida: row.fechaSubida ?? null,
    historial: Array.isArray(row.historial) ? row.historial : [],
    id: row.id ?? null,
    moneda: row.moneda ?? "CLP",
    precioTotalConIVA: row.precioTotalConIVA ?? 0,
    responsable: row.responsable ?? "",
    tipoCompra: row.tipoCompra ?? "",
    tipo_solped: row.tipo_solped ?? "Sin SOLPED",
    numero_solped: row.numero_solped ?? "",
    solpedId: row.solpedId ?? null,
    items: Array.isArray(row.items) ? row.items : []
  });

  edit.value.historial = (edit.value.historial || []).map(h => {
    const hh = { ...h };
    const hasRealTs =
      (typeof hh.fecha?.toDate === "function") ||
      (hh.fecha && typeof hh.fecha.seconds === "number");
    if (hasRealTs && "_previewFecha" in hh) delete hh._previewFecha;
    return hh;
  });

  editorAbierto.value = true;

  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];

  cargarSolpedsPendientes().then(() => {
    solpedSeleccionId.value = edit.value.solpedId || "";
  });
}

function cerrarEditor(){
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];
  solpeds.value = [];
  solpedBusqueda.value = "";
  solpedSeleccionId.value = "";
}

async function guardarEdicion() {
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const idDoc = seleccion.value.__id;
    const dref = doc(db, "ordenes_oc", idDoc);
    if (archivoOCFile.value) {
      const storage = getStorage();
      const path = `ordenes_oc/${idDoc}/oc_enviada_${Date.now()}_${archivoOCFile.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoOCFile.value);
      const url = await getDownloadURL(up.ref);
      edit.value.archivoOC = {
        nombre: archivoOCFile.value.name,
        tipo: archivoOCFile.value.type || "application/octet-stream",
        url,
        fechaSubida: serverTimestamp()
      };
      archivoOCFile.value = null;
    }
    if (nuevosStorageFiles.value?.length) {
      const storage = getStorage();
      const uploads = [];
      for (const f of nuevosStorageFiles.value) {
        const path = `ordenes_oc/${idDoc}/${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({ nombre: f.name, tipo: f.type || "application/octet-stream", url });
      }
      if (!Array.isArray(edit.value.archivosStorage)) edit.value.archivosStorage = [];
      edit.value.archivosStorage.push(...uploads);
      nuevosStorageFiles.value = [];
    }
    if (typeof edit.value.id === "string") {
      const n = parseInt(edit.value.id, 10);
      edit.value.id = isNaN(n) ? null : n;
    }
    if (typeof edit.value.precioTotalConIVA === "string") {
      const n = parseInt(edit.value.precioTotalConIVA, 10);
      edit.value.precioTotalConIVA = isNaN(n) ? 0 : n;
    }
    if (Array.isArray(edit.value.items)) {
      edit.value.items = edit.value.items.map(it => ({
        ...it,
        item: Number(it.item ?? 0),
        cantidad: Number(it.cantidad ?? 0),
        precio_unitario: Number(it.precio_unitario ?? 0)
      }));
    }

    const payload = safeCloneFirestore(edit.value);
    delete payload.fechaSubida;
    delete payload.fechaAprobacion;

    await updateDoc(dref, payload);
    addToast("success", "Orden OC actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

function agregarHistorial(){
  if (!Array.isArray(edit.value.historial)) edit.value.historial = [];
  edit.value.historial.push({
    estatus: edit.value.estatus || "Actualizado",
    fecha: serverTimestamp(),
    _previewFecha: new Date(),
    usuario: edit.value.responsable || edit.value.aprobadoPor || ""
  });
}
function eliminarHistorial(ix){ edit.value.historial.splice(ix, 1); }

const confirmOpen = ref(false);
const confirmRow  = ref(null);
const eliminando  = ref(false);

function abrirConfirm(row){ confirmRow.value = row; confirmOpen.value = true; }
function cerrarConfirm(){ if (eliminando.value) return; confirmOpen.value = false; confirmRow.value = null; }
async function confirmarEliminar(){
  if (!confirmRow.value?.__id) return;
  try {
    eliminando.value = true;
    await deleteDoc(doc(db, "ordenes_oc", confirmRow.value.__id));
    addToast("success", "Orden OC eliminada.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar.");
  } finally {
    eliminando.value = false;
  }
}

const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});
const archivoOCNuevo = ref(null);
const archivoOCNuevoNombre = ref("");
const previewArchivosStorageNuevo = ref([]);

function defaultNuevo(){
  return {
    id: null,
    empresa: "Xtreme Servicio",
    estatus: "Solicitado",
    comentario: "",
    centroCosto: "",
    centroCostoNombre: "",
    responsable: "",
    aprobadoPor: "",
    aprobadorSugerido: "",
    tipoCompra: "stock",
    tipo_solped: "Sin SOLPED",
    numero_solped: "",
    moneda: "CLP",
    precioTotalConIVA: 0,
    destinoCompra: "",
    archivoOC: null,
    archivosStorage: [],
    fechaSubida: null,
    fechaAprobacion: null,
    historial: [],
    items: []
  };
}

function abrirModalNueva(){
  nuevo.value = defaultNuevo();
  archivoOCNuevo.value = null;
  archivoOCNuevoNombre.value = "";
  previewArchivosStorageNuevo.value = [];
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

    const payload = safeCloneFirestore({
      ...defaultNuevo(),
      ...nuevo.value,
      archivoOC: null,
      archivosStorage: [],
      fechaSubida: serverTimestamp(),
      fechaAprobacion: null,
      historial: []
    });

    const dref = await addDoc(collection(db, "ordenes_oc"), payload);
    if (archivoOCNuevo.value) {
      const storage = getStorage();
      const path = `ordenes_oc/${dref.id}/oc_enviada_${Date.now()}_${archivoOCNuevo.value.name}`;
      const sRef = sref(storage, path);
      const up = await uploadBytes(sRef, archivoOCNuevo.value);
      const url = await getDownloadURL(up.ref);
      await updateDoc(doc(db, "ordenes_oc", dref.id), {
        archivoOC: {
          nombre: archivoOCNuevo.value.name,
          tipo: archivoOCNuevo.value.type || "application/octet-stream",
          url,
          fechaSubida: serverTimestamp()
        }
      });
    }
    if (previewArchivosStorageNuevo.value.length) {
      const storage = getStorage();
      const uploads = [];
      for (const f of previewArchivosStorageNuevo.value) {
        const path = `ordenes_oc/${dref.id}/${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({ nombre: f.name, tipo: f.type || "application/octet-stream", url });
      }
      await updateDoc(doc(db, "ordenes_oc", dref.id), { archivosStorage: uploads });
    }

    addToast("success", `OC creada${payload.id ? ` (#${payload.id})` : ""}.`);
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la Orden OC.");
  } finally {
    creando.value = false;
  }
}

function verArchivoOC(row){
  const url = row?.archivoOC?.url;
  if (!url) { addToast("warning", "Esta OC no tiene archivoOC aún."); return; }
  window.open(url, "_blank");
}

onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => {
  if (unsubList) unsubList();
  if (unsubSearch) unsubSearch();
});
</script>

<style scoped>
.admin-oc-page{
  min-height:100vh;
  --oc-radius: 14px;
}


.h4-md { font-size: 1.25rem; }
@media (min-width: 768px){ .h4-md { font-size: 1.5rem; } }

.minw-280{ min-width: 280px; }

.text-truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 576px){
  .text-truncate { max-width: 180px; }
}

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
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.offcanvas-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.offcanvas-body{
  padding: 1rem; overflow: auto; flex: 1 1 auto; min-height: 0;
}
@keyframes slideIn{
  from{ transform: translateX(20px); opacity:.0; }
  to{ transform: translateX(0); opacity:1; }
}


.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1080; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 700px;  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid rgba(0,0,0,.06);
}
.vmodal-header, .vmodal-footer{
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }


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

.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}
</style>
