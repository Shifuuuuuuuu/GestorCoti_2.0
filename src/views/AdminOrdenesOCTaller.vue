<!-- src/views/AdminOCTaller.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-oc-page">
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
        <h1 class="h5 h4-md fw-semibold mb-0">Admin · Órdenes OC (Taller)</h1>

        <!-- Desktop / Tablet: filtros + acciones -->
        <div class="d-none d-md-flex align-items-stretch gap-2 flex-wrap w-100 w-lg-auto ms-md-3">
          <!-- Buscador (ID doc o id numérico) -->
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

          <!-- Botón Filtros (abre offcanvas) -->
          <button class="btn btn-outline-primary" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span v-if="hasActiveFilters" class="badge bg-primary-subtle text-primary-emphasis ms-2">{{ totalFiltrosActivos }}</span>
          </button>

          <button class="btn btn-primary" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva OC (Taller)
          </button>
        </div>

        <!-- Móvil: botones -->
        <div class="d-flex d-md-none w-100 gap-2">
          <button class="btn btn-outline-secondary flex-fill" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span v-if="hasActiveFilters" class="badge bg-primary-subtle text-primary-emphasis ms-1">{{ totalFiltrosActivos }}</span>
          </button>
          <button class="btn btn-primary flex-fill" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva
          </button>
        </div>
      </div>

      <!-- Chips de filtros activos -->
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

      <!-- Tabla / Cards -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="busquedaActiva || hasActiveFilters" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>

          <!-- Buscar móvil (compacto) -->
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

        <!-- Vista tabla (≥ md) -->
        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th style="width:110px;">ID</th>
                <th>Centro Costo</th>
                <th style="width:180px;">Responsable</th>
                <th style="width:160px;">Estatus</th>
                <th class="d-none d-lg-table-cell" style="width:160px;">Empresa</th>
                <th class="d-none d-md-table-cell" style="width:150px;">Fecha subida</th>
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
                  <div class="fw-semibold text-truncate">{{ r.centroCostoTexto || '—' }}</div>
                  <!-- Fecha visible en móvil -->
                  <div class="small text-secondary d-md-none mt-1">
                    <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                  </div>
                </td>
                <td>{{ r.responsable || '—' }}</td>
                <td><span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span></td>
                <td class="d-none d-lg-table-cell">{{ r.empresa || '—' }}</td>
                <td class="d-none d-md-table-cell">{{ prettyTS(r.fechaSubida) }}</td>
                <td>
                  <!-- Acciones desktop -->
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
                  <!-- Acciones móvil -->
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

        <!-- Vista cards (xs-sm) -->
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
                <div class="text-truncate"><span class="text-secondary">Centro costo:</span> {{ r.centroCostoTexto || '—' }}</div>
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

        <!-- Paginación -->
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

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Offcanvas Filtros (lateral derecho y responsivo) -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filtros</div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body">
          <div class="row g-3">
            <!-- Buscador -->
            <div class="col-12">
              <label class="form-label">Buscar OC (Taller)</label>
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

            <!-- Estatus -->
            <div class="col-12 col-sm-6">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="filtroEstatus" @change="aplicarFiltros">
                <option value="">Todos</option>
                <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <!-- Responsable -->
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

    <!-- Offcanvas Editor (ÚNICO con edición en línea) -->
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold text-truncate">Editar Orden OC (Taller)</div>
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
              <input type="text" class="form-control" :value="prettyTS(edit.fechaSubida)" disabled>
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
            <div class="col-12">
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

            <!-- Asociación SOLPED (NUEVO) -->
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
                    @click="quitarAsociacionSolped">
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
                    <option
                      v-for="s in solpedsFiltradas"
                      :key="s.id"
                      :value="s.id"
                    >
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

              <div class="small mt-1">
                <span v-if="cargandoSolpeds" class="text-secondary">Cargando SOLPEDs…</span>
                <span v-else-if="!solpedsFiltradas.length" class="text-secondary">No hay SOLPEDs pendientes/parciales para mostrar.</span>
              </div>
            </div>

            <!-- Tipo SOLPED (se mantiene tal cual) -->
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="Sin SOLPED / REPUESTOS / ...">
            </div>

            <!-- Tipo compra -->
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo compra</label>
              <input class="form-control" v-model="edit.tipoCompra" placeholder="stock / emergencia / ...">
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

            <!-- Comentario / Destino -->
            <div class="col-12 col-md-6">
              <label class="form-label">Destino compra</label>
              <input class="form-control" v-model="edit.destinoCompra" placeholder="">
            </div>
            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="edit.comentario" placeholder="Notas / observaciones"></textarea>
            </div>

            <!-- Archivo OC (único) -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivo OC (único)</div>
                <div class="d-flex gap-2 flex-wrap">
                  <input id="inputArchivoOC" type="file" class="d-none"
                         accept="application/pdf,image/*"
                         @change="onArchivoOC">
                  <button class="btn btn-sm btn-outline-secondary"
                          @click="() => document.getElementById('inputArchivoOC')?.click()">
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
                <div class="d-flex gap-2 flex-wrap">
                  <input id="inputArchivosStorage" type="file" class="d-none"
                         multiple
                         accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                         @change="onArchivosStorage">
                  <button class="btn btn-sm btn-outline-secondary"
                          @click="() => document.getElementById('inputArchivosStorage')?.click()">
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

            <!-- Ítems (edición en línea) -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="agregarItemInline">
                  <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                </button>
              </div>

              <!-- Tabla en ≥ sm -->
              <div class="table-responsive d-none d-sm-block">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width:72px;">Ítem</th>
                      <th>Descripción</th>
                      <th style="width:110px;">Cant.</th>
                      <th style="width:120px;">Cotizada</th>
                      <th style="width:160px;">Código ref.</th>
                      <th style="width:140px;">Estado</th>
                      <th style="width:160px;">Imagen</th>
                      <th style="width:170px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!edit.items?.length">
                      <td colspan="8" class="text-center text-secondary">Sin ítems.</td>
                    </tr>
                    <tr v-for="(it, idx) in edit.items" :key="'e-'+idx">
                      <td>
                        <input class="form-control form-control-sm" v-model.number="it.item" type="number" min="1">
                      </td>
                      <td>
                        <input class="form-control form-control-sm" v-model="it.descripcion" placeholder="Descripción">
                        <input class="form-control form-control-sm mt-1" v-model="it.numero_interno" placeholder="N° interno (opcional)">
                      </td>
                      <td><input class="form-control form-control-sm" v-model.number="it.cantidad" type="number" min="0"></td>
                      <td><input class="form-control form-control-sm" v-model.number="it.cantidad_cotizada" type="number" min="0"></td>
                      <td><input class="form-control form-control-sm" v-model="it.codigo_referencial" placeholder="Código"></td>
                      <td>
                        <select class="form-select form-select-sm" v-model="it.estado">
                          <option>pendiente</option>
                          <option>parcial</option>
                          <option>completado</option>
                          <option>revisión</option>
                        </select>
                      </td>
                      <td>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                          <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank" class="small">ver</a>
                          <input :id="`inputImg-${idx}`" type="file" class="d-none" accept="image/*"
                                 @change="onImagenItemChange($event, idx)">
                          <button class="btn btn-sm btn-outline-secondary"
                                  @click="() => document.getElementById(`inputImg-${idx}`)?.click()">
                            Subir
                          </button>
                          <button v-if="it.imagen_url" class="btn btn-sm btn-outline-danger" @click="quitarImagenItem(idx)">
                            Quitar
                          </button>
                        </div>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-danger" @click="eliminarItemInline(idx)">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Cards en xs -->
              <div class="d-block d-sm-none">
                <div v-if="!edit.items?.length" class="text-center text-secondary py-2">Sin ítems.</div>
                <div class="list-group list-group-flush">
                  <div v-for="(it, idx) in edit.items" :key="'m-'+idx" class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="fw-semibold">Ítem</div>
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarItemInline(idx)"><i class="bi bi-trash3"></i></button>
                    </div>
                    <div class="row g-2 mt-1">
                      <div class="col-4">
                        <input class="form-control form-control-sm" v-model.number="it.item" type="number" min="1" placeholder="#"/>
                      </div>
                      <div class="col-8">
                        <select class="form-select form-select-sm" v-model="it.estado">
                          <option>pendiente</option>
                          <option>parcial</option>
                          <option>completado</option>
                          <option>revisión</option>
                        </select>
                      </div>
                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.descripcion" placeholder="Descripción"/>
                      </div>
                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.numero_interno" placeholder="N° interno"/>
                      </div>
                      <div class="col-6">
                        <input class="form-control form-control-sm" v-model.number="it.cantidad" type="number" min="0" placeholder="Cant."/>
                      </div>
                      <div class="col-6">
                        <input class="form-control form-control-sm" v-model.number="it.cantidad_cotizada" type="number" min="0" placeholder="Cotizada"/>
                      </div>
                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.codigo_referencial" placeholder="Código ref."/>
                      </div>
                      <div class="col-12 d-flex align-items-center gap-2">
                        <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank" class="small">ver</a>
                        <input :id="`minputImg-${idx}`" type="file" class="d-none" accept="image/*"
                               @change="onImagenItemChange($event, idx)">
                        <button class="btn btn-sm btn-outline-secondary"
                                @click="() => document.getElementById(`minputImg-${idx}`)?.click()">
                          Subir imagen
                        </button>
                        <button v-if="it.imagen_url" class="btn btn-sm btn-outline-danger" @click="quitarImagenItem(idx)">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
                        <label class="form-label small mb-1">Fecha</label>
                        <!-- Mostrar como readonly: usa la real si ya existe, si no la preview -->
                        <input class="form-control form-control-sm"
                              :value="prettyTS(h.fecha || h._previewFecha)"
                              disabled>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small mb-1">Estatus</label>
                        <input class="form-control form-control-sm" v-model="h.estatus" placeholder="Estatus">
                      </div>
                      <div class="col-md-5">
                        <label class="form-label small mb-1">Usuario</label>
                        <div class="d-flex">
                          <input class="form-control form-control-sm me-2" v-model="h.usuario" placeholder="Usuario">
                          <button class="btn btn-sm btn-outline-danger" @click="eliminarHistorial(ix)">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>
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
              <input type="text" class="form-control" :value="prettyTS(new Date())" disabled>
              <div class="form-text">Se guardará automáticamente con la hora del servidor.</div>
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="nuevo.empresa" placeholder="Xtreme Servicios">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option v-for="s in ESTATUS_OPC" :key="'n-'+s">{{ s }}</option>
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
                <option v-for="r in RESPONSABLES_OPC" :key="'nr-'+r">{{ r }}</option>
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
              <div class="d-flex gap-2 flex-wrap">
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
              <div class="d-flex gap-2 flex-wrap">
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
  doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, getDocs, serverTimestamp
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
  // Firestore Timestamp
  if (v instanceof Timestamp) {
    const d = v.toDate();
    return d.toISOString().replace("T"," ").replace("Z","");
  }
  // Objeto tipo { seconds, nanoseconds }
  if (v?.seconds) {
    const d = new Date(v.seconds * 1000);
    return d.toISOString().replace("T"," ").replace("Z","");
  }
  // Date nativa
  if (v instanceof Date) {
    return v.toISOString().replace("T"," ").replace("Z","");
  }
  // FieldValue.serverTimestamp() u otro objeto
  if (typeof v === "object") {
    return "⏳ pendiente (servidor)";
  }
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
  if (hasActiveFilters.value || busquedaActiva.value) return; // sin paginar con filtros/búsqueda
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

  // ID numérico exacto
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

  // ID de documento
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

