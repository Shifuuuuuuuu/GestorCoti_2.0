<!-- src/views/HistorialSolped.vue -->
<template>
  <div class="historial-page">
    <div class="container py-4 py-md-5">
      <!-- Top bar -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i>
          <span class="d-none d-sm-inline ms-1">Volver</span>
        </button>

        <h1 class="h5 fw-semibold mb-0 text-truncate">Historial de SOLPED</h1>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" @click="toggleSidebar">
            <i class="bi" :class="showSidebar ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-inset'"></i>
            <span class="d-none d-sm-inline ms-1">{{ showSidebar ? 'Ocultar filtros' : 'Mostrar filtros' }}</span>
          </button>
        </div>
      </div>

      <!-- Error global -->
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

      <!-- Buscador exacto -->
      <div class="card card-elevated mb-3">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">🔎 Buscar SOLPED por número</div>
          <div class="small text-secondary">Consulta directa (no carga todo)</div>
        </div>
        <div class="card-body">
          <div class="row g-2">
            <div class="col-12 col-sm-9">
              <input
                type="number"
                class="form-control"
                v-model.number="numeroBusquedaExacta"
                @keyup.enter="buscarSolpeExacta"
                placeholder="Ej: 1234"
              >
            </div>
            <div class="col-12 col-sm-3 d-grid">
              <button class="btn btn-danger" @click="buscarSolpeExacta">
                <span v-if="loadingSearch" class="spinner-border spinner-border-sm me-2"></span>
                Buscar
              </button>
            </div>
          </div>

          <div v-if="solpeEncontrada" class="alert alert-light d-flex align-items-center mt-3">
            <div class="me-auto">
              <div class="fw-semibold">Resultado: SOLPED #{{ solpeEncontrada.numero_solpe ?? '—' }}</div>
              <div class="small text-secondary">
                {{ solpeEncontrada.empresa || '—' }} · {{ solpeEncontrada.nombre_centro_costo || '—' }} · {{ prettyFecha(solpeEncontrada.fecha) }}
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" @click="goSolpedDetalle(solpeEncontrada)">Ver detalle</button>
              <button class="btn btn-sm btn-outline-secondary" @click="expandEncontrada">Expandir aquí</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Chips filtros activos -->
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2" v-if="hasActiveFilters">
        <small class="text-secondary">Filtros:</small>

        <span v-if="filtroFecha" class="badge bg-light text-dark border">
          Fecha: {{ filtroFecha }}
          <button class="btn-close btn-close-white ms-2 small" @click="filtroFecha=''; applyFilters()"></button>
        </span>

        <span v-for="s in filtroEstatus" :key="'es-'+s" class="badge bg-light text-dark border">
          {{ s }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeEstatus(s)"></button>
        </span>

        <span v-for="u in filtroUsuario" :key="'u-'+u" class="badge bg-light text-dark border">
          {{ u }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeUsuario(u)"></button>
        </span>

        <!-- Centros -->
        <span v-for="c in selectedCentros" :key="'c-'+c" class="badge bg-light text-dark border">
          {{ centrosMap[c] || c }}
          <button class="btn-close btn-close-white ms-2 small" @click="removeContrato(c)"></button>
        </span>

        <!-- Flags -->
        <span v-if="onlyMine" class="badge bg-light text-dark border">
          Sólo mis SOLPED
          <button class="btn-close btn-close-white ms-2 small" @click="toggleOnlyMine(false)"></button>
        </span>
        <span v-if="onlyDirectedToMe" class="badge bg-light text-dark border">
          Dirigidas a mí
          <button class="btn-close btn-close-white ms-2 small" @click="toggleOnlyDirected(false)"></button>
        </span>

        <button class="btn btn-link btn-sm ps-0" @click="limpiarFiltros">Limpiar todo</button>
      </div>

      <!-- Segmento por empresa -->
      <div class="mb-3">
        <div class="btn-group flex-wrap">
          <button class="btn btn-sm" :class="empresaSegmento==='todas' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('todas')">Todas</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Mining' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Mining')">⛏ Mining</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Servicio' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Servicio')">🛠 Servicios</button>
          <button class="btn btn-sm" :class="empresaSegmento==='Xtreme Hormigones' ? 'btn-primary' : 'btn-outline-primary'" @click="setEmpresaSeg('Xtreme Hormigones')">🧱 Hormigones</button>
        </div>
      </div>

      <div class="row">
        <!-- Listado -->
        <div class="col-12" :class="showSidebar ? 'col-lg-9' : 'col-lg-12'">
          <div v-if="loading" class="loading-global">
            <div class="spinner-border me-2" role="status" aria-hidden="true"></div>
            Cargando SOLPED…
          </div>

          <template v-else>
            <!-- Paginación superior pegajosa -->
            <nav v-if="totalPages > 1" class="mt-3 sticky-pager">
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
                <span v-if="clientCentrosOverflow || clientUsuariosOverflow" class="text-muted">(parte del filtro se aplica en esta página)</span>
              </div>
            </nav>

            <div v-for="(lista, empresa) in agrupadasPaged" :key="empresa" class="mb-3">
              <div class="card border bg-white mb-2">
                <div class="card-body py-2">
                  <i class="bi bi-building me-2"></i>
                  <strong>{{ empresa }}</strong>
                  <span class="text-secondary small ms-2">({{ lista.length }})</span>
                </div>
              </div>

              <div
                v-for="s in lista"
                :key="s.id"
                class="card card-elevated mb-2"
                :class="{'card-unread': hasUnreadForMe(s)}"
              >
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div class="pointer position-relative d-flex align-items-start gap-2" @click="onExpandCard(s)" style="flex:1;">
                    <div class="flex-grow-1">
                      <div class="fw-semibold text-truncate">📄 SOLPED #{{ s.numero_solpe }}</div>
                      <div class="small text-secondary">
                        <span class="d-block d-md-inline">
                          Fecha: {{ prettyFecha(s.fecha) }} ·
                          Contrato: {{ s.nombre_centro_costo }} ·
                          Tipo: {{ s.tipo_solped }} ·
                          Nombre: {{ s.nombre_solped }}
                        </span>
                        <br class="d-none d-md-block">
                        <span class="badge rounded-pill bg-dark me-2">Creador: {{ s.usuario || '—' }}</span>
                        <template v-if="chipsDirigidoA(s).length">
                          <span class="me-1 d-none d-sm-inline">Cotizador :</span>
                          <span
                            v-for="(p,idx) in chipsDirigidoA(s)"
                            :key="idx"
                            class="badge rounded-pill bg-primary-subtle text-primary-emphasis me-1"
                          >
                            {{ p }}
                          </span>
                        </template>
                        <span class="badge rounded-pill bg-secondary ms-2" v-if="s.comentarios?.length">💬 {{ s.comentarios.length }}</span>
                      </div>
                      <span v-if="hasUnreadForMe(s)" class="dot-unread" title="Nuevos comentarios"></span>
                    </div>
                  </div>

                  <div class="d-flex align-items-center gap-2">
                    <span class="badge" :style="estadoChipStyle(s)">{{ s.estatus }}</span>

                    <!-- Cambiar estado (Admin/Editor/Aprobador) -->
                    <div v-if="canChangeStatus" class="dropdown">
                      <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        Cambiar estado
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                      <li><button class="dropdown-item" @click="setStatus(s,'Rechazado')">Rechazado</button></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Parcial')">Parcial</button></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Pendiente')">Pendiente</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" @click="setStatus(s,'Completado')">Completado</button></li>
                      </ul>
                    </div>

                    <!-- Copiar SOLPED (sólo Generador) -->
                    <button
                      v-if="isGenerador"
                      class="btn btn-outline-info btn-sm"
                      title="Copiar y editar"
                      @click.stop="copiarSolped(s)"
                    >
                      <i class="bi bi-files"></i>
                    </button>

                    <!-- Editar (sólo Generador dueño, mismo día, <=24h) -->
                    <button
                      v-if="puedeEditarSolped(s)"
                      class="btn btn-sm btn-outline-primary"
                      title="Editar SOLPED (24h desde creación, mismo día)"
                      @click.stop="abrirEditar(s)"
                    >
                      <i class="bi bi-pencil-square"></i>
                      <span class="d-none d-md-inline ms-1">Editar</span>
                    </button>

                    <!-- Descargar Excel -->
                    <button class="btn btn-success btn-sm" @click.stop="descargarExcel(s)" title="Descargar Excel">
                      <i class="bi bi-file-earmark-excel"></i>
                    </button>

                    <!-- Generar OC (solo Editores y dirigida a mí; estatus Pendiente/Parcial) -->
                    <button
                      v-if="isEditor && isDirectedToMe(s) && canGenerateOC(s)"
                      class="btn btn-outline-warning btn-sm"
                      title="Generar OC para esta SOLPED"
                      @click.stop="irAGenerarOC(s)">
                      <i class="bi bi-receipt"></i>
                      <span class="d-none d-md-inline ms-1">Generar OC</span>
                    </button>

                    <button class="btn btn-outline-info btn-sm" @click.stop="goSolpedDetalle(s)" title="Ver detalle">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </div>

                <!-- Detalle expandido -->
                <div v-if="solpeExpandidaId===s.id" class="card-body">
                  <!-- Ítems -->
                  <div class="fw-semibold mb-2">🛠 Ítems asociados</div>
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th>Ítem</th><th>Descripción</th><th>Código</th><th>Cantidad</th>
                          <th>Cant. Cotizada</th><th>N° Interno</th><th>Imagen</th>
                          <th>Estatus</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in (s.items||[])" :key="it.item">
                          <td>{{ it.item }}</td>
                          <td class="w-25">{{ it.descripcion }}</td>
                          <td>{{ it.codigo_referencial }}</td>
                          <td>{{ it.cantidad }}</td>
                          <td>{{ it.cantidad_cotizada || '' }}</td>
                          <td>{{ it.numero_interno }}</td>
                          <td>
                            <template v-if="it.imagen_url || it.imagen_referencia_base64">
                              <img
                                :src="it.imagen_url || toDataURL(it.imagen_referencia_base64)"
                                class="thumb pointer"
                                @click="abrirImagen(it)"
                              >
                              <button class="btn btn-link btn-sm p-0 ms-2" @click="abrirImagenNuevaPestana(it)">ver</button>
                            </template>
                            <span v-else class="text-secondary small">Sin imagen</span>
                          </td>
                          <td>
                            <span class="badge rounded-pill px-3" :style="{background:getBadgeColor(it.estado||'Pendiente'), color:'#fff'}">
                              {{ (it.estado || 'Pendiente') }}
                            </span>
                          </td>
                          <td class="text-end">
                            <div v-if="canChangeStatus" class="dropdown">
                              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">Cambiar ítem</button>
                              <ul class="dropdown-menu dropdown-menu-end">
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'rechazado')">Rechazado</button></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'pendiente')">Pendiente</button></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'revisión')">Revisión</button></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'en bodega')">En bodega</button></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item" @click="setItemStatus(s, it, 'completado')">Completado</button></li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Comentarios -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">💬 Comentarios</label>
                      <small class="text-secondary">{{ (s.comentarios?.length || 0) }} comentario(s)</small>
                    </div>

                    <div v-if="s.comentarios?.length" class="list-group mb-3">
                      <div
                        v-for="(c, idx) in s.comentarios"
                        :key="idx"
                        class="alert-pro list-group-item"
                        :class="{'comment-unread': !(Array.isArray(c?.vistoPor) && c.vistoPor.includes(myUid))}"
                      >
                        <div class="d-flex justify-content-between">
                          <strong>{{ c.usuario || '—' }}</strong>
                          <small class="text-muted">{{ formatDateTime(c.fecha) }}</small>
                        </div>
                        <div class="mt-1">{{ c.texto }}</div>
                      </div>
                    </div>

                    <div class="input-group">
                      <input class="form-control" v-model="s.nuevoComentario" placeholder="Escribe un comentario...">
                      <button class="btn btn-primary" :disabled="!(s.nuevoComentario && s.nuevoComentario.trim())" @click="agregarComentario(s)">Enviar</button>
                    </div>
                  </div>

                  <!-- Cotizaciones vinculadas -->
                  <div class="mt-4">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label mb-0">🧾 Cotizaciones vinculadas</label>
                      <button class="btn btn-sm btn-outline-primary" @click="fetchOCs(s.id)" :disabled="isLoadingOC(s.id)">
                        <span v-if="isLoadingOC(s.id)" class="spinner-border spinner-border-sm me-1"></span>
                        {{ ocListFor(s.id).length ? 'Actualizar' : 'Cargar' }}
                      </button>
                    </div>

                    <div v-if="isLoadingOC(s.id)" class="text-secondary small">Buscando…</div>
                    <div v-else-if="ocListFor(s.id).length === 0" class="text-secondary small">No hay cotizaciones vinculadas.</div>

                    <div v-else class="list-group">
                      <div v-for="oc in ocListFor(s.id)" :key="oc.__docId" class="list-group-item d-flex align-items-center">
                        <div class="me-auto">
                          <div class="d-flex align-items-center gap-2">
                            <strong>Cotización N° {{ oc.id ?? '—' }}</strong>
                            <span class="badge" :class="estadoChipOC(oc.estatus)">{{ oc.estatus || '—' }}</span>
                          </div>
                          <div class="small text-secondary mt-1">
                            <strong>Total:</strong> {{ fmtMonedaOC(oc.precioTotalConIVA, oc.moneda) }} ·
                            <strong>Moneda:</strong> {{ oc.moneda || '—' }} ·
                            <strong>Responsable:</strong> {{ oc.responsable || '—' }}
                          </div>
                        </div>
                        <div class="ms-2">
                          <button class="btn btn-sm btn-outline-primary" @click.stop="goOC(oc)">Ver detalle</button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div> <!-- /card-body -->
              </div>
            </div>

            <!-- Vacío -->
            <div v-if="displayList.length===0" class="ghost-wrap">
              <div class="ghost">
                <div class="ghost-eyes"></div>
                <div class="ghost-bottom">
                  <div></div><div></div><div></div><div></div>
                </div>
              </div>
              <p class="ghost-text">No hay SOLPED con los filtros aplicados.</p>
            </div>

          </template>
        </div>

        <!-- Sidebar filtros (sticky en desktop) -->
        <aside v-if="showSidebar" class="col-12 col-lg-3 d-none d-lg-block">
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
                <label class="form-label">Fecha</label>
                <input type="date" class="form-control" v-model="filtroFecha">
              </div>

              <div class="mb-3">
                <label class="form-label">Estado</label>
                <select class="form-select" multiple v-model="filtroEstatus">
                  <option v-for="s in listaEstatus" :key="s" :value="s">{{ s }}</option>
                </select>
                <small class="text-secondary">Puedes seleccionar varios (máx. 10).</small>
              </div>

              <!-- Centros -->
              <div class="mb-3">
                <label class="form-label">Centro de costo (código)</label>
                <input class="form-control mb-2" v-model="centroPickerSearch" placeholder="Buscar código o nombre…">
                <div class="border rounded p-2" style="max-height: 220px; overflow:auto;">
                  <div class="form-check" v-for="code in centrosFiltrados" :key="code">
                    <input class="form-check-input" type="checkbox"
                           :id="'cc_'+code"
                           :checked="selectedCentrosSet.has(code)"
                           @change="toggleCentro(code)">
                    <label class="form-check-label" :for="'cc_'+code">
                      <strong>{{ code }}</strong> — {{ centrosMap[code] }}
                    </label>
                  </div>
                </div>
                <small class="text-secondary d-block mt-1">Puedes seleccionar varios (máx. 10).</small>
              </div>

              <!-- Usuario (generador) -->
              <div class="mb-1 d-flex align-items-center justify-content-between">
                <label class="form-label mb-0">Usuario (Generador)</label>
                <small v-if="tempUsuarioSelSet.size" class="text-secondary">{{ tempUsuarioSelSet.size }} seleccionados</small>
              </div>
              <div class="input-group mb-2">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control" placeholder="Buscar nombre" v-model="busquedaUsuario">
              </div>
              <div class="border rounded p-2 mb-3" style="max-height: 220px; overflow:auto;">
                <div class="form-check" v-for="u in usuariosOrdenadosFiltrados" :key="u.id">
                  <input class="form-check-input" type="checkbox"
                         :id="'u_'+u.id"
                         :checked="tempUsuarioSelSet.has(u.fullName)"
                         @change="toggleTempUsuario(u.fullName)">
                  <label class="form-check-label" :for="'u_'+u.id">{{ u.fullName }}</label>
                </div>
              </div>

              <!-- Flags -->
              <div class="mb-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="chkOnlyMine"
                         :checked="onlyMine"
                         @change="toggleOnlyMine($event.target.checked)">
                  <label class="form-check-label" for="chkOnlyMine">Ver sólo mis SOLPED</label>
                </div>
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" id="chkOnlyDirected"
                         :checked="onlyDirectedToMe"
                         @change="toggleOnlyDirected($event.target.checked)">
                  <label class="form-check-label" for="chkOnlyDirected">Ver sólo dirigidas a mí</label>
                </div>
                <small class="text-secondary d-block mt-1">Estas opciones se guardan sólo si las marcas.</small>
              </div>

              <div class="mb-0">
                <label class="form-label">Tamaño de página</label>
                <select class="form-select" v-model.number="pageSize" @change="applyFilters">
                  <option v-for="n in [10,20,30,40,50]" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Botón flotante filtros (móvil) -->
    <button
      class="btn btn-primary floating-filters-btn d-lg-none"
      @click="toggleSidebar"
      :title="showSidebar ? 'Ocultar filtros' : 'Mostrar filtros'"
    >
      <i class="bi bi-funnel"></i>
    </button>

    <!-- Toasts -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>

    <!-- Modal imagen -->
    <div v-if="showImgModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,.6);">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">Vista previa de imagen</h5>
            <button class="btn-close" @click="showImgModal=false"></button>
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

    <!-- ========= MODAL EDICIÓN SOLPED ========= -->
    <div v-if="showEditModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,.55);">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Editar SOLPED #{{ editForm.numero_solpe }}
              <span class="badge bg-secondary ms-2">{{ editForm.empresa || '—' }}</span>
            </h5>
            <button class="btn-close" @click="cerrarEditar"></button>
          </div>

          <div class="modal-body">
            <div class="row g-3">
              <!-- Empresa -->
              <div class="col-12 col-md-4">
                <label class="form-label">Empresa</label>
                <select class="form-select" v-model="editForm.empresa">
                  <option value="Xtreme Servicio">Xtreme Servicio</option>
                  <option value="Xtreme Mining">Xtreme Mining</option>
                  <option value="Xtreme Hormigones">Xtreme Hormigones</option>
                </select>
              </div>

              <!-- Tipo SOLPED -->
              <div class="col-12 col-md-4">
                <label class="form-label">Tipo SOLPED</label>
                <select class="form-select" v-model="editForm.tipo_solped">
                  <option v-for="t in tiposSolped" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>

              <!-- Número SOLPED (solo lectura) -->
              <div class="col-12 col-md-4">
                <label class="form-label">N° SOLPED</label>
                <input class="form-control" :value="editForm.numero_solpe" disabled>
              </div>

              <!-- Centro de costo -->
              <div class="col-12 col-md-4">
                <label class="form-label">Centro de costo (código)</label>
                <select class="form-select" v-model="editForm.numero_contrato">
                  <option v-for="code in centrosListaOrdenada" :key="code" :value="code">
                    {{ code }} — {{ centrosMap[code] }}
                  </option>
                </select>
              </div>
              <div class="col-12 col-md-8">
                <label class="form-label">Nombre Centro de Costo</label>
                <input class="form-control" v-model="editForm.nombre_centro_costo" placeholder="Se autocompleta desde el código">
              </div>

              <!-- Nombre SOLPED -->
              <div class="col-12">
                <label class="form-label">Nombre SOLPED</label>
                <input class="form-control" v-model="editForm.nombre_solped" maxlength="140">
              </div>

              <!-- Dirigido a (por empresa) -->
              <div class="col-12">
                <label class="form-label">Dirigido a (cotizadores)</label>
                <select class="form-select" multiple v-model="dirigidoASelected" size="6">
                  <option v-for="name in dirigidoOptions" :key="name" :value="name">{{ name }}</option>
                </select>
                <div class="form-text">Mantén Ctrl/⌘ para seleccionar varias personas.</div>
              </div>

              <!-- Ítems -->
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
                        <th style="width:140px;">Código ref.</th>
                        <th style="width:110px;">Cantidad</th>
                        <th style="width:120px;">N° Interno</th>
                        <th style="width:120px;">Stock</th>
                        <th style="width:140px;">Imagen</th>
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
                        <td><input class="form-control form-control-sm" type="number" min="0" v-model.number="it.stock"></td>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <input type="file" accept="image/*" class="form-control form-control-sm" @change="onPickImg($event, it)">
                            <template v-if="it.imagen_referencia_base64 || it.imagen_url">
                              <button class="btn btn-sm btn-outline-danger" @click="borrarImg(it)">Quitar</button>
                            </template>
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

            </div><!-- row -->
          </div><!-- body -->

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="cerrarEditar">Cancelar</button>
            <button class="btn btn-primary" :disabled="savingEdit" @click="guardarEdicion">
              <span v-if="savingEdit" class="spinner-border spinner-border-sm me-2"></span>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div><!-- /MODAL -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, limit, startAfter, onSnapshot, getDocs, getCountFromServer, doc, getDoc, updateDoc, addDoc, setDoc
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';
import * as XLSX from 'xlsx-js-style';

