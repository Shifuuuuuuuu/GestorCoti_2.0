<!-- AdminUsuarios.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-users-page">
    <div class="container py-4 py-md-5">

      <!-- Header / acciones -->
      <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
        <h1 class="h5 h4-sm fw-semibold mb-0">Administrar usuarios</h1>

        <div class="d-flex align-items-stretch gap-2 flex-wrap">
          <button class="btn btn-outline-secondary d-inline-flex d-md-none" @click="toggleFiltros(true)">
            <i class="bi bi-sliders2 me-1"></i><span>Filtros</span>
          </button>

          <button class="btn btn-primary" @click="abrirCrear">
            <i class="bi bi-person-plus me-1"></i>
            <span class="d-none d-sm-inline">Agregar usuario</span>
            <span class="d-inline d-sm-none">Agregar</span>
          </button>

          <button class="btn btn-outline-secondary" @click="cargarUsuarios">
            <i class="bi bi-arrow-clockwise me-1"></i>
            <span class="d-none d-sm-inline">Recargar</span>
            <span class="d-inline d-sm-none">Reload</span>
          </button>
        </div>
      </div>

      <!-- Filtros (≥ md) -->
      <div class="card mb-3 d-none d-md-block">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-5">
              <label class="form-label">Buscar por nombre completo</label>
              <input class="form-control" v-model="busqueda" placeholder="Ej: Juan, María, etc." />
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Filtrar por rol</label>
              <select class="form-select" v-model="rolFiltro">
                <option value="">— Todos —</option>
                <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label">Filtrar por empresa</label>
              <select class="form-select" v-model="empresaFiltro">
                <option value="">— Todas —</option>
                <option v-for="e in empresasDisponibles" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>

            <div class="col-12 col-md-1">
              <button class="btn btn-dark w-100" @click="limpiarFiltros">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div class="fw-semibold">Usuarios</div>
          <span class="badge bg-dark-subtle text-dark-emphasis">
            {{ usuarios.length }} en total
          </span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargando" class="p-4 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else>
            <div v-if="paginado.length === 0" class="p-4 text-center text-secondary">
              No hay resultados con esos filtros.
            </div>

            <div class="table-responsive">
              <table class="table table-hover table-sm align-middle mb-0">
                <thead class="position-sticky top-0 bg-body">
                  <tr>
                    <th style="width:40px;"></th>
                    <th>Nombre</th>
                    <th class="d-none d-sm-table-cell">Email</th>
                    <th class="d-none d-md-table-cell">Empresas</th>
                    <th>Rol</th>
                    <th class="d-none d-lg-table-cell">Teléfono</th>
                    <th class="d-none d-lg-table-cell">RUT</th>
                    <th class="d-none d-xl-table-cell">Contratos</th>
                    <th class="d-none d-xl-table-cell">Creado</th>
                    <th style="width: 136px;" class="text-end pe-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="u in paginado" :key="u.uid">
                    <td><i class="bi bi-person-circle fs-5 text-secondary"></i></td>

                    <td class="fw-semibold">
                      <div class="text-truncate" style="max-width: 200px;">{{ u.fullName || '—' }}</div>
                      <div class="small text-secondary d-sm-none">{{ u.email || '—' }}</div>

                      <!-- En XS mostramos empresas debajo -->
                      <div class="d-sm-none mt-1 d-flex flex-wrap gap-1">
                        <span
                          v-for="e in (u.empresas||[]).slice(0,2)"
                          :key="u.uid + '-emp-xs-' + e"
                          class="badge bg-primary-subtle text-primary-emphasis">
                          {{ e }}
                        </span>
                        <span
                          v-if="(u.empresas||[]).length>2"
                          class="badge bg-dark-subtle text-dark-emphasis">
                          +{{ (u.empresas||[]).length-2 }}
                        </span>
                        <span v-if="(u.empresas||[]).length===0" class="badge bg-secondary-subtle text-secondary-emphasis">—</span>
                      </div>
                    </td>

                    <td class="d-none d-sm-table-cell">
                      <div class="text-truncate" style="max-width: 220px;">
                        {{ u.email || '—' }}
                      </div>
                    </td>

                    <!-- Empresas -->
                    <td class="d-none d-md-table-cell">
                      <div class="d-flex flex-wrap gap-1">
                        <span
                          v-for="e in (u.empresas||[]).slice(0,2)"
                          :key="u.uid + '-emp-' + e"
                          class="badge bg-primary-subtle text-primary-emphasis">
                          {{ e }}
                        </span>
                        <span
                          v-if="(u.empresas||[]).length>2"
                          class="badge bg-dark-subtle text-dark-emphasis">
                          +{{ (u.empresas||[]).length-2 }}
                        </span>
                        <span v-if="(u.empresas||[]).length===0" class="badge bg-secondary-subtle text-secondary-emphasis">—</span>
                      </div>
                    </td>

                    <td>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">
                        {{ u.role || '—' }}
                      </span>
                    </td>

                    <td class="d-none d-lg-table-cell">{{ u.phone || '—' }}</td>
                    <td class="d-none d-lg-table-cell">{{ u.rut || '—' }}</td>

                    <!-- Contratos -->
                    <td class="d-none d-xl-table-cell">
                      <div v-if="(u.centrosAsignados||[]).length===0" class="text-secondary small">—</div>
                      <div v-else class="d-flex flex-wrap gap-1">
                        <span
                          v-for="k in u.centrosAsignados.slice(0,3)"
                          :key="u.uid+'-'+k"
                          class="badge rounded-pill bg-info-subtle text-info-emphasis">
                          {{ nombreContrato(k) }}
                        </span>
                        <span v-if="u.centrosAsignados.length>3" class="badge rounded-pill bg-dark-subtle text-dark-emphasis">
                          +{{ u.centrosAsignados.length-3 }}
                        </span>
                      </div>
                    </td>

                    <td class="small text-secondary d-none d-xl-table-cell">{{ fmtFecha(u.createdAt) }}</td>

                    <td class="text-end pe-3">
                      <div class="btn-group btn-group-sm d-none d-md-inline-flex">
                        <button class="btn btn-outline-primary" @click="abrirEditar(u)">Editar</button>
                        <button
                          class="btn btn-outline-danger"
                          @click="abrirConfirm(u)"
                          :disabled="accionando && uidEnAccion===u.uid">
                          <span v-if="accionando && uidEnAccion===u.uid" class="spinner-border spinner-border-sm me-2"></span>
                          Eliminar
                        </button>
                      </div>

                      <div class="d-inline-flex d-md-none gap-1">
                        <button class="btn btn-outline-primary btn-sm" @click="abrirEditar(u)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button
                          class="btn btn-outline-danger btn-sm"
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

            <!-- Paginación -->
            <div class="card-footer">
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
        </div>
      </div>

      <!-- Offcanvas: crear/editar -->
      <div v-if="offOpen" class="offcanvas-backdrop" @click.self="cerrarOff">
        <div class="offcanvas-panel">
          <div class="offcanvas-header">
            <h5 class="mb-0">{{ esEdicion ? 'Editar usuario' : 'Crear usuario' }}</h5>
            <button class="btn-close" @click="cerrarOff"></button>
          </div>

          <div class="offcanvas-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Nombre completo</label>
                <input class="form-control" v-model="form.fullName" placeholder="Ej: Juan Pérez" />
              </div>

              <div class="col-12">
                <label class="form-label">Email (Auth & Firestore)</label>
                <input class="form-control" type="email" v-model="form.email" placeholder="email@dominio.com" />
              </div>

              <div class="col-12" v-if="!esEdicion">
                <label class="form-label">Contraseña (solo para crear en Auth)</label>
                <input class="form-control" type="password" v-model="form.password" placeholder="Mín. 6 caracteres" />
                <div class="form-text">No se guarda en Firestore.</div>
              </div>

              <div class="col-12 col-sm-6">
                <label class="form-label">Teléfono</label>
                <input class="form-control" v-model="form.phone" placeholder="+569..." />
              </div>

              <div class="col-12 col-sm-6">
                <label class="form-label">RUT</label>
                <input class="form-control" v-model="form.rut" placeholder="99.999.999-9" />
              </div>

              <!-- ======= Empresas (multi) ======= -->
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between">
                  <label class="form-label mb-0">Empresas</label>
                  <small class="text-secondary">{{ form.empresas.length }} seleccionada(s)</small>
                </div>

                <!-- Chips seleccionadas -->
                <div v-if="form.empresas.length" class="d-flex flex-wrap gap-1 mb-2">
                  <span
                    v-for="e in form.empresas"
                    :key="'sel-emp-'+e"
                    class="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                    {{ e }}
                    <button class="btn btn-sm btn-link text-primary ms-1 p-0 align-baseline"
                            @click="quitarEmpresa(e)">×</button>
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

                <div class="form-text mt-1">
                  Puedes seleccionar más de una empresa (se guarda en Firestore como <code>empresas: []</code>).
                </div>
              </div>
              <!-- ======= /Empresas (multi) ======= -->

              <div class="col-12">
                <label class="form-label">Rol</label>
                <select class="form-select" v-model="form.role">
                  <option value="">— Selecciona —</option>
                  <option v-for="r in rolesDisponibles" :key="'role-'+r" :value="r">{{ r }}</option>
                </select>
              </div>

              <!-- ======= Asignación de contratos ======= -->
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
                    class="badge rounded-pill bg-info-subtle text-info-emphasis">
                    {{ nombreContrato(k) }}
                    <button class="btn btn-sm btn-link text-info ms-1 p-0 align-baseline"
                            @click="quitarContrato(k)">×</button>
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
              <!-- ======= /Asignación de contratos ======= -->
            </div>
          </div>

          <div class="offcanvas-footer">
            <div class="d-flex flex-wrap gap-2 justify-content-end">
              <button class="btn btn-secondary" @click="cerrarOff">Cancelar</button>

              <button
                v-if="esEdicion"
                class="btn btn-outline-primary"
                :disabled="accionandoContratos"
                @click="guardarSoloFirestore">
                <span v-if="accionandoContratos" class="spinner-border spinner-border-sm me-2"></span>
                Guardar (solo Firestore)
              </button>

              <button class="btn btn-primary" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Offcanvas Filtros (móvil) -->
      <div v-if="filtrosOpen" class="offcanvas-backdrop" @click.self="toggleFiltros(false)">
        <div class="offcanvas-panel offcanvas-panel-sm">
          <div class="offcanvas-header">
            <h5 class="mb-0"><i class="bi bi-sliders2 me-2"></i>Filtros</h5>
            <button class="btn-close" @click="toggleFiltros(false)"></button>
          </div>
          <div class="offcanvas-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Buscar por nombre completo</label>
                <input class="form-control" v-model="busqueda" placeholder="Ej: Juan, María, etc." />
              </div>
              <div class="col-12">
                <label class="form-label">Filtrar por rol</label>
                <select class="form-select" v-model="rolFiltro">
                  <option value="">— Todos —</option>
                  <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Filtrar por empresa</label>
                <select class="form-select" v-model="empresaFiltro">
                  <option value="">— Todas —</option>
                  <option v-for="e in empresasDisponibles" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="offcanvas-footer">
            <div class="d-flex gap-2 justify-content-between w-100">
              <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              <button class="btn btn-primary" @click="toggleFiltros(false)">Aplicar</button>
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

    <!-- Modal CONFIRMAR ELIMINACIÓN -->
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
            ¿Seguro que quieres eliminar al usuario
            <strong>{{ confirmRow?.fullName || confirmRow?.email || '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Email:</span> <strong>{{ confirmRow?.email || '—' }}</strong></li>
            <li>
              <span class="text-secondary">Empresas:</span>
              <strong>{{ (confirmRow?.empresas||[]).join(', ') || '—' }}</strong>
            </li>
            <li><span class="text-secondary">Rol:</span> <strong>{{ confirmRow?.role || '—' }}</strong></li>
            <li><span class="text-secondary">Teléfono:</span> <strong>{{ confirmRow?.phone || '—' }}</strong></li>
            <li><span class="text-secondary">RUT:</span> <strong>{{ confirmRow?.rut || '—' }}</strong></li>
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
import { ref, computed, onMounted } from 'vue';
import { db } from '../stores/firebase';
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

/* ================== Contratos (centros de costo) ================== */
const centrosCosto = {
  '30858': 'CONTRATO 30858 INFRA CHUQUICAMATA',
  '27483': 'CONTRATO 27483 SUM. HORMIGON CHUQUICAMATA',
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
  '29207': 'CONTRATO 29207 INFRAESTRUCTURA DET',
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
const ccLista = Object.entries(centrosCosto).map(([key, label]) => ({ key, label }));
const nombreContrato = (k) => centrosCosto[k] || k;

/* ================== Constantes ================== */
const FUNCTIONS_REGION = 'southamerica-west1';
const rolesDisponibles = ['Admin','Aprobador/Editor','Generador solped','Editor',"Recepcion_OC"];
const empresasDisponibles = ['Xtreme Servicio', 'Xtreme Mining', 'Xtreme Hormigones'];

/* ================== Estado base ================== */
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

const form = ref({
  uid:'', email:'', fullName:'', phone:'', rut:'', role:'', password:'',
  empresas: [],
  centrosAsignados: []
});

const accionando = ref(false);
const accionandoContratos = ref(false);
const uidEnAccion = ref(null);

/* ================== Empresas multi (form) ================== */
const toggleEmpresa = (empresa, checked) => {
  const arr = [...(form.value.empresas || [])];
  const i = arr.indexOf(empresa);
  if (checked && i < 0) arr.push(empresa);
  if (!checked && i >= 0) arr.splice(i, 1);
  form.value.empresas = arr;
};
const quitarEmpresa = (empresa) => {
  form.value.empresas = (form.value.empresas || []).filter(e => e !== empresa);
};
const limpiarEmpresas = () => { form.value.empresas = []; };
const seleccionarTodasEmpresas = () => { form.value.empresas = [...empresasDisponibles]; };

/* ================== UI: contratos en offcanvas ================== */
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
const quitarContrato = (key) => {
  form.value.centrosAsignados = form.value.centrosAsignados.filter(k => k !== key);
};
const limpiarSeleccion = () => { form.value.centrosAsignados = []; };
const seleccionarTodosVisibles = () => {
  const visibles = ccFiltrados.value.map(c => c.key);
  const set = new Set([...form.value.centrosAsignados, ...visibles]);
  form.value.centrosAsignados = Array.from(set);
};

/* ================== Toasts ================== */
const toasts = ref([]);
const addToast = (type, text, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

/* ================== Helpers ================== */
const fmtFecha = (f) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : (f ? new Date(f) : null));
    if (!d) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
  } catch { return '—'; }
};

const mapFunctionsError = (e) => {
  const code = e?.code || '';
  const msg  = e?.message || '';
  if (msg === 'TOO_SHORT') return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg === 'INVALID_EMAIL') return 'Email inválido.';
  if (msg === 'MISSING_NAME') return 'Falta el nombre.';
  if (msg === 'EMAIL_IN_USE') return 'El email ya está en uso.';
  if (msg === 'USER_NOT_FOUND') return 'El usuario no existe.';
  if (msg === 'INVALID_PHONE') return 'Teléfono inválido.';
  if (code.includes('already-exists')) return 'El email ya está en uso.';
  if (code.includes('invalid-argument')) return 'Datos inválidos. Revisa email/contraseña.';
  if (code.includes('not-found')) return 'No se encontró el recurso.';
  if (code.includes('unauthenticated')) return 'Debes iniciar sesión para esta acción.';
  if (code.includes('permission-denied')) return 'No tienes permisos para esta acción.';
  return 'Error de servidor.';
};

