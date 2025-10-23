<!-- EquiposAdmin.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="equipos-admin-page">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Administrar equipos</h1>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="abrirCrear">
            <i class="bi bi-plus-lg me-1"></i> Agregar equipo
          </button>
          <button class="btn btn-outline-secondary" @click="cargarEquipos">
            <i class="bi bi-arrow-clockwise me-1"></i> Recargar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-6">
              <label class="form-label">Buscar (equipo, marca o código)</label>
              <input
                class="form-control"
                v-model="busqueda"
                placeholder="Ej: SILO, RANDON, JK-2864" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Filtrar por Clasificación</label>
              <select class="form-select" v-model="filtroClasificacion">
                <option value="">— Todas —</option>
                <option v-for="c in clasificacionesOrdenadas" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <button class="btn btn-dark w-100" @click="limpiarFiltros">
                Limpiar
              </button>
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
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width:36px;"></th>
                    <th style="min-width:140px;">Código</th>
                    <th>Equipo</th>
                    <th>Marca / Modelo</th>
                    <th>Clasificación</th>
                    <th>Tipo</th>
                    <th class="text-center">Año</th>
                    <th>Localización</th>
                    <th style="width: 180px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in paginado" :key="e.__id">
                    <td><i class="bi bi-truck-front text-secondary"></i></td>
                    <td class="fw-semibold">{{ e.codigo || '—' }}</td>
                    <td class="small">{{ e.equipo || '—' }}</td>
                    <td class="small">{{ e.marca || '—' }} <span v-if="e.modelo">/ {{ e.modelo }}</span></td>
                    <td>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">{{ e.clasificacion1 || '—' }}</span>
                    </td>
                    <td class="small">{{ e.tipo_equipo || '—' }}</td>
                    <td class="text-center">{{ e.ano ?? '—' }}</td>
                    <td class="small">{{ e.localizacion || '—' }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" @click="abrirEditar(e)">Editar</button>
                        <!-- ahora abre modal -->
                        <button class="btn btn-outline-danger"
                                :disabled="accionando && idEnAccion===e.__id"
                                @click="abrirConfirm(e)">
                          <span v-if="accionando && idEnAccion===e.__id"
                                class="spinner-border spinner-border-sm me-2"></span>
                          Eliminar
                        </button>
                      </div>
                      <div class="small text-secondary mt-1" v-if="e.creado || e.actualizado">
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
              <nav>
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{disabled: paginaActual===1}">
                    <button class="page-link" @click="goToPage(paginaActual-1)">«</button>
                  </li>
                  <li v-for="n in visiblePages" :key="'pg-'+n" class="page-item" :class="{active: paginaActual===n}">
                    <button class="page-link" @click="goToPage(n)">{{ n }}</button>
                  </li>
                  <li class="page-item" :class="{disabled: paginaActual===totalPaginas}">
                    <button class="page-link" @click="goToPage(paginaActual+1)">»</button>
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
                <input class="form-control" v-model="form.localizacion" placeholder="22368 DET\ CANECHE" />
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
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-outline-secondary" @click="cerrarOff">Cancelar</button>
              <button class="btn btn-primary" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear equipo' }}
              </button>
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
            <li><span class="text-secondary">Equipo:</span> <strong>{{ confirmRow?.equipo || '—' }}</strong></li>
            <li><span class="text-secondary">Marca/Modelo:</span> <strong>{{ confirmRow?.marca || '—' }} <span v-if="confirmRow?.modelo">/ {{ confirmRow?.modelo }}</span></strong></li>
            <li><span class="text-secondary">Clasificación:</span> <strong>{{ confirmRow?.clasificacion1 || '—' }}</strong></li>
            <li><span class="text-secondary">Localización:</span> <strong>{{ confirmRow?.localizacion || '—' }}</strong></li>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { db } from '../stores/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';

type Equipo = {
  __id: string;
  actualizado?: any;
  ano?: number;
  clasificacion1?: string;
  codigo?: string;
  creado?: any;
  equipo?: string;
  localizacion?: string;
  marca?: string;
  modelo?: string;
  numero_chasis?: string;
  tipo_equipo?: string;
};

const cargando = ref(true);
const equipos = ref<Equipo[]>([]);

const busqueda = ref('');
const filtroClasificacion = ref('');
const paginaActual = ref(1);
const pageSize = 10;

const offOpen = ref(false);
const esEdicion = ref(false);
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
        ano: typeof data.ano === 'number' ? data.ano : Number(data.ano) || undefined,
        clasificacion1: data.clasificacion1 || '',
        codigo: data.codigo || '',
        creado: data.creado || null,
        equipo: data.equipo || '',
        localizacion: data.localizacion || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        numero_chasis: data.numero_chasis || '',
        tipo_equipo: data.tipo_equipo || ''
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
    const valores = [ e.equipo || '', e.marca || '', e.codigo || '' ].map(v => v.toLowerCase());
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
  const maxButtons = 7;
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
    equipo: '',
    marca: '',
    modelo: '',
    ano: undefined,
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
      equipo: (form.value.equipo || '').trim(),
      marca: (form.value.marca || '').trim(),
      modelo: (form.value.modelo || '').trim(),
      ano: typeof form.value.ano === 'number' ? form.value.ano : (form.value.ano ? Number(form.value.ano) : null),
      numero_chasis: (form.value.numero_chasis || '').trim(),
      tipo_equipo: (form.value.tipo_equipo || '').trim(),
      clasificacion1: (form.value.clasificacion1 || '').trim(),
      localizacion: (form.value.localizacion || '').trim()
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

/* ======= Modal de confirmación de borrado ======= */
const confirmOpen = ref(false);
const confirmRow  = ref<Equipo | null>(null);
const eliminando  = ref(false);

function abrirConfirm(e:Equipo){
  confirmRow.value = e;
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

/* ======= (Legacy) eliminar directo con confirm() por si lo llamas desde otro lado ======= */
const eliminar = async (e:Equipo) => {
  if (!confirm(`Eliminar el equipo ${e.codigo || e.equipo}? Esta acción es permanente.`)) return;
  accionando.value = true;
  idEnAccion.value = e.__id;
  try {
    await deleteDoc(doc(db, 'equipos', e.__id));
    equipos.value = equipos.value.filter(x => x.__id !== e.__id);
    addToast('success','Equipo eliminado.');
  } catch (err) {
    console.error(err);
    addToast('danger','No se pudo eliminar el equipo.');
  } finally {
    accionando.value = false;
    idEnAccion.value = null;
  }
};
</script>

<style scoped>
.equipos-admin-page{
  min-height:100vh;
  background:
    radial-gradient(900px 400px at -10% -20%, rgba(0,0,0,.03), transparent 60%),
    radial-gradient(900px 400px at 110% 0%, rgba(0,0,0,.03), transparent 60%),
    #f8fafc;
}

/* Offcanvas lateral derecho */
.offcanvas-backdrop{
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.45);
}
.offcanvas-panel{
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: 560px; max-width: 95vw;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  display: flex; flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,.25);
  border-top-left-radius:.75rem; border-bottom-left-radius:.75rem;
  animation: slideIn .18s ease-out both;
}
@keyframes slideIn { from{ transform: translateX(20px); opacity: 0; } to{ transform:none; opacity:1; } }
.offcanvas-header, .offcanvas-footer{
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.offcanvas-footer{ border-top: 1px solid #eee; border-bottom: 0; }
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
  padding: .9rem 1rem; border-bottom: 1px solid #eee;
}
.vmodal-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.vmodal-body{ padding: 1rem; max-height: 65vh; overflow: auto; }

/* Toasts */
.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* Icono del modal de eliminación */
.confirm-icon{
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg,#ef4444,#dc2626);
  color: #fff; font-size: 18px;
  box-shadow: 0 6px 18px rgba(220,38,38,.35);
}
</style>
