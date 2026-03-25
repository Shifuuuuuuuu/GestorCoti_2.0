<!-- src/views/AdminOCTaller.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>

    <div class="container py-4 py-md-5 position-relative">
      <!-- HERO -->
      <section class="hero-card mb-4">
        <div class="hero-pattern"></div>

        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap position-relative">
          <div>
            <div class="hero-badge mb-2">
              <i class="bi bi-tools me-2"></i>
              Gestión de taller
            </div>
            <h1 class="hero-title mb-1">Admin · Órdenes OC (Taller)</h1>
            <p class="hero-subtitle mb-0">
              Administra órdenes de compra de taller, filtra por responsable o estatus, edita ítems, archivos y asociaciones con SOLPED desde una vista más limpia y profesional.
            </p>
          </div>

          <div class="hero-actions d-flex align-items-stretch gap-2 flex-wrap w-100 w-xl-auto ms-xl-3">
            <div class="search-shell minw-320">
              <i class="bi bi-search search-icon"></i>
              <input
                class="search-input"
                placeholder="ID doc o ID (número)"
                v-model="buscarTexto"
                @keyup.enter="onBuscar"
              />
              <button class="search-clear" @click="onBuscar" title="Buscar" type="button">
                <i class="bi bi-search"></i>
              </button>
            </div>

            <button class="btn btn-soft-primary btn-toolbar" @click="mobileFiltersOpen = true">
              <i class="bi bi-funnel me-1"></i> Filtros
              <span
                v-if="hasActiveFilters"
                class="badge rounded-pill bg-primary-subtle text-primary-emphasis ms-2"
              >
                {{ totalFiltrosActivos }}
              </span>
            </button>

            <button class="btn btn-brand btn-toolbar" @click="abrirModalNueva">
              <i class="bi bi-plus-lg me-1"></i> Nueva OC (Taller)
            </button>
          </div>
        </div>
      </section>

      <!-- FILTROS ACTIVOS -->
      <div
        v-if="hasActiveFilters || busquedaActiva"
        class="active-filters mb-3"
      >
        <small class="text-secondary fw-semibold">Filtros activos:</small>

        <span v-if="filtroEstatus" class="chip chip-slate">
          Estatus: {{ filtroEstatus }}
          <button class="chip-x" @click="filtroEstatus=''; aplicarFiltros()">×</button>
        </span>

        <span v-if="filtroResponsable" class="chip chip-slate">
          Responsable: {{ filtroResponsable }}
          <button class="chip-x" @click="filtroResponsable=''; aplicarFiltros()">×</button>
        </span>

        <span v-if="busquedaActiva" class="chip chip-cyan">
          Búsqueda aplicada
          <button class="chip-x" @click="limpiarBusqueda()">×</button>
        </span>

        <button
          class="btn btn-link btn-sm ps-0"
          @click="limpiarFiltros"
        >
          Limpiar todo
        </button>
      </div>

      <!-- LISTADO -->
      <div class="card main-shell">
        <div class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="busquedaActiva || hasActiveFilters" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>

          <div class="d-flex d-md-none gap-2">
            <div class="input-group input-group-sm search-mini">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                class="form-control"
                placeholder="ID doc o ID"
                v-model="buscarTexto"
                @keyup.enter="onBuscar"
              />
              <button class="btn btn-outline-secondary" @click="onBuscar">Buscar</button>
            </div>
            <button
              v-if="busquedaActiva"
              class="btn btn-sm btn-outline-danger"
              @click="limpiarBusqueda"
              title="Limpiar"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- TABLA DESKTOP -->
        <div class="table-responsive d-none d-md-block">
          <table class="table oc-table align-middle mb-0">
            <thead class="table-head-pro">
              <tr>
                <th style="width:110px;">ID</th>
                <th>Centro Costo</th>
                <th style="width:180px;">Responsable</th>
                <th style="width:160px;">Estado</th>
                <th style="width:220px;">Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="cargando">
                <td colspan="7" class="text-center py-5">
                  <div class="loading-wrap">
                    <div class="spinner-border" role="status"></div>
                    <div class="small text-secondary mt-3">Cargando…</div>
                  </div>
                </td>
              </tr>

              <tr v-else-if="rows.length === 0">
                <td colspan="7" class="text-center py-5">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="bi bi-inbox"></i>
                    </div>
                    <div class="empty-title">Sin resultados</div>
                    <div class="empty-text">
                      Ajusta la búsqueda o los filtros para volver a ver registros.
                    </div>
                  </div>
                </td>
              </tr>

              <tr v-else v-for="r in rows" :key="r.__id">
                <td class="fw-semibold">
                  <div class="row-index">#{{ r.id ?? '—' }}</div>
                </td>

                <td>
                  <div class="provider-main min-w-0">
                    <div class="provider-avatar">
                      <i class="bi bi-building"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="provider-name text-truncate">{{ r.centroCostoTexto || '—' }}</div>
                      <div class="provider-address text-truncate d-md-none">
                        <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                      </div>
                    </div>
                  </div>
                </td>

                <td>{{ r.responsable || '—' }}</td>

                <td>
                  <span class="badge status-badge" :class="badgeClass(r.estatus)">
                    {{ r.estatus || '—' }}
                  </span>
                </td>

                <td>
                  <div class="d-none d-sm-inline-flex action-group">
                    <button class="btn action-btn action-edit" title="Editar" @click="abrirEditor(r)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn action-btn action-delete" title="Eliminar" @click="abrirConfirm(r)">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>

                  <div class="dropdown d-inline d-sm-none">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" type="button">
                      Acciones
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li>
                        <button class="dropdown-item" @click="abrirEditor(r)">
                          <i class="bi bi-pencil-square me-2"></i>Editar
                        </button>
                      </li>
                      <li>
                        <button class="dropdown-item" @click="verArchivoOC(r)">
                          <i class="bi bi-file-earmark-pdf me-2"></i>Ver archivo
                        </button>
                      </li>
                      <li><hr class="dropdown-divider" /></li>
                      <li>
                        <button class="dropdown-item text-danger" @click="abrirConfirm(r)">
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

        <!-- MOBILE -->
        <div class="d-block d-md-none mobile-cards">
          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border" role="status"></div>
            <div class="small text-secondary mt-2">Cargando…</div>
          </div>

          <div v-else-if="rows.length === 0" class="text-center py-4 text-secondary">
            Sin resultados.
          </div>

          <div v-else class="mobile-grid">
            <article v-for="r in rows" :key="r.__id" class="oc-mobile-card">
              <div class="mobile-card-top">
                <div>
                  <div class="provider-name">#{{ r.id ?? '—' }}</div>
                  <div class="provider-address">
                    <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                  </div>
                </div>
                <span class="badge status-badge mt-1" :class="badgeClass(r.estatus)">
                  {{ r.estatus || '—' }}
                </span>
              </div>

              <div class="mobile-card-body">
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Centro costo</span>
                  <span class="mobile-info-value text-truncate">{{ r.centroCostoTexto || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Empresa</span>
                  <span class="mobile-info-value text-truncate">{{ r.empresa || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Responsable</span>
                  <span class="mobile-info-value text-truncate">{{ r.responsable || '—' }}</span>
                </div>
              </div>

              <div class="mobile-card-actions">
                <button class="btn btn-soft-primary flex-fill" @click="abrirEditor(r)">
                  <i class="bi bi-pencil-square me-1"></i> Editar
                </button>
                <button class="btn btn-soft-secondary flex-fill" @click="verArchivoOC(r)">
                  <i class="bi bi-file-earmark-pdf me-1"></i> Archivo
                </button>
                <button class="btn btn-soft-danger" @click="abrirConfirm(r)">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </article>
          </div>
        </div>

        <!-- PAGINACIÓN -->
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

      <!-- TOASTS -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i
            class="me-2"
            :class="t.type==='success'
              ? 'bi bi-check-circle-fill'
              : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"
          ></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel offcanvas-panel-sm">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Opciones</div>
            <div class="fw-bold fs-5"><i class="bi bi-funnel me-2"></i>Filtros · Órdenes OC Taller</div>
          </div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body">
          <div class="form-block">
            <div class="row g-3">
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
                    title="Limpiar"
                  >
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
        </div>

        <div class="offcanvas-footer d-flex justify-content-between">
          <button class="btn btn-soft-secondary" @click="limpiarFiltros">Limpiar todo</button>
          <button class="btn btn-brand" @click="mobileApplyFilters">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- EDITOR -->
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Editar registro</div>
            <div class="fw-bold fs-5 text-truncate">Editar Orden OC (Taller)</div>
          </div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-6 col-md-2">
                <label class="form-label">ID</label>
                <input class="form-control" v-model.number="edit.id" type="number" min="0" />
              </div>

              <div class="col-12 col-md-5">
                <label class="form-label">Fecha subida</label>
                <input type="text" class="form-control" :value="prettyTS(edit.fechaSubida)" disabled />
              </div>

              <div class="col-12 col-md-5">
                <label class="form-label">Fecha aprobación</label>
                <input type="datetime-local" class="form-control" v-model="fechaAprobacionLocal" />
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label">Empresa</label>
                <input class="form-control" v-model="edit.empresa" placeholder="Xtreme Servicios" />
              </div>

              <div class="col-6 col-md-4">
                <label class="form-label">Estatus</label>
                <select class="form-select" v-model="edit.estatus">
                  <option v-for="s in ESTATUS_OPC" :key="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Centro Costo (texto)</label>
                <input class="form-control" v-model="edit.centroCostoTexto" placeholder="THPV-31" />
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
                <input class="form-control" v-model="edit.aprobadorSugerido" placeholder="Juan Cubillos" />
              </div>

              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Asociar SOLPED (Pendiente / Parcial)</div>
                  <div>
                    <span v-if="edit.solpedId" class="badge bg-primary me-2">
                      Asociada: #{{ edit.numero_solped }}
                    </span>
                    <button
                      v-if="edit.solpedId"
                      class="btn btn-sm btn-soft-danger"
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
                        #{{ s.numero_solpe }} · {{ s.tipo_solped ?? 'SIN TIPO' }} · {{ s.centroCostoTexto ?? 's/CC' }} ·
                        {{ s.estatus }}
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
                  <span v-else-if="!solpedsFiltradas.length" class="text-secondary">
                    No hay SOLPEDs pendientes/parciales para mostrar.
                  </span>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Tipo SOLPED</label>
                <input class="form-control" v-model="edit.tipo_solped" placeholder="Sin SOLPED / REPUESTOS / ..." />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Tipo compra</label>
                <input class="form-control" v-model="edit.tipoCompra" placeholder="stock / emergencia / ..." />
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label">Moneda</label>
                <input class="form-control" v-model="edit.moneda" placeholder="CLP" />
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label">Total c/ IVA</label>
                <input class="form-control" v-model.number="edit.precioTotalConIVA" type="number" min="0" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Destino compra</label>
                <input class="form-control" v-model="edit.destinoCompra" placeholder="" />
              </div>

              <div class="col-12">
                <label class="form-label">Comentario</label>
                <textarea class="form-control" rows="2" v-model="edit.comentario" placeholder="Notas / observaciones"></textarea>
              </div>

              <!-- ARCHIVO OC -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Archivo OC (único)</div>
                  <div class="d-flex gap-2 flex-wrap">
                    <input
                      ref="inputArchivoOCEl"
                      type="file"
                      class="d-none"
                      accept="application/pdf,image/*"
                      @change="onArchivoOCEdit"
                    />
                    <button class="btn btn-soft-secondary" @click="openArchivoOCEdit">
                      <i class="bi bi-paperclip me-1"></i> Seleccionar archivo OC
                    </button>
                    <button class="btn btn-sm btn-soft-danger" v-if="edit.archivoOC?.url" @click="borrarArchivoOC">
                      <i class="bi bi-trash3 me-1"></i> Quitar archivo OC
                    </button>
                  </div>
                </div>

                <div class="list-group pro-list-group">
                  <div class="list-group-item" v-if="edit.archivoOC?.url">
                    <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                      <div class="small">
                        <i class="bi bi-file-earmark-text me-2"></i>
                        <strong>{{ edit.archivoOC?.nombre }}</strong>
                        <span class="text-secondary ms-2">{{ edit.archivoOC?.tipo }}</span>
                        <span class="text-secondary ms-2">{{ prettyTS(edit.archivoOC?.fechaSubida) }}</span>
                      </div>
                      <a class="btn btn-sm btn-soft-secondary" :href="edit.archivoOC?.url" target="_blank">Ver</a>
                    </div>
                  </div>
                  <div v-else class="list-group-item text-secondary small">Sin archivo OC.</div>

                  <div v-if="archivoOCFile" class="list-group-item small">
                    <span class="text-secondary">Nuevo archivo:</span> <strong>{{ archivoOCFile.name }}</strong>
                  </div>
                </div>
              </div>

              <!-- STORAGE -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Archivos en Storage</div>
                  <div class="d-flex gap-2 flex-wrap">
                    <input
                      ref="inputArchivosStorageEl"
                      type="file"
                      class="d-none"
                      multiple
                      accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      @change="onArchivosStorage"
                    />
                    <button class="btn btn-sm btn-soft-secondary" @click="openArchivosStorageEdit">
                      <i class="bi bi-cloud-upload me-1"></i> Agregar archivos
                    </button>
                  </div>
                </div>

                <div class="list-group pro-list-group">
                  <div
                    class="list-group-item d-flex align-items-center justify-content-between gap-2"
                    v-for="(a, ai) in edit.archivosStorage"
                    :key="'st'+ai"
                  >
                    <div class="small">
                      <i class="bi bi-file-earmark me-2"></i>
                      <strong>{{ a.nombre }}</strong>
                      <span class="text-secondary ms-2">{{ a.tipo || 'archivo' }}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <a class="btn btn-sm btn-soft-secondary" :href="a.url" target="_blank">Ver</a>
                      <button class="btn btn-sm btn-soft-danger" @click="eliminarArchivoStorage(ai)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="!edit.archivosStorage?.length" class="list-group-item text-secondary small">Sin archivos.</div>

                  <div v-if="nuevosStorageFiles.length" class="list-group-item small">
                    <div class="text-secondary mb-1">Listos para subir:</div>
                    <ul class="mb-0">
                      <li v-for="(f,i) in nuevosStorageFiles" :key="'nf'+i">{{ f.name }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- ÍTEMS -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Ítems</div>
                  <button class="btn btn-sm btn-soft-primary" @click="agregarItemInline">
                    <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                  </button>
                </div>

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
                        <td><input class="form-control form-control-sm" v-model.number="it.item" type="number" min="1" /></td>
                        <td>
                          <input class="form-control form-control-sm" v-model="it.descripcion" placeholder="Descripción" />
                          <input class="form-control form-control-sm mt-1" v-model="it.numero_interno" placeholder="N° interno (opcional)" />
                        </td>
                        <td><input class="form-control form-control-sm" v-model.number="it.cantidad" type="number" min="0" /></td>
                        <td><input class="form-control form-control-sm" v-model.number="it.cantidad_cotizada" type="number" min="0" /></td>
                        <td><input class="form-control form-control-sm" v-model="it.codigo_referencial" placeholder="Código" /></td>
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
                            <input :id="`inputImg-${idx}`" type="file" class="d-none" accept="image/*" @change="onImagenItemChange($event, idx)" />
                            <button class="btn btn-sm btn-outline-secondary" @click="() => document.getElementById(`inputImg-${idx}`)?.click()">
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

                <div class="d-block d-sm-none">
                  <div v-if="!edit.items?.length" class="text-center text-secondary py-2">Sin ítems.</div>
                  <div class="list-group list-group-flush">
                    <div v-for="(it, idx) in edit.items" :key="'m-'+idx" class="list-group-item mobile-item-card">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="fw-semibold">Ítem</div>
                        <button class="btn btn-sm btn-outline-danger" @click="eliminarItemInline(idx)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                      <div class="row g-2 mt-1">
                        <div class="col-4">
                          <input class="form-control form-control-sm" v-model.number="it.item" type="number" min="1" placeholder="#" />
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
                          <input class="form-control form-control-sm" v-model="it.descripcion" placeholder="Descripción" />
                        </div>
                        <div class="col-12">
                          <input class="form-control form-control-sm" v-model="it.numero_interno" placeholder="N° interno" />
                        </div>
                        <div class="col-6">
                          <input class="form-control form-control-sm" v-model.number="it.cantidad" type="number" min="0" placeholder="Cant." />
                        </div>
                        <div class="col-6">
                          <input class="form-control form-control-sm" v-model.number="it.cantidad_cotizada" type="number" min="0" placeholder="Cotizada" />
                        </div>
                        <div class="col-12">
                          <input class="form-control form-control-sm" v-model="it.codigo_referencial" placeholder="Código ref." />
                        </div>
                        <div class="col-12 d-flex align-items-center gap-2">
                          <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank" class="small">ver</a>
                          <input :id="`minputImg-${idx}`" type="file" class="d-none" accept="image/*" @change="onImagenItemChange($event, idx)" />
                          <button class="btn btn-sm btn-outline-secondary" @click="() => document.getElementById(`minputImg-${idx}`)?.click()">
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

              <!-- HISTORIAL -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Historial</div>
                  <button class="btn btn-sm btn-soft-primary" @click="agregarHistorial">
                    <i class="bi bi-plus-lg me-1"></i> Agregar
                  </button>
                </div>

                <div class="list-group pro-list-group">
                  <div class="list-group-item" v-for="(h, ix) in edit.historial" :key="'h'+ix">
                    <div class="row g-2 align-items-center">
                      <div class="col-md-3">
                        <label class="form-label small mb-1">Fecha</label>
                        <input class="form-control form-control-sm" :value="prettyTS(h.fecha || h._previewFecha)" disabled />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small mb-1">Estatus</label>
                        <input class="form-control form-control-sm" v-model="h.estatus" placeholder="Estatus" />
                      </div>
                      <div class="col-md-5">
                        <label class="form-label small mb-1">Usuario</label>
                        <div class="d-flex">
                          <input class="form-control form-control-sm me-2" v-model="h.usuario" placeholder="Usuario" />
                          <button class="btn btn-sm btn-soft-danger" @click="eliminarHistorial(ix)">
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
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-end gap-2 flex-wrap">
            <button class="btn btn-soft-secondary" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-brand" :disabled="guardando || guardandoSolped" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- NUEVA -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">Crear registro</div>
            <h5 class="mb-0 fw-bold">Nueva Orden OC (Taller)</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-6 col-md-3">
                <label class="form-label">ID</label>
                <input class="form-control" v-model.number="nuevo.id" type="number" min="0" />
              </div>

              <div class="col-6 col-md-5">
                <label class="form-label">Fecha subida</label>
                <input type="text" class="form-control" :value="prettyTS(new Date())" disabled />
                <div class="form-text">Se guardará automáticamente con la hora del servidor.</div>
              </div>

              <div class="col-6 col-md-4">
                <label class="form-label">Empresa</label>
                <input class="form-control" v-model="nuevo.empresa" placeholder="Xtreme Servicios" />
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label">Estatus</label>
                <select class="form-select" v-model="nuevo.estatus">
                  <option v-for="s in ESTATUS_OPC" :key="'n-'+s">{{ s }}</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Centro Costo (texto)</label>
                <input class="form-control" v-model="nuevo.centroCostoTexto" placeholder="THPV-31" />
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
                <input class="form-control" v-model="nuevo.aprobadoPor" />
              </div>

              <div class="col-md-6">
                <label class="form-label">Aprobador sugerido</label>
                <input class="form-control" v-model="nuevo.aprobadorSugerido" />
              </div>

              <div class="col-md-6">
                <label class="form-label">Tipo SOLPED</label>
                <input class="form-control" v-model="nuevo.tipo_solped" placeholder="REPUESTOS / Sin SOLPED" />
              </div>

              <div class="col-md-6">
                <label class="form-label">Número SOLPED (asociar)</label>
                <input class="form-control" v-model="nuevo.numero_solped" placeholder="18" />
              </div>

              <div class="col-md-3">
                <label class="form-label">Moneda</label>
                <input class="form-control" v-model="nuevo.moneda" placeholder="CLP" />
              </div>

              <div class="col-md-3">
                <label class="form-label">Total c/ IVA</label>
                <input class="form-control" v-model.number="nuevo.precioTotalConIVA" type="number" min="0" />
              </div>

              <div class="col-12">
                <label class="form-label">Comentario</label>
                <textarea class="form-control" rows="2" v-model="nuevo.comentario"></textarea>
              </div>

              <div class="col-12">
                <label class="form-label">Archivo OC (PDF/imagen)</label>
                <div class="d-flex gap-2 flex-wrap align-items-center">
                  <input
                    ref="inputArchivoOCNuevoEl"
                    type="file"
                    class="d-none"
                    accept="application/pdf,image/*"
                    @change="onArchivoOCNuevo"
                  />
                  <button class="btn btn-soft-secondary" @click="openArchivoOCNuevo">
                    <i class="bi bi-paperclip me-1"></i> Seleccionar archivo OC
                  </button>
                  <div class="small text-secondary" v-if="archivoOCNuevoNombre">
                    Seleccionado: <strong>{{ archivoOCNuevoNombre }}</strong>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label">Archivos Storage (múltiples)</label>
                <div class="d-flex gap-2 flex-wrap align-items-center">
                  <input
                    ref="inputArchivosStorageNuevoEl"
                    type="file"
                    class="d-none"
                    multiple
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosStorageNuevo"
                  />
                  <button class="btn btn-soft-secondary" @click="openArchivosStorageNuevo">
                    <i class="bi bi-cloud-upload me-1"></i> Seleccionar archivos
                  </button>
                  <div class="small text-secondary" v-if="previewArchivosStorageNuevo.length">
                    {{ previewArchivosStorageNuevo.length }} archivo(s) listo(s).
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="vmodal-footer">
          <button class="btn btn-soft-secondary" @click="cerrarModalNueva">Cancelar</button>
          <button class="btn btn-brand" :disabled="creando" @click="crearNueva">
            <span v-if="creando" class="spinner-border spinner-border-sm me-2"></span>
            Crear
          </button>
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
            ¿Seguro que quieres eliminar la Orden OC (Taller)
            <strong>#{{ confirmRow?.id ?? '—' }}</strong>?
          </p>

          <div class="confirm-box">
            <div class="confirm-row">
              <span>Empresa</span>
              <strong>{{ confirmRow?.empresa || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Centro costo</span>
              <strong>{{ confirmRow?.centroCostoTexto || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Responsable</span>
              <strong>{{ confirmRow?.responsable || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Fecha subida</span>
              <strong>{{ prettyTS(confirmRow?.fechaSubida) }}</strong>
            </div>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarConfirm" :disabled="eliminando">Cancelar</button>
          <button class="btn btn-danger btn-delete-strong" @click="confirmarEliminar" :disabled="eliminando">
            <span v-if="eliminando" class="spinner-border spinner-border-sm me-2"></span>
            Eliminar
          </button>
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

const PAGE_SIZE = 20;
const ESTATUS_OPC = [
  "Aprobado","Rechazado","Preaprobado","Casi Aprobado","Pendiente de Aprobación","Enviada a proveedor","Revisión Guillermo"
];
const RESPONSABLES_OPC = [
  "Cindy Quiroga","Guillermo Manzor","María José Ballesteros"
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
  if (v instanceof Timestamp) {
    const d = v.toDate();
    return d.toISOString().replace("T"," ").replace("Z","");
  }
  if (v?.seconds) {
    const d = new Date(v.seconds * 1000);
    return d.toISOString().replace("T"," ").replace("Z","");
  }
  if (v instanceof Date) {
    return v.toISOString().replace("T"," ").replace("Z","");
  }
  if (typeof v === "object") return "⏳ pendiente (servidor)";
  if (typeof v === "string") return v.replace("T"," ").replace("Z","");
  return String(v);
};

const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons/2));
  for (let i=0; i<maxButtons; i++) pages.push(start+i);
  return pages;
});

function buildBaseQuery(page, withFilters = true){
  const colRef = collection(db, "ordenes_oc_taller");
  let clauses = [ orderBy("id", "desc") ];
  if (withFilters) {
    if (filtroEstatus.value) clauses.unshift(where("estatus", "==", filtroEstatus.value));
    if (filtroResponsable.value) clauses.unshift(where("responsable", "==", filtroResponsable.value));
  }

  if (page === 1) {
    clauses.push(limit(PAGE_SIZE + 1));
    return query(colRef, ...clauses);
  }

  const prevCursor = pageCursors.value[page-2];
  if (!prevCursor) return null;
  clauses.splice(clauses.findIndex(c => c.type === "orderBy") + 1, 0, startAfter(prevCursor));
  clauses.push(limit(PAGE_SIZE + 1));
  return query(colRef, ...clauses);
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
    cargando.value = true; busquedaActiva.value = true;

    const colRef = collection(db, "ordenes_oc_taller");
    const clauses = [ where("id", "==", num), orderBy("id", "desc"), limit(10) ];
    if (filtroEstatus.value) clauses.unshift(where("estatus","==",filtroEstatus.value));
    if (filtroResponsable.value) clauses.unshift(where("responsable","==",filtroResponsable.value));
    const qy = query(colRef, ...clauses);

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
const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);
const fechaAprobacionLocal = ref("");
const inputArchivoOCEl = ref(null);
const inputArchivosStorageEl = ref(null);
const inputArchivoOCNuevoEl = ref(null);
const inputArchivosStorageNuevoEl = ref(null);

function triggerFile(refEl){
  if (!refEl?.value) return;
  refEl.value.value = "";
  refEl.value.click();
}
function openArchivoOCEdit(){ triggerFile(inputArchivoOCEl); }
function openArchivosStorageEdit(){ triggerFile(inputArchivosStorageEl); }
function openArchivoOCNuevo(){ triggerFile(inputArchivoOCNuevoEl); }
function openArchivosStorageNuevo(){ triggerFile(inputArchivosStorageNuevoEl); }
const archivoOCFile = ref(null);
function onArchivoOCEdit(e){
  const f = (e.target.files || [])[0];
  archivoOCFile.value = f || null;
}
function borrarArchivoOC(){ edit.value.archivoOC = null; }
const nuevosStorageFiles = ref([]);
function onArchivosStorage(e){
  nuevosStorageFiles.value = Array.from(e.target.files || []);
}
function eliminarArchivoStorage(ix){
  if (!Array.isArray(edit.value.archivosStorage)) edit.value.archivosStorage = [];
  edit.value.archivosStorage.splice(ix, 1);
}

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
    const cc = String(s.centroCostoTexto ?? "").toLowerCase();
    return num.includes(q) || tipo.includes(q) || cc.includes(q);
  });
});

async function cargarSolpedsPendientes(){
  cargandoSolpeds.value = true;
  try {
    const colRef = collection(db, "solped_taller");
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
    console.error("cargarSolpedsPendientes:", e);
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
    const dref = doc(db, "ordenes_oc_taller", seleccion.value.__id);
    await updateDoc(dref, { solpedId: sel.id, numero_solped: sel.numero_solpe });

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

function safeCloneFirestore(x){
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

function abrirEditor(row){
  seleccion.value = row;

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

  base.historial = (base.historial || []).map(h => {
    const hh = { ...h };
    const hasRealTs =
      (typeof hh.fecha?.toDate === "function") ||
      (hh.fecha && typeof hh.fecha.seconds === "number");
    if (hasRealTs && "_previewFecha" in hh) delete hh._previewFecha;
    return hh;
  });

  edit.value = base;

  fechaAprobacionLocal.value = toLocalInputValue(edit.value.fechaAprobacion);

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

watch(fechaAprobacionLocal, (val) => {
  const d = fromLocalInputValue(val);
  edit.value.fechaAprobacion = d ? Timestamp.fromDate(d) : null;
});

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
function eliminarItemInline(ix){ (edit.value.items || []).splice(ix, 1); }

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
    if (ev?.target) ev.target.value = "";
  }
}
function quitarImagenItem(idx){
  if (!edit.value?.items?.[idx]) return;
  edit.value.items[idx].imagen_url = null;
}

async function guardarEdicion(){
  if (!seleccion.value) return;
  guardando.value = true;

  try {
    const idDoc = seleccion.value.__id;
    const dref = doc(db, "ordenes_oc_taller", idDoc);
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
        fechaSubida: serverTimestamp()
      };
      archivoOCFile.value = null;
    }

    if (nuevosStorageFiles.value.length) {
      const storage = getStorage();
      const uploads = [];
      for (const f of nuevosStorageFiles.value) {
        const path = `ordenes_oc_taller/${idDoc}/${Date.now()}_${f.name}`;
        const sRef = sref(storage, path);
        const up = await uploadBytes(sRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({ nombre: f.name, tipo: f.type || "application/octet-stream", url });
      }
      edit.value.archivosStorage = [...(edit.value.archivosStorage || []), ...uploads];
      nuevosStorageFiles.value = [];
    }
    const payload = safeCloneFirestore(edit.value);
    delete payload.fechaSubida;

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

const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});
const archivoOCNuevo = ref(null);
const archivoOCNuevoNombre = ref("");
const previewArchivosStorageNuevo = ref([]);

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

    const payload = deepClone(nuevo.value);
    payload.archivoOC = null;
    payload.archivosStorage = [];
    payload.fechaSubida = serverTimestamp();
    payload.fechaAprobacion = null;

    const dref = await addDoc(collection(db, "ordenes_oc_taller"), payload);
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
          fechaSubida: serverTimestamp()
        }
      });
    }

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

