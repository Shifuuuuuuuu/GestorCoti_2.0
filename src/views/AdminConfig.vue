<!-- src/views/AdminConfig.vue -->
<template>
  <div class="min-vh-100 bg-body">
    <div class="container py-4 py-md-5">

      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>

        <div class="text-center text-md-start flex-grow-1">
          <h1 class="h4 fw-semibold mb-0">AdminConfig</h1>
          <div class="small text-body-secondary">Panel de configuración (solo Admin)</div>
        </div>

        <span class="badge bg-dark-subtle text-dark-emphasis">
          {{ auth?.user?.displayName || auth?.user?.email || '—' }}
        </span>
      </div>

      <div v-if="!isAdmin && !cargando" class="alert alert-danger">
        No tienes permisos para acceder a esta sección.
      </div>

      <div v-else class="row g-3">

        <!-- Left: selector de usuarios -->
        <div class="col-12 col-lg-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-body fw-semibold d-flex align-items-center justify-content-between">
              <span>
                Usuarios
                <span class="text-body-secondary fw-normal">
                  ({{ tab === 'cotizadores' ? 'Editores' : 'Aprobadores/Editor' }})
                </span>
              </span>

              <span class="badge bg-primary-subtle text-primary-emphasis">
                {{ usuariosPanel.length }}
              </span>
            </div>

            <div class="card-body">
              <input class="form-control" v-model="usersFilter" placeholder="Buscar por nombre o email…" />

              <div class="small text-body-secondary mt-2">
                Mostrando: {{ usuariosFiltrados.length }} / {{ usuariosPanel.length }}
              </div>

              <div class="list-group mt-2 users-list">
                <button
                  v-for="u in usuariosFiltrados"
                  :key="u.uid"
                  class="list-group-item list-group-item-action"
                  @click="selectUser(u)"
                >
                  <div class="d-flex align-items-start justify-content-between gap-2">
                    <div class="minw-0">
                      <div class="fw-semibold text-truncate">{{ u.fullName || '—' }}</div>
                      <div class="small text-body-secondary text-truncate">{{ u.email || '—' }}</div>

                      <div class="small mt-1">
                        <span class="badge bg-dark-subtle text-dark-emphasis me-1">
                          {{ prettyRoles(u).join(', ') || 'sin rol' }}
                        </span>

                        <span
                          v-for="e in getEmpresas(u)"
                          :key="e"
                          class="badge bg-secondary-subtle text-secondary-emphasis me-1"
                          title="Empresa asociada al usuario"
                        >
                          {{ e }}
                        </span>
                      </div>
                    </div>
                    <i class="bi bi-plus-circle text-primary mt-1"></i>
                  </div>
                </button>
              </div>

              <div class="small text-body-secondary mt-2">
                Seleccionado: <strong>{{ selectedUser?.fullName || '—' }}</strong>
              </div>

              <div v-if="empresaSelNombre" class="small text-body-secondary mt-1">
                Empresa seleccionada: <strong>{{ empresaSelNombre }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: módulos -->
        <div class="col-12 col-lg-8">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-body">
              <ul class="nav nav-pills gap-2">
                <li class="nav-item">
                  <button class="nav-link" :class="{active: tab==='oc_taller'}" @click="tab='oc_taller'">
                    <i class="bi bi-file-earmark-text me-1"></i> Aprobación OC Taller
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" :class="{active: tab==='cotizadores'}" @click="tab='cotizadores'">
                    <i class="bi bi-people me-1"></i> Cotizadores (por empresa)
                  </button>
                </li>
              </ul>
            </div>

            <div class="card-body">
              <!-- ======================================================
                   MÓDULO: Aprobación OC Taller (por empresa + flujo)
                   ====================================================== -->
              <div v-if="tab==='oc_taller'">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div class="fw-semibold">Flujo de aprobación por empresa</div>
                  <span class="badge bg-primary-subtle text-primary-emphasis">
                    configuracion/aprobacion_oc_taller/empresas
                  </span>
                </div>

                <!-- Empresa selector -->
                <div class="border rounded-4 p-3 mb-3">
                  <div class="row g-2 align-items-end">
                    <div class="col-12 col-md-6">
                      <label class="form-label">Empresa</label>
                      <select class="form-select" v-model="empresaSelKey">
                        <option value="" disabled>Selecciona empresa…</option>
                        <option v-for="e in empresas" :key="e.key" :value="e.key">
                          {{ e.nombre }}
                        </option>
                      </select>
                    </div>

                    <div class="col-12 col-md-6">
                      <label class="form-label">Crear nueva empresa (nombre)</label>
                      <div class="input-group">
                        <input class="form-control" v-model="empresaNuevaNombre" placeholder="Ej: Xtreme Servicio" />
                        <button class="btn btn-outline-primary" @click="crearEmpresa" :disabled="!empresaNuevaNombre.trim()">
                          Crear
                        </button>
                      </div>
                    </div>

                    <div class="col-12 d-flex flex-wrap gap-2 mt-2">
                      <button class="btn btn-outline-secondary btn-sm" @click="seedDefaults" :disabled="seedLoading">
                        <span v-if="seedLoading" class="spinner-border spinner-border-sm me-2"></span>
                        Cargar plantilla por defecto (Servicio / Mining / Hormigones)
                      </button>

                      <div v-if="empresaSelKey" class="ms-auto d-flex align-items-center gap-2">
                        <div class="form-check form-switch m-0">
                          <input class="form-check-input" type="checkbox" :checked="empresaActivo" @change="toggleEmpresaActivo($event)" />
                          <label class="form-check-label small">{{ empresaActivo ? 'Empresa activa' : 'Empresa inactiva' }}</label>
                        </div>

                        <button class="btn btn-primary btn-sm" @click="guardarFlujoEmpresa" :disabled="guardando || !empresaSelKey">
                          <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
                          Guardar flujo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="!empresaSelKey" class="alert alert-warning">
                  Selecciona (o crea) una empresa para configurar su flujo.
                </div>

                <!-- Edición flujo -->
                <div v-else>
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <div class="fw-semibold">Etapas</div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-outline-primary btn-sm" @click="addStep">
                        <i class="bi bi-plus-lg me-1"></i> Agregar etapa
                      </button>
                    </div>
                  </div>

                  <div v-if="stepsDraft.length && !hasAnyAvailableStep" class="alert alert-danger small">
                    <strong>Atención:</strong> hoy no hay ningún aprobador disponible (activo y fuera de vacaciones) en este flujo.
                    Si guardas así, nadie verá OCs en aprobación.
                  </div>

                  <div v-if="stepsDraft.length === 0" class="text-body-secondary small">
                    No hay etapas. Agrega una para comenzar.
                  </div>

                  <div class="row g-3">
                    <div v-for="(st, idx) in stepsDraft" :key="st.id" class="col-12">
                      <div class="border rounded-4 p-3">
                        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-dark-subtle text-dark-emphasis">#{{ idx+1 }}</span>
                            <span class="fw-semibold">{{ st.nombre || 'Etapa' }}</span>
                            <span v-if="st.locked" class="badge bg-warning-subtle text-warning-emphasis">bloqueada</span>

                            <span
                              class="badge"
                              :class="stepHasAvailableApprover(st) ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'"
                              title="Disponibilidad real (activo + no vacaciones hoy)"
                            >
                              {{ stepHasAvailableApprover(st) ? 'Disponible' : 'Sin aprobador disponible' }}
                            </span>

                            <template v-if="delegationInfo(idx)">
                              <span class="badge bg-warning-subtle text-warning-emphasis">
                                Se delega a #{{ delegationInfo(idx)!.toIdx+1 }} ({{ delegationInfo(idx)!.toStep.nombre || delegationInfo(idx)!.toStep.inStatus }})
                              </span>
                            </template>
                          </div>

                          <div class="d-flex align-items-center gap-2">
                            <div class="form-check form-switch m-0">
                              <input class="form-check-input" type="checkbox" v-model="st.activo" />
                              <label class="form-check-label small">{{ st.activo ? 'Activa' : 'Inactiva' }}</label>
                            </div>

                            <div class="btn-group btn-group-sm">
                              <button class="btn btn-outline-secondary" @click="moveStep(idx, -1)" :disabled="idx===0">
                                <i class="bi bi-arrow-up"></i>
                              </button>
                              <button class="btn btn-outline-secondary" @click="moveStep(idx, +1)" :disabled="idx===stepsDraft.length-1">
                                <i class="bi bi-arrow-down"></i>
                              </button>
                            </div>

                            <button class="btn btn-outline-danger btn-sm" @click="removeStep(idx)" :disabled="st.locked">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>

                        <div class="row g-2 mt-2">
                          <div class="col-12 col-md-3">
                            <label class="form-label small">Nombre</label>
                            <input class="form-control" v-model="st.nombre" :disabled="st.locked && st.id==='gmo'" />
                          </div>

                          <div class="col-12 col-md-3">
                            <label class="form-label small">Estatus que recibe</label>
                            <input class="form-control" v-model="st.inStatus" :disabled="st.locked && st.id==='gmo'" />
                          </div>

                          <div class="col-6 col-md-2">
                            <label class="form-label small">Monto min</label>
                            <input type="number" class="form-control" v-model.number="st.min" min="0" />
                          </div>

                          <div class="col-6 col-md-2">
                            <label class="form-label small">Monto max</label>
                            <input type="number" class="form-control" v-model.number="st.max" :min="st.min || 0" />
                          </div>

                          <div class="col-12 col-md-2">
                            <label class="form-label small">Si aprueba →</label>
                            <input class="form-control" v-model="st.approveTo" />
                          </div>

                          <div class="col-12 col-md-3">
                            <label class="form-label small">Si excede max →</label>
                            <input class="form-control" v-model="st.overTo" placeholder="(siguiente estatus)" />
                            <div class="form-text">Vacío = no pasa a otro.</div>
                          </div>
                        </div>

                        <hr class="my-3" />

                        <!-- Aprobadores asignados -->
                        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                          <div class="fw-semibold">Aprobadores asignados</div>
                          <button
                            class="btn btn-outline-primary btn-sm"
                            :disabled="!selectedUser || !canAssignSelectedToEmpresa"
                            @click="addApproverToStep(st)"
                          >
                            <i class="bi bi-person-plus me-1"></i> Agregar seleccionado
                          </button>
                        </div>

                        <div v-if="!canAssignSelectedToEmpresa && selectedUser" class="alert alert-warning py-2 small mb-2">
                          El usuario seleccionado debe tener rol <strong>Aprobador</strong> o <strong>Editor</strong> y pertenecer a la empresa seleccionada.
                        </div>

                        <div v-if="(st.approvers||[]).length === 0" class="text-body-secondary small">
                          Sin aprobadores asignados.
                        </div>

                        <div v-else class="table-responsive">
                          <table class="table table-sm align-middle mb-0">
                            <thead class="table-light">
                              <tr>
                                <th>Usuario</th>
                                <th class="text-center">Activo</th>
                                <th>Vacaciones</th>
                                <th style="width:120px;"></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="ap in st.approvers" :key="ap.uid">
                                <td class="break-any">
                                  <div class="fw-semibold">{{ ap.fullName || '—' }}</div>
                                  <div class="small text-body-secondary">{{ ap.email || '—' }}</div>

                                  <div class="small mt-1">
                                    <span
                                      class="badge"
                                      :class="approverIsAvailableToday(ap) ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'"
                                      title="Disponible hoy (activo + fuera de vacaciones)"
                                    >
                                      {{ approverIsAvailableToday(ap) ? 'Disponible hoy' : 'No disponible hoy' }}
                                    </span>
                                  </div>
                                </td>

                                <td class="text-center">
                                  <div class="form-check form-switch d-inline-flex align-items-center m-0">
                                    <input class="form-check-input" type="checkbox" v-model="ap.activo" />
                                  </div>
                                </td>

                                <td class="break-any">
                                  <div class="d-flex flex-wrap gap-2">
                                    <span
                                      v-for="(v, vidx) in (ap.vacaciones || [])"
                                      :key="vidx"
                                      class="badge bg-warning-subtle text-warning-emphasis border"
                                    >
                                      {{ v.from }} → {{ v.to }}
                                      <button class="btn btn-sm btn-link p-0 ms-2 text-danger" @click="removeVac(st, ap.uid, vidx)">
                                        <i class="bi bi-x-circle"></i>
                                      </button>
                                    </span>
                                    <span v-if="!(ap.vacaciones||[]).length" class="text-body-secondary small">—</span>
                                  </div>

                                  <div class="row g-2 mt-2">
                                    <div class="col-12 col-md-5">
                                      <input type="date" class="form-control form-control-sm" v-model="vacFromKey[st.id+'_'+ap.uid]" />
                                    </div>
                                    <div class="col-12 col-md-5">
                                      <input type="date" class="form-control form-control-sm" v-model="vacToKey[st.id+'_'+ap.uid]" />
                                    </div>
                                    <div class="col-12 col-md-2 d-grid">
                                      <button class="btn btn-warning btn-sm" @click="addVac(st, ap.uid)">+</button>
                                    </div>
                                  </div>
                                </td>

                                <td class="text-end">
                                  <button class="btn btn-outline-danger btn-sm" @click="removeApprover(st, ap.uid)">
                                    Quitar
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div class="small text-body-secondary mt-2">
                          * Las OCs de esta empresa que estén en estatus <strong>{{ st.inStatus }}</strong>
                          serán visibles por los aprobadores disponibles.
                          <template v-if="delegationInfo(idx)">
                            Si esta etapa queda sin aprobadores disponibles, <strong>se delega automáticamente</strong> a:
                            <strong>#{{ delegationInfo(idx)!.toIdx+1 }} ({{ delegationInfo(idx)!.toStep.nombre || delegationInfo(idx)!.toStep.inStatus }})</strong>.
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="alert alert-info mt-3 small">
                    <strong>Regla:</strong> cuando un aprobador aprueba una OC, si el monto está dentro del rango [min,max] pasa a <em>approveTo</em>.
                    Si excede el máximo, pasa a <em>overTo</em>.
                    <br />
                    <strong>Automático:</strong> si una etapa NO tiene aprobadores disponibles (inactivos o de vacaciones hoy),
                    el sistema delega esa etapa al aprobador disponible más cercano (primero anterior; si no existe, siguiente).
                  </div>
                </div>
              </div>

              <!-- ======================================================
                   MÓDULO: Cotizadores por empresa
                   ====================================================== -->
              <div v-else>
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div class="fw-semibold">Cotizadores por empresa</div>
                  <span class="badge bg-primary-subtle text-primary-emphasis">
                    empresas/{{ empresaSelKey || '—' }}/cotizadores
                  </span>
                </div>

                <!-- Empresa selector (reutiliza el mismo) -->
                <div class="border rounded-4 p-3 mb-3">
                  <label class="form-label">Empresa</label>
                  <select class="form-select" v-model="empresaSelKey">
                    <option value="" disabled>Selecciona empresa…</option>
                    <option v-for="e in empresas" :key="e.key" :value="e.key">
                      {{ e.nombre }}
                    </option>
                  </select>

                  <div class="form-text">
                    Solo se pueden agregar usuarios con rol <strong>Editor</strong> (y que tengan esta empresa en su campo <code>empresas</code>).
                  </div>
                </div>

                <div v-if="!empresaSelKey" class="alert alert-warning">
                  Selecciona una empresa para administrar sus cotizadores.
                </div>

                <div v-else>
                  <div class="d-grid d-md-flex gap-2 mb-3 align-items-center">
                    <button class="btn btn-primary btn-sm" :disabled="!canAddCotizadorSelected" @click="addCotizadorSelectedToEmpresa">
                      <i class="bi bi-person-plus me-1"></i> Agregar/Actualizar cotizador
                    </button>

                    <span v-if="selectedUser && !canAddCotizadorSelected" class="small text-warning-emphasis">
                      El usuario debe ser <strong>Editor</strong> y pertenecer a <strong>{{ empresaSelNombre }}</strong>.
                    </span>

                    <span class="ms-auto badge bg-dark-subtle text-dark-emphasis">
                      {{ cotizadoresList.length }}
                    </span>
                  </div>

                  <div class="table-responsive">
                    <table class="table table-sm align-middle">
                      <thead class="table-light">
                        <tr>
                          <th>Nombre</th>
                          <th class="d-none d-md-table-cell">Email</th>
                          <th class="text-center">Activo</th>
                          <th>Vacaciones</th>
                          <th style="width: 120px;"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="c in cotizadoresList" :key="c.uid">
                          <td class="break-any">
                            <div class="fw-semibold">{{ c.fullName || '—' }}</div>
                            <div class="small text-body-secondary d-md-none">{{ c.email || '—' }}</div>
                          </td>

                          <td class="d-none d-md-table-cell break-any">{{ c.email || '—' }}</td>

                          <td class="text-center">
                            <div class="form-check form-switch d-inline-flex align-items-center">
                              <input class="form-check-input" type="checkbox"
                                :checked="c.activo !== false"
                                @change="toggleCotizadorActivo(c, $event)"
                              />
                            </div>
                          </td>

                          <td class="break-any">
                            <div class="d-flex flex-wrap gap-2">
                              <span
                                v-for="(v,idx) in (c.vacaciones || [])"
                                :key="idx"
                                class="badge bg-warning-subtle text-warning-emphasis border"
                              >
                                {{ v.from }} → {{ v.to }}
                                <button class="btn btn-sm btn-link p-0 ms-2 text-danger" @click="removeVacacionCotizador(c, idx)">
                                  <i class="bi bi-x-circle"></i>
                                </button>
                              </span>
                              <span v-if="!(c.vacaciones||[]).length" class="text-body-secondary small">—</span>
                            </div>

                            <div class="row g-2 mt-2">
                              <div class="col-12 col-md-5">
                                <input type="date" class="form-control form-control-sm" v-model="cotVacFrom[c.uid]" />
                              </div>
                              <div class="col-12 col-md-5">
                                <input type="date" class="form-control form-control-sm" v-model="cotVacTo[c.uid]" />
                              </div>
                              <div class="col-12 col-md-2 d-grid">
                                <button class="btn btn-warning btn-sm" @click="addVacacionCotizador(c)">+</button>
                              </div>
                            </div>
                          </td>

                          <td class="text-end">
                            <button class="btn btn-outline-danger btn-sm" @click="softDisableCotizador(c)">
                              Desactivar
                            </button>
                          </td>
                        </tr>

                        <tr v-if="!cotizadoresList.length && !cargando">
                          <td colspan="5" class="text-center text-body-secondary py-4">
                            No hay cotizadores configurados para <strong>{{ empresaSelNombre }}</strong>.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div v-if="cargando" class="text-center py-4">
            <div class="spinner-border" role="status"></div>
            <div class="small mt-2 text-body-secondary">Cargando configuración…</div>
          </div>
        </div>
      </div>

      <!-- Toasts -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { db } from "@/stores/firebase";
import {
  collection, doc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc
} from "firebase/firestore";
import { useAuthStore } from "@/stores/authService";

const router = useRouter();
const auth = useAuthStore();

/* ===== Admin gate ===== */
const isAdmin = computed(() => {
  return String((auth as any)?.role || (auth as any)?.userRole || "").toLowerCase() === "admin"
      || Boolean((auth as any)?.isAdmin);
});

/* ===== UI state ===== */
const tab = ref<"oc_taller"|"cotizadores">("oc_taller");
const cargando = ref(true);
const guardando = ref(false);
const seedLoading = ref(false);

/* ===== Toasts ===== */
const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2600) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

