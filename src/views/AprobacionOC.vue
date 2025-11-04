<!-- AprobaciónOC.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="aprob-oc-page">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm order-1" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <h1 class="h4 fw-semibold mb-0 order-2 flex-grow-1 text-center text-md-start">
          Aprobación de OC
        </h1>

        <!-- Controles en desktop/tablet -->
        <div class="d-none d-md-flex align-items-center gap-2 ms-auto order-3">
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

        <!-- Controles en móvil: botón offcanvas (custom) -->
        <div class="d-flex d-md-none align-items-center gap-2 ms-auto order-3">
          <button
            class="btn btn-outline-primary btn-sm"
            @click="toggleFiltersResponsive"
            :aria-expanded="showFiltersMobile"
            aria-controls="offFiltrosCustom"
          >
            <i class="bi bi-sliders"></i> Filtros
          </button>
          <span class="badge bg-dark-subtle text-dark-emphasis">{{ usuarioNombre || '—' }}</span>
        </div>
      </div>

      <!-- Mensaje rol -->
      <div v-if="!rolActual" class="alert alert-warning">
        Tu usuario no tiene rol de aprobación o aún no se determina.
      </div>

      <!-- Lista -->
      <div class="card" v-if="rolActual">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="minw-0">
            <div class="fw-semibold">Órdenes encontradas</div>
            <div class="small text-secondary text-truncate">
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
              <!-- Fila responsive -->
              <div class="row g-3 align-items-start">
                <!-- Col: info -->
                <div class="col-12 col-lg-9">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold">OC N° {{ oc.id ?? '—' }}</span>
                    <span class="badge" :class="estadoBadgeClass(oc.estatus)">{{ oc.estatus }}</span>
                  </div>

                  <!-- Chips resumen -->
                  <div class="oc-highlight mt-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="oc-pill" title="Centro de costo">
                        <i class="bi bi-building me-1"></i>
                        <strong>Centro:</strong>
                        <span class="text-truncate d-inline-block maxw-180">
                          {{ oc.centroCostoNombre || '—' }}
                        </span>
                        <template> ({{ oc.centroCosto || '—' }})</template>
                      </span>

                      <span class="oc-pill" title="Empresa">
                        <i class="bi bi-diagram-3 me-1"></i>
                        <strong>Empresa:</strong>
                        <span class="text-truncate d-inline-block maxw-140">{{ oc.empresa || '—' }}</span>
                      </span>

                      <span class="oc-pill" title="Moneda">
                        <i class="bi bi-cash-coin me-1"></i>
                        <strong>Moneda:</strong> {{ oc.moneda || 'CLP' }}
                      </span>

                      <span class="oc-pill oc-pill-total" title="Total con IVA">
                        <i class="bi bi-coin me-1"></i>
                        <strong>Total:</strong>
                        {{ (oc.precioTotalConIVA ?? 0).toLocaleString('es-CL') }}
                      </span>
                    </div>
                  </div>

                  <!-- Compacto -->
                  <div class="text-body-secondary small mt-1 break-any">
                    <strong>Responsable:</strong> {{ oc.responsable || '—' }} ·
                    <strong>Subida:</strong> {{ fmtFecha(oc.fechaSubida) }}
                  </div>

                  <div v-if="oc.comentario" class="small mt-1 break-any">
                    <em>“{{ oc.comentario }}”</em>
                  </div>
                </div>

                <!-- Col: acciones -->
                <div class="col-12 col-lg-3">
                  <div class="d-grid gap-2 d-lg-flex justify-content-lg-end">
                    <button
                      class="btn btn-primary btn-sm"
                      @click="oc.expandido = !oc.expandido; if (oc.expandido) ensureSolpedAuthLoaded(oc)"
                    >
                      {{ oc.expandido ? 'Ocultar' : 'Ver' }} detalle
                    </button>
                    <button
                      v-if="oc.solpedId"
                      class="btn btn-secondary btn-sm"
                      @click="irASolped(oc)">
                      Ver SOLPED
                    </button>
                  </div>
                </div>
              </div>

              <!-- Detalle -->
              <transition name="fade">
                <div v-if="oc.expandido" class="mt-3">
                  <!-- Archivos (propios de la OC) -->
                  <div v-if="(oc.archivosStorage||[]).length" class="mb-3">
                    <div class="fw-semibold mb-2">📂 Archivos Adjuntos</div>

                    <!-- BLOQUE ADJUNTOS con botón "Ver grande" y click en XS -->
                    <div v-for="(a,i) in oc.archivosStorage" :key="a.url" class="card mb-2">
                      <div class="card-header d-flex align-items-center flex-wrap gap-2">
                        <div class="fw-semibold me-auto text-truncate">{{ a.nombre || ('archivo_'+(i+1)) }}</div>
                        <button class="btn btn-sm btn-primary" @click="openViewer(a)">
                          <i class="bi bi-arrows-fullscreen me-1"></i> Ver grande
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" @click="a.ver = !a.ver">
                          {{ a.ver ? 'Ocultar' : 'Mostrar' }}
                        </button>
                      </div>

                      <div v-if="a.ver" class="card-body">
                        <div
                          v-if="(a.tipo||'').includes('pdf')"
                          class="ratio ratio-16x9"
                          @click="isXs ? openViewer(a) : null"
                          style="cursor: var(--cur-ptr);"
                        >
                          <iframe :src="a.url" style="border:none;"></iframe>
                        </div>

                        <div v-else class="text-center">
                          <img
                            :src="a.url"
                            class="img-fluid rounded shadow-sm"
                            style="max-height:600px;object-fit:contain; cursor: var(--cur-ptr);"
                            @click="isXs ? openViewer(a) : null"
                            :alt="a.nombre || ('archivo_'+(i+1))"
                          >
                        </div>
                      </div>
                    </div>
                    <!-- FIN BLOQUE ADJUNTOS -->
                  </div>

                  <!-- ===== Autorizaciones (desde SOLPED) ===== -->
                  <div class="mb-3">
                    <div class="fw-semibold mb-2">📝 Autorizaciones (desde SOLPED)</div>

                    <div v-if="getAuthState(oc).loading" class="text-secondary small">Cargando documentos…</div>

                    <template v-else>
                      <div v-if="getAuthList(oc).length" class="auth-list">
                        <div
                          v-for="(f, idx) in getAuthList(oc)"
                          :key="f.url + '_' + idx"
                          class="card auth-item mb-2"
                        >
                          <div class="card-body py-2">
                            <div class="row g-2 align-items-start">
                              <!-- Icono -->
                              <div class="col-auto">
                                <i :class="fileIcon(f)" class="fs-4"></i>
                              </div>

                              <!-- Info -->
                              <div class="col minw-0">
                                <div class="d-flex flex-wrap align-items-center gap-2 minw-0">
                                  <span class="fw-semibold text-truncate flex-grow-1">{{ f.nombre || 'archivo' }}</span>
                                  <span class="badge bg-light text-body border">{{ prettyExt(f) }}</span>
                                  <span v-if="f.tamano" class="small text-secondary">· {{ fmtBytes(f.tamano) }}</span>
                                </div>

                                <!-- Visor inline (responsive) -->
                                <div v-if="authPreviewOpen[authKey(oc, idx)]" class="mt-2">
                                  <div v-if="isPDF(f)" class="ratio ratio-16x9 auth-ratio">
                                    <iframe :src="f.url + '#toolbar=0'"
                                            class="auth-iframe"
                                            loading="lazy"></iframe>
                                  </div>
                                  <div v-else-if="isImage(f)" class="text-center auth-img-wrap">
                                    <img :src="f.url"
                                        :alt="f.nombre || 'imagen'"
                                        class="img-fluid rounded shadow-sm auth-img"
                                        loading="lazy">
                                  </div>
                                </div>
                              </div>

                              <!-- Acciones -->
                              <div class="col-12 col-sm-auto">
                                <div class="d-grid d-sm-flex gap-2 justify-content-sm-end">
                                  <button class="btn btn-sm btn-primary" @click="openViewer(f)">
                                    <i class="bi bi-box-arrow-up-right me-1"></i> Abrir
                                  </button>
                                  <a class="btn btn-sm btn-outline-secondary" :href="f.url" target="_blank" rel="noopener">
                                    <i class="bi bi-arrow-bar-down"></i> Descargar
                                  </a>
                                  <button
                                    v-if="isPreviewable(f)"
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="toggleAuthPreview(oc, idx)"
                                  >
                                    <i class="bi" :class="authPreviewOpen[authKey(oc, idx)] ? 'bi-eye-slash' : 'bi-eye'"></i>
                                    {{ authPreviewOpen[authKey(oc, idx)] ? 'Ocultar visor' : 'Ver en visor' }}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div> <!-- .auth-item -->
                      </div>

                      <div v-else class="text-secondary small">
                        No hay documentos de autorización en la SOLPED asociada.
                      </div>
                    </template>
                  </div>
                  <!-- ===== Fin Autorizaciones ===== -->


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
                          <th class="d-none d-sm-table-cell">N° Interno</th>
                          <th class="d-none d-lg-table-cell">Código ref.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in oc.items || []" :key="it.__tempId || `${it.item}-${it.descripcion}`">
                          <td>{{ it.item }}</td>
                          <td class="break-any">{{ it.descripcion }}</td>
                          <td class="text-center">{{ it.cantidad ?? 0 }}</td>
                          <td class="text-center">{{ it.cantidad_cotizada ?? 0 }}</td>
                          <td class="text-center">
                            <span class="badge" :class="badgeItem(it.estado)">{{ it.estado || 'pendiente' }}</span>
                          </td>
                          <td class="d-none d-sm-table-cell break-any">{{ it.numero_interno || '—' }}</td>
                          <td class="d-none d-lg-table-cell break-any">{{ it.codigo_referencial || '—' }}</td>
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

                  <!-- Historial -->
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

      <!-- Toasts -->
      <div class="toast-stack">
        <div v-for="t in toasts" :key="t.id" class="toast-box" :class="`toast-${t.type}`">
          <i class="me-2" :class="t.type==='success' ? 'bi bi-check-circle-fill' : (t.type==='warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill')"></i>
          <span class="me-3">{{ t.text }}</span>
          <button class="btn-close btn-close-white ms-auto" @click="closeToast(t.id)"></button>
        </div>
      </div>
    </div>

    <!-- Offcanvas filtros (móvil / tablet) - CUSTOM -->
    <transition name="oc">
      <div v-if="showFiltersMobile" class="oc-wrap d-lg-none" id="offFiltrosCustom">
        <!-- backdrop -->
        <div class="oc-backdrop" @click="closeFiltersMobile"></div>

        <!-- panel -->
        <div
          class="oc-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros Aprobación OC"
          tabindex="0"
          @keydown.esc="closeFiltersMobile"
        >
          <div class="oc-header">
            <h2 class="h6 mb-0 fw-semibold">Filtros</h2>

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">
                Limpiar
              </button>
              <button class="btn btn-sm btn-success" @click="applyFilters(); closeFiltersMobile()">
                Aplicar
              </button>
              <button class="btn btn-sm btn-outline-dark" @click="closeFiltersMobile" aria-label="Cerrar filtros">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="oc-body">
            <!-- Empresa -->
            <div class="mb-3">
              <label class="form-label">Empresa</label>
              <select v-model="empresaFiltro" class="form-select">
                <option value="TODAS">Todas las empresas</option>
                <option value="SERVICIOS">Xtreme Servicios</option>
                <option value="MINING">Xtreme Mining</option>
                <option value="HORMIGONES">Xtreme Hormigones</option>
              </select>
            </div>

            <!-- (agrega más filtros aquí si quieres) -->
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== VISOR FULLSCREEN DE ADJUNTOS ===== -->
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
            <!-- Imagen con zoom -->
            <div v-if="isImage(viewerItem)" class="viewer-img-wrap">
              <img
                :src="viewerItem.url"
                :alt="viewerItem.nombre || 'imagen'"
                class="viewer-img"
                :style="{ transform: `scale(${zoom})` }"
                @dblclick="toggleZoom"
              />
            </div>

            <!-- PDF a todo alto -->
            <div v-else class="viewer-pdf-wrap">
              <iframe :src="viewerItem?.url" class="viewer-pdf" title="PDF"></iframe>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- ===== FIN VISOR ===== -->

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

