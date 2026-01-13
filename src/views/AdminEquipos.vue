<!-- EquiposAdmin.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="equipos-admin-page">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
        <h1 class="h5 h4-sm fw-semibold mb-0">Administrar equipos</h1>

        <div class="d-flex align-items-stretch gap-2 flex-wrap">
          <!-- Botón Filtros solo en < md -->
          <button class="btn btn-outline-secondary d-inline-flex d-md-none" @click="toggleFiltros(true)">
            <i class="bi bi-sliders2 me-1"></i> Filtros
          </button>

          <button class="btn btn-primary" @click="abrirCrear">
            <i class="bi bi-plus-lg me-1"></i>
            <span class="d-none d-sm-inline">Agregar equipo</span>
            <span class="d-inline d-sm-none">Agregar</span>
          </button>

          <button class="btn btn-outline-secondary" @click="cargarEquipos">
            <i class="bi bi-arrow-clockwise me-1"></i>
            <span class="d-none d-sm-inline">Recargar</span>
            <span class="d-inline d-sm-none">Reload</span>
          </button>

          <!-- Importar Excel/CSV -->
          <input ref="fileInput" type="file" class="d-none" accept=".xlsx,.xls,.csv" @change="onFilePicked">
          <button class="btn btn-success" @click="pedirArchivo" :disabled="importando">
            <span v-if="importando" class="spinner-border spinner-border-sm me-2"></span>
            <i class="bi bi-file-earmark-spreadsheet me-1"></i>
            <span class="d-none d-sm-inline">{{ importando ? 'Importando…' : 'Importar Excel' }}</span>
            <span class="d-inline d-sm-none">{{ importando ? 'Import…' : 'Excel' }}</span>
          </button>
        </div>
      </div>

      <!-- Progreso importación -->
      <div v-if="importando" class="alert alert-info d-flex align-items-center mb-3">
        <div class="me-3 spinner-border spinner-border-sm" role="status"></div>
        <div class="flex-grow-1">
          {{ importMsg }}
          <div class="progress mt-2" style="height: 6px;">
            <div class="progress-bar" role="progressbar" :style="{ width: importPct + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Filtros (solo ≥ md) -->
      <div class="card mb-3 d-none d-md-block">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-6">
              <label class="form-label">Buscar (equipo, marca, código, interno, motor)</label>
              <input
                class="form-control"
                v-model="busqueda"
                placeholder="Ej: SILO, RANDON, JK-2864, GE-456, QS213-03" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Filtrar por Clasificación</label>
              <select class="form-select" v-model="filtroClasificacion">
                <option value="">— Todas —</option>
                <option v-for="c in clasificacionesOrdenadas" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <button class="btn btn-dark w-100" @click="limpiarFiltros">Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="card-header bg-white d-flex align-items-center justify-content-between">
          <div class="fw-semibold">Equipos</div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ equipos.length }} en total</span>
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

            <div v-else class="table-responsive">
              <table class="table table-hover table-sm align-middle mb-0">
                <thead class="position-sticky top-0 bg-body">
                  <tr>
                    <th style="width:34px;"></th>
                    <th style="min-width:120px;">Código</th>
                    <th style="min-width:120px;">N° Interno</th>
                    <th class="d-none d-md-table-cell" style="min-width:140px;">N° Motor</th>
                    <th>Equipo</th>
                    <th class="d-none d-md-table-cell">Marca / Modelo</th>
                    <th class="d-none d-lg-table-cell">Clasificación</th>
                    <th class="d-none d-xl-table-cell">Tipo</th>
                    <th class="text-center d-none d-xl-table-cell">Año</th>
                    <th class="d-none d-xl-table-cell">Localización</th>
                    <th class="text-end pe-3" style="width:160px;">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="e in paginado" :key="e.__id">
                    <td><i class="bi bi-truck-front text-secondary"></i></td>

                    <td class="fw-semibold text-nowrap">
                      <div class="text-truncate" style="max-width:120px;">{{ e.codigo || '—' }}</div>

                      <!-- XS: resumen -->
                      <div class="small text-secondary d-md-none mt-1">
                        <div class="d-flex flex-wrap gap-2">
                          <span><strong>Int:</strong> {{ e.numero_interno || '—' }}</span>
                          <span><strong>Motor:</strong> {{ e.numero_motor || '—' }}</span>
                        </div>
                        <div class="mt-1">
                          <span class="me-2">{{ e.marca || '—' }}</span>
                          <span v-if="e.modelo">/ {{ e.modelo }}</span>
                        </div>
                      </div>
                    </td>

                    <td class="text-nowrap">
                      <span class="badge bg-primary-subtle text-primary-emphasis">
                        {{ e.numero_interno || '—' }}
                      </span>
                    </td>

                    <td class="small d-none d-md-table-cell">
                      <span class="badge bg-info-subtle text-info-emphasis">
                        {{ e.numero_motor || '—' }}
                      </span>
                    </td>

                    <td class="small">
                      <div class="text-truncate" style="max-width:240px;">{{ e.equipo || '—' }}</div>
                      <div class="small text-secondary d-lg-none">
                        <span v-if="e.clasificacion1">{{ e.clasificacion1 }}</span>
                      </div>
                    </td>

                    <td class="small d-none d-md-table-cell">
                      {{ e.marca || '—' }}<span v-if="e.modelo"> / {{ e.modelo }}</span>
                    </td>

                    <td class="d-none d-lg-table-cell">
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">
                        {{ e.clasificacion1 || '—' }}
                      </span>
                    </td>

                    <td class="small d-none d-xl-table-cell">{{ e.tipo_equipo || '—' }}</td>
                    <td class="text-center d-none d-xl-table-cell">{{ e.ano ?? '—' }}</td>
                    <td class="small d-none d-xl-table-cell">{{ e.localizacion || '—' }}</td>

                    <td class="text-end pe-3">
                      <div class="btn-group btn-group-sm d-none d-md-inline-flex">
                        <button class="btn btn-outline-primary" @click="abrirEditar(e)">Editar</button>
                        <button class="btn btn-outline-danger"
                                :disabled="accionando && idEnAccion===e.__id"
                                @click="abrirConfirm(e)">
                          <span v-if="accionando && idEnAccion===e.__id" class="spinner-border spinner-border-sm me-2"></span>
                          Eliminar
                        </button>
                      </div>

                      <div class="d-inline-flex d-md-none gap-1">
                        <button class="btn btn-outline-primary btn-sm" @click="abrirEditar(e)" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm"
                                :disabled="accionando && idEnAccion===e.__id"
                                @click="abrirConfirm(e)"
                                title="Eliminar">
                          <span v-if="accionando && idEnAccion===e.__id" class="spinner-border spinner-border-sm"></span>
                          <i v-else class="bi bi-trash3"></i>
                        </button>
                      </div>

                      <div class="small text-secondary mt-1 d-none d-md-block" v-if="e.creado || e.actualizado">
                        <span v-if="e.creado">Creado: {{ fmtFecha(e.creado) }}</span>
                        <span v-if="e.actualizado"> · Act.: {{ fmtFecha(e.actualizado) }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="card-footer bg-white">
              <nav class="overflow-auto">
                <ul class="pagination pagination-sm justify-content-center mb-0 flex-wrap gap-1">
                  <li class="page-item" :class="{disabled: paginaActual===1}">
                    <button class="page-link" @click="goToPage(paginaActual-1)" aria-label="Anterior">«</button>
                  </li>
                  <li v-for="n in visiblePages" :key="'pg-'+n" class="page-item" :class="{active: paginaActual===n}">
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

      <!-- Offcanvas crear/editar -->
      <div v-if="offOpen" class="offcanvas-backdrop" @click.self="cerrarOff">
        <div class="offcanvas-panel">
          <div class="offcanvas-header">
            <h5 class="mb-0">{{ esEdicion ? 'Editar equipo' : 'Agregar equipo' }}</h5>
            <button class="btn-close" @click="cerrarOff"></button>
          </div>

          <div class="offcanvas-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Código</label>
                <input class="form-control" v-model="form.codigo" placeholder="Ej: JK-2864" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">N° Interno</label>
                <input class="form-control" v-model="form.numero_interno" placeholder="Ej: GE-456" />
              </div>

              <div class="col-12">
                <label class="form-label">N° Motor</label>
                <input class="form-control" v-model="form.numero_motor" placeholder="Ej: QS213-03" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Año</label>
                <input class="form-control" type="number" v-model.number="form.ano" min="1900" max="2100" />
              </div>

              <div class="col-12">
                <label class="form-label">Equipo</label>
                <input class="form-control" v-model="form.equipo" placeholder="Descripción del equipo" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Marca</label>
                <input class="form-control" v-model="form.marca" placeholder="RANDON" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Modelo</label>
                <input class="form-control" v-model="form.modelo" placeholder="SRLTV0327" />
              </div>

              <div class="col-12">
                <label class="form-label">Clasificación</label>
                <input class="form-control" v-model="form.clasificacion1" placeholder="SEMI REMOLQUE SILO" />
              </div>

              <div class="col-12">
                <label class="form-label">Tipo de equipo</label>
                <input class="form-control" v-model="form.tipo_equipo" placeholder="SEMI REMOLQUE SILO" />
              </div>

              <div class="col-12">
                <label class="form-label">N° Chasis</label>
                <input class="form-control" v-model="form.numero_chasis" placeholder="9ADH0973BCM343474" />
              </div>

              <div class="col-12">
                <label class="form-label">Localización</label>
                <input class="form-control" v-model="form.localizacion" placeholder="22368 DET\\ CANECHE" />
              </div>

              <div class="col-12" v-if="esEdicion && (form.creado || form.actualizado)">
                <div class="small text-secondary">
                  <div v-if="form.creado">Creado: {{ fmtFecha(form.creado) }}</div>
                  <div v-if="form.actualizado">Actualizado: {{ fmtFecha(form.actualizado) }}</div>
                </div>
              </div>

            </div>
          </div>

          <div class="offcanvas-footer">
            <div class="d-flex flex-wrap gap-2 justify-content-end">
              <button class="btn btn-outline-secondary" @click="cerrarOff">Cancelar</button>
              <button class="btn btn-primary" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear equipo' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Offcanvas Filtros (solo móviles) -->
      <div v-if="filtrosOpen" class="offcanvas-backdrop" @click.self="toggleFiltros(false)">
        <div class="offcanvas-panel offcanvas-panel-sm">
          <div class="offcanvas-header">
            <h5 class="mb-0"><i class="bi bi-sliders2 me-2"></i>Filtros</h5>
            <button class="btn-close" @click="toggleFiltros(false)"></button>
          </div>
          <div class="offcanvas-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Buscar (equipo, marca, código, interno, motor)</label>
                <input class="form-control" v-model="busqueda" placeholder="Ej: SILO, RANDON, JK-2864, GE-456, QS213-03" />
              </div>

              <div class="col-12">
                <label class="form-label">Filtrar por Clasificación</label>
                <select class="form-select" v-model="filtroClasificacion">
                  <option value="">— Todas —</option>
                  <option v-for="c in clasificacionesOrdenadas" :key="c" :value="c">{{ c }}</option>
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
            ¿Seguro que quieres eliminar el equipo
            <strong>{{ confirmRow?.codigo || confirmRow?.equipo || '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Código:</span> <strong>{{ confirmRow?.codigo || '—' }}</strong></li>
            <li><span class="text-secondary">N° Interno:</span> <strong>{{ confirmRow?.numero_interno || '—' }}</strong></li>
            <li><span class="text-secondary">N° Motor:</span> <strong>{{ confirmRow?.numero_motor || '—' }}</strong></li>
            <li><span class="text-secondary">Equipo:</span> <strong>{{ confirmRow?.equipo || '—' }}</strong></li>
            <li><span class="text-secondary">Marca/Modelo:</span>
              <strong>{{ confirmRow?.marca || '—' }} <span v-if="confirmRow?.modelo">/ {{ confirmRow?.modelo }}</span></strong>
            </li>
            <li><span class="text-secondary">Clasificación:</span> <strong>{{ confirmRow?.clasificacion1 || '—' }}</strong></li>
            <li><span class="text-secondary">Localización:</span> <strong>{{ confirmRow?.localizacion || '—' }}</strong></li>
          </ul>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="cerrarConfirm" :disabled="eliminando">Cancelar</button>
          <button class="btn btn-danger" @click="confirmarEliminar" :disabled="eliminando">
            <span v-if="eliminando" class="spinner-border spinner-border-sm me-2"></span>
            Eliminar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { db } from '../stores/firebase';
import * as XLSX from 'xlsx';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, writeBatch
} from 'firebase/firestore';

type Equipo = {
  __id: string;
  actualizado?: any;
  ano?: number | null;
  clasificacion1?: string;
  codigo?: string;
  creado?: any;
  equipo?: string;
  localizacion?: string;
  marca?: string;
  modelo?: string;
  numero_chasis?: string;
  tipo_equipo?: string;

  numero_interno?: string;
  numero_motor?: string;
};

/* ===== Estado general ===== */
const cargando = ref(true);
const equipos = ref<Equipo[]>([]);

const busqueda = ref('');
const filtroClasificacion = ref('');
const paginaActual = ref(1);
const pageSize = 10;

const offOpen = ref(false);
const esEdicion = ref(false);
const filtrosOpen = ref(false);
const form = ref<Partial<Equipo>>({});

const accionando = ref(false);
const idEnAccion = ref<string | null>(null);

/* ===== Toasts ===== */
const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

/* ===== Formateos ===== */
const fmtFecha = (f:any) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : (f ? new Date(f) : null));
    if (!d) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
  } catch { return '—'; }
};