const router = useRouter();
const auth = useAuthStore();
const volver = () => router.back();

/* ========= Rol / permisos ========= */
const rawRole = computed(() => String(auth?.profile?.role || auth?.profile?.rol || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''));
const isAdmin = computed(() => rawRole.value.includes('admin'));
const isEditor = computed(() => rawRole.value.includes('editor'));
const isAprobador = computed(() => rawRole.value.includes('aprobador'));
const isGenerador = computed(() => rawRole.value.includes('generador'));
const canChangeStatus = computed(() => isAdmin.value || isEditor.value || isAprobador.value);

const error = ref('');
const loading = ref(true);
const loadingSearch = ref(false);

const showSidebar = ref(true);
const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };

/* ========= Buscador exacto ========= */
const numeroBusquedaExacta = ref(null);
const solpeEncontrada = ref(null);
const buscarSolpeExacta = async () => {
  solpeEncontrada.value = null;
  const n = Number(numeroBusquedaExacta.value || 0);
  if (!n) return;
  loadingSearch.value = true;
  try {
    const qy = query(collection(db, 'solpes'), where('numero_solpe','==', n), limit(1));
    const snap = await getDocs(qy);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data() || {};
      data.comentarios = (Array.isArray(data.comentarios) ? data.comentarios : []).map(c => ({
        ...c,
        fecha: c?.fecha?.toDate ? c.fecha.toDate() : (c?.fecha ? new Date(c.fecha) : null),
        vistoPor: Array.isArray(c?.vistoPor) ? c.vistoPor : []
      }));
      solpeEncontrada.value = { id: d.id, ...data };
    }
  } catch (e) {
    console.error(e);
    error.value = 'No se pudo realizar la búsqueda.';
  } finally {
    loadingSearch.value = false;
  }
};
const expandEncontrada = () => {
  if (!solpeEncontrada.value) return;
  pageDocs.value = [solpeEncontrada.value];
  totalCount.value = 1;
  page.value = 1;
  solpeEncontrada.value = { ...solpeEncontrada.value };
  solpeExpandidaId.value = solpeEncontrada.value.id;
};
const goSolpedDetalle = (s) => {
  if (!s?.id) return;
  router.push({ name: 'SolpedDetalle', params: { id: s.id } });
};

