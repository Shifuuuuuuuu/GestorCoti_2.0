<!-- src/views/AdminCotizacionPlantas.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-oc-page">
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
        <h1 class="h5 h4-md fw-semibold mb-0">Admin · Cotizaciones Plantas</h1>

        <div class="d-none d-md-flex align-items-stretch gap-2 flex-wrap w-100 w-lg-auto ms-md-3">
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
              title="Limpiar búsqueda"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <button class="btn btn-outline-primary" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span
              v-if="hasActiveFilters"
              class="badge bg-primary-subtle text-primary-emphasis ms-2"
            >
              {{ totalFiltrosActivos }}
            </span>
          </button>

          <button class="btn btn-primary" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva cotización
          </button>
        </div>

        <div class="d-flex d-md-none w-100 gap-2">
          <button class="btn btn-outline-secondary flex-fill" @click="mobileFiltersOpen = true">
            <i class="bi bi-funnel me-1"></i> Filtros
            <span
              v-if="hasActiveFilters"
              class="badge bg-primary-subtle text-primary-emphasis ms-1"
            >
              {{ totalFiltrosActivos }}
            </span>
          </button>
          <button class="btn btn-primary flex-fill" @click="abrirModalNueva">
            <i class="bi bi-plus-lg me-1"></i> Nueva
          </button>
        </div>
      </div>

      <div
        v-if="hasActiveFilters || busquedaActiva"
        class="d-flex flex-wrap align-items-center gap-2 mb-2"
      >
        <small class="text-secondary">Filtros activos:</small>

        <span v-if="filtroEstatus" class="badge bg-light text-dark border">
          Estatus: {{ filtroEstatus }}
          <button
            class="btn-close btn-close-white ms-2 small"
            @click="filtroEstatus=''; aplicarFiltros()"
          ></button>
        </span>

        <span v-if="filtroResponsable" class="badge bg-light text-dark border">
          Responsable: {{ filtroResponsable }}
          <button
            class="btn-close btn-close-white ms-2 small"
            @click="filtroResponsable=''; aplicarFiltros()"
          ></button>
        </span>

        <span v-if="busquedaActiva" class="badge bg-info-subtle text-info-emphasis">
          Búsqueda aplicada
          <button class="btn-close btn-close-white ms-2 small" @click="limpiarBusqueda()"></button>
        </span>

        <button
          class="btn btn-link btn-sm ps-0"
          @click="limpiarFiltros"
          v-if="hasActiveFilters || busquedaActiva"
        >
          Limpiar todo
        </button>
      </div>

      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">
            Listado ({{ rows.length }} / pág.)
            <span v-if="busquedaActiva || hasActiveFilters" class="text-secondary small ms-2">
              paginación desactivada
            </span>
          </div>

          <div class="d-flex d-md-none gap-2">
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                class="form-control"
                placeholder="ID doc o ID"
                v-model="buscarTexto"
                @keyup.enter="onBuscar"
              >
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

        <div class="table-responsive d-none d-md-block">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th style="width:110px;">ID</th>
                <th>Centro Costo</th>
                <th style="width:180px;">Responsable</th>
                <th style="width:180px;">Estatus</th>
                <th class="d-none d-lg-table-cell" style="width:160px;">Empresa</th>
                <th class="d-none d-md-table-cell" style="width:170px;">Fecha subida</th>
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
                  <div class="fw-semibold text-truncate">
                    {{ r.nombre_centro_costo || r.centroCostoNombre || r.centroCosto || r.numero_contrato || '—' }}
                  </div>
                  <div class="small text-secondary d-md-none mt-1">
                    <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                  </div>
                </td>
                <td>{{ r.responsable || '—' }}</td>
                <td>
                  <span class="badge" :class="badgeClass(r.estatus)">
                    {{ r.estatus || '—' }}
                  </span>
                </td>
                <td class="d-none d-lg-table-cell">{{ r.empresa || '—' }}</td>
                <td class="d-none d-md-table-cell">{{ prettyTS(r.fechaSubida) }}</td>
                <td>
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

                  <div class="dropdown d-inline d-sm-none">
                    <button
                      class="btn btn-outline-secondary btn-sm dropdown-toggle"
                      data-bs-toggle="dropdown"
                      type="button"
                    >
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
                      <li><hr class="dropdown-divider"></li>
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
                  <div class="fw-semibold">#{{ r.id ?? '—' }}</div>
                  <div class="small text-secondary">
                    <i class="bi bi-calendar3 me-1"></i>{{ prettyTS(r.fechaSubida) }}
                  </div>
                </div>
                <span class="badge mt-1" :class="badgeClass(r.estatus)">
                  {{ r.estatus || '—' }}
                </span>
              </div>

              <div class="mt-2 small">
                <div class="text-truncate">
                  <span class="text-secondary">Centro costo:</span>
                  {{ r.nombre_centro_costo || r.centroCostoNombre || r.centroCosto || r.numero_contrato || '—' }}
                </div>
                <div class="text-truncate">
                  <span class="text-secondary">Empresa:</span> {{ r.empresa || '—' }}
                </div>
                <div class="text-truncate">
                  <span class="text-secondary">Responsable:</span> {{ r.responsable || '—' }}
                </div>
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

        <div class="card-footer" v-if="!busquedaActiva && !hasActiveFilters">
          <nav aria-label="Paginación">
            <ul class="pagination justify-content-center mb-0 flex-wrap gap-1">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button
                  class="page-link"
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage === 1"
                >
                  «
                </button>
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
                <button
                  class="page-link"
                  @click="goToPage(currentPage + 1)"
                  :disabled="!hasNextPage"
                >
                  »
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i
            class="me-2"
            :class="t.type==='success'
              ? 'bi bi-check-circle-fill'
              : (t.type==='warning'
                ? 'bi bi-exclamation-triangle-fill'
                : 'bi bi-x-circle-fill')"
          ></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <div v-if="mobileFiltersOpen" class="offcanvas-backdrop" @click.self="mobileFiltersOpen=false">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold"><i class="bi bi-funnel me-2"></i>Filtros</div>
          <button class="btn-close" @click="mobileFiltersOpen=false" aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label">Buscar cotización</label>
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

        <div class="offcanvas-footer d-flex justify-content-between">
          <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar todo</button>
          <button class="btn btn-primary" @click="mobileApplyFilters">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- EDITOR -->
    <div v-if="editorAbierto" class="offcanvas-backdrop" @click.self="cerrarEditor">
      <div class="offcanvas-panel">
        <div class="offcanvas-header">
          <div class="fw-semibold text-truncate">Editar cotización plantas</div>
          <button class="btn-close" @click="cerrarEditor"></button>
        </div>

        <div class="offcanvas-body">
          <div class="row g-3">
            <div class="col-6 col-md-2">
              <label class="form-label">ID</label>
              <input class="form-control" v-model.number="edit.id" type="number" min="0">
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha subida</label>
              <input type="text" class="form-control" :value="prettyTS(edit.fechaSubida)" disabled>
            </div>

            <div class="col-12 col-md-5">
              <label class="form-label">Fecha de Actualizado</label>
              <input type="text" class="form-control" :value="prettyTS(edit.updated_at)" disabled>
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label">Empresa</label>
              <input class="form-control" v-model="edit.empresa" placeholder="Xtreme Servicio">
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="edit.estatus">
                <option v-for="s in ESTATUS_OPC" :key="s">{{ s }}</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="edit.responsable">
                <option value="">— Selecciona —</option>
                <option v-for="r in RESPONSABLES_OPC" :key="r">{{ r }}</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Moneda</label>
              <input class="form-control" v-model="edit.moneda" placeholder="CLP">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Aprobado por</label>
              <input class="form-control" v-model="edit.aprobadoPor" placeholder="Alejandro Candia">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Aprobador asignado</label>
              <input class="form-control" v-model="edit.aprobadorAsignado" placeholder="Alejandro Candia">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Aprobador sugerido</label>
              <input class="form-control" v-model="edit.aprobadorSugerido" placeholder="Alejandro Candia">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Número contrato</label>
              <input class="form-control" v-model="edit.numero_contrato" placeholder="CANECHE">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Centro costo</label>
              <input class="form-control" v-model="edit.nombre_centro_costo" placeholder="PLANTA CANECHE">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Nombre SOLPED</label>
              <input class="form-control" v-model="edit.nombre_solped">
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Número SOLPED</label>
              <input class="form-control" v-model.number="edit.numero_solpe" type="number" min="0">
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">SOLPED ID</label>
              <input class="form-control" v-model="edit.solpedId">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Tipo flujo</label>
              <input class="form-control" v-model="edit.tipo_flujo" placeholder="planta">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="edit.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Comentario aprobación</label>
              <input class="form-control" v-model="edit.comentario_aprobacion">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Total c/ IVA</label>
              <input class="form-control" v-model.number="edit.precioTotalConIVA" type="number" min="0">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="edit.comentario"></textarea>
            </div>

            <!-- ITEMS -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Ítems</div>
                <button class="btn btn-sm btn-outline-primary" @click="agregarItemInline">
                  <i class="bi bi-plus-lg me-1"></i> Agregar ítem
                </button>
              </div>

              <div class="table-responsive d-none d-sm-block">
                <table class="table table-sm align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width:72px;">Ítem</th>
                      <th>Descripción</th>
                      <th style="width:90px;">Cant.</th>
                      <th style="width:90px;">Cotizada</th>
                      <th style="width:110px;">Antes</th>
                      <th style="width:110px;">Por cotizar</th>
                      <th style="width:160px;">Código ref.</th>
                      <th style="width:130px;">Estado</th>
                      <th style="width:150px;">Cotización</th>
                      <th style="width:140px;">Resultado</th>
                      <th style="width:170px;">Imagen</th>
                      <th style="width:170px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!edit.items?.length">
                      <td colspan="12" class="text-center text-secondary">Sin ítems.</td>
                    </tr>

                    <tr v-for="(it, idx) in edit.items" :key="'e-'+(it.__tempId || idx)">
                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.item"
                          type="number"
                          min="1"
                          @input="normalizarItemEdicion(it)"
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model="it.descripcion"
                          placeholder="Descripción"
                        />
                        <input
                          class="form-control form-control-sm mt-1"
                          v-model="it.numero_interno"
                          placeholder="N° interno (opcional)"
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad"
                          type="number"
                          min="0"
                          @input="normalizarItemEdicion(it)"
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad_cotizada"
                          type="number"
                          min="0"
                          @input="normalizarItemEdicion(it)"
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad_cotizada_antes"
                          type="number"
                          min="0"
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          :value="it.cantidad_para_cotizar ?? 0"
                          disabled
                        />
                      </td>

                      <td>
                        <input
                          class="form-control form-control-sm"
                          v-model="it.codigo_referencial"
                          placeholder="Código"
                        />
                      </td>

                      <td>
                        <select class="form-select form-select-sm" v-model="it.estado">
                          <option>pendiente</option>
                          <option>aprobado</option>
                          <option>rechazado</option>
                          <option>parcial</option>
                          <option>completado</option>
                        </select>
                      </td>

                      <td>
                        <select class="form-select form-select-sm" v-model="it.estado_cotizacion">
                          <option>pendiente</option>
                          <option>aprobado</option>
                          <option>parcial</option>
                          <option>completo</option>
                        </select>
                      </td>

                      <td>
                        <select class="form-select form-select-sm" v-model="it.estado_resultante">
                          <option>pendiente</option>
                          <option>parcial</option>
                          <option>completado</option>
                          <option>rechazado</option>
                        </select>
                      </td>

                      <td>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            v-if="it.imagen_url"
                            class="btn btn-sm btn-outline-secondary"
                            @click="verImagenItem(it)"
                            type="button"
                          >
                            Ver
                          </button>

                          <input
                            :id="`inputImg-${idx}`"
                            type="file"
                            class="d-none"
                            accept="image/*"
                            @change="onImagenItemChange($event, idx)"
                          />

                          <button
                            class="btn btn-sm btn-outline-primary"
                            @click="abrirInputImagen(idx)"
                            type="button"
                          >
                            {{ it.imagen_url ? "Actualizar" : "Agregar" }}
                          </button>

                          <button
                            v-if="it.imagen_url"
                            class="btn btn-sm btn-outline-danger"
                            @click="quitarImagenItem(idx)"
                            type="button"
                          >
                            Quitar
                          </button>
                        </div>
                      </td>

                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click="duplicarItemInline(idx)">
                            <i class="bi bi-files"></i>
                          </button>
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
                  <div v-for="(it, idx) in edit.items" :key="'m-'+(it.__tempId || idx)" class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="fw-semibold">Ítem</div>
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarItemInline(idx)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>

                    <div class="row g-2 mt-1">
                      <div class="col-4">
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.item"
                          type="number"
                          min="1"
                          placeholder="#"
                          @input="normalizarItemEdicion(it)"
                        />
                      </div>

                      <div class="col-8">
                        <select class="form-select form-select-sm" v-model="it.estado">
                          <option>pendiente</option>
                          <option>aprobado</option>
                          <option>rechazado</option>
                          <option>parcial</option>
                          <option>completado</option>
                        </select>
                      </div>

                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.descripcion" placeholder="Descripción" />
                      </div>

                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.numero_interno" placeholder="N° interno" />
                      </div>

                      <div class="col-6">
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad"
                          type="number"
                          min="0"
                          placeholder="Cant."
                          @input="normalizarItemEdicion(it)"
                        />
                      </div>

                      <div class="col-6">
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad_cotizada"
                          type="number"
                          min="0"
                          placeholder="Cotizada"
                          @input="normalizarItemEdicion(it)"
                        />
                      </div>

                      <div class="col-6">
                        <input
                          class="form-control form-control-sm"
                          v-model.number="it.cantidad_cotizada_antes"
                          type="number"
                          min="0"
                          placeholder="Antes"
                        />
                      </div>

                      <div class="col-6">
                        <input class="form-control form-control-sm" :value="`Por cotizar: ${it.cantidad_para_cotizar ?? 0}`" disabled />
                      </div>

                      <div class="col-12">
                        <input class="form-control form-control-sm" v-model="it.codigo_referencial" placeholder="Código ref." />
                      </div>

                      <div class="col-6">
                        <select class="form-select form-select-sm" v-model="it.estado_cotizacion">
                          <option>pendiente</option>
                          <option>aprobado</option>
                          <option>parcial</option>
                          <option>completo</option>
                        </select>
                      </div>

                      <div class="col-6">
                        <select class="form-select form-select-sm" v-model="it.estado_resultante">
                          <option>pendiente</option>
                          <option>parcial</option>
                          <option>completado</option>
                          <option>rechazado</option>
                        </select>
                      </div>

                      <div class="col-12 d-flex align-items-center gap-2 flex-wrap">
                        <button
                          v-if="it.imagen_url"
                          class="btn btn-sm btn-outline-secondary"
                          @click="verImagenItem(it)"
                          type="button"
                        >
                          Ver
                        </button>

                        <input
                          :id="`minputImg-${idx}`"
                          type="file"
                          class="d-none"
                          accept="image/*"
                          @change="onImagenItemChange($event, idx)"
                        />

                        <button
                          class="btn btn-sm btn-outline-primary"
                          @click="abrirInputImagenMobile(idx)"
                          type="button"
                        >
                          {{ it.imagen_url ? "Actualizar imagen" : "Agregar imagen" }}
                        </button>

                        <button
                          v-if="it.imagen_url"
                          class="btn btn-sm btn-outline-danger"
                          @click="quitarImagenItem(idx)"
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ARCHIVO OC -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivo OC</div>
                <div class="d-flex gap-2 flex-wrap">
                  <input
                    ref="inputArchivoOCEl"
                    type="file"
                    class="d-none"
                    accept="application/pdf,image/*"
                    @change="onArchivoOC"
                  >
                  <button class="btn btn-sm btn-outline-secondary" @click="openArchivoOCPicker">
                    <i class="bi bi-paperclip me-1"></i> Reemplazar archivo OC
                  </button>
                </div>
              </div>

              <div class="list-group">
                <div class="list-group-item" v-for="(f, idx) in edit.archivoOC" :key="'oc-'+idx">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="small">
                      <i class="bi bi-file-earmark-text me-2"></i>
                      <strong>{{ f?.nombre || 'archivo' }}</strong>
                      <span class="text-secondary ms-2">{{ f?.tipo }}</span>
                      <span class="text-secondary ms-2">{{ prettyTS(f?.fechaSubida) }}</span>
                    </div>
                    <div class="d-flex gap-2">
                      <a class="btn btn-sm btn-outline-secondary" :href="f?.url" target="_blank">Ver</a>
                      <button class="btn btn-sm btn-outline-danger" @click="borrarArchivoOC(idx)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!edit.archivoOC?.length" class="list-group-item text-secondary small">Sin archivo OC.</div>
              </div>
            </div>

            <!-- STORAGE -->
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div class="fw-semibold">Archivos en Storage</div>
                <div class="d-flex gap-2 flex-wrap">
                  <input
                    ref="inputArchivosStorageEl"
                    type="file"
                    class="d-none"
                    multiple
                    accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    @change="onArchivosStorage"
                  >
                  <button class="btn btn-sm btn-outline-secondary" @click="openArchivosStoragePicker">
                    <i class="bi bi-cloud-upload me-1"></i> Agregar archivos
                  </button>
                </div>
              </div>

              <div class="list-group">
                <div
                  class="list-group-item d-flex align-items-center justify-content-between"
                  v-for="(a, ai) in edit.archivosStorage"
                  :key="'st'+ai"
                >
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
                <div v-if="!edit.archivosStorage?.length" class="list-group-item text-secondary small">
                  Sin archivos.
                </div>
              </div>

              <div class="form-text">
                Nota: el botón “Eliminar” solo quita el link del documento.
              </div>
            </div>

            <!-- HISTORIAL -->
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
                      <input
                        class="form-control form-control-sm"
                        :value="prettyTS(h.fecha ?? h._previewFecha)"
                        disabled
                      >
                    </div>
                    <div class="col-md-3">
                      <input class="form-control form-control-sm" v-model="h.estatus" placeholder="Estatus">
                    </div>
                    <div class="col-md-4">
                      <input class="form-control form-control-sm" v-model="h.comentario" placeholder="Comentario">
                    </div>
                    <div class="col-md-2 d-flex">
                      <input class="form-control form-control-sm me-2" v-model="h.usuario" placeholder="Usuario">
                      <button class="btn btn-sm btn-outline-danger" @click="eliminarHistorial(ix)">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!edit.historial?.length" class="list-group-item text-secondary small">
                  Sin historial.
                </div>
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

    <!-- NUEVA -->
    <div v-if="modalNueva" class="vmodal-backdrop" @click.self="cerrarModalNueva">
      <div class="vmodal">
        <div class="vmodal-header">
          <h5 class="mb-0">Nueva cotización plantas</h5>
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
              <input class="form-control" v-model="nuevo.empresa" placeholder="Xtreme Servicio">
            </div>

            <div class="col-6 col-md-3">
              <label class="form-label">Estatus</label>
              <select class="form-select" v-model="nuevo.estatus">
                <option v-for="s in ESTATUS_OPC" :key="'n-'+s">{{ s }}</option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label">Responsable</label>
              <select class="form-select" v-model="nuevo.responsable">
                <option value="">— Selecciona —</option>
                <option v-for="r in RESPONSABLES_OPC" :key="'nr-'+r">{{ r }}</option>
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label">Aprobado por</label>
              <input class="form-control" v-model="nuevo.aprobadoPor">
            </div>

            <div class="col-md-3">
              <label class="form-label">Aprobador asignado</label>
              <input class="form-control" v-model="nuevo.aprobadorAsignado">
            </div>

            <div class="col-md-3">
              <label class="form-label">Aprobador sugerido</label>
              <input class="form-control" v-model="nuevo.aprobadorSugerido">
            </div>

            <div class="col-md-6">
              <label class="form-label">Número contrato</label>
              <input class="form-control" v-model="nuevo.numero_contrato" placeholder="CANECHE">
            </div>

            <div class="col-md-6">
              <label class="form-label">Centro costo</label>
              <input class="form-control" v-model="nuevo.nombre_centro_costo" placeholder="PLANTA CANECHE">
            </div>

            <div class="col-md-6">
              <label class="form-label">Nombre SOLPED</label>
              <input class="form-control" v-model="nuevo.nombre_solped">
            </div>

            <div class="col-md-3">
              <label class="form-label">Número SOLPED</label>
              <input class="form-control" v-model.number="nuevo.numero_solpe" type="number" min="0">
            </div>

            <div class="col-md-3">
              <label class="form-label">SOLPED ID</label>
              <input class="form-control" v-model="nuevo.solpedId">
            </div>

            <div class="col-md-4">
              <label class="form-label">Tipo flujo</label>
              <input class="form-control" v-model="nuevo.tipo_flujo" placeholder="planta">
            </div>

            <div class="col-md-4">
              <label class="form-label">Tipo SOLPED</label>
              <input class="form-control" v-model="nuevo.tipo_solped" placeholder="SERVICIOS DE TERCEROS">
            </div>

            <div class="col-md-4">
              <label class="form-label">Moneda</label>
              <input class="form-control" v-model="nuevo.moneda" placeholder="CLP">
            </div>

            <div class="col-md-6">
              <label class="form-label">Total c/ IVA</label>
              <input class="form-control" v-model.number="nuevo.precioTotalConIVA" type="number" min="0">
            </div>

            <div class="col-md-6">
              <label class="form-label">Comentario aprobación</label>
              <input class="form-control" v-model="nuevo.comentario_aprobacion">
            </div>

            <div class="col-12">
              <label class="form-label">Comentario</label>
              <textarea class="form-control" rows="2" v-model="nuevo.comentario"></textarea>
            </div>

            <div class="col-12">
              <label class="form-label">Archivo OC (PDF/imagen)</label>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  ref="inputArchivoOCNuevoEl"
                  type="file"
                  class="d-none"
                  accept="application/pdf,image/*"
                  @change="onArchivoOCNuevo"
                >
                <button class="btn btn-secondary" @click="openArchivoOCNuevoPicker">
                  <i class="bi bi-paperclip me-1"></i> Seleccionar archivo OC
                </button>
                <div class="small text-secondary" v-if="archivoOCNuevoNombre">
                  Seleccionado: <strong>{{ archivoOCNuevoNombre }}</strong>
                </div>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label">Archivos Storage (múltiples)</label>
              <div class="d-flex gap-2 flex-wrap">
                <input
                  ref="inputArchivosStorageNuevoEl"
                  type="file"
                  class="d-none"
                  multiple
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  @change="onArchivosStorageNuevo"
                >
                <button class="btn btn-secondary" @click="openArchivosStorageNuevoPicker">
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

    <!-- ELIMINAR -->
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
            ¿Seguro que quieres eliminar la cotización
            <strong>#{{ confirmRow?.id ?? '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li>
              <span class="text-secondary">Empresa:</span>
              <strong>{{ confirmRow?.empresa || '—' }}</strong>
            </li>
            <li>
              <span class="text-secondary">Centro costo:</span>
              <strong>
                {{ confirmRow?.nombre_centro_costo || confirmRow?.centroCostoNombre || confirmRow?.numero_contrato || '—' }}
              </strong>
            </li>
            <li>
              <span class="text-secondary">Responsable:</span>
              <strong>{{ confirmRow?.responsable || '—' }}</strong>
            </li>
            <li>
              <span class="text-secondary">Fecha subida:</span>
              <strong>{{ prettyTS(confirmRow?.fechaSubida) }}</strong>
            </li>
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
import { db } from "@/stores/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";

