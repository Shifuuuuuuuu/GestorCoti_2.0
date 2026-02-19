<!-- src/views/AprobacionOCTaller.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-oc-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm order-1" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0 order-2 flex-grow-1 text-center text-md-start">
          Aprobación de OC (Taller)
        </h1>

        <div class="order-3 d-flex align-items-center gap-2 flex-wrap justify-content-end">
          <span
            v-for="(msg,i) in delegacionesBadge"
            :key="i"
            class="badge bg-warning-subtle text-warning-emphasis"
            title="Delegación automática por aprobador inactivo/vacaciones"
          >
            {{ msg }}
          </span>

          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>
      </div>
      <div v-if="!tengoBandeja" class="alert alert-warning">
        No tienes OCs asignadas para aprobar (o el flujo de Xtreme Servicio no está configurado para ti).
      </div>
      <div class="card" v-if="tengoBandeja">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="fw-semibold">Órdenes encontradas (Solo Xtreme Servicio)</div>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ ocs.length }}</span>
        </div>

        <div class="card-body p-0">
          <div v-if="cargando" class="p-4 text-center">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2">Cargando…</div>
          </div>

          <div v-else-if="ocs.length === 0" class="p-4 text-secondary text-center">
            No hay OCs con estatus “{{ estatusFiltrado }}”.
          </div>

          <div v-else class="list-group list-group-flush">
            <div v-for="oc in ocs" :key="oc.__docId" class="list-group-item">
              <div class="row g-3 align-items-start">
                <div class="col-12 col-lg-9">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold">OC N° {{ oc.id ?? '—' }}</span>
                    <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ prettyEstatus(oc) }}</span>
                  </div>
                  <div class="oc-highlight mt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="oc-pill" title="Centro de costo">
                        <i class="bi bi-building me-1"></i>
                        <strong>Centro:</strong>
                        <span class="text-truncate d-inline-block maxw-180">
                          {{ oc.centroCostoTexto || oc.centroCostoNombre || '—' }}
                        </span>
                        <template v-if="oc.centroCosto"> ({{ oc.centroCosto }})</template>
                      </span>

                      <span class="oc-pill" title="Empresa">
                        <i class="bi bi-diagram-3 me-1"></i>
                        <strong>Empresa:</strong> Xtreme Servicio
                      </span>

                      <span class="oc-pill" title="Moneda">
                        <i class="bi bi-cash-coin me-1"></i>
                        <strong>Moneda:</strong> {{ oc.moneda || 'CLP' }}
                      </span>

                      <span class="oc-pill oc-pill-total" title="Total con IVA">
                        <i class="bi bi-coin me-1"></i>
                        <strong>Total:</strong> {{ formatMoneyCL(ocMonto(oc)) }}
                      </span>
                    </div>
                  </div>

                  <div class="text-body-secondary small mt-1 break-any">
                    <strong>Responsable:</strong> {{ oc.responsable || '—' }} ·
                    <strong>Subida:</strong> {{ fmtFecha(oc.fechaSubida) }}
                  </div>

                  <div v-if="oc.comentario" class="small mt-1 break-any">
                    <em>“{{ oc.comentario }}”</em>
                  </div>
                </div>
                <div class="col-12 col-lg-3">
                  <div class="d-grid gap-2 d-lg-flex justify-content-lg-end">
                    <button class="btn btn-primary btn-sm" @click="oc.expandido = !oc.expandido">
                      {{ oc.expandido ? 'Ocultar' : 'Ver' }} detalle
                    </button>

                    <button
                      v-if="oc.solpedId"
                      class="btn btn-secondary btn-sm"
                      @click="irASolped(oc)"
                    >
                      Ver SOLPED
                    </button>
                  </div>
                </div>
              </div>
              <transition name="fade">
                <div v-if="oc.expandido" class="mt-3">
                  <div v-if="(oc.archivosStorage||[]).length" class="mb-3">
                    <div class="fw-semibold mb-2">📂 Archivos Adjuntos</div>

                    <div v-for="(a,i) in oc.archivosStorage" :key="a.url || (a.nombre+i)" class="card mb-2">
                      <div class="card-header d-flex align-items-center flex-wrap gap-2">
                        <div class="fw-semibold me-auto text-truncate">
                          {{ a.nombre || ('archivo_'+(i+1)) }}
                        </div>

                        <button class="btn btn-sm btn-primary" @click="openViewer({ url:a.url, tipo:a.tipo, nombre:a.nombre })">
                          <i class="bi bi-arrows-fullscreen me-1"></i> Ver grande
                        </button>

                        <button class="btn btn-sm btn-outline-secondary" @click="a.ver = !a.ver">
                          {{ a.ver ? 'Ocultar' : 'Mostrar' }}
                        </button>
                      </div>

                      <div v-if="a.ver" class="card-body">
                        <div
                          v-if="(a.tipo||'').includes('pdf') || isPdf(a.url)"
                          class="ratio ratio-16x9"
                          @click="isXs ? openViewer({ url:a.url, tipo:guessMime(a.url), nombre:a.nombre }) : null"
                          style="cursor: var(--cur-ptr);"
                        >
                          <iframe :src="a.url" style="border:none;"></iframe>
                        </div>
                        <div v-else class="text-center">
                          <img
                            :src="a.url"
                            class="img-fluid rounded shadow-sm"
                            style="max-height:600px;object-fit:contain; cursor: var(--cur-ptr);"
                            @click="isXs ? openViewer({ url:a.url, tipo:a.tipo, nombre:a.nombre }) : null"
                            :alt="a.nombre || ('archivo_'+(i+1))"
                          >
                        </div>
                      </div>
                    </div>
                  </div>
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
                          <th class="d-none d-sm-table-cell">N° Interno</th>
                          <th class="d-none d-lg-table-cell">Código ref.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in oc.items || []" :key="it.__tempId || `${it.item}-${it.descripcion}`">
                          <td>{{ it.item }}</td>
                          <td class="break-any">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada ?? (it.cantidad_solicitada_oc ?? 0) }}</td>
                          <td class="text-center">
                            <span class="badge" :class="badgeItem(it.estado)">
                              {{ String(it.estado||'pendiente').toLowerCase().includes('revi') ? 'en revisión' : (it.estado || 'pendiente') }}
                            </span>
                          </td>
                          <td class="d-none d-sm-table-cell break-any">{{ it.numero_interno || oc.centroCostoTexto || '—' }}</td>
                          <td class="d-none d-lg-table-cell break-any">{{ it.codigo_referencial || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Comentario (obligatorio)</label>
                    <textarea
                      class="form-control"
                      rows="2"
                      v-model="oc._comentarioAccion"
                      placeholder="Explica tu decisión…"
                    ></textarea>
                  </div>
                  <div class="d-grid d-md-flex gap-2">
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
                  <div class="mt-3">
                    <div class="fw-semibold mb-2">🕓 Historial</div>
                    <ul class="list-unstyled small mb-0">
                      <li v-for="(h,idx) in oc.historial || []" :key="idx" class="break-any">
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
    <transition name="viewer">
      <div v-if="viewerOpen" class="viewer-wrap" @keydown.esc="closeViewer" tabindex="0">
        <div class="viewer-backdrop" @click="closeOnBackdrop && closeViewer()"></div>

        <div class="viewer-panel" role="dialog" aria-modal="true" aria-label="Visor de adjunto">
          <div class="viewer-header">
            <div class="viewer-title text-truncate">
              {{ viewerItem?.nombre || 'Adjunto' }}
            </div>
            <div class="d-flex gap-2">
              <a
                v-if="viewerItem?.url"
                :href="viewerItem.url"
                target="_blank" rel="noopener"
                class="btn btn-sm btn-outline-light"
                title="Abrir en nueva pestaña / Descargar"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
              <div v-if="isImage(viewerItem)" class="btn-group btn-group-sm me-1" role="group" aria-label="Zoom">
                <button class="btn btn-outline-light" @click="zoomOut" :disabled="zoom<=0.5"><i class="bi bi-zoom-out"></i></button>
                <button class="btn btn-outline-light" @click="resetZoom"><i class="bi bi-aspect-ratio"></i></button>
                <button class="btn btn-outline-light" @click="zoomIn" :disabled="zoom>=3"><i class="bi bi-zoom-in"></i></button>
              </div>
              <button class="btn btn-sm btn-light" @click="closeViewer" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="viewer-body">
            <div v-if="isImage(viewerItem)" class="viewer-img-wrap">
              <img
                :src="viewerItem.url"
                :alt="viewerItem.nombre || 'imagen'"
                class="viewer-img"
                :style="{ transform: `scale(${zoom})` }"
                @dblclick="toggleZoom"
              />
            </div>

            <div v-else class="viewer-pdf-wrap">
              <iframe :src="viewerItem?.url" class="viewer-pdf" title="PDF"></iframe>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../stores/firebase';
import {
  collection, query, where, orderBy, onSnapshot, doc,
  updateDoc, getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useAuthStore } from '../stores/authService';

const parseMoney = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;
  let negative = false;
  if (s.includes('(') && s.includes(')')) {
    negative = true;
    s = s.replace(/[()]/g, '');
  }
  s = s
    .replace(/\s+/g, '')
    .replace(/[A-Za-z$€£¥₩₽₺₫₴₱₦₲₡₵₸₭₮₢₠₣]/g, '');
  s = s.replace(/[^0-9.,+-]/g, '');
  s = s.replace(/\+/g, '');
  if (s.includes('-')) {
    s = s.replace(/(?!^)-/g, '');
    if (s.startsWith('-')) negative = true;
    s = s.replace(/-/g, '');
  }

  if (!s) return 0;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decSep = lastDot > lastComma ? '.' : ',';
    const thouSep = decSep === '.' ? ',' : '.';

    s = s.split(thouSep).join('');
    s = s.replace(decSep, '.');
  } else if (lastComma >= 0) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      s = parts[0].split('.').join('') + '.' + parts[1];
    } else {
      s = s.split(',').join('');
      s = s.split('.').join('');
    }
  } else if (lastDot >= 0) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      s = parts[0].split(',').join('') + '.' + parts[1];
    } else {
      s = s.split('.').join('');
      s = s.split(',').join('');
    }
  } else {
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? -Math.abs(n) : n;
};