/* ==========================================================
   Firestore paths
   ========================================================== */
const rootRef = doc(db, "configuracion", "aprobacion_oc_taller");
const empresasCol = collection(rootRef, "empresas");

/* ==========================================================
   Usuarios (para asignaciones)
   ========================================================== */
const usuarios = ref<any[]>([]);
const usersFilter = ref("");
const selectedUser = ref<any|null>(null);

const getRoles = (u:any): string[] => {
  const out: string[] = [];
  if (Array.isArray(u?.roles)) out.push(...u.roles);
  if (u?.role) out.push(u.role);
  if (u?.rol) out.push(u.rol);
  return out.map((x:any)=>String(x||"").trim()).filter(Boolean);
};
const prettyRoles = (u:any) => getRoles(u);

const isEditor = (u:any) => {
  const r = getRoles(u).map(x=>x.toLowerCase());
  // ✅ si lo quieres 100% estricto SOLO editor, cambia esto a: return r.includes("editor");
  return r.includes("editor") || r.includes("admin");
};

const isAprobadorOEditor = (u:any) => {
  const r = getRoles(u).map(x=>x.toLowerCase());
  return r.includes("aprobador") || r.includes("editor") || r.includes("admin");
};

const getEmpresas = (u:any): string[] => {
  if (Array.isArray(u?.empresas)) return u.empresas.filter(Boolean);
  if (u?.empresa) return [u.empresa].filter(Boolean);
  return [];
};