/* Toasts */
const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2800) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

/* ===== Offcanvas custom (estado + helpers) ===== */
const showFiltersMobile = ref(false);
const toggleFiltersResponsive = () => { showFiltersMobile.value = !showFiltersMobile.value; };
const closeFiltersMobile = () => { showFiltersMobile.value = false; };
const applyFilters = () => { /* empresaFiltro es reactivo, queda por si agregas más filtros */ };
const limpiarFiltros = () => {
  empresaFiltro.value = 'TODAS';
  // aquí resetea otros filtros cuando los agregues
};

/* ===== Visor fullscreen de adjuntos ===== */
const isXs = window.matchMedia('(max-width: 576px)').matches;
const viewerOpen = ref(false);
const viewerItem = ref<{url:string,tipo?:string,nombre?:string}|null>(null);
const zoom = ref(1);
const closeOnBackdrop = true;

const isImage = (file:any) => {
  const t = String(file?.tipo || '');
  return t.includes('image') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file?.url||'')); };
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

/* ===== Autorizaciones SOLPED (nuevo: múltiples archivos en `autorizaciones[]`) ===== */
type SolpedAuthFile = { nombre?: string, url: string, tipo?: string, tamano?: number };
type SolpedAuthState = { loading: boolean, files: SolpedAuthFile[] };

