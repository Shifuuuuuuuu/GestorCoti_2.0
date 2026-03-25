<!-- src/views/AdminSolpedPlantas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="container py-4 py-md-5 position-relative">
      <!-- HERO -->
      <section class="hero-card mb-4">
        <div class="hero-pattern"></div>

        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap position-relative">
          <div>
            <div class="hero-badge mb-2">
              <i class="bi bi-building-gear me-2"></i>
              Gestión de plantas
            </div>
            <h1 class="hero-title mb-1">Admin · SOLPED Plantas</h1>
            <p class="hero-subtitle mb-0">
              Administra SOLPED de plantas, filtra por usuario, fecha, estatus y estado de aprobación desde una vista más clara y profesional.
            </p>
          </div>

          <div class="hero-actions d-flex align-items-stretch gap-2 flex-wrap w-100 w-xl-auto ms-xl-3">
            <div class="search-shell minw-320">
              <i class="bi bi-search search-icon"></i>
              <input
                class="search-input"
                placeholder="Buscar numero_solpe"
                v-model="buscarNumero"
                @keyup.enter="onBuscarNumero"
              />
              <button class="search-clear" @click="onBuscarNumero" title="Buscar" type="button">
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
              <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED Plantas
            </button>
          </div>
        </div>
      </section>

      <!-- FILTROS ACTIVOS -->
      <div v-if="hasActiveFilters || busquedaActiva" class="active-filters mb-3">
        <small class="text-secondary fw-semibold">Filtros activos:</small>

        <span v-if="filtroFecha" class="chip chip-slate">
          Fecha: {{ filtroFecha }}
          <button class="chip-x" @click="filtroFecha=''; aplicarFiltros()">×</button>
        </span>

        <span v-if="filtroUsuario" class="chip chip-slate">
          Usuario: {{ filtroUsuario }}
          <button class="chip-x" @click="filtroUsuario=''; aplicarFiltros()">×</button>
        </span>

        <span v-if="filtroEstadoAprob" class="chip chip-slate">
          Aprobación: {{ filtroEstadoAprob }}
          <button class="chip-x" @click="filtroEstadoAprob=''; aplicarFiltros()">×</button>
        </span>

        <span v-for="es in filtroEstatus" :key="es" class="chip chip-slate">
          {{ es }}
          <button class="chip-x" @click="removeEstatus(es)">×</button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>

        <span v-if="busquedaActiva" class="chip chip-cyan">
          Búsqueda por número activa
        </span>
      </div>

      <!-- LISTADO -->
      <div class="card main-shell">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="fw-semibold">
            Listado
            <span class="text-secondary small ms-2">({{ rows.length }} / pág.)</span>
            <span v-if="hasActiveFilters || busquedaActiva" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>

          <div class="d-flex d-md-none gap-2">
            <div class="input-group input-group-sm search-mini">
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

        <!-- TABLA DESKTOP -->
        <div class="table-responsive d-none d-md-block">
          <table class="table solpes-table align-middle mb-0">
            <thead class="table-head-pro">
              <tr>
                <th style="width:110px;"># SOLPE</th>
                <th class="minw-220">Centro de Costo</th>
                <th style="width:160px;">Empresa</th>
                <th style="width:140px;">Estatus</th>
                <th style="width:180px;">Aprobación SOLPED</th>
                <th style="width:160px;">Fecha</th>
                <th style="width:180px;">Acciones</th>
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
                  <div class="row-index">#{{ r.numero_solpe ?? '—' }}</div>
                </td>

                <td>
                  <div class="provider-main min-w-0">
                    <div class="provider-avatar">
                      <i class="bi bi-building"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="provider-name text-truncate">{{ r.numero_contrato || '—' }}</div>
                      <div class="provider-address text-truncate">{{ r.nombre_centro_costo || '—' }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="chip chip-blue">{{ r.empresa || '—' }}</span>
                </td>

                <td>
                  <span class="badge status-badge" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
                </td>

                <td>
                  <span class="badge status-badge" :class="badgeEstadoClass(r.estadoAprobacionSolped)">
                    {{ r.estadoAprobacionSolped || 'Pendiente' }}
                  </span>
                </td>

                <td>
                  <div class="date-badge">{{ prettyFecha(r.fecha) }}</div>
                </td>

                <td>
                  <div class="action-group d-inline-flex">
                    <button class="btn action-btn action-edit" @click="abrirEditor(r)" title="Editar">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn action-btn action-delete" @click="abrirConfirm(r)" title="Eliminar">
                      <i class="bi bi-trash3"></i>
                    </button>
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
            <article v-for="r in rows" :key="r.__id" class="solpe-mobile-card">
              <div class="mobile-card-top">
                <div>
                  <div class="provider-name">#{{ r.numero_solpe ?? '—' }}</div>
                  <div class="provider-address">{{ displayDate(r) }}</div>
                </div>
                <span class="badge status-badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>

              <div class="mobile-card-body">
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Centro</span>
                  <span class="mobile-info-value text-truncate">{{ r.nombre_centro_costo || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Contrato</span>
                  <span class="mobile-info-value text-truncate">{{ r.numero_contrato || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Empresa</span>
                  <span class="mobile-info-value text-truncate">{{ r.empresa || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Aprobación</span>
                  <span class="mobile-info-value text-truncate">{{ r.estadoAprobacionSolped || 'Pendiente' }}</span>
                </div>
                <div class="mobile-info-row" v-if="r.usuario">
                  <span class="mobile-info-label">Usuario</span>
                  <span class="mobile-info-value text-truncate">{{ r.usuario }}</span>
                </div>
              </div>

              <div class="mobile-card-actions">
                <button class="btn btn-soft-primary flex-fill" @click="abrirEditor(r)">
                  <i class="bi bi-pencil-square me-1"></i> Editar
                </button>
                <button class="btn btn-soft-secondary flex-fill" @click="irADetalle(r)">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Detalle
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
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">«</button>
              </li>

              <li
                class="page-item"
                v-for="n in visiblePageButtons"
                :key="n"
                :class="{ active: currentPage === n }"
              >
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
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- MOBILE FILTERS -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel offcanvas-panel-sm">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Opciones</div>
            <div class="fw-bold fs-5"><i class="bi bi-funnel me-2"></i>Filtros · SOLPED Plantas</div>
          </div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body">
          <div class="form-block">
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
                <label class="form-label">Estado aprobación SOLPED</label>
                <select class="form-select" v-model="filtroEstadoAprob">
                  <option value="">Todos</option>
                  <option v-for="s in ESTADO_APROB_OPC" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-12 col-sm-6">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <label class="form-label mb-0 fw-semibold">
                    <i class="bi bi-person-circle me-1 text-primary"></i>
                    Usuario
                  </label>

                  <span class="chip chip-slate">
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

              <div class="col-12 col-sm-6">
                <label class="form-label">Fecha</label>
                <input class="form-control" type="date" v-model="filtroFecha">
              </div>
            </div>
          </div>
        </div>

        <div class="offcanvas-footer d-flex justify-content-between">
          <button class="btn btn-soft-secondary" @click="limpiarFiltros">Limpiar</button>
          <button class="btn btn-brand" @click="mobileApplyFilters">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- EDITOR -->
    <div v-if="editorAbierto" class="offcanvas-backdrop editor-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header editor-header">
          <div>
            <div class="modal-kicker">Editar registro</div>
            <div class="fw-bold fs-5 text-truncate">Editar SOLPED Plantas</div>
          </div>
          <button class="btn-close" @click="cerrarEditor" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body editor-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-sm-6 col-md-3">
                <label class="form-label">N° SOLPE</label>
                <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
              </div>

              <div class="col-12 col-sm-6 col-md-6">
                <label class="form-label">updated_at</label>
                <input
                  class="form-control"
                  :value="edit.updated_at_input"
                  @input="onUpdatedAtInput"
                  inputmode="numeric"
                  maxlength="19"
                  placeholder="yyyy/mm/dd hh:mm:ss"
                >
                <div class="form-text">
                  Escribe solo números si quieres. El formato se completa automático.
                  Ejemplo: 20260320143055 → 2026/03/20 14:30:55
                </div>
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

              <div class="col-12 col-md-3">
                <label class="form-label">Estado aprobación</label>
                <select class="form-select" v-model="edit.estadoAprobacionSolped">
                  <option v-for="s in ESTADO_APROB_OPC" :key="'ea-'+s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Prioridad SOLPED</label>
                <select class="form-select" v-model="edit.prioridad_solped">
                  <option>ALTA</option>
                  <option>MEDIA</option>
                  <option>BAJA</option>
                </select>
              </div>

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

              <div class="col-12 col-md-4">
                <label class="form-label">Usuario</label>
                <input class="form-control" v-model="edit.usuario" placeholder="Ej: ADMIN">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Tipo SOLPED</label>
                <input class="form-control" v-model="edit.tipo_solped" placeholder="REPUESTOS">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Nombre SOLPED</label>
                <input class="form-control" v-model="edit.nombre_solped">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Aprobador SOLPED</label>
                <input class="form-control" v-model="edit.aprobadorSolped" placeholder="Ej: Ricardo Prouvay">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Usuario aprobación</label>
                <input class="form-control" v-model="edit.usuario_aprobacion_solped" placeholder="Ej: Ricardo Prouvay">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Días estimados gestión</label>
                <input class="form-control" v-model.number="edit.dias_estimados_gestion" type="number" min="0">
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Requiere aprobación</label>
                <select class="form-select" v-model="edit.requiereAprobacionSolped">
                  <option :value="true">Sí</option>
                  <option :value="false">No</option>
                </select>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Tipo flujo</label>
                <input class="form-control" v-model="edit.tipo_flujo" readonly>
              </div>

              <div class="col-12">
                <label class="form-label">Comentario aprobación SOLPED</label>
                <textarea class="form-control" rows="2" v-model="edit.comentario_aprobacion_solped"></textarea>
              </div>

              <div class="col-12">
                <label class="form-label mb-1">Dirigido A</label>
                <div class="checks-wrap">
                  <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="p">
                    <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.dirigidoA">
                    <span class="form-check-label">{{ p }}</span>
                  </label>
                </div>
              </div>

              <!-- ADJUNTOS -->
              <div class="col-12">
                <label class="form-label">Documentos adjuntos (PDF / imagen / Excel)</label>

                <div class="d-flex gap-2 flex-wrap align-items-center">
                  <input
                    ref="inputAutorizacionEditEl"
                    id="inputAutorizacionEdit"
                    type="file"
                    class="d-none"
                    multiple
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosAutorizacionEdit"
                  >
                  <button class="btn btn-soft-secondary" @click="abrirSelectorAutorizacionEdit">
                    <i class="bi bi-paperclip me-1"></i> Agregar archivos
                  </button>

                  <span class="chip chip-slate" v-if="(edit.autorizaciones?.length || 0) > 0">
                    <i class="bi bi-folder2-open me-1"></i> {{ edit.autorizaciones.length }} adjunto(s)
                  </span>

                  <span class="chip chip-cyan" v-if="archivosAutorizacionEdit.length">
                    <i class="bi bi-cloud-upload me-1"></i> {{ archivosAutorizacionEdit.length }} para subir
                  </span>
                </div>

                <div class="mt-2" v-if="(edit.autorizaciones?.length || 0) > 0">
                  <div class="small text-secondary mb-1">Actuales:</div>
                  <div class="list-group pro-list-group">
                    <div class="list-group-item py-2" v-for="(a, i) in edit.autorizaciones" :key="(a.url || a.nombre || 'adj') + '-' + i">
                      <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-file-earmark-text"></i>
                          <div class="small">
                            <div class="fw-semibold text-truncate" style="max-width: 520px;">
                              {{ a.nombre || 'archivo' }}
                            </div>
                            <div class="text-secondary">
                              <span v-if="a.tipo">{{ a.tipo }}</span>
                              <span v-if="a.tamano"> · {{ prettyBytes(a.tamano) }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="d-flex gap-2">
                          <a v-if="a.url" :href="a.url" target="_blank" class="btn btn-sm btn-soft-primary">
                            <i class="bi bi-box-arrow-up-right me-1"></i> Ver
                          </a>
                          <button class="btn btn-sm btn-soft-danger" @click="removeAdjuntoEdit(i)">
                            <i class="bi bi-x-lg me-1"></i> Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-2" v-if="archivosAutorizacionEdit.length">
                  <div class="small text-secondary mb-1">Por subir (se agregan al guardar):</div>
                  <div class="d-flex flex-wrap gap-2">
                    <span
                      class="chip chip-cyan"
                      v-for="(f, idx) in archivosAutorizacionEdit"
                      :key="f.name + f.size + f.lastModified"
                    >
                      {{ f.name }}
                      <button class="chip-x dark" @click="removePendingEdit(idx)">×</button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- ÍTEMS -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Ítems</div>
                  <button class="btn btn-sm btn-soft-primary" @click="abrirModalItem()">
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
                        <th style="width:100px;">Stock</th>
                        <th style="width:130px;">Prioridad</th>
                        <th style="width:160px;">Código ref.</th>
                        <th style="width:140px;">Estado</th>
                        <th style="width:140px;">Img</th>
                        <th style="width:160px;">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!edit.items?.length">
                        <td colspan="9" class="text-center text-secondary">Sin ítems.</td>
                      </tr>
                      <tr v-for="(it, idx) in edit.items" :key="idx">
                        <td class="fw-semibold">{{ it.item }}</td>
                        <td class="small">
                          <div class="fw-semibold text-truncate-2">{{ it.descripcion }}</div>
                          <div class="text-secondary text-truncate">{{ it.numero_interno || '—' }}</div>
                        </td>
                        <td>{{ it.cantidad ?? 0 }}</td>
                        <td>{{ it.stock ?? 0 }}</td>
                        <td>{{ it.prioridad || 'MEDIA' }}</td>
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

                <div class="d-block d-sm-none">
                  <div v-if="!edit.items?.length" class="text-center text-secondary py-2">Sin ítems.</div>
                  <div class="list-group list-group-flush">
                    <div v-for="(it, idx) in edit.items" :key="'m-'+idx" class="list-group-item mobile-item-card">
                      <div class="d-flex justify-content-between">
                        <div class="fw-semibold">Ítem {{ it.item }}</div>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ it.estado || '—' }}</span>
                      </div>
                      <div class="small mt-1 text-truncate-3"><span class="text-secondary">Desc:</span> {{ it.descripcion || '—' }}</div>
                      <div class="small mt-1">
                        <span class="text-secondary">Cant.:</span> {{ it.cantidad ?? 0 }} ·
                        <span class="text-secondary">Stock:</span> {{ it.stock ?? 0 }}
                      </div>
                      <div class="small mt-1">
                        <span class="text-secondary">Prioridad:</span> {{ it.prioridad || 'MEDIA' }}
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

              <!-- HISTORIAL -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Historial de Estados</div>
                </div>

                <div class="list-group mb-3 pro-list-group">
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
                        <button class="btn btn-sm btn-soft-danger" @click="eliminarHistorialDoc(h.__id)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="!historialEstadosLive.length" class="list-group-item text-secondary small">
                    Sin historial.
                  </div>
                </div>

                <div class="mini-card">
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
                      <button class="btn btn-sm btn-brand w-100" :disabled="guardandoHist" @click="guardarHistorial()">
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
            <button class="btn btn-soft-secondary w-100 w-sm-auto" @click="cerrarEditor">Cerrar</button>
            <button class="btn btn-brand w-100 w-sm-auto" :disabled="guardando" @click="guardarEdicion">
              <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">Crear registro</div>
            <h5 class="mb-0 fw-bold">Nueva SOLPED Plantas</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
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
                  <option>Xtreme Hormigones</option>
                  <option>Xtreme Mining</option>
                </select>
              </div>

              <div class="col-md-2">
                <label class="form-label">Estatus</label>
                <select class="form-select" v-model="nuevo.estatus">
                  <option v-for="s in ESTATUS_OPC" :key="'nw-'+s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-md-3">
                <label class="form-label">Estado aprobación</label>
                <select class="form-select" v-model="nuevo.estadoAprobacionSolped">
                  <option v-for="s in ESTADO_APROB_OPC" :key="'na-'+s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-md-3">
                <label class="form-label">Prioridad SOLPED</label>
                <select class="form-select" v-model="nuevo.prioridad_solped">
                  <option>ALTA</option>
                  <option>MEDIA</option>
                  <option>BAJA</option>
                </select>
              </div>

              <div class="col-md-3">
                <label class="form-label">Aprobador SOLPED</label>
                <input class="form-control" v-model="nuevo.aprobadorSolped" placeholder="Ej: Ricardo Prouvay">
              </div>

              <div class="col-md-3">
                <label class="form-label">Días estimados gestión</label>
                <input class="form-control" v-model.number="nuevo.dias_estimados_gestion" type="number" min="0">
              </div>

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

                <div class="form-text mt-2">
                  Guardará: <strong>{{ nuevo.numero_contrato || '—' }}</strong> — {{ nuevo.nombre_centro_costo || '—' }}
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label">Usuario</label>
                <input class="form-control" v-model="nuevo.usuario" placeholder="ADMIN">
              </div>

              <div class="col-md-4">
                <label class="form-label">Tipo SOLPED</label>
                <input class="form-control" v-model="nuevo.tipo_solped" placeholder="REPUESTOS">
              </div>

              <div class="col-md-4">
                <label class="form-label">Nombre SOLPED</label>
                <input class="form-control" v-model="nuevo.nombre_solped">
              </div>

              <div class="col-md-4">
                <label class="form-label">Usuario aprobación</label>
                <input class="form-control" v-model="nuevo.usuario_aprobacion_solped">
              </div>

              <div class="col-md-4">
                <label class="form-label">Requiere aprobación</label>
                <select class="form-select" v-model="nuevo.requiereAprobacionSolped">
                  <option :value="true">Sí</option>
                  <option :value="false">No</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Tipo flujo</label>
                <input class="form-control" v-model="nuevo.tipo_flujo" readonly>
              </div>

              <div class="col-12">
                <label class="form-label">Comentario aprobación SOLPED</label>
                <input class="form-control" v-model="nuevo.comentario_aprobacion_solped">
              </div>

              <div class="col-12">
                <label class="form-label mb-1">Dirigido A</label>
                <div class="checks-wrap">
                  <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="'n-'+p">
                    <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.dirigidoA">
                    <span class="form-check-label">{{ p }}</span>
                  </label>
                </div>
              </div>

              <!-- ADJUNTOS NUEVO -->
              <div class="col-12">
                <label class="form-label">Documentos adjuntos (PDF / imagen / Excel)</label>
                <div class="d-flex gap-2 flex-wrap align-items-center">
                  <input
                    ref="inputAutorizacionNuevoEl"
                    id="inputAutorizacionNuevo"
                    type="file"
                    class="d-none"
                    multiple
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosAutorizacionNuevo"
                  >
                  <button class="btn btn-soft-secondary" @click="abrirSelectorAutorizacionNuevo">
                    <i class="bi bi-paperclip me-1"></i> Seleccionar archivos
                  </button>

                  <span class="chip chip-cyan" v-if="archivosAutorizacionNuevo.length">
                    {{ archivosAutorizacionNuevo.length }} seleccionado(s)
                  </span>
                </div>

                <div class="mt-2" v-if="archivosAutorizacionNuevo.length">
                  <div class="small text-secondary mb-1">Pendientes:</div>
                  <div class="d-flex flex-wrap gap-2">
                    <span
                      class="chip chip-cyan"
                      v-for="(f, idx) in archivosAutorizacionNuevo"
                      :key="f.name + f.size + f.lastModified"
                    >
                      {{ f.name }}
                      <button class="chip-x dark" @click="removePendingNuevo(idx)">×</button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- ÍTEMS NUEVOS -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Ítems</div>
                  <button class="btn btn-sm btn-soft-primary" @click="abrirModalItemNuevo()">
                    <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Ítem</th>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>Stock</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Imagen</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!nuevo.items.length">
                        <td colspan="8" class="text-center text-secondary">Sin ítems.</td>
                      </tr>
                      <tr v-for="(it, idx) in nuevo.items" :key="'ni-'+idx">
                        <td>{{ it.item }}</td>
                        <td>{{ it.descripcion || '—' }}</td>
                        <td>{{ it.cantidad ?? 0 }}</td>
                        <td>{{ it.stock ?? 0 }}</td>
                        <td>{{ it.prioridad || 'MEDIA' }}</td>
                        <td>{{ it.estado || 'pendiente' }}</td>
                        <td>
                          <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank">ver</a>
                          <span v-else>—</span>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" @click="abrirModalItemNuevo(it, idx)">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" @click="eliminarItemNuevo(idx)">
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
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarModalNueva">Cancelar</button>
          <button class="btn btn-brand" :disabled="guardandoNueva" @click="crearNueva">
            <span v-if="guardandoNueva" class="spinner-border spinner-border-sm me-2"></span>
            Crear SOLPED
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ITEM -->
    <div v-if="modalItem" class="vmodal-backdrop" @click.self="cerrarModalItem">
      <div class="vmodal" style="max-width: 760px;">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">{{ itemModeNuevo ? 'Ítem · Nueva SOLPED' : 'Ítem · Editar SOLPED' }}</div>
            <h5 class="mb-0 fw-bold">{{ itemModeNuevo ? 'Ítem · Nueva SOLPED' : 'Ítem · Editar SOLPED' }}</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-md-2">
                <label class="form-label">Ítem</label>
                <input class="form-control" v-model.number="itemForm.item" type="number" min="1">
              </div>

              <div class="col-md-10">
                <label class="form-label">Descripción</label>
                <input class="form-control" v-model="itemForm.descripcion">
              </div>

              <div class="col-md-4">
                <label class="form-label">Código referencial</label>
                <input class="form-control" v-model="itemForm.codigo_referencial">
              </div>

              <div class="col-md-2">
                <label class="form-label">Cantidad</label>
                <input class="form-control" v-model.number="itemForm.cantidad" type="number" min="1">
              </div>

              <div class="col-md-2">
                <label class="form-label">Stock</label>
                <input class="form-control" v-model.number="itemForm.stock" type="number" min="0">
              </div>

              <div class="col-md-2">
                <label class="form-label">Prioridad</label>
                <select class="form-select" v-model="itemForm.prioridad">
                  <option>ALTA</option>
                  <option>MEDIA</option>
                  <option>BAJA</option>
                </select>
              </div>

              <div class="col-md-2">
                <label class="form-label">Estado</label>
                <select class="form-select" v-model="itemForm.estado">
                  <option>pendiente</option>
                  <option>parcial</option>
                  <option>completado</option>
                  <option>revisión</option>
                  <option>rechazado</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">N° interno</label>
                <input class="form-control" v-model="itemForm.numero_interno" placeholder="opcional">
              </div>

              <div class="col-md-6">
                <label class="form-label">Subir imagen (opcional)</label>
                <input id="inputImagenItem" type="file" class="form-control" accept="image/*" @change="onImagenItem">
                <div class="form-text">Se guarda en Storage.</div>
                <div v-if="itemForm.imagen_url" class="small mt-1">
                  <a :href="itemForm.imagen_url" target="_blank">Ver imagen</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="vmodal-footer">
          <button class="btn btn-soft-secondary" @click="cerrarModalItem">Cancelar</button>
          <button class="btn btn-brand" @click="guardarItemForm">
            Guardar ítem
          </button>
        </div>
      </div>
    </div>

    <!-- CONFIRM DELETE -->
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
            ¿Estás seguro que quieres eliminar la SOLPED
            <strong>#{{ confirmRow?.numero_solpe ?? '—' }}</strong>?
          </p>

          <div class="confirm-box">
            <div class="confirm-row">
              <span>Empresa</span>
              <strong>{{ confirmRow?.empresa || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Centro de costo</span>
              <strong>{{ confirmRow?.numero_contrato || '—' }} — {{ confirmRow?.nombre_centro_costo || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Fecha</span>
              <strong>{{ displayDate(confirmRow) }}</strong>
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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import {
  getStorage,
  ref as sref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { db } from "@/stores/firebase";

const router = useRouter();
const tz = "America/Santiago";

const SOLPES_COLLECTION = "solpeds_plantas";
const HISTORIAL_SUBCOL = "historialEstados";
const PAGE_SIZE = 10;

const ESTATUS_OPC = [
  "Pendiente",
  "Revisión",
  "Rechazado",
  "Aprobada",
  "En Proceso",
  "Completada"
];

const ESTADO_APROB_OPC = [
  "Pendiente",
  "Solped Aprobada",
  "Solped Rechazada"
];

const DIRIGIDO_OPCIONES = [
  "María José Ballesteros",
  "Ricardo Prouvay",
  "Rodrigo Baeza"
];

const centrosCosto = {
  "BETON_CALAMA": "PLANTA BETON CALAMA",
  "FLUMECAR_CALAMA": "PLANTA FLUMECAR CALAMA",
  "URBANA_CALAMA": "PLANTA URBANA CALAMA",
  "KM13_ANDINA": "PLANTA KM13 ANDINA",
  "NV17_ANDINA": "PLANTA NV17 ANDINA",
  "SAN_BERNARDO": "PLANTA SAN BERNANDO",
  "ARIDO_NOS": "PLANTA DE ÁRIDO NOS",
  "OLIVAR": "PLANTA OLIVAR",
  "CANECHE": "PLANTA CANECHE",
  "COLON": "PLANTA COLÓN",
  "AGUA_DULCE": "PLANTA AGUA DULCE",
  "ESMERALDA": "PLANTA ESMERALDA",
  "ESTOCADA_8": "PLANTA ESTOCADA 8",
  "OP14": "PLANTA OP14",
  "ANDES_NORTE": "PLANTA ANDES NORTE",
  "CHANCHADO": "PLANTA CHANCHADO",
};
const centrosOpts = Object.entries(centrosCosto).map(([k, v]) => ({ key: k, name: v }));

const rows = ref([]);
const cargando = ref(true);
const currentPage = ref(1);
const hasNextPage = ref(false);
const pageCursors = ref([]);
let unsubList = null;

const buscarNumero = ref("");
const busquedaActiva = ref(false);
let unsubSearch = null;

const filtroFecha = ref("");
const filtroUsuario = ref("");
const filtroEstatus = ref([]);
const filtroEstatusHeader = ref("");
const filtroEstadoAprob = ref("");
let unsubFilter = null;

const usuariosOpts = ref([]);
let unsubUsuarios = null;
const usuariosLoading = ref(false);
const usuariosLoadedOnce = ref(false);

const mobileFiltersOpen = ref(false);

const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);

const selectedCentroEditKey = ref("");
const selectedCentroEditName = ref("");

const historialEstadosLive = ref([]);
let unsubHistorial = null;
const guardandoHist = ref(false);
const histForm = ref({
  fechaInput: "",
  estatus: "",
  comentario: "",
  usuario: ""
});

const modalNueva = ref(false);
const guardandoNueva = ref(false);
const nuevo = ref({});
const selectedCentroNuevoKey = ref("");
const selectedCentroNuevoName = ref("");

const archivosAutorizacionEdit = ref([]);
const archivosAutorizacionNuevo = ref([]);
const inputAutorizacionEditEl = ref(null);
const inputAutorizacionNuevoEl = ref(null);

const modalItem = ref(false);
const itemForm = ref({
  item: 1,
  descripcion: "",
  codigo_referencial: "",
  cantidad: 1,
  stock: 0,
  prioridad: "MEDIA",
  estado: "pendiente",
  numero_interno: "",
  imagen_url: ""
});
const isEditItem = ref(false);
const itemIndex = ref(-1);
const itemModeNuevo = ref(false);

const confirmOpen = ref(false);
const confirmRow = ref(null);
const eliminando = ref(false);

const toasts = ref([]);

const hasActiveFilters = computed(() =>
  !!filtroFecha.value ||
  !!filtroUsuario.value ||
  !!filtroEstadoAprob.value ||
  (filtroEstatus.value?.length || 0) > 0
);

const totalFiltrosActivos = computed(() => {
  let n = 0;
  if (filtroFecha.value) n++;
  if (filtroUsuario.value) n++;
  if (filtroEstadoAprob.value) n++;
  n += (filtroEstatus.value?.length || 0);
  return n;
});

const visiblePageButtons = computed(() => {
  const arr = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = currentPage.value + 2;
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
});

function addToast(type, text, timeout = 2600) {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
}
function closeToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function cleanupSubs() {
  if (unsubList) { unsubList(); unsubList = null; }
  if (unsubSearch) { unsubSearch(); unsubSearch = null; }
  if (unsubFilter) { unsubFilter(); unsubFilter = null; }
  if (unsubUsuarios) { unsubUsuarios(); unsubUsuarios = null; }
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
}

function slugEmpresa(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
}

function safeFileName(name) {
  return String(name || "archivo")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_");
}

function prettyBytes(bytes) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function badgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  if (s.includes("pendiente")) return "bg-secondary-subtle text-secondary-emphasis";
  if (s.includes("proceso")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("complet")) return "bg-primary-subtle text-primary-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
}

function badgeEstadoClass(estado) {
  const e = String(estado || "Pendiente").toLowerCase();
  if (e.includes("aprobada") || e === "aprobado") return "bg-success-subtle text-success-emphasis";
  if (e.includes("rechazada") || e === "rechazado") return "bg-danger-subtle text-danger-emphasis";
  return "bg-warning-subtle text-warning-emphasis";
}

function toInputLocal(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toCLString(date) {
  try {
    return new Date(date).toLocaleString("es-CL", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  } catch {
    return "";
  }
}

function formatTimestampEditable(ts) {
  const d = asDateAny(ts);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeUpdatedAtInput(v) {
  const raw = String(v || "").replace(/\D/g, "").slice(0, 14);
  if (!raw) return "";
  const yyyy = raw.slice(0, 4);
  const mm = raw.slice(4, 6);
  const dd = raw.slice(6, 8);
  const hh = raw.slice(8, 10);
  const mi = raw.slice(10, 12);
  const ss = raw.slice(12, 14);
  let out = yyyy;
  if (mm) out += `/${mm}`;
  if (dd) out += `/${dd}`;
  if (hh) out += ` ${hh}`;
  if (mi) out += `:${mi}`;
  if (ss) out += `:${ss}`;
  return out;
}

function parseUpdatedAtInput(v) {
  const s = String(v || "").trim();
  const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));
  return isNaN(dt.getTime()) ? null : Timestamp.fromDate(dt);
}

function onUpdatedAtInput(ev) {
  edit.value.updated_at_input = normalizeUpdatedAtInput(ev?.target?.value ?? "");
}

function asDateAny(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v?.seconds === "number") {
    const d = new Date(v.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toCL(date) {
  try {
    return new Date(date).toLocaleString("es-CL", {
      timeZone: tz,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } catch {
    return "";
  }
}

function displayDate(row) {
  const d = asDateAny(row?.fecha_ts) || asDateAny(row?.fecha_str) || asDateAny(row?.fecha);
  return d ? toCL(d) : "—";
}

function prettyFecha(v) {
  const d = asDateAny(v);
  return d ? toCL(d) : "—";
}

function displayTs(v) {
  return prettyFecha(v);
}

function normalizeAdjuntosFromRow(row) {
  if (Array.isArray(row?.autorizaciones)) {
    return row.autorizaciones.map((a) => ({
      nombre: a?.nombre ?? "archivo",
      tamano: Number(a?.tamano ?? a?.size ?? 0) || 0,
      tipo: a?.tipo ?? a?.contentType ?? "",
      url: a?.url ?? a?.downloadURL ?? null,
      comentarios: Array.isArray(a?.comentarios) ? a.comentarios : []
    }));
  }
  if (row?.autorizacion_url || row?.autorizacion_nombre) {
    return [{
      nombre: row.autorizacion_nombre || "autorizacion",
      tamano: Number(row.autorizacion_size ?? 0) || 0,
      tipo: row.autorizacion_contentType || "",
      url: row.autorizacion_url || null,
      comentarios: []
    }];
  }
  return [];
}

async function uploadAdjuntos({ solpeId, empresa, numero_solpe }, files) {
  if (!files?.length) return [];

  const empresaSlug = slugEmpresa(empresa);
  const folio = (numero_solpe != null && numero_solpe !== "" && !isNaN(Number(numero_solpe)))
    ? String(Number(numero_solpe))
    : String(solpeId);

  const baseFolder = `solped_adjuntos/${empresaSlug}_${folio}`;
  const batchFolder = `${Date.now()}`;

  const results = [];
  for (const f of files) {
    const fileName = safeFileName(f.name);
    const path = `${baseFolder}/${batchFolder}/${fileName}`;

    const refStorage = sref(getStorage(), path);
    const up = await uploadBytes(refStorage, f);
    const url = await getDownloadURL(up.ref);

    results.push({
      nombre: f.name || fileName,
      tamano: Number(f.size || 0),
      tipo: f.type || "",
      url,
      comentarios: []
    });
  }
  return results;
}

function setCentroFromKey(targetObj, key) {
  if (!key || !centrosCosto[key]) {
    targetObj.numero_contrato = "";
    targetObj.nombre_centro_costo = "";
    return;
  }
  targetObj.numero_contrato = key;
  targetObj.nombre_centro_costo = centrosCosto[key];
}
function setCentroFromName(targetObj, name) {
  if (!name) { setCentroFromKey(targetObj, ""); return ""; }
  const key = Object.keys(centrosCosto).find(k => centrosCosto[k] === name) || "";
  setCentroFromKey(targetObj, key);
  return key;
}
function onCentroEditKeyChange() {
  setCentroFromKey(edit.value, selectedCentroEditKey.value);
  selectedCentroEditName.value = edit.value.nombre_centro_costo || "";
}
function onCentroEditNameChange() {
  const key = setCentroFromName(edit.value, selectedCentroEditName.value);
  selectedCentroEditKey.value = key;
}
function onCentroNuevoKeyChange() {
  setCentroFromKey(nuevo.value, selectedCentroNuevoKey.value);
  selectedCentroNuevoName.value = nuevo.value.nombre_centro_costo || "";
}
function onCentroNuevoNameChange() {
  const key = setCentroFromName(nuevo.value, selectedCentroNuevoName.value);
  selectedCentroNuevoKey.value = key;
}

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
        ? query(collection(db, SOLPES_COLLECTION), orderBy("usuario"), startAfter(cursor), limit(PAGE))
        : query(collection(db, SOLPES_COLLECTION), orderBy("usuario"), limit(PAGE));

      const snap = await getDocs(qy);
      if (snap.empty) break;

      snap.forEach((d) => {
        const u = (d.data()?.usuario || "").toString().trim();
        if (u) set.add(u);
      });

      cursor = snap.docs[snap.docs.length - 1];
      if (snap.size < PAGE) break;
    }

    usuariosOpts.value = Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
    usuariosLoadedOnce.value = true;
  } catch (e) {
    console.error(e);
    addToast("warning", "No se pudieron cargar usuarios.");
  } finally {
    usuariosLoading.value = false;
  }
}

function cargarUsuarios() {
  try {
    const qy = query(collection(db, SOLPES_COLLECTION), orderBy("usuario"), limit(500));
    unsubUsuarios = onSnapshot(qy, (snap) => {
      const set = new Set();
      snap.forEach((d) => {
        const u = (d.data()?.usuario || "").toString().trim();
        if (u) set.add(u);
      });
      usuariosOpts.value = Array.from(set);
    });
  } catch (e) {
    console.error(e);
    addToast("warning", "No se pudieron cargar los usuarios para el filtro.");
  }
  return cargarUsuariosCreadoras();
}

function subscribePage(page) {
  cleanupSubs();
  cargarUsuarios();
  cargando.value = true;
  busquedaActiva.value = false;

  let qy;
  if (page === 1) {
    qy = query(collection(db, SOLPES_COLLECTION), orderBy("numero_solpe", "desc"), limit(PAGE_SIZE + 1));
  } else {
    const prevCursor = pageCursors.value[page - 2];
    if (!prevCursor) { cargando.value = false; return; }
    qy = query(
      collection(db, SOLPES_COLLECTION),
      orderBy("numero_solpe", "desc"),
      startAfter(prevCursor),
      limit(PAGE_SIZE + 1)
    );
  }

  unsubList = onSnapshot(qy, (snap) => {
    const arr = [];
    const snaps = [];
    snap.forEach((d) => { arr.push({ __id: d.id, ...d.data() }); snaps.push(d); });
    hasNextPage.value = arr.length > PAGE_SIZE;

    const pageDocs = arr.slice(0, PAGE_SIZE);
    rows.value = pageDocs;

    const lastSnap = snaps[pageDocs.length - 1];
    if (lastSnap) pageCursors.value[page - 1] = lastSnap;

    cargando.value = false;
  }, (err) => {
    console.error("onSnapshot page:", err);
    addToast("danger", "Error listando SOLPED Plantas.");
    cargando.value = false;
  });
}

function buildFilterQuery() {
  const wh = [where("tipo_flujo", "==", "planta")];

  if (filtroFecha.value) {
    const ini = new Date(`${filtroFecha.value}T00:00:00`);
    const fin = new Date(`${filtroFecha.value}T23:59:59`);
    wh.push(where("createdAt", ">=", Timestamp.fromDate(ini)));
    wh.push(where("createdAt", "<=", Timestamp.fromDate(fin)));
  }

  if (filtroUsuario.value) wh.push(where("usuario", "==", filtroUsuario.value));
  if (filtroEstadoAprob.value) wh.push(where("estadoAprobacionSolped", "==", filtroEstadoAprob.value));
  if (filtroEstatus.value?.length === 1) wh.push(where("estatus", "==", filtroEstatus.value[0]));

  return query(collection(db, SOLPES_COLLECTION), ...wh, orderBy("createdAt", "desc"), limit(100));
}

function aplicarFiltros() {
  if (!hasActiveFilters.value) {
    currentPage.value = 1;
    subscribePage(1);
    return;
  }

  cleanupSubs();
  cargando.value = true;
  busquedaActiva.value = false;

  try {
    const qy = buildFilterQuery();
    unsubFilter = onSnapshot(qy, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ __id: d.id, ...d.data() }));

      if (filtroEstatus.value?.length > 1) {
        arr = arr.filter(r => filtroEstatus.value.includes(r.estatus));
      }

      rows.value = arr;
      cargando.value = false;
    }, (e) => {
      console.error(e);
      addToast("danger", "No se pudieron aplicar filtros.");
      cargando.value = false;
    });
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudieron aplicar filtros.");
    cargando.value = false;
  }
}

function limpiarFiltros() {
  filtroFecha.value = "";
  filtroUsuario.value = "";
  filtroEstatus.value = [];
  filtroEstatusHeader.value = "";
  filtroEstadoAprob.value = "";
  if (busquedaActiva.value) limpiarBusqueda();
  else aplicarFiltros();
}

function removeEstatus(es) {
  filtroEstatus.value = filtroEstatus.value.filter(x => x !== es);
  if (!filtroEstatus.value.length) filtroEstatusHeader.value = "";
  aplicarFiltros();
}

function onChangeEstatusHeader() {
  filtroEstatus.value = filtroEstatusHeader.value ? [filtroEstatusHeader.value] : [];
}

function mobileApplyFilters() {
  aplicarFiltros();
  mobileFiltersOpen.value = false;
}

function goToPage(n) {
  if (hasActiveFilters.value || busquedaActiva.value) return;
  if (n < 1) return;
  if (n > currentPage.value + 1 && !hasNextPage.value) return;
  currentPage.value = n;
  subscribePage(n);
}

function onBuscarNumero() {
  const qstr = (buscarNumero.value ?? "").trim();
  if (!qstr) { limpiarBusqueda(); return; }
  const n = parseInt(qstr, 10);
  if (isNaN(n)) { addToast("warning", "Ingresa un número válido."); return; }

  cleanupSubs();
  cargando.value = true;
  busquedaActiva.value = true;

  try {
    const qy = query(collection(db, SOLPES_COLLECTION), where("numero_solpe", "==", n), limit(30));
    unsubSearch = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ __id: d.id, ...d.data() }));
      rows.value = arr;
      cargando.value = false;
    }, (e) => {
      console.error(e);
      addToast("danger", "No se pudo buscar la SOLPED.");
      cargando.value = false;
    });
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo buscar la SOLPED.");
    cargando.value = false;
  }
}

function limpiarBusqueda() {
  buscarNumero.value = "";
  busquedaActiva.value = false;
  if (hasActiveFilters.value) aplicarFiltros();
  else {
    currentPage.value = 1;
    subscribePage(1);
  }
}

function subscribeHistorialEstados(solpeId) {
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
  try {
    const qy = query(
      collection(db, SOLPES_COLLECTION, solpeId, HISTORIAL_SUBCOL),
      orderBy("fecha", "desc"),
      limit(100)
    );
    unsubHistorial = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ __id: d.id, ...d.data() }));
      historialEstadosLive.value = arr;
    }, (err) => {
      console.error("historialEstados:", err);
      addToast("warning", "No se pudo cargar historial.");
    });
  } catch (e) {
    console.error(e);
    addToast("warning", "No se pudo suscribir al historial.");
  }
}