function verArchivoOC(row){
  const url = row?.archivoOC?.url;
  if (!url) { addToast("warning", "Esta OC Taller no tiene archivoOC aún."); return; }
  window.open(url, "_blank");
}

onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => {
  if (unsubList) unsubList();
  if (unsubSearch) unsubSearch();
});
</script>

<style scoped>
:root {
  color-scheme: light;
}


.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88));
  border: 1px solid rgba(255,255,255,0.75);
  box-shadow:
    0 20px 60px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.70);
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
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.60);
  overflow: hidden;
}

.search-shell:focus-within {
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.60);
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

.search-mini .form-control,
.search-mini .input-group-text,
.search-mini .btn {
  border-radius: 12px;
}

.minw-320 {
  min-width: 320px;
}

.active-filters {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 34px;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.chip-slate {
  color: #334155;
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.18);
}

.chip-cyan {
  color: #0f766e;
  background: rgba(6, 182, 212, 0.10);
  border-color: rgba(6, 182, 212, 0.14);
}

.chip-x {
  margin-left: 0.25rem;
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
}

.main-shell,
.card {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.76);
  box-shadow:
    0 22px 60px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.2rem 1.3rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.74));
}

.card-header .fw-semibold {
  font-size: 1.05rem;
  font-weight: 800 !important;
  color: #0f172a;
}

