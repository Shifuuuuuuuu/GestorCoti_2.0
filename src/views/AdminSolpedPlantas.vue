<!-- src/views/AdminSolpedPlantas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-solpes-page">
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <h1 class="h4 fw-semibold mb-0">Admin · SOLPED Plantas</h1>

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
              title="Limpiar búsqueda"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <button class="btn btn-outline-primary toolbar-item" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span
              v-if="hasActiveFilters"
              class="badge bg-primary-subtle text-primary-emphasis ms-2"
            >
              {{ totalFiltrosActivos }}
            </span>
          </button>

          <button class="btn btn-primary toolbar-item" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva SOLPED Plantas
          </button>
        </div>
      </div>

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

        <span v-if="filtroEstadoAprob" class="badge bg-light text-dark border">
          Aprobación: {{ filtroEstadoAprob }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroEstadoAprob=''; aplicarFiltros()"></button>
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
            <span v-if="hasActiveFilters || busquedaActiva" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>

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

        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead class="table-light">
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
                <td colspan="7" class="text-center py-4">
                  <div class="spinner-border" role="status"></div>
                  <div class="small text-secondary mt-2">Cargando…</div>
                </td>
              </tr>

              <tr v-else-if="rows.length === 0">
                <td colspan="7" class="text-center py-4 text-secondary">
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
                  <span class="badge" :class="badgeEstadoClass(r.estadoAprobacionSolped)">
                    {{ r.estadoAprobacionSolped || 'Pendiente' }}
                  </span>
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
                  <div class="small text-secondary">{{ displayDate(r) }}</div>
                </div>
                <span class="badge mt-1" :class="badgeClass(r.estatus)">{{ r.estatus || '—' }}</span>
              </div>

              <div class="mt-2 small">
                <div class="text-truncate"><span class="text-secondary">Centro:</span> {{ r.nombre_centro_costo || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Contrato:</span> {{ r.numero_contrato || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Empresa:</span> {{ r.empresa || '—' }}</div>
                <div class="text-truncate"><span class="text-secondary">Aprobación:</span> {{ r.estadoAprobacionSolped || 'Pendiente' }}</div>
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

      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Mobile Filters -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filtros · SOLPED Plantas</div>
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

            <div class="col-12 col-sm-6">
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

    <!-- Editor -->
    <div v-if="editorAbierto" class="offcanvas-backdrop editor-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel editor-panel">
        <div class="offcanvas-header editor-header">
          <div class="fw-semibold text-truncate">Editar SOLPED Plantas</div>
          <button class="btn-close" @click="cerrarEditor" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body editor-body">
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
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="edit.dirigidoA">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

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
                <button class="btn btn-outline-secondary" @click="abrirSelectorAutorizacionEdit">
                  <i class="bi bi-paperclip me-1"></i> Agregar archivos
                </button>

                <span class="badge text-bg-light border" v-if="(edit.autorizaciones?.length || 0) > 0">
                  <i class="bi bi-folder2-open me-1"></i> {{ edit.autorizaciones.length }} adjunto(s)
                </span>

                <span class="badge text-bg-warning border" v-if="archivosAutorizacionEdit.length">
                  <i class="bi bi-cloud-upload me-1"></i> {{ archivosAutorizacionEdit.length }} para subir
                </span>
              </div>

              <div class="mt-2" v-if="(edit.autorizaciones?.length || 0) > 0">
                <div class="small text-secondary mb-1">Actuales:</div>
                <div class="list-group">
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
                        <a v-if="a.url" :href="a.url" target="_blank" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-box-arrow-up-right me-1"></i> Ver
                        </a>
                        <button class="btn btn-sm btn-outline-danger" @click="removeAdjuntoEdit(i)">
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
                    class="badge rounded-pill text-bg-warning border"
                    v-for="(f, idx) in archivosAutorizacionEdit"
                    :key="f.name + f.size + f.lastModified"
                  >
                    {{ f.name }}
                    <button class="btn btn-sm btn-link text-dark ms-1 p-0 align-baseline" @click="removePendingEdit(idx)">×</button>
                  </span>
                </div>
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
                  <div v-for="(it, idx) in edit.items" :key="'m-'+idx" class="list-group-item">
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

            <!-- Historial -->
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

    <!-- Modal Nueva -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva SOLPED Plantas</h5>
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
              <div class="d-flex flex-wrap gap-2">
                <label class="form-check me-3" v-for="p in DIRIGIDO_OPCIONES" :key="'n-'+p">
                  <input class="form-check-input me-1" type="checkbox" :value="p" v-model="nuevo.dirigidoA">
                  <span class="form-check-label">{{ p }}</span>
                </label>
              </div>
            </div>

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
                <button class="btn btn-secondary" @click="abrirSelectorAutorizacionNuevo">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivos
                </button>

                <span class="badge text-bg-warning border" v-if="archivosAutorizacionNuevo.length">
                  {{ archivosAutorizacionNuevo.length }} seleccionado(s)
                </span>
              </div>

              <div class="mt-2" v-if="archivosAutorizacionNuevo.length">
                <div class="small text-secondary mb-1">Pendientes:</div>
                <div class="d-flex flex-wrap gap-2">
                  <span
                    class="badge rounded-pill text-bg-warning border"
                    v-for="(f, idx) in archivosAutorizacionNuevo"
                    :key="f.name + f.size + f.lastModified"
                  >
                    {{ f.name }}
                    <button class="btn btn-sm btn-link text-dark ms-1 p-0 align-baseline" @click="removePendingNuevo(idx)">×</button>
                  </span>
                </div>
              </div>
            </div>

            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalItemNuevo()">
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

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarModalNueva">Cancelar</button>
          <button class="btn btn-primary" :disabled="guardandoNueva" @click="crearNueva">
            <span v-if="guardandoNueva" class="spinner-border spinner-border-sm me-2"></span>
            Crear SOLPED
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Item -->
    <div v-if="modalItem" class="vmodal-backdrop" @click.self="cerrarModalItem">
      <div class="vmodal" style="max-width: 760px;">
        <div class="vmodal-header">
          <h5 class="mb-0">{{ itemModeNuevo ? 'Ítem · Nueva SOLPED' : 'Ítem · Editar SOLPED' }}</h5>
        </div>

        <div class="vmodal-body">
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

        <div class="vmodal-footer">
          <button class="btn btn-secondary" @click="cerrarModalItem">Cancelar</button>
          <button class="btn btn-primary" @click="guardarItemForm">
            Guardar ítem
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete -->
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
.admin-solpes-page{
  min-height:100vh;
}
.minw-220{ min-width: 220px; }

.toolbar-item .form-control,
.toolbar-item .form-select,
.toolbar-item .btn,
.toolbar-item .input-group-text { height: 38px; }

.offcanvas-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: grid;
  place-items: end;
  z-index: 1080;
}
.offcanvas-panel{
  width: min(860px, 100%);
  height: 100vh;
  box-shadow: -12px 0 32px rgba(0,0,0,.25);
  animation: slideIn .22s ease-out;
  display: flex;
  flex-direction: column;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}
.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem;
  border-bottom: 1px solid #eee;
}
.offcanvas-footer{
  border-top: 1px solid #eee;
  border-bottom: 0;
}
.offcanvas-body{
  padding: 1rem;
  overflow: auto;
}
.editor-panel{
  width: min(1100px, 100%);
}
.editor-header{
  background: var(--bs-light-bg-subtle, #f8f9fa);
}
.editor-body{
  background: var(--bs-body-bg);
}
.editor-footer{
  background: var(--bs-light-bg-subtle, #f8f9fa);
}

.vmodal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1090;
  display: grid;
  place-items: center;
  padding: 1rem;
}
.vmodal{
  width: min(1100px, 100%);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border-radius: 1rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
}
.vmodal-header,
.vmodal-footer{
  padding: 1rem 1.1rem;
  border-bottom: 1px solid #eee;
}
.vmodal-footer{
  border-top: 1px solid #eee;
  border-bottom: 0;
}
.vmodal-body{
  padding: 1rem 1.1rem;
}

.toast-stack{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.toast-box{
  min-width: 260px;
  max-width: 420px;
  border-radius: .9rem;
  padding: .85rem 1rem;
  display: flex;
  align-items: center;
  color: #fff;
  box-shadow: 0 14px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg, #16a34a, #22c55e); }
.toast-warning{ background: linear-gradient(135deg, #d97706, #f59e0b); }
.toast-danger{ background: linear-gradient(135deg, #dc2626, #ef4444); }

.btn-close-white{
  filter: invert(1) grayscale(100%) brightness(200%);
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

.confirm-icon{
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 1.1rem;
}

@keyframes slideIn{
  from{ transform: translateX(24px); opacity: 0; }
  to{ transform: translateX(0); opacity: 1; }
}

@media (max-width: 576px){
  .toast-stack{
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  .toast-box{
    min-width: 0;
    max-width: none;
    width: 100%;
  }
}
</style>
