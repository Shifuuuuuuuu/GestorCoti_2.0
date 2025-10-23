<!-- AprobaciónOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-oc-page">
    <div class="container py-4 py-md-5">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0">Aprobación de OC</h1>

        <div class="d-flex align-items-center gap-2 ms-auto">
          <!-- Filtro por empresa -->
          <div class="input-group input-group-sm" style="width:260px;">
            <span class="input-group-text"><i class="bi bi-buildings"></i></span>
            <select v-model="empresaFiltro" class="form-select">
              <option value="TODAS">Todas las empresas</option>
              <option value="SERVICIOS">Xtreme Servicios</option>
              <option value="MINING">Xtreme Mining</option>
              <option value="HORMIGONES">Xtreme Hormigones</option>
            </select>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>
      </div>

      <!-- Rol / filtro activo -->
      <div v-if="!rolActual" class="alert alert-warning">
        Tu usuario no tiene rol de aprobación o aún no se determina.
      </div>

      <!-- Lista -->
      <div class="card" v-if="rolActual">
        <div class="card-header d-flex align-items-center justify-content-between">
          <div>
            <div class="fw-semibold">Órdenes encontradas</div>
            <div class="small text-secondary">
              Estado: <strong>{{ estatusFiltrado }}</strong> ·
              Empresa: <strong>{{ etiquetaEmpresaFiltro }}</strong>
            </div>
          </div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ ocsFiltradas.length }}</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargando" class="p-4 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="ocsFiltradas.length === 0" class="p-4 text-secondary text-center">
            No hay OCs con estatus “{{ estatusFiltrado }}” para {{ etiquetaEmpresaFiltro.toLowerCase() }}.
          </div>

          <div v-else class="list-group list-group-flush">
            <div v-for="oc in ocsFiltradas" :key="oc.__docId" class="list-group-item">
              <div class="d-flex align-items-start gap-3">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-semibold">OC N° {{ oc.id ?? '—' }}</span>
                    <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus }}</span>
                  </div>

                  <!-- === RESUMEN DESTACADO (chips) === -->
                  <div class="oc-highlight mt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="oc-pill" title="Centro de costo">
                        <i class="bi bi-building me-1"></i>
                        <strong>Centro:</strong>
                        {{ oc.centroCostoNombre || '—' }}
                        <template> ({{ oc.centroCosto || '—' }})</template>
                      </span>

                      <span class="oc-pill" title="Empresa">
                        <i class="bi bi-diagram-3 me-1"></i>
                        <strong>Empresa:</strong> {{ oc.empresa || '—' }}
                      </span>

                      <span class="oc-pill" title="Moneda">
                        <i class="bi bi-cash-coin me-1"></i>
                        <strong>Moneda:</strong> {{ oc.moneda || 'CLP' }}
                      </span>

                      <span class="oc-pill oc-pill-total" title="Total con IVA">
                        <i class="bi bi-coin me-1"></i>
                        <strong>Total:</strong> {{ (oc.precioTotalConIVA ?? 0).toLocaleString('es-CL') }}
                      </span>
                    </div>
                  </div>

                  <!-- Compacto -->
                  <div class="text-body-secondary small mt-1">
                    <strong>Responsable:</strong> {{ oc.responsable || '—' }} ·
                    <strong>Subida:</strong> {{ fmtFecha(oc.fechaSubida) }}
                  </div>

                  <div v-if="oc.comentario" class="small mt-1">
                    <em>“{{ oc.comentario }}”</em>
                  </div>
                </div>

                <div class="d-flex flex-column gap-2">
                  <button class="btn btn-sm btn-primary" @click="oc.expandido = !oc.expandido">
                    {{ oc.expandido ? 'Ocultar' : 'Ver' }} detalle
                  </button>

                  <button
                    v-if="oc.solpedId"
                    class="btn btn-sm btn-secondary"
                    @click="irASolped(oc)">
                    Ver SOLPED
                  </button>
                </div>
              </div>

              <!-- Detalle -->
              <transition name="fade">
                <div v-if="oc.expandido" class="mt-3">
                  <!-- Archivos (solo archivosStorage) -->
                  <div v-if="(oc.archivosStorage||[]).length" class="mb-3">
                    <div class="fw-semibold mb-2">📂 Archivos Adjuntos</div>

                    <div v-for="(a,i) in oc.archivosStorage" :key="a.url" class="card mb-2">
                      <div class="card-header d-flex align-items-center ">
                        <div class="fw-semibold me-auto">{{ a.nombre || ('archivo_'+(i+1)) }}</div>
                        <button class="btn btn-sm btn-outline-secondary" @click="a.ver = !a.ver">
                          {{ a.ver ? 'Ocultar' : 'Mostrar' }}
                        </button>
                      </div>
                      <div v-if="a.ver" class="card-body">
                        <div v-if="(a.tipo||'').includes('pdf')" class="ratio ratio-16x9">
                          <iframe :src="a.url" style="border:none;"></iframe>
                        </div>
                        <div v-else class="text-center">
                          <img :src="a.url" class="img-fluid rounded shadow-sm" style="max-height:600px;object-fit:contain;">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Ítems -->
                  <div class="fw-semibold mb-2">📦 Ítems</div>
                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th style="width:64px;">Ítem</th>
                          <th>Descripción</th>
                          <th class="text-center">Cant.</th>
                          <th class="text-center">Cotizada</th>
                          <th class="text-center">Estado</th>
                          <th>N° Interno</th>
                          <th>Código ref.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in oc.items || []" :key="it.__tempId || `${it.item}-${it.descripcion}`">
                          <td>{{ it.item }}</td>
                          <td>{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada ?? 0 }}</td>
                          <td class="text-center">
                            <span class="badge" :class="badgeItem(it.estado)">{{ it.estado || 'pendiente' }}</span>
                          </td>
                          <td>{{ it.numero_interno || '—' }}</td>
                          <td>{{ it.codigo_referencial || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Comentario acción -->
                  <div class="mb-2">
                    <label class="form-label">Comentario (obligatorio)</label>
                    <textarea class="form-control" rows="2" v-model="oc._comentarioAccion" placeholder="Explica tu decisión…"></textarea>
                  </div>

                  <!-- Botones acción -->
                  <div class="d-flex gap-2">
                    <button class="btn btn-success" :disabled="accionando" @click="aprobar(oc)">
                      <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                      Aprobar
                    </button>
                    <button class="btn btn-warning" :disabled="accionando" @click="solicitarAclaracion(oc)">
                      Solicitar aclaración
                    </button>
                    <button class="btn btn-danger" :disabled="accionando" @click="rechazar(oc)">
                      Rechazar
                    </button>
                  </div>

                  <!-- Historial -->
                  <div class="mt-3">
                    <div class="fw-semibold mb-2">🕓 Historial</div>
                    <ul class="list-unstyled small mb-0">
                      <li v-for="(h,idx) in oc.historial || []" :key="idx">
                        <strong>{{ h.usuario || '—' }}</strong> ·
                        <em>{{ h.estatus || '—' }}</em> ·
                        <span>{{ fmtFecha(h.fecha) }}</span>
                        <span v-if="h.comentario"> — “{{ h.comentario }}”</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

type Rol = 'GUILLERMO' | 'JUAN' | 'ALEJANDRO' | null;
const LIM_GUILLERMO = 250_000;
const LIM_JUAN = 5_000_000;

const router = useRouter();
const volver = () => router.back();
const auth = useAuthStore();

const cargando = ref(true);
const ocs = ref<any[]>([]);
const usuarioNombre = ref<string>('');
const rolActual = ref<Rol>(null);
let _unsub: any = null;

/* ====== UI: toasts ====== */
const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

/* ====== Empresa (normalización + filtro) ====== */
const normalizeCompany = (raw:string) => {
  const s = String(raw||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase();
  if (!s) return '';
  if (s.includes('SERV')) return 'SERVICIOS';
  if (s.includes('MIN') || s.includes('MINGI')) return 'MINING';
  if (s.includes('HORMIG')) return 'HORMIGONES';
  return s;
};
const empresaFiltro = ref<'TODAS'|'SERVICIOS'|'MINING'|'HORMIGONES'>('TODAS');
const etiquetaEmpresaFiltro = computed(() => {
  switch (empresaFiltro.value) {
    case 'SERVICIOS': return 'Xtreme Servicios';
    case 'MINING': return 'Xtreme Mining';
    case 'HORMIGONES': return 'Xtreme Hormigones';
    default: return 'Todas las empresas';
  }
});

/* ====== Rol y etapa ====== */
const mapNombreARol = (fullName: string): Rol => {
  const n = (fullName || '').trim().toLowerCase();
  if (n === 'guillermo manzor') return 'GUILLERMO';
  if (n === 'juan cubillos') return 'JUAN';
  if (n === 'alejandro candia') return 'ALEJANDRO';
  return null;
};
const estatusFiltrado = computed(() => {
  if (rolActual.value === 'GUILLERMO') return 'Revisión Guillermo';
  if (rolActual.value === 'JUAN') return 'Preaprobado';
  if (rolActual.value === 'ALEJANDRO') return 'Casi Aprobado';
  return '';
});

/* ====== Badges ====== */
const estadoBadgeClass = (estatus: string) => {
  const s = (estatus||'').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('preaprob')) return 'bg-info-subtle text-info-emphasis';
  if (s.includes('casi')) return 'bg-primary-subtle text-primary-emphasis';
  if (s.includes('rechaz')) return 'bg-danger-subtle text-danger-emphasis';
  if (s.includes('revisión') || s.includes('revision')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('proveedor')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};
const badgeItem = (estado?: string) => {
  const s = (estado || 'pendiente').toLowerCase();
  if (s.includes('aprob')) return 'bg-success-subtle text-success-emphasis';
  if (s.includes('revis')) return 'bg-warning-subtle text-warning-emphasis';
  if (s.includes('pend')) return 'bg-secondary-subtle text-secondary-emphasis';
  if (s.includes('complet')) return 'bg-primary-subtle text-primary-emphasis';
  return 'bg-secondary-subtle text-secondary-emphasis';
};
const fmtFecha = (f:any) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : new Date(f));
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' });
  } catch { return '—'; }
};

