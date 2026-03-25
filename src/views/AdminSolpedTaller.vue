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
            <h1 class="hero-title mb-1">Admin · SOLPED Taller</h1>
            <p class="hero-subtitle mb-0">
              Administra SOLPED de taller, filtra por solicitante, fecha y estatus, y edita sus detalles desde una vista más clara y profesional.
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

            <button class="btn btn-soft-primary btn-toolbar" @click="abrirFiltros">
              <i class="bi bi-funnel me-1"></i> Filtros
              <span v-if="hasActiveFilters" class="badge rounded-pill bg-primary-subtle text-primary-emphasis ms-2">
                {{ totalFiltrosActivos }}
              </span>
            </button>

            <button class="btn btn-brand btn-toolbar" @click="abrirModalNueva">
              <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED (Taller)
            </button>

            <button
              v-if="busquedaActiva"
              class="btn btn-soft-danger btn-toolbar"
              @click="limpiarBusqueda"
              title="Limpiar búsqueda"
              type="button"
            >
              <i class="bi bi-x-lg me-1"></i> Limpiar
            </button>
          </div>
        </div>
      </section>

      <!-- RESUMEN -->
      <section class="stats-strip mb-4">
        <div class="stat-pill">
          <div class="stat-icon stat-icon-blue">
            <i class="bi bi-clipboard-data"></i>
          </div>
          <div>
            <div class="stat-label">Registros visibles</div>
            <div class="stat-value">{{ rows.length }}</div>
          </div>
        </div>

        <div class="stat-pill" v-if="busquedaActiva">
          <div class="stat-icon stat-icon-emerald">
            <i class="bi bi-search"></i>
          </div>
          <div>
            <div class="stat-label">Búsqueda activa</div>
            <div class="stat-value"># {{ buscarNumero || '—' }}</div>
          </div>
        </div>

        <div class="stat-pill" v-if="hasActiveFilters">
          <div class="stat-icon stat-icon-slate">
            <i class="bi bi-funnel"></i>
          </div>
          <div>
            <div class="stat-label">Filtros activos</div>
            <div class="stat-value">{{ totalFiltrosActivos }}</div>
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

        <span v-if="filtroSolicitante" class="chip chip-slate">
          Solicitante: {{ filtroSolicitante }}
          <span class="text-secondary ms-1">({{ filtroSolicExacto ? 'exacto' : 'contiene' }})</span>
          <button class="chip-x" @click="filtroSolicitante=''; aplicarFiltros()">×</button>
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
      <section class="list-shell">
        <div class="list-header">
          <div>
            <div class="list-title">
              Listado
              <span v-if="!hasActiveFilters && !busquedaActiva" class="text-secondary small ms-2">
                ({{ rows.length }} / pág.)
              </span>
            </div>
            <div class="list-subtitle">
              <span v-if="hasActiveFilters || busquedaActiva">Paginación desactivada por filtros o búsqueda.</span>
              <span v-else>Visualiza, edita o elimina SOLPED Taller desde el panel principal.</span>
            </div>
          </div>
        </div>

        <!-- TABLA DESKTOP -->
        <div class="table-responsive d-none d-md-block">
          <table class="table solpes-table align-middle mb-0">
            <thead class="table-head-pro">
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
                <td colspan="6" class="text-center py-5">
                  <div class="loading-wrap">
                    <div class="spinner-border" role="status"></div>
                    <div class="small text-secondary mt-3">Cargando…</div>
                  </div>
                </td>
              </tr>

              <tr v-else-if="rows.length === 0">
                <td colspan="6" class="text-center py-5">
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
                      <div class="provider-name text-truncate">{{ r.centro_costo || '—' }}</div>
                      <div class="provider-address text-truncate">
                        Solicitante: {{ r.nombre_solicitante || '—' }}
                      </div>
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
                  <div class="date-badge">{{ r.fecha || '—' }}</div>
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

        <!-- LISTADO MOBILE -->
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
                  <div class="provider-address">{{ r.fecha || '—' }}</div>
                </div>
                <span class="badge status-badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>

              <div class="mobile-card-body">
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Centro costo</span>
                  <span class="mobile-info-value text-truncate">{{ r.centro_costo || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Empresa</span>
                  <span class="mobile-info-value text-truncate">{{ r.empresa || '—' }}</span>
                </div>
                <div class="mobile-info-row">
                  <span class="mobile-info-label">Solicitante</span>
                  <span class="mobile-info-value text-truncate">{{ r.nombre_solicitante || '—' }}</span>
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
        <div class="card-footer-pro" v-if="!busquedaActiva && !hasActiveFilters">
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
      </section>

      <!-- TOASTS -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div v-if="filtrosAbiertos" class="offcanvas-backdrop" @click.self="cerrarFiltros">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div>
            <div class="modal-kicker">Opciones</div>
            <div class="fw-bold fs-5"><i class="bi bi-funnel me-2"></i>Filtros · SOLPED Taller</div>
          </div>
          <button class="btn-close" @click="cerrarFiltros"></button>
        </div>

        <div class="offcanvas-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Fecha</label>
                <input class="form-control modern-input" type="date" v-model="filtroFecha">
              </div>

              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <label class="form-label mb-0 fw-semibold">
                    <i class="bi bi-person-badge me-1 text-primary"></i>
                    Solicitante
                  </label>

                  <span class="chip chip-slate">
                    <i class="bi bi-collection me-1"></i>
                    {{ solicitantesOpts.length }}
                  </span>
                </div>

                <div class="input-group">
                  <span class="input-group-text bg-white">
                    <i class="bi bi-search text-muted"></i>
                  </span>

                  <input
                    class="form-control modern-input"
                    v-model.trim="filtroSolicitante"
                    placeholder="Buscar o seleccionar… (ej: FRANK PINTO)"
                    list="solicitantesList"
                    autocomplete="off"
                  >

                  <button
                    v-if="filtroSolicitante"
                    class="btn btn-light border"
                    @click="filtroSolicitante=''"
                    title="Limpiar"
                    type="button"
                  >
                    <i class="bi bi-x-circle"></i>
                  </button>
                </div>

                <datalist id="solicitantesList">
                  <option v-for="n in solicitantesOpts" :key="n" :value="n"></option>
                </datalist>

                <div class="d-flex align-items-center justify-content-between mt-2">
                  <div class="form-check form-switch m-0">
                    <input
                      id="chkExacto"
                      class="form-check-input"
                      type="checkbox"
                      v-model="filtroSolicExacto"
                    >
                    <label class="form-check-label small text-muted" for="chkExacto">
                      Coincidencia exacta
                    </label>
                  </div>

                  <span class="small text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    {{ filtroSolicExacto ? 'Exacto' : 'Contiene' }}
                  </span>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label mb-2">Estatus</label>
                <div class="d-flex flex-wrap gap-2">
                  <label v-for="s in ESTATUS_OPC" :key="s" class="form-check form-check-inline me-3">
                    <input class="form-check-input" type="checkbox" :value="s" v-model="filtroEstatus">
                    <span class="form-check-label">{{ s }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-between w-100 gap-2">
            <button class="btn btn-soft-secondary" @click="limpiarFiltros">
              Limpiar
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-soft-secondary" @click="cerrarFiltros">Cerrar</button>
              <button class="btn btn-brand" @click="aplicarFiltros">
                <i class="bi bi-funnel me-1"></i> Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EDITOR -->
    <div v-if="editorAbierto" class="offcanvas-backdrop editor-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header editor-header">
          <div>
            <div class="modal-kicker">Editar registro</div>
            <div class="fw-bold fs-5 text-truncate">Editar SOLPED Taller</div>
          </div>
          <button class="btn-close" @click="cerrarEditor" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body editor-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-sm-6 col-md-3">
                <label class="form-label">N° SOLPE</label>
                <input class="form-control modern-input" v-model.number="edit.numero_solpe" type="number" min="0">
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <label class="form-label">Fecha</label>
                <input class="form-control modern-input" v-model="edit.fecha" placeholder="YYYY-MM-DD" readonly>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Empresa</label>
                <select class="form-select modern-input" v-model="edit.empresa">
                  <option>Xtreme Servicio</option>
                </select>
              </div>

              <div class="col-12 col-md-3">
                <label class="form-label">Estatus</label>
                <select class="form-select modern-input" v-model="edit.estatus">
                  <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Centro de Costo</label>
                <input
                  class="form-control modern-input"
                  v-model.trim="edit.centro_costo"
                  placeholder="Escribe el centro de costo"
                >
                <div class="form-text">Campo manual (sin sugerencias).</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Nombre solicitante</label>
                <input class="form-control modern-input" v-model="edit.nombre_solicitante" placeholder="Ej: MATIAS MELLA">
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Usuario sesión</label>
                <input class="form-control modern-input" v-model="edit.usuario_sesion" placeholder="Ej: TALLER CM">
              </div>

              <div class="col-12">
                <label class="form-label mb-1">Cotizadores</label>
                <div class="checks-wrap">
                  <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="p">
                    <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.cotizadores">
                    <span class="form-check-label">{{ p }}</span>
                  </label>
                </div>
              </div>

              <!-- Ítems -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Ítems</div>
                  <button class="btn btn-sm btn-soft-primary" @click="abrirModalItem('edit')">
                    <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                  </button>
                </div>

                <div class="table-responsive d-none d-sm-block">
                  <table class="table table-sm align-middle mb-0 inner-table">
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
                        <td colspan="9" class="text-center text-secondary">Sin ítems.</td>
                      </tr>

                      <tr v-for="(it, idx) in edit.items" :key="`e-${idx}`">
                        <td class="fw-semibold">{{ it.item }}</td>

                        <td class="small">
                          <div class="fw-semibold text-truncate-2">{{ it.descripcion }}</div>
                          <div class="text-secondary text-truncate">
                            {{ it.numero_interno || '—' }}
                          </div>
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

                <div class="d-block d-sm-none">
                  <div v-if="!edit.items?.length" class="text-center text-secondary py-2">Sin ítems.</div>

                  <div class="list-group list-group-flush">
                    <div v-for="(it, idx) in edit.items" :key="`m-${idx}`" class="list-group-item mobile-item-card">
                      <div class="d-flex justify-content-between">
                        <div class="fw-semibold">Ítem {{ it.item }}</div>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ it.estado || '—' }}</span>
                      </div>

                      <div class="small mt-1 text-truncate-3">
                        <span class="text-secondary">Desc:</span> {{ it.descripcion || '—' }}
                      </div>

                      <div class="small mt-1">
                        <span class="text-secondary">Cant.:</span> {{ it.cantidad ?? 0 }} ·
                        <span class="text-secondary">Cotizada:</span> {{ it.cantidad_cotizada ?? 0 }}
                      </div>

                      <div class="small text-truncate mt-1">
                        <span class="text-secondary">Cód. ref:</span> {{ it.codigo_referencial || '—' }}
                      </div>

                      <div class="small mt-2">
                        <div class="text-secondary mb-1">cotPorOC</div>

                        <div v-if="hasCotPorOC(it)" class="d-flex flex-wrap gap-1">
                          <span
                            v-for="(qty, ocNum) in (it.cotPorOC || {})"
                            :key="`ocm-${idx}-${ocNum}`"
                            class="chip chip-slate"
                          >
                            OC {{ ocNum }}: {{ qty }}
                          </span>
                        </div>
                        <div v-else class="text-secondary">—</div>

                        <button class="btn btn-link btn-sm px-0 mt-1" @click="abrirCotPorOC(idx)">
                          <i class="bi bi-sliders me-1"></i> Editar cotPorOC
                        </button>
                      </div>

                      <div class="small mt-1">
                        <span class="text-secondary">Img:</span>
                        <a v-if="it.imagen_url" :href="it.imagen_url" target="_blank">ver</a>
                        <span v-else class="text-secondary">—</span>
                      </div>

                      <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-outline-secondary btn-sm flex-fill" @click="abrirModalItem('edit', it, idx)">
                          <i class="bi bi-pencil me-1"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm" @click="eliminarItem('edit', idx)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Historial -->
              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Historial de Estados</div>
                  <button class="btn btn-sm btn-soft-primary" @click="abrirModalHistorialNuevo">
                    <i class="bi bi-plus-lg me-1"></i> Agregar
                  </button>
                </div>

                <div class="list-group pro-list-group">
                  <div v-if="historialCargando" class="list-group-item text-secondary small d-flex align-items-center gap-2">
                    <span class="spinner-border spinner-border-sm"></span>
                    Cargando historial…
                  </div>

                  <div v-else-if="!historialRows.length" class="list-group-item text-secondary small">
                    Sin historial en subcolección.
                  </div>

                  <div v-else class="list-group-item" v-for="h in historialRows" :key="h.__id">
                    <div class="d-flex align-items-start justify-content-between gap-2">
                      <div class="small text-secondary">
                        <i class="bi bi-clock me-1"></i>
                        {{ fmtTs(h.fecha) }}
                        <span v-if="h.ocNumero" class="chip chip-slate ms-2">OC {{ h.ocNumero }}</span>
                      </div>

                      <button class="btn btn-sm btn-soft-primary" @click="guardarHistorial(h)" :disabled="h.__saving">
                        <span v-if="h.__saving" class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-save me-1"></i>
                        Guardar
                      </button>
                    </div>

                    <div class="row g-2 mt-2">
                      <div class="col-12 col-md-4">
                        <label class="form-label small text-muted mb-1">Fecha (no editable)</label>
                        <input class="form-control form-control-sm modern-input" :value="fmtTs(h.fecha)" disabled />
                      </div>

                      <div class="col-12 col-md-4">
                        <label class="form-label small text-muted mb-1">Estatus</label>
                        <input class="form-control form-control-sm modern-input" v-model="h.estatus" placeholder="Estatus" />
                      </div>

                      <div class="col-12 col-md-4">
                        <label class="form-label small text-muted mb-1">Usuario</label>
                        <input class="form-control form-control-sm modern-input" v-model="h.usuario" placeholder="Usuario" />
                      </div>

                      <div class="col-12">
                        <label class="form-label small text-muted mb-1">Detalle</label>
                        <input class="form-control form-control-sm modern-input" v-model="h.detalle" placeholder="Detalle" />
                      </div>

                      <div class="col-12 col-md-6">
                        <label class="form-label small text-muted mb-1">ocId</label>
                        <input class="form-control form-control-sm modern-input" v-model="h.ocId" placeholder="ocId" />
                      </div>

                      <div class="col-12 col-md-6">
                        <label class="form-label small text-muted mb-1">ocNumero</label>
                        <input class="form-control form-control-sm modern-input" v-model.number="h.ocNumero" type="number" min="0" placeholder="362" />
                      </div>
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

    <!-- MODAL cotPorOC -->
    <div v-if="modalCotPorOC" class="vmodal-backdrop" @click.self="cerrarCotPorOC">
      <div class="vmodal" style="max-width: 780px;">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <div>
            <div class="modal-kicker">Editar mapa</div>
            <h5 class="mb-0 fw-bold">Editar cotPorOC</h5>
            <div class="small text-secondary">
              Ítem: <strong>{{ cotItem?.item ?? '—' }}</strong>
              · {{ cotItem?.descripcion ?? '' }}
            </div>
          </div>
          <button class="btn-close" @click="cerrarCotPorOC"></button>
        </div>

        <div class="vmodal-body">
          <div class="alert alert-info py-2 small mb-3">
            Aquí puedes <strong>eliminar</strong> o <strong>reemplazar</strong> entradas del map <code>cotPorOC</code>.
          </div>

          <div v-if="cotRows.length" class="table-responsive">
            <table class="table table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th style="width:160px;">OC Número</th>
                  <th style="width:160px;">Cantidad</th>
                  <th>Preview</th>
                  <th style="width:140px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in cotRows" :key="'cot-'+i">
                  <td>
                    <input class="form-control form-control-sm modern-input" v-model.trim="r.ocNumero" placeholder="362">
                  </td>
                  <td>
                    <input class="form-control form-control-sm modern-input" v-model.number="r.cantidad" type="number" min="0">
                  </td>
                  <td class="small text-secondary">
                    OC {{ r.ocNumero || '—' }}: {{ r.cantidad ?? 0 }}
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-danger" @click="eliminarCotRow(i)" title="Eliminar">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-secondary small">
            Este ítem no tiene cotPorOC.
          </div>

          <div class="d-flex flex-wrap gap-2 mt-2">
            <button class="btn btn-sm btn-soft-primary" @click="agregarCotRow">
              <i class="bi bi-plus-lg me-1"></i> Agregar entrada
            </button>

            <button class="btn btn-sm btn-soft-danger" @click="limpiarCotRows" :disabled="!cotRows.length">
              <i class="bi bi-eraser me-1"></i> Eliminar todo
            </button>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarCotPorOC">Cancelar</button>
          <button class="btn btn-brand" @click="aplicarCotPorOC">
            <i class="bi bi-check2-circle me-1"></i> Aplicar cambios
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">Crear registro</div>
            <h5 class="mb-0 fw-bold">Nueva SOLPED (Taller)</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">N° SOLPE</label>
                <input class="form-control modern-input" v-model.number="nuevo.numero_solpe" type="number" min="0">
              </div>

              <div class="col-md-3">
                <label class="form-label">Fecha</label>
                <input class="form-control modern-input" v-model="nuevo.fecha" placeholder="YYYY-MM-DD">
              </div>

              <div class="col-md-3">
                <label class="form-label">Empresa</label>
                <select class="form-select modern-input" v-model="nuevo.empresa">
                  <option>Xtreme Servicio</option>
                </select>
              </div>

              <div class="col-md-3">
                <label class="form-label">Estatus</label>
                <select class="form-select modern-input" v-model="nuevo.estatus">
                  <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Centro de Costo</label>
                <div class="input-group">
                  <select class="form-select modern-input" v-model="selectedCentroNuevo" @change="applyCentroCosto(nuevo, selectedCentroNuevo)">
                    <option value="">— Selecciona centro —</option>
                    <option v-for="opt in centrosOpts" :key="opt.key" :value="opt.key">
                      {{ opt.key }} — {{ opt.name }}
                    </option>
                  </select>
                  <input class="form-control modern-input" v-model="nuevo.centro_costo" placeholder="o escribe uno personalizado">
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Nombre solicitante</label>
                <input class="form-control modern-input" v-model="nuevo.nombre_solicitante" placeholder="FRANK PINTO">
              </div>

              <div class="col-md-6">
                <label class="form-label">Usuario sesión</label>
                <input class="form-control modern-input" v-model="nuevo.usuario_sesion" placeholder="TALLER CM">
              </div>

              <div class="col-12">
                <label class="form-label mb-1">Cotizadores</label>
                <div class="checks-wrap">
                  <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="'n-'+p">
                    <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.cotizadores">
                    <span class="form-check-label">{{ p }}</span>
                  </label>
                </div>
              </div>

              <div class="col-12">
                <div class="section-head">
                  <div class="fw-semibold">Ítems (nuevo)</div>
                  <button class="btn btn-sm btn-soft-primary" @click="abrirModalItem('nuevo')">
                    <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                  </button>
                </div>

                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0 inner-table">
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

                <div class="form-text">
                  Nota: en creación no editamos cotPorOC (eso se arma al cotizar). Luego puedes editarlo en el editor.
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

    <!-- MODAL ITEM -->
    <div v-if="modalItem" class="vmodal-backdrop" @click.self="cerrarModalItem">
      <div class="vmodal" style="max-width: 720px;">
        <div class="vmodal-header">
          <div>
            <div class="modal-kicker">{{ isEditItem ? 'Editar ítem' : 'Nuevo ítem' }}</div>
            <h5 class="mb-0 fw-bold">{{ isEditItem ? 'Editar ítem' : 'Nuevo ítem' }}</h5>
          </div>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-md-2">
                <label class="form-label">Ítem</label>
                <input class="form-control modern-input" v-model.number="itemForm.item" type="number" min="1" :readonly="true">
                <div class="form-text">Autonumérico.</div>
              </div>

              <div class="col-md-10">
                <label class="form-label">Descripción</label>
                <input class="form-control modern-input" v-model="itemForm.descripcion">
              </div>

              <div class="col-md-3">
                <label class="form-label">Cantidad</label>
                <input class="form-control modern-input" v-model.number="itemForm.cantidad" type="number" min="0">
              </div>

              <div class="col-md-3">
                <label class="form-label">Cotizada</label>
                <input class="form-control modern-input" v-model.number="itemForm.cantidad_cotizada" type="number" min="0">
              </div>

              <div class="col-md-3">
                <label class="form-label">Código ref.</label>
                <input class="form-control modern-input" v-model="itemForm.codigo_referencial">
              </div>

              <div class="col-md-3">
                <label class="form-label">Estado</label>
                <select class="form-select modern-input" v-model="itemForm.estado">
                  <option>pendiente</option>
                  <option>parcial</option>
                  <option>completado</option>
                  <option>revisión</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">N° interno</label>
                <input class="form-control modern-input" v-model="itemForm.numero_interno" placeholder="opcional">
              </div>

              <div class="col-md-6">
                <label class="form-label">Subir imagen (opcional)</label>
                <input id="inputImagenItem" type="file" class="form-control modern-input"
                  accept="image/*" @change="onImagenItem">
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

    <!-- MODAL HISTORIAL NUEVO -->
    <div v-if="modalHistorialNuevo" class="vmodal-backdrop" @click.self="cerrarModalHistorialNuevo">
      <div class="vmodal" style="max-width: 720px;">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <div>
            <div class="modal-kicker">Crear historial</div>
            <h5 class="mb-0 fw-bold">Agregar historial</h5>
            <div class="small text-secondary">La fecha se guarda automática (no editable)</div>
          </div>
          <button class="btn-close" @click="cerrarModalHistorialNuevo"></button>
        </div>

        <div class="vmodal-body">
          <div class="form-block">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Estatus</label>
                <input class="form-control modern-input" v-model="histNuevo.estatus" placeholder="Cotizando - Revisión Guillermo">
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Usuario</label>
                <input class="form-control modern-input" v-model="histNuevo.usuario" placeholder="María José Ballesteros">
              </div>

              <div class="col-12">
                <label class="form-label">Detalle</label>
                <input class="form-control modern-input" v-model="histNuevo.detalle" placeholder="Se subió cotización (OC Taller N° 362)">
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">ocId</label>
                <input class="form-control modern-input" v-model="histNuevo.ocId" placeholder="ziOVNUcvEA1eAcXg1OBY">
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">ocNumero</label>
                <input class="form-control modern-input" v-model.number="histNuevo.ocNumero" type="number" min="0" placeholder="362">
              </div>
            </div>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarModalHistorialNuevo" :disabled="histNuevoSaving">Cancelar</button>
          <button class="btn btn-brand" @click="crearHistorialNuevo" :disabled="histNuevoSaving">
            <span v-if="histNuevoSaving" class="spinner-border spinner-border-sm me-2"></span>
            Crear
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
            ¿Estás seguro que quieres eliminar la SOLPED Taller
            <strong>#{{ confirmRow?.numero_solpe ?? '—' }}</strong>?
          </p>

          <div class="confirm-box">
            <div class="confirm-row">
              <span>Empresa</span>
              <strong>{{ confirmRow?.empresa || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Centro de costo</span>
              <strong>{{ confirmRow?.centro_costo || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Solicitante</span>
              <strong>{{ confirmRow?.nombre_solicitante || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Fecha</span>
              <strong>{{ confirmRow?.fecha || '—' }}</strong>
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
import { db } from "../stores/firebase";
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot,
  doc, addDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "vue-router";


const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Pendiente",
  "Rechazado",
  "Cotizado Parcial",
  "Cotizado Completado",
  "OC enviada a proveedor"
];
const COTIZADORES_OPCIONES = [
  "Guillermo Manzor",
  "María José Ballesteros",
  "Cindy Quiroga",
  "Camila Ricci",
  "Luis Orellana"
];


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
const filtroSolicitante = ref("");
const filtroSolicExacto = ref(false);
const filtroEstatus = ref([]);
let unsubFilter = null;

const filtrosAbiertos = ref(false);
const abrirFiltros = () => { filtrosAbiertos.value = true; };
const cerrarFiltros = () => { filtrosAbiertos.value = false; };

const hasActiveFilters = computed(() =>
  !!filtroFecha.value || !!filtroSolicitante.value || (filtroEstatus.value?.length || 0) > 0
);
const totalFiltrosActivos = computed(() => {
  let n = 0;
  if (filtroFecha.value) n++;
  if (filtroSolicitante.value) n++;
  n += (filtroEstatus.value?.length || 0);
  return n;
});

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
  if (s.includes("complet")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("cotiz")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz") || s.includes("escala")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("revisión") || s.includes("revision")) return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
};
const normalize = (v) => (v||"").toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();

function fmtTs(ts){
  if (!ts) return "—";
  if (typeof ts?.toDate === "function") {
    const d = ts.toDate();
    return d.toLocaleString("es-CL");
  }
  if (typeof ts === "string") return ts;
  if (ts?.seconds) {
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString("es-CL");
  }
  return "—";
}

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
    limit(10)
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

const solicitantesOpts = ref([]);
let unsubSolicitantes = null;

function subscribeSolicitantesOpts(){
  if (unsubSolicitantes) { unsubSolicitantes(); unsubSolicitantes = null; }

  const qy = query(
    collection(db, "solped_taller"),
    orderBy("numero_solpe", "desc"),
    limit(800)
  );

  unsubSolicitantes = onSnapshot(qy, (snap) => {
    const map = new Map();
    snap.forEach((d) => {
      const n = (d.data()?.nombre_solicitante || "").toString().trim();
      if (!n) return;
      const key = normalize(n);
      if (!map.has(key)) map.set(key, n);
    });

    solicitantesOpts.value = Array
      .from(map.values())
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, (err) => {
    console.error("subscribeSolicitantesOpts:", err);
  });
}

function limpiarBusqueda(){
  buscarNumero.value = "";
  busquedaActiva.value = false;
  currentPage.value = 1;
  subscribePage(1);
}


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
    currentPage.value = 1;
    subscribePage(1);
    cerrarFiltros();
    return;
  }

  cleanupSubs();
  cargando.value = true;
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
    cerrarFiltros();
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
  aplicarFiltros();
}

function removeEstatus(es){
  filtroEstatus.value = filtroEstatus.value.filter(x => x!==es);
  aplicarFiltros();
}

const irADetalle = (row) => {
  const id = row?.__id;
  if (!id) { addToast("warning", "No se encontró el ID del documento."); return; }
  router.push({ name: "SolpedTallerDetalle", params: { id } });
};


const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);

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

const historialRows = ref([]);
const historialCargando = ref(false);
let unsubHistorial = null;

function subscribeHistorial(solpedId){
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
  if (!solpedId) return;

  historialCargando.value = true;
  const qy = query(
    collection(db, "solped_taller", solpedId, "historialEstados"),
    orderBy("fecha", "desc"),
    limit(200)
  );

  unsubHistorial = onSnapshot(qy, (snap) => {
    const arr = [];
    snap.forEach(d => {
      arr.push({
        __id: d.id,
        ...d.data(),
        __saving: false
      });
    });
    historialRows.value = arr;
    historialCargando.value = false;
  }, (err) => {
    console.error("subscribeHistorial:", err);
    historialRows.value = [];
    historialCargando.value = false;
  });
}

async function guardarHistorial(h){
  if (!seleccion.value?.__id || !h?.__id) return;
  try {
    h.__saving = true;
    const href = doc(db, "solped_taller", seleccion.value.__id, "historialEstados", h.__id);

    const payload = {
      detalle: (h.detalle ?? "").toString(),
      estatus: (h.estatus ?? "").toString(),
      usuario: (h.usuario ?? "").toString(),
      ocId: (h.ocId ?? "").toString(),
      ocNumero: h.ocNumero === null || h.ocNumero === undefined || h.ocNumero === "" ? null : Number(h.ocNumero)
    };

    await updateDoc(href, payload);
    addToast("success", "Historial actualizado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar el historial.");
  } finally {
    h.__saving = false;
  }
}

const modalHistorialNuevo = ref(false);
const histNuevoSaving = ref(false);
const histNuevo = ref({
  detalle: "",
  estatus: "",
  usuario: "",
  ocId: "",
  ocNumero: null
});

function abrirModalHistorialNuevo(){
  histNuevo.value = {
    detalle: "",
    estatus: edit.value.estatus || "",
    usuario: edit.value.usuario_sesion || "",
    ocId: "",
    ocNumero: null
  };
  modalHistorialNuevo.value = true;
}
function cerrarModalHistorialNuevo(){
  if (histNuevoSaving.value) return;
  modalHistorialNuevo.value = false;
}

async function crearHistorialNuevo(){
  if (!seleccion.value?.__id) return;
  try {
    histNuevoSaving.value = true;
    const colRef = collection(db, "solped_taller", seleccion.value.__id, "historialEstados");
    await addDoc(colRef, {
      detalle: (histNuevo.value.detalle ?? "").toString(),
      estatus: (histNuevo.value.estatus ?? "").toString(),
      usuario: (histNuevo.value.usuario ?? "").toString(),
      ocId: (histNuevo.value.ocId ?? "").toString(),
      ocNumero: histNuevo.value.ocNumero === null || histNuevo.value.ocNumero === undefined || histNuevo.value.ocNumero === "" ? null : Number(histNuevo.value.ocNumero),
      fecha: serverTimestamp()
    });
    addToast("success", "Historial agregado.");
    modalHistorialNuevo.value = false;
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo agregar el historial.");
  } finally {
    histNuevoSaving.value = false;
  }
}

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
    usuario_sesion: row.usuario_sesion ?? ""
  });

  editorAbierto.value = true;

  subscribeHistorial(row.__id);
}

async function guardarEdicion(){
  if (!seleccion.value) return;
  guardando.value = true;
  try {
    const id = seleccion.value.__id;
    const dref = doc(db, "solped_taller", id);

    const safe = deepClone(edit.value);

    if (typeof safe.numero_solpe === "string") {
      const n = parseInt(safe.numero_solpe, 10);
      safe.numero_solpe = isNaN(n) ? null : n;
    }

    safe.items = (safe.items || []).map(it => ({
      ...it,
      item: Number(it.item ?? 0),
      cantidad: Number(it.cantidad ?? 0),
      cantidad_cotizada: Number(it.cantidad_cotizada ?? 0),
      cantidad_para_cotizar: Number(it.cantidad_para_cotizar ?? 0),
      cantidad_solicitada_oc: Number(it.cantidad_solicitada_oc ?? 0),
      cotPorOC: (it.cotPorOC && typeof it.cotPorOC === "object") ? it.cotPorOC : {}
    }));

    await updateDoc(dref, safe);
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
  historialRows.value = [];
  historialCargando.value = false;
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
}


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

const modalCotPorOC = ref(false);
const cotItemIndex = ref(-1);
const cotRows = ref([]);

const cotItem = computed(() => {
  const idx = cotItemIndex.value;
  if (idx < 0) return null;
  return (edit.value.items || [])[idx] || null;
});

function hasCotPorOC(it){
  return it?.cotPorOC && typeof it.cotPorOC === "object" && Object.keys(it.cotPorOC).length > 0;
}

function abrirCotPorOC(idx){
  cotItemIndex.value = idx;
  const it = (edit.value.items || [])[idx];
  const map = (it?.cotPorOC && typeof it.cotPorOC === "object") ? it.cotPorOC : {};
  cotRows.value = Object.entries(map).map(([k, v]) => ({
    ocNumero: String(k),
    cantidad: Number(v ?? 0)
  }));

  modalCotPorOC.value = true;
}

function cerrarCotPorOC(){
  modalCotPorOC.value = false;
  cotItemIndex.value = -1;
  cotRows.value = [];
}

function agregarCotRow(){
  cotRows.value.push({ ocNumero: "", cantidad: 0 });
}
function eliminarCotRow(i){
  cotRows.value.splice(i, 1);
}
function limpiarCotRows(){
  cotRows.value = [];
}

function aplicarCotPorOC(){
  const idx = cotItemIndex.value;
  if (idx < 0) return;

  const map = {};
  for (const r of cotRows.value) {
    const key = (r.ocNumero ?? "").toString().trim();
    if (!key) continue;
    map[key] = Number(r.cantidad ?? 0);
  }
  if (!edit.value.items) edit.value.items = [];
  edit.value.items[idx] = {
    ...edit.value.items[idx],
    cotPorOC: map
  };

  addToast("success", "cotPorOC actualizado (pendiente de guardar).");
  cerrarCotPorOC();
}

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
    usuario_sesion: ""
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
      cantidad_cotizada: Number(it.cantidad_cotizada ?? 0),
      cotPorOC: (it.cotPorOC && typeof it.cotPorOC === "object") ? it.cotPorOC : {}
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

    const id = confirmRow.value.__id;
    await deleteDoc(doc(db, "solped_taller", id));

    confirmOpen.value = false;
    confirmRow.value = null;

    addToast("success", "SOLPED Taller eliminada.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar.");
  } finally {
    eliminando.value = false;
  }
}