const PAGE_SIZE = 20;
const COLLECTION = "cotizaciones_plantas";

const ESTATUS_OPC = [
  "Aprobado",
  "Rechazado",
  "Preaprobado",
  "Casi Aprobado",
  "Pendiente de Aprobación",
  "Enviada a proveedor",
  "Revisión Guillermo",
];

const RESPONSABLES_OPC = [
  "María José Ballesteros",
  "Alejandro Candia",
  "Ricardo Prouvay",
  "Rodrigo Baeza",
  "Sebastián Espinoza",
];

const prettyTS = (v) => {
  if (!v) return "—";
  if (v instanceof Timestamp) return v.toDate().toISOString().replace("T", " ").replace("Z", "");
  if (v?.seconds) return new Date(v.seconds * 1000).toISOString().replace("T", " ").replace("Z", "");
  if (v instanceof Date) return v.toISOString().replace("T", " ").replace("Z", "");
  if (typeof v === "string") return v.replace("T", " ").replace("Z", "");
  return String(v);
};

function cloneForUI(x) {
  if (x === null || typeof x !== "object") return x;
  if (x instanceof Date || x instanceof Timestamp) return x;
  if (Array.isArray(x)) return x.map(cloneForUI);
  const out = {};
  for (const [k, v] of Object.entries(x)) out[k] = cloneForUI(v);
  return out;
}