function resetHistForm() {
  histForm.value = {
    fechaInput: toInputLocal(new Date()),
    estatus: "",
    comentario: "",
    usuario: edit.value?.usuario || ""
  };
}

function pickRowDate(row) {
  try {
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
    if (row?.createdAt?.toDate) return row.createdAt.toDate();
  } catch {
    return null;
  }
  return null;
}

function abrirEditor(row) {
  seleccion.value = row;

  const d = pickRowDate(row);
  const originalTs = row?.fecha_ts ?? (d ? Timestamp.fromDate(d) : null);
  const originalStr = row?.fecha_str ?? row?.fecha ?? (d ? toCLString(d) : "");

  edit.value = {
    fechaInput: d ? toInputLocal(d) : "",
    __fecha_ts: originalTs,
    __fecha_str: originalStr,
    updated_at_input: formatTimestampEditable(row?.updated_at),
    __updated_at_original: row?.updated_at ?? null,

    autorizaciones: normalizeAdjuntosFromRow(row),

    dirigidoA: Array.isArray(row.dirigidoA) ? [...row.dirigidoA] : [],
    empresa: row.empresa ?? "Xtreme Servicio",
    estatus: row.estatus ?? "Pendiente",
    estadoAprobacionSolped: row.estadoAprobacionSolped ?? "Pendiente",
    comentario_aprobacion_solped: row.comentario_aprobacion_solped ?? "",
    fecha_aprobacion_solped: row.fecha_aprobacion_solped ?? null,
    aprobadorSolped: row.aprobadorSolped ?? "",
    usuario_aprobacion_solped: row.usuario_aprobacion_solped ?? "",
    dias_estimados_gestion: Number(row.dias_estimados_gestion ?? 1),
    prioridad_solped: row.prioridad_solped ?? "MEDIA",
    requiereAprobacionSolped: !!row.requiereAprobacionSolped,
    tipo_flujo: row.tipo_flujo ?? "planta",

    numero_solpe: Number(row.numero_solpe ?? 0),
    numero_contrato: row.numero_contrato ?? "",
    nombre_centro_costo: row.nombre_centro_costo ?? "",
    usuario: row.usuario ?? "",
    tipo_solped: row.tipo_solped ?? "",
    nombre_solped: row.nombre_solped ?? "",
    items: Array.isArray(row.items) ? row.items.map((it, i) => ({
      item: Number(it.item ?? i + 1),
      descripcion: it.descripcion ?? "",
      cantidad: Number(it.cantidad ?? 0),
      stock: Number(it.stock ?? 0),
      prioridad: it.prioridad ?? "MEDIA",
      codigo_referencial: it.codigo_referencial ?? "",
      estado: it.estado ?? "pendiente",
      numero_interno: it.numero_interno ?? "",
      imagen_url: it.imagen_url ?? ""
    })) : []
  };

  selectedCentroEditKey.value = edit.value.numero_contrato || "";
  selectedCentroEditName.value = edit.value.nombre_centro_costo || "";

  editorAbierto.value = true;
  subscribeHistorialEstados(row.__id);
  resetHistForm();
}

