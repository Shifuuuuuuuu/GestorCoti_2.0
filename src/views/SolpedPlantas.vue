<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="solped-page">
    <div class="container py-4 py-md-5">
      <header class="page-head mb-4">
        <div class="page-head__left">
          <h1 class="h4 fw-semibold mb-1">Creación de SOLPED · Plantas</h1>
          <p class="text-secondary mb-0">Complete los datos y envíe la solicitud.</p>
          <small class="text-secondary d-inline d-sm-none mt-2">
            Usuario: <strong>{{ usuarioNombre || "-" }}</strong>
          </small>
        </div>

        <div class="page-head__right">
          <button
            type="button"
            :class="['btn btn-sm', showEquiposCard ? 'btn-dark' : 'btn-outline-dark']"
            @click="toggleEquiposCard"
            :title="showEquiposCard ? 'Cerrar buscador' : 'Buscar equipos'"
            :aria-pressed="showEquiposCard"
          >
            <i class="bi bi-search me-1"></i>
            Buscar equipo
          </button>

          <small class="text-secondary d-none d-sm-inline">
            Usuario: <strong>{{ usuarioNombre || "-" }}</strong>
          </small>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>{{ error }}</div>
      </div>

      <div v-if="okMsg" class="alert alert-success d-flex align-items-center" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i>
        <div>{{ okMsg }}</div>
      </div>

      <div class="row g-4 align-items-start">
        <div :class="['col-12', showEquiposCard ? 'col-lg-8' : 'col-lg-12']">
          <section class="card card-elevated mb-0">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h2 class="h6 mb-0 fw-semibold">Datos generales</h2>

              <div class="d-flex align-items-center gap-2 flex-wrap justify-content-end w-auto">
                <span class="badge bg-success-subtle text-success-emphasis border">
                  Guardado local automático activo
                </span>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-danger" @click="clearLocalNow">Limpiar</button>
                </div>
              </div>
            </div>
              <div class="row g-3">
                <div class="col-12 col-xl-12">
                  <div class="card section-soft h-100">
                    <div class="card-body">
                      <div class="row g-3">
                        <div class="col-12 col-md-4">
                          <label class="form-label">N° SOLPED</label>
                          <div class="input-group">
                            <input
                              type="text"
                              class="form-control"
                              :value="form.numero_solpe ?? ''"
                              readonly
                            />
                            <span v-if="loadingNumero" class="input-group-text bg-light">
                              <span class="spinner-border spinner-border-sm"></span>
                            </span>
                          </div>
                          <div class="form-text">Tomado desde <strong>solpe_counters / solped_plantas / next</strong>.</div>
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Empresa</label>
                          <input
                            type="text"
                            class="form-control"
                            v-model="form.empresa"
                            readonly
                          />
                          <div class="form-text">Fija para esta vista.</div>
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Fecha</label>
                          <input type="datetime-local" class="form-control" v-model="form.fecha" readonly />
                          <div class="form-text">Automática (momento actual).</div>
                        </div>

                        <div class="col-12 col-md-8">
                          <label class="form-label">Nombre de la SOLPED</label>
                          <input
                            class="form-control"
                            v-model="form.nombre_solped"
                            @input="form.nombre_solped = (form.nombre_solped || '').toUpperCase()"
                            placeholder="EJ: INSUMOS PLANTA CALAMA"
                            required
                          />
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Tipo de SOLPED</label>
                          <select class="form-select" v-model="form.tipo_solped" required>
                            <option value="" disabled>Seleccionar tipo</option>
                            <option>EPP</option>
                            <option>INSUMOS DE OFICINA</option>
                            <option>SERVICIOS DE TERCEROS</option>
                            <option>REPUESTOS</option>
                            <option>MATERIALES</option>
                            <option>HERRAMIENTAS</option>
                            <option>LUBRICANTES</option>
                            <option>NEUMÁTICOS</option>
                            <option>EDP</option>
                            <option>MATERIAS PRIMA</option>
                            <option>INSUMOS DE MINERÍA</option>
                            <option>INSUMOS DE TALLER</option>
                          </select>
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Prioridad SOLPED</label>
                          <select class="form-select" v-model="form.prioridad_solped" required>
                            <option value="ALTA">ALTA</option>
                            <option value="MEDIA">MEDIA</option>
                            <option value="BAJA">BAJA</option>
                          </select>
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Días estimados de gestión</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            class="form-control"
                            v-model.number="form.dias_estimados_gestion"
                            placeholder="Ej: 3"
                            required
                          />
                        </div>

                        <div class="col-12 col-md-4">
                          <label class="form-label">Centro de costo</label>

                          <div v-if="!Object.keys(centrosDisponibles).length" class="alert alert-warning py-2 small mb-2">
                            No tienes contratos asignados. Solicita a un administrador que te asigne uno o más.
                          </div>

                          <select
                            class="form-select"
                            v-model="form.numero_contrato"
                            @change="onCentroCosto"
                            :disabled="!Object.keys(centrosDisponibles).length"
                            required
                          >
                            <option value="" disabled>Selecciona centro de costo</option>
                            <option v-for="(label, code) in centrosDisponibles" :key="code" :value="code">
                              {{ code }} — {{ label }}
                            </option>
                          </select>

                          <div class="form-text">
                            Guardado: <strong>{{ form.nombre_centro_costo || "-" }}</strong>
                          </div>
                        </div>

                        <div class="col-12 col-md-8">
                          <label class="form-label">Cotizadores</label>

                          <select class="form-select" multiple v-model="form.dirigidoA" :disabled="loadingCotizadores || !cotizadoresFiltrados.length">
                            <option v-for="u in cotizadoresFiltrados" :key="u.uid" :value="u.fullName">
                              {{ u.fullName }}
                            </option>
                          </select>

                          <div class="form-text">
                            Puedes elegir más de uno.
                            <span v-if="loadingCotizadores" class="ms-2">
                              <span class="spinner-border spinner-border-sm"></span> Cargando cotizadores…
                            </span>
                          </div>

                          <div v-if="!loadingCotizadores && !cotizadoresFiltrados.length" class="alert alert-warning py-2 small mt-2">
                            No hay cotizadores configurados (activos/disponibles) para <strong>{{ form.empresa }}</strong>.
                          </div>

                          <div v-if="form.dirigidoA?.length" class="mt-2">
                            <span v-for="u in form.dirigidoA" :key="u" class="badge rounded-pill text-bg-light border me-1 mb-1">
                              <i class="bi bi-person-circle me-1"></i>{{ u }}
                            </span>
                          </div>
                        </div>
                                                  <div>
                            <div class="form-check mb-2">
                              <input id="chkAdj" class="form-check-input" type="checkbox" v-model="requiereAutorizacion" />
                              <label class="form-check-label" for="chkAdj">Subir archivos adicionales (opcional)</label>
                            </div>

                            <div
                              v-if="requiereAutorizacion"
                              class="dropzone"
                              :class="{ 'is-dragover': isDragging }"
                              @click="$refs.inputAdjuntos.click()"
                              @dragover.prevent="onDragOver"
                              @dragleave="onDragLeave"
                              @drop.prevent="onDrop"
                            >
                              <i class="bi bi-cloud-arrow-up me-2 fs-5"></i>
                              <div class="dz-text">
                                <strong>Subir archivos o carpetas</strong>
                                <div class="small text-secondary">
                                  PDF, JPG/PNG, XLS/XLSX, CSV, <b>ZIP</b>, <b>RAR</b> · hasta {{ MAX_FILES }} archivos · máx {{ MAX_SIZE_MB }} MB c/u · total
                                  {{ MAX_TOTAL_MB }} MB
                                </div>
                              </div>

                              <div class="ms-auto d-flex gap-2">
                                <button
                                  class="btn btn-sm btn-outline-primary"
                                  type="button"
                                  @click.stop="$refs.inputAdjuntos.click()"
                                  title="Seleccionar archivos"
                                >
                                  <i class="bi bi-file-earmark-plus"></i> Archivos
                                </button>
                                <button
                                  class="btn btn-sm btn-outline-secondary"
                                  type="button"
                                  @click.stop="$refs.inputFolder.click()"
                                  title="Seleccionar carpeta"
                                >
                                  <i class="bi bi-folder-plus"></i> Carpeta
                                </button>
                              </div>

                              <input
                                ref="inputAdjuntos"
                                type="file"
                                class="d-none"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv,.zip,.rar"
                                @change="subirAdjuntos"
                              />
                              <input ref="inputFolder" type="file" class="d-none" webkitdirectory directory @change="subirCarpeta" />

                              <div v-if="uploadingAdjuntos" class="dz-loading">
                                <div class="dz-loading-box">
                                  <div class="spinner-border me-2" role="status"></div>
                                  <div class="flex-grow-1">
                                    <div class="small fw-semibold">Subiendo archivos… {{ uploadedCount }}/{{ uploadTotal }}</div>
                                    <div class="progress mt-1" style="height: 6px">
                                      <div class="progress-bar" role="progressbar" :style="{ width: totalProgress + '%' }"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div v-if="form.autorizaciones?.length" class="mt-2 d-flex flex-wrap gap-2">
                              <div
                                v-for="(f, idx) in form.autorizaciones"
                                :key="f.url + idx"
                                class="file-pill alert alert-light d-flex align-items-center mb-0"
                                style="gap: 0.5rem"
                              >
                                <i class="bi bi-paperclip"></i>
                                <a :href="f.url" target="_blank" rel="noopener" class="text-decoration-none me-1">
                                  {{ f.nombre }}
                                </a>
                                <span class="badge text-bg-light border">{{ f.tipo || "archivo" }}</span>
                                <span v-if="f.tamano" class="small text-muted">· {{ (f.tamano / 1024 / 1024).toFixed(1) }} MB</span>
                                <button class="btn btn-sm btn-outline-danger ms-2" @click="eliminarAdjunto(idx)" title="Eliminar">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>

                            <div v-if="form.autorizaciones?.length" class="mt-2">
                              <button class="btn btn-sm btn-outline-danger" @click="limpiarAdjuntos">Limpiar adjuntos</button>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </section>
        </div>

        <div v-if="showEquiposCard" class="col-12 col-lg-4">
          <section class="card card-elevated side-card">
            <div class="card-header d-flex align-items-center justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-truck-front fs-5"></i>
                <div class="min-w-0">
                  <div class="fw-semibold">Buscador de equipos</div>
                </div>
              </div>

              <button class="btn btn-sm btn-outline-danger" type="button" @click="showEquiposCard = false" title="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="card-body p-3">
              <div class="mb-2">
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                  <input
                    class="form-control"
                    v-model="busquedaEquipo"
                    placeholder="Ej: CAT · 950 · Calama · Komatsu · PC200 · chasis 9BW..."
                    @input="aplicarFiltrosEquiposDebounced"
                    @keydown.enter.prevent="buscarEquipos(busquedaEquipo)"
                  />
                  <button class="btn btn-outline-secondary" type="button" @click="clearEquiposSearch" title="Limpiar">
                    <i class="bi bi-eraser"></i>
                  </button>
                  <button class="btn btn-outline-dark" type="button" @click="buscarEquipos(busquedaEquipo)" :disabled="cargandoEquipos || normEq(busquedaEquipo).length < 2">
                    <i class="bi bi-search"></i>
                  </button>
                </div>

                <div class="form-text">
                  Escribe al menos <b>2 caracteres</b>.
                </div>
              </div>

              <div v-if="equiposError" class="alert alert-danger py-2 small mb-2">
                {{ equiposError }}
              </div>

              <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
                <div class="small text-secondary">
                  <i class="bi bi-funnel me-1"></i>
                  Resultados: <strong>{{ resultadosEquipos.length }}</strong>
                  <span v-if="cargandoEquipos" class="ms-2"><span class="spinner-border spinner-border-sm"></span> Buscando…</span>
                </div>

                <div v-if="resultadosEquipos.length" class="ms-auto small text-secondary">
                  Página <strong>{{ currentPage }}</strong> / <strong>{{ totalPages }}</strong>
                </div>
              </div>

              <div v-if="!cargandoEquipos" class="equipos-list">
                <div v-for="eq in pagedEquipos" :key="eq._id || eq.id" class="equipos-item">
                  <div class="equipos-main min-w-0">
                    <div class="equipos-title">
                      <div class="fw-semibold equipo-wrap">
                        {{ eq.equipo || "Equipo" }}
                      </div>
                      <div class="small text-secondary">
                        {{ eq.modelo || "" }}
                      </div>
                    </div>
                    <div class="badge-wrap mt-2">
                      <span v-if="eq.numero_interno" class="badge text-bg-light border">
                        <i class="bi bi-123 me-1"></i>{{ eq.numero_interno }}
                      </span>
                      <span v-if="eq.clasificacion1" class="badge text-bg-light border">
                        <i class="bi bi-tag me-1"></i>{{ eq.clasificacion1 }}
                      </span>
                      <span v-if="eq.localizacion" class="badge text-bg-light border">
                        <i class="bi bi-geo-alt me-1"></i>{{ eq.localizacion }}
                      </span>
                      <span v-if="eq.marca || eq.modelo" class="badge text-bg-light border">
                        <i class="bi bi-tools me-1"></i>{{ [eq.marca, eq.modelo].filter(Boolean).join(" ") }}
                      </span>
                      <span v-if="eq.codigo" class="badge text-bg-light border">
                        <i class="bi bi-upc me-1"></i>{{ eq.codigo }}
                      </span>
                      <span v-if="eq.numero_chasis" class="badge text-bg-light border">
                        <i class="bi bi-hash me-1"></i>{{ eq.numero_chasis }}
                      </span>
                    </div>
                  </div>

                  <div class="equipos-actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="copiarEquipo(eq)" title="Copiar información del equipo">
                      <i class="bi bi-clipboard"></i>
                      <span class="d-none d-md-inline ms-1">Copiar info</span>
                    </button>
                  </div>
                </div>

                <div v-if="busquedaEquipo && !resultadosEquipos.length && !cargandoEquipos" class="text-center text-secondary py-3">
                  No hay resultados con “{{ busquedaEquipo }}”.
                </div>

                <div v-if="!busquedaEquipo" class="text-center text-secondary py-3">
                  Ingresa una búsqueda para ver resultados.
                </div>
              </div>

              <nav v-if="resultadosEquipos.length > pageSize" class="mt-2">
                <ul class="pagination pagination-sm mb-0 justify-content-center flex-wrap">
                  <li :class="['page-item', currentPage === 1 ? 'disabled' : '']">
                    <button class="page-link" @click="goToPage(currentPage - 1)">‹</button>
                  </li>

                  <li v-for="p in visiblePageButtons" :key="p" :class="['page-item', currentPage === p ? 'active' : '']">
                    <button class="page-link" @click="goToPage(p)">{{ p }}</button>
                  </li>

                  <li :class="['page-item', currentPage === totalPages ? 'disabled' : '']">
                    <button class="page-link" @click="goToPage(currentPage + 1)">›</button>
                  </li>
                </ul>
              </nav>
            </div>
          </section>
        </div>
      </div>

      <section class="card card-elevated mt-4">
        <div class="card-header">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h2 class="h6 mb-0 fw-semibold">Tabla de ítems</h2>
              <small class="text-secondary">Descripción, cantidades, prioridad y datos referenciales.</small>
            </div>
            <div class="d-flex gap-2 w-auto align-items-center flex-wrap">
                <button
                  class="btn btn-outline-success btn-sm"
                  type="button"
                  @click="descargarPlantillaItems"
                  title="Descargar plantilla vacía"
                >
                  <i class="bi bi-file-earmark-excel me-1"></i>
                  Descargar plantilla
                </button>
              <input ref="inputExcel" type="file" class="d-none" accept=".xlsx,.xls,.csv" @change="onExcelSeleccionado" />
              <button class="btn btn-outline-dark btn-sm" type="button" :disabled="importandoExcel" @click="$refs.inputExcel.click()" title="Carga masiva (Excel/CSV)">
                <i class="bi bi-filetype-xlsx me-1"></i> Carga masiva
              </button>

              <button class="btn btn-outline-secondary btn-sm" @click="agregarFila" title="Agregar fila">
                <i class="bi bi-plus-lg"></i>
              </button>
              <button class="btn btn-success btn-sm" :disabled="enviandoSolpe" @click="guardarSolped" title="Enviar">
                <i v-if="!enviandoSolpe" class="bi bi-send-fill"></i>
                <span v-else class="d-inline-flex align-items-center">
                  <span class="spinner-border spinner-border-sm me-1"></span> Enviando…
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-0 position-relative">
          <transition name="fade">
            <div v-if="importandoExcel" class="import-overlay">
              <div class="import-box">
                <div class="spinner-border me-2" role="status"></div>
                <div class="flex-grow-1">
                  <div class="small fw-semibold">Cargando ítems desde Excel…</div>
                  <div class="small text-secondary">
                    Procesados: {{ importProgreso.procesados }} / {{ importProgreso.total }} · Agregados:
                    {{ importProgreso.agregados }} · Duplicados: {{ importProgreso.duplicados }}
                  </div>
                  <div class="progress mt-2" style="height: 6px">
                    <div class="progress-bar" role="progressbar" :style="{ width: importProgresoPct + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 responsive-stack">
              <thead>
                <tr>
                  <th style="width: 56px">#</th>
                  <th>Descripción</th>
                  <th style="width: 160px">Código</th>
                  <th style="width: 120px">Cantidad</th>
                  <th style="width: 120px">Stock</th>
                  <th style="width: 180px">N° Interno / Patente</th>
                  <th style="width: 130px">Prioridad</th>
                  <th style="width: 180px">Imagen</th>
                  <th style="width: 110px">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(item, i) in form.items" :key="item.id">
                  <td class="text-secondary" :data-label="'#'">{{ i + 1 }}</td>

                  <td class="position-relative" :data-label="'Descripción'">
                    <div class="input-group input-group-sm">
                      <span class="input-group-text bg-light">
                        <i class="bi bi-search"></i>
                      </span>
                      <textarea
                        class="form-control desc-autogrow"
                        rows="1"
                        v-model="item.descripcion"
                        @focus="onDescFocus(i, $event)"
                        @blur="onDescBlur(i, $event)"
                        @input="onDescInput(i, $event)"
                        @keydown="onDescKeydown(i, $event)"
                        placeholder="Buscar o escribir descripción…"
                        autocomplete="off"
                      ></textarea>
                      <button
                        v-if="item.descripcion && (suggests[i]?.length || suggestLoading[i])"
                        class="btn btn-outline-secondary"
                        type="button"
                        @mousedown.prevent
                        @click="closeSuggest(i)"
                        title="Cerrar sugerencias"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>

                    <div v-if="isSuggestOpen(i)" class="suggest-popover card">
                      <div class="suggest-header d-flex align-items-center justify-content-between px-2 py-1">
                        <small class="text-muted">
                          <i class="bi bi-lightning-charge me-1"></i>
                          Sugerencias (↑/↓, Enter)
                        </small>
                        <small v-if="suggestLoading[i]" class="text-muted">
                          <span class="spinner-border spinner-border-sm me-1"></span>Buscando…
                        </small>
                        <small v-else class="text-muted">{{ suggests[i]?.length || 0 }}</small>
                      </div>

                      <ul class="list-group list-group-flush">
                        <li v-if="!suggestLoading[i] && !(suggests[i]?.length)" class="list-group-item py-2 text-muted">
                          Sin sugerencias
                        </li>
                        <li
                          v-for="(s, idx) in suggests[i]"
                          :key="s.text || s"
                          class="list-group-item suggest-item d-flex align-items-center justify-content-between"
                          :class="{ 'is-active': suggestActive[i] === idx }"
                          @mouseenter="suggestActive[i] = idx"
                          @mousedown.prevent
                          @click="onSuggestClick(i, idx)"
                          @dblclick="aplicarSugerencia(i, s.text || s)"
                        >
                          <div class="me-2 text-truncate" v-html="renderSuggestMatch(i, s)"></div>
                          <span v-if="s.usos" class="badge rounded-pill text-bg-light border">
                            {{ s.usos }} usos
                          </span>
                        </li>
                      </ul>
                    </div>
                  </td>

                  <td :data-label="'Código'">
                    <input
                      class="form-control form-control-sm"
                      v-model="item.codigo_referencial"
                      @input="item.codigo_referencial = (item.codigo_referencial || '').toUpperCase()"
                      placeholder="Opcional"
                    />
                  </td>

                  <td :data-label="'Cantidad'">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      class="form-control form-control-sm"
                      v-model.number="item.cantidad"
                      placeholder="1"
                      @input="clampCantidad(i)"
                      @blur="ensureCantidad(i)"
                    />
                  </td>

                  <td :data-label="'Stock'">
                    <input type="number" min="0" class="form-control form-control-sm" v-model.number="item.stock" placeholder="0" />
                  </td>

                  <td :data-label="'N° Interno / Patente'">
                    <input
                      class="form-control form-control-sm"
                      v-model="item.numero_interno"
                      @blur="onNumeroInternoBlur(i)"
                      @input="item.numero_interno = (item.numero_interno || '').toUpperCase()"
                      placeholder="ABC-123"
                    />
                  </td>

                  <td :data-label="'Prioridad'">
                    <select class="form-select form-select-sm" v-model="item.prioridad">
                      <option value="ALTA">ALTA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="BAJA">BAJA</option>
                    </select>
                  </td>

                  <td :data-label="'Imagen'">
                    <input :ref="(el) => (inputImagenRefs[i] = el)" type="file" class="d-none" accept="image/*" @change="(e) => subirImagenItem(e, i)" />

                    <div
                      class="img-drop"
                      :class="{
                        'is-dragover': getRowUpload(i).dragover,
                        'is-loading': getRowUpload(i).uploading
                      }"
                      @dragover.prevent="onImgDragOver(i)"
                      @dragleave.prevent="onImgDragLeave(i)"
                      @drop.prevent="onImgDrop($event, i)"
                      @click="() => !item.imagen_url && inputImagenRefs[i]?.click()"
                    >
                      <template v-if="item.imagen_url">
                        <img :src="item.imagen_url" alt="img" class="thumb" />
                        <div class="btn-group btn-group-sm ms-2">
                          <button class="btn btn-outline-secondary" @click="() => inputImagenRefs[i]?.click()" title="Cambiar imagen">
                            <i class="bi bi-image"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click.stop="eliminarImagenItem(i)" title="Eliminar imagen">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </template>

                      <template v-else>
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-image"></i>
                          <span class="small text-secondary">Arrastra una imagen aquí o selecciona una</span>
                        </div>
                      </template>

                      <div v-if="getRowUpload(i).uploading" class="img-loading">
                        <div class="img-loading-box">
                          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                          <div class="flex-grow-1">
                            <div class="small fw-semibold">Subiendo imagen… {{ getRowUpload(i).progress }}%</div>
                            <div class="progress mt-1" style="height: 6px">
                              <div class="progress-bar" role="progressbar" :style="{ width: getRowUpload(i).progress + '%' }"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td :data-label="'Acciones'">
                    <div class="btn-group btn-group-sm w-100 w-sm-auto">
                      <button class="btn btn-outline-primary" @click="guardarFila(i)" title="Guardar fila"><i class="bi bi-save"></i></button>
                      <button class="btn btn-outline-danger" @click="eliminarFila(i)" title="Eliminar fila"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!form.items.length">
                  <td colspan="9" class="text-center text-secondary py-4">No hay ítems. Usa “+”.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
        <i
          class="me-2"
          :class="
            t.type === 'success'
              ? 'bi bi-check-circle-fill'
              : t.type === 'warning'
              ? 'bi bi-exclamation-triangle-fill'
              : 'bi bi-x-circle-fill'
          "
        ></i>
        <span class="me-3">{{ t.text }}</span>
        <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { db, storage } from "../stores/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  setDoc,
  doc,
  increment,
  arrayUnion,
  getDoc,
  startAt,
  endAt,
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../stores/authService";
import * as XLSX from 'xlsx-js-style';