function safeCloneFirestore(x) {
  if (x === null || typeof x !== "object") return x;
  if (x instanceof Date || x instanceof Timestamp) return x;
  if (Array.isArray(x)) return x.map(safeCloneFirestore);
  const out = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === "_previewFecha") continue;
    if (k === "__tempId") continue;
    out[k] = safeCloneFirestore(v);
  }
  return out;
}

const num = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function makeTempId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function crearItemBase() {
  return {
    __tempId: makeTempId(),
    item: 1,
    descripcion: "",
    cantidad: 0,
    cantidad_cotizada: 0,
    cantidad_cotizada_antes: 0,
    cantidad_para_cotizar: 0,
    codigo_referencial: "SIN CÓDIGO",
    numero_interno: "",
    estado: "pendiente",
    estado_cotizacion: "pendiente",
    estado_resultante: "pendiente",
    imagen_path: "",
    imagen_url: "",
    stock: 0,
    prioridad: "MEDIA",
  };
}

function normalizarItemEdicion(item) {
  item.item = Math.max(1, num(item.item, 1));
  item.cantidad = Math.max(0, num(item.cantidad, 0));
  item.cantidad_cotizada = Math.max(0, num(item.cantidad_cotizada, 0));
  item.cantidad_cotizada_antes = Math.max(0, num(item.cantidad_cotizada_antes, 0));
  item.stock = Math.max(0, num(item.stock, 0));

  const restante = Math.max(item.cantidad - item.cantidad_cotizada, 0);
  item.cantidad_para_cotizar = restante;

  if (!item.codigo_referencial) item.codigo_referencial = "SIN CÓDIGO";
  if (!item.estado) item.estado = "pendiente";
  if (!item.estado_cotizacion) item.estado_cotizacion = "pendiente";
  if (!item.estado_resultante) item.estado_resultante = "pendiente";
  if (!item.prioridad) item.prioridad = "MEDIA";
  if (!item.__tempId) item.__tempId = makeTempId();

  return item;
}

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
const closeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const badgeClass = (estatus) => {
  const s = (estatus || "").toLowerCase();
  if (s.includes("aprob")) return "bg-success-subtle text-success-emphasis";
  if (s.includes("enviada") || s.includes("revisión")) return "bg-info-subtle text-info-emphasis";
  if (s.includes("rechaz")) return "bg-danger-subtle text-danger-emphasis";
  if (s.includes("pendiente") || s.includes("preaprobado") || s.includes("casi")) {
    return "bg-warning-subtle text-warning-emphasis";
  }
  return "bg-secondary-subtle text-secondary-emphasis";
};