function cerrarEditor() {
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  historialEstadosLive.value = [];
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
}

function abrirSelectorAutorizacionEdit() {
  inputAutorizacionEditEl.value?.click?.();
}
function abrirSelectorAutorizacionNuevo() {
  inputAutorizacionNuevoEl.value?.click?.();
}
function onArchivosAutorizacionEdit(ev) {
  const files = Array.from(ev?.target?.files || []);
  archivosAutorizacionEdit.value.push(...files);
  ev.target.value = "";
}
function onArchivosAutorizacionNuevo(ev) {
  const files = Array.from(ev?.target?.files || []);
  archivosAutorizacionNuevo.value.push(...files);
  ev.target.value = "";
}
function removeAdjuntoEdit(i) {
  edit.value.autorizaciones.splice(i, 1);
}
function removePendingEdit(i) {
  archivosAutorizacionEdit.value.splice(i, 1);
}
function removePendingNuevo(i) {
  archivosAutorizacionNuevo.value.splice(i, 1);
}

async function guardarHistorial() {
  if (!seleccion.value?.__id) return;
  if (!histForm.value.estatus?.trim()) {
    addToast("warning", "Debes indicar un estatus para el historial.");
    return;
  }

  guardandoHist.value = true;
  try {
    await addDoc(collection(db, SOLPES_COLLECTION, seleccion.value.__id, HISTORIAL_SUBCOL), {
      fecha: histForm.value.fechaInput ? Timestamp.fromDate(new Date(histForm.value.fechaInput)) : Timestamp.now(),
      estatus: histForm.value.estatus || "",
      comentario: histForm.value.comentario || "",
      usuario: histForm.value.usuario || edit.value.usuario || "ADMIN"
    });
    resetHistForm();
    addToast("success", "Historial agregado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar historial.");
  } finally {
    guardandoHist.value = false;
  }
}

