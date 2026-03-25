<!-- src/views/AdminUsuarios.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>

    <div class="container py-4 py-md-5 position-relative">
      <!-- HERO -->
      <section class="hero-card mb-4">
        <div class="hero-pattern"></div>

        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap position-relative">
          <div>
            <div class="hero-badge mb-2">
              <i class="bi bi-people me-2"></i>
              Gestión de usuarios
            </div>
            <h1 class="hero-title mb-1">Administrar usuarios</h1>
            <p class="hero-subtitle mb-0">
              Crea, edita y organiza usuarios, empresas, contratos y permisos de menú desde un panel más claro y profesional.
            </p>
          </div>

          <div class="hero-actions d-flex align-items-stretch gap-2 flex-wrap w-100 w-xl-auto ms-xl-3">
            <button class="btn btn-soft-secondary btn-toolbar d-inline-flex d-md-none" @click="toggleFiltros(true)">
              <i class="bi bi-sliders2 me-1"></i><span>Filtros</span>
            </button>

            <button class="btn btn-brand btn-toolbar" @click="abrirCrear">
              <i class="bi bi-person-plus me-1"></i>
              <span class="d-none d-sm-inline">Agregar usuario</span>
              <span class="d-inline d-sm-none">Agregar</span>
            </button>

            <button class="btn btn-soft-primary btn-toolbar" @click="cargarUsuarios">
              <i class="bi bi-arrow-clockwise me-1"></i>
              <span class="d-none d-sm-inline">Recargar</span>
              <span class="d-inline d-sm-none">Reload</span>
            </button>
          </div>
        </div>
      </section>

      <!-- RESUMEN -->
      <section class="stats-strip mb-4">
        <div class="stat-pill">
          <div class="stat-icon stat-icon-blue">
            <i class="bi bi-people-fill"></i>
          </div>
          <div>
            <div class="stat-label">Total usuarios</div>
            <div class="stat-value">{{ usuarios.length }}</div>
          </div>
        </div>

        <div class="stat-pill">
          <div class="stat-icon stat-icon-slate">
            <i class="bi bi-funnel"></i>
          </div>
          <div>
            <div class="stat-label">Mostrando</div>
            <div class="stat-value">{{ paginado.length }}</div>
          </div>
        </div>

        <div class="stat-pill" v-if="busqueda || rolFiltro || empresaFiltro">
          <div class="stat-icon stat-icon-emerald">
            <i class="bi bi-search"></i>
          </div>
          <div class="min-w-0">
            <div class="stat-label">Filtros activos</div>
            <div class="stat-value text-truncate" style="max-width: 220px;">
              {{ busqueda || rolFiltro || empresaFiltro }}
            </div>
          </div>
        </div>
      </section>

      <!-- FILTROS DESKTOP -->
      <section class="filter-shell mb-4 d-none d-md-block">
        <div class="filter-shell__header">
          <div>
            <div class="list-title">Filtros</div>
            <div class="list-subtitle">
              Busca por nombre completo y filtra por rol o empresa.
            </div>
          </div>
        </div>

        <div class="filter-shell__body">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-5">
              <label class="form-label">Buscar por nombre completo</label>
              <div class="search-shell">
                <i class="bi bi-search search-icon"></i>
                <input class="search-input" v-model="busqueda" placeholder="Ej: Juan, María, etc." />
              </div>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Filtrar por rol</label>
              <select class="form-select modern-input" v-model="rolFiltro">
                <option value="">— Todos —</option>
                <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Filtrar por empresa</label>
              <select class="form-select modern-input" v-model="empresaFiltro">
                <option value="">— Todas —</option>
                <option v-for="e in empresasDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>

            <div class="col-12 col-md-1">
              <button class="btn btn-soft-secondary w-100 btn-toolbar" @click="limpiarFiltros">Limpiar</button>
            </div>
          </div>
        </div>
      </section>

      <!-- TABLA -->
      <section class="list-shell">
        <div class="list-header">
          <div>
            <div class="list-title">Usuarios</div>
            <div class="list-subtitle">
              Administra cuentas, empresas, roles, contratos y permisos.
            </div>
          </div>

          <div class="list-counter">
            <span>{{ usuarios.length }}</span>
          </div>
        </div>

        <div v-if="cargando" class="p-5 text-center">
          <div class="loading-wrap">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-3 text-secondary">Cargando…</div>
          </div>
        </div>

        <div v-else>
          <div v-if="paginado.length === 0" class="p-5 text-center">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-inbox"></i>
              </div>
              <div class="empty-title">No hay resultados con esos filtros</div>
              <div class="empty-text">
                Ajusta los filtros para volver a ver resultados.
              </div>
            </div>
          </div>

          <div class="table-responsive" v-else>
            <table class="table users-table align-middle mb-0">
              <thead class="position-sticky top-0 table-head-pro">
                <tr>
                  <th style="width:48px;"></th>
                  <th>Nombre</th>
                  <th class="d-none d-sm-table-cell">Email</th>
                  <th>Rol</th>
                  <th class="d-none d-lg-table-cell">RUT</th>
                  <th style="width: 136px;" class="text-end pe-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="u in paginado" :key="u.uid">
                  <td>
                    <div class="row-icon">
                      <i class="bi bi-person"></i>
                    </div>
                  </td>

                  <td class="fw-semibold">
                    <div class="provider-main min-w-0">
                      <div class="provider-avatar">
                        {{ (u.fullName || u.email || 'U').charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <div class="provider-name text-truncate" style="max-width: 200px;">
                          {{ u.fullName || '—' }}
                        </div>
                        <div class="provider-address d-sm-none text-truncate">
                          {{ u.email || '—' }}
                        </div>
                        <div class="d-sm-none mt-1 d-flex flex-wrap gap-1">
                          <span
                            v-for="e in (u.empresas||[]).slice(0,2)"
                            :key="u.uid + '-emp-xs-' + e"
                            class="chip chip-blue">
                            {{ e }}
                          </span>
                          <span
                            v-if="(u.empresas||[]).length>2"
                            class="chip chip-slate">
                            +{{ (u.empresas||[]).length-2 }}
                          </span>
                          <span v-if="(u.empresas||[]).length===0" class="chip chip-slate">—</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="d-none d-sm-table-cell">
                    <div class="data-inline">
                      <i class="bi bi-envelope"></i>
                      <span class="text-truncate" style="max-width: 220px;">{{ u.email || '—' }}</span>
                    </div>
                  </td>

                  <td>
                    <span class="chip chip-slate">
                      {{ u.role || '—' }}
                    </span>
                    <div
                      class="small text-secondary mt-1"
                      v-if="(u.menuPerms?.allow?.length || 0) > 0 || (u.menuPerms?.deny?.length || 0) > 0">
                      <span class="me-2" v-if="(u.menuPerms?.allow?.length || 0) > 0">
                        <i class="bi bi-shield-check me-1"></i>Permitido: {{ u.menuPerms.allow.length }}
                      </span>
                      <span v-if="(u.menuPerms?.deny?.length || 0) > 0">
                        <i class="bi bi-shield-x me-1"></i>Denegado: {{ u.menuPerms.deny.length }}
                      </span>
                    </div>
                  </td>
                  <td class="d-none d-lg-table-cell">{{ u.rut || '—' }}</td>
                  <td class="text-end pe-3">
                    <div class="action-group d-none d-md-inline-flex">
                      <button class="btn action-btn action-edit" @click="abrirEditar(u)" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button
                        class="btn action-btn action-delete"
                        @click="abrirConfirm(u)"
                        :disabled="accionando && uidEnAccion===u.uid"
                        title="Eliminar">
                        <span v-if="accionando && uidEnAccion===u.uid" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash3"></i>
                      </button>
                    </div>

                    <div class="d-inline-flex d-md-none gap-1">
                      <button class="btn action-btn action-edit btn-sm" @click="abrirEditar(u)" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button
                        class="btn action-btn action-delete btn-sm"
                        @click="abrirConfirm(u)"
                        :disabled="accionando && uidEnAccion===u.uid"
                        title="Eliminar">
                        <span v-if="accionando && uidEnAccion===u.uid" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card-footer-pro">
            <nav class="overflow-auto">
              <ul class="pagination pagination-sm justify-content-center mb-0 flex-wrap gap-1">
                <li class="page-item" :class="{disabled: paginaActual===1}">
                  <button class="page-link" @click="goToPage(paginaActual-1)" aria-label="Anterior">«</button>
                </li>
                <li
                  v-for="n in visiblePages"
                  :key="'pg-'+n"
                  class="page-item"
                  :class="{active: paginaActual===n}">
                  <button class="page-link" @click="goToPage(n)">{{ n }}</button>
                </li>
                <li class="page-item" :class="{disabled: paginaActual===totalPaginas}">
                  <button class="page-link" @click="goToPage(paginaActual+1)" aria-label="Siguiente">»</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>

      <!-- Offcanvas crear/editar -->
      <div v-if="offOpen" class="offcanvas-backdrop" @click.self="cerrarOff">
        <div class="offcanvas-panel">
          <div class="offcanvas-header">
            <div>
              <div class="modal-kicker">{{ esEdicion ? 'Editar registro' : 'Nuevo registro' }}</div>
              <div class="fw-bold fs-5 text-truncate">{{ esEdicion ? 'Editar usuario' : 'Crear usuario' }}</div>
            </div>
            <button class="btn-close" @click="cerrarOff"></button>
          </div>

          <div class="offcanvas-body">
            <div class="form-block">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nombre completo</label>
                  <input class="form-control modern-input" v-model="form.fullName" placeholder="Ej: Juan Pérez" />
                </div>

                <div class="col-12">
                  <label class="form-label">Email (Auth & Firestore)</label>
                  <input class="form-control modern-input" type="email" v-model="form.email" placeholder="email@dominio.com" />
                </div>

                <div class="col-12" v-if="!esEdicion">
                  <label class="form-label">Contraseña (solo para crear en Auth)</label>
                  <div class="input-group">
                    <input
                      class="form-control modern-input"
                      :type="showPassword ? 'text' : 'password'"
                      v-model="form.password"
                      placeholder="Mín. 6 caracteres"
                      autocomplete="new-password"
                    />
                    <button class="btn btn-soft-secondary" type="button" @click="showPassword = !showPassword">
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div class="form-text">No se guarda en Firestore.</div>
                </div>

                <div class="col-12 col-sm-6">
                  <label class="form-label">Teléfono (Celular CL)</label>
                  <input
                    class="form-control modern-input"
                    type="tel"
                    inputmode="numeric"
                    autocomplete="tel"
                    :class="phoneClass"
                    :value="form.phone"
                    @input="onPhoneInput"
                    placeholder="+56 9 1234 5678"
                  />
                  <div v-if="phoneStatus === false" class="invalid-feedback d-block">
                    Teléfono inválido. Usa formato CL: +56 9 1234 5678.
                  </div>
                  <div v-else class="form-text">
                    Se normaliza a E.164: <strong>{{ phoneE164 || '—' }}</strong>
                  </div>
                </div>

                <div class="col-12 col-sm-6">
                  <label class="form-label">RUT</label>
                  <input
                    class="form-control modern-input"
                    inputmode="text"
                    autocomplete="off"
                    :class="rutClass"
                    :value="form.rut"
                    @input="onRutInput"
                    placeholder="12.345.678-5"
                  />
                  <div v-if="rutStatus === false" class="invalid-feedback d-block">
                    RUT inválido (DV no coincide).
                  </div>
                </div>

                <div class="col-12">
                  <div class="d-flex align-items-center justify-content-between">
                    <label class="form-label mb-0">Empresas</label>
                    <small class="text-secondary">{{ form.empresas.length }} seleccionada(s)</small>
                  </div>

                  <div v-if="form.empresas.length" class="d-flex flex-wrap gap-1 mb-2">
                    <span
                      v-for="e in form.empresas"
                      :key="'sel-emp-'+e"
                      class="chip chip-blue">
                      {{ e }}
                      <button class="btn btn-sm btn-link text-primary ms-1 p-0 align-baseline" @click="quitarEmpresa(e)">×</button>
                    </span>
                  </div>

                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text"><i class="bi bi-buildings"></i></span>
                    <button class="btn btn-outline-secondary" @click="seleccionarTodasEmpresas">Todas</button>
                    <button class="btn btn-outline-secondary" @click="limpiarEmpresas">Limpiar</button>
                  </div>

                  <div class="empresa-box">
                    <label
                      v-for="e in empresasDisponibles"
                      :key="'emp-'+e"
                      class="form-check form-check-sm d-flex align-items-center gap-2 py-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :value="e"
                        :checked="form.empresas.includes(e)"
                        @change="toggleEmpresa(e, $event.target.checked)" />
                      <span class="small fw-semibold">{{ e }}</span>
                    </label>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">Rol</label>
                  <select class="form-select modern-input" :value="form.role" @change="onRoleChange">
                    <option value="">— Selecciona —</option>
                    <option v-for="r in rolesDisponibles" :key="'role-'+r" :value="r">{{ r }}</option>
                  </select>
                </div>

                <div class="col-12">
                  <div class="d-flex align-items-center justify-content-between">
                    <label class="form-label mb-0">Permisos de menú</label>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-secondary" @click="limpiarPermisosMenu">
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div class="row g-3">
                    <div class="col-12 col-lg-6">
                      <div class="perm-card">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <div class="fw-semibold">
                            <i class="bi bi-shield-check me-1"></i> Permitido
                            <span class="badge bg-success-subtle text-success-emphasis ms-2">{{ form.menuPerms.allow.length }}</span>
                          </div>
                        </div>

                        <div v-if="form.menuPerms.allow.length" class="d-flex flex-wrap gap-1 mb-2">
                          <span v-for="k in form.menuPerms.allow" :key="'allow-chip-'+k"
                                class="chip chip-emerald">
                            {{ labelFromKey(k) }}
                            <button class="btn btn-sm btn-link text-success ms-1 p-0 align-baseline" @click="removeAllow(k)">×</button>
                          </span>
                        </div>

                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text"><i class="bi bi-search"></i></span>
                          <input class="form-control" v-model="permSearchAllow" placeholder="Buscar..." />
                          <button class="btn btn-outline-success" type="button" @click="selectAllAllow">
                            <i class="bi bi-check2-square me-1"></i>Todos
                          </button>
                          <button class="btn btn-outline-secondary" type="button" @click="seleccionarAllowBasico">Básico</button>
                        </div>

                        <div class="perm-box">
                          <template v-for="g in permGroups" :key="'g-allow-'+g">
                            <div class="perm-group-title">{{ g }}</div>
                            <label
                              v-for="p in permsAllowFilteredByGroup(g)"
                              :key="'allow-'+p.key"
                              class="form-check form-check-sm d-flex align-items-center gap-2 py-1">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                :checked="form.menuPerms.allow.includes(p.key)"
                                @change="toggleAllow(p.key, $event.target.checked)" />
                              <span class="small">
                                <strong>{{ p.label }}</strong>
                                <span class="text-secondary ms-1">({{ p.key }})</span>
                              </span>
                            </label>
                          </template>
                        </div>

                        <div class="form-text mt-1">
                          Si agregas algo acá, el usuario quedará limitado a estas rutas.
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-lg-6">
                      <div class="perm-card">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <div class="fw-semibold">
                            <i class="bi bi-shield-x me-1"></i> Denegado
                            <span class="badge bg-danger-subtle text-danger-emphasis ms-2">{{ form.menuPerms.deny.length }}</span>
                          </div>
                        </div>

                        <div v-if="form.menuPerms.deny.length" class="d-flex flex-wrap gap-1 mb-2">
                          <span v-for="k in form.menuPerms.deny" :key="'deny-chip-'+k"
                                class="chip chip-danger">
                            {{ labelFromKey(k) }}
                            <button class="btn btn-sm btn-link text-danger ms-1 p-0 align-baseline" @click="removeDeny(k)">×</button>
                          </span>
                        </div>

                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text"><i class="bi bi-search"></i></span>
                          <input class="form-control" v-model="permSearchDeny" placeholder="Buscar..." />
                          <button class="btn btn-outline-danger" type="button" @click="selectAllDeny">
                            <i class="bi bi-x-square me-1"></i>Todos
                          </button>
                          <button class="btn btn-outline-secondary" type="button" @click="limpiarDeny">Vaciar</button>
                        </div>

                        <div class="perm-box">
                          <template v-for="g in permGroups" :key="'g-deny-'+g">
                            <div class="perm-group-title">{{ g }}</div>
                            <label
                              v-for="p in permsDenyFilteredByGroup(g)"
                              :key="'deny-'+p.key"
                              class="form-check form-check-sm d-flex align-items-center gap-2 py-1">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                :checked="form.menuPerms.deny.includes(p.key)"
                                @change="toggleDeny(p.key, $event.target.checked)" />
                              <span class="small">
                                <strong>{{ p.label }}</strong>
                                <span class="text-secondary ms-1">({{ p.key }})</span>
                              </span>
                            </label>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12">
                  <div class="d-flex align-items-center justify-content-between">
                    <label class="form-label mb-0">Contratos asignados</label>
                    <small class="text-secondary">
                      {{ form.centrosAsignados.length }} seleccionado(s)
                    </small>
                  </div>

                  <div v-if="form.centrosAsignados.length" class="d-flex flex-wrap gap-1 mb-2">
                    <span
                      v-for="k in form.centrosAsignados"
                      :key="'sel-'+k"
                      class="chip chip-cyan">
                      {{ nombreContrato(k) }}
                      <button class="btn btn-sm btn-link text-info ms-1 p-0 align-baseline" @click="quitarContrato(k)">×</button>
                    </span>
                  </div>

                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input class="form-control" v-model="ccSearch" placeholder="Buscar contrato por nombre o código..." />
                    <button class="btn btn-outline-secondary" @click="seleccionarTodosVisibles">Todos</button>
                    <button class="btn btn-outline-secondary" @click="limpiarSeleccion">Limpiar</button>
                  </div>

                  <div class="contratos-box">
                    <label
                      v-for="cc in ccFiltrados"
                      :key="cc.key"
                      class="form-check form-check-sm d-flex align-items-center gap-2 py-1">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :value="cc.key"
                        :checked="form.centrosAsignados.includes(cc.key)"
                        @change="toggleContrato(cc.key, $event.target.checked)" />
                      <span class="small">
                        <strong>{{ cc.key }}</strong> — {{ cc.label }}
                      </span>
                    </label>
                    <div v-if="ccFiltrados.length===0" class="text-secondary small py-2">Sin resultados.</div>
                  </div>

                  <div class="form-text mt-1">
                    Si no asignas contratos, el usuario verá <em>todos</em> (no recomendado).
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="offcanvas-footer">
            <div class="d-flex flex-wrap gap-2 justify-content-end">
              <button class="btn btn-soft-secondary" @click="cerrarOff">Cancelar</button>

              <button
                v-if="esEdicion"
                class="btn btn-soft-primary"
                :disabled="accionandoContratos"
                @click="guardarSoloFirestore">
                <span v-if="accionandoContratos" class="spinner-border spinner-border-sm me-2"></span>
                Guardar (solo Firestore)
              </button>

              <button class="btn btn-brand" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Offcanvas filtros móvil -->
      <div v-if="filtrosOpen" class="offcanvas-backdrop" @click.self="toggleFiltros(false)">
        <div class="offcanvas-panel offcanvas-panel-sm">
          <div class="offcanvas-header">
            <div>
              <div class="modal-kicker">Opciones</div>
              <div class="fw-bold fs-5"><i class="bi bi-sliders2 me-2"></i>Filtros</div>
            </div>
            <button class="btn-close" @click="toggleFiltros(false)"></button>
          </div>
          <div class="offcanvas-body">
            <div class="form-block">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Buscar por nombre completo</label>
                  <input class="form-control modern-input" v-model="busqueda" placeholder="Ej: Juan, María, etc." />
                </div>
                <div class="col-12">
                  <label class="form-label">Filtrar por rol</label>
                  <select class="form-select modern-input" v-model="rolFiltro">
                    <option value="">— Todos —</option>
                    <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Filtrar por empresa</label>
                  <select class="form-select modern-input" v-model="empresaFiltro">
                    <option value="">— Todas —</option>
                    <option v-for="e in empresasDisponibles" :key="e" :value="e">{{ e }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="offcanvas-footer">
            <div class="d-flex gap-2 justify-content-between w-100">
              <button class="btn btn-soft-secondary" @click="limpiarFiltros">Limpiar</button>
              <button class="btn btn-brand" @click="toggleFiltros(false)">Aplicar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2"
             :class="t.type==='success' ? 'bi bi-check-circle-fill'
                    : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Confirm modal -->
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
            ¿Seguro que quieres eliminar al usuario
            <strong>{{ confirmRow?.fullName || confirmRow?.email || '—' }}</strong>?
          </p>
          <div class="confirm-box">
            <div class="confirm-row">
              <span>Email</span>
              <strong>{{ confirmRow?.email || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Empresas</span>
              <strong>{{ (confirmRow?.empresas||[]).join(', ') || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Rol</span>
              <strong>{{ confirmRow?.role || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Teléfono</span>
              <strong>{{ fmtPhone(confirmRow?.phone) }}</strong>
            </div>
            <div class="confirm-row">
              <span>RUT</span>
              <strong>{{ confirmRow?.rut || '—' }}</strong>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { db, app } from '../stores/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  MENU_DEFINITIONS,
  getMenuGroups,
  getLabelFromKey,
  normalizeMenuPerms,
  getRoleMenuTemplate,
} from "@/config/menuPermissions";
const centrosCosto = {
  "30858": "CONTRATO 30858 INFRA CHUQUICAMATA",
  "27483": "CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA",
  "PPCALAMA": "PLANTA PREDOSIFICADO CALAMA",
  "20915": "CONTRATO 20915 SUM. HORMIGON DAND",
  "CASAMATRIZ": "CASA MATRIZ",
  "PPSB": "PLANTA PREDOSIFICADO SAN BERNARDO",
  "PHUSB": "PLANTA HORMIGON URB.SAN BERNARDO",
  "PHURAN": "PLANTA HORMIGON URB. RANCAGUA",
  "PARAN": "PLANTA ARIDOS RANCAGUA",
  "PASB": "PLANTA ARIDOS SAN BERNARDO",
  "22368": "CONTRATO 22368 SUM HORMIGON DET",
  "28662": "CONTRATO 28662 CARPETAS",
  "29207": "CONTRATO 29207 MINERIA",
  "23302": "CONTRATO 23302",
  "SANJOAQUIN": "SERVICIO PLANTA DE ÁRIDOS SAN JOAQUÍN",
  "CANECHE": "PLANTA CANECHE",
  "30-10-11": "GCIA. SERV. OBRA PAVIMENTACION RT CONTRATO FAM",
  "10-10-20": "TALLER SAN BERNARDO",
  "31155": "DIVISION ANDINA 4600031155",
  "GPLA":"GPLA 4600031750",
  "BETON_CALAMA": "PLANTA BETON CALAMA",
  "FLUMECAR_CALAMA": "PLANTA FLUMECAR CALAMA",
  "URBANA_CALAMA": "PLANTA URBANA CALAMA",
  "KM13_ANDINA": "PLANTA KM13 ANDINA",
  "NV17_ANDINA": "PLANTA NV17 ANDINA",
  "SAN_BERNARDO": "PLANTA SAN BERNANDO",
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
const ccLista = Object.entries(centrosCosto).map(([key, label]) => ({ key, label }));
const nombreContrato = (k) => centrosCosto[k] || k;

const FUNCTIONS_REGION = 'southamerica-west1';
const rolesDisponibles = [
  'Admin',
  'Aprobador/Editor',
  'Aprobador SOLPED',
  'Generador solped',
  'Editor',
  'Recepcion_OC',
  'CargadorDoc'
];
const empresasDisponibles = ['Xtreme Servicio', 'Xtreme Mining', 'Xtreme Hormigones'];

const MENU_KEYS = MENU_DEFINITIONS.map((x) => ({
  key: x.key,
  label: x.label,
  group: x.group,
}));

const permGroups = computed(() => getMenuGroups());
const labelFromKey = (k) => getLabelFromKey(k);
const aplicarPlantillaRol = (role) => {
  const plantilla = getRoleMenuTemplate(role);

  form.value.menuPerms = {
    allow: [...plantilla],
    deny: [],
  };
};
const onRoleChange = (ev) => {
  const role = ev?.target?.value ?? "";
  form.value.role = role;

  if (!esEdicion.value) {
    aplicarPlantillaRol(role);
  }
};
const isSmallScreen = ref(false);
let mql = null;
const onMqlChange = (e) => { isSmallScreen.value = !!e.matches; };

onMounted(() => {
  mql = window.matchMedia?.('(max-width: 576px)') || null;
  if (mql) {
    isSmallScreen.value = mql.matches;
    if (mql.addEventListener) mql.addEventListener('change', onMqlChange);
    else mql.addListener(onMqlChange);
  }
  cargarUsuarios();
});

onBeforeUnmount(() => {
  if (!mql) return;
  if (mql.removeEventListener) mql.removeEventListener('change', onMqlChange);
  else mql.removeListener(onMqlChange);
});

const digitsOnly = (s) => String(s || '').replace(/\D/g, '');
const cleanRut = (v) => String(v || '').toUpperCase().replace(/[^0-9K]/g, '');

const rutDV = (body) => {
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = (mul === 7) ? 2 : (mul + 1);
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
};

const formatRut = (v) => {
  const s = cleanRut(v);
  if (s.length <= 1) return s;
  const body = s.slice(0, -1);
  const dv = s.slice(-1);
  let out = '';
  let c = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    out = body[i] + out;
    c++;
    if (c % 3 === 0 && i !== 0) out = '.' + out;
  }
  return `${out}-${dv}`;
};

const isRutValid = (rut) => {
  const s = cleanRut(rut);
  if (s.length < 2) return false;
  const body = s.slice(0, -1);
  const dv = s.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return rutDV(body) === dv;
};

const normalizePhoneCL = (input) => {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) {
    const d = digitsOnly(raw);
    return d ? `+${d}` : '';
  }

  const d = digitsOnly(raw);

  if (d.length === 9 && d.startsWith('9')) return `+56${d}`;

  if (d.length === 11 && d.startsWith('569')) return `+${d}`;

  return '';
};

const formatPhoneCLUI = (input) => {
  const e164 = normalizePhoneCL(input);
  if (!e164) return String(input || '').trim();

  if (e164.startsWith('+569') && e164.length === 12) {
    const rest = e164.slice(4);
    return `+56 9 ${rest.slice(0,4)} ${rest.slice(4)}`;
  }
  if (e164.startsWith('+56') && e164.length === 12) {
    const local = e164.slice(3);
    return `+56 ${local[0]} ${local.slice(1,5)} ${local.slice(5)}`;
  }
  return e164;
};

const onRutInput = (ev) => {
  const v = ev?.target?.value ?? '';
  form.value.rut = formatRut(v);
};

const onPhoneInput = (ev) => {
  const v = ev?.target?.value ?? '';
  form.value.phone = formatPhoneCLUI(v);
};

const phoneE164 = computed(() => normalizePhoneCL(form.value.phone));
const phoneStatus = computed(() => {
  if (!String(form.value.phone || '').trim()) return null;
  return !!phoneE164.value;
});
const phoneClass = computed(() => ({
  'is-valid': phoneStatus.value === true,
  'is-invalid': phoneStatus.value === false
}));

const rutStatus = computed(() => {
  if (!String(form.value.rut || '').trim()) return null;
  return isRutValid(form.value.rut);
});
const rutClass = computed(() => ({
  'is-valid': rutStatus.value === true,
  'is-invalid': rutStatus.value === false
}));

const fmtPhone = (v) => {
  const s = String(v || '').trim();
  if (!s) return '—';
  return formatPhoneCLUI(s);
};

const cargando = ref(true);
const usuarios = ref([]);

const busqueda = ref('');
const rolFiltro = ref('');
const empresaFiltro = ref('');
const pageSize = 15;
const paginaActual = ref(1);

const offOpen = ref(false);
const esEdicion = ref(false);
const filtrosOpen = ref(false);

const showPassword = ref(false);

const form = ref({
  uid:'', email:'', fullName:'', phone:'', rut:'', role:'', password:'',
  empresas: [],
  centrosAsignados: [],
  menuPerms: { allow: [], deny: [] }
});

const accionando = ref(false);
const accionandoContratos = ref(false);
const uidEnAccion = ref(null);

const toggleEmpresa = (empresa, checked) => {
  const arr = [...(form.value.empresas || [])];
  const i = arr.indexOf(empresa);
  if (checked && i < 0) arr.push(empresa);
  if (!checked && i >= 0) arr.splice(i, 1);
  form.value.empresas = arr;
};
const quitarEmpresa = (empresa) => { form.value.empresas = (form.value.empresas || []).filter(e => e !== empresa); };
const limpiarEmpresas = () => { form.value.empresas = []; };
const seleccionarTodasEmpresas = () => { form.value.empresas = [...empresasDisponibles]; };

const ccSearch = ref('');
const normalizar = (s) => String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const ccFiltrados = computed(() => {
  const q = normalizar(ccSearch.value);
  if (!q) return ccLista;
  return ccLista.filter(c => normalizar(c.key).includes(q) || normalizar(c.label).includes(q));
});
const toggleContrato = (key, checked) => {
  const arr = [...form.value.centrosAsignados];
  const i = arr.indexOf(key);
  if (checked && i<0) arr.push(key);
  if (!checked && i>=0) arr.splice(i,1);
  form.value.centrosAsignados = arr;
};
const quitarContrato = (key) => { form.value.centrosAsignados = form.value.centrosAsignados.filter(k => k !== key); };
const limpiarSeleccion = () => { form.value.centrosAsignados = []; };
const seleccionarTodosVisibles = () => {
  const visibles = ccFiltrados.value.map(c => c.key);
  const set = new Set([...form.value.centrosAsignados, ...visibles]);
  form.value.centrosAsignados = Array.from(set);
};

const permSearchAllow = ref('');
const permSearchDeny = ref('');

const permsAllowFilteredByGroup = (group) => {
  const q = normalizar(permSearchAllow.value);
  const denySet = new Set(form.value.menuPerms.deny || []);
  return MENU_KEYS
    .filter(p => p.group === group)
    .filter(p => !denySet.has(p.key))
    .filter(p => !q || normalizar(p.label).includes(q) || normalizar(p.key).includes(q));
};
const permsDenyFilteredByGroup = (group) => {
  const q = normalizar(permSearchDeny.value);
  const allowSet = new Set(form.value.menuPerms.allow || []);
  return MENU_KEYS
    .filter(p => p.group === group)
    .filter(p => !allowSet.has(p.key))
    .filter(p => !q || normalizar(p.label).includes(q) || normalizar(p.key).includes(q));
};

const toggleAllow = (key, checked) => {
  const k = String(key);
  const allow = new Set(form.value.menuPerms.allow || []);
  const deny  = new Set(form.value.menuPerms.deny  || []);
  if (checked) { allow.add(k); deny.delete(k); }
  else allow.delete(k);
  form.value.menuPerms.allow = Array.from(allow);
  form.value.menuPerms.deny  = Array.from(deny);
};
const toggleDeny = (key, checked) => {
  const k = String(key);
  const allow = new Set(form.value.menuPerms.allow || []);
  const deny  = new Set(form.value.menuPerms.deny  || []);
  if (checked) { deny.add(k); allow.delete(k); }
  else deny.delete(k);
  form.value.menuPerms.allow = Array.from(allow);
  form.value.menuPerms.deny  = Array.from(deny);
};
const removeAllow = (k) => { form.value.menuPerms.allow = (form.value.menuPerms.allow || []).filter(x => x !== String(k)); };
const removeDeny  = (k) => { form.value.menuPerms.deny  = (form.value.menuPerms.deny  || []).filter(x => x !== String(k)); };

const limpiarDeny = () => { form.value.menuPerms.deny = []; };
const limpiarPermisosMenu = () => {
  form.value.menuPerms = { allow: [], deny: [] };
  permSearchAllow.value = '';
  permSearchDeny.value = '';
};
function selectAllAllow() {
  const deny = new Set(form.value.menuPerms.deny || []);
  const allow = new Set(form.value.menuPerms.allow || []);
  for (const p of MENU_KEYS) if (!deny.has(p.key)) allow.add(p.key);
  form.value.menuPerms.allow = Array.from(allow);
}
function selectAllDeny() {
  const allow = new Set(form.value.menuPerms.allow || []);
  const deny = new Set(form.value.menuPerms.deny || []);
  for (const p of MENU_KEYS) if (!allow.has(p.key)) deny.add(p.key);
  form.value.menuPerms.deny = Array.from(deny);
}
function seleccionarAllowBasico() {
  const basico = ['solped','historial-solped','historial-oc'];
  const deny = new Set(form.value.menuPerms.deny || []);
  const allow = new Set(form.value.menuPerms.allow || []);
  for (const k of basico) if (!deny.has(k)) allow.add(k);
  form.value.menuPerms.allow = Array.from(allow);
}

const toasts = ref([]);
const addToast = (type, text, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

const mapFunctionsError = (e) => {
  const code = e?.code || '';
  const msg  = String(e?.message || '').replace(/^functions\/\w+\s*/i,'').trim();
  const det  = e?.details;

  if ((code.includes('internal') || msg === 'INTERNAL_ERROR') && det?.adminCode) {
    return `Error interno (${det.adminCode}): ${det.adminMessage || 'Sin detalle'}`;
  }

  if (msg === 'TOO_SHORT') return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg === 'INVALID_EMAIL') return 'Email inválido.';
  if (msg === 'MISSING_NAME') return 'Falta el nombre.';
  if (msg === 'EMAIL_IN_USE') return 'El email ya está en uso.';
  if (msg === 'USER_NOT_FOUND') return 'El usuario no existe.';
  if (msg === 'INVALID_PHONE') return 'Teléfono inválido. Usa formato +56 9 1234 5678.';
  if (msg === 'MISSING_UID') return 'Falta UID.';

  if (code.includes('already-exists')) return 'El email ya está en uso.';
  if (code.includes('invalid-argument')) return 'Datos inválidos. Revisa los campos.';
  if (code.includes('not-found')) return 'No se encontró el recurso.';
  if (code.includes('unauthenticated')) return 'Debes iniciar sesión para esta acción.';
  if (code.includes('permission-denied')) return 'No tienes permisos para esta acción.';

  return `Error de servidor: ${msg || code || 'desconocido'}`;
};

const cargarUsuarios = async () => {
  cargando.value = true;
  try {
    const snap = await getDocs(collection(db, 'Usuarios'));
    const arr = [];
    snap.forEach(d => {
      const data = d.data() || {};

      const empresas = Array.isArray(data.empresas)
        ? data.empresas
        : (data.empresa ? [data.empresa] : []);

      const menuPerms = normalizeMenuPerms(data.menuPerms);

      arr.push({
        uid: data.uid || d.id,
        email: data.email || '',
        fullName: data.fullName || '',
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || '',
        empresas,
        createdAt: data.createdAt || null,
        token: data.token || '',
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : [],
        menuPerms
      });
    });
    arr.sort((a,b) => (a.fullName||'').localeCompare(b.fullName||''));
    usuarios.value = arr;
    paginaActual.value = 1;
  } catch (e) {
    console.error(e);
    addToast('danger','Error al cargar usuarios.');
  } finally {
    cargando.value = false;
  }
};

const filtrados = computed(() => {
  const q = (busqueda.value || '').trim().toLowerCase();
  const rol = (rolFiltro.value || '').trim().toLowerCase();
  const emp = (empresaFiltro.value || '').trim().toLowerCase();

  return usuarios.value.filter(u => {
    const okNombre = q ? (u.fullName || '').toLowerCase().includes(q) : true;
    const okRol = rol ? (u.role || '').toLowerCase() === rol : true;

    const empList = Array.isArray(u.empresas) ? u.empresas : [];
    const okEmp = emp ? empList.some(x => String(x).toLowerCase() === emp) : true;

    return okNombre && okRol && okEmp;
  });
});

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)));
const paginado = computed(() => {
  const start = (paginaActual.value - 1) * pageSize;
  return filtrados.value.slice(start, start + pageSize);
});
const visiblePages = computed(() => {
  const maxButtons = isSmallScreen.value ? 5 : 7;
  const pages = [];
  let start = Math.max(1, paginaActual.value - Math.floor(maxButtons/2));
  let end = Math.min(totalPaginas.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i=start; i<=end; i++) pages.push(i);
  return pages;
});
const goToPage = (n) => { if (n<1 || n>totalPaginas.value) return; paginaActual.value = n; };
const limpiarFiltros = () => { busqueda.value=''; rolFiltro.value=''; empresaFiltro.value=''; paginaActual.value=1; };

const abrirCrear = () => {
  esEdicion.value = false;
  showPassword.value = false;
  form.value = {
    email:'', fullName:'', role:'', phone:'', rut:'', password:'', uid:'',
    empresas: [],
    centrosAsignados: [],
    menuPerms: { allow: [], deny: [] }
  };
  ccSearch.value = '';
  permSearchAllow.value = '';
  permSearchDeny.value = '';
  offOpen.value = true;
};

const abrirEditar = (u) => {
  esEdicion.value = true;
  showPassword.value = false;
  form.value = {
    uid: u.uid,
    email: u.email || '',
    fullName: u.fullName || '',
    phone: formatPhoneCLUI(u.phone || ''),
    rut: formatRut(u.rut || ''),
    role: u.role || '',
    password: '',
    empresas: Array.isArray(u.empresas) ? [...u.empresas] : [],
    centrosAsignados: Array.isArray(u.centrosAsignados) ? [...u.centrosAsignados] : [],
    menuPerms: normalizeMenuPerms(u.menuPerms)
  };
  ccSearch.value = '';
  permSearchAllow.value = '';
  permSearchDeny.value = '';
  offOpen.value = true;
};

const cerrarOff = () => { offOpen.value = false; };
const toggleFiltros = (v) => { filtrosOpen.value = !!v; };

const functions = getFunctions(app, FUNCTIONS_REGION);
const cfCreate = httpsCallable(functions, 'adminCreateUser');
const cfUpdate = httpsCallable(functions, 'adminUpdateUser');
const cfDelete = httpsCallable(functions, 'adminDeleteUser');

const validar = () => {
  const data = form.value;

  if (!data.fullName?.trim()) { addToast('warning','Ingresa el nombre completo.'); return false; }
  if (!data.email?.trim())    { addToast('warning','Ingresa el email.'); return false; }

  if (!Array.isArray(data.empresas) || data.empresas.length === 0) {
    addToast('warning','Selecciona al menos una empresa.');
    return false;
  }

  if (!esEdicion.value && (!data.password || data.password.length < 6)) {
    addToast('warning','La contraseña debe tener al menos 6 caracteres.');
    return false;
  }

  if (String(data.phone || '').trim() && !phoneE164.value) {
    addToast('warning','Teléfono inválido. Usa formato +56 9 1234 5678.');
    return false;
  }

  if (String(data.rut || '').trim() && rutStatus.value === false) {
    addToast('warning','RUT inválido.');
    return false;
  }

  if (!data.role) { addToast('warning','Selecciona un rol.'); return false; }
  return true;
};

const guardar = async () => {
  if (!validar()) return;
  const data = form.value;
  accionando.value = true;

  try {
    const phone = phoneE164.value || '';
    if (!esEdicion.value) {
      const payload = {
        email: data.email,
        password: data.password,
        displayName: data.fullName,
        ...(phone ? { phone } : {})
      };

      const resp = await cfCreate(payload);

      const uid = resp?.data?.uid;
      if (!uid) { addToast('danger','No llegó UID desde la función.'); return; }

      await setDoc(doc(db, 'Usuarios', uid), {
        uid,
        email: data.email,
        fullName: data.fullName,
        phone: phone || '',
        rut: formatRut(data.rut || ''),
        role: data.role || '',
        empresas: Array.isArray(data.empresas) ? data.empresas : [],
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : [],
        menuPerms: normalizeMenuPerms(data.menuPerms),
        createdAt: serverTimestamp()
      });

      addToast('success','Usuario creado.');
    } else {
      const uid = data.uid;

      const payload = {
        uid,
        email: data.email,
        displayName: data.fullName,
        ...(phone ? { phone } : {})
      };

      await cfUpdate(payload);

      await updateDoc(doc(db, 'Usuarios', uid), {
        email: data.email,
        fullName: data.fullName,
        phone: phone || '',
        rut: formatRut(data.rut || ''),
        role: data.role || '',
        empresas: Array.isArray(data.empresas) ? data.empresas : [],
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : [],
        menuPerms: normalizeMenuPerms(data.menuPerms)
      });

      addToast('success','Cambios guardados.');
    }

    await cargarUsuarios();
    offOpen.value = false;
  } catch (e) {
    console.error('CALLABLE ERROR RAW:', e);
    console.error('CALLABLE ERROR DATA:', JSON.stringify({
      code: e?.code, message: e?.message, details: e?.details
    }, null, 2));
    addToast('danger', mapFunctionsError(e));
  } finally {
    accionando.value = false;
  }
};

const guardarSoloFirestore = async () => {
  if (!esEdicion.value) {
    addToast('warning','Primero crea el usuario.');
    return;
  }
  const uid = form.value.uid;
  if (!uid) { addToast('danger','Falta UID del usuario.'); return; }
  if (!Array.isArray(form.value.empresas) || form.value.empresas.length === 0) {
    addToast('warning','Selecciona al menos una empresa.');
    return;
  }
  if (String(form.value.phone || '').trim() && !phoneE164.value) {
    addToast('warning','Teléfono inválido. Usa formato +56 9 1234 5678.');
    return;
  }
  if (String(form.value.rut || '').trim() && rutStatus.value === false) {
    addToast('warning','RUT inválido.');
    return;
  }

  try {
    accionandoContratos.value = true;
    await updateDoc(doc(db, 'Usuarios', uid), {
      fullName: form.value.fullName || '',
      phone: phoneE164.value || '',
      rut: formatRut(form.value.rut || ''),
      role: form.value.role || '',
      empresas: Array.isArray(form.value.empresas) ? form.value.empresas : [],
      centrosAsignados: Array.isArray(form.value.centrosAsignados) ? form.value.centrosAsignados : [],
      menuPerms: normalizeMenuPerms(form.value.menuPerms)
    });

    const idx = usuarios.value.findIndex(x => x.uid === uid);
    if (idx >= 0) {
      usuarios.value[idx] = {
        ...usuarios.value[idx],
        fullName: form.value.fullName || '',
        phone: phoneE164.value || '',
        rut: formatRut(form.value.rut || ''),
        role: form.value.role || '',
        empresas: [...form.value.empresas],
        centrosAsignados: [...form.value.centrosAsignados],
        menuPerms: normalizeMenuPerms(form.value.menuPerms)
      };
    }

    addToast('success','Guardado en Firestore.');
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo guardar en Firestore.');
  } finally {
    accionandoContratos.value = false;
  }
};

const confirmOpen = ref(false);
const confirmRow  = ref(null);
const eliminando  = ref(false);

function abrirConfirm(u){
  confirmRow.value = u;
  confirmOpen.value = true;
}
function cerrarConfirm(){
  if (eliminando.value) return;
  confirmOpen.value = false;
  confirmRow.value = null;
}
async function confirmarEliminar(){
  if (!confirmRow.value) return;
  accionando.value = true;
  eliminando.value = true;
  uidEnAccion.value = confirmRow.value.uid;

  try {
    await cfDelete({ uid: confirmRow.value.uid });
    await deleteDoc(doc(db, 'Usuarios', confirmRow.value.uid));

    usuarios.value = usuarios.value.filter(x => x.uid !== confirmRow.value.uid);
    addToast('success','Usuario eliminado.');
    cerrarConfirm();
  } catch (e) {
    console.error('CALLABLE ERROR RAW:', e);
    console.error('CALLABLE ERROR DATA:', JSON.stringify({
      code: e?.code, message: e?.message, details: e?.details
    }, null, 2));

    const msg = mapFunctionsError(e);

    if (msg.toLowerCase().includes('no se encontró') || (e?.code||'').includes('not-found')) {
      try {
        await deleteDoc(doc(db, 'Usuarios', confirmRow.value.uid));
        usuarios.value = usuarios.value.filter(x => x.uid !== confirmRow.value.uid);
        addToast('warning','No estaba en Auth; se eliminó solo de Firestore.');
        cerrarConfirm();
      } catch (e2) {
        console.error(e2);
        addToast('danger','No se pudo eliminar el usuario de Firestore.');
      }
    } else {
      addToast('danger', msg);
    }
  } finally {
    accionando.value = false;
    eliminando.value = false;
    uidEnAccion.value = null;
  }
}
</script>

<style scoped>
:root {
  color-scheme: light;
}

.glow-1 {
  width: 280px;
  height: 280px;
  top: -60px;
  right: -40px;
  background: rgba(37, 99, 235, 0.12);
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

.filter-shell,
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

.filter-shell__header,
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

.filter-shell__body {
  padding: 1.2rem 1.3rem;
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

.list-counter {
  min-width: 52px;
  height: 52px;
  padding: 0 0.9rem;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
  font-weight: 800;
  font-size: 1rem;
  border: 1px solid rgba(37, 99, 235, 0.16);
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
  padding: 0 16px 0 44px;
  color: #0f172a;
  font-size: 0.95rem;
}

.search-input::placeholder {
  color: #94a3b8;
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

.users-table {
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
  z-index: 1;
}

.users-table tbody td {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: #1e293b;
  vertical-align: middle;
}

.users-table tbody tr {
  transition: background 0.2s ease, transform 0.2s ease;
}

.users-table tbody tr:hover {
  background: rgba(37, 99, 235, 0.02);
}

.row-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
  font-size: 1rem;
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

.data-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  color: #334155;
  font-size: 0.9rem;
}

.data-inline i {
  color: #94a3b8;
  flex: 0 0 auto;
}

.chip {
  display: inline-flex;
  align-items: center;
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

.chip-emerald {
  color: #047857;
  background: rgba(16, 185, 129, 0.10);
  border-color: rgba(16, 185, 129, 0.18);
}

.chip-danger {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.16);
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
  width: min(780px, 100%);
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

.empresa-box,
.contratos-box,
.perm-box {
  max-height: 260px;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  padding: 0.5rem 0.65rem;
  background: rgba(248, 250, 252, 0.72);
}

.empresa-box {
  max-height: 140px;
}

.perm-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 0.85rem;
  background: rgba(255,255,255,0.68);
}

.perm-group-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.18);
}

.perm-group-title:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
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

.table td, .table th {
  vertical-align: middle;
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

  .list-header,
  .filter-shell__header,
  .filter-shell__body {
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

@media (max-width: 576px) {
  .offcanvas-panel,
  .offcanvas-panel-sm {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
  }

  thead th:first-child,
  tbody td:first-child {
    width: 48px !important;
  }

  td .text-truncate {
    max-width: 180px;
  }

  .offcanvas-body .row.g-3 {
    row-gap: 0.75rem;
  }
}
</style>