const solpedAuthById = ref<Record<string, SolpedAuthState>>({});

/** Clave única para toggle de preview inline por OC+índice */
const authKey = (oc:any, idx:number) => `${oc.__docId || oc.solpedId || 'x'}_${idx}`;
const authPreviewOpen = ref<Record<string, boolean>>({});
const toggleAuthPreview = (oc:any, idx:number) => {
  const k = authKey(oc, idx);
  authPreviewOpen.value[k] = !authPreviewOpen.value[k];
};

/** Helpers de tipos de archivo */
const getExt = (f: SolpedAuthFile) => {
  const name = String(f?.nombre || f?.url || '').toLowerCase();
  const m = name.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return (m?.[1] || '').trim();
};
const prettyExt = (f: SolpedAuthFile) => {
  const ext = getExt(f);
  if (ext) return ext.toUpperCase();
  const t = String(f?.tipo || '').split('/').pop();
  return (t || 'FILE').toUpperCase();
};
const isPDF = (f: SolpedAuthFile) => {
  const ext = getExt(f);
  if (ext === 'pdf') return true;
  const t = String(f?.tipo || '').toLowerCase();
  return t.includes('application/pdf');
};
const isPreviewable = (f: SolpedAuthFile) => isPDF(f) || isImage(f);
const fileIcon = (f: SolpedAuthFile) => {
  const ext = getExt(f);
  if (isPDF(f)) return 'bi bi-file-earmark-pdf text-danger';
  if (isImage(f)) return 'bi bi-file-earmark-image text-primary';
  if (['xls','xlsx','csv'].includes(ext)) return 'bi bi-file-earmark-spreadsheet text-success';
  if (['zip','rar','7z'].includes(ext)) return 'bi bi-file-earmark-zip';
  if (['doc','docx'].includes(ext)) return 'bi bi-file-earmark-word text-primary';
  if (['ppt','pptx'].includes(ext)) return 'bi bi-file-earmark-ppt text-warning';
  return 'bi bi-file-earmark';
};
const fmtBytes = (bytes?: number) => {
  const b = Number(bytes || 0);
  if (!b) return '—';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const v = (b / Math.pow(1024, i)).toFixed(i ? 1 : 0);
  return `${v} ${u[i]}`;
};