const formatMoneyCL = (n: any) => {
  const v = Number(n || 0);
  const safe = Number.isFinite(v) ? v : 0;
  return Math.round(safe).toLocaleString('es-CL');
};

const ocMonto = (oc: any): number => {
  const candidates = [
    oc?.precioTotalConIVA,
    oc?.totalConIva,
    oc?.total_con_iva,
    oc?.montoTotal,
    oc?.total,
    oc?.monto,
    oc?.precioTotal,
    oc?.precio_total
  ];
  for (const c of candidates) {
    const n = parseMoney(c);
    if (Number.isFinite(n) && n !== 0) return n;
  }
  return parseMoney(oc?.precioTotalConIVA);
};
const normalizeCompany = (raw: any) => {
  const s = String(raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  if (!s) return '';
  if (s.includes('SERV')) return 'SERVICIOS';
  if (s.includes('MIN')) return 'MINING';
  if (s.includes('HORMIG')) return 'HORMIGONES';
  return s;
};
const isServiciosOnly = (oc: any) => normalizeCompany(oc?.empresa) === 'SERVICIOS';
const normStatusKey = (x:any) => String(x || '')
  .trim()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ');
const router = useRouter();
const volver = () => router.back();
const auth = useAuthStore();

const cargando = ref(true);
const ocs = ref<any[]>([]);
const usuarioNombre = ref<string>('');
let _unsub: any = null;
const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };
const isXs = window.matchMedia('(max-width: 576px)').matches;
const viewerOpen = ref(false);
const viewerItem = ref<{url:string,tipo?:string,nombre?:string}|null>(null);
const zoom = ref(1);
const closeOnBackdrop = true;