export default {
  name: "SolpedPlantas",
  setup() {
    const auth = useAuthStore();

    const EMPRESA_FIJA = "Xtreme Servicio";
    const COUNTER_DOC_ID = "solpeds_plantas";

    const userFullName = ref("");
    const usuarioNombre = computed(() => userFullName.value || "");
    const uid = computed(() => auth?.user?.uid || "");
    const centrosAsignados = ref([]);

    const MAX_FILES = 10;
    const MAX_SIZE_MB = 25;
    const MAX_TOTAL_MB = 100;
    const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "pdf", "xls", "xlsx", "csv", "zip", "rar"]);

    const CENTROS_PLANTAS_APROBACION = [
      "BETON_CALAMA",
      "FLUMECAR_CALAMA",
      "URBANA_CALAMA",
      "KM13_ANDINA",
      "NV17_ANDINA",
      "SAN_BERNARDO",
      "ARIDO_NOS",
      "OLIVAR",
      "CANECHE",
      "COLON",
      "AGUA_DULCE",
      "ESMERALDA",
      "ESTOCADA_8",
      "OP14",
      "ANDES_NORTE",
      "CHANCHADO"
    ];

    const centrosCosto = {
      "BETON_CALAMA": "PLANTA BETON CALAMA",
      "FLUMECAR_CALAMA": "PLANTA FLUMECAR CALAMA",
      "URBANA_CALAMA": "PLANTA URBANA CALAMA",
      "KM13_ANDINA": "PLANTA KM13 ANDINA",
      "NV17_ANDINA": "PLANTA NV17 ANDINA",
      "SAN_BERNARDO": "PLANTA SAN BERNARDO",
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

    const centrosDisponibles = computed(() => {
      const out = {};
      const asg = Array.isArray(centrosAsignados.value) ? centrosAsignados.value : [];
      for (const code of asg) {
        if (centrosCosto[code]) out[code] = centrosCosto[code];
      }
      return out;
    });

    const loadUserFullName = async () => {
      try {
        const id = uid.value;
        if (!id) return;
        const snap = await getDoc(doc(db, "Usuarios", id));
        const data = snap.exists() ? snap.data() : null;
        userFullName.value = (data?.fullName || data?.fullname || "").toString().trim();

        const arr = Array.isArray(data?.centrosAsignados) ? data.centrosAsignados : [];
        centrosAsignados.value = arr.map((x) => String(x));
      } catch (e) {
        console.warn("No se pudo obtener fullName/contratos de Usuarios:", e);
      }
    };

    const nowLocal = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    const setNow = () => (form.fecha = nowLocal());

    const normalize = (v) =>
      (v || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\/\s\-\._]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const toDocId = (norm) => norm.replace(/\//g, "_");

    const form = reactive({
      numero_solpe: null,
      empresa: EMPRESA_FIJA,
      fecha: nowLocal(),
      nombre_solped: "",
      tipo_solped: "",
      prioridad_solped: "MEDIA",
      dias_estimados_gestion: 1,
      dirigidoA: [],
      numero_contrato: "",
      nombre_centro_costo: "",
      autorizaciones: [],
      items: [],
      estatus: "Pendiente",
      tipo_flujo: "planta",
      requiereAprobacionSolped: false,
      estadoAprobacionSolped: null,
      aprobadorSolped: "",
      comentario_aprobacion_solped: ""
    });

    const requiereAutorizacion = ref(false);
    const inputImagenRefs = reactive({});
    const error = ref("");
    const okMsg = ref("");
    const enviandoSolpe = ref(false);
    const loadingNumero = ref(false);

    const suggests = reactive({});
    const timers = reactive({});
    const focusRow = ref(-1);

    const toasts = ref([]);
    const addToast = (type, text, timeout = 3500) => {
      const id = Date.now() + Math.random();
      toasts.value.push({ id, type, text });
      setTimeout(() => closeToast(id), timeout);
    };
    const closeToast = (id) => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    };

    const showEquiposCard = ref(false);
    const busquedaEquipo = ref("");
    const cargandoEquipos = ref(false);
    const resultadosEquipos = ref([]);
    const pageSize = 5;
    const currentPage = ref(1);
    let debounceTimer = null;
    let lastSearchToken = 0;
    const cacheResultados = new Map();

    const totalPages = computed(() => Math.max(1, Math.ceil(resultadosEquipos.value.length / pageSize)));
    const visiblePageButtons = computed(() => {
      const maxButtons = 7;
      const pages = [];
      let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
      let end = Math.min(totalPages.value, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    });
    const pagedEquipos = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      return resultadosEquipos.value.slice(start, start + pageSize);
    });
    const goToPage = (n) => {
      if (n < 1 || n > totalPages.value) return;
      currentPage.value = n;
    };

    const equiposError = ref("");

    const normEq = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const normEqCompact = (s) => normEq(s).replace(/[^a-z0-9]/g, "");

    function lev(a, b) {
      a = String(a || "").slice(0, 64);
      b = String(b || "").slice(0, 64);
      const m = Array.from({ length: a.length + 1 }, (_, i) => {
        const row = new Array(b.length + 1);
        row[0] = i;
        return row;
      });
      for (let j = 0; j <= b.length; j++) m[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
        }
      }
      return m[a.length][b.length];
    }

    const variantesDe = (s) => {
      const raw = String(s || "").trim();
      const v = normEq(raw);
      const compact = normEqCompact(raw);
      const start = v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
      const out = new Set([raw, v, raw.toUpperCase(), start]);

      const m = compact.match(/^([a-z]+)(\d+)$/i);
      if (m) {
        const letras = m[1];
        out.add(letras);
        out.add(letras.toUpperCase());
        out.add(letras + "-");
        out.add(letras.toUpperCase() + "-");
        out.add(letras + " ");
        out.add(letras.toUpperCase() + " ");
      }

      const tokens = v.split(/\s+/).filter(Boolean);
      if (tokens[0] && tokens[0].length >= 2) {
        out.add(tokens[0]);
        out.add(tokens[0].toUpperCase());
      }

      return [...out].filter(Boolean);
    };

    const adaptEquipo = (raw, _id) => ({
      _id: _id || raw.id || raw._id || String(Math.random()),
      clasificacion1: String(raw.clasificacion1 || raw.clasificacion || raw.clase || ""),
      codigo: String(raw.codigo || raw.cod || raw.code || raw.codigo_equipo || raw.codigo_interno || ""),
      equipo: String(raw.equipo || raw.nombre || raw.name || raw.descripcion || ""),
      localizacion: String(raw.localizacion || raw.ubicacion || raw.location || ""),
      marca: String(raw.marca || raw.brand || ""),
      modelo: String(raw.modelo || raw.model || ""),
      numero_chasis: String(raw.numero_chasis || raw.chasis || raw.vin || raw.numeroSerie || raw.n_serie || ""),
      numero_interno: String(raw.numero_interno || raw.n_interno || raw.patente || ""),
      tipo_equipo: String(raw.tipo_equipo || raw.tipo || "")
    });

    function scoreEquipo(e, qNorm) {
      const qCompact = normEqCompact(qNorm);
      const fields = [
        { key: "numero_interno", w: 1200 },
        { key: "codigo", w: 1000 },
        { key: "equipo", w: 800 },
        { key: "marca", w: 650 },
        { key: "modelo", w: 650 },
        { key: "numero_chasis", w: 900 },
        { key: "localizacion", w: 500 },
        { key: "clasificacion1", w: 450 }
      ];

      let best = 0;
      for (const f of fields) {
        const raw = e[f.key] || "";
        if (!raw) continue;

        const v = normEq(raw);
        const c = normEqCompact(raw);

        if (v === qNorm) best = Math.max(best, f.w);
        if (c && qCompact && c === qCompact) best = Math.max(best, f.w + 80);
        if (v.startsWith(qNorm)) best = Math.max(best, f.w - 120);
        if (c && qCompact && c.startsWith(qCompact)) best = Math.max(best, f.w - 80);
        if (v.includes(qNorm)) best = Math.max(best, f.w - 260);
        if (c && qCompact && c.includes(qCompact)) best = Math.max(best, f.w - 180);
        const dist = lev(c || v, qCompact || qNorm);
        if (dist <= 2) best = Math.max(best, 260 - dist * 50);
      }

      return best;
    }

    const camposBusqueda = [
      "numero_interno",
      "clasificacion1",
      "codigo",
      "equipo",
      "localizacion",
      "marca",
      "modelo",
      "numero_chasis"
    ];

    const clearEquiposSearch = () => {
      equiposError.value = "";
      busquedaEquipo.value = "";
      resultadosEquipos.value = [];
      currentPage.value = 1;
    };

    const aplicarFiltrosEquiposDebounced = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = (busquedaEquipo.value || "").trim();
        if (q.length >= 2) buscarEquipos(q);
        else {
          resultadosEquipos.value = [];
          currentPage.value = 1;
        }
      }, 450);
    };

    const buscarEquipos = async (q) => {
      const qNorm = normEq(q);
      currentPage.value = 1;
      equiposError.value = "";

      if (!qNorm || qNorm.length < 2) {
        resultadosEquipos.value = [];
        return;
      }

      if (cacheResultados.has(qNorm)) {
        resultadosEquipos.value = cacheResultados.get(qNorm);
        return;
      }

      const pref = [...cacheResultados.keys()].find((k) => qNorm.startsWith(k) && k.length >= 2);
      if (pref) {
        const base = cacheResultados.get(pref) || [];
        const filtradosLocal = base.filter((e) => {
          const vals = [
            e.codigo,
            e.equipo,
            e.marca,
            e.modelo,
            e.numero_chasis,
            e.localizacion,
            e.clasificacion1
          ]
            .filter(Boolean)
            .map((v) => normEq(v));
          return vals.some((v) => v.includes(qNorm));
        });

        if (filtradosLocal.length >= 10) {
          resultadosEquipos.value = filtradosLocal
            .map((r) => ({ r, s: scoreEquipo(r, qNorm) }))
            .sort((a, b) => b.s - a.s)
            .map((x) => x.r);
          cacheResultados.set(qNorm, resultadosEquipos.value);
          return;
        }
      }

      const token = ++lastSearchToken;
      cargandoEquipos.value = true;

      try {
        const variantes = variantesDe(q);
        const vistos = new Set();
        const acumulado = [];

        const perCampo = async (campo) => {
          const promesas = variantes.map(async (v) => {
            try {
              const qref = query(
                collection(db, "equipos"),
                orderBy(campo),
                startAt(v),
                endAt(v + "\uf8ff"),
                limit(25)
              );
              const snap = await getDocs(qref);

              for (const d of snap.docs) {
                const item = adaptEquipo(d.data() || {}, d.ref.path);
                if (!vistos.has(item._id)) {
                  vistos.add(item._id);
                  acumulado.push(item);
                }
              }
            } catch (e) {
              console.error(`[equipos] error campo "${campo}":`, e);
            }
          });
          await Promise.all(promesas);
        };

        const criticos = ["numero_interno", "codigo", "numero_chasis", "equipo", "marca", "modelo"];
        const secundarios = camposBusqueda.filter((c) => !criticos.includes(c));

        await Promise.all(criticos.map(perCampo));
        if (acumulado.length < 60) await Promise.all(secundarios.map(perCampo));

        if (token !== lastSearchToken) return;

        const rankeados = acumulado
          .map((r) => ({ r, s: scoreEquipo(r, qNorm) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .map((x) => x.r);

        const finales = rankeados.length
          ? rankeados
          : acumulado.filter((e) => {
              const vals = [
                e.numero_interno,
                e.codigo,
                e.equipo,
                e.marca,
                e.modelo,
                e.numero_chasis,
                e.localizacion,
                e.clasificacion1
              ]
                .filter(Boolean)
                .map((v) => normEq(v));
              const qCompact = normEqCompact(qNorm);
              return vals.some((v) => {
                const n = normEq(v);
                const c = normEqCompact(v);
                return n.includes(qNorm) || (qCompact && c.includes(qCompact));
              });
            });

        const out = finales.slice(0, 200);
        resultadosEquipos.value = out;
        cacheResultados.set(qNorm, out);
      } catch (e) {
        console.error("Error en búsqueda de equipos:", e);
        addToast("danger", "Error al buscar equipos.");
        equiposError.value = "No se pudo buscar en la colección equipos.";
        resultadosEquipos.value = [];
      } finally {
        if (token === lastSearchToken) cargandoEquipos.value = false;
      }
    };

    const copiarEquipo = async (e) => {
      const texto = `Clasificación: ${e.clasificacion1 || "—"}
        Código: ${e.codigo || "—"}
        Equipo: ${e.equipo || "—"}
        Marca: ${e.marca || "—"}
        Modelo: ${e.modelo || "—"}
        N° Chasis: ${e.numero_chasis || "—"}
        Localización: ${e.localizacion || "—"}`;
      try {
        await navigator?.clipboard?.writeText(texto);
        addToast("success", "Datos copiados al portapapeles.");
      } catch {
        addToast("warning", "No se pudo copiar. Selecciona y copia manualmente.");
      }
    };

    const toggleEquiposCard = () => {
      showEquiposCard.value = !showEquiposCard.value;
    };

    const onSuggestClick = (i, idx) => {
      suggestOpen[i] = true;
      suggestActive[i] = idx;
    };

    const isDragging = ref(false);
    const uploadingAdjuntos = ref(false);
    const totalProgress = ref(0);
    const uploadTotal = ref(0);
    const uploadedCount = ref(0);
    const perFileProgress = ref([]);

    const rowUpload = reactive({});
    const getRowUpload = (i) => {
      if (!rowUpload[i]) rowUpload[i] = { uploading: false, progress: 0, dragover: false };
      return rowUpload[i];
    };

    const onImgDragOver = (i) => {
      getRowUpload(i).dragover = true;
    };
    const onImgDragLeave = (i) => {
      getRowUpload(i).dragover = false;
    };
    const onImgDrop = (ev, i) => {
      const file = Array.from(ev?.dataTransfer?.files || []).find((f) => (f.type || "").startsWith("image/"));
      if (file) subirImagenItemFile(file, i);
      getRowUpload(i).dragover = false;
    };

    const inputExcel = ref(null);
    const importandoExcel = ref(false);
    const importProgreso = reactive({ total: 0, procesados: 0, agregados: 0, duplicados: 0 });
    const importProgresoPct = computed(() => {
      if (!importProgreso.total) return 0;
      const pct = Math.round((importProgreso.procesados / importProgreso.total) * 100);
      return isFinite(pct) ? pct : 0;
    });

    const normalizeHeader = (h) => {
      const s = (h || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s\/°#.-]/g, "")
        .trim();
      if (/^desc(ripcion)?|^description|^desc\b/.test(s)) return "descripcion";
      if (/^cod(igo)?|^code\b/.test(s)) return "codigo";
      if (/^cant(idad)?|^qty\b|solicitada/.test(s)) return "cantidad";
      if (/^stock|existenc/.test(s)) return "stock";
      if (/(n|num|numero)\s*interno/.test(s)) return "numero_interno";
      if (/patente|placa/.test(s)) return "numero_interno";
      if (/interno\/?patente|n°\s*interno/.test(s)) return "numero_interno";
      if (/^prioridad|prio\b/.test(s)) return "prioridad";
      return s;
    };
const descargarPlantillaItems = () => {
  try {
    const headers = [[
      "DESCRIPCIÓN",
      "CÓDIGO",
      "CANTIDAD",
      "STOCK",
      "N° INTERNO / PATENTE",
      "PRIORIDAD"
    ]];

    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();

    ws["!cols"] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 14 }
    ];

    const borderThin = {
      top: { style: "thin", color: { rgb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { rgb: "FFD1D5DB" } },
      left: { style: "thin", color: { rgb: "FFD1D5DB" } },
      right: { style: "thin", color: { rgb: "FFD1D5DB" } }
    };

    for (let c = 0; c < 6; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });

      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: {
          bold: true,
          color: { rgb: "FFFFFFFF" },
          sz: 11
        },
        fill: {
          fgColor: { rgb: "FF1F2937" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: borderThin
      };
    }

    ws["!rows"] = [{ hpt: 24 }];

    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Items");
    XLSX.writeFile(wb, "Plantilla_Items_SOLPED_Plantas.xlsx");

    addToast("success", "Plantilla descargada correctamente.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo descargar la plantilla.");
  }
};
    const leerSheetComoObjetos = (wb) => {
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
      if (!rows.length) return [];

      const headersRaw = rows[0].map(normalizeHeader);
      const idx = {
        descripcion: headersRaw.findIndex((h) => h === "descripcion"),
        codigo: headersRaw.findIndex((h) => h === "codigo"),
        cantidad: headersRaw.findIndex((h) => h === "cantidad"),
        stock: headersRaw.findIndex((h) => h === "stock"),
        numero_interno: headersRaw.findIndex((h) => h === "numero_interno"),
        prioridad: headersRaw.findIndex((h) => h === "prioridad")
      };

      const data = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const get = (i) => (i >= 0 && i < row.length ? row[i] : "");
        const descripcion = String(get(idx.descripcion) || "").trim();
        const codigo = String(get(idx.codigo) || "").trim();
        const cantidad = Number(String(get(idx.cantidad) || "").toString().replace(",", "."));
        const stock = Number(String(get(idx.stock) || "").toString().replace(",", "."));
        const numero_interno = String(get(idx.numero_interno) || "").trim();
        const prioridad = String(get(idx.prioridad) || "").trim().toUpperCase();

        const vacia = !descripcion && !codigo && !numero_interno && !cantidad && !stock;
        if (vacia) continue;

        data.push({
          descripcion,
          codigo,
          cantidad: isNaN(cantidad) ? null : cantidad,
          stock: isNaN(stock) ? null : stock,
          numero_interno,
          prioridad: ["ALTA", "MEDIA", "BAJA"].includes(prioridad) ? prioridad : "MEDIA"
        });
      }
      return data;
    };

    const onExcelSeleccionado = async (ev) => {
      const file = ev?.target?.files?.[0];
      ev.target.value = "";
      if (!file) return;

      try {
        importandoExcel.value = true;
        Object.assign(importProgreso, { total: 0, procesados: 0, agregados: 0, duplicados: 0 });

        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: "array" });

        const objetos = leerSheetComoObjetos(wb);
        importProgreso.total = objetos.length;

        if (!objetos.length) {
          addToast("danger", "El archivo no contiene filas válidas.");
          importandoExcel.value = false;
          return;
        }

        const codExist = new Set(
          (form.items || [])
            .map((i) => (i.codigo_referencial || "").toUpperCase().trim())
            .filter(Boolean)
        );

        for (const obj of objetos) {
          const desc = (obj.descripcion || "").toString().toUpperCase();
          const cod = (obj.codigo || "").toString().toUpperCase();
          const nro = (obj.numero_interno || "").toString().toUpperCase();
          const cant = obj.cantidad != null && obj.cantidad !== "" ? Number(obj.cantidad) : null;
          const stk = obj.stock != null && obj.stock !== "" ? Number(obj.stock) : null;
          const prioridad = ["ALTA", "MEDIA", "BAJA"].includes(obj.prioridad) ? obj.prioridad : "MEDIA";

          if (!desc && !nro) {
            importProgreso.procesados++;
            continue;
          }

          if (cod && codExist.has(cod)) {
            importProgreso.duplicados++;
            importProgreso.procesados++;
            continue;
          }

          const nid = form.items.length ? form.items[form.items.length - 1].id + 1 : 1;
          form.items.push({
            id: nid,
            descripcion: desc,
            codigo_referencial: cod,
            cantidad: isNaN(cant) ? 1 : Math.max(1, Math.floor(cant)),
            stock: isNaN(stk) ? null : stk,
            numero_interno: nro,
            prioridad,
            imagen_url: ""
          });

          if (cod) codExist.add(cod);
          importProgreso.agregados++;
          importProgreso.procesados++;
        }

        addToast("success", `Carga masiva: ${importProgreso.agregados} agregado(s), ${importProgreso.duplicados} duplicado(s) por código.`);
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudo procesar el archivo. Verifica el formato.");
      } finally {
        importandoExcel.value = false;
      }
    };

    const loadingCotizadores = ref(false);
    const cotizadoresEmpresa = ref([]);
    let unsubCotizadores = null;

    const keyifyEmpresa = (name) =>
      String(name || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const todayISO = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    const isInVacationToday = (vacaciones = []) => {
      const t = todayISO();
      if (!Array.isArray(vacaciones)) return false;
      return vacaciones.some((v) => v?.from && v?.to && String(v.from) <= t && t <= String(v.to));
    };

    const cfgRootRef = doc(db, "configuracion", "aprobacion_oc_taller");
    const cfgEmpresasCol = collection(cfgRootRef, "empresas");

    const subscribeCotizadoresEmpresa = (empresaNombre) => {
      if (typeof unsubCotizadores === "function") unsubCotizadores();
      unsubCotizadores = null;

      cotizadoresEmpresa.value = [];
      if (!empresaNombre) return;

      loadingCotizadores.value = true;

      const empresaKey = keyifyEmpresa(empresaNombre);
      const empresaRef = doc(cfgEmpresasCol, empresaKey);
      const cotCol = collection(empresaRef, "cotizadores");
      const qCot = query(cotCol);

      unsubCotizadores = onSnapshot(
        qCot,
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((c) => c && c.activo !== false)
            .filter((c) => !isInVacationToday(c.vacaciones || []))
            .map((c) => ({
              uid: String(c.uid || c.id || ""),
              fullName: String(c.fullName || c.email || "—").trim(),
              email: String(c.email || "").trim(),
              activo: c.activo !== false,
              vacaciones: Array.isArray(c.vacaciones) ? c.vacaciones : []
            }))
            .filter((c) => c.uid || c.fullName)
            .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

          cotizadoresEmpresa.value = list;

          const allowed = new Set(list.map((x) => x.fullName));
          form.dirigidoA = (Array.isArray(form.dirigidoA) ? form.dirigidoA : []).filter((n) => allowed.has(n));

          loadingCotizadores.value = false;
        },
        (err) => {
          console.warn("No se pudieron cargar cotizadores:", err);
          cotizadoresEmpresa.value = [];
          loadingCotizadores.value = false;
        }
      );
    };

    const cotizadoresFiltrados = computed(() => cotizadoresEmpresa.value || []);

    const onCentroCosto = () => {
      const code = form.numero_contrato || "";
      form.nombre_centro_costo = centrosCosto[code] || "";
    };

    const cargarNumeroSolpedDesdeCounter = async () => {
      try {
        loadingNumero.value = true;
        error.value = "";
        const ctrRef = doc(db, "solpe_counters", COUNTER_DOC_ID);
        const snap = await getDoc(ctrRef);

        if (snap.exists()) {
          form.numero_solpe = Number(snap.data()?.next || 1);
        } else {
          await setDoc(ctrRef, { next: 1 }, { merge: true });
          form.numero_solpe = 1;
        }
      } catch (e) {
        console.error("Error al obtener número de SOLPED desde counter:", e);
        form.numero_solpe = null;
        error.value = "No se pudo obtener el número de SOLPED desde solpe_counters/solped_plantas.";
      } finally {
        loadingNumero.value = false;
      }
    };

    const applyDraft = async (draft) => {
      try {
        form.empresa = EMPRESA_FIJA;
        form.numero_contrato = draft.numero_contrato || "";
        form.nombre_centro_costo = draft.nombre_centro_costo || "";
        form.tipo_solped = draft.tipo_solped || "";
        form.prioridad_solped = draft.prioridad_solped || "MEDIA";
        form.dias_estimados_gestion = Number(draft.dias_estimados_gestion || 1);
        form.nombre_solped = (draft.nombre_solped || "").toUpperCase();
        form.dirigidoA = Array.isArray(draft.dirigidoA) ? draft.dirigidoA.slice(0) : [];
        form.items = (draft.items || []).map((it, idx) => ({
          id: idx + 1,
          descripcion: (it.descripcion || "").toUpperCase(),
          codigo_referencial: (it.codigo_referencial || "").toUpperCase(),
          cantidad: Number(it.cantidad || 0),
          stock: Number(it.stock || 0),
          numero_interno: (it.numero_interno || "").toUpperCase(),
          prioridad: it.prioridad || "MEDIA",
          imagen_url: it.imagen_url || ""
        }));
        if (!form.items.length) agregarFila();
        setNow();
        await cargarNumeroSolpedDesdeCounter();
        asegurarContratoPermitido();
        subscribeCotizadoresEmpresa(form.empresa);
      } catch (e) {
        console.error("No se pudo aplicar el borrador:", e);
        addToast("danger", "No se pudo aplicar el borrador.");
      }
    };

    const LOCAL_PREF_KEY = "solped_plantas_local_enabled";
    const localSaveEnabled = ref(true);

    const perCompanyKey = computed(() => `solped_plantas_local_${uid.value || "anon"}_${EMPRESA_FIJA}`);
    const lastKey = computed(() => `solped_plantas_local_last_${uid.value || "anon"}`);

    const suppressLocalSave = ref(false);
    const runWithoutAutosave = async (fn) => {
      const prev = suppressLocalSave.value;
      suppressLocalSave.value = true;
      try {
        await fn();
      } finally {
        suppressLocalSave.value = prev;
      }
    };

    let localTimer = null;

    const persistLocalSavePref = () => {
      localSaveEnabled.value = true;
      try {
        localStorage.setItem(LOCAL_PREF_KEY, "1");
      } catch (e) {
        console.error(e);
      }
    };

    const serializeForm = () => {
      const base = {
        empresa: EMPRESA_FIJA,
        nombre_solped: form.nombre_solped || "",
        tipo_solped: form.tipo_solped || "",
        prioridad_solped: form.prioridad_solped || "MEDIA",
        dias_estimados_gestion: Number(form.dias_estimados_gestion || 1),
        dirigidoA: Array.isArray(form.dirigidoA) ? form.dirigidoA : [],
        numero_contrato: form.numero_contrato || "",
        nombre_centro_costo: form.nombre_centro_costo || "",
        autorizaciones: Array.isArray(form.autorizaciones) ? form.autorizaciones : [],
        items: (Array.isArray(form.items) ? form.items : []).map((it) => ({
          id: it.id,
          descripcion: it.descripcion,
          codigo_referencial: it.codigo_referencial,
          cantidad: it.cantidad,
          stock: it.stock,
          numero_interno: it.numero_interno,
          prioridad: it.prioridad || "MEDIA",
          imagen_url: it.imagen_url
        })),
        estatus: form.estatus || "Pendiente",
        savedEmpresa: EMPRESA_FIJA,
        updatedAt: Date.now()
      };
      return JSON.stringify(base);
    };

    const clampCantidad = (i) => {
      const v = Number(form.items[i]?.cantidad ?? 1);
      if (!Number.isFinite(v) || v < 1) form.items[i].cantidad = 1;
      else form.items[i].cantidad = Math.floor(v);
    };

    const ensureCantidad = (i) => {
      let v = Number(form.items[i]?.cantidad ?? 1);
      if (!Number.isFinite(v) || v < 1) {
        form.items[i].cantidad = 1;
        addToast("warning", `La cantidad del ítem #${i + 1} se ajustó a 1 (mínimo permitido).`);
        return;
      }
      const floored = Math.floor(v);
      if (floored !== v) {
        form.items[i].cantidad = floored;
        addToast("warning", `La cantidad del ítem #${i + 1} se redondeó a ${floored}.`);
      }
    };

    const applySerialized = (raw) => {
      try {
        const data = JSON.parse(raw || "{}");
        form.empresa = EMPRESA_FIJA;
        form.numero_solpe = null;
        form.numero_contrato = data.numero_contrato || "";
        form.nombre_centro_costo = data.nombre_centro_costo || "";
        form.tipo_solped = data.tipo_solped || "";
        form.prioridad_solped = data.prioridad_solped || "MEDIA";
        form.dias_estimados_gestion = Number(data.dias_estimados_gestion || 1);
        form.nombre_solped = (data.nombre_solped || "").toUpperCase();
        form.dirigidoA = Array.isArray(data.dirigidoA) ? data.dirigidoA : [];
        form.autorizaciones = Array.isArray(data.autorizaciones) ? data.autorizaciones : [];

        form.items =
          Array.isArray(data.items) && data.items.length
            ? data.items.map((it, i) => ({
                id: it.id ?? i + 1,
                descripcion: (it.descripcion || "").toUpperCase(),
                codigo_referencial: (it.codigo_referencial || "").toUpperCase(),
                cantidad: Number(it.cantidad || 0),
                stock: Number(it.stock || 0),
                numero_interno: (it.numero_interno || "").toUpperCase(),
                prioridad: it.prioridad || "MEDIA",
                imagen_url: it.imagen_url || ""
              }))
            : [];
        if (!form.items.length) agregarFila();

        setNow();
        asegurarContratoPermitido();
        subscribeCotizadoresEmpresa(form.empresa);
      } catch (e) {
        console.error("No se pudo parsear borrador local:", e);
      }
    };

    const formHasContent = () => {
      const hasHeader =
        (form.nombre_solped && form.nombre_solped.trim() !== "") ||
        (form.tipo_solped && form.tipo_solped.trim() !== "") ||
        (form.numero_contrato && String(form.numero_contrato).trim() !== "") ||
        (Array.isArray(form.dirigidoA) && form.dirigidoA.length > 0);

      const hasItems =
        Array.isArray(form.items) &&
        form.items.some(
          (it) =>
            (it?.descripcion && it.descripcion.trim() !== "") ||
            (it?.numero_interno && it.numero_interno.trim() !== "") ||
            Number(it?.cantidad || 0) > 0 ||
            Number(it?.stock || 0) > 0 ||
            (it?.codigo_referencial && it.codigo_referencial.trim() !== "") ||
            (it?.imagen_url && it.imagen_url.trim() !== "")
        );

      return hasHeader || hasItems;
    };

    const scheduleLocalSave = () => {
      if (!localSaveEnabled.value || suppressLocalSave.value) return;
      if (!formHasContent()) return;

      if (localTimer) clearTimeout(localTimer);
      localTimer = setTimeout(() => {
        try {
          const payload = serializeForm();
          localStorage.setItem(perCompanyKey.value, payload);
          localStorage.setItem(lastKey.value, payload);
        } catch (e) {
          console.warn("No se pudo guardar local:", e);
        }
      }, 400);
    };

    const saveLocalNow = () => {
      try {
        const payload = serializeForm();
        localStorage.setItem(perCompanyKey.value, payload);
        localStorage.setItem(lastKey.value, payload);
        addToast("success", "Borrador local guardado.");
      } catch {
        addToast("danger", "No se pudo guardar localmente.");
      }
    };

    const loadLocalNow = async () => {
      try {
        const uidNow = uid.value || "anon";
        const candidates = new Set();

        candidates.add(perCompanyKey.value);
        candidates.add(`solped_plantas_local_last_${uidNow}`);
        candidates.add(`solped_plantas_local_last_anon`);

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(`solped_plantas_local_${uidNow}_`)) candidates.add(k);
        }

        let bestRaw = null;
        let bestTs = -1;

        for (const k of candidates) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          try {
            const data = JSON.parse(raw);
            const ts = Number(data?.updatedAt || 0);
            if (ts > bestTs) {
              bestTs = ts;
              bestRaw = raw;
            }
          } catch (e) {
            console.log(e);
          }
        }

        if (!bestRaw) return;

        await runWithoutAutosave(async () => {
          applySerialized(bestRaw);
          await cargarNumeroSolpedDesdeCounter();
          saveLocalNow();
        });

        addToast("success", "Borrador local recuperado.");
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudo recuperar el borrador local.");
      }
    };

    const clearLocalNow = async () => {
      try {
        await runWithoutAutosave(async () => {
          localStorage.removeItem(perCompanyKey.value);
          localStorage.removeItem(lastKey.value);
        });
        addToast("success", "Borrador local limpiado.");
      } catch (e) {
        console.log(e);
      }
    };

    watch(form, () => scheduleLocalSave(), { deep: true });
    watch(uid, () => scheduleLocalSave());

    const SUG_MIN_LEN = 2;
    const SUG_DELAY = 180;

    const suggestOpen = reactive({});
    const suggestActive = reactive({});
    const suggestLoading = reactive({});

    const closeSuggest = (i) => {
      try { clearTimeout(timers[i]); } catch (e) { console.log(e); }
      suggests[i] = [];
      suggestOpen[i] = false;
      suggestActive[i] = -1;
      suggestLoading[i] = false;
    };

    const isSuggestOpen = (i) => !!(suggestOpen[i] && (suggestLoading[i] || (suggests[i] && suggests[i].length)));

    const escapeHtml = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const renderSuggestMatch = (i, s) => {
      const raw = String(form.items[i]?.descripcion || "").trim();
      const txt = typeof s === "string" ? s : (s?.text || "");
      if (!raw) return escapeHtml(txt);

      const U = txt.toUpperCase();
      const R = raw.toUpperCase();
      const pos = U.indexOf(R);
      if (pos < 0) return escapeHtml(txt);

      const before = escapeHtml(txt.slice(0, pos));
      const mid = escapeHtml(txt.slice(pos, pos + raw.length));
      const after = escapeHtml(txt.slice(pos + raw.length));
      return `${before}<mark class="suggest-mark">${mid}</mark>${after}`;
    };

    const fetchQuickSuggest = async (i) => {
      const raw = String(form.items[i]?.descripcion || "").trim();
      const normPrefix = normalize(raw);

      if (!normPrefix || normPrefix.length < SUG_MIN_LEN) {
        closeSuggest(i);
        return;
      }

      suggestOpen[i] = true;
      suggestLoading[i] = true;

      try {
        const qy = query(
          collection(db, "items_catalog"),
          orderBy("norm"),
          startAt(normPrefix),
          endAt(normPrefix + "\uf8ff"),
          limit(20)
        );

        const snap = await getDocs(qy);

        const rows = snap.docs
          .map((d) => {
            const data = d.data() || {};
            const text = data.original || d.id;
            const usos = Number(data.usos ?? data.uso ?? data.count ?? 0) || 0;
            return { text, usos };
          })
          .filter((x) => x.text);

        const seen = new Set();
        const uniq = [];
        for (const r of rows) {
          const key = String(r.text).trim().toUpperCase();
          if (seen.has(key)) continue;
          seen.add(key);
          uniq.push(r);
        }

        uniq.sort((a, b) => {
          const du = (b.usos || 0) - (a.usos || 0);
          if (du !== 0) return du;
          return String(a.text).localeCompare(String(b.text));
        });

        suggests[i] = uniq.slice(0, 8);
        suggestActive[i] = suggests[i].length ? 0 : -1;
      } catch (e) {
        console.warn("fallback suggests:", e);
        suggests[i] = [];
        suggestActive[i] = -1;
      } finally {
        suggestLoading[i] = false;
      }
    };

    const AUTOGROW_MIN = 44;
    const AUTOGROW_MAX = 140;

    const autoGrow = (el) => {
      if (!el) return;
      el.style.height = "auto";
      const next = Math.min(el.scrollHeight, AUTOGROW_MAX);
      el.style.height = Math.max(next, AUTOGROW_MIN) + "px";
    };

    const autoShrink = (el) => {
      if (!el) return;
      el.style.height = AUTOGROW_MIN + "px";
    };

    const onDescFocus = (i, ev) => {
      focusRow.value = i;
      suggestOpen[i] = true;
      if (suggestActive[i] == null) suggestActive[i] = 0;

      autoGrow(ev?.target);

      const raw = String(form.items[i]?.descripcion || "").trim();
      if (raw.length >= SUG_MIN_LEN) {
        clearTimeout(timers[i]);
        timers[i] = setTimeout(() => fetchQuickSuggest(i), 60);
      }
    };

    const onDescInput = (i, ev) => {
      focusRow.value = i;
      suggestOpen[i] = true;
      form.items[i].descripcion = (form.items[i].descripcion || "").toUpperCase();

      autoGrow(ev?.target);

      clearTimeout(timers[i]);
      timers[i] = setTimeout(() => fetchQuickSuggest(i), SUG_DELAY);
    };

    const onDescBlur = (i, ev) => {
      setTimeout(() => {
        if (focusRow.value === i) focusRow.value = -1;
        closeSuggest(i);

        const txt = String(form.items[i]?.descripcion || "").trim();
        if (txt.length < 40) autoShrink(ev?.target);
        else autoGrow(ev?.target);
      }, 200);
    };

    const onDescKeydown = (i, ev) => {
      if (!ev) return;

      if (!isSuggestOpen(i)) {
        if (ev.key === "ArrowDown") {
          const raw = String(form.items[i]?.descripcion || "").trim();
          if (raw.length >= SUG_MIN_LEN) {
            suggestOpen[i] = true;
            fetchQuickSuggest(i);
            ev.preventDefault();
          }
        }
        return;
      }

      if (ev.key === "Escape") {
        closeSuggest(i);
        ev.preventDefault();
        return;
      }

      if (ev.key === "Tab") {
        closeSuggest(i);
        return;
      }

      const list = suggests[i] || [];
      if (!list.length) return;

      const cur = Number.isFinite(suggestActive[i]) ? suggestActive[i] : 0;

      if (ev.key === "ArrowDown") {
        suggestActive[i] = Math.min(cur + 1, list.length - 1);
        ev.preventDefault();
        return;
      }

      if (ev.key === "ArrowUp") {
        suggestActive[i] = Math.max(cur - 1, 0);
        ev.preventDefault();
        return;
      }

      if (ev.key === "Enter") {
        const picked = list[cur];
        if (picked) aplicarSugerencia(i, picked.text || picked);
        closeSuggest(i);
        ev.preventDefault();
      }
    };

    const aplicarSugerencia = (i, texto) => {
      form.items[i].descripcion = (texto || "").toUpperCase();
      closeSuggest(i);
      focusRow.value = -1;
    };

    const onDragOver = (ev) => {
      isDragging.value = true;
      try {
        ev.dataTransfer.dropEffect = "copy";
      } catch (e) {
        console.log(e);
      }
    };

    const onDragLeave = () => {
      isDragging.value = false;
    };

    const gatherFilesFromItems = async (items) => {
      const out = [];
      const readers = items
        .map((it) => (typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null))
        .filter(Boolean)
        .map((entry) => traverseFileTree(entry));
      if (!readers.length) return out;
      const chunks = await Promise.all(readers);
      for (const arr of chunks) out.push(...arr);
      return out;
    };

    const traverseFileTree = (entry, path = "") =>
      new Promise((resolve) => {
        const results = [];
        if (!entry) return resolve(results);

        if (entry.isFile) {
          entry.file((file) => {
            const rel = path ? `${path}/${file.name}` : file.name;
            try {
              Object.defineProperty(file, "_relativePath", { value: rel, enumerable: false });
            } catch (e) {
              console.log(e);
            }
            results.push(file);
            resolve(results);
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = [];
          const readEntries = () => {
            dirReader.readEntries(async (batch) => {
              if (!batch.length) {
                const subs = await Promise.all(entries.map((e) => traverseFileTree(e, path ? `${path}/${entry.name}` : entry.name)));
                resolve(subs.flat());
                return;
              }
              entries.push(...batch);
              readEntries();
            });
          };
          readEntries();
        } else {
          resolve(results);
        }
      });

    const onDrop = async (ev) => {
      isDragging.value = false;

      const dt = ev.dataTransfer;
      const items = Array.from(dt?.items || []);
      const filesFromItems = await gatherFilesFromItems(items);
      const plainFiles = Array.from(dt?.files || []);
      const all = filesFromItems.length ? filesFromItems : plainFiles;
      if (!all.length) return;
      await handleFiles(all);
    };

    const subirAdjuntos = async (ev) => {
      const files = Array.from(ev?.target?.files || []);
      ev.target.value = "";
      if (!files.length) return;
      await handleFiles(files);
    };

    const subirCarpeta = async (ev) => {
      const files = Array.from(ev?.target?.files || []);
      ev.target.value = "";
      if (!files.length) return;
      await handleFiles(files);
    };

    const updateGlobalProgress = () => {
      if (!perFileProgress.value.length) {
        totalProgress.value = 0;
        return;
      }
      const sum = perFileProgress.value.reduce((a, b) => a + (b || 0), 0);
      totalProgress.value = Math.round(sum / perFileProgress.value.length);
    };

    const inferTipo = (filename = "") => {
      const ext = filename.split(".").pop()?.toLowerCase();
      const map = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
        zip: "application/zip",
        rar: "application/x-rar-compressed"
      };
      return map[ext] || "application/octet-stream";
    };

    const handleFiles = async (files) => {
      try {
        if (form.autorizaciones.length + files.length > MAX_FILES) {
          addToast("danger", `Máximo ${MAX_FILES} archivos.`);
          return;
        }

        const currentTotal = (form.autorizaciones || []).reduce((a, b) => a + (b.tamano || 0), 0) / 1024 / 1024;
        const newTotal = files.reduce((a, f) => a + f.size, 0) / 1024 / 1024;
        if (currentTotal + newTotal > MAX_TOTAL_MB) {
          addToast("danger", `Supera el total permitido (${MAX_TOTAL_MB} MB).`);
          return;
        }

        const bad = files.filter((f) => !ALLOWED_EXTS.has((f.name.split(".").pop() || "").toLowerCase()));
        if (bad.length) {
          addToast("danger", `Formato no permitido: ${bad.map((b) => b.name).join(", ")}`);
          return;
        }

        uploadingAdjuntos.value = true;
        uploadTotal.value = files.length;
        uploadedCount.value = 0;
        perFileProgress.value = files.map(() => 0);
        totalProgress.value = 0;

        const sanitizeSeg = (s) => (s || "").replace(/[^\w\-.]+/g, "_").replace(/^_+|_+$/g, "");

        for (let idx = 0; idx < files.length; idx++) {
          const file = files[idx];
          const sizeMB = file.size / 1024 / 1024;
          if (sizeMB > MAX_SIZE_MB) {
            addToast("danger", `“${file.name}” supera ${MAX_SIZE_MB} MB.`);
            perFileProgress.value[idx] = 100;
            updateGlobalProgress();
            continue;
          }

          const rawRel =
            (file.webkitRelativePath && file.webkitRelativePath.replace(/^\/+/, "")) ||
            (file._relativePath && String(file._relativePath).replace(/^\/+/, "")) ||
            file.name;

          const safeRel = rawRel
            .split("/")
            .map(sanitizeSeg)
            .filter(Boolean)
            .join("/");

          const safeEmpresa = EMPRESA_FIJA.replace(/\s+/g, "_");
          const safeNum = String(form.numero_solpe || "temp");
          const timestamp = Date.now();

          const path = `solped_adjuntos/${safeEmpresa}_${safeNum}/${timestamp}/${safeRel}`;
          const r = sRef(storage, path);
          const task = uploadBytesResumable(r, file);

          await new Promise((resolve, reject) => {
            task.on(
              "state_changed",
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                perFileProgress.value[idx] = pct;
                updateGlobalProgress();
              },
              (err) => reject(err),
              async () => {
                try {
                  const url = await getDownloadURL(task.snapshot.ref);
                  form.autorizaciones.push({
                    nombre: file.name,
                    url,
                    tipo: file.type || inferTipo(file.name),
                    tamano: file.size
                  });
                  uploadedCount.value += 1;
                  perFileProgress.value[idx] = 100;
                  updateGlobalProgress();
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }
            );
          });
        }

        addToast("success", "Adjuntos subidos correctamente.");
      } catch (e) {
        console.error(e);
        addToast("danger", "No se pudieron subir uno o más adjuntos.");
      } finally {
        uploadingAdjuntos.value = false;
        totalProgress.value = 0;
        perFileProgress.value = [];
      }
    };

    const eliminarAdjunto = (idx) => {
      form.autorizaciones.splice(idx, 1);
      addToast("success", "Adjunto eliminado.");
    };

    const limpiarAdjuntos = () => {
      form.autorizaciones = [];
      addToast("success", "Se limpiaron los adjuntos.");
    };

    const agregarFila = () => {
      const nid = form.items.length ? form.items[form.items.length - 1].id + 1 : 1;
      form.items.push({
        id: nid,
        descripcion: "",
        codigo_referencial: "",
        cantidad: 1,
        stock: null,
        numero_interno: "",
        prioridad: "MEDIA",
        imagen_url: ""
      });
    };

    const eliminarFila = (idx) => {
      form.items.splice(idx, 1);
      addToast("success", "Fila eliminada.");
    };

    const guardarFila = (idx) => {
      focusRow.value = -1;
      suggests[idx] = [];
      addToast("success", `Fila #${idx + 1} guardada.`);
    };

    const onNumeroInternoBlur = (i) => {
      const isLast = i === form.items.length - 1;
      const it = form.items[i];
      const filaCompleta = (it?.descripcion?.trim()?.length || 0) > 0 && (it?.numero_interno?.trim()?.length || 0) > 0;
      if (isLast && filaCompleta) agregarFila();
    };

    const getNextNumeroTransaccional = async () => {
      const ctrRef = doc(db, "solpe_counters", COUNTER_DOC_ID);
      const numero = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ctrRef);
        const curr = (snap.exists() && Number(snap.data().next)) || 1;
        tx.set(ctrRef, { next: curr + 1 }, { merge: true });
        return curr;
      });
      return numero;
    };

    const asegurarContratoPermitido = () => {
      const code = String(form.numero_contrato || "");
      const set = new Set(centrosAsignados.value || []);
      if (!code || !set.has(code)) {
        form.numero_contrato = "";
        form.nombre_centro_costo = "";
      }
    };

    const requiereAprobacionPreview = computed(() =>
      CENTROS_PLANTAS_APROBACION.includes(String(form.numero_contrato || ""))
    );

    const validarAntesDeGuardar = () => {
      if (!Array.isArray(centrosAsignados.value) || centrosAsignados.value.length === 0) {
        return "Tu usuario no tiene contratos asignados. Contacta a un administrador.";
      }
      if (!form.numero_contrato) return "Debes seleccionar un Centro de Costo.";
      if (!form.nombre_centro_costo) return "Error interno: no se pudo resolver el nombre del Centro de Costo.";
      if (!form.nombre_solped?.trim()) return "Debes ingresar el nombre de la SOLPED.";
      if (!form.tipo_solped) return "Debes seleccionar el tipo de SOLPED.";
      if (!form.prioridad_solped) return "Debes seleccionar la prioridad de la SOLPED.";
      if (!Number(form.dias_estimados_gestion) || Number(form.dias_estimados_gestion) < 1) {
        return "Debes indicar los días estimados de gestión.";
      }
      if (!form.dirigidoA?.length) return "Debes seleccionar al menos un cotizador.";
      if (!form.items?.length) return "Debes agregar al menos un ítem.";
      for (const it of form.items) {
        if (!it.descripcion?.trim() || !it.numero_interno?.trim()) {
          return "Cada ítem debe tener Descripción y N° Interno/Patente.";
        }
        if (!it.prioridad) {
          return "Cada ítem debe tener prioridad.";
        }
      }
      return "";
    };

    const guardarSolped = async () => {
      error.value = "";
      okMsg.value = "";
      const msg = validarAntesDeGuardar();
      if (msg) {
        error.value = msg;
        addToast("danger", msg);
        return;
      }

      try {
        enviandoSolpe.value = true;
        setNow();

        const numeroFinal = await getNextNumeroTransaccional();
        form.numero_solpe = numeroFinal;

        const esCentroPlanta = CENTROS_PLANTAS_APROBACION.includes(form.numero_contrato);
        form.requiereAprobacionSolped = esCentroPlanta;
        form.estadoAprobacionSolped = esCentroPlanta ? "Pendiente" : null;
        form.aprobadorSolped = esCentroPlanta ? "Ricardo Prouvay" : "";

        const payload = {
          numero_solpe: numeroFinal,
          empresa: EMPRESA_FIJA,
          fecha: form.fecha,
          fecha_str: new Date(),
          nombre_solped: (form.nombre_solped || "").toUpperCase(),
          tipo_solped: form.tipo_solped,
          prioridad_solped: form.prioridad_solped || "MEDIA",
          dias_estimados_gestion: Number(form.dias_estimados_gestion || 1),
          dirigidoA: form.dirigidoA,
          numero_contrato: form.numero_contrato,
          nombre_centro_costo: form.nombre_centro_costo || "",
          usuario: usuarioNombre.value || "",
          estatus: form.estatus || "Pendiente",
          tipo_flujo: "planta",
          requiereAprobacionSolped: !!form.requiereAprobacionSolped,
          estadoAprobacionSolped: form.estadoAprobacionSolped || null,
          aprobadorSolped: form.aprobadorSolped || "",
          comentario_aprobacion_solped: form.comentario_aprobacion_solped || "",
          autorizaciones: (form.autorizaciones || []).map((a) => ({
            nombre: a.nombre,
            url: a.url,
            tipo: a.tipo || null,
            tamano: a.tamano || null
          })),
          createdAt: serverTimestamp(),
          items: form.items.map((it, idx) => ({
            item: idx + 1,
            descripcion: (it.descripcion || "").toUpperCase(),
            codigo_referencial: (it.codigo_referencial || "SIN CÓDIGO").toUpperCase(),
            cantidad: Number(it.cantidad || 0),
            stock: Number(it.stock || 0),
            numero_interno: (it.numero_interno || "SIN PATENTE").toUpperCase(),
            prioridad: it.prioridad || "MEDIA",
            imagen_url: it.imagen_url || null,
            estado: "pendiente"
          }))
        };

        const docRef = await addDoc(collection(db, "solpeds_plantas"), payload);

        await addDoc(collection(docRef, "historialEstados"), {
          fecha: serverTimestamp(),
          usuario: usuarioNombre.value || "",
          estatus: "Pendiente",
          comentario: esCentroPlanta
            ? "Creación de SOLPED de plantas · Enviada a aprobación SOLPED"
            : "Creación de SOLPED de plantas"
        });

        for (const it of form.items) {
          const original = (it.descripcion || "").trim();
          const norm = normalize(original);
          if (!norm || norm.length < 2) continue;
          const id = toDocId(norm);
          const refd = doc(db, "items_catalog", id);
          const snap = await getDoc(refd);
          if (!snap.exists()) {
            await setDoc(refd, {
              original,
              norm,
              usos: 1,
              primera_vez: new Date(),
              ultima_vez: new Date(),
              empresas: [EMPRESA_FIJA]
            });
          } else {
            await setDoc(
              refd,
              {
                original: snap.data()?.original || original,
                norm,
                usos: increment(1),
                ultima_vez: new Date(),
                empresas: arrayUnion(EMPRESA_FIJA)
              },
              { merge: true }
            );
          }
        }

        okMsg.value = `SOLPED #${numeroFinal} guardada con éxito.`;
        addToast("success", "SOLPED enviada correctamente.");

        await clearLocalNow();

        await runWithoutAutosave(async () => {
          await resetForm();
          await cargarNumeroSolpedDesdeCounter();
          subscribeCotizadoresEmpresa(form.empresa);
        });
      } catch (e) {
        console.error(e);
        const m = "Error al guardar la SOLPED.";
        error.value = m;
        addToast("danger", m);
      } finally {
        enviandoSolpe.value = false;
      }
    };

    const resetForm = async () => {
      form.numero_solpe = null;
      form.empresa = EMPRESA_FIJA;
      form.fecha = nowLocal();
      form.nombre_solped = "";
      form.tipo_solped = "";
      form.prioridad_solped = "MEDIA";
      form.dias_estimados_gestion = 1;
      form.dirigidoA = [];
      form.numero_contrato = "";
      form.nombre_centro_costo = "";
      form.autorizaciones = [];
      form.items = [];
      form.estatus = "Pendiente";
      form.tipo_flujo = "planta";
      form.requiereAprobacionSolped = false;
      form.estadoAprobacionSolped = null;
      form.aprobadorSolped = "";
      form.comentario_aprobacion_solped = "";
      requiereAutorizacion.value = false;

      Object.keys(suggests).forEach((k) => {
        delete suggests[k];
      });
      focusRow.value = -1;

      if (!form.items.length) agregarFila();
    };

    const subirImagenItem = async (ev, i) => {
      const file = ev?.target?.files?.[0];
      if (!file) return;
      await subirImagenItemFile(file, i);
      ev.target.value = "";
    };

    async function subirImagenItemFile(file, i) {
      const row = getRowUpload(i);
      try {
        row.uploading = true;
        row.progress = 0;

        const safeName = (file.name || "img").replace(/[^\w\-.]+/g, "_");
        const name = `solped_${form.numero_solpe || "temp"}_${i}_${Date.now()}_${safeName}`;
        const path = `solped_images/${name}`;
        const r = sRef(storage, path);

        const task = uploadBytesResumable(r, file);
        await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              row.progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            },
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              form.items[i].imagen_url = url;
              addToast("success", `Imagen del ítem #${i + 1} subida.`);
              resolve();
            }
          );
        });
      } catch (e) {
        console.error(e);
        error.value = "Error al subir la imagen del ítem.";
        addToast("danger", `No se pudo subir la imagen del ítem #${i + 1}.`);
      } finally {
        row.uploading = false;
        setTimeout(() => (row.progress = 0), 400);
      }
    }

    function eliminarImagenItem(i) {
      if (form.items[i]) form.items[i].imagen_url = "";
      const row = getRowUpload(i);
      if (row) {
        row.uploading = false;
        row.progress = 0;
        row.dragover = false;
      }
      addToast("success", `Imagen del ítem #${i + 1} eliminada.`);
    }

    const beforeUnload = () => {
      if (!localSaveEnabled.value) return;
      try {
        const payload = serializeForm();
        localStorage.setItem(perCompanyKey.value, payload);
        localStorage.setItem(lastKey.value, payload);
      } catch (e) {
        console.error("No se pudo guardar local al salir:", e);
      }
    };

    onMounted(async () => {
      setNow();

      try {
        localSaveEnabled.value = true;
        localStorage.setItem(LOCAL_PREF_KEY, "1");
      } catch (e) {
        console.error(e);
      }

      await loadUserFullName();
      form.empresa = EMPRESA_FIJA;

      try {
        const raw = sessionStorage.getItem("solped_draft");
        if (raw) {
          const draft = JSON.parse(raw);
          await runWithoutAutosave(async () => {
            await applyDraft(draft);
          });
          sessionStorage.removeItem("solped_draft");
        }
      } catch (e) {
        console.warn("Borrador inválido:", e);
      }

      await loadLocalNow();
      await cargarNumeroSolpedDesdeCounter();

      if (!form.items.length) agregarFila();
      asegurarContratoPermitido();
      subscribeCotizadoresEmpresa(form.empresa);

      window.addEventListener("beforeunload", beforeUnload);
    });

    onUnmounted(() => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (typeof unsubCotizadores === "function") unsubCotizadores();
      unsubCotizadores = null;
      if (debounceTimer) clearTimeout(debounceTimer);
    });

    return {
      form,
      requiereAutorizacion,
      requiereAprobacionPreview,
      inputImagenRefs,
      error,
      okMsg,
      enviandoSolpe,
      loadingNumero,
      usuarioNombre,
      cotizadoresFiltrados,
      loadingCotizadores,
      centrosCosto,
      centrosDisponibles,
      suggests,
      focusRow,
      localSaveEnabled,
      showEquiposCard,
      toggleEquiposCard,
      busquedaEquipo,
      cargandoEquipos,
      resultadosEquipos,
      equiposError,
      pageSize,
      currentPage,
      totalPages,
      visiblePageButtons,
      pagedEquipos,
      onSuggestClick,
      goToPage,
      aplicarFiltrosEquiposDebounced,
      buscarEquipos,
      clearEquiposSearch,
      copiarEquipo,
      normEq,

      isDragging,
      uploadingAdjuntos,
      totalProgress,
      uploadTotal,
      uploadedCount,

      MAX_FILES,
      MAX_SIZE_MB,
      MAX_TOTAL_MB,

      toasts,
      addToast,
      closeToast,

      onCentroCosto,
      saveLocalNow,
      loadLocalNow,
      clearLocalNow,
      persistLocalSavePref,

      agregarFila,
      eliminarFila,
      guardarFila,
      onNumeroInternoBlur,
      onDescInput,
      aplicarSugerencia,
      onDescBlur,
      onDescFocus,
      onDescKeydown,
      closeSuggest,
      isSuggestOpen,
      suggestActive,
      suggestLoading,
      renderSuggestMatch,

      subirAdjuntos,
      subirCarpeta,
      eliminarAdjunto,
      limpiarAdjuntos,
      onDragOver,
      onDragLeave,
      onDrop,

      subirImagenItem,
      getRowUpload,
      onImgDragOver,
      onImgDragLeave,
      onImgDrop,

      inputExcel,
      importandoExcel,
      importProgreso,
      importProgresoPct,
      onExcelSeleccionado,
      descargarPlantillaItems,
      guardarSolped,
      eliminarImagenItem,
      clampCantidad,
      ensureCantidad
    };
  }
};
</script>

