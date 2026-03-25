<template>
  <div class="historial-page">
    <div class="container py-4 py-md-5">
      <!-- HEADER -->
      <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <button class="btn btn-outline-secondary btn-sm" @click="volver" aria-label="Volver">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate flex-grow-1 text-center d-none d-sm-block">
          Historial de SOLPED Plantas
        </h1>
        <h1 class="h6 fw-semibold mb-0 text-truncate d-sm-none">Historial Plantas</h1>

        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-primary btn-sm"
            @click="toggleFiltersResponsive"
            :aria-expanded="isDesktop ? showSidebar : showFiltersMobile"
            aria-controls="filters-aside"
          >
            <i
              class="bi"
              :class="showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"
              aria-hidden="true"
            ></i>
            <span class="d-none d-sm-inline ms-1">
              {{
                (isDesktop
                  ? (showSidebar ? 'Ocultar filtros' : 'Mostrar filtros')
                  : (showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'))
              }}
            </span>
          </button>
        </div>
      </div>

      <!-- ERROR -->
      <div
        v-if="error"
        class="alert-pro alert-dismissible fade show d-flex align-items-start gap-2 mb-3"
        role="alert"
      >
        <i class="bi bi-exclamation-octagon-fill fs-5 flex-shrink-0" aria-hidden="true"></i>
        <div class="flex-grow-1">
          <strong>Ups, algo salió mal.</strong>
          <div class="small opacity-85">{{ error }}</div>
        </div>
        <button type="button" class="btn-close btn-close-white" @click="error=''" aria-label="Cerrar"></button>
      </div>

      <!-- BUSQUEDA -->
      <div class="card card-elevated mb-3" aria-labelledby="lbl-busqueda-exacta">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div id="lbl-busqueda-exacta" class="fw-semibold">
            🔎 Buscar SOLPED Planta (número, nombre, centro o ítems)
          </div>
        </div>

        <div class="card-body">
          <div class="row g-2">
            <div class="col-12 col-sm-9">
              <input
                type="text"
                class="form-control"
                v-model="numeroBusquedaExacta"
                @keyup.enter="buscarSolpeExacta"
                placeholder="Ej: 1, ESMERALDA, INSUMOS, descripción del ítem…"
                aria-label="Buscar SOLPED Planta"
              >
            </div>
            <div class="col-12 col-sm-3 d-grid gap-2">
              <button class="btn btn-danger" @click="buscarSolpeExacta" :disabled="loadingSearch">
                <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Buscar
              </button>
              <button
                class="btn btn-outline-secondary"
                v-if="enModoBusqueda || numeroBusquedaExacta || error"
                @click="limpiarBusqueda"
              >
                Limpiar búsqueda
              </button>
            </div>
          </div>

          <div
            v-if="solpeEncontrada"
            class="alert alert-light d-flex align-items-center mt-3 flex-wrap gap-2"
            role="status"
          >
            <div class="me-auto">
              <div class="fw-semibold">
                Resultado: SOLPED Planta #{{ solpeEncontrada.numero_solpe ?? '—' }}
              </div>
              <div class="small text-secondary">
                {{ solpeEncontrada.empresa || '—' }} ·
                {{ solpeEncontrada.nombre_centro_costo || '—' }} ·
                {{ prettyFecha(solpeEncontrada.createdAt) }}
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" @click="expandEncontrada">
                Expandir aquí
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CHIPS FILTROS ACTIVOS -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2" v-if="hasActiveFilters">
        <small class="text-secondary">Filtros:</small>

        <span
          v-if="filtroFechaDesde || filtroFechaHasta"
          class="badge bg-light text-dark border"
        >
          Fecha:
          <template v-if="filtroFechaDesde && filtroFechaHasta">
            {{ filtroFechaDesde }} → {{ filtroFechaHasta }}
          </template>
          <template v-else-if="filtroFechaDesde">
            desde {{ filtroFechaDesde }}
          </template>
          <template v-else>
            hasta {{ filtroFechaHasta }}
          </template>
        </span>

        <span v-for="s in filtroEstatus" :key="'es-'+s" class="badge bg-light text-dark border">
          {{ s }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeEstatus(s)" :aria-label="`Quitar estado ${s}`"></button>
        </span>

        <span v-for="u in filtroUsuario" :key="'u-'+u" class="badge bg-light text-dark border">
          {{ u }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeUsuario(u)" :aria-label="`Quitar usuario ${u}`"></button>
        </span>

        <span v-for="c in selectedCentros" :key="'c-'+c" class="badge bg-light text-dark border">
          {{ centrosMap[c] || c }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeContrato(c)" :aria-label="`Quitar centro ${c}`"></button>
        </span>

        <span v-if="onlyMine && puedeVerFiltroMisSolped" class="badge bg-light text-dark border">
          Sólo mis SOLPED
          <button class="btn-close btn-close-white ms-2 small" @click="toggleOnlyMine(false)" aria-label="Quitar filtro mis SOLPED"></button>
        </span>

        <span v-if="onlyDirectedToMe && puedeVerFiltroDirigidoAMi" class="badge bg-light text-dark border">
          Dirigidas a mí
          <button class="btn-close btn-close-white ms-2 small" @click="toggleOnlyDirected(false)" aria-label="Quitar filtro dirigidas a mí"></button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
      </div>

      <!-- SEGMENTO EMPRESA -->
      <div class="mb-3" role="tablist" aria-label="Filtro por empresa">
        <div class="btn-group flex-wrap">
          <button
            class="btn btn-sm"
            :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'"
            @click="setEmpresaSeg('todas')"
          >
            Plantas
          </button>
        </div>
      </div>

      <div class="row">
        <!-- CONTENIDO -->
        <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
          <div v-if="loading" class="loading-global" role="status" aria-live="polite">
            <div class="spinner-border me-2" role="status" aria-hidden="true"></div>
            Cargando SOLPED de plantas…
          </div>

          <template v-else>
            <nav v-if="totalPages > 1" class="mt-3 sticky-pager" aria-label="Paginación">
              <ul class="pagination justify-content-center mb-1">
                <li class="page-item" :class="{disabled: page===1}">
                  <button class="page-link" @click="prevPage" :disabled="page===1">Anterior</button>
                </li>
                <li class="page-item" :class="{disabled: page===totalPages}">
                  <button class="page-link" @click="nextPage" :disabled="page===totalPages">Siguiente</button>
                </li>
              </ul>
              <div class="text-center small text-secondary">
                Mostrando {{ pageFrom }}–{{ pageTo }} de {{ totalCount }}
              </div>
            </nav>

            <div v-for="(lista, empresa) in agrupadasPaged" :key="empresa" class="mb-3">
              <div class="card border bg-white mb-2">
                <div class="card-body py-2">
                  <i class="bi bi-building me-2" aria-hidden="true"></i>
                  <strong>{{ empresa }}</strong>
                  <span class="text-secondary small ms-2">({{ lista.length }})</span>
                </div>
              </div>

              <div
                v-for="s in lista"
                :key="s.id"
                class="card card-elevated mb-2"
              >
                <div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                  <div
                    class="pointer position-relative d-flex align-items-start gap-2 flex-grow-1"
                    @click="onExpandCard(s)"
                    role="button"
                    :aria-expanded="solpeExpandidaId===s.id"
                    :aria-controls="`solpe-detalle-${s.id}`"
                  >
                    <div class="flex-grow-1">
                      <div class="fw-semibold text-truncate">
                        📄 SOLPED Planta #{{ s.numero_solpe || '—' }}
                      </div>

                      <div class="small text-secondary">
                        <span class="d-block d-md-inline">
                          Fecha: {{ prettyFecha(s.createdAt || s.fecha_str || s.fecha) }} ·
                          Centro: {{ s.nombre_centro_costo || '—' }} ·
                          Tipo: {{ s.tipo_solped || '—' }} ·
                          Nombre: {{ s.nombre_solped || '—' }}
                        </span>

                        <br class="d-none d-md-block">

                        <span class="badge rounded-pill bg-dark me-2 mt-1 mt-md-0">
                          Creador: {{ s.usuario || '—' }}
                        </span>

                        <span
                          class="badge rounded-pill me-2 mt-1 mt-md-0"
                          :style="estadoChipStyleAprobacion(s.estadoAprobacionSolped)"
                        >
                          Aprobación: {{ s.estadoAprobacionSolped || '—' }}
                        </span>

                        <span
                          class="badge rounded-pill me-2 mt-1 mt-md-0"
                          :class="priorityBadgeClass(s.prioridad_solped || 'MEDIA')"
                        >
                          Prioridad SOLPED: {{ s.prioridad_solped || 'MEDIA' }}
                        </span>

                        <template v-if="chipsDirigidoA(s).length">
                          <span class="me-1 d-none d-sm-inline">Dirigido a:</span>
                          <span
                            v-for="(p,idx) in chipsDirigidoA(s)"
                            :key="idx"
                            class="badge rounded-pill bg-primary-subtle text-primary-emphasis me-1"
                          >
                            {{ p }}
                          </span>
                        </template>

                        <span class="badge rounded-pill bg-secondary ms-1" v-if="s.comentarios?.length">
                          💬 {{ s.comentarios.length }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap">
                    <span class="badge" :style="estadoChipStyle(s.estatus)">
                      {{ s.estatus || '—' }}
                    </span>

                    <button
                      v-if="puedeCambiarEstado"
                      class="btn btn-sm btn-outline-secondary"
                      @click.stop="abrirBarraEstadoSolped(s)"
                    >
                      Cambiar estado
                    </button>

                    <button
                      v-if="puedeEditarSolped(s) && !isAdmin"
                      class="btn btn-sm btn-outline-primary"
                      title="Editar SOLPED Planta"
                      @click.stop="abrirEditar(s)"
                      aria-label="Editar SOLPED Planta"
                    >
                      <i class="bi bi-pencil-square" aria-hidden="true"></i>
                      <span class="d-none d-md-inline ms-1">Editar</span>
                    </button>

                    <button
                      class="btn btn-success btn-sm"
                      @click.stop="descargarExcel(s)"
                      title="Descargar Excel"
                      aria-label="Descargar Excel de la SOLPED Planta"
                    >
                      Descargar Excel
                      <i class="bi bi-file-earmark-excel ms-1" aria-hidden="true"></i>
                    </button>
                    <button
                      v-if="puedeGenerarCotizacion(s)"
                      class="btn btn-outline-warning btn-sm"
                      @click.stop="irAGenerarCotizacion(s)"
                      title="Generar cotización"
                    >
                      Generar OC
                    </button>
                    <button
                      class="btn btn-outline-info btn-sm"
                      @click.stop="verDetalleSolped(s)"
                      title="Ver detalle"
                    >
                      Ver detalle
                      <i class="bi bi-eye ms-1" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div v-if="solpeExpandidaId===s.id" class="card-body" :id="`solpe-detalle-${s.id}`">

                  <!-- ITEMS -->
                  <div class="fw-semibold mb-2">🛠 Ítems asociados</div>
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th>Ítem</th>
                          <th>Descripción</th>
                          <th class="d-none d-md-table-cell">Código</th>
                          <th>Cantidad</th>
                          <th>Stock</th>
                          <th class="d-none d-lg-table-cell">Unidad</th>
                          <th class="d-none d-md-table-cell">Prioridad</th>
                          <th class="d-none d-md-table-cell">Imagen</th>
                          <th>Estado</th>
                          <th class="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="it in (s.items || [])" :key="`${s.id}-${it.item}`">
                          <tr>
                            <td>{{ it.item || '—' }}</td>
                            <td class="w-25">{{ it.descripcion || '—' }}</td>
                            <td class="d-none d-md-table-cell">{{ it.codigo_referencial || 'SIN CODIGO' }}</td>
                            <td>{{ it.cantidad ?? '—' }}</td>
                            <td>{{ it.stock ?? '—' }}</td>
                            <td class="d-none d-lg-table-cell">{{ it.unidad || 'UNIDAD' }}</td>
                            <td class="d-none d-md-table-cell">{{ it.prioridad || '—' }}</td>
                            <td class="d-none d-md-table-cell">
                              <template v-if="it.imagen_url">
                                <img
                                  :src="it.imagen_url"
                                  class="thumb pointer"
                                  @click="abrirImagen(it.imagen_url)"
                                  alt="Imagen ítem"
                                >
                                <button class="btn btn-link btn-sm p-0 ms-2" @click="abrirImagenNuevaPestana(it.imagen_url)">
                                  ver
                                </button>
                              </template>
                              <span v-else class="text-secondary small">Sin imagen</span>
                            </td>
                            <td>
                              <span
                                class="badge rounded-pill px-3"
                                :style="{background:getBadgeColor(it.estado || 'pendiente'), color:'#fff'}"
                              >
                                {{ it.estado || 'pendiente' }}
                              </span>
                            </td>
                            <td class="text-end">
                              <button
                                v-if="puedeCambiarEstado"
                                class="btn btn-sm btn-outline-secondary"
                                @click.stop="abrirBarraEstadoItem(s, it)"
                              >
                                Cambio de estado
                              </button>
                            </td>
                          </tr>
                        </template>

                        <tr v-if="(s.items || []).length===0">
                          <td colspan="10" class="text-center text-secondary py-3">
                            Sin ítems en esta SOLPED de planta.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- COMENTARIOS -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">💬 Comentarios</label>
                      <small class="text-secondary">{{ (s.comentarios?.length || 0) }} comentario(s)</small>
                    </div>

                    <div v-if="s.comentarios?.length" class="list-group mb-3">
                      <div
                        v-for="(c, idx) in s.comentarios"
                        :key="`${s.id}-com-${idx}`"
                        class="alert-pro list-group-item py-2"
                      >
                        <div class="d-flex justify-content-between flex-wrap gap-1">
                          <strong>{{ c.usuario || '—' }}</strong>
                          <small class="text-muted">{{ formatDateTime(c.fecha) }}</small>
                        </div>
                        <div class="mt-1">{{ c.texto }}</div>
                      </div>
                    </div>

                    <div class="input-group">
                      <input
                        class="form-control"
                        v-model="s.nuevoComentario"
                        placeholder="Escribe un comentario..."
                      >
                      <button
                        class="btn btn-primary"
                        :disabled="!(s.nuevoComentario && s.nuevoComentario.trim()) || commentSavingId === s.id"
                        @click="agregarComentario(s)"
                      >
                        <span v-if="commentSavingId === s.id" class="spinner-border spinner-border-sm me-2"></span>
                        Enviar
                      </button>
                    </div>
                  </div>

                  <!-- AUTORIZACIONES -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">📎 Documentos de autorización</label>
                    </div>

                    <div v-if="normalizarAutorizaciones(s).length === 0" class="text-secondary small">
                      No hay documentos de autorización.
                    </div>

                    <div v-else class="list-group">
                      <div
                        v-for="file in normalizarAutorizaciones(s)"
                        :key="file.__k"
                        class="list-group-item d-flex align-items-center flex-wrap gap-2"
                      >
                        <i class="bi" :class="iconFromExt(file.ext)" aria-hidden="true"></i>

                        <div class="me-auto">
                          <div class="fw-semibold">
                            {{ file.name }}
                            <span class="badge bg-light text-dark border ms-2">{{ (file.ext || 'file').toUpperCase() }}</span>
                          </div>
                          <div class="small text-secondary">
                            {{ file.mime || '—' }}
                            <span v-if="file.size"> · {{ (file.size/1024/1024).toFixed(2) }} MB</span>
                          </div>
                        </div>

                        <div class="d-flex gap-2">
                          <a
                            v-if="file.canView"
                            class="btn btn-sm btn-outline-primary"
                            :href="file.href"
                            target="_blank"
                            rel="noopener"
                          >
                            <i class="bi bi-box-arrow-up-right me-1"></i>
                            Ver
                          </a>
                          <a
                            v-else
                            class="btn btn-sm btn-outline-secondary"
                            :href="file.href"
                            download
                          >
                            <i class="bi bi-arrow-bar-down me-1"></i>
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- COTIZACIONES VINCULADAS -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">🧾 Cotizaciones vinculadas</label>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="fetchOCs(s.id)"
                        :disabled="isLoadingOC(s.id)"
                      >
                        <span v-if="isLoadingOC(s.id)" class="spinner-border spinner-border-sm me-1"></span>
                        {{ ocListFor(s.id).length ? 'Actualizar' : 'Cargar' }}
                      </button>
                    </div>

                    <div v-if="isLoadingOC(s.id)" class="text-secondary small">
                      Buscando cotizaciones…
                    </div>

                    <div v-else-if="ocListFor(s.id).length === 0" class="text-secondary small">
                      No hay cotizaciones vinculadas.
                    </div>

                    <div v-else class="list-group">
                      <div
                        v-for="oc in ocListFor(s.id)"
                        :key="oc.__docId"
                        class="list-group-item d-flex align-items-center flex-wrap gap-2"
                      >
                        <div class="me-auto">
                          <div class="d-flex align-items-center gap-2 flex-wrap">
                            <strong>Cotización N° {{ oc.id ?? oc.numero ?? '—' }}</strong>
                            <span class="badge" :class="estadoChipOC(oc.estatus)">
                              {{ oc.estatus || '—' }}
                            </span>
                          </div>

                          <div class="small text-secondary mt-1">
                            <strong>Total:</strong> {{ fmtMonedaOC(oc.precioTotalConIVA, oc.moneda) }} ·
                            <strong>Moneda:</strong> {{ oc.moneda || '—' }} ·
                            <strong>Responsable:</strong> {{ oc.responsable || '—' }}
                          </div>

                          <div class="small text-secondary mt-1">
                            <strong>Centro:</strong> {{ oc.nombre_centro_costo || '—' }} ·
                            <strong>Nombre:</strong> {{ oc.nombre_solped || '—' }} ·
                            <strong>Fecha:</strong> {{ prettyFecha(oc.fechaSubida || oc.createdAt) }}
                          </div>
                        </div>

                        <div class="d-flex gap-2 flex-wrap">
                          <button
                            class="btn btn-sm btn-outline-primary"
                            @click="verDetalleCotizacion(oc, s)"
                          >
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="displayList.length===0" class="ghost-wrap" role="status" aria-live="polite">
              <div class="ghost" aria-hidden="true">
                <div class="ghost-eyes"></div>
                <div class="ghost-bottom">
                  <div></div><div></div><div></div><div></div>
                </div>
              </div>
              <p class="ghost-text">No hay SOLPED de plantas con los filtros aplicados.</p>
            </div>
          </template>
        </div>

        <!-- SIDEBAR FILTROS -->
        <aside
          v-if="showSidebar"
          id="filters-aside"
          class="col-12 col-lg-3 d-none d-lg-block"
          aria-label="Filtros"
        >
          <div class="card card-elevated sticky-sidebar">
            <div class="card-header d-flex align-items-center justify-content-between">
              <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success" @click="applyFilters">Aplicar</button>
                <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              </div>
            </div>

            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Fecha (rango)</label>
                <div class="row g-2">
                  <div class="col-6">
                    <input type="date" class="form-control" v-model="filtroFechaDesde" />
                  </div>
                  <div class="col-6">
                    <input type="date" class="form-control" v-model="filtroFechaHasta" />
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Estado / Estatus</label>
                <select class="form-select" multiple v-model="filtroEstatus">
                  <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
                </select>
                <small class="text-secondary">Puedes seleccionar varios.</small>
              </div>

              <div class="mb-3">
                <label class="form-label">Centro de costo</label>
                <input class="form-control mb-2" v-model="centroPickerSearch" placeholder="Buscar código o nombre…">
                <div class="border rounded p-2" style="max-height: 220px; overflow:auto;">
                  <div class="form-check" v-for="code in centrosFiltrados" :key="code">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="'cc_'+code"
                      :checked="selectedCentrosSet.has(code)"
                      @change="toggleCentro(code)"
                    >
                    <label class="form-check-label" :for="'cc_'+code">
                      <strong>{{ code }}</strong> — {{ centrosMap[code] }}
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-1 d-flex align-items-center justify-content-between">
                <label class="form-label mb-0">Usuario</label>
                <small v-if="tempUsuarioSelSet.size" class="text-secondary">{{ tempUsuarioSelSet.size }} seleccionados</small>
              </div>
              <div class="input-group mb-2">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control" placeholder="Buscar usuario" v-model="busquedaUsuario">
              </div>
              <div class="border rounded p-2 mb-3" style="max-height: 220px; overflow:auto;">
                <div class="form-check" v-for="u in usuariosOrdenadosFiltrados" :key="u.id">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'u_'+u.id"
                    :checked="tempUsuarioSelSet.has(u.fullName)"
                    @change="toggleTempUsuario(u.fullName)"
                  >
                  <label class="form-check-label" :for="'u_'+u.id">{{ u.fullName }}</label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check" v-if="puedeVerFiltroMisSolped">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="chkOnlyMine"
                    :checked="onlyMine"
                    @change="toggleOnlyMine($event.target.checked)"
                  >
                  <label class="form-check-label" for="chkOnlyMine">Ver sólo mis SOLPED</label>
                </div>

                <div class="form-check mt-2" v-if="puedeVerFiltroDirigidoAMi">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="chkOnlyDirected"
                    :checked="onlyDirectedToMe"
                    @change="toggleOnlyDirected($event.target.checked)"
                  >
                  <label class="form-check-label" for="chkOnlyDirected">Ver sólo dirigidas a mí</label>
                </div>
              </div>

              <div class="mb-0">
                <label class="form-label">Tamaño de página</label>
                <select class="form-select" v-model.number="pageSize">
                  <option v-for="n in [10,20,30,40,50,100,200]" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- FILTROS MOBILE -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none" @keydown.esc="closeFiltersMobile">
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>
        <div class="oc-panel" role="dialog" aria-modal="true" aria-label="Filtros de historial plantas">
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">Filtros</h2>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              <button class="btn btn-sm btn-success" @click="applyFilters(); closeFiltersMobile()">Aplicar</button>
              <button class="btn btn-sm btn-outline-dark" @click="closeFiltersMobile">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <div class="mb-3">
              <label class="form-label">Fecha</label>
              <div class="row g-2">
                <div class="col-6">
                  <input type="date" class="form-control" v-model="filtroFechaDesde" />
                </div>
                <div class="col-6">
                  <input type="date" class="form-control" v-model="filtroFechaHasta" />
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Estado / Estatus</label>
              <select class="form-select" multiple v-model="filtroEstatus">
                <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Centro de costo</label>
              <input class="form-control mb-2" v-model="centroPickerSearch" placeholder="Buscar código o nombre…">
              <div class="border rounded p-2" style="max-height: 220px; overflow:auto;">
                <div class="form-check" v-for="code in centrosFiltrados" :key="code">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'m_cc_'+code"
                    :checked="selectedCentrosSet.has(code)"
                    @change="toggleCentro(code)"
                  >
                  <label class="form-check-label" :for="'m_cc_'+code">
                    <strong>{{ code }}</strong> — {{ centrosMap[code] }}
                  </label>
                </div>
              </div>
            </div>

            <div class="mb-1 d-flex align-items-center justify-content-between">
              <label class="form-label mb-0">Usuario</label>
              <small v-if="tempUsuarioSelSet.size" class="text-secondary">{{ tempUsuarioSelSet.size }} seleccionados</small>
            </div>
            <div class="input-group mb-2">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input class="form-control" placeholder="Buscar usuario" v-model="busquedaUsuario">
            </div>
            <div class="border rounded p-2 mb-3" style="max-height: 220px; overflow:auto;">
              <div class="form-check" v-for="u in usuariosOrdenadosFiltrados" :key="u.id">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'m_u_'+u.id"
                  :checked="tempUsuarioSelSet.has(u.fullName)"
                  @change="toggleTempUsuario(u.fullName)"
                >
                <label class="form-check-label" :for="'m_u_'+u.id">{{ u.fullName }}</label>
              </div>
            </div>

            <div class="mb-3">
              <div class="form-check" v-if="puedeVerFiltroMisSolped">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="m_chkOnlyMine"
                  :checked="onlyMine"
                  @change="toggleOnlyMine($event.target.checked)"
                >
                <label class="form-check-label" for="m_chkOnlyMine">Ver sólo mis SOLPED</label>
              </div>

              <div class="form-check mt-2" v-if="puedeVerFiltroDirigidoAMi">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="m_chkOnlyDirected"
                  :checked="onlyDirectedToMe"
                  @change="toggleOnlyDirected($event.target.checked)"
                >
                <label class="form-check-label" for="m_chkOnlyDirected">Ver sólo dirigidas a mí</label>
              </div>
            </div>

            <div class="mb-0">
              <label class="form-label">Tamaño de página</label>
              <select class="form-select" v-model.number="pageSize">
                <option v-for="n in [10,20,30,40,50,100,200]" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <button
      class="btn btn-primary floating-filters-btn d-lg-none"
      @click="toggleFiltersResponsive"
      :title="showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'"
      aria-label="Abrir filtros"
    >
      <i class="bi bi-funnel" aria-hidden="true"></i>
    </button>

    <!-- TOASTS -->
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" aria-hidden="true"></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)" aria-label="Cerrar"></button>
      </div>
    </div>

    <!-- MODAL IMAGEN -->
    <div
      v-if="showImgModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,.6);"
      @keydown.esc="showImgModal=false"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">Vista previa de imagen</h5>
            <button class="btn-close" @click="showImgModal=false" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body text-center">
            <img :src="previewImgSrc" class="img-fluid" alt="Imagen ítem">
          </div>
          <div class="modal-footer">
            <a :href="previewImgSrc" target="_blank" rel="noopener" class="btn btn-outline-primary">Abrir en pestaña nueva</a>
            <button class="btn btn-secondary" @click="showImgModal=false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR -->
    <div
      v-if="showEditModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,.55);"
      @keydown.esc="cerrarEditar"
    >
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Editar SOLPED Planta #{{ editForm.numero_solpe }}
              <span class="badge bg-secondary ms-2">{{ editForm.empresa || '—' }}</span>
            </h5>
            <button class="btn-close" @click="cerrarEditar" aria-label="Cerrar edición"></button>
          </div>

          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label">Empresa</label>
                <input class="form-control" v-model="editForm.empresa" disabled />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Tipo SOLPED</label>
                <select class="form-select" v-model="editForm.tipo_solped">
                  <option v-for="t in tiposSolped" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">N° SOLPED</label>
                <input class="form-control" :value="editForm.numero_solpe" disabled />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Centro de costo (código)</label>
                <select class="form-select" v-model="editForm.numero_contrato">
                  <option value="" disabled>Selecciona centro de costo</option>
                  <option v-for="code in centrosListaOrdenada" :key="code" :value="code">
                    {{ code }} — {{ centrosMap[code] || code }}
                  </option>
                </select>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Nombre Centro de Costo</label>
                <input class="form-control" v-model="editForm.nombre_centro_costo" readonly />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label">Prioridad SOLPED</label>
                <select class="form-select" v-model="editForm.prioridad_solped">
                  <option value="ALTA">ALTA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="BAJA">BAJA</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Nombre SOLPED</label>
                <input class="form-control" v-model="editForm.nombre_solped" maxlength="140" />
              </div>

              <div class="col-12">
                <label class="form-label d-flex align-items-center justify-content-between">
                  <span>Cotizadores / Dirigido a</span>
                  <small class="text-secondary" v-if="loadingCotizadoresEdit">
                    <span class="spinner-border spinner-border-sm me-1"></span>
                    Cargando desde configuración…
                  </small>
                </label>

                <select
                  class="form-select"
                  multiple
                  size="6"
                  v-model="dirigidoASelected"
                  :disabled="loadingCotizadoresEdit || !cotizadoresEdit.length"
                >
                  <option v-for="u in cotizadoresEdit" :key="u.uid" :value="u.fullName">
                    {{ u.fullName }}
                  </option>
                </select>

                <div class="form-text">
                  Puedes elegir más de uno.
                </div>

                <div v-if="editForm.empresa && !loadingCotizadoresEdit && !cotizadoresEdit.length" class="alert alert-warning py-2 small mt-2 mb-0">
                  No hay cotizadores configurados para <strong>{{ editForm.empresa }}</strong>.
                </div>

                <div v-if="dirigidoASelected.length" class="mt-2">
                  <span
                    v-for="u in dirigidoASelected"
                    :key="u"
                    class="badge rounded-pill text-bg-light border me-1 mb-1"
                  >
                    <i class="bi bi-person-circle me-1"></i>{{ u }}
                  </span>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label d-flex align-items-center justify-content-between">
                  <span>Documentos adjuntos</span>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirSelectorAdjuntosEdit">
                    <i class="bi bi-paperclip me-1"></i> Agregar archivos
                  </button>
                </label>

                <input
                  ref="adjuntosInputEdit"
                  type="file"
                  class="d-none"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  @change="onPickAdjuntosEdit"
                >

                <div
                  class="border rounded p-3 mb-3"
                  @dragover.prevent="dragAdjuntos = true"
                  @dragleave.prevent="dragAdjuntos = false"
                  @drop.prevent="onDropAdjuntosEdit"
                  :class="dragAdjuntos ? 'bg-light border-primary' : ''"
                >
                  <div class="text-center">
                    <i class="bi bi-cloud-arrow-up fs-3 d-block mb-2"></i>
                    <div class="fw-semibold">Arrastra archivos aquí</div>
                    <div class="small text-secondary">
                      PDF, imágenes, Word y Excel
                    </div>
                  </div>
                </div>

                <div class="border rounded p-3">
                  <div v-if="!editAdjuntosExistentes.length && !editAdjuntosNuevos.length" class="text-secondary small">
                    No hay archivos adjuntos cargados.
                  </div>

                  <div v-if="editAdjuntosExistentes.length" class="mb-3">
                    <div class="small fw-semibold text-secondary mb-2">Adjuntos actuales</div>
                    <div class="d-flex flex-column gap-2">
                      <div
                        v-for="(a, idx) in editAdjuntosExistentes"
                        :key="a.__k"
                        class="border rounded p-2 d-flex justify-content-between align-items-center gap-2"
                      >
                        <div class="d-flex align-items-center gap-2 min-w-0">
                          <i class="bi" :class="iconFromExt(extFromName(a.nombre))"></i>
                          <div class="min-w-0">
                            <div class="fw-semibold text-truncate">{{ a.nombre }}</div>
                            <div class="small text-secondary">
                              {{ formatearTamano(a.tamano) }} · {{ a.tipo || 'archivo' }}
                            </div>
                          </div>
                        </div>

                        <div class="d-flex gap-2">
                          <a v-if="a.url" :href="a.url" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">
                            Ver
                          </a>
                          <button class="btn btn-sm btn-outline-danger" @click="quitarAdjuntoExistente(idx)">
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="editAdjuntosNuevos.length">
                    <div class="small fw-semibold text-secondary mb-2">Archivos nuevos por subir</div>
                    <div class="d-flex flex-column gap-2">
                      <div
                        v-for="(a, idx) in editAdjuntosNuevos"
                        :key="`${a.name}-${idx}`"
                        class="border rounded p-2 d-flex justify-content-between align-items-center gap-2"
                      >
                        <div class="d-flex align-items-center gap-2 min-w-0">
                          <i class="bi" :class="iconFromExt(extFromName(a.name))"></i>
                          <div class="min-w-0">
                            <div class="fw-semibold text-truncate">{{ a.name }}</div>
                            <div class="small text-secondary">
                              {{ formatearTamano(a.size) }}
                            </div>
                          </div>
                        </div>

                        <button class="btn btn-sm btn-outline-danger" @click="quitarAdjuntoNuevo(idx)">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="savingEdit && editUploadProgress > 0" class="mt-3">
                    <div class="d-flex justify-content-between small mb-1">
                      <span>Subiendo archivos…</span>
                      <strong>{{ editUploadProgress }}%</strong>
                    </div>
                    <div class="progress" style="height: 8px;">
                      <div
                        class="progress-bar bg-primary"
                        role="progressbar"
                        :style="{ width: `${editUploadProgress}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between">
                  <label class="form-label mb-0">Ítems</label>
                  <button class="btn btn-sm btn-outline-primary" @click="agregarItem">Agregar ítem</button>
                </div>

                <div class="table-responsive mt-2">
                  <table class="table table-sm align-middle">
                    <thead class="table-light">
                      <tr>
                        <th style="width:70px;">Ítem</th>
                        <th>Descripción</th>
                        <th style="width:140px;" class="d-none d-md-table-cell">Código ref.</th>
                        <th style="width:110px;">Cantidad</th>
                        <th style="width:120px;" class="d-none d-lg-table-cell">N° Interno / Patente</th>
                        <th style="width:120px;" class="d-none d-lg-table-cell">Stock</th>
                        <th style="width:120px;" class="d-none d-md-table-cell">Prioridad</th>
                        <th style="width:230px;" class="d-none d-md-table-cell">Imagen</th>
                        <th style="width:60px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, idx) in editItems" :key="it.__k">
                        <td>{{ it.item || (idx+1) }}</td>

                        <td>
                          <textarea class="form-control form-control-sm" v-model="it.descripcion" rows="2"></textarea>
                        </td>

                        <td class="d-none d-md-table-cell">
                          <input
                            class="form-control form-control-sm"
                            v-model="it.codigo_referencial"
                            placeholder="SIN CODIGO"
                          >
                        </td>

                        <td>
                          <input class="form-control form-control-sm" type="number" min="0" v-model.number="it.cantidad">
                        </td>

                        <td class="d-none d-lg-table-cell">
                          <input
                            class="form-control form-control-sm"
                            v-model="it.numero_interno"
                            placeholder="SIN PATENTE"
                          >
                        </td>

                        <td class="d-none d-lg-table-cell">
                          <input class="form-control form-control-sm" type="number" min="0" v-model.number="it.stock">
                        </td>

                        <td class="d-none d-md-table-cell">
                          <select class="form-select form-select-sm" v-model="it.prioridad">
                            <option value="BAJA">BAJA</option>
                            <option value="MEDIA">MEDIA</option>
                            <option value="ALTA">ALTA</option>
                          </select>
                        </td>

                        <td class="d-none d-md-table-cell">
                          <div class="d-flex flex-column gap-2">
                            <div
                              class="border rounded p-2 text-center small"
                              @dragover.prevent="it._dragOver = true"
                              @dragleave.prevent="it._dragOver = false"
                              @drop.prevent="onDropImg($event, it)"
                              :class="it._dragOver ? 'bg-light border-primary' : ''"
                            >
                              Arrastra una imagen aquí
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              class="form-control form-control-sm"
                              :disabled="it._imgUploading"
                              @change="onPickImg($event, it)"
                            >

                            <small v-if="it._imgUploading" class="text-secondary">Subiendo imagen…</small>

                            <div v-if="it.imagen_url" class="d-flex align-items-center gap-2 flex-wrap">
                              <img :src="it.imagen_url" class="thumb" alt="preview">
                              <a :href="it.imagen_url" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Ver</a>
                              <button class="btn btn-sm btn-outline-danger" @click="borrarImg(it)">Quitar</button>
                            </div>
                          </div>
                        </td>

                        <td class="text-end">
                          <button class="btn btn-sm btn-outline-danger" @click="eliminarItem(idx)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>

                      <tr v-if="editItems.length===0">
                        <td colspan="9" class="text-center text-muted py-4">Sin ítems.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
    <transition name="bottom-sheet">
      <div
        v-if="floatingEstadoSolped && puedeCambiarEstado"
        class="floating-action-bar"
      >
        <div class="floating-card shadow-lg">
          <div class="floating-handle"></div>

          <div class="floating-header">
            <div>
              <div class="fw-bold">Cambio de estado SOLPED</div>
              <div class="small text-muted">
                SOLPED #{{ floatingEstadoSolped.numero_solpe || '—' }} ·
                {{ floatingEstadoSolped.nombre_solped || 'Sin nombre' }}
              </div>
            </div>

            <button
              class="btn btn-sm btn-light rounded-circle"
              @click="cerrarBarraEstado"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="floating-actions">
            <button
              class="btn btn-outline-success btn-pill"
              :disabled="statusUpdatingSolpedId === floatingEstadoSolped.id"
              @click="cambiarEstadoSolped(floatingEstadoSolped, 'Cotizado Completado')"
            >
              <i class="bi bi-check-circle me-2"></i>
              Cotizado Completado
            </button>

            <button
              class="btn btn-outline-danger btn-pill"
              :disabled="statusUpdatingSolpedId === floatingEstadoSolped.id"
              @click="cambiarEstadoSolped(floatingEstadoSolped, 'Rechazado')"
            >
              <i class="bi bi-x-circle me-2"></i>
              Rechazado
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="bottom-sheet">
      <div
        v-if="floatingEstadoItem && puedeCambiarEstado"
        class="floating-action-bar"
      >
        <div class="floating-card shadow-lg">
          <div class="floating-handle"></div>

          <div class="floating-header">
            <div>
              <div class="fw-bold">Cambio de estado ítem</div>
              <div class="small text-muted">
                SOLPED #{{ floatingEstadoItem.solpe?.numero_solpe || '—' }} ·
                Ítem {{ floatingEstadoItem.item?.item || '—' }}
                <span v-if="floatingEstadoItem.item?.descripcion">
                  · {{ floatingEstadoItem.item.descripcion }}
                </span>
              </div>
            </div>

            <button
              class="btn btn-sm btn-light rounded-circle"
              @click="cerrarBarraEstado"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="floating-actions">
            <button
              class="btn btn-outline-success btn-pill"
              :disabled="statusUpdatingItemKey === `${floatingEstadoItem.solpe.id}_${floatingEstadoItem.item.item}`"
              @click="cambiarEstadoItem(floatingEstadoItem.solpe, floatingEstadoItem.item, 'completado')"
            >
              <i class="bi bi-check-circle me-2"></i>
              Completado
            </button>

            <button
              class="btn btn-outline-info btn-pill"
              :disabled="statusUpdatingItemKey === `${floatingEstadoItem.solpe.id}_${floatingEstadoItem.item.item}`"
              @click="cambiarEstadoItem(floatingEstadoItem.solpe, floatingEstadoItem.item, 'parcial')"
            >
              <i class="bi bi-hourglass-split me-2"></i>
              Parcial
            </button>

            <button
              class="btn btn-outline-danger btn-pill"
              :disabled="statusUpdatingItemKey === `${floatingEstadoItem.solpe.id}_${floatingEstadoItem.item.item}`"
              @click="cambiarEstadoItem(floatingEstadoItem.solpe, floatingEstadoItem.item, 'rechazado')"
            >
              <i class="bi bi-x-circle me-2"></i>
              Rechazado
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db, storage } from '../stores/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  getCountFromServer,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  uploadBytes
} from 'firebase/storage';
import { useAuthStore } from '../stores/authService';
import * as XLSX from 'xlsx-js-style';

const router = useRouter();
const auth = useAuthStore();
const volver = () => router.back();
function verDetalleSolped(solpe) {
  if (!solpe?.id) return;

  router.push({
    name: 'DetalleSolpedPlanta',
    params: { id: solpe.id },
    query: {
      from: 'historial-plantas'
    }
  });
}
function irAGenerarCotizacion(solpe) {
  if (!solpe?.id) return;
  if (!puedeGenerarCotizacion(solpe)) {
    addToast('danger', 'No tienes permiso para generar esta cotización.');
    return;
  }

  router.push({
    name: 'GeneradorCotizacionPlantas',
    query: {
      fromSolpedId: String(solpe.id),
      from: 'historial-plantas'
    }
  });
}
function verDetalleCotizacion(oc, solpe = null) {
  if (!oc?.__docId) return;

  router.push({
    name: 'DetalleCotizacionPlanta',
    params: { id: oc.__docId },
    query: {
      from: 'historial-plantas',
      solped: String(solpe?.id || '')
    }
  });
}
const COLLECTION_NAME = 'solpeds_plantas';

const LS = {
  SHOW_SIDEBAR: 'historial_plantas_show_sidebar',
  FILTRO_FECHA_DESDE: 'historial_plantas_filtro_fecha_desde',
  FILTRO_FECHA_HASTA: 'historial_plantas_filtro_fecha_hasta',
  FILTRO_ESTATUS: 'historial_plantas_filtro_estatus',
  FILTRO_USUARIOS: 'historial_plantas_filtro_usuarios',
  FILTRO_APROBADORES: 'historial_plantas_filtro_aprobadores',
  SELECTED_CENTROS: 'historial_plantas_cc_sel',
  EMPRESA_SEG: 'historial_plantas_empresa_seg',
  PAGE_SIZE: 'historial_plantas_page_size',
  ONLY_DIRECTED: 'historial_plantas_only_directed',
  ONLY_MINE: 'historial_plantas_only_mine',
};

const safeRead = (k, def = null) => {
  try {
    const v = localStorage.getItem(k);
    if (v === null || v === undefined) return def;
    if (v === 'true') return true;
    if (v === 'false') return false;
    try { return JSON.parse(v); } catch { return v; }
  } catch {
    return def;
  }
};

const safeWrite = (k, v) => {
  try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { console.log(e); }
};

const safeRemove = (k) => {
  try { localStorage.removeItem(k); } catch (e) { console.log(e); }
};

const rawRole = computed(() =>
  String(auth?.profile?.role || auth?.profile?.rol || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
);

const isAdmin = computed(() => rawRole.value.includes('admin'));
const isEditor = computed(() => rawRole.value.includes('editor'));
const isGenerador = computed(() => rawRole.value.includes('generador'));
const puedeVerFiltroMisSolped = computed(() => isGenerador.value);
const puedeCambiarEstado = computed(() => isAdmin.value || isEditor.value);
const puedeVerFiltroDirigidoAMi = computed(() => isEditor.value);

const error = ref('');
const loading = ref(true);
const loadingSearch = ref(false);
const isDesktop = ref(false);
const computeIsDesktop = () => { isDesktop.value = window.innerWidth >= 992; };

const showSidebar = ref(true);
const showFiltersMobile = ref(false);
const dragAdjuntos = ref(false);
const puedeGenerarCotizacion = (s) => {
  const aprob = estadoPlano(s?.estadoAprobacionSolped);
  const estatus = estadoPlano(s?.estatus);

  const items = Array.isArray(s?.items) ? s.items : [];
  const tienePendientes = items.some(it => {
    const total = Number(it?.cantidad || 0);
    const cotizada = Number(it?.cantidad_cotizada || 0);
    return total - cotizada > 0;
  });

  const miNombre = String(myFullName.value || auth?.user?.displayName || '')
    .trim()
    .toLowerCase();

  const dirigidos = Array.isArray(s?.dirigidoA)
    ? s.dirigidoA
        .map(x => {
          if (typeof x === 'string') return x;
          if (x && typeof x === 'object') return x.fullName || x.nombre || x.email || x.uid || '';
          return '';
        })
        .map(x => String(x || '').trim().toLowerCase())
        .filter(Boolean)
    : [];

  const estaDirigidoAMi = !!miNombre && dirigidos.includes(miNombre);

  return (
    estaDirigidoAMi &&
    aprob === 'solped aprobada' &&
    (estatus === 'pendiente' || estatus === 'cotizado parcial') &&
    tienePendientes
  );
};
const estadoPlano = (v) =>
  String(v || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const puedeReeditarPorEstado = (s) => {
  const aprob = estadoPlano(s?.estadoAprobacionSolped);
  const estatus = estadoPlano(s?.estatus);

  return (
    aprob === 'pendiente' ||
    aprob === 'rechazada' ||
    aprob === 'solped rechazada' ||
    estatus === 'pendiente' ||
    estatus === 'rechazado' ||
    estatus === 'solped rechazada'
  );
};
const openFiltersMobile = () => {
  showFiltersMobile.value = true;
  document.documentElement.style.overflow = 'hidden';
};
const closeFiltersMobile = () => {
  showFiltersMobile.value = false;
  document.documentElement.style.overflow = '';
};
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
  safeWrite(LS.SHOW_SIDEBAR, showSidebar.value);
};
const toggleFiltersResponsive = () => {
  computeIsDesktop();
  isDesktop.value ? toggleSidebar() : (showFiltersMobile.value ? closeFiltersMobile() : openFiltersMobile());
};
const handleResize = () => {
  const wasMobileOpen = showFiltersMobile.value;
  computeIsDesktop();
  if (isDesktop.value && wasMobileOpen) closeFiltersMobile();
};



const myUid = computed(() => (auth?.user?.uid || '').toString());
const myFullName = ref('');

const numeroBusquedaExacta = ref('');
const solpeEncontrada = ref(null);
const enModoBusqueda = ref(false);
const resultadosBusqueda = ref([]);

const filtroFechaDesde = ref('');
const filtroFechaHasta = ref('');
const filtroEstatus = ref([]);
const filtroUsuario = ref([]);
const filtroAprobador = ref([]);

const onlyDirectedToMe = ref(false);
const onlyMine = ref(false);
const empresaSegmento = ref('todas');

const toggleOnlyDirected = (val) => {
  onlyDirectedToMe.value = !!val;
  safeWrite(LS.ONLY_DIRECTED, onlyDirectedToMe.value);
  applyFilters();
};
const toggleOnlyMine = (val) => {
  onlyMine.value = !!val;
  safeWrite(LS.ONLY_MINE, onlyMine.value);
  applyFilters();
};

const hasActiveFilters = computed(() =>
  !!filtroFechaDesde.value ||
  !!filtroFechaHasta.value ||
  filtroEstatus.value.length ||
  filtroUsuario.value.length ||
  filtroAprobador.value.length ||
  onlyDirectedToMe.value ||
  onlyMine.value ||
  empresaSegmento.value !== 'todas' ||
  selectedCentros.value.length > 0
);

const centrosLocalFallback = {
  "BETON_CALAMA": "PLANTA BETON CALAMA",
  "FLUMECAR_CALAMA": "PLANTA FLUMECAR CALAMA",
  "URBANA_CALAMA": "PLANTA URBANA CALAMA",
  "KM13_ANDINA": "PLANTA KM13 ANDINA",
  "NV17_ANDINA": "PLANTA NV17 ANDINA",
  "SAN_BERNARDO": "PLANTA SAN BERNARDO",
  "ARIDO_NOS": "PLANTA DE ÁRIDO NOS",
  "OLIVAR": "PLANTA OLIVAR",
  "COLON": "PLANTA COLÓN",
  "AGUA_DULCE": "PLANTA AGUA DULCE",
  "ESMERALDA": "PLANTA ESMERALDA",
  "ESTOCADA_8": "PLANTA ESTOCADA 8",
  "OP14": "PLANTA OP14",
  "ANDES_NORTE": "PLANTA ANDES NORTE",
  "CHANCHADO": "PLANTA CHANCHADO",
};

const centrosMap = ref({});

async function loadCentrosCosto() {
  try {
    const snap = await getDocs(query(collection(db, 'centros_costo')));
    if (!snap.empty) {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data() || {};
        if (data.codigo && data.nombre) {
          map[String(data.codigo)] = String(data.nombre);
        }
      });
      centrosMap.value = Object.keys(map).length ? map : centrosLocalFallback;
    } else {
      centrosMap.value = centrosLocalFallback;
    }
  } catch {
    centrosMap.value = centrosLocalFallback;
  }
}

const selectedCentros = ref([]);
const selectedCentrosSet = computed(() => new Set(selectedCentros.value));
const centroPickerSearch = ref('');

const centrosListaOrdenada = computed(() =>
  Object.keys(centrosMap.value).sort((a, b) =>
    (centrosMap.value[a] || '').localeCompare(centrosMap.value[b] || '', 'es', { sensitivity: 'base' })
  )
);

const centrosFiltrados = computed(() => {
  const q = centroPickerSearch.value.trim().toLowerCase();
  if (!q) return centrosListaOrdenada.value;
  return centrosListaOrdenada.value.filter(code =>
    code.toLowerCase().includes(q) || String(centrosMap.value[code] || '').toLowerCase().includes(q)
  );
});

const toggleCentro = (code) => {
  const set = new Set(selectedCentros.value);
  set.has(code) ? set.delete(code) : set.add(code);
  selectedCentros.value = Array.from(set);
  applyFilters();
};

const removeContrato = (code) => {
  selectedCentros.value = selectedCentros.value.filter(x => x !== code);
  applyFilters();
};

const listaUsuarios = ref([]);
const busquedaUsuario = ref('');
const tempUsuarioSelSet = ref(new Set());
const USUARIOS_FILTRO_PERMITIDOS = [
  'Sebastián Espinoza',
  'Lucas Salinas',
  'Rodrigo Baeza',
  'Cristopher Saez',
  'Jorge Donoso'
];
const normalizeText = (v = '') =>
  v.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const usuariosOrdenadosFiltrados = computed(() => {
  const q = normalizeText(busquedaUsuario.value);
  return (listaUsuarios.value || [])
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' }))
    .filter(u => !q || normalizeText(u.fullName).includes(q));
});

const toggleTempUsuario = (fullName) => {
  const s = tempUsuarioSelSet.value;
  s.has(fullName) ? s.delete(fullName) : s.add(fullName);
};

const listaAprobadores = ref([]);
const busquedaAprobador = ref('');
const tempAprobadorSelSet = ref(new Set());

const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const pageDocs = ref([]);
const cursors = ref({});
let unsubscribe = null;

const pageFrom = computed(() => totalCount.value ? (page.value - 1) * pageSize.value + 1 : 0);
const pageTo = computed(() => Math.min(totalCount.value, page.value * pageSize.value));
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

const displayList = computed(() => {
  const arr = Array.isArray(pageDocs.value) ? pageDocs.value : [];
  return arr;
});

const agruparPorEmpresa = (arr = []) => {
  const out = {};
  arr.forEach(s => {
    const k = s?.empresa || 'Sin Empresa';
    if (!Array.isArray(out[k])) out[k] = [];
    out[k].push(s);
  });
  return out;
};

const agrupadasPaged = computed(() => agruparPorEmpresa(displayList.value));

const listaEstatus = [
  'Pendiente',
  'Solped Aprobada',
  'Solped Rechazada',
  'Cotizado Parcial',
  'Cotizado Completado',
  'Rechazado'
];

const prettyFecha = (f) => {
  try {
    if (f?.toDate) return f.toDate().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    if (typeof f === 'string') {
      const d = new Date(f);
      return isNaN(d) ? f : d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    }
    if (f instanceof Date) return f.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) { console.log(e); }
  return '—';
};

const formatDateTime = (f) => {
  try {
    if (f?.toDate) return f.toDate().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    if (typeof f === 'string') {
      const d = new Date(f);
      return isNaN(d) ? f : d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    }
    if (f instanceof Date) return f.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
  return '—';
};

const getColorByStatus = (estatus) => {
  const e = (estatus || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  switch (e) {
    case 'pendiente': return '#fd7e14';
    case 'solped aprobada':
    case 'aprobado': return '#198754';
    case 'solped rechazada':
    case 'rechazado': return '#dc3545';
    case 'cotizado parcial':
    case 'parcial': return '#0dcaf0';
    case 'cotizado completado':
    case 'completado': return '#20c997';
    case 'en revision':
    case 'en revisión': return '#0d6efd';
    default: return '#6c757d';
  }
};

const estadoChipStyle = (estatus) => ({
  background: getColorByStatus(estatus),
  color: '#fff',
  padding: '4px 10px',
  fontWeight: 'bold'
});

const estadoChipStyleAprobacion = (estatus) => ({
  background: getColorByStatus(estatus),
  color: '#fff',
  padding: '4px 10px',
  fontWeight: 'bold'
});

const getBadgeColor = (estatus) => getColorByStatus(estatus);

const priorityBadgeClass = (prioridad = 'MEDIA') => {
  const p = String(prioridad || 'MEDIA').toUpperCase();
  if (p === 'ALTA') return 'bg-danger-subtle text-danger-emphasis';
  if (p === 'BAJA') return 'bg-success-subtle text-success-emphasis';
  return 'bg-warning-subtle text-warning-emphasis';
};

const chipsDirigidoA = (s) => {
  const out = [];
  if (Array.isArray(s.dirigidoA)) {
    s.dirigidoA.forEach(x => {
      if (typeof x === 'string') out.push(x);
      else if (x && typeof x === 'object') out.push(x.fullName || x.nombre || x.email || x.uid || '');
    });
  }
  return Array.from(new Set(out.filter(Boolean)));
};

const extFromName = (name = '') => {
  const m = String(name).match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
};

const isViewableInBrowser = (ext = '') => {
  const e = String(ext).toLowerCase();
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(e);
};

const iconFromExt = (ext) => {
  const e = (ext || '').toLowerCase();
  if (e === 'pdf') return 'bi-file-earmark-pdf-fill text-danger';
  if (e === 'xls' || e === 'xlsx' || e === 'csv') return 'bi-file-earmark-excel-fill text-success';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(e)) return 'bi-file-earmark-image-fill';
  if (['zip', 'rar', '7z'].includes(e)) return 'bi-file-earmark-zip-fill';
  return 'bi-paperclip';
};

const normalizarAutorizaciones = (s) => {
  const out = [];

  if (Array.isArray(s?.autorizaciones)) {
    s.autorizaciones.forEach((it, idx) => {
      const name = String(it?.nombre || it?.name || `autorizacion_${idx + 1}`);
      const href = String(it?.url || it?.href || '');
      const mime = String(it?.tipo || it?.mime || '');
      const ext = extFromName(name) || (mime.includes('/') ? mime.split('/')[1] : '');
      out.push({
        __k: `auth_${idx}_${s.id}`,
        name,
        href,
        mime,
        ext,
        size: Number(it?.tamano || it?.size || 0),
        canView: isViewableInBrowser(ext)
      });
    });
  }

  return out;
};

const historialBySolped = ref({});
const historialLoadingSet = ref(new Set());


async function fetchHistorialEstados(solpedId) {
  if (!solpedId) return;
  historialLoadingSet.value.add(solpedId);

  try {
    let arr = [];
    try {
      const qy = query(
        collection(db, COLLECTION_NAME, solpedId, 'historialEstados'),
        orderBy('fecha', 'desc')
      );
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    } catch {
      const qy = query(collection(db, COLLECTION_NAME, solpedId, 'historialEstados'));
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
      arr.sort((a, b) => {
        const ta = a?.fecha?.toMillis?.() ?? new Date(a?.fecha || 0).getTime();
        const tb = b?.fecha?.toMillis?.() ?? new Date(b?.fecha || 0).getTime();
        return tb - ta;
      });
    }

    historialBySolped.value = {
      ...historialBySolped.value,
      [solpedId]: arr
    };
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo cargar el historial de estados.');
  } finally {
    historialLoadingSet.value.delete(solpedId);
  }
}

const commentSavingId = ref(null);

async function agregarComentario(solpe) {
  const texto = String(solpe?.nuevoComentario || '').trim();
  if (!texto || !solpe?.id) return;

  commentSavingId.value = solpe.id;
  try {
    const refd = doc(db, COLLECTION_NAME, solpe.id);
    const snap = await getDoc(refd);
    const data = snap.data() || {};
    const comentariosActuales = Array.isArray(data.comentarios) ? data.comentarios : [];

    const nuevoComentario = {
      texto,
      usuario: myFullName.value || auth?.user?.displayName || '—',
      fecha: new Date()
    };

    const comentarios = [...comentariosActuales, nuevoComentario];
    await updateDoc(refd, { comentarios });

    solpe.comentarios = comentarios;
    solpe.nuevoComentario = '';

    await addDoc(collection(db, COLLECTION_NAME, solpe.id, 'historialEstados'), {
      fecha: new Date(),
      estatus: data?.estatus || solpe?.estatus || 'Pendiente',
      usuario: myFullName.value || '—',
      comentario: `Comentario agregado: ${texto}`
    });

    addToast('success', 'Comentario agregado.');
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo guardar el comentario.');
  } finally {
    commentSavingId.value = null;
  }
}

const COT_COLLECTION = 'cotizaciones_plantas';
const ocBySolped = ref({});
const ocLoadingSet = ref(new Set());

const isLoadingOC = (id) => ocLoadingSet.value.has(id);
const ocListFor = (id) => ocBySolped.value[id] || [];

function toMillisSafe(v) {
  if (!v) return 0;
  if (v?.toMillis) return v.toMillis();
  if (v?.toDate) return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

async function fetchOCs(solpedId) {
  if (!solpedId) return;
  ocLoadingSet.value.add(solpedId);

  try {
    const resultadosMap = new Map();

    const solpeLocal =
      pageDocs.value.find(x => x.id === solpedId) ||
      solpeEncontrada.value?.id === solpedId
        ? solpeEncontrada.value
        : null;

    let numeroSolpe = solpeLocal?.numero_solpe ?? null;

    if (numeroSolpe == null) {
      try {
        const solpeSnap = await getDoc(doc(db, COLLECTION_NAME, solpedId));
        if (solpeSnap.exists()) {
          const data = solpeSnap.data() || {};
          numeroSolpe = data.numero_solpe ?? null;
        }
      } catch (e) {
        console.warn('No se pudo leer numero_solpe de la SOLPED', e);
      }
    }

    const consultas = [];

    consultas.push(
      getDocs(query(collection(db, COT_COLLECTION), where('solpedId', '==', solpedId)))
    );

    if (numeroSolpe != null && numeroSolpe !== '') {
      consultas.push(
        getDocs(query(collection(db, COT_COLLECTION), where('numero_solpe', '==', numeroSolpe)))
      );

      const numeroComoTexto = String(numeroSolpe);
      consultas.push(
        getDocs(query(collection(db, COT_COLLECTION), where('numero_solpe', '==', numeroComoTexto)))
      );
    }

    const settled = await Promise.allSettled(consultas);

    settled.forEach((res) => {
      if (res.status !== 'fulfilled') return;
      res.value.forEach((d) => {
        resultadosMap.set(d.id, {
          __docId: d.id,
          __collection: COT_COLLECTION,
          ...(d.data() || {})
        });
      });
    });

    const merged = Array.from(resultadosMap.values()).sort((a, b) => {
      const ta = toMillisSafe(a?.fechaSubida || a?.createdAt || a?.created_at);
      const tb = toMillisSafe(b?.fechaSubida || b?.createdAt || b?.created_at);
      return tb - ta;
    });

    ocBySolped.value = {
      ...ocBySolped.value,
      [solpedId]: merged
    };
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudieron cargar las cotizaciones vinculadas.');
  } finally {
    ocLoadingSet.value.delete(solpedId);
  }
}

const fmtMonedaOC = (n, c = 'CLP') => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString('es-CL', {
      style: 'currency',
      currency: c || 'CLP',
      minimumFractionDigits: 0
    });
  } catch {
    return `${c || 'CLP'} ${v.toLocaleString('es-CL')}`;
  }
};

const estadoChipOC = (estatus) => {
  const s = String(estatus || '').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('preaprob')) return 'bg-info-subtle text-info-emphasis';
  if (s.includes('proveedor') || s.includes('enviada')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

const statusUpdatingSolpedId = ref(null);
const statusUpdatingItemKey = ref(null);

const floatingEstadoSolped = ref(null);
const floatingEstadoItem = ref(null);

const abrirBarraEstadoSolped = (solpe) => {
  floatingEstadoItem.value = null;
  floatingEstadoSolped.value = solpe;
};

const abrirBarraEstadoItem = (solpe, item) => {
  floatingEstadoSolped.value = null;
  floatingEstadoItem.value = { solpe, item };
};

const cerrarBarraEstado = () => {
  floatingEstadoSolped.value = null;
  floatingEstadoItem.value = null;
};



async function cambiarEstadoSolped(solpe, nuevoEstado) {
  if (!solpe?.id || !puedeCambiarEstado.value) return;

  statusUpdatingSolpedId.value = solpe.id;
  try {
    const refd = doc(db, COLLECTION_NAME, solpe.id);
    await updateDoc(refd, { estatus: nuevoEstado });

    await addDoc(collection(db, COLLECTION_NAME, solpe.id, 'historialEstados'), {
      fecha: new Date(),
      estatus: nuevoEstado,
      usuario: myFullName.value || '—',
      comentario: `Cambio de estado de SOLPED a ${nuevoEstado}`
    });

    solpe.estatus = nuevoEstado;
    cerrarBarraEstado();
    await fetchHistorialEstados(solpe.id);
    addToast('success', `SOLPED actualizada a ${nuevoEstado}.`);
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo cambiar el estado de la SOLPED.');
  } finally {
    statusUpdatingSolpedId.value = null;
  }
}

async function cambiarEstadoItem(solpe, item, nuevoEstado) {
  if (!solpe?.id || !item || !puedeCambiarEstado.value) return;

  const key = `${solpe.id}_${item.item}`;
  statusUpdatingItemKey.value = key;

  try {
    const itemsActuales = Array.isArray(solpe.items) ? [...solpe.items] : [];
    const itemsNuevos = itemsActuales.map(it =>
      String(it.item) === String(item.item)
        ? { ...it, estado: nuevoEstado }
        : it
    );

    const refd = doc(db, COLLECTION_NAME, solpe.id);
    await updateDoc(refd, { items: itemsNuevos });

    await addDoc(collection(db, COLLECTION_NAME, solpe.id, 'historialEstados'), {
      fecha: new Date(),
      estatus: solpe?.estatus || 'Pendiente',
      usuario: myFullName.value || '—',
      comentario: `Cambio estado ítem ${item.item} a ${nuevoEstado}`
    });

    solpe.items = itemsNuevos;
    cerrarBarraEstado();
    await fetchHistorialEstados(solpe.id);
    addToast('success', `Ítem ${item.item} actualizado a ${nuevoEstado}.`);
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo cambiar el estado del ítem.');
  } finally {
    statusUpdatingItemKey.value = null;
  }
}

const buildWhere = () => {
  const wh = [];

  if (empresaSegmento.value !== 'todas') {
    wh.push(where('empresa', '==', empresaSegmento.value));
  }

  if (filtroEstatus.value.length === 1) {
    wh.push(where('estatus', '==', filtroEstatus.value[0]));
  } else if (filtroEstatus.value.length > 1 && filtroEstatus.value.length <= 10) {
    wh.push(where('estatus', 'in', filtroEstatus.value.slice(0, 10)));
  }

  if (filtroFechaDesde.value || filtroFechaHasta.value) {
    try {
      let start, end;

      if (filtroFechaDesde.value && filtroFechaHasta.value) {
        start = new Date(`${filtroFechaDesde.value}T00:00:00`);
        end = new Date(`${filtroFechaHasta.value}T23:59:59.999`);
        if (start > end) [start, end] = [end, start];
      } else if (filtroFechaDesde.value) {
        start = new Date(`${filtroFechaDesde.value}T00:00:00`);
        end = new Date(`${filtroFechaDesde.value}T23:59:59.999`);
      } else if (filtroFechaHasta.value) {
        start = new Date(`${filtroFechaHasta.value}T00:00:00`);
        end = new Date(`${filtroFechaHasta.value}T23:59:59.999`);
      }

      wh.push(where('createdAt', '>=', start));
      wh.push(where('createdAt', '<=', end));
    } catch (e) { console.log(e); }
  }

  if (onlyMine.value && myFullName.value) {
    wh.push(where('usuario', '==', myFullName.value));
  }

  if (onlyDirectedToMe.value && myFullName.value) {
    wh.push(where('dirigidoA', 'array-contains', myFullName.value));
  }

  if (selectedCentros.value.length === 1) {
    wh.push(where('numero_contrato', '==', selectedCentros.value[0]));
  } else if (selectedCentros.value.length >= 2 && selectedCentros.value.length <= 10) {
    wh.push(where('numero_contrato', 'in', selectedCentros.value.slice(0, 10)));
  }

  if (filtroUsuario.value.length === 1) {
    wh.push(where('usuario', '==', filtroUsuario.value[0]));
  } else if (filtroUsuario.value.length >= 2 && filtroUsuario.value.length <= 10) {
    wh.push(where('usuario', 'in', filtroUsuario.value.slice(0, 10)));
  }

  if (filtroAprobador.value.length === 1) {
    wh.push(where('aprobadorSolped', '==', filtroAprobador.value[0]));
  } else if (filtroAprobador.value.length >= 2 && filtroAprobador.value.length <= 10) {
    wh.push(where('aprobadorSolped', 'in', filtroAprobador.value.slice(0, 10)));
  }

  return wh;
};

const makePageQuery = (pageNumber = 1) => {
  const wh = buildWhere();
  const base = query(
    collection(db, COLLECTION_NAME),
    ...wh,
    orderBy('numero_solpe', 'desc'),
    limit(pageSize.value)
  );

  if (pageNumber > 1 && cursors.value[pageNumber - 1]) {
    return query(base, startAfter(cursors.value[pageNumber - 1]));
  }

  return base;
};

const subscribePage = () => {
  if (typeof unsubscribe === 'function') {
    unsubscribe();
    unsubscribe = null;
  }

  loading.value = true;
  const qy = makePageQuery(page.value);

  unsubscribe = onSnapshot(
    qy,
    async (snap) => {
      let docs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() || {}),
        comentarios: Array.isArray(d.data()?.comentarios) ? d.data().comentarios : []
      }));

      if (onlyMine.value && myFullName.value) {
        docs = docs.filter(s => String(s.usuario || '').trim() === myFullName.value);
      }

      pageDocs.value = docs;
      cursors.value[page.value] = snap.docs[snap.docs.length - 1] || null;

      const aprobadores = new Set(listaAprobadores.value);
      docs.forEach(d => {
        if (d?.aprobadorSolped) aprobadores.add(String(d.aprobadorSolped));
      });
      listaAprobadores.value = Array.from(aprobadores).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

      loading.value = false;
    },
    (e) => {
      console.error(e);
      error.value = 'No se pudieron cargar las SOLPED de plantas.';
      loading.value = false;
    }
  );
};