async function eliminarHistorialDoc(id) {
  if (!seleccion.value?.__id || !id) return;
  try {
    await deleteDoc(doc(db, SOLPES_COLLECTION, seleccion.value.__id, HISTORIAL_SUBCOL, id));
    addToast("success", "Registro de historial eliminado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar historial.");
  }
}

async function guardarEdicion() {
  if (!seleccion.value?.__id) return;

  guardando.value = true;
  try {
    let nuevosAdjuntos = [];
    if (archivosAutorizacionEdit.value.length) {
      nuevosAdjuntos = await uploadAdjuntos(
        {
          solpeId: seleccion.value.__id,
          empresa: edit.value.empresa,
          numero_solpe: edit.value.numero_solpe
        },
        archivosAutorizacionEdit.value
      );
    }

    const fechaBase = edit.value.fechaInput ? new Date(edit.value.fechaInput) : pickRowDate(seleccion.value) || new Date();
    const updatedAtTs = parseUpdatedAtInput(edit.value.updated_at_input);

    const payload = {
      numero_solpe: Number(edit.value.numero_solpe ?? 0),
      empresa: edit.value.empresa ?? "Xtreme Servicio",
      estatus: edit.value.estatus ?? "Pendiente",
      estadoAprobacionSolped: edit.value.estadoAprobacionSolped ?? "Pendiente",
      comentario_aprobacion_solped: edit.value.comentario_aprobacion_solped ?? "",
      aprobadorSolped: edit.value.aprobadorSolped ?? "",
      usuario_aprobacion_solped: edit.value.usuario_aprobacion_solped ?? "",
      dias_estimados_gestion: Number(edit.value.dias_estimados_gestion ?? 1),
      prioridad_solped: edit.value.prioridad_solped ?? "MEDIA",
      requiereAprobacionSolped: !!edit.value.requiereAprobacionSolped,
      tipo_flujo: "planta",

      fecha: edit.value.fechaInput || "",
      fecha_ts: Timestamp.fromDate(fechaBase),
      fecha_str: edit.value.__fecha_str || toCLString(fechaBase),

      numero_contrato: edit.value.numero_contrato ?? "",
      nombre_centro_costo: edit.value.nombre_centro_costo ?? "",
      usuario: edit.value.usuario ?? "",
      tipo_solped: edit.value.tipo_solped ?? "",
      nombre_solped: edit.value.nombre_solped ?? "",
      dirigidoA: Array.isArray(edit.value.dirigidoA) ? edit.value.dirigidoA : [],
      autorizaciones: [...(Array.isArray(edit.value.autorizaciones) ? edit.value.autorizaciones : []), ...nuevosAdjuntos],
      items: (Array.isArray(edit.value.items) ? edit.value.items : []).map((it, idx) => ({
        item: Number(it.item ?? idx + 1),
        descripcion: it.descripcion ?? "",
        cantidad: Number(it.cantidad ?? 0),
        stock: Number(it.stock ?? 0),
        prioridad: it.prioridad ?? "MEDIA",
        codigo_referencial: it.codigo_referencial ?? "",
        estado: it.estado ?? "pendiente",
        numero_interno: it.numero_interno ?? "",
        imagen_url: it.imagen_url ?? ""
      }))
    };

    if (updatedAtTs) payload.updated_at = updatedAtTs;

    if (
      payload.estadoAprobacionSolped === "Solped Aprobada" ||
      payload.estadoAprobacionSolped === "Solped Rechazada"
    ) {
      payload.fecha_aprobacion_solped = edit.value.fecha_aprobacion_solped || Timestamp.now();
    }

    await updateDoc(doc(db, SOLPES_COLLECTION, seleccion.value.__id), payload);

    archivosAutorizacionEdit.value = [];
    addToast("success", "SOLPED Plantas actualizada.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar la edición.");
  } finally {
    guardando.value = false;
  }
}