/** Devuelve el estado (loading + files[]) para una OC */
const getAuthState = (oc:any): SolpedAuthState => {
  const sid = String(oc?.solpedId || '');
  return solpedAuthById.value[sid] || { loading: false, files: [] };
};
/** Lista de archivos de autorización para una OC */
const getAuthList = (oc:any): SolpedAuthFile[] => getAuthState(oc).files || [];

/** Carga perezosa: trae la SOLPED y llena `files`:
 *  - Preferencia: `autorizaciones` (array de {nombre,url,tipo,tamano})
 *  - Fallback: `autorizacion_url` / `autorizacion_nombre`
 */
const ensureSolpedAuthLoaded = async (oc:any) => {
  const sid = String(oc?.solpedId || '');
  if (!sid) return;

  // Si ya cargamos y no está en loading, no repetir
  const cached = solpedAuthById.value[sid];
  if (cached && !cached.loading) return;

  solpedAuthById.value[sid] = { loading: true, files: [] };
  try {
    const sref = doc(db, 'solpes', sid);
    const snap = await getDoc(sref);

    let files: SolpedAuthFile[] = [];
    if (snap.exists()) {
      const d:any = snap.data() || {};

      // 1) Nuevo esquema: array `autorizaciones`
      if (Array.isArray(d.autorizaciones) && d.autorizaciones.length) {
        files = d.autorizaciones
          .filter((x:any) => x?.url)
          .map((x:any) => ({
            nombre: x?.nombre || '',
            url: String(x?.url),
            tipo: x?.tipo || '',
            tamano: Number(x?.tamano || 0)
          }));
      }

      // 2) Fallback antiguo: autorizacion_url / autorizacion_nombre
      if (!files.length && d.autorizacion_url) {
        files = [{
          nombre: d.autorizacion_nombre || 'Autorización',
          url: String(d.autorizacion_url),
          tipo: 'application/pdf', // supuesto seguro (se corrige al abrir)
          tamano: undefined
        }];
      }
    }

    solpedAuthById.value[sid] = { loading: false, files };
  } catch (e) {
    console.error('Error cargando autorizaciones de SOLPED:', e);
    solpedAuthById.value[sid] = { loading: false, files: [] };
  }
};