const refreshCount = async () => {
  try {
    const wh = buildWhere();
    const countQ = query(collection(db, COLLECTION_NAME), ...wh);
    const res = await getCountFromServer(countQ);
    totalCount.value = res.data().count || 0;
  } catch (e) {
    console.error(e);
    totalCount.value = Math.max(totalCount.value || 0, pageDocs.value.length);
  }
};

const loadUsuarios = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'Usuarios')));
    const raw = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));

    listaUsuarios.value = raw
      .filter(u => u.fullName && USUARIOS_FILTRO_PERMITIDOS.includes(String(u.fullName).trim()))
      .map(u => ({ id: u.id, fullName: String(u.fullName).trim() }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' }));

    const me = snap.docs.find(d => d.id === myUid.value);
    myFullName.value = me?.data()?.fullName || auth?.user?.displayName || '';
  } catch {
    myFullName.value = auth?.user?.displayName || '';
    listaUsuarios.value = USUARIOS_FILTRO_PERMITIDOS.map((fullName, idx) => ({
      id: `fixed_${idx}`,
      fullName
    }));
  }
};

const loadAprobadores = async () => {
  try {
    const snap = await getDocs(query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(200)));
    const set = new Set();
    snap.docs.forEach(d => {
      const data = d.data() || {};
      if (data.aprobadorSolped) set.add(String(data.aprobadorSolped));
    });
    listaAprobadores.value = Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  } catch {
    listaAprobadores.value = [];
  }
};