/* ================== Cargar usuarios (Firestore) ================== */
const cargarUsuarios = async () => {
  cargando.value = true;
  try {
    const snap = await getDocs(collection(db, 'Usuarios'));
    const arr = [];
    snap.forEach(d => {
      const data = d.data() || {};

      // compat: si existe empresa string antigua, la convertimos a array
      const empresas = Array.isArray(data.empresas)
        ? data.empresas
        : (data.empresa ? [data.empresa] : []);

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
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : []
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
onMounted(cargarUsuarios);

/* ================== Filtros + paginado ================== */
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
  const isSmall = window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
  const maxButtons = isSmall ? 5 : 7;
  const pages = [];
  let start = Math.max(1, paginaActual.value - Math.floor(maxButtons/2));
  let end = Math.min(totalPaginas.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i=start; i<=end; i++) pages.push(i);
  return pages;
});
const goToPage = (n) => { if (n<1 || n>totalPaginas.value) return; paginaActual.value = n; };
const limpiarFiltros = () => { busqueda.value=''; rolFiltro.value=''; empresaFiltro.value=''; paginaActual.value=1; };

/* ================== Offcanvas crear/editar ================== */
const abrirCrear = () => {
  esEdicion.value = false;
  form.value = {
    email:'', fullName:'', role:'', phone:'', rut:'', password:'', uid:'',
    empresas: [],
    centrosAsignados: []
  };
  ccSearch.value = '';
  offOpen.value = true;
};

const abrirEditar = (u) => {
  esEdicion.value = true;
  form.value = {
    uid: u.uid,
    email: u.email || '',
    fullName: u.fullName || '',
    phone: u.phone || '',
    rut: u.rut || '',
    role: u.role || '',
    password: '',
    empresas: Array.isArray(u.empresas) ? [...u.empresas] : [],
    centrosAsignados: Array.isArray(u.centrosAsignados) ? [...u.centrosAsignados] : []
  };
  ccSearch.value = '';
  offOpen.value = true;
};

const cerrarOff = () => { offOpen.value = false; };

/* ================== Offcanvas filtros (móvil) ================== */
const toggleFiltros = (v) => { filtrosOpen.value = !!v; };

/* ================== Cloud Functions ================== */
const functions = getFunctions(undefined, FUNCTIONS_REGION);
const cfCreate = httpsCallable(functions, 'adminCreateUser');
const cfUpdate = httpsCallable(functions, 'adminUpdateUser');
const cfDelete = httpsCallable(functions, 'adminDeleteUser');

/* ================== Validación ================== */
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
  if (!data.role) { addToast('warning','Selecciona un rol.'); return false; }
  return true;
};

/* ================== Guardar (Auth + Firestore) ================== */
const guardar = async () => {
  if (!validar()) return;
  const data = form.value;
  accionando.value = true;

  try {
    if (!esEdicion.value) {
      const resp = await cfCreate({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
        phone: (data.phone || '').trim()
      });

      const uid = resp?.data?.uid;
      if (!uid) { addToast('danger','No llegó UID desde la función.'); return; }

      await setDoc(doc(db, 'Usuarios', uid), {
        uid,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || '',
        empresas: Array.isArray(data.empresas) ? data.empresas : [],
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : [],
        createdAt: serverTimestamp()
      });

      addToast('success','Usuario creado.');
    } else {
      const uid = data.uid;

      // Auth (solo lo que existe en Auth)
      await cfUpdate({
        uid,
        email: data.email,
        displayName: data.fullName,
        phone: (data.phone || '').trim()
      });

      // Firestore (todo lo editable)
      await updateDoc(doc(db, 'Usuarios', uid), {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || '',
        empresas: Array.isArray(data.empresas) ? data.empresas : [],
        centrosAsignados: Array.isArray(data.centrosAsignados) ? data.centrosAsignados : []
      });

      addToast('success','Cambios guardados.');
    }

    await cargarUsuarios();
    offOpen.value = false;
  } catch (e) {
    console.error(e);
    addToast('danger', mapFunctionsError(e));
  } finally {
    accionando.value = false;
  }
};

/* ================== Guardar SOLO Firestore (rol/empresas/contratos/etc) ================== */
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

  try {
    accionandoContratos.value = true;
    await updateDoc(doc(db, 'Usuarios', uid), {
      fullName: form.value.fullName || '',
      phone: form.value.phone || '',
      rut: form.value.rut || '',
      role: form.value.role || '',
      empresas: Array.isArray(form.value.empresas) ? form.value.empresas : [],
      centrosAsignados: Array.isArray(form.value.centrosAsignados) ? form.value.centrosAsignados : []
    });

    // refleja en la tabla sin recargar todo
    const idx = usuarios.value.findIndex(x => x.uid === uid);
    if (idx >= 0) {
      usuarios.value[idx] = {
        ...usuarios.value[idx],
        fullName: form.value.fullName || '',
        phone: form.value.phone || '',
        rut: form.value.rut || '',
        role: form.value.role || '',
        empresas: [...form.value.empresas],
        centrosAsignados: [...form.value.centrosAsignados]
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

/* ================== Eliminar (modal) ================== */
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
    console.error(e);
    const msg = mapFunctionsError(e);

    // si no existe en Auth, igual borra Firestore
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
.admin-users-page{ min-height:100vh; }

@media (min-width: 576px){
  .h4-sm{ font-size: 1.35rem; }
}

/* Offcanvas base */
.offcanvas-backdrop{
  position: fixed; inset: 0; z-index: 1080; display: grid; place-items: center;
  background: rgba(0,0,0,.45);
}
.offcanvas-panel{
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 620px; max-width: 95vw;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  display: flex; flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,.25);
  border-top-left-radius:.75rem; border-bottom-left-radius:.75rem;
  animation: slideIn .18s ease-out both;
}
.offcanvas-panel-sm{ width: 420px; max-width: 96vw; }
@keyframes slideIn { from{ transform: translateX(20px); opacity:0 } to{ transform:none; opacity:1 } }

.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem; border-bottom: 1px solid var(--bs-border-color);
}
.offcanvas-footer{ border-top: 1px solid var(--bs-border-color); border-bottom: 0; }
.offcanvas-body{ padding: 1rem; overflow: auto; }

/* Empresas scrolleable */
.empresa-box{
  max-height: 140px;
  overflow: auto;
  border: 1px solid var(--bs-border-color);
  border-radius: .5rem;
  padding: .35rem .5rem;
  background: var(--bs-secondary-bg);
}

/* Contratos scrolleable */
.contratos-box{
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--bs-border-color);
  border-radius: .5rem;
  padding: .35rem .5rem;
  background: var(--bs-secondary-bg);
}

/* Modal */
.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1090; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 700px; border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
  overflow: hidden; background: var(--bs-body-bg); color: var(--bs-body-color);
}
.vmodal-header, .vmodal-footer{
  padding: .9rem 1rem; border-bottom: 1px solid var(--bs-border-color);
}
.vmodal-footer{ border-top: 1px solid var(--bs-border-color); border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }

/* Toasts */
.toast-stack{
  position: fixed; right: 12px; bottom: 12px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 240px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* Icono del modal */
.confirm-icon{
  width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}

/* Tabla */
.table td, .table th{ vertical-align: middle; }
.table-responsive thead th{
  z-index: 1;
  border-bottom: 1px solid var(--bs-border-color);
}

.pagination .page-link{ min-width: 34px; text-align:center; }

@media (max-width: 576px){
  thead th:first-child, tbody td:first-child{ width: 34px !important; }
  td .text-truncate{ max-width: 180px; }
  .offcanvas-body .row.g-3{ row-gap: .75rem; }
}
</style>