/* --------- Filtros móvil --------- */
const mobileFiltersOpen = ref(false);
const hasActiveFilters = computed(() =>
  !!filtroEstatus.value || !!filtroResponsable.value
);
const totalFiltrosActivos = computed(() => {
  let n = 0;
  if (filtroEstatus.value) n++;
  if (filtroResponsable.value) n++;
  return n;
});
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

/* ====== NUEVO: Asociación SOLPED ====== */
const cargandoSolpeds = ref(false);
const guardandoSolped = ref(false);
const solpeds = ref([]); // {id, numero_solped, estatus, tipo_solped?, centroCostoTexto?}
const solpedBusqueda = ref("");
const solpedSeleccionId = ref("");

const solpedsFiltradas = computed(() => {
  const q = solpedBusqueda.value.trim().toLowerCase();
  if (!q) return solpeds.value;
  return solpeds.value.filter(s => {
    const num = String(s.numero_solped ?? "").toLowerCase();
    const tipo = String(s.tipo_solped ?? "").toLowerCase();
    const cc = String(s.centroCostoTexto ?? "").toLowerCase();
    return num.includes(q) || tipo.includes(q) || cc.includes(q);
  });
});

async function cargarSolpedsPendientes(){
  cargandoSolpeds.value = true;
  try {
    const colRef = collection(db, "solped_taller");
    // Considera mayúsculas/minúsculas y ordena por numero_solpe
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
      // IMPORTANTE: en solped_taller es numero_solpe (sin "d")
      if (typeof x.numero_solpe === "number") {
        items.push({
          id: d.id,
          numero_solpe: x.numero_solpe,
          estatus: x.estatus ?? "",
          tipo_solped: x.tipo_solped,           // si tu colección usa "tipo_solped" o "tipo_solpe", ajústalo aquí
          centroCostoTexto: x.centroCostoTexto
        });
      }
    });
    // Orden: Parcial primero, luego por número desc
    items.sort((a,b) => {
      const ap = String(a.estatus).toLowerCase()==="parcial";
      const bp = String(b.estatus).toLowerCase()==="parcial";
      if (ap!==bp) return ap ? -1 : 1;
      return (b.numero_solpe ?? 0) - (a.numero_solpe ?? 0);
    });
    solpeds.value = items;
  } catch (e) {
    console.error("cargarSolpedsPendientes:", e);
    addToast("danger","Error cargando SOLPEDs.");
  } finally {
    cargandoSolpeds.value = false;
  }
}
// Clonador que respeta Firestore Timestamp y FieldValue
function safeCloneFirestore(x) {
  if (x === null || typeof x !== "object") return x;
  // Respeta Date y Firestore Timestamp
  if (x instanceof Date || x instanceof Timestamp) return x;
  // Respeta arreglos
  if (Array.isArray(x)) return x.map(safeCloneFirestore);
  // Clona objetos comunes SIN stringify y sin _previewFecha
  const out = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === "_previewFecha") continue; // no subir previews
    out[k] = safeCloneFirestore(v);      // mantiene serverTimestamp() tal cual
  }
  return out;
}