const selectUser = (u:any) => {
  selectedUser.value = u;
  addToast("success", `Seleccionado: ${u.fullName || u.email || "usuario"}`);
};

/* Lista izquierda depende del tab */
const usuariosPanel = computed(() => {
  const base = usuarios.value || [];
  return tab.value === "cotizadores"
    ? base.filter(isEditor)
    : base.filter(isAprobadorOEditor);
});

const usuariosFiltrados = computed(() => {
  const t = usersFilter.value.trim().toLowerCase();
  const base = !t ? usuariosPanel.value : usuariosPanel.value.filter(u =>
    String(u.fullName||"").toLowerCase().includes(t) || String(u.email||"").toLowerCase().includes(t)
  );
  return base.slice(0, 160);
});

/* ==========================================================
   Empresas config + Steps draft
   ========================================================== */
const empresas = ref<{key:string,nombre:string,activo:boolean,steps:any[] }[]>([]);
const empresaSelKey = ref<string>("");
const empresaNuevaNombre = ref<string>("");

const empresaSelNombre = computed(() => {
  const e = empresas.value.find(x => x.key === empresaSelKey.value);
  return e?.nombre || "";
});
const empresaActivo = computed(() => {
  const e = empresas.value.find(x => x.key === empresaSelKey.value);
  return e?.activo !== false;
});

