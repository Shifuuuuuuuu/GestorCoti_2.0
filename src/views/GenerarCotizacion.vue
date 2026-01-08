<!-- src/views/GenerarCotizacion.vue -->
<template>
  <div class="container py-4 py-lg-5">
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2">
      <div>
        <h1 class="h4 mb-0 fw-bold">Generar Cotización</h1>
        <div class="text-muted small">Formulario + cálculo automático + PDF + Firestore</div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="resetForm" :disabled="saving">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Limpiar
        </button>

        <button class="btn btn-primary" @click="guardarYGenerar" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-filetype-pdf me-1"></i>
          Guardar y Generar PDF
        </button>
      </div>
    </div>

    <div class="row g-3">
      <!-- Col izquierda: formulario -->
      <div class="col-12 col-lg-7">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h2 class="h6 fw-bold mb-0">Datos de Cotización</h2>
              <span class="badge text-bg-light border">IVA: {{ Math.round(ivaRate * 100) }}%</span>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Fecha</label>
                <input type="date" class="form-control" v-model="form.fecha" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold">Empresa (Cliente)</label>
                <input class="form-control" v-model.trim="form.clienteEmpresa" placeholder="Ej: Xtreme Mining" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold">Texto de presentación</label>
                <textarea class="form-control" rows="2" v-model.trim="form.textoPresentacion"></textarea>
              </div>
            </div>

            <hr class="my-4" />

            <div class="d-flex align-items-center justify-content-between mb-2">
              <h2 class="h6 fw-bold mb-0">Ítems</h2>
              <div class="small text-muted">Aquí solo editas: descripción, valor unitario y cantidad</div>
            </div>

            <!-- ✅ Form: SOLO inputs (sin neto/iva/total) -->
            <div class="table-responsive table-center">
              <table class="table align-middle table-fixed">
                <thead>
                  <tr class="table-danger">
                    <th style="min-width: 320px;">Descripción</th>
                    <th class="text-end" style="min-width: 160px;">Valor Unitario</th>
                    <th class="text-end" style="min-width: 120px;">Cantidad</th>
                    <th style="width: 1px;"></th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(it, idx) in form.items" :key="it.id">
                    <td>
                      <input
                        class="form-control"
                        v-model.trim="it.descripcion"
                        placeholder="Ej: Rueda bobcat modelo XYZ..."
                      />
                      <div v-if="errors[`item_desc_${idx}`]" class="text-danger small mt-1">
                        {{ errors[`item_desc_${idx}`] }}
                      </div>
                    </td>

                    <td class="text-end">
                      <input
                        type="number"
                        class="form-control text-end"
                        v-model.number="it.valorUnitario"
                        min="0"
                        step="1"
                      />
                    </td>

                    <td class="text-end">
                      <input
                        type="number"
                        class="form-control text-end"
                        v-model.number="it.cantidad"
                        min="0"
                        step="1"
                      />
                    </td>

                    <td class="text-end">
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="removeItem(idx)"
                        :disabled="form.items.length === 1 || saving"
                        title="Eliminar ítem"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr>
                    <td colspan="4">
                      <button class="btn btn-outline-primary" @click="addItem" :disabled="saving">
                        <i class="bi bi-plus-circle me-1"></i> Agregar ítem
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <hr class="my-4" />

            <h2 class="h6 fw-bold mb-3">Condiciones</h2>
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Plazo de entrega</label>
                <input class="form-control" v-model.trim="form.plazoEntrega" placeholder="Ej: 2 días hábiles" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Validez</label>
                <input class="form-control" v-model.trim="form.validez" placeholder="Ej: 7 días" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label fw-semibold">Condición de pago</label>
                <input class="form-control" v-model.trim="form.pago" placeholder="Ej: A convenir" />
              </div>
            </div>

            <div v-if="errors._form" class="alert alert-danger mt-3 mb-0">
              {{ errors._form }}
            </div>
          </div>
        </div>
      </div>

      <!-- Col derecha: vista previa -->
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <h2 class="h6 fw-bold mb-0">Vista previa</h2>
              <span class="badge text-bg-secondary">PDF</span>
            </div>
            <div class="text-muted small mb-3">Aquí ves neto/IVA/total por ítem y totales.</div>

            <div class="border rounded-3 p-3 bg-white" style="min-height: 420px;">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="d-flex align-items-start gap-2">
                  <img :src="logoUrl" alt="XT Servicios" class="preview-logo" />
                  <div class="small">
                    <div class="text-muted">{{ emisor.direccion }}</div>
                    <div class="text-muted">RUT: {{ emisor.rut }}</div>
                  </div>
                </div>

                <div class="text-end">
                  <div class="small text-muted">{{ fmtFechaLarga(form.fecha) }}</div>
                  <div class="h6 fw-bold mt-1 mb-0">COTIZACIÓN</div>
                  <div class="small text-muted">N° (se asigna al guardar)</div>
                </div>
              </div>

              <hr />

              <div class="fw-semibold">{{ form.clienteEmpresa || "Empresa Cliente" }}</div>
              <div class="small text-muted mt-1">{{ form.textoPresentacion }}</div>

              <div class="table-responsive mt-3">
                <table class="table table-sm">
                  <thead>
                    <tr class="table-danger">
                      <th>Item</th>
                      <th class="text-end">
                        <span class="d-block">Valor</span><span class="d-block">Unitario</span>
                      </th>
                      <th class="text-end">Cantidad</th>
                      <th class="text-end">
                        <span class="d-block">Valor</span><span class="d-block">Neto</span>
                      </th>
                      <th class="text-end">IVA</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, idx) in form.items" :key="it.id + '_prev'">
                      <td class="small text-wrap">{{ it.descripcion || `Ítem ${idx + 1}` }}</td>
                      <td class="text-end small">{{ fmtCLP(it.valorUnitario || 0) }}</td>
                      <td class="text-end small">{{ it.cantidad || 0 }}</td>
                      <td class="text-end small">{{ fmtCLP(itemNeto(it)) }}</td>
                      <td class="text-end small">{{ fmtCLP(itemIva(it)) }}</td>
                      <td class="text-end small fw-semibold">{{ fmtCLP(itemTotal(it)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- ✅ Condiciones izquierda + Totales derecha (más a la derecha) -->
              <div class="mt-3 d-flex justify-content-between gap-3 small">
                <div class="text-start">
                  <div>1. Plazo de entrega: <span class="fw-semibold">{{ form.plazoEntrega }}</span></div>
                  <div>2. Validez de cotización: <span class="fw-semibold">{{ form.validez }}</span></div>
                  <div>3. Condiciones de pago: <span class="fw-semibold">{{ form.pago }}</span></div>
                </div>

                <div class="text-end totales-preview">
                  <div class="fw-semibold">Total Neto: {{ fmtCLP(totalNeto) }}</div>
                  <div class="fw-semibold">Total IVA: {{ fmtCLP(totalIva) }}</div>
                  <div class="fw-bold fs-6">TOTAL: {{ fmtCLP(totalGeneral) }}</div>
                </div>
              </div>

              <div class="mt-3 small text-center">
                <div class="fw-semibold">Cordialmente, {{ form.firmaNombre }}</div>
                <div>Teléfono: {{ form.firmaTelefono }}</div>
                <div>Mail: {{ form.firmaEmail }}</div>
              </div>
            </div>

            <div class="alert alert-info mt-3 mb-0">
              En el PDF los títulos no se “pegan” y el item largo se parte en 2 líneas.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ✅ Logo
import logoUrl from "@/assets/Logo XT Servicios Transparente.png";

// 🔥 Firestore (tu ruta)
import { db, auth } from "../stores/firebase";
import { collection, addDoc, doc, runTransaction, serverTimestamp } from "firebase/firestore";

const ivaRate = 0.19;

// Datos emisor
const emisor = {
  direccion: "El Nevado 1139, Lampa",
  rut: "76.655.406-7",
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const makeItem = () => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
  descripcion: "",
  valorUnitario: 0,
  cantidad: 0,
});

const form = ref({
  fecha: todayISO(),
  clienteEmpresa: "Xtreme Mining",
  textoPresentacion:
    "En atención a su gentil solicitud de cotización, tenemos el agrado de hacer llegar a usted nuestra propuesta:",
  items: [makeItem()],
  plazoEntrega: "2 días hábiles",
  validez: "7 días",
  pago: "A convenir",
  firmaNombre: "Guillermo Manzor",
  firmaTelefono: "+56954146017",
  firmaEmail: "gmanzor@xtrememining.cl",
});

const saving = ref(false);
const errors = ref({});

// Helpers
function roundCLP(n) {
  return Math.round(Number(n || 0));
}
function fmtCLP(value) {
  const n = roundCLP(value);
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}
function fmtFechaLarga(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Cálculos por ítem
function itemNeto(it) {
  const unit = roundCLP(it.valorUnitario);
  const qty = roundCLP(it.cantidad);
  return roundCLP(unit * qty);
}
function itemIva(it) {
  return roundCLP(itemNeto(it) * ivaRate);
}
function itemTotal(it) {
  return roundCLP(itemNeto(it) + itemIva(it));
}

// Totales
const totalNeto = computed(() => form.value.items.reduce((acc, it) => acc + itemNeto(it), 0));
const totalIva = computed(() => form.value.items.reduce((acc, it) => acc + itemIva(it), 0));
const totalGeneral = computed(() => roundCLP(totalNeto.value + totalIva.value));

// Items
function addItem() {
  form.value.items.push(makeItem());
}
function removeItem(idx) {
  if (form.value.items.length <= 1) return;
  form.value.items.splice(idx, 1);
}

// Reset
function resetForm() {
  errors.value = {};
  form.value = {
    fecha: todayISO(),
    clienteEmpresa: "Xtreme Mining",
    textoPresentacion:
      "En atención a su gentil solicitud de cotización, tenemos el agrado de hacer llegar a usted nuestra propuesta:",
    items: [makeItem()],
    plazoEntrega: "2 días hábiles",
    validez: "7 días",
    pago: "A convenir",
    firmaNombre: "Guillermo Manzor",
    firmaTelefono: "+56954146017",
    firmaEmail: "gmanzor@xtrememining.cl",
  };
}

// Validación
function validate() {
  const e = {};
  if (!form.value.fecha) e._form = "Debes seleccionar una fecha.";
  if (!form.value.clienteEmpresa?.trim()) e._form = "Debes ingresar la empresa cliente.";

  const hasAtLeastOneValidItem = form.value.items.some(
    (it) =>
      String(it.descripcion || "").trim() &&
      roundCLP(it.valorUnitario) > 0 &&
      roundCLP(it.cantidad) > 0
  );

  if (!hasAtLeastOneValidItem) {
    e._form = "Debes ingresar al menos 1 ítem con descripción, valor unitario y cantidad mayor a 0.";
  }

  form.value.items.forEach((it, idx) => {
    if (!String(it.descripcion || "").trim()) e[`item_desc_${idx}`] = "Ingresa descripción.";
  });

  errors.value = e;
  return Object.keys(e).length === 0;
}

// Correlativo
async function getNextNumeroCotizacion() {
  const counterRef = doc(db, "counters", "cotizaciones");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    let n = 1;
    if (snap.exists()) n = Number((snap.data() || {}).next || 1);
    tx.set(counterRef, { next: n + 1 }, { merge: true });
    return n;
  });
}

// Guardar + PDF
async function guardarYGenerar() {
  if (saving.value) return;
  errors.value = {};
  if (!validate()) return;

  saving.value = true;
  try {
    const numero = await getNextNumeroCotizacion();

    const itemsComputed = form.value.items
      .filter((it) => String(it.descripcion || "").trim())
      .map((it) => ({
        descripcion: String(it.descripcion || "").trim(),
        valorUnitario: roundCLP(it.valorUnitario),
        cantidad: roundCLP(it.cantidad),
        neto: itemNeto(it),
        iva: itemIva(it),
        total: itemTotal(it),
      }));

    const user = auth?.currentUser || null;

    const payload = {
      tipo: "cotizacion",
      numero,
      fecha: form.value.fecha,
      emisor: { ...emisor },
      cliente: {
        empresa: form.value.clienteEmpresa.trim(),
        textoPresentacion: form.value.textoPresentacion.trim(),
      },
      condiciones: {
        plazoEntrega: form.value.plazoEntrega.trim(),
        validez: form.value.validez.trim(),
        pago: form.value.pago.trim(),
      },
      firma: {
        nombre: form.value.firmaNombre.trim(),
        telefono: form.value.firmaTelefono.trim(),
        email: form.value.firmaEmail.trim(),
      },
      ivaRate,
      items: itemsComputed,
      totales: {
        neto: totalNeto.value,
        iva: totalIva.value,
        total: totalGeneral.value,
      },
      createdAt: serverTimestamp(),
      createdBy: user ? { uid: user.uid, email: user.email || null } : null,
    };

    await addDoc(collection(db, "cotizaciones"), payload);

    const pdfBytes = await buildPdf(payload);
    downloadPdf(pdfBytes, `Cotizacion-${String(numero).padStart(3, "0")}.pdf`);
  } catch (err) {
    console.error(err);
    errors.value = { _form: "Ocurrió un error al guardar/generar PDF. Revisa la consola." };
  } finally {
    saving.value = false;
  }
}

// -------- PDF helpers: wrap por ancho real (2 líneas máximo) --------
function wrapTextByWidth(text, font, fontSize, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
    if (lines.length >= 2) break;
  }

  if (lines.length < 2 && line) lines.push(line);

  // si aún queda mucho texto, agrega "…" al final de la 2da línea
  if (words.length && lines.length === 2) {
    const joined = lines.join(" ");
    if (joined.length < String(text || "").length) {
      const s = lines[1];
      lines[1] = s.length > 1 ? (s.slice(0, Math.max(1, s.length - 1)) + "…") : "…";
    }
  }

  return lines;
}

