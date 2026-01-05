<!-- src/views/AiInspectorView.vue -->
<template>
  <div class="container-fluid py-4 page-root" style="max-width: 1320px;">
    <!-- Header -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-robot"></i>
          <span class="badge rounded-pill text-bg-dark">Vertex AI Gemini</span>
        </h4>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="newChat" :disabled="loading">
          <i class="bi bi-plus-circle me-1"></i> Nuevo chat
        </button>

        <button class="btn btn-outline-secondary btn-sm" @click="openQuestionsManager" :disabled="loading">
          <i class="bi bi-list-check me-1"></i> Gestionar preguntas
        </button>

        <button class="btn btn-outline-secondary btn-sm" @click="resetAll" :disabled="loading">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Reiniciar todo
        </button>
      </div>
    </div>

    <div class="row g-3 flex-grow-1">
      <!-- LEFT: HISTORIAL -->
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-white d-flex align-items-center justify-content-between">
            <div class="fw-semibold">
              <i class="bi bi-clock-history me-1"></i> Historial de chats
            </div>
            <span class="badge text-bg-secondary">{{ history.length }}</span>
          </div>

          <div class="card-body d-flex flex-column">
            <div class="input-group mb-2">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input
                class="form-control"
                v-model="historyFilter"
                placeholder="Buscar por patente/código o pregunta"
                :disabled="historyLoading"
              />
              <button
                class="btn btn-outline-secondary"
                @click="loadHistory"
                :disabled="historyLoading"
                title="Recargar"
              >
                <i class="bi bi-arrow-repeat"></i>
              </button>
            </div>

            <div v-if="historyLoading" class="text-muted small d-flex align-items-center gap-2 py-2">
              <span class="spinner-border spinner-border-sm"></span>
              Cargando historial...
            </div>

            <div v-else-if="historyFiltered.length === 0" class="text-muted small py-2">
              Aún no hay chats guardados.
            </div>

            <!-- ✅ Scroll que ocupa el alto disponible -->
            <TransitionGroup
              v-else
              name="list"
              tag="div"
              class="history-scroll list-group flex-grow-1"
            >
              <div
                v-for="h in historyFiltered"
                :key="h.id"
                class="list-group-item p-0 overflow-hidden"
              >
                <div class="d-flex">
                  <!-- ✅ sin azul: NO btn-link, y forzamos color normal en CSS -->
                  <button
                    class="btn text-start flex-grow-1 py-2 px-3 history-btn"
                    :class="{ 'bg-info-subtle': h.id === activeChatId }"
                    @click="openChat(h.id)"
                    type="button"
                  >
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="me-2">
                        <div class="fw-semibold d-flex align-items-center gap-2">
                          <i class="bi bi-truck-front"></i>
                          <span>{{ h.codigo || "SIN CÓDIGO" }}</span>
                        </div>
                        <div class="small opacity-75 clamp-2">
                          {{ h.question || "(sin pregunta)" }}
                        </div>
                      </div>
                      <span class="badge text-bg-light border">{{ h.tsLabel }}</span>
                    </div>
                  </button>

                  <button
                    class="btn btn-sm btn-outline-danger border-0 rounded-0 px-3"
                    title="Eliminar chat"
                    @click.stop="confirmDeleteChat(h)"
                    :disabled="loading"
                    type="button"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="col-12 col-lg-8 d-flex flex-column gap-3">
        <!-- FORM -->
        <div class="card shadow-sm">
          <div class="card-header bg-white d-flex align-items-center justify-content-between">
            <div class="fw-semibold">
              <i class="bi bi-clipboard-check me-1"></i> Nueva inspección
            </div>
            <div class="d-flex gap-2 align-items-center">
              <span v-if="selectedEquipo" class="badge text-bg-primary">{{ selectedEquipo.codigo }}</span>
              <span v-if="selectedEquipo" class="badge text-bg-light border">
                {{ selectedEquipo.tipo_equipo || selectedEquipo.clasificacion1 || "N/D" }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="row g-3">
              <!-- Equipo -->
              <div class="col-12">
                <label class="form-label mb-1">Equipo (Patente / Código)</label>

                <div ref="equiposBox" class="position-relative">
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>

                    <input
                      ref="equiposInput"
                      class="form-control"
                      v-model="equiposFilter"
                      placeholder="Busca por inicial (S...), código, marca, modelo... (ej: JK-2864 / 2864)"
                      :disabled="equiposLoading"
                      @focus="openEquiposDropdown"
                      @input="openEquiposDropdown"
                      @keydown.down.prevent="moveActive(1)"
                      @keydown.up.prevent="moveActive(-1)"
                      @keydown.enter.prevent="selectActive()"
                    />

                    <button
                      v-if="equiposFilter"
                      class="btn btn-outline-secondary"
                      type="button"
                      title="Limpiar búsqueda"
                      @click="clearEquiposSearch"
                      :disabled="equiposLoading"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>

                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="reloadEquipos"
                      :disabled="equiposLoading"
                      title="Recargar equipos"
                    >
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                  </div>

                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                    <div class="small text-muted">
                      <i class="bi bi-database me-1"></i>
                      Total equipos: <b>{{ equipos.length }}</b>
                      <span v-if="equiposFilterTrim" class="ms-2">
                        · Resultados: <b>{{ equiposFiltered.length }}</b>
                      </span>
                    </div>

                    <div class="d-flex gap-2">
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        @click="toggleEquiposDropdown"
                        :disabled="equiposLoading || !equipos.length"
                      >
                        <i class="bi bi-chevron-down me-1"></i>
                        {{ equiposDropdownOpen ? "Ocultar" : "Ver lista" }}
                      </button>

                      <button
                        v-if="selectedEquipo"
                        class="btn btn-sm btn-outline-danger"
                        type="button"
                        @click="clearSelectedEquipo"
                      >
                        <i class="bi bi-trash me-1"></i> Quitar selección
                      </button>
                    </div>
                  </div>

                  <Transition name="drop">
                    <div
                      v-if="equiposDropdownOpen"
                      class="dropdown-menu show w-100 p-0 mt-2"
                      style="max-height: 360px; overflow:auto;"
                    >
                      <div class="px-3 py-2 border-bottom bg-white sticky-top">
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="fw-semibold">
                            <i class="bi bi-truck-front me-1"></i> Selecciona un equipo
                          </div>
                          <span class="badge text-bg-secondary">{{ equiposFiltered.length }}</span>
                        </div>
                        <div class="small text-muted mt-1">
                          Tip: escribe una letra (ej: <b>s</b>) para filtrar por inicial · ↑ ↓ · Enter
                        </div>
                      </div>

                      <div v-if="equiposLoading" class="px-3 py-3 text-muted small d-flex align-items-center gap-2">
                        <span class="spinner-border spinner-border-sm"></span>
                        Cargando equipos...
                      </div>

                      <div v-else-if="!equiposFiltered.length" class="px-3 py-3 text-muted small">
                        No hay resultados. Prueba con otra letra o parte del código.
                      </div>

                      <!-- ✅ activo = bg-info-subtle (via .is-active en CSS) -->
                      <button
                        v-else
                        v-for="(e, idx) in equiposFiltered"
                        :key="e.id"
                        type="button"
                        class="dropdown-item text-wrap py-2"
                        :class="{ 'is-active': idx === activeEquipoIndex }"
                        @click="selectEquipo(e)"
                      >
                        <div class="d-flex justify-content-between align-items-start">
                          <div class="me-2">
                            <div class="fw-semibold">
                              {{ e.codigo || "SIN CÓDIGO" }}
                              <span class="small text-muted ms-1">· {{ e.marca || "" }} {{ e.modelo || "" }}</span>
                            </div>
                            <div class="small opacity-75">
                              {{ e.equipo || e.tipo_equipo || e.clasificacion1 || "" }}
                            </div>
                            <div class="small text-muted">
                              {{ e.ano ?? "N/D" }} · {{ e.localizacion || "Sin localización" }}
                            </div>
                          </div>
                          <i class="bi bi-chevron-right opacity-50"></i>
                        </div>
                      </button>
                    </div>
                  </Transition>
                </div>

                <div v-if="selectedEquipo" class="mt-2 small text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ selectedEquipo.equipo }}
                </div>
              </div>

              <!-- Fotos -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1">Fotos (múltiples)</label>
                <input
                  class="form-control"
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  @change="onPick"
                />

                <div v-if="previews.length" class="mt-2">
                  <TransitionGroup name="thumb" tag="div" class="d-flex flex-wrap gap-2">
                    <div
                      v-for="(p, idx) in previews"
                      :key="p"
                      class="border rounded p-1 bg-light thumb-card"
                      style="width: 92px;"
                    >
                      <img :src="p" class="img-fluid rounded" style="height:72px; object-fit:cover; width:100%;" />
                      <button class="btn btn-sm btn-outline-danger w-100 mt-1" @click="removeImg(idx)" type="button">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </TransitionGroup>

                  <button class="btn btn-outline-danger btn-sm mt-2" @click="clearImgs" type="button">
                    <i class="bi bi-trash me-1"></i> Quitar todas
                  </button>
                </div>
              </div>

              <!-- Preguntas -->
              <div class="col-12 col-md-6">
                <label class="form-label mb-1 d-flex align-items-center justify-content-between">
                  <span>Pregunta</span>
                  <button
                    v-if="selectedSavedQuestion"
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    title="Eliminar esta pregunta guardada"
                    @click="confirmDeleteQuestion(selectedSavedQuestion)"
                    :disabled="loading"
                  >
                    <i class="bi bi-trash me-1"></i> Eliminar
                  </button>
                </label>

                <select class="form-select" v-model="selectedQuestion">
                  <option disabled value="">Selecciona una…</option>
                  <option v-for="q in questionOptions" :key="q" :value="q">{{ q }}</option>
                </select>

                <div class="d-flex gap-2 mt-2">
                  <button class="btn btn-outline-primary w-100" @click="openFreeModal" :disabled="loading" type="button">
                    <i class="bi bi-chat-left-text me-1"></i> Pregunta libre
                  </button>
                </div>

                <label class="form-label mt-3 mb-1">Notas extra (opcional)</label>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="extraNotes"
                  placeholder="Contexto: sector, turno, hallazgo previo..."
                ></textarea>

                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-primary w-100" :disabled="loading" @click="send" type="button">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? "Analizando..." : "Enviar" }}
                  </button>
                </div>

                <div v-if="error" class="alert alert-danger mt-3 mb-0">
                  <i class="bi bi-exclamation-triangle me-1"></i> {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CHAT -->
        <div class="card shadow-sm chat-card flex-grow-1">
          <div class="card-header bg-white d-flex align-items-center justify-content-between">
            <div class="fw-semibold">
              <i class="bi bi-chat-dots me-1"></i> Conversación
            </div>

            <div class="d-flex align-items-center gap-2">
              <span v-if="activeHeaderTs" class="badge text-bg-secondary">{{ activeHeaderTs }}</span>
              <span v-if="activeHeaderCodigo" class="badge text-bg-primary">{{ activeHeaderCodigo }}</span>

              <button
                v-if="activeChatId"
                class="btn btn-sm btn-outline-danger"
                @click="confirmDeleteChat(activeChat)"
                :disabled="loading"
                title="Eliminar chat (y fotos)"
                type="button"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <div class="card-body position-relative d-flex flex-column" style="min-height: 380px;">
            <!-- Overlay carga -->
            <Transition name="fade">
              <div v-if="loading" class="loading-overlay">
                <div class="loading-panel">
                  <div class="d-flex align-items-center gap-2">
                    <span class="spinner-border spinner-border-sm"></span>
                    <div class="fw-semibold">Analizando</div>
                  </div>
                  <div class="small text-muted mt-1">
                    Revisando fotos, contexto del equipo y tu pregunta...
                  </div>
                </div>
              </div>
            </Transition>

            <Transition name="fade-slide" mode="out-in">
              <div v-if="!activeChat && !pendingChat" :key="'empty'" class="text-muted">
                Aún no hay un chat activo. Envía una consulta o selecciona uno en el historial.
              </div>

              <div v-else-if="pendingChat" :key="'pending'" class="chat-wrap">
                <div class="msg msg-user">
                  <div>
                    <!-- ✅ “Tú” en plomo -->
                    <div class="fw-semibold text-body-secondary">
                      <i class="bi bi-person me-1"></i> Tú
                    </div>
                    <small class="text-muted">{{ pendingChat.tsLabel }}</small>
                  </div>

                  <!-- ✅ burbuja ploma -->
                  <div class="msg-bubble bg-body-tertiary border">{{ pendingChat.question }}</div>

                  <div v-if="pendingChat.extraNotes" class="small text-muted mt-1">
                    <i class="bi bi-journal-text me-1"></i> {{ pendingChat.extraNotes }}
                  </div>
                </div>

                <div class="msg msg-ai">
                  <div class="msg-head">
                    <!-- ✅ “IA” en plomo -->
                    <div class="fw-semibold text-body-secondary">
                      <i class="bi bi-robot me-1"></i> IA
                    </div>
                    <small class="text-muted">escribiendo…</small>
                  </div>

                  <div class="msg-bubble bg-body-tertiary border d-inline-flex align-items-center gap-2">
                    <span class="typing-dots" aria-label="typing">
                      <span></span><span></span><span></span>
                    </span>
                    <span class="small text-muted">Procesando hallazgos</span>
                  </div>

                  <div class="mt-3">
                    <div class="skeleton mb-2" style="width: 72%;"></div>
                    <div class="skeleton mb-2" style="width: 92%;"></div>
                    <div class="skeleton" style="width: 55%;"></div>
                  </div>
                </div>
              </div>

              <div v-else :key="activeChatId" class="chat-wrap">
                <div class="msg msg-user">
                  <div class="msg-head">
                    <!-- ✅ “Tú” plomo -->
                    <div class="fw-semibold text-body-secondary">
                      <i class="bi bi-person me-1"></i> Tú
                    </div>
                    <small class="text-muted">{{ activeChat.tsLabel }}</small>
                  </div>

                  <!-- ✅ burbuja ploma -->
                  <div class="msg-bubble bg-body-tertiary border" style="white-space: pre-wrap;">
                    {{ activeChat.question }}
                  </div>

                  <div v-if="activeChat.extraNotes" class="small text-muted mt-1">
                    <i class="bi bi-journal-text me-1"></i> {{ activeChat.extraNotes }}
                  </div>
                </div>

                <div class="msg msg-ai">
                  <div class="d-flex justify-content-between align-items-center">
                    <!-- ✅ “IA” plomo -->
                    <div class="fw-semibold text-body-secondary">
                      <i class="bi bi-robot me-1"></i> IA
                    </div>

                    <div class="d-flex gap-2">
                      <button
                        v-if="activeChat?.view?.respuesta"
                        class="btn btn-sm btn-outline-secondary"
                        @click="toggleFullAnswer"
                        title="Typing / Mostrar completo"
                        type="button"
                      >
                        <i class="bi" :class="showFullAnswer ? 'bi-lightning' : 'bi-lightning-charge'"></i>
                        {{ showFullAnswer ? "Typing" : "Completo" }}
                      </button>

                      <button
                        class="btn btn-sm btn-outline-secondary"
                        @click="showRaw = !showRaw"
                        title="Ver JSON"
                        type="button"
                      >
                        <i class="bi bi-braces"></i>
                      </button>
                    </div>
                  </div>

                  <div v-if="activeChat.view" class="mt-2">
                    <div class="p-3 border rounded bg-white appear">
                      <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                        <span class="badge text-bg-dark">{{ activeChat.view.focus || "GENERAL" }}</span>
                        <span class="badge text-bg-secondary">
                          Tipo: {{ activeChat.view.tipo_equipo || "N/D" }}
                        </span>
                      </div>

                      <!-- Respuesta -->
                      <div v-if="activeChat.view.respuesta" class="mb-3">
                        <div class="fw-semibold mb-1">Respuesta</div>

                        <!-- ✅ respuesta ploma -->
                        <div class="border rounded p-2 bg-body-tertiary" style="white-space: pre-wrap;">
                          <span v-if="!showFullAnswer">{{ typedRespuesta }}</span>
                          <span v-else>{{ activeChat.view.respuesta }}</span>
                          <span v-if="isTyping && !showFullAnswer" class="typing-caret">▍</span>
                        </div>
                      </div>

                      <!-- Fotos del chat (lazy) -->
                      <div class="mb-3">
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="fw-semibold">Fotos asociadas</div>
                          <button
                            class="btn btn-sm btn-outline-secondary"
                            @click="togglePhotos"
                            :disabled="photosLoading"
                            type="button"
                          >
                            <span v-if="photosLoading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi" :class="photosOpen ? 'bi-eye-slash' : 'bi-eye'"></i>
                            {{ photosOpen ? "Ocultar" : "Ver" }}
                          </button>
                        </div>

                        <Transition name="fade">
                          <div v-if="photosOpen" class="mt-2">
                            <div v-if="photosLoading" class="text-muted small d-flex align-items-center gap-2">
                              <span class="spinner-border spinner-border-sm"></span>
                              Cargando fotos...
                            </div>

                            <div v-else-if="!photoUrls.length" class="text-muted small">
                              No hay fotos guardadas para este chat.
                            </div>

                            <TransitionGroup v-else name="thumb" tag="div" class="d-flex flex-wrap gap-2">
                              <a
                                v-for="u in photoUrls"
                                :key="u"
                                class="border rounded p-1 bg-light thumb-card"
                                style="width: 104px;"
                                :href="u"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img :src="u" class="img-fluid rounded" style="height:80px; object-fit:cover; width:100%;" />
                              </a>
                            </TransitionGroup>
                          </div>
                        </Transition>
                      </div>

                      <!-- Secciones -->
                      <div class="row g-3">
                        <div class="col-12" v-if="activeChat.view.riesgos_criticos?.length">
                          <div class="fw-semibold mb-1">Riesgos críticos</div>
                          <TransitionGroup name="block" tag="div" class="d-flex flex-column gap-2">
                            <div
                              v-for="(r, i) in activeChat.view.riesgos_criticos"
                              :key="(r.titulo || 'r') + i"
                              class="border rounded p-2 block"
                            >
                              <div class="d-flex align-items-center justify-content-between">
                                <div class="fw-semibold">{{ r.titulo }}</div>
                                <span class="badge" :class="riskBadgeClass(r.riesgo)">{{ r.riesgo || "N/D" }}</span>
                              </div>
                              <div class="small text-muted mt-1" v-if="r.detalle">{{ r.detalle }}</div>
                              <div class="small mt-1" v-if="r.accion"><b>Acción:</b> {{ r.accion }}</div>
                            </div>
                          </TransitionGroup>
                        </div>

                        <div class="col-12" v-if="activeChat.view.faltantes_estandares?.length">
                          <div class="fw-semibold mb-1">Faltantes / Estándares</div>
                          <TransitionGroup name="block" tag="div" class="d-flex flex-column gap-2">
                            <div
                              v-for="(f, i) in activeChat.view.faltantes_estandares"
                              :key="(f.item || 'f') + i"
                              class="border rounded p-2 block"
                            >
                              <div class="d-flex align-items-center justify-content-between">
                                <div class="fw-semibold">{{ f.item }}</div>
                                <span class="badge" :class="riskBadgeClass(f.riesgo)">{{ f.riesgo || "N/D" }}</span>
                              </div>
                              <div class="small text-muted mt-1" v-if="f.por_que"><b>Por qué:</b> {{ f.por_que }}</div>
                              <div class="small mt-1" v-if="f.accion"><b>Acción:</b> {{ f.accion }}</div>
                            </div>
                          </TransitionGroup>
                        </div>

                        <div class="col-12" v-if="activeChat.view.hallazgos?.length">
                          <div class="fw-semibold mb-1">Hallazgos</div>
                          <TransitionGroup name="block" tag="div" class="d-flex flex-column gap-2">
                            <div
                              v-for="(h, i) in activeChat.view.hallazgos"
                              :key="(h.titulo || 'h') + i"
                              class="border rounded p-2 block"
                            >
                              <div class="d-flex align-items-center justify-content-between">
                                <div class="fw-semibold">{{ h.titulo }}</div>
                                <span class="badge" :class="riskBadgeClass(h.riesgo)">{{ h.riesgo || "N/D" }}</span>
                              </div>
                              <div class="small text-muted mt-1" v-if="h.detalle">{{ h.detalle }}</div>
                              <div class="small mt-1" v-if="h.accion"><b>Acción:</b> {{ h.accion }}</div>
                              <div class="small text-muted mt-1" v-if="h.evidencia"><b>Evidencia:</b> {{ h.evidencia }}</div>
                            </div>
                          </TransitionGroup>
                        </div>

                        <div class="col-12" v-if="activeChat.view.documentos_detectados?.length">
                          <div class="fw-semibold mb-1">Documentos detectados</div>
                          <div class="table-responsive">
                            <table class="table table-sm align-middle mb-0">
                              <thead>
                                <tr>
                                  <th>Tipo</th>
                                  <th>Fecha</th>
                                  <th>Vencido</th>
                                  <th>Nota</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(d, i) in activeChat.view.documentos_detectados" :key="(d.tipo || 'd') + i">
                                  <td class="fw-semibold">{{ d.tipo }}</td>
                                  <td>{{ d.fecha || "N/D" }}</td>
                                  <td>
                                    <span
                                      class="badge"
                                      :class="d.esta_vencido === true ? 'text-bg-danger' : d.esta_vencido === false ? 'text-bg-success' : 'text-bg-secondary'"
                                    >
                                      {{ d.esta_vencido === true ? "Sí" : d.esta_vencido === false ? "No" : "N/D" }}
                                    </span>
                                  </td>
                                  <td class="small text-muted">{{ d.nota || "" }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div class="col-12" v-if="activeChat.view.acciones_recomendadas?.length">
                          <div class="fw-semibold mb-1">Acciones recomendadas</div>
                          <ul class="mb-0">
                            <li v-for="(a, i) in activeChat.view.acciones_recomendadas" :key="a + i">{{ a }}</li>
                          </ul>
                        </div>

                        <div class="col-12" v-if="activeChat.view.fotos_recomendadas?.length">
                          <div class="fw-semibold mb-1">Fotos recomendadas</div>
                          <ul class="mb-0">
                            <li v-for="(x, i) in activeChat.view.fotos_recomendadas" :key="x + i">{{ x }}</li>
                          </ul>
                        </div>

                        <div class="col-12" v-if="activeChat.view.resumen">
                          <div class="fw-semibold mb-1">Resumen (Obs / Falta / Riesgo / Acción)</div>
                          <div class="row g-2">
                            <div class="col-12 col-md-6">
                              <div class="border rounded p-2">
                                <div class="fw-semibold mb-1">Observado</div>
                                <ul class="mb-0">
                                  <li v-for="(x,i) in (activeChat.view.resumen.observado || [])" :key="'o'+i">{{ x }}</li>
                                </ul>
                              </div>
                            </div>
                            <div class="col-12 col-md-6">
                              <div class="border rounded p-2">
                                <div class="fw-semibold mb-1">Falta</div>
                                <ul class="mb-0">
                                  <li v-for="(x,i) in (activeChat.view.resumen.falta || [])" :key="'f'+i">{{ x }}</li>
                                </ul>
                              </div>
                            </div>
                            <div class="col-12 col-md-6">
                              <div class="border rounded p-2">
                                <div class="fw-semibold mb-1">Riesgo</div>
                                <ul class="mb-0">
                                  <li v-for="(x,i) in (activeChat.view.resumen.riesgo || [])" :key="'r'+i">{{ x }}</li>
                                </ul>
                              </div>
                            </div>
                            <div class="col-12 col-md-6">
                              <div class="border rounded p-2">
                                <div class="fw-semibold mb-1">Acción</div>
                                <ul class="mb-0">
                                  <li v-for="(x,i) in (activeChat.view.resumen.accion || [])" :key="'a'+i">{{ x }}</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Transition name="fade">
                        <div v-if="showRaw" class="mt-3">
                          <div class="fw-semibold mb-1">JSON completo</div>
                          <pre class="border rounded p-2 mb-0 bg-body-tertiary" style="white-space: pre-wrap;">{{ activeChat.answerRaw }}</pre>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <div v-else class="mt-2 border rounded p-2 bg-body-tertiary" style="white-space: pre-wrap;">
                    {{ activeChat.answerRaw }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="alert alert-warning mb-0">
          <strong>Nota:</strong> La IA puede equivocarse. Úsala como apoyo y valida con tus estándares/procedimientos.
        </div>
      </div>
    </div>

    <!-- MODAL: Pregunta libre -->
    <Transition name="fade">
      <div
        v-if="freeModalOpen"
        class="modal fade show"
        style="display:block;"
        tabindex="-1"
        role="dialog"
        @click.self="closeFreeModal"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content modal-anim">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-chat-left-text me-1"></i> Pregunta libre</h5>
              <button type="button" class="btn-close" @click="closeFreeModal"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">Escribe tu pregunta</label>
              <textarea
                ref="freeInput"
                class="form-control"
                rows="4"
                v-model="freeQuestionText"
                placeholder="Ej: ¿Qué fotos debo tomar para verificar extintor / baliza / fugas?"
                @keydown.ctrl.enter.prevent="submitFreeModal"
              ></textarea>
              <div class="form-text">
                Tip: <b>Ctrl + Enter</b> para enviar · <b>ESC</b> para cerrar
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="closeFreeModal" :disabled="loading" type="button">Cancelar</button>
              <button class="btn btn-primary" @click="submitFreeModal" :disabled="loading || !freeQuestionText.trim()" type="button">
                <i class="bi bi-send me-1"></i> Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="freeModalOpen" class="modal-backdrop fade show"></div>
    </Transition>

    <!-- MODAL: Gestionar preguntas -->
    <Transition name="fade">
      <div
        v-if="questionsModalOpen"
        class="modal fade show"
        style="display:block;"
        tabindex="-1"
        role="dialog"
        @click.self="closeQuestionsManager"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div class="modal-content modal-anim">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-list-check me-1"></i> Preguntas guardadas
              </h5>
              <button type="button" class="btn-close" @click="closeQuestionsManager"></button>
            </div>

            <div class="modal-body">
              <div class="input-group mb-2">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control" v-model="questionsFilter" placeholder="Buscar pregunta..." />
                <button class="btn btn-outline-secondary" @click="reloadQuestions" :disabled="loading" type="button">
                  <i class="bi bi-arrow-repeat"></i>
                </button>
              </div>

              <div v-if="questionsFiltered.length === 0" class="text-muted small">
                No hay preguntas guardadas.
              </div>

              <div v-else class="list-group">
                <div
                  v-for="q in questionsFiltered"
                  :key="q.id"
                  class="list-group-item d-flex align-items-start justify-content-between gap-3"
                >
                  <div class="flex-grow-1">
                    <div class="fw-semibold">{{ q.text }}</div>
                    <div class="small text-muted">
                      Usada: {{ q.timesUsed ?? 0 }} · Último uso: {{ q.lastUsedAtLabel || "N/D" }}
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" @click="useQuestion(q.text)" type="button">
                      <i class="bi bi-check2-circle me-1"></i> Usar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteQuestion(q)" type="button">
                      <i class="bi bi-trash me-1"></i> Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div class="small text-muted mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Las preguntas del select combinan presets + `ai_questions`.
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="closeQuestionsManager" type="button">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="questionsModalOpen" class="modal-backdrop fade show"></div>
    </Transition>

    <!-- ✅ MODAL: Confirmar eliminar chat -->
    <Transition name="fade">
      <div
        v-if="deleteChatModalOpen"
        class="modal fade show"
        style="display:block;"
        tabindex="-1"
        role="dialog"
        @click.self="closeDeleteChatModal"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content modal-anim">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-trash me-1"></i> Eliminar chat
              </h5>
              <button type="button" class="btn-close" @click="closeDeleteChatModal" :disabled="loading"></button>
            </div>

            <div class="modal-body">
              <div class="mb-2">¿Seguro que deseas eliminar este chat?</div>

              <div class="border rounded p-2 bg-body-tertiary">
                <div class="fw-semibold">
                  {{ deleteChatTarget?.codigo || "SIN CÓDIGO" }}
                </div>
                <div class="small text-muted clamp-2">
                  {{ deleteChatTarget?.question || "" }}
                </div>
              </div>

              <div class="small text-muted mt-2">
                Esto borrará también sus fotos asociadas.
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline-secondary" @click="closeDeleteChatModal" :disabled="loading" type="button">
                Cancelar
              </button>
              <button class="btn btn-danger" @click="confirmDeleteChatModal" :disabled="loading" type="button">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="deleteChatModalOpen" class="modal-backdrop fade show"></div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  ref as sRef,
  listAll,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { auth, db, storage } from "@/stores/firebase";
import { askInspectorAI, resetAiChat } from "@/services/aiInspector";
import { fetchEquiposList } from "@/services/equiposService";
import { saveInspection } from "@/services/aiMemory";
import { fetchQuestions, upsertQuestion } from "@/services/aiQuestions";

/** ✅ Debe coincidir con tu saveInspection(): collection(db,"inspecciones") */
const COLLECTION_INSPECTIONS = "ai_inspections";

/** Presets */
const presetQuestions = [
  "¿Qué cosas le faltan para cumplir estándares mineros visibles en la foto?",
  "¿Ves riesgos críticos evidentes? Lista y prioriza.",
  "¿Qué EPP o señalización debería estar presente y no se ve?",
  "¿Qué checklist de inspección rápida recomiendas para este equipo?",
  "Resume hallazgos en: Observado / Falta / Riesgo / Acción recomendada.",
  "Indica qué fotos faltan (sectores) para confirmar cumplimiento y por qué.",
];

/** Equipos */
const equipos = ref([]);
const equiposLoading = ref(false);
const equiposFilter = ref("");
const selectedEquipoId = ref("");

const equiposDropdownOpen = ref(false);
const activeEquipoIndex = ref(0);
const equiposBox = ref(null);
const equiposInput = ref(null);

const selectedEquipo = computed(
  () => equipos.value.find((e) => e.id === selectedEquipoId.value) || null
);
const equiposFilterTrim = computed(() => (equiposFilter.value || "").trim());

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function makeHaystack(e) {
  return norm(
    [
      e.codigo,
      e.equipo,
      e.tipo_equipo,
      e.clasificacion1,
      e.marca,
      e.modelo,
      e.localizacion,
      e.numero_chasis,
      String(e.ano ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/**
 * ✅ 645 equipos: muestra todos.
 * Si escribes SOLO 1 letra ("s") -> prioriza los que PARTEN con esa letra en campos principales.
 */
const equiposFiltered = computed(() => {
  const q = norm(equiposFilterTrim.value);
  if (!q) return equipos.value;

  const terms = q.split(/\s+/).filter(Boolean);
  const isShort = terms.length === 1 && terms[0].length === 1;
  const term = terms[0];

  const out = equipos.value
    .map((e) => {
      const hay = makeHaystack(e);
      const primaryFields = [
        norm(e.codigo),
        norm(e.equipo),
        norm(e.marca),
        norm(e.modelo),
        norm(e.tipo_equipo || e.clasificacion1),
        norm(e.localizacion),
      ].filter(Boolean);

      let score = 0;

      const ok = terms.every((t) => {
        if (!t) return true;

        if (isShort) {
          const startsInField = primaryFields.some((f) => f.startsWith(t));
          const startsInWord = primaryFields.some((f) =>
            f.split(/\s+/).some((w) => w.startsWith(t))
          );
          if (startsInField || startsInWord) {
            score += 60;
            return true;
          }
          if (hay.includes(t)) {
            score += 10;
            return true;
          }
          return false;
        }

        if (hay.includes(t)) {
          const prefix = primaryFields.some(
            (f) => f.startsWith(t) || f.split(/\s+/).some((w) => w.startsWith(t))
          );
          score += prefix ? 40 : 15;
          return true;
        }
        return false;
      });

      if (isShort) {
        const prefix = primaryFields.some(
          (f) => f.startsWith(term) || f.split(/\s+/).some((w) => w.startsWith(term))
        );
        if (prefix) score += 20;
      }

      return ok ? { e, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);

  return out;
});

function openEquiposDropdown() {
  if (!equipos.value.length) return;
  equiposDropdownOpen.value = true;
  activeEquipoIndex.value = 0;
}
function toggleEquiposDropdown() {
  if (!equipos.value.length) return;
  equiposDropdownOpen.value = !equiposDropdownOpen.value;
  activeEquipoIndex.value = 0;
}
function clearEquiposSearch() {
  equiposFilter.value = "";
  activeEquipoIndex.value = 0;
  openEquiposDropdown();
  nextTick(() => equiposInput.value?.focus?.());
}
function clearSelectedEquipo() {
  selectedEquipoId.value = "";
  openEquiposDropdown();
  nextTick(() => equiposInput.value?.focus?.());
}
function moveActive(delta) {
  if (!equiposDropdownOpen.value) openEquiposDropdown();
  const n = equiposFiltered.value.length;
  if (!n) return;
  activeEquipoIndex.value = Math.max(0, Math.min(n - 1, activeEquipoIndex.value + delta));
  nextTick(() => {
    const menu = equiposBox.value?.querySelector?.(".dropdown-menu");
    const active = menu?.querySelector?.(".dropdown-item.is-active");
    if (menu && active) {
      const top = active.offsetTop - 120;
      menu.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  });
}
function selectActive() {
  const e = equiposFiltered.value[activeEquipoIndex.value];
  if (e) selectEquipo(e);
}
function selectEquipo(e) {
  selectedEquipoId.value = e.id;
  equiposFilter.value = e.codigo || "";
  equiposDropdownOpen.value = false;
}

/** Preguntas guardadas */
const savedQuestions = ref([]);
const questionOptions = computed(() => {
  const preset = presetQuestions;
  const custom = savedQuestions.value.map((x) => x.text).filter(Boolean);

  const seen = new Set();
  const all = [];
  for (const q of [...preset, ...custom]) {
    const k = (q || "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    all.push(k);
  }
  return all;
});
const selectedQuestion = ref("");
const selectedSavedQuestion = computed(() => {
  const txt = (selectedQuestion.value || "").trim();
  if (!txt) return null;
  return savedQuestions.value.find((x) => (x.text || "").trim() === txt) || null;
});

/** Form */
const extraNotes = ref("");
const files = ref([]);
const previews = ref([]);
const loading = ref(false);
const error = ref("");

/** Historial */
const history = ref([]);
const historyLoading = ref(false);
const historyFilter = ref("");

const activeChatId = ref("");
const activeChat = ref(null);
const pendingChat = ref(null);
const showRaw = ref(false);

/** Fotos del chat */
const photosOpen = ref(false);
const photosLoading = ref(false);
const photoUrls = ref([]);

/** Typing */
const typedRespuesta = ref("");
const isTyping = ref(false);
const showFullAnswer = ref(false);
let typingTimer = null;

/** Modals */
const freeModalOpen = ref(false);
const freeQuestionText = ref("");
const freeInput = ref(null);

const questionsModalOpen = ref(false);
const questionsFilter = ref("");

/** ✅ Modal eliminar chat */
const deleteChatModalOpen = ref(false);
const deleteChatTarget = ref(null);

const activeHeaderTs = computed(() => pendingChat.value?.tsLabel || activeChat.value?.tsLabel || "");
const activeHeaderCodigo = computed(() => pendingChat.value?.codigo || activeChat.value?.codigo || "");

/** Utils */
function nowStampLabel(dateOrTs) {
  try {
    const d = dateOrTs?.toDate ? dateOrTs.toDate() : dateOrTs instanceof Date ? dateOrTs : new Date();
    return d.toLocaleString();
  } catch {
    return new Date().toLocaleString();
  }
}
function riskBadgeClass(level) {
  const v = String(level || "").toUpperCase();
  if (v === "ALTO") return "text-bg-danger";
  if (v === "MEDIO") return "text-bg-warning";
  if (v === "BAJO") return "text-bg-success";
  return "text-bg-secondary";
}
function tryParseJSON(text) {
  try {
    const t = String(text || "").trim();
    if (!t) return null;
    const cleaned = t.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
function asItems(arr, fallbackKey = "titulo") {
  return (Array.isArray(arr) ? arr : [])
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string") return { [fallbackKey]: x };
      return x;
    })
    .filter(Boolean);
}
function normalizeAI(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  return {
    focus: parsed.focus ?? "GENERAL",
    respuesta: parsed.respuesta ?? "",
    tipo_equipo: parsed.tipo_equipo ?? null,
    confianza_tipo: parsed.confianza_tipo ?? null,
    hallazgos: asItems(parsed.hallazgos),
    faltantes_estandares: asItems(parsed.faltantes_estandares, "item"),
    riesgos_criticos: asItems(parsed.riesgos_criticos),
    acciones_recomendadas: (Array.isArray(parsed.acciones_recomendadas) ? parsed.acciones_recomendadas : []).filter(Boolean),
    documentos_detectados: asItems(parsed.documentos_detectados, "tipo"),
    fotos_recomendadas: (Array.isArray(parsed.fotos_recomendadas) ? parsed.fotos_recomendadas : []).filter(Boolean),
    resumen: parsed.resumen && typeof parsed.resumen === "object" ? parsed.resumen : null,
  };
}

/** Typing */
function stopTyping() {
  isTyping.value = false;
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}
function startTyping(fullText) {
  stopTyping();
  typedRespuesta.value = "";
  showFullAnswer.value = false;

  const text = String(fullText || "");
  if (!text) return;

  isTyping.value = true;
  let i = 0;
  const speed = text.length > 1200 ? 4 : text.length > 600 ? 8 : 14;

  typingTimer = setInterval(() => {
    i += 1;
    typedRespuesta.value = text.slice(0, i);
    if (i >= text.length) stopTyping();
  }, speed);
}
function toggleFullAnswer() {
  if (!activeChat.value?.view?.respuesta) return;
  if (!showFullAnswer.value) {
    showFullAnswer.value = true;
    stopTyping();
    typedRespuesta.value = activeChat.value.view.respuesta || "";
  } else {
    showFullAnswer.value = false;
    startTyping(activeChat.value.view.respuesta || "");
  }
}

/** Equipos */
async function reloadEquipos() {
  equiposLoading.value = true;
  try {
    equipos.value = await fetchEquiposList(1000);
  } catch (e) {
    console.error(e);
  } finally {
    equiposLoading.value = false;
  }
}

/** Preguntas */
function tsLabelFromFirestore(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : null;
    return d ? d.toLocaleString() : null;
  } catch {
    return null;
  }
}
async function reloadQuestions() {
  try {
    const list = await fetchQuestions({ max: 120 });
    savedQuestions.value = list.map((x) => ({
      ...x,
      lastUsedAtLabel: tsLabelFromFirestore(x.lastUsedAt),
    }));
  } catch (e) {
    console.error(e);
  }
}
const questionsFiltered = computed(() => {
  const t = (questionsFilter.value || "").trim().toLowerCase();
  if (!t) return savedQuestions.value;
  return savedQuestions.value.filter((q) => (q.text || "").toLowerCase().includes(t));
});

/** Historial */
async function loadHistory() {
  historyLoading.value = true;
  try {
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      history.value = [];
      return;
    }

    const qy = query(
      collection(db, COLLECTION_INSPECTIONS),
      where("createdBy", "==", uid),
      limit(120)
    );

    const snap = await getDocs(qy);

    const list = snap.docs.map((d) => {
      const data = d.data() || {};
      const codigo = data.equipoCodigo || data.codigo || data?.equipo?.codigo || null;
      return {
        id: d.id,
        createdAt: data.createdAt || null,
        tsLabel: nowStampLabel(data.createdAt),
        codigo,
        question: data.question || "",
      };
    });

    list.sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return tb - ta;
    });

    history.value = list;
  } catch (e) {
    console.error(e);
  } finally {
    historyLoading.value = false;
  }
}
const historyFiltered = computed(() => {
  const t = (historyFilter.value || "").trim().toLowerCase();
  if (!t) return history.value;
  return history.value.filter((h) => `${h.codigo || ""} ${h.question || ""}`.toLowerCase().includes(t));
});

/** Abrir chat */
async function openChat(id) {
  stopTyping();
  photosOpen.value = false;
  photoUrls.value = [];

  activeChatId.value = id;
  showRaw.value = false;
  error.value = "";
  pendingChat.value = null;

  try {
    const snap = await getDoc(doc(db, COLLECTION_INSPECTIONS, id));
    if (!snap.exists()) {
      activeChat.value = null;
      return;
    }

    const data = snap.data() || {};
    const codigo = data.equipoCodigo || data.codigo || data?.equipo?.codigo || null;

    const parsed = tryParseJSON(data.answerRaw);
    const view = normalizeAI(parsed);

    activeChat.value = {
      id,
      tsLabel: nowStampLabel(data.createdAt),
      codigo,
      question: data.question || "",
      extraNotes: data.extraNotes || "",
      answerRaw: data.answerRaw || "",
      view,
    };

    if (activeChat.value?.view?.respuesta) startTyping(activeChat.value.view.respuesta);
    else {
      typedRespuesta.value = "";
      isTyping.value = false;
    }
  } catch (e) {
    console.error(e);
    error.value = e?.message || "No se pudo abrir el chat.";
    activeChat.value = null;
  }
}

/** Fotos del chat */
async function loadChatPhotos(chatId) {
  photosLoading.value = true;
  try {
    const folder = sRef(storage, `ai_inspections/${chatId}`);
    const res = await listAll(folder);

    const items = res.items.slice(0, 18);
    const urls = [];
    for (const it of items) {
      const u = await getDownloadURL(it);
      urls.push(u);
    }
    photoUrls.value = urls;
  } catch (e) {
    console.warn("No se pudieron cargar fotos:", e);
    photoUrls.value = [];
  } finally {
    photosLoading.value = false;
  }
}
async function togglePhotos() {
  photosOpen.value = !photosOpen.value;
  if (photosOpen.value && activeChatId.value && photoUrls.value.length === 0) {
    await loadChatPhotos(activeChatId.value);
  }
}

/** Nuevo chat */
function newChat() {
  stopTyping();
  photosOpen.value = false;
  photoUrls.value = [];
  activeChatId.value = "";
  activeChat.value = null;
  pendingChat.value = null;
  showRaw.value = false;
  error.value = "";
  resetAiChat();
}

/** Imágenes */
function onPick(e) {
  const picked = Array.from(e.target.files || []);
  if (!picked.length) return;

  previews.value.forEach((u) => URL.revokeObjectURL(u));
  files.value = picked;
  previews.value = picked.map((f) => URL.createObjectURL(f));
}
function removeImg(idx) {
  const url = previews.value[idx];
  if (url) URL.revokeObjectURL(url);
  previews.value.splice(idx, 1);
  files.value.splice(idx, 1);
}
function clearImgs() {
  previews.value.forEach((u) => URL.revokeObjectURL(u));
  files.value = [];
  previews.value = [];
}

/** Reset */
function resetAll() {
  newChat();
  selectedEquipoId.value = "";
  equiposFilter.value = "";
  historyFilter.value = "";
  selectedQuestion.value = "";
  extraNotes.value = "";
  clearImgs();
  error.value = "";
}

/** Modal pregunta libre */
async function openFreeModal() {
  freeQuestionText.value = "";
  freeModalOpen.value = true;
  await nextTick();
  freeInput.value?.focus?.();
}
function closeFreeModal() {
  freeModalOpen.value = false;
}
async function submitFreeModal() {
  const q = freeQuestionText.value.trim();
  if (!q) return;
  closeFreeModal();
  selectedQuestion.value = q;
  await sendWithQuestion(q);
}

/** Modal gestionar preguntas */
function openQuestionsManager() {
  questionsFilter.value = "";
  questionsModalOpen.value = true;
}
function closeQuestionsManager() {
  questionsModalOpen.value = false;
}
function useQuestion(text) {
  selectedQuestion.value = text;
  closeQuestionsManager();
}

/** Enviar */
async function send() {
  await sendWithQuestion(selectedQuestion.value);
}
async function sendWithQuestion(q) {
  error.value = "";

  if (!selectedEquipoId.value) {
    error.value = "Debes seleccionar una patente/código antes de enviar.";
    return;
  }
  if (!q || !String(q).trim()) {
    error.value = "Selecciona o escribe una pregunta.";
    return;
  }

  loading.value = true;
  newChat();

  pendingChat.value = {
    tsLabel: new Date().toLocaleString(),
    codigo: selectedEquipo.value?.codigo || "",
    question: q,
    extraNotes: extraNotes.value || "",
  };

  try {
    const userId = auth?.currentUser?.uid || null;
    await upsertQuestion({ text: q, userId });
    await reloadQuestions();
  } catch (e) {
    console.warn("No se pudo guardar la pregunta:", e);
  }

  try {
    const answer = await askInspectorAI({
      question: q,
      files: files.value,
      extraNotes: extraNotes.value,
      equipo: selectedEquipo.value,
    });

    const userId = auth?.currentUser?.uid || null;
    const saved = await saveInspection({
      equipo: selectedEquipo.value,
      question: q,
      extraNotes: extraNotes.value,
      answerRaw: answer,
      files: files.value,
      userId,
    });

    await loadHistory();

    pendingChat.value = null;

    if (saved?.id) await openChat(saved.id);
    else if (history.value.length) await openChat(history.value[0].id);

    clearImgs();
  } catch (e) {
    console.error(e);
    pendingChat.value = null;
    error.value = e?.message || "Error llamando a Vertex AI. Revisa consola.";
  } finally {
    loading.value = false;
  }
}

/** ✅ Eliminar chat: ahora abre MODAL */
function confirmDeleteChat(h) {
  const id = h?.id;
  if (!id) return;

  deleteChatTarget.value = {
    id,
    codigo: h?.codigo || "SIN CÓDIGO",
    question: h?.question || "",
  };
  deleteChatModalOpen.value = true;
}
function closeDeleteChatModal() {
  if (loading.value) return;
  deleteChatModalOpen.value = false;
  deleteChatTarget.value = null;
}
async function confirmDeleteChatModal() {
  const id = deleteChatTarget.value?.id;
  if (!id) return closeDeleteChatModal();

  await deleteChatAndPhotos(id);
  closeDeleteChatModal();
}

async function deleteChatAndPhotos(chatId) {
  try {
    loading.value = true;

    try {
      const folder = sRef(storage, `ai_inspections/${chatId}`);
      const res = await listAll(folder);
      await Promise.allSettled(res.items.map((it) => deleteObject(it)));
    } catch (e) {
      console.warn("No se pudieron borrar algunas fotos:", e);
    }

    await deleteDoc(doc(db, COLLECTION_INSPECTIONS, chatId));

    if (activeChatId.value === chatId) newChat();
    await loadHistory();
  } catch (e) {
    console.error(e);
    error.value = e?.message || "No se pudo eliminar el chat.";
  } finally {
    loading.value = false;
  }
}

/** Eliminar pregunta (lo dejé como confirm nativo, si quieres lo pasamos a modal también) */
function confirmDeleteQuestion(q) {
  const id = q?.id;
  if (!id) return;
  const ok = window.confirm(`¿Eliminar esta pregunta?\n\n"${q.text}"`);
  if (!ok) return;
  deleteQuestionById(id);
}
async function deleteQuestionById(id) {
  try {
    loading.value = true;
    await deleteDoc(doc(db, "ai_questions", id));
    await reloadQuestions();
    if (selectedSavedQuestion.value?.id === id) selectedQuestion.value = "";
  } catch (e) {
    console.error(e);
    error.value = e?.message || "No se pudo eliminar la pregunta.";
  } finally {
    loading.value = false;
  }
}

/** Cerrar con ESC + click afuera dropdown equipos */
function onKeydown(ev) {
  if (ev.key === "Escape") {
    if (deleteChatModalOpen.value) closeDeleteChatModal();
    if (freeModalOpen.value) closeFreeModal();
    if (questionsModalOpen.value) closeQuestionsManager();
    if (equiposDropdownOpen.value) equiposDropdownOpen.value = false;
  }
}
function onDocClick(ev) {
  const el = equiposBox.value;
  if (!el) return;
  if (equiposDropdownOpen.value && !el.contains(ev.target)) {
    equiposDropdownOpen.value = false;
  }
}

/** Lifecycle */
let unsubAuth = null;

onMounted(async () => {
  await reloadEquipos();
  await reloadQuestions();

  window.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocClick);

  unsubAuth = onAuthStateChanged(auth, async (u) => {
    if (u) await loadHistory();
    else history.value = [];
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocClick);

  if (typeof unsubAuth === "function") unsubAuth();
  stopTyping();

  previews.value.forEach((u) => URL.revokeObjectURL(u));
});

/** Watches */
watch(activeChatId, () => {
  showFullAnswer.value = false;
});
</script>

<style scoped>
/* Layout */
.page-root {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* ✅ Dropdown equipos: active = bg-info-subtle */
.dropdown-item.is-active {
  background-color: var(--bs-info-bg-subtle);
  color: var(--bs-body-color);
}
.dropdown-item.is-active .text-muted,
.dropdown-item.is-active .opacity-75 {
  color: rgba(0, 0, 0, 0.65) !important;
}
.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
.dropdown-item.is-active:active {
  background-color: var(--bs-info-bg-subtle);
  color: var(--bs-body-color);
}

/* Historial */
.history-scroll {
  overflow: auto;
  border-radius: 12px;
  min-height: 420px;
  max-height: calc(100vh - 290px);
}

/* ✅ evita “azul link” y deja texto normal */
.history-btn {
  border: 0;
  width: 100%;
  background: transparent;
  color: var(--bs-body-color);
  text-decoration: none;
}
.history-btn:focus {
  box-shadow: none;
}
.history-btn:hover {
  filter: brightness(0.98);
}

.clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Chat */
.chat-card {
  overflow: hidden;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  z-index: 5;
}
.loading-panel {
  background: white;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 6px 22px rgba(0,0,0,.08);
  min-width: 260px;
}

/* Chat bubbles */
.chat-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.msg-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.msg-bubble {
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 1px 0 rgba(0,0,0,.03);
}
.msg-user .msg-bubble { border-top-left-radius: 8px; }
.msg-ai .msg-bubble { border-top-right-radius: 8px; }

/* Typing dots */
.typing-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: rgba(0,0,0,.45);
  margin-right: 4px;
  animation: dots 1s infinite ease-in-out;
}
.typing-dots span:nth-child(2) { animation-delay: .15s; }
.typing-dots span:nth-child(3) { animation-delay: .30s; }
@keyframes dots {
  0%, 80%, 100% { transform: translateY(0); opacity: .35; }
  40% { transform: translateY(-3px); opacity: .85; }
}

/* caret */
.typing-caret {
  display: inline-block;
  margin-left: 4px;
  animation: caret 1s steps(1) infinite;
  opacity: .8;
}
@keyframes caret { 50% { opacity: 0; } }

/* Skeleton */
.skeleton {
  height: 12px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.12), rgba(0,0,0,.06));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Small pop */
.appear { animation: pop .22s ease-out; }
@keyframes pop {
  from { transform: translateY(6px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-anim { animation: pop .22s ease-out; }

.thumb-card {
  transition: transform .15s ease, box-shadow .15s ease;
}
.thumb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(0,0,0,.10);
}

/* Vue transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.list-enter-active, .list-leave-active { transition: all .18s ease; }
.list-enter-from { opacity: 0; transform: translateY(8px); }
.list-leave-to { opacity: 0; transform: translateY(-6px); }

.block-enter-active, .block-leave-active { transition: opacity .18s ease, transform .18s ease; }
.block-enter-from, .block-leave-to { opacity: 0; transform: translateY(8px); }

.thumb-enter-active, .thumb-leave-active { transition: opacity .18s ease, transform .18s ease; }
.thumb-enter-from, .thumb-leave-to { opacity: 0; transform: scale(.96); }

/* Dropdown equipos */
.drop-enter-active, .drop-leave-active {
  transition: opacity .14s ease, transform .14s ease;
}
.drop-enter-from, .drop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
</style>