type Approver = { uid:string; fullName?:string; email?:string; activo:boolean; vacaciones:any[] };

type Step = {
  id: string;
  locked?: boolean;
  nombre: string;
  inStatus: string;
  min: number;
  max: number;
  approveTo: string;
  overTo: string;
  activo: boolean;
  approvers: Approver[];
};

const stepsDraft = ref<Step[]>([]);
const vacFromKey = ref<Record<string,string>>({});
const vacToKey = ref<Record<string,string>>({});

const keyify = (name:string) =>
  String(name||"")
    .trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"_")
    .replace(/^_+|_+$/g,"");

/* Aprobadores: debe ser aprobador/editor y pertenecer a empresa seleccionada */
const canAssignSelectedToEmpresa = computed(() => {
  if (!selectedUser.value) return false;
  if (!isAprobadorOEditor(selectedUser.value)) return false;
  const emp = empresaSelNombre.value;
  if (!emp) return false;
  const uEmps = getEmpresas(selectedUser.value);
  return uEmps.includes(emp);
});

/* ==========================================================
   DISPONIBILIDAD + DELEGACIÓN
   ========================================================== */
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
};

const isInVacationToday = (vacaciones:any[] = []) => {
  const t = todayISO();
  if (!Array.isArray(vacaciones)) return false;
  return vacaciones.some(v => v?.from && v?.to && String(v.from) <= t && t <= String(v.to));
};