<style scoped>
.solped-page {
  min-height: 100vh;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.page-head__left {
  min-width: 0;
}
.page-head__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-elevated {
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.06) !important;
  border-radius: 0.9rem !important;
}

.section-soft {
  border: 1px solid #eef2f7;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0.35rem 0;
}

.side-card {
  position: sticky;
  top: 16px;
}
@media (min-width: 992px) {
  .side-card {
    top: 90px;
  }
}

.approval-box {
  border: 1px solid #e5e7eb;
  border-radius: 0.7rem;
  padding: 0.9rem 1rem;
  background: #f8fafc;
  min-height: 100%;
}

.dropzone {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.6rem;
  padding: 1rem 1.1rem;
  color: #475569;
  background: #fff;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.dropzone .btn {
  white-space: nowrap;
}
.dropzone:hover {
  background: #f1f5f9;
}
.dropzone.is-dragover {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.dz-text {
  line-height: 1.1;
}

.dz-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
}
:global(html.theme-dark) .dz-loading {
  background: rgba(17, 24, 39, 0.75);
}
.dz-loading-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 520px;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
}
:global(html.theme-dark) .dz-loading-box {
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
}

.file-pill {
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem;
}

.table td,
.table th {
  vertical-align: middle;
}
.thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
.suggest-popover {
  position: absolute;
  z-index: 2000;
  left: 0;
  right: 0;
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 4px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  max-height: min(420px, 55vh);
  overflow-y: auto;
  background: #fff;
}
.desc-autogrow {
  min-height: 44px;
  max-height: 140px;
  resize: none;
  overflow: hidden;
  line-height: 1.2;
  padding-top: 10px;
  padding-bottom: 10px;
}