/* ========= Identidad ========= */
const myUid = computed(() => (auth?.user?.uid || '').toString());
const myEmail = computed(() => (auth?.user?.email || '').toLowerCase());
const myFullName = ref('');

/* ========= Filtros ========= */
const filtroFecha = ref('');
const filtroEstatus = ref([]);
const filtroUsuario = ref([]);
const onlyDirectedToMe = ref(false);
const onlyMine = ref(false);
const empresaSegmento = ref('todas');

const LS_ONLY_DIRECTED = 'historial_only_directed';
const LS_ONLY_MINE = 'historial_only_mine';

const toggleOnlyDirected = (val) => {
  onlyDirectedToMe.value = !!val;
  try { localStorage.setItem(LS_ONLY_DIRECTED, onlyDirectedToMe.value ? '1' : '0'); } catch(e){console.error(e)}
  applyFilters();
};
const toggleOnlyMine = (val) => {
  onlyMine.value = !!val;
  try { localStorage.setItem(LS_ONLY_MINE, onlyMine.value ? '1' : '0'); } catch(e){console.error(e)}
  applyFilters();
};

const hasActiveFilters = computed(() =>
  !!filtroFecha.value || filtroEstatus.value.length || filtroUsuario.value.length ||
  onlyDirectedToMe.value || onlyMine.value || empresaSegmento.value !== 'todas' || selectedCentros.value.length > 0
);