/* ===== Carga de equipos ===== */
const cargarEquipos = async () => {
  cargando.value = true;
  try {
    const base = query(collection(db, 'equipos'), orderBy('equipo'));
    const snap = await getDocs(base);
    const arr:Equipo[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      arr.push({
        __id: d.id,
        actualizado: data.actualizado || null,
        ano: typeof data.ano === 'number' ? data.ano : Number(data.ano) || null,
        clasificacion1: data.clasificacion1 || '',
        codigo: data.codigo || '',
        creado: data.creado || null,
        equipo: data.equipo || '',
        localizacion: data.localizacion || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        numero_chasis: data.numero_chasis || '',
        tipo_equipo: data.tipo_equipo || '',

        // ✅ internos + motor (compat camelCase)
        numero_interno: data.numero_interno || data.numeroInterno || '',
        numero_motor: data.numero_motor || data.numeroMotor || '',
      });
    });

    arr.sort((a,b) => {
      const ba = (b.creado?.toMillis?.() ?? 0);
      const aa = (a.creado?.toMillis?.() ?? 0);
      if (ba !== aa) return ba - aa;
      return (a.equipo||'').localeCompare(b.equipo||'');
    });

    equipos.value = arr;
    paginaActual.value = 1;
  } catch (e) {
    console.error(e);
    addToast('danger','Error al cargar equipos.');
  } finally {
    cargando.value = false;
  }
};
onMounted(cargarEquipos);