const approverIsAvailableToday = (ap:Approver) => {
  if (!ap) return false;
  if (ap.activo === false) return false;
  if (isInVacationToday(ap.vacaciones || [])) return false;
  return true;
};

const availableApprovers = (st:Step) => {
  const arr = Array.isArray(st?.approvers) ? st.approvers : [];
  return arr.filter(approverIsAvailableToday);
};

const stepHasAvailableApprover = (st:Step) => {
  if (!st) return false;
  if (st.activo === false) return false;
  return availableApprovers(st).length > 0;
};

const findFallbackIdx = (idx:number) => {
  const steps = stepsDraft.value;
  if (!steps[idx]) return -1;
  if (stepHasAvailableApprover(steps[idx])) return idx;

  for (let d=1; d<steps.length; d++) {
    const prev = idx - d;
    if (prev >= 0 && stepHasAvailableApprover(steps[prev])) return prev;

    const next = idx + d;
    if (next < steps.length && stepHasAvailableApprover(steps[next])) return next;
  }
  return -1;
};

const delegationInfo = (idx:number): null | { toIdx:number; toStep:Step } => {
  const steps = stepsDraft.value;
  if (!steps[idx]) return null;

  const f = findFallbackIdx(idx);
  if (f < 0) return null;
  if (f === idx) return null;

  return { toIdx: f, toStep: steps[f] };
};

const hasAnyAvailableStep = computed(() => stepsDraft.value.some(s => stepHasAvailableApprover(s)));

/* ==========================================================
   CRUD empresas
   ========================================================== */
const crearEmpresa = async () => {
  const nombre = empresaNuevaNombre.value.trim();
  if (!nombre) return;
  const key = keyify(nombre);
  try {
    await setDoc(doc(empresasCol, key), {
      nombre,
      activo: true,
      steps: [],
      updatedAt: serverTimestamp()
    }, { merge: true });
    empresaNuevaNombre.value = "";
    empresaSelKey.value = key;
    addToast("success", `Empresa creada: ${nombre}`);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo crear empresa.");
  }
};

const toggleEmpresaActivo = async (ev:any) => {
  const activo = !!ev.target.checked;
  if (!empresaSelKey.value) return;
  try {
    await setDoc(doc(empresasCol, empresaSelKey.value), { activo, updatedAt: serverTimestamp() }, { merge:true });
    addToast("success", `Empresa: ${activo ? "activa" : "inactiva"}`);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo cambiar estado de empresa.");
  }
};

/* ==========================================================
   Steps editor
   ========================================================== */
const addStep = () => {
  stepsDraft.value.push({
    id: "st_" + Math.random().toString(36).slice(2,9),
    nombre: "Nueva etapa",
    inStatus: "",
    min: 0,
    max: 0,
    approveTo: "Aprobado",
    overTo: "",
    activo: true,
    approvers: []
  });
};

const removeStep = (idx:number) => stepsDraft.value.splice(idx, 1);

const moveStep = (idx:number, dir:-1|1) => {
  const j = idx + dir;
  if (j < 0 || j >= stepsDraft.value.length) return;
  const arr = [...stepsDraft.value];
  const tmp = arr[idx];
  arr[idx] = arr[j];
  arr[j] = tmp;
  stepsDraft.value = arr;
};