.suggest-header {
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.45rem 0.75rem !important;
}
.suggest-item {
  padding: 0.65rem 0.75rem;
  line-height: 1.25;
  font-size: 1rem;
}

.suggest-item.is-active {
  background: #eff6ff;
  color: #111827;
}
.suggest-item:hover {
  background: #f1f5f9;
  color: #111827;
}
.suggest-mark {
  padding: 0 2px;
  border-radius: 4px;
}

:global(html.theme-dark) .suggest-popover {
  background: rgba(31, 41, 55, 0.98);
  border-color: rgba(148, 163, 184, 0.25);
}
:global(html.theme-dark) .suggest-header {
  background: rgba(17, 24, 39, 0.85);
  border-bottom-color: rgba(148, 163, 184, 0.25);
}
:global(html.theme-dark) .suggest-item {
  color: #e5e7eb;
}
:global(html.theme-dark) .suggest-item.is-active,
:global(html.theme-dark) .suggest-item:hover {
  background: rgba(59, 130, 246, 0.18);
}
:global(html.theme-dark) .suggest-mark {
  background: rgba(250, 204, 21, 0.22);
  color: #e5e7eb;
}

.toast-stack {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1080;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-box {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  color: #fff;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
.toast-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.toast-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.toast-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}
:deep(.card .table-responsive) {
  overflow: visible !important;
}
:deep(table),
:deep(tbody),
:deep(tr),
:deep(td) {
  overflow: visible !important;
}
.equipos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(520px, 55vh);
  overflow: auto;
  padding-right: 4px;
}
.equipos-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.85rem;
  padding: 0.75rem 0.8rem;
  background: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
}
.equipos-main {
  min-width: 0;
}
.equipos-title {
  min-width: 0;
}
.badge-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.equipos-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .page-head {
    align-items: flex-start;
  }

  .responsive-stack thead {
    display: none;
  }
  .responsive-stack,
  .responsive-stack tbody,
  .responsive-stack tr,
  .responsive-stack td {
    display: block;
    width: 100%;
  }

  .responsive-stack tr {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border, #e5e7eb);
    border-radius: 12px;
    padding: 10px 10px 6px;
    margin: 10px 0;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  }

  .responsive-stack td {
    border: none !important;
    padding: 8px 6px !important;
  }

  .responsive-stack td[data-label]::before {
    content: attr(data-label);
    display: block;
    font-weight: 600;
    font-size: 0.82rem;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .responsive-stack td [class*="btn-group"] {
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .suggest-popover {
    position: absolute;
    left: 0;
    right: 0;
    top: auto;
    bottom: 100%;
    margin-bottom: 6px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  }

  .side-card {
    position: static;
  }
  .equipos-item {
    grid-template-columns: 1fr;
  }
  .equipos-actions {
    justify-content: flex-start;
  }
}

:global(html.theme-dark) .card-elevated {
  border-color: rgba(255, 255, 255, 0.08) !important;
  background: #111827 !important;
}
:global(html.theme-dark) .section-soft {
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
  border-color: rgba(255,255,255,0.08);
}
:global(html.theme-dark) .approval-box {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.1);
}
:global(html.theme-dark) .dropzone {
  background: #0f172a;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.16);
}
:global(html.theme-dark) .dropzone:hover {
  background: #0b1220;
}
:global(html.theme-dark) .dropzone.is-dragover {
  border-color: #60a5fa;
  background: #0b1220;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
:global(html.theme-dark) .responsive-stack tr {
  --card-bg: #111827;
  --card-border: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}
:global(html.theme-dark) .responsive-stack td[data-label]::before {
  color: #9ca3af;
}
:global(html.theme-dark) .suggest-popover {
  background: #0b1220;
  border-color: rgba(255, 255, 255, 0.12);
}
:global(html.theme-dark) .list-group-item {
  background: transparent;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.08);
}
:global(html.theme-dark) .equipos-item {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.12);
}

.img-drop {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
  min-height: 48px;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.img-drop:hover {
  background: #f8fafc;
}
.img-drop.is-dragover {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.img-drop.is-loading {
  pointer-events: none;
}
.img-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 0.5rem;
}
.img-loading-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 420px;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
:global(html.theme-dark) .img-drop {
  background: #0f172a;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.16);
}
:global(html.theme-dark) .img-drop:hover {
  background: #0b1220;
}
:global(html.theme-dark) .img-drop.is-dragover {
  border-color: #60a5fa;
  background: #0b1220;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
:global(html.theme-dark) .img-loading {
  background: rgba(17, 24, 39, 0.8);
}
:global(html.theme-dark) .img-loading-box {
  background: rgba(31, 41, 55, 0.95);
  color: #e5e7eb;
}

.import-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}
.import-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 560px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.8rem 1rem;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
}
:global(html.theme-dark) .import-overlay {
  background: rgba(17, 24, 39, 0.8);
}
:global(html.theme-dark) .import-box {
  background: #111827;
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.1);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