/* ===== Filtros y paginado ===== */
const clasificaciones = computed(() => {
  const set = new Set<string>();
  equipos.value.forEach(e => { if (e.clasificacion1) set.add(e.clasificacion1); });
  return Array.from(set);
});
const clasificacionesOrdenadas = computed(() => [...clasificaciones.value].sort((a,b) => a.localeCompare(b)));

const filtrados = computed(() => {
  const q = (busqueda.value || '').toLowerCase().trim();
  const clasif = (filtroClasificacion.value || '').toLowerCase().trim();

  return equipos.value.filter(e => {
    const valores = [
      e.equipo || '',
      e.marca || '',
      e.codigo || '',
      e.numero_interno || '',
      e.numero_motor || '',
      e.modelo || '',
      e.numero_chasis || '',
      e.localizacion || '',
      e.tipo_equipo || '',
      e.clasificacion1 || ''
    ].map(v => v.toLowerCase());

    const okTexto = q ? valores.some(v => v.includes(q)) : true;
    const okClasif = clasif ? (e.clasificacion1 || '').toLowerCase() === clasif : true;
    return okTexto && okClasif;
  });
});

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)));
const paginado = computed(() => {
  const start = (paginaActual.value - 1) * pageSize;
  return filtrados.value.slice(start, start + pageSize);
});