/* Empresa */
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

/* Rol/estatus */
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

/* Badges / util */
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

/* Derivados */
const ocsFiltradas = computed(() => {
  if (empresaFiltro.value === 'TODAS') return ocs.value;
  return ocs.value.filter(oc => normalizeCompany(oc.empresa) === empresaFiltro.value);
});

/* Suscripción */
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

/* Acciones */
const accionando = ref(false);
const irASolped = (oc:any) => {
  const id = oc?.solpedId;
  if (!id) { addToast('warning','Esta OC no tiene SOLPED asociada.'); return; }
  try { router.push({ name: 'SolpedDetalle', params: { id } }); }
  catch { router.push(`/solped/${id}`); }
};

const registrarHistorialSolpedAccionOC = async ({ solpedId, ocNumero, usuario, estatusOC, comentario }:{
  solpedId: string, ocNumero?: number|string|null, usuario: string, estatusOC: string, comentario: string
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
  } catch (e) { console.warn('No se pudo registrar acción de OC en historialEstados de la SOLPED:', e); }
};

const actualizarSolpedConOC = async (oc:any, aprobador:string, comentario:string, estatusOC?: string) => {
  const solpedId = oc?.solpedId; if (!solpedId) return;
  const sref = doc(db, 'solpes', String(solpedId));
  const ss = await getDoc(sref); if (!ss.exists()) return;

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
  if (!comentario) { addToast('warning', 'Escribe un comentario antes de solicitar aclaración.'); return; }

  if (rolActual.value === 'GUILLERMO' && oc.estatus !== 'Revisión Guillermo') { addToast('warning','No puedes solicitar aclaración en este estado.'); return; }
  if (rolActual.value === 'JUAN' && oc.estatus !== 'Preaprobado') { addToast('warning','No puedes solicitar aclaración en este estado.'); return; }
  if (rolActual.value === 'ALEJANDRO' && oc.estatus !== 'Casi Aprobado') { addToast('warning','No puedes solicitar aclaración en este estado.'); return; }

  accionando.value = true;
  try {
    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Pendiente de Aprobación', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Pendiente de Aprobación',
      historial: nuevoHistorial
    });

    await registrarHistorialSolpedAccionOC({
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

    const nuevosItems = (oc.items || []).map((it:any) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'aprobado' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: nuevoEstatus, fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: nuevoEstatus,
      historial: nuevoHistorial,
      items: nuevosItems,
      aprobadoPor: usuarioNombre.value || ''
    });

    if (nuevoEstatus === 'Aprobado') {
      await actualizarSolpedConOC({ ...oc, items: nuevosItems }, usuarioNombre.value || '—', comentario, nuevoEstatus);
      await cerrarSolpedSiCompleta(oc.solpedId);
    } else {
      await registrarHistorialSolpedAccionOC({
        solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
        estatusOC: nuevoEstatus, comentario
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
    const nuevosItems = (oc.items || []).map((it:any) =>
      (String(it.estado||'').toLowerCase().includes('revi')) ? { ...it, estado: 'pendiente' } : it
    );

    const nuevoHistorial = [
      ...((oc.historial || [])),
      { usuario: usuarioNombre.value || '—', estatus: 'Rechazado', fecha: new Date().toISOString(), comentario }
    ];

    await updateDoc(doc(db, 'ordenes_oc', oc.__docId), {
      estatus: 'Rechazado',
      historial: nuevoHistorial,
      items: nuevosItems
    });

    await registrarHistorialSolpedAccionOC({
      solpedId: oc.solpedId, ocNumero: oc.id, usuario: usuarioNombre.value || '—',
      estatusOC: 'Rechazado', comentario
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
.aprob-oc-page{ min-height:100vh; }

/* Animación detalle */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Toasts */
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

/* Chips resumen */
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
.oc-pill i{ font-size: 1rem; opacity: .9; }

/* Utilidades de corte y wrap */
.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.minw-0{ min-width: 0; }
.maxw-180{ max-width: 180px; }
.maxw-140{ max-width: 140px; }

/* Responsive tweaks */
@media (max-width: 576px){
  .oc-highlight{ padding: .55rem .6rem; }
  .oc-pill{ font-size: .86rem; }
  .list-group-item .btn{ width: 100%; } /* acciones full-width */
}
@media (min-width: 768px) and (max-width: 991.98px){
  .maxw-180{ max-width: 240px; }
  .maxw-140{ max-width: 180px; }
}

/* ===== Offcanvas móvil CUSTOM ===== */
.oc-enter-active, .oc-leave-active { transition: opacity .2s ease; }
.oc-enter-from, .oc-leave-to { opacity: 0; }

.oc-wrap{
  position: fixed; inset: 0;
  z-index: 2050; /* por encima de header y toasts */
}

.oc-backdrop{
  position: absolute; inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(1px);
}
/* ===== Autorizaciones responsive ===== */
.auth-list { width: 100%; }
.auth-item .card-body { padding: .75rem .8rem; }
.minw-0 { min-width: 0; }             /* permite truncado correcto */
.auth-ratio { border-radius: .5rem; overflow: hidden; background: var(--bs-tertiary-bg, #0b0f14); }
.auth-iframe { width: 100%; height: 100%; border: 0; }
.auth-img-wrap { max-height: 420px; overflow: auto; }
.auth-img { max-height: 100%; object-fit: contain; }
.auth-item .badge { font-weight: 500; }

/* Botones apilados en móvil */
@media (max-width: 576px){
  .auth-img-wrap { max-height: 300px; }
  .auth-item .d-sm-flex > .btn { width: 100%; }
}

/* Tablet: visor un poco más bajo para no romper layout */
@media (min-width: 577px) and (max-width: 991.98px){
  .auth-img-wrap { max-height: 360px; }
}

.oc-panel{
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(92vw, 420px);
  background: var(--bs-body-bg, #fff);
  box-shadow: -8px 0 24px rgba(0,0,0,.2);
  display: flex; flex-direction: column;
  transform: translateX(0);
  animation: ocSlideIn .22s ease-out;
}
@keyframes ocSlideIn {
  from { transform: translateX(100%); opacity: .6; }
  to   { transform: translateX(0);     opacity: 1; }
}

.oc-header{
  padding: .9rem .9rem;
  border-bottom: 1px solid var(--bs-border-color, #e5e7eb);
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; background: var(--bs-body-bg, #fff); z-index: 1;
}

.oc-body{ padding: .9rem; overflow: auto; }

/* ===== Visor Fullscreen (modal/lightbox) ===== */
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

/* Imagen */
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

/* PDF */
.viewer-pdf-wrap{ width: 100%; height: 100%; }
.viewer-pdf{ width: 100%; height: 100%; border: none; }

/* Móvil: panel fullscreen */
@media (max-width: 576px){
  .viewer-panel{
    width: 100vw; height: 100vh; border-radius: 0;
  }
  .viewer-title{ max-width: 50vw; }
}

/* cursor utilitario */
:root { --cur-ptr: pointer; }

/* Icono autorización */
.bi-file-earmark-check { font-size: 1.1rem; opacity: .9; }
</style>