const mobileFiltersOpen = ref(false);
const hasActiveFilters = computed(() => !!filtroEstatus.value || !!filtroResponsable.value);
const totalFiltrosActivos = computed(() => (filtroEstatus.value ? 1 : 0) + (filtroResponsable.value ? 1 : 0));

function mobileApplyFilters() {
  aplicarFiltros();
  mobileFiltersOpen.value = false;
}

function limpiarFiltros() {
  filtroEstatus.value = "";
  filtroResponsable.value = "";
  if (busquedaActiva.value) limpiarBusqueda();
  else aplicarFiltros();
}

const visiblePageButtons = computed(() => {
  const maxButtons = 7;
  const maxReach = currentPage.value + (hasNextPage.value ? 2 : 1);
  const start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
  const pages = [];
  for (let n = start; n < start + maxButtons; n++) {
    if (n <= maxReach) pages.push(n);
  }
  if (!pages.includes(currentPage.value)) pages.push(currentPage.value);
  pages.sort((a, b) => a - b);
  return pages;
});

function buildPageQuery(page, withFilters = true) {
  const colRef = collection(db, COLLECTION);
  const constraints = [];

  if (withFilters) {
    if (filtroEstatus.value) constraints.push(where("estatus", "==", filtroEstatus.value));
    if (filtroResponsable.value) constraints.push(where("responsable", "==", filtroResponsable.value));
  }

  constraints.push(orderBy("id", "desc"));

  if (page > 1) {
    const prevCursor = pageCursors.value[page - 2];
    if (!prevCursor) return null;
    constraints.push(startAfter(prevCursor));
  }

  constraints.push(limit(PAGE_SIZE + 1));
  return query(colRef, ...constraints);
}