/* ====== Datos derivados ====== */
const ocsFiltradas = computed(() => {
  if (empresaFiltro.value === 'TODAS') return ocs.value;
  return ocs.value.filter(oc => normalizeCompany(oc.empresa) === empresaFiltro.value);
});

/* ====== Carga inicial + suscripción ====== */
const subscribe = () => {
  if (_unsub) { _unsub(); _unsub = null; }
  cargando.value = true;
  const estatus = estatusFiltrado.value;
  if (!estatus) { cargando.value = false; return; }

  const qy = query(
    collection(db, 'ordenes_oc'),
    where('estatus', '==', estatus),
    orderBy('fechaSubida', 'desc')
  );
  _unsub = onSnapshot(qy, (snap) => {
    const arr:any[] = [];
    snap.forEach(d => {
      const data:any = d.data();
      const archivos = Array.isArray(data.archivosStorage)
        ? data.archivosStorage.map((a:any)=>({ ...a, ver:false }))
        : [];
      arr.push({
        __docId: d.id,
        ...data,
        archivosStorage: archivos,
        expandido: false,
        _comentarioAccion: ''
      });
    });
    arr.sort((a,b)=> (b.fechaSubida?.toMillis?.() ?? new Date(b.fechaSubida||0).getTime())
                  - (a.fechaSubida?.toMillis?.() ?? new Date(a.fechaSubida||0).getTime()));
    ocs.value = arr;
    cargando.value = false;
  }, (err)=> {
    console.error(err);
    addToast('danger','Error al cargar OCs.');
    cargando.value = false;
  });
};