.oc-table,
.table {
  --bs-table-bg: transparent;
  --bs-table-striped-bg: rgba(248, 250, 252, 0.72);
  --bs-table-hover-bg: rgba(37, 99, 235, 0.035);
  margin: 0;
}

.table-head-pro th,
.table-light th,
.table thead th {
  background: rgba(248, 250, 252, 0.92) !important;
  color: #475569 !important;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16) !important;
  padding: 1rem 1rem;
  white-space: nowrap;
}

.table tbody td {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: #1e293b;
  vertical-align: middle;
}

.table tbody tr {
  transition: background 0.2s ease, transform 0.2s ease;
}

.table tbody tr:hover {
  background: rgba(37, 99, 235, 0.02);
}

.row-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  min-height: 38px;
  padding: 0.45rem 0.7rem;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
  font-weight: 800;
}

.provider-main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.provider-avatar {
  width: 44px;
  height: 44px;
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

.status-badge,
.badge {
  border-radius: 999px;
  padding: 0.52rem 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.action-group,
.btn-group {
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

.action-edit,
.btn-outline-primary {
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.16);
}

.action-edit:hover,
.btn-outline-primary:hover {
  background: rgba(37, 99, 235, 0.16);
  color: #1e40af;
  border-color: rgba(37, 99, 235, 0.20);
}

.action-delete,
.btn-outline-danger {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.16);
}

.action-delete:hover,
.btn-outline-danger:hover {
  background: rgba(220, 38, 38, 0.13);
  color: #b91c1c;
  border-color: rgba(220, 38, 38, 0.22);
}

.mobile-cards {
  padding: 1rem;
}

.mobile-grid {
  display: grid;
  gap: 0.95rem;
}

.oc-mobile-card,
.list-group-item,
.mobile-item-card {
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

.card-footer {
  background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.74));
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  padding: 1rem 1.1rem;
}