const applyFilters = () => {
  filtroUsuario.value = Array.from(tempUsuarioSelSet.value);
  filtroAprobador.value = Array.from(tempAprobadorSelSet.value);

  safeWrite(LS.FILTRO_FECHA_DESDE, filtroFechaDesde.value || '');
  safeWrite(LS.FILTRO_FECHA_HASTA, filtroFechaHasta.value || '');
  safeWrite(LS.FILTRO_ESTATUS, filtroEstatus.value || []);
  safeWrite(LS.FILTRO_USUARIOS, filtroUsuario.value || []);
  safeWrite(LS.FILTRO_APROBADORES, filtroAprobador.value || []);
  safeWrite(LS.SELECTED_CENTROS, selectedCentros.value || []);
  safeWrite(LS.EMPRESA_SEG, empresaSegmento.value);
  safeWrite(LS.PAGE_SIZE, pageSize.value);

  page.value = 1;
  cursors.value = {};

  subscribePage();
  refreshCount();
};

const limpiarFiltros = () => {
  filtroFechaDesde.value = '';
  filtroFechaHasta.value = '';
  filtroEstatus.value = [];
  filtroUsuario.value = [];
  filtroAprobador.value = [];
  tempUsuarioSelSet.value.clear();
  tempAprobadorSelSet.value.clear();
  selectedCentros.value = [];
  centroPickerSearch.value = '';
  busquedaUsuario.value = '';
  busquedaAprobador.value = '';
  onlyDirectedToMe.value = false;
  onlyMine.value = false;
  empresaSegmento.value = 'todas';
  pageSize.value = 10;

  Object.values(LS).forEach(safeRemove);
  applyFilters();
};

