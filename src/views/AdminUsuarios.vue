<!-- AdminUsuarios.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="admin-users-page">
    <div class="container py-4 py-md-5">

      <!-- Header / acciones -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Administrar usuarios</h1>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="abrirCrear">
            <i class="bi bi-person-plus me-1"></i> Agregar usuario
          </button>
          <button class="btn btn-outline-secondary" @click="cargarUsuarios">
            <i class="bi bi-arrow-clockwise me-1"></i> Recargar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-6">
              <label class="form-label">Buscar por nombre completo</label>
              <input
                class="form-control"
                v-model="busqueda"
                placeholder="Ej: Juan, María, etc." />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Filtrar por rol</label>
              <select class="form-select" v-model="rolFiltro">
                <option value="">— Todos —</option>
                <option v-for="r in rolesDisponibles" :key="r" :value="r">{{ r }}</option>
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

            <div class="table-responsive" v-else>
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style="width:40px;"></th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Teléfono</th>
                    <th>RUT</th>
                    <th>Creado</th>
                    <th style="width: 160px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in paginado" :key="u.uid">
                    <td><i class="bi bi-person-circle fs-5 text-secondary"></i></td>
                    <td class="fw-semibold">{{ u.fullName || '—' }}</td>
                    <td>{{ u.email || '—' }}</td>
                    <td>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis">
                        {{ u.role || '—' }}
                      </span>
                    </td>
                    <td>{{ u.phone || '—' }}</td>
                    <td>{{ u.rut || '—' }}</td>
                    <td class="small text-secondary">{{ fmtFecha(u.createdAt) }}</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" @click="abrirEditar(u)">Editar</button>
                        <button
                          class="btn btn-outline-danger"
                          @click="abrirConfirm(u)"
                          :disabled="accionando && uidEnAccion===u.uid">
                          <span v-if="accionando && uidEnAccion===u.uid" class="spinner-border spinner-border-sm me-2"></span>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="card-footer">
              <nav>
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{disabled: paginaActual===1}">
                    <button class="page-link" @click="goToPage(paginaActual-1)">«</button>
                  </li>
                  <li
                    v-for="n in visiblePages"
                    :key="'pg-'+n"
                    class="page-item"
                    :class="{active: paginaActual===n}">
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

              <div class="col-12 col-md-6">
                <label class="form-label">Teléfono</label>
                <input class="form-control" v-model="form.phone" placeholder="+569..." />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">RUT</label>
                <input class="form-control" v-model="form.rut" placeholder="99.999.999-9" />
              </div>

              <div class="col-12">
                <label class="form-label">Rol</label>
                <select class="form-select" v-model="form.role">
                  <option value="">— Selecciona —</option>
                  <option v-for="r in rolesDisponibles" :key="'role-'+r" :value="r">{{ r }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="offcanvas-footer">
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-secondary" @click="cerrarOff">Cancelar</button>
              <button class="btn btn-primary" :disabled="accionando" @click="guardar">
                <span v-if="accionando" class="spinner-border spinner-border-sm me-2"></span>
                {{ esEdicion ? 'Guardar cambios' : 'Crear usuario' }}
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
            ¿Seguro que quieres eliminar al usuario
            <strong>{{ confirmRow?.fullName || confirmRow?.email || '—' }}</strong>?
          </p>
          <ul class="list-unstyled small mb-0">
            <li><span class="text-secondary">Email:</span> <strong>{{ confirmRow?.email || '—' }}</strong></li>
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

/* ================== Constantes ================== */
const FUNCTIONS_REGION = 'southamerica-west1'; // misma región del deploy
const rolesDisponibles = ['Admin','Aprobador/Editor','Generador solped','Editor'];

/* ================== Estado base ================== */
const cargando = ref(true);
const usuarios = ref([]);

const busqueda = ref('');
const rolFiltro = ref('');
const pageSize = 15;
const paginaActual = ref(1);

const offOpen = ref(false);
const esEdicion = ref(false);
const form = ref({}); // { uid, email, fullName, phone, rut, role, password? }

const accionando = ref(false);
const uidEnAccion = ref(null);

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

  // mensajes cortos devueltos por la CF (err.message)
  if (msg === 'TOO_SHORT') return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg === 'INVALID_EMAIL') return 'Email inválido.';
  if (msg === 'MISSING_NAME') return 'Falta el nombre.';
  if (msg === 'EMAIL_IN_USE') return 'El email ya está en uso.';
  if (msg === 'USER_NOT_FOUND') return 'El usuario no existe.';
  if (msg === 'INVALID_PHONE') return 'Teléfono inválido.';

  // por si no vino "message", usar "code"
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
      arr.push({
        uid: data.uid || d.id,
        email: data.email || '',
        fullName: data.fullName || '',
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || '',
        createdAt: data.createdAt || null,
        token: data.token || ''
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
  return usuarios.value.filter(u => {
    const okNombre = q ? (u.fullName || '').toLowerCase().includes(q) : true;
    const okRol = rol ? (u.role || '').toLowerCase() === rol : true;
    return okNombre && okRol;
  });
});
const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)));
const paginado = computed(() => {
  const start = (paginaActual.value - 1) * pageSize;
  return filtrados.value.slice(start, start + pageSize);
});
const visiblePages = computed(() => {
  const maxButtons = 7;
  const pages = [];
  let start = Math.max(1, paginaActual.value - Math.floor(maxButtons/2));
  let end = Math.min(totalPaginas.value, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let i=start; i<=end; i++) pages.push(i);
  return pages;
});
const goToPage = (n) => { if (n<1 || n>totalPaginas.value) return; paginaActual.value = n; };
const limpiarFiltros = () => { busqueda.value=''; rolFiltro.value=''; paginaActual.value=1; };