function defaultNuevo() {
  const now = new Date();
  return {
    numero_solpe: null,
    fechaInput: toInputLocal(now),
    empresa: "Xtreme Servicio",
    estatus: "Pendiente",
    estadoAprobacionSolped: "Pendiente",
    comentario_aprobacion_solped: "",
    fecha_aprobacion_solped: null,
    aprobadorSolped: "",
    usuario_aprobacion_solped: "",
    dias_estimados_gestion: 1,
    prioridad_solped: "MEDIA",
    requiereAprobacionSolped: false,
    tipo_flujo: "planta",
    numero_contrato: "",
    nombre_centro_costo: "",
    usuario: "",
    tipo_solped: "",
    nombre_solped: "",
    dirigidoA: [],
    autorizaciones: [],
    items: []
  };
}

function abrirModalNueva() {
  nuevo.value = defaultNuevo();
  selectedCentroNuevoKey.value = "";
  selectedCentroNuevoName.value = "";
  archivosAutorizacionNuevo.value = [];
  modalNueva.value = true;
}

function cerrarModalNueva() {
  modalNueva.value = false;
  nuevo.value = {};
  archivosAutorizacionNuevo.value = [];
}

async function crearNueva() {
  guardandoNueva.value = true;
  try {
    const fechaBase = nuevo.value.fechaInput ? new Date(nuevo.value.fechaInput) : new Date();

    const payloadBase = {
      numero_solpe: Number(nuevo.value.numero_solpe ?? 0),
      empresa: nuevo.value.empresa ?? "Xtreme Servicio",
      estatus: nuevo.value.estatus ?? "Pendiente",
      estadoAprobacionSolped: nuevo.value.estadoAprobacionSolped ?? "Pendiente",
      comentario_aprobacion_solped: nuevo.value.comentario_aprobacion_solped ?? "",
      fecha_aprobacion_solped: null,
      aprobadorSolped: nuevo.value.aprobadorSolped ?? "",
      usuario_aprobacion_solped: nuevo.value.usuario_aprobacion_solped ?? "",
      dias_estimados_gestion: Number(nuevo.value.dias_estimados_gestion ?? 1),
      prioridad_solped: nuevo.value.prioridad_solped ?? "MEDIA",
      requiereAprobacionSolped: !!nuevo.value.requiereAprobacionSolped,
      tipo_flujo: "planta",

      fecha: nuevo.value.fechaInput || "",
      fecha_ts: Timestamp.fromDate(fechaBase),
      fecha_str: Timestamp.fromDate(fechaBase),
      createdAt: Timestamp.now(),

      numero_contrato: nuevo.value.numero_contrato ?? "",
      nombre_centro_costo: nuevo.value.nombre_centro_costo ?? "",
      usuario: nuevo.value.usuario ?? "",
      tipo_solped: nuevo.value.tipo_solped ?? "",
      nombre_solped: nuevo.value.nombre_solped ?? "",

      dirigidoA: Array.isArray(nuevo.value.dirigidoA) ? nuevo.value.dirigidoA : [],
      autorizaciones: [],
      items: (Array.isArray(nuevo.value.items) ? nuevo.value.items : []).map((it, idx) => ({
        item: Number(it.item ?? idx + 1),
        descripcion: it.descripcion ?? "",
        cantidad: Number(it.cantidad ?? 0),
        stock: Number(it.stock ?? 0),
        prioridad: it.prioridad ?? "MEDIA",
        codigo_referencial: it.codigo_referencial ?? "",
        estado: it.estado ?? "pendiente",
        numero_interno: it.numero_interno ?? "",
        imagen_url: it.imagen_url ?? ""
      }))
    };

    const refNew = await addDoc(collection(db, SOLPES_COLLECTION), payloadBase);

    if (archivosAutorizacionNuevo.value.length) {
      const adj = await uploadAdjuntos(
        {
          solpeId: refNew.id,
          empresa: payloadBase.empresa,
          numero_solpe: payloadBase.numero_solpe
        },
        archivosAutorizacionNuevo.value
      );
      await updateDoc(doc(db, SOLPES_COLLECTION, refNew.id), { autorizaciones: adj });
    }

    await addDoc(collection(db, SOLPES_COLLECTION, refNew.id, HISTORIAL_SUBCOL), {
      fecha: Timestamp.now(),
      estatus: payloadBase.estadoAprobacionSolped || payloadBase.estatus || "Pendiente",
      comentario: "Creación de SOLPED de plantas",
      usuario: payloadBase.usuario || "ADMIN"
    });

    addToast("success", "SOLPED Plantas creada.");
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la SOLPED.");
  } finally {
    guardandoNueva.value = false;
  }
}