function cleanupSubs() {
  if (unsubList) { unsubList(); unsubList = null; }
  if (unsubSearch) { unsubSearch(); unsubSearch = null; }
}

function subscribePage(page) {
  cleanupSubs();
  cargando.value = true;
  busquedaActiva.value = false;

  const qy = buildPageQuery(page, true);
  if (!qy) {
    cargando.value = false;
    return;
  }

  unsubList = onSnapshot(
    qy,
    (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ __id: d.id, ...d.data(), __snap: d }));
      hasNextPage.value = arr.length > PAGE_SIZE;

      const pageDocs = arr.slice(0, PAGE_SIZE);
      rows.value = pageDocs.map((x) => {
        const y = { ...x };
        delete y.__snap;
        return y;
      });

      const lastSnap = pageDocs.length ? pageDocs[pageDocs.length - 1].__snap : null;
      if (lastSnap) pageCursors.value[page - 1] = lastSnap;

      cargando.value = false;
    },
    (err) => {
      console.error("onSnapshot page:", err);
      addToast("danger", "Error listando cotizaciones (puede faltar índice compuesto).");
      cargando.value = false;
    }
  );
}

function goToPage(n) {
  if (hasActiveFilters.value || busquedaActiva.value) return;
  if (n < 1) return;
  if (n > currentPage.value + 1 && !hasNextPage.value) return;
  currentPage.value = n;
  subscribePage(n);
}