const setEmpresaSeg = (v) => {
  empresaSegmento.value = v;
  applyFilters();
};

const goPage = (p) => {
  if (p < 1) p = 1;
  if (p > totalPages.value) p = totalPages.value;

  page.value = p;
  subscribePage();
};

const nextPage = () => goPage(page.value + 1);
const prevPage = () => goPage(page.value - 1);

const limpiarBusqueda = () => {
  numeroBusquedaExacta.value = '';
  error.value = '';
  enModoBusqueda.value = false;
  resultadosBusqueda.value = [];
  solpeEncontrada.value = null;
  applyFilters();
};

const buscarSolpeExacta = async () => {
  solpeEncontrada.value = null;
  error.value = '';

  const termRaw = (numeroBusquedaExacta.value ?? '').toString().trim();
  if (!termRaw) {
    limpiarBusqueda();
    return;
  }

  loadingSearch.value = true;
  enModoBusqueda.value = false;
  resultadosBusqueda.value = [];

  if (typeof unsubscribe === 'function') {
    unsubscribe();
    unsubscribe = null;
  }

  try {
    if (/^\d+$/.test(termRaw)) {
      const n = Number(termRaw);
      const snap = await getDocs(
        query(collection(db, COLLECTION_NAME), where('numero_solpe', '==', n))
      );

      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        resultadosBusqueda.value = docs;
        enModoBusqueda.value = true;
        solpeEncontrada.value = docs[0] || null;
        pageDocs.value = docs;
        totalCount.value = docs.length;
        page.value = 1;
        solpeExpandidaId.value = docs[0]?.id || null;
        return;
      }

      error.value = 'No se encontró una SOLPED de planta con ese número.';
      subscribePage();
      await refreshCount();
      return;
    }

    const term = termRaw.toLowerCase();
    const qy = query(collection(db, COLLECTION_NAME), orderBy('numero_solpe', 'desc'), limit(300));
    const snap = await getDocs(qy);

    const matches = [];
    snap.forEach(d => {
      const data = d.data() || {};

      const nombreSolped = (data.nombre_solped || '').toString().toLowerCase();
      const numSolpeStr = (data.numero_solpe ?? '').toString().toLowerCase();
      const contratoStr = (data.numero_contrato ?? '').toString().toLowerCase();
      const empresaStr = (data.empresa ?? '').toString().toLowerCase();
      const usuarioStr = (data.usuario ?? '').toString().toLowerCase();
      const aprobadorStr = (data.aprobadorSolped ?? '').toString().toLowerCase();
      const centroStr = (data.nombre_centro_costo ?? '').toString().toLowerCase();
      const tipoStr = (data.tipo_solped ?? '').toString().toLowerCase();

      const items = Array.isArray(data.items) ? data.items : [];

      const matchHeader =
        nombreSolped.includes(term) ||
        numSolpeStr.includes(term) ||
        contratoStr.includes(term) ||
        empresaStr.includes(term) ||
        usuarioStr.includes(term) ||
        aprobadorStr.includes(term) ||
        centroStr.includes(term) ||
        tipoStr.includes(term);

      const matchItems = items.some(it => {
        const cod = (it.codigo_referencial || '').toString().toLowerCase();
        const desc = (it.descripcion || '').toString().toLowerCase();
        const numi = (it.numero_interno || '').toString().toLowerCase();
        return cod.includes(term) || desc.includes(term) || numi.includes(term);
      });

      if (matchHeader || matchItems) {
        matches.push({ id: d.id, ...data });
      }
    });

    if (!matches.length) {
      error.value = 'No se encontraron SOLPED de plantas que coincidan con el texto buscado.';
      subscribePage();
      await refreshCount();
      return;
    }

    resultadosBusqueda.value = matches;
    enModoBusqueda.value = true;
    solpeEncontrada.value = matches[0] || null;
    pageDocs.value = matches;
    totalCount.value = matches.length;
    page.value = 1;
    solpeExpandidaId.value = matches[0]?.id || null;
  } catch (e) {
    console.error(e);
    error.value = 'No se pudo realizar la búsqueda.';
    subscribePage();
    await refreshCount();
  } finally {
    loadingSearch.value = false;
  }
};