onMounted(async () => {
  try {
    const uid = auth?.user?.uid;
    let fullName = auth?.user?.displayName || auth?.user?.email || '';
    if (uid) {
      try {
        const us = await getDoc(doc(db, 'Usuarios', uid));
        if (us.exists()) {
          const d = us.data() || {};
          fullName = d.fullName || fullName;
        }
      } catch {}
    }
    usuarioNombre.value = fullName || '';

    rolActual.value = mapNombreARol(usuarioNombre.value);

    if (!rolActual.value) {
      cargando.value = false;
      return;
    }
    subscribe();
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo inicializar la vista.');
    cargando.value = false;
  }
});

onBeforeUnmount(()=>{ if (_unsub) _unsub(); });
watch(rolActual, () => { subscribe(); });

/* ====== Acciones ====== */
const accionando = ref(false);

/** Ir al detalle de la SOLPED */
const irASolped = (oc:any) => {
  const id = oc?.solpedId;
  if (!id) {
    addToast('warning','Esta OC no tiene SOLPED asociada.');
    return;
  }
  try {
    router.push({ name: 'SolpedDetalle', params: { id } });
  } catch {
    router.push(`/solped/${id}`);
  }
};

/** Registrar SIEMPRE la acción de OC en el historial de la SOLPED */
const registrarHistorialSolpedAccionOC = async ({
  solpedId,
  ocNumero,
  usuario,
  estatusOC,
  comentario
}: {
  solpedId: string,
  ocNumero?: number | string | null,
  usuario: string,
  estatusOC: string,
  comentario: string
}) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, 'solpes', String(solpedId));
    await addDoc(collection(sref, 'historialEstados'), {
      origen: 'Acción OC',
      usuario: usuario || '—',
      estatus: estatusOC,
      detalle: comentario || '',
      comentario: comentario || '',
      ocNumero: ocNumero ?? null,
      fecha: serverTimestamp()
    });
  } catch (e) {
    console.warn('No se pudo registrar acción de OC en historialEstados de la SOLPED:', e);
  }
};