function aplicarFiltros() {
  currentPage.value = 1;
  subscribePage(1);
}

async function onBuscar() {
  const raw = (buscarTexto.value ?? "").trim();
  if (!raw) {
    limpiarBusqueda();
    return;
  }

  const numero = parseInt(raw, 10);

  if (!isNaN(numero) && String(numero) === raw) {
    cleanupSubs();
    cargando.value = true;
    busquedaActiva.value = true;

    const colRef = collection(db, COLLECTION);
    const constraints = [where("id", "==", numero)];
    if (filtroEstatus.value) constraints.push(where("estatus", "==", filtroEstatus.value));
    if (filtroResponsable.value) constraints.push(where("responsable", "==", filtroResponsable.value));
    constraints.push(limit(20));

    const qy = query(colRef, ...constraints);

    unsubSearch = onSnapshot(
      qy,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ __id: d.id, ...d.data() }));
        rows.value = arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        cargando.value = false;
        hasNextPage.value = false;
      },
      (err) => {
        console.error("onSnapshot search id:", err);
        addToast("danger", "Error en búsqueda por ID.");
        cargando.value = false;
      }
    );
    return;
  }

  if (raw.length >= 8) {
    cleanupSubs();
    cargando.value = true;
    busquedaActiva.value = true;
    try {
      const dref = doc(db, COLLECTION, raw);
      const d = await getDoc(dref);
      const found = d.exists() ? [{ __id: d.id, ...d.data() }] : [];
      rows.value = found;
      cargando.value = false;
      hasNextPage.value = false;
      if (!found.length) addToast("warning", "No se encontró la cotización con ese ID de documento.");
    } catch (e) {
      console.error(e);
      addToast("danger", "Error en búsqueda por ID de documento.");
      cargando.value = false;
    }
    return;
  }

  addToast("warning", "Ingresa un ID numérico o un ID de documento válido.");
}

function limpiarBusqueda() {
  buscarTexto.value = "";
  busquedaActiva.value = false;
  currentPage.value = 1;
  subscribePage(1);
}

const inputArchivoOCEl = ref(null);
const inputArchivosStorageEl = ref(null);
const inputArchivoOCNuevoEl = ref(null);
const inputArchivosStorageNuevoEl = ref(null);

const triggerPicker = (el) => {
  if (!el) return;
  el.value = "";
  el.click();
};

function openArchivoOCPicker() {
  triggerPicker(inputArchivoOCEl.value);
}
function openArchivosStoragePicker() {
  triggerPicker(inputArchivosStorageEl.value);
}
function openArchivoOCNuevoPicker() {
  triggerPicker(inputArchivoOCNuevoEl.value);
}
function openArchivosStorageNuevoPicker() {
  triggerPicker(inputArchivosStorageNuevoEl.value);
}

const editorAbierto = ref(false);
const seleccion = ref(null);
const edit = ref({});
const guardando = ref(false);

const archivoOCFile = ref(null);
function onArchivoOC(e) {
  const f = (e.target.files || [])[0];
  archivoOCFile.value = f || null;
}

function borrarArchivoOC(ix) {
  if (!Array.isArray(edit.value.archivoOC)) edit.value.archivoOC = [];
  edit.value.archivoOC.splice(ix, 1);
}

const nuevosStorageFiles = ref([]);
function onArchivosStorage(e) {
  nuevosStorageFiles.value = Array.from(e.target.files || []);
}
function eliminarArchivoStorage(ix) {
  edit.value.archivosStorage.splice(ix, 1);
}

function agregarItemInline() {
  if (!Array.isArray(edit.value.items)) edit.value.items = [];
  const nextItem = edit.value.items.length
    ? Math.max(...edit.value.items.map((x) => num(x.item, 0))) + 1
    : 1;
  const nuevo = crearItemBase();
  nuevo.item = nextItem;
  edit.value.items.push(nuevo);
}

function duplicarItemInline(ix) {
  const original = edit.value.items?.[ix];
  if (!original) return;
  const copia = cloneForUI(original);
  copia.__tempId = makeTempId();
  copia.item = (edit.value.items?.length || 0) + 1;
  normalizarItemEdicion(copia);
  edit.value.items.splice(ix + 1, 0, copia);
}

function eliminarItemInline(ix) {
  edit.value.items.splice(ix, 1);
  edit.value.items.forEach((it, index) => {
    if (!num(it.item, 0)) it.item = index + 1;
  });
}

function verImagenItem(it) {
  const url = it?.imagen_url;
  if (!url) {
    addToast("warning", "Este ítem no tiene imagen.");
    return;
  }
  window.open(url, "_blank");
}

function abrirInputImagen(idx) {
  document.getElementById(`inputImg-${idx}`)?.click();
}

function abrirInputImagenMobile(idx) {
  document.getElementById(`minputImg-${idx}`)?.click();
}

async function onImagenItemChange(ev, idx) {
  try {
    const f = (ev.target.files || [])[0];
    if (!f || !seleccion.value) return;

    const storage = getStorage();
    const idDoc = seleccion.value.__id;
    const path = `${COLLECTION}/${idDoc}/items/${Date.now()}_${f.name}`;
    const storageRef = sref(storage, path);
    const up = await uploadBytes(storageRef, f);
    const url = await getDownloadURL(up.ref);

    if (!edit.value.items[idx]) return;
    edit.value.items[idx].imagen_url = url;
    edit.value.items[idx].imagen_path = path;

    addToast("success", "Imagen del ítem subida.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo subir la imagen del ítem.");
  } finally {
    if (ev?.target) ev.target.value = "";
  }
}