const expandEncontrada = () => {
  if (!solpeEncontrada.value) return;
  pageDocs.value = [solpeEncontrada.value];
  totalCount.value = 1;
  page.value = 1;
  solpeExpandidaId.value = solpeEncontrada.value.id;
};

const solpeExpandidaId = ref(null);

const onExpandCard = async (s) => {
  solpeExpandidaId.value = (solpeExpandidaId.value === s.id) ? null : s.id;

  if (solpeExpandidaId.value === s.id) {
    if (!historialBySolped.value[s.id]) {
      await fetchHistorialEstados(s.id);
    }
    if (!ocBySolped.value[s.id]) {
      await fetchOCs(s.id);
    }
  }
};

const removeEstatus = (s) => {
  filtroEstatus.value = filtroEstatus.value.filter(x => x !== s);
  applyFilters();
};

const removeUsuario = (u) => {
  filtroUsuario.value = filtroUsuario.value.filter(x => x !== u);
  tempUsuarioSelSet.value.delete(u);
  applyFilters();
};

const toasts = ref([]);

const addToast = (type, text, timeout = 3000) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, type, text });
  setTimeout(() => closeToast(id), timeout);
};

const closeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

const showImgModal = ref(false);
const previewImgSrc = ref('');

const abrirImagen = (src) => {
  if (!src) return;
  previewImgSrc.value = src;
  showImgModal.value = true;
};