const visiblePages = computed(() => {
  const isSmall = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 576px)').matches;
  const maxButtons = isSmall ? 5 : 7;
  const pages:number[] = [];
  let start = Math.max(1, paginaActual.value - Math.floor(maxButtons/2));
  let end = Math.min(totalPaginas.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i=start; i<=end; i++) pages.push(i);
  return pages;
});

const goToPage = (n:number) => { if (n>=1 && n<=totalPaginas.value) paginaActual.value = n; };
const limpiarFiltros = () => { busqueda.value=''; filtroClasificacion.value=''; paginaActual.value=1; };

/* ===== CRUD manual ===== */
const abrirCrear = () => {
  esEdicion.value = false;
  form.value = {
    codigo: '',
    numero_interno: '',
    numero_motor: '',
    equipo: '',
    marca: '',
    modelo: '',
    ano: null,
    numero_chasis: '',
    tipo_equipo: '',
    clasificacion1: '',
    localizacion: ''
  };
  offOpen.value = true;
};

const abrirEditar = (e:Equipo) => {
  esEdicion.value = true;
  form.value = { ...e };
  offOpen.value = true;
};

const cerrarOff = () => { offOpen.value = false; };

/* ===== Offcanvas filtros (móvil) ===== */
const toggleFiltros = (v:boolean) => { filtrosOpen.value = !!v; };