const isPdf = (url?:string) => String(url||'').toLowerCase().endsWith('.pdf');
const guessMime = (url?: string) => isPdf(url) ? 'application/pdf' : '';
const isImage = (file:any) => {
  const t = String(file?.tipo || '');
  const u = String(file?.url || '').toLowerCase();
  return t.includes('image') || !!u.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/);
};
const openViewer = (file:{url:string,tipo?:string,nombre?:string}) => {
  viewerItem.value = file || null;
  viewerOpen.value = !!viewerItem.value;
  zoom.value = 1;
  setTimeout(()=> { (document.querySelector('.viewer-wrap') as HTMLElement|undefined)?.focus(); }, 0);
};
const closeViewer = () => { viewerOpen.value = false; viewerItem.value = null; zoom.value = 1; };
const zoomIn = () => { zoom.value = Math.min(3, +(zoom.value + 0.25).toFixed(2)); };
const zoomOut = () => { zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2)); };
const resetZoom = () => { zoom.value = 1; };
const toggleZoom = () => { zoom.value = (zoom.value === 1 ? 2 : 1); };
watch(viewerOpen, (v)=> { document.documentElement.style.overflow = v ? 'hidden' : ''; });
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
const sumMapNumbers = (obj: Record<string, unknown> | null | undefined): number => {
  if (!obj || typeof obj !== "object") return 0;
  return Object.values(obj).reduce<number>((acc, v) => {
    const n = typeof v === "number" ? v : Number(v || 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
};

const recomputeSolpedItem = (it:any) => {
  const out = { ...(it || {}) };
  const total = Number(out.cantidad || 0);

  out.cotPorOC = (out.cotPorOC && typeof out.cotPorOC === 'object') ? out.cotPorOC : {};
  out.pendienteRevisionPorOC = (out.pendienteRevisionPorOC && typeof out.pendienteRevisionPorOC === 'object') ? out.pendienteRevisionPorOC : {};

  const aprobado = Math.min(total, sumMapNumbers(out.cotPorOC));
  const reservado = Math.min(total, sumMapNumbers(out.pendienteRevisionPorOC));
  const comprometido = Math.min(total, aprobado + reservado);

  out.cantidad_cotizada = comprometido;

  if (total > 0 && aprobado >= total) out.estado_cotizacion = 'completado';
  else if (comprometido > 0) out.estado_cotizacion = 'parcial';
  else out.estado_cotizacion = 'pendiente';

  out.estado = out.estado_cotizacion;
  return out;
};

const computeSolpedEstatus = (items:any[]) => {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return 'Pendiente';

  const completos = arr.filter(it => {
    const total = Number(it.cantidad || 0);
    const aprob = sumMapNumbers(it.cotPorOC);
    return total > 0 && aprob >= total;
  }).length;

  const anyApproved = arr.some(it => sumMapNumbers(it.cotPorOC) > 0);
  const anyPending = arr.some(it => sumMapNumbers(it.pendienteRevisionPorOC) > 0);

  if (completos === arr.length) return 'Cotizado Completado';
  if (anyApproved) return 'Cotizado Parcial';
  if (anyPending) return 'Cotizando - Revisión Guillermo';
  return 'Pendiente';
};

const norm2 = (x:any) => String(x||'').trim().toLowerCase();
const buildMatchers = (itemsSol:any[]) => {
  const idxItemNo = new Map<number, number>();
  const idxNI  = new Map<string, number>();
  const idxCR  = new Map<string, number>();
  const descCount = new Map<string, number>();

  itemsSol.forEach((it, i) => {
    const n = Number(it?.item);
    if (Number.isFinite(n) && n > 0) idxItemNo.set(n, i);

    const ni = norm2(it.numero_interno);
    const cr = norm2(it.codigo_referencial);
    const ds = norm2(it.descripcion);

    if (ni) idxNI.set(ni, i);
    if (cr) idxCR.set(cr, i);
    if (ds) descCount.set(ds, (descCount.get(ds) || 0) + 1);
  });

  const findIndex = (ocIt:any) => {
    const n = Number(ocIt?.solped_item_no ?? ocIt?.item);
    if (Number.isFinite(n) && idxItemNo.has(n)) return idxItemNo.get(n)!;

    const kNI = norm2(ocIt.numero_interno);
    const kCR = norm2(ocIt.codigo_referencial);
    const kDS = norm2(ocIt.descripcion);

    if (kNI && idxNI.has(kNI)) return idxNI.get(kNI)!;
    if (kCR && idxCR.has(kCR)) return idxCR.get(kCR)!;
    if (kDS && descCount.get(kDS) === 1) return itemsSol.findIndex(sIt => norm2(sIt.descripcion) === kDS);

    return -1;
  };

  return { findIndex };
};

const extractOcQty = (ocIt:any) => {
  const raw = Math.max(
    Number(ocIt?.cantidad_solicitada_oc ?? 0),
    Number(ocIt?.cantidad_para_cotizar ?? 0),
    Number(ocIt?.cantidad_cotizada ?? 0),
  );
  return Math.max(0, raw);
};

const ensureReservationForRevisionOC = async (oc:any) => {
  try {
    if (!isServiciosOnly(oc)) return;
    if (!oc?.solpedId) return;

    const est = String(oc?.estatus||'').toLowerCase();
    const isRevLike =
      est.includes('revisión') ||
      est.includes('revision') ||
      est.includes('preaprob') ||
      est.includes('pre aprob') ||
      est.includes('pre-aprob') ||
      est.includes('preaprobado') ||
      est.includes('pre aprobado') ||
      est.includes('pre-aprobado') ||
      est.includes('preparob') ||
      est.includes('casi') ||
      est.includes('pendiente de aprobacion') ||
      est.includes('pendiente de aprobación');

    if (!isRevLike) return;

    const ocKey = String(oc?.id ?? oc?.__docId ?? '');
    if (!ocKey) return;

    const sref = doc(db, 'solped_taller', String(oc.solpedId));
    const ss = await getDoc(sref);
    if (!ss.exists()) return;

    const sdata:any = ss.data() || {};
    const itemsSol:any[] = Array.isArray(sdata.items) ? [...sdata.items] : [];
    if (!itemsSol.length) return;

    const { findIndex } = buildMatchers(itemsSol);

    let changed = false;

    const ocItems = Array.isArray(oc.items) ? oc.items : [];
    for (const ocIt of ocItems) {
      const idx = findIndex(ocIt);
      if (idx < 0) continue;

      const sIt = { ...itemsSol[idx] };
      const total = Number(sIt.cantidad || 0);
      const qty = Math.min(total, extractOcQty(ocIt));

      if (!sIt.pendienteRevisionPorOC || typeof sIt.pendienteRevisionPorOC !== 'object') sIt.pendienteRevisionPorOC = {};
      if (!sIt.cotPorOC || typeof sIt.cotPorOC !== 'object') sIt.cotPorOC = {};

      const aprobado = Math.min(total, sumMapNumbers(sIt.cotPorOC));
      const reservadoActual = Math.min(total, sumMapNumbers(sIt.pendienteRevisionPorOC));
      const disponible = Math.max(0, total - aprobado - reservadoActual);

      const prev = Number(sIt.pendienteRevisionPorOC[ocKey] || 0);
      const target = Math.max(prev, Math.min(qty, prev + disponible));

      if (target !== prev) {
        sIt.pendienteRevisionPorOC[ocKey] = target;
        itemsSol[idx] = recomputeSolpedItem(sIt);
        changed = true;
      } else {
        const rec = recomputeSolpedItem(sIt);
        if (JSON.stringify(rec) !== JSON.stringify(itemsSol[idx])) {
          itemsSol[idx] = rec;
          changed = true;
        }
      }
    }

    if (changed) {
      const estatusSol = computeSolpedEstatus(itemsSol);
      await updateDoc(sref, {
        items: itemsSol,
        estatus: estatusSol,
        updated_at: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('ensureReservationForRevisionOC:', e);
  }
};

const applyFinalApprovalToSolped = async (oc:any, aprobador:string, comentario:string, estatusOC?:string) => {
  if (!isServiciosOnly(oc)) return;
  if (!oc?.solpedId) return;

  const ocKey = String(oc?.id ?? oc?.__docId ?? '');
  if (!ocKey) return;

  const sref = doc(db, 'solped_taller', String(oc.solpedId));
  const ss = await getDoc(sref);
  if (!ss.exists()) return;

  const sdata:any = ss.data() || {};
  const itemsSol:any[] = Array.isArray(sdata.items) ? [...sdata.items] : [];
  const ocItems:any[] = Array.isArray(oc.items) ? oc.items : [];
  if (!itemsSol.length || !ocItems.length) return;

  const { findIndex } = buildMatchers(itemsSol);

  let changed = false;

  for (const ocIt of ocItems) {
    const idx = findIndex(ocIt);
    if (idx < 0) continue;

    const sIt = { ...itemsSol[idx] };
    const total = Number(sIt.cantidad || 0);

    sIt.cotPorOC = (sIt.cotPorOC && typeof sIt.cotPorOC === 'object') ? sIt.cotPorOC : {};
    sIt.pendienteRevisionPorOC = (sIt.pendienteRevisionPorOC && typeof sIt.pendienteRevisionPorOC === 'object') ? sIt.pendienteRevisionPorOC : {};

    const pendQty = Number(sIt.pendienteRevisionPorOC?.[ocKey] || 0);
    const qtyFromOc = extractOcQty(ocIt);

    const qty = Math.max(pendQty, qtyFromOc);
    if (qty <= 0) {
      const rec = recomputeSolpedItem(sIt);
      if (JSON.stringify(rec) !== JSON.stringify(itemsSol[idx])) {
        itemsSol[idx] = rec;
        changed = true;
      }
      continue;
    }

    const prevAprob = Number(sIt.cotPorOC[ocKey] || 0);
    const nextAprob = Math.max(prevAprob, Math.min(qty, total));
    if (nextAprob !== prevAprob) {
      sIt.cotPorOC[ocKey] = nextAprob;
      changed = true;
    }

    if (sIt.pendienteRevisionPorOC && sIt.pendienteRevisionPorOC[ocKey] != null) {
      delete sIt.pendienteRevisionPorOC[ocKey];
      changed = true;
    }

    const rec = recomputeSolpedItem(sIt);
    if (JSON.stringify(rec) !== JSON.stringify(itemsSol[idx])) {
      itemsSol[idx] = rec;
      changed = true;
    }
  }

  if (changed) {
    const estatusSol = computeSolpedEstatus(itemsSol);
    await updateDoc(sref, {
      items: itemsSol,
      estatus: estatusSol,
      updated_at: serverTimestamp()
    });

    try {
      await addDoc(collection(sref, 'historialEstados'), {
        origen: 'Aprobación OC (Taller)',
        usuario: aprobador || '—',
        estatus: estatusSol,
        detalle: comentario || '',
        comentario: comentario || '',
        ocNumero: oc?.id ?? null,
        fecha: serverTimestamp()
      });
    } catch {}
  }

  if (estatusOC) {
    await registrarHistorialSolpedAccionOC_Taller({
      solpedId: String(oc.solpedId),
      ocNumero: oc?.id ?? null,
      usuario: aprobador || '—',
      estatusOC,
      comentario: comentario || ''
    });
  }
};

const releaseReservationInSolped = async (oc:any, usuario:string, comentario:string) => {
  if (!isServiciosOnly(oc)) return;
  if (!oc?.solpedId) return;

  const ocKey = String(oc?.id ?? oc?.__docId ?? '');
  if (!ocKey) return;

  const sref = doc(db, 'solped_taller', String(oc.solpedId));
  const ss = await getDoc(sref);
  if (!ss.exists()) return;

  const sdata:any = ss.data() || {};
  const itemsSol:any[] = Array.isArray(sdata.items) ? [...sdata.items] : [];
  const ocItems:any[] = Array.isArray(oc.items) ? oc.items : [];
  if (!itemsSol.length || !ocItems.length) return;

  const { findIndex } = buildMatchers(itemsSol);

  let changed = false;

  for (const ocIt of ocItems) {
    const idx = findIndex(ocIt);
    if (idx < 0) continue;

    const sIt = { ...itemsSol[idx] };
    sIt.pendienteRevisionPorOC = (sIt.pendienteRevisionPorOC && typeof sIt.pendienteRevisionPorOC === 'object')
      ? sIt.pendienteRevisionPorOC
      : {};

    if (sIt.pendienteRevisionPorOC && sIt.pendienteRevisionPorOC[ocKey] != null) {
      delete sIt.pendienteRevisionPorOC[ocKey];
      changed = true;
    }

    const rec = recomputeSolpedItem(sIt);
    if (JSON.stringify(rec) !== JSON.stringify(itemsSol[idx])) {
      itemsSol[idx] = rec;
      changed = true;
    }
  }

  if (changed) {
    const estatusSol = computeSolpedEstatus(itemsSol);
    await updateDoc(sref, {
      items: itemsSol,
      estatus: estatusSol,
      updated_at: serverTimestamp()
    });
  }

  await registrarHistorialSolpedAccionOC_Taller({
    solpedId: String(oc.solpedId),
    ocNumero: oc?.id ?? null,
    usuario: usuario || '—',
    estatusOC: 'Rechazado',
    comentario: comentario || ''
  });
};
type StepCfg = {
  id: string;
  nombre: string;
  inStatus: string;
  min: number;
  max: number;
  approveTo: string;
  overTo?: string;
  activo?: boolean;
  approvers?: {
    uid:string;
    fullName?:string;
    email?:string;
    activo?:boolean;
    vacaciones?: {from:string;to:string}[]
  }[];
};

const empresaKey = 'xtreme_servicio';

const flujoEmpresa = ref<{ nombre?: string; activo?: boolean; steps?: StepCfg[] } | null>(null);
let _unsubFlow: any = null;

const DEFAULT_SERVICIO_FLOW: { nombre: string; activo: true; steps: StepCfg[] } = {
  nombre: 'Xtreme Servicio',
  activo: true,
  steps: [
    {
      id: 'gmo',
      nombre: 'Revisión Guillermo',
      inStatus: 'Revisión Guillermo',
      min: 0,
      max: 500000,
      approveTo: 'Aprobado',
      overTo: 'Preaprobado',
      activo: true,
      approvers: []
    },
    {
      id: 'juan',
      nombre: 'Preaprobado',
      inStatus: 'Preaprobado',
      min: 500001,
      max: 5000000,
      approveTo: 'Aprobado',
      overTo: 'Casi Aprobado',
      activo: true,
      approvers: []
    },
    {
      id: 'ale',
      nombre: 'Casi Aprobado',
      inStatus: 'Casi Aprobado',
      min: 5000001,
      max: 999999999999,
      approveTo: 'Aprobado',
      overTo: '',
      activo: true,
      approvers: []
    }
  ]
};

const localDateKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

const isOnVacation = (vac:any[] | undefined) => {
  if (!Array.isArray(vac) || !vac.length) return false;
  const today = localDateKey();
  return vac.some(v => {
    const from = String(v?.from || '').trim();
    const to   = String(v?.to || '').trim();
    return from && to && from <= today && today <= to;
  });
};

const stepEnabled = (st: StepCfg) => st?.activo !== false;

const availableApprovers = (st: StepCfg) => {
  const aps = Array.isArray(st?.approvers) ? st.approvers : [];
  return aps.filter(a =>
    a?.uid &&
    a.activo !== false &&
    !isOnVacation(a.vacaciones)
  );
};

const stepsCfg = computed<StepCfg[]>(() => {
  const base = flujoEmpresa.value?.steps && Array.isArray(flujoEmpresa.value.steps)
    ? flujoEmpresa.value.steps
    : DEFAULT_SERVICIO_FLOW.steps;

  return base.map(s => ({
    ...s,
    nombre: s.nombre || 'Etapa',
    inStatus: s.inStatus || '',
    min: Number(s.min || 0),
    max: Number(s.max || 0),
    approveTo: s.approveTo || 'Aprobado',
    overTo: String(s.overTo || ''),
    activo: s.activo !== false,
    approvers: Array.isArray(s.approvers) ? s.approvers : []
  }));
});

const stepOperational = (st: StepCfg) => stepEnabled(st) && availableApprovers(st).length > 0;

const handlerIndexFor = (i: number) => {
  const steps = stepsCfg.value;
  if (!steps.length) return -1;
  if (i < 0 || i >= steps.length) return -1;

  if (stepOperational(steps[i])) return i;

  const cur = normStatusKey(steps[i]?.inStatus || steps[i]?.nombre || '');
  const preferNext = cur === 'preaprobado' || cur.includes('preaprob');

  if (preferNext) {
    for (let k = i + 1; k < steps.length; k++) if (stepOperational(steps[k])) return k;
    for (let k = i - 1; k >= 0; k--) if (stepOperational(steps[k])) return k;
  } else {
    for (let k = i - 1; k >= 0; k--) if (stepOperational(steps[k])) return k;
    for (let k = i + 1; k < steps.length; k++) if (stepOperational(steps[k])) return k;
  }

  return -1;
};

const statusToStepIndex = computed(() => {
  const m = new Map<string, number>();
  stepsCfg.value.forEach((st, idx) => {
    const key = normStatusKey(st.inStatus);
    if (key) m.set(key, idx);

    const compact = key.replace(/\s+/g, '');
    if (compact) m.set(compact, idx);
  });
  return m;
});

const stepIndexFromOCStatus = (estatus:any) => {
  const key = normStatusKey(estatus);
  if (!key) return -1;

  const direct = statusToStepIndex.value.get(key);
  if (direct != null) return direct;

  const compact = key.replace(/\s+/g, '');
  const direct2 = statusToStepIndex.value.get(compact);
  if (direct2 != null) return direct2;

  const steps = stepsCfg.value;
  const found = steps.findIndex(st => {
    const k = normStatusKey(st.inStatus);
    if (!k) return false;
    if (key.includes(k) || k.includes(key)) return true;
    if (key.includes('preparob') && k.includes('preaprob')) return true;
    return false;
  });

  return found;
};

const myUid = computed(() => auth?.user?.uid || '');

const iHandleStep = (stepIndex: number) => {
  const steps = stepsCfg.value;
  const uid = myUid.value;
  if (!uid || stepIndex < 0 || stepIndex >= steps.length) return false;

  const h = handlerIndexFor(stepIndex);
  if (h < 0) return false;

  return availableApprovers(steps[h]).some(a => a.uid === uid);
};

const estadosObjetivo = computed<string[]>(() => {
  const out: string[] = [];
  const steps = stepsCfg.value;
  const uid = myUid.value;
  if (!uid || !steps.length) return out;

  steps.forEach((st, idx) => {
    if (!st.inStatus) return;

    const h = handlerIndexFor(idx);
    if (h < 0) return;

    const isMine = availableApprovers(steps[h]).some(a => a.uid === uid);
    if (isMine) out.push(st.inStatus);
  });

  return Array.from(new Set(out));
});

const estatusFiltrado = computed(() => estadosObjetivo.value.join(' / '));
const tengoBandeja = computed(() => estadosObjetivo.value.length > 0);

const delegacionesBadge = computed(() => {
  const steps = stepsCfg.value;
  const uid = myUid.value;
  if (!uid || !steps.length) return [];

  const msgs: string[] = [];
  steps.forEach((st, idx) => {
    const h = handlerIndexFor(idx);
    if (h < 0) return;

    const ownOps = stepOperational(st);
    if (ownOps) return;

    const iAmHandler = availableApprovers(steps[h]).some(a => a.uid === uid);
    if (!iAmHandler) return;

    const fromName = (st.nombre || st.inStatus || `Etapa #${idx+1}`).trim();
    const toName = (steps[h]?.nombre || steps[h]?.inStatus || `Etapa #${h+1}`).trim();
    msgs.push(`Delegado: ${fromName} → ${toName}`);
  });

  return msgs.slice(0, 3);
});

const prettyEstatus = (oc:any) => {
  const idx = stepIndexFromOCStatus(oc?.estatus);
  if (idx < 0) return oc?.estatus || '—';

  const h = handlerIndexFor(idx);
  if (h >= 0 && h !== idx && iHandleStep(idx)) {
    return `${oc?.estatus || '—'} (delegado)`;
  }
  return oc?.estatus || '—';
};

const computeNextStatusAutoSkip = (oc:any) => {
  const steps = stepsCfg.value;
  const uid = myUid.value;
  const monto = ocMonto(oc);

  let idx = stepIndexFromOCStatus(oc?.estatus);
  if (idx < 0) return String(oc?.estatus || 'Aprobado');

  const visited = new Set<number>();

  for (let hop = 0; hop < 8; hop++) {
    if (idx < 0 || idx >= steps.length) break;
    if (visited.has(idx)) break;
    visited.add(idx);

    const st = steps[idx];
    const max = Number(st.max ?? 0);
    const overTo = String(st.overTo || '').trim();
    const approveTo = String(st.approveTo || 'Aprobado').trim();

    const next = (overTo && monto > max) ? overTo : approveTo;

    const nextIdx = stepIndexFromOCStatus(next);
    if (nextIdx < 0) return next;

    if (uid && iHandleStep(nextIdx)) {
      idx = nextIdx;
      continue;
    }
    return next;
  }
  return 'Aprobado';
};

const canActOnOC = (oc:any) => {
  if (!isServiciosOnly(oc)) return false;
  const idx = stepIndexFromOCStatus(oc?.estatus);
  if (idx < 0) return false;
  return iHandleStep(idx);
};

const guardMaxByStep = (oc:any) => {
  const idx = stepIndexFromOCStatus(oc?.estatus);
  if (idx < 0) return { ok: true as const };

  const st = stepsCfg.value[idx];
  const monto = ocMonto(oc);
  const max = Number(st?.max ?? 0);
  const overTo = String(st?.overTo || '').trim();
  return { ok: true as const };
};
const registrarHistorialSolpedAccionOC_Taller = async ({
  solpedId, ocNumero, usuario, estatusOC, comentario
}: {
  solpedId: string, ocNumero?: number|string|null, usuario: string, estatusOC: string, comentario: string
}) => {
  if (!solpedId) return;
  try {
    const sref = doc(db, 'solped_taller', String(solpedId));
    await addDoc(collection(sref, 'historialEstados'), {
      origen: 'Acción OC (Taller)',
      usuario: usuario || '—',
      estatus: estatusOC,
      detalle: comentario || '',
      comentario: comentario || '',
      ocNumero: ocNumero ?? null,
      fecha: serverTimestamp()
    });
  } catch (e) {
    console.warn('No se pudo registrar acción de OC (taller) en historialEstados:', e);
  }
};

const accionando = ref(false);

const irASolped = (oc:any) => {
  const id = oc?.solpedId;
  if (!id) {
    addToast('warning','Esta OC no tiene SOLPED asociada.');
    return;
  }
  try { router.push({ name: 'SolpedTallerDetalle', params: { id } }); }
  catch { router.push(`/solped-taller/${id}`); }
};
const solicitarAclaracion = async (oc:any) => {
  if (accionando.value) return;

  if (!isServiciosOnly(oc)) {
    addToast('warning', 'Esta vista (Taller) es solo para Xtreme Servicio.');
    return;
  }

  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de solicitar aclaración.'); return; }

  if (!canActOnOC(oc)) { addToast('warning','No puedes solicitar aclaración en este estado.'); return; }

  accionando.value = true;
  try {
    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Pendiente de Aprobación', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc_taller', oc.__docId), {
      estatus: 'Pendiente de Aprobación',
      historial: nuevoHistorial
    });

    await registrarHistorialSolpedAccionOC_Taller({
      solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
      estatusOC: 'Pendiente de Aprobación', comentario
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

const aprobar = async (oc:any) => {
  if (accionando.value) return;

  if (!isServiciosOnly(oc)) {
    addToast('warning', 'Esta vista (Taller) es solo para Xtreme Servicio.');
    return;
  }

  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de aprobar.'); return; }

  if (!canActOnOC(oc)) { addToast('warning','No puedes aprobar este estado.'); return; }
  const guard = guardMaxByStep(oc);

  accionando.value = true;
  try {
    const nuevoEstatus = computeNextStatusAutoSkip(oc);

    const nuevosItems = (oc.items || []).map((it:any) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'aprobado' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: nuevoEstatus, fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc_taller', oc.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      items: nuevosItems,
      aprobadoPor: usuarioNombre.value || '',
      montoParseado: ocMonto(oc),
    });

    if (String(nuevoEstatus).trim().toLowerCase() === 'aprobado') {
      await applyFinalApprovalToSolped(
        { ...oc, items: nuevosItems },
        usuarioNombre.value || '—',
        comentario,
        nuevoEstatus
      );
    } else {
      await registrarHistorialSolpedAccionOC_Taller({
        solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
        estatusOC: nuevoEstatus, comentario
      });
      await ensureReservationForRevisionOC({ ...oc, estatus: nuevoEstatus, items: nuevosItems });
    }

    addToast('success', `OC (taller) aprobada → ${nuevoEstatus}`);
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

  if (!isServiciosOnly(oc)) {
    addToast('warning', 'Esta vista (Taller) es solo para Xtreme Servicio.');
    return;
  }

  const comentario = (oc._comentarioAccion || '').trim();
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de rechazar.'); return; }

  if (!canActOnOC(oc)) { addToast('warning','No puedes rechazar este estado.'); return; }

  accionando.value = true;
  try {
    const nuevosItems = (oc.items || []).map((it:any) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'pendiente' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Rechazado', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc_taller', oc.__docId), {
      estatus: 'Rechazado',
      historial: nuevoHistorial,
      items: nuevosItems
    });

    await releaseReservationInSolped({ ...oc, items: nuevosItems }, usuarioNombre.value || '—', comentario);

    addToast('danger', 'OC (taller) rechazada.');
    ocs.value = ocs.value.filter(x => x.__docId !== oc.__docId);
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo rechazar la OC.');
  } finally {
    accionando.value = false;
  }
};

const expandStatusVariants = (s: string) => {
  const raw = String(s || '').trim();
  const key = normStatusKey(raw);
  const out = new Set<string>();
  if (raw) out.add(raw);

  if (raw.includes('-')) out.add(raw.replace(/-/g, ' '));
  if (raw.includes(' ')) out.add(raw.replace(/\s+/g, '-'));

  const title = key.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  if (title) out.add(title);

  if (key.replace(/\s+/g,'') === 'preaprobado') {
    out.add('Pre Aprobado');
    out.add('Pre-Aprobado');
    out.add('PreAprobado');
    out.add('PREAPROBADO');
    out.add('Preparobado');
    out.add('PREPAROBADO');
  }

  if (key.replace(/\s+/g,'') === 'casiaprobado') {
    out.add('Casi-Aprobado');
    out.add('CasiAprobado');
    out.add('CASI APROBADO');
  }

  if (key === 'pendiente de aprobacion') {
    out.add('Pendiente de Aprobación');
    out.add('Pendiente de Aprobacion');
    out.add('PENDIENTE DE APROBACION');
  }

  if (key === 'revision guillermo' || key === 'revison guillermo') {
    out.add('Revisión Guillermo');
    out.add('Revision Guillermo');
  }

  return Array.from(out).filter(Boolean);
};
const subscribeOCs = (targets: string[]) => {
  if (_unsub) { _unsub(); _unsub = null; }
  ocs.value = [];
  cargando.value = true;

  if (!targets.length) { cargando.value = false; return; }

  const expanded = Array.from(
    new Set(targets.flatMap(t => expandStatusVariants(t)))
  ).slice(0, 10);

  const qy = expanded.length === 1
    ? query(
        collection(db, 'ordenes_oc_taller'),
        where('estatus', '==', expanded[0]),
        orderBy('fechaSubida', 'desc')
      )
    : query(
        collection(db, 'ordenes_oc_taller'),
        where('estatus', 'in', expanded),
        orderBy('fechaSubida', 'desc')
      );

  _unsub = onSnapshot(qy, async (snap) => {
    const arr:any[] = [];
    const ops: Promise<any>[] = [];

    snap.forEach(d => {
      const data:any = d.data();

      if (normalizeCompany(data?.empresa) !== 'SERVICIOS') return;

      const archivos = Array.isArray(data.archivosStorage)
        ? data.archivosStorage.map((a:any)=>({ ...a, ver:false }))
        : [];

      const ocRow = {
        __docId: d.id,
        ...data,
        archivosStorage: archivos,
        expandido: false,
        _comentarioAccion: ''
      };
      ocRow.__monto = ocMonto(ocRow);

      arr.push(ocRow);

      const est = String(ocRow.estatus||'').toLowerCase();
      const isRevLike =
        est.includes('revisión') ||
        est.includes('revision') ||
        est.includes('preaprob') ||
        est.includes('pre aprob') ||
        est.includes('pre-aprob') ||
        est.includes('preparob') ||
        est.includes('casi') ||
        est.includes('pendiente de aprobacion') ||
        est.includes('pendiente de aprobación');

      if (isRevLike && ocRow.solpedId) {
        ops.push(ensureReservationForRevisionOC(ocRow));
      }
    });

    arr.sort((a,b)=> (b.fechaSubida?.toMillis?.() ?? new Date(b.fechaSubida||0).getTime())
                  - (a.fechaSubida?.toMillis?.() ?? new Date(a.fechaSubida||0).getTime()));
    ocs.value = arr;
    cargando.value = false;

    Promise.allSettled(ops).catch(()=>{});
  }, (err)=> {
    console.error(err);
    addToast('danger','Error al cargar OCs (taller).');
    cargando.value = false;
  });
};

const pickUserName = (u:any = {}, fallback = '') => {
  return (
    u?.fullName ||
    u?.Nombre_completo ||
    u?.nombre ||
    u?.name ||
    u?.displayName ||
    u?.email ||
    fallback ||
    ''
  );
};

onMounted(async () => {
  try {
    const uid = auth?.user?.uid;
    let fullName = auth?.user?.displayName || auth?.user?.email || '';
    if (uid) {
      try {
        let us = await getDoc(doc(db, 'Usuarios', uid));
        if (!us.exists()) us = await getDoc(doc(db, 'usuarios', uid));
        if (us.exists()) {
          const d = us.data() || {};
          fullName = pickUserName(d, fullName);
        }
      } catch {}
    }
    usuarioNombre.value = fullName || '';

    _unsubFlow = onSnapshot(
      doc(db, 'configuracion', 'aprobacion_oc_taller', 'empresas', empresaKey),
      (snap) => {
        flujoEmpresa.value = snap.exists() ? (snap.data() as any) : null;
      },
      (err) => {
        console.warn('No se pudo leer flujo empresa (taller). Se usará fallback local:', err);
        flujoEmpresa.value = null;
      }
    );

    watch(estadosObjetivo, (targets) => {
      subscribeOCs(targets);
    }, { immediate: true });

  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo inicializar la vista.');
    cargando.value = false;
  }
});

onBeforeUnmount(()=> {
  if (_unsub) _unsub();
  if (_unsubFlow) _unsubFlow();
});
</script>

<style scoped>
.aprob-oc-page{ min-height:100vh; }

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
.oc-highlight{
  padding: .65rem .75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: .8rem;
  background: var(--bs-body-bg);
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
}
.oc-pill{
  display: inline-flex; align-items: center; gap: .25rem;
  padding: .35rem .6rem; border-radius: 999px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-secondary-bg); color: var(--bs-body-color);
  font-size: .9rem; line-height: 1; white-space: nowrap;
}
.oc-pill-total{
  border-color: var(--bs-primary-border-subtle, var(--bs-border-color));
  background: var(--bs-primary-bg-subtle, var(--bs-secondary-bg));
  color: var(--bs-primary-text); font-weight: 600;
}
.oc-pill i{ font-size: 1rem; opacity: .9; }

.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.minw-0{ min-width: 0; }
.maxw-180{ max-width: 180px; }
.maxw-140{ max-width: 140px; }
@media (max-width: 576px){
  .oc-highlight{ padding: .55rem .6rem; }
  .oc-pill{ font-size: .88rem; }
  .list-group-item .btn{ width: 100%; }
}

.viewer-enter-active, .viewer-leave-active { transition: opacity .18s ease; }
.viewer-enter-from, .viewer-leave-to { opacity: 0; }

.viewer-wrap{
  position: fixed; inset: 0; z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.viewer-backdrop{
  position: absolute; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(2px);
}
.viewer-panel{
  position: relative; z-index: 1; display: flex; flex-direction: column;
  width: min(96vw, 1200px); height: min(92vh, 900px);
  background: #0b0f14; color: #fff; border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.viewer-header{
  display: flex; align-items: center; justify-content: space-between;
  gap: .75rem; padding: .6rem .75rem .6rem .9rem;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.viewer-title{ font-weight: 600; max-width: 60vw; }
.viewer-body{
  position: relative; flex: 1; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #0b0f14;
}

.viewer-img-wrap{
  width: 100%; height: 100%;
  display: grid; place-items: center; overflow: auto;
}
.viewer-img{
  max-width: 100%; max-height: 100%;
  transition: transform .12s ease;
  will-change: transform;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.viewer-pdf-wrap{ width: 100%; height: 100%; }
.viewer-pdf{ width: 100%; height: 100%; border: none; }

@media (max-width: 576px){
  .viewer-panel{
    width: 100vw; height: 100vh; border-radius: 0;
  }
  .viewer-title{ max-width: 50vw; }
}
:root { --cur-ptr: pointer; }
</style>