/** Actualiza ítems de la SOLPED cuando la OC queda Aprobada */
const actualizarSolpedConOC = async (
  oc:any,
  aprobador:string,
  comentario:string,
  estatusOC?: string
) => {
  const solpedId = oc?.solpedId;
  if (!solpedId) return;

  const sref = doc(db, 'solpes', String(solpedId));
  const ss = await getDoc(sref);
  if (!ss.exists()) return;

  const sdata:any = ss.data() || {};
  const itemsSol:any[] = Array.isArray(sdata.items) ? [...sdata.items] : [];

  let huboAvance = false;

  if (itemsSol.length) {
    const idxNI = new Map<string, number>();
    const idxCR = new Map<string, number>();
    const idxDesc = new Map<string, number>();
    const norm = (x:any) => String(x||'').trim().toLowerCase();

    itemsSol.forEach((it, i) => {
      const ni = norm(it.numero_interno);
      const cr = norm(it.codigo_referencial);
      const ds = norm(it.descripcion);
      if (ni) idxNI.set(ni, i);
      if (cr) idxCR.set(cr, i);
      if (ds) idxDesc.set(ds, i);
    });

    const ocItems:any[] = Array.isArray(oc.items) ? oc.items : [];
    ocItems.forEach(ocIt => {
      const delta = Number(ocIt.cantidad_cotizada ?? 0);
      if (!isFinite(delta) || isNaN(delta) || delta <= 0) return;

      const kNI = norm(ocIt.numero_interno);
      const kCR = norm(ocIt.codigo_referencial);
      const kDS = norm(ocIt.descripcion);

      let idx = -1;
      if (kNI && idxNI.has(kNI)) idx = idxNI.get(kNI)!;
      else if (kCR && idxCR.has(kCR)) idx = idxCR.get(kCR)!;
      else if (kDS && idxDesc.has(kDS)) idx = idxDesc.get(kDS)!;

      if (idx >= 0) {
        const sIt = { ...itemsSol[idx] };
        const cantSolic = Number(sIt.cantidad || 0);
        const ya = Number(sIt.cantidad_cotizada || 0);

        let nuevo = ya + delta;
        if (!isFinite(nuevo)) nuevo = ya;
        if (nuevo > cantSolic) nuevo = cantSolic;

        if (nuevo !== ya) {
          huboAvance = true;
          sIt.cantidad_cotizada = nuevo;

          if (cantSolic > 0 && nuevo >= cantSolic) sIt.estado = 'completo';
          else if (nuevo > 0)                     sIt.estado = 'parcial';
          else                                     sIt.estado = sIt.estado || 'pendiente';

          itemsSol[idx] = sIt;
        }
      }
    });
  }

  if (huboAvance) {
    const tot = itemsSol.length;
    const completos = itemsSol.filter(x => String(x.estado||'').toLowerCase().includes('complet')).length;
    const nuevoEstatusSol = (completos === tot && tot > 0) ? 'Completado' : 'Parcial';

    await updateDoc(sref, {
      items: itemsSol,
      estatus: nuevoEstatusSol,
      updated_at: new Date()
    });

    try {
      await addDoc(collection(sref, 'historialEstados'), {
        origen: 'Aprobación OC',
        usuario: aprobador || '—',
        estatus: nuevoEstatusSol,
        detalle: comentario || '',
        comentario: comentario || '',
        ocNumero: oc?.id ?? null,
        fecha: serverTimestamp()
      });
    } catch (e) {
      console.warn('No se pudo registrar historialEstados (operativo) de la SOLPED:', e);
    }
  }

  if (estatusOC) {
    await registrarHistorialSolpedAccionOC({
      solpedId,
      ocNumero: oc?.id,
      usuario: aprobador || '—',
      estatusOC,
      comentario: comentario || ''
    });
  }
};