/* ========= Centros de costo: DB + fallback ========= */
const centrosMap = ref({}); // codigo -> nombre
const centrosLocalFallback = {
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
async function loadCentrosCosto() {
  try {
    const qy = query(collection(db,'centros_costo')); // espera campos: codigo, nombre
    const snap = await getDocs(qy);
    if (!snap.empty) {
      const map = {};
      snap.docs.forEach(d => {
        const { codigo, nombre } = d.data() || {};
        if (codigo && nombre) map[String(codigo)] = String(nombre);
      });
      centrosMap.value = Object.keys(map).length ? map : centrosLocalFallback;
    } else {
      centrosMap.value = centrosLocalFallback;
    }
  } catch {
    centrosMap.value = centrosLocalFallback;
  }
}

/* ========= Centros selección UI ========= */
const selectedCentros = ref([]);
const selectedCentrosSet = computed(() => new Set(selectedCentros.value));
const centroPickerSearch = ref('');
const centrosListaOrdenada = computed(() =>
  Object.keys(centrosMap.value).sort((a,b)=> (centrosMap.value[a]||'').localeCompare(centrosMap.value[b]||'es',{sensitivity:'base'}))
);
const centrosFiltrados = computed(() => {
  const q = centroPickerSearch.value.trim().toLowerCase();
  if (!q) return centrosListaOrdenada.value;
  return centrosListaOrdenada.value.filter(code =>
    code.toLowerCase().includes(q) || String(centrosMap.value[code]||'').toLowerCase().includes(q)
  );
});
const toggleCentro = (code) => {
  const set = new Set(selectedCentros.value);
  set.has(code) ? set.delete(code) : set.add(code);
  selectedCentros.value = Array.from(set);
  applyFilters();
};
const removeContrato = (code) => { selectedCentros.value = selectedCentros.value.filter(x => x!==code); applyFilters(); };
const clientCentrosOverflow = computed(()=> selectedCentros.value.length > 10);

/* ========= Usuarios (generadores) ========= */
const listaUsuarios = ref([]);
const busquedaUsuario = ref('');
const tempUsuarioSelSet = ref(new Set());
const clientUsuariosOverflow = computed(()=> tempUsuarioSelSet.value.size > 10 || filtroUsuario.value.length > 10);

const normalizeText = (v='') => v.toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
const usuariosOrdenadosFiltrados = computed(() => {
  const q = normalizeText(busquedaUsuario.value);
  return (listaUsuarios.value||[])
    .slice()
    .sort((a,b)=>a.fullName.localeCompare(b.fullName,'es',{sensitivity:'base'}))
    .filter(u => !q || normalizeText(u.fullName).includes(q));
});
const toggleTempUsuario = (fullName) => { const s = tempUsuarioSelSet.value; s.has(fullName) ? s.delete(fullName) : s.add(fullName); };

/* ========= Paginación ========= */
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const pageFrom = computed(() => totalCount.value ? (page.value-1)*pageSize.value + 1 : 0);
const pageTo = computed(() => Math.min(totalCount.value, page.value*pageSize.value));
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

/* ========= Datos en vivo de la página ========= */
const pageDocs = ref([]);
const displayList = computed(() => applyClientFilters(pageDocs.value));
const agruparPorEmpresa = (arr=[]) => {
  const out = {};
  (arr||[]).forEach(s => {
    const k = s?.empresa || 'Sin Empresa';
    if (!Array.isArray(out[k])) out[k] = [];
    out[k].push(s);
  });
  return out;
};
const agrupadasPaged = computed(() => agruparPorEmpresa(displayList.value));

const cursors = ref({});
let unsubscribe = null;
const savedScrollY = ref(0);

/* ========= Listas auxiliares ========= */
const listaEstatus = [
  'Completado','Rechazado','Solicitado','Pendiente','Preaprobado',
  'OC enviada a proveedor','Parcial'
];

/* ========= Helpers ========= */
const prettyFecha = (f) => {
  try {
    if (f?.toDate) return f.toDate().toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
    if (typeof f === 'string') return new Date(f).toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
    if (f instanceof Date) return f.toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
  } catch(e) {console.error(e)}
  return '—';
};
const toDataURL = (base) => `data:image/jpeg;base64,${base}`;
const formatDateTime = (d) => {
  const dd = (d instanceof Date) ? d : new Date(d);
  return isNaN(dd) ? '' : dd.toLocaleString('es-CL',{dateStyle:'medium', timeStyle:'short'});
};
const diasDesde = (f) => {
  let d=null; if (f?.toDate) d=f.toDate(); else if (f instanceof Date) d=f; else if (typeof f==='string') d=new Date(f);
  if (!d || isNaN(d)) return -1;
  const hoy = new Date();
  const a = new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()).getTime();
  const b = new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
  return Math.floor((a-b)/(1000*60*60*24));
};
const getColorByStatus = (estatus) => {
  const e = (estatus||'').toString().toLowerCase();
  switch(e){
    case 'completado': return '#28a745';
    case 'rechazado': return '#dc3545';
    case 'pendiente': return '#fd7e14';
    case 'revisión': return '#007bff';
    case 'parcial': return '#fd7e14';
    case 'preaprobado': return '#ffc107';
    case 'oc enviada a proveedor': return '#17a2b8';
    default: return '#6c757d';
  }
};
const estadoChipStyle = (s) => {
  const est = (s?.estatus || '').toLowerCase();
  if (est === 'pendiente') {
    const d = diasDesde(s?.fecha);
    const bg = (d >= 7) ? '#f8bbd0' : '#fd7e14';
    return { background: bg, color: '#fff', padding: '4px 10px', fontWeight: 'bold' };
  }
  return { background: getColorByStatus(s?.estatus), color: '#fff', padding: '4px 10px', fontWeight: 'bold' };
};
const getBadgeColor = (estatus) => getColorByStatus(estatus);

