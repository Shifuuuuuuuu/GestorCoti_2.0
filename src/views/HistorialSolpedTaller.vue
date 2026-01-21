<!-- src/views/HistorialSolpedTaller.vue -->
<template>
  <div class="historial-taller-page" v-cloak>
    <div class="container py-4 py-md-5">
            <div class="topbar row g-2 align-items-center mb-3">
        <div class="col-6 col-sm-auto order-1">
          <button class="btn btn-outline-secondary btn-sm w-100" @click="volver">
            <i class="bi bi-arrow-left"></i> <span class="d-none d-sm-inline">Volver</span>
          </button>
        </div>

        <div class="col-12 col-sm order-3 order-sm-2 text-center text-sm-start">
          <h1 class="h5 fw-semibold mb-0">Historial SOLPED Taller</h1>

        </div>

        <div class="col-6 col-sm-auto order-2 order-sm-3 d-flex justify-content-end gap-2">

          <button
            class="btn btn-outline-primary btn-sm d-none d-lg-inline-flex"
            @click="toggleSidebar"
          >
            <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"></i>
            <span class="ms-1">{{ showSidebar ? 'Ocultar filtros' : 'Mostrar filtros' }}</span>
          </button>
        </div>
      </div>

      <!-- Alerta de error -->
      <div
        v-if="error"
        class="alert-pro alert-dismissible fade show d-flex align-items-start gap-2 mb-3"
        role="alert"
      >
        <i class="bi bi-exclamation-octagon-fill fs-5 flex-shrink-0"></i>
        <div class="flex-grow-1">
          <strong>Ups, algo salió mal.</strong>
          <div class="small opacity-85">{{ error }}</div>
        </div>
        <button type="button" class="btn-close btn-close-white" @click="error=''" aria-label="Close"></button>
      </div>

      <!-- Acceso restringido -->
      <div v-if="!canViewHistorial" class="alert alert-warning d-flex align-items-start gap-2 mb-3" role="alert">
        <i class="bi bi-lock-fill fs-5 flex-shrink-0"></i>
        <div class="flex-grow-1">
          <strong>Acceso restringido.</strong>
          <div class="small opacity-85">No tienes permisos para ver el historial de SOLPED de Taller.</div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="volver">Volver</button>
      </div>

      <!-- Contenido del historial (editores o whitelisted) -->
      <template v-else>
        <!-- Buscador exacto por número -->
        <div class="card card-elevated mb-3">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="fw-semibold">🔎 Buscar SOLPED Taller (número, nombre o ítems)</div>
          </div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-12 col-sm-9">
                <input
                  type="text"
                  class="form-control"
                  v-model.trim="numeroBusqueda"
                  @keyup.enter="buscarSolpeExacta"
                  @input="error=''"
                  placeholder="Ej: 11, 27483, REPUESTOS, COD123…"
                >
              </div>
              <div class="col-12 col-sm-3 d-grid d-sm-flex gap-2">
                <button class="btn btn-danger flex-fill" @click="buscarSolpeExacta">
                  <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-2"></span>
                  Buscar
                </button>
                <button
                  class="btn btn-outline-secondary flex-fill"
                  v-if="numeroBusqueda || solpeEncontrada || filtroTexto"
                  @click="limpiarBusquedaExacta"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <div v-if="solpeEncontrada" class="alert alert-light d-flex align-items-center mt-3 flex-wrap gap-2">
              <div class="me-auto">
                <div class="fw-semibold">Resultado: SOLPED #{{ solpeEncontrada.numero_solpe ?? '—' }}</div>
                <div class="small text-secondary">
                  {{ solpeEncontrada.empresa || '—' }} · {{ solpeEncontrada.centro_costo || '—' }} · {{ solpeEncontrada.fecha || '—' }}
                </div>
              </div>
              <div class="ms-2 d-flex gap-2">
                <router-link
                  class="btn btn-sm btn-outline-primary"
                  :to="{ name: 'SolpedTallerDetalle', params: { id: solpeEncontrada.id } }"
                >
                  Ver detalle
                </router-link>
                <button
                  v-if="canGenerateOC(solpeEncontrada)"
                  class="btn btn-sm btn-outline-warning"
                  @click="irAGenerarOCTaller(solpeEncontrada)">
                  <i class="bi bi-receipt"></i>
                  <span class="ms-1">Generar OC</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chips filtros activos -->
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2" v-if="hasActiveFilters">
          <small class="text-secondary">Filtros:</small>

          <span v-if="filtroTexto" class="badge bg-light text-dark border">
            "{{ filtroTexto }}"
            <button class="btn-close btn-close-white ms-2 small" @click="filtroTexto=''; goPage(1)"></button>
          </span>

          <span v-if="fechaDesde" class="badge bg-light text-dark border">
            Desde: {{ fechaDesde }}
            <button class="btn-close btn-close-white ms-2 small" @click="fechaDesde=''; goPage(1)"></button>
          </span>

          <span v-if="fechaHasta" class="badge bg-light text-dark border">
            Hasta: {{ fechaHasta }}
            <button class="btn-close btn-close-white ms-2 small" @click="fechaHasta=''; goPage(1)"></button>
          </span>

          <span v-for="s in filtroEstatus" :key="'es-'+s" class="badge bg-light text-dark border">
            {{ s }}
            <button class="btn-close btn-close-white ms-2 small" @click="removeEstatus(s)"></button>
          </span>

          <span v-for="u in filtroSolicitante" :key="'u-'+u" class="badge bg-light text-dark border">
            {{ u }}
            <button class="btn-close btn-close-white ms-2 small" @click="removeSolicitante(u)"></button>
          </span>

          <span
            v-for="code in selectedCC"
            :key="'cc-'+code"
            class="badge bg-light text-dark border"
          >
            CC: {{ code }} — {{ centrosCosto[code] || '' }}
            <button class="btn-close btn-close-white ms-2 small" @click="removeCC(code)"></button>
          </span>

          <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
        </div>

        <div class="row">
          <!-- Listado -->
          <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
            <div v-if="loading" class="loading-box my-4">
              <div class="spinner-border" role="status" aria-hidden="true"></div>
              <div class="mt-2 small text-muted">Cargando SOLPED de Taller…</div>
            </div>

            <template v-else>
              <!-- Paginación superior pegajosa -->
              <nav v-if="totalPages > 1" class="mt-3 sticky-pager">
                <ul class="pagination justify-content-center mb-1 flex-wrap">
                  <li class="page-item" :class="{disabled: page===1}">
                    <button class="page-link" @click="prevPage" :disabled="page===1">Anterior</button>
                  </li>
                  <li class="page-item" :class="{disabled: page===totalPages}">
                    <button class="page-link" @click="nextPage" :disabled="page===totalPages">Siguiente</button>
                  </li>
                </ul>
                <div class="text-center small text-secondary">
                  Mostrando {{ pageFrom }}–{{ pageTo }} de {{ filteredAll.length }}
                </div>
              </nav>

              <!-- Lista de SOLPED -->
              <div
                v-for="s in pagedList"
                :key="s.id"
                class="card card-elevated mb-2"
                :class="{'card-unread': hasUnreadForMe(s)}"
              >
                <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <div
                    class="pointer d-flex align-items-start gap-2 flex-grow-1"
                    @click="onExpandCard(s)"
                  >
                    <div class="position-relative flex-grow-1">
                      <div class="fw-semibold lh-sm">📄 SOLPED #{{ s.numero_solpe }}</div>
                      <div class="small text-secondary">
                        <span>Fecha: {{ s.fecha }}</span>
                        <span class="d-none d-sm-inline"> · Centro costo: {{ s.centro_costo }}</span>
                        <span class="d-none d-md-inline"> · Tipo: {{ s.tipo_solped }}</span>
                        <span> · Solicitante: <span class="mark-pill">{{ s.nombre_solicitante }}</span></span>
                        <span class="d-none d-lg-inline"> · Empresa: {{ s.empresa }}</span>
                      </div>
                      <span v-if="hasUnreadForMe(s)" class="dot-unread" title="Nuevos comentarios"></span>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge" :style="estadoChipStyle(s)">{{ s.estatus }}</span>

                    <div class="dropdown" v-if="canChangeStatus">
                      <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        Cambiar Estado
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item" @click="setStatus(s,'Pendiente')">Pendiente</button></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Rechazado')">Rechazado</button></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Repuestos en bodega')">Repuestos en bodega</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Completado')">Completado</button></li>
                      </ul>
                    </div>

                    <button
                      v-if="canCopySolped"
                      class="btn btn-sm btn-outline-primary"
                      @click.stop="prepararCopiaParaCrear(s)"
                      title="Copiar en Crear SOLPED"
                    >
                    Copiar Solped
                      <i class="bi bi-files"></i>
                    </button>

                    <button
                      v-if="puedeEditarSolped(s) || puedeEditarPorRol(s)"
                      class="btn btn-sm btn-outline-primary"
                      title="Editar SOLPED (24h desde creación, mismo día)"
                      @click.stop="abrirEditar(s)"
                    >
                      <i class="bi bi-pencil-square"></i>
                      <span class="d-none d-md-inline ms-1">Editar</span>
                    </button>

                    <button class="btn btn-sm btn-success" @click.stop="descargarExcel(s)" title="Descargar Excel">
                      Descargar Excel
                      <i class="bi bi-file-earmark-excel"></i>
                    </button>

                    <button
                      v-if="canGenerateOC(s)"
                      class="btn btn-sm btn-outline-warning"
                      @click.stop="irAGenerarOCTaller(s)"
                      title="Generar OC para esta SOLPED">
                      <i class="bi bi-receipt"></i>
                      <span class="d-none d-md-inline ms-1">Generar OC</span>
                    </button>

                    <button class="btn btn-sm btn-outline-info" @click.stop="verDetalleSolped(s)" title="Ver detalle">
                      Ver Detalle
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </div>

                <div v-if="solpeExpandidaId===s.id" class="card-body">
                  <!-- Ítems -->
                  <div class="fw-semibold mb-2">🛠 Ítems asociados</div>

                  <!-- Tabla (md y arriba) -->
                  <div class="table-responsive d-none d-md-block">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th>Ítem</th>
                          <th class="w-25">Descripción</th>
                          <th class="d-none d-lg-table-cell">Código</th>
                          <th>Cantidad</th>
                          <th class="d-none d-lg-table-cell">N° Interno</th>
                          <th class="d-none d-lg-table-cell">Imagen</th>
                          <th>Estatus</th>
                          <th class="text-end d-none d-lg-table-cell">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in s.items" :key="it.item">
                          <td>{{ it.item }}</td>
                          <td>{{ it.descripcion }}</td>
                          <td class="d-none d-lg-table-cell">{{ it.codigo_referencial }}</td>
                          <td>{{ it.cantidad }}</td>
                          <td class="d-none d-lg-table-cell">{{ it.numero_interno }}</td>
                          <td class="d-none d-lg-table-cell">
                            <template v-if="it.imagen_url">
                              <img :src="it.imagen_url" class="thumb pointer" @click="abrirImagen(it)">
                              <button class="btn btn-link btn-sm p-0 ms-2" @click="abrirImagenNuevaPestana(it)">ver</button>
                            </template>
                            <span v-else class="text-secondary small">Sin imagen</span>
                          </td>
                          <td>
                            <span class="badge rounded-pill px-3"
                                  :style="{background:getBadgeColor(it.estado||'pendiente'), color:'#fff'}">
                              {{ it.estado || 'pendiente' }}
                            </span>
                          </td>
                          <td class="text-end d-none d-lg-table-cell">
                            <div class="dropdown" v-if="canChangeStatus">
                              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                Cambiar ítem
                              </button>
                              <ul class="dropdown-menu dropdown-menu-end">
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'rechazado')">Rechazado</button></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'pendiente')">Pendiente</button></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'revisión')">Revisión</button></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'completado')">Completado</button></li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Lista tipo cards (xs/sm) -->
                  <div class="d-md-none">
                    <div v-for="it in s.items" :key="it.item" class="border rounded p-2 mb-2">
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <div class="fw-semibold">#{{ it.item }} · {{ it.descripcion }}</div>
                          <div class="small text-secondary">
                            Cant: {{ it.cantidad }}
                            <span v-if="it.codigo_referencial"> · Cod: {{ it.codigo_referencial }}</span>
                            <span v-if="it.numero_interno"> · N° Int: {{ it.numero_interno }}</span>
                          </div>
                        </div>
                        <span class="badge align-self-start"
                              :style="{background:getBadgeColor(it.estado||'pendiente'), color:'#fff'}">
                          {{ it.estado || 'pendiente' }}
                        </span>
                      </div>

                      <div class="mt-2 d-flex align-items-center gap-2">
                        <template v-if="it.imagen_url">
                          <img :src="it.imagen_url" class="thumb pointer" @click="abrirImagen(it)">
                          <button class="btn btn-link btn-sm p-0" @click="abrirImagenNuevaPestana(it)">ver</button>
                        </template>
                        <span v-else class="text-secondary small">Sin imagen</span>

                        <div class="ms-auto" v-if="canChangeStatus">
                          <div class="dropup">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                              Cambiar ítem
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                              <li><button class="dropdown-item" @click="setItemStatus(s, it, 'pendiente')">Pendiente</button></li>
                              <li><button class="dropdown-item" @click="setItemStatus(s, it, 'cotizando')">Cotizando</button></li>
                              <li><button class="dropdown-item" @click="setItemStatus(s, it, 'en bodega')">En bodega</button></li>
                              <li><hr class="dropdown-divider"></li>
                              <li><button class="dropdown-item" @click="setItemStatus(s, it, 'completado')">Completado</button></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Comentarios -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">💬 Comentarios</label>
                      <small class="text-secondary">{{ (s.comentarios||[]).length }} comentario(s)</small>
                    </div>

                    <div v-if="s.comentarios && s.comentarios.length" class="list-group mb-3">
                      <div
                        v-for="(c, idx) in s.comentarios"
                        :key="idx"
                        class="list-group-item"
                        :class="{'comment-unread': !c.vistoPor || !c.vistoPor.includes(myUid)}"
                      >
                        <div class="d-flex flex-wrap justify-content-between gap-1">
                          <strong>{{ c.usuario || '—' }}</strong>
                          <small class="text-muted">{{ formatDateTime(c.fecha) }}</small>
                        </div>
                        <div class="mt-1">{{ c.texto }}</div>
                      </div>
                    </div>
                    <div class="input-group">
                      <input class="form-control" v-model="s.nuevoComentario" placeholder="Escribe un comentario...">
                      <button class="btn btn-primary" :disabled="!(s.nuevoComentario && s.nuevoComentario.trim())" @click="agregarComentario(s)">
                        Enviar
                      </button>
                    </div>
                  </div>

                  <!-- Órdenes de Compra asociadas (tiempo real) -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">🧾 Órdenes de Compra asociadas</label>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="ensureOCListener(s.id)"
                        :disabled="isLoadingOC(s.id)"
                      >
                        <span v-if="isLoadingOC(s.id)" class="spinner-border spinner-border-sm me-1"></span>
                        {{ ocListFor(s.id).length ? 'Actualizar' : 'Cargar' }}
                      </button>
                    </div>

                    <div v-if="isLoadingOC(s.id)" class="text-secondary small">Escuchando “ordenes_oc_taller”…</div>
                    <div v-else-if="ocListFor(s.id).length === 0" class="text-secondary small">
                      No hay órdenes asociadas a esta SOLPED.
                    </div>

                    <div v-else class="list-group">
                      <div
                        v-for="oc in ocListFor(s.id)"
                        :key="oc.__docId"
                        class="list-group-item d-flex align-items-center flex-wrap gap-2"
                      >
                        <div class="me-auto">
                          <div class="d-flex align-items-center gap-2 flex-wrap">
                            <strong>OC N° {{ oc.id ?? '—' }}</strong>
                            <span class="badge px-2" :style="{background:getBadgeColor(oc.estatus||'Solicitado'), color:'#fff'}">
                              {{ oc.estatus || '—' }}
                            </span>
                          </div>
                          <div class="small text-secondary mt-1">
                            <strong>Subida:</strong> {{ formatDateTime(oc.fechaSubida) }}
                          </div>
                        </div>

                        <div class="ms-2">
                          <button class="btn btn-sm btn-outline-primary" @click.stop="goOC(oc)">
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Autorización adjunta (si existe) -->
                  <div v-if="s.autorizacion_url" class="alert alert-light d-flex align-items-center mt-3 flex-wrap gap-2">
                    <i class="bi bi-paperclip me-2"></i>
                    <div class="me-auto">
                      <div class="fw-semibold mb-0">Autorización adjunta</div>
                      <div class="small">{{ s.autorizacion_nombre || 'Archivo' }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-primary" @click="abrirAutorizacion(s)">Ver</button>
                      <button class="btn btn-sm btn-outline-secondary" @click="descargarAutorizacion(s)">Descargar</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Vacío con fantasma -->
              <div v-if="!loading && filteredAll.length===0" class="ghost-wrap">
                <div class="ghost">
                  <div class="ghost-eyes"></div>
                  <div class="ghost-bottom"><div></div><div></div><div></div><div></div></div>
                </div>
                <p class="ghost-text">No hay cotizaciones con los filtros aplicados.</p>
              </div>
            </template>
          </div>

          <!-- Sidebar filtros (sticky, derecha) desktop (≥lg) -->
          <aside v-if="showSidebar" class="col-12 col-lg-3 d-none d-lg-block">
            <div class="filters-panel card card-elevated sticky-sidebar">
              <div class="card-header d-flex align-items-center justify-content-between">
                <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-success" @click="applySolicitantesFiltro">Aplicar</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
                </div>
              </div>
              <div class="card-body">
                <!-- Texto libre -->
                <div class="mb-3">
                  <label class="form-label">Texto libre</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input class="form-control" placeholder="Descripción, código, solicitante, empresa, CC…" v-model="filtroTexto">
                  </div>
                </div>

                <!-- Rango de fechas -->
                <div class="mb-3">
                  <label class="form-label">Fecha (rango)</label>
                  <div class="row g-2">
                    <div class="col">
                      <input type="date" class="form-control" v-model="fechaDesde">
                    </div>
                    <div class="col">
                      <input type="date" class="form-control" v-model="fechaHasta">
                    </div>
                  </div>
                </div>

                <!-- Estado -->
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" multiple v-model="filtroEstatus">
                    <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <small class="text-secondary">Puedes seleccionar varios.</small>
                </div>

                <!-- Solicitante -->
                <div class="mb-1 d-flex align-items-center justify-content-between">
                  <label class="form-label mb-0">Solicitante</label>
                  <small v-if="filtroSolicitante.length" class="text-secondary">{{ filtroSolicitante.length }} seleccionados</small>
                </div>
                <div class="input-group mb-2">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input class="form-control" placeholder="Buscar nombre" v-model="busquedaSolicitante">
                </div>
                <div class="border rounded p-2 mb-3" style="max-height: 220px; overflow:auto;">
                  <div class="form-check" v-for="u in solicitantesFiltrados" :key="u">
                    <input class="form-check-input" type="checkbox"
                           :id="'u_'+normalize(u)"
                           :checked="tempSolicitanteSelSet.has(u)"
                           @change="toggleTempSolicitante(u)">
                    <label class="form-check-label" :for="'u_'+normalize(u)">{{ u }}</label>
                  </div>
                </div>
                <div>
                  <input class="form-check-input" type="checkbox" id="chkOnlyMineDesk" v-model="onlyMine" @change="persistOnlyMine">
                  <label class="form-check-label" for="chkOnlyMineDesk"> Mis SOLPED</label>
                </div>
                <!-- Tamaño de página -->
                <div class="mb-0">
                  <label class="form-label">Tamaño de página</label>
                  <select class="form-select" v-model.number="pageSize" @change="persistPageSize">
                    <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <!-- Offcanvas filtros (móvil / tablet) -->
        <transition name="oc">
          <div
            v-if="showFiltersMobile"
            class="oc-wrap d-lg-none"
            @keydown.esc="closeFiltersMobile"
          >
            <!-- backdrop -->
            <div class="oc-backdrop" @click="closeFiltersMobile"></div>

            <!-- panel -->
            <div
              class="oc-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Filtros de historial Taller"
            >
              <div class="oc-header">
                <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
                  <button class="btn btn-sm btn-success" @click="applyFiltersAndClose">
                    Aplicar
                  </button>
                  <button class="btn btn-sm btn-outline-dark" @click="closeFiltersMobile" aria-label="Cerrar filtros">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <div class="oc-body">
                <!-- Texto libre -->
                <div class="mb-3">
                  <label class="form-label">Texto libre</label>
                  <input
                    class="form-control"
                    placeholder="Descripción, código, solicitante, empresa, CC…"
                    v-model="filtroTexto"
                  >
                </div>

                <!-- Rango de fechas -->
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="form-label">Desde</label>
                    <input type="date" class="form-control" v-model="fechaDesde">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Hasta</label>
                    <input type="date" class="form-control" v-model="fechaHasta">
                  </div>
                </div>

                <!-- Estado -->
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" multiple v-model="filtroEstatus">
                    <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <small class="text-secondary">Puedes seleccionar varios.</small>
                </div>

                <!-- Solicitante -->
                <div class="mb-1 d-flex align-items-center justify-content-between">
                  <label class="form-label mb-0">Solicitante</label>
                  <small v-if="tempSolicitanteSelSet.size" class="text-secondary">
                    {{ tempSolicitanteSelSet.size }} seleccionados
                  </small>
                </div>
                <div class="input-group mb-2">
                  <span class="input-group-text"><i class="bi bi-person" aria-hidden="true"></i></span>
                  <input
                    class="form-control"
                    placeholder="Buscar nombre"
                    v-model="busquedaSolicitante"
                    aria-label="Buscar solicitante"
                  >
                </div>
                <div class="border rounded p-2 mb-3" style="max-height: 220px; overflow:auto;">
                  <div class="form-check" v-for="u in solicitantesFiltrados" :key="u">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="'m_u_'+normalize(u)"
                      :checked="tempSolicitanteSelSet.has(u)"
                      @change="toggleTempSolicitante(u)"
                    >
                    <label class="form-check-label" :for="'m_u_'+normalize(u)">{{ u }}</label>
                  </div>
                </div>

                <!-- Solo mis SOLPED -->
                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="m_chkOnlyMine"
                      v-model="onlyMine"
                    >
                    <label class="form-check-label" for="m_chkOnlyMine">
                      Ver sólo mis SOLPED
                    </label>
                  </div>
                </div>

                <!-- Tamaño de página -->
                <div class="mb-0">
                  <label class="form-label">Tamaño de página</label>
                  <select class="form-select" v-model.number="pageSize">
                    <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </transition>

        <!-- FAB filtros (móvil) -->
        <button
          class="btn btn-primary floating-filters-btn d-lg-none"
          type="button"
          title="Filtros"
          @click="openFiltersMobile"
        >
          <i class="bi bi-funnel"></i>
        </button>
        <button
          class="btn btn-primary floating-filters-btn d-lg-none"
          @click="openFiltersMobile"
          :title="showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'"
          aria-label="Abrir filtros"
        >
          <i class="bi bi-funnel" aria-hidden="true"></i>
        </button>

        <!-- ========= MODAL EDICIÓN SOLPED TALLER ========= -->
        <div v-if="showEditModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,.55);">
          <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  Editar SOLPED Taller #{{ editForm.numero_solpe }}
                  <span class="badge bg-secondary ms-2">{{ editForm.empresa || '—' }}</span>
                </h5>
                <button class="btn-close" @click="cerrarEditar"></button>
              </div>

              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-12 col-md-4">
                    <label class="form-label">Empresa</label>
                    <select class="form-select" v-model="editForm.empresa">
                      <option value="Xtreme Servicios">Xtreme Servicios</option>
                      <option value="Xtreme Mining">Xtreme Mining</option>
                      <option value="Xtreme Hormigones">Xtreme Hormigones</option>
                    </select>
                  </div>

                  <div class="col-12 col-md-4">
                    <label class="form-label">Tipo SOLPED</label>
                    <input class="form-control" v-model="editForm.tipo_solped" placeholder="REPUESTOS, SERVICIOS, etc.">
                  </div>

                  <div class="col-12 col-md-4">
                    <label class="form-label">N° SOLPED</label>
                    <input class="form-control" :value="editForm.numero_solpe" disabled>
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label">Centro de costo (código)</label>
                    <select class="form-select" v-model="editForm.centro_costo">
                      <option v-for="opt in ccAll" :key="opt.code" :value="opt.code">
                        {{ opt.code }} — {{ opt.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label">Solicitante</label>
                    <input class="form-control" v-model="editForm.nombre_solicitante" maxlength="120">
                  </div>

                  <div class="col-12">
                    <div class="d-flex align-items-center justify-content-between">
                      <label class="form-label mb-0">Ítems</label>
                      <button class="btn btn-sm btn-outline-primary" @click="agregarItem()">Agregar ítem</button>
                    </div>

                    <div class="table-responsive mt-2">
                      <table class="table table-sm align-middle">
                        <thead class="table-light">
                          <tr>
                            <th style="width:70px;">Ítem</th>
                            <th>Descripción</th>
                            <th style="width:160px;">Código ref.</th>
                            <th style="width:110px;">Cantidad</th>
                            <th style="width:140px;">N° Interno</th>
                            <th style="width:60px;"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(it, idx) in editItems" :key="it.__k">
                            <td>{{ it.item || (idx+1) }}</td>
                            <td>
                              <textarea class="form-control form-control-sm" v-model="it.descripcion" rows="2" placeholder="Descripción del ítem"></textarea>
                            </td>
                            <td><input class="form-control form-control-sm" v-model="it.codigo_referencial"></td>
                            <td><input class="form-control form-control-sm" type="number" min="0" v-model.number="it.cantidad"></td>
                            <td><input class="form-control form-control-sm" v-model="it.numero_interno"></td>
                            <td class="text-end">
                              <button class="btn btn-sm btn-outline-danger" @click="eliminarItem(idx)">
                                <i class="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                          <tr v-if="editItems.length===0">
                            <td colspan="6" class="text-center text-muted py-4">Sin ítems.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="form-text">Nota: la imagen del ítem no se edita aquí.</div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-outline-secondary" @click="cerrarEditar">Cancelar</button>
                <button class="btn btn-primary" :disabled="savingEdit" @click="guardarEdicion">
                  <span v-if="savingEdit" class="spinner-border spinner-border-sm me-2"></span>
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- ========= /MODAL ========= -->
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "@/stores/firebase";
import {
  collection, getDocs, getDoc, doc, query, where, orderBy,
  updateDoc, addDoc, setDoc, limit, onSnapshot
} from "firebase/firestore";
import { useAuthStore } from "../stores/authService";
import * as XLSX from "xlsx-js-style";

export default {
  name: "HistorialSolpedTaller",
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const volver = () => router.back();

    const error = ref("");

    const loading = ref(true);
    const loadingSearch = ref(false);

    // Buscar exacto
    const numeroBusqueda = ref("");
    const solpeEncontrada = ref(null);

    const REALTIME_LIMIT = 800; // escucha los más recientes
    let solpesUnsub = null;

    // Datos y filtros
    const solpesOriginal = ref([]);

    // OCs por SOLPED (tiempo real por tarjeta expandida)
    const _ocBySolped = ref(new Map());
    const _ocLoading = ref(new Set());
    const _ocUnsubs = new Map(); // solpedId -> unsubscribe

    const isLoadingOC = (solpedId) => _ocLoading.value.has(solpedId);
    const ocListFor = (solpedId) => _ocBySolped.value.get(solpedId) || [];

    // ===== Dropdowns (Bootstrap) =====
    let _dropdownMap = new Map();
    let DropdownClass = null;
    const ensureDropdownClass = async () => {
      if (DropdownClass) return;
      try {
        DropdownClass = (await import('bootstrap/js/dist/dropdown')).default;
      } catch {
        DropdownClass = window?.bootstrap?.Dropdown || null;
      }
    };

    function initDropdownsIn(el = document) {
      const Dropdown = DropdownClass || (window?.bootstrap && window.bootstrap.Dropdown) || null;
      if (!Dropdown) return;

      const toggles = el.querySelectorAll('[data-bs-toggle="dropdown"]');
      toggles.forEach((btn) => {
        if (_dropdownMap.has(btn)) return; // ya instanciado
        const instance = new Dropdown(btn, { boundary: 'viewport', display: 'static' });
        _dropdownMap.set(btn, instance);

        const tableWrap = btn.closest('.table-responsive');
        const ddRoot = btn.closest('.dropdown, .dropup');

        const onShow = () => {
          tableWrap?.classList.add('dropdown-open');
          if (ddRoot) {
            ddRoot.classList.remove('dropup');
            const rect = btn.getBoundingClientRect();
            const espacioAbajo = window.innerHeight - rect.bottom;
            const ALTURA_MENU_ESTIMADA = 240;
            if (espacioAbajo < ALTURA_MENU_ESTIMADA) ddRoot.classList.add('dropup');
          }
        };
        const onHide = () => {
          tableWrap?.classList.remove('dropdown-open');
          ddRoot?.classList.remove('dropup');
        };

        btn.addEventListener('show.bs.dropdown', onShow);
        btn.addEventListener('hide.bs.dropdown', onHide);
      });
    }

    function disposeDropdowns() {
      try {
        _dropdownMap.forEach((inst) => { try { inst.dispose?.(); } catch(e) {console.error(e)} });
      } finally {
        _dropdownMap = new Map();
      }
    }

    // Filtros base
    const filtroTexto = ref("");
    const fechaDesde = ref("");
    const fechaHasta = ref("");
    const filtroEstatus = ref([]);
    const filtroSolicitante = ref([]);   // nombres en MAYÚSCULAS
    const busquedaSolicitante = ref("");
    const onlyMine = ref(false);

    // Centros de costo (map)
    const centrosCosto = {
      "27483":"CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA",
      "PPCALAMA":"PLANTA PREDOSIFICADO CALAMA",
      "20915":"CONTRATO 20915 SUM. HORMIGON DAND",
      "23302-CARPETAS":"CONTRATO 23302 CARPETAS",
      "23302-AMPL":"CONTRATO 23302 AMPLIACION",
      "OFANDES":"OFICINA LOS ANDES",
      "CASAMATRIZ":"CASA MATRIZ",
      "RRHH":"RRHH",
      "FINANZAS":"FINANZAS",
      "SUST":"SUSTENTABILIDAD",
      "SOPTI":"SOPORTE TI",
      "STRIPCENTER":"STRIP CENTER",
      "PLANIF":"PLANIFICACION",
      "PPSB":"PLANTA PREDOSIFICADO SAN BERNARDO",
      "PHUSB":"PLANTA HORMIGON URB.SAN BERNARDO",
      "ALTOMAIPO":"ALTO MAIPO",
      "PHURAN":"PLANTA HORMIGON URB. RANCAGUA",
      "PARAN":"PLANTA ARIDOS RANCAGUA",
      "PASB":"PLANTA ARIDOS SAN BERNARDO",
      "22368":"CONTRATO 22368 SUM HORMIGON DET",
      "28662":"CONTRATO 28662 CARPETAS",
      "29207":"CONTRATO 29207 MINERIA",
      "INFRAESTRUCTURA":"CONTRATO INFRAESTRUCTURA DET",
      "HORMIGONES DET":"CONTRATO SUMINISTRO DE HORMIGONES DET",
      "HORMIGONES DAND":"CONTRATO SUMINISTRO DE HORMIGONES DAND",
      "23302":"CONTRATO MANTENCIÓN Y REPARACIÓN DE INFRAESTRUCTURA DAND",
      "CARPETASDET":"CONTRATO CARPETAS DET",
      "30-10-11":"GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM",
      "SANJOAQUIN":"SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN",
      "URBANOS":"SUMINISTRO DE HORMIGONES URBANOS SAN BERNARDO Y OLIVAR",
      "CS":"CONTRATO DE SUMINISTRO DE HORMIGONES CS",
      "PREDOSIFICADO":"CONTRATO HORMIGONES Y PREDOSIFICADO",
      "CANECHE":"CONTRATO TALLER CANECHE",
      "CHUQUICAMATA":"CONTRATO CHUQUICAMATA"
    };
    const ccAll = ref(Object.keys(centrosCosto).map(code => ({ code, name: centrosCosto[code] })));
    const ccSearch = ref("");
    const selectedCC = ref([]);
    const ccFiltered = computed(() => {
      const nrm = (v="") => v.toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").toUpperCase().trim();
      const q = nrm(ccSearch.value);
      if (!q) return ccAll.value;
      return ccAll.value.filter(o => nrm(o.code).includes(q) || nrm(o.name).includes(q));
    });
    const removeCC = (code) => {
      selectedCC.value = selectedCC.value.filter(c => c !== code);
      goPage(1);
    };

    // Persistencia
    const LS_TALLER_FILTERS   = "hist_taller_filters_v2";
    const LS_SHOW_SIDEBAR     = "hist_taller_show_sidebar";

    // ✅ Persistencia de vista (página + scroll) para HistorialSolpedTaller
    const LS_TALLER_VIEW = "HISTORIAL_SOLPED_TALLER_VIEW_V1";

    const pendingViewState = ref(null);
    const didRestoreView = ref(false);
    const isHydrating = ref(true);
    const readViewState = () => {
      try {
        const raw = localStorage.getItem(LS_TALLER_VIEW);
        if (!raw) return null;
        const v = JSON.parse(raw);
        return {
          page: Number(v?.page) || 1,
          scrollY: Number(v?.scrollY) || 0,
        };
      } catch {
        return null;
      }
    };

    const writeViewState = (patch = {}) => {
      try {
        const current = readViewState() || {};
        const next = { ...current, ...patch };
        localStorage.setItem(LS_TALLER_VIEW, JSON.stringify(next));
      } catch {
        /* noop */
      }
    };

    const persistViewStateNow = () => {
      writeViewState({
        page: page.value,
        scrollY: window.scrollY || 0,
      });
    };


    // Paginación
    const page = ref(1);
    const pageSizeOptions = [10, 20, 30, 40, 50];
    const pageSize = ref(10);

    const showSidebar = ref(true);

    const persistFilters = () => {
      const payload = {
        filtroTexto: filtroTexto.value || "",
        fechaDesde:  fechaDesde.value || "",
        fechaHasta:  fechaHasta.value || "",
        filtroEstatus: Array.isArray(filtroEstatus.value) ? filtroEstatus.value : [],
        filtroSolicitante: Array.isArray(filtroSolicitante.value) ? filtroSolicitante.value : [],
        selectedCC: Array.isArray(selectedCC.value) ? selectedCC.value : [],
        onlyMine: !!onlyMine.value,
        pageSize: Number(pageSize.value || 10),
      };
      try { localStorage.setItem(LS_TALLER_FILTERS, JSON.stringify(payload)); } catch(e){ console.error(e); }
    };

    const loadPersistedFilters = () => {
      try {
        const raw = localStorage.getItem(LS_TALLER_FILTERS);
        if (!raw) return;
        const f = JSON.parse(raw);

        filtroTexto.value       = f.filtroTexto ?? "";
        fechaDesde.value        = f.fechaDesde ?? "";
        fechaHasta.value        = f.fechaHasta ?? "";
        filtroEstatus.value     = Array.isArray(f.filtroEstatus) ? f.filtroEstatus : [];
        filtroSolicitante.value = Array.isArray(f.filtroSolicitante) ? f.filtroSolicitante : [];
        selectedCC.value        = Array.isArray(f.selectedCC) ? f.selectedCC : [];
        tempSolicitanteSelSet.value = new Set(filtroSolicitante.value);
        onlyMine.value          = !!f.onlyMine;
        if ([10,20,30,40,50].includes(Number(f.pageSize))) pageSize.value = Number(f.pageSize);
      } catch(e){  console.error(e);  }
    };

    const syncFromStorageEvent = (e) => {
      if (e.key === LS_TALLER_FILTERS && e.newValue) {
        loadPersistedFilters();
        goPage(page.value);
      } else if (e.key === LS_SHOW_SIDEBAR && e.newValue !== null) {
        showSidebar.value = (e.newValue === "1");
      }
    };

    // Solicitantes
    const listaSolicitantes = ref([]);
    const tempSolicitanteSelSet = ref(new Set());

    // Otros estados
    const solpeExpandidaId = ref(null);
    const ordenAscendente = ref(false);

    // Identidad
    const myFullName = ref("");
    const myUid = computed(() => (auth?.user?.uid || "").toString());
    const myEmail = computed(() => (auth?.user?.email || "").toLowerCase());

    // Roles y permisos
    const userRole = ref('');
    const allowedRoles = new Set(['admin', 'aprobador/editor', 'editor']);
    const canChangeStatus = computed(() => allowedRoles.has((userRole.value || '').toLowerCase()));
    const canCopySolped = computed(() => (userRole.value || '').toLowerCase() === 'generador solped');
    const isStrictEditor = computed(() => (userRole.value || '').toLowerCase() === 'editor');

    const canEditAnyByRole = computed(() => {
      const r = (userRole.value || "").toLowerCase();
      return r === "aprobador/editor" || r === "editor" || r === "admin";
    });

    const WHITELIST_EMAILS = new Set(['tallercm@xtremeservicios.cl']);
    const WHITELIST_NAMES  = new Set(['TALLER CM']);
    const isWhitelistedViewer = computed(() =>
      WHITELIST_EMAILS.has(myEmail.value) || WHITELIST_NAMES.has((myFullName.value || '').toUpperCase())
    );

    const isEditor = computed(() => allowedRoles.has((userRole.value || '').toLowerCase()));
    const canViewHistorial = computed(() => isEditor.value || isWhitelistedViewer.value);

    const loadUserRole = async () => {
      try {
        const uid = auth?.user?.uid;
        if (!uid) return;

        // intenta "Usuarios"
        let usnap = await getDoc(doc(db, "Usuarios", uid));

        // fallback a "usuarios" si no existe
        if (!usnap.exists()) {
          usnap = await getDoc(doc(db, "usuarios", uid));
        }

        if (usnap.exists()) {
          const u = usnap.data() || {};
          userRole.value = (u.role || u.rol || "").toString();
        }
      } catch (e) {
        console.error(e);
      }
    };


    const canGenerateOC = (s) => {
      if (!isStrictEditor.value) return false;
      const st = (s?.estatus || '').toString().trim().toLowerCase();
      return st === 'pendiente' || st === 'parcial'|| st === 'cotizado parcial';
    };

    const irAGenerarOCTaller = (s) => {
      if (!s?.id) return;
      try {
        router.push({ name: 'GeneradorOCTaller', query: { fromSolpedId: s.id } });
      } catch {
        router.push({ path: '/generar-oc-taller', query: { fromSolpedId: s.id } });
      }
    };

    const persistOnlyMine = () => { persistFilters(); goPage(1); };
    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value;
      try { localStorage.setItem(LS_SHOW_SIDEBAR, showSidebar.value ? "1" : "0"); } catch(e) { console.log(e) }
    };
    const persistPageSize = () => { persistFilters(); goPage(1); };

    const normalize = (v="") => v.toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").toUpperCase().trim();
    const formatDateTime = (d) => {
      if (!d) return "";
      if (typeof d === "string") return d;
      const dd = (d instanceof Date) ? d : new Date(d);
      if (isNaN(dd)) return "";
      return dd.toLocaleString();
    };

    const todayStr = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const dy = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${dy}`;
    };

    const getColorByStatus = (estatus) => {
      const e = (estatus || "")
        .toString()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

      switch (e) {

        case "pendiente": return "#fd7e14";
        case "revision":
        case "en revision":
        case "revisado": return "#0d6efd";
        case "cotizado parcial": return "#0dcaf0";
        case "cotizado completado": return "#28a745";
        case "productos en casa matriz":
        case "pedidos en casa matriz":
        case "pedido en casa matriz": return "#6f42c1";
        case "parcial": return "#0dcaf0";
        case "completado": return "#28a745";
        case "revision guillermo": return "#20c997";
        case "preaprobado": return "#ffc107";
        case "casi aprobada": return "#6610f2";
        case "aprobada":
        case "cotizacion aprobada": return "#198754";
        case "enviada a proveedor":
        case "oc enviada a proveedor":
        case "archivo oc subido (enviado a proveedor)": return "#17a2b8";
        case "recepcion completa en casa matriz": return "#198754";
        case "recepcion parcial en casa matriz": return "#ffc107";
        case "recepcion en casa matriz": return "#0d6efd";
        case "rechazado": return "#dc3545";
        default: return "#6c757d";
      }
    };

    const estadoChipStyle = (s) => ({ background: getColorByStatus(s?.estatus), color: "#fff", padding: "4px 10px", fontWeight: "bold" });
    const getBadgeColor = (e) => getColorByStatus(e);
    const startRealtimeSolpes = () => {
      if (solpesUnsub) { solpesUnsub(); solpesUnsub = null; }
      loading.value = true;

      const qy = query(
        collection(db, "solped_taller"),
        orderBy("numero_solpe", "desc"),
        limit(REALTIME_LIMIT)
      );

      solpesUnsub = onSnapshot(qy, (snap) => {
        const list = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          const comentarios = Array.isArray(data.comentarios) ? data.comentarios.map(c => ({

            ...c,
            fecha: c?.fecha?.toDate ? c.fecha.toDate() : (c?.fecha ? new Date(c.fecha) : null),
            vistoPor: Array.isArray(c?.vistoPor) ? c.vistoPor : []
          })) : [];
          list.push({
            id: d.id,
            ...data,
            comentarios
          });
        });
        list.sort((a,b)=> (b.numero_solpe||0) - (a.numero_solpe||0));
        solpesOriginal.value = list;
        const setSol = new Set(list.map(x => (x.nombre_solicitante || "").toString().toUpperCase()).filter(Boolean));
        listaSolicitantes.value = Array.from(setSol).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));

        loading.value = false;
        // ✅ Restaurar página/scroll SOLO una vez, cuando ya existe data (totalPages ya está correcto)
        if (!didRestoreView.value && pendingViewState.value) {
          didRestoreView.value = true;

          const st = pendingViewState.value;
          pendingViewState.value = null;

          const targetPage = Math.min(Math.max(1, st.page || 1), totalPages.value);
          page.value = targetPage;

          nextTick(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, st.scrollY || 0);
            });
          });

        }
        isHydrating.value = false; // ✅

      }, (err) => {
        console.error(err);
        error.value = "No se pudieron escuchar las SOLPED de taller.";
        loading.value = false;
        isHydrating.value = false;
      });
    };

    const stopRealtimeSolpes = () => {
      if (solpesUnsub) { solpesUnsub(); solpesUnsub = null; }
    };
    const ensureOCListener = async (solpedId) => {
      if (!solpedId) return;
      if (_ocUnsubs.has(solpedId)) return;

      try {
        _ocLoading.value.add(solpedId);

        const q1 = query(
          collection(db, "ordenes_oc_taller"),
          where("solpedId", "==", solpedId)
        );

        const unsub = onSnapshot(q1, (snap) => {
          const list = [];
          snap.forEach((d) => {
            const data = d.data() || {};
            let fsub = data.fechaSubida;
            if (fsub?.toDate) fsub = fsub.toDate();
            else if (typeof fsub === "string" && !isNaN(Date.parse(fsub))) fsub = new Date(fsub);
            list.push({
              __docId: d.id,
              id: data.id ?? null,
              fechaSubida: fsub || data.fechaSubida || null,
              estatus: data.estatus || null
            });
          });
          list.sort((a,b)=>(a.id||0)-(b.id||0));
          _ocBySolped.value.set(solpedId, list);
        }, (err) => {
          console.error(err);
          _ocBySolped.value.set(solpedId, []);
        });

        _ocUnsubs.set(solpedId, unsub);
      } finally {
        _ocLoading.value.delete(solpedId);
      }
    };

    const stopOCListener = (solpedId) => {
      const unsub = _ocUnsubs.get(solpedId);
      if (unsub) {
        try { unsub(); } catch(e) {console.error(e);}
        _ocUnsubs.delete(solpedId);
      }
      _ocBySolped.value.delete(solpedId);
      _ocLoading.value.delete(solpedId);
    };

    const stopAllOCListeners = () => {
      for (const unsub of _ocUnsubs.values()) {
        try { unsub(); } catch(e) {console.error(e); }
      }
      _ocUnsubs.clear();
      _ocBySolped.value = new Map();
      _ocLoading.value = new Set();
    };

    const goOC = (oc) => {
      if (!oc) return;

      // ✅ guardar página + scroll antes de navegar
      persistViewStateNow();

      const docId = oc.__docId;
      if (router.hasRoute("OrdenOCTallerDetalle")) {
        router.push({ name: "OrdenOCTallerDetalle", params: { id: docId }, query: { id: oc.id ?? undefined } });
      } else {
        router.push(`/ordenes-oc-taller/${docId}${oc.id ? `?id=${oc.id}` : ""}`);
      }
    };

    const verDetalleSolped = (s) => {
      try {
        if (!s?.id) return;

        // ✅ guardar página/scroll antes de navegar
        persistViewStateNow();

        if (router.hasRoute("SolpedTallerDetalle")) {
          router.push({
            name: "SolpedTallerDetalle",
            params: { id: s.id },
            query: { numero: s.numero_solpe ?? undefined }
          });
        } else {
          router.push({
            path: `/solped-taller/${s.id}`,
            query: { numero: s.numero_solpe ?? undefined }
          });
        }
      } catch {
        error.value = "No se pudo abrir el detalle de la SOLPED.";
      }
    };

    const onExpandCard = async (s) => {
      const newId = (solpeExpandidaId.value === s.id) ? null : s.id;
      if (solpeExpandidaId.value && solpeExpandidaId.value !== newId) {
        stopOCListener(solpeExpandidaId.value);
      }

      solpeExpandidaId.value = newId;

      if (solpeExpandidaId.value === s.id) {
        await marcarComentariosVistos(s);
        await ensureOCListener(s.id);
        await nextTick();
        disposeDropdowns();
        await ensureDropdownClass();
        initDropdownsIn();
      }
    };

    const marcarComentariosVistos = async (s) => {
      try {
        const uid = myUid.value;
        if (!uid) return;
        const comentarios = Array.isArray(s.comentarios) ? s.comentarios.map(c => ({
          ...c,
          vistoPor: Array.isArray(c.vistoPor) ? (c.vistoPor.includes(uid) ? c.vistoPor : [...c.vistoPor, uid]) : [uid]
        })) : [];
        await setDoc(doc(db, "solped_taller", s.id), { comentarios }, { merge: true });
        s.comentarios = comentarios;
      } catch { /* noop */ }
    };

    const solicitantesFiltrados = computed(() => {
      const q = normalize(busquedaSolicitante.value);
      return listaSolicitantes.value.filter(n => !q || normalize(n).includes(q));
    });
    const toggleTempSolicitante = (name) => {
      const s = tempSolicitanteSelSet.value;
      s.has(name) ? s.delete(name) : s.add(name);
    };
    const clearTempSolicitantes = () => { tempSolicitanteSelSet.value.clear(); };
    const applySolicitantesFiltro = () => {
      filtroSolicitante.value = Array.from(tempSolicitanteSelSet.value);
      persistFilters();
      goPage(1);
    };

    const hasActiveFilters = computed(() =>
      !!(filtroTexto.value || fechaDesde.value || fechaHasta.value || filtroEstatus.value.length || filtroSolicitante.value.length || selectedCC.value.length || onlyMine.value)
    );

    const aplicarFiltros = (arr) => {
      const q = normalize(filtroTexto.value);

      let from = fechaDesde.value ? new Date(fechaDesde.value) : null;
      let to   = fechaHasta.value ? new Date(fechaHasta.value) : null;

      if (from && to && from > to) {
        const tmp = from;
        from = to;
        to   = tmp;
      }

      if (to) to.setHours(23, 59, 59, 999);

      const fe = filtroEstatus.value || [];
      const fs = filtroSolicitante.value || [];
      const ccSet = new Set((selectedCC.value || []).map(s => String(s).toUpperCase().trim()));

      const nameMine = (myFullName.value || "").toUpperCase();

      const filtered = (arr || []).filter(s => {

        if (onlyMine.value && nameMine && (s.nombre_solicitante||"").toUpperCase() !== nameMine) {
          return false;
        }

        if (from || to) {
          const d = s.fecha ? new Date(s.fecha) : null;
          if (!d || isNaN(d)) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
        }

        if (fe.length && !fe.includes(s.estatus)) return false;

        if (ccSet.size) {
          const ccVal = (s.centro_costo || "").toString().toUpperCase().trim();
          if (!ccSet.has(ccVal)) return false;
        }

        const solUpper = (s.nombre_solicitante || "").toString().toUpperCase();
        if (fs.length && !fs.includes(solUpper)) return false;

        if (q) {
          const hay = [
            s.descripcion_general || "",
            s.empresa || "",
            s.centro_costo || "",
            s.tipo_solped || "",
            s.nombre_solicitante || "",
            s.numero_solpe?.toString() || "",
            ...(Array.isArray(s.items) ? s.items.flatMap(it => [
              it.descripcion || "",
              it.codigo_referencial || "",
              it.numero_interno || ""
            ]) : [])
          ].join(" | ");
          if (!normalize(hay).includes(q)) return false;
        }

        return true;
      });

      filtered.sort((a,b)=> ordenAscendente.value
        ? (a.numero_solpe - b.numero_solpe)
        : (b.numero_solpe - a.numero_solpe)
      );
      return filtered;
    };

    const filteredAll = computed(() => aplicarFiltros(solpesOriginal.value));
    const totalPages = computed(() => Math.max(1, Math.ceil(filteredAll.value.length / pageSize.value)));
    const pageFrom = computed(() => filteredAll.value.length ? (page.value - 1) * pageSize.value + 1 : 0);
    const pageTo = computed(() => Math.min(filteredAll.value.length, page.value * pageSize.value));
    const pagedList = computed(() => filteredAll.value.slice(pageFrom.value - 1, pageTo.value));

    const goPage = async (p) => {
      if (p < 1) p = 1;
      if (p > totalPages.value) p = totalPages.value;

      // ✅ NUEVO: persistir “dónde estoy” apenas cambio de página
      writeViewState({ page: p, scrollY: window.scrollY || 0 });

      page.value = p;
      solpeExpandidaId.value = null;
      stopAllOCListeners();
      await nextTick();
      disposeDropdowns();
      await ensureDropdownClass();
      initDropdownsIn();
    };


    const nextPage = () => goPage(page.value + 1);
    const prevPage = () => goPage(page.value - 1);
    const goFirst = () => goPage(1);
    const goLast = () => goPage(totalPages.value);

    const ordenarSolpes = async () => {
      ordenAscendente.value = !ordenAscendente.value;
      await goPage(1);
    };
    const limpiarFiltros = async () => {
      filtroTexto.value = "";
      fechaDesde.value = "";
      fechaHasta.value = "";
      filtroEstatus.value = [];
      filtroSolicitante.value = [];
      tempSolicitanteSelSet.value.clear();
      selectedCC.value = [];
      ccSearch.value = "";
      onlyMine.value = false;
      persistFilters();
      await goPage(1);
    };

    const removeEstatus = (s) => { filtroEstatus.value = filtroEstatus.value.filter(x => x!==s); persistFilters(); goPage(1) ;};
    const removeSolicitante = (u) => { filtroSolicitante.value = filtroSolicitante.value.filter(x => x!==u); tempSolicitanteSelSet.value.delete(u); persistFilters(); goPage(1); };

    // ===== Evitar saltos al cambiar estado =====
    const savedScrollY = ref(0);
    const restoreScrollSoon = async () => {
      await nextTick();
      requestAnimationFrame(() => { window.scrollTo(0, savedScrollY.value || 0); });
    };

    const setStatus = async (s, estatus) => {
      if (!canChangeStatus.value) {
        error.value = "No tienes permisos para cambiar el estado.";
        return;
      }
      try {
        savedScrollY.value = window.scrollY;

        const refd = doc(db, "solped_taller", s.id);

        if (estatus === "Completado" || estatus === "Rechazado") {
          const estadoItem = estatus === "Completado" ? "completado" : "rechazado";

          const itemsUpd = (s.items || []).map(it => ({
            ...it,
            estado: estadoItem
          }));

          await updateDoc(refd, { estatus, items: itemsUpd });
          s.estatus = estatus;
          s.items = itemsUpd;
        } else {
          await updateDoc(refd, { estatus });
          s.estatus = estatus;
        }

        const usuario =
          myFullName.value ||
          auth?.user?.displayName ||
          auth?.user?.email ||
          "Anónimo";

        await addDoc(
          collection(db, "solped_taller", s.id, "historialEstados"),
          { fecha: new Date(), estatus, usuario }
        );

        restoreScrollSoon();
      } catch (e) {
        console.error(e);
        error.value = "Error al actualizar estatus.";
      }
    };

    const setItemStatus = async (solpe, item, nuevo) => {
      if (!canChangeStatus.value) {
        error.value = "No tienes permisos para cambiar el estado del ítem.";
        return;
      }
      try {
        savedScrollY.value = window.scrollY;

        const refd = doc(db, "solped_taller", solpe.id);
        const itemsUpd = (solpe.items || []).map(it =>
          (String(it.item) === String(item.item)) ? { ...it, estado: nuevo } : it
        );
        await updateDoc(refd, { items: itemsUpd });
        solpe.items = itemsUpd;

        restoreScrollSoon();
      } catch (e) {
        console.error(e);
        error.value = "No se pudo cambiar el estado del ítem.";
      }
    };

    // Comentarios
    const agregarComentario = async (s) => {
      const texto = (s.nuevoComentario || "").trim();
      if (!texto) return;
      try {
        const usuario = myFullName.value || auth?.user?.displayName || auth?.user?.email || "Anónimo";
        const refd = doc(db, "solped_taller", s.id);
        const snap = await getDoc(refd);
        const data = snap.data() || {};
        const curr = Array.isArray(data.comentarios) ? data.comentarios : [];
        curr.push({ texto, fecha: new Date(), usuario, vistoPor: [myUid.value].filter(Boolean) });
        await setDoc(refd, { comentarios: curr }, { merge: true });
        s.comentarios = curr;
        s.nuevoComentario = "";
      } catch (e) {
        console.error(e);
        error.value = "Error al guardar el comentario.";
      }
    };

    const prepararCopiaParaCrear = (s) => {
      try {
        const payload = {
          from: 'historial',
          fecha: todayStr(),
          empresa: s.empresa || 'Xtreme Servicios',
          nombre_solicitante: s.nombre_solicitante || '',
          tipo_solped: s.tipo_solped || 'REPUESTOS',
          centro_costo: s.centro_costo || '',
          items: (Array.isArray(s.items) ? s.items : []).map((it, idx) => ({
            id: idx + 1,
            descripcion: (it.descripcion || '').toString().toUpperCase(),
            codigo_referencial: (it.codigo_referencial || '').toString().toUpperCase(),
            cantidad: Number(it.cantidad || 1),
            numero_interno: (it.numero_interno || '').toString().toUpperCase(),
            imagen_url: it.imagen_url || '',
            editando: true
          }))
        };
        sessionStorage.setItem('solped_taller_import', JSON.stringify(payload));

        if (router.hasRoute('SolpedTaller')) {
          router.push({ name: 'SolpedTaller', query: { import: '1' } });
        } else {
          router.push({ path: '/solped-taller', query: { import: '1' } });
        }
      } catch (e) {
        console.error(e);
        error.value = 'No se pudo preparar la copia para Crear SOLPED.';
      }
    };
    const limpiarBusquedaExacta = async () => {
      numeroBusqueda.value = "";
      solpeEncontrada.value = null;
      error.value = "";
      filtroTexto.value = "";
      await goPage(1);
    };

    const buscarSolpeExacta = async () => {
      error.value = "";
      solpeEncontrada.value = null;

      const raw = (numeroBusqueda.value ?? "").toString().trim();
      if (!raw) {
        filtroTexto.value = "";
        await goPage(1);
        return;
      }

      loadingSearch.value = true;
      try {
        const termNorm = normalize(raw);

        filtroTexto.value = raw;

        let found = null;

        if (/^\d+$/.test(raw)) {
          const n = Number(raw);
          const qy = query(
            collection(db, "solped_taller"),
            where("numero_solpe", "==", n),
            limit(1)
          );
          const snap = await getDocs(qy);
          if (!snap.empty) {
            const d = snap.docs[0];
            const data = d.data() || {};
            found = {
              id: d.id,
              ...data,
              comentarios: Array.isArray(data.comentarios) ? data.comentarios : []
            };
          }
        }

        if (!found) {
          const list = solpesOriginal.value || [];

          const match = list.find((s) => {
            const camposBase = [
              s.numero_solpe?.toString() || "",
              s.centro_costo || "",
              s.tipo_solped || "",
              s.empresa || "",
              s.nombre_solicitante || "",
            ];

            const camposItems = Array.isArray(s.items)
              ? s.items.flatMap((it) => [
                  it.descripcion || "",
                  it.codigo_referencial || "",
                  it.numero_interno || "",
                ])
              : [];

            const texto = [...camposBase, ...camposItems].join(" | ");
            return normalize(texto).includes(termNorm);
          });

          if (match) {
            found = match;
          }
        }

        if (found) {
          solpeEncontrada.value = found;
        } else {
          error.value = "No se encontró ninguna SOLPED Taller con ese criterio.";
        }
      } catch (e) {
        console.error(e);
        error.value = "No se pudo realizar la búsqueda.";
      } finally {
        loadingSearch.value = false;
      }
    };

    const abrirImagen = (it) => {
      const src = it.imagen_url || "";
      if (!src) return;
      window.open(src, "_blank");
    };
    const abrirImagenNuevaPestana = (it) => abrirImagen(it);
    const setStyle = (ws, addr, s) => { if (!ws[addr]) ws[addr] = { t:'s', v:'' }; ws[addr].s = { ...(ws[addr].s||{}), ...s }; };
    const styleCell = (ws, r, c, s) => { const addr = XLSX.utils.encode_cell({ r, c }); setStyle(ws, addr, s); };
    const rangeBorder = (ws, r1, c1, r2, c2, border) => {
      for (let r=r1; r<=r2; r++) for (let c=c1; c<=c2; c++) styleCell(ws, r, c, { border });
    };

    const descargarExcel = (solpe) => {
      try {
        const data = [];
        const titulo = `SOLPED TALLER #${solpe.numero_solpe || ''}`;
        data.push([titulo]);
        data.push(['Solicitante:', solpe.nombre_solicitante ?? '']);
        data.push(['Fecha:', solpe.fecha ?? '']);
        data.push(['Centro de costo:', solpe.centro_costo ?? '']);
        data.push(['Empresa:', solpe.empresa ?? '']);
        data.push([]);

        const headers = ['ITEM','CANTIDAD','CANTIDAD COTIZADA','DESCRIPCIÓN','CÓDIGO REFERENCIAL','N° INTERNO','ESTATUS'];
        data.push(headers);

        (solpe.items || []).forEach((it, idx) => {
          data.push([
            it?.item ?? (idx+1),
            it?.cantidad ?? '',
            it?.cantidad_cotizada ?? '',
            it?.descripcion ?? '',
            it?.codigo_referencial ?? '',
            it?.numero_interno ?? '',
            it?.estado ?? ''
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `SOLPED_${solpe.numero_solpe || ''}`);

        const titleRow=0, infoStart=1, infoEnd=4, headerRow=6;
        const totalCols = headers.length;
        ws['!cols'] = [8,12,18,60,24,18,16].map(wch=>({wch}));

        const borderThin = { top:{style:'thin',color:{rgb:'FFCBD5E1'}}, left:{style:'thin',color:{rgb:'FFCBD5E1'}}, right:{style:'thin',color:{rgb:'FFCBD5E1'}}, bottom:{style:'thin',color:{rgb:'FFCBD5E1'}} };

        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s:{r:titleRow,c:0}, e:{r:titleRow,c:totalCols-1} });
        setStyle(ws, XLSX.utils.encode_cell({ r:titleRow, c:0 }), { font:{ bold:true, sz:18, color:{rgb:'FF111827'} }, alignment:{ horizontal:'center', vertical:'center'} });
        ws['!rows'] = ws['!rows'] || []; ws['!rows'][titleRow] = { hpt:28 };

        for (let r=infoStart; r<=infoEnd; r++) {
          styleCell(ws, r, 0, { font:{bold:true,color:{rgb:'FF374151'}}, alignment:{horizontal:'left',vertical:'center'}, border:borderThin });
          styleCell(ws, r, 1, { alignment:{horizontal:'left',vertical:'center'}, border:borderThin });
          ws['!merges'].push({ s:{ r, c:1 }, e:{ r, c: totalCols - 1 } });
        }

        for (let c=0; c<totalCols; c++) {
          styleCell(ws, headerRow, c, { font:{bold:true,color:{rgb:'FFFFFFFF'}}, fill:{fgColor:{rgb:'FF1F2937'}}, alignment:{horizontal:'center',vertical:'center',wrapText:true}, border:borderThin });
        }
        ws['!rows'][headerRow] = { hpt:24 };

        const startDataRow = headerRow + 1;
        const lastDataRow = data.length - 1;
        for (let r=startDataRow; r<=lastDataRow; r++) {
          const isEven = (r - startDataRow) % 2 === 0;
          for (let c=0; c<totalCols; c++) {
            styleCell(ws, r, c, {
              fill: isEven ? { fgColor:{rgb:'FFF8FAFC'} } : undefined,
              border: borderThin,
              alignment: c>=3 ? { horizontal:'left', vertical:'center', wrapText:true } : { horizontal:'center', vertical:'center' }
            });
          }
          styleCell(ws, r, 3, { alignment:{ horizontal:'left', vertical:'top', wrapText:true } });
        }
        if (data.length > headerRow) rangeBorder(ws, headerRow, 0, lastDataRow, totalCols - 1, borderThin);

        const hoy = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `SOLPED_TALLER_${solpe.numero_solpe || ''}_${hoy}.xlsx`);
      } catch (e) {
        console.error(e);
        error.value = "No se pudo generar el Excel.";
      }
    };

    // Sesión
    const loadMyName = async () => {
      try {
        let full = (auth?.user?.displayName || auth?.user?.email || "") || "";
        const uid = myUid.value;
        if (uid) {
          const me = await getDoc(doc(db, "Usuarios", uid));
          if (me.exists()) full = me.data()?.fullName || full;
        }
        myFullName.value = (full || "").toString().toUpperCase();
      } catch { /* noop */ }
    };

    // ====== Offcanvas móvil custom ======
    const showFiltersMobile = ref(false);

    const openFiltersMobile = () => {
      showFiltersMobile.value = true;
      document.body.classList.add("filters-open");
    };

    const closeFiltersMobile = () => {
      showFiltersMobile.value = false;
      document.body.classList.remove("filters-open");
    };

    const applyFiltersAndClose = () => {
      applySolicitantesFiltro();
      closeFiltersMobile();
    };

    // ====== Edición ======
    const showEditModal = ref(false);
    const savingEdit = ref(false);
    const editForm = ref({});
    const editItems = ref([]);

    const puedeEditarSolped = (s) => {
      const me = (myFullName.value || "").toUpperCase().trim();
      const docOwner = ((s?.usuario_sesion || s?.nombre_solicitante || "") + "").toUpperCase().trim();

      const soyDueno =
        (!!me && docOwner === me) ||
        (docOwner === "TALLER CM" && (me === "TALLER CM" || myEmail.value === "tallercm@xtremeservicios.cl"));

      const d = s?.fecha ? new Date(s.fecha) : null;
      if (!d || isNaN(d)) return false;

      const ahora = new Date();
      const dentro24h = (ahora.getTime() - d.getTime()) <= (24 * 60 * 60 * 1000);

      const sameLocalDay = (a, b) => {
        const ax = new Date(a.getFullYear(), a.getMonth(), a.getDate());
        const bx = new Date(b.getFullYear(), b.getMonth(), b.getDate());
        return ax.getTime() === bx.getTime();
      };
      const mismoDia = sameLocalDay(ahora, d);

      return soyDueno && mismoDia && dentro24h;
    };

    const puedeEditarPorRol = (s) => {
      if (!canEditAnyByRole.value) return false;
      const d = s?.fecha ? new Date(s.fecha) : null;
      if (!d || isNaN(d)) return false;

      const ahora = new Date();
      const dentro24h = (ahora.getTime() - d.getTime()) <= (24 * 60 * 60 * 1000);

      const sameLocalDay = (a, b) => {
        const ax = new Date(a.getFullYear(), a.getMonth(), a.getDate());
        const bx = new Date(b.getFullYear(), b.getMonth(), b.getDate());
        return ax.getTime() === bx.getTime();
      };
      const mismoDia = sameLocalDay(ahora, d);

      return mismoDia && dentro24h;
    };

    function abrirEditar(s){
      if (!(puedeEditarSolped(s) || puedeEditarPorRol(s))) {
        error.value = 'No puedes editar: dueño (usuario_sesion) o rol (Aprobador/Editor/Editor/Admin), mismo día y dentro de 24h.';
        return;
      }
      editForm.value = {
        id: s.id,
        numero_solpe: s.numero_solpe,
        empresa: s.empresa || 'Xtreme Servicios',
        tipo_solped: s.tipo_solped || '',
        centro_costo: s.centro_costo || '',
        nombre_solicitante: s.nombre_solicitante || '',
        fecha: s.fecha || null
      };
      editItems.value = (Array.isArray(s.items) ? s.items : []).map(it => ({
        __k: Math.random().toString(36).slice(2),
        item: it.item,
        descripcion: it.descripcion || '',
        codigo_referencial: it.codigo_referencial || '',
        cantidad: Number(it.cantidad || 0),
        numero_interno: it.numero_interno || ''
      }));
      showEditModal.value = true;
      // reinit dentro del modal por nuevos dropdowns si aparecen
      nextTick().then(async () => {
        disposeDropdowns();
        await ensureDropdownClass();
        initDropdownsIn();
      });
    }

    function cerrarEditar(){
      showEditModal.value = false;
      savingEdit.value = false;
      editForm.value = {};
      editItems.value = [];
      // reinit por cambios en DOM
      nextTick().then(async () => {
        disposeDropdowns();
        await ensureDropdownClass();
        initDropdownsIn();
      });
    }

    function agregarItem(){
      editItems.value.push({
        __k: Math.random().toString(36).slice(2),
        item: (editItems.value.length ? (Math.max(...editItems.value.map(i => Number(i.item)||0))+1) : 1),
        descripcion: '',
        codigo_referencial: '',
        cantidad: 1,
        numero_interno: ''
      });
    }
    function eliminarItem(idx){
      editItems.value.splice(idx,1);
    }

    async function guardarEdicion(){
      if (!editForm.value?.id) return;
      if (savingEdit.value) return;

      const refCheck = doc(db, 'solped_taller', editForm.value.id);
      const snapCheck = await getDoc(refCheck);
      const dataCheck = snapCheck.data() || {};
      const ok = puedeEditarSolped({ ...dataCheck, id: editForm.value.id }) || puedeEditarPorRol({ ...dataCheck, id: editForm.value.id });
      if (!ok) {
        error.value = 'La ventana de edición expiró o no tienes permiso (dueño por usuario_sesion o rol; mismo día y <=24h).';
        cerrarEditar();
        return;
      }

      savingEdit.value = true;
      try{
        const payload = {
          empresa: editForm.value.empresa || 'Xtreme Servicios',
          tipo_solped: editForm.value.tipo_solped || '',
          centro_costo: editForm.value.centro_costo || '',
          nombre_solicitante: editForm.value.nombre_solicitante || '',
          items: editItems.value.map(it => ({
            item: it.item,
            descripcion: it.descripcion || '',
            codigo_referencial: it.codigo_referencial || '',
            cantidad: Number(it.cantidad || 0),
            numero_interno: it.numero_interno || ''
          }))
        };

        await updateDoc(refCheck, payload);

        cerrarEditar();
      } catch(e){
        console.error(e);
        error.value = 'No se pudo guardar la edición.';
        savingEdit.value = false;
      }
    }

    onMounted(async () => {
      isHydrating.value = true;

      try {
        const savedSidebar = localStorage.getItem(LS_SHOW_SIDEBAR);
        if (savedSidebar === "0") showSidebar.value = false;
      } catch { /* noop */ }

      loadPersistedFilters();
      await loadUserRole();

      // ✅ lee la página/scroll guardados (se aplicarán cuando llegue el primer snapshot)
      pendingViewState.value = readViewState();
      didRestoreView.value = false;

      // Gate de acceso
      if (!(isEditor.value || isWhitelistedViewer.value)) {
        loading.value = false;
        isHydrating.value = false; // 👈 importante para que no quede “colgado”
        return;
      }

      await loadMyName();

      // Arranca TIEMPO REAL
      startRealtimeSolpes();

      // Bootstrap Dropdown
      await ensureDropdownClass();
      await nextTick();
      initDropdownsIn();

      window.addEventListener("storage", syncFromStorageEvent);
    });

    onUnmounted(() => {
      // ✅ guarda la página/scroll antes de salir
      persistViewStateNow();

      window.removeEventListener("storage", syncFromStorageEvent);
      stopAllOCListeners();
      stopRealtimeSolpes();
      disposeDropdowns();
      document.body.classList.remove("filters-open");
    });


    watch(
      [filtroTexto, fechaDesde, fechaHasta, filtroEstatus, filtroSolicitante, selectedCC, onlyMine],
      async () => {
        persistFilters();
        if (isHydrating.value) return; // ✅ NUEVO: no reiniciar página durante restore
        await goPage(1);
      },
      { deep: true }
    );

    watch([pageSize], async () => {
      persistFilters();
      if (isHydrating.value) return; // ✅ NUEVO
      await goPage(1);
    });


    // Reinicialización de dropdowns ante cambios relevantes
    watch([pagedList, solpeExpandidaId, showEditModal], async () => {
      await nextTick();
      disposeDropdowns();
      await ensureDropdownClass();
      initDropdownsIn();
    });

    // Constantes
    const listaEstatus = ["Completado","Rechazado","Pendiente","Parcial","Cotizado Parcial","Cotizado Completado","Parcial, Pedido en Casa matriz","Pedido en Casa matriz"];

    // Autorización
    const abrirAutorizacion = (s) => { if (!s?.autorizacion_url) return; window.open(s.autorizacion_url, "_blank"); };
    const descargarAutorizacion = (s) => {
      if (!s?.autorizacion_url) return;
      const a = document.createElement('a');
      a.href = s.autorizacion_url; a.download = s.autorizacion_nombre || "autorizacion";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    return {
      // estado
      error, loading, loadingSearch,
      numeroBusqueda, solpeEncontrada,

      // filtros
      filtroTexto, fechaDesde, fechaHasta,
      filtroEstatus, filtroSolicitante, busquedaSolicitante,
      listaEstatus, listaSolicitantes, tempSolicitanteSelSet, onlyMine,

      // data
      solpesOriginal, solpeExpandidaId, ordenAscendente,

      // UI
      showSidebar,

      // CC
      centrosCosto, ccAll, ccSearch, selectedCC, ccFiltered, removeCC,

      // paginación
      page, pageSize, pageSizeOptions, filteredAll, pagedList,
      totalPages, pageFrom, pageTo,

      // permisos
      userRole, canChangeStatus, canCopySolped,
      isEditor, canViewHistorial, isWhitelistedViewer,

      // métodos
      goPage, nextPage, prevPage, goFirst, goLast,
      ordenarSolpes, limpiarFiltros, toggleSidebar,
      persistOnlyMine, persistPageSize,
      toggleTempSolicitante, clearTempSolicitantes, applySolicitantesFiltro,
      removeEstatus, removeSolicitante,
      abrirImagen, abrirImagenNuevaPestana,
      setStatus, setItemStatus,
      descargarExcel, volver, onExpandCard, marcarComentariosVistos,
      abrirAutorizacion, descargarAutorizacion, agregarComentario,
      buscarSolpeExacta, goOC, verDetalleSolped, limpiarBusquedaExacta,

      // helpers
      formatDateTime, estadoChipStyle, getBadgeColor, solicitantesFiltrados, normalize,
      hasUnreadForMe: (s) => {
        const uid = myUid.value;
        if (!uid) return false;
        const arr = Array.isArray(s.comentarios) ? s.comentarios : [];
        return arr.some(c => !Array.isArray(c.vistoPor) || !c.vistoPor.includes(uid));
      },
      hasActiveFilters,

      // OCs realtime
      isLoadingOC, ocListFor, ensureOCListener,

      // nuevos
      canGenerateOC, irAGenerarOCTaller,

      // edición
      showEditModal, savingEdit, editForm, editItems,
      puedeEditarSolped, puedeEditarPorRol, abrirEditar, cerrarEditar,
      agregarItem, eliminarItem, guardarEdicion,

      // offcanvas móvil custom
      showFiltersMobile,
      openFiltersMobile,
      closeFiltersMobile,
      applyFiltersAndClose,prepararCopiaParaCrear,

      // para sesión
      myUid
    };
  }
};
</script>