function quitarImagenItem(idx) {
  if (!edit.value?.items?.[idx]) return;
  edit.value.items[idx].imagen_url = "";
  edit.value.items[idx].imagen_path = "";
}

function abrirEditor(row) {
  seleccion.value = row;

  edit.value = cloneForUI({
    __docId: row.__docId ?? row.__id,
    aprobadoPor: row.aprobadoPor ?? "",
    aprobadorAsignado: row.aprobadorAsignado ?? "",
    aprobadorSugerido: row.aprobadorSugerido ?? "",
    archivoOC: Array.isArray(row.archivoOC) ? row.archivoOC : [],
    archivosStorage: Array.isArray(row.archivosStorage) ? row.archivosStorage : [],
    comentario: row.comentario ?? "",
    comentario_aprobacion: row.comentario_aprobacion ?? "",
    empresa: row.empresa ?? "Xtreme Servicio",
    estatus: row.estatus ?? "Pendiente de Aprobación",
    fechaSubida: row.fechaSubida ?? null,
    historial: Array.isArray(row.historial) ? row.historial : [],
    id: row.id ?? null,
    moneda: row.moneda ?? "CLP",
    precioTotalConIVA: row.precioTotalConIVA ?? 0,
    responsable: row.responsable ?? "",
    tipo_solped: row.tipo_solped ?? "",
    numero_solpe: row.numero_solpe ?? "",
    solpedId: row.solpedId ?? "",
    nombre_centro_costo: row.nombre_centro_costo ?? "",
    nombre_solped: row.nombre_solped ?? "",
    numero_contrato: row.numero_contrato ?? "",
    tipo_flujo: row.tipo_flujo ?? "planta",
    updated_at: row.updated_at ?? null,
    items: Array.isArray(row.items) ? row.items : [],
  });

  edit.value.historial = (edit.value.historial || []).map((h) => {
    const hh = { ...h };
    const hasRealTs =
      typeof hh.fecha?.toDate === "function" ||
      (hh.fecha && typeof hh.fecha.seconds === "number");
    if (hasRealTs && "_previewFecha" in hh) delete hh._previewFecha;
    return hh;
  });

  edit.value.items = (edit.value.items || []).map((it, ix) => {
    const clean = cloneForUI(it);
    if (!clean.__tempId) clean.__tempId = `${ix + 1}-${clean.descripcion || "item"}`;
    return normalizarItemEdicion(clean);
  });

  editorAbierto.value = true;
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];
}

function cerrarEditor() {
  editorAbierto.value = false;
  seleccion.value = null;
  edit.value = {};
  archivoOCFile.value = null;
  nuevosStorageFiles.value = [];
}