/* ========= Dirigido a mí ========= */
const chipsDirigidoA = (s) => {
  const out = [];
  if (Array.isArray(s.dirigidoA)) {
    s.dirigidoA.forEach(x=>{
      if (typeof x === 'string') out.push(x);
      else if (x && typeof x === 'object') out.push(x.fullName || x.nombre || x.email || x.uid || '');
    });
  }
  if (Array.isArray(s.dirigidoA_emails)) out.push(...s.dirigidoA_emails);
  return Array.from(new Set(out.filter(Boolean)));
};
const isDirectedToMe = (s) => {
  const name = (myFullName.value || '').toLowerCase();
  const uid = (myUid.value || '').toLowerCase();
  const email = (myEmail.value || '').toLowerCase();
  const arr = Array.isArray(s.dirigidoA) ? s.dirigidoA : [];
  const byGeneric = arr.some(x=>{
    if (typeof x === 'string'){
      const xs=x.toLowerCase();
      return (name&&xs===name)||(email&&xs===email)||(uid&&xs===uid);
    }
    if (x && typeof x === 'object'){
      const xu=(x.uid||x.id||'').toString().toLowerCase();
      const xe=(x.email||x.correo||'').toString().toLowerCase();
      const xn=(x.fullName||x.nombre||'').toString().toLowerCase();
      return (uid&&xu===uid)||(email&&xe===email)||(name&&xn===name);
    }
    return false;
  });
  const byUidArr = (Array.isArray(s.dirigidoA_uids) && uid) ? s.dirigidoA_uids.map(v=>String(v).toLowerCase()).includes(uid) : false;
  const byEmailArr = (Array.isArray(s.dirigidoA_emails) && email) ? s.dirigidoA_emails.map(v=>String(v).toLowerCase()).includes(email) : false;
  return byGeneric || byUidArr || byEmailArr;
};
const hasUnreadForMe = (s) => {
  const uid = myUid.value;
  if (!uid) return false;
  const arr = Array.isArray(s.comentarios) ? s.comentarios : [];
  return arr.some(c => !Array.isArray(c?.vistoPor) || !c.vistoPor.includes(uid));
};

/* ========= Query builder ========= */
const buildWhere = () => {
  const wh = [];

  if (empresaSegmento.value !== 'todas') wh.push(where('empresa','==',empresaSegmento.value));

  if (filtroEstatus.value.length === 1) wh.push(where('estatus','==',filtroEstatus.value[0]));
  else if (filtroEstatus.value.length > 1) wh.push(where('estatus','in', filtroEstatus.value.slice(0,10)));

  if (filtroFecha.value) {
    try {
      const start = new Date(`${filtroFecha.value}T00:00:00`);
      const end   = new Date(`${filtroFecha.value}T23:59:59.999`);
      wh.push(where('fecha','>=',start));
      wh.push(where('fecha','<=',end));
    } catch(e) {console.error(e)}
  }

  if (onlyMine.value && myFullName.value) {
    wh.push(where('usuario','==', myFullName.value));
  }

  // Centros (server 1..10; client >10)
  if (selectedCentros.value.length === 1) {
    wh.push(where('numero_contrato','==', selectedCentros.value[0]));
  } else if (selectedCentros.value.length >=2 && selectedCentros.value.length <=10) {
    wh.push(where('numero_contrato','in', selectedCentros.value));
  }

  // Usuarios (server hasta 10)
  if (filtroUsuario.value.length === 1) {
    wh.push(where('usuario','==', filtroUsuario.value[0]));
  } else if (filtroUsuario.value.length >=2 && filtroUsuario.value.length <=10) {
    wh.push(where('usuario','in', filtroUsuario.value));
  }

  // onlyDirectedToMe -> filtro en cliente
  return wh;
};

const makePageQuery = (pageNumber=1) => {
  const wh = buildWhere();
  const base = query(
    collection(db, 'solpes'),
    ...wh,
    orderBy('numero_solpe','desc'),
    limit(pageSize.value)
  );
  if (pageNumber > 1 && cursors.value[pageNumber - 1]) {
    return query(base, startAfter(cursors.value[pageNumber - 1]));
  }
  return base;
};

/* ========= Suscripción + conteo ========= */
const subscribePage = () => {
  if (typeof unsubscribe === 'function') { unsubscribe(); unsubscribe = null; }
  loading.value = true;

  const qy = makePageQuery(page.value);
  unsubscribe = onSnapshot(qy, async (snap) => {
    let docs = snap.docs.map(d => {
      const data = d.data() || {};
      const comentarios = Array.isArray(data.comentarios) ? data.comentarios.map(c => ({
        ...c,
        fecha: c?.fecha?.toDate ? c.fecha.toDate() : (c?.fecha ? new Date(c.fecha) : null),
        vistoPor: Array.isArray(c?.vistoPor) ? c.vistoPor : []
      })) : [];
      return { id: d.id, ...data, comentarios };
    });

    // filtros cliente
    if (onlyMine.value && myFullName.value) {
      docs = docs.filter(s => String(s.usuario||'').trim() === myFullName.value);
    }
    if (onlyDirectedToMe.value) docs = docs.filter(isDirectedToMe);
    if (clientCentrosOverflow.value) {
      const set = new Set(selectedCentros.value);
      docs = docs.filter(s => set.has(s.numero_contrato));
    }
    if (clientUsuariosOverflow.value) {
      const setU = new Set(filtroUsuario.value.length ? filtroUsuario.value : Array.from(tempUsuarioSelSet.value));
      if (setU.size) docs = docs.filter(s => setU.has(s.usuario));
    }

    pageDocs.value = docs;

    const last = snap.docs[snap.docs.length - 1] || null;
    cursors.value[page.value] = last || null;

    loading.value = false;

    await nextTick();
    window.scrollTo(0, savedScrollY.value);
  }, (e) => {
    console.error(e);
    error.value = 'No se pudieron cargar las SOLPED de la página.';
    loading.value = false;
  });
};

const refreshCount = async () => {
  try {
    const wh = buildWhere();
    const countQ = query(collection(db, 'solpes'), ...wh);
    const res = await getCountFromServer(countQ);
    totalCount.value = res.data().count || 0;
  } catch (e) {
    console.error('count error', e);
    totalCount.value = Math.max(totalCount.value || 0, pageDocs.value.length);
  }
};

/* ========= Filtros cliente adicionales ========= */
function applyClientFilters(arr){
  let out = Array.isArray(arr) ? arr : [];
  return out;
}

/* ========= Usuarios (carga) ========= */
const loadUsuarios = async () => {
  try {
    const snap = await getDocs(query(collection(db,'Usuarios')));
    const raw = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }));
    const isGenerator = (u) =>
      (u.role && String(u.role).toLowerCase() === 'generador solped') ||
      (Array.isArray(u.roles) && u.roles.map(r=>String(r).toLowerCase()).includes('generador solped'));
    listaUsuarios.value = raw.filter(u => u.fullName && isGenerator(u))
      .map(u => ({ id: u.id, fullName: u.fullName }));

    const me = snap.docs.find(d => d.id === myUid.value);
    myFullName.value = me?.data()?.fullName || auth?.user?.displayName || '';
  } catch {
    myFullName.value = auth?.user?.displayName || '';
  }
};

/* ========= Acciones ========= */
const applyFilters = () => {
  filtroUsuario.value = Array.from(tempUsuarioSelSet.value);
  page.value = 1;
  cursors.value = {};
  savedScrollY.value = window.scrollY;
  subscribePage();
  refreshCount();
};
const limpiarFiltros = () => {
  filtroFecha.value = '';
  filtroEstatus.value = [];
  filtroUsuario.value = [];
  tempUsuarioSelSet.value.clear();
  selectedCentros.value = [];
  centroPickerSearch.value = '';
  onlyDirectedToMe.value = false;
  onlyMine.value = false;
  empresaSegmento.value = 'todas';
  pageSize.value = 10;
  try {
    localStorage.setItem(LS_ONLY_DIRECTED, '0');
    localStorage.setItem(LS_ONLY_MINE, '0');
  } catch(e){console.error(e)}
  applyFilters();
};
const removeEstatus = (s) => { filtroEstatus.value = filtroEstatus.value.filter(x=>x!==s); applyFilters(); };
const removeUsuario = (u) => { filtroUsuario.value = filtroUsuario.value.filter(x=>x!==u); tempUsuarioSelSet.value.delete(u); applyFilters(); };
const setEmpresaSeg = (v) => { empresaSegmento.value = v; applyFilters(); };