/* ===== Validación y Guardado ===== */
const validarForm = () => {
  if (!form.value.codigo?.trim()) { addToast('warning','Ingresa el código.'); return false; }
  if (!form.value.equipo?.trim()) { addToast('warning','Ingresa la descripción del equipo.'); return false; }
  if (!form.value.marca?.trim()) { addToast('warning','Ingresa la marca.'); return false; }
  if (!form.value.clasificacion1?.trim()) { addToast('warning','Ingresa la clasificación.'); return false; }
  if (!form.value.tipo_equipo?.trim()) { addToast('warning','Ingresa el tipo de equipo.'); return false; }
  return true;
};

const guardar = async () => {
  if (!validarForm()) return;
  accionando.value = true;
  try {
    const payload:any = {
      codigo: (form.value.codigo || '').trim(),
      numero_interno: (form.value.numero_interno || '').trim() || 'No hay información',
      numero_motor: (form.value.numero_motor || '').trim() || 'No hay información',
      equipo: (form.value.equipo || 'No hay información').trim() || 'No hay información',
      marca: (form.value.marca || 'No hay información').trim() || 'No hay información',
      modelo: (form.value.modelo || 'No hay información').trim() || 'No hay información',
      ano: typeof form.value.ano === 'number' ? form.value.ano : (form.value.ano ? Number(form.value.ano) : null),
      numero_chasis: (form.value.numero_chasis || 'No hay información').trim() || 'No hay información',
      tipo_equipo: (form.value.tipo_equipo || 'No hay información').trim() || 'No hay información',
      clasificacion1: (form.value.clasificacion1 || 'No hay información').trim() || 'No hay información',
      localizacion: (form.value.localizacion || 'No hay información').trim() || 'No hay información'
    };

    if (!esEdicion.value) {
      const yaExiste = equipos.value.some(e => (e.codigo || '').toLowerCase() === payload.codigo.toLowerCase());
      if (yaExiste) { addToast('warning','Ya existe un equipo con ese código.'); accionando.value=false; return; }

      payload.creado = serverTimestamp();
      payload.actualizado = serverTimestamp();

      await addDoc(collection(db, 'equipos'), payload);
      addToast('success','Equipo creado.');
    } else {
      payload.actualizado = serverTimestamp();
      await updateDoc(doc(db, 'equipos', form.value.__id as string), payload);
      addToast('success','Cambios guardados.');
    }

    await cargarEquipos();
    offOpen.value = false;
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo guardar el equipo.');
  } finally {
    accionando.value = false;
  }
};