async function buildPdf(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const M = 24;
  const rightM = 10; // ✅ menos margen derecho para “correr” totales más a la derecha
  let y = height - M;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.35, 0.35, 0.35);
  const red = rgb(0.82, 0.10, 0.10);

  // Logo
  const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
  const logoPng = await pdfDoc.embedPng(logoBytes);

  const logoW = 170;
  const logoH = (logoPng.height / logoPng.width) * logoW;

  page.drawImage(logoPng, { x: M, y: y - logoH, width: logoW, height: logoH });

  const emitterX = M + logoW + 14;
  page.drawText(data.emisor.direccion, { x: emitterX, y: y - 18, size: 10, font, color: gray });
  page.drawText(`RUT: ${data.emisor.rut}`, { x: emitterX, y: y - 32, size: 10, font, color: gray });

  const numStr = String(data.numero).padStart(3, "0");
  page.drawText(fmtFechaLarga(data.fecha), { x: width - rightM - 140, y: y - 10, size: 10, font, color: gray });
  page.drawText(`COTIZACIÓN N° - ${numStr}`, { x: width - rightM - 240, y: y - 28, size: 14, font: fontBold, color: black });

  y = y - Math.max(logoH, 44) - 10;

  page.drawLine({
    start: { x: M, y },
    end: { x: width - rightM, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;

  page.drawText(data.cliente.empresa || "Empresa", { x: M, y, size: 12, font: fontBold, color: black });
  y -= 14;

  // presentación (wrap simple por caracteres)
  const pres = String(data.cliente.textoPresentacion || "");
  const presLines = [];
  const maxChars = 100;
  for (let i = 0; i < pres.length; i += maxChars) presLines.push(pres.slice(i, i + maxChars));
  for (const line of presLines) {
    page.drawText(line, { x: M, y, size: 10, font, color: gray });
    y -= 12;
  }
  y -= 6;

  // ✅ Tabla centrada + encabezados SIN pegarse + item con 2 líneas
  const tableW = width - 2 * 46;
  const tableX = (width - tableW) / 2;

  const headerH = 28; // ✅ más alto para títulos en 2 líneas
  const rowH = 30;    // ✅ más alto para item en 2 líneas
  const headerSize = 9.2;
  const bodySize = 9.4;

  const col = {
    item: Math.floor(tableW * 0.38),
    unit: Math.floor(tableW * 0.15),
    qty:  Math.floor(tableW * 0.08),
    neto: Math.floor(tableW * 0.14),
    iva:  Math.floor(tableW * 0.10),
    total: tableW - (
      Math.floor(tableW * 0.38) +
      Math.floor(tableW * 0.15) +
      Math.floor(tableW * 0.08) +
      Math.floor(tableW * 0.14) +
      Math.floor(tableW * 0.10)
    ),
  };

  // Header rojo
  page.drawRectangle({ x: tableX, y: y - headerH, width: tableW, height: headerH, color: red });

  // Encabezados en 2 líneas donde corresponde
  const headers = [
    { key: "item",  lines: ["Item"] },
    { key: "unit",  lines: ["Valor", "Unitario"] },
    { key: "qty",   lines: ["Cantidad"] },
    { key: "neto",  lines: ["Valor", "Neto"] },
    { key: "iva",   lines: ["IVA"] },
    { key: "total", lines: ["Total"] },
  ];

  let cx = tableX;
  for (const h of headers) {
    const w = col[h.key];
    const lines = h.lines;
    const baseY = y - 12;

    if (lines.length === 1) {
      page.drawText(lines[0], { x: cx + 6, y: baseY, size: headerSize, font: fontBold, color: rgb(1, 1, 1) });
    } else {
      page.drawText(lines[0], { x: cx + 6, y: baseY + 5, size: headerSize, font: fontBold, color: rgb(1, 1, 1) });
      page.drawText(lines[1], { x: cx + 6, y: baseY - 7, size: headerSize, font: fontBold, color: rgb(1, 1, 1) });
    }

    cx += w;
    page.drawLine({
      start: { x: cx, y: y - headerH },
      end: { x: cx, y },
      thickness: 0.6,
      color: rgb(1, 1, 1),
    });
  }
  y -= headerH;

  const maxBottom = 220; // reserva para condiciones/totales/firma

  for (const it of data.items) {
    if (y - rowH < maxBottom) break;

    // línea superior fila
    page.drawLine({
      start: { x: tableX, y },
      end: { x: tableX + tableW, y },
      thickness: 0.6,
      color: rgb(0.85, 0.85, 0.85),
    });

    const vals = {
      item: it.descripcion,
      unit: fmtCLP(it.valorUnitario),
      qty: String(it.cantidad),
      neto: fmtCLP(it.neto),
      iva: fmtCLP(it.iva),
      total: fmtCLP(it.total),
    };

    cx = tableX;

    // ✅ item wrap (hasta 2 líneas por ancho real)
    const itemMaxW = col.item - 12;
    const itemLines = wrapTextByWidth(vals.item, font, bodySize, itemMaxW);

    // línea 1
    page.drawText(itemLines[0] || "", { x: cx + 6, y: y - 13, size: bodySize, font, color: black });
    // línea 2 (si existe)
    if (itemLines[1]) {
      page.drawText(itemLines[1], { x: cx + 6, y: y - 24, size: bodySize, font, color: black });
    }

    cx += col.item;

    const rightCell = (txt, w) => {
      const str = String(txt || "");
      const textWidth = font.widthOfTextAtSize(str, bodySize);
      page.drawText(str, { x: cx + w - 6 - textWidth, y: y - 18, size: bodySize, font, color: black });
      cx += w;
    };

    rightCell(vals.unit, col.unit);
    rightCell(vals.qty, col.qty);
    rightCell(vals.neto, col.neto);
    rightCell(vals.iva, col.iva);
    rightCell(vals.total, col.total);

    y -= rowH;
  }

  // línea final tabla
  page.drawLine({
    start: { x: tableX, y },
    end: { x: tableX + tableW, y },
    thickness: 0.8,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Bloque inferior fijo
  const signatureY = 55;
  const blocksTopY = 155;

  // Condiciones (izquierda)
  page.drawText(`1. Plazo de entrega: ${data.condiciones.plazoEntrega}`, { x: M, y: blocksTopY, size: 10.5, font, color: black });
  page.drawText(`2. Validez de cotización: ${data.condiciones.validez}`, { x: M, y: blocksTopY - 14, size: 10.5, font, color: black });
  page.drawText(`3. Condiciones de pago: ${data.condiciones.pago}`, { x: M, y: blocksTopY - 28, size: 10.5, font, color: black });

  // ✅ Totales (más a la derecha)
  const boxW = 220;
  const boxX = width - rightM - boxW;

  page.drawText(`Total Neto: ${fmtCLP(data.totales.neto)}`, { x: boxX, y: blocksTopY, size: 10.5, font: fontBold, color: black });
  page.drawText(`Total IVA: ${fmtCLP(data.totales.iva)}`, { x: boxX, y: blocksTopY - 14, size: 10.5, font: fontBold, color: black });
  page.drawText(`TOTAL: ${fmtCLP(data.totales.total)}`, { x: boxX, y: blocksTopY - 32, size: 13, font: fontBold, color: black });

  // Firma (centrada)
  const centerX = width / 2;
  const drawCentered = (txt, yy, size, bold = false, color = gray) => {
    const f = bold ? fontBold : font;
    const w = f.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: centerX - w / 2, y: yy, size, font: f, color });
  };

  drawCentered(`Cordialmente, ${data.firma.nombre}`, signatureY + 24, 11, true, black);
  drawCentered(`Teléfono: ${data.firma.telefono}`, signatureY + 10, 10, false, gray);
  drawCentered(`Mail: ${data.firma.email}`, signatureY - 4, 10, false, gray);

  return await pdfDoc.save();
}

function downloadPdf(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.card { border-radius: 1rem; }
.table > :not(caption) > * > * { vertical-align: middle; }

.preview-logo{
  width: 120px;
  height: auto;
  object-fit: contain;
}

/* ✅ Tabla centrada en el formulario */
.table-center{
  max-width: 980px;
  margin: 0 auto;
}
.table-fixed{
  width: 100%;
}

/* ✅ Resumen a la derecha */
.resumen-form{
  min-width: 260px;
}

/* ✅ Totales más a la derecha en vista previa */
.totales-preview{
  min-width: 220px;
  padding-left: 28px; /* empuja más hacia la derecha visualmente */
  margin-left: auto;
}
</style>