/* ========= Paginación ========= */
const goPage = (p) => {
  if (p < 1) p = 1;
  if (p > totalPages.value) p = totalPages.value;
  savedScrollY.value = window.scrollY;
  page.value = p;
  subscribePage();
};
const nextPage = () => goPage(page.value + 1);
const prevPage = () => goPage(page.value - 1);

/* ========= Copiar SOLPED ========= */
const copiarSolped = (s) => {
  try {
    const draft = {
      empresa: s.empresa || '',
      numero_contrato: s.numero_contrato || '',
      nombre_centro_costo: s.nombre_centro_costo || '',
      tipo_solped: s.tipo_solped || '',
      nombre_solped: s.nombre_solped || '',
      observaciones: s.observaciones || '',
      dirigidoA: s.dirigidoA || [],
      dirigidoA_emails: s.dirigidoA_emails || [],
      items: (s.items || []).map(it => ({
        item: it.item,
        descripcion: it.descripcion || '',
        codigo_referencial: it.codigo_referencial || '',
        cantidad: it.cantidad || 1,
        cantidad_cotizada: it.cantidad_cotizada || '',
        numero_interno: it.numero_interno || '',
        imagen_url: it.imagen_url || '',
      })),
      __origen: { id:s.id, numero_solpe:s.numero_solpe }
    };
    sessionStorage.setItem('solped_draft', JSON.stringify(draft));
    addToast('success', 'Borrador copiado. Abriendo creador de SOLPED…');
    router.push({ name: 'solped', query: { draft: '1' } });
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo copiar la SOLPED.');
  }
};

/* ========= Generar OC ========= */
const irAGenerarOC = (s) => {
  const q = { fromSolpedId: s.id };
  try {
    router.push({ name: 'GeneradorOC', query: q });
  } catch (e) {
    console.error(e);
    router.push({ path: '/generar-oc', query: q });
  }
};
const canGenerateOC = (s) => {
  const st = (s?.estatus || '').toString().trim().toLowerCase();
  return st === 'pendiente' || st === 'parcial';
};

/* ========= Comentarios y estados ========= */
const agregarComentario = async (s) => {
  const texto = (s.nuevoComentario || '').trim();
  if (!texto) { addToast('danger','Debes ingresar un comentario.'); return; }
  try {
    const usuario = myFullName.value || auth?.user?.displayName || auth?.user?.email || 'Anónimo';
    const refd = doc(db, 'solpes', s.id);
    const snap = await getDoc(refd);
    const data = snap.data() || {};
    const curr = Array.isArray(data.comentarios) ? data.comentarios : [];
    curr.push({ texto, fecha: new Date(), usuario, vistoPor: [myUid.value].filter(Boolean) });
    await setDoc(refd, { comentarios: curr }, { merge: true });
    s.comentarios = curr;
    s.nuevoComentario = '';
    addToast('success','Comentario agregado');
  } catch (e) {
    console.error(e); addToast('danger','Error al guardar el comentario.');
  }
};
const setStatus = async (s, estatus) => {
  if (!canChangeStatus.value) return;
  try {
    const refd = doc(db, 'solpes', s.id);
    if (estatus === 'Completado') {
      const itemsUpd = (s.items || []).map(it => ({ ...it, estado: 'completado' }));
      await updateDoc(refd, { estatus, items: itemsUpd });
      s.items = itemsUpd;
    } else {
      await updateDoc(refd, { estatus });
    }
    await addDoc(collection(db, 'solpes', s.id, 'historialEstados'), { fecha: new Date(), estatus, usuario: myFullName.value || '—' });
    s.estatus = estatus;
    addToast('success', `SOLPED #${s.numero_solpe} → "${estatus}"`);
  } catch (e) { console.error(e); addToast('danger','Error al actualizar estatus.'); }
};
const setItemStatus = async (solpe, item, nuevo) => {
  if (!canChangeStatus.value) return;
  try {
    const refd = doc(db, 'solpes', solpe.id);
    const itemsUpd = (solpe.items || []).map(it => (String(it.item)===String(item.item)) ? { ...it, estado: nuevo } : it);
    await updateDoc(refd, { items: itemsUpd });
    solpe.items = itemsUpd;
    addToast('success', `Ítem ${item.item} → ${nuevo}`);
  } catch (e) { console.error(e); addToast('danger','No se pudo cambiar el estado del ítem.'); }
};

/* ========= OC vinculadas ========= */
const ocBySolped = ref({});
const ocLoadingSet = ref(new Set());
const isLoadingOC = (id) => ocLoadingSet.value.has(id);
const ocListFor = (id) => ocBySolped.value[id] || [];
const fetchOCs = async (solpedId) => {
  if (!solpedId) return;
  ocLoadingSet.value.add(solpedId);
  try {
    let arr=[];
    try{
      const qy = query(collection(db,'ordenes_oc'), where('solpedId','==', solpedId), orderBy('fechaSubida','desc'));
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
    }catch(e){
      console.error(e)
      const qy = query(collection(db,'ordenes_oc'), where('solpedId','==', solpedId));
      const snap = await getDocs(qy);
      arr = snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
      arr.sort((a,b)=> (b?.fechaSubida?.toMillis?.() ?? 0) - (a?.fechaSubida?.toMillis?.() ?? 0));
    }
    ocBySolped.value = { ...ocBySolped.value, [solpedId]: arr };
  } finally {
    ocLoadingSet.value.delete(solpedId);
  }
};
const goOC = (oc) => router.push({ name: 'oc-detalle', params: { id: oc.__docId } });
const fmtMonedaOC = (n, c='CLP') => {
  const v = Number(n || 0);
  try { return v.toLocaleString('es-CL', { style:'currency', currency:c, minimumFractionDigits:0 }); }
  catch { return `${c} ${v.toLocaleString('es-CL')}`; }
};
const estadoChipOC = (estatus) => {
  const s = (estatus || '').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('preaprob')) return 'bg-info-subtle text-info-emphasis';
  if (s.includes('escala') || s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('proveedor') || s.includes('enviada')) return 'bg-primary-subtle text-primary-emphasis';
  if (s.includes('revisión') || s.includes('revision')) return 'bg-warning-subtle text-warning-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};

/* ========= Imagen: modal / pestaña nueva ========= */
const showImgModal = ref(false);
const previewImgSrc = ref('');
const abrirImagen = (it) => {
  const url = it?.imagen_url || (it?.imagen_referencia_base64 ? toDataURL(it.imagen_referencia_base64) : '');
  if (!url) return;
  previewImgSrc.value = url;
  showImgModal.value = true;
};
const abrirImagenNuevaPestana = (it) => {
  const url = it?.imagen_url || (it?.imagen_referencia_base64 ? toDataURL(it.imagen_referencia_base64) : '');
  if (!url) return;
  window.open(url, '_blank', 'noopener');
};