/* ===== Modal de confirmación de borrado ===== */
const confirmOpen = ref(false);
const confirmRow  = ref<Equipo | null>(null);
const eliminando  = ref(false);

function abrirConfirm(e:Equipo){ confirmRow.value = e; confirmOpen.value = true; }
function cerrarConfirm(){ if (!eliminando.value){ confirmOpen.value = false; confirmRow.value = null; } }

async function confirmarEliminar(){
  if (!confirmRow.value) return;
  accionando.value = true;
  eliminando.value = true;
  idEnAccion.value = confirmRow.value.__id;
  try {
    await deleteDoc(doc(db, 'equipos', confirmRow.value.__id));
    equipos.value = equipos.value.filter(x => x.__id !== confirmRow.value!.__id);
    addToast('success','Equipo eliminado.');
    cerrarConfirm();
  } catch (err) {
    console.error(err);
    addToast('danger','No se pudo eliminar el equipo.');
  } finally {
    accionando.value = false;
    eliminando.value = false;
    idEnAccion.value = null;
  }
}

/* ====== IMPORTADOR MASIVO (Excel/CSV) ====== */
const fileInput = ref<HTMLInputElement|null>(null);
const importando = ref(false);
const importMsg = ref('');
const importPct = ref(0);

function pedirArchivo(){ fileInput.value?.click(); }
function onFilePicked(e: Event){
  const input = e.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  importarExcel(file).finally(()=>{ if (input) input.value = ''; });
}

/* Normalizadores y utilidades */
const normTxt = (s:any) => String(s ?? '')
  .toString()
  .normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .trim();

// clave para headers: colapsa espacios / saltos de línea / underscores
const normKey = (s:any) => normTxt(s)
  .toLowerCase()
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/[_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toStr = (s:any) => normTxt(s);
const toInt = (v:any) => {
  const n = Number(String(v).replace(/[^\d-]/g,''));
  return Number.isFinite(n) ? n : undefined;
};

function buildKeywords(e:any){
  const base = [
    e.codigo, e.numero_interno, e.numero_motor,
    e.equipo, e.marca, e.modelo, e.numero_chasis,
    e.localizacion, e.clasificacion1, e.tipo_equipo
  ].map(normTxt).filter(Boolean);

  const tokens = new Set<string>();
  for (const p of base){
    for (const w of p.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)){
      tokens.add(w);
      for (let i=1;i<=Math.min(10,w.length);i++){
        tokens.add(w.slice(0,i));
      }
    }
  }
  return Array.from(tokens);
}

function mapRow(raw:any){
  const get = (k: string, alt: string[] = []) => {
    const keys = [k, ...alt].map(normKey);
    const headerKeys = Object.keys(raw);

    for (const h of headerKeys){
      const nh = normKey(h);
      if (keys.includes(nh)) return raw[h];

      // fallback: compara sin espacios (por si viene "NUMEROINTERNO")
      const nh2 = nh.replace(/\s+/g,'');
      if (keys.some(x => x.replace(/\s+/g,'') === nh2)) return raw[h];
    }
    return undefined;
  };

  const equipo          = toStr(get('Equipo'));
  const codigo          = toStr(get('Código', ['Codigo','CODIGO']));
  const ano             = toInt(get('AÑO', ['ANO','Año','Anio']));
  const marca           = toStr(get('MARCA'));
  const modelo          = toStr(get('MODELO'));
  const clasificacion1  = toStr(get('Clasificación 1', ['Clasificacion 1','CLASIFICACION 1']));
  const tipo_equipo     = toStr(get('Tipo de equipo', ['Tipo equipo','Tipo']));
  const numero_chasis   = toStr(get('NUMERO DE CHASIS', ['N° Chasis','N CHASIS','Numero chasis']));
  const localizacion    = toStr(get('Localización', ['Localizacion','Ubicacion']));

  // ✅ numero interno (tu Excel viene como "numero interno" a veces)
  const numero_interno  = toStr(get('NUMERO INTERNO', [
    'numero interno','Numero interno','N° Interno','N Interno','Interno','NUMERO_INTERNO','NUMERO  INTERNO'
  ]));

  // ✅ numero de motor (tu Excel viene como "NUMERO DE MOTOR")
  const numero_motor    = toStr(get('NUMERO DE MOTOR', [
    'Numero de motor','numero de motor','NUMERO MOTOR','Numero motor','N° Motor','N Motor','MOTOR'
  ]));

  return {
    codigo: codigo || '',
    numero_interno,
    numero_motor,
    equipo,
    ano,
    marca,
    modelo,
    clasificacion1,
    tipo_equipo,
    numero_chasis,
    localizacion
  };
}