async function guardarEdicion() {
  if (!seleccion.value) return;

  guardando.value = true;
  try {
    const idDoc = seleccion.value.__id;
    const dref = doc(db, COLLECTION, idDoc);

    if (archivoOCFile.value) {
      const storage = getStorage();
      const path = `${COLLECTION}/${idDoc}/oc/oc_enviada_${Date.now()}_${archivoOCFile.value.name}`;
      const storageRef = sref(storage, path);
      const up = await uploadBytes(storageRef, archivoOCFile.value);
      const url = await getDownloadURL(up.ref);

      if (!Array.isArray(edit.value.archivoOC)) edit.value.archivoOC = [];
      edit.value.archivoOC.push({
        nombre: archivoOCFile.value.name,
        tipo: archivoOCFile.value.type || "application/octet-stream",
        url,
        path,
        fechaSubida: new Date().toISOString(),
      });

      archivoOCFile.value = null;
    }

    if (nuevosStorageFiles.value?.length) {
      const storage = getStorage();
      const uploads = [];

      for (const f of nuevosStorageFiles.value) {
        const path = `${COLLECTION}/${idDoc}/${Date.now()}_${f.name}`;
        const storageRef = sref(storage, path);
        const up = await uploadBytes(storageRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({
          nombre: f.name,
          tipo: f.type || "application/octet-stream",
          url,
          origen: "upload",
        });
      }

      if (!Array.isArray(edit.value.archivosStorage)) edit.value.archivosStorage = [];
      edit.value.archivosStorage.push(...uploads);
      nuevosStorageFiles.value = [];
    }

    if (typeof edit.value.id === "string") {
      const n = parseInt(edit.value.id, 10);
      edit.value.id = isNaN(n) ? null : n;
    }

    if (typeof edit.value.precioTotalConIVA === "string") {
      const n = parseInt(edit.value.precioTotalConIVA, 10);
      edit.value.precioTotalConIVA = isNaN(n) ? 0 : n;
    }

    if (Array.isArray(edit.value.items)) {
      edit.value.items = edit.value.items.map((it, ix) => {
        const limpio = normalizarItemEdicion({ ...it });
        return {
          item: num(limpio.item, ix + 1),
          cantidad: num(limpio.cantidad, 0),
          cantidad_cotizada: num(limpio.cantidad_cotizada, 0),
          cantidad_cotizada_antes: num(limpio.cantidad_cotizada_antes, 0),
          cantidad_para_cotizar: num(limpio.cantidad_para_cotizar, 0),
          codigo_referencial: limpio.codigo_referencial || "SIN CÓDIGO",
          descripcion: limpio.descripcion || "",
          estado: limpio.estado || "pendiente",
          estado_cotizacion: limpio.estado_cotizacion || "pendiente",
          estado_resultante: limpio.estado_resultante || "pendiente",
          imagen_path: limpio.imagen_path || "",
          imagen_url: limpio.imagen_url || "",
          numero_interno: limpio.numero_interno || "",
          stock: num(limpio.stock, 0),
          prioridad: limpio.prioridad || "MEDIA",
        };
      });
    }

    const payload = safeCloneFirestore(edit.value);
    delete payload.fechaSubida;
    delete payload.updated_at;

    await updateDoc(dref, payload);

    addToast("success", "Cotización actualizada.");
    cerrarEditor();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar.");
  } finally {
    guardando.value = false;
  }
}

function agregarHistorial() {
  if (!Array.isArray(edit.value.historial)) edit.value.historial = [];
  edit.value.historial.push({
    estatus: edit.value.estatus || "Actualizado",
    comentario: edit.value.comentario || "",
    fecha: serverTimestamp(),
    _previewFecha: new Date(),
    usuario: edit.value.responsable || edit.value.aprobadoPor || "",
  });
}

function eliminarHistorial(ix) {
  edit.value.historial.splice(ix, 1);
}

const confirmOpen = ref(false);
const confirmRow = ref(null);
const eliminando = ref(false);

function abrirConfirm(row) {
  confirmRow.value = row;
  confirmOpen.value = true;
}

function cerrarConfirm() {
  if (eliminando.value) return;
  confirmOpen.value = false;
  confirmRow.value = null;
}

async function confirmarEliminar() {
  if (!confirmRow.value?.__id) return;

  try {
    eliminando.value = true;
    await deleteDoc(doc(db, COLLECTION, confirmRow.value.__id));
    addToast("success", "Cotización eliminada.");
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

function defaultNuevo() {
  return {
    id: null,
    empresa: "Xtreme Servicio",
    estatus: "Pendiente de Aprobación",
    comentario: "",
    comentario_aprobacion: "",
    nombre_centro_costo: "",
    nombre_solped: "",
    numero_contrato: "",
    responsable: "",
    aprobadoPor: "",
    aprobadorAsignado: "",
    aprobadorSugerido: "",
    tipo_solped: "",
    numero_solpe: "",
    solpedId: "",
    moneda: "CLP",
    precioTotalConIVA: 0,
    archivoOC: [],
    archivosStorage: [],
    fechaSubida: null,
    historial: [],
    items: [],
    tipo_flujo: "planta",
  };
}

function abrirModalNueva() {
  nuevo.value = defaultNuevo();
  archivoOCNuevo.value = null;
  archivoOCNuevoNombre.value = "";
  previewArchivosStorageNuevo.value = [];
  modalNueva.value = true;
}

function cerrarModalNueva() {
  modalNueva.value = false;
}

function onArchivoOCNuevo(e) {
  const f = (e.target.files || [])[0];
  archivoOCNuevo.value = f || null;
  archivoOCNuevoNombre.value = f?.name || "";
}

function onArchivosStorageNuevo(e) {
  previewArchivosStorageNuevo.value = Array.from(e.target.files || []);
}

async function crearNueva() {
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

    const payload = safeCloneFirestore({
      ...defaultNuevo(),
      ...nuevo.value,
      __docId: null,
      archivoOC: [],
      archivosStorage: [],
      fechaSubida: serverTimestamp(),
      historial: [],
    });

    const dref = await addDoc(collection(db, COLLECTION), payload);

    await updateDoc(doc(db, COLLECTION, dref.id), { __docId: dref.id });

    if (archivoOCNuevo.value) {
      const storage = getStorage();
      const path = `${COLLECTION}/${dref.id}/oc/oc_enviada_${Date.now()}_${archivoOCNuevo.value.name}`;
      const storageRef = sref(storage, path);
      const up = await uploadBytes(storageRef, archivoOCNuevo.value);
      const url = await getDownloadURL(up.ref);

      await updateDoc(doc(db, COLLECTION, dref.id), {
        archivoOC: [{
          nombre: archivoOCNuevo.value.name,
          tipo: archivoOCNuevo.value.type || "application/octet-stream",
          url,
          path,
          fechaSubida: new Date().toISOString(),
        }],
      });
    }

    if (previewArchivosStorageNuevo.value.length) {
      const storage = getStorage();
      const uploads = [];

      for (const f of previewArchivosStorageNuevo.value) {
        const path = `${COLLECTION}/${dref.id}/${Date.now()}_${f.name}`;
        const storageRef = sref(storage, path);
        const up = await uploadBytes(storageRef, f);
        const url = await getDownloadURL(up.ref);
        uploads.push({
          nombre: f.name,
          tipo: f.type || "application/octet-stream",
          url,
          origen: "upload",
        });
      }

      await updateDoc(doc(db, COLLECTION, dref.id), { archivosStorage: uploads });
    }

    addToast("success", `Cotización creada${payload.id ? ` (#${payload.id})` : ""}.`);
    cerrarModalNueva();
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear la cotización.");
  } finally {
    creando.value = false;
  }
}

function verArchivoOC(row) {
  const first = Array.isArray(row?.archivoOC) ? row.archivoOC[0] : null;
  const url = first?.url;
  if (!url) {
    addToast("warning", "Esta cotización no tiene archivo OC aún.");
    return;
  }
  window.open(url, "_blank");
}

onMounted(() => {
  subscribePage(1);
});

onBeforeUnmount(() => {
  cleanupSubs();
});
</script>

<style scoped>
.admin-oc-page{
  min-height:100vh;
}
.minw-280{ min-width: 280px; }

.offcanvas-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: grid; place-items: end; z-index: 1080;
}
.offcanvas-panel{
  width: min(980px, 100%);
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
  from{ transform: translateX(20px); opacity:0; }
  to{ transform: translateX(0); opacity:1; }
}
@media (max-width: 575.98px){
  .list-group-item{ border-left: 0; border-right: 0; }
}

.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1080; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 760px;  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid rgba(0,0,0,.05);
}
.vmodal-header, .vmodal-footer{
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 70vh; overflow: auto; }

.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg, #16a34a, #22c55e); }
.toast-warning{ background: linear-gradient(135deg, #d97706, #f59e0b); }
.toast-danger{ background: linear-gradient(135deg, #dc2626, #ef4444); }

.btn-close-white{
  filter: invert(1) grayscale(100%) brightness(200%);
}

.confirm-icon{
  width: 44px; height: 44px; border-radius: 50%;
  display: grid; place-items: center;
  background: #fee2e2; color: #dc2626;
}
</style>