onMounted(() => {
  subscribePage(1);
  subscribeSolicitantesOpts();
});
onBeforeUnmount(() => {
  cleanupSubs();
  if (unsubSolicitantes) { unsubSolicitantes(); unsubSolicitantes = null; }
  if (unsubHistorial) { unsubHistorial(); unsubHistorial = null; }
});
</script>
<style scoped>
:root {
  color-scheme: light;
}

.admin-solpes-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 22%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.08), transparent 18%),
    linear-gradient(180deg, #f5f7fb 0%, #edf2f7 100%);
  color: #0f172a;
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
    inset 0 1px 0 rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  z-index: 1;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.12), transparent 20%),
    radial-gradient(circle at 75% 70%, rgba(16, 185, 129, 0.10), transparent 18%);
  pointer-events: none;
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
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.6);
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

.list-shell {
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

.solpes-table {
  --bs-table-bg: transparent;
  --bs-table-striped-bg: rgba(248, 250, 252, 0.72);
  --bs-table-hover-bg: rgba(37, 99, 235, 0.035);
  margin: 0;
}

.table-head-pro th {
  background: rgba(248, 250, 252, 0.92) !important;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding: 1rem 1rem;
  white-space: nowrap;
}

.solpes-table tbody td {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: #1e293b;
}

.solpes-table tbody tr {
  transition: background 0.2s ease, transform 0.2s ease;
}

.solpes-table tbody tr:hover {
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

.status-badge {
  border-radius: 999px;
  padding: 0.52rem 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
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

.solpe-mobile-card {
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

.card-footer-pro {
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

.inner-table th,
.inner-table td {
  vertical-align: middle;
}

.pro-list-group .list-group-item,
.mini-card,
.mobile-item-card {
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

.min-w-0 {
  min-width: 0;
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
}
</style>
