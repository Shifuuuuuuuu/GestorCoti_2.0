<!-- src/views/SoporteGestion.vue -->
<template>
  <div class="soporte-gestion-page">
    <div class="container py-4 py-md-5">
      <!-- HEADER -->
      <section class="hero-support mb-4">
        <div class="hero-support__content">
          <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap">
            <div>
              <div class="eyebrow mb-2">
                <i class="bi bi-tools me-2"></i>
                Panel interno
              </div>
              <h1 class="hero-title mb-2">Gestión de Soporte</h1>
              <p class="hero-subtitle mb-0">
                Administra tickets, asigna casos, responde solicitudes y revisa adjuntos enviados por los usuarios.
              </p>
            </div>

            <button class="btn btn-outline-secondary btn-sm" @click="volver">
              <i class="bi bi-arrow-left me-1"></i> Volver
            </button>
          </div>

          <div v-if="canManage" class="hero-stats mt-4">
            <div class="stat-card">
              <div class="stat-icon stat-icon-neutral">
                <i class="bi bi-ticket-detailed"></i>
              </div>
              <div>
                <div class="stat-value">{{ tickets.length }}</div>
                <div class="stat-label">Tickets totales</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-warning">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div>
                <div class="stat-value">{{ pendientesCount }}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-info">
                <i class="bi bi-search"></i>
              </div>
              <div>
                <div class="stat-value">{{ revisionCount }}</div>
                <div class="stat-label">En revisión</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-success">
                <i class="bi bi-check2-circle"></i>
              </div>
              <div>
                <div class="stat-value">{{ resueltosCount }}</div>
                <div class="stat-label">Resueltos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ALERTA SIN PERMISOS -->
      <div
        v-if="!canManage"
        class="alert alert-warning d-flex justify-content-between align-items-start gap-3 rounded-4 shadow-sm border-0"
      >
        <div>
          No tienes permisos para ver esta página.
          <div class="small mt-1 text-secondary">
            (debug) rol leído: <code>{{ myRole || '—' }}</code> · uid: <code>{{ my.uid || '—' }}</code>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="reloadRole">Reintentar rol</button>
      </div>

      <template v-else>
        <!-- FILTROS -->
        <div class="panel-card mb-3">
          <div class="panel-card__body">
            <div class="row g-2 align-items-center">
              <div class="col-12 col-sm-4 col-md-3">
                <label class="form-label small fw-semibold mb-1">Estado</label>
                <select class="form-select form-control-pro" v-model="filtroEstado">
                  <option value="">Todos</option>
                  <option v-for="e in estados" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>

              <div class="col-12 col-sm-8 col-md-4">
                <label class="form-label small fw-semibold mb-1">Buscar</label>
                <div class="input-icon-wrap">
                  <i class="bi bi-search input-icon"></i>
                  <input
                    class="form-control form-control-pro"
                    placeholder="Buscar por asunto, usuario, número, SOLPED, cotización…"
                    v-model="q"
                  />
                </div>
              </div>

              <div class="col-6 col-sm-4 col-md-2 d-grid">
                <label class="form-label small fw-semibold mb-1 invisible">Limpiar</label>
                <button class="btn btn-outline-secondary" @click="limpiarFiltros">Limpiar</button>
              </div>

              <div class="col-12">
                <div class="small text-secondary mt-1">
                  {{ ticketsFiltrados.length }} ticket(s) encontrado(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABLA DESKTOP -->
        <div class="panel-card d-none d-sm-block">
          <div class="table-responsive">
            <table class="table align-middle mb-0 soporte-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estado</th>
                  <th>Asunto</th>
                  <th>Tipo</th>
                  <th>Referencia</th>
                  <th>Usuario</th>
                  <th>Asignado</th>
                  <th>Creado</th>
                  <th>Adjuntos</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!ticketsFiltrados.length">
                  <td colspan="10" class="text-center py-4 text-secondary">
                    No hay tickets con los filtros actuales.
                  </td>
                </tr>

                <tr v-for="t in ticketsFiltrados" :key="t.id">
                  <td class="fw-semibold">{{ t.numero || '—' }}</td>
                  <td>
                    <span class="badge badge-status" :class="badgeClass(t.estatus)">
                      {{ t.estatus }}
                    </span>
                  </td>
                  <td class="mw-220 text-truncate" :title="t.asunto">
                    {{ t.asunto || '—' }}
                  </td>
                  <td>{{ t.tipo || '—' }}</td>
                  <td class="small">
                    {{ t.referenciaProblema || '—' }}
                  </td>
                  <td>
                    <div class="small fw-semibold">{{ t.nombre_usuario || '—' }}</div>
                    <div class="text-secondary small text-truncate mw-180" :title="t.email_usuario">
                      {{ t.email_usuario || '—' }}
                    </div>
                  </td>
                  <td>{{ t.asignado_a_nombre || '—' }}</td>
                  <td class="small">{{ formatDateTime(t.created_at) }}</td>
                  <td class="small">{{ getAdjuntosTicket(t).length }}</td>
                  <td class="text-end">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="openCanvas(t)">
                        Ver / Responder
                      </button>
                      <button
                        class="btn btn-outline-secondary"
                        @click="tomar(t)"
                        :disabled="takingId===t.id"
                      >
                        <span v-if="takingId===t.id" class="spinner-border spinner-border-sm me-1"></span>
                        Tomar
                      </button>
                      <button class="btn btn-outline-success" @click="marcarResuelto(t)">
                        Resolver
                      </button>
                      <button class="btn btn-outline-danger" @click="eliminar(t)">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- CARDS MOBILE -->
        <div class="d-sm-none">
          <div v-for="t in ticketsFiltrados" :key="t.id" class="ticket-card-mobile">
            <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
              <span class="badge badge-status" :class="badgeClass(t.estatus)">{{ t.estatus }}</span>
              <div class="small text-secondary text-end">
                {{ formatDateTime(t.created_at) }}
              </div>
            </div>

            <div class="fw-semibold text-truncate mb-1" :title="t.asunto">
              {{ t.asunto || 'Sin asunto' }}
            </div>

            <div class="small text-secondary mb-1">
              #{{ t.numero || '—' }} · {{ t.tipo || '—' }}
            </div>

            <div v-if="t.referenciaProblema" class="small mb-1">
              <strong>Referencia:</strong> {{ t.referenciaProblema }}
            </div>

            <div class="small mb-1">
              <i class="bi bi-person me-1"></i>{{ t.nombre_usuario || '—' }}
            </div>

            <div class="small text-secondary text-truncate mb-1" :title="t.email_usuario">
              {{ t.email_usuario || '—' }}
            </div>

            <div class="small mb-2">
              <i class="bi bi-briefcase me-1"></i>Asignado:
              <strong>{{ t.asignado_a_nombre || '—' }}</strong>
            </div>

            <div class="small text-secondary mb-3">
              Adjuntos: {{ getAdjuntosTicket(t).length }}
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-sm btn-primary" @click="openCanvas(t)">Ver / Responder</button>
              <button class="btn btn-sm btn-outline-secondary" @click="tomar(t)" :disabled="takingId===t.id">
                <span v-if="takingId===t.id" class="spinner-border spinner-border-sm me-1"></span>
                Tomar
              </button>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-success flex-fill" @click="marcarResuelto(t)">Resolver</button>
                <button class="btn btn-sm btn-outline-danger flex-fill" @click="eliminar(t)">Eliminar</button>
              </div>
            </div>
          </div>

          <div v-if="!ticketsFiltrados.length" class="empty-mobile text-center text-secondary">
            No hay tickets con los filtros actuales.
          </div>
        </div>

        <!-- OFFCANVAS -->
        <div class="offcanvas offcanvas-end offcanvas-mobile-full soporte-offcanvas" tabindex="-1" ref="offRef">
          <div class="offcanvas-header border-bottom">
            <div>
              <h5 class="offcanvas-title mb-0">Ticket #{{ sel?.numero || '—' }}</h5>
              <div v-if="sel" class="small text-secondary mt-1">
                {{ sel.tipo || '—' }} · {{ formatDateTime(sel.created_at) }}
              </div>
            </div>
            <button type="button" class="btn-close" @click="closeCanvas"></button>
          </div>

          <div class="offcanvas-body">
            <div v-if="!sel" class="text-secondary small">Sin selección.</div>

            <template v-else>
              <div class="detail-hero mb-3">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div class="min-w-0">
                    <div class="detail-title text-truncate">{{ sel.asunto || 'Sin asunto' }}</div>
                    <div class="small text-secondary mt-1">
                      Estado:
                      <span class="badge badge-status ms-1" :class="badgeClass(sel.estatus)">
                        {{ sel.estatus }}
                      </span>
                    </div>
                  </div>

                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-outline-secondary" @click="cambiarEstado(sel,'Pendiente')">
                      Pendiente
                    </button>
                    <button class="btn btn-sm btn-outline-info" @click="cambiarEstado(sel,'En revisión')">
                      En revisión
                    </button>
                    <button class="btn btn-sm btn-outline-success" @click="cambiarEstado(sel,'Resuelto')">
                      Resuelto
                    </button>
                  </div>
                </div>
              </div>

              <div class="detail-grid">
                <div class="detail-card">
                  <div class="detail-card__label">Usuario</div>
                  <div class="detail-card__value">{{ sel.nombre_usuario || '—' }}</div>
                  <div class="small text-secondary">{{ sel.email_usuario || '—' }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card__label">Asignado a</div>
                  <div class="detail-card__value">{{ sel.asignado_a_nombre || '—' }}</div>
                  <div class="d-flex flex-wrap gap-2 mt-2">
                    <button class="btn btn-sm btn-outline-primary" @click="tomar(sel)">
                      Tomar
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="liberar(sel)" :disabled="!sel.asignado_a_uid">
                      Liberar
                    </button>
                  </div>
                </div>

                <div class="detail-card">
                  <div class="detail-card__label">Tipo</div>
                  <div class="detail-card__value">{{ sel.tipo || '—' }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card__label">Referencia</div>
                  <div class="detail-card__value">{{ sel.referenciaProblema || '—' }}</div>
                </div>
              </div>

              <div class="detail-section mt-3">
                <div class="detail-section__title">Descripción</div>
                <div class="prewrap">{{ sel.descripcion }}</div>
              </div>

              <!-- ADJUNTOS -->
              <div class="detail-section mt-3">
                <div class="detail-section__title">Adjuntos</div>

                <div v-if="!getAdjuntosTicket(sel).length && sel.imagen_url" class="attachments-grid">
                  <div class="attachment-card">
                    <div class="attachment-preview" @click="openImg(sel.imagen_url, 'Adjunto')">
                      <img :src="sel.imagen_url" class="thumb" />
                    </div>
                    <div class="d-flex gap-2 mt-2">
                      <button class="btn btn-sm btn-outline-primary flex-fill" @click="openImg(sel.imagen_url, 'Adjunto')">
                        Ver imagen
                      </button>
                      <a class="btn btn-sm btn-outline-secondary flex-fill" :href="sel.imagen_url" target="_blank">
                        Descargar
                      </a>
                    </div>
                  </div>
                </div>

                <div v-else-if="getAdjuntosTicket(sel).length" class="attachments-grid">
                  <div
                    v-for="(a, idx) in getAdjuntosTicket(sel)"
                    :key="`${a.url}-${idx}`"
                    class="attachment-card"
                  >
                    <template v-if="a.tipo !== 'pdf'">
                      <div class="attachment-preview" @click="openImg(a.url, a.nombre || 'Imagen')">
                        <img :src="a.url" class="thumb" />
                      </div>
                      <div class="attachment-name text-truncate mt-2">
                        {{ a.nombre || `Imagen ${idx + 1}` }}
                      </div>
                      <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-outline-primary flex-fill" @click="openImg(a.url, a.nombre || 'Imagen')">
                          Ver
                        </button>
                        <a class="btn btn-sm btn-outline-secondary flex-fill" :href="a.url" target="_blank">
                          Descargar
                        </a>
                      </div>
                    </template>

                    <template v-else>
                      <div class="pdf-box">
                        <div class="pdf-box__icon">
                          <i class="bi bi-file-earmark-pdf"></i>
                        </div>
                        <div class="attachment-name text-truncate">
                          {{ a.nombre || `PDF ${idx + 1}` }}
                        </div>
                      </div>
                      <div class="d-flex gap-2 mt-2">
                        <a class="btn btn-sm btn-outline-primary flex-fill" :href="a.url" target="_blank">
                          Abrir PDF
                        </a>
                        <a class="btn btn-sm btn-outline-secondary flex-fill" :href="a.url" target="_blank">
                          Descargar
                        </a>
                      </div>
                    </template>
                  </div>
                </div>

                <div v-else class="text-secondary small">
                  Este ticket no tiene adjuntos.
                </div>
              </div>

              <!-- RESPUESTAS -->
              <div class="detail-section mt-4">
                <div class="detail-section__title">Respuestas</div>

                <div v-if="!sel.respuestas?.length" class="text-secondary small mb-3">
                  Aún no hay respuestas.
                </div>

                <div v-else class="responses-list mb-3">
                  <div v-for="(r, idx) in sel.respuestas" :key="idx" class="response-item">
                    <div class="response-item__top">
                      <div class="response-user">
                        <span class="response-avatar">
                          {{ (r.usuario || 'S').charAt(0).toUpperCase() }}
                        </span>
                        <strong>{{ r.usuario || 'Soporte' }}</strong>
                      </div>
                      <small class="text-secondary">{{ formatDateTime(r.fecha) }}</small>
                    </div>
                    <div class="response-text prewrap">{{ r.texto }}</div>
                  </div>
                </div>

                <div class="reply-box">
                  <label class="form-label fw-semibold mb-2">Responder ticket</label>
                  <div class="input-group">
                    <input
                      class="form-control"
                      v-model="respuesta"
                      placeholder="Escribe una respuesta…"
                      @keyup.enter="enviarRespuesta"
                    />
                    <button class="btn btn-primary" :disabled="!respuesta.trim()" @click="enviarRespuesta">
                      Responder
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>

    <!-- VISOR DE IMAGEN -->
    <transition name="viewer">
      <div v-if="viewerOpen" class="viewer-wrap" @keydown.esc="closeViewer" tabindex="0">
        <div class="viewer-backdrop" @click="closeViewer"></div>

        <div class="viewer-panel" role="dialog" aria-modal="true" aria-label="Visor de imagen">
          <div class="viewer-header">
            <div class="viewer-title text-truncate">
              {{ viewerName || 'Imagen' }}
            </div>

            <div class="d-flex gap-2 align-items-center">
              <a
                v-if="viewerUrl"
                :href="viewerUrl"
                target="_blank"
                rel="noopener"
                class="btn btn-sm btn-outline-light"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>

              <button class="btn btn-sm btn-light" @click="closeViewer" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="viewer-body">
            <div class="viewer-img-wrap">
              <img :src="viewerUrl" :alt="viewerName || 'imagen'" class="viewer-img" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authService";
import { db } from "../stores/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  getDoc
} from "firebase/firestore";

export default {
  name: "SoporteGestion",
  setup() {
    const router = useRouter();
    const volver = () => router.back();

    const auth = useAuthStore();
    const my = ref({
      uid: auth?.user?.uid || "",
      nombre: auth?.user?.displayName || auth?.user?.email || "Soporte"
    });

    const myRole = ref(
      (auth?.user?.role || auth?.user?.rol || "").toString().trim().toLowerCase()
    );

    const allowedRoles = new Set(["admin", "soporte", "aprobador/editor"]);
    const canManage = computed(() => allowedRoles.has((myRole.value || "").toLowerCase()));

    const reloadRole = async () => {
      try {
        const uid = my.value.uid;
        if (!uid) return;
        const usnap = await getDoc(doc(db, "Usuarios", uid));
        if (usnap.exists()) {
          const u = usnap.data() || {};
          const found = (u.role || u.rol || "").toString().trim().toLowerCase();
          if (found) myRole.value = found;
        }
      } catch (e) {
        console.warn("No se pudo cargar el rol desde Firestore:", e);
      }
    };

    const estados = ["Pendiente", "En revisión", "Resuelto"];
    const filtroEstado = ref("");
    const incluirRevisionSiempre = ref(false);
    const q = ref("");

    const tickets = ref([]);
    const takingId = ref(null);

    const pendientesCount = computed(() =>
      tickets.value.filter(t => t.estatus === "Pendiente").length
    );
    const revisionCount = computed(() =>
      tickets.value.filter(t => t.estatus === "En revisión").length
    );
    const resueltosCount = computed(() =>
      tickets.value.filter(t => t.estatus === "Resuelto").length
    );

    const formatDateTime = (d) => {
      if (!d) return "";
      const dd = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d));
      if (isNaN(dd)) return "";
      return dd.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
    };

    const badgeClass = (st) => ({
      "badge-pending": st === "Pendiente",
      "badge-review": st === "En revisión",
      "badge-done": st === "Resuelto"
    });

    const limpiarFiltros = () => {
      filtroEstado.value = "";
      incluirRevisionSiempre.value = false;
      q.value = "";
    };

    const getAdjuntosTicket = (ticket) => {
      if (Array.isArray(ticket?.adjuntos) && ticket.adjuntos.length) return ticket.adjuntos;
      return [];
    };

    const ticketsFiltrados = computed(() => {
      const txt = q.value.trim().toUpperCase();
      return tickets.value.filter((t) => {
        if (filtroEstado.value) {
          const esMismo = t.estatus === filtroEstado.value;
          const esRevision = incluirRevisionSiempre.value && t.estatus === "En revisión";
          if (!esMismo && !esRevision) return false;
        }

        if (!txt) return true;

        const hay = [
          t.numero,
          t.asunto,
          t.descripcion,
          t.nombre_usuario,
          t.email_usuario,
          t.asignado_a_nombre,
          t.tipo,
          t.referenciaProblema
        ]
          .join(" | ")
          .toUpperCase();

        return hay.includes(txt);
      });
    });

    const offRef = ref(null);
    const sel = ref(null);
    const respuesta = ref("");

    const viewerOpen = ref(false);
    const viewerUrl = ref("");
    const viewerName = ref("");

    const openImg = (url, name = "Adjunto") => {
      viewerUrl.value = url || "";
      viewerName.value = name || "Adjunto";
      viewerOpen.value = !!viewerUrl.value;
      setTimeout(() => {
        document.querySelector(".viewer-wrap")?.focus();
      }, 0);
    };

    const closeViewer = () => {
      viewerOpen.value = false;
      viewerUrl.value = "";
      viewerName.value = "";
    };

    watch(viewerOpen, (v) => {
      document.documentElement.style.overflow = v ? "hidden" : "";
    });

    const openCanvas = (t) => {
      sel.value = t;
      const offcanvas = window.bootstrap?.Offcanvas
        ? new window.bootstrap.Offcanvas(offRef.value)
        : null;
      offcanvas?.show();
    };

    const closeCanvas = () => {
      const inst = window.bootstrap?.Offcanvas?.getInstance(offRef.value);
      inst?.hide();
      sel.value = null;
      respuesta.value = "";
    };

    const tomar = async (t) => {
      if (!canManage.value) return;
      takingId.value = t.id;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          asignado_a_uid: my.value.uid || null,
          asignado_a_nombre: my.value.nombre || "Soporte",
          estatus: "En revisión",
          updated_at: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      } finally {
        takingId.value = null;
      }
    };

    const liberar = async (t) => {
      if (!canManage.value) return;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          asignado_a_uid: null,
          asignado_a_nombre: null,
          estatus: "Pendiente",
          updated_at: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      }
    };

    const cambiarEstado = async (t, nuevo) => {
      if (!canManage.value) return;
      try {
        await updateDoc(doc(db, "soportes", t.id), {
          estatus: nuevo,
          updated_at: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      }
    };

    const marcarResuelto = (t) => cambiarEstado(t, "Resuelto");

    const enviarRespuesta = async () => {
      if (!sel.value || !respuesta.value.trim()) return;
      try {
        const current = sel.value.respuestas || [];
        const nueva = {
          uid: my.value.uid || null,
          usuario: my.value.nombre || "Soporte",
          texto: respuesta.value.trim(),
          fecha: new Date()
        };
        const updated = [...current, nueva];

        await updateDoc(doc(db, "soportes", sel.value.id), {
          respuestas: updated,
          updated_at: serverTimestamp()
        });

        respuesta.value = "";
      } catch (e) {
        console.error(e);
      }
    };

    const eliminar = async (t) => {
      if (!canManage.value) return;
      if (!confirm(`¿Eliminar ticket #${t.numero || '—'}? Esta acción no se puede deshacer.`)) return;
      try {
        await deleteDoc(doc(db, "soportes", t.id));
      } catch (e) {
        console.error(e);
      }
    };

    onMounted(async () => {
      await reloadRole();

      const qy = query(collection(db, "soportes"), orderBy("created_at", "desc"));
      onSnapshot(
        qy,
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          tickets.value = arr;

          if (sel.value) {
            const nv = arr.find((x) => x.id === sel.value.id);
            if (nv) sel.value = nv;
          }
        },
        (err) => console.error(err)
      );
    });

    return {
      volver,
      my,
      myRole,
      reloadRole,
      canManage,
      estados,
      filtroEstado,
      incluirRevisionSiempre,
      q,
      limpiarFiltros,
      tickets,
      ticketsFiltrados,
      pendientesCount,
      revisionCount,
      resueltosCount,
      formatDateTime,
      badgeClass,
      openCanvas,
      closeCanvas,
      offRef,
      sel,
      respuesta,
      enviarRespuesta,
      tomar,
      liberar,
      cambiarEstado,
      marcarResuelto,
      eliminar,
      takingId,
      openImg,
      closeViewer,
      viewerOpen,
      viewerUrl,
      viewerName,
      getAdjuntosTicket
    };
  }
};
</script>