function abrirModalItem(it = null, idx = -1) {
  itemModeNuevo.value = false;
  isEditItem.value = idx >= 0;
  itemIndex.value = idx;
  itemForm.value = it
    ? {
        item: Number(it.item ?? 1),
        descripcion: it.descripcion ?? "",
        codigo_referencial: it.codigo_referencial ?? "",
        cantidad: Number(it.cantidad ?? 1),
        stock: Number(it.stock ?? 0),
        prioridad: it.prioridad ?? "MEDIA",
        estado: it.estado ?? "pendiente",
        numero_interno: it.numero_interno ?? "",
        imagen_url: it.imagen_url ?? ""
      }
    : {
        item: (edit.value.items?.length || 0) + 1,
        descripcion: "",
        codigo_referencial: "",
        cantidad: 1,
        stock: 0,
        prioridad: "MEDIA",
        estado: "pendiente",
        numero_interno: "",
        imagen_url: ""
      };
  modalItem.value = true;
}

function abrirModalItemNuevo(it = null, idx = -1) {
  itemModeNuevo.value = true;
  isEditItem.value = idx >= 0;
  itemIndex.value = idx;
  itemForm.value = it
    ? {
        item: Number(it.item ?? 1),
        descripcion: it.descripcion ?? "",
        codigo_referencial: it.codigo_referencial ?? "",
        cantidad: Number(it.cantidad ?? 1),
        stock: Number(it.stock ?? 0),
        prioridad: it.prioridad ?? "MEDIA",
        estado: it.estado ?? "pendiente",
        numero_interno: it.numero_interno ?? "",
        imagen_url: it.imagen_url ?? ""
      }
    : {
        item: (nuevo.value.items?.length || 0) + 1,
        descripcion: "",
        codigo_referencial: "",
        cantidad: 1,
        stock: 0,
        prioridad: "MEDIA",
        estado: "pendiente",
        numero_interno: "",
        imagen_url: ""
      };
  modalItem.value = true;
}

