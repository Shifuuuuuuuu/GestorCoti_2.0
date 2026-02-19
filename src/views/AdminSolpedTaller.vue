<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-solpes-page">
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <h1 class="h4 fw-semibold mb-0">Admin · SOLPED Taller</h1>

        <div class="d-flex align-items-stretch gap-2 flex-wrap w-100 w-lg-auto">
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
          <button class="btn btn-outline-primary toolbar-item" @click="abrirFiltros">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span v-if="hasActiveFilters" class="badge bg-primary-subtle text-primary-emphasis ms-2">{{ totalFiltrosActivos }}</span>
          </button>
          <button class="btn btn-primary toolbar-item" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED (Taller)
          </button>
        </div>
      </div>
      <div v-if="hasActiveFilters || busquedaActiva" class="d-flex flex-wrap align-items-center gap-2 mb-2">
        <small class="text-secondary">Filtros activos:</small>

        <span v-if="filtroFecha" class="badge bg-light text-dark border">
          Fecha: {{ filtroFecha }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroFecha=''; aplicarFiltros()"></button>
        </span>

        <span v-if="filtroSolicitante" class="badge bg-light text-dark border">
          Solicitante: {{ filtroSolicitante }}
          <span class="text-secondary">({{ filtroSolicExacto ? 'exacto' : 'contiene' }})</span>
          <button class="btn-close btn-close-white ms-2 small" @click="filtroSolicitante=''; aplicarFiltros()"></button>
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
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="hasActiveFilters || busquedaActiva" class="text-secondary small ms-2">paginación desactivada</span>
          </div>
        </div>
        <div class="table-responsive d-none d-md-block">
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
                  <div class="fw-semibold text-truncate">{{ r.centro_costo || '—' }}</div>
                  <div class="small text-secondary text-truncate">
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
                  <div class="small text-secondary">{{ r.fecha || '—' }}</div>
                </div>
                <span class="badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>

              <div class="mt-2 small">
                <div class="text-truncate"><span class="text-secondary">Centro costo:</span> {{ r.centro_costo || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Empresa:</span> {{ r.empresa || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Solicitante:</span> {{ r.nombre_solicitante || '—' }}</div>
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
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>
    <div v-if="filtrosAbiertos" class="offcanvas-backdrop" @click.self="cerrarFiltros">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold">Filtros · SOLPED Taller</div>
          <button class="btn-close" @click="cerrarFiltros"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Fecha</label>
              <input class="form-control" type="date" v-model="filtroFecha">
            </div>
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <label class="form-label mb-0 fw-semibold">
                  <i class="bi bi-person-badge me-1 text-primary"></i>
                  Solicitante
                </label>

                <span class="badge rounded-pill text-bg-light border">
                  <i class="bi bi-collection me-1"></i>
                  {{ solicitantesOpts.length }}
                </span>
              </div>

              <div class="input-group">
                <span class="input-group-text bg-white">
                  <i class="bi bi-search text-muted"></i>
                </span>

                <input
                  class="form-control"
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

        <div class="offcanvas-footer">
          <div class="d-flex justify-content-between w-100 gap-2">
            <button class="btn btn-outline-secondary" @click="limpiarFiltros">
              Limpiar
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary" @click="cerrarFiltros">Cerrar</button>
              <button class="btn btn-primary" @click="aplicarFiltros">
                <i class="bi bi-funnel me-1"></i> Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="editorAbierto" class="offcanvas-backdrop editor-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header editor-header">
          <div class="fw-semibold text-truncate">Editar SOLPED Taller</div>
          <button class="btn-close" @click="cerrarEditor" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body editor-body">
          <div class="row g-3">
            <div class="col-12 col-sm-6 col-md-3">
              <label class="form-label">N° SOLPE</label>
              <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <label class="form-label">Fecha</label>
              <input class="form-control" v-model="edit.fecha" placeholder="YYYY-MM-DD" readonly>
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
                <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label">Centro de Costo</label>
              <input
                class="form-control"
                v-model.trim="edit.centro_costo"
                placeholder="Escribe el centro de costo"
              >
              <div class="form-text">Campo manual (sin sugerencias).</div>
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Nombre solicitante</label>
              <input class="form-control" v-model="edit.nombre_solicitante" placeholder="Ej: MATIAS MELLA">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Usuario sesión</label>
              <input class="form-control" v-model="edit.usuario_sesion" placeholder="Ej: TALLER CM">
            </div>
            <div class="col-12">
              <label class="form-label mb-1">Cotizadores</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.cotizadores">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItem('edit')">
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
                      <th style="width:190px;">cotPorOC</th>
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
                      <td class="small">
                        <div v-if="hasCotPorOC(it)" class="d-flex flex-wrap gap-1">
                          <span
                            v-for="(qty, ocNum) in (it.cotPorOC || {})"
                            :key="`oc-${idx}-${ocNum}`"
                            class="badge bg-secondary-subtle text-secondary-emphasis border"
                            :title="`OC #${ocNum}: ${qty}`"
                          >
                            OC {{ ocNum }}: {{ qty }}
                          </span>
                        </div>
                        <div v-else class="text-secondary">—</div>

                        <button class="btn btn-link btn-sm px-0 mt-1" @click="abrirCotPorOC(idx)">
                          <i class="bi bi-sliders me-1"></i> Editar cotPorOC
                        </button>
                      </td>

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
                  <div v-for="(it, idx) in edit.items" :key="`m-${idx}`" class="list-group-item">
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
                          class="badge bg-secondary-subtle text-secondary-emphasis border"
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
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Historial de Estados (subcolección)</div>

                <button class="btn btn-sm btn-outline-primary" @click="abrirModalHistorialNuevo">
                  <i class="bi bi-plus-lg me-1"></i> Agregar
                </button>
              </div>

              <div class="list-group">
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
                      <span v-if="h.ocNumero" class="ms-2 badge bg-light text-dark border">OC {{ h.ocNumero }}</span>
                    </div>

                    <button class="btn btn-sm btn-outline-success" @click="guardarHistorial(h)" :disabled="h.__saving">
                      <span v-if="h.__saving" class="spinner-border spinner-border-sm me-1"></span>
                      <i v-else class="bi bi-save me-1"></i>
                      Guardar
                    </button>
                  </div>

                  <div class="row g-2 mt-2">
                    <div class="col-12 col-md-4">
                      <label class="form-label small text-muted mb-1">Fecha (no editable)</label>
                      <input class="form-control form-control-sm" :value="fmtTs(h.fecha)" disabled />
                    </div>

                    <div class="col-12 col-md-4">
                      <label class="form-label small text-muted mb-1">Estatus</label>
                      <input class="form-control form-control-sm" v-model="h.estatus" placeholder="Estatus" />
                    </div>

                    <div class="col-12 col-md-4">
                      <label class="form-label small text-muted mb-1">Usuario</label>
                      <input class="form-control form-control-sm" v-model="h.usuario" placeholder="Usuario" />
                    </div>

                    <div class="col-12">
                      <label class="form-label small text-muted mb-1">Detalle</label>
                      <input class="form-control form-control-sm" v-model="h.detalle" placeholder="Detalle" />
                    </div>

                    <div class="col-12 col-md-6">
                      <label class="form-label small text-muted mb-1">ocId</label>
                      <input class="form-control form-control-sm" v-model="h.ocId" placeholder="ocId" />
                    </div>

                    <div class="col-12 col-md-6">
                      <label class="form-label small text-muted mb-1">ocNumero</label>
                      <input class="form-control form-control-sm" v-model.number="h.ocNumero" type="number" min="0" placeholder="362" />
                    </div>
                  </div>
                  <div class="small text-muted mt-2">
                    <i class="bi bi-shield-lock me-1"></i>
                    La fecha no se edita y el registro no se puede eliminar.
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
    <div v-if="modalCotPorOC" class="vmodal-backdrop" @click.self="cerrarCotPorOC">
      <div class="vmodal" style="max-width: 780px;">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-0">Editar cotPorOC</h5>
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
                    <input class="form-control form-control-sm" v-model.trim="r.ocNumero" placeholder="362">
                  </td>
                  <td>
                    <input class="form-control form-control-sm" v-model.number="r.cantidad" type="number" min="0">
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
            <button class="btn btn-sm btn-outline-primary" @click="agregarCotRow">
              <i class="bi bi-plus-lg me-1"></i> Agregar entrada
            </button>

            <button class="btn btn-sm btn-outline-danger" @click="limpiarCotRows" :disabled="!cotRows.length">
              <i class="bi bi-eraser me-1"></i> Eliminar todo
            </button>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarCotPorOC">Cancelar</button>
          <button class="btn btn-primary" @click="aplicarCotPorOC">
            <i class="bi bi-check2-circle me-1"></i> Aplicar cambios
          </button>
        </div>
      </div>
    </div>
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
                <option v-for="s in ESTATUS_OPC" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
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
            <div class="col-12">
              <label class="form-label mb-1">Cotizadores</label>
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in COTIZADORES_OPCIONES" :key="'n-'+p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.cotizadores">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>
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
              <div class="form-text">
                Nota: en creación no editamos cotPorOC (eso se arma al cotizar). Luego puedes editarlo en el editor.
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
    <div v-if="modalHistorialNuevo" class="vmodal-backdrop" @click.self="cerrarModalHistorialNuevo">
      <div class="vmodal" style="max-width: 720px;">
        <div class="vmodal-header d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-0">Agregar historial</h5>
            <div class="small text-secondary">La fecha se guarda automática (no editable)</div>
          </div>
          <button class="btn-close" @click="cerrarModalHistorialNuevo"></button>
        </div>

        <div class="vmodal-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Estatus</label>
              <input class="form-control" v-model="histNuevo.estatus" placeholder="Cotizando - Revisión Guillermo">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">Usuario</label>
              <input class="form-control" v-model="histNuevo.usuario" placeholder="María José Ballesteros">
            </div>

            <div class="col-12">
              <label class="form-label">Detalle</label>
              <input class="form-control" v-model="histNuevo.detalle" placeholder="Se subió cotización (OC Taller N° 362)">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">ocId</label>
              <input class="form-control" v-model="histNuevo.ocId" placeholder="ziOVNUcvEA1eAcXg1OBY">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">ocNumero</label>
              <input class="form-control" v-model.number="histNuevo.ocNumero" type="number" min="0" placeholder="362">
            </div>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarModalHistorialNuevo" :disabled="histNuevoSaving">Cancelar</button>
          <button class="btn btn-primary" @click="crearHistorialNuevo" :disabled="histNuevoSaving">
            <span v-if="histNuevoSaving" class="spinner-border spinner-border-sm me-2"></span>
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


const PAGE_SIZE = 10;
const ESTATUS_OPC = [
  "Solicitado",
  "Cotizado Parcial",
  "Cotizado Completado",
  "Completado",
  "Rechazado",
  "Pendiente",
  "OC enviada a proveedor",
  "Cotizando - Revisión Guillermo"
];
const COTIZADORES_OPCIONES = [
  "Guillermo Manzor",
  "María José Ballesteros",
  "Ricardo Santibañez",
  "Felipe Gonzalez",
  "Cindy Quiroga"
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

    safe.updated_at = serverTimestamp();

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
    payload.updated_at = serverTimestamp();

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
.admin-solpes-page{ min-height:100vh; }

.offcanvas-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: grid; place-items: end; z-index: 1080;
}
.offcanvas-panel{
  width: min(960px, 100%);
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

.toolbar-item .form-control,
.toolbar-item .form-select,
.toolbar-item .btn,
.toolbar-item .input-group-text { height: 38px; }

@media (max-width: 575.98px){
  .list-group-item{ border-left: 0; border-right: 0; }
}

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

.text-truncate-2{
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.text-truncate-3{
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