.pagination .page-link {
  min-width: 36px;
  text-align: center;
  border-radius: 12px;
  border-color: rgba(148, 163, 184, 0.2);
  color: #334155;
  box-shadow: none !important;
}

.pagination .page-item.active .page-link {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
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

.btn-toolbar {
  min-height: 52px;
  border-radius: 16px;
  padding-inline: 1rem;
  font-weight: 700;
  border-width: 1px;
}

.btn-brand,
.btn-primary {
  color: #fff;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
}

.btn-brand:hover,
.btn-brand:focus,
.btn-primary:hover,
.btn-primary:focus {
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

.btn-soft-secondary,
.btn-outline-secondary,
.btn-secondary {
  color: #334155;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.18);
  font-weight: 700;
}

.btn-soft-secondary:hover,
.btn-soft-secondary:focus,
.btn-outline-secondary:hover,
.btn-outline-secondary:focus,
.btn-secondary:hover,
.btn-secondary:focus {
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

.offcanvas-backdrop,
.vmodal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(7px);
}

.offcanvas-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(960px, 100%);
  max-width: 95vw;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #0f172a;
  display: flex;
  flex-direction: column;
  box-shadow: -16px 0 44px rgba(15, 23, 42, 0.22);
  animation: slideInRight 0.24s ease;
  border-top-left-radius: 28px;
  border-bottom-left-radius: 28px;
  overflow: hidden;
}

.offcanvas-panel-sm {
  width: 420px;
  max-width: 96vw;
}

.editor-panel {
  width: min(1100px, 100%);
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

.offcanvas-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.offcanvas-body {
  padding: 1.15rem;
  overflow: auto;
  flex: 1;
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

.vmodal-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.vmodal-body {
  padding: 1.25rem;
  max-height: 70vh;
  overflow: auto;
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

.form-control,
.form-select {
  min-height: 46px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255,255,255,0.95);
  box-shadow: none;
  color: #0f172a;
}

.form-control:focus,
.form-select:focus {
  border-color: rgba(37, 99, 235, 0.30);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
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

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.pro-list-group .list-group-item,
.mobile-item-card,
.confirm-box {
  border-radius: 16px !important;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255,255,255,0.86);
  margin-bottom: 0.5rem;
}

.confirm-box {
  padding: 0.9rem 1rem;
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

.btn-delete-strong {
  box-shadow: 0 10px 22px rgba(220, 38, 38, 0.22);
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

.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
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

  .card-header {
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
}
</style>