function cerrarModalItem() {
  modalItem.value = false;
  itemIndex.value = -1;
  isEditItem.value = false;
}

async function onImagenItem(ev) {
  try {
    const file = ev?.target?.files?.[0];
    if (!file) return;

    const storage = getStorage();
    const path = `solped_images/${Date.now()}_${safeFileName(file.name)}`;
    const refStorage = sref(storage, path);
    const up = await uploadBytes(refStorage, file);
    const url = await getDownloadURL(up.ref);
    itemForm.value.imagen_url = url;
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo subir la imagen del ítem.");
  }
}

function guardarItemForm() {
  const normalized = {
    ...itemForm.value,
    item: Number(itemForm.value.item ?? 0),
    cantidad: Number(itemForm.value.cantidad ?? 0),
    stock: Number(itemForm.value.stock ?? 0),
    prioridad: itemForm.value.prioridad ?? "MEDIA",
    estado: itemForm.value.estado ?? "pendiente"
  };

  if (itemModeNuevo.value) {
    if (!Array.isArray(nuevo.value.items)) nuevo.value.items = [];
    if (isEditItem.value && itemIndex.value >= 0) nuevo.value.items.splice(itemIndex.value, 1, normalized);
    else nuevo.value.items.push(normalized);
  } else {
    if (!Array.isArray(edit.value.items)) edit.value.items = [];
    if (isEditItem.value && itemIndex.value >= 0) edit.value.items.splice(itemIndex.value, 1, normalized);
    else edit.value.items.push(normalized);
  }

  modalItem.value = false;
}

