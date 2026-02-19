<!-- PerfilUsuario.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="perfil-page">
    <div class="container py-4 py-md-5">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h1 class="h4 fw-semibold mb-0">Mi perfil</h1>
        <button class="btn btn-outline-secondary btn-sm" @click="recargar" :disabled="cargando">
          <i class="bi bi-arrow-clockwise me-1"></i> Recargar
        </button>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-4">
          <div class="card h-100">
            <div class="card-header">
              <div class="fw-semibold">Foto de perfil</div>
            </div>
            <div class="card-body d-flex flex-column align-items-center">
              <div class="avatar-wrapper mb-3">
                <img
                  :src="previewURL || perfil.photoURL || fallbackAvatar"
                  class="avatar-img"
                  alt="Foto de perfil">
                <div class="avatar-badge">
                  <i class="bi bi-person"></i>
                </div>
              </div>

              <div class="d-grid gap-2 w-100">
                <input
                  id="fileInput"
                  class="d-none"
                  type="file"
                  accept="image/*"
                  @change="onFileSelected" />

                <button class="btn btn-outline-primary" @click="abrirSelector" :disabled="subiendo">
                  <span v-if="subiendo" class="spinner-border spinner-border-sm me-2"></span>
                  Subir / Cambiar imagen
                </button>

                <button class="btn btn-outline-danger" @click="quitarImagen" :disabled="subiendo || !perfil.photoURL && !previewURL">
                  Quitar imagen
                </button>

                <small class="text-secondary text-center">
                  JPG o PNG · máx. 3 MB
                </small>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-8">
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between">
              <div class="fw-semibold">Información del usuario</div>
              <span class="badge bg-dark-subtle text-dark-emphasis" v-if="perfil.role">{{ perfil.role }}</span>
            </div>

            <div class="card-body">
              <div v-if="cargando" class="text-center py-4">
                <div class="spinner-border" role="status"></div>
                <div class="small mt-2">Cargando…</div>
              </div>

              <div v-else>
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label">Nombre completo</label>
                    <input class="form-control" v-model.trim="perfil.fullName" placeholder="Nombre y apellido" />
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label">RUT</label>
                    <input class="form-control" v-model.trim="perfil.rut" placeholder="21.098.143-8" />
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label">Teléfono</label>
                    <input class="form-control" v-model.trim="perfil.phone" placeholder="+569..." />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label">Correo</label>
                    <input class="form-control" :value="perfil.email || '—'" readonly />
                  </div>

                  <div class="col-12 col-md-6">
                    <label class="form-label">Rol</label>
                    <input class="form-control" :value="perfil.role || '—'" readonly />
                  </div>
                </div>

                <hr class="my-4">

                <div class="d-flex gap-2 justify-content-end">
                  <button class="btn btn-outline-secondary" @click="descartar" :disabled="guardando || subiendo">Descartar</button>
                  <button class="btn btn-primary" @click="guardar" :disabled="guardando || subiendo">
                    <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="text-secondary small mt-2" v-if="perfil.updatedAt">
            Última actualización: {{ fmtFecha(perfil.updatedAt) }}
          </div>
        </div>
      </div>
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
import { ref, reactive, onMounted } from 'vue';
import { db } from '../stores/firebase';
import { useAuthStore } from '../stores/authService';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const auth = useAuthStore();

type Perfil = {
  uid?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  rut?: string;
  role?: string;
  photoURL?: string | null;
  updatedAt?: any;
};

const cargando = ref(true);
const guardando = ref(false);
const subiendo = ref(false);

const original = reactive<Perfil>({});
const perfil   = reactive<Perfil>({});

const storage = getStorage();

const fallbackAvatar = 'https://ui-avatars.com/api/?name=User&background=EEE&color=7C3AED&bold=true';
const previewURL = ref<string | null>(null);
let archivoSeleccionado: File | null = null;

const toasts = ref<{id:number,type:'success'|'warning'|'danger',text:string}[]>([]);
const addToast = (type:'success'|'warning'|'danger', text:string, timeout=2600) => {
  const id = Date.now()+Math.random();
  toasts.value.push({id,type,text});
  setTimeout(()=>closeToast(id), timeout);
};
const closeToast = (id:number) => { toasts.value = toasts.value.filter(t=>t.id!==id); };

const fmtFecha = (f:any) => {
  try {
    const d = f?.toDate ? f.toDate() : (f instanceof Date ? f : (f ? new Date(f) : null));
    if (!d) return '—';
    return d.toLocaleString('es-CL', { dateStyle:'medium', timeStyle:'short' });
  } catch { return '—'; }
};