const abrirImagenNuevaPestana = (src) => {
  if (!src) return;
  window.open(src, '_blank', 'noopener');
};


const showEditModal = ref(false);
const savingEdit = ref(false);
const editAdjuntosExistentes = ref([]);
const editAdjuntosNuevos = ref([]);
const editAdjuntosEliminados = ref([]);
const editUploadProgress = ref(0);
const adjuntosInputEdit = ref(null);
const editItems = ref([]);
const dirigidoASelected = ref([]);
const loadingCotizadoresEdit = ref(false);
const cotizadoresEdit = ref([]);

const editForm = ref({
  id: "",
  empresa: "",
  numero_solpe: null,
  numero_contrato: "",
  nombre_centro_costo: "",
  tipo_solped: "",
  nombre_solped: "",
  comentario_aprobacion_solped: "",
  prioridad_solped: "MEDIA"
});

const tiposSolped = [
  "EPP",
  "INSUMOS DE OFICINA",
  "SERVICIOS DE TERCEROS",
  "REPUESTOS",
  "MATERIALES",
  "HERRAMIENTAS",
  "LUBRICANTES",
  "NEUMÁTICOS",
  "EDP",
  "MATERIAS PRIMA",
  "INSUMOS DE MINERÍA",
  "INSUMOS DE TALLER"
];

const HORAS_EDICION_SOLPED = 24;

const setStyle = (ws, addr, s) => {
  if (!ws[addr]) ws[addr] = { t: 's', v: '' };
  ws[addr].s = { ...(ws[addr].s || {}), ...s };
};

const styleCell = (ws, r, c, s) => {
  const addr = XLSX.utils.encode_cell({ r, c });
  setStyle(ws, addr, s);
};