const addApproverToStep = (st:Step) => {
  if (!selectedUser.value) return;

  const u = selectedUser.value;
  if (!isAprobadorOEditor(u)) return addToast("warning", "El usuario no tiene rol Aprobador/Editor.");
  if (!canAssignSelectedToEmpresa.value) return addToast("warning", "Usuario no pertenece a la empresa seleccionada.");

  if (!Array.isArray(st.approvers)) st.approvers = [];
  if (st.approvers.some(a => a.uid === u.uid)) return addToast("warning", "Ya está asignado en esta etapa.");

  st.approvers.push({
    uid: u.uid,
    fullName: u.fullName || "",
    email: u.email || "",
    activo: true,
    vacaciones: []
  });

  addToast("success", "Aprobador agregado a la etapa.");
};

const removeApprover = (st:Step, uid:string) => {
  st.approvers = (st.approvers||[]).filter(a => a.uid !== uid);
  addToast("warning", "Aprobador quitado.");
};

const addVac = (st:Step, uid:string) => {
  const k = st.id + "_" + uid;
  const from = (vacFromKey.value[k] || "").trim();
  const to = (vacToKey.value[k] || "").trim();
  if (!from || !to) return addToast("warning", "Define desde/hasta.");
  if (from > to) return addToast("warning", "Rango inválido.");

  const ap = (st.approvers||[]).find(a => a.uid === uid);
  if (!ap) return;

  ap.vacaciones = Array.isArray(ap.vacaciones) ? ap.vacaciones : [];
  ap.vacaciones.push({ from, to });

  vacFromKey.value[k] = "";
  vacToKey.value[k] = "";
  addToast("success", "Vacaciones agregadas.");
};

const removeVac = (st:Step, uid:string, idx:number) => {
  const ap = (st.approvers||[]).find(a => a.uid === uid);
  if (!ap || !Array.isArray(ap.vacaciones)) return;
  ap.vacaciones.splice(idx, 1);
  addToast("warning", "Rango eliminado.");
};

/* ==========================================================
   Validación (delegación permite 0 aprobadores por etapa)
   ========================================================== */
const validarSteps = (): string | null => {
  if (!stepsDraft.value.length) return "Debes tener al menos 1 etapa.";

  const seen = new Set<string>();
  for (const st of stepsDraft.value) {
    if (!st.nombre?.trim()) return "Hay una etapa sin nombre.";
    if (!st.inStatus?.trim()) return `La etapa "${st.nombre}" no tiene estatus de entrada (inStatus).`;

    const inSt = st.inStatus.trim();
    if (seen.has(inSt)) return `Estatus duplicado: "${inSt}". Cada etapa debe tener inStatus único.`;
    seen.add(inSt);

    if (st.min == null || st.max == null || Number(st.min) < 0 || Number(st.max) < 0) return "Min/Max inválidos.";
    if (Number(st.min) > Number(st.max)) return `Rango inválido en "${st.nombre}" (min > max).`;
    if (!st.approveTo?.trim()) return `Falta approveTo en "${st.nombre}".`;
  }

  if (!hasAnyAvailableStep.value) {
    return "No hay ningún aprobador disponible hoy en el flujo (todos inactivos o de vacaciones).";
  }

  return null;
};

const guardarFlujoEmpresa = async () => {
  if (!empresaSelKey.value) return;
  const err = validarSteps();
  if (err) return addToast("warning", err);

  guardando.value = true;
  try {
    const payload = stepsDraft.value.map(st => ({
      id: st.id,
      locked: !!st.locked,
      nombre: st.nombre,
      inStatus: st.inStatus,
      min: Number(st.min || 0),
      max: Number(st.max || 0),
      approveTo: st.approveTo,
      overTo: st.overTo || "",
      activo: st.activo !== false,
      approvers: (st.approvers||[]).map(a => ({
        uid: a.uid,
        fullName: a.fullName || "",
        email: a.email || "",
        activo: a.activo !== false,
        vacaciones: Array.isArray(a.vacaciones) ? a.vacaciones : []
      }))
    }));

    await setDoc(doc(empresasCol, empresaSelKey.value), {
      nombre: empresaSelNombre.value,
      activo: empresaActivo.value,
      steps: payload,
      updatedAt: serverTimestamp()
    }, { merge: true });

    addToast("success", "Flujo guardado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo guardar el flujo.");
  } finally {
    guardando.value = false;
  }
};

/* ==========================================================
   Plantilla por defecto (igual que tu lógica)
   ========================================================== */
const findUidByName = (fullName:string) => {
  const n = (fullName||"").trim().toLowerCase();
  const u = usuarios.value.find(x => String(x.fullName||"").trim().toLowerCase() === n);
  return u?.uid || null;
};

const step = (p:Partial<Step>): Step => ({
  id: p.id || ("st_" + Math.random().toString(36).slice(2,9)),
  locked: !!p.locked,
  nombre: p.nombre || "Etapa",
  inStatus: p.inStatus || "",
  min: Number(p.min || 0),
  max: Number(p.max || 0),
  approveTo: p.approveTo || "Aprobado",
  overTo: p.overTo || "",
  activo: p.activo !== false,
  approvers: p.approvers || []
});

const mkApprover = (name:string) => {
  const uid = findUidByName(name);
  return {
    uid: uid || ("MISSING_"+keyify(name)),
    fullName: name,
    email: "",
    activo: true,
    vacaciones: []
  };
};