function eliminarItem(idx) {
  edit.value.items.splice(idx, 1);
}
function eliminarItemNuevo(idx) {
  nuevo.value.items.splice(idx, 1);
}

function abrirConfirm(r) {
  confirmRow.value = r;
  confirmOpen.value = true;
}
function cerrarConfirm() {
  confirmOpen.value = false;
  confirmRow.value = null;
}
async function confirmarEliminar() {
  if (!confirmRow.value?.__id) return;
  eliminando.value = true;
  try {
    await deleteDoc(doc(db, SOLPES_COLLECTION, confirmRow.value.__id));
    addToast("success", "SOLPED eliminada.");
    cerrarConfirm();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar la SOLPED.");
  } finally {
    eliminando.value = false;
  }
}

function irADetalle(r) {
  router.push({ name: "SolpedDetallePlantas", params: { id: r.__id } });
}

onMounted(() => {
  subscribePage(1);
});
onBeforeUnmount(() => {
  cleanupSubs();
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

.minw-320 {
  min-width: 320px;
}

.minw-220 {
  min-width: 220px;
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

.chip-blue {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.10);
  border-color: rgba(37, 99, 235, 0.14);
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

.chip-x.dark {
  color: #0f172a;
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

.solpes-table,
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

.solpe-mobile-card,
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
  width: min(1040px, 100%);
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

.checks-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
}

.pro-list-group .list-group-item,
.mini-card {
  border-radius: 16px !important;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255,255,255,0.86);
  margin-bottom: 0.5rem;
}

.mini-card {
  padding: 1rem;
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

.text-truncate-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-truncate-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