/* ================== Offcanvas ================== */
const abrirCrear = () => {
  esEdicion.value = false;
  form.value = { email:'', fullName:'', role:'', phone:'', rut:'', password:'', uid:'' };
  offOpen.value = true;
};
const abrirEditar = (u) => {
  esEdicion.value = true;
  form.value = { ...u, password:'' };
  offOpen.value = true;
};
const cerrarOff = () => { offOpen.value = false; };

/* ================== Cloud Functions (v2, misma región) ================== */
const functions = getFunctions(undefined, FUNCTIONS_REGION);
const cfCreate = httpsCallable(functions, 'adminCreateUser');   // {email,password,displayName,phone}
const cfUpdate = httpsCallable(functions, 'adminUpdateUser');   // {uid,email?,displayName?,phone?}
const cfDelete = httpsCallable(functions, 'adminDeleteUser');   // {uid}

/* ================== Crear / Editar ================== */
const validar = () => {
  const data = form.value;
  if (!data.fullName?.trim()) { addToast('warning','Ingresa el nombre completo.'); return false; }
  if (!data.email?.trim())    { addToast('warning','Ingresa el email.'); return false; }
  if (!esEdicion.value && (!data.password || data.password.length < 6)) {
    addToast('warning','La contraseña debe tener al menos 6 caracteres.');
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
    if (!esEdicion.value) {
      // 1) Crear en Authentication (CF)
      const resp = await cfCreate({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
        phone: (data.phone || '').trim()
      });
      const uid = resp?.data?.uid;
      if (!uid) { addToast('danger','No llegó UID desde la función.'); return; }

      // 2) Guardar en Firestore
      await setDoc(doc(db, 'Usuarios', uid), {
        uid,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || '',
        createdAt: serverTimestamp()
      });

      addToast('success','Usuario creado.');
    } else {
      const uid = data.uid;
      // 1) Actualizar en Authentication (CF)
      await cfUpdate({
        uid,
        email: data.email,
        displayName: data.fullName,
        phone: (data.phone || '').trim()
      });

      // 2) Actualizar Firestore
      await updateDoc(doc(db, 'Usuarios', uid), {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || '',
        rut: data.rut || '',
        role: data.role || ''
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

/* ================== Eliminar (con modal) ================== */
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
    // 1) Auth (CF)
    await cfDelete({ uid: confirmRow.value.uid });

    // 2) Firestore
    await deleteDoc(doc(db, 'Usuarios', confirmRow.value.uid));

    usuarios.value = usuarios.value.filter(x => x.uid !== confirmRow.value.uid);
    addToast('success','Usuario eliminado.');
    cerrarConfirm();

  } catch (e) {
    console.error(e);
    const msg = mapFunctionsError(e);
    // Si ya no existe en Auth, limpiamos Firestore igual
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
.admin-users-page{
  min-height:100vh;
}

/* Offcanvas lateral derecho */
.offcanvas-backdrop{
  position: fixed; inset: 0; z-index: 1080; display: grid; place-items: center;
  background: rgba(0,0,0,.45);
}
.offcanvas-panel{
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 520px; max-width: 95vw;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  display: flex; flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,.25);
  border-top-left-radius:.75rem; border-bottom-left-radius:.75rem;
  animation: slideIn .18s ease-out both;
}
@keyframes slideIn { from{ transform: translateX(20px); opacity: 0; } to{ transform:none; opacity:1; } }
.offcanvas-header, .offcanvas-footer{ padding: .9rem 1rem; border-bottom: 1px solid #eee; }
.offcanvas-footer{ border-top: 1px solid #eee; border-bottom: 0; }
.offcanvas-body{ padding: 1rem; overflow: auto; }

/* Modal */
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
