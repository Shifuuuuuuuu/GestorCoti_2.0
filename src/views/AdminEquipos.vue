<!-- EquiposAdmin.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="equipos-admin-page">
    <div class="page-glow glow-1"></div>
    <div class="page-glow glow-2"></div>

    <div class="container py-4 py-md-5 position-relative">

      <!-- HERO -->
      <section class="hero-card mb-4">
        <div class="hero-pattern"></div>

        <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap position-relative">
          <div>
            <div class="hero-badge mb-2">
              <i class="bi bi-truck me-2"></i>
              Gestión operativa
            </div>

            <h1 class="hero-title mb-1">Administrar equipos</h1>
            <p class="hero-subtitle mb-0">
              Gestiona equipos, importa información desde Excel y revisa registros incompletos de forma clara y ordenada.
            </p>
          </div>

          <div class="hero-actions d-flex align-items-stretch gap-2 flex-wrap w-100 w-xl-auto ms-xl-3">
            <button class="btn btn-soft-secondary btn-toolbar d-inline-flex d-md-none" @click="toggleFiltros(true)">
              <i class="bi bi-sliders2 me-1"></i> Filtros
            </button>

            <button class="btn btn-brand btn-toolbar" @click="abrirCrear">
              <i class="bi bi-plus-lg me-1"></i>
              <span class="d-none d-sm-inline">Agregar equipo</span>
              <span class="d-inline d-sm-none">Agregar</span>
            </button>

            <button
              class="btn btn-soft-emerald btn-toolbar"
              @click="exportarExcelFaltantes"
              :disabled="cargando || !equipos.length"
            >
              <i class="bi bi-download me-1"></i>
              <span class="d-none d-sm-inline">Excel faltantes</span>
              <span class="d-inline d-sm-none">Faltantes</span>
            </button>

            <button class="btn btn-soft-primary btn-toolbar" @click="cargarEquipos">
              <i class="bi bi-arrow-clockwise me-1"></i>
              <span class="d-none d-sm-inline">Recargar</span>
              <span class="d-inline d-sm-none">Reload</span>
            </button>

            <input ref="fileInput" type="file" class="d-none" accept=".xlsx,.xls,.csv" @change="onFilePicked">

            <button class="btn btn-emerald btn-toolbar" @click="pedirArchivo" :disabled="importando">
              <span v-if="importando" class="spinner-border spinner-border-sm me-2"></span>
              <i class="bi bi-file-earmark-spreadsheet me-1"></i>
              <span class="d-none d-sm-inline">{{ importando ? 'Importando…' : 'Importar Excel' }}</span>
              <span class="d-inline d-sm-none">{{ importando ? 'Import…' : 'Excel' }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- IMPORTANDO -->
      <div v-if="importando" class="import-card mb-4">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="import-icon">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>

          <div class="flex-grow-1">
            <div class="fw-bold text-dark">{{ importMsg }}</div>
            <div class="progress progress-pro mt-2">
              <div class="progress-bar" role="progressbar" :style="{ width: importPct + '%' }"></div>
            </div>
            <div class="small text-secondary mt-2">{{ importPct }}%</div>
          </div>
        </div>
      </div>

      <!-- RESUMEN -->
      <section class="stats-strip mb-4">
        <div class="stat-pill">
          <div class="stat-icon stat-icon-blue">
            <i class="bi bi-truck-front"></i>
          </div>
          <div>
            <div class="stat-label">Total equipos</div>
            <div class="stat-value">{{ equipos.length }}</div>
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

        <div class="stat-pill" v-if="busqueda || filtroClasificacion">
          <div class="stat-icon stat-icon-emerald">
            <i class="bi bi-search"></i>
          </div>
          <div class="min-w-0">
            <div class="stat-label">Filtros activos</div>
            <div class="stat-value text-truncate" style="max-width: 240px;">
              {{ filtroClasificacion || busqueda }}
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
              Busca por texto libre o acota por clasificación.
            </div>
          </div>
        </div>

        <div class="filter-shell__body">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6">
              <label class="form-label">Buscar (equipo, marca, código, interno, motor)</label>
              <div class="search-shell">
                <i class="bi bi-search search-icon"></i>
                <input
                  class="search-input"
                  v-model="busqueda"
                  placeholder="Ej: SILO, RANDON, JK-2864, GE-456, QS213-03"
                />
              </div>
            </div>

            <div class="col-12 col-md-4">
              <label class="form-label">Filtrar por Clasificación</label>
              <select class="form-select modern-input" v-model="filtroClasificacion">
                <option value="">— Todas —</option>
                <option v-for="c in clasificacionesOrdenadas" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="col-12 col-md-2">
              <button class="btn btn-soft-secondary w-100 btn-toolbar" @click="limpiarFiltros">
                <i class="bi bi-eraser me-1"></i> Limpiar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TABLA -->
      <section class="list-shell">
        <div class="list-header">
          <div>
            <div class="list-title d-flex align-items-center">
              <i class="bi bi-list-ul me-2 text-secondary"></i>
              Equipos
            </div>
            <div class="list-subtitle">
              Revisa, edita o elimina registros desde el listado principal.
            </div>
          </div>

          <div class="list-counter">
            <span>{{ equipos.length }}</span>
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
                Ajusta la búsqueda o limpia los filtros para volver a ver resultados.
              </div>
            </div>
          </div>

          <div v-else class="table-responsive">
            <table class="table equipos-table align-middle mb-0">
              <thead class="position-sticky top-0 table-head-pro">
                <tr>
                  <th style="width: 48px;"></th>
                  <th style="min-width: 130px;">Código</th>
                  <th style="min-width: 130px;">N° Interno</th>
                  <th class="d-none d-md-table-cell" style="min-width: 150px;">N° Motor</th>
                  <th style="min-width: 220px;">Equipo</th>
                  <th class="d-none d-md-table-cell" style="min-width: 180px;">Marca / Modelo</th>
                  <th class="text-end pe-3" style="width: 190px;">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="e in paginado" :key="e.__id">
                  <td>
                    <div class="row-icon">
                      <i class="bi bi-truck-front"></i>
                    </div>
                  </td>

                  <td class="fw-semibold text-nowrap">
                    <div class="provider-name text-truncate" style="max-width: 120px;">
                      {{ e.codigo || '—' }}
                    </div>

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
                    <span class="chip chip-blue">
                      {{ e.numero_interno || '—' }}
                    </span>
                  </td>

                  <td class="small d-none d-md-table-cell">
                    <span class="chip chip-cyan">
                      {{ e.numero_motor || '—' }}
                    </span>
                  </td>

                  <td class="small">
                    <div class="provider-main min-w-0">
                      <div class="provider-avatar">
                        {{ (e.equipo || 'E').charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <div class="provider-name text-truncate" style="max-width: 240px;">
                          {{ e.equipo || '—' }}
                        </div>
                        <div class="provider-address text-truncate d-lg-none">
                          <span v-if="e.clasificacion1">{{ e.clasificacion1 }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="small d-none d-md-table-cell">
                    <div class="data-inline">
                      <i class="bi bi-wrench-adjustable-circle"></i>
                      <span>{{ e.marca || '—' }}<span v-if="e.modelo"> / {{ e.modelo }}</span></span>
                    </div>
                  </td>

                  <td class="text-end pe-3">
                    <div class="action-group d-none d-md-inline-flex">
                      <button class="btn action-btn action-edit" @click="abrirEditar(e)" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button
                        class="btn action-btn action-delete"
                        :disabled="accionando && idEnAccion===e.__id"
                        @click="abrirConfirm(e)"
                        title="Eliminar"
                      >
                        <span v-if="accionando && idEnAccion===e.__id" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash3"></i>
                      </button>
                    </div>

                    <div class="d-inline-flex d-md-none gap-1">
                      <button class="btn action-btn action-edit btn-sm" @click="abrirEditar(e)" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button
                        class="btn action-btn action-delete btn-sm"
                        :disabled="accionando && idEnAccion===e.__id"
                        @click="abrirConfirm(e)"
                        title="Eliminar"
                      >
                        <span v-if="accionando && idEnAccion===e.__id" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash3"></i>
                      </button>
                    </div>

                    <div class="audit-mini mt-2 d-none d-md-block" v-if="e.creado || e.actualizado">
                      <span v-if="e.creado">Creado: {{ fmtFecha(e.creado) }}</span>
                      <span v-if="e.actualizado"> · Act.: {{ fmtFecha(e.actualizado) }}</span>
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
      </section>

      <!-- OFFCANVAS FORM -->
      <div v-if="offOpen" class="offcanvas-backdrop" @click.self="cerrarOff">
        <div class="offcanvas-panel">
          <div class="offcanvas-header">
            <div>
              <div class="modal-kicker">{{ esEdicion ? 'Editar registro' : 'Nuevo registro' }}</div>
              <div class="fw-bold fs-5 text-truncate">
                {{ esEdicion ? 'Editar equipo' : 'Agregar equipo' }}
              </div>
            </div>
            <button class="btn-close" @click="cerrarOff"></button>
          </div>

          <div class="offcanvas-body">
            <div class="form-block">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label">Código</label>
                  <input class="form-control modern-input" v-model="form.codigo" placeholder="Ej: JK-2864" />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">N° Interno</label>
                  <input class="form-control modern-input" v-model="form.numero_interno" placeholder="Ej: GE-456" />
                </div>

                <div class="col-12">
                  <label class="form-label">N° Motor</label>
                  <input class="form-control modern-input" v-model="form.numero_motor" placeholder="Ej: QS213-03" />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Año</label>
                  <input class="form-control modern-input" type="number" v-model.number="form.ano" min="1900" max="2100" />
                </div>

                <div class="col-12">
                  <label class="form-label">Equipo</label>
                  <input class="form-control modern-input" v-model="form.equipo" placeholder="Descripción del equipo" />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Marca</label>
                  <input class="form-control modern-input" v-model="form.marca" placeholder="RANDON" />
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label">Modelo</label>
                  <input class="form-control modern-input" v-model="form.modelo" placeholder="SRLTV0327" />
                </div>

                <div class="col-12">
                  <label class="form-label">Clasificación</label>
                  <input class="form-control modern-input" v-model="form.clasificacion1" placeholder="SEMI REMOLQUE SILO" />
                </div>

                <div class="col-12">
                  <label class="form-label">Tipo de equipo</label>
                  <input class="form-control modern-input" v-model="form.tipo_equipo" placeholder="SEMI REMOLQUE SILO" />
                </div>

                <div class="col-12">
                  <label class="form-label">N° Chasis</label>
                  <input class="form-control modern-input" v-model="form.numero_chasis" placeholder="9ADH0973BCM343474" />
                </div>

                <div class="col-12">
                  <label class="form-label">Localización</label>
                  <input class="form-control modern-input" v-model="form.localizacion" placeholder="22368 DET\\ CANECHE" />
                </div>

                <div class="col-12" v-if="esEdicion && (form.creado || form.actualizado)">
                  <div class="audit-info">
                    <div v-if="form.creado">Creado: {{ fmtFecha(form.creado) }}</div>
                    <div v-if="form.actualizado">Actualizado: {{ fmtFecha(form.actualizado) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="offcanvas-footer">
            <div class="d-flex flex-wrap gap-2 justify-content-end">
              <button class="btn btn-soft-secondary" @click="cerrarOff">Cancelar</button>
              <button class="btn btn-brand" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear equipo' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- OFFCANVAS FILTROS MOBILE -->
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
                  <label class="form-label">Buscar (equipo, marca, código, interno, motor)</label>
                  <input class="form-control modern-input" v-model="busqueda" placeholder="Ej: SILO, RANDON, JK-2864, GE-456, QS213-03" />
                </div>

                <div class="col-12">
                  <label class="form-label">Filtrar por Clasificación</label>
                  <select class="form-select modern-input" v-model="filtroClasificacion">
                    <option value="">— Todas —</option>
                    <option v-for="c in clasificacionesOrdenadas" :key="c" :value="c">{{ c }}</option>
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

      <!-- TOASTS -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i
            class="me-2"
            :class="t.type==='success'
              ? 'bi bi-check-circle-fill'
              : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"
          ></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>

    </div>

    <!-- MODAL ELIMINAR -->
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
            ¿Seguro que quieres eliminar el equipo
            <strong>{{ confirmRow?.codigo || confirmRow?.equipo || '—' }}</strong>?
          </p>

          <div class="confirm-box">
            <div class="confirm-row">
              <span>Código</span>
              <strong>{{ confirmRow?.codigo || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>N° Interno</span>
              <strong>{{ confirmRow?.numero_interno || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>N° Motor</span>
              <strong>{{ confirmRow?.numero_motor || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Equipo</span>
              <strong>{{ confirmRow?.equipo || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Marca / Modelo</span>
              <strong>{{ confirmRow?.marca || '—' }}<span v-if="confirmRow?.modelo"> / {{ confirmRow?.modelo }}</span></strong>
            </div>
            <div class="confirm-row">
              <span>Clasificación</span>
              <strong>{{ confirmRow?.clasificacion1 || '—' }}</strong>
            </div>
            <div class="confirm-row">
              <span>Localización</span>
              <strong>{{ confirmRow?.localizacion || '—' }}</strong>
            </div>
          </div>
        </div>

        <div class="vmodal-footer d-flex justify-content-end gap-2">
          <button class="btn btn-soft-secondary" @click="cerrarConfirm" :disabled="eliminando">Cancelar</button>
          <button class="btn btn-danger btn-delete-strong" @click="confirmarEliminar" :disabled="eliminando">
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

const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

const fmtFecha = (f:any) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : (f ? new Date(f) : null));
    if (!d) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
  } catch { return '—'; }
};

const CAMPOS_AUDITORIA = [
  { key: 'codigo', label: 'Código' },
  { key: 'numero_interno', label: 'N° Interno' },
  { key: 'numero_motor', label: 'N° Motor' },
  { key: 'ano', label: 'Año' },
  { key: 'equipo', label: 'Equipo' },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'clasificacion1', label: 'Clasificación' },
  { key: 'tipo_equipo', label: 'Tipo de equipo' },
  { key: 'numero_chasis', label: 'N° Chasis' },
  { key: 'localizacion', label: 'Localización' },
] as const;

const textoNormalizado = (v: any) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

const esCampoVacio = (valor: any, key?: string) => {
  if (valor === null || valor === undefined) return true;

  if (key === 'ano') {
    if (valor === '' || Number.isNaN(Number(valor))) return true;
    const n = Number(valor);
    return !Number.isFinite(n) || n <= 0;
  }

  const t = textoNormalizado(valor);

  if (!t) return true;

  const placeholders = new Set([
    'no hay informacion',
    'no hay información',
    'sin informacion',
    'sin información',
    'n/a',
    'na',
    '-',
    '--',
    's/i',
  ]);

  return placeholders.has(t);
};

const valorParaExcel = (v: any) => {
  if (v === null || v === undefined) return '';
  return String(v);
};

const exportarExcelFaltantes = () => {
  try {
    const base = equipos.value;

    if (!base.length) {
      addToast('warning', 'No hay equipos para exportar.');
      return;
    }

    const resumenCampo = new Map<string, number>();
    const matrizRows: any[] = [];
    const detalleRows: any[] = [];

    for (const e of base) {
      const faltantes: string[] = [];
      const estadoCampos: Record<string, string> = {};

      for (const campo of CAMPOS_AUDITORIA) {
        const valor = (e as any)[campo.key];
        const falta = esCampoVacio(valor, campo.key);
        estadoCampos[`Estado - ${campo.label}`] = falta ? 'FALTA' : 'OK';

        if (falta) {
          faltantes.push(campo.label);
          resumenCampo.set(campo.label, (resumenCampo.get(campo.label) || 0) + 1);

          detalleRows.push({
            'Tipo de equipo': esCampoVacio(e.tipo_equipo) ? 'Sin tipo' : valorParaExcel(e.tipo_equipo),
            'Clasificación': esCampoVacio(e.clasificacion1) ? 'Sin clasificación' : valorParaExcel(e.clasificacion1),
            'Equipo': valorParaExcel(e.equipo),
            'Código': valorParaExcel(e.codigo),
            'Campo faltante': campo.label,
            'N° Interno': valorParaExcel(e.numero_interno),
            'N° Motor': valorParaExcel(e.numero_motor),
            'N° Chasis': valorParaExcel(e.numero_chasis),
            'Marca': valorParaExcel(e.marca),
            'Modelo': valorParaExcel(e.modelo),
            'Año': valorParaExcel(e.ano),
            'Localización': valorParaExcel(e.localizacion),
          });
        }
      }

      if (faltantes.length > 0) {
        const tipo = esCampoVacio(e.tipo_equipo) ? 'Sin tipo' : valorParaExcel(e.tipo_equipo);
        const clasif = esCampoVacio(e.clasificacion1) ? 'Sin clasificación' : valorParaExcel(e.clasificacion1);

        matrizRows.push({
          'Grupo': `${tipo} | ${clasif}`,
          'Tipo de equipo': tipo,
          'Clasificación': clasif,
          'Equipo': valorParaExcel(e.equipo),
          'Código': valorParaExcel(e.codigo),
          'N° Interno': valorParaExcel(e.numero_interno),
          'N° Motor': valorParaExcel(e.numero_motor),
          'N° Chasis': valorParaExcel(e.numero_chasis),
          'Marca': valorParaExcel(e.marca),
          'Modelo': valorParaExcel(e.modelo),
          'Año': valorParaExcel(e.ano),
          'Localización': valorParaExcel(e.localizacion),
          'Cantidad faltantes': faltantes.length,
          'Campos faltantes': faltantes.join(' | '),
          ...estadoCampos,
        });
      }
    }

    if (!matrizRows.length) {
      addToast('success', 'No hay faltantes. Todos los equipos están completos ✅');
      return;
    }

    matrizRows.sort((a, b) =>
      a['Tipo de equipo'].localeCompare(b['Tipo de equipo']) ||
      a['Clasificación'].localeCompare(b['Clasificación']) ||
      b['Cantidad faltantes'] - a['Cantidad faltantes'] ||
      a['Equipo'].localeCompare(b['Equipo']) ||
      a['Código'].localeCompare(b['Código'])
    );

    detalleRows.sort((a, b) =>
      a['Tipo de equipo'].localeCompare(b['Tipo de equipo']) ||
      a['Clasificación'].localeCompare(b['Clasificación']) ||
      a['Campo faltante'].localeCompare(b['Campo faltante']) ||
      a['Equipo'].localeCompare(b['Equipo'])
    );

    const resumenRows = Array.from(resumenCampo.entries())
      .map(([campo, cantidad]) => ({ 'Campo faltante': campo, 'Cantidad': cantidad }))
      .sort((a, b) => b['Cantidad'] - a['Cantidad'] || a['Campo faltante'].localeCompare(b['Campo faltante']));

    const wb = XLSX.utils.book_new();

    const wsMatriz = XLSX.utils.json_to_sheet(matrizRows);
    if (wsMatriz['!ref']) {
      const range = XLSX.utils.decode_range(wsMatriz['!ref']);
      wsMatriz['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
    wsMatriz['!cols'] = [
      { wch: 40 }, { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 24 },
      { wch: 16 }, { wch: 60 }, { wch: 14 }, { wch: 16 }, { wch: 15 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMatriz, 'Auditoria faltantes');

    const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
    if (wsResumen['!ref']) {
      const range = XLSX.utils.decode_range(wsResumen['!ref']);
      wsResumen['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    const wsDetalle = XLSX.utils.json_to_sheet(detalleRows);
    if (wsDetalle['!ref']) {
      const range = XLSX.utils.decode_range(wsDetalle['!ref']);
      wsDetalle['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
    wsDetalle['!cols'] = [
      { wch: 22 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 22 },
      { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 20 }, { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle por faltante');

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fileName = `auditoria_equipos_faltantes_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`;

    XLSX.writeFile(wb, fileName);
    addToast('success', `Excel generado con ${matrizRows.length} equipos con faltantes.`);
  } catch (err) {
    console.error(err);
    addToast('danger', 'No se pudo generar el Excel de auditoría.');
  }
};

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

const toggleFiltros = (v:boolean) => { filtrosOpen.value = !!v; };

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

const normTxt = (s:any) => String(s ?? '')
  .toString()
  .normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .trim();
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
  const numero_interno  = toStr(get('NUMERO INTERNO', [
    'numero interno','Numero interno','N° Interno','N Interno','Interno','NUMERO_INTERNO','NUMERO  INTERNO'
  ]));
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
:root {
  color-scheme: light;
}

.page-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

.glow-1 {
  width: 280px;
  height: 280px;
  top: -60px;
  right: -40px;
  background: rgba(37, 99, 235, 0.12);
}

.glow-2 {
  width: 240px;
  height: 240px;
  left: -80px;
  bottom: 80px;
  background: rgba(16, 185, 129, 0.10);
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

.btn-emerald {
  color: #fff;
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.25);
}

.btn-emerald:hover,
.btn-emerald:focus {
  color: #fff;
  background: linear-gradient(135deg, #059669, #047857);
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

.btn-soft-emerald {
  color: #047857;
  background: rgba(16, 185, 129, 0.10);
  border: 1px solid rgba(16, 185, 129, 0.18);
  font-weight: 700;
}

.btn-soft-emerald:hover,
.btn-soft-emerald:focus {
  color: #065f46;
  background: rgba(16, 185, 129, 0.16);
}

.import-card {
  position: relative;
  z-index: 1;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.76);
  border-radius: 24px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
  padding: 1rem 1.1rem;
}

.import-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.progress-pro {
  height: 9px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.16);
}

.progress-bar {
  background: linear-gradient(90deg, #10b981, #059669);
}

.equipos-table {
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

.equipos-table tbody td {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: #1e293b;
  vertical-align: middle;
}

.equipos-table tbody tr {
  transition: background 0.2s ease, transform 0.2s ease;
}

.equipos-table tbody tr:hover {
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

.chip-cyan {
  color: #0f766e;
  background: rgba(6, 182, 212, 0.10);
  border-color: rgba(6, 182, 212, 0.14);
}

.chip-slate {
  color: #334155;
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.18);
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

.audit-mini {
  font-size: 0.76rem;
  color: #64748b;
  line-height: 1.35;
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

.audit-info {
  background: rgba(255,255,255,0.68);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  color: #64748b;
  font-size: 0.9rem;
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

.min-w-0 {
  min-width: 0;
}

.btn-close {
  box-shadow: none !important;
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
  .hero-card {
    padding: 1rem;
  }

  .table-head-pro th:first-child,
  .equipos-table tbody td:first-child {
    width: 48px !important;
  }
}
</style>