async function onSeleccionarSolped(){
  if (!seleccion.value) return;
  guardandoSolped.value = true;
  try {
    const sel = solpeds.value.find(s => s.id === solpedSeleccionId.value);
    const dref = doc(db, "ordenes_oc_taller", seleccion.value.__id);

    if (!sel) {
      guardandoSolped.value = false;
      return;
    }

    // Guardamos en la OC: numero_solped (con "d") tomando el numero_solpe de la SOLPED
    await updateDoc(dref, {
      solpedId: sel.id,
      numero_solped: sel.numero_solpe
    });

    // Reflejar en UI local
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
    const dref = doc(db, "ordenes_oc_taller", seleccion.value.__id);
    await updateDoc(dref, {
      solpedId: null,
      numero_solped: null
    });
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
/* ====== FIN Asociación SOLPED ====== */

function abrirEditor(row){
  // Guarda la fila seleccionada (incluye __id)
  seleccion.value = row;

  // Clona y normaliza el objeto de edición
  const base = deepClone({
    aprobadoPor: row.aprobadoPor ?? "",
    aprobadorSugerido: row.aprobadorSugerido ?? "",
    archivoOC: row.archivoOC ?? null,
    archivosStorage: Array.isArray(row.archivosStorage) ? deepClone(row.archivosStorage) : [],
    centroCostoTexto: row.centroCostoTexto ?? "",
    comentario: row.comentario ?? "",
    destinoCompra: row.destinoCompra ?? "",
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
    numero_solped: row.numero_solped ?? null,
    solpedId: row.solpedId ?? null,
    items: Array.isArray(row.items) ? deepClone(row.items) : []
  });

  // --- Limpieza del historial ---
  // Si la fecha ya es un Timestamp real (o {seconds,...}), eliminamos cualquier _previewFecha
  base.historial = (base.historial || []).map(h => {
    const hh = { ...h };
    const hasRealTs =
      (typeof hh.fecha?.toDate === "function") || // Timestamp de Firestore
      (hh.fecha && typeof hh.fecha.seconds === "number"); // {seconds, nanoseconds}
    if (hasRealTs && "_previewFecha" in hh) {
      delete hh._previewFecha;
    }
    return hh;
  });

  edit.value = base;

  // Inputs datetime-local
  fechaSubidaLocal.value = toLocalInputValue(edit.value.fechaSubida);
  fechaAprobacionLocal.value = toLocalInputValue(edit.value.fechaAprobacion);

  // Abre el panel de edición
  editorAbierto.value = true;

  // Resetea inputs de archivos
  const a = document.getElementById("inputArchivoOC"); if (a) a.value = "";
  const b = document.getElementById("inputArchivosStorage"); if (b) b.value = "";
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];

  // Cargar SOLPEDs y prefijar selección si ya tiene
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
  // limpiar selecciones solped
  solpeds.value = [];
  solpedBusqueda.value = "";
  solpedSeleccionId.value = "";
}

/* Sincroniza datetime-local -> Timestamp */
watch(fechaSubidaLocal, (val) => {
  const d = fromLocalInputValue(val);
  edit.value.fechaSubida = d ? Timestamp.fromDate(d) : null;
});

watch(fechaAprobacionLocal, (val) => {
  const d = fromLocalInputValue(val);
  edit.value.fechaAprobacion = d ? Timestamp.fromDate(d) : null;
});

/* ---------- Ítems (en línea) ---------- */
function agregarItemInline(){
  const arr = edit.value.items || (edit.value.items = []);
  const maxIt = arr.reduce((m, a) => Math.max(m, Number(a?.item ?? 0)), 0);
  arr.push({
    item: maxIt + 1,
    descripcion: "",
    cantidad: 0,
    cantidad_cotizada: 0,
    codigo_referencial: "",
    estado: "pendiente",
    numero_interno: "",
    imagen_url: null
  });
}
function eliminarItemInline(ix){
  (edit.value.items || []).splice(ix, 1);
}
async function onImagenItemChange(ev, idx){
  try {
    const f = (ev.target.files || [])[0];
    if (!f || !seleccion.value) return;
    const storage = getStorage();
    const idDoc = seleccion.value.__id;
    const path = `ordenes_oc_taller/${idDoc}/items/${Date.now()}_${f.name}`;
    const sRef = sref(storage, path);
    const up = await uploadBytes(sRef, f);
    const url = await getDownloadURL(up.ref);
    edit.value.items[idx].imagen_url = url;
    addToast("success", "Imagen subida.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo subir la imagen del ítem.");
  } finally {
    const el = ev?.target; if (el) el.value = "";
  }
}
function quitarImagenItem(idx){
  if (!edit.value?.items?.[idx]) return;
  edit.value.items[idx].imagen_url = null;
}

/* ---------- Guardar Edición ---------- */
async function guardarEdicion() {
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const idDoc = seleccion.value.__id;
    const dref = doc(db, "ordenes_oc_taller", idDoc);

    // 1) Reemplazar archivo OC si corresponde (fecha del archivo en server)
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
        fechaSubida: serverTimestamp()     // ← queda como Timestamp real
      };
      archivoOCFile.value = null;
    }

    // 2) Preparar payload SIN perder tipos de Firestore
    const payload = safeCloneFirestore(edit.value);

    // NUNCA tocar fechaSubida original
    delete payload.fechaSubida;

    // 3) Guardar
    await updateDoc(dref, payload);

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
    fecha: serverTimestamp(),        // se guardará en Firestore
    _previewFecha: new Date(),       // solo para mostrar mientras tanto
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
    destinoCompra: "",
    centroCostoTexto: "",
    responsable: "",
    aprobadoPor: "",
    aprobadorSugerido: "",
    tipoCompra: "stock",
    tipo_solped: "Sin SOLPED",
    numero_solped: "",
    moneda: "CLP",
    precioTotalConIVA: 0,
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

    const payload = deepClone(nuevo.value);
    payload.archivoOC = null;
    payload.archivosStorage = [];

    // Fecha subida automática del servidor
    payload.fechaSubida = serverTimestamp();  // ← aquí
    payload.fechaAprobacion = null;

    const dref = await addDoc(collection(db, "ordenes_oc_taller"), payload);

    // archivoOC inicial (con fecha del servidor)
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
          fechaSubida: serverTimestamp()  // ← aquí
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
  --oc-top-gap: 8px;
  --oc-radius: 14px;
  --oc-maxw: 640px;
}

/* Helpers responsivos */
.h4-md { font-size: 1.25rem; }
@media (min-width: 768px){ .h4-md { font-size: 1.5rem; } }

.minw-220{ min-width: 220px; }
.minw-240{ min-width: 240px; }
.minw-280{ min-width: 280px; }

/* Truncados bonitos en tabla */
.text-truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 576px){
  .text-truncate { max-width: 180px; }
}

/* -------- Offcanvas lateral (filtros/editor) -------- */
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

/* Modal genérico */
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

/* Icono modal eliminación */
.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}
</style>