/* Upsert con relleno "No hay información" en vacíos */
async function importarExcel(file: File){
  try{
    importando.value = true;
    importMsg.value = 'Leyendo archivo…';
    importPct.value = 3;

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows:any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

    if (!rows.length){ addToast('warning','El archivo está vacío.'); return; }

    // Debug: headers reales detectados
    console.log('Headers detectados:', Object.keys(rows[0] || {}));

    const parsed = rows.map(mapRow)
      .filter(r => (r.codigo || r.numero_chasis || r.equipo));

    if (!parsed.length){ addToast('warning','No se encontraron filas válidas.'); return; }

    const conInterno = parsed.filter(r => (r.numero_interno || '').trim()).length;
    const conMotor   = parsed.filter(r => (r.numero_motor || '').trim()).length;

    if (conInterno === 0){
      addToast('warning','No se detectó "NUMERO INTERNO" en el Excel. Revisa el encabezado.', 4500);
    }
    if (conMotor === 0){
      addToast('warning','No se detectó "NUMERO DE MOTOR" en el Excel. Revisa el encabezado.', 4500);
    }

    // Índices de existentes
    importMsg.value = 'Cargando datos existentes…';
    importPct.value = 10;

    const snap = await getDocs(collection(db,'equipos'));
    const byCodigo = new Map<string, any>();
    const byChasis = new Map<string, any>();

    snap.forEach(d => {
      const x:any = { __id: d.id, ...d.data() };
      const c = String(x.codigo || '').trim().toLowerCase();
      const ch = String(x.numero_chasis || '').trim().toLowerCase();
      if (c) byCodigo.set(c, x);
      if (ch) byChasis.set(ch, x);
    });

    // Firestore batch limit = 500 ops
    const total = parsed.length;
    let done = 0;
    const chunkSize = 450;

    for (let i=0; i<parsed.length; i+=chunkSize){
      const slice = parsed.slice(i, i+chunkSize);
      const batch = writeBatch(db);

      for (const r of slice){
        const incoming:any = {
          codigo: r.codigo || '',
          numero_interno: r.numero_interno || '',
          numero_motor: r.numero_motor || '',
          equipo: r.equipo || '',
          marca: r.marca || '',
          modelo: r.modelo || '',
          ano: r.ano ?? null,
          numero_chasis: r.numero_chasis || '',
          tipo_equipo: r.tipo_equipo || '',
          clasificacion1: r.clasificacion1 || '',
          localizacion: r.localizacion || ''
        };

        const keyCodigo = (incoming.codigo || '').toLowerCase();
        const keyChasis = (incoming.numero_chasis || '').toLowerCase();
        const found = (keyCodigo && byCodigo.get(keyCodigo)) || (keyChasis && byChasis.get(keyChasis));

        if (found){
          const merged:any = {
            codigo: incoming.codigo || (found.codigo || ''),
            numero_interno: incoming.numero_interno || (found.numero_interno || found.numeroInterno || 'No hay información'),
            numero_motor: incoming.numero_motor || (found.numero_motor || found.numeroMotor || 'No hay información'),
            equipo: incoming.equipo || (found.equipo || 'No hay información'),
            marca: incoming.marca || (found.marca || 'No hay información'),
            modelo: incoming.modelo || (found.modelo || 'No hay información'),
            ano: (incoming.ano ?? found.ano ?? null),
            numero_chasis: incoming.numero_chasis || (found.numero_chasis || 'No hay información'),
            tipo_equipo: incoming.tipo_equipo || (found.tipo_equipo || 'No hay información'),
            clasificacion1: incoming.clasificacion1 || (found.clasificacion1 || 'No hay información'),
            localizacion: incoming.localizacion || (found.localizacion || 'No hay información'),
          };
          merged.keywords = buildKeywords(merged);

          const refDoc = doc(db, 'equipos', found.__id);
          batch.update(refDoc, { ...merged, actualizado: serverTimestamp() });
        } else {
          const payload:any = {
            codigo: incoming.codigo,
            numero_interno: incoming.numero_interno || 'No hay información',
            numero_motor: incoming.numero_motor || 'No hay información',
            equipo: incoming.equipo || 'No hay información',
            marca: incoming.marca || 'No hay información',
            modelo: incoming.modelo || 'No hay información',
            ano: incoming.ano ?? null,
            numero_chasis: incoming.numero_chasis || 'No hay información',
            tipo_equipo: incoming.tipo_equipo || 'No hay información',
            clasificacion1: incoming.clasificacion1 || 'No hay información',
            localizacion: incoming.localizacion || 'No hay información',
          };
          payload.keywords = buildKeywords(payload);

          const refDoc = doc(collection(db, 'equipos'));
          batch.set(refDoc, { ...payload, creado: serverTimestamp(), actualizado: serverTimestamp() });
        }
      }

      await batch.commit();
      done += slice.length;
      importMsg.value = `Sincronizando… ${done} / ${total}`;
      importPct.value = Math.min(98, Math.round(10 + (done/total)*88));
    }

    importMsg.value = 'Actualizando vista…';
    importPct.value = 100;
    await cargarEquipos();
    addToast('success', `Importación completada: ${total} fila(s) procesadas.`);
  } catch (e){
    console.error(e);
    addToast('danger','Error al importar. Revisa consola y encabezados del Excel.');
  } finally {
    importando.value = false;
    setTimeout(()=>{ importMsg.value = ''; importPct.value = 0; }, 800);
  }
}
</script>