const seedDefaults = async () => {
  seedLoading.value = true;
  try {
    const servicioKey = keyify("Xtreme Servicio");
    const miningKey = keyify("Xtreme Mining");
    const hormKey = keyify("Xtreme Hormigones");

    await setDoc(doc(empresasCol, servicioKey), {
      nombre: "Xtreme Servicio",
      activo: true,
      steps: [
        step({
          id: "gmo",
          locked: true,
          nombre: "Revisión Guillermo",
          inStatus: "Revisión Guillermo",
          min: 0,
          max: 250000,
          approveTo: "Aprobado",
          overTo: "Preaprobado",
          approvers: [ mkApprover("Guillermo Manzor") ]
        }),
        step({
          nombre: "Preaprobado",
          inStatus: "Preaprobado",
          min: 250001,
          max: 5000000,
          approveTo: "Aprobado",
          overTo: "Casi Aprobado",
          approvers: [ mkApprover("Juan Cubillos") ]
        }),
        step({
          nombre: "Casi Aprobado",
          inStatus: "Casi Aprobado",
          min: 5000001,
          max: 999999999999,
          approveTo: "Aprobado",
          overTo: "",
          approvers: [ mkApprover("Alejandro Candia") ]
        })
      ],
      updatedAt: serverTimestamp()
    }, { merge:true });

    await setDoc(doc(empresasCol, miningKey), {
      nombre: "Xtreme Mining",
      activo: true,
      steps: [
        step({
          nombre: "Revisión Mining",
          inStatus: "Revisión Xtremining",
          min: 0,
          max: 1000000,
          approveTo: "Aprobado Mining",
          overTo: "Preaprobado Mining",
          approvers: [ mkApprover("Felipe Gonzalez"), mkApprover("Ricardo Santibañez") ]
        }),
        step({
          nombre: "Preaprobado Mining",
          inStatus: "Preaprobado Mining",
          min: 1000001,
          max: 5000000,
          approveTo: "Aprobado Mining",
          overTo: "Casi Aprobado Mining",
          approvers: [ mkApprover("Patricio Muñoz") ]
        }),
        step({
          nombre: "Casi Aprobado Mining",
          inStatus: "Casi Aprobado Mining",
          min: 5000001,
          max: 999999999999,
          approveTo: "Aprobado Mining",
          overTo: "",
          approvers: [ mkApprover("Cesar Palma") ]
        })
      ],
      updatedAt: serverTimestamp()
    }, { merge:true });

    await setDoc(doc(empresasCol, hormKey), {
      nombre: "Xtreme Hormigones",
      activo: true,
      steps: [
        step({
          nombre: "Revisión Hormigones",
          inStatus: "Revisión Xtremining",
          min: 0,
          max: 1000000,
          approveTo: "Aprobado Hormigones",
          overTo: "Preaprobado Hormigones",
          approvers: [ mkApprover("Felipe Gonzalez"), mkApprover("Ricardo Santibañez") ]
        }),
        step({
          nombre: "Preaprobado Hormigones",
          inStatus: "Preaprobado Hormigones",
          min: 1000001,
          max: 5000000,
          approveTo: "Aprobado Hormigones",
          overTo: "Casi Aprobado Hormigones",
          approvers: [ mkApprover("Patricio Muñoz") ]
        }),
        step({
          nombre: "Casi Aprobado Hormigones",
          inStatus: "Casi Aprobado Hormigones",
          min: 5000001,
          max: 999999999999,
          approveTo: "Aprobado Hormigones",
          overTo: "",
          approvers: [ mkApprover("Cesar Palma") ]
        })
      ],
      updatedAt: serverTimestamp()
    }, { merge:true });

    addToast("success", "Plantilla cargada. Ajusta uids/roles si algún nombre no coincide.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo cargar plantilla.");
  } finally {
    seedLoading.value = false;
  }
};

/* ==========================================================
   Cotizadores POR EMPRESA (subcolección)
   Path: configuracion/aprobacion_oc_taller/empresas/{empresaKey}/cotizadores/{uid}
   ========================================================== */
const cotizadores = ref<Record<string, any>>({});
const cotVacFrom = ref<Record<string, string>>({});
const cotVacTo = ref<Record<string, string>>({});
const cotizadoresList = computed(() =>
  Object.values(cotizadores.value).sort((a:any,b:any)=> (a.fullName||"").localeCompare(b.fullName||""))
);

const cotizadoresColEmpresa = () => {
  if (!empresaSelKey.value) return null;
  const empresaDoc = doc(empresasCol, empresaSelKey.value);
  return collection(empresaDoc, "cotizadores");
};

const userBelongsToSelectedEmpresa = (u:any) => {
  const emp = empresaSelNombre.value;
  if (!emp) return false;
  return getEmpresas(u).includes(emp);
};

const canAddCotizadorSelected = computed(() => {
  if (!empresaSelKey.value) return false;
  if (!selectedUser.value) return false;
  if (!isEditor(selectedUser.value)) return false; // ✅ solo Editor
  if (!userBelongsToSelectedEmpresa(selectedUser.value)) return false;
  return true;
});

const addCotizadorSelectedToEmpresa = async () => {
  if (!canAddCotizadorSelected.value) return;

  const u = selectedUser.value;
  const col = cotizadoresColEmpresa();
  if (!col) return;

  try {
    await setDoc(doc(col, u.uid), {
      uid: u.uid,
      fullName: u.fullName || "",
      email: u.email || "",
      activo: true,
      vacaciones: [],
      updatedAt: serverTimestamp()
    }, { merge: true });
    addToast("success", `Cotizador guardado para ${empresaSelNombre.value}.`);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo agregar cotizador.");
  }
};