const solicitarAclaracion = async (oc:any) => {
  if (accionando.value) return;

  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) {
    addToast('warning', 'Escribe un comentario antes de solicitar aclaración.');
    return;
  }

  if (rolActual.value === 'GUILLERMO' && oc.estatus !== 'Revisión Guillermo') {
    addToast('warning','No puedes solicitar aclaración en este estado.');
    return;
  }
  if (rolActual.value === 'JUAN' && oc.estatus !== 'Preaprobado') {
    addToast('warning','No puedes solicitar aclaración en este estado.');
    return;
  }
  if (rolActual.value === 'ALEJANDRO' && oc.estatus !== 'Casi Aprobado') {
    addToast('warning','No puedes solicitar aclaración en este estado.');
    return;
  }

  accionando.value = true;
  try {
    const nuevoHistorial = [
      ...((oc.historial || [])),
      {
        usuario: usuarioNombre.value || '—',
        estatus: 'Pendiente de Aprobación',
        fecha: new Date().toISOString(),
        comentario
      }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Pendiente de Aprobación',
      historial: nuevoHistorial
    });

    await registrarHistorialSolpedAccionOC({
      solpedId: oc.solpedId,
      ocNumero: oc.id,
      usuario: usuarioNombre.value || '—',
      estatusOC: 'Pendiente de Aprobación',
      comentario
    });

    addToast('warning', 'Solicitada aclaración: estado → Pendiente de Aprobación');
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo solicitar la aclaración.');
  } finally {
    accionando.value = false;
  }
};

/** Cerrar SOLPED si todos los items están completos */
const cerrarSolpedSiCompleta = async (solpedId?: string) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, 'solpes', solpedId);
    const ss = await getDoc(sref);
    if (!ss.exists()) return;

    const data:any = ss.data() || {};
    const items:any[] = Array.isArray(data.items) ? data.items : [];
    if (!items.length) return;

    const todosCompletos = items.every(it => Number(it.cantidad_cotizada || 0) >= Number(it.cantidad || 0));
    if (todosCompletos && (data.estatus || '').toLowerCase() !== 'completado') {
      await updateDoc(sref, { estatus: 'Completado' });
      addToast('success', 'SOLPED completada ✔');
    }
  } catch (e) {
    console.error('cerrarSolpedSiCompleta:', e);
  }
};