const descargarExcel = (solpe) => {
  try {
    const data = [];
    const empresasSet = new Set();

    const titulo = `SOLPED PLANTA #${solpe.numero_solpe || ''}`;
    data.push([titulo]);
    data.push(['Solicitante:', solpe.usuario ?? '']);
    data.push(['Fecha:', prettyFecha(solpe.createdAt || solpe.fecha_str || solpe.fecha) ?? '']);
    data.push(['N° Contrato:', solpe.numero_contrato ?? '']);
    data.push(['Centro de costo:', solpe.nombre_centro_costo ?? '']);
    data.push(['Empresa:', solpe.empresa ?? '']);
    data.push([]);

    (solpe.items || []).forEach(it => {
      (it.comparaciones || []).forEach(c => {
        if (c?.empresa) empresasSet.add(String(c.empresa).toUpperCase());
      });
    });

    const empresas = Array.from(empresasSet);

    const baseHeaders = [
      'ITEM',
      'CANTIDAD',
      'STOCK',
      'CANTIDAD COTIZADA',
      'DESCRIPCIÓN',
      'CODIGO_REFERENCIAL',
      'PRIORIDAD',
      'ESTATUS'
    ];

    data.push([...baseHeaders, ...empresas]);

    (solpe.items || []).forEach((it, idx) => {
      const filaBase = [
        it?.item ?? (idx + 1),
        it?.cantidad ?? '',
        it?.stock ?? '0',
        it?.cantidad_cotizada ?? '0',
        it?.descripcion ?? '',
        it?.codigo_referencial ?? '',
        it?.prioridad ?? 'MEDIA',
        it?.estado ?? ''
      ];

      const preciosPorEmpresa = {};

      (it?.comparaciones || []).forEach(comp => {
        const emp = comp?.empresa ? String(comp.empresa).toUpperCase() : '';
        if (!emp) return;

        const precio = comp?.precioBase ?? comp?.precio ?? '';
        const desc = comp?.descuento ?? 0;

        preciosPorEmpresa[emp] =
          typeof precio === 'number'
            ? `${precio} (desc. ${desc}%)`
            : `${precio || ''}`;
      });

      data.push([
        ...filaBase,
        ...empresas.map(e => preciosPorEmpresa[e] ?? '')
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `SOLPED_${solpe.numero_solpe || ''}`);

    const totalCols = baseHeaders.length + empresas.length;

    ws['!cols'] = [
      8,
      12,
      12,
      18,
      60,
      24,
      14,
      16,
      ...Array(empresas.length).fill(18)
    ].map(wch => ({ wch }));

    const borderThin = {
      top: { style: 'thin', color: { rgb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { rgb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { rgb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'FFCBD5E1' } }
    };

    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: totalCols - 1 }
    });

    setStyle(ws, XLSX.utils.encode_cell({ r: 0, c: 0 }), {
      font: { bold: true, sz: 18, color: { rgb: 'FF111827' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });

    const headerRow = 7;

    for (let c = 0; c < totalCols; c++) {
      styleCell(ws, headerRow, c, {
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        fill: { fgColor: { rgb: 'FF1F2937' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderThin
      });
    }

    const startDataRow = headerRow + 1;

    for (let r = startDataRow; r < data.length; r++) {
      for (let c = 0; c < totalCols; c++) {
        styleCell(ws, r, c, {
          border: borderThin,
          alignment: { vertical: 'top', wrapText: true }
        });
      }

      const prioridadCol = 6;
      const prioridadVal = String(data[r][prioridadCol] || 'MEDIA').toUpperCase();

      let fillColor = 'FFFDE68A';
      let textColor = 'FF78350F';

      if (prioridadVal === 'ALTA') {
        fillColor = 'FFFEE2E2';
        textColor = 'FF991B1B';
      } else if (prioridadVal === 'BAJA') {
        fillColor = 'FFDCFCE7';
        textColor = 'FF166534';
      }

      styleCell(ws, r, prioridadCol, {
        fill: { fgColor: { rgb: fillColor } },
        font: { bold: true, color: { rgb: textColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `SOLPED_PLANTA_${solpe.numero_solpe || ''}_${hoy}.xlsx`);
  } catch (e) {
    console.error(e);
    addToast('danger', 'No se pudo generar el Excel.');
  }
};

const getFechaCreacionSolped = (s) => {
  try {
    if (s?.createdAt?.toDate) return s.createdAt.toDate();
    if (s?.fecha_str?.toDate) return s.fecha_str.toDate();

    if (s?.createdAt) {
      const d1 = new Date(s.createdAt);
      if (!isNaN(d1)) return d1;
    }

    if (s?.fecha_str) {
      const d2 = new Date(s.fecha_str);
      if (!isNaN(d2)) return d2;
    }

    if (s?.fecha) {
      const d3 = new Date(s.fecha);
      if (!isNaN(d3)) return d3;
    }

    return null;
  } catch {
    return null;
  }
};

const puedeEditarSolped = (s) => {
  if (!(isGenerador.value || isAdmin.value)) return false;

  const esDueno =
    myFullName.value &&
    String(s?.usuario || '').trim().toLowerCase() === String(myFullName.value || '').trim().toLowerCase();

  if (!esDueno && !isAdmin.value) return false;

  if (isAdmin.value) return true;

  if (isGenerador.value && esDueno && puedeReeditarPorEstado(s)) {
    return true;
  }
  const fechaCreacion = getFechaCreacionSolped(s);
  if (!fechaCreacion || isNaN(fechaCreacion.getTime())) return false;

  const ahora = new Date();
  const diffMs = ahora.getTime() - fechaCreacion.getTime();
  if (diffMs < 0) return false;

  const limiteMs = HORAS_EDICION_SOLPED * 60 * 60 * 1000;
  return diffMs <= limiteMs;
};

function cloneSolpedForEdit(s) {
  const base = JSON.parse(JSON.stringify(s || {}));
  return {
    id: base.id,
    numero_solpe: base.numero_solpe,
    empresa: base.empresa || '',
    numero_contrato: base.numero_contrato || '',
    nombre_centro_costo: base.nombre_centro_costo || '',
    tipo_solped: base.tipo_solped || '',
    nombre_solped: base.nombre_solped || '',
    comentario_aprobacion_solped: base.comentario_aprobacion_solped || '',
    prioridad_solped: base.prioridad_solped || 'MEDIA',
    usuario: base.usuario || '',
  };
}

const tiposPermitidosAdjuntos = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
];

const extPermitidasAdjuntos = [
  ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xls", ".xlsx"
];

const esAdjuntoPermitido = (file) => {
  const name = String(file?.name || "").toLowerCase();
  return tiposPermitidosAdjuntos.includes(file?.type) ||
    extPermitidasAdjuntos.some(ext => name.endsWith(ext));
};

const resetAdjuntosEdit = () => {
  editAdjuntosExistentes.value = [];
  editAdjuntosNuevos.value = [];
  editAdjuntosEliminados.value = [];
  editUploadProgress.value = 0;
};

const abrirSelectorAdjuntosEdit = () => {
  adjuntosInputEdit.value?.click();
};

const agregarArchivosAdjuntos = (files = []) => {
  if (!files.length) return;

  const invalidos = files.filter(f => !esAdjuntoPermitido(f));
  if (invalidos.length) {
    addToast("danger", "Solo se permiten PDF, imágenes, Word y Excel.");
    return;
  }

  const actuales = [...editAdjuntosNuevos.value];

  for (const f of files) {
    const dup = actuales.some(x =>
      x.name === f.name &&
      x.size === f.size &&
      x.lastModified === f.lastModified
    );
    if (!dup) actuales.push(f);
  }

  editAdjuntosNuevos.value = actuales;
  addToast("success", `${files.length} archivo(s) agregado(s).`);
};

const onPickAdjuntosEdit = (ev) => {
  const files = Array.from(ev?.target?.files || []);
  if (ev?.target) ev.target.value = "";
  agregarArchivosAdjuntos(files);
};

const onDropAdjuntosEdit = (ev) => {
  dragAdjuntos.value = false;
  const files = Array.from(ev?.dataTransfer?.files || []);
  agregarArchivosAdjuntos(files);
};

const quitarAdjuntoNuevo = (idx) => {
  editAdjuntosNuevos.value.splice(idx, 1);
};

const quitarAdjuntoExistente = (idx) => {
  const file = editAdjuntosExistentes.value[idx];
  if (!file) return;
  editAdjuntosEliminados.value.push(file);
  editAdjuntosExistentes.value.splice(idx, 1);
};

const formatearTamano = (bytes = 0) => {
  const n = Number(bytes || 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

async function subirAdjuntoSolped(file, solped) {
  const empresa = String(solped?.empresa || "empresa")
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");

  const numero = String(solped?.numero_solpe || "sin_numero");
  const nombre = String(file.name || "archivo").replace(/\s+/g, "_");

  const path = `solped_adjuntos_plantas/${empresa}_${numero}/${Date.now()}/${nombre}`;
  const sref = storageRef(storage, path);

  return await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(sref, file);

    task.on(
      "state_changed",
      null,
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({
            nombre: file.name,
            tamano: Number(file.size || 0),
            tipo: file.type || "application/octet-stream",
            url,
            path
          });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

const keyifyEmpresa = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

async function cargarCotizadoresDesdeConfiguracion(empresaNombre) {
  loadingCotizadoresEdit.value = true;
  cotizadoresEdit.value = [];
  dirigidoASelected.value = [];

  try {
    const empresaKey = keyifyEmpresa(empresaNombre);
    const roots = [
      'aprobacion_solped_plantas',
      'aprobacion_solped_planta',
      'aprobacion_solped',
      'aprobacion_oc_taller'
    ];

    let encontrados = [];

    for (const root of roots) {
      try {
        const empresaRef = doc(db, 'configuracion', root, 'empresas', empresaKey);
        const cotCol = collection(empresaRef, 'cotizadores');
        const snap = await getDocs(cotCol);

        if (!snap.empty) {
          encontrados = snap.docs
            .map(d => ({ id: d.id, ...(d.data() || {}) }))
            .filter(c => c && c.activo !== false)
            .map(c => ({
              uid: String(c.uid || c.id || ""),
              fullName: String(c.fullName || c.nombre || c.email || "—").trim(),
              email: String(c.email || "").trim(),
            }))
            .filter(c => c.fullName)
            .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "", "es", { sensitivity: "base" }));

          if (encontrados.length) break;
        }
      } catch (e) {
        console.warn('Config root no disponible:', root, e);
      }
    }

    cotizadoresEdit.value = encontrados;
  } catch (e) {
    console.error(e);
    cotizadoresEdit.value = [];
  } finally {
    loadingCotizadoresEdit.value = false;
  }
}

const abrirEditar = async (s) => {
  try {
    if (!puedeEditarSolped(s)) {
      addToast(
        'danger',
        'No puedes editar esta SOLPED. El generador dueño puede editar si está pendiente o rechazada; en otros casos, sólo dentro de 24 horas. Admin siempre puede editar.'
      );
      return;
    }

    editForm.value = cloneSolpedForEdit(s);

    editItems.value = (s.items || []).map(it => ({
      ...it,
      codigo_referencial: it?.codigo_referencial || '',
      numero_interno: it?.numero_interno || '',
      prioridad: it?.prioridad || 'MEDIA',
      __k: Math.random().toString(36).slice(2),
      _dragOver: false
    }));

    resetAdjuntosEdit();

    editAdjuntosExistentes.value = Array.isArray(s?.autorizaciones)
      ? s.autorizaciones.map((a, idx) => ({
          __k: `auth_${idx}_${s.id}`,
          nombre: a?.nombre || `archivo_${idx + 1}`,
          tamano: Number(a?.tamano || 0),
          tipo: a?.tipo || "",
          url: a?.url || "",
          path: a?.path || ""
        }))
      : [];

    await cargarCotizadoresDesdeConfiguracion(editForm.value.empresa || '');

    dirigidoASelected.value = Array.isArray(s.dirigidoA)
      ? s.dirigidoA.filter(v => typeof v === 'string')
      : [];

    if (editForm.value.numero_contrato) {
      const c = String(editForm.value.numero_contrato);
      editForm.value.nombre_centro_costo = (centrosMap.value?.[c] || '');
    }

    showEditModal.value = true;
  } catch (e) {
    console.error(e);
    addToast('danger', 'Error al abrir edición.');
  }
};

const cerrarEditar = () => {
  resetAdjuntosEdit();
  showEditModal.value = false;
  savingEdit.value = false;
  editForm.value = {};
  editItems.value = [];
  dirigidoASelected.value = [];
  cotizadoresEdit.value = [];
  loadingCotizadoresEdit.value = false;
};

async function fileToJpegBlob(file, { maxW = 1280, maxH = 1280, quality = 0.82 } = {}) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("No se pudo convertir la imagen.");
  return blob;
}

async function uploadSolpedItemImage({ solpedId, numeroSolpe, itemNo, file }) {
  const blob = await fileToJpegBlob(file);

  const safeEmpresa = String(editForm.value?.empresa || "empresa")
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "");

  const path = `solped_images_plantas/${safeEmpresa}_${numeroSolpe}/${solpedId}/item_${itemNo}_${Date.now()}.jpg`;
  const sref = storageRef(storage, path);

  await uploadBytes(sref, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(sref);

  return { url, path };
}

async function procesarNuevaImagen(it, file) {
  if (!file) return;

  if (!file.type?.startsWith("image/")) {
    addToast("danger", "Selecciona un archivo de imagen válido.");
    return;
  }

  if (!showEditModal.value || !editForm.value?.id) {
    addToast("danger", "No hay SOLPED en edición.");
    return;
  }

  it._imgUploading = true;
  it._dragOver = false;

  try {
    if (it.imagen_path) {
      try {
        await deleteObject(storageRef(storage, it.imagen_path));
      } catch (e) {
        console.warn("No se pudo borrar imagen anterior:", e);
      }
    }

    const solpedId = String(editForm.value.id);
    const numeroSolpe = editForm.value.numero_solpe || "0";
    const itemNo = it.item || 0;

    const { url, path } = await uploadSolpedItemImage({
      solpedId,
      numeroSolpe,
      itemNo,
      file
    });

    it.imagen_url = url;
    it.imagen_path = path;

    addToast("success", "Imagen reemplazada correctamente.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo subir la imagen.");
  } finally {
    it._imgUploading = false;
  }
}

async function onPickImg(ev, it) {
  const input = ev?.target;
  const file = input?.files?.[0];
  if (input) input.value = "";
  await procesarNuevaImagen(it, file);
}

async function onDropImg(ev, it) {
  it._dragOver = false;
  const file = ev?.dataTransfer?.files?.[0];
  await procesarNuevaImagen(it, file);
}

async function borrarImg(it) {
  if (!it) return;
  if (it._imgUploading) return;

  if (it.imagen_path) {
    try {
      await deleteObject(storageRef(storage, it.imagen_path));
    } catch (e) {
      console.warn("No se pudo borrar en storage:", e);
    }
  }

  it.imagen_url = "";
  it.imagen_path = "";
}

function agregarItem() {
  editItems.value.push({
    __k: Math.random().toString(36).slice(2),
    item: (editItems.value.length ? (Math.max(...editItems.value.map(i => Number(i.item) || 0)) + 1) : 1),
    descripcion: '',
    codigo_referencial: '',
    cantidad: 1,
    numero_interno: '',
    stock: 0,
    prioridad: 'MEDIA',
    estado: 'pendiente',
    imagen_url: '',
    imagen_path: '',
    _dragOver: false
  });
}

function eliminarItem(idx) {
  editItems.value.splice(idx, 1);
}

watch(
  () => editForm.value?.numero_contrato,
  (codigo) => {
    const c = String(codigo || "");
    editForm.value.nombre_centro_costo = (centrosMap.value?.[c] || "");
  }
);

async function guardarEdicion() {
  if (!editForm.value?.id || savingEdit.value) return;

  const refCheck = doc(db, COLLECTION_NAME, editForm.value.id);
  const snapCheck = await getDoc(refCheck);
  const dataCheck = snapCheck.data() || {};

  if (!puedeEditarSolped({ ...dataCheck, id: editForm.value.id })) {
    addToast(
      "danger",
      "No puedes editar esta SOLPED. El generador dueño puede editar si está pendiente o rechazada; en otros casos, sólo dentro de 24 horas. Admin siempre puede editar."
    );
    cerrarEditar();
    return;
  }

  const estadoPlano = (v) =>
    String(v || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const estabaRechazadaAntes =
    estadoPlano(dataCheck?.estadoAprobacionSolped) === "rechazada" ||
    estadoPlano(dataCheck?.estadoAprobacionSolped) === "solped rechazada" ||
    estadoPlano(dataCheck?.estatus) === "rechazado" ||
    estadoPlano(dataCheck?.estatus) === "solped rechazada";

  savingEdit.value = true;
  editUploadProgress.value = 0;

  try {
    const refd = doc(db, COLLECTION_NAME, editForm.value.id);

    const totalFiles = editAdjuntosNuevos.value.length;
    const nuevosAdjuntosSubidos = [];

    for (let i = 0; i < totalFiles; i++) {
      const f = editAdjuntosNuevos.value[i];
      const subido = await subirAdjuntoSolped(f, editForm.value);
      nuevosAdjuntosSubidos.push(subido);
      editUploadProgress.value = Math.round(((i + 1) / totalFiles) * 100);
    }

    for (const oldFile of editAdjuntosEliminados.value) {
      try {
        if (oldFile?.path) {
          await deleteObject(storageRef(storage, oldFile.path));
        }
      } catch (e) {
        console.warn("No se pudo eliminar archivo anterior:", e);
      }
    }

    const payload = {
      empresa: editForm.value.empresa || "",
      numero_contrato: editForm.value.numero_contrato || "",
      nombre_centro_costo: editForm.value.nombre_centro_costo || "",
      tipo_solped: editForm.value.tipo_solped || "",
      nombre_solped: editForm.value.nombre_solped || "",
      comentario_aprobacion_solped: estabaRechazadaAntes
        ? ""
        : (editForm.value.comentario_aprobacion_solped || ""),
      prioridad_solped: editForm.value.prioridad_solped || "MEDIA",
      dirigidoA: Array.from(new Set(dirigidoASelected.value || [])),
      items: editItems.value.map((it) => ({
        item: it.item,
        descripcion: String(it.descripcion || "").trim(),
        codigo_referencial: String(it.codigo_referencial || "").trim() || "SIN CODIGO",
        cantidad: Number(it.cantidad || 0),
        numero_interno: String(it.numero_interno || "").trim() || "SIN PATENTE",
        stock: Number(it.stock || 0),
        prioridad: it.prioridad || "MEDIA",
        estado: it.estado || "pendiente",
        imagen_url: it.imagen_url || "",
        imagen_path: it.imagen_path || ""
      })),
      autorizaciones: [
        ...editAdjuntosExistentes.value.map((a) => ({
          nombre: a.nombre || "",
          tamano: Number(a.tamano || 0),
          tipo: a.tipo || "",
          url: a.url || "",
          path: a.path || ""
        })),
        ...nuevosAdjuntosSubidos
      ],

      ...(estabaRechazadaAntes
        ? {
            estatus: "Pendiente",
            estadoAprobacionSolped: "Pendiente"
          }
        : {})
    };

    await updateDoc(refd, payload);

    await setDoc(doc(db, COLLECTION_NAME, editForm.value.id, "historialEstados", `${Date.now()}`), {
      fecha: new Date(),
      estatus: estabaRechazadaAntes ? "Pendiente" : (dataCheck?.estatus || "Pendiente"),
      usuario: myFullName.value || "—",
      comentario: estabaRechazadaAntes
        ? "Se corrigió SOLPED rechazada y quedó nuevamente pendiente para reenvío"
        : "Se actualizó SOLPED"
    });

    addToast("success", estabaRechazadaAntes
      ? "SOLPED Planta corregida y reenviada correctamente."
      : "SOLPED Planta actualizada correctamente."
    );

    const editedId = editForm.value.id;
    cerrarEditar();
    subscribePage();

    if (solpeExpandidaId.value === editedId) {
      await fetchHistorialEstados(editedId);
    }
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar la edición.");
  } finally {
    savingEdit.value = false;
    editUploadProgress.value = 0;
  }
}

onMounted(async () => {
  computeIsDesktop();
  window.addEventListener('resize', handleResize);

  showSidebar.value = Boolean(safeRead(LS.SHOW_SIDEBAR, true));
  filtroFechaDesde.value = safeRead(LS.FILTRO_FECHA_DESDE, '') || '';
  filtroFechaHasta.value = safeRead(LS.FILTRO_FECHA_HASTA, '') || '';
  filtroEstatus.value = Array.isArray(safeRead(LS.FILTRO_ESTATUS, [])) ? safeRead(LS.FILTRO_ESTATUS, []) : [];
  filtroUsuario.value = Array.isArray(safeRead(LS.FILTRO_USUARIOS, [])) ? safeRead(LS.FILTRO_USUARIOS, []) : [];
  filtroUsuario.value = filtroUsuario.value.filter(u => USUARIOS_FILTRO_PERMITIDOS.includes(String(u).trim()));
  filtroAprobador.value = Array.isArray(safeRead(LS.FILTRO_APROBADORES, [])) ? safeRead(LS.FILTRO_APROBADORES, []) : [];
  selectedCentros.value = Array.isArray(safeRead(LS.SELECTED_CENTROS, [])) ? safeRead(LS.SELECTED_CENTROS, []) : [];
  empresaSegmento.value = safeRead(LS.EMPRESA_SEG, 'todas') || 'todas';
  pageSize.value = Number(safeRead(LS.PAGE_SIZE, 10)) || 10;
  onlyDirectedToMe.value = !!safeRead(LS.ONLY_DIRECTED, false);
  onlyMine.value = !!safeRead(LS.ONLY_MINE, false);
  if (!puedeVerFiltroDirigidoAMi.value) {
    onlyDirectedToMe.value = false;
    safeRemove(LS.ONLY_DIRECTED);
  }

  if (!puedeVerFiltroMisSolped.value) {
    onlyMine.value = false;
    safeRemove(LS.ONLY_MINE);
  }
  tempUsuarioSelSet.value = new Set(
    filtroUsuario.value.filter(u => USUARIOS_FILTRO_PERMITIDOS.includes(String(u).trim()))
  );
  tempAprobadorSelSet.value = new Set(filtroAprobador.value);

  await Promise.all([
    loadUsuarios(),
    loadCentrosCosto(),
    loadAprobadores()
  ]);

  await refreshCount();
  subscribePage();
});

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe();
  window.removeEventListener('resize', handleResize);
  document.documentElement.style.overflow = '';
});

watch(
  [empresaSegmento, filtroFechaDesde, filtroFechaHasta, () => filtroEstatus.value.slice(), pageSize],
  () => {
    applyFilters();
  }
);
</script>

<style scoped>
.historial-page{ min-height:100vh; }
.pointer{ cursor:pointer; }
.small{ font-size:.875rem; }
.text-secondary{ color:#64748b !important; }

.alert-pro{
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 8px 24px rgba(15,23,42,.06), 0 2px 6px rgba(15,23,42,.05);
  position: relative;
  overflow: hidden;
  animation: fadeSlideIn .25s ease-out;
}
.alert-pro i{ font-size: 1.05rem; line-height: 1; }
.alert-pro::before{
  content:"";
  position:absolute; inset:0 0 0 auto; width:6px;
  background: linear-gradient(180deg,#ef4444,#dc2626);
}
@keyframes fadeSlideIn{
  from{opacity:0; transform: translateY(-4px);}
  to{opacity:1; transform: translateY(0);}
}

.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
  background:#fff;
}

.sticky-pager{
  position: sticky;
  top: 8px;
  z-index: 5;
  background: transparent;
  backdrop-filter: blur(3px);
}

.sticky-sidebar{ position: sticky; top: 12px; }

.floating-filters-btn{
  position: fixed;
  right: 16px; bottom: 16px;
  z-index: 20;
  border-radius: 10px;
  width: 48px; height: 48px;
  display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

.loading-global{
  display:flex; align-items:center; justify-content:center;
  padding:2rem; border:1px dashed #e5e7eb; border-radius:.75rem;
}

.ghost-wrap{ text-align:center; padding:2rem 0; color:#64748b; }
.ghost{
  width:120px; height:140px; margin:0 auto; background:#fff; border-radius:60px 60px 20px 20px;
  position:relative; box-shadow: 0 10px 20px rgba(0,0,0,.08);
  animation: floaty 3s ease-in-out infinite;
}
.ghost:before{
  content:''; position:absolute; top:-12px; left:50%; transform:translateX(-50%);
  width:60px; height:12px; background:#e2e8f0; border-radius:6px; filter:blur(2px);
}
.ghost-eyes{
  position:absolute; top:45px; left:50%; transform:translateX(-50%);
  width:60px; height:14px; display:flex; justify-content:space-between;
}
.ghost-eyes:before, .ghost-eyes:after{
  content:''; width:14px; height:14px; background:#111827; border-radius:50%;
}
.ghost-bottom{
  position:absolute; bottom:-12px; left:0; right:0; display:flex; justify-content:space-between; padding:0 6px;
}
.ghost-text{ margin-top:1rem; font-weight:500; }
@keyframes floaty{
  0%{transform:translateY(0)}
  50%{transform:translateY(-8px)}
  100%{transform:translateY(0)}
}

.bg-primary-subtle{ background-color:#e7f1ff !important; }
.text-primary-emphasis{ color:#0a58ca !important; }

.badge{
  border-radius:999px; padding:.35rem .6rem;
  font-weight:700; letter-spacing:.2px;
}
.badge .btn-close{
  width:.6rem; height:.6rem;
  filter: invert(1) grayscale(100%) brightness(0.4);
}

.toast-stack{
  position: fixed;
  right: 16px; bottom: 16px; z-index: 1080;
  display:flex; flex-direction:column; gap:10px;
}
.toast-box{
  display:flex; align-items:center; padding:.6rem .8rem; border-radius:.5rem; color:#fff;
  min-width:260px; max-width:360px; box-shadow:0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-danger{ background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

.thumb{
  width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0;
}

.timeline-wrap{
  position: relative;
  padding-left: 1rem;
}
.timeline-wrap::before{
  content:'';
  position:absolute;
  top: 0; bottom: 0; left: 10px;
  width: 2px; background: #dbeafe;
}
.timeline-item{
  position: relative;
  padding-left: 1.3rem;
  margin-bottom: 1rem;
}
.timeline-dot{
  position:absolute;
  left: 2px; top: 12px;
  width: 16px; height: 16px;
  border-radius:50%;
  background:#2563eb;
  box-shadow: 0 0 0 5px rgba(37,99,235,.12);
}
.timeline-card{
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: .9rem 1rem;
  box-shadow: 0 4px 16px rgba(15,23,42,.06);
}

.status-card-mini{
  max-width: 420px;
  margin-left: auto;
  padding: .85rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f8fafc;
  box-shadow: 0 10px 24px rgba(15,23,42,.06);
}

.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }

.oc-wrap{ position: fixed; inset: 0; z-index: 1080; }
.oc-backdrop{
  position: absolute; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(1px);
}
.oc-panel{
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(92vw, 420px);
  background: #fff; box-shadow: -8px 0 24px rgba(0,0,0,.2);
  display: flex; flex-direction: column;
  transform: translateX(0); animation: ocSlideIn .22s ease-out;
}
@keyframes ocSlideIn {
  from { transform: translateX(100%); opacity: .6; }
  to { transform: translateX(0); opacity: 1; }
}
.oc-header{
  padding: .9rem .9rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.oc-body{ padding: .9rem; overflow: auto; }

.list-group-item .bi-file-earmark-pdf-fill { color:#dc2626; }
.list-group-item .bi-file-earmark-excel-fill { color:#16a34a; }
.list-group-item .bi-file-earmark-image-fill { color:#2563eb; }
.list-group-item .bi-paperclip { color:#6b7280; }

.modal-content {
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15,23,42,.22);
}

.modal-header {
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.modal-footer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

@media (max-width: 420px){
  .card-header .small{ font-size: .8rem; }
}
.bottom-sheet-enter-active,
.bottom-sheet-leave-active{
  transition: opacity .22s ease, transform .22s ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to{
  opacity: 0;
  transform: translateY(18px);
}

.floating-action-bar{
  position: fixed;
  left: 0;
  right: 0;
  bottom: 14px;
  z-index: 1090;
  display: flex;
  justify-content: center;
  pointer-events: none;
  padding: 0 12px;
}

.floating-card{
  width: min(920px, 100%);
  background: rgba(255,255,255,.96);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 18px 50px rgba(15,23,42,.18);
  padding: .8rem 1rem 1rem;
  pointer-events: auto;
}

.floating-handle{
  width: 56px;
  height: 5px;
  border-radius: 999px;
  background: #cbd5e1;
  margin: 0 auto .9rem;
}

.floating-header{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .9rem;
}

.floating-actions{
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
}

.btn-pill{
  border-radius: 999px;
  padding: .7rem 1rem;
  font-weight: 600;
}

@media (max-width: 768px){
  .floating-action-bar{
    bottom: 10px;
    padding: 0 10px;
  }

  .floating-card{
    border-radius: 18px;
    padding: .75rem .85rem .9rem;
  }

  .floating-header{
    flex-direction: row;
    align-items: flex-start;
  }

  .floating-actions{
    flex-direction: column;
  }

  .floating-actions .btn{
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