<style scoped>
[v-cloak]{ display:none; }

/* ===== Layout base ===== */
.btn { border-radius: 6px; }
.btn.btn-sm { border-radius: 6px; }

.historial-taller-page{
  min-height:100vh;
}
.pointer{ cursor:pointer; }

/* ===== Alertas “pro” ===== */
.historial-taller-page .alert{
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: var(--bs-body-bg, #fff);
  color: var(--bs-body-color, #0f172a);
  box-shadow:
    0 8px 24px rgba(15,23,42,.06),
    0 2px  6px rgba(15,23,42,.05);
  position: relative;
  overflow: hidden;
  animation: fadeSlideIn .25s ease-out;
}
.historial-taller-page .alert i{
  font-size: 1.05rem;
  line-height: 1;
}
.historial-taller-page .alert::before{
  content:"";
  position:absolute; inset:0 0 0 auto; width:6px;
  background: linear-gradient(180deg,#ef4444,#dc2626);
}
@keyframes fadeSlideIn{
  from{ opacity:0; transform: translateY(-4px); }
  to{ opacity:1; transform: translateY(0); }
}
/* Botón flotante filtros en móvil */
.floating-filters-btn{
  position: fixed;
  right: 16px; bottom: 16px;
  z-index: 20;
  border-radius: 10px;
  width: 48px; height: 48px;
  display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

/* ===== Cards elevadas ===== */
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius: 10px !important;
  background: var(--bs-card-bg, #fff);
}

/* Paginación superior pegajosa */
.sticky-pager{
  position: sticky;
  top: 8px;
  z-index: 5;
  background: rgba(255,255,255,.65);
  backdrop-filter: blur(3px);
  border-radius: 8px;
}

/* Sidebar filtros pegajoso */
.sticky-sidebar{ position: sticky; top: 12px; }

/* ===== Resaltado por comentarios no vistos ===== */
.card-unread{
  border-color:#2563eb !important;
  box-shadow:
    0 0 0 2px rgba(37,99,235,.15),
    0 12px 24px rgba(37,99,235,.18) !important;
  position: relative;
}
.dot-unread{
  position:absolute; right:-2px; top:-4px;
  width:10px; height:10px; background:#2563eb; border-radius:50%;
  box-shadow: 0 0 0 6px rgba(37,99,235,.15);
}

/* Comentario no visto */
.comment-unread{
  border-left: 3px solid #2563eb;
  background: #f0f7ff;
}

/* ===== Tabla / imágenes ===== */
.thumb{ width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0; }

/* Dropdown en móvil: que no se salga de pantalla */
.dropup .dropdown-menu{
  inset: auto auto 100% 0 !important;
}

/* Permitir que el menú se muestre por fuera del contenedor scrollable de la tabla */
.table-responsive.dropdown-open{
  overflow: visible;
}

/* ===== Loading ===== */
.loading-box{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
.loading-box .spinner-border{ width:2rem; height:2rem; }
.loading-box .small{ color:#64748b; }

/* ===== Estado vacío (fantasma) ===== */
.ghost-wrap{ text-align:center; padding:2rem 0; color:#64748b; }
.ghost{
  width:120px; height:140px; margin:0 auto; background:#fff; border-radius:60px 60px 20px 20px;
  position:relative; box-shadow:0 10px 20px rgba(0,0,0,.08);
  animation: floaty 3s ease-in-out infinite;
}
.ghost:before{
  content:''; position:absolute; top:-12px; left:50%; transform:translateX(-50%);
  width:60px; height:12px; background:#e2e8f0; border-radius:6px; filter:blur(2px);
}
.ghost-eyes{ position:absolute; top:45px; left:50%; transform:translateX(-50%); width:60px; height:14px; display:flex; justify-content:space-between; }
.ghost-eyes:before, .ghost-eyes:after{ content:''; width:14px; height:14px; background:#111827; border-radius:50%; }
.ghost-bottom{ position:absolute; bottom:-12px; left:0; right:0; display:flex; justify-content:space-between; padding:0 6px; }
.ghost-text{ margin-top:1rem; font-weight:500; }

@keyframes floaty{
  0%,100%{ transform: translateY(0); }
  50%{ transform: translateY(-6px); }
}

/* ===== Chips / badges ===== */
.mark-pill{
  display:inline-block; background:#eef2ff; color:#3730a3; padding:.1rem .5rem; border-radius:999px;
}
.badge{
  border-radius:999px; padding:.35rem .6rem;
  font-weight:700; letter-spacing:.2px;
}

/* ===== Tabla compacta ===== */
.table.table-sm thead th{ vertical-align: middle; font-weight:700; color:#111827; }
.table.table-sm tbody td{ vertical-align: middle; }

/* ---------- FAB (botón flotante de filtros) ---------- */
.filter-fab{
  position: fixed;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
  width: 48px;
  height: 48px;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(0,0,0,.20);
  z-index: 1066;
}

/* ====== Overlay Offcanvas Custom (móvil) ====== */
.oc-wrap{
  position: fixed;
  inset: 0;
  z-index: 1065;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.oc-backdrop{
  flex: 1;
  background: rgba(15,23,42,.35);
}

.oc-panel{
  width: min(92vw, 420px);
  max-width: 520px;
  height: 100%;
  background: var(--bs-body-bg,#fff);
  box-shadow: -8px 0 24px rgba(15,23,42,.25);
  display: flex;
  flex-direction: column;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.oc-header{
  padding: .75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:.5rem;
}

.oc-body{
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

.oc-footer{
  padding: .75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Animaciones de aparición (slide desde la derecha) */
.oc-enter-active,
.oc-leave-active{
  transition: opacity .18s ease-out;
}
.oc-enter-from,
.oc-leave-to{
  opacity:0;
}

.oc-enter-active .oc-panel,
.oc-leave-active .oc-panel{
  transition: transform .22s ease-out;
}
.oc-enter-from .oc-panel,
.oc-leave-to .oc-panel{
  transform: translateX(100%);
}

/* Ajuste de padding cuando está abierto el overlay en móvil */
@media (max-width: 991.98px){
  .historial-taller-page .container{
    padding-bottom: 84px;
  }
}

/* Ocultar botones flotantes genéricos cuando el overlay está abierto (si los tienes en layout global) */
:global(body.filters-open .topbar .d-lg-none .btn){
  visibility: hidden;
  pointer-events: none;
}

:global(body.filters-open .btn-menu-flotante),
:global(body.filters-open .btn-hamburguesa){
  visibility: hidden;
  pointer-events: none;
}
</style>