const cargar = async () => {
  cargando.value = true;
  try {
    const uid = auth?.user?.uid;
    if (!uid) {
      addToast('danger','No hay sesión activa.');
      cargando.value = false;
      return;
    }
    const uref = doc(db, 'Usuarios', uid);
    const snap = await getDoc(uref);
    if (!snap.exists()) {
      addToast('warning','No se encontró tu perfil en Firestore.');
      cargando.value = false;
      return;
    }
    const data = snap.data() || {};

    Object.assign(original, {
      uid,
      email: data.email || auth?.user?.email || '',
      fullName: data.fullName || auth?.user?.displayName || '',
      phone: data.phone || '',
      rut: data.rut || '',
      role: data.role || '',
      photoURL: data.photoURL || null,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null
    });

    Object.assign(perfil, JSON.parse(JSON.stringify(original)));
    previewURL.value = null;
    archivoSeleccionado = null;

  } catch (e) {
    console.error(e);
    addToast('danger','Error al cargar el perfil.');
  } finally {
    cargando.value = false;
  }
};

onMounted(cargar);

const recargar = () => cargar();
const descartar = () => {
  Object.assign(perfil, JSON.parse(JSON.stringify(original)));
  previewURL.value = null;
  archivoSeleccionado = null;
};

const abrirSelector = () => {
  const el = document.getElementById('fileInput') as HTMLInputElement | null;
  el?.click();
};

const onFileSelected = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || !files[0]) return;
  const f = files[0];

  const okType = /^image\/(png|jpe?g|webp)$/i.test(f.type || '');
  if (!okType) { addToast('warning','Solo se permiten imágenes PNG/JPG/WebP.'); return; }

  const maxMB = 3;
  if (f.size > maxMB * 1024 * 1024) { addToast('warning', `La imagen excede ${maxMB} MB.`); return; }

  archivoSeleccionado = f;
  const reader = new FileReader();
  reader.onload = () => { previewURL.value = String(reader.result || ''); };
  reader.readAsDataURL(f);
};

const quitarImagen = async () => {
  previewURL.value = null;
  archivoSeleccionado = null;
  perfil.photoURL = null;
};

const subirImagenSiCorresponde = async (uid: string): Promise<string | null> => {
  if (!archivoSeleccionado) {
    return perfil.photoURL === null ? null : (original.photoURL || null);
  }

  subiendo.value = true;
  try {
    const ext = (archivoSeleccionado.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `usuarios/${uid}/avatar_${Date.now()}.${ext}`;
    const refStorage = sref(storage, path);
    await uploadBytes(refStorage, archivoSeleccionado);
    const url = await getDownloadURL(refStorage);


    return url;
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo subir la imagen.');
    return original.photoURL || null;
  } finally {
    subiendo.value = false;
  }
};

const guardar = async () => {
  if (guardando.value) return;
  if (!perfil.fullName?.trim()) { addToast('warning','Ingresa tu nombre completo.'); return; }
  if (perfil.phone && !/^\+?\d{7,15}$/.test(perfil.phone)) { addToast('warning','Teléfono inválido.'); return; }
  if (perfil.rut && !/^[0-9.kK\-\.]+$/.test(perfil.rut)) { addToast('warning','RUT con formato inválido.'); return; }

  guardando.value = true;
  try {
    const uid = auth?.user?.uid;
    if (!uid) { addToast('danger','Sesión inválida.'); guardando.value=false; return; }

    const urlFinal = await subirImagenSiCorresponde(uid);

    const updatePayload:any = {
      fullName: (perfil.fullName || '').trim(),
      rut: (perfil.rut || '').trim(),
      phone: (perfil.phone || '').trim(),
      photoURL: urlFinal ?? null,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'Usuarios', uid), updatePayload);
    Object.assign(original, { ...original, ...updatePayload, photoURL: urlFinal });
    Object.assign(perfil, JSON.parse(JSON.stringify(original)));
    previewURL.value = null;
    archivoSeleccionado = null;

    addToast('success','Perfil actualizado.');
  } catch (e) {
    console.error(e);
    addToast('danger','No se pudo actualizar el perfil.');
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped>
.perfil-page{
  min-height:100vh;

}

.avatar-wrapper{
  position: relative;
  width: 168px; height: 168px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,.12);
  border: 2px solid #eee;
}
.avatar-img{
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.avatar-badge{
  position: absolute; right: 8px; bottom: 8px;
  background: #111827; color: #fff;
  padding: .25rem .45rem; border-radius: .5rem; font-size: 12px;
}

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
</style>