/** Aprobar OC */
const aprobar = async (oc:any) => {
  if (accionando.value) return;
  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de aprobar.'); return; }

  if (rolActual.value === 'GUILLERMO' && oc.estatus !== 'Revisión Guillermo') { addToast('warning','No puedes aprobar este estado.'); return; }
  if (rolActual.value === 'JUAN' && oc.estatus !== 'Preaprobado') { addToast('warning','No puedes aprobar este estado.'); return; }
  if (rolActual.value === 'ALEJANDRO' && oc.estatus !== 'Casi Aprobado') { addToast('warning','No puedes aprobar este estado.'); return; }

  accionando.value = true;
  try {
    const monto = Number(oc.precioTotalConIVA || 0);

    let nuevoEstatus = oc.estatus;
    if (rolActual.value === 'GUILLERMO') {
      nuevoEstatus = (monto <= LIM_GUILLERMO) ? 'Aprobado' : 'Preaprobado';
    } else if (rolActual.value === 'JUAN') {
      nuevoEstatus = (monto <= LIM_JUAN) ? 'Aprobado' : 'Casi Aprobado';
    } else if (rolActual.value === 'ALEJANDRO') {
      nuevoEstatus = 'Aprobado';
    }

    const nuevosItems = (oc.items || []).map((it:any) => {
      if ((it.estado || '').toLowerCase().includes('revi')) {
        return { ...it, estado: 'aprobado' };
      }
      return it;
    });

    const nuevoHistorial = [
      ...((oc.historial || [])),
      {
        usuario: usuarioNombre.value || '—',
        estatus: nuevoEstatus,
        fecha: new Date().toISOString(),
        comentario
      }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      items: nuevosItems,
      aprobadoPor: usuarioNombre.value || ''
    });

    if (nuevoEstatus === 'Aprobado') {
      await actualizarSolpedConOC(
        { ...oc, items: nuevosItems },
        usuarioNombre.value || '—',
        comentario,
        nuevoEstatus
      );
      await cerrarSolpedSiCompleta(oc.solpedId);
    } else {
      await registrarHistorialSolpedAccionOC({
        solpedId: oc.solpedId,
        ocNumero: oc.id,
        usuario: usuarioNombre.value || '—',
        estatusOC: nuevoEstatus,
        comentario
      });
    }

    addToast('success', `OC aprobada → ${nuevoEstatus}`);
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo aprobar la OC.');
  } finally {
    accionando.value = false;
  }
};

const rechazar = async (oc:any) => {
  if (accionando.value) return;
  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de rechazar.'); return; }

  if (rolActual.value === 'GUILLERMO' && oc.estatus !== 'Revisión Guillermo') { addToast('warning','No puedes rechazar este estado.'); return; }
  if (rolActual.value === 'JUAN' && oc.estatus !== 'Preaprobado') { addToast('warning','No puedes rechazar este estado.'); return; }
  if (rolActual.value === 'ALEJANDRO' && oc.estatus !== 'Casi Aprobado') { addToast('warning','No puedes rechazar este estado.'); return; }

  accionando.value = true;
  try {
    const nuevosItems = (oc.items || []).map((it:any) => {
      if ((it.estado || '').toLowerCase().includes('revi')) {
        return { ...it, estado: 'pendiente' };
      }
      return it;
    });

    const nuevoHistorial = [
      ...((oc.historial || [])),
      {
        usuario: usuarioNombre.value || '—',
        estatus: 'Rechazado',
        fecha: new Date().toISOString(),
        comentario
      }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Rechazado',
      historial: nuevoHistorial,
      items: nuevosItems
    });

    await registrarHistorialSolpedAccionOC({
      solpedId: oc.solpedId,
      ocNumero: oc.id,
      usuario: usuarioNombre.value || '—',
      estatusOC: 'Rechazado',
      comentario
    });

    addToast('danger', 'OC rechazada.');
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo rechazar la OC.');
  } finally {
    accionando.value = false;
  }
};
</script>

<style scoped>
.aprob-oc-page{
  min-height:100vh;
}

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toast-stack{
  position: fixed; right: 16px; bottom: 16px; z-index: 1200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast-box{
  display: flex; align-items: center; padding: .6rem .8rem; border-radius: .5rem; color: #fff;
  min-width: 260px; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
}
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }

/* ====== RESUMEN DESTACADO (chips) ====== */
.oc-highlight{
  padding: .65rem .75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: .8rem;
  background: var(--bs-body-bg);
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
}

.oc-pill{
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  padding: .35rem .6rem;
  border-radius: 999px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
  font-size: .9rem;
  line-height: 1;
  white-space: nowrap;
}

.oc-pill-total{
  border-color: var(--bs-primary-border-subtle, var(--bs-border-color));
  background: var(--bs-primary-bg-subtle, var(--bs-secondary-bg));
  color: var(--bs-primary-text);
  font-weight: 600;
}

.oc-pill i{
  font-size: 1rem;
  opacity: .9;
}

@media (max-width: 576px){
  .oc-highlight{ padding: .55rem .6rem; }
  .oc-pill{ font-size: .88rem; }
}
</style>
