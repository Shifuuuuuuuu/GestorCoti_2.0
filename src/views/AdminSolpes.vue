<!-- src/views/AdminSolpes.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-solpes-page">
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <h1 class="h4 fw-semibold mb-0">Admin · SOLPES</h1>

        <div class="d-flex align-items-stretch gap-2 flex-wrap w-100 w-lg-auto">
          <!-- Buscar numero_solpe -->
          <div class="input-group toolbar-item flex-grow-1" style="min-width: 240px; max-width: 360px;">
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

          <!-- Botón Filtros (abre offcanvas top en móvil / panel en md+) -->
          <button class="btn btn-outline-primary toolbar-item" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span v-if="hasActiveFilters" class="badge bg-primary-subtle text-primary-emphasis ms-2">{{ totalFiltrosActivos }}</span>
          </button>

          <!-- Nueva -->
          <button class="btn btn-primary toolbar-item" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED
          </button>
        </div>
      </div>

      <!-- Chips de filtros activos -->
      <div v-if="hasActiveFilters || busquedaActiva" class="d-flex flex-wrap align-items-center gap-2 mb-2">
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

        <span v-if="busquedaActiva" class="badge bg-info-subtle text-info-emphasis">
          Búsqueda por número activa
        </span>
      </div>

      <!-- Tabla / Cards -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="hasActiveFilters || busquedaActiva" class="text-secondary small ms-2">paginación desactivada</span>
          </div>

          <!-- Barra compacta de búsqueda en móvil -->
          <div class="d-flex d-md-none gap-2">
            <div class="input-group input-group-sm">
              <span class="input-group-text">#</span>
              <input class="form-control" placeholder="Buscar" v-model="buscarNumero" @keyup.enter="onBuscarNumero">
              <button class="btn btn-outline-secondary" @click="onBuscarNumero">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <button v-if="busquedaActiva" class="btn btn-sm btn-outline-danger" @click="limpiarBusqueda" title="Limpiar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Vista tabla (md y arriba) -->
        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width:110px;"># SOLPE</th>
                <th class="minw-220">Centro de Costo</th>
                <th style="width:160px;">Empresa</th>
                <th style="width:140px;">Estatus</th>
                <th style="width:160px;">Fecha</th>
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
                <td class="fw-semibold">#{{ r.numero_solpe ?? '—' }}</td>
                <td>
                  <div class="fw-semibold text-truncate">{{ r.numero_contrato || '—' }}</div>
                  <div class="small text-secondary text-truncate">{{ r.nombre_centro_costo || '—' }}</div>
                </td>
                <td>{{ r.empresa || '—' }}</td>
                <td>
                  <span class="badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
                </td>
                <td>
                  <div class="small">{{ prettyFecha(r.fecha) }}</div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="abrirEditor(r)" title="Editar">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger" @click="abrirConfirm(r)" title="Eliminar">
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

        <!-- Vista cards (xs - sm) -->
        <div class="d-block d-md-none">
          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border" role="status"></div>
            <div class="small text-secondary mt-2">Cargando…</div>
          </div>

          <div v-else-if="rows.length === 0" class="text-center py-4 text-secondary">
            Sin resultados.
          </div>

          <div v-else class="list-group list-group-flush">
            <div v-for="r in rows" :key="r.__id" class="list-group-item">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-semibold">#{{ r.numero_solpe ?? '—' }}</div>
                  <div class="small text-secondary">{{ displayDate(r) }}</div>
                </div>
                <span class="badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>

              <div class="mt-2 small">
                <div class="text-truncate"><span class="text-secondary">Centro:</span> {{ r.nombre_centro_costo || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Contrato:</span> {{ r.numero_contrato || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Empresa:</span> {{ r.empresa || '—' }}</div>
                <div class="text-truncate" v-if="r.usuario"><span class="text-secondary">Usuario:</span> {{ r.usuario }}</div>
              </div>

              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-primary btn-sm flex-fill" @click="abrirEditor(r)">
                  <i class="bi bi-pencil-square me-1"></i> Editar
                </button>
                <button class="btn btn-outline-secondary btn-sm flex-fill" @click="irADetalle(r)">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Detalle
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

    <!-- Offcanvas Filtros (móvil / top) -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filtros · SOLPES</div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Buscar por N° SOLPE</label>
              <div class="input-group">
                <span class="input-group-text">#</span>
                <input
                  class="form-control"
                  placeholder="Ej: 105"
                  v-model="buscarNumero"
                  @keyup.enter="onBuscarNumero"
                />
                <button class="btn btn-outline-secondary" @click="onBuscarNumero">
                  <i class="bi bi-search"></i>
                </button>
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
              <select class="form-select" v-model="filtroEstatusHeader" @change="onChangeEstatusHeader">
                <option value="">Todos</option>
                <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-12 col-sm-6">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <label class="form-label mb-0 fw-semibold">
                  <i class="bi bi-person-circle me-1 text-primary"></i>
                  Usuario
                </label>

                <span class="badge rounded-pill text-bg-light border">
                  <i class="bi bi-people me-1"></i>
                  {{ usuariosOpts.length }}
                </span>
              </div>

              <div class="input-group">
                <span class="input-group-text bg-white">
                  <i class="bi bi-funnel text-muted"></i>
                </span>

                <select class="form-select" v-model="filtroUsuario">
                  <option value="">Todos</option>
                  <option v-for="u in usuariosOpts" :key="u" :value="u">{{ u }}</option>
                </select>

                <button
                  v-if="filtroUsuario"
                  class="btn btn-light border"
                  type="button"
                  @click="filtroUsuario=''"
                  title="Limpiar usuario"
                >
                  <i class="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Fecha</label>
              <input class="form-control" type="date" v-model="filtroFecha">
            </div>
          </div>
        </div>

        <div class="offcanvas-footer d-flex justify-content-between">
          <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
          <button class="btn btn-primary" @click="mobileApplyFilters">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- Offcanvas Editor -->
    <div v-if="editorAbierto" class="offcanvas-backdrop editor-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header editor-header">
          <div class="fw-semibold text-truncate">Editar SOLPED</div>
          <button class="btn-close" @click="cerrarEditor" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body editor-body">
          <div class="row g-3">
            <!-- N° + Fecha + Empresa + Estatus -->
            <div class="col-12 col-sm-6 col-md-3">
              <label class="form-label">N° SOLPE</label>
              <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <label class="form-label">Fecha (bloqueada)</label>
              <input class="form-control" type="datetime-local" v-model="edit.fechaInput" disabled readonly>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="edit.empresa">
                <option>Xtreme Servicio</option>
                <option>Xtreme Hormigones</option>
                <option>Xtreme Mining</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="edit.estatus">
                <option v-for="s in ESTATUS_OPC" :key="'ed-'+s" :value="s">{{ s }}</option>
              </select>
            </div>

            <!-- Centro de costo (2 selects: contrato y nombre) -->
            <div class="col-12">
              <label class="form-label">Centro de Costo</label>

              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <select class="form-select" v-model="selectedCentroEditKey" @change="onCentroEditKeyChange">
                    <option value="">— Nº contrato (key) —</option>
                    <option v-for="opt in centrosOpts" :key="'k-'+opt.key" :value="opt.key">
                      {{ opt.key }}
                    </option>
                  </select>
                  <div class="form-text">Selecciona por número/contrato.</div>
                </div>

                <div class="col-12 col-md-8">
                  <select class="form-select" v-model="selectedCentroEditName" @change="onCentroEditNameChange">
                    <option value="">— Nombre centro de costo —</option>
                    <option v-for="opt in centrosOpts" :key="'n-'+opt.key" :value="opt.name">
                      {{ opt.name }}
                    </option>
                  </select>
                  <div class="form-text">Selecciona por nombre (actualiza también el contrato).</div>
                </div>
              </div>
            </div>

            <!-- Usuario / Tipo / Nombre -->
            <div class="col-12 col-md-4">
              <label class="form-label">Usuario</label>
              <input class="form-control" v-model="edit.usuario" placeholder="Ej: ADMIN">
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>
            <div class="col-12 col-md-4">
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
              <label class="form-label">Documento de autorización</label>
              <div class="d-flex gap-2 flex-wrap">
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

            <!-- Ítems -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItem()">
                  <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                </button>
              </div>

              <div class="table-responsive d-none d-sm-block">
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
                        <div class="fw-semibold text-truncate-2">{{ it.descripcion }}</div>
                        <div class="text-secondary text-truncate">{{ it.numero_interno || '—' }}</div>
                      </td>
                      <td>{{ it.cantidad ?? 0 }}</td>
                      <td>{{ it.cantidad_cotizada ?? 0 }}</td>
                      <td class="text-truncate">{{ it.codigo_referencial || '—' }}</td>
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

              <!-- Cards en xs -->
              <div class="d-block d-sm-none">
                <div v-if="!edit.items?.length" class="text-center text-secondary py-2">Sin ítems.</div>
                <div class="list-group list-group-flush">
                  <div v-for="(it, idx) in edit.items" :key="'m-'+idx" class="list-group-item">
                    <div class="d-flex justify-content-between">
                      <div class="fw-semibold">Ítem {{ it.item }}</div>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ it.estado || '—' }}</span>
                    </div>
                    <div class="small mt-1 text-truncate-3"><span class="text-secondary">Desc:</span> {{ it.descripcion || '—' }}</div>
                    <div class="small mt-1">
                      <span class="text-secondary">Cant.:</span> {{ it.cantidad ?? 0 }} ·
                      <span class="text-secondary">Cotizada:</span> {{ it.cantidad_cotizada ?? 0 }}
                    </div>
                    <div class="small text-truncate mt-1">
                      <span class="text-secondary">Cód. ref:</span> {{ it.codigo_referencial || '—' }}
                    </div>
                    <div class="small mt-1">
                      <span class="text-secondary">Img:</span>
                      <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank">ver</a>
                      <span v-else class="text-secondary">—</span>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                      <button class="btn btn-outline-secondary btn-sm flex-fill" @click="abrirModalItem(it, idx)">
                        <i class="bi bi-pencil me-1"></i> Editar
                      </button>
                      <button class="btn btn-outline-danger btn-sm" @click="eliminarItem(idx)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Historial Estados (subcolección) -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Historial de Estados</div>
              </div>

              <div class="list-group mb-3">
                <div class="list-group-item" v-for="h in historialEstadosLive" :key="h.__id">
                  <div class="row g-2 align-items-center">
                    <div class="col-12 col-md-3 small">
                      <strong>{{ displayTs(h.fecha) || '—' }}</strong>
                    </div>
                    <div class="col-12 col-md-3 small">
                      <span class="text-secondary">Estatus:</span> {{ h.estatus || '—' }}
                    </div>
                    <div class="col-12 col-md-4 small">
                      <span class="text-secondary">Comentario:</span> {{ h.comentario || '—' }}
                    </div>
                    <div class="col-9 col-md-1 small">
                      <span class="text-secondary">Usuario:</span> {{ h.usuario || '—' }}
                    </div>
                    <div class="col-3 col-md-1 text-end">
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarHistorialDoc(h.__id)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!historialEstadosLive.length" class="list-group-item text-secondary small">
                  Sin historial.
                </div>
              </div>

              <!-- Form agregar historial -->
              <div class="card">
                <div class="card-body">
                  <div class="row g-2">
                    <div class="col-12 col-md-3">
                      <label class="form-label mb-1">Fecha</label>
                      <input class="form-control form-control-sm" type="datetime-local" v-model="histForm.fechaInput">
                    </div>
                    <div class="col-12 col-md-3">
                      <label class="form-label mb-1">Estatus</label>
                      <input class="form-control form-control-sm" v-model="histForm.estatus" placeholder="Estatus">
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label mb-1">Comentario</label>
                      <input class="form-control form-control-sm" v-model="histForm.comentario" placeholder="Comentario">
                    </div>
                    <div class="col-9 col-md-1">
                      <label class="form-label mb-1">Usuario</label>
                      <input class="form-control form-control-sm" v-model="histForm.usuario" placeholder="Usuario">
                    </div>
                    <div class="col-3 col-md-1 d-flex align-items-end justify-content-end">
                      <button class="btn btn-sm btn-primary w-100" :disabled="guardandoHist" @click="guardarHistorial()">
                        <span v-if="guardandoHist" class="spinner-border spinner-border-sm me-1"></span>
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="offcanvas-footer editor-footer">
          <div class="d-flex flex-column flex-sm-row justify-content-end gap-2 w-100">
            <button class="btn btn-outline-secondary w-100 w-sm-auto" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-primary w-100 w-sm-auto" :disabled="guardando" @click="guardarEdicion">
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
            <div class="col-md-4">
              <label class="form-label">Fecha</label>
              <input class="form-control" type="datetime-local" v-model="nuevo.fechaInput">
            </div>
            <div class="col-md-3">
              <label class="form-label">Empresa</label>
              <select class="form-select" v-model="nuevo.empresa">
                <option>Xtreme Servicio</option>
                <option>Xtreme Servicios</option>
                <option>Xtreme Mining</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option v-for="s in ESTATUS_OPC" :key="'nw-'+s" :value="s">{{ s }}</option>
              </select>
            </div>

            <!-- Centro de costo (2 selects también) -->
            <div class="col-12">
              <label class="form-label">Centro de Costo</label>

              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <select class="form-select" v-model="selectedCentroNuevoKey" @change="onCentroNuevoKeyChange">
                    <option value="">— Nº contrato (key) —</option>
                    <option v-for="opt in centrosOpts" :key="'nk-'+opt.key" :value="opt.key">
                      {{ opt.key }}
                    </option>
                  </select>
                </div>
                <div class="col-12 col-md-8">
                  <select class="form-select" v-model="selectedCentroNuevoName" @change="onCentroNuevoNameChange">
                    <option value="">— Nombre centro de costo —</option>
                    <option v-for="opt in centrosOpts" :key="'nn-'+opt.key" :value="opt.name">
                      {{ opt.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="small text-secondary mt-2">
                Guardará: <strong>{{ nuevo.numero_contrato || '—' }}</strong> — {{ nuevo.nombre_centro_costo || '—' }}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label">Usuario</label>
              <input class="form-control" v-model="nuevo.usuario" placeholder="ADMIN">
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="nuevo.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>
            <div class="col-md-4">
              <label class="form-label">Nombre SOLPED</label>
              <input class="form-control" v-model="nuevo.nombre_solped">
            </div>

            <!-- Dirigido A -->
            <div class="col-12">
              <label class="form-label mb-1">Dirigido A</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="'n-'+p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.dirigidoA">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

            <!-- Autorización -->
            <div class="col-12">
              <label class="form-label">Autorización (PDF / imagen / Excel)</label>
              <div class="d-flex gap-2 flex-wrap">
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
            ¿Estás seguro que quieres eliminar la SOLPED
            <strong>#{{ confirmRow?.numero_solpe ?? '—' }}</strong>?
          </p>

          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Empresa:</span> <strong>{{ confirmRow?.empresa || '—' }}</strong></li>
            <li><span class="text-secondary">Centro de costo:</span> <strong>{{ confirmRow?.numero_contrato || '—' }}</strong> — {{ confirmRow?.nombre_centro_costo || '—' }}</li>
            <li><span class="text-secondary">Fecha:</span> <strong>{{ displayDate(confirmRow) }}</strong></li>
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
  doc, addDoc, updateDoc, deleteDoc, Timestamp,getDocs
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "vue-router";

/* ---------- Constantes ---------- */
const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado",
  "Cotizando",
  "Cotizando Parcial",
  "Cotizando Completado",
  "Cotizado parcial",
  "Revisión",
  "Cotizado Completado",
  "Rechazado",
  "Pendiente",
  "Parcial",
  "OC enviada a proveedor",
  "Completado",
];
const DIRIGIDO_OPCIONES = [
  "Guillermo Manzor","María José Ballesteros","Ricardo Santibañez","Felipe Gonzalez"
];

/* Centros de Costo (rellenar con tus claves reales) */
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
  '30-10-11': 'GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM',
  '30858':'CONTRATO 30858 INFRA CHUQUICAMATA'
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
const filtroFecha = ref("");       // YYYY-MM-DD
const filtroUsuario = ref("");
const filtroEstatus = ref([]);     // multi
const filtroEstatusHeader = ref("");
let unsubFilter = null;

/* Lista de usuarios para el select (dinámico) */
const usuariosOpts = ref([]);
let unsubUsuarios = null;

const hasActiveFilters = computed(() =>
  !!filtroFecha.value || !!filtroUsuario.value || (filtroEstatus.value?.length || 0) > 0
);
const totalFiltrosActivos = computed(() => {
  let n = 0;
  if (filtroFecha.value) n++;
  if (filtroUsuario.value) n++;
  n += (filtroEstatus.value?.length || 0);
  return n;
});
const usuariosLoading = ref(false);
const usuariosLoadedOnce = ref(false);

// ✅ Trae TODOS los usuarios únicos que hayan creado SOLPED (campo "usuario")
async function cargarUsuariosCreadoras({ force = false } = {}) {
  if (usuariosLoading.value) return;
  if (usuariosLoadedOnce.value && !force) return;

  usuariosLoading.value = true;

  try {
    const set = new Set();
    let cursor = null;
    const PAGE = 1000;

    while (true) {
      const qy = cursor
        ? query(collection(db, "solpes"), orderBy("usuario"), startAfter(cursor), limit(PAGE))
        : query(collection(db, "solpes"), orderBy("usuario"), limit(PAGE));

      const snap = await getDocs(qy);
      if (snap.empty) break;

      snap.forEach((d) => {
        const u = (d.data()?.usuario ?? "").toString().trim();
        if (u) set.add(u);
      });

      cursor = snap.docs[snap.docs.length - 1];
      if (snap.size < PAGE) break; // ya no hay más
    }

    usuariosOpts.value = Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

    usuariosLoadedOnce.value = true;
  } catch (e) {
    console.error(e);
    addToast("warning", "No se pudieron cargar los usuarios (creadores) para el filtro.");
  } finally {
    usuariosLoading.value = false;
  }
}



/* ---------- Toasts ---------- */
const toasts = ref([]);
const addToast = (type, text, timeout = 2600) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

/* ---------- Utils de fecha ---------- */
const tz = "America/Santiago";
function pad(n){ return n.toString().padStart(2,"0"); }
function toInputLocal(date){
  const d = new Date(date);
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function fromInputToDate(inputStr){
  if (!inputStr) return null;
  const hasTime = inputStr.includes("T");
  if (hasTime) {
    const [dPart,tPart] = inputStr.split("T");
    const [Y,M,D] = dPart.split("-").map(n=>parseInt(n,10));
    const [h,mi] = tPart.split(":").map(n=>parseInt(n,10));
    return new Date(Y, (M-1), D, h, mi, 0, 0);
  } else {
    const [Y,M,D] = inputStr.split("-").map(n=>parseInt(n,10));
    return new Date(Y, (M-1), D, 0, 0, 0, 0);
  }
}
function toCLString(date){
  try{
    return new Date(date).toLocaleString("es-CL", {
      timeZone: tz, year:"numeric", month:"long", day:"numeric",
      hour:"numeric", minute:"2-digit", second:"2-digit", hour12:true
    });
  }catch{ return ""; }
}
function displayTs(ts){
  try{
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : ts;
    return toCLString(d);
  }catch{ return ""; }
}
function displayDate(row){
  return row.fecha_str || row.fecha || displayTs(row.fecha_ts) || "—";
}

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
  if (unsubUsuarios){ unsubUsuarios(); unsubUsuarios=null; }
  if (unsubHistorial){ unsubHistorial(); unsubHistorial=null; }
}

/* Cargar usuarios únicos (para el filtro) */
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
  return cargarUsuariosCreadoras();
}

function subscribePage(page){
  cleanupSubs();
  cargarUsuarios();
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
    const snaps = [];
    snap.forEach(d => { arr.push({ __id: d.id, ...d.data() }); snaps.push(d); });
    hasNextPage.value = arr.length > PAGE_SIZE;

    const pageDocs = arr.slice(0, PAGE_SIZE);
    rows.value = pageDocs;

    const lastSnap = snaps[pageDocs.length-1];
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
  filtroEstatus.value = filtroEstatus.value.filter(x => x!==es);
  if (filtroEstatusHeader.value === es) filtroEstatusHeader.value = "";
  aplicarFiltros();
}

function buildFilterQuery(){
  const wh = [];
  let order = null;

  if (filtroFecha.value) {
    const d0 = new Date(filtroFecha.value + "T00:00");
    const d1 = new Date(filtroFecha.value + "T23:59:59.999");
    const ts0 = Timestamp.fromDate(d0);
    const ts1 = Timestamp.fromDate(d1);
    wh.push(where("fecha_ts", ">=", ts0));
    wh.push(where("fecha_ts", "<=", ts1));
    order = orderBy("fecha_ts", "desc");
  } else {
    order = orderBy("numero_solpe","desc");
  }

  if (filtroUsuario.value) wh.push(where("usuario","==", filtroUsuario.value));
  if (filtroEstatus.value.length === 1) {
    wh.push(where("estatus","==", filtroEstatus.value[0]));
  } else if (filtroEstatus.value.length >= 2 && filtroEstatus.value.length <= 10) {
    wh.push(where("estatus","in", filtroEstatus.value));
  }

  return query(
    collection(db, "solpes"),
    ...wh,
    order,
    limit(120)
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

    if (filtroEstatus.value.length > 10) {
      const set = new Set(filtroEstatus.value);
      arr = arr.filter(r => set.has(r.estatus));
    }

    rows.value = arr;
    cargando.value = false;
    hasNextPage.value = false;
  }, (err) => {
    console.error("onSnapshot filter:", err);
    addToast("danger", "Error aplicando filtros (puede requerir índice compuesto en Firestore).");
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

const badgeClass = (estatus) => {
  const s = ((estatus || '') + '').toLowerCase();
  if (s.includes('complet'))   return 'bg-success-subtle text-success-emphasis';
  if (s.includes('cotiz'))     return 'bg-info-subtle text-info-emphasis';
  if (s.includes('rechaz') || s.includes('escala'))
                               return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('revisión') || s.includes('revision'))
                               return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('pendiente')) return 'bg-secondary-subtle text-secondary-emphasis';
  if (s.includes('parcial'))   return 'bg-primary-subtle text-primary-emphasis';
  if (s.includes('proveedor')) return 'bg-dark-subtle text-dark-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const mobileFiltersOpen = ref(false);
function mobileApplyFilters(){
  aplicarFiltros();
  mobileFiltersOpen.value = false;
}

/* ---------- Refs para inputs de archivos ---------- */
const inputAutorizacionEditEl = ref(null);
const inputAutorizacionNuevoEl = ref(null);

/* ---------- Editor (offcanvas) ---------- */
const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);

// Centro de costo: 2 selects en editor
const selectedCentroEditKey = ref("");
const selectedCentroEditName = ref("");

const archivoAutorizacionEdit = ref(null);

/* Historial subcolección (live) */
const historialEstadosLive = ref([]);
let unsubHistorial = null;
const guardandoHist = ref(false);
const histForm = ref({
  fechaInput: "",
  estatus: "",
  comentario: "",
  usuario: ""
});

function abrirSelectorAutorizacionEdit(){
  inputAutorizacionEditEl.value?.click();
}
function abrirSelectorAutorizacionNuevo(){
  inputAutorizacionNuevoEl.value?.click();
}

function setCentroFromKey(targetObj, key){
  if (!key || !centrosCosto[key]) {
    targetObj.numero_contrato = "";
    targetObj.nombre_centro_costo = "";
    return;
  }
  targetObj.numero_contrato = key;
  targetObj.nombre_centro_costo = centrosCosto[key];
}
function setCentroFromName(targetObj, name){
  if (!name) { setCentroFromKey(targetObj, ""); return ""; }
  const key = Object.keys(centrosCosto).find(k => centrosCosto[k] === name) || "";
  setCentroFromKey(targetObj, key);
  return key;
}

/* Sync handlers editor */
function onCentroEditKeyChange(){
  setCentroFromKey(edit.value, selectedCentroEditKey.value);
  selectedCentroEditName.value = edit.value.nombre_centro_costo || "";
}
function onCentroEditNameChange(){
  const key = setCentroFromName(edit.value, selectedCentroEditName.value);
  selectedCentroEditKey.value = key;
}

function subscribeHistorialEstados(solpeId){
  if (unsubHistorial){ unsubHistorial(); unsubHistorial=null; }
  try{
    const qy = query(
      collection(db, "solpes", solpeId, "historialEstados"),
      orderBy("fecha","desc"),
      limit(100)
    );
    unsubHistorial = onSnapshot(qy, (snap)=>{
      const arr=[];
      snap.forEach(d=>arr.push({__id:d.id, ...d.data()}));
      historialEstadosLive.value = arr;
    }, (err)=>{
      console.error("historialEstados:", err);
      addToast("warning","No se pudo cargar historial.");
    });
  }catch(e){
    console.error(e);
    addToast("warning","No se pudo suscribir al historial.");
  }
}

function resetHistForm(){
  histForm.value = {
    fechaInput: toInputLocal(new Date()),
    estatus: "",
    comentario: "",
    usuario: edit.value?.usuario || ""
  };
}

function pickRowDate(row){
  try{
    if (row?.fecha_ts?.toDate) return row.fecha_ts.toDate();
    if (row?.fecha instanceof Date) return row.fecha;
    if (typeof row?.fecha === "string") {
      const d = new Date(row.fecha);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof row?.fecha_str === "string") {
      const d = new Date(row.fecha_str);
      if (!isNaN(d.getTime())) return d;
    }
  }catch(e){console.log(e)}
  return null;
}

function abrirEditor(row){
  seleccion.value = row;

  // Fecha original (SE PRESERVA: no editable y no se sobreescribe)
  const d = pickRowDate(row);
  const originalTs = row?.fecha_ts ?? (d ? Timestamp.fromDate(d) : null);
  const originalStr = row?.fecha_str ?? row?.fecha ?? (d ? toCLString(d) : "");

  edit.value = {
    // se mantienen visibles, pero NO se guardan desde el input
    fechaInput: d ? toInputLocal(d) : "",

    // respaldo para guardar sin cambios
    __fecha_ts: originalTs,
    __fecha_str: originalStr,

    autorizacion_nombre: row.autorizacion_nombre ?? null,
    autorizacion_url: row.autorizacion_url ?? null,
    dirigidoA: Array.isArray(row.dirigidoA) ? [...row.dirigidoA] : [],
    empresa: row.empresa ?? "Xtreme Servicio",
    estatus: row.estatus ?? "Pendiente",
    items: Array.isArray(row.items) ? JSON.parse(JSON.stringify(row.items)) : [],
    nombre_centro_costo: row.nombre_centro_costo ?? "",
    nombre_solped: row.nombre_solped ?? "",
    numero_contrato: row.numero_contrato ?? "",
    numero_solpe: row.numero_solpe ?? null,
    tipo_solped: row.tipo_solped ?? "",
    usuario: row.usuario ?? ""
  };

  // Centro de costo: setear ambos selects
  selectedCentroEditKey.value = edit.value.numero_contrato || "";
  selectedCentroEditName.value = edit.value.nombre_centro_costo || (centrosCosto[selectedCentroEditKey.value] || "");

  // Si el nombre no calza con el key, re-sincroniza por key si existe
  if (selectedCentroEditKey.value && centrosCosto[selectedCentroEditKey.value]) {
    edit.value.nombre_centro_costo = centrosCosto[selectedCentroEditKey.value];
    selectedCentroEditName.value = edit.value.nombre_centro_costo;
  } else if (selectedCentroEditName.value) {
    const k = setCentroFromName(edit.value, selectedCentroEditName.value);
    selectedCentroEditKey.value = k;
  }

  subscribeHistorialEstados(row.__id);
  resetHistForm();

  editorAbierto.value = true;
  archivoAutorizacionEdit.value = null;
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
  archivoAutorizacionEdit.value = null;
  selectedCentroEditKey.value = "";
  selectedCentroEditName.value = "";
  if (inputAutorizacionEditEl.value) inputAutorizacionEditEl.value.value = "";
  if (unsubHistorial){ unsubHistorial(); unsubHistorial=null; }
}

/* ---------- Guardar Edición (fecha bloqueada, NO se actualiza) ---------- */
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
      edit.value.autorizacion_nombre = archivoAutorizacionEdit.value.name;
    }

    if (typeof edit.value.numero_solpe === "string") {
      const n = parseInt(edit.value.numero_solpe, 10);
      edit.value.numero_solpe = isNaN(n) ? null : n;
    }

    // Normalizar ítems
    const items = (edit.value.items || []).map(it => ({
      ...it,
      item: Number(it.item ?? 0),
      cantidad: Number(it.cantidad ?? 0),
      cantidad_cotizada: Number(it.cantidad_cotizada ?? 0)
    }));

    // ✅ FECHA: se preserva original (no editable y no se recalcula)
    const fecha_str = (edit.value.__fecha_str ?? seleccion.value.fecha_str ?? seleccion.value.fecha ?? "") || "";
    const fecha_ts  = (edit.value.__fecha_ts ?? seleccion.value.fecha_ts) ?? null;

    const payload = {
      autorizacion_nombre: edit.value.autorizacion_nombre ?? null,
      autorizacion_url: edit.value.autorizacion_url ?? null,
      dirigidoA: Array.isArray(edit.value.dirigidoA) ? edit.value.dirigidoA : [],
      empresa: edit.value.empresa ?? "Xtreme Servicio",
      estatus: edit.value.estatus ?? "Pendiente",
      items,
      nombre_centro_costo: edit.value.nombre_centro_costo ?? "",
      nombre_solped: edit.value.nombre_solped ?? "",
      numero_contrato: edit.value.numero_contrato ?? "",
      numero_solpe: edit.value.numero_solpe ?? null,
      tipo_solped: edit.value.tipo_solped ?? "",
      usuario: edit.value.usuario ?? "",

      // preservadas
      fecha_str,
      fecha: fecha_str,
      ...(fecha_ts ? { fecha_ts } : {})
    };

    await updateDoc(dref, payload);
    addToast("success", "SOLPED actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

/* ---------- Nueva SOLPED ---------- */
const modalNueva = ref(false);
const creando = ref(false);
const nuevo = ref({});

// Centro de costo: 2 selects en nuevo
const selectedCentroNuevoKey = ref("");
const selectedCentroNuevoName = ref("");

const archivoAutorizacionNuevo = ref(null);

function defaultNueva(){
  return {
    autorizacion_nombre: null,
    autorizacion_url: null,
    dirigidoA: [],
    empresa: "Xtreme Servicio",
    estatus: "Pendiente",
    items: [],
    nombre_centro_costo: "",
    nombre_solped: "",
    numero_contrato: "",
    numero_solpe: null,
    tipo_solped: "",
    usuario: "",
    fechaInput: toInputLocal(new Date())
  };
}
function abrirModalNueva(){
  nuevo.value = defaultNueva();
  selectedCentroNuevoKey.value = "";
  selectedCentroNuevoName.value = "";
  archivoAutorizacionNuevo.value = null;
  if (inputAutorizacionNuevoEl.value) inputAutorizacionNuevoEl.value.value = "";
  modalNueva.value = true;
}
function cerrarModalNueva(){ modalNueva.value = false; }

function onCentroNuevoKeyChange(){
  setCentroFromKey(nuevo.value, selectedCentroNuevoKey.value);
  selectedCentroNuevoName.value = nuevo.value.nombre_centro_costo || "";
}
function onCentroNuevoNameChange(){
  const key = setCentroFromName(nuevo.value, selectedCentroNuevoName.value);
  selectedCentroNuevoKey.value = key;
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

async function crearNueva(){
  try {
    creando.value = true;

    if (typeof nuevo.value.numero_solpe === "string") {
      const n = parseInt(nuevo.value.numero_solpe, 10);
      nuevo.value.numero_solpe = isNaN(n) ? null : n;
    }

    const picked = fromInputToDate(nuevo.value.fechaInput) || new Date();
    const fecha_str = toCLString(picked);
    const fecha_ts = Timestamp.fromDate(picked);

    const payload = {
      autorizacion_nombre: nuevo.value.autorizacion_nombre ?? null,
      autorizacion_url: nuevo.value.autorizacion_url ?? null,
      dirigidoA: Array.isArray(nuevo.value.dirigidoA) ? nuevo.value.dirigidoA : [],
      empresa: nuevo.value.empresa ?? "Xtreme Servicio",
      estatus: nuevo.value.estatus ?? "Pendiente",
      items: [],
      nombre_centro_costo: nuevo.value.nombre_centro_costo ?? "",
      nombre_solped: nuevo.value.nombre_solped ?? "",
      numero_contrato: nuevo.value.numero_contrato ?? "",
      numero_solpe: nuevo.value.numero_solpe ?? null,
      tipo_solped: nuevo.value.tipo_solped ?? "",
      usuario: nuevo.value.usuario ?? "",
      fecha_str,
      fecha: fecha_str,
      fecha_ts
    };

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

/* ---------- Historial: crear / eliminar ---------- */
async function guardarHistorial(){
  if (!seleccion.value?.__id) return;
  try{
    guardandoHist.value = true;
    const d = fromInputToDate(histForm.value.fechaInput) || new Date();
    const data = {
      fecha: Timestamp.fromDate(d),
      comentario: (histForm.value.comentario || "").trim(),
      estatus: (histForm.value.estatus || "").trim(),
      usuario: (histForm.value.usuario || "").trim()
    };
    await addDoc(collection(db, "solpes", seleccion.value.__id, "historialEstados"), data);
    addToast("success","Historial agregado.");
    resetHistForm();
  }catch(e){
    console.error(e);
    addToast("danger","No se pudo agregar al historial.");
  }finally{
    guardandoHist.value = false;
  }
}
async function eliminarHistorialDoc(hid){
  if (!seleccion.value?.__id || !hid) return;
  try{
    await deleteDoc(doc(db, "solpes", seleccion.value.__id, "historialEstados", hid));
    addToast("success","Entrada de historial eliminada.");
  }catch(e){
    console.error(e);
    addToast("danger","No se pudo eliminar la entrada.");
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
  item: 1,
  descripcion: "",
  cantidad: 0,
  cantidad_cotizada: 0,
  codigo_referencial: "",
  estado: "Pendiente",
  numero_interno: "",
  imagen_url: null
});
const imagenItemFile = ref(null);

function abrirModalItem(it=null, idx=-1){
  const arr = Array.isArray(edit.value.items) ? edit.value.items : [];
  if (!it) {
    const maxIt = arr.reduce((m, a) => Math.max(m, Number(a?.item ?? 0)), 0);
    itemForm.value = {
      item: maxIt + 1,
      descripcion: "",
      cantidad: 0,
      cantidad_cotizada: 0,
      codigo_referencial: "",
      estado: "Pendiente",
      numero_interno: "",
      imagen_url: null
    };
    isEditItem.value = false; itemIndex.value = -1;
  } else {
    itemForm.value = JSON.parse(JSON.stringify(it));
    isEditItem.value = true; itemIndex.value = idx;
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
      cantidad_cotizada: Number(itemForm.value.cantidad_cotizada ?? 0)
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

const prettyFecha = (f) => {
  try {
    if (f?.toDate) return f.toDate().toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
    if (typeof f === 'string') return new Date(f).toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
    if (f instanceof Date) return f.toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
  } catch(e) { console.error(e); }
  return '—';
};

function eliminarItem(idx){
  edit.value.items.splice(idx, 1);
}

/* ---------- Lifecycle ---------- */
onMounted(() => { subscribePage(1); });
onBeforeUnmount(() => { cleanupSubs(); });
</script>

<style scoped>
.admin-solpes-page{
  min-height:100vh;
}

/* Helpers responsivos */
.minw-220{ min-width: 220px; }

/* Toolbar: alturas alineadas */
.toolbar-item .form-control,
.toolbar-item .form-select,
.toolbar-item .btn,
.toolbar-item .input-group-text { height: 38px; }

/* Offcanvas base */
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

/* Cards mobile */
@media (max-width: 575.98px){
  .list-group-item{ border-left: 0; border-right: 0; }
}

@keyframes slideInRight{
  from{ transform: translateX(24px); opacity: .0; }
  to{ transform: translateX(0); opacity: 1; }
}

/* Modal base */
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

/* Icono modal de eliminación */
.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}

/* Tabla */
.table td, .table th { vertical-align: middle; }
.text-truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 576px){
  .text-truncate { max-width: 180px; }
}

/* Hover suave en botón peligro */
.btn-danger:hover{ filter: brightness(0.95); }
</style>