/* ========= Excel ========= */
const setStyle = (ws, addr, s) => { if (!ws[addr]) ws[addr] = { t:'s', v:'' }; ws[addr].s = { ...(ws[addr].s||{}), ...s }; };
const styleCell = (ws, r, c, s) => { const addr = XLSX.utils.encode_cell({ r, c }); setStyle(ws, addr, s); };
const descargarExcel = (solpe) => {
  try{
    const data=[]; const empresasSet=new Set();
    const titulo=`SOLPED #${solpe.numero_solpe || ''}`;
    data.push([titulo]);
    data.push(['Solicitante:', solpe.usuario ?? '']);
    data.push(['Fecha:', prettyFecha(solpe.fecha) ?? '']);
    data.push(['N° Contrato:', solpe.numero_contrato ?? '']);
    data.push(['Empresa:', solpe.empresa ?? '']); data.push([]);

    (solpe.items||[]).forEach(it => (it.comparaciones||[]).forEach(c => { if (c?.empresa) empresasSet.add(String(c.empresa).toUpperCase()); }));
    const empresas = Array.from(empresasSet);
    const baseHeaders = ['ITEM','CANTIDAD','CANTIDAD COTIZADA','DESCRIPCIÓN','CODIGO_REFERENCIAL','ESTATUS'];
    data.push([...baseHeaders, ...empresas]);

    (solpe.items||[]).forEach((it,idx)=>{
      const filaBase=[ it?.item ?? (idx+1), it?.cantidad ?? '', it?.cantidad_cotizada ?? '', it?.descripcion ?? '', it?.codigo_referencial ?? '', it?.estado ?? '' ];
      const preciosPorEmpresa={};
      (it?.comparaciones||[]).forEach(comp=>{
        const emp = comp?.empresa ? String(comp.empresa).toUpperCase() : '';
        if (!emp) return;
        const precio = comp?.precioBase ?? comp?.precio ?? '';
        const desc = comp?.descuento ?? 0;
        preciosPorEmpresa[emp] = typeof precio === 'number' ? `${precio} (desc. ${desc}%)` : `${precio || ''}`;
      });
      data.push([...filaBase, ...empresas.map(e => preciosPorEmpresa[e] ?? '')]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, `SOLPED_${solpe.numero_solpe||''}`);

    const totalCols = baseHeaders.length + empresas.length;
    ws['!cols']=[8,12,18,60,24,16, ...Array(empresas.length).fill(18)].map(wch=>({wch}));
    const borderThin={ top:{style:'thin',color:{rgb:'FFCBD5E1'}}, left:{style:'thin',color:{rgb:'FFCBD5E1'}}, right:{style:'thin',color:{rgb:'FFCBD5E1'}}, bottom:{style:'thin',color:{rgb:'FFCBD5E1'}} };
    if (!ws['!merges']) ws['!merges']=[]; ws['!merges'].push({ s:{r:0,c:0}, e:{r:0,c:totalCols-1} });
    setStyle(ws, XLSX.utils.encode_cell({ r:0, c:0 }), { font:{ bold:true, sz:18, color:{rgb:'FF111827'} }, alignment:{ horizontal:'center', vertical:'center' } });

    for(let c=0;c<totalCols;c++){
      styleCell(ws, 6, c, { font:{bold:true,color:{rgb:'FFFFFFFF'}}, fill:{fgColor:{rgb:'FF1F2937'}}, alignment:{horizontal:'center',vertical:'center',wrapText:true}, border:borderThin });
    }
    const hoy = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `SOLPED_${solpe.numero_solpe||''}_${hoy}.xlsx`);
  }catch(e){ console.error(e); addToast('danger','No se pudo generar el Excel.'); }
};

/* ========= Toasts ========= */
const toasts = ref([]);
const addToast = (type, text, timeout=3000) => {
  const id = Date.now() + Math.random();
  toasts.value.push({id, type, text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

/* ========= Init / watchers ========= */
onMounted(async () => {
  try {
    const savedOnlyDirected = localStorage.getItem(LS_ONLY_DIRECTED);
    const savedOnlyMine = localStorage.getItem(LS_ONLY_MINE);
    onlyDirectedToMe.value = (savedOnlyDirected === '1');
    onlyMine.value = (savedOnlyMine === '1');
  } catch(e) {console.error(e)}
  await Promise.all([loadUsuarios(), loadCentrosCosto()]);
  subscribePage();
  await refreshCount();
});

onBeforeUnmount(() => { if (typeof unsubscribe === 'function') unsubscribe(); });

watch([empresaSegmento, filtroFecha, () => filtroEstatus.value.slice(), pageSize], () => { applyFilters(); });

/* ========= Expand / ver comentario ========= */
const solpeExpandidaId = ref(null);
const marcarComentariosVistos = async (s) => {
  try {
    const uid = myUid.value; if (!uid) return;
    const comentarios = (s.comentarios||[]).map(c => ({
      ...c,
      vistoPor: Array.isArray(c?.vistoPor) ? (c.vistoPor.includes(uid) ? c.vistoPor : [...c.vistoPor, uid]) : [uid]
    }));
    await setDoc(doc(db,'solpes', s.id), { comentarios }, { merge:true });
    s.comentarios = comentarios;
  } catch (e) { console.error(e); }
};
const onExpandCard = async (s) => {
  solpeExpandidaId.value = (solpeExpandidaId.value === s.id) ? null : s.id;
  if (solpeExpandidaId.value === s.id) {
    await marcarComentariosVistos(s);
    if (!ocBySolped.value[s.id]) await fetchOCs(s.id);
  }
};

/* ========= ========= */
/* ====== EDICIÓN ===== */
/* ========= ========= */

const tiposSolped = [
  "EPP","INSUMOS DE OFICINA","SERVICIOS DE TERCEROS","REPUESTOS","MATERIALES","HERRAMIENTAS","LUBRICANTES",
  "NEUMÁTICOS","EDP","MATERIAS PRIMA","INSUMOS DE MINERÍA"
];

/* Listas de cotizadores por empresa */
const cotizadoresServicios = ["Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];
const cotizadoresMining    = ["Ricardo Santibañez", "Felipe Gonzalez","Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];
const cotizadoresHorm      = ["Ricardo Santibañez", "Felipe Gonzalez","Luis Orellana", "Guillermo Manzor", "María José Ballesteros"];

/* Estado modal */
const showEditModal = ref(false);
const savingEdit = ref(false);
const editForm = ref({});
const editItems = ref([]);
const dirigidoASelected = ref([]);

/* ===== Reglas de edición: generador, mismo día, dentro 24h ===== */
const sameLocalDay = (a, b) => {
  const ax = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bx = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return ax.getTime() === bx.getTime();
};

const puedeEditarSolped = (s) => {
  if (!isGenerador.value) return false; // sólo generadores
  const esDueno = myFullName.value && (String(s.usuario || '').trim() === myFullName.value);
  if (!esDueno) return false;

  const d = s?.fecha?.toDate ? s.fecha.toDate() : (s?.fecha ? new Date(s.fecha) : null);
  if (!d || isNaN(d)) return false;

  const ahora = new Date();
  const dentro24h = (ahora.getTime() - d.getTime()) <= (24 * 60 * 60 * 1000);
  const mismoDia = sameLocalDay(ahora, d);

  return mismoDia && dentro24h;
};

const dirigidoOptions = computed(() => {
  const emp = (editForm.value?.empresa || '').toLowerCase();
  if (emp.includes('servicio')) return cotizadoresServicios;
  if (emp.includes('mining'))   return cotizadoresMining;
  if (emp.includes('hormig'))   return cotizadoresHorm;
  return Array.from(new Set([...cotizadoresServicios, ...cotizadoresMining, ...cotizadoresHorm]));
});

function cloneSolpedForEdit(s){
  const base = JSON.parse(JSON.stringify(s || {}));
  const e = (base.empresa || '').toLowerCase();
  if (e.includes('serv')) base.empresa = 'Xtreme Servicio';
  else if (e.includes('mining')) base.empresa = 'Xtreme Mining';
  else if (e.includes('hormig')) base.empresa = 'Xtreme Hormigones';

  return {
    id: base.id,
    numero_solpe: base.numero_solpe,
    empresa: base.empresa || '',
    numero_contrato: base.numero_contrato || '',
    nombre_centro_costo: base.nombre_centro_costo || '',
    tipo_solped: base.tipo_solped || '',
    nombre_solped: base.nombre_solped || '',
    dirigidoA: Array.isArray(base.dirigidoA) ? base.dirigidoA : [],
    fecha: base.fecha || null,
    usuario: base.usuario || '',
  };
}

const abrirEditar = (s) => {
  if (!puedeEditarSolped(s)) {
    addToast('danger', 'No puedes editar: sólo el generador, mismo día y dentro de 24h desde la creación.');
    return;
  }
  editForm.value = cloneSolpedForEdit(s);
  editItems.value = (s.items||[]).map(it => ({ ...it, __k: Math.random().toString(36).slice(2) }));
  dirigidoASelected.value = (Array.isArray(s.dirigidoA) ? s.dirigidoA.filter(v => typeof v === 'string') : []);
  if (!editForm.value.nombre_centro_costo && editForm.value.numero_contrato) {
    editForm.value.nombre_centro_costo = centrosMap.value?.[editForm.value.numero_contrato] || '';
  }
  showEditModal.value = true;
};

const cerrarEditar = () => {
  showEditModal.value = false;
  savingEdit.value = false;
  editForm.value = {};
  editItems.value = [];
  dirigidoASelected.value = [];
};

/* Autocompletar nombre centro costo cuando cambia el código */
watch(() => editForm.value.numero_contrato, (codigo) => {
  editForm.value.nombre_centro_costo = centrosMap.value?.[codigo] || '';
});

/* Cargar imagen de ítem (base64 en el documento) */
function onPickImg(ev, it){
  const f = ev?.target?.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result; // data:image/..;base64,xxxx
    const base64 = String(dataUrl).split(',')[1] || '';
    it.imagen_referencia_base64 = base64;
    delete it.imagen_url;
  };
  reader.readAsDataURL(f);
}

function borrarImg(it){
  delete it.imagen_url;
  delete it.imagen_referencia_base64;
}

/* CRUD items en modal */
function agregarItem(){
  editItems.value.push({
    __k: Math.random().toString(36).slice(2),
    item: (editItems.value.length ? (Math.max(...editItems.value.map(i => Number(i.item)||0))+1) : 1),
    descripcion: '',
    codigo_referencial: '',
    cantidad: 1,
    cantidad_cotizada: '',
    numero_interno: '',
    stock: 0
  });
}
function eliminarItem(idx){
  editItems.value.splice(idx,1);
}

/* Guardar edición */
async function guardarEdicion(){
  if (!editForm.value?.id) return;
  if (savingEdit.value) return;

  // Revalidación estricta antes de escribir en Firestore
  const refCheck = doc(db, 'solpes', editForm.value.id);
  const snapCheck = await getDoc(refCheck);
  const dataCheck = snapCheck.data() || {};
  if (!puedeEditarSolped({ ...dataCheck, id: editForm.value.id })) {
    addToast('danger', 'La ventana de edición expiró o no tienes permiso (sólo generador, mismo día, <=24h).');
    cerrarEditar();
    return;
  }

  savingEdit.value = true;

  try{
    // Ensamble payload
    const refd = doc(db, 'solpes', editForm.value.id);
    const payload = {
      empresa: editForm.value.empresa || '',
      numero_contrato: editForm.value.numero_contrato || '',
      nombre_centro_costo: editForm.value.nombre_centro_costo || '',
      tipo_solped: editForm.value.tipo_solped || '',
      nombre_solped: editForm.value.nombre_solped || '',
      dirigidoA: Array.from(new Set(dirigidoASelected.value || [])),
      // Numero SOLPED NO se toca
      items: editItems.value.map(it => ({
        item: it.item,
        descripcion: it.descripcion || '',
        codigo_referencial: it.codigo_referencial || '',
        cantidad: Number(it.cantidad || 0),
        cantidad_cotizada: it.cantidad_cotizada || '',
        numero_interno: it.numero_interno || '',
        stock: Number(it.stock || 0),
        imagen_referencia_base64: it.imagen_referencia_base64 || '',
        imagen_url: it.imagen_url || ''
      }))
    };

    // Guardar SOLPED
    await updateDoc(refd, payload);

    // Actualizar items_catalog por cada ítem (para predicción/autocomplete)
    const now = new Date();
    for (const it of payload.items) {
      const descOrig = (it.descripcion || '').trim();
      if (!descOrig) continue;
      const norm = descOrig.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
      const catRef = doc(db, 'items_catalog', norm);
      const snap = await getDoc(catRef);
      const prev = snap.data();
      const empresas = new Set(Array.isArray(prev?.empresas) ? prev.empresas : []);
      if (payload.empresa) empresas.add(payload.empresa);
      const update = {
        norm,
        original: descOrig,
        empresas: Array.from(empresas),
        ultima_vez: now,
        usos: (Number(prev?.usos)||0) + 1
      };
      if (!prev) update.primera_vez = now;
      await setDoc(catRef, update, { merge: true });
    }

    addToast('success','SOLPED actualizada');
    cerrarEditar();
    // refresca página visible
    subscribePage();
  }catch(e){
    console.error(e);
    addToast('danger','No se pudo guardar la edición.');
  }finally{
    savingEdit.value = false;
  }
}

</script>

<style scoped>
/* ===== Layout base / utilidades ===== */
.historial-page{ min-height:100vh; }
.pointer{ cursor:pointer; }
.small{ font-size:.875rem; }
.text-secondary{ color:#64748b !important; }

/* ===== Alertas “pro” (unificadas) ===== */
.alert-pro{
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  box-shadow:
    0 8px 24px rgba(15,23,42,.06),
    0 2px  6px rgba(15,23,42,.05);
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
  from{ opacity:0; transform: translateY(-4px); }
  to{ opacity:1; transform: translateY(0); }
}

/* ===== Cards elevadas ===== */
.card-elevated{
  border:1px solid #e5e7eb !important;
  box-shadow:
    0 10px 20px rgba(0,0,0,.08),
    0 3px  6px rgba(0,0,0,.06) !important;
  border-radius: .9rem !important;
  background:#fff;
}

/* Paginación superior pegajosa */
.sticky-pager{
  position: sticky;
  top: 8px;
  z-index: 5;
  background: transparent;
  backdrop-filter: blur(3px);
}

/* Sidebar filtros pegajoso (desktop) */
.sticky-sidebar{ position: sticky; top: 12px; }

/* Botón flotante filtros en móvil */
.floating-filters-btn{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  border-radius: 10px;
  width: 48px; height: 48px;
  display: grid; place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.2);
}

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

/* Comentario no visto (en la lista) */
.comment-unread{
  border-left: 3px solid #2563eb;
  background: #f0f7ff;
}

/* Loading */
.loading-global{
  display:flex; align-items:center; justify-content:center;
  padding:2rem; border:1px dashed #e5e7eb; border-radius:.75rem;
}

/* Estado vacío (fantasma) */
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
.ghost-eyes{ position:absolute; top:45px; left:50%; transform:translateX(-50%); width:60px; height:14px; display:flex; justify-content:space-between; }
.ghost-eyes:before, .ghost-eyes:after{ content:''; width:14px; height:14px; background:#111827; border-radius:50%; }
.ghost-bottom{ position:absolute; bottom:-12px; left:0; right:0; display:flex; justify-content:space-between; padding:0 6px; }
.ghost-text{ margin-top:1rem; font-weight:500; }
@keyframes floaty{ 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }

/* Chips/badges */
.bg-primary-subtle{ background-color:#e7f1ff !important; }
.text-primary-emphasis{ color:#0a58ca !important; }
.badge{
  border-radius:999px; padding:.35rem .6rem;
  font-weight:700; letter-spacing:.2px;
}
.badge .btn-close{ width:.6rem; height:.6rem; filter: invert(1) grayscale(100%) brightness(0.4); }

/* Toasts */
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

/* Tabla / imágenes */
.thumb{ width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0; }

/* Responsivo menor: compactar tipografía en xs */
@media (max-width: 420px){
  .card-header .small{ font-size: .8rem; }
}
</style>