<style scoped>
.soporte-gestion-page {
  min-height: 100vh;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.hero-support {
  border-radius: 22px;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.05);
}

.hero-support__content {
  padding: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: var(--bs-secondary-bg);
  color: var(--bs-secondary-color, var(--bs-body-color));
  border: 1px solid var(--bs-border-color);
}

.hero-title {
  font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--bs-body-color);
}

.hero-subtitle {
  max-width: 760px;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 18px;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.stat-icon-neutral {
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
}

.stat-icon-warning {
  background: rgba(255, 193, 7, 0.12);
  color: #c28700;
}

.stat-icon-info {
  background: rgba(108, 117, 125, 0.14);
  color: var(--bs-body-color);
}

.stat-icon-success {
  background: rgba(25, 135, 84, 0.14);
  color: #198754;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  color: var(--bs-body-color);
}

.stat-label {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.panel-card {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 22px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.04);
}

.panel-card__body {
  padding: 1.2rem 1.25rem;
}

.form-control-pro {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--bs-border-color);
  box-shadow: none;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.form-control-pro:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 0.22rem rgba(220, 38, 38, 0.08);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.input-icon-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bs-secondary-color, #6c757d);
  z-index: 2;
}

.input-icon-wrap .form-control {
  padding-left: 2.4rem;
}

