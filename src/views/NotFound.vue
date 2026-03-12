<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found-page">
    <div class="not-found-card">
      <div class="icon-wrap">
        <i class="bi bi-exclamation-circle"></i>
      </div>

      <div class="code">404</div>

      <h1 class="title">Página no encontrada</h1>

      <p class="text">
        La página que intentaste abrir no existe, fue movida o la dirección está incorrecta.
      </p>

      <div class="actions">

        <button class="btn btn-outline-secondary px-4" @click="goBack">
          <i class="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const goBack = () => {
  window.history.length > 1
    ? history.back()
    : window.location.assign("/login");
};
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 18px;
  background: #f8fafc;
}

.not-found-card {
  width: 100%;
  max-width: 620px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 22px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  padding: 42px 30px;
  text-align: center;
}

.icon-wrap {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #2563eb;
  display: grid;
  place-items: center;
  font-size: 2rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.code {
  font-size: clamp(3.6rem, 9vw, 6rem);
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.04em;
  margin-bottom: 10px;
}

.title {
  margin: 0 0 10px;
  font-size: 1.65rem;
  font-weight: 700;
  color: #111827;
}

.text {
  max-width: 460px;
  margin: 0 auto 28px;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.65;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.actions .btn {
  min-width: 150px;
  border-radius: 12px;
  font-weight: 600;
  padding-top: 0.72rem;
  padding-bottom: 0.72rem;
}

@media (max-width: 576px) {
  .not-found-card {
    padding: 34px 20px;
    border-radius: 18px;
  }

  .title {
    font-size: 1.35rem;
  }

  .text {
    font-size: 0.95rem;
  }

  .actions {
    flex-direction: column;
  }

  .actions .btn {
    width: 100%;
  }
}
</style>
