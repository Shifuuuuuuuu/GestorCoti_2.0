<!-- eslint-disable vue/multi-word-component-names -->
<!-- src/views/Inicio.vue -->
<template>
  <div class="inicio-wrapper container py-4 px-3 px-md-5">
    <div class="row g-4 align-items-center mb-4">
      <div class="col-lg-7">
        <span class="badge rounded-pill bg-light text-muted border small mb-2">
          <i class="bi bi-grid-3x3-gap me-1"></i>
          Plataforma de SOLPED y Cotizaciones
        </span>

        <h1 class="fw-bold mb-2">
          Bienvenido{{ userName ? `, ${userName}` : "" }}
        </h1>

        <p class="text-muted mb-3 lead-sm">
          Xtreme Solped concentra en un solo lugar las
          <strong>SOLPED</strong>, <strong>Cotizaciones</strong> y solicitudes
          de <strong>taller</strong>, con control de estados, soporte
          documental y responsabilidades claras por rol.
        </p>

        <p class="text-muted small mb-0">
          El objetivo es reemplazar correos sueltos y planillas manuales por un
          flujo único, auditado y trazable, desde la solicitud inicial hasta el
          cierre de cada ítem.
        </p>
      </div>
      <div class="col-lg-5">
        <div class="card shadow-sm border-0 h-100 inicio-panel">
          <div class="card-header bg-dark text-white fw-semibold py-2 px-3">
            <div class="d-flex align-items-center justify-content-between">
              <span><i class="bi bi-info-circle me-1"></i> Resumen del sistema</span>
            </div>
          </div>
          <div class="card-body small">
            <p class="text-muted mb-2">
              La plataforma se apoya en un flujo estándar y en reglas simples:
            </p>
            <ul class="small ps-3 mb-3">
              <li class="mb-1">
                Toda compra comienza en una <strong>SOLPED</strong> formal,
                asociada a contrato, empresa y centro de costo.
              </li>
              <li class="mb-1">
                Las <strong>Cotizaciones</strong> se generan siempre
                vinculadas a una SOLPED y a sus ítems.
              </li>
              <li class="mb-1">
                Los <strong>aprobadores</strong> validan montos, condiciones y
                documentación según sus criterios de aceptación.
              </li>
              <li class="mb-1">
                La <strong>recepción</strong> confirma entrega (productos/servicios),
                cantidades, conformidad y respaldo documental.
              </li>
              <li class="mb-1">
                Cada cambio (estado, comentario, archivo) queda registrado en
                un historial.
              </li>
            </ul>

            <div class="d-flex flex-wrap gap-2">
              <span class="badge bg-light text-muted border">
                <i class="bi bi-lock-fill me-1"></i>
                Acceso por rol
              </span>
              <span class="badge bg-light text-muted border">
                <i class="bi bi-cloud-arrow-up me-1"></i>
                Resplado en la nube
              </span>
              <span class="badge bg-light text-muted border">
                <i class="bi bi-activity me-1"></i>
                Soporte
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body p-3 p-md-4">
        <div class="d-flex align-items-center mb-3 gap-2">
          <i class="bi bi-diagram-3 display-6 text-muted"></i>
          <div>
            <h5 class="mb-0">Flujo general de compras</h5>
            <small class="text-muted">
              Ciclo SOLPED → Cotización → Aprobación → Recepción → Cierre
            </small>
          </div>
        </div>

        <div
          class="row g-3 align-items-stretch text-center text-md-start row-cols-1 row-cols-md-2 row-cols-xl-5 flujo-row"
        >
          <div class="col">
            <div class="flujo-step h-100">
              <div class="flujo-icon bg-step-1 mb-2">
                <span>1</span>
              </div>
              <h6 class="fw-semibold mb-1">Solicitud (SOLPED)</h6>
              <p class="text-muted small mb-0">
                El solicitante describe la necesidad, define contrato, empresa
                y centro de costo, y detalla ítems y plazos esperados.
              </p>
            </div>
          </div>

          <div class="col">
            <div class="flujo-step h-100">
              <div class="flujo-icon bg-step-2 mb-2">
                <span>2</span>
              </div>
              <h6 class="fw-semibold mb-1">Cotización</h6>
              <p class="text-muted small mb-0">
                Compras analiza la solicitud, gestiona proveedores y genera la
                cotización asociando precios, condiciones y respaldos.
              </p>
            </div>
          </div>

          <div class="col">
            <div class="flujo-step h-100">
              <div class="flujo-icon bg-step-3 mb-2">
                <span>3</span>
              </div>
              <h6 class="fw-semibold mb-1">Aprobación de cotización</h6>
              <p class="text-muted small mb-0">
                Los aprobadores revisan montos, límites, contrato y archivos;
                registran observaciones y aprueban o rechazan.
              </p>
            </div>
          </div>

          <div class="col">
            <div class="flujo-step h-100">
              <div class="flujo-icon bg-step-4 mb-2">
                <span>4</span>
              </div>
              <h6 class="fw-semibold mb-1">Recepción</h6>
              <p class="text-muted small mb-0">
                Se registra la recepción de productos/servicios: confirmación
                de entrega, cantidades, conformidad y documentos (guías/facturas).
              </p>
            </div>
          </div>

          <div class="col">
            <div class="flujo-step h-100">
              <div class="flujo-icon bg-step-5 mb-2">
                <span>5</span>
              </div>
              <h6 class="fw-semibold mb-1">Cierre y seguimiento</h6>
              <p class="text-muted small mb-0">
                Se cierra el proceso y se actualiza el estado de cada ítem
                (pendiente, parcial, completado), con reportes y trazabilidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row g-3 mb-4 small">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body">
            <h5 class="card-title mb-2">
              <i class="bi bi-person-lines-fill me-1"></i> Solicitantes
            </h5>
            <p class="text-muted mb-2">
              Usuarios que levantan necesidades de compra o servicio.
            </p>
            <ul class="list-unstyled mb-0">
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Crean SOLPED claras y completas, evitando ambigüedades.
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Adjuntan antecedentes relevantes (cotizaciones de referencia,
                correos clave, fichas técnicas).
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Monitorean el estado de sus solicitudes y responden
                observaciones de compras o aprobadores.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body">
            <h5 class="card-title mb-2">
              <i class="bi bi-gear-wide-connected me-1"></i> Cotizadores
            </h5>
            <p class="text-muted mb-2">
              Equipos encargados de conseguir precios, condiciones y tiempos.
            </p>
            <ul class="list-unstyled mb-0">
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Generan cotizaciones vinculadas a las SOLPED asignadas.
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Mantienen actualizados PDFs, anexos y comparativas de precios.
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Marcan el avance por ítem (pendiente, parcial, completado) para
                dar visibilidad a solicitantes y aprobadores.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body">
            <h5 class="card-title mb-2">
              <i class="bi bi-shield-check me-1"></i> Aprobadores / Admin
            </h5>
            <p class="text-muted mb-2">
              Responsables de validar decisiones y administrar la plataforma.
            </p>
            <ul class="list-unstyled mb-0">
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Definen límites de aprobación y criterios por tipo de compra.
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Gestionan usuarios, roles, contratos, equipos y parámetros
                generales.
              </li>
              <li class="mb-1">
                <i class="bi bi-check-circle text-success me-1"></i>
                Utilizan estadísticas para identificar cuellos de botella y
                oportunidades de mejora en el proceso.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 small">
      <div class="col-md-12">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="mb-2">
              <i class="bi bi-rocket-takeoff me-1"></i> Próximos pasos recomendados
            </h6>
            <ol class="text-muted mb-3 ps-3">
              <li class="mb-1">
                Revisa tu <strong>perfil</strong> y rol de usuario para conocer
                a qué módulos tienes acceso.
              </li>
              <li class="mb-1">
                Consulta el <strong>Historial de SOLPED</strong> para ver el
                estado actual de tus solicitudes.
              </li>
              <li class="mb-1">
                Si eres admin, revisa periódicamente <strong>Admin Usuarios</strong>
                y módulos de administración para mantener datos y permisos al día.
              </li>
            </ol>

            <p class="text-muted mb-0">
              Ante dudas o incidencias, utiliza el módulo de
              <strong>Soporte</strong> para registrar consultas y hacer
              seguimiento a su resolución.
            </p>
          </div>
        </div>
      </div>
    </div>

    <p class="mt-4 text-center text-muted small">
      Usa el menú lateral o superior para navegar entre SOLPED, Cotizaciones,
      Recepción, Administración y Dashboard.
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authService";

const auth = useAuthStore();

const userName = computed(() => {
  const base =
    auth?.profile?.fullName ||
    auth?.user?.displayName ||
    auth?.user?.email ||
    "";
  return base.trim();
});
</script>

<style scoped>
.inicio-wrapper {
  max-width: 1200px;
}

.inicio-panel {
  border-radius: 0.9rem;
}

.flujo-row {
  position: relative;
}

.flujo-step {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--bs-body-bg);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.flujo-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #fff;
}

.bg-step-1 {
  background: #0d9488;
}
.bg-step-2 {
  background: #2563eb;
}
.bg-step-3 {
  background: #c62828;
}
.bg-step-4 {
  background: #f59e0b;
}
.bg-step-5 {
  background: #6b7280;
}
.lead-sm {
  font-size: 1rem;
}

@media (max-width: 767.98px) {
  .inicio-wrapper {
    padding-top: 1rem;
  }
}
</style>