.soporte-table th {
  white-space: nowrap;
  font-size: 0.84rem;
  color: var(--bs-secondary-color, #6c757d);
  font-weight: 800;
  border-bottom: 1px solid var(--bs-border-color);
  background: transparent;
}

.soporte-table td {
  vertical-align: middle;
  background: transparent;
  color: var(--bs-body-color);
  border-color: var(--bs-border-color);
}

.badge-status {
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  font-weight: 800;
  font-size: 0.75rem;
}

.badge-pending {
  background: var(--bs-secondary-bg);
  color: var(--bs-body-color);
}

.badge-review {
  background: rgba(108, 117, 125, 0.15);
  color: var(--bs-body-color);
}

.badge-done {
  background: rgba(25, 135, 84, 0.14);
  color: #198754;
}

.mw-220 {
  max-width: 220px;
}

.mw-180 {
  max-width: 180px;
}

.ticket-card-mobile {
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 0.9rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  background: var(--bs-body-bg);
}

.empty-mobile {
  padding: 2rem 1rem;
  background: var(--bs-body-bg);
  border: 1px dashed var(--bs-border-color);
  border-radius: 16px;
}

.offcanvas-mobile-full {
  width: 560px;
}

@media (max-width: 576px) {
  .offcanvas-mobile-full {
    width: 100% !important;
  }
}

.soporte-offcanvas,
.soporte-offcanvas .offcanvas-header,
.soporte-offcanvas .offcanvas-body {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
}

.detail-hero {
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.detail-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--bs-body-color);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.detail-card {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.detail-card__label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #dc2626;
}

.detail-card__value {
  margin-top: 0.35rem;
  color: var(--bs-body-color);
  font-weight: 700;
}

.detail-section {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 18px;
  padding: 1rem;
}

.detail-section__title {
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #dc2626;
  margin-bottom: 0.75rem;
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.attachment-card {
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 0.85rem;
  background: var(--bs-tertiary-bg);
}

.attachment-preview {
  cursor: pointer;
}

.thumb {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--bs-border-color);
  display: block;
}

.attachment-name {
  font-weight: 700;
  color: var(--bs-body-color);
}

.pdf-box {
  min-height: 180px;
  border: 1px dashed var(--bs-border-color);
  border-radius: 12px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 1rem;
  background: var(--bs-body-bg);
}

.pdf-box__icon {
  font-size: 2rem;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.response-item {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 0.9rem 1rem;
}

.response-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.response-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.response-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #ef4444;
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.response-text {
  margin-top: 0.55rem;
  color: var(--bs-body-color);
  line-height: 1.6;
}

.reply-box {
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 16px;
  padding: 1rem;
}

.reply-box .form-control {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border-color: var(--bs-border-color);
}

.reply-box .form-control:focus {
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border-color: #dc2626;
  box-shadow: 0 0 0 0.22rem rgba(220, 38, 38, 0.08);
}

.prewrap {
  white-space: pre-wrap;
  word-break: break-word;
}

.min-w-0 {
  min-width: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 0.18s ease;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

.viewer-wrap {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.viewer-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(96vw, 1200px);
  height: min(92vh, 900px);
  background: #111827;
  color: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.viewer-title {
  font-weight: 700;
  max-width: 60vw;
}

.viewer-body {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
}

.viewer-img-wrap {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: auto;
}

.viewer-img {
  max-width: 100%;
  max-height: 100%;
}

@media (max-width: 991.98px) {
  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attachments-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767.98px) {
  .hero-support__content {
    padding: 1.1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .viewer-panel {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .viewer-title {
    max-width: 45vw;
  }
}
</style>