<style scoped>
.equipos-admin-page{
  min-height:100vh;
  background:
    radial-gradient(900px 400px at -10% -20%, rgba(0,0,0,.03), transparent 60%),
    radial-gradient(900px 400px at 110% 0%, rgba(0,0,0,.03), transparent 60%),
    #f8fafc;
}
@media (min-width: 576px){
  .h4-sm{ font-size: 1.35rem; }
}

/* Offcanvas lateral derecho */
.offcanvas-backdrop{
  position: fixed; inset: 0; z-index: 1080; display: grid; place-items: center;
  background: rgba(0,0,0,.45);
}
.offcanvas-panel{
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 560px; max-width: 95vw;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  display: flex; flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,.25);
  border-top-left-radius:.75rem; border-bottom-left-radius:.75rem;
  animation: slideIn .18s ease-out both;
}
.offcanvas-panel-sm{ width: 420px; max-width: 96vw; }
@keyframes slideIn { from{ transform: translateX(20px); opacity: 0; } to{ transform:none; opacity:1; } }
.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem; border-bottom: 1px solid var(--bs-border-color);
}
.offcanvas-footer{ border-top: 1px solid var(--bs-border-color); border-bottom: 0; }
.offcanvas-body{ padding: 1rem; overflow: auto; }

/* Modal genérico */
.vmodal-backdrop{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1090; display: grid; place-items: center; padding: 1rem;
}
.vmodal{
  width: 100%; max-width: 700px;  border-radius: .75rem;
  box-shadow: 0 20px 50px rgba(0,0,0,.25); overflow: hidden;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
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

/* Icono del modal de eliminación */
.confirm-icon{
  width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626); color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}

/* Tabla responsive */
.table td, .table th{ vertical-align: middle; }
.table-responsive thead th{
  z-index: 1; border-bottom: 1px solid var(--bs-border-color);
}
@media (max-width: 576px){
  thead th:first-child, tbody td:first-child{ width: 34px !important; }
  td .text-truncate{ max-width: 180px; }
}
.pagination .page-link{ min-width: 34px; text-align:center; }

/* Progreso import */
.progress { background: #f1f5f9; }
.progress-bar { background: #16a34a; }
</style>