const toggleCotizadorActivo = async (c:any, ev:any) => {
  const col = cotizadoresColEmpresa();
  if (!col) return;
  try {
    const activo = !!ev.target.checked;
    await updateDoc(doc(col, c.uid), { activo, updatedAt: serverTimestamp() });
    addToast("success", `${c.fullName || c.email}: ${activo ? "activo" : "inactivo"}`);
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo actualizar activo.");
  }
};

const softDisableCotizador = async (c:any) => {
  const col = cotizadoresColEmpresa();
  if (!col) return;
  try {
    await updateDoc(doc(col, c.uid), { activo: false, updatedAt: serverTimestamp() });
    addToast("warning", "Cotizador desactivado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo desactivar.");
  }
};

const addVacacionCotizador = async (c:any) => {
  const col = cotizadoresColEmpresa();
  if (!col) return;

  const from = (cotVacFrom.value[c.uid] || "").trim();
  const to = (cotVacTo.value[c.uid] || "").trim();
  if (!from || !to) return addToast("warning", "Define desde/hasta.");
  if (from > to) return addToast("warning", "Rango inválido.");

  try {
    const current = c.vacaciones || [];
    const next = [...current, { from, to }];
    await updateDoc(doc(col, c.uid), { vacaciones: next, updatedAt: serverTimestamp() });
    cotVacFrom.value[c.uid] = "";
    cotVacTo.value[c.uid] = "";
    addToast("success", "Vacaciones agregadas.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo agregar vacaciones.");
  }
};

const removeVacacionCotizador = async (c:any, idx:number) => {
  const col = cotizadoresColEmpresa();
  if (!col) return;

  try {
    const current = [...(c.vacaciones || [])];
    current.splice(idx, 1);
    await updateDoc(doc(col, c.uid), { vacaciones: current, updatedAt: serverTimestamp() });
    addToast("warning", "Rango eliminado.");
  } catch (e) {
    console.error(e);
    addToast("danger", "No se pudo eliminar rango.");
  }
};

/* ==========================================================
   Subscripciones
   ========================================================== */
let unsubEmp:any=null, unsubUsers:any=null, unsubCotEmp:any=null;

const subscribeCotizadoresEmpresa = (empresaKey:string) => {
  unsubCotEmp?.(); unsubCotEmp = null;
  cotizadores.value = {};

  if (!empresaKey) return;

  const empresaDoc = doc(empresasCol, empresaKey);
  const col = collection(empresaDoc, "cotizadores");

  unsubCotEmp = onSnapshot(query(col), (snap) => {
    const out:any = {};
    snap.forEach(s => out[s.id] = s.data());
    cotizadores.value = out;
  }, (err) => {
    console.error(err);
    addToast("danger", "Error al cargar cotizadores de la empresa.");
  });
};

onMounted(() => {
  cargando.value = true;

  unsubEmp = onSnapshot(query(empresasCol, orderBy("nombre")), (snap) => {
    const arr:any[] = [];
    snap.forEach(s => {
      const d:any = s.data() || {};
      arr.push({
        key: s.id,
        nombre: d.nombre || s.id,
        activo: d.activo !== false,
        steps: Array.isArray(d.steps) ? d.steps : []
      });
    });
    empresas.value = arr;
  });

  unsubUsers = onSnapshot(
    query(collection(db, "Usuarios"), orderBy("fullName"), limit(400)),
    (snap) => {
      const arr:any[] = [];
      snap.forEach(s => arr.push({ uid: s.id, ...(s.data() as any) }));
      usuarios.value = arr;
    }
  );

  cargando.value = false;
});

/* cargar steps cuando selecciona empresa (OC Taller) */
watch(empresaSelKey, (k) => {
  const e = empresas.value.find(x => x.key === k);
  stepsDraft.value = (e?.steps || []).map((x:any)=>( {
    id: x.id || ("st_"+Math.random().toString(36).slice(2,9)),
    locked: !!x.locked,
    nombre: x.nombre || "Etapa",
    inStatus: x.inStatus || "",
    min: Number(x.min || 0),
    max: Number(x.max || 0),
    approveTo: x.approveTo || "Aprobado",
    overTo: x.overTo || "",
    activo: x.activo !== false,
    approvers: Array.isArray(x.approvers) ? x.approvers.map((a:any)=>( {
      uid: a.uid,
      fullName: a.fullName || "",
      email: a.email || "",
      activo: a.activo !== false,
      vacaciones: Array.isArray(a.vacaciones) ? a.vacaciones : []
    })) : []
  }));

  // ✅ cotizadores por empresa
  subscribeCotizadoresEmpresa(k || "");
}, { immediate:true });

onBeforeUnmount(() => {
  unsubEmp?.(); unsubUsers?.(); unsubCotEmp?.();
});
</script>

<style scoped>
.minw-0{ min-width:0; }
.break-any{ word-break: break-word; overflow-wrap: anywhere; }
.users-list{ max-height: 520px; overflow:auto; border-radius: 12px; }

/* Toasts */
.toast-stack{ position:fixed; right:16px; bottom:16px; z-index:1200; display:flex; flex-direction:column; gap:10px; }
.toast-box{ display:flex; align-items:center; padding:.6rem .8rem; border-radius:.6rem; color:#fff; min-width:260px; max-width:360px; box-shadow:0 8px 24px rgba(0,0,0,.18); }
.toast-success{ background: linear-gradient(135deg,#22c55e,#16a34a); }
.toast-warning{ background: linear-gradient(135deg,#f59e0b,#d97706); }
.toast-danger{  background: linear-gradient(135deg,#ef4444,#dc2626); }
.btn-close-white{ filter: invert(1) grayscale(100%) brightness(200%); }
</style>
